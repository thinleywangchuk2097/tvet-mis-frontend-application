// NonAccreditedCourse.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
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
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import ApplyNonAccreditedCourseService from "../../../api/services/internal/course/ApplyNonAccreditedCourseService";

// ==================== UTILITY FUNCTIONS ====================
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

const RequiredStar = () => (
  <Typography component="span" sx={{ color: "red" }}>
    *
  </Typography>
);

RequiredStar.propTypes = {};

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

const SERVICE_ID = 38;
const INITIAL_STATUS_ID = 55;

// ==================== PROPTYPES ====================

const searchBarPropTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

const addButtonPropTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string,
};

const statusChipPropTypes = {
  statusId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  statusList: PropTypes.array,
};

const formTextFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  type: PropTypes.string,
  select: PropTypes.bool,
  options: PropTypes.array,
  optionLabelKey: PropTypes.string,
  optionValueKey: PropTypes.string,
  readOnly: PropTypes.bool,
};

const formDateFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
};

const dataTablePropTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      align: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string,
};

// ==================== CUSTOM HOOKS ====================
const useCourseData = (registration_no, access_token) => {
  const [courses, setCourses] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvedCourses, setApprovedCourses] = useState([]);

  const fetchInstituteDetails = useCallback(async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteDetails(response.data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  }, [registration_no]);

  const fetchEnrolledCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        await CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
          registration_no,
          SERVICE_ID,
          access_token,
        );
      setCourses(response.data);
      console.log("Enrolled Courses:", response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }, [registration_no, access_token]);

  const fetchApprovedCourses = useCallback(async () => {
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      setApprovedCourses(response.data);
      console.log("Approved Courses:", response.data);
    } catch (error) {
      console.error("Error fetching approved courses:", error);
    }
  }, [registration_no, access_token]);

  const submitCourse = useCallback(
    async (values, resetForm) => {
      setLoading(true);
      try {
        const documents = await Promise.all(values.files.map(fileToBase64));

        const selectedCourse = values.approvedCourses?.find(
          (course) => course.id === values.programmeId,
        );

        const payload = {
          instituteId: values.instituteId,
          programmeId: values.programmeId,
          courseName: selectedCourse?.course_name || values.programmeId,
          feesPerTrainee: values.feesPerTrainee,
          certificationLevelId: values.certificationLevelId,
          enrollmentCapacity: values.enrollmentCapacity,
          applicationStartDate: values.applicationStartDate,
          applicationEndDate: values.applicationEndDate,
          courseStartDate: values.courseStartDate,
          courseEndDate: values.courseEndDate,
          fundingSourceId: values.fundingSourceId,
          trainingLocationId: values.trainingLocationId,
          courseDescription: values.courseDescription,
          createdBy: values.createdBy,
          serviceId: SERVICE_ID,
          statusId: INITIAL_STATUS_ID,
          remarks: "",
          documents: documents,
        };

        const response = await CourseEnrollmentService.submitCourseAnnouncement(
          payload,
          access_token,
        );

        if (response.status === 200 || response.status === 201) {
          toast.success("Non-accredited course submitted successfully!");
          await fetchEnrolledCourses();
          resetForm();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error submitting course:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to submit course",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [access_token, fetchEnrolledCourses],
  );

  return {
    courses,
    instituteDetails,
    approvedCourses,
    loading,
    fetchInstituteDetails,
    fetchEnrolledCourses,
    fetchApprovedCourses,
    submitCourse,
  };
};

const useDropdownData = () => {
  const [statusList, setStatusList] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [
        statusResponse,
        dzongkhagResponse,
        fundingResponse,
        levelsResponse,
      ] = await Promise.all([
        CommonService.getByParentId(4),
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(16),
        CommonService.getByParentId(10),
      ]);

      setStatusList(statusResponse.data || []);
      setDzongkhags(dzongkhagResponse.data || []);
      setFundingSources(fundingResponse.data || []);
      setCertificationLevels(levelsResponse.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  }, []);

  return {
    statusList,
    dzongkhags,
    fundingSources,
    certificationLevels,
    fetchDropdownData,
  };
};

// ==================== REUSABLE COMPONENTS ====================
const SearchBar = ({ value, onChange }) => (
  <TextField
    label="Search by Course or Application No"
    variant="outlined"
    size="small"
    fullWidth
    value={value}
    onChange={onChange}
    sx={{
      "& .MuiOutlinedInput-root": {
        height: "36px",
        "& input": { padding: "8px 12px" },
        "& fieldset": { borderRadius: "4px" },
      },
    }}
  />
);

SearchBar.propTypes = searchBarPropTypes;

const AddButton = ({ onClick, label = "Add Announcement" }) => (
  <Button
    variant="contained"
    color="primary"
    size="small"
    startIcon={<AddIcon />}
    onClick={onClick}
    sx={{ height: "36px" }}
  >
    {label}
  </Button>
);

AddButton.propTypes = addButtonPropTypes;

const StatusChip = ({ statusId, statusList }) => {
  const getStatusName = useCallback(
    (id) => {
      if (!id) return "Pending";
      const status = statusList.find((s) => parseInt(s.id) === parseInt(id));
      return status ? status.name : "Pending";
    },
    [statusList],
  );

  const getStatusColor = useCallback(
    (id) => {
      const statusName = getStatusName(id);
      switch (statusName.toLowerCase()) {
        case "approved":
          return "#4caf50";
        case "rejected":
          return "#f44336";
        default:
          return "#ff9800";
      }
    },
    [getStatusName],
  );

  return (
    <Chip
      label={getStatusName(statusId)}
      size="small"
      sx={{
        backgroundColor: getStatusColor(statusId),
        color: "white",
        fontWeight: "medium",
        minWidth: "80px",
        "& .MuiChip-label": { px: 1.5, py: 0.5 },
      }}
    />
  );
};

StatusChip.propTypes = statusChipPropTypes;

const FormTextField = ({
  formik,
  name,
  label,
  type = "text",
  select = false,
  options = [],
  optionLabelKey = "name",
  optionValueKey = "id",
  readOnly = false,
  ...props
}) => {
  const fieldProps = {
    fullWidth: true,
    label: label,
    name: name,
    size: "small",
    value: formik.values[name] || "",
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    InputProps: readOnly ? { readOnly: true } : {},
    ...props,
  };

  if (select) {
    return (
      <TextField select {...fieldProps}>
        <MenuItem value="">-select-</MenuItem>
        {options.map((option) => (
          <MenuItem key={option[optionValueKey]} value={option[optionValueKey]}>
            {option[optionLabelKey]}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return <TextField {...fieldProps} type={type} />;
};

FormTextField.propTypes = formTextFieldPropTypes;

const FormDateField = ({ formik, name, label }) => (
  <TextField
    type="date"
    fullWidth
    label={label}
    name={name}
    size="small"
    value={formik.values[name] || ""}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    InputLabelProps={{ shrink: true }}
    error={formik.touched[name] && Boolean(formik.errors[name])}
    helperText={formik.touched[name] && formik.errors[name]}
  />
);

FormDateField.propTypes = formDateFieldPropTypes;

const DataTable = ({
  data,
  columns,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = "No data available in table",
}) => {
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table size="small" sx={TABLE_STYLE}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align || "left"}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <TableRow key={item.id || index}>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || "left"}>
                    {col.render(item, index + page * rowsPerPage)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </TableContainer>
  );
};

DataTable.propTypes = dataTablePropTypes;

// ==================== MAIN COMPONENT ====================
const NonAccreditedCourse = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Custom hooks
  const courseData = useCourseData(registration_no, access_token);
  const dropdownData = useDropdownData();

  // Fetch all data on mount
  useEffect(() => {
    courseData.fetchInstituteDetails();
    courseData.fetchEnrolledCourses();
    courseData.fetchApprovedCourses();
    dropdownData.fetchDropdownData();
  }, []);

  // Get institute details
  const institute = useMemo(
    () => courseData.instituteDetails[0] || {},
    [courseData.instituteDetails],
  );

  // Handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleViewDetails = (applicationNo) => {
    navigate(
      `/announcement/non-accredited-course-trainee-selection/${applicationNo}`,
    );
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courseData.courses.filter(
      (course) =>
        (course.course_name?.toLowerCase() || "").includes(
          search.toLowerCase(),
        ) ||
        (course.application_no?.toLowerCase() || "").includes(
          search.toLowerCase(),
        ),
    );
  }, [courseData.courses, search]);

  // Helper functions for display
  const getDzongkhagName = useCallback(
    (locationId) => {
      if (!locationId) return "N/A";
      const dzongkhag = dropdownData.dzongkhags.find(
        (dz) => dz.id === parseInt(locationId),
      );
      return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
    },
    [dropdownData.dzongkhags],
  );

  const getFundingSourceName = useCallback(
    (sourceId) => {
      if (!sourceId) return "N/A";
      const source = dropdownData.fundingSources.find(
        (s) => s.id === parseInt(sourceId),
      );
      return source ? source.name : sourceId;
    },
    [dropdownData.fundingSources],
  );

  const getCertificationLevelName = useCallback(
    (levelId) => {
      if (!levelId) return "N/A";
      const level = dropdownData.certificationLevels.find(
        (l) => l.id === parseInt(levelId),
      );
      return level ? level.name : levelId;
    },
    [dropdownData.certificationLevels],
  );

  const getCourseNameById = useCallback(
    (programmeId) => {
      if (!programmeId) return "N/A";
      const course = courseData.approvedCourses.find(
        (c) => c.id === programmeId,
      );
      return course ? course.course_name : programmeId;
    },
    [courseData.approvedCourses],
  );

  // Table columns configuration
  const tableColumns = [
    { id: "index", label: "#", render: (_, index) => index + 1 },
    {
      id: "applicationNo",
      label: "Application No",
      render: (course) => course.application_no || "N/A",
    },
    {
      id: "course",
      label: "Programme Name",
      render: (course) => getCourseNameById(course.programme_id),
    },
    {
      id: "certificationLevel",
      label: "Certification Level",
      render: (course) =>
        getCertificationLevelName(course.certification_level_id),
    },
    {
      id: "fees",
      label: "Fees per Trainee (Nu.)",
      render: (course) =>
        `Nu. ${course.fees_per_trainee || course.course_fee || "N/A"}`,
    },
    {
      id: "capacity",
      label: "Enrollment Capacity",
      render: (course) =>
        course.enrolment_capacity ||
        course.enrollment_capacity ||
        course.total_no_trainees ||
        "N/A",
    },
    {
      id: "applicationPeriod",
      label: "Application Period",
      render: (course) =>
        course.application_start_date && course.application_end_date
          ? `${new Date(course.application_start_date).toLocaleDateString()} - ${new Date(course.application_end_date).toLocaleDateString()}`
          : "N/A",
    },
    {
      id: "coursePeriod",
      label: "Course Period",
      render: (course) =>
        course.course_start_date && course.course_end_date
          ? `${new Date(course.course_start_date).toLocaleDateString()} - ${new Date(course.course_end_date).toLocaleDateString()}`
          : "N/A",
    },
    {
      id: "location",
      label: "Training Location",
      render: (course) => getDzongkhagName(course.training_location_id),
    },
    {
      id: "fundingSource",
      label: "Funding Source",
      render: (course) => getFundingSourceName(course.funding_source_id),
    },
    {
      id: "status",
      label: "Status",
      render: (course) => (
        <StatusChip
          statusId={course.status_id}
          statusList={dropdownData.statusList}
        />
      ),
    },
    {
      id: "action",
      label: "Action",
      align: "center",
      render: (course) => (
        <IconButton
          color="primary"
          size="small"
          onClick={() => handleViewDetails(course.application_no)}
          title="View Details"
        >
          <RemoveRedEyeIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Form initial values
  const initialValues = {
    instituteId: institute.institute_id || "",
    programmeId: "",
    feesPerTrainee: "",
    certificationLevelId: "",
    enrollmentCapacity: "",
    applicationStartDate: "",
    applicationEndDate: "",
    courseStartDate: "",
    courseEndDate: "",
    fundingSourceId: "",
    trainingLocationId: "",
    courseDescription: "",
    files: [],
    createdBy: actionId,
    approvedCourses: courseData.approvedCourses,
  };

  // FIXED: Removed `this` usage - using arrow function with context parameter
  const validationSchema = Yup.object().shape({
    programmeId: Yup.string().required("Programme Name is required"),
    feesPerTrainee: Yup.number()
      .typeError("Must be a number")
      .required("Fees per trainee is required"),
    certificationLevelId: Yup.string().required(
      "Certification Level is required",
    ),
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
    fundingSourceId: Yup.string().required("Funding Source is required"),
    trainingLocationId: Yup.string().required("Training Location is required"),
    courseDescription: Yup.string().required("Course Description is required"),
    files: Yup.array().min(1, "Please upload required documents"),
  });

  // Handle form submission
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    const success = await courseData.submitCourse(values, resetForm);
    if (success) {
      setOpenDialog(false);
    }
    setSubmitting(false);
  };

  // Handle course selection - auto-fill fields
  const handleCourseChange = useCallback(
    (event, formik) => {
      const programmeId = event.target.value;

      if (programmeId) {
        const selectedCourse = courseData.approvedCourses.find(
          (course) => course.id === programmeId,
        );

        if (selectedCourse) {
          formik.setFieldValue("programmeId", programmeId, false);
          formik.setFieldValue(
            "feesPerTrainee",
            selectedCourse.fees_per_trainee || "",
            false,
          );
          formik.setFieldValue(
            "certificationLevelId",
            selectedCourse.certificate_level_id || "",
            false,
          );
          formik.setFieldValue(
            "enrollmentCapacity",
            selectedCourse.enrolment_capacity ||
              selectedCourse.enrollment_capacity ||
              "",
            false,
          );
        }
      } else {
        formik.setFieldValue("programmeId", "", false);
        formik.setFieldValue("feesPerTrainee", "", false);
        formik.setFieldValue("certificationLevelId", "", false);
        formik.setFieldValue("enrollmentCapacity", "", false);
      }
    },
    [courseData.approvedCourses],
  );

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        List of Non-BQF Programme Announcements
      </Typography>

      {/* Search + Add Course */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <AddButton onClick={() => setOpenDialog(true)} />
        </Grid>
      </Grid>

      {/* Table */}
      <DataTable
        data={filteredCourses}
        columns={tableColumns}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add Course Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create Non-BQF Programme</DialogTitle>
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
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      formik={formik}
                      name="programmeId"
                      label={
                        <>
                          <RequiredStar /> Programme Name
                        </>
                      }
                      select
                      options={courseData.approvedCourses}
                      optionLabelKey="course_name"
                      onChange={(e) => handleCourseChange(e, formik)}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      formik={formik}
                      name="feesPerTrainee"
                      label={
                        <>
                          <RequiredStar /> Fees per Trainee (Nu.)
                        </>
                      }
                      type="number"
                      readOnly
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      formik={formik}
                      name="certificationLevelId"
                      label={
                        <>
                          <RequiredStar /> Certification Level
                        </>
                      }
                      select
                      options={dropdownData.certificationLevels}
                      readOnly
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      formik={formik}
                      name="enrollmentCapacity"
                      label={
                        <>
                          <RequiredStar /> Enrollment Capacity per Batch
                        </>
                      }
                      type="number"
                      readOnly
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormDateField
                      formik={formik}
                      name="applicationStartDate"
                      label={
                        <>
                          <RequiredStar /> Application Start Date
                        </>
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormDateField
                      formik={formik}
                      name="applicationEndDate"
                      label={
                        <>
                          <RequiredStar /> Application End Date
                        </>
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormDateField
                      formik={formik}
                      name="courseStartDate"
                      label={
                        <>
                          <RequiredStar /> Course Start Date
                        </>
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormDateField
                      formik={formik}
                      name="courseEndDate"
                      label={
                        <>
                          <RequiredStar /> Course End Date
                        </>
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      formik={formik}
                      name="fundingSourceId"
                      label={
                        <>
                          <RequiredStar /> Funding Source
                        </>
                      }
                      select
                      options={dropdownData.fundingSources}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      formik={formik}
                      name="trainingLocationId"
                      label={
                        <>
                          <RequiredStar /> Training Location (Dzongkhag)
                        </>
                      }
                      select
                      options={dropdownData.dzongkhags}
                      optionLabelKey="dzonkhagName"
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <FormTextField
                      formik={formik}
                      name="courseDescription"
                      label={
                        <>
                          <RequiredStar /> Course Description
                        </>
                      }
                      multiline
                      rows={3}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <FileUpload
                      files={formik.values.files}
                      onFilesChange={(files) => {
                        formik.setFieldValue("files", files);
                        setTimeout(() => formik.validateField("files"), 100);
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
                  disabled={courseData.loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={courseData.loading}
                >
                  {courseData.loading ? "Submitting..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
NonAccreditedCourse.propTypes = {};

export default NonAccreditedCourse;
