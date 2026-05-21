import React, { useState, useMemo } from "react";
import {
  Paper, Typography, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, InputAdornment, Box, Divider, TablePagination,
  Chip, IconButton, TableSortLabel, alpha, Stack,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";

// ── Theme ─────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1B3A6B", light: "#2C5282", dark: "#122952" },
    secondary: { main: "#C9A84C", light: "#D4B96A", dark: "#A8832C" },
    background: { default: "#F4F6F9", paper: "#FFFFFF" },
    text: { primary: "#1A2540", secondary: "#5A6A85" },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    body2: { fontSize: "0.8625rem" },
    caption: { fontSize: "0.75rem", letterSpacing: "0.04em" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiTableCell: { styleOverrides: { root: { borderColor: "#EDF0F5", padding: "11px 16px" } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6 } } },
  },
});

// ── Sample Data ───────────────────────────────────────────────────────────────
const TRAINERS = [
  {
    id: 1, regNo: "2025050157", name: "Agam Singh Thara",
    courses: ["Mechanical (Diploma)"],
    institute: "Jigme Wangchuck Power Training Institute",
  },
  {
    id: 2, regNo: "2014020251", name: "Bharat Gurung",
    courses: ["Transmission and distribution (BQF Certificate 2)", "Industrial wiring (BQF Certificate 3)"],
    institute: "Jigme Wangchuck Power Training Institute",
  },
  {
    id: 3, regNo: "2022080068", name: "Bibika Rai",
    courses: ["Plumbing (BQF Certificate 3)"],
    institute: "Technical Training Institute Chumey",
  },
  {
    id: 4, regNo: "2022060045", name: "Boj Raj Pokhral",
    courses: ["Mechanical welder and Fitter (BQF Certificate 2)"],
    institute: "Jigme Wangchuck Power Training Institute",
  },
  {
    id: 5, regNo: "2014060157", name: "Bumpa Dorji",
    courses: ["Wood carving and mask carving (Diploma)"],
    institute: "National Institute for Zorig Chusum",
  },
  {
    id: 6, regNo: "2019030112", name: "Chimi Wangmo",
    courses: ["Automotive Technician (BQF Certificate 2)"],
    institute: "Bhutan Polytechnic Institute",
  },
  {
    id: 7, regNo: "2021050399", name: "Dawa Tshering",
    courses: ["Electrical Wiring (BQF Certificate 3)", "Solar Panel Installation (BQF Certificate 2)"],
    institute: "Technical Training Institute Chumey",
  },
  {
    id: 8, regNo: "2017080204", name: "Karma Lhamo",
    courses: ["Handicraft & Weaving (Diploma)"],
    institute: "National Institute for Zorig Chusum",
  },
  {
    id: 9, regNo: "2023010567", name: "Pema Tshomo",
    courses: ["Construction Safety (BQF Certificate 1)"],
    institute: "Samthang Technical Training Institute",
  },
  {
    id: 10, regNo: "2016040321", name: "Sonam Wangchuk",
    courses: ["Heavy Vehicle Driving (BQF Certificate 2)", "Excavator Operator (BQF Certificate 2)"],
    institute: "Jigme Wangchuck Power Training Institute",
  },
  {
    id: 11, regNo: "2020070088", name: "Tashi Dema",
    courses: ["Agriculture Technology (BQF Certificate 2)"],
    institute: "Paro Vocational Training Centre",
  },
  {
    id: 12, regNo: "2018090145", name: "Ugyen Dorji",
    courses: ["Welding (BQF Certificate 3)", "Masonry (BQF Certificate 2)"],
    institute: "Samthang Technical Training Institute",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const Trainer = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filtered = useMemo(() => {
    let result = TRAINERS.filter((r) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(s) ||
        r.regNo.includes(s) ||
        r.institute.toLowerCase().includes(s) ||
        r.courses.some((c) => c.toLowerCase().includes(s))
      );
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let av = sortConfig.key === "courses" ? a.courses.join(", ") : a[sortConfig.key];
        let bv = sortConfig.key === "courses" ? b.courses.join(", ") : b[sortConfig.key];
        av = String(av ?? "").toLowerCase();
        bv = String(bv ?? "").toLowerCase();
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [search, sortConfig]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns = [
    { id: "id", label: "#", width: "4%" },
    { id: "regNo", label: "Registered No.", width: "13%" },
    { id: "name", label: "Name", width: "17%" },
    { id: "courses", label: "Course", width: "38%" },
    { id: "institute", label: "Institute", width: "28%" },
  ];

  const sortLabelSx = (active) => ({
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "text.secondary",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    "&.Mui-active": { color: "primary.main" },
    "& .MuiTableSortLabel-icon": { fontSize: 16, opacity: active ? 1 : 0.35 },
    "&:hover .MuiTableSortLabel-icon": { opacity: 1 },
  });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", p: { xs: 2, md: 3.5 } }}>

        {/* ── Page Header ── */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: "linear-gradient(135deg, #1B3A6B 0%, #2C5282 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <PersonOutlineIcon sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Typography variant="h5" color="text.primary">
              Trainers Registered
            </Typography>
          </Stack>
        </Box>

        {/* ── Table Panel ── */}
        <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>

          {/* Toolbar */}
          <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <FilterListIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  <Box component="span" color="text.primary">{filtered.length}</Box>
                  {" "}record{filtered.length !== 1 ? "s" : ""}
                </Typography>
              </Stack>
              <TextField
                size="small"
                placeholder="Search name, course, institute…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearch(""); setPage(0); }}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: 300,
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.875rem", borderRadius: 2,
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
          <TableContainer sx={{ maxHeight: "60vh" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.id} width={col.width}
                      sx={{ backgroundColor: "#F8FAFB", borderBottom: "2px solid", borderColor: "divider", py: "10px" }}>
                      <TableSortLabel
                        active={sortConfig.key === col.id}
                        direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                        onClick={() => handleSort(col.id)}
                        sx={sortLabelSx(sortConfig.key === col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginated.length > 0 ? (
                  paginated.map((row, idx) => (
                    <TableRow key={row.id} hover sx={{
                      "&:nth-of-type(even)": { backgroundColor: alpha("#1B3A6B", 0.015) },
                      "&:hover": { backgroundColor: alpha("#1B3A6B", 0.04) },
                      "&:last-child td": { borderBottom: 0 },
                      transition: "background-color 0.15s",
                    }}>
                      {/* # */}
                      <TableCell>
                        <Typography variant="caption" color="text.disabled" fontWeight={600} fontFamily="monospace">
                          {String(page * rowsPerPage + idx + 1).padStart(2, "0")}
                        </Typography>
                      </TableCell>

                      {/* Registered No */}
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" sx={{
                          backgroundColor: alpha("#1B3A6B", 0.06), color: "primary.main",
                          px: 1, py: 0.4, borderRadius: 1, fontWeight: 600, letterSpacing: "0.04em",
                        }}>
                          {row.regNo}
                        </Typography>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {row.name}
                        </Typography>
                      </TableCell>

                      {/* Course(s) */}
                      <TableCell>
                        <Stack spacing={0.6}>
                          {row.courses.map((course, i) => (
                            <Stack key={i} direction="row" alignItems="center" spacing={0.75}>
                              <SchoolOutlinedIcon sx={{ fontSize: 13, color: "text.disabled", flexShrink: 0 }} />
                              <Typography variant="body2" color="text.primary">
                                {course}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </TableCell>

                      {/* Institute */}
                      <TableCell>
                        <Stack direction="row" alignItems="flex-start" spacing={0.75}>
                          <AccountBalanceOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", mt: "2px", flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary">
                            {row.institute}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                      <PersonOutlineIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary" fontWeight={600}>
                        No records found
                      </Typography>
                      <Typography variant="body2" color="text.disabled" mt={0.5}>
                        {search ? "Try a different search term" : "No trainer data available"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer */}
          <Box sx={{
            px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider",
            backgroundColor: "#FAFBFC", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <Typography variant="caption" color="text.secondary">
              Showing{" "}
              <Box component="span" fontWeight={700} color="text.primary">
                {paginated.length > 0 ? page * rowsPerPage + 1 : 0}–
                {Math.min((page + 1) * rowsPerPage, filtered.length)}
              </Box>{" "}
              of{" "}
              <Box component="span" fontWeight={700} color="text.primary">{filtered.length}</Box>{" "}
              records
            </Typography>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filtered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{
                ".MuiTablePagination-toolbar": { minHeight: 40, p: 0 },
                ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                  fontSize: "0.8125rem", margin: 0, color: "text.secondary",
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

export default Trainer;