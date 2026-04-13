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

const Notification = () => {
  const [search, setSearch] = useState("");

  const notifications = [
    {
      id: 1,
      subject: "Notification",
      message:
        "All registered training providers must comply with this notification with immediate effect",
      date: "2025-08-29 16:15:24",
    },
    {
      id: 2,
      subject: "System Update",
      message: "The training portal will undergo maintenance this weekend.",
      date: "2025-09-02 10:20:10",
    },
  ];

  const filteredData = notifications.filter(
    (item) =>
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={2}>
        List of Send Notification
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
              <TableCell>Subject</TableCell>
              <TableCell>Notification</TableCell>
              <TableCell>Send Date</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell>{row.message}</TableCell>
                  <TableCell>{row.date}</TableCell>
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

export default Notification;
