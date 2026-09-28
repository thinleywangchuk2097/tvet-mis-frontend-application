// src/pages/dwps/ojt/shared/EmploymentStatusChip.jsx
import React from "react";
import { Chip } from "@mui/material";
import {
  getEmploymentStatusName,
  getEmploymentStatusColor,
} from "./utils.jsx";
import { employmentStatusChipPropTypes } from "./propTypes";

export const EmploymentStatusChip = ({ id, employmentStatuses }) => {
  const name = getEmploymentStatusName(id, employmentStatuses);
  return (
    <Chip
      label={name}
      color={id ? getEmploymentStatusColor(name) : "default"}
      size="small"
    />
  );
};

EmploymentStatusChip.propTypes = employmentStatusChipPropTypes;

export default EmploymentStatusChip;