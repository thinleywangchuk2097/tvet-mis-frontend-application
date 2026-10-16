// src/pages/dwps/ojt/shared/constants.js

export const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": { border: "1px solid", borderColor: "divider" },
};

export const STATUS_COLORS = {
  approve: "success",
  complete: "success",
  placed: "success",
  confirmed: "success",
  reject: "error",
  canceled: "error",
  cancel: "error",
  pending: "warning",
  scheduled: "warning",
  review: "warning",
};

export const EMPLOYMENT_COLORS = {
  Employed: "success",
  Unemployed: "error",
  Student: "info",
  Intern: "info",
  Contract: "warning",
  Probation: "secondary",
};

export const PARENT_ID_STATUS = 4;
export const PARENT_ID_EMPLOYMENT_STATUS = 17;