// src/pages/dwps/ojt/shared/FormField.jsx
import React from "react";
import { TextField, MenuItem } from "@mui/material";
import { requiredLabel } from "./utils.jsx";
import { formFieldPropTypes } from "./propTypes";

export const FormField = ({
  formik,
  name,
  label,
  type = "text",
  required = true,
  select = false,
  options = [],
  optionLabelKey = "name",
  onChangeMode = "handleChange",
  ...props
}) => {
  const handleChange =
    onChangeMode === "setFieldValue"
      ? (event) => formik.setFieldValue(name, event.target.value)
      : formik.handleChange;

  const fieldProps = {
    fullWidth: true,
    select,
    type,
    label: required ? requiredLabel(label) : label,
    name,
    size: "small",
    value: formik.values[name] || "",
    onChange: handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    ...props,
  };

  if (select) {
    return (
      <TextField {...fieldProps}>
        <MenuItem value="">-select-</MenuItem>
        {options.map((opt) => {
          const displayValue =
            opt[optionLabelKey] ||
            opt.name ||
            opt.firm_name ||
            opt.session_name ||
            opt.company_name ||
            opt.agreement_title ||
            opt.course_name ||
            opt.dzonkhagName ||
            opt.dzonkhag ||
            opt.label ||
            opt.id ||
            "Unknown";
          return (
            <MenuItem key={opt.id} value={String(opt.id)}>
              {displayValue}
            </MenuItem>
          );
        })}
      </TextField>
    );
  }

  return <TextField {...fieldProps} />;
};

FormField.propTypes = formFieldPropTypes;

export default FormField;