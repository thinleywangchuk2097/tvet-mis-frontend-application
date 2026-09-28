// src/pages/dwps/ojt/shared/propTypes.js
import PropTypes from "prop-types";

export const statusChipPropTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  dropdownData: PropTypes.array,
};

export const employmentStatusChipPropTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  employmentStatuses: PropTypes.array,
};

export const documentLinksPropTypes = {
  documents: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  onDownload: PropTypes.func.isRequired,
  downloading: PropTypes.bool,
};

export const formFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
  select: PropTypes.bool,
  options: PropTypes.array,
  optionLabelKey: PropTypes.string,
};

export const reusableTablePropTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      field: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.array.isRequired,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  loading: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      icon: PropTypes.node,
      tooltip: PropTypes.string,
      color: PropTypes.string,
      onClick: PropTypes.func,
      disabled: PropTypes.func,
    }),
  ),
  emptyMessage: PropTypes.string,
};

export const deleteConfirmationDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  type: PropTypes.string,
  messages: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export const viewDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.any,
      multiline: PropTypes.bool,
      rows: PropTypes.number,
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export const addButtonPropTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export const formComponentPropTypes = {
  formik: PropTypes.shape({
    values: PropTypes.object.isRequired,
    errors: PropTypes.object,
    touched: PropTypes.object,
    handleChange: PropTypes.func.isRequired,
    handleBlur: PropTypes.func.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    resetForm: PropTypes.func,
    isValid: PropTypes.bool,
  }).isRequired,
  context: PropTypes.object.isRequired,
};