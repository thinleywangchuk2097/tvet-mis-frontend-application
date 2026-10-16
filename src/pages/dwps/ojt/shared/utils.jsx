// src/pages/dwps/ojt/shared/utils.jsx
import React from "react";
import { Typography } from "@mui/material";
import { STATUS_COLORS, EMPLOYMENT_COLORS } from "./constants";

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result.split(",")[1],
        contentType: file.type || "application/octet-stream",
      });
    reader.onerror = reject;
  });

export const requiredLabel = (label) => (
  <>
    {label}
    <Typography component="span" sx={{ color: "red" }}>
      *
    </Typography>
  </>
);

export const getStatusName = (id, dropdownData) =>
  dropdownData.find((s) => s.id === parseInt(id))?.name || "Pending";

export const getStatusColor = (id, dropdownData) => {
  const name = getStatusName(id, dropdownData)?.toLowerCase() || "";
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (name.includes(key)) return color;
  }
  return "default";
};

export const getEmploymentStatusName = (id, employmentStatuses) =>
  employmentStatuses.find((s) => String(s.id) === String(id))?.name ||
  "Not Set";

export const getEmploymentStatusColor = (name) =>
  EMPLOYMENT_COLORS[name] || "default";

export const getDzongkhagName = (id, dzongkhags) => {
  if (!id) return "N/A";
  const found = dzongkhags.find((d) => {
    const dId = d.id || d.dzonkhagId;
    return String(dId) === String(id);
  });
  return found?.dzonkhagName || found?.name || found?.dzonkhag || "N/A";
};

export const getDocumentLinks = (str) => {
  try {
    return str
      ? JSON.parse(str).map((d) => ({
          id: d.id,
          name: d.documentName,
          url: d.url,
        }))
      : [];
  } catch {
    return [];
  }
};
