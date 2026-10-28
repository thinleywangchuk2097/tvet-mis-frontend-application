// TutorsDetailsReport.jsx
// SES centre tutor report: the centre's own tutors (same data as the Tutor page),
// with filters, search, pagination and Excel export (same pattern as InstituteReportIndex).
import { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Divider,
  TablePagination,
  CircularProgress,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import TutorService from "../../../api/services/internal/ses-center/TutorService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";
import TuitionAnnouncementService from "../../../api/services/internal/ses-center/TuitionAnnouncementService";
import CommonService from "../../../api/services/internal/common/CommonService";

// Same status ids as the Tutor page
const STATUS_LIST = [
  { id: 1, name: "Active", color: "success" },
  { id: 2, name: "Inactive", color: "error" },
];

// Experience bands for the filter
const EXPERIENCE_BANDS = [
  { id: "0-2", name: "0 – 2 years", min: 0, max: 2 },
  { id: "3-5", name: "3 – 5 years", min: 3, max: 5 },
  { id: "6-10", name: "6 – 10 years", min: 6, max: 10 },
  { id: "11+", name: "More than 10 years", min: 11, max: Infinity },
];

// Compact bordered table (same look as the other reports/checklists)
const TABLE_STYLE = {
  borderCollapse: "collapse",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    py: 0.5,
    px: 1,
    fontSize: "0.8rem",
    lineHeight: 1.3,
    verticalAlign: "middle",
  },
  "& th": {
    py: 0.75,
    fontWeight: 600,
    color: "text.secondary",
    textTransform: "uppercase",
    fontSize: "0.72rem",
    letterSpacing: 0.4,
    bgcolor: "#fafafa",
    whiteSpace: "nowrap",
  },
};

