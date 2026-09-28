import React, { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";

const MonitoringReport = () => {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call once MonitoringReportService is available
      setReports([]);
    } catch (error) {
      console.error("Failed to load monitoring reports:", error);
      toast.error("Failed to load monitoring reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredData = reports.filter(
    (item) =>
      item.applicationNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.instituteName?.toLowerCase().includes(search.toLowerCase()),
  );

  // ============================================================
  // ✅ FIX: Extract nested ternary into an independent render fn
  // ============================================================
  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={4} align="center">
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 2,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} align="center">
            No data available
          </TableCell>
        </TableRow>
      );
    }

    return filteredData.map((row, index) => (
      <TableRow key={row.id || index}>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{row.applicationNo}</TableCell>
        <TableCell>{row.instituteName}</TableCell>
        <TableCell>{row.dateOfVisit}</TableCell>
      </TableRow>
    ));
  };

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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
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

          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default MonitoringReport;
