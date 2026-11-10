// Assessor / Accreditor / QMS Auditor registrations report
// Data: tbl_assessor_accreditor_auditor_registration (AssessorAccreditorQMSAuditorController)
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { exportToExcel } from "@/utils/exportExcel";
import ReportService from "../../api/services/internal/report/ReportService";

// Registration types (service ids)
const REGISTRATION_TYPES = [
  { id: 32, name: "Assessor" },
  { id: 5, name: "Accreditor" },
  { id: 3, name: "QMS Auditor" },
];

const typeName = (serviceId, fallback) =>
  REGISTRATION_TYPES.find((t) => t.id === Number(serviceId))?.name || fallback || "N/A";

// created_at -> "YYYY-MM-DD" (handles ISO strings and [y, m, d, ...] arrays)
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

const STATUS_COLORS = {
  approved: { bg: "#e8f5e9", color: "#2e7d32" },
  rejected: { bg: "#ffebee", color: "#d32f2f" },
  pending: { bg: "#fff3e0", color: "#ed6c02" },
  submitted: { bg: "#e3f2fd", color: "#1565c0" },
};
const statusStyle = (status) => {
  const key = String(status || "").toLowerCase();
  const match = Object.keys(STATUS_COLORS).find((k) => key.includes(k));
  return match ? STATUS_COLORS[match] : { bg: "#f5f5f5", color: "#000" };
};

const EMPTY_FILTERS = {
  type: "",
  status: "",
  dzongkhag: "",
  sector: "",
  fromDate: "",
  toDate: "",
  search: "",
};

const AssessorAccreditorAuditorReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = useCallback(async () => {
    if (!access_token) return;
    setLoading(true);
    try {
      const res = await ReportService.getAssessorAccreditorAuditorReport(access_token);
      if (res instanceof Error || res?.isAxiosError) throw res;
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data.map((r) => ({
          id: r.id,
          applicationNo: r.application_no || "N/A",
          registrationNo: r.registration_no || "",
          serviceId: Number(r.service_id),
          type: typeName(r.service_id, r.service_name),
          name: r.full_name || "N/A",
          cid: r.cid_no || "",
          gender: r.gender || "",
          mobile: r.mobile_no || "",
          email: r.email || "",
          dzongkhag: r.dzongkhag_name || "",
          organization: r.organization_name || "",
          designation: r.designation || "",
          experience: r.years_of_experience ?? "",
          sector: r.sector_name || "",
          occupation: r.occupation_name || "",
          level: r.certification_level_name || "",
          qmsTraining: r.qms_training || "",
          status: r.status_name || "Pending",
          date: toDateOnly(r.created_at),
        })),
      );
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("Failed to load the report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    load();
  }, [load]);

  // dropdown options from the data
  const uniq = (key) =>
    [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  const statusOptions = useMemo(() => uniq("status"), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const dzongkhagOptions = useMemo(() => uniq("dzongkhag"), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const sectorOptions = useMemo(() => uniq("sector"), [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const filtered = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    const has = (v) => String(v).toLowerCase().includes(s);
    return rows.filter(
      (r) =>
        (!filters.type || r.serviceId === Number(filters.type)) &&
        (!filters.status || r.status === filters.status) &&
        (!filters.dzongkhag || r.dzongkhag === filters.dzongkhag) &&
        (!filters.sector || r.sector === filters.sector) &&
        // created_at date range (inclusive)
        (!filters.fromDate || (r.date && r.date >= filters.fromDate)) &&
        (!filters.toDate || (r.date && r.date <= filters.toDate)) &&
        (!s ||
          has(r.name) ||
          has(r.applicationNo) ||
          has(r.registrationNo) ||
          has(r.cid) ||
          has(r.organization) ||
          has(r.occupation)),
    );
  }, [rows, filters]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExcelExport = () => {
    const data = filtered.map((r, i) => ({
      SlNo: i + 1,
      ApplicationNo: r.applicationNo,
      RegistrationNo: r.registrationNo,
      Type: r.type,
      Name: r.name,
      CID: r.cid,
      Gender: r.gender,
      Mobile: r.mobile,
      Email: r.email,
      Dzongkhag: r.dzongkhag,
      Organization: r.organization,
      Designation: r.designation,
      Experience: r.experience,
      Sector: r.sector,
      Occupation: r.occupation,
      CertificateLevel: r.level,
      QMSTraining: r.qmsTraining,
      Status: r.status,
      Date: r.date,
    }));
    const typePart = filters.type ? typeName(filters.type).replace(/\s+/g, "_") : "All";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(data, `Assessor_Accreditor_Auditor_${typePart}_${today}`);
  };

  const COLS = 11;

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Assessor, Accreditor & QMS Auditor Report
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Registration Type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Types</MenuItem>
            {REGISTRATION_TYPES.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Sector"
            name="sector"
            value={filters.sector}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Sectors</MenuItem>
            {sectorOptions.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Location"
            name="dzongkhag"
            value={filters.dzongkhag}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Locations</MenuItem>
            {dzongkhagOptions.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statusOptions.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="secondary" onClick={handleClearFilters} fullWidth>
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={filtered.length === 0}
              fullWidth
              onClick={handleExcelExport}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Date range (created date) + Search */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            type="date"
            size="small"
            fullWidth
            label="From Date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: filters.toDate || undefined },
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            type="date"
            size="small"
            fullWidth
            label="End Date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: filters.fromDate || undefined },
            }}
          />
        </Grid>
        <Grid item sx={{ ml: "auto" }}>
          <TextField
            size="small"
            placeholder="Search by name, CID, application no..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            sx={{ width: 300 }}
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

      {/* Report Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": { border: "1px solid #ccc", padding: "8px" },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Registration No.</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Sector / Occupation</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={COLS} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={26} />
                </TableCell>
              </TableRow>
            ) : paginated.length > 0 ? (
              paginated.map((r, index) => {
                const st = statusStyle(r.status);
                return (
                  <TableRow key={r.id ?? index} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{r.applicationNo}</TableCell>
                    <TableCell>{r.registrationNo || "—"}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.cid || "—"}</TableCell>
                    <TableCell>{r.gender || "—"}</TableCell>
                    <TableCell>
                      {r.serviceId === 3
                        ? r.organization || "—"
                        : [r.sector, r.occupation].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell>{r.dzongkhag || "—"}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          backgroundColor: st.bg,
                          color: st.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {r.status}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.date || "—"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={COLS} align="center" sx={{ py: 3 }}>
                  No records found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {filtered.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Showing {paginated.length} of {filtered.length} records
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default AssessorAccreditorAuditorReport;
