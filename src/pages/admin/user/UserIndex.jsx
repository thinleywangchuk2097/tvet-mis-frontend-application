import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Chip,
  InputAdornment,
  TablePagination,
  Checkbox,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Search as SearchIcon,
} from "@mui/icons-material";
import UserRoleManagementService from "../../../api/services/UserRoleManagementService";
import CommonService from "../../../api/services/CommonService";

import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Validation Schemas
const createUserSchema = Yup.object().shape({
  user_id: Yup.string().required("User ID is required"),
  first_name: Yup.string().required("First name is required"),
  middle_name: Yup.string(),
  last_name: Yup.string().required("Last name is required"),
  current_role: Yup.string().required("Current role is required"),
  roles: Yup.array()
    .min(1, "At least one role is required")
    .required("Roles are required"),
  location_id: Yup.number().required("Location is required"),
  mobile_no: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile number must be 8 digits")
    .required("Mobile number is required"),
  email_id: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Password must contain at least one uppercase, one lowercase, one number and one special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

const updateUserSchema = Yup.object().shape({
  user_id: Yup.string().required("User ID is required"),
  first_name: Yup.string().required("First name is required"),
  current_role: Yup.string().required("Current role is required"),
  roles: Yup.array()
    .min(1, "At least one role is required")
    .required("Roles are required"),
  location_id: Yup.number().required("Location is required"),
  mobile_no: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile number must be 8 digits")
    .required("Mobile number is required"),
  email_id: Yup.string().email("Invalid email").required("Email is required"),
});

const UserIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [originalUserData, setOriginalUserData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locations, setLocations] = useState([]);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [rolesOpen, setRolesOpen] = useState(false); // State to control roles dropdown

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch users
        const usersResponse = await UserRoleManagementService.getAllUsers(
          access_token
        );
        if (usersResponse.status === 200) {
          const formattedUsers = usersResponse.data.map((user) => ({
            user_id: user.user_id || "",
            first_name: user.first_name || "",
            middle_name: user.middle_name || "",
            last_name: user.last_name || "",
            current_role: user.current_role || "",
            roles:
              typeof user.roles === "string"
                ? JSON.parse(user.roles.replace(/'/g, '"')).map(String)
                : Array.isArray(user.roles)
                ? user.roles.map(String)
                : [],
            location_id: parseInt(user.location_id) || 0,
            mobile_no: user.mobile_no || "",
            email_id: user.email_id || "",
          }));

          setUsers(formattedUsers);
          setFilteredUsers(formattedUsers);
        }
        // Fetch locations
        const locationsResponse = await CommonService.getAllDzongkhags();
        if (locationsResponse.status === 200) {
          setLocations(
            locationsResponse.data.map((item) => ({
              id: item.id,
              name: item.dzonkhagName,
            }))
          );
        }

        // Fetch roles
        const rolesResponse = await UserRoleManagementService.getRoles(
          access_token
        );
        if (rolesResponse.status === 200) {
          setCurrentRoles(
            rolesResponse.data.map((item) => ({
              id: item.id.toString(),
              name: item.role_name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.middle_name &&
            user.middle_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.mobile_no.includes(searchTerm) ||
          getRoleNameById(user.current_role)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getLocationNameById(user.location_id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setPage(0); // Reset to first page when searching
  }, [searchTerm, users]);

  // Check if form has changes (for edit mode)
  const hasFormChanges = () => {
    if (!editMode || !originalUserData) return false;

    // Compare current form values with original data
    const currentValues = formik.values;

    // Check each field for changes
    const hasChanges =
      currentValues.first_name !== originalUserData.first_name ||
      currentValues.middle_name !== originalUserData.middle_name ||
      currentValues.last_name !== originalUserData.last_name ||
      currentValues.current_role !== originalUserData.current_role ||
      JSON.stringify([...currentValues.roles].sort()) !==
        JSON.stringify([...originalUserData.roles].sort()) ||
      currentValues.location_id !== originalUserData.location_id ||
      currentValues.mobile_no !== originalUserData.mobile_no ||
      currentValues.email_id !== originalUserData.email_id;

    return hasChanges;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCurrentRoleChange = (event) => {
    const selectedRoleId = event.target.value;
    const rolesWithoutCurrent = formik.values.roles.filter(
      (role) => role !== formik.values.current_role
    );
    const updatedRoles = rolesWithoutCurrent.includes(selectedRoleId)
      ? rolesWithoutCurrent
      : [...rolesWithoutCurrent, selectedRoleId];

    formik.setValues({
      ...formik.values,
      current_role: selectedRoleId,
      roles: updatedRoles,
    });
  };

  const handleRolesChange = (event) => {
    const { value } = event.target;
    let newRoles = typeof value === "string" ? value.split(",") : value;

    if (
      formik.values.current_role &&
      !newRoles.includes(formik.values.current_role)
    ) {
      newRoles = [...newRoles, formik.values.current_role];
    }

    formik.setFieldValue("roles", newRoles);
    // Close the dropdown after selection
    setRolesOpen(false);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Transform form values to match backend payload structure
      const payload = {
        userId: values.user_id,
        firstName: values.first_name,
        middleName: values.middle_name || "", // Handle empty middle name
        lastName: values.last_name,
        genderId: "1", // Default or get from form if available
        password: values.password || undefined, // Only include if provided (for create or update)
        role: values.roles.map(Number), // Convert role strings to numbers
        mobileNo: values.mobile_no,
        emailId: values.email_id,
        profilePath: "", // Default or get from form if available
        statusId: "1", // Default active status or get from form
        locationId: String(values.location_id), // Ensure string type
        currentRole: values.current_role, // Note capital 'C' to match backend
      };

      let response;
      if (editMode && currentUser) {
        response = await UserRoleManagementService.updateUser(
          payload,
          access_token
        );
      } else {
        response = await UserRoleManagementService.createUser(
          payload,
          access_token
        );
      }

      if ([200, 201].includes(response.status)) {
        toast.success(`User ${editMode ? "updated" : "created"} successfully`);

        // CLOSE THE DIALOG HERE
        setOpen(false);
        formik.resetForm();
        setOriginalUserData(null); // Clear original data
        setRolesOpen(false); // Close roles dropdown

        // Refresh the user list
        const usersResponse = await UserRoleManagementService.getAllUsers(
          access_token
        );
        if (usersResponse.status === 200) {
          const formattedUsers = usersResponse.data.map((user) => ({
            user_id: user.user_id || "",
            first_name: user.first_name || "",
            middle_name: user.middle_name || "",
            last_name: user.last_name || "",
            current_role: user.current_role || "",
            roles:
              typeof user.roles === "string"
                ? JSON.parse(user.roles.replace(/'/g, '"')).map(String)
                : Array.isArray(user.roles)
                ? user.roles.map(String)
                : [],
            location_id: parseInt(user.location_id) || 0,
            mobile_no: user.mobile_no || "",
            email_id: user.email_id || "",
          }));

          setUsers(formattedUsers);
          setFilteredUsers(formattedUsers);
        }
      }
    } catch (error) {
      console.error("API Error:", {
        config: error.config,
        response: error.response,
        message: error.message,
      });

      let errorMessage = "Operation failed";
      if (error.response) {
        // Handle specific error cases
        if (error.response.data && typeof error.response.data === "object") {
          errorMessage =
            error.response.data.message ||
            error.response.data.error ||
            JSON.stringify(error.response.data);
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please check the data and try again.";
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      user_id: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      current_role: "",
      roles: [],
      location_id: "",
      mobile_no: "",
      email_id: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: editMode ? updateUserSchema : createUserSchema,
    onSubmit: handleSubmit,
  });

  const handleAddUser = () => {
    setEditMode(false);
    setCurrentUser(null);
    setOriginalUserData(null); // Clear original data
    setRolesOpen(false); // Close roles dropdown
    formik.resetForm();
    setOpen(true);
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setCurrentUser(user);

    // Store original data for comparison
    const originalData = {
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      current_role: user.current_role,
      roles: user.roles || [],
      location_id: user.location_id,
      mobile_no: user.mobile_no,
      email_id: user.email_id,
    };
    setOriginalUserData(originalData);

    // Set form values
    formik.setValues({
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      current_role: user.current_role,
      roles: user.roles || [],
      location_id: user.location_id,
      mobile_no: user.mobile_no,
      email_id: user.email_id,
      password: "",
      confirmPassword: "",
    });
    setOpen(true);
  };

  const handleDeleteUser = async () => {
    const payload = {
      userId: userToDelete,
    };
    try {
      setLoading(true);
      const response = await UserRoleManagementService.deleteUser(
        payload,
        access_token
      );

      if (response.status === 200) {
        const updatedUsers = users.filter(
          (user) => user.user_id !== userToDelete
        );
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        toast.success("User deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleNameById = (roleId) => {
    const role = currentRoles.find((r) => r.id === roleId);
    return role ? role.name : roleId;
  };

  const getLocationNameById = (locationId) => {
    const location = locations.find(
      (loc) => String(loc.id) === String(locationId)
    );
    return location ? location.name : "Unknown";
  };

  // Check if form is valid and has changes (for edit mode)
  const isUpdateDisabled = () => {
    if (loading) return true; // Disabled while loading
    if (!formik.isValid) return true; // Disabled if form has validation errors
    if (editMode && !hasFormChanges()) return true; // Disabled if no changes in edit mode
    return false; // Enabled otherwise
  };

  // Close roles dropdown when dialog closes
  const handleDialogClose = () => {
    if (!loading) {
      setOpen(false);
      setRolesOpen(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search users..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Stack>
        </Stack>

        {loading && users.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="200px"
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
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
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      User ID
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      Current Role
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      Location
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      Mobile No
                    </TableCell>
                    <TableCell
                      sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
                    >
                      Email
                    </TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((user, index) => (
                        <TableRow key={user.user_id} hover>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            {page * rowsPerPage + index + 1}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            {user.user_id}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            {user.first_name}{" "}
                            {user.middle_name && `${user.middle_name} `}
                            {user.last_name}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            <Chip
                              label={getRoleNameById(user.current_role)}
                              size="small"
                              sx={{
                                backgroundColor: "#e3f2fd",
                                color: "#1976d2",
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            {getLocationNameById(user.location_id)}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            {user.mobile_no}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderRight: "1px solid rgba(224, 224, 224, 1)",
                            }}
                          >
                            {user.email_id}
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 1,
                              }}
                            >
                              <Tooltip title="Edit">
                                <IconButton
                                  color="primary"
                                  onClick={() => handleEditUser(user)}
                                  disabled={loading}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                    setUserToDelete(user.user_id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={loading}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {searchTerm
                            ? "No users found matching your search."
                            : "No users available."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: "1px solid #e0e0e0",
                }}
              />
            </TableContainer>
          </>
        )}

        {/* Add/Edit User Dialog */}
        <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
          <DialogTitle>
            {editMode ? "Edit User" : "Add New User"}
            <IconButton
              sx={{ position: "absolute", right: 8, top: 8 }}
              onClick={handleDialogClose}
              disabled={loading}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent dividers sx={{ pt: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                label="User ID"
                name="user_id"
                size="small"
                value={formik.values.user_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.user_id && Boolean(formik.errors.user_id)}
                helperText={formik.touched.user_id && formik.errors.user_id}
                disabled={editMode || loading}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Current Role</InputLabel>
                <Select
                  name="current_role"
                  label="Current Role"
                  size="small"
                  value={formik.values.current_role}
                  onChange={handleCurrentRoleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.current_role &&
                    Boolean(formik.errors.current_role)
                  }
                  disabled={loading}
                >
                  {currentRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.current_role && formik.errors.current_role && (
                  <FormHelperText error>
                    {formik.errors.current_role}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl
                fullWidth
                margin="normal"
                error={formik.touched.roles && Boolean(formik.errors.roles)}
              >
                <InputLabel>Roles</InputLabel>
                <Select
                  name="roles"
                  label="Roles"
                  size="small"
                  multiple
                  value={formik.values.roles || []}
                  onChange={handleRolesChange}
                  onBlur={formik.handleBlur}
                  open={rolesOpen}
                  onOpen={() => setRolesOpen(true)}
                  onClose={() => setRolesOpen(false)}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={getRoleNameById(value)} />
                      ))}
                    </Box>
                  )}
                  disabled={loading}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        width: 250,
                      },
                    },
                    autoFocus: false,
                    disableAutoFocus: true,
                    disableEnforceFocus: true,
                  }}
                >
                  {currentRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Checkbox
                        checked={
                          formik.values.roles?.includes(role.id) || false
                        }
                      />
                      <ListItemText primary={role.name} />
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.roles && formik.errors.roles && (
                  <FormHelperText error>{formik.errors.roles}</FormHelperText>
                )}
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="First Name"
                name="first_name"
                size="small"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.first_name && Boolean(formik.errors.first_name)
                }
                helperText={
                  formik.touched.first_name && formik.errors.first_name
                }
                disabled={loading}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Middle Name"
                name="middle_name"
                size="small"
                value={formik.values.middle_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.middle_name &&
                  Boolean(formik.errors.middle_name)
                }
                helperText={
                  formik.touched.middle_name && formik.errors.middle_name
                }
                disabled={loading}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Last Name"
                name="last_name"
                size="small"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.last_name && Boolean(formik.errors.last_name)
                }
                helperText={formik.touched.last_name && formik.errors.last_name}
                disabled={loading}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Location</InputLabel>
                <Select
                  name="location_id"
                  label="Location"
                  size="small"
                  value={formik.values.location_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.location_id &&
                    Boolean(formik.errors.location_id)
                  }
                  disabled={loading}
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.location_id && formik.errors.location_id && (
                  <FormHelperText error>
                    {formik.errors.location_id}
                  </FormHelperText>
                )}
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="Mobile Number"
                name="mobile_no"
                size="small"
                value={formik.values.mobile_no}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.mobile_no && Boolean(formik.errors.mobile_no)
                }
                helperText={formik.touched.mobile_no && formik.errors.mobile_no}
                disabled={loading}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                name="email_id"
                type="email"
                size="small"
                value={formik.values.email_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.email_id && Boolean(formik.errors.email_id)
                }
                helperText={formik.touched.email_id && formik.errors.email_id}
                disabled={loading}
              />
              {!editMode && (
                <>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Password"
                    name="password"
                    size="small"
                    type={showPassword ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.password && Boolean(formik.errors.password)
                    }
                    helperText={
                      formik.touched.password && formik.errors.password
                    }
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Confirm Password"
                    name="confirmPassword"
                    size="small"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.confirmPassword &&
                      Boolean(formik.errors.confirmPassword)
                    }
                    helperText={
                      formik.touched.confirmPassword &&
                      formik.errors.confirmPassword
                    }
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                            disabled={loading}
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isUpdateDisabled()}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {editMode ? "Update" : "Save"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => !loading && setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            Confirm Delete
            <IconButton
              sx={{ position: "absolute", right: 8, top: 8 }}
              onClick={() => !loading && setDeleteDialogOpen(false)}
              disabled={loading}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1">
              Are you sure you want to delete this user ? This action cannot be
              undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              color="primary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              color="error"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserIndex;
