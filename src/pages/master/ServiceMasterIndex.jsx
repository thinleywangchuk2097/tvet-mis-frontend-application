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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TablePagination,
  InputAdornment,
  Chip,
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
import ServiceMasterService from "../../api/services/internal/service-master/ServiceMasterService";

// Validation schema with exact digit validation
const serviceMasterSchema = Yup.object().shape({
  serviceName: Yup.string().required("Service name is required"),
  validityDate: Yup.string().required("Validity date is required"),
  route: Yup.string().required("Route is required"),
  lastApplicationNo: Yup.number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" || originalValue === null ? null : value;
    })
    .test(
      "exact-digits",
      "Last application number must be exactly 7 digits",
      function (value) {
        if (value === null || value === undefined) return true;
        const stringValue = value.toString();
        return stringValue.length === 7;
      },
    )
    .typeError("Must be a number"),
  licenseLastSequence: Yup.number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" || originalValue === null ? null : value;
    })
    .test(
      "exact-digits",
      "License last sequence must be exactly 4 digits",
      function (value) {
        if (value === null || value === undefined) return true;
        const stringValue = value.toString();
        return stringValue.length === 4;
      },
    )
    .typeError("Must be a number"),
  hasCertificate: Yup.string().required("Certificate status is required"),
  isActive: Yup.string().required("Active status is required"),
});

const ServiceMasterIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response =
          await ServiceMasterService.getAllServiceMasters(access_token);
        console.log("API response:", response);

        // Transform snake_case from API to camelCase for frontend use
        const transformedData = response.data.map((item) => ({
          id: parseInt(item.id),
          serviceName: item.service_name,
          validityDate: item.validity_date,
          route: item.route,
          lastApplicationNo: item.last_application_no
            ? parseInt(item.last_application_no)
            : null,
          licenseLastSequence: item.license_last_sequence
            ? parseInt(item.license_last_sequence)
            : null,
          hasCertificate: item.has_certificate || "Y",
          isActive: item.is_active,
        }));

        setServices(transformedData);
        setFilteredServices(transformedData);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error("Failed to fetch services");
      }
    };
    fetchData();
  }, [access_token]);

  // Search filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.serviceName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.id.toString().includes(searchTerm),
      );
      setFilteredServices(filtered);
    }
    setPage(0);
  }, [searchTerm, services]);

  // Formik form
  const formik = useFormik({
    initialValues: {
      serviceName: "",
      validityDate: "",
      route: "",
      lastApplicationNo: "",
      licenseLastSequence: "",
      hasCertificate: "Y",
      isActive: "Y",
    },
    validationSchema: serviceMasterSchema,
    onSubmit: (values) => handleSaveService(values),
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
  });

  // Pagination handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Search input
  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  // Add/Edit service dialogs
  const handleAddService = () => {
    setEditMode(false);
    setCurrentService(null);
    formik.resetForm();
    setOpen(true);
  };

  const handleEditService = (service) => {
    setEditMode(true);
    setCurrentService(service);
    formik.setValues({
      serviceName: service.serviceName,
      validityDate: service.validityDate,
      route: service.route,
      lastApplicationNo: service.lastApplicationNo || "",
      licenseLastSequence: service.licenseLastSequence || "",
      hasCertificate: service.hasCertificate,
      isActive: service.isActive,
    });
    setOpen(true);
  };

  // Save service
  const handleSaveService = async (values) => {
    try {
      // Convert to numbers and validate digits before saving
      const lastAppNo = values.lastApplicationNo
        ? parseInt(values.lastApplicationNo)
        : null;
      const licenseSeq = values.licenseLastSequence
        ? parseInt(values.licenseLastSequence)
        : null;

      // Additional validation for exact digits
      if (lastAppNo && lastAppNo.toString().length !== 7) {
        toast.error("Last application number must be exactly 7 digits");
        return;
      }

      if (licenseSeq && licenseSeq.toString().length !== 4) {
        toast.error("License last sequence must be exactly 4 digits");
        return;
      }

      // Prepare data for API - send in camelCase to match backend DTO
      const requestData = {
        serviceName: values.serviceName,
        validityDate: values.validityDate,
        route: values.route,
        lastApplicationNo: lastAppNo,
        licenseLastSequence: licenseSeq,
        hasCertificate: values.hasCertificate,
        isActive: values.isActive,
      };

      if (editMode && currentService) {
        // Update existing service - add id for update
        requestData.id = currentService.id;
        console.log("Request data for update (camelCase):", requestData);

        const response = await ServiceMasterService.updateServiceMaster(
          requestData,
          access_token,
        );
        console.log("Update response:", response);

        if (response.status === 200 || response.status === 204) {
          // Update local state
          const updatedServices = services.map((service) =>
            service.id === currentService.id
              ? {
                  ...service,
                  serviceName: values.serviceName,
                  validityDate: values.validityDate,
                  route: values.route,
                  lastApplicationNo: lastAppNo,
                  licenseLastSequence: licenseSeq,
                  hasCertificate: values.hasCertificate,
                  isActive: values.isActive,
                }
              : service,
          );
          setServices(updatedServices);
          setFilteredServices(updatedServices);
          toast.success(
            response.data?.message || "Service updated successfully",
          );
        } else {
          toast.error("Failed to update service");
        }
      } else {
        // Create new service
        const response = await ServiceMasterService.submitServiceMaster(
          requestData,
          access_token,
        );
        console.log("Submit response:", response);

        if (
          response.status === 200 ||
          response.status === 201 ||
          response.status === 204
        ) {
          // Fetch updated list to get the new service with ID
          const fetchResponse =
            await ServiceMasterService.getAllServiceMasters(access_token);
          const transformedData = fetchResponse.data.map((item) => ({
            id: parseInt(item.id),
            serviceName: item.service_name,
            validityDate: item.validity_date,
            route: item.route,
            lastApplicationNo: item.last_application_no
              ? parseInt(item.last_application_no)
              : null,
            licenseLastSequence: item.license_last_sequence
              ? parseInt(item.license_last_sequence)
              : null,
            hasCertificate: item.has_certificate || "Y",
            isActive: item.is_active,
          }));
          setServices(transformedData);
          setFilteredServices(transformedData);
          toast.success(response.data?.message || "Service saved successfully");
        } else {
          toast.error("Failed to save service");
        }
      }
      setOpen(false);
    } catch (error) {
      console.error("Failed to save service:", error);
      toast.error(error.response?.data?.error || "Failed to save service");
    }
  };

  // Delete handlers
  const handleDeleteClick = (id) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await ServiceMasterService.deleteServiceMaster(
        serviceToDelete,
        access_token,
      );
      console.log("Delete response:", response);

      if (response.status === 200 || response.status === 204) {
        const updatedServices = services.filter(
          (service) => service.id !== serviceToDelete,
        );
        setServices(updatedServices);
        setFilteredServices(updatedServices);
        toast.success(response.data?.message || "Service deleted successfully");
      } else {
        toast.error("Failed to delete service");
      }
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error(error.response?.data?.error || "Failed to delete service");
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setServiceToDelete(null);
  };

  // Form validity check
  const isFormValid = () => {
    const hasErrors = Object.keys(formik.errors).length > 0;
    const hasRequiredValues =
      formik.values.serviceName.trim() !== "" &&
      formik.values.validityDate !== "" &&
      formik.values.route !== "";

    // Check digit validations if values are provided
    let isLastAppNoValid = true;
    let isLicenseSeqValid = true;

    if (
      formik.values.lastApplicationNo &&
      formik.values.lastApplicationNo !== ""
    ) {
      const lastAppNoStr = formik.values.lastApplicationNo.toString();
      isLastAppNoValid = lastAppNoStr.length === 7;
    }

    if (
      formik.values.licenseLastSequence &&
      formik.values.licenseLastSequence !== ""
    ) {
      const licenseSeqStr = formik.values.licenseLastSequence.toString();
      isLicenseSeqValid = licenseSeqStr.length === 4;
    }

    return (
      !hasErrors && hasRequiredValues && isLastAppNoValid && isLicenseSeqValid
    );
  };

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
            Service Master Management
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search services..."
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
              onClick={handleAddService}
            >
              Add Service
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
                  Service Name
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Validity Date
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Route
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Last App No (7 digits)
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  License Seq (4 digits)
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Certificate
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", fontWeight: "bold" }}
                >
                  Status
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
              {filteredServices.length > 0 ? (
                filteredServices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((service) => (
                    <TableRow key={service.id} hover>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {service.id}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {service.serviceName}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {service.validityDate}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {service.route || "-"}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {service.lastApplicationNo
                          ? service.lastApplicationNo
                              .toString()
                              .padStart(7, "0")
                          : "-"}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        {service.licenseLastSequence
                          ? service.licenseLastSequence
                              .toString()
                              .padStart(4, "0")
                          : "-"}
                      </TableCell>
                      <TableCell
                        sx={{ border: "1px solid #ccc" }}
                        align="center"
                      >
                        <Chip
                          label={service.hasCertificate === "Y" ? "Yes" : "No"}
                          color={
                            service.hasCertificate === "Y"
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell
                        sx={{ border: "1px solid #ccc" }}
                        align="center"
                      >
                        <Chip
                          label={
                            service.isActive === "Y" ? "Active" : "Inactive"
                          }
                          color={service.isActive === "Y" ? "success" : "error"}
                          size="small"
                        />
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
                              onClick={() => handleEditService(service)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(service.id)}
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
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm
                        ? "No services found matching your search."
                        : "No services available."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredServices.length}
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
          maxWidth="md"
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>
              {editMode ? "Edit Service" : "Add New Service"}
              <IconButton
                sx={{ position: "absolute", right: 8, top: 8 }}
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Service Name"
                  name="serviceName"
                  size="small"
                  value={formik.values.serviceName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.serviceName &&
                    Boolean(formik.errors.serviceName)
                  }
                  helperText={
                    formik.touched.serviceName && formik.errors.serviceName
                  }
                />

                <TextField
                  fullWidth
                  label="Validity Date"
                  name="validityDate"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.validityDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.validityDate &&
                    Boolean(formik.errors.validityDate)
                  }
                  helperText={
                    formik.touched.validityDate && formik.errors.validityDate
                  }
                />

                <TextField
                  fullWidth
                  label="Route"
                  name="route"
                  size="small"
                  value={formik.values.route}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.route && Boolean(formik.errors.route)}
                  helperText={formik.touched.route && formik.errors.route}
                  placeholder="/api/endpoint"
                />

                <TextField
                  fullWidth
                  label="Last Application No (exactly 7 digits)"
                  name="lastApplicationNo"
                  type="number"
                  size="small"
                  value={formik.values.lastApplicationNo}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "" ||
                      (Number(value) <= 9999999 && value.length <= 7)
                    ) {
                      formik.handleChange(e);
                    }
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.lastApplicationNo &&
                    Boolean(formik.errors.lastApplicationNo)
                  }
                  helperText={
                    (formik.touched.lastApplicationNo &&
                      formik.errors.lastApplicationNo) ||
                    "Must be exactly 7 digits (e.g., 1234567)"
                  }
                  inputProps={{ min: 0, max: 9999999, pattern: "[0-9]{7}" }}
                />

                <TextField
                  fullWidth
                  label="License Last Sequence (exactly 4 digits)"
                  name="licenseLastSequence"
                  type="number"
                  size="small"
                  value={formik.values.licenseLastSequence}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "" ||
                      (Number(value) <= 9999 && value.length <= 4)
                    ) {
                      formik.handleChange(e);
                    }
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.licenseLastSequence &&
                    Boolean(formik.errors.licenseLastSequence)
                  }
                  helperText={
                    (formik.touched.licenseLastSequence &&
                      formik.errors.licenseLastSequence) ||
                    "Must be exactly 4 digits (e.g., 1234)"
                  }
                  inputProps={{ min: 0, max: 9999, pattern: "[0-9]{4}" }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Has Certificate</InputLabel>
                  <Select
                    name="hasCertificate"
                    value={formik.values.hasCertificate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Has Certificate"
                  >
                    <MenuItem value="Y">Yes</MenuItem>
                    <MenuItem value="N">No</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="isActive"
                    value={formik.values.isActive}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Status"
                  >
                    <MenuItem value="Y">Active</MenuItem>
                    <MenuItem value="N">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
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
              Are you sure you want to delete this service?
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

export default ServiceMasterIndex;
