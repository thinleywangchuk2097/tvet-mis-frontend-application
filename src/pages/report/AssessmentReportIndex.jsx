// Assessment report: the logged-in institute's selected trainees with their
// assessment marks / competencies and overall result, with an Excel download.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";
import ReportService from "../../api/services/internal/report/ReportService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";

const isFailed = (res) => !res || res instanceof Error || res?.isAxiosError;
const listOf = (res) => (!isFailed(res) && Array.isArray(res?.data) ? res.data : []);

// RPL (39) and RPL re-assessment (41) are assessed by Viva instead of Theory, and have no Internal
const VIVA_SERVICES = ["39", "41"];

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().split("T")[0];
};

const safeFilePart = (text) =>
  String(text || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_");

const show = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const headCell = {
  border: "1px solid #ccc",
  fontWeight: "bold",
  fontSize: "0.78rem",
  padding: "6px 8px",
  whiteSpace: "nowrap",
  bgcolor: "#f5f5f5",
};
const cell = { border: "1px solid #ccc", fontSize: "0.78rem", padding: "4px 8px" };

const AssessmentReportIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(false);
  const [institute, setInstitute] = useState(null);
  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = useCallback(async () => {
    if (!registration_no) return;
    setLoading(true);
    try {
      const [detailsRes, reportRes] = await Promise.all([
        InstituteRegistrationService.getInstituteDetails(registration_no),
        ReportService.getInstituteAssessmentReport(registration_no, access_token),
      ]);
      setInstitute(listOf(detailsRes)[0] || null);
      if (isFailed(reportRes)) toast.error("Failed to fetch the assessment report");
      setRows(listOf(reportRes));
    } catch (e) {
      console.error("Assessment report load failed:", e);
      toast.error("Failed to load the assessment report");
    } finally {
      setLoading(false);
    }
  }, [registration_no, access_token]);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(
    () =>
      rows.map((r) => {
        const isViva = VIVA_SERVICES.includes(String(r.service_id));
        return {
          ...r,
          isViva,
          serviceKey: String(r.service_id ?? ""),
          // RPL: no internal; Viva in place of Theory
          internal: isViva ? "" : r.internal_assessment,
          theoryOrViva: isViva ? r.viva_assessment : r.theory_assessment,
        };
      }),
    [rows],
  );

  // filter options from the data itself
  const serviceOptions = useMemo(() => {
    const map = new Map();
    data.forEach((r) => {
      if (r.serviceKey) map.set(r.serviceKey, r.service_name || `Service ${r.serviceKey}`);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [data]);

  const courseOptions = useMemo(
    () =>
      [...new Set(data.filter((r) => !serviceFilter || r.serviceKey === serviceFilter)
        .map((r) => r.course_name)
        .filter(Boolean))].sort(),
    [data, serviceFilter],
  );

  const resultOptions = useMemo(
    () => [...new Set(data.map((r) => r.overall_result).filter(Boolean))].sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      const matchesSearch =
        !q ||
        [
          r.applicant_name,
          r.cid_no,
          r.trainee_application_no,
          r.announcement_no,
          r.course_name,
          r.certificate_no,
        ].some((v) => String(v ?? "").toLowerCase().includes(q));
      const matchesService = !serviceFilter || r.serviceKey === serviceFilter;
      const matchesCourse = !courseFilter || r.course_name === courseFilter;
      const matchesResult =
        !resultFilter ||
        (resultFilter === "__none" ? !r.overall_result : r.overall_result === resultFilter);
      return matchesSearch && matchesService && matchesCourse && matchesResult;
    });
  }, [data, search, serviceFilter, courseFilter, resultFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, serviceFilter, courseFilter, resultFilter]);

  // a course picked under another programme type no longer applies
  useEffect(() => {
    if (courseFilter && !courseOptions.includes(courseFilter)) setCourseFilter("");
  }, [courseOptions, courseFilter]);

  const handleReset = () => {
    setSearch("");
    setServiceFilter("");
    setCourseFilter("");
    setResultFilter("");
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const sheet = filtered.map((r, i) => ({
      SlNo: i + 1,
      "Announcement No": r.announcement_no || "N/A",
      "Programme Type": r.service_name || "N/A",
      Course: r.course_name || "N/A",
      "Certification Level": r.certification_level || "N/A",
      "Course Start Date": formatDate(r.course_start_date) || "N/A",
      "Course End Date": formatDate(r.course_end_date) || "N/A",
      "Trainee Application No": r.trainee_application_no || "N/A",
      "Trainee Name": r.applicant_name || "N/A",
      "CID / Reference No": r.cid_no || "N/A",
      Gender: r.gender || "N/A",
      "Mobile No": r.mobile_no || "N/A",
      Email: r.email_id || "N/A",
      "Internal Assessment": r.isViva ? "Not applicable" : r.internal || "N/A",
      "Theory / Viva Assessment": r.theoryOrViva || "N/A",
      "Practical Assessment": r.practical_assessment || "N/A",
      "Overall Result": r.overall_result || "N/A",
      "Certificate No": r.certificate_no || "N/A",
      "Certificate Issued Date": formatDate(r.certificate_issued_date) || "N/A",
    }));
    const today = new Date().toISOString().split("T")[0];
    const fileName = [
      "Assessment_Report",
      safeFilePart(institute?.proposed_institute_name || rows[0]?.institute_name),
      today,
    ]
      .filter(Boolean)
      .join("_");
    exportToExcel(sheet, fileName);
    toast.success(`Exported ${sheet.length} record(s) to Excel`);
  };

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        mb={1.5}
      >
        <Box>
          <Typography variant="h6">Assessment Report</Typography>
          {institute?.proposed_institute_name && (
            <Typography variant="body2" color="text.secondary">
              {institute.proposed_institute_name}
              {institute.registration_no ? ` · ${institute.registration_no}` : ""}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={loading || filtered.length === 0}
          sx={{ textTransform: "none" }}
        >
          Export to Excel
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} mb={1.5}>
        <TextField
          size="small"
          placeholder="Search trainee, CID, application no, course, certificate no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, "& input": { fontSize: "0.85rem" } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Programme Type"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          {serviceOptions.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Course"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          {courseOptions.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Overall Result"
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          {resultOptions.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
          <MenuItem value="__none">No result yet</MenuItem>
        </TextField>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={handleReset}
          sx={{ textTransform: "none" }}
        >
          Reset
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {filtered.length} of {data.length} record(s)
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ borderCollapse: "collapse", minWidth: 1250 }}>
          <TableHead>
            <TableRow>
              {[
                "#",
                "Announcement No",
                "Programme Type",
                "Course",
                "Level",
                "Trainee",
                "CID / Ref No",
                "Gender",
                "Internal",
                "Theory / Viva",
                "Practical",
                "Overall Result",
                "Certificate No",
              ].map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    ...headCell,
                    textAlign: ["Internal", "Theory / Viva", "Practical", "Overall Result"].includes(h)
                      ? "center"
                      : "left",
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 2 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : pageRows.length > 0 ? (
              pageRows.map((r, i) => (
                <TableRow key={`${r.announcement_no}-${r.trainee_application_no}-${i}`} hover>
                  <TableCell sx={cell}>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>
                    {show(r.announcement_no)}
                  </TableCell>
                  <TableCell sx={cell}>{show(r.service_name)}</TableCell>
                  <TableCell sx={cell}>{show(r.course_name)}</TableCell>
                  <TableCell sx={cell}>{show(r.certification_level)}</TableCell>
                  <TableCell sx={cell}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                      {show(r.applicant_name)}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                      {r.trainee_application_no}
                    </Typography>
                  </TableCell>
                  <TableCell sx={cell}>{show(r.cid_no)}</TableCell>
                  <TableCell sx={cell}>{show(r.gender)}</TableCell>
                  <TableCell sx={{ ...cell, textAlign: "center" }}>
                    {r.isViva ? "N/A" : show(r.internal)}
                  </TableCell>
                  <TableCell sx={{ ...cell, textAlign: "center" }}>{show(r.theoryOrViva)}</TableCell>
                  <TableCell sx={{ ...cell, textAlign: "center" }}>
                    {show(r.practical_assessment)}
                  </TableCell>
                  <TableCell sx={{ ...cell, textAlign: "center" }}>{show(r.overall_result)}</TableCell>
                  <TableCell sx={cell}>{show(r.certificate_no)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {data.length ? "No records match the filters." : "No assessment records found."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            "& .MuiToolbar-root": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: "0.78rem",
            },
          }}
        />
      </TableContainer>
    </Paper>
  );
};

export default AssessmentReportIndex;
