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
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
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
import DropdownManagementService from "../../../api/services/internal/dropdown/DropdownManagementService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Helper component for required field indicator
const RequiredStar = () => (
  <Typography component="span" sx={{ color: "red" }}>
    *
  </Typography>
);

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const access_token = useSelector((state) => state.auth.accessToken);
  const [dropdowns, setDropdowns] = useState([]);
  const [filteredDropdowns, setFilteredDropdowns] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDropdown, setCurrentDropdown] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dropdownToDelete, setDropdownToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination - Default: 5 for mobile, 10 for desktop
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);

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

  // Update rows per page on screen size change
  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

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
    setRowsPerPage(Number.parseInt(event.target.value, 10));
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

  // Render mobile card view
  const renderMobileCard = (dropdown) => (
    <Card
      key={dropdown.id}
      sx={{
        mb: 1.5,
        borderRadius: 1.5,
        boxShadow: 1,
        "&:hover": {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                ID: {dropdown.id}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontSize: "0.85rem" }}
              >
                {dropdown.dropdownName}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEditDropdown(dropdown)}
                  sx={{ p: 0.5 }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(dropdown.id)}
                  sx={{ p: 0.5 }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.6rem" }}
            >
              Description
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
              {dropdown.description}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.6rem" }}
            >
              Child Options: {dropdown.dropdownChild?.length || 0}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Render table view (compact desktop)
  const renderTable = () => (
    <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
      <Table
        sx={{
          borderCollapse: "collapse",
          minWidth: 500,
          "& .MuiTableCell-root": {
            py: 0.75,
            px: 1,
            fontSize: "0.8rem",
          },
        }}
        size="small"
      >
        <TableHead>
          <TableRow
            sx={{
              "& .MuiTableCell-root": {
                textAlign: "center",
                fontWeight: 600,
                fontSize: "0.75rem",
                py: 0.5,
              },
            }}
          >
            <TableCell sx={{ border: "1px solid #e0e0e0", width: "8%" }}>
              ID
            </TableCell>
            <TableCell sx={{ border: "1px solid #e0e0e0", width: "20%" }}>
              Dropdown Name
            </TableCell>
            <TableCell sx={{ border: "1px solid #e0e0e0", width: "40%" }}>
              Description
            </TableCell>
            <TableCell
              sx={{ border: "1px solid #e0e0e0", width: "32%" }}
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
                <TableRow
                  key={dropdown.id}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      textAlign: "center",
                      fontSize: "0.75rem",
                    }}
                  >
                    {dropdown.id}
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid #e0e0e0", fontSize: "0.8rem" }}
                  >
                    {dropdown.dropdownName}
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid #e0e0e0", fontSize: "0.8rem" }}
                  >
                    {dropdown.description}
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid #e0e0e0" }}
                    align="center"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 0.5,
                      }}
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditDropdown(dropdown)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(dropdown.id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                align="center"
                sx={{ py: 2, fontSize: "0.85rem" }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem" }}
                >
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
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredDropdowns.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              fontSize: "0.75rem",
            },
          "& .MuiTablePagination-select": {
            fontSize: "0.75rem",
          },
          minHeight: 40,
        }}
      />
    </TableContainer>
  );

  return (
    <Paper sx={{ p: { xs: 1, sm: 1.5, md: 2 }, mt: 1 }}>
      <Box sx={{ my: { xs: 1, sm: 1.5, md: 2 } }}>
        {/* Header - Compact */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          mb={2}
        >
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            component="h1"
            sx={{
              textAlign: { xs: "center", sm: "left" },
              fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
            }}
          >
            Dropdown Management
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              placeholder="Search..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ "& .MuiSvgIcon-root": { fontSize: 18 } }}
                    >
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { py: 0.25, fontSize: "0.8rem" },
                },
              }}
              sx={{
                width: { xs: "100%", sm: 180, md: 220 },
                "& .MuiInputBase-root": {
                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={handleAddDropdown}
              fullWidth={isMobile}
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: "auto" },
                py: { xs: 0.75, sm: 0.5 },
                fontSize: "0.8rem",
                textTransform: "none",
              }}
            >
              Add Dropdown
            </Button>
          </Stack>
        </Stack>

        {/* Content - Responsive Table/Card */}
        {isMobile ? (
          // Mobile: Card View
          <Box sx={{ mt: 1 }}>
            {filteredDropdowns.length > 0 ? (
              filteredDropdowns
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((dropdown) => renderMobileCard(dropdown))
            ) : (
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {searchTerm
                    ? "No dropdowns found matching your search."
                    : "No dropdowns available."}
                </Typography>
              </Paper>
            )}

            {/* Mobile Pagination */}
            {filteredDropdowns.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredDropdowns.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      fontSize: "0.7rem",
                    },
                  "& .MuiTablePagination-select": {
                    fontSize: "0.7rem",
                  },
                  minHeight: 40,
                }}
              />
            )}
          </Box>
        ) : (
          // Desktop/Tablet: Table View
          renderTable()
        )}

        {/* Add/Edit Dialog - Compact */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth={isMobile ? "xs" : "sm"}
          fullScreen={isMobile}
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle
              sx={{
                fontSize: { xs: "1rem", sm: "1.1rem" },
                pr: { xs: 6, sm: 8 },
                py: 1.5,
              }}
            >
              {editMode ? "Edit Dropdown" : "Add New Dropdown"}
              <IconButton
                sx={{ position: "absolute", right: 8, top: 8 }}
                onClick={() => setOpen(false)}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 1.5, pb: 1 }}>
              {/* Parent Dropdown - Required */}
              <TextField
                fullWidth
                margin="dense"
                label={
                  <>
                    Parent Dropdown <RequiredStar />
                  </>
                }
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
                sx={{ "& .MuiFormHelperText-root": { fontSize: "0.7rem" } }}
              />

              {/* Description - Required */}
              <TextField
                fullWidth
                margin="dense"
                label={
                  <>
                    Description <RequiredStar />
                  </>
                }
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
                rows={isMobile ? 2 : 2}
                sx={{ "& .MuiFormHelperText-root": { fontSize: "0.7rem" } }}
              />

              {/* Child Dropdown - Required */}
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ mt: 1, fontSize: "0.85rem" }}
              >
                Child Dropdown <RequiredStar />
              </Typography>
              {formik.touched.dropdownChild &&
                formik.errors.dropdownChild &&
                formik.values.dropdownChild.length === 0 && (
                  <FormHelperText error sx={{ fontSize: "0.7rem" }}>
                    {formik.errors.dropdownChild}
                  </FormHelperText>
                )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: 1,
                  mb: 1.5,
                  mt: 0.5,
                }}
              >
                <TextField
                  fullWidth
                  margin="dense"
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
                  sx={{ "& .MuiFormHelperText-root": { fontSize: "0.7rem" } }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddOption}
                  disabled={formik.values.newOption.trim() === ""}
                  fullWidth={isMobile}
                  size="small"
                  sx={{
                    minWidth: { xs: "100%", sm: 80 },
                    py: { xs: 0.75, sm: 0.5 },
                    fontSize: "0.75rem",
                    textTransform: "none",
                  }}
                >
                  Add
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  maxHeight: 160,
                  overflowY: "auto",
                  minHeight: 60,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                {formik.values.dropdownChild.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem" }}
                  >
                    No child options added yet
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {formik.values.dropdownChild.map((option) => (
                      <Chip
                        key={option.id}
                        label={`${option.id}: ${option.designation}`}
                        onDelete={() => handleRemoveOption(option.id)}
                        size="small"
                        sx={{
                          mb: 0.5,
                          height: 22,
                          "& .MuiChip-label": { fontSize: "0.7rem", px: 0.75 },
                          "& .MuiChip-deleteIcon": { fontSize: 14 },
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </DialogContent>
            <DialogActions
              sx={{
                flexDirection: { xs: "column-reverse", sm: "row" },
                gap: { xs: 0.5, sm: 0 },
                p: { xs: 1.5, sm: 1.5 },
              }}
            >
              <Button
                color="error"
                size="small"
                variant="contained"
                onClick={() => setOpen(false)}
                fullWidth={isMobile}
                sx={{ fontSize: "0.8rem", textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="small"
                variant="contained"
                disabled={!isFormValid()}
                fullWidth={isMobile}
                sx={{ fontSize: "0.8rem", textTransform: "none" }}
              >
                {editMode ? "Update" : "Save"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog - Compact */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCancelDelete}
          maxWidth="xs"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ py: 1.5, fontSize: "1rem" }}>
            Confirm Delete
            {isMobile && (
              <IconButton
                sx={{ position: "absolute", right: 8, top: 8 }}
                onClick={handleCancelDelete}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Typography sx={{ fontSize: "0.85rem" }}>
              Are you sure you want to delete this dropdown?
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: "0.75rem" }}
            >
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: { xs: 0.5, sm: 0 },
              p: { xs: 1.5, sm: 1.5 },
            }}
          >
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handleCancelDelete}
              fullWidth={isMobile}
              sx={{ fontSize: "0.8rem", textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              size="small"
              variant="contained"
              fullWidth={isMobile}
              sx={{ fontSize: "0.8rem", textTransform: "none" }}
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
