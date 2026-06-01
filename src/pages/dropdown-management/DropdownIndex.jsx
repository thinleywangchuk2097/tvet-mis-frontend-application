import { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
import DropdownManagementService from "../../api/services/internal/dropdown/DropdownManagementService";
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
      }),
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

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Original values & change tracking
  const [originalValues, setOriginalValues] = useState({
    dropdownName: "",
    description: "",
    dropdownChild: [],
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response =
        await DropdownManagementService.getAllDropdownLists(access_token);
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
  }, [access_token]);

  // Search filtering
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
          dropdown.id.toString().includes(searchTerm),
      );
      setFilteredDropdowns(filtered);
    }
    setPage(0);
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
    onSubmit: (values) => handleSaveDropdown(values),
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
  });

  // Track changes in edit mode
  useEffect(() => {
    if (editMode && currentDropdown) {
      const nameChanged =
        formik.values.dropdownName !== originalValues.dropdownName;
      const descriptionChanged =
        formik.values.description !== originalValues.description;
      const childChanged =
        formik.values.dropdownChild.length !==
          originalValues.dropdownChild.length ||
        !formik.values.dropdownChild.every(
          (child, index) =>
            originalValues.dropdownChild[index] &&
            child.id === originalValues.dropdownChild[index].id &&
            child.designation ===
              originalValues.dropdownChild[index].designation,
        );
      setHasChanges(nameChanged || descriptionChanged || childChanged);
    }
  }, [formik.values, originalValues, editMode, currentDropdown]);

  // Pagination handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Search input
  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  // Add child option
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
      formik.setFieldValue("dropdownChild", updatedChildOptions, true);
      formik.setFieldTouched("dropdownChild", true, false);
      formik.setFieldValue("newOption", "", false);
      formik.validateForm();
    }
  };

  // Remove child option
  const handleRemoveOption = (optionId) => {
    const newOptions = formik.values.dropdownChild.filter(
      (option) => option.id !== optionId,
    );
    formik.setFieldValue("dropdownChild", newOptions, true);
    formik.setFieldTouched("dropdownChild", true, false);
    formik.validateForm();
  };

  // Add/Edit dropdown dialogs
  const handleAddDropdown = () => {
    setEditMode(false);
    setCurrentDropdown(null);
    setHasChanges(false);
    formik.resetForm();
    setOpen(true);
  };

  const handleEditDropdown = (dropdown) => {
    setEditMode(true);
    setCurrentDropdown(dropdown);
    const originalChild = dropdown.dropdownChild.map((child) => ({ ...child }));
    setOriginalValues({
      dropdownName: dropdown.dropdownName,
      description: dropdown.description,
      dropdownChild: originalChild,
    });
    formik.setValues({
      dropdownName: dropdown.dropdownName,
      description: dropdown.description,
      dropdownChild: originalChild,
      newOption: "",
    });
    setHasChanges(false);
    setOpen(true);
  };

  // Save dropdown
  const handleSaveDropdown = async (values) => {
    try {
      if (editMode && currentDropdown) {
        const updatedDropdowns = dropdowns.map((dropdown) =>
          dropdown.id === currentDropdown.id
            ? { ...dropdown, ...values }
            : dropdown,
        );
        setDropdowns(updatedDropdowns);
        setFilteredDropdowns(updatedDropdowns);
        const data = await DropdownManagementService.updateDropdown(
          { id: currentDropdown.id, ...values },
          access_token,
        );
        toast.success(data.message || "Data edited successfully");
      } else {
        const newDropdown = {
          id: Math.max(...dropdowns.map((d) => d.id), 0) + 1,
          ...values,
        };
        const updatedDropdowns = [...dropdowns, newDropdown];
        setDropdowns(updatedDropdowns);
        setFilteredDropdowns(updatedDropdowns);
        const data = await DropdownManagementService.createDropdown(
          newDropdown,
          access_token,
        );
        toast.success(data.message || "Data saved successfully");
      }
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save dropdown");
    }
  };

  // Delete handlers
  const handleDeleteClick = (id) => {
    setDropdownToDelete(id);
    setDeleteConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    try {
      const updatedDropdowns = dropdowns.filter(
        (dropdown) => dropdown.id !== dropdownToDelete,
      );
      setDropdowns(updatedDropdowns);
      setFilteredDropdowns(updatedDropdowns);
      await DropdownManagementService.deleteDropdown(
        { parentId: dropdownToDelete },
        access_token,
      );
      setDeleteConfirmOpen(false);
      setDropdownToDelete(null);
      toast.success("Data deleted successfully");
    } catch (error) {
      toast.error("Failed to delete dropdown");
    }
  };
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDropdownToDelete(null);
  };

  // Form validity check
  const isFormValid = () => {
    const hasErrors = Object.keys(formik.errors).length > 0;
    const hasRequiredValues =
      formik.values.dropdownName.trim() !== "" &&
      formik.values.description.trim() !== "" &&
      formik.values.dropdownChild.length > 0;
    return editMode
      ? !hasErrors && hasRequiredValues && hasChanges
      : !hasErrors && hasRequiredValues;
  };

  useEffect(() => {
    if (open) formik.validateForm();
  }, [open, formik.values]);

  return (
    <Paper sx={{ p: 3, mt: 1 }}>
      <Box sx={{ my: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h5" component="h1">
            Dropdown Management
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search dropdowns..."
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
              sx={{ width: 300 }}
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
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow
                sx={{
                  "& .MuiTableCell-root": {
                    textAlign: "center",
                  },
                }}
              >
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Dropdown Name
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Description
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                  align="center"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDropdowns.length > 0 ? (
                filteredDropdowns
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((dropdown) => (
                    <TableRow key={dropdown.id} hover>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {dropdown.id}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {dropdown.dropdownName}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {dropdown.description}
                      </TableCell>
                      <TableCell
                        sx={{ border: "1px solid #ccc" }}
                        align="center"
                      >
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

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDropdowns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
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
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.dropdownName &&
                  Boolean(formik.errors.dropdownName)
                }
                helperText={
                  formik.touched.dropdownName && formik.errors.dropdownName
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                name="description"
                size="small"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.description &&
                  Boolean(formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
                multiline
                rows={3}
              />

              <Typography variant="subtitle1" gutterBottom>
                Child Dropdown
              </Typography>
              {formik.touched.dropdownChild &&
                formik.errors.dropdownChild &&
                formik.values.dropdownChild.length === 0 && (
                  <FormHelperText error>
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
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  minHeight: 100,
                  border: "1px solid #ccc",
                  borderRadius: 1,
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
              <Button
                color="error"
                size="small"
                variant="contained"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="small"
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
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handleCancelDelete}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              size="small"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Paper>
  );
};

export default DropdownIndex;
