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
import PersonIcon from "@mui/icons-material/Person";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";
import TutorService from "../../api/services/internal/ses-center/TutorService";
import SubjectService from "../../api/services/internal/ses-center/SubjectService";
import CommonService from "../../api/services/internal/common/CommonService";
import { Empty, Kpi, Panel } from "./DashboardParts";
import { fmtNum, headCellSx } from "./dashboardUtils";

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

// Status ids used by the ses-centre pages
const TUTOR_ACTIVE = 1;
// Add Subject workflow (service 56); no status = added before the workflow
const SUBJECT_STATUS = {
  55: { label: "Submitted", color: "info" },
  56: { label: "Verified", color: "primary" },
  57: { label: "Approved", color: "success" },
  58: { label: "Rejected", color: "error" },
};
const isApprovedSubject = (s) =>
  !s.application_status_id || Number(s.application_status_id) === 57;

const isError = (res) => res instanceof Error || res?.isAxiosError;
const listOf = (res) => (!isError(res) && Array.isArray(res?.data) ? res.data : []);

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

const personName = (p) =>
  p.name ||
  [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") ||
  "—";


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
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={horizontal}
        horizontal={!horizontal}
      />
      {horizontal ? (
        <>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 11 }}
          />
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

const SESCentreDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const registrationNo = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(true);
  const [centre, setCentre] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!registrationNo) return;
    setLoading(true);
    setLoadError("");
    try {
      const detailsRes =
        await InstituteRegistrationService.getInstituteDetails(registrationNo);
      const details = listOf(detailsRes)[0] || null;
      setCentre(details);

      const instituteId = details?.institute_id;
      if (!instituteId) {
        setLoadError("Centre details not found for this account.");
        return;
      }

      const [tutorRes, subjectRes, levelRes] = await Promise.all([
        TutorService.getAllTutors(instituteId, accessToken),
        SubjectService.getAllSubjects(instituteId, accessToken),
        CommonService.getByParentId(18), // Academic Qualification = class level
      ]);
      setTutors(listOf(tutorRes));
      setSubjects(listOf(subjectRes));
      setClassLevels(listOf(levelRes));
    } catch (e) {
      console.error("SES dashboard load failed:", e);
      setLoadError("Could not load the dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [registrationNo, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- derived data ----------
  const subjectName = useMemo(() => {
    const map = {};
    subjects.forEach((s) => {
      map[String(s.id)] = s.subject_name || s.subject_code || `Subject ${s.id}`;
    });
    return (id) => map[String(id)] || "—";
  }, [subjects]);

  const classLevelName = (id) =>
    classLevels.find((c) => String(c.id) === String(id))?.name || "Not set";

  const tutorSubjectIds = (t) =>
    t.subject_ids
      ? String(t.subject_ids)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

  const stats = useMemo(() => {
    const activeTutors = tutors.filter(
      (t) => Number(t.status_id ?? TUTOR_ACTIVE) === TUTOR_ACTIVE,
    ).length;
    const approved = subjects.filter(isApprovedSubject).length;
    const pending = subjects.filter((s) =>
      [55, 56].includes(Number(s.application_status_id)),
    ).length;
    const rejected = subjects.filter(
      (s) => Number(s.application_status_id) === 58,
    ).length;
    return { activeTutors, approved, pending, rejected };
  }, [tutors, subjects]);

  const subjectsByClassLevel = useMemo(() => {
    const counts = {};
    subjects.filter(isApprovedSubject).forEach((s) => {
      const label = classLevelName(s.class_level_id);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, classLevels]);

  const tutorsBySubject = useMemo(() => {
    const counts = {};
    tutors.forEach((t) =>
      tutorSubjectIds(t).forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      }),
    );
    return Object.entries(counts)
      .map(([id, value]) => ({ label: subjectName(id), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tutors, subjectName]);

  const sortedSubjects = useMemo(
    () =>
      [...subjects].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      ),
    [subjects],
  );

  const recentTutors = useMemo(
    () =>
      [...tutors]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        )
        .slice(0, 6),
    [tutors],
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
          <Avatar
            sx={{ bgcolor: "primary.main", width: 52, height: 52 }}
            variant="rounded"
          >
            <SchoolIcon />
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
                  {centre?.proposed_institute_name || "SES Centre Dashboard"}
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
            { label: "Tutors", to: "/ses-centre/tutor-index", icon: <PersonIcon /> },
            { label: "Subjects", to: "/ses-centre/subject-index", icon: <MenuBookIcon /> },
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Kpi
            title="Tutors"
            value={fmtNum(tutors.length)}
            sub={`${fmtNum(stats.activeTutors)} active`}
            icon={<PersonIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Kpi
            title="Approved subjects"
            value={fmtNum(stats.approved)}
            sub={`${fmtNum(subjects.length)} in total`}
            icon={<MenuBookIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Kpi
            title="Subjects awaiting approval"
            value={fmtNum(stats.pending)}
            sub={stats.rejected ? `${fmtNum(stats.rejected)} rejected` : undefined}
            icon={<PendingActionsIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ---------------- Charts ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Approved subjects by class level">
            <Box sx={{ height: 240 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : subjectsByClassLevel.length ? (
                <CountBarChart
                  data={subjectsByClassLevel}
                  name="Subjects"
                  color={theme.palette.primary.main}
                />
              ) : (
                <Empty text="No approved subjects yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Tutors per subject (top 8)">
            <Box sx={{ height: 240 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : tutorsBySubject.length ? (
                <CountBarChart
                  data={tutorsBySubject}
                  name="Tutors"
                  color={theme.palette.primary.main}
                  horizontal
                />
              ) : (
                <Empty text="No subjects assigned to tutors yet" />
              )}
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Tables ---------------- */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="Subjects"
            action={
              <Button
                size="small"
                onClick={() => navigate("/ses-centre/subject-index")}
                sx={{ textTransform: "none" }}
              >
                Manage
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : sortedSubjects.length ? (
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Class level</TableCell>
                      <TableCell align="center">Hours</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedSubjects.map((sub) => {
                      const st = SUBJECT_STATUS[
                        Number(sub.application_status_id)
                      ] || { label: "Approved", color: "success" };
                      return (
                        <TableRow key={sub.id} hover>
                          <TableCell>
                            <Typography fontSize="0.8rem" fontWeight={600}>
                              {sub.subject_name || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {sub.class_level_id
                              ? classLevelName(sub.class_level_id)
                              : "—"}
                          </TableCell>
                          <TableCell align="center">
                            {sub.total_duration_hours || "—"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={st.color}
                              variant="outlined"
                              label={st.label}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ height: 120 }}>
                <Empty text="No subjects added yet" />
              </Box>
            )}
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel
            title="Recently added tutors"
            action={
              <Button
                size="small"
                onClick={() => navigate("/ses-centre/tutor-index")}
                sx={{ textTransform: "none" }}
              >
                View all
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : recentTutors.length ? (
              <TableContainer>
                <Table size="small" sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tutor</TableCell>
                      <TableCell>Subjects</TableCell>
                      <TableCell>Added</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTutors.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography fontSize="0.8rem" fontWeight={600}>
                            {personName(t)}
                          </Typography>
                          <Typography fontSize="0.72rem" color="text.secondary">
                            {t.citizen_id || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {tutorSubjectIds(t).map(subjectName).join(", ") ||
                            "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {fmtDate(t.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ height: 120 }}>
                <Empty text="No tutors added yet" />
              </Box>
            )}
          </Panel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SESCentreDashboard;
