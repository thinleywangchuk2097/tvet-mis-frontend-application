import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  alpha,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Card,
  CardContent,
  Stack,
  IconButton,
  Container,
  Grid,
} from "@mui/material";
import { Search } from "@mui/icons-material";

import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import VerifiedIcon from "@mui/icons-material/Verified";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CampaignIcon from "@mui/icons-material/Campaign";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";

// ── Imported components
import CourseTraineeAnnouncementsIndex from "./CourseTraineeAnnouncementsIndex";
import OngoingProgramsIndex from "./OngoingProgramsIndex";
import PieBarGraphDistributionIndex from "./PieBarGraphDistributionIndex";
import TvetCardsIndex from "./TvetCardsIndex";
import TvetIndicatorsInstituteProviderType from "./TvetIndicatorsInstituteProviderType";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/internal/common/CommonService";

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
const TEAL = "#0097a7";

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

// ── Format date for notification display
const formatNotificationDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── Modern section heading
const SectionTitle = ({ eyebrow, title, subtitle, align = "left" }) => (
  <Box sx={{ textAlign: align, mb: 3 }}>
    <Typography
      sx={{
        color: P,
        fontSize: "0.66rem",
        letterSpacing: 1.4,
        fontWeight: 800,
        textTransform: "uppercase",
        mb: 0.8,
      }}
    >
      {eyebrow}
    </Typography>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: { xs: "1.2rem", md: "1.55rem" },
        color: "#0a1929",
        lineHeight: 1.2,
        mb: 0.8,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: "0.85rem",
          lineHeight: 1.6,
          maxWidth: 640,
          mx: align === "center" ? "auto" : undefined,
        }}
      >
        {subtitle}
      </Typography>
    )}
    <Box
      sx={{
        mt: 1.4,
        height: 3,
        width: 52,
        background: `linear-gradient(90deg, ${P}, ${TEAL})`,
        borderRadius: 2,
        mx: align === "center" ? "auto" : undefined,
      }}
    />
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════
const PublicIndex = () => {
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

  // Slider auto-advance
  useEffect(() => {
    timerRef.current = setInterval(
      () => setSlide((p) => (p + 1) % sliderImages.length),
      4000,
    );
    return () => clearInterval(timerRef.current);
  }, []);

  const goSlide = (d) => {
    clearInterval(timerRef.current);
    setSlide((p) => (p + d + sliderImages.length) % sliderImages.length);
    timerRef.current = setInterval(
      () => setSlide((p) => (p + 1) % sliderImages.length),
      4000,
    );
  };

  useEffect(() => {
    fetchCourseAnnounceNotifications();
  }, []);

  // Process notification messages whenever courseAnnounceNotifications changes
  useEffect(() => {
    if (courseAnnounceNotifications.length > 0) {
      const messages = courseAnnounceNotifications.map((notification) => {
        const startDate = formatNotificationDate(
          notification.course_start_date,
        );
        const endDate = formatNotificationDate(notification.course_end_date);
        return `📢 ${notification.course_name} | ${startDate} - ${endDate} | Apply Now!`;
      });
      setNotificationMessages(messages);
    } else {
      // Default messages if no notifications from API
      setNotificationMessages([
        "New Course Applications open — Apply before 10th March 2026.",
        "Institute registrations for 2026 are due soon. Complete your profile.",
        "Check your application status using the search bar above.",
        "New courses added in Thimphu and Paro locations.",
        "ToT Certification Workshop in Thimphu — June 5 to 7, 2026.",
      ]);
    }
  }, [courseAnnounceNotifications]);

  const fetchCourseAnnounceNotifications = async () => {
    try {
      const response = await PublicPageService.getCourseAnnounceNotifications();
      console.log("Course Announcement Notifications:", response.data);
      setCourseAnnounceNotifications(response.data);
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

      if (response && response.data) {
        const applicationData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (applicationData) {
          setTrackRes(applicationData);
        } else {
          setTrackRes(null);
        }
      } else {
        setTrackRes(null);
      }
      setTrackOpen(true);
    } catch (error) {
      console.error("Error fetching application status:", error);
      setTrackRes(null);
      setTrackOpen(true);
    } finally {
      setTrackLoading(false);
    }
  };

  // ── Track Application card (reused — mobile inline & desktop floating)
  const trackCard = (
    <Box
      sx={{
        bgcolor: alpha(PD, 0.92),
        backdropFilter: "blur(8px)",
        borderRadius: 2.5,
        border: `1px solid ${alpha(W, 0.12)}`,
        boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
        p: 2.2,
        width: { xs: "100%", md: 500 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.4 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: alpha("#90caf9", 0.15),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrackChangesIcon sx={{ color: "#90caf9", fontSize: 18 }} />
        </Box>
        <Box>
          <Typography
            fontWeight={800}
            sx={{ color: W, fontSize: "0.88rem", lineHeight: 1.1 }}
          >
            Track Your Application
          </Typography>
          <Typography sx={{ color: alpha(W, 0.65), fontSize: "0.7rem" }}>
            Check the status of your submission
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ display: "flex" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter Application No."
          value={trackQ}
          onChange={(e) => {
            setTrackQ(e.target.value);
            if (trackErr) setTrackErr(false);
          }}
          error={trackErr}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          slotProps={{
            input: {
              sx: {
                bgcolor: W,
                borderRadius: "6px 0 0 6px",
                height: 38,
                fontSize: "0.82rem",
              },
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#90a4ae", fontSize: 16 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
        />
        <Button
          variant="contained"
          onClick={handleTrack}
          disabled={trackLoading}
          sx={{
            borderRadius: "0 6px 6px 0",
            bgcolor: P,
            height: 38,
            px: 2.8,
            fontSize: "0.78rem",
            textTransform: "none",
            fontWeight: 700,
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "#0d47a1" },
          }}
        >
          {trackLoading ? "Searching..." : "Search"}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        bgcolor: "#f7f9fc",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── 1. Cinematic Hero ───────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "auto", md: 440 },
          overflow: "hidden",
        }}
      >
        {/* Slider images */}
        {sliderImages.map((img, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === slide ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          />
        ))}
        <Box sx={{ height: { xs: 360, md: "100%" } }} />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: `linear-gradient(135deg, ${alpha(PD, 0.82)} 0%, ${alpha(P, 0.45)} 50%, ${alpha("#000", 0.35)} 100%)`,
          }}
        />

        <Container
          maxWidth="xl"
          sx={{
            position: { xs: "static", md: "absolute" },
            inset: { md: 0 },
            zIndex: 2,
            height: { md: "100%" },
            display: "flex",
            alignItems: "center",
            pt: { xs: 4, md: 0 },
            pb: { xs: 4, md: 0 },
          }}
        >
          <Box sx={{ width: "100%", position: "relative" }}>
            <Box sx={{ maxWidth: { xs: "100%", md: "62%" }, pr: { md: 4 } }}>
              <Typography
                sx={{
                  color: "#90caf9",
                  fontSize: "0.72rem",
                  letterSpacing: 1.4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  mb: 1.2,
                }}
              >
                Royal Government of Bhutan
              </Typography>
              <Typography
                sx={{
                  color: W,
                  fontWeight: 800,
                  fontSize: { xs: "1.6rem", md: "2.3rem" },
                  lineHeight: 1.15,
                  mb: 1.8,
                  textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                Building Bhutan's
                <br />
                Skilled Workforce
              </Typography>
              <Typography
                sx={{
                  color: alpha(W, 0.9),
                  fontSize: { xs: "0.85rem", md: "0.95rem" },
                  lineHeight: 1.65,
                  maxWidth: 560,
                  mb: 3,
                }}
              >
                The official TVET Management Information System — empowering
                trainees, training providers and professionals with accredited
                skills and certifications across all 20 Dzongkhags.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  href="#course-announcements"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    bgcolor: W,
                    color: P,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    px: 3,
                    py: 1.1,
                    borderRadius: 2,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                    "&:hover": {
                      bgcolor: alpha(W, 0.94),
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
                    },
                    transition: "all 0.25s",
                  }}
                >
                  Apply Courses
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                position: { xs: "relative", md: "absolute" },
                top: { md: "50%" },
                right: { md: 0 },
                transform: { md: "translateY(-50%)" },
                mt: { xs: 3, md: 0 },
                display: "flex",
                justifyContent: "flex-end",
                width: { xs: "100%", md: "auto" },
                zIndex: 2,
              }}
            >
              {trackCard}
            </Box>
          </Box>
        </Container>

        <IconButton
          onClick={() => goSlide(-1)}
          sx={{
            position: "absolute",
            left: 10,
            top: { xs: 180, md: "50%" },
            transform: "translateY(-50%)",
            zIndex: 3,
            bgcolor: alpha(W, 0.2),
            color: W,
            display: { xs: "none", md: "inline-flex" },
            "&:hover": { bgcolor: alpha(W, 0.35) },
          }}
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
        <IconButton
          onClick={() => goSlide(1)}
          sx={{
            position: "absolute",
            right: 10,
            top: { xs: 180, md: "50%" },
            transform: "translateY(-50%)",
            zIndex: 3,
            bgcolor: alpha(W, 0.2),
            color: W,
            display: { xs: "none", md: "inline-flex" },
            "&:hover": { bgcolor: alpha(W, 0.35) },
          }}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
        <Stack
          direction="row"
          spacing={0.8}
          sx={{
            position: "absolute",
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: { xs: "none", md: "flex" },
          }}
        >
          {sliderImages.map((_, i) => (
            <Box
              key={i}
              onClick={() => setSlide(i)}
              sx={{
                width: i === slide ? 22 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: W,
                opacity: i === slide ? 1 : 0.5,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* ── 2. Dynamic News Ticker from API ─────────────────────────── */}
      <Box
        sx={{
          bgcolor: P,
          py: 0.6,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            bgcolor: PD,
            px: 2,
            py: 0.4,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 0.7,
          }}
        >
          <CampaignIcon sx={{ color: "#90caf9", fontSize: 14 }} />
          <Typography
            sx={{
              color: "#90caf9",
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: 1,
              whiteSpace: "nowrap",
            }}
          >
            LATEST COURSES
          </Typography>
        </Box>
        <Box sx={{ overflow: "hidden", flex: 1, ml: 2 }}>
          <Box component="style">{`@keyframes tk{from{transform:translateX(100%)}to{transform:translateX(-200%)}}`}</Box>
          <Typography
            sx={{
              display: "inline-block",
              animation: "tk 45s linear infinite",
              color: "#e3f2fd",
              fontSize: "0.75rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {notificationMessages.join("   🎯   ")}
          </Typography>
        </Box>
      </Box>

      {/* ── Page body ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1 }}>
        {/* ── 3. TVET by the Numbers ───────────────── */}
        <Box
          sx={{
            position: "relative",
            py: { xs: 5, md: 4 },
            background: `
              radial-gradient(circle at 15% 30%, ${alpha(P, 0.1)} 0%, transparent 45%),
              radial-gradient(circle at 85% 70%, ${alpha(TEAL, 0.1)} 0%, transparent 45%),
              linear-gradient(180deg, #f7faff 0%, #eef4fb 100%)
            `,
            overflow: "hidden",
            borderTop: `1px solid ${alpha(P, 0.08)}`,
            borderBottom: `1px solid ${alpha(P, 0.08)}`,
          }}
        >
          <Box sx={{ px: 2 }}>
            <SectionTitle
              align="center"
              eyebrow="by Numbers"
              title="TVET at a Glance"
              subtitle=""
            />
            <TvetCardsIndex />
          </Box>
        </Box>

        {/* ── 4. National Statistics ─────────────────────────────────── */}
        <Box sx={{ px: 2, pt: 2 }}>
          <SectionTitle
            align="center"
            eyebrow=""
            title="Key TVET Indicators"
            subtitle="Detailed cumulative figures across all sectors — Public, Private and combined totals."
          />
          <TvetIndicatorsInstituteProviderType />
        </Box>

        {/* ── 5. Distribution overview ──────────────────────────────── */}
        <Box sx={{ bgcolor: "#eef3fa", py: { xs: 5, md: 6 } }}>
          <Box sx={{ px: 2 }}>
            <SectionTitle
              align="center"
              eyebrow="Distribution Overview"
              title="Where TVET is happening across Bhutan"
              subtitle="Program distribution by sector and institute distribution by geographic location."
            />
            <PieBarGraphDistributionIndex />
          </Box>
        </Box>

        {/* ── 6. Ongoing Programs with Dynamic Data ─── */}
        <Box sx={{ p: 2 }}>
          <SectionTitle
            eyebrow="Active Programs"
            title="Ongoing Programs"
            subtitle="Latest program activity across Training Centre."
          />
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e3eaf4",
              borderRadius: 3,
              bgcolor: "#ffffff",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <OngoingProgramsIndex />
            </CardContent>
          </Card>
        </Box>

        {/* ── 7. Course Announcements ──── */}
        <Box
          id="course-announcements"
          sx={{ bgcolor: "#eef3fa", py: { xs: 5, md: 6 } }}
        >
          <Box sx={{ px: 2 }}>
            <SectionTitle
              eyebrow="Latest Opportunities"
              title="Course Announcements"
              subtitle="Open programs accepting applications now — find the right course and apply online."
            />
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e3eaf4",
                borderRadius: 3,
                bgcolor: W,
                p: 2.5,
              }}
            >
              <Box
                sx={{
                  "& .MuiTable-root": { borderCollapse: "separate" },
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
                  "& .MuiTableBody-root tr:hover .MuiTableCell-root": {
                    bgcolor: "#f5f9ff",
                  },
                  "& .MuiChip-root": {
                    fontSize: "0.65rem",
                    height: 20,
                    fontWeight: 700,
                  },
                  "& .MuiButton-root": { fontSize: "0.7rem", py: 0.4 },
                  "& .MuiInputBase-input": { fontSize: "0.82rem" },
                  "& .MuiTablePagination-root": { fontSize: "0.75rem" },
                }}
              >
                <CourseTraineeAnnouncementsIndex />
              </Box>
            </Card>
          </Box>
        </Box>

        {/* ── 8. Quick Access ───────────────────────────────────────── */}
        <Box sx={{ px: 2, pb: 6, pt: 2 }}>
          <SectionTitle
            align="center"
            eyebrow=""
            title="Quick Access"
            subtitle="Frequently used resources for trainees, training providers and TVET professionals."
          />
          <Grid container spacing={2}>
            {[
              {
                label: "National Competency Standards",
                desc: "Browse all NCS documents by sector and qualification level",
                href: "/reports/ncs-publication",
                color: P,
                icon: <VerifiedIcon sx={{ fontSize: 28 }} />,
              },
              {
                label: "Curriculum",
                desc: "Access and download approved curricula for accredited TVET courses",
                href: "/reports/curriculum-publication",
                color: TEAL,
                icon: <MenuBookIcon sx={{ fontSize: 28 }} />,
              },
            ].map((link, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6 }}>
                <Box
                  component="a"
                  href={link.href}
                  rel="noreferrer"
                  sx={{ textDecoration: "none" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2.2,
                      border: `1.5px solid ${alpha(link.color, 0.28)}`,
                      borderRadius: 2.5,
                      bgcolor: alpha(link.color, 0.04),
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: alpha(link.color, 0.09),
                        borderColor: link.color,
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 14px ${alpha(link.color, 0.14)}`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: alpha(link.color, 0.13),
                        color: link.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {link.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        fontWeight={700}
                        sx={{ color: link.color, mb: 0.3 }}
                      >
                        {link.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {link.desc}
                      </Typography>
                    </Box>
                    <OpenInNewIcon
                      sx={{
                        color: alpha(link.color, 0.45),
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* ── Track Application Modal ── */}
      <Dialog
        open={trackOpen}
        onClose={() => setTrackOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "0.92rem",
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
            sx={{ border: "1px solid #d4e2f4", borderRadius: 2 }}
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
                      <Typography sx={{ color: "error.main", fontWeight: 600 }}>
                        No application found for the entered number.
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#666", mt: 1, display: "block" }}
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
