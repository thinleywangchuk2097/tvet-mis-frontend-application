import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  Paper,
  Typography,
  Box,
  Divider,
  Avatar,
  Container,
  TextField,
  Button,
  Grid,
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
  Delete,
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
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const access_token = useSelector((state) => state.auth.accessToken);
  const userId = useSelector((state) => state.auth.userId);
  const roleIds = useSelector((state) => state.auth.roles);
  const currentProfilePic =
    useSelector((state) => state.auth.profilePic) || null;

  const [userProfileLists, setUserProfileLists] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(currentProfilePic);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

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
          setProfilePic(
            `data:${imageResponse.headers["content-type"]};base64,${base64Image}`,
          );
        }
      } catch (error) {
        console.error(error);
        setProfilePic(null);
      }
    };
    fetchData();
  }, [userId, access_token]);

  const convertImageToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleDeleteImage = async () => {
    setIsDeletingImage(true);
    try {
      const response = await UserProfileService.deleteProfileImage(
        userId,
        access_token,
      );
      if (response.status === 200) {
        setProfilePic(null);
        setProfilePicFile(null);
        toast.success(
          response.data.message || "Profile image deleted successfully!",
        );
      }
    } catch (error) {
      console.error("Error deleting profile image:", error);
      toast.error("Failed to delete profile image");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      username:
        `${userProfileLists.firstName || ""} ${userProfileLists.middleName || ""} ${userProfileLists.lastName || ""}`.trim(),
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
        if (profilePicFile)
          profileImageBase64 = await convertImageToBase64(profilePicFile);
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
    setProfilePicFile(null);
  };
  const handleClose = () => navigate(-1);
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.match("image.*") || file.size > 2 * 1024 * 1024)
      return;
    setProfilePic(URL.createObjectURL(file));
    setProfilePicFile(file);
  };
  const triggerFileInput = () => fileInputRef.current.click();

  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: 700,
        mt: { xs: 2, md: 4 },
        mb: 4,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          borderRadius: 3,
          px: { xs: 3, sm: 3 },
          py: { xs: 3, sm: 3 },
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
            top: 10,
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              backgroundColor: "action.hover",
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Header */}
        <Box textAlign="center" mb={1}>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            User Profile Detail
          </Typography>
        </Box>

        {/* Avatar & Roles */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profilePic}
              sx={{
                width: 90,
                height: 90,
                mb: 1,
                border: "4px solid #1976d2",
                boxShadow: 3,
              }}
              onError={() => setProfilePic(null)}
            >
              {!profilePic && <AccountCircle sx={{ fontSize: 64 }} />}
            </Avatar>

            {isEditing && (
              <>
                {/* Edit/Upload button */}
                <IconButton
                  onClick={triggerFileInput}
                  sx={{
                    position: "absolute",
                    bottom: 7,
                    right: 0,
                    backgroundColor: "background.paper",
                    "&:hover": { backgroundColor: "action.hover" },
                    zIndex: 1,
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>

                {/* Delete button - only show if there's a profile picture */}
                {profilePic && (
                  <IconButton
                    onClick={handleDeleteImage}
                    disabled={isDeletingImage}
                    sx={{
                      position: "absolute",
                      bottom: 7,
                      left: 0,
                      backgroundColor: "background.paper",
                      color: "error.main",
                      "&:hover": {
                        backgroundColor: "error.light",
                        color: "error.contrastText",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "action.disabledBackground",
                      },
                      zIndex: 1,
                    }}
                  >
                    {isDeletingImage ? (
                      <CircularProgress size={20} color="error" />
                    ) : (
                      <Delete fontSize="small" />
                    )}
                  </IconButton>
                )}

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
            display="flex"
            alignItems="center"
            gap={1}
            color="text.secondary"
          >
            <AdminPanelSettings fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              Role IDs: [{roleIds?.join(",")}]
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />
        {isSubmitting && <LinearProgress />}

        {/* Form */}
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                fullWidth
                label="User ID"
                size="small"
                value={userId || "Not available"}
                disabled
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                fullWidth
                label="Username"
                size="small"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.username && Boolean(formik.errors.username)
                }
                helperText={formik.touched.username && formik.errors.username}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                size="small"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                fullWidth
                label="Mobile Number"
                size="small"
                name="mobile_no"
                value={formik.values.mobile_no}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.mobile_no && Boolean(formik.errors.mobile_no)
                }
                helperText={formik.touched.mobile_no && formik.errors.mobile_no}
                disabled={!isEditing}
              />
            </Grid>

            {/* Change Password */}
            <Grid item size={{ xs: 12 }}>
              <Link
                component={RouterLink}
                to="/user/change-password"
                underline="hover"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "primary.main",
                }}
              >
                <Lock fontSize="small" />
                <Typography variant="body2">Change Password</Typography>
              </Link>
            </Grid>

            {/* Buttons */}
            <Grid
              item
              size={{ xs: 12 }}
              display="flex"
              justifyContent={isEditing ? "space-between" : "flex-end"}
              mt={2}
            >
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    sx={{ borderRadius: 2, textTransform: "none" }}
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
                    disabled={
                      isSubmitting || (!formik.dirty && !profilePicFile)
                    }
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Edit />}
                  onClick={handleEditToggle}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  Edit Profile
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UserProfile;
