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
  useMediaQuery,
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
import { useTheme } from "@mui/material/styles";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import UserProfileService from "../../api/services/UserProfileService";

const Header = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const mode = useSelector((state) => state.theme.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const username = useSelector((state) => state.userProfile.userName);
  const current_role = useSelector(
    (state) => state.userProfile.current_role_name
  );
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
    const fetchProfileImage = async () => {
      try {
        if (!userId || !access_token) return;

        const response = await UserProfileService.getUserProfileImage(
          userId,
          access_token
        );

        if (response.status === 200) {
          // Create blob URL from response
          const blob = new Blob([response.data], {
            type: response.headers["content-type"],
          });
          const imageUrl = URL.createObjectURL(blob);
          setProfilePic(imageUrl);
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
        setProfilePic(null);
      }
    };

    fetchProfileImage();

    return () => {
      // Clean up blob URL when component unmounts
      if (profilePic && profilePic.startsWith("blob:")) {
        URL.revokeObjectURL(profilePic);
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
    handleMenuClose();
    navigate("/");
  };

  const handleSwitchRole = () => {
    navigate("/switch-role");
    handleMenuClose();
  };

  const handleUserProfile = () => {
    navigate("/user-profile");
    handleMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
        py: 0.12,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={onToggleSidebar} edge="start">
              <MenuIcon />
            </IconButton>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton
              color="inherit"
              onClick={() => dispatch(toggleTheme())}
              sx={{ ml: 1 }}
            >
              {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user.name}
            </Typography>

            <Tooltip title="Account settings">
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={open ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar
                  src={profilePic}
                  sx={{ width: 32, height: 32 }}
                  onError={() => setProfilePic(null)}
                >
                  {!profilePic && <PersonIcon fontSize="small" />}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            slotProps={{
              paper: {
                elevation: 3,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  minWidth: 200,
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  "&:before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={handleUserProfile}>
              <Avatar src={profilePic} onError={() => setProfilePic(null)}>
                {!profilePic && <PersonIcon fontSize="small" />}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.role}
                </Typography>
              </Box>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleUserProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>

            <MenuItem onClick={handleSwitchRole}>
              <ListItemIcon>
                <SwitchRoleIcon fontSize="small" />
              </ListItemIcon>
              Switch Role
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
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
