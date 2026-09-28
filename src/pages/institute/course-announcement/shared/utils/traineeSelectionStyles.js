export const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    padding: "8px",
  },
  "& th": {
    fontWeight: 600,
  },
};

export const tableStyleReassessment = {
  border: "1px solid",
  borderColor: "divider",
  tableLayout: "auto",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    padding: "8px",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    textAlign: "center",
  },
};

export const headerCellStyle = {
  fontWeight: 600,
  whiteSpace: "nowrap",
  fontSize: "0.8rem",
  padding: "8px",
  textAlign: "center",
};

export const bodyCellStyle = {
  whiteSpace: "nowrap",
  fontSize: "0.8rem",
  padding: "8px",
  verticalAlign: "middle",
  textAlign: "center",
};

export const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
  },
};

export const disabledSelectSx = {
  "& .MuiInputBase-root.Mui-disabled": {
    backgroundColor: "transparent",
  },
  "& .MuiSelect-select.Mui-disabled": {
    color: "text.primary !important",
    WebkitTextFillColor: "inherit !important",
    opacity: 1,
    textAlign: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0, 0, 0, 0.23)",
  },
};

export const disabledTextFieldSx = {
  minWidth: 100,
  "& .MuiInputBase-root.Mui-disabled": {
    backgroundColor: "transparent",
  },
  "& .MuiInputBase-input.Mui-disabled": {
    color: "text.primary !important",
    WebkitTextFillColor: "inherit !important",
    opacity: 1,
    textAlign: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0, 0, 0, 0.23)",
  },
};