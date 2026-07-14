import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Box,
  Button,
  Checkbox,
  TextField,
  Avatar,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Fade,
  Slide,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GroupIcon from "@mui/icons-material/Group";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ViewApplyTrainerToTProgram = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stepper states
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [traineeMarks, setTraineeMarks] = useState({});
  const steps = ["Select Trainers", "Enter Marks", "Generate Certificate"];

  // Static announcement data
  const [announcement, setAnnouncement] = useState({
    id: 1,
    applicationNo: "240000000",
    programName: "Masonary Training Program",
    programCode: "MTP-001",
    programTypeId: 120,
    applicationStartDate: "2026-07-08",
    applicationEndDate: "2026-07-15",
    programStartDate: "2026-07-23",
    programEndDate: "2026-07-30",
    maxParticipants: "12",
    venue: "MPH, Thimphu",
    eligibilityCriteria: "All are eligible to apply this TOT Program",
    remarks: "remarks",
  });

  // Static trainers data
  const [trainers, setTrainers] = useState([
    {
      id: 1,
      name: "Tshering Wangmo",
      cid: "11223344556",
      email: "tshering@example.com",
      phone: "17123456",
      gender: "Female",
      qualification: "M.Ed",
      experience: "5",
      specialization: "Mathematics",
    },
    {
      id: 2,
      name: "Kinley Dorji",
      cid: "22334455667",
      email: "kinley@example.com",
      phone: "17234567",
      gender: "Male",
      qualification: "B.Ed",
      experience: "3",
      specialization: "Science",
    },
    {
      id: 3,
      name: "Sonam Choden",
      cid: "33445566778",
      email: "sonam@example.com",
      phone: "17345678",
      gender: "Female",
      qualification: "M.Sc",
      experience: "7",
      specialization: "Physics",
    },
    {
      id: 4,
      name: "Tashi Dema",
      cid: "44556677889",
      email: "tashi@example.com",
      phone: "17456789",
      gender: "Female",
      qualification: "B.Sc",
      experience: "2",
      specialization: "Biology",
    },
    {
      id: 5,
      name: "Pema Lhamo",
      cid: "55667788990",
      email: "pema@example.com",
      phone: "17567890",
      gender: "Female",
      qualification: "MBA",
      experience: "4",
      specialization: "Business",
    },
  ]);

  // Table style consistent with ApplyTrainerToTProgram
  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
      padding: "8px 12px",
    },
    "& th": {
      fontWeight: 600,
      backgroundColor: "#f5f5f5",
    },
  };

  const getInitials = (name) => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Stepper handlers
  const handleSelectTrainer = (trainerId) => {
    setSelectedTrainers((prev) =>
      prev.includes(trainerId)
        ? prev.filter((id) => id !== trainerId)
        : [...prev, trainerId],
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTrainers(trainers.map((t) => t.id));
    } else {
      setSelectedTrainers([]);
    }
  };

  const handleMarkChange = (trainerId, field, value) => {
    setTraineeMarks((prev) => ({
      ...prev,
      [trainerId]: {
        ...prev[trainerId],
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedTrainers.length === 0) {
      toast.warning("Please select at least one trainer");
      return;
    }
    if (activeStep === 1) {
      const hasInvalidMarks = selectedTrainers.some((id) => {
        const marks = traineeMarks[id];
        return (
          !marks ||
          marks.theory === undefined ||
          marks.practical === undefined ||
          marks.assignment === undefined
        );
      });
      if (hasInvalidMarks) {
        toast.warning("Please enter all marks for selected trainers");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGenerateCertificate = () => {
    console.log("Generating certificates for:", selectedTrainers);
    console.log("Marks:", traineeMarks);
    console.log("Announcement:", announcement);

    toast.success("Certificates generated successfully!");
    setTimeout(() => {
      setActiveStep(0);
      setSelectedTrainers([]);
      setTraineeMarks({});
    }, 2000);
  };

  const getTotalMarks = (trainerId) => {
    const marks = traineeMarks[trainerId] || {};
    return (
      (marks.theory || 0) + (marks.practical || 0) + (marks.assignment || 0)
    );
  };

  const isAllSelected = selectedTrainers.length === trainers.length;

  // Render step content
  const renderStepContent = (step) => {
    const filteredTrainers = trainers.filter(
      (trainer) =>
        trainer.name?.toLowerCase().includes(search.toLowerCase()) ||
        trainer.cid?.toLowerCase().includes(search.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(search.toLowerCase()) ||
        trainer.specialization?.toLowerCase().includes(search.toLowerCase()),
    );

    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select trainers for {announcement?.programName}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small" sx={tableStyle}>
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
                    <TableCell>Qualification</TableCell>
                    <TableCell>Specialization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrainers.map((trainer, index) => (
                    <TableRow key={trainer.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedTrainers.includes(trainer.id)}
                          onChange={() => handleSelectTrainer(trainer.id)}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                          >
                            {getInitials(trainer.name)}
                          </Avatar>
                          <Typography variant="body2">
                            {trainer.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{trainer.cid}</TableCell>
                      <TableCell>{trainer.email}</TableCell>
                      <TableCell>{trainer.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={trainer.qualification}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{trainer.specialization || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Selected: {selectedTrainers.length} trainer(s)
            </Typography>
          </Box>
        );

      case 1:
        const selectedTrainersList = trainers.filter((t) =>
          selectedTrainers.includes(t.id),
        );
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Enter marks for selected trainers
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small" sx={tableStyle}>
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
                  {selectedTrainersList.map((trainer, index) => (
                    <TableRow key={trainer.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{trainer.name}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={traineeMarks[trainer.id]?.theory || ""}
                          onChange={(e) =>
                            handleMarkChange(
                              trainer.id,
                              "theory",
                              e.target.value,
                            )
                          }
                          sx={{ width: 80 }}
                          InputProps={{
                            inputProps: { min: 0, max: 100 },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={traineeMarks[trainer.id]?.practical || ""}
                          onChange={(e) =>
                            handleMarkChange(
                              trainer.id,
                              "practical",
                              e.target.value,
                            )
                          }
                          sx={{ width: 80 }}
                          InputProps={{
                            inputProps: { min: 0, max: 100 },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={traineeMarks[trainer.id]?.assignment || ""}
                          onChange={(e) =>
                            handleMarkChange(
                              trainer.id,
                              "assignment",
                              e.target.value,
                            )
                          }
                          sx={{ width: 80 }}
                          InputProps={{
                            inputProps: { min: 0, max: 100 },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getTotalMarks(trainer.id)}
                          size="small"
                          color={
                            getTotalMarks(trainer.id) >= 180
                              ? "success"
                              : getTotalMarks(trainer.id) >= 120
                                ? "warning"
                                : "error"
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
        const selectedForCertificate = trainers.filter((t) =>
          selectedTrainers.includes(t.id),
        );
        return (
          <Box sx={{ mt: 2, p: 2 }}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <PictureAsPdfIcon
                sx={{ fontSize: 60, color: "#d32f2f", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Certificate Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You are about to generate certificates for{" "}
                {selectedTrainers.length} trainer(s)
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: "left", mb: 2 }}>
                <Typography variant="subtitle2">
                  Program: {announcement?.programName}
                </Typography>
                <Typography variant="subtitle2">
                  Application No: {announcement?.applicationNo}
                </Typography>
                <Typography variant="subtitle2">
                  Venue: {announcement?.venue || "N/A"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                {selectedForCertificate.map((trainer) => (
                  <Chip
                    key={trainer.id}
                    label={`${trainer.name} (${getTotalMarks(trainer.id)}%)`}
                    size="small"
                    color={
                      getTotalMarks(trainer.id) >= 120 ? "success" : "error"
                    }
                  />
                ))}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                {selectedTrainers.length} certificate(s) will be generated
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
      {/* Header with Back Button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5">Apply Trainer to TOT Program</Typography>
      </Box>

      {/* Announcement Details - Consistent with ApplyTrainerToTProgram */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: "#f8f9fa" }}>
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Application No.
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {announcement.applicationNo}
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Program Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {announcement.programName}
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Program Code
            </Typography>
            <Typography variant="body1">{announcement.programCode}</Typography>
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Venue
            </Typography>
            <Typography variant="body1">
              {announcement.venue || "N/A"}
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Application Period
            </Typography>
            <Typography variant="body2">
              {formatDate(announcement.applicationStartDate)} -{" "}
              {formatDate(announcement.applicationEndDate)}
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Program Period
            </Typography>
            <Typography variant="body2">
              {formatDate(announcement.programStartDate)} -{" "}
              {formatDate(announcement.programEndDate)}
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Max Participants
            </Typography>
            <Typography variant="body2">
              {announcement.maxParticipants || "N/A"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Search Bar - Consistent with ApplyTrainerToTProgram */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Trainers"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, CID, Email or Specialization"
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

      {/* Navigation Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGenerateCertificate}
            size="small"
          >
            Generate Certificate
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            startIcon={activeStep === 0 ? <PersonIcon /> : <SendIcon />}
            size="small"
          >
            {activeStep === 0 ? "Select Trainers" : "Next"}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ViewApplyTrainerToTProgram;
