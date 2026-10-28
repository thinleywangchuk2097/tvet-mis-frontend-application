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
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CampaignIcon from "@mui/icons-material/Campaign";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";
import TutorService from "../../api/services/internal/ses-center/TutorService";
import SubjectService from "../../api/services/internal/ses-center/SubjectService";
import StudentService from "../../api/services/internal/ses-center/StudentService";
import TuitionAnnouncementService from "../../api/services/internal/ses-center/TuitionAnnouncementService";
import { Empty, Kpi, Panel } from "./DashboardParts";
import { fmtNum, headCellSx } from "./dashboardUtils";

// Status ids used by the ses-centre pages
const STUDENT_STATUS = { 1: "Active", 2: "Inactive", 3: "Graduated", 4: "Suspended" };
const TUTOR_ACTIVE = 1;
const ANNOUNCEMENT_STATUS = {
  1: { label: "Draft", color: "warning" },
  2: { label: "Published", color: "success" },
  3: { label: "Closed", color: "error" },
  4: { label: "Cancelled", color: "default" },
};

const isError = (res) => res instanceof Error || res?.isAxiosError;
const listOf = (res) => (!isError(res) && Array.isArray(res?.data) ? res.data : []);
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

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
  [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") ||
  p.name ||
  "—";

const parseSubjects = (raw) => {
  if (!raw) return [];
  try {
    const list = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
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
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
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

      const [tutorRes, subjectRes, studentRes, annRes] = await Promise.all([
        TutorService.getAllTutors(instituteId, accessToken),
        SubjectService.getAllSubjects(instituteId, accessToken),
        StudentService.getAllStudents(instituteId, accessToken),
        TuitionAnnouncementService.getAllTuitionAnnouncement(
          instituteId,
          accessToken,
        ),
      ]);
      setTutors(listOf(tutorRes));
      setSubjects(listOf(subjectRes));
      setStudents(listOf(studentRes));
      setAnnouncements(listOf(annRes));
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

  const tutorName = useMemo(() => {
    const map = {};
    tutors.forEach((t) => {
      map[String(t.id)] = personName(t);
    });
    return (id) => map[String(id)] || "—";
  }, [tutors]);

  const stats = useMemo(() => {
    const activeStudents = students.filter(
      (s) => Number(s.status_id ?? 1) === 1,
    ).length;
    const activeTutors = tutors.filter(
      (t) => Number(t.status_id ?? TUTOR_ACTIVE) === TUTOR_ACTIVE,
    ).length;
    const published = announcements.filter(
      (a) => Number(a.status_id) === 2,
    ).length;
    const seatsMax = announcements.reduce(
      (n, a) => n + (num(a.max_students) || 0),
      0,
    );
    const seatsUsed = announcements.reduce(
      (n, a) => n + (num(a.current_enrollments) || 0),
      0,
    );
    return { activeStudents, activeTutors, published, seatsMax, seatsUsed };
  }, [students, tutors, announcements]);

  const studentsByClass = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const c = s.current_class || s.currentClass || "Not set";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label: String(label), value }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true }),
      );
  }, [students]);

  const studentsBySubject = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      parseSubjects(s.subjects).forEach((sub) => {
        const id = sub.subjectId ?? sub.subject_id;
        if (id === undefined || id === null) return;
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([id, value]) => ({ label: subjectName(id), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [students, subjectName]);

  const studentStatusChips = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const k = Number(s.status_id ?? 1);
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([id, n]) => ({
      label: STUDENT_STATUS[id] || `Status ${id}`,
      n,
    }));
  }, [students]);

  const recentStudents = useMemo(
    () =>
      [...students]
        .sort(
          (a, b) =>
            new Date(b.enrollment_date || b.created_at || 0) -
            new Date(a.enrollment_date || a.created_at || 0),
        )
        .slice(0, 6),
    [students],
  );

  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort(
        (a, b) =>
          new Date(b.start_date || b.created_at || 0) -
          new Date(a.start_date || a.created_at || 0),
      ),
    [announcements],
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
            { label: "Tutors", to: "/ses-centre/tutor-index", icon: <PersonIcon /> },
            { label: "Subjects", to: "/ses-centre/subject-index", icon: <MenuBookIcon /> },
            { label: "Students", to: "/ses-centre/add-student", icon: <PeopleIcon /> },
            {
              label: "Tuition announcements",
              to: "/ses-centre/tuition-announcement",
              icon: <CampaignIcon />,
            },
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
            title="Students"
            value={fmtNum(students.length)}
            sub={`${fmtNum(stats.activeStudents)} active`}
            icon={<PeopleIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="Tutors"
            value={fmtNum(tutors.length)}
            sub={`${fmtNum(stats.activeTutors)} active`}
            icon={<PersonIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="Subjects offered"
            value={fmtNum(subjects.length)}
            icon={<MenuBookIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Kpi
            title="Published announcements"
            value={fmtNum(stats.published)}
            sub={
              stats.seatsMax
                ? `${fmtNum(stats.seatsUsed)}/${fmtNum(stats.seatsMax)} seats filled`
                : `${fmtNum(announcements.length)} in total`
            }
            icon={<CampaignIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ---------------- Charts ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="Students by class"
            action={
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {studentStatusChips.map((c) => (
                  <Chip
                    key={c.label}
                    size="small"
                    variant="outlined"
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
              ) : studentsByClass.length ? (
                <CountBarChart
                  data={studentsByClass}
                  name="Students"
                  color={theme.palette.primary.main}
                />
              ) : (
                <Empty text="No students added yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Students per subject (top 8)">
            <Box sx={{ height: 240 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : studentsBySubject.length ? (
                <CountBarChart
                  data={studentsBySubject}
                  name="Students"
                  color={theme.palette.primary.main}
                  horizontal
                />
              ) : (
                <Empty text="No subject enrolments yet" />
              )}
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Tables ---------------- */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="Tuition announcements"
            action={
              <Button
                size="small"
                onClick={() => navigate("/ses-centre/tuition-announcement")}
                sx={{ textTransform: "none" }}
              >
                Manage
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : sortedAnnouncements.length ? (
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Subject / tutor</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell sx={{ width: 120 }}>Seats</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedAnnouncements.map((a) => {
                      const max = num(a.max_students);
                      const used = num(a.current_enrollments) || 0;
                      const pct = max ? Math.min(100, (used / max) * 100) : 0;
                      const st = ANNOUNCEMENT_STATUS[Number(a.status_id)] || {
                        label: a.status || "—",
                        color: "default",
                      };
                      return (
                        <TableRow key={a.id} hover>
                          <TableCell>
                            <Typography fontSize="0.8rem" fontWeight={600}>
                              {a.title || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize="0.8rem">
                              {subjectName(a.subject_id)}
                            </Typography>
                            <Typography fontSize="0.72rem" color="text.secondary">
                              {tutorName(a.tutor_id)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {fmtDate(a.start_date)} – {fmtDate(a.end_date)}
                          </TableCell>
                          <TableCell>
                            {max ? (
                              <>
                                <Typography fontSize="0.72rem">
                                  {used}/{max}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  color={pct >= 100 ? "error" : "primary"}
                                  sx={{ height: 5, borderRadius: 3 }}
                                />
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={st.color}
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
                <Empty text="No tuition announcements yet" />
              </Box>
            )}
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel
            title="Recently enrolled students"
            action={
              <Button
                size="small"
                onClick={() => navigate("/ses-centre/add-student")}
                sx={{ textTransform: "none" }}
              >
                View all
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : recentStudents.length ? (
              <TableContainer>
                <Table size="small" sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Enrolled</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentStudents.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>
                          <Typography fontSize="0.8rem" fontWeight={600}>
                            {personName(s)}
                          </Typography>
                          <Typography fontSize="0.72rem" color="text.secondary">
                            {[s.student_code, s.school_name]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.current_class || "—"}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {fmtDate(s.enrollment_date || s.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ height: 120 }}>
                <Empty text="No students added yet" />
              </Box>
            )}
          </Panel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SESCentreDashboard;
