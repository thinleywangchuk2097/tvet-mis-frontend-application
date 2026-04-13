import { Box, Drawer, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Sidebar from "../components/auth/Sidebar";
import Header from "../components/auth/Header";
import Footer from "../components/auth/Footer";
import { Outlet } from "react-router-dom";

const drawerWidth = 240;
const headerHeight = 64;
const footerHeight = 40;

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          anchor="left"
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: drawerWidth,
              boxSizing: "border-box",
              overflow: "hidden", // no scroll
            },
          }}
        >
          <Box
            sx={{
              pt: `${headerHeight}px`,
              height: `calc(100vh - ${headerHeight}px)`,
              boxSizing: "border-box",
            }}
          >
            <Sidebar />
          </Box>
        </Drawer>
      ) : (
        <Box
          sx={{
            position: "absolute",
            top: `${headerHeight}px`,
            left: 0,
            width: drawerWidth,
            height: `calc(100vh - ${headerHeight}px)`,
            bgcolor: "background.paper",
            borderRight: "1px solid #ddd",
            zIndex: 1200,
            boxSizing: "border-box",
            overflow: "hidden", // no scroll
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* Main layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: `${headerHeight}px 1fr ${footerHeight}px`,
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box sx={{ borderBottom: "1px solid #ddd", width: "100%" }}>
          <Header onToggleSidebar={handleDrawerToggle} />
        </Box>

        {/* Scrollable Main Content */}
        <Box
          sx={{
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            p: 2,
            bgcolor: "background.default",
            ml: { md: `${drawerWidth}px` },
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            ml: { md: `${drawerWidth}px` },
            borderTop: "1px solid #ddd",
          }}
        >
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
