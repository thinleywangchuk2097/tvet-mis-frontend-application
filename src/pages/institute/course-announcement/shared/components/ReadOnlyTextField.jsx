import PropTypes from "prop-types";
import { TextField } from "@mui/material";
import { disabledTextFieldSx } from "../utils/traineeSelectionStyles";

const ReadOnlyTextField = ({ value }) => (
  <TextField
    type="number"
    size="small"
    value={value || ""}
    fullWidth
    disabled
    sx={disabledTextFieldSx}
  />
);

ReadOnlyTextField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ReadOnlyTextField;