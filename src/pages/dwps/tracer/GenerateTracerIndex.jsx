import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  Badge,
  Rating,
  OutlinedInput,
  ListItemText,
  Chip,
  Input,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import LockResetIcon from "@mui/icons-material/LockReset";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import GenerateTracerService from "../../../api/services/internal/tracer/GenerateTracerService";
import CommonService from "../../../api/services/internal/common/CommonService";

const GenerateTracerIndex = () => {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [ratingValues, setRatingValues] = useState({});
  const [multiSelectValues, setMultiSelectValues] = useState({});
  const [textInputValues, setTextInputValues] = useState({});
  const [textAreaValues, setTextAreaValues] = useState({});
  const [multipleTextValues, setMultipleTextValues] = useState({});
  const [dropdownValues, setDropdownValues] = useState({});
  const [tracerQuestionDropdownType, setTracerQuestionDropdownType] = useState(
    [],
  );
  const [parentTracerTypes, setParentTracerTypes] = useState([]);
  const [subTracerTypes, setSubTracerTypes] = useState([]);
  const [isLoadingSubTypes, setIsLoadingSubTypes] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  useEffect(() => {
    fetchTracerQuestionDropdownType();
    fetchParentTracerTypes();
  }, []);

  const fetchTracerQuestionDropdownType = async () => {
    try {
      const response =
        await GenerateTracerService.getTracerQuestionDropdownType(access_token);
      setTracerQuestionDropdownType(response.data);
      console.log("Tracer Question Dropdown Types:", response.data);
    } catch (error) {
      console.error("Error fetching tracer question dropdown types:", error);
    }
  };

  const fetchParentTracerTypes = async () => {
    try {
      const response =
        await GenerateTracerService.getParentTracerTypes(access_token);
      setParentTracerTypes(response.data);
      console.log("Parent Tracer Types:", response.data);
    } catch (error) {
      console.error("Error fetching parent tracer types:", error);
    }
  };

  // Fetch sub tracer types dynamically based on parent ID
  const fetchSubTracerTypes = async (parentId) => {
    if (!parentId) {
      setSubTracerTypes([]);
      return;
    }

    setIsLoadingSubTypes(true);
    try {
      const response = await CommonService.getByParentId(parentId);
      setSubTracerTypes(response.data);
      console.log(`Sub Tracer Types for parent ${parentId}:`, response.data);
    } catch (error) {
      console.error("Error fetching sub tracer types:", error);
      setSubTracerTypes([]);
    } finally {
      setIsLoadingSubTypes(false);
    }
  };

  // Handle parent tracer type change
  const handleParentTracerTypeChange = async (selectedParentId) => {
    // Reset sub tracer type value
    formik.setFieldValue("subTracerTypeId", "");
    // Fetch sub tracer types for the selected parent
    await fetchSubTracerTypes(selectedParentId);
  };

  // Helper function to get question type value by ID
  const getQuestionTypeValue = (typeId) => {
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId,
    );
    return questionType ? questionType.value : null;
  };

  // Helper function to check if question type requires options
  const requiresOptions = (typeId) => {
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId,
    );
    const value = questionType?.value;
    return ["radio", "checkbox", "dropdown", "multiSelect"].includes(value);
  };

  // Helper function to check if question type is multiple text
  const isMultipleText = (typeId) => {
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId,
    );
    return questionType?.value === "multipleText";
  };

  // Helper function to check if question type is rating
  const isRating = (typeId) => {
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId,
    );
    return questionType?.value === "rating";
  };

  // Create validation schema dynamically based on loaded data
  const createValidationSchema = () => {
    return Yup.object({
      tracerTitle: Yup.string().required("Tracer title is required"),
      parentTracerTypeId: Yup.string().required(
        "Parent tracer type is required",
      ),
      subTracerTypeId: Yup.string().when("parentTracerTypeId", {
        is: (val) => val && val !== "",
        then: (schema) => schema.required("Sub tracer type is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      questions: Yup.array().of(
        Yup.object().shape({
          questionText: Yup.string().required("Question text is required"),
          questionTypeId: Yup.string().when("subQuestions", {
            is: (subQuestions) => subQuestions && subQuestions.length > 0,
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema.required("Question type is required"),
          }),
          required: Yup.boolean(),
          options: Yup.array().when("questionTypeId", {
            is: (val) => val && requiresOptions(val),
            then: (schema) =>
              schema
                .of(Yup.string().required("Option text is required"))
                .min(1, "At least one option is required"),
          }),
          multipleTextFields: Yup.array().when("questionTypeId", {
            is: (val) => val && isMultipleText(val),
            then: (schema) =>
              schema
                .of(Yup.string().required("Field label is required"))
                .min(1, "At least one field is required"),
          }),
          ratingScale: Yup.number().when("questionTypeId", {
            is: (val) => val && isRating(val),
            then: (schema) => schema.required("Rating scale is required"),
          }),
          subQuestions: Yup.array().of(
            Yup.object().shape({
              questionText: Yup.string().required(
                "Sub-question text is required",
              ),
              questionTypeId: Yup.string().required(
                "Sub-question type is required",
              ),
              required: Yup.boolean(),
              options: Yup.array().when("questionTypeId", {
                is: (val) => val && requiresOptions(val),
                then: (schema) =>
                  schema
                    .of(Yup.string().required("Option text is required"))
                    .min(1, "At least one option is required"),
              }),
              multipleTextFields: Yup.array().when("questionTypeId", {
                is: (val) => val && isMultipleText(val),
                then: (schema) =>
                  schema
                    .of(Yup.string().required("Field label is required"))
                    .min(1, "At least one field is required"),
              }),
              ratingScale: Yup.number().when("questionTypeId", {
                is: (val) => val && isRating(val),
                then: (schema) => schema.required("Rating scale is required"),
              }),
            }),
          ),
        }),
      ),
    });
  };

  // Formik setup
  const formik = useFormik({
    initialValues: {
      tracerTitle: "",
      parentTracerTypeId: "",
      subTracerTypeId: "",
      questions: [
        {
          id: 1,
          questionText: "",
          questionTypeId: "",
          required: false,
          subQuestions: [],
          options: [""],
          multipleTextFields: [""],
          ratingScale: 5,
        },
      ],
    },
    validationSchema: createValidationSchema(),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Prepare data for API submission
        const submissionData = {
          tracerTitle: values.tracerTitle,
          parentTracerTypeId: values.parentTracerTypeId,
          subTracerTypeId: values.subTracerTypeId,
          questions: values.questions.map((q, index) => {
            const questionData = {
              questionOrder: index + 1,
              questionText: q.questionText,
              questionTypeId: q.questionTypeId,
              required: q.required ? 1 : 0,
              options: q.options?.filter((opt) => opt.trim() !== "") || [],
              multipleTextFields:
                q.multipleTextFields?.filter((field) => field.trim() !== "") ||
                [],
            };

            // Only add ratingScale if the question type is rating
            if (isRating(q.questionTypeId)) {
              questionData.ratingScale = q.ratingScale;
            }

            questionData.subQuestions =
              q.subQuestions?.map((sub, subIndex) => {
                const subQuestionData = {
                  subQuestionOrder: subIndex + 1,
                  questionText: sub.questionText,
                  questionTypeId: sub.questionTypeId,
                  required: sub.required ? 1 : 0,
                  options:
                    sub.options?.filter((opt) => opt.trim() !== "") || [],
                  multipleTextFields:
                    sub.multipleTextFields?.filter(
                      (field) => field.trim() !== "",
                    ) || [],
                };

                // Only add ratingScale if the sub-question type is rating
                if (isRating(sub.questionTypeId)) {
                  subQuestionData.ratingScale = sub.ratingScale;
                }

                return subQuestionData;
              }) || [];

            return questionData;
          }),
        };
        console.log("Prepared Submission Data:", submissionData);

        const response = await GenerateTracerService.saveTracerQuestions(
          submissionData,
          access_token,
        );

        if (response.status === 200 || response.status === 201) {
          console.log("API Response:", response.data);
          const { applicationNo, message, success } = response.data;

          if (success && applicationNo) {
            toast.success(`${message}\nApplication Number: ${applicationNo}`);
          } else {
            toast.success(message || "Questions saved successfully!");
          }

          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (error) {
        console.error("Error saving questions:", error);
        toast.error("Failed to save questions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  // Update validation schema when tracerQuestionDropdownType changes
  useEffect(() => {
    if (tracerQuestionDropdownType.length > 0) {
      formik.validationSchema = createValidationSchema();
    }
  }, [tracerQuestionDropdownType]);

  // Add new question
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      questionText: "",
      questionTypeId: "",
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
    setActiveTab(formik.values.questions.length);
  };

  // Delete question
  const deleteQuestion = (questionId) => {
    const newQuestions = formik.values.questions.filter(
      (q) => q.id !== questionId,
    );
    formik.setFieldValue("questions", newQuestions);
    if (activeTab >= newQuestions.length) {
      setActiveTab(Math.max(0, newQuestions.length - 1));
    }
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

  // Add sub-question
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
              questionTypeId: "",
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
    if (activeTab === draggedItem) {
      setActiveTab(dropIndex);
    } else if (activeTab > draggedItem && activeTab <= dropIndex) {
      setActiveTab(activeTab - 1);
    } else if (activeTab < draggedItem && activeTab >= dropIndex) {
      setActiveTab(activeTab + 1);
    }
  };

  // Reset form
  const handleReset = () => {
    formik.resetForm();
    setActiveTab(0);
    setRatingValues({});
    setMultiSelectValues({});
    setTextInputValues({});
    setTextAreaValues({});
    setMultipleTextValues({});
    setDropdownValues({});
    setSubTracerTypes([]);
    toast.info("Form has been reset");
  };

  // Get validation error count for a question
  const getQuestionErrorCount = (question, index) => {
    let count = 0;
    const touched = formik.touched.questions?.[index];
    const errors = formik.errors.questions?.[index];

    if (touched?.questionText && errors?.questionText) count++;
    if (
      touched?.questionTypeId &&
      errors?.questionTypeId &&
      !(question.subQuestions?.length > 0)
    )
      count++;

    if (errors?.options && question.options?.some((opt) => !opt)) count++;
    if (
      errors?.multipleTextFields &&
      question.multipleTextFields?.some((field) => !field)
    )
      count++;

    return count;
  };

  // Render stars with numbers for rating
  const renderRatingStars = (scale, value, onChange, disabled = false) => {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
      >
        <Rating
          name="rating"
          value={value || 0}
          precision={1}
          max={scale}
          onChange={(event, newValue) => {
            if (onChange) onChange(newValue);
          }}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={<StarIcon fontSize="inherit" />}
          disabled={disabled}
          sx={{
            "& .MuiRating-iconFilled": {
              color: "#1976d2",
            },
            "& .MuiRating-iconHover": {
              color: "#1976d2",
            },
          }}
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {[...Array(scale)].map((_, i) => (
            <Button
              key={i}
              variant={value === i + 1 ? "contained" : "outlined"}
              size="small"
              onClick={() => onChange && onChange(i + 1)}
              disabled={disabled}
              sx={{
                minWidth: 32,
                height: 32,
                p: 0,
                backgroundColor: value === i + 1 ? "#1976d2" : "transparent",
                borderColor: "#1976d2",
                color: value === i + 1 ? "white" : "#1976d2",
                "&:hover": {
                  backgroundColor: value === i + 1 ? "#1976d2" : "#e3f2fd",
                  borderColor: "#1976d2",
                },
              }}
            >
              {i + 1}
            </Button>
          ))}
        </Box>
      </Box>
    );
  };

  // Render underlined dropdown preview (single select)
  const renderUnderlinedDropdown = (options, questionId, disabled = false) => {
    const value = dropdownValues[questionId] || "";

    const handleChange = (event) => {
      setDropdownValues((prev) => ({
        ...prev,
        [questionId]: event.target.value,
      }));
    };

    return (
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel id={`dropdown-label-${questionId}`}>
          Select an option
        </InputLabel>
        <Select
          labelId={`dropdown-label-${questionId}`}
          value={value}
          onChange={handleChange}
          label="Select an option"
          sx={{
            "&:before": {
              borderBottomColor: "#1976d2",
            },
            "&:hover:before": {
              borderBottomColor: "#1976d2",
            },
            "&:after": {
              borderBottomColor: "#1976d2",
            },
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {options
            .filter((opt) => opt.trim() !== "")
            .map((option, idx) => (
              <MenuItem key={idx} value={option}>
                {option}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  };

  // Render original multi-select dropdown preview
  const renderOriginalMultiSelect = (options, questionId, disabled = false) => {
    const selectedValues = multiSelectValues[questionId] || [];

    const handleChange = (event) => {
      const value = event.target.value;
      setMultiSelectValues((prev) => ({
        ...prev,
        [questionId]: typeof value === "string" ? value.split(",") : value,
      }));
    };

    return (
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>Select Options</InputLabel>
        <Select
          multiple
          value={selectedValues}
          onChange={handleChange}
          input={<OutlinedInput label="Select Options" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {options
            .filter((opt) => opt.trim() !== "")
            .map((option, idx) => (
              <MenuItem key={idx} value={option}>
                <Checkbox checked={selectedValues.indexOf(option) > -1} />
                <ListItemText primary={option} />
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  };

  // Render underlined text input preview
  const renderUnderlinedTextInput = (
    questionId,
    disabled = false,
    isTextArea = false,
    fieldLabel = null,
  ) => {
    const value = isTextArea
      ? textAreaValues[questionId] || ""
      : textInputValues[questionId] || "";

    const handleChange = (e) => {
      if (isTextArea) {
        setTextAreaValues((prev) => ({
          ...prev,
          [questionId]: e.target.value,
        }));
      } else {
        setTextInputValues((prev) => ({
          ...prev,
          [questionId]: e.target.value,
        }));
      }
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
          InputProps={{
            disableUnderline: false,
            sx: {
              "&:before": {
                borderBottomColor: "#1976d2",
              },
              "&:hover:before": {
                borderBottomColor: "#1976d2",
              },
              "&:after": {
                borderBottomColor: "#1976d2",
              },
            },
          }}
        />
      );
    }

    return (
      <Input
        fullWidth
        placeholder={fieldLabel || "Type your answer here..."}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        disableUnderline={false}
        sx={{
          "&:before": {
            borderBottomColor: "#1976d2",
          },
          "&:hover:before": {
            borderBottomColor: "#1976d2",
          },
          "&:after": {
            borderBottomColor: "#1976d2",
          },
        }}
      />
    );
  };

  // Render multiple text inputs preview
  const renderMultipleTextInputs = (fields, questionId, disabled = false) => {
    if (!multipleTextValues[questionId]) {
      multipleTextValues[questionId] = {};
    }

    const handleFieldChange = (fieldIndex, value) => {
      setMultipleTextValues((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [fieldIndex]: value,
        },
      }));
    };

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {fields
          .filter((field) => field.trim() !== "")
          .map((field, idx) => (
            <Box key={idx}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {field}
              </Typography>
              <Input
                fullWidth
                placeholder={`Enter ${field.toLowerCase()}`}
                value={multipleTextValues[questionId]?.[idx] || ""}
                onChange={(e) => handleFieldChange(idx, e.target.value)}
                disabled={disabled}
                disableUnderline={false}
                sx={{
                  "&:before": {
                    borderBottomColor: "#1976d2",
                  },
                  "&:hover:before": {
                    borderBottomColor: "#1976d2",
                  },
                  "&:after": {
                    borderBottomColor: "#1976d2",
                  },
                }}
              />
            </Box>
          ))}
      </Box>
    );
  };

  // Render options based on question type ID
  const renderOptions = (
    question,
    isSubQuestion = false,
    parentId = null,
    subId = null,
  ) => {
    const questionTypeValue = getQuestionTypeValue(question.questionTypeId);

    switch (questionTypeValue) {
      case "radio":
      case "checkbox":
      case "dropdown":
      case "multiSelect":
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
              <InputLabel>Number of Stars</InputLabel>
              <Select
                value={question.ratingScale || 5}
                label="Number of Stars"
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
                <MenuItem value={3}>3 Stars</MenuItem>
                <MenuItem value={5}>5 Stars</MenuItem>
                <MenuItem value={7}>7 Stars</MenuItem>
                <MenuItem value={10}>10 Stars</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Preview:
              </Typography>
              <Box sx={{ mt: 1 }}>
                {renderRatingStars(question.ratingScale || 5, null, null, true)}
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // Render preview of options based on question type ID
  const renderPreviewOptions = (question, questionId = null) => {
    const questionTypeValue = getQuestionTypeValue(question.questionTypeId);
    if (!questionTypeValue) return null;

    switch (questionTypeValue) {
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
        const dropdownId = questionId || question.id;
        return renderUnderlinedDropdown(
          question.options || [],
          dropdownId,
          false,
        );

      case "multiSelect":
        const multiSelectId = questionId || question.id;
        return renderOriginalMultiSelect(
          question.options || [],
          multiSelectId,
          false,
        );

      case "multipleText":
        const multipleTextId = questionId || question.id;
        return renderMultipleTextInputs(
          question.multipleTextFields || [],
          multipleTextId,
          false,
        );

      case "rating":
        const ratingKey = questionId || question.id;
        return renderRatingStars(
          question.ratingScale || 5,
          ratingValues[ratingKey] || 0,
          (value) =>
            setRatingValues((prev) => ({ ...prev, [ratingKey]: value })),
          false,
        );

      case "text":
        const textKey = questionId || question.id;
        return renderUnderlinedTextInput(textKey, false, false, null);

      case "textarea":
        const textareaKey = questionId || question.id;
        return renderUnderlinedTextInput(textareaKey, false, true, null);

      case "date":
        return (
          <TextField
            type="date"
            variant="standard"
            InputLabelProps={{ shrink: true }}
            sx={{
              width: "100%",
              "&:before": {
                borderBottomColor: "#1976d2",
              },
              "&:hover:before": {
                borderBottomColor: "#1976d2",
              },
              "&:after": {
                borderBottomColor: "#1976d2",
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  // Render a single question form
  const renderQuestionForm = (question, index) => {
    const currentQuestionTypeValue = getQuestionTypeValue(
      question.questionTypeId,
    );

    return (
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
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DragIcon sx={{ mr: 1, color: "text.secondary", cursor: "grab" }} />
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
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Question Text"
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
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              fullWidth
              size="small"
              error={
                formik.touched.questions?.[index]?.questionTypeId &&
                Boolean(formik.errors.questions?.[index]?.questionTypeId) &&
                !(question.subQuestions && question.subQuestions.length > 0)
              }
            >
              <InputLabel>Question Type</InputLabel>
              <Select
                value={question.questionTypeId}
                label="Question Type"
                onChange={(e) => {
                  const newTypeId = e.target.value;
                  updateQuestion(question.id, "questionTypeId", newTypeId);
                  const newTypeValue = getQuestionTypeValue(newTypeId);
                  if (
                    newTypeValue &&
                    ["radio", "checkbox", "dropdown", "multiSelect"].includes(
                      newTypeValue,
                    )
                  ) {
                    if (!question.options || question.options.length === 0) {
                      updateQuestion(question.id, "options", [""]);
                    }
                  } else if (newTypeValue === "multipleText") {
                    if (
                      !question.multipleTextFields ||
                      question.multipleTextFields.length === 0
                    ) {
                      updateQuestion(question.id, "multipleTextFields", [""]);
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>-- Select Question Type --</em>
                </MenuItem>
                {tracerQuestionDropdownType.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
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
                  checked={question.required}
                  onChange={(e) =>
                    updateQuestion(question.id, "required", e.target.checked)
                  }
                />
              }
              label="Required"
            />
          </Grid>
          {currentQuestionTypeValue && (
            <Grid item size={{ xs: 12, md: 6 }}>
              {renderOptions(question)}
            </Grid>
          )}
          {!currentQuestionTypeValue && (
            <>
              {question.subQuestions?.length > 0 && (
                <Grid item size={{ xs: 12, md: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  {question.subQuestions.map((sub, subIndex) => (
                    <Paper key={sub.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          Sub-question {subIndex + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteSubQuestion(question.id, sub.id)}
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
                              value={sub.questionTypeId}
                              label="Question Type"
                              onChange={(e) => {
                                const newTypeId = e.target.value;
                                updateSubQuestion(
                                  question.id,
                                  sub.id,
                                  "questionTypeId",
                                  newTypeId,
                                );
                                const newTypeValue =
                                  getQuestionTypeValue(newTypeId);
                                if (
                                  newTypeValue &&
                                  [
                                    "radio",
                                    "checkbox",
                                    "dropdown",
                                    "multiSelect",
                                  ].includes(newTypeValue)
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
                                }
                              }}
                            >
                              <MenuItem value="">
                                <em>-- Select Question Type --</em>
                              </MenuItem>
                              {tracerQuestionDropdownType.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
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
                        {sub.questionTypeId && (
                          <Grid item size={{ xs: 12, md: 6 }}>
                            {renderOptions(sub, true, question.id, sub.id)}
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))}
                </Grid>
              )}
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
    );
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
        <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Tracer Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tracer Title"
                name="tracerTitle"
                value={formik.values.tracerTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                variant="outlined"
                size="small"
                error={
                  formik.touched.tracerTitle &&
                  Boolean(formik.errors.tracerTitle)
                }
                helperText={
                  formik.touched.tracerTitle && formik.errors.tracerTitle
                }
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                size="small"
                error={
                  formik.touched.parentTracerTypeId &&
                  Boolean(formik.errors.parentTracerTypeId)
                }
              >
                <InputLabel>Select Parent Tracer Type</InputLabel>
                <Select
                  name="parentTracerTypeId"
                  value={formik.values.parentTracerTypeId}
                  label="Select Parent Tracer Type"
                  onChange={async (e) => {
                    const selectedValue = e.target.value;
                    formik.handleChange(e);
                    await handleParentTracerTypeChange(selectedValue);
                  }}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">
                    <em>-- Select Parent Tracer Type --</em>
                  </MenuItem>
                  {parentTracerTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.dropdown_name}
                    </MenuItem>
                  ))}
                </Select>
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
                disabled={
                  !formik.values.parentTracerTypeId || isLoadingSubTypes
                }
              >
                <InputLabel>Select Sub Tracer Type</InputLabel>
                <Select
                  name="subTracerTypeId"
                  value={formik.values.subTracerTypeId}
                  label="Select Sub Tracer Type"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">
                    <em>-- Select Sub Tracer Type --</em>
                  </MenuItem>
                  {subTracerTypes.length > 0 ? (
                    subTracerTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name || type.dropdown_name}
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
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {formik.values.questions.length > 0 && (
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 2,
              overflowX: "auto",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {formik.values.questions.map((question, index) => {
                const errorCount = getQuestionErrorCount(question, index);
                return (
                  <Tab
                    key={question.id}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <span>Q{index + 1}</span>
                        {errorCount > 0 && (
                          <Badge
                            badgeContent={errorCount}
                            color="error"
                            sx={{
                              "& .MuiBadge-badge": {
                                fontSize: 10,
                                height: 16,
                                minWidth: 16,
                              },
                            }}
                          />
                        )}
                        {question.required && !question.questionTypeId && (
                          <span style={{ color: "red", fontSize: 12 }}>*</span>
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          {formik.values.questions.length > 0 &&
            renderQuestionForm(formik.values.questions[activeTab], activeTab)}
        </Box>

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

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight={650} gutterBottom>
          Live Preview
        </Typography>
        <Paper
          sx={{ p: 2, maxHeight: 400, overflow: "auto" }}
          variant="outlined"
        >
          {formik.values.tracerTitle && (
            <Typography variant="h6" gutterBottom color="primary">
              {formik.values.tracerTitle}
            </Typography>
          )}
          {formik.values.parentTracerTypeId && (
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tracer Type:{" "}
              {parentTracerTypes.find(
                (t) => t.id === formik.values.parentTracerTypeId,
              )?.dropdown_name || ""}
              {formik.values.subTracerTypeId &&
                subTracerTypes.find(
                  (t) => t.id === formik.values.subTracerTypeId,
                ) && (
                  <>
                    {" "}
                    -{" "}
                    {subTracerTypes.find(
                      (t) => t.id === formik.values.subTracerTypeId,
                    )?.name ||
                      subTracerTypes.find(
                        (t) => t.id === formik.values.subTracerTypeId,
                      )?.dropdown_name ||
                      ""}
                  </>
                )}
            </Typography>
          )}
          {(formik.values.tracerTitle || formik.values.parentTracerTypeId) && (
            <Divider sx={{ my: 2 }} />
          )}

          {formik.values.questions.map((question, index) => {
            const questionTypeValue = getQuestionTypeValue(
              question.questionTypeId,
            );
            return (
              <Box key={question.id} sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  {index + 1}. {question.questionText || "Untitled Question"}
                  {question.required && (
                    <span style={{ color: "red" }}> *</span>
                  )}
                </Typography>
                {questionTypeValue && (
                  <Box sx={{ ml: 2, mt: 1 }}>
                    {renderPreviewOptions(question, question.id)}
                  </Box>
                )}
                {!questionTypeValue && question.subQuestions?.length > 0 && (
                  <Box
                    sx={{
                      ml: 2,
                      mt: 1,
                      pl: 2,
                      borderLeft: 2,
                      borderColor: "divider",
                    }}
                  >
                    {question.subQuestions.map((sub, subIndex) => {
                      const subQuestionTypeValue = getQuestionTypeValue(
                        sub.questionTypeId,
                      );
                      return (
                        <Box key={sub.id} sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            {index + 1}.{subIndex + 1}{" "}
                            {sub.questionText || "Untitled Sub-question"}
                            {sub.required && (
                              <span style={{ color: "red" }}> *</span>
                            )}
                          </Typography>
                          {subQuestionTypeValue && (
                            <Box sx={{ ml: 2 }}>
                              {renderPreviewOptions(
                                sub,
                                `${question.id}-${sub.id}`,
                              )}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}
        </Paper>
      </Box>
    </Paper>
  );
};

export default GenerateTracerIndex;
