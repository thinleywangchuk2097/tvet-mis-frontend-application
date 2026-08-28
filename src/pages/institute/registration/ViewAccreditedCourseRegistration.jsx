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
  Chip,
  Card,
  CardContent,
  Alert,
  Stack,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import PaymentIcon from "@mui/icons-material/Payment";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import CheckIcon from "@mui/icons-material/Check";
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";
import CommonService from "../../../api/services/internal/common/CommonService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import CurriculumIndexService from "../../../api/services/internal/course/CurriculumIndexService";

const SERVICE_CODE = 100578;

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

const ViewAccreditedCourseRegistration = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [courseData, setCourseData] = useState(null);
  const [currentStatusId, setCurrentStatusId] = useState(null);
  const [instituteData, setInstituteData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [curriculumTypes, setCurriculumTypes] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  // Master data
  const [sectors, setSectors] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [occupationMap, setOccupationMap] = useState({});
  const [qualityData, setQualityData] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [rawQualityStandards, setRawQualityStandards] = useState(null);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [genderList, setGenderList] = useState([]);
  const [qualificationList, setQualificationList] = useState([]);

  // Assignment states
  const [recList, setRecList] = useState([]);
  const [selectedRec, setSelectedRec] = useState("");
  const [assignedRecs, setAssignedRecs] = useState([]);
  const [accreditorList, setAccreditorList] = useState([]);
  const [selectedAccreditor, setSelectedAccreditor] = useState("");
  const [assignedAccreditors, setAssignedAccreditors] = useState([]);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recToDelete, setRecToDelete] = useState(null);
  const [accreditorToDelete, setAccreditorToDelete] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  const roleId = currentRoleId?.toString();
  const isRole7 = currentRoleId == 7;
  const isRole23 = currentRoleId == 23;

  // Helper functions
  const isPaymentCompleted = useCallback(() => {
    return paymentStatus?.paymentStatus === "paid";
  }, [paymentStatus]);

  const getCertificateLevelName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const level = certificateLevels.find((l) => l.id == id);
      return level?.name || "N/A";
    },
    [certificateLevels],
  );

  const getGenderName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const gender = genderList.find((g) => g.id == id);
      return gender?.name || "N/A";
    },
    [genderList],
  );

  const getQualificationName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const qualification = qualificationList.find((q) => q.id == id);
      return qualification?.name || "N/A";
    },
    [qualificationList],
  );

  const getSectorName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const sector = sectors.find((s) => String(s.id) === String(id));
      return sector?.sectorName || sector?.name || id;
    },
    [sectors],
  );

  const getOccupationName = useCallback(
    (id) => {
      if (!id) return "N/A";
      if (occupationMap[id]) return occupationMap[id];

      const occupation = occupations.find(
        (occ) => String(occ.id) === String(id),
      );
      if (occupation) {
        return (
          occupation.occupationName ||
          occupation.name ||
          occupation.title ||
          occupation.occupation_title ||
          occupation.occupation_name ||
          `Occupation ${id}`
        );
      }
      return `ID: ${id}`;
    },
    [occupations, occupationMap],
  );

  // Data fetching
  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(27);
      setCertificateLevels(response.data || []);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  };

  const fetchGenderList = async () => {
    try {
      const response = await CommonService.getByParentId(8);
      setGenderList(response.data || []);
    } catch (error) {
      console.error("Error fetching gender list:", error);
    }
  };

  const fetchQualificationList = async () => {
    try {
      const response = await CommonService.getByParentId(18);
      setQualificationList(response.data || []);
    } catch (error) {
      console.error("Error fetching qualification list:", error);
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      setSectors(response.data || []);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchOccupations = async () => {
    try {
      const response = await CommonService.getAllOccupations();
      setOccupations(response.data || []);
    } catch (error) {
      console.error("Error fetching occupations:", error);
      setOccupations([]);
    }
  };

  const fetchQualityStandards = async () => {
    try {
      const response = await CommonService.getAllQualitystandards(26);
      if (response.data?.length) {
        const mainCategories = response.data.filter(
          (item) => item.parentId === 0,
        );
        const subCategories = response.data.filter(
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
    } catch (error) {
      console.error("Error fetching quality standards:", error);
    }
  };

  const fetchCurriculum = async (curriculumId) => {
    try {
      const response = await CurriculumIndexService.getCurriculumById(
        curriculumId,
        access_token,
      );
      const curriculumData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setCurriculumTypes(curriculumData);
    } catch (error) {
      console.error("Error fetching curriculum:", error);
    }
  };

  const fetchInstituteData = async () => {
    try {
      if (!courseData?.registration_no) return;
      const response = await InstituteRegistrationService.getInstituteDetails(
        courseData.registration_no,
      );
      const data =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;
      setInstituteData(data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);
      setPaymentStatus(response.data);
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setPaymentStatus(null);
    }
  };

  const fetchRecUsers = async () => {
    try {
      const response =
        await UserRoleManagementService.getActiveRecUsers(access_token);
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
      console.error("Error fetching REC users:", error);
      toast.error("Failed to load REC members");
    }
  };

  const fetchAccreditorUsers = async () => {
    try {
      const response =
        await UserRoleManagementService.getActiveAccreditorUsers(access_token);
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

  const fetchCourseDetails = async () => {
    try {
      const response =
        await ApplyAccreditedCourseService.getAccreditedCourseByApplicationNo(
          applicationNo,
          access_token,
        );
      let data =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;

      setCourseData(data);
      setCurrentStatusId(Number(data.status_id));

      // Parse documents
      if (data.documents) {
        try {
          const parsedDocs =
            typeof data.documents === "string"
              ? JSON.parse(data.documents)
              : data.documents;
          if (Array.isArray(parsedDocs)) {
            const formattedDocs = parsedDocs.map((doc) => ({
              name: doc.documentName || doc.name || "Document",
              url: doc.url || "",
              id: doc.id,
              filePath: doc.url,
            }));
            setDocuments(formattedDocs);
          }
        } catch (e) {
          console.error("Error parsing documents:", e);
          setDocuments([]);
        }
      }

      if (data.quality_standard_responses) {
        setRawQualityStandards(data.quality_standard_responses);
      }
      if (data.assigned_recs) setAssignedRecs(data.assigned_recs);
      if (data.assigned_accreditors)
        setAssignedAccreditors(data.assigned_accreditors);
    } catch (error) {
      console.error("Error fetching course details:", error);
      throw error;
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourseDetails(),
        fetchSectors(),
        fetchOccupations(),
        fetchQualityStandards(),
        fetchGenderList(),
        fetchQualificationList(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  // Parse quality standards
  const parseQualityStandardsWithData = useCallback(
    (qualityStr, qualityDataRef) => {
      try {
        if (!qualityStr) return { responses: {}, remarks: {} };

        const data =
          typeof qualityStr === "string" ? JSON.parse(qualityStr) : qualityStr;
        const responseMap = {};
        const remarksMap = {};

        data.forEach((item) => {
          const subQuestionId = item.standardId?.toString();
          const responseValue = item.responseId;
          const remarkValue = item.remarks || "";

          let categoryId = null;
          for (const category of qualityDataRef) {
            if (category.rows.some((row) => row.id === subQuestionId)) {
              categoryId = category.id;
              break;
            }
          }

          if (categoryId && subQuestionId) {
            if (!responseMap[categoryId]) responseMap[categoryId] = {};
            if (!remarksMap[categoryId]) remarksMap[categoryId] = {};
            responseMap[categoryId][subQuestionId] = responseValue;
            remarksMap[categoryId][subQuestionId] = remarkValue;
          }
        });

        return { responses: responseMap, remarks: remarksMap };
      } catch (error) {
        console.error("Error parsing quality standards:", error);
        return { responses: {}, remarks: {} };
      }
    },
    [],
  );

  // Build occupation map
  useEffect(() => {
    if (occupations.length > 0) {
      const map = {};
      occupations.forEach((occ) => {
        const name =
          occ.occupationName ||
          occ.name ||
          occ.title ||
          occ.occupation_title ||
          occ.occupation_name ||
          occ.occupation;
        map[occ.id] = name || `Occupation ${occ.id}`;
      });
      setOccupationMap(map);
    }
  }, [occupations]);

  // Effects
  useEffect(() => {
    if (applicationNo) {
      fetchAllData();
      if (isRole7) {
        fetchRecUsers();
        fetchAccreditorUsers();
      }
    }
    fetchPaymentStatus();
    fetchCertificateLevels();
  }, [applicationNo]);

  useEffect(() => {
    if (courseData?.curriculum_id) {
      fetchCurriculum(courseData.curriculum_id);
    }
  }, [courseData]);

  useEffect(() => {
    if (courseData?.registration_no) {
      fetchInstituteData();
    }
  }, [courseData]);

  useEffect(() => {
    if (qualityData.length > 0 && rawQualityStandards) {
      const { responses, remarks } = parseQualityStandardsWithData(
        rawQualityStandards,
        qualityData,
      );
      setQualityResponses(responses);
      setQualityRemarks(remarks);
    }
  }, [qualityData, rawQualityStandards, parseQualityStandardsWithData]);

  // Quality handlers
  const handleQualityResponseChange = (categoryId, subQuestionId, value) => {
    if (isRole23) return;

    setQualityResponses((prev) => {
      const newResponses = { ...prev };
      if (!newResponses[categoryId]) newResponses[categoryId] = {};

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
    if (isRole23) return;
    setQualityRemarks((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [subQuestionId]: value },
    }));
  };

  const prepareQualityStandardsForBackend = () => {
    const qualityStandardsData = [];
    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((subQuestionId) => {
        const responseId = qualityResponses[categoryId][subQuestionId];
        const remark = qualityRemarks[categoryId]?.[subQuestionId] || "";
        if (responseId) {
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
    if (isRole23) {
      toast.warning("REC members are read-only for your role");
      return;
    }
    if (!selectedRec) {
      toast.error("Please select a REC member to add");
      return;
    }
    if (
      assignedRecs.some((rec) => rec.id.toString() === selectedRec.toString())
    ) {
      toast.error("This REC member is already assigned");
      return;
    }

    const selectedRecDetails = recList.find(
      (rec) => rec.id.toString() === selectedRec.toString(),
    );
    if (!selectedRecDetails) {
      toast.error("Selected REC member not found");
      return;
    }

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
    if (isRole23) {
      toast.warning("Accreditors are read-only for your role");
      return;
    }
    if (!selectedAccreditor) {
      toast.error("Please select an Accreditor to add");
      return;
    }
    if (
      assignedAccreditors.some(
        (acc) => acc.id.toString() === selectedAccreditor.toString(),
      )
    ) {
      toast.error("This Accreditor is already assigned");
      return;
    }

    const selectedAccreditorDetails = accreditorList.find(
      (acc) => acc.id.toString() === selectedAccreditor.toString(),
    );
    if (!selectedAccreditorDetails) {
      toast.error("Selected Accreditor not found");
      return;
    }

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

  // Action handlers
  const openActionDialog = (statusId) => {
    if (isRole23 && statusId !== 59) {
      toast.warning("Only Endorse action is available for your role");
      return;
    }
    setSelectedStatusId(statusId);
    setRemarks("");
    setRemarksError("");
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setSelectedStatusId(null);
    setRemarks("");
    setRemarksError("");
  };

  const validateAssignments = (statusId) => {
    const currentStatus = Number(currentStatusId);
    if (currentStatus === 115) return true;
    if (statusId === 127 || statusId === 58 || statusId === 60) {
      // Skip REC validation
    } else if (isRole7 && assignedRecs.length === 0) {
      toast.error("Please assign at least one REC member before proceeding");
      return false;
    }
    if (isRole7 && assignedAccreditors.length === 0) {
      toast.error("Please assign at least one Accreditor before proceeding");
      return false;
    }
    return true;
  };

  const handleAction = async () => {
    if (
      (selectedStatusId === 58 || selectedStatusId === 60) &&
      !remarks.trim()
    ) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    if (!validateAssignments(selectedStatusId)) return;

    setActionLoading(true);
    try {
      const qualityStandardsData = prepareQualityStandardsForBackend();
      const assignedRecsPayload = assignedRecs.map((rec) => ({
        userId: rec.userId,
      }));
      const assignedAccreditorsPayload = assignedAccreditors.map((acc) => ({
        userId: acc.userId,
      }));
      const serviceId =
        selectedStatusId === 127 || selectedStatusId === 126 ? 54 : 26;

      const payload = {
        applicationNo,
        statusId: selectedStatusId,
        serviceId,
        assignedRoleId: currentRoleId,
        remarks: remarks || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
        qualityStandards: qualityStandardsData,
        assignedRecs: assignedRecsPayload,
        assignedAccreditors: assignedAccreditorsPayload,
      };

      const response =
        await ApplyAccreditedCourseService.verifyAccreditedCourse(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        const messages = {
          56: "Course verified successfully",
          62: "Course verified successfully",
          59: "Course endorsed successfully",
          126: "Course renewed successfully",
          57: "Course approved successfully",
          58: "Course rejected successfully",
          127: "Forwarded to Level 2 successfully",
        };
        toast.success(
          messages[selectedStatusId] || "Action completed successfully",
        );
        closeDialog();
        await fetchCourseDetails();
        setNewDocuments([]);
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(error.response?.data?.message || "Failed to process course");
    } finally {
      setActionLoading(false);
    }
  };

  // Dialog content helpers
  const getDialogTitle = () => {
    const titles = {
      56: "Verify Course Application",
      62: "Verify Course Application",
      59: "Endorse Course Application",
      57: "Approve Course Application",
      58: "Reject Course Application",
      126: "Renew Course Application",
      127: "Forward to Level 2",
    };
    return titles[selectedStatusId] || "Confirm Action";
  };

  const getDialogContent = () => {
    if (selectedStatusId === 58 || selectedStatusId === 60) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this accredited course
            application:
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>
              Occupation: {getOccupationName(courseData?.occupation_id)}
            </strong>
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
    }

    const actionTexts = {
      56: "verify",
      62: "verify",
      59: "endorse",
      126: "renew",
      127: "forward",
      57: "approve",
    };
    const actionText = actionTexts[selectedStatusId] || "process";

    return (
      <DialogContentText>
        Are you sure you want to {actionText} this accredited course
        application?
        <br />
        <strong>Application No: {applicationNo}</strong>
        <br />
        <strong>
          Occupation: {getOccupationName(courseData?.occupation_id)}
        </strong>
      </DialogContentText>
    );
  };

  const getConfirmButtonColor = () => {
    const colors = {
      56: "success",
      57: "success",
      62: "success",
      58: "error",
      59: "primary",
      60: "warning",
      126: "primary",
      127: "primary",
    };
    return colors[selectedStatusId] || "primary";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    const texts = {
      56: "Confirm Verify",
      62: "Confirm Verify",
      59: "Confirm Endorse",
      57: "Confirm Approve",
      58: "Confirm Reject",
      60: "Confirm Reject",
      126: "Confirm Renew",
      127: "Confirm Forward",
    };
    return texts[selectedStatusId] || "Confirm";
  };

  // Generate PA Number
  const handleGeneratePANumber = () => {
    if (!courseData) {
      toast.error("Course data not found");
      return;
    }

    const institute =
      Array.isArray(instituteData) && instituteData.length > 0
        ? instituteData[0]
        : instituteData;

    const taxPayerEmail = institute?.email_id || "N/A";
    const taxPayerMobileNo = institute?.mobile_no || "N/A";
    const instituteId = institute?.institute_id || "N/A";
    const taxPayerNo = courseData.registration_no || "N/A";
    const taxPayerName = courseData.proposed_institute_name || "N/A";

    navigate(
      `/birms/common-payment-index/${applicationNo}/${SERVICE_CODE}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  };

  const handleRedirectToPayment = (redirectUrl) => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      toast.error("No redirect URL available");
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  // Render quality checklist
  const renderChecklist = useCallback(
    (standard) => (
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
                  const selectedValue = qualityResponses[standard.id]?.[row.id];
                  const isYes = selectedValue === "Y";
                  const isNo = selectedValue === "N";
                  const remark = qualityRemarks[standard.id]?.[row.id] || "";

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={isYes}
                          onChange={() =>
                            handleQualityResponseChange(
                              standard.id,
                              row.id,
                              "Y",
                            )
                          }
                          disabled={isRole23}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={isNo}
                          onChange={() =>
                            handleQualityResponseChange(
                              standard.id,
                              row.id,
                              "N",
                            )
                          }
                          disabled={isRole23}
                        />
                      </TableCell>
                      <TableCell>
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
                          disabled={isRole23}
                          multiline
                          rows={2}
                          slotProps={{ input: { sx: { fontSize: "0.75rem" } } }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    ),
    [qualityResponses, qualityRemarks, isRole23],
  );

  // Tabs configuration
  const tabs = useMemo(() => {
    const baseTabs = [
      { icon: <BusinessIcon />, label: "Programme Information" },
      { icon: <VerifiedIcon />, label: "Quality Standards" },
      { icon: <FileOpenIcon />, label: "Supporting Documents" },
    ];

    const shouldHideAssignTabs =
      Number(currentStatusId) === 115 || Number(currentStatusId) === 127;

    if (isRole7) {
      baseTabs.push({
        icon: <SettingsSuggestIcon />,
        label: "Generate PA Number",
      });
      if (!shouldHideAssignTabs) {
        baseTabs.push({ icon: <GroupAddIcon />, label: "Add Accreditors" });
        baseTabs.push({ icon: <EngineeringIcon />, label: "Assign REC" });
      }
    }

    return baseTabs;
  }, [currentStatusId, isRole7]);

  const getTabIndices = () => {
    let paNumberIndex = -1;
    let accreditorIndex = -1;
    let recIndex = -1;
    tabs.forEach((tab, index) => {
      if (tab.label === "Generate PA Number") paNumberIndex = index;
      if (tab.label === "Add Accreditors") accreditorIndex = index;
      if (tab.label === "Assign REC") recIndex = index;
    });
    return { paNumberIndex, accreditorIndex, recIndex };
  };

  const { paNumberIndex, accreditorIndex, recIndex } = getTabIndices();

  const handleNextTab = () => {
    if (tabValue < tabs.length - 1) setTabValue(tabValue + 1);
  };

  const handlePreviousTab = () => {
    if (tabValue > 0) setTabValue(tabValue - 1);
  };

  // Loading state
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

  // Error state
  if (!courseData) {
    return (
      <Box sx={{ m: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            BQF Programme Details
          </Typography>
          <Alert severity="error">
            BQF Programme with Application No:{" "}
            <strong>{applicationNo}</strong> not found
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          BQF Programme Details
        </Typography>
        <Divider />

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} icon={tab.icon} label={tab.label} />
          ))}
        </Tabs>

        {/* Tab 0: Programme Information */}
        {tabValue === 0 && (
          <>
            <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
              <Typography fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Registration No"
                    value={courseData.registration_no || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Institute Name"
                    value={courseData.proposed_institute_name || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Curriculum Title"
                    value={curriculumTypes?.curriculumTitle || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Certificate Level"
                    value={getCertificateLevelName(
                      curriculumTypes?.certificateLevelId,
                    )}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sector"
                    value={getSectorName(courseData.sector_id)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Occupation"
                    value={getOccupationName(courseData.occupation_id)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Programme Title"
                    value={courseData.programme_title || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fees per trainee (Nu.)"
                    value={courseData.fees_per_trainee || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Enrollment capacity per batch"
                    value={courseData.enrolment_capacity || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Total Program Duration (Hours)"
                    value={curriculumTypes?.totalProgramDuration || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Theory Duration (Hours)"
                    value={curriculumTypes?.totalTheoryDuration || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Practical Duration (Hours)"
                    value={curriculumTypes?.totalPracticalDuration || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="OJT Duration (Hours)"
                    value={curriculumTypes?.totalOjtDuration || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              sx={{ p: 3, mb: 2, border: "1px solid", borderColor: "divider" }}
            >
              <Typography fontWeight={600} gutterBottom>
                Lead Trainer Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Lead Trainer CID No."
                    value={courseData.lead_trainer_cid_no || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Lead Trainer Name"
                    value={courseData.lead_trainer_name || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Gender"
                    value={getGenderName(courseData.gender_id)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Academic Qualification"
                    value={getQualificationName(courseData.qualification_id)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Professional Experience"
                    value={courseData.professional_experience || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </>
        )}

        {/* Tab 1: Quality Standards */}
        {tabValue === 1 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              {qualityData.length > 0 ? (
                qualityData.map(renderChecklist)
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

        {/* Tab 2: Supporting Documents */}
        {tabValue === 2 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                <FileDownload
                  initialFiles={documents}
                  onFileUpload={handleFileUpload}
                  allowUpload={!isRole23}
                />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Generate PA Number Tab */}
        {isRole7 && tabValue === paNumberIndex && (
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
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
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

        {/* Add Accreditors Tab */}
        {isRole7 && tabValue === accreditorIndex && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <GroupAddIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={600}>
                    Add Accreditors
                  </Typography>
                </Box>

                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Add Accreditor Members
                    </Typography>

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
                            <Tooltip
                              key={acc.id}
                              title={
                                isRole23
                                  ? "Accreditor Can Readonly"
                                  : "Click to remove"
                              }
                              arrow
                            >
                              <span>
                                <Chip
                                  label={`${acc.name} (${acc.userId})`}
                                  color="success"
                                  onDelete={
                                    isRole23
                                      ? undefined
                                      : () => {
                                          setAccreditorToDelete(acc);
                                          setDeleteDialogOpen(true);
                                        }
                                  }
                                  deleteIcon={
                                    isRole23 ? undefined : (
                                      <DeleteIcon sx={{ color: "#d32f2f" }} />
                                    )
                                  }
                                  sx={{
                                    mb: 1,
                                    "& .MuiChip-deleteIcon": {
                                      color: "#d32f2f",
                                      "&:hover": { color: "#b71c1c" },
                                    },
                                    ...(isRole23 && {
                                      cursor: "default",
                                      "& .MuiChip-deleteIcon": {
                                        display: "none",
                                      },
                                    }),
                                  }}
                                />
                              </span>
                            </Tooltip>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={accreditorList.filter(
                            (acc) =>
                              !assignedAccreditors.some((a) => a.id === acc.id),
                          )}
                          getOptionLabel={(option) =>
                            `${option.name} (${option.userId})`
                          }
                          value={
                            accreditorList.find(
                              (acc) =>
                                acc.id.toString() ===
                                selectedAccreditor?.toString(),
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            if (isRole23) {
                              toast.warning(
                                "Accreditors are read-only for your role",
                              );
                              return;
                            }
                            setSelectedAccreditor(newValue ? newValue.id : "");
                          }}
                          filterOptions={(options, state) => {
                            const searchTerm = state.inputValue
                              .toLowerCase()
                              .trim();
                            if (!searchTerm || searchTerm.length < 2) return [];
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
                          disabled={accreditorList.length === 0 || isRole23}
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
                            accreditorList.length === 0 ||
                            isRole23
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

                    {assignedAccreditors.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No Accreditors have been assigned yet. Use the search
                        above to add Accreditor members.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Assign REC Tab */}
        {isRole7 && tabValue === recIndex && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <EngineeringIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={600}>
                    Assign Regulatory and Evaluation Committee (REC)
                  </Typography>
                </Box>

                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Add REC Members
                    </Typography>

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
                            <Tooltip
                              key={rec.id}
                              title={
                                isRole23
                                  ? "REC Member Can Readonly"
                                  : "Click to remove"
                              }
                              arrow
                            >
                              <span>
                                <Chip
                                  label={`${rec.name} (${rec.userId})`}
                                  color="success"
                                  onDelete={
                                    isRole23
                                      ? undefined
                                      : () => {
                                          setRecToDelete(rec);
                                          setDeleteDialogOpen(true);
                                        }
                                  }
                                  deleteIcon={
                                    isRole23 ? undefined : (
                                      <DeleteIcon sx={{ color: "#d32f2f" }} />
                                    )
                                  }
                                  sx={{
                                    mb: 1,
                                    "& .MuiChip-deleteIcon": {
                                      color: "#d32f2f",
                                      "&:hover": { color: "#b71c1c" },
                                    },
                                    ...(isRole23 && {
                                      cursor: "default",
                                      "& .MuiChip-deleteIcon": {
                                        display: "none",
                                      },
                                    }),
                                  }}
                                />
                              </span>
                            </Tooltip>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={recList.filter(
                            (rec) => !assignedRecs.some((a) => a.id === rec.id),
                          )}
                          getOptionLabel={(option) =>
                            `${option.name} (${option.userId})`
                          }
                          value={
                            recList.find(
                              (rec) =>
                                rec.id.toString() === selectedRec?.toString(),
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            if (isRole23) {
                              toast.warning(
                                "REC members are read-only for your role",
                              );
                              return;
                            }
                            setSelectedRec(newValue ? newValue.id : "");
                          }}
                          filterOptions={(options, state) => {
                            const searchTerm = state.inputValue
                              .toLowerCase()
                              .trim();
                            if (!searchTerm || searchTerm.length < 2) return [];
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
                          disabled={recList.length === 0 || isRole23}
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
                          disabled={
                            !selectedRec || recList.length === 0 || isRole23
                          }
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

                    {assignedRecs.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No REC members have been assigned yet. Use the search
                        above to add REC members.
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
          {tabValue > 0 && (
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

          {tabValue < tabs.length - 1 && (
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

          {tabValue === tabs.length - 1 && (
            <>
              {roleId === "7" && (
                <>
                  {[115, 127].includes(Number(currentStatusId)) ? (
                    <Tooltip
                      title={
                        !isPaymentCompleted()
                          ? "Payment must be completed before forwarding to Level 2"
                          : "Forward this application to Level 2"
                      }
                      arrow
                    >
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<SkipNextIcon />}
                          onClick={() => openActionDialog(127)}
                          disabled={!isPaymentCompleted()}
                          sx={{
                            px: 3,
                            py: 0.5,
                            fontWeight: 600,
                            textTransform: "none",
                          }}
                        >
                          Forwarded LEVEL 2
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip
                        title={
                          !isPaymentCompleted()
                            ? "Payment must be completed before verification"
                            : "Verify this accredited course application"
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
                            disabled={!isPaymentCompleted()}
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
                </>
              )}

              {roleId === "10" && (
                <>
                  <Tooltip
                    title={
                      !isPaymentCompleted()
                        ? "Payment must be completed before verification"
                        : "Verify this accredited course application"
                    }
                    arrow
                  >
                    <span>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => openActionDialog(62)}
                        disabled={!isPaymentCompleted()}
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
                <Tooltip
                  title={
                    !isPaymentCompleted()
                      ? "Payment must be completed before endorsement"
                      : "Endorse this accredited course application"
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<VerifiedIcon />}
                      onClick={() => openActionDialog(59)}
                      disabled={!isPaymentCompleted()}
                      sx={{
                        px: 3,
                        py: 0.5,
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      Endorse
                    </Button>
                  </span>
                </Tooltip>
              )}

              {roleId === "22" && (
                <>
                  {Number(currentStatusId) === 127 ? (
                    <Tooltip
                      title={
                        !isPaymentCompleted()
                          ? "Payment must be completed before renewal"
                          : "Renew this accredited course application"
                      }
                      arrow
                    >
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<VerifiedIcon />}
                          onClick={() => openActionDialog(126)}
                          disabled={!isPaymentCompleted()}
                          sx={{
                            px: 3,
                            py: 0.5,
                            fontWeight: 600,
                            textTransform: "none",
                          }}
                        >
                          Renew
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        !isPaymentCompleted()
                          ? "Payment must be completed before approval"
                          : "Approve this accredited course application"
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
                          disabled={!isPaymentCompleted()}
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
              ((selectedStatusId === 58 || selectedStatusId === 60) &&
                !remarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewAccreditedCourseRegistration;
