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
} from "@mui/material";
import { useState } from "react";
import {
  People as PeopleIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import {
  LineChart,
  Line,
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

const InstituteDashboard = () => {
  const theme = useTheme();

  // -------------------- Chart Data --------------------
  const lineData = [
    { month: "Jan", trainees: 120 },
    { month: "Feb", trainees: 210 },
    { month: "Mar", trainees: 180 },
    { month: "Apr", trainees: 250 },
    { month: "May", trainees: 300 },
    { month: "Jun", trainees: 280 },
    { month: "Jul", trainees: 350 },
    { month: "Aug", trainees: 400 },
    { month: "Sep", trainees: 380 },
    { month: "Oct", trainees: 420 },
    { month: "Nv", trainees: 450 },
    { month: "Dec", trainees: 500 },
  ];

  const pieData = [
    { name: "Male", value: 430 },
    { name: "Female", value: 300 },
    { name: "Other", value: 10 },
    { name: "Total", value: 740 },
  ];

  const barData = [
    { month: "Jan", courses: 5 },
    { month: "Feb", courses: 8 },
    { month: "Mar", courses: 6 },
    { month: "Apr", courses: 9 },
    { month: "May", courses: 7 },
    { month: "Jun", courses: 10 },
    { month: "Jul", courses: 4 },
    { month: "Aug", courses: 6 },
    { month: "Sep", courses: 8 },
    { month: "Oct", courses: 5 },
    { month: "Nov", courses: 7 },
    { month: "Dec", courses: 9 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

  // -------------------- Pagination --------------------
  const [infoPage, setInfoPage] = useState(0);
  const [infoRowsPerPage, setInfoRowsPerPage] = useState(5);

  const [appPage, setAppPage] = useState(0);
  const [appRowsPerPage, setAppRowsPerPage] = useState(5);

  const [coursePage, setCoursePage] = useState(0);
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(5);

  // -------------------- Table Data --------------------
  const instituteInfo = [
    { label: "Institute Registration Date", value: "26 June 2024" },
    { label: "Valid till", value: "26 June 2026" },
    { label: "Ongoing Course", value: "CBT: 0, Non CBT: 0" },
    { label: "Graduate trainee", value: "0" },
    { label: "QMS Certification", value: "Valid till" },
  ];

  const recentApplications = [
    {
      id: "9000178",
      service: "Change Institute Details",
      submissionDate: "05-Jan-2026",
      status: "SUBMITTED",
      remarks: "",
    },
    {
      id: "8001042",
      service: "Renewal of Institute",
      submissionDate: "12-Jun-2025",
      status: "APPROVED",
      remarks: "",
    },
    {
      id: "8001043",
      service: "Renewal of Institute",
      submissionDate: "09-Jun-2025",
      status: "REJECTED",
      remarks: "Double entry",
    },
  ];

  const recentOngoingCourses = [
    {
      course: "Physics 101",
      certification: "Level 1",
      status: "ONGOING",
      applicationDate: "10-Jan-2026",
      courseDate: "15-Jan-2026",
    },
    {
      course: "Mathematics 201",
      certification: "Level 2",
      status: "COMPLETED",
      applicationDate: "05-Dec-2025",
      courseDate: "10-Dec-2025",
    },
  ];

  const statusColors = {
    SUBMITTED: "warning",
    APPROVED: "success",
    REJECTED: "error",
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
      py: 0.5,
      px: 1,
    },
  };

  const metrics = [
    {
      title: "Total trainees",
      value: "1,240",
      color: "primary",
      icon: <PeopleIcon />,
    },
    {
      title: "New Courses",
      value: "32",
      color: "secondary",
      icon: <BarChartIcon />,
    },
    {
      title: "Staff Members",
      value: "8",
      color: "success",
      icon: <CheckCircleIcon />,
    },
    {
      title: "Annual Budget",
      value: "50,000",
      color: "warning",
      icon: <TrendingUpIcon />,
    },
  ];

  return (
    <Paper sx={{ p: 1.5, mt: 1 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ mb: 1.5, fontSize: "1.1rem" }}
      >
        Dashboard
      </Typography>

      {/* -------------------- Metric Cards -------------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {metrics.map((metric, index) => (
          <Grid item size={{ xs: 6, sm: 6, md: 3 }} key={index}>
            <Paper
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${metric.color}.light`,
                  color: `${metric.color}.main`,
                  width: 36,
                  height: 36,
                  "& svg": { fontSize: "1.1rem" },
                }}
              >
                {metric.icon}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize="1rem">
                  {metric.value}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize="0.7rem"
                >
                  {metric.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* -------------------- Charts -------------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            sx={{
              p: 1.5,
              height: 240,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} fontSize="0.85rem" mb={0.5}>
              Monthly Enrollments
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="trainees"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            sx={{
              p: 1.5,
              height: 240,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} fontSize="0.85rem" mb={0.5}>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={65}
                  label={({ name, value }) => `${name}: ${value}`}
                  fontSize={10}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper
            sx={{
              p: 1.5,
              height: 240,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} fontSize="0.85rem" mb={0.5}>
              Courses per Month
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  barSize={28}
                  dataKey="courses"
                  fill={theme.palette.secondary.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* -------------------- Tables -------------------- */}
      <Grid container spacing={1.5}>
        {/* Institute Info */}
        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper
            sx={{
              p: 1.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 1 }} fontSize="0.85rem">
              Institute Information
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableBody>
                  {instituteInfo
                    .slice(
                      infoPage * infoRowsPerPage,
                      infoPage * infoRowsPerPage + infoRowsPerPage,
                    )
                    .map((row, index) => (
                      <TableRow key={index}>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        >
                          {row.label}
                        </TableCell>
                        <TableCell fontSize="0.75rem">{row.value}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={instituteInfo.length}
              page={infoPage}
              onPageChange={(e, newPage) => setInfoPage(newPage)}
              rowsPerPage={infoRowsPerPage}
              onRowsPerPageChange={(e) => {
                setInfoRowsPerPage(parseInt(e.target.value, 10));
                setInfoPage(0);
              }}
              rowsPerPageOptions={[5, 10]}
              sx={{
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  { fontSize: "0.7rem" },
              }}
            />
          </Paper>
        </Grid>

        {/* Applications */}
        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper
            sx={{
              p: 1.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 1 }} fontSize="0.85rem">
              Recent Applications
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableHead>
                  <TableRow>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      App ID
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Service
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Date
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Status
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Remarks
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentApplications
                    .slice(
                      appPage * appRowsPerPage,
                      appPage * appRowsPerPage + appRowsPerPage,
                    )
                    .map((app) => (
                      <TableRow key={app.id}>
                        <TableCell fontSize="0.75rem">{app.id}</TableCell>
                        <TableCell fontSize="0.75rem">{app.service}</TableCell>
                        <TableCell fontSize="0.75rem">
                          {app.submissionDate}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.status}
                            size="small"
                            color={statusColors[app.status]}
                            sx={{
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </TableCell>
                        <TableCell fontSize="0.75rem">{app.remarks}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={recentApplications.length}
              page={appPage}
              onPageChange={(e, newPage) => setAppPage(newPage)}
              rowsPerPage={appRowsPerPage}
              onRowsPerPageChange={(e) => {
                setAppRowsPerPage(parseInt(e.target.value, 10));
                setAppPage(0);
              }}
              rowsPerPageOptions={[5, 10]}
              sx={{
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  { fontSize: "0.7rem" },
              }}
            />
          </Paper>
        </Grid>

        {/* Courses */}
        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper
            sx={{
              p: 1.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 1 }} fontSize="0.85rem">
              Ongoing Courses
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableHead>
                  <TableRow>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Course
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Certification
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Status
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      App Date
                    </TableCell>
                    <TableCell fontSize="0.75rem" fontWeight={600}>
                      Course Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOngoingCourses
                    .slice(
                      coursePage * courseRowsPerPage,
                      coursePage * courseRowsPerPage + courseRowsPerPage,
                    )
                    .map((course, index) => (
                      <TableRow key={index}>
                        <TableCell fontSize="0.75rem">
                          {course.course}
                        </TableCell>
                        <TableCell fontSize="0.75rem">
                          {course.certification}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.status}
                            size="small"
                            color={
                              course.status === "ONGOING"
                                ? "warning"
                                : course.status === "COMPLETED"
                                  ? "success"
                                  : "error"
                            }
                            sx={{
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </TableCell>
                        <TableCell fontSize="0.75rem">
                          {course.applicationDate}
                        </TableCell>
                        <TableCell fontSize="0.75rem">
                          {course.courseDate}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={recentOngoingCourses.length}
              page={coursePage}
              onPageChange={(e, newPage) => setCoursePage(newPage)}
              rowsPerPage={courseRowsPerPage}
              onRowsPerPageChange={(e) => {
                setCourseRowsPerPage(parseInt(e.target.value, 10));
                setCoursePage(0);
              }}
              rowsPerPageOptions={[5, 10]}
              sx={{
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  { fontSize: "0.7rem" },
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InstituteDashboard;
