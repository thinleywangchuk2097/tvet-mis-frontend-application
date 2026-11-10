import PropTypes from "prop-types";
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { formatDate } from "../utils/traineeSelectionHelpers";

// small grey label over a bold value
const InfoField = ({ label, value, color, size = { xs: 6, sm: 4, md: 2 } }) => (
  <Grid item size={size}>
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        color: "text.secondary",
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{ fontSize: "0.92rem", fontWeight: 600, mt: 0.25 }}
      color={color || "text.primary"}
    >
      {value === null || value === undefined || value === "" ? "—" : value}
    </Typography>
  </Grid>
);

InfoField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  size: PropTypes.object,
};

const ProgrammeInfoCard = ({
  title = "Programme Information",
  details,
  selectedCount,
}) => {
  if (!details) return null;

  const capacity = Number(details.enrollment_capacity) || 0;
  const available = Math.max(capacity - selectedCount, 0);
  const filledPct = capacity
    ? Math.min(100, Math.round((selectedCount / capacity) * 100))
    : 0;
  const fee =
    details.fees_per_trainee !== null &&
    details.fees_per_trainee !== undefined &&
    details.fees_per_trainee !== ""
      ? `Nu. ${Number(details.fees_per_trainee).toLocaleString("en-US")}`
      : null;

  return (
    <Paper
      variant="outlined"
      sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <SchoolOutlinedIcon color="primary" fontSize="small" />
        <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
          {title}
        </Typography>
        {details.application_no && (
          <Chip
            label={details.application_no}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ ml: "auto", height: 22, fontWeight: 600 }}
          />
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Programme */}
        <Typography
          sx={{ fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.3 }}
        >
          {details.course_name || "—"}
        </Typography>
        {details.certification_name && (
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
            {details.certification_name}
          </Typography>
        )}

        {/* Details */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <InfoField label="Fees per Trainee" value={fee} />
          <InfoField label="Total Seats" value={capacity} />
          <InfoField
            label="Selected"
            value={selectedCount}
            color="success.main"
          />
          <InfoField
            label="Available Seats"
            value={available}
            color={available === 0 ? "error.main" : "primary.main"}
          />
          {details.ca_start_date && (
            <InfoField
              label="CA Start Date"
              value={formatDate(details.ca_start_date)}
            />
          )}
          {details.ca_end_date && (
            <InfoField
              label="CA End Date"
              value={formatDate(details.ca_end_date)}
            />
          )}
        </Grid>

        {/* Seats filled */}
        {capacity > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 0.5,
              }}
            >
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                Seats filled
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                {selectedCount} / {capacity} ({filledPct}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={filledPct}
              color={filledPct >= 100 ? "error" : "primary"}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

ProgrammeInfoCard.propTypes = {
  title: PropTypes.string,
  details: PropTypes.object,
  selectedCount: PropTypes.number.isRequired,
};

export default ProgrammeInfoCard;
