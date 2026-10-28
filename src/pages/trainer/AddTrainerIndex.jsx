import { useState, useEffect } from "react";
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
  FormControl,
  FormLabel,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
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

// Form section heading with icon
const SectionHeader = ({ icon, title, first }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      mt: first ? 0 : 3.5,
      mb: 2,
      pb: 1,
      borderBottom: "1px solid",
      borderColor: "divider",
    }}
  >
    <Avatar
      sx={{
        width: 28,
        height: 28,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: "primary.main",
        "& svg": { fontSize: 17 },
      }}
    >
      {icon}
    </Avatar>
    <Typography variant="subtitle1" fontWeight={600}>
      {title}
    </Typography>
  </Box>
);

SectionHeader.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  first: PropTypes.bool,
};

// Small summary tile for the page header
const StatTile = ({ label, value, color }) => (
  <Box
    sx={{
      px: 2,
      py: 1,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      minWidth: 96,
    }}
  >
    <Typography
      variant="h6"
      fontWeight={700}
      sx={{ lineHeight: 1.2, color: color || "text.primary" }}
    >
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" noWrap>
      {label}
    </Typography>
  </Box>
);

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  color: PropTypes.string,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      courseName: getCourseName(course.courseTypeId, course.courseId),
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

  const fetchCourseTypes = async () => {
    try {
      const courseTypesResponse = await CommonService.getByParentId(13);
      setCourseTypes(courseTypesResponse.data);
    } catch (error) {
      console.error("Error fetching course types:", error);
      toast.error("Failed to fetch course types");
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
    setLoadingCourses(true);
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
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchNonAccreditedCourses = async () => {
    setLoadingCourses(true);
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      setNonAccreditedCourses(response.data);
    } catch (error) {
      console.error("Error fetching non-accredited courses:", error);
      toast.error("Failed to fetch non-accredited courses");
      setNonAccreditedCourses([]);
    } finally {
      setLoadingCourses(false);
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

  const getCourseName = (courseTypeId, courseId) => {
    const coursesList = getCoursesByType(courseTypeId);
    const course = coursesList.find((c) => String(c.id) === String(courseId));
    return getCourseLabel(course) || `Course ID: ${courseId}`;
  };

  // Maps the actual course type names from the API:
  //   "BQF Programme"                          -> accredited courses
  //   "Non-BQF Programme more than 140 hours"  -> non-accredited courses
  const getCoursesByType = (courseTypeValue) => {
    if (!courseTypeValue) return [];

    const selectedCourseType = courseTypes.find(
      (type) => String(type.id) === String(courseTypeValue),
    );

    if (!selectedCourseType) return [];

    const name = (selectedCourseType.name || "").trim().toLowerCase();

    // "Non-BQF" must be checked first so it is not swallowed by the "bqf" branch
    if (name.includes("non-bqf") || name.includes("non bqf")) {
      return nonAccreditedCourses;
    }
    if (name.includes("bqf")) {
      return accreditedCourses;
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
      const processedFiles = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const processedCourses = values.courses.map((course) => {
        return {
          courseTypeId: parseInt(course.courseTypeId),
          courseId: parseInt(course.courseId),
        };
      });

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
          // The service returns the axios error instead of throwing it
          toast.error(
            response?.response?.data?.message ||
              response?.data?.message ||
              "Failed to add trainer",
          );
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
          toast.error(
            response?.response?.data?.message ||
              response?.data?.message ||
              "Failed to update trainer",
          );
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
        elevation={0}
        sx={{
          p: 6,
          m: 1.25,
          textAlign: "center",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
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
        elevation={0}
        sx={{
          p: 6,
          m: 1.25,
          textAlign: "center",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading institute details...
        </Typography>
      </Paper>
    );
  }

  // Header summary
  const employmentCounts = employmentTypes
    .map((et) => ({
      name: et.name,
      count: trainers.filter(
        (t) => String(t.employmentTypeId) === String(et.id),
      ).length,
    }))
    .filter((e) => e.count > 0);
  const withCourses = trainers.filter((t) => t.courses?.length > 0).length;

  const employmentChipColor = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("full")) return "primary";
    if (n.includes("part")) return "warning";
    if (n.includes("contract")) return "info";
    return "default";
  };

  const headCellSx = {
    fontWeight: 600,
    color: "text.secondary",
    textTransform: "uppercase",
    fontSize: "0.72rem",
    letterSpacing: 0.4,
    bgcolor: "#fafafa",
    py: 0.75,
    whiteSpace: "nowrap",
  };

  // bordered, compact table (every cell outlined)
  const borderedTableSx = {
    borderCollapse: "collapse",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
      px: 1,
      fontSize: "0.8rem",
      lineHeight: 1.3,
      verticalAlign: "middle",
    },
    "& td": { py: 0.5 },
    // keep cell content compact too
    "& td .MuiTypography-body2": { fontSize: "0.8rem" },
    "& td .MuiTypography-caption": { fontSize: "0.7rem" },
    "& td .MuiChip-root": { height: 22, fontSize: "0.7rem" },
    "& td .MuiChip-icon": { fontSize: 14 },
    "& td .MuiIconButton-root": { p: 0.4 },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        m: 1.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <GroupsOutlinedIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" fontWeight={600}>
            Trainer Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register your institute&apos;s trainers and the courses they teach.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <StatTile label="Total trainers" value={trainers.length} />
          {employmentCounts.map((e) => (
            <StatTile key={e.name} label={e.name} value={e.count} />
          ))}
          <StatTile
            label="With courses"
            value={withCourses}
            color="success.main"
          />
        </Box>
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by name, CID / work permit, email, qualification or specialization"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: 1, minWidth: 260, maxWidth: 520 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleAdd}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
        >
          Add Trainer
        </Button>
      </Box>

      {/* Trainer table */}
      <TableContainer
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Table size="small" stickyHeader sx={borderedTableSx}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: 48 }}>#</TableCell>
              <TableCell sx={headCellSx}>Trainer</TableCell>
              <TableCell sx={headCellSx}>Contact</TableCell>
              <TableCell sx={headCellSx}>Qualification</TableCell>
              <TableCell sx={headCellSx} align="center">
                Experience
              </TableCell>
              <TableCell sx={headCellSx}>Employment</TableCell>
              <TableCell sx={headCellSx}>Courses</TableCell>
              <TableCell sx={{ ...headCellSx, width: 130 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainers.length > 0 ? (
              filteredTrainers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trainer, index) => (
                  <TableRow
                    key={trainer.id}
                    hover
                    sx={{ "& td": { py: 0.5 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {index + 1 + page * rowsPerPage}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: "0.72rem",
                            bgcolor: "primary.main",
                          }}
                        >
                          {getInitials(trainer.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {trainer.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {getTrainerDisplayId(trainer) || "-"}
                            {trainer.genderName
                              ? ` • ${trainer.genderName}`
                              : ""}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                      >
                        <EmailIcon
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {trainer.email || "—"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                      >
                        <PhoneIcon
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {trainer.mobileNo || "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trainer.qualificationName || "—"}
                      </Typography>
                      {trainer.specialization && (
                        <Typography variant="caption" color="text.secondary">
                          {trainer.specialization}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${trainer.workExperience || 0} yrs`}
                      />
                    </TableCell>
                    <TableCell>
                      {trainer.employmentTypeName ? (
                        <Chip
                          label={trainer.employmentTypeName}
                          size="small"
                          color={employmentChipColor(
                            trainer.employmentTypeName,
                          )}
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {trainer.courses && trainer.courses.length > 0 ? (
                        <Tooltip
                          arrow
                          title={
                            <Box>
                              {trainer.courses.map((course, idx) => (
                                <div key={idx}>
                                  {getCourseTypeName(course.courseTypeId)}:{" "}
                                  {course.courseName}
                                </div>
                              ))}
                            </Box>
                          }
                        >
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            icon={<MenuBookOutlinedIcon />}
                            label={`${trainer.courses.length} course${
                              trainer.courses.length === 1 ? "" : "s"
                            }`}
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          None assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => handleView(trainer)}
                          sx={{ color: "info.main" }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit trainer">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(trainer)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete trainer">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(trainer)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                  {loading ? (
                    <CircularProgress size={28} />
                  ) : (
                    <Box>
                      <PersonSearchOutlinedIcon
                        sx={{ fontSize: 48, color: "text.disabled" }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {search
                          ? "No trainers match your search"
                          : "No trainers registered yet"}
                      </Typography>
                      {!search && (
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleAdd}
                          sx={{ mt: 1.5, textTransform: "none" }}
                        >
                          Add your first trainer
                        </Button>
                      )}
                    </Box>
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
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
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
        <DialogTitle
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 36,
                  height: 36,
                }}
              >
                <SchoolIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
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
                <Paper elevation={0} sx={{ p: { xs: 1, md: 2 } }}>
                  {/* Identification Section */}
                  <SectionHeader icon={<BadgeOutlinedIcon />} title="Identification Information" first />
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
                  <SectionHeader icon={<PersonOutlineIcon />} title="Personal Information" />
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
                  <SectionHeader icon={<WorkOutlineIcon />} title="Professional Information" />
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
                  <SectionHeader icon={<MenuBookOutlinedIcon />} title="Course Assignment" />

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
                                        {getCourseLabel(c)}
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
                      <SectionHeader icon={<AttachFileIcon />} title="Supporting Documents" />
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
                      <SectionHeader icon={<AttachFileIcon />} title="Uploaded Documents" />
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
              <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                {dialogMode !== "view" && (
                  <Button
                    onClick={() => handleReset(formik.resetForm)}
                    startIcon={<RotateLeftIcon />}
                    disabled={loading}
                    sx={{ textTransform: "none", mr: "auto" }}
                    color="inherit"
                  >
                    Reset form
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setOpenDialog(false)}
                  disabled={loading}
                  sx={{ textTransform: "none" }}
                >
                  {dialogMode === "view" ? "Close" : "Cancel"}
                </Button>
                {dialogMode !== "view" && (
                  <>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
                      startIcon={
                        loading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                    >
                      {loading
                        ? "Saving..."
                        : dialogMode === "add"
                          ? "Save Trainer"
                          : "Update Trainer"}
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
            trainer list. You can add them again later with the same CID or
            work permit number.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "center" }}>
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
