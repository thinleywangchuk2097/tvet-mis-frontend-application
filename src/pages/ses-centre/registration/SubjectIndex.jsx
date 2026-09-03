import { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";

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

// ==================== PROPTYPES ====================

const requiredLabelPropTypes = {
  children: PropTypes.node.isRequired,
};

// ==================== COMPONENTS ====================

// Custom styled component for required field label
const RequiredLabel = ({ children }) => (
  <span>
    {children}
    <span style={{ color: "red", marginLeft: "4px" }}>*</span>
  </span>
);

RequiredLabel.propTypes = requiredLabelPropTypes;

// Status list constant
const STATUS_LIST = [
  { id: 1, name: "Active" },
  { id: 0, name: "Inactive" },
];

const SubjectIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add, edit, view
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instituteId, setInstituteId] = useState(null);
  const [isInstituteLoaded, setIsInstituteLoaded] = useState(false);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Fetch institute details on component mount
  useEffect(() => {
    fetchInstituteDetails();
  }, []);

  // Fetch subjects when instituteId is available
  useEffect(() => {
    if (instituteId) {
      fetchSubjects();
    }
  }, [instituteId]);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instId = response.data[0]?.institute_id;
      if (instId) {
        console.log("Fetched Institute ID:", instId);
        setInstituteId(instId);
      } else {
        toast.error("Institute ID not found");
      }
      setIsInstituteLoaded(true);
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to fetch institute details");
      setIsInstituteLoaded(true);
    }
  };

  // Helper function to map snake_case to camelCase
  const mapSubjectData = (subject) => ({
    id: subject.id,
    subjectCode: subject.subject_code,
    subjectName: subject.subject_name,
    creditHours: subject.credit_hours,
    theoryHours: subject.theory_hours,
    practicalHours: subject.practical_hours,
    statusId: subject.status_id ? parseInt(subject.status_id) : 1,
    description: subject.description,
    instituteId: subject.institute_id,
    createdBy: subject.created_by,
    createdAt: subject.created_at,
    updatedBy: subject.updated_by,
    updatedAt: subject.updated_at,
  });

  const fetchSubjects = async () => {
    if (!instituteId) {
      console.warn("Institute ID not available yet");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching subjects with Institute ID:", instituteId);
      const response = await SubjectService.getAllSubjects(
        instituteId,
        access_token,
      );
      console.log("Fetch Subjects Response:", response);

      // Handle response - map snake_case to camelCase
      if (response && response.data) {
        // If response.data is an array, map each subject
        const subjectsData = Array.isArray(response.data)
          ? response.data.map(mapSubjectData)
          : [];
        setSubjects(subjectsData);
        console.log("Mapped subjects:", subjectsData);
        if (subjectsData.length === 0) {
          toast.info("No subjects found");
        }
      } else {
        setSubjects([]);
        toast.warning("No subjects found");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error(error.response?.data?.message || "Failed to fetch subjects");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusName = (statusId) => {
    const status = STATUS_LIST.find((s) => s.id === statusId);
    return status
      ? status.name
      : statusId === 1
        ? "Active"
        : statusId === 0
          ? "Inactive"
          : "Unknown";
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1:
        return "#4caf50"; // Active - Green
      case 0:
        return "#f44336"; // Inactive - Red
      default:
        return "#9e9e9e"; // Grey
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      (s.subjectName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.subjectCode?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const handleView = (subject) => {
    setSelectedSubject(subject);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedSubject(null);
    setDialogMode("add");
    setOpenDialog(true);
  };

  // Delete handlers
  const handleDeleteClick = (subject) => {
    setSubjectToDelete(subject);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;

    setLoading(true);
    try {
      const response = await SubjectService.deleteSubject(
        subjectToDelete.id,
        access_token,
      );

      // Handle response based on status
      if (response && response.status === 200) {
        const responseData = response.data;
        // Check if response has status field
        if (responseData?.status === "SUCCESS") {
          toast.success(
            responseData?.message || "Subject deleted successfully!",
          );
        } else {
          toast.success("Subject deleted successfully!");
        }
        await fetchSubjects(); // Refresh the list
      } else {
        toast.error(response?.data?.message || "Failed to delete subject");
      }
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error(error.response?.data?.message || "Failed to delete subject");
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSubjectToDelete(null);
  };

  // Get initial values based on mode
  const getInitialValues = () => {
    if ((dialogMode === "edit" || dialogMode === "view") && selectedSubject) {
      return {
        id: selectedSubject.id || "",
        subjectCode: selectedSubject.subjectCode || "",
        subjectName: selectedSubject.subjectName || "",
        creditHours: selectedSubject.creditHours || "",
        theoryHours: selectedSubject.theoryHours || "",
        practicalHours: selectedSubject.practicalHours || "",
        statusId:
          selectedSubject.statusId !== undefined ? selectedSubject.statusId : 1,
        description: selectedSubject.description || "",
      };
    }
    return {
      id: "",
      subjectCode: "",
      subjectName: "",
      creditHours: "",
      theoryHours: "",
      practicalHours: "",
      statusId: 1,
      description: "",
    };
  };

  const validationSchema = Yup.object().shape({
    subjectCode: Yup.string()
      .required("Subject Code is required")
      .max(20, "Subject Code must be at most 20 characters"),
    subjectName: Yup.string()
      .required("Subject Name is required")
      .max(100, "Subject Name must be at most 100 characters"),
    creditHours: Yup.number()
      .required("Credit Hours is required")
      .positive("Credit Hours must be a positive number")
      .max(10, "Credit Hours cannot exceed 10")
      .typeError("Credit Hours must be a valid number"),
    theoryHours: Yup.number()
      .required("Theory Hours is required")
      .min(0, "Theory Hours cannot be negative")
      .typeError("Theory Hours must be a valid number"),
    practicalHours: Yup.number()
      .required("Practical Hours is required")
      .min(0, "Practical Hours cannot be negative")
      .typeError("Practical Hours must be a valid number"),
    description: Yup.string().max(
      500,
      "Description must be at most 500 characters",
    ),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API with camelCase field names (the backend will handle mapping)
      const payload = {
        id: dialogMode === "edit" ? values.id : null,
        subjectCode: values.subjectCode,
        subjectName: values.subjectName,
        creditHours: values.creditHours.toString(),
        theoryHours: values.theoryHours.toString(),
        practicalHours: values.practicalHours.toString(),
        statusId: parseInt(values.statusId),
        description: values.description || "",
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
      };

      let response;

      if (dialogMode === "add") {
        response = await SubjectService.submitSubject(payload, access_token);
        console.log("Submit Response:", response);

        // Handle response for add operation
        if (response && response.status === 201) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Subject created successfully!",
            );
            resetForm();
            setOpenDialog(false);
            await fetchSubjects(); // Refresh the list
          } else {
            toast.error(responseData?.message || "Failed to create subject");
          }
        } else if (response && response.status === 200) {
          // Fallback for 200 status
          toast.success(
            response.data?.message || "Subject created successfully!",
          );
          resetForm();
          setOpenDialog(false);
          await fetchSubjects();
        } else {
          toast.error(response?.data?.message || "Failed to create subject");
        }
      } else if (dialogMode === "edit") {
        response = await SubjectService.updateSubject(payload, access_token);
        console.log("Update Response:", response);

        // Handle response for update operation
        if (response && response.status === 200) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message || "Subject updated successfully!",
            );
          } else {
            toast.success("Subject updated successfully!");
          }
          setOpenDialog(false);
          await fetchSubjects(); // Refresh the list
        } else {
          toast.error(response?.data?.message || "Failed to update subject");
        }
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      // Handle different error scenarios
      if (error.response?.status === 409) {
        toast.error(
          error.response?.data?.message || "Subject name already exists!",
        );
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || "Subject not found!");
      } else {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while saving the subject",
        );
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleReset = (resetForm) => {
    resetForm();
    toast.info("Form has been reset");
  };

  // Show loading while fetching institute details
  if (!isInstituteLoaded) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading institute details...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Subject Management
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
            placeholder="Search by Subject Name or Code"
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
            Add Subject
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={60}>#</TableCell>
              <TableCell>Subject Code</TableCell>
              <TableCell>Subject Name</TableCell>
              <TableCell align="center">Credit Hours</TableCell>
              <TableCell align="center">Theory Hours</TableCell>
              <TableCell align="center">Practical Hours</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center" width={120}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((subject, index) => {
                  const statusName = getStatusName(subject.statusId);
                  const statusColor = getStatusColor(subject.statusId);

                  return (
                    <TableRow key={subject.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        <Chip
                          label={subject.subjectCode}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>{subject.subjectName}</TableCell>
                      <TableCell align="center">
                        {subject.creditHours}
                      </TableCell>
                      <TableCell align="center">
                        {subject.theoryHours}
                      </TableCell>
                      <TableCell align="center">
                        {subject.practicalHours}
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
                            "& .MuiChip-label": {
                              px: 1.5,
                              py: 0.5,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleView(subject)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Subject">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => handleEdit(subject)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Subject">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(subject)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
          count={filteredSubjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit/View Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add New Subject"
            : dialogMode === "edit"
              ? "Edit Subject"
              : "Subject Details"}
          <IconButton
            sx={{ position: "absolute", right: 8, top: 8 }}
            onClick={() => setOpenDialog(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Formik
          key={dialogMode + (selectedSubject?.id || "")}
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Paper
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Subject Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Subject Code</RequiredLabel>}
                        name="subjectCode"
                        size="small"
                        value={formik.values.subjectCode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.subjectCode &&
                          Boolean(formik.errors.subjectCode)
                        }
                        helperText={
                          formik.touched.subjectCode &&
                          formik.errors.subjectCode
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
                        label={<RequiredLabel>Subject Name</RequiredLabel>}
                        name="subjectName"
                        size="small"
                        value={formik.values.subjectName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.subjectName &&
                          Boolean(formik.errors.subjectName)
                        }
                        helperText={
                          formik.touched.subjectName &&
                          formik.errors.subjectName
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
                        label={<RequiredLabel>Credit Hours</RequiredLabel>}
                        name="creditHours"
                        type="number"
                        size="small"
                        value={formik.values.creditHours}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.creditHours &&
                          Boolean(formik.errors.creditHours)
                        }
                        helperText={
                          formik.touched.creditHours &&
                          formik.errors.creditHours
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 0, step: 0.5 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Theory Hours</RequiredLabel>}
                        name="theoryHours"
                        type="number"
                        size="small"
                        value={formik.values.theoryHours}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.theoryHours &&
                          Boolean(formik.errors.theoryHours)
                        }
                        helperText={
                          formik.touched.theoryHours &&
                          formik.errors.theoryHours
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={<RequiredLabel>Practical Hours</RequiredLabel>}
                        name="practicalHours"
                        type="number"
                        size="small"
                        value={formik.values.practicalHours}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.practicalHours &&
                          Boolean(formik.errors.practicalHours)
                        }
                        helperText={
                          formik.touched.practicalHours &&
                          formik.errors.practicalHours
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Status"
                        name="statusId"
                        size="small"
                        value={formik.values.statusId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.statusId &&
                          Boolean(formik.errors.statusId)
                        }
                        helperText={
                          formik.touched.statusId && formik.errors.statusId
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      >
                        {STATUS_LIST.map((status) => (
                          <MenuItem key={status.id} value={status.id}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Description"
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
                  </Grid>
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
                      disabled={loading}
                    >
                      {loading
                        ? "Saving..."
                        : dialogMode === "add"
                          ? "Create"
                          : "Update"}
                    </Button>
                  </>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{subjectToDelete?.subjectName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleCancelDelete}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            size="small"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
SubjectIndex.propTypes = {};

export default SubjectIndex;
