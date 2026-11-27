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
import CommonService from "../../../api/services/internal/common/CommonService";

// Class Level options = Academic Qualification master (dropdown parent 18)
const ACADEMIC_QUALIFICATION_PARENT_ID = 18;

// Add Subject workflow status (service 56); no status = added before the workflow
const APPLICATION_STATUS = {
  55: { label: "Submitted", color: "info" },
  56: { label: "Verified", color: "primary" },
  57: { label: "Approved", color: "success" },
  58: { label: "Rejected", color: "error" },
};

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
  const [classLevels, setClassLevels] = useState([]);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Fetch institute details on component mount
  useEffect(() => {
    fetchInstituteDetails();
    CommonService.getByParentId(ACADEMIC_QUALIFICATION_PARENT_ID).then(
      (res) => {
        if (!(res instanceof Error) && !res?.isAxiosError) {
          setClassLevels(Array.isArray(res?.data) ? res.data : []);
        }
      },
    );
  }, []);

  const getClassLevelName = (id) =>
    classLevels.find((c) => String(c.id) === String(id))?.name || "—";

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
    applicationNo: subject.application_no,
    applicationStatusId: subject.application_status_id
      ? Number(subject.application_status_id)
      : null,
    subjectName: subject.subject_name,
    classLevelId: subject.class_level_id ?? "",
    totalDurationHours: subject.total_duration_hours ?? "",
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

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      (s.subjectName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      getClassLevelName(s.classLevelId)
        .toLowerCase()
        .includes(search.toLowerCase()),
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
        subjectName: selectedSubject.subjectName || "",
        classLevelId: selectedSubject.classLevelId ?? "",
        totalDurationHours: selectedSubject.totalDurationHours ?? "",
        description: selectedSubject.description || "",
      };
    }
    return {
      id: "",
      subjectName: "",
      classLevelId: "",
      totalDurationHours: "",
      description: "",
    };
  };

  const validationSchema = Yup.object().shape({
    subjectName: Yup.string()
      .required("Subject Name is required")
      .max(100, "Subject Name must be at most 100 characters"),
    classLevelId: Yup.string().required("Class Level is required"),
    totalDurationHours: Yup.number()
      .required("Total Duration is required")
      .integer("Total Duration must be whole hours")
      .positive("Total Duration must be greater than 0")
      .typeError("Total Duration must be a valid number"),
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
        subjectName: values.subjectName,
        classLevelId: Number(values.classLevelId),
        totalDurationHours: Number(values.totalDurationHours),
        statusId: 1,
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
            placeholder="Search by Subject Name or Class Level"
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
              <TableCell>Subject Name</TableCell>
              <TableCell>Class Level</TableCell>
              <TableCell align="center">Total Duration (Hours)</TableCell>
              <TableCell>Description</TableCell>
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
                  return (
                    <TableRow key={subject.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{subject.subjectName}</TableCell>
                      <TableCell>
                        {getClassLevelName(subject.classLevelId)}
                      </TableCell>
                      <TableCell align="center">
                        {subject.totalDurationHours || "—"}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 320,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={subject.description || ""}
                      >
                        {subject.description || "—"}
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const st =
                            APPLICATION_STATUS[subject.applicationStatusId];
                          return st ? (
                            <Chip
                              size="small"
                              label={st.label}
                              color={st.color}
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.72rem" }}
                            />
                          ) : (
                            "—"
                          );
                        })()}
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
                <TableCell colSpan={7} align="center">
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
                    <Grid item size={{ xs: 12, md: 4 }}>
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
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={<RequiredLabel>Class Level</RequiredLabel>}
                        name="classLevelId"
                        size="small"
                        value={formik.values.classLevelId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.classLevelId &&
                          Boolean(formik.errors.classLevelId)
                        }
                        helperText={
                          formik.touched.classLevelId &&
                          formik.errors.classLevelId
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {classLevels.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <RequiredLabel>Total Duration (Hours)</RequiredLabel>
                        }
                        name="totalDurationHours"
                        type="number"
                        size="small"
                        value={formik.values.totalDurationHours}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.totalDurationHours &&
                          Boolean(formik.errors.totalDurationHours)
                        }
                        helperText={
                          formik.touched.totalDurationHours &&
                          formik.errors.totalDurationHours
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                          htmlInput: { min: 1, step: 1 },
                        }}
                      />
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
