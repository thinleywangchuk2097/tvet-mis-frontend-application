import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  useTheme,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Alert,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip as MuiTooltip,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Groups as GroupsIcon,
  Badge as BadgeIcon,
  MenuBook as MenuBookIcon,
  EventNote as EventNoteIcon,
  School as SchoolIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationOnIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useSelector } from "react-redux";
import InstituteDashboardService from "../../api/services/internal/dashboard/InstituteDashboardService";

// ---------------------------------------------------------------- helpers
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

const fmtNum = (n) => Number(n || 0).toLocaleString("en-US");

const STATUS_COLOR = (status = "") => {
  const s = status.toLowerCase();
  if (/(approv|complet|issued|active|valid)/.test(s)) return "success";
  if (/(reject|cancel|expire|delete)/.test(s)) return "error";
  if (/(resubmit|return|pending|hold)/.test(s)) return "warning";
  if (/(submit|initiat|progress|review|claim)/.test(s)) return "info";
  return "default";
};

const PROGRAMME_STATUS = {
  ONGOING: { label: "Ongoing", color: "warning" },
  UPCOMING: { label: "Upcoming", color: "info" },
  COMPLETED: { label: "Completed", color: "success" },
  UNKNOWN: { label: "Not scheduled", color: "default" },
};

const headCellSx = {
  fontWeight: 600,
  color: "text.secondary",
  textTransform: "uppercase",
  fontSize: "0.7rem",
  letterSpacing: 0.4,
  bgcolor: "#fafafa",
  whiteSpace: "nowrap",
};

// ---------------------------------------------------------------- pieces
const Card = ({ title, action, children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      height: "100%",
      borderRadius: 2.5,
      border: "1px solid",
      borderColor: "divider",
      ...sx,
    }}
  >
    {(title || action) && (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          gap: 1,
        }}
      >
        <Typography fontWeight={600} fontSize="0.95rem">
          {title}
        </Typography>
        {action}
      </Box>
    )}
    {children}
  </Paper>
);
Card.propTypes = {
  title: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
};

const MetricCard = ({ title, value, sub, icon, color, loading }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      display: "flex",
      alignItems: "center",
      gap: 1.75,
      borderRadius: 2.5,
      border: "1px solid",
      borderColor: "divider",
      height: "100%",
    }}
  >
    <Avatar
      sx={{
        bgcolor: (t) => alpha(t.palette[color].main, 0.12),
        color: `${color}.main`,
        width: 44,
        height: 44,
      }}
    >
      {icon}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      {loading ? (
        <Skeleton width={60} height={32} />
      ) : (
        <Typography fontWeight={700} fontSize="1.4rem" lineHeight={1.2}>
          {value}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" noWrap>
        {title}
      </Typography>
      {sub && !loading && (
        <Typography variant="caption" color="text.disabled" noWrap>
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
);
MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node,
  sub: PropTypes.node,
  icon: PropTypes.node,
  color: PropTypes.string,
  loading: PropTypes.bool,
};

const EmptyChart = ({ text }) => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "text.disabled",
      fontSize: "0.85rem",
    }}
  >
    {text}
  </Box>
);
EmptyChart.propTypes = { text: PropTypes.string };

