// InstituteProgramMonitoringIndex.jsx
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
} from "@mui/material";
import { toast } from "react-toastify";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";
import { useSelector } from "react-redux";
import ProgramMonitoringService from "../../../api/services/internal/monitoring/ProgramMonitoringService";
import CommonService from "../../../api/services/internal/common/CommonService";

// ==================== CONSTANTS ====================
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

const SERVICE_ID = 51;

// ==================== UTILITY FUNCTIONS ====================
const structureChecklistData = (checklistData) => {
  if (!checklistData || checklistData.length === 0) return [];

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

  return structured.filter((category) => category.rows.length > 0);
};

// ==================== CUSTOM HOOKS ====================
const useMonitoringData = (registration_no, access_token) => {
  const [programMonitoringDetails, setProgramMonitoringDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [courseTypesMap, setCourseTypesMap] = useState({});
  const [courseNamesMap, setCourseNamesMap] = useState({});

  const fetchDzongkhagLists = useCallback(async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data || []);
    } catch (error) {
      console.error("Error fetching dzongkhag dropdown:", error);
      toast.error("Failed to load dzongkhags");
    }
  }, []);

  const fetchCourseTypes = useCallback(async () => {
    try {
      const response =
        await ProgramMonitoringService.getCourseTypes(access_token);
      const courseTypes = response.data || [];
      const typesMap = {};
      courseTypes.forEach((type) => {
        typesMap[type.id] = type.service_name;
      });
      setCourseTypesMap(typesMap);
    } catch (error) {
      console.error("Error fetching course types:", error);
    }
  }, [access_token]);

  const fetchCourseNames = useCallback(
    async (programs) => {
      const newMap = { ...courseNamesMap };
      for (const program of programs) {
        if (
          program.course_id &&
          program.institute_id &&
          program.course_type_id
        ) {
          try {
            const response =
              await ProgramMonitoringService.getCourseByInstituteId(
                program.institute_id,
                program.course_type_id,
                access_token,
              );
            const courses = response.data || [];
            courses.forEach((course) => {
              const id = course.id || course.course_id;
              newMap[id] = course.course_name;
            });
          } catch (error) {
            console.error("Error fetching course for program:", error);
          }
        }
      }
      setCourseNamesMap(newMap);
    },
    [access_token, courseNamesMap],
  );

  const fetchProgramMonitoringAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ProgramMonitoringService.getProgramMonitoring(
        registration_no,
        access_token,
      );
      const data = response.data || [];
      setProgramMonitoringDetails(data);

      // Fetch course names for each record
      if (data.length > 0) {
        await fetchCourseNames(data);
      }
    } catch (error) {
      console.error("Error fetching Program Monitoring Details:", error);
      toast.error("Failed to load Program Monitoring Details");
    } finally {
      setLoading(false);
    }
  }, [registration_no, access_token, fetchCourseNames]);

  const getDzongkhagName = useCallback(
    (dzongkhagId) => {
      const dzongkhag = dzongkhagList.find(
        (d) => d.id === parseInt(dzongkhagId, 10),
      );
      return dzongkhag ? dzongkhag.dzonkhagName || dzongkhag.name : dzongkhagId;
    },
    [dzongkhagList],
  );

  const getCourseTypeName = useCallback(
    (courseTypeId) => {
      return courseTypesMap[courseTypeId] || courseTypeId || "-";
    },
    [courseTypesMap],
  );

  const getCourseName = useCallback(
    (courseId) => {
      return courseNamesMap[courseId] || courseId || "-";
    },
    [courseNamesMap],
  );

  return {
    programMonitoringDetails,
    loading,
    dzongkhagList,
    courseTypesMap,
    courseNamesMap,
    fetchDzongkhagLists,
    fetchCourseTypes,
    fetchCourseNames,
    fetchProgramMonitoringAssessments,
    getDzongkhagName,
    getCourseTypeName,
    getCourseName,
  };
};

