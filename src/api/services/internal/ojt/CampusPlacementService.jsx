import apiClient from "../../../axios";


class CampusPlacementService {
    
 submitPlacementSession(data, token) {
    return apiClient
      .post(`/api/v1/user/management/campus-placement/submit-session`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getPlacementSessionByInstituteId(institute_id, token) {
    return apiClient
      .get(`/api/v1/user/management/campus-placement/get-session/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitFirm(data, token) {
    return apiClient
      .post(`/api/v1/user/management/campus-placement/submit-firm`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getFirmByInstituteId(institute_id, token) {
    return apiClient
      .get(`/api/v1/user/management/campus-placement/get-firm/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitPlacementTrainee(data, token) {
    return apiClient
      .post(`/api/v1/user/management/campus-placement/submit-trainee`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTraineeByInstituteId(institute_id, token) {
    return apiClient
      .get(`/api/v1/user/management/campus-placement/get-trainee/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

    getTraineeOnPlacementReport(token) {
    return apiClient
      .get(`/api/v1/user/management/campus-placement/get-trainee-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  

}

export default new CampusPlacementService();
