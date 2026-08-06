import apiClient from "../../../axios";

class TrackApplicationStatusService {

  getApplicationStatusAuditCurrentTaskDtl(applicationNo, token) {
    return apiClient
      .get(`/api/v1/auth/tasklist/get-application-status-history/${applicationNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
 
}

export default new TrackApplicationStatusService();
