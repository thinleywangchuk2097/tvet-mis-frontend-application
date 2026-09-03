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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";

// Helper component for required field indicator
const RequiredStar = () => (
  <Typography component="span" sx={{ color: "red" }}>
    *
  </Typography>
);

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

// ==================== MAIN COMPONENT ====================

const AccreditatedCourse = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [courses, setCourses] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Fetch institute details and dropdown data on component mount
  useEffect(() => {
    fetchInstituteDetails();
    fetchDropdownData();
    fetchDzongkhags();
    fetchApprovedCourses();
    fetchEnrolledCourses();
    fetchStatusList();
  }, []);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteDetails(response.data);
      console.log("Institute Details:", response.data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch certification levels (assuming parentId for certification levels)
      const levelsResponse = await CommonService.getByParentId(27);
      setCertificationLevels(levelsResponse.data);
      console.log("CertificationLevels", levelsResponse.data);
      // Fetch funding sources (assuming parentId for funding sources)
      const fundingResponse = await CommonService.getByParentId(16);
      setFundingSources(fundingResponse.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
      console.log("Dzongkhags:", dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchApprovedCourses = async () => {
    try {
      const approvedCourses =
        await ApplyAccreditedCourseService.getAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      setApprovedCourses(approvedCourses.data);
      console.log("Approved Courses:", approvedCourses.data);
    } catch (error) {
      console.error("Error fetching approved courses:", error);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response =
        await CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
          registration_no,
          37,
          access_token,
        );
      setCourses(response.data);
      console.log("Enrolled Courses:", response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Fetch status list from CommonService
  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      setStatusList(statusResponse.data);
      console.log("Status List:", statusResponse.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const institute = instituteDetails[0] || {};

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Handle view details navigation
  const handleViewDetails = (applicationNo) => {
    navigate(`/announcement/course-trainee-selection/${applicationNo}`);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.programme_title?.toLowerCase().includes(search.toLowerCase()) ||
      course.application_no?.toLowerCase().includes(search.toLowerCase()),
  );

  const initialValues = {
    instituteId: institute.institute_id || "",
    programmeId: "",
    feesPerTrainee: "",
    enrollmentCapacity: "",
    applicationStartDate: "",
    applicationEndDate: "",
    courseStartDate: "",
    courseEndDate: "",
    certificationLevelId: "",
    fundingSourceId: "",
    trainingLocationId: "",
    courseDescription: "",
    files: [],
  };

  const validationSchema = Yup.object().shape({
    programmeId: Yup.string().required("Programme Title is required"),
    feesPerTrainee: Yup.number()
      .typeError("Must be a number")
      .required("Fees per trainee is required"),
    enrollmentCapacity: Yup.number()
      .typeError("Must be a number")
      .required("Enrollment capacity per batch is required"),
    applicationStartDate: Yup.date()
      .typeError("Invalid date")
      .required("Application Start Date required"),
    applicationEndDate: Yup.date()
      .typeError("Invalid date")
      .required("Application End Date required")
      .min(
        Yup.ref("applicationStartDate"),
        "Application end date cannot be before application start date",
      ),
    courseStartDate: Yup.date()
      .typeError("Invalid date")
      .required("Course Start Date required")
      .test(
        "is-after-application-end",
        "Course start date must be after application end date",
        (value, context) => {
          const { applicationEndDate } = context.parent;
          if (!value || !applicationEndDate) return true;
          return new Date(value) > new Date(applicationEndDate);
        },
      ),
    courseEndDate: Yup.date()
      .typeError("Invalid date")
      .required("Course End Date required")
      .min(
        Yup.ref("courseStartDate"),
        "Course end date cannot be before course start date",
      ),
    certificationLevelId: Yup.string().required(
      "Certification Level is required",
    ),
    fundingSourceId: Yup.string().required("Funding Source is required"),
    trainingLocationId: Yup.string().required("Training Location is required"),
    courseDescription: Yup.string().required("Course Description is required"),
    files: Yup.array()
      .min(1, "Please upload required documents")
      .max(5, "Maximum 5 files allowed"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      // Convert files to base64
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const payload = {
        instituteId: values.instituteId,
        programmeId: values.programmeId,
        feesPerTrainee: values.feesPerTrainee,
        enrollmentCapacity: values.enrollmentCapacity,
        applicationStartDate: values.applicationStartDate,
        applicationEndDate: values.applicationEndDate,
        courseStartDate: values.courseStartDate,
        courseEndDate: values.courseEndDate,
        certificationLevelId: values.certificationLevelId,
        fundingSourceId: values.fundingSourceId,
        trainingLocationId: values.trainingLocationId,
        courseDescription: values.courseDescription,
        createdBy: actionId,
        serviceId: 37, // Service ID for course enrollment
        statusId: 55, // Initial status (Pending)
        remarks: "",
        documents: documents,
      };

      console.log("Submitting payload:", payload);

      const response = await CourseEnrollmentService.submitCourseAnnouncement(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Course announcement submitted successfully!");
        await fetchEnrolledCourses(); // Refresh the list
        resetForm();
        setOpenDialog(false);
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit course announcement",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Helper function to get status name from statusList
  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const status = statusList.find(
      (s) => parseInt(s.id) === parseInt(statusId),
    );
    return status ? status.name : "Pending";
  };

  // Helper function to get status color based on status name or ID
  const getStatusColor = (statusId) => {
    const statusName = getStatusName(statusId);
    switch (statusName.toLowerCase()) {
      case "approved":
        return "#4caf50"; // Green
      case "rejected":
        return "#f44336"; // Red
      case "pending":
      default:
        return "#ff9800"; // Orange
    }
  };

  // Helper function to get dzongkhag name by ID
  const getDzongkhagName = (locationId) => {
    if (!locationId) return "N/A";
    const dzongkhag = dzongkhags.find(
      (dzong) => dzong.id === parseInt(locationId),
    );
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  // Helper function to get course name by ID
  const getCourseName = (programmeId) => {
    if (!programmeId) return "N/A";
    const course = approvedCourses.find((c) => c.id === programmeId);
    return course ? course.programme_title : programmeId;
  };

  // Helper function to get certification level name by ID
  const getCertificationLevelName = (levelId) => {
    if (!levelId) return "N/A";
    const level = certificationLevels.find((l) => l.id === parseInt(levelId));
    return level ? level.name : levelId;
  };

  // Helper function to get funding source name by ID
  const getFundingSourceName = (sourceId) => {
    if (!sourceId) return "N/A";
    const source = fundingSources.find((s) => s.id === parseInt(sourceId));
    return source ? source.name : sourceId;
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        List of BQF Programme Announcements
      </Typography>

      {/* Search + Add Course */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search by Course or Application No"
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
            onClick={() => setOpenDialog(true)}
            sx={{ height: "36px" }}
          >
            Add Announcement
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Programme</TableCell>
              <TableCell>Fees per Trainee (Nu.)</TableCell>
              <TableCell>Enrollment Capacity</TableCell>
              <TableCell>Certification Level</TableCell>
              <TableCell>Funding Source</TableCell>
              <TableCell>Application Period</TableCell>
              <TableCell>Programme Period</TableCell>
              <TableCell>Training Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => (
                  <TableRow key={course.id || index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{course.application_no || "N/A"}</TableCell>
                    <TableCell>{getCourseName(course.programme_id)}</TableCell>
                    <TableCell>
                      Nu. {course.fees_per_trainee || course.course_fee}
                    </TableCell>
                    <TableCell>
                      {course.enrollment_capacity || course.total_no_trainees}
                    </TableCell>
                    <TableCell>
                      {getCertificationLevelName(course.certification_level_id)}
                    </TableCell>
                    <TableCell>
                      {getFundingSourceName(course.funding_source_id)}
                    </TableCell>
                    <TableCell>
                      {course.application_start_date &&
                      course.application_end_date
                        ? `${new Date(course.application_start_date).toLocaleDateString()} - ${new Date(course.application_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {course.course_start_date && course.course_end_date
                        ? `${new Date(course.course_start_date).toLocaleDateString()} - ${new Date(course.course_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {getDzongkhagName(course.training_location_id)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusName(course.status_id)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(course.status_id),
                          color: "white",
                          fontWeight: "medium",
                          minWidth: "80px",
                          "& .MuiChip-label": {
                            px: 1.5,
                            py: 0.5,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleViewDetails(course.application_no)}
                        title="View Details"
                      >
                        <RemoveRedEyeIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
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

      {/* Add Course Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create BQF Programme</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          validateOnBlur={true}
          validateOnChange={true}
          validateOnMount={false}
        >
          {(formik) => {
            // Handle course selection - auto-fill fields
            const handleCourseChange = (event) => {
              const programmeId = event.target.value;

              if (programmeId) {
                // Find the selected course from approvedCourses
                const selectedCourse = approvedCourses.find(
                  (course) => course.id === programmeId,
                );

                if (selectedCourse) {
                  // Set all fields at once without marking them as touched
                  formik.setFieldValue("programmeId", programmeId, false);
                  formik.setFieldValue(
                    "feesPerTrainee",
                    selectedCourse.fees_per_trainee || "",
                    false,
                  );
                  formik.setFieldValue(
                    "enrollmentCapacity",
                    selectedCourse.enrolment_capacity || "",
                    false,
                  );
                  formik.setFieldValue(
                    "certificationLevelId",
                    selectedCourse.certificate_level_id || "",
                    false,
                  );
                }
              } else {
                // Clear fields if no course selected
                formik.setFieldValue("programmeId", "", false);
                formik.setFieldValue("feesPerTrainee", "", false);
                formik.setFieldValue("enrollmentCapacity", "", false);
                formik.setFieldValue("certificationLevelId", "", false);
              }
            };

            return (
              <Form>
                <DialogContent dividers>
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Programme Title <RequiredStar />
                          </>
                        }
                        name="programmeId"
                        size="small"
                        select
                        value={formik.values.programmeId}
                        onChange={handleCourseChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programmeId &&
                          Boolean(formik.errors.programmeId)
                        }
                        helperText={
                          formik.touched.programmeId &&
                          formik.errors.programmeId
                        }
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {approvedCourses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.programme_title}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Fees per Trainee (Nu.) <RequiredStar />
                          </>
                        }
                        name="feesPerTrainee"
                        size="small"
                        type="number"
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
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Certification Level <RequiredStar />
                          </>
                        }
                        name="certificationLevelId"
                        size="small"
                        value={formik.values.certificationLevelId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.certificationLevelId &&
                          Boolean(formik.errors.certificationLevelId)
                        }
                        helperText={
                          formik.touched.certificationLevelId &&
                          formik.errors.certificationLevelId
                        }
                        InputProps={{
                          readOnly: true,
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {certificationLevels.map((level) => (
                          <MenuItem key={level.id} value={level.id}>
                            {level.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Enrollment Capacity per Batch <RequiredStar />
                          </>
                        }
                        name="enrollmentCapacity"
                        size="small"
                        type="number"
                        value={formik.values.enrollmentCapacity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.enrollmentCapacity &&
                          Boolean(formik.errors.enrollmentCapacity)
                        }
                        helperText={
                          formik.touched.enrollmentCapacity &&
                          formik.errors.enrollmentCapacity
                        }
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        type="date"
                        fullWidth
                        label={
                          <>
                            Application Start Date <RequiredStar />
                          </>
                        }
                        name="applicationStartDate"
                        size="small"
                        value={formik.values.applicationStartDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ shrink: true }}
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
                        type="date"
                        fullWidth
                        label={
                          <>
                            Application End Date <RequiredStar />
                          </>
                        }
                        name="applicationEndDate"
                        size="small"
                        value={formik.values.applicationEndDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ shrink: true }}
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
                        type="date"
                        fullWidth
                        label={
                          <>
                            Course Start Date <RequiredStar />
                          </>
                        }
                        name="courseStartDate"
                        size="small"
                        value={formik.values.courseStartDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ shrink: true }}
                        error={
                          formik.touched.courseStartDate &&
                          Boolean(formik.errors.courseStartDate)
                        }
                        helperText={
                          formik.touched.courseStartDate &&
                          formik.errors.courseStartDate
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        type="date"
                        fullWidth
                        label={
                          <>
                            Course End Date <RequiredStar />
                          </>
                        }
                        name="courseEndDate"
                        size="small"
                        value={formik.values.courseEndDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ shrink: true }}
                        error={
                          formik.touched.courseEndDate &&
                          Boolean(formik.errors.courseEndDate)
                        }
                        helperText={
                          formik.touched.courseEndDate &&
                          formik.errors.courseEndDate
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Funding Source <RequiredStar />
                          </>
                        }
                        name="fundingSourceId"
                        size="small"
                        value={formik.values.fundingSourceId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.fundingSourceId &&
                          Boolean(formik.errors.fundingSourceId)
                        }
                        helperText={
                          formik.touched.fundingSourceId &&
                          formik.errors.fundingSourceId
                        }
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {fundingSources.map((source) => (
                          <MenuItem key={source.id} value={source.id}>
                            {source.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Training Location (Dzongkhag) <RequiredStar />
                          </>
                        }
                        name="trainingLocationId"
                        size="small"
                        value={formik.values.trainingLocationId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainingLocationId &&
                          Boolean(formik.errors.trainingLocationId)
                        }
                        helperText={
                          formik.touched.trainingLocationId &&
                          formik.errors.trainingLocationId
                        }
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {dzongkhags.map((dzongkhag) => (
                          <MenuItem key={dzongkhag.id} value={dzongkhag.id}>
                            {dzongkhag.dzonkhagName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={
                          <>
                            Course Description <RequiredStar />
                          </>
                        }
                        name="courseDescription"
                        size="small"
                        value={formik.values.courseDescription}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.courseDescription &&
                          Boolean(formik.errors.courseDescription)
                        }
                        helperText={
                          formik.touched.courseDescription &&
                          formik.errors.courseDescription
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12 }}>
                      <FileUpload
                        files={formik.values.files}
                        onFilesChange={(files) => {
                          formik.setFieldValue("files", files);
                          setTimeout(() => {
                            formik.validateField("files");
                          }, 100);
                        }}
                        error={
                          formik.touched.files && Boolean(formik.errors.files)
                        }
                        helperText={formik.touched.files && formik.errors.files}
                      />
                      {!formik.touched.files &&
                        formik.values.files.length === 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Please upload required documents (PDF, DOC, etc.)
                          </Typography>
                        )}
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={() => setOpenDialog(false)}
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
                    {loading ? "Saving..." : "Submit"}
                  </Button>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default AccreditatedCourse;
