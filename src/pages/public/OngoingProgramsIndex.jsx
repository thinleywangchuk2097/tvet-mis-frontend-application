import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/internal/common/CommonService";

// ── Shared table styles
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
      console.log("Ongoing Courses:", response.data);
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
      // Fetch certification levels (parentId 10)
      const levelsResponse = await CommonService.getByParentId(10);
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

  // Helper function to get certification level name by ID
  const getCertificationLevelName = (levelId) => {
    if (!levelId) return "N/A";
    const level = certificationLevels.find(
      (l) => parseInt(l.id) === parseInt(levelId),
    );
    return level ? level.name : levelId;
  };

  // Helper function to get dzongkhag name by ID
  const getDzongkhagName = (locationId) => {
    if (!locationId) return "N/A";
    const dzongkhag = dzongkhags.find(
      (dzong) => parseInt(dzong.id) === parseInt(locationId),
    );
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  // Filtering logic
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

  const handleReset = () => {
    setSearchText("");
    setCertificateLevelFilter("");
    setLocationFilter("");
    setProgPage(0);
  };

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
          sx={{ color: "error.main", fontWeight: 600, fontSize: "0.9rem" }}
        >
          Unable to connect to the server
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#666", mt: 1, display: "block" }}
        >
          Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
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
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Ongoing courses with training locations
          </Typography>
        </Box>
      </Stack>

      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Search */}
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

        {/* Certificate Level Filter */}
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

        {/* Reset Button */}
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
            sx={{ height: 40 }}
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
                    <TableCell sx={{ fontWeight: 600, color: "#0a1929" }}>
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
                  colSpan={6}
                  align="center"
                  sx={{ color: "error.main", fontWeight: 600 }}
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
