import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
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
import StudentEnrollmentService from "../../../api/services/internal/ses-center/StudentEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";

const GENDER_PARENT_ID = 8;
// School Level options = Academic Qualification master (same as the subject Class Level)
const ACADEMIC_QUALIFICATION_PARENT_ID = 18;

// Year dropdown: last 5 years to next year
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + 1 - i);

// Compact bordered table (same look as the Subject page)
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

const isError = (res) => res instanceof Error || res?.isAxiosError;
const listOf = (res) =>
  !isError(res) && Array.isArray(res?.data) ? res.data : [];

const RequiredLabel = ({ children }) => (
  <span>
    {children}
    <span style={{ color: "red", marginLeft: "4px" }}>*</span>
  </span>
);

RequiredLabel.propTypes = {
  children: PropTypes.node.isRequired,
};

const EMPTY_VALUES = {
  id: "",
  name: "",
  genderId: "",
  schoolLevelId: "",
  subjectId: "",
  enrollmentYear: CURRENT_YEAR,
};

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required("Name is required")
    .max(100, "Name must be at most 100 characters"),
  genderId: Yup.string().required("Gender is required"),
  schoolLevelId: Yup.string().required("School Level is required"),
  subjectId: Yup.string().required("Subject is required"),
  enrollmentYear: Yup.string().required("Year is required"),
});


const DIALOG_TITLES = { add: "Enrol Student", edit: "Edit Student" };

const submitLabel = (loading, dialogMode) => {
  if (loading) return "Saving...";
  return dialogMode === "add" ? "Enrol" : "Update";
};

const StudentEnrollmentIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [instituteId, setInstituteId] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [genders, setGenders] = useState([]);
  const [schoolLevels, setSchoolLevels] = useState([]);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add, edit, view
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // ---------- load ----------
  const fetchEnrollments = useCallback(
    async (instId) => {
      const res = await StudentEnrollmentService.getAllEnrollments(
        instId,
        access_token,
      );
      if (isError(res)) {
        toast.error("Failed to load students");
        return;
      }
      setEnrollments(listOf(res));
    },
    [access_token],
  );

  useEffect(() => {
    const load = async () => {
      setLoadingPage(true);
      const [detailsRes, genderRes, levelRes] = await Promise.all([
        InstituteRegistrationService.getInstituteDetails(registration_no),
        CommonService.getByParentId(GENDER_PARENT_ID),
        CommonService.getByParentId(ACADEMIC_QUALIFICATION_PARENT_ID),
      ]);
      setGenders(listOf(genderRes));
      setSchoolLevels(listOf(levelRes));

      const instId = listOf(detailsRes)[0]?.institute_id;
      if (!instId) {
        toast.error("Institute ID not found");
        setLoadingPage(false);
        return;
      }
      setInstituteId(instId);
      const subjectRes = await SubjectService.getAllSubjects(
        instId,
        access_token,
      );
      setAllSubjects(listOf(subjectRes));
      await fetchEnrollments(instId);
      setLoadingPage(false);
    };
    if (registration_no) load();
  }, [registration_no, access_token, fetchEnrollments]);

  // ---------- lookups ----------
  const nameOf = (list, id) =>
    list.find((x) => String(x.id) === String(id))?.name || "—";

  // Only approved subjects (57) can be chosen; no status = added before the subject workflow
  const approvedSubjects = useMemo(
    () =>
      allSubjects.filter(
        (s) =>
          !s.application_status_id || Number(s.application_status_id) === 57,
      ),
    [allSubjects],
  );

  const subjectLabel = (s) => {
    const level = s.class_level_id
      ? nameOf(schoolLevels, s.class_level_id)
      : "";
    return level && level !== "—"
      ? `${s.subject_name} (${level})`
      : s.subject_name;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter(
      (e) =>
        (yearFilter === "" || String(e.enrollment_year) === yearFilter) &&
        (q === "" ||
          (e.name || "").toLowerCase().includes(q) ||
          (e.subject_name || "").toLowerCase().includes(q)),
    );
  }, [enrollments, search, yearFilter]);

  // ---------- dialog ----------
  const openFor = (mode, row = null) => {
    setDialogMode(mode);
    setSelected(row);
    setOpenDialog(true);
  };

  const initialValues = selected
    ? {
        id: selected.id,
        name: selected.name || "",
        genderId: selected.gender_id ?? "",
        schoolLevelId: selected.school_level_id ?? "",
        subjectId: selected.subject_id ?? "",
        enrollmentYear: selected.enrollment_year ?? CURRENT_YEAR,
      }
    : EMPTY_VALUES;

  // keep the student's current subject selectable on edit/view even if it is no longer approved
  const subjectOptions = useMemo(() => {
    if (!selected?.subject_id) return approvedSubjects;
    const has = approvedSubjects.some(
      (s) => String(s.id) === String(selected.subject_id),
    );
    if (has) return approvedSubjects;
    const current = allSubjects.find(
      (s) => String(s.id) === String(selected.subject_id),
    ) || { id: selected.subject_id, subject_name: selected.subject_name };
    return [current, ...approvedSubjects];
  }, [approvedSubjects, allSubjects, selected]);

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }
    setLoading(true);
    const payload = {
      id: dialogMode === "edit" ? values.id : null,
      name: values.name.trim(),
      genderId: Number(values.genderId),
      schoolLevelId: Number(values.schoolLevelId),
      subjectId: Number(values.subjectId),
      enrollmentYear: Number(values.enrollmentYear),
      instituteId,
      createdBy: actionId,
      updatedBy: actionId,
    };
    const res =
      dialogMode === "add"
        ? await StudentEnrollmentService.submitEnrollment(payload, access_token)
        : await StudentEnrollmentService.updateEnrollment(
            payload,
            access_token,
          );
    setLoading(false);
    setSubmitting(false);

    if (isError(res) || res?.status >= 400) {
      toast.error(res?.response?.data?.message || "Failed to save the student");
      return;
    }
    toast.success(
      res?.data?.message ||
        (dialogMode === "add"
          ? "Student enrolled successfully"
          : "Student updated successfully"),
    );
    setOpenDialog(false);
    fetchEnrollments(instituteId);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    const res = await StudentEnrollmentService.deleteEnrollment(
      toDelete.id,
      access_token,
    );
    setLoading(false);
    if (isError(res) || res?.status >= 400) {
      toast.error(res?.response?.data?.message || "Failed to delete");
      return;
    }
    toast.success("Student deleted successfully");
    setToDelete(null);
    fetchEnrollments(instituteId);
  };

  if (loadingPage) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  const readOnly = dialogMode === "view";

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Student Enrollment
      </Typography>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Year"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Years</MenuItem>
            {YEARS.map((y) => (
              <MenuItem key={y} value={String(y)}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 8, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Search"
            placeholder="Search by Name or Subject"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => openFor("add")}
            sx={{ height: 36 }}
          >
            Add Student
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>School Level</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell align="center">Year</TableCell>
              <TableCell align="center" width={120}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{nameOf(genders, row.gender_id)}</TableCell>
                    <TableCell>
                      {nameOf(schoolLevels, row.school_level_id)}
                    </TableCell>
                    <TableCell>{row.subject_name || "—"}</TableCell>
                    <TableCell align="center">{row.enrollment_year}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => openFor("view", row)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="secondary"
                          size="small"
                          onClick={() => openFor("edit", row)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => setToDelete(row)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {enrollments.length === 0
                    ? "No students enrolled yet"
                    : "No students found matching your criteria"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(+e.target.value);
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Add / Edit / View */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {DIALOG_TITLES[dialogMode] || "Student Details"}
          <IconButton
            sx={{ position: "absolute", right: 8, top: 8 }}
            onClick={() => setOpenDialog(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Formik
          key={dialogMode + (selected?.id || "")}
          initialValues={initialValues}
          validationSchema={readOnly ? null : validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formik) => {
            const fieldProps = (name) => ({
              name,
              fullWidth: true,
              size: "small",
              value: formik.values[name],
              onChange: formik.handleChange,
              onBlur: formik.handleBlur,
              error: formik.touched[name] && Boolean(formik.errors[name]),
              helperText: formik.touched[name] && formik.errors[name],
              slotProps: { input: { readOnly } },
            });
            return (
              <Form>
                <DialogContent dividers>
                  <Paper
                    sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
                  >
                    <Typography fontWeight={600} gutterBottom>
                      Student Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          {...fieldProps("name")}
                          label={<RequiredLabel>Name</RequiredLabel>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          {...fieldProps("genderId")}
                          select
                          label={<RequiredLabel>Gender</RequiredLabel>}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {genders.map((g) => (
                            <MenuItem key={g.id} value={g.id}>
                              {g.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          {...fieldProps("schoolLevelId")}
                          select
                          label={<RequiredLabel>School Level</RequiredLabel>}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {schoolLevels.map((l) => (
                            <MenuItem key={l.id} value={l.id}>
                              {l.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          {...fieldProps("enrollmentYear")}
                          select
                          label={<RequiredLabel>Year</RequiredLabel>}
                        >
                          {YEARS.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          {...fieldProps("subjectId")}
                          select
                          label={<RequiredLabel>Subject</RequiredLabel>}
                          helperText={
                            (formik.touched.subjectId &&
                              formik.errors.subjectId) ||
                            (approvedSubjects.length === 0
                              ? "No approved subjects yet. Subjects must be approved before students can be enrolled."
                              : "")
                          }
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {subjectOptions.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {subjectLabel(s)}
                            </MenuItem>
                          ))}
                        </TextField>
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
                    {readOnly ? "Close" : "Cancel"}
                  </Button>
                  {!readOnly && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<RotateLeftIcon />}
                        onClick={() => formik.resetForm()}
                        disabled={loading}
                      >
                        Reset
                      </Button>
                      <Button
                        size="small"
                        type="submit"
                        variant="contained"
                        disabled={loading}
                      >
                        {submitLabel(loading, dialogMode)}
                      </Button>
                    </>
                  )}
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{toDelete?.name}&quot;?
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={() => setToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default StudentEnrollmentIndex;
