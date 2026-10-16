import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Container,
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

// ============ Shared PropTypes shapes ============
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

// ============ Pure Helper Functions (outside component) ============

const parseOptions = (optionsJson) => {
  if (!optionsJson || optionsJson === "[]") return [];
  try {
    const parsed = JSON.parse(optionsJson);
    if (parsed.length > 0 && parsed[0].optionText) {
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
    const parsed = JSON.parse(subQuestionsJson);
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

// ============ Validation Helpers ============

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
    return validateMultipleTextFields(sub.options, value)
      ? { [fieldKey]: validateMultipleTextFields(sub.options, value) }
      : null;
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

// ============ Form Value Initialization ============

const getInitialValueForType = (questionType, options) => {
  if (questionType === "checkbox" || questionType === "multiSelect") {
    return [];
  }
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

// ============ Transformed Survey Builder ============

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
        options: parseOptions(item.question_options),
        multipleTextFields: parseOptions(item.question_options),
        subQuestions: subQuestions.map((sub) => ({
          id: sub.id,
          questionText: sub.questionText,
          questionTypeId: sub.questionTypeId,
          questionType: getQuestionTypeValue(sub.questionTypeId),
          isRequired: sub.isRequired,
          ratingScale: sub.ratingScale,
          options: sub.options,
          multipleTextFields: sub.options,
        })),
      };
    }),
  };
};

// ============ Render Field Components ============

const RadioField = ({
  fieldKey,
  fieldValue,
  fieldError,
  options,
  onChange,
}) => (
  <FormControl error={!!fieldError} component="fieldset" fullWidth>
    <RadioGroup value={fieldValue || ""} onChange={onChange}>
      {options.map((opt) => (
        <FormControlLabel
          key={opt.id}
          value={opt.id.toString()}
          control={<Radio size="small" />}
          label={opt.text}
        />
      ))}
    </RadioGroup>
    {fieldError && (
      <FormHelperText error sx={{ color: "#d32f2f", fontWeight: "bold" }}>
        {fieldError}
      </FormHelperText>
    )}
  </FormControl>
);

RadioField.propTypes = {
  fieldKey: fieldKeyType,
  fieldValue: fieldValueType,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
  onChange: PropTypes.func.isRequired,
};

