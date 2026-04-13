import React, { useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const MonitoringReport = () => {
  const [search, setSearch] = useState("");

  const reports = []; // empty dummy data

  const filteredData = reports.filter(
    (item) =>
      item.applicationNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.instituteName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Monitoring Report
      </Typography>

      {/* Search */}
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": {
              border: "1px solid #ccc",
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Institute Name</TableCell>
              <TableCell>Date Of Visit</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.applicationNo}</TableCell>
                  <TableCell>{row.instituteName}</TableCell>
                  <TableCell>{row.dateOfVisit}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default MonitoringReport;