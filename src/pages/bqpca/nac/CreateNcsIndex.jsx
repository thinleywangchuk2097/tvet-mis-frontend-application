import React, { useState, useEffect } from "react";
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
  IconButton,
  Divider,
  Box,
  Chip,
  Stack,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import NcsService from "../../../api/services/internal/ncs/NcsService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";

// Helper function to convert file to Base64
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

const CreateNcsIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFileDialog, setOpenFileDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedItemTitle, setSelectedItemTitle] = useState("");
  const access_token = useSelector((state) => state.auth.accessToken);

  // State for dropdown data
  const [sectors, setSectors] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState("");

  // State for mapping occupation to course title
  const [occupationCourseMap, setOccupationCourseMap] = useState({});

  // State for editing item data
  const [editData, setEditData] = useState(null);

  // State for NCS data from API
  const [data, setData] = useState([]);

  // State for existing files in edit mode
  const [existingFiles, setExistingFiles] = useState([]);

  const fetchSectors = async () => {
    try {
      const sectorDtls = await CommonService.getAllSectors();
      setSectors(sectorDtls.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast.error("Failed to fetch sectors");
    }
  };

  const fetchCertificationLevels = async () => {
    try {
      const certifications = await CommonService.getByParentId(27);
      setCertificationLevels(certifications.data);
    } catch (error) {
      console.error("Error fetching certification levels:", error);
      toast.error("Failed to fetch certification levels");
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    try {
      const occupationLists =
        await CommonService.getOccupationsBySectorId(sectorId);
      setOccupations(occupationLists.data);

      const mapping = {};
      occupationLists.data.forEach((occ) => {
        if (occ.courseTitle) {
          mapping[occ.id] = occ.courseTitle;
        } else {
          mapping[occ.id] = `${occ.occupationName} Course`;
        }
      });
      setOccupationCourseMap(mapping);
    } catch (error) {
      console.error("Error fetching occupations:", error);
      toast.error("Failed to fetch occupations");
    }
  };

  useEffect(() => {
    fetchSectors();
    fetchCertificationLevels();
    fetchNcsData();
  }, []);

  useEffect(() => {
    if (selectedSectorId) {
      fetchOccupationsBySector(selectedSectorId);
    }
  }, [selectedSectorId]);

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  // Helper function to format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Fetch NCS data using getNcsDetails
  const fetchNcsData = async () => {
    setFetchingData(true);
    try {
      const response = await NcsService.getNcsDetails(access_token);
      console.log("NCS Data fetched:", response.data);

      if (response.status === 200 || response.status === 201) {
        const transformedData = response.data.map((item, index) => {
          let units = [];
          try {
            units =
              typeof item.units === "string"
                ? JSON.parse(item.units)
                : item.units || [];
          } catch (e) {
            console.error("Error parsing units:", e);
            units = [];
          }

          let documents = [];
          try {
            if (typeof item.documents === "string") {
              documents = JSON.parse(item.documents);
            } else if (Array.isArray(item.documents)) {
              documents = item.documents;
            } else {
              documents = [];
            }

            // Ensure each document has documentId
            documents = documents.map((doc) => ({
              ...doc,
              documentId: doc.documentId || doc.id || null,
            }));
          } catch (e) {
            console.error("Error parsing documents:", e);
            documents = [];
          }

          return {
            id: item.publicationId || index + 1,
            sector: item.sectorName || "N/A",
            occupation: item.occupationName || "N/A",
            bqfLevel: item.certificationName || "N/A",
            validityDate: item.validityDate || "N/A",
            courseTitle: item.courseTitle || "N/A",
            units: units,
            documents: documents,
          };
        });

        setData(transformedData);
      }
    } catch (error) {
      console.error("Error fetching NCS data:", error);
      toast.error("Failed to fetch NCS data");
    } finally {
      setFetchingData(false);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setEditData(item);
      setExistingFiles(item.documents || []);

      const occupation = occupations.find(
        (occ) => occ.occupationName === item.occupation,
      );
      const sector = sectors.find((sec) => sec.sectorName === item.sector);
      const certification = certificationLevels.find(
        (cert) => cert.name === item.bqfLevel,
      );

      if (sector) {
        setSelectedSectorId(sector.id);
      }

      console.log("Editing item:", item);
      console.log("Existing files:", item.documents);
    } else {
      setEditingId(null);
      setEditData(null);
      setExistingFiles([]);
      setSelectedSectorId("");
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setEditData(null);
    setExistingFiles([]);
    setSelectedSectorId("");
  };

  const handleOpenFileDialog = (files, title) => {
    setSelectedFiles(files || []);
    setSelectedItemTitle(title || "");
    setOpenFileDialog(true);
  };

  const handleCloseFileDialog = () => {
    setOpenFileDialog(false);
    setSelectedFiles([]);
    setSelectedItemTitle("");
  };

  // Helper function to get file icon based on file type
  const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFileIcon />;
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return <PictureAsPdfIcon color="error" />;
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension))
      return <ImageIcon color="primary" />;
    if (["doc", "docx"].includes(extension))
      return <DescriptionIcon color="primary" />;
    if (["xls", "xlsx"].includes(extension))
      return <DescriptionIcon color="success" />;
    return <InsertDriveFileIcon />;
  };

  // Handle file view - Opens file in new tab
  const handleFileView = async (file) => {
    // If file has documentId, download and open
    if (file.documentId) {
      try {
        const response = await NcsService.downloadFile(
          file.documentId,
          access_token,
        );
        if (response.status === 200) {
          // Create a blob URL and open in new tab
          const blob = new Blob([response.data], {
            type: file.contentType || "application/octet-stream",
          });
          const url = window.URL.createObjectURL(blob);
          window.open(url, "_blank");
          // Revoke the URL after a delay to free memory
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        } else {
          toast.error("Failed to view file");
        }
      } catch (error) {
        console.error("Error viewing file:", error);
        toast.error("Failed to view file");
      }
    } else if (file.url) {
      // If file has a direct URL (from API)
      window.open(file.url, "_blank");
    } else if (file.content) {
      // If file has base64 content
      const fileUrl = `data:${file.contentType || "application/octet-stream"};base64,${file.content}`;
      window.open(fileUrl, "_blank");
    } else {
      toast.warning("File URL not available");
    }
  };

  // Handle file download - Downloads file to local machine
  const handleFileDownload = async (file) => {
    // If file has documentId, download via API
    if (file.documentId) {
      try {
        const response = await NcsService.downloadFile(
          file.documentId,
          access_token,
        );
        if (response.status === 200) {
          // Create a download link
          const blob = new Blob([response.data], {
            type: file.contentType || "application/octet-stream",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name || "download";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("File downloaded successfully!");
        } else {
          toast.error("Failed to download file");
        }
      } catch (error) {
        console.error("Error downloading file:", error);
        toast.error("Failed to download file");
      }
    } else if (file.url) {
      // If file has a direct URL
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.content) {
      // If file has base64 content
      const link = document.createElement("a");
      link.href = `data:${file.contentType || "application/octet-stream"};base64,${file.content}`;
      link.download = file.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.warning("File content not available");
    }
  };

  // Helper function to get all units for search
  const getAllUnitCodes = (item) => {
    return item.units?.map((unit) => unit.unitCode).join(" ") || "";
  };

  const getAllUnitTitles = (item) => {
    return item.units?.map((unit) => unit.unitTitle).join(" ") || "";
  };

  const filteredData = data.filter(
    (item) =>
      item.sector?.toLowerCase().includes(search.toLowerCase()) ||
      item.occupation?.toLowerCase().includes(search.toLowerCase()) ||
      getAllUnitCodes(item).toLowerCase().includes(search.toLowerCase()) ||
      getAllUnitTitles(item).toLowerCase().includes(search.toLowerCase()),
  );

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const getInitialValues = () => {
    if (editData) {
      const occupation = occupations.find(
        (occ) => occ.occupationName === editData.occupation,
      );
      const sector = sectors.find((sec) => sec.sectorName === editData.sector);
      const certification = certificationLevels.find(
        (cert) => cert.name === editData.bqfLevel,
      );

      const formattedDate = formatDateForInput(editData.validityDate);

      return {
        sectorId: sector?.id || "",
        occupationId: occupation?.id || "",
        certificationId: certification?.id || "",
        validityDate: formattedDate || "",
        courseTitle: editData.courseTitle || "",
        units:
          editData.units && editData.units.length > 0
            ? editData.units
            : [{ unitCode: "", unitTitle: "" }],
        documents: [],
        existingFiles: editData.documents || [],
      };
    }
    return {
      sectorId: "",
      occupationId: "",
      certificationId: "",
      validityDate: "",
      courseTitle: "",
      units: [{ unitCode: "", unitTitle: "" }],
      documents: [],
      existingFiles: [],
    };
  };

  const validationSchema = Yup.object().shape({
    sectorId: Yup.string().required("Sector is required"),
    occupationId: Yup.string().required("Occupation is required"),
    certificationId: Yup.string().required("Certification is required"),
    courseTitle: Yup.string().required("Course Title is required"),
    validityDate: Yup.date()
      .required("Validity Date is required")
      .min(new Date(), "Validity Date must be in the future"),
    units: Yup.array()
      .of(
        Yup.object().shape({
          unitCode: Yup.string().required("Unit Code is required"),
          unitTitle: Yup.string()
            .required("Unit Title is required")
            .min(3, "Unit Title must be at least 3 characters"),
        }),
      )
      .min(1, "At least one unit is required"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      let documentsToSend = [];

      if (editingId) {
        // FOR UPDATE: Only send NEW documents with content
        const newDocuments = await Promise.all(
          values.documents.map(async (file) => {
            if (file.content) {
              return {
                name: file.name,
                content: file.content,
                contentType: file.type || "application/octet-stream",
              };
            } else {
              const result = await fileToBase64(file);
              return {
                name: result.name,
                content: result.content,
                contentType: result.contentType,
              };
            }
          }),
        );

        // Only send documents that have content (new files)
        documentsToSend = newDocuments.filter(
          (doc) => doc.content && doc.content.length > 0,
        );

        console.log(
          `Sending ${documentsToSend.length} new documents for update`,
        );
      } else {
        // FOR CREATE: Send all documents (all have content)
        const allDocuments = await Promise.all(
          values.documents.map(async (file) => {
            if (file.content) {
              return {
                name: file.name,
                content: file.content,
                contentType: file.type || "application/octet-stream",
              };
            } else {
              const result = await fileToBase64(file);
              return {
                name: result.name,
                content: result.content,
                contentType: result.contentType,
              };
            }
          }),
        );

        documentsToSend = allDocuments;
        console.log(`Sending ${documentsToSend.length} documents for create`);
      }

      const payload = {
        occupationId: parseInt(values.occupationId),
        certificationId: parseInt(values.certificationId),
        validityDate: values.validityDate,
        courseTitle: values.courseTitle,
        units: values.units,
        documents: documentsToSend,
        publicationType: "n",
        createdBy: 1,
        updatedBy: 1,
      };

      console.log("Sending payload with documents:", payload);

      if (editingId) {
        const response = await NcsService.updateNcs(
          editingId,
          payload,
          access_token,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("NCS updated successfully!");
          resetForm();
          setOpenDialog(false);
          await fetchNcsData();
        } else {
          toast.error(response.data?.message || "Failed to update NCS");
        }
      } else {
        const response = await NcsService.submitNcs(payload, access_token);
        if (response.status === 200 || response.status === 201) {
          toast.success("NCS created successfully!");
          resetForm();
          setOpenDialog(false);
          await fetchNcsData();
        } else {
          toast.error(response.data?.message || "Failed to create NCS");
        }
      }
    } catch (error) {
      console.error("Error submitting NCS:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit NCS",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this NCS?")) {
      try {
        const response = await NcsService.deleteNcs(id, access_token);
        if (response.status === 200 || response.status === 201) {
          toast.success("NCS deleted successfully!");
          await fetchNcsData();
        } else {
          toast.error(response.data?.message || "Failed to delete NCS");
        }
      } catch (error) {
        console.error("Error deleting NCS:", error);
        toast.error("Failed to delete NCS");
      }
    }
  };

  // Function to render multiple units in table cells
  const renderUnitCodes = (units) => {
    if (!units || units.length === 0) return "N/A";
    return units.map((unit, idx) => (
      <Box key={`code-${idx}`} sx={{ mb: 0.5 }}>
        <Chip
          label={unit.unitCode}
          size="small"
          color="secondary"
          variant="outlined"
        />
        {idx < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
      </Box>
    ));
  };

  const renderUnitTitles = (units) => {
    if (!units || units.length === 0) return "N/A";
    return units.map((unit, idx) => (
      <Box key={`title-${idx}`} sx={{ mb: 0.5 }}>
        <Typography variant="body2">{unit.unitTitle}</Typography>
        {idx < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
      </Box>
    ));
  };

  // Function to render file attachments in table
  const renderFileAttachments = (documents) => {
    if (!documents || documents.length === 0) {
      return (
        <Typography variant="caption" color="textSecondary">
          No files
        </Typography>
      );
    }
    return (
      <Stack direction="column" spacing={0.5}>
        {documents.map((file, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            {getFileIcon(file.name)}
            <Typography
              variant="caption"
              sx={{
                maxWidth: "80px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name || `File ${index + 1}`}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleFileView(file)}
              title="View"
              sx={{ p: 0.5 }}
              disabled={!file.documentId && !file.url && !file.content}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFileDownload(file)}
              title="Download"
              sx={{ p: 0.5 }}
              disabled={!file.documentId && !file.url && !file.content}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>
    );
  };

  // Function to render existing files in edit form with remove option
  const renderExistingFiles = (files, formik) => {
    if (!files || files.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
          No existing files
        </Typography>
      );
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Existing Files ({files.length})
        </Typography>
        <Stack spacing={1}>
          {files.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1,
                bgcolor: "#f5f5f5",
                borderRadius: 1,
                border: "1px solid #e0e0e0",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}
              >
                {getFileIcon(file.name)}
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {file.name || `File ${index + 1}`}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {file.contentType || "Unknown type"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => handleFileView(file)}
                  title="View"
                  disabled={!file.documentId && !file.url && !file.content}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleFileDownload(file)}
                  title="Download"
                  disabled={!file.documentId && !file.url && !file.content}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    // Remove file from existingFiles
                    const updatedFiles = existingFiles.filter(
                      (_, i) => i !== index,
                    );
                    setExistingFiles(updatedFiles);
                    formik.setFieldValue("existingFiles", updatedFiles);
                  }}
                  title="Remove file"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  const handleOccupationChange = (e, setFieldValue) => {
    const occupationId = e.target.value;
    setFieldValue("occupationId", occupationId);

    if (occupationId && occupationCourseMap[occupationId]) {
      setFieldValue("courseTitle", occupationCourseMap[occupationId]);
    } else {
      setFieldValue("courseTitle", "");
    }
  };

  if (fetchingData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        NCS Management
      </Typography>

      {/* Search + Add Button */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search by Sector, Occupation, Unit Code or Title"
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
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ height: "36px" }}
          >
            Create
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Occupation</TableCell>
              <TableCell>BQF Level</TableCell>
              <TableCell>Validity Date</TableCell>
              <TableCell>Programme Title</TableCell>
              <TableCell>Unit Code</TableCell>
              <TableCell>Unit Title</TableCell>
              <TableCell>Attachments</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{item.sector}</TableCell>
                    <TableCell>{item.occupation}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.bqfLevel}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.validityDate}</TableCell>
                    <TableCell>{item.courseTitle}</TableCell>
                    <TableCell>{renderUnitCodes(item.units)}</TableCell>
                    <TableCell>{renderUnitTitles(item.units)}</TableCell>
                    <TableCell>
                      {renderFileAttachments(item.documents)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
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

      {/* File Attachment Dialog */}
      <Dialog
        open={openFileDialog}
        onClose={handleCloseFileDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AttachFileIcon sx={{ mr: 1 }} />
            Attachments - {selectedItemTitle}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFiles && selectedFiles.length > 0 ? (
            <List>
              {selectedFiles.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleFileView(file)}
                        title="View"
                        disabled={
                          !file.documentId && !file.url && !file.content
                        }
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleFileDownload(file)}
                        title="Download"
                        disabled={
                          !file.documentId && !file.url && !file.content
                        }
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemIcon>{getFileIcon(file.name)}</ListItemIcon>
                  <ListItemText
                    primary={file.name || `File ${index + 1}`}
                    secondary={file.contentType || "Unknown type"}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="textSecondary">
                No attachments available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseFileDialog}
            variant="contained"
            color="primary"
            size="small"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit NCS Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Edit NCS Details" : "Create New NCS"}
        </DialogTitle>
        <Formik
          enableReinitialize={true}
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Sector Dropdown */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={requiredLabel("Sector")}
                      name="sectorId"
                      size="small"
                      value={formik.values.sectorId || ""}
                      onChange={(e) => {
                        const sectorId = e.target.value;
                        formik.handleChange(e);
                        setSelectedSectorId(sectorId);
                        formik.setFieldValue("occupationId", "");
                        formik.setFieldValue("courseTitle", "");
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.sectorId &&
                        Boolean(formik.errors.sectorId)
                      }
                      helperText={
                        formik.touched.sectorId && formik.errors.sectorId
                      }
                      disabled={loading}
                    >
                      <MenuItem value="">Select Sector</MenuItem>
                      {sectors.map((sec) => (
                        <MenuItem key={sec.id} value={sec.id}>
                          {sec.sectorName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Occupation Dropdown */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={requiredLabel("Occupation")}
                      name="occupationId"
                      size="small"
                      value={formik.values.occupationId || ""}
                      onChange={(e) =>
                        handleOccupationChange(e, formik.setFieldValue)
                      }
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.occupationId &&
                        Boolean(formik.errors.occupationId)
                      }
                      helperText={
                        formik.touched.occupationId &&
                        formik.errors.occupationId
                      }
                      disabled={loading || !formik.values.sectorId}
                    >
                      <MenuItem value="">Select Occupation</MenuItem>
                      {occupations.map((occ) => (
                        <MenuItem key={occ.id} value={occ.id}>
                          {occ.occupationName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* BQF Level Dropdown */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={requiredLabel("BQF Level")}
                      name="certificationId"
                      size="small"
                      value={formik.values.certificationId || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.certificationId &&
                        Boolean(formik.errors.certificationId)
                      }
                      helperText={
                        formik.touched.certificationId &&
                        formik.errors.certificationId
                      }
                      disabled={loading}
                    >
                      <MenuItem value="">Select BQF Level</MenuItem>
                      {certificationLevels.map((lvl) => (
                        <MenuItem key={lvl.id} value={lvl.id}>
                          {lvl.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Validity Date */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={requiredLabel("Validity Date")}
                      name="validityDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.validityDate || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        formik.setFieldValue("validityDate", value);
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.validityDate &&
                        Boolean(formik.errors.validityDate)
                      }
                      helperText={
                        formik.touched.validityDate &&
                        formik.errors.validityDate
                      }
                    />
                  </Grid>

                  {/* Course Title - Auto-populated */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      label={requiredLabel("Programme Title")}
                      name="courseTitle"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.courseTitle}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseTitle &&
                        Boolean(formik.errors.courseTitle)
                      }
                      helperText={
                        formik.touched.courseTitle && formik.errors.courseTitle
                      }
                      disabled={loading}
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        "& .MuiInputBase-input.Mui-readOnly": {
                          backgroundColor: "#f5f5f5",
                          cursor: "not-allowed",
                        },
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      Auto-populated based on selected occupation
                    </Typography>
                  </Grid>

                  {/* Unit Details Section - Compact */}
                  <Grid item size={{ xs: 12 }}>
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        Unit Details
                      </Typography>

                      <FieldArray name="units">
                        {({ push, remove, form }) => (
                          <>
                            {form.values.units.map((unit, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <TextField
                                  size="small"
                                  placeholder="Title"
                                  name={`units.${index}.unitTitle`}
                                  value={unit.unitTitle}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.units?.[index]?.unitTitle &&
                                    Boolean(
                                      formik.errors.units?.[index]?.unitTitle,
                                    )
                                  }
                                  helperText={
                                    formik.touched.units?.[index]?.unitTitle &&
                                    formik.errors.units?.[index]?.unitTitle
                                  }
                                  disabled={loading}
                                  sx={{ flex: 2 }}
                                />
                                <TextField
                                  size="small"
                                  placeholder="Code"
                                  name={`units.${index}.unitCode`}
                                  value={unit.unitCode}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.units?.[index]?.unitCode &&
                                    Boolean(
                                      formik.errors.units?.[index]?.unitCode,
                                    )
                                  }
                                  helperText={
                                    formik.touched.units?.[index]?.unitCode &&
                                    formik.errors.units?.[index]?.unitCode
                                  }
                                  disabled={loading}
                                  sx={{ flex: 1 }}
                                />

                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => remove(index)}
                                  disabled={
                                    loading || form.values.units.length <= 1
                                  }
                                >
                                  <RemoveCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}

                            <Button
                              type="button"
                              variant="outlined"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() =>
                                push({ unitCode: "", unitTitle: "" })
                              }
                              disabled={loading}
                              fullWidth
                              sx={{ mt: 1, py: 0.5 }}
                            >
                              Add Unit
                            </Button>

                            {formik.touched.units && formik.errors.units && (
                              <Typography
                                color="error"
                                variant="caption"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                {typeof formik.errors.units === "string"
                                  ? formik.errors.units
                                  : "Fill all unit details"}
                              </Typography>
                            )}
                          </>
                        )}
                      </FieldArray>
                    </Paper>
                  </Grid>

                  {/* Documents Upload - Updated with existing files management */}
                  <Grid item size={{ xs: 12 }}>
                    <Paper
                      sx={{
                        p: { xs: 2, md: 3 },
                        mb: 2,
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Supporting Documents
                      </Typography>
                      <Divider sx={{ mb: 3 }} />

                      {/* Show existing files for edit mode */}
                      {editingId && existingFiles.length > 0 && (
                        <>
                          {renderExistingFiles(existingFiles, formik)}
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Add New Files
                          </Typography>
                        </>
                      )}

                      <Box
                        sx={{
                          p: 2,
                          border: "1px dashed #bdbdbd",
                          borderRadius: 2,
                          minHeight: 100,
                        }}
                      >
                        <FileUpload
                          files={formik.values.documents}
                          onFilesChange={(files) =>
                            formik.setFieldValue("documents", files)
                          }
                          disabled={loading}
                        />
                      </Box>

                      {formik.touched.documents && formik.errors.documents && (
                        <Typography
                          color="error"
                          variant="caption"
                          sx={{ display: "block", mt: 1 }}
                        >
                          {formik.errors.documents}
                        </Typography>
                      )}

                      {/* Show total file count */}
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Total files:{" "}
                        {(existingFiles?.length || 0) +
                          (formik.values.documents?.length || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleCloseDialog}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : editingId ? "Update" : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CreateNcsIndex;
