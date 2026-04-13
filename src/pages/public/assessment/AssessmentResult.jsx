import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Card,
  CardContent,
  Avatar,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VerifiedIcon from "@mui/icons-material/Verified";

const AssessmentResult = () => {
  const [filters, setFilters] = useState({
    citizenId: "",
    assessmentType: "",
    certificationLevel: "",
  });

  const [searchPerformed, setSearchPerformed] = useState(false);
  const [results, setResults] = useState([]);

  // Mock data for demonstration
  const mockResults = [
    {
      id: 1,
      citizenId: "11505001234",
      name: "Tashi Wangmo",
      assessmentType: "National assessment",
      certificationLevel: "BQF certificate 2",
      assessmentDate: "2024-02-15",
      status: "Pass",
      score: "78%",
      competency: "Competent",
    },
    {
      id: 2,
      citizenId: "11506005678",
      name: "Karma Dorji",
      assessmentType: "RPL assessment",
      certificationLevel: "BQF certificate 3",
      assessmentDate: "2024-02-10",
      status: "Pass",
      score: "85%",
      competency: "Highly Competent",
    },
    {
      id: 3,
      citizenId: "11507008901",
      name: "Sonam Dema",
      assessmentType: "National assessment",
      certificationLevel: "BQF diploma",
      assessmentDate: "2024-02-05",
      status: "Fail",
      score: "45%",
      competency: "Not Yet Competent",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    // Filter mock data based on search criteria
    const filtered = mockResults.filter((item) => {
      const matchCitizenId =
        !filters.citizenId ||
        item.citizenId.toLowerCase().includes(filters.citizenId.toLowerCase());
      const matchAssessmentType =
        !filters.assessmentType ||
        item.assessmentType === filters.assessmentType;
      const matchCertificationLevel =
        !filters.certificationLevel ||
        item.certificationLevel === filters.certificationLevel;

      return matchCitizenId && matchAssessmentType && matchCertificationLevel;
    });

    setResults(filtered);
    setSearchPerformed(true);
  };

  const handleReset = () => {
    setFilters({
      citizenId: "",
      assessmentType: "",
      certificationLevel: "",
    });
    setResults([]);
    setSearchPerformed(false);
  };

  const getStatusChip = (status) => {
    const color = status === "Pass" ? "success" : "error";
    return <Chip label={status} color={color} size="small" />;
  };

  const getCompetencyChip = (competency) => {
    let color = "default";
    if (competency === "Competent") color = "primary";
    if (competency === "Highly Competent") color = "success";
    if (competency === "Not Yet Competent") color = "error";
    return (
      <Chip label={competency} color={color} size="small" variant="outlined" />
    );
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2 },
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: "primary.main", mr: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            Assessment Result
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Search Filters */}
        <Grid container spacing={3} alignItems="flex-end">
          {/* Citizen ID No */}
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              label="Citizen ID No"
              fullWidth
              size="small"
              name="citizenId"
              value={filters.citizenId}
              onChange={handleInputChange}
              placeholder="Enter Citizen ID"
              InputProps={{
                startAdornment: (
                  <PersonIcon
                    sx={{ color: "action.active", mr: 1, fontSize: 20 }}
                  />
                ),
              }}
            />
          </Grid>

          {/* Assessment Type */}
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Assessment Type"
              fullWidth
              size="small"
              name="assessmentType"
              value={filters.assessmentType}
              onChange={handleInputChange}
            >
              <MenuItem value="">-select-</MenuItem>
              <MenuItem value="National assessment">
                National assessment
              </MenuItem>
              <MenuItem value="RPL assessment">RPL assessment</MenuItem>
            </TextField>
          </Grid>

          {/* Certification Level */}
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Certification Level"
              fullWidth
              size="small"
              name="certificationLevel"
              value={filters.certificationLevel}
              onChange={handleInputChange}
            >
              <MenuItem value="">-select-</MenuItem>
              <MenuItem value="BQF certificate 1">BQF certificate 1</MenuItem>
              <MenuItem value="BQF certificate 2">BQF certificate 2</MenuItem>
              <MenuItem value="BQF certificate 3">BQF certificate 3</MenuItem>
              <MenuItem value="BQF diploma">BQF diploma</MenuItem>
              <MenuItem value="certificate">Certificate</MenuItem>
            </TextField>
          </Grid>

          {/* Search Button */}
          <Grid item size={{ xs: 12, md: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
                sx={{ height: 40 }}
              >
                Search
              </Button>
              {searchPerformed && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleReset}
                  sx={{ height: 40 }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Search Summary */}
        {searchPerformed && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for
              your search
            </Typography>
          </Box>
        )}

        {/* Results Table */}
        {searchPerformed && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 3 }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>
                    <strong>Citizen ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Assessment Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Certification Level</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Assessment Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Score</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Competency</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length > 0 ? (
                  results.map((result) => (
                    <TableRow key={result.id} hover>
                      <TableCell>{result.citizenId}</TableCell>
                      <TableCell>{result.name}</TableCell>
                      <TableCell>{result.assessmentType}</TableCell>
                      <TableCell>{result.certificationLevel}</TableCell>
                      <TableCell>{result.assessmentDate}</TableCell>
                      <TableCell>{result.score}</TableCell>
                      <TableCell>{getStatusChip(result.status)}</TableCell>
                      <TableCell>
                        {getCompetencyChip(result.competency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <VerifiedIcon
                          sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                        />
                        <Typography color="text.secondary">
                          No assessment results found
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Try adjusting your search criteria
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary Cards (Optional - can be removed if not needed) */}
        {searchPerformed && results.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    color="text.secondary"
                    gutterBottom
                    variant="caption"
                  >
                    Total Assessments
                  </Typography>
                  <Typography variant="h4">{results.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    color="text.secondary"
                    gutterBottom
                    variant="caption"
                  >
                    Pass Rate
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(
                      (results.filter((r) => r.status === "Pass").length /
                        results.length) *
                        100,
                    )}
                    %
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    color="text.secondary"
                    gutterBottom
                    variant="caption"
                  >
                    Average Score
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(
                      results.reduce((acc, r) => acc + parseInt(r.score), 0) /
                        results.length,
                    )}
                    %
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default AssessmentResult;
