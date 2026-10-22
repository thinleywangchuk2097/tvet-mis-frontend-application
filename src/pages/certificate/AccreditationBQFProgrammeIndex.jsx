// AccreditationBQFProgrammeIndex.jsx
import { useState, useCallback } from "react";
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
import {
  generateAccreditationProgrammePdf,
  generateAllAccreditationProgrammesPdf,
} from "@/utils/pdf/accreditationCertificatePdf";
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
 * Normalize a record into the shape the accreditation PDF template expects.
 */
const buildPdfPayload = (record) => ({
  ...record,
  application_no: val(record, "application_no", "applicationNo"),
  registration_no: val(record, "registration_no", "registrationNo"),
  institute_name: val(record, "institute_name", "instituteName"),
  programme_title: val(record, "programme_title", "programmeTitle"),
  occupation_name: val(record, "occupation_name", "occupation"),
  sector_name: val(record, "sector_name", "sector"),
  enrolment_capacity: val(record, "enrolment_capacity", "enrolmentCapacity"),
});

const AccreditationBQFProgrammeIndex = () => {
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
  const fetchAccreditedProgrammes = useCallback(async () => {
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
      const res =
        await ReportService.getAccreditedProgrammeDetailsForCertificate(
          registration_no,
          applicationNo,
          access_token,
        );
      setReports(toArray(res));
      setPage(0);
    } catch (error) {
      console.error("Error fetching accredited programme details:", error);
      toast.error("Failed to fetch accredited programme data");
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [applicationNo, registration_no, access_token]);

  // ==================== PDF HANDLERS ====================
  const handlePdf = useCallback(async (report) => {
    try {
      setDownloading(true);
      await generateAccreditationProgrammePdf(buildPdfPayload(report));
    } catch (err) {
      console.error("❌ Accreditation certificate generation failed:", err);
      toast.error(
        `Could not generate certificate: ${err?.message || "unknown"}`,
      );
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!reports.length) return;
    try {
      setDownloading(true);
      await generateAllAccreditationProgrammesPdf(reports.map(buildPdfPayload));
    } catch (err) {
      console.error("❌ Bulk accreditation generation failed:", err);
      toast.error(
        `Could not generate certificates: ${err?.message || "unknown"}`,
      );
    } finally {
      setDownloading(false);
    }
  }, [reports]);

  // ==================== HANDLERS ====================
  const handleSearch = () => {
    setPage(0);
    fetchAccreditedProgrammes();
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
        Accreditation BQF Programme
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
              <TableCell>Application No</TableCell>
              <TableCell>Registration No</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Institute Name</TableCell>
              <TableCell>Programme Title</TableCell>
              <TableCell>Occupation</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Certification ID</TableCell>
              <TableCell>Curriculum ID</TableCell>
              <TableCell>Enrolment Capacity</TableCell>
              <TableCell>Validity Date</TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadAll}
                  disabled={
                    safeReports.length === 0 || loadingReports || downloading
                  }
                  sx={{ textTransform: "none", fontWeight: "bold" }}
                >
                  Download All
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingReports ? (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow
                  key={
                    report.id ||
                    report.registration_no ||
                    report.application_no ||
                    index
                  }
                  hover
                >
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    {val(report, "application_no", "applicationNo")}
                  </TableCell>
                  <TableCell>
                    {val(report, "registration_no", "registrationNo")}
                  </TableCell>
                  <TableCell>{formatDate(report.registration_date)}</TableCell>
                  <TableCell>
                    {val(report, "institute_name", "instituteName")}
                  </TableCell>
                  <TableCell>
                    {val(report, "programme_title", "programmeTitle")}
                  </TableCell>
                  <TableCell>
                    {val(report, "occupation_name", "occupation")}
                  </TableCell>
                  <TableCell>{val(report, "sector_name", "sector")}</TableCell>
                  <TableCell>
                    {val(report, "certification_id", "certificationId")}
                  </TableCell>
                  <TableCell>
                    {val(report, "curriculum_id", "curriculumId")}
                  </TableCell>
                  <TableCell>
                    {val(report, "enrolment_capacity", "enrolmentCapacity")}
                  </TableCell>
                  <TableCell>{formatDate(report.validity_date)}</TableCell>
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
                <TableCell colSpan={13} align="center" sx={{ py: 3 }}>
                  {hasSearched
                    ? "No records found for the given Application No."
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

export default AccreditationBQFProgrammeIndex;
