import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Alert,
  FormHelperText,
} from "@mui/material";
import { toast } from "react-toastify";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";
import MonitoringAssessmentService from "../../../api/services/internal/monitoring/MonitoringAssessmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useSelector } from "react-redux";

const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 20,
    padding: "2px 4px",
    fontSize: "0.70rem",
    lineHeight: 1.1,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
    padding: "4px 4px",
  },
  "& .MuiRadio-root": {
    padding: "0px",
  },
};

const InstituteMonitoringIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
const currentRoleId = useSelector((state) => state.auth.current_roleId);
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Dialog state
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Description state
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  // Quality checklist state
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [instituteMonitoringDetails, setInstituteMonitoringDetails] = useState(
    [],
  );
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qualityData, setQualityData] = useState([]);
  const [qualityStandardsLoading, setQualityStandardsLoading] = useState(false);
  const [qualityStandardsError, setQualityStandardsError] = useState(null);

  useEffect(() => {
    fetchInstituteMonitoringAssessment();
    fetchDzongkhagLists();
  }, []);

  // Effect to parse checklists when quality data is loaded
  useEffect(() => {
    if (
      selectedInstitute &&
      qualityData.length > 0 &&
      selectedInstitute.checklists
    ) {
      const { responses, remarks } = parseChecklistData(
        selectedInstitute.checklists,
      );
      setQualityResponses(responses);
      setQualityRemarks(remarks);
    }
  }, [qualityData, selectedInstitute]);

  const fetchDzongkhagLists = async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data);
      console.log("Dzongkhag Dropdown:", response.data);
    } catch (error) {
      console.error("Error fetching dzongkhag dropdown:", error);
      toast.error("Failed to load dzongkhags");
    }
  };

  const fetchQualityStandards = async (serviceId) => {
    setQualityStandardsLoading(true);
    setQualityStandardsError(null);
    try {
      console.log("Fetching quality standards for service ID:", serviceId);
      const response = await CommonService.getAllQualitystandards(serviceId);
      const checklistData = response.data;
      console.log("Raw Quality Standards Response:", checklistData);

      if (checklistData && checklistData.length > 0) {
        // Structure the data based on parent-child relationship
        const mainCategories = checklistData.filter(
          (item) =>
            (item.parentId === 0 || item.parentId === null || !item.parentId) &&
            (!item.parent_id || item.parent_id === 0),
        );

        const subCategories = checklistData.filter(
          (item) =>
            (item.parentId !== 0 && item.parentId) ||
            (item.parent_id !== 0 && item.parent_id),
        );

        console.log("Main Categories:", mainCategories);
        console.log("Sub Categories:", subCategories);

        let structured = [];

        if (mainCategories.length > 0) {
          // Structure based on parent-child relationship
          structured = mainCategories.map((category) => ({
            id: category.id?.toString() || category.standard_id?.toString(),
            title:
              category.dropdownName ||
              category.description ||
              category.name ||
              `Category ${category.id}`,
            rows: subCategories
              .filter(
                (sub) =>
                  sub.parentId === category.id || sub.parent_id === category.id,
              )
              .map((sub) => ({
                id: sub.id?.toString() || sub.standard_id?.toString(),
                value:
                  sub.dropdownName ||
                  sub.description ||
                  sub.name ||
                  `Question ${sub.id}`,
              })),
          }));
        } else {
          // If no parent-child relationship, create a single category with all questions
          console.log(
            "No parent-child relationship found, creating single category",
          );
          structured = [
            {
              id: "1",
              title: "Quality Standards Checklist",
              rows: checklistData.map((item) => ({
                id: item.id?.toString() || item.standard_id?.toString(),
                value:
                  item.dropdownName ||
                  item.description ||
                  item.name ||
                  `Question ${item.id}`,
              })),
            },
          ];
        }

        // Filter out categories with no rows
        structured = structured.filter((category) => category.rows.length > 0);

        console.log("Structured quality data:", structured);
        setQualityData(structured);

        if (structured.length === 0) {
          setQualityStandardsError(
            "No quality standards found for this service",
          );
        }
      } else {
        console.log("No quality standards data received");
        setQualityStandardsError(
          "No quality standards available for this service",
        );
        setQualityData([]);
      }
    } catch (error) {
      console.error("Error fetching quality standards:", error);
      setQualityStandardsError(
        error.message || "Failed to load quality standards",
      );
      toast.error("Failed to load quality standards");
      setQualityData([]);
    } finally {
      setQualityStandardsLoading(false);
    }
  };

  const fetchInstituteMonitoringAssessment = async () => {
    setLoading(true);
    try {
      const response =
        await MonitoringAssessmentService.getMonitoringAssessment(
          registration_no,
          access_token,
        );
      setInstituteMonitoringDetails(response.data);
      console.log("Institute Monitoring Details:", response.data);
    } catch (error) {
      console.error("Error fetching Institute Monitoring Details:", error);
      toast.error("Failed to load Institute Monitoring Details");
    } finally {
      setLoading(false);
    }
  };

  // Parse checklist data from API response
  const parseChecklistData = useCallback(
    (checklistString) => {
      try {
        const checklists = JSON.parse(checklistString);
        console.log("Parsing checklists:", checklists);
        const responses = {};
        const remarks = {};

        checklists.forEach((item) => {
          // Find the category for this standardId from qualityData
          let foundCategory = null;
          for (const category of qualityData) {
            const foundRow = category.rows.find(
              (row) => row.id === item.standardId?.toString(),
            );
            if (foundRow) {
              foundCategory = category;
              break;
            }
          }

          if (foundCategory) {
            const categoryId = foundCategory.id;
            if (!responses[categoryId]) {
              responses[categoryId] = {};
            }
            if (!remarks[categoryId]) {
              remarks[categoryId] = {};
            }
            responses[categoryId][item.standardId] = item.responseId;
            remarks[categoryId][item.standardId] = item.remarks || "";
          } else {
            // If category not found, put in a default category
            console.log("No category found for standardId:", item.standardId);
            const defaultCategoryId = "default";
            if (!responses[defaultCategoryId]) {
              responses[defaultCategoryId] = {};
            }
            if (!remarks[defaultCategoryId]) {
              remarks[defaultCategoryId] = {};
            }
            responses[defaultCategoryId][item.standardId] = item.responseId;
            remarks[defaultCategoryId][item.standardId] = item.remarks || "";
          }
        });

        console.log("Mapped responses:", responses);
        console.log("Mapped remarks:", remarks);
        return { responses, remarks };
      } catch (error) {
        console.error("Error parsing checklist data:", error);
        return { responses: {}, remarks: {} };
      }
    },
    [qualityData],
  );

  // Get dzongkhag name from ID
  const getDzongkhagName = useCallback(
    (dzongkhagId) => {
      const dzongkhag = dzongkhagList.find(
        (d) => d.id === parseInt(dzongkhagId),
      );
      return dzongkhag ? dzongkhag.dzonkhagName || dzongkhag.name : dzongkhagId;
    },
    [dzongkhagList],
  );

  // Handle view checklist - Load data from API
  const handleViewChecklist = async (institute) => {
    setSelectedInstitute(institute);
    setChecklistDialogOpen(true);

    // Reset previous data
    setQualityResponses({});
    setQualityRemarks({});
    setDescription(institute.description || ""); // Set description if exists
    setDescriptionError("");

    // Fetch quality standards using the service_id from the institute data
    if (institute.service_id) {
      await fetchQualityStandards(institute.service_id);
      // The useEffect will handle parsing the checklists after qualityData is set
    } else {
      toast.error("Service ID not found for this institute");
      setQualityData([]);
    }
  };

  // Handle description change
  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
    if (event.target.value.trim()) {
      setDescriptionError("");
    }
  };

  // Handle quality response change
  const handleQualityResponseChange = (categoryId, questionId, value) => {
    setQualityResponses((prev) => {
      const newResponses = { ...prev };

      if (!newResponses[categoryId]) {
        newResponses[categoryId] = {};
      }

      if (newResponses[categoryId][questionId] === value) {
        delete newResponses[categoryId][questionId];
        if (Object.keys(newResponses[categoryId]).length === 0) {
          delete newResponses[categoryId];
        }
      } else {
        newResponses[categoryId][questionId] = value;
      }

      return newResponses;
    });
  };

  const handleQualityRemarkChange = (categoryId, questionId, value) => {
    setQualityRemarks((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [questionId]: value,
      },
    }));
  };

  // Check if all radio buttons are answered (either YES or NO)
  const isAllQuestionsAnswered = useMemo(() => {
    if (qualityData.length === 0) return false;

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

    return totalQuestions > 0 && answeredQuestions === totalQuestions;
  }, [qualityData, qualityResponses]);

  // Check if description is filled
  const isDescriptionFilled = useMemo(() => {
    return description && description.trim().length > 0;
  }, [description]);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return isAllQuestionsAnswered && isDescriptionFilled;
  }, [isAllQuestionsAnswered, isDescriptionFilled]);

  // Get progress text
  const getProgressText = useCallback(() => {
    if (qualityData.length === 0) return "";

    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach(() => {
        totalQuestions++;
      });
    });

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId] || {}).forEach((questionId) => {
        const response = qualityResponses[categoryId][questionId];
        if (response === "Y" || response === "N") {
          answeredQuestions++;
        }
      });
    });

    return `${answeredQuestions}/${totalQuestions} questions answered`;
  }, [qualityData, qualityResponses]);

  // Prepare quality standards for update
  const prepareQualityStandardsForUpdate = useCallback(() => {
    const qualityStandardsData = [];

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((questionId) => {
        const responseValue = qualityResponses[categoryId][questionId];
        const remark = qualityRemarks[categoryId]?.[questionId] || "";

        if (responseValue && responseValue !== "") {
          // Find existing ID if it exists
          let existingId = null;
          if (selectedInstitute?.checklists) {
            try {
              const existingItems = JSON.parse(selectedInstitute.checklists);
              const existingItem = existingItems.find(
                (item) => item.standardId === parseInt(questionId),
              );
              if (existingItem) {
                existingId = existingItem.id;
              }
            } catch (error) {
              console.error("Error parsing existing checklists:", error);
            }
          }

          qualityStandardsData.push({
            id: existingId,
            standardId: parseInt(questionId),
            responseId: responseValue,
            remarks: remark,
          });
        }
      });
    });

    console.log("Prepared quality standards for update:", qualityStandardsData);
    return qualityStandardsData;
  }, [qualityResponses, qualityRemarks, selectedInstitute]);

  // Handle resubmit checklist
  const handleResubmit = async () => {
    // Validate description before submission
    if (!description || description.trim() === "") {
      setDescriptionError("Description / Remarks is required");
      toast.error("Please enter Description / Remarks");
      return;
    }

    setSubmitting(true);

    try {
      const qualityStandardsData = prepareQualityStandardsForUpdate();

      if (qualityStandardsData.length === 0) {
        toast.error("Please answer all questions before resubmitting");
        setSubmitting(false);
        return;
      }

      const payload = {
        id: selectedInstitute?.id,
        instituteId: selectedInstitute?.institute_id,
        registrationNo: selectedInstitute?.registration_no,
        monitoringDate: selectedInstitute?.monitoring_date,
        dzongkhagId: parseInt(selectedInstitute?.dzongkhag_id),
        exactLocation: selectedInstitute?.exact_location,
        //service_id: parseInt(selectedInstitute?.service_id),
        serviceId: 47,
        applicationNo: selectedInstitute?.application_no,
        qualityStandards: qualityStandardsData,
        statusId: selectedInstitute?.status_id,
        description: description.trim(),
        actionId: actionId,
        assignedRoleId:currentRoleId
      };

      console.log("Resubmit Payload:", payload);

      // Call API to update monitoring assessment
      const response =
        await MonitoringAssessmentService.updateMonitoringAssessment(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          <div>
            <strong>Checklist Resubmitted Successfully!</strong>
            <br />
            Institute: {selectedInstitute?.institute_name}
            <br />
            Questions Updated: {qualityStandardsData.length}
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
          },
        );

        // Refresh the data
        await fetchInstituteMonitoringAssessment();
        setChecklistDialogOpen(false);
      }
    } catch (error) {
      console.error("Error resubmitting checklist:", error);
      toast.error("Failed to resubmit checklist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render checklist table
  const renderChecklist = useCallback(
    (standard) => {
      const categoryResponses = qualityResponses[standard.id] || {};
      const categoryRemarks = qualityRemarks[standard.id] || {};

      return (
        <Grid item size={{ xs: 12, md: 12 }} key={standard.id}>
          <Paper sx={{ p: 1.5, border: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }} mb={0.5}>
              {standard.title}
            </Typography>
            <TableContainer>
              <Table size="small" sx={TABLE_STYLE}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      width="30"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      Sl. No
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                      Quality Indicator
                    </TableCell>
                    <TableCell
                      align="center"
                      width="60"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      YES
                    </TableCell>
                    <TableCell
                      align="center"
                      width="60"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      NO
                    </TableCell>
                    <TableCell
                      width="200"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      Remarks
                    </TableCell>
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
                        <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                          {row.value}
                        </TableCell>
                        <TableCell align="center" sx={{ p: "2px 4px" }}>
                          <Radio
                            size="small"
                            sx={{
                              p: 0,
                              "& .MuiSvgIcon-root": {
                                fontSize: "1rem",
                              },
                            }}
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
                        <TableCell align="center" sx={{ p: "2px 4px" }}>
                          <Radio
                            size="small"
                            sx={{
                              p: 0,
                              "& .MuiSvgIcon-root": {
                                fontSize: "1rem",
                              },
                            }}
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
                        <TableCell sx={{ p: "4px 4px" }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Remarks"
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
                                sx: {
                                  fontSize: "0.70rem",
                                  py: 0.5,
                                  "& textarea": {
                                    py: 0.5,
                                  },
                                },
                              },
                            }}
                            multiline
                            rows={1}
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
    },
    [qualityResponses, qualityRemarks],
  );

  // Paginated institutes
  const paginatedInstitutes = instituteMonitoringDetails.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

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
                <TableCell>Application No</TableCell>
                <TableCell>Registration No</TableCell>
                <TableCell>Institute Name</TableCell>
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
                        {institute.application_no}
                      </Typography>
                    </TableCell>
                    <TableCell>{institute.registration_no}</TableCell>
                    <TableCell>{institute.institute_name}</TableCell>
                    <TableCell>
                      {getDzongkhagName(institute.dzongkhag_id)}
                    </TableCell>
                    <TableCell>{institute.monitoring_date}</TableCell>
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
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No institutes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedInstitutes.length} of{" "}
            {instituteMonitoringDetails.length} institutes
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={instituteMonitoringDetails.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
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
              Quality Standards Checklist - {selectedInstitute?.institute_name}
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
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Application No: {selectedInstitute?.application_no} | Registration
              No: {selectedInstitute?.registration_no} | Dzongkhag:{" "}
              {getDzongkhagName(selectedInstitute?.dzongkhag_id)} | Monitoring
              Date: {selectedInstitute?.monitoring_date}
            </Typography>
          </Box>

          {qualityStandardsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>
                Loading quality standards...
              </Typography>
            </Box>
          ) : qualityStandardsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {qualityStandardsError}
            </Alert>
          ) : qualityData.length > 0 ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {getProgressText()}
                </Typography>
                {!isAllQuestionsAnswered && (
                  <Typography variant="caption" color="error">
                    * Please answer all questions
                  </Typography>
                )}
                {isAllQuestionsAnswered && (
                  <Typography variant="caption" color="success.main">
                    ✓ All questions must be answered yes
                  </Typography>
                )}
              </Box>
              <Grid container spacing={2}>
                {qualityData.map(renderChecklist)}
              </Grid>

              {/* Description Field - Below Quality Standards Table */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Description / Remarks <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter description or additional remarks about the monitoring assessment..."
                  value={description}
                  onChange={handleDescriptionChange}
                  variant="outlined"
                  size="medium"
                  error={!!descriptionError}
                  helperText={descriptionError}
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">
                No quality standards available
              </Typography>
            </Box>
          )}
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
            disabled={submitting || !isFormValid}
            sx={{
              backgroundColor: "#ff9800",
              "&:hover": { backgroundColor: "#f57c00" },
              "&.Mui-disabled": {
                backgroundColor: "#ffb74d",
                opacity: 0.7,
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
