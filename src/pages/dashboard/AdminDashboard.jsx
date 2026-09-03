import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import PropTypes from "prop-types";
import {
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  StackedLineChart as StackedLineChartIcon,
  DonutLarge as DonutLargeIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Professional color palette
const COLORS = {
  primary: "#1976d2",
  secondary: "#9c27b0",
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#d32f2f",
  info: "#0288d1",
};

// Sample Graph Data
const graphData = [
  { month: "Jan", value: 4000, users: 2400, institutes: 45 },
  { month: "Feb", value: 3000, users: 2800, institutes: 48 },
  { month: "Mar", value: 5000, users: 3200, institutes: 52 },
  { month: "Apr", value: 2780, users: 3800, institutes: 55 },
  { month: "May", value: 1890, users: 4200, institutes: 58 },
  { month: "Jun", value: 2390, users: 4800, institutes: 62 },
  { month: "Jul", value: 3490, users: 5200, institutes: 68 },
  { month: "Aug", value: 6490, users: 5800, institutes: 65 },
  { month: "Sep", value: 1490, users: 6200, institutes: 70 },
  { month: "Oct", value: 4490, users: 6800, institutes: 75 },
  { month: "Nov", value: 2490, users: 7200, institutes: 78 },
  { month: "Dec", value: 9490, users: 7800, institutes: 85 },
];

// Pie Chart Data - Institute Distribution
const instituteDistribution = [
  { name: "TTI Thimphu", value: 35, color: "#1976d2" },
  { name: "TTI bumthang", value: 25, color: "#9c27b0" },
  { name: "TTI Wangdue", value: 20, color: "#2e7d32" },
  { name: "TTI Mongar", value: 15, color: "#ed6c02" },
  { name: "TTI Tashi Yangtse", value: 5, color: "#d32f2f" },
];

// Donut Chart Data - Status Distribution
const statusDistribution = [
  { name: "Completed", value: 45, color: "#2e7d32" },
  { name: "Pending", value: 25, color: "#ed6c02" },
  { name: "In Progress", value: 20, color: "#1976d2" },
  { name: "Rejected", value: 10, color: "#d32f2f" },
];

// Stacked Bar Chart Data - Monthly Activity
const monthlyActivity = [
  { month: "Jan", proposals: 12, registrations: 8, endorsements: 5 },
  { month: "Feb", proposals: 15, registrations: 10, endorsements: 7 },
  { month: "Mar", proposals: 18, registrations: 12, endorsements: 9 },
  { month: "Apr", proposals: 14, registrations: 15, endorsements: 11 },
  { month: "May", proposals: 20, registrations: 18, endorsements: 13 },
  { month: "Jun", proposals: 22, registrations: 20, endorsements: 15 },
];

// Composed Chart Data
const composedData = [
  { month: "Jan", revenue: 45000, users: 1200, growth: 15 },
  { month: "Feb", revenue: 52000, users: 1350, growth: 18 },
  { month: "Mar", revenue: 48000, users: 1420, growth: 12 },
  { month: "Apr", revenue: 61000, users: 1580, growth: 22 },
  { month: "May", revenue: 58000, users: 1650, growth: 19 },
  { month: "Jun", revenue: 72000, users: 1820, growth: 25 },
];

// ==================== STAT CARD COMPONENT ====================

const StatCard = ({ title, value, icon, color, trend, subtitle }) => {
  const getColorValue = (colorName) => {
    const colorMap = {
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      success: COLORS.success,
      warning: COLORS.warning,
      error: COLORS.error,
      info: COLORS.info,
    };
    return colorMap[color] || COLORS.primary;
  };

  const mainColor = getColorValue(color);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        height: "100%",
        border: "1px solid #e0e0e0",
        transition: "all 0.3s ease",
        background: `linear-gradient(135deg, rgba(${parseInt(mainColor.slice(1, 3), 16)}, ${parseInt(mainColor.slice(3, 5), 16)}, ${parseInt(mainColor.slice(5, 7), 16)}, 0.05) 0%, #ffffff 100%)`,
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px rgba(0,0,0,0.1)`,
          borderColor: mainColor,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${mainColor}, ${mainColor}99)`,
        },
      }}
    >
      <CardContent sx={{ p: 3, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 500,
                display: "block",
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mb: 1 }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip
                label={`${trend.value > 0 ? "+" : ""}${trend.value}% ${
                  trend.label
                }`}
                size="small"
                icon={trend.value > 0 ? <TrendingUpIcon /> : <WarningIcon />}
                sx={{
                  bgcolor: trend.value > 0 ? "#e8f5e9" : "#ffebee",
                  color: trend.value > 0 ? "#2e7d32" : "#d32f2f",
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: mainColor,
              borderRadius: "12px",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ==================== PROPTYPES FOR STAT CARD ====================
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "info",
  ]),
  trend: PropTypes.shape({
    value: PropTypes.number,
    label: PropTypes.string,
  }),
  subtitle: PropTypes.string,
};

