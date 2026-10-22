import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  FormGroup,
  TextField,
  Button,
  Rating,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  OutlinedInput,
  ListItemText,
  Grid,
  Stack,
  Input,
  FormHelperText,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import DescriptionIcon from "@mui/icons-material/Description";
import PublicTracerService from "../../../api/services/internal/tracer/PublicTracerService";

/* ================= PropTypes ================= */
const optionShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  text: PropTypes.string,
});
const fieldKeyType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);
const fieldValueType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.array,
  PropTypes.object,
]);

/* ================= Helpers ================= */
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
      maxSelections: sub.maxSelections != null ? Number(sub.maxSelections) : 0,
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

const extractArrayFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.questions)) return response.data.questions;
  if (Array.isArray(response?.questions)) return response.questions;
  return [];
};

const isRequiredValue = (value) =>
  value === "1" || value === 1 || value === true || value === "true";

/* ================= Validation ================= */
const validateRequiredField = (questionType, value) => {
  switch (questionType) {
    case "radio":
      return !value || value === "" ? "Please select an option" : null;
    case "checkbox":
    case "multiSelect":
      return !value || (Array.isArray(value) && value.length === 0)
        ? "Please select at least one option"
        : null;
    case "rating":
      return !value || value === 0 ? "Please provide a rating" : null;
    case "text":
    case "textarea":
    case "date":
    case "dropdown":
      return !value || value.toString().trim() === ""
        ? "This field is required"
        : null;
    default:
      return null;
  }
};

const validateMultipleTextFields = (options, value) => {
  if (!options || options.length === 0) return null;
  for (const opt of options) {
    const fieldName = `field_${opt.id}`;
    if (!value?.[fieldName] || value[fieldName].trim() === "") {
      return `${opt.text || "This field"} is required`;
    }
  }
  return null;
};

const validateSubQuestion = (sub, values, getQuestionTypeValue) => {
  if (!sub.isRequired) return null;
  const questionType = getQuestionTypeValue(sub.questionTypeId);
  const fieldKey = `sub_${sub.id}`;
  const value = values[fieldKey];
  if (questionType === "multipleText") {
    const err = validateMultipleTextFields(sub.options, value);
    return err ? { [fieldKey]: err } : null;
  }
  const error = validateRequiredField(questionType, value);
  return error ? { [fieldKey]: error } : null;
};

const validateMainQuestion = (question, values, getQuestionTypeValue) => {
  if (!isRequiredValue(question.is_required)) return null;
  const questionType = getQuestionTypeValue(question.question_type_id);
  const fieldKey = question.id;
  const value = values[fieldKey];
  if (questionType === "multipleText") {
    const options = parseOptions(question.question_options);
    const error = validateMultipleTextFields(options, value);
    return error ? { [fieldKey]: error } : null;
  }
  const error = validateRequiredField(questionType, value);
  return error ? { [fieldKey]: error } : null;
};

/* ================= Init values ================= */
const getInitialValueForType = (questionType, options) => {
  if (questionType === "checkbox" || questionType === "multiSelect") return [];
  if (questionType === "multipleText") {
    const multiResponses = {};
    (options || []).forEach((opt, idx) => {
      multiResponses[`field_${opt.id || idx}`] = "";
    });
    return multiResponses;
  }
  return "";
};

const initializeFormValues = (questions, getQuestionTypeValue) => {
  const initialValues = {};
  if (!Array.isArray(questions)) return initialValues;
  questions.forEach((question) => {
    const subQuestions = parseSubQuestions(question.sub_questions);
    if (subQuestions.length > 0) {
      subQuestions.forEach((sub) => {
        const questionType = getQuestionTypeValue(sub.questionTypeId);
        initialValues[`sub_${sub.id}`] = getInitialValueForType(
          questionType,
          sub.options,
        );
      });
    } else {
      const questionType = getQuestionTypeValue(question.question_type_id);
      const options = parseOptions(question.question_options);
      initialValues[question.id] = getInitialValueForType(
        questionType,
        options,
      );
    }
  });
  return initialValues;
};

