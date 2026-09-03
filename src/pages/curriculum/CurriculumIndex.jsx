import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Link,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LaunchIcon from "@mui/icons-material/Launch";
import EditIcon from "@mui/icons-material/Edit";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FileUpload from "../../components/file/FileUpload";
import CurriculumIndexService from "../../api/services/internal/course/CurriculumIndexService";
import CommonService from "../../api/services/internal/common/CommonService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";
import NcsService from "../../api/services/internal/ncs/NcsService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Helper component for required field indicator
const RequiredStar = () => (
  <Typography component="span" sx={{ color: "red" }}>
    *
  </Typography>
);

// Helper function to convert file to base64
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result.split(",")[1],
        contentType: file.type || "application/octet-stream",
      });
    reader.onerror = reject;
  });

// Helper function to extract numeric value from duration string
const extractNumericValue = (durationString) => {
  if (!durationString) return 0;
  const match = durationString.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

// ==================== DURATION VALIDATION HELPERS ====================

// Helper to get minimum hours based on certificate level
const getMinHoursForCertificateLevel = (levelName) => {
  if (!levelName) return 0;
  const lowerName = levelName.toLowerCase();
  if (lowerName.includes("diploma") || lowerName.includes("advanced diploma")) {
    return 2400;
  }
  if (lowerName.includes("certificate")) {
    return 400;
  }
  return 0;
};

// Helper to determine if all durations are present
const areAllDurationsPresent = (values) => {
  const {
    totalProgramDuration,
    totalTheoryDuration,
    totalPracticalDuration,
    totalOjtDuration,
  } = values;
  return !!(
    totalProgramDuration &&
    totalTheoryDuration &&
    totalPracticalDuration &&
    totalOjtDuration
  );
};

// Helper to get BQF validation result
const getBQFValidationResult = (
  totalNum,
  certificateLevelId,
  certificateLevels,
) => {
  if (!certificateLevelId) {
    return {
      isValid: false,
      message: "Please select a valid certificate level",
      color: "#e65100",
    };
  }

  const level = certificateLevels.find(
    (l) => l.id === parseInt(certificateLevelId),
  );

  if (!level) {
    return {
      isValid: false,
      message: "Please select a valid certificate level",
      color: "#e65100",
    };
  }

  const minHours = getMinHoursForCertificateLevel(level.name);

  if (minHours === 0) {
    return {
      isValid: false,
      message: `No minimum hours defined for ${level.name}`,
      color: "#e65100",
    };
  }

  const isValid = totalNum >= minHours;
  const message = isValid
    ? `✅ Valid: ${totalNum} hours meets the minimum requirement of ${minHours} hours for ${level.name}`
    : `⚠️ Warning: ${totalNum} hours is less than ${minHours} hours. ${level.name} must be at least ${minHours} hours.`;
  const color = isValid ? "#2e7d32" : "#c62828";

  return { isValid, message, color };
};

// Helper to get Non-BQF validation result
const getNonBQFValidationResult = (totalNum) => {
  const isValid = totalNum >= 140;
  const message = isValid
    ? `✅ Valid: ${totalNum} hours meets the minimum requirement of 140 hours for Non-BQF Programme`
    : `⚠️ Warning: ${totalNum} hours is less than 140 hours. Non-BQF Programme must be at least 140 hours.`;
  const color = isValid ? "#2e7d32" : "#c62828";
  return { isValid, message, color };
};

// Helper to get default validation result
const getDefaultValidationResult = () => ({
  isValid: false,
  message: "Please select Programme Type and Certificate Level",
  color: "#e65100",
});

// Helper to determine programme type
const getProgrammeType = (programmeTypeId) => {
  const id = parseInt(programmeTypeId);
  if (id === 41) return "BQF";
  if (id === 42) return "NON_BQF";
  return "UNKNOWN";
};

// Helper to get background color based on validation color
const getBackgroundColor = (color) => {
  if (color === "#2e7d32") return "#e8f5e9";
  if (color === "#c62828") return "#ffebee";
  return "#fff3e0";
};

// Helper to get border color based on validation color
const getBorderColor = (color) => {
  if (color === "#2e7d32") return "#a5d6a7";
  if (color === "#c62828") return "#ef9a9a";
  return "#ffccbc";
};

// Helper to get validation result based on programme type
const getValidationResult = (
  programmeType,
  totalNum,
  certificateLevelId,
  certificateLevels,
) => {
  switch (programmeType) {
    case "BQF":
      return getBQFValidationResult(
        totalNum,
        certificateLevelId,
        certificateLevels,
      );
    case "NON_BQF":
      return getNonBQFValidationResult(totalNum);
    default:
      return getDefaultValidationResult();
  }
};

// Helper to get paper styles
const getPaperStyles = (color) => ({
  bgcolor: getBackgroundColor(color),
  color: color,
  border: `1px solid ${getBorderColor(color)}`,
});

// ==================== DURATION DISTRIBUTION VALIDATION ====================

// Helper to validate BQF duration distribution
const validateBQFDurationDistribution = (
  totalNum,
  theoryNum,
  practicalNum,
  ojtNum,
  certificateLevelId,
  certificateLevels,
) => {
  if (!certificateLevelId || totalNum === 0) {
    return { isValid: true, message: "", color: "#2e7d32" };
  }

  const level = certificateLevels.find(
    (l) => l.id === parseInt(certificateLevelId),
  );

  if (!level) {
    return { isValid: true, message: "", color: "#2e7d32" };
  }

  const levelName = level.name.toLowerCase();
  const isDiploma =
    levelName.includes("diploma") || levelName.includes("advanced diploma");
  const isCertificate = levelName.includes("certificate");

  if (!isDiploma && !isCertificate) {
    return { isValid: true, message: "", color: "#2e7d32" };
  }

  const theoryPercentage = (theoryNum / totalNum) * 100;
  const practicalOjtPercentage = ((practicalNum + ojtNum) / totalNum) * 100;

  const requiredTheory = isDiploma ? 40 : 20;
  const requiredPracticalOjt = isDiploma ? 60 : 80;
  const levelType = isDiploma ? "Diploma/Advanced Diploma" : "Certificate";

  const tolerance = 0.5;
  const isValidTheory = theoryPercentage >= requiredTheory - tolerance;
  const isValidPractical =
    practicalOjtPercentage <= requiredPracticalOjt + tolerance;
  const isValid = isValidTheory && isValidPractical;

  let message = "";
  let color = "#2e7d32";

  if (!isValid) {
    color = "#c62828";
    const issues = [];
    if (!isValidTheory) {
      issues.push(
        `Theory ${theoryPercentage.toFixed(1)}% (minimum ${requiredTheory}%)`,
      );
    }
    if (!isValidPractical) {
      issues.push(
        `Practical+OJT ${practicalOjtPercentage.toFixed(1)}% (maximum ${requiredPracticalOjt}%)`,
      );
    }
    message = `❌ Invalid distribution for ${levelType}: ${issues.join("; ")}`;
  } else {
    // Check if practical+OJT is too low (optional warning)
    const minPracticalOjtPercentage = requiredPracticalOjt - 30;
    if (practicalOjtPercentage < minPracticalOjtPercentage) {
      color = "#e65100";
      message = `⚠️ Practical+OJT ${practicalOjtPercentage.toFixed(1)}% is low (expected ~${requiredPracticalOjt}%) for ${levelType}`;
    } else {
      message = `✅ Valid distribution for ${levelType}: Theory ${theoryPercentage.toFixed(1)}% (min ${requiredTheory}%), Practical+OJT ${practicalOjtPercentage.toFixed(1)}% (max ${requiredPracticalOjt}%)`;
    }
  }

  return { isValid, message, color };
};

// Helper to render duration distribution validation
const renderDurationDistributionValidation = (values, certificateLevels) => {
  const { programmeTypeId, totalProgramDuration, certificateLevelId } = values;

  if (
    parseInt(programmeTypeId) !== 41 ||
    !totalProgramDuration ||
    !certificateLevelId
  ) {
    return null;
  }

  const totalNum = extractNumericValue(totalProgramDuration);
  if (totalNum === 0) return null;

  const theoryNum = extractNumericValue(values.totalTheoryDuration);
  const practicalNum = extractNumericValue(values.totalPracticalDuration);
  const ojtNum = extractNumericValue(values.totalOjtDuration);

  const result = validateBQFDurationDistribution(
    totalNum,
    theoryNum,
    practicalNum,
    ojtNum,
    certificateLevelId,
    certificateLevels,
  );

  if (!result.message) return null;

  const paperStyles = getPaperStyles(result.color);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        ...paperStyles,
      }}
    >
      <Typography variant="body2" fontWeight="bold">
        {result.message}
      </Typography>
      <Typography variant="caption">
        Total: {totalNum} hours | Theory: {theoryNum} hours | Practical:{" "}
        {practicalNum} hours | OJT: {ojtNum} hours
      </Typography>
    </Paper>
  );
};

// ==================== EXTRACTED HELPER FUNCTIONS ====================

// Populate curriculum fields for endorse
const populateEndorseFields = (
  selected,
  formik,
  setSelectedSectorId,
  setOccupations,
  fetchOccupationsBySector,
  fetchCertificateLevels,
  fetchProgrammeTitleForEndorse,
) => {
  if (!selected) return;

  formik.setFieldValue("curriculumTitle", selected.curriculum_title);
  formik.setFieldValue("endorseApplicationNo", selected.application_no);
  formik.setFieldValue("programmeTypeId", selected.programme_type_id || "");
  formik.setFieldValue("description", selected.description || "");
  formik.setFieldValue(
    "certificateLevelId",
    selected.certificate_level_id || "",
  );
  formik.setFieldValue("entryRequirement", selected.entry_requirement || "");
  formik.setFieldValue(
    "totalTheoryDuration",
    selected.total_theory_duration || "",
  );
  formik.setFieldValue(
    "totalPracticalDuration",
    selected.total_practical_duration || "",
  );
  formik.setFieldValue("totalOjtDuration", selected.total_ojt_duration || "");
  formik.setFieldValue(
    "totalProgramDuration",
    selected.total_program_duration || "",
  );

  const sectorId = selected.sector_id || "";
  const occupationId = selected.occupation_id || "";
  formik.setFieldValue("sectorId", sectorId);
  formik.setFieldValue("occupationId", occupationId);

  populateProgrammeTypeFields(selected, formik, fetchProgrammeTitleForEndorse);

  fetchRelatedData(
    sectorId,
    selected,
    setSelectedSectorId,
    setOccupations,
    fetchOccupationsBySector,
    fetchCertificateLevels,
  );

  showAutoFillSuccessMessage(sectorId, occupationId, selected);
};

// Populate programme type specific fields
const populateProgrammeTypeFields = (
  selected,
  formik,
  fetchProgrammeTitleForEndorse,
) => {
  const programmeTypeId = parseInt(selected.programme_type_id);

  if (programmeTypeId === 41 && selected.programme_id) {
    formik.setFieldValue("ncsId", selected.programme_id);
    fetchProgrammeTitleForEndorse(selected.programme_id, formik.setFieldValue);
  } else if (programmeTypeId === 42) {
    formik.setFieldValue("programmeTitle", selected.programme_title || "");
    formik.setFieldValue("ncsId", "");
  } else {
    formik.setFieldValue("programmeTitle", "");
    formik.setFieldValue("ncsId", "");
  }
};

// Fetch related data (occupations and certificate levels)
const fetchRelatedData = (
  sectorId,
  selected,
  setSelectedSectorId,
  setOccupations,
  fetchOccupationsBySector,
  fetchCertificateLevels,
) => {
  if (sectorId) {
    fetchOccupationsBySector(sectorId);
    setSelectedSectorId(() => sectorId);
  } else {
    setOccupations(() => []);
    setSelectedSectorId(() => "");
  }

  if (selected.programme_type_id) {
    fetchCertificateLevels(parseInt(selected.programme_type_id));
  }
};

// Show auto-fill success message
const showAutoFillSuccessMessage = (sectorId, occupationId, selected) => {
  const filledFields = [];
  if (sectorId) filledFields.push("Sector");
  if (occupationId) filledFields.push("Occupation");

  const programmeTypeId = parseInt(selected.programme_type_id);
  if (programmeTypeId === 41 && selected.programme_id) {
    filledFields.push("Programme ID");
    filledFields.push("Programme Title (fetching...)");
  } else if (programmeTypeId === 42 && selected.programme_title) {
    filledFields.push("Programme Title");
  }

  if (filledFields.length >= 2) {
    toast.success("Curriculum details auto-filled successfully!");
  } else if (filledFields.length > 0) {
    toast.info(
      `Auto-filled: ${filledFields.join(", ")}. Please fill in missing fields manually.`,
    );
  } else {
    toast.warning(
      "Curriculum details auto-filled. Please fill in missing fields manually.",
    );
  }
};

// Reset programme type fields
const resetProgrammeTypeFields = (
  formik,
  setSelectedSectorId,
  setOccupations,
  setNcsExists,
  setNcsData,
) => {
  formik.setFieldValue("certificateLevelId", "");
  formik.setFieldValue("sectorId", "");
  formik.setFieldValue("occupationId", "");
  formik.setFieldValue("curriculumTitle", "");
  formik.setFieldValue("programmeTitle", "");
  formik.setFieldValue("ncsId", "");
  setSelectedSectorId(() => "");
  setOccupations(() => []);
  setNcsExists(() => false);
  setNcsData(() => null);
};

// Reset sector fields
const resetSectorFields = (formik, setNcsExists, setNcsData) => {
  formik.setFieldValue("occupationId", "");
  formik.setFieldValue("curriculumTitle", "");
  formik.setFieldValue("programmeTitle", "");
  formik.setFieldValue("ncsId", "");
  setNcsExists(() => false);
  setNcsData(() => null);
};

// Check if NCS should be checked
const shouldCheckNcs = (isAdd, formik, occupationId) => {
  return (
    isAdd &&
    formik.values.sectorId &&
    occupationId &&
    formik.values.certificateLevelId
  );
};

// Check if NCS should be checked for certificate
const shouldCheckNcsForCertificate = (
  isAdd,
  isBQFCourse,
  formik,
  certificateLevelId,
) => {
  return (
    isAdd &&
    isBQFCourse &&
    formik.values.sectorId &&
    formik.values.occupationId &&
    certificateLevelId
  );
};

// Clear NCS fields
const clearNcsFields = (formik) => {
  formik.setFieldValue("curriculumTitle", "");
  formik.setFieldValue("programmeTitle", "");
  formik.setFieldValue("ncsId", "");
};

// Calculate total duration
const calculateTotalDuration = (theory, practical, ojt, setFieldValue) => {
  const theoryNum = extractNumericValue(theory);
  const practicalNum = extractNumericValue(practical);
  const ojtNum = extractNumericValue(ojt);

  const total = theoryNum + practicalNum + ojtNum;

  const hasHoursSuffix =
    (theory && theory.toLowerCase().includes("hour")) ||
    (practical && practical.toLowerCase().includes("hour")) ||
    (ojt && ojt.toLowerCase().includes("hour"));

  if (total > 0) {
    const formattedTotal = hasHoursSuffix ? `${total} hours` : `${total}`;
    setFieldValue("totalProgramDuration", formattedTotal);
  } else {
    setFieldValue("totalProgramDuration", "");
  }
};

// ==================== CURRICULUM FORM SUB-COMPONENT ====================

