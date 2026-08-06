import { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import SearchIcon from "@mui/icons-material/Search";

const pieData = [
  { name: "Approved", value: 40 },
  { name: "Pending", value: 25 },
  { name: "Rejected", value: 15 },
];

const barData = [
  { month: "Jan", reports: 12 },
  { month: "Feb", reports: 19 },
  { month: "Mar", reports: 8 },
  { month: "Apr", reports: 15 },
  { month: "May", reports: 22 },
  { month: "Jun", reports: 10 },
  { month: "Jul", reports: 18 },
  { month: "Aug", reports: 14 },
  { month: "Sep", reports: 20 },
  { month: "Oct", reports: 25 },
  { month: "Nov", reports: 17 },
  { month: "Dec", reports: 30 },
];
const tvetData = [
  {
    id: 1,
    applicationNo: "1000023",
    name: "Registered Training Provider",
    service: "Institute Proposal",
    pvtOthers: 130,
    total: 144,
  },
  {
    id: 2,
    applicationNo: "1000024",
    name: "Accredited Courses",
    service: "Institute Proposal",
    total: 24,
  },
  {
    id: 3,
    applicationNo: "1000025",
    name: "Other Courses",
    service: "Institute Proposal",
    total: 70,
  },
  {
    id: 4,
    applicationNo: "1000026",
    name: "Enrolment in Accredited Courses",
    service: "Institute Proposal",
    total: 25,
  },
  {
    id: 5,
    applicationNo: "1000027",
    name: "Enrolment in other Courses",
    service: "Institute Proposal",
    total: 51,
  },
  {
    id: 6,
    applicationNo: "1000028",
    name: "ToT Certified",
    service: "Institute Proposal",
    total: 174,
  },
  {
    id: 7,
    applicationNo: "1000029",
    name: "RPL Certified (MoLHR)",
    service: "Institute Proposal",
    total: 12,
  },
];
// line graph data
const lineData = [
  { month: "Jan", cases: 10 },
  { month: "Feb", cases: 18 },
  { month: "Mar", cases: 12 },
  { month: "Apr", cases: 25 },
  { month: "May", cases: 20 },
  { month: "Jun", cases: 30 },
];
const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};
const COLORS = ["#1976d2", "#2e7d32", "#d32f2f", "#ed6c02"];

const validationSchema = Yup.object({
  fromDate: Yup.date().required("From date is required"),
  toDate: Yup.date()
    .required("To date is required")
    .min(Yup.ref("fromDate"), "To date cannot be earlier than From date"),
});

