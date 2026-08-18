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

// Enhanced Helper function to extract numeric value from duration string
const extractNumericValue = (durationString) => {
  if (!durationString) return 0;
  const match = durationString.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

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

  useEffect(() => {
    fetchCurriculumTypes();
    fetchProgrammeTypes();
    fetchInstituteDetails();
    fetchCurriculumData();
    fetchDropdownData();
    fetchSectors();
  }, []);

  // Fetch sectors
  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      console.log("Sectors Response:", response.data);
      setSectors(response.data || []);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  // Fetch occupations by sector
  const fetchOccupationsBySector = async (sectorId) => {
    if (!sectorId) {
      setOccupations([]);
      return;
    }
    setLoadingOccupations(true);
    try {
      const sector = sectors.find(s => s.id === parseInt(sectorId));
      console.log("Found sector for occupations:", sector);
      
      if (sector && sector.child && sector.child.length > 0) {
        const occupationsData = sector.child.map(child => ({
          id: child.id,
          occupationName: child.occupationName || child.name || `Occupation ${child.id}`
        }));
        setOccupations(occupationsData);
        console.log("Occupations from sector child:", occupationsData);
      } else {
        try {
          const response = await CommonService.getOccupationsBySectorId(sectorId);
          const occData = response.data || [];
          setOccupations(occData);
          console.log("Occupations from API:", occData);
        } catch (apiError) {
          console.error("API fallback failed:", apiError);
          setOccupations([]);
        }
      }
    } catch (error) {
      console.error("Error fetching occupations:", error);
      toast.error("Failed to fetch occupations");
      setOccupations([]);
    } finally {
      setLoadingOccupations(false);
    }
  };

  // Fetch programme title for endorse
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
      
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const item = response.data[0];
        const title = item.programme_title || 
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
      } else if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const item = response.data;
        const title = item.programme_title || 
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

  // Fetch programme title for revision
  const fetchProgrammeTitleForRevision = async (programmeId, setFieldValue) => {
    if (!programmeId) {
      return;
    }

    try {
      const response = await NcsService.getProgrammeTitleById(
        programmeId,
        access_token,
      );
      console.log("Programme Title Response for Revision:", response);
      
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const item = response.data[0];
        const title = item.programme_title || 
                      item.courseName || 
                      item.name || 
                      item.occupationName ||
                      item.title;
        
        if (title) {
          setFieldValue("programmeTitle", title);
          console.log("Programme Title set to:", title);
        }
      } else if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const item = response.data;
        const title = item.programme_title || 
                      item.courseName || 
                      item.name || 
                      item.occupationName ||
                      item.title;
        
        if (title) {
          setFieldValue("programmeTitle", title);
        }
      }
    } catch (error) {
      console.error("Error fetching programme title for revision:", error);
    }
  };

  // Function to check if NCS exists and auto-fill titles
  const checkNcsExists = async (
    sectorId,
    occupationId,
    certificationId,
    setFieldValue,
  ) => {
    if (!sectorId || !occupationId || !certificationId) {
      setNcsExists(false);
      setNcsData(null);
      setFieldValue("curriculumName", "");
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
      console.log("Sector ID:", sectorId);
      console.log("Occupation ID:", occupationId);
      console.log("Certification ID:", certificationId);

      if (response.data && response.data.length > 0) {
        setNcsExists(true);
        setNcsData(response.data[0]);
        console.log("NCS combination exists:", response.data[0]);

        if (response.data[0].programme_title) {
          setFieldValue("curriculumName", response.data[0].programme_title);
          setFieldValue("programmeTitle", response.data[0].programme_title);
          setFieldValue("ncsId", response.data[0].id);
          toast.info(
            `Programme Title and Curriculum Title auto-filled with: ${response.data[0].programme_title}`,
          );
        }
      } else {
        setNcsExists(false);
        setNcsData(null);
        setFieldValue("curriculumName", "");
        setFieldValue("programmeTitle", "");
        setFieldValue("ncsId", "");
        console.log("NCS combination does not exist - fields cleared");
      }
    } catch (error) {
      console.error("Error checking NCS exists:", error);
      setNcsExists(false);
      setNcsData(null);
      setFieldValue("curriculumName", "");
      setFieldValue("programmeTitle", "");
      setFieldValue("ncsId", "");
    } finally {
      setCheckingExisting(false);
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

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Get curriculum type name by ID
  const getCurriculumTypeName = (typeId) => {
    if (!typeId) return "N/A";
    const type = curriculumTypes.find((item) => item.id === parseInt(typeId));
    return type ? type.service_name || type.name : "N/A";
  };

  // Get curriculum type by ID
  const getCurriculumType = (typeId) => {
    return curriculumTypes.find((item) => item.id === parseInt(typeId));
  };

  // Filter data based on search and curriculum type
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.application_no?.includes(search) ||
      item.curriculum_name?.toLowerCase().includes(search.toLowerCase()) ||
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
        curriculumName: "",
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
        curriculumName: "",
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
        curriculumName: curriculum.curriculum_name || "",
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
        curriculumName: curriculum.curriculum_name || "",
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
      curriculumName: "",
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

  // Custom validation function that checks if BQF Course rules should apply
  const validateDurationDistribution = (values) => {
    // Only apply rules for BQF Course (id: 41)
    if (parseInt(values.programmeTypeId) !== 41) {
      return null;
    }

    const theoryNum = extractNumericValue(values.totalTheoryDuration);
    const practicalNum = extractNumericValue(values.totalPracticalDuration);
    const ojtNum = extractNumericValue(values.totalOjtDuration);
    const totalNum = theoryNum + practicalNum + ojtNum;

    if (totalNum === 0 || !values.certificateLevelId) {
      return null;
    }

    const certificateLevel = certificateLevels.find(
      (level) => level.id === parseInt(values.certificateLevelId),
    );

    if (!certificateLevel) {
      return null;
    }

    const levelName = certificateLevel.name.toLowerCase();
    const isDiploma = levelName.includes("diploma");
    const isAdvancedDiploma = levelName.includes("advanced diploma");
    const isCertificate = levelName.includes("certificate");

    let minTotalHours = 0;
    let requiredTheoryPercentage = 0;
    let requiredPracticalOjtPercentage = 0;

    if (isDiploma || isAdvancedDiploma) {
      minTotalHours = 2400;
      requiredTheoryPercentage = 40;
      requiredPracticalOjtPercentage = 60;
    } else if (isCertificate) {
      minTotalHours = 400;
      requiredTheoryPercentage = 20;
      requiredPracticalOjtPercentage = 80;
    } else {
      return null;
    }

    // Check minimum total hours
    if (totalNum < minTotalHours) {
      return `Total program duration (${totalNum} hours) must be at least ${minTotalHours} hours for ${certificateLevel.name}`;
    }

    const theoryPercentage = (theoryNum / totalNum) * 100;
    const practicalOjtPercentage = ((practicalNum + ojtNum) / totalNum) * 100;

    const tolerance = 0.5;

    if (theoryPercentage < requiredTheoryPercentage - tolerance) {
      return `Theory duration (${theoryPercentage.toFixed(1)}%) must be at least ${requiredTheoryPercentage}% of total program duration for ${certificateLevel.name}. Current theory: ${theoryNum} hours out of ${totalNum} total hours.`;
    }

    if (practicalOjtPercentage > requiredPracticalOjtPercentage + tolerance) {
      return `Practical + OJT duration (${practicalOjtPercentage.toFixed(1)}%) must not exceed ${requiredPracticalOjtPercentage}% of total program duration for ${certificateLevel.name}. Current practical + OJT: ${practicalNum + ojtNum} hours out of ${totalNum} total hours.`;
    }

    return null;
  };

  // Create validation schema dynamically with certificateLevels
  // ncsId is only required for Add Curriculum
  const getValidationSchema = (isAdd = false) => {
    return Yup.object().shape({
      curriculumTypeId: Yup.string().required("Curriculum Type is required"),
      programmeTypeId: Yup.string().required("Programme Type is required"),
      curriculumName: Yup.string().required("Curriculum Name is required"),
      programmeTitle: Yup.string().required("Programme Title is required"),
      description: Yup.string().required("Curriculum Description is required"),
      certificateLevelId: Yup.string().required(
        "Certificate Level is required",
      ),
      sectorId: Yup.string().when("programmeTypeId", {
        is: "41",
        then: (schema) =>
          schema.required("Sector is required for BQF Programme"),
        otherwise: (schema) => schema.notRequired(),
      }),
      occupationId: Yup.string().when("programmeTypeId", {
        is: "41",
        then: (schema) =>
          schema.required("Occupation is required for BQF Programme"),
        otherwise: (schema) => schema.notRequired(),
      }),
      ncsId: Yup.string().when("programmeTypeId", {
        is: "41",
        then: (schema) => {
          if (isAdd) {
            return schema.required("NCS selection is required for BQF Programme");
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
        .test("duration-distribution", function (value) {
          const {
            totalTheoryDuration,
            totalPracticalDuration,
            totalOjtDuration,
            certificateLevelId,
            programmeTypeId,
          } = this.parent;

          // Only apply rules for BQF Course (id: 41)
          if (parseInt(programmeTypeId) !== 41) {
            return true;
          }

          if (!value || !certificateLevelId) return true;

          const theoryNum = extractNumericValue(totalTheoryDuration);
          const practicalNum = extractNumericValue(totalPracticalDuration);
          const ojtNum = extractNumericValue(totalOjtDuration);
          const totalNum = theoryNum + practicalNum + ojtNum;

          if (totalNum === 0) return true;

          const certificateLevel = certificateLevels.find(
            (level) => level.id === parseInt(certificateLevelId),
          );

          if (!certificateLevel) return true;

          const levelName = certificateLevel.name.toLowerCase();
          const isDiploma = levelName.includes("diploma");
          const isAdvancedDiploma = levelName.includes("advanced diploma");
          const isCertificate = levelName.includes("certificate");

          let requiredTheoryPercentage = 0;
          let requiredPracticalOjtPercentage = 0;

          if (isDiploma || isAdvancedDiploma) {
            requiredTheoryPercentage = 40;
            requiredPracticalOjtPercentage = 60;
          } else if (isCertificate) {
            requiredTheoryPercentage = 20;
            requiredPracticalOjtPercentage = 80;
          } else {
            return true;
          }

          const theoryPercentage = (theoryNum / totalNum) * 100;
          const practicalOjtPercentage = ((practicalNum + ojtNum) / totalNum) * 100;

          const tolerance = 0.5;

          if (theoryPercentage < requiredTheoryPercentage - tolerance) {
            return this.createError({
              message: `Theory duration (${theoryPercentage.toFixed(1)}%) must be at least ${requiredTheoryPercentage}% of total program duration for ${certificateLevel.name}. Current theory: ${theoryNum} hours out of ${totalNum} total hours.`,
            });
          }

          if (practicalOjtPercentage > requiredPracticalOjtPercentage + tolerance) {
            return this.createError({
              message: `Practical + OJT duration (${practicalOjtPercentage.toFixed(1)}%) must not exceed ${requiredPracticalOjtPercentage}% of total program duration for ${certificateLevel.name}. Current practical + OJT: ${practicalNum + ojtNum} hours out of ${totalNum} total hours.`,
            });
          }

          return true;
        }),
    });
  };

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

  // Find curriculum by application_no
  const findCurriculumByApplicationNo = (applicationNo) => {
    return data.find((item) => item.application_no === applicationNo);
  };

  // Single dynamic submit handler with unified payload
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

    // Check duration distribution (only for BQF Course)
    const distributionError = validateDurationDistribution(values);
    if (distributionError) {
      toast.error(distributionError);
      setSubmitting(false);
      return;
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
        // Use the endorseApplicationNo from form values
        applicationNo = values.endorseApplicationNo;
      } else if (actionType === "revision") {
        if (selectedCurriculum) {
          applicationNo = selectedCurriculum.application_no;
        }
      }

      const payload = {
        applicationNo: applicationNo,
        curriculumName: values.curriculumName,
        curriculumTypeId: parseInt(values.curriculumTypeId),
        programmeTypeId: parseInt(values.programmeTypeId),
        description: values.description,
        // For BQF (41): send programmeId (NCS ID) only
        // For Non-BQF (42): send programmeTitle only
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
      setSelectedSectorId("");
      setOccupations([]);
      setNcsExists(false);
      setNcsData(null);
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

  const handleEditClick = (curriculum) => {
    // Check if revision is allowed (status must be 59 - Endorsed)
    if (!isRevisionAllowed(curriculum.status_id)) {
      toast.warning(
        `Revision is only allowed for endorsed curricula. Current status: ${getStatusName(curriculum.status_id)}`,
      );
      return;
    }
    setSelectedCurriculum(curriculum);
    // Fetch certificate levels based on course type
    if (curriculum.programme_type_id) {
      fetchCertificateLevels(parseInt(curriculum.programme_type_id));
    }
    // If Sector has a value, fetch occupations for that sector
    if (curriculum.sector_id) {
      fetchOccupationsBySector(curriculum.sector_id);
      setSelectedSectorId(curriculum.sector_id);
    }
    setOpenEditDialog(true);
  };

  const handleClearFilter = () => {
    setCurriculumTypeFilter("");
    setSearch("");
  };

  // Shared Form Component
  const CurriculumForm = ({
    formik,
    isEndorse = false,
    isAdd = false,
    isRevision = false,
  }) => {
    const isCurriculumTypeReadOnly = true;
    const isBQFCourse = parseInt(formik.values.programmeTypeId) === 41;
    const isNonBQFCourse = parseInt(formik.values.programmeTypeId) === 42;

    // Fetch programme title for revision when dialog opens
    useEffect(() => {
      // For BQF Revision, fetch programme title if not already set
      if (isRevision && isBQFCourse && formik.values.ncsId && !formik.values.programmeTitle) {
        console.log("Fetching programme title for revision with ncsId:", formik.values.ncsId);
        fetchProgrammeTitleForRevision(formik.values.ncsId, formik.setFieldValue);
      }
    }, [isRevision, isBQFCourse, formik.values.ncsId]);

    // Handle curriculum selection for endorse - now using application_no
    const handleEndorseCurriculumChange = (e) => {
      const selectedApplicationNo = e.target.value;
      formik.handleChange(e);

      // Find the selected curriculum by application_no
      const selected = data.find((item) => item.application_no === selectedApplicationNo);
      if (selected) {
        console.log("Selected curriculum for endorse:", selected);
        
        // Set the curriculumName to the actual curriculum name for the payload
        formik.setFieldValue("curriculumName", selected.curriculum_name);
        // Also set the endorseApplicationNo field in formik for the dropdown display
        formik.setFieldValue("endorseApplicationNo", selectedApplicationNo);
        
        // Auto-fill all fields based on selected curriculum values
        formik.setFieldValue(
          "programmeTypeId",
          selected.programme_type_id || "",
        );
        formik.setFieldValue("description", selected.description || "");
        formik.setFieldValue(
          "certificateLevelId",
          selected.certificate_level_id || "",
        );
        formik.setFieldValue(
          "entryRequirement",
          selected.entry_requirement || "",
        );
        formik.setFieldValue(
          "totalTheoryDuration",
          selected.total_theory_duration || "",
        );
        formik.setFieldValue(
          "totalPracticalDuration",
          selected.total_practical_duration || "",
        );
        formik.setFieldValue(
          "totalOjtDuration",
          selected.total_ojt_duration || "",
        );
        formik.setFieldValue(
          "totalProgramDuration",
          selected.total_program_duration || "",
        );
        
        // Auto-fill Sector and Occupation based on selected curriculum
        const sectorId = selected.sector_id || "";
        const occupationId = selected.occupation_id || "";
        
        formik.setFieldValue("sectorId", sectorId);
        formik.setFieldValue("occupationId", occupationId);
        
        // Handle Programme Title and ncsId based on programme type
        const programmeTypeId = parseInt(selected.programme_type_id);
        if (programmeTypeId === 41 && selected.programme_id) {
          // For BQF, set ncsId to programme_id (will be sent as programmeId in payload)
          formik.setFieldValue("ncsId", selected.programme_id);
          // Fetch the programme title for display
          fetchProgrammeTitleForEndorse(selected.programme_id, formik.setFieldValue);
        } else if (programmeTypeId === 42) {
          // For Non-BQF, use programme_title directly
          formik.setFieldValue("programmeTitle", selected.programme_title || "");
          formik.setFieldValue("ncsId", "");
        } else {
          formik.setFieldValue("programmeTitle", "");
          formik.setFieldValue("ncsId", "");
        }

        console.log("Setting sectorId:", sectorId);
        console.log("Setting occupationId:", occupationId);
        console.log("Setting ncsId (programmeId):", selected.programme_id);

        // If Sector has a value, fetch occupations for that sector
        if (sectorId) {
          fetchOccupationsBySector(sectorId);
          setSelectedSectorId(sectorId);
        } else {
          // Clear occupations if no sector
          setOccupations([]);
          setSelectedSectorId("");
        }

        // Fetch certificate levels based on course type
        if (selected.programme_type_id) {
          fetchCertificateLevels(parseInt(selected.programme_type_id));
        }

        // Show appropriate message based on what was auto-filled
        const filledFields = [];
        if (sectorId) filledFields.push("Sector");
        if (occupationId) filledFields.push("Occupation");
        if (programmeTypeId === 41 && selected.programme_id) {
          filledFields.push("Programme ID");
          filledFields.push("Programme Title (fetching...)");
        } else if (programmeTypeId === 42 && selected.programme_title) {
          filledFields.push("Programme Title");
        }
        
        if (filledFields.length >= 2) {
          toast.success("Curriculum details auto-filled successfully!");
        } else if (filledFields.length > 0) {
          toast.info(`Auto-filled: ${filledFields.join(", ")}. Please fill in missing fields manually.`);
        } else {
          toast.warning("Curriculum details auto-filled. Please fill in missing fields manually.");
        }
      }
    };

    // Get minimum hours info for display
    const getMinHoursInfo = () => {
      if (isNonBQFCourse) {
        return "Minimum 140 hours required";
      }
      if (isBQFCourse && formik.values.certificateLevelId) {
        const level = certificateLevels.find(
          (l) => l.id === parseInt(formik.values.certificateLevelId)
        );
        if (level) {
          const levelName = level.name.toLowerCase();
          if (levelName.includes("diploma") || levelName.includes("advanced diploma")) {
            return "Minimum 2400 hours required for Diploma/Advanced Diploma";
          }
          if (levelName.includes("certificate")) {
            return "Minimum 400 hours required for Certificate";
          }
        }
      }
      return "";
    };

    return (
      <Grid container spacing={2}>
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

        {/* Curriculum Title - Dropdown for Endorse, Readonly for Revision (no background) */}
        <Grid size={{ xs: 12, md: 6 }}>
          {isEndorse ? (
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
                formik.touched.endorseApplicationNo && formik.errors.endorseApplicationNo
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
                    {item.curriculum_name} ({item.application_no})
                  </MenuItem>
                ))}
            </TextField>
          ) : isRevision ? (
            // Revision - Readonly (no background color)
            <TextField
              fullWidth
              label={
                <>
                  Curriculum Title <RequiredStar />
                </>
              }
              name="curriculumName"
              size="small"
              value={formik.values.curriculumName || ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              placeholder="Curriculum Title"
            />
          ) : (
            // Add - Editable
            <TextField
              fullWidth
              label={
                <>
                  Curriculum Title <RequiredStar />
                </>
              }
              name="curriculumName"
              size="small"
              value={formik.values.curriculumName || ""}
              onChange={isNonBQFCourse ? formik.handleChange : undefined}
              onBlur={isNonBQFCourse ? formik.handleBlur : undefined}
              error={
                formik.touched.curriculumName &&
                Boolean(formik.errors.curriculumName)
              }
              helperText={
                formik.touched.curriculumName && formik.errors.curriculumName
              }
              slotProps={{
                input: {
                  readOnly: isBQFCourse ? true : false,
                  sx: isBQFCourse
                    ? {
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.04)",
                      }
                    : {},
                },
              }}
              placeholder={
                isBQFCourse
                  ? "Auto-filled from NCS"
                  : isNonBQFCourse
                    ? "Enter Curriculum Title"
                    : "Select Programme Type first"
              }
              helperText={
                isBQFCourse
                  ? "Auto-filled from NCS data"
                  : isNonBQFCourse
                    ? "Enter the curriculum title manually"
                    : "Curriculum Title will be auto-filled for BQF or editable for Non-BQF"
              }
              disabled={!formik.values.programmeTypeId}
            />
          )}
        </Grid>

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
            onChange={(e) => {
              const value = e.target.value;
              formik.handleChange(e);
              formik.setFieldValue("certificateLevelId", "");

              if (parseInt(value) === 41) {
                formik.setFieldValue("curriculumName", "");
                formik.setFieldValue("programmeTitle", "");
                formik.setFieldValue("sectorId", "");
                formik.setFieldValue("occupationId", "");
                formik.setFieldValue("ncsId", "");
                setSelectedSectorId("");
                setOccupations([]);
                setNcsExists(false);
                setNcsData(null);
              } else if (parseInt(value) === 42) {
                formik.setFieldValue("sectorId", "");
                formik.setFieldValue("occupationId", "");
                formik.setFieldValue("curriculumName", "");
                formik.setFieldValue("programmeTitle", "");
                formik.setFieldValue("ncsId", "");
                setSelectedSectorId("");
                setOccupations([]);
                setNcsExists(false);
                setNcsData(null);
              } else {
                formik.setFieldValue("sectorId", "");
                formik.setFieldValue("occupationId", "");
                formik.setFieldValue("curriculumName", "");
                formik.setFieldValue("programmeTitle", "");
                formik.setFieldValue("ncsId", "");
                setSelectedSectorId("");
                setOccupations([]);
                setNcsExists(false);
                setNcsData(null);
              }

              if (value) {
                fetchCertificateLevels(parseInt(value));
              } else {
                setCertificateLevels([]);
              }
            }}
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
                readOnly: isRevision ? true : false,
              },
            }}
            disabled={isRevision}
          >
            <MenuItem value="">-select-</MenuItem>
            {programmeTypes.map((type) => (
              <MenuItem key={type.id} value={type.id.toString()}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
          {isBQFCourse && (
            <Typography variant="caption" color="info.main">
              BQF Course selected - Duration distribution rules apply
            </Typography>
          )}
          {isNonBQFCourse && (
            <Typography variant="caption" color="info.main">
              Non-BQF Course selected - Minimum 140 hours required
            </Typography>
          )}
          {isRevision && (
            <Typography variant="caption" color="textSecondary">
              Programme Type cannot be changed in Revision
            </Typography>
          )}
        </Grid>

        {/* Sector and Occupation dropdowns - only show for BQF Programme */}
        {isBQFCourse && (
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
                onChange={async (e) => {
                  const sectorId = e.target.value;
                  formik.handleChange(e);
                  setSelectedSectorId(sectorId);
                  formik.setFieldValue("occupationId", "");
                  formik.setFieldValue("curriculumName", "");
                  formik.setFieldValue("programmeTitle", "");
                  formik.setFieldValue("ncsId", "");
                  setNcsExists(false);
                  setNcsData(null);
                  if (sectorId) {
                    await fetchOccupationsBySector(sectorId);
                  } else {
                    setOccupations([]);
                  }
                }}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.sectorId && Boolean(formik.errors.sectorId)
                }
                helperText={formik.touched.sectorId && formik.errors.sectorId}
                disabled={loading || endorseLoading || editLoading || isRevision}
                slotProps={{
                  input: {
                    readOnly: isRevision ? true : false,
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
              {isRevision && (
                <Typography variant="caption" color="textSecondary">
                  Sector cannot be changed in Revision
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
                onChange={async (e) => {
                  const occupationId = e.target.value;
                  formik.handleChange(e);
                  setNcsExists(false);
                  setNcsData(null);

                  if (
                    isAdd && // Only check NCS for Add
                    formik.values.sectorId &&
                    occupationId &&
                    formik.values.certificateLevelId
                  ) {
                    await checkNcsExists(
                      formik.values.sectorId,
                      occupationId,
                      formik.values.certificateLevelId,
                      formik.setFieldValue,
                    );
                  } else {
                    formik.setFieldValue("curriculumName", "");
                    formik.setFieldValue("programmeTitle", "");
                    formik.setFieldValue("ncsId", "");
                  }
                }}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.occupationId &&
                  Boolean(formik.errors.occupationId)
                }
                helperText={
                  formik.touched.occupationId && formik.errors.occupationId
                }
                disabled={
                  loading ||
                  endorseLoading ||
                  editLoading ||
                  loadingOccupations ||
                  !formik.values.sectorId ||
                  isRevision
                }
                slotProps={{
                  input: {
                    readOnly: isRevision ? true : false,
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
              {isRevision && (
                <Typography variant="caption" color="textSecondary">
                  Occupation cannot be changed in Revision
                </Typography>
              )}
            </Grid>
          </>
        )}

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
            onChange={async (e) => {
              const certificateLevelId = e.target.value;
              formik.handleChange(e);
              setNcsExists(false);
              setNcsData(null);

              if (
                isAdd && // Only check NCS for Add
                isBQFCourse &&
                formik.values.sectorId &&
                formik.values.occupationId &&
                certificateLevelId
              ) {
                await checkNcsExists(
                  formik.values.sectorId,
                  formik.values.occupationId,
                  certificateLevelId,
                  formik.setFieldValue,
                );
              } else {
                formik.setFieldValue("curriculumName", "");
                formik.setFieldValue("programmeTitle", "");
                formik.setFieldValue("ncsId", "");
              }
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.certificateLevelId &&
              Boolean(formik.errors.certificateLevelId)
            }
            helperText={
              formik.touched.certificateLevelId &&
              formik.errors.certificateLevelId
            }
            disabled={
              isLoadingCertificateLevels || !formik.values.programmeTypeId || isRevision
            }
            slotProps={{
              input: {
                readOnly: isRevision ? true : false,
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
          {isRevision && (
            <Typography variant="caption" color="textSecondary">
              Certificate Level cannot be changed in Revision
            </Typography>
          )}
          {/* NCS found message - only for Add Curriculum */}
          {isAdd && isBQFCourse && ncsExists && ncsData && (
            <Typography
              variant="caption"
              color="success"
              sx={{ display: "block", mt: 0.5 }}
            >
              ✓ NCS found: "{ncsData.programme_title}" - Programme Title and
              Curriculum Title auto-filled
            </Typography>
          )}
          {/* No NCS found warning - only for Add Curriculum */}
          {isAdd && isBQFCourse &&
            !ncsExists &&
            formik.values.sectorId &&
            formik.values.occupationId &&
            formik.values.certificateLevelId &&
            !checkingExisting && (
              <Typography
                variant="caption"
                color="warning"
                sx={{ display: "block", mt: 0.5 }}
              >
                ⚠ No NCS found for this combination - Please select different values
              </Typography>
            )}
          {isBQFCourse && checkingExisting && (
            <Typography
              variant="caption"
              color="info"
              sx={{ display: "block", mt: 0.5 }}
            >
              Checking if NCS combination exists...
            </Typography>
          )}
        </Grid>

        {/* Programme Title - Readonly for BQF, Editable for Non-BQF */}
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
            onChange={isNonBQFCourse ? formik.handleChange : undefined}
            onBlur={isNonBQFCourse ? formik.handleBlur : undefined}
            error={
              formik.touched.programmeTitle &&
              Boolean(formik.errors.programmeTitle)
            }
            helperText={
              formik.touched.programmeTitle && formik.errors.programmeTitle
            }
            slotProps={{
              input: {
                readOnly: isBQFCourse ? true : false,
                sx: isBQFCourse
                  ? {
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.04)",
                    }
                  : {},
              },
            }}
            placeholder={
              isBQFCourse
                ? "Auto-filled from NCS"
                : isNonBQFCourse
                  ? "Enter Programme Title"
                  : "Select Programme Type first"
            }
            helperText={
              isBQFCourse
                ? "Auto-filled from NCS data"
                : isNonBQFCourse
                  ? "Enter the programme title manually"
                  : "Programme Title will be auto-filled for BQF or editable for Non-BQF"
            }
            disabled={!formik.values.programmeTypeId}
          />
        </Grid>

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
            onChange={(e) => {
              const value = e.target.value;
              formik.handleChange(e);
              calculateTotalDuration(
                value,
                formik.values.totalPracticalDuration,
                formik.values.totalOjtDuration,
                formik.setFieldValue,
              );
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.totalTheoryDuration &&
              Boolean(formik.errors.totalTheoryDuration)
            }
            helperText={
              formik.touched.totalTheoryDuration &&
              formik.errors.totalTheoryDuration
            }
          />
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
            onChange={(e) => {
              const value = e.target.value;
              formik.handleChange(e);
              calculateTotalDuration(
                formik.values.totalTheoryDuration,
                value,
                formik.values.totalOjtDuration,
                formik.setFieldValue,
              );
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.totalPracticalDuration &&
              Boolean(formik.errors.totalPracticalDuration)
            }
            helperText={
              formik.touched.totalPracticalDuration &&
              formik.errors.totalPracticalDuration
            }
          />
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
            onChange={(e) => {
              const value = e.target.value;
              formik.handleChange(e);
              calculateTotalDuration(
                formik.values.totalTheoryDuration,
                formik.values.totalPracticalDuration,
                value,
                formik.setFieldValue,
              );
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.totalOjtDuration &&
              Boolean(formik.errors.totalOjtDuration)
            }
            helperText={
              formik.touched.totalOjtDuration && formik.errors.totalOjtDuration
            }
          />
        </Grid>

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
                sx: {
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.04)",
                },
              },
            }}
            placeholder="Will be auto-calculated"
            helperText={`Auto-calculated from Theory + Practical + OJT durations ${getMinHoursInfo() ? `- ${getMinHoursInfo()}` : ''}`}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          {formik.values.totalProgramDuration &&
            formik.values.totalTheoryDuration &&
            formik.values.totalPracticalDuration &&
            formik.values.totalOjtDuration &&
            (() => {
              const totalNum = extractNumericValue(formik.values.totalProgramDuration);
              const isBQF = parseInt(formik.values.programmeTypeId) === 41;
              const isNonBQF = parseInt(formik.values.programmeTypeId) === 42;
              
              let isValid = false;
              let message = "";
              let color = "";
              
              if (isNonBQF) {
                isValid = totalNum >= 140;
                message = isValid 
                  ? `✅ Valid: ${formik.values.totalProgramDuration} meets the minimum requirement of 140 hours for Non-BQF Programme`
                  : `⚠️ Warning: ${formik.values.totalProgramDuration} is less than 140 hours. Non-BQF Programme must be at least 140 hours.`;
                color = isValid ? "#2e7d32" : "#c62828";
              } else if (isBQF && formik.values.certificateLevelId) {
                const level = certificateLevels.find(
                  (l) => l.id === parseInt(formik.values.certificateLevelId)
                );
                if (level) {
                  const levelName = level.name.toLowerCase();
                  let minHours = 0;
                  if (levelName.includes("diploma") || levelName.includes("advanced diploma")) {
                    minHours = 2400;
                  } else if (levelName.includes("certificate")) {
                    minHours = 400;
                  }
                  isValid = totalNum >= minHours;
                  message = isValid 
                    ? `✅ Valid: ${formik.values.totalProgramDuration} meets the minimum requirement of ${minHours} hours for ${level.name}`
                    : `⚠️ Warning: ${formik.values.totalProgramDuration} is less than ${minHours} hours. ${level.name} must be at least ${minHours} hours.`;
                  color = isValid ? "#2e7d32" : "#c62828";
                } else {
                  message = "Please select a valid certificate level";
                  color = "#e65100";
                }
              } else {
                message = "Please select Programme Type and Certificate Level";
                color = "#e65100";
              }
              
              return (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: color === "#2e7d32" ? "#e8f5e9" : color === "#c62828" ? "#ffebee" : "#fff3e0",
                    color: color,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    border: `1px solid ${color === "#2e7d32" ? "#a5d6a7" : color === "#c62828" ? "#ef9a9a" : "#ffccbc"}`,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {message}
                  </Typography>
                </Paper>
              );
            })()}

          {isBQFCourse &&
            formik.errors.totalProgramDuration &&
            formik.errors.totalProgramDuration.includes("Theory duration") && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "#fff3e0",
                  color: "#e65100",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "1px solid #ffccbc",
                  mt: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Duration Distribution Error:
                </Typography>
                <Typography variant="body2">
                  {formik.errors.totalProgramDuration}
                </Typography>
              </Paper>
            )}
        </Grid>

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
          />
        </Grid>
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
          />
        </Grid>
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

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        List of Institute's Curriculums
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
                      <TableCell>{item.curriculum_name}</TableCell>
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
                              : `Revision only allowed for Endorsed status. Current: ${getStatusName(item.status_id)}`
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
          setSelectedSectorId("");
          setOccupations([]);
          setNcsExists(false);
          setNcsData(null);
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
                    setSelectedSectorId("");
                    setOccupations([]);
                    setNcsExists(false);
                    setNcsData(null);
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
          setSelectedSectorId("");
          setOccupations([]);
          setNcsExists(false);
          setNcsData(null);
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
                    setSelectedSectorId("");
                    setOccupations([]);
                    setNcsExists(false);
                    setNcsData(null);
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
          setSelectedSectorId("");
          setOccupations([]);
          setNcsExists(false);
          setNcsData(null);
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
                    setSelectedSectorId("");
                    setOccupations([]);
                    setNcsExists(false);
                    setNcsData(null);
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