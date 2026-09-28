/**
 * Maps the raw API assessor list into UI-friendly objects.
 */
export const mapRegisteredAssessors = (rawAssessors) =>
  (rawAssessors || []).map((a) => ({
    id: a.id,
    userId: a.user_id,
    name: `${a.first_name} ${a.middle_name ? `${a.middle_name} ` : ""}${a.last_name}`,
    email: a.email_id,
    mobileNo: a.mobile_no,
    designation: a.current_role || "Assessor",
    location: a.location_id || "N/A",
  }));

/**
 * Combines assigned-assessor API records with the assessor master list.
 * Returns UI-ready assigned records.
 */
export const buildAssignedAssessorsWithDetails = (
  listAssigned,
  assessors,
  fallbackAssignedBy,
) =>
  (listAssigned || [])
    .map((assigned) => {
      const detail = assessors.find((a) => a.userId === assigned.user_id);
      if (!detail) return null;
      return {
        id: detail.id,
        userId: detail.userId,
        name: detail.name,
        email: detail.email,
        mobileNo: detail.mobileNo,
        designation: detail.designation || "Assessor",
        location: detail.location || "N/A",
        assignedDate: assigned.created_at || new Date().toISOString(),
        assignedBy: assigned.assigned_by || fallbackAssignedBy,
      };
    })
    .filter(Boolean);

/**
 * Assessors not yet assigned.
 */
export const getAvailableAssessors = (assessors, assigned) =>
  assessors.filter(
    (a) => !assigned.some((assignedItem) => assignedItem.id === a.id),
  );

/**
 * Builds the assignment record added to local state when the user clicks Add.
 */
export const buildAssignmentRecord = (assessorDetails, assignedBy) => ({
  id: assessorDetails.id,
  userId: assessorDetails.userId,
  name: assessorDetails.name,
  email: assessorDetails.email,
  mobileNo: assessorDetails.mobileNo,
  designation: assessorDetails.designation || "Assessor",
  location: assessorDetails.location || "N/A",
  assignedDate: new Date().toISOString(),
  assignedBy,
});