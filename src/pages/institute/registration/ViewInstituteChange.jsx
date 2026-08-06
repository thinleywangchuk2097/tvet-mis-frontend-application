import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import FileDownload from "../../../components/file/FileDownload";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import CommonService from "../../../api/services/internal/common/CommonService";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import { format } from "date-fns";

const ViewInstituteChange = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [changeRequestData, setChangeRequestData] = useState(null);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [otherOwnershipTypes, setOtherOwnershipTypes] = useState([]);
  const [typeOfOwners, setTypeOfOwners] = useState([]);
  const [currentInstituteData, setCurrentInstituteData] = useState(null);
  const [loadingInstituteData, setLoadingInstituteData] = useState(true);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Status IDs
  const STATUS_VERIFY = 56;
  const STATUS_REJECT = 58;
  const SERVICE_CODE = 100591;

  useEffect(() => {
    fetchMasterData();
    fetchChangeRequestDetails();
    fetchPaymentStatus();
  }, [applicationNo]);

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

  const fetchMasterData = async () => {
    try {
      const [
        dzongkhagsRes,
        ownershipTypesRes,
        otherOwnershipTypesRes,
        typeOfOwnersRes,
      ] = await Promise.all([
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(1),
        CommonService.getByParentId(2),
        CommonService.getByParentId(6),
      ]);
      setDzongkhags(dzongkhagsRes.data);
      setOwnershipTypes(ownershipTypesRes.data);
      setOtherOwnershipTypes(otherOwnershipTypesRes.data);
      setTypeOfOwners(typeOfOwnersRes.data);
    } catch (error) {
      toast.error("Failed to load master data");
    }
  };

  const fetchChangeRequestDetails = async () => {
    setLoading(true);
    setLoadingInstituteData(true);
    try {
      const response =
        await InstituteRegistrationService.getInstituteChangeByApplicationNo(
          applicationNo,
        );

      console.log("response : ", response.data);

      if (response.data) {
        let data = response.data;

        // If response is an array, get the first item
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        // Parse JSON strings if they exist
        if (data.partnerships && typeof data.partnerships === "string") {
          try {
            data.partners = JSON.parse(data.partnerships);
          } catch (e) {
            data.partners = [];
          }
        } else if (data.partnerships && typeof data.partnerships === "object") {
          data.partners = data.partnerships;
        }

        if (data.documents && typeof data.documents === "string") {
          try {
            const parsedDocs = JSON.parse(data.documents);
            if (Array.isArray(parsedDocs)) {
              const formattedDocs = parsedDocs.map((doc) => ({
                name: doc.name || doc.documentName || "Document",
                url: doc.url || doc.filePath || "",
                id: doc.id,
                filePath: doc.url || doc.filePath,
              }));
              setDocuments(formattedDocs);
            }
            data.documents = parsedDocs;
          } catch (e) {
            data.documents = [];
          }
        }

        setChangeRequestData(data);

        // If we have institute ID, fetch current institute details
        if (data.institute_id || data.instituteId) {
          const instituteId = data.institute_id || data.instituteId;
          const instituteResponse =
            await CommonService.getInstituteNameByInstituteId(instituteId);
          console.log("instituteResponse : ", instituteResponse.data);

          if (instituteResponse.data) {
            const instituteData =
              Array.isArray(instituteResponse.data) &&
              instituteResponse.data.length > 0
                ? instituteResponse.data[0]
                : instituteResponse.data;

            setCurrentInstituteData({
              // For display
              registration_no: instituteData.registration_no || "",
              instituteName: instituteData.institute_name || "",
              dzongkhag_id: instituteData.dzongkhag_id || "",
              exact_location: instituteData.exact_location || "",
              // For payment
              instituteId: instituteData.institute_id || "",
              taxPayerNo: instituteData.registration_no || "",
              taxPayerEmail: instituteData.email_id || "",
              taxPayerMobileNo: instituteData.mobile_no || "",
              taxPayerName: instituteData.institute_name || "",
            });
          }
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to load change request details");
    } finally {
      setLoading(false);
      setLoadingInstituteData(false);
    }
  };

  // Helper functions
  const getOwnershipTypeName = (id) => {
    if (!id) return "N/A";
    const type = ownershipTypes.find((t) => t.id === parseInt(id));
    if (type) return type.name;
    const otherType = otherOwnershipTypes.find((t) => t.id === parseInt(id));
    if (otherType) return otherType.name;
    return id;
  };

  const getDzongkhagName = (id) => {
    if (!id) return "N/A";
    const dzongkhag = dzongkhags.find((d) => d.id === parseInt(id));
    return dzongkhag?.dzonkhagName || id;
  };

  const getTypeOfOwnerName = (id) => {
    if (!id) return "N/A";
    const type = typeOfOwners.find((t) => t.id === parseInt(id));
    return type?.name || id;
  };

  const getStatusBadge = (statusId) => {
    const statusMap = {
      115: { label: "Pending", color: "warning" },
      116: { label: "Approved", color: "success" },
      117: { label: "Rejected", color: "error" },
      118: { label: "In Review", color: "info" },
    };
    const status = statusMap[statusId] || {
      label: "Unknown",
      color: "default",
    };
    return <Chip label={status.label} color={status.color} size="small" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm");
    } catch {
      return dateString;
    }
  };

  const isOthersType = () => {
    const id =
      changeRequestData?.ownership_type_id ||
      changeRequestData?.ownershipTypeId;
    return id === "2";
  };

  const isAgencyOrOrganization = () => {
    const id =
      changeRequestData?.other_ownership_type_id ||
      changeRequestData?.otherOwnershipTypeId;
    return id === "5" || id === "8";
  };

  const isCooperativeOrGroup = () => {
    const id =
      changeRequestData?.other_ownership_type_id ||
      changeRequestData?.otherOwnershipTypeId;
    return id === "6" || id === "7";
  };

  const isSoleProprietorship = () => {
    const id =
      changeRequestData?.ownership_type_id ||
      changeRequestData?.ownershipTypeId;
    return id === "4";
  };

  const isCompany = () => {
    const id =
      changeRequestData?.ownership_type_id ||
      changeRequestData?.ownershipTypeId;
    return id === "1";
  };

  const isPartnership = () => {
    const id =
      changeRequestData?.ownership_type_id ||
      changeRequestData?.ownershipTypeId;
    return id === "3";
  };

  // Check if payment is completed
  const isPaymentPaid = paymentStatus?.paymentStatus?.toLowerCase() === "paid";

  // Handle payment navigation
  const handlePaymentNavigation = () => {
    if (!currentInstituteData) {
      toast.error("Institute data not found");
      return;
    }
    const instituteId = currentInstituteData.instituteId || 0;
    const serviceCode = SERVICE_CODE;
    const taxPayerNo = currentInstituteData.taxPayerNo || "N/A";
    const taxPayerEmail = currentInstituteData.taxPayerEmail || "N/A";
    const taxPayerMobileNo = currentInstituteData.taxPayerMobileNo || "N/A";
    const taxPayerName = currentInstituteData.taxPayerName || "N/A";
    // Navigate to BIRMS payment page
    navigate(
      `/birms/common-payment-index/${applicationNo}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  };

  // Handle Verify
  const handleVerify = async () => {
    if (!remarks.trim()) {
      toast.warning("Please provide remarks before verifying");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: STATUS_VERIFY,
        remarks: remarks,
        updatedBy: 51,
      };

      const response =
        await InstituteRegistrationService.verifyInstituteChange(payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Change request verified successfully!");
        setVerifyDialogOpen(false);
        setRemarks("");
        setCurrentAction(null);
        await fetchChangeRequestDetails();
        navigate(-1);
      }
    } catch (error) {
      toast.error(error.message || "Failed to verify change request");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!remarks.trim()) {
      toast.warning("Please provide remarks for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: applicationNo,
        statusId: STATUS_REJECT,
        remarks: remarks,
        updatedBy: 51,
      };

      const response =
        await InstituteRegistrationService.rejectInstituteChange(payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Change request rejected successfully!");
        setRejectDialogOpen(false);
        setRemarks("");
        setCurrentAction(null);
        await fetchChangeRequestDetails();
        navigate(-1);
      }
    } catch (error) {
      toast.error(error.message || "Failed to reject change request");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  // Create a read-only TextField render helper
  const renderReadOnlyField = (
    label,
    value,
    placeholder = "N/A",
    multiLine = false,
  ) => (
    <TextField
      fullWidth
      label={label}
      value={value || ""}
      placeholder={placeholder}
      size="small"
      multiline={multiLine}
      rows={multiLine ? 4 : 1}
      slotProps={{
        input: {
          readOnly: true,
        },
      }}
      variant="outlined"
    />
  );

  // Create a read-only Select render helper
  const renderReadOnlySelect = (label, value, displayValue) => (
    <TextField
      select
      fullWidth
      label={label}
      size="small"
      value={value || ""}
      slotProps={{
        input: {
          readOnly: true,
        },
      }}
    >
      <MenuItem value={value || ""}>{displayValue || "N/A"}</MenuItem>
    </TextField>
  );

  // Check if the request is pending (can be verified or rejected)
  const isPending = changeRequestData?.status_id === "115";

  // Open dialog with action type
  const openVerifyDialog = () => {
    setCurrentAction(STATUS_VERIFY);
    setRemarks("");
    setVerifyDialogOpen(true);
  };

  const openRejectDialog = () => {
    setCurrentAction(STATUS_REJECT);
    setRemarks("");
    setRejectDialogOpen(true);
  };

  // Get dialog title based on action
  const getDialogTitle = () => {
    if (currentAction === STATUS_VERIFY) return "Verify Change Request";
    if (currentAction === STATUS_REJECT) return "Reject Change Request";
    return "Confirm Action";
  };

  // Get dialog content based on action
  const getDialogContent = () => {
    if (currentAction === STATUS_REJECT) {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this change request. This
            action will reject the request.
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>
              Institute: {changeRequestData?.institute_name || "N/A"}
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
            onChange={(e) => setRemarks(e.target.value)}
            required
          />
        </>
      );
    }
    return (
      <DialogContentText>
        Are you sure you want to verify this change request?
        <br />
        <strong>Application No: {applicationNo}</strong>
        <br />
        <strong>Institute: {changeRequestData?.institute_name || "N/A"}</strong>
      </DialogContentText>
    );
  };

  // Get confirm button color
  const getConfirmButtonColor = () => {
    if (currentAction === STATUS_VERIFY) return "success";
    if (currentAction === STATUS_REJECT) return "error";
    return "primary";
  };

  // Get confirm button text
  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    if (currentAction === STATUS_VERIFY) return "Confirm Verify";
    if (currentAction === STATUS_REJECT) return "Confirm Reject";
    return "Confirm";
  };

  // Handle dialog action
  const handleDialogAction = () => {
    if (currentAction === STATUS_VERIFY) {
      handleVerify();
    } else if (currentAction === STATUS_REJECT) {
      handleReject();
    }
  };

  if (loading || loadingInstituteData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!changeRequestData) {
    return (
      <Box sx={{ m: 2, p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Change request not found</Typography>
          <Typography variant="body2">
            No change request found with Application Number: {applicationNo}
          </Typography>
        </Alert>
        <Button
          variant="contained"
          startIcon={<CancelIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ m: 1 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography
            textTransform="uppercase"
            fontWeight="bold"
            sx={{ textDecoration: "underline", fontSize: "1.3rem" }}
          >
            Request for Institute Change - View
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            View submitted change request details
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
            mt={1}
            flexWrap="wrap"
          >
            <Typography variant="caption" color="primary">
              Application No:{" "}
              {changeRequestData.application_no || applicationNo}
            </Typography>
            {changeRequestData.status_id && (
              <Box>{getStatusBadge(changeRequestData.status_id)}</Box>
            )}
            <Typography variant="caption" color="textSecondary">
              Submitted on: {formatDate(changeRequestData.created_at)}
            </Typography>
          </Box>
        </Box>

        {/* Current Institute Information */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BusinessIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Current Institute Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Registration No:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentInstituteData?.registration_no || "N/A"}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Institute Name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentInstituteData?.instituteName || "N/A"}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Dzongkhag:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getDzongkhagName(currentInstituteData?.dzongkhag_id)}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Exact Location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentInstituteData?.exact_location || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Change Type Selection - Read Only */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Change Type <span style={{ color: "red" }}>*</span>
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<LocationOnIcon />}
              label="Change Location"
              color={
                changeRequestData.change_type === "location"
                  ? "info"
                  : "default"
              }
              variant={
                changeRequestData.change_type === "location"
                  ? "filled"
                  : "outlined"
              }
            />
            <Chip
              icon={<DescriptionIcon />}
              label="Change Name"
              color={
                changeRequestData.change_type === "name" ? "success" : "default"
              }
              variant={
                changeRequestData.change_type === "name" ? "filled" : "outlined"
              }
            />
            <Chip
              icon={<PeopleIcon />}
              label="Change Ownership"
              color={
                changeRequestData.change_type === "ownership"
                  ? "warning"
                  : "default"
              }
              variant={
                changeRequestData.change_type === "ownership"
                  ? "filled"
                  : "outlined"
              }
            />
          </Box>
        </Paper>

        {/* Location Change Section */}
        {changeRequestData.change_type === "location" && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LocationOnIcon color="info" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Change Location
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Current Location:{" "}
              {getDzongkhagName(currentInstituteData?.dzongkhag_id)} -{" "}
              {currentInstituteData?.exact_location || "N/A"}
            </Alert>
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                {renderReadOnlySelect(
                  "New Dzongkhag *",
                  changeRequestData.dzongkhag_id,
                  getDzongkhagName(changeRequestData.dzongkhag_id),
                )}
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                {renderReadOnlyField(
                  "New Exact Location *",
                  changeRequestData.exact_location,
                )}
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Name Change Section */}
        {changeRequestData.change_type === "name" && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <DescriptionIcon color="success" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Change Name
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Current Name: {currentInstituteData?.instituteName || "N/A"}
            </Alert>
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                {renderReadOnlyField(
                  "New Institute Name *",
                  changeRequestData.institute_name,
                )}
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Ownership Change Section */}
        {changeRequestData.change_type === "ownership" && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PeopleIcon color="warning" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Change Ownership
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Alert severity="info" sx={{ mb: 2 }}>
              Current Ownership:{" "}
              {getOwnershipTypeName(changeRequestData.ownership_type_id)}
            </Alert>

            <Grid container spacing={3}>
              {/* Main Ownership Type */}
              <Grid item size={{ xs: 12, md: 4 }}>
                {renderReadOnlySelect(
                  "New Ownership Type *",
                  changeRequestData.ownership_type_id,
                  getOwnershipTypeName(changeRequestData.ownership_type_id),
                )}
              </Grid>

              {/* Others sub-type */}
              {isOthersType() && (
                <Grid item size={{ xs: 12, md: 4 }}>
                  {renderReadOnlySelect(
                    "Type of Others *",
                    changeRequestData.other_ownership_type_id,
                    getOwnershipTypeName(
                      changeRequestData.other_ownership_type_id,
                    ),
                  )}
                </Grid>
              )}

              {/* Company Fields */}
              {isCompany() && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Registration No *",
                      changeRequestData.registration_no,
                    )}
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Company Name *",
                      changeRequestData.company_name,
                    )}
                  </Grid>
                </>
              )}

              {/* Cooperative/Group Fields */}
              {isOthersType() && isCooperativeOrGroup() && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Registration No *",
                      changeRequestData.registration_no,
                    )}
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Organization Name *",
                      changeRequestData.company_name,
                    )}
                  </Grid>
                </>
              )}

              {/* Agency/Organization Fields */}
              {isOthersType() && isAgencyOrOrganization() && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Name *",
                      changeRequestData.other_name,
                    )}
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Address *",
                      changeRequestData.other_address,
                    )}
                  </Grid>
                </>
              )}

              {/* Sole Proprietorship Fields */}
              {isSoleProprietorship() && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Promoter Citizen ID *",
                      changeRequestData.promoter_citizen_id,
                    )}
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    {renderReadOnlyField(
                      "Promoter Name *",
                      changeRequestData.promoter_name,
                    )}
                  </Grid>
                </>
              )}

              {/* Partnership Section */}
              {isPartnership() && (
                <Grid item size={{ xs: 12 }}>
                  <Box sx={{ mt: 2, width: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      Partner Details
                    </Typography>

                    {changeRequestData.partners &&
                    changeRequestData.partners.length > 0 ? (
                      changeRequestData.partners.map((partner, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: "100%",
                            mb: 2,
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                          }}
                        >
                          <Grid container spacing={2}>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              {renderReadOnlySelect(
                                "Type of Owner *",
                                partner.typeOfOwnerId,
                                getTypeOfOwnerName(partner.typeOfOwnerId),
                              )}
                            </Grid>

                            {partner.typeOfOwnerId === "22" && (
                              <>
                                <Grid item size={{ xs: 12, md: 3 }}>
                                  {renderReadOnlyField(
                                    "Partner Citizen ID No *",
                                    partner.partnerCidNo,
                                  )}
                                </Grid>
                                <Grid item size={{ xs: 12, md: 3 }}>
                                  {renderReadOnlyField(
                                    "Partner Name *",
                                    partner.partnerName,
                                  )}
                                </Grid>
                              </>
                            )}

                            {partner.typeOfOwnerId === "23" && (
                              <>
                                <Grid item size={{ xs: 12, md: 3 }}>
                                  {renderReadOnlyField(
                                    "Partner Company Registration No *",
                                    partner.partnerCompanyRegistrationNo,
                                  )}
                                </Grid>
                                <Grid item size={{ xs: 12, md: 3 }}>
                                  {renderReadOnlyField(
                                    "Partner Company Name *",
                                    partner.partnerCompanyName,
                                  )}
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                      ))
                    ) : (
                      <Typography color="textSecondary" sx={{ p: 2 }}>
                        No partners added
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Reason for Change */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Reason for Change <span style={{ color: "red" }}>*</span>
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {renderReadOnlyField(
            "Reason for Change *",
            changeRequestData.reason_for_change,
            "No reason provided",
            true,
          )}
        </Paper>

        {/* Supporting Documents - Using FileDownload component */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AttachFileIcon color="primary" fontSize="small" />
            <Typography fontWeight={600}>Supporting Documents</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <FileDownload
            initialFiles={documents}
            onFileUpload={handleFileUpload}
            allowUpload={false}
          />
        </Paper>

        {/* Generate PA Number Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AccountBalanceIcon
              sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
            />
            <Typography variant="subtitle1" fontWeight={600}>
              Generate PA Number
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {paymentStatus ? (
            <Card variant="outlined" sx={{ p: 0 }}>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Grid container spacing={0.5}>
                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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
                        color={isPaymentPaid ? "success" : "warning"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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

                  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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
                    sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
                      onClick={() =>
                        window.open(paymentStatus.redirectUrl, "_blank")
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
                    "& .MuiAlert-message": { fontSize: "0.7rem", py: 0.25 },
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
                  Click the button below to generate a PA number and proceed to
                  payment.
                </Typography>

                <Box
                  sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<SettingsSuggestIcon sx={{ fontSize: 18 }} />}
                    onClick={handlePaymentNavigation}
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
                  <strong>Note:</strong> This will create a payment request and
                  redirect you to the payment portal.
                </Alert>
              </CardContent>
            </Card>
          )}
        </Paper>

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          {isPending && (
            <>
              <Tooltip
                title={
                  !isPaymentPaid
                    ? "Payment must be completed before verification"
                    : "Verify this change request"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={openVerifyDialog}
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
              <Tooltip title="Reject this change request" arrow>
                <span>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={openRejectDialog}
                    sx={{
                      px: 3,
                      py: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Reject
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
        </Box>
      </Paper>

      {/* Unified Action Dialog */}
      <Dialog
        open={verifyDialogOpen || rejectDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false);
          setRejectDialogOpen(false);
          setCurrentAction(null);
          setRemarks("");
        }}
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
            onClick={() => {
              setVerifyDialogOpen(false);
              setRejectDialogOpen(false);
              setCurrentAction(null);
              setRemarks("");
            }}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDialogAction}
            color={getConfirmButtonColor()}
            variant="contained"
            size="small"
            disabled={
              actionLoading ||
              (currentAction === STATUS_REJECT && !remarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewInstituteChange;
