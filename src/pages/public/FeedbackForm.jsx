import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import FeedbackComplaintService from "../../api/services/internal/public/FeedbackComplaintService";
import {
  CP_CATEGORIES,
  FB_CATEGORIES,
  FILE_TYPES,
  MAX_FILE_MB,
  MAX_TOTAL_MB,
  formatSize,
  RATING_LABELS,
  ROLES,
  URGENCY,
} from "./feedbackOptions";

const NAVY = "#0a2d6e";
const COMPLAINT_RED = "#b71c1c";

const EMPTY = {
  anonymous: false,
  name: "",
  email: "",
  contactNo: "",
  submitterRole: "",
  category: "",
  // feedback
  rating: 0,
  experience: "",
  suggestions: "",
  recommend: null,
  // complaint
  urgency: "",
  incidentDate: "",
  againstPerson: "",
  institution: "",
  incidentDetails: "",
  desiredResolution: "",
};

const today = () => new Date().toISOString().slice(0, 10);

const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");

// File -> Documentdto (base64), the shape the backend uses everywhere
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

// numbered section heading inside the form
const Section = ({ n, title, hint, children }) => (
  <Box sx={{ mb: 3.5 }}>
    <Stack direction="row" spacing={1.25} alignItems="baseline" sx={{ mb: 1.75 }}>
      <Typography sx={{ fontWeight: 800, color: "#f9a825", fontSize: "0.85rem" }}>{n}</Typography>
      <Box>
        <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: "1rem" }}>{title}</Typography>
        {hint && <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{hint}</Typography>}
      </Box>
    </Stack>
    {children}
  </Box>
);
Section.propTypes = { n: PropTypes.string, title: PropTypes.string, hint: PropTypes.string, children: PropTypes.node };

// pick-one chips (categories)
const ChoiceChips = ({ options, value, onChange, color, error }) => (
  <Box>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Box
            key={o.id}
            component="button"
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            sx={{
              px: 1.75,
              py: 0.9,
              borderRadius: 2,
              border: `1px solid ${on ? color : "#d6dfeb"}`,
              bgcolor: on ? alpha(color, 0.08) : "#fff",
              color: on ? color : "#33415c",
              fontFamily: "inherit",
              fontSize: "0.85rem",
              fontWeight: on ? 700 : 500,
              cursor: "pointer",
              transition: "all .15s ease",
              "&:hover": { borderColor: color },
              "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: 2 },
            }}
          >
            {o.label}
          </Box>
        );
      })}
    </Box>
    {error && <Typography sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.75 }}>{error}</Typography>}
  </Box>
);
ChoiceChips.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  color: PropTypes.string.isRequired,
  error: PropTypes.string,
};

