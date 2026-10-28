// Shared helpers for the dashboards

export const fmtNum = (n) => Number(n || 0).toLocaleString("en-US");

export const headCellSx = {
  fontWeight: 600,
  color: "text.secondary",
  textTransform: "uppercase",
  fontSize: "0.7rem",
  letterSpacing: 0.4,
  bgcolor: "#fafafa",
  whiteSpace: "nowrap",
};
