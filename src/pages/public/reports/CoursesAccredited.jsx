import React, { useState, useMemo } from "react";
import {
  Paper, Typography, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, InputAdornment, Box, Divider, TablePagination,
  Chip, IconButton, TableSortLabel, alpha, Stack, Collapse,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

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

// ── Data ──────────────────────────────────────────────────────────────────────
const COURSES = [
  {
    id: 1,
    course: "Excavator Operator",
    certLevel: "BQF Certificate 2",
    institutes: [
      { id: 1, name: "Jigme Wangchuck Power Training Institute", location: "Thimphu", contact: "77105319", email: "jwpti@gov.bt" },
      { id: 2, name: "Samthang Technical Training Institute", location: "Wangdue Phodrang", contact: "17234567", email: "tti.samthang@gmail.com" },
      { id: 3, name: "Paro Vocational Training Centre", location: "Paro", contact: "77345678", email: "pvtc@gov.bt" },
    ],
  },
  {
    id: 2,
    course: "Automotive Technician",
    certLevel: "BQF Certificate 2",
    institutes: [
      { id: 1, name: "Jigme Wangchuck Power Training Institute", location: "Thimphu", contact: "77105319", email: "jwpti@gov.bt" },
      { id: 2, name: "Bhutan Polytechnic Institute", location: "Chhukha", contact: "17456789", email: "bpi@moe.bt" },
    ],
  },
  {
    id: 3,
    course: "Welding",
    certLevel: "BQF Certificate 3",
    institutes: [
      { id: 1, name: "Samthang Technical Training Institute", location: "Wangdue Phodrang", contact: "17234567", email: "tti.samthang@gmail.com" },
      { id: 2, name: "Technical Training Institute Chumey", location: "Bumthang", contact: "77567890", email: "ttic@gov.bt" },
      { id: 3, name: "Chhukha Assessment Centre", location: "Chhukha", contact: "17345678", email: "cac@bhutan.bt" },
    ],
  },
  {
    id: 4,
    course: "Plumbing",
    certLevel: "BQF Certificate 3",
    institutes: [
      { id: 1, name: "Technical Training Institute Chumey", location: "Bumthang", contact: "77567890", email: "ttic@gov.bt" },
      { id: 2, name: "Paro Vocational Training Centre", location: "Paro", contact: "77345678", email: "pvtc@gov.bt" },
    ],
  },
  {
    id: 5,
    course: "Heavy Vehicle Driving",
    certLevel: "BQF Certificate 2",
    institutes: [
      { id: 1, name: "Jigme Wangchuck Power Training Institute", location: "Thimphu", contact: "77105319", email: "jwpti@gov.bt" },
    ],
  },
  {
    id: 6,
    course: "Electrical Wiring",
    certLevel: "BQF Certificate 3",
    institutes: [
      { id: 1, name: "Jigme Wangchuck Power Training Institute", location: "Thimphu", contact: "77105319", email: "jwpti@gov.bt" },
      { id: 2, name: "Trongsa Assessment Hub", location: "Trongsa", contact: "77678901", email: "tah@trongsa.bt" },
      { id: 3, name: "Bhutan Polytechnic Institute", location: "Chhukha", contact: "17456789", email: "bpi@moe.bt" },
    ],
  },
  {
    id: 7,
    course: "Masonry",
    certLevel: "BQF Certificate 2",
    institutes: [
      { id: 1, name: "Samthang Technical Training Institute", location: "Wangdue Phodrang", contact: "17234567", email: "tti.samthang@gmail.com" },
      { id: 2, name: "Paro Vocational Training Centre", location: "Paro", contact: "77345678", email: "pvtc@gov.bt" },
    ],
  },
  {
    id: 8,
    course: "Wood Carving and Mask Carving",
    certLevel: "Diploma",
    institutes: [
      { id: 1, name: "National Institute for Zorig Chusum", location: "Thimphu", contact: "17890123", email: "nizc@moe.bt" },
    ],
  },
  {
    id: 9,
    course: "Agriculture Technology",
    certLevel: "BQF Certificate 2",
    institutes: [
      { id: 1, name: "Punakha Skills Centre", location: "Punakha", contact: "17456789", email: "psc@punakha.bt" },
      { id: 2, name: "Paro Vocational Training Centre", location: "Paro", contact: "77345678", email: "pvtc@gov.bt" },
    ],
  },
  {
    id: 10,
    course: "Solar Panel Installation",
    certLevel: "BQF Certificate 2",
    institutes: [
      { id: 1, name: "Paro Vocational Training Centre", location: "Paro", contact: "77345678", email: "pvtc@gov.bt" },
      { id: 2, name: "Trongsa Assessment Hub", location: "Trongsa", contact: "77678901", email: "tah@trongsa.bt" },
    ],
  },
  {
    id: 11,
    course: "Construction Safety",
    certLevel: "BQF Certificate 1",
    institutes: [
      { id: 1, name: "Chhukha Assessment Centre", location: "Chhukha", contact: "17345678", email: "cac@bhutan.bt" },
      { id: 2, name: "Samthang Technical Training Institute", location: "Wangdue Phodrang", contact: "17234567", email: "tti.samthang@gmail.com" },
    ],
  },
  {
    id: 12,
    course: "Handicraft & Weaving",
    certLevel: "BQF Certificate 1",
    institutes: [
      { id: 1, name: "National Institute for Zorig Chusum", location: "Thimphu", contact: "17890123", email: "nizc@moe.bt" },
      { id: 2, name: "Mongar Community Training", location: "Mongar", contact: "17567890", email: "mct@mongar.bt" },
    ],
  },
];

const CERT_COLORS = {
  "BQF Certificate 1": { bg: alpha("#C9A84C", 0.1), color: "#7A600A", border: alpha("#C9A84C", 0.3) },
  "BQF Certificate 2": { bg: alpha("#1B3A6B", 0.08), color: "#1B3A6B", border: alpha("#1B3A6B", 0.2) },
  "BQF Certificate 3": { bg: alpha("#1A6B4A", 0.08), color: "#1A6B4A", border: alpha("#1A6B4A", 0.2) },
  "Diploma": { bg: alpha("#6B1A6B", 0.08), color: "#6B1A6B", border: alpha("#6B1A6B", 0.2) },
};

// ── Expandable Row ────────────────────────────────────────────────────────────
const CourseRow = ({ row, idx }) => {
  const [open, setOpen] = useState(false);
  const cert = CERT_COLORS[row.certLevel] ?? CERT_COLORS["BQF Certificate 2"];

  return (
    <>
      {/* Main course row */}
      <TableRow
        onClick={() => setOpen((o) => !o)}
        sx={{
          cursor: "pointer",
          "&:nth-of-type(even)": { backgroundColor: alpha("#1B3A6B", 0.015) },
          "&:hover": { backgroundColor: alpha("#1B3A6B", 0.04) },
          "&:last-child td": { borderBottom: open ? undefined : 0 },
          transition: "background-color 0.15s",
        }}
      >
        {/* # */}
        <TableCell sx={{ width: "4%" }}>
          <Typography variant="caption" color="text.disabled" fontWeight={600} fontFamily="monospace">
            {String(idx + 1).padStart(2, "0")}
          </Typography>
        </TableCell>

        {/* Course */}
        <TableCell sx={{ width: "30%" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SchoolOutlinedIcon sx={{ fontSize: 15, color: alpha("#1B3A6B", 0.45), flexShrink: 0 }} />
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {row.course}
            </Typography>
          </Stack>
        </TableCell>

        {/* Certificate Level */}
        <TableCell sx={{ width: "18%" }}>
          <Chip
            label={row.certLevel}
            size="small"
            sx={{
              height: 24, fontSize: "0.77rem", fontWeight: 600,
              backgroundColor: cert.bg, color: cert.color,
              border: `1px solid ${cert.border}`,
            }}
          />
        </TableCell>

        {/* No. of Institutes */}
        <TableCell sx={{ width: "16%" }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <AccountBalanceOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {row.institutes.length} institute{row.institutes.length !== 1 ? "s" : ""}
            </Typography>
          </Stack>
        </TableCell>

        {/* Expand toggle */}
        <TableCell sx={{ width: "5%" }} align="right">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            sx={{
              borderRadius: 1.5,
              backgroundColor: open ? alpha("#1B3A6B", 0.08) : "transparent",
              color: open ? "primary.main" : "text.secondary",
              "&:hover": { backgroundColor: alpha("#1B3A6B", 0.1) },
              transition: "all 0.15s",
            }}
          >
            {open ? <KeyboardArrowUpIcon sx={{ fontSize: 18 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded institute rows */}
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{
              mx: 2, mb: 1.5,
              border: "1px solid",
              borderColor: alpha("#1B3A6B", 0.12),
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: alpha("#F0F4FA", 0.6),
            }}>
              {/* Sub-table header */}
              <Box sx={{
                px: 2, py: 1,
                backgroundColor: alpha("#1B3A6B", 0.06),
                borderBottom: "1px solid",
                borderColor: alpha("#1B3A6B", 0.1),
              }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceOutlinedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                  <Typography variant="caption" fontWeight={700} color="primary.main"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Institutes offering this course
                  </Typography>
                </Stack>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha("#1B3A6B", 0.03) }}>
                    {["#", "Institute Name", "Location", "Contact No", "Email"].map((h) => (
                      <TableCell key={h} sx={{
                        fontSize: "0.72rem", fontWeight: 700, color: "text.secondary",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        borderBottom: `1px solid ${alpha("#1B3A6B", 0.1)}`,
                        py: "8px",
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.institutes.map((inst, i) => (
                    <TableRow key={inst.id} sx={{
                      "&:last-child td": { borderBottom: 0 },
                      "&:hover": { backgroundColor: alpha("#1B3A6B", 0.03) },
                    }}>
                      {/* # */}
                      <TableCell sx={{ width: "4%", py: "9px" }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={600} fontFamily="monospace">
                          {String(i + 1).padStart(2, "0")}
                        </Typography>
                      </TableCell>

                      {/* Institute Name */}
                      <TableCell sx={{ width: "32%" }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <AccountBalanceOutlinedIcon sx={{ fontSize: 13, color: alpha("#1B3A6B", 0.4), flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {inst.name}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Location */}
                      <TableCell sx={{ width: "18%" }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOnOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                          <Typography variant="body2" color="text.secondary">{inst.location}</Typography>
                        </Stack>
                      </TableCell>

                      {/* Contact */}
                      <TableCell sx={{ width: "16%" }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <PhoneOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                            {inst.contact}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Email */}
                      <TableCell sx={{ width: "30%" }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <EmailOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                          <Typography variant="body2" sx={{
                            color: "primary.main", fontWeight: 500,
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}>
                            {inst.email}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const CoursesAccredited = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filtered = useMemo(() => {
    let result = COURSES.filter((r) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        r.course.toLowerCase().includes(s) ||
        r.certLevel.toLowerCase().includes(s) ||
        r.institutes.some(
          (inst) =>
            inst.name.toLowerCase().includes(s) ||
            inst.location.toLowerCase().includes(s) ||
            inst.email.toLowerCase().includes(s) ||
            inst.contact.includes(s)
        )
      );
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let av = sortConfig.key === "institutes" ? a.institutes.length : a[sortConfig.key];
        let bv = sortConfig.key === "institutes" ? b.institutes.length : b[sortConfig.key];
        if (typeof av === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
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
    { id: "id", label: "#", width: "4%", noSort: true },
    { id: "course", label: "Course", width: "30%" },
    { id: "certLevel", label: "Certificate Level", width: "18%" },
    { id: "institutes", label: "No. of Institutes", width: "16%" },
    { id: "expand", label: "", width: "5%", noSort: true },
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
              <VerifiedOutlinedIcon sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Typography variant="h5" color="text.primary">
              Courses Accredited
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
                  {" "}course{filtered.length !== 1 ? "s" : ""}
                  <Box component="span" color="text.disabled" fontWeight={400}>
                    {" "}· click a row to expand institutes
                  </Box>
                </Typography>
              </Stack>
              <TextField
                size="small"
                placeholder="Search course, institute, location…"
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
          <TableContainer sx={{ maxHeight: "68vh" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.id} width={col.width}
                      sx={{ backgroundColor: "#F8FAFB", borderBottom: "2px solid", borderColor: "divider", py: "10px" }}>
                      {col.noSort ? (
                        <Typography sx={{
                          fontSize: "0.78rem", fontWeight: 700, color: "text.secondary",
                          textTransform: "uppercase", letterSpacing: "0.06em"
                        }}>
                          {col.label}
                        </Typography>
                      ) : (
                        <TableSortLabel
                          active={sortConfig.key === col.id}
                          direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                          onClick={() => handleSort(col.id)}
                          sx={sortLabelSx(sortConfig.key === col.id)}
                        >
                          {col.label}
                        </TableSortLabel>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginated.length > 0 ? (
                  paginated.map((row, idx) => (
                    <CourseRow key={row.id} row={row} idx={page * rowsPerPage + idx} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <VerifiedOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary" fontWeight={600}>
                        No courses found
                      </Typography>
                      <Typography variant="body2" color="text.disabled" mt={0.5}>
                        {search ? "Try a different search term" : "No accredited course data available"}
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
              courses
            </Typography>
            <TablePagination
              rowsPerPageOptions={[5, 8, 15, 25]}
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

export default CoursesAccredited;