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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CommonService from "../../api/services/CommonService";

const CourseTraineeAnnouncementsIndex = () => {
  const navigate = useNavigate();
  const [appPage, setAppPage] = useState(0);
  const [appRowsPerPage, setAppRowsPerPage] = useState(5);
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [courseDateFilter, setCourseDateFilter] = useState("");
  const [courseAnnouncementDetails, setCourseAnnouncementDetails] = useState([]);
  
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
      // Fetch certification levels (parentId 10)
      const levelsResponse = await CommonService.getByParentId(10);
      setCertificationLevels(levelsResponse.data);

      // Fetch funding sources (parentId 16)
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

  // Helper function to get certification level name by ID
  const getCertificationLevelName = (levelId) => {
    if (!levelId) return "N/A";
    const level = certificationLevels.find((l) => parseInt(l.id) === parseInt(levelId));
    return level ? level.name : levelId;
  };

  // Helper function to get funding source name by ID
  const getFundingSourceName = (sourceId) => {
    if (!sourceId) return "N/A";
    const source = fundingSources.find((s) => parseInt(s.id) === parseInt(sourceId));
    return source ? source.name : sourceId;
  };

  // Helper function to get dzongkhag name by ID
  const getDzongkhagName = (locationId) => {
    if (!locationId) return "N/A";
    const dzongkhag = dzongkhags.find(
      (dzong) => parseInt(dzong.id) === parseInt(locationId)
    );
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  // Get unique course dates for filter
  const courseDates = useMemo(() => {
    const dates = courseAnnouncementDetails.map((app) => app.course_start_date?.split(' ')[0]);
    return [...new Set(dates)].filter(date => date);
  }, [courseAnnouncementDetails]);

  // Filtering logic
  const filteredApplications = useMemo(() => {
    return courseAnnouncementDetails.filter((app) => {
      const courseStartDate = app.course_start_date?.split(' ')[0] || "";
      
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

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  // Style for TextField to remove hover effects
  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      "&:hover fieldset": {
        borderColor: "rgba(0, 0, 0, 0.23)",
      },
    },
  };

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
      <Typography
        fontWeight={600}
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <NotificationsActiveIcon />
        Course Announcements
      </Typography>

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
            sx={textFieldStyle}
          />
        </Grid>

        {/* Location Filter - Using Dzongkhags */}
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
            <MenuItem value="">All</MenuItem>
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
            <MenuItem value="">All</MenuItem>
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
            onClick={() => {
              setSearchText("");
              setLocationFilter("");
              setCourseDateFilter("");
              setAppPage(0);
            }}
            sx={{ height: 40 }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>

      <TableContainer>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>Application No</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Certification Level</TableCell>
              <TableCell>Funding Source</TableCell>
              <TableCell>Course Fee</TableCell>
              <TableCell>Application Period</TableCell>
              <TableCell>Course Period</TableCell>
              <TableCell>Total Trainees</TableCell>
              <TableCell>Description</TableCell>
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
                .map((app) => (
                  <TableRow key={app.application_no} hover>
                    <TableCell>{app.application_no}</TableCell>
                    <TableCell>{app.course_name || "N/A"}</TableCell>
                    <TableCell>{getDzongkhagName(app.training_location_id)}</TableCell>
                    <TableCell>{getCertificationLevelName(app.certification_level_id)}</TableCell>
                    <TableCell>{getFundingSourceName(app.funding_source_id)}</TableCell>
                    <TableCell>Nu. {app.course_fee}</TableCell>
                    <TableCell>
                      {app.application_start_date && app.application_end_date
                        ? `${new Date(app.application_start_date).toLocaleDateString()} - ${new Date(app.application_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {app.course_start_date && app.course_end_date
                        ? `${new Date(app.course_start_date).toLocaleDateString()} - ${new Date(app.course_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{app.total_no_trainees}</TableCell>
                    <TableCell>
                      {app.course_description?.length > 50
                        ? `${app.course_description.substring(0, 50)}...`
                        : app.course_description || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<ArrowUpwardIcon fontSize="small" />}
                        label="Apply"
                        size="small"
                        color="primary"
                        onClick={() =>
                          navigate(`/course/apply-course/${app.application_no}`)
                        }
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 3,
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
                  colSpan={11}
                  align="center"
                  sx={{ color: "red", fontWeight: 600 }}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
      />
    </Paper>
  );
};

export default CourseTraineeAnnouncementsIndex;