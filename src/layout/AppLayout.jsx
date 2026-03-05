// src/layout/AppLayout.jsx
import { Box, Drawer, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Sidebar from "../components/auth/Sidebar";
import Header from "../components/auth/Header";
import Footer from "../components/auth/Footer";
import { Outlet } from "react-router-dom";

const drawerWidth = 240;

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              mt: "64px", // Moves below header
            },
          }}
        >
          <Sidebar />
        </Drawer>
      ) : (
        <Box
          sx={{
            position: "absolute", // Floating sidebar
            top: "64px", // Under header
            left: 0,
            width: drawerWidth,
            height: "calc(100vh - 64px)",
            bgcolor: "background.paper",
            borderRight: "1px solid #ddd",
            zIndex: 1200,
          }}
        >
          <Sidebar />
        </Box>
      )}
      {/* Main content area */}
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "64px 1fr 40px",
          flexGrow: 1,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header full width */}
        <Box
          sx={{
            gridRow: "1",
            borderBottom: "1px solid #ddd",
            minHeight: "64px",
            width: "100vw",
          }}
        >
          <Header onToggleSidebar={handleDrawerToggle} />
        </Box>

        {/* Scrollable Main */}
        <Box
          sx={{
            gridRow: "2",
            overflowY: "auto",
            p: { xs: 2, sm: 2 },
            bgcolor: "background.default",
            ml: { md: `${drawerWidth}px` }, // Push main content for desktop
          }}
        >
          <Outlet />
        </Box>

        {/* Footer */}
        <Box sx={{ gridRow: "3", ml: { md: `${drawerWidth}px` } }}>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
