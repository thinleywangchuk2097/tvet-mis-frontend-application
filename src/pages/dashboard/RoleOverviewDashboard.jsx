import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  Skeleton,
  Alert,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip as MuiTooltip,
  LinearProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import DescriptionIcon from "@mui/icons-material/Description";
import BusinessIcon from "@mui/icons-material/Business";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { useSelector } from "react-redux";
import DashboardService from "../../api/services/internal/dashboard/InstituteDashboardService";
import { Panel, Kpi, Empty } from "./DashboardParts";
import { headCellSx, fmtNum } from "./dashboardUtils";

// ---------------------------------------------------------------- helpers
const iso = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

const PRESETS = {
  month: () => {
    const now = new Date();
    return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), iso(now)];
  },
  quarter: () => {
    const now = new Date();
    return [iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)), iso(now)];
  },
  year: () => {
    const now = new Date();
    return [iso(new Date(now.getFullYear(), now.getMonth() - 11, 1)), iso(now)];
  },
  // Bhutan financial year: July - June
  fy: () => {
    const now = new Date();
    const startYear =
      now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return [iso(new Date(startYear, 6, 1)), iso(now)];
  },
};


const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const STATUS_COLOR = (status = "") => {
  const s = status.toLowerCase();
  if (/(approv|complet|issued|valid)/.test(s)) return "success";
  if (/(reject|cancel|expire|delete)/.test(s)) return "error";
  if (/(resubmit|return|pending|hold)/.test(s)) return "warning";
  if (/(submit|initiat|progress|review|claim|active)/.test(s)) return "info";
  return "default";
};


// ---------------------------------------------------------------- pieces





// ---------------------------------------------------------------- page
/**
 * Shared staff dashboard: TVET statistics plus the applications / pending tasks
 * for the services the current role handles (tbl_role_service).
 * Used by QAS Level 1, TVET QC, ...
 */
