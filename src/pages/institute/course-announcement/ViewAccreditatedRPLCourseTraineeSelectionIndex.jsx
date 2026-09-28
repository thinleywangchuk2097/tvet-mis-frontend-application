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
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  Tooltip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import PaymentIcon from "@mui/icons-material/Payment";
import DeleteIcon from "@mui/icons-material/Delete";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";

// -------- Shared imports --------
import {
  validateAssessmentInput,
  getAssessmentTooltipMessage,
} from "./shared/utils/assessmentHelpers";
import {
  mapRegisteredAssessors,
  buildAssignedAssessorsWithDetails,
  getAvailableAssessors,
  buildAssignmentRecord,
} from "./shared/utils/assessorHelpers";
import PaymentStatusCard from "./shared/components/PaymentStatusCard";
import AssessorAssignmentCard from "./shared/components/AssessorAssignmentCard";
import DeleteAssessorDialog from "./shared/components/DeleteAssessorDialog";
import ActionConfirmDialog from "./shared/components/ActionConfirmDialog";

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

  // Assessors
  const [assessors, setAssessors] = useState([]);
  const [selectedAssessor, setSelectedAssessor] = useState("");
  const [assignedAssessors, setAssignedAssessors] = useState([]);
  const [listAssignedAssessors, setListAssignedAssessors] = useState([]);

  // CA dates (only used when not present in courseDetails)
  const [caStartDate, setCaStartDate] = useState("");
  const [caEndDate, setCaEndDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Lookup
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});
  const [academicCompetency, setAcademicCompetency] = useState([]);
  const [competencyMap, setCompetencyMap] = useState({});

  // Assessments
  const [traineeTheoryAssessments, setTraineeTheoryAssessments] = useState({});
  const [traineePracticalAssessments, setTraineePracticalAssessments] =
    useState({});
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] =
    useState({});

  // Per-trainee remarks
  const [traineeRemarks, setTraineeRemarks] = useState({});

  const [allCAmarksExist, setAllCAmarksExist] = useState(false);

  // Dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  // Assessor delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessorToDelete, setAssessorToDelete] = useState(null);

  // Trainee delete dialog
  const [deleteTraineeDialogOpen, setDeleteTraineeDialogOpen] = useState(false);
  const [traineeToDelete, setTraineeToDelete] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  const hasCADatesInCourse =
    courseDetails?.ca_start_date && courseDetails?.ca_end_date;

  const [hasInternalAssessmentForCourse, setHasInternalAssessmentForCourse] =
    useState(false);

  const isServiceId39 = courseDetails?.service_id === "39";

  const isNumericCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  const isDiplomaCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // ============================================================
  // Assessment validation via shared helper
  // ============================================================
  const validateTheoryInput = (value) =>
    validateAssessmentInput(value, 20, isDiplomaCertificationLevel());
  const validatePracticalInput = (value) =>
    validateAssessmentInput(value, 60, isDiplomaCertificationLevel());
  const validateVivaInput = (value) =>
    validateAssessmentInput(value, 20, isDiplomaCertificationLevel());
  const validateVivaPracticalInput = (value) =>
    validateAssessmentInput(value, 60, isDiplomaCertificationLevel());

  // Max values kept local so existing call sites don't change
  const getTheoryMaxValue = () => (isDiplomaCertificationLevel() ? 20 : null);
  const getPracticalMaxValue = () =>
    isDiplomaCertificationLevel() ? 60 : null;
  const getVivaMaxValue = () => (isDiplomaCertificationLevel() ? 20 : null);
  const getVivaPracticalMaxValue = () =>
    isDiplomaCertificationLevel() ? 60 : null;

  const getTheoryTooltipMessage = () =>
    getAssessmentTooltipMessage("theory", isDiplomaCertificationLevel());
  const getPracticalTooltipMessage = () =>
    getAssessmentTooltipMessage("practical", isDiplomaCertificationLevel());
  const getVivaTooltipMessage = () =>
    getAssessmentTooltipMessage("viva", isDiplomaCertificationLevel());
  const getVivaPracticalTooltipMessage = () =>
    getAssessmentTooltipMessage("vivaPractical", isDiplomaCertificationLevel());

  // ============================================================
  // Business rules
  // ============================================================
  const isPaymentCompleted = () =>
    paymentStatus && paymentStatus.paymentStatus === "paid";

  const areCADatesValid = () => {
    if (hasCADatesInCourse) return true;
    return (
      caStartDate && caEndDate && new Date(caEndDate) >= new Date(caStartDate)
    );
  };

  const allTraineesHaveAssessments = () => {
    if (!hasInternalAssessmentForCourse) return true;

    return selectedTrainees.every((trainee) => {
      const hasInternalAssessment =
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== "";

      if (!hasInternalAssessment) return true;

      if (isServiceId39) {
        const vivaValue =
          traineeVivaAssessments[trainee.id] || trainee.viva_assessment || "";
        const practicalValue =
          traineeVivaPracticalAssessments[trainee.id] ||
          trainee.practical_assessment ||
          "";
        return (
          vivaValue &&
          vivaValue !== "" &&
          practicalValue &&
          practicalValue !== ""
        );
      } else {
        const theoryValue =
          traineeTheoryAssessments[trainee.id] ||
          trainee.theory_assessment ||
          "";
        const practicalValue =
          traineePracticalAssessments[trainee.id] ||
          trainee.practical_assessment ||
          "";
        return (
          theoryValue &&
          theoryValue !== "" &&
          practicalValue &&
          practicalValue !== ""
        );
      }
    });
  };

  const areAssessorsAssigned = () => {
    if (!allCAmarksExist) return false;
    return assignedAssessors.length > 0 || listAssignedAssessors.length > 0;
  };

  const isGeneratePAEnabled = () => {
    if (!allCAmarksExist) return false;
    return true;
  };

  const isSubmitEnabled = () => {
    if (!areCADatesValid()) return false;
    return true;
  };

  const shouldShowSubmitButton = () => !allCAmarksExist && currentRoleId == 9;

  const shouldShowApproveButton = () =>
    isPaymentCompleted() && currentRoleId == 9;

  const isApproveEnabled = () => {
    if (!areAssessorsAssigned()) return false;
    if (!allTraineesHaveAssessments()) return false;
    if (!areCADatesValid()) return false;
    return true;
  };

  const isEndorseEnabled = () => {
    if (!areCADatesValid()) return false;
    if (!isPaymentCompleted()) return false;
    if (!areAssessorsAssigned()) return false;
    if (!allTraineesHaveAssessments()) return false;
    return true;
  };

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

  const isAssessmentReadOnly = () =>
    !isPaymentCompleted() || currentRoleId == 22;

  const getServiceCodeByServiceId = useCallback((serviceId) => {
    if (!serviceId) return null;
    const serviceCodeMap = {
      39: 100586,
      37: 100584,
    };
    return serviceCodeMap[serviceId] || null;
  }, []);

  // ============================================================
  // Effects
  // ============================================================
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
    fetchAssessors();
    fetchPaymentStatus();
    fetchAssignedAssessors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      academicQualifications.length > 0 &&
      selectedStatusId &&
      academicCompetency.length > 0
    ) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    applicationNo,
    academicQualifications,
    selectedStatusId,
    academicCompetency,
  ]);

  useEffect(() => {
    if (courseDetails?.registration_no) {
      fetchInstituteData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseDetails]);

  useEffect(() => {
    checkCAmarksExist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainees]);

  useEffect(() => {
    if (listAssignedAssessors.length > 0 && assessors.length > 0) {
      setAssignedAssessors(
        buildAssignedAssessorsWithDetails(
          listAssignedAssessors,
          assessors,
          actionId,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listAssignedAssessors, assessors]);

  // ============================================================
  // Fetchers
  // ============================================================
  const fetchAcademicQualification = async () => {
    try {
      const response = await CommonService.getByParentId(18);
      const qualifications = response.data;
      setAcademicQualifications(qualifications);

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

      const map = {};
      competencies.forEach((comp) => {
        map[comp.id] = comp.name;
      });
      setCompetencyMap(map);
    } catch (error) {
      console.error("Error fetching academic competencies:", error);
    }
  };

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      const statuses = statusResponse.data;
      setStatusList(statuses);

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
      if (!courseData?.ca_start_date) setCaStartDate("");
      if (!courseData?.ca_end_date) setCaEndDate("");
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const fetchAssessors = async () => {
    try {
      const response =
        await UserRoleManagementService.getRegisteredAssessors(access_token);
      setAssessors(mapRegisteredAssessors(response.data));
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
    } catch (error) {
      console.error("Error fetching assigned assessors:", error);
      setListAssignedAssessors([]);
    }
  };

  const fetchInstituteData = async () => {
    try {
      if (!courseDetails?.registration_no) return;
      const response = await InstituteRegistrationService.getInstituteDetails(
        courseDetails.registration_no,
      );
      const data =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;
      setInstituteData(data);
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
      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setSelectedTrainees(selected);

      const hasInternal = selected.some(
        (trainee) =>
          trainee.internal_assessment !== null &&
          trainee.internal_assessment !== "",
      );
      setHasInternalAssessmentForCourse(hasInternal);

      const initialTheory = {};
      const initialPractical = {};
      const initialViva = {};
      const initialVivaPractical = {};
      const initialRemarks = {};

      selected.forEach((trainee) => {
        initialTheory[trainee.id] = trainee.theory_assessment || "";
        initialPractical[trainee.id] = trainee.practical_assessment || "";
        initialViva[trainee.id] = trainee.viva_assessment || "";
        if (isServiceId39) {
          initialVivaPractical[trainee.id] = trainee.practical_assessment || "";
        } else {
          initialVivaPractical[trainee.id] =
            trainee.viva_practical_assessment || "";
        }
        initialRemarks[trainee.id] = trainee.remarks || "";
      });

      setTraineeTheoryAssessments(initialTheory);
      setTraineePracticalAssessments(initialPractical);
      setTraineeVivaAssessments(initialViva);
      setTraineeVivaPracticalAssessments(initialVivaPractical);
      setTraineeRemarks(initialRemarks);

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

  const checkCAmarksExist = () => {
    if (selectedTrainees.length === 0) {
      setAllCAmarksExist(false);
      return;
    }
    const allHaveCA = selectedTrainees.every(
      (trainee) =>
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== "" &&
        trainee.internal_assessment !== undefined,
    );
    setAllCAmarksExist(allHaveCA);
  };

  // ============================================================
  // Trainee delete
  // ============================================================
  const handleDeleteTrainee = async () => {
    if (!traineeToDelete) return;

    setActionLoading(true);
    try {
      const payload = {
        traineeId: parseInt(traineeToDelete.id),
        statusId: 140,
        remarks: `Trainee ${traineeToDelete.applicant_name} removed from selected list`,
        updatedBy: actionId,
      };

      const response =
        await CourseEnrollmentService.removeTraineeFromSelectedProgramme(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Trainee ${traineeToDelete.applicant_name} removed successfully!`,
        );
        closeDeleteTraineeDialog();
        await fetchData();
      }
    } catch (error) {
      console.error("Error removing trainee:", error);
      toast.error(error.response?.data?.message || "Failed to remove trainee");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteTraineeDialog = (trainee) => {
    setTraineeToDelete(trainee);
    setDeleteTraineeDialogOpen(true);
  };

  const closeDeleteTraineeDialog = () => {
    setDeleteTraineeDialogOpen(false);
    setTraineeToDelete(null);
  };

  // ============================================================
  // Assessor assignment
  // ============================================================
  const handleAddAssessor = () => {
    if (!selectedAssessor) {
      toast.error("Please select an assessor to add");
      return;
    }

    if (
      assignedAssessors.some(
        (ass) => ass.id.toString() === selectedAssessor.toString(),
      )
    ) {
      toast.error("This assessor is already assigned");
      return;
    }

    const selectedAssessorDetails = assessors.find(
      (ass) => ass.id.toString() === selectedAssessor.toString(),
    );

    if (!selectedAssessorDetails) {
      toast.error("Selected assessor not found");
      return;
    }

    setAssignedAssessors((prev) => [
      ...prev,
      buildAssignmentRecord(selectedAssessorDetails, actionId),
    ]);
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

  // ============================================================
  // Assessment change handlers
  // ============================================================
  const handleTheoryAssessmentChange = (traineeId, value) => {
    if (isDiplomaCertificationLevel()) {
      if (validateTheoryInput(value)) {
        setTraineeTheoryAssessments((prev) => ({
          ...prev,
          [traineeId]: value,
        }));
      }
    } else {
      setTraineeTheoryAssessments((prev) => ({
        ...prev,
        [traineeId]: value,
      }));
    }
  };

  const handlePracticalAssessmentChange = (traineeId, value) => {
    if (isDiplomaCertificationLevel()) {
      if (validatePracticalInput(value)) {
        setTraineePracticalAssessments((prev) => ({
          ...prev,
          [traineeId]: value,
        }));
      }
    } else {
      setTraineePracticalAssessments((prev) => ({
        ...prev,
        [traineeId]: value,
      }));
    }
  };

  const handleVivaAssessmentChange = (traineeId, value) => {
    if (isServiceId39 && isDiplomaCertificationLevel()) {
      if (validateVivaInput(value)) {
        setTraineeVivaAssessments((prev) => ({
          ...prev,
          [traineeId]: value,
        }));
      }
    } else {
      setTraineeVivaAssessments((prev) => ({
        ...prev,
        [traineeId]: value,
      }));
    }
  };

  const handleVivaPracticalAssessmentChange = (traineeId, value) => {
    if (isServiceId39 && isDiplomaCertificationLevel()) {
      if (validateVivaPracticalInput(value)) {
        setTraineeVivaPracticalAssessments((prev) => ({
          ...prev,
          [traineeId]: value,
        }));
      }
    } else {
      setTraineeVivaPracticalAssessments((prev) => ({
        ...prev,
        [traineeId]: value,
      }));
    }
  };

  const handleRemarksChange = (traineeId, value) => {
    setTraineeRemarks((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // ============================================================
  // Payment
  // ============================================================
  const handleGeneratePA = () => {
    if (!courseDetails) {
      toast.error("Course data not found");
      return;
    }

    const institute =
      Array.isArray(instituteData) && instituteData.length > 0
        ? instituteData[0]
        : instituteData;

    const taxPayerEmail =
      institute?.email_id || courseDetails.institute_email || "N/A";
    const taxPayerMobileNo =
      institute?.mobile_no || courseDetails.institue_mobile_number || "N/A";
    const instituteId =
      institute?.institute_id || courseDetails.registration_no || "N/A";
    const applicationNoLocal = courseDetails.application_no;

    const serviceCode = getServiceCodeByServiceId(courseDetails?.service_id);
    if (!serviceCode) {
      toast.error("Unsupported service for payment generation");
      return;
    }

    const taxPayerNo = courseDetails.registration_no || "N/A";
    const taxPayerName = courseDetails.institute_name || "N/A";

    navigate(
      `/birms/common-payment-index/${applicationNoLocal}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  };

  const handleRedirectToPayment = (redirectUrl) => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      toast.error("No redirect URL available");
    }
  };

  // ============================================================
  // Lookups / formatting
  // ============================================================
  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    return qualificationMap[qualificationId] || qualificationId;
  };

  const getCompetencyName = (competencyId) => {
    if (!competencyId) return "N/A";
    return competencyMap[competencyId] || competencyId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // ============================================================
  // Marks parsing
  // ============================================================
  const parseInternalAssessment = (trainee) => {
    if (!trainee.internal_assessment) return null;
    return isNumericCertificationLevel()
      ? parseInt(trainee.internal_assessment)
      : trainee.internal_assessment;
  };

  const parseTheory = (trainee) => {
    const raw = traineeTheoryAssessments[trainee.id];
    if (!raw) return null;
    return isNumericCertificationLevel() ? parseInt(raw) : raw;
  };

  const parsePractical = (trainee) => {
    const raw = traineePracticalAssessments[trainee.id];
    if (!raw) return null;
    return isNumericCertificationLevel() ? parseInt(raw) : raw;
  };

  const parseViva = (trainee) => {
    const raw = traineeVivaAssessments[trainee.id];
    if (!raw) return null;
    return isNumericCertificationLevel() ? parseInt(raw) : raw;
  };

  const parseVivaPractical = (trainee) => {
    const raw = traineeVivaPracticalAssessments[trainee.id];
    if (!raw) return null;
    return isNumericCertificationLevel() ? parseInt(raw) : raw;
  };

  // ============================================================
  // Actions
  // ============================================================
  const handleAction = async () => {
    if (currentAction === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    if (isDiplomaCertificationLevel() && hasInternalAssessmentForCourse) {
      if (isServiceId39) {
        const invalidViva = selectedTrainees.some((trainee) => {
          const value = traineeVivaAssessments[trainee.id];
          if (value && value !== "") {
            const numValue = Number(value);
            return numValue < 0 || numValue > 20;
          }
          return false;
        });
        if (invalidViva) {
          toast.error("Viva Assessment must be between 0 and 20 for diploma");
          return;
        }

        const invalidVivaPractical = selectedTrainees.some((trainee) => {
          const value = traineeVivaPracticalAssessments[trainee.id];
          if (value && value !== "") {
            const numValue = Number(value);
            return numValue < 0 || numValue > 60;
          }
          return false;
        });
        if (invalidVivaPractical) {
          toast.error(
            "Practical Assessment must be between 0 and 60 for diploma",
          );
          return;
        }
      } else {
        const invalidTheory = selectedTrainees.some((trainee) => {
          const value = traineeTheoryAssessments[trainee.id];
          if (value && value !== "") {
            const numValue = Number(value);
            return numValue < 0 || numValue > 20;
          }
          return false;
        });
        if (invalidTheory) {
          toast.error("Theory Assessment must be between 0 and 20 for diploma");
          return;
        }

        const invalidPractical = selectedTrainees.some((trainee) => {
          const value = traineePracticalAssessments[trainee.id];
          if (value && value !== "") {
            const numValue = Number(value);
            return numValue < 0 || numValue > 60;
          }
          return false;
        });
        if (invalidPractical) {
          toast.error(
            "Practical Assessment must be between 0 and 60 for diploma",
          );
          return;
        }
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: currentAction,
        certificationLevelId: courseDetails?.certification_level_id,
        courseName: courseDetails?.course_name,
        serviceId: courseDetails?.service_id
          ? parseInt(courseDetails.service_id)
          : null,
        assignedRoleId: currentRoleId,
        remarks:
          currentAction === 58 ? remarks : remarks || "Application submitted",
      };

      if (!hasCADatesInCourse) {
        if (caStartDate && caEndDate) {
          payload.caStartDate = caStartDate;
          payload.caEndDate = caEndDate;
        }
      }

      if (hasInternalAssessmentForCourse && !isServiceId39) {
        const traineeMarksList = selectedTrainees
          .filter(
            (trainee) =>
              trainee.internal_assessment !== null &&
              trainee.internal_assessment !== "",
          )
          .map((trainee) => ({
            traineeId: parseInt(trainee.id),
            internalAssessment: parseInternalAssessment(trainee),
            theoryAssessment: parseTheory(trainee),
            practicalAssessment: parsePractical(trainee),
            remarks: traineeRemarks[trainee.id] || null,
          }));
        if (traineeMarksList.length > 0) payload.traineeMarks = traineeMarksList;
      }

      if (isServiceId39 && hasInternalAssessmentForCourse) {
        const traineeVivaList = selectedTrainees
          .filter(
            (trainee) =>
              trainee.internal_assessment !== null &&
              trainee.internal_assessment !== "",
          )
          .map((trainee) => ({
            traineeId: parseInt(trainee.id),
            internalAssessment: parseInternalAssessment(trainee),
            vivaAssessment: parseViva(trainee),
            practicalAssessment: parseVivaPractical(trainee),
            remarks: traineeRemarks[trainee.id] || null,
          }));
        if (traineeVivaList.length > 0)
          payload.traineeVivaAssessments = traineeVivaList;
      }

      if (assignedAssessors.length > 0) {
        payload.assignedAssessors = assignedAssessors.map((ass) => ({
          userId: ass.userId,
        }));
      }

      const response = await CourseEnrollmentService.updateTraineeApplication(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        const actionName =
          currentAction === 139
            ? "Set CA Date"
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
    return (
      statusId === 139 || statusId === 57 || statusId === 58 || statusId === 59
    );
  };

  const getDialogTitle = () => {
    if (currentAction === 139) return "Set CA Date Course Selection";
    if (currentAction === 57) return "Approve Course Selection";
    if (currentAction === 59) return "Endorse Course Selection";
    return "Reject Course Selection";
  };

  const getConfirmButtonColor = () => {
    if (currentAction === 139) return "primary";
    if (currentAction === 57) return "success";
    if (currentAction === 59) return "info";
    return "error";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return undefined;
    if (currentAction === 139) return "Confirm Set CA Date";
    if (currentAction === 57) return "Confirm Approve";
    if (currentAction === 59) return "Confirm Endorse";
    return "Confirm Reject";
  };

  const handleRefresh = () => {
    fetchData();
    fetchPaymentStatus();
    toast.info("Data refreshed");
  };

  const handleGoBack = () => navigate(-1);

  const filteredTrainees = selectedTrainees.filter(
    (trainee) =>
      trainee.applicant_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trainee.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.mobile_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.cid_no?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleChangePage = (event, newPage) => setPage(newPage);

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

  const getTableColSpan = () => {
    let cols = 6;
    if (hasCADatesInCourse) cols++;
    if (hasInternalAssessmentForCourse) {
      if (isServiceId39) {
        cols += 2;
      } else {
        cols += 2;
      }
      cols++;
      if (isNumericCertificationLevel() && !isServiceId39) cols++;
    }
    if (!isActionDisabled() && currentRoleId == 9) cols++;
    return cols;
  };

  const availableAssessors = getAvailableAssessors(
    assessors,
    assignedAssessors,
  );

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

  // ============================================================
  // Dialog body — extracted for readability
  // ============================================================
  const getDialogBody = () => {
    const getCommonContent = (actionText) => (
      <div>
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
              {actionText === "Set CA Date"
                ? "values will be saved"
                : "assessments will be saved"}{" "}
              with this {actionText}.
            </strong>
          </>
        )}
      </div>
    );

    if (currentAction === 139) return getCommonContent("Set CA Date");
    if (currentAction === 57) return getCommonContent("approve");
    if (currentAction === 59) return getCommonContent("endorse");

    // Reject — includes remarks textarea handled by ActionConfirmDialog
    return (
      <div>
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
      </div>
    );
  };

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

      <PaymentStatusCard
        paymentStatus={paymentStatus}
        isPaymentCompleted={isPaymentCompleted}
        onRedirectToPayment={handleRedirectToPayment}
        formatDate={formatDate}
      />

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

      {/* CA Dates Section — only when not in courseDetails */}
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
                  slotProps={{ inputLabel: { shrink: true } }}
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
                    input: { inputProps: { min: caStartDate || undefined } },
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

      {/* Assessor Assignment Section */}
      {allCAmarksExist && !isActionDisabled() && (
        <AssessorAssignmentCard
          canEdit={currentRoleId == 9}
          assignedAssessors={assignedAssessors}
          availableAssessors={availableAssessors}
          allAssessors={assessors}
          selectedAssessor={selectedAssessor}
          selectedAssessorDetails={selectedAssessorDetails}
          onSelectAssessor={setSelectedAssessor}
          onAddAssessor={handleAddAssessor}
          onOpenDeleteDialog={openDeleteAssessorDialog}
        />
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
                  {hasCADatesInCourse && (
                    <TableCell>Internal Assessment</TableCell>
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
                  {!isActionDisabled() && currentRoleId == 9 && (
                    <TableCell align="center">Action</TableCell>
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

                      let theoryValue = 0;
                      let practicalValue = 0;
                      if (isNumericCertificationLevel() && !isServiceId39) {
                        theoryValue =
                          parseInt(traineeTheoryAssessments[trainee.id]) || 0;
                        practicalValue =
                          parseInt(traineePracticalAssessments[trainee.id]) ||
                          0;
                      }
                      const totalValue = theoryValue + practicalValue;

                      const getReadOnlyTooltip = () => {
                        if (currentRoleId == 22) {
                          return "Assessment fields are read-only for Endorser role";
                        }
                        if (!isPaymentCompleted()) {
                          return "Payment must be completed to edit assessment";
                        }
                        return "";
                      };

                      const getCompetencyColor = (value) => {
                        if (value === "91") return "success";
                        if (value === "92") return "warning";
                        if (value === "93") return "error";
                        return "info";
                      };

                      const theoryAssessmentValue =
                        traineeTheoryAssessments[trainee.id] ||
                        trainee.theory_assessment ||
                        "";

                      const practicalAssessmentValue =
                        traineePracticalAssessments[trainee.id] ||
                        trainee.practical_assessment ||
                        "";

                      const vivaAssessmentValue =
                        traineeVivaAssessments[trainee.id] ||
                        trainee.viva_assessment ||
                        "";

                      const vivaPracticalAssessmentValue =
                        traineeVivaPracticalAssessments[trainee.id] ||
                        (isServiceId39
                          ? trainee.practical_assessment
                          : trainee.viva_practical_assessment) ||
                        "";

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
                                  color={getCompetencyColor(
                                    trainee.internal_assessment,
                                  )}
                                />
                              )}
                            </TableCell>
                          )}
                          {hasInternalAssessmentForCourse && (
                            <>
                              {/* Theory/Viva Assessment */}
                              <TableCell>
                                {hasInternalAssessment ? (
                                  isNumericCertificationLevel() ? (
                                    isServiceId39 ? (
                                      <Tooltip
                                        title={
                                          isDiplomaCertificationLevel()
                                            ? getVivaTooltipMessage()
                                            : getReadOnlyTooltip()
                                        }
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={vivaAssessmentValue}
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
                                              inputProps: {
                                                min: 0,
                                                max: isDiplomaCertificationLevel()
                                                  ? 20
                                                  : 100,
                                              },
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
                                        title={
                                          isDiplomaCertificationLevel()
                                            ? getTheoryTooltipMessage()
                                            : getReadOnlyTooltip()
                                        }
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={theoryAssessmentValue}
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
                                              inputProps: {
                                                min: 0,
                                                max: isDiplomaCertificationLevel()
                                                  ? 20
                                                  : 100,
                                              },
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
                                              ? vivaAssessmentValue
                                              : theoryAssessmentValue
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

                              {/* Practical Assessment */}
                              <TableCell>
                                {hasInternalAssessment ? (
                                  isNumericCertificationLevel() ? (
                                    isServiceId39 ? (
                                      <Tooltip
                                        title={
                                          isDiplomaCertificationLevel()
                                            ? getVivaPracticalTooltipMessage()
                                            : getReadOnlyTooltip()
                                        }
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={vivaPracticalAssessmentValue}
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
                                              inputProps: {
                                                min: 0,
                                                max: isDiplomaCertificationLevel()
                                                  ? 60
                                                  : 100,
                                              },
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
                                        title={
                                          isDiplomaCertificationLevel()
                                            ? getPracticalTooltipMessage()
                                            : getReadOnlyTooltip()
                                        }
                                        arrow
                                      >
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={practicalAssessmentValue}
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
                                              inputProps: {
                                                min: 0,
                                                max: isDiplomaCertificationLevel()
                                                  ? 60
                                                  : 100,
                                              },
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
                                              ? vivaPracticalAssessmentValue
                                              : practicalAssessmentValue
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

                              {/* Remarks */}
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
                          {!isActionDisabled() && currentRoleId == 9 && (
                            <TableCell align="center">
                              <Tooltip
                                title={
                                  trainee.internal_assessment === 0 ||
                                  trainee.internal_assessment === 93
                                    ? "Remove this trainee from the selected list"
                                    : "Trainee can only be deleted when Internal Assessment is 0 or 93"
                                }
                                arrow
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      openDeleteTraineeDialog(trainee)
                                    }
                                    disabled={
                                      !(
                                        trainee.internal_assessment === 0 ||
                                        trainee.internal_assessment === 93
                                      )
                                    }
                                    sx={{
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(211, 47, 47, 0.04)",
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
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

      {/* Action Buttons Bar */}
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
            {shouldShowSubmitButton() && (
              <Tooltip
                title={
                  !isSubmitEnabled()
                    ? getSubmitValidationMessage()
                    : "Set CA Date this course selection"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openDialog(139)}
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
                    Set CA Date
                  </Button>
                </span>
              </Tooltip>
            )}

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
      <ActionConfirmDialog
        open={actionDialogOpen}
        title={getDialogTitle()}
        bodyText={getDialogBody()}
        showRemarks={currentAction === 58}
        remarks={remarks}
        remarksError={remarksError}
        onRemarksChange={(v) => {
          setRemarks(v);
          setRemarksError("");
        }}
        confirmColor={getConfirmButtonColor()}
        confirmText={getConfirmButtonText()}
        loading={actionLoading}
        onClose={closeDialog}
        onConfirm={handleAction}
      />

      {/* Delete Assessor Confirmation Dialog */}
      <DeleteAssessorDialog
        open={deleteDialogOpen}
        assessor={assessorToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteAssessor}
      />

      {/* Delete Trainee Confirmation Dialog */}
      <Dialog
        open={deleteTraineeDialogOpen}
        onClose={closeDeleteTraineeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {traineeToDelete && (
              <>
                Are you sure you want to remove{" "}
                <strong>{traineeToDelete?.applicant_name}</strong> from the
                selected trainees list?
                <br />
                <br />
                <strong>CID/Reference:</strong>{" "}
                {traineeToDelete?.cid_no || traineeToDelete?.reference_no}
                <br />
                <strong>Email:</strong> {traineeToDelete?.email_id}
                <br />
                <strong>Contact:</strong> {traineeToDelete?.mobile_no}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={closeDeleteTraineeDialog}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTrainee}
            color="error"
            variant="contained"
            size="small"
            startIcon={<DeleteIcon />}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ViewAccreditatedRPLCourseTraineeSelectionIndex;