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
  InputAdornment,
  Alert,
  Card,
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
import SearchIcon from "@mui/icons-material/Search";
import BookIcon from "@mui/icons-material/Book";
import PersonIcon from "@mui/icons-material/Person";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import StudentService from "../../../api/services/internal/ses-center/StudentService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";
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

// ==================== PROPTYPES ====================

const requiredLabelPropTypes = {
  children: PropTypes.node.isRequired,
};

// ==================== COMPONENTS ====================

// Custom styled component for required field label
const RequiredLabel = ({ children }) => (
  <span>
    {children}
    <span style={{ color: "red", marginLeft: "4px" }}>*</span>
  </span>
);

RequiredLabel.propTypes = requiredLabelPropTypes;

// Status list constant
const STATUS_LIST = [
  { id: 1, name: "Active", color: "#4caf50" },
  { id: 2, name: "Inactive", color: "#f44336" },
  { id: 3, name: "Graduated", color: "#2196f3" },
  { id: 4, name: "Suspended", color: "#ff9800" },
];

const AddStudentIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instituteId, setInstituteId] = useState(null);
  const [isInstituteLoaded, setIsInstituteLoaded] = useState(false);
  const [genders, setGenders] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tutorCache, setTutorCache] = useState({});

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Fetch institute details on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchInstituteDetails();
      await fetchLookupData();
      await fetchDzongkhags();
    };
    initializeData();
  }, []);

  // Fetch subjects when instituteId is available
  useEffect(() => {
    if (instituteId) {
      fetchSubjects();
    }
  }, [instituteId]);

  // Fetch students when instituteId is available
  useEffect(() => {
    if (instituteId) {
      fetchStudents();
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

  const fetchLookupData = async () => {
    try {
      const genderResponse = await CommonService.getByParentId(8);
      setGenders(
        genderResponse.data || [
          { id: 1, name: "Male" },
          { id: 2, name: "Female" },
          { id: 3, name: "Other" },
        ],
      );
    } catch (error) {
      console.error("Error fetching lookup data:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
      console.log("Dzongkhags:", dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
      toast.error("Failed to fetch dzongkhags list");
    }
  };

  const mapSubjectData = (subject) => ({
    id: subject.id ? parseInt(subject.id) : null,
    subjectCode: subject.subject_code,
    subjectName: subject.subject_name,
    creditHours: subject.credit_hours,
    theoryHours: subject.theory_hours,
    practicalHours: subject.practical_hours,
    statusId: subject.status_id ? parseInt(subject.status_id) : 1,
    description: subject.description,
    instituteId: subject.institute_id,
  });

  const fetchSubjects = async () => {
    if (!instituteId) {
      console.warn("Institute ID not available yet, skipping subjects fetch");
      return;
    }
    try {
      const response = await SubjectService.getAllSubjects(
        instituteId,
        access_token,
      );
      console.log("Subjects Response:", response);

      if (response && response.data) {
        const subjectsData = Array.isArray(response.data)
          ? response.data.map(mapSubjectData)
          : [];
        setSubjects(subjectsData);
        console.log("Mapped subjects:", subjectsData);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const fetchTutorBySubject = async (subjectId) => {
    if (!instituteId || !subjectId) {
      return null;
    }

    // Check cache first
    if (tutorCache[subjectId]) {
      return tutorCache[subjectId];
    }

    try {
      console.log(`Fetching tutor for subject ID: ${subjectId}`);
      const response = await TutorService.getTutor(
        instituteId,
        subjectId,
        access_token,
      );
      console.log(`Tutor Response for subject ${subjectId}:`, response);

      if (response && response.data && response.data.length > 0) {
        const tutorData = response.data[0];
        const tutorInfo = {
          id: tutorData.id
            ? parseInt(tutorData.id)
            : tutorData.tutor_id
              ? parseInt(tutorData.tutor_id)
              : null,
          name: `${tutorData.first_name?.trim()} ${tutorData.last_name}`,
          firstName: tutorData.first_name?.trim(),
          lastName: tutorData.last_name,
        };
        // Cache the result
        setTutorCache((prev) => ({ ...prev, [subjectId]: tutorInfo }));
        return tutorInfo;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching tutor for subject ${subjectId}:`, error);
      return null;
    }
  };

  const mapStudentData = async (student) => {
    // Parse subjects if it's a string
    let parsedSubjects = [];
    if (student.subjects) {
      parsedSubjects =
        typeof student.subjects === "string"
          ? JSON.parse(student.subjects)
          : student.subjects;
    }

    // Enrich subjects with tutor names using subjectId
    const enrichedSubjects = await Promise.all(
      parsedSubjects.map(async (subject) => {
        // Use subjectId to fetch tutor
        if (subject.subjectId) {
          const tutor = await fetchTutorBySubject(subject.subjectId);
          return {
            ...subject,
            tutorName: tutor ? tutor.name : "No tutor assigned",
            tutorId: tutor ? tutor.id : subject.tutorId,
          };
        }
        return {
          ...subject,
          tutorName: "No tutor assigned",
        };
      }),
    );

    return {
      id: student.id ? parseInt(student.id) : null,
      studentCode: student.student_code || "",
      citizenId: student.citizen_id,
      firstName: student.first_name,
      middleName: student.middle_name || "",
      lastName: student.last_name,
      email: student.email,
      mobileNo: student.mobile_no,
      dateOfBirth: student.date_of_birth,
      genderId: student.gender_id ? parseInt(student.gender_id) : null,
      dzongkhagId: student.dzongkhag_id ? parseInt(student.dzongkhag_id) : null,
      exactLocation: student.exact_location || "",
      emergencyContactName: student.emergency_contact_name,
      emergencyContactNo: student.emergency_contact_no,
      enrollmentDate: student.enrollment_date,
      currentClass: student.current_class || "",
      schoolName: student.school_name || "",
      schoolExactLocation: student.school_exact_location || "",
      subjects: enrichedSubjects,
      statusId: student.status_id ? parseInt(student.status_id) : 1,
      instituteId: student.institute_id,
      createdBy: student.created_by,
      createdAt: student.created_at,
      updatedBy: student.updated_by,
      updatedAt: student.updated_at,
    };
  };

  const fetchStudents = async () => {
    if (!instituteId) {
      console.warn("Institute ID not available yet, skipping students fetch");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching students with Institute ID:", instituteId);
      const response = await StudentService.getAllStudents(
        instituteId,
        access_token,
      );
      console.log("Students Response:", response);

      if (response && response.data) {
        const studentsData = Array.isArray(response.data)
          ? await Promise.all(response.data.map(mapStudentData))
          : [];
        setStudents(studentsData);
        console.log("Mapped students:", studentsData);
        if (studentsData.length === 0) {
          toast.info("No students found");
        }
      } else {
        setStudents([]);
        toast.warning("No students found");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(error.response?.data?.message || "Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getGenderName = (genderId) => {
    const gender = genders.find((g) => g.id === genderId);
    return gender ? gender.name : "N/A";
  };

  const getDzongkhagName = (dzongkhagId) => {
    const dzongkhag = dzongkhags.find((d) => d.id === dzongkhagId);
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  const getStatusName = (statusId) => {
    const status = STATUS_LIST.find((s) => s.id === statusId);
    return status ? status.name : "Unknown";
  };

  const getStatusColor = (statusId) => {
    const status = STATUS_LIST.find((s) => s.id === statusId);
    return status ? status.color : "#9e9e9e";
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? `${subject.subjectName} (${subject.subjectCode})` : "N/A";
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.firstName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.lastName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.studentCode?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.citizenId?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.mobileNo?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const handleView = (student) => {
    setSelectedStudent(student);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedStudent(null);
    setDialogMode("add");
    setOpenDialog(true);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setLoading(true);
    try {
      const response = await StudentService.deleteStudent(
        studentToDelete.id,
        access_token,
      );
      console.log("Delete Response:", response);

      if (response && response.status === 200) {
        const responseData = response.data;
        if (responseData?.status === "SUCCESS") {
          toast.success(
            responseData?.message || "Student deleted successfully!",
          );
        } else {
          toast.success("Student deleted successfully!");
        }
        await fetchStudents();
        setDeleteConfirmOpen(false);
        setStudentToDelete(null);
      } else {
        toast.error(response?.data?.message || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error(error.response?.data?.message || "Failed to delete student");
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setStudentToDelete(null);
  };

  const getInitialValues = () => {
    if ((dialogMode === "edit" || dialogMode === "view") && selectedStudent) {
      return {
        id: selectedStudent.id || "",
        studentCode: selectedStudent.studentCode || "",
        citizenId: selectedStudent.citizenId || "",
        firstName: selectedStudent.firstName || "",
        middleName: selectedStudent.middleName || "",
        lastName: selectedStudent.lastName || "",
        email: selectedStudent.email || "",
        mobileNo: selectedStudent.mobileNo || "",
        dateOfBirth: selectedStudent.dateOfBirth || "",
        genderId: selectedStudent.genderId || "",
        dzongkhagId: selectedStudent.dzongkhagId || "",
        exactLocation: selectedStudent.exactLocation || "",
        emergencyContactName: selectedStudent.emergencyContactName || "",
        emergencyContactNo: selectedStudent.emergencyContactNo || "",
        enrollmentDate: selectedStudent.enrollmentDate || "",
        currentClass: selectedStudent.currentClass || "",
        schoolName: selectedStudent.schoolName || "",
        schoolExactLocation: selectedStudent.schoolExactLocation || "",
        subjects: selectedStudent.subjects || [],
        statusId: selectedStudent.statusId || 1,
      };
    }
    return {
      id: "",
      studentCode: "",
      citizenId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      mobileNo: "",
      dateOfBirth: "",
      genderId: "",
      dzongkhagId: "",
      exactLocation: "",
      emergencyContactName: "",
      emergencyContactNo: "",
      enrollmentDate: new Date().toISOString().split("T")[0],
      currentClass: "",
      schoolName: "",
      schoolExactLocation: "",
      subjects: [],
      statusId: 1,
    };
  };

  const validationSchema = Yup.object().shape({
    studentCode: Yup.string().max(
      20,
      "Student code must be at most 20 characters",
    ),
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
    mobileNo: Yup.string()
      .required("Mobile number is required")
      .matches(/^[0-9+\s-]+$/, "Invalid mobile number format"),
    dateOfBirth: Yup.string().required("Date of birth is required"),
    genderId: Yup.string().required("Gender is required"),
    dzongkhagId: Yup.string().required("Dzongkhag is required"),
    exactLocation: Yup.string().required("Exact location is required"),
    emergencyContactName: Yup.string().required(
      "Emergency contact name is required",
    ),
    emergencyContactNo: Yup.string().required(
      "Emergency contact number is required",
    ),
    currentClass: Yup.string().required("Current class is required"),
    schoolName: Yup.string().required("School name is required"),
    schoolExactLocation: Yup.string().required(
      "School exact location is required",
    ),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      const subjectsArray = values.subjects.map((subject) => ({
        subjectId: parseInt(subject.subjectId),
        tutorId: subject.tutorId ? parseInt(subject.tutorId) : null,
        studentId: null,
      }));

      const payload = {
        id: dialogMode === "edit" ? values.id : null,
        studentCode: values.studentCode || null,
        citizenId: values.citizenId,
        firstName: values.firstName,
        middleName: values.middleName || "",
        lastName: values.lastName,
        email: values.email,
        mobileNo: values.mobileNo,
        dateOfBirth: values.dateOfBirth,
        genderId: parseInt(values.genderId),
        dzongkhagId: parseInt(values.dzongkhagId),
        exactLocation: values.exactLocation,
        emergencyContactName: values.emergencyContactName,
        emergencyContactNo: values.emergencyContactNo,
        enrollmentDate: values.enrollmentDate,
        currentClass: values.currentClass,
        schoolName: values.schoolName,
        schoolExactLocation: values.schoolExactLocation,
        statusId: parseInt(values.statusId),
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
        subjects: subjectsArray,
      };

      let response;

      if (dialogMode === "add") {
        response = await StudentService.submitStudent(payload, access_token);
        console.log("Submit Response:", response);

        if (response && response.status === 201) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Student created successfully!",
            );
            resetForm();
            setOpenDialog(false);
            await fetchStudents();
          } else {
            toast.error(responseData?.message || "Failed to create student");
          }
        } else if (response && response.status === 200) {
          toast.success(
            response.data?.message || "Student created successfully!",
          );
          resetForm();
          setOpenDialog(false);
          await fetchStudents();
        } else {
          toast.error(response?.data?.message || "Failed to create student");
        }
      } else if (dialogMode === "edit") {
        response = await StudentService.updateStudent(payload, access_token);
        console.log("Update Response:", response);

        if (response && response.status === 200) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Student updated successfully!",
            );
          } else {
            toast.success("Student updated successfully!");
          }
          setOpenDialog(false);
          await fetchStudents();
        } else {
          toast.error(response?.data?.message || "Failed to update student");
        }
      }
    } catch (error) {
      console.error("Error saving student:", error);
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || "Student already exists!");
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || "Student not found!");
      } else {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while saving the student",
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

  const handleSubjectChange = async (subjectId, setFieldValue, index) => {
    setFieldValue(`subjects.${index}.subjectId`, subjectId);

    const selectedSubject = subjects.find((s) => s.id === parseInt(subjectId));
    if (selectedSubject) {
      setFieldValue(
        `subjects.${index}.subjectName`,
        selectedSubject.subjectName,
      );

      const tutor = await fetchTutorBySubject(subjectId);
      if (tutor) {
        setFieldValue(`subjects.${index}.tutorId`, tutor.id);
        setFieldValue(`subjects.${index}.tutorName`, tutor.name);
      } else {
        setFieldValue(`subjects.${index}.tutorId`, "");
        setFieldValue(`subjects.${index}.tutorName`, "No tutor assigned");
      }
    }
  };

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
        Student Management
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
            placeholder="Search by Name, Student Code, Citizen ID or Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
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
            Add Student
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Student Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Citizen ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile No</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center" width={120}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((student, index) => {
                  const statusName = getStatusName(student.statusId);
                  const statusColor = getStatusColor(student.statusId);
                  const subjectsList =
                    student.subjects
                      ?.map((s) => getSubjectName(s.subjectId))
                      .join(", ") || "None";

                  return (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        {student.studentCode ? (
                          <Chip
                            label={student.studentCode}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                          >
                            {student.firstName?.charAt(0)}
                            {student.lastName?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {getFullName(
                              student.firstName,
                              student.middleName,
                              student.lastName,
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.citizenId}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                        />
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
                          <Typography variant="body2">
                            {student.email}
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
                          <PhoneIcon
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            {student.mobileNo}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.currentClass}
                          size="small"
                          variant="outlined"
                          icon={<SchoolIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={subjectsList}>
                          <Chip
                            label={`${student.subjects?.length || 0} Subjects`}
                            size="small"
                            icon={<BookIcon />}
                            variant="outlined"
                          />
                        </Tooltip>
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
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleView(student)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Student">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => handleEdit(student)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Student">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(student)}
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
                <TableCell colSpan={10} align="center">
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
          count={filteredStudents.length}
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
                  ? "Add New Student"
                  : dialogMode === "edit"
                    ? "Edit Student Details"
                    : "Student Details"}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Formik
          key={dialogMode + (selectedStudent?.id || "")}
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Student Identification */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Student Identification
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Student Code (Optional)"
                            name="studentCode"
                            size="small"
                            value={formik.values.studentCode}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.studentCode &&
                              Boolean(formik.errors.studentCode)
                            }
                            helperText={
                              formik.touched.studentCode &&
                              formik.errors.studentCode
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
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
                              formik.touched.citizenId &&
                              formik.errors.citizenId
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Personal Information */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Personal Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 4 }}>
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
                              formik.touched.firstName &&
                              formik.errors.firstName
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
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
                              formik.touched.middleName &&
                              formik.errors.middleName
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
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
                              input: { readOnly: dialogMode === "view" },
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
                              formik.touched.email &&
                              Boolean(formik.errors.email)
                            }
                            helperText={
                              formik.touched.email && formik.errors.email
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Mobile Number</RequiredLabel>}
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
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Date of Birth</RequiredLabel>}
                            name="dateOfBirth"
                            type="date"
                            size="small"
                            value={formik.values.dateOfBirth}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.dateOfBirth &&
                              Boolean(formik.errors.dateOfBirth)
                            }
                            helperText={
                              formik.touched.dateOfBirth &&
                              formik.errors.dateOfBirth
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                            InputLabelProps={{ shrink: true }}
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
                            {genders.map((gender) => (
                              <MenuItem key={gender.id} value={gender.id}>
                                {gender.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Address Information */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Address Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label={<RequiredLabel>Dzongkhag</RequiredLabel>}
                            name="dzongkhagId"
                            size="small"
                            value={formik.values.dzongkhagId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.dzongkhagId &&
                              Boolean(formik.errors.dzongkhagId)
                            }
                            helperText={
                              formik.touched.dzongkhagId &&
                              formik.errors.dzongkhagId
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          >
                            <MenuItem value="">-select dzongkhag-</MenuItem>
                            {dzongkhags.map((dzongkhag) => (
                              <MenuItem key={dzongkhag.id} value={dzongkhag.id}>
                                {dzongkhag.dzonkhagName}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={
                              <RequiredLabel>Exact Location</RequiredLabel>
                            }
                            name="exactLocation"
                            size="small"
                            multiline
                            rows={2}
                            value={formik.values.exactLocation}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.exactLocation &&
                              Boolean(formik.errors.exactLocation)
                            }
                            helperText={
                              formik.touched.exactLocation &&
                              formik.errors.exactLocation
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                            placeholder="Village, Street, House No., etc."
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Education Information */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Education Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Current Class</RequiredLabel>}
                            name="currentClass"
                            size="small"
                            value={formik.values.currentClass}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.currentClass &&
                              Boolean(formik.errors.currentClass)
                            }
                            helperText={
                              formik.touched.currentClass &&
                              formik.errors.currentClass
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                            placeholder="e.g., Class 10, Bachelor's Year 1"
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>School Name</RequiredLabel>}
                            name="schoolName"
                            size="small"
                            value={formik.values.schoolName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.schoolName &&
                              Boolean(formik.errors.schoolName)
                            }
                            helperText={
                              formik.touched.schoolName &&
                              formik.errors.schoolName
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={
                              <RequiredLabel>
                                School Exact Location
                              </RequiredLabel>
                            }
                            name="schoolExactLocation"
                            size="small"
                            value={formik.values.schoolExactLocation}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.schoolExactLocation &&
                              Boolean(formik.errors.schoolExactLocation)
                            }
                            helperText={
                              formik.touched.schoolExactLocation &&
                              formik.errors.schoolExactLocation
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                            placeholder="Dzongkhag, Village, etc."
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Emergency Contact */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Emergency Contact
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Contact Name</RequiredLabel>}
                            name="emergencyContactName"
                            size="small"
                            value={formik.values.emergencyContactName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.emergencyContactName &&
                              Boolean(formik.errors.emergencyContactName)
                            }
                            helperText={
                              formik.touched.emergencyContactName &&
                              formik.errors.emergencyContactName
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={
                              <RequiredLabel>Contact Number</RequiredLabel>
                            }
                            name="emergencyContactNo"
                            size="small"
                            value={formik.values.emergencyContactNo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.emergencyContactNo &&
                              Boolean(formik.errors.emergencyContactNo)
                            }
                            helperText={
                              formik.touched.emergencyContactNo &&
                              formik.errors.emergencyContactNo
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Subject Assignment */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Subject Assignment
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <FieldArray name="subjects">
                        {({ push, remove }) => (
                          <>
                            {formik.values.subjects.map((subject, index) => (
                              <Card key={index} sx={{ mb: 2, p: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item size={{ xs: 12, md: 5 }}>
                                    <TextField
                                      select
                                      fullWidth
                                      label={
                                        <RequiredLabel>Subject</RequiredLabel>
                                      }
                                      name={`subjects.${index}.subjectId`}
                                      size="small"
                                      value={subject.subjectId || ""}
                                      onChange={(e) => {
                                        const subjectId = e.target.value;
                                        handleSubjectChange(
                                          subjectId,
                                          formik.setFieldValue,
                                          index,
                                        );
                                      }}
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.subjects?.[index]
                                          ?.subjectId &&
                                        Boolean(
                                          formik.errors.subjects?.[index]
                                            ?.subjectId,
                                        )
                                      }
                                      helperText={
                                        formik.touched.subjects?.[index]
                                          ?.subjectId &&
                                        formik.errors.subjects?.[index]
                                          ?.subjectId
                                      }
                                      disabled={dialogMode === "view"}
                                      slotProps={{
                                        input: {
                                          readOnly: dialogMode === "view",
                                        },
                                      }}
                                    >
                                      <MenuItem value="">
                                        -select subject-
                                      </MenuItem>
                                      {subjects.map((subj) => (
                                        <MenuItem key={subj.id} value={subj.id}>
                                          {subj.subjectName} ({subj.subjectCode}
                                          )
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>
                                  <Grid item size={{ xs: 12, md: 5 }}>
                                    <TextField
                                      fullWidth
                                      label="Assigned Tutor"
                                      name={`subjects.${index}.tutorName`}
                                      size="small"
                                      value={subject.tutorName || ""}
                                      disabled={true}
                                      slotProps={{
                                        input: {
                                          readOnly: true,
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              <PersonIcon fontSize="small" />
                                            </InputAdornment>
                                          ),
                                        },
                                      }}
                                    />
                                    <input
                                      type="hidden"
                                      name={`subjects.${index}.tutorId`}
                                      value={subject.tutorId || ""}
                                    />
                                  </Grid>
                                  <Grid
                                    item
                                    size={{ xs: 12, md: 2 }}
                                    sx={{ textAlign: "center" }}
                                  >
                                    {dialogMode !== "view" && (
                                      <Tooltip title="Remove Subject">
                                        <IconButton
                                          color="error"
                                          size="small"
                                          onClick={() => remove(index)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Grid>
                                </Grid>
                              </Card>
                            ))}
                            {dialogMode !== "view" && (
                              <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                  push({
                                    subjectId: "",
                                    subjectName: "",
                                    tutorId: "",
                                    tutorName: "",
                                  })
                                }
                                size="small"
                              >
                                Add Subject
                              </Button>
                            )}
                          </>
                        )}
                      </FieldArray>
                      {formik.values.subjects.length === 0 &&
                        dialogMode !== "view" && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No subjects added yet. Click "Add Subject" to assign
                            subjects to this student.
                          </Alert>
                        )}
                    </Paper>
                  </Grid>

                  {/* Enrollment Information */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Enrollment Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Enrollment Date"
                            name="enrollmentDate"
                            type="date"
                            size="small"
                            value={formik.values.enrollmentDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.enrollmentDate &&
                              Boolean(formik.errors.enrollmentDate)
                            }
                            helperText={
                              formik.touched.enrollmentDate &&
                              formik.errors.enrollmentDate
                            }
                            slotProps={{
                              input: { readOnly: dialogMode === "view" },
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        {dialogMode !== "view" && (
                          <Grid item size={{ xs: 12, md: 6 }}>
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
                                formik.values.statusId === 1
                                  ? "Active"
                                  : "Inactive"
                              }
                            />
                          </Grid>
                        )}
                        {dialogMode === "view" && (
                          <Grid item size={{ xs: 12, md: 6 }}>
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
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
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
            {studentToDelete &&
              getFullName(
                studentToDelete.firstName,
                studentToDelete.middleName,
                studentToDelete.lastName,
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

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
AddStudentIndex.propTypes = {};

export default AddStudentIndex;
