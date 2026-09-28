import PropTypes from "prop-types";
import { TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { textFieldStyle } from "../utils/traineeSelectionStyles";

const TraineeSearchField = ({ label, value, onChange }) => (
  <TextField
    label={label}
    variant="outlined"
    size="small"
    fullWidth
    value={value}
    onChange={onChange}
    sx={{ mb: 2, ...textFieldStyle }}
    slotProps={{
      input: {
        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
      },
    }}
  />
);

TraineeSearchField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default TraineeSearchField;