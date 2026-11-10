import PropTypes from "prop-types";
import { Box, Button, Chip, Grid, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";

// small grey label over a bold value (same style as the Programme Information card)
const PaymentField = ({ label, value, color }) => (
  <Grid item size={{ xs: 6, sm: 4, md: 2 }}>
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
      sx={{ fontSize: "0.92rem", fontWeight: 600, mt: 0.25, wordBreak: "break-word" }}
      color={color || "text.primary"}
    >
      {value}
    </Typography>
  </Grid>
);

PaymentField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
};

const PaymentStatusCard = ({
  paymentStatus,
  isPaymentCompleted,
  onRedirectToPayment,
  formatDate,
}) => {
  if (!paymentStatus) return null;

  const paid = isPaymentCompleted();
  const statusLabel = paymentStatus.paymentStatus
    ? paymentStatus.paymentStatus.charAt(0).toUpperCase() +
      paymentStatus.paymentStatus.slice(1)
    : "Pending";
  const amount =
    paymentStatus.totalPayableAmount !== null &&
    paymentStatus.totalPayableAmount !== undefined &&
    paymentStatus.totalPayableAmount !== ""
      ? `Nu. ${Number(paymentStatus.totalPayableAmount).toLocaleString("en-US")}`
      : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
        borderLeft: "4px solid",
        borderLeftColor: paid ? "success.main" : "warning.main",
      }}
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
          bgcolor: (t) =>
            alpha(paid ? t.palette.success.main : t.palette.warning.main, 0.07),
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <ReceiptLongOutlinedIcon
          fontSize="small"
          color={paid ? "success" : "warning"}
        />
        <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
          Payment Status
        </Typography>
        <Chip
          icon={paid ? <CheckCircleIcon /> : <ScheduleIcon />}
          label={statusLabel}
          color={paid ? "success" : "warning"}
          size="small"
          sx={{ ml: "auto", height: 24, fontWeight: 600 }}
        />
      </Box>

      <Box sx={{ p: 2 }}>
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
          {amount && (
            <PaymentField label="Amount" value={amount} color="primary.main" />
          )}
          {paymentStatus.paymentDueDate && (
            <PaymentField
              label="Due Date"
              value={formatDate(paymentStatus.paymentDueDate)}
            />
          )}
          {paymentStatus.paymentMode && (
            <PaymentField
              label="Payment Mode"
              value={paymentStatus.paymentMode}
            />
          )}
          {paymentStatus.platform && (
            <PaymentField label="Platform" value={paymentStatus.platform} />
          )}
        </Grid>

        {paymentStatus.redirectUrl && !paid && (
          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: "1px dashed",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Payment is pending. Complete it to continue with the assessment.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => onRedirectToPayment(paymentStatus.redirectUrl)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Proceed to Payment
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

PaymentStatusCard.propTypes = {
  paymentStatus: PropTypes.object,
  isPaymentCompleted: PropTypes.func.isRequired,
  onRedirectToPayment: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
};

export default PaymentStatusCard;
