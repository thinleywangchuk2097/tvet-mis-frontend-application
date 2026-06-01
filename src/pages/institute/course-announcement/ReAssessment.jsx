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
  FormControl,
  InputLabel,
  Select,
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

const ReAssessment = () => {
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
  const [reassessmentTypes, setReassessmentTypes] = useState([]);
  const [currentReassessmentType, setCurrentReassessmentType] = useState("");
  const [filterReassessmentType, setFilterReassessmentType] = useState("");
  const [rplCourses, setRplCourses] = useState([]);
  const [accreditedCourses, setAccreditedCourses] = useState([]);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Fetch institute details and dropdown data on component mount
  useEffect(() => {
    fetchInstituteDetails();
    fetchDropdownData();
    fetchDzongkhags();
    fetchStatusList();
    fetchReAssessmentServiceName();
    fetchAllCoursesData();
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
      const levelsResponse = await CommonService.getByParentId(10);
      setCertificationLevels(levelsResponse.data);

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

  const fetchReAssessmentServiceName = async () => {
    try {
      const response =
        await CourseEnrollmentService.getReAssessmentServiceName(access_token);
      console.log("Re-assessment Service Name:", response.data);
      if (response.data && Array.isArray(response.data)) {
        const filteredTypes = response.data.filter(
          (type) => type.id === "41" || type.id === "42",
        );
        setReassessmentTypes(filteredTypes);
      }
    } catch (error) {
      console.error("Error fetching re-assessment service name:", error);
    }
  };

  const fetchAllCoursesData = async () => {
    try {
      const rplResponse = await CommonService.getAllOccupations();
      const mappedRplCourses = rplResponse.data.map((occupation) => ({
        id: occupation.id,
        name: occupation.occupationName,
        serviceId: "41",
        originalData: occupation,
      }));
      setRplCourses(mappedRplCourses);
      console.log("RPL Courses loaded:", mappedRplCourses);

      const accreditedResponse =
        await ApplyAccreditedCourseService.getAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      const mappedAccreditedCourses = accreditedResponse.data.map((course) => ({
        id: course.id,
        name: course.course_name,
        serviceId: "42",
        originalData: course,
      }));
      setAccreditedCourses(mappedAccreditedCourses);
      console.log("Accredited Courses loaded:", mappedAccreditedCourses);
    } catch (error) {
      console.error("Error fetching all courses data:", error);
      toast.error("Failed to load courses data");
    }
  };

  const fetchEnrolledCourses = async (reassessmentTypeId) => {
    if (!reassessmentTypeId) {
      setCourses([]);
      return;
    }
    
    try {
      const response =
        await CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
          registration_no,
          reassessmentTypeId,
          access_token,
        );
      setCourses(response.data);
      console.log("Enrolled Courses for type", reassessmentTypeId, ":", response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      toast.error("Failed to fetch courses");
    }
  };

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      setStatusList(statusResponse.data);
      console.log("Status List:", statusResponse.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchApprovedCourses = async (reassessmentTypeId) => {
    try {
      if (!reassessmentTypeId) {
        setApprovedCourses([]);
        setCurrentReassessmentType("");
        return;
      }

      setCurrentReassessmentType(reassessmentTypeId);

      if (reassessmentTypeId === "42" || reassessmentTypeId === 42) {
        setApprovedCourses(accreditedCourses);
        console.log("Using Accredited Courses:", accreditedCourses);
      } else if (reassessmentTypeId === "41" || reassessmentTypeId === 41) {
        setApprovedCourses(rplCourses);
        console.log("Using RPL Courses:", rplCourses);
      } else {
        setApprovedCourses([]);
      }
    } catch (error) {
      console.error("Error fetching approved courses:", error);
      setApprovedCourses([]);
      toast.error("Failed to fetch courses");
    }
  };

  const institute = instituteDetails[0] || {};

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleViewDetails = (applicationNo, courseId) => {
    // Navigate with both applicationNo and courseId as route parameters
    navigate(`/announcement/reassessment-trainee-selection/${applicationNo}/${courseId}`);
  };

  const getReassessmentTypeName = (serviceId) => {
    if (!serviceId) return "N/A";
    const type = reassessmentTypes.find((t) => t.id === String(serviceId));
    return type ? type.service_name : "N/A";
  };

  const getCourseName = (courseId, serviceId) => {
    if (!courseId) return "N/A";
    
    let course = null;
    
    if (serviceId === "41" || serviceId === 41) {
      course = rplCourses.find((c) => String(c.id) === String(courseId));
    } else if (serviceId === "42" || serviceId === 42) {
      course = accreditedCourses.find((c) => String(c.id) === String(courseId));
    } else {
      course = approvedCourses.find((c) => String(c.id) === String(courseId));
      if (!course) {
        const originalCourse = courses.find(
          (c) => String(c.course_id) === String(courseId)
        );
        return originalCourse ? originalCourse.course_name : courseId;
      }
    }
    
    return course ? course.name : courseId;
  };

  const filteredCourses = courses.filter((course) => {
    const courseName = getCourseName(course.course_id, course.service_id);
    
    const matchesSearch =
      courseName?.toLowerCase().includes(search.toLowerCase()) ||
      course.application_no?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  const initialValues = {
    instituteId: institute.institute_id || "",
    reassessmentTypeId: "",
    courseId: "",
    courseFee: "",
    totalNoTrainees: "",
    courseStartDate: "",
    courseEndDate: "",
    certificationLevelId: "",
    fundingSourceId: "",
    trainingLocationId: "",
    courseDescription: "",
    files: [],
  };

  const validationSchema = Yup.object().shape({
    reassessmentTypeId: Yup.string().required("Reassessment Type is required"),
    courseId: Yup.string().required("Course Name is required"),
    courseFee: Yup.number()
      .typeError("Must be a number")
      .required("Course Fee is required"),
    totalNoTrainees: Yup.number()
      .typeError("Must be a number")
      .required("Total number of trainees required"),
    courseStartDate: Yup.date()
      .typeError("Invalid date")
      .required("Course Start Date required"),
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
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const payload = {
        instituteId: values.instituteId,
        serviceId: values.reassessmentTypeId,
        courseId: values.courseId,
        courseFee: values.courseFee,
        totalNoTrainees: values.totalNoTrainees,
        courseStartDate: values.courseStartDate,
        courseEndDate: values.courseEndDate,
        certificationLevelId: values.certificationLevelId,
        fundingSourceId: values.fundingSourceId,
        trainingLocationId: values.trainingLocationId,
        courseDescription: values.courseDescription,
        createdBy: actionId,
        statusId: 55,
        remarks: "",
        documents: documents,
      };

      console.log("Submitting payload:", payload);

      const response = await CourseEnrollmentService.submitCourseAnnouncement(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Re-Assessment submitted successfully!");
        await fetchEnrolledCourses(values.reassessmentTypeId);
        resetForm();
        setOpenDialog(false);
      }
    } catch (error) {
      console.error("Error submitting re-assessment:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit re-assessment",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const status = statusList.find(
      (s) => parseInt(s.id) === parseInt(statusId),
    );
    return status ? status.name : "Pending";
  };

  const getStatusColor = (statusId) => {
    const statusName = getStatusName(statusId);
    switch (statusName.toLowerCase()) {
      case "approved":
        return "#4caf50";
      case "rejected":
        return "#f44336";
      case "pending":
      default:
        return "#ff9800";
    }
  };

  const getDzongkhagName = (locationId) => {
    if (!locationId) return "N/A";
    const dzongkhag = dzongkhags.find(
      (dzong) => dzong.id === parseInt(locationId),
    );
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  const getCertificationLevelName = (levelId) => {
    if (!levelId) return "N/A";
    const level = certificationLevels.find((l) => l.id === parseInt(levelId));
    return level ? level.name : levelId;
  };

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
        Re-Assessment
      </Typography>

      <Grid
        container
        spacing={2}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Reassessment Type</InputLabel>
            <Select
              value={filterReassessmentType}
              onChange={async (e) => {
                const value = e.target.value;
                setFilterReassessmentType(value);
                setSearch("");
                setPage(0);
                await fetchEnrolledCourses(value);
              }}
              label="Select Reassessment Type"
              sx={{ height: "36px" }}
            >
              <MenuItem value="">-Select Reassessment Type-</MenuItem>
              {reassessmentTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.service_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {filterReassessmentType && (
          <Grid item size={{ xs: 12, md: 3 }}>
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
        )}
        
        <Grid item size={{ xs: 12, md: filterReassessmentType ? 2 : 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ height: "36px" }}
          >
            Add Re-Assessment
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Reassessment Type</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Course Fee</TableCell>
              <TableCell>Total Trainees</TableCell>
              <TableCell>Certification Level</TableCell>
              <TableCell>Funding Source</TableCell>
              <TableCell>Course Period</TableCell>
              <TableCell>Training Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filterReassessmentType ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  Please select a Reassessment Type to view the data
                </TableCell>
              </TableRow>
            ) : filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => (
                  <TableRow key={course.id || index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{course.application_no || "N/A"}</TableCell>
                    <TableCell>
                      {getReassessmentTypeName(course.service_id)}
                    </TableCell>
                    <TableCell>
                      {getCourseName(course.course_id, course.service_id)}
                    </TableCell>
                    <TableCell>Nu. {course.course_fee}</TableCell>
                    <TableCell>{course.total_no_trainees}</TableCell>
                    <TableCell>
                      {getCertificationLevelName(course.certification_level_id)}
                    </TableCell>
                    <TableCell>
                      {getFundingSourceName(course.funding_source_id)}
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
                        onClick={() => handleViewDetails(course.application_no, course.course_id)}
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
                  No data available for selected reassessment type
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filterReassessmentType && filteredCourses.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCourses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create Re-Assessment</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          validateOnBlur={true}
          validateOnChange={true}
          validateOnMount={false}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Reassessment Type"
                      name="reassessmentTypeId"
                      size="small"
                      value={formik.values.reassessmentTypeId}
                      onChange={async (e) => {
                        const value = e.target.value;
                        formik.handleChange(e);
                        formik.setFieldValue("courseId", "");
                        if (value) {
                          await fetchApprovedCourses(value);
                        } else {
                          setApprovedCourses([]);
                        }
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.reassessmentTypeId &&
                        Boolean(formik.errors.reassessmentTypeId)
                      }
                      helperText={
                        formik.touched.reassessmentTypeId &&
                        formik.errors.reassessmentTypeId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {reassessmentTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.service_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Course Name"
                      name="courseId"
                      size="small"
                      select
                      value={formik.values.courseId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseId &&
                        Boolean(formik.errors.courseId)
                      }
                      helperText={
                        formik.touched.courseId && formik.errors.courseId
                      }
                      disabled={
                        !formik.values.reassessmentTypeId ||
                        approvedCourses.length === 0
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {approvedCourses.map((course) => (
                        <MenuItem key={course.id} value={course.id}>
                          {course.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Rest of the form fields remain the same */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Course Fee"
                      name="courseFee"
                      size="small"
                      type="number"
                      value={formik.values.courseFee}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseFee &&
                        Boolean(formik.errors.courseFee)
                      }
                      helperText={
                        formik.touched.courseFee && formik.errors.courseFee
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Certification Level"
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
                      label="Total No of Trainees"
                      name="totalNoTrainees"
                      size="small"
                      type="number"
                      value={formik.values.totalNoTrainees}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.totalNoTrainees &&
                        Boolean(formik.errors.totalNoTrainees)
                      }
                      helperText={
                        formik.touched.totalNoTrainees &&
                        formik.errors.totalNoTrainees
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Course Start Date"
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
                      label="Course End Date"
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
                      label="Funding Source"
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
                      label="Training Location (Dzongkhag)"
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
                      label="Course Description"
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
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default ReAssessment;