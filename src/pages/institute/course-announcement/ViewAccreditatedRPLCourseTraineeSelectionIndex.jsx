import { useState, useEffect, useCallback } from "react";
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
  Chip,
  IconButton,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
  Autocomplete,
  Stack,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import EngineeringIcon from "@mui/icons-material/Engineering";
import { toast } from "react-toastify";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";

const ViewAccreditatedRPLCourseTraineeSelectionIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [instituteData, setInstituteData] = useState(null);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusList, setStatusList] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [currentStatusId, setCurrentStatusId] = useState(null);

  //assessors
  const [assessors, setAssessors] = useState([]);
  const [selectedAssessor, setSelectedAssessor] = useState("");
  const [assignedAssessors, setAssignedAssessors] = useState([]);
  const [listAssignedAssessors, setListAssignedAssessors] = useState([]);
  // State for CA dates (only used when they don't exist in course details)
  const [caStartDate, setCaStartDate] = useState("");
  const [caEndDate, setCaEndDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);

  // State for qualifications lookup
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});

  // State for academic competencies lookup
  const [academicCompetency, setAcademicCompetency] = useState([]);
  const [competencyMap, setCompetencyMap] = useState({});

  // State for storing theory and practical assessments (directly editable)
  const [traineeTheoryAssessments, setTraineeTheoryAssessments] = useState({});
  const [traineePracticalAssessments, setTraineePracticalAssessments] =
    useState({});

  // State for storing viva and practical assessments for service_id 39
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] =
    useState({});

  // State for storing remarks for each trainee
  const [traineeRemarks, setTraineeRemarks] = useState({});

  // State to track if all CA marks exist
  const [allCAmarksExist, setAllCAmarksExist] = useState(false);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  // Assessor delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessorToDelete, setAssessorToDelete] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // Check if CA dates exist in course details
  const hasCADatesInCourse =
    courseDetails?.ca_start_date && courseDetails?.ca_end_date;

  // Check if any trainee has internal_assessment (to determine if we need theory/practical columns)
  const [hasInternalAssessmentForCourse, setHasInternalAssessmentForCourse] =
    useState(false);

  // Check if service_id is 39 for Viva assessments
  const isServiceId39 = courseDetails?.service_id === "39";

  // Helper function to check if certification level requires numeric input (only 111 and 112)
  const isNumericCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // Check if payment is completed
  const isPaymentCompleted = () => {
    return paymentStatus && paymentStatus.paymentStatus === "paid";
  };

  // Check if CA dates are valid (when they need to be provided)
  const areCADatesValid = () => {
    if (hasCADatesInCourse) {
      return true; // CA dates already exist in course, no need to validate
    }
    // When CA dates don't exist in course, both must be provided and end date >= start date
    return (
      caStartDate && caEndDate && new Date(caEndDate) >= new Date(caStartDate)
    );
  };

  // Check if all trainees have assessment values
  const allTraineesHaveAssessments = () => {
    if (!hasInternalAssessmentForCourse) {
      return true; // No assessment columns, so validation passes
    }

    // Check if all selected trainees have assessment values
    return selectedTrainees.every((trainee) => {
      const hasInternalAssessment =
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== "";

      if (!hasInternalAssessment) {
        return true; // Skip validation for trainees without CA marks
      }

      if (isServiceId39) {
        // For service_id 39: Check Viva and Practical
        const vivaValue = traineeVivaAssessments[trainee.id];
        const practicalValue = traineeVivaPracticalAssessments[trainee.id];
        return (
          vivaValue &&
          vivaValue !== "" &&
          practicalValue &&
          practicalValue !== ""
        );
      } else {
        // For other services: Check Theory and Practical
        const theoryValue = traineeTheoryAssessments[trainee.id];
        const practicalValue = traineePracticalAssessments[trainee.id];
        return (
          theoryValue &&
          theoryValue !== "" &&
          practicalValue &&
          practicalValue !== ""
        );
      }
    });
  };

  // Check if assessors are assigned (when CA marks exist)
  const areAssessorsAssigned = () => {
    if (!allCAmarksExist) {
      return false; // If CA marks don't exist, assessors are not required yet
    }
    return assignedAssessors.length > 0 || listAssignedAssessors.length > 0;
  };

  // Check if Generate PA button should be enabled
  const isGeneratePAEnabled = () => {
    // Must have all CA marks exist
    if (!allCAmarksExist) {
      return false;
    }
    return true;
  };

  // Check if Submit (55) button should be enabled
  // Flow: CA Start Date & CA End Date must be set (when not in course)
  const isSubmitEnabled = () => {
    // Must have CA dates valid (either from course or provided)
    if (!areCADatesValid()) {
      return false;
    }
    return true;
  };

  // Check if Submit button should be shown
  const shouldShowSubmitButton = () => {
    // Show Submit button only when CA marks don't exist
    return !allCAmarksExist && currentRoleId == 9;
  };

  // Check if Approve button should be shown
  const shouldShowApproveButton = () => {
    // Approve button only shows when payment is paid
    return isPaymentCompleted() && currentRoleId == 9;
  };

  // Check if Approve button should be enabled
  // Flow: Assessors Assigned → All Assessments Filled → Approve
  const isApproveEnabled = () => {
    // 1. Must have assessors assigned
    if (!areAssessorsAssigned()) {
      return false;
    }
    // 2. Must have all assessment values filled
    if (!allTraineesHaveAssessments()) {
      return false;
    }
    // 3. Must have CA dates valid (either from course or provided)
    if (!areCADatesValid()) {
      return false;
    }
    return true;
  };

  // Check if Endorse (59) button should be enabled
  const isEndorseEnabled = () => {
    // Must have CA dates valid (either from course or provided)
    if (!areCADatesValid()) {
      return false;
    }
    // Must have payment completed
    if (!isPaymentCompleted()) {
      return false;
    }
    // Must have assessors assigned
    if (!areAssessorsAssigned()) {
      return false;
    }
    // Must have all assessment values filled
    if (!allTraineesHaveAssessments()) {
      return false;
    }
    return true;
  };

  // Get Submit validation message
  const getSubmitValidationMessage = () => {
    if (!areCADatesValid()) {
      if (!caStartDate || !caEndDate) {
        return "Please provide both CA Start Date and CA End Date";
      }
      if (new Date(caEndDate) < new Date(caStartDate)) {
        return "CA End Date cannot be earlier than CA Start Date";
      }
    }
    return "";
  };

  // Get Approve/Endorse validation message
  const getApprovalValidationMessage = () => {
    if (!areCADatesValid()) {
      return "Please provide both CA Start Date and CA End Date";
    }
    if (!areAssessorsAssigned()) {
      return "At least one assessor must be assigned before approval";
    }
    if (!allTraineesHaveAssessments()) {
      if (isServiceId39) {
        return "All trainees must have Viva and Practical assessment values";
      } else {
        return "All trainees must have Theory and Practical assessment values";
      }
    }
    return "";
  };

  // Check if assessment fields should be read-only
  const isAssessmentReadOnly = () => {
    // If payment is not completed OR role is 22, assessments should be read-only
    return !isPaymentCompleted() || currentRoleId == 22;
  };

  // Helper function to get service code based on service_id
  const getServiceCodeByServiceId = useCallback((serviceId) => {
    if (!serviceId) return null;

    // Map service_id to service codes
    const serviceCodeMap = {
      39: 100586, // RPL course
      37: 100584, // Accredited course
      // Add more mappings as needed
    };

    return serviceCodeMap[serviceId] || null;
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
    fetchAssessors();
    fetchPaymentStatus();
    fetchAssignedAssessors();
  }, []);

  // Fetch course details and selected trainees when dependencies are ready
  useEffect(() => {
    if (
      academicQualifications.length > 0 &&
      selectedStatusId &&
      academicCompetency.length > 0
    ) {
      fetchData();
    }
  }, [
    applicationNo,
    academicQualifications,
    selectedStatusId,
    academicCompetency,
  ]);

  // Fetch institute data when courseDetails is available
  useEffect(() => {
    if (courseDetails?.registration_no) {
      fetchInstituteData();
    }
  }, [courseDetails]);

  // Check CA marks whenever selectedTrainees changes
  useEffect(() => {
    checkCAmarksExist();
  }, [selectedTrainees]);

  // Populate assigned assessors when both lists are available
  useEffect(() => {
    if (listAssignedAssessors.length > 0 && assessors.length > 0) {
      const assignedAssessorsWithDetails = listAssignedAssessors
        .map((assigned) => {
          const assessorDetail = assessors.find(
            (ass) => ass.userId === assigned.user_id,
          );
          if (assessorDetail) {
            return {
              id: assessorDetail.id,
              userId: assessorDetail.userId,
              name: assessorDetail.name,
              email: assessorDetail.email,
              mobileNo: assessorDetail.mobileNo,
              designation: assessorDetail.designation || "Assessor",
              location: assessorDetail.location || "N/A",
              assignedDate: assigned.created_at || new Date().toISOString(),
              assignedBy: assigned.assigned_by || actionId,
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      setAssignedAssessors(assignedAssessorsWithDetails);
      console.log(
        "Assigned assessors with details:",
        assignedAssessorsWithDetails,
      );
    }
  }, [listAssignedAssessors, assessors]);

  const fetchAcademicQualification = async () => {
    try {
      const response = await CommonService.getByParentId(18);
      const qualifications = response.data;
      setAcademicQualifications(qualifications);

      // Create a map for quick lookup
      const map = {};
      qualifications.forEach((qual) => {
        map[qual.id] = qual.name;
      });
      setQualificationMap(map);
    } catch (error) {
      console.error("Error fetching academic qualifications:", error);
    }
  };

  const fetchAcademicCompetency = async () => {
    try {
      const response = await CommonService.getByParentId(22);
      const competencies = response.data;
      setAcademicCompetency(competencies);

      // Create a map for competency lookup
      const map = {};
      competencies.forEach((comp) => {
        map[comp.id] = comp.name;
      });
      setCompetencyMap(map);
      console.log("Academic Competencies:", competencies);
    } catch (error) {
      console.error("Error fetching academic competencies:", error);
    }
  };

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      const statuses = statusResponse.data;
      setStatusList(statuses);

      // Find status ID for 'selected'
      const selectedStatus = statuses.find(
        (status) => status.name.toLowerCase() === "selected",
      );

      if (selectedStatus) {
        setSelectedStatusId(selectedStatus.id);
      } else {
        console.error("Selected status not found in status list");
      }
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchCourseDetails(), fetchSelectedTrainees()]);
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await CommonService.getCourseAnnouncementByApplicationNo(applicationNo);
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(courseData);
      setCurrentStatusId(courseData?.status_id);
      console.log("course details", response.data);
      // Only set CA dates in state if they DON'T exist in course details
      if (!courseData?.ca_start_date) {
        setCaStartDate("");
      }
      if (!courseData?.ca_end_date) {
        setCaEndDate("");
      }

      console.log("Course Details:", courseData);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const fetchAssessors = async () => {
    try {
      const response =
        await UserRoleManagementService.getRegisteredAssessors(access_token);
      // Map the API response to the format expected by the component
      const mappedAssessors = response.data.map((assessor) => ({
        id: assessor.id,
        userId: assessor.user_id,
        name: `${assessor.first_name} ${assessor.middle_name ? assessor.middle_name + " " : ""}${assessor.last_name}`,
        email: assessor.email_id,
        mobileNo: assessor.mobile_no,
        designation: assessor.current_role || "Assessor",
        location: assessor.location_id || "N/A",
      }));
      setAssessors(mappedAssessors);
      console.log("Assessor fetched:", mappedAssessors);
    } catch (error) {
      console.error("Error fetching Assessor:", error);
      setAssessors([]);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);
      setPaymentStatus(response.data);
      console.log("Payment status fetched:", response.data);
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setPaymentStatus(null);
    }
  };

  const fetchAssignedAssessors = async () => {
    try {
      const response = await CourseEnrollmentService.fetchAssignedAssessors(
        applicationNo,
        access_token,
      );
      setListAssignedAssessors(response.data);
      console.log("List of Assigned assessors fetched:", response.data);
    } catch (error) {
      console.error("Error fetching assigned assessors:", error);
      setListAssignedAssessors([]);
    }
  };

  const fetchInstituteData = async () => {
    try {
      if (!courseDetails?.registration_no) {
        console.log("No registration number available yet");
        return;
      }
      const response = await InstituteRegistrationService.getInstituteDetails(
        courseDetails.registration_no,
      );
      // Check if response.data is an array and get the first element
      const data =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;
      setInstituteData(data);
      console.log("Institute data fetched:", data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
      setInstituteData(null);
    }
  };

  const fetchSelectedTrainees = async () => {
    try {
      setLoading(true);
      const response =
        await CourseEnrollmentService.getCourseAppliedTraineesByApplicationNo(
          applicationNo,
        );

      const trainees = response.data || [];
      console.log("Fetched trainees:", trainees);
      // Filter only selected trainees
      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setSelectedTrainees(selected);

      // Check if any trainee has internal_assessment
      const hasInternal = selected.some(
        (trainee) =>
          trainee.internal_assessment !== null &&
          trainee.internal_assessment !== "",
      );
      setHasInternalAssessmentForCourse(hasInternal);

      // Initialize theory and practical assessments from API data
      const initialTheory = {};
      const initialPractical = {};
      const initialViva = {};
      const initialVivaPractical = {};
      const initialRemarks = {};

      selected.forEach((trainee) => {
        initialTheory[trainee.id] = trainee.theory_assessment || "";
        initialPractical[trainee.id] = trainee.practical_assessment || "";
        initialViva[trainee.id] = trainee.viva_assessment || "";
        initialVivaPractical[trainee.id] =
          trainee.viva_practical_assessment || "";
        initialRemarks[trainee.id] = trainee.remarks || "";
      });

      setTraineeTheoryAssessments(initialTheory);
      setTraineePracticalAssessments(initialPractical);
      setTraineeVivaAssessments(initialViva);
      setTraineeVivaPracticalAssessments(initialVivaPractical);
      setTraineeRemarks(initialRemarks);

      // Check CA marks existence
      const allHaveCA = selected.every(
        (trainee) =>
          trainee.internal_assessment !== null &&
          trainee.internal_assessment !== "" &&
          trainee.internal_assessment !== undefined,
      );
      setAllCAmarksExist(allHaveCA);
    } catch (error) {
      console.error("Error fetching selected trainees:", error);
      toast.error("Failed to fetch selected trainees");
    } finally {
      setLoading(false);
    }
  };

  // Function to check if all selected trainees have CA marks
  const checkCAmarksExist = () => {
    if (selectedTrainees.length === 0) {
      setAllCAmarksExist(false);
      return;
    }

    // Check if all trainees have internal_assessment (CA marks)
    const allHaveCA = selectedTrainees.every(
      (trainee) =>
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== "" &&
        trainee.internal_assessment !== undefined,
    );

    setAllCAmarksExist(allHaveCA);
  };

  // Assessor handlers
  const handleAddAssessor = () => {
    if (!selectedAssessor) {
      toast.error("Please select an assessor to add");
      return;
    }

    // Check if assessor is already added
    if (
      assignedAssessors.some(
        (ass) => ass.id.toString() === selectedAssessor.toString(),
      )
    ) {
      toast.error("This assessor is already assigned");
      return;
    }

    // Find selected assessor details
    const selectedAssessorDetails = assessors.find(
      (ass) => ass.id.toString() === selectedAssessor.toString(),
    );

    if (!selectedAssessorDetails) {
      toast.error("Selected assessor not found");
      return;
    }

    // Create assignment record
    const assignmentRecord = {
      id: selectedAssessorDetails.id,
      userId: selectedAssessorDetails.userId,
      name: selectedAssessorDetails.name,
      email: selectedAssessorDetails.email,
      mobileNo: selectedAssessorDetails.mobileNo,
      designation: selectedAssessorDetails.designation || "Assessor",
      location: selectedAssessorDetails.location || "N/A",
      assignedDate: new Date().toISOString(),
      assignedBy: actionId,
    };

    setAssignedAssessors((prev) => [...prev, assignmentRecord]);
    toast.success(`${selectedAssessorDetails.name} added successfully`);
    setSelectedAssessor("");
  };

  const openDeleteAssessorDialog = (assessor) => {
    setAssessorToDelete(assessor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAssessor = () => {
    if (assessorToDelete) {
      setAssignedAssessors((prev) =>
        prev.filter((ass) => ass.id !== assessorToDelete.id),
      );
      toast.info(`${assessorToDelete.name} has been removed`);
      setDeleteDialogOpen(false);
      setAssessorToDelete(null);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAssessorToDelete(null);
  };

  // Handle theory assessment change
  const handleTheoryAssessmentChange = (traineeId, value) => {
    setTraineeTheoryAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // Handle practical assessment change
  const handlePracticalAssessmentChange = (traineeId, value) => {
    setTraineePracticalAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // Handle viva assessment change for service_id 39
  const handleVivaAssessmentChange = (traineeId, value) => {
    setTraineeVivaAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // Handle viva practical assessment change for service_id 39
  const handleVivaPracticalAssessmentChange = (traineeId, value) => {
    setTraineeVivaPracticalAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (traineeId, value) => {
    setTraineeRemarks((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // Handle Generate PA
  const handleGeneratePA = () => {
    if (!courseDetails) {
      toast.error("Course data not found");
      return;
    }

    // Get institute data (handle both array and object)
    const institute =
      Array.isArray(instituteData) && instituteData.length > 0
        ? instituteData[0]
        : instituteData;

    // Get mobile and email from institute data if available, otherwise from course details
    const taxPayerEmail =
      institute?.email_id || courseDetails.institute_email || "N/A";
    const taxPayerMobileNo =
      institute?.mobile_no || courseDetails.institue_mobile_number || "N/A";
    const instituteId =
      institute?.institute_id || courseDetails.registration_no || "N/A";

    // Prepare the data for BIRMS payment
    const applicationNo = courseDetails.application_no;

    // Determine service code based on service_id
    const serviceCode = getServiceCodeByServiceId(courseDetails?.service_id);

    if (!serviceCode) {
      toast.error("Unsupported service for payment generation");
      return;
    }

    const taxPayerNo = courseDetails.registration_no || "N/A";
    const taxPayerName = courseDetails.institute_name || "N/A";

    // Navigate to BIRMS payment page
    navigate(
      `/birms/common-payment-index/${applicationNo}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  };

  // Function to handle redirect to payment
  const handleRedirectToPayment = (redirectUrl) => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      toast.error("No redirect URL available");
    }
  };

  // Helper function to get qualification name from ID
  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    return qualificationMap[qualificationId] || qualificationId;
  };

  // Helper function to get competency name from ID
  const getCompetencyName = (competencyId) => {
    if (!competencyId) return "N/A";
    return competencyMap[competencyId] || competencyId;
  };

  // Helper function to get status name from ID
  const getStatusName = (statusId) => {
    if (!statusId) return "Unknown";
    const status = statusList.find((s) => s.id === parseInt(statusId));
    return status ? status.name : "Unknown";
  };

  // Helper function to get status color
  const getStatusColor = (statusId) => {
    const statusName = getStatusName(statusId).toLowerCase();
    if (statusName === "selected" || statusName === "approved") {
      return { bgcolor: "#4caf50", color: "white" };
    } else if (statusName === "pending" || statusName === "submitted") {
      return { bgcolor: "#ff9800", color: "white" };
    } else if (statusName === "rejected") {
      return { bgcolor: "#f44336", color: "white" };
    } else if (statusName === "verified") {
      return { bgcolor: "#2196f3", color: "white" };
    }
    return { bgcolor: "#9e9e9e", color: "white" };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleAction = async () => {
    // StatusId 55 = Submit, 57 = Approve, 58 = Reject, 59 = Endorse
    if (currentAction === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      // Prepare the payload with SelectedTraineedto structure
      const payload = {
        applicationNo: applicationNo,
        statusId: currentAction,
        certificationlevelId: courseDetails?.certification_level_id,
        courseName: courseDetails?.course_name,
        serviceId: courseDetails?.service_id
          ? parseInt(courseDetails.service_id)
          : null,
        assignedRoleId: currentRoleId,
        remarks:
          currentAction === 58 ? remarks : remarks || "Application submitted",
      };

      // Only add CA dates to payload if they DON'T exist in course details
      // and user has provided them
      if (!hasCADatesInCourse) {
        if (caStartDate && caEndDate) {
          payload.caStartDate = caStartDate;
          payload.caEndDate = caEndDate;
        }
      }

      // Prepare traineeMarks list (TraineeMarksdto format) for trainees with internal_assessment
      if (hasInternalAssessmentForCourse) {
        const traineeMarksList = selectedTrainees
          .filter(
            (trainee) =>
              trainee.internal_assessment !== null &&
              trainee.internal_assessment !== "",
          )
          .map((trainee) => ({
            traineeId: parseInt(trainee.id),
            theoryAssessment:
              isNumericCertificationLevel() && !isServiceId39
                ? traineeTheoryAssessments[trainee.id]
                  ? parseInt(traineeTheoryAssessments[trainee.id])
                  : null
                : traineeTheoryAssessments[trainee.id] || null,
            practicalAssessment:
              isNumericCertificationLevel() && !isServiceId39
                ? traineePracticalAssessments[trainee.id]
                  ? parseInt(traineePracticalAssessments[trainee.id])
                  : null
                : traineePracticalAssessments[trainee.id] || null,
            remarks: traineeRemarks[trainee.id] || null,
          }));

        if (traineeMarksList.length > 0) {
          payload.traineeMarks = traineeMarksList;
        }
      }

      // Prepare traineeVivaAssessments list for service_id 39
      if (isServiceId39 && hasInternalAssessmentForCourse) {
        const traineeVivaList = selectedTrainees
          .filter(
            (trainee) =>
              trainee.internal_assessment !== null &&
              trainee.internal_assessment !== "",
          )
          .map((trainee) => ({
            traineeId: parseInt(trainee.id),
            vivaAssessment: traineeVivaAssessments[trainee.id]
              ? parseInt(traineeVivaAssessments[trainee.id])
              : null,
            practicalAssessment: traineeVivaPracticalAssessments[trainee.id]
              ? parseInt(traineeVivaPracticalAssessments[trainee.id])
              : null,
            remarks: traineeRemarks[trainee.id] || null,
          }));

        if (traineeVivaList.length > 0) {
          payload.traineeVivaAssessments = traineeVivaList;
        }
      }

      // Add assigned assessors to payload
      if (assignedAssessors.length > 0) {
        payload.assignedAssessors = assignedAssessors.map((ass) => ({
          userId: ass.userId,
        }));
      }

      console.log("Final payload:", payload);

      // Call the API to update the application with marks
      const response = await CourseEnrollmentService.updateTraineeApplication(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        const actionName =
          currentAction === 55
            ? "submitted"
            : currentAction === 57
              ? "approved"
              : currentAction === 59
                ? "endorsed"
                : "rejected";
        toast.success(`Course selection ${actionName} successfully!`);
        closeDialog();
        await fetchData();
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error(`Error updating course selection:`, error);
      toast.error(
        error.response?.data?.message || `Failed to update course selection`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (action) => {
    setCurrentAction(action);
    setRemarks("");
    setRemarksError("");
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setCurrentAction(null);
    setRemarks("");
    setRemarksError("");
  };

  const isActionDisabled = () => {
    const statusId = currentStatusId;
    // StatusId 55 = Submitted, 57 = Approved, 58 = Rejected, 59 = Endorsed
    return (
      statusId === 55 || statusId === 57 || statusId === 58 || statusId === 59
    );
  };

  const getDialogTitle = () => {
    if (currentAction === 55) return "Submit Course Selection";
    if (currentAction === 57) return "Approve Course Selection";
    if (currentAction === 59) return "Endorse Course Selection";
    return "Reject Course Selection";
  };

  // FIXED: Simplified the dialog content to reduce duplication
  const getDialogContent = () => {
    // Common content for non-reject actions
    const getCommonContent = (actionText) => (
      <DialogContentText>
        Are you sure you want to {actionText} this course selection?
        <br />
        <strong>Application No: {applicationNo}</strong>
        <br />
        <strong>Course Name: {courseDetails?.course_name}</strong>
        <br />
        <strong>Total Selected Trainees: {selectedTrainees.length}</strong>
        {paymentStatus && paymentStatus.paymentAdviceNo && (
          <>
            <br />
            <strong>Payment Advice No: {paymentStatus.paymentAdviceNo}</strong>
          </>
        )}
        {!hasCADatesInCourse && caStartDate && caEndDate && (
          <>
            <br />
            <strong>CA Start Date: {formatDate(caStartDate)}</strong>
            <br />
            <strong>CA End Date: {formatDate(caEndDate)}</strong>
          </>
        )}
        {hasInternalAssessmentForCourse && (
          <>
            <br />
            <br />
            <strong>
              Note:{" "}
              {isServiceId39 ? "Viva and Practical" : "Theory and Practical"}{" "}
              {actionText === "submit"
                ? "values will be saved"
                : "assessments will be saved"}{" "}
              with this {actionText}.
            </strong>
          </>
        )}
        {assignedAssessors.length > 0 && (
          <>
            <br />
            <br />
            <strong>Assigned Assessors: {assignedAssessors.length}</strong>
          </>
        )}
      </DialogContentText>
    );

    if (currentAction === 55) {
      return getCommonContent("submit");
    } else if (currentAction === 57) {
      return getCommonContent("approve");
    } else if (currentAction === 59) {
      return getCommonContent("endorse");
    } else {
      // Reject action - requires remarks
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this course selection:
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>Course Name: {courseDetails?.course_name}</strong>
            <br />
            <strong>Total Selected Trainees: {selectedTrainees.length}</strong>
            {paymentStatus && paymentStatus.paymentAdviceNo && (
              <>
                <br />
                <strong>
                  Payment Advice No: {paymentStatus.paymentAdviceNo}
                </strong>
              </>
            )}
            {!hasCADatesInCourse && caStartDate && caEndDate && (
              <>
                <br />
                <strong>CA Start Date: {formatDate(caStartDate)}</strong>
                <br />
                <strong>CA End Date: {formatDate(caEndDate)}</strong>
              </>
            )}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            fullWidth
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setRemarksError("");
            }}
            error={!!remarksError}
            helperText={remarksError}
            required
          />
        </>
      );
    }
  };

  const getConfirmButtonColor = () => {
    if (currentAction === 55) return "primary";
    if (currentAction === 57) return "success";
    if (currentAction === 59) return "info";
    return "error";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    if (currentAction === 55) return "Confirm Submit";
    if (currentAction === 57) return "Confirm Approve";
    if (currentAction === 59) return "Confirm Endorse";
    return "Confirm Reject";
  };

  const handleRefresh = () => {
    fetchData();
    fetchPaymentStatus();
    toast.info("Data refreshed");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Filter selected trainees based on search
  const filteredTrainees = selectedTrainees.filter(
    (trainee) =>
      trainee.applicant_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trainee.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.mobile_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.cid_no?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
      padding: "8px",
    },
    "& th": {
      fontWeight: 600,
    },
  };

  // Calculate total number of columns for the table
  const getTableColSpan = () => {
    let cols = 7; // #, name, cid, contact, email, qualification, status
    if (hasCADatesInCourse) cols++;
    if (hasInternalAssessmentForCourse) {
      if (isServiceId39) {
        cols += 2; // viva and practical for service_id 39
      } else {
        cols += 2; // theory and practical for other services
      }
      cols++; // remarks column
      if (isNumericCertificationLevel() && !isServiceId39) {
        cols++; // total column for level 111/112
      }
    }
    return cols;
  };

  // Get available assessors (not yet assigned)
  const availableAssessors = assessors.filter(
    (ass) => !assignedAssessors.some((assigned) => assigned.id === ass.id),
  );

  // Get selected assessor details
  const selectedAssessorDetails = assessors.find(
    (ass) => ass.id.toString() === selectedAssessor?.toString(),
  );

  if (loading && !courseDetails && selectedTrainees.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 2 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" gutterBottom>
          Trainee Selection
        </Typography>
        <Box>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            title="Refresh"
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleGoBack} color="secondary" title="Go Back">
            <ArrowBackIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Payment Status Card */}
      {paymentStatus && (
        <Card
          sx={{ mb: 3, bgcolor: isPaymentCompleted() ? "#e8f5e9" : "#fff3e0" }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Payment Status
              </Typography>
              <Chip
                label={paymentStatus.paymentStatus || "Pending"}
                color={isPaymentCompleted() ? "success" : "warning"}
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {paymentStatus.paymentAdviceNo && (
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Advice No:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentStatus.paymentAdviceNo}
                  </Typography>
                </Grid>
              )}
              {paymentStatus.refNo && (
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Reference No:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentStatus.refNo}
                  </Typography>
                </Grid>
              )}
              {paymentStatus.totalPayableAmount && (
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Amount:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    Nu. {paymentStatus.totalPayableAmount}
                  </Typography>
                </Grid>
              )}
              {paymentStatus.paymentDueDate && (
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Due Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatDate(paymentStatus.paymentDueDate)}
                  </Typography>
                </Grid>
              )}
              {paymentStatus.paymentMode && (
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Mode:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentStatus.paymentMode}
                  </Typography>
                </Grid>
              )}
              {paymentStatus.platform && (
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Platform:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentStatus.platform}
                  </Typography>
                </Grid>
              )}
            </Grid>
            {/* Only show Proceed to Payment button if payment is NOT completed */}
            {paymentStatus.redirectUrl && !isPaymentCompleted() && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<PaymentIcon />}
                  onClick={() =>
                    handleRedirectToPayment(paymentStatus.redirectUrl)
                  }
                >
                  Proceed to Payment
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Course Information Card */}
      {courseDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Course Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Application No:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {courseDetails.application_no}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Course Name:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {courseDetails.course_name}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {courseDetails.enrollment_capacity}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Selected Count:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="green">
                  {selectedTrainees.length}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Fees Per Trainee
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Nu. {courseDetails.fees_per_trainee}
                </Typography>
              </Grid>
              {/* Show CA dates from course details if they exist */}
              {courseDetails.ca_start_date && (
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    CA Start Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatDate(courseDetails.ca_start_date)}
                  </Typography>
                </Grid>
              )}
              {courseDetails.ca_end_date && (
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    CA End Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatDate(courseDetails.ca_end_date)}
                  </Typography>
                </Grid>
              )}
              {/* Certification Level */}
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Certification Level:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {courseDetails.certification_name}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* CA Dates Section - Only show if CA dates don't exist in course details */}
      {!hasCADatesInCourse && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Competency Assessment (CA) Schedule
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  type="date"
                  fullWidth
                  label="CA Start Date"
                  name="caStartDate"
                  size="small"
                  value={caStartDate}
                  onChange={(e) => setCaStartDate(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  disabled={isActionDisabled()}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  type="date"
                  fullWidth
                  label="CA End Date"
                  name="caEndDate"
                  size="small"
                  value={caEndDate}
                  onChange={(e) => setCaEndDate(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      inputProps: {
                        min: caStartDate || undefined,
                      },
                    },
                  }}
                  disabled={isActionDisabled()}
                />
              </Grid>
            </Grid>
            {caStartDate &&
              caEndDate &&
              new Date(caEndDate) < new Date(caStartDate) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  CA End Date cannot be earlier than CA Start Date
                </Alert>
              )}
          </CardContent>
        </Card>
      )}

      {/* Assessor Assignment Section - Only show when all CA marks exist */}
      {allCAmarksExist && !isActionDisabled() && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EngineeringIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Assign Assessors
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Selected Assessors Display */}
            {assignedAssessors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Assigned Assessors ({assignedAssessors.length}):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {assignedAssessors.map((ass) => (
                    <Chip
                      key={ass.id}
                      label={`${ass.name} (${ass.userId})`}
                      color="success"
                      onDelete={
                        currentRoleId == 9
                          ? () => openDeleteAssessorDialog(ass)
                          : undefined
                      }
                      deleteIcon={
                        currentRoleId == 9 ? (
                          <DeleteIcon sx={{ color: "#d32f2f" }} />
                        ) : undefined
                      }
                      sx={{
                        mb: 1,
                        "& .MuiChip-deleteIcon": {
                          color: "#d32f2f",
                          "&:hover": {
                            color: "#b71c1c",
                          },
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Add Assessor Section - Only for Role 9 */}
            {currentRoleId == 9 && (
              <Grid container spacing={2} alignItems="center">
                <Grid item size={{ xs: 12, md: 8 }}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={availableAssessors}
                    getOptionLabel={(option) =>
                      `${option.name} (${option.userId})`
                    }
                    value={selectedAssessorDetails || null}
                    onChange={(event, newValue) => {
                      setSelectedAssessor(newValue ? newValue.id : "");
                    }}
                    filterOptions={(options, state) => {
                      const searchTerm = state.inputValue.toLowerCase().trim();
                      if (!searchTerm || searchTerm.length < 2) {
                        return [];
                      }
                      return options.filter(
                        (option) =>
                          option.name.toLowerCase().includes(searchTerm) ||
                          option.userId?.toLowerCase().includes(searchTerm) ||
                          option.email?.toLowerCase().includes(searchTerm) ||
                          option.mobileNo?.includes(searchTerm),
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Assessor by Name or User ID"
                        placeholder="Type at least 2 characters to search..."
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            User ID: {option.userId} | Email:{" "}
                            {option.email || "N/A"} | Mobile:{" "}
                            {option.mobileNo || "N/A"}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText="No assessors available"
                    loadingText="Loading..."
                    disabled={availableAssessors.length === 0}
                    openOnFocus={false}
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    startIcon={<PersonAddIcon />}
                    onClick={handleAddAssessor}
                    disabled={
                      !selectedAssessor || availableAssessors.length === 0
                    }
                    sx={{
                      fontWeight: 600,
                      textTransform: "none",
                      width: "100%",
                    }}
                  >
                    Add Assessor
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* For Role 22 - Show message that assessors are already assigned */}
            {currentRoleId == 22 && assignedAssessors.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Assessors have been assigned. You cannot add or remove
                assessors.
              </Alert>
            )}

            {selectedAssessor &&
              selectedAssessorDetails &&
              currentRoleId == 9 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Selected Assessor Details:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedAssessorDetails.name}
                      </Typography>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        User ID
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedAssessorDetails.userId}
                      </Typography>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedAssessorDetails.email || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Mobile No
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedAssessorDetails.mobileNo || "N/A"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

            {assignedAssessors.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Required:</strong> At least one assessor must be
                assigned before approval.
              </Alert>
            )}

            {assessors.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No assessors found. Please check if there are active assessor
                users in the system.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Trainees Table */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            Selected Trainees
            <Chip
              label={filteredTrainees.length}
              size="small"
              color="success"
            />
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TextField
            label="Search Trainees"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Search by name, CID, email, or phone..."
          />

          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" sx={tableStyle} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>CID/ReferNo</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Qualification</TableCell>
                  <TableCell>Status</TableCell>
                  {hasCADatesInCourse && (
                    <TableCell>CA Mark/Competency</TableCell>
                  )}
                  {hasInternalAssessmentForCourse && (
                    <>
                      <TableCell>
                        {isServiceId39
                          ? "Viva Assessment"
                          : "Theory Assessment"}
                      </TableCell>
                      <TableCell>Practical Assessment</TableCell>
                      {isNumericCertificationLevel() && !isServiceId39 && (
                        <TableCell>Total</TableCell>
                      )}
                      <TableCell>Remarks</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrainees.length > 0 ? (
                  filteredTrainees
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((trainee, index) => {
                      const hasInternalAssessment =
                        trainee.internal_assessment !== null &&
                        trainee.internal_assessment !== "";

                      const readOnly = isAssessmentReadOnly();

                      const theoryValue =
                        isNumericCertificationLevel() && !isServiceId39
                          ? parseInt(traineeTheoryAssessments[trainee.id]) || 0
                          : 0;
                      const practicalValue =
                        isNumericCertificationLevel() && !isServiceId39
                          ? parseInt(traineePracticalAssessments[trainee.id]) ||
                            0
                          : 0;
                      const totalValue = theoryValue + practicalValue;

                      // Show tooltip when read-only due to role 22
                      const getReadOnlyTooltip = () => {
                        if (currentRoleId == 22) {
                          return "Assessment fields are read-only for Endorser role";
                        }
                        if (!isPaymentCompleted()) {
                          return "Payment must be completed to edit assessment";
                        }
                        return "";
                      };

                      return (
                        <TableRow key={trainee.id} hover>
                          <TableCell>
                            {index + 1 + page * rowsPerPage}
                          </TableCell>
                          <TableCell>{trainee.applicant_name}</TableCell>
                          <TableCell>
                            {trainee.cid_no || trainee.reference_no}
                          </TableCell>
                          <TableCell>{trainee.mobile_no}</TableCell>
                          <TableCell>{trainee.email_id}</TableCell>
                          <TableCell>
                            {getQualificationName(
                              trainee.academic_qualification_id,
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusName(trainee.status_id)}
                              size="small"
                              sx={getStatusColor(trainee.status_id)}
                            />
                          </TableCell>
                          {hasCADatesInCourse && (
                            <TableCell>
                              {isNumericCertificationLevel() ? (
                                <Chip
                                  label={trainee.internal_assessment || "N/A"}
                                  size="small"
                                  color="info"
                                />
                              ) : (
                                <Chip
                                  label={
                                    getCompetencyName(
                                      trainee.internal_assessment,
                                    ) || "N/A"
                                  }
                                  size="small"
                                  color="info"
                                />
                              )}
                            </TableCell>
                          )}
                          {hasInternalAssessmentForCourse && (
                            <>
                              {/* Theory/Viva Assessment Column */}
                              <TableCell>
                                {hasInternalAssessment ? (
                                  isNumericCertificationLevel() ? (
                                    isServiceId39 ? (
                                      <Tooltip
                                        title={getReadOnlyTooltip()}
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={
                                            traineeVivaAssessments[
                                              trainee.id
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            handleVivaAssessmentChange(
                                              trainee.id,
                                              e.target.value,
                                            )
                                          }
                                          fullWidth
                                          slotProps={{
                                            input: {
                                              readOnly: readOnly,
                                              inputProps: { min: 0, max: 100 },
                                            },
                                          }}
                                          sx={{
                                            minWidth: 100,
                                            backgroundColor: readOnly
                                              ? "#f5f5f5"
                                              : "transparent",
                                          }}
                                        />
                                      </Tooltip>
                                    ) : (
                                      <Tooltip
                                        title={getReadOnlyTooltip()}
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={
                                            traineeTheoryAssessments[
                                              trainee.id
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            handleTheoryAssessmentChange(
                                              trainee.id,
                                              e.target.value,
                                            )
                                          }
                                          fullWidth
                                          slotProps={{
                                            input: {
                                              readOnly: readOnly,
                                              inputProps: { min: 0, max: 100 },
                                            },
                                          }}
                                          sx={{
                                            minWidth: 100,
                                            backgroundColor: readOnly
                                              ? "#f5f5f5"
                                              : "transparent",
                                          }}
                                        />
                                      </Tooltip>
                                    )
                                  ) : (
                                    <Tooltip title={getReadOnlyTooltip()} arrow>
                                      <FormControl
                                        size="small"
                                        fullWidth
                                        sx={{ minWidth: 130 }}
                                      >
                                        <Select
                                          value={
                                            isServiceId39
                                              ? traineeVivaAssessments[
                                                  trainee.id
                                                ] || ""
                                              : traineeTheoryAssessments[
                                                  trainee.id
                                                ] || ""
                                          }
                                          onChange={(e) => {
                                            if (isServiceId39) {
                                              handleVivaAssessmentChange(
                                                trainee.id,
                                                e.target.value,
                                              );
                                            } else {
                                              handleTheoryAssessmentChange(
                                                trainee.id,
                                                e.target.value,
                                              );
                                            }
                                          }}
                                          displayEmpty
                                          readOnly={readOnly}
                                          sx={{
                                            backgroundColor: readOnly
                                              ? "#f5f5f5"
                                              : "transparent",
                                          }}
                                        >
                                          <MenuItem value="" disabled>
                                            <em>Select Competency</em>
                                          </MenuItem>
                                          {academicCompetency.map(
                                            (competency) => (
                                              <MenuItem
                                                key={competency.id}
                                                value={competency.id}
                                              >
                                                {competency.name}
                                              </MenuItem>
                                            ),
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Tooltip>
                                  )
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ fontStyle: "italic" }}
                                  >
                                    N/A
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Practical Assessment Column */}
                              <TableCell>
                                {hasInternalAssessment ? (
                                  isNumericCertificationLevel() ? (
                                    isServiceId39 ? (
                                      <Tooltip
                                        title={getReadOnlyTooltip()}
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={
                                            traineeVivaPracticalAssessments[
                                              trainee.id
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            handleVivaPracticalAssessmentChange(
                                              trainee.id,
                                              e.target.value,
                                            )
                                          }
                                          fullWidth
                                          slotProps={{
                                            input: {
                                              readOnly: readOnly,
                                              inputProps: { min: 0, max: 100 },
                                            },
                                          }}
                                          sx={{
                                            minWidth: 100,
                                            backgroundColor: readOnly
                                              ? "#f5f5f5"
                                              : "transparent",
                                          }}
                                        />
                                      </Tooltip>
                                    ) : (
                                      <Tooltip
                                        title={getReadOnlyTooltip()}
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={
                                            traineePracticalAssessments[
                                              trainee.id
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            handlePracticalAssessmentChange(
                                              trainee.id,
                                              e.target.value,
                                            )
                                          }
                                          fullWidth
                                          slotProps={{
                                            input: {
                                              readOnly: readOnly,
                                              inputProps: { min: 0, max: 100 },
                                            },
                                          }}
                                          sx={{
                                            minWidth: 100,
                                            backgroundColor: readOnly
                                              ? "#f5f5f5"
                                              : "transparent",
                                          }}
                                        />
                                      </Tooltip>
                                    )
                                  ) : (
                                    <Tooltip title={getReadOnlyTooltip()} arrow>
                                      <FormControl
                                        size="small"
                                        fullWidth
                                        sx={{ minWidth: 130 }}
                                      >
                                        <Select
                                          value={
                                            isServiceId39
                                              ? traineeVivaPracticalAssessments[
                                                  trainee.id
                                                ] || ""
                                              : traineePracticalAssessments[
                                                  trainee.id
                                                ] || ""
                                          }
                                          onChange={(e) => {
                                            if (isServiceId39) {
                                              handleVivaPracticalAssessmentChange(
                                                trainee.id,
                                                e.target.value,
                                              );
                                            } else {
                                              handlePracticalAssessmentChange(
                                                trainee.id,
                                                e.target.value,
                                              );
                                            }
                                          }}
                                          displayEmpty
                                          readOnly={readOnly}
                                          sx={{
                                            backgroundColor: readOnly
                                              ? "#f5f5f5"
                                              : "transparent",
                                          }}
                                        >
                                          <MenuItem value="" disabled>
                                            <em>Select Competency</em>
                                          </MenuItem>
                                          {academicCompetency.map(
                                            (competency) => (
                                              <MenuItem
                                                key={competency.id}
                                                value={competency.id}
                                              >
                                                {competency.name}
                                              </MenuItem>
                                            ),
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Tooltip>
                                  )
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ fontStyle: "italic" }}
                                  >
                                    N/A
                                  </Typography>
                                )}
                              </TableCell>

                              {isNumericCertificationLevel() &&
                                !isServiceId39 && (
                                  <TableCell>
                                    {hasInternalAssessment ? (
                                      <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                      >
                                        {totalValue}
                                      </Typography>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        sx={{ fontStyle: "italic" }}
                                      >
                                        N/A
                                      </Typography>
                                    )}
                                  </TableCell>
                                )}

                              {/* Remarks Column */}
                              <TableCell>
                                <Tooltip
                                  title={
                                    currentRoleId == 22
                                      ? "Remarks are read-only for Endorser role"
                                      : ""
                                  }
                                  arrow
                                >
                                  <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={traineeRemarks[trainee.id] || ""}
                                    onChange={(e) =>
                                      handleRemarksChange(
                                        trainee.id,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Add remarks..."
                                    sx={{
                                      minWidth: 120,
                                      backgroundColor:
                                        currentRoleId == 22
                                          ? "#f5f5f5"
                                          : "transparent",
                                    }}
                                    disabled={
                                      currentRoleId == 22 || isActionDisabled()
                                    }
                                  />
                                </Tooltip>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={getTableColSpan()} align="center">
                      No selected trainees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTrainees.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip
            title={
              !isGeneratePAEnabled()
                ? "CA Mark/Competency values are required for all selected trainees to generate payment"
                : paymentStatus
                  ? "Payment already generated"
                  : "Generate Payment Advice"
            }
            arrow
          >
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ManageHistoryIcon />}
                onClick={handleGeneratePA}
                disabled={
                  isActionDisabled() ||
                  actionLoading ||
                  !isGeneratePAEnabled() ||
                  !!paymentStatus
                }
                sx={{
                  px: 3,
                  py: 0.5,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Generate PA
              </Button>
            </span>
          </Tooltip>

          {/* Only show Proceed to Payment button if payment exists and is NOT completed */}
          {paymentStatus &&
            paymentStatus.redirectUrl &&
            !isPaymentCompleted() && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PaymentIcon />}
                onClick={() =>
                  handleRedirectToPayment(paymentStatus.redirectUrl)
                }
                sx={{
                  px: 3,
                  py: 0.5,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Proceed to Payment
              </Button>
            )}

          {paymentStatus && (
            <Chip
              label={
                isPaymentCompleted() ? "Payment Completed ✓" : "Payment Pending"
              }
              color={isPaymentCompleted() ? "success" : "warning"}
              size="small"
            />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Submit Button - Only show when CA marks don't exist (Role 9) */}
            {shouldShowSubmitButton() && (
              <Tooltip
                title={
                  !isSubmitEnabled()
                    ? getSubmitValidationMessage()
                    : "Submit this course selection"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openDialog(55)}
                    disabled={
                      isActionDisabled() || actionLoading || !isSubmitEnabled()
                    }
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Submit
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Approve Button - Only shows when payment is paid (Role 9) */}
            {shouldShowApproveButton() && (
              <Tooltip
                title={
                  !isApproveEnabled()
                    ? getApprovalValidationMessage()
                    : "Approve this course selection"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => openDialog(57)}
                    disabled={
                      isActionDisabled() || actionLoading || !isApproveEnabled()
                    }
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Approve
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Endorse Button - Role 22 only */}
            {currentRoleId == 22 && (
              <Tooltip
                title={
                  !isEndorseEnabled()
                    ? getApprovalValidationMessage()
                    : "Endorse this course selection"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => openDialog(59)}
                    disabled={
                      isActionDisabled() || actionLoading || !isEndorseEnabled()
                    }
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Endorse
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Reject Button - Both roles */}
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => openDialog(58)}
              disabled={isActionDisabled() || actionLoading}
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
            >
              Reject
            </Button>
          </Box>
          {/* Show validation messages */}
          {shouldShowSubmitButton() && !isSubmitEnabled() && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{ textAlign: "right" }}
            >
              {getSubmitValidationMessage()}
            </Typography>
          )}
          {shouldShowApproveButton() && !isApproveEnabled() && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{ textAlign: "right" }}
            >
              {getApprovalValidationMessage()}
            </Typography>
          )}
          {currentRoleId == 22 && !isEndorseEnabled() && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{ textAlign: "right" }}
            >
              {getApprovalValidationMessage()}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>{getDialogContent()}</DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={closeDialog}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={getConfirmButtonColor()}
            variant="contained"
            size="small"
            disabled={
              actionLoading || (currentAction === 58 && !remarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Assessor Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {assessorToDelete && (
              <>
                Are you sure you want to remove{" "}
                <strong>{assessorToDelete?.name}</strong> (
                {assessorToDelete?.userId}) from the assessor assignment?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={closeDeleteDialog}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAssessor}
            color="error"
            variant="contained"
            size="small"
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ViewAccreditatedRPLCourseTraineeSelectionIndex;
