import apiClient from "../../../axios";

class SubjectService {
    
   getAllSubjects (instituteId, token) {
    return apiClient
      .get(
        `/api/v1/user/management/subject/get-all-subjects/${instituteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
  submitSubject(data, token) {
    return apiClient
      .post(`/api/v1/user/management/subject/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateSubject(data, token) {
    return apiClient
      .post(`/api/v1/user/management/subject/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  
  deleteSubject(subjectId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/subject/delete/${subjectId}`,
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

export default new SubjectService();
