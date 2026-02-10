import { useState, useEffect } from "react";
import PrivilegeService from "../../../api/services/PrivilegeService";
import UserRoleManagementService from "../../../api/services/UserRoleManagementService";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { toast } from "react-toastify";
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
  FormControlLabel,
  Checkbox,
  Chip,
  TablePagination,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from "@mui/icons-material";

const RoleIndex = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const theme = useTheme();
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    assignedPrivilegeId: [],
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [assignedPrivilegeId, setPrivileges] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const access_token = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    const fetchData = async () => {
      const fetchPrivileges = async () => {
        try {
          const response = await PrivilegeService.getParentPrivileges(
            access_token
          );
          const parentPrivileges = response.data;

          const hierarchyPromises = parentPrivileges.map(async (parent) => {
            try {
              if (parent.id) {
                const childResponse = await PrivilegeService.getChildPrivileges(
                  parent.id,
                  access_token
                );
                return {
                  ...parent,
                  children: childResponse.data || [],
                };
              }
              return parent;
            } catch (childError) {
              console.error(
                `Error fetching children for parent ${parent.id}:`,
                childError
              );
              return {
                ...parent,
                children: [],
              };
            }
          });

          const result = await Promise.all(hierarchyPromises);

          const initialExpanded = {};
          result.forEach((priv) => {
            initialExpanded[priv.id] = false;
          });
          setExpandedCategories(initialExpanded);

          setPrivileges(result);
        } catch (error) {
          console.error("Error in fetchPrivileges:", error);
        }
      };

      const fetchRolePrivilegesIndex = async () => {
        try {
          const response = await UserRoleManagementService.getAllPrivilegeRole(
            access_token
          );
          if (response.status === 200) {
            const data = response.data.map((item) => {
              let privileges = [];
              if (item.assignedPrivilegeId) {
                try {
                  privileges =
                    typeof item.assignedPrivilegeId === "string"
                      ? JSON.parse(item.assignedPrivilegeId)
                      : item.assignedPrivilegeId;
                  privileges = Array.isArray(privileges) ? privileges : [];
                } catch (e) {
                  console.error("Error parsing privileges:", e);
                  privileges = [];
                }
              }
              return {
                id: item.id,
                roleName: item.roleName,
                description: item.description,
                assignedPrivilegeId: privileges,
              };
            });

            setRoles(data);
            setFilteredRoles(data);
          }
        } catch (error) {
          console.error("Error fetching role privileges:", error);
          setRoles([]);
          setFilteredRoles([]);
        }
      };

      await fetchPrivileges();
      await fetchRolePrivilegesIndex();
    };
    fetchData();
  }, [access_token]);

  // Filter roles based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(
        (role) =>
          role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoles(filtered);
    }
    setPage(0);
  }, [searchTerm, roles]);

  const handleExpandClick = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePrivilegeChange = (privilegeId) => {
    const currentPrivileges = formData.assignedPrivilegeId;
    const newPrivileges = currentPrivileges.includes(privilegeId)
      ? currentPrivileges.filter((id) => id !== privilegeId)
      : [...currentPrivileges, privilegeId];

    setFormData({
      ...formData,
      assignedPrivilegeId: newPrivileges,
    });
  };

  const toggleCategoryPrivileges = (parentId, children, checked) => {
    const privilegeIds = [parentId, ...children.map((child) => child.id)];
    const newPrivileges = checked
      ? [...new Set([...formData.assignedPrivilegeId, ...privilegeIds])]
      : formData.assignedPrivilegeId.filter((id) => !privilegeIds.includes(id));

    setFormData({
      ...formData,
      assignedPrivilegeId: newPrivileges,
    });
  };

  const isCategoryChecked = (parentId, children) => {
    const privilegeIds = [parentId, ...children.map((child) => child.id)];
    return privilegeIds.every((id) =>
      formData.assignedPrivilegeId.includes(id)
    );
  };

  const isCategoryIndeterminate = (parentId, children) => {
    const privilegeIds = [parentId, ...children.map((child) => child.id)];
    const selectedCount = privilegeIds.filter((id) =>
      formData.assignedPrivilegeId.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < privilegeIds.length;
  };

  const handleAddRole = () => {
    setEditMode(false);
    setCurrentRole(null);
    setFormData({
      id: "",
      roleName: "",
      description: "",
      assignedPrivilegeId: [],
    });
    setOpen(true);
  };

  const handleEditRole = (role) => {
    setEditMode(true);
    setCurrentRole(role);
    setFormData({
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      assignedPrivilegeId: Array.isArray(role.assignedPrivilegeId)
        ? role.assignedPrivilegeId
        : [],
    });
    setOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      if (editMode && currentRole) {
        const updatedRoles = roles.map((role) =>
          role.id === currentRole.id ? { ...role, ...formData } : role
        );
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);

        const response = await UserRoleManagementService.editRole(
          formData,
          access_token
        );
        toast.success(response.data.message || "Data Edit successfully");
      } else {
        const newRole = {
          id: Math.max(...roles.map((r) => r.id), 0) + 1,
          ...formData,
        };
        const updatedRoles = [...roles, newRole];
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);
        const response = await UserRoleManagementService.createRole(
          formData,
          access_token
        );
        toast.success(response.data.message || "Data save successfully");
      }
      setOpen(false);
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error(
        error.response?.data?.message || error.message || "Failed to save role"
      );
    }
  };

  const showDeleteConfirm = (role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const updatedRoles = roles.filter((role) => role.id !== roleToDelete.id);
      setRoles(updatedRoles);
      setFilteredRoles(updatedRoles);

      const payload = { id: roleToDelete.id };
      const response = await UserRoleManagementService.deleteRole(
        payload,
        access_token
      );
      console.log("response deleted role", response);

      setDeleteConfirmOpen(false);
      toast.success(response.data.message || "Role deleted successfully");
    } catch (error) {
      console.error("Error deleting role:", error);
      setRoles(roles);
      setFilteredRoles(roles);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete role"
      );
    }
  };

  const handleDeleteCanceled = () => {
    setDeleteConfirmOpen(false);
    setRoleToDelete(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPrivilegeName = (id) => {
    for (const parent of assignedPrivilegeId) {
      if (parent.id === id) return parent.privilegeName;
      if (parent.children) {
        const child = parent.children.find((c) => c.id === id);
        if (child) return child.privilegeName;
      }
    }
    return `Privilege ${id}`;
  };

  // NEW: Check if form data has changes
  const hasChanges = () => {
    if (!editMode) {
      return (
        formData.roleName.trim() !== "" ||
        formData.description.trim() !== "" ||
        formData.assignedPrivilegeId.length > 0
      );
    } else if (currentRole) {
      const nameChanged = formData.roleName !== currentRole.roleName;
      const descChanged = formData.description !== currentRole.description;
      const privilegesChanged =
        formData.assignedPrivilegeId.sort().join(",") !==
        (currentRole.assignedPrivilegeId || []).sort().join(",");
      return nameChanged || descChanged || privilegesChanged;
    }
    return false;
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
            Role Management
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search roles..."
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
              onClick={handleAddRole}
            >
              Add Role
            </Button>
          </Stack>
        </Stack>
        <TableContainer component={Paper} sx={{ border: "1px solid #e0e0e0" }}>
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
              <TableRow>
                <TableCell sx={{ width: "5%" }}>ID</TableCell>
                <TableCell sx={{ width: "15%" }}>Role Name</TableCell>
                <TableCell sx={{ width: "25%" }}>Description</TableCell>
                <TableCell sx={{ width: "45%" }}>Privileges</TableCell>
                <TableCell sx={{ width: "10%" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoles
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>{role.id}</TableCell>
                    <TableCell>{role.roleName}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          maxHeight: "100px",
                          overflowY: "auto",
                          p: 0.5,
                        }}
                      >
                        {role.assignedPrivilegeId.map((privilegeId) => (
                          <Chip
                            key={privilegeId}
                            label={getPrivilegeName(privilegeId)}
                            size="small"
                            icon={<LockIcon fontSize="small" />}
                            sx={{
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                            }}
                          />
                        ))}
                      </Box>
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
                            onClick={() => handleEditRole(role)}
                            sx={{ "&:hover": { backgroundColor: "#e3f2fd" } }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => showDeleteConfirm(role)}
                            sx={{ "&:hover": { backgroundColor: "#ffebee" } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRoles?.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: "1px solid #e0e0e0" }}
          />
        </TableContainer>

        {/* Add/Edit Role Dialog */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {editMode ? "Edit Role" : "Add New Role"}
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Role Name"
              name="roleName"
              size="small"
              value={formData.roleName}
              onChange={handleInputChange}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              size="small"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />
            <Typography variant="subtitle1" gutterBottom>
              Privileges
            </Typography>
            <List sx={{ width: "100%", bgcolor: "background.paper" }}>
              {assignedPrivilegeId.map((parent) => (
                <div key={parent.id}>
                  <ListItemButton
                    onClick={() => handleExpandClick(parent.id)}
                    sx={{ pl: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isCategoryChecked(
                              parent.id,
                              parent.children || []
                            )}
                            indeterminate={isCategoryIndeterminate(
                              parent.id,
                              parent.children || []
                            )}
                            onChange={(e) =>
                              toggleCategoryPrivileges(
                                parent.id,
                                parent.children || [],
                                e.target.checked
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={parent.privilegeName} />
                    {parent.children && parent.children.length > 0 ? (
                      expandedCategories[parent.id] ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )
                    ) : null}
                  </ListItemButton>
                  {parent.children && parent.children.length > 0 && (
                    <Collapse
                      in={expandedCategories[parent.id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {parent.children.map((child) => (
                          <ListItem key={child.id} sx={{ pl: 4 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.assignedPrivilegeId.includes(
                                    child.id
                                  )}
                                  onChange={() =>
                                    handlePrivilegeChange(child.id)
                                  }
                                  name={child.id.toString()}
                                  size="small"
                                />
                              }
                              label={child.privilegeName}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </div>
              ))}
            </List>
          </DialogContent>
          <DialogActions sx={{ borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveRole}
              disabled={!hasChanges()}
            >
              {editMode ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleDeleteCanceled}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the role "{roleToDelete?.roleName}
              "?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCanceled}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirmed}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default RoleIndex;
