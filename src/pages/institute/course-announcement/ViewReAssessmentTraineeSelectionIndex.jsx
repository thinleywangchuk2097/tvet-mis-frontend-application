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
  MenuItem,
  Select,
  FormControl,
  Tooltip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
import SectionCard from "./shared/components/SectionCard";
import GeneratePaymentButton from "./shared/components/GeneratePaymentButton";

const ViewReAssessmentTraineeSelectionIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [instituteData, setInstituteData] = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [currentStatusId, setCurrentStatusId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Assessor states
  const [assessors, setAssessors] = useState([]);
  const [selectedAssessor, setSelectedAssessor] = useState("");
  const [assignedAssessors, setAssignedAssessors] = useState([]);
  const [listAssignedAssessors, setListAssignedAssessors] = useState([]);

  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});
  const [academicCompetency, setAcademicCompetency] = useState([]);
  const [competencyMap, setCompetencyMap] = useState({});

  const [traineeTheoryAssessments, setTraineeTheoryAssessments] = useState({});
  const [traineePracticalAssessments, setTraineePracticalAssessments] =
    useState({});
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] =
    useState({});

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessorToDelete, setAssessorToDelete] = useState(null);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  const isRole9 = Number(currentRoleId) === 9;
  const isRole22 = Number(currentRoleId) === 22;

  const isPaymentCompleted = () =>
    paymentStatus && paymentStatus.paymentStatus === "paid";

  const isEditable = isRole9 && isPaymentCompleted();

  const [hasInternalAssessmentForCourse, setHasInternalAssessmentForCourse] =
    useState(false);

  const isServiceId41 = serviceId === "41";

  const isDiplomaCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // Assessment validation via shared helper
  const validateTheoryInput = (value) =>
    validateAssessmentInput(value, 20, isDiplomaCertificationLevel());
  const validatePracticalInput = (value) =>
    validateAssessmentInput(value, 60, isDiplomaCertificationLevel());
  const validateVivaInput = (value) =>
    validateAssessmentInput(value, 20, isDiplomaCertificationLevel());
  const validateVivaPracticalInput = (value) =>
    validateAssessmentInput(value, 60, isDiplomaCertificationLevel());

  const getTheoryTooltipMessage = () =>
    getAssessmentTooltipMessage("theory", isDiplomaCertificationLevel());
  const getPracticalTooltipMessage = () =>
    getAssessmentTooltipMessage("practical", isDiplomaCertificationLevel());
  const getVivaTooltipMessage = () =>
    getAssessmentTooltipMessage("viva", isDiplomaCertificationLevel());
  const getVivaPracticalTooltipMessage = () =>
    getAssessmentTooltipMessage("vivaPractical", isDiplomaCertificationLevel());

  const getTheoryMaxValue = () => (isDiplomaCertificationLevel() ? 20 : null);
  const getPracticalMaxValue = () =>
    isDiplomaCertificationLevel() ? 60 : null;
  const getVivaMaxValue = () => (isDiplomaCertificationLevel() ? 20 : null);
  const getVivaPracticalMaxValue = () =>
    isDiplomaCertificationLevel() ? 60 : null;

  // Business rules
  const allCAmarksExist = () => {
    if (selectedTrainees.length === 0) return false;
    return selectedTrainees.every(
      (trainee) =>
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== "" &&
        trainee.internal_assessment !== undefined,
    );
  };

  const areAssessorsAssigned = () => {
    return assignedAssessors.length > 0 || listAssignedAssessors.length > 0;
  };

  const allTraineesHaveAssessments = () => {
    if (!hasInternalAssessmentForCourse) return true;

    return selectedTrainees.every((trainee) => {
      const hasInternalAssessment =
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== "";

      if (!hasInternalAssessment) return true;

      if (isServiceId41) {
        const viva =
          traineeVivaAssessments[trainee.id] || trainee.viva_assessment || "";
        const practical =
          traineeVivaPracticalAssessments[trainee.id] ||
          trainee.practical_assessment ||
          "";
        return viva && viva !== "" && practical && practical !== "";
      } else {
        const theory =
          traineeTheoryAssessments[trainee.id] ||
          trainee.theory_assessment ||
          "";
        const practical =
          traineePracticalAssessments[trainee.id] ||
          trainee.practical_assessment ||
          "";
        return theory && theory !== "" && practical && practical !== "";
      }
    });
  };

  const isGeneratePAEnabled = () => allCAmarksExist();

  const isApproveEnabled = () =>
    areAssessorsAssigned() && allTraineesHaveAssessments();

  const isEndorseEnabled = () =>
    isPaymentCompleted() &&
    areAssessorsAssigned() &&
    allTraineesHaveAssessments();

  const getAssessmentDisabledTooltip = () => {
    if (!isRole9) return "You do not have permission to edit assessments";
    if (!isPaymentCompleted())
      return "Payment must be completed before editing assessments";
    return "";
  };

  const getApproveDisabledTooltip = () => {
    if (currentStatusId === 57) return "Already approved";
    if (currentStatusId === 58) return "Already rejected";
    if (currentStatusId === 59) return "Already endorsed";
    if (!isRole9) return "Only reviewers can approve";
    if (!isPaymentCompleted())
      return "Payment must be completed before approval";
    if (!areAssessorsAssigned())
      return "At least one assessor must be assigned before approval";
    if (!allTraineesHaveAssessments())
      return "All trainees must have assessment values before approval";
    return "";
  };

  const getEndorseDisabledTooltip = () => {
    if (currentStatusId === 59) return "Already endorsed";
    if (currentStatusId === 57) return "Already approved";
    if (currentStatusId === 58) return "Already rejected";
    if (!isPaymentCompleted())
      return "Payment must be completed before endorsement";
    if (!areAssessorsAssigned())
      return "At least one assessor must be assigned before endorsement";
    if (!allTraineesHaveAssessments())
      return "All trainees must have assessment values before endorsement";
    return "";
  };

  const getServiceCodeByServiceId = useCallback((id) => {
    if (!id) return null;
    const serviceCodeMap = {
      42: 100585,
      41: 100587,
    };
    return serviceCodeMap[id] || null;
  }, []);

  // Effects
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
    fetchPaymentStatus();
    fetchAssessors();
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

  // Fetchers
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

  const fetchAssessors = async () => {
    try {
      const response =
        await UserRoleManagementService.getRegisteredAssessors(access_token);
      setAssessors(mapRegisteredAssessors(response.data));
    } catch (error) {
      console.error("Error fetching Assessors:", error);
      setAssessors([]);
    }
  };

  const fetchAssignedAssessors = async () => {
    try {
      const response = await CourseEnrollmentService.fetchAssignedAssessors(
        applicationNo,
        access_token,
      );
      setListAssignedAssessors(response.data || []);
    } catch (error) {
      console.error("Error fetching assigned assessors:", error);
      setListAssignedAssessors([]);
    }
  };

  const fetchInstituteData = async () => {
    try {
      const identifier = courseDetails?.registration_no;
      if (!identifier) return;

      const response =
        await InstituteRegistrationService.getInstituteDetails(identifier);

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

  const fetchData = async () => {
    await fetchCourseDetails();
    await fetchReAssessmentSelectedTrainees();
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await CommonService.getReAssessmentAnnouncementByApplicationNo(
          applicationNo,
        );
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(courseData);
      setServiceId(courseData?.service_id);
      setCurrentStatusId(courseData?.status_id);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const fetchReAssessmentSelectedTrainees = async () => {
    try {
      setLoading(true);
      const response =
        await CourseEnrollmentService.getCourseAppliedTraineesReAssessmentByApplicationNo(
          applicationNo,
        );

      const trainees = response.data || [];

      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setSelectedTrainees(selected);

      const hasInternal = selected.length > 0;
      setHasInternalAssessmentForCourse(hasInternal);

      const initialTheory = {};
      const initialPractical = {};
      const initialViva = {};
      const initialVivaPractical = {};

      selected.forEach((trainee) => {
        initialTheory[trainee.id] = trainee.theory_assessment || "";
        initialPractical[trainee.id] = trainee.practical_assessment || "";
        initialViva[trainee.id] = trainee.viva_assessment || "";
        initialVivaPractical[trainee.id] = trainee.practical_assessment || "";
      });

      setTraineeTheoryAssessments(initialTheory);
      setTraineePracticalAssessments(initialPractical);
      setTraineeVivaAssessments(initialViva);
      setTraineeVivaPracticalAssessments(initialVivaPractical);
    } catch (error) {
      console.error("Error fetching selected trainees:", error);
      toast.error("Failed to fetch selected trainees");
    } finally {
      setLoading(false);
    }
  };

  // Assessor assignment
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

  // Assessment change handlers
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
    if (isServiceId41 && isDiplomaCertificationLevel()) {
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
    if (isServiceId41 && isDiplomaCertificationLevel()) {
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

  // Lookups
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

  // Payment
  const handleGeneratePA = () => {
    if (!courseDetails) {
      toast.error("Course data not found");
      return;
    }

    const institute =
      Array.isArray(instituteData) && instituteData.length > 0
        ? instituteData[0]
        : instituteData;

    const applicationNoLocal = courseDetails.application_no;
    const serviceCode = getServiceCodeByServiceId(courseDetails?.service_id);

    if (!serviceCode) {
      toast.error("Unsupported service for payment generation");
      return;
    }

    const taxPayerNo =
      institute?.registration_no || courseDetails.registration_no || "N/A";
    const taxPayerEmail =
      institute?.email_id || courseDetails.institute_email || "N/A";
    const taxPayerMobileNo =
      institute?.mobile_no ||
      institute?.telephone_no ||
      courseDetails.institue_mobile_number ||
      "N/A";
    const taxPayerName =
      institute?.proposed_institute_name ||
      courseDetails.institute_name ||
      "N/A";
    const instituteId =
      institute?.institute_id ||
      courseDetails.institute_id ||
      courseDetails.registration_no ||
      "N/A";

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

  // Marks parsing
  const parseInternalAssessment = (trainee) => {
    const raw = trainee.internal_assessment;
    if (raw === null || raw === undefined || raw === "") return null;
    if (courseDetails?.certification_level_id === "36") {
      return parseInt(raw);
    }
    return raw;
  };

  const parseTheory = (trainee) => {
    if (isServiceId41) return null;
    const raw = traineeTheoryAssessments[trainee.id];
    if (!raw) return null;
    if (courseDetails?.certification_level_id === "36") {
      return parseInt(raw);
    }
    return raw;
  };

  const parsePractical = (trainee) => {
    if (isServiceId41) return null;
    const raw = traineePracticalAssessments[trainee.id];
    if (!raw) return null;
    if (courseDetails?.certification_level_id === "36") {
      return parseInt(raw);
    }
    return raw;
  };

  const parseViva = (trainee) => {
    const raw = traineeVivaAssessments[trainee.id];
    return raw ? parseInt(raw) : null;
  };

  const parseVivaPractical = (trainee) => {
    const raw = traineeVivaPracticalAssessments[trainee.id];
    return raw ? parseInt(raw) : null;
  };

  // Actions
  const handleAction = async () => {
    if (isDiplomaCertificationLevel() && hasInternalAssessmentForCourse) {
      if (isServiceId41) {
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
        serviceId: serviceId ? parseInt(serviceId) : null,
        assignedRoleId: currentRoleId,
        remarks:
          currentAction === 59
            ? "Application endorsed"
            : "Application approved",
      };

      if (hasInternalAssessmentForCourse) {
        const traineeMarksList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment: parseInternalAssessment(trainee),
          theoryAssessment: parseTheory(trainee),
          practicalAssessment: parsePractical(trainee),
        }));

        if (traineeMarksList.length > 0) {
          payload.traineeMarks = traineeMarksList;
        }
      }

      if (isServiceId41 && hasInternalAssessmentForCourse) {
        const traineeVivaList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment: parseInternalAssessment(trainee),
          vivaAssessment: parseViva(trainee),
          practicalAssessment: parseVivaPractical(trainee),
        }));

        if (traineeVivaList.length > 0) {
          payload.traineeVivaAssessments = traineeVivaList;
        }
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
        toast.success(
          currentAction === 59
            ? "Course selection endorsed successfully!"
            : "Course selection approved successfully!",
        );
        closeDialog();
        await fetchData();
        await fetchAssignedAssessors();
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error("Error processing course selection:", error);
      toast.error(
        error.response?.data?.message || "Failed to process course selection",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (action) => {
    setCurrentAction(action);
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setCurrentAction(null);
  };

  const isActionDisabled = () => {
    const statusId = currentStatusId;
    return statusId === 57 || statusId === 58 || statusId === 59;
  };

  const getDialogTitle = () => {
    if (currentAction === 59) return "Endorse Course Selection";
    return "Approve Course Selection";
  };

  const getConfirmButtonColor = () => {
    return currentAction === 59 ? "info" : "success";
  };

  const handleRefresh = () => {
    fetchData();
    fetchPaymentStatus();
    fetchAssignedAssessors();
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
      textAlign: "center",
    },
    "& th": {
      fontWeight: 600,
      backgroundColor: "#f5f5f5",
    },
  };

  const getTableColSpan = () => {
    let cols = 6;
    if (hasInternalAssessmentForCourse) {
      cols += 1;
      cols += 2;
    }
    return cols;
  };

  const renderAssessmentColumn = (trainee) => {
    const isNumeric =
      courseDetails?.certification_level_id === "111" ||
      courseDetails?.certification_level_id === "112";
    const isVivaType = isServiceId41;

    const readOnly = !isEditable;

    const getAssessmentConfig = () => {
      if (isVivaType) {
        return {
          firstField: {
            value: traineeVivaAssessments[trainee.id] || "",
            onChange: (value) => handleVivaAssessmentChange(trainee.id, value),
            maxValue: getVivaMaxValue() || 100,
            tooltipMessage: getVivaTooltipMessage(),
          },
          secondField: {
            value: traineeVivaPracticalAssessments[trainee.id] || "",
            onChange: (value) =>
              handleVivaPracticalAssessmentChange(trainee.id, value),
            maxValue: getVivaPracticalMaxValue() || 100,
            tooltipMessage: getVivaPracticalTooltipMessage(),
          },
        };
      } else {
        return {
          firstField: {
            value: traineeTheoryAssessments[trainee.id] || "",
            onChange: (value) =>
              handleTheoryAssessmentChange(trainee.id, value),
            maxValue: getTheoryMaxValue() || 100,
            tooltipMessage: getTheoryTooltipMessage(),
          },
          secondField: {
            value: traineePracticalAssessments[trainee.id] || "",
            onChange: (value) =>
              handlePracticalAssessmentChange(trainee.id, value),
            maxValue: getPracticalMaxValue() || 100,
            tooltipMessage: getPracticalTooltipMessage(),
          },
        };
      }
    };

    const config = getAssessmentConfig();

    const renderAssessmentField = (fieldConfig, isNumericField) => {
      const disabledTooltip = getAssessmentDisabledTooltip();
      const maxValueTooltip = fieldConfig.tooltipMessage;
      const tooltipMsg = disabledTooltip || maxValueTooltip || "";

      const fieldContent = isNumericField ? (
        <TextField
          type="number"
          size="small"
          value={fieldConfig.value}
          onChange={(e) => fieldConfig.onChange(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              readOnly: readOnly,
              inputProps: {
                min: 0,
                max: fieldConfig.maxValue,
              },
            },
          }}
          sx={{
            minWidth: 120,
            backgroundColor: readOnly ? "#f5f5f5" : "transparent",
          }}
        />
      ) : (
        <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
          <Select
            value={fieldConfig.value}
            onChange={(e) => fieldConfig.onChange(e.target.value)}
            displayEmpty
            readOnly={readOnly}
            sx={{
              "& .MuiSelect-select": { textAlign: "center" },
              backgroundColor: readOnly ? "#f5f5f5" : "transparent",
            }}
          >
            <MenuItem value="" disabled>
              <em>Select Competency</em>
            </MenuItem>
            {academicCompetency.map((competency) => (
              <MenuItem key={competency.id} value={competency.id}>
                {competency.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

      return tooltipMsg ? (
        <Tooltip title={tooltipMsg} arrow>
          <span style={{ display: "inline-block", width: "100%" }}>
            {fieldContent}
          </span>
        </Tooltip>
      ) : (
        fieldContent
      );
    };

    return (
      <>
        <TableCell align="center">
          {renderAssessmentField(config.firstField, isNumeric)}
        </TableCell>
        <TableCell align="center">
          {renderAssessmentField(config.secondField, isNumeric)}
        </TableCell>
      </>
    );
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

  // Dialog derived values — declared before use
  const dialogActionText = currentAction === 59 ? "endorse" : "approve";
  const dialogAssessmentsLabel = isServiceId41
    ? "Viva and Practical"
    : "Theory and Practical";

  let confirmButtonText;
  if (actionLoading) {
    confirmButtonText = undefined;
  } else if (currentAction === 59) {
    confirmButtonText = "Confirm Endorse";
  } else {
    confirmButtonText = "Confirm Approve";
  }

  const dialogBody = (
    <div>
      Are you sure you want to {dialogActionText} this course selection?
      <br />
      <strong>Application No: {applicationNo}</strong>
      <br />
      <strong>Course Name: {courseDetails?.course_name}</strong>
      <br />
      <strong>Total Selected Trainees: {selectedTrainees.length}</strong>
      <br />
      <strong>Assigned Assessors: {assignedAssessors.length}</strong>
      {paymentStatus?.paymentAdviceNo && (
        <>
          <br />
          <strong>Payment Advice No: {paymentStatus.paymentAdviceNo}</strong>
        </>
      )}
      {hasInternalAssessmentForCourse && (
        <>
          <br />
          <br />
          <strong>
            Note: {dialogAssessmentsLabel} assessments will be saved with this{" "}
            {dialogActionText === "endorse" ? "endorsement" : "approval"}.
          </strong>
        </>
      )}
    </div>
  );

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" gutterBottom>
          Re-Assessment Trainee Selection
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

      {courseDetails && (
        <SectionCard title="Programme Information">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Application No:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {courseDetails.application_no}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Course Name:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {courseDetails.course_name}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Seats:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {courseDetails.enrollment_capacity}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Selected Count:
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="green">
                {selectedTrainees.length}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Fees Per Trainee:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                Nu. {courseDetails.fees_per_trainee}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Certification Level:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {courseDetails.certification_name}
              </Typography>
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {/* Assessor Assignment Section */}
      {allCAmarksExist() && !isActionDisabled() && (
        <AssessorAssignmentCard
          canEdit={isRole9}
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

      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            Selected Trainees for Re-Assessment
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
                  <TableCell align="center">#</TableCell>
                  <TableCell align="center">Name</TableCell>
                  <TableCell align="center">CID/ReferNo</TableCell>
                  <TableCell align="center">Contact</TableCell>
                  <TableCell align="center">Email</TableCell>
                  <TableCell align="center">Qualification</TableCell>
                  {hasInternalAssessmentForCourse && (
                    <TableCell align="center">CA Mark/Competency</TableCell>
                  )}
                  {hasInternalAssessmentForCourse && (
                    <>
                      <TableCell align="center">
                        {isServiceId41
                          ? "Viva Assessment"
                          : "Theory Assessment"}
                      </TableCell>
                      <TableCell align="center">Practical Assessment</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrainees.length > 0 ? (
                  filteredTrainees
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((trainee, index) => {
                      return (
                        <TableRow key={trainee.id} hover>
                          <TableCell align="center">
                            {index + 1 + page * rowsPerPage}
                          </TableCell>
                          <TableCell align="center">
                            {trainee.applicant_name}
                          </TableCell>
                          <TableCell align="center">
                            {trainee.cid_no || trainee.reference_no}
                          </TableCell>
                          <TableCell align="center">
                            {trainee.mobile_no}
                          </TableCell>
                          <TableCell align="center">
                            {trainee.email_id}
                          </TableCell>
                          <TableCell align="center">
                            {getQualificationName(
                              trainee.academic_qualification_id,
                            )}
                          </TableCell>
                          {hasInternalAssessmentForCourse && (
                            <TableCell align="center">
                              {isDiplomaCertificationLevel() ? (
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
                          {hasInternalAssessmentForCourse &&
                            renderAssessmentColumn(trainee)}
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={getTableColSpan()} align="center">
                      No selected trainees found for re-assessment
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

      <Box
        sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isRole9 && (
            <GeneratePaymentButton
              onClick={handleGeneratePA}
              disabled={isActionDisabled()}
              loading={actionLoading}
              canGenerate={isGeneratePAEnabled()}
              hasPayment={Boolean(paymentStatus)}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isRole9 && (
            <Tooltip title={getApproveDisabledTooltip()} arrow>
              <span>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => openDialog(57)}
                  disabled={
                    isActionDisabled() ||
                    actionLoading ||
                    !isEditable ||
                    !isApproveEnabled()
                  }
                  sx={{
                    px: 3,
                    py: 0.5,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Approve Re-Assessment
                </Button>
              </span>
            </Tooltip>
          )}

          {isRole22 && (
            <Tooltip title={getEndorseDisabledTooltip()} arrow>
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
                  Endorse Re-Assessment
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      <ActionConfirmDialog
        open={actionDialogOpen}
        title={getDialogTitle()}
        bodyText={dialogBody}
        showRemarks={false}
        confirmColor={getConfirmButtonColor()}
        confirmText={confirmButtonText}
        loading={actionLoading}
        onClose={closeDialog}
        onConfirm={handleAction}
      />

      <DeleteAssessorDialog
        open={deleteDialogOpen}
        assessor={assessorToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteAssessor}
      />
    </Paper>
  );
};

export default ViewReAssessmentTraineeSelectionIndex;
