import apiClient from "../../../axios";

class InstituteDashboardService {
  // registrationNo = logged-in institute user id (state.auth.userId)
  getInstituteDashboard(registrationNo, token) {
    return apiClient
      .get(`/api/v1/user/management/dashboard/institute/${registrationNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // Staff dashboards (e.g. QAS Level 1 = role 7). Dates: yyyy-MM-dd (optional)
  getRoleOverview(roleId, fromDate, toDate, token) {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return apiClient
      .get(`/api/v1/user/management/dashboard/role-overview/${roleId}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // Admin: users, roles, dropdowns, services, open tasks per role
  getAdminOverview(fromDate, toDate, token) {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return apiClient
      .get(`/api/v1/user/management/dashboard/admin-overview`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new InstituteDashboardService();
