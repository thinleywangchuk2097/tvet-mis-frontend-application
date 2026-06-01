import React, { useState } from "react";
import {
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Box,
  Chip,
  Divider,
  Stack,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Checkbox,
  Rating,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import IosShareIcon from "@mui/icons-material/IosShare";
import { exportToExcel } from "@/utils/exportExcel";

const ResponseTracerIndex = () => {
  const [view, setView] = useState("table"); // table, chart
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterInstitute, setFilterInstitute] = useState("all");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Updated institutes list
  const institutes = [
    "Technical Training Institute Thimphu (TTI-T)",
    "Technical Training Institute Chumey (TTI-C)",
    "Technical Training Institute Samthang (TTI-S)",
    "Technical Training Institute Rangjung (TTI-R)",
    "Jigme Wangchuck Power Training Institute Dekiling (JWPTI)",
    "Royal Institute for Tourism and Hospitality (RITH)",
  ];

  // Mock response data with updated institute names
  const [responses, setResponses] = useState([
    {
      id: "RES001",
      surveyId: "SUR001",
      institute: "Technical Training Institute Thimphu (TTI-T)",
      employerName: "Tshering Wangmo",
      employerEmail: "tshering.wangmo@company.bt",
      companyName: "Bhutan Telecom",
      surveyType: "Employment Status",
      submittedDate: "2026-03-20",
      completionTime: "5 mins",
      status: "completed",
      answers: [
        {
          questionId: 1,
          questionText:
            "How satisfied are you with the graduate's performance?",
          questionType: "rating",
          answer: 4,
        },
        {
          questionId: 2,
          questionText:
            "Which skills does the graduate demonstrate effectively?",
          questionType: "checkbox",
          answer: ["Technical Skills", "Communication", "Problem Solving"],
        },
        {
          questionId: 3,
          questionText:
            "Would you recommend hiring more graduates from our institute?",
          questionType: "radio",
          answer: "Yes",
        },
        {
          questionId: 4,
          questionText: "Additional comments about the graduate's performance",
          questionType: "textarea",
          answer:
            "The graduate has shown excellent technical skills and adapts quickly to new challenges.",
        },
      ],
    },
    {
      id: "RES002",
      surveyId: "SUR002",
      institute: "Technical Training Institute Chumey (TTI-C)",
      employerName: "Karma Dorji",
      employerEmail: "karma.dorji@tech.bt",
      companyName: "Druk Holding",
      surveyType: "Skill Assessment",
      submittedDate: "2026-03-22",
      completionTime: "8 mins",
      status: "completed",
      answers: [
        {
          questionId: 1,
          questionText: "Rate the graduate's technical proficiency",
          questionType: "rating",
          answer: 5,
        },
        {
          questionId: 2,
          questionText: "Select the technical skills demonstrated",
          questionType: "checkbox",
          answer: ["Programming", "Database Management", "Cloud Computing"],
        },
        {
          questionId: 3,
          questionText: "How would you rate their problem-solving ability?",
          questionType: "dropdown",
          answer: "Excellent",
        },
      ],
    },
    {
      id: "RES003",
      surveyId: "SUR003",
      institute: "Technical Training Institute Samthang (TTI-S)",
      employerName: "Pema Lhaden",
      employerEmail: "pema.lhaden@bank.bt",
      companyName: "Bank of Bhutan",
      surveyType: "Graduate Performance",
      submittedDate: "2026-03-25",
      completionTime: "6 mins",
      status: "pending",
      answers: [],
    },
    {
      id: "RES004",
      surveyId: "SUR001",
      institute: "Technical Training Institute Thimphu (TTI-T)",
      employerName: "Sonam Yangzom",
      employerEmail: "sonam.yangzom@company.bt",
      companyName: "Ministry of Education",
      surveyType: "Employment Status",
      submittedDate: "2026-03-26",
      completionTime: "7 mins",
      status: "completed",
      answers: [
        {
          questionId: 1,
          questionText:
            "How satisfied are you with the graduate's performance?",
          questionType: "rating",
          answer: 3,
        },
        {
          questionId: 2,
          questionText:
            "Which skills does the graduate demonstrate effectively?",
          questionType: "checkbox",
          answer: ["Communication", "Teamwork"],
        },
        {
          questionId: 3,
          questionText:
            "Would you recommend hiring more graduates from our institute?",
          questionType: "radio",
          answer: "Maybe",
        },
      ],
    },
    {
      id: "RES005",
      surveyId: "SUR002",
      institute: "Jigme Wangchuck Power Training Institute Dekiling (JWPTI)",
      employerName: "Tashi Penjor",
      employerEmail: "tashi.penjor@tech.bt",
      companyName: "Bhutan Power Corporation",
      surveyType: "Skill Assessment",
      submittedDate: "2026-03-28",
      completionTime: "4 mins",
      status: "expired",
      answers: [],
    },
    {
      id: "RES006",
      surveyId: "SUR004",
      institute: "Royal Institute for Tourism and Hospitality (RITH)",
      employerName: "Dechen Zangmo",
      employerEmail: "dechen.zangmo@hotel.bt",
      companyName: "Taj Tashi",
      surveyType: "Employment Status",
      submittedDate: "2026-03-30",
      completionTime: "6 mins",
      status: "completed",
      answers: [
        {
          questionId: 1,
          questionText:
            "How satisfied are you with the graduate's performance?",
          questionType: "rating",
          answer: 5,
        },
        {
          questionId: 2,
          questionText:
            "Which skills does the graduate demonstrate effectively?",
          questionType: "checkbox",
          answer: ["Customer Service", "Communication", "Teamwork"],
        },
        {
          questionId: 3,
          questionText:
            "Would you recommend hiring more graduates from our institute?",
          questionType: "radio",
          answer: "Yes",
        },
      ],
    },
  ]);

  // Column definitions for display
  const columns = [
    { id: "id", label: "Response ID" },
    { id: "surveyId", label: "Survey ID" },
    { id: "institute", label: "Institute" },
    { id: "employerName", label: "Employer Name" },
    { id: "employerEmail", label: "Employer Email" },
    { id: "companyName", label: "Company" },
    { id: "surveyType", label: "Survey Type" },
    { id: "submittedDate", label: "Submitted Date" },
    { id: "status", label: "Status" },
    { id: "completionTime", label: "Completion Time" },
  ];

  // Filter responses
  const filteredResponses = responses.filter((response) => {
    const matchesSearch = search
      ? response.employerName.toLowerCase().includes(search.toLowerCase()) ||
        response.companyName.toLowerCase().includes(search.toLowerCase()) ||
        response.id.toLowerCase().includes(search.toLowerCase()) ||
        response.surveyId.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesStatus =
      filterStatus === "all" || response.status === filterStatus;
    const matchesInstitute =
      filterInstitute === "all" || response.institute === filterInstitute;

    return matchesSearch && matchesStatus && matchesInstitute;
  });

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedResponses = filteredResponses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Handle select all checkbox
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedResponses.map((response) => response.id);
      setSelectedRows(newSelected);
    } else {
      setSelectedRows([]);
    }
  };

  // Handle individual checkbox
  const handleSelectRow = (id) => {
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id);
    } else {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1),
      );
    }

    setSelectedRows(newSelected);
  };

  // Handle send survey
  const handleSend = (response) => {
    if (response.status === "completed") {
      alert("Cannot send survey to completed responses");
      return;
    }
    alert(
      `Sending survey to ${response.employerName} at ${response.companyName}`,
    );
    // Implement actual send functionality here
  };

  // Handle download selected rows using exportToExcel
  const handleDownloadSelected = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to download");
      return;
    }

    const selectedData = responses.filter((response) =>
      selectedRows.includes(response.id),
    );

    const exportData = selectedData.map((item, index) => ({
      "Sl No": index + 1,
      "Response ID": item.id,
      "Survey ID": item.surveyId,
      Institute: item.institute,
      "Employer Name": item.employerName,
      "Employer Email": item.employerEmail,
      Company: item.companyName,
      "Survey Type": item.surveyType,
      "Submitted Date": item.submittedDate,
      Status: item.status,
      "Completion Time": item.completionTime,
    }));

    const today = new Date().toISOString().split("T")[0];
    exportToExcel(exportData, `Selected_Responses_${today}`);
  };

  // Handle download all filtered data using exportToExcel
  const handleDownloadAll = () => {
    if (filteredResponses.length === 0) {
      alert("No data to download");
      return;
    }

    const exportData = filteredResponses.map((item, index) => ({
      "Sl No": index + 1,
      "Response ID": item.id,
      "Survey ID": item.surveyId,
      Institute: item.institute,
      "Employer Name": item.employerName,
      "Employer Email": item.employerEmail,
      Company: item.companyName,
      "Survey Type": item.surveyType,
      "Submitted Date": item.submittedDate,
      Status: item.status,
      "Completion Time": item.completionTime,
    }));

    const today = new Date().toISOString().split("T")[0];
    exportToExcel(exportData, `All_Responses_${today}`);
  };

  // Handle export single response from dialog
  const handleExportSingleResponse = () => {
    if (!selectedResponse) return;

    const exportData = [
      {
        "Response ID": selectedResponse.id,
        "Survey ID": selectedResponse.surveyId,
        Institute: selectedResponse.institute,
        "Employer Name": selectedResponse.employerName,
        "Employer Email": selectedResponse.employerEmail,
        Company: selectedResponse.companyName,
        "Survey Type": selectedResponse.surveyType,
        "Submitted Date": selectedResponse.submittedDate,
        Status: selectedResponse.status,
        "Completion Time": selectedResponse.completionTime,
      },
    ];

    // Add answers to export if they exist
    if (selectedResponse.answers && selectedResponse.answers.length > 0) {
      selectedResponse.answers.forEach((answer, idx) => {
        exportData[0][`Q${idx + 1}: ${answer.questionText}`] = Array.isArray(
          answer.answer,
        )
          ? answer.answer.join(", ")
          : answer.answer;
      });
    }

    const today = new Date().toISOString().split("T")[0];
    exportToExcel(exportData, `Response_${selectedResponse.id}_${today}`);
  };

  // Stats
  const totalResponses = responses.length;
  const completedResponses = responses.filter(
    (r) => r.status === "completed",
  ).length;
  const pendingResponses = responses.filter(
    (r) => r.status === "pending",
  ).length;
  const responseRate =
    totalResponses > 0
      ? Math.round((completedResponses / totalResponses) * 100)
      : 0;

  // Chart data
  const statusData = [
    { name: "Completed", value: completedResponses, color: "#4caf50" },
    { name: "Pending", value: pendingResponses, color: "#ff9800" },
    {
      name: "Expired",
      value: responses.filter((r) => r.status === "expired").length,
      color: "#f44336",
    },
  ];

  const surveyTypeData = [
    {
      name: "Employment Status",
      count: responses.filter((r) => r.surveyType === "Employment Status")
        .length,
    },
    {
      name: "Skill Assessment",
      count: responses.filter((r) => r.surveyType === "Skill Assessment")
        .length,
    },
    {
      name: "Graduate Performance",
      count: responses.filter((r) => r.surveyType === "Graduate Performance")
        .length,
    },
  ];

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setViewOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 18 }} />;
      case "pending":
        return <PendingIcon sx={{ color: "#ff9800", fontSize: 18 }} />;
      case "expired":
        return <CancelIcon sx={{ color: "#f44336", fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "expired":
        return "error";
      default:
        return "default";
    }
  };

  // Render answer based on question type
  const renderAnswer = (answer, questionType) => {
    if (!answer)
      return <Typography color="textSecondary">No answer provided</Typography>;

    switch (questionType) {
      case "rating":
        return <Rating value={answer} readOnly size="small" />;
      case "checkbox":
        return Array.isArray(answer) ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {answer.map((item, idx) => (
              <Chip key={idx} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        ) : (
          <Typography>{answer}</Typography>
        );
      case "radio":
      case "dropdown":
        return <Typography>{answer}</Typography>;
      case "textarea":
      case "text":
        return (
          <Paper variant="outlined" sx={{ p: 1, bgcolor: "#f9f9f9" }}>
            <Typography>{answer}</Typography>
          </Paper>
        );
      default:
        return <Typography>{JSON.stringify(answer)}</Typography>;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, mt: 1 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Survey Responses
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          View and analyze responses from tracer surveys
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ bgcolor: "#e3f2fd" }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Responses
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {totalResponses}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ bgcolor: "#e8f5e8" }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Completed
                </Typography>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {completedResponses}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ bgcolor: "#fff3e0" }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Pending
                </Typography>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {pendingResponses}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and View Toggle */}
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Institute</InputLabel>
              <Select
                value={filterInstitute}
                onChange={(e) => setFilterInstitute(e.target.value)}
                label="Institute"
              >
                <MenuItem value="all">All Institutes</MenuItem>
                {institutes.map((inst) => (
                  <MenuItem key={inst} value={inst}>
                    {inst}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search by employer, company, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant={view === "table" ? "contained" : "outlined"}
                startIcon={<TableChartIcon />}
                onClick={() => setView("table")}
                size="small"
                sx={{ flex: 1 }}
              >
                Table
              </Button>
              <Button
                variant={view === "chart" ? "contained" : "outlined"}
                startIcon={<BarChartIcon />}
                onClick={() => setView("chart")}
                size="small"
                sx={{ flex: 1 }}
              >
                Charts
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Download buttons */}
        <Box
          sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadAll}
            disabled={filteredResponses.length === 0}
          >
            Download All ({filteredResponses.length})
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadSelected}
            disabled={selectedRows.length === 0}
            color="success"
          >
            Download Selected ({selectedRows.length})
          </Button>
        </Box>
      </Paper>

      {/* Table View */}
      {view === "table" && (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table
              size="small"
              sx={{
                border: "1px solid #e0e0e0",
                "& th": {
                  border: "1px solid #e0e0e0",
                  fontWeight: 600,
                  bgcolor: "#f5f5f5",
                },
                "& td": { border: "1px solid #e0e0e0" },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" align="center" width={40}>
                    <Checkbox
                      indeterminate={
                        selectedRows.length > 0 &&
                        selectedRows.length < paginatedResponses.length
                      }
                      checked={
                        paginatedResponses.length > 0 &&
                        selectedRows.length === paginatedResponses.length
                      }
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center" width={50}>
                    #
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.id}>{col.label}</TableCell>
                  ))}
                  <TableCell align="center" width={80}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedResponses.length > 0 ? (
                  paginatedResponses.map((response, index) => {
                    const isSelected = selectedRows.includes(response.id);
                    return (
                      <TableRow
                        key={response.id}
                        hover
                        sx={{
                          bgcolor: isSelected ? "#f0f7ff" : "inherit",
                        }}
                      >
                        <TableCell padding="checkbox" align="center">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectRow(response.id)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {response.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{response.surveyId}</TableCell>
                        <TableCell>{response.institute}</TableCell>
                        <TableCell>{response.employerName}</TableCell>
                        <TableCell>{response.employerEmail}</TableCell>
                        <TableCell>{response.companyName}</TableCell>
                        <TableCell>{response.surveyType}</TableCell>
                        <TableCell>{response.submittedDate}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(response.status)}
                            label={response.status}
                            size="small"
                            color={getStatusColor(response.status)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{response.completionTime}</TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="center"
                          >
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                sx={{
                                  bgcolor: "#e3f2fd",
                                  color: "#1976d2",
                                  "&:hover": { bgcolor: "#bbdefb" },
                                  width: 32,
                                  height: 32,
                                }}
                                onClick={() => handleViewResponse(response)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={
                                response.status === "completed"
                                  ? "Cannot send completed survey"
                                  : "Send Survey"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  sx={{
                                    bgcolor: "#e8f5e8",
                                    color: "#2e7d32",
                                    "&:hover": { bgcolor: "#c8e6c9" },
                                    "&.Mui-disabled": {
                                      bgcolor: "#f5f5f5",
                                      color: "#bdbdbd",
                                    },
                                    width: 32,
                                    height: 32,
                                  }}
                                  onClick={() => handleSend(response)}
                                  disabled={response.status === "completed"}
                                >
                                  <IosShareIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 3}
                      align="center"
                      sx={{ py: 3 }}
                    >
                      <Typography color="textSecondary">
                        No responses found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredResponses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Chart View */}
      {view === "chart" && (
        <Grid container spacing={3}>
          {/* Status Distribution */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Response Status Distribution
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Survey Type Distribution */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Responses by Survey Type
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={surveyTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar barSize={25} dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* View Response Dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ bgcolor: "#f5f5f5", fontWeight: 600 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              Response Details - {selectedResponse?.id}
              <Typography variant="body2" color="textSecondary">
                {selectedResponse?.surveyType} • {selectedResponse?.institute}
              </Typography>
            </Box>
            <Chip
              icon={getStatusIcon(selectedResponse?.status)}
              label={selectedResponse?.status}
              size="small"
              color={getStatusColor(selectedResponse?.status)}
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedResponse && (
            <Box>
              {/* Respondent Information */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Respondent Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Employer Name
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedResponse.employerName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedResponse.employerEmail}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Company
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedResponse.companyName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Survey ID
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedResponse.surveyId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Submitted Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedResponse.submittedDate}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Completion Time
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedResponse.completionTime}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Answers Section */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Survey Responses
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {selectedResponse.answers &&
                selectedResponse.answers.length > 0 ? (
                  <Box>
                    {selectedResponse.answers.map((answer, index) => (
                      <Box key={answer.questionId} sx={{ mb: 3 }}>
                        <Typography
                          variant="body1"
                          gutterBottom
                          fontWeight={500}
                        >
                          {index + 1}. {answer.questionText}
                        </Typography>
                        <Box sx={{ ml: 2, mt: 1 }}>
                          {renderAnswer(answer.answer, answer.questionType)}
                        </Box>
                        {index < selectedResponse.answers.length - 1 && (
                          <Divider sx={{ my: 2 }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    color="textSecondary"
                    align="center"
                    sx={{ py: 3 }}
                  >
                    No responses have been submitted yet.
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportSingleResponse}
            disabled={!selectedResponse}
          >
            Export
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => setViewOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResponseTracerIndex;