const QASLevel1Dashboard = () => {
  // -------------------- Pagination --------------------
  const [infoPage, setInfoPage] = useState(0);
  const [infoRowsPerPage, setInfoRowsPerPage] = useState(5);
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        mb={2}
        sx={{
          fontSize: "1.1rem",
        }}
      >
        QAS Level 1 Dashboard
      </Typography>

      {/* Filter Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Formik
            initialValues={{ fromDate: "", toDate: "", search: "" }}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              console.log(values);
            }}
          >
            {({ values, handleChange, errors, touched }) => (
              <Form>
                <Grid container spacing={1.5} alignItems="center">
                  {/* Search Field */}
                  <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      placeholder="Search..."
                      name="search"
                      size="small"
                      value={values.search}
                      onChange={handleChange}
                      sx={{
                        fontSize: "0.8rem",
                      }}
                      InputProps={{
                        startAdornment: (
                          <SearchIcon sx={{ mr: 1, fontSize: 18 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 5, md: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      size="small"
                      label="From Date"
                      name="fromDate"
                      InputLabelProps={{ shrink: true }}
                      value={values.fromDate}
                      onChange={handleChange}
                      error={touched.fromDate && Boolean(errors.fromDate)}
                      helperText={touched.fromDate && errors.fromDate}
                      sx={{
                        fontSize: "0.8rem",
                        "& .MuiInputLabel-root": {
                          fontSize: "0.8rem",
                        },
                        "& .MuiInputBase-root": {
                          fontSize: "0.8rem",
                        },
                        "& .MuiFormHelperText-root": {
                          fontSize: "0.7rem",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 5, md: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="To Date"
                      name="toDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={values.toDate}
                      onChange={handleChange}
                      error={touched.toDate && Boolean(errors.toDate)}
                      helperText={touched.toDate && errors.toDate}
                      sx={{
                        fontSize: "0.8rem",
                        "& .MuiInputLabel-root": {
                          fontSize: "0.8rem",
                        },
                        "& .MuiInputBase-root": {
                          fontSize: "0.8rem",
                        },
                        "& .MuiFormHelperText-root": {
                          fontSize: "0.7rem",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 2, md: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{
                        fontSize: "0.8rem",
                        py: 0.75,
                      }}
                    >
                      Apply Filter
                    </Button>
                  </Grid>
                  {/* TVET Indicators */}
                  <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                    <Paper
                      sx={{
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        fontWeight={600}
                        sx={{
                          mb: 1.5,
                          fontSize: "0.9rem",
                        }}
                      >
                        Application Information
                      </Typography>

                      <TableContainer>
                        <Table size="small" sx={tableStyle}>
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  py: 0.5,
                                }}
                              >
                                #
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  py: 0.5,
                                }}
                              >
                                Application No.
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  py: 0.5,
                                }}
                              >
                                Name
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  py: 0.5,
                                }}
                              >
                                Service
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  py: 0.5,
                                }}
                              >
                                Total
                              </TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {tvetData
                              .slice(
                                infoPage * infoRowsPerPage,
                                infoPage * infoRowsPerPage + infoRowsPerPage,
                              )
                              .map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                    }}
                                  >
                                    {row.id}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                    }}
                                  >
                                    {row.applicationNo}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                    }}
                                  >
                                    {row.name}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                    }}
                                  >
                                    {row.service}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                    }}
                                  >
                                    {row.total ?? 0}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        component="div"
                        count={tvetData.length}
                        page={infoPage}
                        onPageChange={(e, newPage) => setInfoPage(newPage)}
                        rowsPerPage={infoRowsPerPage}
                        onRowsPerPageChange={(e) => {
                          setInfoRowsPerPage(parseInt(e.target.value, 10));
                          setInfoPage(0);
                        }}
                        rowsPerPageOptions={[5, 10]}
                        sx={{
                          "& .MuiTablePagination-selectLabel": {
                            fontSize: "0.75rem",
                          },
                          "& .MuiTablePagination-displayedRows": {
                            fontSize: "0.75rem",
                          },
                          "& .MuiTablePagination-select": {
                            fontSize: "0.75rem",
                          },
                          "& .MuiTablePagination-menuItem": {
                            fontSize: "0.75rem",
                          },
                        }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Grid container spacing={2} mb={2}>
        {/* Line Chart */}
        <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography
                fontWeight={600}
                mb={1}
                sx={{
                  fontSize: "0.85rem",
                }}
              >
                Total Application Case Trend
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: "0.7rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="#1976d2"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography
                fontWeight={600}
                mb={1}
                sx={{
                  fontSize: "0.85rem",
                }}
              >
                Application Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={{ fontSize: 10 }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: "0.7rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Paper>
        </Grid>

        <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography
                fontWeight={600}
                mb={1}
                sx={{
                  fontSize: "0.85rem",
                }}
              >
                Current Year Monthly Applications
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: "0.7rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                  <Bar barSize={18} dataKey="reports" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>

      {/* Table Section */}
      <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 1.5 }}>
          <Typography
            variant="h6"
            mb={1.5}
            sx={{
              fontSize: "0.95rem",
            }}
          >
            Recent Applications
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      py: 0.5,
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      py: 0.5,
                    }}
                  >
                    Applicant
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      py: 0.5,
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      py: 0.5,
                    }}
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    001
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    John Doe
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "green",
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    Approved
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    2026-03-01
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    002
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    Jane Smith
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "orange",
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    Pending
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.5,
                    }}
                  >
                    2026-03-02
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Paper>
    </Paper>
  );
};

export default QASLevel1Dashboard;
