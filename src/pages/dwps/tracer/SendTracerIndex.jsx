import { useState, useEffect } from "react";
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
  const [tracerQuestionDropdownType, setTracerQuestionDropdownType] = useState([]);
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

  // Formik validation schema for send action - Both parent and sub tracer types are required
  const sendValidationSchema = yup.object({
    parentTracerTypeId: yup
      .string()
      .required("Please select a parent tracer type"),
    subTracerTypeId: yup.string().required("Please select a sub tracer type"),
  });

  // Formik for send validation
  const formik = useFormik({
    initialValues: {
      parentTracerTypeId: "",
      subTracerTypeId: "",
    },
    validationSchema: sendValidationSchema,
    onSubmit: (values) => {},
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch parent tracer types on component mount
  useEffect(() => {
    if (access_token) {
      fetchParentTracerTypes();
      fetchTracerDetails();
      fetchTracerQuestionDropdownType();
    }
  }, [access_token]);

  const fetchParentTracerTypes = async () => {
    if (!access_token) {
      console.warn("No access token available");
      return;
    }
    try {
      const response = await GenerateTracerService.getParentTracerTypes(access_token);
      setParentTracerTypes(response.data || []);
      console.log("Parent Tracer Types:", response.data);
    } catch (error) {
      console.error("Error fetching parent tracer types:", error);
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
      } else {
        toast.error("Error fetching parent tracer types");
      }
      setParentTracerTypes([]);
    }
  };

  const fetchTracerDetails = async () => {
    if (!access_token) {
      console.warn("No access token available");
      return;
    }
    setLoading(true);
    try {
      const response = await GenerateTracerService.getTracerAllApplications(access_token);
      setTracerDetails(response.data || []);
      console.log("Tracer Details:", response.data);
    } catch (error) {
      console.error("Error fetching tracer details:", error);
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
      } else {
        toast.error("Error fetching tracer details");
      }
      setTracerDetails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracerApplicationDetails = async (applicationNo) => {
    if (!access_token) {
      console.warn("No access token available");
      return [];
    }
    setViewLoading(true);
    try {
      const response = await GenerateTracerService.getTracerDetailsByApplicationNo(
        applicationNo,
        access_token,
      );
      setTracerApplicationDetails(response.data || []);
      console.log(
        `Tracer Application Details for ${applicationNo}:`,
        response.data,
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching tracer application details:", error);
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
      } else {
        toast.error("Error fetching tracer application details");
      }
      return [];
    } finally {
      setViewLoading(false);
    }
  };

  const fetchTracerQuestionDropdownType = async () => {
    if (!access_token) {
      console.warn("No access token available");
      return;
    }
    try {
      const response = await GenerateTracerService.getTracerQuestionDropdownType(access_token);
      setTracerQuestionDropdownType(response.data || []);
      console.log("Tracer Question Dropdown Types:", response.data);
    } catch (error) {
      console.error("Error fetching tracer question dropdown types:", error);
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
      } else {
        toast.error("Error fetching question dropdown types");
      }
      setTracerQuestionDropdownType([]);
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
      const subTypes = (response.data || []).map((item) => ({
        id: item.id || item.sub_tracer_type_id,
        name: item.name || item.dropdown_name,
        ...item,
      }));
      setSubTracerTypes(subTypes);
      console.log(`Sub Tracer Types for parent ${parentId}:`, subTypes);
    } catch (error) {
      console.error("Error fetching sub tracer types:", error);
      toast.error("Error fetching sub tracer types");
      setSubTracerTypes([]);
    } finally {
      setIsLoadingSubTypes(false);
    }
  };

  // Handle parent tracer type change
  const handleParentTracerTypeChange = async (selectedParentId) => {
    setSelectedParentType(selectedParentId);
    setSelectedSubType("");
    formik.setFieldValue("parentTracerTypeId", selectedParentId);
    formik.setFieldValue("subTracerTypeId", "");
    // Clear validation errors when changing selections
    formik.setFieldTouched("parentTracerTypeId", false);
    formik.setFieldTouched("subTracerTypeId", false);
    await fetchSubTracerTypes(selectedParentId);
  };

  // Handle sub tracer type change
  const handleSubTracerTypeChange = (selectedSubId) => {
    setSelectedSubType(selectedSubId);
    formik.setFieldValue("subTracerTypeId", selectedSubId);
    // Clear validation error when sub type is selected
    formik.setFieldTouched("subTracerTypeId", false);
  };

  // Helper function to get question type value by ID
  const getQuestionTypeValue = (typeId) => {
    if (!typeId) return null;
    const questionType = (tracerQuestionDropdownType || []).find(
      (t) => t.id === typeId.toString(),
    );
    return questionType ? questionType.value : null;
  };

  // Get question type for a question (handles both main and sub questions)
  const getQuestionTypeForId = (typeId) => {
    if (!typeId) return null;
    const questionType = (tracerQuestionDropdownType || []).find(
      (t) => t.id === typeId.toString(),
    );
    return questionType ? questionType.value : null;
  };

  // Parse options from JSON string
  const parseOptions = (optionsJson) => {
    if (!optionsJson || optionsJson === "[]") return [];
    try {
      return JSON.parse(optionsJson);
    } catch (error) {
      console.error("Error parsing options:", error);
      return [];
    }
  };

  // Parse sub-questions from JSON string with their options
  const parseSubQuestions = (subQuestionsJson) => {
    if (!subQuestionsJson || subQuestionsJson === "[]") return [];
    try {
      const parsed = JSON.parse(subQuestionsJson);
      return parsed.map((sub) => ({
        id: sub.id,
        questionText: sub.questionText,
        questionTypeId: sub.questionTypeId,
        isRequired: sub.isRequired,
        ratingScale: sub.ratingScale || 5,
        subQuestionOrder: sub.subQuestionOrder,
        options:
          sub.options && sub.options.length > 0
            ? sub.options.map((opt) => opt.optionText || opt)
            : [],
      }));
    } catch (error) {
      console.error("Error parsing sub-questions:", error);
      return [];
    }
  };

  // Transform API data to survey format
  const transformToSurveyFormat = (
    applicationData,
    parentTypeName,
    subTypeName,
  ) => {
    if (!applicationData || applicationData.length === 0) return null;

    const questions = applicationData.map((item, index) => {
      const questionTypeValue = getQuestionTypeValue(item.question_type_id);
      const options = parseOptions(item.question_options);
      const subQuestions = parseSubQuestions(item.sub_questions);

      return {
        id: item.id,
        questionText: item.question_text,
        questionType: questionTypeValue,
        required: item.is_required === "1",
        ratingScale: item.rating_scale ? parseInt(item.rating_scale) : 5,
        options: options.map((opt) => opt.optionText),
        multipleTextFields: options.map((opt) => opt.optionText),
        subQuestions: subQuestions,
      };
    });

    return {
      id: applicationData[0]?.id,
      applicationNo: applicationData[0]?.application_no,
      parentTracerTypeName: parentTypeName,
      subTracerTypeName: subTypeName,
      tracerCreatedAt: applicationData[0]?.created_at?.split(" ")[0],
      status: "Pending",
      questions: questions,
    };
  };

  // Filter surveys based on selected parent and sub tracer types using IDs
  const filteredTracerDetails = (tracerDetails || []).filter((tracer) => {
    const matchesParent = selectedParentType
      ? String(tracer.parent_tracer_type_id) === String(selectedParentType)
      : true;
    const matchesSub = selectedSubType
      ? String(tracer.sub_tracer_type_id) === String(selectedSubType)
      : true;
    return matchesParent && matchesSub;
  });

  // Filter surveys based on search
  const filteredSurveys = (filteredTracerDetails || []).filter((survey) => {
    const matchesSearch = search
      ? survey.application_no?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesSearch;
  });

  // Pagination functions
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get current page rows for display
  const paginatedSurveys = (filteredSurveys || []).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Validate before sending - Now requires both parent and sub tracer types
  const validateBeforeSend = async () => {
    setSendError("");

    // Validate form values
    const errors = await formik.validateForm();

    if (Object.keys(errors).length > 0) {
      // Set touched to show errors
      formik.setTouched({
        parentTracerTypeId: true,
        subTracerTypeId: true,
      });

      // Create error message
      const errorMessages = [];
      if (errors.parentTracerTypeId)
        errorMessages.push(errors.parentTracerTypeId);
      if (errors.subTracerTypeId) errorMessages.push(errors.subTracerTypeId);

      setSendError(errorMessages.join(". "));
      return false;
    }

    return true;
  };

  // Handle send to selected survey - Now validates both parent and sub types
  const handleSend = async (survey) => {
    // Check if parent type is selected
    if (!selectedParentType) {
      toast.warning("Please select a parent tracer type first");
      return;
    }

    // Check if sub type is selected
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
      selectedTrainees: selectedTrainees,
    };

    console.log("Sending trainee tracer data:", sendData);

    try {
      const response = await GenerateTracerService.sendTraineeTracerSurvey(
        sendData,
        access_token,
      );
      toast.success(
        `Trainee Tracer survey sent to ${selectedTrainees.length} trainee(s) successfully!`,
      );
      handleCloseSendDialog();
      fetchTracerDetails(); // Refresh the list
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
      selectedEmployers: selectedEmployers,
    };

    console.log("Sending employer tracer data:", sendData);

    try {
      const response = await GenerateTracerService.sendEmployerTracerSurvey(
        sendData,
        access_token,
      );
      toast.success(
        `Employer Tracer survey sent to ${selectedEmployers.length} employer(s) successfully!`,
      );
      handleCloseSendDialog();
      fetchTracerDetails(); // Refresh the list
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
          if (question.questionType === "checkbox") {
            initialResponses[`q_${question.id}`] = [];
          } else if (question.questionType === "multipleText") {
            const multiResponses = {};
            question.multipleTextFields.forEach((field, idx) => {
              multiResponses[`field_${idx}`] = "";
            });
            initialResponses[`q_${question.id}`] = multiResponses;
          } else {
            initialResponses[`q_${question.id}`] = "";
          }

          if (question.subQuestions && question.subQuestions.length > 0) {
            question.subQuestions.forEach((sub) => {
              if (sub.questionType === "checkbox") {
                initialResponses[`sub_${sub.id}`] = [];
              } else {
                initialResponses[`sub_${sub.id}`] = "";
              }
            });
          }
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
      const currentValues = prev[key] || [];
      if (checked) {
        return { ...prev, [key]: [...currentValues, option] };
      } else {
        return {
          ...prev,
          [key]: currentValues.filter((item) => item !== option),
        };
      }
    });
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
            "& .MuiRating-iconFilled": { color: "#1976d2" },
            "& .MuiRating-iconHover": { color: "#1976d2" },
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
              }}
            >
              {i + 1}
            </Button>
          ))}
        </Box>
      </Box>
    );
  };

  // Render underlined dropdown preview
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
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {(options || [])
            .filter((opt) => opt && opt.trim() !== "")
            .map((option, idx) => (
              <MenuItem key={idx} value={option}>
                {option}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  };

  // Render multi-select dropdown preview
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
              {(selected || []).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {(options || [])
            .filter((opt) => opt && opt.trim() !== "")
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
        [questionId]: { ...(prev[questionId] || {}), [fieldIndex]: value },
      }));
    };
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {(fields || [])
          .filter((field) => field && field.trim() !== "")
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
              />
            </Box>
          ))}
      </Box>
    );
  };

  // Render preview options based on question type
  const renderPreviewOptions = (question, isSubQuestion = false) => {
    let questionType = question.questionType;

    if (!questionType && question.questionTypeId) {
      questionType = getQuestionTypeForId(question.questionTypeId);
    }

    if (!questionType) return null;

    const questionId = question.id;
    const responseKey = isSubQuestion ? `sub_${questionId}` : `q_${questionId}`;
    const responseValue =
      formResponses[responseKey] || (questionType === "checkbox" ? [] : "");

    let options = [];
    if (question.options && question.options.length > 0) {
      if (typeof question.options[0] === "string") {
        options = question.options;
      } else if (typeof question.options[0] === "object") {
        options = question.options.map((opt) => opt.optionText || opt);
      }
    }

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

      case "checkbox":
        return (
          <FormGroup>
            {(options || []).map((opt, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    size="small"
                    checked={responseValue.includes(opt)}
                    onChange={(e) =>
                      handleCheckboxChange(
                        questionId,
                        opt,
                        e.target.checked,
                        isSubQuestion,
                      )
                    }
                  />
                }
                label={opt}
              />
            ))}
          </FormGroup>
        );

      case "dropdown":
        return renderUnderlinedDropdown(options, questionId, false);

      case "multiSelect":
        return renderOriginalMultiSelect(options, questionId, false);

      case "multipleText":
        const textFields =
          question.multipleTextFields || question.options || [];
        return renderMultipleTextInputs(textFields, questionId, false);

      case "rating":
        const ratingKey = `${questionId}`;
        const ratingScale = question.ratingScale || 5;
        return renderRatingStars(
          ratingScale,
          ratingValues[ratingKey] || 0,
          (value) =>
            setRatingValues((prev) => ({ ...prev, [ratingKey]: value })),
          false,
        );

      case "text":
        return renderUnderlinedTextInput(questionId, false, false, null);

      case "textarea":
        return renderUnderlinedTextInput(questionId, false, true, null);

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

  return (
    <Paper sx={{ p: 3, mt: 1 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Send Tracer Surveys
      </Typography>

      {/* Parent and Sub Tracer Type Filters */}
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
              onChange={async (e) => {
                const selectedValue = e.target.value;
                await handleParentTracerTypeChange(selectedValue);
              }}
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

      {/* Search Box */}
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

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Data Message */}
      {!loading && selectedParentType && filteredSurveys.length === 0 && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="textSecondary">
            No tracer surveys found for the selected criteria
          </Typography>
        </Box>
      )}

      {/* Table */}
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
                      <Stack                        direction="row"
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

      {/* View Survey Details Dialog */}
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
                  (selectedSurvey.questions || []).map((question, index) => (
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
                          {renderPreviewOptions(question)}
                        </Box>
                      )}
                      {(question.subQuestions || []).length > 0 && (
                        <Box
                          sx={{
                            ml: 2,
                            borderRadius: 1,
                          }}
                        >
                          {(question.subQuestions || []).map((sub, subIndex) => {
                            const subQuestionType =
                              sub.questionType ||
                              getQuestionTypeForId(sub.questionTypeId);
                            const subQuestionWithType = {
                              ...sub,
                              questionType: subQuestionType,
                            };
                            return (
                              <Box key={sub.id} sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                  {index + 1}.{subIndex + 1}{" "}
                                  {sub.questionText ||
                                    "Untitled Sub-question"}
                                  {sub.isRequired === 1 && (
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
                                  {renderPreviewOptions(
                                    subQuestionWithType,
                                    true,
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                      {index < (selectedSurvey.questions || []).length - 1 && (
                        <Divider sx={{ my: 2 }} />
                      )}
                    </Box>
                  ))
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