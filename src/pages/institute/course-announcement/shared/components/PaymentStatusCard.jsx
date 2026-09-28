import PropTypes from "prop-types";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";

const PaymentField = ({ label, value, color }) => (
  <Grid item size={{ xs: 12, md: 3 }}>
    <Typography variant="body2" color="textSecondary">
      {label}:
    </Typography>
    <Typography variant="body1" fontWeight="bold" color={color}>
      {value}
    </Typography>
  </Grid>
);

const PaymentStatusCard = ({
  paymentStatus,
  isPaymentCompleted,
  onRedirectToPayment,
  formatDate,
}) => {
  if (!paymentStatus) return null;

  const paid = isPaymentCompleted();

  return (
    <Card sx={{ mb: 3, bgcolor: paid ? "#e8f5e9" : "#fff3e0" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Payment Status
          </Typography>
          <Chip
            label={paymentStatus.paymentStatus || "Pending"}
            color={paid ? "success" : "warning"}
            size="small"
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {paymentStatus.paymentAdviceNo && (
            <PaymentField
              label="Payment Advice No"
              value={paymentStatus.paymentAdviceNo}
            />
          )}
          {paymentStatus.refNo && (
            <PaymentField label="Reference No" value={paymentStatus.refNo} />
          )}
          {paymentStatus.totalPayableAmount && (
            <PaymentField
              label="Amount"
              value={`Nu. ${paymentStatus.totalPayableAmount}`}
              color="primary"
            />
          )}
          {paymentStatus.paymentDueDate && (
            <PaymentField
              label="Due Date"
              value={formatDate(paymentStatus.paymentDueDate)}
            />
          )}
          {paymentStatus.paymentMode && (
            <PaymentField label="Payment Mode" value={paymentStatus.paymentMode} />
          )}
          {paymentStatus.platform && (
            <PaymentField label="Platform" value={paymentStatus.platform} />
          )}
        </Grid>
        {paymentStatus.redirectUrl && !paid && (
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => onRedirectToPayment(paymentStatus.redirectUrl)}
            >
              Proceed to Payment
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

PaymentStatusCard.propTypes = {
  paymentStatus: PropTypes.object,
  isPaymentCompleted: PropTypes.func.isRequired,
  onRedirectToPayment: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
};

export default PaymentStatusCard;