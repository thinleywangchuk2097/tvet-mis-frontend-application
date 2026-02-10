import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  Chip,
  useTheme,
  Paper,
} from "@mui/material";
import {
  Person,
  School,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  AccountBalance,
  People,
  CheckCircle,
  Edit,
  Share,
  Inventory,
  Payment,
  Settings,
  Visibility,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

// Mock Data
const monthlyData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
  { name: "Jul", value: 3490 },
  { name: "Aug", value: 5490 },
  { name: "Sep", value: 2490 },
  { name: "Oct", value: 1490 },
  { name: "Nov", value: 7490 },
  { name: "Dec", value: 4490 },
];

const activityData = [
  {
    time: "09:00 AM",
    action: "Logged in",
    icon: <CheckCircle color="success" />,
  },
  {
    time: "10:30 AM",
    action: "Updated profile",
    icon: <Edit color="primary" />,
  },
  {
    time: "12:15 PM",
    action: "Made a purchase",
    icon: <ShoppingCart color="secondary" />,
  },
  {
    time: "02:45 PM",
    action: "Completed course",
    icon: <School color="info" />,
  },
  {
    time: "04:20 PM",
    action: "Shared content",
    icon: <Share color="warning" />,
  },
];

const quickActions = [
  { icon: <Edit />, label: "Edit Profile", color: "primary" },
  { icon: <Payment />, label: "Make Payment", color: "success" },
  { icon: <Inventory />, label: "View Orders", color: "warning" },
  { icon: <Settings />, label: "Settings", color: "info" },
];

// Components
const StatCard = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        borderRadius: 3,
        transition: "all 0.3s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: theme.shadows[6],
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {value}
            </Typography>
            <Typography
              variant="body2"
              color={change >= 0 ? "success.main" : "error.main"}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              {change >= 0 ? (
                <TrendingUp fontSize="small" />
              ) : (
                <TrendingDown fontSize="small" />
              )}
              {Math.abs(change)}%
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

const ProgressCard = ({ title, value, subtitle, icon }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        borderRadius: 3,
        transition: "all 0.3s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[6],
        },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography variant="body2">Progress</Typography>
          <Typography variant="body2" fontWeight={600}>
            {value}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.palette.grey[300],
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

const RecentActivity = () => (
  <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" fontWeight={600}>
          Recent Activity
        </Typography>
        <Button size="small" endIcon={<Visibility />} variant="outlined">
          View All
        </Button>
      </Stack>
      <List>
        {activityData.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "action.hover", width: 36, height: 36 }}>
                  {item.icon}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body1" fontWeight={500}>
                    {item.action}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {item.time}
                  </Typography>
                }
              />
            </ListItem>
            {index < activityData.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </CardContent>
  </Card>
);

const QuickActions = () => (
  <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Quick Actions
      </Typography>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}
      >
        {quickActions.map((action, index) => (
          <Button
            key={index}
            fullWidth
            variant="outlined"
            startIcon={action.icon}
            sx={{
              height: 80,
              flexDirection: "column",
              borderRadius: 2,
              borderWidth: 2,
              borderColor: `${action.color}.light`,
              color: `${action.color}.main`,
              fontWeight: 500,
              "&:hover": {
                backgroundColor: `${action.color}.light`,
                transform: "translateY(-2px)",
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const UserDashboard = () => {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        width: "100%",
      }}
    >
      <Box sx={{ maxWidth: 1600, mx: "auto", px: 3, py: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
          User Dashboard
        </Typography>

        {/* Top Progress Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 3,
            mb: 3,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
            <ProgressCard
              title="Profile Completion"
              value={75}
              subtitle="Complete your profile"
              icon={<Person />}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
            <ProgressCard
              title="Course Progress"
              value={60}
              subtitle="Complete your current course"
              icon={<School />}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
            <ProgressCard
              title="Monthly Target"
              value={85}
              subtitle="Sales target for this month"
              icon={<TrendingUp />}
            />
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 3,
            mb: 3,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
            <StatCard
              title="Total Revenue"
              value="$24,580"
              change={12.5}
              icon={<AttachMoney />}
              color="success"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
            <StatCard
              title="Active Users"
              value="1,248"
              change={8.2}
              icon={<People />}
              color="primary"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
            <StatCard
              title="Orders"
              value="324"
              change={-2.1}
              icon={<ShoppingCart />}
              color="warning"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
            <StatCard
              title="Balance"
              value="$5,430"
              change={5.7}
              icon={<AccountBalance />}
              color="info"
            />
          </Box>
        </Box>

        {/* Bottom Row: Revenue Chart + Right Column */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 3,
          }}
        >
          {/* Revenue Chart */}
          <Box>
            <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Revenue Overview
                  </Typography>
                  <Chip label="This Month" size="small" />
                </Stack>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <ChartTooltip
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
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Right Column: Recent Activity + Quick Actions */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <RecentActivity />
            </Box>
            <Box sx={{ flex: 1 }}>
              <QuickActions />
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default UserDashboard;
