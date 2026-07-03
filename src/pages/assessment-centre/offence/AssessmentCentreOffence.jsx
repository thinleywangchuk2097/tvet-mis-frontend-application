import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Pagination,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

// Mock data for demonstration
const mockOffences = [
  {
    id: 1,
    offenceCode: "AC-001",
    offenceType: "Academic",
    description: "Cheating during examination",
    severity: "High",
    status: "Active",
    dateReported: "2026-06-15",
    reportedBy: "John Doe",
    studentName: "Tshewang Dorji",
    studentId: "S-2024-001",
    actionTaken: "Warning letter issued",
    resolutionDate: "2026-06-20",
  },
  {
    id: 2,
    offenceCode: "AC-002",
    offenceType: "Academic",
    description: "Plagiarism in assignment",
    severity: "Medium",
    status: "Under Investigation",
    dateReported: "2026-06-14",
    reportedBy: "Jane Smith",
    studentName: "Karma Wangmo",
    studentId: "S-2024-002",
    actionTaken: "Under review",
    resolutionDate: null,
  },
  {
    id: 3,
    offenceCode: "AD-001",
    offenceType: "Administrative",
    description: "Missing classes without authorization",
    severity: "Low",
    status: "Resolved",
    dateReported: "2026-06-12",
    reportedBy: "Admin Office",
    studentName: "Pema Tshering",
    studentId: "S-2024-003",
    actionTaken: "Verbal warning",
    resolutionDate: "2026-06-18",
  },
  {
    id: 4,
    offenceCode: "BE-001",
    offenceType: "Behavioral",
    description: "Disrespectful conduct towards faculty",
    severity: "High",
    status: "Pending",
    dateReported: "2026-06-10",
    reportedBy: "Dr. Yangchen",
    studentName: "Sonam Dema",
    studentId: "S-2024-004",
    actionTaken: "Pending review",
    resolutionDate: null,
  },
  {
    id: 5,
    offenceCode: "AC-003",
    offenceType: "Academic",
    description: "Unauthorized use of mobile during exam",
    severity: "Medium",
    status: "Active",
    dateReported: "2026-06-08",
    reportedBy: "Exam Committee",
    studentName: "Karma Phuntsho",
    studentId: "S-2024-005",
    actionTaken: "Paper confiscated",
    resolutionDate: null,
  },
];

const offenceTypes = [
  "Academic",
  "Administrative",
  "Behavioral",
  "Technical",
  "Other",
];

const severityLevels = ["Low", "Medium", "High", "Critical"];

const statusOptions = ["Active", "Pending", "Under Investigation", "Resolved"];

