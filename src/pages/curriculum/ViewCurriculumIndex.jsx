import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
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
import FastForwardIcon from "@mui/icons-material/FastForward";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CommonService from "../../api/services/internal/common/CommonService";
import FileDownload from "../../components/file/FileDownload";
import CurriculumIndexService from "../../api/services/internal/course/CurriculumIndexService";
import NcsService from "../../api/services/internal/ncs/NcsService";

// ==================== SUB-COMPONENTS ====================

// RejectButton component
const RejectButton = ({ isDisabled, onReject }) => (
  <Button
    variant="contained"
    color="error"
    startIcon={<CancelIcon />}
    onClick={onReject}
    disabled={isDisabled}
    sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
  >
    Reject
  </Button>
);

RejectButton.propTypes = {
  isDisabled: PropTypes.bool,
  onReject: PropTypes.func.isRequired,
};

// ActionButton component
const ActionButton = ({
  color,
  startIcon,
  onClick,
  disabled,
  label,
  variant = "contained",
}) => (
  <Button
    variant={variant}
    color={color}
    startIcon={startIcon}
    onClick={onClick}
    disabled={disabled}
    sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
  >
    {label}
  </Button>
);

ActionButton.propTypes = {
  color: PropTypes.oneOf(["primary", "success", "error", "warning", "info"]),
  startIcon: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["contained", "outlined", "text"]),
};

// ==================== MAIN COMPONENT ====================

const ViewCurriculumIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [curriculumData, setCurriculumData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const [programmeTypes, setProgrammeTypes] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [remarksInput, setRemarksInput] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // State for Sector and Occupation dropdowns
  const [sectors, setSectors] = useState([]);
  const [occupations, setOccupations] = useState([]);

  // State for Programme Title
  const [programmeTitle, setProgrammeTitle] = useState("");
  const [loadingProgrammeTitle, setLoadingProgrammeTitle] = useState(false);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

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
      await Promise.all([
        fetchCurriculumDetails(),
        fetchCurriculumTypes(),
        fetchProgrammeTypes(),
        fetchCertificateLevels(),
        fetchDropdownData(),
        fetchSectors(),
        fetchAllOccupations(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load curriculum data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumTypes = async () => {
    try {
      const response = await CommonService.getCurriculumServiceType();
      setCurriculumTypes(response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchProgrammeTypes = async () => {
    try {
      const response = await CommonService.getByParentId(13);
      setProgrammeTypes(response.data);
    } catch (error) {
      console.error("Error fetching programme types:", error);
    }
  };

  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(27);
      setCertificateLevels(response.data);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await CommonService.getByParentId(4);
      setDropdownData(response.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Fetch sectors
  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      setSectors(response.data || []);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  // Fetch all occupations
  const fetchAllOccupations = async () => {
    try {
      const sectorsResponse = await CommonService.getAllSectors();
      const sectorsData = sectorsResponse.data || [];

      let allOccs = [];
      for (const sector of sectorsData) {
        try {
          const occResponse = await CommonService.getOccupationsBySectorId(
            sector.id,
          );
          const occData = occResponse.data || [];
          allOccs = [...allOccs, ...occData];
        } catch (e) {
          console.error(
            `Error fetching occupations for sector ${sector.id}:`,
            e,
          );
        }
      }

      const uniqueOccs = allOccs.filter(
        (occ, index, self) => index === self.findIndex((o) => o.id === occ.id),
      );
      setOccupations(uniqueOccs);
    } catch (error) {
      console.error("Error fetching all occupations:", error);
    }
  };

  // Fetch programme title by ID using NcsService
  const fetchProgrammeTitleById = async (programmeId) => {
    if (!programmeId) {
      setProgrammeTitle("N/A");
      return;
    }

    setLoadingProgrammeTitle(true);
    try {
      const response = await NcsService.getProgrammeTitleById(
        programmeId,
        access_token,
      );
      console.log("Programme Title Response:", response);
      console.log("Programme Title Response Data:", response.data);

      // Check if response.data is an array and has elements
      if (
        response &&
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const item = response.data[0];
        // Try to get the programme title from various possible field names
        const title =
          item.programme_title ||
          item.courseName ||
          item.name ||
          item.occupationName ||
          item.title;

        if (title) {
          setProgrammeTitle(title);
          console.log("Programme Title set to:", title);
        } else {
          console.warn("No title found in response data:", item);
          setProgrammeTitle(`Programme ID: ${programmeId}`);
        }
      } else if (
        response &&
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        // If it's a single object (not an array)
        const item = response.data;
        const title =
          item.programme_title ||
          item.courseName ||
          item.name ||
          item.occupationName ||
          item.title;

        if (title) {
          setProgrammeTitle(title);
        } else {
          setProgrammeTitle(`Programme ID: ${programmeId}`);
        }
      } else {
        console.warn("Unexpected response format:", response);
        setProgrammeTitle(`Programme ID: ${programmeId}`);
      }
    } catch (error) {
      console.error("Error fetching programme title:", error);
      setProgrammeTitle(`Programme ID: ${programmeId}`);
    } finally {
      setLoadingProgrammeTitle(false);
    }
  };

  const fetchCurriculumDetails = async () => {
    try {
      const response =
        await CurriculumIndexService.getCurriculumDetailsByApplicationNo(
          applicationNo,
          access_token,
        );
      console.log("curriculum data : ", response.data);
      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setCurriculumData(data);

      // If BQF Programme, fetch programme title by programme_id
      if (
        data &&
        parseInt(data.programme_type_id) === 41 &&
        data.programme_id
      ) {
        await fetchProgrammeTitleById(data.programme_id);
      } else if (data && parseInt(data.programme_type_id) === 42) {
        // For Non-BQF, use programme_title directly
        setProgrammeTitle(data.programme_title || "N/A");
      } else {
        setProgrammeTitle("N/A");
      }

      if (data.remarks) {
        setRemarksInput(data.remarks);
      }

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

  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const status = dropdownData.find((item) => item.id === parseInt(statusId));
    return status ? status.name : "Pending";
  };

  const getStatusColor = (statusId) => {
    if (!statusId) return "default";
    const status = dropdownData.find((item) => item.id === parseInt(statusId));
    if (!status) return "default";

    const statusName = status.name.toLowerCase();
    if (statusName.includes("approve") || statusName.includes("complete")) {
      return "success";
    } else if (statusName.includes("reject") || statusName.includes("cancel")) {
      return "error";
    } else if (
      statusName.includes("pending") ||
      statusName.includes("review")
    ) {
      return "warning";
    }
    return "default";
  };

  const getCurriculumTypeName = () => {
    if (!curriculumData?.curriculum_type_id) return "N/A";
    if (curriculumTypes.length === 0) return "Loading...";

    const curriculumType = curriculumTypes.find((type) => {
      const typeId = parseInt(type.id);
      const curriculumTypeId = parseInt(curriculumData.curriculum_type_id);
      return typeId === curriculumTypeId;
    });
    return curriculumType
      ? curriculumType.service_name || curriculumType.name
      : "N/A";
  };

  const getCourseTypeName = () => {
    if (!curriculumData?.programme_type_id) return "N/A";
    if (programmeTypes.length === 0) return "Loading...";

    const programmeType = programmeTypes.find((type) => {
      const typeId = parseInt(type.id);
      const programmeTypeId = parseInt(curriculumData.programme_type_id);
      return typeId === programmeTypeId;
    });
    return programmeType ? programmeType.name : "N/A";
  };

  const getCertificateLevelName = () => {
    if (!curriculumData?.certificate_level_id) return "N/A";
    if (certificateLevels.length === 0) return "Loading...";

    const level = certificateLevels.find((item) => {
      const itemId = parseInt(item.id);
      const levelId = parseInt(curriculumData.certificate_level_id);
      return itemId === levelId;
    });
    return level ? level.name : "N/A";
  };

  // Get sector name by ID
  const getSectorName = () => {
    if (!curriculumData?.sector_id) return "N/A";
    if (sectors.length === 0) return "Loading...";

    const sector = sectors.find((item) => {
      const itemId = parseInt(item.id);
      const sectorId = parseInt(curriculumData.sector_id);
      return itemId === sectorId;
    });
    return sector ? sector.sectorName : "N/A";
  };

  // Get occupation name by ID
  const getOccupationName = () => {
    if (!curriculumData?.occupation_id) return "N/A";
    if (occupations.length === 0) return "Loading...";

    const occupation = occupations.find((item) => {
      const itemId = parseInt(item.id);
      const occupationId = parseInt(curriculumData.occupation_id);
      return itemId === occupationId;
    });
    return occupation ? occupation.occupationName : "N/A";
  };

  // Get programme title
  const getProgrammeTitle = () => {
    if (loadingProgrammeTitle) return "Loading...";
    return programmeTitle || "N/A";
  };

  // Helper function to check if curriculum type matches allowed types
  const isCurriculumTypeAllowed = (allowedTypes) => {
    if (!curriculumData?.curriculum_type_id) {
      return false;
    }
    const curriculumTypeId = parseInt(curriculumData.curriculum_type_id);
    const isAllowed = allowedTypes.some(
      (type) => parseInt(type) === curriculumTypeId,
    );
    return isAllowed;
  };

  // Check if this is a BQF Programme
  const isBQFCourse = () => {
    return parseInt(curriculumData?.programme_type_id) === 41;
  };

  // Check if action buttons should be shown based on role and curriculum type
  const shouldShowActionButtons = () => {
    if (!curriculumData) {
      return false;
    }

    const statusId = curriculumData.status_id;
    const roleId = parseInt(currentRoleId);
    const curriculumTypeId = curriculumData.curriculum_type_id;
    // Don't show buttons if already approved (57) or rejected (58)
    if (parseInt(statusId) === 57 || parseInt(statusId) === 58) {
      return false;
    }

    return true;
  };

  // Open dialog with action
  const openDialog = (action) => {
    setCurrentAction(action);
    setRemarksError("");
    setActionDialogOpen(true);
  };

  // Handle reject action
  const handleReject = () => {
    openDialog(58);
  };

  // Get the action buttons based on role
  const getActionButtons = () => {
    const showButtons = shouldShowActionButtons();
    if (!showButtons) return null;
    const statusId = curriculumData?.status_id;
    const isDisabled =
      parseInt(statusId) === 57 || parseInt(statusId) === 58 || actionLoading;
    const roleId = parseInt(currentRoleId);

    // Role 21: Forwarded TTTRC (113) + Reject (58)
    if (roleId === 21 && isCurriculumTypeAllowed(["25", "49"])) {
      return (
        <>
          <ActionButton
            color="primary"
            startIcon={<FastForwardIcon />}
            onClick={() => openDialog(113)}
            disabled={isDisabled}
            label="Forward TTTRC"
          />
          <RejectButton isDisabled={isDisabled} onReject={handleReject} />
        </>
      );
    }

    // Role 14: Forwarded Head TTTRC (114) + Reject (58)
    if (roleId === 14 && isCurriculumTypeAllowed(["25", "49", "48"])) {
      return (
        <>
          <ActionButton
            color="primary"
            startIcon={<FastForwardIcon />}
            onClick={() => openDialog(114)}
            disabled={isDisabled}
            label="Forward Head TTTRC"
          />
          <RejectButton isDisabled={isDisabled} onReject={handleReject} />
        </>
      );
    }

    // Role 15: Approve (57) + Reject (58) for curriculum type 25
    if (roleId === 15 && isCurriculumTypeAllowed(["25"])) {
      return (
        <>
          <ActionButton
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(57)}
            disabled={isDisabled}
            label="Approve"
          />
          <RejectButton isDisabled={isDisabled} onReject={handleReject} />
        </>
      );
    }

    // Role 15: Endorse (59) + Reject (58) for curriculum types 48 and 49
    if (roleId === 15 && isCurriculumTypeAllowed(["48", "49"])) {
      return (
        <>
          <ActionButton
            color="success"
            startIcon={<ThumbUpIcon />}
            onClick={() => openDialog(59)}
            disabled={isDisabled}
            label="Endorse"
          />
          <RejectButton isDisabled={isDisabled} onReject={handleReject} />
        </>
      );
    }

    // For all other roles, show only Reject button
    return <RejectButton isDisabled={isDisabled} onReject={handleReject} />;
  };

  const handleAction = async () => {
    // For reject action (58), remarks are required
    if (currentAction === 58 && !remarksInput.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: currentAction,
        serviceId: curriculumData?.curriculum_type_id,
        assignedRoleId: currentRoleId,
        remarks: remarksInput || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
      };

      console.log("Action payload:", payload);

      const response = await CurriculumIndexService.verifyCurriculumDevelopment(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        let actionMessage = "";
        if (currentAction === 57) {
          actionMessage = "approved";
        } else if (currentAction === 58) {
          actionMessage = "rejected";
        } else if (currentAction === 59) {
          actionMessage = "endorsed";
        } else if (currentAction === 113) {
          actionMessage = "forwarded to TTTRC";
        } else if (currentAction === 114) {
          actionMessage = "forwarded to Head TTTRC";
        }

        toast.success(`Curriculum application ${actionMessage} successfully!`);
        closeDialog();
        await fetchCurriculumDetails();
        setNewDocuments([]);
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(error.response?.data?.message || "Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setCurrentAction(null);
    setRemarksError("");
  };

  const isActionDisabled = () => {
    const statusId = curriculumData?.status_id;
    return parseInt(statusId) === 57 || parseInt(statusId) === 58;
  };

  const getDialogTitle = () => {
    if (currentAction === 57) return "Approve Curriculum Application";
    if (currentAction === 58) return "Reject Curriculum Application";
    if (currentAction === 59) return "Endorse Curriculum Application";
    if (currentAction === 113) return "Forward to TTTRC";
    if (currentAction === 114) return "Forward to Head TTTRC";
    return "Confirm Action";
  };

  const getDialogContent = () => {
    const actionText = {
      57: "approve",
      58: "reject",
      59: "endorse",
      113: "forward to TTTRC",
      114: "forward to Head TTTRC",
    };

    if (
      currentAction === 57 ||
      currentAction === 59 ||
      currentAction === 113 ||
      currentAction === 114
    ) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to {actionText[currentAction]} this curriculum
            application?
            <br />
            <strong>Application No: {applicationNo}</strong>
          </DialogContentText>
          <TextField
            margin="dense"
            label="Remarks (Optional)"
            fullWidth
            multiline
            rows={3}
            value={remarksInput}
            onChange={(e) => {
              setRemarksInput(e.target.value);
              setRemarksError("");
            }}
            placeholder="Add any additional remarks here..."
          />
        </>
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
            value={remarksInput}
            onChange={(e) => {
              setRemarksInput(e.target.value);
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
    if (currentAction === 57) return "success";
    if (currentAction === 58) return "error";
    if (currentAction === 59) return "success";
    return "primary";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    const actionText = {
      57: "Confirm Approve",
      58: "Confirm Reject",
      59: "Confirm Endorse",
      113: "Confirm Forward",
      114: "Confirm Forward",
    };
    return actionText[currentAction] || "Confirm";
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Curriculum Details
          </Typography>
          {curriculumData.status_id && (
            <Chip
              label={getStatusName(curriculumData.status_id)}
              color={getStatusColor(curriculumData.status_id)}
              size="small"
            />
          )}
        </Box>

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
                label="Curriculum Title"
                value={curriculumData.curriculum_title || "N/A"}
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
                label="Programme Type"
                value={getCourseTypeName()}
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
                label="Programme Title"
                value={getProgrammeTitle()}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>

            {/* BQF Course specific fields - Sector and Occupation */}
            {isBQFCourse() && (
              <>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Sector"
                    value={getSectorName()}
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
                    label="Occupation"
                    value={getOccupationName()}
                    size="small"
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Certificate Level"
                value={getCertificateLevelName()}
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
                label="Total Theory Duration"
                value={curriculumData.total_theory_duration || "N/A"}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Total Practical Duration"
                value={curriculumData.total_practical_duration || "N/A"}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Total OJT Duration"
                value={curriculumData.total_ojt_duration || "N/A"}
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
                label="Total Program Duration"
                value={curriculumData.total_program_duration || "N/A"}
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 12 }}>
              <TextField
                fullWidth
                label="Entry Requirement"
                value={curriculumData.entry_requirement || "N/A"}
                size="small"
                multiline
                rows={2}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 12 }}>
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

        {/* Remarks Input Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>
            Remarks
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Enter Remarks"
                multiline
                rows={4}
                value={remarksInput}
                onChange={(e) => {
                  setRemarksInput(e.target.value);
                  setRemarksError("");
                }}
                placeholder="Enter your remarks here..."
                size="small"
                disabled={isActionDisabled()}
                error={!!remarksError}
                helperText={remarksError}
              />
              {!isActionDisabled() && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  * Remarks will be saved when you perform an action on the
                  application
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          {getActionButtons()}
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
              actionLoading || (currentAction === 58 && !remarksInput.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
ViewCurriculumIndex.propTypes = {};

export default ViewCurriculumIndex;
