import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Radio,
  MenuItem,
  IconButton,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VerifiedIcon from "@mui/icons-material/Verified";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FileUpload from "../../../components/file/FileUpload";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useFormik } from "formik";
import * as Yup from "yup";

// Table style
const tableStyle = {
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

// Quality standards data
const qualityData = [
  {
    id: "1",
    title: "QUALITY STANDARD 1: GOVERNANCE AND MANAGEMENT",
    rows: [
      {
        id: "1",
        value: "Clear organizational structure with defined TOR for all staff",
      },
      { id: "2", value: "Vision, Mission and objectives displayed" },
      { id: "3", value: "Institute rules and regulations defined" },
      { id: "4", value: "Notice / Information board available" },
      { id: "5", value: "Institute operational plan available" },
      { id: "6", value: "Internet / WiFi facilities" },
      { id: "7", value: "Institute Management Committee established" },
    ],
  },
  {
    id: "2",
    title: "QUALITY STANDARD 2: INFRASTRUCTURE AND LEARNING RESOURCES",
    rows: [
      { id: "1", value: "Minimum two office rooms" },
      { id: "2", value: "Sufficient office computers" },
      { id: "3", value: "Printer / Photocopier available" },
      { id: "4", value: "Tables and chairs" },
      { id: "5", value: "Filing racks" },
      { id: "6", value: "Proper classroom ventilation" },
      { id: "7", value: "Projector / Smart board available" },
      { id: "8", value: "Training lab available" },
    ],
  },
  {
    id: "3",
    title: "QUALITY STANDARD 3: HUMAN RESOURCES",
    rows: [
      { id: "1", value: "Trainer qualification one level higher than course" },
      { id: "2", value: "Trainer has minimum one year industry experience" },
      { id: "3", value: "Head of institute appointed" },
      {
        id: "4",
        value: "Office assistant with minimum Class XII qualification",
      },
    ],
  },
  {
    id: "4",
    title: "SUPPORTING DOCUMENTS",
    rows: [
      { id: "1", value: "Business License Uploaded" },
      { id: "2", value: "Trainer CV Uploaded" },
    ],
  },
];

// Validation Schema for Renewal
const validationSchema = Yup.object({
  // --- Institute Details (now editable) ---
  applicationNo: Yup.string().required("Application No is required"),
  registrationNo: Yup.string().required("Registration No is required"),
  registrationDate: Yup.string().required("Registration Date is required"),
  expiryDate: Yup.string().required("Expiry Date is required"),
  instituteName: Yup.string().required("Institute Name is required"),
  sector: Yup.string().required("Sector is required"),
  dzongkhag: Yup.string().required("Dzongkhag is required"),
  location: Yup.string().required("Location is required"),
  telephone: Yup.string()
    .matches(/^[0-9]{8,15}$/, "Invalid telephone number")
    .required("Telephone No is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{8}$/, "Invalid mobile number")
    .required("Mobile No is required"),
  email: Yup.string()
    .email("Invalid email")
    .required("Email Address is required"),
  website: Yup.string().url("Invalid website URL").nullable(),
  ownershipType: Yup.string().required("Type of Ownership is required"),
  bhutaneseEmployees: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Cannot be negative")
    .required("Bhutanese Nationals count is required"),
  nonBhutaneseEmployees: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Cannot be negative")
    .required("Non Bhutanese count is required"),
  businessLicenseNo: Yup.string().required("Business License No is required"),
  keyContactName: Yup.string().required("Key contact person name is required"),
  keyContactDesignation: Yup.string().required(
    "Key contact person designation is required",
  ),

  // --- Renewal Specific ---
  renewalReason: Yup.string().required("Please specify reason for renewal"),
  changesDescription: Yup.string(),

  // --- Trainers (can be updated) ---
  trainers: Yup.array()
    .of(
      Yup.object({
        nationality: Yup.string().required("Nationality is required"),
        cid: Yup.string().when("nationality", {
          is: "Bhutanese",
          then: Yup.string()
            .required("CID is required")
            .matches(/^[0-9]{11}$/, "CID must be 11 digits"),
          otherwise: Yup.string().nullable(),
        }),
        workPermit: Yup.string().when("nationality", {
          is: "Non-Bhutanese",
          then: Yup.string().required("Work Permit is required"),
          otherwise: Yup.string().nullable(),
        }),
        name: Yup.string().required("Name is required"),
        gender: Yup.string().required("Gender is required"),
        qualification: Yup.string().required("Qualification is required"),
        experience: Yup.number()
          .typeError("Enter a valid number")
          .min(0, "Experience cannot be negative")
          .required("Experience is required"),
        type: Yup.string().required("Employment type is required"),
      }),
    )
    .min(1, "At least one trainer is required"),

  // --- Course Details (can be updated) ---
  courseTitle: Yup.string().required("Course Title is required"),
  theoryHours: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Hours cannot be negative")
    .required("Theory Hours is required"),
  practicalHours: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Hours cannot be negative")
    .required("Practical Hours is required"),
  ojtHours: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Hours cannot be negative")
    .required("OJT Hours is required"),
  feesPerTrainee: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Fees cannot be negative")
    .required("Fees per Trainee is required"),
  enrollmentCapacity: Yup.number()
    .typeError("Enter a valid number")
    .min(1, "Capacity must be at least 1")
    .required("Enrollment Capacity per Batch is required"),
  courseLevel: Yup.string().required("Level Certificate/Diploma is required"),

  // --- Quality Standards (must be re-confirmed) ---
  // --- Supporting Documents (may need to upload new ones) ---
  files: Yup.array().min(1, "Upload at least one document"),
});

const RenewRegistration = () => {
  const [tabValue, setTabValue] = useState(0);
  const [qualitySelections, setQualitySelections] = useState({});
  const [trainerError, setTrainerError] = useState("");

  // Mock data - in real app, this would come from an API or props
  const mockData = {
    applicationNo: "APP-2023-001",
    registrationNo: "TVET-REG-2023-0456",
    registrationDate: "2023-06-15",
    expiryDate: "2024-06-14",
    instituteName: "Bhutan Technical Institute",
    sector: "ICT",
    dzongkhag: "Thimphu",
    location: "Changzamtok",
    telephone: "02345678",
    mobile: "17123456",
    email: "info@bti.bt",
    website: "www.bti.bt",
    ownershipType: "Private (Sole Proprietorship)",
    bhutaneseEmployees: "15",
    nonBhutaneseEmployees: "2",
    businessLicenseNo: "BL-2022-1234",
    keyContactName: "Sonam Dorji",
    keyContactDesignation: "Director",

    trainers: [
      {
        nationality: "Bhutanese",
        cid: "10101010101",
        workPermit: "",
        name: "Tashi Wangmo",
        gender: "Female",
        qualification: "Bachelor of Engineering",
        experience: "5",
        type: "Full Time",
      },
      {
        nationality: "Non-Bhutanese",
        cid: "",
        workPermit: "WP-2023-789",
        name: "John Smith",
        gender: "Male",
        qualification: "Master of Computer Science",
        experience: "8",
        type: "Full Time",
      },
    ],

    courseTitle: "Diploma in Web Development",
    theoryHours: "120",
    practicalHours: "180",
    ojtHours: "200",
    feesPerTrainee: "25000",
    enrollmentCapacity: "25",
    courseLevel: "Diploma",

    // Mock quality selections from previous registration
    qualitySelections: {
      1: {
        1: "yes",
        2: "yes",
        3: "yes",
        4: "yes",
        5: "yes",
        6: "yes",
        7: "yes",
      },
      2: {
        1: "yes",
        2: "yes",
        3: "yes",
        4: "yes",
        5: "yes",
        6: "yes",
        7: "yes",
        8: "yes",
      },
      3: {
        1: "yes",
        2: "yes",
        3: "yes",
        4: "yes",
      },
    },

    files: ["business_license.pdf", "trainer_cvs.pdf"],
  };

  const formik = useFormik({
    initialValues: {
      // --- Institute Details (pre-filled) ---
      applicationNo: mockData.applicationNo,
      registrationNo: mockData.registrationNo,
      registrationDate: mockData.registrationDate,
      expiryDate: mockData.expiryDate,
      instituteName: mockData.instituteName,
      sector: mockData.sector,
      dzongkhag: mockData.dzongkhag,
      location: mockData.location,
      telephone: mockData.telephone,
      mobile: mockData.mobile,
      email: mockData.email,
      website: mockData.website,
      ownershipType: mockData.ownershipType,
      bhutaneseEmployees: mockData.bhutaneseEmployees,
      nonBhutaneseEmployees: mockData.nonBhutaneseEmployees,
      businessLicenseNo: mockData.businessLicenseNo,
      keyContactName: mockData.keyContactName,
      keyContactDesignation: mockData.keyContactDesignation,

      // --- Renewal Specific ---
      renewalReason: "",
      changesDescription: "",

      // --- Trainers ---
      trainers: mockData.trainers,

      // --- Course Details ---
      courseTitle: mockData.courseTitle,
      theoryHours: mockData.theoryHours,
      practicalHours: mockData.practicalHours,
      ojtHours: mockData.ojtHours,
      feesPerTrainee: mockData.feesPerTrainee,
      enrollmentCapacity: mockData.enrollmentCapacity,
      courseLevel: mockData.courseLevel,

      // --- Supporting Documents ---
      files: mockData.files,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      console.log("Renewal Form Data:", values);
      console.log("Quality Checklist:", qualitySelections);
      alert("Renewal application submitted successfully!");
    },
  });

  // Initialize quality selections from mock data
  useEffect(() => {
    setQualitySelections(mockData.qualitySelections || {});
  }, []);

  const handleReset = () => {
    formik.setValues({
      ...mockData,
      renewalReason: "",
      changesDescription: "",
      files: mockData.files || [],
    });
    setQualitySelections(mockData.qualitySelections || {});
    setTrainerError("");
  };

  const handleRadioChange = (standardId, rowId, value) => {
    setQualitySelections((prev) => ({
      ...prev,
      [standardId]: {
        ...prev[standardId],
        [rowId]: value,
      },
    }));
  };

  const isLastTrainerComplete = () => {
    const trainers = formik.values.trainers;
    if (trainers.length === 0) return true;

    const lastTrainer = trainers[trainers.length - 1];
    if (!lastTrainer) return true;

    const requiredFields = [
      "nationality",
      "name",
      "gender",
      "qualification",
      "experience",
      "type",
    ];
    for (let field of requiredFields) {
      if (!lastTrainer[field] || lastTrainer[field] === "") return false;
    }

    if (
      lastTrainer.nationality === "Bhutanese" &&
      (!lastTrainer.cid || lastTrainer.cid === "")
    )
      return false;
    if (
      lastTrainer.nationality === "Non-Bhutanese" &&
      (!lastTrainer.workPermit || lastTrainer.workPermit === "")
    )
      return false;

    return true;
  };

  const isSubmitEnabled = () => {
    if (!formik.isValid) return false;

    // Check required fields
    const requiredFields = [
      "applicationNo",
      "registrationNo",
      "registrationDate",
      "expiryDate",
      "instituteName",
      "sector",
      "dzongkhag",
      "location",
      "telephone",
      "mobile",
      "email",
      "ownershipType",
      "bhutaneseEmployees",
      "nonBhutaneseEmployees",
      "businessLicenseNo",
      "keyContactName",
      "keyContactDesignation",
      "renewalReason",
      "courseTitle",
      "theoryHours",
      "practicalHours",
      "ojtHours",
      "feesPerTrainee",
      "enrollmentCapacity",
      "courseLevel",
    ];

    const allRequiredFilled = requiredFields.every(
      (field) =>
        formik.values[field] !== "" &&
        formik.values[field] !== null &&
        formik.values[field] !== undefined,
    );

    // Check trainers
    const trainersValid =
      formik.values.trainers.length > 0 &&
      formik.values.trainers.every((trainer, index) => {
        if (Object.keys(trainer).length === 0) return false;
        const trainerErrors = formik.errors.trainers?.[index];
        return !trainerErrors;
      });

    // Check quality standards (must all be confirmed)
    const allQualityFilled = qualityData
      .slice(0, 3)
      .every((standard) =>
        standard.rows.every(
          (row) =>
            qualitySelections[standard.id]?.[row.id] === "yes" ||
            qualitySelections[standard.id]?.[row.id] === "no",
        ),
      );

    const filesUploaded = formik.values.files && formik.values.files.length > 0;

    return (
      allRequiredFilled && allQualityFilled && filesUploaded && trainersValid
    );
  };

  const renderChecklist = (standard) => (
    <Grid item xs={12} key={standard.id}>
      <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }} mb={1}>
          {standard.title}
        </Typography>
        <TableContainer>
          <Table size="small" sx={tableStyle}>
            <TableHead>
              <TableRow>
                <TableCell width="60">Sl. No</TableCell>
                <TableCell>Quality Indicator</TableCell>
                <TableCell align="center">YES</TableCell>
                <TableCell align="center">NO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standard.rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell align="center">
                    <Radio
                      size="small"
                      sx={{ p: 0.25 }}
                      checked={
                        qualitySelections?.[standard.id]?.[row.id] === "yes"
                      }
                      onChange={() =>
                        handleRadioChange(standard.id, row.id, "yes")
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      size="small"
                      sx={{ p: 0.25 }}
                      checked={
                        qualitySelections?.[standard.id]?.[row.id] === "no"
                      }
                      onChange={() =>
                        handleRadioChange(standard.id, row.id, "no")
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Grid>
  );

  return (
    <Paper sx={{ p: { xs: 3, md: 4 } }}>
      <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
        Renew Registration
      </Typography>

      {/* Registration Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
        <Typography variant="body2">
          <strong>Registration No:</strong> {formik.values.registrationNo} |
          <strong> Expiry Date:</strong> {formik.values.expiryDate} |
        </Typography>
      </Alert>

      <Divider />
      <Tabs
        value={tabValue}
        onChange={(e, v) => setTabValue(v)}
        variant="fullWidth"
        sx={{
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
        }}
      >
        <Tab icon={<BusinessIcon />} label="Institute Details" />
        <Tab icon={<SchoolIcon />} label="Trainer Details" />
        <Tab icon={<MenuBookIcon />} label="Course Details" />
        <Tab icon={<VerifiedIcon />} label="Quality Standards" />
        <Tab icon={<FileOpenIcon />} label="Supporting Documents" />
      </Tabs>

      {/* --- Institute Details (Now Editable) --- */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
          <Alert severity="info" sx={{ mb: 2 }}>
            You can update institute details if there are any changes.
          </Alert>
          <Grid container spacing={2}>
            {/* Registration Information */}
            <Grid item size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Registration Information
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                label={
                  <span>
                    Application No <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="applicationNo"
                value={formik.values.applicationNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.applicationNo &&
                  Boolean(formik.errors.applicationNo)
                }
                helperText={
                  formik.touched.applicationNo && formik.errors.applicationNo
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                label={
                  <span>
                    Registration No <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="registrationNo"
                value={formik.values.registrationNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.registrationNo &&
                  Boolean(formik.errors.registrationNo)
                }
                helperText={
                  formik.touched.registrationNo && formik.errors.registrationNo
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                label={
                  <span>
                    Registration Date <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="date"
                fullWidth
                size="small"
                name="registrationDate"
                value={formik.values.registrationDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.registrationDate &&
                  Boolean(formik.errors.registrationDate)
                }
                helperText={
                  formik.touched.registrationDate &&
                  formik.errors.registrationDate
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                label={
                  <span>
                    Expiry Date <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="date"
                fullWidth
                size="small"
                name="expiryDate"
                value={formik.values.expiryDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.expiryDate && Boolean(formik.errors.expiryDate)
                }
                helperText={
                  formik.touched.expiryDate && formik.errors.expiryDate
                }
                InputLabelProps={{ shrink: true }}
                color={
                  new Date(formik.values.expiryDate) < new Date()
                    ? "error"
                    : "primary"
                }
              />
            </Grid>

            {/* Institute Details */}
            <Grid item size={{ xs: 12 }}>
              <Typography
                variant="subtitle2"
                color="primary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                Institute Details
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Name of Training Provider / Institution{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="instituteName"
                value={formik.values.instituteName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.instituteName &&
                  Boolean(formik.errors.instituteName)
                }
                helperText={
                  formik.touched.instituteName && formik.errors.instituteName
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label={
                  <span>
                    Sector <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="sector"
                value={formik.values.sector}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.sector && Boolean(formik.errors.sector)}
                helperText={formik.touched.sector && formik.errors.sector}
              >
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Health">Health</MenuItem>
                <MenuItem value="ICT">ICT</MenuItem>
                <MenuItem value="Construction">Construction</MenuItem>
                <MenuItem value="Hospitality">Hospitality</MenuItem>
                <MenuItem value="Agriculture">Agriculture</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label={
                  <span>
                    Dzongkhag <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="dzongkhag"
                value={formik.values.dzongkhag}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.dzongkhag && Boolean(formik.errors.dzongkhag)
                }
                helperText={formik.touched.dzongkhag && formik.errors.dzongkhag}
              >
                <MenuItem value="Thimphu">Thimphu</MenuItem>
                <MenuItem value="Paro">Paro</MenuItem>
                <MenuItem value="Punakha">Punakha</MenuItem>
                <MenuItem value="Wangdue">Wangdue</MenuItem>
                <MenuItem value="Chukha">Chukha</MenuItem>
                <MenuItem value="Samtse">Samtse</MenuItem>
                <MenuItem value="Sarpang">Sarpang</MenuItem>
                <MenuItem value="Trashigang">Trashigang</MenuItem>
                <MenuItem value="Mongar">Mongar</MenuItem>
                <MenuItem value="Bumthang">Bumthang</MenuItem>
              </TextField>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Location <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.location && Boolean(formik.errors.location)
                }
                helperText={formik.touched.location && formik.errors.location}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Telephone No <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="telephone"
                value={formik.values.telephone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.telephone && Boolean(formik.errors.telephone)
                }
                helperText={formik.touched.telephone && formik.errors.telephone}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Mobile No <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="mobile"
                value={formik.values.mobile}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                helperText={formik.touched.mobile && formik.errors.mobile}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Email Address <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label="Website Address"
                fullWidth
                size="small"
                name="website"
                value={formik.values.website}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.website && Boolean(formik.errors.website)}
                helperText={formik.touched.website && formik.errors.website}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Business License No <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="businessLicenseNo"
                value={formik.values.businessLicenseNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.businessLicenseNo &&
                  Boolean(formik.errors.businessLicenseNo)
                }
                helperText={
                  formik.touched.businessLicenseNo &&
                  formik.errors.businessLicenseNo
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label={
                  <span>
                    Type of Ownership <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="ownershipType"
                value={formik.values.ownershipType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.ownershipType &&
                  Boolean(formik.errors.ownershipType)
                }
                helperText={
                  formik.touched.ownershipType && formik.errors.ownershipType
                }
              >
                <MenuItem value="Corporate">Corporate</MenuItem>
                <MenuItem value="Franchise">Franchise</MenuItem>
                <MenuItem value="NGO">NGO</MenuItem>
                <MenuItem value="Private (Partnership)">
                  Private (Partnership)
                </MenuItem>
                <MenuItem value="Private (Sole Proprietorship)">
                  Private (Sole Proprietorship)
                </MenuItem>
                <MenuItem value="Public (Govt.)">Public (Govt.)</MenuItem>
              </TextField>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Bhutanese Nationals Employees{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="bhutaneseEmployees"
                value={formik.values.bhutaneseEmployees}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.bhutaneseEmployees &&
                  Boolean(formik.errors.bhutaneseEmployees)
                }
                helperText={
                  formik.touched.bhutaneseEmployees &&
                  formik.errors.bhutaneseEmployees
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Non-Bhutanese Employees{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="nonBhutaneseEmployees"
                value={formik.values.nonBhutaneseEmployees}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.nonBhutaneseEmployees &&
                  Boolean(formik.errors.nonBhutaneseEmployees)
                }
                helperText={
                  formik.touched.nonBhutaneseEmployees &&
                  formik.errors.nonBhutaneseEmployees
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Key Contact Person Name{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="keyContactName"
                value={formik.values.keyContactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.keyContactName &&
                  Boolean(formik.errors.keyContactName)
                }
                helperText={
                  formik.touched.keyContactName && formik.errors.keyContactName
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Key Contact Person Designation{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="keyContactDesignation"
                value={formik.values.keyContactDesignation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.keyContactDesignation &&
                  Boolean(formik.errors.keyContactDesignation)
                }
                helperText={
                  formik.touched.keyContactDesignation &&
                  formik.errors.keyContactDesignation
                }
              />
            </Grid>

            {/* Renewal Specific Fields */}
            <Grid item size={{ xs: 12 }}>
              <Typography
                variant="subtitle2"
                color="primary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                Renewal Information
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label={
                  <span>
                    Reason for Renewal <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="renewalReason"
                value={formik.values.renewalReason}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.renewalReason &&
                  Boolean(formik.errors.renewalReason)
                }
                helperText={
                  formik.touched.renewalReason && formik.errors.renewalReason
                }
              >
                <MenuItem value="Normal Renewal">Normal Renewal</MenuItem>
                <MenuItem value="Change in Details">Change in Details</MenuItem>
                <MenuItem value="Update Information">
                  Update Information
                </MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                label="Description of Changes (if any)"
                fullWidth
                size="small"
                name="changesDescription"
                value={formik.values.changesDescription}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Please describe any changes to institute details"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* --- Trainer Details (Editable) --- */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
          <Alert severity="info" sx={{ mb: 2 }}>
            You can update trainer information if there are any changes.
          </Alert>
          <Grid container spacing={3}>
            {formik.values.trainers.map((trainer, index) => (
              <Grid item size={{ xs: 12 }} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        select
                        label={
                          <span>
                            Nationality <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        fullWidth
                        size="small"
                        name={`trainers[${index}].nationality`}
                        value={trainer.nationality || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainers?.[index]?.nationality &&
                          Boolean(formik.errors.trainers?.[index]?.nationality)
                        }
                        helperText={
                          formik.touched.trainers?.[index]?.nationality &&
                          formik.errors.trainers?.[index]?.nationality
                        }
                      >
                        <MenuItem value="Bhutanese">Bhutanese</MenuItem>
                        <MenuItem value="Non-Bhutanese">Non-Bhutanese</MenuItem>
                      </TextField>
                    </Grid>

                    {trainer.nationality === "Bhutanese" && (
                      <Grid item size={{ xs: 12, md: 3 }}>
                        <TextField
                          label={
                            <span>
                              CID <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          fullWidth
                          size="small"
                          name={`trainers[${index}].cid`}
                          value={trainer.cid || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.trainers?.[index]?.cid &&
                            Boolean(formik.errors.trainers?.[index]?.cid)
                          }
                          helperText={
                            formik.touched.trainers?.[index]?.cid &&
                            formik.errors.trainers?.[index]?.cid
                          }
                        />
                      </Grid>
                    )}

                    {trainer.nationality === "Non-Bhutanese" && (
                      <Grid item size={{ xs: 12, md: 3 }}>
                        <TextField
                          label={
                            <span>
                              Work Permit{" "}
                              <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          fullWidth
                          size="small"
                          name={`trainers[${index}].workPermit`}
                          value={trainer.workPermit || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.trainers?.[index]?.workPermit &&
                            Boolean(formik.errors.trainers?.[index]?.workPermit)
                          }
                          helperText={
                            formik.touched.trainers?.[index]?.workPermit &&
                            formik.errors.trainers?.[index]?.workPermit
                          }
                        />
                      </Grid>
                    )}

                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        label={
                          <span>
                            Name <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        fullWidth
                        size="small"
                        name={`trainers[${index}].name`}
                        value={trainer.name || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainers?.[index]?.name &&
                          Boolean(formik.errors.trainers?.[index]?.name)
                        }
                        helperText={
                          formik.touched.trainers?.[index]?.name &&
                          formik.errors.trainers?.[index]?.name
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        select
                        label={
                          <span>
                            Gender <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        fullWidth
                        size="small"
                        name={`trainers[${index}].gender`}
                        value={trainer.gender || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainers?.[index]?.gender &&
                          Boolean(formik.errors.trainers?.[index]?.gender)
                        }
                        helperText={
                          formik.touched.trainers?.[index]?.gender &&
                          formik.errors.trainers?.[index]?.gender
                        }
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        label={
                          <span>
                            Qualification{" "}
                            <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        fullWidth
                        size="small"
                        name={`trainers[${index}].qualification`}
                        value={trainer.qualification || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainers?.[index]?.qualification &&
                          Boolean(
                            formik.errors.trainers?.[index]?.qualification,
                          )
                        }
                        helperText={
                          formik.touched.trainers?.[index]?.qualification &&
                          formik.errors.trainers?.[index]?.qualification
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        label={
                          <span>
                            Experience (Years){" "}
                            <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        type="number"
                        fullWidth
                        size="small"
                        name={`trainers[${index}].experience`}
                        value={trainer.experience || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainers?.[index]?.experience &&
                          Boolean(formik.errors.trainers?.[index]?.experience)
                        }
                        helperText={
                          formik.touched.trainers?.[index]?.experience &&
                          formik.errors.trainers?.[index]?.experience
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        select
                        label={
                          <span>
                            Type <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        fullWidth
                        size="small"
                        name={`trainers[${index}].type`}
                        value={trainer.type || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.trainers?.[index]?.type &&
                          Boolean(formik.errors.trainers?.[index]?.type)
                        }
                        helperText={
                          formik.touched.trainers?.[index]?.type &&
                          formik.errors.trainers?.[index]?.type
                        }
                      >
                        <MenuItem value="Full Time">Full Time</MenuItem>
                        <MenuItem value="Part Time">Part Time</MenuItem>
                      </TextField>
                    </Grid>

                    {index > 0 && (
                      <Grid item size={{ xs: 12, md: 1 }}>
                        <IconButton
                          color="error"
                          onClick={() => {
                            const updated = [...formik.values.trainers];
                            updated.splice(index, 1);
                            formik.setFieldValue("trainers", updated);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
              {trainerError && (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                  {trainerError}
                </Typography>
              )}

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  if (!isLastTrainerComplete()) {
                    setTrainerError(
                      "Please fill all fields for the current trainer before adding a new one",
                    );
                    return;
                  }

                  setTrainerError("");
                  formik.setFieldValue("trainers", [
                    ...formik.values.trainers,
                    {
                      nationality: "",
                      cid: "",
                      workPermit: "",
                      name: "",
                      gender: "",
                      qualification: "",
                      experience: "",
                      type: "",
                    },
                  ]);
                }}
              >
                Add Trainer
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* --- Course Details (Editable) --- */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
          <Alert severity="info" sx={{ mb: 2 }}>
            Update course details if there are any changes.
          </Alert>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Course Title <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="courseTitle"
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
                label={
                  <span>
                    Theory (Hours) <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="theoryHours"
                value={formik.values.theoryHours}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.theoryHours &&
                  Boolean(formik.errors.theoryHours)
                }
                helperText={
                  formik.touched.theoryHours && formik.errors.theoryHours
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Practical (Hours) <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="practicalHours"
                value={formik.values.practicalHours}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.practicalHours &&
                  Boolean(formik.errors.practicalHours)
                }
                helperText={
                  formik.touched.practicalHours && formik.errors.practicalHours
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    OJT (Hours) <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="ojtHours"
                value={formik.values.ojtHours}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.ojtHours && Boolean(formik.errors.ojtHours)
                }
                helperText={formik.touched.ojtHours && formik.errors.ojtHours}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Fees per Trainee <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="feesPerTrainee"
                value={formik.values.feesPerTrainee}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.feesPerTrainee &&
                  Boolean(formik.errors.feesPerTrainee)
                }
                helperText={
                  formik.touched.feesPerTrainee && formik.errors.feesPerTrainee
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                label={
                  <span>
                    Enrollment Capacity per Batch{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                type="number"
                fullWidth
                size="small"
                name="enrollmentCapacity"
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
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label={
                  <span>
                    Level Certificate / Diploma{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                fullWidth
                size="small"
                name="courseLevel"
                value={formik.values.courseLevel || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.courseLevel &&
                  Boolean(formik.errors.courseLevel)
                }
                helperText={
                  formik.touched.courseLevel && formik.errors.courseLevel
                }
              >
                <MenuItem value="Certificate">Certificate</MenuItem>
                <MenuItem value="Diploma">Diploma</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* --- Quality Standards (Must be re-confirmed) --- */}
      {tabValue === 3 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item size={{ xs: 12 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please confirm that all quality standards are still being met.
            </Alert>
            {qualityData
              .slice(0, 3)
              .map((standard) => renderChecklist(standard))}
          </Grid>
        </Grid>
      )}

      {/* --- Supporting Documents --- */}
      {tabValue === 4 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {qualityData.slice(3).map((standard) => (
            <Grid item size={{ xs: 12 }} key={standard.id}>
              <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {standard.title} <span style={{ color: "red" }}>*</span>
                </Typography>
                <Box
                  component="ol"
                  sx={{
                    pl: 3,
                    mb: 2,
                    "& li": {
                      fontSize: "0.85rem",
                      fontStyle: "italic",
                      mb: 0.5,
                    },
                  }}
                >
                  <li>Updated business license (if renewed)</li>
                  <li>Updated trainer CVs (if changed)</li>
                  <li>Annual report / Compliance report</li>
                </Box>

                {/* Display existing files */}
                {formik.values.files && formik.values.files.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Previously uploaded files:
                    </Typography>
                    {formik.values.files.map((file, idx) => (
                      <Chip
                        key={idx}
                        icon={<CheckCircleIcon />}
                        label={typeof file === "string" ? file : file.name}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}

                <FileUpload
                  files={formik.values.files}
                  onFilesChange={(files) =>
                    formik.setFieldValue("files", files)
                  }
                />
                {formik.touched.files && formik.errors.files && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {formik.errors.files}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Submit & Reset Buttons */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            size="small"
            disabled={!isSubmitEnabled()}
            onClick={formik.handleSubmit}
          >
            Submit Renewal
          </Button>
        </Grid>
        <Grid item>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={handleReset}
            startIcon={<RotateLeftIcon />}
          >
            Reset Changes
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RenewRegistration;
