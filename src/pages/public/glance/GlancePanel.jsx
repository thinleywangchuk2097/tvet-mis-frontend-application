import PropTypes from "prop-types";
import { Box, Paper, Stack, Typography, alpha } from "@mui/material";
import { BLUE, LINE, NAVY } from "./glanceData";

// White card with an icon, title, subtitle and an optional right-side slot.
const GlancePanel = ({ icon, title, subtitle, action, children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      height: "100%",
      // never wider than its grid column (wide charts scroll inside instead)
      minWidth: 0,
      border: `1px solid ${LINE}`,
      borderRadius: 2.5,
      p: { xs: 1.75, md: 2 },
      bgcolor: "#fff",
      boxShadow: "0 2px 8px rgba(10,45,110,0.06)",
      display: "flex",
      flexDirection: "column",
      ...sx,
    }}
  >
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 1.25 }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        {icon && (
          <Box
            sx={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(BLUE, 0.08),
              color: BLUE,
              "& svg": { fontSize: 17 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{ fontWeight: 700, fontSize: "0.98rem", color: NAVY, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>{children}</Box>
  </Paper>
);

GlancePanel.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default GlancePanel;
