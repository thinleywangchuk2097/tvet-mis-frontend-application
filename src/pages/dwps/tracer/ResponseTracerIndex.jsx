// ResponseTracerIndex.jsx
// Tracer survey responses: pick a tracer, see who it was sent to and who answered,
// read each respondent's answers, see a per-question summary, and download Excel.
// Uses the same tracer data as Generate / Send tracer (questions, options, sends, answers).
import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Skeleton,
  InputAdornment,
  LinearProgress,
  Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PercentIcon from "@mui/icons-material/Percent";
import CloseIcon from "@mui/icons-material/Close";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";
import GenerateTracerService from "../../../api/services/internal/tracer/GenerateTracerService";
import { Empty, Kpi, Panel } from "../../dashboard/DashboardParts";

// ---------------- helpers ----------------
const isError = (res) => res instanceof Error || res?.isAxiosError;

const parseJson = (raw, fallback) => {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // stored as plain text
  }
};

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CHOICE_TYPES = ["radio", "dropdown", "checkbox", "multiSelect"];
const SUBMITTED = 2; // send status: 2 = submitted

// Compact bordered table (same look as the other pages)
const TABLE_STYLE = {
  borderCollapse: "collapse",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    py: 0.5,
    px: 1,
    fontSize: "0.8rem",
    lineHeight: 1.3,
    verticalAlign: "middle",
  },
  "& th": {
    py: 0.75,
    fontWeight: 600,
    color: "text.secondary",
    textTransform: "uppercase",
    fontSize: "0.72rem",
    letterSpacing: 0.4,
    bgcolor: "#fafafa",
    whiteSpace: "nowrap",
  },
};

// Flatten the tracer's questions (main + sub) into one ordered list.
// key: "q_<id>" for main questions, "s_<id>" for sub-questions (ids come from two tables).
const flattenQuestions = (details, typeValueOf) =>
  (Array.isArray(details) ? details : []).flatMap((q, qi) => {
    const mainNo = `Q${qi + 1}`;
    const options = parseJson(q.question_options, []) || [];
    const subs = parseJson(q.sub_questions, []) || [];
    const main = {
      key: `q_${q.id}`,
      no: mainNo,
      text: q.question_text || "",
      type: typeValueOf(q.question_type_id),
      ratingScale: Number(q.rating_scale) || 5,
      options: (Array.isArray(options) ? options : []).map((o) => ({
        id: String(o.id),
        text: o.optionText ?? String(o),
      })),
    };
    const subList = (Array.isArray(subs) ? subs : [])
      .sort((a, b) => (a.subQuestionOrder || 0) - (b.subQuestionOrder || 0))
      .map((s, si) => ({
        key: `s_${s.id}`,
        no: `${mainNo}.${String.fromCharCode(97 + si)}`,
        text: s.questionText || "",
        type: typeValueOf(s.questionTypeId),
        ratingScale: Number(s.ratingScale) || 5,
        options: (Array.isArray(s.options) ? s.options : []).map((o) => ({
          id: String(o.id),
          text: o.optionText ?? String(o),
        })),
      }));
    // The survey page (ViewTracerSend) only collects answers for the sub-questions
    // when a question has any; the main question is then just a heading.
    if (subList.length > 0) {
      return subList.map((sq) => ({
        ...sq,
        text: `${main.text} — ${sq.text}`,
      }));
    }
    return main.type ? [main] : [];
  });

