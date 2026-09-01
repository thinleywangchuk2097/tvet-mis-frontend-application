import { useRef, useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  Grid,
  Chip,
  Tooltip,
  LinearProgress,
  keyframes,
  Paper,
  Stack,
  Button,
  alpha,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTheme } from "@mui/material/styles";

const MAX_FILE_SIZE_MB = 3;
const MAX_FILES = 10;

// Define animations
const slideAnimation = keyframes`
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
`;

// Get appropriate icon based on file type
const getFileIcon = (fileType, fileName) => {
  if (fileType?.startsWith("image/")) return <ImageIcon fontSize="small" />;
  if (fileType === "application/pdf")
    return <PictureAsPdfIcon fontSize="small" />;
  if (
    fileType?.includes("word") ||
    fileName?.endsWith(".doc") ||
    fileName?.endsWith(".docx")
  )
    return <DescriptionIcon fontSize="small" />;
  if (
    fileType?.includes("sheet") ||
    fileName?.endsWith(".xls") ||
    fileName?.endsWith(".xlsx")
  )
    return <TableChartIcon fontSize="small" />;
  return <InsertDriveFileIcon fontSize="small" />;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
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
    reader.onerror = () =>
      reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
};

// ==================== EXTRACTED HELPER FUNCTIONS ====================

// Validate files against size limit
const validateFiles = (files, maxSizeMB, maxFiles, currentCount) => {
  const validFiles = [];
  const invalidFiles = [];

  files.forEach((file) => {
    if (file.size / 1024 / 1024 <= maxSizeMB) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file.name);
    }
  });

  const exceedsMaxFiles = currentCount + validFiles.length > maxFiles;

  return {
    validFiles,
    invalidFiles,
    exceedsMaxFiles,
  };
};

// Create file items for display
const createFileItems = (files) => {
  return files.map((file) => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
    icon: getFileIcon(file.type, file.name),
    formattedSize: formatFileSize(file.size),
  }));
};

// Cleanup object URLs
const cleanupUrls = (items) => {
  items.forEach((item) => URL.revokeObjectURL(item.url));
};

// Handle file conversion with progress
const convertFilesWithProgress = async (files, onProgress) => {
  const documentDtos = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(file.name, 0);

    const interval = setInterval(() => {
      onProgress(file.name, null, true);
    }, 100);

    const dto = await fileToDocumentDto(file);
    documentDtos.push(dto);

    clearInterval(interval);
    onProgress(file.name, 100);
  }

  return documentDtos;
};

// ==================== SUB-COMPONENT: FileItem ====================

const FileItem = ({
  item,
  index,
  isConverting,
  progress,
  isProcessing,
  onPreview,
  onRemove,
  theme,
}) => {
  return (
    <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.2s ease",
          "&:hover":
            !isConverting && !isProcessing
              ? {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }
              : {},
          opacity: isConverting ? 0.8 : 1,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
        }}
      >
        {isConverting && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, 
                transparent, 
                ${alpha(theme.palette.primary.light, 0.1)}, 
                ${alpha(theme.palette.primary.main, 0.15)}, 
                ${alpha(theme.palette.primary.light, 0.1)}, 
                transparent
              )`,
              animation: `${slideAnimation} 1.5s infinite`,
              pointerEvents: "none",
            }}
          />
        )}

        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Box sx={{ color: theme.palette.text.secondary }}>{item.icon}</Box>
          </Grid>

          <Grid item xs>
            <Tooltip title={item.name}>
              <Typography
                variant="caption"
                fontWeight={500}
                sx={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </Typography>
            </Tooltip>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ mt: 0.5 }}
            >
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ fontSize: "0.6rem" }}
              >
                {item.formattedSize}
              </Typography>

              {isConverting && (
                <Chip
                  label={`${progress}%`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    height: 16,
                    "& .MuiChip-label": {
                      px: 0.5,
                      fontSize: "0.5rem",
                    },
                  }}
                />
              )}

              {!isConverting && !isProcessing && (
                <CheckCircleIcon
                  sx={{
                    fontSize: 12,
                    color: theme.palette.success.main,
                  }}
                />
              )}
            </Stack>
          </Grid>

          <Grid item>
            <Stack direction="row">
              <IconButton
                size="small"
                onClick={() => onPreview(item)}
                disabled={isConverting || isProcessing}
                sx={{ p: 0.5 }}
              >
                {item.type.startsWith("image") ||
                item.type === "application/pdf" ? (
                  <VisibilityIcon sx={{ fontSize: 16 }} />
                ) : (
                  <DownloadIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>

              <IconButton
                size="small"
                onClick={() => onRemove(index)}
                disabled={isConverting || isProcessing}
                sx={{ p: 0.5 }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>

        {isConverting && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 0.5,
              height: 2,
              borderRadius: 0.5,
            }}
          />
        )}
      </Paper>
    </Grid>
  );
};

// ==================== SUB-COMPONENT: FileUploadHeader ====================

const FileUploadHeader = ({
  description,
  maxSizeMB,
  maxFiles,
  required,
  convertingFiles,
  isProcessing,
  error,
  helperText,
  theme,
}) => {
  return (
    <Box sx={{ p: 2, position: "relative", zIndex: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={3} />
        <Grid item xs={6}>
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
              Max {maxSizeMB}MB • {maxFiles} files max
              {required && " • Required"}
            </Typography>
            {convertingFiles.length > 0 && (
              <Typography variant="caption" color="primary">
                Converting {convertingFiles.length} file(s)...
              </Typography>
            )}
            {isProcessing && !convertingFiles.length && (
              <Typography variant="caption" color="primary">
                Processing...
              </Typography>
            )}
          </Stack>
        </Grid>
        <Grid item xs={3} />
      </Grid>
      {error && helperText && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: "block", textAlign: "center" }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

// ==================== SUB-COMPONENT: FileListSection ====================

const FileListSection = ({
  items,
  expanded,
  convertingFiles,
  convertProgress,
  isProcessing,
  onPreview,
  onRemove,
  theme,
}) => {
  if (!expanded || items.length === 0) return null;

  return (
    <Box sx={{ px: 2, py: 2, position: "relative", zIndex: 2 }}>
      <Grid container spacing={1}>
        {items.map((item, index) => {
          const isConverting = convertingFiles.includes(item.name);
          const progress = convertProgress[item.name] || 0;

          return (
            <FileItem
              key={index}
              item={item}
              index={index}
              isConverting={isConverting}
              progress={progress}
              isProcessing={isProcessing}
              onPreview={onPreview}
              onRemove={onRemove}
              theme={theme}
            />
          );
        })}
      </Grid>
    </Box>
  );
};

// ==================== SUB-COMPONENT: FileUploadFooter ====================

const FileUploadFooter = ({
  items,
  expanded,
  toggleExpanded,
  maxFiles,
  handleRemoveAll,
  handleUploadClick,
  disabled,
  isProcessing,
  convertingFiles,
  theme,
}) => {
  return (
    <>
      {items.length > 0 && <Divider sx={{ position: "relative", zIndex: 2 }} />}

      <Box sx={{ p: 1, position: "relative", zIndex: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, md: 6 }}>
            {items.length > 0 && (
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
                  label={`${items.length}/${maxFiles}`}
                  color="primary"
                  size="small"
                  onDelete={handleRemoveAll}
                  deleteIcon={<DeleteIcon fontSize="small" />}
                />
              </Stack>
            )}
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleUploadClick}
              disabled={
                disabled ||
                isProcessing ||
                items.length >= maxFiles ||
                convertingFiles.length > 0
              }
              sx={{
                borderRadius: 2,
                textTransform: "none",
                boxShadow: "none",
                minWidth: 120,
                "&:hover": {
                  boxShadow: "none",
                },
              }}
            >
              Upload Files
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

// ==================== SUB-COMPONENT: PreviewDialog ====================

const PreviewDialog = ({ open, currentPreview, onClose, theme }) => {
  if (!currentPreview) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentPreview.url;
    link.download = currentPreview.name;
    link.click();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
          noWrap
          sx={{ maxWidth: "70%" }}
        >
          {currentPreview.name}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {currentPreview.type?.startsWith("image") && (
          <Box
            component="img"
            src={currentPreview.url}
            alt="preview"
            sx={{
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
          />
        )}

        {currentPreview.type === "application/pdf" && (
          <iframe
            src={currentPreview.url}
            title="PDF Preview"
            width="100%"
            height="600px"
            style={{ border: "none" }}
          />
        )}

        {!currentPreview.type?.startsWith("image") &&
          currentPreview.type !== "application/pdf" && (
            <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
              <InsertDriveFileIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              />
              <Typography variant="body2" gutterBottom>
                Preview not available for this file type
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={handleDownload}
                startIcon={<DownloadIcon />}
                sx={{ mt: 1 }}
              >
                Download
              </Button>
            </Box>
          )}
      </DialogContent>
    </Dialog>
  );
};

// ==================== SUB-COMPONENT: UploadArea ====================

const UploadArea = ({
  isDragging,
  error,
  isAnyProcessing,
  description,
  maxSizeMB,
  maxFiles,
  required,
  errorMessage,
  items,
  expanded,
  toggleExpanded,
  handleRemove,
  handleRemoveAll,
  handlePreview,
  handleUploadClick,
  disabled,
  isProcessing,
  convertingFiles,
  convertProgress,
  helperText,
  theme,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  dropAreaRef,
}) => {
  return (
    <Paper
      ref={dropAreaRef}
      elevation={isDragging ? 4 : 1}
      sx={{
        position: "relative",
        overflow: "hidden",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
        border: "2px dashed",
        borderColor: error
          ? theme.palette.error.main
          : isDragging
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.main, 0.3),
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isAnyProcessing && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, 
              transparent, 
              ${alpha(theme.palette.primary.light, 0.2)}, 
              ${alpha(theme.palette.primary.main, 0.3)}, 
              ${alpha(theme.palette.primary.light, 0.2)}, 
              transparent
            )`,
            animation: `${slideAnimation} 2s infinite`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      <FileUploadHeader
        description={description}
        maxSizeMB={maxSizeMB}
        maxFiles={maxFiles}
        required={required}
        convertingFiles={convertingFiles}
        isProcessing={isProcessing}
        error={error}
        helperText={helperText}
        theme={theme}
      />

      <FileListSection
        items={items}
        expanded={expanded}
        convertingFiles={convertingFiles}
        convertProgress={convertProgress}
        isProcessing={isProcessing}
        onPreview={handlePreview}
        onRemove={handleRemove}
        theme={theme}
      />

      <FileUploadFooter
        items={items}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
        maxFiles={maxFiles}
        handleRemoveAll={handleRemoveAll}
        handleUploadClick={handleUploadClick}
        disabled={disabled}
        isProcessing={isProcessing}
        convertingFiles={convertingFiles}
        theme={theme}
      />

      {items.length === 0 && !error && (
        <Box
          sx={{
            pb: 2,
            px: 2,
            textAlign: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Typography variant="caption" color="textSecondary">
            No files uploaded yet. Click the "Upload Files" button or drag and
            drop to add files.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// ==================== MAIN COMPONENT ====================

const FileUpload = ({
  files = [],
  onFilesChange,
  onFileUpload = null,
  disabled = false,
  isProcessing = false,
  maxSizeMB = MAX_FILE_SIZE_MB,
  maxFiles = MAX_FILES,
  acceptedFileTypes = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  description = "Drag and drop files here",
  required = false,
  error = false,
  helperText = "",
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [convertingFiles, setConvertingFiles] = useState([]);
  const [convertProgress, setConvertProgress] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [hasNotifiedRef, setHasNotifiedRef] = useState(false);

  // Derive items safely
  const items = useMemo(() => createFileItems(files), [files]);

  // Cleanup object URLs
  useEffect(() => {
    return () => cleanupUrls(items);
  }, [items]);

  // ==================== CONVERSION HANDLER ====================

  const handleConversion = async () => {
    if (!onFileUpload || files.length === 0 || hasNotifiedRef || isProcessing) {
      return;
    }

    try {
      const fileNames = files.map((f) => f.name);
      setConvertingFiles(fileNames);

      const progressMap = {};
      fileNames.forEach((name) => {
        progressMap[name] = 0;
      });
      setConvertProgress(progressMap);

      const updateProgress = (fileName, progress, isIncrement = false) => {
        setConvertProgress((prev) => {
          const current = prev[fileName] || 0;
          if (isIncrement) {
            return {
              ...prev,
              [fileName]: Math.min(current + 20, 100),
            };
          }
          return {
            ...prev,
            [fileName]: progress,
          };
        });
      };

      const documentDtos = await convertFilesWithProgress(
        files,
        updateProgress,
      );

      setTimeout(() => {
        setConvertingFiles([]);
        setConvertProgress({});
        onFileUpload(documentDtos);
        setHasNotifiedRef(true);
      }, 500);
    } catch (error) {
      console.error("Error converting files:", error);
      setErrorMessage("Failed to process files");
      setConvertingFiles([]);
      setConvertProgress({});
    }
  };

  useEffect(() => {
    handleConversion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, onFileUpload, isProcessing]);

  useEffect(() => {
    if (files.length === 0) {
      setHasNotifiedRef(false);
      if (onFileUpload) {
        onFileUpload([]);
      }
    }
  }, [files, onFileUpload]);

  useEffect(() => {
    if (isProcessing && files.length > 0) {
      setConvertingFiles(files.map((f) => f.name));
    } else if (!isProcessing && convertingFiles.length > 0 && !hasNotifiedRef) {
      setTimeout(() => {
        setConvertingFiles([]);
        setConvertProgress({});
      }, 500);
    }
  }, [isProcessing, files, convertingFiles.length, hasNotifiedRef]);

  // ==================== DRAG AND DROP HANDLERS ====================

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    handleFiles(selected);
    e.target.value = "";
  };

  // ==================== FILE HANDLING ====================

  const handleFiles = (selectedFiles) => {
    if (!selectedFiles.length) return;

    const { validFiles, invalidFiles, exceedsMaxFiles } = validateFiles(
      selectedFiles,
      maxSizeMB,
      maxFiles,
      files.length,
    );

    if (exceedsMaxFiles) {
      setErrorMessage(`You can only upload up to ${maxFiles} files`);
      return;
    }

    if (invalidFiles.length) {
      setErrorMessage(
        `The following files exceed ${maxSizeMB}MB: ${invalidFiles.join(", ")}`,
      );
    } else {
      setErrorMessage("");
    }

    if (validFiles.length) {
      onFilesChange([...files, ...validFiles]);
      setExpanded(true);
      setHasNotifiedRef(false);
    }
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
    setErrorMessage("");
    setHasNotifiedRef(false);
  };

  const handleRemoveAll = () => {
    onFilesChange([]);
    setErrorMessage("");
    setHasNotifiedRef(false);
  };

  const handlePreview = (item) => {
    if (item.type.startsWith("image") || item.type === "application/pdf") {
      setCurrentPreview(item);
      setPreviewOpen(true);
    } else {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.name;
      link.click();
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setCurrentPreview(null);
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      fileInputRef.current.click();
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const isAnyProcessing = isProcessing || convertingFiles.length > 0;

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept={acceptedFileTypes}
        onChange={handleFileSelect}
        disabled={disabled || isProcessing}
      />

      <UploadArea
        isDragging={isDragging}
        error={error}
        isAnyProcessing={isAnyProcessing}
        description={description}
        maxSizeMB={maxSizeMB}
        maxFiles={maxFiles}
        required={required}
        errorMessage={errorMessage}
        items={items}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
        handleRemove={handleRemove}
        handleRemoveAll={handleRemoveAll}
        handlePreview={handlePreview}
        handleUploadClick={handleUploadClick}
        disabled={disabled}
        isProcessing={isProcessing}
        convertingFiles={convertingFiles}
        convertProgress={convertProgress}
        helperText={helperText}
        theme={theme}
        handleDragEnter={handleDragEnter}
        handleDragLeave={handleDragLeave}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        dropAreaRef={dropAreaRef}
      />

      {errorMessage && (
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
      )}

      <PreviewDialog
        open={previewOpen}
        currentPreview={currentPreview}
        onClose={closePreview}
        theme={theme}
      />
    </Box>
  );
};

export default FileUpload;
