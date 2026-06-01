import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Box,
  Link,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import { useSelector } from "react-redux";
import TaskListService from "../../api/services/internal/tasklist/TaskListService";

// Map API response to your component structure
const mapApiDataToTask = (apiData, index) => ({
  id: apiData.application_no || `task-${index}`,
  applicationNo: apiData.application_no || "N/A",
  serviceName: apiData.service_name || "N/A",
  submittedDate: apiData.action_date || "N/A",
  currentStatus: apiData.current_status || "N/A",
  applicantName: apiData.application_name || "N/A",
  remarks: apiData.save_remarks || "",
  route: apiData.route || "",
  serialNo: index + 1,
  serviceId: apiData.service_id || 1,
});

const TaskListIndex = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const locationId = useSelector((state) => state.auth.locationId);

  const taskStatusId = 18; // initiated statusId

  // Fetch tasks from API
  useEffect(() => {
    const fetchGroupTasks = async () => {
      if (!access_token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await TaskListService.getTaskListDetails(
          taskStatusId,
          currentRoleId,
          locationId,
          access_token,
        );
        if (response.data && Array.isArray(response.data)) {
          const mappedTasks = response.data.map((task, index) =>
            mapApiDataToTask(task, index),
          );
          setTasks(mappedTasks);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error("Error fetching group tasks:", err);
        setError("Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupTasks();
  }, [access_token, taskStatusId, currentRoleId, locationId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApplicationClick = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleViewDetails = () => {
    if (selectedTask) {
      if (selectedTask.route) {
        navigate(`/${selectedTask.route}/${selectedTask.applicationNo}`, {
          state: { task: selectedTask },
        });
      } else {
        // Fallback to default route if no route specified
        navigate("/tasklist/task-details-index");
      }
    }
    handleMenuClose();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.submittedDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.currentStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.applicantName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper sx={{ p: 3, mt: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">Task List Index</Typography>

        <TextField
          variant="outlined"
          size="small"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Paper
          sx={{
            width: "100%",
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table
              stickyHeader
              aria-label="task list index table"
              sx={{ borderCollapse: "collapse" }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    "& .MuiTableCell-root": {
                      textAlign: "center",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Serial No
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Application No
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Service Name
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Applicant Name
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Submitted Date
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Current Status
                  </TableCell>
                   <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                    }}
                  >
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.length > 0 ? (
                  paginatedTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        {task.serialNo}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => handleApplicationClick(e, task)}
                            sx={{
                              textDecoration: "none",
                              color: "primary.main",
                              mr: 1,
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {task.applicationNo}
                          </Link>
                          <IconButton
                            size="small"
                            onClick={(e) => handleApplicationClick(e, task)}
                            sx={{ p: 0 }}
                          >
                            <ArrowDropDownIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        <Typography variant="body2">
                          {task.serviceName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        <Typography variant="body2">
                          {task.applicantName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        {task.submittedDate}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        <Chip
                          label={task.currentStatus}
                          size="small"
                          sx={{
                            backgroundColor: "#2196f3",
                            color: "white",
                            fontWeight: "medium",
                            minWidth: "100px",
                            "& .MuiChip-label": {
                              px: 1.5,
                              py: 0.5,
                            },
                          }}
                        />
                      </TableCell>
                       <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        {task.remarks || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ border: "1px solid #e0e0e0", py: 4 }}
                    >
                      <Typography color="text.secondary">
                        {searchTerm
                          ? "No applications found matching your search."
                          : "No tasks available."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Tasks per page:"
          />
        </Paper>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        MenuListProps={{
          dense: true,
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemText primary="View" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default TaskListIndex;