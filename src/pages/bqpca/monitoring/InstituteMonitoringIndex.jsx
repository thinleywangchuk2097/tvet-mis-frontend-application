import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";

const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

const InstituteMonitoringIndex = () => {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Dialog state
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quality checklist state
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});

  // Sample institute monitoring data
  const [institutes, setInstitutes] = useState([
    {
      id: 1,
      registrationNo: "20260470007",
      name: "Thimphu Technical Training Institute",
      dzongkhag: "Thimphu",
      monitoringDate: "2024-10-15",
      checklistStatus: "Completed",
    },
    {
      id: 2,
      registrationNo: "20260470008",
      name: "Paro Vocational Training Center",
      dzongkhag: "Paro",
      monitoringDate: "2024-09-28",
      checklistStatus: "Pending",
    },
    {
      id: 3,
      registrationNo: "20260470009",
      name: "Punakha Skills Development Institute",
      dzongkhag: "Punakha",
      monitoringDate: "2024-10-01",
      checklistStatus: "In Progress",
    },
  ]);

  // Quality data structure
  const qualityData = [
    {
      id: "1",
      title: "Governance and Management",
      rows: [
        {
          id: "101",
          value:
            "Clear organizational structure with defined TOR for all staff",
        },
        { id: "102", value: "Vision, Mission and objectives displayed" },
        { id: "103", value: "Institute rules and regulations defined" },
        { id: "104", value: "Notice / Information board available" },
        { id: "105", value: "Institute operational plan available" },
        { id: "106", value: "Internet / WiFi facilities" },
        { id: "107", value: "Institute Management Committee established" },
      ],
    },
    {
      id: "2",
      title: "Infrastructure And Learning Resources",
      rows: [
        { id: "201", value: "Minimum two office rooms" },
        { id: "202", value: "Sufficient office computers" },
        { id: "203", value: "Printer / Photocopier available" },
        { id: "204", value: "Tables and chairs" },
        { id: "205", value: "Filing racks" },
        { id: "206", value: "Proper classroom ventilation" },
        { id: "207", value: "Projector / Smart board available" },
      ],
    },
    {
      id: "3",
      title: "Human Resources",
      rows: [
        {
          id: "301",
          value: "Trainer qualification one level higher than course",
        },
        {
          id: "302",
          value: "Trainer has minimum one year industry experience",
        },
        { id: "303", value: "Head of institute appointed" },
        {
          id: "304",
          value: "Office assistant with minimum Class XII qualification",
        },
      ],
    },
  ];

  // Function to get pre-filled data for an institute
  const getQualityDataForInstitute = (instituteId) => {
    // Pre-filled responses for different institutes - structured by category
    const instituteResponses = {
      1: {
        // Thimphu Technical Training Institute - Mostly YES
        1: {
          101: "Y",
          102: "Y",
          103: "Y",
          104: "Y",
          105: "Y",
          106: "Y",
          107: "Y",
        },
        2: {
          201: "Y",
          202: "Y",
          203: "Y",
          204: "Y",
          205: "Y",
          206: "Y",
          207: "Y",
        },
        3: {
          301: "Y",
          302: "Y",
          303: "Y",
          304: "Y",
        },
      },
      2: {
        // Paro Vocational Training Center - Mixed
        1: {
          101: "Y",
          102: "Y",
          103: "N",
          104: "Y",
          105: "N",
          106: "Y",
          107: "Y",
        },
        2: {
          201: "Y",
          202: "N",
          203: "Y",
          204: "Y",
          205: "N",
          206: "Y",
          207: "N",
        },
        3: {
          301: "Y",
          302: "N",
          303: "Y",
          304: "Y",
        },
      },
      3: {
        // Punakha Skills Development Institute - Mostly N
        1: {
          101: "N",
          102: "Y",
          103: "N",
          104: "N",
          105: "Y",
          106: "N",
          107: "Y",
        },
        2: {
          201: "N",
          202: "N",
          203: "Y",
          204: "N",
          205: "N",
          206: "Y",
          207: "N",
        },
        3: {
          301: "N",
          302: "N",
          303: "Y",
          304: "N",
        },
      },
    };

    // Pre-filled remarks
    const instituteRemarks = {
      1: {
        1: { 101: "Well defined structure" },
        2: { 201: "Good infrastructure" },
        3: { 301: "Qualified staff" },
      },
      2: {
        1: { 103: "Rules need to be updated", 105: "Plan needs revision" },
        2: { 202: "Need more computers", 205: "Need more filing racks" },
        3: { 302: "Need experienced trainer" },
      },
      3: {
        1: { 102: "Mission displayed but vision missing" },
        2: { 203: "Printer not working" },
        3: {},
      },
    };

    return {
      responses: instituteResponses[instituteId] || {},
      remarks: instituteRemarks[instituteId] || {},
    };
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle view checklist - Load data when dialog opens
  const handleViewChecklist = (institute) => {
    setSelectedInstitute(institute);
    // Get pre-filled data for this institute
    const { responses, remarks } = getQualityDataForInstitute(institute.id);
    setQualityResponses(responses);
    setQualityRemarks(remarks);
    setChecklistDialogOpen(true);
  };

  // Quality checklist handlers
  const handleQualityResponseChange = (categoryId, subQuestionId, value) => {
    setQualityResponses((prev) => {
      const newResponses = { ...prev };

      if (!newResponses[categoryId]) {
        newResponses[categoryId] = {};
      }

      if (newResponses[categoryId][subQuestionId] === value) {
        delete newResponses[categoryId][subQuestionId];
        if (Object.keys(newResponses[categoryId]).length === 0) {
          delete newResponses[categoryId];
        }
      } else {
        newResponses[categoryId][subQuestionId] = value;
      }

      return newResponses;
    });
  };

  const handleQualityRemarkChange = (categoryId, subQuestionId, value) => {
    setQualityRemarks((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [subQuestionId]: value,
      },
    }));
  };

  // Handle resubmit checklist
  const handleResubmit = async () => {
    setSubmitting(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Calculate completion percentage
    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach((row) => {
        totalQuestions++;
        const response = qualityResponses[category.id]?.[row.id];
        if (response === "Y" || response === "N") {
          answeredQuestions++;
        }
      });
    });

    const completionPercentage =
      totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    // Prepare submission data
    const submissionData = {
      instituteId: selectedInstitute?.id,
      instituteName: selectedInstitute?.name,
      registrationNo: selectedInstitute?.registrationNo,
      dzongkhag: selectedInstitute?.dzongkhag,
      monitoringDate: selectedInstitute?.monitoringDate,
      qualityResponses: qualityResponses,
      qualityRemarks: qualityRemarks,
      completionPercentage: completionPercentage,
      submittedAt: new Date().toISOString(),
    };

    console.log("Resubmitted Checklist Data:", submissionData);

    // Show success toast with details
    toast.success(
      <div>
        <strong>Checklist Resubmitted Successfully!</strong>
        <br />
        Institute: {selectedInstitute?.name}
        <br />
        Completion: {completionPercentage}% ({answeredQuestions}/
        {totalQuestions} questions answered)
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      },
    );

    // Update institute status in the table
    setInstitutes((prevInstitutes) =>
      prevInstitutes.map((inst) =>
        inst.id === selectedInstitute?.id
          ? { ...inst, checklistStatus: "Resubmitted" }
          : inst,
      ),
    );

    setSubmitting(false);
    setChecklistDialogOpen(false);
  };

  // Render checklist table
  const renderChecklist = (standard) => {
    // Get responses for this category
    const categoryResponses = qualityResponses[standard.id] || {};
    const categoryRemarks = qualityRemarks[standard.id] || {};

    return (
      <Grid item xs={12} key={standard.id}>
        <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }} mb={1}>
            {standard.title}
          </Typography>
          <TableContainer>
            <Table size="small" sx={TABLE_STYLE}>
              <TableHead>
                <TableRow>
                  <TableCell width="40">Sl. No</TableCell>
                  <TableCell>Quality Indicator</TableCell>
                  <TableCell align="center" width="80">
                    YES
                  </TableCell>
                  <TableCell align="center" width="80">
                    NO
                  </TableCell>
                  <TableCell width="250">Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {standard.rows.map((row, index) => {
                  const selectedValue = categoryResponses[row.id];
                  const isYes = selectedValue === "Y";
                  const isNo = selectedValue === "N";
                  const remark = categoryRemarks[row.id] || "";

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={isYes}
                          onChange={() => {
                            const newValue = isYes ? undefined : "Y";
                            handleQualityResponseChange(
                              standard.id,
                              row.id,
                              newValue,
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={isNo}
                          onChange={() => {
                            const newValue = isNo ? undefined : "N";
                            handleQualityResponseChange(
                              standard.id,
                              row.id,
                              newValue,
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Enter remarks"
                          value={remark}
                          onChange={(e) =>
                            handleQualityRemarkChange(
                              standard.id,
                              row.id,
                              e.target.value,
                            )
                          }
                          slotProps={{
                            input: {
                              sx: { fontSize: "0.75rem" },
                            },
                          }}
                          multiline
                          rows={2}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    );
  };

  // Paginated institutes
  const paginatedInstitutes = institutes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <Paper sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" mb={3}>
          Institute Monitoring Checklist
        </Typography>

        {/* Institutes Table */}
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
              <TableRow
                sx={{
                  background: "#f5f5f5",
                  "& .MuiTableCell-root": {
                    fontWeight: "bold",
                  },
                }}
              >
                <TableCell>#</TableCell>
                <TableCell>Registration No</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Dzongkhag</TableCell>
                <TableCell>Monitoring Date</TableCell>
                <TableCell align="center">View Checklist</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedInstitutes.length > 0 ? (
                paginatedInstitutes.map((institute, index) => (
                  <TableRow key={institute.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {institute.registrationNo}
                      </Typography>
                    </TableCell>
                    <TableCell>{institute.name}</TableCell>
                    <TableCell>{institute.dzongkhag}</TableCell>
                    <TableCell>{institute.monitoringDate}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewChecklist(institute)}
                        sx={{
                          textTransform: "none",
                          backgroundColor: "#1976d2",
                          "&:hover": {
                            backgroundColor: "#1565c0",
                          },
                        }}
                      >
                        View Checklist
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No institutes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Divider before pagination */}
        <Divider sx={{ my: 2 }} />

        {/* Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedInstitutes.length} of {institutes.length}{" "}
            institutes
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={institutes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              ".MuiTablePagination-select": {
                borderRadius: 1,
              },
              ".MuiTablePagination-displayedRows": {
                margin: 0,
              },
            }}
          />
        </Box>
      </Paper>

      {/* Checklist Dialog */}
      <Dialog
        open={checklistDialogOpen}
        onClose={() => !submitting && setChecklistDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Quality Standards Checklist - {selectedInstitute?.name}
            </Typography>
            <IconButton
              onClick={() => !submitting && setChecklistDialogOpen(false)}
              disabled={submitting}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Registration No: {selectedInstitute?.registrationNo} | Dzongkhag:{" "}
            {selectedInstitute?.dzongkhag} | Monitoring Date:{" "}
            {selectedInstitute?.monitoringDate}
          </Typography>

          {/* Quality Checklist Section */}
          <Box mt={2}>{qualityData.map(renderChecklist)}</Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setChecklistDialogOpen(false)}
            color="secondary"
            variant="outlined"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResubmit}
            variant="contained"
            color="primary"
            startIcon={
              submitting ? <CircularProgress size={20} /> : <ReplayIcon />
            }
            disabled={submitting}
            sx={{
              backgroundColor: "#ff9800",
              "&:hover": {
                backgroundColor: "#f57c00",
              },
            }}
          >
            {submitting ? "Resubmitting..." : "Resubmit"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstituteMonitoringIndex;
