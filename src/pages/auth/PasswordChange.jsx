import React, { useState, useEffect, useRef } from "react";
import {
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Container,
  InputAdornment,
  IconButton,
  Stack,
  LinearProgress,
  Alert,
  Collapse,
  Fade,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  ArrowBack as CancelIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import UserProfileService from "../../api/services/UserProfileService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import BorderColorIcon from '@mui/icons-material/BorderColor';
const PasswordChange = ({ redirectOnSuccess = "/" }) => {
  const token = useSelector((state) => state.auth.accessToken);
  const navigate = useNavigate();
  const firstFieldRef = useRef(null);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [message, setMessage] = useState({
    text: "",
    severity: "success",
    show: false,
  });

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const togglePasswordVisibility = (key) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showMessage = (text, severity = "success") => {
    setMessage({ text, severity, show: true });
    setTimeout(() => setMessage((prev) => ({ ...prev, show: false })), 5000);
  };

  const validationSchema = Yup.object({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Must contain uppercase, lowercase, number and special character"
      )
      .required("New password is required")
      .notOneOf([Yup.ref("currentPassword")], "New password must be different"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Passwords must match")
      .required("Please confirm your new password"),
  });

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const response = await UserProfileService.changeUserPassword(
          values,
          token
        );
        if (response.status === 200) {
          showMessage("Password changed successfully!", "success");
          toast.success(response.data.message);
          resetForm();
          setTimeout(() => navigate(redirectOnSuccess), 3000); // 3 seconds
        } else {
          showMessage(
            response.data.message || "Password change failed",
            "error"
          );
        }
      } catch (error) {
        showMessage(
          error.response?.data?.message ||
            "Failed to change password. Please try again.",
          "error"
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Fade in={true} timeout={500}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 600,
          mt: { xs: 2, md: 4 },
          mb: 4,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box
            sx={{
              p: 4,
              pb: 2,
              textAlign: "center",
            }}
          >
            <LockIcon
              color="primary"
              sx={{
                fontSize: 40,
                mb: 1,
              }}
            />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Change Your Password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Secure your account with a new password
            </Typography>
          </Box>

          <Collapse in={message.show}>
            <Alert
              severity={message.severity}
              sx={{ borderRadius: 0 }}
              action={
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => setMessage({ ...message, show: false })}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              {message.text}
            </Alert>
          </Collapse>

          {formik.isSubmitting && <LinearProgress />}

          <CardContent sx={{ p: 4, pt: 0 }}>
            <form onSubmit={formik.handleSubmit}>
              {[
                { field: "currentPassword", label: "Current Password" },
                { field: "newPassword", label: "New Password" },
                { field: "confirmPassword", label: "Confirm Password" },
              ].map(({ field, label }, index) => {
                const key = field.includes("confirm")
                  ? "confirm"
                  : field.includes("new")
                  ? "new"
                  : "old";

                return (
                  <TextField
                    key={field}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    size="small"
                    name={field}
                    label={label}
                    type={showPassword[key] ? "text" : "password"}
                    value={formik.values[field]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched[field] && Boolean(formik.errors[field])
                    }
                    helperText={formik.touched[field] && formik.errors[field]}
                    slotProps={{
                      input: {
                        ref: index === 0 ? firstFieldRef : null,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility(key)}
                              edge="end"
                              aria-label={`toggle ${label} visibility`}
                              size="small"
                            >
                              {showPassword[key] ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                        },
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                );
              })}

              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  mt: 3,
                  "& .MuiButton-root": {
                    borderRadius: 2,
                    py: 0.9,
                    px: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    minHeight: 36,
                  },
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate(-1)}
                  disabled={formik.isSubmitting}
                  size="small"
                  sx={{ py: 0.8, px: 1.5, minWidth: 120 }}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<BorderColorIcon />}
                  disabled={formik.isSubmitting || !formik.dirty}
                  size="small"
                  sx={{ py: 0.8, px: 1.5, minWidth: 120 }}
                >
                  {formik.isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Paper>
      </Container>
    </Fade>
  );
};

export default PasswordChange;
