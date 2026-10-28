import { useEffect, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  alpha,
  TextField,
  InputAdornment,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  IconButton,
  Container,
  Grid,
  Paper,
  CircularProgress,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import VerifiedIcon from "@mui/icons-material/Verified";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CampaignIcon from "@mui/icons-material/Campaign";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PaymentsIcon from "@mui/icons-material/Payments";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import DescriptionIcon from "@mui/icons-material/Description";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import InsightsIcon from "@mui/icons-material/Insights";

// ── Sections (content and data unchanged)
import CourseTraineeAnnouncementsIndex from "./CourseTraineeAnnouncementsIndex";
import OngoingProgramsIndex from "./OngoingProgramsIndex";
import PieBarGraphDistributionIndex from "./PieBarGraphDistributionIndex";
import TvetCardsIndex from "./TvetCardsIndex";
import TvetIndicatorsInstituteProviderType from "./TvetIndicatorsInstituteProviderType";
import PublicPageService from "../../api/services/internal/public/PublicPageService";

// ── Slider images
import slide1 from "../../assets/slider/slide1.jpg";
import slide2 from "../../assets/slider/slide2.jpg";
import slide3 from "../../assets/slider/slide3.jpg";
import slide4 from "../../assets/slider/slide4.png";
import slide5 from "../../assets/slider/slide5.png";
import slide6 from "../../assets/slider/slide6.png";
import slide7 from "../../assets/slider/slide7.png";
const sliderImages = [slide1, slide2, slide3, slide4, slide5, slide6, slide7];

// ── Palette: ministry blue + one saffron accent (used only for small markers)
const NAVY = "#0a2d6e";
const BLUE = "#1565c0";
const SAFFRON = "#f2a900";
const TINT = "#f3f6fb"; // alternate section background
const LINE = "#dbe5f0";
// used by the application status table (unchanged from before)
const P = "#1565c0";
const PD = "#0a2d6e";
const PL = "#e8f1fb";

// ── Shared table styles
const TS = {
  "& th": {
    bgcolor: PL,
    fontWeight: 700,
    fontSize: "0.77rem",
    color: PD,
    whiteSpace: "nowrap",
  },
  "& td": {
    fontSize: "0.8rem",
  },
  borderCollapse: "collapse",
  "& th, & td": { border: "1px solid #c5d5ea", py: 0.85, px: 1.2 },
  "& tbody tr:hover td": { bgcolor: "#f5f9ff" },
};

const getStatusColor = (s) => {
  const statusMap = {
    submitted: "#ff9800",
    under_review: "#2196f3",
    approved: "#2e7d32",
    rejected: "#c62828",
    pending: "#e65100",
  };
  return statusMap[s?.toLowerCase()] || "#555";
};

const getStatusLabel = (status) => {
  const labelMap = {
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
  };
  return labelMap[status?.toLowerCase()] || status || "N/A";
};

const formatNotificationDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Public services shown under the hero (all public routes)
const SERVICES = [
  {
    label: "Apply for a course",
    desc: "Open programmes taking applications",
    href: "#course-announcements",
    icon: <SchoolIcon />,
  },
  {
    label: "RPL assessment",
    desc: "Get your existing skills certified",
    href: "/course/apply/rpl-assessment",
    icon: <WorkspacePremiumIcon />,
  },
  {
    label: "Assessment results",
    desc: "Check your assessment outcome",
    href: "/result/assessment-result",
    icon: <FactCheckIcon />,
  },
  {
    label: "Pay fees",
    desc: "Pay with a payment advice number",
    href: "/birms/payment-index",
    icon: <PaymentsIcon />,
  },
];

const RESOURCES = [
  {
    label: "National Competency Standards",
    desc: "Browse NCS documents by sector and qualification level",
    href: "/reports/ncs-publication",
    icon: <VerifiedIcon />,
  },
  {
    label: "Curriculum",
    desc: "Download approved curricula for accredited TVET courses",
    href: "/reports/curriculum-publication",
    icon: <MenuBookIcon />,
  },
  {
    label: "Publications",
    desc: "Reports and publications on TVET in Bhutan",
    href: "/publication/publication-index",
    icon: <LibraryBooksIcon />,
  },
  {
    label: "Forms",
    desc: "Download application and reporting forms",
    href: "/forms/forms-index",
    icon: <DescriptionIcon />,
  },
  {
    label: "Give feedback",
    desc: "Tell us how we can improve TVET services",
    href: "/feedback/form",
    icon: <RateReviewIcon />,
  },
];

// ── Section wrapper: one consistent width, spacing and header for every block
const Section = ({ id, title, description, tinted, children, action }) => (
  <Box
    component="section"
    id={id}
    sx={{
      bgcolor: tinted ? TINT : "background.paper",
      py: { xs: 4, md: 5 },
      scrollMarginTop: 72,
    }}
  >
    {/* full page width, same as the hero image */}
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 3, lg: 4 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 2.5,
        }}
      >
        <Box sx={{ maxWidth: 720 }}>
          <Box
            sx={{
              width: 28,
              height: 3,
              bgcolor: SAFFRON,
              borderRadius: 2,
              mb: 1.25,
            }}
          />
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.35rem", md: "1.7rem" },
              lineHeight: 1.2,
              color: tinted ? NAVY : "text.primary",
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                mt: 0.75,
                color: "text.secondary",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Container>
  </Box>
);
Section.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  tinted: PropTypes.bool,
  children: PropTypes.node,
  action: PropTypes.node,
};

