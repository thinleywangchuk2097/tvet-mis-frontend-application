import { useState, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormGroup,
  Checkbox,
  IconButton,
  Stack,
  FormHelperText,
  CircularProgress,
  Rating,
  OutlinedInput,
  ListItemText,
  Input,
} from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import { useSelector } from "react-redux";
import GenerateTracerService from "../../../api/services/internal/tracer/GenerateTracerService";
import CommonService from "../../../api/services/internal/common/CommonService";
import TraineeTracerSurvey from "./TraineeTracerSurvey";
import EmployerTracerSurvey from "./EmployerTracerSurvey";
import { toast } from "react-toastify";

/* ============================================================
   Show/Hide condition helpers (inline)
   ============================================================ */

const parseShowWhenOptions = (showWhenOption) => {
  if (!showWhenOption) return [];
  return String(showWhenOption)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
};

const flattenSurveyQuestions = (questions) => {
  const flat = [];
  (questions || []).forEach((q, qi) => {
    flat.push({
      ...q,
      __key: q.id,
      __parentId: null,
      __depth: 0,
      __rootIndex: qi,
    });
    (q.subQuestions || []).forEach((sub, si) => {
      flat.push({
        ...sub,
        __key: `sub_${sub.id}`,
        __parentId: q.id,
        __depth: 1,
        __rootIndex: qi,
        __subIndex: si,
      });
    });
  });
  return flat;
};

const buildOptionTextLookup = (questions) => {
  const lookup = {};
  (questions || []).forEach((q) => {
    lookup[q.id] = {};
    (q.options || []).forEach((opt) => {
      const id = opt?.id ?? opt?.optionId;
      const text =
        opt?.text ?? opt?.optionText ?? (typeof opt === "string" ? opt : null);
      if (id != null && text != null) lookup[q.id][String(id)] = text;
    });
    (q.subQuestions || []).forEach((sub) => {
      lookup[`sub_${sub.id}`] = {};
      (sub.options || []).forEach((opt) => {
        const id = opt?.id ?? opt?.optionId;
        const text =
          opt?.text ??
          opt?.optionText ??
          (typeof opt === "string" ? opt : null);
        if (id != null && text != null) {
          lookup[`sub_${sub.id}`][String(id)] = text;
        }
      });
      lookup[sub.id] = lookup[`sub_${sub.id}`];
    });
  });
  return lookup;
};

const evaluateOwnCondition = (
  question,
  byId,
  selectedValues,
  optionTextLookup,
) => {
  if (question.showCondition !== "option") return true;
  if (!question.dependsOnQuestionId) return true;

  const depFlat = byId[question.dependsOnQuestionId];
  if (!depFlat) return true;

  const depKey = depFlat.__key;
  const selectedValue = selectedValues[depKey];

  const triggerOptions = parseShowWhenOptions(question.showWhenOption);
  if (triggerOptions.length === 0) return true;

  const depLookup = optionTextLookup[depKey] || {};

  if (Array.isArray(selectedValue)) {
    if (selectedValue.length === 0) return false;
    const selectedTexts = selectedValue.map(
      (v) => depLookup[String(v)] ?? String(v),
    );
    return triggerOptions.some((t) => selectedTexts.includes(t));
  }

  if (selectedValue == null || selectedValue === "") return false;
  const selectedText =
    depLookup[String(selectedValue)] ?? String(selectedValue);
  return triggerOptions.includes(selectedText);
};

const computeVisibility = (questions, selectedValues) => {
  const flat = flattenSurveyQuestions(questions);

  const byId = {};
  flat.forEach((q) => {
    if (q.__depth === 0) byId[q.id] = q;
    else byId[`sub_${q.id}`] = q;
    if (q.__depth === 1) byId[q.id] = q;
  });

  const optionTextLookup = buildOptionTextLookup(questions);

  const visibility = {};
  const computing = new Set();

  const compute = (q) => {
    if (q.__key in visibility) return visibility[q.__key];
    if (computing.has(q.__key)) return true;
    computing.add(q.__key);

    let result = true;

    if (q.__depth === 1 && q.__parentId != null) {
      const parent = byId[q.__parentId];
      if (parent && !compute(parent)) {
        computing.delete(q.__key);
        visibility[q.__key] = false;
        return false;
      }
    }

    if (q.showCondition === "option" && q.dependsOnQuestionId != null) {
      const depFlat = byId[q.dependsOnQuestionId];
      if (!depFlat) {
        result = true;
      } else if (!compute(depFlat)) {
        result = false;
      } else {
        result = evaluateOwnCondition(
          q,
          byId,
          selectedValues,
          optionTextLookup,
        );
      }
    }

    computing.delete(q.__key);
    visibility[q.__key] = result;
    return result;
  };

  flat.forEach((q) => compute(q));
  return visibility;
};

/* ============================================================
   Main component
   ============================================================ */
