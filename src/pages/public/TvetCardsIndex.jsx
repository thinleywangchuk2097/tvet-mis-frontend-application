import React from "react";
import { Box, Grid, Typography, alpha } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";

// ── Brand palette
const P = "#1565c0";
const TEAL = "#0097a7";

// ── Headline stats
const stats = [
  {
    value: "144",
    label: "Training Institutes",
    icon: <BusinessIcon sx={{ fontSize: 22 }} />,
    color: P,
  },
  {
    value: "720",
    label: "Programs Offered",
    icon: <SchoolIcon sx={{ fontSize: 22 }} />,
    color: TEAL,
  },
  {
    value: "76,767",
    label: "Trainees Enrolled",
    icon: <GroupsIcon sx={{ fontSize: 22 }} />,
    color: "#2e7d32",
  },
  {
    value: "20",
    label: "Dzongkhags Reached",
    icon: <PublicIcon sx={{ fontSize: 22 }} />,
    color: "#e65100",
  },
];

const TvetCardsIndex = () => {
  // Check if stats data is available and not empty
  const hasData = stats && stats.length > 0;

  if (!hasData) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          bgcolor: "#ffffff",
          borderRadius: 2.5,
          border: "1px solid #e3eaf4",
        }}
      >
        <Typography
          sx={{ color: "error.main", fontWeight: 600, fontSize: "0.9rem" }}
        >
          No data available
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#666", mt: 1, display: "block" }}
        >
          No TVET statistics found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {stats.map((s, i) => (
        <Grid key={i} size={{ xs: 6, md: 3 }}>
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: `1px solid ${alpha(s.color, 0.18)}`,
              borderRadius: 2.5,
              p: { xs: 2, md: 2.6 },
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${s.color}, ${alpha(s.color, 0.5)})`,
              },
              "&:hover": {
                transform: "translateY(-4px)",
                borderColor: s.color,
                boxShadow: `0 12px 28px ${alpha(s.color, 0.18)}`,
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: alpha(s.color, 0.12),
                color: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              {s.icon}
            </Box>
            <Typography
              sx={{
                color: "#0a1929",
                fontWeight: 800,
                fontSize: { xs: "1.5rem", md: "1.9rem" },
                lineHeight: 1,
              }}
            >
              {s.value}
            </Typography>
            <Typography
              sx={{
                color: s.color,
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                mt: 1.2,
              }}
            >
              {s.label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default TvetCardsIndex;
