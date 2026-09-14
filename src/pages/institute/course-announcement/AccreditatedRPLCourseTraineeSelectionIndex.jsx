import { useState, useEffect } from "react";
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
  Checkbox,
  Chip,
  IconButton,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import GradeIcon from "@mui/icons-material/Grade";
import BlockIcon from "@mui/icons-material/Block";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import FileDownload from "../../../components/file/FileDownload";

const AccreditatedRPLCourseTraineeSelectionIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [movingTrainees, setMovingTrainees] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [pendingTrainees, setPendingTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchPending, setSearchPending] = useState("");
  const [searchSelected, setSearchSelected] = useState("");
  const [statusList, setStatusList] = useState([]);
  const [traineeDetails, setTraineeDetails] = useState(null);

  const access_token = useSelector((state) => state.auth.accessToken);
  //Store status IDs for pending and selected
  const [pendingStatusId, setPendingStatusId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [academicCompetency, setAcademicCompetency] = useState([]);
  // State for payment advice
  const [paymentStatusDetails, setPaymentStatusDetails] = useState([]);
  const [paymentAdviceNo, setPaymentAdviceNo] = useState(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState(null);

  //State for qualifications lookup
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});

  // State for storing internal assessments for selected trainees
  const [traineeInternalAssessments, setTraineeInternalAssessments] = useState(
    {},
  );

  // State for storing theory and practical assessments
  const [traineeTheoryAssessments, setTraineeTheoryAssessments] = useState({});
  const [traineePracticalAssessments, setTraineePracticalAssessments] =
    useState({});

  // State for storing viva and practical assessments for service_id 39
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] =
    useState({});

  // State to track if any assessment values exist
  const [hasAssessmentValues, setHasAssessmentValues] = useState(false);

  // Separate pagination for pending table
  const [pagePending, setPagePending] = useState(0);
  const [rowsPerPagePending, setRowsPerPagePending] = useState(5);

  // Separate pagination for selected table
  const [pageSelected, setPageSelected] = useState(0);
  const [rowsPerPageSelected, setRowsPerPageSelected] = useState(5);

  const [selectedPendingRows, setSelectedPendingRows] = useState([]);
  const [selectedSelectedRows, setSelectedSelectedRows] = useState([]);

  // Create competency map for lookup
  const [competencyMap, setCompetencyMap] = useState({});

  // Dialog states
  const [openTraineeDialog, setOpenTraineeDialog] = useState(false);
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [traineeDetailsLoading, setTraineeDetailsLoading] = useState(false);

  // State for documents in dialog
  const [traineeDocuments, setTraineeDocuments] = useState([]);
  // State for trainee marks in dialog
  const [traineeMarks, setTraineeMarks] = useState([]);

  // Check if CA dates exist
  const hasCADates = courseDetails?.ca_start_date && courseDetails?.ca_end_date;

  // Check if service_id is 39 for Viva assessments
  const isServiceId39 = courseDetails?.service_id === "39";

  // Helper function to check if certification level requires numeric input (only 111 and 112)
  const isNumericCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // Helper function to check if certification level is diploma (111 or 112)
  const isDiplomaCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // Get max value for Internal Assessment based on certification level
  const getInternalAssessmentMaxValue = () => {
    if (!isDiplomaCertificationLevel()) return null; // No max for certificate level
    return 20;
  };

  // Get tooltip message for Internal Assessment max value
  const getInternalAssessmentTooltipMessage = () => {
    const maxVal = getInternalAssessmentMaxValue();
    if (!maxVal) return "";
    return `Maximum value that can be entered is ${maxVal}`;
  };

  // Helper function to validate Internal Assessment input for diploma
  const validateInternalAssessmentInput = (value) => {
    if (value === "") return true;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    return numValue >= 0 && numValue <= 20;
  };

  // Helper function to check if application is endorsed (status_id === 59)
  const isApplicationEndorsed = () => {
    return courseDetails?.application_status_id === "59";
  };

  // Check if payment is paid
  const isPaymentPaid =
    paymentStatusDetails?.paymentStatus?.toLowerCase() === "paid";

  // Only show assessments if application is endorsed
  const hasAssessments =
    isApplicationEndorsed() &&
    selectedTrainees.some((trainee) => {
      if (isServiceId39) {
        return (
          (trainee.viva_assessment && trainee.viva_assessment !== "") ||
          (trainee.practical_assessment && trainee.practical_assessment !== "")
        );
      } else {
        return (
          (trainee.theory_assessment && trainee.theory_assessment !== "") ||
          (trainee.practical_assessment && trainee.practical_assessment !== "")
        );
      }
    });

  // Check if any trainee has result status - only show if application is endorsed
  const hasResultStatus =
    isApplicationEndorsed() &&
    selectedTrainees.some((trainee) => trainee.result_status_id);

  // Fetch academic qualifications and status list on component mount
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
    fetchPaymentDetail();
  }, []);

  // Fetch programme details and applied trainees when dependencies are ready
  useEffect(() => {
    if (
      academicQualifications.length > 0 &&
      pendingStatusId &&
      selectedStatusId &&
      academicCompetency.length > 0
    ) {
      fetchData();
    }
  }, [
    applicationNo,
    academicQualifications,
    pendingStatusId,
    selectedStatusId,
    academicCompetency,
  ]);

  // Check for assessment values whenever they change (only if endorsed)
  useEffect(() => {
    if (isApplicationEndorsed()) {
      const hasValues = selectedTrainees.some((trainee) => {
        if (isServiceId39) {
          const vivaVal = traineeVivaAssessments[trainee.id] || "";
          const practicalVal =
            traineeVivaPracticalAssessments[trainee.id] || "";

          return (
            (vivaVal && vivaVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        } else {
          const theoryVal = traineeTheoryAssessments[trainee.id] || "";
          const practicalVal = traineePracticalAssessments[trainee.id] || "";

          return (
            (theoryVal && theoryVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        }
      });

      setHasAssessmentValues(hasValues);
    } else {
      setHasAssessmentValues(false);
    }
  }, [
    selectedTrainees,
    traineeTheoryAssessments,
    traineePracticalAssessments,
    traineeVivaAssessments,
    traineeVivaPracticalAssessments,
    isServiceId39,
    courseDetails?.application_status_id,
  ]);

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
      console.log("Academic Qualifications:", qualifications);
    } catch (error) {
      console.error("Error fetching academic qualifications:", error);
    }
  };

  const fetchPaymentDetail = async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);

      setPaymentStatusDetails(response.data);
      console.log("payment details", response.data);

      // Extract paymentAdviceNo if it exists
      if (response.data && response.data.paymentAdviceNo) {
        setPaymentAdviceNo(response.data.paymentAdviceNo);
        if (response.data.redirectUrl) {
          setPaymentRedirectUrl(response.data.redirectUrl);
        }
      } else {
        setPaymentAdviceNo(null);
        setPaymentRedirectUrl(null);
      }

      console.log("payment details:", response);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("Failed to fetch payment details");
      setPaymentAdviceNo(null);
      setPaymentRedirectUrl(null);
    }
  };

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      const statuses = statusResponse.data;
      setStatusList(statuses);

      // Find status IDs for 'pending' and 'selected'
      const pendingStatus = statuses.find(
        (status) => status.name.toLowerCase() === "pending",
      );
      const selectedStatus = statuses.find(
        (status) => status.name.toLowerCase() === "selected",
      );

      if (pendingStatus) {
        setPendingStatusId(pendingStatus.id);
        console.log("Pending Status ID:", pendingStatus.id);
      } else {
        console.error("Pending status not found in status list");
      }

      if (selectedStatus) {
        setSelectedStatusId(selectedStatus.id);
        console.log("Selected Status ID:", selectedStatus.id);
      } else {
        console.error("Selected status not found in status list");
      }

      console.log("Status List:", statuses);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchProgrammeDetails(), fetchCourseAppliedTrainees()]);
  };

  const fetchAcademicCompetency = async () => {
    try {
      const response = await CommonService.getByParentId(22);
      const competencies = response.data;
      console.log("Academic Competencies Response:", competencies);
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

  const fetchProgrammeDetails = async () => {
    try {
      const response =
        await CommonService.getCourseAnnouncementByApplicationNo(applicationNo);
      console.log("programme details : ", response.data);

      const programmeData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(programmeData);
    } catch (error) {
      console.error("Error fetching programme details:", error);
      toast.error("Failed to fetch programme details");
    }
  };

  const fetchCourseAppliedTrainees = async () => {
    try {
      setLoading(true);
      const response =
        await CourseEnrollmentService.getCourseAppliedTraineesByApplicationNo(
          applicationNo,
        );
      console.log("Applied Trainees Response:", response.data);
      const trainees = response.data || [];

      // Filter trainees based on status IDs from API
      const pending = trainees.filter(
        (trainee) => trainee.status_id === pendingStatusId?.toString(),
      );
      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setPendingTrainees(pending);
      setSelectedTrainees(selected);

      // Initialize assessments for selected trainees from API data
      const initialInternalAssessments = {};
      const initialTheory = {};
      const initialPractical = {};
      const initialViva = {};
      const initialVivaPractical = {};

      selected.forEach((trainee) => {
        // Initialize internal assessment
        if (trainee.internal_assessment) {
          initialInternalAssessments[trainee.id] = trainee.internal_assessment;
        } else {
          initialInternalAssessments[trainee.id] = "";
        }

        // Initialize theory and practical assessments - use trainee data directly
        initialTheory[trainee.id] = trainee.theory_assessment || "";
        initialPractical[trainee.id] = trainee.practical_assessment || "";

        // Initialize viva assessments for service_id 39
        initialViva[trainee.id] = trainee.viva_assessment || "";
        initialVivaPractical[trainee.id] = trainee.practical_assessment || "";
      });

      setTraineeInternalAssessments(initialInternalAssessments);
      setTraineeTheoryAssessments(initialTheory);
      setTraineePracticalAssessments(initialPractical);
      setTraineeVivaAssessments(initialViva);
      setTraineeVivaPracticalAssessments(initialVivaPractical);
    } catch (error) {
      console.error("Error fetching applied trainees:", error);
      toast.error("Failed to fetch applied trainees");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch trainee details for dialog
  const fetchTraineeDetails = async (traineeId) => {
    try {
      setTraineeDetailsLoading(true);
      const response = await CourseEnrollmentService.getTraineeDetailsById(
        traineeId,
        access_token,
      );
      // Check if response.data is an array and get the first item
      const details = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setTraineeDetails(details);
      console.log("Trainee Details:", details);

      // Parse documents if they exist
      if (details?.documents) {
        try {
          const parsedDocs =
            typeof details.documents === "string"
              ? JSON.parse(details.documents)
              : details.documents;

          if (Array.isArray(parsedDocs)) {
            const formattedDocs = parsedDocs.map((doc) => ({
              name: doc.documentName || doc.name || "Document",
              url: doc.url || doc.filePath || "",
              id: doc.id,
              filePath: doc.url || doc.filePath,
            }));
            setTraineeDocuments(formattedDocs);
          }
        } catch (e) {
          console.error("Error parsing documents:", e);
          setTraineeDocuments([]);
        }
      } else {
        setTraineeDocuments([]);
      }

      // Parse trainee marks if they exist
      if (details?.trainee_marks) {
        try {
          const parsedMarks =
            typeof details.trainee_marks === "string"
              ? JSON.parse(details.trainee_marks)
              : details.trainee_marks;

          if (Array.isArray(parsedMarks) && parsedMarks.length > 0) {
            setTraineeMarks(parsedMarks);
          } else {
            setTraineeMarks([]);
          }
        } catch (e) {
          console.error("Error parsing trainee marks:", e);
          setTraineeMarks([]);
        }
      } else {
        setTraineeMarks([]);
      }
    } catch (error) {
      console.error("Error fetching trainee details:", error);
      toast.error("Failed to fetch trainee details");
    } finally {
      setTraineeDetailsLoading(false);
    }
  };

  // Function to handle opening the dialog
  const handleViewMore = (traineeId) => {
    setSelectedTraineeId(traineeId);
    setOpenTraineeDialog(true);
    fetchTraineeDetails(traineeId);
  };

  // Function to handle closing the dialog
  const handleCloseDialog = () => {
    setOpenTraineeDialog(false);
    setSelectedTraineeId(null);
    setTraineeDetails(null);
    setTraineeDocuments([]);
    setTraineeMarks([]);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper function to get qualification name from ID
  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    return qualificationMap[qualificationId] || qualificationId;
  };

  // Helper function to get status name from ID
  const getStatusName = (statusId) => {
    if (!statusId) return "Unknown";
    const status = statusList.find((s) => s.id === parseInt(statusId));
    return status ? status.name : "Unknown";
  };

  // Helper function to get result status name from ID
  const getResultStatusName = (resultStatusId) => {
    if (!resultStatusId) return "N/A";
    const status = statusList.find((s) => s.id === parseInt(resultStatusId));
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

  // Helper function to get result status color
  const getResultStatusColor = (resultStatusId) => {
    const statusName = getResultStatusName(resultStatusId).toLowerCase();
    if (statusName === "passed") {
      return { bgcolor: "#4caf50", color: "white" };
    } else if (statusName === "failed") {
      return { bgcolor: "#f44336", color: "white" };
    } else if (statusName === "pending") {
      return { bgcolor: "#ff9800", color: "white" };
    }
    return { bgcolor: "#9e9e9e", color: "white" };
  };

  // Helper function to get competency name from ID
  const getCompetencyName = (competencyId) => {
    if (!competencyId) return "";
    return competencyMap[competencyId] || competencyId;
  };

  // Handle internal assessment change
  const handleInternalAssessmentChange = (traineeId, value) => {
    setTraineeInternalAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  const handleSelectPending = (event, traineeId) => {
    if (event.target.checked) {
      setSelectedPendingRows([...selectedPendingRows, traineeId]);
    } else {
      setSelectedPendingRows(
        selectedPendingRows.filter((id) => id !== traineeId),
      );
    }
  };

  const handleSelectAllPending = (event) => {
    if (event.target.checked) {
      setSelectedPendingRows(filteredPending.map((trainee) => trainee.id));
    } else {
      setSelectedPendingRows([]);
    }
  };

  const handleSelectSelected = (event, traineeId) => {
    if (event.target.checked) {
      setSelectedSelectedRows([...selectedSelectedRows, traineeId]);
    } else {
      setSelectedSelectedRows(
        selectedSelectedRows.filter((id) => id !== traineeId),
      );
    }
  };

  const handleSelectAllSelected = (event) => {
    if (event.target.checked) {
      setSelectedSelectedRows(filteredSelected.map((trainee) => trainee.id));
    } else {
      setSelectedSelectedRows([]);
    }
  };

  // API call to update trainee status
  const updateTraineeStatus = async (traineeIds, newStatusId) => {
    try {
      const traineeStatusList = traineeIds.map((traineeId) => ({
        traineeId: parseInt(traineeId),
        statusId: newStatusId,
      }));

      const payload = {
        applicationNo: applicationNo,
        statusId: 55,
        courseName: courseDetails?.course_name,
        serviceId: courseDetails?.service_id
          ? parseInt(courseDetails.service_id)
          : null,
        assignedRoleId: 9,
        traineeIds: traineeStatusList,
      };

      console.log("Updating trainee status payload:", payload);
      const response =
        await CourseEnrollmentService.selectUnselectTrainee(payload);

      if (response.status === 200 || response.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating trainee status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update trainee status",
      );
      return false;
    }
  };

  const moveToSelected = async () => {
    if (hasCADates) {
      toast.error("Cannot move trainees when CA dates are set");
      return;
    }

    if (selectedPendingRows.length === 0) {
      toast.warning("Please select at least one trainee to move");
      return;
    }

    // Check if moving would exceed total seats
    const totalSeats = courseDetails?.enrollment_capacity || 0;
    if (selectedTrainees.length + selectedPendingRows.length > totalSeats) {
      toast.error(
        `Cannot select more than ${totalSeats} trainees. Only ${totalSeats - selectedTrainees.length} seats available.`,
      );
      return;
    }

    // Check if application is endorsed - if so, check for assessment values
    if (isApplicationEndorsed()) {
      const hasValues = selectedPendingRows.some((traineeId) => {
        const trainee = pendingTrainees.find((t) => t.id === traineeId);
        if (!trainee) return false;
        if (isServiceId39) {
          const vivaVal = traineeVivaAssessments[traineeId] || "";
          const practicalVal = traineeVivaPracticalAssessments[traineeId] || "";

          return (
            (vivaVal && vivaVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        } else {
          const theoryVal = traineeTheoryAssessments[traineeId] || "";
          const practicalVal = traineePracticalAssessments[traineeId] || "";

          return (
            (theoryVal && theoryVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        }
      });

      if (hasValues) {
        toast.error(
          "Cannot move trainees when they have assessment marks or result status. Please clear all assessment values first.",
        );
        return;
      }
    }

    setMovingTrainees(true);

    try {
      // Update backend API
      const success = await updateTraineeStatus(
        selectedPendingRows,
        selectedStatusId,
      );

      if (success) {
        // Get the selected trainees from pending list
        const traineesToMove = pendingTrainees.filter((t) =>
          selectedPendingRows.includes(t.id),
        );

        // Update local state - move from pending to selected
        const updatedPending = pendingTrainees.filter(
          (t) => !selectedPendingRows.includes(t.id),
        );
        const updatedSelected = [
          ...selectedTrainees,
          ...traineesToMove.map((t) => ({
            ...t,
            status_id: selectedStatusId.toString(),
          })),
        ];

        setPendingTrainees(updatedPending);
        setSelectedTrainees(updatedSelected);
        setSelectedPendingRows([]);

        toast.success(
          `${selectedPendingRows.length} trainee(s) moved to selected list`,
        );
      }
    } catch (error) {
      console.error("Error moving trainees to selected:", error);
      toast.error("Failed to move trainees. Please try again.");
    } finally {
      setMovingTrainees(false);
    }
  };

  const moveToPending = async () => {
    if (hasCADates) {
      toast.error("Cannot move trainees when CA dates are set");
      return;
    }

    if (selectedSelectedRows.length === 0) {
      toast.warning("Please select at least one trainee to move back");
      return;
    }

    // Check if application is endorsed - if so, check for assessment values
    if (isApplicationEndorsed()) {
      const hasValues = selectedSelectedRows.some((traineeId) => {
        const trainee = selectedTrainees.find((t) => t.id === traineeId);
        if (!trainee) return false;
        if (isServiceId39) {
          const vivaVal = traineeVivaAssessments[traineeId] || "";
          const practicalVal = traineeVivaPracticalAssessments[traineeId] || "";

          return (
            (vivaVal && vivaVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        } else {
          const theoryVal = traineeTheoryAssessments[traineeId] || "";
          const practicalVal = traineePracticalAssessments[traineeId] || "";

          return (
            (theoryVal && theoryVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        }
      });

      if (hasValues) {
        toast.error(
          "Cannot move trainees when they have assessment marks or result status. Please clear all assessment values first.",
        );
        return;
      }
    }

    setMovingTrainees(true);

    try {
      // Update backend API
      const success = await updateTraineeStatus(
        selectedSelectedRows,
        pendingStatusId,
      );

      if (success) {
        // Get the selected trainees from selected list
        const traineesToMove = selectedTrainees.filter((t) =>
          selectedSelectedRows.includes(t.id),
        );

        // Update local state - move from selected to pending
        const updatedSelected = selectedTrainees.filter(
          (t) => !selectedSelectedRows.includes(t.id),
        );
        const updatedPending = [
          ...pendingTrainees,
          ...traineesToMove.map((t) => ({
            ...t,
            status_id: pendingStatusId.toString(),
          })),
        ];

        setSelectedTrainees(updatedSelected);
        setPendingTrainees(updatedPending);
        setSelectedSelectedRows([]);

        toast.info(
          `${selectedSelectedRows.length} trainee(s) moved back to pending`,
        );
      }
    } catch (error) {
      console.error("Error moving trainees to pending:", error);
      toast.error("Failed to move trainees. Please try again.");
    } finally {
      setMovingTrainees(false);
    }
  };

  const handleFinalizeSelection = async () => {
    // Check if application has already been submitted
    if (courseDetails?.application_status_id === "55") {
      toast.warning("Application has been already submitted");
      return;
    }

    if (selectedTrainees.length === 0) {
      toast.warning("No trainees selected for this programme");
      return;
    }

    // Check if any trainee has assessment values (only if endorsed)
    if (isApplicationEndorsed()) {
      const hasValues = selectedTrainees.some((trainee) => {
        if (isServiceId39) {
          const vivaVal = traineeVivaAssessments[trainee.id] || "";
          const practicalVal =
            traineeVivaPracticalAssessments[trainee.id] || "";

          return (
            (vivaVal && vivaVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        } else {
          const theoryVal = traineeTheoryAssessments[trainee.id] || "";
          const practicalVal = traineePracticalAssessments[trainee.id] || "";

          return (
            (theoryVal && theoryVal !== "") ||
            (practicalVal && practicalVal !== "") ||
            trainee.result_status_id
          );
        }
      });

      if (hasValues) {
        toast.error(
          "Cannot submit selection when trainees have assessment marks or result status. Please clear all assessment values first.",
        );
        return;
      }
    }

    // Only validate internal assessments if CA dates exist
    if (hasCADates) {
      const missingAssessments = selectedTrainees.filter(
        (trainee) =>
          !traineeInternalAssessments[trainee.id] ||
          traineeInternalAssessments[trainee.id] === "",
      );

      if (missingAssessments.length > 0) {
        toast.error(
          `Please enter CA mark/competency for all selected trainees. Missing for: ${missingAssessments.map((t) => t.applicant_name).join(", ")}`,
        );
        return;
      }

      // Validate internal assessment values for diploma
      if (isDiplomaCertificationLevel()) {
        const invalidAssessments = selectedTrainees.filter((trainee) => {
          const value = traineeInternalAssessments[trainee.id];
          if (value) {
            const numValue = parseFloat(value);
            return numValue < 0 || numValue > 20;
          }
          return false;
        });

        if (invalidAssessments.length > 0) {
          toast.error(
            `Internal Assessment must be between 0 and 20 for diploma. Invalid for: ${invalidAssessments.map((t) => t.applicant_name).join(", ")}`,
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Prepare trainee internal assessments payload (only if CA dates exist)
      let traineeInternalAssessmentsList = [];
      if (hasCADates) {
        traineeInternalAssessmentsList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment: isNumericCertificationLevel()
            ? parseInt(traineeInternalAssessments[trainee.id])
            : traineeInternalAssessments[trainee.id],
        }));
      }

      // Prepare trainee marks payload based on service type
      let traineeMarksList = [];
      let traineeVivaAssessmentsList = [];

      if (isServiceId39) {
        // For service_id 39: Prepare viva assessments
        traineeVivaAssessmentsList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          vivaAssessment: traineeVivaAssessments[trainee.id]
            ? parseInt(traineeVivaAssessments[trainee.id])
            : null,
          practicalAssessment: traineeVivaPracticalAssessments[trainee.id]
            ? parseInt(traineeVivaPracticalAssessments[trainee.id])
            : null,
        }));
      } else {
        // For other services: Prepare theory and practical assessments
        traineeMarksList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          theoryAssessment: isNumericCertificationLevel()
            ? traineeTheoryAssessments[trainee.id]
              ? parseInt(traineeTheoryAssessments[trainee.id])
              : null
            : traineeTheoryAssessments[trainee.id] || null,
          practicalAssessment: isNumericCertificationLevel()
            ? traineePracticalAssessments[trainee.id]
              ? parseInt(traineePracticalAssessments[trainee.id])
              : null
            : traineePracticalAssessments[trainee.id] || null,
        }));
      }

      // Prepare trainee status DTO list - only if CA dates DO NOT exist
      let traineeStatusList = null;
      if (!hasCADates) {
        traineeStatusList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          statusId: selectedStatusId,
        }));
      }

      // Prepare the payload matching the DTO structure
      const payload = {
        applicationNo: applicationNo,
        statusId: 55,
        courseName: courseDetails?.course_name,
        serviceId: courseDetails?.service_id
          ? parseInt(courseDetails.service_id)
          : null,
        assignedRoleId: 9,
      };

      // Only add traineeIds if CA dates DO NOT exist
      if (!hasCADates && traineeStatusList) {
        payload.traineeIds = traineeStatusList;
      }

      // Only add internal assessments if CA dates exist
      if (hasCADates && traineeInternalAssessmentsList.length > 0) {
        payload.traineeInternalAssessments = traineeInternalAssessmentsList;
      }

      // Add trainee marks for regular services
      if (!isServiceId39 && traineeMarksList.length > 0) {
        payload.traineeMarks = traineeMarksList;
      }

      // Add trainee viva assessments for service_id 39
      if (isServiceId39 && traineeVivaAssessmentsList.length > 0) {
        payload.traineeVivaAssessments = traineeVivaAssessmentsList;
      }

      console.log("Final selection payload:", payload);
      const response = await CourseEnrollmentService.submitSelectedTrainee(
        payload,
        access_token,
      );
      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Trainee selection submitted successfully! ${selectedTrainees.length} trainee(s) confirmed.`,
        );
        navigate(-1);
      }
    } catch (error) {
      console.error("Error finalizing selection:", error);
      toast.error(
        error.response?.data?.message || "Failed to finalize selection",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    setSelectedPendingRows([]);
    setSelectedSelectedRows([]);
    toast.info("Data refreshed");
  };

  // Filter pending trainees based on search
  const filteredPending = pendingTrainees.filter(
    (trainee) =>
      trainee.applicant_name
        ?.toLowerCase()
        .includes(searchPending.toLowerCase()) ||
      trainee.email_id?.toLowerCase().includes(searchPending.toLowerCase()) ||
      trainee.mobile_no?.toLowerCase().includes(searchPending.toLowerCase()) ||
      trainee.cid_no?.toLowerCase().includes(searchPending.toLowerCase()),
  );

  // Filter selected trainees based on search
  const filteredSelected = selectedTrainees.filter(
    (trainee) =>
      trainee.applicant_name
        ?.toLowerCase()
        .includes(searchSelected.toLowerCase()) ||
      trainee.email_id?.toLowerCase().includes(searchSelected.toLowerCase()) ||
      trainee.mobile_no?.toLowerCase().includes(searchSelected.toLowerCase()) ||
      trainee.cid_no?.toLowerCase().includes(searchSelected.toLowerCase()),
  );

  // Pagination handlers for pending table
  const handleChangePagePending = (event, newPage) => {
    setPagePending(newPage);
  };

  const handleChangeRowsPerPagePending = (event) => {
    setRowsPerPagePending(parseInt(event.target.value, 10));
    setPagePending(0);
  };

  // Pagination handlers for selected table
  const handleChangePageSelected = (event, newPage) => {
    setPageSelected(newPage);
  };

  const handleChangeRowsPerPageSelected = (event) => {
    setRowsPerPageSelected(parseInt(event.target.value, 10));
    setPageSelected(0);
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
      fontWeight: 400,
    },
  };

  // Style for TextField to remove hover effects
  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      "&:hover fieldset": {
        borderColor: "rgba(0, 0, 0, 0.23)",
      },
    },
  };

  // Calculate total columns for selected table
  const getSelectedTableColSpan = () => {
    let cols = 8; // checkbox, #, name, cid, contact, email, qualification, status

    if (hasCADates) cols++;
    // Only add assessment columns if application is endorsed
    if (isApplicationEndorsed() && hasAssessments) {
      if (isServiceId39) {
        cols += 2; // viva and practical for service_id 39
      } else {
        cols += 2; // theory and practical for other services
      }
    }
    // Add result status column if endorsed and any trainee has result_status_id
    if (
      isApplicationEndorsed() &&
      selectedTrainees.some((trainee) => trainee.result_status_id)
    ) {
      cols++;
    }
    return cols;
  };

  // Render assessment columns (read-only) based on service type - only if endorsed
  const renderAssessmentColumns = (trainee) => {
    // Only render if application is endorsed
    if (!isApplicationEndorsed()) return null;

    // Check if certification level is numeric (111 or 112)
    const isNumeric = isNumericCertificationLevel();

    if (isServiceId39) {
      // For service_id 39: Show Viva and Practical columns (read-only with tooltip)
      // Get value from state or fallback to trainee data directly
      const vivaValue =
        traineeVivaAssessments[trainee.id] || trainee.viva_assessment || "";
      const practicalValue =
        traineeVivaPracticalAssessments[trainee.id] ||
        trainee.practical_assessment ||
        "";

      return (
        <>
          {/* Viva Assessment Column */}
          <TableCell>
            <Tooltip
              title={
                vivaValue
                  ? `Viva Assessment: ${vivaValue}`
                  : "No viva assessment available"
              }
              arrow
            >
              {isNumeric ? (
                <TextField
                  type="number"
                  size="small"
                  value={vivaValue || ""}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  sx={{
                    minWidth: 120,
                    backgroundColor: "#f5f5f5",
                  }}
                />
              ) : (
                <Chip
                  label={getCompetencyName(vivaValue) || "N/A"}
                  size="small"
                  color="info"
                  sx={{ minWidth: 100 }}
                />
              )}
            </Tooltip>
          </TableCell>

          {/* Practical Assessment Column for service_id 39 */}
          <TableCell>
            <Tooltip
              title={
                practicalValue
                  ? `Practical Assessment: ${practicalValue}`
                  : "No practical assessment available"
              }
              arrow
            >
              {isNumeric ? (
                <TextField
                  type="number"
                  size="small"
                  value={practicalValue || ""}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  sx={{
                    minWidth: 120,
                    backgroundColor: "#f5f5f5",
                  }}
                />
              ) : (
                <Chip
                  label={getCompetencyName(practicalValue) || "N/A"}
                  size="small"
                  color="info"
                  sx={{ minWidth: 100 }}
                />
              )}
            </Tooltip>
          </TableCell>
        </>
      );
    } else {
      // For other services: Show Theory and Practical columns (read-only with tooltip)
      // Get value from state or fallback to trainee data directly
      const theoryValue =
        traineeTheoryAssessments[trainee.id] || trainee.theory_assessment || "";
      const practicalValue =
        traineePracticalAssessments[trainee.id] ||
        trainee.practical_assessment ||
        "";

      return (
        <>
          {/* Theory Assessment Column */}
          <TableCell>
            <Tooltip
              title={
                theoryValue
                  ? `Theory Assessment: ${theoryValue}`
                  : "No theory assessment available"
              }
              arrow
            >
              {isNumeric ? (
                <TextField
                  type="number"
                  size="small"
                  value={theoryValue || ""}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  sx={{
                    minWidth: 120,
                    backgroundColor: "#f5f5f5",
                  }}
                />
              ) : (
                <Chip
                  label={getCompetencyName(theoryValue) || "N/A"}
                  size="small"
                  color="info"
                  sx={{ minWidth: 100 }}
                />
              )}
            </Tooltip>
          </TableCell>

          {/* Practical Assessment Column for other services */}
          <TableCell>
            <Tooltip
              title={
                practicalValue
                  ? `Practical Assessment: ${practicalValue}`
                  : "No practical assessment available"
              }
              arrow
            >
              {isNumeric ? (
                <TextField
                  type="number"
                  size="small"
                  value={practicalValue || ""}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  sx={{
                    minWidth: 120,
                    backgroundColor: "#f5f5f5",
                  }}
                />
              ) : (
                <Chip
                  label={getCompetencyName(practicalValue) || "N/A"}
                  size="small"
                  color="info"
                  sx={{ minWidth: 100 }}
                />
              )}
            </Tooltip>
          </TableCell>
        </>
      );
    }
  };

  if (loading && !courseDetails && pendingTrainees.length === 0) {
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
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" gutterBottom>
          Trainee Selection for Programme
        </Typography>
        <IconButton
          onClick={handleRefresh}
          color="primary"
          title="Refresh"
          disabled={loading || movingTrainees}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Payment Status Banner - Show if payment is pending */}
      {paymentStatusDetails?.paymentStatus?.toLowerCase() === "pending" && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "warning.light",
            border: "1px solid",
            borderColor: "warning.main",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography color="warning.dark">
            <strong>Payment Pending:</strong> Please complete your payment to
            proceed.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                if (paymentRedirectUrl) {
                  window.open(
                    paymentRedirectUrl,
                    "_blank",
                    "noopener,noreferrer",
                  );
                  toast.info("Payment page opened in new tab");
                } else {
                  toast.error("Payment URL not available");
                }
              }}
              startIcon={<OpenInNewIcon />}
            >
              Pay Now
            </Button>
          </Box>
        </Box>
      )}

      {/* Payment Status Banner - Show if payment is paid */}
      {isPaymentPaid && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "success.light",
            border: "1px solid",
            borderColor: "success.main",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography color="success.dark">
            <strong>Payment Status:</strong> Paid ✓
          </Typography>
          {paymentAdviceNo && (
            <Typography color="success.dark">
              <strong>Payment Advice No:</strong> {paymentAdviceNo}
            </Typography>
          )}
        </Box>
      )}

      {/* Programme Information Card */}
      {courseDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Programme Information
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
                  Programme Name:
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
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Available Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {(courseDetails.enrollment_capacity || 0) -
                    selectedTrainees.length}
                </Typography>
              </Grid>
              {/* CA Start Date - Only show if exists */}
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
              {/* CA End Date - Only show if exists */}
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
              <Grid item size={{ xs: 12, md: 3 }}>
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
      {/* Selected and Pending Tables */}
      <Grid container spacing={3}>
        {/* Selected Trainees Table (Top) */}
        <Grid item size={{ xs: 12, md: 12 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Selected Trainees
              <Chip
                label={filteredSelected.length}
                size="small"
                color="success"
              />
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              label="Search Selected Trainees"
              variant="outlined"
              size="small"
              fullWidth
              value={searchSelected}
              onChange={(e) => setSearchSelected(e.target.value)}
              sx={{ mb: 2, ...textFieldStyle }}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                },
              }}
            />

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" sx={tableStyle} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedSelectedRows.length > 0 &&
                          selectedSelectedRows.length < filteredSelected.length
                        }
                        checked={
                          filteredSelected.length > 0 &&
                          selectedSelectedRows.length ===
                            filteredSelected.length
                        }
                        onChange={handleSelectAllSelected}
                        disabled={hasCADates || movingTrainees}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>CID/ReferNo</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Status</TableCell>
                    {/* Only show Internal Assessment column if CA dates exist */}
                    {hasCADates && <TableCell>Internal Assessment</TableCell>}
                    {/* Show assessment columns ONLY if application is endorsed */}
                    {isApplicationEndorsed() && hasAssessments && (
                      <>
                        <TableCell>
                          {isServiceId39
                            ? "Viva Assessment"
                            : "Theory Assessment"}
                        </TableCell>
                        <TableCell>Practical Assessment</TableCell>
                      </>
                    )}
                    {/* Result Status Column - ONLY if application is endorsed */}
                    {isApplicationEndorsed() &&
                      selectedTrainees.some(
                        (trainee) => trainee.result_status_id,
                      ) && <TableCell>Result Status</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSelected.length > 0 ? (
                    filteredSelected
                      .slice(
                        pageSelected * rowsPerPageSelected,
                        pageSelected * rowsPerPageSelected +
                          rowsPerPageSelected,
                      )
                      .map((trainee, index) => (
                        <TableRow key={trainee.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedSelectedRows.includes(
                                trainee.id,
                              )}
                              onChange={(e) =>
                                handleSelectSelected(e, trainee.id)
                              }
                              disabled={hasCADates || movingTrainees}
                            />
                          </TableCell>
                          <TableCell>
                            {index + 1 + pageSelected * rowsPerPageSelected}
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
                          {/* Only show CA Mark/Competency input if CA dates exist */}
                          {hasCADates && (
                            <TableCell>
                              {isNumericCertificationLevel() ? (
                                <Tooltip
                                  title={
                                    isDiplomaCertificationLevel()
                                      ? getInternalAssessmentTooltipMessage()
                                      : traineeInternalAssessments[
                                            trainee.id
                                          ] &&
                                          traineeInternalAssessments[
                                            trainee.id
                                          ] !== ""
                                        ? "CA mark is already set and cannot be modified"
                                        : "Enter CA mark"
                                  }
                                  arrow
                                >
                                  <TextField
                                    type="number"
                                    size="small"
                                    placeholder={`Enter CA mark${isDiplomaCertificationLevel() ? " (0-20)" : ""}`}
                                    value={
                                      traineeInternalAssessments[trainee.id] ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Only apply validation for diploma level
                                      if (isDiplomaCertificationLevel()) {
                                        if (
                                          validateInternalAssessmentInput(value)
                                        ) {
                                          handleInternalAssessmentChange(
                                            trainee.id,
                                            value,
                                          );
                                        }
                                      } else {
                                        handleInternalAssessmentChange(
                                          trainee.id,
                                          value,
                                        );
                                      }
                                    }}
                                    fullWidth
                                    slotProps={{
                                      input: {
                                        inputProps: {
                                          min: 0,
                                          max: isDiplomaCertificationLevel()
                                            ? 20
                                            : 100,
                                        },
                                        readOnly: false,
                                      },
                                    }}
                                    sx={{
                                      minWidth: 120,
                                      ...(traineeInternalAssessments[
                                        trainee.id
                                      ] &&
                                        traineeInternalAssessments[
                                          trainee.id
                                        ] !== "" && {
                                          backgroundColor: "#f5f5f5",
                                          "& .MuiOutlinedInput-root": {
                                            "& fieldset": {
                                              borderColor:
                                                "rgba(0, 0, 0, 0.23)",
                                            },
                                          },
                                        }),
                                    }}
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip
                                  title={
                                    traineeInternalAssessments[trainee.id] &&
                                    traineeInternalAssessments[trainee.id] !==
                                      ""
                                      ? "CA competency is already set and cannot be modified"
                                      : "Select CA competency"
                                  }
                                  arrow
                                >
                                  <FormControl
                                    size="small"
                                    fullWidth
                                    sx={{ minWidth: 150 }}
                                  >
                                    <Select
                                      value={
                                        traineeInternalAssessments[
                                          trainee.id
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleInternalAssessmentChange(
                                          trainee.id,
                                          e.target.value,
                                        )
                                      }
                                      displayEmpty
                                      readOnly={
                                        traineeInternalAssessments[
                                          trainee.id
                                        ] &&
                                        traineeInternalAssessments[
                                          trainee.id
                                        ] !== ""
                                      }
                                      sx={{
                                        ...(traineeInternalAssessments[
                                          trainee.id
                                        ] &&
                                          traineeInternalAssessments[
                                            trainee.id
                                          ] !== "" && {
                                            backgroundColor: "#f5f5f5",
                                            "& .MuiOutlinedInput-root": {
                                              "& fieldset": {
                                                borderColor:
                                                  "rgba(0, 0, 0, 0.23)",
                                              },
                                            },
                                          }),
                                      }}
                                    >
                                      <MenuItem value="" disabled>
                                        <em>Select Competency</em>
                                      </MenuItem>
                                      {academicCompetency.map((competency) => (
                                        <MenuItem
                                          key={competency.id}
                                          value={competency.id}
                                        >
                                          {competency.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Tooltip>
                              )}
                            </TableCell>
                          )}
                          {/* Show assessment columns (read-only with tooltip) ONLY if application is endorsed */}
                          {isApplicationEndorsed() &&
                            hasAssessments &&
                            renderAssessmentColumns(trainee)}
                          {/* Result Status Cell - ONLY if application is endorsed */}
                          {isApplicationEndorsed() &&
                            trainee.result_status_id && (
                              <TableCell>
                                <Tooltip
                                  title={`Result Status: ${getResultStatusName(
                                    trainee.result_status_id,
                                  )}`}
                                  arrow
                                >
                                  <Chip
                                    label={getResultStatusName(
                                      trainee.result_status_id,
                                    )}
                                    size="small"
                                    sx={getResultStatusColor(
                                      trainee.result_status_id,
                                    )}
                                  />
                                </Tooltip>
                              </TableCell>
                            )}
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={getSelectedTableColSpan()}
                        align="center"
                      >
                        No selected trainees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Selected Table Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredSelected.length}
              rowsPerPage={rowsPerPageSelected}
              page={pageSelected}
              onPageChange={handleChangePageSelected}
              onRowsPerPageChange={handleChangeRowsPerPageSelected}
            />

            <Box
              sx={{
                mt: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedSelectedRows.length} trainee(s)
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {/* Move to Pending Button with Tooltip */}
                <Tooltip
                  title={
                    hasCADates
                      ? "⚠️ Cannot move trainees to pending when CA dates are set. Please clear CA dates first."
                      : selectedSelectedRows.length === 0
                        ? "Please select at least one trainee to move back"
                        : ""
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      color={hasCADates ? "grey" : "secondary"}
                      onClick={moveToPending}
                      disabled={
                        selectedSelectedRows.length === 0 ||
                        loading ||
                        movingTrainees ||
                        hasCADates
                      }
                      startIcon={
                        movingTrainees ? (
                          <CircularProgress size={20} />
                        ) : hasCADates ? (
                          <BlockIcon />
                        ) : (
                          <ArrowBackIcon />
                        )
                      }
                      sx={{
                        ...(hasCADates && {
                          backgroundColor: (theme) => theme.palette.grey[400],
                          color: (theme) => theme.palette.grey[600],
                          cursor: "not-allowed",
                          "&:hover": {
                            backgroundColor: (theme) => theme.palette.grey[400],
                          },
                        }),
                      }}
                    >
                      {movingTrainees
                        ? "Moving..."
                        : hasCADates
                          ? "Movement Disabled"
                          : `Move to Pending (${selectedSelectedRows.length})`}
                    </Button>
                  </span>
                </Tooltip>

                {/* Submit Button with Tooltip */}
                <Tooltip
                  title={
                    courseDetails?.application_status_id === "55"
                      ? "Application has been already submitted"
                      : isApplicationEndorsed() && hasAssessmentValues
                        ? "Cannot submit when trainees have assessment marks or result status. Please clear all assessment values first."
                        : ""
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleFinalizeSelection}
                      disabled={
                        loading ||
                        submitting ||
                        selectedTrainees.length === 0 ||
                        (isApplicationEndorsed() && hasAssessmentValues) ||
                        courseDetails?.application_status_id === "55"
                      }
                      startIcon={
                        submitting ? (
                          <CircularProgress size={20} />
                        ) : (
                          <CheckCircleIcon />
                        )
                      }
                    >
                      {submitting
                        ? "Submitting..."
                        : `Submit (${selectedTrainees.length} Trainees)`}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Pending Trainees Table (Bottom) */}
        <Grid item size={{ xs: 12, md: 12 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Pending Trainees
              <Chip
                label={filteredPending.length}
                size="small"
                color="warning"
              />
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              label="Search Pending Trainees"
              variant="outlined"
              size="small"
              fullWidth
              value={searchPending}
              onChange={(e) => setSearchPending(e.target.value)}
              sx={{ mb: 2, ...textFieldStyle }}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                },
              }}
            />

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" sx={tableStyle} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedPendingRows.length > 0 &&
                          selectedPendingRows.length < filteredPending.length
                        }
                        checked={
                          filteredPending.length > 0 &&
                          selectedPendingRows.length === filteredPending.length
                        }
                        onChange={handleSelectAllPending}
                        disabled={hasCADates || movingTrainees}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>CID/ReferNo</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPending.length > 0 ? (
                    filteredPending
                      .slice(
                        pagePending * rowsPerPagePending,
                        pagePending * rowsPerPagePending + rowsPerPagePending,
                      )
                      .map((trainee, index) => (
                        <TableRow key={trainee.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedPendingRows.includes(trainee.id)}
                              onChange={(e) =>
                                handleSelectPending(e, trainee.id)
                              }
                              disabled={hasCADates || movingTrainees}
                            />
                          </TableCell>
                          <TableCell>
                            {index + 1 + pagePending * rowsPerPagePending}
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
                          <TableCell align="center">
                            <Tooltip title="View trainee details" arrow>
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                onClick={() => handleViewMore(trainee.id)}
                                startIcon={
                                  <VisibilityIcon sx={{ fontSize: 16 }} />
                                }
                                sx={{
                                  py: 0.25,
                                  px: 1,
                                  fontSize: "0.7rem",
                                  minWidth: "auto",
                                }}
                              >
                                View
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No pending trainees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pending Table Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPending.length}
              rowsPerPage={rowsPerPagePending}
              page={pagePending}
              onPageChange={handleChangePagePending}
              onRowsPerPageChange={handleChangeRowsPerPagePending}
            />

            <Box
              sx={{
                mt: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedPendingRows.length} trainee(s)
              </Typography>

              {/* Move to Selected Button with Tooltip */}
              <Tooltip
                title={
                  hasCADates
                    ? "⚠️ Cannot move trainees to selected when CA dates are set. Please clear CA dates first."
                    : selectedPendingRows.length === 0
                      ? "Please select at least one trainee to move"
                      : ""
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color={hasCADates ? "grey" : "primary"}
                    onClick={moveToSelected}
                    disabled={
                      selectedPendingRows.length === 0 ||
                      loading ||
                      movingTrainees ||
                      hasCADates
                    }
                    startIcon={
                      movingTrainees ? (
                        <CircularProgress size={20} />
                      ) : hasCADates ? (
                        <BlockIcon />
                      ) : (
                        <ArrowForwardIcon />
                      )
                    }
                    sx={{
                      ...(hasCADates && {
                        backgroundColor: (theme) => theme.palette.grey[400],
                        color: (theme) => theme.palette.grey[600],
                        cursor: "not-allowed",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.grey[400],
                        },
                      }),
                    }}
                  >
                    {movingTrainees
                      ? "Moving..."
                      : hasCADates
                        ? "Movement Disabled"
                        : `Move to Selected (${selectedPendingRows.length})`}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Trainee Details Dialog */}
      <Dialog
        open={openTraineeDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              maxHeight: "80vh",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Trainee Details
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {traineeDetailsLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : traineeDetails ? (
            <Box>
              {/* Personal Information Table */}
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="primary"
                >
                  Personal Information
                </Typography>
              </Box>
              <TableContainer
                component={Paper}
                sx={{
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          width: "35%",
                          bgcolor: "action.hover",
                        }}
                      >
                        Applicant Name
                      </TableCell>
                      <TableCell>
                        {traineeDetails.applicant_name || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          bgcolor: "action.hover",
                        }}
                      >
                        CID Number
                      </TableCell>
                      <TableCell>{traineeDetails.cid_no || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          bgcolor: "action.hover",
                        }}
                      >
                        Mobile Number
                      </TableCell>
                      <TableCell>{traineeDetails.mobile_no || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          bgcolor: "action.hover",
                        }}
                      >
                        Email Address
                      </TableCell>
                      <TableCell>{traineeDetails.email_id || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          bgcolor: "action.hover",
                        }}
                      >
                        Guardian Name
                      </TableCell>
                      <TableCell>
                        {traineeDetails.guardian_name || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          bgcolor: "action.hover",
                        }}
                      >
                        Guardian Mobile Number
                      </TableCell>
                      <TableCell>
                        {traineeDetails.guardian_mobile_no || "N/A"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Academic Information Table */}
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SchoolIcon color="primary" />
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="primary"
                >
                  Academic Information
                </Typography>
              </Box>
              <TableContainer
                component={Paper}
                sx={{
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          width: "35%",
                          bgcolor: "action.hover",
                        }}
                      >
                        Academic Qualification
                      </TableCell>
                      <TableCell>
                        {getQualificationName(
                          traineeDetails.academic_qualification_id,
                        ) || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 400,
                          bgcolor: "action.hover",
                        }}
                      >
                        Trainee ID
                      </TableCell>
                      <TableCell>{traineeDetails.id || "N/A"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Trainee Marks Table - Only show if marks exist */}
              {traineeMarks.length > 0 && (
                <>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <GradeIcon color="primary" />
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      Trainee Marks
                    </Typography>
                  </Box>
                  <TableContainer
                    component={Paper}
                    sx={{
                      mb: 3,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell sx={{ fontWeight: 400 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 400 }}>
                            Subject
                          </TableCell>
                          <TableCell sx={{ fontWeight: 400 }} align="right">
                            Marks
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {traineeMarks.map((mark, index) => (
                          <TableRow key={mark.id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{mark.subject || "N/A"}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={mark.markScore || "N/A"}
                                size="small"
                                color={
                                  parseInt(mark.markScore) >= 50
                                    ? "success"
                                    : "error"
                                }
                                sx={{ fontWeight: 500, minWidth: 50 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                            Total Marks
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {traineeMarks.reduce(
                              (total, mark) =>
                                total + parseInt(mark.markScore || 0),
                              0,
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Documents Section using FileDownload component */}
              {traineeDocuments.length > 0 && (
                <>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary"
                    sx={{ mb: 2 }}
                  >
                    Documents
                  </Typography>
                  <FileDownload
                    initialFiles={traineeDocuments}
                    onFileUpload={() => {}}
                    allowUpload={false}
                  />
                </>
              )}
            </Box>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <Typography color="textSecondary">No data available</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            pt: 2,
            px: 3,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            color="secondary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AccreditatedRPLCourseTraineeSelectionIndex;
