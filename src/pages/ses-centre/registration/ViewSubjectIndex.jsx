import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";
import CommonService from "../../../api/services/internal/common/CommonService";

// Add Subject workflow (service 56):
// role 7 -> Verify (56) / Reject (58); role 22 -> Approve (57)
const STATUS = { VERIFY: 56, APPROVE: 57, REJECT: 58 };
const VERIFIER_ROLE_ID = 7;
const APPROVER_ROLE_ID = 22;
const ACADEMIC_QUALIFICATION_PARENT_ID = 18;

const STATUS_LABEL = {
  55: { label: "Submitted", color: "info" },
  56: { label: "Verified", color: "primary" },
  57: { label: "Approved", color: "success" },
  58: { label: "Rejected", color: "error" },
};

const ACTION_TEXT = {
  [STATUS.VERIFY]: {
    title: "Verify Subject",
    button: "Verify",
    color: "success",
  },
  [STATUS.APPROVE]: {
    title: "Approve Subject",
    button: "Approve",
    color: "success",
  },
  [STATUS.REJECT]: {
    title: "Reject Subject",
    button: "Reject",
    color: "error",
  },
};

const isError = (res) => res instanceof Error || res?.isAxiosError;

// read-only form field
const Field = ({ label, value, multiline = false }) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value === null || value === undefined || value === "" ? "" : value}
    placeholder="—"
    multiline={multiline}
    minRows={multiline ? 3 : undefined}
    slotProps={{
      input: { readOnly: true },
      inputLabel: { shrink: true },
    }}
  />
);

Field.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  multiline: PropTypes.bool,
};

const ViewSubjectIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = Number(
    useSelector((state) => state.auth.current_roleId),
  );
  const actionId = useSelector((state) => state.auth.id);
  const userId = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [classLevels, setClassLevels] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [subjectRes, levelRes] = await Promise.all([
      SubjectService.getSubjectByApplicationNo(applicationNo, access_token),
      CommonService.getByParentId(ACADEMIC_QUALIFICATION_PARENT_ID),
    ]);
    if (isError(subjectRes)) {
      toast.error("Failed to load the subject application");
    } else {
      const data = Array.isArray(subjectRes?.data)
        ? subjectRes.data[0]
        : subjectRes?.data;
      setSubject(data || null);
    }
    if (!isError(levelRes) && Array.isArray(levelRes?.data)) {
      setClassLevels(levelRes.data);
    }
    setLoading(false);
  }, [applicationNo, access_token]);

  useEffect(() => {
    load();
  }, [load]);

  const classLevelName =
    classLevels.find((c) => String(c.id) === String(subject?.class_level_id))
      ?.name || "";
  const statusId = Number(subject?.application_status_id);
  const status = STATUS_LABEL[statusId];

  // buttons only while the application is waiting for this role
  const canVerify = currentRoleId === VERIFIER_ROLE_ID && statusId === 55;
  const canApprove = currentRoleId === APPROVER_ROLE_ID && statusId === 56;

  const openDialog = (id) => {
    setSelectedStatusId(id);
    setRemarks("");
    setRemarksError("");
  };

  const closeDialog = () => {
    if (saving) return;
    setSelectedStatusId(null);
  };

  const handleConfirm = async () => {
    if (selectedStatusId === STATUS.REJECT && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection");
      return;
    }
    setSaving(true);
    const res = await SubjectService.verifySubject(
      {
        applicationNo,
        statusId: selectedStatusId,
        assignedRoleId: currentRoleId,
        userId,
        updatedBy: actionId,
        remarks: remarks.trim(),
      },
      access_token,
    );
    setSaving(false);
    if (isError(res) || res?.status >= 400) {
      toast.error(
        res?.response?.data?.message || "Failed to process the application",
      );
      return;
    }
    const done = {
      [STATUS.VERIFY]: "Subject verified successfully",
      [STATUS.APPROVE]: "Subject approved successfully",
      [STATUS.REJECT]: "Subject rejected successfully",
    };
    toast.success(done[selectedStatusId]);
    setSelectedStatusId(null);
    navigate("/tasklist/task-details-index");
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, m: 1, textAlign: "center" }}>
        <CircularProgress size={28} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading subject application...
        </Typography>
      </Paper>
    );
  }

  if (!subject) {
    return (
      <Paper sx={{ p: 3, m: 1, textAlign: "center" }}>
        <Typography>Subject application not found.</Typography>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 1, textTransform: "none" }}
        >
          Back
        </Button>
      </Paper>
    );
  }

  const action = ACTION_TEXT[selectedStatusId];

  return (
    <Paper sx={{ p: 2.5, m: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
          mb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Add Subject Application
        </Typography>
        {status && (
          <Chip
            size="small"
            label={status.label}
            color={status.color}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600} sx={{ mb: 1.5 }}>
          Subject Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Field label="Application No" value={subject.application_no} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Field label="SES Centre" value={subject.proposed_institute_name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Field label="Registration No" value={subject.registration_no} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Field label="Subject Name" value={subject.subject_name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Field label="Class Level" value={classLevelName} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Field
              label="Total Duration (Hours)"
              value={subject.total_duration_hours}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Field label="Description" value={subject.description} multiline />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        {canVerify && (
          <>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => openDialog(STATUS.VERIFY)}
              sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
            >
              Verify
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => openDialog(STATUS.REJECT)}
              sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
            >
              Reject
            </Button>
          </>
        )}
        {canApprove && (
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog(STATUS.APPROVE)}
            sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
          >
            Approve
          </Button>
        )}
      </Box>

      <Dialog
        open={Boolean(selectedStatusId)}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{action?.title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Subject: <strong>{subject.subject_name}</strong> (
            {subject.application_no})
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label={
              selectedStatusId === STATUS.REJECT
                ? "Remarks *"
                : "Remarks (optional)"
            }
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (remarksError) setRemarksError("");
            }}
            error={Boolean(remarksError)}
            helperText={remarksError}
          />
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={closeDialog}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color={action?.color || "primary"}
            onClick={handleConfirm}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {saving ? "Saving..." : `Confirm ${action?.button || ""}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ViewSubjectIndex;
