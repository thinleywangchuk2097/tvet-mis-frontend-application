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
  const [courseTypes, setCourseTypes] = useState([]);
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
  const [ncsData, setNcsData] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [dropdownData, setDropdownData] = useState([]);

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

  const isSubmitDisabled = (values) => {
    const totalDuration = extractNumericValue(values.totalProgramDuration);
    return totalDuration < 140;
  };

  useEffect(() => {
    fetchCurriculumTypes();
    fetchCourseTypes();
    fetchNcsDetails();
    fetchInstituteDetails();
    fetchCurriculumData();
    fetchDropdownData();
  }, []);

  const fetchCurriculumTypes = async () => {
    try {
      const response = await CommonService.getCurriculumServiceType();
      console.log("Curriculum Types Response:", response.data);
      setCurriculumTypes(response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const response = await CommonService.getByParentId(13);
      console.log("Course Types Response:", response.data);
      setCourseTypes(response.data);
    } catch (error) {
      console.error("Error fetching course types:", error);
    }
  };

  const fetchNcsDetails = async () => {
    try {
      const response = await CommonService.getAllOccupations();
      const filteredNcs = response.data.filter(
        (item) => item.courseName !== null,
      );
      setNcsData(filteredNcs);
    } catch (error) {
      console.error("Error fetching ncs data types:", error);
    }
  };

  const fetchCertificateLevels = async (courseTypeId = null) => {
    try {
      setIsLoadingCertificateLevels(true);
      let parentId;

      if (courseTypeId === 41) {
        parentId = 27;
      } else if (courseTypeId === 42) {
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
        curriculumTypeId: "25", // Curriculum Development
        courseTypeId: "",
        curriculumName: "",
        description: "",
        ncsId: "",
        certificateLevelId: "",
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
        curriculumTypeId: "48", // Curriculum Endorsement
        courseTypeId: "",
        curriculumName: "",
        description: "",
        ncsId: "",
        certificateLevelId: "",
        entryRequirement: "",
        totalTheoryDuration: "",
        totalPracticalDuration: "",
        totalOjtDuration: "",
        totalProgramDuration: "",
        files: [],
      };
    }
    if (isRevision && curriculum) {
      // For revision, pre-fill with existing data
      return {
        providerName:
          curriculum.proposed_institute_name ||
          institute.proposed_institute_name ||
          "",
        registrationNo:
          curriculum.registration_no || institute.registration_no || "",
        curriculumTypeId: "49", // Curriculum Revision
        courseTypeId: curriculum.course_type_id || "",
        curriculumName: curriculum.curriculum_name || "",
        description: curriculum.description || "",
        ncsId: curriculum.ncs_id || "",
        certificateLevelId: curriculum.certificate_level_id || "",
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
        courseTypeId: curriculum.course_type_id || "",
        curriculumName: curriculum.curriculum_name || "",
        description: curriculum.description || "",
        ncsId: curriculum.ncs_id || "",
        certificateLevelId: curriculum.certificate_level_id || "",
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
      courseTypeId: "",
      curriculumName: "",
      description: "",
      ncsId: "",
      certificateLevelId: "",
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
    if (parseInt(values.courseTypeId) !== 41) {
      return null;
    }

    const theoryNum = extractNumericValue(values.totalTheoryDuration);
    const practicalNum = extractNumericValue(values.totalPracticalDuration);
    const ojtNum = extractNumericValue(values.totalOjtDuration);
    const totalNum = theoryNum + practicalNum + ojtNum;

    if (totalNum === 0 || !values.certificateLevelId) {
      return null;
    }

    const theoryPercentage = (theoryNum / totalNum) * 100;
    const practicalOjtPercentage = ((practicalNum + ojtNum) / totalNum) * 100;

    const certificateLevel = certificateLevels.find(
      (level) => level.id === parseInt(values.certificateLevelId),
    );

    if (!certificateLevel) {
      return null;
    }

    const levelName = certificateLevel.name.toLowerCase();
    const isDiploma = levelName.includes("diploma");
    const requiredTheoryPercentage = isDiploma ? 40 : 20;
    const requiredPracticalOjtPercentage = isDiploma ? 60 : 80;

    if (theoryPercentage < requiredTheoryPercentage) {
      return `Theory duration (${theoryPercentage.toFixed(1)}%) must be at least ${requiredTheoryPercentage}% of total program duration for ${certificateLevel.name}`;
    }

    if (practicalOjtPercentage > requiredPracticalOjtPercentage) {
      return `Practical + OJT duration (${practicalOjtPercentage.toFixed(1)}%) must not exceed ${requiredPracticalOjtPercentage}% of total program duration for ${certificateLevel.name}`;
    }

    return null;
  };

  // Create validation schema dynamically with certificateLevels
  const getValidationSchema = () => {
    return Yup.object().shape({
      curriculumTypeId: Yup.string().required("Curriculum Type is required"),
      courseTypeId: Yup.string().required("Course Type is required"),
      curriculumName: Yup.string().required("Curriculum Name is required"),
      description: Yup.string().required("Curriculum Description is required"),
      ncsId: Yup.string().required("NCS Title is required"),
      certificateLevelId: Yup.string().required(
        "Certificate Level is required",
      ),
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
            courseTypeId,
          } = this.parent;

          // Only apply rules for BQF Course (id: 41)
          if (parseInt(courseTypeId) !== 41) {
            return true;
          }

          if (!value || !certificateLevelId) return true;

          const theoryNum = extractNumericValue(totalTheoryDuration);
          const practicalNum = extractNumericValue(totalPracticalDuration);
          const ojtNum = extractNumericValue(totalOjtDuration);
          const totalNum = theoryNum + practicalNum + ojtNum;

          if (totalNum === 0) return true;

          const theoryPercentage = (theoryNum / totalNum) * 100;
          const practicalOjtPercentage =
            ((practicalNum + ojtNum) / totalNum) * 100;

          // Use the certificateLevels from the component scope
          const certificateLevel = certificateLevels.find(
            (level) => level.id === parseInt(certificateLevelId),
          );

          if (!certificateLevel) return true;

          const levelName = certificateLevel.name.toLowerCase();
          const isDiploma = levelName.includes("diploma");
          const requiredTheoryPercentage = isDiploma ? 40 : 20;
          const requiredPracticalOjtPercentage = isDiploma ? 60 : 80;

          if (theoryPercentage < requiredTheoryPercentage) {
            return this.createError({
              message: `Theory duration (${theoryPercentage.toFixed(1)}%) must be at least ${requiredTheoryPercentage}% of total program duration for ${certificateLevel.name}`,
            });
          }

          if (practicalOjtPercentage > requiredPracticalOjtPercentage) {
            return this.createError({
              message: `Practical + OJT duration (${practicalOjtPercentage.toFixed(1)}%) must not exceed ${requiredPracticalOjtPercentage}% of total program duration for ${certificateLevel.name}`,
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

  // Find curriculum by name
  const findCurriculumByName = (curriculumName) => {
    return data.find((item) => item.curriculum_name === curriculumName);
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

    // Set loading based on action type
    if (actionType === "add") setLoading(true);
    else if (actionType === "endorse") setEndorseLoading(true);
    else if (actionType === "revision") setEditLoading(true);

    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      // Get curriculum type details for dynamic service_id and name
      const curriculumType = getCurriculumType(values.curriculumTypeId);
      const serviceName = curriculumType?.service_name || "Curriculum";
      const serviceId = curriculumType?.id || 25;

      // Dynamic assignedRoleId based on action type
      // Endorse: 14, otherwise: 21
      const assignedRoleId = actionType === "endorse" ? 14 : 21;

      // Find the curriculum to get application_no for endorse
      let applicationNo = "";
      if (actionType === "endorse") {
        // For endorse, find by curriculum name
        const selected = findCurriculumByName(values.curriculumName);
        if (selected) {
          applicationNo = selected.application_no;
        }
      } else if (actionType === "revision") {
        // For revision, use the selected curriculum's application_no
        if (selectedCurriculum) {
          applicationNo = selectedCurriculum.application_no;
        }
      }

      // Unified payload for all actions using submitCurriculum
      const payload = {
        applicationNo: applicationNo,
        curriculumName: values.curriculumName,
        curriculumTypeId: parseInt(values.curriculumTypeId),
        courseTypeId: parseInt(values.courseTypeId),
        description: values.description,
        ncsId: parseInt(values.ncsId),
        certificateLevelId: parseInt(values.certificateLevelId),
        entryRequirement: values.entryRequirement,
        totalTheoryDuration: values.totalTheoryDuration,
        totalPracticalDuration: values.totalPracticalDuration,
        totalOjtDuration: values.totalOjtDuration,
        totalProgramDuration: values.totalProgramDuration,
        instituteId: institute.institute_id || null,
        documents: documents,
        serviceId: serviceId,
        assignedRoleId: assignedRoleId, // Dynamic assignedRoleId
        statusId: 55,
        createdBy: actionId,
        submittedDate: new Date().toISOString(),
      };

      // For revision, add id and update fields
      if (actionType === "revision") {
        payload.id = selectedCurriculum.id;
        payload.updatedBy = actionId;
        payload.updatedDate = new Date().toISOString();
      }

      console.log("Submitting payload:", payload);

      // Use the same service for all actions
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

      // Close dialog based on action type
      if (actionType === "add") {
        setOpenDialog(false);
      } else if (actionType === "endorse") {
        setOpenEndorseDialog(false);
      } else if (actionType === "revision") {
        setOpenEditDialog(false);
        setSelectedCurriculum(null);
      }
      setCertificateLevels([]);
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
      // Reset loading based on action type
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
    if (curriculum.course_type_id) {
      fetchCertificateLevels(parseInt(curriculum.course_type_id));
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
    // Handle curriculum name change for endorse
    const handleEndorseCurriculumChange = (e) => {
      const selectedName = e.target.value;
      formik.handleChange(e);

      // Find the selected curriculum
      const selected = findCurriculumByName(selectedName);
      if (selected) {
        // Auto-fill all fields
        formik.setFieldValue("courseTypeId", selected.course_type_id || "");
        formik.setFieldValue("description", selected.description || "");
        formik.setFieldValue("ncsId", selected.ncs_id || "");
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

        // Fetch certificate levels based on course type
        if (selected.course_type_id) {
          fetchCertificateLevels(parseInt(selected.course_type_id));
        }

        toast.info("Curriculum details auto-filled successfully!");
      }
    };

    // Determine if curriculum type should be readonly (true for all dialogs)
    const isCurriculumTypeReadOnly = true;

    // Check if BQF Course is selected
    const isBQFCourse = parseInt(formik.values.courseTypeId) === 41;

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
              name="curriculumName"
              size="small"
              value={formik.values.curriculumName}
              onChange={handleEndorseCurriculumChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.curriculumName &&
                Boolean(formik.errors.curriculumName)
              }
              helperText={
                formik.touched.curriculumName && formik.errors.curriculumName
              }
            >
              <MenuItem value="">-select-</MenuItem>
              {data
                .filter(
                  (item) => item.status_id === "57" || item.status_id === 57,
                )
                .map((item) => (
                  <MenuItem key={item.id} value={item.curriculum_name}>
                    {item.curriculum_name} ({item.application_no})
                  </MenuItem>
                ))}
            </TextField>
          ) : (
            <TextField
              fullWidth
              label={
                <>
                  Curriculum Title <RequiredStar />
                </>
              }
              name="curriculumName"
              size="small"
              value={formik.values.curriculumName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.curriculumName &&
                Boolean(formik.errors.curriculumName)
              }
              helperText={
                formik.touched.curriculumName && formik.errors.curriculumName
              }
            />
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label={
              <>
                Course Type <RequiredStar />
              </>
            }
            name="courseTypeId"
            size="small"
            value={formik.values.courseTypeId}
            onChange={(e) => {
              const value = e.target.value;
              formik.handleChange(e);
              formik.setFieldValue("certificateLevelId", "");
              if (value) {
                fetchCertificateLevels(parseInt(value));
              } else {
                setCertificateLevels([]);
              }
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.courseTypeId && Boolean(formik.errors.courseTypeId)
            }
            helperText={
              formik.touched.courseTypeId && formik.errors.courseTypeId
            }
          >
            <MenuItem value="">-select-</MenuItem>
            {courseTypes.map((type) => (
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
        </Grid>

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
            onChange={(e) => {
              formik.handleChange(e);
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
            disabled={isLoadingCertificateLevels || !formik.values.courseTypeId}
          >
            <MenuItem value="">-select-</MenuItem>
            {certificateLevels.map((level) => (
              <MenuItem key={level.id} value={level.id.toString()}>
                {level.name}
              </MenuItem>
            ))}
          </TextField>
          {!formik.values.courseTypeId && (
            <Typography variant="caption" color="textSecondary">
              Please select a course type first
            </Typography>
          )}
          {isLoadingCertificateLevels && (
            <Typography variant="caption" color="textSecondary">
              Loading certificate levels...
            </Typography>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label={
              <>
                NCS Title <RequiredStar />
              </>
            }
            name="ncsId"
            size="small"
            value={formik.values.ncsId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.ncsId && Boolean(formik.errors.ncsId)}
            helperText={formik.touched.ncsId && formik.errors.ncsId}
          >
            <MenuItem value="">-select-</MenuItem>
            {ncsData.map((ncs) => (
              <MenuItem key={ncs.id} value={ncs.id.toString()}>
                {ncs.courseName || ncs.occupationName}
              </MenuItem>
            ))}
          </TextField>
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
            helperText="Automatically calculated from Theory + Practical + OJT durations"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          {formik.values.totalProgramDuration &&
            formik.values.totalTheoryDuration &&
            formik.values.totalPracticalDuration &&
            formik.values.totalOjtDuration &&
            extractNumericValue(formik.values.totalProgramDuration) < 140 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "#ffebee",
                  color: "#c62828",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "1px solid #ef9a9a",
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Warning:
                </Typography>
                <Typography variant="body2">
                  Your curriculum development total is{" "}
                  {formik.values.totalProgramDuration}, which is less than 140
                  hours. Please ensure the total duration is at least 140 hours.
                </Typography>
              </Paper>
            )}

          {formik.values.totalProgramDuration &&
            formik.values.totalTheoryDuration &&
            formik.values.totalPracticalDuration &&
            formik.values.totalOjtDuration &&
            extractNumericValue(formik.values.totalProgramDuration) >= 140 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "#e8f5e9",
                  color: "#2e7d32",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "1px solid #a5d6a7",
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Valid:
                </Typography>
                <Typography variant="body2">
                  Your curriculum development total is{" "}
                  {formik.values.totalProgramDuration}, which meets the minimum
                  requirement of 140 hours.
                </Typography>
              </Paper>
            )}

          {/* Show duration distribution error from Formik - only for BQF Course */}
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
        Curriculum Management
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
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Curriculum Development</DialogTitle>
        <Formik
          initialValues={getInitialValues(null, false, true, false)}
          validationSchema={getValidationSchema()}
          onSubmit={(values, helpers) =>
            handleFormSubmit(values, helpers, "add")
          }
          enableReinitialize={true}
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
                  disabled={loading || !formik.isValid || !formik.dirty}
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
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Curriculum Endorsement</DialogTitle>
        <Formik
          initialValues={getInitialValues(null, true, false, false)}
          validationSchema={getValidationSchema()}
          onSubmit={(values, helpers) =>
            handleFormSubmit(values, helpers, "endorse")
          }
          enableReinitialize={true}
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
                  disabled={endorseLoading || !formik.isValid || !formik.dirty}
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
          validationSchema={getValidationSchema()}
          onSubmit={(values, helpers) =>
            handleFormSubmit(values, helpers, "revision")
          }
          enableReinitialize={true}
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
                  disabled={editLoading || !formik.isValid || !formik.dirty}
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