// Turn a stored answer into readable text
const answerText = (question, raw) => {
  const value = parseJson(raw, "");
  if (value === null || value === undefined || value === "") return "";
  const optText = (id) =>
    question.options.find((o) => o.id === String(id))?.text ?? String(id);

  switch (question.type) {
    case "radio":
    case "dropdown":
      return optText(value);
    case "checkbox":
    case "multiSelect":
      return (Array.isArray(value) ? value : [value]).map(optText).join(", ");
    case "rating":
      return `${value}/${question.ratingScale}`;
    case "multipleText":
      if (value && typeof value === "object") {
        return (
          Object.entries(value)
            .filter(([, v]) => v !== "" && v !== null && v !== undefined)
            // keys are saved as "field_<optionId>"
            .map(
              ([fid, v]) =>
                `${optText(String(fid).replace(/^field_/, ""))}: ${v}`,
            )
            .join("; ")
        );
      }
      return String(value);
    case "date":
      return fmtDate(value);
    default:
      return typeof value === "object" ? JSON.stringify(value) : String(value);
  }
};

// Single-series horizontal bar chart (one hue, no legend; the panel names the question)
const OptionBars = ({ data, color }) => (
  <ResponsiveContainer
    width="100%"
    height={Math.max(90, data.length * 30 + 30)}
  >
    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
      <YAxis
        type="category"
        dataKey="label"
        width={150}
        tick={{ fontSize: 11 }}
      />
      <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
      <Bar
        dataKey="value"
        name="Responses"
        fill={color}
        radius={[0, 4, 4, 0]}
        barSize={14}
      />
    </BarChart>
  </ResponsiveContainer>
);
OptionBars.propTypes = {
  data: PropTypes.array.isRequired,
  color: PropTypes.string.isRequired,
};

