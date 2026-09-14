import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Button,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import SchoolIcon from "@mui/icons-material/School";
import FileUpload from "../../components/file/FileUpload";
import { toast } from "react-toastify";
import CommonService from "../../api/services/internal/common/CommonService";
import CourseEnrollmentService from "../../api/services/internal/course/CourseEnrollmentService";
import DatahubService from "../../api/services/external/datahub/DatahubService";
import BcseaStudentResultService from "../../api/services/external/bcsea/BcseaStudentResultService";

// Helper function to convert file to base64
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

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Required field asterisk component
const RequiredAsterisk = () => (
  <Typography component="span" sx={{ color: "error.main", fontWeight: "bold" }}>
    *
  </Typography>
);

// Section Header Component
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "white",
        mr: 1.5,
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={600} color="primary.main">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

SectionHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

/* ---------- Validation ---------- */

const validationSchema = Yup.object({
  hasCid: Yup.string().required(),

  cidNo: Yup.string().when("hasCid", {
    is: "yes",
    then: (schema) =>
      schema
        .matches(/^[0-9]{11}$/, "Citizen ID must be exactly 11 digits")
        .required("Citizen ID No required"),
  }),

  referenceNo: Yup.string().when("hasCid", {
    is: "no",
    then: (schema) => schema.required("Reference No required"),
  }),

  name: Yup.string().when("hasCid", {
    is: "yes",
    then: (schema) => schema.required("Name required"),
    otherwise: (schema) => schema.required("Name required"),
  }),

  genderId: Yup.string().when("hasCid", {
    is: "no",
    then: (schema) => schema.required("Gender is required"),
  }),

  email: Yup.string().email("Invalid email format").required("Email required"),

  mobileNo: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile must be exactly 8 digits")
    .required("Mobile required"),

  traineeTypeId: Yup.string().required("Select trainee type"),
  employmentStatusId: Yup.string().required("Select employment status"),
  academicQualificationId: Yup.string().required("Select qualification"),

  presentDzongkhagId: Yup.string().required("Dzongkhag required"),
  presentGewogId: Yup.string().required("Gewog required"),

  // Guardian Details
  guardianName: Yup.string().required("Guardian name required"),
  guardianMobileNo: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile must be exactly 8 digits")
    .required("Guardian mobile required"),
  guardianOccupationId: Yup.string().required("Select guardian occupation"),
  guardianMaritalStatusId: Yup.string().required(
    "Select guardian marital status",
  ),

  files: Yup.array().min(1, "Please upload your academic mark sheets"),
});

/* ---------- Component ---------- */

