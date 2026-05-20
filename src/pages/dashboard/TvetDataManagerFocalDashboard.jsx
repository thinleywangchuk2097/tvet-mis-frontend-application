import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
} from "@mui/material";
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// ===== Mock Data =====
const statsData = [
  {
    id: 1,
    title: "Total Institutes",
    value: "156",
    change: "+12",
    trend: "up",
    icon: <SchoolIcon />,
    color: "primary",
  },
  {
    id: 2,
    title: "Active Trainers",
    value: "1,284",
    change: "+48",
    trend: "up",
    icon: <PeopleIcon />,
    color: "secondary",
  },
  {
    id: 3,
    title: "Tracer Sent",
    value: "23",
    change: "35",
    trend: "down",
    icon: <AssignmentIcon />,
    color: "warning",
  },
  {
    id: 4,
    title: "Course Endorse",
    value: "94%",
    change: "5%",
    trend: "up",
    icon: <VerifiedIcon />,
    color: "success",
  },
];

const instituteGrowthData = [
  { month: "Jan", institutes: 65, trainers: 420 },
  { month: "Feb", institutes: 78, trainers: 560 },
  { month: "Mar", institutes: 90, trainers: 680 },
  { month: "Apr", institutes: 95, trainers: 720 },
  { month: "May", institutes: 110, trainers: 890 },
  { month: "Jun", institutes: 125, trainers: 980 },
  { month: "Jul", institutes: 140, trainers: 1100 },
  { month: "Aug", institutes: 156, trainers: 1284 },
];

const instituteDistributionData = [
  { name: "Technical Institutes", value: 85, color: "#4e73df" },
  { name: "Zorig Chusum", value: 45, color: "#1cc88a" },
  { name: "Training Providers", value: 26, color: "#f6c23e" },
];

const monthlyPerformanceData = [
  { name: "Jan", approved: 45, pending: 12, rejected: 3 },
  { name: "Feb", approved: 52, pending: 8, rejected: 4 },
  { name: "Mar", approved: 48, pending: 15, rejected: 2 },
  { name: "Apr", approved: 61, pending: 10, rejected: 5 },
  { name: "May", approved: 55, pending: 13, rejected: 3 },
  { name: "Jun", approved: 67, pending: 9, rejected: 2 },
];

const recentProposalsData = [
  {
    id: "IN001",
    institute: "Robotics & IoT Institute",
    type: "New Registration",
    submitted: "2024-03-15",
    status: "Pending",
  },
  {
    id: "IN002",
    institute: "Bhutan Skills Center",
    type: "Program Addition",
    submitted: "2024-03-14",
    status: "Under Review",
  },
  {
    id: "IN003",
    institute: "Digital Literacy Hub",
    type: "Instructor Update",
    submitted: "2024-03-13",
    status: "Approved",
  },
  {
    id: "IN004",
    institute: "Hospitality Academy",
    type: "Course Modification",
    submitted: "2024-03-12",
    status: "Rejected",
  },
  {
    id: "IN005",
    institute: "Green Energy Institute",
    type: "New Registration",
    submitted: "2024-03-11",
    status: "Pending",
  },
];

const activityTimeline = [
  {
    id: 1,
    action: "New Institute Registration",
    institute: "Digital Marketing Academy",
    time: "10 minutes ago",
    type: "success",
  },
  {
    id: 2,
    action: "Document Verification",
    institute: "Construction Skills Institute",
    time: "25 minutes ago",
    type: "warning",
  },
  {
    id: 3,
    action: "Trainer Certification",
    institute: "Healthcare Training Center",
    time: "1 hour ago",
    type: "info",
  },
  {
    id: 4,
    action: "Quality Audit",
    institute: "Tourism & Hospitality School",
    time: "3 hours ago",
    type: "primary",
  },
  {
    id: 5,
    action: "Program Approval",
    institute: "IT Professional Academy",
    time: "5 hours ago",
    type: "success",
  },
];

