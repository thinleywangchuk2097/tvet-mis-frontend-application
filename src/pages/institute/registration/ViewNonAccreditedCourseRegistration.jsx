// ViewApplyNonAccreditedCourse.jsx
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
  Alert,
  Chip,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ApplyNonAccreditedCourseService from "../../../api/services/internal/course/ApplyNonAccreditedCourseService";
import CommonService from "../../../api/services/internal/common/CommonService";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";

// ==================== CONSTANTS ====================
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

const SERVICE_CODE = 100574;
const QUALITY_SERVICE_ID = 13;
const STATUS = {
  VERIFY_QAS1: 56,
  APPROVE_DG: 57,
  REJECT: 58,
  ENDORSE_REC: 59,
  REJECT_QAS2: 60,
  VERIFY_QAS2: 62,
};

// ==================== UTILITY FUNCTIONS ====================
const parseDocuments = (docsData) => {
  if (!docsData) return [];
  if (Array.isArray(docsData)) {
    return docsData.map((doc) => ({
      name: doc.documentName || doc.name || "Document",
      url: doc.url || "",
      id: doc.id,
      filePath: doc.url,
    }));
  }
  if (typeof docsData === "string") {
    try {
      const parsed = JSON.parse(docsData);
      if (Array.isArray(parsed)) {
        return parsed.map((doc) => ({
          name: doc.documentName || "Document",
          url: doc.url || "",
          id: doc.id,
          filePath: doc.url,
        }));
      }
    } catch (e) {
      console.error("Error parsing documents:", e);
    }
  }
  return [];
};

const structureQualityData = (data) => {
  if (!data || data.length === 0) return [];
  const mainCategories = data.filter((item) => item.parentId === 0);
  const subCategories = data.filter((item) => item.parentId !== 0);
  return mainCategories.map((category) => ({
    id: category.id.toString(),
    title: category.dropdownName || category.description,
    rows: subCategories
      .filter((sub) => sub.parentId === category.id)
      .map((sub) => ({
        id: sub.id.toString(),
        value: sub.dropdownName || sub.description,
      })),
  }));
};

// ==================== CUSTOM HOOKS ====================
const useCourseData = (applicationNo, access_token) => {
  const [courseData, setCourseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [programmeTypes, setProgrammeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificateLevels = useCallback(async () => {
    try {
      const response = await CommonService.getByParentId(10);
      setCertificateLevels(response.data || []);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  }, []);

  const fetchProgrammeTypes = useCallback(async () => {
    try {
      const response = await CommonService.getByParentId(32);
      setProgrammeTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching programme types:", error);
    }
  }, []);

  const fetchCourseDetails = useCallback(async () => {
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedCourseByApplicationNo(
          applicationNo,
          access_token,
        );
      console.log("Non-BQF Programme details response:", response.data);
      let data = response.data;
      if (Array.isArray(data) && data.length > 0) data = data[0];

      setCourseData(data);
      setDocuments(parseDocuments(data.documents));
      return data;
    } catch (error) {
      console.error("Error fetching course details:", error);
      throw error;
    }
  }, [applicationNo, access_token]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourseDetails(),
        fetchCertificateLevels(),
        fetchProgrammeTypes(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load course data");
    } finally {
      setLoading(false);
    }
  }, [fetchCourseDetails, fetchCertificateLevels, fetchProgrammeTypes]);

  const getCertificateLevelName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const level = certificateLevels.find((l) => String(l.id) === String(id));
      return level ? level.name || level.value || "N/A" : id;
    },
    [certificateLevels],
  );

  const getProgrammeTypeName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const type = programmeTypes.find((t) => String(t.id) === String(id));
      return type ? type.name || "N/A" : id;
    },
    [programmeTypes],
  );

  return {
    courseData,
    documents,
    certificateLevels,
    programmeTypes,
    loading,
    fetchAllData,
    fetchCourseDetails,
    getCertificateLevelName,
    getProgrammeTypeName,
    setDocuments,
  };
};

