import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CommonService from "../../../api/services/internal/common/CommonService";
import AssessorAccreditorQMSAuditorService from "../../../api/services/internal/registration/AssessorAccreditorQMSAuditorService";

const ViewAssessorAccreditorQMSAuditor = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const { applicationNo } = useParams();
  const navigate = useNavigate();

  const [serviceName, setServiceName] = useState("");
  const [serviceId, setServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [parsedWorkExperiences, setParsedWorkExperiences] = useState([]);

  // State for dropdown data
  const [sectors, setSectors] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [genders, setGenders] = useState([]);
  const [occupations, setOccupations] = useState([]);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  useEffect(() => {
    if (applicationNo) {
      fetchApplicationDetails();
      fetchMasterData();
    }
  }, [applicationNo]);

  useEffect(() => {
    let isMounted = true;
    const fetchServiceName = async () => {
      try {
        const response = await CommonService.getServiceName(serviceId);
        if (isMounted) {
          setServiceName(response.data.serviceName);
        }
      } catch (error) {
        console.error("Error fetching service name:", error);
      }
    };
    if (serviceId) {
      fetchServiceName();
    }
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const fetchMasterData = async () => {
    try {
      const [sectorsRes, dzongkhagsRes, certificationRes, genderRes] =
        await Promise.all([
          CommonService.getAllSectors(),
          CommonService.getAllDzongkhags(),
          CommonService.getByParentId(10),
          CommonService.getByParentId(8),
        ]);

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setCertificationLevels(certificationRes.data || []);
      setGenders(genderRes.data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data");
    }
  };

  const parseDocuments = (docsStr) => {
    try {
      if (!docsStr) return [];
      const docs = typeof docsStr === "string" ? JSON.parse(docsStr) : docsStr;
      return docs.map((doc) => ({
        name: doc.documentName || doc.name,
        url: doc.url,
        id: doc.id,
      }));
    } catch (error) {
      console.error("Error parsing documents:", error);
      return [];
    }
  };

  const parseWorkExperiences = (workExpStr) => {
    try {
      if (!workExpStr) return [];
      const experiences =
        typeof workExpStr === "string" ? JSON.parse(workExpStr) : workExpStr;
      return Array.isArray(experiences) ? experiences : [];
    } catch (error) {
      console.error("Error parsing work experiences:", error);
      return [];
    }
  };

  const determineServiceId = (data) => {
    if (
      data.qms_training ||
      data.work_experiences ||
      data.academic_background
    ) {
      return 3;
    }
    if (data.designation || data.years_of_experience || data.responsibility) {
      return 5;
    }
    if (data.sector_id || data.occupation_id || data.certification_level_id) {
      return 32;
    }
    return data.service_id || null;
  };

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const response =
        await AssessorAccreditorQMSAuditorService.getDetailsByApplicationNo(
          applicationNo,
          access_token,
        );

      let data = response.data;
      console.log("Fetched application data:", data);
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setServiceId(determineServiceId(data));

      // Parse documents
      const parsedDocs = parseDocuments(data.documents);
      const workExperiences = parseWorkExperiences(data.work_experiences);

      // Fetch occupations if sector is available
      if (data.sector_id) {
        const occupationRes = await CommonService.getOccupationsBySectorId(
          data.sector_id,
        );
        setOccupations(occupationRes.data || []);
      }

      setApplicationData(data);
      setDocuments(parsedDocs);
      setParsedWorkExperiences(workExperiences);
    } catch (error) {
      console.error("Error fetching application details:", error);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const getSectorName = (id) => {
    if (!id) return "";
    const sector = sectors.find((s) => s.id.toString() === id.toString());
    return sector ? sector.sectorName : id;
  };

  const getDzongkhagName = (id) => {
    if (!id) return "";
    const dz = dzongkhags.find((d) => d.id.toString() === id.toString());
    return dz ? dz.dzonkhagName || dz.dzongkhagName : id;
  };

  const getCertificationLevelName = (id) => {
    if (!id) return "";
    const level = certificationLevels.find(
      (l) => l.id.toString() === id.toString(),
    );
    return level ? level.name : id;
  };

  const getGenderName = (id) => {
    if (!id) return "";
    const gender = genders.find((g) => g.id.toString() === id.toString());
    return gender ? gender.name : id;
  };

  const getOccupationName = (id) => {
    if (!id) return "";
    const occupation = occupations.find(
      (o) => o.id.toString() === id.toString(),
    );
    return occupation ? occupation.occupationName : id;
  };

  const handleAction = async () => {
    // For reject action, remarks are required
    if (selectedStatusId === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationData.application_no,
        fullName: applicationData.full_name,
        mobileNo: applicationData.mobile_no,
        email: applicationData.email,
        dzongkhagId: applicationData.dzongkhag_id,
        serviceId: parseInt(serviceId),
        assignedRoleId: parseInt(currentRoleId),
        statusId: selectedStatusId,
        documents: newDocuments,
        remarks: selectedStatusId === 58 ? remarks : "",
      };

      console.log("Sending payload:", payload);

      const response =
        await AssessorAccreditorQMSAuditorService.verifyAssessorAccreditorQMSAuditor(
          payload,
          access_token,
        );

      const statusMessage =
        selectedStatusId === 56
          ? "verified"
          : selectedStatusId === 57
            ? "approved"
            : "rejected";
      toast.success(
        response.data.message || `Application ${statusMessage} successfully`,
      );

      closeDialog();
      fetchApplicationDetails();
      setNewDocuments([]);
      navigate(-1);
    } catch (error) {
      console.error(`Error processing application:`, error);
      toast.error(`Failed to process application: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (statusId) => {
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

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  // Get action name based on statusId
  const getActionName = (statusId) => {
    switch (statusId) {
      case 56:
        return "Verify";
      case 57:
        return "Approve";
      case 58:
        return "Reject";
      default:
        return "";
    }
  };

  // Get action color based on statusId
  const getActionColor = (statusId) => {
    switch (statusId) {
      case 56:
        return "primary";
      case 57:
        return "success";
      case 58:
        return "error";
      default:
        return "primary";
    }
  };

  // Render action buttons based on role ID
  const renderActionButtons = () => {
    const roleId = parseInt(currentRoleId);
    const isProcessed = applicationData?.task_status_id === "18";

    if (isProcessed) {
      return null;
    }

    // For Role ID 7: Show Verify (56) and Reject (58) buttons
    if (roleId === 7) {
      return (
        <>
          <Button
            type="button"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(56)}
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Verify 
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openDialog(58)}
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Reject 
          </Button>
        </>
      );
    }

    // For Role ID 22: Show Approve (57) and Reject (58) buttons
    if (roleId === 22) {
      return (
        <>
          <Button
            type="button"
            variant="contained"
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "#2e7d32",
              "&:hover": { bgcolor: "#1b5e20" },
            }}
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(57)}
          >
            Approve 
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openDialog(58)}
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Reject 
          </Button>
        </>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!applicationData) {
    return (
      <Box sx={{ m: 2 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            Application not found
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ m: { xs: 2, md: 2 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          width: "100%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              letterSpacing: 0.7,
              borderBottom: "2px solid #555",
              color: "#1a1a1a",
              display: "inline-block",
              fontFamily: "'Roboto', 'Arial', sans-serif",
              textTransform: "capitalize",
            }}
          >
            {serviceName || "Application"} Details
          </Typography>
        </Box>

        {/* Section: Basic Info */}
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Reference No"
                size="small"
                value={applicationData.reference_no || "N/A"}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={requiredLabel("Full Name")}
                size="small"
                value={applicationData.full_name || "N/A"}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={requiredLabel("Gender")}
                size="small"
                value={
                  applicationData.gender_name ||
                  getGenderName(applicationData.gender_id) ||
                  "N/A"
                }
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={requiredLabel("Mobile No")}
                size="small"
                value={applicationData.mobile_no || "N/A"}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={requiredLabel("Email")}
                size="small"
                value={applicationData.email || "N/A"}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={requiredLabel(
                  "Location of Working Organization (Dzongkhag)",
                )}
                size="small"
                value={
                  applicationData.dzongkhag_name ||
                  getDzongkhagName(applicationData.dzongkhag_id) ||
                  "N/A"
                }
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={requiredLabel("Name of the Working Organization")}
                size="small"
                value={applicationData.organization_name || "N/A"}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section: QMS Auditor Criteria - For Service 3 */}
        {serviceId === 3 && (
          <>
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                mb: 4,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Registration Criteria
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={requiredLabel("QMS Auditor Training Attended")}
                    size="small"
                    value={applicationData.qms_training || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>

              {applicationData.qms_training === "Yes" && (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label={requiredLabel(
                        "Academic / Technical / Professional Background",
                      )}
                      size="small"
                      value={applicationData.academic_background || "N/A"}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Work Experience */}
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                mb: 4,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Registration Criteria: Relevant Work Experience (Minimum of 5
                years)
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {parsedWorkExperiences.length > 0 ? (
                parsedWorkExperiences.map((exp, index) => (
                  <Grid
                    container
                    spacing={3}
                    key={exp.id || index}
                    sx={{ mb: 2, alignItems: "flex-start" }}
                  >
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Organization Name")}
                        size="small"
                        value={exp.organizationName || "N/A"}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 2 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Designation")}
                        size="small"
                        value={exp.designation || "N/A"}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label={requiredLabel("Number of Years")}
                        size="small"
                        value={exp.year || "N/A"}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        rows={2}
                        label={requiredLabel("Responsibility")}
                        size="small"
                        value={exp.responsibility || "N/A"}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    </Grid>
                  </Grid>
                ))
              ) : (
                <Typography
                  color="textSecondary"
                  sx={{ p: 2, textAlign: "center" }}
                >
                  No work experience data available
                </Typography>
              )}
            </Paper>
          </>
        )}

        {/* Section: Assessor Criteria (Service 32) */}
        {serviceId === 32 && (
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Assessor Registration Criteria
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Sector")}
                  size="small"
                  value={
                    applicationData.sector_name ||
                    getSectorName(applicationData.sector_id) ||
                    "N/A"
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Occupation")}
                  size="small"
                  value={
                    applicationData.occupation_name ||
                    getOccupationName(applicationData.occupation_id) ||
                    "N/A"
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Certification Level")}
                  size="small"
                  value={
                    applicationData.certification_level_name ||
                    getCertificationLevelName(
                      applicationData.certification_level_id,
                    ) ||
                    "N/A"
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Section: Accreditor Criteria (Service 5) */}
        {serviceId === 5 && (
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Accreditor Registration Criteria
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Sector")}
                  size="small"
                  value={
                    applicationData.sector_name ||
                    getSectorName(applicationData.sector_id) ||
                    "N/A"
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Occupation")}
                  size="small"
                  value={
                    applicationData.occupation_name ||
                    getOccupationName(applicationData.occupation_id) ||
                    "N/A"
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Certification Level")}
                  size="small"
                  value={
                    applicationData.certification_level_name ||
                    getCertificationLevelName(
                      applicationData.certification_level_id,
                    ) ||
                    "N/A"
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Designation")}
                  size="small"
                  value={applicationData.designation || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Years of Experience")}
                  size="small"
                  type="number"
                  value={applicationData.years_of_experience || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Responsibility")}
                  size="small"
                  value={applicationData.responsibility || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Section: Supporting Documents */}
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Supporting Documents ({documents.length + newDocuments.length})
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <FileDownload
            initialFiles={documents}
            onFileUpload={handleFileUpload}
            allowUpload={true}
          />
        </Paper>

        {/* Remarks Section */}
        {applicationData.remarks && (
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              bgcolor: "#fff8e1",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 2, color: "#f57c00" }}
            >
              Remarks
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body1">{applicationData.remarks}</Typography>
          </Paper>
        )}

        {/* Form Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          {renderActionButtons()}
        </Box>
      </Paper>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {getActionName(selectedStatusId)} Application 
        </DialogTitle>
        <DialogContent>
          {selectedStatusId !== 58 ? (
            <DialogContentText>
              Are you sure you want to{" "}
              {getActionName(selectedStatusId).toLowerCase()} this application?
              <br />
              <strong>Application No: {applicationData.application_no}</strong>
             
            </DialogContentText>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Please provide remarks for rejecting this application:
                <br />
                <strong>
                  Application No: {applicationData.application_no}
                </strong>
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
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDialog}
            color="error"
            variant="contained"
            size="small"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={getActionColor(selectedStatusId)}
            variant="contained"
            size="small"
            disabled={
              actionLoading || (selectedStatusId === 58 && !remarks.trim())
            }
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : (
              `Confirm ${getActionName(selectedStatusId)} `
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewAssessorAccreditorQMSAuditor;
