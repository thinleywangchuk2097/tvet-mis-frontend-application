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
  Link,
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
import NotificationService from "../../api/services/internal/notification/NotificationService";

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

/* ---------------- Notification helpers ---------------- */

// messages longer than this show a "View more" link
const PREVIEW_LENGTH = 100;

// "5 min ago", "3 hours ago", "2 days ago", then the date
const timeAgo = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// read ids are remembered per user in this browser
const readKey = (userId) => `tvet_notification_read_${userId || "guest"}`;
const loadReadIds = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(readKey(userId)) || "[]");
  } catch {
    return [];
  }
};
const saveReadIds = (userId, ids) => {
  try {
    localStorage.setItem(readKey(userId), JSON.stringify(ids));
  } catch {
    /* storage unavailable: read state just isn't remembered */
  }
};

const ProfileHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const username = useSelector((state) => state.userProfile.userName);
  const role = useSelector((state) => state.userProfile.current_role_name);
  const userId = useSelector((state) => state.auth.userId);
  const token = useSelector((state) => state.auth.accessToken);
  const userNumericId = useSelector((state) => state.auth.id); // tbl_user.id (for role matching)

  const [profilePic, setProfilePic] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationEl, setNotificationEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [expandedId, setExpandedId] = useState(null); // notification showing its full message

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

  /* ---------------- Load Notifications ---------------- */

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    // only notifications sent to this user, or to one of this user's roles
    const res = await NotificationService.getMyNotifications(
      { userId, id: userNumericId },
      token,
    );
    if (!res || res instanceof Error || res?.isAxiosError) return;
    const readIds = loadReadIds(userId);
    setNotifications(
      (Array.isArray(res.data) ? res.data : []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.textMessage || "",
        time: timeAgo(n.updatedAt || n.createdAt),
        read: readIds.includes(n.id),
      })),
    );
  }, [token, userId, userNumericId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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
    loadNotifications(); // refresh when the bell is opened
  };

  const handleNotificationClose = () => {
    setNotificationEl(null);
    setExpandedId(null);
  };

  // clicking a notification only marks it as read (no navigation)
  const markAsRead = (id) =>
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveReadIds(
        userId,
        next.filter((n) => n.read).map((n) => n.id),
      );
      return next;
    });

  const markAllAsRead = () =>
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveReadIds(
        userId,
        next.map((n) => n.id),
      );
      return next;
    });

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
            <Paper sx={{ width: 360, ...arrowPaperStyle }}>
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
                  <List sx={{ p: 0, maxHeight: 340, overflowY: "auto" }}>
                    {notifications.length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        No notifications
                      </Typography>
                    )}
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        divider
                        onClick={() => markAsRead(notification.id)}
                        sx={{ alignItems: "flex-start", py: 0.75 }}
                      >
                        <ListItemIcon sx={{ minWidth: 30, mt: 1 }}>
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
                              fontWeight={notification.read ? 500 : 700}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  whiteSpace: "pre-line",
                                  fontWeight: notification.read ? 300 : 400,
                                }}
                              >
                                {notification.message.length > PREVIEW_LENGTH &&
                                expandedId !== notification.id
                                  ? `${notification.message.slice(0, PREVIEW_LENGTH)}…`
                                  : notification.message}
                              </Typography>
                              {/* bulk (long) message: View more / View less */}
                              {notification.message.length > PREVIEW_LENGTH && (
                                <Link
                                  component="button"
                                  type="button"
                                  underline="hover"
                                  sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                    setExpandedId((cur) =>
                                      cur === notification.id
                                        ? null
                                        : notification.id,
                                    );
                                  }}
                                >
                                  {expandedId === notification.id
                                    ? "View less"
                                    : "View more"}
                                </Link>
                              )}
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ display: "block" }}
                              >
                                {notification.time}
                              </Typography>
                            </>
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
