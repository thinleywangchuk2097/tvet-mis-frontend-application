import apiClient from "../../../axios";

class TutorService {
  getAllTutors(instituteId, token) {
    return apiClient
      .get(`/api/v1/tutor/get-all-tutors/${instituteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  submitTutor(data, token) {
    return apiClient
      .post(`/api/v1/tutor/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateTutor(data, token) {
    return apiClient
      .post(`/api/v1/tutor/update`, data, {
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
        `/api/v1/tutor/delete/${tutorId}`,
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

  // Add Tutor workflow (service 57)
  getTutorByApplicationNo(applicationNo, token) {
    return apiClient
      .get(
        `/api/v1/tutor/get-tutor-by-application-no/${applicationNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  verifyTutor(data, token) {
    return apiClient
      .post(`/api/v1/tutor/verify-tutor`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new TutorService();
