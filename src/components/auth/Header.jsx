import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  ExitToApp as ExitIcon,
  Person as PersonIcon,
  SwapHoriz as SwitchRoleIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../../features/theme/themeSlice";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import UserProfileService from "../../api/services/UserProfileService";

const Header = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mode = useSelector((state) => state.theme.mode);
  const username = useSelector((state) => state.userProfile.userName);
  const current_role = useSelector((state) => state.userProfile.current_role_name);
  const userId = useSelector((state) => state.auth.userId);
  const access_token = useSelector((state) => state.auth.accessToken);

  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

  const open = Boolean(anchorEl);

  const user = {
    userId: userId,
    name: username,
    role: current_role,
  };

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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [userId, access_token]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleSwitchRole = () => {
    navigate("/switch-role");
  };

  const handleUserProfile = () => {
    navigate("/user-profile");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
        py: 0.5,
      })}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Left Side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            edge="start"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        {/* Right Side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip
            title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          >
            <IconButton color="inherit" onClick={() => dispatch(toggleTheme())}>
              {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          {/* Username */}
          <Typography
            variant="subtitle1"
            sx={{
              display: { xs: "none", sm: "block" },
              fontWeight: 500,
            }}
          >
            {user.name}
          </Typography>
          {/* Avatar */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-controls={open ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
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
            id="account-menu"
            open={open}
            onClose={handleMenuClose}
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
            <MenuItem onClick={handleUserProfile}>
              <Avatar src={profilePic} sx={{ width: 32, height: 32, mr: 1 }}>
                {!profilePic && <PersonIcon fontSize="small" />}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.role}
                </Typography>
              </Box>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                handleUserProfile();
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleSwitchRole();
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <SwitchRoleIcon fontSize="small" />
              </ListItemIcon>
              Switch Role
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                handleLogout();
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <ExitIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
