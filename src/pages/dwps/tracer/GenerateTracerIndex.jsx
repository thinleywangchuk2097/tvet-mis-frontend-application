import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  PlaylistAdd as PlaylistAddIcon,
} from "@mui/icons-material";
import LockResetIcon from "@mui/icons-material/LockReset";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import GenerateTracerService from "../../../api/services/internal/tracer/GenerateTracerService";
import CommonService from "../../../api/services/internal/common/CommonService";

/* ============================================================
   CONSTANTS  (fixes S1192 - duplicate string literals)
   ============================================================ */
const STR = {
  SELECT_QUESTION_TYPE: "-- Select Question Type --",
  TYPE_ANSWER_HERE: "Type your answer here...",
  ALWAYS_SHOW: "Always Show",
  UNTITLED_QUESTION: "Untitled Question",
  UNTITLED_SUBQUESTION: "Untitled Sub-question",
  SELECT_OPTIONS: "Select Options",
  SELECT_AN_OPTION: "Select an option",
  SHOW_WHEN: "Show when:",
  DEPENDS_ON: "Depends on",
  NONE: "None",
  OPTION_REQUIRED: "Option is required",
  FIELD_REQUIRED: "Field label is required",
  QUESTION_TEXT_REQUIRED: "Question text is required",
  QUESTION_TYPE_REQUIRED: "Question type is required",
  SUB_QUESTION_TEXT_REQUIRED: "Sub-question text is required",
  SUB_QUESTION_TYPE_REQUIRED: "Sub-question type is required",
  RATING_SCALE_REQUIRED: "Rating scale is required",
  TRACER_TITLE_REQUIRED: "Tracer title is required",
  PARENT_TRACER_REQUIRED: "Parent tracer type is required",
  SUB_TRACER_REQUIRED: "Sub tracer type is required",
  AT_LEAST_ONE_OPTION: "At least one option is required",
  AT_LEAST_ONE_FIELD: "At least one field is required",
  SHOW_CONDITION: "Show/Hide Condition",
  SHOW_CONDITION_CUSTOM: "Show/Hide Condition (Custom)",
  SHOW_CONDITION_ALWAYS: "Show/Hide Condition (Always Show)",
  NO_LIMIT: "No limit",
};

const QUESTION_TYPE_VALUES = {
  RADIO: "radio",
  CHECKBOX: "checkbox",
  DROPDOWN: "dropdown",
  MULTI_SELECT: "multiSelect",
  MULTIPLE_TEXT: "multipleText",
  RATING: "rating",
  TEXT: "text",
  TEXTAREA: "textarea",
  DATE: "date",
};

const OPTION_BASED_TYPES = [
  QUESTION_TYPE_VALUES.RADIO,
  QUESTION_TYPE_VALUES.CHECKBOX,
  QUESTION_TYPE_VALUES.DROPDOWN,
  QUESTION_TYPE_VALUES.MULTI_SELECT,
];

const MULTI_CHOICE_TYPES = [
  QUESTION_TYPE_VALUES.CHECKBOX,
  QUESTION_TYPE_VALUES.MULTI_SELECT,
];

const MAX_SELECTION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/* ============================================================
   PURE HELPERS  (moved outside component - fixes S6478/S3776)
   ============================================================ */
const createEmptyQuestion = (clientId) => ({
  clientId,
  questionText: "",
  questionTypeId: "",
  required: false,
  showCondition: "always",
  dependsOnClientId: null,
  showWhenOption: "",
  subQuestions: [],
  options: [""],
  multipleTextFields: [""],
  ratingScale: 5,
  maxSelections: 0,
});

const createEmptySubQuestion = (clientId) => ({
  clientId,
  questionText: "",
  questionTypeId: "",
  required: false,
  showCondition: "always",
  dependsOnClientId: null,
  showWhenOption: "",
  options: [""],
  multipleTextFields: [""],
  ratingScale: 5,
  maxSelections: 0,
});

const parseShowWhenOptions = (showWhenOption) => {
  if (!showWhenOption) return [];
  if (Array.isArray(showWhenOption)) return showWhenOption;
  return String(showWhenOption)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
};

const getQuestionType = (types, typeId) =>
  types.find((t) => t.id === typeId) || null;

const getQuestionTypeValue = (types, typeId) =>
  getQuestionType(types, typeId)?.value ?? null;

const getQuestionTypeLabel = (types, typeId) =>
  getQuestionType(types, typeId)?.label ?? null;

const requiresOptions = (types, typeId) =>
  OPTION_BASED_TYPES.includes(getQuestionTypeValue(types, typeId));

const isMultipleText = (types, typeId) =>
  getQuestionTypeValue(types, typeId) === QUESTION_TYPE_VALUES.MULTIPLE_TEXT;

const isRating = (types, typeId) =>
  getQuestionTypeValue(types, typeId) === QUESTION_TYPE_VALUES.RATING;

const isMultiChoiceType = (types, typeId) =>
  MULTI_CHOICE_TYPES.includes(getQuestionTypeValue(types, typeId));

const isEligibleConditionSource = (types, typeId) =>
  OPTION_BASED_TYPES.includes(getQuestionTypeValue(types, typeId));

const isSubQuestionArg = (isSub) => (isSub ? "subQuestions" : "questions");

/* ============================================================
   VALIDATION SCHEMA BUILDER
   ============================================================ */
const buildSubQuestionSchema = (types) =>
  Yup.object().shape({
    clientId: Yup.string().required(),
    questionText: Yup.string().required(STR.SUB_QUESTION_TEXT_REQUIRED),
    questionTypeId: Yup.string().required(STR.SUB_QUESTION_TYPE_REQUIRED),
    required: Yup.boolean(),
    showCondition: Yup.string(),
    dependsOnClientId: Yup.string().when("showCondition", {
      is: (val) => val && val !== "always",
      then: (schema) =>
        schema.required("Please select a question to depend on"),
      otherwise: (schema) => schema.notRequired(),
    }),
    showWhenOption: Yup.string().when("showCondition", {
      is: (val) => val === "option",
      then: (schema) => schema.required("Please select at least one option"),
      otherwise: (schema) => schema.notRequired(),
    }),
    options: Yup.array().when("questionTypeId", {
      is: (val) => val && requiresOptions(types, val),
      then: (schema) =>
        schema
          .of(Yup.string().required(STR.OPTION_REQUIRED))
          .min(1, STR.AT_LEAST_ONE_OPTION),
    }),
    multipleTextFields: Yup.array().when("questionTypeId", {
      is: (val) => val && isMultipleText(types, val),
      then: (schema) =>
        schema
          .of(Yup.string().required(STR.FIELD_REQUIRED))
          .min(1, STR.AT_LEAST_ONE_FIELD),
    }),
    ratingScale: Yup.number().when("questionTypeId", {
      is: (val) => val && isRating(types, val),
      then: (schema) => schema.required(STR.RATING_SCALE_REQUIRED),
    }),
  });

