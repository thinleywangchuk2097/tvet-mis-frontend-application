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
  ListItemButton,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import * as MuiIcons from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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

  const isActive = (path) => location.pathname === path;

  // Dynamic icon rendering
  const renderIcon = (iconName) => {
    if (!iconName) return 0;
    const formattedName = iconName.replace(/Icon$/, "");
    const IconComponent = MuiIcons[formattedName];
    if (!IconComponent) return 0;
    return <IconComponent fontSize="small" />;
  };

  const mainMenus = privileges
    .filter((priv) => priv.parent_id === 0)
    .sort(
      (a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0),
    );

  const getSubmenus = (parentId) =>
    privileges
      .filter((priv) => priv.parent_id === parentId)
      .sort(
        (a, b) =>
          (Number(a.display_order) || 0) - (Number(b.display_order) || 0),
      );

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
      {/* Menu */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 3 }}>
        <List disablePadding>
          {mainMenus.map((menu) => {
            const submenus = getSubmenus(menu.id);
            const hasSubmenus = submenus.length > 0;
            const activeMain = isActive(menu.route_name);

            return (
              <React.Fragment key={menu.id}>
                {/* Parent Menu */}
                <ListItem disablePadding>
                  <ListItemButton
                    sx={menuItemSx(activeMain)}
                    onClick={() =>
                      hasSubmenus
                        ? toggleMenu(menu.id)
                        : navigate(menu.route_name)
                    }
                  >
                    <ListItemIcon>{renderIcon(menu.menuIcon)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: "0.85rem" }}>
                          {menu.privilege_name}
                        </Typography>
                      }
                    />
                    {hasSubmenus &&
                      (expandedMenus[menu.id] ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      ))}
                  </ListItemButton>
                </ListItem>

                {/* Submenus */}
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
                              primary={
                                <Typography sx={{ fontSize: "0.8rem" }}>
                                  {submenu.privilege_name}
                                </Typography>
                              }
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
