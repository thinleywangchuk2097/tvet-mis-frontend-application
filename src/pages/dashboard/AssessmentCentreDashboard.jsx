// Assessment Centre (role 12) dashboard: RPL programmes only
// RPL assessments (service 39), RPL re-assessments (service 41) and the centre's
// certificate-level accredited courses. Uses the same APIs as those pages.
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
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ReplayIcon from "@mui/icons-material/Replay";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";
import CourseEnrollmentService from "../../api/services/internal/course/CourseEnrollmentService";
import ApplyAccreditedCourseService from "../../api/services/internal/course/ApplyAccreditedCourseService";
import CommonService from "../../api/services/internal/common/CommonService";
import { Empty, Kpi, Panel } from "./DashboardParts";
import { fmtNum, headCellSx } from "./dashboardUtils";

const RPL_SERVICE_ID = 39;
const RPL_REASSESSMENT_SERVICE_ID = 41;
const CERTIFICATE_LEVEL_PARENT_ID = 27; // BQF Certificate 1-3 (+ diplomas)
const STATUS_PARENT_ID = 4;

const isError = (res) => res instanceof Error || res?.isAxiosError;
const listOf = (res) => (!isError(res) && Array.isArray(res?.data) ? res.data : []);
const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);

const toDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Registration validity (validity_date): date and days left, as on the institute dashboard
const validityInfo = (raw) => {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return {
    label: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    days: Math.ceil((date - new Date()) / 86400000),
  };
};

const fmtDate = (d) => {
  const date = toDate(d);
  return date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
};

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

