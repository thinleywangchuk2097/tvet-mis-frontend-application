import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../features/auth/authSlice";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Avatar,
  CircularProgress,
  MenuItem,
  TextField,
  IconButton,
} from "@mui/material";
import {
  SwapHoriz as SwitchRoleIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import UserProfileService from "../../../api/services/internal/userprofile/UserProfileService";
import { toast } from "react-toastify";

const SwitchRole = () => {
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const userId = useSelector((state) => state.auth.userId);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await UserProfileService.getUserAssociatedRoles(
          userId,
          access_token,
        );

        const roles = response.data.map((role) => ({
          value: role.id,
          label: role.role_name,
          isCurrent: role.current_role_name === role.role_name,
        }));

        setAvailableRoles(roles);

        const current = roles.find((role) => role.isCurrent);
        if (current) {
          setCurrentRole(current.value);
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, access_token]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const roleSchema = Yup.object().shape({
    role: Yup.string()
      .required("Please select a role")
      .oneOf(
        availableRoles.map((role) => role.value),
        "Invalid role selection",
      )
      .notOneOf([currentRole], "You are already in this role"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const data = {
        userId: userId,
        switchedRoleId: values.role,
      };

      const response = await UserProfileService.switchRole(data, access_token);

      if (response.status === 200) {
        const newRoleLabel = availableRoles.find(
          (r) => r.value === values.role,
        )?.label;

        setCurrentRole(values.role);
        resetForm();
        handleLogout();
        toast.success(`Role switched to ${newRoleLabel} successfully!`);
      } else {
        toast.error("Failed to switch role");
      }
    } catch (error) {
      console.error("Failed to switch role:", error);
      toast.warning("Failed to switch role");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: 600, mt: 4, mb: 4 }}>
        <Paper
          elevation={3}
          sx={{ p: 4, display: "flex", justifyContent: "center" }}
        >
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: 600,
        mt: { xs: 2, md: 4 },
        mb: 4,
        position: "relative",
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, mt: 4, borderRadius: 2, position: "relative" }}
      >
        <IconButton
          aria-label="close"
          onClick={() => navigate("/")}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
            <SwitchRoleIcon />
          </Avatar>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              sx={{
                display: "inline-block",
                position: "relative",
                cursor: "pointer",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  bottom: -2,
                  width: "100%",
                  height: "2px",
                  backgroundColor: "#1e88e6",
                  borderRadius: "2px",
                  transform: "scaleX(0)",
                  transformOrigin: "center",
                  transition: "transform 0.3s ease",
                },
                "&:hover::after": {
                  transform: "scaleX(1)",
                },
              }}
            >
              Switch Your Role
            </Typography>
          </Box>

          {currentRole && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              Current role:{" "}
              <strong>
                {availableRoles.find((r) => r.value === currentRole)?.label}
              </strong>
            </Typography>
          )}
        </Box>

        <Formik
          initialValues={{ role: "" }}
          validationSchema={roleSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, values, handleChange }) => (
            <Form>
              <Field
                name="role"
                as={TextField}
                select
                fullWidth
                label="New Role"
                size="small"
                margin="normal"
                value={values.role}
                onChange={handleChange}
                error={touched.role && Boolean(errors.role)}
                helperText={touched.role && errors.role}
              >
                {availableRoles.map((role) => (
                  <MenuItem
                    key={role.value}
                    value={role.value}
                    disabled={role.isCurrent}
                  >
                    {role.label}
                    {role.isCurrent && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          ml: "auto",
                        }}
                      >
                        (Current)
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Field>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting || !values.role}
                sx={{
                  mt: 3,
                  mb: 2,
                }}
                startIcon={<PublishedWithChangesIcon />}
              >
                {isSubmitting ? "Switching Roles..." : "Switch Role"}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default SwitchRole;
