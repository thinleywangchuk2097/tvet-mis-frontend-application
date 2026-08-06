// ViewProgramMonitoringIndex.jsx
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
  Radio,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { toast } from "react-toastify";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import ProgramMonitoringService from "../../../api/services/internal/monitoring/ProgramMonitoringService";
import CommonService from "../../../api/services/internal/common/CommonService";

// ==================== CONSTANTS ====================
const STATUS = {
  APPROVED: 57,
  RESUBMITTED: 104,
};

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

// ==================== UTILITY FUNCTIONS ====================
const structureChecklistData = (data) => {
  if (!data || data.length === 0) return [];

  const mainCategories = data.filter(
    (item) =>
      (item.parentId === 0 || item.parentId === null || !item.parentId) &&
      (!item.parent_id || item.parent_id === 0),
  );

  const subCategories = data.filter(
    (item) =>
      (item.parentId !== 0 && item.parentId) ||
      (item.parent_id !== 0 && item.parent_id),
  );

  let structured = [];

  if (mainCategories.length > 0) {
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
    structured = [
      {
        id: "1",
        title: "Quality Standards Checklist",
        rows: data.map((item) => ({
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

  return structured.filter((category) => category.rows.length > 0);
};

// ==================== CUSTOM HOOKS ====================
const useMonitoringChecklist = () => {
  const [qualityData, setQualityData] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQualityStandards = useCallback(async (serviceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await CommonService.getAllQualitystandards(serviceId);
      const structured = structureChecklistData(response.data || []);
      setQualityData(structured);
      if (structured.length === 0) {
        setError("No quality standards found for this service");
      }
    } catch (error) {
      console.error("Error fetching quality standards:", error);
      setError(error.message || "Failed to load quality standards");
      toast.error("Failed to load quality standards");
      setQualityData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const parseChecklistData = useCallback(
    (checklistString) => {
      try {
        const checklists = JSON.parse(checklistString);
        const responses = {};
        const remarks = {};

        checklists.forEach((item) => {
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

          const categoryId = foundCategory?.id || "default";
          if (!responses[categoryId]) responses[categoryId] = {};
          if (!remarks[categoryId]) remarks[categoryId] = {};
          responses[categoryId][item.standardId] = item.responseId;
          remarks[categoryId][item.standardId] = item.remarks || "";
        });

        return { responses, remarks };
      } catch (error) {
        console.error("Error parsing checklist data:", error);
        return { responses: {}, remarks: {} };
      }
    },
    [qualityData],
  );

  const handleQualityResponseChange = useCallback(
    (categoryId, questionId, value) => {
      setQualityResponses((prev) => {
        const newResponses = { ...prev };
        if (!newResponses[categoryId]) newResponses[categoryId] = {};
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
    },
    [],
  );

  const handleQualityRemarkChange = useCallback(
    (categoryId, questionId, value) => {
      setQualityRemarks((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], [questionId]: value },
      }));
    },
    [],
  );

  const isAllQuestionsAnswered = useMemo(() => {
    if (qualityData.length === 0) return false;
    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach((row) => {
        totalQuestions++;
        const response = qualityResponses[category.id]?.[row.id];
        if (response === "Y" || response === "N") answeredQuestions++;
      });
    });

    return totalQuestions > 0 && answeredQuestions === totalQuestions;
  }, [qualityData, qualityResponses]);

  const getProgressText = useCallback(() => {
    if (qualityData.length === 0) return "";
    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach(() => totalQuestions++);
    });

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId] || {}).forEach((questionId) => {
        const response = qualityResponses[categoryId][questionId];
        if (response === "Y" || response === "N") answeredQuestions++;
      });
    });

    return `${answeredQuestions}/${totalQuestions} questions answered`;
  }, [qualityData, qualityResponses]);

  const prepareQualityStandardsForUpdate = useCallback(
    (selectedProgram) => {
      const qualityStandardsData = [];
      Object.keys(qualityResponses).forEach((categoryId) => {
        Object.keys(qualityResponses[categoryId]).forEach((questionId) => {
          const responseValue = qualityResponses[categoryId][questionId];
          const remark = qualityRemarks[categoryId]?.[questionId] || "";
          if (responseValue && responseValue !== "") {
            let existingId = null;
            if (selectedProgram?.checklists) {
              try {
                const existingItems = JSON.parse(selectedProgram.checklists);
                const existingItem = existingItems.find(
                  (item) => item.standardId === parseInt(questionId, 10),
                );
                if (existingItem) existingId = existingItem.id;
              } catch (error) {
                console.error("Error parsing existing checklists:", error);
              }
            }
            qualityStandardsData.push({
              id: existingId,
              standardId: parseInt(questionId, 10),
              responseId: responseValue,
              remarks: remark,
            });
          }
        });
      });
      return qualityStandardsData;
    },
    [qualityResponses, qualityRemarks],
  );

  const resetChecklist = useCallback(() => {
    setQualityData([]);
    setQualityResponses({});
    setQualityRemarks({});
    setError(null);
  }, []);

  return {
    qualityData,
    qualityResponses,
    qualityRemarks,
    loading,
    error,
    fetchQualityStandards,
    parseChecklistData,
    handleQualityResponseChange,
    handleQualityRemarkChange,
    isAllQuestionsAnswered,
    getProgressText,
    prepareQualityStandardsForUpdate,
    resetChecklist,
    setQualityResponses,
    setQualityRemarks,
  };
};

