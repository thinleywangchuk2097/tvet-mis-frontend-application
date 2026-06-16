import apiClient from "../../../axios";

class TutorService {
  getAllTutors(instituteId, token) {
    return apiClient
      .get(`/api/v1/user/management/tutor/get-all-tutors/${instituteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  submitTutor(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tutor/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateTutor(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tutor/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  deleteTutor(tutorId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/tutor/delete/${tutorId}`,
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
  getTutor(institute_id, subject_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/tutor/get-tutor/${institute_id}/${subject_id}`,
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

export default new TutorService();
