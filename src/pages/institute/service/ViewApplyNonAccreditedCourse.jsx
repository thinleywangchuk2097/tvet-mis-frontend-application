import React, { useState, useEffect, useCallback } from "react";
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
  const [currentAction, setCurrentAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

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
        fetchCurriculumTypes()
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
      const response = await ApplyNonAccreditedCourseService.getNonAccreditedCourseByApplicationNo(
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
        ? (certificateLevel.name || certificateLevel.value || certificateLevel.certificate_level_name || "N/A") 
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
        ? (curriculumType.name || curriculumType.curriculum_name || "N/A") 
        : "N/A";
    }
    return courseData?.curriculum_type_id || "N/A";
  };

  const handleAction = async () => {
    if (currentAction === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: currentAction,
        serviceId: 13,
        assignedRoleId: 21,
        remarks: currentAction === 58 ? remarks : remarks || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
      };
console.log("Action payload:", payload);
      const response = await ApplyNonAccreditedCourseService.verifyNonAccreditedCourse(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Course application ${currentAction === 57 ? "approved" : "rejected"} successfully!`,
        );
        closeDialog();
        await fetchCourseDetails();
        setNewDocuments([]);
        setTimeout(() => {
          navigate("/tasklist/task-details-index");
        }, 2000);
      }
    } catch (error) {
      console.error(
        `Error ${currentAction === 57 ? "approving" : "rejecting"} course:`,
        error,
      );
      toast.error(
        error.response?.data?.message ||
          `Failed to ${currentAction === 57 ? "approve" : "reject"} course`,
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

  const getDialogTitle = () => {
    return currentAction === 57
      ? "Approve Course Application"
      : "Reject Course Application";
  };

  const getDialogContent = () => {
    if (currentAction === 57) {
      return (
        <DialogContentText>
          Are you sure you want to approve this non-accredited course application?
          <br />
          <strong>Application No: {applicationNo}</strong>
          <br />
          <strong>Course Title: {courseData?.course_title}</strong>
        </DialogContentText>
      );
    } else {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this non-accredited course application:
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
    }
  };

  const getConfirmButtonColor = () => {
    return currentAction === 57 ? "success" : "error";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    return currentAction === 57 ? "Confirm Approve" : "Confirm Reject";
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
          Non-Accredited Course with Application No: <strong>{applicationNo}</strong> not found
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

        {/* Action Buttons - Always visible */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(57)}
            disabled={actionLoading}
            sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openDialog(58)}
            disabled={actionLoading}
            sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
          >
            Reject
          </Button>
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
            disabled={actionLoading || (currentAction === 58 && !remarks.trim())}
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewApplyNonAccreditedCourse;