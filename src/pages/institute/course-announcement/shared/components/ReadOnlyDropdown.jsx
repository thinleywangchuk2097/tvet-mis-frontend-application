import PropTypes from "prop-types";
import { FormControl, MenuItem, Select } from "@mui/material";
import { disabledSelectSx } from "../utils/traineeSelectionStyles";

const ReadOnlyDropdown = ({
  value,
  placeholder = "Select Competency",
  academicCompetency = [],
  getCompetencyName,
}) => (
  <FormControl
    size="small"
    fullWidth
    sx={{ minWidth: 130, display: "flex", justifyContent: "center" }}
  >
    <Select
      value={value || ""}
      displayEmpty
      disabled
      renderValue={(selected) => {
        if (!selected || selected === "") {
          return <em style={{ color: "#9e9e9e" }}>{placeholder}</em>;
        }
        return getCompetencyName(selected);
      }}
      sx={disabledSelectSx}
    >
      <MenuItem value="" disabled>
        <em>{placeholder}</em>
      </MenuItem>
      {academicCompetency.map((competency) => (
        <MenuItem key={competency.id} value={competency.id}>
          {competency.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

ReadOnlyDropdown.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  academicCompetency: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
  getCompetencyName: PropTypes.func.isRequired,
};

export default ReadOnlyDropdown;