const isError = (res) => res instanceof Error || res?.isAxiosError;
const listOf = (res) =>
  !isError(res) && Array.isArray(res?.data) ? res.data : [];

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TutorsDetailsReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    qualificationId: "",
    subjectId: "",
    experience: "",
    statusId: "",
    search: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [detailsRes, qualRes] = await Promise.all([
          InstituteRegistrationService.getInstituteDetails(registration_no),
          CommonService.getByParentId(18),
        ]);
        setQualifications(listOf(qualRes));

        const instituteId = listOf(detailsRes)[0]?.institute_id;
        if (!instituteId) {
          toast.error("Centre details not found");
          return;
        }

        const [tutorRes, subjectRes, annRes] = await Promise.all([
          TutorService.getAllTutors(instituteId, access_token),
          SubjectService.getAllSubjects(instituteId, access_token),
          TuitionAnnouncementService.getAllTuitionAnnouncement(
            instituteId,
            access_token,
          ),
        ]);
        setTutors(listOf(tutorRes));
        setSubjects(listOf(subjectRes));
        setAnnouncements(listOf(annRes));
      } catch (error) {
        console.error("Error loading tutor report:", error);
        toast.error("Failed to load tutor data");
      } finally {
        setLoading(false);
      }
    };
    if (registration_no) load();
  }, [registration_no, access_token]);

  // ---------- lookups ----------
  const qualificationName = (id) =>
    qualifications.find((q) => String(q.id) === String(id))?.name || "";
  const subjectName = (id) => {
    const s = subjects.find((x) => String(x.id) === String(id));
    return s ? s.subject_name || s.subject_code : "";
  };
  const statusOf = (id) =>
    STATUS_LIST.find((s) => s.id === Number(id ?? 1)) || {
      name: "—",
      color: "default",
    };

  // Subjects a tutor teaches = subjects of the tuition announcements assigned to them
  const teachingByTutor = useMemo(() => {
    const map = {};
    announcements.forEach((a) => {
      const key = String(a.tutor_id);
      if (!map[key]) map[key] = { subjectIds: new Set(), count: 0 };
      map[key].count += 1;
      if (a.subject_id !== undefined && a.subject_id !== null) {
        map[key].subjectIds.add(String(a.subject_id));
      }
    });
    return map;
  }, [announcements]);

  const rows = useMemo(
    () =>
      tutors.map((t) => {
        const teach = teachingByTutor[String(t.id)];
        return {
          id: t.id,
          name: [t.first_name, t.middle_name, t.last_name]
            .filter(Boolean)
            .join(" "),
          citizenId: t.citizen_id || "",
          email: t.email || "",
          mobileNo: t.mobile_no || "",
          qualificationId: t.qualification_id,
          specialization: t.specialization || "",
          experienceYears:
            t.experience_years !== null && t.experience_years !== undefined
              ? Number(t.experience_years)
              : null,
          hourlyRate: t.hourly_rate,
          joiningDate: t.joining_date,
          statusId: Number(t.status_id ?? 1),
          subjectIds: teach ? [...teach.subjectIds] : [],
          announcementCount: teach ? teach.count : 0,
        };
      }),
    [tutors, teachingByTutor],
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const band = EXPERIENCE_BANDS.find((b) => b.id === filters.experience);
    return rows.filter(
      (r) =>
        (filters.qualificationId === "" ||
          String(r.qualificationId) === filters.qualificationId) &&
        (filters.subjectId === "" || r.subjectIds.includes(filters.subjectId)) &&
        (!band ||
          (r.experienceYears !== null &&
            r.experienceYears >= band.min &&
            r.experienceYears <= band.max)) &&
        (filters.statusId === "" || String(r.statusId) === filters.statusId) &&
        (q === "" ||
          r.name.toLowerCase().includes(q) ||
          r.citizenId.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.specialization.toLowerCase().includes(q)),
    );
  }, [rows, filters]);

  const paginatedRows = filteredRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      qualificationId: "",
      subjectId: "",
      experience: "",
      statusId: "",
      search: "",
    });
    setPage(0);
  };

  const today = new Date().toISOString().split("T")[0];

  // Excel export of the filtered rows (all pages)
  const handleExcelExport = () => {
    const data = filteredRows.map((r, index) => ({
      SlNo: index + 1,
      Name: r.name,
      CitizenID: r.citizenId,
      Qualification: qualificationName(r.qualificationId),
      Specialization: r.specialization,
      ExperienceYears: r.experienceYears ?? "",
      HourlyRate: r.hourlyRate ?? "",
      Subjects: r.subjectIds.map(subjectName).filter(Boolean).join(", "),
      TuitionAnnouncements: r.announcementCount,
      MobileNo: r.mobileNo,
      Email: r.email,
      JoiningDate: fmtDate(r.joiningDate),
      Status: statusOf(r.statusId).name,
    }));
    exportToExcel(data, `Tutors_Details_Report_${today}`);
  };

  if (loading && tutors.length === 0) {
    return (
      <Paper
        sx={{
          p: 2,
          mt: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Tutors Details Report
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Qualification</InputLabel>
            <Select
              name="qualificationId"
              value={filters.qualificationId}
              onChange={handleFilterChange}
              label="Qualification"
            >
              <MenuItem value="">All Qualifications</MenuItem>
              {qualifications.map((q) => (
                <MenuItem key={q.id} value={String(q.id)}>
                  {q.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Subject</InputLabel>
            <Select
              name="subjectId"
              value={filters.subjectId}
              onChange={handleFilterChange}
              label="Subject"
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.subject_name || s.subject_code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Experience</InputLabel>
            <Select
              name="experience"
              value={filters.experience}
              onChange={handleFilterChange}
              label="Experience"
            >
              <MenuItem value="">All</MenuItem>
              {EXPERIENCE_BANDS.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="statusId"
              value={filters.statusId}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {STATUS_LIST.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={filteredRows.length === 0}
              fullWidth
              onClick={handleExcelExport}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Search - right aligned */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid>
          <TextField
            size="small"
            placeholder="Search by name, CID, email or specialization..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            sx={{ minWidth: 320 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Tutors Table */}
      <TableContainer>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell align="center">Experience (yrs)</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell align="center">Announcements</TableCell>
              <TableCell>Mobile No.</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((r, index) => {
                const st = statusOf(r.statusId);
                const subjectNames = r.subjectIds
                  .map(subjectName)
                  .filter(Boolean);
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{r.name || "N/A"}</TableCell>
                    <TableCell>{r.citizenId || "N/A"}</TableCell>
                    <TableCell>
                      {qualificationName(r.qualificationId) || "N/A"}
                    </TableCell>
                    <TableCell>{r.specialization || "—"}</TableCell>
                    <TableCell align="center">
                      {r.experienceYears ?? "—"}
                    </TableCell>
                    <TableCell>
                      {subjectNames.length ? subjectNames.join(", ") : "—"}
                    </TableCell>
                    <TableCell align="center">{r.announcementCount}</TableCell>
                    <TableCell>{r.mobileNo || "N/A"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {fmtDate(r.joiningDate) || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={st.color}
                        label={st.name}
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  {rows.length === 0
                    ? "No tutors added yet"
                    : "No tutors found matching your criteria"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      {filteredRows.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedRows.length} of {filteredRows.length} tutors
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ ".MuiTablePagination-displayedRows": { margin: 0 } }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default TutorsDetailsReport;
