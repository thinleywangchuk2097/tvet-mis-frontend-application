import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Paper,
  Link,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  LockOutlined as LockIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import UserProfileService from "../../api/services/UserProfileService";
import { Link as RouterLink } from "react-router-dom";
import slide7 from "../../assets/slider/slide7.png"; // background image

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        const response = await UserProfileService.forgotUserPassword(values);
        console.log("response", response);
        if (response.status === 200) {
          setSuccess(true);
        } else {
          setError(response.response?.data);
        }
      } catch (err) {
        setError(
          err.response?.response?.data ||
            "Failed to send reset link. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${slide7})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Blur overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backdropFilter: "blur(6px)",
          zIndex: 1,
        }}
      />
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          position: "relative",
          zIndex: 2,
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          <LockIcon sx={{ fontSize: 40, mb: 2 }} />
          <Typography
            component="h1"
            variant="h5"
            align="center"
            sx={{ mb: 2, fontWeight: "bold" }}
          >
            Forgot Password
          </Typography>

          {success ? (
            <>
              <Alert severity="success" sx={{ width: "100%", mb: 3 }}>
                Password reset link sent successfully! Please check your email.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate("/login")}
                sx={{ mt: 2 }}
              >
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                Enter your email address below, and we'll send you a link to
                reset your password.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ width: "100%" }}
              >
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  variant="outlined"
                  margin="normal"
                  size="small"
                  {...formik.getFieldProps("email")}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  sx={{ mb: 2 }}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 2, mb: 2, paddingY: 0.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : "Send Reset Link"}
                </Button>
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    lineHeight: 1.2,
                    py: 0.25,
                  }}
                >
                  <ArrowBackIcon sx={{ mr: 0.5, fontSize: 16 }} />
                  Back to Login
                </Link>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
