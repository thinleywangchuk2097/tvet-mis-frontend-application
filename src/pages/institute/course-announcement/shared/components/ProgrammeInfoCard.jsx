import PropTypes from "prop-types";
import { Card, CardContent, Divider, Grid, Typography } from "@mui/material";
import { formatDate } from "../utils/traineeSelectionHelpers";

const InfoField = ({ label, value, color }) => (
  <Grid item size={{ xs: 12, md: 2 }}>
    <Typography variant="body2" color="textSecondary">
      {label}:
    </Typography>
    <Typography variant="body1" fontWeight="bold" color={color}>
      {value}
    </Typography>
  </Grid>
);

const ProgrammeInfoCard = ({
  title = "Programme Information",
  details,
  selectedCount,
}) => {
  if (!details) return null;
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <InfoField label="Application No" value={details.application_no} />
          <InfoField label="Programme Name" value={details.course_name} />
          <InfoField label="Total Seats" value={details.enrollment_capacity} />
          <InfoField
            label="Selected Count"
            value={selectedCount}
            color="green"
          />
          <InfoField
            label="Fees Per Trainee"
            value={`Nu. ${details.fees_per_trainee}`}
          />
          <InfoField
            label="Available Seats"
            value={(details.enrollment_capacity || 0) - selectedCount}
            color="primary"
          />
          {details.ca_start_date && (
            <InfoField
              label="CA Start Date"
              value={formatDate(details.ca_start_date)}
              color="primary"
            />
          )}
          {details.ca_end_date && (
            <InfoField
              label="CA End Date"
              value={formatDate(details.ca_end_date)}
              color="primary"
            />
          )}
          <Grid item size={{ xs: 12, md: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Certification Level:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {details.certification_name}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

ProgrammeInfoCard.propTypes = {
  title: PropTypes.string,
  details: PropTypes.object,
  selectedCount: PropTypes.number.isRequired,
};

export default ProgrammeInfoCard;