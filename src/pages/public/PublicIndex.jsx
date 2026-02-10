import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Button,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Slider images
import slide1 from "../../assets/slider/slide1.jpg";
import slide2 from "../../assets/slider/slide2.jpg";
import slide3 from "../../assets/slider/slide3.jpg";
import slide4 from "../../assets/slider/slide4.png";
import slide5 from "../../assets/slider/slide5.png";
import slide6 from "../../assets/slider/slide6.png";
import slide7 from "../../assets/slider/slide7.png";

const sliderImages = [slide1, slide2, slide3, slide4, slide5, slide6, slide7];

// Table data
const table1Applications = [
  { id: 1, application_no: 101, name: "John Doe", program: "Carpentry" },
  { id: 2, application_no: 102, name: "Jane Smith", program: "Electronics" },
  { id: 3, application_no: 103, name: "Tenzin Wangchuk", program: "Tourism" },
  { id: 4, application_no: 104, name: "Kesang Dema", program: "IT" },
];

const table2Applications = [
  { id: 1, application_no: 201, name: "Dorji Wangmo", month: "Jan" },
  { id: 2, application_no: 202, name: "Pema Choden", month: "Jan" },
  { id: 3, application_no: 203, name: "Tshering Dorji", month: "Feb" },
  { id: 4, application_no: 204, name: "Kinzang Dema", month: "Feb" },
  { id: 5, application_no: 205, name: "Sonam Wangchuk", month: "Mar" },
];

const applicationDetails = [
  {
    application_no: 301,
    name: "Tashi Dorji",
    location: "Thimphu",
    service: "Electricity",
    status: "Approved",
  },
  {
    application_no: 302,
    name: "Sonam Choden",
    location: "Paro",
    service: "Water Supply",
    status: "Pending",
  },
  {
    application_no: 303,
    name: "Pema Wangchuk",
    location: "Punakha",
    service: "Road Construction",
    status: "Rejected",
  },
  {
    application_no: 304,
    name: "Kesang Dema",
    location: "Gelegphu",
    service: "Health",
    status: "Approved",
  },
];

// Pie chart
const pieData = [
  { name: "Approved", value: 2 },
  { name: "Pending", value: 1 },
  { name: "Rejected", value: 2 },
];
const COLORS = ["#4caf50", "#ff9800", "#f44336"];

// Line chart
const graphData = [
  { month: "Jan", value: 4000 },
  { month: "Feb", value: 3000 },
  { month: "Mar", value: 5000 },
  { month: "Apr", value: 2780 },
  { month: "May", value: 1890 },
  { month: "Jun", value: 2390 },
  { month: "Jul", value: 3490 },
  { month: "Aug", value: 6490 },
  { month: "Sep", value: 1490 },
  { month: "Oct", value: 4490 },
  { month: "Nov", value: 2490 },
  { month: "Dec", value: 9490 },
];

