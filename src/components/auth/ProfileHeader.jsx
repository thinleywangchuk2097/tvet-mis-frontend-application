import { useState, useEffect, useMemo, useCallback } from "react";
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
  Badge,
  List,
  ListItem,
  ListItemText,
  Paper,
  Popper,
  ClickAwayListener,
  Grow,
} from "@mui/material";

import {
  ExitToApp as ExitIcon,
  Person as PersonIcon,
  SwapHoriz as SwitchRoleIcon,
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";

import { styled } from "@mui/material/styles";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import UserProfileService from "../../api/services/internal/userprofile/UserProfileService";

/* ---------------- Utilities ---------------- */

const getInitials = (name) => {
  if (!name) return ""; // safe fallback
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

const stringToColor = (string = "") => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 255;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color || "#1976d2";
};

/* ---------------- Arrow Style ---------------- */

const arrowPaperStyle = {
  mt: 1.5,
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
};

/* ---------------- Styled Components ---------------- */

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: theme.palette.error.main,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": { transform: "scale(.8)", opacity: 1 },
    "100%": { transform: "scale(2.4)", opacity: 0 },
  },
}));

const NotificationItem = styled(ListItem)(({ theme, read }) => ({
  backgroundColor: read ? "transparent" : theme.palette.action.hover,
  cursor: "pointer",
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 7,
  paddingRight: 7,
  marginTop: 0,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
}));

/* ---------------- Default Notifications ---------------- */

const defaultNotifications = [
  {
    id: 1,
    message: "New institute registration pending",
    time: "5 min ago",
    read: false,
    route: "/institute-registrations",
  },
  {
    id: 2,
    message: "Trainer certification deadline tomorrow",
    time: "1 hour ago",
    read: false,
    route: "/trainer-certifications",
  },
  {
    id: 3,
    message: "Monthly report ready for review",
    time: "3 hours ago",
    read: true,
    route: "/reports/monthly",
  },
];

const ProfileHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const username = useSelector((state) => state.userProfile.userName);
  const role = useSelector((state) => state.userProfile.current_role_name);
  const userId = useSelector((state) => state.auth.userId);
  const token = useSelector((state) => state.auth.accessToken);

  const [profilePic, setProfilePic] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationEl, setNotificationEl] = useState(null);
  const [notifications, setNotifications] = useState(defaultNotifications);

  const menuOpen = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationEl);

  const initials = useMemo(() => getInitials(username), [username]);
  const avatarColor = useMemo(() => stringToColor(username || ""), [username]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  /* ---------------- Load Profile Image ---------------- */

  useEffect(() => {
    if (!userId || !token) return;

    let objectUrl;

    const loadImage = async () => {
      try {
        const res = await UserProfileService.getUserProfileImage(userId, token);
        const blob = new Blob([res.data], {
          type: res.headers["content-type"],
        });

        objectUrl = URL.createObjectURL(blob);
        setProfilePic(objectUrl);
      } catch (err) {
        setProfilePic(null);
      }
    };

    loadImage();

    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [userId, token]);

  /* ---------------- Handlers ---------------- */

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/");
  }, [dispatch, navigate]);

  const handleProfile = () => {
    navigate("user/user-profile");
    setAnchorEl(null);
  };

  const handleSwitchRole = () => {
    navigate("user/switch-role");
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationEl(null);
  };

  const handleNotificationItemClick = (notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );

    navigate(notification.route);
    handleNotificationClose();
  };

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  /* ---------------- Avatar Component ---------------- */

  const UserAvatar = (
    <Avatar
      src={profilePic || undefined}
      sx={{
        width: 34,
        height: 34,
        bgcolor: !profilePic ? avatarColor : undefined,
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      {!profilePic && (initials || <PersonIcon fontSize="small" />)}
    </Avatar>
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* Notifications */}
      <Tooltip title="Notifications">
        <IconButton onClick={handleNotificationClick}>
          <StyledBadge badgeContent={unreadCount}>
            <NotificationsIcon />
          </StyledBadge>
        </IconButton>
      </Tooltip>

      {/* Notification Popper */}
      <Popper
        open={notificationOpen}
        anchorEl={notificationEl}
        placement="bottom-end"
        transition
        disablePortal
        style={{ zIndex: 1200 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper sx={{ width: 350, maxHeight: 370, ...arrowPaperStyle }}>
              <ClickAwayListener onClickAway={handleNotificationClose}>
                <Box>
                  {/* Header */}
                  <Box
                    sx={{
                      p: 2,
                      mt: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography fontWeight={600}>Notifications</Typography>

                    {unreadCount > 0 && (
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{
                          cursor: "pointer",
                        }}
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </Typography>
                    )}
                  </Box>

                  {/* List */}
                  <List sx={{ p: 0 }}>
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        divider
                        onClick={() =>
                          handleNotificationItemClick(notification)
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CircleIcon
                            sx={{
                              fontSize: 8,
                              color: notification.read
                                ? "text.disabled"
                                : "primary.main",
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontWeight={notification.read ? 200 : 500}
                            >
                              {notification.message}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption">
                              {notification.time}
                            </Typography>
                          }
                        />
                      </NotificationItem>
                    ))}
                  </List>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>

      {/* Avatar */}
      <Tooltip title="Account settings">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          {UserAvatar}
        </IconButton>
      </Tooltip>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 220,
              ...arrowPaperStyle,
            },
          },
        }}
      >
        <MenuItem onClick={handleProfile}>
          {UserAvatar}
          <Box sx={{ ml: 1 }}>
            <Typography variant="subtitle2">{username || "User"}</Typography>
            <Typography variant="caption" color="text.secondary">
              {role || "Role"}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleProfile}>
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
  );
};

export default ProfileHeader;
