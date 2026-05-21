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
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Chip,
  Card,
  CardContent,
  Stack,
  IconButton,
  Container,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import VerifiedIcon from "@mui/icons-material/Verified";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import BarChartIcon from "@mui/icons-material/BarChart";
import CampaignIcon from "@mui/icons-material/Campaign";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import HistoryIcon from "@mui/icons-material/History";
import PieChartIcon from "@mui/icons-material/PieChart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SchoolIcon from "@mui/icons-material/School";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";

// ── Imported course announcements component
import CourseTraineeAnnouncementsIndex from "./CourseTraineeAnnouncementsIndex";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/CommonService";

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

// ── Key TVET Indicators (Public / Private / Total)
const tvetIndicators = [
  { id: 1, name: "Registered Training Providers", pub: 14, pvt: 130, color: P },
  {
    id: 2,
    name: "Accredited Training Providers",
    pub: 12,
    pvt: 74,
    color: "#0288d1",
  },
  {
    id: 3,
    name: "Accredited Assessment Centres",
    pub: 18,
    pvt: 16,
    color: TEAL,
  },
  { id: 4, name: "Registered SES Centres", pub: 20, pvt: 8, color: "#00897b" },
  { id: 5, name: "Registered Trainers", pub: 215, pvt: 197, color: "#2e7d32" },
  { id: 6, name: "Registered Accreditors", pub: 38, pvt: 18, color: "#558b2f" },
  {
    id: 7,
    name: "Registered QMS Auditors",
    pub: 22,
    pvt: 16,
    color: "#9e9d24",
  },
  { id: 8, name: "Registered Assessors", pub: 95, pvt: 92, color: "#f9a825" },
  { id: 9, name: "Registered Programs", pub: 250, pvt: 470, color: "#ef6c00" },
  { id: 10, name: "Accredited Programs", pub: 173, pvt: 69, color: "#e65100" },
  {
    id: 11,
    name: "Enrollment in Accredited (BQF) Programs",
    pub: 8094,
    pvt: 16990,
    color: "#d84315",
  },
  {
    id: 12,
    name: "Enrollment in Non-BQF Programs",
    pub: 5732,
    pvt: 45951,
    color: "#bf360c",
  },
  {
    id: 13,
    name: "BQF Certificate Awarded",
    pub: 3245,
    pvt: 5211,
    color: "#6a1b9a",
  },
  { id: 14, name: "Certificate 2", pub: 1856, pvt: 2465, color: "#7b1fa2" },
  { id: 15, name: "Certificate 3", pub: 1325, pvt: 1662, color: "#8e24aa" },
  { id: 16, name: "Diploma", pub: 1024, pvt: 830, color: "#4527a0" },
  { id: 17, name: "Advance Diploma", pub: 412, pvt: 212, color: "#283593" },
].map((r) => ({ ...r, total: r.pub + r.pvt }));

// ── Institute by Provider Type
const providerTypeData = [
  { name: "Public", value: 48, color: "#1565c0" },
  { name: "Private", value: 86, color: "#2e7d32" },
];
const providerTotal = providerTypeData.reduce((s, d) => s + d.value, 0);

// ── Dynamic color generator for sectors
const getSectorColor = (index) => {
  const colors = [
    P,
    "#0288d1",
    TEAL,
    "#2e7d32",
    "#558b2f",
    "#e65100",
    "#6a1b9a",
    "#7b1fa2",
    "#8e24aa",
    "#4527a0",
    "#283593",
    "#d84315",
    "#bf360c",
    "#f9a825",
    "#ef6c00",
    "#9e9d24",
  ];
  return colors[index % colors.length];
};

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

