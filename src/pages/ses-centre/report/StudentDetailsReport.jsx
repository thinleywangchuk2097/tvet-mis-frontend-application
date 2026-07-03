import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";

// Table style constant
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

const StudentDetailsReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [summaryData, setSummaryData] = useState({
    totalStudents: 0,
    maleCount: 0,
    femaleCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    averageAttendance: 0,
  });

  // Filter options
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [statuses] = useState([
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
    { id: "graduated", name: "Graduated" },
    { id: "transferred", name: "Transferred" },
  ]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    filterStudents();
    calculateSummary();
  }, [students, searchTerm, selectedClass, selectedSection, selectedStatus]);

  const fetchClasses = async () => {
    try {
      // Replace with your actual API call
      setClasses([
        { id: 1, name: "Grade 1" },
        { id: 2, name: "Grade 2" },
        { id: 3, name: "Grade 3" },
        { id: 4, name: "Grade 4" },
        { id: 5, name: "Grade 5" },
        { id: 6, name: "Grade 6" },
        { id: 7, name: "Grade 7" },
        { id: 8, name: "Grade 8" },
        { id: 9, name: "Grade 9" },
        { id: 10, name: "Grade 10" },
      ]);

      setSections([
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ]);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockStudents = [
        {
          id: 1,
          studentId: "STU2024001",
          name: "Tshewang Dorji",
          firstName: "Tshewang",
          lastName: "Dorji",
          email: "tshewang.dorji@example.com",
          phone: "+975 17123456",
          dateOfBirth: "2010-05-15",
          gender: "Male",
          className: "Grade 5",
          section: "A",
          rollNumber: "01",
          admissionDate: "2023-01-15",
          status: "active",
          address: "Thimphu, Bhutan",
          parentName: "Karma Dorji",
          parentPhone: "+975 17123457",
          parentEmail: "karma.dorji@example.com",
          attendance: 92,
          grade: "A",
          remarks: "Excellent student",
          profileImage: null,
        },
        {
          id: 2,
          studentId: "STU2024002",
          name: "Pema Choden",
          firstName: "Pema",
          lastName: "Choden",
          email: "pema.choden@example.com",
          phone: "+975 17234567",
          dateOfBirth: "2011-03-20",
          gender: "Female",
          className: "Grade 5",
          section: "A",
          rollNumber: "02",
          admissionDate: "2023-01-15",
          status: "active",
          address: "Paro, Bhutan",
          parentName: "Sonam Choden",
          parentPhone: "+975 17234568",
          parentEmail: "sonam.choden@example.com",
          attendance: 88,
          grade: "B+",
          remarks: "Good performance",
          profileImage: null,
        },
        {
          id: 3,
          studentId: "STU2024003",
          name: "Kinley Wangchuk",
          firstName: "Kinley",
          lastName: "Wangchuk",
          email: "kinley.wangchuk@example.com",
          phone: "+975 17345678",
          dateOfBirth: "2010-08-10",
          gender: "Male",
          className: "Grade 5",
          section: "B",
          rollNumber: "15",
          admissionDate: "2023-01-15",
          status: "active",
          address: "Punakha, Bhutan",
          parentName: "Tshering Wangchuk",
          parentPhone: "+975 17345679",
          parentEmail: "tshering.wangchuk@example.com",
          attendance: 76,
          grade: "B",
          remarks: "Needs improvement in mathematics",
          profileImage: null,
        },
        {
          id: 4,
          studentId: "STU2024004",
          name: "Dechen Zangmo",
          firstName: "Dechen",
          lastName: "Zangmo",
          email: "dechen.zangmo@example.com",
          phone: "+975 17456789",
          dateOfBirth: "2011-01-25",
          gender: "Female",
          className: "Grade 6",
          section: "A",
          rollNumber: "05",
          admissionDate: "2023-01-15",
          status: "active",
          address: "Wangdue, Bhutan",
          parentName: "Pema Zangmo",
          parentPhone: "+975 17456790",
          parentEmail: "pema.zangmo@example.com",
          attendance: 94,
          grade: "A-",
          remarks: "Very attentive in class",
          profileImage: null,
        },
        {
          id: 5,
          studentId: "STU2024005",
          name: "Lhendup Gyeltshen",
          firstName: "Lhendup",
          lastName: "Gyeltshen",
          email: "lhendup.gyeltshen@example.com",
          phone: "+975 17567890",
          dateOfBirth: "2010-11-30",
          gender: "Male",
          className: "Grade 6",
          section: "B",
          rollNumber: "22",
          admissionDate: "2023-01-15",
          status: "inactive",
          address: "Bumthang, Bhutan",
          parentName: "Namgay Gyeltshen",
          parentPhone: "+975 17567891",
          parentEmail: "namgay.gyeltshen@example.com",
          attendance: 45,
          grade: "C",
          remarks: "Irregular attendance",
          profileImage: null,
        },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch student data");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedClass) {
      filtered = filtered.filter((s) => s.className === selectedClass);
    }

    if (selectedSection) {
      filtered = filtered.filter((s) => s.section === selectedSection);
    }

    if (selectedStatus) {
      filtered = filtered.filter((s) => s.status === selectedStatus);
    }

    setFilteredStudents(filtered);
    setPage(0);
  };

  const calculateSummary = () => {
    const total = filteredStudents.length;
    const male = filteredStudents.filter((s) => s.gender === "Male").length;
    const female = filteredStudents.filter((s) => s.gender === "Female").length;
    const active = filteredStudents.filter((s) => s.status === "active").length;
    const inactive = filteredStudents.filter(
      (s) => s.status === "inactive",
    ).length;
    const avgAttendance =
      filteredStudents.reduce((sum, s) => sum + (s.attendance || 0), 0) /
      (total || 1);

    setSummaryData({
      totalStudents: total,
      maleCount: male,
      femaleCount: female,
      activeCount: active,
      inactiveCount: inactive,
      averageAttendance: Math.round(avgAttendance),
    });
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setOpenDetails(true);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Details Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin: 20px 0; display: flex; justify-content: space-between; }
            .summary-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Student Details Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="summary">
            <div class="summary-card">Total Students: ${summaryData.totalStudents}</div>
            <div class="summary-card">Male: ${summaryData.maleCount}</div>
            <div class="summary-card">Female: ${summaryData.femaleCount}</div>
            <div class="summary-card">Active: ${summaryData.activeCount}</div>
            <div class="summary-card">Avg Attendance: ${summaryData.averageAttendance}%</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents
                .map(
                  (s, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${s.studentId}</td>
                  <td>${s.name}</td>
                  <td>${s.className}</td>
                  <td>${s.section}</td>
                  <td>${s.gender}</td>
                  <td>${s.status}</td>
                  <td>${s.attendance}%</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExcelExport = () => {
    if (filteredStudents.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const exportData = filteredStudents.map((student, index) => ({
      "Sl No": index + 1,
      "Student ID": student.studentId,
      Name: student.name,
      Class: student.className,
      Section: student.section,
      "Roll Number": student.rollNumber,
      Gender: student.gender,
      "Date of Birth": student.dateOfBirth,
      Email: student.email,
      Phone: student.phone,
      Address: student.address,
      "Parent Name": student.parentName,
      "Parent Phone": student.parentPhone,
      "Parent Email": student.parentEmail,
      Status: student.status,
      "Attendance (%)": student.attendance,
      Grade: student.grade,
      Remarks: student.remarks,
      "Admission Date": student.admissionDate,
    }));

    const filename = `Student_Report_${new Date().toISOString().split("T")[0]}`;
    exportToExcel(exportData, filename, "Student Details");
    toast.success("Report exported successfully!");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedClass("");
    setSelectedSection("");
    setSelectedStatus("");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4caf50";
      case "inactive":
        return "#f44336";
      case "graduated":
        return "#2196f3";
      case "transferred":
        return "#ff9800";
      default:
        return "#9e9e9e";
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.startsWith("A")) return "#4caf50";
    if (grade?.startsWith("B")) return "#2196f3";
    if (grade?.startsWith("C")) return "#ff9800";
    return "#f44336";
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Student Details Report
      </Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: "#fafafa" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              size="small"
              placeholder="Search by name, ID or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.name}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select
                value={selectedSection}
                label="Section"
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.name}>
                    Section {sec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={resetFilters}
                fullWidth
              >
                Reset
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                fullWidth
              >
                Print
              </Button>
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={handleExcelExport}
                disabled={filteredStudents.length === 0}
                fullWidth
              >
                Export
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <SchoolIcon color="primary" sx={{ fontSize: 30 }} />
              <Typography variant="h4">{summaryData.totalStudents}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <PersonIcon color="primary" sx={{ fontSize: 30 }} />
              <Typography variant="h4">{summaryData.maleCount}</Typography>
              <Typography variant="body2" color="textSecondary">
                Male
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <PersonIcon color="secondary" sx={{ fontSize: 30 }} />
              <Typography variant="h4">{summaryData.femaleCount}</Typography>
              <Typography variant="body2" color="textSecondary">
                Female
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {summaryData.activeCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="info.main">
                {summaryData.averageAttendance}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Attendance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Student Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Roll No</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell align="center">Attendance</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Chip
                      label={student.studentId}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                      >
                        {student.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{student.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{student.className}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${student.attendance}%`}
                      size="small"
                      sx={{
                        backgroundColor:
                          student.attendance >= 75 ? "#4caf50" : "#ff9800",
                        color: "white",
                        minWidth: "50px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={student.grade}
                      size="small"
                      sx={{
                        backgroundColor: getGradeColor(student.grade),
                        color: "white",
                        minWidth: "50px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={student.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(student.status),
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(student)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "No data available"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedStudents.length} of {filteredStudents.length}{" "}
          students
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredStudents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      {/* Student Details Dialog */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedStudent && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 50, height: 50 }}>
                  {selectedStudent.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedStudent.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    ID: {selectedStudent.studentId}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedStudent.name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedStudent.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedStudent.phone}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Date of Birth:</strong>{" "}
                      {selectedStudent.dateOfBirth}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedStudent.address}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SchoolIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Class:</strong> {selectedStudent.className} -
                      Section {selectedStudent.section}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    Parent/Guardian Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Parent Name:</strong> {selectedStudent.parentName}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Parent Phone:</strong>{" "}
                      {selectedStudent.parentPhone}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 12 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Parent Email:</strong>{" "}
                      {selectedStudent.parentEmail}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    Academic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6">
                      {selectedStudent.attendance}%
                    </Typography>
                    <Typography variant="caption">Attendance</Typography>
                  </Paper>
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                    <Typography
                      variant="h6"
                      color={getGradeColor(selectedStudent.grade)}
                    >
                      {selectedStudent.grade}
                    </Typography>
                    <Typography variant="caption">Grade</Typography>
                  </Paper>
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                    <Chip
                      label={selectedStudent.status}
                      sx={{
                        backgroundColor: getStatusColor(selectedStudent.status),
                        color: "white",
                      }}
                    />
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      Status
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <strong>Remarks:</strong> {selectedStudent.remarks}
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDetails(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default StudentDetailsReport;
