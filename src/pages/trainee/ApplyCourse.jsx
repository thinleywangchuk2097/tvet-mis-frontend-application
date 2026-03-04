import React, { useState } from "react";
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
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUpload from "../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";

// ===== Static Data =====
const dzongkhags = [
  { id: 1, name: "Thimphu" },
  { id: 2, name: "Paro" },
  { id: 3, name: "Punakha" },
  { id: 4, name: "Wangdue" },
  { id: 5, name: "Bumthang" },
];

const academicQualifications = [
  { id: 1, name: "High School" },
  { id: 2, name: "Diploma" },
  { id: 3, name: "Bachelor's" },
  { id: 4, name: "Master's" },
];

const employmentStatuses = [
  { id: 1, name: "Employed" },
  { id: 2, name: "Unemployed" },
  { id: 3, name: "Student" },
];

const maritalStatuses = [
  { id: 1, name: "Single" },
  { id: 2, name: "Married" },
];

const parentOccupations = [
  { id: 1, name: "Farmer" },
  { id: 2, name: "Government Employee" },
  { id: 3, name: "Private Employee" },
];

// ===== Validation Schema =====
const validationSchema = Yup.object({
  referenceNo: Yup.string().required("Reference No is required"),
  name: Yup.string().required("Name is required"),
  dateOfBirth: Yup.date().required("Date of Birth is required"),
  gender: Yup.string().required("Gender is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  mobileNo: Yup.string()
    .matches(/^\d{8}$/, "Mobile No must be exactly 8 digits")
    .required("Mobile No is required"),
  academicQualification: Yup.string().required(
    "Academic Qualification is required",
  ),
  employmentStatus: Yup.string().required("Employment Status is required"),
  maritalStatus: Yup.string().required("Marital Status is required"),
  remarks: Yup.string(),

  permanentDzongkhag: Yup.string().required("Permanent Dzongkhag is required"),
  permanentGewog: Yup.string().required("Permanent Gewog is required"),
  permanentVillage: Yup.string().required("Permanent Village is required"),

  presentDzongkhag: Yup.string().required("Present Dzongkhag is required"),
  presentGewog: Yup.string().required("Present Gewog is required"),

  parentOccupation: Yup.string().required("Parental Occupation is required"),
  parentMaritalStatus: Yup.string().required(
    "Parental Marital Status is required",
  ),
  parentContactNo: Yup.string()
    .matches(/^\d{8}$/, "Parental Contact No must be exactly 8 digits")
    .required("Parental Contact No is required"),

  files: Yup.array().min(1, "Please upload at least one supporting document"),
});

// ===== Component =====
const ApplyCourse = () => {
  const [loading, setLoading] = useState(false);

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

  const formik = useFormik({
    initialValues: {
      referenceNo: "",
      name: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      mobileNo: "",
      academicQualification: "",
      employmentStatus: "",
      maritalStatus: "",
      remarks: "",
      permanentDzongkhag: "",
      permanentGewog: "",
      permanentVillage: "",
      presentDzongkhag: "",
      presentGewog: "",
      parentOccupation: "",
      parentMaritalStatus: "",
      parentContactNo: "",
      files: [],
    },
    validationSchema,
    validateOnChange: true, // validate while typing
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );
        const payload = { ...values, documents };
        console.log("Payload:", payload);

        // simulate API call
        setTimeout(() => {
          toast.success("Application submitted successfully!");
          resetForm();
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast.error("Submission failed");
        setLoading(false);
      }
    },
  });

  return (
    <Box sx={{ m: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }} elevation={3}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h5" fontWeight={600} display="inline">
            Apply for Course
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          {/* ===== Applicant Details ===== */}
          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Applicant Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
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
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
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
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  type="date"
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.dateOfBirth &&
                    Boolean(formik.errors.dateOfBirth)
                  }
                  helperText={
                    formik.touched.dateOfBirth && formik.errors.dateOfBirth
                  }
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  name="gender"
                  size="small"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.gender && Boolean(formik.errors.gender)}
                  helperText={formik.touched.gender && formik.errors.gender}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  size="small"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Mobile No"
                  name="mobileNo"
                  size="small"
                  value={formik.values.mobileNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                  }
                  helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Academic Qualification"
                  name="academicQualification"
                  size="small"
                  value={formik.values.academicQualification}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.academicQualification &&
                    Boolean(formik.errors.academicQualification)
                  }
                  helperText={
                    formik.touched.academicQualification &&
                    formik.errors.academicQualification
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {academicQualifications.map((q) => (
                    <MenuItem key={q.id} value={q.name}>
                      {q.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Employment Status"
                  name="employmentStatus"
                  size="small"
                  value={formik.values.employmentStatus}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.employmentStatus &&
                    Boolean(formik.errors.employmentStatus)
                  }
                  helperText={
                    formik.touched.employmentStatus &&
                    formik.errors.employmentStatus
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {employmentStatuses.map((s) => (
                    <MenuItem key={s.id} value={s.name}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Marital Status"
                  name="maritalStatus"
                  size="small"
                  value={formik.values.maritalStatus}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.maritalStatus &&
                    Boolean(formik.errors.maritalStatus)
                  }
                  helperText={
                    formik.touched.maritalStatus && formik.errors.maritalStatus
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {maritalStatuses.map((m) => (
                    <MenuItem key={m.id} value={m.name}>
                      {m.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  size="small"
                  multiline
                  rows={2}
                  value={formik.values.remarks}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Permanent Address ===== */}
          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Permanent Address
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Dzongkhag"
                  name="permanentDzongkhag"
                  size="small"
                  value={formik.values.permanentDzongkhag}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.permanentDzongkhag &&
                    Boolean(formik.errors.permanentDzongkhag)
                  }
                  helperText={
                    formik.touched.permanentDzongkhag &&
                    formik.errors.permanentDzongkhag
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((d) => (
                    <MenuItem key={d.id} value={d.name}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Gewog"
                  name="permanentGewog"
                  size="small"
                  value={formik.values.permanentGewog}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.permanentGewog &&
                    Boolean(formik.errors.permanentGewog)
                  }
                  helperText={
                    formik.touched.permanentGewog &&
                    formik.errors.permanentGewog
                  }
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Village"
                  name="permanentVillage"
                  size="small"
                  value={formik.values.permanentVillage}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.permanentVillage &&
                    Boolean(formik.errors.permanentVillage)
                  }
                  helperText={
                    formik.touched.permanentVillage &&
                    formik.errors.permanentVillage
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Present Address ===== */}
          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Present Address
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Dzongkhag"
                  name="presentDzongkhag"
                  size="small"
                  value={formik.values.presentDzongkhag}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.presentDzongkhag &&
                    Boolean(formik.errors.presentDzongkhag)
                  }
                  helperText={
                    formik.touched.presentDzongkhag &&
                    formik.errors.presentDzongkhag
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((d) => (
                    <MenuItem key={d.id} value={d.name}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Gewog"
                  name="presentGewog"
                  size="small"
                  value={formik.values.presentGewog}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.presentGewog &&
                    Boolean(formik.errors.presentGewog)
                  }
                  helperText={
                    formik.touched.presentGewog && formik.errors.presentGewog
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Parental Details ===== */}
          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Parental Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Parental Occupation"
                  name="parentOccupation"
                  size="small"
                  value={formik.values.parentOccupation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.parentOccupation &&
                    Boolean(formik.errors.parentOccupation)
                  }
                  helperText={
                    formik.touched.parentOccupation &&
                    formik.errors.parentOccupation
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {parentOccupations.map((p) => (
                    <MenuItem key={p.id} value={p.name}>
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Marital Status of Parents"
                  name="parentMaritalStatus"
                  size="small"
                  value={formik.values.parentMaritalStatus}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.parentMaritalStatus &&
                    Boolean(formik.errors.parentMaritalStatus)
                  }
                  helperText={
                    formik.touched.parentMaritalStatus &&
                    formik.errors.parentMaritalStatus
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {maritalStatuses.map((m) => (
                    <MenuItem key={m.id} value={m.name}>
                      {m.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="Parental/Guardian Contact No"
                  name="parentContactNo"
                  size="small"
                  value={formik.values.parentContactNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.parentContactNo &&
                    Boolean(formik.errors.parentContactNo)
                  }
                  helperText={
                    formik.touched.parentContactNo &&
                    formik.errors.parentContactNo
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Supporting Documents ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Supporting Documents
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Attach the file: <br />
              [Document size should not be more than 1 MB for each attachment]{" "}
              <br />
              (Note: For Skills Development Plan, please attach your highest
              academic qualification certificate.)
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <FileUpload
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
            />
            {formik.touched.files && formik.errors.files && (
              <Typography color="error" variant="caption">
                {formik.errors.files}
              </Typography>
            )}
          </Paper>

          {/* ===== Submit & Reset Buttons ===== */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 3,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <ArrowUpwardIcon />
              }
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>

            <Button
              type="button"
              variant="contained"
              size="small"
              color="error"
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
