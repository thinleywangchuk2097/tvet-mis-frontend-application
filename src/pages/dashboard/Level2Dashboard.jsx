import React, { useState } from "react";
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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  useTheme,
  alpha,
  Fade,
  Grow,
  Zoom,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
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
  Dashboard as DashboardIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
} from "recharts";
import { Formik, Form } from "formik";
import * as Yup from "yup";

// Professional color palette
const COLORS = {
  primary: "#1976d2",
  secondary: "#9c27b0",
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#d32f2f",
  info: "#0288d1",
  accent1: "#ff6b6b",
  accent2: "#4ecdc4",
  accent3: "#45b7d1",
};

// Enhanced Sample Data for Level 2 Dashboard
const level2Data = {
  // Performance metrics over time
  performanceData: [
    {
      month: "Jan",
      revenue: 12500,
      users: 1250,
      engagement: 68,
      satisfaction: 4.2,
    },
    {
      month: "Feb",
      revenue: 15200,
      users: 1420,
      engagement: 72,
      satisfaction: 4.3,
    },
    {
      month: "Mar",
      revenue: 18800,
      users: 1680,
      engagement: 75,
      satisfaction: 4.4,
    },
    {
      month: "Apr",
      revenue: 17200,
      users: 1590,
      engagement: 73,
      satisfaction: 4.3,
    },
    {
      month: "May",
      revenue: 22100,
      users: 1950,
      engagement: 78,
      satisfaction: 4.5,
    },
    {
      month: "Jun",
      revenue: 25400,
      users: 2280,
      engagement: 81,
      satisfaction: 4.6,
    },
    {
      month: "Jul",
      revenue: 29800,
      users: 2650,
      engagement: 84,
      satisfaction: 4.7,
    },
    {
      month: "Aug",
      revenue: 31200,
      users: 2890,
      engagement: 86,
      satisfaction: 4.8,
    },
    {
      month: "Sep",
      revenue: 34500,
      users: 3240,
      engagement: 88,
      satisfaction: 4.8,
    },
    {
      month: "Oct",
      revenue: 37800,
      users: 3560,
      engagement: 89,
      satisfaction: 4.9,
    },
    {
      month: "Nov",
      revenue: 40200,
      users: 3890,
      engagement: 91,
      satisfaction: 4.9,
    },
    {
      month: "Dec",
      revenue: 45600,
      users: 4250,
      engagement: 93,
      satisfaction: 5.0,
    },
  ],

  // Department performance
  departmentData: [
    { name: "Sales", value: 45, target: 40, growth: 12.5, color: "#1976d2" },
    { name: "Marketing", value: 32, target: 35, growth: 8.3, color: "#9c27b0" },
    {
      name: "Development",
      value: 28,
      target: 30,
      growth: 15.2,
      color: "#2e7d32",
    },
    { name: "Support", value: 22, target: 25, growth: 5.7, color: "#ed6c02" },
    { name: "HR", value: 18, target: 20, growth: 3.2, color: "#d32f2f" },
  ],

  // Product performance
  productData: [
    {
      name: "Product A",
      revenue: 125000,
      units: 1250,
      rating: 4.5,
      growth: 15,
    },
    { name: "Product B", revenue: 98000, units: 980, rating: 4.2, growth: 8 },
    { name: "Product C", revenue: 76000, units: 890, rating: 4.7, growth: 22 },
    { name: "Product D", revenue: 54000, units: 670, rating: 4.0, growth: -3 },
    { name: "Product E", revenue: 42000, units: 540, rating: 4.3, growth: 11 },
  ],

  // Geographic distribution
  regionData: [
    { name: "North America", value: 42, color: "#1976d2" },
    { name: "Europe", value: 28, color: "#9c27b0" },
    { name: "Asia Pacific", value: 18, color: "#2e7d32" },
    { name: "Latin America", value: 8, color: "#ed6c02" },
    { name: "Middle East", value: 4, color: "#d32f2f" },
  ],

  // Customer segments
  segmentData: [
    { name: "Enterprise", value: 45, revenue: 450000, color: "#1976d2" },
    { name: "SMB", value: 32, revenue: 280000, color: "#9c27b0" },
    { name: "Startup", value: 15, revenue: 120000, color: "#2e7d32" },
    { name: "Individual", value: 8, revenue: 50000, color: "#ed6c02" },
  ],

  // Recent activities
  activities: [
    {
      id: 1,
      user: "John Doe",
      action: "Completed project milestone",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      user: "Jane Smith",
      action: "Submitted quarterly report",
      time: "4 hours ago",
      type: "info",
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "Requested budget approval",
      time: "5 hours ago",
      type: "warning",
    },
    {
      id: 4,
      user: "Sarah Williams",
      action: "Launched new campaign",
      time: "1 day ago",
      type: "success",
    },
    {
      id: 5,
      user: "Tom Brown",
      action: "Updated system settings",
      time: "1 day ago",
      type: "info",
    },
  ],

  // KPIs
  kpis: {
    totalRevenue: { value: 345800, target: 400000, growth: 15.2 },
    activeUsers: { value: 4250, target: 5000, growth: 18.5 },
    conversionRate: { value: 3.8, target: 4.5, growth: 0.8 },
    customerSatisfaction: { value: 4.7, target: 5.0, growth: 0.3 },
  },
};

