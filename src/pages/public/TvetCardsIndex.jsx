import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography, alpha } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import PublicPageService from "../../api/services/internal/public/PublicPageService";

// ── Brand palette
const PD = "#0a2d6e";
const P = "#1565c0";
const W = "#ffffff";

// ── Headline stats (values come from /api/v1/public/data/home-stats)
const stats = [
  {
    key: "trainingInstitutes",
    label: "Training Institutes",
    caption: "Registered public and private training providers",
    icon: <BusinessIcon />,
    accent: "#64b5f6",
  },
  {
    key: "programsOffered",
    label: "Programs Offered",
    icon: <SchoolIcon sx={{ fontSize: 18 }} />,
    color: TEAL,
  },
  {
    key: "registeredTrainers",
    label: "Registered Trainers",
    icon: <CoPresentIcon sx={{ fontSize: 18 }} />,
    color: "#6a1b9a",
  },
  {
    key: "traineesEnrolled",
    label: "Trainees Enrolled",
    caption: "Trainees enrolled across all programmes",
    icon: <GroupsIcon />,
    accent: "#81c784",
  },
  {
    key: "dzongkhagsReached",
    label: "Dzongkhags Reached",
    caption: "TVET delivery across every district of Bhutan",
    icon: <MapIcon />,
    accent: "#ffb74d",
  },
];

const TvetCardsIndex = () => {
  // null = not loaded / not available (shown as "—")
  const [targets, setTargets] = useState(stats.map(() => null));
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => "—"));

  // Load the figures
  useEffect(() => {
    let alive = true;
    PublicPageService.getHomeStats().then((res) => {
      if (!alive) return;
      const data =
        res && !(res instanceof Error) && !res.isAxiosError ? res.data || {} : {};
      setTargets(
        stats.map((s) => {
          const v = data[s.key];
          return v === null || v === undefined || Number.isNaN(Number(v))
            ? null
            : Number(v);
        }),
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  // Count up animation once the figures arrive
  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timers = targets.map((target, index) => {
      const setAt = (val) =>
        setAnimatedValues((prev) => {
          const next = [...prev];
          next[index] = val;
          return next;
        });

      if (target === null) {
        setAt("—");
        return null;
      }
      if (reduceMotion || target === 0) {
        setAt(target.toLocaleString());
        return null;
      }

      const duration = 1500;
      const stepTime = 20;
      const increment = target / (duration / stepTime);
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAt(target.toLocaleString());
          clearInterval(timer);
        } else {
          setAt(Math.floor(current).toLocaleString());
        }
      }, stepTime);
      return timer;
    });

    return () => {
      timers.forEach((timer) => timer && clearInterval(timer));
    };
  }, [targets]);

  return value;
};

const StatItem = ({ stat, start, index }) => {
  const value = useCountUp(stat.value, start);
  const divider = `1px solid ${alpha(W, 0.14)}`;

  return (
    <Grid container spacing={1.5}>
      {stats.map((s, i) => (
        <Grid key={i} size={{ xs: 6, sm: 4, md: 2.4 }}>
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

            <Typography
              sx={{
                color: "#0a1929",
                fontWeight: 800,
                fontSize: { xs: "1.3rem", md: "1.6rem" },
                lineHeight: 1,
                animation: `${countUp} 0.6s ease-out ${i * 0.1 + 0.3}s both`,
              }}
            >
              {animatedValues[i] ?? "—"}
            </Typography>

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
