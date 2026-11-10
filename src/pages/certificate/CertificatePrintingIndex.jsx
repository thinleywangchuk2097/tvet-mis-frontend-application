// CertificatePrintingIndex.jsx
// Same list as the BQF certificate page, but for trainees of ALL institutes.
// PDFs are generated without the background image (same layout) so the text
// can be printed onto pre-printed certificate templates.
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Autocomplete,
  MenuItem,
  Checkbox,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  generateAssessmentCertificatePrintPdf,
  generateAllAssessmentCertificatesPrintPdf,
} from "@/utils/pdf/assessmentCertificatePdf";
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

/** Any date value -> "YYYY-MM-DD" ("" when missing). */
const toDateOnly = (value) => {
  if (!value) return "";
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0];
};

/** Normalize a trainee record into the shape the assessment template expects. */
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

// RPL (39) and RPL re-assessment (41): Viva + Practical, no Internal (CA) mark
// Diploma levels (111, 112) are marked out of 100: Total = Internal + Theory + Practical
const DIPLOMA_LEVEL_IDS = [111, 112];
const isDiplomaRecord = (record) =>
  DIPLOMA_LEVEL_IDS.includes(Number(record?.certification_level_id));

/** Total mark for diploma rows ("—" when not a diploma or a mark is missing). */
const totalMark = (record) => {
  if (!isDiplomaRecord(record)) return "—";
  const parts = [
    record.internal_assessment_mark,
    record.theory_assessment_mark,
    record.practical_assessment_mark,
  ].map((v) => (v === null || v === undefined || v === "" ? NaN : Number(v)));
  if (parts.some((n) => Number.isNaN(n))) return "—";
  return String(Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100);
};

const isRplRecord = (record) => ["39", "41"].includes(String(record?.service_id));

/** Stable row key (trainee CID + announcement no). */
const rowKey = (r) => `${r.cid_no ?? ""}|${r.application_no ?? ""}`;

