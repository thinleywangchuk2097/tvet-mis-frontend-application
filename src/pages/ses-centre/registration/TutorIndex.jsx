import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Chip,
  CircularProgress,
  Box,
  Avatar,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import TutorService from "../../../api/services/internal/ses-center/TutorService";
import CommonService from "../../../api/services/internal/common/CommonService";

// Table style constant
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

// Custom styled component for required field label
const RequiredLabel = ({ children }) => (
  <span>
    {children}
    <span style={{ color: "red", marginLeft: "4px" }}>*</span>
  </span>
);

// Status list constant
const STATUS_LIST = [
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

const TutorIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add, edit, view
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instituteId, setInstituteId] = useState(null);
  const [isInstituteLoaded, setIsInstituteLoaded] = useState(false);
  const [academicQualifications, setAcademicQualifications] = useState([]);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState(null);

  // Fetch institute details on component mount
  useEffect(() => {
    fetchInstituteDetails();
    fetchAcademicQualification();
  }, []);

  // Fetch tutors when instituteId is available
  useEffect(() => {
    if (instituteId) {
      fetchTutors();
    }
  }, [instituteId]);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instId = response.data[0]?.institute_id;
      if (instId) {
        console.log("Fetched Institute ID:", instId);
        setInstituteId(instId);
      } else {
        toast.error("Institute ID not found");
      }
      setIsInstituteLoaded(true);
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to fetch institute details");
      setIsInstituteLoaded(true);
    }
  };

  const fetchAcademicQualification = async () => {
    try {
      const AcademicQualification = await CommonService.getByParentId(18);
      setAcademicQualifications(AcademicQualification.data);
      console.log("Academic Qualification:", AcademicQualification.data);
    } catch (error) {
      console.error("Error fetching Academic Qualification:", error);
      // Fallback qualifications if API fails
      setAcademicQualifications([
        { id: 76, name: "Class X" },
        { id: 77, name: "Class XII" },
        { id: 78, name: "Diploma" },
        { id: 79, name: "Degree" },
      ]);
    }
  };

  // Helper function to map snake_case to camelCase
  const mapTutorData = (tutor) => ({
    id: tutor.id,
    citizenId: tutor.citizen_id,
    firstName: tutor.first_name,
    middleName: tutor.middle_name || "",
    lastName: tutor.last_name,
    email: tutor.email,
    phone: tutor.mobile_no, // Changed from 'phone' to 'mobile_no' to match API response
    qualificationId: tutor.qualification_id
      ? parseInt(tutor.qualification_id)
      : null, // Convert to number
    specialization: tutor.specialization,
    experienceYears: tutor.experience_years
      ? parseInt(tutor.experience_years)
      : 0,
    hourlyRate: tutor.hourly_rate,
    statusId: tutor.status_id ? parseInt(tutor.status_id) : 1,
    joiningDate: tutor.joining_date,
    description: tutor.description || "",
    instituteId: tutor.institute_id,
    profileImage: tutor.profile_image,
    createdBy: tutor.created_by,
    createdAt: tutor.created_at,
    updatedBy: tutor.updated_by,
    updatedAt: tutor.updated_at,
  });

  const fetchTutors = async () => {
    if (!instituteId) {
      console.warn("Institute ID not available yet");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching tutors with Institute ID:", instituteId);
      const response = await TutorService.getAllTutors(
        instituteId,
        access_token,
      );
      console.log("Fetch Tutors Response:", response);

      if (response && response.data) {
        // If response.data is an array, map each tutor
        const tutorsData = Array.isArray(response.data)
          ? response.data.map(mapTutorData)
          : [];
        setTutors(tutorsData);
        console.log("Mapped tutors:", tutorsData);
        if (tutorsData.length === 0) {
          toast.info("No tutors found");
        }
      } else {
        setTutors([]);
        toast.warning("No tutors found");
      }
    } catch (error) {
      console.error("Error fetching tutors:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tutors");
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    // Convert qualificationId to number for comparison
    const id =
      typeof qualificationId === "string"
        ? parseInt(qualificationId)
        : qualificationId;
    const qualification = academicQualifications.find((q) => q.id === id);
    return qualification ? qualification.name : "N/A";
  };

  const getStatusName = (statusId) => {
    const status = STATUS_LIST.find((s) => s.id === statusId);
    return status ? status.name : statusId === 1 ? "Active" : "Inactive";
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1:
        return "#4caf50"; // Active - Green
      case 2:
        return "#f44336"; // Inactive - Red
      default:
        return "#9e9e9e"; // Grey
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredTutors = tutors.filter(
    (t) =>
      (t.firstName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.middleName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.lastName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.citizenId?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.specialization?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const handleView = (tutor) => {
    setSelectedTutor(tutor);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleEdit = (tutor) => {
    setSelectedTutor(tutor);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedTutor(null);
    setDialogMode("add");
    setOpenDialog(true);
  };

  // Delete handlers
  const handleDeleteClick = (tutor) => {
    setTutorToDelete(tutor);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tutorToDelete) return;

    setLoading(true);
    try {
      const response = await TutorService.deleteTutor(
        tutorToDelete.id,
        access_token,
      );

      if (response && response.status === 200) {
        const responseData = response.data;
        if (responseData?.status === "SUCCESS") {
          toast.success(responseData?.message || "Tutor deleted successfully!");
        } else {
          toast.success("Tutor deleted successfully!");
        }
        await fetchTutors(); // Refresh the list
      } else {
        toast.error(response?.data?.message || "Failed to delete tutor");
      }
      setDeleteConfirmOpen(false);
      setTutorToDelete(null);
    } catch (error) {
      console.error("Error deleting tutor:", error);
      toast.error(error.response?.data?.message || "Failed to delete tutor");
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTutorToDelete(null);
  };

  // Get initial values based on mode
  const getInitialValues = () => {
    if ((dialogMode === "edit" || dialogMode === "view") && selectedTutor) {
      return {
        id: selectedTutor.id || "",
        citizenId: selectedTutor.citizenId || "",
        firstName: selectedTutor.firstName || "",
        middleName: selectedTutor.middleName || "",
        lastName: selectedTutor.lastName || "",
        email: selectedTutor.email || "",
        phone: selectedTutor.phone || "",
        qualificationId: selectedTutor.qualificationId || "",
        specialization: selectedTutor.specialization || "",
        experienceYears: selectedTutor.experienceYears || "",
        hourlyRate: selectedTutor.hourlyRate || "",
        statusId: selectedTutor.statusId || 1,
        joiningDate: selectedTutor.joiningDate || "",
        description: selectedTutor.description || "",
      };
    }
    return {
      id: "",
      citizenId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      qualificationId: "",
      specialization: "",
      experienceYears: "",
      hourlyRate: "",
      statusId: 1,
      joiningDate: new Date().toISOString().split("T")[0],
      description: "",
    };
  };

  const validationSchema = Yup.object().shape({
    citizenId: Yup.string()
      .required("Citizen ID is required")
      .max(20, "Citizen ID must be at most 20 characters"),
    firstName: Yup.string()
      .required("First Name is required")
      .max(50, "First Name must be at most 50 characters"),
    middleName: Yup.string().max(
      50,
      "Middle Name must be at most 50 characters",
    ),
    lastName: Yup.string()
      .required("Last Name is required")
      .max(50, "Last Name must be at most 50 characters"),
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format"),
    phone: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9+\s-]+$/, "Invalid phone number format"),
    qualificationId: Yup.string().required("Qualification is required"),
    specialization: Yup.string()
      .required("Specialization is required")
      .max(100, "Specialization must be at most 100 characters"),
    experienceYears: Yup.number()
      .required("Experience Years is required")
      .min(0, "Experience cannot be negative")
      .max(50, "Experience cannot exceed 50 years")
      .typeError("Experience must be a valid number"),
    hourlyRate: Yup.number()
      .required("Hourly Rate is required")
      .positive("Hourly Rate must be positive")
      .typeError("Hourly Rate must be a valid number"),
    description: Yup.string().max(
      500,
      "Description must be at most 500 characters",
    ),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API with camelCase field names
      const payload = {
        id: dialogMode === "edit" ? values.id : null,
        citizenId: values.citizenId,
        firstName: values.firstName,
        middleName: values.middleName || "",
        lastName: values.lastName,
        email: values.email,
        mobileNo: values.phone, // Changed from 'phone' to 'mobileNo' to match backend DTO
        qualificationId: parseInt(values.qualificationId),
        specialization: values.specialization,
        experienceYears: parseInt(values.experienceYears),
        hourlyRate: values.hourlyRate.toString(), // Convert to string as per backend
        statusId: parseInt(values.statusId),
        joiningDate: values.joiningDate,
        description: values.description || "",
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
      };

      let response;

      if (dialogMode === "add") {
        response = await TutorService.submitTutor(payload, access_token);
        console.log("Submit Response:", response);

        if (response && response.status === 201) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Tutor created successfully!",
            );
            resetForm();
            setOpenDialog(false);
            await fetchTutors(); // Refresh the list
          } else {
            toast.error(responseData?.message || "Failed to create tutor");
          }
        } else if (response && response.status === 200) {
          toast.success(
            response.data?.message || "Tutor created successfully!",
          );
          resetForm();
          setOpenDialog(false);
          await fetchTutors();
        } else {
          toast.error(response?.data?.message || "Failed to create tutor");
        }
      } else if (dialogMode === "edit") {
        response = await TutorService.updateTutor(payload, access_token);
        console.log("Update Response:", response);

        if (response && response.status === 200) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Tutor updated successfully!",
            );
          } else {
            toast.success("Tutor updated successfully!");
          }
          setOpenDialog(false);
          await fetchTutors(); // Refresh the list
        } else {
          toast.error(response?.data?.message || "Failed to update tutor");
        }
      }
    } catch (error) {
      console.error("Error saving tutor:", error);
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || "Tutor already exists!");
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || "Tutor not found!");
      } else {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while saving the tutor",
        );
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleReset = (resetForm) => {
    resetForm();
    toast.info("Form has been reset");
  };

  const getFullName = (firstName, middleName, lastName) => {
    if (middleName && middleName.trim()) {
      return `${firstName} ${middleName} ${lastName}`;
    }
    return `${firstName} ${lastName}`;
  };

  // Show loading while fetching institute details
  if (!isInstituteLoaded) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading institute details...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Tutor Management
      </Typography>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Search by Name, Citizen ID, Email or Specialization"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={handleAdd}
            sx={{ height: "36px" }}
          >
            Add Tutor
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Citizen ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell align="center">Experience</TableCell>
              <TableCell align="center">Hourly Rate</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center" width={130}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTutors.length > 0 ? (
              filteredTutors
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tutor, index) => {
                  const statusName = getStatusName(tutor.statusId);
                  const statusColor = getStatusColor(tutor.statusId);
                  const qualificationName = getQualificationName(
                    tutor.qualificationId,
                  );

                  return (
                    <TableRow key={tutor.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        <Chip
                          label={tutor.citizenId}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                          >
                            {tutor.firstName?.charAt(0) || ""}
                            {tutor.lastName?.charAt(0) || ""}
                          </Avatar>
                          <Typography variant="body2">
                            {getFullName(
                              tutor.firstName,
                              tutor.middleName,
                              tutor.lastName,
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <EmailIcon
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          />
                          <Typography variant="body2">{tutor.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <PhoneIcon
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          />
                          <Typography variant="body2">{tutor.phone}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{qualificationName}</TableCell>
                      <TableCell>{tutor.specialization}</TableCell>
                      <TableCell align="center">
                        {tutor.experienceYears} yrs
                      </TableCell>
                      <TableCell align="center">
                        Nu. {tutor.hourlyRate}/hr
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusName}
                          size="small"
                          sx={{
                            backgroundColor: statusColor,
                            color: "white",
                            fontWeight: "medium",
                            minWidth: "70px",
                            "& .MuiChip-label": {
                              px: 1.5,
                              py: 0.5,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleView(tutor)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Tutor">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => handleEdit(tutor)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tutor">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(tutor)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "No data available in table"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTutors.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit/View Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SchoolIcon />
              <Typography variant="h6">
                {dialogMode === "add"
                  ? "Add New Tutor"
                  : dialogMode === "edit"
                    ? "Edit Tutor Details"
                    : "Tutor Details"}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Formik
          key={dialogMode + (selectedTutor?.id || "")}
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Paper
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Citizen ID</RequiredLabel>}
                        name="citizenId"
                        size="small"
                        value={formik.values.citizenId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.citizenId &&
                          Boolean(formik.errors.citizenId)
                        }
                        helperText={
                          formik.touched.citizenId && formik.errors.citizenId
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>First Name</RequiredLabel>}
                        name="firstName"
                        size="small"
                        value={formik.values.firstName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.firstName &&
                          Boolean(formik.errors.firstName)
                        }
                        helperText={
                          formik.touched.firstName && formik.errors.firstName
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Middle Name (Optional)"
                        name="middleName"
                        size="small"
                        value={formik.values.middleName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.middleName &&
                          Boolean(formik.errors.middleName)
                        }
                        helperText={
                          formik.touched.middleName && formik.errors.middleName
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Last Name</RequiredLabel>}
                        name="lastName"
                        size="small"
                        value={formik.values.lastName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.lastName &&
                          Boolean(formik.errors.lastName)
                        }
                        helperText={
                          formik.touched.lastName && formik.errors.lastName
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Email</RequiredLabel>}
                        name="email"
                        type="email"
                        size="small"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.email && Boolean(formik.errors.email)
                        }
                        helperText={formik.touched.email && formik.errors.email}
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Phone Number</RequiredLabel>}
                        name="phone"
                        size="small"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.phone && Boolean(formik.errors.phone)
                        }
                        helperText={formik.touched.phone && formik.errors.phone}
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Typography fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                    Professional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={<RequiredLabel>Qualification</RequiredLabel>}
                        name="qualificationId"
                        size="small"
                        value={formik.values.qualificationId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.qualificationId &&
                          Boolean(formik.errors.qualificationId)
                        }
                        helperText={
                          formik.touched.qualificationId &&
                          formik.errors.qualificationId
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {academicQualifications.map((qual) => (
                          <MenuItem key={qual.id} value={qual.id}>
                            {qual.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Specialization</RequiredLabel>}
                        name="specialization"
                        size="small"
                        value={formik.values.specialization}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.specialization &&
                          Boolean(formik.errors.specialization)
                        }
                        helperText={
                          formik.touched.specialization &&
                          formik.errors.specialization
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        placeholder="e.g., Mathematics, Computer Science, Physics"
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <RequiredLabel>Experience (Years)</RequiredLabel>
                        }
                        name="experienceYears"
                        type="number"
                        size="small"
                        value={formik.values.experienceYears}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.experienceYears &&
                          Boolean(formik.errors.experienceYears)
                        }
                        helperText={
                          formik.touched.experienceYears &&
                          formik.errors.experienceYears
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Hourly Rate (Nu.)</RequiredLabel>}
                        name="hourlyRate"
                        type="number"
                        size="small"
                        value={formik.values.hourlyRate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.hourlyRate &&
                          Boolean(formik.errors.hourlyRate)
                        }
                        helperText={
                          formik.touched.hourlyRate && formik.errors.hourlyRate
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 0, step: 50 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Joining Date"
                        name="joiningDate"
                        type="date"
                        size="small"
                        value={formik.values.joiningDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.joiningDate &&
                          Boolean(formik.errors.joiningDate)
                        }
                        helperText={
                          formik.touched.joiningDate &&
                          formik.errors.joiningDate
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    {dialogMode !== "view" && (
                      <Grid item size={{ xs: 12, md: 12 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formik.values.statusId === 1}
                              onChange={(e) =>
                                formik.setFieldValue(
                                  "statusId",
                                  e.target.checked ? 1 : 2,
                                )
                              }
                              color="primary"
                            />
                          }
                          label={
                            formik.values.statusId === 1 ? "Active" : "Inactive"
                          }
                        />
                      </Grid>
                    )}
                    {dialogMode === "view" && (
                      <Grid item size={{ xs: 12, md: 12 }}>
                        <Chip
                          label={`Status: ${getStatusName(formik.values.statusId)}`}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(
                              formik.values.statusId,
                            ),
                            color: "white",
                          }}
                        />
                      </Grid>
                    )}
                    <Grid item size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        size="small"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.description &&
                          Boolean(formik.errors.description)
                        }
                        helperText={
                          formik.touched.description &&
                          formik.errors.description
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => setOpenDialog(false)}
                  disabled={loading}
                >
                  {dialogMode === "view" ? "Close" : "Cancel"}
                </Button>
                {dialogMode !== "view" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => handleReset(formik.resetForm)}
                      startIcon={<RotateLeftIcon />}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading
                        ? "Saving..."
                        : dialogMode === "add"
                          ? "Create"
                          : "Update"}
                    </Button>
                  </>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
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
            Are you sure you want to delete "
            {tutorToDelete &&
              getFullName(
                tutorToDelete.firstName,
                tutorToDelete.middleName,
                tutorToDelete.lastName,
              )}
            "?
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
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TutorIndex;
