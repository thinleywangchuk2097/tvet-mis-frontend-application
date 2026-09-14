// ProgramMonitoringIndex.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Divider,
  Radio,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CommonService from "../../../api/services/internal/common/CommonService";
import ProgramMonitoringService from "../../../api/services/internal/monitoring/ProgramMonitoringService";

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

const INITIAL_STATUS_ID = 55;

// ==================== CUSTOM HOOKS ====================
const useMonitoringData = (access_token) => {
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [instituteTypeLists, setInstituteTypeLists] = useState([]);
  const [instituteLists, setInstituteLists] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [courseLists, setCourseLists] = useState([]);
  const [qualityData, setQualityData] = useState([]);

  const fetchInstituteTypeLists = useCallback(async () => {
    try {
      const response =
        await ProgramMonitoringService.getInstituteTypeDropdown(access_token);
      setInstituteTypeLists(response.data || []);
    } catch (error) {
      console.error("Error fetching institute type dropdown:", error);
      toast.error("Failed to load institute types");
    }
  }, [access_token]);

  const fetchInstituteLists = useCallback(
    async (typeId) => {
      try {
        const response = await ProgramMonitoringService.getInstituteDropdown(
          typeId,
          access_token,
        );
        setInstituteLists(response.data || []);
      } catch (error) {
        console.error("Error fetching institute dropdown:", error);
        toast.error("Failed to load institutes");
      }
    },
    [access_token],
  );

  const fetchCourseTypes = useCallback(async () => {
    try {
      const response =
        await ProgramMonitoringService.getCourseTypes(access_token);
      setCourseTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching course types:", error);
      toast.error("Failed to load course types");
    }
  }, [access_token]);

  const fetchCourseLists = useCallback(
    async (instituteId, courseTypeId) => {
      try {
        const response = await ProgramMonitoringService.getCourseByInstituteId(
          instituteId,
          courseTypeId,
          access_token,
        );
        setCourseLists(response.data || []);
      } catch (error) {
        console.error("Error fetching course dropdown:", error);
        toast.error("Failed to load courses");
      }
    },
    [access_token],
  );

  const fetchDzongkhagLists = useCallback(async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data || []);
    } catch (error) {
      console.error("Error fetching dzongkhag dropdown:", error);
      toast.error("Failed to load dzongkhags");
    }
  }, []);

  const fetchMonitoringChecklist = useCallback(async (serviceId) => {
    try {
      const response = await CommonService.getAllQualitystandards(serviceId);
      const checklistData = response.data || [];

      if (checklistData && checklistData.length > 0) {
        const mainCategories = checklistData.filter(
          (item) => item.parentId === 0 || !item.parentId,
        );
        const subCategories = checklistData.filter(
          (item) => item.parentId !== 0 && item.parentId,
        );
        const structured = mainCategories.map((category) => ({
          id: category.id.toString(),
          title: category.dropdownName || category.description,
          rows: subCategories
            .filter((sub) => sub.parentId === category.id)
            .map((sub) => ({
              id: sub.id.toString(),
              value: sub.dropdownName || sub.description,
            })),
        }));
        setQualityData(structured);
      } else {
        setQualityData([]);
      }
    } catch (error) {
      console.error("Error fetching monitoring checklist:", error);
      toast.error("Failed to load monitoring checklist");
      setQualityData([]);
    }
  }, []);

  const submitProgramMonitoring = useCallback(
    async (payload) => {
      try {
        const response = await ProgramMonitoringService.submitProgramMonitoring(
          payload,
          access_token,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success(`Program monitoring submitted successfully`);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error submitting program monitoring:", error);
        toast.error(error?.message || "Failed to submit program monitoring");
        return false;
      }
    },
    [access_token],
  );

  return {
    dzongkhagList,
    instituteTypeLists,
    instituteLists,
    courseTypes,
    courseLists,
    qualityData,
    setQualityData,
    setInstituteLists,
    setCourseLists,
    fetchInstituteTypeLists,
    fetchInstituteLists,
    fetchCourseTypes,
    fetchCourseLists,
    fetchDzongkhagLists,
    fetchMonitoringChecklist,
    submitProgramMonitoring,
  };
};

