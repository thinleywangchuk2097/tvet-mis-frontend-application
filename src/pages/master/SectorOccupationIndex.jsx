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
  useTheme,
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

// Helper component for required field indicator
const RequiredStar = () => (
  <Typography component="span" sx={{ color: "error.main" }}>
    *
  </Typography>
);

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
  const theme = useTheme();
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

  // Pagination - default to 5 rows per page
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
      if (
        Array.isArray(apiResponse) &&
        apiResponse.length > 0 &&
        apiResponse[0].result
      ) {
        const parsedData = JSON.parse(apiResponse[0].result);
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
      } else if (apiResponse && apiResponse.result) {
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
      console.log("Fetched Sectors with Occupations data:", response.data);
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
      const sectorData = {
        id: editMode && currentSector ? currentSector.id : null,
        sectorName: values.sectorName,
        isActive: values.isActive ? "Y" : "N",
        child: values.occupations.map((occ) => ({
          ...(occ.id ? { id: occ.id } : {}),
          occupationName: occ.occupationName,
          iscoCode: occ.iscoCode,
          isActive: occ.isActive ? "Y" : "N",
        })),
      };

      if (editMode && currentSector) {
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
        console.log("Creating new sector with data:", sectorData);
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
      const response =
        await SectorOccupationService.deleteSectorWithOccupations(
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
    <Paper sx={{ p: 2, mt: 1 }}>
      <Box sx={{ my: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" component="h1">
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
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddSector}
              size="small"
            >
              Add Sector
            </Button>
          </Stack>
        </Stack>

        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "auto",
            height: "auto",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table
                size="small"
                sx={{
                  tableLayout: "auto",
                  width: "100%",
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      "& .MuiTableCell-root": {
                        textAlign: "center",
                        border: `1px solid ${theme.palette.divider}`,
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        padding: "4px 8px",
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? theme.palette.grey[900]
                            : theme.palette.grey[100],
                      },
                    }}
                  >
                    <TableCell sx={{ width: "6%" }}>ID</TableCell>
                    <TableCell sx={{ width: "18%" }}>Sector Name</TableCell>
                    <TableCell sx={{ width: "10%" }}>Status</TableCell>
                    <TableCell sx={{ width: "50%" }}>Occupation</TableCell>
                    <TableCell sx={{ width: "16%" }} align="center">
                      Action
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
                        <TableRow
                          key={sector.id}
                          hover
                          sx={{
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <TableCell
                            align="center"
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              color: theme.palette.text.primary,
                            }}
                          >
                            {sector.id}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              color: theme.palette.text.primary,
                            }}
                          >
                            {sector.sectorName}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              padding: "4px 8px",
                            }}
                          >
                            <Chip
                              label={sector.isActive ? "Active" : "Inactive"}
                              color={sector.isActive ? "success" : "default"}
                              size="small"
                              sx={{ height: 20, fontSize: "0.65rem" }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              padding: "4px 8px",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.25,
                                maxHeight: "120px",
                                overflowY: "auto",
                                "&::-webkit-scrollbar": {
                                  width: "4px",
                                },
                                "&::-webkit-scrollbar-track": {
                                  background:
                                    theme.palette.mode === "dark"
                                      ? theme.palette.grey[800]
                                      : "#f1f1f1",
                                  borderRadius: "2px",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  background:
                                    theme.palette.mode === "dark"
                                      ? theme.palette.grey[600]
                                      : "#c1c1c1",
                                  borderRadius: "2px",
                                  "&:hover": {
                                    background:
                                      theme.palette.mode === "dark"
                                        ? theme.palette.grey[500]
                                        : "#a8a8a8",
                                  },
                                },
                              }}
                            >
                              {sector.occupations.length > 0 ? (
                                sector.occupations.map((occ, index) => (
                                  <Box
                                    key={occ.id || index}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      py: 0.25,
                                      px: 0.5,
                                      borderBottom: `1px solid ${theme.palette.divider}`,
                                      "&:last-child": {
                                        borderBottom: "none",
                                      },
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: "0.7rem",
                                        color: theme.palette.text.secondary,
                                        fontWeight: "bold",
                                        minWidth: "20px",
                                      }}
                                    >
                                      {index + 1}.
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: "0.7rem",
                                        color: theme.palette.text.primary,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {occ.occupationName}
                                    </Typography>
                                    <Chip
                                      label={occ.iscoCode}
                                      size="small"
                                      sx={{
                                        minWidth: "60px",
                                        height: 18,
                                        backgroundColor:
                                          theme.palette.mode === "dark"
                                            ? theme.palette.primary.dark
                                            : "#e3f2fd",
                                        fontWeight: "bold",
                                        fontSize: "0.6rem",
                                        color:
                                          theme.palette.mode === "dark"
                                            ? theme.palette.primary.contrastText
                                            : "inherit",
                                      }}
                                    />
                                  </Box>
                                ))
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  align="center"
                                  sx={{ fontSize: "0.7rem", py: 0.5 }}
                                >
                                  No occupations
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              padding: "4px 8px",
                            }}
                            align="center"
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 0.25,
                              }}
                            >
                              <Tooltip title="Edit">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleEditSector(sector)}
                                  sx={{ padding: "2px" }}
                                >
                                  <EditIcon
                                    fontSize="small"
                                    sx={{ fontSize: "1rem" }}
                                  />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(sector.id)}
                                  sx={{ padding: "2px" }}
                                >
                                  <DeleteIcon
                                    fontSize="small"
                                    sx={{ fontSize: "1rem" }}
                                  />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
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
                sx={{
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      fontSize: "0.75rem",
                    },
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
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
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle sx={{ fontSize: "1.1rem", py: 1.5 }}>
              {editMode ? "Edit Sector" : "Add New Sector"}
              <IconButton
                sx={{ position: "absolute", right: 8, top: 8 }}
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 1 }}>
              <TextField
                fullWidth
                margin="dense"
                label={
                  <>
                    Sector Name <RequiredStar />
                  </>
                }
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
                    size="small"
                  />
                }
                label="Active"
                sx={{ mt: 0.5, mb: 1 }}
              />

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Occupations <RequiredStar />
              </Typography>
              {formik.touched.occupations &&
                formik.errors.occupations &&
                formik.values.occupations.length === 0 && (
                  <FormHelperText error>
                    {formik.errors.occupations}
                  </FormHelperText>
                )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <TextField
                  fullWidth
                  margin="dense"
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
                  margin="dense"
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
                  size="small"
                  disabled={
                    formik.values.newOccupationName.trim() === "" ||
                    formik.values.newIscoCode.trim() === ""
                  }
                  sx={{ mt: 0.5 }}
                >
                  Add
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1,
                  maxHeight: 250,
                  overflowY: "auto",
                  minHeight: 80,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  backgroundColor: theme.palette.background.default,
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
                  <Stack direction="column" spacing={0.5}>
                    {formik.values.occupations.map((occ, index) => (
                      <Box
                        key={occ.id || index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 0.5,
                          bgcolor: theme.palette.background.paper,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={occ.isActive ? "Active" : "Inactive"}
                            color={occ.isActive ? "success" : "default"}
                            size="small"
                            onClick={() => handleToggleOccupationActive(index)}
                            sx={{
                              cursor: "pointer",
                              height: 20,
                              fontSize: "0.65rem",
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.8rem" }}
                          >
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
                              sx={{ padding: "2px" }}
                            >
                              <EditIcon
                                fontSize="small"
                                sx={{ fontSize: "0.9rem" }}
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Occupation">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveOccupation(index)}
                              sx={{ padding: "2px" }}
                            >
                              <DeleteIcon
                                fontSize="small"
                                sx={{ fontSize: "0.9rem" }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ py: 1 }}>
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
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <DialogTitle sx={{ fontSize: "1.1rem", py: 1.5 }}>
            Edit Occupation
            <IconButton
              sx={{ position: "absolute", right: 8, top: 8 }}
              onClick={handleCloseEditOccupation}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ py: 1 }}>
            <TextField
              fullWidth
              margin="dense"
              label={
                <>
                  Occupation Name <RequiredStar />
                </>
              }
              value={editOccupationDialog.occupation?.occupationName || ""}
              onChange={(e) =>
                handleEditOccupationChange("occupationName", e.target.value)
              }
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              label={
                <>
                  ISCO Code <RequiredStar />
                </>
              }
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
                  size="small"
                />
              }
              label="Active"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ py: 1 }}>
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
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <DialogTitle sx={{ fontSize: "1.1rem", py: 1.5 }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" color="text.primary">
              Are you sure you want to delete this sector?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will also remove all associated occupations. This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ py: 1 }}>
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
