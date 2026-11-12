import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, alpha, keyframes } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PlaceIcon from "@mui/icons-material/Place";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import PublicPageService from "../../api/services/internal/public/PublicPageService";

// ── Palette
const NAVY = "#0a2d6e";
const NAVY_DEEP = "#061a45";
const BLUE = "#1565c0";
const W = "#ffffff";

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
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
    icon: PlaceIcon,
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
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.25, md: 0.5 },
        minWidth: 0,
        animation: `${rise} .45s ease-out ${index * 0.06}s both`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: stat.accent,
          bgcolor: alpha(stat.accent, 0.15),
        }}
      >
        <Icon sx={{ fontSize: 19 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: W,
            fontWeight: 800,
            fontSize: { xs: "1.2rem", md: "1.4rem" },
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {target === null ? "—" : value.toLocaleString()}
        </Typography>
        <Typography
          noWrap
          sx={{
            color: alpha(W, 0.75),
            fontWeight: 500,
            fontSize: { xs: "0.72rem", md: "0.78rem" },
          }}
        >
          {stat.label}
        </Typography>
      </Box>
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

  const divider = `1px solid ${alpha(W, 0.12)}`;

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        py: { xs: 0.5, md: 1.75 },
        px: { xs: 0.5, md: 1 },
        background: `linear-gradient(110deg, ${NAVY_DEEP} 0%, ${NAVY} 55%, ${BLUE} 100%)`,
        boxShadow: `0 10px 26px ${alpha(NAVY, 0.18)}`,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(360px 160px at 90% 0%, ${alpha("#4dd0e1", 0.14)}, transparent 70%)`,
        }}
      />
      <Box
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
          },
          // thin dividers between items on desktop
          "& > *": { borderLeft: { md: divider } },
          "& > *:first-of-type": { borderLeft: { md: "none" } },
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
