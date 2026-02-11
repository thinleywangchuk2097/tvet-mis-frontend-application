import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  Card,
  Typography,
  Box,
  Divider,
  Avatar,
  useTheme,
  Container,
  TextField,
  Button,
  Stack,
  IconButton,
  LinearProgress,
  Link,
  CircularProgress,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  AccountCircle,
  AdminPanelSettings,
  Edit,
  Save,
  Cancel,
  Close,
  Lock,
} from "@mui/icons-material";
import UserProfileService from "../../api/services/UserProfileService";

const profileSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  mobile_no: Yup.string()
    .matches(/^[0-9]{8}$/, "Mobile number must be 8 digits")
    .required("Mobile number is required"),
});

const UserProfile = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const userId = useSelector((state) => state.auth.userId);
  const roleIds = useSelector((state) => state.auth.roles);
  const currentProfilePic =
    useSelector((state) => state.auth.profilePic) || null;

  const [userProfileLists, setUserProfileLists] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(currentProfilePic);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user profile & profile image
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, imageResponse] = await Promise.all([
          UserProfileService.getUserProfile(userId, access_token),
          UserProfileService.getUserProfileImage(userId, access_token),
        ]);
        setUserProfileLists(profileResponse.data);

        if (imageResponse.status === 200) {
          const base64Image = btoa(
            new Uint8Array(imageResponse.data).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              "",
            ),
          );
          const imageUrl = `data:${imageResponse.headers["content-type"]};base64,${base64Image}`;
          setProfilePic(imageUrl);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setProfilePic(null);
      }
    };
    fetchData();
  }, [userId, access_token]);

  // Convert image file to Base64
  const convertImageToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      username: `${userProfileLists.firstName || ""} ${
        userProfileLists.middleName || ""
      } ${userProfileLists.lastName || ""}`.trim(),
      email: userProfileLists.emailId || "",
      mobile_no: userProfileLists.mobileNo || "",
      profilePic: userProfileLists.profileImageUrl || "",
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        let profileImageBase64 = null;

        if (profilePicFile) {
          profileImageBase64 = await convertImageToBase64(profilePicFile);
        }

        const userData = {
          userId,
          userName: values.username,
          mobileNo: values.mobile_no,
          emailId: values.email,
          profileImageBase64,
          currentProfilePic,
        };

        const response = await UserProfileService.updateUserProfile(
          userData,
          access_token,
        );
        if (response.status === 200) {
          setIsEditing(false);
          setProfilePicFile(null);
          toast.success(
            response.data.message || "Profile updated successfully!",
          );
          navigate(-1);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) formik.resetForm();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    formik.resetForm();
    setProfilePicFile(null); // reset uploaded image
  };

  const handleClose = () => navigate(-1);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) return;
      if (file.size > 2 * 1024 * 1024) return;
      setProfilePic(URL.createObjectURL(file));
      setProfilePicFile(file);
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  return (
    <Container
      maxWidth={false}
      sx={{ maxWidth: 600, mt: { xs: 2, md: 4 }, mb: 4 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          px: { xs: 2, sm: 4 },
          py: 3,
          position: "relative",
          overflow: "visible",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: theme.palette.text.secondary,
            "&:hover": {
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Close />
        </IconButton>

        <Box sx={{ textAlign: "center", mb: 2 }}>
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
            User Profile
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profilePic}
              sx={{
                bgcolor: "primary.main",
                width: 100,
                height: 100,
                mb: 1,
                border: `4px solid ${theme.palette.primary.light}`,
                boxShadow: theme.shadows[2],
              }}
              onError={() => setProfilePic(null)}
            >
              {!profilePic && <AccountCircle sx={{ fontSize: 60 }} />}
            </Avatar>

            {isEditing && (
              <>
                <IconButton
                  onClick={triggerFileInput}
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    right: 0,
                    backgroundColor: theme.palette.background.paper,
                    "&:hover": { backgroundColor: theme.palette.action.hover },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </>
            )}
          </Box>
          <Box
            sx={{
              mt: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <AdminPanelSettings fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              Role IDs: [{roleIds?.join(",")}]
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />
        {isSubmitting && <LinearProgress />}
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              margin="normal"
              variant="outlined"
              name="userId"
              label="User ID"
              size="small"
              value={userId || "Not available"}
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-disabled": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.divider,
                    },
                  },
                },
              }}
            />

            <TextField
              fullWidth
              margin="normal"
              variant="outlined"
              name="username"
              label="Username"
              size="small"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              disabled={!isEditing}
              placeholder="Enter username"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              variant="outlined"
              name="email"
              label="Email"
              size="small"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={!isEditing}
              placeholder="Enter email address"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              variant="outlined"
              name="mobile_no"
              label="Mobile Number"
              size="small"
              value={formik.values.mobile_no}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.mobile_no && Boolean(formik.errors.mobile_no)
              }
              helperText={formik.touched.mobile_no && formik.errors.mobile_no}
              disabled={!isEditing}
              placeholder="Enter 8-digit mobile number"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Stack>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Link
              component={RouterLink}
              to="/change-password"
              underline="hover"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "primary.main",
                "&:hover": { color: "secondary.main" },
              }}
            >
              <Lock fontSize="small" />
              <Typography variant="body2">Change Password</Typography>
            </Link>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction="row"
            spacing={2}
            justifyContent={isEditing ? "space-between" : "flex-end"}
          >
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    py: 0.5,
                    px: 3,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    minWidth: 140,
                    textTransform: "none",
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={
                    isSubmitting ? <CircularProgress size={16} /> : <Save />
                  }
                  disabled={isSubmitting || (!formik.dirty && !profilePicFile)}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    py: 0.5,
                    px: 3,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    minWidth: 140,
                    textTransform: "none",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Edit />}
                onClick={handleEditToggle}
                size="small"
                sx={{
                  ml: "auto",
                  borderRadius: 2,
                  py: 0.5,
                  px: 3,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  minWidth: 140,
                  textTransform: "none",
                }}
              >
                Edit Profile
              </Button>
            )}
          </Stack>
        </form>
      </Card>
    </Container>
  );
};

export default UserProfile;
