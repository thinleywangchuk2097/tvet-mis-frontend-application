import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import ModuleIcon from "@mui/icons-material/Extension";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import TotService from "../../../api/services/internal/tot/TotService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";

const CreateTotIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [programTypes, setProgramTypes] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [editingAnnouncementData, setEditingAnnouncementData] = useState(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteItemName, setDeleteItemName] = useState("");
  const [deleteType, setDeleteType] = useState("");

  // Module delete confirmation dialog state
  const [moduleDeleteDialogOpen, setModuleDeleteDialogOpen] = useState(false);
  const [moduleDeleteIndex, setModuleDeleteIndex] = useState(null);
  const [moduleDeleteName, setModuleDeleteName] = useState("");
  const [moduleDeleteFormik, setModuleDeleteFormik] = useState(null);

  const access_token = useSelector((state) => state.auth.accessToken);

  // Fetch dropdown options on component mount
  useEffect(() => {
    fetchProgramTypes();
    fetchStatusOptions();
  }, []);

  const fetchProgramTypes = async () => {
    try {
      const response = await CommonService.getByParentId(28);
      setProgramTypes(response.data);
    } catch (error) {
      console.error("Error fetching program types:", error);
      toast.error("Failed to load program types");
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await CommonService.getByParentId(29);
      setStatusOptions(response.data);
    } catch (error) {
      console.error("Error fetching status options:", error);
      toast.error("Failed to load status options");
    }
  };

  // Program management state
  const [programsData, setProgramsData] = useState([]);

  // Fetch programs and courses on component mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Fetch announcements whenever programsData changes
  useEffect(() => {
    if (programsData.length > 0) {
      fetchAnnouncements();
    }
  }, [programsData]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await TotService.getToTPrograms(access_token);
      console.log("Fetched programs:", response.data);

      const parsedPrograms = (response.data || []).map((program) => {
        let modules = [];
        try {
          if (typeof program.modules === "string") {
            modules = JSON.parse(program.modules);
          } else if (Array.isArray(program.modules)) {
            modules = program.modules;
          }
        } catch (e) {
          console.error("Error parsing modules for program:", program.id, e);
          modules = [];
        }

        return {
          ...program,
          modules: modules,
          totalModules: modules.length,
          programName: program.programName || program.program_name,
          programCode: program.programCode || program.program_code,
          programTypeId: program.program_type_id || program.programTypeId,
          statusId: program.statusId || program.status_id,
          createdAt: program.createdAt || program.created_at
        };
      });

      setProgramsData(parsedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response =
        await TotService.getToTProgramsAnnouncement(access_token);
      console.log("Fetched announcements:", response.data);

      const mappedAnnouncements = (response.data || []).map((item) => {
        const program = programsData.find(
          (p) => String(p.id) === String(item.program_id),
        );

        return {
          id: item.id,
          applicationNo: item.application_no || "N/A",
          programName:
            program?.programName || program?.program_name || "Unknown Program",
          programCode: program?.programCode || program?.program_code || "N/A",
          programTypeId: item.program_type_id,
          applicationStartDate: item.application_start_date,
          applicationEndDate: item.application_end_date,
          programStartDate: item.program_start_date,
          programEndDate: item.program_end_date,
          status: "Active",
          maxParticipants: item.max_participants,
          venue: item.venue,
          eligibilityCriteria: item.eligibility_criteria,
          remarks: item.remarks,
          programId: item.program_id,
        };
      });

      setAnnouncements(mappedAnnouncements);
      console.log("Mapped announcements:", mappedAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Delete confirmation dialog handlers
  const handleOpenDeleteDialog = (id, name, type) => {
    setDeleteItemId(id);
    setDeleteItemName(name);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteItemId(null);
    setDeleteItemName("");
    setDeleteType("");
  };

  const handleConfirmDelete = async () => {
    if (deleteType === "announcement") {
      await handleDeleteAnnouncement(deleteItemId);
    } else if (deleteType === "program") {
      await handleDeleteProgram(deleteItemId);
    }
    handleCloseDeleteDialog();
  };

  // Module delete confirmation dialog handlers
  const handleOpenModuleDeleteDialog = (index, moduleName, formik) => {
    setModuleDeleteIndex(index);
    setModuleDeleteName(moduleName);
    setModuleDeleteFormik(formik);
    setModuleDeleteDialogOpen(true);
  };

  const handleCloseModuleDeleteDialog = () => {
    setModuleDeleteDialogOpen(false);
    setModuleDeleteIndex(null);
    setModuleDeleteName("");
    setModuleDeleteFormik(null);
  };

  const handleConfirmModuleDelete = () => {
    if (moduleDeleteIndex !== null && moduleDeleteFormik) {
      const currentProgramTypeId = moduleDeleteFormik.values.programTypeId;

      if (
        currentProgramTypeId === 120 &&
        moduleDeleteFormik.values.modules.length <= 1
      ) {
        toast.error("Single Module programs must have at least one module");
        handleCloseModuleDeleteDialog();
        return;
      }

      const updatedModules = moduleDeleteFormik.values.modules.filter(
        (_, i) => i !== moduleDeleteIndex,
      );
      moduleDeleteFormik.setFieldValue("modules", updatedModules);
      toast.success("Module removed successfully");
      handleCloseModuleDeleteDialog();
    }
  };

  // Announcement Dialog handlers
  const handleOpenDialog = async (item = null) => {
    if (item) {
      setEditingId(item.id);
      const program = programsData.find(
        (p) => String(p.id) === String(item.programId),
      );
      setSelectedProgram(program);

      setEditingAnnouncementData({
        programId: item.programId,
        programName: item.programName,
        programCode: item.programCode,
        programTypeId: item.programTypeId,
        applicationStartDate: item.applicationStartDate,
        applicationEndDate: item.applicationEndDate,
        programStartDate: item.programStartDate,
        programEndDate: item.programEndDate,
        maxParticipants: item.maxParticipants,
        venue: item.venue || "",
        eligibilityCriteria: item.eligibilityCriteria || "",
        remarks: item.remarks || "",
        statusId: "122",
        modules: program?.modules || [],
        moduleName: program?.modules?.[0]?.moduleName || "",
        moduleDescription: program?.modules?.[0]?.description || "",
      });
    } else {
      setEditingId(null);
      setSelectedProgram(null);
      setEditingAnnouncementData(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setSelectedProgram(null);
    setEditingAnnouncementData(null);
  };

  // Program Dialog handlers
  const handleOpenProgramDialog = (program = null) => {
    if (program) {
      setEditingProgramId(program.id);
      setSelectedProgram(program);
    } else {
      setEditingProgramId(null);
      setSelectedProgram(null);
    }
    setOpenProgramDialog(true);
  };

  const handleCloseProgramDialog = () => {
    setOpenProgramDialog(false);
    setEditingProgramId(null);
    setSelectedProgram(null);
    setModuleDialogOpen(false);
    setEditingModuleIndex(null);
  };

  // Module Dialog handlers
  const handleModuleDialogOpen = (index = null) => {
    setEditingModuleIndex(index);
    setModuleDialogOpen(true);
  };

  const handleModuleDialogClose = () => {
    setModuleDialogOpen(false);
    setEditingModuleIndex(null);
  };

  const handleModuleSubmit = (moduleData, formik) => {
    const currentProgramTypeId = formik.values.programTypeId;

    if (
      currentProgramTypeId === 120 &&
      editingModuleIndex === null &&
      formik.values.modules.length >= 1
    ) {
      toast.error("Single Module programs can only have one module");
      return;
    }

    if (editingModuleIndex !== null) {
      const updatedModules = [...formik.values.modules];
      updatedModules[editingModuleIndex] = moduleData;
      formik.setFieldValue("modules", updatedModules);
    } else {
      const updatedModules = [...formik.values.modules, moduleData];
      formik.setFieldValue("modules", updatedModules);
    }
    handleModuleDialogClose();
  };

  const handleDeleteProgram = async (id) => {
    setLoading(true);
    try {
      await TotService.deleteTOTProgram(id, access_token);
      toast.success("Program deleted successfully!");
      await fetchPrograms();
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete program",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    setLoading(true);
    try {
      await TotService.deleteCourseAnnouncement(id, access_token);
      toast.success("Course announcement deleted successfully!");
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete announcement",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProgramTypeChangeForAnnouncement = (programTypeId, formik) => {
    formik.setFieldValue("programId", "");
    formik.setFieldValue("programName", "");
    formik.setFieldValue("programCode", "");
    formik.setFieldValue("programTypeId", programTypeId);
    formik.setFieldValue("modules", []);
  };

  const handleProgramChangeForAnnouncement = (programId, formik) => {
    const program = programsData.find(
      (p) => String(p.id) === String(programId),
    );
    setSelectedProgram(program);

    if (program) {
      formik.setFieldValue("programId", program.id);
      formik.setFieldValue("programName", program.programName);
      formik.setFieldValue("programCode", program.programCode);
      formik.setFieldValue("programTypeId", program.programTypeId);
      if (program.modules) {
        formik.setFieldValue("modules", program.modules);
      }
    }
  };

  const handleProgramChange = async (programId, formik) => {
    const program = programsData.find(
      (p) => String(p.id) === String(programId),
    );
    setSelectedProgram(program);

    if (program) {
      formik.setFieldValue("programId", program.id);
      formik.setFieldValue("programName", program.programName);
      formik.setFieldValue("programCode", program.programCode);
      formik.setFieldValue("programTypeId", program.programTypeId);
      if (program.modules) {
        formik.setFieldValue("modules", program.modules);
      }
    }
  };

  const requiredLabel = (label) => (
    <>
      {label}
      <span style={{ color: "red", marginLeft: "2px" }}>*</span>
    </>
  );

  const programInitialValues = {
    programName: "",
    programCode: "",
    programTypeId: "",
    description: "",
    modules: [],
    statusId: "",
  };

  const programValidationSchema = Yup.object().shape({
    programName: Yup.string().required("Program name is required"),
    programCode: Yup.string().required("Program code is required"),
    programTypeId: Yup.string().required("Program type is required"),
    description: Yup.string(),
    modules: Yup.array()
      .of(
        Yup.object().shape({
          moduleName: Yup.string().required("Module name is required"),
          moduleCode: Yup.string(),
          description: Yup.string(),
          duration: Yup.string(),
          prerequisites: Yup.string(),
          learningOutcomes: Yup.string(),
          order: Yup.number(),
        }),
      )
      .min(1, "At least one module is required")
      .test(
        "single-module-limit",
        "Single Module programs can only have one module",
        function (modules) {
          const programTypeId = this.parent.programTypeId;
          if (programTypeId === 120 && modules && modules.length > 1) {
            return false;
          }
          return true;
        },
      ),
  });

  const handleProgramSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    setSubmitting(true);
    try {
      const payload = {
        programName: values.programName,
        programCode: values.programCode,
        programTypeId: values.programTypeId,
        description: values.description,
        statusId: values.statusId,
        modules: values.modules.map((module, index) => ({
          moduleName: module.moduleName,
          moduleCode: module.moduleCode || "",
          description: module.description || "",
          duration: module.duration || "",
          prerequisites: module.prerequisites || "",
          learningOutcomes: module.learningOutcomes || "",
          moduleOrder: module.order || index + 1,
        })),
        total_modules: values.modules.length,
      };

      if (editingProgramId) {
        payload.id = editingProgramId;
      }

      console.log("Submitting program payload:", payload);

      const response = await TotService.submitTOTProgram(payload, access_token);

      if (response.status === 200 || response.status === 201) {
        await fetchPrograms();
        toast.success(
          editingProgramId
            ? "Program updated successfully!"
            : "Program created successfully!",
        );
        resetForm();
        handleCloseProgramDialog();
      } else {
        toast.error("Failed to submit program");
      }
    } catch (error) {
      console.error("Error submitting program:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit program",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const announcementInitialValues = {
    programId: "",
    programName: "",
    programCode: "",
    programTypeId: "",
    moduleName: "",
    moduleDescription: "",
    modules: [],
    applicationStartDate: "",
    applicationEndDate: "",
    programStartDate: "",
    programEndDate: "",
    maxParticipants: "",
    venue: "",
    eligibilityCriteria: "",
    remarks: "",
    statusId: "",
  };

  const announcementValidationSchema = Yup.object().shape({
    programTypeId: Yup.string().required("Program Type is required"),
    programId: Yup.string().required("Program is required"),
    programStartDate: Yup.date().required("Program Start Date is required"),
    programEndDate: Yup.date()
      .required("Program End Date is required")
      .min(Yup.ref("programStartDate"), "End date must be after start date"),
    applicationStartDate: Yup.date().required(
      "Application Start Date is required",
    ),
    applicationEndDate: Yup.date()
      .required("Application End Date is required")
      .min(
        Yup.ref("applicationStartDate"),
        "End date must be after start date",
      ),
    maxParticipants: Yup.string().required("Maximum participants is required"),
    venue: Yup.string().required("Venue is required"),
  });

  const handleAnnouncementSubmit = async (
    values,
    { resetForm, setSubmitting },
  ) => {
    setLoading(true);
    setSubmitting(true);
    try {
      const payload = {
        programId: values.programId,
        programName: values.programName,
        programCode: values.programCode,
        programTypeId: values.programTypeId,
        moduleName: values.moduleName,
        moduleDescription: values.moduleDescription,
        modules: values.modules || [],
        applicationStartDate: values.applicationStartDate,
        applicationEndDate: values.applicationEndDate,
        programStartDate: values.programStartDate,
        programEndDate: values.programEndDate,
        maxParticipants: values.maxParticipants,
        venue: values.venue,
        eligibilityCriteria: values.eligibilityCriteria,
        remarks: values.remarks,
        serviceId: 24,
        statusId: values.statusId || 122,
      };

      // If editing, include the ID in the payload
      if (editingId) {
        payload.id = editingId;
      }

      console.log("Submitting announcement payload:", payload);

      let response;
      if (editingId) {
        // Pass the payload with ID included, no need to pass editingId separately
        response = await TotService.submitTOTProgramAnnouncement(
          payload,
          access_token,
        );
      } else {
        response = await TotService.submitTOTProgramAnnouncement(
          payload,
          access_token,
        );
      }

      if (response.status === 200 || response.status === 201) {
        await fetchAnnouncements();
        toast.success(
          editingId
            ? "Course announcement updated successfully!"
            : "ToT course announced successfully!",
        );
        resetForm();
        handleCloseDialog();
      } else {
        toast.error("Failed to submit announcement");
      }
    } catch (error) {
      console.error("Error submitting announcement:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit announcement",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const filteredData = announcements.filter(
    (item) =>
      item.applicationNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.programName?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPrograms = programsData.filter(
    (program) =>
      program.programName?.toLowerCase().includes(search.toLowerCase()) ||
      program.programCode?.toLowerCase().includes(search.toLowerCase()) ||
      program.programTypeId?.toString().includes(search.toLowerCase()),
  );

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const getProgramTypeName = (programTypeId) => {
    const type = programTypes.find((t) => t.id === parseInt(programTypeId));
    return type ? type.name : "Unknown";
  };

  const getStatusName = (statusId) => {
    const status = statusOptions.find((s) => s.id === parseInt(statusId));
    return status ? status.name : "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const ModuleManagementDialog = ({ open, onClose, initialData, formik }) => {
    const [moduleData, setModuleData] = useState(
      initialData || {
        moduleName: "",
        moduleCode: "",
        description: "",
        duration: "",
        prerequisites: "",
        learningOutcomes: "",
        order: (formik?.values?.modules?.length || 0) + 1,
      },
    );

    useEffect(() => {
      if (initialData) {
        setModuleData(initialData);
      } else {
        setModuleData({
          moduleName: "",
          moduleCode: "",
          description: "",
          duration: "",
          prerequisites: "",
          learningOutcomes: "",
          order: (formik?.values?.modules?.length || 0) + 1,
        });
      }
    }, [initialData, formik?.values?.modules?.length]);

    const handleModuleChange = (field, value) => {
      setModuleData({ ...moduleData, [field]: value });
    };

    const handleSave = () => {
      if (!moduleData.moduleName) {
        toast.error("Module name is required");
        return;
      }
      handleModuleSubmit(moduleData, formik);
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingModuleIndex !== null ? "Edit Module" : "Add New Module"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={requiredLabel("Module Name")}
                value={moduleData.moduleName}
                onChange={(e) =>
                  handleModuleChange("moduleName", e.target.value)
                }
                size="small"
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Module Code"
                value={moduleData.moduleCode}
                onChange={(e) =>
                  handleModuleChange("moduleCode", e.target.value)
                }
                size="small"
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Duration"
                value={moduleData.duration}
                onChange={(e) => handleModuleChange("duration", e.target.value)}
                placeholder="e.g., 2 weeks, 40 hours"
                size="small"
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={moduleData.order}
                onChange={(e) =>
                  handleModuleChange("order", parseInt(e.target.value) || 0)
                }
                size="small"
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={moduleData.description}
                onChange={(e) =>
                  handleModuleChange("description", e.target.value)
                }
                size="small"
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Prerequisites"
                value={moduleData.prerequisites}
                onChange={(e) =>
                  handleModuleChange("prerequisites", e.target.value)
                }
                placeholder="List any prerequisites for this module"
                size="small"
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Learning Outcomes"
                value={moduleData.learningOutcomes}
                onChange={(e) =>
                  handleModuleChange("learningOutcomes", e.target.value)
                }
                placeholder="List the learning outcomes for this module"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleSave}
          >
            {editingModuleIndex !== null ? "Update Module" : "Add Module"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        TOT Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="TOT management tabs"
        >
          <Tab label="TOT Programs" />
          <Tab label="TOT Announcements" />
        </Tabs>
      </Box>

      {/* Tab 1: TOT Programs */}
      {tabValue === 0 && (
        <>
          <Grid
            container
            spacing={1}
            alignItems="center"
            sx={{ justifyContent: "flex-end", mb: 2 }}
          >
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label="Search by Program Name, Code, or Type"
                variant="outlined"
                size="small"
                fullWidth
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
                onClick={() => handleOpenProgramDialog()}
                sx={{ height: "36px" }}
              >
                Create Program
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={1}>
            <Table size="small" sx={tableStyle}>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Program Name</TableCell>
                  <TableCell>Program Code</TableCell>
                  <TableCell>Program Type</TableCell>
                  <TableCell>Modules</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : filteredPrograms.length > 0 ? (
                  filteredPrograms
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((program, index) => (
                      <TableRow key={program.id}>
                        <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {program.programName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {program.description}
                          </Typography>
                        </TableCell>
                        <TableCell>{program.programCode}</TableCell>
                        <TableCell>
                          <Chip
                            label={getProgramTypeName(program.programTypeId)}
                            color={
                              program.programTypeId === 121
                                ? "primary"
                                : "default"
                            }
                            size="small"
                            icon={
                              program.programTypeId === 121 ? (
                                <ModuleIcon />
                              ) : (
                                <SchoolIcon />
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${program.totalModules || program.modules?.length || 0} Modules`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusName(program.statusId)}
                            color={
                              program.statusId === 122
                                ? "success"
                                : program.statusId === 123
                                  ? "error"
                                  : "default"
                            }
                            size="small"
                            icon={
                              program.statusId === 122 ? (
                                <CheckCircleIcon />
                              ) : (
                                <CancelIcon />
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {program.createdAt
                            ? new Date(program.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Program">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenProgramDialog(program)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Program">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleOpenDeleteDialog(
                                  program.id,
                                  program.programName,
                                  "program",
                                )
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No TOT programs available. Click "Create Program" to add
                      one.
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
        </>
      )}

      {/* Tab 2: TOT Announcements */}
      {tabValue === 1 && (
        <>
          <Grid
            container
            spacing={1}
            alignItems="center"
            sx={{ justifyContent: "flex-end", mb: 2 }}
          >
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label="Search by Application No. or Program"
                variant="outlined"
                size="small"
                fullWidth
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
                onClick={() => handleOpenDialog()}
                sx={{ height: "36px" }}
              >
                Announce TOT
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={1}>
            <Table size="small" sx={tableStyle}>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Application No.</TableCell>
                  <TableCell>Program Name</TableCell>
                  <TableCell>Program Type</TableCell>
                  <TableCell>Application Start Date</TableCell>
                  <TableCell>Application End Date</TableCell>
                  <TableCell>Program Start Date</TableCell>
                  <TableCell>Program End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                        <TableCell>{item.applicationNo}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.programName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.programCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getProgramTypeName(item.programTypeId)}
                            color={
                              item.programTypeId === 121 ? "primary" : "default"
                            }
                            size="small"
                            icon={
                              item.programTypeId === 121 ? (
                                <ModuleIcon />
                              ) : (
                                <SchoolIcon />
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(item.applicationStartDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.applicationEndDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.programStartDate)}
                        </TableCell>
                        <TableCell>{formatDate(item.programEndDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || "Active"}
                            color={
                              item.status === "Active" ? "success" : "default"
                            }
                            size="small"
                            icon={
                              item.status === "Active" ? (
                                <CheckCircleIcon />
                              ) : (
                                <CancelIcon />
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(item)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleOpenDeleteDialog(
                                item.id,
                                item.applicationNo,
                                "announcement",
                              )
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No data available in table
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}

      {/* Delete Confirmation Dialog - for Programs and Announcements */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            {deleteType === "announcement" ? "announcement" : "program"} "
            {deleteItemName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            color="primary"
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            size="small"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Module Delete Confirmation Dialog */}
      <Dialog
        open={moduleDeleteDialogOpen}
        onClose={handleCloseModuleDeleteDialog}
      >
        <DialogTitle>Confirm Delete Module</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete module "{moduleDeleteName}"? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseModuleDeleteDialog}
            color="primary"
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmModuleDelete}
            color="error"
            variant="contained"
            size="small"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Edit TOT Announcement" : "Announce TOT Program"}
        </DialogTitle>
        <Formik
          initialValues={editingAnnouncementData || announcementInitialValues}
          validationSchema={announcementValidationSchema}
          onSubmit={handleAnnouncementSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{requiredLabel("Program Type")}</InputLabel>
                      <Select
                        name="programTypeId"
                        value={formik.values.programTypeId}
                        onChange={(e) => {
                          const value = e.target.value;
                          formik.handleChange(e);
                          handleProgramTypeChangeForAnnouncement(value, formik);
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programTypeId &&
                          Boolean(formik.errors.programTypeId)
                        }
                        label="Program Type *"
                        disabled={!!editingId}
                      >
                        <MenuItem value="">- Select Program Type -</MenuItem>
                        {programTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.programTypeId &&
                        formik.errors.programTypeId && (
                          <FormHelperText error>
                            {formik.errors.programTypeId}
                          </FormHelperText>
                        )}
                    </FormControl>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{requiredLabel("TOT Program")}</InputLabel>
                      <Select
                        name="programId"
                        value={formik.values.programId}
                        onChange={(e) => {
                          const value = e.target.value;
                          formik.handleChange(e);
                          handleProgramChangeForAnnouncement(value, formik);
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programId &&
                          Boolean(formik.errors.programId)
                        }
                        label="TOT Program *"
                        disabled={!formik.values.programTypeId || !!editingId}
                      >
                        <MenuItem value="">- Select Program -</MenuItem>
                        {programsData
                          .filter((p) => {
                            const programTypeId =
                              p.programTypeId || p.program_type_id;
                            const selectedTypeId = formik.values.programTypeId;
                            return (
                              String(programTypeId) === String(selectedTypeId)
                            );
                          })
                          .map((program) => (
                            <MenuItem key={program.id} value={program.id}>
                              {program.programName || program.program_name} (
                              {program.programCode || program.program_code})
                            </MenuItem>
                          ))}
                      </Select>
                      {formik.touched.programId && formik.errors.programId && (
                        <FormHelperText error>
                          {formik.errors.programId}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={requiredLabel("Application Start Date")}
                      name="applicationStartDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.applicationStartDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.applicationStartDate &&
                        Boolean(formik.errors.applicationStartDate)
                      }
                      helperText={
                        formik.touched.applicationStartDate &&
                        formik.errors.applicationStartDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={requiredLabel("Application End Date")}
                      name="applicationEndDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.applicationEndDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.applicationEndDate &&
                        Boolean(formik.errors.applicationEndDate)
                      }
                      helperText={
                        formik.touched.applicationEndDate &&
                        formik.errors.applicationEndDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={requiredLabel("Program Start Date")}
                      name="programStartDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.programStartDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.programStartDate &&
                        Boolean(formik.errors.programStartDate)
                      }
                      helperText={
                        formik.touched.programStartDate &&
                        formik.errors.programStartDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={requiredLabel("Program End Date")}
                      name="programEndDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.programEndDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.programEndDate &&
                        Boolean(formik.errors.programEndDate)
                      }
                      helperText={
                        formik.touched.programEndDate &&
                        formik.errors.programEndDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Maximum Participants")}
                      name="maxParticipants"
                      size="small"
                      value={formik.values.maxParticipants}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.maxParticipants &&
                        Boolean(formik.errors.maxParticipants)
                      }
                      helperText={
                        formik.touched.maxParticipants &&
                        formik.errors.maxParticipants
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Venue")}
                      name="venue"
                      size="small"
                      value={formik.values.venue}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.venue && Boolean(formik.errors.venue)
                      }
                      helperText={formik.touched.venue && formik.errors.venue}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Eligibility Criteria"
                      name="eligibilityCriteria"
                      size="small"
                      value={formik.values.eligibilityCriteria}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Remarks"
                      name="remarks"
                      size="small"
                      value={formik.values.remarks}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleCloseDialog}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || submitting || !formik.isValid}
                >
                  {loading || submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      {editingId ? "Updating..." : "Submitting..."}
                    </>
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Submit"
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Program Management Dialog */}
      <Dialog
        open={openProgramDialog}
        onClose={handleCloseProgramDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingProgramId ? "Edit TOT Program" : "Create TOT Program"}
        </DialogTitle>
        <Formik
          initialValues={
            editingProgramId && selectedProgram
              ? selectedProgram
              : programInitialValues
          }
          validationSchema={programValidationSchema}
          onSubmit={handleProgramSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Program Name")}
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
                        formik.touched.programName && formik.errors.programName
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Program Code")}
                      name="programCode"
                      size="small"
                      value={formik.values.programCode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.programCode &&
                        Boolean(formik.errors.programCode)
                      }
                      helperText={
                        formik.touched.programCode && formik.errors.programCode
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{requiredLabel("Program Type")}</InputLabel>
                      <Select
                        name="programTypeId"
                        value={formik.values.programTypeId}
                        onChange={(e) => {
                          formik.handleChange(e);
                          formik.setFieldValue("modules", []);
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programTypeId &&
                          Boolean(formik.errors.programTypeId)
                        }
                        label="Program Type *"
                      >
                        <MenuItem value="">Select Program Type</MenuItem>
                        {programTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.programTypeId &&
                        formik.errors.programTypeId && (
                          <FormHelperText error>
                            {formik.errors.programTypeId}
                          </FormHelperText>
                        )}
                    </FormControl>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="statusId"
                        value={formik.values.statusId || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Status"
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        {statusOptions.map((status) => (
                          <MenuItem key={status.id} value={status.id}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Program Description"
                      name="description"
                      size="small"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle1" color="primary">
                        Module Management
                      </Typography>
                    </Divider>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Modules: {formik.values.modules.length}
                        {formik.values.programTypeId === 120 && (
                          <Chip
                            label="Single Module (Max 1)"
                            size="small"
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          if (
                            formik.values.programTypeId === 120 &&
                            formik.values.modules.length >= 1
                          ) {
                            toast.error(
                              "Single Module programs can only have one module",
                            );
                            return;
                          }
                          handleModuleDialogOpen(null);
                        }}
                        disabled={
                          !formik.values.programTypeId ||
                          (formik.values.programTypeId === 120 &&
                            formik.values.modules.length >= 1)
                        }
                      >
                        Add Module
                      </Button>
                    </Box>

                    {formik.values.modules.length === 0 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No modules added yet. Click "Add Module" to create
                        modules for this program.
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small" sx={tableStyle}>
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>
                                {requiredLabel("Module Name")}
                              </TableCell>
                              <TableCell>Module Code</TableCell>
                              <TableCell>Duration</TableCell>
                              <TableCell>Prerequisites</TableCell>
                              <TableCell>Learning Outcomes</TableCell>
                              <TableCell align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {formik.values.modules.map((module, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {module.order || index + 1}
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {module.moduleName || "Untitled Module"}
                                  </Typography>
                                  {formik.values.programTypeId === 120 && (
                                    <Chip
                                      label="Single Module"
                                      size="small"
                                      color="info"
                                      sx={{ mt: 0.5 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {module.moduleCode || "-"}
                                </TableCell>
                                <TableCell>{module.duration || "-"}</TableCell>
                                <TableCell>
                                  {module.prerequisites || "-"}
                                </TableCell>
                                <TableCell>
                                  {module.learningOutcomes || "-"}
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Edit Module">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        handleModuleDialogOpen(index)
                                      }
                                      sx={{ mr: 1 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Module">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleOpenModuleDeleteDialog(
                                          index,
                                          module.moduleName ||
                                            "Untitled Module",
                                          formik,
                                        )
                                      }
                                      disabled={
                                        formik.values.programTypeId === 120 &&
                                        formik.values.modules.length <= 1
                                      }
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
                    )}
                  </Grid>
                </Grid>

                <ModuleManagementDialog
                  open={moduleDialogOpen}
                  onClose={handleModuleDialogClose}
                  initialData={
                    editingModuleIndex !== null
                      ? formik.values.modules[editingModuleIndex]
                      : null
                  }
                  formik={formik}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleCloseProgramDialog}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || submitting || !formik.isValid}
                >
                  {loading || submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      {editingProgramId ? "Updating..." : "Creating..."}
                    </>
                  ) : editingProgramId ? (
                    "Update Program"
                  ) : (
                    "Create Program"
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CreateTotIndex;
