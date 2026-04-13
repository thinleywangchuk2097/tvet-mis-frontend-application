import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUplaod from "../../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";

const sectors = ["Education", "Health", "Engineering"];
const occupations = ["Teacher", "Engineer", "Doctor"];
const certificationLevels = ["Level 1", "Level 2", "Level 3"];
const dzongkhags = ["Thimphu", "Paro", "Punakha"];
const genders = ["Male", "Female"];

const validationSchema = Yup.object({
  referenceNo: Yup.string(),
  fullName: Yup.string().required("Full Name is required"),
  gender: Yup.string().required("Gender is required"),
  mobileNo: Yup.string().required("Mobile No is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  dzongkhag: Yup.string().required("Dzongkhag is required"),
  organizationName: Yup.string().required("Organization Name is required"),
  sector: Yup.string().required("Sector is required"),
  occupation: Yup.string().required("Occupation is required"),
  certificationLevel: Yup.string().required("Certification Level is required"),
  files: Yup.array().min(1, "Please upload at least one file"),
});

const Assessor = () => {
  const [hasCitizenId, setHasCitizenId] = useState("no");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCitizenId === "yes") {
      navigate("/auth/login-ndi-qrcode");
    }
  }, [hasCitizenId, navigate]);

  const formik = useFormik({
    initialValues: {
      referenceNo: "",
      fullName: "",
      gender: "",
      mobileNo: "",
      email: "",
      dzongkhag: "",
      organizationName: "",
      sector: "",
      occupation: "",
      certificationLevel: "",
      files: [],
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        toast.success("Assessor Registration submitted successfully!");
        resetForm();
      } catch (error) {
        toast.error(error.message || "Submission failed");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box sx={{ m: { xs: 2, md: 2 } }}>
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
              transition: "color 0.3s ease, border-color 0.3s ease", // animate both
              "&:hover": {
                color: "#0d47a1",
                borderColor: "#0d47a1", // underline matches text on hover
              },
            }}
          >
            Assessor Registration Form
          </Typography>
        </Box>

        {/* Citizen ID Radio */}
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 500 }}>
              Do you have a Citizen ID Number?
            </FormLabel>
            <RadioGroup
              row
              value={hasCitizenId}
              onChange={(e) => setHasCitizenId(e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Registration Form */}
        {hasCitizenId === "no" && (
          <form onSubmit={formik.handleSubmit}>
            {/* Section: Basic Info */}
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

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    size="small"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.fullName && Boolean(formik.errors.fullName)
                    }
                    helperText={
                      formik.touched.fullName && formik.errors.fullName
                    }
                    disabled={loading}
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Gender"
                    name="gender"
                    size="small"
                    value={formik.values.gender}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.gender && Boolean(formik.errors.gender)
                    }
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

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Mobile No"
                    name="mobileNo"
                    size="small"
                    value={formik.values.mobileNo}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                    }
                    helperText={
                      formik.touched.mobileNo && formik.errors.mobileNo
                    }
                    disabled={loading}
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    size="small"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={loading}
                  />
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Dzongkhag"
                    name="dzongkhag"
                    size="small"
                    value={formik.values.dzongkhag}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.dzongkhag &&
                      Boolean(formik.errors.dzongkhag)
                    }
                    helperText={
                      formik.touched.dzongkhag && formik.errors.dzongkhag
                    }
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

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Organization Name"
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

            {/* Section: Assessor Criteria */}
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                mb: 4,
                borderRadius: 2,

                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Assessor Registration Criteria
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Sector"
                    name="sector"
                    size="small"
                    value={formik.values.sector}
                    onChange={formik.handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {sectors.map((sec) => (
                      <MenuItem key={sec} value={sec}>
                        {sec}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Occupation"
                    name="occupation"
                    size="small"
                    value={formik.values.occupation}
                    onChange={formik.handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {occupations.map((occ) => (
                      <MenuItem key={occ} value={occ}>
                        {occ}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Certification Level"
                    name="certificationLevel"
                    size="small"
                    value={formik.values.certificationLevel}
                    onChange={formik.handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {certificationLevels.map((lvl) => (
                      <MenuItem key={lvl} value={lvl}>
                        {lvl}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* Section: Supporting Documents */}
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
                  onFilesChange={(files) =>
                    formik.setFieldValue("files", files)
                  }
                  disabled={loading}
                />
              </Box>
            </Paper>

            {/* Form Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} sx={{ color: "#fff" }} />
                  ) : (
                    <ArrowUpwardIcon />
                  )
                }
                sx={{
                  px: 3,
                  py: 0.5,
                  fontWeight: 600,
                  textTransform: "none",
                }}
                disabled={loading}
              >
                Submit
              </Button>
              <Button
                type="button"
                variant="contained"
                color="error"
                startIcon={<LockResetIcon />}
                sx={{
                  px: 3,
                  py: 0.5,
                  fontWeight: 600,
                  textTransform: "none",
                }}
                onClick={() => formik.resetForm()}
              >
                Reset
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default Assessor;