/** Public Feedback / Complaint form (menu: Feedback/Complain). Saved to the backend with a reference number. */
export default function FeedbackForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("feedback"); // feedback | complaint
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(null); // { referenceNo, type }
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState([]); // complaint attachments (File objects)
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const isComplaint = mode === "complaint";
  const accent = isComplaint ? COMPLAINT_RED : NAVY;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const switchMode = (next) => {
    if (!next || next === mode) return;
    setMode(next);
    setForm((f) => ({ ...EMPTY, name: f.name, email: f.email, contactNo: f.contactNo, submitterRole: f.submitterRole }));
    setErrors({});
    setServerError("");
    setFiles([]);
    setFileError("");
  };

  // add chosen / dropped files, checking count, type and size
  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    const problems = [];
    const next = [...files];
    let total = next.reduce((s, f) => s + f.size, 0);
    for (const f of incoming) {
      if (!FILE_TYPES.includes(extOf(f.name))) {
        problems.push(`${f.name}: file type not allowed.`);
        continue;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        problems.push(`${f.name} is larger than ${MAX_FILE_MB} MB.`);
        continue;
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue; // same file twice
      if (total + f.size > MAX_TOTAL_MB * 1024 * 1024) {
        problems.push(`${f.name}: attachments together must be ${MAX_TOTAL_MB} MB or less.`);
        continue;
      }
      total += f.size;
      next.push(f);
    }
    setFiles(next);
    setFileError(problems.join(" "));
  };

  const removeFile = (i) => {
    setFiles((list) => list.filter((_, idx) => idx !== i));
    setFileError("");
  };

  const validate = () => {
    const e = {};
    const anonymous = isComplaint && form.anonymous;
    if (!anonymous) {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    }
    if (!form.submitterRole) e.submitterRole = "Select your role";
    if (!form.category) e.category = "Choose a category";
    if (isComplaint) {
      if (!form.urgency) e.urgency = "Choose how urgent this is";
      if (!form.incidentDetails.trim()) e.incidentDetails = "Describe what happened";
    } else {
      if (!form.rating) e.rating = "Give a rating";
      if (!form.experience.trim()) e.experience = "Share your experience";
      if (form.recommend === null) e.recommend = "Please answer";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSaving(true);
    const anonymous = isComplaint && form.anonymous;
    let attachments = [];
    if (isComplaint && files.length) {
      try {
        attachments = await Promise.all(files.map(toDocumentDto));
      } catch (err) {
        setSaving(false);
        setServerError(err.message);
        return;
      }
    }
    const payload = {
      type: isComplaint ? "COMPLAINT" : "FEEDBACK",
      anonymous,
      name: anonymous ? null : form.name.trim(),
      email: anonymous ? null : form.email.trim(),
      contactNo: anonymous ? null : form.contactNo.trim() || null,
      submitterRole: form.submitterRole,
      category: form.category,
      ...(isComplaint
        ? {
            urgency: form.urgency,
            incidentDate: form.incidentDate || null,
            againstPerson: form.againstPerson.trim() || null,
            institution: form.institution.trim() || null,
            incidentDetails: form.incidentDetails.trim(),
            desiredResolution: form.desiredResolution.trim() || null,
            attachments,
          }
        : {
            rating: form.rating,
            experience: form.experience.trim(),
            suggestions: form.suggestions.trim() || null,
            recommend: form.recommend,
          }),
    };
    const res = await FeedbackComplaintService.submit(payload);
    setSaving(false);
    if (!res || res instanceof Error || res.isAxiosError || !res.data?.referenceNo) {
      setServerError(res?.response?.data?.message || "We could not submit this right now. Please try again.");
      return;
    }
    setDone(res.data);
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(done.referenceNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  // ── Thank-you screen ────────────────────────────────────────────────
  if (done) {
    const complaint = done.type === "COMPLAINT";
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 7 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4.5 }, borderRadius: 3, textAlign: "center" }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 56, color: complaint ? COMPLAINT_RED : "#2e7d32" }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: NAVY, mt: 1 }}>
            {complaint ? "Complaint lodged" : "Thank you for your feedback"}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1, fontSize: "0.92rem" }}>
            {complaint
              ? "Your complaint has been recorded. TVET QC will review it and take appropriate action within 5–7 working days."
              : "Your feedback helps us raise the standard of technical and vocational training in Bhutan."}
          </Typography>
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha(NAVY, 0.04), border: `1px dashed ${alpha(NAVY, 0.25)}` }}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Your reference number
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: NAVY, letterSpacing: 0.5 }}>
                {done.referenceNo}
              </Typography>
              <Button size="small" onClick={copyRef} startIcon={<ContentCopyIcon sx={{ fontSize: "16px !important" }} />} sx={{ textTransform: "none" }}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </Stack>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }}>
              Keep it for any follow-up with BQPCA.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate("/")} sx={{ textTransform: "none" }}>
              Back to home
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                setDone(null);
                setForm(EMPTY);
                setFiles([]);
              }}
              sx={{ textTransform: "none", bgcolor: NAVY }}
            >
              Submit another
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────
  const anonymous = isComplaint && form.anonymous;
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      {/* page heading */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ width: 28, height: 3, bgcolor: "#f9a825", borderRadius: 2, mb: 1.25 }} />
        <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "1.8rem" }, color: NAVY }}>
          Feedback &amp; Complaints
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Tell us about your experience with TVET services, or report a problem for action.
        </Typography>
      </Box>

      {/* choose feedback or complaint */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          {
            id: "feedback",
            title: "Give feedback",
            text: "Rate a course, institute or service and suggest improvements.",
            Icon: RateReviewOutlinedIcon,
            color: NAVY,
          },
          {
            id: "complaint",
            title: "Lodge a complaint",
            text: "Report misconduct, negligence or a failed process. Can be anonymous.",
            Icon: ReportGmailerrorredOutlinedIcon,
            color: COMPLAINT_RED,
          },
        ].map((m) => {
          const on = mode === m.id;
          return (
            <Grid key={m.id} size={{ xs: 12, sm: 6 }}>
              <Box
                component="button"
                type="button"
                onClick={() => switchMode(m.id)}
                aria-pressed={on}
                sx={{
                  width: "100%",
                  height: "100%",
                  textAlign: "left",
                  display: "flex",
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2.5,
                  border: `1.5px solid ${on ? m.color : "#dbe3ee"}`,
                  bgcolor: on ? alpha(m.color, 0.05) : "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s ease",
                  "&:hover": { borderColor: m.color },
                  "&:focus-visible": { outline: `2px solid ${m.color}`, outlineOffset: 2 },
                }}
              >
                <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(m.color, 0.1), color: m.color }}>
                  <m.Icon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: on ? m.color : NAVY }}>{m.title}</Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{m.text}</Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Paper
        component="form"
        noValidate
        onSubmit={submit}
        variant="outlined"
        sx={{ borderRadius: 3, overflow: "hidden", borderTop: `4px solid ${accent}` }}
      >
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          {/* 01 · who */}
          <Section n="01" title="Your details" hint={isComplaint ? "You may submit anonymously." : undefined}>
            {isComplaint && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(COMPLAINT_RED, 0.04), border: `1px solid ${alpha(COMPLAINT_RED, 0.15)}` }}>
                <FormControlLabel
                  control={<Switch checked={form.anonymous} onChange={(e) => set("anonymous", e.target.checked)} color="error" />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>Submit anonymously</Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <LockOutlinedIcon sx={{ fontSize: 14 }} /> Your name, email and phone will not be recorded.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}
            <Grid container spacing={2}>
              {!anonymous && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Full name" required fullWidth size="small" value={form.name}
                      onChange={(e) => set("name", e.target.value)} error={!!errors.name} helperText={errors.name}
                      slotProps={{ htmlInput: { maxLength: 200 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Email" type="email" required fullWidth size="small" value={form.email}
                      onChange={(e) => set("email", e.target.value)} error={!!errors.email} helperText={errors.email}
                      slotProps={{ htmlInput: { maxLength: 200 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Contact number (optional)" fullWidth size="small" value={form.contactNo}
                      onChange={(e) => set("contactNo", e.target.value)} slotProps={{ htmlInput: { maxLength: 30 } }} />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="You are a" required fullWidth size="small" value={form.submitterRole}
                  onChange={(e) => set("submitterRole", e.target.value)} error={!!errors.submitterRole} helperText={errors.submitterRole}>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Section>

          {/* 02 · what */}
          <Section n="02" title={isComplaint ? "About the complaint" : "Your rating"}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mb: 1 }}>
              Category <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </Typography>
            <ChoiceChips
              options={isComplaint ? CP_CATEGORIES : FB_CATEGORIES}
              value={form.category}
              onChange={(v) => set("category", v)}
              color={accent}
              error={errors.category}
            />

            {isComplaint ? (
              <>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mt: 2.5, mb: 1 }}>
                  How urgent is it? <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.urgency}
                  onChange={(_, v) => v && set("urgency", v)}
                  sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { border: "1px solid #d6dfeb !important", borderRadius: "8px !important", m: 0 } }}
                >
                  {URGENCY.map((u) => (
                    <ToggleButton
                      key={u.id}
                      value={u.id}
                      sx={{
                        textTransform: "none",
                        px: 1.75,
                        py: 0.75,
                        display: "block",
                        textAlign: "left",
                        "&.Mui-selected": { bgcolor: alpha(u.color, 0.1), borderColor: `${u.color} !important`, color: u.color },
                      }}
                    >
                      <Box sx={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2 }}>{u.label}</Box>
                      <Box sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{u.desc}</Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                {errors.urgency && <Typography sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.75 }}>{errors.urgency}</Typography>}

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Date of incident" type="date" fullWidth size="small" value={form.incidentDate}
                      onChange={(e) => set("incidentDate", e.target.value)}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today() } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Against (person / office)" fullWidth size="small" value={form.againstPerson}
                      onChange={(e) => set("againstPerson", e.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Institute / organisation" fullWidth size="small" value={form.institution}
                      onChange={(e) => set("institution", e.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} />
                  </Grid>
                </Grid>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mt: 2.5, mb: 0.5 }}>
                  Overall rating <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Rating
                    value={form.rating}
                    onChange={(_, v) => set("rating", v || 0)}
                    size="large"
                    sx={{ color: "#f9a825" }}
                  />
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                    {form.rating ? RATING_LABELS[form.rating] : "Select 1–5 stars"}
                  </Typography>
                </Stack>
                {errors.rating && <Typography sx={{ color: "error.main", fontSize: "0.75rem" }}>{errors.rating}</Typography>}
              </>
            )}
          </Section>

          {/* 03 · details */}
          <Section n="03" title={isComplaint ? "What happened" : "Your thoughts"}>
            <Stack spacing={2}>
              {isComplaint ? (
                <>
                  <TextField label="Describe the incident" required fullWidth multiline minRows={4} value={form.incidentDetails}
                    onChange={(e) => set("incidentDetails", e.target.value)} error={!!errors.incidentDetails}
                    helperText={errors.incidentDetails || "Include what happened, where, and who was involved."}
                    slotProps={{ htmlInput: { maxLength: 5000 } }} />
                  <TextField label="What outcome are you seeking? (optional)" fullWidth multiline minRows={2}
                    value={form.desiredResolution} onChange={(e) => set("desiredResolution", e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 3000 } }} />

                  {/* supporting documents */}
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mb: 1 }}>
                      Supporting documents <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>(optional)</Box>
                    </Typography>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      hidden
                      accept={FILE_TYPES.map((x) => `.${x}`).join(",")}
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInput.current?.click()}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        addFiles(e.dataTransfer.files);
                      }}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        textAlign: "center",
                        border: `1.5px dashed ${dragOver ? COMPLAINT_RED : "#c9d4e3"}`,
                        bgcolor: dragOver ? alpha(COMPLAINT_RED, 0.04) : "#fafbfd",
                        cursor: "pointer",
                        display: files.length ? "none" : "block",
                        transition: "all .15s ease",
                        "&:hover": { borderColor: COMPLAINT_RED },
                        "&:focus-visible": { outline: `2px solid ${COMPLAINT_RED}`, outlineOffset: 2 },
                      }}
                    >
                      <AttachFileIcon sx={{ color: "#8a9ab0" }} />
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#33415c" }}>
                        Click to choose files, or drag them here
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                        PDF, Word, Excel, JPG or PNG · {MAX_FILE_MB} MB each · add as many as you need
                      </Typography>
                    </Box>
                    {fileError && <Typography sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.75 }}>{fileError}</Typography>}
                    {files.length > 0 && (
                      <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                        {files.map((f, i) => (
                          <Stack
                            key={`${f.name}-${f.size}`}
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, border: "1px solid #e3eaf4", bgcolor: "#fff" }}
                          >
                            <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: COMPLAINT_RED }} />
                            <Typography sx={{ flex: 1, minWidth: 0, fontSize: "0.82rem" }} noWrap title={f.name}>
                              {f.name}
                            </Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{formatSize(f.size)}</Typography>
                            <IconButton size="small" aria-label={`Remove ${f.name}`} onClick={() => removeFile(i)}>
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                        ))}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                          }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            addFiles(e.dataTransfer.files);
                          }}
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1.5,
                            border: `1px dashed ${dragOver ? COMPLAINT_RED : "transparent"}`,
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => fileInput.current?.click()}
                            sx={{ textTransform: "none", fontWeight: 600, color: COMPLAINT_RED }}
                          >
                            Add more files
                          </Button>
                          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                            {files.length} file{files.length > 1 ? "s" : ""} ·{" "}
                            {formatSize(files.reduce((s, f) => s + f.size, 0))} of {MAX_TOTAL_MB} MB
                          </Typography>
                        </Stack>
                      </Stack>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  <TextField label="Describe your experience" required fullWidth multiline minRows={4} value={form.experience}
                    onChange={(e) => set("experience", e.target.value)} error={!!errors.experience} helperText={errors.experience}
                    slotProps={{ htmlInput: { maxLength: 5000 } }} />
                  <TextField label="Suggestions for improvement (optional)" fullWidth multiline minRows={2}
                    value={form.suggestions} onChange={(e) => set("suggestions", e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 3000 } }} />
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mb: 1 }}>
                      Would you recommend this programme or service to others? <Box component="span" sx={{ color: "error.main" }}>*</Box>
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={form.recommend}
                      onChange={(_, v) => v !== null && set("recommend", v)}
                    >
                      <ToggleButton value={true} sx={{ textTransform: "none", px: 3 }}>Yes</ToggleButton>
                      <ToggleButton value={false} sx={{ textTransform: "none", px: 3 }}>No</ToggleButton>
                    </ToggleButtonGroup>
                    {errors.recommend && <Typography sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5 }}>{errors.recommend}</Typography>}
                  </Box>
                </>
              )}
            </Stack>
          </Section>

          {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
        </Box>

        {/* footer */}
        <Box
          sx={{
            px: { xs: 2.5, md: 4 },
            py: 2,
            bgcolor: "#f7f9fc",
            borderTop: "1px solid #e3eaf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
            <LockOutlinedIcon sx={{ fontSize: 15 }} />
            {isComplaint ? "Complaints are seen only by TVET QC." : "Your email and phone number are never shown publicly."}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 700, px: 3, bgcolor: accent, "&:hover": { bgcolor: accent, filter: "brightness(0.92)" } }}
          >
            {isComplaint ? "Lodge complaint" : "Submit feedback"}
          </Button>
        </Box>
      </Paper>

    </Container>
  );
}
