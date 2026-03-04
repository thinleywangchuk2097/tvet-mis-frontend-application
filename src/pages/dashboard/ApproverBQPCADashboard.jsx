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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Formik, Form } from "formik";
import * as Yup from "yup";

// Sample Data
const lineData = [
  { month: "Jan", approvals: 8 },
  { month: "Feb", approvals: 15 },
  { month: "Mar", approvals: 12 },
  { month: "Apr", approvals: 20 },
  { month: "May", approvals: 18 },
  { month: "Jun", approvals: 25 },
];

const pieData = [
  { name: "Approved", value: 60 },
  { name: "Rejected", value: 25 },
  { name: "Pending", value: 15 },
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

const COLORS = ["#2e7d32", "#d32f2f", "#ed6c02"];
const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};
// Validation Schema
const validationSchema = Yup.object({
  fromDate: Yup.date().required("From date is required"),
  toDate: Yup.date()
    .required("To date is required")
    .min(Yup.ref("fromDate"), "To date cannot be earlier than From date"),
});

const ApproverBQPCADashboard = () => {
    // -------------------- Pagination --------------------
    const [infoPage, setInfoPage] = useState(0);
    const [infoRowsPerPage, setInfoRowsPerPage] = useState(5);
  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 1 }}>
      <Typography variant="h6" fontWeight={700} mb={3}>
        Approver BQPCA Dashboard
      </Typography>

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Formik
            initialValues={{ fromDate: "", toDate: "" }}
            validationSchema={validationSchema}
            onSubmit={(values) => console.log(values)}
          >
            {({ values, handleChange, errors, touched }) => (
              <Form>
                <Grid container spacing={2} alignItems="center">
                  <Grid item size={{ xs: 12, sm: 5, md: 5 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="From Date"
                      name="fromDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={values.fromDate}
                      onChange={handleChange}
                      error={touched.fromDate && Boolean(errors.fromDate)}
                      helperText={touched.fromDate && errors.fromDate}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 5, md: 5 }}>
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

                  <Grid item xs={12} md={4}>
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
                              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
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
        <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
         <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography fontWeight={600} mb={2}>
                Monthly Approvals
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
                    dataKey="approvals"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Paper>
        </Grid>

        {/* Pie Chart */}
        <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
          <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography fontWeight={600} mb={2}>
                Approval Status Distribution
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

        {/* Bar Chart */}
        <Grid item size={{ xs: 12, sm: 4, md: 4 }}>
          <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography fontWeight={600} mb={2}>
                Pending vs Completed
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="approvals"
                    barSize={25}
                    fill="#2e7d32"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>

      {/* Table Section */}
      <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Typography fontWeight={600} mb={2}>
            Recent Approval Requests
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small" sx={tableStyle}>
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
                  <TableCell>201</TableCell>
                  <TableCell>Thinley Wangchuk</TableCell>
                  <TableCell sx={{ color: "green" }}>Approved</TableCell>
                  <TableCell>2026-03-01</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>202</TableCell>
                  <TableCell>Choden Dema</TableCell>
                  <TableCell sx={{ color: "orange" }}>Pending</TableCell>
                  <TableCell>2026-03-02</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Paper>
    </Paper>
  );
};

export default ApproverBQPCADashboard;
