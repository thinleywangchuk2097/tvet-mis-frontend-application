import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Rating,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import FeedbackComplaintService from "../../api/services/internal/public/FeedbackComplaintService";
import {
  CP_CATEGORIES,
  FB_CATEGORIES,
  STATUSES,
  URGENCY,
  formatSize,
  labelOf,
} from "../public/feedbackOptions";

const TVETQC_ROLE_ID = "22";
const NAVY = "#0a2d6e";
const RED = "#b71c1c";
const LINE = "#e3eaf4";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const isError = (res) => !res || res instanceof Error || res.isAxiosError || !res.status;
const errorText = (res, fallback) => res?.response?.data?.message || fallback;

const Pill = ({ label, color }) => (
  <Box component="span" sx={{ display: "inline-block", px: 1, py: 0.25, borderRadius: 10, fontSize: "0.7rem", fontWeight: 600, color, bgcolor: alpha(color, 0.1), whiteSpace: "nowrap" }}>
    {label}
  </Box>
);
Pill.propTypes = { label: PropTypes.node, color: PropTypes.string };

const Stat = ({ label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, height: "100%" }}>
    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{label}</Typography>
    <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: color || NAVY, lineHeight: 1.2 }}>{value}</Typography>
  </Paper>
);
Stat.propTypes = { label: PropTypes.string, value: PropTypes.node, color: PropTypes.string };

const tableSx = (head) => ({
  "& th": { bgcolor: head, color: "#fff", fontWeight: 700, fontSize: "0.74rem", py: 1, borderBottom: "none" },
  "& td": { fontSize: "0.8rem", borderBottom: `1px solid ${LINE}`, py: 1, verticalAlign: "top" },
  "& tbody tr:hover td": { bgcolor: "#f6f9fd" },
});

const searchSx = {
  width: { xs: "100%", sm: 300 },
  "& .MuiOutlinedInput-root": { height: 34, fontSize: "0.8rem", borderRadius: 2, bgcolor: "#fff" },
};

// ── Feedback (every logged-in user) ────────────────────────────────────
const FeedbackTab = ({ token }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    FeedbackComplaintService.getFeedback(token).then((res) => {
      if (isError(res)) toast.error(errorText(res, "Could not load feedback."));
      else setRows(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [token]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return !s
      ? rows
      : rows.filter((r) =>
          [r.referenceNo, r.name, r.submitterRole, labelOf(FB_CATEGORIES, r.category), r.experience, r.suggestions]
            .some((v) => (v || "").toLowerCase().includes(s)),
        );
  }, [rows, q]);

  const avg = rows.length ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1) : "—";
  const recommendPct = rows.length ? Math.round((rows.filter((r) => r.recommend).length / rows.length) * 100) + "%" : "—";

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}><Stat label="Feedback received" value={rows.length} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label="Average rating" value={<>{avg}<Box component="span" sx={{ fontSize: "0.85rem", color: "text.secondary" }}> / 5</Box></>} color="#e6a100" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label="Would recommend" value={recommendPct} color="#2e7d32" /></Grid>
      </Grid>

      <TextField placeholder="Search feedback" size="small" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
        slotProps={{ input: { startAdornment: <SearchIcon sx={{ fontSize: 17, color: "#90a4ae", mr: 0.75 }} /> } }} sx={{ ...searchSx, mb: 1.5 }} />

      <TableContainer sx={{ border: `1px solid ${LINE}`, borderRadius: 2 }}>
        <Table size="small" sx={tableSx(NAVY)}>
          <TableHead>
            <TableRow>
              <TableCell width={44} align="center">#</TableCell>
              <TableCell width={140}>Reference / Date</TableCell>
              <TableCell width={170}>From</TableCell>
              <TableCell width={160}>Category / Rating</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Suggestions</TableCell>
              <TableCell width={90} align="center">Recommend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [0, 1, 2].map((i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton height={28} /></TableCell></TableRow>)
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>No feedback yet.</TableCell></TableRow>
            ) : (
              filtered.slice(page * perPage, page * perPage + perPage).map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell align="center" sx={{ color: "text.secondary" }}>{page * perPage + i + 1}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{r.referenceNo}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{fmtDate(r.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.8rem" }}>{r.name || "—"}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{r.submitterRole}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.8rem", mb: 0.25 }}>{labelOf(FB_CATEGORIES, r.category)}</Typography>
                    <Rating value={r.rating || 0} readOnly size="small" sx={{ color: "#f9a825" }} />
                  </TableCell>
                  <TableCell sx={{ color: "#33415c" }}>{r.experience}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{r.suggestions || "—"}</TableCell>
                  <TableCell align="center">
                    {r.recommend === true ? <Pill label="Yes" color="#2e7d32" /> : r.recommend === false ? <Pill label="No" color="#78909c" /> : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {filtered.length > perPage && (
        <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage} onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
      )}
    </Box>
  );
};
FeedbackTab.propTypes = { token: PropTypes.string };

