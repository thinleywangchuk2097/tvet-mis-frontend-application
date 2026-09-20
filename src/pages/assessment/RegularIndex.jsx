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
  Button,
  Box,
  Divider,
  TablePagination,
  CircularProgress,
  Chip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToExcel } from "@/utils/exportExcel";
import CourseEnrollmentService from "../../api/services/internal/course/CourseEnrollmentService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const RegularIndex = () => {
  const [loading, setLoading] = useState(false);
  const [traineeList, setTraineeList] = useState([]);
  const [applicationNo, setApplicationNo] = useState("");
  const [searched, setSearched] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const today = new Date().toISOString().split("T")[0];

  // Format date (strip time)
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return dateStr.split("T")[0];
  };

  // Status pill colors
  const getStatusColor = (statusName) => {
    const statusColors = {
      selected: { bg: "#e0f2f1", color: "#00695c" },
      submitted: { bg: "#e3f2fd", color: "#1565c0" },
      verified: { bg: "#e8f5e9", color: "#2e7d32" },
      approved: { bg: "#e8f5e9", color: "#2e7d32" },
      rejected: { bg: "#ffebee", color: "#d32f2f" },
      endorsed: { bg: "#f3e5f5", color: "#7b1fa2" },
      pending: { bg: "#fff3e0", color: "#ed6c02" },
    };
    return (
      statusColors[statusName?.toLowerCase()] || {
        bg: "#f5f5f5",
        color: "#000",
      }
    );
  };

  // Handle search — calls API
  const handleSearch = async () => {
    if (!applicationNo.trim()) {
      toast.warning("Please enter an application number");
      return;
    }

    setLoading(true);
    setTraineeList([]);
    setPage(0);
    setSearched(true);

    try {
      const response =
        await CourseEnrollmentService.getListSelectedBQFTraineeForExcel(
          applicationNo.trim(),
          access_token,
        );

      const data = response.data || [];
      setTraineeList(data);
      console.log("Fetched trainee list:", data);

      if (data.length === 0) {
        toast.info("No trainees found for this application number");
      }
    } catch (error) {
      console.error("Error fetching trainee list:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch trainee details",
      );
      setTraineeList([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setApplicationNo("");
    setTraineeList([]);
    setSearched(false);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = traineeList.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Excel Export — using real API field names
  const handleExcelExport = () => {
    if (traineeList.length === 0) return;

    const data = traineeList.map((item, index) => ({
      SlNo: index + 1,
      ApplicationNo: item.application_no || "N/A",
      ApplicantName: item.applicant_name || "N/A",
      CID: item.cid_no || "N/A",
      Gender: item.gender || "N/A",
      Email: item.email_id || "N/A",
      MobileNo: item.mobile_no || "N/A",
      Qualification: item.qualification || "N/A",
      ProgrammeTitle: item.programme_title || "N/A",
      CertificationLevel: item.certification_level || "N/A",
      InstituteName: item.institute_name || "N/A",
      ApplicationStartDate: formatDate(item.application_start_date),
      ApplicationEndDate: formatDate(item.application_end_date),
      CAStartDate: formatDate(item.ca_start_date),
      CAEndDate: formatDate(item.ca_end_date),
      Status: item.status_name || "N/A",
    }));

    exportToExcel(data, `Trainee_Details_${today}`);
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Trainee Details
      </Typography>

      {/* Search Section */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Application No"
            value={applicationNo}
            onChange={(e) => setApplicationNo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 370000015"
            disabled={loading}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !applicationNo.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClear}
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={traineeList.length === 0}
              onClick={handleExcelExport}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Table */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table
            size="small"
            sx={{
              border: "1px solid #ccc",
              "& th, & td": {
                border: "1px solid #ccc",
                padding: "8px",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ background: "#f5f5f5" }}>
                <TableCell>#</TableCell>
                <TableCell>Application No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>CID</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile No.</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>Programme Title</TableCell>
                <TableCell>Certification Level</TableCell>
                <TableCell>Institute Name</TableCell>
                <TableCell>Application Start</TableCell>
                <TableCell>Application End</TableCell>
                <TableCell>CA Start</TableCell>
                <TableCell>CA End</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((t, index) => {
                  const statusStyle = getStatusColor(t.status_name);
                  return (
                    <TableRow key={t.id || index} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{t.application_no || "N/A"}</TableCell>
                      <TableCell>{t.applicant_name || "N/A"}</TableCell>
                      <TableCell>{t.cid_no || "N/A"}</TableCell>
                      <TableCell>{t.gender || "N/A"}</TableCell>
                      <TableCell>{t.email_id || "N/A"}</TableCell>
                      <TableCell>{t.mobile_no || "N/A"}</TableCell>
                      <TableCell>{t.qualification || "N/A"}</TableCell>
                      <TableCell>{t.programme_title || "N/A"}</TableCell>
                      <TableCell>{t.certification_level || "N/A"}</TableCell>
                      <TableCell>{t.institute_name || "N/A"}</TableCell>
                      <TableCell>
                        {formatDate(t.application_start_date)}
                      </TableCell>
                      <TableCell>
                        {formatDate(t.application_end_date)}
                      </TableCell>
                      <TableCell>{formatDate(t.ca_start_date)}</TableCell>
                      <TableCell>{formatDate(t.ca_end_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={t.status_name || "N/A"}
                          size="small"
                          sx={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            textTransform: "capitalize",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 3 }}>
                    {!searched
                      ? "Enter an application number and click Search"
                      : "No trainees found for this application number"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      {traineeList.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedData.length} of {traineeList.length} trainees
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={traineeList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              ".MuiTablePagination-select": { borderRadius: 1 },
              ".MuiTablePagination-displayedRows": { margin: 0 },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default RegularIndex;
