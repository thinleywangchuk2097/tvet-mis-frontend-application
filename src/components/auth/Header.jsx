import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Typography,
  Avatar,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../../features/theme/themeSlice";
import ProfileHeader from "./ProfileHeader";
import logo from "../../assets/bhutan-emblem.jpeg"; // import your logo

const Header = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme.mode);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
        py: 0.7,//height of header
      })}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Left Side: Sidebar toggle + Logo + Text */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Sidebar toggle for mobile */}
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            edge="start"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Logo + Text */}
          <Avatar src={logo} sx={{ width: 45, height: 45 }} />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ fontSize: "1rem" }} // slightly smaller
          >
            TVET-MIS
          </Typography>
        </Box>

        {/* Right Side: Theme toggle + Profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip
            title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          >
            <IconButton color="inherit" onClick={() => dispatch(toggleTheme())}>
              {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <ProfileHeader />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