const CertificatePrintingIndex = () => {
  // ==================== STATE ====================
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [institute, setInstitute] = useState(null);
  const [programmeType, setProgrammeType] = useState("");
  // programme = announcement application_no (tbl_programme_announcement_dtls)
  const [programme, setProgramme] = useState(null);
  // course end date range
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const access_token = useSelector((state) => state.auth.accessToken);

  // ==================== FETCH ====================
  const fetchTrainees = useCallback(async () => {
    if (!access_token) return;
    setLoadingReports(true);
    try {
      const res = await ReportService.getAllTraineesDetailsForCertificate(
        access_token,
      );
      if (res instanceof Error || res?.isAxiosError) throw res;
      setReports(toArray(res));
      setSelected([]);
      setPage(0);
    } catch (error) {
      console.error("Error fetching trainee details:", error);
      toast.error("Failed to fetch trainee certificate data");
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [access_token]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  // ==================== FILTER OPTIONS ====================
  const instituteOptions = useMemo(
    () =>
      [...new Set(reports.map((r) => r.institute_name).filter(Boolean))].sort(),
    [reports],
  );
  const programmeTypeOptions = useMemo(
    () =>
      [...new Set(reports.map((r) => r.programme_type).filter(Boolean))].sort(),
    [reports],
  );

  // Programme options: "Course name (Application No)", narrowed by institute / type
  const programmeOptions = useMemo(() => {
    const map = new Map();
    reports.forEach((r) => {
      if (!r.application_no) return;
      if (institute && r.institute_name !== institute) return;
      if (programmeType && r.programme_type !== programmeType) return;
      if (!map.has(r.application_no)) {
        map.set(r.application_no, {
          applicationNo: r.application_no,
          label: `${r.course_name || "Programme"} (${r.application_no})`,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [reports, institute, programmeType]);

  // drop a selected programme that no longer matches the institute / type
  useEffect(() => {
    if (
      programme &&
      !programmeOptions.some((o) => o.applicationNo === programme.applicationNo)
    ) {
      setProgramme(null);
    }
  }, [programmeOptions, programme]);

  // ==================== FILTERED ROWS ====================
  // Nothing is shown until at least one filter is applied
  const hasFilter = Boolean(
    institute || programmeType || programme || fromDate || toDate || search.trim(),
  );

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!institute && !programmeType && !programme && !fromDate && !toDate && !q)
      return [];
    return reports.filter((r) => {
      if (institute && r.institute_name !== institute) return false;
      if (programmeType && r.programme_type !== programmeType) return false;
      if (programme && r.application_no !== programme.applicationNo) return false;
      // course end date within From / End date (inclusive)
      if (fromDate || toDate) {
        const end = toDateOnly(r.course_end_date);
        if (!end) return false;
        if (fromDate && end < fromDate) return false;
        if (toDate && end > toDate) return false;
      }
      if (!q) return true;
      return [
        r.applicant_name,
        r.cid_no,
        r.application_no,
        r.course_name,
        r.certificate_no,
      ]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [reports, institute, programmeType, programme, fromDate, toDate, search]);

  useEffect(() => {
    setPage(0);
  }, [institute, programmeType, programme, fromDate, toDate, search]);

  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // RPL rows show the Viva mark in the Theory column
  const allRpl =
    filteredReports.length > 0 && filteredReports.every(isRplRecord);
  const someRpl = filteredReports.some(isRplRecord);

  // ==================== SELECTION ====================
  const filteredKeys = filteredReports.map(rowKey);
  const selectedInView = filteredKeys.filter((k) => selected.includes(k));
  const allSelected =
    filteredKeys.length > 0 && selectedInView.length === filteredKeys.length;

  const toggleRow = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const toggleAll = () =>
    setSelected((prev) =>
      allSelected
        ? prev.filter((k) => !filteredKeys.includes(k))
        : [...new Set([...prev, ...filteredKeys])],
    );

  // ==================== PDF HANDLERS ====================
  const handlePdf = useCallback(async (report) => {
    try {
      setDownloading(true);
      await generateAssessmentCertificatePrintPdf(buildPdfPayload(report));
    } catch (err) {
      console.error("❌ Certificate print generation failed:", err);
      toast.error(`Could not generate certificate: ${err?.message || "unknown"}`);
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleBulkPdf = async (rows, label) => {
    if (rows.length === 0) {
      toast.warning("No certificates to download.");
      return;
    }
    try {
      setDownloading(true);
      const name = (institute || label).replace(/[^\w-]+/g, "_");
      await generateAllAssessmentCertificatesPrintPdf(
        rows.map(buildPdfPayload),
        `Certificates_Print_${name}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error("❌ Bulk certificate print generation failed:", err);
      toast.error(`Could not generate certificates: ${err?.message || "unknown"}`);
    } finally {
      setDownloading(false);
    }
  };

  const selectedRows = filteredReports.filter((r) =>
    selected.includes(rowKey(r)),
  );

  // ==================== RENDER ====================
  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Certificate Printing — Trainees' Assessment Certificates
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid item size={{ xs: 12, md: 4 }}>
          <Autocomplete
            size="small"
            options={instituteOptions}
            value={institute}
            onChange={(_e, v) => setInstitute(v)}
            renderInput={(params) => (
              <TextField {...params} label="Institute" placeholder="All institutes" />
            )}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Program Type"
            value={programmeType}
            onChange={(e) => setProgrammeType(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {programmeTypeOptions.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 5 }}>
          <TextField
            fullWidth
            size="small"
            label="Search"
            placeholder="Name, CID, Application No, Course"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Autocomplete
            size="small"
            options={programmeOptions}
            value={programme}
            onChange={(_e, v) => setProgramme(v)}
            getOptionLabel={(o) => o?.label || ""}
            isOptionEqualToValue={(o, v) => o.applicationNo === v.applicationNo}
            renderInput={(params) => (
              <TextField {...params} label="Programme (Application No)" placeholder="All programmes" />
            )}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            type="date"
            fullWidth
            size="small"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: toDate || undefined },
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            type="date"
            fullWidth
            size="small"
            label="End Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: fromDate || undefined },
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTrainees}
            disabled={loadingReports}
            sx={{ textTransform: "none", height: 40 }}
          >
            Refresh
          </Button>
        </Grid>
      </Grid>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => handleBulkPdf(selectedRows, "Selected")}
          disabled={downloading || selectedRows.length === 0}
          sx={{ textTransform: "none" }}
        >
          Download Selected ({selectedRows.length})
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={
            downloading ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />
          }
          onClick={() => handleBulkPdf(filteredReports, "All")}
          disabled={downloading || filteredReports.length === 0}
          sx={{ textTransform: "none" }}
        >
          Download All ({filteredReports.length})
        </Button>
      </Box>

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
              <TableCell padding="checkbox" align="center">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={
                    selectedInView.length > 0 && !allSelected
                  }
                  onChange={toggleAll}
                  disabled={filteredReports.length === 0}
                />
              </TableCell>
              <TableCell>#</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID/Reference No</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Program Type</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Course Start Date</TableCell>
              <TableCell>Course End Date</TableCell>
              <TableCell>Certificate</TableCell>
              <TableCell>Internal</TableCell>
              <TableCell>{allRpl ? "Viva" : someRpl ? "Theory / Viva" : "Theory"}</TableCell>
              <TableCell>Practical</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingReports ? (
              <TableRow>
                <TableCell colSpan={17} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => {
                const key = rowKey(report);
                return (
                  <TableRow key={key || index} hover>
                    <TableCell padding="checkbox" align="center">
                      <Checkbox
                        size="small"
                        checked={selected.includes(key)}
                        onChange={() => toggleRow(key)}
                      />
                    </TableCell>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{val(report, "institute_name")}</TableCell>
                    <TableCell>{val(report, "applicant_name", "name")}</TableCell>
                    <TableCell>{val(report, "cid_no", "cid")}</TableCell>
                    <TableCell>{val(report, "gender")}</TableCell>
                    <TableCell>{val(report, "programme_type")}</TableCell>
                    <TableCell>{val(report, "course_name")}</TableCell>
                    <TableCell>{formatDate(report.course_start_date)}</TableCell>
                    <TableCell>{formatDate(report.course_end_date)}</TableCell>
                    <TableCell>{val(report, "certification_level")}</TableCell>
                    <TableCell>
                      {isRplRecord(report)
                        ? "—"
                        : val(report, "internal_assessment_mark")}
                    </TableCell>
                    <TableCell>
                      {isRplRecord(report)
                        ? val(report, "viva_assessment_mark")
                        : val(report, "theory_assessment_mark")}
                    </TableCell>
                    <TableCell>{val(report, "practical_assessment_mark")}</TableCell>
                    <TableCell sx={{ fontWeight: isDiplomaRecord(report) ? 600 : 400 }}>
                      {totalMark(report)}
                    </TableCell>
                    <TableCell>{val(report, "overall_result")}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePdf(report)}
                        disabled={loadingReports || downloading}
                        sx={{ textTransform: "none" }}
                      >
                        Certificate
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={17} align="center" sx={{ py: 3 }}>
                  {hasFilter
                    ? "No certificates found for the selected filter."
                    : "Select an Institute, Program Type, Programme or date range, or search, to view certificates."}
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
          Showing {paginatedReports.length} of {filteredReports.length} records
        </Typography>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            ".MuiTablePagination-select": { borderRadius: 1 },
            ".MuiTablePagination-displayedRows": { margin: 0 },
          }}
        />
      </Box>
    </Paper>
  );
};

export default CertificatePrintingIndex;