const CurriculumForm = ({
  formik,
  isEndorse = false,
  isAdd = false,
  isRevision = false,
  data,
  sectors,
  occupations,
  certificateLevels,
  curriculumTypes,
  programmeTypes,
  loading,
  endorseLoading,
  editLoading,
  loadingOccupations,
  isLoadingCertificateLevels,
  checkingExisting,
  ncsExists,
  ncsData,
  fetchOccupationsBySector,
  fetchCertificateLevels,
  fetchProgrammeTitleForEndorse,
  checkNcsExists,
  setSelectedSectorId,
  setOccupations,
  setNcsExists,
  setNcsData,
}) => {
  const isBQFCourse = parseInt(formik.values.programmeTypeId) === 41;
  const isNonBQFCourse = parseInt(formik.values.programmeTypeId) === 42;
  const isCurriculumTypeReadOnly = true;

  // Fetch programme title for revision when dialog opens
  useEffect(() => {
    if (
      isRevision &&
      isBQFCourse &&
      formik.values.ncsId &&
      !formik.values.programmeTitle
    ) {
      fetchProgrammeTitleForEndorse(formik.values.ncsId, formik.setFieldValue);
    }
  }, [
    isRevision,
    isBQFCourse,
    formik.values.ncsId,
    fetchProgrammeTitleForEndorse,
  ]);

  // Handle curriculum selection for endorse
  const handleEndorseCurriculumChange = (e) => {
    const selectedApplicationNo = e.target.value;
    formik.handleChange(e);

    const selected = data.find(
      (item) => item.application_no === selectedApplicationNo,
    );
    if (selected) {
      populateEndorseFields(
        selected,
        formik,
        setSelectedSectorId,
        setOccupations,
        fetchOccupationsBySector,
        fetchCertificateLevels,
        fetchProgrammeTitleForEndorse,
      );
    }
  };

  // Handle programme type change
  const handleProgrammeTypeChange = (e) => {
    const value = e.target.value;
    formik.handleChange(e);
    resetProgrammeTypeFields(
      formik,
      setSelectedSectorId,
      setOccupations,
      setNcsExists,
      setNcsData,
    );

    if (value) {
      fetchCertificateLevels(parseInt(value));
    } else {
      setCertificateLevels([]);
    }
  };

  // Handle sector change
  const handleSectorChange = async (e) => {
    const sectorId = e.target.value;
    formik.handleChange(e);
    setSelectedSectorId(() => sectorId);

    resetSectorFields(formik, setNcsExists, setNcsData);

    if (sectorId) {
      await fetchOccupationsBySector(sectorId);
    } else {
      setOccupations(() => []);
    }
  };

  // Handle occupation change
  const handleOccupationChange = async (e) => {
    const occupationId = e.target.value;
    formik.handleChange(e);
    setNcsExists(() => false);
    setNcsData(() => null);

    if (shouldCheckNcs(isAdd, formik, occupationId)) {
      await checkNcsExists(
        formik.values.sectorId,
        occupationId,
        formik.values.certificateLevelId,
        formik.setFieldValue,
      );
    } else {
      clearNcsFields(formik);
    }
  };

  // Handle certificate level change
  const handleCertificateLevelChange = async (e) => {
    const certificateLevelId = e.target.value;
    formik.handleChange(e);
    setNcsExists(() => false);
    setNcsData(() => null);

    if (
      shouldCheckNcsForCertificate(
        isAdd,
        isBQFCourse,
        formik,
        certificateLevelId,
      )
    ) {
      await checkNcsExists(
        formik.values.sectorId,
        formik.values.occupationId,
        certificateLevelId,
        formik.setFieldValue,
      );
    } else {
      clearNcsFields(formik);
    }
  };

  // Handle duration change
  const handleDurationChange = (field, value, formik) => {
    formik.handleChange({ target: { name: field, value } });
    calculateTotalDuration(
      field === "totalTheoryDuration"
        ? value
        : formik.values.totalTheoryDuration,
      field === "totalPracticalDuration"
        ? value
        : formik.values.totalPracticalDuration,
      field === "totalOjtDuration" ? value : formik.values.totalOjtDuration,
      formik.setFieldValue,
    );
  };

  // Get minimum hours info for display
  const getMinHoursInfo = () => {
    if (isNonBQFCourse) {
      return "Minimum 140 hours required";
    }
    if (isBQFCourse && formik.values.certificateLevelId) {
      const level = certificateLevels.find(
        (l) => l.id === parseInt(formik.values.certificateLevelId),
      );
      if (level) {
        const levelName = level.name.toLowerCase();
        if (
          levelName.includes("diploma") ||
          levelName.includes("advanced diploma")
        ) {
          return "Minimum 2400 hours required for Diploma/Advanced Diploma";
        }
        if (levelName.includes("certificate")) {
          return "Minimum 400 hours required for Certificate";
        }
      }
    }
    return "";
  };

  // Render duration validation message
  const renderDurationValidation = () => {
    const { programmeTypeId, certificateLevelId } = formik.values;

    if (!areAllDurationsPresent(formik.values)) {
      return null;
    }

    const totalNum = extractNumericValue(formik.values.totalProgramDuration);
    const programmeType = getProgrammeType(programmeTypeId);

    const { message, color } = getValidationResult(
      programmeType,
      totalNum,
      certificateLevelId,
      certificateLevels,
    );

    const paperStyles = getPaperStyles(color);

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          ...paperStyles,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {message}
        </Typography>
      </Paper>
    );
  };

  // Render duration distribution validation
  const renderDurationDistributionValidationUI = () => {
    return renderDurationDistributionValidation(
      formik.values,
      certificateLevels,
    );
  };

  // Render curriculum title field
  const renderCurriculumTitleField = () => {
    if (isEndorse) {
      return renderEndorseCurriculumTitle();
    }
    if (isRevision) {
      return renderRevisionCurriculumTitle();
    }
    return renderAddCurriculumTitle();
  };

  const renderEndorseCurriculumTitle = () => (
    <TextField
      select
      fullWidth
      label={
        <>
          Curriculum Title <RequiredStar />
        </>
      }
      name="endorseApplicationNo"
      size="small"
      value={formik.values.endorseApplicationNo || ""}
      onChange={handleEndorseCurriculumChange}
      onBlur={formik.handleBlur}
      error={
        formik.touched.endorseApplicationNo &&
        Boolean(formik.errors.endorseApplicationNo)
      }
      helperText={
        formik.touched.endorseApplicationNo &&
        formik.errors.endorseApplicationNo
      }
    >
      <MenuItem value="">-select-</MenuItem>
      {data
        .filter((item) => {
          const statusId = parseInt(item.status_id);
          const curriculumTypeId = parseInt(item.curriculum_type_id);
          return statusId === 57 && curriculumTypeId === 25;
        })
        .map((item) => (
          <MenuItem key={item.id} value={item.application_no}>
            {item.curriculum_title} ({item.application_no})
          </MenuItem>
        ))}
    </TextField>
  );

  const renderRevisionCurriculumTitle = () => (
    <TextField
      fullWidth
      label={
        <>
          Curriculum Title <RequiredStar />
        </>
      }
      name="curriculumTitle"
      size="small"
      value={formik.values.curriculumTitle || ""}
      slotProps={{
        input: {
          readOnly: true,
        },
      }}
      placeholder="Curriculum Title"
    />
  );

  const renderAddCurriculumTitle = () => (
    <TextField
      fullWidth
      label={
        <>
          Curriculum Title <RequiredStar />
        </>
      }
      name="curriculumTitle"
      size="small"
      value={formik.values.curriculumTitle || ""}
      onChange={isNonBQFCourse ? formik.handleChange : undefined}
      onBlur={isNonBQFCourse ? formik.handleBlur : undefined}
      error={
        formik.touched.curriculumTitle && Boolean(formik.errors.curriculumTitle)
      }
      helperText={
        formik.touched.curriculumTitle && formik.errors.curriculumTitle
      }
      slotProps={{
        input: {
          readOnly: isBQFCourse ? true : false,
        },
      }}
      placeholder={
        isBQFCourse
          ? "Auto-filled from NCS"
          : isNonBQFCourse
            ? "Enter Curriculum Title"
            : "Select Programme Type first"
      }
      disabled={!formik.values.programmeTypeId}
    />
  );

  // Render sector and occupation fields
  const renderSectorAndOccupationFields = () => {
    if (!isBQFCourse) return null;

    const isReadonly = isRevision || isEndorse;

    return (
      <>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label={
              <>
                Sector <RequiredStar />
              </>
            }
            name="sectorId"
            size="small"
            value={formik.values.sectorId || ""}
            onChange={handleSectorChange}
            onBlur={formik.handleBlur}
            error={formik.touched.sectorId && Boolean(formik.errors.sectorId)}
            helperText={formik.touched.sectorId && formik.errors.sectorId}
            slotProps={{
              input: {
                readOnly: isReadonly ? true : false,
              },
            }}
          >
            <MenuItem value="">Select Sector</MenuItem>
            {sectors.map((sector) => (
              <MenuItem key={sector.id} value={sector.id}>
                {sector.sectorName}
              </MenuItem>
            ))}
          </TextField>
          {isReadonly && (
            <Typography variant="caption" color="textSecondary">
              {isEndorse
                ? "Sector cannot be changed in Endorsement"
                : "Sector cannot be changed in Revision"}
            </Typography>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label={
              <>
                Occupation <RequiredStar />
              </>
            }
            name="occupationId"
            size="small"
            value={formik.values.occupationId || ""}
            onChange={handleOccupationChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.occupationId && Boolean(formik.errors.occupationId)
            }
            helperText={
              formik.touched.occupationId && formik.errors.occupationId
            }
            slotProps={{
              input: {
                readOnly: isReadonly ? true : false,
              },
            }}
          >
            <MenuItem value="">
              {loadingOccupations
                ? "Loading occupations..."
                : "Select Occupation"}
            </MenuItem>
            {occupations.map((occ) => (
              <MenuItem key={occ.id} value={occ.id}>
                {occ.occupationName}
              </MenuItem>
            ))}
          </TextField>
          {isReadonly && (
            <Typography variant="caption" color="textSecondary">
              {isEndorse
                ? "Occupation cannot be changed in Endorsement"
                : "Occupation cannot be changed in Revision"}
            </Typography>
          )}
        </Grid>
      </>
    );
  };

  // Render NCS status message
  const renderNcsStatusMessage = () => {
    if (!isAdd || !isBQFCourse) return null;

    if (ncsExists && ncsData) {
      return (
        <Typography
          variant="caption"
          color="success"
          sx={{ display: "block", mt: 0.5 }}
        >
          ✓ NCS found: "{ncsData.programme_title}" - Programme Title and
          Curriculum Title auto-filled
        </Typography>
      );
    }

    if (checkingExisting) {
      return (
        <Typography
          variant="caption"
          color="info"
          sx={{ display: "block", mt: 0.5 }}
        >
          Checking if NCS combination exists...
        </Typography>
      );
    }

    if (
      !ncsExists &&
      formik.values.sectorId &&
      formik.values.occupationId &&
      formik.values.certificateLevelId
    ) {
      return (
        <Typography
          variant="caption"
          color="warning"
          sx={{ display: "block", mt: 0.5 }}
        >
          ⚠ No NCS found for this combination - Please select different values
        </Typography>
      );
    }

    return null;
  };

  // Render programme type helper text
  const renderProgrammeTypeHelperText = () => {
    if (isBQFCourse) {
      return (
        <Typography variant="caption" color="info.main">
          BQF Course selected - Duration distribution rules apply
        </Typography>
      );
    }
    if (isNonBQFCourse) {
      return (
        <Typography variant="caption" color="info.main">
          Non-BQF Course selected - Minimum 140 hours required
        </Typography>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={2}>
      {/* Provider and Registration fields */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Name of Training Provider/Institution"
          name="providerName"
          size="small"
          value={formik.values.providerName}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Registration No"
          name="registrationNo"
          size="small"
          value={formik.values.registrationNo}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
      </Grid>

      {/* Curriculum Type */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          select
          fullWidth
          label={
            <>
              Curriculum Type <RequiredStar />
            </>
          }
          name="curriculumTypeId"
          size="small"
          value={formik.values.curriculumTypeId}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.curriculumTypeId &&
            Boolean(formik.errors.curriculumTypeId)
          }
          helperText={
            formik.touched.curriculumTypeId && formik.errors.curriculumTypeId
          }
          slotProps={{
            input: {
              readOnly: isCurriculumTypeReadOnly,
            },
          }}
        >
          <MenuItem value="">-select-</MenuItem>
          {curriculumTypes.map((type) => (
            <MenuItem key={type.id} value={type.id.toString()}>
              {type.service_name || type.name}
            </MenuItem>
          ))}
        </TextField>
        {isAdd && (
          <Typography variant="caption" color="textSecondary">
            Curriculum Type is set to Curriculum Development
          </Typography>
        )}
        {isEndorse && (
          <Typography variant="caption" color="textSecondary">
            Curriculum Type is set to Curriculum Endorsement
          </Typography>
        )}
        {isRevision && (
          <Typography variant="caption" color="textSecondary">
            Curriculum Type is set to Curriculum Revision
          </Typography>
        )}
      </Grid>

      {/* Curriculum Title */}
      <Grid size={{ xs: 12, md: 6 }}>{renderCurriculumTitleField()}</Grid>

      {/* Programme Type */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          select
          fullWidth
          label={
            <>
              Programme Type <RequiredStar />
            </>
          }
          name="programmeTypeId"
          size="small"
          value={formik.values.programmeTypeId}
          onChange={handleProgrammeTypeChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.programmeTypeId &&
            Boolean(formik.errors.programmeTypeId)
          }
          helperText={
            formik.touched.programmeTypeId && formik.errors.programmeTypeId
          }
          slotProps={{
            input: {
              readOnly: isRevision || isEndorse ? true : false,
            },
          }}
        >
          <MenuItem value="">-select-</MenuItem>
          {programmeTypes.map((type) => (
            <MenuItem key={type.id} value={type.id.toString()}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>
        {renderProgrammeTypeHelperText()}
        {(isRevision || isEndorse) && (
          <Typography variant="caption" color="textSecondary">
            {isEndorse
              ? "Programme Type cannot be changed in Endorsement"
              : "Programme Type cannot be changed in Revision"}
          </Typography>
        )}
      </Grid>

      {/* Sector and Occupation */}
      {renderSectorAndOccupationFields()}

      {/* Certificate Level */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          select
          fullWidth
          label={
            <>
              Certificate Level <RequiredStar />
            </>
          }
          name="certificateLevelId"
          size="small"
          value={formik.values.certificateLevelId}
          onChange={handleCertificateLevelChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.certificateLevelId &&
            Boolean(formik.errors.certificateLevelId)
          }
          helperText={
            formik.touched.certificateLevelId &&
            formik.errors.certificateLevelId
          }
          slotProps={{
            input: {
              readOnly: isRevision || isEndorse ? true : false,
            },
          }}
        >
          <MenuItem value="">-select-</MenuItem>
          {certificateLevels.map((level) => (
            <MenuItem key={level.id} value={level.id.toString()}>
              {level.name}
            </MenuItem>
          ))}
        </TextField>
        {!formik.values.programmeTypeId && (
          <Typography variant="caption" color="textSecondary">
            Please select a course type first
          </Typography>
        )}
        {isLoadingCertificateLevels && (
          <Typography variant="caption" color="textSecondary">
            Loading certificate levels...
          </Typography>
        )}
        {(isRevision || isEndorse) && (
          <Typography variant="caption" color="textSecondary">
            {isEndorse
              ? "Certificate Level cannot be changed in Endorsement"
              : "Certificate Level cannot be changed in Revision"}
          </Typography>
        )}
        {renderNcsStatusMessage()}
      </Grid>

      {/* Programme Title */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label={
            <>
              Programme Title <RequiredStar />
            </>
          }
          name="programmeTitle"
          size="small"
          value={formik.values.programmeTitle || ""}
          onChange={
            isNonBQFCourse && !isEndorse && !isRevision
              ? formik.handleChange
              : undefined
          }
          onBlur={
            isNonBQFCourse && !isEndorse && !isRevision
              ? formik.handleBlur
              : undefined
          }
          error={
            formik.touched.programmeTitle &&
            Boolean(formik.errors.programmeTitle)
          }
          helperText={
            formik.touched.programmeTitle && formik.errors.programmeTitle
          }
          slotProps={{
            input: {
              readOnly: isBQFCourse || isEndorse || isRevision ? true : false,
            },
          }}
          placeholder={
            isBQFCourse
              ? "Auto-filled from NCS"
              : isNonBQFCourse
                ? "Enter Programme Title"
                : "Select Programme Type first"
          }
        />
        {(isEndorse || isRevision) && (
          <Typography variant="caption" color="textSecondary">
            {isEndorse
              ? "Programme Title cannot be changed in Endorsement"
              : "Programme Title cannot be changed in Revision"}
          </Typography>
        )}
      </Grid>

      {/* Duration Fields */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label={
            <>
              Total Theory Duration <RequiredStar />
            </>
          }
          name="totalTheoryDuration"
          size="small"
          placeholder="e.g., 120 hours"
          value={formik.values.totalTheoryDuration}
          onChange={(e) =>
            !isEndorse && !isRevision
              ? handleDurationChange(
                  "totalTheoryDuration",
                  e.target.value,
                  formik,
                )
              : undefined
          }
          onBlur={formik.handleBlur}
          error={
            formik.touched.totalTheoryDuration &&
            Boolean(formik.errors.totalTheoryDuration)
          }
          helperText={
            formik.touched.totalTheoryDuration &&
            formik.errors.totalTheoryDuration
          }
          slotProps={{
            input: {
              readOnly: isEndorse || isRevision ? true : false,
            },
          }}
        />
        {(isEndorse || isRevision) && (
          <Typography variant="caption" color="textSecondary">
            {isEndorse
              ? "Total Theory Duration cannot be changed in Endorsement"
              : "Total Theory Duration cannot be changed in Revision"}
          </Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          fullWidth
          label={
            <>
              Total Practical Duration <RequiredStar />
            </>
          }
          name="totalPracticalDuration"
          size="small"
          placeholder="e.g., 80 hours"
          value={formik.values.totalPracticalDuration}
          onChange={(e) =>
            !isEndorse && !isRevision
              ? handleDurationChange(
                  "totalPracticalDuration",
                  e.target.value,
                  formik,
                )
              : undefined
          }
          onBlur={formik.handleBlur}
          error={
            formik.touched.totalPracticalDuration &&
            Boolean(formik.errors.totalPracticalDuration)
          }
          helperText={
            formik.touched.totalPracticalDuration &&
            formik.errors.totalPracticalDuration
          }
          slotProps={{
            input: {
              readOnly: isEndorse || isRevision ? true : false,
            },
          }}
        />
        {(isEndorse || isRevision) && (
          <Typography variant="caption" color="textSecondary">
            {isEndorse
              ? "Total Practical Duration cannot be changed in Endorsement"
              : "Total Practical Duration cannot be changed in Revision"}
          </Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          fullWidth
          label={
            <>
              Total OJT Duration <RequiredStar />
            </>
          }
          name="totalOjtDuration"
          size="small"
          placeholder="e.g., 40 hours"
          value={formik.values.totalOjtDuration}
          onChange={(e) =>
            !isEndorse && !isRevision
              ? handleDurationChange("totalOjtDuration", e.target.value, formik)
              : undefined
          }
          onBlur={formik.handleBlur}
          error={
            formik.touched.totalOjtDuration &&
            Boolean(formik.errors.totalOjtDuration)
          }
          helperText={
            formik.touched.totalOjtDuration && formik.errors.totalOjtDuration
          }
          slotProps={{
            input: {
              readOnly: isEndorse || isRevision ? true : false,
            },
          }}
        />
        {(isEndorse || isRevision) && (
          <Typography variant="caption" color="textSecondary">
            {isEndorse
              ? "Total OJT Duration cannot be changed in Endorsement"
              : "Total OJT Duration cannot be changed in Revision"}
          </Typography>
        )}
      </Grid>

      {/* Total Program Duration */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Total Program Duration (Auto-calculated)"
          name="totalProgramDuration"
          size="small"
          value={formik.values.totalProgramDuration}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          placeholder="Will be auto-calculated"
          helperText={`Auto-calculated from Theory + Practical + OJT durations ${
            getMinHoursInfo() ? `- ${getMinHoursInfo()}` : ""
          }`}
        />
      </Grid>

      {/* Duration Validation Message */}
      <Grid size={{ xs: 12 }}>{renderDurationValidation()}</Grid>

      {/* Duration Distribution Validation Message */}
      <Grid size={{ xs: 12 }}>{renderDurationDistributionValidationUI()}</Grid>

      {/* Entry Requirement */}
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label={
            <>
              Entry Requirement <RequiredStar />
            </>
          }
          name="entryRequirement"
          size="small"
          value={formik.values.entryRequirement}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.entryRequirement &&
            Boolean(formik.errors.entryRequirement)
          }
          helperText={
            formik.touched.entryRequirement && formik.errors.entryRequirement
          }
          slotProps={{
            input: {
              readOnly: isEndorse ? true : false,
            },
          }}
        />
        {isEndorse && (
          <Typography variant="caption" color="textSecondary">
            Entry Requirement cannot be changed in Endorsement
          </Typography>
        )}
      </Grid>

      {/* Description */}
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label={
            <>
              Curriculum Description <RequiredStar />
            </>
          }
          name="description"
          size="small"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.description && Boolean(formik.errors.description)
          }
          helperText={formik.touched.description && formik.errors.description}
          slotProps={{
            input: {
              readOnly: isEndorse ? true : false,
            },
          }}
        />
        {isEndorse && (
          <Typography variant="caption" color="textSecondary">
            Description cannot be changed in Endorsement
          </Typography>
        )}
      </Grid>

      {/* File Upload */}
      <Grid size={{ xs: 12 }}>
        <FileUpload
          files={formik.values.files}
          onFilesChange={(files) => formik.setFieldValue("files", files)}
          error={formik.touched.files && Boolean(formik.errors.files)}
          helperText={formik.touched.files && formik.errors.files}
        />
      </Grid>
    </Grid>
  );
};

// ==================== MAIN COMPONENT ====================

const CurriculumIndex = () => {
  const [search, setSearch] = useState("");
  const [curriculumTypeFilter, setCurriculumTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEndorseDialog, setOpenEndorseDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [programmeTypes, setProgrammeTypes] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [data, setData] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [endorseLoading, setEndorseLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const [isLoadingCertificateLevels, setIsLoadingCertificateLevels] =
    useState(false);
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [dropdownData, setDropdownData] = useState([]);

  // State for Sector and Occupation dropdowns
  const [sectors, setSectors] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState("");

  // State for checking existing NCS
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [ncsExists, setNcsExists] = useState(false);
  const [ncsData, setNcsData] = useState(null);

  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const status = dropdownData.find((item) => item.id === parseInt(statusId));
    return status ? status.name : "Pending";
  };

  // Check if revision is allowed (only for status 59 - Endorsed)
  const isRevisionAllowed = (statusId) => {
    return parseInt(statusId) === 59;
  };

  const getDocumentLinks = (documentsStr) => {
    if (!documentsStr) return [];
    try {
      const docs = JSON.parse(documentsStr);
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.documentName,
        url: doc.url,
        createdAt: doc.createdAt,
      }));
    } catch (error) {
      console.error("Error parsing documents:", error);
      return [];
    }
  };

  const handleDownload = async (file) => {
    if (!file.url) {
      toast.error("File URL not found");
      return;
    }

    setDownloading(true);
    try {
      const response = await CommonService.fetchDocument(file.name, file.url);
      const contentType = response.headers["content-type"];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to download file. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  // ==================== DATA FETCHING FUNCTIONS ====================

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      console.log("Sectors Response:", response.data);
      setSectors(response.data || []);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    if (!sectorId) {
      setOccupations(() => []);
      return;
    }
    setLoadingOccupations(true);
    try {
      const sector = sectors.find((s) => s.id === parseInt(sectorId));
      console.log("Found sector for occupations:", sector);

      if (sector && sector.child && sector.child.length > 0) {
        const occupationsData = sector.child.map((child) => ({
          id: child.id,
          occupationName:
            child.occupationName || child.name || `Occupation ${child.id}`,
        }));
        setOccupations(() => occupationsData);
        console.log("Occupations from sector child:", occupationsData);
      } else {
        try {
          const response =
            await CommonService.getOccupationsBySectorId(sectorId);
          const occData = response.data || [];
          setOccupations(() => occData);
          console.log("Occupations from API:", occData);
        } catch (apiError) {
          console.error("API fallback failed:", apiError);
          setOccupations(() => []);
        }
      }
    } catch (error) {
      console.error("Error fetching occupations:", error);
      toast.error("Failed to fetch occupations");
      setOccupations(() => []);
    } finally {
      setLoadingOccupations(false);
    }
  };

  const fetchProgrammeTitleForEndorse = async (programmeId, setFieldValue) => {
    if (!programmeId) {
      setFieldValue("programmeTitle", "");
      return;
    }

    try {
      const response = await NcsService.getProgrammeTitleById(
        programmeId,
        access_token,
      );
      console.log("Programme Title Response for Endorse:", response);

      if (
        response &&
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const item = response.data[0];
        const title =
          item.programme_title ||
          item.courseName ||
          item.name ||
          item.occupationName ||
          item.title;

        if (title) {
          setFieldValue("programmeTitle", title);
          console.log("Programme Title set to:", title);
          toast.info(`Programme Title auto-filled: ${title}`);
        } else {
          setFieldValue("programmeTitle", "");
        }
      } else if (
        response &&
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        const item = response.data;
        const title =
          item.programme_title ||
          item.courseName ||
          item.name ||
          item.occupationName ||
          item.title;

        if (title) {
          setFieldValue("programmeTitle", title);
          toast.info(`Programme Title auto-filled: ${title}`);
        } else {
          setFieldValue("programmeTitle", "");
        }
      } else {
        setFieldValue("programmeTitle", "");
      }
    } catch (error) {
      console.error("Error fetching programme title:", error);
      setFieldValue("programmeTitle", "");
    }
  };

  const fetchCurriculumTypes = async () => {
    try {
      const response = await CommonService.getCurriculumServiceType();
      console.log("Curriculum Types Response:", response.data);
      setCurriculumTypes(response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchProgrammeTypes = async () => {
    try {
      const response = await CommonService.getByParentId(13);
      console.log("Programme Types Response:", response.data);
      setProgrammeTypes(response.data);
    } catch (error) {
      console.error("Error fetching programme types:", error);
    }
  };

  const fetchCertificateLevels = async (programmeTypeId = null) => {
    try {
      setIsLoadingCertificateLevels(true);
      let parentId;

      if (programmeTypeId === 41) {
        parentId = 27;
      } else if (programmeTypeId === 42) {
        parentId = 10;
      } else {
        setCertificateLevels([]);
        setIsLoadingCertificateLevels(false);
        return;
      }

      const response = await CommonService.getByParentId(parentId);
      console.log("Certificate Levels Response:", response.data);
      setCertificateLevels(response.data);
    } catch (error) {
      console.error("Error fetching BQF levels:", error);
      toast.error("Failed to load certificate levels");
    } finally {
      setIsLoadingCertificateLevels(false);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteDetails(response.data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchCurriculumData = async () => {
    try {
      const response =
        await CurriculumIndexService.getCurriculumDetailsByUserId(
          registration_no,
          access_token,
        );
      setData(response.data);
      console.log("Curriculum Data Response:", response.data);
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await CommonService.getByParentId(4);
      console.log("Dropdown Data Response:", response.data);
      setDropdownData(response.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // ==================== NCS CHECK FUNCTION ====================

  const checkNcsExists = async (
    sectorId,
    occupationId,
    certificationId,
    setFieldValue,
  ) => {
    if (!sectorId || !occupationId || !certificationId) {
      setNcsExists(() => false);
      setNcsData(() => null);
      setFieldValue("curriculumTitle", "");
      setFieldValue("programmeTitle", "");
      setFieldValue("ncsId", "");
      return;
    }

    setCheckingExisting(true);
    try {
      const response = await NcsService.getAlreadyNcsDetailsExist(
        sectorId,
        occupationId,
        certificationId,
        access_token,
      );
      console.log("NCS Exists Check Response:", response);

      if (response.data && response.data.length > 0) {
        setNcsExists(() => true);
        setNcsData(() => response.data[0]);
        console.log("NCS combination exists:", response.data[0]);

        if (response.data[0].programme_title) {
          setFieldValue("curriculumTitle", response.data[0].programme_title);
          setFieldValue("programmeTitle", response.data[0].programme_title);
          setFieldValue("ncsId", response.data[0].id);
          toast.info(
            `Programme Title and Curriculum Title auto-filled with: ${response.data[0].programme_title}`,
          );
        }
      } else {
        setNcsExists(() => false);
        setNcsData(() => null);
        setFieldValue("curriculumTitle", "");
        setFieldValue("programmeTitle", "");
        setFieldValue("ncsId", "");
        console.log("NCS combination does not exist - fields cleared");
      }
    } catch (error) {
      console.error("Error checking NCS exists:", error);
      setNcsExists(() => false);
      setNcsData(() => null);
      setFieldValue("curriculumTitle", "");
      setFieldValue("programmeTitle", "");
      setFieldValue("ncsId", "");
    } finally {
      setCheckingExisting(false);
    }
  };

  // ==================== USE EFFECTS ====================

  useEffect(() => {
    fetchCurriculumTypes();
    fetchProgrammeTypes();
    fetchInstituteDetails();
    fetchCurriculumData();
    fetchDropdownData();
    fetchSectors();
  }, []);

  // ==================== HANDLERS ====================

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const getCurriculumTypeName = (typeId) => {
    if (!typeId) return "N/A";
    const type = curriculumTypes.find((item) => item.id === parseInt(typeId));
    return type ? type.service_name || type.name : "N/A";
  };

  const getCurriculumType = (typeId) => {
    return curriculumTypes.find((item) => item.id === parseInt(typeId));
  };

  // Filter data based on search and curriculum type
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.application_no?.includes(search) ||
      item.curriculum_title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());

    const matchesCurriculumType =
      !curriculumTypeFilter ||
      item.curriculum_type_id === curriculumTypeFilter ||
      item.curriculum_type_id?.toString() === curriculumTypeFilter;

    return matchesSearch && matchesCurriculumType;
  });

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const institute = instituteDetails[0] || {};

  // ==================== GET INITIAL VALUES ====================

  const getInitialValues = (
    curriculum = null,
    isEndorse = false,
    isAdd = false,
    isRevision = false,
  ) => {
    if (isAdd) {
      return {
        providerName: institute.proposed_institute_name || "",
        registrationNo: institute.registration_no || "",
        curriculumTypeId: "25",
        programmeTypeId: "",
        curriculumTitle: "",
        programmeTitle: "",
        ncsId: "",
        description: "",
        certificateLevelId: "",
        sectorId: "",
        occupationId: "",
        entryRequirement: "",
        totalTheoryDuration: "",
        totalPracticalDuration: "",
        totalOjtDuration: "",
        totalProgramDuration: "",
        files: [],
      };
    }
    if (isEndorse) {
      return {
        providerName: institute.proposed_institute_name || "",
        registrationNo: institute.registration_no || "",
        curriculumTypeId: "48",
        programmeTypeId: "",
        curriculumTitle: "",
        endorseApplicationNo: "",
        programmeTitle: "",
        ncsId: "",
        description: "",
        certificateLevelId: "",
        sectorId: "",
        occupationId: "",
        entryRequirement: "",
        totalTheoryDuration: "",
        totalPracticalDuration: "",
        totalOjtDuration: "",
        totalProgramDuration: "",
        files: [],
      };
    }
    if (isRevision && curriculum) {
      return {
        providerName:
          curriculum.proposed_institute_name ||
          institute.proposed_institute_name ||
          "",
        registrationNo:
          curriculum.registration_no || institute.registration_no || "",
        curriculumTypeId: "49",
        programmeTypeId: curriculum.programme_type_id || "",
        curriculumTitle: curriculum.curriculum_title || "",
        programmeTitle: curriculum.programme_title || "",
        ncsId: curriculum.ncs_id || curriculum.programme_id || "",
        description: curriculum.description || "",
        certificateLevelId: curriculum.certificate_level_id || "",
        sectorId: curriculum.sector_id || "",
        occupationId: curriculum.occupation_id || "",
        entryRequirement: curriculum.entry_requirement || "",
        totalTheoryDuration: curriculum.total_theory_duration || "",
        totalPracticalDuration: curriculum.total_practical_duration || "",
        totalOjtDuration: curriculum.total_ojt_duration || "",
        totalProgramDuration: curriculum.total_program_duration || "",
        files: [],
      };
    }
    if (curriculum) {
      return {
        providerName:
          curriculum.proposed_institute_name ||
          institute.proposed_institute_name ||
          "",
        registrationNo:
          curriculum.registration_no || institute.registration_no || "",
        curriculumTypeId: curriculum.curriculum_type_id || "",
        programmeTypeId: curriculum.programme_type_id || "",
        curriculumTitle: curriculum.curriculum_title || "",
        programmeTitle: curriculum.programme_title || "",
        ncsId: curriculum.ncs_id || curriculum.programme_id || "",
        description: curriculum.description || "",
        certificateLevelId: curriculum.certificate_level_id || "",
        sectorId: curriculum.sector_id || "",
        occupationId: curriculum.occupation_id || "",
        entryRequirement: curriculum.entry_requirement || "",
        totalTheoryDuration: curriculum.total_theory_duration || "",
        totalPracticalDuration: curriculum.total_practical_duration || "",
        totalOjtDuration: curriculum.total_ojt_duration || "",
        totalProgramDuration: curriculum.total_program_duration || "",
        files: [],
      };
    }
    return {
      providerName: institute.proposed_institute_name || "",
      registrationNo: institute.registration_no || "",
      curriculumTypeId: "",
      programmeTypeId: "",
      curriculumTitle: "",
      programmeTitle: "",
      ncsId: "",
      description: "",
      certificateLevelId: "",
      sectorId: "",
      occupationId: "",
      entryRequirement: "",
      totalTheoryDuration: "",
      totalPracticalDuration: "",
      totalOjtDuration: "",
      totalProgramDuration: "",
      files: [],
    };
  };

  // ==================== VALIDATION SCHEMA ====================

  const getValidationSchema = (isAdd = false) => {
    return Yup.object().shape({
      curriculumTypeId: Yup.string().required("Curriculum Type is required"),
      programmeTypeId: Yup.string().required("Programme Type is required"),
      curriculumTitle: Yup.string().required("Curriculum Title is required"),
      programmeTitle: Yup.string().when("programmeTypeId", {
        is: (val) => val && parseInt(val) === 42,
        then: (schema) =>
          schema.required("Programme Title is required for Non-BQF Programme"),
        otherwise: (schema) => schema.notRequired(),
      }),
      description: Yup.string().required("Curriculum Description is required"),
      certificateLevelId: Yup.string().required(
        "Certificate Level is required",
      ),
      sectorId: Yup.string().when("programmeTypeId", {
        is: (val) => val && parseInt(val) === 41,
        then: (schema) =>
          schema.required("Sector is required for BQF Programme"),
        otherwise: (schema) => schema.notRequired(),
      }),
      occupationId: Yup.string().when("programmeTypeId", {
        is: (val) => val && parseInt(val) === 41,
        then: (schema) =>
          schema.required("Occupation is required for BQF Programme"),
        otherwise: (schema) => schema.notRequired(),
      }),
      ncsId: Yup.string().when("programmeTypeId", {
        is: (val) => val && parseInt(val) === 41,
        then: (schema) => {
          if (isAdd) {
            return schema.required(
              "NCS selection is required for BQF Programme",
            );
          }
          return schema.notRequired();
        },
        otherwise: (schema) => schema.notRequired(),
      }),
      entryRequirement: Yup.string().required("Entry Requirement is required"),
      totalTheoryDuration: Yup.string()
        .required("Total Theory Duration is required")
        .test(
          "valid-duration",
          "Please enter a valid duration (e.g., 120 hours)",
          function (value) {
            if (!value) return false;
            return extractNumericValue(value) > 0;
          },
        ),
      totalPracticalDuration: Yup.string()
        .required("Total Practical Duration is required")
        .test(
          "valid-duration",
          "Please enter a valid duration (e.g., 80 hours)",
          function (value) {
            if (!value) return false;
            return extractNumericValue(value) > 0;
          },
        ),
      totalOjtDuration: Yup.string()
        .required("Total OJT Duration is required")
        .test(
          "valid-duration",
          "Please enter a valid duration (e.g., 40 hours)",
          function (value) {
            if (!value) return false;
            return extractNumericValue(value) > 0;
          },
        ),
      files: Yup.array(),
      totalProgramDuration: Yup.string()
        .required("Total program duration is required")
        .test(
          "min-duration",
          "Curriculum development must be at least 140 hours",
          function (value) {
            if (!value) return false;
            const numericValue = extractNumericValue(value);
            return numericValue >= 140;
          },
        )
        // BQF Duration Distribution Validation
        .when("programmeTypeId", {
          is: (val) => val && parseInt(val) === 41,
          then: (schema) =>
            schema.test("duration-distribution", function (value) {
              const {
                totalTheoryDuration,
                totalPracticalDuration,
                totalOjtDuration,
                certificateLevelId,
                programmeTypeId,
              } = this.parent;

              // Only validate for BQF courses
              if (parseInt(programmeTypeId) !== 41) {
                return true;
              }

              if (!value || !certificateLevelId) return true;

              const theoryNum = extractNumericValue(totalTheoryDuration);
              const practicalNum = extractNumericValue(totalPracticalDuration);
              const ojtNum = extractNumericValue(totalOjtDuration);
              const totalNum = extractNumericValue(value);

              if (totalNum === 0) return true;

              // Find the certificate level
              const certificateLevel = certificateLevels.find(
                (level) => level.id === parseInt(certificateLevelId),
              );

              if (!certificateLevel) return true;

              const levelName = certificateLevel.name.toLowerCase();

              // Determine requirements based on certificate level
              let requiredTheoryPercentage = 0;
              let requiredPracticalOjtPercentage = 0;
              let levelType = "";

              // Check for Diploma or Advanced Diploma
              if (
                levelName.includes("diploma") ||
                levelName.includes("advanced diploma")
              ) {
                requiredTheoryPercentage = 40;
                requiredPracticalOjtPercentage = 60;
                levelType = "Diploma/Advanced Diploma";
              }
              // Check for Certificate
              else if (levelName.includes("certificate")) {
                requiredTheoryPercentage = 20;
                requiredPracticalOjtPercentage = 80;
                levelType = "Certificate";
              } else {
                // If level doesn't match known types, skip validation
                return true;
              }

              const theoryPercentage = (theoryNum / totalNum) * 100;
              const practicalOjtPercentage =
                ((practicalNum + ojtNum) / totalNum) * 100;

              // Use a small tolerance for floating point calculations
              const tolerance = 0.5;

              // Check Theory percentage
              if (theoryPercentage < requiredTheoryPercentage - tolerance) {
                return this.createError({
                  message: `❌ Theory duration (${theoryPercentage.toFixed(
                    1,
                  )}%) is less than the required ${requiredTheoryPercentage}% for ${levelType}. 
                  Current theory: ${theoryNum} hours out of ${totalNum} total hours. 
                  Required minimum theory: ${(totalNum * requiredTheoryPercentage) / 100} hours.`,
                });
              }

              // Check Practical + OJT percentage
              if (
                practicalOjtPercentage >
                requiredPracticalOjtPercentage + tolerance
              ) {
                return this.createError({
                  message: `❌ Practical + OJT duration (${practicalOjtPercentage.toFixed(
                    1,
                  )}%) exceeds the allowed ${requiredPracticalOjtPercentage}% for ${levelType}. 
                  Current practical + OJT: ${practicalNum + ojtNum} hours out of ${totalNum} total hours. 
                  Maximum allowed practical + OJT: ${(totalNum * requiredPracticalOjtPercentage) / 100} hours.`,
                });
              }

              // Check if Practical + OJT is too low (optional warning)
              const minPracticalOjtPercentage =
                requiredPracticalOjtPercentage - 30;
              if (practicalOjtPercentage < minPracticalOjtPercentage) {
                return this.createError({
                  message: `⚠️ Practical + OJT duration (${practicalOjtPercentage.toFixed(
                    1,
                  )}%) is too low. 
                  For ${levelType}, practical and OJT should be approximately ${requiredPracticalOjtPercentage}% of total duration. 
                  Current practical + OJT: ${practicalNum + ojtNum} hours out of ${totalNum} total hours.`,
                });
              }

              return true;
            }),
          otherwise: (schema) => schema,
        }),
    });
  };

  // ==================== SUBMIT HANDLER ====================

  const handleFormSubmit = async (
    values,
    { resetForm, setSubmitting },
    actionType,
  ) => {
    const totalDuration = extractNumericValue(values.totalProgramDuration);

    if (totalDuration < 140) {
      toast.error(
        "Your curriculum development is less than 140 hours. Please ensure the total duration is at least 140 hours.",
      );
      setSubmitting(false);
      return;
    }

    // Validate BQF duration distribution before submission
    if (parseInt(values.programmeTypeId) === 41) {
      const theoryNum = extractNumericValue(values.totalTheoryDuration);
      const practicalNum = extractNumericValue(values.totalPracticalDuration);
      const ojtNum = extractNumericValue(values.totalOjtDuration);
      const totalNum = extractNumericValue(values.totalProgramDuration);

      const result = validateBQFDurationDistribution(
        totalNum,
        theoryNum,
        practicalNum,
        ojtNum,
        values.certificateLevelId,
        certificateLevels,
      );

      if (!result.isValid) {
        toast.error(result.message);
        setSubmitting(false);
        return;
      }
    }

    if (actionType === "add") setLoading(true);
    else if (actionType === "endorse") setEndorseLoading(true);
    else if (actionType === "revision") setEditLoading(true);

    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const curriculumType = getCurriculumType(values.curriculumTypeId);
      const serviceName = curriculumType?.service_name || "Curriculum";
      const serviceId = curriculumType?.id || 25;

      const assignedRoleId = actionType === "endorse" ? 14 : 21;

      let applicationNo = "";
      if (actionType === "endorse") {
        applicationNo = values.endorseApplicationNo;
      } else if (actionType === "revision") {
        if (selectedCurriculum) {
          applicationNo = selectedCurriculum.application_no;
        }
      }

      const payload = {
        applicationNo: applicationNo,
        curriculumTitle: values.curriculumTitle,
        curriculumTypeId: parseInt(values.curriculumTypeId),
        programmeTypeId: parseInt(values.programmeTypeId),
        description: values.description,
        ...(parseInt(values.programmeTypeId) === 41 && {
          sectorId: parseInt(values.sectorId),
          occupationId: parseInt(values.occupationId),
          programmeId: values.ncsId ? parseInt(values.ncsId) : null,
        }),
        ...(parseInt(values.programmeTypeId) === 42 && {
          programmeTitle: values.programmeTitle || "",
        }),
        certificateLevelId: parseInt(values.certificateLevelId),
        entryRequirement: values.entryRequirement,
        totalTheoryDuration: values.totalTheoryDuration,
        totalPracticalDuration: values.totalPracticalDuration,
        totalOjtDuration: values.totalOjtDuration,
        totalProgramDuration: values.totalProgramDuration,
        instituteId: institute.institute_id || null,
        documents: documents,
        serviceId: serviceId,
        assignedRoleId: assignedRoleId,
        statusId: 55,
        createdBy: actionId,
        submittedDate: new Date().toISOString(),
      };

      if (actionType === "revision") {
        payload.id = selectedCurriculum.id;
        payload.updatedBy = actionId;
        payload.updatedDate = new Date().toISOString();
      }

      console.log("Submitting payload:", payload);

      const response = await CurriculumIndexService.submitCurriculum(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        const actionMessages = {
          add: "submitted",
          endorse: "endorsed",
          revision: "revised",
        };
        toast.success(
          `${serviceName} ${actionMessages[actionType]} successfully!`,
        );
      }

      await fetchCurriculumData();
      resetForm();

      if (actionType === "add") {
        setOpenDialog(false);
      } else if (actionType === "endorse") {
        setOpenEndorseDialog(false);
      } else if (actionType === "revision") {
        setOpenEditDialog(false);
        setSelectedCurriculum(null);
      }
      setCertificateLevels([]);
      setSelectedSectorId(() => "");
      setOccupations(() => []);
      setNcsExists(() => false);
      setNcsData(() => null);
    } catch (error) {
      console.error("Error submitting curriculum:", error);
      const curriculumType = getCurriculumType(values.curriculumTypeId);
      const serviceName = curriculumType?.service_name || "Curriculum";
      const actionMessages = {
        add: "submit",
        endorse: "endorse",
        revise: "revise",
      };
      toast.error(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${actionMessages[actionType]} ${serviceName}`,
      );
    } finally {
      if (actionType === "add") setLoading(false);
      else if (actionType === "endorse") setEndorseLoading(false);
      else if (actionType === "revision") setEditLoading(false);
      setSubmitting(false);
    }
  };

  // ==================== DIALOG HANDLERS ====================

  const handleEditClick = (curriculum) => {
    if (!isRevisionAllowed(curriculum.status_id)) {
      toast.warning(
        `Revision is only allowed for endorsed curricula. Current status: ${getStatusName(
          curriculum.status_id,
        )}`,
      );
      return;
    }
    setSelectedCurriculum(curriculum);
    if (curriculum.programme_type_id) {
      fetchCertificateLevels(parseInt(curriculum.programme_type_id));
    }
    if (curriculum.sector_id) {
      fetchOccupationsBySector(curriculum.sector_id);
      setSelectedSectorId(() => curriculum.sector_id);
    }
    setOpenEditDialog(true);
  };

  const handleClearFilter = () => {
    setCurriculumTypeFilter("");
    setSearch("");
  };

  // ==================== RENDER ====================

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        List of Programme's Curriculums
      </Typography>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Curriculum Type</InputLabel>
            <Select
              value={curriculumTypeFilter}
              onChange={(e) => setCurriculumTypeFilter(e.target.value)}
              label="Curriculum Type"
              sx={{ height: "36px" }}
            >
              <MenuItem value="">All Types</MenuItem>
              {curriculumTypes.map((type) => (
                <MenuItem key={type.id} value={type.id.toString()}>
                  {type.service_name || type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={handleClearFilter}
            sx={{ height: "36px", width: "100%" }}
          >
            Clear
          </Button>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ height: "36px", width: "100%" }}
          >
            Add Curriculum
          </Button>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<ThumbUpIcon />}
            onClick={() => setOpenEndorseDialog(true)}
            sx={{ height: "36px", width: "100%" }}
          >
            Curriculum Endorse
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Curriculum Title</TableCell>
              <TableCell>Curriculum Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Attachment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => {
                  const documents = getDocumentLinks(item.documents);
                  const canRevise = isRevisionAllowed(item.status_id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{item.application_no}</TableCell>
                      <TableCell>{item.curriculum_title}</TableCell>
                      <TableCell>
                        {getCurriculumTypeName(item.curriculum_type_id)}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {documents.length > 0
                          ? documents.map((doc, idx) => (
                              <div
                                key={doc.id || idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "4px",
                                }}
                              >
                                <Link
                                  component="button"
                                  variant="body2"
                                  onClick={() => handleDownload(doc)}
                                  sx={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    "&:hover": {
                                      color: "primary.main",
                                      textDecoration: "underline",
                                    },
                                  }}
                                  disabled={downloading}
                                >
                                  {doc.name}
                                </Link>
                                <Tooltip title="Download">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloading}
                                    sx={{ p: 0.5 }}
                                  >
                                    <LaunchIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            ))
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {getStatusName(item.status_id)}
                        {canRevise && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            display="block"
                          >
                            (Revision Available)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            canRevise
                              ? "Curriculum Revision"
                              : `Revision only allowed for Endorsed status. Current: ${getStatusName(
                                  item.status_id,
                                )}`
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(item)}
                              color={canRevise ? "primary" : "disabled"}
                              disabled={!canRevise}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add Curriculum Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setCertificateLevels([]);
          setSelectedSectorId(() => "");
          setOccupations(() => []);
          setNcsExists(() => false);
          setNcsData(() => null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Curriculum Development</DialogTitle>
        <Formik
          initialValues={getInitialValues(null, false, true, false)}
          validationSchema={getValidationSchema(true)}
          onSubmit={(values, helpers) =>
            handleFormSubmit(values, helpers, "add")
          }
          enableReinitialize={true}
          validateOnMount={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <CurriculumForm
                  formik={formik}
                  isEndorse={false}
                  isAdd={true}
                  isRevision={false}
                  data={data}
                  sectors={sectors}
                  occupations={occupations}
                  certificateLevels={certificateLevels}
                  curriculumTypes={curriculumTypes}
                  programmeTypes={programmeTypes}
                  loading={loading}
                  endorseLoading={endorseLoading}
                  editLoading={editLoading}
                  loadingOccupations={loadingOccupations}
                  isLoadingCertificateLevels={isLoadingCertificateLevels}
                  checkingExisting={checkingExisting}
                  ncsExists={ncsExists}
                  ncsData={ncsData}
                  fetchOccupationsBySector={fetchOccupationsBySector}
                  fetchCertificateLevels={fetchCertificateLevels}
                  fetchProgrammeTitleForEndorse={fetchProgrammeTitleForEndorse}
                  checkNcsExists={checkNcsExists}
                  setSelectedSectorId={setSelectedSectorId}
                  setOccupations={setOccupations}
                  setNcsExists={setNcsExists}
                  setNcsData={setNcsData}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setOpenDialog(false);
                    setCertificateLevels([]);
                    setSelectedSectorId(() => "");
                    setOccupations(() => []);
                    setNcsExists(() => false);
                    setNcsData(() => null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formik.isValid}
                >
                  {loading ? "Saving..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Curriculum Endorse Dialog */}
      <Dialog
        open={openEndorseDialog}
        onClose={() => {
          setOpenEndorseDialog(false);
          setCertificateLevels([]);
          setSelectedSectorId(() => "");
          setOccupations(() => []);
          setNcsExists(() => false);
          setNcsData(() => null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Curriculum Endorsement</DialogTitle>
        <Formik
          initialValues={getInitialValues(null, true, false, false)}
          validationSchema={getValidationSchema(false)}
          onSubmit={(values, helpers) =>
            handleFormSubmit(values, helpers, "endorse")
          }
          enableReinitialize={true}
          validateOnMount={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <CurriculumForm
                  formik={formik}
                  isEndorse={true}
                  isAdd={false}
                  isRevision={false}
                  data={data}
                  sectors={sectors}
                  occupations={occupations}
                  certificateLevels={certificateLevels}
                  curriculumTypes={curriculumTypes}
                  programmeTypes={programmeTypes}
                  loading={loading}
                  endorseLoading={endorseLoading}
                  editLoading={editLoading}
                  loadingOccupations={loadingOccupations}
                  isLoadingCertificateLevels={isLoadingCertificateLevels}
                  checkingExisting={checkingExisting}
                  ncsExists={ncsExists}
                  ncsData={ncsData}
                  fetchOccupationsBySector={fetchOccupationsBySector}
                  fetchCertificateLevels={fetchCertificateLevels}
                  fetchProgrammeTitleForEndorse={fetchProgrammeTitleForEndorse}
                  checkNcsExists={checkNcsExists}
                  setSelectedSectorId={setSelectedSectorId}
                  setOccupations={setOccupations}
                  setNcsExists={setNcsExists}
                  setNcsData={setNcsData}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setOpenEndorseDialog(false);
                    setCertificateLevels([]);
                    setSelectedSectorId(() => "");
                    setOccupations(() => []);
                    setNcsExists(() => false);
                    setNcsData(() => null);
                  }}
                  disabled={endorseLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={endorseLoading || !formik.isValid}
                >
                  {endorseLoading ? "Endorsing..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Curriculum Revision Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setSelectedCurriculum(null);
          setCertificateLevels([]);
          setSelectedSectorId(() => "");
          setOccupations(() => []);
          setNcsExists(() => false);
          setNcsData(() => null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Curriculum Revision</DialogTitle>
        <Formik
          initialValues={getInitialValues(
            selectedCurriculum,
            false,
            false,
            true,
          )}
          validationSchema={getValidationSchema(false)}
          onSubmit={(values, helpers) =>
            handleFormSubmit(values, helpers, "revision")
          }
          enableReinitialize={true}
          validateOnMount={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <CurriculumForm
                  formik={formik}
                  isEndorse={false}
                  isAdd={false}
                  isRevision={true}
                  data={data}
                  sectors={sectors}
                  occupations={occupations}
                  certificateLevels={certificateLevels}
                  curriculumTypes={curriculumTypes}
                  programmeTypes={programmeTypes}
                  loading={loading}
                  endorseLoading={endorseLoading}
                  editLoading={editLoading}
                  loadingOccupations={loadingOccupations}
                  isLoadingCertificateLevels={isLoadingCertificateLevels}
                  checkingExisting={checkingExisting}
                  ncsExists={ncsExists}
                  ncsData={ncsData}
                  fetchOccupationsBySector={fetchOccupationsBySector}
                  fetchCertificateLevels={fetchCertificateLevels}
                  fetchProgrammeTitleForEndorse={fetchProgrammeTitleForEndorse}
                  checkNcsExists={checkNcsExists}
                  setSelectedSectorId={setSelectedSectorId}
                  setOccupations={setOccupations}
                  setNcsExists={setNcsExists}
                  setNcsData={setNcsData}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setOpenEditDialog(false);
                    setSelectedCurriculum(null);
                    setCertificateLevels([]);
                    setSelectedSectorId(() => "");
                    setOccupations(() => []);
                    setNcsExists(() => false);
                    setNcsData(() => null);
                  }}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={editLoading || !formik.isValid}
                >
                  {editLoading ? "Revising..." : "Revise"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CurriculumIndex;
