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
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
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
import FileUpload from "../../components/file/FileUpload";
import { Formik, Form, FieldArray } from "formik";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { toast } from "react-toastify";
import CommonService from "../../api/services/internal/common/CommonService";
import ApplyAccreditedCourseService from "../../api/services/internal/course/ApplyAccreditedCourseService";
import ApplyNonAccreditedCourseService from "../../api/services/internal/course/ApplyNonAccreditedCourseService";
import AddTrainerService from "../../api/services/internal/trainer/AddTrainerService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";

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

const AddTrainerIndex = () => {
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [genders, setGenders] = useState([]);
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [instituteId, setInstituteId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Course related states
  const [accreditedCourses, setAccreditedCourses] = useState([]);
  const [nonAccreditedCourses, setNonAccreditedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);

  // Load all reference data first
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      await Promise.all([
        fetchAcademicQualification(),
        fetchGenders(),
        fetchEmploymentType(),
        fetchCourseTypes(),
        fetchAccreditedCourses(),
        fetchNonAccreditedCourses(),
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
      console.log("fetch trainer data api", response.data);
      if (response && response.data) {
        const trainersData = Array.isArray(response.data)
          ? response.data.map((trainer) => mapTrainerData(trainer))
          : [];
        setTrainers(trainersData);
        console.log("Fetched trainers:", trainersData);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast.error("Failed to fetch trainers");
    } finally {
      setLoading(false);
    }
  };

  const mapTrainerData = (trainer) => {
    // Parse courses if it's a string
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

    // Get names from reference data (using string comparison since API returns strings)
    const genderName = getGenderName(trainer.gender_id);
    const qualificationName = getQualificationName(trainer.qualification_id);
    const employmentTypeName = getEmploymentTypeName(trainer.employment_type_id);
    
    // Add course names
    const coursesWithNames = parsedCourses.map(course => ({
      ...course,
      courseName: getCourseName(course.courseTypeId, course.courseId)
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
      joiningDate: trainer.joining_date,
      files: trainer.files || [],
      courses: coursesWithNames,
    };
  };

  const fetchAcademicQualification = async () => {
    try {
      const AcademicQualification = await CommonService.getByParentId(18);
      setAcademicQualifications(AcademicQualification.data);
      console.log("Academic Qualification:", AcademicQualification.data);
    } catch (error) {
      console.error("Error fetching Academic Qualification:", error);
      toast.error("Failed to fetch academic qualifications");
    }
  };

  const fetchGenders = async () => {
    try {
      const gender = await CommonService.getByParentId(8);
      setGenders(gender.data);
      console.log("Gender:", gender.data);
    } catch (error) {
      console.error("Error fetching Genders:", error);
      toast.error("Failed to fetch genders");
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const courseTypes = await CommonService.getByParentId(13);
      setCourseTypes(courseTypes.data);
      console.log("Course Types:", courseTypes.data);
    } catch (error) {
      console.error("Error fetching course types:", error);
      toast.error("Failed to fetch course types");
    }
  };

  const fetchEmploymentType = async () => {
    try {
      const employmentType = await CommonService.getByParentId(11);
      setEmploymentTypes(employmentType.data);
      console.log("Employment Type:", employmentType.data);
    } catch (error) {
      console.error("Error Fetching Employment Type:", error);
      toast.error("Failed to fetch employment types");
    }
  };

  // Fetch accredited courses - using actual API
  const fetchAccreditedCourses = async () => {
    setLoadingCourses(true);
    try {
      const response =
        await ApplyAccreditedCourseService.getAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      setAccreditedCourses(response.data);
      console.log("Accredited Courses", response.data);
    } catch (error) {
      console.error("Error fetching accredited courses:", error);
      toast.error("Failed to fetch accredited courses");
      setAccreditedCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch non-accredited courses - using actual API
  const fetchNonAccreditedCourses = async () => {
    setLoadingCourses(true);
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      setNonAccreditedCourses(response.data);
      console.log("Non Accredited Courses", response.data);
    } catch (error) {
      console.error("Error fetching non-accredited courses:", error);
      toast.error("Failed to fetch non-accredited courses");
      setNonAccreditedCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Helper functions to get names from IDs (handle both string and number IDs)
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

  // Function to get course name by type and ID
  const getCourseName = (courseTypeId, courseId) => {
    const coursesList = getCoursesByType(courseTypeId);
    const course = coursesList.find(c => String(c.id) === String(courseId));
    return course?.course_name || course?.name || `Course ID: ${courseId}`;
  };

  // Function to get courses based on course type value
  const getCoursesByType = (courseTypeValue) => {
    const selectedCourseType = courseTypes.find(
      (type) => String(type.id) === String(courseTypeValue),
    );

    if (selectedCourseType?.name === "Accredited") {
      return accreditedCourses;
    } else if (selectedCourseType?.name === "Non Accredited") {
      return nonAccreditedCourses;
    }
    return [];
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
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedTrainer(null);
    setDialogMode("add");
    setOpenDialog(true);
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
        toast.error(response?.data?.message || "Failed to delete trainer");
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
        files: selectedTrainer.files || [],
        courses: selectedTrainer.courses || [],
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
      files: [],
      courses: [],
    };
  };

  const validationSchema = Yup.object().shape({
    hasCitizenId: Yup.string().required("Required"),
    citizenId: Yup.string()
      .test("citizenId-required", "Citizen ID is required", function (value) {
        const { hasCitizenId } = this.parent;
        if (hasCitizenId === "yes") {
          return value && value.length > 0;
        }
        return true;
      })
      .max(20, "Citizen ID must be at most 20 characters"),
    workPermitNo: Yup.string().test(
      "workPermitNo-required",
      "Work Permit No/Reference No is required",
      function (value) {
        const { hasCitizenId } = this.parent;
        if (hasCitizenId === "no") {
          return value && value.length > 0;
        }
        return true;
      },
    ),
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
    courses: Yup.array().of(
      Yup.object().shape({
        courseTypeId: Yup.string().required("Course type is required"),
        courseId: Yup.string().required("Course is required"),
      }),
    ),
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
      // Process files to base64 if any
      const processedFiles = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      // Process courses - keep courseTypeId inside each course
      const processedCourses = values.courses.map((course) => {
        return {
          courseTypeId: parseInt(course.courseTypeId),
          courseId: parseInt(course.courseId),
        };
      });

      // Prepare the payload
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
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
        courses: processedCourses,
      };

      console.log("Payload being sent:", payload);

      let response;
      if (dialogMode === "add") {
        response = await AddTrainerService.submitTrainer(payload, access_token);
        if ((response && response.status === 201) || response.status === 200) {
          toast.success(
            response.data?.message || "Trainer added successfully!",
          );
          await fetchTrainers(instituteId);
          resetForm();
          setOpenDialog(false);
        } else {
          toast.error(response?.data?.message || "Failed to add trainer");
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
          toast.error(response?.data?.message || "Failed to update trainer");
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

  const getInitials = (name) => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCourseTypeName = (courseTypeId) => {
    const courseType = courseTypes.find(
      (type) => String(type.id) === String(courseTypeId),
    );
    return courseType?.name || "";
  };

  if (!isDataLoaded) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10, textAlign: "center" }}
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
        Trainer Management
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
            placeholder="Search by Name, ID, Qualification or Specialization"
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
            Add Trainer
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>ID/Reference No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell align="center">Experience (Yrs)</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Courses</TableCell>
              <TableCell align="center" width={120}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainers.length > 0 ? (
              filteredTrainers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trainer, index) => (
                  <TableRow key={trainer.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTrainerDisplayId(trainer)}
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
                          {getInitials(trainer.name)}
                        </Avatar>
                        <Typography variant="body2">{trainer.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <EmailIcon
                          sx={{ fontSize: 12, color: "text.secondary" }}
                        />
                        <Typography variant="body2">{trainer.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <PhoneIcon
                          sx={{ fontSize: 12, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {trainer.mobileNo}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{trainer.qualificationName || "—"}</TableCell>
                    <TableCell>{trainer.specialization || "—"}</TableCell>
                    <TableCell align="center">
                      {trainer.workExperience} yrs
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trainer.employmentTypeName || "—"}
                        size="small"
                        variant="outlined"
                        sx={{
                          backgroundColor:
                            trainer.employmentTypeName === "full time" ||
                            trainer.employmentTypeName === "Full time"
                              ? "#e3f2fd"
                              : trainer.employmentTypeName === "part time" ||
                                  trainer.employmentTypeName === "Part time"
                                ? "#fff3e0"
                                : "#f5f5f5",
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {trainer.courses && trainer.courses.length > 0 ? (
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          {trainer.courses.map((course, idx) => (
                            <Chip
                              key={idx}
                              label={`${getCourseTypeName(course.courseTypeId)}: ${course.courseName}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.65rem" }}
                            />
                          ))}
                        </Box>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleView(trainer)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Trainer">
                        <IconButton
                          color="secondary"
                          size="small"
                          onClick={() => handleEdit(trainer)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Trainer">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(trainer)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
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
        maxWidth="lg"
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
                  ? "Add New Trainer"
                  : dialogMode === "edit"
                    ? "Edit Trainer Details"
                    : "Trainer Details"}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
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
                <Paper
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {/* Identification Section */}
                  <Typography fontWeight={600} gutterBottom>
                    Identification Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12 }}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">
                          <RequiredLabel>Has Citizen ID Number?</RequiredLabel>
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
                          }}
                        >
                          <FormControlLabel
                            value="yes"
                            control={<Radio disabled={dialogMode === "view"} />}
                            label="Yes"
                          />
                          <FormControlLabel
                            value="no"
                            control={<Radio disabled={dialogMode === "view"} />}
                            label="No"
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    {formik.values.hasCitizenId === "yes" && (
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label={<RequiredLabel>Citizen ID No</RequiredLabel>}
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
                    )}

                    {formik.values.hasCitizenId === "no" && (
                      <Grid item size={{ xs: 12, md: 6 }}>
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
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.workPermitNo &&
                            Boolean(formik.errors.workPermitNo)
                          }
                          helperText={
                            formik.touched.workPermitNo &&
                            formik.errors.workPermitNo
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

                  {/* Personal Information */}
                  <Typography fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
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

                  {/* Professional Information */}
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
                          <RequiredLabel>Work Experience (Years)</RequiredLabel>
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
                    <Grid item size={{ xs: 12, md: 6 }}>
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
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
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

                  {/* Course Assignment Section */}
                  <Typography fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                    Course Assignment
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <FieldArray name="courses">
                    {({ push, remove }) => (
                      <>
                        {formik.values.courses.map((course, index) => (
                          <Box
                            key={index}
                            sx={{
                              mb: 3,
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid item size={{ xs: 12, md: 5 }}>
                                <TextField
                                  select
                                  fullWidth
                                  label={
                                    <RequiredLabel>Course Type</RequiredLabel>
                                  }
                                  name={`courses.${index}.courseTypeId`}
                                  size="small"
                                  value={course.courseTypeId}
                                  onChange={(e) => {
                                    formik.handleChange(e);
                                    formik.setFieldValue(
                                      `courses.${index}.courseId`,
                                      "",
                                    );
                                  }}
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.courses?.[index]
                                      ?.courseTypeId &&
                                    Boolean(
                                      formik.errors.courses?.[index]
                                        ?.courseTypeId,
                                    )
                                  }
                                  helperText={
                                    formik.touched.courses?.[index]
                                      ?.courseTypeId &&
                                    formik.errors.courses?.[index]?.courseTypeId
                                  }
                                  slotProps={{
                                    input: {
                                      readOnly: dialogMode === "view",
                                    },
                                  }}
                                >
                                  <MenuItem value="">-select-</MenuItem>
                                  {courseTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                      {type.name}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>

                              <Grid item size={{ xs: 12, md: 6 }}>
                                <TextField
                                  select
                                  fullWidth
                                  label={
                                    <RequiredLabel>Course Name</RequiredLabel>
                                  }
                                  name={`courses.${index}.courseId`}
                                  size="small"
                                  value={course.courseId}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  disabled={
                                    !course.courseTypeId || loadingCourses
                                  }
                                  error={
                                    formik.touched.courses?.[index]?.courseId &&
                                    Boolean(
                                      formik.errors.courses?.[index]?.courseId,
                                    )
                                  }
                                  helperText={
                                    formik.touched.courses?.[index]?.courseId &&
                                    formik.errors.courses?.[index]?.courseId
                                  }
                                  slotProps={{
                                    input: {
                                      readOnly: dialogMode === "view",
                                    },
                                  }}
                                >
                                  <MenuItem value="">
                                    {!course.courseTypeId
                                      ? "Select course type first"
                                      : loadingCourses
                                        ? "Loading courses..."
                                        : "-select-"}
                                  </MenuItem>
                                  {getCoursesByType(course.courseTypeId).map(
                                    (c) => (
                                      <MenuItem key={c.id} value={c.id}>
                                        {c.course_name || c.name}
                                      </MenuItem>
                                    ),
                                  )}
                                </TextField>
                              </Grid>

                              {dialogMode !== "view" && (
                                <Grid item size={{ xs: 12, md: 1 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      height: "100%",
                                    }}
                                  >
                                    <IconButton
                                      color="error"
                                      onClick={() => remove(index)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        ))}

                        {dialogMode !== "view" && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              push({
                                courseTypeId: "",
                                courseId: "",
                              })
                            }
                            sx={{ mt: 1 }}
                          >
                            Add Course
                          </Button>
                        )}
                      </>
                    )}
                  </FieldArray>

                  {dialogMode === "view" &&
                    formik.values.courses?.length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        No courses assigned
                      </Typography>
                    )}

                  {/* Supporting Documents Section */}
                  {dialogMode !== "view" && (
                    <>
                      <Typography fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                        Supporting Documents
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
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
                    </>
                  )}

                  {dialogMode === "view" && formik.values.files?.length > 0 && (
                    <>
                      <Typography fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                        Uploaded Documents
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
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
                    </>
                  )}
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
            Are you sure you want to delete "{trainerToDelete?.name}"?
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

export default AddTrainerIndex;