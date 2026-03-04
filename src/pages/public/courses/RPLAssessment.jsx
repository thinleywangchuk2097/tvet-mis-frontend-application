import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  TablePagination,
  InputAdornment,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";

const rowsData = [
  {
    id: 1,
    provider: "Gyalyong Driving Training Institute",
    course: "Professional Driving",
    level: "BQF Certificate 2",
    funding: "Self Funded",
    fee: 8000,
    applicationDate: "1st-Feb-2026 to 24th-Feb-2026",
    courseDate: "28th-Mar-2026 to 4th-Apr-2026",
    description: "One Week Course",
  },
  {
    id: 2,
    provider: "Technical Training Institute Rangjung",
    course: "Domestic Wiring",
    level: "BQF Certificate 2",
    funding: "RGoB (National Skills Development)",
    fee: 350,
    applicationDate: "11th-Feb-2026 to 23rd-Feb-2026",
    courseDate: "24th-Feb-2026 to 4th-Mar-2026",
    description: "RPL Assessment",
  },
];

const RPLAssessment = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredRows = rowsData.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  const handleApply = (row) => {
    console.log("Applying for:", row);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #dcdcdc",
        }}
      >
        {/* Header */}
        <Box mb={2}>
          <Typography variant="h5" fontWeight={700}>
            RPL Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            List of registered RPL training assessments
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {/* Search */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRows.length} entries
          </Typography>
          <TextField
            placeholder="Search..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {/* Table */}
        <TableContainer sx={{ borderRadius: 2 }}>
          <Table
            size="small"
            sx={{
              border: "1px solid #e0e0e0",
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                {[
                  "#",
                  "Training Provider",
                  "Course",
                  "Level",
                  "Funding",
                  "Fee",
                  "Application Date",
                  "Course Date",
                  "Description",
                  "Action",
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      fontWeight: 600,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {row.provider}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {row.course}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {row.level}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      <Chip
                        label={row.funding}
                        size="small"
                        color={
                          row.funding === "Self Funded" ? "default" : "primary"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      Nu. {row.fee.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {row.applicationDate}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {row.courseDate}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                      {row.description}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ border: "1px solid #e0e0e0" }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                      /*   endIcon={<SendIcon />} */
                        onClick={() => handleApply(row)}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                        }}
                      >
                        Apply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10]}
          sx={{ mt: 1 }}
        />
      </Paper>
    </Box>
  );
};

export default RPLAssessment;