const useQualityChecklist = (selectedProgram) => {
  const [qualityData, setQualityData] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const fetchQualityStandards = useCallback(async (serviceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await CommonService.getAllQualitystandards(serviceId);
      const checklistData = response.data || [];
      const structured = structureChecklistData(checklistData);
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

  const handleDescriptionChange = useCallback((event) => {
    setDescription(event.target.value);
    if (event.target.value.trim()) {
      setDescriptionError("");
    }
  }, []);

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

  const isDescriptionFilled = useMemo(() => {
    return description && description.trim().length > 0;
  }, [description]);

  const isFormValid = useMemo(() => {
    return isAllQuestionsAnswered && isDescriptionFilled;
  }, [isAllQuestionsAnswered, isDescriptionFilled]);

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

  const prepareQualityStandardsForUpdate = useCallback(() => {
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
  }, [qualityResponses, qualityRemarks, selectedProgram]);

  const resetChecklist = useCallback(() => {
    setQualityResponses({});
    setQualityRemarks({});
    setDescription("");
    setDescriptionError("");
    setQualityData([]);
    setError(null);
  }, []);

  return {
    qualityData,
    qualityResponses,
    qualityRemarks,
    qualityLoading: loading,
    qualityError: error,
    description,
    descriptionError,
    setDescriptionError,
    fetchQualityStandards,
    parseChecklistData,
    handleQualityResponseChange,
    handleQualityRemarkChange,
    handleDescriptionChange,
    isAllQuestionsAnswered,
    isDescriptionFilled,
    isFormValid,
    getProgressText,
    prepareQualityStandardsForUpdate,
    resetChecklist,
  };
};

const usePagination = (data) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

const useDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const openDialog = useCallback((program) => {
    setSelectedProgram(program);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setSelectedProgram(null);
  }, []);

  return {
    open,
    selectedProgram,
    openDialog,
    closeDialog,
  };
};

// ==================== REUSABLE COMPONENTS ====================
const TableHeader = ({ columns }) => (
  <TableHead>
    <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold" } }}>
      {columns.map((col) => (
        <TableCell key={col.id} align={col.align || "left"}>
          {col.label}
        </TableCell>
      ))}
    </TableRow>
  </TableHead>
);

const ProgramsTable = ({ programs, getters, onViewChecklist, pagination }) => {
  const { getCourseTypeName, getCourseName, getDzongkhagName } = getters;
  const { page, rowsPerPage, paginatedData } = pagination;

  const columns = [
    { id: "index", label: "#" },
    { id: "applicationNo", label: "Application No" },
    { id: "registrationNo", label: "Registration No" },
    { id: "instituteName", label: "Institute Name" },
    { id: "courseType", label: "Course Type" },
    { id: "courseName", label: "Course Name" },
    { id: "dzongkhag", label: "Dzongkhag" },
    { id: "monitoringDate", label: "Monitoring Date" },
    { id: "viewChecklist", label: "View Checklist", align: "center" },
  ];

  return (
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
        <TableHeader columns={columns} />
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((program, index) => (
              <TableRow key={program.id} hover>
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {program.application_no}
                  </Typography>
                </TableCell>
                <TableCell>{program.registration_no}</TableCell>
                <TableCell>{program.institute_name}</TableCell>
                <TableCell>
                  {getCourseTypeName(program.course_type_id)}
                </TableCell>
                <TableCell>{getCourseName(program.course_id)}</TableCell>
                <TableCell>{getDzongkhagName(program.dzongkhag_id)}</TableCell>
                <TableCell>{program.monitoring_date}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => onViewChecklist(program)}
                    sx={{
                      textTransform: "none",
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#1565c0" },
                    }}
                  >
                    View Checklist
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                No program monitoring records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

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
              sx: {
                fontSize: "0.70rem",
                py: 0.5,
                "& textarea": { py: 0.5 },
              },
            },
          }}
          multiline
          rows={1}
        />
      </TableCell>
    </TableRow>
  );
};