const PublicIndex = () => {
  const theme = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);

  // Modal search
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Table pagination
  const [page1, setPage1] = useState(0);
  const [rowsPerPage1, setRowsPerPage1] = useState(3);
  const [page2, setPage2] = useState(0);
  const [rowsPerPage2, setRowsPerPage2] = useState(3);

  // Slider auto change
  useEffect(() => {
    const interval = setInterval(
      () => setActiveSlide((prev) => (prev + 1) % sliderImages.length),
      4000,
    );
    return () => clearInterval(interval);
  }, []);

  // Search handler with validation
  const handleSearchClick = () => {
    if (!modalSearchQuery.trim()) {
      setSearchError(true);
      return;
    }

    setSearchError(false);

    const app = applicationDetails.find(
      (a) => a.application_no.toString() === modalSearchQuery,
    );
    setSelectedApplication(app || null);
    setOpenModal(true);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#4caf50";
      case "pending":
        return "#ff9800";
      case "rejected":
        return "#f44336";
      default:
        return "#000";
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Slider */}
      <Box
        sx={{
          position: "relative",
          width: "100vw",
          left: "50%",
          marginLeft: "-50vw",
          height: { xs: 300, md: 450 },
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {sliderImages.map((img, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              width: "100%",
              height: "100%",
              opacity: index === activeSlide ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          />
        ))}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.25)",
            zIndex: 1,
          }}
        />
        {/* Search */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 40 },
            display: "flex",
            width: { xs: "90%", sm: 360, md: 420 },
            zIndex: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Track Your Application"
            variant="outlined"
            size="small"
            value={modalSearchQuery}
            onChange={(e) => {
              setModalSearchQuery(e.target.value);
              if (searchError && e.target.value.trim()) setSearchError(false);
            }}
            error={searchError}
            helperText={searchError ? "Please enter application no." : ""}
            slotProps={{
              input: {
                sx: {
                  borderRadius: "6px 0 0 6px",
                  backgroundColor: alpha(theme.palette.background.paper, 0.85),
                  height: { xs: 36, md: 42 },
                  fontSize: { xs: "0.85rem", md: "0.95rem" },
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            sx={{
              borderRadius: "0 6px 6px 0",
              backgroundColor: theme.palette.primary.main,
              px: 3,
              height: { xs: 36, md: 42 },
            }}
            onClick={handleSearchClick}
          >
            Search
          </Button>
        </Box>
      </Box>
      <Container maxWidth="xl" sx={{ pt: 6, pb: 10 }}>
        {/* Title */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              display: "inline-block",
              color: "text.primary",
              pb: 1,
              borderBottom: "3px solid #1e88e6",
              "&:hover": { borderBottomColor: "#1565c0", cursor: "pointer" },
            }}
          >
            Recent Applications
          </Typography>
        </Box>
        {/* Tables */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            mb: 6,
          }}
        >
          {[
            {
              data: table1Applications,
              headers: ["Application No", "Name", "Program"],
              page: page1,
              setPage: setPage1,
              rowsPerPage: rowsPerPage1,
              setRowsPerPage: setRowsPerPage1,
            },
            {
              data: table2Applications,
              headers: ["Application No", "Name", "Month"],
              page: page2,
              setPage: setPage2,
              rowsPerPage: rowsPerPage2,
              setRowsPerPage: setRowsPerPage2,
            },
          ].map((table, idx) => (
            <TableContainer
              key={idx}
              component={Paper}
              sx={{ flex: 1, borderRadius: 2, boxShadow: 2 }}
            >
              <Table sx={{ borderCollapse: "collapse" }}>
                <TableHead
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                >
                  <TableRow>
                    {table.headers.map((head) => (
                      <TableCell
                        key={head}
                        sx={{ fontWeight: 700, textAlign: "center" }}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {table.data
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage,
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        {Object.keys(row)
                          .filter((k) => k !== "id")
                          .map((key) => (
                            <TableCell
                              key={key}
                              sx={{ textAlign: "center", py: 1.5 }}
                            >
                              {row[key]}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={table.data.length}
                page={table.page}
                onPageChange={(e, newPage) => table.setPage(newPage)}
                rowsPerPage={table.rowsPerPage}
                onRowsPerPageChange={(e) => {
                  table.setRowsPerPage(parseInt(e.target.value, 10));
                  table.setPage(0);
                }}
                rowsPerPageOptions={[2, 3, 5]}
              />
            </TableContainer>
          ))}
        </Box>
        {/* Charts */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          {/* Pie Chart */}
          <Paper
            sx={{ flex: 1, p: { xs: 3, md: 6 }, borderRadius: 2, boxShadow: 2 }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Application Status
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
          {/* Line Chart */}
          <Paper
            sx={{ flex: 1, p: { xs: 3, md: 6 }, borderRadius: 2, boxShadow: 2 }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Monthly Performance
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={graphData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={alpha(theme.palette.text.primary, 0.2)}
                />
                <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Container>
      {/* Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Application Details</DialogTitle>
        <DialogContent dividers>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              boxShadow: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Table sx={{ borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {[
                    "Application No",
                    "Name",
                    "Location",
                    "Service",
                    "Status",
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 700,
                        textAlign: "center",
                        border: "1px solid #e0e0e0",
                        backgroundColor: "#f5f7fa",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedApplication ? (
                  <TableRow>
                    {[
                      "application_no",
                      "name",
                      "location",
                      "service",
                      "status",
                    ].map((key) => (
                      <TableCell
                        key={key}
                        sx={{
                          textAlign: "center",
                          py: 1.5,
                          border: "1px solid #e0e0e0",
                          fontWeight: key === "status" ? 600 : 400,
                          color:
                            key === "status"
                              ? getStatusColor(selectedApplication[key])
                              : "inherit",
                        }}
                      >
                        {selectedApplication[key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        textAlign: "center",
                        py: 2,
                        color: "error.main",
                        border: "1px solid #e0e0e0",
                        fontWeight: 500,
                      }}
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpenModal(false)}
            variant="outlined"
            color="error"
            sx={{
              borderWidth: 2,
              px: 3,
              "&:hover": {
                backgroundColor: "error.main",
                color: "#fff",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicIndex;
