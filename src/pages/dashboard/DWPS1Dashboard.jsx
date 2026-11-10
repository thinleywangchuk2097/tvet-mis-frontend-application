// DWPS 1 (role 21) dashboard: curriculum applications and tracer surveys, plus the role's open tasks.
import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";
import QuizIcon from "@mui/icons-material/Quiz";
import SendIcon from "@mui/icons-material/Send";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import InsightsIcon from "@mui/icons-material/Insights";
import InstituteDashboardService from "../../api/services/internal/dashboard/InstituteDashboardService";
import { Empty, Kpi, Panel } from "./DashboardParts";
import { fmtNum, headCellSx } from "./dashboardUtils";

const ROLE_ID = 21;
const ENDORSED_STATUS_ID = 59;

const isError = (res) => res instanceof Error || res?.isAxiosError;
const num = (v) => Number(v) || 0;

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const BORDERED_TABLE = {
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
  "& th": { ...headCellSx, py: 0.75 },
};

// Single-series bar chart (one hue, no legend; the panel title names the series)
const CountBarChart = ({ data, name, color, horizontal = false }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      layout={horizontal ? "vertical" : "horizontal"}
      margin={horizontal ? { left: 8, right: 16 } : { left: -20, right: 8 }}
      barCategoryGap={4}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
      {horizontal ? (
        <>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        </>
      ) : (
        <>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        </>
      )}
      <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
      <Bar
        dataKey="value"
        name={name}
        fill={color}
        radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
        barSize={horizontal ? 14 : 22}
      />
    </BarChart>
  </ResponsiveContainer>
);
CountBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  horizontal: PropTypes.bool,
};

const toChart = (rows) => (rows || []).map((r) => ({ name: r.name, value: num(r.value) }));

