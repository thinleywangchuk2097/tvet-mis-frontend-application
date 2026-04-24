import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Divider,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedIcon from "@mui/icons-material/Verified";
import ApplyAccreditedCourseService from "../../../api/services/ApplyAccreditedCourseService";
import CommonService from "../../../api/services/CommonService";
import FileDownload from "../../../components/file/FileDownload";

const ViewApplyAccreditedCourse = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [unitLevels, setUnitLevels] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  // Convert roleId to string for comparison
  const roleId = currentRoleId?.toString();

  useEffect(() => {
    if (applicationNo) {
      fetchAllData();
    }
  }, [applicationNo]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourseDetails(),
        fetchSectors(),
        fetchUnitLevels(),
        fetchOccupations(),
      ]);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      setSectors(response.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchUnitLevels = async () => {
    try {
      const response = await CommonService.getByParentId(10);
      setUnitLevels(response.data);
    } catch (error) {
      console.error("Error fetching unit levels:", error);
    }
  };

  const fetchOccupations = async () => {
    try {
      const response = await CommonService.getAllOccupations();
      setOccupations(response.data);
    } catch (error) {
      console.error("Error fetching occupations:", error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await ApplyAccreditedCourseService.getAccreditedCourseByApplicationNo(
          applicationNo,
          access_token,
        );

      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setCourseData(data);

      // Parse certifications JSON string
      if (data.certifications) {
        try {
          const parsedCertifications =
            typeof data.certifications === "string"
              ? JSON.parse(data.certifications)
              : data.certifications;
          setCertifications(parsedCertifications);
        } catch (e) {
          console.error("Error parsing certifications:", e);
          setCertifications([]);
        }
      }

      // Parse curriculums JSON string
      if (data.curriculums) {
        try {
          const parsedCurriculums =
            typeof data.curriculums === "string"
              ? JSON.parse(data.curriculums)
              : data.curriculums;
          setCurriculums(parsedCurriculums);
        } catch (e) {
          console.error("Error parsing curriculums:", e);
          setCurriculums([]);
        }
      }

      // Parse trainers JSON string
      if (data.trainers) {
        try {
          const parsedTrainers =
            typeof data.trainers === "string"
              ? JSON.parse(data.trainers)
              : data.trainers;
          setTrainersList(parsedTrainers);
        } catch (e) {
          console.error("Error parsing trainers:", e);
          setTrainersList([]);
        }
      }

      // Parse documents JSON string
      if (data.documents) {
        try {
          let parsedDocs =
            typeof data.documents === "string"
              ? JSON.parse(data.documents)
              : data.documents;

          if (Array.isArray(parsedDocs)) {
            const formattedDocs = parsedDocs.map((doc) => ({
              name: doc.documentName || doc.name || "Document",
              url: doc.url || "",
              id: doc.id,
              filePath: doc.url,
            }));
            setDocuments(formattedDocs);
          } else {
            setDocuments([]);
          }
        } catch (e) {
          console.error("Error parsing documents:", e);
          setDocuments([]);
        }
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      throw error;
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const getSectorName = () => {
    if (!dataLoaded) return "Loading...";

    if (courseData?.sector_id && sectors.length > 0) {
      const sector = sectors.find(
        (s) => String(s.id) === String(courseData.sector_id),
      );
      if (sector) {
        return sector.sectorName || sector.name || "N/A";
      }
      return courseData.sector_id;
    }
    return courseData?.sector_id || "N/A";
  };

  const getCourseName = () => {
    if (!dataLoaded) return "Loading...";

    if (courseData?.course_id && occupations.length > 0) {
      const occupation = occupations.find(
        (occ) => String(occ.id) === String(courseData.course_id),
      );
      if (occupation) {
        return (
          occupation.occupationName ||
          occupation.title ||
          occupation.name ||
          "N/A"
        );
      }
      return courseData.course_id;
    }
    return courseData?.course_id || "N/A";
  };

  const getUnitLevelName = (levelId) => {
    if (!dataLoaded) return "Loading...";

    if (levelId && unitLevels.length > 0) {
      const level = unitLevels.find((l) => String(l.id) === String(levelId));
      if (level) {
        return level.name || level.value || "N/A";
      }
      return levelId;
    }
    return levelId || "N/A";
  };

  const openActionDialog = (statusId) => {
    setSelectedStatusId(statusId);
    setRemarks("");
    setRemarksError("");
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setSelectedStatusId(null);
    setRemarks("");
    setRemarksError("");
  };

  const handleAction = async () => {
    // Check if remarks are required for rejection
    if (
      (selectedStatusId === 58 || selectedStatusId === 60) &&
      !remarks.trim()
    ) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: selectedStatusId,
        serviceId: 26,
        assignedRoleId: currentRoleId,
        remarks: remarks || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
      };

      const response =
        await ApplyAccreditedCourseService.verifyAccreditedCourse(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        let successMessage;
        switch (selectedStatusId) {
          case 56:
            successMessage = "Course verified 1 successfully";
            break;
          case 62:
            successMessage = "Course verified 2 successfully";
            break;
          case 59:
            successMessage = "Course endorsed successfully";
            break;
          case 57:
            successMessage = "Course approved successfully";
            break;
          case 58:
            successMessage = "Course rejected successfully";
            break;
          case 60:
            successMessage = "Forwarded back to QAS Level 1";
            break;

          default:
            successMessage = "Action completed successfully";
        }

        closeDialog();
        await fetchCourseDetails();
        setNewDocuments([]);
        toast.success(successMessage);
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(error.response?.data?.message || "Failed to process course");
    } finally {
      setActionLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (selectedStatusId) {
      case 56:
        return "Verify Course Application";
      case 62:
        return "Verify Course Application";
      case 59:
        return "Endorse Course Application";
      case 57:
        return "Approve Course Application";
      case 58:
        return "Reject Course Application";
      case 60:
        return "Forward Back to QAS Level 1";
      default:
        return "Confirm Action";
    }
  };

  const getDialogContent = () => {
    if (selectedStatusId === 58 || selectedStatusId === 60) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this accredited course
            application:
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>Course Title: {getCourseName()}</strong>
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
    } else {
      const actionText =
        selectedStatusId === 56 || selectedStatusId === 62
          ? "verify"
          : selectedStatusId === 59
            ? "endorse"
            : "approve";

      return (
        <DialogContentText>
          Are you sure you want to {actionText} this accredited course
          application?
          <br />
          <strong>Application No: {applicationNo}</strong>
          <br />
          <strong>Course Title: {getCourseName()}</strong>
        </DialogContentText>
      );
    }
  };

  const getConfirmButtonColor = () => {
    switch (selectedStatusId) {
      case 56:
        return "success";
      case 62:
        return "success";
      case 57:
        return "success";
      case 58:
        return "error";
      case 60:
        return "success";
      case 59:
        return "primary";
      default:
        return "primary";
    }
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    switch (selectedStatusId) {
      case 56:
        return "Confirm Verify";
      case 62:
        return "Confirm Verify";
      case 59:
        return "Confirm Endorse";
      case 57:
        return "Confirm Approve";
      case 58:
      case 60:
        return "Confirm Reject";
      default:
        return "Confirm";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!courseData) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert severity="error">
          Accredited Course with Application No:{" "}
          <strong>{applicationNo}</strong> not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          Accredited Course Details
        </Typography>

        {/* Section 1: Training Provider Details */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            1. Training Provider Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Registration No"
                value={courseData.registration_no || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Institute Name"
                value={courseData.proposed_institute_name || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Curriculum Type"
                value={courseData.curriculum_name || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Sector"
                value={getSectorName()}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Course"
                value={getCourseName()}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Course Fee (RM)"
                value={courseData.course_fee || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Application No"
                value={courseData.application_no || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Modules/Certifications */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            2. Details of Modules, Code and Level Certification
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {certifications.map((module, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="NCS Code"
                  value={module.certificationCode || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Unit Name"
                  value={module.certificationModule || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Unit Level"
                  value={getUnitLevelName(module.certificationLevelId)}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          ))}
        </Paper>

        {/* Section 3: Curriculum */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            3. Curriculum and Course Duration
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {curriculums.map((curr, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Module No"
                  value={curr.moduleNo || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Module Name"
                  value={curr.moduleName || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Module Code"
                  value={curr.ncsCode || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Theory (Hrs)"
                  value={curr.theoryHour || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Practical (Hrs)"
                  value={curr.practicalHour || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="OJT (Hrs)"
                  value={curr.ojtHour || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          ))}
        </Paper>

        {/* Section 4: Training Facilities */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            4. Training Facilities
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="No of Class"
                value={courseData.class_no || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="No of Workshops"
                value={courseData.workshop_no || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="No of Training Lab"
                value={courseData.training_lab_no || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 5: Other Facilities */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            5. Other Facilities
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">
                  1. Training Tools and Equipment
                </FormLabel>
                <RadioGroup row value={courseData.equipment_tool || ""}>
                  <FormControlLabel
                    value="Y"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="N"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">
                  2. First Aid Facilities
                </FormLabel>
                <RadioGroup row value={courseData.first_aid_facility || ""}>
                  <FormControlLabel
                    value="Y"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="N"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">3. Toilet Facilities</FormLabel>
                <RadioGroup row value={courseData.toilet_facility || ""}>
                  <FormControlLabel
                    value="Y"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="N"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">
                  4. Lighting/Power Supply
                </FormLabel>
                <RadioGroup row value={courseData.lighting_power || ""}>
                  <FormControlLabel
                    value="Y"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="N"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">5. Fire Safety</FormLabel>
                <RadioGroup row value={courseData.fire_safety || ""}>
                  <FormControlLabel
                    value="Y"
                    control={<Radio size="small" />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="N"
                    control={<Radio size="small" />}
                    label="No"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Trainer-Trainee Ratio (Theory)"
                value={courseData.trainer_trainee_ratio_theory || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Trainer-Trainee Ratio (Practical)"
                value={courseData.trainer_trainee_ratio_practical || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Max no of Trainees per batch"
                value={courseData.max_no_trainees || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Present no of Trainees"
                value={courseData.present_no_trainee || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 6: Trainers */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            6. Trainer attached to the Course
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {trainersList.map((trainer, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={trainer.trainerName || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Qualification"
                  value={trainer.acamedicProfessional || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Industrial Exp (Years)"
                  value={trainer.industrialExperience || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Teaching Exp (Years)"
                  value={trainer.teachingExperience || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Subjects Taught"
                  value={trainer.subjectTaught || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Teaching Hrs"
                  value={trainer.teachingHour || "N/A"}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          ))}
        </Paper>

        {/* Section 7: Supporting Documents */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            7. Supporting Documents
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12 }}>
              <FileDownload
                initialFiles={documents}
                onFileUpload={handleFileUpload}
                allowUpload={true}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Role-based Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          {/* Role 7: First Verifier */}
          {roleId === "7" && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => openActionDialog(56)}
                disabled={actionLoading}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Verify1
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(58)}
                disabled={actionLoading}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Reject
              </Button>
            </>
          )}

          {/* Role 10: Second Verifier */}
          {roleId === "10" && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => openActionDialog(62)}
                disabled={actionLoading}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Verify2
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(60)}
                disabled={actionLoading}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Reject
              </Button>
            </>
          )}

          {/* Role 23: Endorser */}
          {roleId === "23" && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<VerifiedIcon />}
              onClick={() => openActionDialog(59)}
              disabled={actionLoading}
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
            >
              Endorse
            </Button>
          )}

          {/* Role 22: Approver */}
          {roleId === "22" && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => openActionDialog(57)}
              disabled={actionLoading}
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
            >
              Approve
            </Button>
          )}
        </Box>
      </Paper>

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
              actionLoading ||
              ((selectedStatusId === 58 || selectedStatusId === 60) &&
                !remarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewApplyAccreditedCourse;
