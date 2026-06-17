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
  Rating,
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
import WorkIcon from "@mui/icons-material/Work";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
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

const TutorsDetailsReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [summaryData, setSummaryData] = useState({
    totalTutors: 0,
    maleCount: 0,
    femaleCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    averageExperience: 0,
    averageRating: 0,
  });

  // Filter options
  const [qualifications, setQualifications] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [statuses] = useState([
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
    { id: "on_leave", name: "On Leave" },
    { id: "terminated", name: "Terminated" },
  ]);

  useEffect(() => {
    fetchTutors();
    fetchQualifications();
    fetchSpecializations();
  }, []);

  useEffect(() => {
    filterTutors();
    calculateSummary();
  }, [tutors, searchTerm, selectedQualification, selectedSpecialization, selectedStatus]);

  const fetchQualifications = async () => {
    try {
      // Replace with your actual API call
      setQualifications([
        { id: 1, name: "Bachelor's Degree" },
        { id: 2, name: "Master's Degree" },
        { id: 3, name: "PhD" },
        { id: 4, name: "Diploma" },
        { id: 5, name: "Certificate" },
      ]);
    } catch (error) {
      console.error("Error fetching qualifications:", error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      // Replace with your actual API call
      setSpecializations([
        { id: 1, name: "Mathematics" },
        { id: 2, name: "Physics" },
        { id: 3, name: "Chemistry" },
        { id: 4, name: "Computer Science" },
        { id: 5, name: "English Literature" },
        { id: 6, name: "Business Studies" },
        { id: 7, name: "Economics" },
        { id: 8, name: "History" },
      ]);
    } catch (error) {
      console.error("Error fetching specializations:", error);
    }
  };

  const fetchTutors = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockTutors = [
        {
          id: 1,
          tutorCode: "TCH001",
          firstName: "John",
          lastName: "Smith",
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+975 17123456",
          dateOfBirth: "1985-03-15",
          gender: "Male",
          qualificationId: 2,
          qualification: "Master's Degree",
          specializationId: 4,
          specialization: "Computer Science",
          experienceYears: 8,
          hourlyRate: 500,
          status: "active",
          address: "Thimphu, Bhutan",
          joiningDate: "2016-01-15",
          rating: 4.5,
          totalStudents: 45,
          coursesTaught: 12,
          description: "Experienced computer science tutor with industry background",
          bankName: "BOC",
          accountNumber: "1234567890",
          emergencyContact: "+975 17123457",
          emergencyContactName: "Sarah Smith",
          remarks: "Outstanding tutor, students love his teaching style",
          profileImage: null,
        },
        {
          id: 2,
          tutorCode: "TCH002",
          firstName: "Mary",
          lastName: "Johnson",
          name: "Mary Johnson",
          email: "mary.johnson@example.com",
          phone: "+975 17234567",
          dateOfBirth: "1980-07-20",
          gender: "Female",
          qualificationId: 3,
          qualification: "PhD",
          specializationId: 1,
          specialization: "Mathematics",
          experienceYears: 12,
          hourlyRate: 600,
          status: "active",
          address: "Paro, Bhutan",
          joiningDate: "2012-06-20",
          rating: 4.8,
          totalStudents: 62,
          coursesTaught: 18,
          description: "PhD in Mathematics with extensive teaching experience",
          bankName: "BDBL",
          accountNumber: "0987654321",
          emergencyContact: "+975 17234568",
          emergencyContactName: "Michael Johnson",
          remarks: "Excellent mathematics tutor, high success rate",
          profileImage: null,
        },
        {
          id: 3,
          tutorCode: "TCH003",
          firstName: "David",
          lastName: "Williams",
          name: "David Williams",
          email: "david.williams@example.com",
          phone: "+975 17345678",
          dateOfBirth: "1990-11-10",
          gender: "Male",
          qualificationId: 1,
          qualification: "Bachelor's Degree",
          specializationId: 3,
          specialization: "Chemistry",
          experienceYears: 5,
          hourlyRate: 450,
          status: "active",
          address: "Punakha, Bhutan",
          joiningDate: "2019-01-10",
          rating: 4.2,
          totalStudents: 28,
          coursesTaught: 8,
          description: "Chemistry tutor with practical lab experience",
          bankName: "BOC",
          accountNumber: "1122334455",
          emergencyContact: "+975 17345679",
          emergencyContactName: "Emily Williams",
          remarks: "Good knowledge of practical chemistry",
          profileImage: null,
        },
        {
          id: 4,
          tutorCode: "TCH004",
          firstName: "Pema",
          lastName: "Wangmo",
          name: "Pema Wangmo",
          email: "pema.wangmo@example.com",
          phone: "+975 17456789",
          dateOfBirth: "1988-03-25",
          gender: "Female",
          qualificationId: 2,
          qualification: "Master's Degree",
          specializationId: 5,
          specialization: "English Literature",
          experienceYears: 10,
          hourlyRate: 550,
          status: "active",
          address: "Thimphu, Bhutan",
          joiningDate: "2014-08-15",
          rating: 4.7,
          totalStudents: 38,
          coursesTaught: 14,
          description: "English literature specialist with great communication skills",
          bankName: "PNB",
          accountNumber: "5544332211",
          emergencyContact: "+975 17456790",
          emergencyContactName: "Tshering Wangmo",
          remarks: "Excellent English tutor",
          profileImage: null,
        },
        {
          id: 5,
          tutorCode: "TCH005",
          firstName: "Sonam",
          lastName: "Dorji",
          name: "Sonam Dorji",
          email: "sonam.dorji@example.com",
          phone: "+975 17567890",
          dateOfBirth: "1992-09-30",
          gender: "Male",
          qualificationId: 1,
          qualification: "Bachelor's Degree",
          specializationId: 7,
          specialization: "Economics",
          experienceYears: 4,
          hourlyRate: 400,
          status: "inactive",
          address: "Wangdue, Bhutan",
          joiningDate: "2020-01-20",
          rating: 3.9,
          totalStudents: 15,
          coursesTaught: 5,
          description: "Economics tutor",
          bankName: "BOC",
          accountNumber: "9988776655",
          emergencyContact: "+975 17567891",
          emergencyContactName: "Dechen Dorji",
          remarks: "On leave for further studies",
          profileImage: null,
        },
      ];
      setTutors(mockTutors);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      toast.error("Failed to fetch tutor data");
    } finally {
      setLoading(false);
    }
  };

  const filterTutors = () => {
    let filtered = [...tutors];

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.tutorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedQualification) {
      filtered = filtered.filter((t) => t.qualification === selectedQualification);
    }

    if (selectedSpecialization) {
      filtered = filtered.filter((t) => t.specialization === selectedSpecialization);
    }

    if (selectedStatus) {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    setFilteredTutors(filtered);
    setPage(0);
  };

  const calculateSummary = () => {
    const total = filteredTutors.length;
    const male = filteredTutors.filter((t) => t.gender === "Male").length;
    const female = filteredTutors.filter((t) => t.gender === "Female").length;
    const active = filteredTutors.filter((t) => t.status === "active").length;
    const inactive = filteredTutors.filter((t) => t.status === "inactive").length;
    const avgExperience = filteredTutors.reduce((sum, t) => sum + (t.experienceYears || 0), 0) / (total || 1);
    const avgRating = filteredTutors.reduce((sum, t) => sum + (t.rating || 0), 0) / (total || 1);

    setSummaryData({
      totalTutors: total,
      maleCount: male,
      femaleCount: female,
      activeCount: active,
      inactiveCount: inactive,
      averageExperience: Math.round(avgExperience),
      averageRating: Number(avgRating.toFixed(1)),
    });
  };

  const handleViewDetails = (tutor) => {
    setSelectedTutor(tutor);
    setOpenDetails(true);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Tutors Details Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin: 20px 0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
            .summary-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; min-width: 150px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Tutors Details Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="summary">
            <div class="summary-card">Total Tutors: ${summaryData.totalTutors}</div>
            <div class="summary-card">Male: ${summaryData.maleCount}</div>
            <div class="summary-card">Female: ${summaryData.femaleCount}</div>
            <div class="summary-card">Active: ${summaryData.activeCount}</div>
            <div class="summary-card">Avg Experience: ${summaryData.averageExperience} yrs</div>
            <div class="summary-card">Avg Rating: ${summaryData.averageRating}/5</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Tutor Code</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTutors
                .map(
                  (t, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${t.tutorCode}</td>
                  <td>${t.name}</td>
                  <td>${t.specialization}</td>
                  <td>${t.qualification}</td>
                  <td>${t.experienceYears} yrs</td>
                  <td>${t.status}</td>
                  <td>${t.rating}/5</td>
                </tr>
              `
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
    if (filteredTutors.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const exportData = filteredTutors.map((tutor, index) => ({
      "Sl No": index + 1,
      "Tutor Code": tutor.tutorCode,
      "Name": tutor.name,
      "Gender": tutor.gender,
      "Email": tutor.email,
      "Phone": tutor.phone,
      "Date of Birth": tutor.dateOfBirth,
      "Qualification": tutor.qualification,
      "Specialization": tutor.specialization,
      "Experience (Years)": tutor.experienceYears,
      "Hourly Rate (Nu.)": tutor.hourlyRate,
      "Status": tutor.status,
      "Rating": tutor.rating,
      "Total Students Taught": tutor.totalStudents,
      "Courses Taught": tutor.coursesTaught,
      "Address": tutor.address,
      "Joining Date": tutor.joiningDate,
      "Bank Name": tutor.bankName,
      "Account Number": tutor.accountNumber,
      "Emergency Contact": tutor.emergencyContact,
      "Emergency Contact Name": tutor.emergencyContactName,
      "Remarks": tutor.remarks,
    }));

    const filename = `Tutors_Report_${new Date().toISOString().split("T")[0]}`;
    exportToExcel(exportData, filename, "Tutors Details");
    toast.success("Report exported successfully!");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedQualification("");
    setSelectedSpecialization("");
    setSelectedStatus("");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedTutors = filteredTutors.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4caf50";
      case "inactive":
        return "#f44336";
      case "on_leave":
        return "#ff9800";
      case "terminated":
        return "#9e9e9e";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusName = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "on_leave":
        return "On Leave";
      case "terminated":
        return "Terminated";
      default:
        return status;
    }
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Tutors Details Report
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
              placeholder="Search by name, code, email or specialization"
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
              <InputLabel>Qualification</InputLabel>
              <Select
                value={selectedQualification}
                label="Qualification"
                onChange={(e) => setSelectedQualification(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {qualifications.map((qual) => (
                  <MenuItem key={qual.id} value={qual.name}>
                    {qual.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Specialization</InputLabel>
              <Select
                value={selectedSpecialization}
                label="Specialization"
                onChange={(e) => setSelectedSpecialization(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {specializations.map((spec) => (
                  <MenuItem key={spec.id} value={spec.name}>
                    {spec.name}
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
                disabled={filteredTutors.length === 0}
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
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <SchoolIcon color="primary" sx={{ fontSize: 30 }} />
              <Typography variant="h4">{summaryData.totalTutors}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Tutors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
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
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
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
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {summaryData.activeCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Tutors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <WorkIcon color="action" sx={{ fontSize: 30 }} />
              <Typography variant="h4">{summaryData.averageExperience}</Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Experience (yrs)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <AssessmentIcon color="warning" sx={{ fontSize: 30 }} />
              <Typography variant="h4">{summaryData.averageRating}</Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tutors Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Tutor Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell align="center">Experience</TableCell>
              <TableCell align="center">Rate</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTutors.length > 0 ? (
              paginatedTutors.map((tutor, index) => (
                <TableRow key={tutor.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Chip
                      label={tutor.tutorCode}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                        {tutor.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{tutor.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{tutor.specialization}</TableCell>
                  <TableCell>{tutor.qualification}</TableCell>
                  <TableCell align="center">{tutor.experienceYears} yrs</TableCell>
                  <TableCell align="center">Nu. {tutor.hourlyRate}/hr</TableCell>
                  <TableCell align="center">
                    <Rating value={tutor.rating} size="small" readOnly precision={0.5} />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusName(tutor.status)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(tutor.status),
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
                        onClick={() => handleViewDetails(tutor)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {loading ? <CircularProgress size={24} /> : "No data available"}
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
          Showing {paginatedTutors.length} of {filteredTutors.length} tutors
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTutors.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      {/* Tutor Details Dialog */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTutor && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 50, height: 50 }}>
                  {selectedTutor.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedTutor.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Code: {selectedTutor.tutorCode}
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
                      <strong>Name:</strong> {selectedTutor.name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedTutor.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedTutor.phone}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Date of Birth:</strong> {selectedTutor.dateOfBirth}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedTutor.address}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SchoolIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Qualification:</strong> {selectedTutor.qualification}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                    Professional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WorkIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Specialization:</strong> {selectedTutor.specialization}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WorkIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Experience:</strong> {selectedTutor.experienceYears} years
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AttachMoneyIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Hourly Rate:</strong> Nu. {selectedTutor.hourlyRate}/hr
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Joining Date:</strong> {selectedTutor.joiningDate}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                    Performance Metrics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                    <Typography variant="h6">{selectedTutor.totalStudents}</Typography>
                    <Typography variant="caption">Students Taught</Typography>
                  </Paper>
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                    <Typography variant="h6">{selectedTutor.coursesTaught}</Typography>
                    <Typography variant="caption">Courses Taught</Typography>
                  </Paper>
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                    <Rating value={selectedTutor.rating} readOnly precision={0.5} size="large" />
                    <Typography variant="caption" display="block">
                      Rating ({selectedTutor.rating}/5)
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                    Banking Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2">
                    <strong>Bank Name:</strong> {selectedTutor.bankName}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2">
                    <strong>Account Number:</strong> {selectedTutor.accountNumber}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                    Emergency Contact
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedTutor.emergencyContactName}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedTutor.emergencyContact}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                    Remarks
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <strong>Description:</strong> {selectedTutor.description}
                  </Alert>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <strong>Remarks:</strong> {selectedTutor.remarks}
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

export default TutorsDetailsReport;