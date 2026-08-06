import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, alpha, keyframes } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";

// ── Brand palette
const P = "#1565c0";
const TEAL = "#0097a7";

// ── Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const countUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const rotateIcon = keyframes`
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(10deg);
  }
  75% {
    transform: rotate(-10deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

// ── Headline stats
const stats = [
  {
    value: "144",
    label: "Training Institutes",
    icon: <BusinessIcon sx={{ fontSize: 18 }} />,
    color: P,
  },
  {
    value: "720",
    label: "Programs Offered",
    icon: <SchoolIcon sx={{ fontSize: 18 }} />,
    color: TEAL,
  },
  {
    value: "6,767",
    label: "Trainees Enrolled",
    icon: <GroupsIcon sx={{ fontSize: 18 }} />,
    color: "#2e7d32",
  },
  {
    value: "20",
    label: "Dzongkhags Reached",
    icon: <PublicIcon sx={{ fontSize: 18 }} />,
    color: "#e65100",
  },
];

const TvetCardsIndex = () => {
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => 0));

  // Count up animation
  useEffect(() => {
    const timeouts = stats.map((stat, index) => {
      const targetValue = parseInt(stat.value.replace(/,/g, ""));
      const duration = 1500;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = targetValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
          setAnimatedValues((prev) => {
            const newValues = [...prev];
            newValues[index] = stat.value;
            return newValues;
          });
          clearInterval(timer);
        } else {
          setAnimatedValues((prev) => {
            const newValues = [...prev];
            newValues[index] = Math.floor(current).toLocaleString();
            return newValues;
          });
        }
      }, stepTime);

      return timer;
    });

    return () => {
      timeouts.forEach((timer) => timer && clearInterval(timer));
    };
  }, []);

  // Check if stats data is available and not empty
  const hasData = stats && stats.length > 0;

  if (!hasData) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
          bgcolor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e3eaf4",
        }}
      >
        <Typography
          sx={{
            color: "error.main",
            fontWeight: 600,
            fontSize: "0.8rem",
          }}
        >
          No data available
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#666",
            mt: 0.5,
            display: "block",
            fontSize: "0.7rem",
          }}
        >
          No TVET statistics found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={1.5}>
      {stats.map((s, i) => (
        <Grid key={i} size={{ xs: 6, md: 3 }}>
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: `1px solid ${alpha(s.color, 0.18)}`,
              borderRadius: 2,
              p: { xs: 1.5, md: 1.8 },
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: `${fadeInUp} 0.5s ease-out ${i * 0.1}s both`,
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${s.color}, ${alpha(s.color, 0.5)})`,
                transform: "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.5s ease-out",
              },
              "&:hover::before": {
                transform: "scaleX(1)",
              },
              "&:hover": {
                transform: "translateY(-3px)",
                borderColor: s.color,
                boxShadow: `0 8px 20px ${alpha(s.color, 0.15)}`,
              },
              "&:hover .icon-box": {
                animation: `${rotateIcon} 0.4s ease-in-out`,
              },
              "&:hover .ripple-effect": {
                animation: `${ripple} 0.5s ease-out`,
              },
            }}
          >
            {/* Ripple effect on hover */}
            <Box
              className="ripple-effect"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                backgroundColor: alpha(s.color, 0.1),
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />

            <Box
              className="icon-box"
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: alpha(s.color, 0.12),
                color: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1,
                transition: "all 0.3s ease",
                animation: `${scaleIn} 0.4s ease-out ${i * 0.1 + 0.2}s both`,
              }}
            >
              {s.icon}
            </Box>

            <Typography
              sx={{
                color: "#0a1929",
                fontWeight: 800,
                fontSize: { xs: "1.3rem", md: "1.6rem" },
                lineHeight: 1,
                animation: `${countUp} 0.6s ease-out ${i * 0.1 + 0.3}s both`,
              }}
            >
              {animatedValues[i] || "0"}
            </Typography>

            <Typography
              sx={{
                color: s.color,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                mt: 1,
                position: "relative",
                display: "inline-block",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -3,
                  left: "50%",
                  transform: "translateX(-50%) scaleX(0)",
                  width: "30%",
                  height: 1.5,
                  backgroundColor: s.color,
                  transition: "transform 0.3s ease",
                },
              }}
              className="label-text"
            >
              {s.label}
            </Typography>

            {/* Decorative dots */}
            <Box
              sx={{
                position: "absolute",
                bottom: 6,
                right: 6,
                width: 3,
                height: 3,
                borderRadius: "50%",
                backgroundColor: alpha(s.color, 0.3),
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 11,
                right: 11,
                width: 2,
                height: 2,
                borderRadius: "50%",
                backgroundColor: alpha(s.color, 0.2),
              }}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default TvetCardsIndex;
