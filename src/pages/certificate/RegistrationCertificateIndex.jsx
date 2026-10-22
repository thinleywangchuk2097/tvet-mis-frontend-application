// RegistrationCertificateIndex.jsx
import { useState, useCallback, useMemo, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  generateRegistrationCertificatePdf,
  generateAllRegistrationCertificatesPdf,
} from "@/utils/pdf/registrationCertificatePdf";
import ReportService from "../../api/services/internal/report/ReportService";

// ==================== CONSTANTS ====================

const TABLE_STYLE = {
  border: "1px solid #ccc",
  "& th, & td": {
    border: "1px solid #ccc",
    padding: "8px",
  },
};

const REGISTRATION_TYPES = [
  { id: 7, label: "Institute Registration" },
  { id: 36, label: "SES Centre Registration" },
  { id: 16, label: "Assessment Centre Accreditation" },
  { id: 32, label: "Assessor" },
  { id: 5, label: "Accreditor" },
  { id: 3, label: "Quality Auditor" },
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const APPLICATION_NO_TOOLTIP =
  "Search by Application No, CID, Reference No, or Registration No";

// ==================== HELPER FUNCTIONS ====================

const getField = (item, ...fields) => {
  for (const field of fields) {
    const value = item?.[field];

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return "N/A";
};

const getResponseData = (response) => {
  const responseData = response?.data;

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.content)) {
    return responseData.content;
  }

  if (Array.isArray(responseData?.result)) {
    return responseData.result;
  }

  if (Array.isArray(responseData?.data?.content)) {
    return responseData.data.content;
  }

  return [];
};

/**
 * Resolve the label for a registration type from its id.
 */
const getRegistrationTypeLabel = (registrationTypeId) =>
  REGISTRATION_TYPES.find(
    (type) => String(type.id) === String(registrationTypeId),
  )?.label || registrationTypeId;

/**
 * Normalize a registration record into the shape the PDF template expects.
 */
const buildPdfPayload = (registration) => ({
  ...registration,
  registration_type_label: getRegistrationTypeLabel(
    registration?.registration_type,
  ),
  institute_name: getField(
    registration,
    "institute_name",
    "full_name",
    "applicant_name",
    "name",
  ),
  registration_no: getField(registration, "registration_no", "registrationNo"),
  application_no: getField(registration, "application_no", "applicationNo"),
});

// ==================== CUSTOM HOOKS ====================

const useFilters = () => {
  const [filters, setFilters] = useState({
    registrationType: "",
    applicationNo: "",
    search: "",
  });

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      registrationType: "",
      applicationNo: "",
      search: "",
    });
  }, []);

  return {
    filters,
    handleFilterChange,
    clearFilters,
  };
};

const usePagination = (initialRowsPerPage = 5) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

// ==================== REUSABLE COMPONENTS ====================

const SectionHeader = ({ title }) => (
  <Typography variant="h6" mb={3}>
    {title}
  </Typography>
);

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

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

