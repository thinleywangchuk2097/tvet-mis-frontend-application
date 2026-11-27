import apiClient from "../../../axios";

class DwpsService {

  getDashboardData(userId, currentRoleId, token) {
    return apiClient
      .get(`/api/v1/dashboard/${userId}/${currentRoleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  
}

export default new DwpsService();
