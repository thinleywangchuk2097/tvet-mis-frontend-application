import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  TextField,
  Divider,
} from "@mui/material";
import { Download, AttachFile, Cancel } from "@mui/icons-material";
import FastForwardIcon from "@mui/icons-material/FastForward";
import TaskIcon from "@mui/icons-material/Task";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import ComplaintService from "../../api/services/ComplaintService";
import FileDownload from "../../components/File/FileDownload";

const ComplaintView = () => {
  const { application_no } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    const fetchComplaintDetails = async () => {
      if (!application_no || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await ComplaintService.getComplaintDetails(
          application_no,
          token
        );

        if (response.data?.length > 0) {
          const data = response.data[0];

          if (data.document_names && data.upload_urls) {
            const names = data.document_names.split(",");
            const urls = data.upload_urls.split(",");
            const documents = names.map((name, index) => ({
              name: name.trim(),
              url: urls[index]?.trim(),
            }));
            setComplaint({ ...data, documents });
          } else {
            setComplaint(data);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintDetails();
  }, [application_no, token]);

  if (loading) {
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

  return (
    <Paper
      elevation={1}
      sx={{
        p: 4,
        borderRadius: 3,
        width: "100%",
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        align="center"
        sx={{ mb: 4, letterSpacing: 0.3 }}
      >
        Complaint Details
      </Typography>

      {/* Applicant Information */}
      <Box
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Applicant Information
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={complaint.applicant_name || "N/A"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Email Address"
              value={complaint.emaild_id || "N/A"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Primary Phone"
              value={complaint.mobile_no || "N/A"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Alternate Phone"
              value={complaint.alternate_phone || "Not provided"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Address"
              value={complaint.address || "Address not provided"}
              slotProps={{ input: { readOnly: true } }}
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Complaint Information */}
      <Box
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Complaint Information
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Complaint Type"
              value={complaint.complaint_type || "N/A"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Category"
              value={complaint.category || "General"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Priority"
              value={complaint.priority_level || "Medium"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              value={complaint.description || "No description provided"}
              slotProps={{ input: { readOnly: true } }}
              multiline
              rows={3}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* System Information */}
      <Box
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          System Information
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Created Date"
              value={complaint.created_date || "N/A"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Last Updated"
              value={complaint.updated_date || "N/A"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Assigned To"
              value={complaint.assigned_to || "Not assigned"}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          </Grid>

          <Grid item size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Admin Remarks"
              value={complaint.admin_remarks || "No remarks added"}
              slotProps={{ input: { readOnly: true } }}
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Attachments */}
      <Box
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Attachments ({complaint.documents?.length || 0})
        </Typography>
        <Divider sx={{ my: 2 }} />

        <FileDownload initialFiles={complaint.documents || []} />
      </Box>

      {/* Actions */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Action
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<TaskIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Approve
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<FastForwardIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Forward
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ComplaintView;
