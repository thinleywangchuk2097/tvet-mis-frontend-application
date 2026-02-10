import apiClient from "../../api/axios";
import PrivilegeService from "../../api/services/PrivilegeService";
import UserProfileService from "../../api/services/UserProfileService";
import { setUserProfile } from "../../features/auth/userProfileSlice";
import { loginSuccess } from "../../features/auth/authSlice";
import { setPrivileges } from "../../features/privilege/privilegeSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  Paper,
  Link,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import LoginIcon from "@mui/icons-material/Login";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Link as RouterLink } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import QRNDIlogo from "../../assets/images/ndibg.svg";
import slide5 from "../../assets/slider/slide5.png"; // background image
import { useNavigate } from "react-router-dom";

const validationSchema = Yup.object({
  username: Yup.string().required("User ID is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const redirectToBhutanNDI = () => {
    navigate("/login-ndi-qrcode"); 
    console.log("Redirecting to Bhutan NDI...");
  };

  const getTokenData = (token) => {
    try {
      const decoded = jwtDecode(token);
      return { roles: decoded.roles || [] };
    } catch {
      return { roles: [] };
    }
  };

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const response = await apiClient.post(
          "/api/v1/auth/authenticate",
          values,
        );

        const {
          access_token,
          refresh_token,
          current_role,
          userId,
          locationId,
        } = response.data;

        const { roles } = getTokenData(access_token);
        const currentRoleStr = String(current_role);
        const rolesStr = roles.map(String);

        if (!rolesStr.includes(currentRoleStr)) {
          throw new Error(
            `Your account doesn't have permission for role ${currentRoleStr}`,
          );
        }

        dispatch(
          loginSuccess({
            access_token,
            refresh_token,
            current_role,
            locationId,
          }),
        );

        try {
          const privilegesData = await PrivilegeService.getPrivileges(
            current_role,
            access_token,
          );

          const privileges =
            privilegesData.data?.map((item) => ({
              id: item.id,
              display_order: item.disPlayOrder,
              is_display: item.display,
              parent_id: item.parentId,
              privilege_name: item.privilegeName,
              route_name: item.routeName,
              icon: item.icon,
            })) || [];

          dispatch(setPrivileges(privileges));
        } catch (err) {
          console.error("Privilege fetch error", err);
        }

        try {
          const profileRes =
            await UserProfileService.getUserNameCurrentRoleName(
              userId,
              access_token,
            );

          dispatch(
            setUserProfile({
              username: profileRes.data.username,
              current_role_name: profileRes.data.current_role_name,
            }),
          );
        } catch (err) {
          console.error("Profile fetch error", err);
        }

        toast.success("Login successfully!");
      } catch (error) {
        setFieldError(
          "password",
          error.response?.data?.message || error.message || "Failed to login",
        );
      } finally {
        setSubmitting(false);
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
        backgroundImage: `url(${slide5})`,
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
          backdropFilter: "blur(6px)", // adjust blur strength here
          zIndex: 1,
        }}
      />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 2 }}>
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            {/* SIGN IN */}
            <Typography
              component="h1"
              variant="h5"
              sx={{ mb: 2, fontWeight: "bold", textTransform: "uppercase" }}
            >
              Sign In
            </Typography>

            {/* BHUTAN NDI LOGIN */}
            <Button
              fullWidth
              disableElevation
              onClick={redirectToBhutanNDI}
              variant="contained"
              sx={{
                height: "40px",
                mb: 2,
                color: "white",
                backgroundColor: "#124145",
                fontSize: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#0f3b3a",
                },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mr: 1.5 }}>
                <img src={QRNDIlogo} alt="Bhutan NDI" width={28} height={28} />
              </Box>
              Login with Bhutan NDI
            </Button>
            {/* DIVIDER */}
            <Box sx={{ width: "100%", my: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  position: "relative",
                  "&::before, &::after": {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    width: "40%",
                    height: "1px",
                    backgroundColor: "#e0e0e0",
                  },
                  "&::before": { left: 0 },
                  "&::after": { right: 0 },
                }}
              >
                OR
              </Typography>
            </Box>

            {/* LOGIN FORM */}
            <Box component="form" onSubmit={formik.handleSubmit} width="100%">
              <TextField
                fullWidth
                size="small"
                margin="normal"
                id="username"
                name="username"
                label="User ID"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.username && Boolean(formik.errors.username)
                }
                helperText={formik.touched.username && formik.errors.username}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                margin="normal"
                id="password"
                name="password"
                label="Password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.password && Boolean(formik.errors.password)
                }
                helperText={formik.touched.password && formik.errors.password}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 1.5, fontWeight: "bold" }}
                disabled={formik.isSubmitting}
                endIcon={
                  formik.isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <LoginIcon />
                  )
                }
              >
                {formik.isSubmitting ? "Logging in..." : "Login"}
              </Button>

              <Box display="flex" justifyContent="flex-end">
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  underline="none"
                  display="flex"
                  alignItems="center"
                >
                  <HelpOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">Forgot Password?</Typography>
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
