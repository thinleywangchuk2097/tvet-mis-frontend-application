import apiClient from "../../../axios";

class NcsService {
  submitNcs(data, token) {
    return apiClient
      .post(`/api/v1/user/management/ncs/ncs-create`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error in submitNcs:", error);
        return error;
      });
  }

  updateNcs(id, data, token) {
    return apiClient
      .put(`/api/v1/user/management/ncs/ncs-update/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error in updateNcs:", error);
        return error;
      });
  }

  getNcsDetails(token) {
    return apiClient
      .get(`/api/v1/user/management/ncs/get-ncs-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error in getNcsDetails:", error);
        return error;
      });
  }

  getAlreadyNcsDetailsExist(sector_id, occupation_id, certification_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/ncs/get-ncs-already-exist/${sector_id}/${occupation_id}/${certification_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => {
        console.error("Error in getAlreadyNcsDetailsExist:", error);
        return error;
      });
  }

  getProgrammeTitleById(programme_id, token) {
    return apiClient
      .get(`/api/v1/user/management/ncs/get-programme-title/${programme_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error in getProgrammeTitleById:", error);
        return error;
      });
  }
}

export default new NcsService();
