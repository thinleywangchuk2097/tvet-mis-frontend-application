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
import CourseEnrollmentService from "../../../api/services/CourseEnrollmentService";
import CommonService from "../../../api/services/CommonService";
import { useSelector } from "react-redux";

const ReAssessmentTraineeSelectionIndex = () => {
  const { applicationNo } = useParams();
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
  const actionId = useSelector((state) => state.auth.id);
  const [pendingStatusId, setPendingStatusId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [academicCompetency, setAcademicCompetency] = useState([]);

  // State for qualifications lookup
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});

  // State for storing re-assessment marks for selected trainees
  const [traineeReAssessmentMarks, setTraineeReAssessmentMarks] = useState({});

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

  // Check if re-assessment marks exist
  const hasReAssessmentMarks = selectedTrainees.some((trainee) => 
    trainee.re_assessment_mark && trainee.re_assessment_mark !== ""
  );

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
    await Promise.all([fetchCourseDetails(), fetchCourseAppliedTrainees()]);
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
        await CommonService.getReAssessmentAnnouncementByApplicationNo(applicationNo);
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

  const fetchCourseAppliedTrainees = async () => {
    try {
      setLoading(true);
      const response =
        await CourseEnrollmentService.getReAssessmentAppliedTraineesByApplicationNo(
          applicationNo,
        );
      console.log("Applied Trainees Response:", response);
      const trainees = response.data || [];
      setAllTrainees(trainees);
      
      const pending = trainees.filter(
        (trainee) => trainee.status_id === pendingStatusId?.toString(),
      );
      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setPendingTrainees(pending);
      setSelectedTrainees(selected);

      // Initialize re-assessment marks for selected trainees from API data
      const initialReAssessmentMarks = {};

      selected.forEach((trainee) => {
        if (trainee.re_assessment_mark) {
          initialReAssessmentMarks[trainee.id] = trainee.re_assessment_mark;
        } else {
          initialReAssessmentMarks[trainee.id] = "";
        }
      });

      setTraineeReAssessmentMarks(initialReAssessmentMarks);
      console.log("Initialized re-assessment marks:", initialReAssessmentMarks);
    } catch (error) {
      console.error("Error fetching applied trainees:", error);
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

  const handleReAssessmentMarkChange = (traineeId, value) => {
    setTraineeReAssessmentMarks((prev) => ({
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

    const newReAssessmentMarks = {};

    traineesToMove.forEach((trainee) => {
      newReAssessmentMarks[trainee.id] = "";
    });

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
    setTraineeReAssessmentMarks((prev) => ({ ...prev, ...newReAssessmentMarks }));
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

    const updatedReAssessmentMarks = { ...traineeReAssessmentMarks };

    traineesToMove.forEach((trainee) => {
      delete updatedReAssessmentMarks[trainee.id];
    });

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
    setTraineeReAssessmentMarks(updatedReAssessmentMarks);
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

    setSubmitting(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: 55,
        courseName: courseDetails?.course_name,
        serviceId: courseDetails?.service_id
          ? parseInt(courseDetails.service_id)
          : null,
        assignedRoleId: 7,
        traineeReAssessmentMarks: selectedTrainees.map((trainee) => ({
          traineeId: parseInt(trainee.id),
          reAssessmentMark: traineeReAssessmentMarks[trainee.id]
            ? parseInt(traineeReAssessmentMarks[trainee.id])
            : null,
        })),
      };

      console.log("Final selection payload:", payload);
      const response = await CourseEnrollmentService.selectedTraineeForReAssessment(
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

  const getSelectedTableColSpan = () => {
    let cols = 8;
    const hasResultStatus = selectedTrainees.some(trainee => trainee.result_status_id);
    if (hasResultStatus) cols++;
    if (hasReAssessmentMarks) cols++;
    return cols;
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
              <Grid item size={{ xs: 12, md: 3 }}>
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
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Available Seats:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {(courseDetails.total_no_trainees || 0) -
                    selectedTrainees.length}
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
                    {selectedTrainees.some(trainee => trainee.result_status_id) && (
                      <TableCell>Result Status</TableCell>
                    )}
                    {hasReAssessmentMarks && <TableCell>Re-Assessment Mark</TableCell>}
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
                          {trainee.result_status_id && (
                            <TableCell>
                              <Chip
                                label={getResultStatusName(trainee.result_status_id)}
                                size="small"
                                sx={getResultStatusColor(trainee.result_status_id)}
                              />
                            </TableCell>
                          )}
                          {hasReAssessmentMarks && (
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                placeholder="Enter mark"
                                value={
                                  traineeReAssessmentMarks[trainee.id] || ""
                                }
                                onChange={(e) =>
                                  handleReAssessmentMarkChange(
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
                    <TableCell>Status</TableCell>
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