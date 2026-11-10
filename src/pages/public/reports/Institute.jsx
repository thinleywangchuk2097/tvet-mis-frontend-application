// Public report: registered institutes and their accredited courses
import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
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
  TablePagination,
  Box,
  Grid,
  Chip,
  Button,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import {
  PAPER_PROPS,
  TABLE_SX,
  INPUT_SX,
  SELECT_SX,
  ROWS_PER_PAGE_OPTIONS,
  parseJsonArray,
} from "./reportStyles";

/** Short type label from the registration service name. */
const typeLabel = (serviceName) => {
  const n = String(serviceName || "").toLowerCase();
  if (n.includes("ses")) return "SES Centre";
  if (n.includes("assessment")) return "Assessment Centre";
  return "Institute";
};

const fmtDate = (d) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Institute validity: validity_date, or (older records) one year from the last renewal. */
const validityTill = (validityDate, renewalDate) => {
  let d = validityDate ? new Date(validityDate) : null;
  if (!d || Number.isNaN(d.getTime())) {
    if (!renewalDate) return "—";
    d = new Date(renewalDate);
    if (Number.isNaN(d.getTime())) return "—";
    d.setFullYear(d.getFullYear() + 1);
  }
  return fmtDate(d);
};

const show = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const toInstitute = (item) => ({
  id: item.institute_id,
  regNo: item.registration_no || "—",
  name: item.institute_name || "—",
  dzongkhag: item.dzongkhag_name || "—",
  location: item.exact_location || "—",
  contactNo: item.contact_no || "—",
  ownership: item.ownership || "—",
  email: item.email_id || "—",
  validityTill: validityTill(item.validity_date, item.institute_renewal_date),
  type: typeLabel(item.registration_type),
  courses: parseJsonArray(item.courses)
    .filter((c) => c && c.id)
    .map((c) => ({
      id: c.id,
      title: c.title || "—",
      theory: c.theory,
      practical: c.practical,
      ojt: c.ojt,
      total: c.total,
      feesPerHead: c.feesPerHead,
      enrollment: c.enrollment,
      certLevel: c.certLevel || "—",
    })),
});

