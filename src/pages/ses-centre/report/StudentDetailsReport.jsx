
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";
import StudentEnrollmentService from "../../../api/services/internal/ses-center/StudentEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";

const GENDER_PARENT_ID = 8;
const ACADEMIC_QUALIFICATION_PARENT_ID = 18; // School Level

// Compact bordered table (same look as the other reports)
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

const EMPTY_FILTERS = {
  year: "",
  subjectId: "",
  schoolLevelId: "",
  genderId: "",
  search: "",
};

const StudentDetailsReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [genders, setGenders] = useState([]);
  const [schoolLevels, setSchoolLevels] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [detailsRes, genderRes, levelRes] = await Promise.all([
          InstituteRegistrationService.getInstituteDetails(registration_no),
          CommonService.getByParentId(GENDER_PARENT_ID),
          CommonService.getByParentId(ACADEMIC_QUALIFICATION_PARENT_ID),
        ]);
        setGenders(listOf(genderRes));
        setSchoolLevels(listOf(levelRes));

        const instituteId = listOf(detailsRes)[0]?.institute_id;
        if (!instituteId) {
          toast.error("Centre details not found");
          return;
        }

        const [studentRes, subjectRes] = await Promise.all([
          StudentEnrollmentService.getAllEnrollments(instituteId, access_token),
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
  const nameOf = (list, id) =>
    list.find((x) => String(x.id) === String(id))?.name || "";

  // years that have enrolments, newest first
  const years = useMemo(
    () =>
      [...new Set(students.map((s) => s.enrollment_year).filter(Boolean))].sort(
        (a, b) => b - a,
      ),
    [students],
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return students.filter(
      (s) =>
        (filters.year === "" || String(s.enrollment_year) === filters.year) &&
        (filters.subjectId === "" ||
          String(s.subject_id) === filters.subjectId) &&
        (filters.schoolLevelId === "" ||
          String(s.school_level_id) === filters.schoolLevelId) &&
        (filters.genderId === "" || String(s.gender_id) === filters.genderId) &&
        (q === "" ||
          (s.name || "").toLowerCase().includes(q) ||
          (s.subject_name || "").toLowerCase().includes(q)),
    );
  }, [students, filters]);

  // gender split of the filtered rows (shown above the table)
  const genderCounts = useMemo(() => {
    const counts = {};
    filteredRows.forEach((s) => {
      const label = nameOf(genders, s.gender_id) || "Not set";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts);
  }, [filteredRows, genders]);

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
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const today = new Date().toISOString().split("T")[0];

  // Excel export of the filtered rows (all pages)
  const handleExcelExport = () => {
    const data = filteredRows.map((s, index) => ({
      SlNo: index + 1,
      Name: s.name || "",
      Gender: nameOf(genders, s.gender_id),
      SchoolLevel: nameOf(schoolLevels, s.school_level_id),
      Subject: s.subject_name || "",
      Year: s.enrollment_year || "",
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

  const filterSelect = (name, label, allLabel, options) => (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        value={filters[name]}
        onChange={handleFilterChange}
        label={label}
      >
        <MenuItem value="">{allLabel}</MenuItem>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Student Details Report
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 1.75 }}>
          {filterSelect(
            "year",
            "Year",
            "All Years",
            years.map((y) => ({ value: String(y), label: y })),
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          {filterSelect(
            "subjectId",
            "Subject",
            "All Subjects",
            subjects.map((s) => ({
              value: String(s.id),
              label: s.subject_name || `Subject ${s.id}`,
            })),
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
          {filterSelect(
            "schoolLevelId",
            "School Level",
            "All Levels",
            schoolLevels.map((l) => ({ value: String(l.id), label: l.name })),
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          {filterSelect(
            "genderId",
            "Gender",
            "All",
            genders.map((g) => ({ value: String(g.id), label: g.name })),
          )}
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

      {/* Summary + search */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total: <strong>{filteredRows.length}</strong>
          {genderCounts.map(([label, n]) => (
            <span key={label}>
              {" · "}
              {label}: <strong>{n}</strong>
            </span>
          ))}
        </Typography>
        <TextField
          size="small"
          placeholder="Search by name or subject..."
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
      </Box>

      {/* Students Table */}
      <TableContainer>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>School Level</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell align="center">Year</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((s, index) => (
                <TableRow key={s.id} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{s.name || "N/A"}</TableCell>
                  <TableCell>{nameOf(genders, s.gender_id) || "N/A"}</TableCell>
                  <TableCell>
                    {nameOf(schoolLevels, s.school_level_id) || "N/A"}
                  </TableCell>
                  <TableCell>{s.subject_name || "N/A"}</TableCell>
                  <TableCell align="center">
                    {s.enrollment_year || "N/A"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  {students.length === 0
                    ? "No students enrolled yet"
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
