// RegistrationCertificateIndex.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
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
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Divider,
  TablePagination,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid #ccc",
  "& th, & td": {
    border: "1px solid #ccc",
    padding: "8px",
  },
};

// Registration Types (with IDs provided)
const REGISTRATION_TYPES = [
  { id: 7, label: "Institute Registration" },
  { id: 36, label: "SES Centre Registration" },
  { id: 16, label: "Assessment Centre Accreditation" },
  { id: 32, label: "Assessor" },
  { id: 5, label: "Accreditor" },
  { id: 3, label: "Quality Auditor" },
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

// Tooltip text for the multi-search field
const APPLICATION_NO_TOOLTIP =
  "Search by Application No, CID, Reference No, or Registration No";

// ==================== SAMPLE DATA ====================
const SAMPLE_REGISTRATIONS = [
  // --- Institute Registration (id 7) ---
  {
    id: 1,
    registrationTypeId: 7,
    registrationType: "Institute Registration",
    applicationNo: "APP-2026-0001",
    referenceNo: "REF-INST-001",
    registrationNo: "REG-INST-001",
    name: "Thimphu Technical Institute",
    cid: "INST-001",
    registrationDate: "2026-01-05",
    status: "Registered",
  },
  {
    id: 2,
    registrationTypeId: 7,
    registrationType: "Institute Registration",
    applicationNo: "APP-2026-0002",
    referenceNo: "REF-INST-002",
    registrationNo: "REG-INST-002",
    name: "Paro Vocational Institute",
    cid: "INST-002",
    registrationDate: "2026-01-20",
    status: "Registered",
  },

  // --- SES Centre Registration (id 36) ---
  {
    id: 3,
    registrationTypeId: 36,
    registrationType: "SES Centre Registration",
    applicationNo: "APP-2026-0003",
    referenceNo: "REF-SES-001",
    registrationNo: "REG-SES-001",
    name: "Bhutan Skills Centre",
    cid: "SES-001",
    registrationDate: "2026-01-10",
    status: "Registered",
  },
  {
    id: 4,
    registrationTypeId: 36,
    registrationType: "SES Centre Registration",
    applicationNo: "APP-2026-0004",
    referenceNo: "REF-SES-002",
    registrationNo: "REG-SES-002",
    name: "Gelephu Skills Centre",
    cid: "SES-002",
    registrationDate: "2026-02-01",
    status: "Registered",
  },

  // --- Assessment Centre Accreditation (id 16) ---
  {
    id: 5,
    registrationTypeId: 16,
    registrationType: "Assessment Centre Accreditation",
    applicationNo: "APP-2026-0005",
    referenceNo: "REF-AC-001",
    registrationNo: "REG-AC-001",
    name: "National Assessment Centre",
    cid: "AC-001",
    registrationDate: "2026-01-02",
    status: "Registered",
  },
  {
    id: 6,
    registrationTypeId: 16,
    registrationType: "Assessment Centre Accreditation",
    applicationNo: "APP-2026-0006",
    referenceNo: "REF-AC-002",
    registrationNo: "REG-AC-002",
    name: "Regional Assessment Centre",
    cid: "AC-002",
    registrationDate: "2026-02-10",
    status: "Registered",
  },

  // --- Assessor (id 32) ---
  {
    id: 7,
    registrationTypeId: 32,
    registrationType: "Assessor",
    applicationNo: "APP-2026-0007",
    referenceNo: "REF-ASR-001",
    registrationNo: "REG-ASR-001",
    name: "Pema Dorji",
    cid: "1160400783",
    registrationDate: "2026-01-05",
    status: "Registered",
  },
  {
    id: 8,
    registrationTypeId: 32,
    registrationType: "Assessor",
    applicationNo: "APP-2026-0008",
    referenceNo: "REF-ASR-002",
    registrationNo: "REG-ASR-002",
    name: "Tashi",
    cid: "1160400909",
    registrationDate: "2026-01-06",
    status: "Registered",
  },

  // --- Accreditor (id 5) ---
  {
    id: 9,
    registrationTypeId: 5,
    registrationType: "Accreditor",
    applicationNo: "APP-2026-0009",
    referenceNo: "REF-ACR-001",
    registrationNo: "REG-ACR-001",
    name: "Pema Lhamo",
    cid: "1160400783",
    registrationDate: "2026-01-10",
    status: "Registered",
  },
  {
    id: 10,
    registrationTypeId: 5,
    registrationType: "Accreditor",
    applicationNo: "APP-2026-0010",
    referenceNo: "REF-ACR-002",
    registrationNo: "REG-ACR-002",
    name: "Karma Wangmo",
    cid: "1160400456",
    registrationDate: "2026-02-01",
    status: "Registered",
  },

  // --- Quality Auditor (id 3) ---
  {
    id: 11,
    registrationTypeId: 3,
    registrationType: "Quality Auditor",
    applicationNo: "APP-2026-0011",
    referenceNo: "REF-QA-001",
    registrationNo: "REG-QA-001",
    name: "Wahgchuk Pemo",
    cid: "189700202",
    registrationDate: "2026-01-02",
    status: "Registered",
  },
  {
    id: 12,
    registrationTypeId: 3,
    registrationType: "Quality Auditor",
    applicationNo: "APP-2026-0012",
    referenceNo: "REF-QA-002",
    registrationNo: "REG-QA-002",
    name: "Ugyen Tshering",
    cid: "1160400789",
    registrationDate: "2026-02-10",
    status: "Registered",
  },
];

// ==================== CUSTOM HOOKS ====================
const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    registrationType: "",
    applicationNo: "",
    search: "",
    ...initialFilters,
  });

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      registrationType: "",
      applicationNo: "",
      search: "",
    });
  }, []);

  return { filters, handleFilterChange, clearFilters };
};

const usePagination = (initialRowsPerPage = 5) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage };
};

// ==================== PROPTYPES ====================
const sectionHeaderPropTypes = { title: PropTypes.string.isRequired };

const filterSelectPropTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const filterTextFieldPropTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
};

const clearButtonPropTypes = {
  onClear: PropTypes.func.isRequired,
};

const searchFieldPropTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

const dataTablePropTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      field: PropTypes.string,
      align: PropTypes.string,
      render: PropTypes.func,
      headerRender: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.array.isRequired,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  emptyMessage: PropTypes.string,
};

const paginationFooterPropTypes = {
  count: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
};

// ==================== REUSABLE COMPONENTS ====================
const SectionHeader = ({ title }) => (
  <Typography variant="h6" mb={3}>
    {title}
  </Typography>
);
SectionHeader.propTypes = sectionHeaderPropTypes;

const FilterSelect = ({
  name,
  value,
  label,
  options,
  onChange,
  disabled = false,
}) => (
  <FormControl fullWidth size="small" disabled={disabled}>
    <InputLabel>{label}</InputLabel>
    <Select name={name} value={value} onChange={onChange} label={label}>
      <MenuItem value="">-Select-</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);
FilterSelect.propTypes = filterSelectPropTypes;

const FilterTextField = ({
  name,
  value,
  label,
  type = "text",
  onChange,
  tooltip,
}) => {
  const field = (
    <TextField
      fullWidth
      label={label}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      size="small"
      InputProps={{
        endAdornment: tooltip ? (
          <InputAdornment position="end">
            <InfoOutlinedIcon fontSize="small" color="action" />
          </InputAdornment>
        ) : undefined,
      }}
    />
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      {field}
    </Tooltip>
  ) : (
    field
  );
};
FilterTextField.propTypes = filterTextFieldPropTypes;

const ClearButton = ({ onClear }) => (
  <Tooltip title="Clear all filters" arrow>
    <Button
      variant="contained"
      color="secondary"
      onClick={onClear}
      fullWidth
      sx={{ textTransform: "none" }}
    >
      Clear
    </Button>
  </Tooltip>
);
ClearButton.propTypes = clearButtonPropTypes;

