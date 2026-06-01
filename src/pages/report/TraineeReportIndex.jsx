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

const TraineeReportIndex = () => {
  const [filters, setFilters] = useState({
    instituteType: "",
    institute: "",
    course: "",
    filterYearBy: "",
    year: "",
    financialYear: "",
    courseStartDateFrom: "",
    courseEndDateFrom: "",
    search: "",
    status: "",
    qualification: "",
    certificateLevel: "", // Added certificate level filter
  });
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [institutesTypes, setInstitutesTypes] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [qualificationList, setQualificationList] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);

  useEffect(() => {
    fetchInstituteTypes();
    fetchInstitutes();
    fetchCourses();
    fetchStatusList();
    fetchQualificationList();
    fetchCertificateLevels();
    fetchTraineeData();
  }, []);

  useEffect(() => {
    applyAllFilters();
  }, [
    filters.instituteType,
    filters.institute,
    filters.course,
    filters.search,
    filters.filterYearBy,
    filters.year,
    filters.financialYear,
    filters.courseStartDateFrom,
    filters.courseEndDateFrom,
    filters.status,
    filters.qualification,
    filters.certificateLevel, // Added certificate level dependency
    allTrainees,
  ]);

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

  const fetchCourses = async () => {
    try {
      const response = await ReportService.getcourseData(access_token);
      setCourses(response.data);
      console.log("Courses:", response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchTraineeData = async () => {
    try {
      const response =
        await ReportService.getInstitutesTraineesDetails(access_token);
      setAllTrainees(response.data);
      console.log("Trainee Data:", response.data);
    } catch (error) {
      console.error("Error fetching trainee data:", error);
    }
  };

  const fetchStatusList = async () => {
    try {
      const response = await CommonService.getByParentId(4);
      setStatusList(response.data);
      console.log("Status List:", response.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchQualificationList = async () => {
    try {
      const response = await CommonService.getByParentId(18);
      setQualificationList(response.data);
      console.log("Qualification List:", response.data);
    } catch (error) {
      console.error("Error fetching qualification list:", error);
    }
  };

  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(10);
      setCertificateLevels(response.data);
      console.log("Certificate Levels:", response.data);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  };

  const applyAllFilters = () => {
    let result = [...allTrainees];

    if (filters.instituteType) {
      const instituteTypeId = parseInt(filters.instituteType);
      const instituteIds = institutes
        .filter((inst) => inst.institute_type_id === instituteTypeId)
        .map((inst) => inst.institute_id);

      result = result.filter((trainee) =>
        instituteIds.includes(parseInt(trainee.institute_id)),
      );
    }

    if (filters.institute) {
      const selectedInstitute = institutes.find(
        (inst) => inst.proposed_institute_name === filters.institute,
      );
      if (selectedInstitute) {
        result = result.filter(
          (trainee) =>
            parseInt(trainee.institute_id) === selectedInstitute.institute_id,
        );
      }
    }

    if (filters.course) {
      result = result.filter(
        (trainee) => trainee.course_name === filters.course,
      );
    }

    if (filters.status) {
      result = result.filter(
        (trainee) => trainee.status_id === parseInt(filters.status),
      );
    }

    if (filters.qualification) {
      result = result.filter(
        (trainee) =>
          trainee.academic_qualification_id === parseInt(filters.qualification),
      );
    }

    // Filter by Certificate Level
    if (filters.certificateLevel) {
      result = result.filter(
        (trainee) =>
          trainee.certification_level_id === parseInt(filters.certificateLevel),
      );
    }

    if (filters.search) {
      result = result.filter((trainee) =>
        (trainee.applicant_name || "")
          .toLowerCase()
          .includes(filters.search.toLowerCase()),
      );
    }

    if (filters.courseStartDateFrom) {
      result = result.filter((trainee) => {
        const courseStartDate = trainee.course_start_date;
        if (!courseStartDate) return false;
        return courseStartDate >= filters.courseStartDateFrom;
      });
    }

    if (filters.courseEndDateFrom) {
      result = result.filter((trainee) => {
        const courseEndDate = trainee.course_end_date;
        if (!courseEndDate) return false;
        return courseEndDate >= filters.courseEndDateFrom;
      });
    }

    if (filters.filterYearBy) {
      result = result.filter((trainee) => {
        const courseStartDate = trainee.course_start_date;
        if (!courseStartDate) return false;

        const courseDate = new Date(courseStartDate);
        const courseYear = courseDate.getFullYear();
        const courseFinancialYear = `${courseYear}-${courseYear + 1}`;

        switch (filters.filterYearBy) {
          case "Date":
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

    const formattedReports = result.map((trainee, index) => ({
      id: trainee.id,
      trainee_name: trainee.applicant_name,
      cid_no: trainee.cid_no,
      qualification: getQualificationName(trainee.academic_qualification_id),
      qualification_id: trainee.academic_qualification_id,
      certification_level: getCertificateLevelName(trainee.certification_level_id),
      certification_level_id: trainee.certification_level_id,
      institute_id: trainee.institute_id,
      institute: getInstituteName(trainee.institute_id),
      institute_name: getInstituteName(trainee.institute_id),
      institute_type: getInstituteTypeByInstituteId(trainee.institute_id),
      instituteType: getInstituteTypeByInstituteId(trainee.institute_id),
      institute_type_id: getInstituteTypeIdByInstituteId(trainee.institute_id),
      course_name: trainee.course_name,
      course_start_date: trainee.course_start_date,
      course_end_date: trainee.course_end_date,
      course_enrol_app_no: trainee.course_enrol_app_no,
      status: getTraineeStatusName(trainee.status_id),
      status_id: trainee.status_id,
      result_status: getTraineeStatusName(trainee.result_status_id),
      contact_no: trainee.mobile_no,
      email: trainee.email_id,
      certificate_no: trainee.certificate_no,
      application_no: trainee.application_no,
      internal_assessment: trainee.internal_assessment,
      theory_assessment: trainee.theory_assessment,
      practical_assessment: trainee.practical_assessment,
      viva_assessment: trainee.viva_assessment,
      total_marks: calculateTotalMarks(
        trainee.internal_assessment,
        trainee.theory_assessment,
        trainee.practical_assessment,
        trainee.viva_assessment,
      ),
      remarks: trainee.remarks,
    }));

    setFilteredTrainees(formattedReports);
    setPage(0);
  };

  const calculateTotalMarks = (internal, theory, practical, viva) => {
    const internalNum = parseFloat(internal) || 0;
    const theoryNum = parseFloat(theory) || 0;
    const practicalNum = parseFloat(practical) || 0;
    const vivaNum = parseFloat(viva) || 0;

    const total = internalNum + theoryNum + practicalNum + vivaNum;
    return total > 0 ? total.toString() : "N/A";
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

  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "N/A";
    const qualification = qualificationList.find(
      (item) => item.id === parseInt(qualificationId),
    );
    return qualification ? qualification.name : "N/A";
  };

  const getCertificateLevelName = (certificationLevelId) => {
    if (!certificationLevelId) return "N/A";
    const certificateLevel = certificateLevels.find(
      (item) => item.id === parseInt(certificationLevelId)
    );
    return certificateLevel ? certificateLevel.name : "N/A";
  };

  const getTraineeStatusName = (statusId) => {
    if (!statusId) return "N/A";
    const status = statusList.find((item) => item.id === parseInt(statusId));
    return status ? status.name : "N/A";
  };

  const getStatusColor = (statusName) => {
    const statusColorMap = {
      submitted: "#fff3e0",
      verified: "#e3f2fd",
      approved: "#e8f5e9",
      rejected: "#ffebee",
      endorsed: "#f3e5f5",
      "Forwarded to QAS Level 1": "#e0f2f1",
      "Forwarded to Level 2": "#e0f2f1",
      verified2: "#e3f2fd",
      pending: "#fff3e0",
      selected: "#e8f5e9",
      passed: "#e8f5e9",
      failed: "#ffebee",
    };
    return statusColorMap[statusName] || "#f5f5f5";
  };

  const getStatusTextColor = (statusName) => {
    const statusTextColorMap = {
      submitted: "#ed6c02",
      verified: "#1565c0",
      approved: "#2e7d32",
      rejected: "#d32f2f",
      endorsed: "#6a1b9a",
      "Forwarded to QAS Level 1": "#00695c",
      "Forwarded to Level 2": "#00695c",
      verified2: "#1565c0",
      pending: "#ed6c02",
      selected: "#2e7d32",
      passed: "#2e7d32",
      failed: "#d32f2f",
    };
    return statusTextColorMap[statusName] || "#000";
  };

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

  const institutesForDropdown = filters.instituteType
    ? institutes.filter(
        (inst) => inst.institute_type_id === parseInt(filters.instituteType),
      )
    : institutes;

  const coursesForDropdown = filters.institute
    ? courses.filter((course) => {
        const selectedInstitute = institutes.find(
          (inst) => inst.proposed_institute_name === filters.institute,
        );
        return (
          selectedInstitute &&
          parseInt(course.institute_id) === selectedInstitute.institute_id
        );
      })
    : courses;

  const today = new Date().toISOString().split("T")[0];

  const handleExcelExport = () => {
    const data = filteredTrainees.map((item, index) => ({
      SlNo: index + 1,
      TraineeName: item.trainee_name,
      CIDNo: item.cid_no,
      ContactNo: item.contact_no,
      Email: item.email,
      Qualification: item.qualification,
      CertificateLevel: item.certification_level,
      InstituteType: item.institute_type,
      Institute: item.institute,
      ApplicationNo: item.application_no,
      CourseName: item.course_name,
      CourseStartDate: item.course_start_date
        ? new Date(item.course_start_date).toLocaleDateString()
        : "N/A",
      CourseEndDate: item.course_end_date
        ? new Date(item.course_end_date).toLocaleDateString()
        : "N/A",
      Status: item.status,
      CertificateNo: item.certificate_no || "N/A",
      InternalAssessment: item.internal_assessment || "N/A",
      TheoryAssessment: item.theory_assessment || "N/A",
      PracticalAssessment: item.practical_assessment || "N/A",
      VivaAssessment: item.viva_assessment || "N/A",
      result_status: item.result_status,
      TotalMarks: item.total_marks,
      Remarks: item.remarks || "N/A",
    }));

    exportToExcel(data, `Trainee_Reports_${today}`);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "instituteType" && { institute: "", course: "" }),
      ...(name === "institute" && { course: "" }),
      ...(name === "filterYearBy" && {
        year: "",
        financialYear: "",
        courseStartDateFrom: "",
        courseEndDateFrom: "",
      }),
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      instituteType: "",
      institute: "",
      course: "",
      filterYearBy: "",
      year: "",
      financialYear: "",
      courseStartDateFrom: "",
      courseEndDateFrom: "",
      search: "",
      status: "",
      qualification: "",
      certificateLevel: "", // Added to clear
    });
    setFilteredTrainees([]);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedReports = filteredTrainees.slice(
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
                label="Course Start Date (From)"
                type="date"
                name="courseStartDateFrom"
                value={filters.courseStartDateFrom}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Course End Date (From)"
                type="date"
                name="courseEndDateFrom"
                value={filters.courseEndDateFrom}
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
        Trainee Reports
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Institute Type</InputLabel>
            <Select
              name="instituteType"
              value={filters.instituteType}
              onChange={handleFilterChange}
              label="Institute Type"
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
            <InputLabel>Course</InputLabel>
            <Select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              label="Course"
              disabled={!filters.institute}
            >
              <MenuItem value="">--Select Course--</MenuItem>
              {coursesForDropdown.map((course) => (
                <MenuItem key={course.course_id} value={course.course_name}>
                  {course.course_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="">--Select Status--</MenuItem>
              {statusList.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Qualification</InputLabel>
            <Select
              name="qualification"
              value={filters.qualification}
              onChange={handleFilterChange}
              label="Qualification"
            >
              <MenuItem value="">--Select Qualification--</MenuItem>
              {qualificationList.map((qual) => (
                <MenuItem key={qual.id} value={qual.id}>
                  {qual.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Certificate Level Filter */}
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Certificate Level</InputLabel>
            <Select
              name="certificateLevel"
              value={filters.certificateLevel}
              onChange={handleFilterChange}
              label="Certificate Level"
            >
              <MenuItem value="">--Select Certificate Level--</MenuItem>
              {certificateLevels.map((level) => (
                <MenuItem key={level.id} value={level.id}>
                  {level.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter By</InputLabel>
            <Select
              name="filterYearBy"
              value={filters.filterYearBy}
              onChange={handleFilterChange}
              label="Filter By"
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
              disabled={filteredTrainees.length === 0}
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
            placeholder="Search by trainee name..."
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
              <TableCell>Trainee Name</TableCell>
              <TableCell>CID No</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Contact No</TableCell>
              <TableCell>Institute Type</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Course Start Date</TableCell>
              <TableCell>Course End Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow key={`${report.id}_${index}`} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{report.trainee_name}</TableCell>
                  <TableCell>{report.cid_no || "N/A"}</TableCell>
                  <TableCell>{report.qualification || "N/A"}</TableCell>
                  <TableCell>{report.certification_level || "N/A"}</TableCell>
                  <TableCell>{report.contact_no || "N/A"}</TableCell>
                  <TableCell>{report.institute_type}</TableCell>
                  <TableCell>{report.institute}</TableCell>
                  <TableCell>{report.course_name}</TableCell>
                  <TableCell>
                    {report.course_start_date
                      ? new Date(report.course_start_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.course_end_date
                      ? new Date(report.course_end_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        backgroundColor: getStatusColor(report.status),
                        color: getStatusTextColor(report.status),
                      }}
                    >
                      {report.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                  {filteredTrainees.length === 0 && allTrainees.length > 0
                    ? "No trainees found matching your filters"
                    : allTrainees.length === 0
                      ? "Loading trainee data..."
                      : "No trainee data available"}
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
          Showing {paginatedReports.length} of {filteredTrainees.length} trainee
          reports
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTrainees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Paper>
  );
};

export default TraineeReportIndex;