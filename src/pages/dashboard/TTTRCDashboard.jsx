// TTTRC dashboards (Verifier TTTRC = role 14, Head TTTRC = role 15)
// TOT programmes / announcements / trainers and curriculum applications, plus the role's open tasks.
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InstituteDashboardService from "../../api/services/internal/dashboard/InstituteDashboardService";
import { Empty, Kpi, Panel } from "./DashboardParts";
import { fmtNum, headCellSx } from "./dashboardUtils";

const ENDORSED_STATUS_ID = 59;

const isError = (res) => res instanceof Error || res?.isAxiosError;
const num = (v) => Number(v) || 0;

const toDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const fmtDate = (d) => {
  const date = toDate(d);
  return date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
};

// Where a TOT announcement is: application window -> programme -> done
const phaseOf = (a) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appStart = toDate(a.application_start_date);
  const appEnd = toDate(a.application_end_date);
  const start = toDate(a.program_start_date);
  const end = toDate(a.program_end_date);
  if (appStart && appEnd && today >= appStart && today <= appEnd)
    return { key: "open", label: "Applications open", color: "success" };
  if (appStart && today < appStart) return { key: "upcoming", label: "Upcoming", color: "info" };
  if (start && end && today >= start && today <= end)
    return { key: "ongoing", label: "Ongoing", color: "warning" };
  if (end && today > end) return { key: "completed", label: "Completed", color: "default" };
  return { key: "scheduled", label: "Scheduled", color: "primary" };
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

