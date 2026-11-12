import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import TvetDocumentService from "../../../api/services/internal/public/TvetDocumentService";
import {
  CATEGORY,
  fileExtension,
  fileTypeMeta,
  formatDate,
  formatFileSize,
} from "../../public/documents/documentUtils";

const TVETQC_ROLE_ID = "22";
const NAVY = "#0a2d6e";
const MAX_BYTES = 20 * 1024 * 1024; // keep in step with the backend
const ALLOWED = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "odt", "ods", "csv", "txt", "jpg", "jpeg", "png", "zip",
];
const TABS = [
  { value: CATEGORY.PUBLICATION, label: "Publications" },
  { value: CATEGORY.FORM, label: "Forms" },
];

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (category) => ({
  id: null,
  category,
  title: "",
  publishedDate: today(),
  remarks: "",
  file: null, // new File chosen in the dialog
  currentFileName: "",
});

const isError = (res) =>
  !res || res instanceof Error || res.isAxiosError || !res.status;

const errorText = (res, fallback) =>
  res?.response?.data?.message ||
  (res?.response?.status === 403
    ? "You do not have permission to do this."
    : fallback);

// File -> Documentdto (base64), same shape the rest of the system uses
const toDocumentDto = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({
        content: String(e.target.result).split(",")[1],
        name: file.name,
        originalFilename: file.name,
        contentType: file.type || "application/octet-stream",
        path: null,
      });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

const ManageDocumentsIndex = () => {
  const token = useSelector((state) => state.auth.accessToken);
  const roleId = useSelector((state) => state.auth.current_roleId);
  const allowed = String(roleId) === TVETQC_ROLE_ID;

  const [tab, setTab] = useState(CATEGORY.PUBLICATION);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(CATEGORY.PUBLICATION));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!allowed) return;
    setLoading(true);
    TvetDocumentService.getDocuments(undefined, token).then((res) => {
      if (isError(res)) {
        toast.error(errorText(res, "Could not load documents."));
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

  const counts = useMemo(
    () => ({
      [CATEGORY.PUBLICATION]: rows.filter((r) => r.category === CATEGORY.PUBLICATION).length,
      [CATEGORY.FORM]: rows.filter((r) => r.category === CATEGORY.FORM).length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.category === tab &&
        (!q ||
          [r.title, r.remarks, r.fileName].some((v) =>
            (v || "").toLowerCase().includes(q),
          )),
    );
  }, [rows, tab, search]);

  // ── Dialog ────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm(tab));
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      category: row.category,
      title: row.title || "",
      publishedDate: row.publishedDate || today(),
      remarks: row.remarks || "",
      file: null,
      currentFileName: row.fileName || "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(fileExtension(file.name))) {
      setErrors((er) => ({ ...er, file: "This file type is not allowed." }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrors((er) => ({ ...er, file: "File must be 20 MB or smaller." }));
      return;
    }
    setField("file", file);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.publishedDate) e.publishedDate = "Published date is required";
    if (!form.id && !form.file) e.file = "Please attach a file";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        publishedDate: form.publishedDate,
        remarks: form.remarks.trim(),
        file: form.file ? await toDocumentDto(form.file) : null,
      };
      const res = form.id
        ? await TvetDocumentService.updateDocument(form.id, payload, token)
        : await TvetDocumentService.createDocument(payload, token);
      if (isError(res)) {
        toast.error(errorText(res, "Could not save. Please check the details."));
        return;
      }
      toast.success(form.id ? "Document updated" : "Document added");
      setDialogOpen(false);
      setTab(form.category);
      load();
    } catch (err) {
      toast.error(err.message || "Could not read the file.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await TvetDocumentService.deleteDocument(toDelete.id, token);
    setDeleting(false);
    if (isError(res)) {
      toast.error(errorText(res, "Could not delete."));
      return;
    }
    toast.success("Document deleted");
    setToDelete(null);
    load();
  };

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Only the TVET QC role can manage Publications and Forms. Switch to the
          TVET QC role to continue.
        </Alert>
      </Box>
    );
  }

  const fileLabel = form.file
    ? `${form.file.name} (${formatFileSize(form.file.size)})`
    : form.currentFileName;

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 42, height: 42, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(NAVY, 0.1), color: NAVY }}>
            <LibraryBooksIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>
              Publications & Forms
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Documents listed here are downloadable from the public website
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: "none", borderRadius: 2 }}>
          Add {tab === CATEGORY.FORM ? "form" : "publication"}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}>
            {TABS.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                sx={{ textTransform: "none", fontWeight: 600 }}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{t.label}</span>
                    <Chip label={counts[t.value]} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                  </Stack>
                }
              />
            ))}
          </Tabs>
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ my: 1, width: { xs: "100%", md: 280 } }}
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
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: alpha(NAVY, 0.03) } }}>
                <TableCell width={50}>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell width={130}>Published</TableCell>
                <TableCell width={230}>File</TableCell>
                <TableCell width={140} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton height={32} /></TableCell>
                  </TableRow>
                ))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    {search ? "Nothing matches your search." : "Nothing added yet. Use the Add button to upload the first one."}
                  </TableCell>
                </TableRow>
              ) : (
                visible
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, i) => {
                    const { Icon, color } = fileTypeMeta(row.fileName);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.title}</Typography>
                          {row.remarks && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {row.remarks}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.publishedDate)}</TableCell>
                        <TableCell>
                          {row.hasFile ? (
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                              <Icon sx={{ fontSize: 18, color }} />
                              <Tooltip title={row.fileName}>
                                <Typography variant="caption" noWrap sx={{ maxWidth: 170 }}>
                                  {row.fileName}
                                </Typography>
                              </Tooltip>
                            </Stack>
                          ) : (
                            <Chip label="No file" size="small" color="warning" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          {row.hasFile && (
                            <Tooltip title="Download">
                              <IconButton size="small" component="a" href={TvetDocumentService.getDownloadUrl(row.id)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={visible.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Add / edit */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {form.id ? "Edit document" : "Add document"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="doc-category">Category</InputLabel>
              <Select
                labelId="doc-category"
                label="Category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
              >
                {TABS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label.replace(/s$/, "")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Title"
              size="small"
              required
              fullWidth
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
            <TextField
              label="Published date"
              type="date"
              size="small"
              required
              fullWidth
              value={form.publishedDate}
              onChange={(e) => setField("publishedDate", e.target.value)}
              error={!!errors.publishedDate}
              helperText={errors.publishedDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Remarks"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={form.remarks}
              onChange={(e) => setField("remarks", e.target.value)}
            />
            <Box>
              <input
                ref={fileInput}
                type="file"
                hidden
                accept={ALLOWED.map((x) => `.${x}`).join(",")}
                onChange={pickFile}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInput.current?.click()}
                sx={{ textTransform: "none" }}
              >
                {form.id || form.file ? "Replace file" : "Attach file"} *
              </Button>
              {fileLabel && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {form.file ? "New file: " : "Current file: "}
                  <strong>{fileLabel}</strong>
                </Typography>
              )}
              <FormHelperText error={!!errors.file}>
                {errors.file || "PDF, Word, Excel, PowerPoint, image or ZIP · up to 20 MB"}
              </FormHelperText>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {form.id ? "Save changes" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!toDelete} onClose={() => !deleting && setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete document?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{toDelete?.title}</strong> and its file will be removed from
            the public website. This cannot be undone.
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

export default ManageDocumentsIndex;