/* ================= Survey transform ================= */
const buildTransformedSurvey = (
  surveyData,
  tracerDetails,
  getQuestionTypeValue,
) => {
  const safeTracerDetails = Array.isArray(tracerDetails) ? tracerDetails : [];
  return {
    applicationNo: surveyData?.data?.applicationNo,
    parentTracerTypeName: surveyData?.data?.applicationName,
    subTracerTypeName: "",
    questions: safeTracerDetails.map((item) => {
      const subQuestions = parseSubQuestions(item.sub_questions);
      return {
        id: item.id,
        questionText: item.question_text,
        questionType: getQuestionTypeValue(item.question_type_id),
        required: isRequiredValue(item.is_required),
        ratingScale: item.rating_scale ? parseInt(item.rating_scale) : 5,
        showCondition: item.show_condition || "always",
        dependsOnQuestionId: item.depends_on_question_id ?? null,
        showWhenOption: item.show_when_option || "",
        maxSelections:
          item.max_selections != null ? Number(item.max_selections) : 0,
        maxDigits: item.max_digits != null ? Number(item.max_digits) : 0,
        options: parseOptions(item.question_options),
        multipleTextFields: parseOptions(item.question_options),
        subQuestions: subQuestions.map((sub) => ({
          id: sub.id,
          questionText: sub.questionText,
          questionTypeId: sub.questionTypeId,
          questionType: getQuestionTypeValue(sub.questionTypeId),
          isRequired: sub.isRequired,
          ratingScale: sub.ratingScale,
          showCondition: sub.showCondition,
          dependsOnQuestionId: sub.dependsOnQuestionId,
          showWhenOption: sub.showWhenOption,
          maxSelections: sub.maxSelections,
          maxDigits: sub.maxDigits,
          options: sub.options,
          multipleTextFields: sub.options,
        })),
      };
    }),
  };
};

