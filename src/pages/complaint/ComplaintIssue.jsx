import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  Divider,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Send, Clear } from "@mui/icons-material";
import FileUplaod from "../../components/file/FileUplaod";
import ComplaintService from "../../api/services/ComplaintService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

/* ---------------- Validation ---------------- */
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  citizenshipNo: Yup.string()
    .matches(/^\d{11}$/, "Citizenship No must be exactly 11 digits")
    .required("Citizenship No is required"),
  gewog: Yup.string().required("Gewog is required"),
  dzongkhag: Yup.string().required("Dzongkhag is required"),
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]{8,15}$/, "Phone must be 8-15 digits")
    .required("Phone number is required"),
  complaintType: Yup.string().required("Please select complaint type"),
  priority: Yup.string().required("Please select priority level"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .required("Description is required"),
  files: Yup.array()
    .min(1, "Please upload at least one file")
    .test("fileSize", "Each file must be less than 5MB", (files) => {
      if (!files) return true;
      return files.every((file) => file.size <= 5 * 1024 * 1024);
    }),
});

const ComplaintIssue = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const current_roleId = useSelector((state) => state.auth.current_roleId);
  const locationId = useSelector((state) => state.auth.locationId);

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
      name: "",
      citizenshipNo: "",
      gewog: "",
      dzongkhag: "",
      email: "",
      phone: "",
      complaintType: "",
      priority: "",
      description: "",
      files: [],
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!access_token) {
        toast.error("Authentication required. Please log in.");
        return;
      }

      setLoading(true);
      try {
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        const payload = {
          applicantName: values.name,
          citizenshipNo: values.citizenshipNo,
          gewog: values.gewog,
          dzongkhag: values.dzongkhag,
          emaildId: values.email,
          mobileNo: values.phone,
          complaintType: values.complaintType,
          priorityLevel: values.priority,
          description: values.description,
          documents,
          currentRoleId: current_roleId,
          locationId,
          serviceId: 1,
          statusId: 59,
        };

        const response = await ComplaintService.submitComplaint(
          payload,
          access_token,
        );

        if (response.status >= 200 && response.status < 300) {
          toast.success("Complaint submitted successfully!");
          resetForm();
        } else {
          toast.error(response.data?.message || "Submission failed");
        }
      } catch (error) {
        toast.error(error.message || "Unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Paper
      elevation={1}
      sx={{
        p: 4,
        borderRadius: 3,
        width: "100%",
      }}
    >
      {/* Page Title */}
      <Box textAlign="center">
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            mb: 4,
            letterSpacing: 0.3,
            position: "relative",
            display: "inline-block",
            cursor: "pointer",
            "&::after": {
              content: '""',
              position: "absolute",
              left: "50%",
              bottom: -4,
              width: "0%",
              height: "2px",
              backgroundColor: "#1e88e6",
              transform: "translateX(-50%)",
              transition: "width 0.3s ease-in-out",
            },
            "&:hover::after": {
              width: "100%",
            },
          }}
        >
          Complaint Issue Form
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        {/* Applicant Information */}
        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Applicant Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Citizenship No"
                name="citizenshipNo"
                size="small"
                value={formik.values.citizenshipNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.citizenshipNo &&
                  Boolean(formik.errors.citizenshipNo)
                }
                helperText={
                  formik.touched.citizenshipNo && formik.errors.citizenshipNo
                }
                disabled={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                size="small"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Dzongkhag"
                name="dzongkhag"
                size="small"
                value={formik.values.dzongkhag}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.dzongkhag && Boolean(formik.errors.dzongkhag)
                }
                helperText={formik.touched.dzongkhag && formik.errors.dzongkhag}
                disabled={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Gewog"
                name="gewog"
                size="small"
                value={formik.values.gewog}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.gewog && Boolean(formik.errors.gewog)}
                helperText={formik.touched.gewog && formik.errors.gewog}
                disabled={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                size="small"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={loading}
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                size="small"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Complaint Information */}
        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Complaint Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Complaint Type"
                name="complaintType"
                size="small"
                value={formik.values.complaintType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.complaintType &&
                  Boolean(formik.errors.complaintType)
                }
                helperText={
                  formik.touched.complaintType && formik.errors.complaintType
                }
                disabled={loading}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Service Issue">Service Issue</MenuItem>
                <MenuItem value="Billing Issue">Billing Issue</MenuItem>
                <MenuItem value="Technical Issue">Technical Issue</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Priority Level"
                name="priority"
                size="small"
                value={formik.values.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.priority && Boolean(formik.errors.priority)
                }
                helperText={formik.touched.priority && formik.errors.priority}
                disabled={loading}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </TextField>
            </Grid>

            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                size="small"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.description &&
                  Boolean(formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Documents */}
        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Supporting Documents
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              p: 2,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <FileUplaod
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
              disabled={loading}
            />
          </Box>

          {formik.touched.files && formik.errors.files && (
            <Typography
              color="error"
              variant="caption"
              sx={{ mt: 1, display: "block" }}
            >
              {formik.errors.files}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Action
          </Typography>
          <Divider sx={{ mb: 3 }} />

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
              color="success"
              startIcon={<Send />}
              disabled={loading || !formik.isValid}
              sx={{
                px: 4,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Submit"
              )}
            </Button>

            <Button
              type="button"
              variant="outlined"
              color="error"
              startIcon={<Clear />}
              onClick={() => formik.resetForm()}
              sx={{
                px: 4,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default ComplaintIssue;
