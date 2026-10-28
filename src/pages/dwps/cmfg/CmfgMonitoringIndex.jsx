import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Alert,
  Grid,
  LinearProgress,
  InputAdornment,
  Skeleton,
  Tabs,
  Tab,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import BusinessIcon from "@mui/icons-material/Business";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ChecklistIcon from "@mui/icons-material/Checklist";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import CmfgMonitoringService from "../../../api/services/internal/cmfg/CmfgMonitoringService";
import ChecklistSection from "./CmfgChecklistSection";
import {
  BORDERED_TABLE,
  STATUS_COLOR,
  buildStandardTree,
  fmtDate,
  headCellSx,
  isError,
  leavesOf,
} from "./cmfgChecklistUtils";

// ---------------------------------------------------------------- constants
const CMFG_SERVICE_ID = 55; // checklist (quality standards) + application numbers
const CMFG_SUBMITTED_STATUS_ID = 55; // workflow status "submitted" (same as accredited course)
const CMFG_REVIEW_ROLE_ID = 14; // role whose task list receives the submission (Verifier TTTRC)

// ---------------------------------------------------------------- helpers
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result.split(",")[1],
        contentType: file.type || "application/octet-stream",
      });
    reader.onerror = reject;
  });

// ---------------------------------------------------------------- page
const CmfgMonitoringIndex = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registrationNo = useSelector((state) => state.auth.userId);

  const [institute, setInstitute] = useState(null);
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | view
  const [viewing, setViewing] = useState(null); // summary row
  const [answers, setAnswers] = useState({}); // { standardId: "Y" | "N" }
  const [remarks, setRemarks] = useState({}); // { standardId: text }
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // one tab per parent (+ documents)

  // ---- data loading ----
  const loadApplications = useCallback(async () => {
    if (!registrationNo || !accessToken) return;
    setListLoading(true);
    const res = await CmfgMonitoringService.getMonitoringByUserId(
      registrationNo,
      accessToken,
    );
    if (!isError(res) && Array.isArray(res?.data)) setApplications(res.data);
    else if (isError(res))
      toast.error("Failed to load monitoring applications");
    setListLoading(false);
  }, [registrationNo, accessToken]);

  useEffect(() => {
    (async () => {
      setStandardsLoading(true);
      const res = await CommonService.getAllQualitystandards(CMFG_SERVICE_ID);
      console.log("quality standards", res.data);
      if (!isError(res) && Array.isArray(res?.data))
        setStandards(buildStandardTree(res.data));
      else toast.error("Failed to load the monitoring checklist");
      setStandardsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!registrationNo) return;
    (async () => {
      const res =
        await InstituteRegistrationService.getInstituteDetails(registrationNo);
      const data = !isError(res)
        ? Array.isArray(res?.data)
          ? res.data[0]
          : res?.data
        : null;
      if (data) setInstitute(data);
      else toast.error("Failed to load institute details");
    })();
  }, [registrationNo]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // ---- derived ----
  // Only leaf items (the actual checklist) are answered and submitted
  const allRows = useMemo(() => standards.flatMap(leavesOf), [standards]);
  const answeredCount = allRows.filter((r) => answers[r.id]).length;
  const yesCount = allRows.filter((r) => answers[r.id] === "Y").length;
  const noCount = allRows.filter((r) => answers[r.id] === "N").length;
  const progress = allRows.length
    ? Math.round((answeredCount / allRows.length) * 100)
    : 0;
  const complete = allRows.length > 0 && answeredCount === allRows.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) =>
      [a.application_no, a.status_name, a.wf_remarks]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [applications, search]);

  // ---- actions ----
  const resetForm = () => {
    setAnswers({});
    setRemarks({});
    setFiles([]);
  };

  const openAdd = () => {
    if (!institute?.institute_id) {
      toast.error("Institute details not loaded yet. Please refresh.");
      return;
    }
    setMode("add");
    setViewing(null);
    resetForm();
    setActiveTab(0);
    setDialogOpen(true);
  };

  const openView = async (row) => {
    setMode("view");
    setViewing(row);
    resetForm();
    setActiveTab(0);
    setDialogOpen(true);
    setViewLoading(true);
    const res = await CmfgMonitoringService.getMonitoringByApplicationNo(
      row.application_no,
      accessToken,
    );
    if (isError(res)) {
      toast.error(
        res?.response?.data?.message || "Failed to load monitoring details",
      );
    } else {
      const a = {};
      const r = {};
      (res.data?.qualityStandards || []).forEach((q) => {
        a[String(q.standardId)] = q.responseId;
        if (q.remarks) r[String(q.standardId)] = q.remarks;
      });
      setAnswers(a);
      setRemarks(r);
      if (res.data?.summary) setViewing(res.data.summary);
    }
    setViewLoading(false);
  };

  const requestSubmit = () => {
    if (!complete) {
      const firstIncomplete = standards.findIndex((sec) =>
        leavesOf(sec).some((r) => !answers[r.id]),
      );
      if (firstIncomplete >= 0) setActiveTab(firstIncomplete);
      toast.warning(
        `Please answer all ${allRows.length} checklist items (${answeredCount} answered)`,
      );
      return;
    }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const documents = await Promise.all(files.map((f) => fileToBase64(f)));
      const payload = {
        instituteId: String(institute.institute_id),
        applicantName:
          institute.proposed_institute_name || institute.institute_name,
        createdBy: actionId != null ? String(actionId) : null,
        userId: registrationNo,
        serviceId: CMFG_SERVICE_ID,
        assignedRoleId: CMFG_REVIEW_ROLE_ID,
        statusId: CMFG_SUBMITTED_STATUS_ID,
        remarks: null,
        documents,
        qualityStandards: allRows.map((r) => ({
          standardId: parseInt(r.id, 10),
          responseId: answers[r.id],
          remarks: remarks[r.id]?.trim() || null,
        })),
      };
      const res = await CmfgMonitoringService.submitMonitoring(
        payload,
        accessToken,
      );
      if (isError(res)) {
        toast.error(
          res?.response?.data?.message || "Failed to submit monitoring",
        );
        return;
      }
      toast.success(
        `Monitoring submitted${res.data?.applicationNo ? ` — Application No. ${res.data.applicationNo}` : ""}`,
      );
      setDialogOpen(false);
      resetForm();
      await loadApplications();
    } catch (e) {
      toast.error(e?.message || "Failed to submit monitoring");
    } finally {
      setSubmitting(false);
    }
  };

  const readOnly = mode === "view";
  const tabCount = standards.length + (readOnly ? 0 : 1); // parents (+ documents)
  const isLastTab = tabCount === 0 || activeTab >= tabCount - 1;
  const instituteName =
    institute?.proposed_institute_name ||
    institute?.institute_name ||
    "Your institute";

  // ---- render ----
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
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <FactCheckIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" fontWeight={600}>
            CMFG Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete the monitoring checklist for {instituteName} and submit it
            for review.
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={loadApplications} disabled={listLoading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by application no., status or remarks"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: 1, minWidth: 240, maxWidth: 440 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          disabled={standardsLoading || standards.length === 0}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
        >
          New Monitoring
        </Button>
      </Box>

      {!standardsLoading && standards.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No checklist items are configured for service {CMFG_SERVICE_ID}. Add
          quality standards for this service first.
        </Alert>
      )}

      {/* Applications table */}
      <TableContainer sx={{ borderRadius: 1.5 }}>
        <Table size="small" sx={BORDERED_TABLE}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: 48 }}>#</TableCell>
              <TableCell sx={headCellSx}>Application No.</TableCell>
              <TableCell sx={headCellSx}>Submitted</TableCell>
              <TableCell sx={headCellSx}>Compliance</TableCell>
              <TableCell sx={headCellSx} align="center">
                Status
              </TableCell>
              <TableCell sx={headCellSx}>Remarks</TableCell>
              <TableCell sx={headCellSx} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listLoading ? (
              [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <ChecklistIcon
                    sx={{ fontSize: 46, color: "text.disabled" }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {search
                      ? "No monitoring applications match your search"
                      : "No monitoring submitted yet"}
                  </Typography>
                  {!search && standards.length > 0 && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={openAdd}
                      sx={{ mt: 1.5, textTransform: "none" }}
                    >
                      Start your first monitoring
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((a, i) => {
                  const total = Number(a.total_items) || 0;
                  const yes = Number(a.yes_count) || 0;
                  const pct = total ? Math.round((yes / total) * 100) : 0;
                  return (
                    <TableRow key={a.application_no} hover>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {page * rowsPerPage + i + 1}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontFamily: "monospace" }}
                        >
                          {a.application_no}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {fmtDate(a.created_at)}
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            color={
                              pct >= 80
                                ? "success"
                                : pct >= 50
                                  ? "warning"
                                  : "error"
                            }
                            sx={{ flex: 1, height: 7, borderRadius: 4 }}
                          />
                          <Typography variant="caption" fontWeight={600}>
                            {pct}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {yes} yes · {a.no_count || 0} no
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={a.status_name || "Submitted"}
                          color={STATUS_COLOR(a.status_name || "submitted")}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {a.wf_remarks || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View checklist">
                          <IconButton
                            size="small"
                            sx={{ color: "info.main" }}
                            onClick={() => openView(a)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Add / View dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
              <FactCheckIcon fontSize="small" />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {readOnly ? "CMFG Monitoring Details" : "New CMFG Monitoring"}
              </Typography>
              {readOnly && viewing?.application_no && (
                <Typography variant="caption" color="text.secondary">
                  Application No. {viewing.application_no}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#fcfcfd" }}>
          {/* Institute + progress */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item size={{ xs: 12, md: 7 }}>
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
                      {viewing?.institute_name || instituteName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reg. No:{" "}
                      {viewing?.registration_no ||
                        institute?.registration_no ||
                        "—"}
                      {readOnly && viewing?.created_at
                        ? ` · Submitted ${fmtDate(viewing.created_at)}`
                        : ""}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item size={{ xs: 12, md: 5 }}>
                {readOnly ? (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: { md: "flex-end" },
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      label={viewing?.status_name || "Submitted"}
                      color={STATUS_COLOR(viewing?.status_name || "submitted")}
                    />
                    <Chip
                      variant="outlined"
                      color="success"
                      label={`${yesCount} yes`}
                    />
                    <Chip
                      variant="outlined"
                      color="error"
                      label={`${noCount} no`}
                    />
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        Checklist progress
                      </Typography>
                      <Typography
                        variant="body2"
                        color={complete ? "success.main" : "text.secondary"}
                      >
                        {answeredCount}/{allRows.length} answered
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={complete ? "success" : "primary"}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {yesCount} yes · {noCount} no
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
            {readOnly && viewing?.wf_remarks && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Reviewer remarks: {viewing.wf_remarks}
              </Alert>
            )}
          </Paper>

          {viewLoading || standardsLoading ? (
            <Box>
              <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={220} />
            </Box>
          ) : (
            <>
              {/* One tab per parent (+ documents when adding) */}
              <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Tabs
                  value={
                    tabCount > 0 ? Math.min(activeTab, tabCount - 1) : false
                  }
                  onChange={(e, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 56,
                    "& .MuiTab-root": {
                      minHeight: 56,
                      textTransform: "none",
                      alignItems: "flex-start",
                      maxWidth: 260,
                    },
                  }}
                >
                  {standards.map((sec) => {
                    const leaves = leavesOf(sec);
                    const done = leaves.filter((r) => answers[r.id]).length;
                    const isComplete =
                      leaves.length > 0 && done === leaves.length;
                    const hasNo = leaves.some((r) => answers[r.id] === "N");
                    return (
                      <Tab
                        key={sec.id}
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              width: "100%",
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: "0.75rem",
                                bgcolor: isComplete
                                  ? "success.main"
                                  : "grey.400",
                              }}
                            >
                              {isComplete ? (
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
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
                                color={hasNo ? "error.main" : "text.secondary"}
                              >
                                {done}/{leaves.length} answered
                                {hasNo ? " · has No" : ""}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    );
                  })}
                  {!readOnly && (
                    <Tab
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 24, height: 24, bgcolor: "info.main" }}
                          >
                            <AttachFileIcon sx={{ fontSize: 15 }} />
                          </Avatar>
                          <Box sx={{ textAlign: "left" }}>
                            <Typography variant="body2" fontWeight={600}>
                              Documents
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {files.length} file(s)
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  )}
                </Tabs>
              </Paper>

              {activeTab < standards.length && standards[activeTab] && (
                <ChecklistSection
                  key={standards[activeTab].id}
                  section={standards[activeTab]}
                  answers={answers}
                  remarks={remarks}
                  readOnly={readOnly}
                  onAnswer={(id, v) => setAnswers((p) => ({ ...p, [id]: v }))}
                  onRemark={(id, v) => setRemarks((p) => ({ ...p, [id]: v }))}
                />
              )}

              {!readOnly && activeTab === standards.length && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <AttachFileIcon color="primary" fontSize="small" />
                    <Typography fontWeight={600}>
                      Supporting documents
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (optional)
                    </Typography>
                  </Box>
                  <FileUpload
                    files={files}
                    onFilesChange={setFiles}
                    disabled={submitting}
                  />
                </Paper>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: "wrap" }}>
          {!readOnly && (
            <Button
              color="inherit"
              startIcon={<RotateLeftIcon />}
              onClick={() => {
                resetForm();
                setActiveTab(0);
              }}
              disabled={submitting}
              sx={{ textTransform: "none" }}
            >
              Reset
            </Button>
          )}
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>

          <Box sx={{ flex: 1 }} />

          {tabCount > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Step {Math.min(activeTab + 1, tabCount)} of {tabCount}
            </Typography>
          )}
          {tabCount > 1 && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              disabled={activeTab === 0 || submitting}
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
              disabled={submitting}
              onClick={() => setActiveTab((t) => Math.min(tabCount - 1, t + 1))}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Next
            </Button>
          )}
          {!readOnly && isLastTab && (
            <Tooltip
              title={!complete ? "please check all check list" : ""}
              arrow
              placement="top"
            >
              {/* span lets the tooltip show while the button is disabled */}
              <span>
                <Button
                  variant="contained"
                  color="success"
                  onClick={requestSubmit}
                  disabled={submitting || !complete}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SendIcon />
                    )
                  }
                  sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
                >
                  {submitting ? "Submitting..." : "Submit for review"}
                </Button>
              </span>
            </Tooltip>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm submit */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Submit monitoring?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {yesCount} of {allRows.length} indicators answered{" "}
            <strong>Yes</strong>
            {noCount > 0 && (
              <>
                , <strong>{noCount}</strong> answered No
              </>
            )}
            .
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The checklist will be sent for review and cannot be edited after
            submission.
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
            onClick={handleSubmit}
            sx={{ textTransform: "none" }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CmfgMonitoringIndex;
