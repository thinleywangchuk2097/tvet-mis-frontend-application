import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
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
  Tooltip,
} from "@mui/material";
import { useParams } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";

// -------- Shared imports --------
import { tableStyle } from "./shared/utils/traineeSelectionStyles";
import {
  formatDate,
  getQualificationName,
  getStatusName,
  getStatusColor,
  getResultStatusName,
  getResultStatusColor,
} from "./shared/utils/traineeSelectionHelpers";
import TraineeSearchField from "./shared/components/TraineeSearchField";
import TraineeDetailsDialog from "./shared/components/TraineeDetailsDialog";
import ProgrammeInfoCard from "./shared/components/ProgrammeInfoCard";

const NonAccreditedCourseTraineeSelection = () => {
  const { applicationNo } = useParams();
  const [loading, setLoading] = useState(false);
  const [movingTrainees, setMovingTrainees] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [allTrainees, setAllTrainees] = useState([]);
  const [pendingTrainees, setPendingTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [searchPending, setSearchPending] = useState("");
  const [searchSelected, setSearchSelected] = useState("");
  const [statusList, setStatusList] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);

  // Store status IDs for pending and selected
  const [pendingStatusId, setPendingStatusId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);

  // State for qualifications lookup
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [qualificationMap, setQualificationMap] = useState({});

  // Separate pagination for pending table
  const [pagePending, setPagePending] = useState(0);
  const [rowsPerPagePending, setRowsPerPagePending] = useState(5);

  // Separate pagination for selected table
  const [pageSelected, setPageSelected] = useState(0);
  const [rowsPerPageSelected, setRowsPerPageSelected] = useState(5);

  const [selectedPendingRows, setSelectedPendingRows] = useState([]);
  const [selectedSelectedRows, setSelectedSelectedRows] = useState([]);

  // Dialog states for trainee details
  const [openTraineeDialog, setOpenTraineeDialog] = useState(false);
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [traineeDetails, setTraineeDetails] = useState(null);
  const [traineeDetailsLoading, setTraineeDetailsLoading] = useState(false);
  const [traineeDocuments, setTraineeDocuments] = useState([]);
  const [traineeMarks, setTraineeMarks] = useState([]);

  // Fetch academic qualifications and status list on component mount
  useEffect(() => {
    fetchAcademicQualification();
    fetchStatusList();
  }, []);

  // Fetch course details and applied trainees when dependencies are ready
  useEffect(() => {
    if (
      academicQualifications.length > 0 &&
      pendingStatusId &&
      selectedStatusId
    ) {
      fetchData();
    }
  }, [
    applicationNo,
    academicQualifications,
    pendingStatusId,
    selectedStatusId,
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

  const fetchData = async () => {
    await Promise.all([fetchCourseDetails(), fetchCourseAppliedTrainees()]);
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await CommonService.getCourseAnnouncementByApplicationNo(applicationNo);
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(courseData);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details");
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
      setAllTrainees(trainees);

      const pending = trainees.filter(
        (trainee) => trainee.status_id === pendingStatusId?.toString(),
      );
      const selected = trainees.filter(
        (trainee) => trainee.status_id === selectedStatusId?.toString(),
      );

      setPendingTrainees(pending);
      setSelectedTrainees(selected);
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
      const details = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setTraineeDetails(details);

      // Parse documents
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

      // Parse trainee marks
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
        assignedRoleId: 7,
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

  const moveToSelected = async () => {
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
    if (selectedSelectedRows.length === 0) {
      toast.warning("Please select at least one trainee to move back");
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

  // Calculate total columns for selected table
  const getSelectedTableColSpan = () => {
    let cols = 8; // checkbox, #, name, cid, contact, email, qualification, status

    const hasResultStatus = selectedTrainees.some(
      (trainee) => trainee.result_status_id,
    );
    if (hasResultStatus) cols++;

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
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" gutterBottom>
          Trainee Selection for Course
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

      {/* Course Information Card */}
      <ProgrammeInfoCard
        title="Programme Information"
        details={courseDetails}
        selectedCount={selectedTrainees.length}
      />

      {/* Selected and Pending Tables */}
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
                        disabled={movingTrainees}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>CID/ReferNo</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Status</TableCell>
                    {selectedTrainees.some(
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
                              disabled={movingTrainees}
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
                          {trainee.result_status_id && (
                            <TableCell>
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
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={moveToPending}
                disabled={
                  selectedSelectedRows.length === 0 || loading || movingTrainees
                }
                startIcon={
                  movingTrainees ? (
                    <CircularProgress size={20} />
                  ) : (
                    <ArrowBackIcon />
                  )
                }
              >
                {movingTrainees
                  ? "Moving..."
                  : `Move to Pending (${selectedSelectedRows.length})`}
              </Button>
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
                        disabled={movingTrainees}
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
                              disabled={movingTrainees}
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
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={moveToSelected}
                disabled={
                  selectedPendingRows.length === 0 || loading || movingTrainees
                }
                endIcon={
                  movingTrainees ? (
                    <CircularProgress size={20} />
                  ) : (
                    <ArrowForwardIcon />
                  )
                }
              >
                {movingTrainees
                  ? "Moving..."
                  : `Move to Selected (${selectedPendingRows.length})`}
              </Button>
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

export default NonAccreditedCourseTraineeSelection;