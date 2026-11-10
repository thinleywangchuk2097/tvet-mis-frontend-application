import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, alpha, keyframes } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import PublicPageService from "../../api/services/internal/public/PublicPageService";

// ── Palette
const NAVY = "#0a2d6e";
const NAVY_DEEP = "#061a45";
const BLUE = "#1565c0";
const W = "#ffffff";

const rise = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Headline stats (values come from /api/v1/public/data/home-stats)
const stats = [
  {
    key: "trainingInstitutes",
    label: "Training Institutes",
    icon: BusinessIcon,
    accent: "#64b5f6",
  },
  {
    key: "programsOffered",
    label: "Programs Offered",
    icon: SchoolIcon,
    accent: "#4dd0e1",
  },
  {
    key: "registeredTrainers",
    label: "Registered Trainers",
    icon: CoPresentIcon,
    accent: "#b39ddb",
  },
  {
    key: "traineesEnrolled",
    label: "Trainees Enrolled",
    icon: GroupsIcon,
    accent: "#81c784",
  },
  {
    key: "dzongkhagsReached",
    label: "Dzongkhags Reached",
    icon: PublicIcon,
    accent: "#ffb74d",
  },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Count up from 0 to target once `start` is true
const useCountUp = (target, start, duration = 1500) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === null || !start) return undefined;
    if (prefersReducedMotion() || target === 0) {
      setValue(target);
      return undefined;
    }
    let frame;
    const begin = performance.now();
    const tick = (now) => {
      const p = Math.min((now - begin) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, duration]);

  return value;
};

const StatTile = ({ stat, target, start, index }) => {
  const value = useCountUp(target, start);
  const Icon = stat.icon;

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        bgcolor: alpha(W, 0.06),
        border: `1px solid ${alpha(W, 0.1)}`,
        backdropFilter: "blur(6px)",
        overflow: "hidden",
        transition: "transform .3s ease, background-color .3s ease, border-color .3s ease",
        animation: `${rise} .5s ease-out ${index * 0.08}s both`,
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 3,
          width: "100%",
          background: `linear-gradient(90deg, ${stat.accent}, ${alpha(stat.accent, 0)})`,
          opacity: 0.7,
        },
        "&:hover": {
          transform: "translateY(-4px)",
          bgcolor: alpha(W, 0.1),
          borderColor: alpha(stat.accent, 0.5),
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          color: stat.accent,
          bgcolor: alpha(stat.accent, 0.14),
          boxShadow: `inset 0 0 0 1px ${alpha(stat.accent, 0.3)}`,
          mb: 2,
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Typography
        sx={{
          color: W,
          fontWeight: 800,
          fontSize: { xs: "1.6rem", md: "2.1rem" },
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {target === null ? "—" : value.toLocaleString()}
      </Typography>
      <Typography
        sx={{
          mt: 0.9,
          color: alpha(W, 0.78),
          fontWeight: 600,
          fontSize: { xs: "0.78rem", md: "0.85rem" },
          letterSpacing: 0.2,
        }}
      >
        {stat.label}
      </Typography>
    </Box>
  );
};

StatTile.propTypes = {
  stat: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    accent: PropTypes.string.isRequired,
  }).isRequired,
  target: PropTypes.number,
  start: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

const TvetCardsIndex = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  // null = not loaded / not available (shown as "—")
  const [targets, setTargets] = useState(stats.map(() => null));

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

  // Start counting when the band scrolls into view
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
      { threshold: 0.2 },
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
        borderRadius: 4,
        p: { xs: 1.5, md: 2.5 },
        background: `linear-gradient(125deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${BLUE} 100%)`,
        boxShadow: `0 20px 44px ${alpha(NAVY, 0.25)}`,
      }}
    >
      {/* Soft glows and a faint grid for depth */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(420px 220px at 12% 0%, ${alpha("#4dd0e1", 0.18)}, transparent 70%), radial-gradient(380px 240px at 95% 100%, ${alpha("#ffb74d", 0.14)}, transparent 70%)`,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.35,
          backgroundImage: `linear-gradient(${alpha(W, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(W, 0.05)} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 85%)",
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "grid",
          gap: { xs: 1.25, md: 2 },
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
          },
        }}
      >
        {stats.map((stat, i) => (
          <StatTile
            key={stat.key}
            stat={stat}
            target={targets[i]}
            start={visible}
            index={i}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TvetCardsIndex;
