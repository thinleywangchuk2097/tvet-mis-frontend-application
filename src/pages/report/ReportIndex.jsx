import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FileDownload as DownloadIcon,
} from "@mui/icons-material";

const ReportIndex = () => {
  const theme = useTheme();
  // Report types
  const reportTypes = [
    { id: 1, name: "Sales Report" },
    { id: 2, name: "Inventory Report" },
    { id: 3, name: "Customer Report" },
    { id: 4, name: "Financial Report" },
    { id: 5, name: "Performance Report" },
    { id: 6, name: "Marketing Report" },
    { id: 7, name: "HR Report" },
    { id: 8, name: "Operations Report" },
  ];

  // Locations
  const locations = [
    { id: 1, name: "New York" },
    { id: 2, name: "Los Angeles" },
    { id: 3, name: "Chicago" },
    { id: 4, name: "Houston" },
    { id: 5, name: "Miami" },
    { id: 6, name: "Seattle" },
    { id: 7, name: "Boston" },
    { id: 8, name: "San Francisco" },
  ];

  // Statuses
  const statuses = [
    { id: 1, name: "Pending" },
    { id: 2, name: "Completed" },
    { id: 3, name: "Failed" },
    { id: 4, name: "In Progress" },
    { id: 5, name: "Approved" },
    { id: 6, name: "Rejected" },
  ];

  // State for filters
  const [filters, setFilters] = useState({
    reportType: "",
    location: "",
    status: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sample report data
  const [reports, setReports] = useState([
    {
      id: 1,
      name: "Q1 Sales Report",
      type: "Sales Report",
      location: "New York",
      status: "Completed",
      date: "2023-03-15",
    },
    {
      id: 2,
      name: "Inventory Audit",
      type: "Inventory Report",
      location: "Chicago",
      status: "Pending",
      date: "2023-04-02",
    },
    {
      id: 3,
      name: "Customer Survey",
      type: "Customer Report",
      location: "Los Angeles",
      status: "In Progress",
      date: "2023-04-10",
    },
    {
      id: 4,
      name: "Annual Financial",
      type: "Financial Report",
      location: "Houston",
      status: "Completed",
      date: "2023-01-20",
    },
    {
      id: 5,
      name: "Store Performance",
      type: "Performance Report",
      location: "Miami",
      status: "Failed",
      date: "2023-02-28",
    },
    {
      id: 6,
      name: "Marketing Campaign",
      type: "Marketing Report",
      location: "San Francisco",
      status: "Approved",
      date: "2023-05-15",
    },
    {
      id: 7,
      name: "Employee Satisfaction",
      type: "HR Report",
      location: "Boston",
      status: "Completed",
      date: "2023-03-22",
    },
    {
      id: 8,
      name: "Warehouse Efficiency",
      type: "Operations Report",
      location: "Seattle",
      status: "Rejected",
      date: "2023-04-18",
    },
    {
      id: 9,
      name: "Q2 Sales Report",
      type: "Sales Report",
      location: "New York",
      status: "Pending",
      date: "2023-06-15",
    },
    {
      id: 10,
      name: "Product Analysis",
      type: "Marketing Report",
      location: "Chicago",
      status: "Completed",
      date: "2023-05-30",
    },
    {
      id: 11,
      name: "Annual Budget",
      type: "Financial Report",
      location: "Los Angeles",
      status: "Approved",
      date: "2023-01-10",
    },
    {
      id: 12,
      name: "Employee Performance",
      type: "HR Report",
      location: "Houston",
      status: "Completed",
      date: "2023-04-25",
    },
  ]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      reportType: "",
      location: "",
      status: "",
      search: "",
    });
    setPage(0); // Reset to first page when clearing filters
  };

  // Filter reports based on selected filters
  const filteredReports = reports.filter((report) => {
    return (
      (filters.reportType === "" || report.type === filters.reportType) &&
      (filters.location === "" || report.location === filters.location) &&
      (filters.status === "" || report.status === filters.status) &&
      (filters.search === "" ||
        report.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.type.toLowerCase().includes(filters.search.toLowerCase()))
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
    page * rowsPerPage + rowsPerPage
  );

  // Download report
  const handleDownload = (reportId) => {
    console.log(`Downloading report ${reportId}`);
    // In a real app, this would trigger a download
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports
      </Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Reports
        </Typography>
        <Grid container spacing={3}>
          {/* Report Type Dropdown */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                name="reportType"
                value={filters.reportType}
                onChange={handleFilterChange}
                label="Report Type"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300, // Increased dropdown height
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>All Report Types</em>
                </MenuItem>
                {reportTypes.map((type) => (
                  <MenuItem key={type.id} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Location Dropdown */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                label="Location"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300, // Increased dropdown height
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>All Locations</em>
                </MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.name}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Dropdown */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300, // Increased dropdown height
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search reports..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, search: "" }))
                      }
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={filteredReports.length === 0}
              >
                Export All
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Table */}
      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table
            sx={{
              borderCollapse: "separate",
              borderSpacing: 0,
              "& th, & td": {
                borderRight: `1px solid ${theme.palette.divider}`,
                borderBottom: `1px solid ${theme.palette.divider}`,
                "&:last-child": { borderRight: "none" },
              },
              "& th": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#333" : "#f5f5f5",
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
                fontWeight: "bold",
                borderTop: `1px solid ${theme.palette.divider}`,
              },
              "& tr:last-child td": { borderBottom: "none" },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "#f5f5f5",
                  "& .MuiTableCell-root": {
                    fontWeight: "bold",
                    borderRight: "1px solid rgba(224, 224, 224, 1)",
                    "&:last-child": {
                      borderRight: "none",
                    },
                  },
                }}
              >
                <TableCell>Report Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      {report.name}
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      {report.type}
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      {report.location}
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor:
                            report.status === "Completed"
                              ? "#e8f5e9"
                              : report.status === "Pending"
                              ? "#fff8e1"
                              : report.status === "Failed"
                              ? "#ffebee"
                              : report.status === "Approved"
                              ? "#e3f2fd"
                              : report.status === "Rejected"
                              ? "#ffebee"
                              : "#f5f5f5",
                          color:
                            report.status === "Completed"
                              ? "#2e7d32"
                              : report.status === "Pending"
                              ? "#ff8f00"
                              : report.status === "Failed"
                              ? "#c62828"
                              : report.status === "Approved"
                              ? "#1565c0"
                              : report.status === "Rejected"
                              ? "#c62828"
                              : "#000000",
                        }}
                      >
                        {report.status}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      {report.date}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(report.id)}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                  >
                    No reports found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: "1px solid rgba(224, 224, 224, 1)",
          }}
        />
      </Paper>
    </Container>
  );
};

export default ReportIndex;
