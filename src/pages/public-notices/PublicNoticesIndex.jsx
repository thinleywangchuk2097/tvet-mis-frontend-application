import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import CampaignIcon from "@mui/icons-material/Campaign";
import PublicNoticeService from "../../api/services/internal/public/PublicNoticeService";

const TVETQC_ROLE_ID = "22";
const NAVY = "#0a2d6e";
const MAX_TITLE = 200;
const MAX_MESSAGE = 1000;

const isoDate = (d) => d.toISOString().slice(0, 10);
const inDays = (n) => isoDate(new Date(Date.now() + n * 86400000));
const emptyForm = () => ({ id: null, title: "", textMessage: "", showUntil: inDays(14) });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const isError = (res) => !res || res instanceof Error || res.isAxiosError || !res.status;
const errorText = (res, fallback) =>
  res?.response?.data?.message ||
  (res?.response?.status === 403 ? "You do not have permission to do this." : fallback);

/** TVET QC: notices shown in the scrolling notice bar on the public home page. */
const PublicNoticesIndex = () => {
  const token = useSelector((state) => state.auth.accessToken);
  const roleId = useSelector((state) => state.auth.current_roleId);
  const allowed = String(roleId) === TVETQC_ROLE_ID;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!allowed) return;
    setLoading(true);
    PublicNoticeService.getNotices(token).then((res) => {
      if (isError(res)) {
        toast.error(errorText(res, "Could not load notices."));
        setRows([]);
      } else {
        setRows(Array.isArray(res.data) ? res.data : []);
      }
      setLoading(false);
    });
  }, [allowed, token]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      title: row.title || "",
      textMessage: row.textMessage || "",
      // an expired notice is renewed for two weeks by default when edited
      showUntil: row.active ? row.showUntil : inDays(14),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.textMessage.trim()) e.textMessage = "Message is required";
    if (!form.showUntil) e.showUntil = "Choose the last day to show it";
    else if (form.showUntil < isoDate(new Date())) e.showUntil = "Date cannot be in the past";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      textMessage: form.textMessage.trim(),
      showUntil: form.showUntil,
    };
    const res = form.id
      ? await PublicNoticeService.updateNotice(form.id, payload, token)
      : await PublicNoticeService.createNotice(payload, token);
    setSaving(false);
    if (isError(res)) {
      toast.error(errorText(res, "Could not save the notice."));
      return;
    }
    toast.success(form.id ? "Notice updated" : "Notice published");
    setDialogOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await PublicNoticeService.deleteNotice(toDelete.id, token);
    setDeleting(false);
    if (isError(res)) {
      toast.error(errorText(res, "Could not delete the notice."));
      return;
    }
    toast.success("Notice deleted");
    setToDelete(null);
    load();
  };

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Only the TVET QC role can manage public notices. Switch to the TVET QC role to continue.
        </Alert>
      </Box>
    );
  }

  const liveCount = rows.filter((r) => r.active).length;

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 42, height: 42, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(NAVY, 0.1), color: NAVY }}>
            <CampaignIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>
              Public Notices
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Notices scroll in the notice bar on the public home page until their last day
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: "none", borderRadius: 2 }}>
          New notice
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", gap: 1 }}>
          <Chip size="small" label={`${liveCount} live`} color="success" variant="outlined" />
          <Chip size="small" label={`${rows.length - liveCount} expired`} variant="outlined" />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: alpha(NAVY, 0.03) } }}>
                <TableCell width={50}>#</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Title</TableCell>
                <TableCell>Message</TableCell>
                <TableCell width={130}>Show until</TableCell>
                <TableCell width={90}>Status</TableCell>
                <TableCell width={100} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton height={30} /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No notices yet. Use “New notice” to publish the first one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={row.id} hover sx={{ opacity: row.active ? 1 : 0.6 }}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{row.textMessage}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(row.showUntil)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.active ? "Live" : "Expired"}
                        color={row.active ? "success" : "default"}
                        variant={row.active ? "filled" : "outlined"}
                        sx={{ height: 22, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setToDelete(row)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add / edit */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>{form.id ? "Edit notice" : "New notice"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Title"
              size="small"
              required
              fullWidth
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title || "Short heading, e.g. “Admission open for 2027 intake”"}
              slotProps={{ htmlInput: { maxLength: MAX_TITLE } }}
            />
            <TextField
              label="Message"
              size="small"
              required
              fullWidth
              multiline
              minRows={3}
              value={form.textMessage}
              onChange={(e) => setField("textMessage", e.target.value)}
              error={!!errors.textMessage}
              helperText={errors.textMessage || `${form.textMessage.length} / ${MAX_MESSAGE}`}
              slotProps={{ htmlInput: { maxLength: MAX_MESSAGE } }}
            />
            <TextField
              label="Show until"
              type="date"
              size="small"
              required
              fullWidth
              value={form.showUntil}
              onChange={(e) => setField("showUntil", e.target.value)}
              error={!!errors.showUntil}
              helperText={errors.showUntil || "Shown on the home page until the end of this day"}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: isoDate(new Date()) } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {form.id ? "Save changes" : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!toDelete} onClose={() => !deleting && setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete notice?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{toDelete?.title}</strong> will be removed from the public home page. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicNoticesIndex;