const pendingTasksData = [
  { task: "Document Verification", count: 12, progress: 60, color: "primary" },
  { task: "Institute Approvals", count: 8, progress: 40, color: "warning" },
  { task: "Trainer Certifications", count: 15, progress: 75, color: "success" },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const TvetDataManagerFocalDashboard = () => {
  const theme = useTheme();
  // Pagination states
  const [proposalPage, setProposalPage] = useState(0);
  const [proposalRowsPerPage, setProposalRowsPerPage] = useState(5);

  const [activityPage, setActivityPage] = useState(0);
  const [activityRowsPerPage, setActivityRowsPerPage] = useState(5);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "error";
      case "Under Review":
        return "info";
      default:
        return "default";
    }
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  return (
    <Paper sx={{ p: 3, mt: 1 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        TVET Data Manager Dashboard
      </Typography>

      {/* -------------------- Stats Cards -------------------- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statsData.map((stat) => (
          <Grid item size={{ xs: 6, sm: 6, md: 3 }} key={stat.id}>
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
              <Avatar
                sx={{
                  bgcolor: `${stat.color}.light`,
                  color: `${stat.color}.main`,
                }}
              >
                {stat.icon}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Chip
                  label={stat.change}
                  size="small"
                  color={stat.trend === "up" ? "success" : "error"}
                  sx={{ mt: 0.5, height: 20, fontSize: "0.7rem" }}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* -------------------- Charts Row -------------------- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Institute Growth Chart */}
        <Grid item size={{ xs: 12, md: 7 }}>
          <Paper
            sx={{
              p: 2,
              height: 350,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Institute Growth Overview
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={instituteGrowthData}>
                <defs>
                  <linearGradient
                    id="colorInstitutes"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={theme.palette.primary.main}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={theme.palette.primary.main}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorTrainers"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={theme.palette.success.main}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={theme.palette.success.main}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="institutes"
                  stroke={theme.palette.primary.main}
                  fill="url(#colorInstitutes)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="trainers"
                  stroke={theme.palette.success.main}
                  fill="url(#colorTrainers)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Institute Distribution */}
        <Grid item size={{ xs: 12, md: 5 }}>
          <Paper
            sx={{
              p: 2,
              height: 350,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Institute Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={instituteDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {instituteDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* -------------------- Second Row -------------------- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Monthly Performance */}
        <Grid item size={{ xs: 12, md: 7 }}>
          <Paper
            sx={{
              p: 2,
              height: 350,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Monthly Performance
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="approved"
                  fill={theme.palette.success.main}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  fill={theme.palette.warning.main}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="rejected"
                  fill={theme.palette.error.main}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Pending Tasks */}
        <Grid item size={{ xs: 12, md: 5 }}>
          <Paper
            sx={{
              p: 2,
              height: 350,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Pending Tasks
            </Typography>
            <Box sx={{ mt: 2 }}>
              {pendingTasksData.map((task, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">{task.task}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {task.count}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette[task.color].main, 0.1),
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${task.progress}%`,
                        height: "100%",
                        bgcolor: `${task.color}.main`,
                        borderRadius: 4,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* -------------------- Tables -------------------- */}
      <Grid container spacing={2}>
        {/* Recent Proposals Table */}
        <Grid item size={{ xs: 12, md: 12 }}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Recent Proposals
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Institute Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Submitted Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentProposalsData
                    .slice(
                      proposalPage * proposalRowsPerPage,
                      proposalPage * proposalRowsPerPage + proposalRowsPerPage,
                    )
                    .map((proposal) => (
                      <TableRow key={proposal.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {proposal.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{proposal.institute}</TableCell>
                        <TableCell>{proposal.type}</TableCell>
                        <TableCell>{proposal.submitted}</TableCell>
                        <TableCell>
                          <Chip
                            label={proposal.status}
                            color={getStatusColor(proposal.status)}
                            size="small"
                            sx={{ fontWeight: 600, minWidth: 90 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={recentProposalsData.length}
              page={proposalPage}
              onPageChange={(e, newPage) => setProposalPage(newPage)}
              rowsPerPage={proposalRowsPerPage}
              onRowsPerPageChange={(e) => {
                setProposalRowsPerPage(parseInt(e.target.value, 10));
                setProposalPage(0);
              }}
              rowsPerPageOptions={[5, 10]}
            />
          </Paper>
        </Grid>

        {/* Recent Activity Table */}
        <Grid item size={{ xs: 12, md: 12 }}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Recent Activity
            </Typography>

            <TableContainer>
              <Table size="small" sx={tableStyle}>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Institute</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityTimeline
                    .slice(
                      activityPage * activityRowsPerPage,
                      activityPage * activityRowsPerPage + activityRowsPerPage,
                    )
                    .map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: alpha(
                                  theme.palette[activity.type].main,
                                  0.1,
                                ),
                                color: theme.palette[activity.type].main,
                              }}
                            >
                              {activity.type === "success" && (
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                              )}
                              {activity.type === "warning" && (
                                <PendingIcon sx={{ fontSize: 16 }} />
                              )}
                              {activity.type === "info" && (
                                <AssignmentIcon sx={{ fontSize: 16 }} />
                              )}
                              {activity.type === "primary" && (
                                <VerifiedIcon sx={{ fontSize: 16 }} />
                              )}
                            </Avatar>
                            {activity.action}
                          </Box>
                        </TableCell>
                        <TableCell>{activity.institute}</TableCell>
                        <TableCell>{activity.time}</TableCell>
                        <TableCell>
                          <Chip
                            label={activity.type}
                            size="small"
                            color={
                              activity.type === "success"
                                ? "success"
                                : activity.type === "warning"
                                  ? "warning"
                                  : activity.type === "info"
                                    ? "info"
                                    : "primary"
                            }
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={activityTimeline.length}
              page={activityPage}
              onPageChange={(e, newPage) => setActivityPage(newPage)}
              rowsPerPage={activityRowsPerPage}
              onRowsPerPageChange={(e) => {
                setActivityRowsPerPage(parseInt(e.target.value, 10));
                setActivityPage(0);
              }}
              rowsPerPageOptions={[5, 10]}
            />
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TvetDataManagerFocalDashboard;