/* ================= Visibility helpers ================= */
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
      if (opt?.id != null && opt?.text != null) {
        lookup[q.id][String(opt.id)] = opt.text;
      }
    });
    (q.subQuestions || []).forEach((sub) => {
      lookup[`sub_${sub.id}`] = {};
      (sub.options || []).forEach((opt) => {
        if (opt?.id != null && opt?.text != null) {
          lookup[`sub_${sub.id}`][String(opt.id)] = opt.text;
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
      if (!depFlat) result = true;
      else if (!compute(depFlat)) result = false;
      else
        result = evaluateOwnCondition(
          q,
          byId,
          selectedValues,
          optionTextLookup,
        );
    }
    computing.delete(q.__key);
    visibility[q.__key] = result;
    return result;
  };
  flat.forEach((q) => compute(q));
  return visibility;
};

/* ================= Field components ================= */
const RadioField = ({ fieldValue, fieldError, options, onChange }) => (
  <FormControl error={!!fieldError} component="fieldset" fullWidth>
    <RadioGroup value={fieldValue || ""} onChange={onChange}>
      {options.map((opt) => (
        <FormControlLabel
          key={opt.id}
          value={String(opt.id)}
          control={<Radio size="small" />}
          label={opt.text}
        />
      ))}
    </RadioGroup>
    {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
  </FormControl>
);
RadioField.propTypes = {
  fieldValue: fieldValueType,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
  onChange: PropTypes.func.isRequired,
};

const CheckboxField = ({
  fieldValue,
  fieldError,
  options,
  maxSelections,
  onChange,
}) => {
  const selected = fieldValue || [];
  const limitReached = maxSelections > 0 && selected.length >= maxSelections;
  return (
    <FormControl error={!!fieldError} component="fieldset" fullWidth>
      <FormGroup>
        {options.map((opt) => {
          const isChecked = selected.includes(opt.id);
          const isDisabled = limitReached && !isChecked;
          return (
            <FormControlLabel
              key={opt.id}
              disabled={isDisabled}
              control={
                <Checkbox
                  size="small"
                  checked={isChecked}
                  onChange={(e) => onChange(opt.id, e.target.checked)}
                />
              }
              label={opt.text}
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
          {selected.length}/{maxSelections} selected
          {limitReached ? " — limit reached" : ""}
        </Typography>
      )}
      {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
    </FormControl>
  );
};
CheckboxField.propTypes = {
  fieldValue: PropTypes.array,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
  maxSelections: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

const DropdownField = ({ fieldValue, fieldError, options, onChange }) => (
  <FormControl fullWidth variant="standard" error={!!fieldError}>
    <InputLabel>Select an option</InputLabel>
    <Select
      value={fieldValue || ""}
      onChange={onChange}
      label="Select an option"
    >
      <MenuItem value="">
        <em>None</em>
      </MenuItem>
      {options
        .filter((opt) => opt?.text?.trim())
        .map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.text}
          </MenuItem>
        ))}
    </Select>
    {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
  </FormControl>
);
DropdownField.propTypes = {
  fieldValue: fieldValueType,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
  onChange: PropTypes.func.isRequired,
};

const MultiSelectField = ({
  fieldValue,
  fieldError,
  options,
  maxSelections,
  onChange,
}) => {
  const selectedValues = fieldValue || [];
  const limitReached =
    maxSelections > 0 && selectedValues.length >= maxSelections;
  return (
    <FormControl fullWidth size="small" error={!!fieldError}>
      <InputLabel>Select Options</InputLabel>
      <Select
        multiple
        value={selectedValues}
        onChange={(e) => {
          let value = e.target.value;
          value = typeof value === "string" ? value.split(",") : value;
          if (maxSelections > 0 && value.length > maxSelections) {
            value = value.slice(0, maxSelections);
          }
          onChange(value);
        }}
        input={<OutlinedInput label="Select Options" />}
        renderValue={(selectedIds) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selectedIds.map((id) => {
              const option = options.find((opt) => opt.id === id);
              return <Chip key={id} label={option?.text || id} size="small" />;
            })}
          </Box>
        )}
      >
        {options
          .filter((opt) => opt?.text?.trim())
          .map((option) => {
            const isSelected = selectedValues.indexOf(option.id) > -1;
            const optionDisabled = limitReached && !isSelected;
            return (
              <MenuItem
                key={option.id}
                value={option.id}
                disabled={optionDisabled}
              >
                <Checkbox checked={isSelected} />
                <ListItemText primary={option.text} />
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
      {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
    </FormControl>
  );
};
MultiSelectField.propTypes = {
  fieldValue: PropTypes.array,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
  maxSelections: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

const MultipleTextField = ({
  textFields,
  multiValues,
  isRequired,
  fieldError,
  onChange,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    {textFields
      .filter((field) => field?.text?.trim())
      .map((field) => (
        <Box key={field.id}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {field.text} {isRequired && <span style={{ color: "red" }}>*</span>}
          </Typography>
          <Input
            fullWidth
            placeholder={`Enter ${field.text.toLowerCase()}`}
            value={multiValues[`field_${field.id}`] || ""}
            onChange={(e) => onChange(`field_${field.id}`, e.target.value)}
            disableUnderline={false}
          />
        </Box>
      ))}
    {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
  </Box>
);
MultipleTextField.propTypes = {
  textFields: PropTypes.arrayOf(optionShape).isRequired,
  multiValues: PropTypes.object,
  isRequired: PropTypes.bool,
  fieldError: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

const RatingField = ({ fieldValue, fieldError, ratingScale, onChange }) => (
  <Box>
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
    >
      <Rating
        name="rating"
        value={fieldValue || 0}
        precision={1}
        max={ratingScale}
        onChange={(event, newValue) => onChange(newValue)}
        icon={<StarIcon fontSize="inherit" />}
        emptyIcon={<StarIcon fontSize="inherit" />}
        sx={{
          "& .MuiRating-iconFilled": { color: "#1976d2" },
          "& .MuiRating-iconHover": { color: "#1976d2" },
        }}
      />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {[...Array(ratingScale)].map((_, i) => (
          <Button
            key={i}
            variant={fieldValue === i + 1 ? "contained" : "outlined"}
            size="small"
            onClick={() => onChange(i + 1)}
            sx={{
              minWidth: 32,
              height: 32,
              p: 0,
              backgroundColor: fieldValue === i + 1 ? "#1976d2" : "transparent",
              borderColor: "#1976d2",
              color: fieldValue === i + 1 ? "white" : "#1976d2",
            }}
          >
            {i + 1}
          </Button>
        ))}
      </Box>
    </Box>
    {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
  </Box>
);
RatingField.propTypes = {
  fieldValue: fieldValueType,
  fieldError: PropTypes.string,
  ratingScale: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

const TextFieldInput = ({
  fieldKey,
  fieldValue,
  fieldError,
  isTextarea,
  maxDigits,
  onChange,
}) => {
  const isLimited = !isTextarea && maxDigits > 0;
  const handleChange = (e) => {
    let raw = e.target.value;
    if (isLimited) raw = raw.replace(/\D/g, "").slice(0, maxDigits);
    onChange(raw);
  };
  const value = fieldValue || "";
  const atLimit = isLimited && value.length >= maxDigits;
  return (
    <Box>
      <TextField
        fullWidth
        variant="standard"
        placeholder={
          isLimited
            ? `Enter up to ${maxDigits} digits`
            : "Type your answer here..."
        }
        name={fieldKey}
        value={value}
        onChange={handleChange}
        error={!!fieldError}
        helperText={fieldError}
        multiline={isTextarea}
        rows={isTextarea ? 3 : undefined}
        inputProps={
          isLimited ? { inputMode: "numeric", maxLength: maxDigits } : undefined
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
TextFieldInput.propTypes = {
  fieldKey: fieldKeyType.isRequired,
  fieldValue: fieldValueType,
  fieldError: PropTypes.string,
  isTextarea: PropTypes.bool,
  maxDigits: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

const DateField = ({ fieldKey, fieldValue, fieldError, onChange }) => (
  <TextField
    type="date"
    variant="standard"
    name={fieldKey}
    value={fieldValue || ""}
    onChange={onChange}
    error={!!fieldError}
    helperText={fieldError}
    InputLabelProps={{ shrink: true }}
    sx={{ width: "100%" }}
  />
);
DateField.propTypes = {
  fieldKey: fieldKeyType.isRequired,
  fieldValue: PropTypes.string,
  fieldError: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

/* ================= Main ================= */
const ViewTracerSend = () => {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState(null);
  const [tracerDetails, setTracerDetails] = useState([]);
  const [error, setError] = useState(null);
  const [tracerQuestionDropdownType, setTracerQuestionDropdownType] = useState(
    [],
  );
  const [validationErrors, setValidationErrors] = useState({});
  const [multiSelectValues, setMultiSelectValues] = useState({});
  const [multipleTextValues, setMultipleTextValues] = useState({});

  /* ---------- Fetching ---------- */
  const fetchTracerQuestionDropdownType = useCallback(async () => {
    try {
      const response =
        await PublicTracerService.getTracerQuestionDropdownType();
      const types = extractArrayFromResponse(response);
      setTracerQuestionDropdownType(types);
    } catch (err) {
      console.error("Error fetching tracer question dropdown types:", err);
      setTracerQuestionDropdownType([]);
    }
  }, []);

  const fetchTracerDetails = useCallback(async (applicationNo) => {
    try {
      const response =
        await PublicTracerService.getTracerDetailsByApplicationNo(
          applicationNo,
        );
      const questions = extractArrayFromResponse(response);
      setTracerDetails(questions);
      setError(null);
    } catch (err) {
      console.error("Error fetching tracer details:", err);
      setError("Failed to load tracer details. Please try again.");
      setTracerDetails([]);
    }
  }, []);

  const fetchSurveyData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await PublicTracerService.getSurveyByUniqueId(uniqueId);
      setSurveyData(response.data);

      if (response.data.data?.questionApplicationNo) {
        await fetchTracerDetails(response.data.data.questionApplicationNo);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching survey:", err);
      setError("Failed to load survey. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [uniqueId, fetchTracerDetails]);

  useEffect(() => {
    if (uniqueId) {
      fetchSurveyData();
      fetchTracerQuestionDropdownType();
    }
  }, [uniqueId, fetchSurveyData, fetchTracerQuestionDropdownType]);

  /* ---------- Question type ---------- */
  const getQuestionTypeValue = useCallback(
    (typeId) => {
      if (!typeId) return null;
      const types = Array.isArray(tracerQuestionDropdownType)
        ? tracerQuestionDropdownType
        : [];
      const questionType = types.find((t) => t.id === typeId.toString());
      return questionType ? questionType.value : null;
    },
    [tracerQuestionDropdownType],
  );

  /* ---------- Survey ---------- */
  const transformedSurvey = useMemo(
    () =>
      buildTransformedSurvey(surveyData, tracerDetails, getQuestionTypeValue),
    [surveyData, tracerDetails, getQuestionTypeValue],
  );

  const initialValues = useMemo(
    () => initializeFormValues(tracerDetails, getQuestionTypeValue),
    [tracerDetails, getQuestionTypeValue],
  );

  /* ---------- Formik + visibility ---------- */
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: () => {},
  });

  const visibleMap = useMemo(() => {
    if (!transformedSurvey?.questions) return {};
    return computeVisibility(transformedSurvey.questions, formik.values);
  }, [transformedSurvey, formik.values]);

  useEffect(() => {
    if (!transformedSurvey?.questions) return;
    let changed = false;
    const nextValues = { ...formik.values };
    const resetField = (key) => {
      const currentValue = nextValues[key];
      let emptyValue = "";
      if (Array.isArray(currentValue)) emptyValue = [];
      else if (typeof currentValue === "object" && currentValue !== null) {
        emptyValue = Object.keys(currentValue).reduce((acc, k) => {
          acc[k] = "";
          return acc;
        }, {});
      }
      const hasValue = Array.isArray(currentValue)
        ? currentValue.length > 0
        : typeof currentValue === "object" && currentValue !== null
          ? Object.values(currentValue).some((v) => v !== "" && v != null)
          : currentValue !== "" && currentValue != null && currentValue !== 0;
      if (hasValue) {
        nextValues[key] = emptyValue;
        changed = true;
      }
    };
    transformedSurvey.questions.forEach((q) => {
      const parentVisible = visibleMap[q.id] ?? true;
      if (!parentVisible) resetField(q.id);
      (q.subQuestions || []).forEach((sub) => {
        const key = `sub_${sub.id}`;
        if (!(visibleMap[key] ?? true)) resetField(key);
      });
    });
    if (changed) formik.setValues(nextValues, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMap]);

  /* ---------- Validation ---------- */
  const validateForm = useCallback(
    (values) => {
      const errors = {};
      const safeTracerDetails = Array.isArray(tracerDetails)
        ? tracerDetails
        : [];
      safeTracerDetails.forEach((question) => {
        if (!(visibleMap[question.id] ?? true)) return;
        const subQuestions = parseSubQuestions(question.sub_questions);
        if (subQuestions.length > 0) {
          subQuestions.forEach((sub) => {
            const key = `sub_${sub.id}`;
            if (!(visibleMap[key] ?? true)) return;
            const subErrors = validateSubQuestion(
              sub,
              values,
              getQuestionTypeValue,
            );
            if (subErrors) Object.assign(errors, subErrors);
          });
        } else {
          const mainErrors = validateMainQuestion(
            question,
            values,
            getQuestionTypeValue,
          );
          if (mainErrors) Object.assign(errors, mainErrors);
        }
      });
      return errors;
    },
    [tracerDetails, getQuestionTypeValue, visibleMap],
  );

  /* ---------- Format + submit ---------- */
  const formatResponses = useCallback(
    (values) =>
      Object.entries(values)
        .filter(([questionId]) => {
          if (questionId.startsWith("sub_")) {
            const key = `sub_${questionId.replace("sub_", "")}`;
            return visibleMap[key] ?? true;
          }
          return visibleMap[questionId] ?? true;
        })
        .map(([questionId, value]) => ({
          questionId: questionId.startsWith("sub_")
            ? parseInt(questionId.replace("sub_", ""))
            : parseInt(questionId),
          response: value,
          isSubQuestion: questionId.startsWith("sub_"),
        })),
    [visibleMap],
  );

  const handleSubmit = useCallback(
    async (values, formikInstance) => {
      const resetForm = formikInstance?.resetForm;

      const errors = validateForm(values);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fix the highlighted errors before submitting.");
        return;
      }

      setValidationErrors({});
      setSubmitting(true);

      try {
        const payload = {
          uniqueId,
          applicationNo: surveyData?.data?.applicationNo,
          responses: formatResponses(values),
        };
        console.log("Submitting survey payload:", payload);

        const response =
          await PublicTracerService.submitSurveyResponses(payload);
        console.log("Submit raw response:", response);

        /* ⚠️ Service still uses `.catch(e => e)` so failures arrive as the
           Error object itself, not an axios response. Detect that shape. */
        const isErrorObject =
          response instanceof Error ||
          response?.isAxiosError === true ||
          (response && response.response !== undefined);

        if (isErrorObject) {
          throw response;
        }

        const ok =
          response?.status === 200 ||
          response?.status === 201 ||
          response?.data?.success === true;

        if (!ok) {
          throw Object.assign(new Error("Submission failed"), {
            response,
          });
        }

        toast.success(
          response?.data?.message ||
            "Survey submitted successfully! Thank you for your feedback.",
        );
        setTimeout(() => navigate("/"), 1000);
        if (resetForm) resetForm();
        setMultiSelectValues({});
        setMultipleTextValues({});
        setValidationErrors({});
      } catch (err) {
        console.error("Error submitting survey:", err);

        const status = err.response?.status;
        const serverMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to submit survey";

        if (status === 409) {
          toast.error(serverMsg || "You have already submitted this survey.");
        } else if (status === 404) {
          toast.error(serverMsg || "Survey link is invalid or expired.");
        } else if (status === 400) {
          toast.error(serverMsg || "Some answers were invalid. Please review.");
        } else if (status === 429) {
          toast.error(serverMsg || "Too many attempts. Please wait a minute.");
        } else if (status) {
          toast.error(`(${status}) ${serverMsg}`);
        } else {
          toast.error(serverMsg);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [uniqueId, surveyData, validateForm, formatResponses, navigate],
  );

  /* ---------- Change handlers ---------- */
  const clearFieldError = useCallback((key) => {
    setValidationErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(
    (key, value) => {
      formik.setFieldValue(key, value);
      clearFieldError(key);
    },
    [formik, clearFieldError],
  );

  const handleMultiSelectChange = useCallback(
    (questionId, value, isSubQuestion = false) => {
      const key = isSubQuestion ? `sub_${questionId}` : questionId;
      setMultiSelectValues((prev) => ({ ...prev, [key]: value }));
      handleFieldChange(key, value);
    },
    [handleFieldChange],
  );

  const handleMultipleTextFieldChange = useCallback(
    (questionId, fieldId, value, isSubQuestion = false) => {
      const key = isSubQuestion ? `sub_${questionId}` : questionId;
      const currentValues = multipleTextValues[key] || formik.values[key] || {};
      const updatedValues = { ...currentValues, [fieldId]: value };
      setMultipleTextValues((prev) => ({ ...prev, [key]: updatedValues }));
      handleFieldChange(key, updatedValues);
    },
    [multipleTextValues, formik.values, handleFieldChange],
  );

  /* ---------- Field rendering ---------- */
  const renderFormField = (question, isSubQuestion = false) => {
    let questionType = question.questionType;
    if (!questionType && question.questionTypeId) {
      questionType = getQuestionTypeValue(question.questionTypeId);
    }
    if (!questionType) return null;

    const questionId = question.id;
    const fieldKey = isSubQuestion ? `sub_${questionId}` : questionId;
    const fieldValue = formik.values[fieldKey];
    const fieldError = validationErrors[fieldKey];
    const isRequired = isSubQuestion ? question.isRequired : question.required;

    let options = [];
    if (question.options?.length > 0) {
      if (typeof question.options[0] === "string") {
        options = question.options.map((opt, idx) => ({ id: idx, text: opt }));
      } else if (typeof question.options[0] === "object") {
        options = question.options;
      }
    }

    const maxDigits = question.maxDigits || 0;
    const maxSelections = question.maxSelections || 0;

    const commonProps = { fieldKey, fieldValue, fieldError };

    switch (questionType) {
      case "radio":
        return (
          <RadioField
            {...commonProps}
            options={options}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
          />
        );

      case "checkbox":
        return (
          <CheckboxField
            {...commonProps}
            options={options}
            maxSelections={maxSelections}
            onChange={(optId, checked) => {
              const currentValues = fieldValue || [];
              if (checked) {
                if (
                  maxSelections > 0 &&
                  currentValues.length >= maxSelections
                ) {
                  return;
                }
                handleFieldChange(fieldKey, [...currentValues, optId]);
              } else {
                handleFieldChange(
                  fieldKey,
                  currentValues.filter((id) => id !== optId),
                );
              }
            }}
          />
        );

      case "dropdown":
        return (
          <DropdownField
            {...commonProps}
            options={options}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
          />
        );

      case "multiSelect":
        return (
          <MultiSelectField
            fieldValue={multiSelectValues[fieldKey] || fieldValue}
            fieldError={fieldError}
            options={options}
            maxSelections={maxSelections}
            onChange={(newValue) =>
              handleMultiSelectChange(questionId, newValue, isSubQuestion)
            }
          />
        );

      case "multipleText": {
        const textFields =
          question.multipleTextFields || question.options || [];
        const multiValues = multipleTextValues[fieldKey] || fieldValue || {};
        return (
          <MultipleTextField
            textFields={textFields}
            multiValues={multiValues}
            isRequired={isRequired}
            fieldError={fieldError}
            onChange={(fieldId, value) =>
              handleMultipleTextFieldChange(
                questionId,
                fieldId,
                value,
                isSubQuestion,
              )
            }
          />
        );
      }

      case "rating":
        return (
          <RatingField
            fieldValue={fieldValue}
            fieldError={fieldError}
            ratingScale={question.ratingScale || 5}
            onChange={(newValue) => handleFieldChange(fieldKey, newValue)}
          />
        );

      case "text":
      case "textarea":
        return (
          <TextFieldInput
            {...commonProps}
            isTextarea={questionType === "textarea"}
            maxDigits={maxDigits}
            onChange={(newValue) => handleFieldChange(fieldKey, newValue)}
          />
        );

      case "date":
        return (
          <DateField
            {...commonProps}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", py: 3, px: { xs: 2, md: 4 } }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(formik.values, formik);
        }}
      >
        <Paper
          sx={{ p: 0, overflow: "hidden", borderRadius: 2, width: "100%" }}
        >
          <Box
            sx={{ bgcolor: "#f5f5f5", p: 3, borderBottom: "1px solid #e0e0e0" }}
          >
            <Typography
              variant="h5"
              fontWeight={600}
              color="primary"
              gutterBottom
            >
              Tracer Survey
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please complete the survey by answering all questions below
            </Typography>
          </Box>

          <Box
            sx={{ p: 3, bgcolor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}
          >
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DescriptionIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Application Number:</strong>{" "}
                    {transformedSurvey?.applicationNo || "N/A"}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DescriptionIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Applicant Name:</strong>{" "}
                    {surveyData?.data?.applicationName || "N/A"}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ p: 3 }}>
            {transformedSurvey?.questions?.length > 0 ? (
              transformedSurvey.questions.map((question, index) => {
                const parentVisible = visibleMap[question.id] ?? true;
                if (!parentVisible) return null;

                const hasSubQuestions =
                  (question.subQuestions || []).length > 0;
                if (!question.questionType && !hasSubQuestions) return null;

                return (
                  <Box key={question.id} sx={{ mb: 3 }}>
                    <Typography variant="body1" gutterBottom fontWeight={500}>
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
                        {renderFormField(question)}
                      </Box>
                    )}

                    {hasSubQuestions && (
                      <Box sx={{ ml: 2, borderRadius: 1 }}>
                        {question.subQuestions.map((sub, subIndex) => {
                          const key = `sub_${sub.id}`;
                          const isVisible = visibleMap[key] ?? true;
                          if (!isVisible) return null;

                          return (
                            <Box key={sub.id} sx={{ mb: 2 }}>
                              <Typography variant="body2" gutterBottom>
                                {index + 1}.{subIndex + 1}{" "}
                                {sub.questionText || "Untitled Sub-question"}
                                {sub.isRequired && (
                                  <span
                                    style={{
                                      color: "red",
                                      marginLeft: "4px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    *
                                  </span>
                                )}
                              </Typography>
                              <Box sx={{ ml: 2, mt: 1 }}>
                                {renderFormField(sub, true)}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {index < transformedSurvey.questions.length - 1 && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </Box>
                );
              })
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                No questions have been added to this survey yet.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: "#f5f5f5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="caption" color="textSecondary">
              Please answer all required questions marked with *
            </Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : "Submit Survey"}
            </Button>
          </Box>
        </Paper>
      </form>
    </Box>
  );
};

export default ViewTracerSend;
