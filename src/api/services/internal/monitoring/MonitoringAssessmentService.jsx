import apiClient from "../../../axios";

class MonitoringAssessmentService {
  getInstituteTypeDropdown(token) {
    return apiClient
      .get(`/api/v1/user/management/monitoring/get-institute-type`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteDropdown(service_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/monitoring/get-institutes-dropdown/${service_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new MonitoringAssessmentService();
