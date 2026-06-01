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
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";

const ReAssessmentTraineeSelectionIndex = () => {
  const { applicationNo, courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [allTrainees, setAllTrainees] = useState([]);
  const [pendingTrainees, setPendingTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchPending, setSearchPending] = useState("");
  const [searchSelected, setSearchSelected] = useState("");
  const [statusList, setStatusList] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  //Store status IDs for pending and selected
  const [pendingStatusId, setPendingStatusId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [academicCompetency, setAcademicCompetency] = useState([]);

  // State for qualifications lookup
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

  // State for storing viva and practical assessments for service_id 41
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] =
    useState({});

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

  // Check if CA dates exist
  const hasCADates = courseDetails?.ca_start_date && courseDetails?.ca_end_date;

  // Check if service_id is 41 for Viva assessments
  const isServiceId41 = courseDetails?.service_id === "41";

  // Check if any trainee has assessments (theory/practical for normal, viva/practical for service_id 41)
  const hasAssessments = selectedTrainees.some((trainee) => {
    if (isServiceId41) {
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

  // Fetch academic qualifications and status list on component mount
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
  }, []);

  // Fetch course details and applied trainees when dependencies are ready
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
      console.log("Academic Qualifications:", qualifications);
    } catch (error) {
      console.error("Error fetching academic qualifications:", error);
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
    await Promise.all([fetchCourseDetails(), fetchFailedTraineesLists()]);
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
      console.log("Academic Competencies:", competencies);
    } catch (error) {
      console.error("Error fetching academic competencies:", error);
    }
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
      console.log("Re-Assessment Details:", courseData);
    } catch (error) {
      console.error("Error fetching re-assessment details:", error);
      toast.error("Failed to fetch re-assessment details");
    }
  };

  const fetchFailedTraineesLists = async () => {
    try {
      setLoading(true);

      const response =
        await CourseEnrollmentService.getCourseAppliedTraineesReAssessmentByApplicationNo(
          applicationNo,
        );

      console.log("Applied Trainees Response:", response);

      let trainees = response.data;

      // If empty → fetch failed trainees
      if (!trainees || trainees.length === 0) {
        const failedResponse =
          await CourseEnrollmentService.getFailedTraineeDetails(
            registration_no,
            courseId,
          );

        console.log("Failed Trainees Response:", failedResponse);

        trainees = failedResponse.data;
      }

      trainees = trainees || [];
      setAllTrainees(trainees);

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

      selected.forEach((t) => {
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

  const moveToSelected = () => {
    if (selectedPendingRows.length === 0) {
      toast.warning("Please select at least one trainee to move");
      return;
    }

    const totalSeats = courseDetails?.total_no_trainees || 0;
    if (selectedTrainees.length + selectedPendingRows.length > totalSeats) {
      toast.error(
        `Cannot select more than ${totalSeats} trainees. Only ${totalSeats - selectedTrainees.length} seats available.`,
      );
      return;
    }

    const traineesToMove = pendingTrainees.filter((t) =>
      selectedPendingRows.includes(t.id),
    );

    // Initialize assessments for newly moved trainees
    const newInternalAssessments = {};
    const newTheory = {};
    const newPractical = {};
    const newViva = {};
    const newVivaPractical = {};

    traineesToMove.forEach((trainee) => {
      newInternalAssessments[trainee.id] = "";
      newTheory[trainee.id] = "";
      newPractical[trainee.id] = "";
      newViva[trainee.id] = "";
      newVivaPractical[trainee.id] = "";
    });

    const updatedPending = pendingTrainees.filter(
      (t) => !selectedPendingRows.includes(t.id),
    );
    const updatedSelected = [
      ...selectedTrainees,
      ...traineesToMove.map((t) => ({
        ...t,
        status_id: "90",
        result_status_id: null, // Clear the result status when moving to selected
      })),
    ];

    setPendingTrainees(updatedPending);
    setSelectedTrainees(updatedSelected);
    setTraineeInternalAssessments((prev) => ({
      ...prev,
      ...newInternalAssessments,
    }));
    setTraineeTheoryAssessments((prev) => ({ ...prev, ...newTheory }));
    setTraineePracticalAssessments((prev) => ({ ...prev, ...newPractical }));
    setTraineeVivaAssessments((prev) => ({ ...prev, ...newViva }));
    setTraineeVivaPracticalAssessments((prev) => ({
      ...prev,
      ...newVivaPractical,
    }));
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

    // Remove assessments for moved trainees
    const updatedInternalAssessments = { ...traineeInternalAssessments };
    const updatedTheory = { ...traineeTheoryAssessments };
    const updatedPractical = { ...traineePracticalAssessments };
    const updatedViva = { ...traineeVivaAssessments };
    const updatedVivaPractical = { ...traineeVivaPracticalAssessments };

    traineesToMove.forEach((trainee) => {
      delete updatedInternalAssessments[trainee.id];
      delete updatedTheory[trainee.id];
      delete updatedPractical[trainee.id];
      delete updatedViva[trainee.id];
      delete updatedVivaPractical[trainee.id];
    });

    const updatedSelected = selectedTrainees.filter(
      (t) => !selectedSelectedRows.includes(t.id),
    );
    const updatedPending = [
      ...pendingTrainees,
      ...traineesToMove.map((t) => ({
        ...t,
        status_id: "90",
        result_status_id: "95", // Set result status to failed when moving back to pending
      })),
    ];

    setSelectedTrainees(updatedSelected);
    setPendingTrainees(updatedPending);
    setTraineeInternalAssessments(updatedInternalAssessments);
    setTraineeTheoryAssessments(updatedTheory);
    setTraineePracticalAssessments(updatedPractical);
    setTraineeVivaAssessments(updatedViva);
    setTraineeVivaPracticalAssessments(updatedVivaPractical);
    setSelectedSelectedRows([]);

    toast.info(
      `${selectedSelectedRows.length} trainee(s) moved back to pending`,
    );
  };

  const handleFinalizeSelection = async () => {
    if (selectedTrainees.length === 0) {
      toast.warning("No trainees selected for this re-assessment");
      return;
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
    }

    setSubmitting(true);
    try {
      // Prepare trainee internal assessments payload (only if CA dates exist)
      let traineeInternalAssessmentsList = [];
      if (hasCADates) {
        traineeInternalAssessmentsList = selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          internalAssessment:
            courseDetails?.certification_level_id === "36"
              ? parseInt(traineeInternalAssessments[trainee.id])
              : traineeInternalAssessments[trainee.id],
        }));
      }

      // Prepare trainee marks payload based on service type
      let traineeMarksList = [];
      let traineeVivaAssessmentsList = [];

      if (isServiceId41) {
        // For service_id 41: Prepare viva assessments
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
          theoryAssessment:
            courseDetails?.certification_level_id === "36"
              ? traineeTheoryAssessments[trainee.id]
                ? parseInt(traineeTheoryAssessments[trainee.id])
                : null
              : traineeTheoryAssessments[trainee.id] || null,
          practicalAssessment:
            courseDetails?.certification_level_id === "36"
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
        userId: registration_no,
        courseId: courseId,
        courseName:
          courseDetails?.re_assessment_name || courseDetails?.course_name || "",
        serviceId: courseDetails?.service_id
          ? parseInt(courseDetails.service_id)
          : null,
        assignedRoleId: 7,
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
      if (!isServiceId41 && traineeMarksList.length > 0) {
        payload.traineeMarks = traineeMarksList;
      }

      // Add trainee viva assessments for service_id 41
      if (isServiceId41 && traineeVivaAssessmentsList.length > 0) {
        payload.traineeVivaAssessments = traineeVivaAssessmentsList;
      }

      console.log("Final selection payload:", payload);
      const response = await CourseEnrollmentService.submitReassessmentTrainees(
        payload,
        access_token,
      );
      console.log("Finalize Selection Response:", response);
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

    // Add result status column if any trainee has result_status_id
    const hasResultStatus = selectedTrainees.some(
      (trainee) => trainee.result_status_id,
    );
    if (hasResultStatus) cols++;

    if (hasCADates) cols++;
    if (hasAssessments) {
      if (isServiceId41) {
        cols += 2; // viva and practical for service_id 41
      } else {
        cols += 2; // theory and practical for other services
      }
    }
    return cols;
  };

  // Render assessment columns (read-only) based on service type
  const renderAssessmentColumns = (trainee) => {
    if (isServiceId41) {
      // For service_id 41: Show Viva and Practical columns (read-only)
      return (
        <>
          {/* Viva Assessment Column */}
          <TableCell>
            {courseDetails?.certification_level_id === "36" ? (
              <TextField
                type="number"
                size="small"
                value={traineeVivaAssessments[trainee.id] || "N/A"}
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
              <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                <Select
                  value={traineeVivaAssessments[trainee.id] || ""}
                  displayEmpty
                  readOnly
                  sx={{ backgroundColor: "#f5f5f5" }}
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
            )}
          </TableCell>

          {/* Practical Assessment Column for service_id 41 */}
          <TableCell>
            {courseDetails?.certification_level_id === "36" ? (
              <TextField
                type="number"
                size="small"
                value={traineeVivaPracticalAssessments[trainee.id] || "N/A"}
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
              <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                <Select
                  value={traineeVivaPracticalAssessments[trainee.id] || ""}
                  displayEmpty
                  readOnly
                  sx={{ backgroundColor: "#f5f5f5" }}
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
            )}
          </TableCell>
        </>
      );
    } else {
      // For other services: Show Theory and Practical columns (read-only)
      return (
        <>
          {/* Theory Assessment Column */}
          <TableCell>
            {courseDetails?.certification_level_id === "36" ? (
              <TextField
                type="number"
                size="small"
                value={traineeTheoryAssessments[trainee.id] || "N/A"}
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
              <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                <Select
                  value={traineeTheoryAssessments[trainee.id] || ""}
                  displayEmpty
                  readOnly
                  sx={{ backgroundColor: "#f5f5f5" }}
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
            )}
          </TableCell>

          {/* Practical Assessment Column for other services */}
          <TableCell>
            {courseDetails?.certification_level_id === "36" ? (
              <TextField
                type="number"
                size="small"
                value={traineePracticalAssessments[trainee.id] || "N/A"}
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
              <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                <Select
                  value={traineePracticalAssessments[trainee.id] || ""}
                  displayEmpty
                  readOnly
                  sx={{ backgroundColor: "#f5f5f5" }}
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
            )}
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
        <IconButton
          onClick={handleRefresh}
          color="primary"
          title="Refresh"
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Re-Assessment Information Card */}
      {courseDetails && (
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
                  {courseDetails.application_no}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Re-Assessment Name:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {courseDetails.re_assessment_name}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {courseDetails.total_no_trainees}
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
                  Course Fee:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Nu. {courseDetails.course_fee}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Available Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {(courseDetails.total_no_trainees || 0) -
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
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
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
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>CID/ReferNo</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Status</TableCell>
                    {/* Result Status Column - Only show if any trainee has result_status_id */}
                    {selectedTrainees.some(
                      (trainee) => trainee.result_status_id,
                    ) && <TableCell>Result Status</TableCell>}
                    {/* Only show CA Mark/Competency column if CA dates exist */}
                    {hasCADates && <TableCell>CA Mark/Competency</TableCell>}
                    {/* Show assessment columns if they exist */}
                    {hasAssessments && (
                      <>
                        <TableCell>
                          {isServiceId41
                            ? "Viva Assessment"
                            : "Theory Assessment"}
                        </TableCell>
                        <TableCell>Practical Assessment</TableCell>
                      </>
                    )}
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
                          {/* Result Status Cell - Only show if trainee has result_status_id */}
                          {trainee.result_status_id && (
                            <TableCell>
                              <Chip
                                label={getResultStatusName(
                                  trainee.result_status_id,
                                )}
                                size="small"
                                sx={getResultStatusColor(
                                  trainee.result_status_id,
                                )}
                              />
                            </TableCell>
                          )}
                          {/* Only show CA Mark/Competency input if CA dates exist */}
                          {hasCADates && (
                            <TableCell>
                              {courseDetails?.certification_level_id ===
                              "36" ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  placeholder="Enter CA mark"
                                  value={
                                    traineeInternalAssessments[trainee.id] || ""
                                  }
                                  onChange={(e) =>
                                    handleInternalAssessmentChange(
                                      trainee.id,
                                      e.target.value,
                                    )
                                  }
                                  fullWidth
                                  InputProps={{
                                    inputProps: { min: 0, max: 100 },
                                  }}
                                  sx={{ minWidth: 120 }}
                                />
                              ) : (
                                <FormControl
                                  size="small"
                                  fullWidth
                                  sx={{ minWidth: 150 }}
                                >
                                  <Select
                                    value={
                                      traineeInternalAssessments[trainee.id] ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleInternalAssessmentChange(
                                        trainee.id,
                                        e.target.value,
                                      )
                                    }
                                    displayEmpty
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
                              )}
                            </TableCell>
                          )}
                          {/* Show assessment columns (read-only) if they exist */}
                          {hasAssessments && renderAssessmentColumns(trainee)}
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
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedSelectedRows.length} trainee(s)
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={moveToPending}
                  disabled={
                    selectedSelectedRows.length === 0 || loading || submitting
                  }
                  startIcon={<ArrowBackIcon />}
                >
                  Move to Pending ({selectedSelectedRows.length})
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFinalizeSelection}
                  disabled={
                    loading || submitting || selectedTrainees.length === 0
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
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
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
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>CID/ReferNo</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Result Status</TableCell>
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
                              label={getResultStatusName(
                                trainee.result_status_id,
                              )}
                              size="small"
                              sx={getResultStatusColor(
                                trainee.result_status_id,
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
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
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedPendingRows.length} trainee(s)
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={moveToSelected}
                disabled={
                  selectedPendingRows.length === 0 || loading || submitting
                }
                endIcon={<ArrowForwardIcon />}
              >
                Move to Selected ({selectedPendingRows.length})
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReAssessmentTraineeSelectionIndex;
