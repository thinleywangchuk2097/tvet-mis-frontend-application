import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import SelfAssessmentReportService from "../../../api/services/internal/registration/SelfAssessmentReportService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import BasicInformationSection from "./self-assessment/BasicInformationSection";
import QualityStandardsTabs from "./self-assessment/QualityStandardsTabs";
import { loadInstituteTrainersAndCourses } from "./self-assessment/basicInfoLoader";
import {
  SAR_SERVICE_ID,
  SAR_STATUS,
  buildQualityTree,
  computeSummary,
  formatDate,
  formatScore,
  getAllSubIndicators,
  getGradeColor,
  parseJson,
} from "./self-assessment/sarUtils";

// Helper component for required field indicator
const RequiredStar = () => (
  <Typography component="span" sx={{ color: "red" }}>
    *
  </Typography>
);

const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

const SECTION_STYLE = {
  p: 3,
  mb: 3,
  border: "1px solid",
  borderColor: "divider",
};

const draftKey = (registrationNo) => `tvet-sar-draft-${registrationNo}`;

const readDraft = (registrationNo) => {
  try {
    const raw = window.localStorage.getItem(draftKey(registrationNo));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeDraft = (registrationNo, selfPoints) => {
  try {
    window.localStorage.setItem(
      draftKey(registrationNo),
      JSON.stringify({ selfPoints, savedAt: new Date().toISOString() }),
    );
  } catch {
    // storage unavailable - ignore
  }
};

const clearDraft = (registrationNo) => {
  try {
    window.localStorage.removeItem(draftKey(registrationNo));
  } catch {
    // storage unavailable - ignore
  }
};

const SelfAssessmentReport = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // List state
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusList, setStatusList] = useState([]);

  // Master data
  const [basicInfo, setBasicInfo] = useState(null);
  const [basicLoading, setBasicLoading] = useState(false);
  const [rawStandards, setRawStandards] = useState([]);

  // Dialog / form state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedReport, setSelectedReport] = useState(null);
  const [selfPoints, setSelfPoints] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const isReadOnly = dialogMode === "view";

  const criteria = useMemo(() => buildQualityTree(rawStandards), [rawStandards]);
  const summary = useMemo(
    () => computeSummary(criteria, selfPoints),
    [criteria, selfPoints],
  );

  const activeReport = useMemo(
    () =>
      reports.find(
        (r) =>
          ![SAR_STATUS.APPROVED, SAR_STATUS.REJECTED].includes(
            Number(r.statusId),
          ),
      ),
    [reports],
  );

  // ------------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------------
  const fetchStatusList = async () => {
    try {
      const response = await CommonService.getByParentId(4);
      setStatusList(response.data || []);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  const fetchQualityStandards = async () => {
    try {
      const response = await CommonService.getAllQualitystandards(SAR_SERVICE_ID);
      setRawStandards(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching quality standards:", error);
    }
  };

  // Institute details are pulled the same way as the Accreditation of BQF
  // Programme form: InstituteRegistrationService.getInstituteDetails(registration_no)
  // (tbl_institute_registration_dtls.registration_no = tbl_user.user_id).
  // Trainer and course details come from the self assessment service.
  const fetchBasicInformation = async () => {
    setBasicLoading(true);
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instituteData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      if (!instituteData?.institute_id) {
        setBasicInfo({ institute: null, trainers: [], courses: [] });
        return;
      }

      const extra = await loadInstituteTrainersAndCourses({
        instituteId: instituteData.institute_id,
        registrationNo: registration_no,
        token: access_token,
      });

      setBasicInfo({
        institute: { ...instituteData, ...(extra.institute || {}) },
        trainers: extra.trainers || [],
        courses: extra.courses || [],
      });
    } catch (error) {
      console.error("Error fetching institute data:", error);
    } finally {
      setBasicLoading(false);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      const response =
        await SelfAssessmentReportService.getSelfAssessmentReportsByUserId(
          registration_no,
          access_token,
        );
      if (response.data && Array.isArray(response.data)) {
        setReports(
          response.data.map((item, index) => ({
            id: item.id || index,
            applicationNo: item.application_no,
            instituteId: item.institute_id,
            statusId: item.status_id,
            statusName: item.status_name,
            totalScore: item.total_score,
            grade: item.grade,
            submittedDate: item.submitted_date,
            instituteName: item.proposed_institute_name,
            qualityStandards: parseJson(item.quality_standard_responses, []),
            documents: item.documents,
          })),
        );
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching self assessment reports:", error);
      setReports([]);
    }
  }, [registration_no, access_token]);

  useEffect(() => {
    fetchStatusList();
    fetchQualityStandards();
    fetchBasicInformation();
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto save (local draft) while the institute fills the form
  useEffect(() => {
    if (!openDialog || dialogMode !== "add") return undefined;
    if (Object.keys(selfPoints).length === 0) return undefined;
    const timer = setTimeout(() => {
      writeDraft(registration_no, selfPoints);
      setDraftSavedAt(new Date());
    }, 800);
    return () => clearTimeout(timer);
  }, [selfPoints, openDialog, dialogMode, registration_no]);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const getStatusName = (report) => {
    if (report.statusName) return report.statusName;
    const status = statusList.find((s) => s.id == report.statusId);
    return status ? status.name : "Pending";
  };

  const getStatusColor = (statusId) => {
    const id = Number(statusId);
    if (id === SAR_STATUS.APPROVED) return "#4caf50";
    if (id === SAR_STATUS.REJECTED) return "#f44336";
    return "#2196f3";
  };

  const filteredReports = reports.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.applicationNo || "").toLowerCase().includes(term) ||
      (getStatusName(r) || "").toLowerCase().includes(term) ||
      (r.grade || "").toLowerCase().includes(term)
    );
  });

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const resetForm = () => {
    setSelfPoints({});
    setShowErrors(false);
    setDraftSavedAt(null);
  };

  const handleAdd = () => {
    if (activeReport) {
      toast.warning(
        `Self Assessment Report ${activeReport.applicationNo} is already in process.`,
      );
      return;
    }
    resetForm();
    setSelectedReport(null);
    setDialogMode("add");

    const draft = readDraft(registration_no);
    if (draft?.selfPoints && Object.keys(draft.selfPoints).length > 0) {
      setSelfPoints(draft.selfPoints);
      setDraftSavedAt(draft.savedAt ? new Date(draft.savedAt) : null);
      toast.info("Your previously saved draft has been restored.");
    }
    setOpenDialog(true);
  };

  const handleView = (report) => {
    resetForm();
    setSelectedReport(report);
    setDialogMode("view");
    const points = {};
    report.qualityStandards.forEach((qs) => {
      if (qs.standardId !== null && qs.standardId !== undefined) {
        points[String(qs.standardId)] = qs.selfPoint;
      }
    });
    setSelfPoints(points);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setConfirmOpen(false);
  };

  const handleSelfPointChange = (subId, value) => {
    setSelfPoints((prev) => ({ ...prev, [subId]: value }));
  };

  const handleReset = () => {
    resetForm();
    clearDraft(registration_no);
    toast.info("Form has been reset.");
  };

  const handleSaveDraft = () => {
    writeDraft(registration_no, selfPoints);
    setDraftSavedAt(new Date());
    toast.success("Draft saved on this device.");
  };

  const validateForm = () => {
    setShowErrors(true);
    if (!basicInfo?.institute?.institute_id) {
      toast.error("Institute details not found. Please contact the administrator.");
      return false;
    }
    if (criteria.length === 0) {
      toast.error("Quality standards are not configured for this service.");
      return false;
    }
    if (!summary.complete) {
      toast.error(
        `Please enter earned points for all quality indicators (${summary.answered}/${summary.total} completed).`,
      );
      return false;
    }
    return true;
  };

  const handleSubmitClick = () => {
    if (validateForm()) setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const qualityStandards = getAllSubIndicators(criteria).map((sub) => ({
        standardId: Number(sub.id),
        selfPoint: Number(selfPoints[sub.id]),
      }));

      const submissionData = {
        instituteId: Number(basicInfo.institute.institute_id),
        applicantName: basicInfo.institute.proposed_institute_name,
        submittedDate: new Date().toISOString(),
        createdBy: actionId,
        updatedBy: actionId,
        userId: actionId ? String(actionId) : null,
        serviceId: SAR_SERVICE_ID,
        assignedRoleId: 7,
        statusId: SAR_STATUS.SUBMITTED,
        qualityStandards,
      };

      const response =
        await SelfAssessmentReportService.submitSelfAssessmentReport(
          submissionData,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Self Assessment Report submitted successfully! Application No: ${response.data?.applicationNo || ""}`,
        );
        clearDraft(registration_no);
        resetForm();
        setConfirmOpen(false);
        setOpenDialog(false);
        await fetchReports();
      } else {
        toast.error(
          response.response?.data?.message ||
            "Failed to submit Self Assessment Report",
        );
        setConfirmOpen(false);
      }
    } catch (error) {
      console.error("Error submitting self assessment report:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while submitting the report",
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Self Assessment Report
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        TVET Provider Accreditation - assess your institute against the
        accreditation quality standards.
      </Typography>

      {activeReport && (
        <Alert severity="info" sx={{ my: 1 }}>
          Application <strong>{activeReport.applicationNo}</strong> is in
          process ({getStatusName(activeReport)}). A new report can be
          submitted once it is approved or rejected.
        </Alert>
      )}

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid size={{ xs: 12, md: 4 }}>
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
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!!activeReport}
            sx={{ height: "36px" }}
          >
            Apply Self Assessment
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Submitted Date</TableCell>
              <TableCell align="center">Score (out of 1000)</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.length > 0 ? (
              filteredReports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report, index) => (
                  <TableRow key={report.id || index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{report.applicationNo}</TableCell>
                    <TableCell>{formatDate(report.submittedDate)}</TableCell>
                    <TableCell align="center">
                      {formatScore(report.totalScore)}
                    </TableCell>
                    <TableCell align="center">
                      {report.grade ? (
                        <Chip
                          size="small"
                          label={report.grade}
                          sx={{
                            bgcolor: getGradeColor(report.grade),
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusName(report)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(report.statusId),
                          color: "white",
                          fontWeight: "medium",
                          minWidth: "100px",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Report" arrow placement="top">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleView(report)}
                          sx={{ p: 0.5 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(+e.target.value);
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Self Assessment Report Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {dialogMode === "add"
                  ? "TVET Provider Accreditation - Self Assessment Report"
                  : `Self Assessment Report - ${selectedReport?.applicationNo || ""}`}
              </Typography>
              {dialogMode === "add" && draftSavedAt && (
                <Typography variant="caption" color="text.secondary">
                  Draft auto-saved at {draftSavedAt.toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            {dialogMode === "view" && selectedReport && (
              <Stack direction="row" spacing={1}>
                <Chip
                  label={getStatusName(selectedReport)}
                  sx={{
                    bgcolor: getStatusColor(selectedReport.statusId),
                    color: "#fff",
                  }}
                />
                {selectedReport.grade && (
                  <Chip
                    label={`Score ${formatScore(selectedReport.totalScore)} · ${selectedReport.grade}`}
                    sx={{
                      bgcolor: getGradeColor(selectedReport.grade),
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Stack>
            )}
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {/* Container 1: Basic Information */}
          <Paper sx={SECTION_STYLE}>
            <Typography fontWeight={600} gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <BasicInformationSection basicInfo={basicInfo} loading={basicLoading} />
          </Paper>

          {/* Container 2: Quality Standards */}
          <Paper sx={SECTION_STYLE}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
            >
              <Typography fontWeight={600}>
                Quality Standards {!isReadOnly && <RequiredStar />}
              </Typography>
              <Chip
                size="small"
                color={summary.complete ? "success" : "default"}
                label={`${summary.answered}/${summary.total} indicators scored`}
              />
            </Stack>
            <Divider sx={{ my: 2 }} />
            {!isReadOnly && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mb: 2, display: "block" }}
              >
                Select the earned points (4 = fully met ... 0 = not met) for
                every sub-indicator in each criteria tab.
              </Typography>
            )}
            <QualityStandardsTabs
              criteria={criteria}
              mode="institute"
              selfPoints={selfPoints}
              onSelfPointChange={handleSelfPointChange}
              readOnly={isReadOnly}
              showErrors={showErrors}
            />
          </Paper>

        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {isReadOnly ? "Self assessed score:" : "Current score:"}
            </Typography>
            <Chip
              size="small"
              label={`${formatScore(summary.totalScore)} / ${summary.totalWeight || 1000}`}
              sx={{ bgcolor: summary.grade.color, color: "#fff", fontWeight: 700 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={summary.grade.grade}
              sx={{ borderColor: summary.grade.color, color: summary.grade.color }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleClose}
              disabled={loading}
            >
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={handleReset}
                  startIcon={<RotateLeftIcon />}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={handleSaveDraft}
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  Save Draft
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitClick}
                  startIcon={<SendIcon />}
                  disabled={loading || basicLoading}
                >
                  Submit
                </Button>
              </>
            )}
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Submit confirmation */}
      <Dialog
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Self Assessment Report</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Your self assessed score is{" "}
            <strong>
              {formatScore(summary.totalScore)} / {summary.totalWeight}
            </strong>{" "}
            (Grade <strong>{summary.grade.grade}</strong>).
            <br />
            Once submitted the report will be forwarded to TVET Quality
            Assurance for verification and can no longer be edited. Do you want
            to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => setConfirmOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {loading ? "Submitting..." : "Confirm Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SelfAssessmentReport;