FilterSelect.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const FilterTextField = ({
  name,
  value,
  label,
  onChange,
  tooltip,
  disabled = false,
}) => {
  const field = (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      size="small"
      disabled={disabled}
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

FilterTextField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
  disabled: PropTypes.bool,
};

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

ClearButton.propTypes = {
  onClear: PropTypes.func.isRequired,
};

const SearchField = ({ value, onChange }) => (
  <TextField
    placeholder="Search registrations..."
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

SearchField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const DownloadAllHeader = ({ count, onDownloadAll, disabled = false }) => (
  <Tooltip
    title={
      count === 0
        ? "No records available to download"
        : `Download all ${count} registration certificate(s)`
    }
    arrow
  >
    <span>
      <Button
        variant="text"
        size="small"
        startIcon={<DownloadIcon />}
        onClick={onDownloadAll}
        disabled={count === 0 || disabled}
        sx={{ textTransform: "none", fontWeight: "bold" }}
      >
        Download All
      </Button>
    </span>
  </Tooltip>
);

DownloadAllHeader.propTypes = {
  count: PropTypes.number.isRequired,
  onDownloadAll: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const DataTable = ({ columns, data, emptyMessage = "No data found" }) => (
  <TableContainer>
    <Table size="small" sx={TABLE_STYLE}>
      <TableHead>
        <TableRow
          sx={{
            background: "#f5f5f5",
            "& .MuiTableCell-root": {
              fontWeight: "bold",
            },
          }}
        >
          {columns.map((column) => (
            <TableCell key={column.id} align={column.align || "left"}>
              {column.headerRender ? column.headerRender(column) : column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {data.length > 0 ? (
          data.map((item, index) => (
            <TableRow
              key={
                item.id ?? item.application_no ?? item.registration_no ?? index
              }
              hover
            >
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || "left"}>
                  {column.render
                    ? column.render(item, index)
                    : getField(item, column.field)}
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

DataTable.propTypes = {
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
  emptyMessage: PropTypes.string,
};

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
      flexWrap: "wrap",
      gap: 1,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      Showing {count === 0 ? 0 : Math.min(page * rowsPerPage + 1, count)}
      {" - "}
      {Math.min((page + 1) * rowsPerPage, count)} of {count} registrations
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
        ".MuiTablePagination-select": {
          borderRadius: 1,
        },
        ".MuiTablePagination-displayedRows": {
          margin: 0,
        },
      }}
    />
  </Box>
);

PaginationFooter.propTypes = {
  count: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
};

// ==================== MAIN COMPONENT ====================

const RegistrationCertificateIndex = () => {
  const filters = useFilters();
  const pagination = usePagination(5);

  const access_token = useSelector((state) => state.auth.accessToken);

  const [registrations, setRegistrations] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState({
    registrationType: "",
    applicationNo: "",
    search: "",
  });

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // ==================== API SEARCH ====================

  const handleSearch = useCallback(async () => {
    const registration_type = filters.filters.registrationType;
    const application_no = filters.filters.applicationNo.trim();

    if (!registration_type || !application_no) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHasSearched(true);

      const response = await ReportService.getRegistrationDetailsForCertificate(
        registration_type,
        application_no,
        access_token,
      );

      const responseData = getResponseData(response);

      console.log("Fetched registration details:", responseData);

      setRegistrations(responseData);

      setAppliedFilters({
        ...filters.filters,
        registrationType: String(registration_type),
        applicationNo: application_no,
      });

      pagination.handleChangePage(null, 0);

      if (responseData.length === 0) {
        setError("No registration records found.");
      }
    } catch (err) {
      console.error("Error fetching registration details:", err);

      setRegistrations([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch registration details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters.filters, access_token, pagination.handleChangePage]);

  // ==================== CLEAR FILTERS ====================

  const handleClear = useCallback(() => {
    filters.clearFilters();

    setAppliedFilters({
      registrationType: "",
      applicationNo: "",
      search: "",
    });

    setRegistrations([]);
    setError("");
    setHasSearched(false);

    pagination.handleChangePage(null, 0);
  }, [filters.clearFilters, pagination.handleChangePage]);

  // ==================== QUICK SEARCH ====================

  const filteredRegistrations = useMemo(() => {
    const searchTerm = appliedFilters.search.trim().toLowerCase();

    if (!searchTerm) {
      return registrations;
    }

    return registrations.filter((item) => {
      const searchableFields = [
        item.application_no,
        item.registration_no,
        item.registration_type,
        item.service_id,
        item.institute_name,
        item.location,
        item.exact_location,
      ];

      return searchableFields.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(searchTerm),
      );
    });
  }, [registrations, appliedFilters.search]);

  useEffect(() => {
    pagination.handleChangePage(null, 0);
  }, [appliedFilters.search, pagination.handleChangePage]);

  // ==================== CERTIFICATE ACTIONS ====================

  const handlePdf = useCallback(async (registration) => {
    try {
      setDownloading(true);
      const payload = buildPdfPayload(registration);
      await generateRegistrationCertificatePdf(payload);
    } catch (err) {
      console.error("❌ Registration certificate generation failed:", err);
      toast.error(
        `Could not generate certificate: ${err?.message || "unknown"}`,
      );
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (filteredRegistrations.length === 0) {
      return;
    }

    try {
      setDownloading(true);
      const payloads = filteredRegistrations.map(buildPdfPayload);
      await generateAllRegistrationCertificatesPdf(payloads);
    } catch (err) {
      console.error("❌ Bulk registration certificate generation failed:", err);
      toast.error(
        `Could not generate certificates: ${err?.message || "unknown"}`,
      );
    } finally {
      setDownloading(false);
    }
  }, [filteredRegistrations]);

  // ==================== TABLE COLUMNS ====================

  const columns = useMemo(
    () => [
      {
        id: "index",
        label: "#",
        render: (_, index) =>
          pagination.page * pagination.rowsPerPage + index + 1,
      },
      {
        id: "registrationType",
        label: "Registration Type",
        render: (item) => getField(item, "registration_type"),
      },
      {
        id: "applicationNo",
        label: "Application No",
        render: (item) => getField(item, "application_no", "applicationNo"),
      },
      {
        id: "name",
        label: "Institute / Applicant Name",
        render: (item) =>
          getField(
            item,
            "institute_name",
            "full_name",
            "applicant_name",
            "name",
          ),
      },
      {
        id: "registrationNo",
        label: "Registration No",
        render: (item) => getField(item, "registration_no", "registrationNo"),
      },
      {
        id: "location",
        label: "Location",
        render: (item) => getField(item, "location"),
      },
      {
        id: "exactLocation",
        label: "Exact Location",
        render: (item) => getField(item, "exact_location", "exactLocation"),
      },
      {
        id: "actions",
        label: "Action",
        align: "center",
        headerRender: () => (
          <DownloadAllHeader
            count={filteredRegistrations.length}
            onDownloadAll={handleDownloadAll}
            disabled={loading || downloading}
          />
        ),
        render: (item) => (
          <Tooltip
            title={`Download certificate for ${getField(
              item,
              "institute_name",
              "registration_no",
              "application_no",
            )}`}
            arrow
          >
            <span>
              <Button
                variant="text"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handlePdf(item)}
                disabled={loading || downloading}
                sx={{ textTransform: "none" }}
              >
                Certificate
              </Button>
            </span>
          </Tooltip>
        ),
      },
    ],
    [
      pagination.page,
      pagination.rowsPerPage,
      filteredRegistrations.length,
      handlePdf,
      handleDownloadAll,
      loading,
      downloading,
    ],
  );

  // ==================== PAGINATION ====================

  const paginatedRegistrations = useMemo(() => {
    const startIndex = pagination.page * pagination.rowsPerPage;

    return filteredRegistrations.slice(
      startIndex,
      startIndex + pagination.rowsPerPage,
    );
  }, [filteredRegistrations, pagination.page, pagination.rowsPerPage]);

  // ==================== SEARCH VALIDATION ====================

  const canSearch =
    filters.filters.registrationType !== "" &&
    filters.filters.applicationNo.trim() !== "" &&
    !loading;

  // ==================== RENDER ====================

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <SectionHeader title="List Of Registration Certificates" />

      {/* Registration Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="flex-end">
        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterSelect
            name="registrationType"
            value={filters.filters.registrationType}
            label="Registration Type"
            options={REGISTRATION_TYPES}
            onChange={filters.handleFilterChange}
            disabled={loading}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterTextField
            name="applicationNo"
            value={filters.filters.applicationNo}
            label="Application No"
            onChange={filters.handleFilterChange}
            tooltip={APPLICATION_NO_TOOLTIP}
            disabled={loading}
          />
        </Grid>

        {/* Search Button */}
        <Grid item size={{ xs: 12, md: 2 }}>
          <Tooltip
            title={
              canSearch
                ? "Search registrations"
                : "Select Registration Type and enter Application No"
            }
            arrow
          >
            <span style={{ display: "block", width: "100%" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={handleSearch}
                disabled={!canSearch}
                fullWidth
                sx={{ textTransform: "none" }}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </span>
          </Tooltip>
        </Grid>

        {/* Clear Button */}
        <Grid item size={{ xs: 12, md: 2 }}>
          <ClearButton onClear={handleClear} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Quick Search */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <SearchField
            value={filters.filters.search}
            onChange={(event) => {
              filters.handleFilterChange(event);

              setAppliedFilters((previous) => ({
                ...previous,
                search: event.target.value,
              }));
            }}
          />
        </Grid>
      </Grid>

      {/* Error Message */}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Registration Table */}
      <DataTable
        columns={columns}
        data={paginatedRegistrations}
        emptyMessage={
          loading
            ? "Loading registration details..."
            : hasSearched
              ? "No registrations found matching your criteria"
              : "Select a Registration Type, enter an Application No, and click Search"
        }
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

export default RegistrationCertificateIndex;
