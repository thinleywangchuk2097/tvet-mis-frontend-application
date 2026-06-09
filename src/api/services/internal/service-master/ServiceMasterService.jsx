import apiClient from "../../../axios";

class ServiceMasterService {
  getAllServiceMasters(token) {
    return apiClient
      .get(`/api/v1/user/management/service-master/get-service-masters`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  submitServiceMaster(data, token) {
    return apiClient
      .post(`/api/v1/user/management/service-master/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateServiceMaster(data, token) {
    return apiClient
      .post(`/api/v1/user/management/service-master/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  
  deleteServiceMaster(serviceId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/service-master/delete/${serviceId}`,
        {},
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

export default new ServiceMasterService();
