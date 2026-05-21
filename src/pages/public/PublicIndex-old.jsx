import { useEffect, useState } from "react";
import {
  Box,
  Button,
  useTheme,
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
} from "@mui/material";

import { Search } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CourseTraineeAnnouncementsIndex from "./CourseTraineeAnnouncementsIndex";

// Slider images
import slide1 from "../../assets/slider/slide1.jpg";
import slide2 from "../../assets/slider/slide2.jpg";
import slide3 from "../../assets/slider/slide3.jpg";
import slide4 from "../../assets/slider/slide4.png";
import slide5 from "../../assets/slider/slide5.png";
import slide6 from "../../assets/slider/slide6.png";
import slide7 from "../../assets/slider/slide7.png";

const sliderImages = [slide1, slide2, slide3, slide4, slide5, slide6, slide7];

const applicationDetails = [
  {
    application_no: 301,
    name: "Tashi Dorji",
    location: "Thimphu",
    service: "Electricity",
    status: "Approved",
  },
  {
    application_no: 302,
    name: "Sonam Choden",
    location: "Paro",
    service: "Water Supply",
    status: "Pending",
  },
  {
    application_no: 303,
    name: "Pema Wangchuk",
    location: "Punakha",
    service: "Road Construction",
    status: "Rejected",
  },
  {
    application_no: 304,
    name: "Kesang Dema",
    location: "Gelegphu",
    service: "Health",
    status: "Approved",
  },
];

// Pie chart
const pieData = [
  { name: "Construction", value: 1 },
  { name: "Power", value: 2 },
  { name: "Automobile", value: 3 },
  { name: "Manufacturing", value: 5 },
  { name: "Tourism & Hospitality", value: 1 },
  { name: "Transportation", value: 2 },
  { name: "Zorig Chusum", value: 3 },
];

const COLORS = [
  "#4caf50",
  "#ff9800",
  "#f44336",
  "#2196f3",
  "#9c27b0",
  "#ff5722",
  "#3f51b5",
  "#009688",
];

// Line & bar chart
const graphData = [
  { month: "Thimphu", value: 3 },
  { month: "Bumthang", value: 1 },
  { month: "Wangdue", value: 1 },
  { month: "Tgang", value: 1 },
  { month: "Punakha", value: 3 },
];

const graphLineData = [
  { month: "jan", value: 12 },
  { month: "feb", value: 17 },
  { month: "mar", value: 20 },
  { month: "apr", value: 50 },
  { month: "may", value: 40 },
  { month: "jun", value: 100 },
  { month: "jul", value: 150 },
  { month: "aug", value: 50 },
  { month: "sep", value: 67 },
  { month: "oct", value: 100 },
  { month: "nov", value: 175 },
  { month: "dec", value: 200 },
];

