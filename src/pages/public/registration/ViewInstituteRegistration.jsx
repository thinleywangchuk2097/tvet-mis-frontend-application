import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CommonService from "../../../api/services/CommonService";
import InstituteRegistrationService from "../../../api/services/InstituteRegistrationService";

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

const ViewInstituteRegistration = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  console.log("Current Role ID:", currentRoleId);
  const { applicationNo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [registrationData, setRegistrationData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [qualityData, setQualityData] = useState([]);

  const [sectors, setSectors] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [nationality, setNationality] = useState([]);
  const [gender, setGender] = useState([]);
  const [jobType, setJobType] = useState([]);
  const [certificateLevel, setCertificateLevel] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [yesNoOption, setYesNoOption] = useState([]);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [endorseRemarks, setEndorseRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  useEffect(() => {
    if (applicationNo) {
      fetchRegistrationData();
      fetchMasterData();
    }
  }, [applicationNo]);

  const fetchMasterData = async () => {
    try {
      const [
        sectorsRes,
        dzongkhagsRes,
        ownershipRes,
        nationalityRes,
        genderRes,
        jobTypeRes,
        certificateLevelRes,
        yesNoRes,
        qualityRes,
      ] = await Promise.all([
        CommonService.getAllSectors(),
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(7),
        CommonService.getByParentId(9),
        CommonService.getByParentId(8),
        CommonService.getByParentId(11),
        CommonService.getByParentId(10),
        CommonService.getByParentId(12),
        CommonService.getAllQualitystandards(),
      ]);

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);
      setNationality(nationalityRes.data || []);
      setGender(genderRes.data || []);
      setJobType(jobTypeRes.data || []);
      setCertificateLevel(certificateLevelRes.data || []);
      setYesNoOption(yesNoRes.data || []);

      if (qualityRes.data) {
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
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data");
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

  const parseQualityStandards = (qualityStr) => {
    try {
      if (!qualityStr) return { responses: {}, remarks: {} };
      const data = JSON.parse(qualityStr);
      const responseMap = {};
      const remarksMap = {};

      data.forEach((item) => {
        const standardId = item.standardId?.toString();
        const rowId = item.qualityStandardId?.toString();
        if (standardId && rowId) {
          if (!responseMap[standardId]) responseMap[standardId] = {};
          if (!remarksMap[standardId]) remarksMap[standardId] = {};

          responseMap[standardId][rowId] = item.responseId?.toString();
          remarksMap[standardId][rowId] = item.remarks || "";
        }
      });

      return { responses: responseMap, remarks: remarksMap };
    } catch (error) {
      console.error("Error parsing quality standards:", error);
      return { responses: {}, remarks: {} };
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

  const fetchRegistrationData = async () => {
    setLoading(true);
    try {
      const response =
        await InstituteRegistrationService.getInstituteRegistrationDetails(
          applicationNo,
          access_token,
        );

      let data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      const trainers = parseTrainers(data.trainers);
      const courses = parseCourses(data.courses);
      const { responses: qualityStandards, remarks: qualityRemarksData } =
        parseQualityStandards(data.quality_standard_responses);
      const parsedDocuments = parseDocuments(data.documents);

      setRegistrationData({
        ...data,
        parsedTrainers: trainers,
        parsedCourses: courses,
      });
      setDocuments(parsedDocuments);
      setQualityResponses(qualityStandards);
      setQualityRemarks(qualityRemarksData);
    } catch (error) {
      console.error("Error fetching registration:", error);
      toast.error("Failed to load registration data");
    } finally {
      setLoading(false);
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

  const getYesNoName = useCallback(
    (id) => {
      if (!id) return "";
      const yn = yesNoOption.find((y) => y.id.toString() === id.toString());
      return yn ? yn.name : id;
    },
    [yesNoOption],
  );

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

  const handleAction = async () => {
    if (selectedStatusId === 58 && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    if (selectedStatusId === 59 && !endorseRemarks.trim()) {
      setRemarksError("Remarks are required for endorsement");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        applicationNo: registrationData.application_no,
        instituteName: registrationData.proposed_institute_name,
        dzongkhagId: registrationData.dzongkhag_id,
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
        documents: newDocuments,
        remarks:
          selectedStatusId === 58
            ? remarks
            : selectedStatusId === 59
              ? endorseRemarks
              : "",
      };

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
        case 62:
          successMessage = "Registration verified successfully";
          break;
        default:
          successMessage = "Action completed successfully";
      }

      toast.success(successMessage);
      navigate(-1);
      closeDialog();
      fetchRegistrationData();
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

  const renderChecklist = useCallback(
    (standard) => {
      const yesOption = yesNoOption.find((opt) => opt.label === "Yes");
      const noOption = yesNoOption.find((opt) => opt.label === "No");

      return (
        <Grid item xs={12} key={standard.id}>
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
                    const responseId = qualityResponses[standard.id]?.[row.id];
                    const isYes = responseId === yesOption?.id;
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
                            //disabled={true}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Radio
                            size="small"
                            sx={{ p: 0.25 }}
                            checked={!isYes && responseId === noOption?.id}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="No remarks provided"
                            value={remark}
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
    [qualityResponses, qualityRemarks, yesNoOption],
  );

  // Convert currentRoleId to string for comparison (handle both string and number)
  const roleId = currentRoleId?.toString();

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
            Institute Registration Details
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
          Institute Registration Details
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
          <Tab icon={<BusinessIcon />} label="Institute Details" />
          <Tab icon={<SchoolIcon />} label="Trainer Details" />
          <Tab icon={<MenuBookIcon />} label="Course Details" />
          <Tab icon={<VerifiedIcon />} label="Quality Standards" />
          <Tab icon={<FileOpenIcon />} label="Supporting Documents" />
        </Tabs>

        {/* Institute Details Tab */}
        {tabValue === 0 && (
          <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name of Training Provider / Institution"
                  value={registrationData.proposed_institute_name || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sector"
                  value={getSectorName(registrationData.sector_id) || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Dzongkhag"
                  value={getDzongkhagName(registrationData.dzongkhag_id) || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Location of the Institute"
                  value={registrationData.exact_location || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Telephone No"
                  value={registrationData.telephone_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile No"
                  value={registrationData.mobile_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Id"
                  value={registrationData.email_id || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Website Address"
                  value={registrationData.website || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Business License No"
                  value={registrationData.business_license_no || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
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

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Total Number of Bhutanese Employees"
                  value={registrationData.bhutanese_employees || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Total Number of Non Bhutanese Employees"
                  value={registrationData.non_bhutanese_employees || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Key Contact Person Name"
                  value={registrationData.key_contact_name || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Key Contact Person Designation"
                  value={registrationData.key_contact_designation || ""}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
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
        {tabValue === 1 && (
          <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
            <Grid container spacing={3}>
              {registrationData.parsedTrainers &&
              registrationData.parsedTrainers.length > 0 ? (
                registrationData.parsedTrainers.map((trainer, index) => (
                  <Grid item size={{ xs: 12 }} key={index}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Trainer {index + 1}
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item size={{ xs: 12, md: 3 }}>
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
                          <Grid item size={{ xs: 12, md: 3 }}>
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
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Work Permit"
                              value={trainer.workPermit || ""}
                              slotProps={{ input: { readOnly: true } }}
                            />
                          </Grid>
                        )}

                        <Grid item size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Name"
                            value={trainer.name || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Gender"
                            value={getGenderName(trainer.genderId) || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Qualification"
                            value={trainer.qualification || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 3 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Experience (Years)"
                            value={trainer.experience || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 3 }}>
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
                <Grid item xs={12}>
                  <Typography textAlign="center" color="text.secondary">
                    No trainer information available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Course Details Tab - Multiple Courses Support */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
            <Grid container spacing={3}>
              {registrationData.parsedCourses &&
              registrationData.parsedCourses.length > 0 ? (
                registrationData.parsedCourses.map((course, index) => (
                  <Grid item size={{ xs: 12 }} key={index}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} mb={2}>
                        Course {index + 1}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Course Title"
                            value={course.courseTitle || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
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

                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Theory (Hours)"
                            value={course.theoryHours || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Practical (Hours)"
                            value={course.practicalHours || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="OJT (Hours)"
                            value={course.ojtHours || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            label="Fees per Trainee"
                            value={course.feesPerTrainee || ""}
                            slotProps={{ input: { readOnly: true } }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
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
                <Grid item xs={12}>
                  <Typography textAlign="center" color="text.secondary">
                    No course information available
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Quality Standards Tab - Read Only with Remarks */}
        {tabValue === 3 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item size={{ xs: 12 }}>
              {qualityData.slice(0, 3).map(renderChecklist)}
            </Grid>
          </Grid>
        )}

        {/* Supporting Documents Tab */}
        {tabValue === 4 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item size={{ xs: 12 }}>
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

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          {roleId === "7" && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => openActionDialog(56)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Verify
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(58)}
            //    disabled={registrationData.task_status_id !== "19"}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
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
              //  disabled={registrationData.task_status_id !== "19"}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Verify
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(58)}
               // disabled={registrationData.task_status_id !== "19"}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Reject
              </Button>
            </>
          )}

          {roleId === "23" && (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<VerifiedIcon />}
                onClick={() => openActionDialog(59)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Endorse
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(58)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Reject
              </Button>
            </>
          )}

          {roleId === "22" && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => openActionDialog(57)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(58)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Reject
              </Button>
            </>
          )}
        </Box>
      </Paper>

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

export default ViewInstituteRegistration;
