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
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Alert,
  Stack,
  InputLabel,
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
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";
import CommonService from "../../../api/services/internal/common/CommonService";
import UserRoleManagementService from "../../../api/services/internal/userrole/UserRoleManagementService";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";

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
  const [instituteData, setInstituteData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [courseData, setCourseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  // Master data states
  const [sectors, setSectors] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [qualityData, setQualityData] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
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

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  const roleId = currentRoleId?.toString();

  // Check if currentRoleId is 7 for REC tab
  const showRecTab = currentRoleId == 7;
  const showAccreditorTab = currentRoleId == 7;

  useEffect(() => {
    if (applicationNo) {
      fetchAllData();
      if (showRecTab) {
        fetchRecUsers();
      }
      if (showAccreditorTab) {
        fetchAccreditorUsers();
      }
    }
    fetchPaymentStatus();
  }, [applicationNo]);

  // Fetch institute data when courseData is available
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
  }, [qualityData, rawQualityStandards]);

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

  const fetchInstituteData = async () => {
    try {
      if (!courseData?.registration_no) {
        console.log("No registration number available yet");
        return;
      }
      const response = await InstituteRegistrationService.getInstituteDetails(
        courseData.registration_no,
      );
      // Check if response.data is an array and get the first element
      const data =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;
      setInstituteData(data);
      console.log("Institute data fetched:", data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
      setInstituteData(null);
    }
  };

  const fetchRecUsers = async () => {
    try {
      console.log("Fetching REC users...");
      const response =
        await UserRoleManagementService.getActiveRecUsers(access_token);
      console.log("REC users response:", response.data);

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
      console.log("Mapped REC list:", mappedRecList);
    } catch (error) {
      console.error("Error fetching rec user:", error);
      toast.error("Failed to load REC members");
    }
  };

  const fetchAccreditorUsers = async () => {
    try {
      console.log("Fetching Accreditor users...");
      const response =
        await UserRoleManagementService.getActiveAccreditorUsers(access_token);
      console.log("Accreditor users response:", response.data);

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
      console.log("Mapped Accreditor list:", mappedAccreditorList);
    } catch (error) {
      console.error("Error fetching accreditor users:", error);
      toast.error("Failed to load Accreditor members");
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
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  const fetchQualityStandards = async () => {
    try {
      const response = await CommonService.getAllQualitystandards(26);
      if (response.data && response.data.length > 0) {
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

  const parseQualityStandardsWithData = (qualityStr, qualityDataRef) => {
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
        }
      });

      return { responses: responseMap, remarks: remarksMap };
    } catch (error) {
      console.error("Error parsing quality standards:", error);
      return { responses: {}, remarks: {} };
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      setSectors(response.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchOccupations = async () => {
    try {
      const response = await CommonService.getAllOccupations();
      setOccupations(response.data);
    } catch (error) {
      console.error("Error fetching occupations:", error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const response =
        await ApplyAccreditedCourseService.getAccreditedCourseByApplicationNo(
          applicationNo,
          access_token,
        );

      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setCourseData(data);

      // Parse documents JSON
      if (data.documents) {
        try {
          let parsedDocs =
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

      // Store raw quality standards
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
    } catch (error) {
      console.error("Error fetching course details:", error);
      throw error;
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const getSectorName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const sector = sectors.find((s) => String(s.id) === String(id));
      return sector ? sector.sectorName || sector.name : id;
    },
    [sectors],
  );

  const getCourseName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const occupation = occupations.find(
        (occ) => String(occ.id) === String(id),
      );
      return occupation
        ? occupation.occupationName || occupation.title || occupation.name
        : id;
    },
    [occupations],
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
    // Skip REC validation when rejecting (statusId === 58 or 60)
    if (statusId !== 58 && statusId !== 60) {
      if (showRecTab && assignedRecs.length === 0) {
        toast.error("Please assign at least one REC member before proceeding");
        return false;
      }
    }

    // Always validate Accreditor if tab is shown (including rejection)
    if (showAccreditorTab && assignedAccreditors.length === 0) {
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

    // Validate assignments before proceeding
    if (!validateAssignments(selectedStatusId)) {
      return;
    }

    setActionLoading(true);
    try {
      const qualityStandardsData = prepareQualityStandardsForBackend();

      // Prepare payloads
      const assignedRecsPayload = assignedRecs.map((rec) => ({
        userId: rec.userId,
      }));

      const assignedAccreditorsPayload = assignedAccreditors.map((acc) => ({
        userId: acc.userId,
      }));

      const payload = {
        applicationNo: applicationNo,
        statusId: selectedStatusId,
        serviceId: 26,
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
        let successMessage;
        switch (selectedStatusId) {
          case 56:
            successMessage = "Course verified successfully";
            break;
          case 62:
            successMessage = "Course verified successfully";
            break;
          case 59:
            successMessage = "Course endorsed successfully";
            break;
          case 57:
            successMessage = "Course approved successfully";
            break;
          case 58:
            successMessage = "Course rejected successfully";
            break;
          case 60:
            successMessage = "Forwarded back to QAS Level 1 successfully";
            break;
          default:
            successMessage = "Action completed successfully";
        }

        closeDialog();
        await fetchCourseDetails();
        setNewDocuments([]);
        toast.success(successMessage);
        navigate("/tasklist/task-details-index");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(error.response?.data?.message || "Failed to process course");
    } finally {
      setActionLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (selectedStatusId) {
      case 56:
        return "Verify Course Application";
      case 62:
        return "Verify Course Application";
      case 59:
        return "Endorse Course Application";
      case 57:
        return "Approve Course Application";
      case 58:
        return "Reject Course Application";
      case 60:
        return "Forward Back to QAS Level 1";
      default:
        return "Confirm Action";
    }
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
              Course Title: {getCourseName(courseData?.course_id)}
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
    } else {
      const actionText =
        selectedStatusId === 56 || selectedStatusId === 62
          ? "verify"
          : selectedStatusId === 59
            ? "endorse"
            : "approve";

      return (
        <DialogContentText>
          Are you sure you want to {actionText} this accredited course
          application?
          <br />
          <strong>Application No: {applicationNo}</strong>
          <br />
          <strong>Course Title: {getCourseName(courseData?.course_id)}</strong>
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
      case 60:
        return "warning";
      default:
        return "primary";
    }
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    switch (selectedStatusId) {
      case 56:
        return "Confirm Verify";
      case 62:
        return "Confirm Verify";
      case 59:
        return "Confirm Endorse";
      case 57:
        return "Confirm Approve";
      case 58:
      case 60:
        return "Confirm Reject";
      default:
        return "Confirm";
    }
  };

  // Generate PA Number handler
  const handleGeneratePANumber = () => {
    if (!courseData) {
      toast.error("Course data not found");
      return;
    }

    // Get institute data (handle both array and object)
    const institute =
      Array.isArray(instituteData) && instituteData.length > 0
        ? instituteData[0]
        : instituteData;

    // Get mobile and email from institute data
    const taxPayerEmail = institute?.email_id || "N/A";
    const taxPayerMobileNo = institute?.mobile_no || "N/A";
    const instituteId = institute?.institute_id || "N/A";
    // Prepare the data for BIRMS payment
    const applicationNo = courseData.application_no;
    const serviceCode = 100578;
    const taxPayerNo = courseData.registration_no || "N/A";
    const taxPayerName = courseData.proposed_institute_name || "N/A";
    // Navigate to BIRMS payment page
    navigate(
      `/birms/common-payment-index/${applicationNo}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId} `,
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
                        </TableCell>
                        <TableCell align="center">
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
                            slotProps={{
                              input: {
                                sx: { fontSize: "0.75rem" },
                              },
                            }}
                            multiline
                            rows={2}
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
      );
    },
    [qualityResponses, qualityRemarks],
  );

  const getTabs = () => {
    const baseTabs = [
      { icon: <BusinessIcon />, label: "Course Information" },
      { icon: <VerifiedIcon />, label: "Quality Standards" },
      { icon: <FileOpenIcon />, label: "Supporting Documents" },
    ];

    // Add Accreditor tab if currentRoleId is 7
    if (showAccreditorTab) {
      baseTabs.push({
        icon: <GroupAddIcon />,
        label: "Add Accreditors",
      });
    }

    // Add REC tab if currentRoleId is 7
    if (showRecTab) {
      baseTabs.push({ icon: <EngineeringIcon />, label: "Assign REC" });
    }

    // Add Generate PA Number tab for role 22
    if (currentRoleId == 22) {
      baseTabs.push({
        icon: <SettingsSuggestIcon />,
        label: "Generate PA Number",
      });
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

  if (!courseData) {
    return (
      <Box sx={{ m: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            Accredited Course Details
          </Typography>
          <Alert severity="error">
            Accredited Course with Application No:{" "}
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
          Accredited Course Details
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

        {/* Tab 0: Course Information */}
        {tabValue === 0 && (
          <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
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
                  label="Curriculum Type"
                  value={courseData.curriculum_name || "N/A"}
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
                  label="Course"
                  value={getCourseName(courseData.course_id)}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Course Fee (RM)"
                  value={courseData.course_fee || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Application No"
                  value={courseData.application_no || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          </Paper>
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
                  allowUpload={true}
                />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Add Accreditors Tab */}
        {showAccreditorTab && tabValue === accreditorIndex && (
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
                                  "&:hover": { color: "#b71c1c" },
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
                            <Typography variant="body2">
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
                            <Typography variant="body2">
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
                            <Typography variant="body2">
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
                            <Typography variant="body2">
                              {selectedAccreditorDetails.mobileNo || "N/A"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {assignedAccreditors.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No Accreditors have been assigned yet. Use the search
                        above to add Accreditor members.
                      </Alert>
                    )}

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

        {/* Assign REC Tab */}
        {showRecTab && tabValue === recIndex && (
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
                                  "&:hover": { color: "#b71c1c" },
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
                            <Typography variant="body2">
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
                            <Typography variant="body2">
                              {selectedRecDetails.userId}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Email
                            </Typography>
                            <Typography variant="body2">
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
                            <Typography variant="body2">
                              {selectedRecDetails.mobileNo || "N/A"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {assignedRecs.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No REC members have been assigned yet. Use the search
                        above to add REC members.
                      </Alert>
                    )}

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

        {/* Generate PA Number Tab - Only for role 22 */}
        {currentRoleId == 22 && tabValue === paNumberIndex && (
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
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openActionDialog(56)}
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
                      disabled={!paymentStatus}
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