// ── Complaints (TVET QC only) ──────────────────────────────────────────
const ComplaintsTab = ({ token }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [open, setOpen] = useState(null);
  const [status, setStatus] = useState("");
  const [action, setAction] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // attachments need the login token, so fetch as a blob and save it
  const download = async (complaintId, file) => {
    setDownloading(file.id);
    const res = await FeedbackComplaintService.downloadAttachment(complaintId, file.id, token);
    setDownloading(null);
    if (isError(res)) {
      toast.error("Could not download the file.");
      return;
    }
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const load = useCallback(() => {
    setLoading(true);
    FeedbackComplaintService.getComplaints(token).then((res) => {
      if (isError(res)) toast.error(errorText(res, "Could not load complaints."));
      else setRows(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.id, rows.filter((r) => r.status === s.id).length])), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!statusFilter || r.status === statusFilter) &&
        (!s ||
          [r.referenceNo, r.name, r.institution, r.againstPerson, labelOf(CP_CATEGORIES, r.category), r.incidentDetails]
            .some((v) => (v || "").toLowerCase().includes(s))),
    );
  }, [rows, q, statusFilter]);

  const openRow = (r) => {
    setOpen(r);
    setStatus(r.status === "SUBMITTED" ? "UNDER_REVIEW" : r.status);
    setAction(r.actionTaken || "");
    setActionErr("");
  };

  const save = async () => {
    if ((status === "RESOLVED" || status === "REJECTED") && !action.trim()) {
      setActionErr("Describe the action taken before closing the complaint");
      return;
    }
    setSaving(true);
    const res = await FeedbackComplaintService.updateComplaint(open.id, { status, actionTaken: action.trim() || null }, token);
    setSaving(false);
    if (isError(res)) {
      toast.error(errorText(res, "Could not update the complaint."));
      return;
    }
    toast.success("Complaint updated");
    setOpen(null);
    load();
  };

  const statusPill = (id) => {
    const s = STATUSES.find((x) => x.id === id);
    return s ? <Pill label={s.label} color={s.color} /> : "—";
  };
  const urgencyPill = (id) => {
    const u = URGENCY.find((x) => x.id === id);
    return u ? <Pill label={u.label} color={u.color} /> : "—";
  };

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {STATUSES.map((s) => (
          <Grid key={s.id} size={{ xs: 6, md: 3 }}>
            <Stat label={s.label} value={counts[s.id] || 0} color={s.color} />
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.5 }}>
        <TextField placeholder="Search complaints" size="small" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ fontSize: 17, color: "#90a4ae", mr: 0.75 }} /> } }} sx={searchSx} />
        <TextField select size="small" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          slotProps={{ select: { displayEmpty: true } }} sx={{ ...searchSx, width: { xs: "100%", sm: 180 } }}>
          <MenuItem value="" sx={{ fontSize: "0.8rem" }}>All statuses</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s.id} value={s.id} sx={{ fontSize: "0.8rem" }}>{s.label}</MenuItem>)}
        </TextField>
      </Stack>

      <TableContainer sx={{ border: `1px solid ${LINE}`, borderRadius: 2 }}>
        <Table size="small" sx={tableSx(RED)}>
          <TableHead>
            <TableRow>
              <TableCell width={44} align="center">#</TableCell>
              <TableCell width={140}>Reference / Date</TableCell>
              <TableCell width={150}>Category / Urgency</TableCell>
              <TableCell width={170}>From</TableCell>
              <TableCell>Incident</TableCell>
              <TableCell width={110}>Status</TableCell>
              <TableCell width={110} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [0, 1, 2].map((i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton height={28} /></TableCell></TableRow>)
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>No complaints found.</TableCell></TableRow>
            ) : (
              filtered.slice(page * perPage, page * perPage + perPage).map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell align="center" sx={{ color: "text.secondary" }}>{page * perPage + i + 1}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{r.referenceNo}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{fmtDate(r.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.8rem", mb: 0.4 }}>{labelOf(CP_CATEGORIES, r.category)}</Typography>
                    {urgencyPill(r.urgency)}
                  </TableCell>
                  <TableCell>
                    {r.anonymous ? (
                      <Typography sx={{ fontSize: "0.8rem", fontStyle: "italic", color: "text.secondary" }}>Anonymous</Typography>
                    ) : (
                      <Typography sx={{ fontSize: "0.8rem" }}>{r.name}</Typography>
                    )}
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{r.submitterRole}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.8rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.incidentDetails}
                    </Typography>
                    {r.institution && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{r.institution}</Typography>}
                    {r.attachments?.length > 0 && (
                      <Typography sx={{ fontSize: "0.72rem", color: "#1565c0", display: "flex", alignItems: "center", gap: 0.25, mt: 0.25 }}>
                        <AttachFileIcon sx={{ fontSize: 13 }} /> {r.attachments.length} file{r.attachments.length > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{statusPill(r.status)}</TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" onClick={() => openRow(r)} sx={{ textTransform: "none", borderRadius: 2 }}>
                      {r.status === "RESOLVED" || r.status === "REJECTED" ? "View" : "Take action"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {filtered.length > perPage && (
        <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage} onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
      )}

      {/* complaint details + action */}
      <Dialog open={!!open} onClose={() => !saving && setOpen(null)} fullWidth maxWidth="md">
        {open && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              Complaint {open.referenceNo}
              {statusPill(open.status)}
              {urgencyPill(open.urgency)}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {[
                  ["Lodged on", fmtDate(open.createdAt)],
                  ["Category", labelOf(CP_CATEGORIES, open.category)],
                  ["Date of incident", fmtDate(open.incidentDate)],
                  ["Against", open.againstPerson || "—"],
                  ["Institute / organisation", open.institution || "—"],
                  ["Complainant role", open.submitterRole],
                  ["Complainant", open.anonymous ? "Anonymous" : open.name],
                  ["Email", open.anonymous ? "—" : open.email],
                  ["Phone", open.anonymous ? "—" : open.contactNo || "—"],
                ].map(([k, v]) => (
                  <Grid key={k} size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{k}</Typography>
                    <Typography sx={{ fontSize: "0.86rem", fontWeight: 600, wordBreak: "break-word" }}>{v}</Typography>
                  </Grid>
                ))}
                <Grid size={12}>
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>What happened</Typography>
                  <Typography sx={{ fontSize: "0.88rem", whiteSpace: "pre-line" }}>{open.incidentDetails}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mb: 0.75 }}>
                    Supporting documents ({open.attachments?.length || 0})
                  </Typography>
                  {open.attachments?.length ? (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {open.attachments.map((f) => (
                        <Button
                          key={f.id}
                          size="small"
                          variant="outlined"
                          onClick={() => download(open.id, f)}
                          disabled={downloading === f.id}
                          startIcon={downloading === f.id ? <CircularProgress size={14} /> : <AttachFileIcon sx={{ fontSize: "16px !important" }} />}
                          endIcon={<DownloadIcon sx={{ fontSize: "16px !important" }} />}
                          sx={{ textTransform: "none", borderRadius: 2, maxWidth: 320, justifyContent: "flex-start" }}
                        >
                          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.fileName}
                          </Box>
                          <Box component="span" sx={{ ml: 0.75, color: "text.secondary", fontSize: "0.72rem", flexShrink: 0 }}>
                            {formatSize(f.fileSize)}
                          </Box>
                        </Button>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>None attached</Typography>
                  )}
                </Grid>
                {open.desiredResolution && (
                  <Grid size={12}>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Outcome sought</Typography>
                    <Typography sx={{ fontSize: "0.88rem", whiteSpace: "pre-line" }}>{open.desiredResolution}</Typography>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha(NAVY, 0.03), border: `1px solid ${LINE}` }}>
                <Typography sx={{ fontWeight: 700, color: NAVY, mb: 1.5 }}>TVET QC action</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField select label="Status" size="small" fullWidth value={status} onChange={(e) => { setStatus(e.target.value); setActionErr(""); }}>
                      {STATUSES.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={12}>
                    <TextField label="Action taken" multiline minRows={3} fullWidth value={action}
                      onChange={(e) => { setAction(e.target.value); setActionErr(""); }}
                      error={!!actionErr} helperText={actionErr || "Required when resolving or rejecting"}
                      slotProps={{ htmlInput: { maxLength: 5000 } }} />
                  </Grid>
                </Grid>
                {open.actionAt && (
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 1 }}>
                    Last updated {fmtDate(open.actionAt)}{open.actionBy ? ` by ${open.actionBy}` : ""}
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setOpen(null)} disabled={saving}>Close</Button>
              <Button variant="contained" disableElevation onClick={save} disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                Save
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
ComplaintsTab.propTypes = { token: PropTypes.string };

/** Feedback & Complaints: feedback for every logged-in user; complaints for TVET QC. */
const FeedbackComplaintsIndex = () => {
  const token = useSelector((state) => state.auth.accessToken);
  const roleId = useSelector((state) => state.auth.current_roleId);
  const isTvetQc = String(roleId) === TVETQC_ROLE_ID;
  const [tab, setTab] = useState("feedback");

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY }}>Feedback &amp; Complaints</Typography>
        <Typography variant="caption" color="text.secondary">
          Submitted by the public through the Feedback/Complain page{isTvetQc ? ". Complaints are visible to TVET QC only." : "."}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
        {isTvetQc && (
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tab value="feedback" icon={<RateReviewOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Feedback" sx={{ textTransform: "none", fontWeight: 600, minHeight: 46 }} />
            <Tab value="complaints" icon={<ReportGmailerrorredOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Complaints" sx={{ textTransform: "none", fontWeight: 600, minHeight: 46 }} />
          </Tabs>
        )}
        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          {tab === "complaints" && isTvetQc ? <ComplaintsTab token={token} /> : <FeedbackTab token={token} />}
        </Box>
      </Paper>
    </Box>
  );
};

export default FeedbackComplaintsIndex;
