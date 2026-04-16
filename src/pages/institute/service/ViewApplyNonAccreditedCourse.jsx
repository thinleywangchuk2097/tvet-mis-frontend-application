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
} from "@mui/material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedIcon from "@mui/icons-material/Verified";
import ApplyNonAccreditedCourseService from "../../../api/services/ApplyNonAccreditedCourseService";
import CommonService from "../../../api/services/CommonService";
import FileDownload from "../../../components/file/FileDownload";

const ViewApplyNonAccreditedCourse = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

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
        fetchCertificateLevels(),
        fetchCurriculumTypes(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(10);
      setCertificateLevels(response.data);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  };

  const fetchCurriculumTypes = async () => {
    try {
      const response = await CommonService.getByParentId(13);
      setCurriculumTypes(response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedCourseByApplicationNo(
          applicationNo,
          access_token,
        );
      console.log("Course details response:", response.data);

      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setCourseData(data);

      // Parse documents to match FileDownload expected format
      if (data.documents) {
        let parsedDocs = [];

        if (Array.isArray(data.documents)) {
          parsedDocs = data.documents.map((doc) => ({
            name: doc.documentName || doc.name || "Document",
            url: doc.url || "",
            id: doc.id,
            content: doc.content,
            contentType: doc.contentType,
          }));
        } else if (typeof data.documents === "string") {
          try {
            const parsed = JSON.parse(data.documents);
            if (Array.isArray(parsed)) {
              parsedDocs = parsed.map((doc) => ({
                name: doc.documentName || "Document",
                url: doc.url || "",
                id: doc.id,
                filePath: doc.url,
              }));
            }
          } catch (e) {
            console.error("Error parsing documents:", e);
          }
        }

        setDocuments(parsedDocs);
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

  const getCertificateLevelName = () => {
    if (courseData?.certificate_level_id && certificateLevels.length > 0) {
      const certificateLevel = certificateLevels.find(
        (level) => level.id === parseInt(courseData.certificate_level_id),
      );
      return certificateLevel
        ? certificateLevel.name ||
            certificateLevel.value ||
            certificateLevel.certificate_level_name ||
            "N/A"
        : "N/A";
    }
    return courseData?.certificate_level_id || "N/A";
  };

  const getCurriculumTypeName = () => {
    if (courseData?.curriculum_type_id && curriculumTypes.length > 0) {
      const curriculumType = curriculumTypes.find(
        (type) => type.id === parseInt(courseData.curriculum_type_id),
      );
      return curriculumType
        ? curriculumType.name || curriculumType.curriculum_name || "N/A"
        : "N/A";
    }
    return courseData?.curriculum_type_id || "N/A";
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
        serviceId: 13,
        assignedRoleId: currentRoleId,
        remarks: remarks || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
      };
      console.log("Action payload:", payload);

      const response =
        await ApplyNonAccreditedCourseService.verifyNonAccreditedCourse(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        let successMessage;
        switch (selectedStatusId) {
          case 56:
            successMessage = "Course verified successfully";
            break;
          case 62:
            successMessage = "Course verified successfully";
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

        toast.success(successMessage);
        closeDialog();
        await fetchCourseDetails();
        setNewDocuments([]);
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
            Please provide remarks for rejecting this non-accredited course
            application:
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>Course Title: {courseData?.course_title}</strong>
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
          Are you sure you want to {actionText} this non-accredited course
          application?
          <br />
          <strong>Application No: {applicationNo}</strong>
          <br />
          <strong>Course Title: {courseData?.course_title}</strong>
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
          Non-Accredited Course with Application No:{" "}
          <strong>{applicationNo}</strong> not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          Non-Accredited Course Details
        </Typography>

        {/* Institute Information */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Institute Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Training Provider/Institution Name"
                value={courseData.proposed_institute_name || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Registration Number"
                value={courseData.registration_no || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Course Information */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Course Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Course Title"
                value={courseData.course_title || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Certificate Level"
                value={getCertificateLevelName()}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Theory (Hours)"
                value={courseData.theory_hour || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Practical (Hours)"
                value={courseData.practical_hour || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="OJT (Hours)"
                value={courseData.ojt_hour || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Fees per trainee (RM)"
                value={courseData.fees_per_trainee || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Enrollment capacity per batch"
                value={courseData.enrolment_capacity || "N/A"}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Curriculum Type"
                value={getCurriculumTypeName()}
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Supporting Documents */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>
            Supporting Documents
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <FileDownload
            initialFiles={documents}
            onFileUpload={handleFileUpload}
            allowUpload={true}
          />
        </Paper>

        {/* Remarks Section */}
        {courseData.remarks && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Remarks / History
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              value={courseData.remarks || ""}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Paper>
        )}

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

export default ViewApplyNonAccreditedCourse;
