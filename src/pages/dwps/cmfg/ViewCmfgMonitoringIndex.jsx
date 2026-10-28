import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Chip,
  Grid,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import CmfgMonitoringService from "../../../api/services/internal/cmfg/CmfgMonitoringService";
import ChecklistSection from "./CmfgChecklistSection";
import {
  STATUS_COLOR,
  buildStandardTree,
  fmtDate,
  isError,
  leavesOf,
} from "./cmfgChecklistUtils";

const CMFG_SERVICE_ID = 55;
const CMFG_SUBMITTED_STATUS_ID = 55; // only submitted applications can be verified
const CMFG_VERIFIED_STATUS_ID = 56; // workflow status "verified" (same as accredited course)
const CMFG_REVIEWER_ROLE_ID = "14"; // Verifier TTTRC can edit Yes / No / Remarks before verifying

const ViewCmfgMonitoringIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const userId = useSelector((state) => state.auth.userId);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  console.log("currentRoleId", currentRoleId);
  const [standards, setStandards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remarksByItem, setRemarksByItem] = useState({});
  // values as submitted by the institute (to show what the reviewer changed)
  const [original, setOriginal] = useState({ answers: {}, remarks: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [remarks, setRemarks] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!applicationNo || !accessToken) return;
    setLoading(true);
    setError(null);
    const [stdRes, appRes] = await Promise.all([
      CommonService.getAllQualitystandards(CMFG_SERVICE_ID),
      CmfgMonitoringService.getMonitoringByApplicationNo(
        applicationNo,
        accessToken,
      ),
    ]);
    if (!isError(stdRes) && Array.isArray(stdRes?.data)) {
      setStandards(buildStandardTree(stdRes.data));
    }
    if (isError(appRes)) {
      setError(
        appRes?.response?.data?.message ||
          "Failed to load monitoring application",
      );
    } else {
      setSummary(appRes.data?.summary || null);
      const a = {};
      const r = {};
      (appRes.data?.qualityStandards || []).forEach((q) => {
        a[String(q.standardId)] = q.responseId;
        if (q.remarks) r[String(q.standardId)] = q.remarks;
      });
      setAnswers(a);
      setRemarksByItem(r);
      setOriginal({ answers: { ...a }, remarks: { ...r } });
    }
    setLoading(false);
  }, [applicationNo, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const allItems = useMemo(() => standards.flatMap(leavesOf), [standards]);
  const yes = allItems.filter((r) => answers[r.id] === "Y").length;
  const no = allItems.filter((r) => answers[r.id] === "N").length;
  const compliance = allItems.length
    ? Math.round((yes / allItems.length) * 100)
    : 0;

  const statusId = Number(summary?.status_id);
  const canVerify = statusId === CMFG_SUBMITTED_STATUS_ID;
  const canEdit = canVerify && String(currentRoleId) === CMFG_REVIEWER_ROLE_ID;

  // checklist items the reviewer changed
  const changedIds = useMemo(
    () =>
      allItems
        .map((r) => r.id)
        .filter(
          (id) =>
            (answers[id] || "") !== (original.answers[id] || "") ||
            (remarksByItem[id] || "").trim() !==
              (original.remarks[id] || "").trim(),
        ),
    [allItems, answers, remarksByItem, original],
  );
  const tabCount = standards.length;
  const isLastTab = tabCount === 0 || activeTab >= tabCount - 1;

  const handleVerify = async () => {
    setConfirmOpen(false);
    setActing(true);
    try {
      const res = await CmfgMonitoringService.verifyMonitoring(
        {
          applicationNo,
          statusId: CMFG_VERIFIED_STATUS_ID,
          serviceId: CMFG_SERVICE_ID,
          assignedRoleId: currentRoleId ? parseInt(currentRoleId, 10) : null,
          userId: userId != null ? String(userId) : null,
          updatedBy: actionId ? parseInt(actionId, 10) : null,
          remarks: remarks.trim() || "CMFG monitoring verified",
          // reviewer's Yes / No / Remarks (old values go to the audit table first)
          qualityStandards: canEdit
            ? allItems.map((r) => ({
                standardId: parseInt(r.id, 10),
                responseId: answers[r.id] || null,
                remarks: remarksByItem[r.id]?.trim() || null,
              }))
            : [],
        },
        accessToken,
      );
      if (isError(res)) {
        toast.error(
          res?.response?.data?.message || "Failed to verify monitoring",
        );
        return;
      }
      const n = res.data?.changedItems || 0;
      toast.success(
        `${res.data?.message || "CMFG monitoring verified"}${
          n ? ` — ${n} checklist item(s) updated` : ""
        }`,
      );
      navigate("/tasklist/task-details-index");
    } finally {
      setActing(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        m: 1.25,
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <FactCheckIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" fontWeight={600}>
            CMFG Monitoring Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Application No. {applicationNo}
          </Typography>
        </Box>
        {summary?.status_name && (
          <Chip
            label={summary.status_name}
            color={STATUS_COLOR(summary.status_name)}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box>
          <Skeleton variant="rounded" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={260} />
        </Box>
      ) : (
        summary && (
          <>
            {/* Institute + compliance summary */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                        color: "primary.main",
                      }}
                    >
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>
                        {summary.institute_name || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reg. No: {summary.registration_no || "—"} · Submitted{" "}
                        {fmtDate(summary.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Compliance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {yes} Yes · {no} No · {compliance}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={compliance}
                    color={
                      compliance >= 80
                        ? "success"
                        : compliance >= 50
                          ? "warning"
                          : "error"
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
              {summary.wf_remarks && (
                <Alert severity="info" sx={{ mt: 2, py: 0 }}>
                  Latest remarks: {summary.wf_remarks}
                </Alert>
              )}
            </Paper>

            {canEdit && (
              <Alert
                severity="info"
                sx={{ mb: 2, py: 0, alignItems: "center" }}
                action={
                  changedIds.length > 0 ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setAnswers({ ...original.answers });
                        setRemarksByItem({ ...original.remarks });
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Undo changes
                    </Button>
                  ) : null
                }
              >
                You can correct Yes / No and remarks before verifying.{" "}
                {changedIds.length > 0 ? (
                  <strong>{changedIds.length} item(s) changed</strong>
                ) : (
                  "No changes yet."
                )}{" "}
                The institute&apos;s original answers are kept in the audit
                history.
              </Alert>
            )}

            {/* One tab per parent */}
            {tabCount > 0 ? (
              <>
                <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                  <Tabs
                    value={Math.min(activeTab, tabCount - 1)}
                    onChange={(e, v) => setActiveTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      minHeight: 52,
                      "& .MuiTab-root": {
                        minHeight: 52,
                        textTransform: "none",
                        alignItems: "flex-start",
                        maxWidth: 260,
                      },
                    }}
                  >
                    {standards.map((sec) => {
                      const leaves = leavesOf(sec);
                      const y = leaves.filter(
                        (r) => answers[r.id] === "Y",
                      ).length;
                      const n = leaves.filter(
                        (r) => answers[r.id] === "N",
                      ).length;
                      return (
                        <Tab
                          key={sec.id}
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 22,
                                  height: 22,
                                  fontSize: "0.72rem",
                                  bgcolor:
                                    n === 0 ? "success.main" : "warning.main",
                                }}
                              >
                                {n === 0 ? (
                                  <CheckCircleIcon sx={{ fontSize: 15 }} />
                                ) : (
                                  sec.number
                                )}
                              </Avatar>
                              <Box sx={{ minWidth: 0, textAlign: "left" }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                  title={sec.title}
                                >
                                  {sec.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color={
                                    n > 0 ? "error.main" : "text.secondary"
                                  }
                                >
                                  {y} Yes · {n} No
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      );
                    })}
                  </Tabs>
                </Paper>

                {standards[activeTab] && (
                  <ChecklistSection
                    key={standards[activeTab].id}
                    section={standards[activeTab]}
                    answers={answers}
                    remarks={remarksByItem}
                    readOnly={!canEdit}
                    changedIds={changedIds}
                    onAnswer={(id, v) => setAnswers((p) => ({ ...p, [id]: v }))}
                    onRemark={(id, v) =>
                      setRemarksByItem((p) => ({ ...p, [id]: v }))
                    }
                  />
                )}
              </>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No checklist is configured for service {CMFG_SERVICE_ID}.
              </Alert>
            )}

            {/* Reviewer remarks (last tab, when the application can be verified) */}
            {canVerify && isLastTab && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1 }}>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  Verification remarks
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  placeholder="Add remarks for the institute (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Paper>
            )}
            {!canVerify && summary.status_name && (
              <Alert severity="info" sx={{ mt: 1 }}>
                This application is <strong>{summary.status_name}</strong> and
                has no pending verification.
              </Alert>
            )}

            {/* Footer: Previous / Next, Verify on the last tab */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 2,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ flex: 1 }} />
              {tabCount > 1 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 1 }}
                >
                  Step {Math.min(activeTab + 1, tabCount)} of {tabCount}
                </Typography>
              )}
              {tabCount > 1 && (
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  disabled={activeTab === 0 || acting}
                  onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
                  sx={{ textTransform: "none" }}
                >
                  Previous
                </Button>
              )}
              {!isLastTab && (
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() =>
                    setActiveTab((t) => Math.min(tabCount - 1, t + 1))
                  }
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Next
                </Button>
              )}
              {isLastTab && canVerify && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={
                    acting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <VerifiedIcon />
                    )
                  }
                  disabled={acting}
                  onClick={() => setConfirmOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
                >
                  {acting ? "Verifying..." : "Verify"}
                </Button>
              )}
            </Box>
          </>
        )
      )}

      {/* Confirm verify */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Verify CMFG monitoring?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            <strong>{summary?.institute_name}</strong> — {yes} of{" "}
            {allItems.length} indicators answered Yes ({compliance}%).
          </Typography>
          {changedIds.length > 0 && (
            <Typography variant="body2" color="warning.main" gutterBottom>
              {changedIds.length} checklist item(s) you changed will be saved;
              the original answers go to the audit history.
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            The application will be marked as verified and moved to the next
            step of the workflow.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleVerify}
            sx={{ textTransform: "none" }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ViewCmfgMonitoringIndex;
