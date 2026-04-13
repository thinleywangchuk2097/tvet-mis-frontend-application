import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import FileUplaod from "../../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useNavigate } from "react-router-dom";

const dzongkhags = ["Thimphu", "Paro", "Punakha"];
const genders = ["Male", "Female"];

const validationSchema = Yup.object({
  fullName: Yup.string().required("Full Name is required"),
  gender: Yup.string().required("Gender is required"),
  mobileNo: Yup.string().required("Mobile No is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  dzongkhag: Yup.string().required("Dzongkhag is required"),
  organizationName: Yup.string().required("Organization Name is required"),
  qmsTraining: Yup.string().required("Please specify if QMS training attended"),
  workExperiences: Yup.array()
    .of(
      Yup.object({
        orgName: Yup.string().required("Organization Name required"),
        designation: Yup.string().required("Designation required"),
        years: Yup.number()
          .min(5, "Minimum 5 years required")
          .required("Number of Years required"),
        responsibility: Yup.string().required("Responsibility required"),
      })
    )
    .min(1, "At least one work experience required"),
  files: Yup.array().min(1, "Please upload at least one file"),
});

const QMSAuditor = () => {
  const [loading, setLoading] = useState(false);
  const [hasCitizenID, setHasCitizenID] = useState(false);
  const navigate = useNavigate();

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  const handleToggle = (event) => {
    const checked = event.target.checked;
    setHasCitizenID(checked);
    if (!checked) {
      navigate("/auth/login-ndi-qrcode");
    }
  };

  return (
    <Box sx={{ m: { xs: 2, md: 2 } }}>
      {/* Toggle for Citizen ID */}
      <Box textAlign="center" sx={{ mb: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={hasCitizenID}
              onChange={handleToggle}
              color="primary"
            />
          }
          label={
            <Typography variant="h6" fontWeight={600}>
              Has Citizen ID Number?
            </Typography>
          }
        />
      </Box>

      {hasCitizenID && (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, md: 4 },
            width: "100%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header */}
          <Box textAlign="center" sx={{ mb: 6 }}>
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{
                letterSpacing: 0.7,
                borderBottom: "3px solid #555",
                color: "#1a1a1a",
                display: "inline-block",
                fontFamily: "'Roboto', 'Arial', sans-serif",
                textTransform: "capitalize",
                transition: "color 0.3s ease, border-color 0.3s ease",
                "&:hover": {
                  color: "#0d47a1",
                  borderColor: "#0d47a1",
                },
              }}
            >
              QMS Auditor Application Form
            </Typography>
          </Box>

          <Formik
            initialValues={{
              referenceNo: "",
              fullName: "",
              gender: "",
              mobileNo: "",
              email: "",
              dzongkhag: "",
              organizationName: "",
              qmsTraining: "",
              workExperiences: [
                { orgName: "", designation: "", years: "", responsibility: "" },
              ],
              files: [],
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { resetForm }) => {
              setLoading(true);
              try {
                toast.success("QMS Auditor Application submitted successfully!");
                resetForm();
              } catch (error) {
                toast.error(error.message || "Submission failed");
              } finally {
                setLoading(false);
              }
            }}
          >
            {(formik) => (
              <form onSubmit={formik.handleSubmit}>
                {/* ===== Basic Information ===== */}
                <Paper
                  sx={{
                    p: { xs: 2, md: 3 },
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3}>
                    {/* Reference No */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Reference No"
                        name="referenceNo"
                        size="small"
                        value={formik.values.referenceNo}
                        onChange={formik.handleChange}
                        disabled={loading}
                      />
                    </Grid>
                    {/* Full Name */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Full Name")}
                        name="fullName"
                        size="small"
                        value={formik.values.fullName}
                        onChange={formik.handleChange}
                        error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                        helperText={formik.touched.fullName && formik.errors.fullName}
                        disabled={loading}
                      />
                    </Grid>
                    {/* Mobile No */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Mobile No")}
                        name="mobileNo"
                        size="small"
                        value={formik.values.mobileNo}
                        onChange={formik.handleChange}
                        error={formik.touched.mobileNo && Boolean(formik.errors.mobileNo)}
                        helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                        disabled={loading}
                      />
                    </Grid>
                    {/* Gender */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={requiredLabel("Gender")}
                        name="gender"
                        size="small"
                        value={formik.values.gender}
                        onChange={formik.handleChange}
                        error={formik.touched.gender && Boolean(formik.errors.gender)}
                        helperText={formik.touched.gender && formik.errors.gender}
                        disabled={loading}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {genders.map((g) => (
                          <MenuItem key={g} value={g}>
                            {g}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {/* Email */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Email Address")}
                        name="email"
                        size="small"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        disabled={loading}
                      />
                    </Grid>
                    {/* Dzongkhag */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={requiredLabel(
                          "Location of Working Organization (Dzongkhag)"
                        )}
                        name="dzongkhag"
                        size="small"
                        value={formik.values.dzongkhag}
                        onChange={formik.handleChange}
                        error={formik.touched.dzongkhag && Boolean(formik.errors.dzongkhag)}
                        helperText={formik.touched.dzongkhag && formik.errors.dzongkhag}
                        disabled={loading}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {dzongkhags.map((dz) => (
                          <MenuItem key={dz} value={dz}>
                            {dz}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {/* Organization Name */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Name of the Working Organization")}
                        name="organizationName"
                        size="small"
                        value={formik.values.organizationName}
                        onChange={formik.handleChange}
                        error={
                          formik.touched.organizationName &&
                          Boolean(formik.errors.organizationName)
                        }
                        helperText={
                          formik.touched.organizationName &&
                          formik.errors.organizationName
                        }
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* ===== Registration Criteria - QMS Training ===== */}
                <Paper
                  sx={{
                    p: { xs: 2, md: 3 },
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Registration Criteria
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item size={{ xs: 12, md: 3 }}>
                      <TextField
                        select
                        fullWidth
                        label={requiredLabel("QMS Auditor Training Attended")}
                        name="qmsTraining"
                        size="small"
                        value={formik.values.qmsTraining}
                        onChange={formik.handleChange}
                        disabled={loading}
                      >
                        <MenuItem value="">Select</MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>

                {/* ===== Registration Criteria: Relevant Work Experience (Dynamic) ===== */}
                <Paper
                  sx={{
                    p: { xs: 2, md: 3 },
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Registration Criteria: Relevant Work Experience (Minimum of 5 years)
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <FieldArray
                    name="workExperiences"
                    render={(arrayHelpers) => (
                      <>
                        {formik.values.workExperiences.map((exp, index) => (
                          <Grid
                            container
                            spacing={3}
                            key={index}
                            sx={{ mb: 2, alignItems: "center" }}
                          >
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={requiredLabel("Organization Name")}
                                name={`workExperiences[${index}].orgName`}
                                size="small"
                                value={exp.orgName}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.orgName &&
                                  Boolean(
                                    formik.errors.workExperiences?.[index]?.orgName
                                  )
                                }
                                helperText={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.orgName &&
                                  formik.errors.workExperiences?.[index]?.orgName
                                }
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 2 }}>
                              <TextField
                                fullWidth
                                label={requiredLabel("Designation")}
                                name={`workExperiences[${index}].designation`}
                                size="small"
                                value={exp.designation}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.designation &&
                                  Boolean(
                                    formik.errors.workExperiences?.[index]?.designation
                                  )
                                }
                                helperText={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.designation &&
                                  formik.errors.workExperiences?.[index]?.designation
                                }
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                type="number"
                                label={requiredLabel("Number of Years")}
                                name={`workExperiences[${index}].years`}
                                size="small"
                                value={exp.years}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.years &&
                                  Boolean(
                                    formik.errors.workExperiences?.[index]?.years
                                  )
                                }
                                helperText={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.years &&
                                  formik.errors.workExperiences?.[index]?.years
                                }
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={1}
                                label={requiredLabel("Responsibility")}
                                name={`workExperiences[${index}].responsibility`}
                                size="small"
                                value={exp.responsibility}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.responsibility &&
                                  Boolean(
                                    formik.errors.workExperiences?.[index]?.responsibility
                                  )
                                }
                                helperText={
                                  formik.touched.workExperiences &&
                                  formik.touched.workExperiences[index]?.responsibility &&
                                  formik.errors.workExperiences?.[index]?.responsibility
                                }
                              />
                            </Grid>
                            <Grid
                              item
                              size={{ xs: 12, md: 1 }}
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              {index > 0 && (
                                <IconButton
                                  color="error"
                                  onClick={() => arrayHelpers.remove(index)}
                                >
                                  <RemoveCircleOutlineIcon />
                                </IconButton>
                              )}
                            </Grid>
                          </Grid>
                        ))}

                        <Button
                          variant="contained"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() =>
                            arrayHelpers.push({
                              orgName: "",
                              designation: "",
                              years: "",
                              responsibility: "",
                            })
                          }
                          sx={{ mt: 1 }}
                        >
                          Add More
                        </Button>
                      </>
                    )}
                  />
                </Paper>

                {/* ===== Supporting Documents ===== */}
                <Paper
                  sx={{
                    p: { xs: 2, md: 3 },
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Supporting Documents
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box
                    sx={{
                      p: 2,
                      border: "1px dashed #bdbdbd",
                      borderRadius: 2,
                      minHeight: 100,
                    }}
                  >
                    <FileUplaod
                      files={formik.values.files}
                      onFilesChange={(files) => formik.setFieldValue("files", files)}
                      disabled={loading}
                    />
                  </Box>
                </Paper>

                {/* ===== Form Actions ===== */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : <ArrowUpwardIcon />
                    }
                    sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
                    disabled={loading}
                  >
                    Submit
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    color="error"
                    startIcon={<LockResetIcon />}
                    sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
                    onClick={() => formik.resetForm()}
                  >
                    Reset
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </Paper>
      )}
    </Box>
  );
};

export default QMSAuditor;
