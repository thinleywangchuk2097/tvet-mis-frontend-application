import { useState, useEffect } from "react";
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
import TaskListService from "../../api/services/TaskListService";
import { toast } from "react-toastify";

const MyTaskList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unclaimLoading, setUnclaimLoading] = useState(false);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.accessToken);
  const userId = useSelector((state) => state.auth.userId);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // Fetch tasks from API
  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!userId || !token) {
        setError("User authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await TaskListService.getMyTaskListDetails(
          userId,
          currentRoleId,
          token
        );

        if (response.data && Array.isArray(response.data)) {
          setTasks(response.data);
        } else {
          setTasks([]);
          toast.error("No tasks found or invalid response format");
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again.");
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [userId, token, currentRoleId]);

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
      // Use the route from API data
      if (selectedTask.route) {
        navigate(`/${selectedTask.route}/${selectedTask.application_no}`);
      } else {
        // Fallback to default route with application_no
        navigate(`/my-application-details/${selectedTask.application_no}`);
      }
    }
    handleMenuClose();
  };

  const handleReleaseTask = async () => {
    if (!selectedTask || !token) {
      toast.error("No task selected or authentication required");
      handleMenuClose();
      return;
    }

    try {
      // Show loading state for unclaim action
      setUnclaimLoading(true);

      // Prepare the payload according to API requirements
      const payload = {
        applicationNo: selectedTask.application_no,
        assignedUserId: null,
        taskStatusId: 98, // From your payload example
        assignedRoleId: 1,
        serviceId: selectedTask.service_id || 1 // Use task's service_id if available, otherwise default to 1
      };

      // Call the API to unclaim the task
      const response = await TaskListService.unclaimTask(payload, token);

      // Check response structure
      if (response && response.data) {
        const { status, message } = response.data;

        if (status === 200) {
          // Remove the task from local state
          setTasks((prevTasks) =>
            prevTasks.filter(
              (task) => task.application_no !== selectedTask.application_no
            )
          );

          // Show success message
          toast.success(message || "Task unclaimed successfully");

          // Reset pagination if needed
          if (page > 0 && tasks.length <= page * rowsPerPage) {
            setPage(Math.max(0, page - 1));
          }
        } else {
          toast.error(message || "Failed to unclaim task");
        }
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error releasing task:", err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || 
                            err.response.statusText || 
                            "Server error occurred";
        toast.error(errorMessage);
      } else if (err.request) {
        // Request made but no response
        toast.error("Network error. Please check your connection.");
      } else {
        // Other errors
        toast.error("Failed to unclaim task. Please try again.");
      }
    } finally {
      setUnclaimLoading(false);
      handleMenuClose();
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(
    (task) =>
      task.application_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.application_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.current_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.action_date?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add serial numbers to the filtered data
  const tasksWithSerialNo = filteredTasks.map((task, index) => ({
    ...task,
    serialNo: index + 1,
  }));

  // Format date if needed
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">My Task</Typography>

        {/* Search Field */}
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

      <Paper
        sx={{ width: "100%", overflow: "hidden", border: "1px solid #e0e0e0" }}
      >
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table
            stickyHeader
            aria-label="task list table"
            sx={{ borderCollapse: "collapse" }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ border: "1px solid #e0e0e0", fontWeight: "bold" }}
                >
                  Serial No
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #e0e0e0", fontWeight: "bold" }}
                >
                  Application No
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #e0e0e0", fontWeight: "bold" }}
                >
                  Applicant Name
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #e0e0e0", fontWeight: "bold" }}
                >
                  Service Name
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #e0e0e0", fontWeight: "bold" }}
                >
                  Action Date
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #e0e0e0", fontWeight: "bold" }}
                >
                  Current Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasksWithSerialNo.length > 0 ? (
                tasksWithSerialNo
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((task) => (
                    <TableRow key={task.application_no} hover>
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
                            {task.application_no}
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
                        {task.application_name}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        {task.service_name}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        {formatDate(task.action_date)}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                        <Chip
                          label={task.current_status}
                          size="small"
                          sx={{
                            backgroundColor: "#2196f3", // Simple blue background
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
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ border: "1px solid #e0e0e0", py: 4 }}
                  >
                    {searchTerm
                      ? "No applications found matching your search."
                      : "No task assigned to you."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tasksWithSerialNo.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Dropdown Menu */}
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
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={handleReleaseTask}
          disabled={unclaimLoading}
        >
          {unclaimLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", minWidth: "80px" }}>
              <CircularProgress size={16} sx={{ mr: 1.5 }} />
              <ListItemText>Processing...</ListItemText>
            </Box>
          ) : (
            <ListItemText>Unclaim</ListItemText>
          )}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MyTaskList;