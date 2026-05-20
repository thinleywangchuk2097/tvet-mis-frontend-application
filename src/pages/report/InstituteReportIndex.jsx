import React, { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToExcel } from "@/utils/exportExcel";
import { useSelector } from "react-redux";
import ReportService from "../../api/services/internal/report/ReportService";
import CommonService from "../../api/services/CommonService";

const InstituteReportIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const [institutesProposalType, setInstitutesProposalType] = useState([]);
  const [instituteRegistrationType, setInstituteRegistrationType] = useState([]);
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [instituteProposalList, setInstituteProposalList] = useState([]);
  const [instituteRegistrationList, setInstituteRegistrationList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [filters, setFilters] = useState({
    reportType: "", // 1 for Institute Proposal, 2 for Institute Registration
    subReportType: "", // For specific proposal or registration type
    location: "",
    status: "",
    search: "",
  });

  // Report type options
  const reportTypeOptions = [
    { id: 1, name: "Institute Proposal" },
    { id: 2, name: "Institute Registration" }
  ];

  useEffect(() => {
    fetchDzongkhagList();
    fetchStatusList();
  }, []);

  // Fetch data when report type changes
  useEffect(() => {
    if (filters.reportType === "1") {
      fetchInstitutesProposalType();
      fetchInstituteProposalList();
      // Reset pagination and subReportType
      setPage(0);
      setFilters(prev => ({ ...prev, subReportType: "" }));
    } else if (filters.reportType === "2") {
      fetchInstituteRegistrationType();
      fetchInstituteRegistrationList();
      // Reset pagination and subReportType
      setPage(0);
      setFilters(prev => ({ ...prev, subReportType: "" }));
    }
  }, [filters.reportType]);

  const fetchInstitutesProposalType = async () => {
    try {
      const response = await ReportService.getInstitutesProposalType(access_token);
      setInstitutesProposalType(response.data);
      console.log("Institute Proposal Types:", response.data);
    } catch (error) {
      console.error("Error fetching institute proposal types:", error);
    }
  };

  const fetchInstituteRegistrationType = async () => {
    try {
      const response = await ReportService.getInstituteRegistrationType(access_token);
      setInstituteRegistrationType(response.data);
      console.log("Institute Registration Types:", response.data);
    } catch (error) {
      console.error("Error fetching institute registration types:", error);
    }
  };

  const fetchDzongkhagList = async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data);
      console.log("Dzongkhag List:", response.data);
    } catch (error) {
      console.error("Error fetching dzongkhag list:", error);
    }
  };

  const fetchStatusList = async () => {
    try {
      const response = await CommonService.getByParentId(4);
      setStatusList(response.data);
      console.log("Status List:", response.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchInstituteProposalList = async () => {
    setLoading(true);
    try {
      const response = await ReportService.getInstitutesProposalDetails(access_token);
      setInstituteProposalList(response.data);
      console.log("Institute Proposal List:", response.data);
    } catch (error) {
      console.error("Error fetching institute proposal list:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstituteRegistrationList = async () => {
    setLoading(true);
    try {
      const response = await ReportService.getInstitutesRegistrationDetails(access_token);
      setInstituteRegistrationList(response.data);
      console.log("Institute Registration List:", response.data);
    } catch (error) {
      console.error("Error fetching institute registration list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get dzongkhag name by id
  const getDzongkhagName = (dzongkhagId) => {
    const dzongkhag = dzongkhagList.find(d => d.id === parseInt(dzongkhagId));
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  // Get status name by id
  const getStatusName = (statusId) => {
    const status = statusList.find(s => s.id === parseInt(statusId));
    return status ? status.name : "N/A";
  };

  // Get current data based on selected report type
  const getCurrentData = () => {
    if (filters.reportType === "1") {
      return instituteProposalList.map(proposal => ({
        id: proposal.id,
        name: proposal.company_name || `Application ${proposal.application_no}`,
        application_no: proposal.application_no,
        type_id: proposal.service_id,
        location: getDzongkhagName(proposal.dzongkhag_id),
        location_id: proposal.dzongkhag_id,
        status: getStatusName(proposal.status_id),
        status_id: proposal.status_id,
        date: proposal.created_at ? proposal.created_at.split('T')[0] : "N/A",
      }));
    } else if (filters.reportType === "2") {
      return instituteRegistrationList.map(registration => ({
        id: registration.institute_id,
        name: registration.proposed_institute_name || `Application ${registration.application_no}`,
        application_no: registration.application_no,
        type_id: registration.service_id,
        location: getDzongkhagName(registration.dzongkhag_id),
        location_id: registration.dzongkhag_id,
        status: getStatusName(registration.status_id),
        status_id: registration.status_id,
        date: registration.created_at ? registration.created_at.split('T')[0] : "N/A",
      }));
    }
    return [];
  };

  // Get sub report type options based on main report type
  const getSubReportTypeOptions = () => {
    if (filters.reportType === "1") {
      return institutesProposalType;
    } else if (filters.reportType === "2") {
      return instituteRegistrationType;
    }
    return [];
  };

  // Get report type name by id
  const getReportTypeName = (typeId) => {
    const options = getSubReportTypeOptions();
    const type = options.find(t => t.id === parseInt(typeId));
    return type ? type.service_name : "N/A";
  };

  const today = new Date().toISOString().split("T")[0];

  // Excel Export function
  const handleExcelExport = () => {
    const data = filteredReports.map((item, index) => ({
      SlNo: index + 1,
      ApplicationNo: item.application_no || "N/A",
      ReportName: item.name,
      Type: getReportTypeName(item.type_id),
      Location: item.location,
      Status: item.status,
      Date: item.date,
    }));

    exportToExcel(data, `Institute_Reports_${today}`);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      reportType: "",
      subReportType: "",
      location: "",
      status: "",
      search: "",
    });
    setPage(0);
  };

  // Filter reports based on selected filters
  const filteredReports = getCurrentData().filter((report) => {
    return (
      (filters.subReportType === "" || report.type_id === parseInt(filters.subReportType)) &&
      (filters.location === "" || report.location === filters.location) &&
      (filters.status === "" || report.status === filters.status) &&
      (filters.search === "" ||
        report.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.application_no?.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated reports
  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Function to get status color
  const getStatusColor = (status) => {
    const statusColors = {
      submitted: { bg: "#e3f2fd", color: "#1565c0" },
      verified: { bg: "#e8f5e9", color: "#2e7d32" },
      verified2: { bg: "#e8f5e9", color: "#2e7d32" },
      approved: { bg: "#e8f5e9", color: "#2e7d32" },
      rejected: { bg: "#ffebee", color: "#d32f2f" },
      endorsed: { bg: "#f3e5f5", color: "#7b1fa2" },
      pending: { bg: "#fff3e0", color: "#ed6c02" },
      "Forwarded to QAS Level 1": { bg: "#e8eaf6", color: "#3949ab" },
      "Forwarded to Level 2": { bg: "#e8eaf6", color: "#3949ab" },
      selected: { bg: "#e0f2f1", color: "#00695c" },
      passed: { bg: "#e8f5e9", color: "#2e7d32" },
      failed: { bg: "#ffebee", color: "#d32f2f" },
    };

    return statusColors[status?.toLowerCase()] || { bg: "#f5f5f5", color: "#000" };
  };

  if (loading && getCurrentData().length === 0 && filters.reportType) {
    return (
      <Paper sx={{ p: 2, mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Institute Reports
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Report Type</InputLabel>
            <Select
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              label="Report Type"
            >
              <MenuItem value="">Select Report Type</MenuItem>
              {reportTypeOptions.map((type) => (
                <MenuItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Conditional Sub Report Type Dropdown */}
        {filters.reportType && (
          <Grid item size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                {filters.reportType === "1" ? "Proposal Type" : "Registration Type"}
              </InputLabel>
              <Select
                name="subReportType"
                value={filters.subReportType}
                onChange={handleFilterChange}
                label={filters.reportType === "1" ? "Proposal Type" : "Registration Type"}
              >
                <MenuItem value="">All {filters.reportType === "1" ? "Proposal" : "Registration"} Types</MenuItem>
                {getSubReportTypeOptions().map((type) => (
                  <MenuItem key={type.id} value={type.id.toString()}>
                    {type.service_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item size={{ xs: 12, md: filters.reportType ? 2 : 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Location</InputLabel>
            <Select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              label="Location"
            >
              <MenuItem value="">All Locations</MenuItem>
              {dzongkhagList.map((dzongkhag) => (
                <MenuItem key={dzongkhag.id} value={dzongkhag.dzonkhagName}>
                  {dzongkhag.dzonkhagName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: filters.reportType ? 2 : 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statusList.map((status) => (
                <MenuItem key={status.id} value={status.name}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: filters.reportType ? 2 : 3 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!filters.reportType || filteredReports.length === 0}
              fullWidth
              onClick={handleExcelExport}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Divider after filters */}
      <Divider sx={{ my: 2 }} />

      {/* Search - Right aligned */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search by name or application no..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            disabled={!filters.reportType}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Reports Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": {
              border: "1px solid #ccc",
              padding: "8px",
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Report Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!filters.reportType ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Please select a report type to view data
                </TableCell>
              </TableRow>
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => {
                const statusStyle = getStatusColor(report.status);
                return (
                  <TableRow key={report.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{report.application_no || "N/A"}</TableCell>
                    <TableCell>{report.name || "N/A"}</TableCell>
                    <TableCell>{getReportTypeName(report.type_id)}</TableCell>
                    <TableCell>{report.location}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {report.status}
                      </Box>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No reports found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Divider before pagination */}
      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      {filters.reportType && filteredReports.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedReports.length} of {filteredReports.length} reports
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredReports.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
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
      )}
    </Paper>
  );
};

export default InstituteReportIndex;