// ── Course details dialog ─────────────────────────────────────────────────────
const CourseDialog = ({ institute, onClose }) => (
  <Dialog open={Boolean(institute)} onClose={onClose} maxWidth="lg" fullWidth>
    {institute && (
      <>
        <DialogTitle sx={{ pr: 6 }}>
          {institute.name}
          <Typography variant="body2" color="text.secondary">
            {institute.type} · Registration No. {institute.regNo}
          </Typography>
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              ["Ownership", institute.ownership],
              ["Dzongkhag", institute.dzongkhag],
              ["Location", institute.location],
              ["Contact No.", institute.contactNo],
              ["Email", institute.email],
              ["Validity Till", institute.validityTill],
            ].map(([label, value]) => (
              <Grid item key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {value}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" color="primary" gutterBottom>
            Accredited Courses
            <Chip label={`${institute.courses.length} Total`} size="small" sx={{ ml: 1 }} />
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={TABLE_SX}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>#</TableCell>
                  <TableCell>Course Title</TableCell>
                  <TableCell align="center">Theory (hrs)</TableCell>
                  <TableCell align="center">Practical (hrs)</TableCell>
                  <TableCell align="center">OJT (hrs)</TableCell>
                  <TableCell align="center">Total (hrs)</TableCell>
                  <TableCell align="center">Fees Per Head</TableCell>
                  <TableCell align="center">Enrollment Per Course</TableCell>
                  <TableCell>Certificate Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {institute.courses.length > 0 ? (
                  institute.courses.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell align="center">{show(c.theory)}</TableCell>
                      <TableCell align="center">{show(c.practical)}</TableCell>
                      <TableCell align="center">{show(c.ojt)}</TableCell>
                      <TableCell align="center">{show(c.total)}</TableCell>
                      <TableCell align="center">{show(c.feesPerHead)}</TableCell>
                      <TableCell align="center">{show(c.enrollment)}</TableCell>
                      <TableCell>{c.certLevel}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No accredited courses
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </>
    )}
  </Dialog>
);

CourseDialog.propTypes = {
  institute: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

// ── Main component ────────────────────────────────────────────────────────────
const Institute = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", type: "", dzongkhag: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await InstituteRegistrationService.getRegisteredInstitutes();
        if (res instanceof Error || res?.isAxiosError) throw res;
        setInstitutes(Array.isArray(res?.data) ? res.data.map(toInstitute) : []);
      } catch (error) {
        console.error("Error loading institutes:", error);
        setInstitutes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const typeOptions = useMemo(
    () => [...new Set(institutes.map((i) => i.type))].sort(),
    [institutes],
  );
  const dzongkhagOptions = useMemo(
    () => [...new Set(institutes.map((i) => i.dzongkhag).filter((d) => d !== "—"))].sort(),
    [institutes],
  );

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  };

  const filtered = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    const has = (v) => String(v).toLowerCase().includes(s);
    return institutes.filter((r) => {
      if (filters.type && r.type !== filters.type) return false;
      if (filters.dzongkhag && r.dzongkhag !== filters.dzongkhag) return false;
      if (!s) return true;
      return (
        has(r.name) || has(r.regNo) || has(r.dzongkhag) || has(r.contactNo) ||
        has(r.ownership) || has(r.email)
      );
    });
  }, [institutes, filters]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const COLS = 10;

  return (
    <Paper {...PAPER_PROPS}>
      <Typography variant="h5" gutterBottom>
        Registered Institutes
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Institutes, SES Centres and Assessment Centres registered with BQPCA.
          Click &quot;View Courses&quot; to see an institute&apos;s accredited courses.
        </Typography>
      </Box>

      <Grid container spacing={1} alignItems="center" sx={{ justifyContent: "flex-end", mb: 2 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            label="Type"
            size="small"
            fullWidth
            value={filters.type}
            onChange={(e) => setFilter("type", e.target.value)}
            sx={SELECT_SX}
          >
            <MenuItem value="">All</MenuItem>
            {typeOptions.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            select
            label="Dzongkhag"
            size="small"
            fullWidth
            value={filters.dzongkhag}
            onChange={(e) => setFilter("dzongkhag", e.target.value)}
            sx={SELECT_SX}
          >
            <MenuItem value="">All</MenuItem>
            {dzongkhagOptions.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Institutes"
            variant="outlined"
            size="small"
            fullWidth
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search by Name, Registration No. or Email"
            sx={INPUT_SX}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_SX}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Registration No.</TableCell>
              <TableCell>Institute Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Dzongkhag</TableCell>
              <TableCell>Contact No.</TableCell>
              <TableCell>Ownership</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Validity Till</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={COLS} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginated.length > 0 ? (
              paginated.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {row.regNo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.type}
                      size="small"
                      color={row.type === "Institute" ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>{row.dzongkhag}</TableCell>
                  <TableCell>{row.contactNo}</TableCell>
                  <TableCell>{row.ownership}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.validityTill}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => setSelected(row)}
                      sx={{ textTransform: "none", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                    >
                      View Courses
                      <Chip
                        label={row.courses.length}
                        size="small"
                        color="primary"
                        sx={{
                          ml: 1,
                          height: 20,
                          backgroundColor: "rgba(255,255,255,0.25)",
                          "& .MuiChip-label": { fontSize: "0.7rem", px: 1 },
                        }}
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={COLS} align="center">
                  {filters.search || filters.type || filters.dzongkhag
                    ? "No records match your filters"
                    : "No data available in table"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
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
      </TableContainer>

      <CourseDialog institute={selected} onClose={() => setSelected(null)} />
    </Paper>
  );
};

export default Institute;
