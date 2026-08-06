// RPLAssessment.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Box,
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

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

const RPL_SERVICE_ID = 39;
const INITIAL_STATUS_ID = 55;

// ==================== CUSTOM HOOKS ====================
const useRPLData = (registration_no, access_token) => {
  const [rplApplications, setRplApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instituteDetails, setInstituteDetails] = useState([]);

  const fetchInstituteDetails = useCallback(async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteDetails(response.data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  }, [registration_no]);

  const fetchRPLApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        await CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
          registration_no,
          RPL_SERVICE_ID,
          access_token,
        );
      setRplApplications(response.data);
    } catch (error) {
      console.error("Error fetching RPL applications:", error);
    } finally {
      setLoading(false);
    }
  }, [registration_no, access_token]);

  const submitRPLApplication = useCallback(
    async (values, resetForm) => {
      setLoading(true);
      try {
        const documents = await Promise.all(values.files.map(fileToBase64));
        const payload = {
          instituteId: values.instituteId,
          courseId: values.courseId,
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
          createdBy: values.createdBy,
          serviceId: RPL_SERVICE_ID,
          statusId: INITIAL_STATUS_ID,
          remarks: "RPL Assessment Application",
          documents: documents,
          assessmentType: "RPL",
        };

        const response = await CourseEnrollmentService.submitCourseAnnouncement(
          payload,
          access_token,
        );

        if (response.status === 200 || response.status === 201) {
          toast.success("RPL Assessment submitted successfully!");
          await fetchRPLApplications();
          resetForm();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error submitting RPL assessment:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to submit RPL assessment",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [access_token, fetchRPLApplications],
  );

  return {
    rplApplications,
    instituteDetails,
    loading,
    fetchInstituteDetails,
    fetchRPLApplications,
    submitRPLApplication,
  };
};

const useDropdownData = () => {
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [
        levelsResponse,
        fundingResponse,
        statusResponse,
        dzongkhagResponse,
        coursesResponse,
      ] = await Promise.all([
        CommonService.getByParentId(27),
        CommonService.getByParentId(16),
        CommonService.getByParentId(4),
        CommonService.getAllDzongkhags(),
        CommonService.getAllOccupations(),
      ]);

      setCertificationLevels(levelsResponse.data || []);
      setFundingSources(fundingResponse.data || []);
      setStatusList(statusResponse.data || []);
      setDzongkhags(dzongkhagResponse.data || []);

      const activeCourses = (coursesResponse.data || []).filter(
        (course) => course.isActive === "Y",
      );
      setApprovedCourses(activeCourses);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  }, []);

  return {
    certificationLevels,
    fundingSources,
    dzongkhags,
    approvedCourses,
    statusList,
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

const AddButton = ({ onClick }) => (
  <Button
    variant="contained"
    color="primary"
    size="small"
    startIcon={<AddIcon />}
    onClick={onClick}
    sx={{ height: "36px" }}
  >
    Apply for RPL
  </Button>
);

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

const FormTextField = ({
  formik,
  name,
  label,
  type = "text",
  select = false,
  options = [],
  optionLabelKey = "name",
  optionValueKey = "id",
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

// ==================== MAIN COMPONENT ====================
const RPLAssessment = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Custom hooks
  const rplData = useRPLData(registration_no, access_token);
  const dropdownData = useDropdownData();

  // Fetch all data on mount
  useEffect(() => {
    rplData.fetchInstituteDetails();
    rplData.fetchRPLApplications();
    dropdownData.fetchDropdownData();
  }, []);

  // Get institute details
  const institute = useMemo(
    () => rplData.instituteDetails[0] || {},
    [rplData.instituteDetails],
  );

  // Handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleViewDetails = (applicationNo) => {
    navigate(`/announcement/course-trainee-selection/${applicationNo}`);
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    return rplData.rplApplications.filter(
      (app) =>
        (app.course_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (app.application_no?.toLowerCase() || "").includes(
          search.toLowerCase(),
        ),
    );
  }, [rplData.rplApplications, search]);

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

  const getCourseName = useCallback(
    (courseId) => {
      if (!courseId) return "N/A";
      const course = dropdownData.approvedCourses.find(
        (c) => c.id === parseInt(courseId),
      );
      return course ? course.occupationName : courseId;
    },
    [dropdownData.approvedCourses],
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

  // Form initial values
  const initialValues = {
    instituteId: institute.institute_id || "",
    courseId: "",
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
    createdBy: actionId,
  };

  // Form validation schema
  const validationSchema = Yup.object().shape({
    courseId: Yup.string().required("Course Name is required"),
    feesPerTrainee: Yup.number()
      .typeError("Must be a number")
      .required("Course Fee is required"),
    enrollmentCapacity: Yup.number()
      .typeError("Must be a number")
      .required("Total number of trainees required"),
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
      .required("Assessment Start Date required")
      .test(
        "is-after-application-end",
        "Assessment start date must be after application end date",
        function (value) {
          const { applicationEndDate } = this.parent;
          if (!value || !applicationEndDate) return true;
          return new Date(value) > new Date(applicationEndDate);
        },
      ),
    courseEndDate: Yup.date()
      .typeError("Invalid date")
      .required("Assessment End Date required")
      .min(
        Yup.ref("courseStartDate"),
        "Assessment end date cannot be before assessment start date",
      ),
    certificationLevelId: Yup.string().required(
      "Certification Level is required",
    ),
    fundingSourceId: Yup.string().required("Funding Source is required"),
    trainingLocationId: Yup.string().required(
      "Assessment Location is required",
    ),
    courseDescription: Yup.string().required(
      "Course/Assessment Description is required",
    ),
    files: Yup.array()
      .min(1, "Please upload required documents")
      .max(5, "Maximum 5 files allowed"),
  });

  // Handle form submission
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    const success = await rplData.submitRPLApplication(values, resetForm);
    if (success) {
      setOpenDialog(false);
    }
    setSubmitting(false);
  };

  // Table columns configuration
  const tableColumns = [
    { id: "#", render: (_, index) => index + 1 + page * rowsPerPage },
    { id: "Application No", render: (app) => app.application_no || "N/A" },
    { id: "Course", render: (app) => getCourseName(app.course_id) },
    {
      id: "Certification Level",
      render: (app) => getCertificationLevelName(app.certification_level_id),
    },
    {
      id: "Fees per Trainee (Nu.)",
      render: (app) =>
        `Nu. ${app.fees_per_trainee || app.feesPerTrainee || "N/A"}`,
    },
    {
      id: "Enrollment Capacity",
      render: (app) =>
        app.enrollment_capacity || app.enrollmentCapacity || "N/A",
    },
    {
      id: "Application Period",
      render: (app) =>
        app.application_start_date && app.application_end_date
          ? `${new Date(app.application_start_date).toLocaleDateString()} - ${new Date(app.application_end_date).toLocaleDateString()}`
          : "N/A",
    },
    {
      id: "Assessment Period",
      render: (app) =>
        app.course_start_date && app.course_end_date
          ? `${new Date(app.course_start_date).toLocaleDateString()} - ${new Date(app.course_end_date).toLocaleDateString()}`
          : "N/A",
    },
    {
      id: "Assessment Location",
      render: (app) => getDzongkhagName(app.training_location_id),
    },
    {
      id: "Funding Source",
      render: (app) => getFundingSourceName(app.funding_source_id),
    },
    {
      id: "Status",
      render: (app) => (
        <StatusChip
          statusId={app.status_id}
          statusList={dropdownData.statusList}
        />
      ),
    },
    {
      id: "Action",
      align: "center",
      render: (app) => (
        <IconButton
          color="primary"
          size="small"
          onClick={() => handleViewDetails(app.application_no)}
          title="View Details"
        >
          <RemoveRedEyeIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        RPL Assessment
      </Typography>

      {/* Search + Add Assessment */}
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
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              {tableColumns.map((col) => (
                <TableCell key={col.id} align={col.align || "left"}>
                  {col.id}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredApplications.length > 0 ? (
              filteredApplications
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((app, index) => (
                  <TableRow key={app.id || index}>
                    {tableColumns.map((col) => (
                      <TableCell key={col.id} align={col.align || "left"}>
                        {col.render(app, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} align="center">
                  No RPL assessment applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredApplications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Apply for RPL Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Apply for RPL Assessment</DialogTitle>
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
                      name="courseId"
                      label={
                        <>
                          <RequiredStar /> Course Name
                        </>
                      }
                      select
                      options={dropdownData.approvedCourses}
                      optionLabelKey="occupationName"
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
                          <RequiredStar /> Assessment Start Date
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
                          <RequiredStar /> Assessment End Date
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
                          <RequiredStar /> Assessment Location (Dzongkhag)
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
                          <RequiredStar /> Course/Assessment Description
                        </>
                      }
                      multiline
                      rows={3}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Required Documents for RPL Assessment <RequiredStar />
                    </Typography>
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
                  disabled={rplData.loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={rplData.loading}
                >
                  {rplData.loading ? "Submitting..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default RPLAssessment;
