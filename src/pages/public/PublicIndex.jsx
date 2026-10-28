import { Component, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CampaignIcon from "@mui/icons-material/Campaign";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PaymentIcon from "@mui/icons-material/Payment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PlaceIcon from "@mui/icons-material/Place";
import InsightsIcon from "@mui/icons-material/Insights";
import PieChartIcon from "@mui/icons-material/PieChart";

// ── Imported components (unchanged)
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

// ── Brand palette
const P = "#1565c0";
const PD = "#0a2d6e";
const PL = "#e8f1fb";
const W = "#ffffff";
const INK = "#0a1929";
const SURFACE = "#f5f8fc";

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

// ── Shared table styles
const TS = {
  "& th": {
    bgcolor: PL,
    fontWeight: 700,
    fontSize: "0.77rem",
    color: PD,
    whiteSpace: "nowrap",
  },
  "& td": { fontSize: "0.8rem" },
  "& th, & td": { border: "1px solid #dbe5f0", py: 0.85, px: 1.2 },
  "& tbody tr:hover td": { bgcolor: "#f5f9ff" },
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

const HERO_HIGHLIGHTS = [
  { icon: <FactCheckIcon fontSize="small" />, label: "Accredited Programmes" },
  { icon: <WorkspacePremiumIcon fontSize="small" />, label: "National Certification" },
  { icon: <PlaceIcon fontSize="small" />, label: "All 20 Dzongkhags" },
];

// ── Keeps one failing widget from blanking the whole home page
class SectionBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Home page section failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          {this.props.fallback ||
            "This information is temporarily unavailable. Please try again later."}
        </Alert>
      );
    }
    return this.props.children;
  }
}

SectionBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.string,
};