// ── Format date function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [dzongkhagInstituteData, setDzongkhagInstituteData] = useState([]);
  const [courseBySectorData, setCourseBySectorData] = useState([]);
  const [courseAnnounceNotifications, setCourseAnnounceNotifications] =
    useState([]);
  const [notificationMessages, setNotificationMessages] = useState([]);

  // Pagination — TVET Indicators
  const [infoPage, setInfoPage] = useState(0);
  const [infoRowsPerPage, setInfoRowsPerPage] = useState(5);

  // Pagination — Ongoing Programs
  const [progPage, setProgPage] = useState(0);
  const [progRowsPerPage, setProgRowsPerPage] = useState(5);

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
    fetchOngoingCourses();
    fetchDzongkhags();
    fetchInstituteDetails();
    fetchCourseBySectorData();
    fetchCourseAnnounceNotifications();
  }, []);

  // Process notification messages whenever courseAnnounceNotifications changes
  useEffect(() => {
    if (courseAnnounceNotifications.length > 0) {
      const messages = courseAnnounceNotifications.map((notification) => {
        const startDate = formatNotificationDate(notification.course_start_date);
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

  // Process institute data by dzongkhag whenever either institutes or dzongkhags change
  useEffect(() => {
    if (instituteDetails.length > 0 && dzongkhags.length > 0) {
      processInstituteDataByDzongkhag();
    }
  }, [instituteDetails, dzongkhags]);

  const fetchOngoingCourses = async () => {
    try {
      const response = await PublicPageService.getOngoingCourses();
      console.log("Ongoing Courses:", response.data);
      setOngoingCourses(response.data);
    } catch (error) {
      console.error("Error fetching ongoing courses:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      console.log("Dzongkhags:", dzongkhagLists.data);
      setDzongkhags(dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response = await PublicPageService.getAllInstitutes();
      console.log("Institute Details:", response.data);
      setInstituteDetails(response.data);
    } catch (error) {
      console.error("Error fetching institute details:", error);
    }
  };

  const fetchCourseBySectorData = async () => {
    try {
      const response = await PublicPageService.getCourseBySector();
      console.log("Course by Sector Data:", response.data);
      // Transform the data to match the expected format
      const transformedData = response.data.map((item) => ({
        name: item.sector_name,
        value: item.sector_value,
      }));
      setCourseBySectorData(transformedData);
    } catch (error) {
      console.error("Error fetching course by sector data:", error);
    }
  };

  const fetchCourseAnnounceNotifications = async () => {
    try {
      const response =
        await PublicPageService.getCourseAnnounceNotifications();
      console.log("Course Announcement Notifications:", response.data);
      setCourseAnnounceNotifications(response.data);
    } catch (error) {
      console.error("Error fetching course announcement notifications:", error);
    }
  };

  const processInstituteDataByDzongkhag = () => {
    // Create a map of dzongkhag ID to name
    const dzongkhagMap = {};
    dzongkhags.forEach((dz) => {
      dzongkhagMap[dz.id] = dz.dzonkhagName;
    });

    // Count institutes per dzongkhag
    const instituteCountMap = {};
    instituteDetails.forEach((institute) => {
      const dzongkhagId = institute.dzongkhag_id;
      if (dzongkhagId) {
        instituteCountMap[dzongkhagId] =
          (instituteCountMap[dzongkhagId] || 0) + 1;
      }
    });

    // Create array for bar chart with all dzongkhags (including those with 0 institutes)
    const chartData = dzongkhags
      .map((dz) => ({
        name: dz.dzonkhagName,
        value: instituteCountMap[dz.id] || 0,
        id: dz.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    console.log("Dzongkhag Institute Data:", chartData);
    setDzongkhagInstituteData(chartData);
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

  // Calculate total programs for the pie chart
  const totalPrograms = courseBySectorData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

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
            py: { xs: 5, md: 6 },
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
          <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
            <SectionTitle
              align="center"
              eyebrow="by Numbers"
              title="TVET at a Glance"
              subtitle=""
            />
            <Grid container spacing={2.5}>
              {stats.map((s, i) => (
                <Grid key={i} size={{ xs: 6, md: 3 }}>
                  <Box
                    sx={{
                      bgcolor: W,
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
          </Container>
        </Box>

        {/* ── 4. National Statistics ─────────────────────────────────── */}
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 6 } }}>
          <SectionTitle
            align="center"
            eyebrow="National Statistics"
            title="Key TVET Indicators"
            subtitle="Detailed cumulative figures across all sectors — Public, Private and combined totals."
          />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e3eaf4",
                  borderRadius: 3,
                  bgcolor: W,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
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
                        bgcolor: alpha(P, 0.12),
                        color: P,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BarChartIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography
                        fontWeight={800}
                        sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                      >
                        TVET Indicators Breakdown
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Public vs Private vs Total
                      </Typography>
                    </Box>
                  </Stack>
                  <TableContainer>
                    <Table size="small" sx={TS}>
                      <TableHead>
                        <TableRow>
                          <TableCell width={36}>#</TableCell>
                          <TableCell>Indicator</TableCell>
                          <TableCell align="center">Public</TableCell>
                          <TableCell align="center">Private</TableCell>
                          <TableCell align="center">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tvetIndicators
                          .slice(
                            infoPage * infoRowsPerPage,
                            infoPage * infoRowsPerPage + infoRowsPerPage,
                          )
                          .map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>
                                <Box
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 1,
                                    bgcolor: row.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: W,
                                      fontSize: "0.66rem",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {row.id}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600, color: "#0a1929" }}
                              >
                                {row.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: "#1565c0", fontWeight: 600 }}
                              >
                                {row.pub.toLocaleString()}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: "#2e7d32", fontWeight: 600 }}
                              >
                                {row.pvt.toLocaleString()}
                              </TableCell>
                              <TableCell align="center">
                                <Box
                                  sx={{
                                    display: "inline-block",
                                    px: 1.4,
                                    py: 0.3,
                                    borderRadius: 1,
                                    bgcolor: alpha(row.color, 0.12),
                                    border: `1px solid ${alpha(row.color, 0.35)}`,
                                    minWidth: 60,
                                  }}
                                >
                                  <Typography
                                    fontWeight={800}
                                    sx={{
                                      color: row.color,
                                      fontSize: "0.78rem",
                                    }}
                                  >
                                    {row.total.toLocaleString()}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={tvetIndicators.length}
                    page={infoPage}
                    onPageChange={(_, p) => setInfoPage(p)}
                    rowsPerPage={infoRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setInfoRowsPerPage(parseInt(e.target.value, 10));
                      setInfoPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25]}
                    sx={{
                      "& .MuiTablePagination-toolbar": { minHeight: 40 },
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                        { fontSize: "0.75rem" },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e3eaf4",
                  borderRadius: 3,
                  bgcolor: W,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
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
                        bgcolor: alpha(P, 0.12),
                        color: P,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AccountBalanceIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography
                        fontWeight={800}
                        sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                      >
                        Institute by Provider Type
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Public · Private
                      </Typography>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${P} 0%, #0d47a1 100%)`,
                      borderRadius: 1.5,
                      px: 1.6,
                      py: 1.1,
                      mb: 1.8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: `0 3px 10px ${alpha(P, 0.22)}`,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: alpha(W, 0.78),
                          fontSize: "0.6rem",
                          letterSpacing: 0.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Total Institutes
                      </Typography>
                      <Typography
                        sx={{
                          color: W,
                          fontWeight: 800,
                          fontSize: "1.3rem",
                          lineHeight: 1.1,
                        }}
                      >
                        {providerTotal.toLocaleString()}
                      </Typography>
                    </Box>
                    <AccountBalanceIcon
                      sx={{ color: alpha(W, 0.8), fontSize: 30 }}
                    />
                  </Box>

                  <Stack spacing={3.4}>
                    {providerTypeData.map((item, i) => {
                      const maxV = Math.max(
                        ...providerTypeData.map((d) => d.value),
                      );
                      const widthPct = (item.value / maxV) * 100;
                      const sharePct = (
                        (item.value / providerTotal) *
                        100
                      ).toFixed(1);
                      return (
                        <Box key={i}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 0.5 }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.8}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: item.color,
                                  boxShadow: `0 0 0 4px ${alpha(item.color, 0.18)}`,
                                }}
                              />
                              <Typography
                                fontWeight={700}
                                sx={{ fontSize: "0.78rem", color: "#0a1929" }}
                              >
                                {item.name}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              alignItems="baseline"
                              spacing={0.5}
                            >
                              <Typography
                                fontWeight={800}
                                sx={{ color: item.color, fontSize: "0.9rem" }}
                              >
                                {item.value}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "text.secondary",
                                  fontSize: "0.65rem",
                                }}
                              >
                                ({sharePct}%)
                              </Typography>
                            </Stack>
                          </Stack>
                          <Box
                            sx={{
                              height: 6,
                              bgcolor: "#f0f4fa",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${widthPct}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${item.color} 0%, ${alpha(item.color, 0.65)} 100%)`,
                                borderRadius: 3,
                                transition:
                                  "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: `0 1px 2px ${alpha(item.color, 0.4)}`,
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* ── 5. Distribution overview ──────────────────────────────── */}
        <Box sx={{ bgcolor: "#eef3fa", py: { xs: 5, md: 6 } }}>
          <Container maxWidth="xl">
            <SectionTitle
              align="center"
              eyebrow="Distribution Overview"
              title="Where TVET is happening across Bhutan"
              subtitle="Program distribution by sector and institute distribution by geographic location."
            />
            <Grid container spacing={2}>
              {/* Program By Sector - Dynamic Pie Chart */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e3eaf4",
                    borderRadius: 3,
                    bgcolor: W,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
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
                          bgcolor: alpha(P, 0.12),
                          color: P,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PieChartIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography
                          fontWeight={800}
                          sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                        >
                          Program By Sector
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Distribution by program sector
                        </Typography>
                      </Box>
                    </Stack>

                    {courseBySectorData.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography sx={{ color: "#666" }}>
                          Loading program distribution data...
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ width: "55%", height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={courseBySectorData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  innerRadius={30}
                                  label={({ percent }) =>
                                    `${(percent * 100).toFixed(0)}%`
                                  }
                                  labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
                                >
                                  {courseBySectorData.map((_, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={getSectorColor(index)}
                                    />
                                  ))}
                                </Pie>
                                <RTooltip
                                  contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #d4e2f4",
                                    fontSize: "0.8rem",
                                  }}
                                  formatter={(value, name) => [
                                    `${value} Program(s)`,
                                    name,
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                          <Box
                            sx={{
                              width: "45%",
                              pl: 1.5,
                              maxHeight: 240,
                              overflowY: "auto",
                            }}
                          >
                            {courseBySectorData.map((item, index) => {
                              const percentage = (
                                (item.value / totalPrograms) *
                                100
                              ).toFixed(1);
                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1.5,
                                    gap: 0.8,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: "50%",
                                      bgcolor: getSectorColor(index),
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#444",
                                      flex: 1,
                                      fontSize: "0.72rem",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {item.name}
                                  </Typography>
                                  <Stack
                                    direction="column"
                                    alignItems="flex-end"
                                    spacing={0}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        color: getSectorColor(index),
                                      }}
                                    >
                                      {item.value}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: "0.6rem",
                                        color: "#888",
                                      }}
                                    >
                                      ({percentage}%)
                                    </Typography>
                                  </Stack>
                                </Box>
                              );
                            })}
                            <Box
                              sx={{
                                mt: 2,
                                pt: 1,
                                borderTop: "1px solid #e0e8f0",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: P,
                                  textAlign: "right",
                                }}
                              >
                                Total: {totalPrograms} Programs
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Institute By Dzongkhag */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e3eaf4",
                    borderRadius: 3,
                    bgcolor: W,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
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
                          bgcolor: alpha(P, 0.12),
                          color: P,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LocationOnIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography
                          fontWeight={800}
                          sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                        >
                          Institute By Dzongkhag
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Distribution across all 20 Dzongkhags of Bhutan
                        </Typography>
                      </Box>
                    </Stack>
                    {dzongkhagInstituteData.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography sx={{ color: "#666" }}>
                          Loading institute distribution data...
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={dzongkhagInstituteData}
                            margin={{
                              top: 8,
                              right: 16,
                              left: -18,
                              bottom: 58,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#edf2f9"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: "#555" }}
                              angle={-40}
                              textAnchor="end"
                              interval={0}
                              height={70}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: "#666" }}
                              label={{
                                value: "Number of Institutes",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: "11px", fill: "#666" },
                              }}
                            />
                            <RTooltip
                              contentStyle={{
                                borderRadius: 8,
                                border: "1px solid #d4e2f4",
                                fontSize: "0.8rem",
                              }}
                              formatter={(value) => [
                                `${value} Institute(s)`,
                                "Count",
                              ]}
                              labelFormatter={(label) => `${label}`}
                            />
                            <Bar
                              dataKey="value"
                              radius={[6, 6, 0, 0]}
                              barSize={24}
                              fill={P}
                            >
                              {dzongkhagInstituteData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.value > 0 ? P : "#bdbdbd"}
                                  opacity={entry.value > 0 ? 1 : 0.5}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 2, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "#666" }}>
                            Total Institutes:{" "}
                            {dzongkhagInstituteData.reduce(
                              (sum, d) => sum + d.value,
                              0,
                            )}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ── 6. Ongoing Programs with Dynamic Data ─── */}
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 6 } }}>
          <SectionTitle
            eyebrow="Active Programs"
            title="Ongoing Programs"
            subtitle="Latest program activity across Training Centre."
          />
          <Card
            elevation={0}
            sx={{ border: "1px solid #e3eaf4", borderRadius: 3, bgcolor: W }}
          >
            <CardContent sx={{ p: 2.5 }}>
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
                    bgcolor: alpha(P, 0.12),
                    color: P,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography
                    fontWeight={800}
                    sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                  >
                    Program Activity
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Ongoing courses with training locations
                  </Typography>
                </Box>
              </Stack>

              {ongoingCourses.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography sx={{ color: "#666" }}>
                    No ongoing courses available at the moment.
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer
                    sx={{ borderRadius: 1.5, border: "1px solid #dbe5f0" }}
                  >
                    <Table size="small" sx={TS}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Training Institute</TableCell>
                          <TableCell>Course Name</TableCell>
                          <TableCell>Certificate Level</TableCell>
                          <TableCell>Training Location</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ongoingCourses
                          .slice(
                            progPage * progRowsPerPage,
                            progPage * progRowsPerPage + progRowsPerPage,
                          )
                          .map((course, index) => (
                            <TableRow key={course.application_no || index}>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {course.institute_name || "N/A"}
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600, color: "#0a1929" }}
                              >
                                {course.course_name || "N/A"}
                              </TableCell>
                              <TableCell>
                                {course.certificate_level || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={course.training_location || "N/A"}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(P, 0.1),
                                    color: P,
                                    fontWeight: 500,
                                    fontSize: "0.7rem",
                                    height: 24,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.76rem" }}>
                                {formatDate(course.course_start_date)}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.76rem" }}>
                                {formatDate(course.course_end_date)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={ongoingCourses.length}
                    page={progPage}
                    onPageChange={(_, p) => setProgPage(p)}
                    rowsPerPage={progRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setProgRowsPerPage(parseInt(e.target.value, 10));
                      setProgPage(0);
                    }}
                    rowsPerPageOptions={[5, 10]}
                    sx={{
                      "& .MuiTablePagination-toolbar": { minHeight: 40 },
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                        { fontSize: "0.75rem" },
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Container>

        {/* ── 7. Course Announcements ──── */}
        <Box
          id="course-announcements"
          sx={{ bgcolor: "#eef3fa", py: { xs: 5, md: 6 } }}
        >
          <Container maxWidth="xl">
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
          </Container>
        </Box>

        {/* ── 8. Quick Access ───────────────────────────────────────── */}
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 6 } }}>
          <SectionTitle
            align="center"
            eyebrow="Resources"
            title="Quick Access"
            subtitle="Frequently used resources for trainees, training providers and TVET professionals."
          />
          <Grid container spacing={2}>
            {[
              {
                label: "National Competency Standards",
                desc: "Browse all NCS documents by sector and qualification level",
                href: "https://www.blmis.gov.bt/tvet/ncs",
                color: P,
                icon: <VerifiedIcon sx={{ fontSize: 28 }} />,
              },
              {
                label: "Approved Curriculum",
                desc: "Access and download approved curricula for accredited TVET courses",
                href: "https://www.blmis.gov.bt/tvet/curriculum",
                color: TEAL,
                icon: <MenuBookIcon sx={{ fontSize: 28 }} />,
              },
            ].map((link, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6 }}>
                <Box
                  component="a"
                  href={link.href}
                  target="_blank"
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
        </Container>
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