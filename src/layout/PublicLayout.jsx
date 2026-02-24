import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Footer from "../components/public/Footer";
import AnimatedHeader from "../components/public/AnimatedHeader";

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
        <AnimatedHeader />
      </Box>

      {/* Scrollable main content + footer */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto", // vertical scroll
          overflowX: "hidden", // hide horizontal scroll
        }}
      >
        <Outlet />

        {/* Footer included inside scrollable area */}
        <Box
          component="footer"
          sx={{
            py: 1,
            textAlign: "center",
            bgcolor: "background.paper",
            borderTop: "1px solid #ddd",
          }}
        >
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default PublicLayout;
