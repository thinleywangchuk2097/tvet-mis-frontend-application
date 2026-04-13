import React, { useState } from "react";
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

const ReportIndex = () => {
  const [filters, setFilters] = useState({
    reportType: "",
    location: "",
    status: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Report types
  const reportTypes = [
    { id: 1, name: "Institute Proposal" },
    { id: 2, name: "Institute Registration" },
    { id: 3, name: "Curriculum Endorse" },
  ];

  // Locations
  const locations = [
    { id: 1, name: "Thimphu" },
    { id: 2, name: "Paro" },
    { id: 3, name: "Wangdue" },
    { id: 4, name: "Tashi Yangtse" },
    { id: 5, name: "Mongar" },
  ];

  // Statuses
  const statuses = [
    { id: 1, name: "Pending" },
    { id: 2, name: "Completed" },
    { id: 3, name: "Approved" },
    { id: 4, name: "Rejected" },
  ];

  // Sample report data
  const [reports] = useState([
    {
      id: 1,
      name: "New Technical Institute - Thimphu",
      type: "Institute Proposal",
      location: "Thimphu",
      status: "Approved",
      date: "2024-01-15",
    },
    {
      id: 2,
      name: "Paro Vocational Training Center",
      type: "Institute Proposal",
      location: "Paro",
      status: "Pending",
      date: "2024-02-02",
    },
    {
      id: 3,
      name: "Wangdue Institute Registration",
      type: "Institute Registration",
      location: "Wangdue",
      status: "Completed",
      date: "2024-01-10",
    },
    {
      id: 4,
      name: "Tashi Yangtse Campus Registration",
      type: "Institute Registration",
      location: "Tashi Yangtse",
      status: "Pending",
      date: "2024-02-20",
    },
    {
      id: 5,
      name: "Mongar Curriculum Endorsement",
      type: "Curriculum Endorse",
      location: "Mongar",
      status: "Approved",
      date: "2024-01-28",
    },
    {
      id: 6,
      name: "Thimphu IT Curriculum Review",
      type: "Curriculum Endorse",
      location: "Thimphu",
      status: "Pending",
      date: "2024-02-15",
    },
    {
      id: 7,
      name: "Paro Institute Renewal",
      type: "Institute Registration",
      location: "Paro",
      status: "Pending",
      date: "2024-02-28",
    },
    {
      id: 8,
      name: "Mongar Polytechnic Proposal",
      type: "Institute Proposal",
      location: "Mongar",
      status: "Approved",
      date: "2024-01-30",
    },
    {
      id: 9,
      name: "Thimphu Curriculum Update",
      type: "Curriculum Endorse",
      location: "Thimphu",
      status: "Completed",
      date: "2024-02-10",
    },
    {
      id: 10,
      name: "Wangdue Craft School Registration",
      type: "Institute Registration",
      location: "Wangdue",
      status: "Completed",
      date: "2024-02-18",
    },
    {
      id: 11,
      name: "Tashi Yangtse Curriculum Endorsement",
      type: "Curriculum Endorse",
      location: "Tashi Yangtse",
      status: "Pending",
      date: "2024-02-25",
    },
    {
      id: 12,
      name: "Paro Agriculture Institute Proposal",
      type: "Institute Proposal",
      location: "Paro",
      status: "Rejected",
      date: "2024-01-05",
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
    page * rowsPerPage + rowsPerPage,
  );

  // Download report
  const handleDownload = (reportId) => {
    console.log(`Downloading report ${reportId}`);
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Reports
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
              <MenuItem value="">All Report Types</MenuItem>
              {reportTypes.map((type) => (
                <MenuItem key={type.id} value={type.name}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Location</InputLabel>
            <Select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              label="Location"
            >
              <MenuItem value="">All Locations</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.name}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.name}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={filteredReports.length === 0}
              fullWidth
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
              <TableCell>Report Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow key={report.id} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        backgroundColor:
                          report.status === "Approved"
                            ? "#e8f5e9"
                            : report.status === "Pending"
                              ? "#fff3e0"
                              : report.status === "Completed"
                                ? "#e3f2fd"
                                : report.status === "Rejected"
                                  ? "#ffebee"
                                  : "#f5f5f5",
                        color:
                          report.status === "Approved"
                            ? "#2e7d32"
                            : report.status === "Pending"
                              ? "#ed6c02"
                              : report.status === "Completed"
                                ? "#1565c0"
                                : report.status === "Rejected"
                                  ? "#d32f2f"
                                  : "#000",
                      }}
                    >
                      {report.status}
                    </Box>
                  </TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(report.id)}
                      sx={{ textTransform: "none" }}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
    </Paper>
  );
};

export default ReportIndex;
