import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Divider,
  TablePagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToExcel } from "@/utils/exportExcel";
import { useSelector } from "react-redux";
import {
  generateAssessmentCertificatePdf,
  generateAllAssessmentCertificatesPdf
} from "@/utils/assessmentCertificatePdf";
import CertificationService from "../../api/services/internal/certification/CertificationService";

const CertificateIndex = () => {
  const [filters, setFilters] = useState({
    programType: "",
    courseType: "",
    courseStartDate: "",
    courseEndDate: "",
    applicationNo: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [courseList, setCourseList] = useState([]);
  const [filteredCourseList, setFilteredCourseList] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);

  // Program types
  const programTypes = [
    { id: "BQF", label: "BQF Program" },
    { id: "NON_BQF", label: "Non BQF Program" },
    { id: "RPL", label: "RPL Program" },
  ];

  // Sample course data with program type mapping and dates
  const courseData = [
    // BQF Programs
    { 
      id: 1, 
      course_name: "Excavator Operator", 
      program_type: "BQF",
      start_date: "2026-01-15",
      end_date: "2026-03-15"
    },
    { 
      id: 2, 
      course_name: "Crane Operator", 
      program_type: "BQF",
      start_date: "2026-02-01",
      end_date: "2026-04-01"
    },
    { 
      id: 3, 
      course_name: "Forklift Operator", 
      program_type: "BQF",
      start_date: "2026-03-01",
      end_date: "2026-05-01"
    },
    // Non BQF Programs
    { 
      id: 4, 
      course_name: "Basic Computer Skills", 
      program_type: "NON_BQF",
      start_date: "2026-01-20",
      end_date: "2026-02-20"
    },
    { 
      id: 5, 
      course_name: "English Language", 
      program_type: "NON_BQF",
      start_date: "2026-02-15",
      end_date: "2026-04-15"
    },
    { 
      id: 6, 
      course_name: "Accounting Basics", 
      program_type: "NON_BQF",
      start_date: "2026-03-10",
      end_date: "2026-05-10"
    },
    // RPL Programs
    { 
      id: 7, 
      course_name: "RPL Construction", 
      program_type: "RPL",
      start_date: "2026-01-10",
      end_date: "2026-03-10"
    },
    { 
      id: 8, 
      course_name: "RPL Hospitality", 
      program_type: "RPL",
      start_date: "2026-02-20",
      end_date: "2026-04-20"
    },
    { 
      id: 9, 
      course_name: "RPL Agriculture", 
      program_type: "RPL",
      start_date: "2026-03-15",
      end_date: "2026-05-15"
    },
  ];

  console.log("token", access_token)

  useEffect(() => {
    fetchAssessmentCourses();
  }, []);

  // Filter courses when program type changes
  useEffect(() => {
    if (filters.programType) {
      const filtered = courseData.filter(
        course => course.program_type === filters.programType
      );
      setFilteredCourseList(filtered);
      // Reset course type when program type changes
      setFilters(prev => ({
        ...prev,
        courseType: "",
      }));
    } else {
      setFilteredCourseList([]);
      setFilters(prev => ({
        ...prev,
        courseType: "",
      }));
    }
  }, [filters.programType]);

  const fetchAssessmentCourses = async () => {
    try {
      // If you want to fetch from API instead of using static data
      // const courseLists = await CertificationService.getAssessmentCourses(access_token);
      // console.log("courseList", courseLists.data);
      // setCourseList(courseLists.data);
      
      // Using static data for now
      setCourseList(courseData);
      setFilteredCourseList(courseData);
    } catch (error) {
      console.error("Error fetching Course:", error);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleExcel = () => {
    const data = filteredReports.map((item, index) => ({
      SlNo: index + 1,
      Name: item.name,
      CID: item.cid,
      Gender: item.gender,
      ProgramType: item.programType,
      Course: item.course,
      CourseStartDate: item.courseStartDate,
      CourseEndDate: item.courseEndDate,
      Certificate: item.certificate,
      Internal: item.internal,
      Theory: item.theory,
      Practical: item.practical,
      Result: item.result,
    }));

    exportToExcel(data, `Assessment_Result_${today}`);
  };

  // Certificate PDF
  const handlePdf = (report) => {
    generateAssessmentCertificatePdf(report);
  };

  // Certificate PDF for All
  const handleDownloadAll = () => {
    generateAllAssessmentCertificatesPdf(filteredReports);
  };

  // Sample report data with program type and dates
  const [reports] = useState([
    {
      id: 1,
      name: "Pema Dorji",
      cid: "1160400783",
      gender: "M",
      programType: "BQF",
      course: "Excavator Operator",
      courseStartDate: "2026-01-15",
      courseEndDate: "2026-03-15",
      certificate: "BQF Certificate 2",
      internal: "Competent",
      theory: "Competent",
      practical: "Competent",
      result: "Competent",
    },
    {
      id: 2,
      name: "Tashi",
      cid: "1160400909",
      gender: "M",
      programType: "BQF",
      course: "Excavator Operator",
      courseStartDate: "2026-01-15",
      courseEndDate: "2026-03-15",
      certificate: "BQF Certificate 2",
      internal: "Competent",
      theory: "Competent",
      practical: "Competent",
      result: "Competent",
    },
    {
      id: 3,
      name: "Pema Lhamo",
      cid: "1160400783",
      gender: "F",
      programType: "NON_BQF",
      course: "Basic Computer Skills",
      courseStartDate: "2026-01-20",
      courseEndDate: "2026-02-20",
      certificate: "Certificate of Completion",
      internal: "Competent",
      theory: "Not Competent",
      practical: "Competent",
      result: "Not Competent",
    },
    {
      id: 4,
      name: "Wahgchuk Pemo",
      cid: "189700202",
      gender: "F",
      programType: "RPL",
      course: "RPL Construction",
      courseStartDate: "2026-01-10",
      courseEndDate: "2026-03-10",
      certificate: "RPL Certificate",
      internal: "Competent",
      theory: "Competent",
      practical: "Competent",
      result: "Competent",
    },
    {
      id: 5,
      name: "Sonam Dorji",
      cid: "1160400123",
      gender: "M",
      programType: "NON_BQF",
      course: "English Language",
      courseStartDate: "2026-02-15",
      courseEndDate: "2026-04-15",
      certificate: "Certificate of Completion",
      internal: "Competent",
      theory: "Competent",
      practical: "Competent",
      result: "Competent",
    },
  ]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      programType: "",
      courseType: "",
      courseStartDate: "",
      courseEndDate: "",
      applicationNo: "",
      search: "",
    });
    setFilteredCourseList([]);
    setPage(0); // Reset to first page when clearing filters
  };

  // Filter reports based on selected filters
  const filteredReports = reports.filter((report) => {
    const matchesProgramType = filters.programType === "" || report.programType === filters.programType;
    const matchesCourseType = filters.courseType === "" || report.course === filters.courseType;
    const matchesApplicationNo = filters.applicationNo === "" || report.applicationNo === filters.applicationNo;
    
    // Date filtering
    let matchesStartDate = true;
    let matchesEndDate = true;
    
    if (filters.courseStartDate) {
      matchesStartDate = report.courseStartDate >= filters.courseStartDate;
    }
    if (filters.courseEndDate) {
      matchesEndDate = report.courseEndDate <= filters.courseEndDate;
    }
    
    const matchesSearch = filters.search === "" ||
      report.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.course.toLowerCase().includes(filters.search.toLowerCase());

    return matchesProgramType && matchesCourseType && matchesApplicationNo && 
           matchesStartDate && matchesEndDate && matchesSearch;
  });

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated reports
  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Assessment Certificate
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Program Type</InputLabel>
            <Select
              name="programType"
              value={filters.programType}
              onChange={handleFilterChange}
              label="Program Type"
            >
              <MenuItem value="">-Select-</MenuItem>
              {programTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Course</InputLabel>
            <Select
              name="courseType"
              value={filters.courseType}
              onChange={handleFilterChange}
              label="Course"
              disabled={!filters.programType}
            >
              <MenuItem value="">-Select-</MenuItem>
              {filteredCourseList.map((course) => (
                <MenuItem key={course.id} value={course.course_name}>
                  {course.course_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            label="Course Start Date"
            type="date"
            name="courseStartDate"
            value={filters.courseStartDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            label="Course End Date"
            type="date"
            name="courseEndDate"
            value={filters.courseEndDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            label="Application No"
            type="number"
            name="applicationNo"
            value={filters.applicationNo}
            onChange={handleFilterChange}
            size="small"
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={filteredReports.length === 0}
              fullWidth
              onClick={handleExcel}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Divider after filters */}
      <Divider sx={{ my: 2 }} />

      {/* Search - Right aligned */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search reports..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Reports Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": {
              border: "1px solid #ccc",
              padding: "8px",
            },
          }}
        >
          <TableHead>
            <TableRow sx={{
              background: "#f5f5f5",
              "& .MuiTableCell-root": {
                fontWeight: "bold",
              },
            }}>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID/Reference No</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Program Type</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Course Start Date</TableCell>
              <TableCell>Course End Date</TableCell>
              <TableCell>Certificate</TableCell>
              <TableCell>Internal</TableCell>
              <TableCell>Theory</TableCell>
              <TableCell>Practical</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadAll}
                  sx={{ textTransform: "none", fontWeight: "bold" }}
                >
                  Download All
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow key={report.id} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.cid}</TableCell>
                  <TableCell>{report.gender}</TableCell>
                  <TableCell>{report.programType}</TableCell>
                  <TableCell>{report.course}</TableCell>
                  <TableCell>{report.courseStartDate}</TableCell>
                  <TableCell>{report.courseEndDate}</TableCell>
                  <TableCell>{report.certificate}</TableCell>
                  <TableCell>{report.internal}</TableCell>
                  <TableCell>{report.theory}</TableCell>
                  <TableCell>{report.practical}</TableCell>
                  <TableCell>{report.result}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handlePdf(report)}
                      sx={{ textTransform: "none" }}
                    >
                      Certificate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                  No reports found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Divider before pagination */}
      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedReports.length} of {filteredReports.length} reports
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            ".MuiTablePagination-select": {
              borderRadius: 1,
            },
            ".MuiTablePagination-displayedRows": {
              margin: 0,
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default CertificateIndex;