const DWPS1Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError("");
    try {
      const res = await InstituteDashboardService.getDwps1Overview(ROLE_ID, accessToken);
      if (isError(res)) throw res;
      setData(res?.data || null);
    } catch (e) {
      console.error("DWPS 1 dashboard load failed:", e);
      setLoadError("Failed to load dashboard data. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const curriculum = data?.curriculum || {};
  const tracer = data?.tracer || {};
  const tasks = data?.pendingTasks || {};

  const endorsed = useMemo(
    () =>
      (curriculum.byStatus || [])
        .filter((s) => Number(s.id) === ENDORSED_STATUS_ID)
        .reduce((a, s) => a + num(s.value), 0),
    [curriculum.byStatus],
  );

  // sent vs responded per month (last 12 months)
  const monthly = useMemo(() => {
    const responded = {};
    (tracer.respondedByMonth || []).forEach((m) => {
      responded[m.month] = num(m.value);
    });
    return (tracer.byMonth || []).map((m) => ({
      label: m.label,
      Sent: num(m.value),
      Responded: responded[m.month] || 0,
    }));
  }, [tracer.byMonth, tracer.respondedByMonth]);

  const surveys = (tracer.bySurvey || []).slice(0, 8);
  const busy = loading && !data;

  return (
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      {/* ---------------- Header ---------------- */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          borderRadius: 3,
          background: (t) =>
            `linear-gradient(120deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha(
              t.palette.primary.main,
              0.01,
            )})`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 52, height: 52 }} variant="rounded">
            <InsightsIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h6" fontWeight={700}>
              DWPS Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Curriculum applications and tracer surveys
            </Typography>
          </Box>
          <MuiTooltip title="Refresh">
            <span>
              <IconButton onClick={load} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>

        {/* Quick actions */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
          {[
            { label: "Task list", to: "/tasklist/task-details-index", icon: <AssignmentIcon /> },
            { label: "Tracer questions", to: "/tracer/generate-tracer-index", icon: <QuizIcon /> },
            { label: "Send tracer", to: "/tracer/send-tracer", icon: <SendIcon /> },
            { label: "Tracer responses", to: "/tracer/response-tracer", icon: <MarkEmailReadIcon /> },
          ].map((a) => (
            <Button
              key={a.to}
              size="small"
              variant="outlined"
              startIcon={a.icon}
              onClick={() => navigate(a.to)}
              sx={{ textTransform: "none", bgcolor: "background.paper" }}
            >
              {a.label}
            </Button>
          ))}
        </Box>
      </Paper>

      {loading && !busy && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
      {loadError && !loading && (
        <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
          {loadError}
        </Typography>
      )}

      {/* ---------------- KPIs ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Pending tasks"
            value={fmtNum(tasks.total)}
            sub={`${fmtNum(tasks.unclaimed)} unclaimed · ${fmtNum(tasks.claimed)} claimed`}
            icon={<AssignmentIcon />}
            color="warning"
            loading={loading}
            highlight={num(tasks.total) > 0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Curriculum applications"
            value={fmtNum(curriculum.total)}
            sub={`${fmtNum(endorsed)} endorsed`}
            icon={<MenuBookIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Tracer surveys"
            value={fmtNum(tracer.surveys)}
            icon={<QuizIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Tracers sent"
            value={fmtNum(tracer.sent)}
            sub={`${fmtNum(tracer.responded)} responded`}
            icon={<SendIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Response rate"
            value={`${num(tracer.responseRate)}%`}
            icon={<MarkEmailReadIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ---------------- Tracer ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel title="Tracers sent vs responded (last 12 months)">
            <Box sx={{ height: 260 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : monthly.some((m) => m.Sent || m.Responded) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ left: -20, right: 8 }} barCategoryGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Sent" fill={theme.palette.info.main} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Responded" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty text="No tracers sent in the last 12 months" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Tracers sent by type">
            <Box sx={{ height: 260 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (tracer.byType || []).length ? (
                <CountBarChart
                  data={toChart(tracer.byType)}
                  name="Sent"
                  color={theme.palette.primary.main}
                  horizontal
                />
              ) : (
                <Empty text="No tracers sent yet" />
              )}
            </Box>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Panel
            title="Tracer surveys"
            action={
              <Button
                size="small"
                onClick={() => navigate("/tracer/response-tracer")}
                sx={{ textTransform: "none" }}
              >
                View responses
              </Button>
            }
          >
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                <TableHead>
                  <TableRow>
                    <TableCell>Survey</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Questions</TableCell>
                    <TableCell align="center">Sent</TableCell>
                    <TableCell align="center">Response rate</TableCell>
                    <TableCell>Last sent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : surveys.length ? (
                    surveys.map((sv) => {
                      const sent = num(sv.sent);
                      const pct = sent ? Math.round((num(sv.responded) / sent) * 100) : 0;
                      return (
                        <TableRow key={sv.application_no} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} fontSize="0.8rem">
                              {sv.tracer_title || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {sv.application_no}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {sv.tracer_type || "—"}
                            {sv.sub_tracer_type && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {sv.sub_tracer_type}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">{fmtNum(sv.questions)}</TableCell>
                          <TableCell align="center">{fmtNum(sent)}</TableCell>
                          <TableCell align="center">
                            {sent ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                  color={pct >= 60 ? "success" : pct >= 30 ? "primary" : "warning"}
                                />
                                <Typography variant="caption" sx={{ minWidth: 72, textAlign: "right" }}>
                                  {fmtNum(sv.responded)}/{fmtNum(sent)} ({pct}%)
                                </Typography>
                              </Box>
                            ) : (
                              <Chip size="small" label="Not sent" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(sv.last_sent)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No tracer surveys yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Curriculum ---------------- */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="Curriculum by status">
            <Box sx={{ height: 200 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (curriculum.byStatus || []).length ? (
                <CountBarChart
                  data={toChart(curriculum.byStatus)}
                  name="Curricula"
                  color={theme.palette.secondary.main}
                  horizontal
                />
              ) : (
                <Empty text="No curriculum applications yet" />
              )}
            </Box>
            <Typography fontWeight={600} fontSize="0.85rem" sx={{ mt: 1.5, mb: 0.5 }}>
              By type
            </Typography>
            <Box sx={{ height: 160 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (curriculum.byType || []).length ? (
                <CountBarChart
                  data={toChart(curriculum.byType)}
                  name="Curricula"
                  color={theme.palette.primary.main}
                  horizontal
                />
              ) : (
                <Empty text="No curriculum applications yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Panel title="Recent curriculum applications">
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                <TableHead>
                  <TableRow>
                    <TableCell>Application No.</TableCell>
                    <TableCell>Curriculum</TableCell>
                    <TableCell>Institute</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : (curriculum.recent || []).length ? (
                    curriculum.recent.map((c) => (
                      <TableRow key={c.application_no} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{c.application_no}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontSize="0.8rem">
                            {c.curriculum_title || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.curriculum_type || ""}
                          </Typography>
                        </TableCell>
                        <TableCell>{c.institute_name || "—"}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            variant="outlined"
                            color={Number(c.status_id) === ENDORSED_STATUS_ID ? "success" : "default"}
                            label={c.status_name || "Pending"}
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(c.created_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No curriculum applications yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DWPS1Dashboard;
