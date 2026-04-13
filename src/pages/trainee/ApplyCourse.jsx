import { useState } from "react";
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
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import FileUpload from "../../components/file/FileUplaod";
import { toast } from "react-toastify";

/* ---------- Static Data ---------- */

const dzongkhags = ["Thimphu", "Paro", "Punakha", "Wangdue"];
const traineeTypes = ["In-service", "School Leaver", "Job Seeker"];
const employmentStatuses = ["Employed", "Unemployed", "Student"];
const academicQualifications = ["Class X", "Class XII", "Diploma", "Degree"];
const parentOccupations = ["Farmer", "Government Employee", "Private Employee"];
const maritalStatuses = ["Single", "Married"];

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

  name: Yup.string().required("Name required"),

  email: Yup.string().email("Invalid email format").required("Email required"),

  mobileNo: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile must be exactly 8 digits")
    .required("Mobile required"),

  traineeType: Yup.string().required("Select trainee type"),
  employmentStatus: Yup.string().required("Select employment status"),
  academicQualification: Yup.string().required("Select qualification"),

  presentDzongkhag: Yup.string().required("Dzongkhag required"),
  presentGewog: Yup.string().required("Gewog required"),

  parentOccupation: Yup.string().required("Select occupation"),
  parentMaritalStatus: Yup.string().required("Select marital status"),

  files: Yup.array().min(1, "Upload at least one document"),
});

/* ---------- Component ---------- */

const ApplyCourse = () => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      hasCid: "yes",
      cidNo: "",
      referenceNo: "",
      name: "",
      dob: "",
      gender: "",
      email: "",
      mobileNo: "",
      traineeType: "",
      employmentStatus: "",
      academicQualification: "",
      remarks: "",
      permanentDzongkhag: "",
      permanentGewog: "",
      permanentVillage: "",
      presentDzongkhag: "",
      presentGewog: "",
      parentOccupation: "",
      parentMaritalStatus: "",
      files: [],
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setLoading(true);
      setTimeout(() => {
        console.log(values);
        toast.success("Application submitted successfully");
        setLoading(false);
      }, 1000);
    },
  });

  return (
    <Box sx={{ m: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }} elevation={3}>
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ textAlign: "center", mb: 4 }}
        >
          Apply for Course
        </Typography>

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
                  onChange={formik.handleChange}
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
                      }
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.cidNo && Boolean(formik.errors.cidNo)}
                    helperText={formik.touched.cidNo && formik.errors.cidNo}
                  />
                </Grid>
              )}

              {formik.values.hasCid === "no" && (
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
              )}

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

              {formik.values.hasCid === "no" && (
                <>
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
                      label="Gender"
                      name="gender"
                      size="small"
                      fullWidth
                      value={formik.values.gender}
                      onChange={formik.handleChange}
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
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
                  name="traineeType"
                  size="small"
                  fullWidth
                  value={formik.values.traineeType}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {traineeTypes.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Employment Status"
                  name="employmentStatus"
                  size="small"
                  fullWidth
                  value={formik.values.employmentStatus}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {employmentStatuses.map((e) => (
                    <MenuItem key={e} value={e}>
                      {e}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Academic Qualification"
                  name="academicQualification"
                  size="small"
                  fullWidth
                  value={formik.values.academicQualification}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {academicQualifications.map((q) => (
                    <MenuItem key={q} value={q}>
                      {q}
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
                  name="presentDzongkhag"
                  size="small"
                  fullWidth
                  value={formik.values.presentDzongkhag}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Gewog"
                  name="presentGewog"
                  size="small"
                  fullWidth
                  value={formik.values.presentGewog}
                  onChange={formik.handleChange}
                />
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
                  name="parentOccupation"
                  size="small"
                  fullWidth
                  value={formik.values.parentOccupation}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {parentOccupations.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Marital Status of Parents"
                  name="parentMaritalStatus"
                  size="small"
                  fullWidth
                  value={formik.values.parentMaritalStatus}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {maritalStatuses.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
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
