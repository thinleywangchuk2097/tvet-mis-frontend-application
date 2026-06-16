import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Typography,
  TablePagination,
  alpha,
  keyframes,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import CommonService from "../../api/services/internal/common/CommonService";

// ── Animations
const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const tableRowAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const marquee = keyframes`
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
`;

// ── Shared table styles with animation
const TS = {
  "& th": {
    bgcolor: "#e8f1fb",
    fontWeight: 700,
    fontSize: "0.77rem",
    color: "#0a2d6e",
    whiteSpace: "nowrap",
  },
  "& td": { fontSize: "0.8rem" },
  "& th, & td": { border: "1px solid #dbe5f0", py: 0.85, px: 1.2 },
  "& tbody tr": {
    animation: `${fadeInUp} 0.4s ease-out`,
    "&:hover td": { bgcolor: "#f5f9ff" },
  },
};

// Style for TextField
const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
  },
};

// Course icons based on course name
const getCourseIcon = (courseName) => {
  const icons = {
    carpenter: "🔨",
    mason: "🧱",
    welding: "⚡",
    plumbing: "🚰",
    electrical: "⚡",
    computer: "💻",
    accounting: "📊",
    business: "💼",
    hospitality: "🏨",
    cooking: "🍳",
    driving: "🚗",
    language: "📚",
    default: "🎓",
  };

  const lowerName = courseName?.toLowerCase() || "";
  for (const [key, icon] of Object.entries(icons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return icons.default;
};

const CourseTraineeAnnouncementsIndex = () => {
  const navigate = useNavigate();
  const [appPage, setAppPage] = useState(0);
  const [appRowsPerPage, setAppRowsPerPage] = useState(5);
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [courseDateFilter, setCourseDateFilter] = useState("");
  const [courseAnnouncementDetails, setCourseAnnouncementDetails] = useState(
    [],
  );

  // Dropdown states
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);

  useEffect(() => {
    fetchCourseAnnouncementDetails();
    fetchDropdownData();
    fetchDzongkhags();
  }, []);

  const fetchCourseAnnouncementDetails = async () => {
    try {
      const response = await CommonService.getAllCourseAnnouncement();
      setCourseAnnouncementDetails(response.data);
    } catch (error) {
      console.error("Error fetching course announcements:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const levelsResponse = await CommonService.getByParentId(10);
      setCertificationLevels(levelsResponse.data);

      const fundingResponse = await CommonService.getByParentId(16);
      setFundingSources(fundingResponse.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  // Create moving announcements from actual course data
  const movingAnnouncements = useMemo(() => {
    if (!courseAnnouncementDetails.length) return [];

    return courseAnnouncementDetails.slice(0, 10).map((course) => ({
      id: course.application_no,
      courseName: course.course_name || "Course",
      instituteName: course.institute_name || "Institute",
      startDate: course.course_start_date
        ? new Date(course.course_start_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "TBA",
      endDate: course.course_end_date
        ? new Date(course.course_end_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "TBA",
      location: course.training_location_id,
      fee: course.course_fee,
    }));
  }, [courseAnnouncementDetails]);

  const getCertificationLevelName = (levelId) => {
    if (!levelId) return "N/A";
    const level = certificationLevels.find(
      (l) => parseInt(l.id) === parseInt(levelId),
    );
    return level ? level.name : levelId;
  };

  const getFundingSourceName = (sourceId) => {
    if (!sourceId) return "N/A";
    const source = fundingSources.find(
      (s) => parseInt(s.id) === parseInt(sourceId),
    );
    return source ? source.name : sourceId;
  };

  const getDzongkhagName = (locationId) => {
    if (!locationId) return "N/A";
    const dzongkhag = dzongkhags.find(
      (dzong) => parseInt(dzong.id) === parseInt(locationId),
    );
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  const courseDates = useMemo(() => {
    const dates = courseAnnouncementDetails.map(
      (app) => app.course_start_date?.split(" ")[0],
    );
    return [...new Set(dates)].filter((date) => date);
  }, [courseAnnouncementDetails]);

  const filteredApplications = useMemo(() => {
    return courseAnnouncementDetails.filter((app) => {
      const courseStartDate = app.course_start_date?.split(" ")[0] || "";

      const matchesSearch =
        app.application_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.course_name?.toLowerCase().includes(searchText.toLowerCase());

      const matchesLocation = locationFilter
        ? parseInt(app.training_location_id) === parseInt(locationFilter)
        : true;

      const matchesCourseDate = courseDateFilter
        ? courseStartDate === courseDateFilter
        : true;

      return matchesSearch && matchesLocation && matchesCourseDate;
    });
  }, [searchText, locationFilter, courseDateFilter, courseAnnouncementDetails]);

  const handleReset = () => {
    setSearchText("");
    setLocationFilter("");
    setCourseDateFilter("");
    setAppPage(0);
  };

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
      {/* Moving Announcements Banner from API Data */}
      {movingAnnouncements.length > 0 && (
        <Box
          sx={{
            mb: 3,
            overflow: "hidden",
            whiteSpace: "nowrap",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 2,
            py: 1.5,
            position: "relative",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              animation: `${shimmer} 2s infinite`,
            },
          }}
        >
          {/* Speaker/Megaphone Icon */}
          <Box
            sx={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          >
            <CampaignIcon sx={{ color: "white", fontSize: 18 }} />
          </Box>

          {/* Moving Announcements */}
          <Box
            sx={{
              display: "inline-block",
              animation: `${marquee} ${Math.max(20, movingAnnouncements.length * 2)}s linear infinite`,
              whiteSpace: "nowrap",
              "&:hover": {
                animationPlayState: "paused",
              },
              ml: 6,
            }}
          >
            {/* Duplicate announcements for seamless loop */}
            {[
              ...movingAnnouncements,
              ...movingAnnouncements,
              ...movingAnnouncements,
            ].map((announcement, idx) => (
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
                  gap: 1.5,
                }}
              >
                {/* Icon with bounce animation based on course name */}
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    animation: `${bounce} 1s ease-in-out infinite`,
                    fontSize: "1.1rem",
                  }}
                >
                  {getCourseIcon(announcement.courseName)}
                </Box>

                {/* Course Title */}
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    px: 1.5,
                    py: 0.3,
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderRadius: 2,
                    fontSize: "0.9rem",
                    fontWeight: 700,
                  }}
                >
                  {announcement.courseName}
                </Box>

                {/* Institute */}
                <Box
                  component="span"
                  sx={{ opacity: 0.8, fontSize: "0.85rem" }}
                >
                  @{" "}
                  {announcement.instituteName.length > 20
                    ? announcement.instituteName.substring(0, 20) + "..."
                    : announcement.instituteName}
                </Box>

                {/* Date Range */}
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box component="span" sx={{ fontSize: "0.9rem" }}>
                    📅
                  </Box>
                  <Box component="span" sx={{ fontSize: "0.85rem" }}>
                    {announcement.startDate} - {announcement.endDate}
                  </Box>
                </Box>

                {/* Fee */}
                {announcement.fee && (
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.2,
                      bgcolor: "rgba(255,215,0,0.2)",
                      borderRadius: 2,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Nu. {announcement.fee.toLocaleString()}
                  </Box>
                )}

                {/* Separator */}
                <Box component="span" sx={{ opacity: 0.5 }}>
                  |
                </Box>

                {/* Apply Now CTA */}
                <Box
                  component="span"
                  sx={{
                    px: 1.8,
                    py: 0.4,
                    bgcolor: "#ff6b6b",
                    borderRadius: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "scale(1.05)",
                      bgcolor: "#ff5252",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    },
                  }}
                  onClick={() =>
                    navigate(`/course/apply-course/${announcement.id}`)
                  }
                >
                  <Box component="span" sx={{ fontSize: "0.9rem" }}>
                    🎯
                  </Box>
                  Apply Now!
                </Box>

                {/* Separator between announcements */}
                <Box
                  component="span"
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.5)",
                    mx: 1,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Header Section with Animation */}
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: alpha("#1565c0", 0.12),
            color: "#1565c0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            fontWeight={800}
            sx={{
              fontSize: "1rem",
              background:
                "linear-gradient(135deg, #0a1929 0%, #1565c0 50%, #0a1929 100%)",
              backgroundSize: "200% auto",
              color: "transparent",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              animation: `${gradientShift} 3s ease infinite`,
            }}
          >
            Course Announcements
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "block",
              animation: `${slideIn} 0.5s ease-out`,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-block",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -2,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, #1565c0, #42a5f5, #1565c0)",
                  animation: `${gradientShift} 2s ease infinite`,
                  backgroundSize: "200% auto",
                },
              }}
            >
              Available courses
            </Box>
            {" for application"}
          </Typography>
        </Box>
      </Stack>

      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Search */}
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Search by Application No or Course"
            size="small"
            fullWidth
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setAppPage(0);
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

        {/* Location Filter */}
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            label="Filter by Location"
            size="small"
            fullWidth
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setAppPage(0);
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

        {/* Course Date Filter */}
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            label="Filter by Course Start Date"
            size="small"
            fullWidth
            value={courseDateFilter}
            onChange={(e) => {
              setCourseDateFilter(e.target.value);
              setAppPage(0);
            }}
            sx={textFieldStyle}
          >
            <MenuItem value="">All Dates</MenuItem>
            {courseDates.map((date) => (
              <MenuItem key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Reset Button */}
        <Grid
          item
          size={{ xs: 12, sm: 6, md: 3 }}
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
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 3,
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>

      {/* Table Container with Animation */}
      <TableContainer
        sx={{
          borderRadius: 1.5,
          border: "1px solid #dbe5f0",
          overflowX: "auto",
        }}
      >
        <Table size="small" sx={TS}>
          <TableHead>
            <TableRow>
              <TableCell>Application No</TableCell>
              <TableCell>Institute Name</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Training Location</TableCell>
              <TableCell>Certification Level</TableCell>
              <TableCell>Funding Source</TableCell>
              <TableCell>Course Fee</TableCell>
              <TableCell>Application Period</TableCell>
              <TableCell>Course Period</TableCell>
              <TableCell>Entry Requirement</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Total Applied</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredApplications.length > 0 ? (
              filteredApplications
                .slice(
                  appPage * appRowsPerPage,
                  appPage * appRowsPerPage + appRowsPerPage,
                )
                .map((app, index) => (
                  <TableRow
                    key={app.application_no}
                    hover
                    sx={{
                      animation: `${tableRowAnimation} 0.3s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Chip
                        label={app.application_no}
                        size="small"
                        sx={{
                          bgcolor: alpha("#1565c0", 0.1),
                          color: "#1565c0",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell>{app.institute_name || "N/A"}</TableCell>
                    <TableCell>{app.course_name || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={getDzongkhagName(app.training_location_id)}
                        size="small"
                        sx={{
                          bgcolor: alpha("#0097a7", 0.1),
                          color: "#0097a7",
                          fontWeight: 500,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {getCertificationLevelName(app.certification_level_id)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFundingSourceName(app.funding_source_id)}
                        size="small"
                        sx={{
                          bgcolor: alpha("#2e7d32", 0.1),
                          color: "#2e7d32",
                          fontWeight: 500,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      Nu. {app.course_fee?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>
                      {app.application_start_date && app.application_end_date
                        ? `${new Date(app.application_start_date).toLocaleDateString()} - ${new Date(app.application_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>
                      {app.course_start_date && app.course_end_date
                        ? `${new Date(app.course_start_date).toLocaleDateString()} - ${new Date(app.course_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <ArrowUpwardIcon
                          fontSize="small"
                          sx={{ color: "#1565c0", fontSize: "0.8rem" }}
                        />
                        <Typography variant="caption">
                          {app.entry_requirement?.length > 30
                            ? `${app.entry_requirement.substring(0, 30)}...`
                            : app.entry_requirement || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontWeight: 700, color: "#1565c0" }}>
                        {app.total_no_trainees}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {app.total_applied}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<ArrowUpwardIcon fontSize="small" />}
                        label="Apply Now"
                        size="small"
                        color="primary"
                        onClick={() =>
                          navigate(`/course/apply-course/${app.application_no}`)
                        }
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          fontWeight: 600,
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 3,
                            bgcolor: "#1565c0",
                          },
                          "&:active": {
                            transform: "scale(0.95)",
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={13}
                  align="center"
                  sx={{ color: "error.main", fontWeight: 600, py: 4 }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontWeight: 600, mb: 1 }}>
                      No data available
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      No course announcements found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredApplications.length > 0 && (
        <TablePagination
          component="div"
          count={filteredApplications.length}
          page={appPage}
          onPageChange={(e, newPage) => setAppPage(newPage)}
          rowsPerPage={appRowsPerPage}
          onRowsPerPageChange={(e) => {
            setAppRowsPerPage(parseInt(e.target.value, 10));
            setAppPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            mt: 1,
            "& .MuiTablePagination-toolbar": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "0.75rem" },
          }}
        />
      )}
    </Paper>
  );
};

export default CourseTraineeAnnouncementsIndex;
