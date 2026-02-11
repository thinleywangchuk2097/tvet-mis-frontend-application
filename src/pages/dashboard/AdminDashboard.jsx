import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Divider,
  alpha,
  Button,
} from "@mui/material";
import {
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  NotificationsActive as NotificationsActiveIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSelector } from "react-redux";

// Sample Graph Data
const graphData = [
  { month: "Jan", value: 4000 },
  { month: "Feb", value: 3000 },
  { month: "Mar", value: 5000 },
  { month: "Apr", value: 2780 },
  { month: "May", value: 1890 },
  { month: "Jun", value: 2390 },
  { month: "Jul", value: 3490 },
  { month: "Aug", value: 6490 },
  { month: "Sep", value: 1490 },
  { month: "Oct", value: 4490 },
  { month: "Nov", value: 2490 },
  { month: "Dec", value: 9490 },
];

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend, subtitle }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.3s ease",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette[color].main,
          0.05,
        )} 0%, ${theme.palette.background.paper} 100%)`,
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette[color].main, 0.1)}`,
          borderColor: alpha(theme.palette[color].main, 0.3),
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${
            theme.palette[color].main
          }, ${alpha(theme.palette[color].main, 0.7)})`,
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
                color: "text.secondary",
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
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
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
                  bgcolor: trend.value > 0 ? "success.light" : "error.light",
                  color: trend.value > 0 ? "success.dark" : "error.dark",
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: "12px",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${alpha(theme.palette[color].main, 0.2)}`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Activity Item Component
const ActivityItem = ({ user, action, time, icon, status = "completed" }) => {
  const statusColors = {
    completed: "success",
    pending: "warning",
    failed: "error",
  };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        py: 2,
        px: 1,
        borderRadius: 1,
        transition: "all 0.2s ease",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          color: "primary.main",
          mr: 2,
        }}
      >
        {icon || user.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.25 }}>
          {user}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {action}
        </Typography>
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Chip
          label={status}
          size="small"
          sx={{
            bgcolor: `${statusColors[status]}.light`,
            color: `${statusColors[status]}.dark`,
            fontSize: "0.7rem",
            height: 20,
            mb: 0.5,
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <AccessTimeIcon sx={{ fontSize: "0.875rem" }} />
          {time}
        </Typography>
      </Box>
    </Box>
  );
};

// Metric Card
const MetricCard = ({ title, value, color, icon, change }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: color,
        boxShadow: (theme) =>
          `0 4px 12px ${alpha(theme.palette[color].main, 0.1)}`,
      },
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        bgcolor: `${color}.light`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h3" fontWeight={700} color={color} sx={{ mb: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" align="center">
      {title}
    </Typography>
    {change && (
      <Chip
        label={change}
        size="small"
        sx={{
          mt: 1,
          bgcolor: change.includes("+") ? "success.light" : "error.light",
          color: change.includes("+") ? "success.dark" : "error.dark",
        }}
      />
    )}
  </Box>
);

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const userId = useSelector((state) => state.auth.userId);
  const roles = useSelector((state) => state.auth.roles);

  const recentActivities = [
    {
      user: "John Doe",
      action: "Deployed new microservice",
      time: "5 min ago",
      status: "completed",
      icon: <SecurityIcon />,
    },
    {
      user: "Jane Smith",
      action: "Updated security policies",
      time: "12 min ago",
      status: "completed",
      icon: <SettingsIcon />,
    },
    {
      user: "Bob Johnson",
      action: "Onboarded 25 new users",
      time: "25 min ago",
      status: "completed",
      icon: <PeopleIcon />,
    },
    {
      user: "Alice Brown",
      action: "Generated quarterly report",
      time: "1 hour ago",
      status: "completed",
      icon: <BarChartIcon />,
    },
    {
      user: "System",
      action: "Scheduled maintenance",
      time: "2 hours ago",
      status: "pending",
      icon: <NotificationsActiveIcon />,
    },
  ];

  const systemMetrics = [
    {
      title: "Server Uptime",
      value: "99.9%",
      color: "success",
      change: "+0.1%",
    },
    { title: "Avg Latency", value: "42ms", color: "info", change: "-5ms" },
    { title: "Error Rate", value: "0.2%", color: "warning", change: "-0.1%" },
    {
      title: "Active Sessions",
      value: "1.2K",
      color: "primary",
      change: "+15%",
    },
  ];

  const quickActions = [
    { label: "Add User", icon: <PeopleIcon />, color: "primary" },
    { label: "View Reports", icon: <BarChartIcon />, color: "secondary" },
    { label: "System Settings", icon: <SettingsIcon />, color: "warning" },
    { label: "Monitor Performance", icon: <TimelineIcon />, color: "success" },
  ];

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        width: "100%",
        p: isMobile ? 2 : 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          Admin Dashboard
        </Typography>
        <Divider
          sx={{
            position: "relative",
            height: 2,
            backgroundColor: "grey.400",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              left: "50%",
              top: 0,
              width: 0,
              height: "100%",
              bgcolor: "primary.main",
              transition: "width 0.4s ease, left 0.4s ease",
              transform: "translateX(-50%)",
            },
            "&:hover::after": {
              width: "100%",
              left: "50%",
            },
          }}
        />
      </Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Users"
            value="1,240"
            subtitle="+142 this week"
            icon={<PeopleIcon />}
            color="primary"
            trend={{ value: 12.5, label: "vs last month" }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Monthly Visits"
            value="34.5K"
            subtitle="Avg. 1.1K daily"
            icon={<BarChartIcon />}
            color="secondary"
            trend={{ value: 8.2, label: "vs last month" }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="System Health"
            value="98.7%"
            subtitle="All systems normal"
            icon={<CheckCircleIcon />}
            color="success"
            trend={{ value: 0.8, label: "improvement" }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Growth Rate"
            value="15.4%"
            subtitle="Quarterly performance"
            icon={<TrendingUpIcon />}
            color="warning"
            trend={{ value: 2.7, label: "vs last quarter" }}
          />
        </Grid>
      </Grid>

      {/* System Graph */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, md: 12 }}>
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 12 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: 300,
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Monthly Performance
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Recent Activity & System Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/*  Recent Activity */}
        <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Recent Activity
              </Typography>
              <Button size="small" endIcon={<MoreVertIcon />}>
                View All
              </Button>
            </Box>
            <Box sx={{ p: 2 }}>
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </Box>
          </Paper>
        </Grid>
        {/*  System Metrics */}
        <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              System Metrics
            </Typography>
            <Grid container spacing={2}>
              {systemMetrics.map((metric, index) => (
                <Grid item size={{ xs: 12, sm: 6, md: 6 }} key={index}>
                  <MetricCard {...metric} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
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
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: `${action.color}.main`,
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

export default AdminDashboard;
