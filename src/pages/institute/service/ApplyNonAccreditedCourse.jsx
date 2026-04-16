import { useState, useEffect } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUplaod";
import ApplyNonAccreditedCourseService from "../../../api/services/ApplyNonAccreditedCourseService";
import CommonService from "../../../api/services/CommonService";
import CurriculumEndorsementIndexService from "../../../api/services/CurriculumEndorsementIndexService";
import InstituteRegistrationService from "../../../api/services/InstituteRegistrationService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

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

const ApplyNonAccreditedCourse = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAdd, setOpenAdd] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCurriculumTypes();
    fetchCertificateLevels();
    fetchInstituteDetails();
  }, []);

  // Fetch courses after curriculumTypes is loaded
  useEffect(() => {
    if (curriculumTypes.length > 0) {
      fetchNonAccreditedCourseDetails();
    }
  }, [curriculumTypes]);

  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(10);
      setCertificateLevels(response.data);
      console.log("Certificate Levels:", response.data);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instituteData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setInstituteDetails(instituteData);
      console.log("Institute Details:", instituteData);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchCurriculumTypes = async () => {
    try {
      const response =
        await CurriculumEndorsementIndexService.getApprovedCurriculumDataByUserId(
          registration_no,
          42,
          access_token,
        );
      setCurriculumTypes(response.data);
      console.log("Curriculum Types:", response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchNonAccreditedCourseDetails = async () => {
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedCourseDetailsByUserId(
          registration_no,
          access_token,
        );
      console.log("Non-Accredited Course Details:", response.data);

      if (response.data && Array.isArray(response.data)) {
        const transformedCourses = response.data.map((item, index) => {
          // Find curriculum type name from curriculumTypes state
          const curriculumType = curriculumTypes.find(
            (type) =>
              type.curriculum_type_id == item.curriculum_type_id ||
              type.id == item.curriculum_type_id,
          );

          return {
            id: item.id || index + 1,
            courseTitle: item.course_title || "",
            theoryHour: item.theory_hour || 0,
            practicalHour: item.practical_hour || 0,
            ojtHour: item.ojt_hour || 0,
            feesPerTrainee: item.fees_per_trainee || 0,
            enrolmentCapacity: item.enrolment_capacity || 0,
            certificateLevelId: item.certificate_level_id || "",
            curriculumTypeId: item.curriculum_type_id || "",
            curriculumTypeName:
              curriculumType?.curriculum_name || item.curriculum_type_id,
            attachment: item.attachment || "",
            application_no: item.application_no || "",
          };
        });
        setCourses(transformedCourses);
      }
    } catch (error) {
      console.error("Error fetching non-accredited course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredCourses = courses.filter((c) =>
    c.courseTitle?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleView = (course) => {
    setSelectedCourse(course);
    setOpenView(true);
  };

  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const courseToDelete = courses[deleteIndex];
      // Uncomment if you have delete API endpoint
      // await ApplyNonAccreditedCourseService.deleteNonAccreditedCourse(courseToDelete.id, access_token);

      const updated = courses.filter((_, i) => i !== deleteIndex);
      setCourses(updated);
      toast.success("Course deleted successfully!");
      setOpenDelete(false);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const initialValues = {
    instituteName: instituteDetails?.proposed_institute_name || "",
    registrationNo: instituteDetails?.registration_no || "",
    courseTitle: "",
    theoryHour: "",
    practicalHour: "",
    ojtHour: "",
    feesPerTrainee: "",
    enrolmentCapacity: "",
    certificateLevelId: "",
    curriculumTypeId: "",
    files: [],
  };

  const validationSchema = Yup.object().shape({
    courseTitle: Yup.string().required("Course Title is required"),
    theoryHour: Yup.number()
      .required("Theory hours are required")
      .positive("Must be positive"),
    practicalHour: Yup.number()
      .required("Practical hours are required")
      .positive("Must be positive"),
    ojtHour: Yup.number()
      .required("OJT hours are required")
      .positive("Must be positive"),
    feesPerTrainee: Yup.number()
      .required("Fee is required")
      .positive("Must be positive"),
    enrolmentCapacity: Yup.number()
      .required("Capacity is required")
      .positive("Must be positive")
      .integer("Must be a whole number"),
    certificateLevelId: Yup.string().required("Certificate level is required"),
    curriculumTypeId: Yup.string().required("Curriculum type is required"),
    files: Yup.array().min(1, "Please upload supporting documents"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const selectedCurriculum = curriculumTypes.find(
        (t) =>
          t.curriculum_type_id == values.curriculumTypeId ||
          t.id == values.curriculumTypeId,
      );

      const payload = {
        courseTitle: values.courseTitle,
        applicantName: values.instituteName,
        theoryHour: parseInt(values.theoryHour),
        practicalHour: parseInt(values.practicalHour),
        ojtHour: parseInt(values.ojtHour),
        feesPerTrainee: parseInt(values.feesPerTrainee),
        enrolmentCapacity: parseInt(values.enrolmentCapacity),
        certificateLevelId: values.certificateLevelId,
        curriculumTypeId: values.curriculumTypeId,
        instituteId: instituteDetails?.institute_id || "",
        serviceId: 13,
        assignedRoleId: 7,
        statusId: 55,
        createdBy: actionId,
        documents: documents,
      };

      console.log("Submitting payload:", payload);
      const response =
        await ApplyNonAccreditedCourseService.submitNonAccreditedCourse(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        const newCourse = {
          id: response.data?.id || courses.length + 1,
          courseTitle: values.courseTitle,
          theoryHour: parseInt(values.theoryHour),
          practicalHour: parseInt(values.practicalHour),
          ojtHour: parseInt(values.ojtHour),
          feesPerTrainee: parseInt(values.feesPerTrainee),
          enrolmentCapacity: parseInt(values.enrolmentCapacity),
          certificateLevelId: values.certificateLevelId,
          curriculumTypeId: values.curriculumTypeId,
          curriculumTypeName:
            selectedCurriculum?.curriculum_name || values.curriculumTypeId,
          attachment: values.files.map((file) => file.name).join(", "),
        };

        setCourses([...courses, newCourse]);
        toast.success("Course submitted successfully!");
        resetForm();
        setOpenAdd(false);

        // Refresh the list from API
        await fetchNonAccreditedCourseDetails();
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error("Failed to submit course");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const getCertificateLevelName = (levelId) => {
    const level = certificateLevels.find((l) => l.id == levelId);
    return (
      level?.name || level?.value || level?.certificate_level_name || levelId
    );
  };

  const getCurriculumTypeName = (curriculumTypeId) => {
    if (!curriculumTypeId) return "-";
    const curriculum = curriculumTypes.find(
      (type) =>
        type.curriculum_type_id == curriculumTypeId ||
        type.id == curriculumTypeId,
    );
    return curriculum?.curriculum_name || curriculumTypeId;
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Add Non-Accredited Course
      </Typography>

      {/* Search + Add Button */}
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
            onClick={() => setOpenAdd(true)}
            sx={{ height: "36px" }}
          >
            Add Course
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Course Title</TableCell>
              <TableCell>Course Fee (RM)</TableCell>
              <TableCell>Theory (Hrs)</TableCell>
              <TableCell>Practical (Hrs)</TableCell>
              <TableCell>OJT (Hrs)</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Curriculum Type</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => (
                  <TableRow key={course.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{course.application_no || "-"}</TableCell>
                    <TableCell>{course.courseTitle}</TableCell>
                    <TableCell>{course.feesPerTrainee}</TableCell>
                    <TableCell>{course.theoryHour}</TableCell>
                    <TableCell>{course.practicalHour}</TableCell>
                    <TableCell>{course.ojtHour}</TableCell>
                    <TableCell>
                      {getCertificateLevelName(course.certificateLevelId)}
                    </TableCell>
                    <TableCell>
                      {getCurriculumTypeName(course.curriculumTypeId)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleView(course)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: "error.main",
                          "&:hover": { backgroundColor: "#ffebee" },
                        }}
                        onClick={() =>
                          handleDeleteClick(index + page * rowsPerPage)
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
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* View Course Dialog */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Course Details</DialogTitle>
        <DialogContent dividers>
          {selectedCourse && (
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Name of Training Provider/Institution"
                  size="small"
                  value={instituteDetails?.proposed_institute_name || ""}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Registration No"
                  size="small"
                  value={instituteDetails?.registration_no || ""}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Application No"
                  size="small"
                  value={selectedCourse.application_no || "-"}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Course Title"
                  size="small"
                  value={selectedCourse.courseTitle}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Theory (Hours)"
                  size="small"
                  value={selectedCourse.theoryHour}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Practical (Hours)"
                  size="small"
                  value={selectedCourse.practicalHour}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="OJT (Hours)"
                  size="small"
                  value={selectedCourse.ojtHour}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Fees per trainee (RM)"
                  size="small"
                  value={selectedCourse.feesPerTrainee}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Enrollment capacity per batch"
                  size="small"
                  value={selectedCourse.enrolmentCapacity}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Certificate Level"
                  size="small"
                  value={getCertificateLevelName(
                    selectedCourse.certificateLevelId,
                  )}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Curriculum Type"
                  size="small"
                  value={getCurriculumTypeName(selectedCourse.curriculumTypeId)}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpenView(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deregister</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to deregister this course?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="inherit"
            onClick={() => setOpenDelete(false)}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog with Formik */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Add Non-Accredited Course</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Name of Training Provider/Institution"
                      name="instituteName"
                      size="small"
                      value={formik.values.instituteName}
                      slotProps={{
                        input: {
                          readOnly: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Registration No"
                      name="registrationNo"
                      size="small"
                      value={formik.values.registrationNo}
                      slotProps={{
                        input: {
                          readOnly: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Course Title"
                      name="courseTitle"
                      size="small"
                      value={formik.values.courseTitle}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseTitle &&
                        Boolean(formik.errors.courseTitle)
                      }
                      helperText={
                        formik.touched.courseTitle && formik.errors.courseTitle
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Theory (Hours)"
                      name="theoryHour"
                      type="number"
                      size="small"
                      value={formik.values.theoryHour}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.theoryHour &&
                        Boolean(formik.errors.theoryHour)
                      }
                      helperText={
                        formik.touched.theoryHour && formik.errors.theoryHour
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Practical (Hours)"
                      name="practicalHour"
                      type="number"
                      size="small"
                      value={formik.values.practicalHour}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.practicalHour &&
                        Boolean(formik.errors.practicalHour)
                      }
                      helperText={
                        formik.touched.practicalHour &&
                        formik.errors.practicalHour
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="OJT (Hours)"
                      name="ojtHour"
                      type="number"
                      size="small"
                      value={formik.values.ojtHour}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.ojtHour && Boolean(formik.errors.ojtHour)
                      }
                      helperText={
                        formik.touched.ojtHour && formik.errors.ojtHour
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Fees per trainee (RM)"
                      name="feesPerTrainee"
                      type="number"
                      size="small"
                      value={formik.values.feesPerTrainee}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.feesPerTrainee &&
                        Boolean(formik.errors.feesPerTrainee)
                      }
                      helperText={
                        formik.touched.feesPerTrainee &&
                        formik.errors.feesPerTrainee
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Enrollment capacity per batch"
                      name="enrolmentCapacity"
                      type="number"
                      size="small"
                      value={formik.values.enrolmentCapacity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.enrolmentCapacity &&
                        Boolean(formik.errors.enrolmentCapacity)
                      }
                      helperText={
                        formik.touched.enrolmentCapacity &&
                        formik.errors.enrolmentCapacity
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Certificate Level"
                      name="certificateLevelId"
                      size="small"
                      value={formik.values.certificateLevelId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.certificateLevelId &&
                        Boolean(formik.errors.certificateLevelId)
                      }
                      helperText={
                        formik.touched.certificateLevelId &&
                        formik.errors.certificateLevelId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {certificateLevels.map((level) => (
                        <MenuItem key={level.id} value={level.id}>
                          {level.name ||
                            level.value ||
                            level.certificate_level_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Curriculum Type"
                      name="curriculumTypeId"
                      size="small"
                      value={formik.values.curriculumTypeId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.curriculumTypeId &&
                        Boolean(formik.errors.curriculumTypeId)
                      }
                      helperText={
                        formik.touched.curriculumTypeId &&
                        formik.errors.curriculumTypeId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {curriculumTypes.map((type) => (
                        <MenuItem
                          key={type.id}
                          value={type.curriculum_type_id || type.id}
                        >
                          {type.curriculum_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Supporting Documents
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Please upload all required documents (Course Endorsement
                      Letter, Trainer CV, etc.)
                    </Typography>
                    <FileUpload
                      files={formik.values.files}
                      onFilesChange={(files) =>
                        formik.setFieldValue("files", files)
                      }
                      error={
                        formik.touched.files && Boolean(formik.errors.files)
                      }
                      helperText={formik.touched.files && formik.errors.files}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => setOpenAdd(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default ApplyNonAccreditedCourse;