const AssessmentCentreOffence = () => {
  const [offences, setOffences] = useState(mockOffences);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedOffence, setSelectedOffence] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"

  // Validation schema for add/edit offence
  const validationSchema = Yup.object({
    offenceType: Yup.string().required("Offence type is required"),
    description: Yup.string()
      .required("Description is required")
      .min(5, "Description must be at least 5 characters"),
    severity: Yup.string().required("Severity level is required"),
    studentName: Yup.string().required("Student name is required"),
    studentId: Yup.string().required("Student ID is required"),
    reportedBy: Yup.string().required("Reported by is required"),
    actionTaken: Yup.string().required("Action taken is required"),
  });

  const formik = useFormik({
    initialValues: {
      offenceType: "",
      description: "",
      severity: "",
      studentName: "",
      studentId: "",
      reportedBy: "",
      actionTaken: "",
      dateReported: new Date().toISOString().split("T")[0],
    },
    validationSchema,
    onSubmit: (values) => {
      handleSaveOffence(values);
    },
  });

  // Handle add offence
  const handleAddOffence = () => {
    setSelectedOffence(null);
    formik.resetForm();
    setOpenDialog(true);
  };

  // Handle edit offence
  const handleEditOffence = (offence) => {
    setSelectedOffence(offence);
    formik.setValues({
      offenceType: offence.offenceType,
      description: offence.description,
      severity: offence.severity,
      studentName: offence.studentName,
      studentId: offence.studentId,
      reportedBy: offence.reportedBy,
      actionTaken: offence.actionTaken,
      dateReported: offence.dateReported,
    });
    setOpenDialog(true);
  };

  // Handle save offence
  const handleSaveOffence = (values) => {
    setLoading(true);
    setTimeout(() => {
      if (selectedOffence) {
        // Edit existing offence
        const updatedOffences = offences.map((offence) =>
          offence.id === selectedOffence.id
            ? { ...offence, ...values, status: "Active" }
            : offence,
        );
        setOffences(updatedOffences);
        toast.success("Offence updated successfully!");
      } else {
        // Add new offence
        const newOffence = {
          id: offences.length + 1,
          offenceCode: `AC-${String(offences.length + 1).padStart(3, "0")}`,
          ...values,
          status: "Active",
          dateReported: values.dateReported,
          resolutionDate: null,
        };
        setOffences([newOffence, ...offences]);
        toast.success("Offence added successfully!");
      }
      setOpenDialog(false);
      formik.resetForm();
      setLoading(false);
    }, 500);
  };

  // Handle view offence
  const handleViewOffence = (offence) => {
    setSelectedOffence(offence);
    setOpenViewDialog(true);
  };

  // Handle delete offence
  const handleDeleteOffence = (offence) => {
    setSelectedOffence(offence);
    setOpenDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    setLoading(true);
    setTimeout(() => {
      const updatedOffences = offences.filter(
        (offence) => offence.id !== selectedOffence.id,
      );
      setOffences(updatedOffences);
      toast.success("Offence deleted successfully!");
      setOpenDeleteDialog(false);
      setSelectedOffence(null);
      setLoading(false);
    }, 500);
  };

  // Handle status change
  const handleStatusChange = (offenceId, newStatus) => {
    setLoading(true);
    setTimeout(() => {
      const updatedOffences = offences.map((offence) =>
        offence.id === offenceId
          ? {
              ...offence,
              status: newStatus,
              resolutionDate:
                newStatus === "Resolved"
                  ? new Date().toISOString().split("T")[0]
                  : offence.resolutionDate,
            }
          : offence,
      );
      setOffences(updatedOffences);
      toast.success(`Status updated to ${newStatus}`);
      setLoading(false);
    }, 400);
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Low":
        return "success";
      case "Medium":
        return "warning";
      case "High":
        return "error";
      case "Critical":
        return "error";
      default:
        return "default";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "info";
      case "Pending":
        return "warning";
      case "Under Investigation":
        return "primary";
      case "Resolved":
        return "success";
      default:
        return "default";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case "Pending":
        return <WarningIcon sx={{ fontSize: 16 }} />;
      case "Resolved":
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  // Filter offences
  const filteredOffences = useMemo(() => {
    let filtered = offences;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((o) => o.offenceType === filterType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    // Filter by severity
    if (filterSeverity !== "all") {
      filtered = filtered.filter((o) => o.severity === filterSeverity);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.offenceCode.toLowerCase().includes(term) ||
          o.description.toLowerCase().includes(term) ||
          o.studentName.toLowerCase().includes(term) ||
          o.studentId.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [offences, filterType, filterStatus, filterSeverity, searchTerm]);

  // Pagination
  const paginatedOffences = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredOffences.slice(start, end);
  }, [filteredOffences, page, rowsPerPage]);

  // Reset filters
  const resetFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterSeverity("all");
    setSearchTerm("");
    setPage(1);
  };

  return (
    <Box sx={{ p: 2, minHeight: "100vh" }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
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
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Offences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage student offences and disciplinary actions
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddOffence}
              size="medium"
            >
              Add Offence
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setOffences(mockOffences);
                toast.info("Data refreshed");
              }}
              size="medium"
            >
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} size="medium">
              Print
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: "#e3f2fd" }}>
              <CardContent>
                <Typography color="text.secondary" variant="caption">
                  Total Offences
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {offences.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: "#fff3e0" }}>
              <CardContent>
                <Typography color="text.secondary" variant="caption">
                  Pending
                </Typography>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {offences.filter((o) => o.status === "Pending").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: "#e8f5e9" }}>
              <CardContent>
                <Typography color="text.secondary" variant="caption">
                  Resolved
                </Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {offences.filter((o) => o.status === "Resolved").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: "#ffebee" }}>
              <CardContent>
                <Typography color="text.secondary" variant="caption">
                  High Severity
                </Typography>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {
                    offences.filter(
                      (o) => o.severity === "High" || o.severity === "Critical",
                    ).length
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }} variant="outlined">
          <Grid container spacing={2} alignItems="center">
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by code, name, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <FilterListIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {offenceTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  label="Severity"
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <MenuItem value="all">All Severity</MenuItem>
                  {severityLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={viewMode === "card"}
                    onChange={() =>
                      setViewMode(viewMode === "table" ? "card" : "table")
                    }
                    size="small"
                  />
                }
                label={viewMode === "table" ? "Table View" : "Card View"}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 1 }}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Table View */}
        {viewMode === "table" && (
          <TableContainer component={Paper} sx={{ mb: 3 }} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOffences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No offences found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOffences.map((offence) => (
                    <TableRow key={offence.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {offence.offenceCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={offence.offenceType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 150 }}
                        >
                          {offence.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {offence.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {offence.studentId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={offence.severity}
                          size="small"
                          color={getSeverityColor(offence.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={offence.status}
                          size="small"
                          color={getStatusColor(offence.status)}
                          icon={getStatusIcon(offence.status)}
                        />
                      </TableCell>
                      <TableCell>{offence.dateReported}</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewOffence(offence)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditOffence(offence)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteOffence(offence)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Card View */}
        {viewMode === "card" && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {paginatedOffences.length === 0 ? (
              <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No offences found
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              paginatedOffences.map((offence) => (
                <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={offence.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {offence.offenceCode}
                          </Typography>
                          <Chip
                            label={offence.offenceType}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        <Chip
                          label={offence.status}
                          size="small"
                          color={getStatusColor(offence.status)}
                          icon={getStatusIcon(offence.status)}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                        {offence.description}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid item size={{ xs: 6, sm: 6, md: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Student
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {offence.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {offence.studentId}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Severity
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={offence.severity}
                              size="small"
                              color={getSeverityColor(offence.severity)}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Date: {offence.dateReported}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewOffence(offence)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditOffence(offence)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteOffence(offence)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Pagination */}
        {filteredOffences.length > rowsPerPage && (
          <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Pagination
              count={Math.ceil(filteredOffences.length / rowsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Stack>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedOffence ? "Edit Offence" : "Add New Offence"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Offence Type *</InputLabel>
                    <Select
                      size="small"
                      name="offenceType"
                      value={formik.values.offenceType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.offenceType &&
                        Boolean(formik.errors.offenceType)
                      }
                      label="Offence Type *"
                    >
                      {offenceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="severity"
                    select
                    label="Severity Level *"
                    value={formik.values.severity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.severity && Boolean(formik.errors.severity)
                    }
                    helperText={
                      formik.touched.severity && formik.errors.severity
                    }
                  >
                    {severityLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="description"
                    label="Description *"
                    multiline
                    rows={2}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.description &&
                      Boolean(formik.errors.description)
                    }
                    helperText={
                      formik.touched.description && formik.errors.description
                    }
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="studentName"
                    label="Student Name *"
                    value={formik.values.studentName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.studentName &&
                      Boolean(formik.errors.studentName)
                    }
                    helperText={
                      formik.touched.studentName && formik.errors.studentName
                    }
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="studentId"
                    label="Student ID *"
                    value={formik.values.studentId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.studentId &&
                      Boolean(formik.errors.studentId)
                    }
                    helperText={
                      formik.touched.studentId && formik.errors.studentId
                    }
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="reportedBy"
                    label="Reported By *"
                    value={formik.values.reportedBy}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.reportedBy &&
                      Boolean(formik.errors.reportedBy)
                    }
                    helperText={
                      formik.touched.reportedBy && formik.errors.reportedBy
                    }
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="dateReported"
                    label="Date Reported"
                    type="date"
                    value={formik.values.dateReported}
                    onChange={formik.handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    name="actionTaken"
                    label="Action Taken *"
                    multiline
                    rows={2}
                    value={formik.values.actionTaken}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.actionTaken &&
                      Boolean(formik.errors.actionTaken)
                    }
                    helperText={
                      formik.touched.actionTaken && formik.errors.actionTaken
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={formik.handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? "Saving..." : selectedOffence ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Offence Details</DialogTitle>
          <DialogContent>
            {selectedOffence && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Offence Code
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedOffence.offenceCode}
                    </Typography>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedOffence.status}
                        color={getStatusColor(selectedOffence.status)}
                        icon={getStatusIcon(selectedOffence.status)}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Offence Type
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.offenceType}
                    </Typography>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Severity
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedOffence.severity}
                        color={getSeverityColor(selectedOffence.severity)}
                      />
                    </Box>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.description}
                    </Typography>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Student Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.studentName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Student ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.studentId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Reported By
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.reportedBy}
                    </Typography>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Date Reported
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.dateReported}
                    </Typography>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Action Taken
                    </Typography>
                    <Typography variant="body1">
                      {selectedOffence.actionTaken}
                    </Typography>
                  </Grid>
                  {selectedOffence.resolutionDate && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Resolution Date
                      </Typography>
                      <Typography variant="body1">
                        {selectedOffence.resolutionDate}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 1 }}>
              Are you sure you want to delete this offence?
            </Alert>
            {selectedOffence && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Code:</strong> {selectedOffence.offenceCode}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {selectedOffence.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Student:</strong> {selectedOffence.studentName}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default AssessmentCentreOffence;
