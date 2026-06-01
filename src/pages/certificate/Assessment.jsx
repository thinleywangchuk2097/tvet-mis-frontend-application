import React, { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
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
import ExportButtons from "@/components/common/ExportButtons";
import { exportToExcel } from "@/utils/exportExcel";
import { useSelector } from "react-redux";

import {
  generateAssessmentCertificatePdf,
  generateAllAssessmentCertificatesPdf
} from "@/utils/assessmentCertificatePdf";
import CertificationService from "../../api/services/internal/certification/CertificationService";

const Assessment = () => {
  const [filters, setFilters] = useState({
    // instituteList: "",
    //courseList: "",
    ApplicationNo: "",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [instituteId, setInstituteId] = useState("");
  const [instituteList, setInstituteList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);

  console.log("token", access_token)
  useEffect(() => {
    fetchAssessmentInstitutes();
  }, []);

  useEffect(() => {
    fetchAssessmentCourses();
  }, [instituteId]);

  const fetchAssessmentInstitutes = async () => {
    try {
      const instituteLists = await CertificationService.getAssessmentInstitutes(access_token);
      //console.log("Ass Ins List", instituteLists.data);
      setInstituteList(instituteLists.data);
    } catch (error) {
      console.error("Error fetching Institute:", error);
    }
  };

  const fetchAssessmentCourses = async () => {
    try {
      const courseLists = await CertificationService.getAssessmentCourses(instituteId, access_token);
      console.log("instituteId", courseLists.data);
      setCourseList(courseLists.data);
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
      Course: item.course,
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



  // Sample report data
  const [reports] = useState([
    {
      id: 1,
      name: "Pema Dorji",
      cid: "1160400783",
      gender: "M",
      course: "Excavator Operator",
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
      course: "Excavator Operator",
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
      course: "Excavator Operator",
      certificate: "BQF Certificate 2",
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
      course: "Excavator Operator",
      certificate: "BQF Certificate 2",
      internal: "Competent",
      theory: "Competent",
      practical: "Competent",
      result: "Competent",
    },
  ]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setInstituteId(value);
    console.log(value);
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      instituteList: "",
      courseList: "",
      applicatioNo: "",
      search: "",
    });
    setPage(0); // Reset to first page when clearing filters
  };

  // Filter reports based on selected filters
  const filteredReports = reports.filter((report) => {
    return (
      (filters.instituteList === "" || report.type === filters.instituteList) &&
      (filters.courseList === "" || report.courseList === filters.courseList) &&
      (filters.applicatioNo === "" || report.applicatioNo === filters.applicatioNo) &&
      (filters.search === "" ||
        report.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.courseList.toLowerCase().includes(filters.search.toLowerCase()))
    );
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

  // Download report
  const handleDownload = (reportId) => {
    console.log(`Downloading report ${reportId}`);
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Assessment Certificate
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Institute</InputLabel>
            <Select
              name="instituteId"
              value={filters.instituteList}
              onChange={handleFilterChange}
              label="Institute Name"
            >
              <MenuItem value="">-Select-</MenuItem>
              {
                instituteList.map((ins) => (
                  <MenuItem key={ins.instituteId} value={ins.institute_id}>
                    {ins.proposed_institute_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Course</InputLabel>
            <Select
              name="courseList"
              value={filters.courseList}
              onChange={handleFilterChange}
              label="Course"
            >
              <MenuItem value="">-select-</MenuItem>
              {Array.isArray(courseList) &&
                courseList.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.course_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            label={
              <span>
                Appication No{" "}
              </span>
            }
            type="number"
            name="Application"
            size="small"
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 2 }}>
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
              <TableCell>Course</TableCell>
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
                  sx={{ textTransform: "none", fontWeight: "bold", }}
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
                  <TableCell>{report.course}</TableCell>
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
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
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

export default Assessment;
