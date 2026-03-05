import { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  ExitToApp as ExitIcon,
  Person as PersonIcon,
  SwapHoriz as SwitchRoleIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import UserProfileService from "../../api/services/UserProfileService";

const ProfileHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const username = useSelector((state) => state.userProfile.userName);
  const current_role = useSelector(
    (state) => state.userProfile.current_role_name,
  );
  const userId = useSelector((state) => state.auth.userId);
  const access_token = useSelector((state) => state.auth.accessToken);

  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    let objectUrl;

    const fetchProfileImage = async () => {
      try {
        if (!userId || !access_token) return;

        const response = await UserProfileService.getUserProfileImage(
          userId,
          access_token,
        );

        if (response.status === 200) {
          const blob = new Blob([response.data], {
            type: response.headers["content-type"],
          });

          objectUrl = URL.createObjectURL(blob);
          setProfilePic(objectUrl);
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
        setProfilePic(null);
      }
    };

    fetchProfileImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, access_token]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleProfile = () => {
    navigate("/user-profile");
    setAnchorEl(null);
  };

  const handleSwitchRole = () => {
    navigate("/switch-role");
    setAnchorEl(null);
  };

  return (
    <>
      {/* Username */}
      <Typography
        variant="subtitle1"
        sx={{
          display: { xs: "none", sm: "block" },
          fontWeight: 500,
        }}
      >
        {username}
      </Typography>

      {/* Avatar */}
      <Tooltip title="Account settings">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Avatar
            src={profilePic}
            sx={{ width: 34, height: 34 }}
            onError={() => setProfilePic(null)}
          >
            {!profilePic && <PersonIcon fontSize="small" />}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 220,
              borderRadius: 2,
              overflow: "visible",
              filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.12))",

              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 18,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
      >
        {/* User Info */}
        <MenuItem onClick={handleProfile}>
          <Avatar src={profilePic} sx={{ width: 32, height: 32, mr: 1 }}>
            {!profilePic && <PersonIcon fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {current_role}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        {/* Profile */}
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>

        {/* Switch Role */}
        <MenuItem onClick={handleSwitchRole}>
          <ListItemIcon>
            <SwitchRoleIcon fontSize="small" />
          </ListItemIcon>
          Switch Role
        </MenuItem>

        <Divider />

        {/* Logout */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileHeader;
