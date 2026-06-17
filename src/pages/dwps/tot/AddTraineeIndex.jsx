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
  TablePagination,
  Grid,
  Typography,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Box,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SendIcon from "@mui/icons-material/Send";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const AddTraineeIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [traineeMarks, setTraineeMarks] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Sample data for courses
  const [data] = useState([
    {
      id: 1,
      applicationNo: "24000017",
      courseName: "Instructional Methodology & Pedagogy",
      applicationDate: "February 27th 2023 to March 9th 2023",
      courseDate: "March 13th 2023 to March 25th 2023",
    },
    {
      id: 2,
      applicationNo: "24000016",
      courseName: "Instructional Methodology & Pedagogy",
      applicationDate: "May 6th 2022 to May 23rd 2022",
      courseDate: "June 6th 2022 to June 18th 2022",
    },
    {
      id: 3,
      applicationNo: "24000018",
      courseName: "Curriculum Development",
      applicationDate: "March 1st 2024 to March 15th 2024",
      courseDate: "March 20th 2024 to April 5th 2024",
    },
    {
      id: 4,
      applicationNo: "24000019",
      courseName: "Assessment Design",
      applicationDate: "April 10th 2024 to April 25th 2024",
      courseDate: "May 1st 2024 to May 15th 2024",
    },
  ]);

  // Sample trainee data for the selected course
  const [trainees] = useState([
    { id: 1, name: "Tshering Wangmo", cid: "11223344556", email: "tshering@example.com", phone: "17123456" },
    { id: 2, name: "Kinley Dorji", cid: "22334455667", email: "kinley@example.com", phone: "17234567" },
    { id: 3, name: "Sonam Choden", cid: "33445566778", email: "sonam@example.com", phone: "17345678" },
    { id: 4, name: "Tashi Dema", cid: "44556677889", email: "tashi@example.com", phone: "17456789" },
    { id: 5, name: "Pema Lhamo", cid: "55667788990", email: "pema@example.com", phone: "17567890" },
  ]);

  const steps = ["Select Trainees", "Enter Marks", "Generate Certificate"];

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleApplicationClick = (applicationNo) => {
    const course = data.find(item => item.applicationNo === applicationNo);
    setSelectedCourse(course);
    setSelectedTrainees([]);
    setTraineeMarks({});
    setActiveStep(0);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCourse(null);
    setSelectedTrainees([]);
    setTraineeMarks({});
    setActiveStep(0);
  };

  const handleSelectTrainee = (traineeId) => {
    setSelectedTrainees(prev =>
      prev.includes(traineeId)
        ? prev.filter(id => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTrainees(trainees.map(t => t.id));
    } else {
      setSelectedTrainees([]);
    }
  };

  const handleMarkChange = (traineeId, field, value) => {
    setTraineeMarks(prev => ({
      ...prev,
      [traineeId]: {
        ...prev[traineeId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedTrainees.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select at least one trainee",
        severity: "warning"
      });
      return;
    }
    if (activeStep === 1) {
      // Validate marks
      const hasInvalidMarks = selectedTrainees.some(id => {
        const marks = traineeMarks[id];
        return !marks || !marks.theory || !marks.practical || !marks.assignment;
      });
      if (hasInvalidMarks) {
        setSnackbar({
          open: true,
          message: "Please enter all marks for selected trainees",
          severity: "warning"
        });
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGenerateCertificate = () => {
    // Certificate generation logic
    console.log("Generating certificates for:", selectedTrainees);
    console.log("Marks:", traineeMarks);
    setSnackbar({
      open: true,
      message: "Certificates generated successfully!",
      severity: "success"
    });
    setTimeout(() => {
      handleCloseModal();
    }, 2000);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredData = data.filter(
    (item) =>
      item.applicationNo.includes(search) ||
      item.courseName.toLowerCase().includes(search.toLowerCase()),
  );

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const getTotalMarks = (traineeId) => {
    const marks = traineeMarks[traineeId] || {};
    return (marks.theory || 0) + (marks.practical || 0) + (marks.assignment || 0);
  };

  const isAllSelected = selectedTrainees.length === trainees.length;

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select trainees for {selectedCourse?.courseName}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>CID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainees.map((trainee, index) => (
                    <TableRow key={trainee.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedTrainees.includes(trainee.id)}
                          onChange={() => handleSelectTrainee(trainee.id)}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{trainee.name}</TableCell>
                      <TableCell>{trainee.cid}</TableCell>
                      <TableCell>{trainee.email}</TableCell>
                      <TableCell>{trainee.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Selected: {selectedTrainees.length} trainee(s)
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Enter marks for selected trainees
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Theory (100)</TableCell>
                    <TableCell align="center">Practical (100)</TableCell>
                    <TableCell align="center">Assignment (100)</TableCell>
                    <TableCell align="center">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainees
                    .filter(t => selectedTrainees.includes(t.id))
                    .map((trainee, index) => (
                      <TableRow key={trainee.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{trainee.name}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={traineeMarks[trainee.id]?.theory || ""}
                            onChange={(e) => handleMarkChange(trainee.id, "theory", e.target.value)}
                            sx={{ width: 80 }}
                            InputProps={{
                              inputProps: { min: 0, max: 100 }
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={traineeMarks[trainee.id]?.practical || ""}
                            onChange={(e) => handleMarkChange(trainee.id, "practical", e.target.value)}
                            sx={{ width: 80 }}
                            InputProps={{
                              inputProps: { min: 0, max: 100 }
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={traineeMarks[trainee.id]?.assignment || ""}
                            onChange={(e) => handleMarkChange(trainee.id, "assignment", e.target.value)}
                            sx={{ width: 80 }}
                            InputProps={{
                              inputProps: { min: 0, max: 100 }
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getTotalMarks(trainee.id)}
                            size="small"
                            color={
                              getTotalMarks(trainee.id) >= 180 ? "success" :
                                getTotalMarks(trainee.id) >= 120 ? "warning" :
                                  "error"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, p: 2 }}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <PictureAsPdfIcon sx={{ fontSize: 60, color: "#d32f2f", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Certificate Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You are about to generate certificates for {selectedTrainees.length} trainee(s)
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: "left", mb: 2 }}>
                <Typography variant="subtitle2">Course: {selectedCourse?.courseName}</Typography>
                <Typography variant="subtitle2">Application No: {selectedCourse?.applicationNo}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {trainees
                  .filter(t => selectedTrainees.includes(t.id))
                  .map((trainee) => (
                    <Chip
                      key={trainee.id}
                      label={trainee.name}
                      size="small"
                      color={getTotalMarks(trainee.id) >= 120 ? "success" : "error"}
                    />
                  ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                {selectedTrainees.length} certificate(s) will be generated
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Course Detail List
      </Typography>

      {/* Search Bar */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Application No. or Course Name"
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell width="5%">#</TableCell>
              <TableCell width="15%">Application No.</TableCell>
              <TableCell width="25%">Course Name</TableCell>
              <TableCell width="30%">Application Date</TableCell>
              <TableCell width="25%">Course Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() =>
                          handleApplicationClick(item.applicationNo)
                        }
                        sx={{
                          textDecoration: "underline",
                          cursor: "pointer",
                          color: "primary.main",
                          fontWeight: 500,
                          "&:hover": {
                            color: "primary.dark",
                          },
                        }}
                      >
                        {item.applicationNo}
                      </Link>
                    </TableCell>
                    <TableCell>{item.courseName}</TableCell>
                    <TableCell>{item.applicationDate}</TableCell>
                    <TableCell>{item.courseDate}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data available in table
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

      {/* Modal for Trainee Selection, Marks Entry, and Certificate Generation */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "60vh", maxHeight: "90vh" }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6">
                Manage Trainees
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCourse?.courseName} - {selectedCourse?.applicationNo}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          {renderStepContent(activeStep)}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleGenerateCertificate}
            >
              Generate Certificate
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              startIcon={activeStep === 0 ? <PersonAddIcon /> : <SendIcon />}
            >
              {activeStep === 0 ? "Select Trainees" : "Next"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AddTraineeIndex;