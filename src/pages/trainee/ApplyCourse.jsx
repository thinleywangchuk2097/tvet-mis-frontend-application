import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Button,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Card,
  CardContent,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import FileUpload from "../../components/file/FileUpload";
import { toast } from "react-toastify";
import CommonService from "../../api/services/internal/common/CommonService";
import CourseEnrollmentService from "../../api/services/internal/course/CourseEnrollmentService";
import DatahubService from "../../api/services/external/datahub/DatahubService";

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

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/* ---------- Validation ---------- */

const validationSchema = Yup.object({
  hasCid: Yup.string().required(),

  cidNo: Yup.string().when("hasCid", {
    is: "yes",
    then: (schema) =>
      schema
        .matches(/^[0-9]{11}$/, "Citizen ID must be exactly 11 digits")
        .required("Citizen ID No required"),
  }),

  referenceNo: Yup.string().when("hasCid", {
    is: "no",
    then: (schema) => schema.required("Reference No required"),
  }),

  name: Yup.string().when("hasCid", {
    is: "yes",
    then: (schema) => schema.required("Name required"),
    otherwise: (schema) => schema.required("Name required"),
  }),

  genderId: Yup.string().when("hasCid", {
    is: "no",
    then: (schema) => schema.required("Gender is required"),
  }),

  email: Yup.string().email("Invalid email format").required("Email required"),

  mobileNo: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile must be exactly 8 digits")
    .required("Mobile required"),

  traineeTypeId: Yup.string().required("Select trainee type"),
  employmentStatusId: Yup.string().required("Select employment status"),
  academicQualificationId: Yup.string().required("Select qualification"),

  presentDzongkhagId: Yup.string().required("Dzongkhag required"),
  presentGewogId: Yup.string().required("Gewog required"),

  parentOccupationId: Yup.string().required("Select occupation"),
  parentMaritalStatusId: Yup.string().required("Select marital status"),

  files: Yup.array().min(1, "Upload at least one document"),
});

/* ---------- Component ---------- */

