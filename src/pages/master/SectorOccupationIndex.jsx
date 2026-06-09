import React, { useState, useEffect } from "react";
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
  FormControlLabel,
  Switch,
  CircularProgress,
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
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SectorOccupationService from "../../api/services/internal/master/SectorOccupationService";

// Validation schema for Sector with Occupations
const sectorOccupationSchema = Yup.object().shape({
  sectorName: Yup.string().required("Sector name is required"),
  isActive: Yup.boolean(),
  occupations: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number(),
        occupationName: Yup.string().required(
          "Occupation name cannot be empty",
        ),
        iscoCode: Yup.string().required("ISCO code is required"),
        isActive: Yup.boolean(),
      }),
    )
    .min(1, "At least one occupation is required"),
  newOccupationName: Yup.string(),
  newIscoCode: Yup.string(),
});

const SectorOccupationIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const [sectors, setSectors] = useState([]);
  const [filteredSectors, setFilteredSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSector, setCurrentSector] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editOccupationDialog, setEditOccupationDialog] = useState({
    open: false,
    occupation: null,
    index: null,
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Original values & change tracking for edit mode
  const [originalValues, setOriginalValues] = useState({
    sectorName: "",
    isActive: true,
    occupations: [],
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Parse API response and transform data
  const transformApiData = (apiResponse) => {
    try {
      // Check if the response is an array and has the result property
      if (
        Array.isArray(apiResponse) &&
        apiResponse.length > 0 &&
        apiResponse[0].result
      ) {
        const parsedData = JSON.parse(apiResponse[0].result);

        // Transform the data to match the component's expected format
        const transformedData = parsedData.map((item) => ({
          id: item.sector_id,
          sectorName: item.sector_name,
          isActive: true, // Default to active since API doesn't provide status
          occupations:
            item.occupations &&
            Array.isArray(item.occupations) &&
            item.occupations.length > 0
              ? item.occupations.map((occ) => ({
                  id: occ.occupation_id,
                  occupationName: occ.occupation_name,
                  iscoCode: occ.isco_code,
                  isActive: true, // Default to active since API doesn't provide status
                }))
              : [], // Handle null or empty occupations as empty array
        }));

        return transformedData;
      }
      // Handle case where response might be directly the object with result property
      else if (apiResponse && apiResponse.result) {
        const parsedData = JSON.parse(apiResponse.result);

        const transformedData = parsedData.map((item) => ({
          id: item.sector_id,
          sectorName: item.sector_name,
          isActive: true,
          occupations:
            item.occupations &&
            Array.isArray(item.occupations) &&
            item.occupations.length > 0
              ? item.occupations.map((occ) => ({
                  id: occ.occupation_id,
                  occupationName: occ.occupation_name,
                  iscoCode: occ.isco_code,
                  isActive: true,
                }))
              : [],
        }));

        return transformedData;
      }
      return [];
    } catch (error) {
      console.error("Error parsing API data:", error);
      return [];
    }
  };

  // Fetch data from API
  const fetchSectorsOccupationDetails = async () => {
    setLoading(true);
    try {
      const response =
        await SectorOccupationService.getAllSectorOccupationsList(access_token);

      if (response && response.data) {
        const transformedData = transformApiData(response.data);
        setSectors(transformedData);
        setFilteredSectors(transformedData);

        if (transformedData.length === 0) {
          toast.info("No sector data available");
        }
      } else {
        setSectors([]);
        setFilteredSectors([]);
        toast.info("No sector data available");
      }
    } catch (error) {
      console.error("Error fetching Sectors with Occupations data:", error);
      toast.error("Failed to fetch sector data");
      setSectors([]);
      setFilteredSectors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectorsOccupationDetails();
  }, []);

  // Search filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSectors(sectors);
    } else {
      const filtered = sectors.filter(
        (sector) =>
          sector.sectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sector.occupations.some((occ) =>
            occ.occupationName.toLowerCase().includes(searchTerm.toLowerCase()),
          ) ||
          sector.occupations.some((occ) =>
            occ.iscoCode.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
      setFilteredSectors(filtered);
    }
    setPage(0);
  }, [searchTerm, sectors]);

  // Formik form
  const formik = useFormik({
    initialValues: {
      sectorName: "",
      isActive: true,
      occupations: [],
      newOccupationName: "",
      newIscoCode: "",
    },
    validationSchema: sectorOccupationSchema,
    onSubmit: (values) => handleSaveSector(values),
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
  });

  // Track changes in edit mode
  useEffect(() => {
    if (editMode && currentSector) {
      const nameChanged =
        formik.values.sectorName !== originalValues.sectorName;
      const activeChanged = formik.values.isActive !== originalValues.isActive;
      const occupationsChanged =
        formik.values.occupations.length !==
          originalValues.occupations.length ||
        !formik.values.occupations.every(
          (occ, index) =>
            originalValues.occupations[index] &&
            occ.id === originalValues.occupations[index].id &&
            occ.occupationName ===
              originalValues.occupations[index].occupationName &&
            occ.iscoCode === originalValues.occupations[index].iscoCode &&
            occ.isActive === originalValues.occupations[index].isActive,
        );
      setHasChanges(nameChanged || activeChanged || occupationsChanged);
    }
  }, [formik.values, originalValues, editMode, currentSector]);

  // Pagination handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Search input
  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  // Open edit occupation dialog
  const handleOpenEditOccupation = (occupation, index) => {
    setEditOccupationDialog({
      open: true,
      occupation: { ...occupation },
      index: index,
    });
  };

  // Close edit occupation dialog
  const handleCloseEditOccupation = () => {
    setEditOccupationDialog({
      open: false,
      occupation: null,
      index: null,
    });
  };

  // Save edited occupation
  const handleSaveEditOccupation = () => {
    const { occupation, index } = editOccupationDialog;
    if (!occupation.occupationName.trim() || !occupation.iscoCode.trim()) {
      toast.error("Occupation name and ISCO code are required");
      return;
    }

    const updatedOccupations = [...formik.values.occupations];
    updatedOccupations[index] = occupation;
    formik.setFieldValue("occupations", updatedOccupations, true);
    handleCloseEditOccupation();
  };

  // Update edit occupation field
  const handleEditOccupationChange = (field, value) => {
    setEditOccupationDialog({
      ...editOccupationDialog,
      occupation: {
        ...editOccupationDialog.occupation,
        [field]: value,
      },
    });
  };

  // Add occupation to the list
  const handleAddOccupation = () => {
    const { newOccupationName, newIscoCode, occupations } = formik.values;
    if (newOccupationName.trim() !== "" && newIscoCode.trim() !== "") {
      const newOccupation = {
        id:
          occupations.length > 0
            ? Math.max(...occupations.map((o) => o.id), 0) + 1
            : Date.now(),
        occupationName: newOccupationName.trim(),
        iscoCode: newIscoCode.trim(),
        isActive: true,
      };
      const updatedOccupations = [...occupations, newOccupation];
      formik.setFieldValue("occupations", updatedOccupations, true);
      formik.setFieldTouched("occupations", true, false);
      formik.setFieldValue("newOccupationName", "", false);
      formik.setFieldValue("newIscoCode", "", false);
      formik.validateForm();
    }
  };

  // Remove occupation from the list
  const handleRemoveOccupation = (index) => {
    const newOccupations = formik.values.occupations.filter(
      (_, i) => i !== index,
    );
    formik.setFieldValue("occupations", newOccupations, true);
    formik.setFieldTouched("occupations", true, false);
    formik.validateForm();
  };

  // Toggle occupation active status
  const handleToggleOccupationActive = (index) => {
    const updatedOccupations = [...formik.values.occupations];
    updatedOccupations[index].isActive = !updatedOccupations[index].isActive;
    formik.setFieldValue("occupations", updatedOccupations, true);
  };

  // Add sector dialog
  const handleAddSector = () => {
    setEditMode(false);
    setCurrentSector(null);
    setHasChanges(false);
    formik.resetForm();
    setOpen(true);
  };

  // Edit sector dialog
  const handleEditSector = (sector) => {
    setEditMode(true);
    setCurrentSector(sector);
    const originalOccupations = sector.occupations.map((occ) => ({ ...occ }));
    setOriginalValues({
      sectorName: sector.sectorName,
      isActive: sector.isActive,
      occupations: originalOccupations,
    });
    formik.setValues({
      sectorName: sector.sectorName,
      isActive: sector.isActive,
      occupations: originalOccupations,
      newOccupationName: "",
      newIscoCode: "",
    });
    setHasChanges(false);
    setOpen(true);
  };

  // Save sector (Create or Update)
  const handleSaveSector = async (values) => {
    try {
      // Prepare data for API (convert boolean to 'Y'/'N' for backend)
      const sectorData = {
        id: editMode && currentSector ? currentSector.id : null,
        sectorName: values.sectorName,
        isActive: values.isActive ? "Y" : "N",
        child: values.occupations.map((occ) => ({
          id: occ.id,
          occupationName: occ.occupationName,
          iscoCode: occ.iscoCode,
          isActive: occ.isActive ? "Y" : "N",
        })),
      };

      if (editMode && currentSector) {
        // Update existing sector
        const response =
          await SectorOccupationService.updateSectorWithOccupations(
            sectorData,
            access_token,
          );
        console.log("Updated sectorData:", sectorData);
        if (response.status === 200 || response.status === 201) {
          toast.success("Sector updated successfully");
          await fetchSectorsOccupationDetails();
        } else {
          toast.error("Failed to update sector");
          return;
        }
      } else {
        // Create new sector
        const response =
          await SectorOccupationService.submitSectorWithOccupations(
            sectorData,
            access_token,
          );

        if (response.status === 200 || response.status === 201) {
          toast.success("Sector created successfully!");
          await fetchSectorsOccupationDetails();
        } else {
          toast.error("Failed to create sector. Please try again.");
          return;
        }
      }
      setOpen(false);
      formik.resetForm();
    } catch (error) {
      console.error("Error saving sector:", error);
      toast.error(error.response?.data?.message || "Failed to save sector");
    }
  };

  // Delete handlers
  const handleDeleteClick = (id) => {
    setSectorToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await SectorOccupationService.deleteSectorWithOccupations(
        sectorToDelete,
        access_token,
      );
      console.log("Delete sectorToDelete:", sectorToDelete);
      if (response.status === 200 || response.status === 204) {
        toast.success("Sector deleted successfully");
        await fetchSectorsOccupationDetails();
      } else {
        toast.error("Failed to delete sector");
      }
    } catch (error) {
      console.error("Error deleting sector:", error);
      toast.error(error.response?.data?.message || "Failed to delete sector");
    } finally {
      setDeleteConfirmOpen(false);
      setSectorToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSectorToDelete(null);
  };

  // Form validity check
  const isFormValid = () => {
    const hasErrors = Object.keys(formik.errors).length > 0;
    const hasRequiredValues =
      formik.values.sectorName.trim() !== "" &&
      formik.values.occupations.length > 0;
    return editMode
      ? !hasErrors && hasRequiredValues && hasChanges
      : !hasErrors && hasRequiredValues;
  };

  // Validate form when dialog opens
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
            Sector & Occupation Management
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search sectors or occupations..."
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
              onClick={handleAddSector}
            >
              Add Sector
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
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
                      Sector Name
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                    >
                      Occupations
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
                  {filteredSectors.length > 0 ? (
                    filteredSectors
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((sector) => (
                        <TableRow key={sector.id} hover>
                          <TableCell sx={{ border: "1px solid #ccc" }}>
                            {sector.id}
                          </TableCell>
                          <TableCell sx={{ border: "1px solid #ccc" }}>
                            {sector.sectorName}
                          </TableCell>
                          <TableCell sx={{ border: "1px solid #ccc" }}>
                            <Chip
                              label={sector.isActive ? "Active" : "Inactive"}
                              color={sector.isActive ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ border: "1px solid #ccc" }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {sector.occupations.length > 0 ? (
                                sector.occupations.map((occ) => (
                                  <Chip
                                    key={occ.id}
                                    label={`${occ.iscoCode} - ${occ.occupationName}`}
                                    size="small"
                                    variant={
                                      occ.isActive ? "filled" : "outlined"
                                    }
                                    color={occ.isActive ? "primary" : "default"}
                                  />
                                ))
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No occupations
                                </Typography>
                              )}
                            </Stack>
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
                                  onClick={() => handleEditSector(sector)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(sector.id)}
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
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {searchTerm
                            ? "No sectors found matching your search."
                            : "No sectors available."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredSectors.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TableContainer>

        {/* Add/Edit Sector Dialog */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>
              {editMode ? "Edit Sector" : "Add New Sector"}
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
                label="Sector Name"
                name="sectorName"
                size="small"
                value={formik.values.sectorName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.sectorName && Boolean(formik.errors.sectorName)
                }
                helperText={
                  formik.touched.sectorName && formik.errors.sectorName
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={(e) =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active"
                sx={{ mt: 1, mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Occupations
              </Typography>
              {formik.touched.occupations &&
                formik.errors.occupations &&
                formik.values.occupations.length === 0 && (
                  <FormHelperText error>
                    {formik.errors.occupations}
                  </FormHelperText>
                )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <TextField
                  fullWidth
                  margin="none"
                  label="Occupation Name"
                  name="newOccupationName"
                  size="small"
                  value={formik.values.newOccupationName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.newOccupationName &&
                    Boolean(formik.errors.newOccupationName)
                  }
                  helperText={
                    formik.touched.newOccupationName &&
                    formik.errors.newOccupationName
                  }
                />
                <TextField
                  fullWidth
                  margin="none"
                  label="ISCO Code"
                  name="newIscoCode"
                  size="small"
                  value={formik.values.newIscoCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.newIscoCode &&
                    Boolean(formik.errors.newIscoCode)
                  }
                  helperText={
                    formik.touched.newIscoCode && formik.errors.newIscoCode
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOccupation();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddOccupation}
                  disabled={
                    formik.values.newOccupationName.trim() === "" ||
                    formik.values.newIscoCode.trim() === ""
                  }
                >
                  Add
                </Button>
              </Box>

              <Box
                sx={{
                  p: 2,
                  maxHeight: 300,
                  overflowY: "auto",
                  minHeight: 100,
                  border: "1px solid #ccc",
                  borderRadius: 1,
                }}
              >
                {formik.values.occupations.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    No occupations added yet
                  </Typography>
                ) : (
                  <Stack direction="column" spacing={1}>
                    {formik.values.occupations.map((occ, index) => (
                      <Box
                        key={occ.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Chip
                            label={occ.isActive ? "Active" : "Inactive"}
                            color={occ.isActive ? "success" : "default"}
                            size="small"
                            onClick={() => handleToggleOccupationActive(index)}
                            sx={{ cursor: "pointer" }}
                          />
                          <Typography variant="body2">
                            <strong>{occ.iscoCode}</strong> -{" "}
                            {occ.occupationName}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title="Edit Occupation">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                handleOpenEditOccupation(occ, index)
                              }
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Occupation">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveOccupation(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
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

        {/* Edit Occupation Dialog */}
        <Dialog
          open={editOccupationDialog.open}
          onClose={handleCloseEditOccupation}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Edit Occupation
            <IconButton
              sx={{ position: "absolute", right: 8, top: 8 }}
              onClick={handleCloseEditOccupation}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              margin="normal"
              label="Occupation Name"
              value={editOccupationDialog.occupation?.occupationName || ""}
              onChange={(e) =>
                handleEditOccupationChange("occupationName", e.target.value)
              }
              size="small"
            />
            <TextField
              fullWidth
              margin="normal"
              label="ISCO Code"
              value={editOccupationDialog.occupation?.iscoCode || ""}
              onChange={(e) =>
                handleEditOccupationChange("iscoCode", e.target.value)
              }
              size="small"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editOccupationDialog.occupation?.isActive || false}
                  onChange={(e) =>
                    handleEditOccupationChange("isActive", e.target.checked)
                  }
                  color="primary"
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              color="error"
              size="small"
              variant="contained"
              onClick={handleCloseEditOccupation}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSaveEditOccupation}
            >
              Save
            </Button>
          </DialogActions>
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
              Are you sure you want to delete this sector?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will also remove all associated occupations. This action
              cannot be undone.
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

export default SectorOccupationIndex;
