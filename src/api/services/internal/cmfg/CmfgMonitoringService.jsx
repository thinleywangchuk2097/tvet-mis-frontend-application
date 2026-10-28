import apiClient from "../../../axios";

class CmfgMonitoringService {
  submitMonitoring(data, token) {
    return apiClient
      .post(`/api/v1/user/management/cmfg-monitoring/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // Monitoring applications of the logged-in institute (userId = registration no)
  getMonitoringByUserId(userId, token) {
    return apiClient
      .get(`/api/v1/user/management/cmfg-monitoring/get-by-user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getMonitoringByApplicationNo(applicationNo, token) {
    return apiClient
      .get(
        `/api/v1/user/management/cmfg-monitoring/get-by-application-no/${applicationNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  // Reviewer action from the task list (verify)
  verifyMonitoring(data, token) {
    return apiClient
      .post(`/api/v1/user/management/cmfg-monitoring/verify`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new CmfgMonitoringService();
