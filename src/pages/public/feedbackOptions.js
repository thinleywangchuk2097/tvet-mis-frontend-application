// Shared by the public Feedback/Complaint form and the logged-in Feedback & Complaints page

export const FB_CATEGORIES = [
  { id: "training", label: "Training quality" },
  { id: "institute", label: "Institute facilities" },
  { id: "assessor", label: "Assessor performance" },
  { id: "support", label: "Admin & support" },
  { id: "other", label: "Other" },
];

export const CP_CATEGORIES = [
  { id: "misconduct", label: "Staff misconduct" },
  { id: "negligence", label: "Negligence" },
  { id: "corruption", label: "Corruption / bribery" },
  { id: "harassment", label: "Harassment" },
  { id: "process", label: "Process failure" },
  { id: "other", label: "Other" },
];

export const URGENCY = [
  { id: "low", label: "Low", desc: "General concern", color: "#2e7d32" },
  { id: "medium", label: "Medium", desc: "Needs attention", color: "#f9a825" },
  { id: "high", label: "High", desc: "Urgent resolution", color: "#e65100" },
  { id: "critical", label: "Critical", desc: "Immediate action", color: "#c62828" },
];

export const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent" };

export const ROLES = ["Trainee", "Trainer", "Assessor", "Institute Staff", "Employer", "Other"];

export const STATUSES = [
  { id: "SUBMITTED", label: "Submitted", color: "#1565c0" },
  { id: "UNDER_REVIEW", label: "Under review", color: "#e65100" },
  { id: "RESOLVED", label: "Resolved", color: "#2e7d32" },
  { id: "REJECTED", label: "Rejected", color: "#78909c" },
];

export const labelOf = (list, id) => list.find((x) => x.id === id)?.label || id || "—";

// complaint attachments (same limits as the backend): any number of files,
// 10 MB each and 50 MB together
export const MAX_FILE_MB = 10;
export const MAX_TOTAL_MB = 50;
export const FILE_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"];

export const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
