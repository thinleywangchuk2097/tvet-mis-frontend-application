import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Stack,
  Divider,
  Drawer,
  Menu,
  MenuItem,
  Fade,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LoginIcon from "@mui/icons-material/Login";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArticleIcon from "@mui/icons-material/Article";
import BusinessIcon from "@mui/icons-material/Business";
import ApartmentIcon from "@mui/icons-material/Apartment";
import VerifiedIcon from "@mui/icons-material/Verified";
import GroupsIcon from "@mui/icons-material/Groups";
import GavelIcon from "@mui/icons-material/Gavel";
import EngineeringIcon from "@mui/icons-material/Engineering";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SchoolIcon from "@mui/icons-material/School";
import RefreshIcon from "@mui/icons-material/Refresh";
import PaymentIcon from "@mui/icons-material/Payment";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";
import FeedbackIcon from "@mui/icons-material/Feedback";
import PublicIcon from '@mui/icons-material/Public';
import { useNavigate, useLocation } from "react-router-dom";

// ── Government logo
import govtLogo from "../../assets/logo/govt-logo-lg.png";

// ── Brand palette
const P = "#1565c0";
const PD = "#0a2d6e";
const PDD = "#061a45";
const PL = "#e8f1fb";
const TEAL = "#26c6da";
const W = "#ffffff";

// ── Nav menu ────────────────────────────────────────────────────────────────
const NAV_MENU = [
  { label: "Home", icon: <HomeIcon sx={{ fontSize: 16 }} />, path: "/" },
  {
    label: "Proposal",
    icon: <ArticleIcon sx={{ fontSize: 16 }} />,
    sub: [
      {
        label: "Institute ",
        icon: <BusinessIcon sx={{ fontSize: 16 }} />,
        path: "/proposal/institute/6",
      },
      {
        label: "SES Centre ",
        icon: <ApartmentIcon sx={{ fontSize: 16 }} />,
        path: "/proposal/ses-centre/34",
      },
      {
        label: "Assessment Centre ",
        icon: <AssessmentIcon sx={{ fontSize: 16 }} />,
        path: "/proposal/assessment-center/35",
      },
    ],
  },
  {
    label: "Registration",
    icon: <HowToRegIcon sx={{ fontSize: 16 }} />,
    sub: [
      {
        label: "Institute ",
        icon: <BusinessIcon sx={{ fontSize: 16 }} />,
        path: "/register/institute/7",
      },
      {
        label: "SES Centre ",
        icon: <ApartmentIcon sx={{ fontSize: 16 }} />,
        path: "/register/ses-centre/36",
      },
      {
        label: "Assessment Centre Accreditation",
        icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
        path: "/register/assessment-centre/4",
      },
      {
        label: "Assessor ",
        icon: <GroupsIcon sx={{ fontSize: 16 }} />,
        path: "/registration/assessor/32",
      },
      {
        label: "Accreditor ",
        icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
        path: "/registration/accreditor/5",
      },
      {
        label: "Quality Auditor ",
        icon: <GavelIcon sx={{ fontSize: 16 }} />,
        path: "/registration/qms-auditor/3",
      },
    ],
  },
  {
    label: "Renewal",
    icon: <RefreshIcon sx={{ fontSize: 16 }} />,
    sub: [
      {
        label: "Assessor",
        icon: <GroupsIcon sx={{ fontSize: 16 }} />,
        path: "/renewal/assessor/32",
      },
      {
        label: "Accreditor",
        icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
        path: "/renewal/accreditor/5",
      },
      {
        label: "Quality Auditor",
        icon: <GavelIcon sx={{ fontSize: 16 }} />,
        path: "/renewal/qms-auditor/3",
      },
    ],
  },
  {
    label: "Reports",
    icon: <RuleFolderIcon sx={{ fontSize: 16 }} />,
    sub: [
      {
        label: "Assessor",
        icon: <GroupsIcon sx={{ fontSize: 16 }} />,
        path: "/reports/assessor",
      },
      {
        label: "Institute/Center",
        icon: <BusinessIcon sx={{ fontSize: 16 }} />,
        path: "/reports/institute",
      },
      {
        label: "Accreditor",
        icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
        path: "/reports/accreditor",
      },
      {
        label: "Trainer",
        icon: <EngineeringIcon sx={{ fontSize: 16 }} />,
        path: "/reports/trainer",
      },
      {
        label: "QMS Auditor",
        icon: <GavelIcon sx={{ fontSize: 16 }} />,
        path: "/reports/qms-auditor",
      },
      {
        label: "Courses Accredited",
        icon: <SchoolIcon sx={{ fontSize: 16 }} />,
        path: "/reports/courses-accredited",
      },
    ],
  },
  {
    label: "Assessment Result",
    icon: <AssessmentIcon sx={{ fontSize: 16 }} />,
    path: "/result/assessment-result",
  },
  {
    label: "Payment",
    icon: <PaymentIcon sx={{ fontSize: 16 }} />,
    path: "/birms/payment-index",
  },
  {
    label: "Feedback/Complain",
    icon: <FeedbackIcon sx={{ fontSize: 16 }} />,
    path: "/feedback/form",
  },
   {
    label: "Publication",
    icon: <PublicIcon  sx={{ fontSize: 16 }} />,
    path: "/publication/publication-index",
  },
    {
    label: "Forms",
    icon: <FileCopyIcon  sx={{ fontSize: 16 }} />,
    path: "/forms/forms-index",
  },
];

