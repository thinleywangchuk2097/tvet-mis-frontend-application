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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUpload";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useLocation } from "react-router-dom";

// ===== Static Data =====
const changeTypes = [
  { id: 1, name: "Establishment Name Change" },
  { id: 2, name: "Ownership Change" },
  { id: 3, name: "Location Change" },
];

const ownershipTypes = [
  { id: 1, name: "Corporate" },
  { id: 2, name: "Franchise" },
  { id: 3, name: "NGO" },
  { id: 4, name: "Private (Partnership)" },
  { id: 5, name: "Private (Sole Proprietorship)" },
  { id: 6, name: "Public (Govt.)" },
];

const dzongkhags = [
  { id: 1, name: "Thimphu" },
  { id: 2, name: "Paro" },
  { id: 3, name: "Punakha" },
  { id: 4, name: "Wangdue" },
  { id: 5, name: "Bumthang" },
  { id: 6, name: "Trashigang" },
  { id: 7, name: "Mongar" },
  { id: 8, name: "Sarpang" },
];

// ===== Validation Schema =====
const validationSchema = Yup.object({
  // Change Type
  changeType: Yup.array()
    .min(1, "Please select at least one change type")
    .required("Change type is required"),

  // Institute Details
  instituteName: Yup.string().required("Institute Name is required"),

  // Ownership Details
  selectedOwnershipTypes: Yup.array().when("changeType", {
    is: (val) => val && val.includes("Ownership Change"),
    then: (schema) =>
      schema.min(1, "Please select at least one ownership type"),
  }),

  // Location Details
  dzongkhag: Yup.string().when("changeType", {
    is: (val) => val && val.includes("Location Change"),
    then: (schema) => schema.required("Dzongkhag is required"),
  }),

  location: Yup.string().when("changeType", {
    is: (val) => val && val.includes("Location Change"),
    then: (schema) => schema.required("Location is required"),
  }),

  // Contact Details
  telephone: Yup.string(),
  mobile: Yup.string().required("Mobile number is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  website: Yup.string().url("Invalid website URL"),

  // Supporting Documents
  files: Yup.array().when("changeType", {
    is: (val) => val && val.includes("Ownership Change"),
    then: (schema) => schema.min(1, "Please upload agreement document"),
  }),
});

// ===== Component =====
const InstituteChange = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const lastSegment = location.pathname.split("/").filter(Boolean).pop();
  const titleName = lastSegment
    ? lastSegment.replace(/-/g, " ")
    : "Institute Change";

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
      // Change Type
      changeType: [],

      // Institute Details
      instituteName: "Robotics & IoT Training Institute",

      // Ownership Details
      selectedOwnershipTypes: [],

      // Location Details
      dzongkhag: "Thimphu",
      location: "Doendrup Lam SE, Sangay Enterprise Building, Third Floor",

      // Contact Details
      telephone: "",
      mobile: "17621843",
      email: "youthroboticsiot@gmail.com",
      website: "www.ritibhutan.com",

      // Supporting Documents
      files: [],
    },

    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        const payload = {
          changeType: values.changeType,
          instituteName: values.instituteName,
          selectedOwnershipTypes: values.selectedOwnershipTypes,
          dzongkhag: values.dzongkhag,
          location: values.location,
          telephone: values.telephone || null,
          mobile: values.mobile,
          email: values.email,
          website: values.website || null,
          serviceId: 7, // Different service ID for change request
          currentRoleId: 1,
          statusId: 101,
          userId: "11606000208",
          documents,
        };

        console.log("Payload to submit:", payload);

        // Simulate API call - replace with actual API
        // const response = await InstituteChangeService.submitInstituteChange(payload);

        toast.success("Institute Change request submitted successfully!");
        resetForm();
      } catch (error) {
        toast.error(error.message || "Submission failed");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleChangeType = (type) => {
    const currentTypes = formik.values.changeType;
    let newTypes;

    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter((t) => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }

    formik.setFieldValue("changeType", newTypes);
  };

  const handleOwnershipType = (type) => {
    const currentTypes = formik.values.selectedOwnershipTypes;
    let newTypes;

    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter((t) => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }

    formik.setFieldValue("selectedOwnershipTypes", newTypes);
  };

  return (
    <Box sx={{ m: { xs: 1, md: 1 } }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 2 },
        }}
      >
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography
            textTransform="uppercase"
            fontWeight="bold"
            sx={{ textDecoration: "underline", fontSize: "1.3rem" }}
          >
            Apply for {titleName} Details
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          {/* ===== Change Type Section ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Change Type
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {changeTypes.map((type) => (
                <Grid item key={type.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formik.values.changeType.includes(type.name)}
                        onChange={() => handleChangeType(type.name)}
                        name="changeType"
                        sx={{
                          color:
                            formik.touched.changeType &&
                            formik.errors.changeType
                              ? "#d32f2f"
                              : undefined,
                        }}
                      />
                    }
                    label={type.name}
                  />
                </Grid>
              ))}
            </Grid>
            {formik.touched.changeType && formik.errors.changeType && (
              <Typography
                color="error"
                variant="caption"
                sx={{ mt: 1, display: "block" }}
              >
                {formik.errors.changeType}
              </Typography>
            )}
          </Paper>

          {/* ===== Institute Details ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Institute Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={
                    <span>
                      Name of Training Provider/Institution{" "}
                      <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="instituteName"
                  size="small"
                  value={formik.values.instituteName}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.instituteName &&
                    Boolean(formik.errors.instituteName)
                  }
                  helperText={
                    formik.touched.instituteName && formik.errors.instituteName
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Ownership Details ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Ownership Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {ownershipTypes.map((type) => (
                <Grid item key={type.id} size={{ xs: 12, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formik.values.selectedOwnershipTypes.includes(
                          type.name,
                        )}
                        onChange={() => handleOwnershipType(type.name)}
                        name="selectedOwnershipTypes"
                      />
                    }
                    label={type.name}
                  />
                </Grid>
              ))}
            </Grid>
            {formik.touched.selectedOwnershipTypes &&
              formik.errors.selectedOwnershipTypes && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 1, display: "block" }}
                >
                  {formik.errors.selectedOwnershipTypes}
                </Typography>
              )}
          </Paper>

          {/* ===== Location Details ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Location (Dzongkhag/Dungkhag)
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={
                    <span>
                      Dzongkhag <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="dzongkhag"
                  size="small"
                  value={formik.values.dzongkhag}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.dzongkhag && Boolean(formik.errors.dzongkhag)
                  }
                  helperText={
                    formik.touched.dzongkhag && formik.errors.dzongkhag
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((dz) => (
                    <MenuItem key={dz.id} value={dz.name}>
                      {dz.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={
                    <span>
                      Location of the Institute{" "}
                      <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="location"
                  size="small"
                  multiline
                  rows={3}
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.location && Boolean(formik.errors.location)
                  }
                  helperText={formik.touched.location && formik.errors.location}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Contact Address ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Contact Address
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Telephone No"
                  name="telephone"
                  size="small"
                  value={formik.values.telephone}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={
                    <span>
                      Mobile No <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="mobile"
                  size="small"
                  value={formik.values.mobile}
                  onChange={formik.handleChange}
                  error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                  helperText={formik.touched.mobile && formik.errors.mobile}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={
                    <span>
                      Email Address <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="email"
                  size="small"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Website Address"
                  name="website"
                  size="small"
                  value={formik.values.website}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.website && Boolean(formik.errors.website)
                  }
                  helperText={formik.touched.website && formik.errors.website}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Supporting Documents ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Supporting Documents
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
              1. Agreement for Ownership change
            </Typography>

            <FileUpload
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
              maxFiles={5}
              acceptedFileTypes={[".pdf", ".doc", ".docx"]}
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

          {/* ===== Form Actions ===== */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 3,
                py: 0.5,
                fontWeight: 600,
                textTransform: "none",
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  <ArrowUpwardIcon />
                )
              }
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
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
      </Paper>
    </Box>
  );
};

export default InstituteChange;
