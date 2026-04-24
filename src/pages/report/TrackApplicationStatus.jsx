import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Typography,
  InputAdornment,
  Grid,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const TrackApplicationStatus = () => {
  const [searchFilters, setSearchFilters] = useState({
    searchQuery: "", // Combined search for applicationNo and applicationName
    date: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sample data - replace with your actual data source
  const [applications] = useState([
    {
      id: 1,
      applicationName: "John Doe",
      applicationNo: "APP001",
      serviceName: "Passport Renewal",
      applicationDate: "2024-01-15",
      applicationStatus: "Approved",
      applicationAt: "New York Center",
      remarks: "All documents verified successfully",
    },
    {
      id: 2,
      applicationName: "Jane Smith",
      applicationNo: "APP002",
      serviceName: "Visa Application",
      applicationDate: "2024-01-20",
      applicationStatus: "Pending",
      applicationAt: "Los Angeles Center",
      remarks: "Awaiting additional documents",
    },
    {
      id: 3,
      applicationName: "Mike Johnson",
      applicationNo: "APP003",
      serviceName: "Driver License",
      applicationDate: "2024-01-25",
      applicationStatus: "In Review",
      applicationAt: "Chicago Center",
      remarks: "Background check in progress",
    },
    {
      id: 4,
      applicationName: "Sarah Williams",
      applicationNo: "APP004",
      serviceName: "Birth Certificate",
      applicationDate: "2024-02-01",
      applicationStatus: "Rejected",
      applicationAt: "Houston Center",
      remarks: "Incomplete documentation provided",
    },
    {
      id: 5,
      applicationName: "Robert Brown",
      applicationNo: "APP005",
      serviceName: "Tax Registration",
      applicationDate: "2024-02-05",
      applicationStatus: "Approved",
      applicationAt: "Phoenix Center",
      remarks: "Tax ID generated successfully",
    },
    {
      id: 6,
      applicationName: "Emily Davis",
      applicationNo: "APP006",
      serviceName: "Marriage License",
      applicationDate: "2024-02-10",
      applicationStatus: "Pending",
      applicationAt: "Philadelphia Center",
      remarks: "Waiting for witness signatures",
    },
  ]);

  const handleSearchChange = (field) => (event) => {
    setSearchFilters({
      ...searchFilters,
      [field]: event.target.value,
    });
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchFilters({
      searchQuery: "",
      date: "",
    });
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter applications based on search criteria
  const filteredApplications = applications.filter((app) => {
    // Combined search for applicationNo and applicationName
    const matchesSearchQuery =
      searchFilters.searchQuery === "" ||
      app.applicationNo
        .toLowerCase()
        .includes(searchFilters.searchQuery.toLowerCase()) ||
      app.applicationName
        .toLowerCase()
        .includes(searchFilters.searchQuery.toLowerCase());

    const matchesDate =
      searchFilters.date === "" || app.applicationDate === searchFilters.date;

    return matchesSearchQuery && matchesDate;
  });

  // Pagination
  const paginatedApplications = filteredApplications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Track Application Status
      </Typography>

      {/* Search Section */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search by Application No. or Applicant Name"
              variant="outlined"
              size="small"
              placeholder="Enter application number or name..."
              value={searchFilters.searchQuery}
              onChange={handleSearchChange("searchQuery")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Application Date"
              type="date"
              variant="outlined"
              size="small"
              value={searchFilters.date}
              onChange={handleSearchChange("date")}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              fullWidth
              onClick={() => setPage(0)}
            >
              Search
            </Button>
          </Grid>
          <Grid item size={{ xs: 12, md: 1 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<ClearIcon />}
              fullWidth
              onClick={handleClearSearch}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {filteredApplications.length} result(s)
        </Typography>
      </Box>

      {/* Table Section with Borders */}
      <TableContainer
        component={Paper}
        sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}
      >
        <Table sx={{ border: "1px solid #e0e0e0" }}>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  borderBottom: "2px solid #e0e0e0",
                  borderRight: "1px solid #e0e0e0",
                  fontWeight: "bold",
                },
              }}
            >
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                ID
              </TableCell>
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                Application No.
              </TableCell>
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                Applicant Name
              </TableCell>
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                Application At
              </TableCell>
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                Service Name
              </TableCell>
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                Application Date
              </TableCell>
              <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                Status
              </TableCell>
              <TableCell>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApplications.length > 0 ? (
              paginatedApplications.map((application) => (
                <TableRow
                  key={application.id}
                  hover
                  sx={{
                    "& td": {
                      borderRight: "1px solid #e0e0e0",
                      borderBottom: "1px solid #e0e0e0",
                    },
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    {application.id}
                  </TableCell>
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    <Typography variant="body2" fontFamily="monospace">
                      {application.applicationNo}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    {application.applicationName}
                  </TableCell>
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    {application.applicationAt}
                  </TableCell>
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    {application.serviceName}
                  </TableCell>
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    {new Date(application.applicationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ borderRight: "1px solid #e0e0e0" }}>
                    {application.applicationStatus}
                  </TableCell>
                  <TableCell>{application.remarks}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No applications found matching your search criteria
                  </Typography>
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
        count={filteredApplications.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
      />
    </Paper>
  );
};

export default TrackApplicationStatus;