const useQualityStandards = (rawQualityData) => {
  const [qualityData, setQualityData] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [rawQualityStandards, setRawQualityStandards] = useState(null);

  const fetchQualityStandards = useCallback(async () => {
    try {
      const response =
        await CommonService.getAllQualitystandards(QUALITY_SERVICE_ID);
      const structured = structureQualityData(response.data || []);
      setQualityData(structured);
    } catch (error) {
      console.error("Error fetching quality standards:", error);
    }
  }, []);

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
            if (category.rows.find((row) => row.id === subQuestionId)) {
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

  const handleQualityResponseChange = useCallback(
    (categoryId, subQuestionId, value) => {
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
    },
    [],
  );

  const handleQualityRemarkChange = useCallback(
    (categoryId, subQuestionId, value) => {
      setQualityRemarks((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], [subQuestionId]: value },
      }));
    },
    [],
  );

  const prepareQualityStandardsForBackend = useCallback(() => {
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
  }, [qualityResponses, qualityRemarks]);

  const loadExistingResponses = useCallback(
    (rawData) => {
      if (rawData) {
        setRawQualityStandards(rawData);
        if (qualityData.length > 0) {
          const { responses, remarks } = parseQualityStandardsWithData(
            rawData,
            qualityData,
          );
          setQualityResponses(responses);
          setQualityRemarks(remarks);
        }
      }
    },
    [qualityData, parseQualityStandardsWithData],
  );

  return {
    qualityData,
    qualityResponses,
    qualityRemarks,
    rawQualityStandards,
    fetchQualityStandards,
    loadExistingResponses,
    handleQualityResponseChange,
    handleQualityRemarkChange,
    prepareQualityStandardsForBackend,
  };
};

const usePayment = (applicationNo) => {
  const [paymentStatus, setPaymentStatus] = useState(null);

  const fetchPaymentStatus = useCallback(async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);
      setPaymentStatus(response.data);
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setPaymentStatus(null);
    }
  }, [applicationNo]);

  const isPaymentPaid = useMemo(() => {
    return paymentStatus?.paymentStatus?.toLowerCase() === "paid";
  }, [paymentStatus]);

  return { paymentStatus, fetchPaymentStatus, isPaymentPaid };
};

const useActionDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const openDialog = (statusId) => {
    setSelectedStatusId(statusId);
    setRemarks("");
    setRemarksError("");
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelectedStatusId(null);
    setRemarks("");
    setRemarksError("");
    setActionLoading(false);
  };

  return {
    open,
    selectedStatusId,
    remarks,
    remarksError,
    actionLoading,
    setRemarks,
    setRemarksError,
    setActionLoading,
    openDialog,
    closeDialog,
  };
};

// ==================== REUSABLE COMPONENTS ====================
const SectionHeader = ({ title }) => (
  <Typography variant="subtitle2" fontWeight={600} mb={2}>
    {title}
  </Typography>
);

const ReadOnlyField = ({ label, value, gridProps = { xs: 12, md: 6 } }) => (
  <Grid item {...gridProps}>
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value || "N/A"}
      slotProps={{ input: { readOnly: true } }}
    />
  </Grid>
);

const ChecklistQuestion = ({
  row,
  index,
  categoryId,
  qualityResponses,
  qualityRemarks,
  onResponseChange,
  onRemarkChange,
}) => {
  const selectedValue = qualityResponses[categoryId]?.[row.id];
  const isYes = selectedValue === "Y";
  const isNo = selectedValue === "N";
  const remark = qualityRemarks[categoryId]?.[row.id] || "";

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
            onResponseChange(categoryId, row.id, newValue);
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
            onResponseChange(categoryId, row.id, newValue);
          }}
        />
      </TableCell>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter remarks"
          value={remark}
          onChange={(e) => onRemarkChange(categoryId, row.id, e.target.value)}
          slotProps={{ input: { sx: { fontSize: "0.75rem" } } }}
          multiline
          rows={2}
        />
      </TableCell>
    </TableRow>
  );
};