const ApplyCourse = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [fetchingCourse, setFetchingCourse] = useState(true);
  const [fetchingCitizen, setFetchingCitizen] = useState(false);
  const [fetchingGewogs, setFetchingGewogs] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [genders, setGenders] = useState([]);
  const [traineeTypes, setTraineeTypes] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [guardianOccupations, setGuardianOccupations] = useState([]);
  const [guardianMaritalStatuses, setGuardianMaritalStatuses] = useState([]);
  const [gewogs, setGewogs] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [academicResults, setAcademicResults] = useState(null);
  const [isDataFromApi, setIsDataFromApi] = useState(false);
  const [hasCheckedAcademicData, setHasCheckedAcademicData] = useState(false);
  const [hasAcademicData, setHasAcademicData] = useState(false);

  // Academic entries state - only used for API data
  const [academicEntries, setAcademicEntries] = useState([]);

  // Define steps dynamically based on whether academic data exists
  const getSteps = () => {
    const baseSteps = ["Personal Details", "Address", "Guardian Details"];
    if (hasAcademicData) {
      return [...baseSteps, "Academic Information", "Documents"];
    }
    return [...baseSteps, "Documents"];
  };

  const steps = getSteps();

  // Fetch dzongkhags and other data on component mount
  useEffect(() => {
    fetchDzongkhags();
    fetchGenders();
    fetchTraineeType();
    fetchEmploymentStatus();
    fetchAcademicQualification();
    fetchGuardianOccupation();
    fetchGuardianMaritalStatus();
  }, []);

  // Fetch course details based on application number
  useEffect(() => {
    if (applicationNo) {
      fetchCourseDetails();
    }
  }, [applicationNo]);

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchGewogDetails = async (dzongkhagId) => {
    if (!dzongkhagId) return;

    setFetchingGewogs(true);
    try {
      const gewogLists = await CommonService.getGewogByDzongkhagId(dzongkhagId);
      setGewogs(gewogLists.data);
    } catch (error) {
      console.error("Error fetching Gewogs:", error);
      toast.error("Failed to fetch gewogs");
    } finally {
      setFetchingGewogs(false);
    }
  };

  const fetchGenders = async () => {
    try {
      const genderDt = await CommonService.getByParentId(8);
      setGenders(genderDt.data);
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchTraineeType = async () => {
    try {
      const TraineeType = await CommonService.getByParentId(21);
      setTraineeTypes(TraineeType.data);
    } catch (error) {
      console.error("Error fetching Trainee Type:", error);
    }
  };

  const fetchEmploymentStatus = async () => {
    try {
      const EmploymentStatus = await CommonService.getByParentId(17);
      setEmploymentStatuses(EmploymentStatus.data);
    } catch (error) {
      console.error("Error fetching Employment Status:", error);
    }
  };

  const fetchAcademicQualification = async () => {
    try {
      const AcademicQualification = await CommonService.getByParentId(18);
      setAcademicQualifications(AcademicQualification.data);
    } catch (error) {
      console.error("Error fetching Academic Qualification :", error);
    }
  };

  const fetchGuardianOccupation = async () => {
    try {
      const GuardianOccupation = await CommonService.getByParentId(19);
      setGuardianOccupations(GuardianOccupation.data);
    } catch (error) {
      console.error("Error fetching Guardian Occupation :", error);
    }
  };

  const fetchGuardianMaritalStatus = async () => {
    try {
      const GuardianMaritalStatus = await CommonService.getByParentId(20);
      setGuardianMaritalStatuses(GuardianMaritalStatus.data);
    } catch (error) {
      console.error("Error fetching Guardian Marital Status :", error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      setFetchingCourse(true);
      const response =
        await CommonService.getCourseAnnouncementByApplicationNo(applicationNo);
      console.log("course details :", response.data);
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(courseData);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details");
    } finally {
      setFetchingCourse(false);
    }
  };

  // Function to fetch student academic results from BCSEA
  const fetchStudentAcademicResults = async (citizenId) => {
    if (!citizenId || citizenId.length !== 11) {
      return;
    }

    setFetchingResults(true);
    setHasCheckedAcademicData(true);
    try {
      const response =
        await BcseaStudentResultService.getBcseaStudentResult(citizenId);
      console.log("BcseaStudentResult :", response.data);
      if (response.data?.studentresults?.studentresult) {
        const results = response.data.studentresults.studentresult;

        if (results && results.length > 0) {
          setAcademicResults(results);
          setIsDataFromApi(true);
          setHasAcademicData(true);
          // Auto-fill form fields with BCSEA data
          const firstResult = results[0];

          // Extract exam year from the date string
          let examYear = firstResult.examYear || "";
          if (examYear) {
            // If it contains '+', take only the date part
            if (examYear.includes("+")) {
              examYear = examYear.split("+")[0];
            }
            // If it's a full date, extract just the year
            if (examYear.match(/^\d{4}-\d{2}-\d{2}/)) {
              const year = examYear.substring(0, 4);
              // Store as date with January 1st of that year
              examYear = `${year}-01-01`;
            }
          }

          // Update academic entries with API data
          setAcademicEntries([
            {
              id: Date.now(),
              stream: firstResult.stream || "",
              schoolName: firstResult.schoolName || "",
              examYear: examYear,
              subjects: results.map((r) => ({
                name: r.subject || "",
                marks: parseInt(r.total) || 0,
                fromApi: true,
              })),
            },
          ]);

          toast.success(`Found ${results.length} subject results from BCSEA`);
        } else {
          // No academic data found
          toast.info(
            "No academic records found. Please upload academic mark sheets.",
          );
          setAcademicResults(null);
          setIsDataFromApi(false);
          setHasAcademicData(false);
          setAcademicEntries([]);
        }
      } else {
        toast.info(
          "No academic records found. Please upload academic mark sheets.",
        );
        setAcademicResults(null);
        setIsDataFromApi(false);
        setHasAcademicData(false);
        setAcademicEntries([]);
      }
    } catch (error) {
      console.error("Error fetching academic results:", error);
      toast.error(
        "Failed to fetch academic results. Please upload academic mark sheets.",
      );
      setAcademicResults(null);
      setIsDataFromApi(false);
      setHasAcademicData(false);
      setAcademicEntries([]);
    } finally {
      setFetchingResults(false);
    }
  };

  // Function to fetch citizen details from Datahub
  const fetchCitizenDetails = async (citizenId) => {
    if (!citizenId || citizenId.length !== 11) {
      return;
    }

    setFetchingCitizen(true);
    setHasCheckedAcademicData(false);
    setHasAcademicData(false);
    try {
      const response =
        await DatahubService.getDetailsByCitizenshipNo(citizenId);
      const citizenData =
        response.data?.citizenDetailsResponse?.citizenDetail?.[0];

      if (citizenData) {
        const fullName =
          `${citizenData.firstName || ""} ${citizenData.lastName || ""}`.trim();

        formik.setFieldValue("name", fullName);

        if (citizenData.gender) {
          const genderMap = {
            Male: "1",
            Female: "2",
          };
          const genderId = genderMap[citizenData.gender];
          if (genderId) {
            formik.setFieldValue("genderId", genderId);
          }
        }

        toast.success("Citizen details fetched successfully");

        // Fetch academic results from BCSEA
        await fetchStudentAcademicResults(citizenId);
      } else {
        toast.warning("No citizen found with this ID");
        formik.setFieldValue("name", "");
        formik.setFieldValue("genderId", "");
        setAcademicResults(null);
        setIsDataFromApi(false);
        setAcademicEntries([]);
        setHasCheckedAcademicData(true);
        setHasAcademicData(false);
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error("Failed to fetch citizen details");
      formik.setFieldValue("name", "");
      formik.setFieldValue("genderId", "");
      setAcademicResults(null);
      setIsDataFromApi(false);
      setAcademicEntries([]);
      setHasCheckedAcademicData(true);
      setHasAcademicData(false);
    } finally {
      setFetchingCitizen(false);
    }
  };

  // Create debounced version of fetchCitizenDetails
  const debouncedFetchCitizen = useCallback(
    debounce((citizenId) => {
      if (citizenId && citizenId.length === 11) {
        fetchCitizenDetails(citizenId);
      }
    }, 500),
    [],
  );

  // Helper function to get fields for each step
  const getStepFields = (step) => {
    const currentSteps = getSteps();
    const stepLabel = currentSteps[step];

    switch (stepLabel) {
      case "Personal Details":
        return [
          "hasCid",
          "cidNo",
          "referenceNo",
          "name",
          "genderId",
          "email",
          "mobileNo",
          "traineeTypeId",
          "employmentStatusId",
          "academicQualificationId",
        ];
      case "Address":
        return ["presentDzongkhagId", "presentGewogId"];
      case "Guardian Details":
        return [
          "guardianName",
          "guardianMobileNo",
          "guardianOccupationId",
          "guardianMaritalStatusId",
        ];
      case "Academic Information":
        return [];
      case "Documents":
        return ["files"];
      default:
        return [];
    }
  };

  // Check if a specific field is required
  const isFieldRequired = (fieldName) => {
    try {
      const field = Yup.reach(validationSchema, fieldName);
      const tests = field._exclusiveTests || {};
      return tests.required !== undefined;
    } catch {
      return false;
    }
  };

  // Check if a step is complete (all required fields filled and valid)
  const isStepComplete = (stepIndex) => {
    const currentSteps = getSteps();
    const stepLabel = currentSteps[stepIndex];

    // For documents step, check if files are uploaded
    if (stepLabel === "Documents") {
      return formik.values.files && formik.values.files.length > 0;
    }

    // For academic step, always complete (just viewing data)
    if (stepLabel === "Academic Information") {
      return true;
    }

    const fields = getStepFields(stepIndex);
    let allValid = true;

    for (const field of fields) {
      const value = formik.values[field];
      const isRequired = isFieldRequired(field);

      // Check if required field has value
      if (isRequired) {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          allValid = false;
          break;
        }
      }
      // Check if field has validation error
      if (formik.errors[field]) {
        allValid = false;
        break;
      }

      // Special handling for conditional fields
      if (field === "cidNo" && formik.values.hasCid === "yes") {
        if (!value || value.length !== 11) {
          allValid = false;
          break;
        }
      }

      if (field === "referenceNo" && formik.values.hasCid === "no") {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          allValid = false;
          break;
        }
      }

      if (field === "genderId" && formik.values.hasCid === "no") {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          allValid = false;
          break;
        }
      }
    }

    return allValid;
  };

  const formik = useFormik({
    initialValues: {
      hasCid: "yes",
      cidNo: "",
      referenceNo: "",
      name: "",
      dob: "",
      genderId: "",
      email: "",
      mobileNo: "",
      traineeTypeId: "",
      employmentStatusId: "",
      academicQualificationId: "",
      permanentDzongkhag: "",
      permanentGewog: "",
      permanentVillage: "",
      presentDzongkhagId: "",
      presentGewogId: "",
      guardianName: "",
      guardianMobileNo: "",
      guardianOccupationId: "",
      guardianMaritalStatusId: "",
      files: [],
      applicationNo: applicationNo || "",
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      // Validate files before submission
      if (!values.files || values.files.length === 0) {
        toast.error("Please upload your academic mark sheets");
        return;
      }

      setLoading(true);
      try {
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        // Format academic data for payload - matching the entity structure
        // The backend expects "traineeMarks" with "subject" and "total"
        const traineeMarks = academicEntries.flatMap((entry) =>
          entry.subjects.map((subject) => ({
            subject: subject.name || "",
            total: subject.marks ? subject.marks.toString() : "0",
          })),
        );

        // Get the first academic entry for the main fields
        const firstEntry = academicEntries.length > 0 ? academicEntries[0] : {};

        const payload = {
          applicationNo: values.applicationNo,
          cidNo: values.cidNo,
          referenceNo: values.referenceNo || null,
          name: values.name,
          dob: values.dob || null,
          email: values.email,
          mobileNo: values.mobileNo,
          genderId: values.genderId ? parseInt(values.genderId) : null,
          traineeTypeId: values.traineeTypeId
            ? parseInt(values.traineeTypeId)
            : null,
          employmentStatusId: values.employmentStatusId
            ? parseInt(values.employmentStatusId)
            : null,
          academicQualificationId: values.academicQualificationId
            ? parseInt(values.academicQualificationId)
            : null,
          presentDzongkhagId: values.presentDzongkhagId
            ? parseInt(values.presentDzongkhagId)
            : null,
          presentGewogId: values.presentGewogId
            ? parseInt(values.presentGewogId)
            : null,
          guardianName: values.guardianName,
          guardianMobileNo: values.guardianMobileNo,
          guardianMaritalStatusId: values.guardianMaritalStatusId
            ? parseInt(values.guardianMaritalStatusId)
            : null,
          guardianOccupationId: values.guardianOccupationId
            ? parseInt(values.guardianOccupationId)
            : null,
          statusId: 89,
          serviceId: 40,
          createdBy: null,
          updatedBy: null,
          examYear: firstEntry.examYear || "",
          schoolName: firstEntry.schoolName || "",
          stream: firstEntry.stream || "",
          // The backend expects "traineeMarks" with "subject" and "total"
          traineeMarks: traineeMarks,
          documents: documents,
        };

        console.log("payload : ", payload);
        const response = await CourseEnrollmentService.submitTrainee(payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Application submitted successfully!");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error submitting application:", error);
        toast.error(
          error.response?.data?.message || "Failed to submit application",
        );
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch gewogs when presentDzongkhagId changes
  useEffect(() => {
    if (formik.values.presentDzongkhagId) {
      fetchGewogDetails(formik.values.presentDzongkhagId);
    } else {
      setGewogs([]);
      formik.setFieldValue("presentGewogId", "");
    }
  }, [formik.values.presentDzongkhagId]);

  const handleNext = async () => {
    const currentSteps = getSteps();
    const fields = getStepFields(activeStep);

    // Touch all fields in current step to show validation errors
    const touchedFields = {};
    fields.forEach((field) => {
      touchedFields[field] = true;
    });
    formik.setTouched(touchedFields);

    // Validate all fields in current step
    const errors = await formik.validateForm();
    const stepErrors = fields.filter((field) => errors[field]);

    if (stepErrors.length > 0) {
      toast.error("Please fill all required fields correctly in this step");
      return;
    }

    // Check if all required fields have values (additional check)
    let hasEmptyRequired = false;
    for (const field of fields) {
      const isRequired = isFieldRequired(field);
      if (isRequired) {
        const value = formik.values[field];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          hasEmptyRequired = true;
          break;
        }
      }

      // Special validation for conditional fields
      if (field === "cidNo" && formik.values.hasCid === "yes") {
        if (!formik.values.cidNo || formik.values.cidNo.length !== 11) {
          hasEmptyRequired = true;
          break;
        }
      }

      if (field === "referenceNo" && formik.values.hasCid === "no") {
        if (
          !formik.values.referenceNo ||
          formik.values.referenceNo.trim() === ""
        ) {
          hasEmptyRequired = true;
          break;
        }
      }

      if (field === "genderId" && formik.values.hasCid === "no") {
        if (!formik.values.genderId || formik.values.genderId.trim() === "") {
          hasEmptyRequired = true;
          break;
        }
      }
    }

    if (hasEmptyRequired) {
      toast.error("Please fill all required fields in this step");
      return;
    }

    // Only validate files when we are on the Documents step
    const stepLabel = currentSteps[activeStep];
    if (stepLabel === "Documents") {
      if (!formik.values.files || formik.values.files.length === 0) {
        toast.error("Please upload your academic mark sheets");
        return;
      }
    }

    setActiveStep((prev) => Math.min(prev + 1, currentSteps.length - 1));
  };

  const handlePrevious = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  if (fetchingCourse) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const currentSteps = getSteps();

  return (
    <Box sx={{ p: { xs: 1, md: 1 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 3 },
          mx: "auto",
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary.main"
            sx={{ textAlign: "center", mb: 0.5 }}
          >
            Apply for Course
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            Please fill in all required fields marked with <RequiredAsterisk />
          </Typography>
        </Box>

        {/* Course Information Card */}
        {courseDetails && (
          <Card
            sx={{
              mb: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ color: "white", p: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Course Information
              </Typography>
              <Divider sx={{ mb: 1.5, bgcolor: "rgba(255,255,255,0.2)" }} />
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Application No
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courseDetails.application_no}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Course Name
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courseDetails.course_name}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Fees Per Trainee
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Nu. {courseDetails.fees_per_trainee}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Total Seats
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courseDetails.enrollment_capacity}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Course Period
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    fontSize="0.7rem"
                  >
                    {courseDetails.course_start_date &&
                    courseDetails.course_end_date
                      ? `${new Date(courseDetails.course_start_date).toLocaleDateString()} - ${new Date(courseDetails.course_end_date).toLocaleDateString()}`
                      : "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Stepper with completion status */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {currentSteps.map((label, index) => {
            const isCompleted = index < activeStep && isStepComplete(index);
            return (
              <Step key={label} completed={isCompleted}>
                <StepLabel>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <form onSubmit={formik.handleSubmit}>
          {/* Step 0: Applicant Details */}
          {currentSteps[activeStep] === "Personal Details" && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <SectionHeader
                icon={PersonIcon}
                title="Personal Details"
                subtitle="Enter your personal information"
              />

              <Grid container spacing={2}>
                <Grid item size={{ xs: 12 }}>
                  <FormLabel sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    Do you have a Citizen ID Number? <RequiredAsterisk />
                  </FormLabel>
                  <RadioGroup
                    row
                    name="hasCid"
                    value={formik.values.hasCid}
                    onChange={(e) => {
                      formik.handleChange(e);
                      formik.setFieldValue("cidNo", "");
                      formik.setFieldValue("referenceNo", "");
                      formik.setFieldValue("name", "");
                      formik.setFieldValue("dob", "");
                      formik.setFieldValue("genderId", "");
                      setAcademicResults(null);
                      setIsDataFromApi(false);
                      setAcademicEntries([]);
                      setHasCheckedAcademicData(false);
                      setHasAcademicData(false);
                      // Reset to first step when changing CID option
                      setActiveStep(0);
                    }}
                    sx={{ mt: 0.5 }}
                  >
                    <FormControlLabel
                      value="yes"
                      control={<Radio size="small" />}
                      label="Yes"
                    />
                    <FormControlLabel
                      value="no"
                      control={<Radio size="small" />}
                      label="No"
                    />
                  </RadioGroup>
                </Grid>

                {formik.values.hasCid === "yes" && (
                  <>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Citizen ID Number <RequiredAsterisk />
                          </>
                        }
                        name="cidNo"
                        size="small"
                        value={formik.values.cidNo}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 11) {
                            formik.setFieldValue("cidNo", value);
                            if (value.length === 11) {
                              debouncedFetchCitizen(value);
                            } else if (value.length < 11) {
                              formik.setFieldValue("name", "");
                              formik.setFieldValue("genderId", "");
                              setAcademicResults(null);
                              setIsDataFromApi(false);
                              setAcademicEntries([]);
                              setHasCheckedAcademicData(false);
                              setHasAcademicData(false);
                            }
                          }
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.cidNo && Boolean(formik.errors.cidNo)
                        }
                        helperText={formik.touched.cidNo && formik.errors.cidNo}
                        slotProps={{
                          input: {
                            endAdornment: fetchingCitizen && (
                              <CircularProgress size={18} />
                            ),
                          },
                        }}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Name <RequiredAsterisk />
                          </>
                        }
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
                            readOnly: true,
                            sx: { bgcolor: "#f5f5f5" },
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}

                {formik.values.hasCid === "no" && (
                  <>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Reference Number <RequiredAsterisk />
                          </>
                        }
                        name="referenceNo"
                        size="small"
                        value={formik.values.referenceNo}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.referenceNo &&
                          Boolean(formik.errors.referenceNo)
                        }
                        helperText={
                          formik.touched.referenceNo &&
                          formik.errors.referenceNo
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Name <RequiredAsterisk />
                          </>
                        }
                        name="name"
                        size="small"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.name && Boolean(formik.errors.name)
                        }
                        helperText={formik.touched.name && formik.errors.name}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        type="date"
                        label="Date of Birth"
                        name="dob"
                        size="small"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={formik.values.dob}
                        onChange={formik.handleChange}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Gender <RequiredAsterisk />
                          </>
                        }
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
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        {genders.map((gender) => (
                          <MenuItem
                            key={gender.id}
                            value={gender.id.toString()}
                          >
                            {gender.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </>
                )}

                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={
                      <>
                        Email Address <RequiredAsterisk />
                      </>
                    }
                    name="email"
                    size="small"
                    fullWidth
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={
                      <>
                        Mobile Number (+975) <RequiredAsterisk />
                      </>
                    }
                    name="mobileNo"
                    size="small"
                    fullWidth
                    value={formik.values.mobileNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 8) {
                        formik.setFieldValue("mobileNo", value);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                    }
                    helperText={
                      formik.touched.mobileNo && formik.errors.mobileNo
                    }
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label={
                      <>
                        Trainee Type <RequiredAsterisk />
                      </>
                    }
                    name="traineeTypeId"
                    size="small"
                    fullWidth
                    value={formik.values.traineeTypeId}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.traineeTypeId &&
                      Boolean(formik.errors.traineeTypeId)
                    }
                    helperText={
                      formik.touched.traineeTypeId &&
                      formik.errors.traineeTypeId
                    }
                  >
                    <MenuItem value="">Select Trainee Type</MenuItem>
                    {traineeTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label={
                      <>
                        Employment Status <RequiredAsterisk />
                      </>
                    }
                    name="employmentStatusId"
                    size="small"
                    fullWidth
                    value={formik.values.employmentStatusId}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.employmentStatusId &&
                      Boolean(formik.errors.employmentStatusId)
                    }
                    helperText={
                      formik.touched.employmentStatusId &&
                      formik.errors.employmentStatusId
                    }
                  >
                    <MenuItem value="">Select Employment Status</MenuItem>
                    {employmentStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label={
                      <>
                        Academic Qualification <RequiredAsterisk />
                      </>
                    }
                    name="academicQualificationId"
                    size="small"
                    fullWidth
                    value={formik.values.academicQualificationId}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.academicQualificationId &&
                      Boolean(formik.errors.academicQualificationId)
                    }
                    helperText={
                      formik.touched.academicQualificationId &&
                      formik.errors.academicQualificationId
                    }
                  >
                    <MenuItem value="">Select Qualification</MenuItem>
                    {academicQualifications.map((qualification) => (
                      <MenuItem
                        key={qualification.id}
                        value={qualification.id.toString()}
                      >
                        {qualification.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Step 1: Address */}
          {currentSteps[activeStep] === "Address" && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <SectionHeader
                icon={HomeIcon}
                title="Present Address"
                subtitle="Provide your current address details"
              />

              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label={
                      <>
                        Dzongkhag <RequiredAsterisk />
                      </>
                    }
                    name="presentDzongkhagId"
                    size="small"
                    fullWidth
                    value={formik.values.presentDzongkhagId}
                    onChange={(e) => {
                      formik.handleChange(e);
                      formik.setFieldValue("presentGewogId", "");
                    }}
                    error={
                      formik.touched.presentDzongkhagId &&
                      Boolean(formik.errors.presentDzongkhagId)
                    }
                    helperText={
                      formik.touched.presentDzongkhagId &&
                      formik.errors.presentDzongkhagId
                    }
                  >
                    <MenuItem value="">Select Dzongkhag</MenuItem>
                    {dzongkhags.map((dzongkhag) => (
                      <MenuItem
                        key={dzongkhag.id}
                        value={dzongkhag.id.toString()}
                      >
                        {dzongkhag.dzonkhagName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label={
                      <>
                        Gewog <RequiredAsterisk />
                      </>
                    }
                    name="presentGewogId"
                    size="small"
                    fullWidth
                    value={formik.values.presentGewogId}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.presentGewogId &&
                      Boolean(formik.errors.presentGewogId)
                    }
                    helperText={
                      formik.touched.presentGewogId &&
                      formik.errors.presentGewogId
                    }
                    disabled={
                      !formik.values.presentDzongkhagId || fetchingGewogs
                    }
                    slotProps={{
                      input: {
                        endAdornment: fetchingGewogs && (
                          <CircularProgress size={18} />
                        ),
                      },
                    }}
                  >
                    <MenuItem value="">Select Gewog</MenuItem>
                    {gewogs.map((gewog) => (
                      <MenuItem key={gewog.id} value={gewog.id.toString()}>
                        {gewog.gewogName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Step 2: Guardian Details */}
          {currentSteps[activeStep] === "Guardian Details" && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <SectionHeader
                icon={PeopleIcon}
                title="Guardian Details"
                subtitle="Provide your guardian's information"
              />

              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={
                      <>
                        Guardian Name <RequiredAsterisk />
                      </>
                    }
                    name="guardianName"
                    size="small"
                    value={formik.values.guardianName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.guardianName &&
                      Boolean(formik.errors.guardianName)
                    }
                    helperText={
                      formik.touched.guardianName && formik.errors.guardianName
                    }
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={
                      <>
                        Guardian Mobile Number (+975) <RequiredAsterisk />
                      </>
                    }
                    name="guardianMobileNo"
                    size="small"
                    value={formik.values.guardianMobileNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 8) {
                        formik.setFieldValue("guardianMobileNo", value);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.guardianMobileNo &&
                      Boolean(formik.errors.guardianMobileNo)
                    }
                    helperText={
                      formik.touched.guardianMobileNo &&
                      formik.errors.guardianMobileNo
                    }
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label={
                      <>
                        Guardian Occupation <RequiredAsterisk />
                      </>
                    }
                    name="guardianOccupationId"
                    size="small"
                    fullWidth
                    value={formik.values.guardianOccupationId}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.guardianOccupationId &&
                      Boolean(formik.errors.guardianOccupationId)
                    }
                    helperText={
                      formik.touched.guardianOccupationId &&
                      formik.errors.guardianOccupationId
                    }
                  >
                    <MenuItem value="">Select Occupation</MenuItem>
                    {guardianOccupations.map((occupation) => (
                      <MenuItem
                        key={occupation.id}
                        value={occupation.id.toString()}
                      >
                        {occupation.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label={
                      <>
                        Marital Status <RequiredAsterisk />
                      </>
                    }
                    name="guardianMaritalStatusId"
                    size="small"
                    fullWidth
                    value={formik.values.guardianMaritalStatusId}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.guardianMaritalStatusId &&
                      Boolean(formik.errors.guardianMaritalStatusId)
                    }
                    helperText={
                      formik.touched.guardianMaritalStatusId &&
                      formik.errors.guardianMaritalStatusId
                    }
                  >
                    <MenuItem value="">Select Marital Status</MenuItem>
                    {guardianMaritalStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Step: Academic Information (only shown if data exists) */}
          {currentSteps[activeStep] === "Academic Information" && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <SectionHeader
                icon={SchoolIcon}
                title="Academic Information"
                subtitle="Academic details from BCSEA"
              />

              {/* Show academic data if found */}
              {academicResults && academicResults.length > 0 && (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Academic records found from BCSEA. The following data has
                    been auto-filled.
                  </Alert>

                  {academicEntries.map((entry, entryIndex) => (
                    <Card
                      key={entry.id}
                      sx={{
                        mb: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              Academic Entry {entryIndex + 1}
                            </Typography>
                            <Chip
                              label="Auto-fetched from BCSEA"
                              size="small"
                              color="info"
                            />
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="School Name"
                              size="small"
                              value={entry.schoolName}
                              slotProps={{
                                input: {
                                  readOnly: true,
                                  sx: { bgcolor: "#f5f5f5" },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Stream"
                              size="small"
                              value={entry.stream}
                              slotProps={{
                                input: {
                                  readOnly: true,
                                  sx: { bgcolor: "#f5f5f5" },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Exam Year"
                              size="small"
                              value={
                                entry.examYear
                                  ? entry.examYear.substring(0, 4)
                                  : ""
                              }
                              slotProps={{
                                input: {
                                  readOnly: true,
                                  sx: { bgcolor: "#f5f5f5" },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{ mb: 2 }}
                            >
                              Subjects & Marks
                            </Typography>

                            {entry.subjects && entry.subjects.length > 0 ? (
                              <TableContainer
                                component={Paper}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                  overflow: "hidden",
                                }}
                              >
                                <Table
                                  size="small"
                                  sx={{ borderCollapse: "collapse" }}
                                >
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                      <TableCell
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "divider",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        #
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "divider",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Subject
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "divider",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Marks
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {entry.subjects.map((subject, index) => (
                                      <TableRow key={index}>
                                        <TableCell
                                          sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                          }}
                                        >
                                          {index + 1}
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                          }}
                                        >
                                          {subject.name}
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                          }}
                                        >
                                          {subject.marks}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Alert severity="warning">
                                No subjects found in the academic records.
                              </Alert>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </Paper>
          )}

          {/* Step: Documents */}
          {currentSteps[activeStep] === "Documents" && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <SectionHeader
                icon={DescriptionIcon}
                title="Supporting Documents"
                subtitle="Upload required documents"
              />

              {/* Show academic mark sheet upload if no API data */}
              {(!academicResults || academicResults.length === 0) &&
                formik.values.hasCid === "yes" &&
                formik.values.cidNo.length === 11 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Academic Mark Sheets Required
                    </Typography>
                    <Typography variant="body2">
                      Your academic records were not found in the system. Please
                      upload your academic mark sheets (PDF format, max 1 MB).
                    </Typography>
                  </Alert>
                )}

              {/* Show message for non-CID users */}
              {formik.values.hasCid === "no" && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Since you don't have a Citizen ID, please upload your
                    academic mark sheets in the Documents section.
                  </Typography>
                </Alert>
              )}

              {/* Conditional message based on whether academic data exists */}
              {academicResults && academicResults.length > 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Academic records found.</strong> Please upload any
                    additional supporting documents if required. Each file
                    should not exceed <strong>1 MB</strong>.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Please upload your academic mark sheets.</strong>{" "}
                    Each file should not exceed <strong>1 MB</strong>.
                  </Typography>
                </Alert>
              )}

              <FileUpload
                files={formik.values.files}
                onFilesChange={(files) => {
                  formik.setFieldValue("files", files);
                  formik.setFieldTouched("files", true);
                }}
                error={formik.touched.files && Boolean(formik.errors.files)}
                helperText={formik.touched.files && formik.errors.files}
              />
            </Paper>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handlePrevious}
              disabled={activeStep === 0}
              startIcon={<FastRewindIcon />}
              size="small"
              sx={{
                borderRadius: 1.5,
                bgcolor: activeStep === 0 ? "grey.400" : "primary.main",
                "&:hover": {
                  bgcolor: activeStep === 0 ? "grey.400" : "primary.dark",
                },
              }}
            >
              Previous
            </Button>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              {activeStep === currentSteps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} />
                    ) : (
                      <ArrowUpwardIcon />
                    )
                  }
                  sx={{ borderRadius: 1.5, px: 3 }}
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="small"
                  endIcon={<FastForwardIcon />}
                  sx={{ borderRadius: 1.5, px: 3 }}
                >
                  Next
                </Button>
              )}

              <Button
                type="button"
                color="error"
                variant="outlined"
                size="small"
                startIcon={<LockResetIcon />}
                onClick={() => {
                  formik.resetForm();
                  setActiveStep(0);
                  setAcademicResults(null);
                  setIsDataFromApi(false);
                  setAcademicEntries([]);
                  setHasCheckedAcademicData(false);
                  setHasAcademicData(false);
                }}
                sx={{ borderRadius: 1.5 }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ApplyCourse;
