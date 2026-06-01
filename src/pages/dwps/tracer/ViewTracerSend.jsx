// ViewTracerSend.jsx - With redirect to home page after successful submission
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "react-toastify";
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

  useEffect(() => {
    if (uniqueId) {
      fetchSurveyData();
      fetchTracerQuestionDropdownType();
    }
  }, [uniqueId]);

  const fetchSurveyData = async () => {
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
  };

  const fetchTracerQuestionDropdownType = async () => {
    try {
      const response =
        await PublicTracerService.getTracerQuestionDropdownType();
      setTracerQuestionDropdownType(response.data);
      console.log("Tracer Question Dropdown Types:", response.data);
    } catch (error) {
      console.error("Error fetching tracer question dropdown types:", error);
    }
  };

  const fetchTracerDetails = async (applicationNo) => {
    try {
      const response =
        await PublicTracerService.getTracerDetailsByApplicationNo(
          applicationNo,
        );
      const questions = Array.isArray(response)
        ? response
        : response.data || [];
      setTracerDetails(questions);
      setError(null);
    } catch (err) {
      console.error("Error fetching tracer details:", err);
      setError("Failed to load tracer details. Please try again.");
    }
  };

  const getQuestionTypeValue = (typeId) => {
    if (!typeId) return null;
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId.toString(),
    );
    return questionType ? questionType.value : null;
  };

  const parseOptions = (optionsJson) => {
    if (!optionsJson || optionsJson === "[]") return [];
    try {
      const parsed = JSON.parse(optionsJson);
      if (parsed.length > 0 && parsed[0].optionText) {
        return parsed.map((opt) => ({
          id: opt.id,
          text: opt.optionText,
        }));
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
      return parsed.map((sub) => {
        let isRequired = false;
        if (
          sub.isRequired === 1 ||
          sub.isRequired === "1" ||
          sub.isRequired === true ||
          sub.isRequired === "true"
        ) {
          isRequired = true;
        }
        return {
          id: sub.id,
          questionText: sub.questionText,
          questionTypeId: sub.questionTypeId,
          isRequired: isRequired,
          ratingScale: sub.ratingScale || 5,
          subQuestionOrder: sub.subQuestionOrder,
          options:
            sub.options && sub.options.length > 0
              ? sub.options.map((opt) => ({
                  id: opt.id,
                  text: opt.optionText || opt,
                }))
              : [],
        };
      });
    } catch (error) {
      console.error("Error parsing sub-questions:", error);
      return [];
    }
  };

  const initializeFormValues = (questions) => {
    const initialValues = {};

    questions.forEach((question) => {
      const subQuestions = parseSubQuestions(question.sub_questions);

      if (subQuestions && subQuestions.length > 0) {
        subQuestions.forEach((sub) => {
          const questionType = getQuestionTypeValue(sub.questionTypeId);
          const fieldKey = `sub_${sub.id}`;

          if (questionType === "checkbox" || questionType === "multiSelect") {
            initialValues[fieldKey] = [];
          } else if (questionType === "multipleText") {
            const multiResponses = {};
            const options = sub.options || [];
            options.forEach((opt, idx) => {
              multiResponses[`field_${opt.id || idx}`] = "";
            });
            initialValues[fieldKey] = multiResponses;
          } else {
            initialValues[fieldKey] = "";
          }
        });
      } else {
        const questionType = getQuestionTypeValue(question.question_type_id);
        const fieldKey = question.id;

        if (questionType === "checkbox" || questionType === "multiSelect") {
          initialValues[fieldKey] = [];
        } else if (questionType === "multipleText") {
          const multiResponses = {};
          const options = parseOptions(question.question_options);
          options.forEach((opt, idx) => {
            multiResponses[`field_${opt.id || idx}`] = "";
          });
          initialValues[fieldKey] = multiResponses;
        } else {
          initialValues[fieldKey] = "";
        }
      }
    });

    return initialValues;
  };

  // Manual validation function
  const validateForm = (values) => {
    const errors = {};

    tracerDetails.forEach((question) => {
      const subQuestions = parseSubQuestions(question.sub_questions);

      if (subQuestions && subQuestions.length > 0) {
        subQuestions.forEach((sub) => {
          if (sub.isRequired) {
            const questionType = getQuestionTypeValue(sub.questionTypeId);
            const fieldKey = `sub_${sub.id}`;
            const value = values[fieldKey];

            if (questionType === "radio") {
              if (!value || value === "") {
                errors[fieldKey] = "Please select an option";
              }
            } else if (
              questionType === "checkbox" ||
              questionType === "multiSelect"
            ) {
              if (!value || (Array.isArray(value) && value.length === 0)) {
                errors[fieldKey] = "Please select at least one option";
              }
            } else if (questionType === "multipleText") {
              if (sub.options && sub.options.length > 0) {
                for (const opt of sub.options) {
                  const fieldName = `field_${opt.id}`;
                  if (!value[fieldName] || value[fieldName].trim() === "") {
                    errors[fieldKey] =
                      `${opt.text || "This field"} is required`;
                    break;
                  }
                }
              }
            } else if (questionType === "rating") {
              if (!value || value === 0) {
                errors[fieldKey] = "Please provide a rating";
              }
            } else if (
              questionType === "text" ||
              questionType === "textarea" ||
              questionType === "date" ||
              questionType === "dropdown"
            ) {
              if (!value || value.toString().trim() === "") {
                errors[fieldKey] = "This field is required";
              }
            }
          }
        });
      } else {
        if (question.is_required === "1" || question.is_required === 1) {
          const questionType = getQuestionTypeValue(question.question_type_id);
          const fieldKey = question.id;
          const value = values[fieldKey];

          if (questionType === "radio") {
            if (!value || value === "") {
              errors[fieldKey] = "Please select an option";
            }
          } else if (
            questionType === "checkbox" ||
            questionType === "multiSelect"
          ) {
            if (!value || (Array.isArray(value) && value.length === 0)) {
              errors[fieldKey] = "Please select at least one option";
            }
          } else if (questionType === "multipleText") {
            const options = parseOptions(question.question_options);
            if (options && options.length > 0) {
              for (const opt of options) {
                const fieldName = `field_${opt.id}`;
                if (!value[fieldName] || value[fieldName].trim() === "") {
                  errors[fieldKey] = `${opt.text || "This field"} is required`;
                  break;
                }
              }
            }
          } else if (questionType === "rating") {
            if (!value || value === 0) {
              errors[fieldKey] = "Please provide a rating";
            }
          } else if (
            questionType === "text" ||
            questionType === "textarea" ||
            questionType === "date" ||
            questionType === "dropdown"
          ) {
            if (!value || value.toString().trim() === "") {
              errors[fieldKey] = "This field is required";
            }
          }
        }
      }
    });

    return errors;
  };

  const transformedSurvey = {
    applicationNo: surveyData?.data?.applicationNo,
    parentTracerTypeName: surveyData?.data?.applicationName,
    subTracerTypeName: "",
    questions: tracerDetails.map((item) => {
      const subQuestions = parseSubQuestions(item.sub_questions);
      return {
        id: item.id,
        questionText: item.question_text,
        questionType: getQuestionTypeValue(item.question_type_id),
        required: item.is_required === "1" || item.is_required === 1,
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

  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    if (tracerDetails.length > 0) {
      const values = initializeFormValues(tracerDetails);
      setInitialValues(values);
    }
  }, [tracerDetails]);

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Manual validation
      const errors = validateForm(values);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return; // Just show errors under fields, no toast
      }

      setValidationErrors({});
      setSubmitting(true);

      try {
        const formattedResponses = Object.entries(values).map(
          ([questionId, value]) => ({
            questionId: questionId.startsWith("sub_")
              ? parseInt(questionId.replace("sub_", ""))
              : parseInt(questionId),
            response: value,
            isSubQuestion: questionId.startsWith("sub_"),
          }),
        );

        const payload = {
          uniqueId: uniqueId,
          applicationNo: surveyData?.data?.applicationNo,
          responses: formattedResponses,
          submittedAt: new Date().toISOString(),
        };

        console.log("Submitting responses:", payload);

        const response =
          await PublicTracerService.submitSurveyResponses(payload);

        if (response.status === 200 || response.status === 201) {
          toast.success(
            "Survey submitted successfully! Thank you for your feedback.",
          );

          // Redirect to home page after 1 second (or immediately)
          setTimeout(() => {
            navigate("/");
          }, 1000);

          // Optionally reset form (though redirect will happen)
          formik.resetForm();
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
    },
  });

  const handleMultiSelectChange = (
    questionId,
    value,
    isSubQuestion = false,
  ) => {
    const key = isSubQuestion ? `sub_${questionId}` : questionId;
    setMultiSelectValues((prev) => ({ ...prev, [key]: value }));
    formik.setFieldValue(key, value);
    // Clear validation error for this field when user changes value
    if (validationErrors[key]) {
      const newErrors = { ...validationErrors };
      delete newErrors[key];
      setValidationErrors(newErrors);
    }
  };

  const handleMultipleTextFieldChange = (
    questionId,
    fieldId,
    value,
    isSubQuestion = false,
  ) => {
    const key = isSubQuestion ? `sub_${questionId}` : questionId;
    const currentValues = multipleTextValues[key] || formik.values[key] || {};
    const updatedValues = { ...currentValues, [fieldId]: value };
    setMultipleTextValues((prev) => ({ ...prev, [key]: updatedValues }));
    formik.setFieldValue(key, updatedValues);
    // Clear validation error for this field when user changes value
    if (validationErrors[key]) {
      const newErrors = { ...validationErrors };
      delete newErrors[key];
      setValidationErrors(newErrors);
    }
  };

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
    if (question.options && question.options.length > 0) {
      if (typeof question.options[0] === "string") {
        options = question.options.map((opt, idx) => ({ id: idx, text: opt }));
      } else if (typeof question.options[0] === "object") {
        options = question.options;
      }
    }

    switch (questionType) {
      case "radio":
        return (
          <FormControl error={!!fieldError} component="fieldset" fullWidth>
            <RadioGroup
              value={fieldValue || ""}
              onChange={(e) => {
                formik.setFieldValue(fieldKey, e.target.value);
                if (validationErrors[fieldKey]) {
                  const newErrors = { ...validationErrors };
                  delete newErrors[fieldKey];
                  setValidationErrors(newErrors);
                }
              }}
            >
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
              <FormHelperText
                error
                sx={{ color: "#d32f2f", fontWeight: "bold" }}
              >
                {fieldError}
              </FormHelperText>
            )}
          </FormControl>
        );

      case "checkbox":
        return (
          <FormControl error={!!fieldError} component="fieldset" fullWidth>
            <FormGroup>
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={fieldValue?.includes(opt.id) || false}
                      onChange={(e) => {
                        const currentValues = fieldValue || [];
                        let newValues;
                        if (e.target.checked) {
                          newValues = [...currentValues, opt.id];
                        } else {
                          newValues = currentValues.filter(
                            (id) => id !== opt.id,
                          );
                        }
                        formik.setFieldValue(fieldKey, newValues);
                        if (validationErrors[fieldKey]) {
                          const newErrors = { ...validationErrors };
                          delete newErrors[fieldKey];
                          setValidationErrors(newErrors);
                        }
                      }}
                    />
                  }
                  label={opt.text}
                />
              ))}
            </FormGroup>
            {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
          </FormControl>
        );

      case "dropdown":
        return (
          <FormControl fullWidth variant="standard" error={!!fieldError}>
            <InputLabel>Select an option</InputLabel>
            <Select
              value={fieldValue || ""}
              onChange={(e) => {
                formik.setFieldValue(fieldKey, e.target.value);
                if (validationErrors[fieldKey]) {
                  const newErrors = { ...validationErrors };
                  delete newErrors[fieldKey];
                  setValidationErrors(newErrors);
                }
              }}
              label="Select an option"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {options
                .filter((opt) => opt && opt.text && opt.text.trim() !== "")
                .map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.text}
                  </MenuItem>
                ))}
            </Select>
            {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
          </FormControl>
        );

      case "multiSelect":
        const selectedValues = multiSelectValues[fieldKey] || fieldValue || [];
        return (
          <FormControl fullWidth size="small" error={!!fieldError}>
            <InputLabel>Select Options</InputLabel>
            <Select
              multiple
              value={selectedValues}
              onChange={(e) => {
                const value = e.target.value;
                const newValue =
                  typeof value === "string" ? value.split(",") : value;
                handleMultiSelectChange(questionId, newValue, isSubQuestion);
              }}
              input={<OutlinedInput label="Select Options" />}
              renderValue={(selectedIds) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selectedIds.map((id) => {
                    const option = options.find((opt) => opt.id === id);
                    return (
                      <Chip key={id} label={option?.text || id} size="small" />
                    );
                  })}
                </Box>
              )}
            >
              {options
                .filter((opt) => opt && opt.text && opt.text.trim() !== "")
                .map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    <Checkbox
                      checked={selectedValues.indexOf(option.id) > -1}
                    />
                    <ListItemText primary={option.text} />
                  </MenuItem>
                ))}
            </Select>
            {fieldError && <FormHelperText error>{fieldError}</FormHelperText>}
          </FormControl>
        );

      case "multipleText":
        const textFields =
          question.multipleTextFields || question.options || [];
        const multiValues = multipleTextValues[fieldKey] || fieldValue || {};
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {textFields
              .filter(
                (field) => field && field.text && field.text.trim() !== "",
              )
              .map((field) => (
                <Box key={field.id}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    {field.text}{" "}
                    {isRequired && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <Input
                    fullWidth
                    placeholder={`Enter ${field.text.toLowerCase()}`}
                    value={multiValues[`field_${field.id}`] || ""}
                    onChange={(e) =>
                      handleMultipleTextFieldChange(
                        questionId,
                        `field_${field.id}`,
                        e.target.value,
                        isSubQuestion,
                      )
                    }
                    disableUnderline={false}
                  />
                </Box>
              ))}
          </Box>
        );

      case "rating":
        const ratingScale = question.ratingScale || 5;
        return (
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
                onChange={(event, newValue) => {
                  formik.setFieldValue(fieldKey, newValue);
                  if (validationErrors[fieldKey]) {
                    const newErrors = { ...validationErrors };
                    delete newErrors[fieldKey];
                    setValidationErrors(newErrors);
                  }
                }}
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
                    onClick={() => {
                      formik.setFieldValue(fieldKey, i + 1);
                      if (validationErrors[fieldKey]) {
                        const newErrors = { ...validationErrors };
                        delete newErrors[fieldKey];
                        setValidationErrors(newErrors);
                      }
                    }}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      p: 0,
                      backgroundColor:
                        fieldValue === i + 1 ? "#1976d2" : "transparent",
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

      case "text":
      case "textarea":
        return (
          <TextField
            fullWidth
            variant="standard"
            placeholder="Type your answer here..."
            name={fieldKey}
            value={fieldValue || ""}
            onChange={(e) => {
              formik.setFieldValue(fieldKey, e.target.value);
              if (validationErrors[fieldKey]) {
                const newErrors = { ...validationErrors };
                delete newErrors[fieldKey];
                setValidationErrors(newErrors);
              }
            }}
            error={!!fieldError}
            helperText={fieldError}
            multiline={questionType === "textarea"}
            rows={questionType === "textarea" ? 3 : undefined}
          />
        );

      case "date":
        return (
          <TextField
            type="date"
            variant="standard"
            name={fieldKey}
            value={fieldValue || ""}
            onChange={(e) => {
              formik.setFieldValue(fieldKey, e.target.value);
              if (validationErrors[fieldKey]) {
                const newErrors = { ...validationErrors };
                delete newErrors[fieldKey];
                setValidationErrors(newErrors);
              }
            }}
            error={!!fieldError}
            helperText={fieldError}
            InputLabelProps={{ shrink: true }}
            sx={{ width: "100%" }}
          />
        );

      default:
        return null;
    }
  };

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

          {/* Questions Section */}
          <Box sx={{ p: 3 }}>
            {transformedSurvey?.questions &&
            transformedSurvey.questions.length > 0 ? (
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

                  {question.subQuestions &&
                    question.subQuestions.length > 0 && (
                      <Box
                        sx={{
                          ml: 2,
                          borderRadius: 1,
                        }}
                      >
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

          {/* Footer Actions */}
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
