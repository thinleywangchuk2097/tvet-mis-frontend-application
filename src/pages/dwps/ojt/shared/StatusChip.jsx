// src/pages/dwps/ojt/shared/StatusChip.jsx
import React from "react";
import { Chip } from "@mui/material";
import { getStatusName, getStatusColor } from "./utils.jsx";
import { statusChipPropTypes } from "./propTypes";

export const StatusChip = ({ id, dropdownData }) => (
  <Chip
    label={getStatusName(id, dropdownData)}
    color={getStatusColor(id, dropdownData)}
    size="small"
  />
);

StatusChip.propTypes = statusChipPropTypes;

export default StatusChip;