const TTTRCDashboard = ({ roleId, title, subtitle }) => {
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
      const res = await InstituteDashboardService.getTttrcOverview(roleId, accessToken);
      if (isError(res)) throw res;
      setData(res?.data || null);
    } catch (e) {
      console.error("TTTRC dashboard load failed:", e);
      setLoadError("Failed to load dashboard data. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, roleId]);

  useEffect(() => {
    load();
  }, [load]);

  const tot = data?.tot || {};
  const totTotals = tot.totals || {};
  const curriculum = data?.curriculum || {};
  const tasks = data?.pendingTasks || {};
  const cmfg = data?.cmfg || {};

  const announcements = useMemo(
    () => (tot.announcements || []).map((a) => ({ ...a, phase: phaseOf(a) })),
    [tot.announcements],
  );
  const phaseCounts = useMemo(() => {
    const c = {};
    announcements.forEach((a) => {
      c[a.phase.key] = (c[a.phase.key] || 0) + 1;
    });
    return c;
  }, [announcements]);
  // open / ongoing / upcoming first, then the rest by start date
  const activeAnnouncements = useMemo(() => {
    const rank = { open: 0, ongoing: 1, upcoming: 2, scheduled: 3, completed: 4 };
    return [...announcements]
      .sort((a, b) => rank[a.phase.key] - rank[b.phase.key])
      .slice(0, 8);
  }, [announcements]);

  const endorsed = useMemo(
    () =>
      (curriculum.byStatus || [])
        .filter((s) => Number(s.id) === ENDORSED_STATUS_ID)
        .reduce((a, s) => a + num(s.value), 0),
    [curriculum.byStatus],
  );

  const certifiedPct = num(totTotals.selected)
    ? Math.round((num(totTotals.certified) / num(totTotals.selected)) * 100)
    : 0;

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
            <SchoolIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
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
            { label: "TOT programmes", to: "/tot/create-index", icon: <CampaignIcon /> },
            { label: "TOT certificates", to: "/tot/generate-tot-certificate", icon: <WorkspacePremiumIcon /> },
            { label: "CMFG monitoring", to: "/cmfg/cmfg-monitoring-index", icon: <FactCheckIcon /> },
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
            title="TOT programmes"
            value={fmtNum(totTotals.programs)}
            sub={`${fmtNum(totTotals.announcements)} announcement(s)`}
            icon={<CampaignIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Trainers applied"
            value={fmtNum(totTotals.applied)}
            sub={`${fmtNum(totTotals.selected)} selected`}
            icon={<GroupsIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="TOT certified"
            value={fmtNum(totTotals.certified)}
            sub={`${certifiedPct}% of selected`}
            icon={<WorkspacePremiumIcon />}
            color="success"
            loading={loading}
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
      </Grid>

      {/* ---------------- TOT ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Panel
            title="TOT announcements"
            action={
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {[
                  { k: "open", label: "Open", color: "success" },
                  { k: "ongoing", label: "Ongoing", color: "warning" },
                  { k: "upcoming", label: "Upcoming", color: "info" },
                  { k: "completed", label: "Completed", color: "default" },
                ].map((c) => (
                  <Chip
                    key={c.k}
                    size="small"
                    variant="outlined"
                    color={c.color}
                    label={`${c.label} ${phaseCounts[c.k] || 0}`}
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                ))}
              </Box>
            }
          >
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                <TableHead>
                  <TableRow>
                    <TableCell>Programme</TableCell>
                    <TableCell>Programme dates</TableCell>
                    <TableCell align="center">Applied</TableCell>
                    <TableCell align="center">Selected</TableCell>
                    <TableCell align="center">Certified</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : activeAnnouncements.length ? (
                    activeAnnouncements.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontSize="0.8rem">
                            {a.program_name || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {a.application_no}
                            {a.venue ? ` · ${a.venue}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {fmtDate(a.program_start_date)} – {fmtDate(a.program_end_date)}
                        </TableCell>
                        <TableCell align="center">
                          {fmtNum(a.applied)}
                          {a.max_participants ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              of {a.max_participants}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell align="center">{fmtNum(a.selected)}</TableCell>
                        <TableCell align="center">{fmtNum(a.certified)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            variant="outlined"
                            color={a.phase.color}
                            label={a.phase.label}
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No TOT announcements yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="TOT results">
            <Box sx={{ height: 140 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (tot.byResult || []).length ? (
                <CountBarChart
                  data={toChart(tot.byResult)}
                  name="Trainers"
                  color={theme.palette.success.main}
                  horizontal
                />
              ) : (
                <Empty text="No TOT applications yet" />
              )}
            </Box>
            <Typography fontWeight={600} fontSize="0.85rem" sx={{ mt: 1.5, mb: 0.5 }}>
              Grades
            </Typography>
            <Box sx={{ height: 140 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (tot.byGrade || []).length ? (
                <CountBarChart
                  data={toChart(tot.byGrade)}
                  name="Trainers"
                  color={theme.palette.primary.main}
                />
              ) : (
                <Empty text="No grades yet" />
              )}
            </Box>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Trainers sent to TOT by institute (top 8)">
            <Box sx={{ height: 260 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (tot.byInstitute || []).length ? (
                <CountBarChart
                  data={toChart(tot.byInstitute)}
                  name="Trainers"
                  color={theme.palette.info.main}
                  horizontal
                />
              ) : (
                <Empty text="No TOT applications yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Curriculum applications by status">
            <Box sx={{ height: 260 }}>
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
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Curriculum ---------------- */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="Curriculum by type">
            <Box sx={{ height: 220 }}>
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
            <Typography fontWeight={600} fontSize="0.85rem" sx={{ mt: 1.5, mb: 0.5 }}>
              By certificate level
            </Typography>
            <Box sx={{ height: 180 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (curriculum.byLevel || []).length ? (
                <CountBarChart
                  data={toChart(curriculum.byLevel)}
                  name="Curricula"
                  color={theme.palette.success.main}
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
            <TableContainer sx={{ maxHeight: 460 }}>
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

      {/* ---------------- CMFG monitoring ---------------- */}
      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="CMFG monitoring">
            <Grid container spacing={1} sx={{ mb: 1.5 }}>
              {[
                { label: "Monitorings", value: fmtNum(cmfg.total), color: "primary" },
                { label: "Institutes", value: fmtNum(cmfg.institutes), color: "info" },
                { label: "Compliance", value: `${num(cmfg.compliancePct)}%`, color: "success" },
              ].map((k) => (
                <Grid key={k.label} size={4}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      textAlign: "center",
                      bgcolor: (t) => alpha(t.palette[k.color].main, 0.07),
                    }}
                  >
                    {loading ? (
                      <Skeleton height={28} />
                    ) : (
                      <Typography fontWeight={700} fontSize="1.15rem" color={`${k.color}.main`}>
                        {k.value}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {k.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Typography fontWeight={600} fontSize="0.85rem" sx={{ mb: 0.5 }}>
              By status
            </Typography>
            <Box sx={{ height: 200 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (cmfg.byStatus || []).length ? (
                <CountBarChart
                  data={toChart(cmfg.byStatus)}
                  name="Monitorings"
                  color={theme.palette.warning.main}
                  horizontal
                />
              ) : (
                <Empty text="No CMFG monitoring yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Panel
            title="Recent CMFG monitoring"
            action={
              <Button
                size="small"
                onClick={() => navigate("/cmfg/cmfg-monitoring-index")}
                sx={{ textTransform: "none" }}
              >
                View all
              </Button>
            }
          >
            <TableContainer sx={{ maxHeight: 340 }}>
              <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                <TableHead>
                  <TableRow>
                    <TableCell>Application No.</TableCell>
                    <TableCell>Institute</TableCell>
                    <TableCell align="center">Compliance</TableCell>
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
                  ) : (cmfg.recent || []).length ? (
                    cmfg.recent.map((m) => {
                      const total = num(m.total_items);
                      const pct = total ? Math.round((num(m.yes_count) / total) * 100) : 0;
                      return (
                        <TableRow key={m.application_no} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{m.application_no}</TableCell>
                          <TableCell>{m.institute_name || "—"}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                color={pct >= 80 ? "success" : pct >= 50 ? "primary" : "warning"}
                              />
                              <Typography variant="caption" sx={{ minWidth: 72, textAlign: "right" }}>
                                {fmtNum(m.yes_count)}/{fmtNum(total)} ({pct}%)
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              variant="outlined"
                              label={m.status_name || "Pending"}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(m.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No CMFG monitoring yet
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

TTTRCDashboard.propTypes = {
  roleId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export default TTTRCDashboard;