const CheckboxField = ({ fieldValue, fieldError, options, onChange }) => (
  <FormControl error={!!fieldError} component="fieldset" fullWidth>
    <FormGroup>
      {options.map((opt) => (
        <FormControlLabel
          key={opt.id}
          control={
            <Checkbox
              size="small"
              checked={fieldValue?.includes(opt.id) || false}
              onChange={(e) => onChange(opt.id, e.target.checked)}
            />
          }
          label={opt.text}
        />
      ))}
    </FormGroup>
    {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
  </FormControl>
);

CheckboxField.propTypes = {
  fieldValue: PropTypes.array,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
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

const MultiSelectField = ({ fieldValue, fieldError, options, onChange }) => {
  const selectedValues = fieldValue || [];
  return (
    <FormControl fullWidth size="small" error={!!fieldError}>
      <InputLabel>Select Options</InputLabel>
      <Select
        multiple
        value={selectedValues}
        onChange={(e) => {
          const value = e.target.value;
          onChange(typeof value === "string" ? value.split(",") : value);
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
          .map((option) => (
            <MenuItem key={option.id} value={option.id}>
              <Checkbox checked={selectedValues.indexOf(option.id) > -1} />
              <ListItemText primary={option.text} />
            </MenuItem>
          ))}
      </Select>
      {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
    </FormControl>
  );
};

MultiSelectField.propTypes = {
  fieldValue: PropTypes.array,
  fieldError: PropTypes.string,
  options: PropTypes.arrayOf(optionShape).isRequired,
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
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
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
  onChange,
}) => (
  <TextField
    fullWidth
    variant="standard"
    placeholder="Type your answer here..."
    name={fieldKey}
    value={fieldValue || ""}
    onChange={onChange}
    error={!!fieldError}
    helperText={fieldError}
    multiline={isTextarea}
    rows={isTextarea ? 3 : undefined}
  />
);

TextFieldInput.propTypes = {
  fieldKey: fieldKeyType.isRequired,
  fieldValue: fieldValueType,
  fieldError: PropTypes.string,
  isTextarea: PropTypes.bool,
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

// ============ Main Component ============

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

  // ============ Data Fetching ============

  const fetchTracerQuestionDropdownType = useCallback(async () => {
    try {
      const response =
        await PublicTracerService.getTracerQuestionDropdownType();
      console.log("Tracer Question Dropdown Types (raw):", response);
      const types = extractArrayFromResponse(response);
      setTracerQuestionDropdownType(types);
      console.log("Tracer Question Dropdown Types:", types);
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
      console.log("Tracer details response:", response);
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
      console.log("Survey Data:", response.data);

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

  // ============ Question Type Resolution ============

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

  // ============ Validation ============

  const validateForm = useCallback(
    (values) => {
      const errors = {};
      const safeTracerDetails = Array.isArray(tracerDetails)
        ? tracerDetails
        : [];

      safeTracerDetails.forEach((question) => {
        const subQuestions = parseSubQuestions(question.sub_questions);

        if (subQuestions.length > 0) {
          subQuestions.forEach((sub) => {
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
    [tracerDetails, getQuestionTypeValue],
  );

  // ============ Form Initialization ============

  const initialValues = useMemo(
    () => initializeFormValues(tracerDetails, getQuestionTypeValue),
    [tracerDetails, getQuestionTypeValue],
  );

  const transformedSurvey = useMemo(
    () =>
      buildTransformedSurvey(surveyData, tracerDetails, getQuestionTypeValue),
    [surveyData, tracerDetails, getQuestionTypeValue],
  );

  // ============ Submission ============

  const formatResponses = (values) =>
    Object.entries(values).map(([questionId, value]) => ({
      questionId: questionId.startsWith("sub_")
        ? parseInt(questionId.replace("sub_", ""))
        : parseInt(questionId),
      response: value,
      isSubQuestion: questionId.startsWith("sub_"),
    }));

  const handleSubmit = async (values, { resetForm }) => {
    const errors = validateForm(values);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSubmitting(true);

    try {
      const payload = {
        uniqueId,
        applicationNo: surveyData?.data?.applicationNo,
        responses: formatResponses(values),
        submittedAt: new Date().toISOString(),
      };

      console.log("Submitting responses:", payload);
      const response = await PublicTracerService.submitSurveyResponses(payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          "Survey submitted successfully! Thank you for your feedback.",
        );
        setTimeout(() => navigate("/"), 1000);
        resetForm();
        setMultiSelectValues({});
        setMultipleTextValues({});
        setValidationErrors({});
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (err) {
      console.error("Error submitting survey:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to submit survey. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: handleSubmit,
  });

  // ============ Field Change Handlers ============

  const clearFieldError = useCallback((key) => {
    setValidationErrors((prev) => {
      if (!prev[key]) return prev;
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
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

  // ============ Field Rendering ============

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
            onChange={(optId, checked) => {
              const currentValues = fieldValue || [];
              const newValues = checked
                ? [...currentValues, optId]
                : currentValues.filter((id) => id !== optId);
              handleFieldChange(fieldKey, newValues);
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
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
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

  // ============ Render ============

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
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <form onSubmit={formik.handleSubmit}>
        <Paper sx={{ p: 0, overflow: "hidden", borderRadius: 2 }}>
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
              transformedSurvey.questions.map((question, index) => (
                <Box key={question.id} sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom fontWeight={500}>
                    {index + 1}. {question.questionText || "Untitled Question"}
                    {question.required && (
                      <span style={{ color: "red", marginLeft: "4px" }}>*</span>
                    )}
                  </Typography>

                  {question.questionType && (
                    <Box sx={{ ml: 2, mt: 1, mb: 2 }}>
                      {renderFormField(question)}
                    </Box>
                  )}

                  {question.subQuestions?.length > 0 && (
                    <Box sx={{ ml: 2, borderRadius: 1 }}>
                      {question.subQuestions.map((sub, subIndex) => (
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
                      ))}
                    </Box>
                  )}

                  {index < transformedSurvey.questions.length - 1 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                </Box>
              ))
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
    </Container>
  );
};

export default ViewTracerSend;
