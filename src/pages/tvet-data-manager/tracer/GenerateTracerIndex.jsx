import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Button,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormGroup,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import LockResetIcon from "@mui/icons-material/LockReset";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

// Validation schema - FIXED: questionType not required when subQuestions exist
const validationSchema = Yup.object({
  tracerType: Yup.string().required("Tracer type is required"),
  questions: Yup.array().of(
    Yup.object().shape({
      questionText: Yup.string().required("Question text is required"),
      questionType: Yup.string().when("subQuestions", {
        is: (subQuestions) => subQuestions && subQuestions.length > 0,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required("Question type is required"),
      }),
      required: Yup.boolean(),
      options: Yup.array().when("questionType", {
        is: (val) => ["radio", "checkbox", "dropdown"].includes(val),
        then: (schema) =>
          schema
            .of(Yup.string().required("Option text is required"))
            .min(1, "At least one option is required"),
      }),
      multipleTextFields: Yup.array().when("questionType", {
        is: "multipleText",
        then: (schema) =>
          schema
            .of(Yup.string().required("Field label is required"))
            .min(1, "At least one field is required"),
      }),
      ratingScale: Yup.number().when("questionType", {
        is: "rating",
        then: (schema) => schema.required("Rating scale is required"),
      }),
      subQuestions: Yup.array().of(
        Yup.object().shape({
          questionText: Yup.string().required("Sub-question text is required"),
          questionType: Yup.string().required("Sub-question type is required"),
          required: Yup.boolean(),
          options: Yup.array().when("questionType", {
            is: (val) => ["radio", "checkbox", "dropdown"].includes(val),
            then: (schema) =>
              schema
                .of(Yup.string().required("Option text is required"))
                .min(1, "At least one option is required"),
          }),
          multipleTextFields: Yup.array().when("questionType", {
            is: "multipleText",
            then: (schema) =>
              schema
                .of(Yup.string().required("Field label is required"))
                .min(1, "At least one field is required"),
          }),
          ratingScale: Yup.number().when("questionType", {
            is: "rating",
            then: (schema) => schema.required("Rating scale is required"),
          }),
        }),
      ),
    }),
  ),
});

// Tracer types
const tracerTypes = [
  { value: "employer", label: "Employer Tracer" },
  { value: "trainee", label: "Trainee Tracer" },
];

const GenerateTracerIndex = () => {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  // Question types (file upload removed)
  const questionTypes = [
    { value: "radio", label: "Single Choice (Radio)" },
    { value: "checkbox", label: "Multiple Choice (Checkbox)" },
    { value: "text", label: "Text Input" },
    { value: "textarea", label: "Text Area" },
    { value: "multipleText", label: "Multiple Text Inputs (Add More)" },
    { value: "dropdown", label: "Dropdown Select" },
    { value: "rating", label: "Rating Scale" },
    { value: "date", label: "Date Picker" },
  ];

  // Formik setup
  const formik = useFormik({
    initialValues: {
      tracerType: "",
      questions: [
        {
          id: 1,
          questionText: "",
          questionType: "",
          required: false,
          subQuestions: [],
          options: [""],
          multipleTextFields: [""],
          ratingScale: 5,
        },
      ],
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Here you would make your actual API call
        // const response = await axios.post('/api/save-questions', values);

        console.log("Saving questions:", JSON.stringify(values, null, 2));
        toast.success("Questions saved successfully!");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error("Error saving questions:", error);
        toast.error("Failed to save questions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  // Add new question
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      questionText: "",
      questionType: "",
      required: false,
      subQuestions: [],
      options: [""],
      multipleTextFields: [""],
      ratingScale: 5,
    };
    formik.setFieldValue("questions", [
      ...formik.values.questions,
      newQuestion,
    ]);
  };

  // Delete question
  const deleteQuestion = (questionId) => {
    const newQuestions = formik.values.questions.filter(
      (q) => q.id !== questionId,
    );
    formik.setFieldValue("questions", newQuestions);
  };

  // Update question
  const updateQuestion = (questionId, field, value) => {
    const updatedQuestions = formik.values.questions.map((q) =>
      q.id === questionId ? { ...q, [field]: value } : q,
    );
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Add option to question
  const addOption = (questionId, isSubQuestion = false, subId = null) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.id === questionId) {
        return {
          ...q,
          options: [...(q.options || [""]), ""],
        };
      } else if (isSubQuestion && q.id === questionId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) =>
            sub.id === subId
              ? { ...sub, options: [...(sub.options || [""]), ""] }
              : sub,
          ),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Update option
  const updateOption = (
    questionId,
    index,
    value,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.id === questionId) {
        const newOptions = [...(q.options || [""])];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      } else if (isSubQuestion && q.id === questionId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.id === subId) {
              const newOptions = [...(sub.options || [""])];
              newOptions[index] = value;
              return { ...sub, options: newOptions };
            }
            return sub;
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Delete option
  const deleteOption = (
    questionId,
    index,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.id === questionId) {
        const newOptions = (q.options || [""]).filter((_, i) => i !== index);
        return {
          ...q,
          options: newOptions.length ? newOptions : [""],
        };
      } else if (isSubQuestion && q.id === questionId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.id === subId) {
              const newOptions = (sub.options || [""]).filter(
                (_, i) => i !== index,
              );
              return {
                ...sub,
                options: newOptions.length ? newOptions : [""],
              };
            }
            return sub;
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Add sub-question - FIXED: Changed questionType from "radio" to empty string
  const addSubQuestion = (parentId) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (q.id === parentId) {
        return {
          ...q,
          subQuestions: [
            ...q.subQuestions,
            {
              id: Date.now(),
              questionText: "",
              questionType: "", // Changed from "radio" to empty string
              required: false,
              options: [""],
              multipleTextFields: [""],
              ratingScale: 5,
            },
          ],
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Update sub-question
  const updateSubQuestion = (parentId, subId, field, value) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (q.id === parentId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) =>
            sub.id === subId ? { ...sub, [field]: value } : sub,
          ),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Delete sub-question
  const deleteSubQuestion = (parentId, subId) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (q.id === parentId) {
        return {
          ...q,
          subQuestions: q.subQuestions.filter((sub) => sub.id !== subId),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Add multiple text field
  const addMultipleTextField = (
    questionId,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.id === questionId) {
        return {
          ...q,
          multipleTextFields: [...(q.multipleTextFields || [""]), ""],
        };
      } else if (isSubQuestion && q.id === questionId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.id === subId) {
              return {
                ...sub,
                multipleTextFields: [...(sub.multipleTextFields || [""]), ""],
              };
            }
            return sub;
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Update multiple text field
  const updateMultipleTextField = (
    questionId,
    index,
    value,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.id === questionId) {
        const newFields = [...(q.multipleTextFields || [""])];
        newFields[index] = value;
        return { ...q, multipleTextFields: newFields };
      } else if (isSubQuestion && q.id === questionId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.id === subId) {
              const newFields = [...(sub.multipleTextFields || [""])];
              newFields[index] = value;
              return { ...sub, multipleTextFields: newFields };
            }
            return sub;
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Delete multiple text field
  const deleteMultipleTextField = (
    questionId,
    index,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.id === questionId) {
        const newFields = (q.multipleTextFields || [""]).filter(
          (_, i) => i !== index,
        );
        return {
          ...q,
          multipleTextFields: newFields.length ? newFields : [""],
        };
      } else if (isSubQuestion && q.id === questionId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.id === subId) {
              const newFields = (sub.multipleTextFields || [""]).filter(
                (_, i) => i !== index,
              );
              return {
                ...sub,
                multipleTextFields: newFields.length ? newFields : [""],
              };
            }
            return sub;
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newQuestions = [...formik.values.questions];
    const draggedQuestion = newQuestions[draggedItem];
    newQuestions.splice(draggedItem, 1);
    newQuestions.splice(dropIndex, 0, draggedQuestion);

    formik.setFieldValue("questions", newQuestions);
    setDraggedItem(null);
  };

  // Reset form
  const handleReset = () => {
    formik.resetForm();
    toast.info("Form has been reset");
  };

  // Render options based on question type
  const renderOptions = (
    question,
    isSubQuestion = false,
    parentId = null,
    subId = null,
  ) => {
    switch (question.questionType) {
      case "radio":
      case "checkbox":
      case "dropdown":
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Options:
            </Typography>
            {(question.options || [""]).map((option, index) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}
              >
                <TextField
                  size="small"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) =>
                    updateOption(
                      isSubQuestion ? parentId : question.id,
                      index,
                      e.target.value,
                      isSubQuestion,
                      subId,
                    )
                  }
                  fullWidth
                  error={!option && formik.submitCount > 0}
                  helperText={
                    !option && formik.submitCount > 0
                      ? "Option is required"
                      : ""
                  }
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    deleteOption(
                      isSubQuestion ? parentId : question.id,
                      index,
                      isSubQuestion,
                      subId,
                    )
                  }
                  disabled={(question.options || [""]).length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                addOption(
                  isSubQuestion ? parentId : question.id,
                  isSubQuestion,
                  subId,
                )
              }
              sx={{ mt: 1 }}
            >
              Add Option
            </Button>
          </Box>
        );

      case "multipleText":
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Text Fields:
            </Typography>
            {(question.multipleTextFields || [""]).map((field, index) => (
              <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder={`Field ${index + 1} label`}
                  value={field}
                  onChange={(e) =>
                    updateMultipleTextField(
                      isSubQuestion ? parentId : question.id,
                      index,
                      e.target.value,
                      isSubQuestion,
                      subId,
                    )
                  }
                  fullWidth
                  error={!field && formik.submitCount > 0}
                  helperText={
                    !field && formik.submitCount > 0
                      ? "Field label is required"
                      : ""
                  }
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    deleteMultipleTextField(
                      isSubQuestion ? parentId : question.id,
                      index,
                      isSubQuestion,
                      subId,
                    )
                  }
                  disabled={(question.multipleTextFields || [""]).length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                addMultipleTextField(
                  isSubQuestion ? parentId : question.id,
                  isSubQuestion,
                  subId,
                )
              }
              sx={{ mt: 1 }}
            >
              Add Field
            </Button>
          </Box>
        );

      case "rating":
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Scale</InputLabel>
              <Select
                value={question.ratingScale || 5}
                label="Scale"
                onChange={(e) =>
                  isSubQuestion
                    ? updateSubQuestion(
                        parentId,
                        subId,
                        "ratingScale",
                        e.target.value,
                      )
                    : updateQuestion(question.id, "ratingScale", e.target.value)
                }
              >
                <MenuItem value={3}>3 Points</MenuItem>
                <MenuItem value={5}>5 Points</MenuItem>
                <MenuItem value={7}>7 Points</MenuItem>
                <MenuItem value={10}>10 Points</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      default:
        return null;
    }
  };

  // Render preview of options
  const renderPreviewOptions = (question) => {
    if (!question.questionType) return null;

    switch (question.questionType) {
      case "radio":
        return (
          <RadioGroup>
            {(question.options || [""]).map((opt, idx) => (
              <FormControlLabel
                key={idx}
                value={opt}
                control={<Radio />}
                label={opt || `Option ${idx + 1}`}
              />
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <FormGroup>
            {(question.options || [""]).map((opt, idx) => (
              <FormControlLabel
                key={idx}
                control={<Checkbox />}
                label={opt || `Option ${idx + 1}`}
              />
            ))}
          </FormGroup>
        );

      case "dropdown":
        return (
          <FormControl size="small" fullWidth>
            <InputLabel>Select</InputLabel>
            <Select label="Select">
              {(question.options || [""]).map((opt, idx) => (
                <MenuItem key={idx} value={opt}>
                  {opt || `Option ${idx + 1}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "multipleText":
        return (
          <Box>
            {(question.multipleTextFields || [""]).map((field, idx) => (
              <TextField
                key={idx}
                size="small"
                label={field || `Field ${idx + 1}`}
                fullWidth
                sx={{ mb: 1 }}
              />
            ))}
            <Button size="small" startIcon={<AddIcon />}>
              Add More
            </Button>
          </Box>
        );

      case "rating":
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            {[...Array(question.ratingScale || 5)].map((_, i) => (
              <Button key={i} variant="outlined" size="small">
                {i + 1}
              </Button>
            ))}
          </Box>
        );

      case "text":
        return <TextField size="small" placeholder="Text input" fullWidth />;

      case "textarea":
        return (
          <TextField
            multiline
            rows={3}
            size="small"
            placeholder="Text area"
            fullWidth
          />
        );

      case "date":
        return (
          <TextField
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 2 }, mt: 1 }} elevation={2}>
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ textAlign: "center", mb: 4 }}
      >
        Tracer Question Generator
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Questions saved successfully!
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        {/* Questions List */}
        {formik.values.questions.map((question, index) => (
          <Paper
            key={question.id}
            sx={{
              p: 3,
              mb: 2,
              cursor: "move",
              border:
                draggedItem === index ? "2px dashed primary.main" : "1px solid",
              borderColor: draggedItem === index ? "primary.main" : "divider",
              position: "relative",
            }}
            variant="outlined"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Question Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <DragIcon
                sx={{ mr: 1, color: "text.secondary", cursor: "grab" }}
              />
              <Typography fontWeight={600} sx={{ flex: 1 }}>
                Question {index + 1}
              </Typography>
              <IconButton
                color="error"
                onClick={() => deleteQuestion(question.id)}
                disabled={formik.values.questions.length === 1}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {/* Tracer Type Dropdown */}
              <Grid item size={{ xs: 12, md: 2 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={
                    formik.touched.tracerType &&
                    Boolean(formik.errors.tracerType)
                  }
                >
                  <InputLabel>Select Tracer Type</InputLabel>
                  <Select
                    name="tracerType"
                    value={formik.values.tracerType}
                    label="Select Tracer Type"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    <MenuItem value="">
                      <em>-- Select Tracer Type --</em>
                    </MenuItem>
                    {tracerTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.tracerType && formik.errors.tracerType && (
                    <Typography variant="caption" color="error">
                      {formik.errors.tracerType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              {/* Question Text */}
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Question Text"
                  name={`questions[${index}].questionText`}
                  value={question.questionText}
                  onChange={(e) =>
                    updateQuestion(question.id, "questionText", e.target.value)
                  }
                  onBlur={formik.handleBlur}
                  variant="outlined"
                  size="small"
                  error={
                    formik.touched.questions?.[index]?.questionText &&
                    Boolean(formik.errors.questions?.[index]?.questionText)
                  }
                  helperText={
                    formik.touched.questions?.[index]?.questionText &&
                    formik.errors.questions?.[index]?.questionText
                  }
                />
              </Grid>
              {/* Question Type and Required Toggle */}
              <Grid item size={{ xs: 12, md: 2 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={
                    formik.touched.questions?.[index]?.questionType &&
                    Boolean(formik.errors.questions?.[index]?.questionType) &&
                    !(question.subQuestions && question.subQuestions.length > 0) // Don't show error if sub-questions exist
                  }
                >
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={question.questionType}
                    label="Question Type"
                    onChange={(e) => {
                      const newType = e.target.value;
                      updateQuestion(question.id, "questionType", newType);

                      // Initialize appropriate fields based on type
                      if (
                        newType &&
                        ["radio", "checkbox", "dropdown"].includes(newType)
                      ) {
                        if (
                          !question.options ||
                          question.options.length === 0
                        ) {
                          updateQuestion(question.id, "options", [""]);
                        }
                      } else if (newType === "multipleText") {
                        if (
                          !question.multipleTextFields ||
                          question.multipleTextFields.length === 0
                        ) {
                          updateQuestion(question.id, "multipleTextFields", [
                            "",
                          ]);
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Select Question Type --</em>
                    </MenuItem>
                    {questionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.questions?.[index]?.questionType &&
                    formik.errors.questions?.[index]?.questionType &&
                    !(
                      question.subQuestions && question.subQuestions.length > 0
                    ) && (
                      <Typography variant="caption" color="error">
                        {formik.errors.questions?.[index]?.questionType}
                      </Typography>
                    )}
                </FormControl>
              </Grid>
              <Grid item size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={question.required}
                      onChange={(e) =>
                        updateQuestion(
                          question.id,
                          "required",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Required"
                />
              </Grid>
              {/* Dynamic Options based on question type */}
              {question.questionType && (
                <Grid item size={{ xs: 12, md: 6 }}>
                  {renderOptions(question)}
                </Grid>
              )}
              {/* Sub-questions - only show if NO question type is selected */}
              {!question.questionType && (
                <>
                  {question.subQuestions?.length > 0 && (
                    <Grid item size={{ xs: 12, md: 12 }}>
                      <Divider sx={{ my: 2 }} />
                      {question.subQuestions.map((sub, subIndex) => (
                        <Paper
                          key={sub.id}
                          variant="outlined"
                          sx={{ p: 2, mb: 2 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ flex: 1 }}>
                              Sub-question {subIndex + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                deleteSubQuestion(question.id, sub.id)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Sub-question Text"
                                value={sub.questionText}
                                onChange={(e) =>
                                  updateSubQuestion(
                                    question.id,
                                    sub.id,
                                    "questionText",
                                    e.target.value,
                                  )
                                }
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 4 }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                  value={sub.questionType}
                                  label="Question Type"
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    updateSubQuestion(
                                      question.id,
                                      sub.id,
                                      "questionType",
                                      newType,
                                    );
                                    if (
                                      newType &&
                                      [
                                        "radio",
                                        "checkbox",
                                        "dropdown",
                                      ].includes(newType)
                                    ) {
                                      if (
                                        !sub.options ||
                                        sub.options.length === 0
                                      ) {
                                        updateSubQuestion(
                                          question.id,
                                          sub.id,
                                          "options",
                                          [""],
                                        );
                                      }
                                    } else if (newType === "multipleText") {
                                      if (
                                        !sub.multipleTextFields ||
                                        sub.multipleTextFields.length === 0
                                      ) {
                                        updateSubQuestion(
                                          question.id,
                                          sub.id,
                                          "multipleTextFields",
                                          [""],
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>-- Select Question Type --</em>
                                  </MenuItem>
                                  {questionTypes.map((type) => (
                                    <MenuItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 2 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={sub.required}
                                    onChange={(e) =>
                                      updateSubQuestion(
                                        question.id,
                                        sub.id,
                                        "required",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                }
                                label="Required"
                              />
                            </Grid>

                            {/* Sub-question options */}
                            {sub.questionType && (
                              <Grid item size={{ xs: 12, md: 6 }}>
                                {renderOptions(sub, true, question.id, sub.id)}
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      ))}
                    </Grid>
                  )}

                  {/* Add Sub-question Button */}
                  <Grid item xs={12}>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<AddIcon />}
                      onClick={() => addSubQuestion(question.id)}
                    >
                      Add Sub-question
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        ))}

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addQuestion}
          >
            Add Question
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleReset}
          >
            <LockResetIcon /> Reset
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} /> : <OpenInNewIcon />
            }
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </form>
      {/* Live Preview */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight={650} gutterBottom>
          Live Preview
        </Typography>
        <Paper sx={{ p: 2 }} variant="outlined">
          {/* Display selected tracer type in preview */}
          {formik.values.tracerType && (
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Tracer Type:{" "}
              {tracerTypes.find((t) => t.value === formik.values.tracerType)
                ?.label || formik.values.tracerType}
            </Typography>
          )}
          {formik.values.questions.map((question, index) => (
            <Box key={question.id} sx={{ mb: 1 }}>
              <Typography variant="body1" gutterBottom>
                {index + 1}. {question.questionText || "Untitled Question"}
                {question.required && <span style={{ color: "red" }}> *</span>}
              </Typography>
              {/* Preview based on question type */}
              {question.questionType && (
                <Box sx={{ ml: 1, mt: 1 }}>
                  {renderPreviewOptions(question)}
                </Box>
              )}
              {/* Sub-questions preview */}
              {!question.questionType && question.subQuestions?.length > 0 && (
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {/*  Sub-questions: */}
                  {question.subQuestions.map((sub, subIndex) => (
                    <Box key={sub.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        {index + 1}.{subIndex + 1}{" "}
                        {sub.questionText || "Untitled Sub-question"}
                        {sub.required && (
                          <span style={{ color: "red" }}> *</span>
                        )}
                      </Typography>

                      {/* Sub-question preview */}
                      {sub.questionType && (
                        <Box sx={{ ml: 2 }}>{renderPreviewOptions(sub)}</Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Paper>
      </Box>
    </Paper>
  );
};

export default GenerateTracerIndex;
