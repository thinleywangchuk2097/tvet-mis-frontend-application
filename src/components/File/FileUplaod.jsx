import { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  Grid,
  Chip,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import { useTheme } from "@mui/material/styles";

const MAX_FILE_SIZE_MB = 1;

const FileUpload = ({ files = [], onFilesChange, disabled = false }) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!files || files.length === 0) {
      setItems([]);
      setPreviewOpen(false);
      setCurrentPreview(null);
    }
  }, [files]);

  useEffect(() => {
    if (files?.length) {
      const mapped = files.map((file) => ({
        file,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      }));
      setItems(mapped);
    }
  }, [files]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    const validFiles = [];
    const invalidFiles = [];

    selected.forEach((file) => {
      if (file.size / 1024 / 1024 <= MAX_FILE_SIZE_MB) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    // Show error message under the upload box
    if (invalidFiles.length) {
      setErrorMessage(
        `The following files exceed ${MAX_FILE_SIZE_MB}MB and were not added: ${invalidFiles.join(
          ", "
        )}`
      );
    } else {
      setErrorMessage(""); // clear error if all files valid
    }

    if (validFiles.length) {
      onFilesChange([...files, ...validFiles]);
    }

    e.target.value = "";
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
    setErrorMessage(""); // clear error on remove
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

  const isPreviewable =
    currentPreview?.type?.startsWith("image") ||
    currentPreview?.type === "application/pdf";

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept="
          image/png,
          image/jpeg,
          application/pdf,
          application/msword,
          application/vnd.openxmlformats-officedocument.wordprocessingml.document,
          application/vnd.ms-excel,
          application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        "
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Upload Box */}
      <Box
        onClick={() => !disabled && fileInputRef.current.click()}
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1.5,
          p: 2,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "center",
          bgcolor: theme.palette.background.paper,
        }}
      >
        <AttachFileIcon fontSize="small" />
        <Typography variant="body2">
          Attach files (Image, PDF, Word, Excel) – Max size: {MAX_FILE_SIZE_MB}MB
        </Typography>
      </Box>

      {/* Error message under upload box */}
      {errorMessage && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.error.main, mt: 1 }}
        >
          {errorMessage}
        </Typography>
      )}

      {/* File list */}
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {items.map((item, index) => (
          <Grid item key={index}>
            <Chip
              label={item.name}
              variant="outlined"
              onDelete={() => handleRemove(index)}
              deleteIcon={
                <DeleteIcon
                  sx={{
                    color: theme.palette.error.main,
                    "&:hover": { color: theme.palette.error.dark },
                    fontSize: "20px",
                  }}
                />
              }
              icon={
                <Tooltip title="View / Download">
                  <IconButton
                    size="small"
                    onClick={() => handlePreview(item)}
                  >
                    {item.type.startsWith("image") ||
                    item.type === "application/pdf" ? (
                      <VisibilityIcon fontSize="small" />
                    ) : (
                      <DownloadIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              }
              sx={{
                "& .MuiChip-deleteIcon": {
                  color: theme.palette.error.main,
                  "&:hover": { color: theme.palette.error.dark },
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      {isPreviewable && (
        <Dialog open={previewOpen} onClose={closePreview} maxWidth="md" fullWidth>
          <IconButton
            onClick={closePreview}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>

          <DialogContent>
            {currentPreview?.type?.startsWith("image") && (
              <Box
                component="img"
                src={currentPreview.url}
                alt="preview"
                sx={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }}
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
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default FileUpload;
