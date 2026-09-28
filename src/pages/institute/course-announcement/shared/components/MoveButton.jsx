import PropTypes from "prop-types";
import { Button, CircularProgress, Tooltip } from "@mui/material";

const MoveButton = ({
  onClick,
  disabled,
  color,
  icon,
  label,
  count,
  tooltip,
  moving,
}) => (
  <Tooltip title={tooltip || ""} arrow>
    <span>
      <Button
        variant="contained"
        color={color}
        onClick={onClick}
        disabled={disabled}
        startIcon={moving ? <CircularProgress size={20} /> : icon}
      >
        {moving ? "Moving..." : `${label} (${count})`}
      </Button>
    </span>
  </Tooltip>
);

MoveButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  color: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  tooltip: PropTypes.string,
  moving: PropTypes.bool,
};

export default MoveButton;