// Paths that require a full page reload after navigation
const refreshPaths = [
  "/register/institute/7",
  "/register/ses-centre/36",
  "/register/assessment-centre/4",
];

const HoverMenu = ({ item, onItemClick, navBtnSx, activeBtnSx }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const timerRef = useRef(null);
  const isOpen = Boolean(anchorEl);

  const handleEnter = (e) => {
    clearTimeout(timerRef.current);
    if (!anchorEl) setAnchorEl(e.currentTarget);
  };
  const scheduleClose = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAnchorEl(null), 200);
  };
  const cancelClose = () => clearTimeout(timerRef.current);

  return (
    <Box onMouseEnter={handleEnter} onMouseLeave={scheduleClose}>
      <Button
        startIcon={item.icon}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: "15px !important",
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "none",
            }}
          />
        }
        sx={{ ...navBtnSx, ...(isOpen ? activeBtnSx : {}) }}
      >
        {item.label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        slots={{ transition: Fade }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            elevation: 0,
            onMouseEnter: cancelClose,
            onMouseLeave: scheduleClose,
            sx: {
              pointerEvents: "auto",
              mt: 0,
              minWidth: 270,
              borderRadius: "0 0 10px 10px",
              borderTop: `3px solid ${TEAL}`,
              boxShadow: "0 10px 36px rgba(0,0,0,0.22)",
              overflow: "hidden",
            },
          },
          list: { sx: { p: 0 } },
        }}
        disableAutoFocus
        disableAutoFocusItem
        disableRestoreFocus
        disableScrollLock
      >
        {item.sub.flatMap((s, si) => [
          <MenuItem
            key={s.path}
            onClick={() => {
              setAnchorEl(null);
              onItemClick(s.path);
            }}
            sx={{
              py: 1.1,
              px: 2.2,
              minHeight: "auto",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#1a2740",
              transition: "all 0.15s",
              borderLeft: "3px solid transparent",
              gap: 1.3,
              "&:hover": {
                bgcolor: PL,
                color: P,
                borderLeftColor: P,
                pl: 2.6,
              },
            }}
          >
            <Box sx={{ color: P, display: "flex" }}>{s.icon}</Box>
            {s.label}
          </MenuItem>,
          si < item.sub.length - 1 && (
            <Divider
              key={`${s.path}-d`}
              sx={{ mx: 2, my: 0, borderColor: "#eef2f9" }}
            />
          ),
        ])}
      </Menu>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpand, setMobileExpand] = useState({});

  // Navigate with optional full page reload
  const handleNav = (path, closeFn) => {
    if (closeFn) closeFn();
    if (!path) return;
    navigate(path);
    if (refreshPaths.includes(path)) {
      setTimeout(() => window.location.reload(), 100);
    }
  };

  const toggleMobileExpand = (label) =>
    setMobileExpand((p) => ({ ...p, [label]: !p[label] }));

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileExpand({});
  };

  // Shared nav-button style
  const navBtnSx = {
    color: alpha(W, 0.85),
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "none",
    px: 1.6,
    py: 1.3,
    borderRadius: 0,
    minWidth: "unset",
    bgcolor: "transparent",
    borderBottom: "3px solid transparent",
    transition: "all 0.2s",
    letterSpacing: 0.2,
    "&:hover": {
      color: W,
      bgcolor: alpha(W, 0.08),
      borderBottom: `3px solid ${TEAL}`,
    },
  };
  const activeBtnSx = {
    color: W,
    bgcolor: alpha(W, 0.1),
    borderBottom: `3px solid ${TEAL}`,
  };

  return (
    <Box sx={{ position: "sticky", top: 0, zIndex: 1200 }}>
      {/* ── Top info bar ─────────────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(90deg, ${PDD} 0%, ${PD} 100%)`,
          py: 0.6,
          px: { xs: 1.5, md: 4 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 1, md: 2 }}
            divider={
              <Box sx={{ width: "1px", height: 12, bgcolor: alpha(W, 0.18) }} />
            }
          >
            <Stack direction="row" alignItems="center" spacing={0.7}>
              <PhoneIcon sx={{ color: TEAL, fontSize: 13 }} />
              <Typography
                sx={{
                  color: alpha(W, 0.78),
                  fontSize: "0.7rem",
                  fontWeight: 500,
                }}
              >
                +975-2-337175
              </Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.7}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              <EmailIcon sx={{ color: TEAL, fontSize: 13 }} />
              <Typography
                sx={{
                  color: alpha(W, 0.78),
                  fontSize: "0.7rem",
                  fontWeight: 500,
                }}
              >
                tvet@bqpca.gov.bt
              </Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.7}
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <LocationOnIcon sx={{ color: TEAL, fontSize: 13 }} />
              <Typography
                sx={{
                  color: alpha(W, 0.78),
                  fontSize: "0.7rem",
                  fontWeight: 500,
                }}
              >
                Chang Gidaphu, Thimphu, Bhutan
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography
              sx={{
                color: alpha(W, 0.55),
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: 0.4,
                display: { xs: "none", md: "block" },
              }}
            >
              FOLLOW US
            </Typography>
            <Stack direction="row" spacing={0.4}>
              {[
                {
                  Icon: FacebookIcon,
                  href: "https://www.facebook.com/BQPCA",
                  label: "Facebook",
                },
                { Icon: XIcon, href: "#", label: "X" },
                { Icon: LinkedInIcon, href: "#", label: "LinkedIn" },
              ].map(({ Icon, href, label }, i) => (
                <IconButton
                  key={i}
                  size="small"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  sx={{
                    color: alpha(W, 0.6),
                    p: 0.4,
                    borderRadius: 1,
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      color: W,
                      bgcolor: alpha(TEAL, 0.2),
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 14 }} />
                </IconButton>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* ── Brand / Logo bar ─────────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${P} 0%, #0d47a1 100%)`,
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          py: 1,
          px: { xs: 1.5, md: 4 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Left: logo + title */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 1, md: 1.6 }}
            sx={{ flex: 1 }}
          >
            <Box
              component="img"
              src={govtLogo}
              alt="tvet-mis-logo"
              onClick={() => navigate("/")}
              sx={{
                width: { xs: 42, md: 54 },
                height: { xs: 42, md: 54 },
                objectFit: "contain",
                cursor: "pointer",
                flexShrink: 0,
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                "&:hover": {
                  transform: "scale(1.06) rotate(-2deg)",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
                },
              }}
            />

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Typography
                fontWeight={800}
                sx={{
                  color: W,
                  fontSize: { xs: "0.8rem", md: "1.5rem" },
                  lineHeight: 1.2,
                  letterSpacing: "-0.2px",
                  whiteSpace: { md: "nowrap" },
                }}
              >
                TVET Management Information System
              </Typography>
              <Typography
                sx={{
                  color: alpha(W, 0.78),
                  fontSize: { xs: "0.6rem", md: "0.89rem" },
                  lineHeight: 1.3,
                  display: { xs: "none", sm: "block" },
                }}
              >
                Ministry of Education and Skills Development
              </Typography>
            </Box>
          </Stack>
          {/* Right: login on desktop · hamburger on mobile */}
          {isMd ? (
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                color: W,
                border: `1px solid ${alpha(W, 0.4)}`,
                borderRadius: 1.5,
                p: 0.7,
                transition: "all 0.2s",
                "&:hover": { bgcolor: alpha(W, 0.12), borderColor: W },
              }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Button
              onClick={() => navigate("/auth/login")}
              startIcon={
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: alpha(P, 0.12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  className="login-icon-wrap"
                >
                  <LoginIcon sx={{ fontSize: 14, color: P }} />
                </Box>
              }
              sx={{
                background: `linear-gradient(135deg, ${W} 0%, #eaf3ff 100%)`,
                color: PD,
                fontSize: "0.82rem",
                textTransform: "none",
                fontWeight: 700,
                letterSpacing: 0.4,
                pl: 1,
                pr: 2.2,
                py: 0.6,
                borderRadius: 2,
                border: `1px solid ${alpha(W, 0.92)}`,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.85)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  height: "100%",
                  width: "100%",
                  background: `linear-gradient(90deg, transparent, ${alpha(TEAL, 0.25)}, transparent)`,
                  transition: "left 0.6s ease",
                },
                "&:hover": {
                  background: `linear-gradient(135deg, #eaf3ff 0%, ${W} 100%)`,
                  color: P,
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 22px rgba(0,0,0,0.22), 0 0 0 3px ${alpha(TEAL, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.95)`,
                  "&::before": { left: "100%" },
                  "& .login-icon-wrap": {
                    bgcolor: TEAL,
                    transform: "rotate(-8deg) scale(1.05)",
                    "& svg": { color: W },
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: `0 2px 6px rgba(0,0,0,0.18), 0 0 0 3px ${alpha(TEAL, 0.4)}`,
                },
              }}
            >
              Login
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Desktop nav bar (MUI Menu hover dropdowns) ────────────────── */}
      {!isMd && (
        <Box
          sx={{
            bgcolor: PD,
            borderBottom: `2px solid ${TEAL}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            px: { md: 2, lg: 4 },
          }}
        >
          <Stack direction="row" alignItems="stretch">
            {NAV_MENU.map((item) => {
              const isActive =
                !item.sub && item.path && location.pathname === item.path;

              if (item.sub) {
                return (
                  <HoverMenu
                    key={item.label}
                    item={item}
                    onItemClick={(path) => handleNav(path)}
                    navBtnSx={navBtnSx}
                    activeBtnSx={activeBtnSx}
                  />
                );
              }

              return (
                <Button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  startIcon={item.icon}
                  sx={{ ...navBtnSx, ...(isActive ? activeBtnSx : {}) }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={closeMobile}
        PaperProps={{ sx: { width: 290, bgcolor: PD } }}
      >
        <Box
          sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          {/* Drawer header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${P} 0%, #0d47a1 100%)`,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                component="img"
                src={govtLogo}
                alt="Logo"
                sx={{ width: 36, height: 36, objectFit: "contain" }}
              />
              <Box>
                <Typography
                  fontWeight={800}
                  sx={{ color: W, fontSize: "0.86rem", lineHeight: 1.1 }}
                >
                  TVET MIS
                </Typography>
                <Typography sx={{ color: alpha(W, 0.7), fontSize: "0.62rem" }}>
                  MoESD
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={closeMobile}
              sx={{
                color: W,
                border: `1px solid ${alpha(W, 0.3)}`,
                "&:hover": { bgcolor: alpha(W, 0.1) },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Nav items */}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {NAV_MENU.map((item) => {
              const expanded = !!mobileExpand[item.label];
              return (
                <Box key={item.label}>
                  <Box
                    onClick={() =>
                      item.sub
                        ? toggleMobileExpand(item.label)
                        : handleNav(item.path, closeMobile)
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.3,
                      cursor: "pointer",
                      bgcolor: expanded ? alpha(W, 0.06) : "transparent",
                      transition: "all 0.15s",
                      "&:hover": { bgcolor: alpha(W, 0.08) },
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          color: expanded ? TEAL : alpha(W, 0.7),
                          display: "flex",
                          transition: "color 0.2s",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        sx={{ color: W, fontSize: "0.83rem", fontWeight: 600 }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                    {item.sub &&
                      (expanded ? (
                        <ExpandLess
                          sx={{ color: alpha(W, 0.55), fontSize: 17 }}
                        />
                      ) : (
                        <ExpandMore
                          sx={{ color: alpha(W, 0.55), fontSize: 17 }}
                        />
                      ))}
                  </Box>

                  {/* Sub-items */}
                  {item.sub && expanded && (
                    <Box sx={{ bgcolor: alpha("#000", 0.18) }}>
                      {item.sub.map((s, si) => (
                        <Box
                          key={si}
                          onClick={() => handleNav(s.path, closeMobile)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.1,
                            px: 4,
                            py: 1,
                            cursor: "pointer",
                            borderLeft: `2px solid ${alpha(TEAL, 0.3)}`,
                            ml: 2,
                            transition: "all 0.15s",
                            "&:hover": {
                              bgcolor: alpha(W, 0.06),
                              borderLeftColor: TEAL,
                              pl: 4.5,
                            },
                          }}
                        >
                          <Box sx={{ color: alpha(W, 0.6), display: "flex" }}>
                            {s.icon}
                          </Box>
                          <Typography
                            sx={{ color: alpha(W, 0.82), fontSize: "0.78rem" }}
                          >
                            {s.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ borderColor: alpha(W, 0.08) }} />
                </Box>
              );
            })}
          </Box>

          {/* Drawer footer — login (matches desktop styling) */}
          <Box
            sx={{
              p: 2,
              bgcolor: PDD,
              borderTop: `1px solid ${alpha(W, 0.08)}`,
            }}
          >
            <Button
              fullWidth
              startIcon={
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: alpha(P, 0.12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                  }}
                  className="m-login-wrap"
                >
                  <LoginIcon sx={{ fontSize: 15, color: P }} />
                </Box>
              }
              onClick={() => {
                navigate("/auth/login");
                closeMobile();
              }}
              sx={{
                background: `linear-gradient(135deg, ${W} 0%, #eaf3ff 100%)`,
                color: PD,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: 0.4,
                borderRadius: 2,
                py: 1,
                border: `1px solid ${alpha(W, 0.92)}`,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  background: `linear-gradient(135deg, #eaf3ff 0%, ${W} 100%)`,
                  color: P,
                  transform: "translateY(-1px)",
                  boxShadow: `0 6px 18px rgba(0,0,0,0.32), 0 0 0 2px ${alpha(TEAL, 0.4)}`,
                  "& .m-login-wrap": {
                    bgcolor: TEAL,
                    "& svg": { color: W },
                  },
                },
              }}
            >
              Login to TVET MIS
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Header;