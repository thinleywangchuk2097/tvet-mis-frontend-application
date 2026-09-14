import React, { useState, useEffect, useCallback } from "react";
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
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaymentIcon from "@mui/icons-material/Payment";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import EngineeringIcon from "@mui/icons-material/Engineering";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";

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
  const [statusList, setStatusList] = useState([]);
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

  // ============================================================
  // Helper function to check if certification level is diploma (111 or 112)
  // ============================================================
  const isDiplomaCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // ============================================================
  // Get max values based on certification level
  // ============================================================
  const getTheoryMaxValue = () => {
    if (!isDiplomaCertificationLevel()) return null;
    return 20;
  };

  const getPracticalMaxValue = () => {
    if (!isDiplomaCertificationLevel()) return null;
    return 60;
  };

  const getVivaMaxValue = () => {
    if (!isDiplomaCertificationLevel()) return null;
    return 20;
  };

  const getVivaPracticalMaxValue = () => {
    if (!isDiplomaCertificationLevel()) return null;
    return 60;
  };

  // ============================================================
  // Tooltip messages for max values
  // ============================================================
  const getTheoryTooltipMessage = () => {
    const maxVal = getTheoryMaxValue();
    if (!maxVal) return "";
    return `Maximum value that can be entered is ${maxVal}`;
  };

  const getPracticalTooltipMessage = () => {
    const maxVal = getPracticalMaxValue();
    if (!maxVal) return "";
    return `Maximum value that can be entered is ${maxVal}`;
  };

  const getVivaTooltipMessage = () => {
    const maxVal = getVivaMaxValue();
    if (!maxVal) return "";
    return `Maximum value that can be entered is ${maxVal}`;
  };

  const getVivaPracticalTooltipMessage = () => {
    const maxVal = getVivaPracticalMaxValue();
    if (!maxVal) return "";
    return `Maximum value that can be entered is ${maxVal}`;
  };

  // ============================================================
  // Validation helpers
  // ============================================================
  const validateTheoryInput = (value) => {
    if (value === "") return true;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    if (isDiplomaCertificationLevel()) {
      return numValue >= 0 && numValue <= 20;
    }
    return numValue >= 0 && numValue <= 100;
  };

  const validatePracticalInput = (value) => {
    if (value === "") return true;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    if (isDiplomaCertificationLevel()) {
      return numValue >= 0 && numValue <= 60;
    }
    return numValue >= 0 && numValue <= 100;
  };

  const validateVivaInput = (value) => {
    if (value === "") return true;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    if (isDiplomaCertificationLevel()) {
      return numValue >= 0 && numValue <= 20;
    }
    return numValue >= 0 && numValue <= 100;
  };

  const validateVivaPracticalInput = (value) => {
    if (value === "") return true;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    if (isDiplomaCertificationLevel()) {
      return numValue >= 0 && numValue <= 60;
    }
    return numValue >= 0 && numValue <= 100;
  };

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

  const isApproveEnabled = () => {
    return areAssessorsAssigned() && allTraineesHaveAssessments();
  };

  const isEndorseEnabled = () => {
    if (!isPaymentCompleted()) return false;
    if (!areAssessorsAssigned()) return false;
    if (!allTraineesHaveAssessments()) return false;
    return true;
  };

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

  const getServiceCodeByServiceId = useCallback((serviceId) => {
    if (!serviceId) return null;
    const serviceCodeMap = {
      42: 100585,
      41: 100587,
    };
    return serviceCodeMap[serviceId] || null;
  }, []);

  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
    fetchPaymentStatus();
    fetchAssessors();
    fetchAssignedAssessors();
  }, []);

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

  useEffect(() => {
    if (courseDetails?.registration_no) {
      fetchInstituteData();
    }
  }, [courseDetails]);

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
    }
  }, [listAssignedAssessors, assessors]);

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

  // ============================================================
  // Assessment change handlers with SILENT validation
  // (matches the reference component's pattern)
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

  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    return qualificationMap[qualificationId] || qualificationId;
  };

  const getCompetencyName = (competencyId) => {
    if (!competencyId) return "N/A";
    return competencyMap[competencyId] || competencyId;
  };

  const getStatusName = (statusId) => {
    if (!statusId) return "Unknown";
    const status = statusList.find((s) => s.id === parseInt(statusId));
    return status ? status.name : "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleGeneratePA = () => {
    if (!courseDetails) {
      toast.error("Course data not found");
      return;
    }

    const institute =
      Array.isArray(instituteData) && instituteData.length > 0
        ? instituteData[0]
        : instituteData;

    const applicationNo = courseDetails.application_no;
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
      `/birms/common-payment-index/${applicationNo}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  };

  const handleRedirectToPayment = (redirectUrl) => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      toast.error("No redirect URL available");
    }
  };

  const handleAction = async () => {
    // Validate assessment values before submitting for diploma
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

      const getInternalAssessment = (trainee) =>
        trainee.internal_assessment !== null &&
        trainee.internal_assessment !== undefined &&
        trainee.internal_assessment !== ""
          ? courseDetails?.certification_level_id === "36"
            ? parseInt(trainee.internal_assessment)
            : trainee.internal_assessment
          : null;

      if (hasInternalAssessmentForCourse) {
        const traineeMarksList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment: getInternalAssessment(trainee),
          theoryAssessment:
            courseDetails?.certification_level_id === "36" && !isServiceId41
              ? traineeTheoryAssessments[trainee.id]
                ? parseInt(traineeTheoryAssessments[trainee.id])
                : null
              : traineeTheoryAssessments[trainee.id] || null,
          practicalAssessment:
            courseDetails?.certification_level_id === "36" && !isServiceId41
              ? traineePracticalAssessments[trainee.id]
                ? parseInt(traineePracticalAssessments[trainee.id])
                : null
              : traineePracticalAssessments[trainee.id] || null,
        }));

        if (traineeMarksList.length > 0) {
          payload.traineeMarks = traineeMarksList;
        }
      }

      if (isServiceId41 && hasInternalAssessmentForCourse) {
        const traineeVivaList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment: getInternalAssessment(trainee),
          vivaAssessment: traineeVivaAssessments[trainee.id]
            ? parseInt(traineeVivaAssessments[trainee.id])
            : null,
          practicalAssessment: traineeVivaPracticalAssessments[trainee.id]
            ? parseInt(traineeVivaPracticalAssessments[trainee.id])
            : null,
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

      console.log("Payload for action:", payload);

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

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    return currentAction === 59 ? "Confirm Endorse" : "Confirm Approve";
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

  // ============================================================
  // UPDATED: Uses readOnly (matches reference component) instead of disabled
  // so onChange still fires but typing is blocked by readOnly + validation
  // ============================================================
  const renderAssessmentColumn = (trainee) => {
    const isNumeric =
      courseDetails?.certification_level_id === "111" ||
      courseDetails?.certification_level_id === "112";
    const isVivaType = isServiceId41;

    // Determine if fields should be read-only (matches reference logic)
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
      const tooltipMsg =
        disabledTooltip || (maxValueTooltip ? maxValueTooltip : "");

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

  const availableAssessors = assessors.filter(
    (ass) => !assignedAssessors.some((assigned) => assigned.id === ass.id),
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
                  Fees Per Trainee:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Nu. {courseDetails.fees_per_trainee}
                </Typography>
              </Grid>
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

      {/* Assessor Assignment Section */}
      {allCAmarksExist() && !isActionDisabled() && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EngineeringIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Assign Assessors
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

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
                        isRole9
                          ? () => openDeleteAssessorDialog(ass)
                          : undefined
                      }
                      deleteIcon={
                        isRole9 ? (
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

            {isRole9 && (
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

            {!isRole9 && assignedAssessors.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Assessors have been assigned. You cannot add or remove
                assessors.
              </Alert>
            )}

            {selectedAssessor && selectedAssessorDetails && isRole9 && (
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
                assigned before approval/endorsement.
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
                              {courseDetails?.certification_level_id ===
                                "111" ||
                              courseDetails?.certification_level_id ===
                                "112" ? (
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

      <Dialog
        open={actionDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {currentAction === 59
              ? "Are you sure you want to endorse this course selection?"
              : "Are you sure you want to approve this course selection?"}
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>Course Name: {courseDetails?.course_name}</strong>
            <br />
            <strong>Total Selected Trainees: {selectedTrainees.length}</strong>
            <br />
            <strong>Assigned Assessors: {assignedAssessors.length}</strong>
            {paymentStatus && paymentStatus.paymentAdviceNo && (
              <>
                <br />
                <strong>
                  Payment Advice No: {paymentStatus.paymentAdviceNo}
                </strong>
              </>
            )}
            {hasInternalAssessmentForCourse && (
              <>
                <br />
                <br />
                <strong>
                  Note:{" "}
                  {isServiceId41
                    ? "Viva and Practical"
                    : "Theory and Practical"}{" "}
                  assessments will be saved with this{" "}
                  {currentAction === 59 ? "endorsement" : "approval"}.
                </strong>
              </>
            )}
          </DialogContentText>
        </DialogContent>
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
            disabled={actionLoading}
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ViewReAssessmentTraineeSelectionIndex;
