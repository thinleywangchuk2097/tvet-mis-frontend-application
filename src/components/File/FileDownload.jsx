import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Button } from "@mui/material";
import { Delete } from "@mui/icons-material";
import LaunchIcon from "@mui/icons-material/Launch";
import AddIcon from "@mui/icons-material/Add";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import CommonService from "../../api/services/CommonService";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const FileDownload = ({ initialFiles = [] }) => {
  const normalizeFiles = (files) =>
    files.map((f) =>
      f instanceof File
        ? { name: f.name, file: f }
        : { name: f.name || f, url: f.url }
    );

  const [files, setFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setFiles(normalizeFiles(initialFiles));
  }, [initialFiles]);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    const validFiles = selectedFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    const invalidFiles = selectedFiles.filter((f) => f.size > MAX_FILE_SIZE);

    if (invalidFiles.length > 0) {
      setErrorMessage(
        `The following files exceed 2 MB and were not added: ${invalidFiles
          .map((f) => f.name)
          .join(", ")}`
      );
    } else {
      setErrorMessage("");
    }

    const normalizedFiles = validFiles.map((f) => ({ name: f.name, file: f }));
    setFiles((prev) => [...prev, ...normalizedFiles]);
    setNewFiles((prev) => [...prev, ...normalizedFiles]);

    event.target.value = null; // reset input
  };

  // Handle download / preview
 const handleDownload = async (file) => {
  try {
    if (file.url) {
      // Fetch file from backend as blob
      const response = await CommonService.fetchDocument(file.name, file.url);
      const contentType = response.headers["content-type"];
      const disposition = response.headers["content-disposition"];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Check if file should be previewed inline
      if (disposition && disposition.includes("inline")) {
        if (contentType.startsWith("image/")) {
          // Open image in new tab using <img>
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(
              `<html><head><title>${file.name}</title></head><body style="margin:0"><img src="${url}" style="width:100%;height:auto"/></body></html>`
            );
            newWindow.document.close();
          } else {
            alert("Please allow popups to preview the file.");
          }
        } else {
          // For PDFs, let browser handle preview
          const newWindow = window.open(url);
          if (!newWindow) alert("Please allow popups to preview the file.");
        }
      } else {
        // Force download
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } else if (file.file) {
      // Local newly added file
      const url = URL.createObjectURL(file.file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    alert("Failed to download file. Please try again.");
  }
};



  // Delete only newly added files
  const handleDelete = (index) => {
    const fileToDelete = newFiles[index];
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((f) => f !== fileToDelete));
  };

  return (
    <Box>
      {/* Add Files */}
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <input
          type="file"
          id="file-upload"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button variant="contained" component="span" startIcon={<AddIcon />}>
            Add Files
          </Button>
        </label>
      </Box>

      {/* Error message */}
      {errorMessage && (
        <Typography variant="body2" color="error" mb={1}>
          {errorMessage}
        </Typography>
      )}

      {/* File list */}
      <Box display="flex" flexWrap="wrap" gap={1}>
        {files.length > 0 ? (
          files.map((file, index) => {
            const isNew = newFiles.includes(file);
            return (
              <Box key={index} display="flex" alignItems="center" gap={0.5}>
                <Typography
                  variant="body2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline", color: "primary.main" },
                  }}
                  onClick={() => handleDownload(file)}
                >
                  <FileCopyIcon fontSize="small" /> {file.name} <LaunchIcon fontSize="small" />
                </Typography>

                {isNew && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(newFiles.indexOf(file));
                    }}
                    sx={{ color: "red", p: 0, ml: 0.5 }}
                    size="small"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            );
          })
        ) : (
          <Typography color="text.secondary">No documents attached</Typography>
        )}
      </Box>
    </Box>
  );
};

export default FileDownload;
