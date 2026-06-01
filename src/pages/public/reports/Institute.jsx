import React, { useState, useMemo } from "react";
import {
  Paper, Typography, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, InputAdornment, Box, Divider, TablePagination,
  Chip, IconButton, TableSortLabel, alpha, Stack, Select, MenuItem,
  FormControl, InputLabel, Modal, Backdrop, Fade, Button,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

// ── Theme (shared with Assessor) ──────────────────────────────────────────────
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
    MuiTableCell: { styleOverrides: { root: { borderColor: "#EDF0F5", padding: "11px 16px" } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6 } } },
  },
});

// ── Constants ─────────────────────────────────────────────────────────────────
const DZONGKHAGS = [
  "Bumthang", "Chhukha", "Dagana", "Gasa", "Haa", "Lhuntse", "Mongar", "Paro",
  "Pema Gatshel", "Punakha", "Samdrup Jongkhar", "Samtse", "Sarpang", "Thimphu",
  "Trashigang", "Trashi Yangtse", "Trongsa", "Tsirang", "Wangdue Phodrang", "Zhemgang",
];

const REG_TYPES = ["Institute", "SES Centre", "Assessment Centre"];

// ── Sample Data ───────────────────────────────────────────────────────────────
const INSTITUTES = [
  {
    id: 1, regNo: "2026030239", name: "AAA Skills Institute", dzongkhag: "Thimphu",
    contactNo: "77111590", ownership: "Private (Partnership)", email: "sonamtenzy@gmail.com",
    validityTill: "Mar 30th 2027", type: "Institute", sector: "Private",
    courses: [
      { id: 1, title: "Heavy Vehicle Driving", theory: 432, practical: 84, ojt: null, total: 516, feesPerHead: null, enrollment: 12, certLevel: "BQF Certificate 2", accredited: "Yes" },
      { id: 2, title: "Automotive Technician", theory: 432, practical: 84, ojt: null, total: 516, feesPerHead: null, enrollment: 30, certLevel: "BQF Certificate 2", accredited: "Yes" },
      { id: 3, title: "Auto Electrician", theory: 432, practical: 84, ojt: null, total: 516, feesPerHead: null, enrollment: 30, certLevel: "BQF Certificate 3", accredited: "Yes" },
      { id: 4, title: "Heavy Auto Mechanic", theory: null, practical: null, ojt: null, total: null, feesPerHead: null, enrollment: 21, certLevel: "BQF Certificate 2", accredited: "Yes" },
      { id: 5, title: "Excavator Operator", theory: 432, practical: 84, ojt: null, total: 516, feesPerHead: null, enrollment: 12, certLevel: "BQF Certificate 2", accredited: "Yes" },
    ],
  },
  {
    id: 2, regNo: "2020090593", name: "Athang Learning Institute", dzongkhag: "Thimphu",
    contactNo: "17172141", ownership: "Private (Partnership)", email: "choki@athang.com",
    validityTill: "Sep 9th 2026", type: "Institute", sector: "Private",
    courses: [
      { id: 1, title: "Carpentry", theory: 240, practical: 120, ojt: 60, total: 420, feesPerHead: 500, enrollment: 20, certLevel: "BQF Certificate 2", accredited: "Yes" },
      { id: 2, title: "Plumbing", theory: 200, practical: 100, ojt: 50, total: 350, feesPerHead: 450, enrollment: 15, certLevel: "BQF Certificate 2", accredited: "No" },
    ],
  },
  {
    id: 3, regNo: "2015050068", name: "Samthang Technical Training Institute", dzongkhag: "Wangdue Phodrang",
    contactNo: "77105319", ownership: "Public (Govt.)", email: "tti.samthang@gmail.com",
    validityTill: "May 13th 2029", type: "Institute", sector: "Public (Govt.)",
    courses: [
      { id: 1, title: "Welding", theory: 300, practical: 150, ojt: 80, total: 530, feesPerHead: null, enrollment: 25, certLevel: "BQF Certificate 3", accredited: "Yes" },
      { id: 2, title: "Masonry", theory: 280, practical: 140, ojt: 70, total: 490, feesPerHead: null, enrollment: 18, certLevel: "BQF Certificate 2", accredited: "Yes" },
    ],
  },
  {
    id: 4, regNo: "2018070112", name: "Paro Vocational Training Centre", dzongkhag: "Paro",
    contactNo: "77234567", ownership: "Public (Govt.)", email: "pvtc@gov.bt",
    validityTill: "Jun 15th 2028", type: "SES Centre", sector: "Public (Govt.)",
    courses: [
      { id: 1, title: "Solar Panel Installation", theory: 180, practical: 90, ojt: 40, total: 310, feesPerHead: null, enrollment: 22, certLevel: "BQF Certificate 2", accredited: "Yes" },
    ],
  },
  {
    id: 5, regNo: "2022011045", name: "Chhukha Assessment Centre", dzongkhag: "Chhukha",
    contactNo: "17345678", ownership: "Private (Company)", email: "cac@bhutan.bt",
    validityTill: "Dec 1st 2027", type: "Assessment Centre", sector: "Private",
    courses: [
      { id: 1, title: "Construction Safety", theory: 100, practical: 50, ojt: null, total: 150, feesPerHead: 300, enrollment: 40, certLevel: "BQF Certificate 1", accredited: "Yes" },
      { id: 2, title: "Equipment Operation", theory: 200, practical: 100, ojt: 60, total: 360, feesPerHead: 400, enrollment: 35, certLevel: "BQF Certificate 2", accredited: "Yes" },
    ],
  },
  {
    id: 6, regNo: "2019030287", name: "Punakha Skills Centre", dzongkhag: "Punakha",
    contactNo: "17456789", ownership: "Private (Partnership)", email: "psc@punakha.bt",
    validityTill: "Apr 20th 2026", type: "SES Centre", sector: "Private",
    courses: [
      { id: 1, title: "Agriculture Technology", theory: 160, practical: 80, ojt: 40, total: 280, feesPerHead: 200, enrollment: 30, certLevel: "BQF Certificate 2", accredited: "No" },
    ],
  },
  {
    id: 7, regNo: "2021050399", name: "Mongar Community Training", dzongkhag: "Mongar",
    contactNo: "17567890", ownership: "NGO", email: "mct@mongar.bt",
    validityTill: "Nov 30th 2028", type: "Institute", sector: "NGO",
    courses: [
      { id: 1, title: "Handicraft & Weaving", theory: 120, practical: 200, ojt: null, total: 320, feesPerHead: 100, enrollment: 28, certLevel: "BQF Certificate 1", accredited: "Yes" },
    ],
  },
  {
    id: 8, regNo: "2023020801", name: "Trongsa Assessment Hub", dzongkhag: "Trongsa",
    contactNo: "77678901", ownership: "Public (Govt.)", email: "tah@trongsa.bt",
    validityTill: "Feb 28th 2030", type: "Assessment Centre", sector: "Public (Govt.)",
    courses: [
      { id: 1, title: "Electrical Wiring", theory: 220, practical: 110, ojt: 55, total: 385, feesPerHead: null, enrollment: 16, certLevel: "BQF Certificate 3", accredited: "Yes" },
      { id: 2, title: "Plumbing & Sanitation", theory: 200, practical: 100, ojt: 50, total: 350, feesPerHead: null, enrollment: 20, certLevel: "BQF Certificate 2", accredited: "Yes" },
    ],
  },
];

// ── Shared sort label sx ──────────────────────────────────────────────────────
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

// ── Course Details Modal ──────────────────────────────────────────────────────
const CourseModal = ({ institute, onClose }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedCourses = useMemo(() => {
    if (!sortConfig.key || !institute) return institute?.courses ?? [];
    return [...institute.courses].sort((a, b) => {
      let av = a[sortConfig.key], bv = b[sortConfig.key];
      if (av == null) av = "";
      if (bv == null) bv = "";
      if (typeof av === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
      av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [institute, sortConfig]);

  if (!institute) return null;

  const courseCols = [
    { id: "id", label: "#", width: "4%" },
    { id: "title", label: "Course Title", width: "18%" },
    { id: "theory", label: "Theory (hrs)", width: "10%" },
    { id: "practical", label: "Practical (hrs)", width: "11%" },
    { id: "ojt", label: "OJT (hrs)", width: "9%" },
    { id: "total", label: "Total (hrs)", width: "9%" },
    { id: "feesPerHead", label: "Fees Per Head", width: "10%" },
    { id: "enrollment", label: "Enrollment Per Course", width: "12%" },
    { id: "certLevel", label: "Certificate Level", width: "11%" },
    { id: "accredited", label: "Accredited", width: "6%" },
  ];

  return (
    <Modal open={!!institute} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: "rgba(10,20,50,0.45)" } } }}>
      <Fade in={!!institute}>
        <Box sx={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95vw", md: "85vw", lg: "78vw" },
          maxHeight: "88vh",
          backgroundColor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 24px 64px rgba(10,20,50,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}>
          {/* Modal Header */}
          <Box sx={{
            px: 3, py: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 1.5,
                background: "linear-gradient(135deg, #1B3A6B 0%, #2C5282 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <SchoolOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />
              </Box>
              <Typography variant="h6" color="text.primary">
                Institute Course Details
              </Typography>
            </Stack>
            <IconButton onClick={onClose} size="small"
              sx={{ borderRadius: 1.5, "&:hover": { backgroundColor: alpha("#1B3A6B", 0.06) } }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Info Banner */}
          <Box sx={{
            mx: 3, mt: 2.5, mb: 2,
            p: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #1B7A8A 0%, #1A9BAD 100%)",
            flexShrink: 0,
          }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1, md: 0 }}
              justifyContent="space-between">
              <Box>
                <InfoRow label="Sector" value={institute.sector} />
                <InfoRow label="Grade" value="A" />
                <InfoRow label="Email" value={institute.email} />
              </Box>
              <Box>
                <InfoRow label="Location" value={institute.dzongkhag} />
                <InfoRow label="Dzongkhag" value={institute.dzongkhag} />
                <InfoRow label="Contact No" value={institute.contactNo} />
              </Box>
              <Box>
                <InfoRow label="Registration No" value={institute.regNo} />
                <InfoRow label="Validity" value={institute.validityTill} />
              </Box>
            </Stack>
          </Box>

          {/* Course Table */}
          <Box sx={{ px: 3, pb: 3, overflow: "auto", flex: 1 }}>
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {courseCols.map((col) => (
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
                  {sortedCourses.map((course, idx) => (
                    <TableRow key={course.id} hover sx={{
                      "&:nth-of-type(even)": { backgroundColor: alpha("#1B3A6B", 0.015) },
                      "&:hover": { backgroundColor: alpha("#1B3A6B", 0.04) },
                      "&:last-child td": { borderBottom: 0 },
                      transition: "background-color 0.15s",
                    }}>
                      <TableCell>
                        <Typography variant="caption" color="text.disabled" fontWeight={600} fontFamily="monospace">
                          {String(idx + 1).padStart(2, "0")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{course.title}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{course.theory ?? "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{course.practical ?? "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{course.ojt ?? "—"}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{course.total ?? "—"}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{course.feesPerHead ?? "—"}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{
                          display: "inline-block",
                          backgroundColor: alpha("#1B3A6B", 0.06),
                          color: "primary.main",
                          px: 1, py: 0.3,
                          borderRadius: 1,
                          fontWeight: 600,
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                        }}>
                          {course.enrollment}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={course.certLevel} size="small"
                          sx={{
                            height: 24, fontSize: "0.77rem", fontWeight: 500,
                            backgroundColor: alpha("#C9A84C", 0.1),
                            color: "#7A600A",
                            border: `1px solid ${alpha("#C9A84C", 0.3)}`,
                          }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={course.accredited} size="small"
                          sx={{
                            height: 24, fontSize: "0.77rem", fontWeight: 700,
                            backgroundColor: course.accredited === "Yes" ? alpha("#1A6B4A", 0.1) : alpha("#8B1A1A", 0.1),
                            color: course.accredited === "Yes" ? "#1A6B4A" : "#8B1A1A",
                            border: `1px solid ${course.accredited === "Yes" ? alpha("#1A6B4A", 0.25) : alpha("#8B1A1A", 0.25)}`,
                          }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

const InfoRow = ({ label, value }) => (
  <Typography variant="body2" sx={{ color: "#fff", lineHeight: 1.9 }}>
    <Box component="span" fontWeight={700}>{label}</Box>
    {" - "}
    <Box component="span" sx={{ color: alpha("#fff", 0.88) }}>{value}</Box>
  </Typography>
);

// ── Dropdown filter ───────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options, icon: Icon }) => (
  <FormControl size="small" sx={{ minWidth: 180 }}>
    <InputLabel sx={{ fontSize: "0.875rem" }}>{label}</InputLabel>
    <Select
      value={value}
      label={label}
      onChange={onChange}
      startAdornment={Icon ? <Icon sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} /> : null}
      sx={{
        fontSize: "0.875rem",
        borderRadius: 2,
        backgroundColor: alpha("#1B3A6B", 0.03),
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2C5282" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1B3A6B", borderWidth: 1.5 },
      }}
    >
      <MenuItem value=""><em>All</em></MenuItem>
      {options.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: "0.875rem" }}>{o}</MenuItem>)}
    </Select>
  </FormControl>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const Institute = () => {
  const [filters, setFilters] = useState({ search: "", type: "", dzongkhag: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedInstitute, setSelectedInstitute] = useState(null);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filtered = useMemo(() => {
    let result = INSTITUTES.filter((r) => {
      if (filters.type && r.type !== filters.type) return false;
      if (filters.dzongkhag && r.dzongkhag !== filters.dzongkhag) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          r.name.toLowerCase().includes(s) ||
          r.regNo.toLowerCase().includes(s) ||
          r.dzongkhag.toLowerCase().includes(s) ||
          r.contactNo.includes(s) ||
          r.ownership.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s)
        );
      }
      return true;
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let av = a[sortConfig.key], bv = b[sortConfig.key];
        if (typeof av === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
        av = String(av ?? "").toLowerCase(); bv = String(bv ?? "").toLowerCase();
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filters, sortConfig]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(0); };

  const clearAll = () => { setFilters({ search: "", type: "", dzongkhag: "" }); setPage(0); };
  const hasFilters = filters.search || filters.type || filters.dzongkhag;

  const columns = [
    { id: "id", label: "#", width: "4%" },
    { id: "regNo", label: "Registered No.", width: "12%" },
    { id: "name", label: "Institute Name", width: "20%" },
    { id: "dzongkhag", label: "Dzongkhag", width: "10%" },
    { id: "contactNo", label: "Contact No", width: "10%" },
    { id: "ownership", label: "Ownership", width: "15%" },
    { id: "email", label: "Email", width: "15%" },
    { id: "validityTill", label: "Validity Till", width: "9%" },
    { id: "courses", label: "Course Details", width: "5%", noSort: true },
  ];

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
              <AccountBalanceOutlinedIcon sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Typography variant="h5" color="text.primary">
              Institutes Registered
            </Typography>
          </Stack>
        </Box>

        {/* ── Table Panel ── */}
        <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>

          {/* Toolbar */}
          <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap" gap={1.5}>

              {/* Left: filters */}
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <FilterSelect
                  label="Registration Type"
                  value={filters.type}
                  onChange={(e) => setFilter("type", e.target.value)}
                  options={REG_TYPES}
                />
                <FilterSelect
                  label="Dzongkhag"
                  value={filters.dzongkhag}
                  onChange={(e) => setFilter("dzongkhag", e.target.value)}
                  options={DZONGKHAGS}
                />
                {hasFilters && (
                  <Button size="small" onClick={clearAll} startIcon={<ClearIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      fontSize: "0.8125rem", color: "text.secondary", textTransform: "none",
                      "&:hover": { color: "primary.main", backgroundColor: alpha("#1B3A6B", 0.05) }
                    }}>
                    Clear
                  </Button>
                )}
              </Stack>

              {/* Right: record count + search */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <FilterListIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    <Box component="span" color="text.primary">{filtered.length}</Box>
                    {" "}record{filtered.length !== 1 ? "s" : ""}
                  </Typography>
                </Stack>
                <TextField
                  size="small"
                  placeholder="Search institute, email, contact…"
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment>,
                    endAdornment: filters.search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setFilter("search", "")}>
                          <ClearIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 280,
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

                      {/* Institute Name */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{row.name}</Typography>
                        <Chip label={row.type} size="small" sx={{
                          mt: 0.4, height: 20, fontSize: "0.72rem", fontWeight: 600,
                          backgroundColor:
                            row.type === "Institute" ? alpha("#1B3A6B", 0.08) :
                              row.type === "SES Centre" ? alpha("#1A6B4A", 0.08) :
                                alpha("#C9A84C", 0.12),
                          color:
                            row.type === "Institute" ? "#1B3A6B" :
                              row.type === "SES Centre" ? "#1A6B4A" :
                                "#7A600A",
                          border: "none",
                        }} />
                      </TableCell>

                      {/* Dzongkhag */}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                          <Typography variant="body2" color="text.secondary">{row.dzongkhag}</Typography>
                        </Stack>
                      </TableCell>

                      {/* Contact No */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontFamily="monospace">{row.contactNo}</Typography>
                      </TableCell>

                      {/* Ownership */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{row.ownership}</Typography>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180,
                        }}>
                          {row.email}
                        </Typography>
                      </TableCell>

                      {/* Validity Till */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                          {row.validityTill}
                        </Typography>
                      </TableCell>

                      {/* Course Details */}
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => setSelectedInstitute(row)}
                          sx={{
                            fontSize: "0.78rem", fontWeight: 600, textTransform: "none",
                            borderRadius: 1.5, px: 1.5, py: 0.4,
                            borderColor: alpha("#1B3A6B", 0.3),
                            color: "primary.main",
                            whiteSpace: "nowrap",
                            "&:hover": { borderColor: "primary.main", backgroundColor: alpha("#1B3A6B", 0.05) },
                          }}
                        >
                          View More
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                      <AccountBalanceOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary" fontWeight={600}>No records found</Typography>
                      <Typography variant="body2" color="text.disabled" mt={0.5}>
                        {hasFilters ? "Try adjusting your filters or search term" : "No institute data available"}
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

      {/* Course Details Modal */}
      <CourseModal institute={selectedInstitute} onClose={() => setSelectedInstitute(null)} />
    </ThemeProvider>
  );
};

export default Institute;