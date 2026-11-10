import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VerifiedIcon from "@mui/icons-material/Verified";
import DownloadIcon from "@mui/icons-material/Download";
import { generateAssessmentCertificatePdf } from "@/utils/pdf/assessmentCertificatePdf";
import { toast } from "react-toastify";
import PublicPageService from "../../../api/services/internal/public/PublicPageService";
import CommonService from "../../../api/services/internal/common/CommonService";

// Assessment types (service ids) shown on this page
const ASSESSMENT_TYPES = [
  { id: 37, label: "BQF Programme Assessment" },
  { id: 42, label: "BQF Re-assessment" },
  { id: 39, label: "RPL Assessment" },
  { id: 41, label: "RPL Re-assessment" },
];

// RPL (39) and RPL re-assessment (41): Viva + Practical, no Internal assessment
const isRpl = (r) => [39, 41].includes(Number(r.service_id));

const COMPETENT_STATUS_ID = 94;

const show = (v) => (v === null || v === undefined || v === "" ? "—" : v);

/** Shape a result row the way the certificate template expects. */
const buildPdfPayload = (r) => ({
  ...r,
  applicant_name: r.applicant_name || "N/A",
  cid_no: r.cid_no || "N/A",
  occupation_name: r.course_name || r.certification_level || "N/A",
  overall_result: r.overall_result || "Competent",
});

/** A certificate can be downloaded once the trainee is Competent and a certificate no is issued. */
const canDownloadCertificate = (r) =>
  Number(r.result_status_id) === COMPETENT_STATUS_ID && Boolean(r.certificate_no);

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split("T")[0];
};

const AssessmentResult = () => {
  const [filters, setFilters] = useState({
    citizenId: "",
    assessmentType: "",
    certificationLevel: "",
  });
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleCertificate = async (r) => {
    try {
      setDownloadingId(r.id);
      await generateAssessmentCertificatePdf(buildPdfPayload(r));
    } catch (error) {
      console.error("Certificate generation failed:", error);
      toast.error("Could not generate the certificate. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Certification levels for the filter
  useEffect(() => {
    CommonService.getByParentId(27)
      .then((res) =>
        setCertificationLevels(Array.isArray(res?.data) ? res.data : []),
      )
      .catch(() => setCertificationLevels([]));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    const cid = filters.citizenId.trim();
    if (!cid) {
      toast.warning("Please enter a Citizen ID No.");
      return;
    }
    setLoading(true);
    try {
      const res = await PublicPageService.getAssessmentResultsByCid(cid);
      if (res instanceof Error || res?.isAxiosError) throw res;
      setRows(Array.isArray(res?.data) ? res.data : []);
      setSearchPerformed(true);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      toast.error("Failed to fetch assessment results");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleReset = () => {
    setFilters({ citizenId: "", assessmentType: "", certificationLevel: "" });
    setRows([]);
    setSearchPerformed(false);
  };

  // Assessment type / level filters apply to the fetched rows
  const results = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.assessmentType ||
            Number(r.service_id) === Number(filters.assessmentType)) &&
          (!filters.certificationLevel ||
            Number(r.certification_level_id) ===
              Number(filters.certificationLevel)),
      ),
    [rows, filters.assessmentType, filters.certificationLevel],
  );

  const competentCount = results.filter(
    (r) => Number(r.result_status_id) === COMPETENT_STATUS_ID,
  ).length;

  const getResultChip = (r) => {
    const competent = Number(r.result_status_id) === COMPETENT_STATUS_ID;
    return (
      <Chip
        label={show(r.overall_result)}
        color={competent ? "success" : "error"}
        size="small"
        variant="outlined"
      />
    );
  };

  const typeLabel = (r) =>
    ASSESSMENT_TYPES.find((t) => t.id === Number(r.service_id))?.label ||
    show(r.assessment_type);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2 },
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: "primary.main", mr: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            Assessment Result
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Search Filters */}
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              label="Citizen ID No"
              fullWidth
              size="small"
              name="citizenId"
              value={filters.citizenId}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter Citizen ID"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Assessment Type"
              fullWidth
              size="small"
              name="assessmentType"
              value={filters.assessmentType}
              onChange={handleInputChange}
            >
              <MenuItem value="">-select-</MenuItem>
              {ASSESSMENT_TYPES.map((t) => (
                <MenuItem key={t.id} value={String(t.id)}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Certification Level"
              fullWidth
              size="small"
              name="certificationLevel"
              value={filters.certificationLevel}
              onChange={handleInputChange}
            >
              <MenuItem value="">-select-</MenuItem>
              {certificationLevels.map((l) => (
                <MenuItem key={l.id} value={String(l.id)}>
                  {l.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={handleSearch}
                disabled={loading || !filters.citizenId.trim()}
                fullWidth
                sx={{ height: 40 }}
              >
                Search
              </Button>
              {searchPerformed && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleReset}
                  sx={{ height: 40 }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Search Summary */}
        {searchPerformed && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {results.length} result{results.length !== 1 ? "s" : ""}{" "}
              for your search
            </Typography>
          </Box>
        )}

        {/* Results Table */}
        {searchPerformed && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 3 }}>
            <Table
              size="small"
              sx={{
                "& th, & td": { border: "1px solid #e0e0e0" },
              }}
            >
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  {[
                    "Citizen ID",
                    "Name",
                    "Assessment Type",
                    "Programme",
                    "Certification Level",
                    "Institute",
                    "Course End Date",
                    "Internal",
                    "Theory / Viva",
                    "Practical",
                    "Result",
                    "Certificate No",
                    "Certificate",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      align={
                        ["Internal", "Theory / Viva", "Practical", "Result", "Certificate"].includes(h)
                          ? "center"
                          : "left"
                      }
                    >
                      <strong>{h}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length > 0 ? (
                  results.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{show(r.cid_no)}</TableCell>
                      <TableCell>{show(r.applicant_name)}</TableCell>
                      <TableCell>{typeLabel(r)}</TableCell>
                      <TableCell>{show(r.course_name)}</TableCell>
                      <TableCell>{show(r.certification_level)}</TableCell>
                      <TableCell>{show(r.institute_name)}</TableCell>
                      <TableCell>{formatDate(r.course_end_date)}</TableCell>
                      <TableCell align="center">
                        {isRpl(r) ? "—" : show(r.internal_assessment_mark)}
                      </TableCell>
                      <TableCell align="center">
                        {isRpl(r)
                          ? show(r.viva_assessment_mark)
                          : show(r.theory_assessment_mark)}
                      </TableCell>
                      <TableCell align="center">
                        {show(r.practical_assessment_mark)}
                      </TableCell>
                      <TableCell align="center">{getResultChip(r)}</TableCell>
                      <TableCell>{show(r.certificate_no)}</TableCell>
                      <TableCell align="center">
                        {canDownloadCertificate(r) ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              downloadingId === r.id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <DownloadIcon />
                              )
                            }
                            onClick={() => handleCertificate(r)}
                            disabled={downloadingId !== null}
                            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                          >
                            Download
                          </Button>
                        ) : (
                          <Tooltip
                            title={
                              Number(r.result_status_id) === COMPETENT_STATUS_ID
                                ? "Certificate not issued yet"
                                : "Available only for Competent results"
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                disabled
                                sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                              >
                                Download
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <VerifiedIcon
                          sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                        />
                        <Typography color="text.secondary">
                          No assessment results found
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check the Citizen ID No or adjust the filters
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary Cards */}
        {searchPerformed && results.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Total Assessments
                  </Typography>
                  <Typography variant="h4">{results.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Competent
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {competentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Not Yet Competent
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {results.length - competentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default AssessmentResult;
