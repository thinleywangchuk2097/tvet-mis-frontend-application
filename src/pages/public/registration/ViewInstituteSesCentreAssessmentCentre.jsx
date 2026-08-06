import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Avatar,
  Alert,
  Stack,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import PaymentIcon from "@mui/icons-material/Payment";
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CommonService from "../../../api/services/internal/common/CommonService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";

// Service code mapping
const SERVICE_CODE_MAP = {
  7: 100570,
  36: 100572,
  4: 100582,
};

const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

const ViewInstituteSesCentreAssessmentCentre = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const actionId = useSelector((state) => state.auth.id);
  const userId = useSelector((state) => state.auth.userId);
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [registrationData, setRegistrationData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [qualityData, setQualityData] = useState([]);
  const [overallRemarks, setOverallRemarks] = useState("");

  const [sectors, setSectors] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [dzongkhags, setDzongkhags] = useState([]);
  const [nationality, setNationality] = useState([]);
  const [gender, setGender] = useState([]);
  const [jobType, setJobType] = useState([]);
  const [certificateLevel, setCertificateLevel] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [rawQualityStandards, setRawQualityStandards] = useState(null);

  // REC assignment states
  const [recList, setRecList] = useState([]);
  const [selectedRec, setSelectedRec] = useState("");
  const [assignedRecs, setAssignedRecs] = useState([]);

  // Accreditor assignment states
  const [accreditorList, setAccreditorList] = useState([]);
  const [selectedAccreditor, setSelectedAccreditor] = useState("");
  const [assignedAccreditors, setAssignedAccreditors] = useState([]);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recToDelete, setRecToDelete] = useState(null);
  const [accreditorToDelete, setAccreditorToDelete] = useState(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [endorseRemarks, setEndorseRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  const isTuitionService =
    registrationData?.service_id === "36" ||
    registrationData?.service_id === 36;

  // Check if service_id is 4 and currentRoleId is 7
  const showAccreditorTab =
    (registrationData?.service_id === "4" ||
      registrationData?.service_id === 4) &&
    currentRoleId == 7;

  // Check if currentRoleId is 7 for REC tab
  const showRecTab = currentRoleId == 7;

  // Check if any quality standard has "No" response
  const hasQualityNo = useMemo(() => {
    // Only check if user is role 7
    if (currentRoleId != 7) return false;

    // Check all quality responses for any "N" (No)
    for (const categoryId in qualityResponses) {
      for (const questionId in qualityResponses[categoryId]) {
        if (qualityResponses[categoryId][questionId] === "N") {
          return true;
        }
      }
    }
    return false;
  }, [qualityResponses, currentRoleId]);

  // Check if payment is paid
  const isPaymentPaid = useMemo(() => {
    return paymentStatus?.paymentStatus?.toLowerCase() === "paid";
  }, [paymentStatus]);

  useEffect(() => {
    if (applicationNo) {
      fetchMasterData();
      // Always fetch REC users when role is 7
      if (showRecTab) {
        fetchRecUsers();
      }
      // Always fetch Accreditor users when role is 7 and service_id is 4
      if (showAccreditorTab) {
        fetchAccreditorUsers();
      }
    }
    fetchPaymentStatus();
  }, [applicationNo, showRecTab, showAccreditorTab]);

  const fetchRecUsers = async () => {
    try {
      const response =
        await UserRoleManagementService.getActiveRecUsers(access_token);
      // Map the API response to the format expected by the component
      const mappedRecList = response.data.map((user) => ({
        id: user.id,
        userId: user.user_id,
        name: `${user.first_name} ${user.middle_name ? user.middle_name + " " : ""}${user.last_name}`,
        email: user.email_id,
        mobileNo: user.mobile_no,
        designation: user.current_role || "REC Member",
        department: user.location_id || "N/A",
      }));

      setRecList(mappedRecList);
    } catch (error) {
      console.error("Error fetching rec user:", error);
      toast.error("Failed to load REC members");
    }
  };

  const fetchAccreditorUsers = async () => {
    try {
      const response =
        await UserRoleManagementService.getActiveAccreditorUsers(access_token);

      // Map the API response to the format expected by the component
      const mappedAccreditorList = response.data.map((user) => ({
        id: user.id,
        userId: user.user_id,
        name: `${user.first_name} ${user.middle_name ? user.middle_name + " " : ""}${user.last_name}`,
        email: user.email_id,
        mobileNo: user.mobile_no,
        designation: user.current_role || "Accreditor",
        department: user.location_id || "N/A",
      }));

      setAccreditorList(mappedAccreditorList);
    } catch (error) {
      console.error("Error fetching accreditor users:", error);
      toast.error("Failed to load Accreditor members");
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);
      setPaymentStatus(response.data);
      console.log("Payment status fetched:", response.data);
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setPaymentStatus(null);
    }
  };

  useEffect(() => {
    if (qualityData.length > 0 && rawQualityStandards) {
      const { responses, remarks } = parseQualityStandardsWithData(
        rawQualityStandards,
        qualityData,
      );
      setQualityResponses(responses);
      setQualityRemarks(remarks);
    }
  }, [qualityData, rawQualityStandards]);

  const fetchMasterData = async () => {
    try {
      // First fetch registration data to get service_id
      const registrationRes =
        await InstituteRegistrationService.getInstituteRegistrationDetails(
          applicationNo,
          access_token,
        );

      let data = registrationRes.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      // Get the service_id from registration data to fetch correct quality standards
      const serviceIdForQuality = data?.service_id || 7;

      const [
        sectorsRes,
        dzongkhagsRes,
        ownershipRes,
        nationalityRes,
        genderRes,
        jobTypeRes,
        certificateLevelRes,
        qualityRes,
      ] = await Promise.all([
        CommonService.getAllSectors(),
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(7),
        CommonService.getByParentId(9),
        CommonService.getByParentId(8),
        CommonService.getByParentId(11),
        CommonService.getByParentId(10),
        CommonService.getAllQualitystandards(serviceIdForQuality),
      ]);

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);
      setNationality(nationalityRes.data || []);
      setGender(genderRes.data || []);
      setJobType(jobTypeRes.data || []);
      setCertificateLevel(certificateLevelRes.data || []);

      // Process quality data
      if (qualityRes.data && qualityRes.data.length > 0) {
        const mainCategories = qualityRes.data.filter(
          (item) => item.parentId === 0,
        );
        const subCategories = qualityRes.data.filter(
          (item) => item.parentId !== 0,
        );
        const structured = mainCategories.map((category) => ({
          id: category.id.toString(),
          title: category.dropdownName || category.description,
          rows: subCategories
            .filter((sub) => sub.parentId === category.id)
            .map((sub) => ({
              id: sub.id.toString(),
              value: sub.dropdownName || sub.description,
            })),
        }));
        setQualityData(structured);
      }

      // Process registration data
      const trainers = parseTrainers(data.trainers);
      const courses = parseCourses(data.courses);
      const tuitionDetails = parseTuitionDetails(data.tuition_details);
      const parsedDocuments = parseDocuments(data.documents);

      setRegistrationData({
        ...data,
        parsedTrainers: trainers,
        parsedCourses: courses,
        parsedTuitionDetails: tuitionDetails,
      });
      setDocuments(parsedDocuments);

      // Store raw quality standards for later parsing
      if (data.quality_standard_responses) {
        setRawQualityStandards(data.quality_standard_responses);
      }

      // Set assigned RECs if exists
      if (data.assigned_recs) {
        setAssignedRecs(data.assigned_recs);
      }

      // Set assigned Accreditors if exists
      if (data.assigned_accreditors) {
        setAssignedAccreditors(data.assigned_accreditors);
      }

      // Fetch courses for each course's sector
      if (courses && courses.length > 0) {
        courses.forEach(async (course) => {
          if (course.sectorId) {
            await fetchCoursesBySector(course.sectorId);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const parseQualityStandardsWithData = (qualityStr, qualityDataRef) => {
    try {
      if (!qualityStr) return { responses: {}, remarks: {} };

      // Parse if string, otherwise use as is
      const data =
        typeof qualityStr === "string" ? JSON.parse(qualityStr) : qualityStr;

      const responseMap = {};
      const remarksMap = {};

      data.forEach((item) => {
        const subQuestionId = item.standardId?.toString();
        const responseValue = item.responseId;
        const remarkValue = item.remarks || "";

        // Find which category this sub-question belongs to
        let categoryId = null;
        for (const category of qualityDataRef) {
          const foundRow = category.rows.find(
            (row) => row.id === subQuestionId,
          );
          if (foundRow) {
            categoryId = category.id;
            break;
          }
        }

        if (categoryId && subQuestionId) {
          if (!responseMap[categoryId]) responseMap[categoryId] = {};
          if (!remarksMap[categoryId]) remarksMap[categoryId] = {};

          responseMap[categoryId][subQuestionId] = responseValue;
          remarksMap[categoryId][subQuestionId] = remarkValue;
        } else {
          console.warn(`No category found for standardId: ${subQuestionId}`);
        }
      });
      return { responses: responseMap, remarks: remarksMap };
    } catch (error) {
      console.error("Error parsing quality standards:", error);
      return { responses: {}, remarks: {} };
    }
  };

  const fetchCoursesBySector = async (sectorId) => {
    if (!sectorId) return;
    if (coursesMap[sectorId]) return;

    try {
      const response = await CommonService.getOccupationsBySectorId(sectorId);
      setCoursesMap((prev) => ({
        ...prev,
        [sectorId]: response.data || [],
      }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCoursesMap((prev) => ({
        ...prev,
        [sectorId]: [],
      }));
    }
  };

  const parseTrainers = (trainersStr) => {
    try {
      if (!trainersStr) return [];
      const trainers = JSON.parse(trainersStr);
      return Array.isArray(trainers) ? trainers : [];
    } catch (error) {
      console.error("Error parsing trainers:", error);
      return [];
    }
  };

  const parseCourses = (coursesStr) => {
    try {
      if (!coursesStr) return [];
      const courses = JSON.parse(coursesStr);
      return Array.isArray(courses) ? courses : [];
    } catch (error) {
      console.error("Error parsing courses:", error);
      return [];
    }
  };

  const parseTuitionDetails = (tuitionStr) => {
    try {
      if (!tuitionStr) return [];
      const tuition = JSON.parse(tuitionStr);
      return Array.isArray(tuition) ? tuition : [];
    } catch (error) {
      console.error("Error parsing tuition details:", error);
      return [];
    }
  };

  const parseDocuments = (docsStr) => {
    try {
      if (!docsStr) return [];
      const docs = JSON.parse(docsStr);
      return docs.map((doc) => ({
        name: doc.documentName || doc.name,
        url: doc.url,
        id: doc.id,
      }));
    } catch (error) {
      console.error("Error parsing documents:", error);
      return [];
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const getSectorName = useCallback(
    (id) => {
      if (!id) return "";
      const sector = sectors.find((s) => s.id.toString() === id.toString());
      return sector ? sector.sectorName : id;
    },
    [sectors],
  );

  const getCourseName = useCallback(
    (sectorId, courseId) => {
      if (!courseId) return "";
      const courses = coursesMap[sectorId];
      if (!courses) return courseId;
      const course = courses.find(
        (c) => c.id.toString() === courseId.toString(),
      );
      return course ? course.occupationName || course.name : courseId;
    },
    [coursesMap],
  );

  const getDzongkhagName = useCallback(
    (id) => {
      if (!id) return "";
      const dz = dzongkhags.find((d) => d.id.toString() === id.toString());
      return dz ? dz.dzonkhagName : id;
    },
    [dzongkhags],
  );

  const getOwnershipTypeName = useCallback(
    (id) => {
      if (!id) return "";
      const type = ownershipTypes.find(
        (t) => t.id.toString() === id.toString(),
      );
      return type ? type.name : id;
    },
    [ownershipTypes],
  );

  const getNationalityName = useCallback(
    (id) => {
      if (!id) return "";
      const nat = nationality.find((n) => n.id.toString() === id.toString());
      return nat ? nat.name : id;
    },
    [nationality],
  );

  const getGenderName = useCallback(
    (id) => {
      if (!id) return "";
      const gen = gender.find((g) => g.id.toString() === id.toString());
      return gen ? gen.name : id;
    },
    [gender],
  );

  const getJobTypeName = useCallback(
    (id) => {
      if (!id) return "";
      const job = jobType.find((j) => j.id.toString() === id.toString());
      return job ? job.name : id;
    },
    [jobType],
  );

  const getCertificateLevelName = useCallback(
    (id) => {
      if (!id) return "";
      const level = certificateLevel.find(
        (l) => l.id.toString() === id.toString(),
      );
      return level ? level.name : id;
    },
    [certificateLevel],
  );

  const handleQualityResponseChange = (categoryId, subQuestionId, value) => {
    setQualityResponses((prev) => {
      const newResponses = { ...prev };

      if (!newResponses[categoryId]) {
        newResponses[categoryId] = {};
      }

      if (newResponses[categoryId][subQuestionId] === value) {
        delete newResponses[categoryId][subQuestionId];
        if (Object.keys(newResponses[categoryId]).length === 0) {
          delete newResponses[categoryId];
        }
      } else {
        newResponses[categoryId][subQuestionId] = value;
      }

      return newResponses;
    });
  };

  const handleQualityRemarkChange = (categoryId, subQuestionId, value) => {
    setQualityRemarks((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [subQuestionId]: value,
      },
    }));
  };

  const prepareQualityStandardsForBackend = () => {
    const qualityStandardsData = [];

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((subQuestionId) => {
        const responseId = qualityResponses[categoryId][subQuestionId];
        const remark = qualityRemarks[categoryId]?.[subQuestionId] || "";

        if (responseId && responseId !== "") {
          qualityStandardsData.push({
            standardId: parseInt(subQuestionId),
            responseId: responseId,
            remarks: remark,
          });
        }
      });
    });

    return qualityStandardsData;
  };

  // REC handlers
  const handleAddREC = () => {
    if (!selectedRec) {
      toast.error("Please select a REC member to add");
      return;
    }

    // Check if REC is already added
    if (
      assignedRecs.some((rec) => rec.id.toString() === selectedRec.toString())
    ) {
      toast.error("This REC member is already assigned");
      return;
    }

    // Find selected REC member details
    const selectedRecDetails = recList.find(
      (rec) => rec.id.toString() === selectedRec.toString(),
    );

    if (!selectedRecDetails) {
      toast.error("Selected REC member not found");
      return;
    }

    // Create assignment record
    const assignmentRecord = {
      id: selectedRecDetails.id,
      userId: selectedRecDetails.userId,
      name: selectedRecDetails.name,
      email: selectedRecDetails.email,
      mobileNo: selectedRecDetails.mobileNo,
      designation: selectedRecDetails.designation || "REC Member",
      department: selectedRecDetails.department || "N/A",
      assignedDate: new Date().toISOString(),
      assignedBy: actionId,
    };

    setAssignedRecs((prev) => [...prev, assignmentRecord]);
    toast.success(`${selectedRecDetails.name} added successfully`);
    setSelectedRec("");
  };

  const openDeleteRECDialog = (rec) => {
    setRecToDelete(rec);
    setDeleteDialogOpen(true);
  };

  const handleDeleteREC = () => {
    if (recToDelete) {
      setAssignedRecs((prev) =>
        prev.filter((rec) => rec.id !== recToDelete.id),
      );
      toast.info(`${recToDelete.name} has been removed`);
      setDeleteDialogOpen(false);
      setRecToDelete(null);
    }
  };

  // Accreditor handlers
  const handleAddAccreditor = () => {
    if (!selectedAccreditor) {
      toast.error("Please select an Accreditor to add");
      return;
    }

    // Check if Accreditor is already added
    if (
      assignedAccreditors.some(
        (acc) => acc.id.toString() === selectedAccreditor.toString(),
      )
    ) {
      toast.error("This Accreditor is already assigned");
      return;
    }

    // Find selected Accreditor details
    const selectedAccreditorDetails = accreditorList.find(
      (acc) => acc.id.toString() === selectedAccreditor.toString(),
    );

    if (!selectedAccreditorDetails) {
      toast.error("Selected Accreditor not found");
      return;
    }

    // Create assignment record
    const assignmentRecord = {
      id: selectedAccreditorDetails.id,
      userId: selectedAccreditorDetails.userId,
      name: selectedAccreditorDetails.name,
      email: selectedAccreditorDetails.email,
      mobileNo: selectedAccreditorDetails.mobileNo,
      designation: selectedAccreditorDetails.designation || "Accreditor",
      department: selectedAccreditorDetails.department || "N/A",
      assignedDate: new Date().toISOString(),
      assignedBy: actionId,
    };

    setAssignedAccreditors((prev) => [...prev, assignmentRecord]);
    toast.success(`${selectedAccreditorDetails.name} added successfully`);
    setSelectedAccreditor("");
  };

  const openDeleteAccreditorDialog = (acc) => {
    setAccreditorToDelete(acc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccreditor = () => {
    if (accreditorToDelete) {
      setAssignedAccreditors((prev) =>
        prev.filter((acc) => acc.id !== accreditorToDelete.id),
      );
      toast.info(`${accreditorToDelete.name} has been removed`);
      setDeleteDialogOpen(false);
      setAccreditorToDelete(null);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRecToDelete(null);
    setAccreditorToDelete(null);
  };

  const openActionDialog = (statusId) => {
    setSelectedStatusId(statusId);
    setRemarks("");
    setEndorseRemarks("");
    setRemarksError("");
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setSelectedStatusId(null);
    setRemarks("");
    setEndorseRemarks("");
    setRemarksError("");
  };

  const validateAssignments = (statusId) => {
    // Skip REC validation when rejecting (statusId === 58)
    if (statusId !== 58) {
      // Check REC validation if tab is shown
      if (showRecTab && assignedRecs.length === 0 && !hasQualityNo) {
        toast.error("Please assign at least one REC member before proceeding");
        return false;
      }
    }

    // Always validate Accreditor if tab is shown (including rejection)
    if (
      showAccreditorTab &&
      assignedAccreditors.length === 0 &&
      !hasQualityNo
    ) {
      toast.error("Please assign at least one Accreditor before proceeding");
      return false;
    }

    return true;
  };

  const handleAction = async () => {
    if (selectedStatusId === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    if (selectedStatusId === 59 && !endorseRemarks.trim()) {
      setRemarksError("Remarks are required for endorsement");
      return;
    }

    // Validate assignments before proceeding (pass statusId to skip REC validation for reject)
    if (!validateAssignments(selectedStatusId)) {
      return;
    }

    setActionLoading(true);
    try {
      const qualityStandardsData = prepareQualityStandardsForBackend();

      // Prepare assignedRecs payload - only send userId
      const assignedRecsPayload = assignedRecs.map((rec) => ({
        userId: rec.userId,
      }));

      // Prepare assignedAccreditors payload - only send userId
      const assignedAccreditorsPayload = assignedAccreditors.map((acc) => ({
        userId: acc.userId,
      }));

      const payload = {
        applicationNo: registrationData.application_no,
        instituteName: registrationData.proposed_institute_name,
        dzongkhagId: registrationData.dzongkhag_id,
        currentRoleId: currentRoleId,
        exactLocation: registrationData.exact_location,
        telephoneNo: registrationData.telephone_no,
        mobileNo: registrationData.mobile_no,
        emailId: registrationData.email_id,
        sectorId: registrationData.sector_id,
        ownershipTypeId: registrationData.ownership_type_id,
        bhutaneseEmployees: registrationData.bhutanese_employees,
        nonBhutaneseEmployees: registrationData.non_bhutanese_employees,
        businessLicenseNo: registrationData.business_license_no,
        keyContactName: registrationData.key_contact_name,
        keyContactDesignation: registrationData.key_contact_designation,
        keyContactMobileNo: registrationData.key_contact_mobile_no,
        courses: registrationData.parsedCourses,
        website: registrationData.website,
        serviceId: registrationData.service_id,
        assignedRoleId: currentRoleId,
        statusId: selectedStatusId,
        recMemberUserId: userId, // Use userId from Redux store
        updatedBy: actionId,
        documents: newDocuments,
        remarks:
          selectedStatusId === 58
            ? remarks
            : selectedStatusId === 59
              ? endorseRemarks
              : "",
        qualityStandards: qualityStandardsData,
        assignedRecs: assignedRecsPayload,
        assignedAccreditors: assignedAccreditorsPayload,
        // Add overall remarks for REC
        overallRemarks: currentRoleId == 23 ? overallRemarks : "",
      };
      console.log("Payload for action:", payload);
      await InstituteRegistrationService.verifyInstituteRegistration(
        payload,
        access_token,
      );

      let successMessage;
      switch (selectedStatusId) {
        case 56:
          successMessage = "Registration verified successfully";
          break;
        case 57:
          successMessage = "Registration approved successfully";
          break;
        case 58:
          successMessage = "Registration rejected successfully";
          break;
        case 59:
          successMessage = "Registration endorsed successfully";
          break;
        case 60:
          successMessage =
            "Registration forwarded back to QAS LEVEL 1 successfully";
          break;
        case 62:
          successMessage = "Registration verified successfully";
          break;
        default:
          successMessage = "Action completed successfully";
      }

      toast.success(successMessage);
      navigate(-1);
      closeDialog();
      setNewDocuments([]);
    } catch (error) {
      console.error(`Error performing action:`, error);
      toast.error(`Failed to process registration: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (selectedStatusId) {
      case 56:
        return "Verify Registration";
      case 57:
        return "Approve Registration";
      case 58:
        return "Reject Registration";
      case 59:
        return "Endorse Registration";
      case 60:
        return "Forwarded Back TO QAS LEVEL 1";
      case 62:
        return "Verify Registration";
      default:
        return "Confirm Action";
    }
  };

  const getDialogContent = () => {
    if (selectedStatusId === 59) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for endorsing this registration:
            <br />
            <strong>Application No: {registrationData?.application_no}</strong>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            fullWidth
            multiline
            rows={4}
            value={endorseRemarks}
            onChange={(e) => {
              setEndorseRemarks(e.target.value);
              setRemarksError("");
            }}
            error={!!remarksError}
            helperText={remarksError}
            required
          />
        </>
      );
    } else if (selectedStatusId === 58) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this registration:
            <br />
            <strong>Application No: {registrationData?.application_no}</strong>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            fullWidth
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setRemarksError("");
            }}
            error={!!remarksError}
            helperText={remarksError}
            required
          />
        </>
      );
    } else {
      const actionText =
        selectedStatusId === 56 || selectedStatusId === 62
          ? "verify"
          : "approve";
      return (
        <DialogContentText>
          Are you sure you want to {actionText} this registration?
          <br />
          <strong>Application No: {registrationData?.application_no}</strong>
        </DialogContentText>
      );
    }
  };

  const getConfirmButtonColor = () => {
    switch (selectedStatusId) {
      case 56:
      case 57:
      case 62:
        return "success";
      case 58:
        return "error";
      case 59:
        return "primary";
      default:
        return "primary";
    }
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    switch (selectedStatusId) {
      case 56:
        return "Confirm Verify";
      case 57:
        return "Confirm Approve";
      case 58:
        return "Confirm Reject";
      case 59:
        return "Confirm Endorse";
      case 62:
        return "Confirm Verify";
      default:
        return "Confirm";
    }
  };

  // Generate PA Number handler
  const handleGeneratePANumber = () => {
    if (!registrationData) {
      toast.error("Registration data not found");
      return;
    }

    // Determine service code from mapping
    const serviceId = registrationData.service_id;
    const serviceCode = SERVICE_CODE_MAP[serviceId];

    if (!serviceCode) {
      toast.error("Invalid service type. Cannot generate PA number.");
      return;
    }

    // Prepare the data for BIRMS payment
    const applicationNo = registrationData.application_no;
    const instituteId = 0; //zero is used since we don't have institute ID while first registration
    const taxPayerNo = registrationData.application_no || "N/A";
    const taxPayerEmail = registrationData.email_id || "N/A";
    const taxPayerMobileNo = registrationData.mobile_no || "N/A";
    const taxPayerName = registrationData.proposed_institute_name || "N/A";

    // Navigate to BIRMS payment page
    navigate(
      `/birms/common-payment-index/${applicationNo}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  };

  // Function to handle redirect to payment
  const handleRedirectToPayment = (redirectUrl) => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      toast.error("No redirect URL available");
    }
  };

  const renderChecklist = useCallback(
    (standard) => {
      // Check if user is REC (role 23) - make readonly
      const isReadOnly = currentRoleId == 23;

      return (
        <Grid size={{ xs: 12 }} key={standard.id}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }} mb={1}>
              {standard.title}
            </Typography>
            <TableContainer>
              <Table size="small" sx={TABLE_STYLE}>
                <TableHead>
                  <TableRow>
                    <TableCell width="40">Sl. No</TableCell>
                    <TableCell>Quality Indicator</TableCell>
                    <TableCell align="center" width="80">
                      YES
                    </TableCell>
                    <TableCell align="center" width="80">
                      NO
                    </TableCell>
                    <TableCell width="250">Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {standard.rows.map((row, index) => {
                    const selectedValue =
                      qualityResponses[standard.id]?.[row.id];
                    const isYes = selectedValue === "Y";
                    const isNo = selectedValue === "N";
                    const remark = qualityRemarks[standard.id]?.[row.id] || "";
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.value}</TableCell>
                        <TableCell align="center">
                          {isReadOnly ? (
                            <Tooltip
                              title="This field is read-only for REC members"
                              arrow
                            >
                              <span>
                                <Radio
                                  size="small"
                                  sx={{ p: 0.25 }}
                                  checked={isYes}
                                  disabled={true}
                                />
                              </span>
                            </Tooltip>
                          ) : (
                            <Radio
                              size="small"
                              sx={{ p: 0.25 }}
                              checked={isYes}
                              onChange={() => {
                                const newValue = isYes ? undefined : "Y";
                                handleQualityResponseChange(
                                  standard.id,
                                  row.id,
                                  newValue,
                                );
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {isReadOnly ? (
                            <Tooltip
                              title="This field is read-only for REC members"
                              arrow
                            >
                              <span>
                                <Radio
                                  size="small"
                                  sx={{ p: 0.25 }}
                                  checked={isNo}
                                  disabled={true}
                                />
                              </span>
                            </Tooltip>
                          ) : (
                            <Radio
                              size="small"
                              sx={{ p: 0.25 }}
                              checked={isNo}
                              onChange={() => {
                                const newValue = isNo ? undefined : "N";
                                handleQualityResponseChange(
                                  standard.id,
                                  row.id,
                                  newValue,
                                );
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isReadOnly ? (
                            <Tooltip
                              title="This field is read-only for REC members"
                              arrow
                            >
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Enter remarks"
                                value={remark}
                                slotProps={{
                                  input: {
                                    readOnly: true,
                                    sx: { fontSize: "0.75rem" },
                                  },
                                }}
                                multiline
                                rows={2}
                              />
                            </Tooltip>
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Enter remarks"
                              value={remark}
                              onChange={(e) =>
                                handleQualityRemarkChange(
                                  standard.id,
                                  row.id,
                                  e.target.value,
                                )
                              }
                              slotProps={{
                                input: {
                                  sx: { fontSize: "0.75rem" },
                                },
                              }}
                              multiline
                              rows={2}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      );
    },
    [qualityResponses, qualityRemarks, currentRoleId],
  );

  const getTabs = () => {
    const baseTabs = [{ icon: <BusinessIcon />, label: "Basic informations" }];

    if (isTuitionService) {
      baseTabs.push({
        icon: <MenuBookIcon />,
        label: "Tuition/Coaching Details",
      });
    } else {
      baseTabs.push(
        { icon: <SchoolIcon />, label: "Trainer Details" },
        { icon: <MenuBookIcon />, label: "Course Details" },
      );
    }

    // Swap the order: Supporting Documents first, then Quality Standards
    baseTabs.push(
      { icon: <FileOpenIcon />, label: "Supporting Documents" },
      { icon: <VerifiedIcon />, label: "Quality Standards" },
    );

    // Add Generate PA Number tab for role 7 (before Assign REC)
    if (currentRoleId == 7) {
      baseTabs.push({
        icon: <SettingsSuggestIcon />,
        label: "Generate PA Number",
      });
    }

    // Only show Add Accreditors tab if:
    // 1. showAccreditorTab is true AND
    // 2. No "No" responses in quality standards (or user is not role 7)
    if (showAccreditorTab && !hasQualityNo) {
      baseTabs.push({
        icon: <GroupAddIcon />,
        label: "Add Accreditors",
      });
    }

    // Only show Assign REC tab if:
    // 1. showRecTab is true AND
    // 2. No "No" responses in quality standards (or user is not role 7)
    if (showRecTab && !hasQualityNo) {
      baseTabs.push({ icon: <EngineeringIcon />, label: "Assign REC" });
    }

    return baseTabs;
  };

  // Navigation handlers
  const handleNextTab = () => {
    const tabs = getTabs();
    if (tabValue < tabs.length - 1) {
      setTabValue(tabValue + 1);
    }
  };

  const handlePreviousTab = () => {
    if (tabValue > 0) {
      setTabValue(tabValue - 1);
    }
  };

  // Helper functions for button visibility
  const isFirstTab = () => tabValue === 0;
  const isLastTab = () => {
    const tabs = getTabs();
    return tabValue === tabs.length - 1;
  };

  const roleId = currentRoleId?.toString();

  // Get available REC members (not yet assigned)
  const availableRecs = recList.filter(
    (rec) => !assignedRecs.some((assigned) => assigned.id === rec.id),
  );

  // Get selected REC details
  const selectedRecDetails = recList.find(
    (rec) => rec.id.toString() === selectedRec?.toString(),
  );

  // Get available Accreditors (not yet assigned)
  const availableAccreditors = accreditorList.filter(
    (acc) => !assignedAccreditors.some((assigned) => assigned.id === acc.id),
  );

  // Get selected Accreditor details
  const selectedAccreditorDetails = accreditorList.find(
    (acc) => acc.id.toString() === selectedAccreditor?.toString(),
  );

  // Get tab indices
  const getTabIndices = () => {
    const tabs = getTabs();
    let accreditorIndex = -1;
    let recIndex = -1;
    let paNumberIndex = -1;

    tabs.forEach((tab, index) => {
      if (tab.label === "Add Accreditors") accreditorIndex = index;
      if (tab.label === "Assign REC") recIndex = index;
      if (tab.label === "Generate PA Number") paNumberIndex = index;
    });

    return { accreditorIndex, recIndex, paNumberIndex };
  };

  const { accreditorIndex, recIndex, paNumberIndex } = getTabIndices();

  if (loading) {
    return (
      <Box sx={{ p: 1, minHeight: "100vh" }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        </Paper>
      </Box>
    );
  }

  if (!registrationData) {
    return (
      <Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            Application Details
          </Typography>
          <Typography textAlign="center" color="error">
            Registration with Application No: {applicationNo} not found
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          Application Details
        </Typography>
        <Divider />

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
          }}
        >
          {getTabs().map((tab, index) => (
            <Tab key={index} icon={tab.icon} label={tab.label} />
          ))}
        </Tabs>

        {/* Institute Details Tab */}
        {tabValue === 0 && (
          <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name of Training Provider / Institution"
                  value={registrationData.proposed_institute_name || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Dzongkhag"
                  value={getDzongkhagName(registrationData.dzongkhag_id) || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Location of the Institute"
                  value={registrationData.exact_location || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Telephone No"
                  value={registrationData.telephone_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile No"
                  value={registrationData.mobile_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Id"
                  value={registrationData.email_id || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Website Address"
                  value={registrationData.website || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Business License No"
                  value={registrationData.business_license_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Type of Ownership"
                  value={
                    getOwnershipTypeName(registrationData.ownership_type_id) ||
                    ""
                  }
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Total Number of Bhutanese Employees"
                  value={registrationData.bhutanese_employees || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Total Number of Non Bhutanese Employees"
                  value={registrationData.non_bhutanese_employees || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Key Contact Person Name"
                  value={registrationData.key_contact_name || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Key Contact Person Designation"
                  value={registrationData.key_contact_designation || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Key Contact Person Mobile No"
                  value={registrationData.key_contact_mobile_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Trainer Details Tab */}
        {!isTuitionService && tabValue === 1 && (
          <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
            <Grid container spacing={3}>
              {registrationData.parsedTrainers &&
              registrationData.parsedTrainers.length > 0 ? (
                registrationData.parsedTrainers.map((trainer, index) => (
                  <Grid size={{ xs: 12 }} key={index}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Trainer {index + 1}
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Nationality"
                            value={
                              getNationalityName(trainer.nationalityId) || ""
                            }
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        {trainer.cid && (
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="CID"
                              value={trainer.cid || ""}
                              slotProps={{ input: { readOnly: true } }}
                            />
                          </Grid>
                        )}

                        {trainer.workPermit && (
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Work Permit"
                              value={trainer.workPermit || ""}
                              slotProps={{ input: { readOnly: true } }}
                            />
                          </Grid>
                        )}

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Name"
                            value={trainer.name || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Gender"
                            value={getGenderName(trainer.genderId) || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Qualification"
                            value={trainer.qualification || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Experience (Years)"
                            value={trainer.experience || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Type"
                            value={getJobTypeName(trainer.typeId) || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Typography textAlign="center" color="text.secondary">
                    No trainer information available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Course Details Tab */}
        {!isTuitionService && tabValue === 2 && (
          <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
            <Grid container spacing={3}>
              {registrationData.parsedCourses &&
              registrationData.parsedCourses.length > 0 ? (
                registrationData.parsedCourses.map((course, index) => (
                  <Grid size={{ xs: 12 }} key={index}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Course {index + 1}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Sector"
                            value={getSectorName(course.sectorId) || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Course Title"
                            value={
                              getCourseName(course.sectorId, course.courseId) ||
                              ""
                            }
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Level Certificate / Diploma"
                            value={
                              getCertificateLevelName(course.courseLevelId) ||
                              ""
                            }
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Theory (Hours)"
                            value={course.theoryHours || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Practical (Hours)"
                            value={course.practicalHours || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="OJT (Hours)"
                            value={course.ojtHours || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Fees per Trainee"
                            value={course.feesPerTrainee || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Enrollment Capacity per Batch"
                            value={course.enrollmentCapacity || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Typography textAlign="center" color="text.secondary">
                    No course information available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Tuition/Coaching Details Tab */}
        {isTuitionService && tabValue === 1 && (
          <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
            <Grid container spacing={3}>
              {registrationData.parsedTuitionDetails &&
              registrationData.parsedTuitionDetails.length > 0 ? (
                registrationData.parsedTuitionDetails.map((tuition, index) => (
                  <Grid size={{ xs: 12 }} key={index}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Tuition/Coaching {index + 1}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Class Level"
                            value={tuition.classLevel || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Subjects"
                            value={tuition.subjects || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Duration (Hours/Months)"
                            value={tuition.duration || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Fees (Nu.)"
                            value={tuition.fees || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tutor Name"
                            value={tuition.tutorName || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tutor CID"
                            value={tuition.tutorCid || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tutor Qualification"
                            value={tuition.tutorQualification || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Typography textAlign="center" color="text.secondary">
                    No tuition/coaching information available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Supporting Documents Tab - Now first after Course/Tuition Details */}
        {tabValue === (isTuitionService ? 2 : 3) && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                <Box
                  component="ol"
                  sx={{
                    pl: 3,
                    mb: 2,
                    "& li": {
                      fontSize: "0.85rem",
                      fontStyle: "italic",
                      mb: 0.5,
                    },
                  }}
                >
                  <li>
                    Photocopy of business license (Not Applicable for Government
                    Institutes)
                  </li>
                  <li>
                    List of trainees for each course, indicating year of
                    graduation/male/female/CID No
                  </li>
                </Box>
                <FileDownload
                  initialFiles={documents}
                  onFileUpload={handleFileUpload}
                  allowUpload={true}
                />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Quality Standards Tab - Now second after Supporting Documents */}
        {tabValue === (isTuitionService ? 3 : 4) && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              {qualityData.length > 0 ? (
                <>
                  {qualityData.slice(0, 3).map(renderChecklist)}

                  {/* Overall Remarks for REC (role 23) */}
                  {currentRoleId == 23 && (
                    <Paper
                      sx={{
                        p: 3,
                        mt: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Overall Remarks
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Enter overall remarks for this registration..."
                        value={overallRemarks}
                        onChange={(e) => setOverallRemarks(e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    </Paper>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No quality standards available for this service
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {/* Generate PA Number Tab - Now for role 7 (before Assign REC) */}
        {currentRoleId == 7 && tabValue === paNumberIndex && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AccountBalanceIcon
                    sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Generate PA Number
                  </Typography>
                </Box>

                {paymentStatus ? (
                  <Card variant="outlined" sx={{ p: 0 }}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      {/* Compact Table-like Layout */}
                      <Grid container spacing={0.5}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 100 }}
                            >
                              Payment Advice No:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {paymentStatus.paymentAdviceNo || "N/A"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 70 }}
                            >
                              Ref No:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {paymentStatus.refNo || "N/A"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 70 }}
                            >
                              Tax Payer:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.75rem" }}
                              noWrap
                            >
                              {paymentStatus.taxPayerName || "N/A"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 60 }}
                            >
                              Status:
                            </Typography>
                            <Chip
                              label={paymentStatus.paymentStatus || "N/A"}
                              color={
                                paymentStatus.paymentStatus === "paid"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 70 }}
                            >
                              Due Date:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {paymentStatus.paymentDueDate || "N/A"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 60 }}
                            >
                              Platform:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {paymentStatus.platform || "N/A"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 70 }}
                            >
                              Amount:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary"
                              sx={{ fontSize: "0.8rem" }}
                            >
                              Nu. {paymentStatus.totalPayableAmount || "0.00"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              py: 0.25,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 70 }}
                            >
                              Payment Mode:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {paymentStatus.paymentMode || "Not yet paid"}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {paymentStatus.redirectUrl && (
                        <Box
                          sx={{
                            mt: 1.5,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
                            onClick={() =>
                              handleRedirectToPayment(paymentStatus.redirectUrl)
                            }
                            sx={{
                              px: 2.5,
                              py: 0.5,
                              fontWeight: 600,
                              textTransform: "none",
                              fontSize: "0.75rem",
                            }}
                          >
                            Proceed to Payment
                          </Button>
                        </Box>
                      )}

                      <Alert
                        severity="info"
                        sx={{
                          mt: 1,
                          py: 0.25,
                          "& .MuiAlert-message": {
                            fontSize: "0.7rem",
                            py: 0.25,
                          },
                        }}
                      >
                        PA number already generated. Click above to proceed with
                        payment.
                      </Alert>
                    </CardContent>
                  </Card>
                ) : (
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography
                        variant="body2"
                        gutterBottom
                        sx={{ fontSize: "0.8rem" }}
                      >
                        Click the button below to generate a PA number and
                        proceed to payment.
                      </Typography>

                      <Box
                        sx={{
                          mt: 1.5,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={
                            <SettingsSuggestIcon sx={{ fontSize: 18 }} />
                          }
                          onClick={handleGeneratePANumber}
                          sx={{
                            px: 3,
                            py: 0.5,
                            fontWeight: 600,
                            textTransform: "none",
                            fontSize: "0.75rem",
                          }}
                        >
                          Generate PA Number
                        </Button>
                      </Box>

                      <Alert
                        severity="info"
                        sx={{
                          mt: 1.5,
                          py: 0.25,
                          "& .MuiAlert-message": {
                            fontSize: "0.7rem",
                            py: 0.25,
                          },
                        }}
                      >
                        <strong>Note:</strong> This will create a payment
                        request and redirect you to the payment portal.
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Add Accreditors Tab - Only show if no "No" in quality standards */}
        {showAccreditorTab && !hasQualityNo && tabValue === accreditorIndex && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <GroupAddIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h7" fontWeight={600}>
                    Add Accreditors
                  </Typography>
                </Box>

                {/* Assignment Form */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={500}
                      gutterBottom
                    >
                      Add Accreditor Members
                    </Typography>

                    {/* Selected Accreditors Display */}
                    {assignedAccreditors.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Assigned Accreditors ({assignedAccreditors.length}):
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {assignedAccreditors.map((acc) => (
                            <Chip
                              key={acc.id}
                              label={`${acc.name} (${acc.userId})`}
                              color="success"
                              onDelete={() => openDeleteAccreditorDialog(acc)}
                              deleteIcon={
                                <DeleteIcon sx={{ color: "#d32f2f" }} />
                              }
                              sx={{
                                mb: 1,
                                "& .MuiChip-deleteIcon": {
                                  color: "#d32f2f",
                                  "&:hover": {
                                    color: "#b71c1c",
                                  },
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={availableAccreditors}
                          getOptionLabel={(option) =>
                            `${option.name} (${option.userId})`
                          }
                          value={selectedAccreditorDetails || null}
                          onChange={(event, newValue) => {
                            setSelectedAccreditor(newValue ? newValue.id : "");
                          }}
                          filterOptions={(options, state) => {
                            const searchTerm = state.inputValue
                              .toLowerCase()
                              .trim();
                            // Only show results if search term has at least 2 characters
                            if (!searchTerm || searchTerm.length < 2) {
                              return [];
                            }

                            return options.filter(
                              (option) =>
                                option.name
                                  .toLowerCase()
                                  .includes(searchTerm) ||
                                option.userId
                                  ?.toLowerCase()
                                  .includes(searchTerm) ||
                                option.email
                                  ?.toLowerCase()
                                  .includes(searchTerm) ||
                                option.mobileNo?.includes(searchTerm),
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search Accreditor by Name or User ID"
                              placeholder="Type at least 2 characters to search..."
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props}>
                              <Box>
                                <Typography variant="body2">
                                  {option.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  User ID: {option.userId} | Email:{" "}
                                  {option.email || "N/A"} | Mobile:{" "}
                                  {option.mobileNo || "N/A"}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          noOptionsText="No Accreditors available"
                          loadingText="Loading..."
                          disabled={availableAccreditors.length === 0}
                          openOnFocus={false}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          startIcon={<PersonAddIcon />}
                          onClick={handleAddAccreditor}
                          disabled={
                            !selectedAccreditor ||
                            availableAccreditors.length === 0
                          }
                          sx={{
                            fontWeight: 600,
                            textTransform: "none",
                            width: "100%",
                          }}
                        >
                          Add Accreditor
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Selected Accreditor Details Preview */}
                    {selectedAccreditor && selectedAccreditorDetails && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: "action.hover",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          gutterBottom
                        >
                          Selected Accreditor Details:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Name
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedAccreditorDetails.name}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              User ID
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedAccreditorDetails.userId}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Email
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedAccreditorDetails.email || "N/A"}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Mobile No
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedAccreditorDetails.mobileNo || "N/A"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Empty State */}
                    {assignedAccreditors.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No Accreditors have been assigned yet. Use the search
                        above to add Accreditor members.
                      </Alert>
                    )}

                    {/* Show no data message */}
                    {accreditorList.length === 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        No Accreditor members found. Please check if there are
                        active Accreditor users in the system.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Assign REC Tab - Only show if no "No" in quality standards */}
        {showRecTab && !hasQualityNo && tabValue === recIndex && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <EngineeringIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h7" fontWeight={600}>
                    Assign Regulatory and Evaluation Committee (REC)
                  </Typography>
                </Box>

                {/* Assignment Form */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={500}
                      gutterBottom
                    >
                      Add REC Members
                    </Typography>

                    {/* Selected RECs Display */}
                    {assignedRecs.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Assigned REC Members ({assignedRecs.length}):
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {assignedRecs.map((rec) => (
                            <Chip
                              key={rec.id}
                              label={`${rec.name} (${rec.userId})`}
                              color="success"
                              onDelete={() => openDeleteRECDialog(rec)}
                              deleteIcon={
                                <DeleteIcon sx={{ color: "#d32f2f" }} />
                              }
                              sx={{
                                mb: 1,
                                "& .MuiChip-deleteIcon": {
                                  color: "#d32f2f",
                                  "&:hover": {
                                    color: "#b71c1c",
                                  },
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={availableRecs}
                          getOptionLabel={(option) =>
                            `${option.name} (${option.userId})`
                          }
                          value={selectedRecDetails || null}
                          onChange={(event, newValue) => {
                            setSelectedRec(newValue ? newValue.id : "");
                          }}
                          filterOptions={(options, state) => {
                            const searchTerm = state.inputValue
                              .toLowerCase()
                              .trim();
                            // Only show results if search term has at least 2 characters
                            if (!searchTerm || searchTerm.length < 2) {
                              return [];
                            }

                            return options.filter(
                              (option) =>
                                option.name
                                  .toLowerCase()
                                  .includes(searchTerm) ||
                                option.userId
                                  ?.toLowerCase()
                                  .includes(searchTerm) ||
                                option.email
                                  ?.toLowerCase()
                                  .includes(searchTerm) ||
                                option.mobileNo?.includes(searchTerm),
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search REC Member by Name or User ID"
                              placeholder="Type at least 2 characters to search..."
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props}>
                              <Box>
                                <Typography variant="body2">
                                  {option.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  User ID: {option.userId} | Email:{" "}
                                  {option.email || "N/A"} | Mobile:{" "}
                                  {option.mobileNo || "N/A"}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          noOptionsText="No REC members available"
                          loadingText="Loading..."
                          disabled={availableRecs.length === 0}
                          openOnFocus={false}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          startIcon={<PersonAddIcon />}
                          onClick={handleAddREC}
                          disabled={!selectedRec || availableRecs.length === 0}
                          sx={{
                            fontWeight: 600,
                            textTransform: "none",
                            width: "100%",
                          }}
                        >
                          Add REC
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Selected REC Details Preview */}
                    {selectedRec && selectedRecDetails && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: "action.hover",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          gutterBottom
                        >
                          Selected REC Details:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Name
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedRecDetails.name}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              User ID
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedRecDetails.userId}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Email{" "}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedRecDetails.email || "N/A"}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Mobile No
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedRecDetails.mobileNo || "N/A"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Empty State */}
                    {assignedRecs.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No REC members have been assigned yet. Use the search
                        above to add REC members.
                      </Alert>
                    )}

                    {/* Show loading or no data message */}
                    {recList.length === 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        No REC members found. Please check if there are active
                        REC users in the system.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Navigation and Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          {!isFirstTab() && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SkipPreviousIcon />}
              onClick={handlePreviousTab}
              sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
            >
              Previous
            </Button>
          )}

          {!isLastTab() && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              endIcon={<SkipNextIcon />}
              onClick={handleNextTab}
              sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
            >
              Next
            </Button>
          )}

          {isLastTab() && (
            <>
              {roleId === "7" && (
                <>
                  {/* Only show Verify button if no "No" in quality standards AND payment is paid */}
                  {!hasQualityNo && (
                    <Tooltip
                      title={
                        !isPaymentPaid
                          ? "Payment must be completed before verification"
                          : ""
                      }
                      arrow
                    >
                      <span>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => openActionDialog(56)}
                          disabled={!isPaymentPaid}
                          sx={{
                            px: 3,
                            py: 0.5,
                            fontWeight: 600,
                            textTransform: "none",
                          }}
                        >
                          Verify
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  {/* Always show Reject button */}
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => openActionDialog(58)}
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}

              {roleId === "10" && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openActionDialog(62)}
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Verify
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => openActionDialog(60)}
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}

              {roleId === "23" && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<VerifiedIcon />}
                  onClick={() => openActionDialog(59)}
                  sx={{
                    px: 3,
                    py: 0.5,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Endorse
                </Button>
              )}

              {roleId === "22" && (
                <Tooltip
                  title={
                    !paymentStatus
                      ? "Payment must be completed before approval"
                      : ""
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => openActionDialog(57)}
                      disabled={!isPaymentPaid}
                      sx={{
                        px: 3,
                        py: 0.5,
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      Approve
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {recToDelete && (
              <>
                Are you sure you want to remove{" "}
                <strong>{recToDelete?.name}</strong> ({recToDelete?.userId})
                from the REC assignment?
              </>
            )}
            {accreditorToDelete && (
              <>
                Are you sure you want to remove{" "}
                <strong>{accreditorToDelete?.name}</strong> (
                {accreditorToDelete?.userId}) from the Accreditor assignment?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={closeDeleteDialog}
          >
            Cancel
          </Button>
          <Button
            onClick={recToDelete ? handleDeleteREC : handleDeleteAccreditor}
            color="error"
            variant="contained"
            size="small"
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>{getDialogContent()}</DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={closeDialog}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={getConfirmButtonColor()}
            variant="contained"
            size="small"
            disabled={
              actionLoading ||
              (selectedStatusId === 58 && !remarks.trim()) ||
              (selectedStatusId === 59 && !endorseRemarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewInstituteSesCentreAssessmentCentre;
