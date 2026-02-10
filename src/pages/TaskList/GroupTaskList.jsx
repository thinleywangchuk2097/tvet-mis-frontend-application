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

// Map API response to your component structure
const mapApiDataToTask = (apiData, index) => ({
  id: apiData.application_no || `task-${index}`,
  applicationNo: apiData.application_no || "N/A",
  serviceName: apiData.service_name || "N/A",
  submittedDate: apiData.action_date || "N/A",
  currentStatus: apiData.current_status || "N/A",
  applicantName: apiData.application_name || "N/A",
  route: apiData.route || "", // Add route from API
  serialNo: index + 1,
  serviceId: apiData.service_id || 1, // Add serviceId from API, default to 1
});

const GroupTaskList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const navigate = useNavigate();

  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const assignedUserId = useSelector((state) => state.auth.userId);
  const locationId = useSelector((state) => state.auth.locationId);

  const taskStatusId = 98; // Replace with appropriate status ID or get from props/state

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

        const response = await TaskListService.getGroupTaskListDetails(
          taskStatusId,
          currentRoleId,
          locationId,
          access_token
        );

        if (response.data && Array.isArray(response.data)) {
          const mappedTasks = response.data.map((task, index) =>
            mapApiDataToTask(task, index)
          );
          setTasks(mappedTasks);
          setTotalTasks(mappedTasks.length);
        } else {
          setTasks([]);
          setTotalTasks(0);
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

  const handleClaimTask = async () => {
    if (!selectedTask) return;

    try {      
      // Prepare the payload according to API requirements
      const claimPayload = {
        applicationNo: selectedTask.applicationNo,
        assignedUserId: assignedUserId,
        taskStatusId: 99, // Assuming 99 is the status for claimed tasks
        assignedRoleId: currentRoleId,
        locationId: locationId,
        serviceId: selectedTask.serviceId || 1, // Use serviceId from task data
        actorId: assignedUserId
      };

      // Call the API
      const response = await TaskListService.claimTask(claimPayload, access_token);
      
      // Handle response based on your API structure
      if (response && response.status === 200) {
        // Remove claimed task from list
        setTasks(tasks.filter((task) => task.id !== selectedTask.id));
        setTotalTasks((prev) => prev - 1);
        
        // Show success toast
        toast.success(response.message || `Task ${selectedTask.applicationNo} claimed successfully!`);
      } else if (response && response.data && response.data.status === 200) {
        // Alternative response structure
        setTasks(tasks.filter((task) => task.id !== selectedTask.id));
        setTotalTasks((prev) => prev - 1);
        
        toast.success(response.data.message || `Task ${selectedTask.applicationNo} claimed successfully!`);
      } else {
        // Handle API errors
        const errorMessage = response?.data?.message || 
                            response?.message || 
                            "Failed to claim task. Please try again.";
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error claiming task:", err);
      
      // Show error toast
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Failed to claim task. Please try again.";
      toast.error(errorMessage);
    } finally {
      handleMenuClose();
    }
  };

  const handleViewDetails = () => {
    if (selectedTask) {
      if (selectedTask.route) {
        // Use the route from API payload with applicationNo as parameter
        navigate(`/${selectedTask.route}/${selectedTask.applicationNo}`, {
          state: { task: selectedTask },
        });
      } else {
        // Fallback to default route if no route specified
        navigate(`/group-application-details/${selectedTask.applicationNo}`, {
          state: { task: selectedTask },
        });
      }
    }
    handleMenuClose();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(
    (task) =>
      task.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.submittedDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.currentStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.applicantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate paginated tasks
  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Typography variant="h4">Group Task</Typography>

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
              aria-label="group task list table"
              sx={{ borderCollapse: "collapse" }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                      width: "8%",
                    }}
                  >
                    Serial No
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                      width: "18%",
                    }}
                  >
                    Application No
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                      width: "22%",
                    }}
                  >
                    Service Name
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                      width: "22%",
                    }}
                  >
                    Applicant Name
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                      width: "15%",
                    }}
                  >
                    Submitted Date
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontWeight: "bold",
                      width: "15%",
                    }}
                  >
                    Current Status
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
        MenuListProps={{
          dense: true,
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemText primary="View" />
        </MenuItem>
        <MenuItem onClick={handleClaimTask}>
          <ListItemText primary="Claim" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GroupTaskList;