const ChecklistCategory = ({
  standard,
  qualityResponses,
  qualityRemarks,
  onResponseChange,
  onRemarkChange,
}) => (
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
          {standard.rows.map((row, index) => (
            <ChecklistQuestion
              key={row.id}
              row={row}
              index={index}
              categoryId={standard.id}
              qualityResponses={qualityResponses}
              qualityRemarks={qualityRemarks}
              onResponseChange={onResponseChange}
              onRemarkChange={onRemarkChange}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

const PaymentInfoCard = ({ paymentStatus, onGeneratePayment }) => {
  if (paymentStatus) {
    return (
      <Card variant="outlined" sx={{ p: 0 }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Grid container spacing={0.5}>
            {[
              {
                label: "Payment Advice No:",
                value: paymentStatus.paymentAdviceNo,
              },
              { label: "Ref No:", value: paymentStatus.refNo },
              { label: "Tax Payer:", value: paymentStatus.taxPayerName },
              {
                label: "Status:",
                value: paymentStatus.paymentStatus,
                chip: true,
                chipColor:
                  paymentStatus.paymentStatus === "paid"
                    ? "success"
                    : "warning",
              },
              { label: "Due Date:", value: paymentStatus.paymentDueDate },
              { label: "Platform:", value: paymentStatus.platform },
              {
                label: "Amount:",
                value: `Nu. ${paymentStatus.totalPayableAmount || "0.00"}`,
                highlight: true,
              },
              {
                label: "Payment Mode:",
                value: paymentStatus.paymentMode || "Not yet paid",
              },
            ].map((field, idx) => (
              <Grid item key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
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
                    sx={{ minWidth: field.chip ? 60 : 70 }}
                  >
                    {field.label}
                  </Typography>
                  {field.chip ? (
                    <Chip
                      label={field.value || "N/A"}
                      color={field.chipColor}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  ) : field.highlight ? (
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {field.value}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{ fontSize: "0.75rem" }}
                      noWrap
                    >
                      {field.value || "N/A"}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
          {paymentStatus.redirectUrl && (
            <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
                onClick={() => window.open(paymentStatus.redirectUrl, "_blank")}
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
              "& .MuiAlert-message": { fontSize: "0.7rem", py: 0.25 },
            }}
          >
            PA number already generated. Click above to proceed with payment.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" gutterBottom sx={{ fontSize: "0.8rem" }}>
          Click the button below to generate a PA number and proceed to payment.
        </Typography>
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SettingsSuggestIcon sx={{ fontSize: 18 }} />}
            onClick={onGeneratePayment}
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
            "& .MuiAlert-message": { fontSize: "0.7rem", py: 0.25 },
          }}
        >
          <strong>Note:</strong> This will create a payment request and redirect
          you to the payment portal.
        </Alert>
      </CardContent>
    </Card>
  );
};

// ==================== TAB NAVIGATION COMPONENT ====================
const TabNavigation = ({
  tabs,
  tabValue,
  setTabValue,
  roleId,
  isLastTab,
  isFirstTab,
  onPrevious,
  onNext,
  children,
  actionButtons,
}) => (
  <>
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
    {children}

    {/* Navigation and Action Buttons Container */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 3,
      }}
    >
      {/* Left side - Previous button */}
      <Box>
        {!isFirstTab && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<SkipPreviousIcon />}
            onClick={onPrevious}
            sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
          >
            Previous
          </Button>
        )}
      </Box>

      {/* Right side - Next button or Action buttons */}
      <Box sx={{ display: "flex", gap: 2 }}>
        {!isLastTab && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            endIcon={<SkipNextIcon />}
            onClick={onNext}
            sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
          >
            Next
          </Button>
        )}
        {isLastTab && actionButtons}
      </Box>
    </Box>
  </>
);

// ==================== MAIN COMPONENT ====================
const ViewApplyNonAccreditedCourse = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // Custom hooks
  const courseDataHook = useCourseData(applicationNo, access_token);
  const qualityHook = useQualityStandards();
  const paymentHook = usePayment(applicationNo);
  const dialogHook = useActionDialog();

  const [newDocuments, setNewDocuments] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const roleId = currentRoleId?.toString();

  // Fetch all data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await courseDataHook.fetchAllData();
        await qualityHook.fetchQualityStandards();
        await paymentHook.fetchPaymentStatus();

        // Load existing quality responses if available
        if (courseDataHook.courseData?.quality_standard_responses) {
          qualityHook.loadExistingResponses(
            courseDataHook.courseData.quality_standard_responses,
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [applicationNo]);

  // Update quality responses when data changes
  useEffect(() => {
    if (courseDataHook.courseData?.quality_standard_responses) {
      qualityHook.loadExistingResponses(
        courseDataHook.courseData.quality_standard_responses,
      );
    }
  }, [courseDataHook.courseData, qualityHook.qualityData]);

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const handleAction = async () => {
    const isRejectAction =
      dialogHook.selectedStatusId === STATUS.REJECT ||
      dialogHook.selectedStatusId === STATUS.REJECT_QAS2;

    if (isRejectAction && !dialogHook.remarks.trim()) {
      dialogHook.setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const qualityStandardsData =
        qualityHook.prepareQualityStandardsForBackend();
      const payload = {
        applicationNo: applicationNo,
        statusId: dialogHook.selectedStatusId,
        serviceId: QUALITY_SERVICE_ID,
        assignedRoleId: currentRoleId,
        remarks: dialogHook.remarks.trim() || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
        qualityStandards: qualityStandardsData,
      };

      const response =
        await ApplyNonAccreditedCourseService.verifyNonAccreditedCourse(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        const statusMessages = {
          [STATUS.VERIFY_QAS1]: "Course verified successfully",
          [STATUS.VERIFY_QAS2]: "Course verified successfully",
          [STATUS.ENDORSE_REC]: "Course endorsed successfully",
          [STATUS.APPROVE_DG]: "Course approved successfully",
          [STATUS.REJECT]: "Course rejected successfully",
          [STATUS.REJECT_QAS2]: "Forwarded back to QAS Level 1 successfully",
        };
        toast.success(
          statusMessages[dialogHook.selectedStatusId] ||
            "Action completed successfully",
        );
        dialogHook.closeDialog();
        await courseDataHook.fetchCourseDetails();
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

  const handlePaymentNavigation = useCallback(() => {
    if (!courseDataHook.courseData) {
      toast.error("Course data not found");
      return;
    }
    const data = courseDataHook.courseData;
    navigate(
      `/birms/common-payment-index/${data.application_no}/${SERVICE_CODE}/${data.registration_no || "N/A"}/${data.email_id || "N/A"}/${data.mobile_no || "N/A"}/${data.proposed_institute_name || "N/A"}/${data.institute_id || 0}`,
    );
  }, [courseDataHook.courseData, navigate]);

  const tabs = useMemo(() => {
    const baseTabs = [
      { icon: <BusinessIcon />, label: "Programme Information" },
      { icon: <VerifiedIcon />, label: "Quality Standards" },
      { icon: <FileOpenIcon />, label: "Supporting Documents" },
    ];
    if (currentRoleId == 7) {
      baseTabs.push({
        icon: <SettingsSuggestIcon />,
        label: "Generate PA Number",
      });
    }
    return baseTabs;
  }, [currentRoleId]);

  const getDialogContent = () => {
    const isRejectAction =
      dialogHook.selectedStatusId === STATUS.REJECT ||
      dialogHook.selectedStatusId === STATUS.REJECT_QAS2;

    if (isRejectAction) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this non-accredited course
            application:
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>
              Programme Title: {courseDataHook.courseData?.programme_title}
            </strong>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            fullWidth
            multiline
            rows={4}
            value={dialogHook.remarks}
            onChange={(e) => {
              dialogHook.setRemarks(e.target.value);
              dialogHook.setRemarksError("");
            }}
            error={!!dialogHook.remarksError}
            helperText={dialogHook.remarksError}
            required
          />
        </>
      );
    } else {
      const actionMap = {
        [STATUS.VERIFY_QAS1]: "verify",
        [STATUS.VERIFY_QAS2]: "verify",
        [STATUS.ENDORSE_REC]: "endorse",
        [STATUS.APPROVE_DG]: "approve",
      };
      return (
        <DialogContentText>
          Are you sure you want to{" "}
          {actionMap[dialogHook.selectedStatusId] || "process"} this
          non-accredited course application?
          <br />
          <strong>Application No: {applicationNo}</strong>
          <br />
          <strong>
            Programme Title: {courseDataHook.courseData?.programme_title}
          </strong>
        </DialogContentText>
      );
    }
  };

  const isLastTab = tabValue === tabs.length - 1;
  const isFirstTab = tabValue === 0;

  // Action buttons component
  const ActionButtons = () => (
    <>
      {roleId === "7" && (
        <>
          <Tooltip
            title={
              !paymentHook.isPaymentPaid
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
                onClick={() => dialogHook.openDialog(STATUS.VERIFY_QAS1)}
                disabled={!paymentHook.isPaymentPaid}
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
            onClick={() => dialogHook.openDialog(STATUS.REJECT)}
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
            onClick={() => dialogHook.openDialog(STATUS.VERIFY_QAS2)}
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
            onClick={() => dialogHook.openDialog(STATUS.REJECT_QAS2)}
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
          onClick={() => dialogHook.openDialog(STATUS.ENDORSE_REC)}
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
            !paymentHook.isPaymentPaid
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
              onClick={() => dialogHook.openDialog(STATUS.APPROVE_DG)}
              disabled={!paymentHook.isPaymentPaid}
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

  if (!courseDataHook.courseData) {
    return (
      <Box sx={{ m: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            Non-BQF Programme Details
          </Typography>
          <Alert severity="error">
            Non-BQF Programme with Application No:{" "}
            <strong>{applicationNo}</strong> not found
          </Alert>
        </Paper>
      </Box>
    );
  }

  const data = courseDataHook.courseData;

  // Determine if programme type is "less than 140 hours"
  const isLessThan140 = data.programme_type_id === "137";

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          Non-BQF Programme Details
        </Typography>
        <Divider />

        <TabNavigation
          tabs={tabs}
          tabValue={tabValue}
          setTabValue={setTabValue}
          roleId={roleId}
          isLastTab={isLastTab}
          isFirstTab={isFirstTab}
          onPrevious={() => setTabValue(tabValue - 1)}
          onNext={() => setTabValue(tabValue + 1)}
          actionButtons={<ActionButtons />}
        >
          {/* Tab 0: Programme Information */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
              <Grid container spacing={2}>
                {/* Institute Information - Registration No */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Registration No"
                    value={data.registration_no || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* Institute Information - Institute Name */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Training Provider/Institution Name"
                    value={data.proposed_institute_name || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* Programme Type */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Programme Type"
                    value={courseDataHook.getProgrammeTypeName(
                      data.programme_type_id,
                    )}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* Curriculum Title - Only show if not less than 140 hours */}
                {!isLessThan140 && (
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Curriculum Title"
                      value={data.curriculum_title || "N/A"}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                )}
                {/* Programme Title */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Programme Title"
                    value={data.programme_title || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* Certificate Level - Only show if not less than 140 hours */}
                {!isLessThan140 && (
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Certificate Level"
                      value={courseDataHook.getCertificateLevelName(
                        data.certificate_level_id,
                      )}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                )}
                {/* Theory Duration - Only show if not less than 140 hours */}
                {!isLessThan140 && (
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Theory (Hours)"
                      value={data.total_theory_duration || "N/A"}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                )}
                {/* Practical Duration - Only show if not less than 140 hours */}
                {!isLessThan140 && (
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Practical (Hours)"
                      value={data.total_practical_duration || "N/A"}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                )}
                {/* OJT Duration - Only show if not less than 140 hours */}
                {!isLessThan140 && (
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="OJT (Hours)"
                      value={data.total_ojt_duration || "N/A"}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                )}
                {/* Fees per trainee */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fees per trainee (Nu.)"
                    value={data.fees_per_trainee || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* Enrollment capacity */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Enrollment capacity per batch"
                    value={data.enrolment_capacity || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* Application No */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Application No"
                    value={data.application_no || "N/A"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>
              {/* Remarks/History section */}
              {data.remarks && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Remarks / History
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={data.remarks || ""}
                    slotProps={{ input: { readOnly: true } }}
                    size="small"
                  />
                </>
              )}
            </Paper>
          )}

          {/* Tab 1: Quality Standards */}
          {tabValue === 1 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item size={{ xs: 12 }}>
                {qualityHook.qualityData.length > 0 ? (
                  qualityHook.qualityData.map((standard) => (
                    <ChecklistCategory
                      key={standard.id}
                      standard={standard}
                      qualityResponses={qualityHook.qualityResponses}
                      qualityRemarks={qualityHook.qualityRemarks}
                      onResponseChange={qualityHook.handleQualityResponseChange}
                      onRemarkChange={qualityHook.handleQualityRemarkChange}
                    />
                  ))
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
              <Grid item size={{ xs: 12 }}>
                <Paper
                  sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                >
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
                    <li>Trainer CV</li>
                    <li>Curriculum Endorsement letter/ Certificate</li>
                  </Box>
                  <FileDownload
                    initialFiles={courseDataHook.documents}
                    onFileUpload={handleFileUpload}
                    allowUpload={true}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Generate PA Number Tab */}
          {currentRoleId == 7 && tabValue === 3 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item size={{ xs: 12 }}>
                <Paper
                  sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <AccountBalanceIcon
                      sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Generate PA Number
                    </Typography>
                  </Box>
                  <PaymentInfoCard
                    paymentStatus={paymentHook.paymentStatus}
                    onGeneratePayment={handlePaymentNavigation}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabNavigation>
      </Paper>

      {/* Action Dialog */}
      <Dialog
        open={dialogHook.open}
        onClose={dialogHook.closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogHook.selectedStatusId === STATUS.VERIFY_QAS1
            ? "Verify Course Application"
            : dialogHook.selectedStatusId === STATUS.VERIFY_QAS2
              ? "Verify Course Application"
              : dialogHook.selectedStatusId === STATUS.ENDORSE_REC
                ? "Endorse Course Application"
                : dialogHook.selectedStatusId === STATUS.APPROVE_DG
                  ? "Approve Course Application"
                  : dialogHook.selectedStatusId === STATUS.REJECT
                    ? "Reject Course Application"
                    : dialogHook.selectedStatusId === STATUS.REJECT_QAS2
                      ? "Forward Back to QAS Level 1"
                      : "Confirm Action"}
        </DialogTitle>
        <DialogContent>{getDialogContent()}</DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={dialogHook.closeDialog}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={
              dialogHook.selectedStatusId === STATUS.REJECT ||
              dialogHook.selectedStatusId === STATUS.REJECT_QAS2
                ? "error"
                : "success"
            }
            variant="contained"
            size="small"
            disabled={
              actionLoading ||
              ((dialogHook.selectedStatusId === STATUS.REJECT ||
                dialogHook.selectedStatusId === STATUS.REJECT_QAS2) &&
                !dialogHook.remarks.trim())
            }
          >
            {actionLoading ? <CircularProgress size={24} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewApplyNonAccreditedCourse;
