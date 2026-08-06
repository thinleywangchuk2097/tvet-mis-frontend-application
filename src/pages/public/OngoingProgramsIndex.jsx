import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Stack,
  Typography,
  alpha,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  keyframes,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/internal/common/CommonService";

// ── Animations (kept minimal)
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ── Shared table styles
const TS = {
  "& th": {
    bgcolor: "#e8f1fb",
    fontWeight: 700,
    fontSize: "0.77rem",
    color: "#0a2d6e",
    whiteSpace: "nowrap",
  },
  "& td": {
    fontSize: "0.8rem",
  },
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

// Style for TextField to remove hover effects
const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
  },
};

// ── OPTIMIZED Moving Banner Component ──
const MovingBanner = ({ announcements }) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (
      !containerRef.current ||
      !contentRef.current ||
      announcements.length === 0
    )
      return;

    const container = containerRef.current;
    const content = contentRef.current;

    let animationId = null;
    let startTime = null;
    let paused = false;
    let position = 0;
    const speed = 0.5; // pixels per frame

    // Check if content width exceeds container
    const contentWidth = content.scrollWidth / 2; // Because we duplicate
    const containerWidth = container.clientWidth;

    if (contentWidth <= containerWidth) {
      // No need to animate if content fits
      content.style.transform = "translateX(0)";
      return;
    }

    const animate = (timestamp) => {
      if (paused) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      if (!startTime) startTime = timestamp;
      const delta = timestamp - startTime;
      startTime = timestamp;

      position -= speed * (delta / 16); // Normalize to 60fps

      // Reset position when we've scrolled past half the content
      if (Math.abs(position) >= contentWidth) {
        position = 0;
      }

      content.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    const handleMouseEnter = () => {
      paused = true;
    };

    const handleMouseLeave = () => {
      paused = false;
      startTime = null;
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [announcements]);

  if (announcements.length === 0) return null;

  // Create display items (duplicate for seamless loop)
  const displayItems = [...announcements, ...announcements];

  return (
    <Box
      ref={containerRef}
      sx={{
        mb: 3,
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: 2,
        py: 1.5,
        position: "relative",
        cursor: "pointer",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          backgroundSize: "200% 100%",
          animation: `${shimmer} 3s infinite`,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        ref={contentRef}
        sx={{
          display: "inline-block",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {displayItems.map((announcement, idx) => (
          <Box
            key={`${announcement.id}-${idx}`}
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              mx: 3,
              color: "white",
              fontWeight: "bold",
              fontSize: "0.95rem",
              textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.3,
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                fontSize: "0.85rem",
              }}
            >
              🎓 {announcement.courseName}
            </Box>
            <Box component="span" sx={{ opacity: 0.8 }}>
              @
            </Box>
            <Box component="span" sx={{ fontSize: "0.85rem" }}>
              {announcement.instituteName}
            </Box>
            <Box component="span" sx={{ mx: 0.5 }}>
              📅
            </Box>
            <Box component="span" sx={{ fontSize: "0.85rem" }}>
              {formatDate(announcement.startDate)} -{" "}
              {formatDate(announcement.endDate)}
            </Box>
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1.5,
                py: 0.3,
                bgcolor: "#4caf50",
                borderRadius: 3,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.75rem",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                animation: "none", // Remove blink animation for performance
              }}
            >
              <Box component="span" sx={{ fontSize: "0.7rem" }}>
                ●
              </Box>
              ACTIVE
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ── Main Component ──
const OngoingProgramsIndex = () => {
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [progPage, setProgPage] = useState(0);
  const [progRowsPerPage, setProgRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [certificateLevelFilter, setCertificateLevelFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Dropdown states
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);

  // Memoized helper functions
  const getCertificationLevelName = useMemo(() => {
    const levelMap = new Map();
    certificationLevels.forEach((level) => {
      levelMap.set(parseInt(level.id), level.name);
    });
    return (levelId) => {
      if (!levelId) return "N/A";
      return levelMap.get(parseInt(levelId)) || levelId;
    };
  }, [certificationLevels]);

  const getDzongkhagName = useMemo(() => {
    const dzongMap = new Map();
    dzongkhags.forEach((dzong) => {
      dzongMap.set(parseInt(dzong.id), dzong.dzonkhagName);
    });
    return (locationId) => {
      if (!locationId) return "N/A";
      return dzongMap.get(parseInt(locationId)) || "N/A";
    };
  }, [dzongkhags]);

  useEffect(() => {
    fetchOngoingCourses();
    fetchDropdownData();
    fetchDzongkhags();
  }, []);

  const fetchOngoingCourses = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await PublicPageService.getOngoingCourses();
      setOngoingCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching ongoing courses:", error);
      setError(true);
      setOngoingCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const levelsResponse = await CommonService.getAllCertificateLevels();
      setCertificationLevels(
        Array.isArray(levelsResponse.data) ? levelsResponse.data : [],
      );
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      setCertificationLevels([]);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(
        Array.isArray(dzongkhagLists.data) ? dzongkhagLists.data : [],
      );
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
      setDzongkhags([]);
    }
  };

  // Create moving course announcements from actual course data (memoized)
  const movingAnnouncements = useMemo(() => {
    if (!ongoingCourses.length) return [];

    return ongoingCourses.map((course) => ({
      id: course.id || course.application_no,
      courseName: course.course_name || "Course",
      instituteName: course.institute_name || "Institute",
      startDate: course.course_start_date,
      endDate: course.course_end_date,
    }));
  }, [ongoingCourses]);

  // Filtering logic with useMemo
  const filteredCourses = useMemo(() => {
    return ongoingCourses.filter((course) => {
      const matchesSearch =
        searchText === "" ||
        course.course_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        course.institute_name?.toLowerCase().includes(searchText.toLowerCase());

      const matchesCertificateLevel = certificateLevelFilter
        ? parseInt(course.certification_level_id) ===
          parseInt(certificateLevelFilter)
        : true;

      const matchesLocation = locationFilter
        ? parseInt(course.training_location_id) === parseInt(locationFilter)
        : true;

      return matchesSearch && matchesCertificateLevel && matchesLocation;
    });
  }, [searchText, certificateLevelFilter, locationFilter, ongoingCourses]);

  const handleReset = useCallback(() => {
    setSearchText("");
    setCertificateLevelFilter("");
    setLocationFilter("");
    setProgPage(0);
  }, []);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ color: "#666" }}>
          Loading ongoing programs...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography
          sx={{
            color: "error.main",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Unable to connect to the server
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#666",
            mt: 1,
            display: "block",
          }}
        >
          Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Moving Course Announcements Banner - OPTIMIZED */}
      <MovingBanner announcements={movingAnnouncements} />

      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: alpha("#1565c0", 0.12),
            color: "#1565c0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        >
          <HistoryIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            fontWeight={800}
            sx={{
              fontSize: "0.95rem",
              background:
                "linear-gradient(135deg, #0a1929 0%, #1565c0 50%, #0a1929 100%)",
              backgroundSize: "200% auto",
              color: "transparent",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              animation: `${gradientShift} 3s ease infinite`,
            }}
          >
            Program Activity
          </Typography>
        </Box>
      </Stack>

      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Search by Course or Institute"
            size="small"
            fullWidth
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setProgPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon
                    sx={{ color: "#90a4ae", fontSize: 16, mr: 0.5 }}
                  />
                ),
              },
            }}
            sx={textFieldStyle}
          />
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            label="Filter by Certificate Level"
            size="small"
            fullWidth
            value={certificateLevelFilter}
            onChange={(e) => {
              setCertificateLevelFilter(e.target.value);
              setProgPage(0);
            }}
            sx={textFieldStyle}
          >
            <MenuItem value="">All Levels</MenuItem>
            {certificationLevels.map((level) => (
              <MenuItem key={level.id} value={level.id}>
                {level.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            label="Filter by Location"
            size="small"
            fullWidth
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setProgPage(0);
            }}
            sx={textFieldStyle}
          >
            <MenuItem value="">All Locations</MenuItem>
            {dzongkhags.map((dzongkhag) => (
              <MenuItem key={dzongkhag.id} value={dzongkhag.id}>
                {dzongkhag.dzonkhagName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid
          item
          size={{ xs: 12, sm: 6, md: 2 }}
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<RestartAltIcon />}
            fullWidth
            onClick={handleReset}
            sx={{
              height: 40,
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>

      <TableContainer sx={{ borderRadius: 1.5, border: "1px solid #dbe5f0" }}>
        <Table size="small" sx={TS}>
          <TableHead>
            <TableRow>
              <TableCell>Training Institute</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Training Location</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="center">Total Trainees</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
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
                      sx={{
                        fontWeight: 600,
                        color: "#0a1929",
                      }}
                    >
                      {course.course_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {getCertificationLevelName(course.certification_level_id)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDzongkhagName(course.training_location_id)}
                        size="small"
                        sx={{
                          bgcolor: alpha("#1565c0", 0.1),
                          color: "#1565c0",
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
                    <TableCell align="center">
                      {course.total_no_trainees !== undefined
                        ? course.total_no_trainees
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{
                    color: "error.main",
                    fontWeight: 600,
                  }}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredCourses.length > 0 && (
        <TablePagination
          component="div"
          count={filteredCourses.length}
          page={progPage}
          onPageChange={(_, p) => setProgPage(p)}
          rowsPerPage={progRowsPerPage}
          onRowsPerPageChange={(e) => {
            setProgRowsPerPage(parseInt(e.target.value, 10));
            setProgPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            "& .MuiTablePagination-toolbar": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "0.75rem" },
          }}
        />
      )}
    </Paper>
  );
};

export default OngoingProgramsIndex;
