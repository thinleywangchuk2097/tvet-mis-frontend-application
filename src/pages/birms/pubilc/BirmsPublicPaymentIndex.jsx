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
  Tooltip,
  Link,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";

const BirmsPublicPaymentIndex = () => {
  const [searchAdviceNo, setSearchAdviceNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState([]);

  const fetchPaymentDetails = async (paymentAdviceNo) => {
    try {
      console.log("payment advice no", paymentAdviceNo);
      setLoading(true);
      const response =
        await BirmsPaymentService.getPaymentByPaymentAdviceNo(paymentAdviceNo);
      const data = Array.isArray(response.data)
        ? response.data
        : [response.data];
      setPaymentDetails(data);
      console.log("payment Details:", data);
      return data;
    } catch (error) {
      console.error("Error fetching payment details:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchAdviceNo.trim()) {
      setSearchPerformed(false);
      setPaymentDetails([]);
      return;
    }

    setSearchPerformed(true);
    try {
      const data = await fetchPaymentDetails(searchAdviceNo.trim());
      setPaymentDetails(data);
      setPage(0);
    } catch (error) {
      setPaymentDetails([]);
    }
  };

  const handleClearSearch = () => {
    setSearchAdviceNo("");
    setSearchPerformed(false);
    setPaymentDetails([]);
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

  // Function to open payment link
  const handleOpenPaymentLink = (redirectUrl, paymentAdviceNo) => {
    if (!redirectUrl) {
      console.error("No redirect URL available for payment:", paymentAdviceNo);
      alert("Payment URL is not available for this payment advice.");
      return;
    }

    console.log("Opening payment link:", redirectUrl);
    window.open(redirectUrl, "_blank", "noopener,noreferrer");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
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
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "null") return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const displayData = searchPerformed ? paymentDetails : [];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography
          gutterBottom
          sx={{ mb: 2, fontWeight: "bold", fontSize: "1.1rem" }}
        >
          Payment Advice Management
        </Typography>

        <Box sx={{ mb: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              placeholder="Enter Payment Advice Number..."
              value={searchAdviceNo}
              onChange={(e) => setSearchAdviceNo(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchAdviceNo && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchAdviceNo("")}
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: "100%", md: 450 },
                "& .MuiInputBase-root": {
                  height: 40,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !searchAdviceNo.trim()}
              startIcon={
                loading ? (
                  <CircularProgress size={18} />
                ) : (
                  <SearchIcon fontSize="small" />
                )
              }
              size="medium"
              sx={{
                height: 40,
                fontSize: "0.8125rem",
                padding: "0 24px",
                minWidth: "auto",
                flexShrink: 0,
              }}
            >
              Search
            </Button>
            {searchPerformed && (
              <Button
                variant="contained"
                color="error"
                onClick={handleClearSearch}
                startIcon={<ClearIcon fontSize="small" />}
                size="medium"
                sx={{
                  height: 40,
                  fontSize: "0.8125rem",
                  padding: "0 24px",
                  minWidth: "auto",
                  flexShrink: 0,
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {searchPerformed && !loading && (
          <Box sx={{ mb: 1.5 }}>
            <Alert
              severity={displayData.length > 0 ? "info" : "warning"}
              sx={{
                borderRadius: 1.5,
                py: 0.5,
                "& .MuiAlert-message": {
                  fontSize: "0.875rem",
                },
              }}
            >
              {displayData.length > 0
                ? `Found ${displayData.length} payment advice record(s)`
                : "No payment advice records found for the given number"}
            </Alert>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!loading && searchPerformed && displayData.length > 0 && (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              border: "1px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            <Table sx={{ borderCollapse: "collapse" }} size="small">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow
                  sx={{
                    "& th": {
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "0.75rem",
                      padding: "6px 8px",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                      padding: "6px 8px",
                    }}
                  >
                    Payment Advice No.
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                      padding: "6px 8px",
                    }}
                  >
                    Beneficiary
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                      padding: "6px 8px",
                    }}
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                      padding: "6px 8px",
                    }}
                  >
                    Due Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                      padding: "6px 8px",
                    }}
                  >
                    Platform
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid #e0e0e0",
                      padding: "6px 8px",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      padding: "6px 8px",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      hover
                      sx={{
                        "& td": {
                          borderBottom: "1px solid #e0e0e0",
                          borderRight: "1px solid #e0e0e0",
                          padding: "4px 8px",
                          fontSize: "0.8125rem",
                        },
                        "& td:last-child": { borderRight: "none" },
                        backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "medium",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {row.paymentAdviceNo || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {row.taxPayerName || "N/A"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          color: "#2e7d32",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {formatCurrency(row.totalPayableAmount)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {formatDate(row.paymentDueDate)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {row.platform || "N/A"}
                      </TableCell>
                      <TableCell sx={{ padding: "2px 8px" }}>
                        <Chip
                          label={row.paymentStatus || "Unknown"}
                          color={getStatusColor(row.paymentStatus)}
                          size="small"
                          sx={{
                            fontWeight: "medium",
                            height: 22,
                            fontSize: "0.6875rem",
                            "& .MuiChip-label": {
                              px: 1,
                              py: 0.5,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ padding: "2px 8px" }}>
                        <Tooltip title="Make Payment">
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() =>
                              handleOpenPaymentLink(
                                row.redirectUrl,
                                row.paymentAdviceNo,
                              )
                            }
                            disabled={!row.redirectUrl}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              color: !row.redirectUrl ? "#bdbdbd" : "#1976d2",
                              textDecoration: "underline",
                              textUnderlineOffset: "2px",
                              fontWeight: 500,
                              fontSize: "0.8125rem",
                              cursor: !row.redirectUrl
                                ? "not-allowed"
                                : "pointer",
                              background: "none",
                              border: "none",
                              padding: 0,
                              fontFamily: "inherit",
                              "&:hover": {
                                color: !row.redirectUrl ? "#bdbdbd" : "#1565c0",
                                textDecoration: "underline",
                              },
                              "&:disabled": {
                                color: "#bdbdbd",
                                cursor: "not-allowed",
                              },
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                            Make Payment
                          </Link>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  minHeight: 44,
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  {
                    fontSize: "0.75rem",
                  },
                "& .MuiTablePagination-select": {
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                },
              }}
            />
          </TableContainer>
        )}

        {!loading && searchPerformed && displayData.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              backgroundColor: "#fafafa",
              borderRadius: 2,
              border: "1px dashed #ccc",
            }}
          >
            <SearchIcon sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
            <Typography
              variant="h6"
              color="textSecondary"
              gutterBottom
              sx={{ fontSize: "1rem" }}
            >
              No Results Found
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontSize: "0.875rem" }}
            >
              No payment advice found for "{searchAdviceNo}"
            </Typography>
          </Box>
        )}

        {!searchPerformed && !loading && (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              backgroundColor: "#fafafa",
              borderRadius: 2,
              border: "1px dashed #ccc",
            }}
          >
            <SearchIcon sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
            <Typography
              variant="h6"
              color="textSecondary"
              gutterBottom
              sx={{ fontSize: "1rem" }}
            >
              Search for Payment Advice
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontSize: "0.875rem" }}
            >
              Enter a Payment Advice Number and click Search to view details
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BirmsPublicPaymentIndex;