const ApplyCourse = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [fetchingCourse, setFetchingCourse] = useState(true);
  const [fetchingCitizen, setFetchingCitizen] = useState(false);
  const [fetchingGewogs, setFetchingGewogs] = useState(false);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [genders, setGenders] = useState([]);
  const [traineeTypes, setTraineeTypes] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [parentOccupations, setParentOccupations] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [gewogs, setGewogs] = useState([]);

  // Fetch dzongkhags and other data on component mount
  useEffect(() => {
    fetchDzongkhags();
    fetchGenders();
    fetchTraineeType();
    fetchEmploymentStatus();
    fetchAcademicQualification();
    fetchParentalOccupation();
    fetchMaritalStatus();
  }, []);

  // Fetch course details based on application number
  useEffect(() => {
    if (applicationNo) {
      fetchCourseDetails();
    }
  }, [applicationNo]);

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
      console.log("Dzongkhags:", dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchGewogDetails = async (dzongkhagId) => {
    if (!dzongkhagId) return;

    setFetchingGewogs(true);
    try {
      const gewogLists = await CommonService.getGewogByDzongkhagId(dzongkhagId);
      setGewogs(gewogLists.data);
      console.log("Gewogs:", gewogLists.data);
    } catch (error) {
      console.error("Error fetching Gewogs:", error);
      toast.error("Failed to fetch gewogs");
    } finally {
      setFetchingGewogs(false);
    }
  };

  const fetchGenders = async () => {
    try {
      const genderDt = await CommonService.getByParentId(8);
      setGenders(genderDt.data);
      console.log("Genders:", genderDt.data);
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchTraineeType = async () => {
    try {
      const TraineeType = await CommonService.getByParentId(21);
      setTraineeTypes(TraineeType.data);
      console.log("Trainee Type:", TraineeType.data);
    } catch (error) {
      console.error("Error fetching Trainee Type:", error);
    }
  };

  const fetchEmploymentStatus = async () => {
    try {
      const EmploymentStatus = await CommonService.getByParentId(17);
      setEmploymentStatuses(EmploymentStatus.data);
      console.log("Employment Status :", EmploymentStatus.data);
    } catch (error) {
      console.error("Error fetching Employment Status:", error);
    }
  };

  const fetchAcademicQualification = async () => {
    try {
      const AcademicQualification = await CommonService.getByParentId(18);
      setAcademicQualifications(AcademicQualification.data);
      console.log("Academic Qualification :", AcademicQualification.data);
    } catch (error) {
      console.error("Error fetching Academic Qualification :", error);
    }
  };

  const fetchParentalOccupation = async () => {
    try {
      const ParentalOccupation = await CommonService.getByParentId(19);
      setParentOccupations(ParentalOccupation.data);
      console.log("Parental Occupation :", ParentalOccupation.data);
    } catch (error) {
      console.error("Error fetching Parental Occupation :", error);
    }
  };

  const fetchMaritalStatus = async () => {
    try {
      const MaritalStatus = await CommonService.getByParentId(20);
      setMaritalStatuses(MaritalStatus.data);
      console.log("Marital Status :", MaritalStatus.data);
    } catch (error) {
      console.error("Error fetching Marital Status :", error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      setFetchingCourse(true);
      const response =
        await CommonService.getCourseAnnouncementByApplicationNo(applicationNo);
      // Handle response that returns an array
      const courseData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCourseDetails(courseData);
      console.log("Course Details:", courseData);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details");
    } finally {
      setFetchingCourse(false);
    }
  };

  // Function to fetch citizen details from Datahub
  const fetchCitizenDetails = async (citizenId) => {
    if (!citizenId || citizenId.length !== 11) {
      return;
    }

    setFetchingCitizen(true);
    try {
      const response =
        await DatahubService.getDetailsByCitizenshipNo(citizenId);
      const citizenData =
        response.data?.citizenDetailsResponse?.citizenDetail?.[0];

      if (citizenData) {
        // Construct full name from firstName and lastName
        const fullName =
          `${citizenData.firstName || ""} ${citizenData.lastName || ""}`.trim();

        // Update the name field
        formik.setFieldValue("name", fullName);

        // Auto-set gender if available
        if (citizenData.gender) {
          const genderMap = {
            Male: "1",
            Female: "2",
          };
          const genderId = genderMap[citizenData.gender];
          if (genderId) {
            formik.setFieldValue("genderId", genderId);
          }
        }

        toast.success("Citizen details fetched successfully");
      } else {
        toast.warning("No citizen found with this ID");
        formik.setFieldValue("name", "");
        formik.setFieldValue("genderId", "");
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error("Failed to fetch citizen details");
      formik.setFieldValue("name", "");
      formik.setFieldValue("genderId", "");
    } finally {
      setFetchingCitizen(false);
    }
  };

  // Create debounced version of fetchCitizenDetails
  const debouncedFetchCitizen = useCallback(
    debounce((citizenId) => {
      if (citizenId && citizenId.length === 11) {
        fetchCitizenDetails(citizenId);
      }
    }, 500),
    [],
  );

  const formik = useFormik({
    initialValues: {
      hasCid: "yes",
      cidNo: "",
      referenceNo: "",
      name: "",
      dob: "",
      genderId: "",
      email: "",
      mobileNo: "",
      traineeTypeId: "",
      employmentStatusId: "",
      academicQualificationId: "",
      remarks: "",
      permanentDzongkhag: "",
      permanentGewog: "",
      permanentVillage: "",
      presentDzongkhagId: "",
      presentGewogId: "",
      parentOccupationId: "",
      parentMaritalStatusId: "",
      files: [],
      applicationNo: applicationNo || "",
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Convert files to base64
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        // Prepare payload for API
        const payload = {
          applicationNo: values.applicationNo,
          cidNo: values.cidNo,
          referenceNo: values.referenceNo,
          name: values.name,
          dob: values.dob,
          genderId: values.genderId ? parseInt(values.genderId) : null,
          email: values.email,
          mobileNo: values.mobileNo,
          traineeTypeId: values.traineeTypeId
            ? parseInt(values.traineeTypeId)
            : null,
          employmentStatusId: values.employmentStatusId
            ? parseInt(values.employmentStatusId)
            : null,
          academicQualificationId: values.academicQualificationId
            ? parseInt(values.academicQualificationId)
            : null,
          remarks: values.remarks,
          presentDzongkhagId: values.presentDzongkhagId
            ? parseInt(values.presentDzongkhagId)
            : null,
          presentGewogId: values.presentGewogId
            ? parseInt(values.presentGewogId)
            : null,
          parentOccupationId: values.parentOccupationId
            ? parseInt(values.parentOccupationId)
            : null,
          parentMaritalStatusId: values.parentMaritalStatusId
            ? parseInt(values.parentMaritalStatusId)
            : null,
          statusId: 89,
          serviceId: 40,
          documents: documents,
        };
        console.log("Submitting application:", payload);
        // Call API to submit course application
        const response = await CourseEnrollmentService.submitTrainee(payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Applied submitted successfully!");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error submitting application:", error);
        toast.error(
          error.response?.data?.message || "Failed to submit application",
        );
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch gewogs when presentDzongkhagId changes
  useEffect(() => {
    if (formik.values.presentDzongkhagId) {
      fetchGewogDetails(formik.values.presentDzongkhagId);
    } else {
      // Clear gewogs if no dzongkhag selected
      setGewogs([]);
      formik.setFieldValue("presentGewogId", "");
    }
  }, [formik.values.presentDzongkhagId]);

  if (fetchingCourse) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ m: { xs: 1, md: 1 } }}>
      <Paper sx={{ p: { xs: 2, md: 4 } }} elevation={2}>
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ textAlign: "center", mb: 4 }}
        >
          Apply for Course
        </Typography>

        {/* Course Information Card */}
        {courseDetails && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Application No:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {courseDetails.application_no}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Course Name:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {courseDetails.course_name}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Course Fee:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Nu. {courseDetails.course_fee}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Seats:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {courseDetails.total_no_trainees}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Course Period:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {courseDetails.course_start_date &&
                    courseDetails.course_end_date
                      ? `${new Date(courseDetails.course_start_date).toLocaleDateString()} - ${new Date(courseDetails.course_end_date).toLocaleDateString()}`
                      : "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <form onSubmit={formik.handleSubmit}>
          {/* ---------- Applicant Details ---------- */}

          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography fontWeight={600}>Applicant Details</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                <FormLabel>Has Citizen ID Number?</FormLabel>
                <RadioGroup
                  row
                  name="hasCid"
                  value={formik.values.hasCid}
                  onChange={(e) => {
                    formik.handleChange(e);
                    // Reset fields when switching
                    formik.setFieldValue("cidNo", "");
                    formik.setFieldValue("name", "");
                    formik.setFieldValue("dob", "");
                    formik.setFieldValue("genderId", "");
                  }}
                >
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Yes"
                  />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </Grid>

              {formik.values.hasCid === "yes" && (
                <>
                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Citizen ID No"
                      name="cidNo"
                      size="small"
                      value={formik.values.cidNo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 11) {
                          formik.setFieldValue("cidNo", value);
                          // Debounced fetch as user types
                          if (value.length === 11) {
                            debouncedFetchCitizen(value);
                          } else if (value.length < 11) {
                            // Clear name and gender if CID is incomplete
                            formik.setFieldValue("name", "");
                            formik.setFieldValue("genderId", "");
                          }
                        }
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.cidNo && Boolean(formik.errors.cidNo)
                      }
                      helperText={formik.touched.cidNo && formik.errors.cidNo}
                      InputProps={{
                        endAdornment: fetchingCitizen && (
                          <CircularProgress size={20} />
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      size="small"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </Grid>
                </>
              )}

              {formik.values.hasCid === "no" && (
                <>
                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Reference No"
                      name="referenceNo"
                      size="small"
                      value={formik.values.referenceNo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.referenceNo &&
                        Boolean(formik.errors.referenceNo)
                      }
                      helperText={
                        formik.touched.referenceNo && formik.errors.referenceNo
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      size="small"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      type="date"
                      label="Date of Birth"
                      name="dob"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.dob}
                      onChange={formik.handleChange}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Gender"
                      name="genderId"
                      size="small"
                      value={formik.values.genderId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.genderId &&
                        Boolean(formik.errors.genderId)
                      }
                      helperText={
                        formik.touched.genderId && formik.errors.genderId
                      }
                    >
                      <MenuItem value="">Select</MenuItem>
                      {genders.map((gender) => (
                        <MenuItem key={gender.id} value={gender.id.toString()}>
                          {gender.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Email"
                  name="email"
                  size="small"
                  fullWidth
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Mobile No (+975)"
                  name="mobileNo"
                  size="small"
                  fullWidth
                  value={formik.values.mobileNo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 8) {
                      formik.setFieldValue("mobileNo", value);
                    }
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                  }
                  helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Trainee Type"
                  name="traineeTypeId"
                  size="small"
                  fullWidth
                  value={formik.values.traineeTypeId}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.traineeTypeId &&
                    Boolean(formik.errors.traineeTypeId)
                  }
                  helperText={
                    formik.touched.traineeTypeId && formik.errors.traineeTypeId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {traineeTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Employment Status"
                  name="employmentStatusId"
                  size="small"
                  fullWidth
                  value={formik.values.employmentStatusId}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.employmentStatusId &&
                    Boolean(formik.errors.employmentStatusId)
                  }
                  helperText={
                    formik.touched.employmentStatusId &&
                    formik.errors.employmentStatusId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {employmentStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Academic Qualification"
                  name="academicQualificationId"
                  size="small"
                  fullWidth
                  value={formik.values.academicQualificationId}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.academicQualificationId &&
                    Boolean(formik.errors.academicQualificationId)
                  }
                  helperText={
                    formik.touched.academicQualificationId &&
                    formik.errors.academicQualificationId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {academicQualifications.map((qualification) => (
                    <MenuItem
                      key={qualification.id}
                      value={qualification.id.toString()}
                    >
                      {qualification.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Remarks"
                  name="remarks"
                  multiline
                  rows={2}
                  size="small"
                  fullWidth
                  value={formik.values.remarks}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ---------- Present Address ---------- */}

          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography fontWeight={600}>Present Address</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Dzongkhag"
                  name="presentDzongkhagId"
                  size="small"
                  fullWidth
                  value={formik.values.presentDzongkhagId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    // Reset gewog when dzongkhag changes
                    formik.setFieldValue("presentGewogId", "");
                  }}
                  error={
                    formik.touched.presentDzongkhagId &&
                    Boolean(formik.errors.presentDzongkhagId)
                  }
                  helperText={
                    formik.touched.presentDzongkhagId &&
                    formik.errors.presentDzongkhagId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((dzongkhag) => (
                    <MenuItem
                      key={dzongkhag.id}
                      value={dzongkhag.id.toString()}
                    >
                      {dzongkhag.dzonkhagName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Gewog"
                  name="presentGewogId"
                  size="small"
                  fullWidth
                  value={formik.values.presentGewogId}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.presentGewogId &&
                    Boolean(formik.errors.presentGewogId)
                  }
                  helperText={
                    formik.touched.presentGewogId &&
                    formik.errors.presentGewogId
                  }
                  disabled={!formik.values.presentDzongkhagId || fetchingGewogs}
                  InputProps={{
                    endAdornment: fetchingGewogs && (
                      <CircularProgress size={20} />
                    ),
                  }}
                >
                  <MenuItem value="">Select</MenuItem>
                  {gewogs.map((gewog) => (
                    <MenuItem key={gewog.id} value={gewog.id.toString()}>
                      {gewog.gewogName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* ---------- Parental Details ---------- */}

          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography fontWeight={600}>Parental Details</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Parental Occupation"
                  name="parentOccupationId"
                  size="small"
                  fullWidth
                  value={formik.values.parentOccupationId}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.parentOccupationId &&
                    Boolean(formik.errors.parentOccupationId)
                  }
                  helperText={
                    formik.touched.parentOccupationId &&
                    formik.errors.parentOccupationId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {parentOccupations.map((occupation) => (
                    <MenuItem
                      key={occupation.id}
                      value={occupation.id.toString()}
                    >
                      {occupation.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Marital Status of Parents"
                  name="parentMaritalStatusId"
                  size="small"
                  fullWidth
                  value={formik.values.parentMaritalStatusId}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.parentMaritalStatusId &&
                    Boolean(formik.errors.parentMaritalStatusId)
                  }
                  helperText={
                    formik.touched.parentMaritalStatusId &&
                    formik.errors.parentMaritalStatusId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {maritalStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* ---------- Supporting Documents ---------- */}

          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography fontWeight={600}>Supporting Documents</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Document size should not be more than 1 MB per attachment
            </Typography>

            <FileUpload
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
              error={formik.touched.files && Boolean(formik.errors.files)}
              helperText={formik.touched.files && formik.errors.files}
            />
          </Paper>

          {/* ---------- Buttons ---------- */}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={18} /> : <ArrowUpwardIcon />
              }
            >
              Submit
            </Button>

            <Button
              type="button"
              color="error"
              variant="contained"
              size="small"
              startIcon={<LockResetIcon />}
              onClick={() => formik.resetForm()}
            >
              Reset
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ApplyCourse;