const SendTracerIndex = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentTracerTypes, setParentTracerTypes] = useState([]);
  const [subTracerTypes, setSubTracerTypes] = useState([]);
  const [isLoadingSubTypes, setIsLoadingSubTypes] = useState(false);
  const [selectedParentType, setSelectedParentType] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [tracerDetails, setTracerDetails] = useState([]);
  const [tracerApplicationDetails, setTracerApplicationDetails] = useState([]);
  const [tracerQuestionDropdownType, setTracerQuestionDropdownType] = useState(
    [],
  );
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [sendError, setSendError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingValues, setRatingValues] = useState({});
  const [multiSelectValues, setMultiSelectValues] = useState({});
  const [textInputValues, setTextInputValues] = useState({});
  const [textAreaValues, setTextAreaValues] = useState({});
  const [multipleTextValues, setMultipleTextValues] = useState({});
  const [dropdownValues, setDropdownValues] = useState({});

  const access_token = useSelector((state) => state.auth.accessToken);

  /* ---------------- Formik (send validation) ---------------- */
  const sendValidationSchema = yup.object({
    parentTracerTypeId: yup
      .string()
      .required("Please select a parent tracer type"),
    subTracerTypeId: yup.string().required("Please select a sub tracer type"),
  });

  const formik = useFormik({
    initialValues: { parentTracerTypeId: "", subTracerTypeId: "" },
    validationSchema: sendValidationSchema,
    onSubmit: () => {},
  });

  /* ---------------- Pagination ---------------- */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  /* ---------------- Effects ---------------- */
  useEffect(() => {
    if (access_token) {
      fetchParentTracerTypes();
      fetchTracerDetails();
      fetchTracerQuestionDropdownType();
    }
  }, [access_token]);

  /* ---------------- API calls ---------------- */
  const fetchParentTracerTypes = async () => {
    if (!access_token) return;
    try {
      const response =
        await GenerateTracerService.getParentTracerTypes(access_token);
      setParentTracerTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching parent tracer types:", error);
      toast.error("Error fetching parent tracer types");
      setParentTracerTypes([]);
    }
  };

  const fetchTracerDetails = async () => {
    if (!access_token) return;
    setLoading(true);
    try {
      const response =
        await GenerateTracerService.getTracerAllApplications(access_token);
      setTracerDetails(response.data || []);
    } catch (error) {
      console.error("Error fetching tracer details:", error);
      toast.error("Error fetching tracer details");
      setTracerDetails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracerApplicationDetails = async (applicationNo) => {
    if (!access_token) return [];
    setViewLoading(true);
    try {
      const response =
        await GenerateTracerService.getTracerDetailsByApplicationNo(
          applicationNo,
          access_token,
        );
      setTracerApplicationDetails(response.data || []);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching tracer application details:", error);
      toast.error("Error fetching tracer application details");
      return [];
    } finally {
      setViewLoading(false);
    }
  };

  const fetchTracerQuestionDropdownType = async () => {
    if (!access_token) return;
    try {
      const response =
        await GenerateTracerService.getTracerQuestionDropdownType(access_token);
      setTracerQuestionDropdownType(response.data || []);
    } catch (error) {
      console.error("Error fetching tracer question dropdown types:", error);
      toast.error("Error fetching question dropdown types");
      setTracerQuestionDropdownType([]);
    }
  };

  const fetchSubTracerTypes = async (parentId) => {
    if (!parentId) {
      setSubTracerTypes([]);
      return;
    }
    setIsLoadingSubTypes(true);
    try {
      const response = await CommonService.getByParentId(parentId);
      const subTypes = (response.data || []).map((item) => ({
        id: item.id || item.sub_tracer_type_id,
        name: item.name || item.dropdown_name,
        ...item,
      }));
      setSubTracerTypes(subTypes);
    } catch (error) {
      console.error("Error fetching sub tracer types:", error);
      toast.error("Error fetching sub tracer types");
      setSubTracerTypes([]);
    } finally {
      setIsLoadingSubTypes(false);
    }
  };

  /* ---------------- Filter change handlers ---------------- */
  const handleParentTracerTypeChange = async (selectedParentId) => {
    setSelectedParentType(selectedParentId);
    setSelectedSubType("");
    formik.setFieldValue("parentTracerTypeId", selectedParentId);
    formik.setFieldValue("subTracerTypeId", "");
    formik.setFieldTouched("parentTracerTypeId", false);
    formik.setFieldTouched("subTracerTypeId", false);
    await fetchSubTracerTypes(selectedParentId);
  };

  const handleSubTracerTypeChange = (selectedSubId) => {
    setSelectedSubType(selectedSubId);
    formik.setFieldValue("subTracerTypeId", selectedSubId);
    formik.setFieldTouched("subTracerTypeId", false);
  };

  /* ---------------- Question-type helpers ---------------- */
  const getQuestionTypeValue = (typeId) => {
    if (!typeId) return null;
    const questionType = (tracerQuestionDropdownType || []).find(
      (t) => t.id === typeId.toString(),
    );
    return questionType ? questionType.value : null;
  };
  const getQuestionTypeForId = (typeId) => getQuestionTypeValue(typeId);

  /* ---------------- Parsers (preserve conditions) ---------------- */
  const parseOptions = (optionsJson) => {
    if (!optionsJson || optionsJson === "[]") return [];
    try {
      const parsed =
        typeof optionsJson === "string" ? JSON.parse(optionsJson) : optionsJson;
      if (!Array.isArray(parsed)) return [];
      if (parsed.length > 0 && parsed[0]?.optionText) {
        return parsed.map((opt) => ({ id: opt.id, text: opt.optionText }));
      }
      return parsed;
    } catch (error) {
      console.error("Error parsing options:", error);
      return [];
    }
  };

  const parseSubQuestions = (subQuestionsJson) => {
    if (!subQuestionsJson || subQuestionsJson === "[]") return [];
    try {
      const parsed =
        typeof subQuestionsJson === "string"
          ? JSON.parse(subQuestionsJson)
          : subQuestionsJson;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((sub) => ({
        id: sub.id,
        questionText: sub.questionText,
        questionTypeId: sub.questionTypeId,
        isRequired:
          sub.isRequired === 1 ||
          sub.isRequired === "1" ||
          sub.isRequired === true ||
          sub.isRequired === "true",
        ratingScale: sub.ratingScale || 5,
        subQuestionOrder: sub.subQuestionOrder,
        showCondition: sub.showCondition || "always",
        dependsOnQuestionId: sub.dependsOnQuestionId ?? null,
        showWhenOption: sub.showWhenOption || "",
        maxSelections:
          sub.maxSelections != null ? Number(sub.maxSelections) : 0,
        maxDigits: sub.maxDigits != null ? Number(sub.maxDigits) : 0,
        options:
          sub.options && sub.options.length > 0
            ? sub.options.map((opt) => ({
                id: opt.id,
                text: opt.optionText || opt,
              }))
            : [],
      }));
    } catch (error) {
      console.error("Error parsing sub-questions:", error);
      return [];
    }
  };

  /* ---------------- Survey transform ---------------- */
  const transformToSurveyFormat = (
    applicationData,
    parentTypeName,
    subTypeName,
  ) => {
    if (!applicationData || applicationData.length === 0) return null;

    const questions = applicationData.map((item) => {
      const questionTypeValue = getQuestionTypeValue(item.question_type_id);
      const options = parseOptions(item.question_options);
      const subQuestions = parseSubQuestions(item.sub_questions);

      return {
        id: item.id,
        questionText: item.question_text,
        questionType: questionTypeValue,
        required:
          item.is_required === "1" ||
          item.is_required === 1 ||
          item.is_required === true,
        ratingScale: item.rating_scale ? parseInt(item.rating_scale) : 5,
        showCondition: item.show_condition || "always",
        dependsOnQuestionId: item.depends_on_question_id ?? null,
        showWhenOption: item.show_when_option || "",
        maxSelections:
          item.max_selections != null ? Number(item.max_selections) : 0,
        maxDigits: item.max_digits != null ? Number(item.max_digits) : 0,
        options,
        multipleTextFields: options.map((o) => o.text ?? o),
        subQuestions,
      };
    });

    return {
      id: applicationData[0]?.id,
      applicationNo: applicationData[0]?.application_no,
      parentTracerTypeName: parentTypeName,
      subTracerTypeName: subTypeName,
      tracerCreatedAt: applicationData[0]?.created_at?.split(" ")[0],
      status: "Pending",
      questions,
    };
  };

  /* ---------------- Preview visibility ---------------- */
  const previewVisibility = useMemo(() => {
    if (!selectedSurvey?.questions) return {};
    return computeVisibility(selectedSurvey.questions, formResponses);
  }, [selectedSurvey, formResponses]);

  /* ---------------- Table filters ---------------- */
  const filteredTracerDetails = (tracerDetails || []).filter((tracer) => {
    const matchesParent = selectedParentType
      ? String(tracer.parent_tracer_type_id) === String(selectedParentType)
      : true;
    const matchesSub = selectedSubType
      ? String(tracer.sub_tracer_type_id) === String(selectedSubType)
      : true;
    return matchesParent && matchesSub;
  });

  const filteredSurveys = (filteredTracerDetails || []).filter((survey) => {
    return search
      ? survey.application_no?.toLowerCase().includes(search.toLowerCase())
      : true;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedSurveys = (filteredSurveys || []).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  /* ---------------- Send validation ---------------- */
  const validateBeforeSend = async () => {
    setSendError("");
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({
        parentTracerTypeId: true,
        subTracerTypeId: true,
      });
      const errorMessages = [];
      if (errors.parentTracerTypeId)
        errorMessages.push(errors.parentTracerTypeId);
      if (errors.subTracerTypeId) errorMessages.push(errors.subTracerTypeId);
      setSendError(errorMessages.join(". "));
      return false;
    }
    return true;
  };

  /* ---------------- Send handlers ---------------- */
  const handleSend = async (survey) => {
    if (!selectedParentType) {
      toast.warning("Please select a parent tracer type first");
      return;
    }
    if (!selectedSubType) {
      toast.warning("Please select a sub tracer type");
      formik.setFieldTouched("subTracerTypeId", true);
      return;
    }
    const isValid = await validateBeforeSend();
    if (!isValid) return;

    const applicationDetails = {
      applicationNo: survey.application_no,
      applicationName: survey.application_name || survey.tracer_title || "N/A",
      mobileNo: survey.mobile_no || survey.contact_number || "",
      emailId: survey.email_id || survey.email || "",
      statusId: survey.status_id || survey.status || 1,
      parentTracerType: survey.parent_tracer_type,
      subTracerType: survey.sub_tracer_type,
      tracerTitle: survey.tracer_title,
      createdAt: survey.created_at,
      tracerApplicationId: survey.id,
      parentTracerTypeId: selectedParentType
        ? parseInt(selectedParentType)
        : null,
      subTracerTypeId: selectedSubType ? parseInt(selectedSubType) : null,
    };

    setSelectedSurvey(applicationDetails);
    setSelectedSurveyId(survey.application_no);
    setSendDialogOpen(true);
    setSendError("");
  };

  const handleSendTraineeTracer = async (selectedTrainees) => {
    const sendData = {
      applicationNo: selectedSurvey.applicationNo,
      parentTracerTypeId: selectedSurvey?.parentTracerTypeId,
      subTracerTypeId: selectedSurvey?.subTracerTypeId,
      selectedTrainees,
    };
    try {
      await GenerateTracerService.sendTraineeTracerSurvey(
        sendData,
        access_token,
      );
      toast.success(
        `Trainee Tracer survey sent to ${selectedTrainees.length} trainee(s) successfully!`,
      );
      handleCloseSendDialog();
      fetchTracerDetails();
    } catch (error) {
      console.error("Error sending trainee survey:", error);
      toast.error(
        error.response?.data?.message || "Error sending trainee survey",
      );
    }
  };

  const handleSendEmployerTracer = async (selectedEmployers) => {
    const sendData = {
      applicationNo: selectedSurvey.applicationNo,
      parentTracerTypeId: selectedSurvey?.parentTracerTypeId,
      subTracerTypeId: selectedSurvey?.subTracerTypeId,
      selectedEmployers,
    };
    try {
      await GenerateTracerService.sendEmployerTracerSurvey(
        sendData,
        access_token,
      );
      toast.success(
        `Employer Tracer survey sent to ${selectedEmployers.length} employer(s) successfully!`,
      );
      handleCloseSendDialog();
      fetchTracerDetails();
    } catch (error) {
      console.error("Error sending employer survey:", error);
      toast.error(
        error.response?.data?.message || "Error sending employer survey",
      );
    }
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
    setSelectedSurvey(null);
    setSelectedSurveyId(null);
    setSendError("");
  };

  /* ---------------- View / preview handlers ---------------- */
  const handleViewSurvey = async (survey) => {
    setViewLoading(true);
    try {
      const applicationDetails = await fetchTracerApplicationDetails(
        survey.application_no,
      );
      const transformedSurvey = transformToSurveyFormat(
        applicationDetails,
        survey.parent_tracer_type,
        survey.sub_tracer_type,
      );

      if (transformedSurvey) {
        setSelectedSurvey(transformedSurvey);

        const initialResponses = {};
        transformedSurvey.questions.forEach((question) => {
          if (
            question.questionType === "checkbox" ||
            question.questionType === "multiSelect"
          ) {
            initialResponses[`q_${question.id}`] = [];
          } else if (question.questionType === "multipleText") {
            const multiResponses = {};
            (question.multipleTextFields || []).forEach((_, idx) => {
              multiResponses[`field_${idx}`] = "";
            });
            initialResponses[`q_${question.id}`] = multiResponses;
          } else {
            initialResponses[`q_${question.id}`] = "";
          }

          (question.subQuestions || []).forEach((sub) => {
            const subType = getQuestionTypeForId(sub.questionTypeId);
            if (subType === "checkbox" || subType === "multiSelect") {
              initialResponses[`sub_${sub.id}`] = [];
            } else if (subType === "multipleText") {
              const multi = {};
              (sub.options || []).forEach((_, idx) => {
                multi[`field_${idx}`] = "";
              });
              initialResponses[`sub_${sub.id}`] = multi;
            } else {
              initialResponses[`sub_${sub.id}`] = "";
            }
          });
        });
        setFormResponses(initialResponses);
        setViewOpen(true);
      }
    } catch (error) {
      console.error("Error loading survey details:", error);
      toast.error("Failed to load survey details");
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedSurvey(null);
    setFormResponses({});
    setRatingValues({});
    setMultiSelectValues({});
    setTextInputValues({});
    setTextAreaValues({});
    setMultipleTextValues({});
    setDropdownValues({});
  };

  const handleResponseChange = (
    questionId,
    value,
    isSubQuestion = false,
    fieldName = null,
  ) => {
    const key = isSubQuestion ? `sub_${questionId}` : `q_${questionId}`;
    if (fieldName) {
      setFormResponses((prev) => ({
        ...prev,
        [key]: { ...(prev[key] || {}), [fieldName]: value },
      }));
    } else {
      setFormResponses((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleCheckboxChange = (
    questionId,
    option,
    checked,
    isSubQuestion = false,
  ) => {
    const key = isSubQuestion ? `sub_${questionId}` : `q_${questionId}`;
    setFormResponses((prev) => {
      const current = prev[key] || [];
      return checked
        ? { ...prev, [key]: [...current, option] }
        : { ...prev, [key]: current.filter((v) => v !== option) };
    });
  };

  /* ---------------- Field renderers ---------------- */
  const renderRatingStars = (scale, value, onChange, disabled = false) => (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
    >
      <Rating
        value={value || 0}
        precision={1}
        max={scale}
        onChange={(_, v) => onChange?.(v)}
        icon={<StarIcon fontSize="inherit" />}
        emptyIcon={<StarIcon fontSize="inherit" />}
        disabled={disabled}
        sx={{
          "& .MuiRating-iconFilled": { color: "#1976d2" },
          "& .MuiRating-iconHover": { color: "#1976d2" },
        }}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        {[...Array(scale)].map((_, i) => (
          <Button
            key={i}
            variant={value === i + 1 ? "contained" : "outlined"}
            size="small"
            onClick={() => onChange?.(i + 1)}
            disabled={disabled}
            sx={{
              minWidth: 32,
              height: 32,
              p: 0,
              backgroundColor: value === i + 1 ? "#1976d2" : "transparent",
              borderColor: "#1976d2",
              color: value === i + 1 ? "white" : "#1976d2",
            }}
          >
            {i + 1}
          </Button>
        ))}
      </Box>
    </Box>
  );

  const renderUnderlinedDropdown = (options, questionId, disabled = false) => {
    const value = dropdownValues[questionId] || "";
    return (
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel>Select an option</InputLabel>
        <Select
          value={value}
          onChange={(e) =>
            setDropdownValues((prev) => ({
              ...prev,
              [questionId]: e.target.value,
            }))
          }
          label="Select an option"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {(options || [])
            .filter((opt) => {
              const text = typeof opt === "string" ? opt : opt.text;
              return text && text.trim() !== "";
            })
            .map((opt, idx) => {
              const text = typeof opt === "string" ? opt : opt.text;
              return (
                <MenuItem key={idx} value={text}>
                  {text}
                </MenuItem>
              );
            })}
        </Select>
      </FormControl>
    );
  };

  const renderOriginalMultiSelect = (
    options,
    questionId,
    disabled = false,
    maxSelections = 0,
  ) => {
    const selectedValues = multiSelectValues[questionId] || [];
    const limitReached =
      maxSelections > 0 && selectedValues.length >= maxSelections;

    return (
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>Select Options</InputLabel>
        <Select
          multiple
          value={selectedValues}
          onChange={(e) => {
            let v = e.target.value;
            v = typeof v === "string" ? v.split(",") : v;
            if (maxSelections > 0 && v.length > maxSelections) {
              v = v.slice(0, maxSelections);
            }
            setMultiSelectValues((prev) => ({ ...prev, [questionId]: v }));
          }}
          input={<OutlinedInput label="Select Options" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {(selected || []).map((v) => (
                <Chip key={v} label={v} size="small" />
              ))}
            </Box>
          )}
        >
          {(options || [])
            .filter((opt) => {
              const text = typeof opt === "string" ? opt : opt.text;
              return text && text.trim() !== "";
            })
            .map((opt, idx) => {
              const text = typeof opt === "string" ? opt : opt.text;
              const isSelected = selectedValues.indexOf(text) > -1;
              const optionDisabled = limitReached && !isSelected;
              return (
                <MenuItem key={idx} value={text} disabled={optionDisabled}>
                  <Checkbox checked={isSelected} />
                  <ListItemText primary={text} />
                </MenuItem>
              );
            })}
        </Select>
        {maxSelections > 0 && (
          <Typography
            variant="caption"
            color={limitReached ? "warning" : "text.secondary"}
            sx={{ mt: 0.5, display: "block" }}
          >
            {selectedValues.length}/{maxSelections} selected
            {limitReached ? " — limit reached" : ""}
          </Typography>
        )}
      </FormControl>
    );
  };

  const renderUnderlinedTextInput = (
    questionId,
    disabled = false,
    isTextArea = false,
    fieldLabel = null,
    maxDigits = 0,
  ) => {
    const isLimited = !isTextArea && maxDigits > 0;
    const value = isTextArea
      ? textAreaValues[questionId] || ""
      : textInputValues[questionId] || "";

    const handleChange = (e) => {
      let raw = e.target.value;
      if (isLimited) {
        raw = raw.replace(/\D/g, "").slice(0, maxDigits);
      }
      const setter = isTextArea ? setTextAreaValues : setTextInputValues;
      setter((prev) => ({ ...prev, [questionId]: raw }));
    };

    if (isTextArea) {
      return (
        <TextField
          fullWidth
          variant="standard"
          placeholder={fieldLabel || "Type your answer here..."}
          value={value}
          onChange={handleChange}
          multiline
          rows={3}
          disabled={disabled}
        />
      );
    }

    const atLimit = isLimited && value.length >= maxDigits;

    return (
      <Box>
        <Input
          fullWidth
          placeholder={
            isLimited
              ? `Enter up to ${maxDigits} digits`
              : fieldLabel || "Type your answer here..."
          }
          value={value}
          onChange={handleChange}
          disabled={disabled}
          disableUnderline={false}
          inputProps={
            isLimited
              ? { inputMode: "numeric", maxLength: maxDigits }
              : undefined
          }
        />
        {isLimited && (
          <Typography
            variant="caption"
            color={atLimit ? "warning" : "text.secondary"}
            sx={{ mt: 0.5, display: "block" }}
          >
            {value.length}/{maxDigits} digits
            {atLimit ? " — limit reached" : ""}
          </Typography>
        )}
      </Box>
    );
  };

  const renderMultipleTextInputs = (fields, questionId, disabled = false) => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {(fields || [])
          .filter((field) => {
            const text = typeof field === "string" ? field : field.text;
            return text && text.trim() !== "";
          })
          .map((field, idx) => {
            const text = typeof field === "string" ? field : field.text;
            return (
              <Box key={idx}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  {text}
                </Typography>
                <Input
                  fullWidth
                  placeholder={`Enter ${text.toLowerCase()}`}
                  value={multipleTextValues[questionId]?.[idx] || ""}
                  onChange={(e) =>
                    setMultipleTextValues((prev) => ({
                      ...prev,
                      [questionId]: {
                        ...(prev[questionId] || {}),
                        [idx]: e.target.value,
                      },
                    }))
                  }
                  disabled={disabled}
                  disableUnderline={false}
                />
              </Box>
            );
          })}
      </Box>
    );
  };

  const renderPreviewOptions = (question, isSubQuestion = false) => {
    let questionType = question.questionType;
    if (!questionType && question.questionTypeId) {
      questionType = getQuestionTypeForId(question.questionTypeId);
    }
    if (!questionType) return null;

    const questionId = question.id;
    const responseKey = isSubQuestion ? `sub_${questionId}` : `q_${questionId}`;
    const responseValue =
      formResponses[responseKey] ||
      (questionType === "checkbox" || questionType === "multiSelect" ? [] : "");

    let options = [];
    if (question.options && question.options.length > 0) {
      options = question.options.map((opt) =>
        typeof opt === "string" ? opt : (opt.text ?? opt),
      );
    }

    const maxDigits = question.maxDigits || 0;
    const maxSelections = question.maxSelections || 0;

    switch (questionType) {
      case "radio":
        return (
          <RadioGroup
            value={responseValue}
            onChange={(e) =>
              handleResponseChange(questionId, e.target.value, isSubQuestion)
            }
          >
            {(options || []).map((opt, idx) => (
              <FormControlLabel
                key={idx}
                value={opt}
                control={<Radio size="small" />}
                label={opt}
              />
            ))}
          </RadioGroup>
        );

      case "checkbox": {
        const selectedArr = Array.isArray(responseValue) ? responseValue : [];
        const limitReached =
          maxSelections > 0 && selectedArr.length >= maxSelections;

        return (
          <FormControl component="fieldset" fullWidth>
            <FormGroup>
              {(options || []).map((opt, idx) => {
                const checked = selectedArr.includes(opt);
                const optionDisabled = limitReached && !checked;
                return (
                  <FormControlLabel
                    key={idx}
                    disabled={optionDisabled}
                    control={
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (
                              maxSelections > 0 &&
                              selectedArr.length >= maxSelections
                            ) {
                              return;
                            }
                            handleCheckboxChange(
                              questionId,
                              opt,
                              true,
                              isSubQuestion,
                            );
                          } else {
                            handleCheckboxChange(
                              questionId,
                              opt,
                              false,
                              isSubQuestion,
                            );
                          }
                        }}
                      />
                    }
                    label={opt}
                  />
                );
              })}
            </FormGroup>
            {maxSelections > 0 && (
              <Typography
                variant="caption"
                color={limitReached ? "warning" : "text.secondary"}
                sx={{ mt: 0.5, display: "block" }}
              >
                {selectedArr.length}/{maxSelections} selected
                {limitReached ? " — limit reached" : ""}
              </Typography>
            )}
          </FormControl>
        );
      }

      case "dropdown":
        return renderUnderlinedDropdown(options, questionId);

      case "multiSelect":
        return renderOriginalMultiSelect(
          options,
          questionId,
          false,
          maxSelections,
        );

      case "multipleText":
        return renderMultipleTextInputs(
          question.multipleTextFields || question.options || [],
          questionId,
        );

      case "rating":
        return renderRatingStars(
          question.ratingScale || 5,
          ratingValues[questionId] || 0,
          (value) =>
            setRatingValues((prev) => ({ ...prev, [questionId]: value })),
        );

      case "text":
        return renderUnderlinedTextInput(
          questionId,
          false,
          false,
          null,
          maxDigits,
        );

      case "textarea":
        return renderUnderlinedTextInput(questionId, false, true);

      case "date":
        return (
          <TextField
            type="date"
            variant="standard"
            InputLabelProps={{ shrink: true }}
            sx={{ width: "100%" }}
          />
        );

      default:
        return null;
    }
  };

  /* ---------------- Render ---------------- */
  return (
    <Paper sx={{ p: 3, mt: 1 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Send Tracer Surveys
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <FormControl
            fullWidth
            size="small"
            error={
              formik.touched.parentTracerTypeId &&
              Boolean(formik.errors.parentTracerTypeId)
            }
          >
            <InputLabel>Parent Tracer Type *</InputLabel>
            <Select
              value={selectedParentType}
              label="Parent Tracer Type *"
              onChange={async (e) =>
                await handleParentTracerTypeChange(e.target.value)
              }
              onBlur={formik.handleBlur}
            >
              <MenuItem value="">
                <em>-- Select Parent Tracer Type --</em>
              </MenuItem>
              {(parentTracerTypes || []).map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.dropdown_name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.parentTracerTypeId &&
              formik.errors.parentTracerTypeId && (
                <FormHelperText>
                  {formik.errors.parentTracerTypeId}
                </FormHelperText>
              )}
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <FormControl
            fullWidth
            size="small"
            error={
              formik.touched.subTracerTypeId &&
              Boolean(formik.errors.subTracerTypeId)
            }
            disabled={!selectedParentType || isLoadingSubTypes}
          >
            <InputLabel>Sub Tracer Type *</InputLabel>
            <Select
              value={selectedSubType}
              label="Sub Tracer Type *"
              onChange={(e) => handleSubTracerTypeChange(e.target.value)}
              onBlur={formik.handleBlur}
            >
              <MenuItem value="">
                <em>-- Select Sub Tracer Type --</em>
              </MenuItem>
              {(subTracerTypes || []).length > 0 ? (
                (subTracerTypes || []).map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name || type.dropdown_name || `Sub Tracer ${type.id}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <em>No sub-tracer types available</em>
                </MenuItem>
              )}
            </Select>
            {isLoadingSubTypes && (
              <CircularProgress
                size={20}
                sx={{ position: "absolute", right: 30, top: "50%" }}
              />
            )}
            {formik.touched.subTracerTypeId &&
              formik.errors.subTracerTypeId && (
                <FormHelperText>{formik.errors.subTracerTypeId}</FormHelperText>
              )}
          </FormControl>
        </Grid>
      </Grid>

      {selectedParentType && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Search by Application Number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by application number..."
            />
          </Grid>
        </Grid>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && selectedParentType && filteredSurveys.length === 0 && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="textSecondary">
            No tracer surveys found for the selected criteria
          </Typography>
        </Box>
      )}

      {selectedParentType && filteredSurveys.length > 0 && (
        <>
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
                  <TableCell align="center" width={40}>
                    #
                  </TableCell>
                  <TableCell>Application Number</TableCell>
                  <TableCell>Tracer Title</TableCell>
                  <TableCell>Parent Tracer Type</TableCell>
                  <TableCell>Sub Tracer Type</TableCell>
                  <TableCell>Tracer Created At</TableCell>
                  <TableCell align="center" width={100}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(paginatedSurveys || []).map((survey, index) => (
                  <TableRow
                    key={survey.application_no}
                    sx={{ "&:hover": { bgcolor: "#fafafa" } }}
                  >
                    <TableCell align="center">
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {survey.application_no}
                      </Typography>
                    </TableCell>
                    <TableCell>{survey.tracer_title || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={survey.parent_tracer_type}
                        size="small"
                        color={
                          survey.parent_tracer_type === "Employer Tracer"
                            ? "primary"
                            : "secondary"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          survey.sub_tracer_type ||
                          (subTracerTypes || []).find(
                            (st) =>
                              String(st.id) ===
                              String(survey.sub_tracer_type_id),
                          )?.name ||
                          survey.sub_tracer_type_id ||
                          "No Sub Type"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{survey.created_at?.split(" ")[0]}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="center"
                      >
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                            "&:hover": { bgcolor: "#bbdefb" },
                            width: 32,
                            height: 32,
                          }}
                          onClick={() => handleViewSurvey(survey)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: "#e8f5e8",
                            color: "#2e7d32",
                            "&:hover": { bgcolor: "#c8e6c9" },
                            width: 32,
                            height: 32,
                          }}
                          onClick={() => handleSend(survey)}
                          title="Send Survey"
                        >
                          <IosShareIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSurveys.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Send Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={handleCloseSendDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "#f5f5f5",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            {selectedSurvey?.parentTracerType === "Trainee Tracer"
              ? "Send Trainee Tracer Survey"
              : "Send Employer Tracer Survey"}
          </Box>
          <IconButton onClick={handleCloseSendDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSurvey?.parentTracerType === "Trainee Tracer" ? (
            <TraineeTracerSurvey
              open={sendDialogOpen}
              onClose={handleCloseSendDialog}
              survey={selectedSurvey}
              onSend={handleSendTraineeTracer}
            />
          ) : (
            <EmployerTracerSurvey
              open={sendDialogOpen}
              onClose={handleCloseSendDialog}
              survey={selectedSurvey}
              onSend={handleSendEmployerTracer}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog — respects show/hide + max limits */}
      <Dialog
        open={viewOpen}
        onClose={handleCloseView}
        maxWidth="xl"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            bgcolor: "#f5f5f5",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            Survey Questions - Interactive Preview
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              {selectedSurvey?.parentTracerTypeName} -{" "}
              {selectedSurvey?.subTracerTypeName} •{" "}
              {selectedSurvey?.applicationNo}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseView} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            selectedSurvey && (
              <Box>
                {(selectedSurvey.questions || []).length > 0 ? (
                  (selectedSurvey.questions || []).map((question, index) => {
                    const parentVisible =
                      previewVisibility[question.id] ?? true;
                    if (!parentVisible) return null;

                    return (
                      <Box key={question.id} sx={{ mb: 3 }}>
                        <Typography
                          variant="body1"
                          gutterBottom
                          fontWeight={500}
                        >
                          {index + 1}.{" "}
                          {question.questionText || "Untitled Question"}
                          {question.required && (
                            <span style={{ color: "red", marginLeft: "4px" }}>
                              *
                            </span>
                          )}
                        </Typography>

                        {question.questionType && (
                          <Box sx={{ ml: 2, mt: 1, mb: 2 }}>
                            {renderPreviewOptions(question)}
                          </Box>
                        )}

                        {(question.subQuestions || []).length > 0 && (
                          <Box sx={{ ml: 2, borderRadius: 1 }}>
                            {question.subQuestions.map((sub, subIndex) => {
                              const key = `sub_${sub.id}`;
                              const isVisible = previewVisibility[key] ?? true;
                              if (!isVisible) return null;

                              const subQuestionType =
                                sub.questionType ||
                                getQuestionTypeForId(sub.questionTypeId);
                              const subWithType = {
                                ...sub,
                                questionType: subQuestionType,
                              };

                              return (
                                <Box key={sub.id} sx={{ mb: 2 }}>
                                  <Typography variant="body2" gutterBottom>
                                    {index + 1}.{subIndex + 1}{" "}
                                    {sub.questionText ||
                                      "Untitled Sub-question"}
                                    {(sub.isRequired === 1 ||
                                      sub.isRequired === true) && (
                                      <span
                                        style={{
                                          color: "red",
                                          marginLeft: "4px",
                                        }}
                                      >
                                        *
                                      </span>
                                    )}
                                  </Typography>
                                  <Box sx={{ ml: 2, mt: 1 }}>
                                    {renderPreviewOptions(subWithType, true)}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        )}

                        {index <
                          (selectedSurvey.questions || []).length - 1 && (
                          <Divider sx={{ my: 2 }} />
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <Typography
                    color="textSecondary"
                    align="center"
                    sx={{ py: 3 }}
                  >
                    No questions have been added to this survey yet.
                  </Typography>
                )}
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 2, bgcolor: "#f5f5f5", justifyContent: "space-between" }}
        >
          <Typography variant="caption" color="textSecondary">
            This is an interactive preview - you can test the form by filling in
            responses
          </Typography>
          <Button onClick={handleCloseView} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SendTracerIndex;
