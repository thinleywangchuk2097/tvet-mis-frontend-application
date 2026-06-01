import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TablePagination,
  Grid,
  Typography,
  Link,
} from "@mui/material";

const AddTraineeIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [data] = useState([
    {
      id: 1,
      applicationNo: "24000017",
      courseName: "Instructional Methodology & Pedagogy",
      applicationDate: "February 27th 2023 to March 9th 2023",
      courseDate: "March 13th 2023 to March 25th 2023",
    },
    {
      id: 2,
      applicationNo: "24000016",
      courseName: "Instructional Methodology & Pedagogy",
      applicationDate: "May 6th 2022 to May 23rd 2022",
      courseDate: "June 6th 2022 to June 18th 2022",
    },
    {
      id: 3,
      applicationNo: "24000018",
      courseName: "Curriculum Development",
      applicationDate: "March 1st 2024 to March 15th 2024",
      courseDate: "March 20th 2024 to April 5th 2024",
    },
    {
      id: 4,
      applicationNo: "24000019",
      courseName: "Assessment Design",
      applicationDate: "April 10th 2024 to April 25th 2024",
      courseDate: "May 1st 2024 to May 15th 2024",
    },
  ]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleApplicationClick = (applicationNo) => {
    // Handle the click event - you can navigate to a details page or open a dialog
    console.log(`Application ${applicationNo} clicked`);
    // Example: navigate to details page
    // navigate(`/trainee-details/${applicationNo}`);
  };

  const filteredData = data.filter(
    (item) =>
      item.applicationNo.includes(search) ||
      item.courseName.toLowerCase().includes(search.toLowerCase()),
  );

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Course Detail List
      </Typography>

      {/* Search Bar */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Application No. or Course Name"
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
              <TableCell width="5%">#</TableCell>
              <TableCell width="15%">Application No.</TableCell>
              <TableCell width="25%">Course Name</TableCell>
              <TableCell width="30%">Application Date</TableCell>
              <TableCell width="25%">Course Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() =>
                          handleApplicationClick(item.applicationNo)
                        }
                        sx={{
                          textDecoration: "underline",
                          cursor: "pointer",
                          color: "primary.main",
                          fontWeight: 500,
                          "&:hover": {
                            color: "primary.dark",
                          },
                        }}
                      >
                        {item.applicationNo}
                      </Link>
                    </TableCell>
                    <TableCell>{item.courseName}</TableCell>
                    <TableCell>{item.applicationDate}</TableCell>
                    <TableCell>{item.courseDate}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Paper>
  );
};

export default AddTraineeIndex;
