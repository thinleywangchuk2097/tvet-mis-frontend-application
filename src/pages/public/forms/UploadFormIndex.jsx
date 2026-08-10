import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Stack,
  Tooltip,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as SuccessIcon,
  Send as SendIcon,
  CloudDone as CloudDoneIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  FactCheck as FactCheckIcon,
} from "@mui/icons-material";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import FileUpload from "../../../components/file/FileUpload";
import { toast } from "react-toastify";

// ==================== CONSTANTS ====================
const UPLOAD_STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
  SUCCESS: "success",
  ERROR: "error",
};

// ==================== UTILITY FUNCTIONS ====================
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ==================== MAIN COMPONENT ====================
const UploadFormIndex = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    department: "",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});

  // Helper function for required field label with red star
  const requiredLabel = (label) => (
    <>
      {label}
      <Typography
        component="span"
        sx={{ color: "red", ml: 0.3, fontSize: "0.75rem" }}
      >
        *
      </Typography>
    </>
  );

  // Handle form field changes
  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle file upload from FileUpload component
  const handleFilesChange = (uploadedFiles) => {
    setFiles(uploadedFiles || []);
    const newStatus = {};
    const newProgress = {};
    (uploadedFiles || []).forEach((file) => {
      newStatus[file.id || file.name] = UPLOAD_STATUS.IDLE;
      newProgress[file.id || file.name] = 0;
    });
    setUploadStatus((prev) => ({ ...prev, ...newStatus }));
    setUploadProgress((prev) => ({ ...prev, ...newProgress }));
  };

  // Get file statistics
  const getFileStats = () => {
    const total = files.length;
    const uploaded = files.filter(
      (f) => uploadStatus[f.id || f.name] === UPLOAD_STATUS.SUCCESS,
    ).length;
    const failed = files.filter(
      (f) => uploadStatus[f.id || f.name] === UPLOAD_STATUS.ERROR,
    ).length;
    const uploading = files.filter(
      (f) => uploadStatus[f.id || f.name] === UPLOAD_STATUS.UPLOADING,
    ).length;
    const pending = files.filter(
      (f) =>
        !uploadStatus[f.id || f.name] ||
        uploadStatus[f.id || f.name] === UPLOAD_STATUS.IDLE,
    ).length;
    return { total, uploaded, failed, uploading, pending };
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.department) {
      newErrors.department = "Department is required";
    }
    if (getFileStats().total === 0) {
      toast.error("Please upload at least one file");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const payload = {
        ...formData,
        files: files,
        uploadedAt: new Date().toISOString(),
      };
      console.log("Submitting:", payload);
      setSubmitSuccess(true);
      toast.success("Form submitted successfully!");
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      department: "",
      priority: "medium",
    });
    setFiles([]);
    setUploadStatus({});
    setUploadProgress({});
    setActiveStep(0);
    setSubmitSuccess(false);
    setErrors({});
  };

  const steps = [
    {
      label: "Document Information",
      icon: <DescriptionIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: "Upload Documents",
      icon: <AttachFileIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: "Review & Submit",
      icon: <FactCheckIcon sx={{ fontSize: 18 }} />,
    },
  ];

  const categories = [
    "Policy Document",
    "Procedure Manual",
    "Guideline",
    "Form Template",
    "Report",
    "Training Material",
    "Other",
  ];

  const departments = [
    "Administration",
    "Finance",
    "Human Resources",
    "Operations",
    "IT",
    "Quality Assurance",
    "Research & Development",
  ];

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const handleTabChange = (event, newValue) => {
    // Validate before moving to next tab
    if (newValue > activeStep) {
      if (activeStep === 0) {
        const newErrors = {};
        if (!formData.title.trim()) {
          newErrors.title = "Title is required";
        }
        if (!formData.category) {
          newErrors.category = "Category is required";
        }
        if (!formData.department) {
          newErrors.department = "Department is required";
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
          return;
        }
      }
    }
    setActiveStep(newValue);
  };

  return (
    <Box sx={{ m: 0.5 }}>
      <Paper sx={{ p: 1.5 }}>
        {/* Header - Compact */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ fontSize: "0.95rem" }}
            >
              Document Upload
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem" }}
            >
              Upload and manage your documents securely
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Horizontal Tabs */}
        <Tabs
          value={activeStep}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mb: 2,
            minHeight: 36,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
              minHeight: 36,
              py: 0.5,
              minWidth: 0,
            },
            "& .MuiTabs-indicator": {
              height: 3,
            },
          }}
        >
          {steps.map((step, index) => (
            <Tab
              key={index}
              icon={step.icon}
              label={step.label}
              iconPosition="start"
              sx={{
                "& .MuiTab-iconWrapper": { fontSize: 18 },
              }}
            />
          ))}
        </Tabs>

        {/* Step 0: Document Information */}
        {activeStep === 0 && (
          <Box sx={{ py: 0.5 }}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={requiredLabel("Document Title")}
                  value={formData.title}
                  onChange={handleFieldChange("title")}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Enter document title"
                  sx={{ "& .MuiInputBase-root": { fontSize: "0.75rem" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.category} size="small">
                  <InputLabel sx={{ fontSize: "0.75rem" }}>
                    {requiredLabel("Category")}
                  </InputLabel>
                  <Select
                    value={formData.category}
                    onChange={handleFieldChange("category")}
                    label="Category"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.75rem" }}>
                      <em>Select category</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem
                        key={cat}
                        value={cat}
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                    <FormHelperText sx={{ fontSize: "0.6rem" }}>
                      {errors.category}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.department} size="small">
                  <InputLabel sx={{ fontSize: "0.75rem" }}>
                    {requiredLabel("Department")}
                  </InputLabel>
                  <Select
                    value={formData.department}
                    onChange={handleFieldChange("department")}
                    label="Department"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.75rem" }}>
                      <em>Select department</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem
                        key={dept}
                        value={dept}
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.department && (
                    <FormHelperText sx={{ fontSize: "0.6rem" }}>
                      {errors.department}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: "0.75rem" }}>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={handleFieldChange("priority")}
                    label="Priority"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    {priorities.map((p) => (
                      <MenuItem
                        key={p.value}
                        value={p.value}
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={handleFieldChange("description")}
                  placeholder="Enter document description"
                  sx={{ "& .MuiInputBase-root": { fontSize: "0.75rem" } }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Upload Documents */}
        {activeStep === 1 && (
          <Box sx={{ py: 0.5 }}>
            <Paper sx={{ p: 1.5, mb: 1 }}>
              <Typography fontWeight={600} sx={{ mb: 0.5, fontSize: "0.8rem" }}>
                {requiredLabel("Upload Supporting Documents")}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <FileUpload files={files} onFilesChange={handleFilesChange} />
            </Paper>
          </Box>
        )}

        {/* Step 2: Review & Submit */}
        {activeStep === 2 && (
          <Box sx={{ py: 0.5 }}>
            {submitSuccess ? (
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  backgroundColor: "success.light",
                  borderRadius: 1,
                }}
              >
                <SuccessIcon
                  sx={{ fontSize: 36, color: "success.main", mb: 0.5 }}
                />
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  gutterBottom
                  sx={{ fontSize: "0.9rem" }}
                >
                  Submission Successful!
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem" }}
                >
                  Your documents have been uploaded successfully.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1, fontSize: "0.7rem" }}
                  onClick={resetForm}
                >
                  Upload More Documents
                </Button>
              </Paper>
            ) : (
              <>
                {/* Review Summary - Ultra Compact */}
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    gutterBottom
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Document Information
                  </Typography>
                  <Grid container spacing={0.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.6rem" }}
                      >
                        Title
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                        {formData.title || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.6rem" }}
                      >
                        Category
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                        {formData.category || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.6rem" }}
                      >
                        Department
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                        {formData.department || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.6rem" }}
                      >
                        Priority
                      </Typography>
                      <Chip
                        label={formData.priority || "N/A"}
                        size="small"
                        color={
                          formData.priority === "urgent"
                            ? "error"
                            : formData.priority === "high"
                              ? "warning"
                              : "default"
                        }
                        sx={{ height: 16, fontSize: "0.55rem" }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.6rem" }}
                      >
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.7rem" }}>
                        {formData.description || "No description provided"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* File Summary - Ultra Compact */}
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    gutterBottom
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Files ({getFileStats().total})
                  </Typography>
                  {files.length === 0 ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      No files uploaded
                    </Typography>
                  ) : (
                    files.map((file, index) => (
                      <Box
                        key={file.id || index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.25,
                          borderBottom:
                            index < files.length - 1
                              ? "1px solid #e0e0e0"
                              : "none",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.65rem" }}
                        >
                          {index + 1}. {file.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.6rem" }}
                        >
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Paper>
              </>
            )}
          </Box>
        )}

        {/* Navigation Buttons - Ultra Compact */}
        {!submitSuccess && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setActiveStep((prev) => prev - 1)}
              disabled={activeStep === 0}
              startIcon={<FastRewindIcon sx={{ fontSize: 16 }} />}
              sx={{
                fontSize: "0.7rem",
                px: 1.5,
                py: 0.25,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 28,
              }}
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSubmit}
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={14} sx={{ color: "#fff" }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  fontSize: "0.7rem",
                  px: 2,
                  py: 0.25,
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 28,
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setActiveStep((prev) => prev + 1)}
                endIcon={<FastForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontSize: "0.7rem",
                  px: 2,
                  py: 0.25,
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 28,
                }}
              >
                Next
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UploadFormIndex;
