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
  Chip,
} from "@mui/material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CurriculumEndorsementIndexService from "../../../api/services/internal/course/CurriculumEndorsementIndexService";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileDownload from "../../../components/file/FileDownload";

const ViewCurriculumEndorsementIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [curriculumData, setCurriculumData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  useEffect(() => {
    if (applicationNo) {
      fetchAllData();
    }
  }, [applicationNo]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCurriculumDetails(), fetchCurriculumTypes()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load curriculum data");
    } finally {
      setLoading(false);
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

  const fetchCurriculumDetails = async () => {
    try {
      const response =
        await CurriculumEndorsementIndexService.getCurriculumDetailsByApplicationNo(
          applicationNo,
          access_token,
        );

      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setCurriculumData(data);

      // Parse documents to match FileDownload expected format
      if (data.documents) {
        let parsedDocs = [];

        if (Array.isArray(data.documents)) {
          parsedDocs = data.documents.map((doc) => ({
            name: doc.documentName || doc.name || "Document",
            url: doc.url || "",
            id: doc.id,
          }));
        } else if (typeof data.documents === "string") {
          try {
            const parsed = JSON.parse(data.documents);
            if (Array.isArray(parsed)) {
              parsedDocs = parsed.map((doc) => ({
                name: doc.documentName || doc.name || "Document",
                url: doc.url || "",
                id: doc.id,
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
      console.error("Error fetching curriculum details:", error);
      throw error;
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const getCurriculumTypeName = () => {
    if (curriculumData?.curriculum_type_id && curriculumTypes.length > 0) {
      const curriculumType = curriculumTypes.find(
        (type) => type.id === parseInt(curriculumData.curriculum_type_id),
      );
      return curriculumType ? curriculumType.name : "N/A";
    }
    return curriculumData?.curriculum_type_id || "N/A";
  };

  const handleAction = async () => {
    // StatusId 58 = Reject, StatusId 57 = Approve
    if (currentAction === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: currentAction,
        serviceId: 25,
        assignedRoleId: currentRoleId,
        remarks:
          currentAction === 58 ? remarks : remarks || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
      };

      const response =
        await CurriculumEndorsementIndexService.verifyCurriculumDevelopment(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Curriculum application ${currentAction === 57 ? "approved" : "rejected"} successfully!`,
        );
        closeDialog();
        await fetchCurriculumDetails();
        setNewDocuments([]);
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error(
        `Error ${currentAction === 57 ? "approving" : "rejecting"} curriculum:`,
        error,
      );
      toast.error(
        error.response?.data?.message ||
          `Failed to ${currentAction === 57 ? "approve" : "reject"} curriculum`,
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
    const statusId = curriculumData?.status_id;
    // StatusId 57 = Approved, StatusId 58 = Rejected
    return statusId === 57 || statusId === 58;
  };

  const getDialogTitle = () => {
    return currentAction === 57
      ? "Approve Curriculum Application"
      : "Reject Curriculum Application";
  };

  const getDialogContent = () => {
    if (currentAction === 57) {
      return (
        <DialogContentText>
          Are you sure you want to approve this curriculum application?
          <br />
          <strong>Application No: {applicationNo}</strong>
        </DialogContentText>
      );
    } else {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this curriculum application:
            <br />
            <strong>Application No: {applicationNo}</strong>
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

  if (!curriculumData) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert severity="error">
          Curriculum with Application No: <strong>{applicationNo}</strong> not
          found
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          Curriculum Development Details
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
                value={curriculumData.proposed_institute_name || "N/A"}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Registration Number"
                value={curriculumData.registration_no || "N/A"}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Curriculum Information */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Curriculum Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Curriculum Type"
                value={getCurriculumTypeName()}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Curriculum Name"
                value={curriculumData.curriculum_name || "N/A"}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Curriculum Description"
                value={curriculumData.description || "N/A"}
                size="small"
                multiline
                rows={4}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
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
            allowUpload={!isActionDisabled()}
          />
        </Paper>

        {/* Remarks Section */}
        {curriculumData.remarks && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Remarks / History
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              value={curriculumData.remarks || ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              size="small"
            />
          </Paper>
        )}

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(57)}
            disabled={isActionDisabled() || actionLoading}
            sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openDialog(58)}
            disabled={isActionDisabled() || actionLoading}
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
            disabled={
              actionLoading || (currentAction === 58 && !remarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewCurriculumEndorsementIndex;
