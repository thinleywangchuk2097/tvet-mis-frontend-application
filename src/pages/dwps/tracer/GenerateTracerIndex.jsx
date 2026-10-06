// GenerateTracerIndex.jsx
import React, { useState, useEffect, useRef } from "react";
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

// ==================== PURE HELPERS (module scope) ====================

// Question-type values that support answer options
const OPTION_BASED_TYPES = ["radio", "checkbox", "dropdown", "multiSelect"];
const MULTI_CHOICE_TYPES = ["checkbox", "multiSelect"];

// Normalize a value (scalar or array) into an array
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
};

// Parse showWhenOption into an array of trigger option strings
const parseShowWhenOptions = (showWhenOption) => {
  if (!showWhenOption) return [];
  if (Array.isArray(showWhenOption)) return showWhenOption;
  return String(showWhenOption)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
};

// Flatten all questions (top-level + sub) with ordering metadata
const flattenQuestions = (questions) => {
  const flat = [];
  questions.forEach((q, qi) => {
    flat.push({ ...q, __order: qi * 1000, __parentClientId: null });
    (q.subQuestions || []).forEach((sub, si) => {
      flat.push({
        ...sub,
        __order: qi * 1000 + si + 1,
        __parentClientId: q.clientId,
      });
    });
  });
  return flat;
};

// Pure predicate: does the parent's selected value match a trigger option?
const matchesTrigger = (parentTypeValue, selectedValue, triggerOptions) => {
  if (triggerOptions.length === 0) return false;

  if (MULTI_CHOICE_TYPES.includes(parentTypeValue)) {
    const selectedArr = toArray(selectedValue);
    if (selectedArr.length === 0) return false;
    return triggerOptions.some((opt) => selectedArr.includes(opt));
  }

  if (!selectedValue) return false;
  return triggerOptions.includes(selectedValue);
};

// Build a composite React key for a list item
const buildKey = (prefix, index, value) => `${prefix}-${index}-${value ?? ""}`;

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
  const [forceUpdate, setForceUpdate] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);

  const clientIdRef = useRef(1);
  const nextClientId = () => `q-${clientIdRef.current++}`;

  useEffect(() => {
    fetchTracerQuestionDropdownType();
    fetchParentTracerTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTracerQuestionDropdownType = async () => {
    try {
      const response =
        await GenerateTracerService.getTracerQuestionDropdownType(access_token);
      setTracerQuestionDropdownType(response.data);
    } catch (error) {
      console.error("Error fetching tracer question dropdown types:", error);
    }
  };

  const fetchParentTracerTypes = async () => {
    try {
      const response =
        await GenerateTracerService.getParentTracerTypes(access_token);
      setParentTracerTypes(response.data);
    } catch (error) {
      console.error("Error fetching parent tracer types:", error);
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
      setSubTracerTypes(response.data);
    } catch (error) {
      console.error("Error fetching sub tracer types:", error);
      setSubTracerTypes([]);
    } finally {
      setIsLoadingSubTypes(false);
    }
  };

  const handleParentTracerTypeChange = async (selectedParentId) => {
    formik.setFieldValue("subTracerTypeId", "");
    await fetchSubTracerTypes(selectedParentId);
  };

  // ==================== QUESTION TYPE INTROSPECTION ====================
  // Single lookup + factory-generated predicates (fixes duplicated logic)

  const getQuestionTypeValue = (typeId) => {
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId,
    );
    return questionType ? questionType.value : null;
  };

  const getQuestionTypeLabel = (typeId) => {
    const questionType = tracerQuestionDropdownType.find(
      (t) => t.id === typeId,
    );
    return questionType ? questionType.label : null;
  };

  const isQuestionType = (value) => (typeId) =>
    getQuestionTypeValue(typeId) === value;

  const isMultipleText = isQuestionType("multipleText");
  const isRating = isQuestionType("rating");

  const requiresOptions = (typeId) =>
    OPTION_BASED_TYPES.includes(getQuestionTypeValue(typeId));

  const isMultiChoiceType = (typeId) =>
    MULTI_CHOICE_TYPES.includes(getQuestionTypeValue(typeId));

  const isEligibleConditionSource = (typeId) =>
    OPTION_BASED_TYPES.includes(getQuestionTypeValue(typeId));

  // ==================== VALIDATION SCHEMA ====================

  const createValidationSchema = () => {
    const questionShape = (isSub = false) =>
      Yup.object().shape({
        clientId: Yup.string().required(),
        questionText: Yup.string().required(
          isSub ? "Sub-question text is required" : "Question text is required",
        ),
        questionTypeId: isSub
          ? Yup.string().required("Sub-question type is required")
          : Yup.string().when("subQuestions", {
              is: (subQuestions) => subQuestions && subQuestions.length > 0,
              then: (schema) => schema.notRequired(),
              otherwise: (schema) =>
                schema.required("Question type is required"),
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
      });

    const subQuestionShape = Yup.object().shape({
      clientId: Yup.string().required(),
      questionText: Yup.string().required("Sub-question text is required"),
      questionTypeId: Yup.string().required("Sub-question type is required"),
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
    });

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
        questionShape().shape({
          subQuestions: Yup.array().of(subQuestionShape),
        }),
      ),
    });
  };

  // ==================== FORMIK ====================

  const formik = useFormik({
    initialValues: {
      tracerTitle: "",
      parentTracerTypeId: "",
      subTracerTypeId: "",
      questions: [
        {
          clientId: nextClientId(),
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
        },
      ],
    },
    validationSchema: createValidationSchema(),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const mapSubQuestion = (sub, subIndex) => {
          const subData = {
            clientId: sub.clientId,
            subQuestionOrder: subIndex + 1,
            questionText: sub.questionText,
            questionTypeId: sub.questionTypeId
              ? Number(sub.questionTypeId)
              : null,
            required: sub.required ? 1 : 0,
            showCondition: sub.showCondition || "always",
            dependsOnClientId: sub.dependsOnClientId || null,
            showWhenOption: sub.showWhenOption || "",
            options: sub.options?.filter((opt) => opt.trim() !== "") || [],
            multipleTextFields:
              sub.multipleTextFields?.filter((f) => f.trim() !== "") || [],
          };
          if (isRating(sub.questionTypeId)) {
            subData.ratingScale = sub.ratingScale
              ? Number(sub.ratingScale)
              : null;
          }
          if (isMultiChoiceType(sub.questionTypeId)) {
            subData.maxSelections = sub.maxSelections
              ? Number(sub.maxSelections)
              : 0;
          }
          return subData;
        };

        const mapQuestion = (q, index) => {
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
              q.multipleTextFields?.filter((f) => f.trim() !== "") || [],
          };
          if (isRating(q.questionTypeId)) {
            questionData.ratingScale = q.ratingScale
              ? Number(q.ratingScale)
              : null;
          }
          if (isMultiChoiceType(q.questionTypeId)) {
            questionData.maxSelections = q.maxSelections
              ? Number(q.maxSelections)
              : 0;
          }
          questionData.subQuestions = q.subQuestions?.map(mapSubQuestion) || [];
          return questionData;
        };

        const submissionData = {
          tracerTitle: values.tracerTitle,
          parentTracerTypeId: values.parentTracerTypeId,
          subTracerTypeId: values.subTracerTypeId,
          questions: values.questions.map(mapQuestion),
        };

        console.log("payload : ", submissionData);

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
      } catch (error) {
        console.error("Error saving questions:", error);
        toast.error("Failed to save questions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (tracerQuestionDropdownType.length > 0) {
      formik.validationSchema = createValidationSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracerQuestionDropdownType]);

  // ==================== LABELING ====================

  const buildFlatWithLabels = () => {
    const allFlat = [];
    formik.values.questions.forEach((q, qi) => {
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
  };

  const getLabelForClientId = (clientId) =>
    buildFlatWithLabels().find((x) => x.clientId === clientId)?.label || "Q?";

  const getQuestionTextForClientId = (clientId) =>
    buildFlatWithLabels().find((x) => x.clientId === clientId)?.questionText ||
    "Unknown";

  // ==================== CONDITION LOGIC ====================

  const isEligibleSource = (q) =>
    isEligibleConditionSource(q.questionTypeId) &&
    q.options &&
    q.options.some((opt) => opt && opt.trim() !== "");

  const getPreviousEligibleQuestions = (currentClientId) => {
    const flat = flattenQuestions(formik.values.questions);
    const currentIndex = flat.findIndex((q) => q.clientId === currentClientId);
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
      return isEligibleSource(q);
    });
  };

  const isQuestionVisible = (question, allFlat, selectedValues) => {
    if (question.showCondition === "always") return true;
    if (question.showCondition !== "option" || !question.dependsOnClientId) {
      return true;
    }

    const dependsOnQuestion = allFlat.find(
      (q) => q.clientId === question.dependsOnClientId,
    );
    if (!dependsOnQuestion) return false;

    const parentTypeValue = getQuestionTypeValue(
      dependsOnQuestion.questionTypeId,
    );
    const selectedValue = selectedValues[dependsOnQuestion.clientId];
    const triggerOptions = parseShowWhenOptions(question.showWhenOption);

    return matchesTrigger(parentTypeValue, selectedValue, triggerOptions);
  };

  useEffect(() => {
    const allFlat = [];
    formik.values.questions.forEach((q) => {
      allFlat.push(q);
      (q.subQuestions || []).forEach((sub) => allFlat.push(sub));
    });

    const selectedValues = {
      ...dropdownValues,
      ...multiSelectValues,
      ...textInputValues,
    };

    const visibility = {};
    allFlat.forEach((q) => {
      visibility[q.clientId] = isQuestionVisible(q, allFlat, selectedValues);
    });

    setVisibleQuestions(visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formik.values.questions,
    dropdownValues,
    multiSelectValues,
    textInputValues,
    forceUpdate,
  ]);

  // ==================== QUESTION MUTATIONS ====================

  const makeNewQuestion = () => ({
    clientId: nextClientId(),
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

  const addQuestion = () => {
    formik.setFieldValue("questions", [
      ...formik.values.questions,
      makeNewQuestion(),
    ]);
    setActiveTab(formik.values.questions.length);
  };

  const deleteQuestion = (clientId) => {
    const newQuestions = formik.values.questions.filter(
      (q) => q.clientId !== clientId,
    );
    formik.setFieldValue("questions", newQuestions);
    if (activeTab >= newQuestions.length) {
      setActiveTab(Math.max(0, newQuestions.length - 1));
    }
  };

  const updateQuestion = (clientId, field, value) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (q.clientId !== clientId) return q;
      if (field === "dependsOnClientId") {
        return { ...q, [field]: value, showWhenOption: "" };
      }
      return { ...q, [field]: value };
    });
    formik.setFieldValue("questions", updatedQuestions);
    setForceUpdate((prev) => !prev);
  };

  const addOption = (clientId, isSubQuestion = false, subId = null) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.clientId === clientId) {
        return { ...q, options: [...(q.options || [""]), ""] };
      }
      if (isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) =>
            sub.clientId === subId
              ? { ...sub, options: [...(sub.options || [""]), ""] }
              : sub,
          ),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const updateOption = (
    clientId,
    index,
    value,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.clientId === clientId) {
        const newOptions = [...(q.options || [""])];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      if (isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.clientId !== subId) return sub;
            const newOptions = [...(sub.options || [""])];
            newOptions[index] = value;
            return { ...sub, options: newOptions };
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const deleteOption = (
    clientId,
    index,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.clientId === clientId) {
        const newOptions = (q.options || [""]).filter((_, i) => i !== index);
        return { ...q, options: newOptions.length ? newOptions : [""] };
      }
      if (isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.clientId !== subId) return sub;
            const newOptions = (sub.options || [""]).filter(
              (_, i) => i !== index,
            );
            return {
              ...sub,
              options: newOptions.length ? newOptions : [""],
            };
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const addSubQuestion = (parentClientId) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (q.clientId !== parentClientId) return q;
      return {
        ...q,
        subQuestions: [...q.subQuestions, makeNewQuestion()],
      };
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const updateSubQuestion = (parentClientId, subClientId, field, value) => {
    const updatedQuestions = formik.values.questions.map((q) => {
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
    formik.setFieldValue("questions", updatedQuestions);
    setForceUpdate((prev) => !prev);
  };

  const deleteSubQuestion = (parentClientId, subClientId) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (q.clientId !== parentClientId) return q;
      return {
        ...q,
        subQuestions: q.subQuestions.filter(
          (sub) => sub.clientId !== subClientId,
        ),
      };
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const addMultipleTextField = (
    clientId,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          multipleTextFields: [...(q.multipleTextFields || [""]), ""],
        };
      }
      if (isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.clientId !== subId) return sub;
            return {
              ...sub,
              multipleTextFields: [...(sub.multipleTextFields || [""]), ""],
            };
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const updateMultipleTextField = (
    clientId,
    index,
    value,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.clientId === clientId) {
        const newFields = [...(q.multipleTextFields || [""])];
        newFields[index] = value;
        return { ...q, multipleTextFields: newFields };
      }
      if (isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.clientId !== subId) return sub;
            const newFields = [...(sub.multipleTextFields || [""])];
            newFields[index] = value;
            return { ...sub, multipleTextFields: newFields };
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  const deleteMultipleTextField = (
    clientId,
    index,
    isSubQuestion = false,
    subId = null,
  ) => {
    const updatedQuestions = formik.values.questions.map((q) => {
      if (!isSubQuestion && q.clientId === clientId) {
        const newFields = (q.multipleTextFields || [""]).filter(
          (_, i) => i !== index,
        );
        return {
          ...q,
          multipleTextFields: newFields.length ? newFields : [""],
        };
      }
      if (isSubQuestion && q.clientId === clientId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map((sub) => {
            if (sub.clientId !== subId) return sub;
            const newFields = (sub.multipleTextFields || [""]).filter(
              (_, i) => i !== index,
            );
            return {
              ...sub,
              multipleTextFields: newFields.length ? newFields : [""],
            };
          }),
        };
      }
      return q;
    });
    formik.setFieldValue("questions", updatedQuestions);
  };

  // ==================== DRAG/DROP ====================

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
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
    setVisibleQuestions({});
    setForceUpdate(false);
    clientIdRef.current = 1;
    toast.info("Form has been reset");
  };

  // ==================== ERROR COUNTING ====================

  const getQuestionErrorCount = (question, index) => {
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
      if (question.showCondition === "option" && !question.showWhenOption) {
        count++;
      }
    }
    return count;
  };

  // ==================== RENDERERS ====================

  const renderRatingStars = (scale, value, onChange, disabled = false) => (
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
            "&:before": { borderBottomColor: "#1976d2" },
            "&:hover:before": { borderBottomColor: "#1976d2" },
            "&:after": { borderBottomColor: "#1976d2" },
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {options
            .filter((opt) => opt.trim() !== "")
            .map((option, idx) => (
              <MenuItem
                key={buildKey(`dd-${questionId}`, idx, option)}
                value={option}
              >
                {option}
              </MenuItem>
            ))}
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
        <InputLabel>Select Options</InputLabel>
        <Select
          multiple
          value={selectedValues}
          onChange={handleChange}
          input={<OutlinedInput label="Select Options" />}
          renderValue={renderChips}
        >
          {options
            .filter((opt) => opt.trim() !== "")
            .map((option, idx) => {
              const isSelected = selectedValues.indexOf(option) > -1;
              const optionDisabled = limitReached && !isSelected;
              return (
                <MenuItem
                  key={buildKey(`ms-${questionId}`, idx, option)}
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
  };

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
              "&:before": { borderBottomColor: "#1976d2" },
              "&:hover:before": { borderBottomColor: "#1976d2" },
              "&:after": { borderBottomColor: "#1976d2" },
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
          "&:before": { borderBottomColor: "#1976d2" },
          "&:hover:before": { borderBottomColor: "#1976d2" },
          "&:after": { borderBottomColor: "#1976d2" },
        }}
      />
    );
  };

  const renderMultipleTextInputs = (fields, questionId, disabled = false) => {
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
            <Box key={buildKey(`mt-${questionId}`, idx, field)}>
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
                  "&:before": { borderBottomColor: "#1976d2" },
                  "&:hover:before": { borderBottomColor: "#1976d2" },
                  "&:after": { borderBottomColor: "#1976d2" },
                }}
              />
            </Box>
          ))}
      </Box>
    );
  };

  // Extracted helper — removes nested ternary in renderValue
  const renderChips = (selected) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {selected.map((value) => (
        <Chip key={value} label={value} size="small" />
      ))}
    </Box>
  );

  // Extracted helper to compute visibility safely
  const isVisible = (clientId) =>
    visibleQuestions[clientId] !== undefined
      ? visibleQuestions[clientId]
      : true;

  // ==================== SHOW CONDITION HANDLERS ====================

  // Central dispatcher: routes updates to the right question (top vs sub)
  const updateQuestionFieldByScope = (
    isSubQuestion,
    { question, parentClientId, subClientId },
    field,
    value,
  ) => {
    if (isSubQuestion) {
      updateSubQuestion(parentClientId, subClientId, field, value);
    } else {
      updateQuestion(question.clientId, field, value);
    }
  };

  const applyShowConditionChange = (isSubQuestion, ctx, value) => {
    updateQuestionFieldByScope(isSubQuestion, ctx, "showCondition", value);
    if (value === "always") {
      updateQuestionFieldByScope(isSubQuestion, ctx, "dependsOnClientId", null);
      updateQuestionFieldByScope(isSubQuestion, ctx, "showWhenOption", "");
    }
    setForceUpdate((prev) => !prev);
  };

  const applyDependsOnChange = (isSubQuestion, ctx, value) => {
    updateQuestionFieldByScope(isSubQuestion, ctx, "dependsOnClientId", value);
    updateQuestionFieldByScope(isSubQuestion, ctx, "showWhenOption", "");
    setForceUpdate((prev) => !prev);
  };

  const applyShowWhenOptionChange = (isSubQuestion, ctx, rawValue) => {
    const value = Array.isArray(rawValue) ? rawValue.join(",") : rawValue;
    updateQuestionFieldByScope(isSubQuestion, ctx, "showWhenOption", value);
  };

  // ==================== RENDER: OPTIONS EDITOR ====================

  const renderOptions = (
    question,
    isSubQuestion = false,
    parentClientId = null,
    subClientId = null,
  ) => {
    const questionTypeValue = getQuestionTypeValue(question.questionTypeId);
    const showMaxSelections = MULTI_CHOICE_TYPES.includes(questionTypeValue);
    const scopeClientId = isSubQuestion ? parentClientId : question.clientId;

    if (OPTION_BASED_TYPES.includes(questionTypeValue)) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Options:
          </Typography>
          {(question.options || [""]).map((option, index) => (
            <Box
              key={buildKey(
                `opt-${scopeClientId}-${subClientId || "root"}`,
                index,
                option,
              )}
              sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}
            >
              <TextField
                size="small"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) =>
                  updateOption(
                    scopeClientId,
                    index,
                    e.target.value,
                    isSubQuestion,
                    subClientId,
                  )
                }
                fullWidth
                error={!option && formik.submitCount > 0}
                helperText={
                  !option && formik.submitCount > 0 ? "Option is required" : ""
                }
              />
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  deleteOption(scopeClientId, index, isSubQuestion, subClientId)
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
            onClick={() => addOption(scopeClientId, isSubQuestion, subClientId)}
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
              <Typography variant="subtitle2" gutterBottom>
                Selection Limit
              </Typography>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Max selections allowed</InputLabel>
                <Select
                  value={question.maxSelections || 0}
                  label="Max selections allowed"
                  onChange={(e) =>
                    isSubQuestion
                      ? updateSubQuestion(
                          parentClientId,
                          subClientId,
                          "maxSelections",
                          e.target.value,
                        )
                      : updateQuestion(
                          question.clientId,
                          "maxSelections",
                          e.target.value,
                        )
                  }
                >
                  <MenuItem value={0}>No limit</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <MenuItem key={n} value={n}>
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

    if (questionTypeValue === "multipleText") {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Text Fields:
          </Typography>
          {(question.multipleTextFields || [""]).map((field, index) => (
            <Box
              key={buildKey(
                `mtf-${scopeClientId}-${subClientId || "root"}`,
                index,
                field,
              )}
              sx={{ display: "flex", gap: 1, mb: 1 }}
            >
              <TextField
                size="small"
                placeholder={`Field ${index + 1} label`}
                value={field}
                onChange={(e) =>
                  updateMultipleTextField(
                    scopeClientId,
                    index,
                    e.target.value,
                    isSubQuestion,
                    subClientId,
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
                    scopeClientId,
                    index,
                    isSubQuestion,
                    subClientId,
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
              addMultipleTextField(scopeClientId, isSubQuestion, subClientId)
            }
            sx={{ mt: 1 }}
          >
            Add Field
          </Button>
        </Box>
      );
    }

    if (questionTypeValue === "rating") {
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
                      parentClientId,
                      subClientId,
                      "ratingScale",
                      e.target.value,
                    )
                  : updateQuestion(
                      question.clientId,
                      "ratingScale",
                      e.target.value,
                    )
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
    }

    return null;
  };

  // ==================== RENDER: SHOW/HIDE CONDITION ====================

  const renderShowCondition = (
    question,
    isSubQuestion = false,
    parentClientId = null,
    subClientId = null,
  ) => {
    const showCondition = question.showCondition || "always";
    const dependsOnClientId = question.dependsOnClientId || null;
    const showWhenOption = question.showWhenOption || "";

    const ctx = { question, parentClientId, subClientId };
    const previousEligibleQuestions = getPreviousEligibleQuestions(
      question.clientId,
    );

    // Find dependent question's options + type
    const flat = flattenQuestions(formik.values.questions);
    const dependentQuestion = dependsOnClientId
      ? flat.find((q) => q.clientId === dependsOnClientId)
      : null;

    const dependentOptions =
      dependentQuestion?.options?.filter((opt) => opt && opt.trim() !== "") ||
      [];
    const dependentQuestionType = dependentQuestion
      ? getQuestionTypeValue(dependentQuestion.questionTypeId)
      : null;

    const selectedTriggerOptions = parseShowWhenOptions(showWhenOption);
    const isMultipleOptionParent = MULTI_CHOICE_TYPES.includes(
      dependentQuestionType,
    );

    return (
      <Box sx={{ mt: 2, p: 2, borderRadius: 1 }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <PlaylistAddIcon fontSize="small" />
          Show/Hide Condition
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Show Condition</InputLabel>
              <Select
                value={showCondition}
                label="Show Condition"
                onChange={(e) =>
                  applyShowConditionChange(isSubQuestion, ctx, e.target.value)
                }
              >
                <MenuItem value="always">Always Show</MenuItem>
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
                    onChange={(e) =>
                      applyDependsOnChange(isSubQuestion, ctx, e.target.value)
                    }
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
                                {displayLabel}: {q.questionText || "Untitled"} (
                                {optionsCount} options)
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
                      Choice (Checkbox), Single Select Dropdown or Multi-Select
                      Dropdown question with options first.
                    </Typography>
                  )}
                  {dependsOnClientId && (
                    <Typography
                      variant="caption"
                      color="info"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Selected: {getQuestionTextForClientId(dependsOnClientId)}
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
                      applyShowWhenOptionChange(
                        isSubQuestion,
                        ctx,
                        e.target.value,
                      )
                    }
                    input={
                      isMultipleOptionParent ? (
                        <OutlinedInput label="Select Options to Show" />
                      ) : undefined
                    }
                    renderValue={
                      isMultipleOptionParent ? renderChips : undefined
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
                      <MenuItem key={option} value={option}>
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
  };

  // ==================== RENDER: PREVIEW ====================

  const renderPreviewOptions = (question, questionId = null) => {
    const questionTypeValue = getQuestionTypeValue(question.questionTypeId);
    if (!questionTypeValue) return null;

    const qid = questionId || question.clientId;

    switch (questionTypeValue) {
      case "radio":
        return (
          <RadioGroup
            value={dropdownValues[qid] || ""}
            onChange={(e) =>
              setDropdownValues((prev) => ({
                ...prev,
                [qid]: e.target.value,
              }))
            }
          >
            {(question.options || [""]).map((opt, idx) => (
              <FormControlLabel
                key={buildKey(`pv-radio-${qid}`, idx, opt)}
                value={opt}
                control={<Radio />}
                label={opt || `Option ${idx + 1}`}
              />
            ))}
          </RadioGroup>
        );

      case "checkbox": {
        const currentSelected = multiSelectValues[qid] || [];
        const maxSel = question.maxSelections || 0;
        const limitReached = maxSel > 0 && currentSelected.length >= maxSel;
        return (
          <FormGroup>
            {(question.options || [""]).map((opt, idx) => {
              const checked = currentSelected.includes(opt);
              const optionDisabled = limitReached && !checked;
              return (
                <FormControlLabel
                  key={buildKey(`pv-cb-${qid}`, idx, opt)}
                  disabled={optionDisabled}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        setMultiSelectValues((prev) => {
                          const existing = prev[qid] || [];
                          let next;
                          if (e.target.checked) {
                            next =
                              maxSel > 0 && existing.length >= maxSel
                                ? existing
                                : [...existing, opt];
                          } else {
                            next = existing.filter((v) => v !== opt);
                          }
                          return { ...prev, [qid]: next };
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

      case "dropdown":
        return renderUnderlinedDropdown(question.options || [], qid, false);

      case "multiSelect":
        return renderOriginalMultiSelect(
          question.options || [],
          qid,
          false,
          question.maxSelections || 0,
        );

      case "multipleText":
        return renderMultipleTextInputs(
          question.multipleTextFields || [],
          qid,
          false,
        );

      case "rating":
        return renderRatingStars(
          question.ratingScale || 5,
          ratingValues[qid] || 0,
          (value) => setRatingValues((prev) => ({ ...prev, [qid]: value })),
          false,
        );

      case "text":
        return renderUnderlinedTextInput(qid, false, false, null);

      case "textarea":
        return renderUnderlinedTextInput(qid, false, true, null);

      case "date":
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
  };

  // ==================== RENDER: SUB-QUESTION EDITOR ====================

  const renderSubQuestionEditor = (parentQuestion, sub, subIndex) => (
    <Paper key={sub.clientId} variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Sub-question {subIndex + 1}
        </Typography>
        <IconButton
          size="small"
          color="error"
          onClick={() =>
            deleteSubQuestion(parentQuestion.clientId, sub.clientId)
          }
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
                parentQuestion.clientId,
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
                  parentQuestion.clientId,
                  sub.clientId,
                  "questionTypeId",
                  newTypeId,
                );
                const newTypeValue = getQuestionTypeValue(newTypeId);
                if (newTypeValue && OPTION_BASED_TYPES.includes(newTypeValue)) {
                  if (!sub.options || sub.options.length === 0) {
                    updateSubQuestion(
                      parentQuestion.clientId,
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
                      parentQuestion.clientId,
                      sub.clientId,
                      "maxSelections",
                      0,
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
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={sub.required}
                onChange={(e) =>
                  updateSubQuestion(
                    parentQuestion.clientId,
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
            {renderOptions(sub, true, parentQuestion.clientId, sub.clientId)}
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PlaylistAddIcon
                  color={
                    sub.showCondition !== "always" ? "primary" : "disabled"
                  }
                />
                <Typography variant="caption">
                  Show/Hide{" "}
                  {sub.showCondition !== "always"
                    ? "(Custom)"
                    : "(Always Show)"}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {renderShowCondition(
                sub,
                true,
                parentQuestion.clientId,
                sub.clientId,
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Paper>
  );

  // ==================== RENDER: QUESTION FORM ====================

  const renderQuestionForm = (question, index) => {
    const currentQuestionTypeValue = getQuestionTypeValue(
      question.questionTypeId,
    );
    const hasSubQuestions = question.subQuestions?.length > 0;

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
            disabled={formik.values.questions.length === 1}
            size="small"
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
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl
              fullWidth
              size="small"
              error={
                formik.touched.questions?.[index]?.questionTypeId &&
                Boolean(formik.errors.questions?.[index]?.questionTypeId) &&
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
                  const newTypeValue = getQuestionTypeValue(newTypeId);
                  if (
                    newTypeValue &&
                    OPTION_BASED_TYPES.includes(newTypeValue)
                  ) {
                    if (!question.options || question.options.length === 0) {
                      updateQuestion(question.clientId, "options", [""]);
                    }
                    if (
                      MULTI_CHOICE_TYPES.includes(newTypeValue) &&
                      question.maxSelections === undefined
                    ) {
                      updateQuestion(question.clientId, "maxSelections", 0);
                    }
                  } else if (newTypeValue === "multipleText") {
                    if (
                      !question.multipleTextFields ||
                      question.multipleTextFields.length === 0
                    ) {
                      updateQuestion(question.clientId, "multipleTextFields", [
                        "",
                      ]);
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
                    Show/Hide Condition{" "}
                    {question.showCondition !== "always"
                      ? "(Custom)"
                      : "(Always Show)"}
                  </Typography>
                  {question.showCondition !== "always" &&
                    question.dependsOnClientId && (
                      <Chip
                        label={`Depends on ${getLabelForClientId(
                          question.dependsOnClientId,
                        )}`}
                        size="small"
                        color="secondary"
                      />
                    )}
                  {question.showCondition === "option" &&
                    question.showWhenOption && (
                      <Chip
                        label={`Show when: ${parseShowWhenOptions(
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

          {!currentQuestionTypeValue && (
            <>
              {hasSubQuestions && (
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  {question.subQuestions.map((sub, subIndex) =>
                    renderSubQuestionEditor(question, sub, subIndex),
                  )}
                </Grid>
              )}
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
            </>
          )}
        </Grid>
      </Paper>
    );
  };

  // ==================== RENDER: PREVIEW ====================

  const renderPreviewQuestion = (question, index) => {
    const questionTypeValue = getQuestionTypeValue(question.questionTypeId);
    const questionIsVisible = isVisible(question.clientId);
    if (!questionIsVisible) return null;

    const hasSubQuestions = (question.subQuestions || []).length > 0;
    if (!questionTypeValue && !hasSubQuestions) return null;

    return (
      <Box key={question.clientId} sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          {index + 1}. {question.questionText || "Untitled Question"}
          {question.required && <span style={{ color: "red" }}> *</span>}
        </Typography>

        {question.showCondition !== "always" && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Chip
              icon={<PlaylistAddIcon />}
              label={`Depends on ${getLabelForClientId(
                question.dependsOnClientId,
              )}`}
              size="small"
              color="secondary"
            />
            {question.showCondition === "option" && question.showWhenOption && (
              <Chip
                label={`Show when: ${parseShowWhenOptions(
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
                sub.questionTypeId,
              );
              const subIsVisible = isVisible(sub.clientId);
              if (!subIsVisible) return null;
              if (!subQuestionTypeValue) return null;

              return (
                <Box key={sub.clientId} sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {index + 1}.{subIndex + 1}{" "}
                    {sub.questionText || "Untitled Sub-question"}
                    {sub.required && <span style={{ color: "red" }}> *</span>}
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
                        label={`Depends on ${getLabelForClientId(
                          sub.dependsOnClientId,
                        )}`}
                        size="small"
                        color="secondary"
                      />
                      {sub.showCondition === "option" && sub.showWhenOption && (
                        <Chip
                          label={`Show when: ${parseShowWhenOptions(
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
  };

  // ==================== RENDER: PARENT RETURN ====================

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
            <Grid size={{ xs: 12, md: 6 }}>
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

          {formik.values.questions.map((question, index) =>
            renderPreviewQuestion(question, index),
          )}

          {formik.values.questions.length > 0 &&
            Object.values(visibleQuestions).every((v) => v === false) &&
            formik.values.questions.some(
              (q) => q.showCondition === "option" && q.dependsOnClientId,
            ) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No questions are currently visible. Please select options above
                to reveal conditional questions.
              </Typography>
            )}
        </Paper>
      </Box>
    </Paper>
  );
};

export default GenerateTracerIndex;
