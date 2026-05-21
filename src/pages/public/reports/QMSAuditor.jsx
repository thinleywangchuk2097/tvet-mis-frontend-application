import React, { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  InputAdornment,
  Box,
  Divider,
  TablePagination,
  Chip,
  IconButton,
  TableSortLabel,
  alpha,
  Stack,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

// ── Custom theme ─────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1B3A6B", light: "#2C5282", dark: "#122952" },
    secondary: { main: "#C9A84C", light: "#D4B96A", dark: "#A8832C" },
    success: { main: "#1A6B4A", light: "#E8F5EE" },
    error: { main: "#8B1A1A", light: "#FDEAEA" },
    background: { default: "#F4F6F9", paper: "#FFFFFF" },
    text: { primary: "#1A2540", secondary: "#5A6A85" },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    body2: { fontSize: "0.8625rem" },
    caption: { fontSize: "0.75rem", letterSpacing: "0.04em" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#EDF0F5", padding: "11px 16px" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
  },
});

// ── Main Component ─────────────────────────────────────────────────────────────

// ── Main Component ─────────────────────────────────────────────────────────────
const QMSAuditor = () => {
  const [filters, setFilters] = useState({ search: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [reports] = useState([
    { id: 1, name: "Pema Dorji", cid: "1160400783", gender: "M", course: "Excavator Operator", certificate: "BQF Certificate 2", result: "Competent" },
    { id: 2, name: "Tashi", cid: "1160400909", gender: "M", course: "Excavator Operator", certificate: "BQF Certificate 2", result: "Competent" },
    { id: 3, name: "Pema Lhamo", cid: "1160400783", gender: "F", course: "Excavator Operator", certificate: "BQF Certificate 2", result: "Not Competent" },
    { id: 4, name: "Wahgchuk Pemo", cid: "189700202", gender: "F", course: "Excavator Operator", certificate: "BQF Certificate 2", result: "Competent" },
    { id: 5, name: "Tashi Pemo", cid: "189702022", gender: "F", course: "Excavator Operator", certificate: "BQF Certificate 2", result: "Not Competent" },
    { id: 6, name: "Tindin", cid: "189700227", gender: "M", course: "Heavy Machinery", certificate: "BQF Certificate 3", result: "Competent" },
    { id: 7, name: "Wahgchuk", cid: "18970020", gender: "F", course: "Excavator Operator", certificate: "BQF Certificate 2", result: "Not Competent" },
  ]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedReports = useMemo(() => {
    let result = reports.filter((r) => {
      if (!filters.search) return true;
      const s = filters.search.toLowerCase();
      return (
        r.name.toLowerCase().includes(s) ||
        r.cid.toLowerCase().includes(s) ||
        r.course.toLowerCase().includes(s) ||
        r.certificate.toLowerCase().includes(s) ||
        r.result.toLowerCase().includes(s)
      );
    });
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let av = a[sortConfig.key], bv = b[sortConfig.key];
        if (typeof av === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
        av = av.toLowerCase(); bv = bv.toLowerCase();
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [reports, filters.search, sortConfig]);

  const paginated = filteredAndSortedReports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns = [
    { id: "id", label: "#", width: "4%" },
    { id: "name", label: "Name", width: "22%" },
    { id: "cid", label: "Registration No", width: "16%" },
    { id: "gender", label: "Gender", width: "10%" },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          p: { xs: 2, md: 3.5 },
          fontFamily: theme.typography.fontFamily,
        }}
      >
        {/* ── Page Header ── */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: "linear-gradient(135deg, #1B3A6B 0%, #2C5282 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AssessmentIcon sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Typography variant="h5" color="text.primary">
              QMS Auditor Registered
            </Typography>
          </Stack>
        </Box>

        {/* ── Table Panel ── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FilterListIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  <Box component="span" color="text.primary">{filteredAndSortedReports.length}</Box>
                  {" "}record{filteredAndSortedReports.length !== 1 ? "s" : ""} found
                </Typography>
              </Stack>
              <TextField
                size="small"
                placeholder="Search candidate, course, result…"
                value={filters.search}
                onChange={(e) => { setFilters({ search: e.target.value }); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setFilters({ search: "" }); setPage(0); }}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: 300,
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.875rem",
                    borderRadius: 2,
                    backgroundColor: alpha("#1B3A6B", 0.03),
                    "& fieldset": { borderColor: "divider" },
                    "&:hover fieldset": { borderColor: "primary.light" },
                    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1.5 },
                  },
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Table */}
          <TableContainer sx={{ maxHeight: "55vh" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      width={col.width}
                      sx={{
                        backgroundColor: "#F8FAFB",
                        borderBottom: "2px solid",
                        borderColor: "divider",
                        py: "10px",
                      }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === col.id}
                        direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                        onClick={() => handleSort(col.id)}
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          "&.Mui-active": { color: "primary.main" },
                          "& .MuiTableSortLabel-icon": {
                            fontSize: 16,
                            opacity: sortConfig.key === col.id ? 1 : 0.35,
                          },
                          "&:hover .MuiTableSortLabel-icon": { opacity: 1 },
                        }}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginated.length > 0 ? (
                  paginated.map((report, idx) => {
                    return (
                      <TableRow
                        key={report.id}
                        hover
                        sx={{
                          "&:nth-of-type(even)": { backgroundColor: alpha("#1B3A6B", 0.015) },
                          "&:hover": { backgroundColor: alpha("#1B3A6B", 0.04) },
                          "&:last-child td": { borderBottom: 0 },
                          transition: "background-color 0.15s",
                        }}
                      >
                        {/* # */}
                        <TableCell>
                          <Typography variant="caption" color="text.disabled" fontWeight={600} fontFamily="monospace">
                            {String(page * rowsPerPage + idx + 1).padStart(2, "0")}
                          </Typography>
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {report.name}
                          </Typography>
                        </TableCell>

                        {/* Registration No */}
                        <TableCell>
                          <Typography
                            variant="caption"
                            fontFamily="'DM Mono', monospace"
                            sx={{
                              backgroundColor: alpha("#1B3A6B", 0.06),
                              color: "primary.main",
                              px: 1,
                              py: 0.4,
                              borderRadius: 1,
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {report.cid}
                          </Typography>
                        </TableCell>

                        {/* Gender */}
                        <TableCell>
                          <Chip
                            label={report.gender === "M" ? "Male" : "Female"}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: "0.77rem",
                              fontWeight: 600,
                              backgroundColor: report.gender === "M"
                                ? alpha("#1B3A6B", 0.08)
                                : alpha("#8B1A6B", 0.08),
                              color: report.gender === "M" ? "#1B3A6B" : "#8B1A6B",
                              border: "none",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                      <AssessmentIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary" fontWeight={600}>
                        No records found
                      </Typography>
                      <Typography variant="body2" color="text.disabled" mt={0.5}>
                        {filters.search ? "Try a different search term" : "No assessment data available"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer / Pagination */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              backgroundColor: "#FAFBFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing{" "}
              <Box component="span" fontWeight={700} color="text.primary">
                {paginated.length > 0 ? page * rowsPerPage + 1 : 0}–
                {Math.min((page + 1) * rowsPerPage, filteredAndSortedReports.length)}
              </Box>{" "}
              of{" "}
              <Box component="span" fontWeight={700} color="text.primary">
                {filteredAndSortedReports.length}
              </Box>{" "}
              records
            </Typography>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAndSortedReports.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{
                ".MuiTablePagination-toolbar": { minHeight: 40, p: 0 },
                ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                  fontSize: "0.8125rem",
                  margin: 0,
                  color: "text.secondary",
                },
                ".MuiTablePagination-actions button": {
                  borderRadius: 1.5,
                  "&:hover": { backgroundColor: alpha("#1B3A6B", 0.08) },
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default QMSAuditor;