// ── Section heading
const SectionTitle = ({ eyebrow, title, subtitle, align = "left", action }) => (
  <Stack
    direction={{ xs: "column", md: action ? "row" : "column" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", md: action ? "flex-end" : align === "center" ? "center" : "flex-start" }}
    spacing={2}
    sx={{ mb: 3, textAlign: align }}
  >
    <Box sx={{ width: action ? "auto" : "100%" }}>
      {eyebrow && (
        <Typography
          sx={{
            color: P,
            fontSize: "0.7rem",
            letterSpacing: 1.6,
            fontWeight: 800,
            textTransform: "uppercase",
            mb: 0.8,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        component="h2"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "1.3rem", md: "1.7rem" },
          color: INK,
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            maxWidth: 680,
            mt: 0.8,
            mx: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);

SectionTitle.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  align: PropTypes.oneOf(["left", "center"]),
  action: PropTypes.node,
};

const Section = ({ id, bg = W, children, py = { xs: 5, md: 7 } }) => (
  <Box id={id} component="section" sx={{ bgcolor: bg, py }}>
    <Container maxWidth="xl">{children}</Container>
  </Box>
);

Section.propTypes = {
  id: PropTypes.string,
  bg: PropTypes.string,
  children: PropTypes.node,
  py: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
};

const SURFACE_CARD = {
  border: "1px solid #e3eaf4",
  borderRadius: 3,
  bgcolor: W,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

// ═══════════════════════════════════════════════════════════════════════════
const PublicIndex = () => {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef(null);
  const [insightTab, setInsightTab] = useState(0);

  // Track Application state
  const [trackQ, setTrackQ] = useState("");
  const [trackErr, setTrackErr] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackRes, setTrackRes] = useState(null);
  const [courseAnnounceNotifications, setCourseAnnounceNotifications] =
    useState([]);
  const [notificationMessages, setNotificationMessages] = useState([]);

  // Slider auto-advance
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setSlide((p) => (p + 1) % sliderImages.length),
      5000,
    );
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goSlide = (d) => {
    setSlide((p) => (p + d + sliderImages.length) % sliderImages.length);
    startTimer();
  };

  useEffect(() => {
    fetchCourseAnnounceNotifications();
  }, []);

  useEffect(() => {
    if (
      Array.isArray(courseAnnounceNotifications) &&
      courseAnnounceNotifications.length > 0
    ) {
      setNotificationMessages(
        courseAnnounceNotifications.map((notification) => {
          const startDate = formatNotificationDate(notification.course_start_date);
          const endDate = formatNotificationDate(notification.course_end_date);
          return `${notification.course_name} | ${startDate} - ${endDate} | Apply Now!`;
        }),
      );
    } else {
      setNotificationMessages([
        "New Course Applications open — Apply before 10th March 2026.",
        "Institute registrations for 2026 are due soon. Complete your profile.",
        "Check your application status using Track Your Application.",
        "New courses added in Thimphu and Paro locations.",
        "ToT Certification Workshop in Thimphu — June 5 to 7, 2026.",
      ]);
    }
  }, [courseAnnounceNotifications]);

  const fetchCourseAnnounceNotifications = async () => {
    try {
      const response = await PublicPageService.getCourseAnnounceNotifications();
      setCourseAnnounceNotifications(
        Array.isArray(response?.data) ? response.data : [],
      );
    } catch (error) {
      console.error("Error fetching course announcement notifications:", error);
    }
  };

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
      const applicationData = Array.isArray(response?.data)
        ? response.data[0]
        : response?.data;
      setTrackRes(applicationData || null);
      setTrackOpen(true);
    } catch (error) {
      console.error("Error fetching application status:", error);
      setTrackRes(null);
      setTrackOpen(true);
    } finally {
      setTrackLoading(false);
    }
  };

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Track Application card
  const trackCard = (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: { xs: 2.5, md: 3 },
        bgcolor: W,
        boxShadow: "0 24px 48px rgba(10,45,110,0.28)",
        width: "100%",
        maxWidth: 460,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: PL,
            color: P,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrackChangesIcon />
        </Box>
        <Box>
          <Typography fontWeight={800} sx={{ color: INK, fontSize: "1rem" }}>
            Track Your Application
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
            Enter your application number to see its status
          </Typography>
        </Box>
      </Stack>
      <TextField
        fullWidth
        size="small"
        placeholder="e.g. 260000036"
        value={trackQ}
        onChange={(e) => {
          setTrackQ(e.target.value);
          if (trackErr) setTrackErr(false);
        }}
        error={trackErr}
        helperText={trackErr ? "Please enter an application number" : " "}
        onKeyDown={(e) => e.key === "Enter" && handleTrack()}
        slotProps={{
          input: {
            sx: { borderRadius: 2, fontSize: "0.88rem", height: 44 },
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#90a4ae", fontSize: 20 }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        fullWidth
        variant="contained"
        onClick={handleTrack}
        disabled={trackLoading}
        endIcon={<ArrowForwardIcon />}
        sx={{
          mt: 0.5,
          height: 44,
          borderRadius: 2,
          bgcolor: P,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.9rem",
          boxShadow: "none",
          "&:hover": { bgcolor: "#0d47a1", boxShadow: "none" },
        }}
      >
        {trackLoading ? "Searching..." : "Track Status"}
      </Button>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        <Chip
          component={RouterLink}
          to="/result/assessment-result"
          clickable
          size="small"
          icon={<AssignmentTurnedInIcon />}
          label="Assessment Result"
          sx={{ bgcolor: SURFACE, fontWeight: 600 }}
        />
        <Chip
          component={RouterLink}
          to="/birms/payment-index"
          clickable
          size="small"
          icon={<PaymentIcon />}
          label="Online Payment"
          sx={{ bgcolor: SURFACE, fontWeight: 600 }}
        />
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ bgcolor: SURFACE, display: "flex", flexDirection: "column" }}>
      {/* ── 1. Hero ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: "auto", md: 520 },
          display: "flex",
          alignItems: "center",
        }}
      >
        {sliderImages.map((img, i) => (
          <Box
            key={i}
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === slide ? 1 : 0,
              transform: i === slide ? "scale(1.03)" : "scale(1)",
              transition: "opacity 1.2s ease-in-out, transform 6s ease-out",
            }}
          />
        ))}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(100deg, ${alpha(PD, 0.94)} 0%, ${alpha(PD, 0.82)} 45%, ${alpha(P, 0.35)} 100%)`,
          }}
        />

        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 2, py: { xs: 5, md: 8 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="Royal Government of Bhutan · Ministry of Education and Skills Development"
                size="small"
                sx={{
                  bgcolor: alpha(W, 0.12),
                  color: "#bbdefb",
                  border: `1px solid ${alpha(W, 0.2)}`,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  mb: 2.5,
                  height: "auto",
                  "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 },
                }}
              />
              <Typography
                component="h1"
                sx={{
                  color: W,
                  fontWeight: 800,
                  fontSize: { xs: "2rem", md: "3rem" },
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                  mb: 2,
                }}
              >
                Building Bhutan&apos;s
                <Box component="span" sx={{ display: "block", color: "#90caf9" }}>
                  Skilled Workforce
                </Box>
              </Typography>
              <Typography
                sx={{
                  color: alpha(W, 0.88),
                  fontSize: { xs: "0.95rem", md: "1.05rem" },
                  lineHeight: 1.7,
                  maxWidth: 600,
                  mb: 3.5,
                }}
              >
                The official Technical and Vocational Education and Training
                Management Information System — connecting trainees, training
                providers and professionals with accredited skills and national
                certification.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => scrollToId("course-announcements")}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: W,
                    color: P,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3.5,
                    py: 1.3,
                    borderRadius: 2,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    "&:hover": { bgcolor: "#e3f2fd" },
                  }}
                >
                  Explore Courses
                </Button>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.2, sm: 3 }}>
                {HERO_HIGHLIGHTS.map((h) => (
                  <Stack key={h.label} direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: "#90caf9", display: "flex" }}>{h.icon}</Box>
                    <Typography sx={{ color: alpha(W, 0.9), fontSize: "0.85rem", fontWeight: 600 }}>
                      {h.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
              {trackCard}
            </Grid>
          </Grid>
        </Container>

        {/* Slider controls */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: { xs: "none", md: "flex" },
          }}
        >
          <IconButton
            size="small"
            aria-label="Previous slide"
            onClick={() => goSlide(-1)}
            sx={{ color: W, bgcolor: alpha(W, 0.15), "&:hover": { bgcolor: alpha(W, 0.3) } }}
          >
            <KeyboardArrowLeftIcon fontSize="small" />
          </IconButton>
          {sliderImages.map((_, i) => (
            <Box
              key={i}
              onClick={() => {
                setSlide(i);
                startTimer();
              }}
              sx={{
                width: i === slide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: W,
                opacity: i === slide ? 1 : 0.45,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
          <IconButton
            size="small"
            aria-label="Next slide"
            onClick={() => goSlide(1)}
            sx={{ color: W, bgcolor: alpha(W, 0.15), "&:hover": { bgcolor: alpha(W, 0.3) } }}
          >
            <KeyboardArrowRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* ── 2. Announcement ticker ─────────────────────────────────── */}
      <Box sx={{ bgcolor: W, borderBottom: "1px solid #e3eaf4" }}>
        <Container maxWidth="xl" sx={{ display: "flex", alignItems: "center", py: 1.2, gap: 2 }}>
          <Chip
            icon={<CampaignIcon sx={{ color: `${W} !important` }} />}
            label="Latest Updates"
            size="small"
            sx={{ bgcolor: P, color: W, fontWeight: 700, flexShrink: 0 }}
          />
          <Box
            sx={{
              overflow: "hidden",
              flex: 1,
              "&:hover .ticker": { animationPlayState: "paused" },
            }}
          >
            <Box component="style">{`@keyframes tk{from{transform:translateX(0)}to{transform:translateX(-100%)}}`}</Box>
            <Typography
              className="ticker"
              sx={{
                display: "inline-block",
                pl: "100%",
                animation: "tk 60s linear infinite",
                color: INK,
                fontSize: "0.88rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {notificationMessages.join("      •      ")}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ── 3. TVET at a glance ────────────────────────────────────── */}
      <Section bg={SURFACE} py={{ xs: 4, md: 4.5 }}>
        <SectionTitle
          align="center"
          eyebrow="By the Numbers"
          title="TVET at a Glance"
          subtitle="A snapshot of the technical and vocational education and training landscape in Bhutan."
        />
        <SectionBoundary>
          <TvetCardsIndex />
        </SectionBoundary>
      </Section>

      {/* ── 4. Insights (indicators + distribution) ────────────────── */}
      <Section bg={W}>
        <SectionTitle
          eyebrow="Insights"
          title="Key TVET Indicators & Distribution"
          subtitle="Cumulative figures across Public and Private providers, and where TVET is happening across Bhutan."
        />
        <Card elevation={0} sx={{ ...SURFACE_CARD, overflow: "hidden" }}>
          <Tabs
            value={insightTab}
            onChange={(e, v) => setInsightTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              borderBottom: "1px solid #e3eaf4",
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 56 },
            }}
          >
            <Tab icon={<InsightsIcon fontSize="small" />} iconPosition="start" label="Key Indicators" />
            <Tab icon={<PieChartIcon fontSize="small" />} iconPosition="start" label="Distribution Overview" />
          </Tabs>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <SectionBoundary>
              {insightTab === 0 ? (
                <TvetIndicatorsInstituteProviderType />
              ) : (
                <PieBarGraphDistributionIndex />
              )}
            </SectionBoundary>
          </Box>
        </Card>
      </Section>

      {/* ── 5. Course announcements ────────────────────────────────── */}
      <Section id="course-announcements" bg={W}>
        <SectionTitle
          eyebrow="Latest Opportunities"
          title="Course Announcements"
          subtitle="Programmes accepting applications now — find the right course and apply online."
        />
        <Card
          elevation={0}
          sx={{
            ...SURFACE_CARD,
            p: { xs: 1.5, md: 2.5 },
            "& .MuiTableCell-root": {
              fontSize: "0.8rem",
              py: 0.85,
              px: 1.2,
              border: "1px solid #dbe5f0",
            },
            "& .MuiTableCell-head": {
              bgcolor: PL,
              fontWeight: 700,
              fontSize: "0.77rem",
              color: PD,
              whiteSpace: "nowrap",
            },
            "& .MuiTableBody-root tr:hover .MuiTableCell-root": { bgcolor: "#f5f9ff" },
            "& .MuiChip-root": { fontSize: "0.65rem", height: 20, fontWeight: 700 },
            "& .MuiButton-root": { fontSize: "0.72rem", py: 0.4 },
            "& .MuiInputBase-input": { fontSize: "0.82rem" },
            "& .MuiTablePagination-root": { fontSize: "0.75rem" },
          }}
        >
          <SectionBoundary fallback="Course announcements are temporarily unavailable. Please try again later.">
            <CourseTraineeAnnouncementsIndex />
          </SectionBoundary>
        </Card>
      </Section>

      {/* ── 6. Ongoing programmes ──────────────────────────────────── */}
      <Section bg={SURFACE}>
        <SectionTitle
          eyebrow="Active Programmes"
          title="Ongoing Programmes"
          subtitle="Latest programme activity across training providers."
        />
        <Card elevation={0} sx={{ ...SURFACE_CARD, p: { xs: 1.5, md: 2.5 } }}>
          <SectionBoundary>
            <OngoingProgramsIndex />
          </SectionBoundary>
        </Card>
      </Section>

      {/* ── Track Application Modal ── */}
      <Dialog
        open={trackOpen}
        onClose={() => setTrackOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5 } } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "0.95rem",
            bgcolor: PL,
            borderBottom: "1px solid #d4e2f4",
            py: 1.5,
            px: 3,
            color: PD,
          }}
        >
          Application Status
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #d4e2f4", borderRadius: 2, mt: 2 }}
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
                {trackRes ? (
                  <TableRow hover>
                    <TableCell>
                      <Typography fontWeight={600}>{trackRes.application_no || "N/A"}</Typography>
                    </TableCell>
                    <TableCell>{trackRes.application_name || "N/A"}</TableCell>
                    <TableCell>{trackRes.service_name || "N/A"}</TableCell>
                    <TableCell>{trackRes.application_at || "N/A"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(trackRes.current_status)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(trackRes.current_status), 0.12),
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
                      <Typography sx={{ color: "error.main", fontWeight: 600 }}>
                        No application found for the entered number.
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666", mt: 1, display: "block" }}>
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
            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicIndex;