// ==================== REUSABLE COMPONENTS ====================
const LoadingSpinner = ({ message = "Loading..." }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
  >
    <CircularProgress />
  </Box>
);

const SectionHeader = ({ title, onBack }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
    {onBack && (
      <IconButton onClick={onBack} sx={{ mr: 2 }} aria-label="back">
        <ArrowBackIcon />
      </IconButton>
    )}
    <Typography variant="h6">{title}</Typography>
  </Box>
);

const ProgramInfoHeader = ({ program, getDzongkhagName }) => {
  if (!program) return null;
  return (
    <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        <strong>Institute:</strong> {program?.institute_name} |{" "}
        <strong>Registration No:</strong> {program?.registration_no} |{" "}
        <strong>Course Type:</strong> {program?.course_type_name} |{" "}
        <strong>Course:</strong> {program?.course_name}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        <strong>Dzongkhag:</strong> {getDzongkhagName(program?.dzongkhag_id)} |{" "}
        <strong>Monitoring Date:</strong> {program?.monitoring_date}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary">
        <strong>Current Status:</strong> {program?.status || "Pending Review"}
      </Typography>
    </Box>
  );
};

const ProgressIndicator = ({ progressText, isComplete }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {progressText}
    </Typography>
    <Typography variant="caption" color={isComplete ? "success.main" : "error"}>
      {isComplete
        ? "✓ All questions have been answered"
        : "* Please answer all questions"}
    </Typography>
  </Box>
);

const ChecklistQuestion = ({
  row,
  index,
  categoryId,
  qualityResponses,
  qualityRemarks,
  onResponseChange,
  onRemarkChange,
}) => {
  const selectedValue = qualityResponses[categoryId]?.[row.id];
  const isYes = selectedValue === "Y";
  const isNo = selectedValue === "N";
  const remark = qualityRemarks[categoryId]?.[row.id] || "";

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
          sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: "1rem" } }}
          checked={isYes}
          onChange={() => {
            const newValue = isYes ? undefined : "Y";
            onResponseChange(categoryId, row.id, newValue);
          }}
        />
      </TableCell>
      <TableCell align="center" sx={{ p: "2px 4px" }}>
        <Radio
          size="small"
          sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: "1rem" } }}
          checked={isNo}
          onChange={() => {
            const newValue = isNo ? undefined : "N";
            onResponseChange(categoryId, row.id, newValue);
          }}
        />
      </TableCell>
      <TableCell sx={{ p: "4px 4px" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Remarks"
          value={remark}
          onChange={(e) => onRemarkChange(categoryId, row.id, e.target.value)}
          slotProps={{
            input: {
              sx: { fontSize: "0.70rem", py: 0.5, "& textarea": { py: 0.5 } },
            },
          }}
          multiline
          rows={1}
        />
      </TableCell>
    </TableRow>
  );
};