// ---------------- page ----------------
const ResponseTracerIndex = () => {
  const theme = useTheme();
  const access_token = useSelector((state) => state.auth.accessToken);

  const [tracers, setTracers] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [selectedTracer, setSelectedTracer] = useState("");

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState([]);
  const [sends, setSends] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewing, setViewing] = useState(null);

  // tracers + question types
  useEffect(() => {
    const load = async () => {
      const [tracerRes, typeRes] = await Promise.all([
        GenerateTracerService.getTracerAllApplications(access_token),
        GenerateTracerService.getTracerQuestionDropdownType(access_token),
      ]);
      if (isError(tracerRes)) toast.error("Failed to load tracers");
      setTracers(
        !isError(tracerRes) && Array.isArray(tracerRes.data)
          ? tracerRes.data
          : [],
      );
      setQuestionTypes(
        !isError(typeRes) && Array.isArray(typeRes.data) ? typeRes.data : [],
      );
    };
    load();
  }, [access_token]);

  const loadTracer = useCallback(
    async (applicationNo) => {
      if (!applicationNo) return;
      setLoading(true);
      setPage(0);
      try {
        const [detailRes, respRes] = await Promise.all([
          GenerateTracerService.getTracerDetailsByApplicationNo(
            applicationNo,
            access_token,
          ),
          GenerateTracerService.getTracerResponses(applicationNo, access_token),
        ]);
        const failed = isError(respRes)
          ? respRes
          : isError(detailRes)
            ? detailRes
            : null;
        if (failed) {
          const status = failed?.response?.status;
          const msg =
            status === 404
              ? "The responses service was not found (404). Rebuild and restart the backend so the new get-tracer-responses endpoint is available."
              : failed?.response?.data?.message ||
                `Failed to load tracer responses${status ? ` (HTTP ${status})` : ""}.`;
          console.error("Tracer responses load failed:", failed);
          setLoadError(msg);
        } else {
          setLoadError("");
        }
        setDetails(
          !isError(detailRes) && Array.isArray(detailRes.data)
            ? detailRes.data
            : [],
        );
        setSends(!isError(respRes) ? respRes.data?.sends || [] : []);
        setResponses(!isError(respRes) ? respRes.data?.responses || [] : []);
      } finally {
        setLoading(false);
      }
    },
    [access_token],
  );

  useEffect(() => {
    loadTracer(selectedTracer);
  }, [selectedTracer, loadTracer]);

  // ---------------- derived ----------------
  const typeValueOf = useCallback(
    (typeId) =>
      questionTypes.find((t) => String(t.id) === String(typeId))?.value || null,
    [questionTypes],
  );

  const questions = useMemo(
    () => flattenQuestions(details, typeValueOf),
    [details, typeValueOf],
  );

  // answers per respondent: { uniqueId: { questionKey: rawValue } }
  const answersByRespondent = useMemo(() => {
    const map = {};
    responses.forEach((r) => {
      const key = `${Number(r.isSubQuestion) === 1 ? "s" : "q"}_${r.questionId}`;
      if (!map[r.uniqueId]) map[r.uniqueId] = { __submittedAt: r.createdAt };
      map[r.uniqueId][key] = r.response;
    });
    return map;
  }, [responses]);

  const respondents = useMemo(
    () =>
      sends.map((s) => {
        const answers = answersByRespondent[s.uniqueId];
        const submitted = Boolean(answers) || Number(s.statusId) === SUBMITTED;
        return {
          ...s,
          submitted,
          answers: answers || {},
          submittedAt:
            answers?.__submittedAt || (submitted ? s.updatedAt : null),
        };
      }),
    [sends, answersByRespondent],
  );

  const stats = useMemo(() => {
    const sent = respondents.length;
    const responded = respondents.filter((r) => r.submitted).length;
    return {
      sent,
      responded,
      pending: sent - responded,
      rate: sent ? Math.round((responded / sent) * 100) : 0,
    };
  }, [respondents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return respondents.filter(
      (r) =>
        (statusFilter === "" ||
          (statusFilter === "submitted" ? r.submitted : !r.submitted)) &&
        (q === "" ||
          (r.applicationName || "").toLowerCase().includes(q) ||
          (r.emailId || "").toLowerCase().includes(q) ||
          (r.mobileNo || "").toLowerCase().includes(q) ||
          (r.applicationNo || "").toLowerCase().includes(q)),
    );
  }, [respondents, search, statusFilter]);

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // per-question summary (choice + rating questions get counts, others an answer count)
  const summary = useMemo(() => {
    const submitted = respondents.filter((r) => r.submitted);
    return questions.map((q) => {
      const raws = submitted
        .map((r) => r.answers[q.key])
        .filter(
          (v) => v !== undefined && v !== null && parseJson(v, "") !== "",
        );
      let bars = null;
      if (CHOICE_TYPES.includes(q.type)) {
        const counts = Object.fromEntries(q.options.map((o) => [o.id, 0]));
        raws.forEach((raw) => {
          const v = parseJson(raw, "");
          (Array.isArray(v) ? v : [v]).forEach((id) => {
            const k = String(id);
            counts[k] = (counts[k] || 0) + 1;
          });
        });
        bars = Object.entries(counts).map(([id, value]) => ({
          label: q.options.find((o) => o.id === id)?.text ?? id,
          value,
        }));
      } else if (q.type === "rating") {
        const counts = {};
        for (let i = 1; i <= q.ratingScale; i += 1) counts[i] = 0;
        raws.forEach((raw) => {
          const v = Number(parseJson(raw, 0));
          if (v) counts[v] = (counts[v] || 0) + 1;
        });
        bars = Object.entries(counts).map(([k, value]) => ({
          label: `${k} ★`,
          value,
        }));
      }
      const avg =
        q.type === "rating" && raws.length
          ? (
              raws.reduce((n, raw) => n + Number(parseJson(raw, 0) || 0), 0) /
              raws.length
            ).toFixed(1)
          : null;
      return { q, answered: raws.length, bars, avg };
    });
  }, [questions, respondents]);

  const selectedTracerRow = tracers.find(
    (t) => t.application_no === selectedTracer,
  );

  // ---------------- Excel ----------------
  // One row per respondent (filtered list), one column per question, readable answers.
  const handleExport = () => {
    const data = filtered.map((r, i) => {
      const row = {
        SlNo: i + 1,
        Name: r.applicationName || "",
        Email: r.emailId || "",
        MobileNo: r.mobileNo || "",
        SentOn: fmtDate(r.createdAt),
        Status: r.submitted ? "Submitted" : "Pending",
        SubmittedOn: fmtDate(r.submittedAt),
      };
      questions.forEach((q) => {
        row[`${q.no}. ${q.text}`] = r.submitted
          ? answerText(q, r.answers[q.key])
          : "";
      });
      return row;
    });
    // File name: <Application No> - <Parent Tracer> - <Sub Tracer>
    const fileName = [
      selectedTracer,
      selectedTracerRow?.parent_tracer_type,
      selectedTracerRow?.sub_tracer_type,
    ]
      .filter(Boolean)
      .join(" - ")
      .replace(/[\\/:*?"<>|]+/g, " ") // characters not allowed in file names
      .trim();
    exportToExcel(data, fileName || "Tracer Responses");
  };

  // ---------------- render ----------------
  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Typography variant="h6">Tracer Responses</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!selectedTracer || loading || filtered.length === 0}
          sx={{ textTransform: "none" }}
        >
          Download Excel
        </Button>
      </Box>

      {/* Tracer picker */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tracer</InputLabel>
            <Select
              value={selectedTracer}
              label="Tracer"
              onChange={(e) => {
                setSelectedTracer(e.target.value);
                setSearch("");
                setStatusFilter("");
                setTab(0);
              }}
            >
              <MenuItem value="">Select a tracer</MenuItem>
              {tracers.map((t) => (
                <MenuItem key={t.application_no} value={t.application_no}>
                  {[t.application_no, t.parent_tracer_type, t.sub_tracer_type]
                    .filter(Boolean)
                    .join(" - ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {selectedTracerRow && (
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {selectedTracerRow.parent_tracer_type && (
              <Chip size="small" label={selectedTracerRow.parent_tracer_type} />
            )}
            {selectedTracerRow.sub_tracer_type && (
              <Chip
                size="small"
                variant="outlined"
                label={selectedTracerRow.sub_tracer_type}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {questions.length} questions · created{" "}
              {fmtDate(selectedTracerRow.created_at)}
            </Typography>
          </Grid>
        )}
      </Grid>

      {!selectedTracer ? (
        <Box sx={{ height: 180 }}>
          <Empty text="Select a tracer to see its responses" />
        </Box>
      ) : (
        <>
          {loading && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
          {loadError && !loading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}

          {/* KPIs */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Kpi
                title="Surveys sent"
                value={stats.sent}
                icon={<SendIcon />}
                color="primary"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Kpi
                title="Responses"
                value={stats.responded}
                icon={<TaskAltIcon />}
                color="success"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Kpi
                title="Pending"
                value={stats.pending}
                icon={<HourglassEmptyIcon />}
                color="warning"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Kpi
                title="Response rate"
                value={`${stats.rate}%`}
                icon={<PercentIcon />}
                color="info"
                loading={loading}
              />
            </Grid>
          </Grid>

          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            sx={{
              mb: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            }}
          >
            <Tab label={`Respondents (${respondents.length})`} />
            <Tab label="Question summary" />
          </Tabs>

          {/* ---------- Respondents ---------- */}
          {tab === 0 && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="submitted">Submitted</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid
                  size={{ xs: 12, sm: 6, md: 4 }}
                  sx={{ ml: { md: "auto" } }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, email, mobile or application no..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small" sx={TABLE_STYLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }}>#</TableCell>
                      <TableCell>Respondent</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Mobile No.</TableCell>
                      <TableCell>Sent on</TableCell>
                      <TableCell>Submitted on</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center" sx={{ width: 70 }}>
                        Answers
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Skeleton height={28} />
                          <Skeleton height={28} />
                        </TableCell>
                      </TableRow>
                    ) : paginated.length ? (
                      paginated.map((r, i) => (
                        <TableRow key={r.id || r.uniqueId} hover>
                          <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                          <TableCell>
                            <Typography fontSize="0.8rem" fontWeight={600}>
                              {r.applicationName || "N/A"}
                            </Typography>
                            <Typography
                              fontSize="0.72rem"
                              color="text.secondary"
                            >
                              {r.applicationNo}
                            </Typography>
                          </TableCell>
                          <TableCell>{r.emailId || "—"}</TableCell>
                          <TableCell>{r.mobileNo || "—"}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {fmtDate(r.createdAt) || "—"}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {fmtDate(r.submittedAt) || "—"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={r.submitted ? "success" : "warning"}
                              variant={r.submitted ? "filled" : "outlined"}
                              label={r.submitted ? "Submitted" : "Pending"}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip
                              title={
                                r.submitted ? "View answers" : "No answers yet"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!r.submitted}
                                  onClick={() => setViewing(r)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                          {respondents.length
                            ? "No respondents match your filters"
                            : "This tracer has not been sent to anyone yet"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filtered.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Showing {paginated.length} of {filtered.length} respondents
                  </Typography>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filtered.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                    sx={{ ".MuiTablePagination-displayedRows": { margin: 0 } }}
                  />
                </Box>
              )}
            </>
          )}

          {/* ---------- Question summary ---------- */}
          {tab === 1 && (
            <Grid container spacing={1.5}>
              {loading ? (
                <Grid size={{ xs: 12 }}>
                  <Skeleton variant="rounded" height={200} />
                </Grid>
              ) : summary.length === 0 ? (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ height: 140 }}>
                    <Empty text="This tracer has no questions" />
                  </Box>
                </Grid>
              ) : (
                summary.map(({ q, answered, bars, avg }) => (
                  <Grid key={q.key} size={{ xs: 12, md: 6 }}>
                    <Panel
                      title={
                        <span>
                          <Typography
                            component="span"
                            color="text.secondary"
                            fontSize="0.85rem"
                            sx={{ mr: 0.75 }}
                          >
                            {q.no}
                          </Typography>
                          {q.text}
                        </span>
                      }
                      action={
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {avg && (
                            <Chip
                              size="small"
                              color="info"
                              variant="outlined"
                              label={`Avg ${avg}/${q.ratingScale}`}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          )}
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`${answered} answered`}
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </Box>
                      }
                    >
                      {bars ? (
                        answered ? (
                          <OptionBars
                            data={bars}
                            color={theme.palette.primary.main}
                          />
                        ) : (
                          <Box sx={{ height: 80 }}>
                            <Empty text="No answers yet" />
                          </Box>
                        )
                      ) : (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                            fontSize: "0.8rem",
                            color: "text.secondary",
                          }}
                        >
                          Free-text answer ({q.type || "text"}). Open a
                          respondent or download the Excel to read the answers.
                        </Box>
                      )}
                    </Panel>
                  </Grid>
                ))
              )}
            </Grid>
          )}
        </>
      )}

      {/* ---------- Answers dialog ---------- */}
      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        maxWidth="md"
        fullWidth
      >
        {viewing && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700}>
                  {viewing.applicationName || "Respondent"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {[
                    viewing.emailId,
                    viewing.mobileNo,
                    `Submitted ${fmtDate(viewing.submittedAt)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setViewing(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <TableContainer>
                <Table size="small" sx={TABLE_STYLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 64 }}>No.</TableCell>
                      <TableCell>Question</TableCell>
                      <TableCell sx={{ width: "40%" }}>Answer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions.map((q) => {
                      const text = answerText(q, viewing.answers[q.key]);
                      return (
                        <TableRow key={q.key}>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {q.no}
                          </TableCell>
                          <TableCell>{q.text}</TableCell>
                          <TableCell>
                            {text || (
                              <Typography
                                fontSize="0.8rem"
                                color="text.disabled"
                              >
                                Not answered
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewing(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default ResponseTracerIndex;
