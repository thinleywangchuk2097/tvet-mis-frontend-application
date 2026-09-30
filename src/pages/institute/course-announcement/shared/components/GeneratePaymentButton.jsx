import PropTypes from "prop-types";
import { Button, Tooltip } from "@mui/material";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";

const GeneratePaymentButton = ({
  onClick,
  disabled,
  canGenerate,
  hasPayment,
  loading,
}) => {
  const tooltipTitle = !canGenerate
    ? "CA Mark/Competency values are required for all selected trainees to generate payment"
    : hasPayment
      ? "Payment already generated"
      : "Generate Payment Advice";

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ManageHistoryIcon />}
          onClick={onClick}
          disabled={disabled || loading || !canGenerate || hasPayment}
          sx={{
            px: 3,
            py: 0.5,
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Generate PA
        </Button>
      </span>
    </Tooltip>
  );
};

GeneratePaymentButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  canGenerate: PropTypes.bool.isRequired,
  hasPayment: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
};

export default GeneratePaymentButton;