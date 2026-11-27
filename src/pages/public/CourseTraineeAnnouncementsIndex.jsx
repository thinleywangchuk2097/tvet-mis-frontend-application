import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Tooltip,
  Typography,
  TablePagination,
  alpha,
  keyframes,
  Stack,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import CommonService from "../../api/services/internal/common/CommonService";

// ── Animations (optimized - keeping only essential ones)
const tableRowAnimation = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
`;

// ── Shared table styles with animation
const NAVY = "#0a2d6e";
const LINE = "#e3eaf4";

const TS = {
  "& th": {
    bgcolor: NAVY,
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
  "& tbody tr:nth-of-type(even) td": { bgcolor: "#fafcff" },
  "& tbody tr:hover td": { bgcolor: "#f1f6fd" },
};

// "2026-11-12" -> "12 Nov 2026"
const fmtDate = (d) =>
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
  // step back a month if the end day has not reached the start day yet
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

// "Closes in N days" / "Closed" tag from the application end date (none while open)
const applicationStatus = (end) => {
  if (!end) return null;
  const days = Math.ceil(
    (new Date(end).setHours(23, 59, 59) - Date.now()) / 86400000,
  );
  if (days < 0) return { label: "Closed", color: "#78909c" };
  if (days === 0) return { label: "Closes today", color: "#e65100" };
  if (days <= 7)
    return { label: `Closes in ${days} day${days > 1 ? "s" : ""}`, color: "#e65100" };
  return null; // open: no tag
};

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

// ── OPTIMIZED MOVING BANNER COMPONENT ──
const MovingAnnouncementBanner = ({ announcements, navigate }) => {
  //  ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN

  // 1. All useRef hooks
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const positionRef = useRef(0);
  const isPausedRef = useRef(false);
  const startTimeRef = useRef(null);
  // how many copies of the list are rendered; enough to always fill the banner
  const [copies, setCopies] = useState(3);

  // 3. All useMemo hooks
  const displayItems = useMemo(() => {
    if (announcements.length === 0) return [];
    return Array.from({ length: copies }, () => announcements).flat();
  }, [announcements, copies]);

  // 4. All useEffect hooks
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content || announcements.length === 0) return;

    // Width of one copy of the list
    const contentWidth = content.scrollWidth / copies;
    const containerWidth = container.clientWidth;
    if (!contentWidth) return;

    // Always scroll, also on wide screens where the list is shorter than the
    // banner: render enough copies to cover the banner plus one copy to loop.
    const needed = Math.max(3, Math.ceil(containerWidth / contentWidth) + 2);
    if (needed !== copies) {
      setCopies(needed);
      return; // re-runs with the new number of copies
    }

    // Respect "reduce motion": keep the list still
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      content.style.transform = "translateX(0)";
      return;
    }

    // FIXED SPEED - consistent regardless of data amount
    const SPEED = 50; // pixels per second

    const animate = (timestamp) => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const delta = (timestamp - startTimeRef.current) / 1000;
      startTimeRef.current = timestamp;

      positionRef.current -= SPEED * delta;

      // Reset position for seamless loop
      if (Math.abs(positionRef.current) >= contentWidth) {
        positionRef.current = 0;
      }

      content.style.transform = `translateX(${positionRef.current}px)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseEnter = () => {
      isPausedRef.current = true;
    };

    const handleMouseLeave = () => {
      isPausedRef.current = false;
      startTimeRef.current = null;
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [announcements, copies]);

  // 5.  CONDITIONAL RETURN AFTER ALL HOOKS
  if (announcements.length === 0) return null;

  // 6. Render
  return (
    <Box
      sx={{
        mb: 2.5,
        display: "flex",
        alignItems: "stretch",
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${LINE}`,
        bgcolor: "#f6f9fe",
        height: 44,
      }}
    >
      {/* fixed label */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.75,
          bgcolor: NAVY,
          color: "#fff",
          fontSize: "0.74rem",
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        <CampaignIcon sx={{ fontSize: 18, color: "#f9a825" }} />
        Now open
      </Box>

      {/* moving list (pauses on hover); faded at both edges */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 40px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 40px), transparent 100%)",
        }}
      >
        <Box
          ref={contentRef}
          sx={{ display: "inline-flex", alignItems: "center", willChange: "transform" }}
        >
          {displayItems.map((announcement, idx) => (
            <Box
              key={`${announcement.id}-${idx}`}
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.25,
                px: 2.25,
                borderRight: `1px solid ${LINE}`,
                fontSize: "0.8rem",
                color: "#0f1f3d",
              }}
            >
              <SchoolOutlinedIcon sx={{ fontSize: 17, color: "#1565c0" }} />
              <Box component="span" sx={{ fontWeight: 700, color: NAVY }}>
                {announcement.courseName}
              </Box>
              <Box component="span" sx={{ color: "#5f6f86" }}>
                {announcement.instituteName}
              </Box>
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "#5f6f86" }}
              >
                <EventOutlinedIcon sx={{ fontSize: 15 }} />
                {announcement.startDate} – {announcement.endDate}
              </Box>
              {announcement.fee ? (
                <Box component="span" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  Nu. {Number(announcement.fee).toLocaleString()}
                </Box>
              ) : null}
              <Box
                component="button"
                type="button"
                onClick={() => navigate(`/course/apply-course/${announcement.id}`)}
                sx={{
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 1.5,
                  bgcolor: "#1565c0",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  "&:hover": { bgcolor: NAVY },
                  "&:focus-visible": { outline: "2px solid #f9a825", outlineOffset: 2 },
                }}
              >
                Apply
                <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ── MAIN COMPONENT ──
// RPL re-assessment (41) appears only in the RPL view, not in the general list
const RPL_ONLY_SERVICE_IDS = ["41"];

// serviceIds: show only these services (e.g. RPL: [39, 41]); onClearServiceFilter: back to all
const CourseTraineeAnnouncementsIndex = ({
  serviceIds = null,
  serviceFilterLabel = "",
  onClearServiceFilter = null,
}) => {
  const navigate = useNavigate();
  const [appPage, setAppPage] = useState(0);
  const [appRowsPerPage, setAppRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [courseDateFilter, setCourseDateFilter] = useState("");
  const [courseAnnouncementDetails, setCourseAnnouncementDetails] = useState(
    [],
  );

  // Dropdown states
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);

  useEffect(() => {
    fetchCourseAnnouncementDetails();
    fetchDropdownData();
    fetchDzongkhags();
  }, []);

  const fetchCourseAnnouncementDetails = async () => {
    try {
      const response = await CommonService.getAllCourseAnnouncement();
      setCourseAnnouncementDetails(
        Array.isArray(response?.data) ? response.data : [],
      );
    } catch (error) {
      console.error("Error fetching course announcements:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const levelsResponse = await CommonService.getAllCertificateLevels();
      setCertificationLevels(
        Array.isArray(levelsResponse?.data) ? levelsResponse.data : [],
      );

      const fundingResponse = await CommonService.getByParentId(16);
      setFundingSources(
        Array.isArray(fundingResponse?.data) ? fundingResponse.data : [],
      );
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(
        Array.isArray(dzongkhagLists?.data) ? dzongkhagLists.data : [],
      );
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  // Create moving announcements from actual course data (memoized)
  const movingAnnouncements = useMemo(() => {
    if (!courseAnnouncementDetails.length) return [];

    return courseAnnouncementDetails.slice(0, 15).map((course) => ({
      id: course.application_no,
      courseName: course.course_name || "Course",
      instituteName: course.institute_name || "Institute",
      startDate: course.course_start_date
        ? new Date(course.course_start_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "TBA",
      endDate: course.course_end_date
        ? new Date(course.course_end_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "TBA",
      location: course.training_location_id,
      fee: course.course_fee,
    }));
  }, [courseAnnouncementDetails]);

  // Memoized helper functions with Map for O(1) lookups
  const getCertificationLevelName = useMemo(() => {
    const levelMap = new Map();
    certificationLevels.forEach((level) => {
      levelMap.set(parseInt(level.id), level.name);
    });
    return (levelId) => {
      if (!levelId) return "N/A";
      return levelMap.get(parseInt(levelId)) || levelId;
    };
  }, [certificationLevels]);

  const getFundingSourceName = useMemo(() => {
    const sourceMap = new Map();
    fundingSources.forEach((source) => {
      sourceMap.set(parseInt(source.id), source.name);
    });
    return (sourceId) => {
      if (!sourceId) return "N/A";
      return sourceMap.get(parseInt(sourceId)) || sourceId;
    };
  }, [fundingSources]);

  const getDzongkhagName = useMemo(() => {
    const dzongMap = new Map();
    dzongkhags.forEach((dzong) => {
      dzongMap.set(parseInt(dzong.id), dzong.dzonkhagName);
    });
    return (locationId) => {
      if (!locationId) return "N/A";
      return dzongMap.get(parseInt(locationId)) || "N/A";
    };
  }, [dzongkhags]);

  const courseDates = useMemo(() => {
    const dates = courseAnnouncementDetails.map(
      (app) => app.course_start_date?.split(" ")[0],
    );
    return [...new Set(dates)].filter((date) => date);
  }, [courseAnnouncementDetails]);

  const filteredApplications = useMemo(() => {
    const wanted = serviceIds ? serviceIds.map(String) : null;
    return courseAnnouncementDetails.filter((app) => {
      const service = String(app.service_id);
      const matchesService = wanted
        ? wanted.includes(service)
        : !RPL_ONLY_SERVICE_IDS.includes(service);
      if (!matchesService) return false;

      const courseStartDate = app.course_start_date?.split(" ")[0] || "";

      const matchesSearch =
        app.application_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.course_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.institute_name?.toLowerCase().includes(searchText.toLowerCase());

      const matchesLocation = locationFilter
        ? parseInt(app.training_location_id) === parseInt(locationFilter)
        : true;

      const matchesCourseDate = courseDateFilter
        ? courseStartDate === courseDateFilter
        : true;

      return matchesSearch && matchesLocation && matchesCourseDate;
    });
  }, [
    searchText,
    locationFilter,
    courseDateFilter,
    courseAnnouncementDetails,
    serviceIds,
  ]);

  // back to the first page when the service filter changes
  useEffect(() => {
    setAppPage(0);
  }, [serviceIds]);

  const handleReset = useCallback(() => {
    setSearchText("");
    setLocationFilter("");
    setCourseDateFilter("");
    setAppPage(0);
  }, []);

  return (
    <Paper elevation={0} sx={{ p: 0, bgcolor: "transparent" }}>
      {/* Moving Announcements Banner - OPTIMIZED */}
      <MovingAnnouncementBanner
        announcements={movingAnnouncements}
        navigate={navigate}
      />

      {/* RPL (or other service) view: what is shown + a way back to all courses */}
      {serviceIds && (
        <Alert
          severity="info"
          sx={{ mb: 2, alignItems: "center" }}
          action={
            onClearServiceFilter && (
              <Button
                size="small"
                color="inherit"
                onClick={onClearServiceFilter}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Show all courses
              </Button>
            )
          }
        >
          Showing {serviceFilterLabel || "selected"} announcements only.
        </Alert>
      )}

      {/* Filters: one compact row */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1.5 }}>
        <TextField
          placeholder="Search application no, course, provider"
          size="small"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setAppPage(0);
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
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setAppPage(0);
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
        <TextField
          select
          size="small"
          value={courseDateFilter}
          onChange={(e) => {
            setCourseDateFilter(e.target.value);
            setAppPage(0);
          }}
          slotProps={{ select: { displayEmpty: true, MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } } }}
          sx={{ ...filterSx, width: { xs: "100%", sm: 190 } }}
        >
          <MenuItem value="" sx={menuItemSx}>
            All course start dates
          </MenuItem>
          {courseDates.map((d) => ({ id: d })).map((x) => (
            <MenuItem key={x.id} value={x.id} sx={menuItemSx}>
              {fmtDate(x.id)}
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

      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1 }}>
        {filteredApplications.length} course
        {filteredApplications.length === 1 ? "" : "s"} open for application
      </Typography>

      {/* Table: related details grouped so it reads at a glance */}
      <TableContainer
        sx={{ borderRadius: 2, border: `1px solid ${LINE}`, overflowX: "auto" }}
      >
        <Table size="small" sx={{ ...TS, minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 44 }}>#</TableCell>
              <TableCell align="center">Action</TableCell>
              <TableCell sx={{ minWidth: 155 }}>Course</TableCell>
              <TableCell>Type / Level</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Description</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Training Provider / Location</TableCell>
              <TableCell>Funding</TableCell>
              <TableCell align="right">Course Fee</TableCell>
              <TableCell>Application Date</TableCell>
              <TableCell>Course Date</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Entry Requirement</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Seats</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredApplications.length > 0 ? (
              filteredApplications
                .slice(
                  appPage * appRowsPerPage,
                  appPage * appRowsPerPage + appRowsPerPage,
                )
                .map((app, index) => {
                  const status = applicationStatus(app.application_end_date);
                  const capacity = Number(app.enrollment_capacity) || 0;
                  const applied = Number(app.total_applied) || 0;
                  const fill = capacity ? Math.min(100, (applied / capacity) * 100) : 0;
                  return (
                    <TableRow
                      key={app.application_no}
                      sx={{
                        animation: `${tableRowAnimation} 0.3s ease-out ${index * 0.04}s both`,
                      }}
                    >
                      <TableCell align="center" sx={{ color: "text.secondary" }}>
                        {appPage * appRowsPerPage + index + 1}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          disableElevation
                          endIcon={<ArrowForwardIcon sx={{ fontSize: "16px !important" }} />}
                          disabled={status?.label === "Closed"}
                          onClick={() => navigate(`/course/apply-course/${app.application_no}`)}
                          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap", px: 1.5 }}
                        >
                          Apply
                        </Button>
                      </TableCell>

                      {/* course name and application no */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: NAVY, lineHeight: 1.3 }}>
                          {app.course_name || "N/A"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#90a4ae", mt: 0.4, fontVariantNumeric: "tabular-nums" }}>
                          Application No: {app.application_no}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem" }}>
                          {app.announcement_type || "N/A"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
                          {getCertificationLevelName(app.certification_level_id)}
                        </Typography>
                      </TableCell>

                      {/* description: 3 lines, full text on hover */}
                      <TableCell sx={{ maxWidth: 240 }}>
                        {app.course_description ? (
                          <Tooltip title={app.course_description} arrow placement="bottom-start">
                            <Typography
                              sx={{
                                fontSize: "0.76rem",
                                color: "text.secondary",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {app.course_description}
                            </Typography>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", lineHeight: 1.3, mb: 0.4 }}>
                          {app.institute_name || "N/A"}
                        </Typography>
                        <Pill label={getDzongkhagName(app.training_location_id)} color="#00838f" />
                      </TableCell>
                      <TableCell>
                        <Pill label={getFundingSourceName(app.funding_source_id)} color="#2e7d32" />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {app.fees_per_trainee != null
                          ? `Nu. ${Number(app.fees_per_trainee).toLocaleString()}`
                          : "—"}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: "0.76rem" }}>
                          {fmtDate(app.application_start_date)} –
                        </Typography>
                        <Typography sx={{ fontSize: "0.76rem", mb: 0.25 }}>
                          {fmtDate(app.application_end_date)}
                        </Typography>
                        {status && <Pill label={status.label} color={status.color} />}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: "0.76rem" }}>
                          {fmtDate(app.course_start_date)} –
                        </Typography>
                        <Typography sx={{ fontSize: "0.76rem", mb: 0.25 }}>
                          {fmtDate(app.course_end_date)}
                        </Typography>
                        {courseDuration(app.course_start_date, app.course_end_date) && (
                          <Pill
                            label={courseDuration(app.course_start_date, app.course_end_date)}
                            color="#1565c0"
                          />
                        )}
                      </TableCell>

                      <TableCell sx={{ fontSize: "0.76rem !important", maxWidth: 240 }}>
                        {app.entry_requirement || "—"}
                      </TableCell>

                      {/* applied of capacity, with a fill bar */}
                      <TableCell>
                        <Typography sx={{ fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }}>
                          <b>{applied}</b>
                          <Box component="span" sx={{ color: "text.secondary" }}> / {capacity || "—"} applied</Box>
                        </Typography>
                        <Box sx={{ mt: 0.5, height: 5, borderRadius: 3, bgcolor: alpha(NAVY, 0.08), overflow: "hidden" }}>
                          <Box
                            sx={{
                              height: "100%",
                              width: `${fill}%`,
                              borderRadius: 3,
                              bgcolor: fill >= 100 ? "#c62828" : "#1565c0",
                            }}
                          />
                        </Box>
                      </TableCell>

                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 5 }}>
                  <SearchIcon sx={{ fontSize: 34, color: "#cfd8e3" }} />
                  <Typography sx={{ fontWeight: 600, color: "text.secondary" }}>
                    No course announcements found
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    Try another location or date, or reset the filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredApplications.length > 0 && (
        <TablePagination
          component="div"
          count={filteredApplications.length}
          page={appPage}
          onPageChange={(e, newPage) => setAppPage(newPage)}
          rowsPerPage={appRowsPerPage}
          onRowsPerPageChange={(e) => {
            setAppRowsPerPage(parseInt(e.target.value, 10));
            setAppPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            mt: 0.5,
            "& .MuiTablePagination-toolbar": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "0.75rem" },
          }}
        />
      )}
    </Paper>
  );
};

CourseTraineeAnnouncementsIndex.propTypes = {
  serviceIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  serviceFilterLabel: PropTypes.string,
  onClearServiceFilter: PropTypes.func,
};

export default CourseTraineeAnnouncementsIndex;
