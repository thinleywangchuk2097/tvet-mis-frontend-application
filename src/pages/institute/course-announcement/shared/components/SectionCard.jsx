import PropTypes from "prop-types";
import { Card, CardContent, Divider, Typography } from "@mui/material";

const SectionCard = ({ title, children, sx }) => (
  <Card sx={{ mb: 3, ...sx }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default SectionCard;