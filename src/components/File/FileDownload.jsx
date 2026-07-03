import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Grid,
  Chip,
  Tooltip,
  alpha,
  Stack,
  Collapse,
  Divider,
  LinearProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LaunchIcon from "@mui/icons-material/Launch";
import AddIcon from "@mui/icons-material/Add";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTheme } from "@mui/material/styles";
import CommonService from "../../api/services/internal/common/CommonService";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_FILES = 10;

// Get appropriate icon based on file type
const getFileIcon = (fileName) => {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension))
    return <ImageIcon fontSize="small" />;
  if (extension === "pdf") return <PictureAsPdfIcon fontSize="small" />;
  if (["doc", "docx"].includes(extension))
    return <DescriptionIcon fontSize="small" />;
  if (["xls", "xlsx", "csv"].includes(extension))
    return <TableChartIcon fontSize="small" />;
  return <InsertDriveFileIcon fontSize="small" />;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // ✅ FIXED: Use Number.parseFloat instead of parseFloat
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  );
};

// Convert File object to Documentdto format (base64 string)
const fileToDocumentDto = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result.split(",")[1];
      resolve({
        content: base64String,
        name: file.name,
        originalFilename: file.name,
        contentType: file.type,
        path: null,
      });
    };
    // ✅ FIXED: Reject with an Error object instead of a string
    reader.onerror = (error) =>
      reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
};

// Helper: Start progress simulation
const startProgressSimulation = (fileName, setConvertProgress) => {
  return setInterval(() => {
    setConvertProgress((prev) => {
      const currentProgress = prev[fileName] || 0;
      if (currentProgress >= 100) {
        clearInterval(interval);
        return prev;
      }
      return {
        ...prev,
        [fileName]: Math.min(currentProgress + 20, 100),
      };
    });
  }, 100);
};

// Helper: Convert files with progress
const convertFilesWithProgress = async (
  files,
  setConvertingFiles,
  setConvertProgress,
) => {
  const fileNames = files.map((f) => f.name);
  setConvertingFiles(fileNames);

  const progressMap = {};
  fileNames.forEach((name) => {
    progressMap[name] = 0;
  });
  setConvertProgress(progressMap);

  const documentDtos = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    setConvertProgress((prev) => ({
      ...prev,
      [file.name]: 0,
    }));

    const progressInterval = startProgressSimulation(
      file.name,
      setConvertProgress,
    );
    const dto = await fileToDocumentDto(file.file);
    documentDtos.push(dto);

    clearInterval(progressInterval);
    setConvertProgress((prev) => ({
      ...prev,
      [file.name]: 100,
    }));
  }

  return documentDtos;
};

// Helper: Initialize converting state
const initializeConvertingState = (
  files,
  setConvertingFiles,
  setConvertProgress,
) => {
  const fileNames = files.map((f) => f.name);
  setConvertingFiles(fileNames);

  const progressMap = {};
  fileNames.forEach((name) => {
    progressMap[name] = 0;
  });
  setConvertProgress(progressMap);
};

// Helper: Validate files
const validateFiles = (files, currentFileCount) => {
  const errors = [];

  if (currentFileCount + files.length > MAX_FILES) {
    errors.push(`You can only upload up to ${MAX_FILES} files`);
    return { validFiles: [], invalidFiles: [], errors };
  }

  const validFiles = [];
  const invalidFiles = [];

  files.forEach((file) => {
    if (file.size <= MAX_FILE_SIZE) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file.name);
    }
  });

  if (invalidFiles.length > 0) {
    errors.push(`The following files exceed 2 MB: ${invalidFiles.join(", ")}`);
  }

  return { validFiles, invalidFiles, errors };
};

// Helper: Normalize files
const normalizeFiles = (files) =>
  files.map((f) =>
    f instanceof File
      ? { name: f.name, file: f, size: f.size, type: f.type }
      : {
          name: f.name || f,
          url: f.url,
          size: f.size || 0,
          type: f.type || "",
        },
  );

// Helper: Handle file download from URL
const downloadFromUrl = async (file) => {
  const response = await CommonService.fetchDocument(file.name, file.url);
  const contentType = response.headers["content-type"];
  const disposition = response.headers["content-disposition"];
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);

  const isInline = disposition && disposition.includes("inline");

  if (isInline) {
    openInlinePreview(url, contentType, file.name);
  } else {
    triggerDownload(url, file.name);
  }

  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