// ==================== ADMIN DASHBOARD ====================

const AdminDashboard = () => {
  const quickActions = [
    { label: "Add User", icon: <PeopleIcon />, color: "primary" },
    { label: "View Reports", icon: <BarChartIcon />, color: "secondary" },
    { label: "System Settings", icon: <SettingsIcon />, color: "warning" },
    { label: "Monitor Performance", icon: <TimelineIcon />, color: "success" },
  ];

  return (
    <Paper
      sx={{
        p: 3,
        mt: 1,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          Admin Dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Users"
            value="1,240"
            subtitle="142 this year"
            icon={<PeopleIcon />}
            color="primary"
            trend={{ value: 12, label: "vs last month" }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Roles"
            value="34"
            subtitle="34 this year"
            icon={<BarChartIcon />}
            color="secondary"
            trend={{ value: 8, label: "vs last month" }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active dropdowns"
            value="45"
            subtitle="active dropdowns in tvet mis"
            icon={<CheckCircleIcon />}
            color="success"
            trend={{ value: 0.8, label: "improvement" }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Institute Proposal"
            value="15%"
            subtitle="monthly"
            icon={<TrendingUpIcon />}
            color="warning"
            trend={{ value: 2.7, label: "vs last quarter" }}
          />
        </Grid>
      </Grid>

      {/* Graph Section 1 - Line Chart & Pie Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              height: 350,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Monthly Performance
              </Typography>
              <Tooltip title="Revenue Trend">
                <IconButton size="small">
                  <ShowChartIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Revenue"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              height: 350,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Institute Distribution
              </Typography>
              <Tooltip title="Pie Chart">
                <IconButton size="small">
                  <PieChartIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={instituteDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {instituteDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Graph Section 2 - Bar Chart & Donut Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              height: 350,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Monthly Activity
              </Typography>
              <Tooltip title="Stacked Bar Chart">
                <IconButton size="small">
                  <BarChartIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                  }}
                />
                <Legend />
                <Bar dataKey="proposals" stackId="a" fill={COLORS.primary} />
                <Bar
                  dataKey="registrations"
                  stackId="a"
                  fill={COLORS.secondary}
                />
                <Bar dataKey="endorsements" stackId="a" fill={COLORS.success} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              height: 350,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Application Status Distribution
              </Typography>
              <Tooltip title="Donut Chart">
                <IconButton size="small">
                  <DonutLargeIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Graph Section 4 - Area Chart & Composed Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              height: 350,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Revenue Trend
              </Typography>
              <Tooltip title="Area Chart">
                <IconButton size="small">
                  <ShowChartIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Revenue"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              height: 350,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Growth Analytics
              </Typography>
              <Tooltip title="Composed Chart">
                <IconButton size="small">
                  <StackedLineChartIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={composedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" />
                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  barSize={20}
                  fill={COLORS.primary}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                />
                <Scatter
                  yAxisId="right"
                  dataKey="growth"
                  fill={COLORS.success}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h7" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {quickActions.map((action, index) => (
            <Grid item size={{ xs: 12, sm: 6, md: 6 }} key={index}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                sx={{
                  p: 2,
                  justifyContent: "flex-start",
                  "&:hover": {
                    borderColor: COLORS[action.color],
                    bgcolor: `${action.color}.light`,
                  },
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
AdminDashboard.propTypes = {};

export default AdminDashboard;