const useQualityChecklist = (qualityData) => {
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});

  const isAllRadiosChecked = useMemo(() => {
    if (qualityData.length === 0) return false;
    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach(() => {
        totalQuestions++;
        if (qualityResponses[category.id]?.[category.rows[0]?.id]) {
          answeredQuestions++;
        }
      });
    });

    // More accurate check: count all responses
    let actualAnswered = 0;
    Object.keys(qualityResponses).forEach((categoryId) => {
      actualAnswered += Object.keys(qualityResponses[categoryId] || {}).length;
    });

    return totalQuestions > 0 && actualAnswered === totalQuestions;
  }, [qualityData, qualityResponses]);

  const getProgressText = useCallback(() => {
    if (qualityData.length === 0) return "";

    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach(() => totalQuestions++);
    });

    Object.keys(qualityResponses).forEach((categoryId) => {
      answeredQuestions += Object.keys(
        qualityResponses[categoryId] || {},
      ).length;
    });

    return `${answeredQuestions}/${totalQuestions} questions answered`;
  }, [qualityData, qualityResponses]);

  const handleQualityResponseChange = useCallback(
    (categoryId, subQuestionId, value) => {
      setQualityResponses((prev) => {
        const newResponses = { ...prev };
        if (!newResponses[categoryId]) newResponses[categoryId] = {};

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
    },
    [],
  );

  const handleQualityRemarkChange = useCallback(
    (categoryId, subQuestionId, value) => {
      setQualityRemarks((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], [subQuestionId]: value },
      }));
    },
    [],
  );

  const prepareQualityStandardsForBackend = useCallback(() => {
    const qualityStandardsData = [];
    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((subQuestionId) => {
        const responseValue = qualityResponses[categoryId][subQuestionId];
        const remark = qualityRemarks[categoryId]?.[subQuestionId] || "";
        if (responseValue && responseValue !== "") {
          qualityStandardsData.push({
            standardId: parseInt(subQuestionId, 10),
            responseId: responseValue,
            remarks: remark,
          });
        }
      });
    });
    return qualityStandardsData;
  }, [qualityResponses, qualityRemarks]);

  const resetChecklist = useCallback(() => {
    setQualityResponses({});
    setQualityRemarks({});
  }, []);

  return {
    qualityResponses,
    qualityRemarks,
    isAllRadiosChecked,
    getProgressText,
    handleQualityResponseChange,
    handleQualityRemarkChange,
    prepareQualityStandardsForBackend,
    resetChecklist,
  };
};

const useFormState = (initialData = {}) => {
  const [parentEntityId, setParentEntityId] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedCourseType, setSelectedCourseType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dzongkhagId: "",
    exactLocation: "",
    monitoringDate: new Date().toISOString().split("T")[0],
    ...initialData,
  });

  const resetAll = useCallback(() => {
    setParentEntityId("");
    setSelectedInstitute("");
    setSelectedCourseType("");
    setSelectedCourse("");
    setShowForm(false);
    setFormData({
      dzongkhagId: "",
      exactLocation: "",
      monitoringDate: new Date().toISOString().split("T")[0],
    });
  }, []);

  return {
    parentEntityId,
    selectedInstitute,
    selectedCourseType,
    selectedCourse,
    showForm,
    formData,
    setParentEntityId,
    setSelectedInstitute,
    setSelectedCourseType,
    setSelectedCourse,
    setShowForm,
    setFormData,
    resetAll,
  };
};

// ==================== PROPTYPES ====================
const dropdownFieldPropTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  optionLabelKey: PropTypes.string,
  optionValueKey: PropTypes.string,
  placeholder: PropTypes.string,
};

const qualityChecklistTablePropTypes = {
  standard: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    rows: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        value: PropTypes.string,
      }),
    ),
  }).isRequired,
  qualityResponses: PropTypes.object.isRequired,
  qualityRemarks: PropTypes.object.isRequired,
  onResponseChange: PropTypes.func.isRequired,
  onRemarkChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  touched: PropTypes.object,
};

// ==================== REUSABLE COMPONENTS ====================
const DropdownField = ({
  value,
  onChange,
  label,
  options,
  disabled = false,
  optionLabelKey = "service_name",
  optionValueKey = "id",
  placeholder = "-- Please Select --",
  ...props
}) => (
  <FormControl fullWidth size="small" disabled={disabled}>
    <InputLabel>{label}</InputLabel>
    <Select value={value} onChange={onChange} label={label} {...props}>
      <MenuItem value="">{placeholder}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option[optionValueKey]} value={option[optionValueKey]}>
          {option[optionLabelKey]}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

