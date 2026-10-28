import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedIcon from "@mui/icons-material/Verified";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";
import SelfAssessmentReportService from "../../../api/services/internal/registration/SelfAssessmentReportService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import BasicInformationSection from "./self-assessment/BasicInformationSection";
import QualityStandardsTabs from "./self-assessment/QualityStandardsTabs";
import { loadInstituteTrainersAndCourses } from "./self-assessment/basicInfoLoader";
import AccreditatorsSection from "./self-assessment/AccreditatorsSection";
import {
  SAR_SERVICE_ID,
  SAR_STATUS,
  buildQualityTree,
  computeSummary,
  formatDate,
  formatScore,
  getAllSubIndicators,
  newAccreditorRow,
  newCoordinatorRow,
  parseJson,
} from "./self-assessment/sarUtils";

const AUTO_SAVE_INTERVAL_MS = 60000;

// Workflow actions by current status of the report (tbl_role_service, service 19)
//   55 Submitted -> QAS        : Verify (56) / Reject (58)
//   56 Verified  -> REC        : Endorse (59) / Reject (58)
//   59 Endorsed  -> TVETQC     : Approve (57) / Reject (58)
const STAGE_ACTIONS = {
  55: [
    { statusId: 56, label: "Verify", color: "success", icon: <CheckCircleIcon /> },
    { statusId: 58, label: "Reject", color: "error", icon: <CancelIcon /> },
  ],
  56: [
    { statusId: 59, label: "Endorse", color: "primary", icon: <VerifiedIcon /> },
    { statusId: 58, label: "Reject", color: "error", icon: <CancelIcon /> },
  ],
  59: [
    { statusId: 57, label: "Approve", color: "success", icon: <CheckCircleIcon /> },
    { statusId: 58, label: "Reject", color: "error", icon: <CancelIcon /> },
  ],
};

const ACTION_TEXT = {
  [SAR_STATUS.VERIFIED]: { title: "Verify Self Assessment Report", verb: "verify", done: "Report verified successfully" },
  [SAR_STATUS.ENDORSED]: { title: "Endorse Self Assessment Report", verb: "endorse", done: "Report endorsed successfully" },
  [SAR_STATUS.APPROVED]: { title: "Approve Self Assessment Report", verb: "approve", done: "Report approved successfully" },
  [SAR_STATUS.REJECTED]: { title: "Reject Self Assessment Report", verb: "reject", done: "Report rejected successfully" },
};

