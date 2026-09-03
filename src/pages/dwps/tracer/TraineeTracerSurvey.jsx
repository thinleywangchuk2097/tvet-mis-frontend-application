import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

// ==================== PROPTYPES ====================

const traineeTracerSurveyPropTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  survey: PropTypes.shape({
    applicationNo: PropTypes.string,
    parentTracerType: PropTypes.string,
    subTracerType: PropTypes.string,
    applicationName: PropTypes.string,
    mobileNo: PropTypes.string,
    emailId: PropTypes.string,
  }),
};

// ==================== MAIN COMPONENT ====================

const TraineeTracerSurvey = ({ open, onClose, survey, onSend }) => {
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [instituteFilter, setInstituteFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const institutes = [
    "Technical Training Institute Thimphu (TTI-T)",
    "Technical Training Institute Chumey (TTI-C)",
    "Technical Training Institute Samthang (TTI-S)",
    "Technical Training Institute Rangjung (TTI-R)",
    "Jigme Wangchuck Power Training Institute Dekiling (JWPTI)",
    "Royal Institute for Tourism and Hospitality (RITH)",
  ];

  // Sample trainee data - In real app, this would come from API
  const [trainees] = useState([
    {
      id: "TR001",
      name: "Kinley Wangchuk",
      mobileNo: "17123456",
      email: "kinley.w@example.com",
      institute: "Technical Training Institute Thimphu (TTI-T)",
      course: "Diploma in Electrical Engineering",
      graduatedAt: "2025-12-15",
      statusId: 1,
    },
    {
      id: "TR002",
      name: "Tashi Dema",
      mobileNo: "17234567",
      email: "tashi.d@example.com",
      institute: "Technical Training Institute Chumey (TTI-C)",
      course: "Diploma in Civil Engineering",
      graduatedAt: "2025-11-20",
      statusId: 1,
    },
    {
      id: "TR003",
      name: "Sonam Dorji",
      mobileNo: "17345678",
      email: "sonam.d@example.com",
      institute: "Technical Training Institute Samthang (TTI-S)",
      course: "Certificate in Mechanical Engineering",
      graduatedAt: "2025-10-10",
      statusId: 1,
    },
    {
      id: "TR004",
      name: "Pema Yangzom",
      mobileNo: "17456789",
      email: "pema.y@example.com",
      institute: "Technical Training Institute Rangjung (TTI-R)",
      course: "Diploma in Information Technology",
      graduatedAt: "2025-09-05",
      statusId: 1,
    },
    {
      id: "TR005",
      name: "Jigme Namgyel",
      mobileNo: "17567890",
      email: "jigme.n@example.com",
      institute: "Jigme Wangchuck Power Training Institute Dekiling (JWPTI)",
      course: "Certificate in Power Distribution",
      graduatedAt: "2025-08-12",
      statusId: 1,
    },
    {
      id: "TR006",
      name: "Dechen Wangmo",
      mobileNo: "17678901",
      email: "dechen.w@example.com",
      institute: "Royal Institute for Tourism and Hospitality (RITH)",
      course: "Diploma in Hotel Management",
      graduatedAt: "2025-07-18",
      statusId: 1,
    },
    {
      id: "TR007",
      name: "Karma Tshering",
      mobileNo: "17789012",
      email: "karma.t@example.com",
      institute: "Technical Training Institute Thimphu (TTI-T)",
      course: "Diploma in Electronics Engineering",
      graduatedAt: "2025-06-22",
      statusId: 1,
    },
  ]);

  // Filter trainees based on institute and search
  const filteredTrainees = trainees.filter((trainee) => {
    const matchesInstitute = instituteFilter
      ? trainee.institute === instituteFilter
      : true;
    const matchesSearch = search
      ? trainee.name.toLowerCase().includes(search.toLowerCase()) ||
        trainee.email.toLowerCase().includes(search.toLowerCase()) ||
        trainee.mobileNo.includes(search)
      : true;
    return matchesInstitute && matchesSearch;
  });

  const handleSelectAllTrainees = (event) => {
    if (event.target.checked) {
      setSelectedTrainees(filteredTrainees.map((t) => t.id));
    } else {
      setSelectedTrainees([]);
    }
  };

  const handleSelectTrainee = (id) => {
    setSelectedTrainees((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSend = async () => {
    if (selectedTrainees.length === 0) {
      alert("Please select at least one trainee to send the survey to");
      return;
    }

    setSending(true);
    try {
      const selectedTraineeDetails = trainees.filter((t) =>
        selectedTrainees.includes(t.id),
      );
      await onSend(selectedTraineeDetails);
    } catch (error) {
      console.error("Error sending survey:", error);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Trainees to Send Survey
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Survey: {survey?.applicationNo} • {survey?.parentTracerType} -{" "}
          {survey?.subTracerType}
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
          Application Name: {survey?.applicationName} | Mobile:{" "}
          {survey?.mobileNo} | Email: {survey?.emailId}
        </Typography>
      </Box>

      {/* Institute Filter and Search */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Institute</InputLabel>
              <Select
                value={instituteFilter}
                onChange={(e) => setInstituteFilter(e.target.value)}
                label="Filter by Institute"
              >
                <MenuItem value="">All Institutes</MenuItem>
                {institutes.map((institute) => (
                  <MenuItem key={institute} value={institute}>
                    {institute}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Search by Name, Email or Mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </Grid>
        </Grid>
      </Box>

      {/* Selected Trainees Count */}
      {selectedTrainees.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${selectedTrainees.length} trainee(s) selected`}
            onDelete={() => setSelectedTrainees([])}
            color="primary"
            size="small"
          />
        </Box>
      )}

      {/* Trainees Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #e0e0e0",
            "& th": {
              border: "1px solid #e0e0e0",
              fontWeight: 600,
              bgcolor: "#f5f5f5",
            },
            "& td": { border: "1px solid #e0e0e0" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" align="center">
                <Checkbox
                  checked={
                    filteredTrainees.length > 0 &&
                    selectedTrainees.length === filteredTrainees.length
                  }
                  indeterminate={
                    selectedTrainees.length > 0 &&
                    selectedTrainees.length < filteredTrainees.length
                  }
                  onChange={handleSelectAllTrainees}
                  size="small"
                />
              </TableCell>
              <TableCell align="center" width={40}>
                #
              </TableCell>
              <TableCell>Trainee Name</TableCell>
              <TableCell>Mobile No</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Graduated At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainees.length > 0 ? (
              filteredTrainees.map((trainee, index) => {
                const isSelected = selectedTrainees.includes(trainee.id);
                return (
                  <TableRow
                    key={trainee.id}
                    sx={{ bgcolor: isSelected ? "#f0f7ff" : "inherit" }}
                    selected={isSelected}
                  >
                    <TableCell padding="checkbox" align="center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectTrainee(trainee.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {trainee.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{trainee.mobileNo}</TableCell>
                    <TableCell>{trainee.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={trainee.institute.split("(")[0].trim()}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>{trainee.course}</TableCell>
                    <TableCell>{trainee.graduatedAt}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No trainees found for the selected criteria
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          color="error"
          onClick={onClose}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={selectedTrainees.length === 0 || sending}
        >
          {sending
            ? "Sending..."
            : `Send to ${selectedTrainees.length > 0 ? `(${selectedTrainees.length})` : ""}`}
        </Button>
      </Box>
    </Box>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
TraineeTracerSurvey.propTypes = traineeTracerSurveyPropTypes;

export default TraineeTracerSurvey;
