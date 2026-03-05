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
const tvetIndicators = [
  {
    id: 1,
    name: "Registered Training Provider",
    ttiGovt: 14,
    pvtOthers: 130,
    total: 144,
  },
  {
    id: 2,
    name: "Accredited Courses",
    ttiGovt: 173,
    pvtOthers: 69,
    total: 242,
  },
  { id: 3, name: "Other Courses", ttiGovt: 164, pvtOthers: 556, total: 720 },
  {
    id: 4,
    name: "Enrolment in Accredited Courses",
    ttiGovt: 8094,
    pvtOthers: 16990,
    total: 25084,
  },
  {
    id: 5,
    name: "Enrolment in other Courses",
    ttiGovt: 5732,
    pvtOthers: 45951,
    total: 51683,
  },
  { id: 6, name: "ToT Certified", ttiGovt: 124, pvtOthers: 50, total: 174 },
  { id: 7, name: "RPL Certified (MoLHR)", ttiGovt: 0, pvtOthers: 0, total: 0 },
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
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          QAS Level 1 Dashboard
        </Typography>

        {/* Filter Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Formik
              initialValues={{ fromDate: "", toDate: "", search: "" }}
              validationSchema={validationSchema}
              onSubmit={(values) => {
                console.log(values);
              }}
            >
              {({ values, handleChange, errors, touched }) => (
                <Form>
                  <Grid container spacing={2} alignItems="center">
                    {/* Search Field */}
                    <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        placeholder="Search..."
                        name="search"
                        size="small"
                        value={values.search}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ mr: 1 }} />,
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
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 2, md: 2 }}>
                      <Button type="submit" variant="contained" fullWidth>
                        Apply Filter
                      </Button>
                    </Grid>
                    {/* TVET Indicators */}
                    <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                      <Paper
                        sx={{
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography fontWeight={600} sx={{ mb: 2 }}>
                          TVET Indicators
                        </Typography>

                        <TableContainer>
                          <Table size="small" sx={tableStyle}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  #
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  Name
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  TTI/Govt
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  Pvt/Others
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  Total
                                </TableCell>
                              </TableRow>
                            </TableHead>

                            <TableBody>
                              {tvetIndicators
                                .slice(
                                  infoPage * infoRowsPerPage,
                                  infoPage * infoRowsPerPage + infoRowsPerPage,
                                )
                                .map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.ttiGovt ?? 0}</TableCell>
                                    <TableCell>{row.pvtOthers ?? 0}</TableCell>
                                    <TableCell>{row.total ?? 0}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <TablePagination
                          component="div"
                          count={tvetIndicators.length}
                          page={infoPage}
                          onPageChange={(e, newPage) => setInfoPage(newPage)}
                          rowsPerPage={infoRowsPerPage}
                          onRowsPerPageChange={(e) => {
                            setInfoRowsPerPage(parseInt(e.target.value, 10));
                            setInfoPage(0);
                          }}
                          rowsPerPageOptions={[5, 10]}
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
        <Grid container spacing={3} mb={3}>
          {/* Line Chart */}
          <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
            <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography fontWeight={600} mb={2}>
                  Monthly Case Trend
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cases"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Paper>
          </Grid>
          <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
            <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography fontWeight={600} mb={2}>
                  Application Status Overview
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Paper>
          </Grid>

          <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
            <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography fontWeight={600} mb={2}>
                  Monthly Reports
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar barSize={25} dataKey="reports" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Paper>
          </Grid>
        </Grid>

        {/* Table Section */}
        <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Recent Applications
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>001</TableCell>
                    <TableCell>John Doe</TableCell>
                    <TableCell sx={{ color: "green" }}>Approved</TableCell>
                    <TableCell>2026-03-01</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>002</TableCell>
                    <TableCell>Jane Smith</TableCell>
                    <TableCell sx={{ color: "orange" }}>Pending</TableCell>
                    <TableCell>2026-03-02</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Paper>
      </Paper>
    </Box>
  );
};

export default QASLevel1Dashboard;
