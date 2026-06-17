import apiClient from "../../../axios";

class TuitionAnnouncementService {
    
   getAllTuitionAnnouncement (instituteId, token) {
    return apiClient
      .get(
        `/api/v1/user/management/tuition-announcement/get-all-tuition-announcements/${instituteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
  submitTuitionAnnouncement(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tuition-announcement/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateTuitionAnnouncement(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tuition-announcement/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  
  deleteTuitionAnnouncement(tuitionId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/tuition-announcement/delete/${tuitionId}`,
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

export default new TuitionAnnouncementService();
