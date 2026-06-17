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

const CurriculumPublication = () => {
  const [filters, setFilters] = useState({
    sector: "All",
    search: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allCurriculums, setAllCurriculums] = useState([]);
  const [filteredCurriculums, setFilteredCurriculums] = useState([]);

  // Sample data from the image
  const sampleData = [
    {
      id: 1,
      sector: "ICT",
      occupation: "Computer Systems and Network Technician",
      qualificationLevel: "BQF Certificate 2",
      validity: "April 1st 2024",
      fileAttachment: "ICT_Computer_Systems_Network_Technician.pdf",
    },
    {
      id: 2,
      sector: "Zorig Chusum",
      occupation: "Patra",
      qualificationLevel: "BQF Diploma",
      validity: "August 8th 2024",
      fileAttachment: "Zorig_Chusum_Patra.pdf",
    },
    {
      id: 3,
      sector: "Zorig Chusum",
      occupation: "Troezo",
      qualificationLevel: "BQF Diploma",
      validity: "August 8th 2024",
      fileAttachment: "Zorig_Chusum_Troezo.pdf",
    },
    {
      id: 4,
      sector: "Manufacturing",
      occupation: "HVAC Technician",
      qualificationLevel: "BQF Certificate 3",
      validity: "August 8th 2024",
      fileAttachment: "Manufacturing_HVAC_Technician.pdf",
    },
    {
      id: 5,
      sector: "Manufacturing",
      occupation: "Refrigeration and Air Conditioning Technician",
      qualificationLevel: "BQF Certificate 2",
      validity: "August 8th 2024",
      fileAttachment: "Manufacturing_Refrigeration_Air_Conditioning.pdf",
    },
    {
      id: 6,
      sector: "Manufacturing",
      occupation: "Metal Art and Fabrication Technician",
      qualificationLevel: "BQF Certificate 2",
      validity: "August 8th 2024",
      fileAttachment: "Manufacturing_Metal_Art_Fabrication.pdf",
    },
    {
      id: 7,
      sector: "Power",
      occupation: "Solar Power Technician",
      qualificationLevel: "BQF Certificate 2",
      validity: "August 8th 2024",
      fileAttachment: "Power_Solar_Technician.pdf",
    },
    {
      id: 8,
      sector: "Zorig Chusum",
      occupation: "Thagzo",
      qualificationLevel: "BQF Certificate 2",
      validity: "November 15th 2023",
      fileAttachment: "Zorig_Chusum_Thagzo.pdf",
    },
    {
      id: 9,
      sector: "Zorig Chusum",
      occupation: "Shagzo",
      qualificationLevel: "BQF Certificate 2",
      validity: "October 9th 2023",
      fileAttachment: "Zorig_Chusum_Shagzo.pdf",
    },
  ];

  // Get unique sectors from data
  const sectors = ["All", ...new Set(sampleData.map(item => item.sector))];

  // Load data on component mount
  useEffect(() => {
    setAllCurriculums(sampleData);
    setFilteredCurriculums(sampleData);
  }, []);

  // Apply filters whenever allCurriculums, sector, or search changes
  useEffect(() => {
    if (allCurriculums.length > 0) {
      applyFilters();
    }
  }, [allCurriculums, filters.sector, filters.search]);

  const applyFilters = () => {
    let result = [...allCurriculums];

    if (filters.sector && filters.sector !== "All") {
      result = result.filter((item) => item.sector === filters.sector);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.occupation.toLowerCase().includes(searchLower) ||
          item.sector.toLowerCase().includes(searchLower) ||
          item.qualificationLevel.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCurriculums(result);
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
    setFilteredCurriculums(allCurriculums);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCurriculums = filteredCurriculums.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Curriculum
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
              <TableCell sx={{ fontWeight: 600 }}>Occupation</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Qualification Level</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Validity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>File Attachment(s)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedCurriculums.length > 0 ? (
              paginatedCurriculums.map((item, index) => {
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.sector}</TableCell>
                    <TableCell>{item.occupation}</TableCell>
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
                        Download
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
          Showing {paginatedCurriculums.length} of {filteredCurriculums.length}{" "}
          entries
        </Typography>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredCurriculums.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Paper>
  );
};

export default CurriculumPublication;