const RoleOverviewDashboard = ({
  title,
  subtitle,
  defaultRoleId,
  icon,
  allServices = false,
  renderExtra,
  showStatusDistribution = true,
  showApplicationsTable = true,
}) => {
  const theme = useTheme();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  // allServices -> role 0 = every service / every open task (admin)
  const roleId = allServices ? 0 : currentRoleId || defaultRoleId;
  const [reloadTick, setReloadTick] = useState(0);

  const [preset, setPreset] = useState("year");
  const [range, setRange] = useState(PRESETS.year());
  const [draft, setDraft] = useState(PRESETS.year());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setReloadTick((t) => t + 1);
    const res = await DashboardService.getRoleOverview(
      roleId,
      range[0],
      range[1],
      accessToken,
    );
    if (res instanceof Error || res?.isAxiosError) {
      setError(
        res?.response?.data?.message ||
          res?.message ||
          "Failed to load dashboard",
      );
    } else {
      setData(res.data);
    }
    setLoading(false);
  }, [accessToken, roleId, range]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (key) => {
    if (!key) return;
    const r = PRESETS[key]();
    setPreset(key);
    setDraft(r);
    setRange(r);
    setPage(0);
  };

  const applyCustom = () => {
    if (!draft[0] || !draft[1]) return;
    if (draft[0] > draft[1]) {
      setError("From date cannot be after To date");
      return;
    }
    setPreset(null);
    setRange([...draft]);
    setPage(0);
  };

  const PIE = [
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.secondary.main,
    theme.palette.primary.main,
  ];

  const tvet = data?.tvet || {};
  const apps = data?.applications || {};
  const pending = data?.pendingTasks || {};
  const byStatus = (apps.byStatus || []).map((s) => ({
    name: s.name,
    value: Number(s.value) || 0,
  }));
  const statusTotal = byStatus.reduce((a, b) => a + b.value, 0);
  const byService = (apps.byService || []).map((s) => ({
    name: s.name,
    value: Number(s.value) || 0,
  }));
  const byMonth = apps.byMonth || [];
  const hasTrend = byMonth.some((m) => Number(m.value) > 0);
  const firstLoad = loading && !data;

  const recent = useMemo(() => {
    const list = apps.recent || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) =>
      [a.application_no, a.application_name, a.service_name, a.status_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [apps.recent, search]);

  // TVET statistics table rows
  const statRows = [
    {
      name: "Registered training providers",
      total: tvet.institutes,
      detail: (tvet.institutesByOwnership || [])
        .map((o) => `${o.name}: ${fmtNum(o.value)}`)
        .join(" · "),
    },
    { name: "Accredited courses", total: tvet.accreditedCourses },
    {
      name: "Other (non-accredited) courses",
      total: tvet.nonAccreditedCourses,
    },
    ...(tvet.enrolmentByProgrammeType || []).map((e) => ({
      name: `Enrolment — ${e.name}`,
      total: e.value,
      detail: `${fmtNum(e.certified)} certified`,
    })),
    {
      name: "Trainees certified (all programmes)",
      total: tvet.traineesCertified,
    },
    { name: "ToT certified trainers", total: tvet.totCertified },
    { name: "Active trainers", total: tvet.trainers },
  ];

  const kpis = [
    {
      title: allServices ? "Open tasks (all roles)" : "Pending tasks",
      value: fmtNum(pending.total),
      sub: `${fmtNum(pending.unclaimed)} unclaimed · ${fmtNum(pending.claimed)} claimed`,
      icon: <AssignmentLateIcon />,
      color: "warning",
      highlight: Number(pending.total) > 0,
    },
    {
      title: "Applications in period",
      value: fmtNum(apps.total),
      sub: `${fmtDate(data?.fromDate)} – ${fmtDate(data?.toDate)}`,
      icon: <DescriptionIcon />,
      color: "primary",
    },
    {
      title: "Training providers",
      value: fmtNum(tvet.institutes),
      sub: `${fmtNum(tvet.trainers)} active trainers`,
      icon: <BusinessIcon />,
      color: "secondary",
    },
    {
      title: "Registered courses",
      value: fmtNum(
        (tvet.accreditedCourses || 0) + (tvet.nonAccreditedCourses || 0),
      ),
      sub: `${fmtNum(tvet.accreditedCourses)} accredited · ${fmtNum(tvet.nonAccreditedCourses)} other`,
      icon: <MenuBookIcon />,
      color: "info",
    },
    {
      title: "Trainees enrolled",
      value: fmtNum(tvet.traineesEnrolled),
      sub: `${fmtNum(tvet.traineesCertified)} certified`,
      icon: <GroupsIcon />,
      color: "success",
    },
    {
      title: "ToT certified",
      value: fmtNum(tvet.totCertified),
      sub: "Trainers with TOT mark sheets",
      icon: <WorkspacePremiumIcon />,
      color: "error",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        m: 1,
        p: { xs: 1, md: 1 },
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* ---------------- Header + filters ---------------- */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          borderRadius: 1,
          background: (t) =>
            `linear-gradient(120deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha(
              t.palette.primary.main,
              0.01,
            )})`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            variant="rounded"
            sx={{ bgcolor: "primary.main", width: 50, height: 50 }}
          >
            {icon || <FactCheckIcon />}
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
              <IconButton onClick={load} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            mt: 2,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={preset}
            onChange={(e, v) => applyPreset(v)}
            sx={{
              bgcolor: "background.paper",
              "& .MuiToggleButton-root": { textTransform: "none", px: 1.5 },
            }}
          >
            <ToggleButton value="month">This month</ToggleButton>
            <ToggleButton value="quarter">3 months</ToggleButton>
            <ToggleButton value="year">12 months</ToggleButton>
            <ToggleButton value="fy">This FY</ToggleButton>
          </ToggleButtonGroup>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <TextField
              type="date"
              size="small"
              label="From"
              value={draft[0]}
              onChange={(e) => setDraft([e.target.value, draft[1]])}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ bgcolor: "background.paper", width: 160 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={draft[1]}
              onChange={(e) => setDraft([draft[0], e.target.value])}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ bgcolor: "background.paper", width: 160 }}
            />
            <Button
              variant="contained"
              onClick={applyCustom}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading && data && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* ---------------- KPIs ---------------- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpis.map((k) => (
          <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.title}>
            <Kpi {...k} loading={firstLoad} />
          </Grid>
        ))}
      </Grid>

      {/* ---------------- Extra sections (e.g. admin) ---------------- */}
      {renderExtra && renderExtra({ fromDate: range[0], toDate: range[1], reloadTick })}

      {/* ---------------- Charts ---------------- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: showStatusDistribution ? 8 : 12 }}>
          <Panel title="Application trend">
            <Box sx={{ height: 260 }}>
              {firstLoad ? (
                <Skeleton variant="rounded" height="100%" />
              ) : hasTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={byMonth} margin={{ left: -20, right: 8 }}>
                    <defs>
                      <linearGradient id="qasTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Applications"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      fill="url(#qasTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty text="No applications in this period" />
              )}
            </Box>
          </Panel>
        </Grid>
        {showStatusDistribution && (
        <Grid item size={{ xs: 12, md: 4 }}>
          <Panel title="Status distribution">
            <Box sx={{ height: 260 }}>
              {firstLoad ? (
                <Skeleton
                  variant="circular"
                  width={180}
                  height={180}
                  sx={{ mx: "auto", mt: 3 }}
                />
              ) : statusTotal > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="72%">
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {byStatus.map((s, i) => (
                          <Cell key={s.name} fill={PIE[i % PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 1,
                      maxHeight: 70,
                      overflowY: "auto",
                    }}
                  >
                    {byStatus.map((s, i) => (
                      <Box
                        key={s.name}
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: PIE[i % PIE.length],
                          }}
                        />
                        <Typography variant="caption">
                          {s.name} ({s.value})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Empty text="No applications in this period" />
              )}
            </Box>
          </Panel>
        </Grid>
        )}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Panel title="Applications by service">
            <Box sx={{ height: Math.max(220, byService.length * 34 + 40) }}>
              {firstLoad ? (
                <Skeleton variant="rounded" height={220} />
              ) : byService.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byService}
                    layout="vertical"
                    margin={{ left: 10, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={170}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Applications"
                      fill={theme.palette.secondary.main}
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty text="No applications in this period" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Panel
            title="TVET statistics"
            sx={{ p: 0, "& > div:first-of-type": { px: 2, pt: 2 } }}
          >
            <TableContainer
              sx={{ borderTop: "1px solid", borderColor: "divider" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellSx, width: 40 }}>#</TableCell>
                    <TableCell sx={headCellSx}>Indicator</TableCell>
                    <TableCell sx={headCellSx} align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {firstLoad
                    ? [0, 1, 2, 3, 4].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3}>
                            <Skeleton />
                          </TableCell>
                        </TableRow>
                      ))
                    : statRows.map((r, i) => (
                        <TableRow key={r.name} hover>
                          <TableCell sx={{ color: "text.secondary" }}>
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{r.name}</Typography>
                            {r.detail && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {r.detail}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              {fmtNum(r.total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Applications table ---------------- */}
      {showApplicationsTable && (
      <Panel
        title="Applications"
        sx={{ p: 0, "& > div:first-of-type": { px: 2, pt: 2 } }}
        action={
          <TextField
            size="small"
            placeholder="Search application, applicant, service or status"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 340 } }}
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
        }
      >
        <TableContainer sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Application No.</TableCell>
                <TableCell sx={headCellSx}>Applicant</TableCell>
                <TableCell sx={headCellSx}>Service</TableCell>
                <TableCell sx={headCellSx}>Last action</TableCell>
                <TableCell sx={headCellSx} align="center">
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {firstLoad ? (
                [0, 1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ))
              ) : recent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 5, color: "text.secondary" }}
                  >
                    {search
                      ? "No applications match your search"
                      : "No applications in this period"}
                  </TableCell>
                </TableRow>
              ) : (
                recent.slice(page * rows, page * rows + rows).map((a) => (
                  <TableRow key={a.application_no} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontFamily: "monospace" }}
                      >
                        {a.application_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {a.application_name || "—"}
                      </Typography>
                      {a.wf_remarks && (
                        <Typography variant="caption" color="text.secondary">
                          {a.wf_remarks}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {a.service_name || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {fmtDate(a.action_date)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={a.status_name || "—"}
                        color={STATUS_COLOR(a.status_name || "")}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={recent.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rows}
          onRowsPerPageChange={(e) => {
            setRows(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Panel>
      )}
    </Paper>
  );
};

RoleOverviewDashboard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  defaultRoleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  icon: PropTypes.node,
  allServices: PropTypes.bool,
  renderExtra: PropTypes.func,
  showStatusDistribution: PropTypes.bool,
  showApplicationsTable: PropTypes.bool,
};

export default RoleOverviewDashboard;