// Recent transactions data
const recentTransactions = [
  {
    id: "TRX-001",
    customer: "Alice Johnson",
    amount: 1250,
    status: "completed",
    date: "2024-03-15",
    type: "purchase",
  },
  {
    id: "TRX-002",
    customer: "Bob Smith",
    amount: 750,
    status: "pending",
    date: "2024-03-14",
    type: "subscription",
  },
  {
    id: "TRX-003",
    customer: "Carol Davis",
    amount: 2100,
    status: "completed",
    date: "2024-03-13",
    type: "purchase",
  },
  {
    id: "TRX-004",
    customer: "David Wilson",
    amount: 320,
    status: "failed",
    date: "2024-03-12",
    type: "refund",
  },
  {
    id: "TRX-005",
    customer: "Emma Brown",
    amount: 890,
    status: "completed",
    date: "2024-03-11",
    type: "subscription",
  },
  {
    id: "TRX-006",
    customer: "Frank Miller",
    amount: 1540,
    status: "pending",
    date: "2024-03-10",
    type: "purchase",
  },
];

// Validation schema
const transactionSchema = Yup.object().shape({
  customerName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  amount: Yup.number().positive("Must be positive").required("Required"),
  status: Yup.string().required("Required"),
});

// Enhanced Stat Card Component
const EnhancedStatCard = ({
  title,
  value,
  icon,
  color,
  trend,
  target,
  subtitle,
}) => {
  const getColorValue = (colorName) => {
    const colorMap = {
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      success: COLORS.success,
      warning: COLORS.warning,
      error: COLORS.error,
      info: COLORS.info,
    };
    return colorMap[colorName] || COLORS.primary;
  };

  const mainColor = getColorValue(color);
  const progress = target ? (value / target) * 100 : 0;

  return (
    <Grow in timeout={500}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          height: "100%",
          border: "1px solid #e0e0e0",
          transition: "all 0.3s ease",
          background: `linear-gradient(135deg, ${alpha(mainColor, 0.05)} 0%, #ffffff 100%)`,
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: `0 12px 32px ${alpha(mainColor, 0.15)}`,
            borderColor: mainColor,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: `linear-gradient(90deg, ${mainColor}, ${alpha(mainColor, 0.6)})`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#666",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, mb: 0.5 }}>
                {typeof value === "number" && title.includes("Revenue")
                  ? `$${value.toLocaleString()}`
                  : typeof value === "number"
                    ? value.toLocaleString()
                    : value}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{ color: "#666", display: "block" }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar
              sx={{
                bgcolor: alpha(mainColor, 0.1),
                color: mainColor,
                width: 56,
                height: 56,
              }}
            >
              {icon}
            </Avatar>
          </Box>

          {trend && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: target ? 2 : 0,
              }}
            >
              <Chip
                label={`${trend.value > 0 ? "+" : ""}${trend.value}%`}
                size="small"
                icon={
                  trend.value > 0 ? <TrendingUpIcon /> : <ArrowDownwardIcon />
                }
                sx={{
                  bgcolor:
                    trend.value > 0
                      ? alpha(COLORS.success, 0.1)
                      : alpha(COLORS.error, 0.1),
                  color: trend.value > 0 ? COLORS.success : COLORS.error,
                  fontWeight: 600,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                vs last period
              </Typography>
            </Box>
          )}

          {target && (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Progress to target
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={mainColor}
                >
                  {progress.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(mainColor, 0.1),
                  "& .MuiLinearProgress-bar": {
                    bgcolor: mainColor,
                    borderRadius: 3,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Target:{" "}
                {typeof target === "number" && title.includes("Revenue")
                  ? `$${target.toLocaleString()}`
                  : target.toLocaleString()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
};

const Level2Dashboard = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transactions, setTransactions] = useState(recentTransactions);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [timeRange, setTimeRange] = useState("yearly");
  const [selectedTab, setSelectedTab] = useState(0);

  // Enhanced KPIs
  const kpiCards = [
    {
      title: "Total Revenue",
      value: level2Data.kpis.totalRevenue.value,
      target: level2Data.kpis.totalRevenue.target,
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: "primary",
      trend: { value: level2Data.kpis.totalRevenue.growth, label: "growth" },
      subtitle: "Year to date",
    },
    {
      title: "Active Users",
      value: level2Data.kpis.activeUsers.value,
      target: level2Data.kpis.activeUsers.target,
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      color: "secondary",
      trend: { value: level2Data.kpis.activeUsers.growth, label: "increase" },
      subtitle: "Monthly active",
    },
    {
      title: "Conversion Rate",
      value: `${level2Data.kpis.conversionRate.value}%`,
      target: level2Data.kpis.conversionRate.target,
      icon: <BarChartIcon sx={{ fontSize: 32 }} />,
      color: "success",
      trend: {
        value: level2Data.kpis.conversionRate.growth,
        label: "improvement",
      },
      subtitle: "Overall rate",
    },
    {
      title: "Customer Satisfaction",
      value: level2Data.kpis.customerSatisfaction.value,
      target: level2Data.kpis.customerSatisfaction.target,
      icon: <StarIcon sx={{ fontSize: 32 }} />,
      color: "warning",
      trend: {
        value: level2Data.kpis.customerSatisfaction.growth * 10,
        label: "increase",
      },
      subtitle: "Out of 5.0",
    },
  ];

  const handleAddTransaction = (values, { resetForm }) => {
    const newTransaction = {
      id: `TRX-${String(transactions.length + 1).padStart(3, "0")}`,
      customer: values.customerName,
      amount: values.amount,
      status: values.status,
      date: new Date().toISOString().split("T")[0],
      type: "purchase",
    };
    setTransactions([newTransaction, ...transactions]);
    resetForm();
    setSnackbar({
      open: true,
      message: "Transaction added successfully!",
      severity: "success",
    });
  };

  const handleUpdateTransaction = (values, { resetForm }) => {
    if (editingId) {
      setTransactions(
        transactions.map((t) =>
          t.id === editingId
            ? {
                ...t,
                customer: values.customerName,
                amount: values.amount,
                status: values.status,
              }
            : t,
        ),
      );
      setEditingId(null);
      resetForm();
      setSnackbar({
        open: true,
        message: "Transaction updated successfully!",
        severity: "success",
      });
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditData({
      customerName: transaction.customer,
      email: `${transaction.customer.toLowerCase().replace(" ", ".")}@example.com`,
      amount: transaction.amount,
      status: transaction.status,
    });
    setDrawerOpen(true);
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    setSnackbar({
      open: true,
      message: "Transaction deleted successfully!",
      severity: "success",
    });
  };

  const getStatusChip = (status) => {
    const config = {
      completed: {
        label: "Completed",
        color: "success",
        icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
      },
      pending: {
        label: "Pending",
        color: "warning",
        icon: <TimelineIcon sx={{ fontSize: 14 }} />,
      },
      failed: {
        label: "Failed",
        color: "error",
        icon: <WarningIcon sx={{ fontSize: 14 }} />,
      },
    };
    const { label, color, icon } = config[status] || config.pending;
    return (
      <Chip
        icon={icon}
        label={label}
        size="small"
        color={color}
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      {/* Header Section */}

      <Typography variant="h6" fontWeight={700} mb={3}>
        Level 2 Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiCards.map((kpi, index) => (
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <EnhancedStatCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs Navigation */}
      <Paper
        elevation={0}
        sx={{ mb: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}
      >
        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          sx={{ px: 2 }}
        >
          <Tab label="Performance Overview" />
          <Tab label="Product Analytics" />
          <Tab label="Customer Insights" />
          <Tab label="Transactions" />
        </Tabs>
      </Paper>

      {/* Tab Content - Performance Overview */}
      {selectedTab === 0 && (
        <Fade in>
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Revenue & Users Trend */}
              <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: 400,
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
                    <Typography variant="h6" fontWeight={700}>
                      Revenue & User Growth
                    </Typography>
                    <Tooltip title="Monthly performance trend">
                      <IconButton size="small">
                        <ShowChartIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ResponsiveContainer width="100%" height="85%">
                    <ComposedChart data={level2Data.performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis yAxisId="left" stroke={COLORS.primary} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={COLORS.secondary}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e0e0e0",
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        name="Revenue ($)"
                        fill={COLORS.primary}
                        barSize={30}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="users"
                        name="Active Users"
                        stroke={COLORS.secondary}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Engagement & Satisfaction */}
              <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: 400,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Engagement Metrics
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={level2Data.performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        name="Engagement %"
                        stroke={COLORS.success}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="satisfaction"
                        name="Satisfaction"
                        stroke={COLORS.warning}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Department Performance & Geographic Distribution */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: 350,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Department Performance vs Target
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={level2Data.departmentData}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" stroke="#666" />
                      <YAxis type="category" dataKey="name" stroke="#666" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Actual"
                        fill={COLORS.primary}
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="target"
                        name="Target"
                        fill={COLORS.secondary}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: 350,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Geographic Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={level2Data.regionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label
                      >
                        {level2Data.regionData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Tab Content - Product Analytics */}
      {selectedTab === 1 && (
        <Fade in>
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item size={{ xs: 12, md: 12 }}>
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Product Performance Matrix
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={level2Data.productData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis yAxisId="left" stroke={COLORS.primary} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={COLORS.success}
                      />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        name="Revenue ($)"
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rating"
                        name="Rating"
                        stroke={COLORS.warning}
                        strokeWidth={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Product Growth Metrics
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={level2Data.productData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip />
                      <Bar
                        dataKey="growth"
                        name="Growth %"
                        fill={COLORS.success}
                        radius={[4, 4, 0, 0]}
                      >
                        {level2Data.productData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              entry.growth > 0 ? COLORS.success : COLORS.error
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Units Sold by Product
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={level2Data.productData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="units"
                        label
                      >
                        {level2Data.productData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              Object.values(COLORS)[
                                index % Object.values(COLORS).length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Tab Content - Customer Insights */}
      {selectedTab === 2 && (
        <Fade in>
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: 400,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Customer Segments
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={level2Data.segmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {level2Data.segmentData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: 400,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Revenue by Segment
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={level2Data.segmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip />
                      <Bar
                        dataKey="revenue"
                        name="Revenue ($)"
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Activities */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Customer Activities
              </Typography>
              <List>
                {level2Data.activities.map((activity) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      borderBottom: "1px solid #e0e0e0",
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: alpha(COLORS[activity.type], 0.1),
                          color: COLORS[activity.type],
                        }}
                      >
                        {activity.user.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.user}
                      secondary={activity.action}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Tab Content - Transactions */}
      {selectedTab === 3 && (
        <Fade in>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Transaction History
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingId(null);
                  setEditData(null);
                  setDrawerOpen(true);
                }}
              >
                New Transaction
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(COLORS.primary, 0.05) }}>
                    <TableCell>
                      <strong>Transaction ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Customer</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Type</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>
                          {transaction.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(COLORS.primary, 0.1),
                              color: COLORS.primary,
                            }}
                          >
                            {transaction.customer.charAt(0)}
                          </Avatar>
                          {transaction.customer}
                        </Box>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, color: COLORS.primary }}
                      >
                        ${transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusChip(transaction.status)}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(transaction)}
                            sx={{ mr: 1, color: COLORS.primary }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(transaction.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>
      )}

      {/* Drawer Form */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
          setEditData(null);
        }}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 450 }, p: 3 } }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {editingId ? "Edit Transaction" : "Add New Transaction"}
          </Typography>
          <IconButton
            onClick={() => {
              setDrawerOpen(false);
              setEditingId(null);
              setEditData(null);
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Formik
          key={editingId || "add"}
          initialValues={
            editData || {
              customerName: "",
              email: "",
              amount: "",
              status: "pending",
            }
          }
          validationSchema={transactionSchema}
          enableReinitialize
          onSubmit={(values, helpers) => {
            if (editingId) {
              handleUpdateTransaction(values, helpers);
            } else {
              handleAddTransaction(values, helpers);
            }
            setDrawerOpen(false);
            setEditingId(null);
            setEditData(null);
          }}
        >
          {({
            errors,
            touched,
            handleChange,
            handleBlur,
            values,
            isSubmitting,
          }) => (
            <Form>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 12 }}>
                  <TextField
                    fullWidth
                    name="customerName"
                    label="Customer Name"
                    value={values.customerName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.customerName && Boolean(errors.customerName)}
                    helperText={touched.customerName && errors.customerName}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12 }}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12 }}>
                  <TextField
                    fullWidth
                    name="amount"
                    label="Amount ($)"
                    type="number"
                    value={values.amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.amount && Boolean(errors.amount)}
                    helperText={touched.amount && errors.amount}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12 }}>
                  <TextField
                    select
                    fullWidth
                    name="status"
                    label="Status"
                    value={values.status}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.status && Boolean(errors.status)}
                    helperText={touched.status && errors.status}
                    SelectProps={{ native: true }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </TextField>
                </Grid>
                <Grid item size={{ xs: 12, sm: 12 }}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={<SaveIcon />}
                  >
                    {editingId ? "Update" : "Create"} Transaction
                  </Button>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Level2Dashboard;
