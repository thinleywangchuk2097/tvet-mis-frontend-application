import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Grid,
  Typography,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const ApplyTot = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [courses, setCourses] = useState([
    // Example data, initially empty
    // You can add objects like below
    // {
    //   applicationNo: "123456",
    //   courseName: "Robotics",
    //   applicationDate: "2026-03-01",
    //   courseDate: "2026-03-15",
    // },
  ]);

  const filteredCourses = courses.filter(
    (course) =>
      course.applicationNo?.includes(search) ||
      course.courseName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Course Detail List
      </Typography>

      {/* Search */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2, justifyContent: "flex-end" }}>
        <Grid item xs={4} sm={3} md={3}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              endAdornment: <SearchIcon />,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Application Date</TableCell>
              <TableCell>Course Date</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => (
                  <TableRow key={course.applicationNo}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{course.applicationNo}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.applicationDate}</TableCell>
                    <TableCell>{course.courseDate}</TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" color="primary">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Paper>
  );
};

export default ApplyTot;