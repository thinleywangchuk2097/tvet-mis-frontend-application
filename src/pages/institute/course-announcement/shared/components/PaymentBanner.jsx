import PropTypes from "prop-types";
import { Box, Button, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "react-toastify";

const PaymentBanner = ({ paymentStatus, redirectUrl, paymentAdviceNo }) => {
  const status = paymentStatus?.toLowerCase();

  if (status === "pending") {
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "warning.light",
          border: "1px solid",
          borderColor: "warning.main",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography color="warning.dark">
          <strong>Payment Pending:</strong> Please complete your payment to
          proceed.
        </Typography>
        <Button
          variant="contained"
          color="warning"
          onClick={() => {
            if (redirectUrl) {
              window.open(redirectUrl, "_blank", "noopener,noreferrer");
              toast.info("Payment page opened in new tab");
            } else {
              toast.error("Payment URL not available");
            }
          }}
          startIcon={<OpenInNewIcon />}
        >
          Pay Now
        </Button>
      </Box>
    );
  }

  if (status === "paid") {
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "success.light",
          border: "1px solid",
          borderColor: "success.main",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography color="success.dark">
          <strong>Payment Status:</strong> Paid ✓
        </Typography>
        {paymentAdviceNo && (
          <Typography color="success.dark">
            <strong>Payment Advice No:</strong> {paymentAdviceNo}
          </Typography>
        )}
      </Box>
    );
  }

  return null;
};

PaymentBanner.propTypes = {
  paymentStatus: PropTypes.string,
  redirectUrl: PropTypes.string,
  paymentAdviceNo: PropTypes.string,
};

export default PaymentBanner;