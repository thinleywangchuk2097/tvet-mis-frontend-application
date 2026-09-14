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
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";

const ReAssessmentTraineeSelectionIndex = () => {
  const { applicationNo, programmeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [programmeDetails, setProgrammeDetails] = useState(null);
  const [pendingTrainees, setPendingTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchPending, setSearchPending] = useState("");
  const [searchSelected, setSearchSelected] = useState("");
  const [statusList, setStatusList] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);
  const actionId = useSelector((state) => state.auth.id);

  const [pendingStatusId, setPendingStatusId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [academicCompetency, setAcademicCompetency] = useState([]);
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

  const [pagePending, setPagePending] = useState(0);
  const [rowsPerPagePending, setRowsPerPagePending] = useState(5);
  const [pageSelected, setPageSelected] = useState(0);
  const [rowsPerPageSelected, setRowsPerPageSelected] = useState(5);

  const [selectedPendingRows, setSelectedPendingRows] = useState([]);
  const [selectedSelectedRows, setSelectedSelectedRows] = useState([]);

  const [competencyMap, setCompetencyMap] = useState({});

  const [deleteTraineeDialogOpen, setDeleteTraineeDialogOpen] = useState(false);
  const [traineeToDelete, setTraineeToDelete] = useState(null);

  const hasCADates =
    programmeDetails?.ca_start_date && programmeDetails?.ca_end_date;
  const isServiceId41 = programmeDetails?.service_id === "41";

  // Determine visibility of other assessment columns + result status in Selected table
  const showOtherAssessmentsAndResultStatus =
    programmeDetails?.application_status_id === "59";

  // ============================================================
  // Submit is disabled for statuses 55, 57, AND 59
  // ============================================================
  const isSubmitDisabledByStatus =
    programmeDetails?.application_status_id === "55" ||
    programmeDetails?.application_status_id === "57" ||
    programmeDetails?.application_status_id === "59";

  // ============================================================
  // UPDATED: Move buttons now use the SAME disable condition as Submit
  // ============================================================
  const isMoveDisabledByStatus = isSubmitDisabledByStatus;

  // Human-readable reason for why Submit is disabled
  const getSubmitDisabledTooltip = () => {
    if (submitting) return "Submission in progress, please wait...";
    if (loading) return "Data is loading, please wait...";
    if (selectedTrainees.length === 0)
      return "Please move at least one trainee to the Selected list before submitting.";
    if (isSubmitDisabledByStatus) {
      if (programmeDetails?.application_status_id === "55") {
        return "Submission is currently disabled because this application is already in the 'Submitted' stage. No further action is required.";
      }
      if (programmeDetails?.application_status_id === "57") {
        return "Submission is currently disabled because this application is in the 'Approval In Progress' stage. Please wait for the approval to complete.";
      }
      if (programmeDetails?.application_status_id === "59") {
        return "Submission is currently disabled because this application has reached the 'Assessment Completed' stage. The selection is now read-only.";
      }
      return "Submission is currently disabled for this application status.";
    }
    return `Click to submit the selection of ${selectedTrainees.length} trainee(s) for re-assessment.`;
  };

  // Human-readable reason for why Move to Pending is disabled
  const getMoveToPendingTooltip = () => {
    if (isMoveDisabledByStatus) {
      if (programmeDetails?.application_status_id === "55") {
        return "Moving trainees is disabled because this application is already in the 'Submitted' stage.";
      }
      if (programmeDetails?.application_status_id === "57") {
        return "Moving trainees is disabled because this application is in the 'Approval In Progress' stage.";
      }
      if (programmeDetails?.application_status_id === "59") {
        return "Moving trainees is disabled because this application has reached the 'Assessment Completed' stage. The selection is now read-only.";
      }
      return "Moving trainees is disabled for this application status.";
    }
    if (loading || submitting)
      return "Please wait, an operation is currently in progress.";
    if (selectedSelectedRows.length === 0)
      return "Select one or more trainees from the Selected list to move them back to Pending.";
    return `Move ${selectedSelectedRows.length} trainee(s) back to the Pending list.`;
  };

  // Human-readable reason for why Move to Selected is disabled
  const getMoveToSelectedTooltip = () => {
    if (isMoveDisabledByStatus) {
      if (programmeDetails?.application_status_id === "55") {
        return "Moving trainees is disabled because this application is already in the 'Submitted' stage.";
      }
      if (programmeDetails?.application_status_id === "57") {
        return "Moving trainees is disabled because this application is in the 'Approval In Progress' stage.";
      }
      if (programmeDetails?.application_status_id === "59") {
        return "Moving trainees is disabled because this application has reached the 'Assessment Completed' stage. The selection is now read-only.";
      }
      return "Moving trainees is disabled for this application status.";
    }
    if (loading || submitting)
      return "Please wait, an operation is currently in progress.";
    if (selectedPendingRows.length === 0)
      return "Select one or more trainees from the Pending list to move them to Selected.";
    return `Move ${selectedPendingRows.length} trainee(s) to the Selected list.`;
  };

  // Tooltip for hidden Result Status / other assessment columns in Selected table
  const hiddenColumnsTooltip =
    "Result Status and assessment marks (Theory/Viva/Practical) will become visible once the application reaches the 'Assessment Completed' stage (status 59).";

  const isNumericCertificationLevel = () => {
    const levelId = programmeDetails?.certification_level_id;
    return levelId === "111" || levelId === "112";
  };

  // Fetch academic qualifications, status list, and competencies on mount
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
  }, []);

  // Fetch data when dependencies are ready
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

  //Sequential fetch — ensures certificationLevelId is available
  const fetchData = async () => {
    const details = await fetchProgrammeDetails();
    await fetchFailedTraineesLists(details?.certification_level_id);
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

  // Returns courseData so caller can pass certification_level_id
  const fetchProgrammeDetails = async () => {
    try {
      const response =
        await CommonService.getReAssessmentAnnouncementByApplicationNo(
          applicationNo,
        );
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setProgrammeDetails(courseData);
      console.log("Fetched programme details:", courseData);
      return courseData;
    } catch (error) {
      console.error("Error fetching re-assessment details:", error);
      toast.error("Failed to fetch re-assessment details");
      return null;
    }
  };

  //  Accepts certificationLevelId and passes it to the service
  const fetchFailedTraineesLists = async (certificationLevelId) => {
    try {
      setLoading(true);
      const response =
        await CourseEnrollmentService.getCourseAppliedTraineesReAssessmentByApplicationNo(
          applicationNo,
        );

      let trainees = response.data;

      if (!trainees || trainees.length === 0) {
        const failedResponse =
          await CourseEnrollmentService.getFailedTraineeDetails(
            registration_no,
            programmeId,
            certificationLevelId,
          );
        trainees = failedResponse.data || [];
        console.log("Fetched trainees inside:", trainees);
      }
      console.log("Fetched trainees:", trainees);
      trainees = trainees || [];

      const pending = trainees.filter(
        (t) => t.result_status_id === "95" && t.status_id === "90",
      );
      const selected = trainees.filter(
        (t) =>
          t.status_id === "90" &&
          (!t.result_status_id || t.result_status_id === "94"),
      );

      setPendingTrainees(pending);
      setSelectedTrainees(selected);

      const initialInternalAssessments = {};
      const initialTheory = {};
      const initialPractical = {};
      const initialViva = {};
      const initialVivaPractical = {};

      [...selected, ...pending].forEach((t) => {
        initialInternalAssessments[t.id] = t.internal_assessment || "";
        initialTheory[t.id] = t.theory_assessment || "";
        initialPractical[t.id] = t.practical_assessment || "";
        initialViva[t.id] = t.viva_assessment || "";
        initialVivaPractical[t.id] = t.practical_assessment || "";
      });

      setTraineeInternalAssessments(initialInternalAssessments);
      setTraineeTheoryAssessments(initialTheory);
      setTraineePracticalAssessments(initialPractical);
      setTraineeVivaAssessments(initialViva);
      setTraineeVivaPracticalAssessments(initialVivaPractical);
    } catch (error) {
      console.error("Error fetching failed trainees:", error);
      toast.error("Failed to fetch applied trainees");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    return qualificationMap[qualificationId] || qualificationId;
  };

  const getStatusName = (statusId) => {
    if (!statusId) return "Unknown";
    const status = statusList.find((s) => s.id === parseInt(statusId));
    return status ? status.name : "Unknown";
  };

  const getResultStatusName = (resultStatusId) => {
    if (!resultStatusId) return "N/A";
    const status = statusList.find((s) => s.id === parseInt(resultStatusId));
    return status ? status.name : "Unknown";
  };

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

  const getCompetencyName = (competencyId) => {
    if (!competencyId) return "";
    return competencyMap[competencyId] || competencyId;
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

  const moveToSelected = () => {
    if (selectedPendingRows.length === 0) {
      toast.warning("Please select at least one trainee to move");
      return;
    }

    const totalSeats = programmeDetails?.enrollment_capacity || 0;
    if (selectedTrainees.length + selectedPendingRows.length > totalSeats) {
      toast.error(
        `Cannot select more than ${totalSeats} trainees. Only ${totalSeats - selectedTrainees.length} seats available.`,
      );
      return;
    }

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
        status_id: "90",
        result_status_id: null,
      })),
    ];

    setPendingTrainees(updatedPending);
    setSelectedTrainees(updatedSelected);
    setSelectedPendingRows([]);

    toast.success(
      `${selectedPendingRows.length} trainee(s) moved to selected list`,
    );
  };

  const moveToPending = () => {
    if (selectedSelectedRows.length === 0) {
      toast.warning("Please select at least one trainee to move back");
      return;
    }

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
        status_id: "90",
        result_status_id: "95",
      })),
    ];

    setSelectedTrainees(updatedSelected);
    setPendingTrainees(updatedPending);
    setSelectedSelectedRows([]);

    toast.info(
      `${selectedSelectedRows.length} trainee(s) moved back to pending`,
    );
  };

  const handleDeletePendingTrainee = async () => {
    if (!traineeToDelete) return;

    setActionLoading(true);
    try {
      const payload = {
        traineeId: parseInt(traineeToDelete.id),
        statusId: 140,
        remarks: `Trainee ${traineeToDelete.applicant_name} removed from re assessment selection`,
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

  const handleFinalizeSelection = async () => {
    if (selectedTrainees.length === 0) {
      toast.warning("No trainees selected for this re-assessment");
      return;
    }

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
    }

    setSubmitting(true);
    try {
      let traineeInternalAssessmentsList = [];
      if (hasCADates) {
        traineeInternalAssessmentsList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment:
            programmeDetails?.certification_level_id === "36"
              ? parseInt(traineeInternalAssessments[trainee.id])
              : traineeInternalAssessments[trainee.id],
        }));
      }

      let traineeMarksList = [];
      let traineeVivaAssessmentsList = [];

      if (isServiceId41) {
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
        traineeMarksList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          theoryAssessment:
            programmeDetails?.certification_level_id === "36"
              ? traineeTheoryAssessments[trainee.id]
                ? parseInt(traineeTheoryAssessments[trainee.id])
                : null
              : traineeTheoryAssessments[trainee.id] || null,
          practicalAssessment:
            programmeDetails?.certification_level_id === "36"
              ? traineePracticalAssessments[trainee.id]
                ? parseInt(traineePracticalAssessments[trainee.id])
                : null
              : traineePracticalAssessments[trainee.id] || null,
        }));
      }

      let traineeStatusList = null;
      if (!hasCADates) {
        traineeStatusList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          statusId: selectedStatusId,
        }));
      }

      const payload = {
        applicationNo: applicationNo,
        statusId: 55,
        userId: registration_no,
        programmeId: programmeId,
        courseName:
          programmeDetails?.re_assessment_name ||
          programmeDetails?.course_name ||
          "",
        certificationLevelId: programmeDetails?.certification_level_id || null,
        serviceId: programmeDetails?.service_id
          ? parseInt(programmeDetails.service_id)
          : null,
        assignedRoleId: 9,
      };

      if (!hasCADates && traineeStatusList) {
        payload.traineeIds = traineeStatusList;
      }

      if (hasCADates && traineeInternalAssessmentsList.length > 0) {
        payload.traineeInternalAssessments = traineeInternalAssessmentsList;
      }

      if (!isServiceId41 && traineeMarksList.length > 0) {
        payload.traineeMarks = traineeMarksList;
      }

      if (isServiceId41 && traineeVivaAssessmentsList.length > 0) {
        payload.traineeVivaAssessments = traineeVivaAssessmentsList;
      }
      console.log("Finalizing selection with payload:", payload);

      const response = await CourseEnrollmentService.submitReassessmentTrainees(
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

  const handleChangePagePending = (event, newPage) => setPagePending(newPage);
  const handleChangeRowsPerPagePending = (event) => {
    setRowsPerPagePending(parseInt(event.target.value, 10));
    setPagePending(0);
  };
  const handleChangePageSelected = (event, newPage) => setPageSelected(newPage);
  const handleChangeRowsPerPageSelected = (event) => {
    setRowsPerPageSelected(parseInt(event.target.value, 10));
    setPageSelected(0);
  };

  // ============================================================
  // TABLE STYLES — shared between both tables for aligned columns
  // ============================================================
  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    tableLayout: "auto",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
      padding: "8px",
      whiteSpace: "nowrap",
      verticalAlign: "middle",
      textAlign: "center",
    },
  };

  const headerCellStyle = {
    fontWeight: 600,
    whiteSpace: "nowrap",
    fontSize: "0.8rem",
    padding: "8px",
    textAlign: "center",
  };

  const bodyCellStyle = {
    whiteSpace: "nowrap",
    fontSize: "0.8rem",
    padding: "8px",
    verticalAlign: "middle",
    textAlign: "center",
  };

  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      "&:hover fieldset": {
        borderColor: "rgba(0, 0, 0, 0.23)",
      },
    },
  };

  // Style for disabled Select to keep text color same as other column values
  const disabledSelectSx = {
    "& .MuiInputBase-root.Mui-disabled": {
      backgroundColor: "transparent",
    },
    "& .MuiSelect-select.Mui-disabled": {
      color: "text.primary !important",
      WebkitTextFillColor: "inherit !important",
      opacity: 1,
      textAlign: "center",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
  };

  // Style for disabled TextField to keep text color same as other column values
  const disabledTextFieldSx = {
    minWidth: 100,
    "& .MuiInputBase-root.Mui-disabled": {
      backgroundColor: "transparent",
    },
    "& .MuiInputBase-input.Mui-disabled": {
      color: "text.primary !important",
      WebkitTextFillColor: "inherit !important",
      opacity: 1,
      textAlign: "center",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
  };

  // Reusable readonly dropdown component
  const ReadOnlyDropdown = ({ value, placeholder = "Select Competency" }) => (
    <FormControl
      size="small"
      fullWidth
      sx={{ minWidth: 130, display: "flex", justifyContent: "center" }}
    >
      <Select
        value={value || ""}
        displayEmpty
        disabled
        renderValue={(selected) => {
          if (!selected || selected === "") {
            return <em style={{ color: "#9e9e9e" }}>{placeholder}</em>;
          }
          return getCompetencyName(selected);
        }}
        sx={disabledSelectSx}
      >
        <MenuItem value="" disabled>
          <em>{placeholder}</em>
        </MenuItem>
        {academicCompetency.map((competency) => (
          <MenuItem key={competency.id} value={competency.id}>
            {competency.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  // Reusable readonly text field component (for numeric certification levels)
  const ReadOnlyTextField = ({ value }) => (
    <TextField
      type="number"
      size="small"
      value={value || ""}
      fullWidth
      disabled
      sx={disabledTextFieldSx}
    />
  );

  // Render either readonly dropdown or text field based on certification level
  const renderAssessmentValue = (value) => {
    return isNumericCertificationLevel() ? (
      <ReadOnlyTextField value={value} />
    ) : (
      <ReadOnlyDropdown value={value} />
    );
  };

  // Column span helpers
  const getSelectedTableColSpan = () => {
    let cols = 9; // checkbox, #, name, cid, contact, email, qualification, status, (result status)
    cols++; // internal assessment
    if (showOtherAssessmentsAndResultStatus) {
      cols += 2; // theory/viva + practical (only when app status = 59)
    }
    return cols;
  };

  const getPendingTableColSpan = () => {
    let cols = 8; // checkbox, #, name, cid, contact, email, qualification, result status
    cols++; // internal assessment
    cols += 2; // theory/viva + practical
    cols++; // action
    return cols; // = 12
  };

  const renderSelectedAssessmentColumns = (trainee) => {
    const vivaValue =
      traineeVivaAssessments[trainee.id] || trainee.viva_assessment || "";
    const practicalValue =
      traineeVivaPracticalAssessments[trainee.id] ||
      trainee.practical_assessment ||
      "";
    const theoryValue =
      traineeTheoryAssessments[trainee.id] || trainee.theory_assessment || "";
    const practicalOtherValue =
      traineePracticalAssessments[trainee.id] ||
      trainee.practical_assessment ||
      "";

    if (isServiceId41) {
      return (
        <>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(vivaValue)}
          </TableCell>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(practicalValue)}
          </TableCell>
        </>
      );
    } else {
      return (
        <>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(theoryValue)}
          </TableCell>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(practicalOtherValue)}
          </TableCell>
        </>
      );
    }
  };

  const renderPendingAssessmentColumns = (trainee) => {
    const vivaValue = trainee.viva_assessment || "";
    const practicalValue = trainee.practical_assessment || "";
    const theoryValue = trainee.theory_assessment || "";

    if (isServiceId41) {
      return (
        <>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(vivaValue)}
          </TableCell>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(practicalValue)}
          </TableCell>
        </>
      );
    } else {
      return (
        <>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(theoryValue)}
          </TableCell>
          <TableCell sx={bodyCellStyle}>
            {renderAssessmentValue(practicalValue)}
          </TableCell>
        </>
      );
    }
  };

  if (loading && !programmeDetails && pendingTrainees.length === 0) {
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
          Trainee Selection for Re-Assessment
        </Typography>
        <Tooltip title="Refresh the trainee lists and programme details" arrow>
          <span>
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Re-Assessment Information Card */}
      {programmeDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Re-Assessment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Application No:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {programmeDetails.application_no}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Programme Name:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {programmeDetails.course_name}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {programmeDetails.enrollment_capacity}
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
                  Nu. {programmeDetails.fees_per_trainee}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Available Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {(programmeDetails.enrollment_capacity || 0) -
                    selectedTrainees.length}
                </Typography>
              </Grid>
              {programmeDetails.ca_start_date && (
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    CA Start Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatDate(programmeDetails.ca_start_date)}
                  </Typography>
                </Grid>
              )}
              {programmeDetails.ca_end_date && (
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    CA End Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatDate(programmeDetails.ca_end_date)}
                  </Typography>
                </Grid>
              )}
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Certification Level:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {programmeDetails.certification_name}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
              {!showOtherAssessmentsAndResultStatus && (
                <Tooltip title={hiddenColumnsTooltip} arrow placement="right">
                  <InfoOutlinedIcon
                    fontSize="small"
                    sx={{ color: "text.secondary", cursor: "help" }}
                  />
                </Tooltip>
              )}
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
                    <TableCell sx={headerCellStyle} padding="checkbox">
                      <Tooltip
                        title={
                          filteredSelected.length > 0
                            ? "Select / deselect all trainees in the Selected list"
                            : "No trainees available to select"
                        }
                        arrow
                      >
                        <span>
                          <Checkbox
                            indeterminate={
                              selectedSelectedRows.length > 0 &&
                              selectedSelectedRows.length <
                                filteredSelected.length
                            }
                            checked={
                              filteredSelected.length > 0 &&
                              selectedSelectedRows.length ===
                                filteredSelected.length
                            }
                            onChange={handleSelectAllSelected}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={headerCellStyle}>#</TableCell>
                    <TableCell sx={headerCellStyle}>Name</TableCell>
                    <TableCell sx={headerCellStyle}>CID/ReferNo</TableCell>
                    <TableCell sx={headerCellStyle}>Contact</TableCell>
                    <TableCell sx={headerCellStyle}>Email</TableCell>
                    <TableCell sx={headerCellStyle}>Qualification</TableCell>
                    <TableCell sx={headerCellStyle}>Status</TableCell>
                    {/* Result Status — only when application_status_id === "59" */}
                    {showOtherAssessmentsAndResultStatus && (
                      <TableCell sx={headerCellStyle}>Result Status</TableCell>
                    )}
                    <TableCell sx={headerCellStyle}>
                      Internal Assessment
                    </TableCell>
                    {/* Other Assessment columns — only when application_status_id === "59" */}
                    {showOtherAssessmentsAndResultStatus &&
                      (isServiceId41 ? (
                        <>
                          <TableCell sx={headerCellStyle}>
                            Viva Assessment
                          </TableCell>
                          <TableCell sx={headerCellStyle}>
                            Practical Assessment
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={headerCellStyle}>
                            Theory Assessment
                          </TableCell>
                          <TableCell sx={headerCellStyle}>
                            Practical Assessment
                          </TableCell>
                        </>
                      ))}
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
                          <TableCell sx={bodyCellStyle} padding="checkbox">
                            <Checkbox
                              checked={selectedSelectedRows.includes(
                                trainee.id,
                              )}
                              onChange={(e) =>
                                handleSelectSelected(e, trainee.id)
                              }
                            />
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {index + 1 + pageSelected * rowsPerPageSelected}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.applicant_name}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.cid_no || trainee.reference_no}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.mobile_no}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.email_id}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {getQualificationName(
                              trainee.academic_qualification_id,
                            )}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            <Chip
                              label={getStatusName(trainee.status_id)}
                              size="small"
                              sx={getStatusColor(trainee.status_id)}
                            />
                          </TableCell>
                          {/* Result Status — only when application_status_id === "59" */}
                          {showOtherAssessmentsAndResultStatus && (
                            <TableCell sx={bodyCellStyle}>
                              {trainee.result_status_id ? (
                                <Chip
                                  label={getResultStatusName(
                                    trainee.result_status_id,
                                  )}
                                  size="small"
                                  sx={getResultStatusColor(
                                    trainee.result_status_id,
                                  )}
                                />
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          )}
                          <TableCell sx={bodyCellStyle}>
                            {renderAssessmentValue(
                              traineeInternalAssessments[trainee.id],
                            )}
                          </TableCell>
                          {/* Other Assessment columns — only when application_status_id === "59" */}
                          {showOtherAssessmentsAndResultStatus &&
                            renderSelectedAssessmentColumns(trainee)}
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
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedSelectedRows.length} trainee(s)
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                {/* Move to Pending with tooltip — uses same disable condition as Submit */}
                <Tooltip title={getMoveToPendingTooltip()} arrow>
                  <span>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={moveToPending}
                      disabled={
                        selectedSelectedRows.length === 0 ||
                        loading ||
                        submitting ||
                        isMoveDisabledByStatus
                      }
                      startIcon={<ArrowBackIcon />}
                    >
                      Move to Pending ({selectedSelectedRows.length})
                    </Button>
                  </span>
                </Tooltip>

                {/* Submit with tooltip — disabled for statuses 55, 57, 59 */}
                <Tooltip title={getSubmitDisabledTooltip()} arrow>
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleFinalizeSelection}
                      disabled={
                        loading ||
                        submitting ||
                        selectedTrainees.length === 0 ||
                        isSubmitDisabledByStatus
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
                    <TableCell sx={headerCellStyle} padding="checkbox">
                      <Tooltip
                        title={
                          filteredPending.length > 0
                            ? "Select / deselect all trainees in the Pending list"
                            : "No trainees available to select"
                        }
                        arrow
                      >
                        <span>
                          <Checkbox
                            indeterminate={
                              selectedPendingRows.length > 0 &&
                              selectedPendingRows.length <
                                filteredPending.length
                            }
                            checked={
                              filteredPending.length > 0 &&
                              selectedPendingRows.length ===
                                filteredPending.length
                            }
                            onChange={handleSelectAllPending}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={headerCellStyle}>#</TableCell>
                    <TableCell sx={headerCellStyle}>Name</TableCell>
                    <TableCell sx={headerCellStyle}>CID/ReferNo</TableCell>
                    <TableCell sx={headerCellStyle}>Contact</TableCell>
                    <TableCell sx={headerCellStyle}>Email</TableCell>
                    <TableCell sx={headerCellStyle}>Qualification</TableCell>
                    <TableCell sx={headerCellStyle}>Result Status</TableCell>
                    <TableCell sx={headerCellStyle}>
                      Internal Assessment
                    </TableCell>
                    {isServiceId41 ? (
                      <>
                        <TableCell sx={headerCellStyle}>
                          Viva Assessment
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          Practical Assessment
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={headerCellStyle}>
                          Theory Assessment
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          Practical Assessment
                        </TableCell>
                      </>
                    )}
                    <TableCell sx={headerCellStyle} align="center">
                      Action
                    </TableCell>
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
                          <TableCell sx={bodyCellStyle} padding="checkbox">
                            <Checkbox
                              checked={selectedPendingRows.includes(trainee.id)}
                              onChange={(e) =>
                                handleSelectPending(e, trainee.id)
                              }
                            />
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {index + 1 + pagePending * rowsPerPagePending}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.applicant_name}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.cid_no || trainee.reference_no}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.mobile_no}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.email_id}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {getQualificationName(
                              trainee.academic_qualification_id,
                            )}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {trainee.result_status_id ? (
                              <Chip
                                label={getResultStatusName(
                                  trainee.result_status_id,
                                )}
                                size="small"
                                sx={getResultStatusColor(
                                  trainee.result_status_id,
                                )}
                              />
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell sx={bodyCellStyle}>
                            {renderAssessmentValue(trainee.internal_assessment)}
                          </TableCell>
                          {renderPendingAssessmentColumns(trainee)}
                          <TableCell sx={bodyCellStyle} align="center">
                            <Tooltip
                              title={
                                isMoveDisabledByStatus
                                  ? "Removing trainees is disabled because the application status has already been set."
                                  : `Remove ${trainee.applicant_name} from the pending list`
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
                                  disabled={isMoveDisabledByStatus}
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
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={getPendingTableColSpan()}
                        align="center"
                      >
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
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedPendingRows.length} trainee(s)
              </Typography>
              {/* Move to Selected with tooltip — uses same disable condition as Submit */}
              <Tooltip title={getMoveToSelectedTooltip()} arrow>
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={moveToSelected}
                    disabled={
                      selectedPendingRows.length === 0 ||
                      loading ||
                      submitting ||
                      isMoveDisabledByStatus
                    }
                    endIcon={<ArrowForwardIcon />}
                  >
                    Move to Selected ({selectedPendingRows.length})
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
                pending trainees list?
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
            onClick={handleDeletePendingTrainee}
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

export default ReAssessmentTraineeSelectionIndex;
