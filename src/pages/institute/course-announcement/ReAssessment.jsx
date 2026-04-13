import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import SearchIcon from "@mui/icons-material/Search";
import ReplayIcon from "@mui/icons-material/Replay";

const ReAssessment = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sample data for reassessment
  const [reassessmentData] = useState([
    {
      id: 1,
      applicationNo: "2024060155",
      course: "Robotics",
      level: "Beginner",
      applicationDate: "2026-03-01",
      courseDate: "2026-03-15",
      status: "Failed",
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060155",
      courseFee: 1200,
      totalTrainees: 25,
      applicationEnd: "2026-03-10",
      courseEnd: "2026-04-15",
      fundingSource: "Government",
      trainingLocation: "Thimphu",
      courseDescription: "Introductory robotics course for beginners",
      requiredDocuments: "CV, Passport Copy",
    },
    {
      id: 2,
      applicationNo: "2024060156",
      course: "IoT",
      level: "Intermediate",
      applicationDate: "2026-03-05",
      courseDate: "2026-03-20",
      status: "Failed",
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060156",
      courseFee: 1500,
      totalTrainees: 20,
      applicationEnd: "2026-03-15",
      courseEnd: "2026-04-25",
      fundingSource: "Private",
      trainingLocation: "Paro",
      courseDescription:
        "Intermediate IoT course for learners with basic knowledge",
      requiredDocuments: "CV, Passport Copy",
    },
    {
      id: 3,
      applicationNo: "2024060157",
      course: "Robotics",
      level: "Advanced",
      applicationDate: "2026-03-10",
      courseDate: "2026-03-25",
      status: "Failed",
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060157",
      courseFee: 1800,
      totalTrainees: 15,
      applicationEnd: "2026-03-20",
      courseEnd: "2026-05-10",
      fundingSource: "Government",
      trainingLocation: "Thimphu",
      courseDescription: "Advanced robotics course for experienced learners",
      requiredDocuments: "CV, Passport Copy, Previous Certificates",
    },
    {
      id: 4,
      applicationNo: "2024060158",
      course: "IoT",
      level: "Beginner",
      applicationDate: "2026-03-12",
      courseDate: "2026-03-28",
      status: "Failed",
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060158",
      courseFee: 1100,
      totalTrainees: 25,
      applicationEnd: "2026-03-22",
      courseEnd: "2026-04-30",
      fundingSource: "Private",
      trainingLocation: "Paro",
      courseDescription: "Introduction to IoT concepts",
      requiredDocuments: "CV, Passport Copy",
    },
    {
      id: 5,
      applicationNo: "2024060159",
      course: "Robotics",
      level: "Intermediate",
      applicationDate: "2026-03-15",
      courseDate: "2026-04-01",
      status: "Failed",
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060159",
      courseFee: 1400,
      totalTrainees: 20,
      applicationEnd: "2026-03-25",
      courseEnd: "2026-05-15",
      fundingSource: "Government",
      trainingLocation: "Thimphu",
      courseDescription: "Intermediate robotics programming",
      requiredDocuments: "CV, Passport Copy",
    },
  ]);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleReapply = (application) => {
    console.log("Reapply for application:", application);
    // Add your reapply logic here
    alert(`Reapplying for application: ${application.applicationNo}`);
  };

  // Filter data based on search and filter type
  const filteredData = reassessmentData.filter((item) => {
    const matchesSearch =
      item.course?.toLowerCase().includes(search.toLowerCase()) ||
      item.applicationNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.providerName?.toLowerCase().includes(search.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "accredited")
      return matchesSearch && item.course === "Robotics";
    if (filterType === "non-accredited")
      return matchesSearch && item.course === "IoT";
    if (filterType === "rpl") return matchesSearch && item.level === "Advanced";

    return matchesSearch;
  });

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  // Status chip color
  const getStatusChip = (status) => {
    let color = "error";
    return (
      <Chip label={status} color={color} size="small" sx={{ minWidth: 70 }} />
    );
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h6" gutterBottom>
        Re-Assessment Details
      </Typography>

      {/* Filters and Search */}
      <Grid container spacing={2} sx={{ mb: 3, mt: 2 }}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Course Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filter by Course Type"
            >
              <MenuItem value="all">All Courses</MenuItem>
              <MenuItem value="accredited">Accredited Course</MenuItem>
              <MenuItem value="non-accredited">Non-Accredited Course</MenuItem>
              <MenuItem value="rpl">RPL Assessment</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search by Course, Application No, or Provider"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>
                <strong>#</strong>
              </TableCell>
              <TableCell>
                <strong>Application No</strong>
              </TableCell>
              <TableCell>
                <strong>Course</strong>
              </TableCell>
              <TableCell>
                <strong>Level</strong>
              </TableCell>
              <TableCell>
                <strong>Application Date</strong>
              </TableCell>
              <TableCell>
                <strong>Course Date</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>View</strong>
              </TableCell>
              <TableCell>
                <strong>Action</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{item.applicationNo}</TableCell>
                    <TableCell>{item.course}</TableCell>
                    <TableCell>{item.level}</TableCell>
                    <TableCell>{item.applicationDate}</TableCell>
                    <TableCell>{item.courseDate}</TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        color="info"
                        sx={{
                          minHeight: 20,
                          padding: "2px 8px",
                        }}
                        startIcon={<RemoveRedEyeIcon fontSize="small" />}
                      >
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        color="warning"
                        sx={{
                          minHeight: 20,
                          padding: "2px 8px",
                        }}
                        startIcon={<ReplayIcon fontSize="small" />}
                        onClick={() => handleReapply(item)}
                      >
                        Reapply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    No data available for reassessment
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Summary Section */}
      <Box sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Typography variant="body2" color="textSecondary">
          Total Failed Applications: {reassessmentData.length}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Showing: {filteredData.length} results
        </Typography>
      </Box>
    </Paper>
  );
};

export default ReAssessment;