// White panel that holds a section's existing component
const Surface = ({ children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      border: `1px solid ${LINE}`,
      borderRadius: 2,
      p: { xs: 1.5, md: 2.5 },
      ...sx,
    }}
  >
    {children}
  </Paper>
);
Surface.propTypes = { children: PropTypes.node, sx: PropTypes.object };

// ═══════════════════════════════════════════════════════════════════════════
const PublicIndex = () => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [slide, setSlide] = useState(0);
  const timerRef = useRef(null);

  // Track Application state
  const [trackQ, setTrackQ] = useState("");
  const [trackErr, setTrackErr] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackRes, setTrackRes] = useState(null);
  const [courseAnnounceNotifications, setCourseAnnounceNotifications] =
    useState([]);
  const [notificationMessages, setNotificationMessages] = useState([]);

  // Slider auto-advance (off when the user prefers reduced motion)
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (reduceMotion) return;
    timerRef.current = setInterval(
      () => setSlide((p) => (p + 1) % sliderImages.length),
      6000,
    );
  }, [reduceMotion]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const goSlide = (d) => {
    setSlide((p) => (p + d + sliderImages.length) % sliderImages.length);
    startTimer();
  };

  useEffect(() => {
    const fetchCourseAnnounceNotifications = async () => {
      try {
        const response =
          await PublicPageService.getCourseAnnounceNotifications();
        setCourseAnnounceNotifications(
          Array.isArray(response?.data) ? response.data : [],
        );
      } catch (error) {
        console.error(
          "Error fetching course announcement notifications:",
          error,
        );
      }
    };
    fetchCourseAnnounceNotifications();
  }, []);

  // Ticker messages from the open course announcements
  useEffect(() => {
    if (courseAnnounceNotifications.length > 0) {
      setNotificationMessages(
        courseAnnounceNotifications.map((n) => {
          const startDate = formatNotificationDate(n.course_start_date);
          const endDate = formatNotificationDate(n.course_end_date);
          return `${n.course_name}: ${startDate} to ${endDate}. Applications open.`;
        }),
      );
    } else {
      setNotificationMessages([
        "Check your application status with your application number above.",
        "Browse open courses below and apply online.",
      ]);
    }
  }, [courseAnnounceNotifications]);

  const handleTrack = async () => {
    if (!trackQ.trim()) {
      setTrackErr(true);
      return;
    }
    setTrackErr(false);
    setTrackLoading(true);
    setTrackRes(null);
    try {
      const response = await PublicPageService.trackApplicationStatus(
        trackQ.trim(),
      );
      const data = response?.data;
      setTrackRes((Array.isArray(data) ? data[0] : data) || null);
      setTrackOpen(true);
    } catch (error) {
      console.error("Error fetching application status:", error);
      setTrackRes(null);
      setTrackOpen(true);
    } finally {
      setTrackLoading(false);
    }
  };

  // ── Track application card (in the hero)
  const trackCard = (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        width: { xs: "100%", md: 520 },
        borderTop: `4px solid ${SAFFRON}`,
        boxShadow: "0 18px 40px rgba(6, 26, 64, 0.35)",
      }}
    >
      <Typography
        component="h2"
        fontWeight={700}
        sx={{ fontSize: "1.05rem", color: NAVY }}
      >
        Track your application
      </Typography>
      <Typography
        sx={{ color: "text.secondary", fontSize: "0.85rem", mt: 0.25, mb: 1.5 }}
      >
        Enter the application number from your submission.
      </Typography>
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleTrack();
        }}
        sx={{ display: "flex", gap: 1 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Application number"
          value={trackQ}
          onChange={(e) => {
            setTrackQ(e.target.value);
            if (trackErr) setTrackErr(false);
          }}
          error={trackErr}
          helperText={trackErr ? "Enter an application number" : undefined}
          slotProps={{
            htmlInput: { "aria-label": "Application number" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={trackLoading}
          sx={{
            bgcolor: NAVY,
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
            height: 40,
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: BLUE },
          }}
        >
          {trackLoading ? (
            <CircularProgress size={18} sx={{ color: "#fff" }} />
          ) : (
            "Track"
          )}
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Hero: photographs of TVET in Bhutan, headline, tracker ───── */}
      <Box
        component="header"
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { md: 460 },
        }}
      >
        {sliderImages.map((img, i) => (
          <Box
            key={img}
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === slide ? 1 : 0,
              transition: reduceMotion ? "none" : "opacity 1.2s ease-in-out",
            }}
          />
        ))}
        {/* readable side: solid navy on the left fading out to the photo */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: {
              xs: alpha(NAVY, 0.86),
              md: `linear-gradient(90deg, ${alpha(NAVY, 0.94)} 0%, ${alpha(NAVY, 0.82)} 42%, ${alpha(NAVY, 0.25)} 78%, ${alpha(NAVY, 0.1)} 100%)`,
            },
          }}
        />

        <Container
          maxWidth={false}
          sx={{
            px: { xs: 2, md: 3, lg: 4 },
            position: "relative",
            zIndex: 1,
            py: { xs: 4, md: 7 },
            pb: { xs: 4, md: 11 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { md: "center" },
            justifyContent: "space-between",
            gap: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ maxWidth: 620 }}>
            <Typography
              sx={{ color: alpha("#fff", 0.8), fontSize: "0.95rem", mb: 1.25 }}
            >
              Ministry of Education and Skills Development
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: { xs: "2rem", md: "3rem" },
                lineHeight: 1.08,
                mb: 2,
              }}
            >
              Building Bhutan&apos;s skilled workforce
            </Typography>
            <Typography
              sx={{
                color: alpha("#fff", 0.88),
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                lineHeight: 1.65,
                maxWidth: 540,
                mb: 3,
              }}
            >
              Find accredited courses, apply online, get your skills certified
              and follow your application, across all 20 Dzongkhags.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                href="#course-announcements"
                sx={{
                  bgcolor: SAFFRON,
                  color: NAVY,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  "&:hover": { bgcolor: "#ffbf2e" },
                }}
              >
                Apply for courses
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="/course/apply/rpl-assessment"
                sx={{
                  color: "#fff",
                  borderColor: alpha("#fff", 0.6),
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: alpha("#fff", 0.08),
                  },
                }}
              >
                Apply for RPL assessment
              </Button>
            </Stack>
          </Box>

          {trackCard}
        </Container>

        {/* slide controls */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            position: "absolute",
            zIndex: 2,
            right: { xs: 12, md: 24 },
            bottom: { xs: 8, md: 72 },
            display: { xs: "none", md: "flex" },
          }}
        >
          <IconButton
            aria-label="Previous photo"
            size="small"
            onClick={() => goSlide(-1)}
            sx={{
              color: "#fff",
              bgcolor: alpha("#000", 0.25),
              "&:hover": { bgcolor: alpha("#000", 0.4) },
            }}
          >
            <KeyboardArrowLeftIcon fontSize="small" />
          </IconButton>
          {sliderImages.map((img, i) => (
            <Box
              key={img}
              component="button"
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => {
                setSlide(i);
                startTimer();
              }}
              sx={{
                p: 0,
                border: 0,
                width: i === slide ? 20 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: "#fff",
                opacity: i === slide ? 1 : 0.5,
                cursor: "pointer",
                transition: reduceMotion ? "none" : "width 0.3s",
              }}
            />
          ))}
          <IconButton
            aria-label="Next photo"
            size="small"
            onClick={() => goSlide(1)}
            sx={{
              color: "#fff",
              bgcolor: alpha("#000", 0.25),
              "&:hover": { bgcolor: alpha("#000", 0.4) },
            }}
          >
            <KeyboardArrowRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* ── Public services: one panel overlapping the bottom of the hero ── */}
      <Container
        maxWidth={false}
        sx={{
          px: { xs: 2, md: 3, lg: 4 },
          position: "relative",
          zIndex: 2,
          mt: { xs: 2, md: -7 },
        }}
      >
        <Paper
          elevation={0}
          component="nav"
          aria-label="Public services"
          sx={{
            borderRadius: 2,
            border: `1px solid ${LINE}`,
            boxShadow: { md: "0 10px 30px rgba(10, 45, 110, 0.12)" },
            overflow: "hidden",
          }}
        >
          <Grid container>
            {SERVICES.map((s, i) => (
              <Grid key={s.href} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  component="a"
                  href={s.href}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 2,
                    height: "100%",
                    textDecoration: "none",
                    color: "inherit",
                    borderLeft: { md: i === 0 ? 0 : `1px solid ${LINE}` },
                    borderTop: { xs: i === 0 ? 0 : `1px solid ${LINE}`, md: 0 },
                    "&:hover, &:focus-visible": { bgcolor: TINT },
                    "&:hover .svc-label, &:focus-visible .svc-label": {
                      color: BLUE,
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${BLUE}`,
                      outlineOffset: -2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      color: NAVY,
                      bgcolor: alpha(BLUE, 0.08),
                    }}
                  >
                    {s.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      className="svc-label"
                      fontWeight={700}
                      sx={{ color: NAVY, fontSize: "0.98rem" }}
                    >
                      {s.label}
                    </Typography>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "0.82rem" }}
                    >
                      {s.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* ── Announcements ticker ─────────────────────────────────────── */}
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3, lg: 4 }, mt: 2.5 }}>
        <Box
          role="region"
          aria-label="Announcements"
          sx={{
            display: "flex",
            alignItems: "center",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: NAVY,
            "&:hover .ticker-text": { animationPlayState: "paused" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 1,
              bgcolor: SAFFRON,
              color: NAVY,
              flexShrink: 0,
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            <CampaignIcon fontSize="small" />
            Announcements
          </Box>
          <Box sx={{ overflow: "hidden", flex: 1, px: 2 }}>
            <Box component="style">{`@keyframes tvetTicker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}`}</Box>
            <Typography
              className="ticker-text"
              sx={{
                display: "inline-block",
                whiteSpace: "nowrap",
                color: "#e3f2fd",
                fontSize: "0.9rem",
                animation: reduceMotion
                  ? "none"
                  : "tvetTicker 50s linear infinite",
              }}
            >
              {notificationMessages.join("     •     ")}
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* ── Page body ─────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, mt: 1 }}>
        <Section
          title="TVET at a glance"
          description="Current figures for training institutes, programmes, trainers, trainees and Dzongkhags reached."
        >
          {/* same outer card as the "TVET Indicators Breakdown" card */}
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #e3eaf4",
              borderRadius: 3,
              bgcolor: "#ffffff",
              p: 2.5,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: `0 12px 28px ${alpha(BLUE, 0.12)}`,
                borderColor: alpha(BLUE, 0.3),
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.2}
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: alpha(BLUE, 0.12),
                  color: BLUE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <InsightsIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={800}
                  sx={{ fontSize: "0.95rem", color: BLUE }}
                >
                  TVET by the numbers
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Training institutes, programmes, trainers, trainees and
                  Dzongkhags reached
                </Typography>
              </Box>
            </Stack>
            <TvetCardsIndex />
          </Paper>
        </Section>

        <Section
          id="course-announcements"
          tinted
          title="Course announcements"
          description="Programmes accepting applications now. Find the right course and apply online."
        >
          <Surface
            sx={{
              "& .MuiTableCell-root": {
                fontSize: "0.82rem",
                py: 0.85,
                px: 1.2,
                border: `1px solid ${LINE}`,
              },
              "& .MuiTableCell-head": {
                bgcolor: TINT,
                fontWeight: 700,
                color: NAVY,
                whiteSpace: "nowrap",
              },
              "& .MuiChip-root": {
                fontSize: "0.68rem",
                height: 22,
                fontWeight: 700,
              },
            }}
          >
            <CourseTraineeAnnouncementsIndex />
          </Surface>
        </Section>

        <Section
          title="Ongoing programmes"
          description="Programmes currently running at training providers."
        >
          <Surface>
            <OngoingProgramsIndex />
          </Surface>
        </Section>

        <Section
          tinted
          title="Key TVET indicators"
          description="Cumulative figures by provider type: public, private and combined totals."
        >
          <TvetIndicatorsInstituteProviderType />
        </Section>

        <Section
          title="Where TVET is happening across Bhutan"
          description="Programmes by sector and training providers by Dzongkhag."
        >
          <PieBarGraphDistributionIndex />
        </Section>

        <Section
          tinted
          title="Resources"
          description="Standards, curricula, publications and forms for trainees, training providers and TVET professionals."
        >
          <Grid container spacing={1.5}>
            {RESOURCES.map((r) => (
              <Grid key={r.href} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Box
                  component="a"
                  href={r.href}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 2,
                    height: "100%",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: `1px solid ${LINE}`,
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover, &:focus-visible": { borderColor: BLUE },
                    "&:hover .res-label, &:focus-visible .res-label": {
                      textDecoration: "underline",
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${BLUE}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box sx={{ color: BLUE, mt: 0.25, display: "flex" }}>
                    {r.icon}
                  </Box>
                  <Box>
                    <Typography
                      className="res-label"
                      fontWeight={700}
                      sx={{ color: NAVY }}
                    >
                      {r.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.85rem",
                        mt: 0.25,
                      }}
                    >
                      {r.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Section>
      </Box>

      {/* ── Track Application Modal ── */}
      <Dialog
        open={trackOpen}
        onClose={() => setTrackOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, border: "1px solid #c5d5ea" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "0.92rem",
            bgcolor: PL,
            borderBottom: "1px solid #c5d5ea",
            py: 1.5,
            px: 3,
            color: PD,
          }}
        >
          Application Status
        </DialogTitle>
        {/* MUI removes the top padding of content that follows a title; "&&" restores the gap */}
        <DialogContent sx={{ p: 3, "&&": { pt: 3 } }}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #c5d5ea", borderRadius: 2 }}
          >
            <Table sx={TS}>
              <TableHead>
                <TableRow>
                  <TableCell>Application No.</TableCell>
                  <TableCell>Application Name</TableCell>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Application At</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trackLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: "#666" }}>
                        Searching for application...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : trackRes ? (
                  <TableRow hover>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {trackRes.application_no || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>{trackRes.application_name || "N/A"}</TableCell>
                    <TableCell>{trackRes.service_name || "N/A"}</TableCell>
                    <TableCell>{trackRes.application_at || "N/A"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(trackRes.current_status)}
                        size="small"
                        sx={{
                          bgcolor: alpha(
                            getStatusColor(trackRes.current_status),
                            0.12,
                          ),
                          color: getStatusColor(trackRes.current_status),
                          fontWeight: 700,
                          fontSize: "0.72rem",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography
                        sx={{
                          color: "error.main",
                          fontWeight: 600,
                        }}
                      >
                        No application found for the entered number.
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666",
                          mt: 1,
                          display: "block",
                        }}
                      >
                        Please check your application number and try again.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setTrackOpen(false)}
            variant="contained"
            color="error"
            size="small"
            startIcon={<CloseFullscreenIcon />}
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicIndex;
