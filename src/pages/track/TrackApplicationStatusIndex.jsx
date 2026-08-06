import React, { useState, useEffect } from "react";
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
  Alert,
  CircularProgress,
  useTheme,
  Tooltip,
  IconButton,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import TrackApplicationStatusService from "../../api/services/internal/track/TrackApplicationStatusService";
import CommonService from "../../api/services/internal/common/CommonService";
import UserRoleManagementService from "../../api/services/internal/userrole/UserRoleManagementService";

const TrackApplicationStatusIndex = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [searchFilters, setSearchFilters] = useState({
    searchQuery: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [applications, setApplications] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [roles, setRoles] = useState([]);

  const access_token = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    fetchStatusList();
    fetchRoles();
  }, []);

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      const statuses = statusResponse.data;
      console.log("Status List:", statuses);
      setStatusList(statuses);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const roleResponse =
        await UserRoleManagementService.getRoles(access_token);
      console.log("Roles:", roleResponse.data);
      setRoles(roleResponse.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const getStatusNameFromId = (statusId) => {
    if (!statusList || statusList.length === 0) {
      return `Status ID: ${statusId}`;
    }

    const id = Number(statusId);
    const status = statusList.find((s) => Number(s.id) === id);

    if (status) {
      return status.name;
    }

    return `Status ${statusId}`;
  };

  const getRoleNameFromId = (roleId) => {
    if (!roles || roles.length === 0) return "Unknown";

    const id = Number(roleId);
    const role = roles.find((r) => Number(r.id) === id);
    return role ? role.role_name : `Role ${roleId}`;
  };

  const handleSearchChange = (field) => (event) => {
    setSearchFilters({
      ...searchFilters,
      [field]: event.target.value,
    });
    setPage(0);
  };

  const handleSearch = async () => {
    if (!searchFilters.searchQuery.trim()) {
      toast.warning("Please enter an Application Number");
      return;
    }

    setHasSearched(true);
    setPage(0);
    setLoading(true);
    setApplications([]);

    try {
      const response =
        await TrackApplicationStatusService.getApplicationStatusAuditCurrentTaskDtl(
          searchFilters.searchQuery.trim(),
          access_token,
        );

      console.log("API Response:", response.data);

      if (response && response.data) {
        let dataArray = [];

        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (
          response.data.content &&
          Array.isArray(response.data.content)
        ) {
          dataArray = response.data.content;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } else {
          dataArray = [response.data];
        }

        console.log("Data Array:", dataArray);

        const serviceNameMap = {};
        const uniqueServiceIds = [
          ...new Set(
            dataArray.map((item) => item.service_id).filter((id) => id),
          ),
        ];

        await Promise.all(
          uniqueServiceIds.map(async (serviceId) => {
            try {
              const response = await CommonService.getServiceName(serviceId);
              serviceNameMap[serviceId] = response.data?.serviceName || "N/A";
              console.log(
                `Service name for ID ${serviceId}:`,
                serviceNameMap[serviceId],
              );
            } catch (error) {
              console.error(
                `Error fetching service name for ID ${serviceId}:`,
                error,
              );
              serviceNameMap[serviceId] = "N/A";
            }
          }),
        );

        console.log("Service Name Map:", serviceNameMap);

        const formattedData = dataArray.map((item, index) => {
          const statusName = getStatusNameFromId(item.status_id);
          const roleName = getRoleNameFromId(item.role_id);
          const serviceName = serviceNameMap[item.service_id] || "N/A";

          return {
            uniqueId: `${item.id || index}-${item.record_type || index}`,
            id: item.id || index + 1,
            applicationName:
              item.application_name ||
              item.applicantName ||
              item.customerName ||
              "N/A",
            applicationNo:
              item.application_no || item.applicationNumber || "N/A",
            serviceName: serviceName,
            serviceId: item.service_id,
            applicationDate:
              item.action_date ||
              item.applicationDate ||
              item.createdDate ||
              new Date().toISOString().split("T")[0],
            applicationStatus:
              statusName || item.applicationStatus || item.status || "Pending",
            applicationAt:
              item.center_name || item.location || item.branch || "N/A",
            remarks:
              item.wf_remarks || item.remarks || item.note || "No remarks",
            cidNo: item.cid_no || item.cidNo || item.citizenId || "N/A",
            email: item.email || item.emailAddress || "N/A",
            mobileNo:
              item.mobile_no || item.mobileNo || item.phoneNumber || "N/A",
            courseFee: item.course_fee || item.courseFee || item.fee || "0",
            reviewDate:
              item.review_date ||
              item.reviewDate ||
              item.updatedDate ||
              new Date().toISOString().split("T")[0],
            statusId: item.status_id,
            roleId: item.role_id,
            roleName: roleName,
            recordType: item.record_type,
          };
        });

        console.log("Formatted Data:", formattedData);
        setApplications(formattedData);

        if (formattedData.length === 0) {
          toast.info("No applications found matching your criteria");
        } else {
          toast.success(`Found ${formattedData.length} application(s)`);
        }
      } else {
        toast.warning("No data received from the server");
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error(error.message || "Failed to fetch application data");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchFilters({
      searchQuery: "",
    });
    setHasSearched(false);
    setPage(0);
    setLoading(false);
    setApplications([]);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      submitted: "info",
      Verified: "success",
      Approved: "success",
      Rejected: "error",
      Endorsed: "success",
      "Forwarded QAS Level 1": "info",
      "Forwarded Level 2": "info",
      verified2: "success",
      pending: "warning",
      selected: "success",
      passed: "success",
      failed: "error",
      resumitted: "warning",
      "Forwarded TTTRC": "info",
      "Forwarded Head TTTRC": "info",
      Revision: "warning",
      approved: "success",
      "in review": "warning",
      rejected: "error",
      verified: "success",
      "not verified": "error",
      processing: "warning",
      completed: "success",
      cancelled: "error",
    };
    return statusMap[status] || statusMap[status?.toLowerCase()] || "default";
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "";
    const successStatuses = [
      "approved",
      "verified",
      "completed",
      "endorsed",
      "selected",
      "passed",
      "verified2",
    ];
    const errorStatuses = ["rejected", "cancelled", "not verified", "failed"];

    if (successStatuses.includes(statusLower)) {
      return <CheckCircleIcon sx={{ fontSize: 14 }} />;
    } else if (errorStatuses.includes(statusLower)) {
      return <CancelIcon sx={{ fontSize: 14 }} />;
    } else {
      return <PendingIcon sx={{ fontSize: 14 }} />;
    }
  };

  const filteredApplications = applications;

  const paginatedApplications = filteredApplications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Border color based on theme
  const borderColor = isDark ? "rgba(255, 255, 255, 0.23)" : "#e8ecf1";
  const tableHeaderBg = isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc";
  const hoverBg = isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc";

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2 },
        borderRadius: 1,
        boxShadow: isDark
          ? "0px 2px 8px rgba(0,0,0,0.3)"
          : "0px 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
            borderRadius: 1,
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AssignmentIcon
            sx={{ fontSize: 28, color: theme.palette.primary.main }}
          />
        </Box>
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              fontSize: "1.3rem",
              color: isDark ? "#ffffff" : "inherit",
            }}
          >
            Track Application Status
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.85rem",
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
            }}
          >
            Search and monitor your application progress
          </Typography>
        </Box>
        {hasSearched && (
          <Chip
            label={`${filteredApplications.length} Results`}
            size="small"
            sx={{
              ml: "auto",
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 28,
            }}
          />
        )}
      </Box>

      {/* Search Section */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          transition: "all 0.3s ease",
        }}
      >
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item size={{ xs: 12, md: 8 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 0.5,
                display: "block",
                color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
              }}
            >
              Application Number
            </Typography>
            <Tooltip title="Enter the application number to search" arrow>
              <TextField
                fullWidth
                placeholder="Enter application number..."
                variant="outlined"
                size="small"
                value={searchFilters.searchQuery}
                onChange={handleSearchChange("searchQuery")}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.9rem",
                    borderRadius: 2,
                    color: isDark ? "#ffffff" : "inherit",
                  },
                  "& .MuiInputLabel-root": {
                    color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: borderColor,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.5)"
                      : "#e8ecf1",
                  },
                  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          fontSize: 20,
                          color: isDark
                            ? "rgba(255, 255, 255, 0.5)"
                            : "inherit",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item size={{ xs: 6, md: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              fullWidth
              onClick={handleSearch}
              disabled={loading}
              sx={{
                fontSize: "0.85rem",
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: isDark
                  ? "0px 4px 12px rgba(25, 118, 210, 0.3)"
                  : "0px 4px 12px rgba(25, 118, 210, 0.2)",
                "&:hover": {
                  boxShadow: isDark
                    ? "0px 6px 16px rgba(25, 118, 210, 0.4)"
                    : "0px 6px 16px rgba(25, 118, 210, 0.3)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Search"
              )}
            </Button>
          </Grid>
          <Grid item size={{ xs: 6, md: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              fullWidth
              onClick={handleClearSearch}
              disabled={loading}
              sx={{
                fontSize: "0.85rem",
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                borderColor: borderColor,
                color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, isDark ? 0.1 : 0.04),
                },
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      {hasSearched && (
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.85rem",
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
            }}
          >
            Showing{" "}
            <strong style={{ color: isDark ? "#ffffff" : "inherit" }}>
              {filteredApplications.length}
            </strong>{" "}
            result(s)
          </Typography>
        </Box>
      )}

      {/* Table Section */}
      {hasSearched ? (
        <>
          <TableContainer
            component={Paper}
            sx={{
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table sx={{ borderCollapse: "collapse" }} size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: tableHeaderBg }}>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "50px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "130px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    Application No.
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "150px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    Applicant Name
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "150px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    Service Name
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "100px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    Record Type
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "130px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    Role
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      width: "130px",
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                    }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={36} />
                      <Typography
                        sx={{
                          mt: 1.5,
                          fontSize: "0.9rem",
                          color: isDark
                            ? "rgba(255, 255, 255, 0.7)"
                            : "inherit",
                        }}
                      >
                        Loading applications...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedApplications.length > 0 ? (
                  paginatedApplications.map((application, index) => (
                    <TableRow
                      key={application.uniqueId || `row-${index}`}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: hoverBg,
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          color: isDark
                            ? "rgba(255, 255, 255, 0.7)"
                            : "inherit",
                        }}
                      >
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: isDark ? "#ffffff" : "inherit",
                          }}
                        >
                          {application.applicationNo}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <PersonIcon
                            fontSize="small"
                            sx={{
                              fontSize: 16,
                              color: isDark
                                ? "rgba(255, 255, 255, 0.5)"
                                : "inherit",
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: isDark
                                ? "rgba(255, 255, 255, 0.9)"
                                : "inherit",
                            }}
                          >
                            {application.applicationName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                        }}
                      >
                        <Chip
                          label={application.serviceName || "N/A"}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            height: 24,
                            bgcolor: alpha(
                              theme.palette.secondary.main,
                              isDark ? 0.15 : 0.08,
                            ),
                            color: theme.palette.secondary.main,
                            "& .MuiChip-label": {
                              padding: "0 8px",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                        }}
                      >
                        <Chip
                          label={application.recordType || "N/A"}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            height: 24,
                            bgcolor:
                              application.recordType === "CURRENT"
                                ? alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.15 : 0.08,
                                  )
                                : alpha(
                                    isDark ? "#94a3b8" : "#64748b",
                                    isDark ? 0.1 : 0.08,
                                  ),
                            color:
                              application.recordType === "CURRENT"
                                ? theme.palette.primary.main
                                : isDark
                                  ? "rgba(255, 255, 255, 0.7)"
                                  : "#64748b",
                            "& .MuiChip-label": {
                              padding: "0 8px",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                        }}
                      >
                        <Chip
                          label={application.roleName || "Unknown"}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            height: 24,
                            bgcolor: alpha(
                              theme.palette.info.main,
                              isDark ? 0.15 : 0.08,
                            ),
                            color: theme.palette.info.main,
                            "& .MuiChip-label": {
                              padding: "0 8px",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          border: `1px solid ${borderColor}`,
                          padding: "6px 12px",
                        }}
                      >
                        <Chip
                          label={application.applicationStatus}
                          size="small"
                          color={getStatusColor(application.applicationStatus)}
                          icon={getStatusIcon(application.applicationStatus)}
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            height: 24,
                            "& .MuiChip-label": {
                              padding: "0 8px",
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <SearchIcon
                        sx={{
                          fontSize: 48,
                          opacity: 0.5,
                          mb: 1,
                          color: isDark
                            ? "rgba(255, 255, 255, 0.5)"
                            : "inherit",
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: "1rem",
                          color: isDark
                            ? "rgba(255, 255, 255, 0.9)"
                            : "inherit",
                        }}
                      >
                        No applications found
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.85rem",
                          opacity: 0.7,
                          color: isDark
                            ? "rgba(255, 255, 255, 0.5)"
                            : "inherit",
                        }}
                      >
                        Try adjusting your search criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredApplications.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredApplications.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              sx={{
                borderTop: `1px solid ${borderColor}`,
                mt: 2,
                color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
                "& .MuiTablePagination-selectLabel": {
                  fontSize: "0.8rem",
                  color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
                },
                "& .MuiTablePagination-displayedRows": {
                  fontSize: "0.8rem",
                  color: isDark ? "rgba(255, 255, 255, 0.7)" : "inherit",
                },
                "& .MuiTablePagination-select": {
                  fontSize: "0.8rem",
                  color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
                },
                "& .MuiTablePagination-menuItem": {
                  fontSize: "0.8rem",
                },
                "& .MuiTablePagination-selectIcon": {
                  color: isDark ? "rgba(255, 255, 255, 0.5)" : "inherit",
                },
              }}
            />
          )}
        </>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            borderRadius: 2,
            border: `2px dashed ${borderColor}`,
            transition: "all 0.3s ease",
          }}
        >
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06),
              borderRadius: "50%",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <SearchIcon
              sx={{
                fontSize: 40,
                opacity: 0.6,
                color: isDark ? "rgba(255, 255, 255, 0.5)" : "inherit",
              }}
            />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontSize: "1.2rem",
              mb: 0.5,
              color: isDark ? "rgba(255, 255, 255, 0.9)" : "inherit",
            }}
          >
            Search for Applications
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.9rem",
              color: isDark ? "rgba(255, 255, 255, 0.5)" : "inherit",
            }}
          >
            Enter an application number and click the Search button
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TrackApplicationStatusIndex;
