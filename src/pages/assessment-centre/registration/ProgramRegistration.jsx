import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Chip,
  CircularProgress,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUpload from "../../../components/file/FileUpload";

// Helper function to convert file to base64
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result.split(",")[1],
        contentType: file.type || "application/octet-stream",
      });
    reader.onerror = reject;
  });

// Table style constant
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

const ProgramRegistration = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [programTypes, setProgramTypes] = useState([]);
  const [statusList, setStatusList] = useState([]);

  useEffect(() => {
    fetchProgramTypes();
    fetchPrograms();
    fetchStatusList();
  }, []);

  const fetchProgramTypes = async () => {
    try {
      // Replace with your actual API call
      setProgramTypes([
        { id: 1, name: "Certificate Program" },
        { id: 2, name: "Diploma Program" },
        { id: 3, name: "Advanced Diploma" },
        { id: 4, name: "Bachelor's Degree" },
        { id: 5, name: "Short Term Training" },
        { id: 6, name: "Vocational Training" },
      ]);
    } catch (error) {
      console.error("Error fetching program types:", error);
    }
  };

  const fetchStatusList = async () => {
    try {
      // Replace with your actual API call
      setStatusList([
        { id: 1, name: "Draft", color: "#ff9800" },
        { id: 2, name: "Submitted", color: "#2196f3" },
        { id: 3, name: "Under Review", color: "#9c27b0" },
        { id: 4, name: "Approved", color: "#4caf50" },
        { id: 5, name: "Rejected", color: "#f44336" },
      ]);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      // Replace with your actual API call
      const mockPrograms = [
        {
          id: 1,
          applicationNo: "PRG2024001",
          programName: "Web Development Certification",
          programType: "Certificate Program",
          duration: "6 months",
          durationType: "Months",
          totalHours: 480,
          fee: 25000,
          intakeCapacity: 30,
          startDate: "2024-07-01",
          endDate: "2024-12-31",
          statusId: 4,
          description: "Comprehensive web development program",
          targetAudience: "Fresh graduates and professionals",
          entryRequirement: "High School Certificate",
          assessmentMethod: "Project and Exam",
          certificationBody: "SES Bhutan",
          remarks: "Approved for 2024 batch",
          submittedAt: "2024-01-15",
        },
        {
          id: 2,
          applicationNo: "PRG2024002",
          programName: "Digital Marketing Diploma",
          programType: "Diploma Program",
          duration: "1 year",
          durationType: "Years",
          totalHours: 960,
          fee: 45000,
          intakeCapacity: 25,
          startDate: "2024-08-01",
          endDate: "2025-07-31",
          statusId: 2,
          description: "Digital marketing specialization",
          targetAudience: "Marketing professionals",
          entryRequirement: "Bachelor's Degree",
          assessmentMethod: "Exam and Practical",
          certificationBody: "SES Bhutan",
          remarks: "Under review",
          submittedAt: "2024-02-10",
        },
        {
          id: 3,
          applicationNo: "PRG2024003",
          programName: "Data Science Short Course",
          programType: "Short Term Training",
          duration: "3 months",
          durationType: "Months",
          totalHours: 240,
          fee: 15000,
          intakeCapacity: 20,
          startDate: "2024-06-01",
          endDate: "2024-08-31",
          statusId: 1,
          description: "Introduction to data science",
          targetAudience: "IT professionals",
          entryRequirement: "Basic programming knowledge",
          assessmentMethod: "Project based",
          certificationBody: "SES Bhutan",
          remarks: "Draft - pending submission",
          submittedAt: "2024-03-05",
        },
      ];
      setPrograms(mockPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to fetch program data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusName = (statusId) => {
    const status = statusList.find((s) => s.id === statusId);
    return status ? status.name : "Unknown";
  };

  const getStatusColor = (statusId) => {
    const status = statusList.find((s) => s.id === statusId);
    return status ? status.color : "#9e9e9e";
  };

  const getProgramTypeName = (typeId) => {
    const type = programTypes.find((t) => t.id === typeId);
    return type ? type.name : typeId;
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredPrograms = programs.filter(
    (p) =>
      (p.programName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.applicationNo?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.programType?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const handleView = (program) => {
    setSelectedProgram(program);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedProgram(null);
    setDialogMode("add");
    setOpenDialog(true);
  };

  const handleDelete = async (program) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${program.programName}"?`,
      )
    ) {
      try {
        // Replace with your actual API call
        setPrograms(programs.filter((p) => p.id !== program.id));
        toast.success("Program deleted successfully!");
      } catch (error) {
        console.error("Error deleting program:", error);
        toast.error("Failed to delete program");
      }
    }
  };

  // Get initial values based on mode
  const getInitialValues = () => {
    if ((dialogMode === "edit" || dialogMode === "view") && selectedProgram) {
      return {
        programName: selectedProgram.programName || "",
        programType: selectedProgram.programType || "",
        duration: selectedProgram.duration || "",
        durationType: selectedProgram.durationType || "Months",
        totalHours: selectedProgram.totalHours || "",
        fee: selectedProgram.fee || "",
        intakeCapacity: selectedProgram.intakeCapacity || "",
        startDate: selectedProgram.startDate || "",
        endDate: selectedProgram.endDate || "",
        description: selectedProgram.description || "",
        targetAudience: selectedProgram.targetAudience || "",
        entryRequirement: selectedProgram.entryRequirement || "",
        assessmentMethod: selectedProgram.assessmentMethod || "",
        certificationBody: selectedProgram.certificationBody || "",
        remarks: selectedProgram.remarks || "",
        files: [],
      };
    }
    return {
      programName: "",
      programType: "",
      duration: "",
      durationType: "Months",
      totalHours: "",
      fee: "",
      intakeCapacity: "",
      startDate: "",
      endDate: "",
      description: "",
      targetAudience: "",
      entryRequirement: "",
      assessmentMethod: "",
      certificationBody: "SES Bhutan",
      remarks: "",
      files: [],
    };
  };

  const validationSchema = Yup.object().shape({
    programName: Yup.string()
      .required("Program name is required")
      .max(200, "Program name must be at most 200 characters"),
    programType: Yup.string().required("Program type is required"),
    duration: Yup.number()
      .required("Duration is required")
      .positive("Duration must be positive")
      .typeError("Duration must be a valid number"),
    durationType: Yup.string().required("Duration type is required"),
    totalHours: Yup.number()
      .required("Total hours is required")
      .positive("Total hours must be positive")
      .typeError("Total hours must be a valid number"),
    fee: Yup.number()
      .required("Fee is required")
      .min(0, "Fee cannot be negative")
      .typeError("Fee must be a valid number"),
    intakeCapacity: Yup.number()
      .required("Intake capacity is required")
      .positive("Intake capacity must be positive")
      .typeError("Intake capacity must be a valid number"),
    startDate: Yup.string().required("Start date is required"),
    endDate: Yup.string()
      .required("End date is required")
      // FIXED: Use arrow function with context parameter instead of function()
      .test(
        "is-after-start",
        "End date must be after start date",
        (value, context) => {
          const { startDate } = context.parent;
          if (!startDate || !value) return true;
          return new Date(value) >= new Date(startDate);
        },
      ),
    description: Yup.string()
      .required("Description is required")
      .max(1000, "Description must be at most 1000 characters"),
    targetAudience: Yup.string().required("Target audience is required"),
    entryRequirement: Yup.string().required("Entry requirement is required"),
    assessmentMethod: Yup.string().required("Assessment method is required"),
    files: Yup.array().min(1, "Upload at least one document"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const submissionData = {
        ...values,
        documents: documents,
        applicationNo:
          dialogMode === "add"
            ? `PRG${new Date().getFullYear()}${String(programs.length + 1).padStart(4, "0")}`
            : selectedProgram?.applicationNo,
        statusId: dialogMode === "add" ? 1 : selectedProgram?.statusId,
        submittedAt: new Date().toISOString().split("T")[0],
        createdBy: actionId,
      };

      if (dialogMode === "add") {
        // Replace with your actual API call
        const newProgram = {
          id: programs.length + 1,
          ...submissionData,
        };
        setPrograms([newProgram, ...programs]);
        toast.success("Program registered successfully!");
        resetForm();
        setOpenDialog(false);
      } else if (dialogMode === "edit") {
        // Replace with your actual API call
        const updatedPrograms = programs.map((p) =>
          p.id === selectedProgram.id ? { ...p, ...submissionData } : p,
        );
        setPrograms(updatedPrograms);
        toast.success("Program updated successfully!");
        setOpenDialog(false);
      }
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("An error occurred while saving the program");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleReset = (resetForm) => {
    resetForm();
    toast.info("Form has been reset");
  };

  const durationTypes = [
    { id: "Weeks", name: "Weeks" },
    { id: "Months", name: "Months" },
    { id: "Years", name: "Years" },
  ];

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Program Registration
      </Typography>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Search by program name or application no"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ height: "36px" }}
          >
            Register Program
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Program Name</TableCell>
              <TableCell>Program Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Total Hours</TableCell>
              <TableCell align="center">Fee (Nu.)</TableCell>
              <TableCell align="center">Intake</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center" width={120}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrograms.length > 0 ? (
              filteredPrograms
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((program, index) => {
                  const statusName = getStatusName(program.statusId);
                  const statusColor = getStatusColor(program.statusId);

                  return (
                    <TableRow key={program.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        <Chip
                          label={program.applicationNo}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>{program.programName}</TableCell>
                      <TableCell>{program.programType}</TableCell>
                      <TableCell>
                        {program.duration} {program.durationType}
                      </TableCell>
                      <TableCell align="center">{program.totalHours}</TableCell>
                      <TableCell align="center">
                        {program.fee.toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        {program.intakeCapacity}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusName}
                          size="small"
                          sx={{
                            backgroundColor: statusColor,
                            color: "white",
                            fontWeight: "medium",
                            minWidth: "70px",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleView(program)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {program.statusId === 1 && (
                          <>
                            <IconButton
                              color="secondary"
                              size="small"
                              onClick={() => handleEdit(program)}
                              title="Edit Program"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(program)}
                              title="Delete Program"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "No data available in table"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPrograms.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">
              {dialogMode === "add"
                ? "Register New Program"
                : dialogMode === "edit"
                  ? "Edit Program Details"
                  : "Program Details"}
            </Typography>
          </Box>
        </DialogTitle>
        <Formik
          key={dialogMode + (selectedProgram?.id || "")}
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                {/* Basic Information Section */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Program Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Program Name"
                        name="programName"
                        size="small"
                        value={formik.values.programName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programName &&
                          Boolean(formik.errors.programName)
                        }
                        helperText={
                          formik.touched.programName &&
                          formik.errors.programName
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Program Type"
                        name="programType"
                        size="small"
                        value={formik.values.programType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programType &&
                          Boolean(formik.errors.programType)
                        }
                        helperText={
                          formik.touched.programType &&
                          formik.errors.programType
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {programTypes.map((type) => (
                          <MenuItem key={type.id} value={type.name}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Duration"
                        name="duration"
                        type="number"
                        size="small"
                        value={formik.values.duration}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.duration &&
                          Boolean(formik.errors.duration)
                        }
                        helperText={
                          formik.touched.duration && formik.errors.duration
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        select
                        fullWidth
                        label="Duration Type"
                        name="durationType"
                        size="small"
                        value={formik.values.durationType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.durationType &&
                          Boolean(formik.errors.durationType)
                        }
                        helperText={
                          formik.touched.durationType &&
                          formik.errors.durationType
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      >
                        {durationTypes.map((type) => (
                          <MenuItem key={type.id} value={type.name}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Total Hours"
                        name="totalHours"
                        type="number"
                        size="small"
                        value={formik.values.totalHours}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.totalHours &&
                          Boolean(formik.errors.totalHours)
                        }
                        helperText={
                          formik.touched.totalHours && formik.errors.totalHours
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Program Fee (Nu.)"
                        name="fee"
                        type="number"
                        size="small"
                        value={formik.values.fee}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.fee && Boolean(formik.errors.fee)}
                        helperText={formik.touched.fee && formik.errors.fee}
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Intake Capacity"
                        name="intakeCapacity"
                        type="number"
                        size="small"
                        value={formik.values.intakeCapacity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.intakeCapacity &&
                          Boolean(formik.errors.intakeCapacity)
                        }
                        helperText={
                          formik.touched.intakeCapacity &&
                          formik.errors.intakeCapacity
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        name="startDate"
                        type="date"
                        size="small"
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.startDate &&
                          Boolean(formik.errors.startDate)
                        }
                        helperText={
                          formik.touched.startDate && formik.errors.startDate
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="End Date"
                        name="endDate"
                        type="date"
                        size="small"
                        value={formik.values.endDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.endDate &&
                          Boolean(formik.errors.endDate)
                        }
                        helperText={
                          formik.touched.endDate && formik.errors.endDate
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Description & Requirements Section */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Program Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Program Description"
                        name="description"
                        size="small"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.description &&
                          Boolean(formik.errors.description)
                        }
                        helperText={
                          formik.touched.description &&
                          formik.errors.description
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Target Audience"
                        name="targetAudience"
                        size="small"
                        multiline
                        rows={2}
                        value={formik.values.targetAudience}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.targetAudience &&
                          Boolean(formik.errors.targetAudience)
                        }
                        helperText={
                          formik.touched.targetAudience &&
                          formik.errors.targetAudience
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Entry Requirements"
                        name="entryRequirement"
                        size="small"
                        multiline
                        rows={2}
                        value={formik.values.entryRequirement}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.entryRequirement &&
                          Boolean(formik.errors.entryRequirement)
                        }
                        helperText={
                          formik.touched.entryRequirement &&
                          formik.errors.entryRequirement
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Assessment Method"
                        name="assessmentMethod"
                        size="small"
                        multiline
                        rows={2}
                        value={formik.values.assessmentMethod}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.assessmentMethod &&
                          Boolean(formik.errors.assessmentMethod)
                        }
                        helperText={
                          formik.touched.assessmentMethod &&
                          formik.errors.assessmentMethod
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Certification Body"
                        name="certificationBody"
                        size="small"
                        value={formik.values.certificationBody}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Remarks"
                        name="remarks"
                        size="small"
                        multiline
                        rows={2}
                        value={formik.values.remarks}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Supporting Documents Section */}
                <Paper
                  sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Supporting Documents
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box
                    component="ol"
                    sx={{
                      pl: 3,
                      mb: 2,
                      "& li": {
                        fontSize: "0.85rem",
                        fontStyle: "italic",
                        mb: 0.5,
                      },
                    }}
                  >
                    <li>Program Curriculum / Syllabus</li>
                    <li>Trainer / Faculty Qualifications</li>
                    <li>Infrastructure and Facilities Document</li>
                    <li>Fee Structure Approval Letter</li>
                  </Box>
                  <FileUpload
                    files={formik.values.files}
                    onFilesChange={(files) =>
                      formik.setFieldValue("files", files)
                    }
                    disabled={dialogMode === "view"}
                    error={formik.touched.files && Boolean(formik.errors.files)}
                    helperText={formik.touched.files && formik.errors.files}
                  />
                </Paper>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => setOpenDialog(false)}
                  disabled={loading}
                >
                  {dialogMode === "view" ? "Close" : "Cancel"}
                </Button>
                {dialogMode !== "view" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => handleReset(formik.resetForm)}
                      startIcon={<RotateLeftIcon />}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading || formik.values.files.length === 0}
                    >
                      {loading
                        ? "Saving..."
                        : dialogMode === "add"
                          ? "Submit Registration"
                          : "Update"}
                    </Button>
                  </>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default ProgramRegistration;
