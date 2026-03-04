import {
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // -------------------- Chart Data --------------------
  const lineData = [
    { month: "Jan", students: 120 },
    { month: "Feb", students: 210 },
    { month: "Mar", students: 180 },
    { month: "Apr", students: 250 },
    { month: "May", students: 300 },
    { month: "Jun", students: 280 },
    { month: "Jul", students: 350 },
    { month: "Aug", students: 400 },  
    { month: "Sep", students: 380 },
    { month: "Oct", students: 420 },
    { month: "Nv", students: 450 },
    { month: "Dec", students: 500 },
  ];

  const pieData = [
    { name: "Science", value: 400 },
    { name: "Commerce", value: 300 },
    { name: "Arts", value: 300 },
    { name: "Other", value: 200 },
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
    { label: "Graduate Students", value: "0" },
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
    },
  };

  const metrics = [
    { title: "Total Students", value: "1,240", color: "primary", icon: <PeopleIcon /> },
    { title: "New Courses", value: "32", color: "secondary", icon: <BarChartIcon /> },
    { title: "Staff Members", value: "8", color: "success", icon: <CheckCircleIcon /> },
    { title: "Grade", value: "A+", color: "warning", icon: <TrendingUpIcon /> },
  ];

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Institute Dashboard
      </Typography>

      {/* -------------------- Metric Cards -------------------- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item size={{ xs: 6, sm: 6, md: 3 }} key={index}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Avatar sx={{ bgcolor: `${metric.color}.light`, color: `${metric.color}.main` }}>
                {metric.icon}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{metric.value}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* -------------------- Charts -------------------- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography fontWeight={600}>Monthly Enrollments</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke={theme.palette.primary.main} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography fontWeight={600}>Students Distribution</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography fontWeight={600}>Courses per Month</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar barSize={40} dataKey="courses" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* -------------------- Tables -------------------- */}
      <Grid container spacing={2}>
        {/* Institute Info */}
        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Institute Information
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableBody>
                  {instituteInfo
                    .slice(infoPage * infoRowsPerPage, infoPage * infoRowsPerPage + infoRowsPerPage)
                    .map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                        <TableCell>{row.value}</TableCell>
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
            />
          </Paper>
        </Grid>
        {/* Applications */}
        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Status of Recent Application
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableHead>
                  <TableRow>
                    <TableCell>Application ID</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentApplications
                    .slice(appPage * appRowsPerPage, appPage * appRowsPerPage + appRowsPerPage)
                    .map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{app.id}</TableCell>
                        <TableCell>{app.service}</TableCell>
                        <TableCell>{app.submissionDate}</TableCell>
                        <TableCell>
                          <Chip label={app.status} size="small" color={statusColors[app.status]} />
                        </TableCell>
                        <TableCell>{app.remarks}</TableCell>
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
            />
          </Paper>
        </Grid>

        {/* Courses */}
        <Grid item size={{ xs: 12, sm: 12, md: 12}}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Recent Ongoing Course Details
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Certification</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Application Date</TableCell>
                    <TableCell>Course Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOngoingCourses
                    .slice(
                      coursePage * courseRowsPerPage,
                      coursePage * courseRowsPerPage + courseRowsPerPage
                    )
                    .map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.course}</TableCell>
                        <TableCell>{course.certification}</TableCell>
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
                          />
                        </TableCell>
                        <TableCell>{course.applicationDate}</TableCell>
                        <TableCell>{course.courseDate}</TableCell>
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
            />
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InstituteDashboard;