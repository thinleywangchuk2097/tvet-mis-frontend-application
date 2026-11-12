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
import CommonService from "../../../api/services/internal/common/CommonService";

// Same status ids as the Tutor page
const STATUS_LIST = [
  { id: 1, name: "Active", color: "success" },
  { id: 2, name: "Inactive", color: "error" },
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

const TutorsDetailsReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [genders, setGenders] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    qualificationId: "",
    subjectId: "",
    genderId: "",
    statusId: "",
    search: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [detailsRes, qualRes, genderRes] = await Promise.all([
          InstituteRegistrationService.getInstituteDetails(registration_no),
          CommonService.getByParentId(18),
          CommonService.getByParentId(8),
        ]);
        setQualifications(listOf(qualRes));
        setGenders(listOf(genderRes));

        const instituteId = listOf(detailsRes)[0]?.institute_id;
        if (!instituteId) {
          toast.error("Centre details not found");
          return;
        }

        const [tutorRes, subjectRes] = await Promise.all([
          TutorService.getAllTutors(instituteId, access_token),
          SubjectService.getAllSubjects(instituteId, access_token),
        ]);
        setTutors(listOf(tutorRes));
        setSubjects(listOf(subjectRes));
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
  const genderName = (id) =>
    genders.find((g) => String(g.id) === String(id))?.name || "";
  const subjectName = (id) => {
    const s = subjects.find((x) => String(x.id) === String(id));
    return s ? s.subject_name || s.subject_code : "";
  };
  const statusOf = (id) =>
    STATUS_LIST.find((s) => s.id === Number(id ?? 1)) || {
      name: "—",
      color: "default",
    };

  // Subjects a tutor teaches = subjects selected on the Tutor page
  const rows = useMemo(
    () =>
      tutors.map((t) => ({
        id: t.id,
        name:
          t.name ||
          [t.first_name, t.middle_name, t.last_name].filter(Boolean).join(" "),
        citizenId: t.citizen_id || "",
        genderId: t.gender_id,
        email: t.email || "",
        mobileNo: t.mobile_no || "",
        qualificationId: t.qualification_id,
        statusId: Number(t.status_id ?? 1),
        subjectIds: t.subject_ids
          ? String(t.subject_ids)
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : [],
      })),
    [tutors],
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filters.qualificationId === "" ||
          String(r.qualificationId) === filters.qualificationId) &&
        (filters.subjectId === "" || r.subjectIds.includes(filters.subjectId)) &&
        (filters.genderId === "" || String(r.genderId) === filters.genderId) &&
        (filters.statusId === "" || String(r.statusId) === filters.statusId) &&
        (q === "" ||
          r.name.toLowerCase().includes(q) ||
          r.citizenId.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.subjectIds
            .map(subjectName)
            .join(" ")
            .toLowerCase()
            .includes(q)),
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
      genderId: "",
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
      CID: r.citizenId,
      Gender: genderName(r.genderId),
      QualificationLevel: qualificationName(r.qualificationId),
      Subjects: r.subjectIds.map(subjectName).filter(Boolean).join(", "),
      Email: r.email,
      PhoneNumber: r.mobileNo,
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
            <InputLabel>Gender</InputLabel>
            <Select
              name="genderId"
              value={filters.genderId}
              onChange={handleFilterChange}
              label="Gender"
            >
              <MenuItem value="">All</MenuItem>
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
            placeholder="Search by name, CID, email or subject..."
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
              <TableCell>Gender</TableCell>
              <TableCell>Qualification Level</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone Number</TableCell>
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
                    <TableCell>{genderName(r.genderId) || "N/A"}</TableCell>
                    <TableCell>
                      {qualificationName(r.qualificationId) || "N/A"}
                    </TableCell>
                    <TableCell>
                      {subjectNames.length ? subjectNames.join(", ") : "—"}
                    </TableCell>
                    <TableCell>{r.email || "N/A"}</TableCell>
                    <TableCell>{r.mobileNo || "N/A"}</TableCell>
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
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
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
