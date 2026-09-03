import React, { useState } from "react";
import PropTypes from "prop-types";
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

// ==================== STAT CARD COMPONENT ====================

// Stat Card Component - Compact
const StatCard = ({ title, value, icon, color, trend }) => {
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
        borderRadius: 1.5,
        border: "1px solid #e0e0e0",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: mainColor,
        },
      }}
    >
      <CardContent sx={{ p: 2, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            {trend && (
              <Chip
                label={`${trend.value > 0 ? "+" : ""}${trend.value}%`}
                size="small"
                icon={
                  trend.value > 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <WarningIcon sx={{ fontSize: 14 }} />
                  )
                }
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  bgcolor: trend.value > 0 ? "#e8f5e9" : "#ffebee",
                  color: trend.value > 0 ? "#2e7d32" : "#d32f2f",
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              bgcolor: alpha(mainColor, 0.1),
              color: mainColor,
              borderRadius: 1.5,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
  }),
};

// ==================== MAIN COMPONENT ====================

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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  // ================== Statistics Calculations ==================
  const totalRevenue = transactions.reduce(
    (sum, t) => (t.status === "completed" ? sum + t.amount : sum),
    0,
  );
  const totalTransactions = transactions.length;
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending",
  ).length;
  const avgTransactionValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const statsCards = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: <MoneyIcon />,
      color: "primary",
      trend: { value: 12.5 },
    },
    {
      title: "Transactions",
      value: totalTransactions,
      icon: <CartIcon />,
      color: "secondary",
      trend: { value: 5.2 },
    },
    {
      title: "Pending",
      value: pendingTransactions,
      icon: <TimelineIcon />,
      color: "warning",
      trend: { value: -2 },
    },
    {
      title: "Average Value",
      value: `$${avgTransactionValue.toFixed(2)}`,
      icon: <TrendingUpIcon />,
      color: "success",
      trend: { value: 8.1 },
    },
  ];

  // ================== Form Handlers with Formik ==================
  const handleAddTransaction = (values, { resetForm }) => {
    const newTransaction = {
      id: Date.now().toString(),
      ...values,
      date: new Date().toISOString().split("T")[0],
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
          t.id === editingId ? { ...t, ...values, date: t.date } : t,
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
      customerName: transaction.customerName,
      email: transaction.email,
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

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const getStatusChip = (status) => {
    const config = {
      completed: { color: "success", label: "Completed" },
      pending: { color: "warning", label: "Pending" },
      failed: { color: "error", label: "Failed" },
    };
    const { color, label } = config[status] || {
      color: "default",
      label: status,
    };
    return <Chip label={label} size="small" color={color} variant="outlined" />;
  };

  const quickActions = [
    {
      label: "Add Transaction",
      icon: <AddIcon />,
      color: "primary",
      onClick: () => {
        setEditingId(null);
        setEditData(null);
        setDrawerOpen(true);
      },
    },
    { label: "View Reports", icon: <BarChartIcon />, color: "secondary" },
    { label: "System Settings", icon: <SettingsIcon />, color: "warning" },
    { label: "Monitor Performance", icon: <TimelineIcon />, color: "success" },
  ];

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Default Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Overview of your transaction activity.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Graph Section 1 - Line Chart & Pie Chart */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #e0e0e0",
              height: 300,
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
              <Typography variant="subtitle2" fontWeight={600}>
                Monthly Transaction Performance
              </Typography>
              <IconButton size="small">
                <ShowChartIcon fontSize="small" />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Revenue"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Active Users"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #e0e0e0",
              height: 300,
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
              <Typography variant="subtitle2" fontWeight={600}>
                Status Distribution
              </Typography>
              <IconButton size="small">
                <PieChartIcon fontSize="small" />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={transactionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={{ fontSize: 10 }}
                >
                  {transactionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Graph Section 2 - Bar Chart & Donut Chart */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #e0e0e0",
              height: 300,
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
              <Typography variant="subtitle2" fontWeight={600}>
                Monthly Activity Overview
              </Typography>
              <IconButton size="small">
                <BarChartIcon fontSize="small" />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="proposals"
                  name="Proposals"
                  stackId="a"
                  fill={COLORS.primary}
                />
                <Bar
                  dataKey="registrations"
                  name="Registrations"
                  stackId="a"
                  fill={COLORS.secondary}
                />
                <Bar
                  dataKey="endorsements"
                  name="Endorsements"
                  stackId="a"
                  fill={COLORS.success}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #e0e0e0",
              height: 300,
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
              <Typography variant="subtitle2" fontWeight={600}>
                Institute Distribution
              </Typography>
              <IconButton size="small">
                <DonutLargeIcon fontSize="small" />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={instituteDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={{ fontSize: 10 }}
                >
                  {instituteDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
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
        sx={{ p: 2, borderRadius: 1.5, border: "1px solid #e0e0e0", mb: 3 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Recent Transactions
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingId(null);
              setEditData(null);
              setDrawerOpen(true);
            }}
          >
            New
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell>
                  <strong>Customer</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Amount</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
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
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: alpha(COLORS.primary, 0.1),
                            color: COLORS.primary,
                            fontSize: 12,
                          }}
                        >
                          {transaction.customerName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {transaction.customerName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell variant="body2">{transaction.email}</TableCell>
                    <TableCell align="right" variant="body2" fontWeight={600}>
                      ${transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusChip(transaction.status)}</TableCell>
                    <TableCell variant="body2">{transaction.date}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(transaction)}
                        sx={{ color: COLORS.primary }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(transaction.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Area Chart Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #e0e0e0",
              height: 300,
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
              <Typography variant="subtitle2" fontWeight={600}>
                Revenue Trend Analysis
              </Typography>
              <IconButton size="small">
                <ShowChartIcon fontSize="small" />
              </IconButton>
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
                <XAxis dataKey="month" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
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

      {/* Quick Actions - Compact */}
      <Paper
        elevation={0}
        sx={{ p: 2, borderRadius: 1.5, border: "1px solid #e0e0e0" }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={1} sx={{ mt: 0.5 }}>
          {quickActions.map((action, index) => (
            <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{ justifyContent: "flex-start", py: 1 }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Drawer Form */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
          setEditData(null);
        }}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 400 }, p: 2 } }}
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
            {editingId ? "Edit" : "Add"} Transaction
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setDrawerOpen(false);
              setEditingId(null);
              setEditData(null);
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Formik
          key={editingId || "add"}
          initialValues={editData && editingId ? editData : initialValues}
          validationSchema={transactionSchema}
          enableReinitialize
          onSubmit={(values, helpers) => {
            if (editingId) handleUpdateTransaction(values, helpers);
            else handleAddTransaction(values, helpers);
            setDrawerOpen(false);
            setEditingId(null);
            setEditData(null);
          }}
        >
          {({ errors, touched, handleChange, handleBlur, values }) => (
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="customerName"
                    label="Customer Name *"
                    value={values.customerName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.customerName && Boolean(errors.customerName)}
                    helperText={touched.customerName && errors.customerName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="email"
                    label="Email *"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="amount"
                    label="Amount ($) *"
                    type="number"
                    value={values.amount === 0 ? "" : values.amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.amount && Boolean(errors.amount)}
                    helperText={touched.amount && errors.amount}
                    InputProps={{
                      startAdornment: <span style={{ marginRight: 4 }}>$</span>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="status"
                    label="Status *"
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
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    sx={{ py: 1, borderRadius: 1.5 }}
                  >
                    {editingId ? "Update" : "Create"}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setDrawerOpen(false);
                      setEditingId(null);
                      setEditData(null);
                    }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Cancel
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
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
DefaultDashboard.propTypes = {};

export default DefaultDashboard;
