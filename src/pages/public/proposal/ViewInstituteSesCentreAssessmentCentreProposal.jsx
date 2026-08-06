import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Button,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InstituteProposalService from "../../../api/services/internal/registration/InstituteProposalService";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileDownload from "../../../components/file/FileDownload";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const ViewInstituteSesCentreAssessmentCentreProposal = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [partners, setPartners] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [otherOwnershipTypes, setOtherOwnershipTypes] = useState([]);
  const [activityLevels, setActivityLevels] = useState([]);
  const [typeOfOwners, setTypeOfOwners] = useState([]);
  const [serviceName, setServiceName] = useState();
  const [serviceId, setServiceId] = useState();

  // Editable fields state
  const [editableData, setEditableData] = useState({
    proposed_institute_name: "",
    dzongkhag_id: "",
    exact_location: "",
    telephone_no: "",
    mobile_no: "",
    email_id: "",
    sector_id: "",
    course_id: "",
    activity_level_id: "",
  });

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  useEffect(() => {
    if (applicationNo) {
      fetchProposalData();
      fetchMasterData();
    }
  }, [applicationNo]);

  useEffect(() => {
    let isMounted = true;
    const fetchServiceName = async () => {
      try {
        const response = await CommonService.getServiceName(serviceId);
        if (isMounted) {
          setServiceName(response.data.serviceName);
        }
      } catch (error) {
        console.error("Error fetching service name:", error);
      }
    };
    if (serviceId) {
      fetchServiceName();
    }
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  // Fetch courses when sector changes
  useEffect(() => {
    if (editableData.sector_id) {
      fetchCoursesBySector(editableData.sector_id);
    } else {
      setCourses([]);
    }
  }, [editableData.sector_id]);

  const fetchMasterData = async () => {
    try {
      const [
        sectorsRes,
        dzongkhagsRes,
        ownershipTypesRes,
        otherOwnershipTypesRes,
        activityLevelsRes,
        typeOfOwnersRes,
      ] = await Promise.all([
        CommonService.getAllSectors(),
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(1),
        CommonService.getByParentId(2),
        CommonService.getByParentId(3),
        CommonService.getByParentId(6),
      ]);

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setOwnershipTypes(ownershipTypesRes.data || []);
      setOtherOwnershipTypes(otherOwnershipTypesRes.data || []);
      setActivityLevels(activityLevelsRes.data || []);
      setTypeOfOwners(typeOfOwnersRes.data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data");
    }
  };

  const fetchCoursesBySector = async (sectorId) => {
    if (!sectorId) return;
    try {
      const response = await CommonService.getOccupationsBySectorId(sectorId);
      setCourses(response.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    }
  };

  const fetchProposalData = async () => {
    setLoading(true);
    try {
      const response =
        await InstituteProposalService.getInstituteProposalByApplicationNo(
          applicationNo,
          access_token,
        );
      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      setProposalData(data);
      setServiceId(data.service_id);

      // Initialize editable data with current values
      setEditableData({
        proposed_institute_name: data.proposed_institute_name || "",
        dzongkhag_id: data.dzongkhag_id || "",
        exact_location: data.exact_location || "",
        telephone_no: data.telephone_no || "",
        mobile_no: data.mobile_no || "",
        email_id: data.email_id || "",
        sector_id: data.sector_id || "",
        course_id: data.course_id || "",
        activity_level_id: data.activity_level_id || "",
      });

      if (data.partnerships) {
        try {
          if (typeof data.partnerships === "string") {
            const parsedPartners = JSON.parse(data.partnerships);
            setPartners(parsedPartners);
          } else if (Array.isArray(data.partnerships)) {
            setPartners(data.partnerships);
          } else {
            setPartners([]);
          }
        } catch (e) {
          console.error("Error parsing partnerships:", e);
          setPartners([]);
        }
      } else {
        setPartners([]);
      }

      if (data.documents) {
        if (Array.isArray(data.documents)) {
          setDocuments(data.documents);
        } else if (data.document_name && data.upload_url) {
          const names = data.document_name.split(",");
          const urls = data.upload_url.split(",");
          const docs = names.map((name, index) => ({
            name: name.trim(),
            url: urls[index]?.trim(),
          }));
          setDocuments(docs);
        } else if (typeof data.documents === "string") {
          try {
            const parsedDocs = JSON.parse(data.documents);
            setDocuments(Array.isArray(parsedDocs) ? parsedDocs : []);
          } catch (e) {
            console.error("Error parsing documents:", e);
            setDocuments([]);
          }
        }
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
      toast.error("Failed to load proposal data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditableChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const getOwnershipTypeName = (id) => {
    if (!id) return "";
    const type = ownershipTypes.find((t) => t.id.toString() === id.toString());
    return type ? type.name : id;
  };

  const getOtherOwnershipTypeName = (id) => {
    if (!id) return "";
    const type = otherOwnershipTypes.find(
      (t) => t.id.toString() === id.toString(),
    );
    return type ? type.name : id;
  };

  const getDzongkhagName = (id) => {
    if (!id) return "";
    const dz = dzongkhags.find((d) => d.id.toString() === id.toString());
    return dz ? dz.dzonkhagName : id;
  };

  const getSectorName = (id) => {
    if (!id) return "";
    const sector = sectors.find((s) => s.id.toString() === id.toString());
    return sector ? sector.sectorName : id;
  };

  const getCourseName = (id) => {
    if (!id) return "";
    const course = courses.find((c) => c.id.toString() === id.toString());
    return course ? course.occupationName || course.name : id;
  };

  const getActivityLevelName = (id) => {
    if (!id) return "";
    const level = activityLevels.find((l) => l.id.toString() === id.toString());
    return level ? level.name : id;
  };

  const getTypeOfOwnerName = (id) => {
    if (!id) return "";
    const type = typeOfOwners.find((t) => t.id.toString() === id.toString());
    return type ? type.name : id;
  };

  const isOthersType = () => {
    return proposalData?.ownership_type_id?.toString() === "2";
  };

  const isAgencyOrOrganization = () => {
    const id = proposalData?.other_ownership_type_id?.toString();
    return id === "5" || id === "8";
  };

  const isCooperativeOrGroup = () => {
    const id = proposalData?.other_ownership_type_id?.toString();
    return id === "6" || id === "7";
  };

  const handleAction = async () => {
    if (currentAction === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: proposalData.application_no,
        serviceId: serviceId,
        assignedRoleId: currentRoleId,
        statusId: currentAction,
        documents: newDocuments,
        remarks: currentAction === 58 ? remarks : "",
        ...(currentAction === 57 && {
          proposedInstituteName: editableData.proposed_institute_name,
          dzongkhagId: editableData.dzongkhag_id,
          exactLocation: editableData.exact_location,
          telephoneNo: editableData.telephone_no,
          mobileNo: editableData.mobile_no,
          emailId: editableData.email_id,
          sectorId: editableData.sector_id,
          courseId: editableData.course_id,
          activityLevelId: editableData.activity_level_id,
        }),
      };

      console.log("payload", payload);
      const response = await InstituteProposalService.verifyInstituteProposal(
        payload,
        access_token,
      );
      toast.success(
        `Proposal ${currentAction == 57 ? "Approved" : "Rejected"} successfully`,
      );
      navigate(-1);
      closeDialog();
      fetchProposalData();
      setNewDocuments([]);
    } catch (error) {
      console.error(
        `Error ${currentAction === 57 ? "approving" : "rejecting"} proposal:`,
        error,
      );
      toast.error(
        `Failed to ${currentAction === 57 ? "approve" : "reject"} proposal: ${error.message}`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (action) => {
    setCurrentAction(action);
    setRemarks("");
    setRemarksError("");
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setCurrentAction(null);
    setRemarks("");
    setRemarksError("");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getDialogTitle = () => {
    return currentAction === 57 ? "Approve Proposal" : "Reject Proposal";
  };

  const getDialogContent = () => {
    if (currentAction === 57) {
      return (
        <DialogContentText>
          Are you sure you want to approve this proposal?
          <br />
          <strong>Application No: {proposalData?.application_no}</strong>
        </DialogContentText>
      );
    } else {
      return (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for rejecting this proposal:
            <br />
            <strong>Application No: {proposalData?.application_no}</strong>
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
  };

  const getConfirmButtonColor = () => {
    return currentAction === 57 ? "success" : "error";
  };

  const getConfirmButtonText = () => {
    if (actionLoading) return <CircularProgress size={24} />;
    return currentAction === 57 ? "Confirm Approve" : "Confirm Reject";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!proposalData) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Proposal with Application No: <strong>{applicationNo}</strong> not
          found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{
            mt: 2,
            textTransform: "none",
          }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, md: 2 } }}>
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            {serviceName} Details
          </Typography>
        </Box>

        {/* Ownership Information */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Ownership Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label={
                  <span>
                    Ownership Type <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={proposalData.ownership_type_id || ""}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              >
                <MenuItem value={proposalData.ownership_type_id}>
                  {getOwnershipTypeName(proposalData.ownership_type_id)}
                </MenuItem>
              </TextField>
            </Grid>

            {proposalData.ownership_type_id === "1" && (
              <>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label={
                      <span>
                        Registration No <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    size="small"
                    value={proposalData.registration_no || ""}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label={
                      <span>
                        Company Name <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    size="small"
                    value={proposalData.company_name || ""}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>
              </>
            )}

            {isOthersType() && (
              <>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label={
                      <span>
                        Types of Other <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    size="small"
                    value={proposalData.other_ownership_type_id || ""}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  >
                    <MenuItem value={proposalData.other_ownership_type_id}>
                      {getOtherOwnershipTypeName(
                        proposalData.other_ownership_type_id,
                      )}
                    </MenuItem>
                  </TextField>
                </Grid>

                {isAgencyOrOrganization() && (
                  <>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <span>
                            Name <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        size="small"
                        value={proposalData.other_name || ""}
                        slotProps={{
                          input: {
                            readOnly: true,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <span>
                            Address <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        size="small"
                        value={proposalData.other_address || ""}
                        slotProps={{
                          input: {
                            readOnly: true,
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}

                {isCooperativeOrGroup() && (
                  <>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <span>
                            Registration No{" "}
                            <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        size="small"
                        value={proposalData.registration_no || ""}
                        slotProps={{
                          input: {
                            readOnly: true,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <span>
                            Company Name <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        size="small"
                        value={proposalData.company_name || ""}
                        slotProps={{
                          input: {
                            readOnly: true,
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}
              </>
            )}

            {proposalData.ownership_type_id === "3" && partners.length > 0 && (
              <Grid item size={{ xs: 12, md: 12 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    fontWeight: 500,
                  }}
                >
                  Partners
                </Typography>
                {partners.map((partner, index) => (
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
                    <Grid container spacing={2} alignItems="center">
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label={
                            <span>
                              Type of Owner{" "}
                              <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          value={
                            partner.typeOfOwnerId || partner.typeOfOwner || ""
                          }
                          slotProps={{
                            input: {
                              readOnly: true,
                            },
                          }}
                        >
                          <MenuItem
                            value={partner.typeOfOwnerId || partner.typeOfOwner}
                          >
                            {getTypeOfOwnerName(
                              partner.typeOfOwnerId || partner.typeOfOwner,
                            )}
                          </MenuItem>
                        </TextField>
                      </Grid>

                      {(partner.typeOfOwnerId === "22" ||
                        partner.typeOfOwner === "22") && (
                        <>
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label={
                                <span>
                                  Partner Citizen ID No{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              size="small"
                              value={partner.partnerCidNo || ""}
                              slotProps={{
                                input: {
                                  readOnly: true,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label={
                                <span>
                                  Partner Name{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              size="small"
                              value={partner.partnerName || ""}
                              slotProps={{
                                input: {
                                  readOnly: true,
                                },
                              }}
                            />
                          </Grid>
                        </>
                      )}

                      {(partner.typeOfOwnerId === "23" ||
                        partner.typeOfOwner === "23") && (
                        <>
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label={
                                <span>
                                  Partner Company Registration No{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              size="small"
                              value={partner.partnerCompanyRegistrationNo || ""}
                              slotProps={{
                                input: {
                                  readOnly: true,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label={
                                <span>
                                  Partner Company Name{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              size="small"
                              value={partner.partnerCompanyName || ""}
                              slotProps={{
                                input: {
                                  readOnly: true,
                                },
                              }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                ))}
              </Grid>
            )}

            {proposalData.ownership_type_id === "3" &&
              partners.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No partnership details available
                  </Alert>
                </Grid>
              )}

            {proposalData.ownership_type_id === "4" && (
              <>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label={
                      <span>
                        Promoter Citizen ID No{" "}
                        <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    size="small"
                    value={proposalData.promoter_citizen_id || ""}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label={
                      <span>
                        Promoter Name <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    size="small"
                    value={proposalData.promoter_name || ""}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* Training Provider Profile - Always Editable */}
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Training Provider Profile
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={
                  <span>
                    Proposed Institute Name{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.proposed_institute_name}
                onChange={(e) =>
                  handleEditableChange(
                    "proposed_institute_name",
                    e.target.value,
                  )
                }
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label={
                  <span>
                    Institute Location (Dzongkhag){" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.dzongkhag_id}
                onChange={(e) =>
                  handleEditableChange("dzongkhag_id", e.target.value)
                }
              >
                {dzongkhags.map((dzongkhag) => (
                  <MenuItem key={dzongkhag.id} value={dzongkhag.id}>
                    {dzongkhag.dzonkhagName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={
                  <span>
                    Exact Location <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.exact_location}
                onChange={(e) =>
                  handleEditableChange("exact_location", e.target.value)
                }
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Telephone No"
                size="small"
                value={editableData.telephone_no}
                onChange={(e) =>
                  handleEditableChange("telephone_no", e.target.value)
                }
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={
                  <span>
                    Mobile No <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.mobile_no}
                onChange={(e) =>
                  handleEditableChange("mobile_no", e.target.value)
                }
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={
                  <span>
                    Email Address <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.email_id}
                onChange={(e) =>
                  handleEditableChange("email_id", e.target.value)
                }
              />
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label={
                  <span>
                    Field of Training <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.sector_id}
                onChange={(e) => {
                  handleEditableChange("sector_id", e.target.value);
                  // Reset course when sector changes
                  handleEditableChange("course_id", "");
                }}
              >
                {sectors.map((sector) => (
                  <MenuItem key={sector.id} value={sector.id}>
                    {sector.sectorName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label={
                  <span>
                    Course <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.course_id}
                onChange={(e) =>
                  handleEditableChange("course_id", e.target.value)
                }
                disabled={!editableData.sector_id}
              >
                <MenuItem value="">
                  {!editableData.sector_id
                    ? "Select sector first"
                    : courses.length === 0
                      ? "No courses available"
                      : "Select Course"}
                </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.occupationName || course.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label={
                  <span>
                    Activity Level <span style={{ color: "red" }}>*</span>
                  </span>
                }
                size="small"
                value={editableData.activity_level_id}
                onChange={(e) =>
                  handleEditableChange("activity_level_id", e.target.value)
                }
              >
                {activityLevels.map((level) => (
                  <MenuItem key={level.id} value={level.id}>
                    {level.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Supporting Documents */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>
            Supporting Documents ({documents.length + newDocuments.length})
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <FileDownload
            initialFiles={documents}
            onFileUpload={handleFileUpload}
            allowUpload={true}
          />
        </Paper>

        {/* Remarks Section */}
        {proposalData.remarks && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Remarks / History
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              value={proposalData.remarks || ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              size="small"
            />
          </Paper>
        )}

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 3,
          }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(57)}
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openDialog(58)}
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Reject
          </Button>
        </Box>
      </Paper>

      {/* Unified Action Dialog */}
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
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={getConfirmButtonColor()}
            variant="contained"
            size="small"
            disabled={
              actionLoading || (currentAction === 58 && !remarks.trim())
            }
            sx={{ textTransform: "none" }}
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewInstituteSesCentreAssessmentCentreProposal;
