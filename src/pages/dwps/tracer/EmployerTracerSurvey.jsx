import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CommonService from "../../../api/services/internal/common/CommonService";

const EmployerTracerSurvey = ({ open, onClose, survey, onSend }) => {
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [industryFilter, setIndustryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      setSectors(response.data);
      console.log("Sectors:", response.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };
  // Sample employer data 
  const [employers] = useState([
    {
      id: "EMP001",
      name: "Bhutan Power Corporation",
      contactPerson: "Tshering Dorji",
      mobileNo: "17112233",
      email: "hr@bpc.bt",
      sectorId: 2, // Power sector ID
      location: "Thimphu",
      statusId: 1,
    },
    {
      id: "EMP002",
      name: "Bhutan Telecom",
      contactPerson: "Karma Dema",
      mobileNo: "17223344",
      email: "careers@bt.bt",
      sectorId: 5, // ICT sector ID
      location: "Thimphu",
      statusId: 1,
    },
    {
      id: "EMP003",
      name: "Druk Air Corporation",
      contactPerson: "Sonam Wangdi",
      mobileNo: "17334455",
      email: "hr@drukair.bt",
      sectorId: 7, // Transportation sector ID
      location: "Paro",
      statusId: 1,
    },
    {
      id: "EMP004",
      name: "Bank of Bhutan",
      contactPerson: "Pema Choden",
      mobileNo: "17445566",
      email: "recruitment@bob.bt",
      sectorId: 10, // Business & Finance sector ID
      location: "Thimphu",
      statusId: 1,
    },
    {
      id: "EMP005",
      name: "Tashi Group",
      contactPerson: "Jigme Namgyel",
      mobileNo: "17556677",
      email: "hr@tashi.bt",
      sectorId: 15, // Service sector ID
      location: "Phuentsholing",
      statusId: 1,
    },
    {
      id: "EMP006",
      name: "Hotel Druk",
      contactPerson: "Dechen Wangmo",
      mobileNo: "17667788",
      email: "careers@hoteldruk.bt",
      sectorId: 6, // Tourism & Hospitality sector ID
      location: "Thimphu",
      statusId: 1,
    },
  ]);

  // Helper function to get sector name from sectorId
  const getSectorName = (sectorId) => {
    const sector = sectors.find((s) => s.id === sectorId);
    return sector ? sector.sectorName : "Unknown Sector";
  };

  // Filter employers based on industry and search
  const filteredEmployers = employers.filter((employer) => {
    const matchesIndustry = industryFilter
      ? employer.sectorId === parseInt(industryFilter)
      : true;
    const matchesSearch = search
      ? employer.name.toLowerCase().includes(search.toLowerCase()) ||
        employer.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        employer.email.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesIndustry && matchesSearch;
  });

  const handleSelectAllEmployers = (event) => {
    if (event.target.checked) {
      setSelectedEmployers(filteredEmployers.map((e) => e.id));
    } else {
      setSelectedEmployers([]);
    }
  };

  const handleSelectEmployer = (id) => {
    setSelectedEmployers((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSend = async () => {
    if (selectedEmployers.length === 0) {
      alert("Please select at least one employer to send the survey to");
      return;
    }

    setSending(true);
    try {
      const selectedEmployerDetails = employers.filter((e) =>
        selectedEmployers.includes(e.id),
      );
      await onSend(selectedEmployerDetails);
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
          Select Employers to Send Survey
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

      {/* Industry and Search Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Sector</InputLabel>
              <Select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                label="Filter by Sector"
              >
                <MenuItem value="">All Sectors</MenuItem>
                {sectors
                  .filter((sector) => sector.isActive === "Y") // Only show active sectors
                  .map((sector) => (
                    <MenuItem key={sector.id} value={sector.id}>
                      {sector.sectorName}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Search by Employer Name or Contact Person"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </Grid>
        </Grid>
      </Box>

      {/* Selected Employers Count */}
      {selectedEmployers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${selectedEmployers.length} employer(s) selected`}
            onDelete={() => setSelectedEmployers([])}
            color="primary"
            size="small"
          />
        </Box>
      )}

      {/* Employers Table */}
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
                    filteredEmployers.length > 0 &&
                    selectedEmployers.length === filteredEmployers.length
                  }
                  indeterminate={
                    selectedEmployers.length > 0 &&
                    selectedEmployers.length < filteredEmployers.length
                  }
                  onChange={handleSelectAllEmployers}
                  size="small"
                />
              </TableCell>
              <TableCell align="center" width={40}>
                #
              </TableCell>
              <TableCell>Employer Name</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Mobile No</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployers.length > 0 ? (
              filteredEmployers.map((employer, index) => {
                const isSelected = selectedEmployers.includes(employer.id);
                return (
                  <TableRow
                    key={employer.id}
                    sx={{ bgcolor: isSelected ? "#f0f7ff" : "inherit" }}
                    selected={isSelected}
                  >
                    <TableCell padding="checkbox" align="center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectEmployer(employer.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {employer.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{employer.contactPerson}</TableCell>
                    <TableCell>{employer.mobileNo}</TableCell>
                    <TableCell>{employer.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getSectorName(employer.sectorId)}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>{employer.location}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No employers found
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
          disabled={selectedEmployers.length === 0 || sending}
        >
          {sending
            ? "Sending..."
            : `Send to ${selectedEmployers.length > 0 ? `(${selectedEmployers.length})` : ""}`}
        </Button>
      </Box>
    </Box>
  );
};

export default EmployerTracerSurvey;