const PublicIndex = () => {
  const theme = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);

  // -------------------- Pagination --------------------
  const [infoPage, setInfoPage] = useState(0);
  const [infoRowsPerPage, setInfoRowsPerPage] = useState(5);
  const [coursePage, setCoursePage] = useState(0);
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(5);

  // -------------------- Table Data --------------------

  const tvetIndicators = [
    {
      id: 1,
      name: "Registered Training Provider",
      ttiGovt: 14,
      pvtOthers: 130,
      total: 144,
    },
    {
      id: 2,
      name: "Accredited Courses",
      ttiGovt: 173,
      pvtOthers: 69,
      total: 242,
    },
    { id: 3, name: "Other Courses", ttiGovt: 164, pvtOthers: 556, total: 720 },
    {
      id: 4,
      name: "Enrolment in Accredited Courses",
      ttiGovt: 8094,
      pvtOthers: 16990,
      total: 25084,
    },
    {
      id: 5,
      name: "Enrolment in other Courses",
      ttiGovt: 5732,
      pvtOthers: 45951,
      total: 51683,
    },
    { id: 6, name: "ToT Certified", ttiGovt: 124, pvtOthers: 50, total: 174 },
    {
      id: 7,
      name: "RPL Certified (MoLHR)",
      ttiGovt: 0,
      pvtOthers: 0,
      total: 0,
    },
  ];

  const recentOngoingCourses = [
    {
      course: "Physics 101",
      certification: "Level 1",
      status: "ONGOING",
      applicationDate: "10-Jan-2026",
      courseDate: "15-Jan-2026",
    },
    {
      course: "Mathematics 201",
      certification: "Level 2",
      status: "ONGOING",
      applicationDate: "05-Dec-2025",
      courseDate: "10-Dec-2025",
    },
    {
      course: "Mathematics 201",
      certification: "Level 2",
      status: "COMPLETED",
      applicationDate: "05-Dec-2025",
      courseDate: "10-Dec-2025",
    },
    {
      course: "Mathematics 201",
      certification: "Level 2",
      status: "ONGOING",
      applicationDate: "05-Dec-2025",
      courseDate: "10-Dec-2025",
    },
    {
      course: "Mathematics 201",
      certification: "Level 2",
      status: "COMPLETED",
      applicationDate: "05-Dec-2025",
      courseDate: "10-Dec-2025",
    },
  ];

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const notifications = [
    {
      id: 1,
      message:
        "New Course Applications are now open! Apply before 10th March 2026.",
      icon: <NotificationsActiveIcon fontSize="small" />,
    },
    {
      id: 2,
      message: "Institute registrations for 2026 are due soon.",
      icon: <NotificationsActiveIcon fontSize="small" />,
    },
    {
      id: 3,
      message: "Check your application status using the search bar above.",
      icon: <NotificationsActiveIcon fontSize="small" />,
    },
    {
      id: 4,
      message: "New courses added in Thimphu and Paro locations.",
      icon: <NotificationsActiveIcon fontSize="small" />,
    },
  ];

  // Modal search
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Slider auto change
  useEffect(() => {
    const interval = setInterval(
      () => setActiveSlide((prev) => (prev + 1) % sliderImages.length),
      4000,
    );
    return () => clearInterval(interval);
  }, []);

  // Search handler with validation
  const handleSearchClick = () => {
    if (!modalSearchQuery.trim()) {
      setSearchError(true);
      return;
    }

    setSearchError(false);

    const app = applicationDetails.find(
      (a) => a.application_no.toString() === modalSearchQuery,
    );
    setSelectedApplication(app || null);
    setOpenModal(true);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#4caf50";
      case "pending":
        return "#ff9800";
      case "rejected":
        return "#f44336";
      default:
        return "#000";
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Slider */}
      <Box
        sx={{
          position: "relative",
          width: "100vw",
          left: "50%",
          marginLeft: "-50vw",
          height: { xs: 300, md: 300 },
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {sliderImages.map((img, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              width: "100%",
              height: "100%",
              opacity: index === activeSlide ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          />
        ))}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.25)",
            zIndex: 1,
          }}
        />
        {/* Search */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 40 },
            display: "flex",
            width: { xs: "90%", sm: 360, md: 420 },
            zIndex: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Track Your Application"
            variant="outlined"
            size="small"
            value={modalSearchQuery}
            onChange={(e) => {
              setModalSearchQuery(e.target.value);
              if (searchError && e.target.value.trim()) setSearchError(false);
            }}
            error={searchError}
            helperText={searchError ? "Please enter application no." : ""}
            slotProps={{
              input: {
                sx: {
                  borderRadius: "6px 0 0 6px",
                  backgroundColor: alpha(theme.palette.background.paper, 0.85),
                  height: { xs: 36, md: 42 },
                  fontSize: { xs: "0.85rem", md: "0.95rem" },
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            sx={{
              borderRadius: "0 6px 6px 0",
              backgroundColor: theme.palette.primary.main,
              px: 3,
              height: { xs: 36, md: 42 },
            }}
            onClick={handleSearchClick}
          >
            Search
          </Button>
        </Box>
        {/* Moving Notification */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            width: "100%",
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <Box
            component="style"
            children={`
      @keyframes slideLeftRight {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}
          />

          <Box
            sx={{
              display: "flex",
              gap: 6,
              whiteSpace: "nowrap",
              animation: "slideLeftRight 20s linear infinite",
            }}
          >
            {notifications.map((notif) => (
              <Box
                key={notif.id}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.85),
                  borderRadius: 1,
                  color: "#fff",
                  fontSize: { xs: "0.6rem", md: "0.75rem" },
                }}
              >
                {notif.icon}
                {notif.message}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Paper
        sx={{ p: 4, mb: 6, mt: 1, border: "1px solid", borderColor: "divider" }}
      >
        {/* Charts Section */}
        <Grid container spacing={2} mb={4}>
          {/* Line Chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h7" fontWeight={600} mb={1}>
                Monthly Applications
              </Typography>
              <ResponsiveContainer width="100%" height={236}>
                <LineChart data={graphLineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#1976d2"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Pie Chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <Typography fontWeight={600} mb={2}>
                Institute By Sector
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ width: "60%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ percent }) =>
                          `${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "none",
                          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                <Box
                  sx={{
                    width: "40%",
                    pl: 2,
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {pieData.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                        fontSize: 13,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: COLORS[index % COLORS.length],
                          mr: 1,
                        }}
                      />
                      {item.name}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Bar Chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 2 }, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h7" fontWeight={600} mb={1}>
                Institute By Dzongkhang Location
              </Typography>
              <ResponsiveContainer width="100%" height={236}>
                <BarChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill={theme.palette.primary.main}
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* -------------------- Tables Section -------------------- */}
        <Grid container spacing={2}>
          {/* Course Announcements - Imported Component */}
          <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
            <CourseTraineeAnnouncementsIndex />
          </Grid>

          {/* TVET Indicators */}
          <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
            <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography fontWeight={600} sx={{ mb: 2 }}>
                TVET Indicators
              </Typography>

              <TableContainer>
                <Table size="small" sx={tableStyle}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>TTI/Govt</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Pvt/Others</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {tvetIndicators
                      .slice(
                        infoPage * infoRowsPerPage,
                        infoPage * infoRowsPerPage + infoRowsPerPage,
                      )
                      .map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.ttiGovt ?? 0}</TableCell>
                          <TableCell>{row.pvtOthers ?? 0}</TableCell>
                          <TableCell>{row.total ?? 0}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={tvetIndicators.length}
                page={infoPage}
                onPageChange={(e, newPage) => setInfoPage(newPage)}
                rowsPerPage={infoRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setInfoRowsPerPage(parseInt(e.target.value, 10));
                  setInfoPage(0);
                }}
                rowsPerPageOptions={[5, 10]}
              />
            </Paper>
          </Grid>

          {/* Courses */}
          <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
            <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography fontWeight={600} sx={{ mb: 2 }}>
                Recent Ongoing Course Details
              </Typography>

              <TableContainer>
                <Table size="small" sx={tableStyle}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Certification</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Application Date</TableCell>
                      <TableCell>Course Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOngoingCourses
                      .slice(
                        coursePage * courseRowsPerPage,
                        coursePage * courseRowsPerPage + courseRowsPerPage,
                      )
                      .map((course, index) => (
                        <TableRow key={index}>
                          <TableCell>{course.course}</TableCell>
                          <TableCell>{course.certification}</TableCell>
                          <TableCell>
                            <Chip
                              label={course.status}
                              size="small"
                              color={
                                course.status === "ONGOING"
                                  ? "warning"
                                  : course.status === "COMPLETED"
                                    ? "success"
                                    : "error"
                              }
                            />
                          </TableCell>
                          <TableCell>{course.applicationDate}</TableCell>
                          <TableCell>{course.courseDate}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={recentOngoingCourses.length}
                page={coursePage}
                onPageChange={(e, newPage) => setCoursePage(newPage)}
                rowsPerPage={courseRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setCourseRowsPerPage(parseInt(e.target.value, 10));
                  setCoursePage(0);
                }}
                rowsPerPageOptions={[5, 10]}
              />
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 500 }}>Application Details</DialogTitle>
        <DialogContent dividers>
          <Box>
            <TableContainer component={Paper}>
              <Table sx={{ borderCollapse: "collapse", width: "100%" }}>
                <TableHead>
                  <TableRow>
                    {[
                      "Application No",
                      "Name",
                      "Location",
                      "Service",
                      "Status",
                    ].map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: 550,
                          textAlign: "center",
                          border: "1px solid #000",
                          py: 1,
                          fontSize: "0.875rem",
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedApplication ? (
                    <TableRow hover>
                      {[
                        "application_no",
                        "name",
                        "location",
                        "service",
                        "status",
                      ].map((key) => (
                        <TableCell
                          key={key}
                          sx={{
                            textAlign: "center",
                            py: 1.25,
                            fontSize: "0.85rem",
                            border: "1px solid #000",
                          }}
                        >
                          {key === "status" ? (
                            <Box
                              component="span"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                color: "#fff",
                                backgroundColor: getStatusColor(
                                  selectedApplication[key],
                                ),
                                textTransform: "capitalize",
                              }}
                            >
                              {selectedApplication[key]}
                            </Box>
                          ) : (
                            selectedApplication[key]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{
                          textAlign: "center",
                          py: 3,
                          color: "error.main",
                          fontWeight: 500,
                          border: "1px solid #000",
                        }}
                      >
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3 }}>
          <Button
            onClick={() => setOpenModal(false)}
            variant="contained"
            color="error"
            startIcon={<CloseFullscreenIcon />}
            size="small"
            sx={{
              borderWidth: 1,
              px: 2,
              py: 0.5,
              fontSize: "0.75rem",
              "&:hover": {
                backgroundColor: "error.main",
                color: "#fff",
              },
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
