import { useState } from "react";
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
  Checkbox,
  Box,
  Chip,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  FormHelperText,
} from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";

const SendTracerIndex = () => {
  const [surveys, setSurveys] = useState([
    {
      id: "SUR001",
      applicationNo: "APP2026001",
      tracerType: "Employer Tracer",
      tracerCreatedAt: "2026-03-15",
      status: "Pending",
      questions: [
        {
          id: 1,
          questionText:
            "How satisfied are you with the graduate's performance?",
          questionType: "rating",
          required: true,
          ratingScale: 5,
        },
        {
          id: 2,
          questionText:
            "Which skills does the graduate demonstrate effectively?",
          questionType: "checkbox",
          required: true,
          options: [
            "Technical Skills",
            "Communication",
            "Teamwork",
            "Problem Solving",
            "Leadership",
          ],
        },
        {
          id: 3,
          questionText:
            "Would you recommend hiring more graduates from our institute?",
          questionType: "radio",
          required: true,
          options: ["Yes", "No", "Maybe"],
        },
        {
          id: 4,
          questionText: "Additional comments about the graduate's performance",
          questionType: "textarea",
          required: false,
        },
        {
          id: 5,
          questionText: "Please provide feedback on specific areas",
          questionType: "multipleText",
          required: false,
          multipleTextFields: [
            "Strengths",
            "Areas for Improvement",
            "Additional Training Needed",
          ],
        },
      ],
    },
    {
      id: "SUR002",
      applicationNo: "APP2026002",
      tracerType: "Employer Tracer",
      tracerCreatedAt: "2026-03-18",
      status: "Sent",
      questions: [
        {
          id: 1,
          questionText: "Rate the graduate's technical proficiency",
          questionType: "rating",
          required: true,
          ratingScale: 5,
        },
        {
          id: 2,
          questionText: "Select the technical skills demonstrated",
          questionType: "checkbox",
          required: true,
          options: [
            "Programming",
            "Network Administration",
            "Database Management",
            "Cybersecurity",
            "Cloud Computing",
          ],
        },
        {
          id: 3,
          questionText: "How would you rate their problem-solving ability?",
          questionType: "dropdown",
          required: true,
          options: ["Excellent", "Good", "Average", "Below Average"],
        },
      ],
    },
    {
      id: "SUR003",
      applicationNo: "APP2026003",
      tracerType: "Trainee Tracer",
      tracerCreatedAt: "2026-03-20",
      status: "Draft",
      questions: [
        {
          id: 1,
          questionText:
            "How long did it take for the graduate to become productive?",
          questionType: "radio",
          required: true,
          options: [
            "Less than 1 month",
            "1-3 months",
            "3-6 months",
            "More than 6 months",
          ],
        },
        {
          id: 2,
          questionText:
            "Is the graduate's qualification relevant to their current role?",
          questionType: "radio",
          required: true,
          options: ["Very Relevant", "Somewhat Relevant", "Not Relevant"],
        },
        {
          id: 3,
          questionText: "Additional feedback on graduate performance",
          questionType: "text",
          required: false,
        },
        {
          id: 4,
          questionText: "What is the current employment status?",
          questionType: "dropdown",
          required: true,
          options: [
            "Permanent",
            "Contract",
            "Probation",
            "Internship",
            "Temporary",
          ],
        },
      ],
    },
    {
      id: "SUR004",
      applicationNo: "APP2026004",
      tracerType: "Trainee Tracer",
      tracerCreatedAt: "2026-03-22",
      status: "Pending",
      questions: [
        {
          id: 1,
          questionText: "How would you rate the training program?",
          questionType: "rating",
          required: true,
          ratingScale: 5,
        },
        {
          id: 2,
          questionText: "Which skills did you acquire during training?",
          questionType: "checkbox",
          required: true,
          options: [
            "Customer Service",
            "Communication",
            "Hospitality Management",
            "Food & Beverage",
            "Housekeeping",
          ],
        },
      ],
    },
  ]);

  // Sample trainee data
  const [trainees] = useState([
    {
      id: "TR001",
      name: "Kinley Wangchuk",
      mobileNo: "17123456",
      email: "kinley.w@example.com",
      institute: "Technical Training Institute Thimphu (TTI-T)",
      course: "Diploma in Electrical Engineering",
      graduatedAt: "2025-12-15",
    },
    {
      id: "TR002",
      name: "Tashi Dema",
      mobileNo: "17234567",
      email: "tashi.d@example.com",
      institute: "Technical Training Institute Chumey (TTI-C)",
      course: "Diploma in Civil Engineering",
      graduatedAt: "2025-11-20",
    },
    {
      id: "TR003",
      name: "Sonam Dorji",
      mobileNo: "17345678",
      email: "sonam.d@example.com",
      institute: "Technical Training Institute Samthang (TTI-S)",
      course: "Certificate in Mechanical Engineering",
      graduatedAt: "2025-10-10",
    },
    {
      id: "TR004",
      name: "Pema Yangzom",
      mobileNo: "17456789",
      email: "pema.y@example.com",
      institute: "Technical Training Institute Rangjung (TTI-R)",
      course: "Diploma in Information Technology",
      graduatedAt: "2025-09-05",
    },
    {
      id: "TR005",
      name: "Jigme Namgyel",
      mobileNo: "17567890",
      email: "jigme.n@example.com",
      institute: "Jigme Wangchuck Power Training Institute Dekiling (JWPTI)",
      course: "Certificate in Power Distribution",
      graduatedAt: "2025-08-12",
    },
    {
      id: "TR006",
      name: "Dechen Wangmo",
      mobileNo: "17678901",
      email: "dechen.w@example.com",
      institute: "Royal Institute for Tourism and Hospitality (RITH)",
      course: "Diploma in Hotel Management",
      graduatedAt: "2025-07-18",
    },
    {
      id: "TR007",
      name: "Karma Tshering",
      mobileNo: "17789012",
      email: "karma.t@example.com",
      institute: "Technical Training Institute Thimphu (TTI-T)",
      course: "Diploma in Electronics Engineering",
      graduatedAt: "2025-06-22",
    },
  ]);

  // Sample employer data
  const [employers] = useState([
    {
      id: "EMP001",
      name: "Bhutan Power Corporation",
      contactPerson: "Tshering Dorji",
      mobileNo: "17112233",
      email: "hr@bpc.bt",
      industry: "Energy",
      location: "Thimphu",
    },
    {
      id: "EMP002",
      name: "Bhutan Telecom",
      contactPerson: "Karma Dema",
      mobileNo: "17223344",
      email: "careers@bt.bt",
      industry: "Telecommunications",
      location: "Thimphu",
    },
    {
      id: "EMP003",
      name: "Druk Air Corporation",
      contactPerson: "Sonam Wangdi",
      mobileNo: "17334455",
      email: "hr@drukair.bt",
      industry: "Aviation",
      location: "Paro",
    },
    {
      id: "EMP004",
      name: "Bank of Bhutan",
      contactPerson: "Pema Choden",
      mobileNo: "17445566",
      email: "recruitment@bob.bt",
      industry: "Banking",
      location: "Thimphu",
    },
    {
      id: "EMP005",
      name: "Tashi Group",
      contactPerson: "Jigme Namgyel",
      mobileNo: "17556677",
      email: "hr@tashi.bt",
      industry: "Conglomerate",
      location: "Phuentsholing",
    },
    {
      id: "EMP006",
      name: "Hotel Druk",
      contactPerson: "Dechen Wangmo",
      mobileNo: "17667788",
      email: "careers@hoteldruk.bt",
      industry: "Hospitality",
      location: "Thimphu",
    },
  ]);

  const [tracerType, setTracerType] = useState("");
  const [search, setSearch] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [instituteFilter, setInstituteFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sendError, setSendError] = useState("");

  // Formik validation schema for send action
  const sendValidationSchema = yup.object({
    tracerType: yup
      .string()
      .required("Please select a tracer type from the dropdown"),
  });

  // Formik for send validation
  const formik = useFormik({
    initialValues: {
      tracerType: "",
    },
    validationSchema: sendValidationSchema,
    onSubmit: (values) => {
      // This will be triggered when we validate
    },
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const tracerTypes = ["Employer Tracer", "Trainee Tracer"];

  const institutes = [
    "Technical Training Institute Thimphu (TTI-T)",
    "Technical Training Institute Chumey (TTI-C)",
    "Technical Training Institute Samthang (TTI-S)",
    "Technical Training Institute Rangjung (TTI-R)",
    "Jigme Wangchuck Power Training Institute Dekiling (JWPTI)",
    "Royal Institute for Tourism and Hospitality (RITH)",
  ];

  const industries = [
    "Energy",
    "Telecommunications",
    "Aviation",
    "Banking",
    "Conglomerate",
    "Hospitality",
    "Construction",
    "Education",
    "Healthcare",
    "Information Technology",
    "Manufacturing",
    "Retail",
  ];

  // Filter trainees based on institute
  const filteredTrainees = trainees.filter((trainee) => {
    const matchesInstitute = instituteFilter
      ? trainee.institute === instituteFilter
      : true;
    return matchesInstitute;
  });

  // Filter employers based on industry and search
  const filteredEmployers = employers.filter((employer) => {
    const matchesIndustry = industryFilter
      ? employer.industry === industryFilter
      : true;
    const matchesSearch = search
      ? employer.name.toLowerCase().includes(search.toLowerCase()) ||
        employer.contactPerson.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesIndustry && matchesSearch;
  });

  // Filter surveys based on tracer type and search
  const filteredSurveys = surveys.filter((survey) => {
    const matchesTracerType = tracerType
      ? survey.tracerType === tracerType
      : true;
    const matchesSearch = search
      ? survey.applicationNo.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesTracerType && matchesSearch;
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
  const paginatedSurveys = filteredSurveys.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Handle trainee selection
  const handleSelectAllTrainees = (event) => {
    if (event.target.checked) {
      setSelectedTrainees(filteredTrainees.map((t) => t.id));
    } else {
      setSelectedTrainees([]);
    }
  };

  const handleSelectTrainee = (id) => {
    setSelectedTrainees((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle employer selection
  const handleSelectAllEmployers = (event) => {
    if (event.target.checked) {
      setSelectedEmployers(filteredEmployers.map((e) => e.id));
    } else {
      setSelectedEmployers([]);
    }
  };

  const handleSelectEmployer = (id) => {
    setSelectedEmployers((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Validate before sending
  const validateBeforeSend = () => {
    setSendError("");

    // Update formik values
    formik.setFieldValue("tracerType", tracerType);

    // Trigger validation
    return formik.validateForm().then((errors) => {
      if (Object.keys(errors).length > 0) {
        setSendError(errors.tracerType || "Validation failed");
        return false;
      }
      return true;
    });
  };

  // Handle send to selected survey
  const handleSend = async (surveyId) => {
    const isValid = await validateBeforeSend();
    if (!isValid) return;

    const survey = surveys.find((s) => s.id === surveyId);

    if (survey.tracerType === "Trainee Tracer") {
      // Open trainee selection dialog for Trainee Tracer
      setSelectedSurvey(survey);
      setSelectedSurveyId(surveyId);
      setSelectedTrainees([]);
      setInstituteFilter("");
      setSendDialogOpen(true);
      setSendError("");
    } else if (survey.tracerType === "Employer Tracer") {
      // Open employer selection dialog for Employer Tracer
      setSelectedSurvey(survey);
      setSelectedSurveyId(surveyId);
      setSelectedEmployers([]);
      setIndustryFilter("");
      setSendDialogOpen(true);
      setSendError("");
    }
  };

  const handleSendTraineeTracer = () => {
    // Validate at least one trainee selected
    if (selectedTrainees.length === 0) {
      alert("Please select at least one trainee to send the survey to");
      return;
    }

    const selectedTraineeDetails = trainees.filter((t) =>
      selectedTrainees.includes(t.id),
    );

    // Here you would typically send the survey to each selected trainee
    console.log("Sending trainee survey to:", selectedTraineeDetails);

    // Send the survey
    const updated = surveys.map((survey) => {
      if (survey.id === selectedSurveyId) {
        return { ...survey, status: "Sent" };
      }
      return survey;
    });
    setSurveys(updated);

    // Reset and close
    handleCloseSendDialog();
    setSendError("");
    alert(
      `Trainee Tracer survey sent to ${selectedTrainees.length} trainee(s) successfully!`,
    );
  };

  const handleSendEmployerTracer = () => {
    // Validate at least one employer selected
    if (selectedEmployers.length === 0) {
      alert("Please select at least one employer to send the survey to");
      return;
    }

    const selectedEmployerDetails = employers.filter((e) =>
      selectedEmployers.includes(e.id),
    );

    // Here you would typically send the survey to each selected employer
    console.log("Sending employer survey to:", selectedEmployerDetails);

    // Send the survey
    const updated = surveys.map((survey) => {
      if (survey.id === selectedSurveyId) {
        return { ...survey, status: "Sent" };
      }
      return survey;
    });
    setSurveys(updated);

    // Reset and close
    handleCloseSendDialog();
    setSendError("");
    alert(
      `Employer Tracer survey sent to ${selectedEmployers.length} employer(s) successfully!`,
    );
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
    setSelectedSurvey(null);
    setSelectedSurveyId(null);
    setSelectedTrainees([]);
    setSelectedEmployers([]);
    setInstituteFilter("");
    setIndustryFilter("");
    setSearch("");
  };

  const handleViewSurvey = (survey) => {
    setSelectedSurvey(survey);
    // Initialize form responses for this survey
    const initialResponses = {};
    survey.questions.forEach((question) => {
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

      // Handle sub-questions
      if (question.subQuestions) {
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
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedSurvey(null);
    setFormResponses({});
  };

  const handleResponseChange = (
    questionId,
    value,
    isSubQuestion = false,
    fieldName = null,
  ) => {
    const key = isSubQuestion ? `sub_${questionId}` : `q_${questionId}`;

    if (fieldName) {
      // Handle multiple text fields
      setFormResponses((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [fieldName]: value,
        },
      }));
    } else {
      setFormResponses((prev) => ({
        ...prev,
        [key]: value,
      }));
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

  // Render preview options based on question type (fully interactive)
  const renderPreviewOptions = (question, isSubQuestion = false) => {
    if (!question.questionType) return null;

    const questionId = question.id;
    const responseKey = isSubQuestion ? `sub_${questionId}` : `q_${questionId}`;
    const responseValue =
      formResponses[responseKey] ||
      (question.questionType === "checkbox" ? [] : "");

    switch (question.questionType) {
      case "radio":
        return (
          <RadioGroup
            value={responseValue}
            onChange={(e) =>
              handleResponseChange(questionId, e.target.value, isSubQuestion)
            }
          >
            {(question.options || []).map((opt, idx) => (
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
            {(question.options || []).map((opt, idx) => (
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
        return (
          <FormControl size="small" fullWidth>
            <InputLabel>Select</InputLabel>
            <Select
              label="Select"
              value={responseValue}
              onChange={(e) =>
                handleResponseChange(questionId, e.target.value, isSubQuestion)
              }
            >
              {(question.options || []).map((opt, idx) => (
                <MenuItem key={idx} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "multipleText":
        return (
          <Box>
            {(question.multipleTextFields || []).map((field, idx) => (
              <TextField
                key={idx}
                size="small"
                label={field}
                fullWidth
                value={responseValue[`field_${idx}`] || ""}
                onChange={(e) =>
                  handleResponseChange(
                    questionId,
                    e.target.value,
                    isSubQuestion,
                    `field_${idx}`,
                  )
                }
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        );

      case "rating":
        return (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[...Array(question.ratingScale || 5)].map((_, i) => {
              const ratingValue = i + 1;
              return (
                <Button
                  key={i}
                  variant={
                    responseValue === ratingValue.toString()
                      ? "contained"
                      : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    handleResponseChange(
                      questionId,
                      ratingValue.toString(),
                      isSubQuestion,
                    )
                  }
                  sx={{ minWidth: 40 }}
                >
                  {ratingValue}
                </Button>
              );
            })}
          </Box>
        );

      case "text":
        return (
          <TextField
            size="small"
            placeholder="Text input"
            fullWidth
            value={responseValue}
            onChange={(e) =>
              handleResponseChange(questionId, e.target.value, isSubQuestion)
            }
          />
        );

      case "textarea":
        return (
          <TextField
            multiline
            rows={3}
            size="small"
            placeholder="Text area"
            fullWidth
            value={responseValue}
            onChange={(e) =>
              handleResponseChange(questionId, e.target.value, isSubQuestion)
            }
          />
        );

      case "date":
        return (
          <TextField
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={responseValue}
            onChange={(e) =>
              handleResponseChange(questionId, e.target.value, isSubQuestion)
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 1 }}>
      {/* Header with Tracer Type Dropdown and Search */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item size={{ xs: 12, md: 4 }}>
          <FormControl
            fullWidth
            size="small"
            error={
              formik.touched.tracerType && Boolean(formik.errors.tracerType)
            }
          >
            <InputLabel>Tracer Type</InputLabel>
            <Select
              value={tracerType}
              onChange={(e) => {
                setTracerType(e.target.value);
                formik.setFieldValue("tracerType", e.target.value);
                setSendError("");
              }}
              onBlur={formik.handleBlur}
              label="Tracer Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {tracerTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.tracerType && formik.errors.tracerType && (
              <FormHelperText>{formik.errors.tracerType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Search by Application Number"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search by application number..."
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          {/* Empty grid item for alignment */}
        </Grid>
      </Grid>

      {/* Validation Error Message */}
      {sendError && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error" variant="caption">
            {sendError}
          </Typography>
        </Box>
      )}

      {/* Table */}
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
              <TableCell>Tracer Type</TableCell>
              <TableCell>Tracer Created At</TableCell>
              <TableCell align="center" width={100}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSurveys.length > 0 ? (
              paginatedSurveys.map((survey, index) => {
                return (
                  <TableRow
                    key={survey.id}
                    sx={{
                      "&:hover": { bgcolor: "#fafafa" },
                    }}
                  >
                    <TableCell align="center">
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {survey.applicationNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={survey.tracerType}
                        size="small"
                        color={
                          survey.tracerType === "Employer Tracer"
                            ? "primary"
                            : "secondary"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{survey.tracerCreatedAt}</TableCell>
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
                          onClick={() => handleSend(survey.id)}
                          title="Send Survey"
                        >
                          <IosShareIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No tracer surveys found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredSurveys.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Send Dialog - Dynamic based on tracer type */}
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
            {selectedSurvey?.tracerType === "Trainee Tracer"
              ? "Select Trainees to Send Survey"
              : "Select Employers to Send Survey"}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              {selectedSurvey?.applicationNo} • {selectedSurvey?.tracerType}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseSendDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Dynamic filter based on tracer type */}
          {selectedSurvey?.tracerType === "Trainee Tracer" ? (
            <>
              {/* Institute Filter Dropdown for Trainees */}
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Institute</InputLabel>
                  <Select
                    value={instituteFilter}
                    onChange={(e) => setInstituteFilter(e.target.value)}
                    label="Filter by Institute"
                  >
                    <MenuItem value="">All Institutes</MenuItem>
                    {institutes.map((institute) => (
                      <MenuItem key={institute} value={institute}>
                        {institute}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Selected Trainees Count */}
              {selectedTrainees.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${selectedTrainees.length} trainee(s) selected`}
                    onDelete={() => setSelectedTrainees([])}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}

              {/* Trainees Table */}
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
                      <TableCell padding="checkbox" align="center">
                        <Checkbox
                          checked={
                            filteredTrainees.length > 0 &&
                            selectedTrainees.length === filteredTrainees.length
                          }
                          indeterminate={
                            selectedTrainees.length > 0 &&
                            selectedTrainees.length < filteredTrainees.length
                          }
                          onChange={handleSelectAllTrainees}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" width={40}>
                        #
                      </TableCell>
                      <TableCell>Trainee Name</TableCell>
                      <TableCell>Mobile No</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Institute</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Graduated At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTrainees.length > 0 ? (
                      filteredTrainees.map((trainee, index) => {
                        const isSelected = selectedTrainees.includes(
                          trainee.id,
                        );
                        return (
                          <TableRow
                            key={trainee.id}
                            sx={{
                              "&:hover": { bgcolor: "#fafafa" },
                              bgcolor: isSelected ? "#f0f7ff" : "inherit",
                            }}
                            selected={isSelected}
                          >
                            <TableCell padding="checkbox" align="center">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectTrainee(trainee.id)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">{index + 1}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {trainee.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{trainee.mobileNo}</TableCell>
                            <TableCell>{trainee.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={trainee.institute.split("(")[0].trim()}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell>{trainee.course}</TableCell>
                            <TableCell>{trainee.graduatedAt}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                          <Typography color="textSecondary">
                            No trainees found for the selected institute
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <>
              {/* Industry Filter Dropdown for Employers */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Filter by Sector</InputLabel>
                      <Select
                        value={industryFilter}
                        onChange={(e) => setIndustryFilter(e.target.value)}
                        label="Filter by Industry"
                      >
                        <MenuItem value="">All Industries</MenuItem>
                        {industries.map((industry) => (
                          <MenuItem key={industry} value={industry}>
                            {industry}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search by Employer Name or Contact Person"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Selected Employers Count */}
              {selectedEmployers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${selectedEmployers.length} employer(s) selected`}
                    onDelete={() => setSelectedEmployers([])}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}

              {/* Employers Table */}
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
                      <TableCell padding="checkbox" align="center">
                        <Checkbox
                          checked={
                            filteredEmployers.length > 0 &&
                            selectedEmployers.length ===
                              filteredEmployers.length
                          }
                          indeterminate={
                            selectedEmployers.length > 0 &&
                            selectedEmployers.length < filteredEmployers.length
                          }
                          onChange={handleSelectAllEmployers}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" width={40}>
                        #
                      </TableCell>
                      <TableCell>Employer Name</TableCell>
                      <TableCell>Contact Person</TableCell>
                      <TableCell>Mobile No</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Sector</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployers.length > 0 ? (
                      filteredEmployers.map((employer, index) => {
                        const isSelected = selectedEmployers.includes(
                          employer.id,
                        );
                        return (
                          <TableRow
                            key={employer.id}
                            sx={{
                              "&:hover": { bgcolor: "#fafafa" },
                              bgcolor: isSelected ? "#f0f7ff" : "inherit",
                            }}
                            selected={isSelected}
                          >
                            <TableCell padding="checkbox" align="center">
                              <Checkbox
                                checked={isSelected}
                                onChange={() =>
                                  handleSelectEmployer(employer.id)
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">{index + 1}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {employer.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{employer.contactPerson}</TableCell>
                            <TableCell>{employer.mobileNo}</TableCell>
                            <TableCell>{employer.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={employer.industry}
                                size="small"
                                variant="outlined"
                                color="info"
                              />
                            </TableCell>
                            <TableCell>{employer.location}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                          <Typography color="textSecondary">
                            No employers found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
          <Button
            onClick={handleCloseSendDialog}
            color="error"
            size="small"
            variant="contained"
          >
            Cancel
          </Button>
          <Button
            onClick={
              selectedSurvey?.tracerType === "Trainee Tracer"
                ? handleSendTraineeTracer
                : handleSendEmployerTracer
            }
            variant="contained"
            color="success"
            size="small"
            startIcon={<IosShareIcon />}
            disabled={
              (selectedSurvey?.tracerType === "Trainee Tracer" &&
                selectedTrainees.length === 0) ||
              (selectedSurvey?.tracerType === "Employer Tracer" &&
                selectedEmployers.length === 0)
            }
          >
            Send to{" "}
            {selectedSurvey?.tracerType === "Trainee Tracer"
              ? selectedTrainees.length > 0
                ? `(${selectedTrainees.length})`
                : ""
              : selectedEmployers.length > 0
                ? `(${selectedEmployers.length})`
                : ""}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Survey Details Dialog */}
      <Dialog
        open={viewOpen}
        onClose={handleCloseView}
        maxWidth="lg"
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
              {selectedSurvey?.tracerType} • {selectedSurvey?.applicationNo}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseView} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedSurvey && (
            <Box>
              {/* Survey Questions Section - Fully interactive */}
              {selectedSurvey.questions &&
              selectedSurvey.questions.length > 0 ? (
                <Box>
                  {selectedSurvey.questions.map((question, index) => (
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

                      {/* Preview based on question type */}
                      {question.questionType && (
                        <Box sx={{ ml: 2, mt: 1, mb: 2 }}>
                          {renderPreviewOptions(question)}
                        </Box>
                      )}

                      {/* Sub-questions preview if any */}
                      {question.subQuestions &&
                        question.subQuestions.length > 0 && (
                          <Box
                            sx={{
                              ml: 3,
                              mt: 2,
                              p: 2,
                              bgcolor: "#f9f9f9",
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              color="textSecondary"
                            >
                              Sub-questions:
                            </Typography>
                            {question.subQuestions.map((sub, subIndex) => (
                              <Box key={sub.id} sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                  {index + 1}.{subIndex + 1}{" "}
                                  {sub.questionText || "Untitled Sub-question"}
                                  {sub.required && (
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

                                {sub.questionType && (
                                  <Box sx={{ ml: 2, mt: 1 }}>
                                    {renderPreviewOptions(sub, true)}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}

                      {index < selectedSurvey.questions.length - 1 && (
                        <Divider sx={{ my: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No questions have been added to this survey yet.
                </Typography>
              )}
            </Box>
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
