import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
} from "@mui/icons-material";

const BirmsPublicPaymentIndex = () => {
  const [searchAdviceNo, setSearchAdviceNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Sample data - replace with your actual API data
  const [paymentData, setPaymentData] = useState([
    {
      id: 1,
      paymentAdviceNo: "PA-2024-001",
      amount: 25000.0,
      paymentDate: "2024-01-15",
      status: "Completed",
      beneficiary: "ABC Corporation",
      bankName: "City Bank",
      reference: "INV-2024-001",
    },
    {
      id: 2,
      paymentAdviceNo: "PA-2024-002",
      amount: 18750.5,
      paymentDate: "2024-01-20",
      status: "Pending",
      beneficiary: "XYZ Ltd",
      bankName: "National Bank",
      reference: "INV-2024-002",
    },
    {
      id: 3,
      paymentAdviceNo: "PA-2024-003",
      amount: 42300.75,
      paymentDate: "2024-01-25",
      status: "Processing",
      beneficiary: "Tech Solutions",
      bankName: "Standard Bank",
      reference: "INV-2024-003",
    },
    {
      id: 4,
      paymentAdviceNo: "PA-2024-004",
      amount: 15600.0,
      paymentDate: "2024-02-01",
      status: "Completed",
      beneficiary: "Global Trading",
      bankName: "Commercial Bank",
      reference: "INV-2024-004",
    },
    {
      id: 5,
      paymentAdviceNo: "PA-2024-005",
      amount: 89500.25,
      paymentDate: "2024-02-05",
      status: "Failed",
      beneficiary: "Metro Industries",
      bankName: "United Bank",
      reference: "INV-2024-005",
    },
  ]);

  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = () => {
    setLoading(true);
    setSearchPerformed(true);
    // Simulate API call
    setTimeout(() => {
      if (searchAdviceNo.trim() === "") {
        setFilteredData(paymentData);
      } else {
        const filtered = paymentData.filter((item) =>
          item.paymentAdviceNo
            .toLowerCase()
            .includes(searchAdviceNo.toLowerCase()),
        );
        setFilteredData(filtered);
      }
      setLoading(false);
      setPage(0);
    }, 500);
  };

  const handleClearSearch = () => {
    setSearchAdviceNo("");
    setSearchPerformed(false);
    setFilteredData([]);
    setPage(0);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const displayData = searchPerformed ? filteredData : [];

  return (
    <Box sx={{ p: 7 }}>
      <Paper elevation={3} sx={{ p: 5, borderRadius: 2 }}>
        {/* Header */}
        <Typography gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
          Payment Advice Management
        </Typography>

        {/* Search Section with Grid */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Enter Payment Advice Number..."
                value={searchAdviceNo}
                onChange={(e) => setSearchAdviceNo(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchAdviceNo && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setSearchAdviceNo("")}
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SearchIcon />
                }
              >
                Search
              </Button>
            </Grid>
            <Grid item size={{ xs: 12, md: 1 }}>
              {searchPerformed && (
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={handleClearSearch}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Results Summary */}
        {searchPerformed && !loading && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Found {displayData.length} payment advice record(s)
            </Alert>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Table Section */}
        {!loading && searchPerformed && (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            <Table sx={{ borderCollapse: "collapse" }}>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow
                  sx={{
                    "& th": {
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Payment Advice No.
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Beneficiary
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Payment Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Bank Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Reference
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.length > 0 ? (
                  displayData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          "& td": {
                            borderBottom: "1px solid #e0e0e0",
                            borderRight: "1px solid #e0e0e0",
                            padding: "12px 16px",
                          },
                          "& td:last-child": { borderRight: "none" },
                          backgroundColor:
                            index % 2 === 0 ? "white" : "#fafafa",
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {row.paymentAdviceNo}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.beneficiary}</TableCell>
                        <TableCell
                          sx={{ fontWeight: "bold", color: "#2e7d32" }}
                        >
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell>{formatDate(row.paymentDate)}</TableCell>
                        <TableCell>{row.bankName}</TableCell>
                        <TableCell>{row.reference}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={getStatusColor(row.status)}
                            size="small"
                            sx={{ fontWeight: "medium" }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              console.log("View details:", row.paymentAdviceNo)
                            }
                            title="View Details"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() =>
                              console.log("Print:", row.paymentAdviceNo)
                            }
                            title="Print"
                          >
                            <PrintIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 8, borderRight: "none" }}
                    >
                      <Typography variant="body1" color="textSecondary">
                        No payment advice records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={displayData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: "1px solid #e0e0e0",
                "& .MuiTablePagination-toolbar": {
                  borderTop: "none",
                },
              }}
            />
          </TableContainer>
        )}

        {/* Initial State - No Search Performed */}
        {!searchPerformed && !loading && (
          <Box
            sx={{
              textAlign: "center",
              py: 5,
              backgroundColor: "#fafafa",
              borderRadius: 2,
              border: "1px dashed #ccc",
            }}
          >
            <SearchIcon sx={{ fontSize: 50, color: "#ccc", mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Search for Payment Advice
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Enter a Payment Advice Number and click Search to view details
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BirmsPublicPaymentIndex;
