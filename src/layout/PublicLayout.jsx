import { Box, AppBar, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "../components/public/Header";
import Footer from "../components/public/Footer";
const PublicLayout = () => {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: "primary.main", boxShadow: 2 }}>
        <Header />
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Outlet renders page content like PublicIndex */}
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          height: 60,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderTop: "1px solid #ddd",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <Footer />
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicLayout;
