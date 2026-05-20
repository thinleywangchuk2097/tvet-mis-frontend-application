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
  Collapse,
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Convert File object to Documentdto format (base64 string)
const fileToDocumentDto = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result.split(',')[1];
      
      resolve({
        content: base64String,
        name: file.name,
        originalFilename: file.name,
        contentType: file.type,
        path: null
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

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
  const items = useMemo(() => {
    return files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      icon: getFileIcon(file.type, file.name),
      formattedSize: formatFileSize(file.size),
    }));
  }, [files]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [items]);

  // Convert files to Documentdto format and notify parent with animation
  useEffect(() => {
    if (onFileUpload && files.length > 0 && !hasNotifiedRef && !isProcessing) {
      const convertAndNotify = async () => {
        try {
          // Show converting status for each file
          const fileNames = files.map(f => f.name);
          setConvertingFiles(fileNames);
          
          // Initialize progress for each file
          const progressMap = {};
          fileNames.forEach(name => {
            progressMap[name] = 0;
          });
          setConvertProgress(progressMap);
          
          // Convert files one by one to show progress
          const documentDtos = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Simulate conversion progress
            const interval = setInterval(() => {
              setConvertProgress(prev => {
                const currentProgress = prev[file.name] || 0;
                if (currentProgress >= 100) {
                  clearInterval(interval);
                  return prev;
                }
                return {
                  ...prev,
                  [file.name]: Math.min(currentProgress + 20, 100)
                };
              });
            }, 100);
            
            // Convert file
            const dto = await fileToDocumentDto(file);
            documentDtos.push(dto);
            
            clearInterval(interval);
            setConvertProgress(prev => ({
              ...prev,
              [file.name]: 100
            }));
          }
          
          // Wait a moment to show 100% completion
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
      
      convertAndNotify();
    } else if (files.length === 0) {
      setHasNotifiedRef(false);
      if (onFileUpload) {
        onFileUpload([]);
      }
    }
  }, [files, onFileUpload, isProcessing]);

  // Handle processing state from parent
  useEffect(() => {
    if (isProcessing && files.length > 0) {
      // Show processing state with animation
      setConvertingFiles(files.map(f => f.name));
    } else if (!isProcessing && convertingFiles.length > 0 && !hasNotifiedRef) {
      // Clear converting state when processing is done
      setTimeout(() => {
        setConvertingFiles([]);
        setConvertProgress({});
      }, 500);
    }
  }, [isProcessing, files]);

  // Drag and drop handlers
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

  const handleFiles = (selectedFiles) => {
    if (!selectedFiles.length) return;

    // Check max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      setErrorMessage(`You can only upload up to ${maxFiles} files`);
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (file.size / 1024 / 1024 <= maxSizeMB) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

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

  const isFileConverting = (fileName) => {
    return convertingFiles.includes(fileName);
  };

  const getFileProgress = (fileName) => {
    return convertProgress[fileName] || 0;
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

  // Check if any files are being processed
  const isAnyProcessing = isProcessing || convertingFiles.length > 0;

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept={acceptedFileTypes}
        onChange={handleFileSelect}
        disabled={disabled || isProcessing}
      />

      {/* Main Upload Container */}
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
          borderColor: error
            ? theme.palette.error.main
            : isDragging
              ? theme.palette.primary.main
              : alpha(theme.palette.primary.main, 0.3),
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Processing overlay animation - This creates the sliding shine effect */}
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

        {/* Header Section - Centered text with Grid */}
        <Box sx={{ p: 2, position: "relative", zIndex: 2 }}>
          <Grid container spacing={2}>
            {/* Empty left column for balance */}
            <Grid item xs={3} />

            {/* Centered Text Column */}
            <Grid item xs={6}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{
                  flexWrap: "wrap",
                }}
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

            {/* Empty right column for balance */}
            <Grid item xs={3} />
          </Grid>

          {/* Error message - centered */}
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

        {/* File List Section - Inside the same container */}
        <Collapse in={expanded && items.length > 0}>
          <Box sx={{ px: 2, py: 2, position: "relative", zIndex: 2 }}>
            <Grid container spacing={1}>
              {items.map((item, index) => {
                const isConverting = isFileConverting(item.name);
                const progress = getFileProgress(item.name);

                return (
                  <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={index}>
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
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.02,
                                ),
                              }
                            : {},
                        opacity: isConverting ? 0.8 : 1,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                      }}
                    >
                      {/* Individual file processing animation */}
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
                          <Box sx={{ color: theme.palette.text.secondary }}>
                            {item.icon}
                          </Box>
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
                              onClick={() => handlePreview(item)}
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
                              onClick={() => handleRemove(index)}
                              disabled={isConverting || isProcessing}
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>

                      {/* Progress bar for converting files */}
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
              })}
            </Grid>
          </Box>
        </Collapse>

        {/* Divider before bottom section (only if there are files) */}
        {items.length > 0 && <Divider sx={{ position: "relative", zIndex: 2 }} />}

        {/* Bottom Section with Upload Button and Controls */}
        <Box sx={{ p: 1, position: "relative", zIndex: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Left side - File count and expand controls */}
            <Grid item size={{ xs: 12, md: 6 }}>
              {items.length > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip
                    title={expanded ? "Hide file list" : "Show file list"}
                  >
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

            {/* Right side - Upload button */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleUploadClick}
                disabled={disabled || isProcessing || files.length >= maxFiles || convertingFiles.length > 0}
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

        {/* Empty state when no files */}
        {items.length === 0 && !error && (
          <Box sx={{ pb: 2, px: 2, textAlign: "center", position: "relative", zIndex: 2 }}>
            <Typography variant="caption" color="textSecondary">
              No files uploaded yet. Click the "Upload Files" button or drag and
              drop to add files.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Error Message - Compact */}
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

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={closePreview}
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
            {currentPreview?.name}
          </Typography>
          <IconButton onClick={closePreview} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          {currentPreview?.type?.startsWith("image") && (
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

          {currentPreview?.type === "application/pdf" && (
            <iframe
              src={currentPreview.url}
              title="PDF Preview"
              width="100%"
              height="600px"
              style={{ border: "none" }}
            />
          )}

          {!currentPreview?.type?.startsWith("image") &&
            currentPreview?.type !== "application/pdf" && (
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
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = currentPreview.url;
                    link.download = currentPreview.name;
                    link.click();
                  }}
                  startIcon={<DownloadIcon />}
                  sx={{ mt: 1 }}
                >
                  Download
                </Button>
              </Box>
            )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FileUpload;