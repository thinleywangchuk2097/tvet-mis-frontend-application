import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  alpha,
  TextField,
  MenuItem,
  Button,
  Skeleton,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/internal/common/CommonService";

// ── Look shared with the Course announcements table
const NAVY = "#0a2d6e";
const BLUE = "#1565c0";
const LINE = "#e3eaf4";
// own header colour so this table is easy to tell apart from Course announcements (navy)
const HEAD = "#00695c";

const TS = {
  "& th": {
    bgcolor: HEAD,
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.74rem",
    letterSpacing: 0.2,
    lineHeight: 1.25,
    borderBottom: "none",
    py: 1,
    px: 1.25,
  },
  "& td": {
    fontSize: "0.8rem",
    color: "#0f1f3d",
    borderBottom: `1px solid ${LINE}`,
    py: 1,
    px: 1.25,
    verticalAlign: "middle",
  },
  "& tbody tr:nth-of-type(even) td": { bgcolor: "#f8fcfb" },
  "& tbody tr:hover td": { bgcolor: "#eef7f5" },
};

// "2026-11-12" -> "12 Nov 2026"
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// course length as "7 months", "1 month 2 days" or "20 days"
const courseDuration = (start, end) => {
  if (!start || !end) return null;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null;
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  let anchor = new Date(a.getFullYear(), a.getMonth() + months, a.getDate());
  while (months > 0 && anchor > b) {
    months -= 1;
    anchor = new Date(a.getFullYear(), a.getMonth() + months, a.getDate());
  }
  const days = Math.round((b - anchor) / 86400000);
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  if (months <= 0) return plural(Math.max(days, 1), "day");
  return days > 0 ? `${plural(months, "month")} ${plural(days, "day")}` : plural(months, "month");
};

// share of the course already run (0-100), from today's date
const courseProgress = (start, end) => {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
  return Math.round(Math.min(100, Math.max(0, ((Date.now() - a) / (b - a)) * 100)));
};

// compact filter controls (search + dropdowns)
const filterSx = {
  "& .MuiOutlinedInput-root": {
    height: 34,
    fontSize: "0.8rem",
    borderRadius: 2,
    bgcolor: "#fff",
    "& fieldset": { borderColor: LINE },
    "&:hover fieldset": { borderColor: "#b9c8dc" },
    "&.Mui-focused fieldset": { borderColor: "#1565c0", borderWidth: 1 },
  },
  "& .MuiSelect-select": { py: 0, display: "flex", alignItems: "center" },
  "& input::placeholder": { fontSize: "0.8rem", opacity: 0.7 },
};

const menuItemSx = { fontSize: "0.8rem", minHeight: 32 };

const Pill = ({ label, color }) => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      px: 1,
      py: 0.25,
      borderRadius: 10,
      fontSize: "0.7rem",
      fontWeight: 600,
      color,
      bgcolor: alpha(color, 0.1),
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </Box>
);
Pill.propTypes = { label: PropTypes.node, color: PropTypes.string };

const OngoingProgramsIndex = () => {
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [progPage, setProgPage] = useState(0);
  const [progRowsPerPage, setProgRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [certificateLevelFilter, setCertificateLevelFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Dropdowns
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);

  const getCertificationLevelName = useMemo(() => {
    const levelMap = new Map();
    certificationLevels.forEach((level) => levelMap.set(parseInt(level.id), level.name));
    return (levelId) => (levelId ? levelMap.get(parseInt(levelId)) || levelId : "N/A");
  }, [certificationLevels]);

  const getDzongkhagName = useMemo(() => {
    const dzongMap = new Map();
    dzongkhags.forEach((dz) => dzongMap.set(parseInt(dz.id), dz.dzonkhagName));
    return (locationId) => (locationId ? dzongMap.get(parseInt(locationId)) || "N/A" : "N/A");
  }, [dzongkhags]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await PublicPageService.getOngoingCourses();
        if (response instanceof Error || response?.isAxiosError) throw response;
        setOngoingCourses(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching ongoing courses:", err);
        setError(true);
        setOngoingCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    CommonService.getAllCertificateLevels()
      .then((res) => setCertificationLevels(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCertificationLevels([]));
    CommonService.getAllDzongkhags()
      .then((res) => setDzongkhags(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setDzongkhags([]));
  }, []);

  const filteredCourses = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return ongoingCourses.filter((course) => {
      const matchesSearch =
        !q ||
        course.course_name?.toLowerCase().includes(q) ||
        course.institute_name?.toLowerCase().includes(q);
      const matchesLevel = certificateLevelFilter
        ? parseInt(course.certification_level_id) === parseInt(certificateLevelFilter)
        : true;
      const matchesLocation = locationFilter
        ? parseInt(course.training_location_id) === parseInt(locationFilter)
        : true;
      return matchesSearch && matchesLevel && matchesLocation;
    });
  }, [searchText, certificateLevelFilter, locationFilter, ongoingCourses]);

  const totalTrainees = useMemo(
    () => filteredCourses.reduce((s, c) => s + (Number(c.total_no_trainees) || 0), 0),
    [filteredCourses],
  );

  const handleReset = useCallback(() => {
    setSearchText("");
    setCertificateLevelFilter("");
    setLocationFilter("");
    setProgPage(0);
  }, []);

  return (
    <Box>
      {/* Filters: one compact row */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1.5 }}>
        <TextField
          placeholder="Search course or training provider"
          size="small"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setProgPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: "#90a4ae", fontSize: 17, mr: 0.75 }} />,
            },
          }}
          sx={{ ...filterSx, flex: { xs: "1 1 100%", sm: "0 1 320px" } }}
        />
        <TextField
          select
          size="small"
          value={certificateLevelFilter}
          onChange={(e) => {
            setCertificateLevelFilter(e.target.value);
            setProgPage(0);
          }}
          slotProps={{ select: { displayEmpty: true, MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } } }}
          sx={{ ...filterSx, width: { xs: "100%", sm: 190 } }}
        >
          <MenuItem value="" sx={menuItemSx}>
            All certificate levels
          </MenuItem>
          {certificationLevels.map((x) => (
            <MenuItem key={x.id} value={x.id} sx={menuItemSx}>
              {x.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setProgPage(0);
          }}
          slotProps={{ select: { displayEmpty: true, MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } } }}
          sx={{ ...filterSx, width: { xs: "100%", sm: 190 } }}
        >
          <MenuItem value="" sx={menuItemSx}>
            All locations
          </MenuItem>
          {dzongkhags.map((x) => (
            <MenuItem key={x.id} value={x.id} sx={menuItemSx}>
              {x.dzonkhagName}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          startIcon={<RestartAltIcon sx={{ fontSize: "16px !important" }} />}
          onClick={handleReset}
          sx={{ height: 34, px: 1.25, textTransform: "none", fontWeight: 600, fontSize: "0.78rem", color: "text.secondary", "&:hover": { color: "#1565c0", bgcolor: "transparent" } }}
        >
          Reset
        </Button>
      </Box>

      {!loading && !error && (
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1 }}>
          {filteredCourses.length} programme{filteredCourses.length === 1 ? "" : "s"} running
          {totalTrainees > 0 && ` · ${totalTrainees.toLocaleString()} trainees`}
        </Typography>
      )}

      <TableContainer sx={{ borderRadius: 2, border: `1px solid ${LINE}`, overflowX: "auto" }}>
        <Table size="small" sx={{ ...TS, minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 44 }}>#</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Course / Level</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Training Provider / Location</TableCell>
              <TableCell>Course Date</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Progress</TableCell>
              <TableCell align="center">Trainees</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton height={30} />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ fontWeight: 600, color: "text.secondary" }}>
                    Ongoing programmes could not be loaded
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    Please try again later.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredCourses.length > 0 ? (
              filteredCourses
                .slice(progPage * progRowsPerPage, progPage * progRowsPerPage + progRowsPerPage)
                .map((course, index) => {
                  const duration = courseDuration(course.course_start_date, course.course_end_date);
                  const progress = courseProgress(course.course_start_date, course.course_end_date);
                  return (
                    <TableRow key={course.application_no || index}>
                      <TableCell align="center" sx={{ color: "text.secondary" }}>
                        {progPage * progRowsPerPage + index + 1}
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: NAVY, lineHeight: 1.3 }}>
                          {course.course_name || "N/A"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
                          {getCertificationLevelName(course.certification_level_id)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", lineHeight: 1.3, mb: 0.4 }}>
                          {course.institute_name || "N/A"}
                        </Typography>
                        <Pill label={getDzongkhagName(course.training_location_id)} color="#00838f" />
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: "0.76rem" }}>
                          {formatDate(course.course_start_date)} –
                        </Typography>
                        <Typography sx={{ fontSize: "0.76rem", mb: 0.25 }}>
                          {formatDate(course.course_end_date)}
                        </Typography>
                        {duration && <Pill label={duration} color={BLUE} />}
                      </TableCell>

                      {/* how far the course has run */}
                      <TableCell>
                        {progress === null ? (
                          "—"
                        ) : (
                          <>
                            <Typography sx={{ fontSize: "0.76rem", fontVariantNumeric: "tabular-nums" }}>
                              <b>{progress}%</b>
                              <Box component="span" sx={{ color: "text.secondary" }}> complete</Box>
                            </Typography>
                            <Box sx={{ mt: 0.5, height: 5, borderRadius: 3, bgcolor: alpha(NAVY, 0.08), overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${progress}%`, borderRadius: 3, bgcolor: "#2e7d32" }} />
                            </Box>
                          </>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Typography sx={{ fontWeight: 700, color: NAVY, fontVariantNumeric: "tabular-nums" }}>
                          {course.total_no_trainees ?? "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <SearchIcon sx={{ fontSize: 34, color: "#cfd8e3" }} />
                  <Typography sx={{ fontWeight: 600, color: "text.secondary" }}>
                    No ongoing programmes found
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    Try another level or location, or reset the filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredCourses.length > 0 && (
        <TablePagination
          component="div"
          count={filteredCourses.length}
          page={progPage}
          onPageChange={(_, p) => setProgPage(p)}
          rowsPerPage={progRowsPerPage}
          onRowsPerPageChange={(e) => {
            setProgRowsPerPage(parseInt(e.target.value, 10));
            setProgPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            mt: 0.5,
            "& .MuiTablePagination-toolbar": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.75rem" },
          }}
        />
      )}
    </Box>
  );
};

export default OngoingProgramsIndex;
