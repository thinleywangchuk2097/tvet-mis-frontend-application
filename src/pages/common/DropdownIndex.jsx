import { useState, useEffect } from "react";
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
  Chip,
  FormHelperText,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import DropdownManagementService from "../../api/services/DropdownManagementService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Validation schema
const dropdownSchema = Yup.object().shape({
  dropdownName: Yup.string().required("Dropdown type is required"),
  description: Yup.string().required("Description is required"),
  dropdownChild: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number().required(),
        designation: Yup.string().required("Option cannot be empty"),
      })
    )
    .min(1, "At least one option is required"),
  newOption: Yup.string(),
});

const DropdownIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const [dropdowns, setDropdowns] = useState([]);
  const [filteredDropdowns, setFilteredDropdowns] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDropdown, setCurrentDropdown] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dropdownToDelete, setDropdownToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const theme = useTheme();
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Track original values for comparison
  const [originalValues, setOriginalValues] = useState({
    dropdownName: "",
    description: "",
    dropdownChild: [],
  });

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response = await DropdownManagementService.getAllDropdownLists(
        access_token
      );
      // Transform the API data to match your desired format
      const transformedData = response.data.body.map((dropdown) => ({
        id: dropdown.id,
        dropdownName: dropdown.dropdownName,
        description: dropdown.description,
        dropdownChild: dropdown.dropdownChild.map((child) => ({
          id: child.id,
          designation: child.designation || child.designation,
        })),
      }));
      setDropdowns(transformedData);
      setFilteredDropdowns(transformedData);
    };

    fetchData();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDropdowns(dropdowns);
    } else {
      const filtered = dropdowns.filter(
        (dropdown) =>
          dropdown.dropdownName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          dropdown.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          dropdown.id.toString().includes(searchTerm)
      );
      setFilteredDropdowns(filtered);
    }
    setPage(0); // Reset to first page when searching
  }, [searchTerm, dropdowns]);

  // Formik form
  const formik = useFormik({
    initialValues: {
      dropdownName: "",
      description: "",
      dropdownChild: [],
      newOption: "",
    },
    validationSchema: dropdownSchema,
    onSubmit: (values) => {
      handleSaveDropdown(values);
    },
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
  });

  // Check for changes when form values change
  useEffect(() => {
    if (editMode && currentDropdown) {
      const checkForChanges = () => {
        // Check if dropdownName changed
        const nameChanged =
          formik.values.dropdownName !== originalValues.dropdownName;

        // Check if description changed
        const descriptionChanged =
          formik.values.description !== originalValues.description;

        // Check if dropdownChild changed (compare arrays)
        const childChanged =
          formik.values.dropdownChild.length !==
            originalValues.dropdownChild.length ||
          !formik.values.dropdownChild.every(
            (child, index) =>
              originalValues.dropdownChild[index] &&
              child.id === originalValues.dropdownChild[index].id &&
              child.designation ===
                originalValues.dropdownChild[index].designation
          );

        setHasChanges(nameChanged || descriptionChanged || childChanged);
      };

      checkForChanges();
    }
  }, [formik.values, originalValues, editMode, currentDropdown]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Add new option to the list
  const handleAddOption = () => {
    if (formik.values.newOption.trim() !== "") {
      const newOption = {
        id:
          formik.values.dropdownChild.length > 0
            ? Math.max(...formik.values.dropdownChild.map((o) => o.id)) + 1
            : 1,
        designation: formik.values.newOption.trim(),
      };

      const updatedChildOptions = [...formik.values.dropdownChild, newOption];

      // Set the field value and mark it as touched
      formik.setFieldValue("dropdownChild", updatedChildOptions, true);
      formik.setFieldTouched("dropdownChild", true, false);
      formik.setFieldValue("newOption", "", false);
      
      // Trigger validation
      formik.validateForm();
    }
  };

  // Remove option from the list
  const handleRemoveOption = (optionId) => {
    const newOptions = formik.values.dropdownChild.filter(
      (option) => option.id !== optionId
    );

    formik.setFieldValue("dropdownChild", newOptions, true);
    formik.setFieldTouched("dropdownChild", true, false);
    
    // Trigger validation
    formik.validateForm();
  };

  // Open dialog for adding new dropdown
  const handleAddDropdown = () => {
    setEditMode(false);
    setCurrentDropdown(null);
    setHasChanges(false);
    formik.resetForm();
    setOpen(true);
  };

  // Open dialog for editing dropdown
  const handleEditDropdown = (dropdown) => {
    setEditMode(true);
    setCurrentDropdown(dropdown);

    // Store original values for comparison
    const originalChild = dropdown.dropdownChild.map(child => ({
      ...child
    }));
    
    setOriginalValues({
      dropdownName: dropdown.dropdownName,
      description: dropdown.description,
      dropdownChild: originalChild,
    });

    // Set form values
    const formChild = dropdown.dropdownChild.map(child => ({
      ...child
    }));
    
    formik.setValues({
      dropdownName: dropdown.dropdownName,
      description: dropdown.description,
      dropdownChild: formChild,
      newOption: "",
    });

    setHasChanges(false); // Start with no changes
    setOpen(true);
  };

  // Save dropdown (both add and edit)
  const handleSaveDropdown = async (values) => {
    try {
      if (editMode && currentDropdown) {
        // Update existing dropdown
        const updatedDropdowns = dropdowns.map((dropdown) =>
          dropdown.id === currentDropdown.id
            ? {
                ...dropdown,
                dropdownName: values.dropdownName,
                description: values.description,
                dropdownChild: values.dropdownChild,
              }
            : dropdown
        );
        setDropdowns(updatedDropdowns);
        setFilteredDropdowns(updatedDropdowns);

        const data = await DropdownManagementService.updateDropdown(
          {
            id: currentDropdown.id,
            dropdownName: values.dropdownName,
            description: values.description,
            dropdownChild: values.dropdownChild,
          },
          access_token
        );
        toast.success(data.message || "Data edited successfully");
      } else {
        // Add new dropdown
        const newDropdown = {
          id: Math.max(...dropdowns.map((d) => d.id), 0) + 1,
          dropdownName: values.dropdownName,
          description: values.description,
          dropdownChild: values.dropdownChild,
        };
        const updatedDropdowns = [...dropdowns, newDropdown];
        setDropdowns(updatedDropdowns);
        setFilteredDropdowns(updatedDropdowns);

        const data = await DropdownManagementService.createDropdown(
          newDropdown,
          access_token
        );
        toast.success(data.message || "Data saved successfully");
      }
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save dropdown");
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id) => {
    setDropdownToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      const updatedDropdowns = dropdowns.filter(
        (dropdown) => dropdown.id !== dropdownToDelete
      );
      setDropdowns(updatedDropdowns);
      setFilteredDropdowns(updatedDropdowns);

      const data = await DropdownManagementService.deleteDropdown(
        { parentId: dropdownToDelete },
        access_token
      );
      setDeleteConfirmOpen(false);
      setDropdownToDelete(null);
      toast.success(data.message || "Data deleted successfully");
    } catch (error) {
      toast.error("Failed to delete dropdown");
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDropdownToDelete(null);
  };

  // Simplified: Check if form is valid
  const isFormValid = () => {
    // Check if form has no errors
    const hasErrors = Object.keys(formik.errors).length > 0;
    
    // Check if all required fields have values
    const hasRequiredValues = 
      formik.values.dropdownName.trim() !== "" &&
      formik.values.description.trim() !== "" &&
      formik.values.dropdownChild.length > 0;
    
    // For edit mode, also check if there are changes
    if (editMode) {
      return !hasErrors && hasRequiredValues && hasChanges;
    }
    
    // For add mode, just check if form is valid
    return !hasErrors && hasRequiredValues;
  };

  // Check form validity on mount and when values change
  useEffect(() => {
    // Trigger validation when form opens
    if (open) {
      formik.validateForm();
    }
  }, [open, formik.values]);

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
            Dropdown Management
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search dropdowns..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddDropdown}
            >
              Add Dropdown
            </Button>
          </Stack>
        </Stack>
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
              <TableRow
                sx={{
                  backgroundColor: "#f5f5f5",
                  "& .MuiTableCell-root": {
                    fontWeight: "bold",
                    borderRight: "1px solid rgba(224, 224, 224, 1)",
                    "&:last-child": {
                      borderRight: "none",
                    },
                  },
                }}
              >
                <TableCell>ID</TableCell>
                <TableCell>Dropdown Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDropdowns.length > 0 ? (
                filteredDropdowns
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((dropdown) => (
                    <TableRow key={dropdown.id} hover>
                      <TableCell>{dropdown.id}</TableCell>
                      <TableCell>{dropdown.dropdownName}</TableCell>
                      <TableCell>{dropdown.description}</TableCell>
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
                              onClick={() => handleEditDropdown(dropdown)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(dropdown.id)}
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
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm
                        ? "No dropdowns found matching your search."
                        : "No dropdowns available."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDropdowns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: "1px solid rgba(224, 224, 224, 1)",
            }}
          />
        </TableContainer>

        {/* Add/Edit Dropdown Dialog */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
          onEnter={() => formik.validateForm()}
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>
              {editMode ? "Edit Dropdown" : "Add New Dropdown"}
              <IconButton
                sx={{ position: "absolute", right: 8, top: 8 }}
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <TextField
                fullWidth
                margin="normal"
                label="Parent Dropdown"
                name="dropdownName"
                size="small"
                value={formik.values.dropdownName}
                onChange={(e) => {
                  formik.handleChange(e);
                  formik.setFieldTouched("dropdownName", true, false);
                }}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.dropdownName &&
                  Boolean(formik.errors.dropdownName)
                }
                helperText={
                  formik.touched.dropdownName && formik.errors.dropdownName
                }
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Description"
                name="description"
                size="small"
                value={formik.values.description}
                onChange={(e) => {
                  formik.handleChange(e);
                  formik.setFieldTouched("description", true, false);
                }}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.description &&
                  Boolean(formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
                required
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom>
                Child Dropdown
              </Typography>

              {/* Show error only when there are no child options */}
              {formik.touched.dropdownChild &&
                formik.errors.dropdownChild &&
                formik.values.dropdownChild.length === 0 && (
                  <FormHelperText error sx={{ mb: 1 }}>
                    {formik.errors.dropdownChild}
                  </FormHelperText>
                )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <TextField
                  fullWidth
                  margin="none"
                  label="Add New Child Option"
                  name="newOption"
                  size="small"
                  value={formik.values.newOption}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.newOption && Boolean(formik.errors.newOption)
                  }
                  helperText={
                    formik.touched.newOption && formik.errors.newOption
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddOption}
                  disabled={formik.values.newOption.trim() === ""}
                >
                  Add
                </Button>
              </Box>

              <Box
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  minHeight: 100,
                  backgroundColor: formik.values.dropdownChild.length === 0 ? "#f9f9f9" : "transparent",
                }}
              >
                {formik.values.dropdownChild.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No child options added yet
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {formik.values.dropdownChild.map((option) => (
                      <Chip
                        key={option.id}
                        label={`${option.id}: ${option.designation}`}
                        onDelete={() => handleRemoveOption(option.id)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isFormValid()}
              >
                {editMode ? "Update" : "Save"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCancelDelete}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this dropdown?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete}>Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DropdownIndex;