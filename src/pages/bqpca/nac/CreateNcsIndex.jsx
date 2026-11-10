import React, { useState, useEffect, useRef } from "react";
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
  Link,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  AlertTitle,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { exportToExcel } from "@/utils/exportExcel";

// Sector filter value that loads every NCS
const ALL_SECTORS = "all";

// NCS due for renewal: expiring within this many days is flagged red
const EXPIRY_WARNING_DAYS = 90; // 3 months

/** Validity state of an NCS: expired / soon (within 3 months) / valid / none. */
const getValidityInfo = (validityDate) => {
  if (!validityDate || validityDate === "N/A") return { state: "none", days: null };
  const d = new Date(validityDate);
  if (Number.isNaN(d.getTime())) return { state: "none", days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  if (days < 0) return { state: "expired", days };
  if (days <= EXPIRY_WARNING_DAYS) return { state: "soon", days };
  return { state: "valid", days };
};

const VALIDITY_FILTERS = [
  { value: "", label: "All" },
  { value: "soon", label: "Expiring within 3 months" },
  { value: "expired", label: "Expired" },
  { value: "valid", label: "Valid" },
];
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
import WarningIcon from "@mui/icons-material/Warning";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import NcsService from "../../../api/services/internal/ncs/NcsService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";

// ==================== GENERAL HELPERS ====================

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

// Helper function to parse documents from JSON string
const parseDocuments = (documentsStr) => {
  if (!documentsStr) return [];

  try {
    const docs = JSON.parse(documentsStr);

    return docs.map((doc) => ({
      id: doc.id || doc.documentId,
      name: doc.documentName || doc.name || "Unnamed file",
      url: doc.url || doc.fileUrl || null,
      contentType: doc.contentType || doc.type || "application/octet-stream",
      createdAt: doc.createdAt,
    }));
  } catch {
    return [];
  }
};

// ==================== DOCUMENT HELPERS ====================

const processDocuments = async (documents) => {
  return await Promise.all(
    documents.map(async (file) => {
      if (file.content) {
        return {
          name: file.name,
          content: file.content,
          contentType: file.type || "application/octet-stream",
        };
      }

      const result = await fileToBase64(file);

      return {
        name: result.name,
        content: result.content,
        contentType: result.contentType,
      };
    }),
  );
};

// ==================== PAYLOAD HELPERS ====================

const buildPayload = (values, editingId, editData, actionId) => {
  if (editingId) {
    return {
      applicationNo: editData?.applicationNo || "",
      validityDate: values.validityDate,
      programmeTitle: values.programmeTitle,
      units: values.units,
      documents: values.documents,
      updatedBy: actionId,
      serviceId: 21,
    };
  }

  return {
    applicationNo: "",
    occupationId: parseInt(values.occupationId),
    certificationId: parseInt(values.certificationId),
    sectorId: parseInt(values.sectorId),
    validityDate: values.validityDate,
    programmeTitle: values.programmeTitle,
    units: values.units,
    serviceId: 21,
    documents: values.documents,
    createdBy: actionId,
    updatedBy: actionId,
  };
};

// ==================== DUPLICATE CHECK HELPERS ====================

const performDuplicateCheck = async (values, editingId, checkExistingNcsFn) => {
  if (editingId) return false;

  const exists = await checkExistingNcsFn(
    values.sectorId,
    values.occupationId,
    values.certificationId,
  );

  return exists;
};

// ==================== FIELD CHANGE HELPERS ====================

const updateSectorSelection = (
  fieldName,
  value,
  formik,
  setSelectedSectorId,
  editingId,
) => {
  if (fieldName !== "sectorId") {
    return;
  }

  setSelectedSectorId(value);

  if (!editingId) {
    formik.setFieldValue("occupationId", "");
  }
};

const getUpdatedFieldValues = (formik, fieldName, value) => {
  const { sectorId, occupationId, certificationId } = formik.values;

  return {
    sectorId: fieldName === "sectorId" ? value : sectorId,
    occupationId: fieldName === "occupationId" ? value : occupationId,
    certificationId: fieldName === "certificationId" ? value : certificationId,
  };
};

const shouldCheckDuplicate = (values, editingId) => {
  return (
    !editingId &&
    Boolean(values.sectorId) &&
    Boolean(values.occupationId) &&
    Boolean(values.certificationId)
  );
};

const createFieldChangeHandler = (
  formik,
  setSelectedSectorId,
  setIsDuplicate,
  checkExistingNcsFn,
  editingId,
) => {
  return async (fieldName, value) => {
    formik.handleChange({
      target: {
        name: fieldName,
        value,
      },
    });

    formik.setFieldValue(fieldName, value);
    setIsDuplicate(false);

    updateSectorSelection(
      fieldName,
      value,
      formik,
      setSelectedSectorId,
      editingId,
    );

    const updatedValues = getUpdatedFieldValues(formik, fieldName, value);

    if (!shouldCheckDuplicate(updatedValues, editingId)) {
      return;
    }

    await checkExistingNcsFn(
      updatedValues.sectorId,
      updatedValues.occupationId,
      updatedValues.certificationId,
    );
  };
};

// ==================== COMPONENT ====================

const CreateNcsIndex = () => {
  // ==================== SEARCH / PAGINATION ====================

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ==================== DIALOG STATE ====================

  const [openDialog, setOpenDialog] = useState(false);
  const [openFileDialog, setOpenFileDialog] = useState(false);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);

  // ==================== EDITING STATE ====================

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  // ==================== LOADING STATE ====================

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // ==================== FILE STATE ====================

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedItemTitle, setSelectedItemTitle] = useState("");

  // ==================== REDUX STATE ====================

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  // ==================== DROPDOWN STATE ====================

  const [sectors, setSectors] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState("");

  // List filters: sector is fetched from the API, occupation filters the loaded rows
  const [filterSectorId, setFilterSectorId] = useState("");
  const [filterOccupationId, setFilterOccupationId] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [validityFilter, setValidityFilter] = useState("");

  // ==================== REFS ====================

  const sectorsRef = useRef([]);
  const certificationsRef = useRef([]);
  const occupationsRef = useRef([]);

  // ==================== NCS DATA ====================

  const [data, setData] = useState([]);

  // ==================== DUPLICATE STATE ====================

  const [duplicateCheckData, setDuplicateCheckData] = useState({
    sectorId: "",
    occupationId: "",
    certificationId: "",
  });

  const [isDuplicate, setIsDuplicate] = useState(false);

  // ==================== API CALLS ====================

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      const sectorData = response.data || [];
      setSectors(sectorData);
      sectorsRef.current = sectorData;
      return sectorData;
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast.error("Failed to fetch sectors");
      return [];
    }
  };

  const fetchCertificationLevels = async () => {
    try {
      const response = await CommonService.getByParentId(27);
      const certData = response.data || [];
      setCertificationLevels(certData);
      certificationsRef.current = certData;
      return certData;
    } catch (error) {
      console.error("Error fetching certification levels:", error);
      toast.error("Failed to fetch certification levels");
      return [];
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    if (!sectorId) {
      setOccupations([]);
      occupationsRef.current = [];
      return;
    }
    setLoadingOccupations(true);
    try {
      const response = await CommonService.getOccupationsBySectorId(sectorId);
      const occData = response.data || [];
      setOccupations(occData);
      occupationsRef.current = occData;
      return occData;
    } catch (error) {
      console.error("Error fetching occupations:", error);
      toast.error("Failed to fetch occupations");
      return [];
    } finally {
      setLoadingOccupations(false);
    }
  };

  // ==================== DISPLAY HELPERS ====================

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const getSectorName = (sectorId) => {
    if (!sectorId) return "N/A";
    const dataToUse =
      sectorsRef.current.length > 0 ? sectorsRef.current : sectors;
    if (!dataToUse || dataToUse.length === 0) {
      return "Loading...";
    }

    const sector = dataToUse.find(
      (item) => Number(item.id) === Number(sectorId),
    );

    return sector?.sectorName || `Sector ${sectorId}`;
  };

  const getOccupationName = (occupationId) => {
    if (!occupationId) return "N/A";

    const dataToUse =
      occupationsRef.current.length > 0 ? occupationsRef.current : occupations;

    if (!dataToUse || dataToUse.length === 0) {
      return "Loading...";
    }

    const occupation = dataToUse.find(
      (item) => Number(item.id) === Number(occupationId),
    );

    return occupation?.occupationName || `Occupation ${occupationId}`;
  };

  const getCertificationName = (certificationId) => {
    if (!certificationId) return "N/A";
    const dataToUse =
      certificationsRef.current.length > 0
        ? certificationsRef.current
        : certificationLevels;
    if (!dataToUse || dataToUse.length === 0) {
      return "Loading...";
    }

    const certification = dataToUse.find(
      (item) => Number(item.id) === Number(certificationId),
    );

    return certification?.name || `Certification ${certificationId}`;
  };

  const getFileIcon = (fileName) => {
    if (!fileName) {
      return <InsertDriveFileIcon />;
    }

    const extension = fileName.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return <PictureAsPdfIcon color="error" />;
    }

    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension)) {
      return <ImageIcon color="primary" />;
    }

    if (["doc", "docx"].includes(extension)) {
      return <DescriptionIcon color="primary" />;
    }

    if (["xls", "xlsx"].includes(extension)) {
      return <DescriptionIcon color="success" />;
    }

    return <InsertDriveFileIcon />;
  };

  const getAllUnitCodes = (item) => {
    return item.units?.map((unit) => unit.unitCode).join(" ") || "";
  };

  const getAllUnitTitles = (item) => {
    return item.units?.map((unit) => unit.unitTitle).join(" ") || "";
  };

  // ==================== DOCUMENT HANDLING ====================

  const getDocumentLinks = (documents) => {
    if (!documents) return [];

    try {
      if (typeof documents === "string") {
        return parseDocuments(documents);
      }

      if (Array.isArray(documents)) {
        return documents.map((doc) => ({
          id: doc.id || doc.documentId,
          name: doc.documentName || doc.name || "Unnamed file",
          url: doc.url || doc.fileUrl || null,
          contentType:
            doc.contentType || doc.type || "application/octet-stream",
          createdAt: doc.createdAt,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error parsing documents:", error);
      return [];
    }
  };

  const handleDownload = async (file) => {
    if (!file?.url) {
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

  const handleFileView = async (file) => {
    if (!file?.url) {
      toast.error("File URL not found");
      return;
    }

    if (file.url.startsWith("D:/") || file.url.startsWith("file://")) {
      toast.warning(
        "File path is local and cannot be accessed directly in browser",
      );
      return;
    }

    try {
      window.open(file.url, "_blank");
    } catch (error) {
      console.error("Error viewing file:", error);

      toast.error("Failed to view file");
    }
  };

  // ==================== DATA FETCHING ====================

  const fetchNcsData = async (sectorId = filterSectorId) => {
    if (!sectorId) {
      setData([]);
      return;
    }

    setLoadingList(true);
    try {
      // "all" = every NCS; otherwise one sector
      const response =
        sectorId === ALL_SECTORS
          ? await NcsService.getNcsDetails(access_token)
          : await NcsService.getNcsDetailsBySector(sectorId, access_token);

      console.log("Fetched NCS data:", response.data);

      if (response.status !== 200 && response.status !== 201) {
        return;
      }

      const transformedData = response.data.map((item) => {
        let units = [];

        try {
          units =
            typeof item.units === "string"
              ? JSON.parse(item.units)
              : item.units || [];
        } catch {
          units = [];
        }

        const documents = getDocumentLinks(item.documents);

        const sectorId = item.sector_id || item.sectorId;
        const occupationId = item.occupation_id || item.occupationId;
        const certificationId = item.certification_id || item.certificationId;

        return {
          id: item.id || item.publicationId,
          applicationNo: item.application_no || "",
          sector: getSectorName(sectorId),
          occupation: item.occupation_name || getOccupationName(occupationId),
          bqfLevel: getCertificationName(certificationId),
          validityDate: item.validity_date || item.validityDate || "N/A",
          programmeTitle: item.programme_title || item.programmeTitle || "N/A",
          units,
          documents,
          sectorId,
          occupationId,
          certificationId,
        };
      });

      setData(transformedData);
    } catch (error) {
      console.error("Error fetching NCS data:", error);

      toast.error("Failed to fetch NCS data");
    } finally {
      setLoadingList(false);
    }
  };

  // ==================== DUPLICATE CHECK ====================

  const checkExistingNcs = async (sectorId, occupationId, certificationId) => {
    if (!sectorId || !occupationId || !certificationId) {
      setIsDuplicate(false);
      return false;
    }

    setCheckingExisting(true);

    try {
      const response = await NcsService.getAlreadyNcsDetailsExist(
        sectorId,
        occupationId,
        certificationId,
        access_token,
      );

      console.log("Check existing NCS response:", response);

      if (response.data && response.data.length > 0) {
        setIsDuplicate(true);

        setDuplicateCheckData({
          sectorId,
          occupationId,
          certificationId,
        });

        setOpenDuplicateDialog(true);

        return true;
      }

      setIsDuplicate(false);

      return false;
    } catch (error) {
      console.error("Error checking existing NCS:", error);

      setIsDuplicate(false);

      return false;
    } finally {
      setCheckingExisting(false);
    }
  };

  // ==================== SUBMIT ====================

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    const exists = await performDuplicateCheck(
      values,
      editingId,
      checkExistingNcs,
    );

    if (exists) {
      setSubmitting(false);
      return;
    }

    setLoading(true);

    try {
      const processedDocuments = await processDocuments(values.documents);

      values.documents = editingId
        ? processedDocuments.filter(
            (doc) => doc.content && doc.content.length > 0,
          )
        : processedDocuments;

      const payload = buildPayload(values, editingId, editData, actionId);

      console.log("Submitting payload:", payload);

      const response = editingId
        ? await NcsService.updateNcs(editingId, payload, access_token)
        : await NcsService.submitNcs(payload, access_token);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          editingId ? "NCS updated successfully!" : "NCS created successfully!",
        );

        const savedSectorId = String(values.sectorId || "");

        resetForm();

        setOpenDialog(false);

        // show the sector that was just saved
        if (
          savedSectorId &&
          filterSectorId !== ALL_SECTORS &&
          savedSectorId !== String(filterSectorId)
        ) {
          setFilterSectorId(savedSectorId);
        } else {
          await fetchNcsData();
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

  // ==================== INITIAL DATA ====================

  useEffect(() => {
    const loadAllData = async () => {
      setFetchingData(true);

      try {
        const [sectorsData, certData] = await Promise.all([
          fetchSectors(),
          fetchCertificationLevels(),
        ]);

        if (sectorsData?.length > 0) {
          const defaultSector =
            sectorsData.find((sector) => Number(sector.id) === 1) ||
            sectorsData[0];

          if (defaultSector) {
            await fetchOccupationsBySector(defaultSector.id);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);

        toast.error("Failed to load data");
      } finally {
        setFetchingData(false);
      }
    };

    loadAllData();
  }, []);

  // Load the list whenever the sector filter changes
  useEffect(() => {
    setFilterOccupationId("");
    setPage(0);
    fetchNcsData(filterSectorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSectorId]);

  useEffect(() => {
    if (selectedSectorId) {
      fetchOccupationsBySector(selectedSectorId);
      return;
    }

    setOccupations([]);
    occupationsRef.current = [];
  }, [selectedSectorId]);

  // ==================== HANDLERS ====================

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);

    setPage(0);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setEditData(item);

      if (item.sectorId) {
        setSelectedSectorId(item.sectorId);

        fetchOccupationsBySector(item.sectorId);
      }
    } else {
      setEditingId(null);
      setEditData(null);
      setSelectedSectorId("");
      setOccupations([]);
      occupationsRef.current = [];
      setIsDuplicate(false);
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setEditData(null);
    setSelectedSectorId("");
    setOccupations([]);
    occupationsRef.current = [];
    setOpenDuplicateDialog(false);
    setIsDuplicate(false);
  };

  const handleCloseDuplicateDialog = () => {
    setOpenDuplicateDialog(false);
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

  // ==================== FORM INITIAL VALUES ====================

  const getInitialValues = () => {
    if (editData) {
      return {
        sectorId: editData.sectorId || "",
        occupationId: editData.occupationId || "",
        certificationId: editData.certificationId || "",
        validityDate: formatDateForInput(editData.validityDate) || "",
        programmeTitle: editData.programmeTitle || "",
        units:
          editData.units?.length > 0
            ? editData.units
            : [
                {
                  unitCode: "",
                  unitTitle: "",
                },
              ],
        documents: [],
      };
    }

    return {
      sectorId: "",
      occupationId: "",
      certificationId: "",
      validityDate: "",
      programmeTitle: "",
      units: [
        {
          unitCode: "",
          unitTitle: "",
        },
      ],
      documents: [],
    };
  };

  // ==================== VALIDATION ====================

  const getValidationSchema = () => {
    if (editingId) {
      return Yup.object().shape({
        programmeTitle: Yup.string().required("Programme Title is required"),
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
        documents: Yup.array(),
      });
    }

    return Yup.object().shape({
      sectorId: Yup.string().required("Sector is required"),
      occupationId: Yup.string().required("Occupation is required"),
      certificationId: Yup.string().required("Certification is required"),
      programmeTitle: Yup.string().required("Programme Title is required"),
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
      documents: Yup.array(),
    });
  };

  // ==================== RENDER HELPERS ====================

  const renderUnitCodes = (units) => {
    if (!units?.length) {
      return "N/A";
    }

    return units.map((unit, index) => (
      <Box key={`code-${index}`} sx={{ mb: 0.5 }}>
        <Chip
          label={unit.unitCode}
          size="small"
          color="secondary"
          variant="outlined"
        />

        {index < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
      </Box>
    ));
  };

  const renderUnitTitles = (units) => {
    if (!units?.length) {
      return "N/A";
    }

    return units.map((unit, index) => (
      <Box key={`title-${index}`} sx={{ mb: 0.5 }}>
        <Typography variant="body2">{unit.unitTitle}</Typography>

        {index < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
      </Box>
    ));
  };

  const renderFileAttachments = (documents) => {
    if (!documents?.length) {
      return (
        <Typography variant="caption" color="textSecondary">
          No files
        </Typography>
      );
    }

    return (
      <Stack direction="column" spacing={0.5}>
        {documents.map((file, index) => {
          const fileName = file.name || `File ${index + 1}`;

          return (
            <Box key={index}>
              <Tooltip title={fileName} placement="top" arrow>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => handleDownload(file)}
                  sx={{
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "0.75rem",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    "&:hover": {
                      color: "primary.main",
                      textDecoration: "underline",
                    },
                  }}
                  disabled={downloading || !file.url}
                >
                  {fileName}
                </Link>
              </Tooltip>
            </Box>
          );
        })}
      </Stack>
    );
  };

  // ==================== FILTERED DATA ====================

  // Occupation options come from the rows already loaded for the sector
  const occupationFilterOptions = Array.from(
    new Map(
      data
        .filter((item) => item.occupationId)
        .map((item) => [String(item.occupationId), item.occupation]),
    ),
  ).sort((a, b) => String(a[1]).localeCompare(String(b[1])));

  const filteredData = data.filter(
    (item) =>
      (!validityFilter || getValidityInfo(item.validityDate).state === validityFilter) &&
      (!filterOccupationId ||
        String(item.occupationId) === String(filterOccupationId)) &&
      (item.sector?.toLowerCase().includes(search.toLowerCase()) ||
      item.occupation?.toLowerCase().includes(search.toLowerCase()) ||
      getAllUnitCodes(item).toLowerCase().includes(search.toLowerCase()) ||
        getAllUnitTitles(item).toLowerCase().includes(search.toLowerCase())),
  );

  // Validity summary over the loaded sector(s)
  const validityCounts = data.reduce(
    (acc, item) => {
      const st = getValidityInfo(item.validityDate).state;
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { expired: 0, soon: 0, valid: 0, none: 0 },
  );

  // Excel: one row per unit (NCS details repeated), for what is shown in the table
  const handleExportExcel = async () => {
    const rows = [];
    filteredData.forEach((item, idx) => {
      const base = {
        "Sl No": idx + 1,
        Sector: item.sector,
        Occupation: item.occupation,
        "BQF Certificate Level": item.bqfLevel,
        "Validity Date": item.validityDate,
        "Validity Status": (() => {
          const v = getValidityInfo(item.validityDate);
          if (v.state === "expired") return `Expired (${Math.abs(v.days)} days ago)`;
          if (v.state === "soon") return `Expires in ${v.days} days`;
          if (v.state === "valid") return "Valid";
          return "";
        })(),
        "Programme Title": item.programmeTitle,
      };
      const units = item.units?.length ? item.units : [null];
      units.forEach((u) =>
        rows.push({
          ...base,
          "Unit Code": u?.unitCode ?? "",
          "Unit Title": u?.unitTitle ?? "",
          Attachments: (item.documents || []).map((d) => d.name).join(", "),
        }),
      );
    });
    if (rows.length === 0) {
      toast.info("No data to export");
      return;
    }
    const sectorName =
      filterSectorId === ALL_SECTORS
        ? "All_Sectors"
        : getSectorName(filterSectorId).replace(/[^\w-]+/g, "_");
    const today = new Date().toISOString().split("T")[0];
    try {
      await exportToExcel(rows, `NCS_${sectorName}_${today}`);
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to export Excel");
    }
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",

    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  // ==================== FORM RENDER HELPERS ====================

  const hasFieldError = (formik, field) => {
    return formik.touched[field] && Boolean(formik.errors[field]);
  };

  const getFieldError = (formik, field) => {
    return formik.touched[field] && formik.errors[field];
  };

  const isFormDisabled = () => {
    return loading || checkingExisting;
  };

  const isReadOnly = () => {
    return editingId ? true : false;
  };

  const isOccupationDisabled = (formik) => {
    return (
      loading ||
      loadingOccupations ||
      !formik.values.sectorId ||
      checkingExisting
    );
  };

  const isSubmitDisabled = () => {
    return loading || checkingExisting || (isDuplicate && !editingId);
  };

  const getSubmitButtonText = () => {
    if (loading) return "Submitting...";
    if (checkingExisting) return "Checking...";
    return editingId ? "Update" : "Submit";
  };

  // ==================== LOADING ====================

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

  // ==================== RENDER ====================

  return (
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      <Typography variant="h5" gutterBottom>
        List of National Competency Standards (NCS)
      </Typography>

      {/* Search + Create */}

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            select
            label="Sector"
            size="small"
            fullWidth
            value={filterSectorId}
            onChange={(e) => setFilterSectorId(e.target.value)}
          >
            <MenuItem value="">-- Select Sector --</MenuItem>
            <MenuItem value={ALL_SECTORS}>All Sectors</MenuItem>
            {sectors.map((sector) => (
              <MenuItem key={sector.id} value={String(sector.id)}>
                {sector.sectorName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            select
            label="Occupation"
            size="small"
            fullWidth
            value={filterOccupationId}
            onChange={(e) => {
              setFilterOccupationId(e.target.value);
              setPage(0);
            }}
            disabled={!filterSectorId || occupationFilterOptions.length === 0}
          >
            <MenuItem value="">All Occupations</MenuItem>
            {occupationFilterOptions.map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
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

                "& input": {
                  padding: "8px 12px",
                },
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={loadingList || filteredData.length === 0}
            sx={{ height: "36px", whiteSpace: "nowrap" }}
          >
            Export Excel
          </Button>
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

      {/* Validity: red = expired or expiring within 3 months */}
      {data.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
            Validity:
          </Typography>
          {VALIDITY_FILTERS.map((f) => {
            const count =
              f.value === "" ? data.length : validityCounts[f.value] || 0;
            const color =
              f.value === "expired" || f.value === "soon"
                ? "error"
                : f.value === "valid"
                  ? "success"
                  : "default";
            return (
              <Chip
                key={f.value || "all"}
                size="small"
                label={`${f.label} (${count})`}
                color={color}
                variant={validityFilter === f.value ? "filled" : "outlined"}
                onClick={() => {
                  setValidityFilter(f.value);
                  setPage(0);
                }}
                sx={{ fontWeight: validityFilter === f.value ? 600 : 400 }}
              />
            );
          })}
        </Box>
      )}

      {/* Table */}

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Occupation</TableCell>
              <TableCell>BQF Certificate Level</TableCell>
              <TableCell>Validity Date</TableCell>
              <TableCell>Programme Title</TableCell>
              <TableCell>Unit Code</TableCell>
              <TableCell>Unit Title</TableCell>
              <TableCell>Attachments</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingList ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => {
                  const validity = getValidityInfo(item.validityDate);
                  const dueSoon =
                    validity.state === "expired" || validity.state === "soon";
                  return (
                  <TableRow
                    key={item.id}
                    sx={dueSoon ? { bgcolor: "rgba(211, 47, 47, 0.06)" } : undefined}
                  >
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

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography
                        variant="body2"
                        color={dueSoon ? "error.main" : "text.primary"}
                        fontWeight={dueSoon ? 600 : 400}
                      >
                        {item.validityDate}
                      </Typography>
                      {validity.state === "expired" && (
                        <Chip
                          size="small"
                          color="error"
                          label={`Expired ${Math.abs(validity.days)} day(s) ago`}
                          sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                        />
                      )}
                      {validity.state === "soon" && (
                        <Chip
                          size="small"
                          color="error"
                          variant="outlined"
                          label={
                            validity.days === 0
                              ? "Expires today"
                              : `Expires in ${validity.days} day(s)`
                          }
                          sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                        />
                      )}
                    </TableCell>

                    <TableCell>{item.programmeTitle}</TableCell>

                    <TableCell>{renderUnitCodes(item.units)}</TableCell>

                    <TableCell>{renderUnitTitles(item.units)}</TableCell>

                    <TableCell>
                      {renderFileAttachments(item.documents)}
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="NCS cannot be deleted">
                          <span>
                            <IconButton size="small" color="disabled" disabled>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {filterSectorId
                    ? "No data available in table"
                    : "Select a Sector to view NCS"}
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
          {selectedFiles?.length > 0 ? (
            <List>
              {selectedFiles.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleFileView(file)}
                          disabled={!file.url || downloading}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDownload(file)}
                          disabled={!file.url || downloading}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
            <Box
              sx={{
                textAlign: "center",
                py: 4,
              }}
            >
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

      {/* Duplicate NCS Warning Dialog */}

      <Dialog
        open={openDuplicateDialog}
        onClose={handleCloseDuplicateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningIcon color="warning" />

          <Typography variant="h6">Duplicate NCS Combination</Typography>
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            This NCS combination already exists in the system.
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Sector:</strong>{" "}
              {getSectorName(duplicateCheckData.sectorId)}
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Occupation:</strong>{" "}
              {getOccupationName(duplicateCheckData.occupationId)}
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>BQF Certificate Level:</strong>{" "}
              {getCertificationName(duplicateCheckData.certificationId)}
            </Typography>
          </Box>

          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Please select a different combination of Sector, Occupation, and BQF
            Certificate Level.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseDuplicateDialog}
            variant="contained"
            color="primary"
          >
            OK
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
          enableReinitialize
          initialValues={getInitialValues()}
          validationSchema={getValidationSchema()}
          onSubmit={handleSubmit}
        >
          {(formik) => {
            // Create field change handler for this form instance
            const fieldChangeHandler = createFieldChangeHandler(
              formik,
              setSelectedSectorId,
              setIsDuplicate,
              checkExistingNcs,
              editingId,
            );

            return (
              <Form>
                <DialogContent dividers>
                  <Grid container spacing={2}>
                    {/* Sector */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Tooltip
                        title={editingId ? "Sector cannot be changed" : ""}
                        placement="top"
                        arrow
                      >
                        <TextField
                          select
                          fullWidth
                          label={requiredLabel("Sector")}
                          name="sectorId"
                          size="small"
                          value={formik.values.sectorId || ""}
                          onChange={async (e) => {
                            await fieldChangeHandler(
                              "sectorId",
                              e.target.value,
                            );
                          }}
                          onBlur={formik.handleBlur}
                          error={hasFieldError(formik, "sectorId")}
                          helperText={getFieldError(formik, "sectorId")}
                          disabled={isFormDisabled()}
                          slotProps={{
                            input: {
                              readOnly: isReadOnly(),
                            },
                          }}
                        >
                          <MenuItem value="">Select Sector</MenuItem>

                          {sectors.map((sec) => (
                            <MenuItem key={sec.id} value={sec.id}>
                              {sec.sectorName}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Tooltip>
                    </Grid>

                    {/* Occupation */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Tooltip
                        title={editingId ? "Occupation cannot be changed" : ""}
                        placement="top"
                        arrow
                      >
                        <TextField
                          select
                          fullWidth
                          label={requiredLabel("Occupation")}
                          name="occupationId"
                          size="small"
                          value={formik.values.occupationId || ""}
                          onChange={async (e) => {
                            await fieldChangeHandler(
                              "occupationId",
                              e.target.value,
                            );
                          }}
                          onBlur={formik.handleBlur}
                          error={hasFieldError(formik, "occupationId")}
                          helperText={getFieldError(formik, "occupationId")}
                          disabled={isOccupationDisabled(formik)}
                          slotProps={{
                            input: {
                              readOnly: isReadOnly(),
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
                      </Tooltip>
                    </Grid>

                    {/* BQF Level */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Tooltip
                        title={
                          editingId
                            ? "BQF Certificate Level cannot be changed"
                            : ""
                        }
                        placement="top"
                        arrow
                      >
                        <TextField
                          select
                          fullWidth
                          label={requiredLabel("BQF Certificate Level")}
                          name="certificationId"
                          size="small"
                          value={formik.values.certificationId || ""}
                          onChange={async (e) => {
                            await fieldChangeHandler(
                              "certificationId",
                              e.target.value,
                            );
                          }}
                          onBlur={formik.handleBlur}
                          error={hasFieldError(formik, "certificationId")}
                          helperText={getFieldError(formik, "certificationId")}
                          disabled={isFormDisabled()}
                          slotProps={{
                            input: {
                              readOnly: isReadOnly(),
                            },
                          }}
                        >
                          <MenuItem value="">
                            Select BQF Certificate Level
                          </MenuItem>

                          {certificationLevels.map((level) => (
                            <MenuItem key={level.id} value={level.id}>
                              {level.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Tooltip>
                    </Grid>

                    {/* Validity Date */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label={requiredLabel("Validity Date")}
                        name="validityDate"
                        size="small"
                        slotProps={{
                          inputLabel: {
                            shrink: true,
                          },
                        }}
                        value={formik.values.validityDate || ""}
                        onChange={(e) =>
                          formik.setFieldValue("validityDate", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        error={hasFieldError(formik, "validityDate")}
                        helperText={getFieldError(formik, "validityDate")}
                        disabled={isFormDisabled()}
                      />
                    </Grid>

                    {/* Programme Title */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="text"
                        label={requiredLabel("Programme Title")}
                        name="programmeTitle"
                        size="small"
                        slotProps={{
                          inputLabel: {
                            shrink: true,
                          },
                        }}
                        value={formik.values.programmeTitle}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={hasFieldError(formik, "programmeTitle")}
                        helperText={getFieldError(formik, "programmeTitle")}
                        disabled={isFormDisabled()}
                      />
                    </Grid>

                    {/* Unit Details */}
                    <Grid size={{ xs: 12 }}>
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
                          sx={{
                            mb: 1,
                          }}
                        >
                          Unit Details
                        </Typography>

                        <FieldArray name="units">
                          {({ push, remove, form }) => {
                            const lastIndex = form.values.units.length - 1;

                            const lastUnit = form.values.units[lastIndex];

                            const hasErrors =
                              lastUnit &&
                              (!lastUnit.unitTitle || !lastUnit.unitCode);

                            const hasTouchedErrors =
                              formik.touched.units &&
                              formik.touched.units.some(
                                (touched, index) =>
                                  touched &&
                                  ((touched.unitTitle &&
                                    formik.errors.units?.[index]?.unitTitle) ||
                                    (touched.unitCode &&
                                      formik.errors.units?.[index]?.unitCode)),
                              );

                            const canAddMore = !hasErrors && !hasTouchedErrors;

                            return (
                              <>
                                {form.values.units.map((unit, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "flex-start",
                                      mb: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        flex: 2,
                                      }}
                                    >
                                      <TextField
                                        size="small"
                                        placeholder="Unit Title"
                                        multiline
                                        minRows={2}
                                        maxRows={6}
                                        name={`units.${index}.unitTitle`}
                                        value={unit.unitTitle}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.units?.[index]
                                            ?.unitTitle &&
                                          Boolean(
                                            formik.errors.units?.[index]
                                              ?.unitTitle,
                                          )
                                        }
                                        helperText={
                                          formik.touched.units?.[index]
                                            ?.unitTitle &&
                                          formik.errors.units?.[index]
                                            ?.unitTitle
                                        }
                                        disabled={isFormDisabled()}
                                        fullWidth
                                        slotProps={{
                                          formHelperText: {
                                            sx: {
                                              minHeight: "20px",
                                              marginTop: "3px",
                                            },
                                          },
                                        }}
                                      />
                                    </Box>

                                    <Box
                                      sx={{
                                        flex: 1,
                                      }}
                                    >
                                      <TextField
                                        size="small"
                                        placeholder="Unit Code"
                                        multiline
                                        minRows={2}
                                        maxRows={6}
                                        name={`units.${index}.unitCode`}
                                        value={unit.unitCode}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.units?.[index]
                                            ?.unitCode &&
                                          Boolean(
                                            formik.errors.units?.[index]
                                              ?.unitCode,
                                          )
                                        }
                                        helperText={
                                          formik.touched.units?.[index]
                                            ?.unitCode &&
                                          formik.errors.units?.[index]?.unitCode
                                        }
                                        disabled={isFormDisabled()}
                                        fullWidth
                                        slotProps={{
                                          formHelperText: {
                                            sx: {
                                              minHeight: "20px",
                                              marginTop: "3px",
                                            },
                                          },
                                        }}
                                      />
                                    </Box>

                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        pt: "4px",
                                        minWidth: "40px",
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => remove(index)}
                                        disabled={
                                          isFormDisabled() ||
                                          form.values.units.length <= 1
                                        }
                                      >
                                        <RemoveCircleOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                ))}

                                <Button
                                  type="button"
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => {
                                    const lastIdx =
                                      form.values.units.length - 1;

                                    const lastUnit = form.values.units[lastIdx];

                                    if (
                                      lastUnit.unitTitle &&
                                      lastUnit.unitCode
                                    ) {
                                      push({
                                        unitCode: "",
                                        unitTitle: "",
                                      });

                                      return;
                                    }

                                    formik.setFieldTouched(
                                      `units.${lastIdx}.unitTitle`,
                                      true,
                                    );

                                    formik.setFieldTouched(
                                      `units.${lastIdx}.unitCode`,
                                      true,
                                    );

                                    toast.warning(
                                      "Please fill the current unit details before adding a new one",
                                    );
                                  }}
                                  disabled={isFormDisabled() || !canAddMore}
                                  fullWidth
                                  sx={{
                                    mt: 1,
                                    py: 0.5,
                                  }}
                                >
                                  Add Unit
                                </Button>

                                {!canAddMore &&
                                  form.values.units.length > 0 && (
                                    <Typography
                                      color="warning"
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        mt: 0.5,
                                      }}
                                    >
                                      Please fill the current unit details
                                      before adding a new unit
                                    </Typography>
                                  )}

                                {formik.touched.units &&
                                  formik.errors.units && (
                                    <Typography
                                      color="error"
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        mt: 0.5,
                                      }}
                                    >
                                      {typeof formik.errors.units === "string"
                                        ? formik.errors.units
                                        : "Fill all unit details"}
                                    </Typography>
                                  )}
                              </>
                            );
                          }}
                        </FieldArray>
                      </Paper>
                    </Grid>

                    {/* Documents */}
                    <Grid size={{ xs: 12 }}>
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
                          sx={{
                            mb: 2,
                          }}
                        >
                          Supporting Documents
                        </Typography>

                        <Divider
                          sx={{
                            mb: 3,
                          }}
                        />

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
                            disabled={isFormDisabled()}
                            // NCS supporting documents: PDF only
                            acceptedFileTypes=".pdf,application/pdf"
                            typesLabel="Only PDF files are allowed."
                            description="Drag and drop PDF files here (PDF only)"
                          />
                        </Box>

                        {formik.touched.documents &&
                          formik.errors.documents && (
                            <Typography
                              color="error"
                              variant="caption"
                              sx={{
                                display: "block",
                                mt: 1,
                              }}
                            >
                              {formik.errors.documents}
                            </Typography>
                          )}

                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{
                            display: "block",
                            mt: 1,
                          }}
                        >
                          Total files: {formik.values.documents?.length || 0}
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
                    disabled={isFormDisabled()}
                  >
                    Cancel
                  </Button>

                  <Tooltip
                    title={
                      isDuplicate && !editingId
                        ? "This NCS combination already exists"
                        : ""
                    }
                    placement="top"
                    arrow
                  >
                    <span>
                      <Button
                        size="small"
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitDisabled()}
                      >
                        {getSubmitButtonText()}
                      </Button>
                    </span>
                  </Tooltip>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CreateNcsIndex;