// Helper: Open inline preview
const openInlinePreview = (url, contentType, fileName) => {
  if (contentType.startsWith("image/")) {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<html><head><title>${fileName}</title></head><body style="margin:0"><img src="${url}" style="width:100%;height:auto"/></body></html>`,
      );
      newWindow.document.close();
    } else {
      alert("Please allow popups to preview the file.");
    }
  } else {
    const newWindow = window.open(url);
    if (!newWindow) alert("Please allow popups to preview the file.");
  }
};

// Helper: Trigger file download
const triggerDownload = (url, fileName) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// Helper: Download from File object
const downloadFromFile = (file) => {
  const url = URL.createObjectURL(file.file);
  triggerDownload(url, file.name);
  URL.revokeObjectURL(url);
};

// Helper: Handle conversion notification
const handleConversionComplete = (
  documentDtos,
  onFileUpload,
  setConvertingFiles,
  setConvertProgress,
  hasNotifiedRef,
) => {
  setTimeout(() => {
    setConvertingFiles([]);
    setConvertProgress({});
    onFileUpload(documentDtos);
    hasNotifiedRef.current = true;
  }, 500);
};

// Helper: Handle conversion error
const handleConversionError = (
  error,
  setErrorMessage,
  setConvertingFiles,
  setConvertProgress,
) => {
  console.error("Error converting files:", error);
  setErrorMessage("Failed to process files");
  setConvertingFiles([]);
  setConvertProgress({});
};

// Helper: Check if upload is allowed
const isUploadDisabled = (disabled, allowUpload, files, convertingFiles) => {
  return (
    disabled ||
    !allowUpload ||
    files.length >= MAX_FILES ||
    convertingFiles.length > 0
  );
};

// Helper: Get file status chip
const getFileStatusChip = (isNew, isConverting, progress, theme) => {
  if (isConverting) {
    return (
      <Chip
        label={`${progress}%`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ height: 16, "& .MuiChip-label": { px: 0.5, fontSize: "0.5rem" } }}
      />
    );
  }

  if (isNew) {
    return (
      <Chip
        label="New"
        size="small"
        color="info"
        variant="outlined"
        sx={{ height: 16, "& .MuiChip-label": { px: 0.5, fontSize: "0.5rem" } }}
      />
    );
  }

  return (
    <CheckCircleIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
  );
};

const FileDownload = ({
  initialFiles = [],
  title = "Documents",
  description = "Drag and drop files here or click to browse",
  disabled = false,
  onFileUpload = null,
  allowUpload = true,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const hasNotifiedRef = useRef(false);

  const [files, setFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [convertingFiles, setConvertingFiles] = useState([]);
  const [convertProgress, setConvertProgress] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Initialize files from props
  useEffect(() => {
    const normalized = normalizeFiles(initialFiles);
    setFiles(normalized);
    setNewFiles([]);
    hasNotifiedRef.current = false;
  }, [initialFiles]);

  // Handle file conversion and notification
  useEffect(() => {
    const shouldConvert =
      onFileUpload &&
      allowUpload &&
      newFiles.length > 0 &&
      !hasNotifiedRef.current;
    const isEmpty = newFiles.length === 0;

    if (isEmpty && onFileUpload && allowUpload) {
      hasNotifiedRef.current = false;
      onFileUpload([]);
      return;
    }

    if (!shouldConvert) return;

    const handleConversion = async () => {
      try {
        initializeConvertingState(
          newFiles,
          setConvertingFiles,
          setConvertProgress,
        );
        const documentDtos = await convertFilesWithProgress(
          newFiles,
          setConvertingFiles,
          setConvertProgress,
        );
        handleConversionComplete(
          documentDtos,
          onFileUpload,
          setConvertingFiles,
          setConvertProgress,
          hasNotifiedRef,
        );
      } catch (error) {
        handleConversionError(
          error,
          setErrorMessage,
          setConvertingFiles,
          setConvertProgress,
        );
      }
    };

    handleConversion();
  }, [newFiles, onFileUpload, allowUpload]);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && allowUpload) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && allowUpload) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !allowUpload) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    handleFiles(selectedFiles);
    event.target.value = null;
  };

  const handleFiles = (selectedFiles) => {
    if (!selectedFiles.length) return;

    const { validFiles, invalidFiles, errors } = validateFiles(
      selectedFiles,
      files.length,
    );

    if (errors.length > 0) {
      setErrorMessage(errors[0]);
    } else {
      setErrorMessage("");
    }

    if (validFiles.length) {
      const normalizedFiles = validFiles.map((f) => ({
        name: f.name,
        file: f,
        size: f.size,
        type: f.type,
      }));
      setFiles((prev) => [...prev, ...normalizedFiles]);
      setNewFiles((prev) => [...prev, ...normalizedFiles]);
      setExpanded(true);
      hasNotifiedRef.current = false;
    }
  };

  // Handle download / preview
  const handleDownload = async (file) => {
    try {
      if (file.url) {
        await downloadFromUrl(file);
      } else if (file.file) {
        downloadFromFile(file);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const handleDelete = (index) => {
    const fileToDelete = newFiles[index];
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((f) => f !== fileToDelete));
    setErrorMessage("");
    hasNotifiedRef.current = false;
  };

  const handleRemoveAll = () => {
    setNewFiles([]);
    setFiles((prev) => prev.filter((f) => !newFiles.includes(f)));
    setErrorMessage("");
    hasNotifiedRef.current = false;
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    if (!disabled && allowUpload) {
      fileInputRef.current.click();
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const isNewFile = (file) => newFiles.includes(file);
  const isConverting = (fileName) => convertingFiles.includes(fileName);
  const getConvertProgress = (fileName) => convertProgress[fileName] || 0;

  // Render file item
  const renderFileItem = (file, index) => {
    const isNew = isNewFile(file);
    const isConvertingFile = isConverting(file.name);
    const progress = getConvertProgress(file.name);
    const fileSize = file.size ? formatFileSize(file.size) : "";

    return (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            position: "relative",
            overflow: "hidden",
            transition: "all 0.2s ease",
            "&:hover": !isConvertingFile && {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            },
            opacity: isConvertingFile ? 0.8 : 1,
            bgcolor: isNew
              ? alpha(theme.palette.info.main, 0.02)
              : alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <Box sx={{ color: theme.palette.text.secondary }}>
                {getFileIcon(file.name)}
              </Box>
            </Grid>

            <Grid item xs>
              <Tooltip title={file.name}>
                <Typography
                  variant="caption"
                  fontWeight={500}
                  sx={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    "&:hover": {
                      color: theme.palette.primary.main,
                      textDecoration: "underline",
                    },
                  }}
                  onClick={() => handleDownload(file)}
                >
                  {file.name}
                </Typography>
              </Tooltip>

              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ mt: 0.5 }}
              >
                {fileSize && (
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ fontSize: "0.6rem" }}
                  >
                    {fileSize}
                  </Typography>
                )}
                {getFileStatusChip(isNew, isConvertingFile, progress, theme)}
              </Stack>
            </Grid>

            <Grid item>
              <Stack direction="row">
                <Tooltip title="Download / Preview">
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(file)}
                    disabled={isConvertingFile}
                    sx={{ p: 0.5 }}
                  >
                    <LaunchIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                {isNew && !isConvertingFile && (
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(newFiles.indexOf(file))}
                      sx={{
                        p: 0.5,
                        color: theme.palette.error.main,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Grid>
          </Grid>

          {isConvertingFile && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mt: 0.5, height: 2, borderRadius: 0.5 }}
            />
          )}
        </Paper>
      </Grid>
    );
  };

  // Render upload controls
  const renderUploadControls = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          {files.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={expanded ? "Hide file list" : "Show file list"}>
                <IconButton
                  size="small"
                  onClick={toggleExpanded}
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>

              <Chip
                label={`${files.length}/${MAX_FILES}`}
                color="primary"
                size="small"
                onDelete={newFiles.length > 0 ? handleRemoveAll : undefined}
                deleteIcon={
                  newFiles.length > 0 ? (
                    <DeleteIcon fontSize="small" />
                  ) : undefined
                }
              />

              {newFiles.length > 0 && (
                <Typography variant="caption" color="info.main" sx={{ ml: 1 }}>
                  {newFiles.length} new file(s)
                </Typography>
              )}
            </Stack>
          )}
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleUploadClick}
            disabled={isUploadDisabled(
              disabled,
              allowUpload,
              files,
              convertingFiles,
            )}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "none",
              minWidth: 120,
              "&:hover": { boxShadow: "none" },
            }}
          >
            Add Files
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Box sx={{ pb: 2, px: 2, textAlign: "center" }}>
      <Typography variant="caption" color="textSecondary">
        No documents attached. Click the "Add Files" button or drag and drop to
        add files.
      </Typography>
    </Box>
  );

  // Render error message
  const renderErrorMessage = () => {
    if (!errorMessage) return null;
    return (
      <Paper
        sx={{
          mt: 1,
          p: 1,
          bgcolor: alpha(theme.palette.error.main, 0.1),
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          borderRadius: 1,
        }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
          <Typography variant="caption" color="error">
            {errorMessage}
          </Typography>
        </Stack>
      </Paper>
    );
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleFileChange}
        disabled={disabled || !allowUpload}
      />

      <Paper
        ref={dropAreaRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        elevation={isDragging ? 4 : 1}
        sx={{
          position: "relative",
          overflow: "hidden",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.2s ease",
          border: "2px dashed",
          borderColor: isDragging
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.main, 0.3),
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{ flexWrap: "wrap" }}
              >
                <Typography variant="caption" color="textSecondary">
                  {description}
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ opacity: 0.7 }}
                >
                  Max 2MB • {MAX_FILES} files max
                </Typography>
                {convertingFiles.length > 0 && (
                  <Typography variant="caption" color="primary">
                    Converting {convertingFiles.length} file(s)...
                  </Typography>
                )}
              </Stack>
            </Grid>
            <Grid item xs={4} />
          </Grid>
          {errorMessage && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: "block", textAlign: "center" }}
            >
              {errorMessage}
            </Typography>
          )}
        </Box>

        {/* File List */}
        <Collapse in={expanded && files.length > 0}>
          <Box sx={{ px: 2, py: 2 }}>
            <Grid container spacing={1}>
              {files.map((file, index) => renderFileItem(file, index))}
            </Grid>
          </Box>
        </Collapse>

        {files.length > 0 && <Divider />}

        {/* Controls */}
        {renderUploadControls()}

        {/* Empty State */}
        {files.length === 0 && renderEmptyState()}
      </Paper>

      {/* Error Display */}
      {renderErrorMessage()}
    </Box>
  );
};

export default FileDownload;
