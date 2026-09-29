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
  Divider,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";

// -------- Shared imports --------
import { tableStyle } from "./shared/utils/traineeSelectionStyles";
import {
  getQualificationName,
  getStatusName,
  getStatusColor,
  getResultStatusName,
  getResultStatusColor,
  getCompetencyName,
} from "./shared/utils/traineeSelectionHelpers";
import TraineeSearchField from "./shared/components/TraineeSearchField";
import TraineeDetailsDialog from "./shared/components/TraineeDetailsDialog";
import PaymentBanner from "./shared/components/PaymentBanner";
import ProgrammeInfoCard from "./shared/components/ProgrammeInfoCard";
import MoveButton from "./shared/components/MoveButton";

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
  const [pendingStatusId, setPendingStatusId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [academicCompetency, setAcademicCompetency] = useState([]);
  const [paymentStatusDetails, setPaymentStatusDetails] = useState([]);
  const [paymentAdviceNo, setPaymentAdviceNo] = useState(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState(null);

  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});

  const [traineeInternalAssessments, setTraineeInternalAssessments] = useState(
    {},
  );
  const [traineeTheoryAssessments, setTraineeTheoryAssessments] = useState({});
  const [traineePracticalAssessments, setTraineePracticalAssessments] =
    useState({});
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] =
    useState({});
  const [hasAssessmentValues, setHasAssessmentValues] = useState(false);

  const [pagePending, setPagePending] = useState(0);
  const [rowsPerPagePending, setRowsPerPagePending] = useState(5);
  const [pageSelected, setPageSelected] = useState(0);
  const [rowsPerPageSelected, setRowsPerPageSelected] = useState(5);

  const [selectedPendingRows, setSelectedPendingRows] = useState([]);
  const [selectedSelectedRows, setSelectedSelectedRows] = useState([]);
  const [competencyMap, setCompetencyMap] = useState({});

  const [openTraineeDialog, setOpenTraineeDialog] = useState(false);
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [traineeDetailsLoading, setTraineeDetailsLoading] = useState(false);
  const [traineeDocuments, setTraineeDocuments] = useState([]);
  const [traineeMarks, setTraineeMarks] = useState([]);

  const hasCADates = courseDetails?.ca_start_date && courseDetails?.ca_end_date;
  const isServiceId39 = courseDetails?.service_id === "39";

  // ---------- Helper functions ----------

  const isNumericCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  const isDiplomaCertificationLevel = () => {
    const levelId = courseDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  const getInternalAssessmentMaxValue = () => {
    if (!isDiplomaCertificationLevel()) return null;
    return 20;
  };

  const getInternalAssessmentTooltipMessage = () => {
    const maxVal = getInternalAssessmentMaxValue();
    if (!maxVal) return "";
    return `Maximum value that can be entered is ${maxVal}`;
  };

  const validateInternalAssessmentInput = (value) => {
    if (value === "") return true;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    return numValue >= 0 && numValue <= 20;
  };

  const isApplicationEndorsed = () => {
    return courseDetails?.application_status_id === "59";
  };

  const hasAssessments =
    isApplicationEndorsed() &&
    selectedTrainees.some((trainee) => {
      if (isServiceId39) {
        return (
          (trainee.viva_assessment && trainee.viva_assessment !== "") ||
          (trainee.practical_assessment && trainee.practical_assessment !== "")
        );
      }
      return (
        (trainee.theory_assessment && trainee.theory_assessment !== "") ||
        (trainee.practical_assessment && trainee.practical_assessment !== "")
      );
    });

  const hasResultStatus =
    isApplicationEndorsed() &&
    selectedTrainees.some((trainee) => trainee.result_status_id);

  // ---------- Helper: tooltip text for assessment inputs ----------

  const getInternalAssessmentTooltip = (traineeId) => {
    const hasValue =
      traineeInternalAssessments[traineeId] &&
      traineeInternalAssessments[traineeId] !== "";

    if (isDiplomaCertificationLevel()) {
      return getInternalAssessmentTooltipMessage();
    }
    if (hasValue) {
      return "CA mark is already set and cannot be modified";
    }
    return "Enter CA mark";
  };

  const getCompetencyTooltip = (traineeId) => {
    const hasValue =
      traineeInternalAssessments[traineeId] &&
      traineeInternalAssessments[traineeId] !== "";

    if (hasValue) {
      return "CA competency is already set and cannot be modified";
    }
    return "Select CA competency";
  };

  // ---------- Data fetching ----------

  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
    fetchPaymentDetail();
  }, []);

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

  useEffect(() => {
    if (!isApplicationEndorsed()) {
      setHasAssessmentValues(false);
      return;
    }

    const hasValues = selectedTrainees.some((trainee) => {
      if (isServiceId39) {
        const vivaVal = traineeVivaAssessments[trainee.id] || "";
        const practicalVal = traineeVivaPracticalAssessments[trainee.id] || "";
        return (
          (vivaVal && vivaVal !== "") ||
          (practicalVal && practicalVal !== "") ||
          trainee.result_status_id
        );
      }
      const theoryVal = traineeTheoryAssessments[trainee.id] || "";
      const practicalVal = traineePracticalAssessments[trainee.id] || "";
      return (
        (theoryVal && theoryVal !== "") ||
        (practicalVal && practicalVal !== "") ||
        trainee.result_status_id
      );
    });

    setHasAssessmentValues(hasValues);
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

      const map = {};
      qualifications.forEach((qual) => {
        map[qual.id] = qual.name;
      });
      setQualificationMap(map);
    } catch (error) {
      console.error("Error fetching academic qualifications:", error);
    }
  };

  const fetchPaymentDetail = async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);

      setPaymentStatusDetails(response.data);

      if (response.data && response.data.paymentAdviceNo) {
        setPaymentAdviceNo(response.data.paymentAdviceNo);
        if (response.data.redirectUrl) {
          setPaymentRedirectUrl(response.data.redirectUrl);
        }
      } else {
        setPaymentAdviceNo(null);
        setPaymentRedirectUrl(null);
      }
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

      const pendingStatus = statuses.find(
        (status) => status.name.toLowerCase() === "pending",
      );
      const selectedStatus = statuses.find(
        (status) => status.name.toLowerCase() === "selected",
      );

      if (pendingStatus) setPendingStatusId(pendingStatus.id);
      if (selectedStatus) setSelectedStatusId(selectedStatus.id);
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

  const fetchProgrammeDetails = async () => {
    try {
      const response =
        await CommonService.getCourseAnnouncementByApplicationNo(applicationNo);

      const programmeData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(programmeData);
      console.log("Programme details fetched:", programmeData);
      
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
      const trainees = response.data || [];

      const pending = trainees.filter(
        (trainee) => trainee.status_id === pendingStatusId?.toString(),
      );
      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setPendingTrainees(pending);
      setSelectedTrainees(selected);

      const initialInternalAssessments = {};
      const initialTheory = {};
      const initialPractical = {};
      const initialViva = {};
      const initialVivaPractical = {};

      selected.forEach((trainee) => {
        initialInternalAssessments[trainee.id] =
          trainee.internal_assessment || "";
        initialTheory[trainee.id] = trainee.theory_assessment || "";
        initialPractical[trainee.id] = trainee.practical_assessment || "";
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

  const fetchTraineeDetails = async (traineeId) => {
    try {
      setTraineeDetailsLoading(true);
      const response = await CourseEnrollmentService.getTraineeDetailsById(
        traineeId,
        access_token,
      );
      const details = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setTraineeDetails(details);

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

  const handleViewMore = (traineeId) => {
    setSelectedTraineeId(traineeId);
    setOpenTraineeDialog(true);
    fetchTraineeDetails(traineeId);
  };

  const handleCloseDialog = () => {
    setOpenTraineeDialog(false);
    setSelectedTraineeId(null);
    setTraineeDetails(null);
    setTraineeDocuments([]);
    setTraineeMarks([]);
  };

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

      const response =
        await CourseEnrollmentService.selectUnselectTrainee(payload);

      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error("Error updating trainee status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update trainee status",
      );
      return false;
    }
  };

  // ---------- Helper: check if trainee has assessment values ----------

  const traineeHasAssessmentValues = (trainee) => {
    if (!trainee) return false;

    if (isServiceId39) {
      const vivaVal = traineeVivaAssessments[trainee.id] || "";
      const practicalVal = traineeVivaPracticalAssessments[trainee.id] || "";
      return (
        (vivaVal && vivaVal !== "") ||
        (practicalVal && practicalVal !== "") ||
        trainee.result_status_id
      );
    }

    const theoryVal = traineeTheoryAssessments[trainee.id] || "";
    const practicalVal = traineePracticalAssessments[trainee.id] || "";
    return (
      (theoryVal && theoryVal !== "") ||
      (practicalVal && practicalVal !== "") ||
      trainee.result_status_id
    );
  };

  const anyTraineeHasAssessmentValues = (traineeIds, sourceList) => {
    return traineeIds.some((traineeId) => {
      const trainee = sourceList.find((t) => t.id === traineeId);
      return traineeHasAssessmentValues(trainee);
    });
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

    const totalSeats = courseDetails?.enrollment_capacity || 0;
    if (selectedTrainees.length + selectedPendingRows.length > totalSeats) {
      toast.error(
        `Cannot select more than ${totalSeats} trainees. Only ${
          totalSeats - selectedTrainees.length
        } seats available.`,
      );
      return;
    }

    if (
      isApplicationEndorsed() &&
      anyTraineeHasAssessmentValues(selectedPendingRows, pendingTrainees)
    ) {
      toast.error(
        "Cannot move trainees when they have assessment marks or result status. Please clear all assessment values first.",
      );
      return;
    }

    setMovingTrainees(true);

    try {
      const success = await updateTraineeStatus(
        selectedPendingRows,
        selectedStatusId,
      );

      if (success) {
        const traineesToMove = pendingTrainees.filter((t) =>
          selectedPendingRows.includes(t.id),
        );

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

    if (
      isApplicationEndorsed() &&
      anyTraineeHasAssessmentValues(selectedSelectedRows, selectedTrainees)
    ) {
      toast.error(
        "Cannot move trainees when they have assessment marks or result status. Please clear all assessment values first.",
      );
      return;
    }

    setMovingTrainees(true);

    try {
      const success = await updateTraineeStatus(
        selectedSelectedRows,
        pendingStatusId,
      );

      if (success) {
        const traineesToMove = selectedTrainees.filter((t) =>
          selectedSelectedRows.includes(t.id),
        );

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

  const validateFinalizeSelection = () => {
    if (courseDetails?.application_status_id === "55") {
      toast.warning("Application has been already submitted");
      return false;
    }

    if (selectedTrainees.length === 0) {
      toast.warning("No trainees selected for this programme");
      return false;
    }

    if (
      isApplicationEndorsed() &&
      selectedTrainees.some(traineeHasAssessmentValues)
    ) {
      toast.error(
        "Cannot submit selection when trainees have assessment marks or result status. Please clear all assessment values first.",
      );
      return false;
    }

    if (hasCADates) {
      const missingAssessments = selectedTrainees.filter(
        (trainee) =>
          !traineeInternalAssessments[trainee.id] ||
          traineeInternalAssessments[trainee.id] === "",
      );

      if (missingAssessments.length > 0) {
        toast.error(
          `Please enter CA mark/competency for all selected trainees. Missing for: ${missingAssessments
            .map((t) => t.applicant_name)
            .join(", ")}`,
        );
        return false;
      }

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
            `Internal Assessment must be between 0 and 20 for diploma. Invalid for: ${invalidAssessments
              .map((t) => t.applicant_name)
              .join(", ")}`,
          );
          return false;
        }
      }
    }

    return true;
  };

  const buildFinalizePayload = () => {
    const payload = {
      applicationNo: applicationNo,
      statusId: 55,
      courseName: courseDetails?.course_name,
      serviceId: courseDetails?.service_id
        ? parseInt(courseDetails.service_id)
        : null,
      assignedRoleId: 9,
    };

    if (!hasCADates) {
      payload.traineeIds = selectedTrainees.map((trainee) => ({
        traineeId: parseInt(trainee.id),
        statusId: selectedStatusId,
      }));
    }

    if (hasCADates) {
      payload.traineeInternalAssessments = selectedTrainees.map((trainee) => ({
        traineeId: parseInt(trainee.id),
        internalAssessment: isNumericCertificationLevel()
          ? parseInt(traineeInternalAssessments[trainee.id])
          : traineeInternalAssessments[trainee.id],
      }));
    }

    if (isServiceId39) {
      payload.traineeVivaAssessments = selectedTrainees.map((trainee) => ({
        traineeId: parseInt(trainee.id),
        vivaAssessment: traineeVivaAssessments[trainee.id]
          ? parseInt(traineeVivaAssessments[trainee.id])
          : null,
        practicalAssessment: traineeVivaPracticalAssessments[trainee.id]
          ? parseInt(traineeVivaPracticalAssessments[trainee.id])
          : null,
      }));
    } else {
      payload.traineeMarks = selectedTrainees.map((trainee) => ({
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

    return payload;
  };

  const handleFinalizeSelection = async () => {
    if (!validateFinalizeSelection()) return;

    setSubmitting(true);
    try {
      const payload = buildFinalizePayload();

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

  const filteredPending = pendingTrainees.filter(
    (trainee) =>
      trainee.applicant_name
        ?.toLowerCase()
        .includes(searchPending.toLowerCase()) ||
      trainee.email_id?.toLowerCase().includes(searchPending.toLowerCase()) ||
      trainee.mobile_no?.toLowerCase().includes(searchPending.toLowerCase()) ||
      trainee.cid_no?.toLowerCase().includes(searchPending.toLowerCase()),
  );

  const filteredSelected = selectedTrainees.filter(
    (trainee) =>
      trainee.applicant_name
        ?.toLowerCase()
        .includes(searchSelected.toLowerCase()) ||
      trainee.email_id?.toLowerCase().includes(searchSelected.toLowerCase()) ||
      trainee.mobile_no?.toLowerCase().includes(searchSelected.toLowerCase()) ||
      trainee.cid_no?.toLowerCase().includes(searchSelected.toLowerCase()),
  );

  const handleChangePagePending = (event, newPage) => {
    setPagePending(newPage);
  };

  const handleChangeRowsPerPagePending = (event) => {
    setRowsPerPagePending(parseInt(event.target.value, 10));
    setPagePending(0);
  };

  const handleChangePageSelected = (event, newPage) => {
    setPageSelected(newPage);
  };

  const handleChangeRowsPerPageSelected = (event) => {
    setRowsPerPageSelected(parseInt(event.target.value, 10));
    setPageSelected(0);
  };

  const getSelectedTableColSpan = () => {
    let cols = 8;

    if (hasCADates) cols++;
    if (isApplicationEndorsed() && hasAssessments) {
      cols += 2;
    }
    if (
      isApplicationEndorsed() &&
      selectedTrainees.some((trainee) => trainee.result_status_id)
    ) {
      cols++;
    }
    return cols;
  };

  // ---------- renderAssessmentColumns ----------

  const renderAssessmentColumns = (trainee) => {
    if (!isApplicationEndorsed()) return null;

    const isNumeric = isNumericCertificationLevel();

    const firstValue = isServiceId39
      ? traineeVivaAssessments[trainee.id] || trainee.viva_assessment || ""
      : traineeTheoryAssessments[trainee.id] || trainee.theory_assessment || "";

    const secondValue = isServiceId39
      ? traineeVivaPracticalAssessments[trainee.id] ||
        trainee.practical_assessment ||
        ""
      : traineePracticalAssessments[trainee.id] ||
        trainee.practical_assessment ||
        "";

    const firstLabel = isServiceId39 ? "Viva Assessment" : "Theory Assessment";
    const secondLabel = "Practical Assessment";

    const renderCell = (value, label) => (
      <TableCell>
        <Tooltip
          title={
            value ? `${label}: ${value}` : `No ${label.toLowerCase()} available`
          }
          arrow
        >
          {isNumeric ? (
            <TextField
              type="number"
              size="small"
              value={value || ""}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
              sx={{ minWidth: 120, backgroundColor: "#f5f5f5" }}
            />
          ) : (
            <Chip
              label={getCompetencyName(value, competencyMap) || "N/A"}
              size="small"
              color="info"
              sx={{ minWidth: 100 }}
            />
          )}
        </Tooltip>
      </TableCell>
    );

    return (
      <>
        {renderCell(firstValue, firstLabel)}
        {renderCell(secondValue, secondLabel)}
      </>
    );
  };

  // ---------- Derived tooltip/disabled states ----------

  const moveToPendingTooltip = hasCADates
    ? "⚠️ Cannot move trainees to pending when CA dates are set. Please clear CA dates first."
    : selectedSelectedRows.length === 0
      ? "Please select at least one trainee to move back"
      : "";

  const moveToSelectedTooltip = hasCADates
    ? "⚠️ Cannot move trainees to selected when CA dates are set. Please clear CA dates first."
    : selectedPendingRows.length === 0
      ? "Please select at least one trainee to move"
      : "";

  const submitTooltip = (() => {
    if (courseDetails?.application_status_id === "55") {
      return "Application has been already submitted";
    }
    if (isApplicationEndorsed() && hasAssessmentValues) {
      return "Cannot submit when trainees have assessment marks or result status. Please clear all assessment values first.";
    }
    return "";
  })();

  const moveToPendingButtonLabel = movingTrainees
    ? "Moving..."
    : hasCADates
      ? "Movement Disabled"
      : `Move to Pending`;

  const moveToSelectedButtonLabel = movingTrainees
    ? "Moving..."
    : hasCADates
      ? "Movement Disabled"
      : `Move to Selected`;

  const submitButtonLabel = submitting
    ? "Submitting..."
    : `Submit (${selectedTrainees.length} Trainees)`;

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

      {/* Payment Status Banner */}
      <PaymentBanner
        paymentStatus={paymentStatusDetails?.paymentStatus}
        redirectUrl={paymentRedirectUrl}
        paymentAdviceNo={paymentAdviceNo}
      />

      {/* Programme Information Card */}
      <ProgrammeInfoCard
        title="Programme Information"
        details={courseDetails}
        selectedCount={selectedTrainees.length}
      />

      <Grid container spacing={3}>
        {/* Selected Trainees Table */}
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

            <TraineeSearchField
              label="Search Selected Trainees"
              value={searchSelected}
              onChange={(e) => setSearchSelected(e.target.value)}
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
                    {hasCADates && <TableCell>Internal Assessment</TableCell>}
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
                              qualificationMap,
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusName(
                                trainee.status_id,
                                statusList,
                              )}
                              size="small"
                              sx={getStatusColor(
                                trainee.status_id,
                                statusList,
                              )}
                            />
                          </TableCell>
                          {hasCADates && (
                            <TableCell>
                              {isNumericCertificationLevel() ? (
                                <Tooltip
                                  title={getInternalAssessmentTooltip(
                                    trainee.id,
                                  )}
                                  arrow
                                >
                                  <TextField
                                    type="number"
                                    size="small"
                                    placeholder={`Enter CA mark${
                                      isDiplomaCertificationLevel()
                                        ? " (0-20)"
                                        : ""
                                    }`}
                                    value={
                                      traineeInternalAssessments[trainee.id] ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
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
                                  title={getCompetencyTooltip(trainee.id)}
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
                          {isApplicationEndorsed() &&
                            hasAssessments &&
                            renderAssessmentColumns(trainee)}
                          {isApplicationEndorsed() &&
                            trainee.result_status_id && (
                              <TableCell>
                                <Tooltip
                                  title={`Result Status: ${getResultStatusName(
                                    trainee.result_status_id,
                                    statusList,
                                  )}`}
                                  arrow
                                >
                                  <Chip
                                    label={getResultStatusName(
                                      trainee.result_status_id,
                                      statusList,
                                    )}
                                    size="small"
                                    sx={getResultStatusColor(
                                      trainee.result_status_id,
                                      statusList,
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
                <MoveButton
                  onClick={moveToPending}
                  disabled={
                    selectedSelectedRows.length === 0 ||
                    loading ||
                    movingTrainees ||
                    hasCADates
                  }
                  color={hasCADates ? "grey" : "secondary"}
                  icon={
                    hasCADates ? <BlockIcon /> : <ArrowBackIcon />
                  }
                  label={moveToPendingButtonLabel}
                  count={selectedSelectedRows.length}
                  tooltip={moveToPendingTooltip}
                  moving={movingTrainees}
                />

                <Tooltip title={submitTooltip} arrow>
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
                      {submitButtonLabel}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Pending Trainees Table */}
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

            <TraineeSearchField
              label="Search Pending Trainees"
              value={searchPending}
              onChange={(e) => setSearchPending(e.target.value)}
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
                              qualificationMap,
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusName(
                                trainee.status_id,
                                statusList,
                              )}
                              size="small"
                              sx={getStatusColor(
                                trainee.status_id,
                                statusList,
                              )}
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

              <MoveButton
                onClick={moveToSelected}
                disabled={
                  selectedPendingRows.length === 0 ||
                  loading ||
                  movingTrainees ||
                  hasCADates
                }
                color={hasCADates ? "grey" : "primary"}
                icon={
                  hasCADates ? <BlockIcon /> : <ArrowForwardIcon />
                }
                label={moveToSelectedButtonLabel}
                count={selectedPendingRows.length}
                tooltip={moveToSelectedTooltip}
                moving={movingTrainees}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Trainee Details Dialog */}
      <TraineeDetailsDialog
        open={openTraineeDialog}
        onClose={handleCloseDialog}
        loading={traineeDetailsLoading}
        details={traineeDetails}
        documents={traineeDocuments}
        marks={traineeMarks}
        getQualificationName={(id) =>
          getQualificationName(id, qualificationMap)
        }
      />
    </Paper>
  );
};

export default AccreditatedRPLCourseTraineeSelectionIndex;