// ---------------------------------------------------------------- page
const InstituteDashboard = () => {
  const theme = useTheme();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const registrationNo = useSelector((state) => state.auth.userId);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [programmeTab, setProgrammeTab] = useState("ONGOING");
  const [progPage, setProgPage] = useState(0);
  const [progRows, setProgRows] = useState(5);
  const [appPage, setAppPage] = useState(0);
  const [appRows, setAppRows] = useState(5);

  const load = useCallback(async () => {
    if (!registrationNo || !accessToken) return;
    setLoading(true);
    setError(null);
    const res = await InstituteDashboardService.getInstituteDashboard(
      registrationNo,
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
  }, [registrationNo, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const PIE_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.info.main,
  ];

  const m = data?.metrics || {};
  const inst = data?.institute || {};
  const gender = (data?.genderDistribution || []).map((g) => ({
    name: g.name,
    value: Number(g.value) || 0,
  }));
  const genderTotal = gender.reduce((s, g) => s + g.value, 0);
  const monthly = data?.monthlyEnrollments || [];
  const perMonth = data?.programmesPerMonth || [];
  const hasMonthly = monthly.some((x) => Number(x.value) > 0);
  const hasPerMonth = perMonth.some((x) => Number(x.value) > 0);
  const trainersByEmployment = data?.trainersByEmployment || [];
  const tot = data?.tot || {};

  const programmes = useMemo(() => {
    const list = data?.programmeList || [];
    if (programmeTab === "ALL") return list;
    return list.filter((p) => p.status === programmeTab);
  }, [data, programmeTab]);
  const applications = data?.recentApplications || [];

  const renewalDate = inst.institute_renewal_date
    ? new Date(inst.institute_renewal_date)
    : null;
  const daysToRenewal = renewalDate
    ? Math.ceil((renewalDate - new Date()) / 86400000)
    : null;

  const metrics = [
    {
      title: "Active trainers",
      value: fmtNum(m.trainers),
      sub: `${fmtNum(m.staff)} staff members`,
      icon: <BadgeIcon />,
      color: "primary",
    },
    {
      title: "Registered courses",
      value: fmtNum((m.accreditedCourses || 0) + (m.nonAccreditedCourses || 0)),
      sub: `${fmtNum(m.accreditedCourses)} accredited · ${fmtNum(
        m.nonAccreditedCourses,
      )} non-accredited`,
      icon: <MenuBookIcon />,
      color: "secondary",
    },
    {
      title: "Programmes",
      value: fmtNum(m.programmes),
      sub: `${fmtNum(m.ongoingProgrammes)} ongoing · ${fmtNum(
        m.upcomingProgrammes,
      )} upcoming`,
      icon: <EventNoteIcon />,
      color: "warning",
    },
    {
      title: "Trainees enrolled",
      value: fmtNum(m.trainees),
      sub: `${fmtNum(m.graduates)} certified`,
      icon: <GroupsIcon />,
      color: "success",
    },
  ];

  if (error && !data) {
    return (
      <Paper elevation={0} sx={{ p: 3, mt: 1 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        m: 1.25,
        p: { xs: 1.5, md: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* ---------------- Institute header ---------------- */}
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            sx={{ bgcolor: "primary.main", width: 52, height: 52 }}
            variant="rounded"
          >
            <BusinessIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            {loading && !data ? (
              <>
                <Skeleton width={260} height={34} />
                <Skeleton width={340} />
              </>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {inst.institute_name || "Institute Dashboard"}
                  </Typography>
                  {inst.status_name && (
                    <Chip
                      size="small"
                      label={inst.status_name}
                      color={STATUS_COLOR(inst.status_name)}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    mt: 0.5,
                    color: "text.secondary",
                    "& .item": {
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: "0.82rem",
                    },
                  }}
                >
                  <span className="item">
                    <BadgeIcon sx={{ fontSize: 16 }} />
                    Reg. No: {inst.registration_no || "—"}
                  </span>
                  {inst.dzongkhag_name && (
                    <span className="item">
                      <LocationOnIcon sx={{ fontSize: 16 }} />
                      {inst.exact_location
                        ? `${inst.exact_location}, ${inst.dzongkhag_name}`
                        : inst.dzongkhag_name}
                    </span>
                  )}
                  <span className="item">
                    <CalendarMonthIcon sx={{ fontSize: 16 }} />
                    Registered {fmtDate(inst.created_at)}
                  </span>
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {renewalDate && (
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor:
                    daysToRenewal !== null && daysToRenewal < 60
                      ? "warning.main"
                      : "divider",
                  textAlign: "right",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Renewal due
                </Typography>
                <Typography fontWeight={600} fontSize="0.9rem">
                  {fmtDate(renewalDate)}
                </Typography>
                {daysToRenewal !== null && (
                  <Typography
                    variant="caption"
                    color={
                      daysToRenewal < 0
                        ? "error.main"
                        : daysToRenewal < 60
                          ? "warning.main"
                          : "text.secondary"
                    }
                  >
                    {daysToRenewal < 0
                      ? `${Math.abs(daysToRenewal)} days overdue`
                      : `in ${daysToRenewal} days`}
                  </Typography>
                )}
              </Box>
            )}
            <MuiTooltip title="Refresh">
              <span>
                <IconButton onClick={load} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </MuiTooltip>
          </Box>
        </Box>
      </Paper>
      {loading && data && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      {/* ---------------- Metrics ---------------- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {metrics.map((metric) => (
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={metric.title}>
            <MetricCard {...metric} loading={loading && !data} />
          </Grid>
        ))}
      </Grid>

      {/* ---------------- Charts ---------------- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Card
            title="Trainee enrolments — last 12 months"
            action={
              <Chip size="small" variant="outlined" label={`${fmtNum(m.trainees)} total`} />
            }
          >
            <Box sx={{ height: 250 }}>
              {loading && !data ? (
                <Skeleton variant="rounded" height="100%" />
              ) : hasMonthly ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ left: -20, right: 8 }}>
                    <defs>
                      <linearGradient id="enrolFill" x1="0" y1="0" x2="0" y2="1">
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
                      name="Trainees"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      fill="url(#enrolFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="No enrolments in the last 12 months" />
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card title="Trainees by gender">
            <Box sx={{ height: 250, position: "relative" }}>
              {loading && !data ? (
                <Skeleton variant="circular" width={180} height={180} sx={{ mx: "auto", mt: 3 }} />
              ) : genderTotal > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={gender}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {gender.map((g, i) => (
                          <Cell key={g.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    {gender.map((g, i) => (
                      <Box
                        key={g.name}
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <Typography variant="caption">
                          {g.name} {Math.round((g.value / genderTotal) * 100)}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <EmptyChart text="No trainee data yet" />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Card title="Programmes starting per month">
            <Box sx={{ height: 220 }}>
              {loading && !data ? (
                <Skeleton variant="rounded" height="100%" />
              ) : hasPerMonth ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perMonth} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Programmes"
                      fill={theme.palette.secondary.main}
                      radius={[4, 4, 0, 0]}
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="No programmes started in the last 12 months" />
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card title="Trainers by employment">
            {loading && !data ? (
              <Skeleton variant="rounded" height={150} />
            ) : trainersByEmployment.length === 0 ? (
              <EmptyChart text="No trainers registered" />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {trainersByEmployment.map((t, i) => {
                  const pct = m.trainers
                    ? (Number(t.value) / m.trainers) * 100
                    : 0;
                  return (
                    <Box key={t.name}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ textTransform: "capitalize" }}
                        >
                          {t.name}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {t.value}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          bgcolor: alpha(PIE_COLORS[i % PIE_COLORS.length], 0.15),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card title="Training of Trainers (TOT)">
            {loading && !data ? (
              <Skeleton variant="rounded" height={150} />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.25,
                }}
              >
                {[
                  { label: "Programmes applied", value: tot.programmes, icon: <SchoolIcon fontSize="small" /> },
                  { label: "Trainers applied", value: tot.trainers_applied, icon: <BadgeIcon fontSize="small" /> },
                  { label: "Selected", value: tot.trainers_selected, icon: <GroupsIcon fontSize="small" /> },
                  { label: "Certified", value: tot.certified, icon: <WorkspacePremiumIcon fontSize="small" /> },
                ].map((x) => (
                  <Box
                    key={x.label}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                    }}
                  >
                    <Box sx={{ color: "primary.main", display: "flex" }}>{x.icon}</Box>
                    <Typography fontWeight={700} fontSize="1.15rem">
                      {fmtNum(x.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {x.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ---------------- Programmes table ---------------- */}
      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, lg: 7 }}>
          <Card
            title="Programmes"
            sx={{ p: 0, "& > div:first-of-type": { px: 2, pt: 2, mb: 0 } }}
          >
            <Tabs
              value={programmeTab}
              onChange={(e, v) => {
                setProgrammeTab(v);
                setProgPage(0);
              }}
              variant="scrollable"
              sx={{ px: 1, minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none" } }}
            >
              <Tab value="ONGOING" label={`Ongoing (${m.ongoingProgrammes || 0})`} />
              <Tab value="UPCOMING" label={`Upcoming (${m.upcomingProgrammes || 0})`} />
              <Tab value="COMPLETED" label={`Completed (${m.completedProgrammes || 0})`} />
              <Tab value="ALL" label={`All (${m.programmes || 0})`} />
            </Tabs>
            <TableContainer sx={{ borderTop: "1px solid", borderColor: "divider" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Course</TableCell>
                    <TableCell sx={headCellSx}>Certification</TableCell>
                    <TableCell sx={headCellSx}>Course period</TableCell>
                    <TableCell sx={headCellSx} align="center">Enrolled</TableCell>
                    <TableCell sx={headCellSx} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && !data ? (
                    [0, 1, 2].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : programmes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No programmes in this list
                      </TableCell>
                    </TableRow>
                  ) : (
                    programmes
                      .slice(progPage * progRows, progPage * progRows + progRows)
                      .map((p) => {
                        const st = PROGRAMME_STATUS[p.status] || PROGRAMME_STATUS.UNKNOWN;
                        const cap = parseInt(p.enrollment_capacity, 10);
                        return (
                          <TableRow key={p.application_no} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {p.course_name || "—"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.application_no}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {p.certification_name || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Typography variant="body2">
                                {fmtDate(p.course_start_date)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                to {fmtDate(p.course_end_date)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={600}>
                                {p.enrolled}
                                {Number.isFinite(cap) && cap > 0 ? ` / ${cap}` : ""}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={st.label} color={st.color} />
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
              count={programmes.length}
              page={progPage}
              onPageChange={(e, p) => setProgPage(p)}
              rowsPerPage={progRows}
              onRowsPerPageChange={(e) => {
                setProgRows(parseInt(e.target.value, 10));
                setProgPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Card>
        </Grid>

        {/* ---------------- Recent applications ---------------- */}
        <Grid item size={{ xs: 12, lg: 5 }}>
          <Card
            title="Recent applications"
            sx={{ p: 0, "& > div:first-of-type": { px: 2, pt: 2 } }}
            action={
              <Chip size="small" variant="outlined" label={`${applications.length}`} />
            }
          >
            <TableContainer sx={{ borderTop: "1px solid", borderColor: "divider" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Application</TableCell>
                    <TableCell sx={headCellSx}>Date</TableCell>
                    <TableCell sx={headCellSx} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && !data ? (
                    [0, 1, 2].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}>
                          <Skeleton />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No applications yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications
                      .slice(appPage * appRows, appPage * appRows + appRows)
                      .map((a) => (
                        <TableRow key={a.application_no} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {a.service_name || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {a.application_no}
                              {a.wf_remarks ? ` · ${a.wf_remarks}` : ""}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Typography variant="body2">{fmtDate(a.action_date)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={a.status_name || "—"}
                              color={STATUS_COLOR(a.status_name || "")}
                              variant="outlined"
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
              count={applications.length}
              page={appPage}
              onPageChange={(e, p) => setAppPage(p)}
              rowsPerPage={appRows}
              onRowsPerPageChange={(e) => {
                setAppRows(parseInt(e.target.value, 10));
                setAppPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InstituteDashboard;
