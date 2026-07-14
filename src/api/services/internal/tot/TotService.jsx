import apiClient from "../../../axios";
class TotService {
  submitTOTProgram(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tot/submit-tot-program`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getToTPrograms(token) {
    return apiClient
      .get(`/api/v1/user/management/tot/get-tot-programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  deleteToTPrograms(id, token) {
    return apiClient
      .delete(`/api/v1/user/management/tot/delete-tot-program/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitTOTProgramAnnouncement(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tot/submit-tot-announcement`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getToTProgramsAnnouncement(token) {
    return apiClient
      .get(`/api/v1/user/management/tot/get-tot-announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  deleteToTProgramsAnnouncement(id, token) {
    return apiClient
      .delete(`/api/v1/user/management/tot/delete-tot-announcement/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  applyTrainerToTOTProgram(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tot/apply-trainer-to-tot-program`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },  
    })
      .then((response) => response)
      .catch((error) => error);
  } 
  


}

export default new TotService();
