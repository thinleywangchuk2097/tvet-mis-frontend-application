// TraineeCertificateIndex.jsx
import React, { useState, useCallback } from "react";
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
  Button,
  Box,
  Divider,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { generateAssessmentCertificatePdf } from "@/utils/pdf/assessmentCertificatePdf";
import ReportService from "../../api/services/internal/report/ReportService";

// ==================== HELPERS ====================
/** Always returns an array, no matter what the API shape is. */
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

/** Safe value getter with fallback to "N/A". */
const val = (item, ...keys) => {
  for (const key of keys) {
    const v = item?.[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "N/A";
};

/** Format ISO date to YYYY-MM-DD (or "N/A"). */
const formatDate = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split("T")[0];
};

/**
 * Normalize a trainee record into the shape the assessment template expects.
 */
const buildPdfPayload = (record) => ({
  ...record,
  applicant_name: val(record, "applicant_name", "name", "trainee_name"),
  cid_no: val(record, "cid_no", "cid", "reference_no"),
  occupation_name: val(
    record,
    "occupation_name",
    "course_name",
    "certification_level",
  ),
  overall_result: val(record, "overall_result", "result"),
});

const TraineeCertificateIndex = () => {
  // ==================== STATE ====================
  const [applicationNo, setApplicationNo] = useState("");
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  // ==================== FETCH ====================
  const fetchTrainees = useCallback(async () => {
    if (!applicationNo) {
      toast.warning("Please enter an Application No.");
      return;
    }
    if (!access_token) {
      toast.error("Session not ready. Please wait a moment and try again.");
      return;
    }

    setLoadingReports(true);
    setHasSearched(true);
    try {
      const res = await ReportService.getTraineesDetailsForCertificate(
        registration_no,
        applicationNo,
        access_token,
      );
      console.log("Fetched trainee details:", res.data);
      setReports(toArray(res));
      setPage(0);
    } catch (error) {
      console.error("Error fetching trainee details:", error);
      toast.error("Failed to fetch trainee certificate data");
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [applicationNo, registration_no, access_token]);

  // ==================== PDF HANDLER ====================
  const handlePdf = useCallback(async (report) => {
    try {
      setDownloading(true);
      await generateAssessmentCertificatePdf(buildPdfPayload(report));
    } catch (err) {
      console.error("❌ Assessment certificate generation failed:", err);
      toast.error(
        `Could not generate certificate: ${err?.message || "unknown"}`,
      );
    } finally {
      setDownloading(false);
    }
  }, []);

  // ==================== HANDLERS ====================
  const handleSearch = () => {
    setPage(0);
    fetchTrainees();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ==================== DERIVED VALUES ====================
  const safeReports = Array.isArray(reports) ? reports : [];
  const paginatedReports = safeReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ==================== RENDER ====================
  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        List of Trainees' Assessment Certificates
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Application No + Search */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <TextField
              fullWidth
              label="Application No"
              type="number"
              name="ApplicationNo"
              value={applicationNo}
              onChange={(e) => setApplicationNo(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              size="small"
            />
            <Button
              variant="contained"
              size="medium"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loadingReports || !applicationNo}
              sx={{ textTransform: "none", minWidth: 120, height: 40 }}
            >
              {loadingReports ? "Loading..." : "Search"}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": { border: "1px solid #ccc", padding: "8px" },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                background: "#f5f5f5",
                "& .MuiTableCell-root": { fontWeight: "bold" },
              }}
            >
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID/Reference No</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Program Type</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Course Start Date</TableCell>
              <TableCell>Course End Date</TableCell>
              <TableCell>Certificate</TableCell>
              <TableCell>Internal</TableCell>
              <TableCell>Theory</TableCell>
              <TableCell>Practical</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingReports ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow key={report.id ?? report.cid_no ?? index} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{val(report, "applicant_name", "name")}</TableCell>
                  <TableCell>{val(report, "cid_no", "cid")}</TableCell>
                  <TableCell>{val(report, "gender")}</TableCell>
                  <TableCell>{val(report, "programme_type")}</TableCell>
                  <TableCell>{val(report, "course_name")}</TableCell>
                  <TableCell>{formatDate(report.course_start_date)}</TableCell>
                  <TableCell>{formatDate(report.course_end_date)}</TableCell>
                  <TableCell>{val(report, "certification_level")}</TableCell>
                  <TableCell>
                    {val(report, "internal_assessment_mark")}
                  </TableCell>
                  <TableCell>{val(report, "theory_assessment_mark")}</TableCell>
                  <TableCell>
                    {val(report, "practical_assessment_mark")}
                  </TableCell>
                  <TableCell>{val(report, "overall_result")}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handlePdf(report)}
                      disabled={loadingReports || downloading}
                      sx={{ textTransform: "none" }}
                    >
                      Certificate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                  {hasSearched
                    ? "No reports found for the given Application No."
                    : "Enter an Application No and click Search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedReports.length} of {safeReports.length} records
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={safeReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            ".MuiTablePagination-select": { borderRadius: 1 },
            ".MuiTablePagination-displayedRows": { margin: 0 },
          }}
        />
      </Box>
    </Paper>
  );
};

export default TraineeCertificateIndex;