const SearchField = ({
  value,
  onChange,
  placeholder = "Search registrations...",
}) => (
  <TextField
    placeholder={placeholder}
    name="search"
    value={value}
    size="small"
    onChange={onChange}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
  />
);
SearchField.propTypes = searchFieldPropTypes;

const DataTable = ({
  columns,
  data,
  page,
  rowsPerPage,
  emptyMessage = "No data found",
}) => {
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <TableContainer>
      <Table size="small" sx={TABLE_STYLE}>
        <TableHead>
          <TableRow
            sx={{
              background: "#f5f5f5",
              "& .MuiTableCell-root": { fontWeight: "bold" },
            }}
          >
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align || "left"}>
                {col.headerRender ? col.headerRender(col) : col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <TableRow key={item.id} hover>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || "left"}>
                    {col.render
                      ? col.render(item, index + page * rowsPerPage)
                      : item[col.field] || "N/A"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
DataTable.propTypes = dataTablePropTypes;

const PaginationFooter = ({
  count,
  rowsPerPage,
  page,
  onPageChange,
  onRowsPerPageChange,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      Showing {Math.min((page + 1) * rowsPerPage, count)} of {count}{" "}
      registrations
    </Typography>
    <TablePagination
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      component="div"
      count={count}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      sx={{
        ".MuiTablePagination-select": { borderRadius: 1 },
        ".MuiTablePagination-displayedRows": { margin: 0 },
      }}
    />
  </Box>
);
PaginationFooter.propTypes = paginationFooterPropTypes;

// ==================== MAIN COMPONENT ====================
const RegistrationCertificateIndex = () => {
  const filters = useFilters();
  const pagination = usePagination(5);

  // Dummy registrations
  const [registrations] = useState(SAMPLE_REGISTRATIONS);

  // Applied filters (only updated on Search click)
  const [appliedFilters, setAppliedFilters] = useState({
    registrationType: "",
    applicationNo: "",
    search: "",
  });

  // Filter registrations based on APPLIED filters
  const filteredRegistrations = useMemo(() => {
    const searchTerm = appliedFilters.applicationNo.trim().toLowerCase();

    return registrations.filter((reg) => {
      const matchesRegistrationType =
        appliedFilters.registrationType === "" ||
        reg.registrationTypeId === Number(appliedFilters.registrationType);

      // Multi-field search: applicationNo, cid, referenceNo, registrationNo
      const matchesApplicationNo =
        searchTerm === "" ||
        (reg.applicationNo &&
          reg.applicationNo.toLowerCase().includes(searchTerm)) ||
        (reg.cid && reg.cid.toLowerCase().includes(searchTerm)) ||
        (reg.referenceNo &&
          reg.referenceNo.toLowerCase().includes(searchTerm)) ||
        (reg.registrationNo &&
          reg.registrationNo.toLowerCase().includes(searchTerm));

      const matchesSearch =
        appliedFilters.search === "" ||
        reg.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        reg.applicationNo
          .toLowerCase()
          .includes(appliedFilters.search.toLowerCase());

      return matchesRegistrationType && matchesApplicationNo && matchesSearch;
    });
  }, [registrations, appliedFilters]);

  // Reset page when applied filters change
  useEffect(() => {
    pagination.handleChangePage(null, 0);
  }, [appliedFilters]);

  // Search button enabled only when both Registration Type & Application No are filled
  const canSearch =
    filters.filters.registrationType !== "" &&
    filters.filters.applicationNo.trim() !== "";

  // Handle Search button click — applies filters
  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...filters.filters });
  }, [filters.filters]);

  // Handle Clear — resets both form filters and applied filters
  const handleClear = useCallback(() => {
    filters.clearFilters();
    setAppliedFilters({
      registrationType: "",
      applicationNo: "",
      search: "",
    });
  }, [filters]);

  // Dummy PDF handler (no API calls)
  const handlePdf = useCallback((registration) => {
    console.log("Generate Registration Certificate PDF for:", registration);
    alert(`Downloading registration certificate for ${registration.name}`);
  }, []);

  // Dummy Download All handler (no API calls)
  const handleDownloadAll = useCallback(() => {
    console.log(
      "Generate all Registration Certificate PDFs:",
      filteredRegistrations,
    );
    alert(
      `Downloading ${filteredRegistrations.length} registration certificates`,
    );
  }, [filteredRegistrations]);

  // Table columns configuration
  const columns = useMemo(
    () => [
      { id: "index", label: "#", render: (_, index) => index + 1 },
      {
        id: "registrationType",
        label: "Registration Type",
        field: "registrationType",
      },
      { id: "applicationNo", label: "Application No", field: "applicationNo" },
      { id: "name", label: "Name", field: "name" },
      { id: "cid", label: "CID/Reference No", field: "cid" },
      {
        id: "registrationDate",
        label: "Registration Date",
        field: "registrationDate",
      },
      { id: "status", label: "Status", field: "status" },
      {
        id: "actions",
        label: "Action",
        align: "center",
        headerRender: () => (
          <Tooltip
            title={
              filteredRegistrations.length === 0
                ? "No records available to download"
                : `Download all ${filteredRegistrations.length} registration certificate(s)`
            }
            arrow
          >
            <span>
              <Button
                variant="text"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAll}
                disabled={filteredRegistrations.length === 0}
                sx={{ textTransform: "none", fontWeight: "bold" }}
              >
                Download All
              </Button>
            </span>
          </Tooltip>
        ),
        render: (item) => (
          <Tooltip title={`Download certificate for ${item.name}`} arrow>
            <Button
              variant="text"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handlePdf(item)}
              sx={{ textTransform: "none" }}
            >
              Certificate
            </Button>
          </Tooltip>
        ),
      },
    ],
    [handlePdf, handleDownloadAll, filteredRegistrations.length],
  );

  // Paginated registrations for display
  const paginatedRegistrations = filteredRegistrations.slice(
    pagination.page * pagination.rowsPerPage,
    pagination.page * pagination.rowsPerPage + pagination.rowsPerPage,
  );

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <SectionHeader title="Registration Certificate" />

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="flex-end">
        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterSelect
            name="registrationType"
            value={filters.filters.registrationType}
            label="Registration Type"
            options={REGISTRATION_TYPES}
            onChange={filters.handleFilterChange}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterTextField
            name="applicationNo"
            value={filters.filters.applicationNo}
            label="Application No"
            onChange={filters.handleFilterChange}
            tooltip={APPLICATION_NO_TOOLTIP}
          />
        </Grid>

        {/* Search Button */}
        <Grid item size={{ xs: 12, md: 2 }}>
          <Tooltip
            title={
              canSearch
                ? "Search registrations"
                : "Please select Registration Type and enter Application No"
            }
            arrow
          >
            <span style={{ width: "100%" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={!canSearch}
                fullWidth
                sx={{ textTransform: "none" }}
              >
                Search
              </Button>
            </span>
          </Tooltip>
        </Grid>

        {/* Clear */}
        <Grid item size={{ xs: 12, md: 2 }}>
          <ClearButton onClear={handleClear} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Search (quick filter on results) */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <SearchField
            value={filters.filters.search}
            onChange={filters.handleFilterChange}
          />
        </Grid>
      </Grid>

      {/* Registrations Table */}
      <DataTable
        columns={columns}
        data={paginatedRegistrations}
        page={0}
        rowsPerPage={paginatedRegistrations.length}
        emptyMessage="No registrations found matching your criteria"
      />

      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      <PaginationFooter
        count={filteredRegistrations.length}
        rowsPerPage={pagination.rowsPerPage}
        page={pagination.page}
        onPageChange={pagination.handleChangePage}
        onRowsPerPageChange={pagination.handleChangeRowsPerPage}
      />
    </Paper>
  );
};

RegistrationCertificateIndex.propTypes = {};

export default RegistrationCertificateIndex;