const ChecklistCategory = ({ standard, ...props }) => {
  return (
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
                {...props}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// ==================== MAIN COMPONENT ====================
const InstituteProgramMonitoringIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // Custom hooks
  const monitoringData = useMonitoringData(registration_no, access_token);
  const pagination = usePagination(monitoringData.programMonitoringDetails);
  const dialog = useDialog();
  const checklist = useQualityChecklist(dialog.selectedProgram);

  const [submitting, setSubmitting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    monitoringData.fetchDzongkhagLists();
    monitoringData.fetchCourseTypes();
    monitoringData.fetchProgramMonitoringAssessments();
  }, []);

  // Load checklist when dialog opens
  useEffect(() => {
    if (dialog.selectedProgram && dialog.open) {
      const program = dialog.selectedProgram;
      checklist.resetChecklist();
      checklist.setDescription(program.description || "");

      if (program.service_id) {
        checklist.fetchQualityStandards(program.service_id);
        if (program.checklists) {
          const { responses, remarks } = checklist.parseChecklistData(
            program.checklists,
          );
          setQualityResponses(responses);
          setQualityRemarks(remarks);
        }
      } else {
        toast.error("Service ID not found for this program");
      }
    }
  }, [dialog.selectedProgram, dialog.open]);

  const handleViewChecklist = useCallback(
    (program) => {
      dialog.openDialog(program);
    },
    [dialog],
  );

  const handleResubmit = useCallback(async () => {
    if (!checklist.isDescriptionFilled) {
      checklist.setDescriptionError("Description / Remarks is required");
      toast.error("Please enter Description / Remarks");
      return;
    }

    setSubmitting(true);
    try {
      const qualityStandardsData = checklist.prepareQualityStandardsForUpdate();

      if (qualityStandardsData.length === 0) {
        toast.error("Please answer all questions before resubmitting");
        setSubmitting(false);
        return;
      }

      const payload = {
        id: dialog.selectedProgram?.id,
        instituteId: dialog.selectedProgram?.institute_id,
        registrationNo: dialog.selectedProgram?.registration_no,
        monitoringDate: dialog.selectedProgram?.monitoring_date,
        dzongkhagId: parseInt(dialog.selectedProgram?.dzongkhag_id, 10),
        exactLocation: dialog.selectedProgram?.exact_location,
        serviceId: SERVICE_ID,
        applicationNo: dialog.selectedProgram?.application_no,
        qualityStandards: qualityStandardsData,
        statusId: dialog.selectedProgram?.status_id,
        description: checklist.description.trim(),
        actionId: actionId,
        assignedRoleId: currentRoleId,
        courseTypeId: dialog.selectedProgram?.course_type_id,
        courseTypeName: monitoringData.getCourseTypeName(
          dialog.selectedProgram?.course_type_id,
        ),
        courseId: dialog.selectedProgram?.course_id,
        courseName: monitoringData.getCourseName(
          dialog.selectedProgram?.course_id,
        ),
      };

      const response = await ProgramMonitoringService.updateProgramMonitoring(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          <div>
            <strong>Program Checklist Resubmitted Successfully!</strong>
            <br />
            Institute: {dialog.selectedProgram?.institute_name}
            <br />
            Course:{" "}
            {monitoringData.getCourseName(dialog.selectedProgram?.course_id)}
            <br />
            Questions Updated: {qualityStandardsData.length}
          </div>,
        );
        await monitoringData.fetchProgramMonitoringAssessments();
        dialog.closeDialog();
        checklist.resetChecklist();
      }
    } catch (error) {
      console.error("Error resubmitting checklist:", error);
      toast.error("Failed to resubmit checklist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    checklist,
    dialog,
    actionId,
    currentRoleId,
    access_token,
    monitoringData,
  ]);

  // Loading state
  if (monitoringData.loading) {
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

  const getters = {
    getCourseTypeName: monitoringData.getCourseTypeName,
    getCourseName: monitoringData.getCourseName,
    getDzongkhagName: monitoringData.getDzongkhagName,
  };

  return (
    <>
      <Paper sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" mb={3}>
          Program Monitoring Checklist
        </Typography>

        <ProgramsTable
          programs={monitoringData.programMonitoringDetails}
          getters={getters}
          onViewChecklist={handleViewChecklist}
          pagination={pagination}
        />

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {pagination.paginatedData.length} of{" "}
            {monitoringData.programMonitoringDetails.length} programs
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={monitoringData.programMonitoringDetails.length}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={pagination.handleChangePage}
            onRowsPerPageChange={pagination.handleChangeRowsPerPage}
          />
        </Box>
      </Paper>

      {/* Checklist Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => !submitting && dialog.closeDialog()}
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
              Quality Standards Checklist -{" "}
              {dialog.selectedProgram?.institute_name}
            </Typography>
            <IconButton
              onClick={() => !submitting && dialog.closeDialog()}
              disabled={submitting}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Application No: {dialog.selectedProgram?.application_no} |
              Registration No: {dialog.selectedProgram?.registration_no} |
              Course:{" "}
              {monitoringData.getCourseName(dialog.selectedProgram?.course_id)}{" "}
              (
              {monitoringData.getCourseTypeName(
                dialog.selectedProgram?.course_type_id,
              )}
              ) | Dzongkhag:{" "}
              {monitoringData.getDzongkhagName(
                dialog.selectedProgram?.dzongkhag_id,
              )}{" "}
              | Monitoring Date: {dialog.selectedProgram?.monitoring_date}
            </Typography>
          </Box>

          {checklist.qualityLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>
                Loading quality standards...
              </Typography>
            </Box>
          ) : checklist.qualityError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checklist.qualityError}
            </Alert>
          ) : checklist.qualityData.length > 0 ? (
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
                  {checklist.getProgressText()}
                </Typography>
                {!checklist.isAllQuestionsAnswered ? (
                  <Typography variant="caption" color="error">
                    * Please answer all questions
                  </Typography>
                ) : (
                  <Typography variant="caption" color="success.main">
                    ✓ All questions answered
                  </Typography>
                )}
              </Box>

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

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Description / Remarks <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter description or additional remarks about the program monitoring assessment..."
                  value={checklist.description}
                  onChange={checklist.handleDescriptionChange}
                  variant="outlined"
                  size="medium"
                  error={!!checklist.descriptionError}
                  helperText={checklist.descriptionError}
                  sx={{ "& .MuiInputBase-root": { fontSize: "0.875rem" } }}
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
            onClick={dialog.closeDialog}
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
            disabled={submitting || !checklist.isFormValid}
            sx={{
              backgroundColor: "#ff9800",
              "&:hover": { backgroundColor: "#f57c00" },
              "&.Mui-disabled": { backgroundColor: "#ffb74d", opacity: 0.7 },
            }}
          >
            {submitting ? "Resubmitting..." : "Resubmit"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstituteProgramMonitoringIndex;
