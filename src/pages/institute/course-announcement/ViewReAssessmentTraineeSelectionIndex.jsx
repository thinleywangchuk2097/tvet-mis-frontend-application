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
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/CourseEnrollmentService";
import CommonService from "../../../api/services/CommonService";
import { useSelector } from "react-redux";

const ViewReAssessmentTraineeSelectionIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusList, setStatusList] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [currentStatusId, setCurrentStatusId] = useState(null);

  // State for CA dates (only used when they don't exist in course details)
  const [caStartDate, setCaStartDate] = useState("");
  const [caEndDate, setCaEndDate] = useState("");

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
  
  // State for storing viva and practical assessments for service_id 41
  const [traineeVivaAssessments, setTraineeVivaAssessments] = useState({});
  const [traineeVivaPracticalAssessments, setTraineeVivaPracticalAssessments] = useState({});

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

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
  
  // Check if service_id is 41 for Viva assessments
  const isServiceId41 = courseDetails?.service_id === "41";//39isServiceId39

  // Fetch data on component mount
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
    fetchAcademicCompetency();
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
    await Promise.all([fetchCourseDetails(), fetchReAssessmentSelectedTrainees()]);
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await CommonService.getReAssessmentAnnouncementByApplicationNo(applicationNo);
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(courseData);
      setCurrentStatusId(courseData?.status_id);
      
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

  const fetchReAssessmentSelectedTrainees = async () => {
    try {
      setLoading(true);
      const response =
        await CourseEnrollmentService.getCourseAppliedTraineesReAssessmentByApplicationNo(
          applicationNo,
        );

      const trainees = response.data || [];

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

      selected.forEach((trainee) => {
        initialTheory[trainee.id] = trainee.theory_assessment || "";
        initialPractical[trainee.id] = trainee.practical_assessment || "";
        initialViva[trainee.id] = trainee.viva_assessment || "";
        initialVivaPractical[trainee.id] = trainee.viva_practical_assessment || "";
      });

      setTraineeTheoryAssessments(initialTheory);
      setTraineePracticalAssessments(initialPractical);
      setTraineeVivaAssessments(initialViva);
      setTraineeVivaPracticalAssessments(initialVivaPractical);

      console.log("Selected trainees:", selected);
      console.log("Has internal assessment for course:", hasInternal);
      console.log("Is service_id 41:", isServiceId41);
    } catch (error) {
      console.error("Error fetching selected trainees:", error);
      toast.error("Failed to fetch selected trainees");
    } finally {
      setLoading(false);
    }
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

  // Handle viva assessment change for service_id 41
  const handleVivaAssessmentChange = (traineeId, value) => {
    setTraineeVivaAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
  };

  // Handle viva practical assessment change for service_id 41
  const handleVivaPracticalAssessmentChange = (traineeId, value) => {
    setTraineeVivaPracticalAssessments((prev) => ({
      ...prev,
      [traineeId]: value,
    }));
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
    // StatusId 58 = Reject, StatusId 57 = Approve
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
          currentAction === 58 ? remarks : remarks || "Application approved",
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

      // Prepare traineeVivaAssessments list for service_id 41
      if (isServiceId41 && hasInternalAssessmentForCourse) {
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
          }));

        if (traineeVivaList.length > 0) {
          payload.traineeVivaAssessments = traineeVivaList;
        }
      }

      console.log("Final approval payload:", payload);

      // Call the API to update the application with marks
      const response = await CourseEnrollmentService.updateTraineeApplication(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Course selection ${currentAction === 57 ? "approved" : "rejected"} successfully!`,
        );
        closeDialog();
        await fetchData();
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error(
        `Error ${currentAction === 57 ? "approving" : "rejecting"} course selection:`,
        error,
      );
      toast.error(
        error.response?.data?.message ||
          `Failed to ${currentAction === 57 ? "approve" : "reject"} course selection`,
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
    // StatusId 57 = Approved, StatusId 58 = Rejected
    return statusId === 57 || statusId === 58;
  };

  const getDialogTitle = () => {
    return currentAction === 57
      ? "Approve Course Selection"
      : "Reject Course Selection";
  };

  const getDialogContent = () => {
    if (currentAction === 57) {
      return (
        <DialogContentText>
          Are you sure you want to approve this course selection?
          <br />
          <strong>Application No: {applicationNo}</strong>
          <br />
          <strong>Course Name: {courseDetails?.course_name}</strong>
          <br />
          <strong>Total Selected Trainees: {selectedTrainees.length}</strong>
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
                Note: {isServiceId41 ? "Viva and Practical" : "Theory and Practical"} assessments will be saved with this approval.
              </strong>
            </>
          )}
        </DialogContentText>
      );
    } else {
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
    return currentAction === 57 ? "success" : "error";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    return currentAction === 57 ? "Confirm Approve" : "Confirm Reject";
  };

  const handleRefresh = () => {
    fetchData();
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
      backgroundColor: "#f5f5f5",
    },
  };

  // Calculate total number of columns for the table
  const getTableColSpan = () => {
    let cols = 7; // #, name, cid, contact, email, qualification, status
    if (hasCADatesInCourse) cols++;
    if (hasInternalAssessmentForCourse) {
      if (isServiceId41) {
        cols += 2; // viva and practical for service_id 41
      } else {
        cols += 2; // theory and practical for other services
      }
    }
    return cols;
  };

  // Render assessment column based on service type
  const renderAssessmentColumn = (trainee) => {
    const hasInternalAssessment =
      trainee.internal_assessment !== null && trainee.internal_assessment !== "";

    if (isServiceId41) {
      // For service_id 41: Show Viva and Practical columns
      return (
        <>
          {/* Viva Assessment Column */}
          <TableCell>
            {hasInternalAssessment ? (
              courseDetails?.certification_level_id === "36" ? (
                <TextField
                  type="number"
                  size="small"
                  value={traineeVivaAssessments[trainee.id] || ""}
                  onChange={(e) =>
                    handleVivaAssessmentChange(trainee.id, e.target.value)
                  }
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                  sx={{ minWidth: 120 }}
                />
              ) : (
                <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                  <Select
                    value={traineeVivaAssessments[trainee.id] || ""}
                    onChange={(e) =>
                      handleVivaAssessmentChange(trainee.id, e.target.value)
                    }
                    displayEmpty
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
          
          {/* Practical Assessment Column for service_id 41 */}
          <TableCell>
            {hasInternalAssessment ? (
              courseDetails?.certification_level_id === "36" ? (
                <TextField
                  type="number"
                  size="small"
                  value={traineeVivaPracticalAssessments[trainee.id] || ""}
                  onChange={(e) =>
                    handleVivaPracticalAssessmentChange(trainee.id, e.target.value)
                  }
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                  sx={{ minWidth: 120 }}
                />
              ) : (
                <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                  <Select
                    value={traineeVivaPracticalAssessments[trainee.id] || ""}
                    onChange={(e) =>
                      handleVivaPracticalAssessmentChange(trainee.id, e.target.value)
                    }
                    displayEmpty
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
        </>
      );
    } else {
      // For other services: Show Theory and Practical columns
      return (
        <>
          {/* Theory Assessment Column */}
          <TableCell>
            {hasInternalAssessment ? (
              courseDetails?.certification_level_id === "36" ? (
                <TextField
                  type="number"
                  size="small"
                  value={traineeTheoryAssessments[trainee.id] || ""}
                  onChange={(e) =>
                    handleTheoryAssessmentChange(trainee.id, e.target.value)
                  }
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                  sx={{ minWidth: 120 }}
                />
              ) : (
                <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                  <Select
                    value={traineeTheoryAssessments[trainee.id] || ""}
                    onChange={(e) =>
                      handleTheoryAssessmentChange(trainee.id, e.target.value)
                    }
                    displayEmpty
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
          
          {/* Practical Assessment Column for other services */}
          <TableCell>
            {hasInternalAssessment ? (
              courseDetails?.certification_level_id === "36" ? (
                <TextField
                  type="number"
                  size="small"
                  value={traineePracticalAssessments[trainee.id] || ""}
                  onChange={(e) =>
                    handlePracticalAssessmentChange(trainee.id, e.target.value)
                  }
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                  sx={{ minWidth: 120 }}
                />
              ) : (
                <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                  <Select
                    value={traineePracticalAssessments[trainee.id] || ""}
                    onChange={(e) =>
                      handlePracticalAssessmentChange(trainee.id, e.target.value)
                    }
                    displayEmpty
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
        </>
      );
    }
  };

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
                  InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
                  disabled={isActionDisabled()}
                  inputProps={{
                    min: caStartDate || undefined,
                  }}
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

      {/* Selected Trainees Table */}
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
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>CID/ReferNo</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Qualification</TableCell>
                  <TableCell>Status</TableCell>
                  {/* Show CA Mark/Competency column only if CA dates exist */}
                  {hasCADatesInCourse && (
                    <TableCell>CA Mark/Competency</TableCell>
                  )}
                  {/* Show Theory and Practical or Viva and Practical based on service_id */}
                  {hasInternalAssessmentForCourse && (
                    <>
                      <TableCell>{isServiceId41 ? "Viva Assessment" : "Theory Assessment"}</TableCell>
                      <TableCell>Practical Assessment</TableCell>
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

                      return (
                        <TableRow key={trainee.id} hover>
                          <TableCell>
                            {index + 1 + page * rowsPerPage}
                          </TableCell>
                          <TableCell>{trainee.applicant_name}</TableCell>
                          <TableCell>{trainee.cid_no || trainee.reference_no}</TableCell>
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
                          {/* Show CA Mark/Competency value only if CA dates exist in course */}
                          {hasCADatesInCourse && (
                            <TableCell>
                              {courseDetails?.certification_level_id ===
                              "36" ? (
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
                          {/* Render assessment columns based on service type */}
                          {hasInternalAssessmentForCourse && renderAssessmentColumn(trainee)}
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

          {/* Pagination */}
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
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => openDialog(57)}
          disabled={isActionDisabled() || actionLoading}
          sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
        >
          Approve Re-Assessment
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          onClick={() => openDialog(58)}
          disabled={isActionDisabled() || actionLoading}
          sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
        >
          Reject Re-Assessment
        </Button>
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
    </Paper>
  );
};

export default ViewReAssessmentTraineeSelectionIndex;