const buildValidationSchema = (types) =>
  Yup.object({
    tracerTitle: Yup.string().required(STR.TRACER_TITLE_REQUIRED),
    parentTracerTypeId: Yup.string().required(STR.PARENT_TRACER_REQUIRED),
    subTracerTypeId: Yup.string().when("parentTracerTypeId", {
      is: (val) => val && val !== "",
      then: (schema) => schema.required(STR.SUB_TRACER_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
    questions: Yup.array().of(
      Yup.object().shape({
        clientId: Yup.string().required(),
        questionText: Yup.string().required(STR.QUESTION_TEXT_REQUIRED),
        questionTypeId: Yup.string().when("subQuestions", {
          is: (subQuestions) => subQuestions && subQuestions.length > 0,
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.required(STR.QUESTION_TYPE_REQUIRED),
        }),
        required: Yup.boolean(),
        showCondition: Yup.string(),
        dependsOnClientId: Yup.string().when("showCondition", {
          is: (val) => val && val !== "always",
          then: (schema) =>
            schema.required("Please select a question to depend on"),
          otherwise: (schema) => schema.notRequired(),
        }),
        showWhenOption: Yup.string().when("showCondition", {
          is: (val) => val === "option",
          then: (schema) =>
            schema.required("Please select at least one option"),
          otherwise: (schema) => schema.notRequired(),
        }),
        options: Yup.array().when("questionTypeId", {
          is: (val) => val && requiresOptions(types, val),
          then: (schema) =>
            schema
              .of(Yup.string().required(STR.OPTION_REQUIRED))
              .min(1, STR.AT_LEAST_ONE_OPTION),
        }),
        multipleTextFields: Yup.array().when("questionTypeId", {
          is: (val) => val && isMultipleText(types, val),
          then: (schema) =>
            schema
              .of(Yup.string().required(STR.FIELD_REQUIRED))
              .min(1, STR.AT_LEAST_ONE_FIELD),
        }),
        ratingScale: Yup.number().when("questionTypeId", {
          is: (val) => val && isRating(types, val),
          then: (schema) => schema.required(STR.RATING_SCALE_REQUIRED),
        }),
        subQuestions: Yup.array().of(buildSubQuestionSchema(types)),
      }),
    ),
  });

/* ============================================================
   SMALL REUSABLE SUB-COMPONENTS
   ============================================================ */
const SectionTitle = ({ children }) => (
  <Typography variant="subtitle2" gutterBottom>
    {children}
  </Typography>
);

const DeleteRowButton = ({ onClick, disabled, ariaLabel }) => (
  <IconButton
    size="small"
    color="error"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
  >
    <DeleteIcon />
  </IconButton>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
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
  const [visibleQuestions, setVisibleQuestions] = useState({});

  const access_token = useSelector((state) => state.auth.accessToken);
  const clientIdRef = useRef(1);

  const nextClientId = useCallback(() => `q-${clientIdRef.current++}`, []);

  /* ---------------- API CALLS ---------------- */
  const fetchTracerQuestionDropdownType = useCallback(async () => {
    try {
      const response =
        await GenerateTracerService.getTracerQuestionDropdownType(access_token);
      setTracerQuestionDropdownType(response.data);
    } catch {
      toast.error("Failed to load question types");
    }
  }, [access_token]);

  const fetchParentTracerTypes = useCallback(async () => {
    try {
      const response =
        await GenerateTracerService.getParentTracerTypes(access_token);
      setParentTracerTypes(response.data);
    } catch {
      toast.error("Failed to load parent tracer types");
    }
  }, [access_token]);

  const fetchSubTracerTypes = useCallback(async (parentId) => {
    if (!parentId) {
      setSubTracerTypes([]);
      return;
    }
    setIsLoadingSubTypes(true);
    try {
      const response = await CommonService.getByParentId(parentId);
      setSubTracerTypes(response.data);
    } catch {
      setSubTracerTypes([]);
      toast.error("Failed to load sub tracer types");
    } finally {
      setIsLoadingSubTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchTracerQuestionDropdownType();
    fetchParentTracerTypes();
  }, [fetchTracerQuestionDropdownType, fetchParentTracerTypes]);

  /* ---------------- FORM ---------------- */
  const validationSchema = useMemo(
    () => buildValidationSchema(tracerQuestionDropdownType),
    [tracerQuestionDropdownType],
  );

  const formik = useFormik({
    initialValues: {
      tracerTitle: "",
      parentTracerTypeId: "",
      subTracerTypeId: "",
      questions: [createEmptyQuestion(nextClientId())],
    },
    validationSchema,
    enableReinitialize: false,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const submissionData = {
          tracerTitle: values.tracerTitle,
          parentTracerTypeId: values.parentTracerTypeId,
          subTracerTypeId: values.subTracerTypeId,
          questions: values.questions.map((q, index) =>
            buildSubmissionQuestion(q, index, tracerQuestionDropdownType),
          ),
        };

        const response = await GenerateTracerService.saveTracerQuestions(
          submissionData,
          access_token,
        );

        if (response.status === 200 || response.status === 201) {
          const { applicationNo, message, success } = response.data;
          if (success && applicationNo) {
            toast.success(`${message}\nApplication Number: ${applicationNo}`);
          } else {
            toast.success(message || "Questions saved successfully!");
          }
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch {
        toast.error("Failed to save questions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  const { values, setFieldValue } = formik;

  /* ---------------- PARENT TRACER HANDLER ---------------- */
  const handleParentTracerTypeChange = useCallback(
    async (selectedParentId) => {
      await setFieldValue("subTracerTypeId", "");
      await fetchSubTracerTypes(selectedParentId);
    },
    [setFieldValue, fetchSubTracerTypes],
  );

  /* ---------------- FLATTENED QUESTIONS ---------------- */
  const flatWithLabels = useMemo(() => {
    const allFlat = [];
    values.questions.forEach((q, qi) => {
      allFlat.push({
        clientId: q.clientId,
        label: `Q${qi + 1}`,
        questionText: q.questionText,
        data: q,
      });
      (q.subQuestions || []).forEach((sub, si) => {
        allFlat.push({
          clientId: sub.clientId,
          label: `Q${qi + 1}.${si + 1}`,
          questionText: sub.questionText,
          data: sub,
        });
      });
    });
    return allFlat;
  }, [values.questions]);

  const getLabelForClientId = useCallback(
    (clientId) =>
      flatWithLabels.find((x) => x.clientId === clientId)?.label || "Q?",
    [flatWithLabels],
  );

  /* ---------------- PREVIOUS ELIGIBLE QUESTIONS ---------------- */
  const getPreviousEligibleQuestions = useCallback(
    (currentClientId) => {
      const flat = [];
      values.questions.forEach((q, qi) => {
        flat.push({ ...q, __order: qi * 1000, __parentClientId: null });
        (q.subQuestions || []).forEach((sub, si) => {
          flat.push({
            ...sub,
            __order: qi * 1000 + si + 1,
            __parentClientId: q.clientId,
          });
        });
      });

      const currentIndex = flat.findIndex(
        (q) => q.clientId === currentClientId,
      );
      if (currentIndex === -1) return [];

      const current = flat[currentIndex];

      return flat.filter((q, index) => {
        if (q.clientId === currentClientId) return false;
        if (index >= currentIndex) return false;
        if (
          current.__parentClientId &&
          q.__parentClientId === current.__parentClientId
        ) {
          return false;
        }
        const eligible = isEligibleConditionSource(
          tracerQuestionDropdownType,
          q.questionTypeId,
        );
        return (
          eligible &&
          q.options &&
          q.options.some((opt) => opt && opt.trim() !== "")
        );
      });
    },
    [values.questions, tracerQuestionDropdownType],
  );

  /* ---------------- VISIBILITY ---------------- */
  const isQuestionVisible = useCallback(
    (question, allFlat, selectedValues) => {
      if (question.showCondition === "always") return true;
      if (question.showCondition !== "option" || !question.dependsOnClientId) {
        return true;
      }

      const dependsOnQuestion = allFlat.find(
        (q) => q.clientId === question.dependsOnClientId,
      );
      if (!dependsOnQuestion) return false;

      const parentTypeValue = getQuestionTypeValue(
        tracerQuestionDropdownType,
        dependsOnQuestion.questionTypeId,
      );
      const selectedValue = selectedValues[dependsOnQuestion.clientId];
      const triggerOptions = parseShowWhenOptions(question.showWhenOption);

      if (triggerOptions.length === 0) return false;

      if (MULTI_CHOICE_TYPES.includes(parentTypeValue)) {
        const selectedArr = Array.isArray(selectedValue)
          ? selectedValue
          : selectedValue
            ? [selectedValue]
            : [];
        if (selectedArr.length === 0) return false;
        return triggerOptions.some((opt) => selectedArr.includes(opt));
      }

      if (!selectedValue) return false;
      return triggerOptions.includes(selectedValue);
    },
    [tracerQuestionDropdownType],
  );

  useEffect(() => {
    const updateVisibility = () => {
      const visibility = {};
      const allFlat = [];
      values.questions.forEach((q) => {
        allFlat.push(q);
        (q.subQuestions || []).forEach((sub) => allFlat.push(sub));
      });

      const selectedValues = {
        ...dropdownValues,
        ...multiSelectValues,
        ...textInputValues,
      };

      allFlat.forEach((q) => {
        visibility[q.clientId] = isQuestionVisible(q, allFlat, selectedValues);
      });

      setVisibleQuestions(visibility);
    };

    updateVisibility();
  }, [
    values.questions,
    dropdownValues,
    multiSelectValues,
    textInputValues,
    isQuestionVisible,
  ]);

  /* ---------------- QUESTION CRUD ---------------- */
  const updateQuestion = useCallback(
    (clientId, field, value) => {
      const updated = values.questions.map((q) => {
        if (q.clientId !== clientId) return q;
        if (field === "dependsOnClientId") {
          return { ...q, [field]: value, showWhenOption: "" };
        }
        return { ...q, [field]: value };
      });
      setFieldValue("questions", updated);
    },
    [values.questions, setFieldValue],
  );

  const addQuestion = useCallback(() => {
    const newQuestion = createEmptyQuestion(nextClientId());
    setFieldValue("questions", [...values.questions, newQuestion]);
    setActiveTab(values.questions.length);
  }, [values.questions, setFieldValue, nextClientId]);

  const deleteQuestion = useCallback(
    (clientId) => {
      const newQuestions = values.questions.filter(
        (q) => q.clientId !== clientId,
      );
      setFieldValue("questions", newQuestions);
      if (activeTab >= newQuestions.length) {
        setActiveTab(Math.max(0, newQuestions.length - 1));
      }
    },
    [values.questions, setFieldValue, activeTab],
  );

  /* ---------------- OPTIONS CRUD ---------------- */
  const mutateOptions = useCallback(
    (clientId, isSub, subId, mutateFn) => {
      const updated = values.questions.map((q) => {
        if (!isSub && q.clientId === clientId) {
          return { ...q, options: mutateFn(q.options || [""]) };
        }
        if (isSub && q.clientId === clientId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map((sub) =>
              sub.clientId === subId
                ? { ...sub, options: mutateFn(sub.options || [""]) }
                : sub,
            ),
          };
        }
        return q;
      });
      setFieldValue("questions", updated);
    },
    [values.questions, setFieldValue],
  );

  const addOption = useCallback(
    (clientId, isSub = false, subId = null) =>
      mutateOptions(clientId, isSub, subId, (opts) => [...opts, ""]),
    [mutateOptions],
  );

  const updateOption = useCallback(
    (clientId, index, value, isSub = false, subId = null) =>
      mutateOptions(clientId, isSub, subId, (opts) => {
        const next = [...opts];
        next[index] = value;
        return next;
      }),
    [mutateOptions],
  );

  const deleteOption = useCallback(
    (clientId, index, isSub = false, subId = null) =>
      mutateOptions(clientId, isSub, subId, (opts) => {
        const next = opts.filter((_, i) => i !== index);
        return next.length ? next : [""];
      }),
    [mutateOptions],
  );

  /* ---------------- MULTIPLE TEXT FIELDS CRUD ---------------- */
  const mutateMultipleTextFields = useCallback(
    (clientId, isSub, subId, mutateFn) => {
      const updated = values.questions.map((q) => {
        if (!isSub && q.clientId === clientId) {
          return {
            ...q,
            multipleTextFields: mutateFn(q.multipleTextFields || [""]),
          };
        }
        if (isSub && q.clientId === clientId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map((sub) =>
              sub.clientId === subId
                ? {
                    ...sub,
                    multipleTextFields: mutateFn(
                      sub.multipleTextFields || [""],
                    ),
                  }
                : sub,
            ),
          };
        }
        return q;
      });
      setFieldValue("questions", updated);
    },
    [values.questions, setFieldValue],
  );

  const addMultipleTextField = useCallback(
    (clientId, isSub = false, subId = null) =>
      mutateMultipleTextFields(clientId, isSub, subId, (fields) => [
        ...fields,
        "",
      ]),
    [mutateMultipleTextFields],
  );

  const updateMultipleTextField = useCallback(
    (clientId, index, value, isSub = false, subId = null) =>
      mutateMultipleTextFields(clientId, isSub, subId, (fields) => {
        const next = [...fields];
        next[index] = value;
        return next;
      }),
    [mutateMultipleTextFields],
  );

  const deleteMultipleTextField = useCallback(
    (clientId, index, isSub = false, subId = null) =>
      mutateMultipleTextFields(clientId, isSub, subId, (fields) => {
        const next = fields.filter((_, i) => i !== index);
        return next.length ? next : [""];
      }),
    [mutateMultipleTextFields],
  );

  /* ---------------- SUB-QUESTION CRUD ---------------- */
  const addSubQuestion = useCallback(
    (parentClientId) => {
      const updated = values.questions.map((q) =>
        q.clientId === parentClientId
          ? {
              ...q,
              subQuestions: [
                ...q.subQuestions,
                createEmptySubQuestion(nextClientId()),
              ],
            }
          : q,
      );
      setFieldValue("questions", updated);
    },
    [values.questions, setFieldValue, nextClientId],
  );

  const updateSubQuestion = useCallback(
    (parentClientId, subClientId, field, value) => {
      const updated = values.questions.map((q) => {
        if (q.clientId !== parentClientId) return q;
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.clientId !== subClientId) return sub;
            if (field === "dependsOnClientId") {
              return { ...sub, [field]: value, showWhenOption: "" };
            }
            return { ...sub, [field]: value };
          }),
        };
      });
      setFieldValue("questions", updated);
    },
    [values.questions, setFieldValue],
  );

  const deleteSubQuestion = useCallback(
    (parentClientId, subClientId) => {
      const updated = values.questions.map((q) =>
        q.clientId === parentClientId
          ? {
              ...q,
              subQuestions: q.subQuestions.filter(
                (sub) => sub.clientId !== subClientId,
              ),
            }
          : q,
      );
      setFieldValue("questions", updated);
    },
    [values.questions, setFieldValue],
  );

  /* ---------------- DRAG & DROP ---------------- */
  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();
      if (draggedItem === null) return;

      const newQuestions = [...values.questions];
      const draggedQuestion = newQuestions[draggedItem];
      newQuestions.splice(draggedItem, 1);
      newQuestions.splice(dropIndex, 0, draggedQuestion);
      setFieldValue("questions", newQuestions);

      setActiveTab((prev) => {
        if (prev === draggedItem) return dropIndex;
        if (prev > draggedItem && prev <= dropIndex) return prev - 1;
        if (prev < draggedItem && prev >= dropIndex) return prev + 1;
        return prev;
      });
      setDraggedItem(null);
    },
    [draggedItem, values.questions, setFieldValue],
  );

  /* ---------------- RESET ---------------- */
  const handleReset = useCallback(() => {
    formik.resetForm();
    setActiveTab(0);
    setRatingValues({});
    setMultiSelectValues({});
    setTextInputValues({});
    setTextAreaValues({});
    setMultipleTextValues({});
    setDropdownValues({});
    setSubTracerTypes([]);
    setVisibleQuestions({});
    clientIdRef.current = 1;
    toast.info("Form has been reset");
  }, [formik]);

  /* ---------------- ERROR COUNT ---------------- */
  const getQuestionErrorCount = useCallback(
    (question, index) => {
      let count = 0;
      const touched = formik.touched.questions?.[index];
      const errors = formik.errors.questions?.[index];

      if (touched?.questionText && errors?.questionText) count++;
      if (
        touched?.questionTypeId &&
        errors?.questionTypeId &&
        !(question.subQuestions?.length > 0)
      ) {
        count++;
      }
      if (errors?.options && question.options?.some((opt) => !opt)) count++;
      if (
        errors?.multipleTextFields &&
        question.multipleTextFields?.some((field) => !field)
      ) {
        count++;
      }
      if (question.showCondition !== "always") {
        if (!question.dependsOnClientId) count++;
        if (question.showCondition === "option" && !question.showWhenOption)
          count++;
      }
      return count;
    },
    [formik.touched.questions, formik.errors.questions],
  );

  /* ============================================================
     RENDER HELPERS (kept as closures for readability)
     ============================================================ */
  const renderRatingStars = useCallback(
    (scale, value, onChange, disabled = false) => (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
      >
        <Rating
          name="tracer-rating-preview"
          value={value || 0}
          precision={1}
          max={scale}
          onChange={(_, newValue) => onChange?.(newValue)}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={<StarIcon fontSize="inherit" />}
          disabled={disabled}
          sx={{
            "& .MuiRating-iconFilled": { color: "#1976d2" },
            "& .MuiRating-iconHover": { color: "#1976d2" },
          }}
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {Array.from({ length: scale }, (_, i) => (
            <Button
              key={`rating-btn-${i + 1}`}
              variant={value === i + 1 ? "contained" : "outlined"}
              size="small"
              onClick={() => onChange?.(i + 1)}
              disabled={disabled}
              aria-label={`Rate ${i + 1}`}
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
    ),
    [],
  );

  const renderUnderlinedDropdown = useCallback(
    (options, questionId, disabled = false) => {
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
            {STR.SELECT_AN_OPTION}
          </InputLabel>
          <Select
            labelId={`dropdown-label-${questionId}`}
            value={value}
            onChange={handleChange}
            label={STR.SELECT_AN_OPTION}
            sx={{
              "&:before": { borderBottomColor: "#1976d2" },
              "&:hover:before": { borderBottomColor: "#1976d2" },
              "&:after": { borderBottomColor: "#1976d2" },
            }}
          >
            <MenuItem value="">
              <em>{STR.NONE}</em>
            </MenuItem>
            {options
              .filter((opt) => opt.trim() !== "")
              .map((option) => (
                <MenuItem key={`opt-${questionId}-${option}`} value={option}>
                  {option}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      );
    },
    [dropdownValues],
  );

  const renderOriginalMultiSelect = useCallback(
    (options, questionId, disabled = false, maxSelections = 0) => {
      const selectedValues = multiSelectValues[questionId] || [];
      const limitReached =
        maxSelections > 0 && selectedValues.length >= maxSelections;

      const handleChange = (event) => {
        let value = event.target.value;
        value = typeof value === "string" ? value.split(",") : value;
        if (maxSelections > 0 && value.length > maxSelections) {
          value = value.slice(0, maxSelections);
        }
        setMultiSelectValues((prev) => ({ ...prev, [questionId]: value }));
      };

      return (
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>{STR.SELECT_OPTIONS}</InputLabel>
          <Select
            multiple
            value={selectedValues}
            onChange={handleChange}
            input={<OutlinedInput label={STR.SELECT_OPTIONS} />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={`chip-${questionId}-${value}`}
                    label={value}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {options
              .filter((opt) => opt.trim() !== "")
              .map((option) => {
                const isSelected = selectedValues.indexOf(option) > -1;
                const optionDisabled = limitReached && !isSelected;
                return (
                  <MenuItem
                    key={`ms-${questionId}-${option}`}
                    value={option}
                    disabled={optionDisabled}
                  >
                    <Checkbox checked={isSelected} />
                    <ListItemText primary={option} />
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
    },
    [multiSelectValues],
  );

  const renderUnderlinedTextInput = useCallback(
    (questionId, disabled = false, isTextArea = false, fieldLabel = null) => {
      const value = isTextArea
        ? textAreaValues[questionId] || ""
        : textInputValues[questionId] || "";

      const handleChange = (e) => {
        const setter = isTextArea ? setTextAreaValues : setTextInputValues;
        setter((prev) => ({ ...prev, [questionId]: e.target.value }));
      };

      const underlineSx = {
        "&:before": { borderBottomColor: "#1976d2" },
        "&:hover:before": { borderBottomColor: "#1976d2" },
        "&:after": { borderBottomColor: "#1976d2" },
      };

      if (isTextArea) {
        return (
          <TextField
            fullWidth
            variant="standard"
            placeholder={fieldLabel || STR.TYPE_ANSWER_HERE}
            value={value}
            onChange={handleChange}
            multiline
            rows={3}
            disabled={disabled}
            InputProps={{ disableUnderline: false, sx: underlineSx }}
          />
        );
      }

      return (
        <Input
          fullWidth
          placeholder={fieldLabel || STR.TYPE_ANSWER_HERE}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          disableUnderline={false}
          sx={underlineSx}
        />
      );
    },
    [textAreaValues, textInputValues],
  );

  const renderMultipleTextInputs = useCallback(
    (fields, questionId, disabled = false) => {
      const handleFieldChange = (fieldIndex, value) => {
        setMultipleTextValues((prev) => ({
          ...prev,
          [questionId]: { ...(prev[questionId] || {}), [fieldIndex]: value },
        }));
      };

      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {fields
            .filter((field) => field.trim() !== "")
            .map((field, idx) => (
              <Box key={`mt-${questionId}-${idx}-${field}`}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
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
                    "&:before": { borderBottomColor: "#1976d2" },
                    "&:hover:before": { borderBottomColor: "#1976d2" },
                    "&:after": { borderBottomColor: "#1976d2" },
                  }}
                />
              </Box>
            ))}
        </Box>
      );
    },
    [multipleTextValues],
  );

  /* ============================================================
     OPTIONS RENDERER
     ============================================================ */
  const renderOptions = useCallback(
    (
      question,
      isSubQuestion = false,
      parentClientId = null,
      subClientId = null,
    ) => {
      const questionTypeValue = getQuestionTypeValue(
        tracerQuestionDropdownType,
        question.questionTypeId,
      );
      const showMaxSelections = MULTI_CHOICE_TYPES.includes(questionTypeValue);

      const targetClientId = isSubQuestion ? parentClientId : question.clientId;

      if (
        [
          QUESTION_TYPE_VALUES.RADIO,
          QUESTION_TYPE_VALUES.CHECKBOX,
          QUESTION_TYPE_VALUES.DROPDOWN,
          QUESTION_TYPE_VALUES.MULTI_SELECT,
        ].includes(questionTypeValue)
      ) {
        return (
          <Box sx={{ mt: 2 }}>
            <SectionTitle>Options:</SectionTitle>
            {(question.options || [""]).map((option, index) => (
              <Box
                key={`opt-row-${question.clientId}-${index}`}
                sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}
              >
                <TextField
                  size="small"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) =>
                    updateOption(
                      targetClientId,
                      index,
                      e.target.value,
                      isSubQuestion,
                      subClientId,
                    )
                  }
                  fullWidth
                  error={!option && formik.submitCount > 0}
                  helperText={
                    !option && formik.submitCount > 0 ? STR.OPTION_REQUIRED : ""
                  }
                />
                <DeleteRowButton
                  ariaLabel={`Delete option ${index + 1}`}
                  onClick={() =>
                    deleteOption(
                      targetClientId,
                      index,
                      isSubQuestion,
                      subClientId,
                    )
                  }
                  disabled={(question.options || [""]).length === 1}
                />
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                addOption(targetClientId, isSubQuestion, subClientId)
              }
              sx={{ mt: 1 }}
            >
              Add Option
            </Button>

            {showMaxSelections && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 1,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <SectionTitle>Selection Limit</SectionTitle>
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel>Max selections allowed</InputLabel>
                  <Select
                    value={question.maxSelections || 0}
                    label="Max selections allowed"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isSubQuestion) {
                        updateSubQuestion(
                          parentClientId,
                          subClientId,
                          "maxSelections",
                          value,
                        );
                      } else {
                        updateQuestion(
                          question.clientId,
                          "maxSelections",
                          value,
                        );
                      }
                    }}
                  >
                    <MenuItem value={0}>{STR.NO_LIMIT}</MenuItem>
                    {MAX_SELECTION_OPTIONS.map((n) => (
                      <MenuItem key={`max-${n}`} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {question.maxSelections > 0
                    ? `Users can select up to ${question.maxSelections} option(s).`
                    : "Users can select any number of options."}
                </Typography>
              </Box>
            )}
          </Box>
        );
      }

      if (questionTypeValue === QUESTION_TYPE_VALUES.MULTIPLE_TEXT) {
        return (
          <Box sx={{ mt: 2 }}>
            <SectionTitle>Text Fields:</SectionTitle>
            {(question.multipleTextFields || [""]).map((field, index) => (
              <Box
                key={`mtf-row-${question.clientId}-${index}`}
                sx={{ display: "flex", gap: 1, mb: 1 }}
              >
                <TextField
                  size="small"
                  placeholder={`Field ${index + 1} label`}
                  value={field}
                  onChange={(e) =>
                    updateMultipleTextField(
                      targetClientId,
                      index,
                      e.target.value,
                      isSubQuestion,
                      subClientId,
                    )
                  }
                  fullWidth
                  error={!field && formik.submitCount > 0}
                  helperText={
                    !field && formik.submitCount > 0 ? STR.FIELD_REQUIRED : ""
                  }
                />
                <DeleteRowButton
                  ariaLabel={`Delete field ${index + 1}`}
                  onClick={() =>
                    deleteMultipleTextField(
                      targetClientId,
                      index,
                      isSubQuestion,
                      subClientId,
                    )
                  }
                  disabled={(question.multipleTextFields || [""]).length === 1}
                />
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                addMultipleTextField(targetClientId, isSubQuestion, subClientId)
              }
              sx={{ mt: 1 }}
            >
              Add Field
            </Button>
          </Box>
        );
      }

      if (questionTypeValue === QUESTION_TYPE_VALUES.RATING) {
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Number of Stars</InputLabel>
              <Select
                value={question.ratingScale || 5}
                label="Number of Stars"
                onChange={(e) => {
                  const value = e.target.value;
                  if (isSubQuestion) {
                    updateSubQuestion(
                      parentClientId,
                      subClientId,
                      "ratingScale",
                      value,
                    );
                  } else {
                    updateQuestion(question.clientId, "ratingScale", value);
                  }
                }}
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
      }

      return null;
    },
    [
      tracerQuestionDropdownType,
      formik.submitCount,
      updateOption,
      deleteOption,
      addOption,
      updateMultipleTextField,
      deleteMultipleTextField,
      addMultipleTextField,
      updateQuestion,
      updateSubQuestion,
      renderRatingStars,
    ],
  );

  /* ============================================================
     SHOW / HIDE CONDITION RENDERER
     ============================================================ */
  const renderShowCondition = useCallback(
    (
      question,
      isSubQuestion = false,
      parentClientId = null,
      subClientId = null,
    ) => {
      const showCondition = question.showCondition || "always";
      const dependsOnClientId = question.dependsOnClientId || null;
      const showWhenOption = question.showWhenOption || "";

      const previousEligibleQuestions = getPreviousEligibleQuestions(
        question.clientId,
      );

      let dependentOptions = [];
      let dependentQuestionType = null;

      if (dependsOnClientId) {
        const flat = [];
        values.questions.forEach((q) => {
          flat.push(q);
          (q.subQuestions || []).forEach((sub) => flat.push(sub));
        });
        const questionObj = flat.find((q) => q.clientId === dependsOnClientId);
        if (questionObj) {
          dependentOptions =
            questionObj.options?.filter((opt) => opt && opt.trim() !== "") ||
            [];
          dependentQuestionType = getQuestionTypeValue(
            tracerQuestionDropdownType,
            questionObj.questionTypeId,
          );
        }
      }

      const selectedTriggerOptions = parseShowWhenOptions(showWhenOption);
      const isMultipleOptionParent = MULTI_CHOICE_TYPES.includes(
        dependentQuestionType,
      );

      const handleShowConditionChange = (value) => {
        const patch =
          value === "always"
            ? {
                showCondition: value,
                dependsOnClientId: null,
                showWhenOption: "",
              }
            : { showCondition: value };
        if (isSubQuestion) {
          updateSubQuestion(
            parentClientId,
            subClientId,
            "showCondition",
            value,
          );
          if (value === "always") {
            updateSubQuestion(
              parentClientId,
              subClientId,
              "dependsOnClientId",
              null,
            );
            updateSubQuestion(
              parentClientId,
              subClientId,
              "showWhenOption",
              "",
            );
          }
        } else {
          updateQuestion(question.clientId, "showCondition", value);
          if (value === "always") {
            updateQuestion(question.clientId, "dependsOnClientId", null);
            updateQuestion(question.clientId, "showWhenOption", "");
          }
        }
        return patch;
      };

      const handleDependsOnChange = (value) => {
        if (isSubQuestion) {
          updateSubQuestion(
            parentClientId,
            subClientId,
            "dependsOnClientId",
            value,
          );
        } else {
          updateQuestion(question.clientId, "dependsOnClientId", value);
        }
      };

      const handleShowWhenOptionChange = (raw) => {
        const value = Array.isArray(raw) ? raw.join(",") : raw;
        if (isSubQuestion) {
          updateSubQuestion(
            parentClientId,
            subClientId,
            "showWhenOption",
            value,
          );
        } else {
          updateQuestion(question.clientId, "showWhenOption", value);
        }
      };

      return (
        <Box sx={{ mt: 2, p: 2, borderRadius: 1 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <PlaylistAddIcon fontSize="small" />
            {STR.SHOW_CONDITION}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Show Condition</InputLabel>
                <Select
                  value={showCondition}
                  label="Show Condition"
                  onChange={(e) => handleShowConditionChange(e.target.value)}
                >
                  <MenuItem value="always">{STR.ALWAYS_SHOW}</MenuItem>
                  <MenuItem value="option">When Option Selected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {showCondition !== "always" && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Previous Question</InputLabel>
                    <Select
                      value={dependsOnClientId || ""}
                      label="Previous Question"
                      onChange={(e) => handleDependsOnChange(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a previous question</em>
                      </MenuItem>
                      {previousEligibleQuestions.length > 0 ? (
                        previousEligibleQuestions.map((q) => {
                          const displayLabel = getLabelForClientId(q.clientId);
                          const optionsCount =
                            q.options?.filter((o) => o && o.trim() !== "")
                              .length || 0;
                          const typeLabel = getQuestionTypeLabel(
                            tracerQuestionDropdownType,
                            q.questionTypeId,
                          );
                          return (
                            <MenuItem key={q.clientId} value={q.clientId}>
                              <Tooltip
                                title={
                                  typeLabel
                                    ? `${typeLabel} • ${optionsCount} option(s)`
                                    : `${optionsCount} option(s)`
                                }
                                placement="right"
                                arrow
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    display: "block",
                                    width: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {displayLabel}: {q.questionText || "Untitled"}{" "}
                                  ({optionsCount} options)
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          );
                        })
                      ) : (
                        <MenuItem disabled>
                          <em>No previous questions with options available</em>
                        </MenuItem>
                      )}
                    </Select>
                    {previousEligibleQuestions.length === 0 && (
                      <Typography
                        variant="caption"
                        color="warning"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Please add a previous Single Choice (Radio), Multiple
                        Choice (Checkbox), Single Select Dropdown or
                        Multi-Select Dropdown question with options first.
                      </Typography>
                    )}
                    {dependsOnClientId && (
                      <Typography
                        variant="caption"
                        color="info"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Selected:{" "}
                        {flatWithLabels.find(
                          (x) => x.clientId === dependsOnClientId,
                        )?.questionText || "Unknown"}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      {isMultipleOptionParent
                        ? "Select Options to Show"
                        : "Select Option to Show"}
                    </InputLabel>
                    <Select
                      multiple={isMultipleOptionParent}
                      value={
                        isMultipleOptionParent
                          ? selectedTriggerOptions
                          : showWhenOption || ""
                      }
                      label={
                        isMultipleOptionParent
                          ? "Select Options to Show"
                          : "Select Option to Show"
                      }
                      onChange={(e) =>
                        handleShowWhenOptionChange(e.target.value)
                      }
                      input={
                        isMultipleOptionParent ? (
                          <OutlinedInput label="Select Options to Show" />
                        ) : undefined
                      }
                      renderValue={
                        isMultipleOptionParent
                          ? (selected) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selected.map((value) => (
                                  <Chip
                                    key={`trig-${value}`}
                                    label={value}
                                    size="small"
                                  />
                                ))}
                              </Box>
                            )
                          : undefined
                      }
                      disabled={
                        !dependsOnClientId || dependentOptions.length === 0
                      }
                    >
                      {!isMultipleOptionParent && (
                        <MenuItem value="">
                          <em>Select an option</em>
                        </MenuItem>
                      )}
                      {dependentOptions.map((option) => (
                        <MenuItem key={`dep-opt-${option}`} value={option}>
                          {isMultipleOptionParent && (
                            <Checkbox
                              checked={
                                selectedTriggerOptions.indexOf(option) > -1
                              }
                            />
                          )}
                          {isMultipleOptionParent ? (
                            <ListItemText primary={option} />
                          ) : (
                            option
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                    {!dependsOnClientId && (
                      <Typography
                        variant="caption"
                        color="info"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Please select a previous question first.
                      </Typography>
                    )}
                    {dependsOnClientId && dependentOptions.length === 0 && (
                      <Typography
                        variant="caption"
                        color="warning"
                        sx={{ mt: 1, display: "block" }}
                      >
                        The selected question has no options. Please add options
                        to that question.
                      </Typography>
                    )}
                    {dependsOnClientId && dependentOptions.length > 0 && (
                      <Typography
                        variant="caption"
                        color="success"
                        sx={{ mt: 1, display: "block" }}
                      >
                        {dependentOptions.length} option(s) available.{" "}
                        {isMultipleOptionParent
                          ? "Select one or more options to show this question."
                          : "Select one to show this question."}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      );
    },
    [
      getPreviousEligibleQuestions,
      values.questions,
      tracerQuestionDropdownType,
      getLabelForClientId,
      flatWithLabels,
      updateQuestion,
      updateSubQuestion,
    ],
  );

  /* ============================================================
     PREVIEW RENDERER
     ============================================================ */
  const renderPreviewOptions = useCallback(
    (question, questionId = null) => {
      const questionTypeValue = getQuestionTypeValue(
        tracerQuestionDropdownType,
        question.questionTypeId,
      );
      if (!questionTypeValue) return null;

      const targetId = questionId || question.clientId;

      switch (questionTypeValue) {
        case QUESTION_TYPE_VALUES.RADIO:
          return (
            <RadioGroup
              value={dropdownValues[targetId] || ""}
              onChange={(e) =>
                setDropdownValues((prev) => ({
                  ...prev,
                  [targetId]: e.target.value,
                }))
              }
            >
              {(question.options || [""]).map((opt, idx) => (
                <FormControlLabel
                  key={`radio-${targetId}-${idx}`}
                  value={opt}
                  control={<Radio />}
                  label={opt || `Option ${idx + 1}`}
                />
              ))}
            </RadioGroup>
          );

        case QUESTION_TYPE_VALUES.CHECKBOX: {
          const currentSelected = multiSelectValues[targetId] || [];
          const maxSel = question.maxSelections || 0;
          const limitReached = maxSel > 0 && currentSelected.length >= maxSel;
          return (
            <FormGroup>
              {(question.options || [""]).map((opt, idx) => {
                const checked = currentSelected.includes(opt);
                const optionDisabled = limitReached && !checked;
                return (
                  <FormControlLabel
                    key={`cb-${targetId}-${idx}`}
                    disabled={optionDisabled}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          setMultiSelectValues((prev) => {
                            const existing = prev[targetId] || [];
                            if (e.target.checked) {
                              if (maxSel > 0 && existing.length >= maxSel) {
                                return prev;
                              }
                              return {
                                ...prev,
                                [targetId]: [...existing, opt],
                              };
                            }
                            return {
                              ...prev,
                              [targetId]: existing.filter((v) => v !== opt),
                            };
                          });
                        }}
                      />
                    }
                    label={opt || `Option ${idx + 1}`}
                  />
                );
              })}
              {maxSel > 0 && (
                <Typography
                  variant="caption"
                  color={limitReached ? "warning" : "text.secondary"}
                  sx={{ mt: 0.5 }}
                >
                  {currentSelected.length}/{maxSel} selected
                  {limitReached ? " — limit reached" : ""}
                </Typography>
              )}
            </FormGroup>
          );
        }

        case QUESTION_TYPE_VALUES.DROPDOWN:
          return renderUnderlinedDropdown(
            question.options || [],
            targetId,
            false,
          );

        case QUESTION_TYPE_VALUES.MULTI_SELECT:
          return renderOriginalMultiSelect(
            question.options || [],
            targetId,
            false,
            question.maxSelections || 0,
          );

        case QUESTION_TYPE_VALUES.MULTIPLE_TEXT:
          return renderMultipleTextInputs(
            question.multipleTextFields || [],
            targetId,
            false,
          );

        case QUESTION_TYPE_VALUES.RATING:
          return renderRatingStars(
            question.ratingScale || 5,
            ratingValues[targetId] || 0,
            (value) =>
              setRatingValues((prev) => ({ ...prev, [targetId]: value })),
            false,
          );

        case QUESTION_TYPE_VALUES.TEXT:
          return renderUnderlinedTextInput(targetId, false, false, null);

        case QUESTION_TYPE_VALUES.TEXTAREA:
          return renderUnderlinedTextInput(targetId, false, true, null);

        case QUESTION_TYPE_VALUES.DATE:
          return (
            <TextField
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              sx={{
                width: "100%",
                "&:before": { borderBottomColor: "#1976d2" },
                "&:hover:before": { borderBottomColor: "#1976d2" },
                "&:after": { borderBottomColor: "#1976d2" },
              }}
            />
          );

        default:
          return null;
      }
    },
    [
      tracerQuestionDropdownType,
      dropdownValues,
      multiSelectValues,
      ratingValues,
      renderUnderlinedDropdown,
      renderOriginalMultiSelect,
      renderMultipleTextInputs,
      renderRatingStars,
      renderUnderlinedTextInput,
    ],
  );

  /* ============================================================
     QUESTION FORM RENDERER
     ============================================================ */
  const renderQuestionForm = useCallback(
    (question, index) => {
      if (!question) return null;

      const currentQuestionTypeValue = getQuestionTypeValue(
        tracerQuestionDropdownType,
        question.questionTypeId,
      );
      const hasSubQuestions = (question.subQuestions || []).length > 0;

      const questionErrors = formik.errors.questions?.[index] || {};
      const questionTouched = formik.touched.questions?.[index] || {};

      return (
        <Paper
          key={question.clientId}
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
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <DragIcon sx={{ mr: 1, color: "text.secondary", cursor: "grab" }} />
            <Typography fontWeight={600} sx={{ flex: 1 }}>
              Question {index + 1}
            </Typography>
            <IconButton
              color="error"
              onClick={() => deleteQuestion(question.clientId)}
              disabled={values.questions.length === 1}
              size="small"
              aria-label={`Delete question ${index + 1}`}
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Question Text"
                value={question.questionText}
                onChange={(e) =>
                  updateQuestion(
                    question.clientId,
                    "questionText",
                    e.target.value,
                  )
                }
                variant="outlined"
                size="small"
                error={
                  questionTouched.questionText &&
                  Boolean(questionErrors.questionText)
                }
                helperText={
                  questionTouched.questionText && questionErrors.questionText
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl
                fullWidth
                size="small"
                error={
                  questionTouched.questionTypeId &&
                  Boolean(questionErrors.questionTypeId) &&
                  !hasSubQuestions
                }
              >
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={question.questionTypeId}
                  label="Question Type"
                  onChange={(e) => {
                    const newTypeId = e.target.value;
                    updateQuestion(
                      question.clientId,
                      "questionTypeId",
                      newTypeId,
                    );
                    const newTypeValue = getQuestionTypeValue(
                      tracerQuestionDropdownType,
                      newTypeId,
                    );
                    if (OPTION_BASED_TYPES.includes(newTypeValue)) {
                      if (!question.options || question.options.length === 0) {
                        updateQuestion(question.clientId, "options", [""]);
                      }
                      if (
                        MULTI_CHOICE_TYPES.includes(newTypeValue) &&
                        question.maxSelections === undefined
                      ) {
                        updateQuestion(question.clientId, "maxSelections", 0);
                      }
                    } else if (
                      newTypeValue === QUESTION_TYPE_VALUES.MULTIPLE_TEXT &&
                      (!question.multipleTextFields ||
                        question.multipleTextFields.length === 0)
                    ) {
                      updateQuestion(question.clientId, "multipleTextFields", [
                        "",
                      ]);
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>{STR.SELECT_QUESTION_TYPE}</em>
                  </MenuItem>
                  {tracerQuestionDropdownType.map((type) => (
                    <MenuItem key={`qt-${type.id}`} value={type.id}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={question.required}
                    onChange={(e) =>
                      updateQuestion(
                        question.clientId,
                        "required",
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Required"
              />
            </Grid>

            {currentQuestionTypeValue && (
              <Grid size={{ xs: 12, md: 6 }}>{renderOptions(question)}</Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <PlaylistAddIcon
                      color={
                        question.showCondition !== "always"
                          ? "primary"
                          : "disabled"
                      }
                    />
                    <Typography variant="subtitle2">
                      {question.showCondition !== "always"
                        ? STR.SHOW_CONDITION_CUSTOM
                        : STR.SHOW_CONDITION_ALWAYS}
                    </Typography>
                    {question.showCondition !== "always" &&
                      question.dependsOnClientId && (
                        <Chip
                          label={`${STR.DEPENDS_ON} ${getLabelForClientId(
                            question.dependsOnClientId,
                          )}`}
                          size="small"
                          color="secondary"
                        />
                      )}
                    {question.showCondition === "option" &&
                      question.showWhenOption && (
                        <Chip
                          label={`${STR.SHOW_WHEN} ${parseShowWhenOptions(
                            question.showWhenOption,
                          ).join(", ")}`}
                          size="small"
                          color="primary"
                        />
                      )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderShowCondition(question)}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {!currentQuestionTypeValue && hasSubQuestions && (
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                {question.subQuestions.map((sub, subIndex) => (
                  <Paper
                    key={sub.clientId}
                    variant="outlined"
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        Sub-question {subIndex + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          deleteSubQuestion(question.clientId, sub.clientId)
                        }
                        aria-label={`Delete sub-question ${subIndex + 1}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Sub-question Text"
                          value={sub.questionText}
                          onChange={(e) =>
                            updateSubQuestion(
                              question.clientId,
                              sub.clientId,
                              "questionText",
                              e.target.value,
                            )
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Question Type</InputLabel>
                          <Select
                            value={sub.questionTypeId}
                            label="Question Type"
                            onChange={(e) => {
                              const newTypeId = e.target.value;
                              updateSubQuestion(
                                question.clientId,
                                sub.clientId,
                                "questionTypeId",
                                newTypeId,
                              );
                              const newTypeValue = getQuestionTypeValue(
                                tracerQuestionDropdownType,
                                newTypeId,
                              );
                              if (OPTION_BASED_TYPES.includes(newTypeValue)) {
                                if (!sub.options || sub.options.length === 0) {
                                  updateSubQuestion(
                                    question.clientId,
                                    sub.clientId,
                                    "options",
                                    [""],
                                  );
                                }
                                if (
                                  MULTI_CHOICE_TYPES.includes(newTypeValue) &&
                                  sub.maxSelections === undefined
                                ) {
                                  updateSubQuestion(
                                    question.clientId,
                                    sub.clientId,
                                    "maxSelections",
                                    0,
                                  );
                                }
                              }
                            }}
                          >
                            <MenuItem value="">
                              <em>{STR.SELECT_QUESTION_TYPE}</em>
                            </MenuItem>
                            {tracerQuestionDropdownType.map((type) => (
                              <MenuItem
                                key={`sub-qt-${type.id}`}
                                value={type.id}
                              >
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={sub.required}
                              onChange={(e) =>
                                updateSubQuestion(
                                  question.clientId,
                                  sub.clientId,
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
                        <Grid size={{ xs: 12, md: 6 }}>
                          {renderOptions(
                            sub,
                            true,
                            question.clientId,
                            sub.clientId,
                          )}
                        </Grid>
                      )}
                      <Grid size={{ xs: 12 }}>
                        <Accordion defaultExpanded>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PlaylistAddIcon
                                color={
                                  sub.showCondition !== "always"
                                    ? "primary"
                                    : "disabled"
                                }
                              />
                              <Typography variant="caption">
                                {sub.showCondition !== "always"
                                  ? "Show/Hide (Custom)"
                                  : "Show/Hide (Always Show)"}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {renderShowCondition(
                              sub,
                              true,
                              question.clientId,
                              sub.clientId,
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            )}

            {!currentQuestionTypeValue && (
              <Grid size={{ xs: 12 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => addSubQuestion(question.clientId)}
                >
                  Add Sub-question
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>
      );
    },
    [
      tracerQuestionDropdownType,
      formik.errors.questions,
      formik.touched.questions,
      draggedItem,
      values.questions.length,
      updateQuestion,
      deleteQuestion,
      renderOptions,
      renderShowCondition,
      getLabelForClientId,
      addSubQuestion,
      deleteSubQuestion,
      updateSubQuestion,
      handleDragStart,
      handleDragOver,
      handleDrop,
    ],
  );

  /* ============================================================
     MAIN RENDER
     ============================================================ */
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tracer Title"
                name="tracerTitle"
                value={values.tracerTitle}
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
            <Grid size={{ xs: 12, md: 6 }}>
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
                  value={values.parentTracerTypeId}
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
                    <MenuItem key={`pt-${type.id}`} value={type.id}>
                      {type.dropdown_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                size="small"
                error={
                  formik.touched.subTracerTypeId &&
                  Boolean(formik.errors.subTracerTypeId)
                }
                disabled={!values.parentTracerTypeId || isLoadingSubTypes}
              >
                <InputLabel>Select Sub Tracer Type</InputLabel>
                <Select
                  name="subTracerTypeId"
                  value={values.subTracerTypeId}
                  label="Select Sub Tracer Type"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">
                    <em>-- Select Sub Tracer Type --</em>
                  </MenuItem>
                  {subTracerTypes.length > 0 ? (
                    subTracerTypes.map((type) => (
                      <MenuItem key={`st-${type.id}`} value={type.id}>
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

        {values.questions.length > 0 && (
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
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {values.questions.map((question, index) => {
                const errorCount = getQuestionErrorCount(question, index);
                return (
                  <Tab
                    key={question.clientId}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <span>Q{index + 1}</span>
                        {question.showCondition !== "always" && (
                          <PlaylistAddIcon fontSize="small" color="primary" />
                        )}
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
          {values.questions.length > 0 &&
            renderQuestionForm(values.questions[activeTab], activeTab)}
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

      <PreviewSection
        formikValues={values}
        parentTracerTypes={parentTracerTypes}
        subTracerTypes={subTracerTypes}
        visibleQuestions={visibleQuestions}
        flatWithLabels={flatWithLabels}
        tracerQuestionDropdownType={tracerQuestionDropdownType}
        renderPreviewOptions={renderPreviewOptions}
        parseShowWhenOptions={parseShowWhenOptions}
        getLabelForClientId={getLabelForClientId}
      />
    </Paper>
  );
};

/* ============================================================
   PREVIEW SECTION (extracted sub-component)
   ============================================================ */
const PreviewSection = ({
  formikValues,
  parentTracerTypes,
  subTracerTypes,
  visibleQuestions,
  flatWithLabels,
  tracerQuestionDropdownType,
  renderPreviewOptions,
  parseShowWhenOptions,
  getLabelForClientId,
}) => {
  const { tracerTitle, parentTracerTypeId, subTracerTypeId, questions } =
    formikValues;

  const selectedParentName =
    parentTracerTypes.find((t) => t.id === parentTracerTypeId)?.dropdown_name ||
    "";

  const selectedSub = subTracerTypes.find((t) => t.id === subTracerTypeId);
  const selectedSubName = selectedSub?.name || selectedSub?.dropdown_name || "";

  const allHidden =
    questions.length > 0 &&
    Object.values(visibleQuestions).every((v) => v === false) &&
    questions.some((q) => q.showCondition === "option" && q.dependsOnClientId);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight={650} gutterBottom>
        Live Preview
      </Typography>
      <Paper sx={{ p: 2, maxHeight: 400, overflow: "auto" }} variant="outlined">
        {tracerTitle && (
          <Typography variant="h6" gutterBottom color="primary">
            {tracerTitle}
          </Typography>
        )}
        {parentTracerTypeId && (
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Tracer Type: {selectedParentName}
            {selectedSubName && ` - ${selectedSubName}`}
          </Typography>
        )}
        {(tracerTitle || parentTracerTypeId) && <Divider sx={{ my: 2 }} />}

        {questions.map((question, index) => {
          const questionTypeValue = getQuestionTypeValue(
            tracerQuestionDropdownType,
            question.questionTypeId,
          );
          const isVisible = visibleQuestions[question.clientId] ?? true;
          if (!isVisible) return null;

          const hasSubQuestions = (question.subQuestions || []).length > 0;
          if (!questionTypeValue && !hasSubQuestions) return null;

          return (
            <Box key={question.clientId} sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                {index + 1}. {question.questionText || STR.UNTITLED_QUESTION}
                {question.required && <span style={{ color: "red" }}> *</span>}
              </Typography>

              {question.showCondition !== "always" && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Chip
                    icon={<PlaylistAddIcon />}
                    label={`${STR.DEPENDS_ON} ${getLabelForClientId(
                      question.dependsOnClientId,
                    )}`}
                    size="small"
                    color="secondary"
                  />
                  {question.showCondition === "option" &&
                    question.showWhenOption && (
                      <Chip
                        label={`${STR.SHOW_WHEN} ${parseShowWhenOptions(
                          question.showWhenOption,
                        ).join(", ")}`}
                        size="small"
                        color="primary"
                      />
                    )}
                </Box>
              )}

              {questionTypeValue && (
                <Box sx={{ ml: 2, mt: 1 }}>
                  {renderPreviewOptions(question, question.clientId)}
                </Box>
              )}

              {hasSubQuestions && (
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
                      tracerQuestionDropdownType,
                      sub.questionTypeId,
                    );
                    const isSubVisible = visibleQuestions[sub.clientId] ?? true;
                    if (!isSubVisible) return null;
                    if (!subQuestionTypeValue) return null;

                    return (
                      <Box key={sub.clientId} sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          {index + 1}.{subIndex + 1}{" "}
                          {sub.questionText || STR.UNTITLED_SUBQUESTION}
                          {sub.required && (
                            <span style={{ color: "red" }}> *</span>
                          )}
                        </Typography>
                        {sub.showCondition !== "always" && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                              mb: 1,
                            }}
                          >
                            <Chip
                              icon={<PlaylistAddIcon />}
                              label={`${STR.DEPENDS_ON} ${getLabelForClientId(
                                sub.dependsOnClientId,
                              )}`}
                              size="small"
                              color="secondary"
                            />
                            {sub.showCondition === "option" &&
                              sub.showWhenOption && (
                                <Chip
                                  label={`${STR.SHOW_WHEN} ${parseShowWhenOptions(
                                    sub.showWhenOption,
                                  ).join(", ")}`}
                                  size="small"
                                  color="primary"
                                />
                              )}
                          </Box>
                        )}
                        <Box sx={{ ml: 2 }}>
                          {renderPreviewOptions(sub, sub.clientId)}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}

        {allHidden && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            No questions are currently visible. Please select options above to
            reveal conditional questions.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

/* ============================================================
   SUBMISSION BUILDER (pure helper)
   ============================================================ */
function buildSubmissionQuestion(q, index, types) {
  const questionData = {
    clientId: q.clientId,
    questionOrder: index + 1,
    questionText: q.questionText,
    questionTypeId: q.questionTypeId ? Number(q.questionTypeId) : null,
    required: q.required ? 1 : 0,
    showCondition: q.showCondition || "always",
    dependsOnClientId: q.dependsOnClientId || null,
    showWhenOption: q.showWhenOption || "",
    options: q.options?.filter((opt) => opt.trim() !== "") || [],
    multipleTextFields:
      q.multipleTextFields?.filter((field) => field.trim() !== "") || [],
  };

  if (isRating(types, q.questionTypeId)) {
    questionData.ratingScale = q.ratingScale ? Number(q.ratingScale) : null;
  }
  if (isMultiChoiceType(types, q.questionTypeId)) {
    questionData.maxSelections = q.maxSelections ? Number(q.maxSelections) : 0;
  }

  questionData.subQuestions =
    q.subQuestions?.map((sub, subIndex) => {
      const subData = {
        clientId: sub.clientId,
        subQuestionOrder: subIndex + 1,
        questionText: sub.questionText,
        questionTypeId: sub.questionTypeId ? Number(sub.questionTypeId) : null,
        required: sub.required ? 1 : 0,
        showCondition: sub.showCondition || "always",
        dependsOnClientId: sub.dependsOnClientId || null,
        showWhenOption: sub.showWhenOption || "",
        options: sub.options?.filter((opt) => opt.trim() !== "") || [],
        multipleTextFields:
          sub.multipleTextFields?.filter((field) => field.trim() !== "") || [],
      };
      if (isRating(types, sub.questionTypeId)) {
        subData.ratingScale = sub.ratingScale ? Number(sub.ratingScale) : null;
      }
      if (isMultiChoiceType(types, sub.questionTypeId)) {
        subData.maxSelections = sub.maxSelections
          ? Number(sub.maxSelections)
          : 0;
      }
      return subData;
    }) || [];

  return questionData;
}

export default GenerateTracerIndex;
