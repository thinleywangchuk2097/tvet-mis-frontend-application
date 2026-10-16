export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getQualificationName = (qualificationId, qualificationMap) => {
  if (!qualificationId) return "N/A";
  return qualificationMap[qualificationId] || qualificationId;
};

export const getStatusName = (statusId, statusList) => {
  if (!statusId) return "Unknown";
  const status = statusList.find((s) => s.id === parseInt(statusId));
  return status ? status.name : "Unknown";
};

export const getResultStatusName = (resultStatusId, statusList) => {
  if (!resultStatusId) return "N/A";
  const status = statusList.find((s) => s.id === parseInt(resultStatusId));
  return status ? status.name : "Unknown";
};

export const getStatusColor = (statusId, statusList) => {
  const statusName = getStatusName(statusId, statusList).toLowerCase();
  if (statusName === "selected" || statusName === "approved")
    return { bgcolor: "#4caf50", color: "white" };
  if (statusName === "pending" || statusName === "submitted")
    return { bgcolor: "#ff9800", color: "white" };
  if (statusName === "rejected") return { bgcolor: "#f44336", color: "white" };
  if (statusName === "verified") return { bgcolor: "#2196f3", color: "white" };
  return { bgcolor: "#9e9e9e", color: "white" };
};

export const getResultStatusColor = (resultStatusId, statusList) => {
  const statusName = getResultStatusName(resultStatusId, statusList).toLowerCase();
  if (statusName === "passed") return { bgcolor: "#4caf50", color: "white" };
  if (statusName === "failed") return { bgcolor: "#f44336", color: "white" };
  if (statusName === "pending") return { bgcolor: "#ff9800", color: "white" };
  return { bgcolor: "#9e9e9e", color: "white" };
};

export const getCompetencyName = (competencyId, competencyMap) => {
  if (!competencyId) return "";
  return competencyMap[competencyId] || competencyId;
};