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
import AttachFileIcon from "@mui/icons-material/AttachFile";

const NcsPublication = () => {
  const [filters, setFilters] = useState({
    sector: "All",
    search: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allStandards, setAllStandards] = useState([]);
  const [filteredStandards, setFilteredStandards] = useState([]);

  // Sample data with multiple sectors
  const sampleData = [
    {
      id: 1,
      sector: "Agriculture & Forestry",
      occupationTitle: "Seed Production Technician",
      ncsCode: "6113",
      qualificationLevel: "BQF Certificate 2",
      validity: "8th August 2025",
      fileAttachment: "NCS for Seed Production Technician.pdf",
    },
    {
      id: 2,
      sector: "Agriculture & Forestry",
      occupationTitle: "Ornamental Horticulturist",
      ncsCode: "6113",
      qualificationLevel: "BQF Certificate 3",
      validity: "30th May 2030",
      fileAttachment: "Finalized Validated NCS for Ornamental Horticulture.pdf",
    },
    {
      id: 3,
      sector: "Agriculture & Forestry",
      occupationTitle: "Power Tiller Mechanic",
      ncsCode: "7412",
      qualificationLevel: "BQF Certificate 2",
      validity: "11th April 2025",
      fileAttachment: "NCS for Power Tiller Technician-2022.pdf",
    },
    {
      id: 4,
      sector: "Agriculture & Forestry",
      occupationTitle: "Food Processing Technician",
      ncsCode: "8160",
      qualificationLevel: "BQF Certificate 2",
      validity: "11th August 2025",
      fileAttachment: "NCS for Food Processing Technician-2022.pdf",
    },
    {
      id: 5,
      sector: "Agriculture & Forestry",
      occupationTitle: "Farm Machinery Technician",
      ncsCode: "7233",
      qualificationLevel: "BQF Certificate 2",
      validity: "15th September 2017",
      fileAttachment: "NCS_Farm_Machinery_Technician_2014.pdf",
    },
    {
      id: 6,
      sector: "Agriculture & Forestry",
      occupationTitle: "Power Tiller Operator",
      ncsCode: "7412",
      qualificationLevel: "BQF Certificate 3",
      validity: "19th August 2019",
      fileAttachment: "Power Tiller Operator_2016.pdf",
    },
    {
      id: 7,
      sector: "Agriculture & Forestry",
      occupationTitle: "Forester",
      ncsCode: "6210",
      qualificationLevel: "BQF Certificate 3",
      validity: "4th February 2030",
      fileAttachment: "Validated NCS for Forester.pdf",
    },
    {
      id: 8,
      sector: "Agriculture & Forestry",
      occupationTitle: "Mushroom Farmer",
      ncsCode: "6113",
      qualificationLevel: "BQF Certificate 2",
      validity: "8th October 2021",
      fileAttachment: "Agriculturist (mushroom farming).pdf",
    },
    {
      id: 9,
      sector: "Agriculture & Forestry",
      occupationTitle: "Poultry Farmer",
      ncsCode: "6123",
      qualificationLevel: "BQF Certificate 2",
      validity: "8th July 2021",
      fileAttachment: "Agriculturist (poultry farming).pdf",
    },
    {
      id: 10,
      sector: "Manufacturing",
      occupationTitle: "CNC Machine Operator",
      ncsCode: "7223",
      qualificationLevel: "BQF Certificate 3",
      validity: "15th March 2026",
      fileAttachment: "NCS for CNC Machine Operator.pdf",
    },
    {
      id: 11,
      sector: "Manufacturing",
      occupationTitle: "Quality Control Inspector",
      ncsCode: "8132",
      qualificationLevel: "BQF Certificate 4",
      validity: "20th June 2027",
      fileAttachment: "NCS for Quality Control Inspector.pdf",
    },
    {
      id: 12,
      sector: "Information Technology",
      occupationTitle: "Software Developer",
      ncsCode: "2512",
      qualificationLevel: "BQF Certificate 5",
      validity: "10th December 2028",
      fileAttachment: "NCS for Software Developer.pdf",
    },
    {
      id: 13,
      sector: "Information Technology",
      occupationTitle: "Network Administrator",
      ncsCode: "2523",
      qualificationLevel: "BQF Certificate 4",
      validity: "5th September 2026",
      fileAttachment: "NCS for Network Administrator.pdf",
    },
    {
      id: 14,
      sector: "Healthcare",
      occupationTitle: "Medical Laboratory Technician",
      ncsCode: "3212",
      qualificationLevel: "BQF Certificate 3",
      validity: "18th November 2025",
      fileAttachment: "NCS for Medical Laboratory Technician.pdf",
    },
    {
      id: 15,
      sector: "Healthcare",
      occupationTitle: "Pharmacy Technician",
      ncsCode: "3221",
      qualificationLevel: "BQF Certificate 4",
      validity: "22nd February 2029",
      fileAttachment: "NCS for Pharmacy Technician.pdf",
    },
    {
      id: 16,
      sector: "Construction",
      occupationTitle: "Site Supervisor",
      ncsCode: "3113",
      qualificationLevel: "BQF Certificate 3",
      validity: "14th April 2027",
      fileAttachment: "NCS for Site Supervisor.pdf",
    },
    {
      id: 17,
      sector: "Construction",
      occupationTitle: "Building Inspector",
      ncsCode: "3122",
      qualificationLevel: "BQF Certificate 4",
      validity: "30th August 2028",
      fileAttachment: "NCS for Building Inspector.pdf",
    },
  ];

  // Get unique sectors from data
  const sectors = ["All", ...new Set(sampleData.map(item => item.sector))];

  // Load data on component mount - FIXED: Load data and apply filters
  useEffect(() => {
    setAllStandards(sampleData);
    setFilteredStandards(sampleData);
  }, []);

  // Apply filters whenever allStandards, sector, or search changes
  useEffect(() => {
    // Only apply filters if allStandards has data
    if (allStandards.length > 0) {
      applyFilters();
    }
  }, [allStandards, filters.sector, filters.search]);

  const applyFilters = () => {
    let result = [...allStandards];

    if (filters.sector && filters.sector !== "All") {
      result = result.filter((item) => item.sector === filters.sector);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.occupationTitle.toLowerCase().includes(searchLower) ||
          item.ncsCode.toLowerCase().includes(searchLower) ||
          item.sector.toLowerCase().includes(searchLower)
      );
    }

    setFilteredStandards(result);
    setPage(0);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      sector: "All",
      search: "",
    });
    setFilteredStandards(allStandards);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedStandards = filteredStandards.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        National Competency Standards
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sector</InputLabel>
            <Select
              name="sector"
              value={filters.sector}
              onChange={handleFilterChange}
              label="Sector"
            >
              {sectors.map((sector) => (
                <MenuItem key={sector} value={sector}>
                  {sector}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Show</InputLabel>
            <Select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              label="Show"
            >
              <MenuItem value={10}>10 entries</MenuItem>
              <MenuItem value={25}>25 entries</MenuItem>
              <MenuItem value={50}>50 entries</MenuItem>
              <MenuItem value={100}>100 entries</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <TextField
              size="small"
              placeholder="Search..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              sx={{ flex: 1, maxWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ddd",
            "& th, & td": {
              border: "1px solid #ddd",
              padding: "10px 12px",
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f7fa" }}>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sector</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Occupation Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>NCS Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Qualification Level</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Validity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>File Attachment(s)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedStandards.length > 0 ? (
              paginatedStandards.map((item, index) => {
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.sector}</TableCell>
                    <TableCell>{item.occupationTitle}</TableCell>
                    <TableCell>{item.ncsCode}</TableCell>
                    <TableCell>{item.qualificationLevel}</TableCell>
                    <TableCell>{item.validity}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontSize: "0.75rem",
                          color: "#1976d2",
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        <AttachFileIcon sx={{ fontSize: "16px" }} />
                        {item.fileAttachment}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {filters.search || filters.sector !== "All"
                      ? "No records found matching your filters"
                      : "No data available"}
                  </Typography>
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
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedStandards.length} of {filteredStandards.length}{" "}
          entries
        </Typography>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredStandards.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Paper>
  );
};

export default NcsPublication;