import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Collapse,
  ListItemIcon,
  Typography,
  Avatar,
  ListItemButton,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BuildIcon from "@mui/icons-material/Build";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import logo from "../../assets/bhutan-emblem.jpeg";

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const privileges = useSelector((state) => state.privileges?.privileges || []);
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const getMenuIcon = (name) => {
    const icons = {
      Dashboard: <DashboardIcon fontSize="small" />,
      "Trainee Dashboard": <DashboardIcon fontSize="small" />,
      Administration: <PeopleIcon fontSize="small" />,
      "Dropdown Management": <DownloadForOfflineIcon fontSize="small" />,
      TaskList: <FormatListNumberedIcon fontSize="small" />,
      "Report Management": <AssessmentIcon fontSize="small" />,
      Service: <BuildIcon fontSize="small" />,
    };
    return icons[name] || <MiscellaneousServicesIcon fontSize="small" />;
  };

  const isActive = (path) => location.pathname === path;

  const menuItemSx = (active) => ({
    mx: 0.5,
    mb: 0.5,
    borderRadius: 1,
    px: 1.5,
    py: 0.75,
    fontWeight: active ? 600 : 500,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    borderLeft: active
      ? `3px solid ${theme.palette.primary.main}`
      : "3px solid transparent",
    transition: "all 0.2s ease",

    "&:hover": {
      color: theme.palette.primary.main,
      transform: "translateX(4px)",
      borderLeft: `3px solid ${theme.palette.primary.main}`,
    },

    "& .MuiListItemIcon-root": {
      minWidth: 34,
      color: active ? theme.palette.primary.main : theme.palette.text.secondary,
      transition: "color 0.2s ease",
    },

    "&:hover .MuiListItemIcon-root": {
      color: theme.palette.primary.main,
    },
  });

  const subMenuItemSx = (active) => ({
    ml: 3,
    mr: 0.5,
    mb: 0.25,
    py: 0.5,
    fontSize: "0.8rem",
    fontWeight: active ? 600 : 400,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    borderLeft: active
      ? `2px solid ${theme.palette.primary.main}`
      : "2px solid transparent",
    transition: "all 0.2s ease",

    "&:hover": {
      color: theme.palette.primary.main,
      transform: "translateX(4px)",
      borderLeft: `2px solid ${theme.palette.primary.main}`,
    },
  });

  const mainMenus = privileges.filter((priv) => priv.parent_id === null);
  const getSubmenus = (parentId) =>
    privileges.filter((priv) => priv.parent_id === parentId);

  return (
    <Box
      sx={{
        width: 240,
        height: "100vh",
        borderRight: `1px solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo Header */}
      <Box
        sx={{
          px: 2,
          py: 1.35,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar src={logo} sx={{ width: 44, height: 44 }} />
        <Typography fontWeight={600} fontSize="0.95rem">
          TVET-MIS
        </Typography>
      </Box>

      {/* Menu */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        <List disablePadding>
          {mainMenus.map((menu) => {
            const submenus = getSubmenus(menu.id);
            const hasSubmenus = submenus.length > 0;
            const activeMain = isActive(menu.route_name);

            return (
              <React.Fragment key={menu.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={menuItemSx(activeMain)}
                    onClick={() =>
                      hasSubmenus
                        ? toggleMenu(menu.id)
                        : navigate(menu.route_name)
                    }
                  >
                    <ListItemIcon>
                      {getMenuIcon(menu.privilege_name)}
                    </ListItemIcon>

                    <ListItemText
                      primary={menu.privilege_name}
                      slotProps={{
                        primary: { sx: { fontSize: "0.85rem" } },
                      }}
                    />

                    {hasSubmenus &&
                      (expandedMenus[menu.id] ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      ))}
                  </ListItemButton>
                </ListItem>

                {hasSubmenus && (
                  <Collapse in={expandedMenus[menu.id]} timeout={200}>
                    <List disablePadding>
                      {submenus.map((submenu) => (
                        <ListItem key={submenu.id} disablePadding>
                          <ListItemButton
                            sx={subMenuItemSx(isActive(submenu.route_name))}
                            onClick={() => navigate(submenu.route_name)}
                          >
                            <ListItemText
                              primary={submenu.privilege_name}
                              slotProps={{
                                primary: { sx: { fontSize: "0.8rem" } },
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
