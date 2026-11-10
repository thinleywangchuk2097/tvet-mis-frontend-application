import React, { useState, useEffect } from "react";
import {
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
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import TrackApplicationStatusService from "../../api/services/internal/track/TrackApplicationStatusService";
import CommonService from "../../api/services/internal/common/CommonService";
import UserRoleManagementService from "../../api/services/internal/userrole/UserRoleManagementService";

// "26 Oct 2026, 10:42"
const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// minutes -> "2d 4h 15m"
const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === "") return "—";
  const m = Number(minutes);
  if (!Number.isFinite(m) || m < 0) return "—";
  if (m < 1) return "< 1m";
  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  const mins = Math.floor(m % 60);
  return [days ? `${days}d` : null, hours ? `${hours}h` : null, mins && !days ? `${mins}m` : null]
    .filter(Boolean)
    .join(" ") || "0m";
};

const TrackApplicationStatusIndex = () => {
  const [searchFilters, setSearchFilters] = useState({
    searchQuery: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [applications, setApplications] = useState([]);
  const [roles, setRoles] = useState([]);

  const access_token = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    fetchRoles();
  }, []);

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
          // role name now comes from the backend join on tbl_role
          const roleName = item.role_name || getRoleNameFromId(item.role_id);
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
              item.status_name || "Pending",
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
            // while the application is with REC: names of members still to act / already done
            actorName: item.actor_name || "",
            assignedRoleName: item.assigned_role_name || "",
            assignedUserNames: item.assigned_user_names || "",
            recPendingUsers: item.rec_pending_users || "",
            recCompletedUsers: item.rec_completed_users || "",
            actionDate: item.action_date || null,
            turnaroundMinutes:
              item.turnaround_minutes !== undefined &&
              item.turnaround_minutes !== null
                ? Number(item.turnaround_minutes)
                : null,
          };
        });

        // order by action date (oldest first)
        formattedData.sort((a, b) => {
          const ta = new Date(String(a.actionDate || "").replace(" ", "T")).getTime() || 0;
          const tb = new Date(String(b.actionDate || "").replace(" ", "T")).getTime() || 0;
          return ta - tb;
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

  const paginatedApplications = applications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const headCell = {
    border: "1px solid #ccc",
    fontWeight: "bold",
    fontSize: "0.78rem",
    padding: "6px 8px",
  };
  const cell = {
    border: "1px solid #ccc",
    fontSize: "0.78rem",
    padding: "4px 8px",
  };
  const small = { fontSize: "0.72rem" };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
        >
          <Typography variant="h6" component="h1">
            Track Application Status
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              placeholder="Enter application number..."
              variant="outlined"
              size="small"
              value={searchFilters.searchQuery}
              onChange={handleSearchChange("searchQuery")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 260, "& input": { fontSize: "0.85rem" } }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SearchIcon />
                )
              }
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearSearch}
              disabled={loading}
            >
              Clear
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper}>
          <Table size="small" sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow
                sx={{
                  "& .MuiTableCell-root": {
                    textAlign: "center",
                  },
                }}
              >
                <TableCell sx={headCell}>#</TableCell>
                <TableCell sx={headCell}>Application No.</TableCell>
                <TableCell sx={headCell}>Applicant Name</TableCell>
                <TableCell sx={headCell}>Service Name</TableCell>
                <TableCell sx={headCell}>Record Type</TableCell>
                <TableCell sx={headCell}>Role</TableCell>
                <TableCell sx={headCell}>Status</TableCell>
                <TableCell sx={{ ...headCell, whiteSpace: "nowrap" }}>
                  Action Date
                </TableCell>
                <TableCell sx={{ ...headCell, whiteSpace: "nowrap" }}>
                  Turn Around
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : paginatedApplications.length > 0 ? (
                paginatedApplications.map((application, index) => (
                  <TableRow key={application.uniqueId || `row-${index}`} hover>
                    <TableCell sx={cell}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={cell}>{application.applicationNo}</TableCell>
                    <TableCell sx={cell}>
                      {application.applicationName}
                    </TableCell>
                    <TableCell sx={cell}>{application.serviceName}</TableCell>
                    <TableCell sx={cell} align="center">
                      <Chip
                        label={application.recordType || "N/A"}
                        color={
                          application.recordType === "CURRENT"
                            ? "primary"
                            : "default"
                        }
                        size="small"
                        sx={{ height: 20, fontSize: "0.68rem" }}
                      />
                    </TableCell>
                    <TableCell sx={cell}>
                      {application.roleName || "-"}
                      {/* who acted on this step (tbl_user) */}
                      {application.actorName && (
                        <Typography sx={small} color="text.secondary">
                          By: {application.actorName}
                        </Typography>
                      )}
                      {/* current step: who it is with now (tbl_task_dtls) */}
                      {application.recordType === "CURRENT" &&
                        !application.recPendingUsers &&
                        (application.assignedRoleName ||
                          application.assignedUserNames) && (
                          <Typography sx={small} color="primary.main">
                            <strong>Now with:</strong>{" "}
                            {[
                              application.assignedRoleName,
                              application.assignedUserNames,
                            ]
                              .filter(Boolean)
                              .join(" - ")}
                          </Typography>
                        )}
                      {/* Application is with REC: show the REC member names */}
                      {application.recordType === "CURRENT" &&
                        application.recPendingUsers && (
                          <Typography sx={small} color="warning.main">
                            <strong>Pending with REC:</strong>{" "}
                            {application.recPendingUsers}
                          </Typography>
                        )}
                      {application.recordType === "CURRENT" &&
                        application.recCompletedUsers && (
                          <Typography sx={small} color="success.main">
                            <strong>Completed:</strong>{" "}
                            {application.recCompletedUsers}
                          </Typography>
                        )}
                    </TableCell>
                    <TableCell sx={cell} align="center">
                      <Chip
                        label={application.applicationStatus}
                        color="success"
                        size="small"
                        sx={{ height: 20, fontSize: "0.68rem" }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>
                      {formatDateTime(application.actionDate) || "-"}
                    </TableCell>
                    {/* Turnaround = action date -> current date */}
                    <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>
                      {formatDuration(application.turnaroundMinutes)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {hasSearched
                        ? "No applications found."
                        : "Enter an application number and click Search."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={applications.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              "& .MuiToolbar-root": { minHeight: 40 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                { fontSize: "0.78rem" },
            }}
          />
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default TrackApplicationStatusIndex;
