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
  { name: "TTI Bumthang", value: 25, color: "#9c27b0" },
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

// Transaction Status Distribution
const transactionStatusData = [
  { name: "Completed", value: 68, color: "#2e7d32" },
  { name: "Pending", value: 22, color: "#ed6c02" },
  { name: "Failed", value: 10, color: "#d32f2f" },
];

// Monthly Activity Data
const monthlyActivity = [
  { month: "Jan", proposals: 12, registrations: 8, endorsements: 5 },
  { month: "Feb", proposals: 15, registrations: 10, endorsements: 7 },
  { month: "Mar", proposals: 18, registrations: 12, endorsements: 9 },
  { month: "Apr", proposals: 14, registrations: 15, endorsements: 11 },
  { month: "May", proposals: 20, registrations: 18, endorsements: 13 },
  { month: "Jun", proposals: 22, registrations: 20, endorsements: 15 },
];

// ==================== Validation Schema using Yup ====================
const transactionSchema = Yup.object().shape({
  customerName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .required("Customer name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email address is required"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be greater than 0")
    .required("Amount is required"),
  status: Yup.string()
    .oneOf(["pending", "completed", "failed"], "Invalid status")
    .required("Status is required"),
});

// ================== Initial Values ==================
const initialValues = {
  customerName: "",
  email: "",
  amount: 0,
  status: "pending",
};

// Stat Card Component
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

const DefaultDashboard = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transactions, setTransactions] = useState([
    {
      id: "1",
      customerName: "Alice Johnson",
      email: "alice@example.com",
      amount: 1250.0,
      status: "completed",
      date: "2024-03-15",
    },
    {
      id: "2",
      customerName: "Bob Smith",
      email: "bob@example.com",
      amount: 750.5,
      status: "pending",
      date: "2024-03-14",
    },
    {
      id: "3",
      customerName: "Carol Davis",
      email: "carol@example.com",
      amount: 2100.0,
      status: "completed",
      date: "2024-03-13",
    },
    {
      id: "4",
      customerName: "David Wilson",
      email: "david@example.com",
      amount: 320.75,
      status: "failed",
      date: "2024-03-12",
    },
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  // ================== Statistics Calculations ==================
  const totalRevenue = transactions.reduce(
    (sum, t) => (t.status === "completed" ? sum + t.amount : sum),
    0
  );
  const totalTransactions = transactions.length;
  const pendingTransactions = transactions.filter((t) => t.status === "pending").length;
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const statsCards = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: "Year to date",
      icon: <MoneyIcon />,
      color: "primary",
      trend: { value: 12.5, label: "vs last month" },
    },
    {
      title: "Transactions",
      value: totalTransactions,
      subtitle: "Total processed",
      icon: <CartIcon />,
      color: "secondary",
      trend: { value: 5.2, label: "increase" },
    },
    {
      title: "Pending",
      value: pendingTransactions,
      subtitle: "Awaiting processing",
      icon: <TimelineIcon />,
      color: "warning",
      trend: { value: -2, label: "decrease" },
    },
    {
      title: "Average Value",
      value: `$${avgTransactionValue.toFixed(2)}`,
      subtitle: "Per transaction",
      icon: <TrendingUpIcon />,
      color: "success",
      trend: { value: 8.1, label: "improvement" },
    },
  ];

  // ================== Form Handlers with Formik ==================
  const handleAddTransaction = (values, { resetForm }) => {
    const newTransaction = {
      id: Date.now().toString(),
      customerName: values.customerName,
      email: values.email,
      amount: values.amount,
      status: values.status,
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions([newTransaction, ...transactions]);
    resetForm();
    setSnackbar({ open: true, message: "Transaction added successfully!", severity: "success" });
  };

  const handleUpdateTransaction = (values, { resetForm }) => {
    if (editingId) {
      setTransactions(
        transactions.map((t) =>
          t.id === editingId ? { ...t, ...values, date: t.date } : t
        )
      );
      setEditingId(null);
      resetForm();
      setSnackbar({ open: true, message: "Transaction updated successfully!", severity: "success" });
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditData({
      customerName: transaction.customerName,
      email: transaction.email,
      amount: transaction.amount,
      status: transaction.status,
    });
    setDrawerOpen(true);
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    setSnackbar({ open: true, message: "Transaction deleted successfully!", severity: "success" });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "completed":
        return <Chip label="Completed" size="small" color="success" variant="outlined" />;
      case "pending":
        return <Chip label="Pending" size="small" color="warning" variant="outlined" />;
      case "failed":
        return <Chip label="Failed" size="small" color="error" variant="outlined" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formikKey = editingId || "add";
  const formInitialValues = editData && editingId ? editData : initialValues;

  const quickActions = [
    { label: "Add Transaction", icon: <AddIcon />, color: "primary", onClick: () => {
      setEditingId(null);
      setEditData(null);
      setDrawerOpen(true);
    }},
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Default Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Here's an overview of your transaction activity and analytics.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              color={card.color}
              trend={card.trend}
            />
          </Grid>
        ))}
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
                mb: 2,
              }}
            >
              <Typography variant="h7" fontWeight={600}>
                Monthly Transaction Performance
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
                  name="Active Users"
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
                Transaction Status Distribution
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
                  data={transactionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {transactionStatusData.map((entry, index) => (
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
                Monthly Activity Overview
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
                <Bar dataKey="proposals" name="Proposals" stackId="a" fill={COLORS.primary} />
                <Bar
                  dataKey="registrations"
                  name="Registrations"
                  stackId="a"
                  fill={COLORS.secondary}
                />
                <Bar dataKey="endorsements" name="Endorsements" stackId="a" fill={COLORS.success} />
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
                Institute Distribution
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
                  data={instituteDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
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

      {/* Transactions Table Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h7" fontWeight={600}>
            Recent Transactions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingId(null);
              setEditData(null);
              setDrawerOpen(true);
            }}
            sx={{ textTransform: "none" }}
          >
            New Transaction
          </Button>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No transactions yet. Click "New Transaction" to add.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(COLORS.primary, 0.1),
                            color: COLORS.primary,
                          }}
                        >
                          {transaction.customerName.charAt(0)}
                        </Avatar>
                        <Typography fontWeight={500}>{transaction.customerName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.email}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ${transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusChip(transaction.status)}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Area Chart Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12 }}>
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
                Revenue Trend Analysis
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
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
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
      </Grid>

      {/* Quick Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h7" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {quickActions.map((action, index) => (
            <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  p: 2,
                  justifyContent: "flex-start",
                  "&:hover": {
                    borderColor: COLORS[action.color],
                    bgcolor: alpha(COLORS[action.color], 0.04),
                  },
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Drawer Form with Formik + Yup */}
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" fontWeight="700">
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
          key={formikKey}
          initialValues={formInitialValues}
          validationSchema={transactionSchema}
          enableReinitialize={true}
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
          {({ errors, touched, isSubmitting, handleChange, handleBlur, values }) => (
            <Form>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="customerName"
                    label="Customer Name *"
                    value={values.customerName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.customerName && Boolean(errors.customerName)}
                    helperText={touched.customerName && errors.customerName}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address *"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="amount"
                    label="Amount ($) *"
                    type="number"
                    value={values.amount === 0 ? "" : values.amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.amount && Boolean(errors.amount)}
                    helperText={touched.amount && errors.amount}
                    variant="outlined"
                    InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>$</span> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    name="status"
                    label="Status *"
                    value={values.status}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.status && Boolean(errors.status)}
                    helperText={touched.status && errors.status}
                    SelectProps={{ native: true }}
                    variant="outlined"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={<SaveIcon />}
                    sx={{ py: 1.2, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                  >
                    {editingId ? "Update Transaction" : "Create Transaction"}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setDrawerOpen(false);
                      setEditingId(null);
                      setEditData(null);
                    }}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Drawer>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DefaultDashboard;