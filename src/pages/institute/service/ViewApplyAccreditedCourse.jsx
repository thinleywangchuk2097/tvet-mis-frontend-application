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
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownload from "../../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ApplyAccreditedCourseService from "../../../api/services/ApplyAccreditedCourseService";
import CommonService from "../../../api/services/CommonService";

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

const ViewApplyAccreditedCourse = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

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

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  const roleId = currentRoleId?.toString();

  useEffect(() => {
    if (applicationNo) {
      fetchAllData();
    }
  }, [applicationNo]);

  useEffect(() => {
    if (qualityData.length > 0 && rawQualityStandards) {
      const { responses, remarks } = parseQualityStandardsWithData(
        rawQualityStandards,
        qualityData
      );
      setQualityResponses(responses);
      setQualityRemarks(remarks);
    }
  }, [qualityData, rawQualityStandards]);

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
          (item) => item.parentId === 0
        );
        const subCategories = response.data.filter(
          (item) => item.parentId !== 0
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
            (row) => row.id === subQuestionId
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
          access_token
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
    [sectors]
  );

  const getCourseName = useCallback(
    (id) => {
      if (!id) return "N/A";
      const occupation = occupations.find((occ) => String(occ.id) === String(id));
      return occupation
        ? occupation.occupationName || occupation.title || occupation.name
        : id;
    },
    [occupations]
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

  const handleAction = async () => {
    if ((selectedStatusId === 58 || selectedStatusId === 60) && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const qualityStandardsData = prepareQualityStandardsForBackend();

      const payload = {
        applicationNo: applicationNo,
        statusId: selectedStatusId,
        serviceId: 26,
        assignedRoleId: currentRoleId,
        remarks: remarks || "Application processed",
        updatedBy: actionId,
        documents: newDocuments,
        qualityStandards: qualityStandardsData,
      };

      const response = await ApplyAccreditedCourseService.verifyAccreditedCourse(
        payload,
        access_token
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
            Please provide remarks for rejecting this accredited course application:
            <br />
            <strong>Application No: {applicationNo}</strong>
            <br />
            <strong>Course Title: {getCourseName(courseData?.course_id)}</strong>
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
          Are you sure you want to {actionText} this accredited course application?
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

  const renderChecklist = useCallback(
    (standard) => {
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
                            onChange={() => {
                              const newValue = isYes ? undefined : "Y";
                              handleQualityResponseChange(
                                standard.id,
                                row.id,
                                newValue
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
                                newValue
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
                                e.target.value
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
    [qualityResponses, qualityRemarks]
  );

  const tabs = [
    { icon: <BusinessIcon />, label: "Course Information" },
    { icon: <VerifiedIcon />, label: "Quality Standards" },
    { icon: <FileOpenIcon />, label: "Supporting Documents" },
  ];

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
          {tabs.map((tab, index) => (
            <Tab key={index} icon={tab.icon} label={tab.label} />
          ))}
        </Tabs>

        {/* Tab 0: Course Information */}
        {tabValue === 0 && (
          <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Registration No"
                  value={courseData.registration_no || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Institute Name"
                  value={courseData.proposed_institute_name || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Curriculum Type"
                  value={courseData.curriculum_name || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sector"
                  value={getSectorName(courseData.sector_id)}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Course"
                  value={getCourseName(courseData.course_id)}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Course Fee (RM)"
                  value={courseData.course_fee || "N/A"}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
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
            <Grid item size={{ xs: 12 }}>
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
            <Grid item size={{ xs: 12 }}>
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

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
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
                Verify 1
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

          {roleId === "10" && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => openActionDialog(62)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              >
                Verify 2
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => openActionDialog(60)}
                sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
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
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
            >
              Endorse
            </Button>
          )}

          {roleId === "22" && (
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
          )}
        </Box>
      </Paper>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
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
              ((selectedStatusId === 58 || selectedStatusId === 60) && !remarks.trim())
            }
          >
            {getConfirmButtonText()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewApplyAccreditedCourse;