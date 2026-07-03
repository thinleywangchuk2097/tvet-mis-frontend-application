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
  Chip,
  IconButton,
  Tooltip,
  Stack
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const NcsPublication = () => {
  const [filters, setFilters] = useState({
    sector: "All",
    search: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allStandards, setAllStandards] = useState([]);
  const [filteredStandards, setFilteredStandards] = useState([]);

  // Static sample data with NCS structure
  const sampleData = [
    {
      id: 1,
      sector: "Construction",
      occupationTitle: "Mason",
      ncsCode: "BQF-2024-001",
      qualificationLevel: "Certificate Level I",
      validity: "2027-03-25",
      courseTitle: "Masonry Course",
      units: [
        { unitCode: "BQF-2024-001", unitTitle: "Basic Masonry Techniques" },
        { unitCode: "BQF-2024-002", unitTitle: "Advanced Masonry Techniques" }
      ],
      documents: [
        { name: "Masonry_NCS.pdf", documentId: 1, contentType: "application/pdf" }
      ]
    },
    {
      id: 2,
      sector: "Construction",
      occupationTitle: "Plumber",
      ncsCode: "BQF-2026-001",
      qualificationLevel: "Certificate Level I",
      validity: "2027-03-25",
      courseTitle: "Plumbing Course",
      units: [
        { unitCode: "BQF-2026-001", unitTitle: "Basic Plumbing Systems" },
        { unitCode: "BQF-2026-002", unitTitle: "Advanced Plumbing Systems" },
        { unitCode: "BQF-2026-003", unitTitle: "Pipe Fitting Techniques" }
      ],
      documents: [
        { name: "Plumbing_NCS.pdf", documentId: 2, contentType: "application/pdf" }
      ]
    },
    {
      id: 3,
      sector: "Construction",
      occupationTitle: "Carpenter",
      ncsCode: "BQF-2025-001",
      qualificationLevel: "Certificate Level II",
      validity: "2027-06-30",
      courseTitle: "Carpentry Course",
      units: [
        { unitCode: "BQF-2025-001", unitTitle: "Basic Carpentry Skills" },
        { unitCode: "BQF-2025-002", unitTitle: "Advanced Woodworking" }
      ],
      documents: [
        { name: "Carpentry_NCS.pdf", documentId: 3, contentType: "application/pdf" }
      ]
    },
    {
      id: 4,
      sector: "Information Technology",
      occupationTitle: "Software Developer",
      ncsCode: "BQF-2023-001",
      qualificationLevel: "Diploma",
      validity: "2027-12-31",
      courseTitle: "Full Stack Development",
      units: [
        { unitCode: "BQF-2023-001", unitTitle: "Frontend Development" },
        { unitCode: "BQF-2023-002", unitTitle: "Backend Development" },
        { unitCode: "BQF-2023-003", unitTitle: "Database Management" },
        { unitCode: "BQF-2023-004", unitTitle: "DevOps Fundamentals" }
      ],
      documents: [
        { name: "Software_Developer_NCS.pdf", documentId: 4, contentType: "application/pdf" }
      ]
    },
    {
      id: 5,
      sector: "Manufacturing",
      occupationTitle: "Welder",
      ncsCode: "BQF-2022-001",
      qualificationLevel: "Certificate Level II",
      validity: "2026-12-31",
      courseTitle: "Welding Course",
      units: [
        { unitCode: "BQF-2022-001", unitTitle: "Basic Welding" },
        { unitCode: "BQF-2022-002", unitTitle: "Advanced Welding" }
      ],
      documents: [
        { name: "Welding_NCS.pdf", documentId: 5, contentType: "application/pdf" }
      ]
    },
    {
      id: 6,
      sector: "Healthcare",
      occupationTitle: "Nurse",
      ncsCode: "BQF-2021-001",
      qualificationLevel: "Certificate Level III",
      validity: "2028-06-30",
      courseTitle: "Nursing Course",
      units: [
        { unitCode: "BQF-2021-001", unitTitle: "Basic Nursing" },
        { unitCode: "BQF-2021-002", unitTitle: "Advanced Nursing" }
      ],
      documents: [
        { name: "Nursing_NCS.pdf", documentId: 6, contentType: "application/pdf" }
      ]
    },
    {
      id: 7,
      sector: "Agriculture",
      occupationTitle: "Farmer",
      ncsCode: "BQF-2020-001",
      qualificationLevel: "Certificate Level I",
      validity: "2029-12-31",
      courseTitle: "Farming Course",
      units: [
        { unitCode: "BQF-2020-001", unitTitle: "Basic Farming" }
      ],
      documents: [
        { name: "Farming_NCS.pdf", documentId: 7, contentType: "application/pdf" }
      ]
    }
  ];

  // Get unique sectors from data
  const sectors = ["All", ...new Set(sampleData.map(item => item.sector))];

  // Load data on component mount
  useEffect(() => {
    setAllStandards(sampleData);
    setFilteredStandards(sampleData);
  }, []);

  // Apply filters whenever allStandards, sector, or search changes
  useEffect(() => {
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
          item.sector.toLowerCase().includes(searchLower) ||
          item.courseTitle.toLowerCase().includes(searchLower) ||
          item.units.some(unit =>
            unit.unitCode.toLowerCase().includes(searchLower) ||
            unit.unitTitle.toLowerCase().includes(searchLower)
          )
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

  // Helper function to get file icon
  const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFileIcon />;
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <PictureAsPdfIcon color="error" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) return <ImageIcon color="primary" />;
    if (['doc', 'docx'].includes(extension)) return <DescriptionIcon color="primary" />;
    if (['xls', 'xlsx'].includes(extension)) return <DescriptionIcon color="success" />;
    return <InsertDriveFileIcon />;
  };

  // Handle file view
  const handleFileView = (file) => {
    if (file.documentId) {
      // Open file in new tab (would call API in real implementation)
      window.open(`/api/v1/user/management/ncs/download-file/${file.documentId}`, '_blank');
    } else if (file.url) {
      window.open(file.url, '_blank');
    } else if (file.content) {
      const fileUrl = `data:${file.contentType || 'application/octet-stream'};base64,${file.content}`;
      window.open(fileUrl, '_blank');
    } else {
      alert("File URL not available");
    }
  };

  // Handle file download
  const handleFileDownload = (file) => {
    if (file.documentId) {
      // Download file (would call API in real implementation)
      const link = document.createElement('a');
      link.href = `/api/v1/user/management/ncs/download-file/${file.documentId}`;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.content) {
      const link = document.createElement('a');
      link.href = `data:${file.contentType || 'application/octet-stream'};base64,${file.content}`;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("File content not available");
    }
  };

  // Render unit codes
  const renderUnitCodes = (units) => {
    if (!units || units.length === 0) return "N/A";
    return units.map((unit, idx) => (
      <Box key={`code-${idx}`} sx={{ mb: 0.5 }}>
        <Chip
          label={unit.unitCode}
          size="small"
          color="secondary"
          variant="outlined"
        />
        {idx < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
      </Box>
    ));
  };

  // Render unit titles
  const renderUnitTitles = (units) => {
    if (!units || units.length === 0) return "N/A";
    return units.map((unit, idx) => (
      <Box key={`title-${idx}`} sx={{ mb: 0.5 }}>
        <Typography variant="body2">
          {unit.unitTitle}
        </Typography>
        {idx < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
      </Box>
    ));
  };

  // Render file attachments
  const renderFileAttachments = (documents) => {
    if (!documents || documents.length === 0) {
      return (
        <Typography variant="caption" color="textSecondary">
          No files
        </Typography>
      );
    }
    return (
      <Stack direction="column" spacing={0.5}>
        {documents.map((file, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getFileIcon(file.name)}
            <Typography variant="caption" sx={{
              maxWidth: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {file.name || `File ${index + 1}`}
            </Typography>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => handleFileView(file)}
                sx={{ p: 0.3 }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={() => handleFileDownload(file)}
                sx={{ p: 0.3 }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Stack>
    );
  };

  const paginatedStandards = filteredStandards.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        National Competency Standards (NCS)
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
              placeholder="Search by Occupation, NCS Code, Course Title..."
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
              <TableCell sx={{ fontWeight: 600 }}>BQF Level</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Course Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Validity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unit Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unit Title</TableCell>
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
                    <TableCell>
                      <Chip
                        label={item.ncsCode}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.qualificationLevel}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.courseTitle}</TableCell>
                    <TableCell>{item.validity}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                        {renderUnitCodes(item.units)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {renderUnitTitles(item.units)}
                    </TableCell>
                    <TableCell>
                      {renderFileAttachments(item.documents)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
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