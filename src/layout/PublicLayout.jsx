import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "../components/public/Header";
import Footer from "../components/public/Footer";

const PublicLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Static Header */}
      <Box sx={{ flexShrink: 0 }}>
        <Header />
      </Box>
      {/* Scrollable main content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto", // vertical scroll
          overflowX: "hidden", // hide horizontal scroll
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          flexShrink: 0,
          py: 1, // small vertical padding
          textAlign: "center",
          bgcolor: "background.paper",
          borderTop: "1px solid #ddd",
        }}
      >
        <Footer />
      </Box>
    </Box>
  );
};

export default PublicLayout;
