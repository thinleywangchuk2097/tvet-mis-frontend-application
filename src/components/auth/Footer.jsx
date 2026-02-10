// src/components/Footer.jsx
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      sx={(theme) => ({
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Typography variant="body2">
        © 2026 All rights reserved. TVET-Mis Ministry of Education and Skills Development.
      </Typography>
    </Box>
  );
};

export default Footer;