// Where an announcement is in its life: application window -> assessment period -> done
const phaseOf = (a) => {
  const today = startOfToday();
  const appStart = toDate(a.application_start_date);
  const appEnd = toDate(a.application_end_date);
  const courseStart = toDate(a.course_start_date);
  const courseEnd = toDate(a.course_end_date);
  if (appStart && appEnd && today >= appStart && today <= appEnd)
    return { key: "open", label: "Applications open", color: "success" };
  if (appStart && today < appStart)
    return { key: "upcoming", label: "Upcoming", color: "info" };
  if (courseStart && courseEnd && today >= courseStart && today <= courseEnd)
    return { key: "ongoing", label: "Assessment ongoing", color: "warning" };
  if (courseEnd && today > courseEnd)
    return { key: "completed", label: "Completed", color: "default" };
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
          <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
        </>
      ) : (
        <>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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

const AssessmentCentreDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const registrationNo = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(true);
  const [centre, setCentre] = useState(null);
  const [assessments, setAssessments] = useState([]); // RPL (39)
  const [reassessments, setReassessments] = useState([]); // RPL re-assessment (41)
  const [courses, setCourses] = useState([]); // registered accredited courses
  const [approvedCourses, setApprovedCourses] = useState([]); // approved, certificate level
  const [levels, setLevels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!registrationNo) return;
    setLoading(true);
    setLoadError("");
    try {
      const [detailsRes, rplRes, reRes, courseRes, approvedRes, levelRes, statusRes] =
        await Promise.all([
          InstituteRegistrationService.getInstituteDetails(registrationNo),
          CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
            registrationNo,
            RPL_SERVICE_ID,
            accessToken,
          ),
          CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
            registrationNo,
            RPL_REASSESSMENT_SERVICE_ID,
            accessToken,
          ),
          ApplyAccreditedCourseService.getAccreditedCourseDetailsByUserId(
            registrationNo,
            accessToken,
          ),
          ApplyAccreditedCourseService.getAccreditedApprovedCertificateCourseByUserId(
            registrationNo,
            accessToken,
          ),
          CommonService.getByParentId(CERTIFICATE_LEVEL_PARENT_ID),
          CommonService.getByParentId(STATUS_PARENT_ID),
        ]);
      const details = listOf(detailsRes)[0] || null;
      setCentre(details);
      if (!details) setLoadError("Centre details not found for this account.");
      setAssessments(listOf(rplRes));
      setReassessments(listOf(reRes));
      setCourses(listOf(courseRes));
      setApprovedCourses(listOf(approvedRes));
      setLevels(listOf(levelRes));
      setStatuses(listOf(statusRes));
    } catch (e) {
      console.error("Assessment centre dashboard load failed:", e);
      setLoadError("Could not load the dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [registrationNo, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- lookups ----------
  const levelName = useMemo(() => {
    const map = {};
    levels.forEach((l) => {
      map[String(l.id)] = l.name;
    });
    return (id) => map[String(id)] || (id ? `Level ${id}` : "—");
  }, [levels]);

  const statusName = useMemo(() => {
    const map = {};
    statuses.forEach((s) => {
      map[String(s.id)] = s.name;
    });
    return (id) => map[String(id)] || (id ? `Status ${id}` : "—");
  }, [statuses]);

  // RPL announcements point at the centre's approved accredited course
  const programmeName = useMemo(() => {
    const map = {};
    [...approvedCourses, ...courses].forEach((c) => {
      if (c.id && c.programme_title) map[String(c.id)] = c.programme_title;
    });
    return (a) => a.course_name || map[String(a.programme_id)] || "—";
  }, [approvedCourses, courses]);

  // ---------- derived ----------
  const all = useMemo(
    () => [
      ...assessments.map((a) => ({ ...a, kind: "RPL Assessment" })),
      ...reassessments.map((a) => ({ ...a, kind: "Re-assessment" })),
    ],
    [assessments, reassessments],
  );

  const stats = useMemo(() => {
    const phases = all.map(phaseOf);
    return {
      open: phases.filter((p) => p.key === "open").length,
      ongoing: phases.filter((p) => p.key === "ongoing").length,
      capacity: assessments.reduce(
        (n, a) => n + num(a.enrollment_capacity ?? a.enrollment),
        0,
      ),
    };
  }, [all, assessments]);

  // assessments per certificate level (both RPL kinds)
  const byLevel = useMemo(() => {
    const counts = {};
    all.forEach((a) => {
      const k = levelName(a.certification_level_id);
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [all, levelName]);

  // assessments per programme (top 8)
  const byProgramme = useMemo(() => {
    const counts = {};
    all.forEach((a) => {
      const k = programmeName(a);
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [all, programmeName]);

  const phaseChips = useMemo(() => {
    const counts = {};
    all.forEach((a) => {
      const p = phaseOf(a);
      counts[p.label] = counts[p.label] || { n: 0, color: p.color };
      counts[p.label].n += 1;
    });
    return Object.entries(counts).map(([label, v]) => ({ label, ...v }));
  }, [all]);

  // latest first
  const sortedAll = useMemo(
    () =>
      [...all].sort(
        (a, b) =>
          (toDate(b.course_start_date || b.application_start_date || b.created_at) || 0) -
          (toDate(a.course_start_date || a.application_start_date || a.created_at) || 0),
      ),
    [all],
  );

  const busy = loading && !centre;

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
      {/* ---------------- Centre header ---------------- */}
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
            <FactCheckIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            {busy ? (
              <>
                <Skeleton width={260} height={34} />
                <Skeleton width={340} />
              </>
            ) : (
              <>
                <Typography variant="h6" fontWeight={700}>
                  {centre?.proposed_institute_name || "Assessment Centre Dashboard"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recognition of Prior Learning (RPL) programmes
                </Typography>
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
                  {centre?.registration_no && (
                    <span className="item">
                      <BadgeIcon sx={{ fontSize: 16 }} />
                      {centre.registration_no}
                    </span>
                  )}
                  {centre?.exact_location && (
                    <span className="item">
                      <LocationOnIcon sx={{ fontSize: 16 }} />
                      {centre.exact_location}
                    </span>
                  )}
                  {centre?.email_id && (
                    <span className="item">
                      <EmailIcon sx={{ fontSize: 16 }} />
                      {centre.email_id}
                    </span>
                  )}
                  {centre?.mobile_no && (
                    <span className="item">
                      <PhoneIcon sx={{ fontSize: 16 }} />
                      {centre.mobile_no}
                    </span>
                  )}
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {validityInfo(centre?.validity_date) && (() => {
              const v = validityInfo(centre.validity_date);
              return (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: v.days < 60 ? "warning.main" : "divider",
                    textAlign: "right",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Renewal due
                  </Typography>
                  <Typography fontWeight={600} fontSize="0.9rem">
                    {v.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      v.days < 0
                        ? "error.main"
                        : v.days < 60
                          ? "warning.main"
                          : "text.secondary"
                    }
                  >
                    {v.days < 0
                      ? `${Math.abs(v.days)} days overdue`
                      : `in ${v.days} days`}
                  </Typography>
                </Box>
              );
            })()}
            <MuiTooltip title="Refresh">
              <span>
                <IconButton onClick={load} disabled={loading} size="small">
                  <RefreshIcon />
                </IconButton>
              </span>
            </MuiTooltip>
          </Box>
        </Box>

        {/* Quick actions */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
          {[
            { label: "RPL assessment", to: "/announcement/rpl-assessment", icon: <FactCheckIcon /> },
            { label: "Re-assessment", to: "/announcement/reassessment", icon: <ReplayIcon /> },
            { label: "Accredited courses", to: "/registration/accredited-course", icon: <MenuBookIcon /> },
            { label: "BQF certificates", to: "/certificate/bqf-certificate", icon: <WorkspacePremiumIcon /> },
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

      {loading && centre && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
      {loadError && !loading && (
        <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
          {loadError}
        </Typography>
      )}

      {/* ---------------- KPIs ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="RPL assessments"
            value={fmtNum(assessments.length)}
            sub={`${fmtNum(stats.capacity)} seats announced`}
            icon={<FactCheckIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="RPL re-assessments"
            value={fmtNum(reassessments.length)}
            icon={<ReplayIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="Open for applications"
            value={fmtNum(stats.open)}
            sub={`${fmtNum(stats.ongoing)} assessment(s) ongoing`}
            icon={<EventAvailableIcon />}
            color="success"
            loading={loading}
            highlight={stats.open > 0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="Approved RPL courses"
            value={fmtNum(approvedCourses.length)}
            sub={`${fmtNum(courses.length)} course application(s)`}
            icon={<MenuBookIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ---------------- Charts ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Assessments by certificate level">
            <Box sx={{ height: 240 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : byLevel.length ? (
                <CountBarChart
                  data={byLevel}
                  name="Assessments"
                  color={theme.palette.primary.main}
                />
              ) : (
                <Empty text="No RPL assessments yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="Assessments by programme (top 8)"
            action={
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {phaseChips.map((c) => (
                  <Chip
                    key={c.label}
                    size="small"
                    variant="outlined"
                    color={c.color}
                    label={`${c.label} ${c.n}`}
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                ))}
              </Box>
            }
          >
            <Box sx={{ height: 240 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : byProgramme.length ? (
                <CountBarChart
                  data={byProgramme}
                  name="Assessments"
                  color={theme.palette.primary.main}
                  horizontal
                />
              ) : (
                <Empty text="No RPL assessments yet" />
              )}
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Tables ---------------- */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Panel
            title="RPL assessments & re-assessments"
            action={
              <Button
                size="small"
                onClick={() => navigate("/announcement/rpl-assessment")}
                sx={{ textTransform: "none" }}
              >
                Manage
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : sortedAll.length ? (
              <TableContainer sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Application No</TableCell>
                      <TableCell>Programme</TableCell>
                      <TableCell>Applications</TableCell>
                      <TableCell>Assessment</TableCell>
                      <TableCell>Seats</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedAll.map((a) => {
                      const phase = phaseOf(a);
                      return (
                        <TableRow key={`${a.kind}-${a.id || a.application_no}`} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Typography fontSize="0.8rem" fontWeight={600}>
                              {a.application_no || "—"}
                            </Typography>
                            <Typography fontSize="0.7rem" color="text.secondary">
                              {a.kind}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize="0.8rem">{programmeName(a)}</Typography>
                            <Typography fontSize="0.7rem" color="text.secondary">
                              {levelName(a.certification_level_id)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {fmtDate(a.application_start_date)} – {fmtDate(a.application_end_date)}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {fmtDate(a.course_start_date)} – {fmtDate(a.course_end_date)}
                          </TableCell>
                          <TableCell>{fmtNum(num(a.enrollment_capacity ?? a.enrollment))}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={phase.color}
                              label={phase.label}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>
                            {statusName(a.application_status_id ?? a.status_id)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ height: 120 }}>
                <Empty text="No RPL assessments announced yet" />
              </Box>
            )}
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel
            title="Approved RPL courses"
            action={
              <Button
                size="small"
                onClick={() => navigate("/registration/accredited-course")}
                sx={{ textTransform: "none" }}
              >
                View all
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : approvedCourses.length ? (
              <TableContainer sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Programme</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Fee (Nu.)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {approvedCourses.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography fontSize="0.8rem" fontWeight={600}>
                            {c.programme_title || "—"}
                          </Typography>
                          <Typography fontSize="0.7rem" color="text.secondary">
                            {num(c.enrolment_capacity)
                              ? `${fmtNum(num(c.enrolment_capacity))} per batch`
                              : ""}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>
                          {levelName(c.certificate_level_id)}
                        </TableCell>
                        <TableCell>{fmtNum(num(c.fees_per_trainee))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ height: 120 }}>
                <Empty text="No approved RPL courses yet" />
              </Box>
            )}
          </Panel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AssessmentCentreDashboard;
