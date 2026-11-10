// BQF, RPL and Non-BQF programmes report
// Data: AccreditedCourse (BQF / RPL) + NonAccreditedCourse (Non-BQF)
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
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { exportToExcel } from "@/utils/exportExcel";
import ReportService from "../../api/services/internal/report/ReportService";

// Chip colours cycle through the programme types (names come from tbl_service_master)
const TYPE_COLORS = ["primary", "secondary", "success", "info", "warning"];

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

const fmtDate = (value) => toDateOnly(value) || "—";

const EMPTY_FILTERS = {
  category: "",
  level: "",
  dzongkhag: "",
  status: "",
  fromDate: "",
  toDate: "",
  search: "",
};

const BQFRPLNonBQFProgrammesReport = () => {
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
      const res = await ReportService.getProgrammesReport(access_token);
      if (res instanceof Error || res?.isAxiosError) throw res;
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data
          .map((r) => ({
            key: `${r.service_id}-${r.application_no}-${r.id}`,
            applicationNo: r.application_no || "N/A",
            category: r.programme_category || "Not set",
            programme: r.programme_title || "N/A",
            level: r.certification_level || "",
            sector: r.sector_name || "",
            occupation: r.occupation_name || "",
            institute: r.institute_name || "",
            dzongkhag: r.dzongkhag_name || "",
            fees: r.fees_per_trainee ?? "",
            capacity: r.enrolment_capacity ?? "",
            registrationDate: toDateOnly(r.registration_date),
            validityDate: toDateOnly(r.validity_date),
            status: r.status_name || "Pending",
            date: toDateOnly(r.created_at),
          }))
          // newest first across both sources
          .sort((a, b) => String(b.date).localeCompare(String(a.date))),
      );
    } catch (error) {
      console.error("Error loading programmes report:", error);
      toast.error("Failed to load the report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    load();
  }, [load]);

  // dropdown options from the data (level list follows the chosen category)
  const options = useMemo(() => {
    const uniq = (list, key) =>
      [...new Set(list.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      );
    const inCategory = filters.category
      ? rows.filter((r) => r.category === filters.category)
      : rows;
    return {
      categories: uniq(rows, "category"),
      levels: uniq(inCategory, "level"),
      dzongkhags: uniq(rows, "dzongkhag"),
      statuses: uniq(rows, "status"),
    };
  }, [rows, filters.category]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" ? { level: "" } : {}),
    }));
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
        (!filters.category || r.category === filters.category) &&
        (!filters.level || r.level === filters.level) &&
        (!filters.dzongkhag || r.dzongkhag === filters.dzongkhag) &&
        (!filters.status || r.status === filters.status) &&
        // created_at date range (inclusive)
        (!filters.fromDate || (r.date && r.date >= filters.fromDate)) &&
        (!filters.toDate || (r.date && r.date <= filters.toDate)) &&
        (!s ||
          has(r.applicationNo) ||
          has(r.programme) ||
          has(r.institute) ||
          has(r.sector) ||
          has(r.occupation)),
    );
  }, [rows, filters]);

  const categoryColor = (c) => {
    const i = options.categories.indexOf(c);
    return i >= 0 ? TYPE_COLORS[i % TYPE_COLORS.length] : "default";
  };

  const summary = useMemo(
    () =>
      options.categories.map((c) => ({
        label: c,
        n: filtered.filter((r) => r.category === c).length,
      })),
    [filtered, options.categories],
  );

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExcelExport = () => {
    const data = filtered.map((r, i) => ({
      SlNo: i + 1,
      ApplicationNo: r.applicationNo,
      Category: r.category,
      Programme: r.programme,
      CertificateLevel: r.level,
      Sector: r.sector,
      Occupation: r.occupation,
      Institute: r.institute,
      Location: r.dzongkhag,
      FeesPerTrainee: r.fees,
      EnrolmentCapacity: r.capacity,
      RegistrationDate: r.registrationDate,
      ValidityDate: r.validityDate,
      Status: r.status,
      AppliedOn: r.date,
    }));
    const part = filters.category ? filters.category.replace(/[^\w-]+/g, "_") : "All";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(data, `Programmes_${part}_${today}`);
  };

  const COLS = 10;

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        BQF, RPL & Non-BQF Programmes Report
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Programme Type"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Types</MenuItem>
            {options.categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Certificate Level"
            name="level"
            value={filters.level}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Levels</MenuItem>
            {options.levels.map((v) => (
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
            {options.dzongkhags.map((v) => (
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
            {options.statuses.map((v) => (
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
        <Grid item>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {summary.map((c) => (
              <Chip
                key={c.label}
                size="small"
                variant="outlined"
                color={categoryColor(c.label)}
                label={`${c.label}: ${c.n}`}
              />
            ))}
          </Box>
        </Grid>
        <Grid item sx={{ ml: "auto" }}>
          <TextField
            size="small"
            placeholder="Search by programme, institute, application no..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            sx={{ width: 320 }}
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
              <TableCell>Type</TableCell>
              <TableCell>Programme</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Capacity</TableCell>
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
                  <TableRow key={r.key} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{r.applicationNo}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.category}
                        color={categoryColor(r.category)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{r.programme}</TableCell>
                    <TableCell>{r.level || "—"}</TableCell>
                    <TableCell>{r.institute || "—"}</TableCell>
                    <TableCell>{r.dzongkhag || "—"}</TableCell>
                    <TableCell align="center">{r.capacity === "" ? "—" : r.capacity}</TableCell>
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
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(r.date)}</TableCell>
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

export default BQFRPLNonBQFProgrammesReport;
