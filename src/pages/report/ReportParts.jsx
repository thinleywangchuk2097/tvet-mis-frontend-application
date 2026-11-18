// Shared building blocks for the report pages (helpers and hooks are in reportUtils.js)
import PropTypes from "prop-types";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";

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

const filtersShape = PropTypes.objectOf(PropTypes.string);
const pagingShape = PropTypes.shape({
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired,
  setRowsPerPage: PropTypes.func.isRequired,
});

/** Dropdown filter; options are strings or { value, label } */
const FilterSelect = ({ label, name, value, onChange, allLabel, options }) => (
  <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      name={name}
      value={value}
      onChange={onChange}
    >
      <MenuItem value="">{allLabel}</MenuItem>
      {options.map((o) => {
        const opt = typeof o === "object" ? o : { value: o, label: o };
        return (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        );
      })}
    </TextField>
  </Grid>
);
FilterSelect.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  allLabel: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ value: PropTypes.string, label: PropTypes.string }),
    ]),
  ).isRequired,
};

/** Row of filter dropdowns ({ label, name, allLabel, options }) + Clear / Export, then a divider */
export const FilterBar = ({
  selects,
  filters,
  onChange,
  onClear,
  onExport,
  exportDisabled,
}) => (
  <>
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {selects.map((s) => (
        <FilterSelect
          key={s.name}
          {...s}
          value={filters[s.name]}
          onChange={onChange}
        />
      ))}
      <Grid item size={{ xs: 12, md: 4 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={onClear}
            fullWidth
          >
            Clear
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={exportDisabled}
            fullWidth
            onClick={onExport}
          >
            Export
          </Button>
        </Box>
      </Grid>
    </Grid>
    <Divider sx={{ my: 2 }} />
  </>
);
FilterBar.propTypes = {
  selects: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      allLabel: PropTypes.string.isRequired,
      options: PropTypes.array.isRequired,
    }),
  ).isRequired,
  filters: filtersShape.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  exportDisabled: PropTypes.bool,
};

/** From / End date (created date) + search box; children go between them (e.g. summary chips) */
export const DateSearchBar = ({
  filters,
  onChange,
  searchPlaceholder,
  searchWidth,
  children,
}) => (
  <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
    <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
      <TextField
        type="date"
        size="small"
        fullWidth
        label="From Date"
        name="fromDate"
        value={filters.fromDate}
        onChange={onChange}
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
        onChange={onChange}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { min: filters.fromDate || undefined },
        }}
      />
    </Grid>
    {children}
    <Grid item sx={{ ml: "auto" }}>
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        name="search"
        value={filters.search}
        onChange={onChange}
        sx={{ width: searchWidth }}
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
);
DateSearchBar.propTypes = {
  filters: filtersShape.isRequired,
  onChange: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string.isRequired,
  searchWidth: PropTypes.number,
  children: PropTypes.node,
};

export const StatusBadge = ({ status }) => {
  const st = statusStyle(status);
  return (
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
      {status}
    </Box>
  );
};
StatusBadge.propTypes = { status: PropTypes.string };

const TABLE_SX = {
  border: "1px solid #ccc",
  "& th, & td": { border: "1px solid #ccc", padding: "8px" },
};

/**
 * Report table: header row, the page's rows (children), a spinner while loading,
 * "no records" when empty, then pagination. headers: strings or { label, align }.
 */
export const ReportTable = ({
  headers,
  loading,
  pageCount,
  total,
  paging,
  children,
}) => {
  const cols = headers.length;
  return (
    <>
      <TableContainer>
        <Table size="small" sx={TABLE_SX}>
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              {headers.map((h) => {
                const head = typeof h === "object" ? h : { label: h };
                return (
                  <TableCell key={head.label} align={head.align}>
                    {head.label}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && children}
            {loading && (
              <TableRow>
                <TableCell colSpan={cols} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={26} />
                </TableCell>
              </TableRow>
            )}
            {!loading && pageCount === 0 && (
              <TableRow>
                <TableCell colSpan={cols} align="center" sx={{ py: 3 }}>
                  No records found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {total > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {pageCount} of {total} records
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={paging.rowsPerPage}
            page={paging.page}
            onPageChange={(_, p) => paging.setPage(p)}
            onRowsPerPageChange={(e) => {
              paging.setRowsPerPage(Number.parseInt(e.target.value, 10));
              paging.setPage(0);
            }}
          />
        </Box>
      )}
    </>
  );
};
ReportTable.propTypes = {
  headers: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ label: PropTypes.string, align: PropTypes.string }),
    ]),
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  pageCount: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  paging: pagingShape.isRequired,
  children: PropTypes.node,
};
