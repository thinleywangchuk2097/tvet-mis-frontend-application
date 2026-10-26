import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography, alpha } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import MapIcon from "@mui/icons-material/Map";

// ── Brand palette
const PD = "#0a2d6e";
const P = "#1565c0";
const W = "#ffffff";

// ── Headline stats
const stats = [
  {
    value: 144,
    label: "Training Institutes",
    caption: "Registered public and private training providers",
    icon: <BusinessIcon />,
    accent: "#64b5f6",
  },
  {
    value: 720,
    label: "Programmes Offered",
    caption: "Accredited and non-accredited TVET programmes",
    icon: <SchoolIcon />,
    accent: "#4dd0e1",
  },
  {
    value: 6767,
    label: "Trainees Enrolled",
    caption: "Trainees enrolled across all programmes",
    icon: <GroupsIcon />,
    accent: "#81c784",
  },
  {
    value: 20,
    label: "Dzongkhags Reached",
    caption: "TVET delivery across every district of Bhutan",
    icon: <MapIcon />,
    accent: "#ffb74d",
  },
];

// ── Count up once the band scrolls into view
const useCountUp = (target, start, duration = 1400) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    let frame;
    const begin = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - begin) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, duration]);

  return value;
};

const StatItem = ({ stat, start, index }) => {
  const value = useCountUp(stat.value, start);
  const divider = `1px solid ${alpha(W, 0.14)}`;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: { xs: 1.5, md: 3 },
        py: { xs: 1.5, md: 0.5 },
        borderLeft: {
          xs: index % 2 === 1 ? divider : "none",
          md: index === 0 ? "none" : divider,
        },
        borderTop: { xs: index < 2 ? "none" : divider, md: "none" },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2,
          bgcolor: alpha(stat.accent, 0.16),
          color: stat.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {stat.icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: W,
            fontWeight: 800,
            fontSize: { xs: "1.4rem", md: "1.75rem" },
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography
          sx={{
            color: alpha(W, 0.85),
            fontWeight: 600,
            fontSize: { xs: "0.75rem", md: "0.82rem" },
            lineHeight: 1.3,
          }}
          title={stat.caption}
        >
          {stat.label}
        </Typography>
      </Box>
    </Box>
  );
};

StatItem.propTypes = {
  stat: PropTypes.shape({
    value: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    caption: PropTypes.string,
    icon: PropTypes.node,
    accent: PropTypes.string,
  }).isRequired,
  start: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

const TvetCardsIndex = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        background: `linear-gradient(120deg, ${PD} 0%, #0d3b8a 55%, ${P} 100%)`,
        boxShadow: "0 18px 40px rgba(10,45,110,0.22)",
        py: { xs: 1, md: 2.25 },
        px: { xs: 0.5, md: 1.5 },
      }}
    >
      {/* Subtle decorative shapes */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: "50%",
          top: -150,
          right: -80,
          bgcolor: alpha(W, 0.05),
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          bottom: -120,
          left: "35%",
          bgcolor: alpha(W, 0.04),
        }}
      />

      <Grid container sx={{ position: "relative" }}>
        {stats.map((stat, index) => (
          <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
            <StatItem stat={stat} start={visible} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TvetCardsIndex;
