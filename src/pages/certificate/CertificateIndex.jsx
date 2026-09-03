// CertificateIndex.jsx
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToExcel } from "@/utils/exportExcel";
import { useSelector } from "react-redux";
import {
  generateAssessmentCertificatePdf,
  generateAllAssessmentCertificatesPdf,
} from "@/utils/assessmentCertificatePdf";
import CertificationService from "../../api/services/internal/certification/CertificationService";

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid #ccc",
  "& th, & td": {
    border: "1px solid #ccc",
    padding: "8px",
  },
};

const PROGRAM_TYPES = [
  { id: "BQF", label: "BQF Program" },
  { id: "NON_BQF", label: "Non BQF Program" },
  { id: "RPL", label: "RPL Program" },
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

// ==================== SAMPLE DATA ====================
const SAMPLE_COURSE_DATA = [
  {
    id: 1,
    course_name: "Excavator Operator",
    program_type: "BQF",
    start_date: "2026-01-15",
    end_date: "2026-03-15",
  },
  {
    id: 2,
    course_name: "Crane Operator",
    program_type: "BQF",
    start_date: "2026-02-01",
    end_date: "2026-04-01",
  },
  {
    id: 3,
    course_name: "Forklift Operator",
    program_type: "BQF",
    start_date: "2026-03-01",
    end_date: "2026-05-01",
  },
  {
    id: 4,
    course_name: "Basic Computer Skills",
    program_type: "NON_BQF",
    start_date: "2026-01-20",
    end_date: "2026-02-20",
  },
  {
    id: 5,
    course_name: "English Language",
    program_type: "NON_BQF",
    start_date: "2026-02-15",
    end_date: "2026-04-15",
  },
  {
    id: 6,
    course_name: "Accounting Basics",
    program_type: "NON_BQF",
    start_date: "2026-03-10",
    end_date: "2026-05-10",
  },
  {
    id: 7,
    course_name: "RPL Construction",
    program_type: "RPL",
    start_date: "2026-01-10",
    end_date: "2026-03-10",
  },
  {
    id: 8,
    course_name: "RPL Hospitality",
    program_type: "RPL",
    start_date: "2026-02-20",
    end_date: "2026-04-20",
  },
  {
    id: 9,
    course_name: "RPL Agriculture",
    program_type: "RPL",
    start_date: "2026-03-15",
    end_date: "2026-05-15",
  },
];

const SAMPLE_REPORTS = [
  {
    id: 1,
    name: "Pema Dorji",
    cid: "1160400783",
    gender: "M",
    programType: "BQF",
    course: "Excavator Operator",
    courseStartDate: "2026-01-15",
    courseEndDate: "2026-03-15",
    certificate: "BQF Certificate 2",
    internal: "Competent",
    theory: "Competent",
    practical: "Competent",
    result: "Competent",
  },
  {
    id: 2,
    name: "Tashi",
    cid: "1160400909",
    gender: "M",
    programType: "BQF",
    course: "Excavator Operator",
    courseStartDate: "2026-01-15",
    courseEndDate: "2026-03-15",
    certificate: "BQF Certificate 2",
    internal: "Competent",
    theory: "Competent",
    practical: "Competent",
    result: "Competent",
  },
  {
    id: 3,
    name: "Pema Lhamo",
    cid: "1160400783",
    gender: "F",
    programType: "NON_BQF",
    course: "Basic Computer Skills",
    courseStartDate: "2026-01-20",
    courseEndDate: "2026-02-20",
    certificate: "Certificate of Completion",
    internal: "Competent",
    theory: "Not Competent",
    practical: "Competent",
    result: "Not Competent",
  },
  {
    id: 4,
    name: "Wahgchuk Pemo",
    cid: "189700202",
    gender: "F",
    programType: "RPL",
    course: "RPL Construction",
    courseStartDate: "2026-01-10",
    courseEndDate: "2026-03-10",
    certificate: "RPL Certificate",
    internal: "Competent",
    theory: "Competent",
    practical: "Competent",
    result: "Competent",
  },
  {
    id: 5,
    name: "Sonam Dorji",
    cid: "1160400123",
    gender: "M",
    programType: "NON_BQF",
    course: "English Language",
    courseStartDate: "2026-02-15",
    courseEndDate: "2026-04-15",
    certificate: "Certificate of Completion",
    internal: "Competent",
    theory: "Competent",
    practical: "Competent",
    result: "Competent",
  },
];

// ==================== CUSTOM HOOKS ====================
const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    programType: "",
    courseType: "",
    courseStartDate: "",
    courseEndDate: "",
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
      programType: "",
      courseType: "",
      courseStartDate: "",
      courseEndDate: "",
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

  return {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

const useCourseData = (access_token) => {
  const [courseList, setCourseList] = useState([]);
  const [filteredCourseList, setFilteredCourseList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssessmentCourses = useCallback(async () => {
    setLoading(true);
    try {
      // For API integration:
      // const response = await CertificationService.getAssessmentCourses(access_token);
      // setCourseList(response.data);
      // setFilteredCourseList(response.data);

      // Using static data for now
      setCourseList(SAMPLE_COURSE_DATA);
      setFilteredCourseList(SAMPLE_COURSE_DATA);
    } catch (error) {
      console.error("Error fetching Course:", error);
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    fetchAssessmentCourses();
  }, [fetchAssessmentCourses]);

  const filterCoursesByProgramType = useCallback(
    (programType) => {
      if (programType) {
        const filtered = courseList.filter(
          (course) => course.program_type === programType,
        );
        setFilteredCourseList(filtered);
      } else {
        setFilteredCourseList([]);
      }
    },
    [courseList],
  );

  return {
    courseList,
    filteredCourseList,
    loading,
    fetchAssessmentCourses,
    filterCoursesByProgramType,
  };
};

// ==================== PROPTYPES ====================
const sectionHeaderPropTypes = {
  title: PropTypes.string.isRequired,
};

const filterSelectPropTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const filterDateFieldPropTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const filterTextFieldPropTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

const actionButtonsPropTypes = {
  onClear: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  exportLabel: PropTypes.string,
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
        <MenuItem key={option.id || option} value={option.id || option}>
          {option.label || option}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

FilterSelect.propTypes = filterSelectPropTypes;

const FilterDateField = ({ name, value, label, onChange }) => (
  <TextField
    fullWidth
    label={label}
    type="date"
    name={name}
    value={value}
    onChange={onChange}
    size="small"
    InputLabelProps={{ shrink: true }}
  />
);

FilterDateField.propTypes = filterDateFieldPropTypes;

const FilterTextField = ({ name, value, label, type = "text", onChange }) => (
  <TextField
    fullWidth
    label={label}
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    size="small"
  />
);

FilterTextField.propTypes = filterTextFieldPropTypes;

const ActionButtons = ({
  onClear,
  onExport,
  disabled,
  exportLabel = "Export",
}) => (
  <Box sx={{ display: "flex", gap: 1 }}>
    <Button
      variant="contained"
      size="small"
      color="secondary"
      onClick={onClear}
      fullWidth
    >
      Clear
    </Button>
    <Button
      variant="contained"
      size="small"
      startIcon={<DownloadIcon />}
      disabled={disabled}
      fullWidth
      onClick={onExport}
    >
      {exportLabel}
    </Button>
  </Box>
);

ActionButtons.propTypes = actionButtonsPropTypes;

const SearchField = ({
  value,
  onChange,
  placeholder = "Search reports...",
}) => (
  <TextField
    size="small"
    placeholder={placeholder}
    name="search"
    value={value}
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
                {col.render ? col.render(col) : col.label}
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
      Showing {Math.min((page + 1) * rowsPerPage, count)} of {count} reports
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
const CertificateIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const today = new Date().toISOString().split("T")[0];

  // Custom hooks
  const filters = useFilters();
  const pagination = usePagination(5);
  const courseData = useCourseData(access_token);

  // Sample reports - in real app, this would come from API
  const [reports] = useState(SAMPLE_REPORTS);

  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesProgramType =
        filters.filters.programType === "" ||
        report.programType === filters.filters.programType;
      const matchesCourseType =
        filters.filters.courseType === "" ||
        report.course === filters.filters.courseType;
      const matchesApplicationNo =
        filters.filters.applicationNo === "" ||
        report.applicationNo === filters.filters.applicationNo;

      let matchesStartDate = true;
      let matchesEndDate = true;

      if (filters.filters.courseStartDate) {
        matchesStartDate =
          report.courseStartDate >= filters.filters.courseStartDate;
      }
      if (filters.filters.courseEndDate) {
        matchesEndDate = report.courseEndDate <= filters.filters.courseEndDate;
      }

      const matchesSearch =
        filters.filters.search === "" ||
        report.name
          .toLowerCase()
          .includes(filters.filters.search.toLowerCase()) ||
        report.course
          .toLowerCase()
          .includes(filters.filters.search.toLowerCase());

      return (
        matchesProgramType &&
        matchesCourseType &&
        matchesApplicationNo &&
        matchesStartDate &&
        matchesEndDate &&
        matchesSearch
      );
    });
  }, [reports, filters.filters]);

  // Update filtered reports count for pagination
  useEffect(() => {
    pagination.handleChangePage(null, 0);
  }, [filters.filters]);

  // Handle program type change
  const handleProgramTypeChange = (e) => {
    const value = e.target.value;
    filters.handleFilterChange(e);
    courseData.filterCoursesByProgramType(value);
    // Reset course type when program type changes
    filters.handleFilterChange({ target: { name: "courseType", value: "" } });
  };

  // Export handlers
  const handleExcel = useCallback(() => {
    const exportData = filteredReports.map((item, index) => ({
      SlNo: index + 1,
      Name: item.name,
      CID: item.cid,
      Gender: item.gender,
      ProgramType: item.programType,
      Course: item.course,
      CourseStartDate: item.courseStartDate,
      CourseEndDate: item.courseEndDate,
      Certificate: item.certificate,
      Internal: item.internal,
      Theory: item.theory,
      Practical: item.practical,
      Result: item.result,
    }));
    exportToExcel(exportData, `Assessment_Result_${today}`);
  }, [filteredReports, today]);

  const handlePdf = useCallback((report) => {
    generateAssessmentCertificatePdf(report);
  }, []);

  const handleDownloadAll = useCallback(() => {
    generateAllAssessmentCertificatesPdf(filteredReports);
  }, [filteredReports]);

  // Table columns configuration
  const columns = useMemo(
    () => [
      { id: "index", label: "#", render: (_, index) => index + 1 },
      { id: "name", label: "Name", field: "name" },
      { id: "cid", label: "CID/Reference No", field: "cid" },
      { id: "gender", label: "Gender", field: "gender" },
      { id: "programType", label: "Program Type", field: "programType" },
      { id: "course", label: "Course", field: "course" },
      {
        id: "courseStartDate",
        label: "Course Start Date",
        field: "courseStartDate",
      },
      { id: "courseEndDate", label: "Course End Date", field: "courseEndDate" },
      { id: "certificate", label: "Certificate", field: "certificate" },
      { id: "internal", label: "Internal", field: "internal" },
      { id: "theory", label: "Theory", field: "theory" },
      { id: "practical", label: "Practical", field: "practical" },
      { id: "result", label: "Result", field: "result" },
      {
        id: "actions",
        label: "",
        align: "center",
        render: (item) => (
          <Button
            variant="text"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handlePdf(item)}
            sx={{ textTransform: "none" }}
          >
            Certificate
          </Button>
        ),
      },
    ],
    [handlePdf],
  );

  // Add Download All button to header
  const headerColumns = useMemo(() => {
    const downloadAllCol = {
      id: "downloadAll",
      label: "",
      align: "center",
      render: () => (
        <Button
          variant="text"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadAll}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Download All
        </Button>
      ),
    };
    return [...columns.slice(0, -1), downloadAllCol];
  }, [columns, handleDownloadAll]);

  // Paginated reports for display
  const paginatedReports = filteredReports.slice(
    pagination.page * pagination.rowsPerPage,
    pagination.page * pagination.rowsPerPage + pagination.rowsPerPage,
  );

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <SectionHeader title="Assessment Certificate" />

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterSelect
            name="programType"
            value={filters.filters.programType}
            label="Program Type"
            options={PROGRAM_TYPES}
            onChange={handleProgramTypeChange}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterSelect
            name="courseType"
            value={filters.filters.courseType}
            label="Course"
            options={courseData.filteredCourseList.map((c) => ({
              id: c.course_name,
              label: c.course_name,
            }))}
            onChange={filters.handleFilterChange}
            disabled={!filters.filters.programType}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterDateField
            name="courseStartDate"
            value={filters.filters.courseStartDate}
            label="Course Start Date"
            onChange={filters.handleFilterChange}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterDateField
            name="courseEndDate"
            value={filters.filters.courseEndDate}
            label="Course End Date"
            onChange={filters.handleFilterChange}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FilterTextField
            name="applicationNo"
            value={filters.filters.applicationNo}
            label="Application No"
            type="number"
            onChange={filters.handleFilterChange}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <ActionButtons
            onClear={filters.clearFilters}
            onExport={handleExcel}
            disabled={filteredReports.length === 0}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Search */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <SearchField
            value={filters.filters.search}
            onChange={filters.handleFilterChange}
          />
        </Grid>
      </Grid>

      {/* Reports Table */}
      <DataTable
        columns={headerColumns}
        data={paginatedReports}
        page={0}
        rowsPerPage={paginatedReports.length}
        emptyMessage="No reports found matching your criteria"
      />

      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      <PaginationFooter
        count={filteredReports.length}
        rowsPerPage={pagination.rowsPerPage}
        page={pagination.page}
        onPageChange={pagination.handleChangePage}
        onRowsPerPageChange={pagination.handleChangeRowsPerPage}
      />
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
CertificateIndex.propTypes = {};

export default CertificateIndex;
