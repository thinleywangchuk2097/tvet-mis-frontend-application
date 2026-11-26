import { useState, useEffect, useRef } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Chip,
  CircularProgress,
  Box,
  Avatar,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  FormControl,
  FormLabel,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import FileUpload from "../../components/file/FileUpload";
import { Formik, Form } from "formik";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { toast } from "react-toastify";
import CommonService from "../../api/services/internal/common/CommonService";
import ApplyAccreditedCourseService from "../../api/services/internal/course/ApplyAccreditedCourseService";
import AddTrainerService from "../../api/services/internal/trainer/AddTrainerService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";

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

// Table style (same as the Non-BQF programme list)
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

const SEARCH_FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    height: "36px",
    "& input": { padding: "8px 12px" },
    "& fieldset": { borderRadius: "4px" },
  },
};

// Active (green) / Inactive (grey) chip, sized like the programme status chips
const statusChipSx = (active) => ({
  backgroundColor: active ? "#4caf50" : "#9e9e9e",
  color: "white",
  fontWeight: "medium",
  minWidth: "100px",
  "& .MuiChip-label": { px: 1.5, py: 0.5 },
});

// Bordered form section with a bold title and divider
const FormSection = ({ title, children }) => (
  <Paper sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
    <Typography fontWeight={600} gutterBottom>
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

// the course names, one per line
const CoursesCell = ({ courses }) => {
  if (!courses?.length) return "-";
  return (
    <Box>
      {courses.map((course) => (
        <div key={course.courseId}>{course.courseName}</div>
      ))}
    </Box>
  );
};

CoursesCell.propTypes = {
  courses: PropTypes.array,
};

const DIALOG_TITLES = { add: "Add New Trainer", edit: "Edit Trainer Details" };

const submitLabel = (loading, dialogMode) => {
  if (loading) return "Saving...";
  return dialogMode === "add" ? "Save Trainer" : "Update Trainer";
};


const AddTrainerIndex = () => {
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(false);
  // shown under the CID / Work Permit field when the trainer can't be added (see checkTrainerConflict)
  const [idConflictMessage, setIdConflictMessage] = useState("");
  const idCheckTimer = useRef(null);
  const latestIdCheck = useRef("");
  const [genders, setGenders] = useState([]);
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [instituteId, setInstituteId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Course related states
  const [accreditedCourses, setAccreditedCourses] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);

  // Load all reference data first
  useEffect(() => {
    loadReferenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReferenceData = async () => {
    try {
      await Promise.all([
        fetchAcademicQualification(),
        fetchGenders(),
        fetchEmploymentType(),
        fetchAccreditedCourses(),
      ]);
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error loading reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch institute and trainers after reference data is loaded
  useEffect(() => {
    if (isDataLoaded && registration_no) {
      fetchInstituteDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded, registration_no]);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instId = response.data[0]?.institute_id;
      if (instId) {
        setInstituteId(instId);
        await fetchTrainers(instId);
      } else {
        toast.error("Institute ID not found");
      }
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to fetch institute details");
    }
  };

  const fetchTrainers = async (instId) => {
    setLoading(true);
    try {
      const response = await AddTrainerService.getAllTrainer(
        instId,
        access_token,
      );
      if (response && response.data) {
        const trainersData = Array.isArray(response.data)
          ? response.data.map((trainer) => mapTrainerData(trainer))
          : [];
        setTrainers(trainersData);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast.error("Failed to fetch trainers");
    } finally {
      setLoading(false);
    }
  };

  const mapTrainerData = (trainer) => {
    let parsedCourses = [];
    if (trainer.courses) {
      if (typeof trainer.courses === "string") {
        try {
          parsedCourses = JSON.parse(trainer.courses);
        } catch (e) {
          console.error("Error parsing courses:", e);
          parsedCourses = [];
        }
      } else if (Array.isArray(trainer.courses)) {
        parsedCourses = trainer.courses;
      }
    }

    const genderName = getGenderName(trainer.gender_id);
    const qualificationName = getQualificationName(trainer.qualification_id);
    const employmentTypeName = getEmploymentTypeName(
      trainer.employment_type_id,
    );

    const coursesWithNames = parsedCourses.map((course) => ({
      ...course,
      courseName: getCourseName(course.courseId),
    }));

    return {
      id: trainer.id,
      hasCitizenId: trainer.citizen_id ? "yes" : "no",
      citizenId: trainer.citizen_id || "",
      workPermitNo: trainer.work_permit_no || "",
      name: trainer.name,
      genderId: trainer.gender_id,
      genderName: genderName,
      qualificationId: trainer.qualification_id,
      qualificationName: qualificationName,
      workExperience: trainer.work_experience,
      employmentTypeId: trainer.employment_type_id,
      employmentTypeName: employmentTypeName,
      email: trainer.email,
      mobileNo: trainer.mobile_no,
      specialization: trainer.specialization || "",
      description: trainer.description || "",
      active: trainer.is_active || "Y",
      joiningDate: trainer.joining_date,
      files: trainer.files || [],
      courses: coursesWithNames,
    };
  };

  const fetchAcademicQualification = async () => {
    try {
      const AcademicQualification = await CommonService.getByParentId(18);
      setAcademicQualifications(AcademicQualification.data);
    } catch (error) {
      console.error("Error fetching Academic Qualification:", error);
      toast.error("Failed to fetch academic qualifications");
    }
  };

  const fetchGenders = async () => {
    try {
      const gender = await CommonService.getByParentId(8);
      setGenders(gender.data);
    } catch (error) {
      console.error("Error fetching Genders:", error);
      toast.error("Failed to fetch genders");
    }
  };

  const fetchEmploymentType = async () => {
    try {
      const employmentType = await CommonService.getByParentId(11);
      setEmploymentTypes(employmentType.data);
    } catch (error) {
      console.error("Error Fetching Employment Type:", error);
      toast.error("Failed to fetch employment types");
    }
  };

  const fetchAccreditedCourses = async () => {
    try {
      const response =
        await ApplyAccreditedCourseService.getAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      setAccreditedCourses(response.data);
    } catch (error) {
      console.error("Error fetching accredited courses:", error);
      toast.error("Failed to fetch accredited courses");
      setAccreditedCourses([]);
    }
  };

  const getGenderName = (genderId) => {
    if (!genderId) return "";
    const gender = genders.find((g) => String(g.id) === String(genderId));
    return gender?.name || "";
  };

  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "";
    const qualification = academicQualifications.find(
      (q) => String(q.id) === String(qualificationId),
    );
    return qualification?.name || "";
  };

  const getEmploymentTypeName = (employmentTypeId) => {
    if (!employmentTypeId) return "";
    const employmentType = employmentTypes.find(
      (e) => String(e.id) === String(employmentTypeId),
    );
    return employmentType?.name || "";
  };

  // Helper to get a course's display label - handles accredited (programme_title),
  // non-accredited (course_name / name), and fallback
  const getCourseLabel = (course) => {
    if (!course) return "";
    return (
      course.course_name ||
      course.name ||
      course.programme_title ||
      `Course ID: ${course.id}`
    );
  };

  // trainer courses are the institute's approved BQF (accredited) courses
  const getCourseName = (courseId) => {
    const course = accreditedCourses.find((c) => String(c.id) === String(courseId));
    return getCourseLabel(course) || `Course ID: ${courseId}`;
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredTrainers = trainers.filter(
    (t) =>
      (t.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.citizenId?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.workPermitNo?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.qualificationName?.toLowerCase() || "").includes(
        search.toLowerCase(),
      ) ||
      (t.specialization?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (t.email?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const handleView = (trainer) => {
    setSelectedTrainer(trainer);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleEdit = (trainer) => {
    setSelectedTrainer(trainer);
    setDialogMode("edit");
    setIdConflictMessage("");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedTrainer(null);
    setDialogMode("add");
    setIdConflictMessage("");
    setOpenDialog(true);
  };

  // ~0.6 s after typing stops: is this CID / work permit no already in our institute,
  // or still active at another institute?
  const scheduleIdCheck = ({ citizenId, workPermitNo }, excludeId) => {
    clearTimeout(idCheckTimer.current);
    setIdConflictMessage("");
    const cid = citizenId?.trim() || "";
    const wp = workPermitNo?.trim() || "";
    const key = `${cid}|${wp}`;
    latestIdCheck.current = key;
    if ((!cid && !wp) || !instituteId) return;
    idCheckTimer.current = setTimeout(async () => {
      const res = await AddTrainerService.checkTrainerConflict(
        {
          citizenId: cid || undefined,
          workPermitNo: wp || undefined,
          instituteId,
          excludeId: excludeId || undefined,
        },
        access_token,
      );
      // ignore the answer if the user typed again meanwhile
      if (latestIdCheck.current === key) {
        setIdConflictMessage(res?.data?.exists ? res.data.message : "");
      }
    }, 600);
  };

  const handleDeleteClick = (trainer) => {
    setTrainerToDelete(trainer);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!trainerToDelete) return;

    setLoading(true);
    try {
      const response = await AddTrainerService.deleteTrainer(
        trainerToDelete.id,
        access_token,
      );

      if (response && response.status === 200) {
        toast.success("Trainer deleted successfully!");
        await fetchTrainers(instituteId);
      } else {
        toast.error(
          response?.response?.data?.message ||
            response?.data?.message ||
            "Failed to delete trainer",
        );
      }
      setDeleteConfirmOpen(false);
      setTrainerToDelete(null);
    } catch (error) {
      console.error("Error deleting trainer:", error);
      toast.error(error.response?.data?.message || "Failed to delete trainer");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTrainerToDelete(null);
  };

  const getInitialValues = () => {
    if ((dialogMode === "edit" || dialogMode === "view") && selectedTrainer) {
      return {
        id: selectedTrainer.id || "",
        hasCitizenId: selectedTrainer.hasCitizenId || "yes",
        citizenId: selectedTrainer.citizenId || "",
        workPermitNo: selectedTrainer.workPermitNo || "",
        name: selectedTrainer.name || "",
        genderId: selectedTrainer.genderId || "",
        qualificationId: selectedTrainer.qualificationId || "",
        workExperience: selectedTrainer.workExperience || "",
        employmentTypeId: selectedTrainer.employmentTypeId || "",
        email: selectedTrainer.email || "",
        mobileNo: selectedTrainer.mobileNo || "",
        specialization: selectedTrainer.specialization || "",
        joiningDate: selectedTrainer.joiningDate || "",
        description: selectedTrainer.description || "",
        active: selectedTrainer.active || "Y",
        files: selectedTrainer.files || [],
      };
    }
    return {
      id: "",
      hasCitizenId: "yes",
      citizenId: "",
      workPermitNo: "",
      name: "",
      genderId: "",
      qualificationId: "",
      workExperience: "",
      employmentTypeId: "",
      email: "",
      mobileNo: "",
      specialization: "",
      joiningDate: new Date().toISOString().split("T")[0],
      description: "",
      active: "Y",
      files: [],
    };
  };

  const validationSchema = Yup.object().shape({
    hasCitizenId: Yup.string().required("Required"),
    citizenId: Yup.string().when("hasCitizenId", {
      is: "yes",
      then: (schema) =>
        schema
          .required("Citizen ID is required")
          .max(20, "Citizen ID must be at most 20 characters"),
      otherwise: (schema) => schema.nullable(),
    }),
    workPermitNo: Yup.string().when("hasCitizenId", {
      is: "no",
      then: (schema) =>
        schema.required("Work Permit No/Reference No is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    name: Yup.string()
      .required("Name is required")
      .max(100, "Name must be at most 100 characters"),
    genderId: Yup.string().required("Gender is required"),
    qualificationId: Yup.string().required("Qualification is required"),
    workExperience: Yup.number()
      .required("Work Experience is required")
      .min(0, "Experience cannot be negative")
      .max(50, "Experience cannot exceed 50 years")
      .typeError("Experience must be a valid number"),
    employmentTypeId: Yup.string().required("Employment Type is required"),
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format"),
    mobileNo: Yup.string()
      .required("Phone number is required")
      .matches(/^\d{8}$/, "Phone number must be exactly 8 digits"),
    specialization: Yup.string()
      .required("Specialization is required")
      .max(100, "Specialization must be at most 100 characters"),
    description: Yup.string().max(
      500,
      "Description must be at most 500 characters",
    ),
    files: Yup.array().min(0, "Optional"),
  });

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({
          name: file.name,
          content: reader.result.split(",")[1],
          contentType: file.type || "application/octet-stream",
        });
      reader.onerror = reject;
    });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }

    setLoading(true);

    try {
      const processedFiles = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const payload = {
        id: dialogMode === "edit" ? values.id : null,
        citizenId: values.citizenId || null,
        workPermitNo: values.workPermitNo || null,
        name: values.name,
        genderId: parseInt(values.genderId),
        qualificationId: parseInt(values.qualificationId),
        workExperience: values.workExperience,
        employmentTypeId: parseInt(values.employmentTypeId),
        email: values.email,
        mobileNo: values.mobileNo,
        specialization: values.specialization,
        joiningDate: values.joiningDate,
        description: values.description || null,
        active: values.active || "Y", // Y = active, N = inactive
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
      };

      let response;
      if (dialogMode === "add") {
        response = await AddTrainerService.submitTrainer(payload, access_token);
        if (response?.status === 201 || response?.status === 200) {
          toast.success(
            response.data?.message || "Trainer added successfully!",
          );
          await fetchTrainers(instituteId);
          resetForm();
          setOpenDialog(false);
        } else {
          showSaveError(response, "Failed to add trainer");
        }
      } else if (dialogMode === "edit") {
        response = await AddTrainerService.updateTrainer(payload, access_token);
        if (response && response.status === 200) {
          toast.success(
            response.data?.message || "Trainer updated successfully!",
          );
          await fetchTrainers(instituteId);
          setOpenDialog(false);
        } else {
          showSaveError(response, "Failed to update trainer");
        }
      }
    } catch (error) {
      console.error("Error saving trainer:", error);
      toast.error(error.response?.data?.message || "Failed to save trainer");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // The service returns the axios error instead of throwing it.
  // 409 (CID / work permit taken) is also shown under the field.
  const showSaveError = (response, fallback) => {
    const message =
      response?.response?.data?.message || response?.data?.message;
    if (response?.status === 409) setIdConflictMessage(message || "");
    toast.error(message || fallback);
  };

  const handleReset = (resetForm) => {
    resetForm();
    toast.info("Form has been reset");
  };

  const getTrainerDisplayId = (trainer) => {
    if (trainer.hasCitizenId === "yes") {
      return trainer.citizenId;
    }
    return trainer.workPermitNo;
  };

  if (!isDataLoaded) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10 }}
        sx={{ textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading reference data...
        </Typography>
      </Paper>
    );
  }

  if (!instituteId && trainers.length === 0 && !loading) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10 }}
        sx={{ textAlign: "center" }}
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
        List of Trainers
      </Typography>

      {/* Search + Add Button */}
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={SEARCH_FIELD_SX}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ height: "36px" }}
          >
            Add Trainer
          </Button>
        </Grid>
      </Grid>

      {/* Trainer table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID / Work Permit No.</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Experience (Yrs)</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Mobile No.</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Programme</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((trainer, index) => (
                <TableRow key={trainer.id}>
                  <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                  <TableCell>{trainer.name}</TableCell>
                  <TableCell>{getTrainerDisplayId(trainer) || "-"}</TableCell>
                  <TableCell>{trainer.genderName || "-"}</TableCell>
                  <TableCell>{trainer.qualificationName || "-"}</TableCell>
                  <TableCell>{trainer.specialization || "-"}</TableCell>
                  <TableCell>{trainer.workExperience || 0}</TableCell>
                  <TableCell>{trainer.employmentTypeName || "-"}</TableCell>
                  <TableCell>{trainer.mobileNo || "-"}</TableCell>
                  <TableCell>{trainer.email || "-"}</TableCell>
                  <TableCell>
                    <CoursesCell courses={trainer.courses} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trainer.active === "N" ? "Inactive" : "Active"}
                      size="small"
                      sx={statusChipSx(trainer.active !== "N")}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleView(trainer)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEdit(trainer)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        color: "error.main",
                        "&:hover": { backgroundColor: "#ffebee" },
                      }}
                      onClick={() => handleDeleteClick(trainer)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {filteredTrainers.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  {loading ? (
                    <CircularProgress size={22} sx={{ my: 1 }} />
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
          count={filteredTrainers.length}
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
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          {DIALOG_TITLES[dialogMode] || "Trainer Details"}
        </DialogTitle>
        <Formik
          key={dialogMode + (selectedTrainer?.id || "")}
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <>
                  {/* Identification Section */}
                  <FormSection title="Identification Information">
                    <Grid container spacing={2}>
                      <Grid item size={{ xs: 12 }}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend">
                            <RequiredLabel>
                              Has Citizen ID Number?
                            </RequiredLabel>
                          </FormLabel>
                          <RadioGroup
                            row
                            name="hasCitizenId"
                            value={formik.values.hasCitizenId}
                            onChange={(e) => {
                              formik.setFieldValue(
                                "hasCitizenId",
                                e.target.value,
                              );
                              if (e.target.value === "yes") {
                                formik.setFieldValue("workPermitNo", "");
                              } else {
                                formik.setFieldValue("citizenId", "");
                              }
                              clearTimeout(idCheckTimer.current);
                              latestIdCheck.current = "";
                              setIdConflictMessage("");
                            }}
                          >
                            <FormControlLabel
                              value="yes"
                              control={
                                <Radio disabled={dialogMode === "view"} />
                              }
                              label="Yes"
                            />
                            <FormControlLabel
                              value="no"
                              control={
                                <Radio disabled={dialogMode === "view"} />
                              }
                              label="No"
                            />
                          </RadioGroup>
                        </FormControl>
                      </Grid>

                      {formik.values.hasCitizenId === "yes" && (
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Citizen ID No</RequiredLabel>}
                            name="citizenId"
                            size="small"
                            value={formik.values.citizenId}
                            onChange={(e) => {
                              formik.handleChange(e);
                              scheduleIdCheck(
                                { citizenId: e.target.value },
                                formik.values.id,
                              );
                            }}
                            onBlur={formik.handleBlur}
                            error={
                              Boolean(idConflictMessage) ||
                              (formik.touched.citizenId &&
                                Boolean(formik.errors.citizenId))
                            }
                            helperText={
                              idConflictMessage ||
                              (formik.touched.citizenId &&
                                formik.errors.citizenId)
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                      )}

                      {formik.values.hasCitizenId === "no" && (
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={
                              <RequiredLabel>
                                Work Permit No/Reference No
                              </RequiredLabel>
                            }
                            name="workPermitNo"
                            size="small"
                            value={formik.values.workPermitNo}
                            onChange={(e) => {
                              formik.handleChange(e);
                              scheduleIdCheck(
                                { workPermitNo: e.target.value },
                                formik.values.id,
                              );
                            }}
                            onBlur={formik.handleBlur}
                            error={
                              Boolean(idConflictMessage) ||
                              (formik.touched.workPermitNo &&
                                Boolean(formik.errors.workPermitNo))
                            }
                            helperText={
                              idConflictMessage ||
                              (formik.touched.workPermitNo &&
                                formik.errors.workPermitNo)
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </FormSection>

                  {/* Personal Information */}
                  <FormSection title="Personal Information">
                    <Grid container spacing={2}>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={<RequiredLabel>Full Name</RequiredLabel>}
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
                            input: {
                              readOnly: dialogMode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
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
                            input: {
                              readOnly: dialogMode === "view",
                            },
                          }}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {genders.map((gender) => (
                            <MenuItem key={gender.id} value={gender.id}>
                              {gender.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
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
                          helperText={
                            formik.touched.email && formik.errors.email
                          }
                          slotProps={{
                            input: {
                              readOnly: dialogMode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={<RequiredLabel>Phone Number</RequiredLabel>}
                          name="mobileNo"
                          size="small"
                          value={formik.values.mobileNo}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.mobileNo &&
                            Boolean(formik.errors.mobileNo)
                          }
                          helperText={
                            formik.touched.mobileNo && formik.errors.mobileNo
                          }
                          slotProps={{
                            input: {
                              readOnly: dialogMode === "view",
                            },
                            htmlInput: {
                              maxLength: 8,
                              pattern: "[0-9]{8}",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </FormSection>

                  {/* Professional Information */}
                  <FormSection title="Professional Information">
                    <Grid container spacing={2}>
                      <Grid item size={{ xs: 12, md: 4 }}>
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
                          {academicQualifications.map((qualification) => (
                            <MenuItem
                              key={qualification.id}
                              value={qualification.id}
                            >
                              {qualification.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
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
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={
                            <RequiredLabel>
                              Work Experience (Years)
                            </RequiredLabel>
                          }
                          name="workExperience"
                          type="number"
                          size="small"
                          value={formik.values.workExperience}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.workExperience &&
                            Boolean(formik.errors.workExperience)
                          }
                          helperText={
                            formik.touched.workExperience &&
                            formik.errors.workExperience
                          }
                          slotProps={{
                            input: {
                              readOnly: dialogMode === "view",
                            },
                          }}
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label={<RequiredLabel>Employment Type</RequiredLabel>}
                          name="employmentTypeId"
                          size="small"
                          value={formik.values.employmentTypeId}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.employmentTypeId &&
                            Boolean(formik.errors.employmentTypeId)
                          }
                          helperText={
                            formik.touched.employmentTypeId &&
                            formik.errors.employmentTypeId
                          }
                          slotProps={{
                            input: {
                              readOnly: dialogMode === "view",
                            },
                          }}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {employmentTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Joining Date"
                          name="joiningDate"
                          type="date"
                          size="small"
                          value={formik.values.joiningDate}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          slotProps={{
                            input: {
                              readOnly: dialogMode === "view",
                            },
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      {dialogMode !== "add" && (
                        <Grid item size={{ xs: 12 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formik.values.active === "Y"}
                                onChange={(e) =>
                                  formik.setFieldValue(
                                    "active",
                                    e.target.checked ? "Y" : "N",
                                  )
                                }
                                color="success"
                                disabled={dialogMode === "view"}
                              />
                            }
                            label={
                              formik.values.active === "Y"
                                ? "Active"
                                : "Inactive"
                            }
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
                  </FormSection>

                  {/* Supporting Documents Section */}
                  {dialogMode !== "view" && (
                    <FormSection title="Supporting Documents">
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12 }}>
                          <FileUpload
                            files={formik.values.files}
                            onFilesChange={(files) =>
                              formik.setFieldValue("files", files)
                            }
                          />
                        </Grid>
                      </Grid>
                    </FormSection>
                  )}

                  {dialogMode === "view" && formik.values.files?.length > 0 && (
                    <FormSection title="Uploaded Documents">
                      <Box>
                        {formik.values.files.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name || `Document ${index + 1}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </FormSection>
                  )}
                </>
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
                )}
                {dialogMode !== "view" && (
                  <Button
                    size="small"
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || Boolean(idConflictMessage)}
                  >
                    {submitLabel(loading, dialogMode)}
                  </Button>
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
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          <Avatar
            sx={{
              mx: "auto",
              mb: 2,
              width: 52,
              height: 52,
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              color: "error.main",
            }}
          >
            <WarningAmberIcon />
          </Avatar>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Delete trainer?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>{trainerToDelete?.name}</strong> will be removed from your
            trainer list. You can add them again later with the same CID or work
            permit number.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "center" }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancelDelete}
            sx={{ textTransform: "none", minWidth: 110 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
            sx={{ textTransform: "none", minWidth: 110 }}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AddTrainerIndex;
