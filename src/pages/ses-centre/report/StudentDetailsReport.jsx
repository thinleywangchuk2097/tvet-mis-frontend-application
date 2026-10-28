// StudentDetailsReport.jsx
// SES centre student report: the centre's own students (same data as Add Student),
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
import StudentService from "../../../api/services/internal/ses-center/StudentService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";
import CommonService from "../../../api/services/internal/common/CommonService";

// Same status ids as the Add Student page
const STATUS_LIST = [
  { id: 1, name: "Active", color: "success" },
  { id: 2, name: "Inactive", color: "error" },
  { id: 3, name: "Graduated", color: "info" },
  { id: 4, name: "Suspended", color: "warning" },
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

const parseSubjects = (raw) => {
  if (!raw) return [];
  try {
    const list = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const StudentDetailsReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [genders, setGenders] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    currentClass: "",
    genderId: "",
    statusId: "",
    subjectId: "",
    search: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [detailsRes, genderRes, dzRes] = await Promise.all([
          InstituteRegistrationService.getInstituteDetails(registration_no),
          CommonService.getByParentId(8),
          CommonService.getAllDzongkhags(),
        ]);
        setGenders(listOf(genderRes));
        setDzongkhags(listOf(dzRes));

        const instituteId = listOf(detailsRes)[0]?.institute_id;
        if (!instituteId) {
          toast.error("Centre details not found");
          return;
        }

        const [studentRes, subjectRes] = await Promise.all([
          StudentService.getAllStudents(instituteId, access_token),
          SubjectService.getAllSubjects(instituteId, access_token),
        ]);
        setStudents(listOf(studentRes));
        setSubjects(listOf(subjectRes));
      } catch (error) {
        console.error("Error loading student report:", error);
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };
    if (registration_no) load();
  }, [registration_no, access_token]);

  // ---------- lookups ----------
  const genderName = (id) =>
    genders.find((g) => String(g.id) === String(id))?.name || "";
  const dzongkhagName = (id) =>
    dzongkhags.find((d) => String(d.id) === String(id))?.dzonkhagName || "";
  const subjectName = (id) => {
    const s = subjects.find((x) => String(x.id) === String(id));
    return s ? s.subject_name || s.subject_code : "";
  };
  const statusOf = (id) =>
    STATUS_LIST.find((s) => s.id === Number(id ?? 1)) || {
      name: "—",
      color: "default",
    };

  // Normalised rows used by the table and the export
  const rows = useMemo(
    () =>
      students.map((s) => {
        const subjectIds = parseSubjects(s.subjects)
          .map((x) => x.subjectId ?? x.subject_id)
          .filter((x) => x !== undefined && x !== null);
        return {
          id: s.id,
          studentCode: s.student_code || "",
          name: [s.first_name, s.middle_name, s.last_name]
            .filter(Boolean)
            .join(" "),
          citizenId: s.citizen_id || "",
          genderId: s.gender_id,
          dob: s.date_of_birth,
          currentClass: s.current_class || "",
          schoolName: s.school_name || "",
          mobileNo: s.mobile_no || "",
          email: s.email || "",
          dzongkhagId: s.dzongkhag_id,
          exactLocation: s.exact_location || "",
          emergencyName: s.emergency_contact_name || "",
          emergencyNo: s.emergency_contact_no || "",
          enrollmentDate: s.enrollment_date || s.created_at,
          statusId: Number(s.status_id ?? 1),
          subjectIds: subjectIds.map(String),
        };
      }),
    [students],
  );

  const classOptions = useMemo(
    () =>
      [...new Set(rows.map((r) => r.currentClass).filter(Boolean))].sort(
        (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }),
      ),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filters.currentClass === "" || r.currentClass === filters.currentClass) &&
        (filters.genderId === "" || String(r.genderId) === filters.genderId) &&
        (filters.statusId === "" || String(r.statusId) === filters.statusId) &&
        (filters.subjectId === "" || r.subjectIds.includes(filters.subjectId)) &&
        (q === "" ||
          r.name.toLowerCase().includes(q) ||
          r.studentCode.toLowerCase().includes(q) ||
          r.citizenId.toLowerCase().includes(q) ||
          r.schoolName.toLowerCase().includes(q)),
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
      currentClass: "",
      genderId: "",
      statusId: "",
      subjectId: "",
      search: "",
    });
    setPage(0);
  };

  const today = new Date().toISOString().split("T")[0];

  // Excel export of the filtered rows (all pages)
  const handleExcelExport = () => {
    const data = filteredRows.map((r, index) => ({
      SlNo: index + 1,
      StudentCode: r.studentCode,
      Name: r.name,
      CitizenID: r.citizenId,
      Gender: genderName(r.genderId),
      DateOfBirth: fmtDate(r.dob),
      Class: r.currentClass,
      School: r.schoolName,
      Subjects: r.subjectIds.map(subjectName).filter(Boolean).join(", "),
      MobileNo: r.mobileNo,
      Email: r.email,
      Dzongkhag: dzongkhagName(r.dzongkhagId),
      Location: r.exactLocation,
      EmergencyContact: r.emergencyName,
      EmergencyContactNo: r.emergencyNo,
      EnrollmentDate: fmtDate(r.enrollmentDate),
      Status: statusOf(r.statusId).name,
    }));
    exportToExcel(data, `Student_Details_Report_${today}`);
  };

  if (loading && students.length === 0) {
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
        Student Details Report
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Class</InputLabel>
            <Select
              name="currentClass"
              value={filters.currentClass}
              onChange={handleFilterChange}
              label="Class"
            >
              <MenuItem value="">All Classes</MenuItem>
              {classOptions.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
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
            <InputLabel>Gender</InputLabel>
            <Select
              name="genderId"
              value={filters.genderId}
              onChange={handleFilterChange}
              label="Gender"
            >
              <MenuItem value="">All Genders</MenuItem>
              {genders.map((g) => (
                <MenuItem key={g.id} value={String(g.id)}>
                  {g.name}
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

        <Grid size={{ xs: 12, md: 3.5 }}>
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
            placeholder="Search by name, code, CID or school..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            sx={{ minWidth: 300 }}
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

      {/* Students Table */}
      <TableContainer>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              <TableCell>Student Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>School</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell>Mobile No.</TableCell>
              <TableCell>Enrolled</TableCell>
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
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.studentCode || "N/A"}
                    </TableCell>
                    <TableCell>{r.name || "N/A"}</TableCell>
                    <TableCell>{r.citizenId || "N/A"}</TableCell>
                    <TableCell>{genderName(r.genderId) || "N/A"}</TableCell>
                    <TableCell>{r.currentClass || "N/A"}</TableCell>
                    <TableCell>{r.schoolName || "N/A"}</TableCell>
                    <TableCell>
                      {subjectNames.length ? subjectNames.join(", ") : "—"}
                    </TableCell>
                    <TableCell>{r.mobileNo || "N/A"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {fmtDate(r.enrollmentDate) || "N/A"}
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
                    ? "No students added yet"
                    : "No students found matching your criteria"}
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
            Showing {paginatedRows.length} of {filteredRows.length} students
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

export default StudentDetailsReport;