DropdownField.propTypes = dropdownFieldPropTypes;

const QualityChecklistTable = ({
  standard,
  qualityResponses,
  qualityRemarks,
  onResponseChange,
  onRemarkChange,
  errors = {},
  touched = {},
}) => {
  const hasFieldError = (categoryId, rowId) => {
    const fieldName = `response_${categoryId}_${rowId}`;
    return touched[fieldName] && errors[fieldName];
  };

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
            {standard.rows.map((row, index) => {
              const selectedValue = qualityResponses[standard.id]?.[row.id];
              const isYes = selectedValue === "Y";
              const isNo = selectedValue === "N";
              const remark = qualityRemarks[standard.id]?.[row.id] || "";
              const hasError = hasFieldError(standard.id, row.id);
              const fieldName = `response_${standard.id}_${row.id}`;

              return (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                    {row.value}
                    {hasError && (
                      <FormHelperText
                        error
                        sx={{ mt: 0.25, fontSize: "0.65rem" }}
                      >
                        {errors[fieldName]}
                      </FormHelperText>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ p: "2px 4px" }}>
                    <Radio
                      size="small"
                      sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: "1rem" } }}
                      checked={isYes}
                      onChange={() => {
                        const newValue = isYes ? undefined : "Y";
                        onResponseChange(standard.id, row.id, newValue);
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
                        onResponseChange(standard.id, row.id, newValue);
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
                        onRemarkChange(standard.id, row.id, e.target.value)
                      }
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
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

QualityChecklistTable.propTypes = qualityChecklistTablePropTypes;

// ==================== MAIN COMPONENT ====================
const ProgramMonitoringIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  // Custom hooks
  const monitoringData = useMonitoringData(access_token);
  const formState = useFormState();
  const checklist = useQualityChecklist(monitoringData.qualityData);

  const [submitting, setSubmitting] = useState(false);

  // Fetch all dropdown data on mount
  useEffect(() => {
    monitoringData.fetchInstituteTypeLists();
    monitoringData.fetchDzongkhagLists();
    monitoringData.fetchCourseTypes();
  }, []);

  // Fetch monitoring checklist when course type changes
  useEffect(() => {
    if (formState.selectedCourseType) {
      monitoringData.fetchMonitoringChecklist(formState.selectedCourseType);
    } else {
      monitoringData.setQualityData([]);
      checklist.resetChecklist();
    }
  }, [formState.selectedCourseType]);

  // Fetch institutes when registration type changes
  useEffect(() => {
    if (formState.parentEntityId) {
      monitoringData.fetchInstituteLists(formState.parentEntityId);
    }
  }, [formState.parentEntityId]);

  // Fetch courses when institute and course type are selected
  useEffect(() => {
    if (formState.selectedInstitute && formState.selectedCourseType) {
      monitoringData.fetchCourseLists(
        formState.selectedInstitute,
        formState.selectedCourseType,
      );
    } else {
      monitoringData.setCourseLists([]);
      formState.setSelectedCourse("");
    }
  }, [formState.selectedInstitute, formState.selectedCourseType]);

  // Formik for validation
  const formik = useFormik({
    initialValues: {},
    validationSchema: Yup.object({}),
    onSubmit: () => {},
  });

  // Update formik values when qualityResponses change
  useEffect(() => {
    const newValues = {};
    Object.keys(checklist.qualityResponses).forEach((categoryId) => {
      Object.keys(checklist.qualityResponses[categoryId] || {}).forEach(
        (subQuestionId) => {
          const fieldName = `response_${categoryId}_${subQuestionId}`;
          newValues[fieldName] =
            checklist.qualityResponses[categoryId][subQuestionId];
        },
      );
    });
    formik.setValues(newValues);
  }, [checklist.qualityResponses]);

  // Handlers
  const handleParentEntityChange = (e) => {
    const value = e.target.value;
    formState.setParentEntityId(value);
    formState.setSelectedInstitute("");
    formState.setSelectedCourseType("");
    formState.setSelectedCourse("");
    monitoringData.setCourseLists([]);
    formState.setShowForm(false);
    formState.setFormData({
      dzongkhagId: "",
      exactLocation: "",
      monitoringDate: new Date().toISOString().split("T")[0],
    });
    monitoringData.setQualityData([]);
    checklist.resetChecklist();
  };

  const handleInstituteChange = (e) => {
    const value = e.target.value;
    formState.setSelectedInstitute(value);
    formState.setSelectedCourseType("");
    formState.setSelectedCourse("");
    monitoringData.setCourseLists([]);
    formState.setShowForm(false);
    monitoringData.setQualityData([]);
    checklist.resetChecklist();

    if (value) {
      const selectedInst = monitoringData.instituteLists.find(
        (inst) => inst.institute_id === value,
      );
      if (selectedInst) {
        formState.setFormData((prev) => ({
          ...prev,
          dzongkhagId: selectedInst.dzongkhag_id || "",
          exactLocation: selectedInst.exact_location || "",
        }));
      }
    }
  };

  const handleCourseTypeChange = (e) => {
    const value = e.target.value;
    formState.setSelectedCourseType(value);
    formState.setSelectedCourse("");
    monitoringData.setCourseLists([]);
    formState.setShowForm(false);
    monitoringData.setQualityData([]);
    checklist.resetChecklist();
  };

  const handleCourseChange = (e) => {
    const value = e.target.value;
    formState.setSelectedCourse(value);
    formState.setShowForm(!!value);
    if (!value) {
      monitoringData.setQualityData([]);
      checklist.resetChecklist();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    formState.setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getSelectedEntityDetails = useCallback(() => {
    const institute = monitoringData.instituteLists.find(
      (inst) => inst.institute_id === formState.selectedInstitute,
    );
    const courseType = monitoringData.courseTypes.find(
      (type) => type.id === formState.selectedCourseType,
    );
    const course = monitoringData.courseLists.find(
      (crs) =>
        String(crs.id || crs.course_id) === String(formState.selectedCourse),
    );
    return { institute, courseType, course };
  }, [monitoringData, formState]);

  const validateSubmission = useCallback(() => {
    const errors = [];
    if (!formState.parentEntityId)
      errors.push("Please select registration type");
    if (!formState.selectedInstitute) errors.push("Please select an institute");
    if (!formState.selectedCourseType)
      errors.push("Please select a course type");
    if (!formState.selectedCourse) errors.push("Please select a course");
    if (!formState.formData.monitoringDate)
      errors.push("Please select monitoring date");
    if (!formState.formData.dzongkhagId) errors.push("Please select dzongkhag");

    const totalQuestions = monitoringData.qualityData.reduce(
      (total, category) => total + category.rows.length,
      0,
    );
    const answeredQuestions = Object.keys(checklist.qualityResponses).reduce(
      (total, categoryId) =>
        total +
        Object.keys(checklist.qualityResponses[categoryId] || {}).length,
      0,
    );

    if (totalQuestions > 0 && answeredQuestions !== totalQuestions) {
      errors.push(
        `Please answer all quality standards questions (${answeredQuestions}/${totalQuestions} answered)`,
      );
    }
    return errors;
  }, [formState, monitoringData.qualityData, checklist.qualityResponses]);

  const handleSubmit = async () => {
    const validationErrors = validateSubmission();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setSubmitting(true);
    try {
      const qualityStandardsData =
        checklist.prepareQualityStandardsForBackend();
      const { institute, courseType, course } = getSelectedEntityDetails();
      const courseId = course?.id || course?.course_id;

      const payload = {
        instituteId: institute?.institute_id,
        instituteName: institute?.proposed_institute_name || "",
        registrationNo: institute?.registration_no || "",
        courseTypeId: courseType?.id,
        courseTypeName: courseType?.service_name || "",
        courseId: courseId,
        courseName: course?.course_name || "",
        monitoringDate: formState.formData.monitoringDate,
        dzongkhagId: parseInt(formState.formData.dzongkhagId, 10),
        exactLocation: formState.formData.exactLocation || "",
        qualityStandards: qualityStandardsData,
        createdBy: actionId,
        serviceId: formState.selectedCourseType,
        statusId: INITIAL_STATUS_ID,
      };

      const success = await monitoringData.submitProgramMonitoring(payload);
      if (success) {
        formState.resetAll();
        monitoringData.setQualityData([]);
        checklist.resetChecklist();
        formik.resetForm();
      }
    } catch (error) {
      console.error("Error in submission:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const showChecklist = useMemo(() => {
    return !!(
      formState.selectedInstitute &&
      formState.selectedCourse &&
      formState.selectedCourseType
    );
  }, [
    formState.selectedInstitute,
    formState.selectedCourseType,
    formState.selectedCourse,
  ]);

  const getCourseName = useCallback(() => {
    const course = monitoringData.courseLists.find(
      (c) => String(c.id || c.course_id) === String(formState.selectedCourse),
    );
    return course?.course_name || "";
  }, [monitoringData.courseLists, formState.selectedCourse]);

  return (
    <form onSubmit={formik.handleSubmit}>
      <Paper sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" mb={3}>
          Program Monitoring
        </Typography>

        {/* Dropdown Section */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item size={{ xs: 12, md: 3 }}>
            <DropdownField
              value={formState.parentEntityId}
              onChange={handleParentEntityChange}
              label="Select Registration Type"
              options={monitoringData.instituteTypeLists}
              optionLabelKey="service_name"
              placeholder="-- Please Select --"
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <DropdownField
              value={formState.selectedInstitute}
              onChange={handleInstituteChange}
              label="Select Institute"
              options={monitoringData.instituteLists}
              optionLabelKey="proposed_institute_name"
              optionValueKey="institute_id"
              disabled={!formState.parentEntityId}
              placeholder="-- Select Institute --"
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <DropdownField
              value={formState.selectedCourseType}
              onChange={handleCourseTypeChange}
              label="Select Course Type"
              options={monitoringData.courseTypes}
              disabled={!formState.selectedInstitute}
              placeholder="-- Select Course Type --"
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <DropdownField
              value={formState.selectedCourse}
              onChange={handleCourseChange}
              label="Select Course"
              options={monitoringData.courseLists}
              optionLabelKey="course_name"
              disabled={
                !formState.selectedCourseType || !formState.selectedInstitute
              }
              placeholder="-- Select Course --"
            />
          </Grid>
        </Grid>

        {/* Location & Monitoring Details */}
        {formState.showForm && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Location & Monitoring Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Monitoring Date"
                  type="date"
                  name="monitoringDate"
                  value={formState.formData.monitoringDate}
                  onChange={handleInputChange}
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <DropdownField
                  value={formState.formData.dzongkhagId}
                  onChange={handleInputChange}
                  label="Dzongkhag"
                  options={monitoringData.dzongkhagList}
                  optionLabelKey="dzonkhagName"
                  placeholder="-- Select Dzongkhag --"
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Exact Location"
                  name="exactLocation"
                  value={formState.formData.exactLocation}
                  onChange={handleInputChange}
                  placeholder="Enter exact location"
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Quality Standards Checklist */}
        {showChecklist && monitoringData.qualityData.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1">
                Quality Standards Checklist for {getCourseName()}
              </Typography>
              <Typography
                variant="caption"
                color={
                  checklist.isAllRadiosChecked ? "success.main" : "error.main"
                }
              >
                {checklist.getProgressText()}{" "}
                {checklist.isAllRadiosChecked && "✓"}
              </Typography>
            </Box>
            <Typography
              component="span"
              color="error"
              sx={{ mb: 2, display: "block", fontSize: "0.75rem" }}
            >
              (All questions must be answered)
            </Typography>
            <Box>
              {monitoringData.qualityData.map((standard) => (
                <QualityChecklistTable
                  key={standard.id}
                  standard={standard}
                  qualityResponses={checklist.qualityResponses}
                  qualityRemarks={checklist.qualityRemarks}
                  onResponseChange={checklist.handleQualityResponseChange}
                  onRemarkChange={checklist.handleQualityRemarkChange}
                  errors={formik.errors}
                  touched={formik.touched}
                />
              ))}
            </Box>
          </Box>
        )}

        {showChecklist && monitoringData.qualityData.length === 0 && (
          <Paper sx={{ p: 3, mb: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No quality standards available for the selected course
            </Typography>
          </Paper>
        )}

        {/* Submit Button */}
        {showChecklist && monitoringData.qualityData.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="small"
              startIcon={
                submitting ? (
                  <CircularProgress size={20} />
                ) : (
                  <CheckCircleIcon />
                )
              }
              disabled={submitting || !checklist.isAllRadiosChecked}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        )}
      </Paper>
    </form>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
ProgramMonitoringIndex.propTypes = {};

export default ProgramMonitoringIndex;