const ChecklistCategory = ({
  standard,
  qualityResponses,
  qualityRemarks,
  onResponseChange,
  onRemarkChange,
}) => (
  <Paper sx={{ p: 1.5, border: "1px solid", borderColor: "divider" }}>
    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }} mb={0.5}>
      {standard.title}
    </Typography>
    <TableContainer>
      <Table size="small" sx={TABLE_STYLE}>
        <TableHead>
          <TableRow>
            <TableCell width="30" sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
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
            <TableCell width="200" sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
              Remarks
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {standard.rows.map((row, index) => (
            <ChecklistQuestion
              key={row.id}
              row={row}
              index={index}
              categoryId={standard.id}
              qualityResponses={qualityResponses}
              qualityRemarks={qualityRemarks}
              onResponseChange={onResponseChange}
              onRemarkChange={onRemarkChange}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

const DescriptionField = ({ value, onChange, error, helperText }) => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="subtitle1" gutterBottom>
      Description / Remarks <span style={{ color: "red" }}>*</span>
    </Typography>
    <TextField
      fullWidth
      multiline
      rows={4}
      placeholder="Enter description or additional remarks about the program monitoring assessment..."
      value={value}
      onChange={onChange}
      variant="outlined"
      size="medium"
      error={!!error}
      helperText={helperText}
      sx={{ "& .MuiInputBase-root": { fontSize: "0.875rem" } }}
    />
  </Box>
);

const ActionButtons = ({
  onCancel,
  onResubmit,
  onApprove,
  submitting,
  isFormValid,
}) => (
  <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
    <Button
      onClick={onCancel}
      color="secondary"
      variant="outlined"
      disabled={submitting}
    >
      Cancel
    </Button>
    <Button
      onClick={onResubmit}
      variant="contained"
      startIcon={submitting ? <CircularProgress size={20} /> : <ReplayIcon />}
      disabled={submitting || !isFormValid}
      sx={{
        backgroundColor: "#ff9800",
        "&:hover": { backgroundColor: "#f57c00" },
        "&.Mui-disabled": { backgroundColor: "#ffb74d", opacity: 0.7 },
      }}
    >
      {submitting ? "Resubmitting..." : "Resubmit"}
    </Button>
    <Button
      onClick={onApprove}
      variant="contained"
      color="success"
      startIcon={
        submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />
      }
      disabled={submitting || !isFormValid}
      sx={{
        backgroundColor: "#4caf50",
        "&:hover": { backgroundColor: "#45a049" },
        "&.Mui-disabled": { backgroundColor: "#81c784", opacity: 0.7 },
      }}
    >
      {submitting ? "Approving..." : "Approve"}
    </Button>
  </Box>
);

const EmptyState = ({ message }) => (
  <Box sx={{ textAlign: "center", py: 4 }}>
    <Typography color="text.secondary">{message}</Typography>
  </Box>
);

// ==================== MAIN COMPONENT ====================
const ViewProgramMonitoringIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // Local state
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programMonitoringDetails, setProgramMonitoringDetails] = useState([]);
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  // Use custom hook for checklist management
  const checklist = useMonitoringChecklist();

  // Fetch dzongkhag list
  const fetchDzongkhagLists = useCallback(async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data || []);
    } catch (error) {
      console.error("Error fetching dzongkhag dropdown:", error);
      toast.error("Failed to load dzongkhags");
    }
  }, []);

  // Get dzongkhag name from ID
  const getDzongkhagName = useCallback(
    (dzongkhagId) => {
      const dzongkhag = dzongkhagList.find(
        (d) => d.id === parseInt(dzongkhagId, 10),
      );
      return dzongkhag ? dzongkhag.dzonkhagName || dzongkhag.name : dzongkhagId;
    },
    [dzongkhagList],
  );

  // Fetch program monitoring assessment
  const fetchProgramMonitoringAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        await ProgramMonitoringService.getProgramMonitoringByApplicationNo(
          applicationNo,
          access_token,
        );
      const data = Array.isArray(response.data)
        ? response.data
        : [response.data];
      setProgramMonitoringDetails(data);

      if (data && data.length > 0) {
        const program = data[0];
        setSelectedProgram(program);
        setDescription(program.description || "");
        setDescriptionError("");

        if (program.service_id) {
          await checklist.fetchQualityStandards(program.service_id);
          if (program.checklists) {
            const { responses, remarks } = checklist.parseChecklistData(
              program.checklists,
            );
            checklist.setQualityResponses(responses);
            checklist.setQualityRemarks(remarks);
          }
        } else {
          toast.error("Service ID not found for this program");
        }
      }
    } catch (error) {
      console.error("Error fetching Program Monitoring Details:", error);
      toast.error("Failed to load Program Monitoring Details");
    } finally {
      setLoading(false);
    }
  }, [applicationNo, access_token, checklist]);

  // Initial data fetch
  useEffect(() => {
    if (applicationNo) {
      fetchProgramMonitoringAssessment();
    }
    fetchDzongkhagLists();

    return () => {
      checklist.resetChecklist();
    };
  }, [
    applicationNo,
    fetchProgramMonitoringAssessment,
    fetchDzongkhagLists,
    checklist,
  ]);

  // Handle description change
  const handleDescriptionChange = useCallback((event) => {
    setDescription(event.target.value);
    if (event.target.value.trim()) {
      setDescriptionError("");
    }
  }, []);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return (
      checklist.isAllQuestionsAnswered &&
      description &&
      description.trim().length > 0
    );
  }, [checklist.isAllQuestionsAnswered, description]);

  // Submit handler
  const handleSubmit = useCallback(
    async (statusId, actionType) => {
      if (!description || description.trim() === "") {
        setDescriptionError(
          `Description / Remarks is required for ${actionType}`,
        );
        toast.error(`Please enter Description / Remarks for ${actionType}`);
        return;
      }

      setSubmitting(true);
      try {
        const qualityStandardsData =
          checklist.prepareQualityStandardsForUpdate(selectedProgram);

        if (qualityStandardsData.length === 0) {
          toast.error(`Please answer all questions before ${actionType}`);
          setSubmitting(false);
          return;
        }

        const payload = {
          id: selectedProgram?.id,
          instituteId: selectedProgram?.institute_id,
          registrationNo: selectedProgram?.registration_no,
          monitoringDate: selectedProgram?.monitoring_date,
          dzongkhagId: parseInt(selectedProgram?.dzongkhag_id, 10),
          exactLocation: selectedProgram?.exact_location,
          applicationNo: selectedProgram?.application_no,
          qualityStandards: qualityStandardsData,
          statusId: statusId,
          description: description.trim(),
          updatedBy: actionId,
          assignedRoleId: currentRoleId,
          serviceId: 51,
          courseTypeId: selectedProgram?.course_type_id,
          courseId: selectedProgram?.course_id,
        };

        const response = await ProgramMonitoringService.updateProgramMonitoring(
          payload,
          access_token,
        );

        if (response.status === 200 || response.status === 201) {
          toast.success(
            <div>
              <strong>Program Checklist {actionType}d Successfully!</strong>
              <br />
              Institute: {selectedProgram?.institute_name}
              <br />
              Course: {selectedProgram?.course_name}
              <br />
              Status: {actionType} (ID: {statusId})
            </div>,
            { position: "top-right", autoClose: 5000 },
          );
          setTimeout(() => navigate(-1), 2000);
        }
      } catch (error) {
        console.error(`Error ${actionType} checklist:`, error);
        toast.error(`Failed to ${actionType} checklist. Please try again.`);
      } finally {
        setSubmitting(false);
      }
    },
    [
      description,
      selectedProgram,
      checklist,
      actionId,
      currentRoleId,
      access_token,
      navigate,
    ],
  );

  // Wrapper functions for specific actions
  const handleApprove = useCallback(
    () => handleSubmit(STATUS.APPROVED, "Approve"),
    [handleSubmit],
  );
  const handleResubmit = useCallback(
    () => handleSubmit(STATUS.RESUBMITTED, "Resubmit"),
    [handleSubmit],
  );

  // Loading state
  if (loading) return <LoadingSpinner />;

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <SectionHeader
        title={`Program Monitoring Checklist - Application No: ${applicationNo}`}
        onBack={() => navigate(-1)}
      />

      {selectedProgram ? (
        <Box>
          <ProgramInfoHeader
            program={selectedProgram}
            getDzongkhagName={getDzongkhagName}
          />

          {checklist.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>
                Loading quality standards...
              </Typography>
            </Box>
          ) : checklist.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checklist.error}
            </Alert>
          ) : checklist.qualityData.length > 0 ? (
            <>
              <ProgressIndicator
                progressText={checklist.getProgressText()}
                isComplete={checklist.isAllQuestionsAnswered}
              />

              <Grid container spacing={2}>
                {checklist.qualityData.map((standard) => (
                  <Grid item size={{ xs: 12, md: 12 }} key={standard.id}>
                    <ChecklistCategory
                      standard={standard}
                      qualityResponses={checklist.qualityResponses}
                      qualityRemarks={checklist.qualityRemarks}
                      onResponseChange={checklist.handleQualityResponseChange}
                      onRemarkChange={checklist.handleQualityRemarkChange}
                    />
                  </Grid>
                ))}
              </Grid>

              <DescriptionField
                value={description}
                onChange={handleDescriptionChange}
                error={descriptionError}
                helperText={descriptionError}
              />

              <ActionButtons
                onCancel={() => navigate(-1)}
                onResubmit={handleResubmit}
                onApprove={handleApprove}
                submitting={submitting}
                isFormValid={isFormValid}
              />
            </>
          ) : (
            <EmptyState message="No quality standards available for this service" />
          )}
        </Box>
      ) : (
        <EmptyState
          message={`No data found for application number: ${applicationNo}`}
        />
      )}
    </Paper>
  );
};

export default ViewProgramMonitoringIndex;