const ViewSelfAssessmentReport = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  const roleId = Number(currentRoleId);
  const isRole23 = roleId === 23;

  // State
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [reportData, setReportData] = useState(null);
  const [currentStatusId, setCurrentStatusId] = useState(null);
  const [basicInfo, setBasicInfo] = useState(null);
  const [basicLoading, setBasicLoading] = useState(false);
  const [rawStandards, setRawStandards] = useState([]);

  // Quality standards
  const [selfPoints, setSelfPoints] = useState({});
  const [earnedPoints, setEarnedPoints] = useState({});
  const [justifications, setJustifications] = useState({});

  // ACCREDITATORS section
  const [accreditorList, setAccreditorList] = useState([]);
  const [accreditors, setAccreditors] = useState([]);
  const [coordinators, setCoordinators] = useState([]);


  // Draft / action state
  const [dirty, setDirty] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isClosed = [SAR_STATUS.APPROVED, SAR_STATUS.REJECTED].includes(
    Number(currentStatusId),
  );
  // Earned points / accreditators are editable at verification (55) and
  // approval (59) stages; REC endorsement stage (56) is read only.
  const stageActions = STAGE_ACTIONS[Number(currentStatusId)] || [];
  const canEdit =
    !isClosed &&
    !isRole23 &&
    stageActions.length > 0 &&
    Number(currentStatusId) !== SAR_STATUS.VERIFIED;

  const criteria = useMemo(() => buildQualityTree(rawStandards), [rawStandards]);
  const summary = useMemo(
    () => computeSummary(criteria, earnedPoints),
    [criteria, earnedPoints],
  );

  // ------------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------------
  const fetchQualityStandards = async () => {
    try {
      const response = await CommonService.getAllQualitystandards(SAR_SERVICE_ID);
      setRawStandards(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching quality standards:", error);
    }
  };

  const fetchAccreditorUsers = async () => {
    try {
      const response =
        await UserRoleManagementService.getActiveAccreditorUsers(access_token);
      const list = Array.isArray(response.data) ? response.data : [];
      setAccreditorList(
        list.map((user) => ({
          id: user.id,
          userId: user.user_id,
          name: [user.first_name, user.middle_name, user.last_name]
            .filter(Boolean)
            .join(" "),
          email: user.email_id,
          mobileNo: user.mobile_no,
        })),
      );
    } catch (error) {
      console.error("Error fetching accreditor users:", error);
      toast.error("Failed to load registered accreditors");
    }
  };

  // Same approach as ViewAccreditedCourseRegistration: institute details by
  // registration_no from InstituteRegistrationService.getInstituteDetails
  const fetchBasicInformation = async (registrationNo, instituteId) => {
    setBasicLoading(true);
    try {
      let instituteData = null;
      if (registrationNo) {
        const response =
          await InstituteRegistrationService.getInstituteDetails(registrationNo);
        instituteData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
      }
      const id = instituteData?.institute_id || instituteId;

      const extra = await loadInstituteTrainersAndCourses({
        instituteId: id,
        registrationNo: instituteData?.registration_no || registrationNo,
        token: access_token,
      });

      const institute =
        instituteData || extra.institute
          ? { ...(instituteData || {}), ...(extra.institute || {}) }
          : null;
      setBasicInfo({
        institute,
        trainers: extra.trainers || [],
        courses: extra.courses || [],
      });
    } catch (error) {
      console.error("Error fetching institute data:", error);
    } finally {
      setBasicLoading(false);
    }
  };

  const fetchReportDetails = async () => {
    const response =
      await SelfAssessmentReportService.getSelfAssessmentReportByApplicationNo(
        applicationNo,
        access_token,
      );
    const data =
      Array.isArray(response.data) && response.data.length > 0
        ? response.data[0]
        : null;
    if (!data) {
      setReportData(null);
      return;
    }

    setReportData(data);
    setCurrentStatusId(Number(data.status_id));

    const self = {};
    const earned = {};
    const just = {};
    parseJson(data.quality_standard_responses, []).forEach((qs) => {
      const id = String(qs.standardId);
      self[id] = qs.selfPoint ?? "";
      earned[id] = qs.earnedPoint ?? qs.selfPoint ?? "";
      just[id] = qs.justification || "";
    });
    setSelfPoints(self);
    setEarnedPoints(earned);
    setJustifications(just);

    setAccreditors(
      parseJson(data.accreditors, []).map((a) => newAccreditorRow(a)),
    );
    setCoordinators(
      parseJson(data.coordinators, []).map((c) => newCoordinatorRow(c)),
    );
    setDirty(false);

    fetchBasicInformation(data.registration_no, data.institute_id);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReportDetails(), fetchQualityStandards()]);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load Self Assessment Report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationNo) {
      fetchAllData();
      fetchAccreditorUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationNo]);

  // ------------------------------------------------------------------
  // Change handlers
  // ------------------------------------------------------------------
  const handleEarnedPointChange = (subId, value) => {
    if (!canEdit) return;
    setEarnedPoints((prev) => ({ ...prev, [subId]: value }));
    setDirty(true);
  };

  const handleJustificationChange = (subId, value) => {
    if (!canEdit) return;
    setJustifications((prev) => ({ ...prev, [subId]: value }));
    setDirty(true);
  };

  const handleAccreditorsChange = (rows) => {
    setAccreditors(rows);
    setDirty(true);
  };

  const handleCoordinatorsChange = (rows) => {
    setCoordinators(rows);
    setDirty(true);
  };

  // ------------------------------------------------------------------
  // Payload / draft
  // ------------------------------------------------------------------
  const buildPayload = useCallback(
    () => ({
      applicationNo,
      updatedBy: actionId,
      serviceId: SAR_SERVICE_ID,
      totalScore: summary.totalScore,
      grade: summary.grade.grade,
      qualityStandards: getAllSubIndicators(criteria)
        .filter(
          (sub) =>
            earnedPoints[sub.id] !== "" && earnedPoints[sub.id] !== undefined,
        )
        .map((sub) => ({
          standardId: Number(sub.id),
          earnedPoint: Number(earnedPoints[sub.id]),
          justification: justifications[sub.id] || "",
        })),
      accreditors: accreditors
        .filter((a) => a.userId)
        .map((a) => ({ userId: a.userId, name: a.name })),
      coordinators: coordinators
        .filter((c) => c.name && c.name.trim())
        .map((c) => ({ name: c.name.trim(), designation: c.designation })),
    }),
    [
      applicationNo,
      actionId,
      summary,
      criteria,
      earnedPoints,
      justifications,
      accreditors,
      coordinators,
    ],
  );

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!canEdit) return;
      setSavingDraft(true);
      try {
        const response =
          await SelfAssessmentReportService.saveDraftSelfAssessmentReport(
            buildPayload(),
            access_token,
          );
        if (response.status === 200) {
          setDirty(false);
          setLastSavedAt(new Date());
          if (!silent) toast.success("Draft saved successfully");
        } else if (!silent) {
          toast.error(
            response.response?.data?.message || "Failed to save draft",
          );
        }
      } catch (error) {
        console.error("Error saving draft:", error);
        if (!silent) toast.error("Failed to save draft");
      } finally {
        setSavingDraft(false);
      }
    },
    [canEdit, buildPayload, access_token],
  );

  // Auto save every minute while there are unsaved changes
  const saveDraftRef = useRef(saveDraft);
  useEffect(() => {
    saveDraftRef.current = saveDraft;
  }, [saveDraft]);

  useEffect(() => {
    if (!canEdit || !dirty) return undefined;
    const timer = setTimeout(
      () => saveDraftRef.current(true),
      AUTO_SAVE_INTERVAL_MS,
    );
    return () => clearTimeout(timer);
  }, [dirty, canEdit, earnedPoints, justifications, accreditors, coordinators]);

  // ------------------------------------------------------------------
  // Workflow actions
  // ------------------------------------------------------------------
  const validateAction = (statusId) => {
    if (statusId === SAR_STATUS.REJECTED) return true;
    setShowErrors(true);

    if (!summary.complete) {
      toast.error(
        `Please enter earned points for all sub-indicators (${summary.answered}/${summary.total}).`,
      );
      setTabValue(1);
      return false;
    }
    if (statusId === SAR_STATUS.VERIFIED) {
      if (accreditors.filter((a) => a.userId).length === 0) {
        toast.error("Please add at least one Accreditor before verification");
        setTabValue(2);
        return false;
      }
      if (accreditors.some((a) => !a.userId)) {
        toast.error("Please select the accreditor or remove the empty row");
        setTabValue(2);
        return false;
      }
      if (coordinators.some((c) => !c.name.trim())) {
        toast.error("Please enter the programme co-ordinator name or remove the empty row");
        setTabValue(2);
        return false;
      }
    }
    return true;
  };

  const openActionDialog = (statusId) => {
    if (!validateAction(statusId)) return;
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
    if (selectedStatusId === SAR_STATUS.REJECTED && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        ...buildPayload(),
        statusId: selectedStatusId,
        assignedRoleId: roleId,
        remarks: remarks || "Application processed",
      };
      // Members can only be changed by editable roles
      if (!canEdit) {
        delete payload.accreditors;
        delete payload.coordinators;
        delete payload.qualityStandards;
      }

      const response =
        await SelfAssessmentReportService.verifySelfAssessmentReport(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          ACTION_TEXT[selectedStatusId]?.done || "Action completed successfully",
        );
        closeDialog();
        setDirty(false);
        navigate("/tasklist/task-details-index");
      } else {
        toast.error(
          response.response?.data?.message ||
            "Failed to process Self Assessment Report",
        );
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to process Self Assessment Report",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Tabs
  // ------------------------------------------------------------------
  const tabs = [
    { icon: <BusinessIcon />, label: "Basic Information" },
    { icon: <VerifiedIcon />, label: "Quality Standards" },
    { icon: <GroupAddIcon />, label: "Accreditators" },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 1, minHeight: "100vh" }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        </Paper>
      </Box>
    );
  }

  if (!reportData) {
    return (
      <Box sx={{ m: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            Self Assessment Report
          </Typography>
          <Alert severity="error">
            Self Assessment Report with Application No:{" "}
            <strong>{applicationNo}</strong> not found
          </Alert>
        </Paper>
      </Box>
    );
  }

  const actions = isClosed ? [] : stageActions;

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1}
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Self Assessment Report - TVET Provider Accreditation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Application No: <strong>{applicationNo}</strong> ·{" "}
              {reportData.proposed_institute_name || "N/A"} · Submitted on{" "}
              {formatDate(reportData.submitted_date)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={reportData.status_name || "Pending"}
              color={
                Number(currentStatusId) === SAR_STATUS.APPROVED
                  ? "success"
                  : Number(currentStatusId) === SAR_STATUS.REJECTED
                    ? "error"
                    : "info"
              }
            />
            <Chip
              label={`Score: ${formatScore(summary.totalScore)} / ${summary.totalWeight}`}
              sx={{ bgcolor: summary.grade.color, color: "#fff", fontWeight: 700 }}
            />
            <Chip
              label={`Grade: ${summary.grade.grade}`}
              variant="outlined"
              sx={{
                borderColor: summary.grade.color,
                color: summary.grade.color,
                fontWeight: 700,
              }}
            />
          </Stack>
        </Stack>
        <Divider />

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.label} icon={tab.icon} label={tab.label} />
          ))}
        </Tabs>

        {canEdit && (
          <Alert
            severity={dirty ? "warning" : "info"}
            sx={{ mt: 2, py: 0 }}
            action={
              <Button
                size="small"
                color="inherit"
                startIcon={
                  savingDraft ? <CircularProgress size={14} /> : <SaveIcon />
                }
                onClick={() => saveDraft(false)}
                disabled={savingDraft}
              >
                Save Draft
              </Button>
            }
          >
            {dirty
              ? "You have unsaved changes. They are auto-saved every minute."
              : lastSavedAt
                ? `All changes saved at ${lastSavedAt.toLocaleTimeString()}.`
                : "Earned points can be entered over several days - use Save Draft to keep your progress."}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {/* Tab 0: Basic Information */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3 }} variant="outlined">
              <Typography fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <BasicInformationSection basicInfo={basicInfo} loading={basicLoading} />
            </Paper>
          )}

          {/* Tab 1: Quality Standards */}
          {tabValue === 1 && (
            <QualityStandardsTabs
              criteria={criteria}
              mode="verification"
              selfPoints={selfPoints}
              earnedPoints={earnedPoints}
              justifications={justifications}
              onEarnedPointChange={handleEarnedPointChange}
              onJustificationChange={handleJustificationChange}
              readOnly={!canEdit}
              showErrors={showErrors}
            />
          )}

          {/* Tab 2: Accreditators */}
          {tabValue === 2 && (
            <AccreditatorsSection
              accreditorList={accreditorList}
              accreditors={accreditors}
              coordinators={coordinators}
              onAccreditorsChange={handleAccreditorsChange}
              onCoordinatorsChange={handleCoordinatorsChange}
              readOnly={!canEdit}
              showErrors={showErrors}
            />
          )}

        </Box>

        {/* Navigation and Action Buttons (visible on every tab) */}
        <Divider sx={{ mt: 3 }} />
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {canEdit && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={
                  savingDraft ? <CircularProgress size={14} /> : <SaveIcon />
                }
                onClick={() => saveDraft(false)}
                disabled={savingDraft || actionLoading}
                sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
              >
                Save Draft
              </Button>
            )}
            {canEdit && lastSavedAt && !dirty && (
              <Typography variant="caption" color="text.secondary">
                Saved at {lastSavedAt.toLocaleTimeString()}
              </Typography>
            )}
            {isClosed && (
              <Typography variant="body2" color="text.secondary">
                This application is {reportData.status_name || "closed"}; no
                further action is required.
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            {tabValue > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SkipPreviousIcon />}
                onClick={() => setTabValue(tabValue - 1)}
                sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
              >
                Previous
              </Button>
            )}
            {tabValue < tabs.length - 1 && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                endIcon={<SkipNextIcon />}
                onClick={() => setTabValue(tabValue + 1)}
                sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
              >
                Next
              </Button>
            )}
            {actions.map((action) => (
              <Tooltip
                key={action.statusId}
                title={`${ACTION_TEXT[action.statusId]?.verb || "process"} this report`}
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color={action.color}
                    size="small"
                    startIcon={action.icon}
                    onClick={() => openActionDialog(action.statusId)}
                    disabled={actionLoading || savingDraft}
                    sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
                  >
                    {action.label}
                  </Button>
                </span>
              </Tooltip>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {ACTION_TEXT[selectedStatusId]?.title || "Confirm Action"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }} component="div">
            Are you sure you want to{" "}
            {ACTION_TEXT[selectedStatusId]?.verb || "process"} this Self
            Assessment Report?
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>
              Score: {formatScore(summary.totalScore)} / {summary.totalWeight} (
              {summary.grade.grade})
            </strong>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={
              selectedStatusId === SAR_STATUS.REJECTED
                ? "Remarks (required)"
                : "Remarks"
            }
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setRemarksError("");
            }}
            error={!!remarksError}
            helperText={remarksError}
          />
        </DialogContent>
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
            color={selectedStatusId === SAR_STATUS.REJECTED ? "error" : "primary"}
            variant="contained"
            size="small"
            disabled={
              actionLoading ||
              (selectedStatusId === SAR_STATUS.REJECTED && !remarks.trim())
            }
          >
            {actionLoading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewSelfAssessmentReport;
