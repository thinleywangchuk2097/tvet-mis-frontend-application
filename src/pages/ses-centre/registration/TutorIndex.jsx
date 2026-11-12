import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  Tooltip,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import TutorService from "../../../api/services/internal/ses-center/TutorService";
import CommonService from "../../../api/services/internal/common/CommonService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";

const GENDER_PARENT_ID = 8;
const ACADEMIC_QUALIFICATION_PARENT_ID = 18;

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

RequiredLabel.propTypes = {
  children: PropTypes.node.isRequired,
};

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
  const [genders, setGenders] = useState([]);
  // approved subjects of this SES centre (multi-select)
  const [subjects, setSubjects] = useState([]);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState(null);

  // Fetch institute details on component mount
  useEffect(() => {
    fetchInstituteDetails();
    fetchAcademicQualification();
    CommonService.getByParentId(GENDER_PARENT_ID).then((res) => {
      if (!(res instanceof Error) && !res?.isAxiosError) {
        setGenders(Array.isArray(res?.data) ? res.data : []);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch tutors when instituteId is available
  useEffect(() => {
    if (instituteId) {
      fetchTutors();
      fetchApprovedSubjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteId]);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instId = response.data[0]?.institute_id;
      if (instId) {
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
      const AcademicQualification = await CommonService.getByParentId(
        ACADEMIC_QUALIFICATION_PARENT_ID,
      );
      setAcademicQualifications(AcademicQualification.data);
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

  // Only approved subjects (57) can be assigned; no status = added before the subject workflow
  const fetchApprovedSubjects = async () => {
    const res = await SubjectService.getAllSubjects(instituteId, access_token);
    if (res instanceof Error || res?.isAxiosError) return;
    const list = Array.isArray(res?.data) ? res.data : [];
    setSubjects(
      list
        .filter(
          (s) =>
            !s.application_status_id || Number(s.application_status_id) === 57,
        )
        .map((s) => ({ id: Number(s.id), name: s.subject_name })),
    );
  };

  // Helper function to map snake_case to camelCase
  const mapTutorData = (tutor) => ({
    id: tutor.id,
    citizenId: tutor.citizen_id,
    // older tutors were saved with first / middle / last name
    name:
      tutor.name ||
      [tutor.first_name, tutor.middle_name, tutor.last_name]
        .filter(Boolean)
        .join(" "),
    genderId: tutor.gender_id ? parseInt(tutor.gender_id) : "",
    qualificationId: tutor.qualification_id
      ? parseInt(tutor.qualification_id)
      : null,
    subjectIds: tutor.subject_ids
      ? String(tutor.subject_ids)
          .split(",")
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [],
    email: tutor.email,
    phone: tutor.mobile_no,
    statusId: tutor.status_id ? parseInt(tutor.status_id) : 1,
    instituteId: tutor.institute_id,
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
      const response = await TutorService.getAllTutors(
        instituteId,
        access_token,
      );

      if (response && response.data) {
        const tutorsData = Array.isArray(response.data)
          ? response.data.map(mapTutorData)
          : [];
        setTutors(tutorsData);
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
    const id =
      typeof qualificationId === "string"
        ? parseInt(qualificationId)
        : qualificationId;
    const qualification = academicQualifications.find((q) => q.id === id);
    return qualification ? qualification.name : "N/A";
  };

  const getGenderName = (genderId) =>
    genders.find((g) => String(g.id) === String(genderId))?.name || "—";

  const getSubjectNames = (ids) =>
    (ids || [])
      .map((id) => subjects.find((s) => s.id === Number(id))?.name)
      .filter(Boolean)
      .join(", ") || "—";

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredTutors = tutors.filter(
    (t) =>
      (t.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.citizenId?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      getSubjectNames(t.subjectIds)
        .toLowerCase()
        .includes(search.toLowerCase()),
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
        await fetchTutors();
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
        name: selectedTutor.name || "",
        citizenId: selectedTutor.citizenId || "",
        genderId: selectedTutor.genderId || "",
        qualificationId: selectedTutor.qualificationId || "",
        subjectIds: selectedTutor.subjectIds || [],
        email: selectedTutor.email || "",
        phone: selectedTutor.phone || "",
      };
    }
    return {
      id: "",
      name: "",
      citizenId: "",
      genderId: "",
      qualificationId: "",
      subjectIds: [],
      email: "",
      phone: "",
    };
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Name is required")
      .max(100, "Name must be at most 100 characters"),
    citizenId: Yup.string()
      .required("CID is required")
      .matches(/^\d{11}$/, "CID must be 11 digits"),
    genderId: Yup.string().required("Gender is required"),
    qualificationId: Yup.string().required("Qualification Level is required"),
    subjectIds: Yup.array().min(1, "Select at least one subject"),
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format"),
    phone: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]{8}$/, "Phone number must be 8 digits"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: dialogMode === "edit" ? values.id : null,
        citizenId: values.citizenId,
        name: values.name.trim(),
        genderId: parseInt(values.genderId),
        qualificationId: parseInt(values.qualificationId),
        subjectIds: values.subjectIds.map(Number),
        email: values.email,
        mobileNo: values.phone,
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
      };

      let response;

      if (dialogMode === "add") {
        response = await TutorService.submitTutor(payload, access_token);

        if (response && response.status === 201) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Tutor created successfully!",
            );
            resetForm();
            setOpenDialog(false);
            await fetchTutors();
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
          await fetchTutors();
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
              <TableCell>Name</TableCell>
              <TableCell>CID</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Qualification Level</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
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
                  return (
                    <TableRow key={tutor.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{tutor.name}</TableCell>
                      <TableCell>{tutor.citizenId}</TableCell>
                      <TableCell>{getGenderName(tutor.genderId)}</TableCell>
                      <TableCell>
                        {getQualificationName(tutor.qualificationId)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        {getSubjectNames(tutor.subjectIds)}
                      </TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>{tutor.phone}</TableCell>
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
                <TableCell colSpan={9} align="center">
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
                    Tutor Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Name</RequiredLabel>}
                        name="name"
                        size="small"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.name && Boolean(formik.errors.name)
                        }
                        helperText={formik.touched.name && formik.errors.name}
                        slotProps={{
                          input: { readOnly: dialogMode === "view" },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>CID</RequiredLabel>}
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
                          input: { readOnly: dialogMode === "view" },
                          htmlInput: { maxLength: 11, inputMode: "numeric" },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={<RequiredLabel>Gender</RequiredLabel>}
                        name="genderId"
                        size="small"
                        value={formik.values.genderId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.genderId &&
                          Boolean(formik.errors.genderId)
                        }
                        helperText={
                          formik.touched.genderId && formik.errors.genderId
                        }
                        slotProps={{
                          input: { readOnly: dialogMode === "view" },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {genders.map((o) => (
                          <MenuItem key={o.id} value={o.id}>
                            {o.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <RequiredLabel>Qualification Level</RequiredLabel>
                        }
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
                          input: { readOnly: dialogMode === "view" },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {academicQualifications.map((o) => (
                          <MenuItem key={o.id} value={o.id}>
                            {o.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12 }}>
                      <TextField
                        select
                        fullWidth
                        label={<RequiredLabel>Subjects</RequiredLabel>}
                        name="subjectIds"
                        size="small"
                        value={formik.values.subjectIds}
                        onChange={(e) =>
                          formik.setFieldValue(
                            "subjectIds",
                            typeof e.target.value === "string"
                              ? e.target.value.split(",").map(Number)
                              : e.target.value,
                          )
                        }
                        onBlur={() =>
                          formik.setFieldTouched("subjectIds", true)
                        }
                        error={
                          formik.touched.subjectIds &&
                          Boolean(formik.errors.subjectIds)
                        }
                        helperText={
                          (formik.touched.subjectIds &&
                            formik.errors.subjectIds) ||
                          (subjects.length === 0
                            ? "No approved subjects yet. Subjects must be approved before they can be assigned."
                            : "")
                        }
                        slotProps={{
                          input: { readOnly: dialogMode === "view" },
                          select: {
                            multiple: true,
                            renderValue: (selected) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selected.map((id) => (
                                  <Chip
                                    key={id}
                                    size="small"
                                    label={
                                      subjects.find((s) => s.id === Number(id))
                                        ?.name || `Subject ${id}`
                                    }
                                    sx={{ height: 22 }}
                                  />
                                ))}
                              </Box>
                            ),
                          },
                        }}
                      >
                        {subjects.map((sub) => (
                          <MenuItem key={sub.id} value={sub.id}>
                            <Checkbox
                              size="small"
                              checked={formik.values.subjectIds.includes(
                                sub.id,
                              )}
                              sx={{ p: 0.5, mr: 1 }}
                            />
                            {sub.name}
                          </MenuItem>
                        ))}
                      </TextField>
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
                          input: { readOnly: dialogMode === "view" },
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
                          input: { readOnly: dialogMode === "view" },
                          htmlInput: { maxLength: 8, inputMode: "numeric" },
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
            Are you sure you want to delete &quot;
            {tutorToDelete?.name}
            &quot;?
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
