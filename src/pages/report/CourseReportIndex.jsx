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
import ReportService from "../../api/services/internal/report/ReportService";
import CommonService from "../../api/services/internal/common/CommonService";

const CourseReportIndex = () => {
  const [filters, setFilters] = useState({
    reportType: "",
    instituteType: "",
    institute: "",
    filterYearBy: "",
    year: "",
    financialYear: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [courseTypes, setCourseTypes] = useState([]);
  const [institutesTypes, setInstitutesTypes] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    fetchCourseTypes();
    fetchInstituteTypes();
    fetchInstitutes();
    fetchCourseData();
  }, []);

  // Apply all filters whenever any filter changes
  useEffect(() => {
    applyAllFilters();
  }, [
    filters.reportType,
    filters.instituteType,
    filters.institute,
    filters.search,
    filters.filterYearBy,
    filters.year,
    filters.financialYear,
    filters.startDate,
    filters.endDate,
    allCourses,
    courseTypes,
  ]);

  const fetchCourseTypes = async () => {
    try {
      const response = await ReportService.courseServiceType(access_token);
      setCourseTypes(response.data);
      console.log("Course Types:", response.data);
    } catch (error) {
      console.error("Error fetching course types:", error);
    }
  };

  const fetchInstituteTypes = async () => {
    try {
      const response = await CommonService.getByParentId(23);
      setInstitutesTypes(response.data);
      console.log("Institute Types:", response.data);
    } catch (error) {
      console.error("Error fetching institute types:", error);
    }
  };

  const fetchInstitutes = async () => {
    try {
      const response = await ReportService.getAllInstitutes(access_token);
      setInstitutes(response.data);
      console.log("Institutes:", response.data);
    } catch (error) {
      console.error("Error fetching institutes:", error);
    }
  };

  const fetchCourseData = async () => {
    try {
      const response = await ReportService.getcourseData(access_token);
      setAllCourses(response.data);
      console.log("All Courses Data:", response.data);
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  // Apply all filters together
  const applyAllFilters = () => {
    let result = [...allCourses];

    // Filter by Report Type (Course Type)
    if (filters.reportType) {
      const selectedReportType = courseTypes.find(
        (type) => type.service_name === filters.reportType,
      );
      if (selectedReportType) {
        result = result.filter(
          (course) => course.service_id === selectedReportType.id,
        );
      }
    } else {
      // If no report type selected, show empty
      setFilteredCourses([]);
      return;
    }

    // Filter by Institute Type
    if (filters.instituteType) {
      const instituteTypeId = parseInt(filters.instituteType);
      // Get all institute IDs that match the institute type
      const instituteIds = institutes
        .filter((inst) => inst.institute_type_id === instituteTypeId)
        .map((inst) => inst.institute_id);

      result = result.filter((course) =>
        instituteIds.includes(parseInt(course.institute_id)),
      );
    }

    // Filter by specific Institute
    if (filters.institute) {
      const selectedInstitute = institutes.find(
        (inst) => inst.proposed_institute_name === filters.institute,
      );
      if (selectedInstitute) {
        result = result.filter(
          (course) =>
            parseInt(course.institute_id) === selectedInstitute.institute_id,
        );
      }
    }

    // Filter by Search (Course Name)
    if (filters.search) {
      result = result.filter((course) =>
        course.course_name.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    // Filter by Date/Year
    if (filters.filterYearBy) {
      result = result.filter((course) => {
        const courseStartDate = course.course_start_date;
        if (!courseStartDate) return false;

        const courseDate = new Date(courseStartDate);
        const courseYear = courseDate.getFullYear();
        const courseFinancialYear = `${courseYear}-${courseYear + 1}`;

        switch (filters.filterYearBy) {
          case "Date":
            if (filters.startDate && courseStartDate < filters.startDate)
              return false;
            if (filters.endDate && courseStartDate > filters.endDate)
              return false;
            return true;
          case "Financial Year":
            if (
              filters.financialYear &&
              courseFinancialYear !== filters.financialYear
            )
              return false;
            return true;
          case "Year":
            if (filters.year && courseYear !== parseInt(filters.year))
              return false;
            return true;
          default:
            return true;
        }
      });
    }

    // Transform the filtered courses to report format
    const formattedReports = result.map((course) => ({
      id: course.course_id,
      name: course.course_name,
      course_name: course.course_name,
      type: filters.reportType || getReportTypeName(course.service_id),
      report_type: filters.reportType || getReportTypeName(course.service_id),
      service_id: course.service_id,
      institute_id: course.institute_id,
      institute: getInstituteName(course.institute_id),
      institute_name: getInstituteName(course.institute_id),
      institute_type: getInstituteTypeByInstituteId(course.institute_id),
      instituteType: getInstituteTypeByInstituteId(course.institute_id),
      institute_type_id: getInstituteTypeIdByInstituteId(course.institute_id),
      status: getStatusName(course.status_id),
      status_id: course.status_id,
      courseStartDate: course.course_start_date,
      start_date: course.course_start_date,
      courseEndDate: course.course_end_date,
      end_date: course.course_end_date,
      duration: calculateDuration(
        course.course_start_date,
        course.course_end_date,
      ),
      application_no: course.application_no,
      total_no_trainees: course.total_no_trainees,
      course_fee: course.course_fee,
      application_start_date: course.application_start_date,
      application_end_date: course.application_end_date,
    }));

    setFilteredCourses(formattedReports);
    setPage(0);
  };

  const getReportTypeName = (serviceId) => {
    const courseType = courseTypes.find((type) => type.id === serviceId);
    return courseType ? courseType.service_name : "Unknown";
  };

  const getInstituteName = (instituteId) => {
    const institute = institutes.find(
      (inst) => inst.institute_id === parseInt(instituteId),
    );
    return institute ? institute.proposed_institute_name : "N/A";
  };

  const getInstituteTypeByInstituteId = (instituteId) => {
    const institute = institutes.find(
      (inst) => inst.institute_id === parseInt(instituteId),
    );
    if (institute && institute.institute_type_id) {
      const instituteType = institutesTypes.find(
        (type) => type.id === institute.institute_type_id,
      );
      return instituteType ? instituteType.name : "N/A";
    }
    return "N/A";
  };

  const getInstituteTypeIdByInstituteId = (instituteId) => {
    const institute = institutes.find(
      (inst) => inst.institute_id === parseInt(instituteId),
    );
    return institute ? institute.institute_type_id : null;
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }
  };

  const getStatusName = (statusId) => {
    const statusMap = {
      55: "Active",
      56: "Inactive",
      57: "Pending",
      58: "Approved",
      59: "Rejected",
      60: "Completed",
    };
    return statusMap[statusId] || "Unknown";
  };

  const reportTypes = courseTypes.map((type) => ({
    id: type.id,
    name: type.service_name,
  }));

  const instituteTypesList = institutesTypes.map((type) => ({
    id: type.id,
    name: type.name,
  }));

  const filterYearByOptions = [
    { id: 1, name: "Date" },
    { id: 2, name: "Financial Year" },
    { id: 3, name: "Year" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i,
  );

  const currentYear = new Date().getFullYear();
  const financialYears = Array.from({ length: 7 }, (_, i) => {
    const startYear = currentYear - 3 + i;
    return `${startYear}-${startYear + 1}`;
  });

  // Filter institutes based on selected institute type for dropdown
  const institutesForDropdown = filters.instituteType
    ? institutes.filter(
        (inst) => inst.institute_type_id === parseInt(filters.instituteType),
      )
    : institutes;

  const today = new Date().toISOString().split("T")[0];

  const handleExcelExport = () => {
    const data = filteredCourses.map((item, index) => ({
      SlNo: index + 1,
      CourseName: item.course_name,
      ReportType: item.type,
      InstituteType: item.institute_type,
      Institute: item.institute,
      Status: item.status,
      CourseStartDate: item.courseStartDate
        ? new Date(item.courseStartDate).toLocaleDateString()
        : "N/A",
      CourseEndDate: item.courseEndDate
        ? new Date(item.courseEndDate).toLocaleDateString()
        : "N/A",
      Duration: item.duration,
      ApplicationNo: item.application_no,
      TotalTrainees: item.total_no_trainees,
      CourseFee: item.course_fee,
    }));

    exportToExcel(data, `Course_Reports_${today}`);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "instituteType" && { institute: "" }),
      ...(name === "filterYearBy" && {
        year: "",
        financialYear: "",
        startDate: "",
        endDate: "",
      }),
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      reportType: "",
      instituteType: "",
      institute: "",
      filterYearBy: "",
      year: "",
      financialYear: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setFilteredCourses([]);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedReports = filteredCourses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const renderDateYearFields = () => {
    switch (filters.filterYearBy) {
      case "Date":
        return (
          <>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Start Date (From)"
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="End Date (To)"
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        );
      case "Financial Year":
        return (
          <Grid item size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Financial Year</InputLabel>
              <Select
                name="financialYear"
                value={filters.financialYear}
                onChange={handleFilterChange}
                label="Financial Year"
              >
                <MenuItem value="">Select Financial Year</MenuItem>
                {financialYears.map((fy) => (
                  <MenuItem key={fy} value={fy}>
                    {fy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        );
      case "Year":
        return (
          <Grid item size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                label="Year"
              >
                <MenuItem value="">Select Year</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Course Reports
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Report Type</InputLabel>
            <Select
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              label="Report Type"
            >
              <MenuItem value="">-Select report type-</MenuItem>
              {reportTypes.map((type) => (
                <MenuItem key={type.id} value={type.name}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Institute Type</InputLabel>
            <Select
              name="instituteType"
              value={filters.instituteType}
              onChange={handleFilterChange}
              label="Institute Type"
              disabled={!filters.reportType}
            >
              <MenuItem value="">--Select Institute Type--</MenuItem>
              {instituteTypesList.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Institute</InputLabel>
            <Select
              name="institute"
              value={filters.institute}
              onChange={handleFilterChange}
              label="Institute"
              disabled={!filters.instituteType}
            >
              <MenuItem value="">--Select Institute--</MenuItem>
              {institutesForDropdown.map((inst) => (
                <MenuItem
                  key={inst.institute_id}
                  value={inst.proposed_institute_name}
                >
                  {inst.proposed_institute_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter Year By</InputLabel>
            <Select
              name="filterYearBy"
              value={filters.filterYearBy}
              onChange={handleFilterChange}
              label="Filter Year By"
              disabled={!filters.reportType}
            >
              <MenuItem value="">Select Filter Type</MenuItem>
              {filterYearByOptions.map((option) => (
                <MenuItem key={option.id} value={option.name}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {renderDateYearFields()}

        <Grid item size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={filteredCourses.length === 0}
              fullWidth
              onClick={handleExcelExport}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search by course name..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            disabled={!filters.reportType}
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
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Report Type</TableCell>
              <TableCell>Institute Type</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Course Start Date</TableCell>
              <TableCell>Course End Date</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow key={`${report.id}_${index}`} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{report.course_name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.institute_type}</TableCell>
                  <TableCell>{report.institute}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        backgroundColor:
                          report.status === "Approved"
                            ? "#e8f5e9"
                            : report.status === "Pending"
                              ? "#fff3e0"
                              : report.status === "Completed"
                                ? "#e3f2fd"
                                : report.status === "Rejected"
                                  ? "#ffebee"
                                  : "#f5f5f5",
                        color:
                          report.status === "Approved"
                            ? "#2e7d32"
                            : report.status === "Pending"
                              ? "#ed6c02"
                              : report.status === "Completed"
                                ? "#1565c0"
                                : report.status === "Rejected"
                                  ? "#d32f2f"
                                  : "#000",
                      }}
                    >
                      {report.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {report.courseStartDate
                      ? new Date(report.courseStartDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.courseEndDate
                      ? new Date(report.courseEndDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{report.duration}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  {!filters.reportType
                    ? "Please select a report type to view courses"
                    : filteredCourses.length === 0
                      ? "No courses found matching your filters"
                      : `No courses found for "${filters.reportType}"`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedReports.length} of {filteredCourses.length} course
          reports
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Paper>
  );
};

export default CourseReportIndex;
