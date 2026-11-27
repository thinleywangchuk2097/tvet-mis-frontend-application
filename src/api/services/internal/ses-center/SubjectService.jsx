import apiClient from "../../../axios";

class SubjectService {
    
   getAllSubjects (instituteId, token) {
    return apiClient
      .get(
        `/api/v1/subject/get-all-subjects/${instituteId}`,
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
      .post(`/api/v1/subject/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateSubject(data, token) {
    return apiClient
      .post(`/api/v1/subject/update`, data, {
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
        `/api/v1/subject/delete/${subjectId}`,
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

  // Add Subject workflow (service 56)
  getSubjectByApplicationNo(applicationNo, token) {
    return apiClient
      .get(
        `/api/v1/subject/get-subject-by-application-no/${applicationNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  verifySubject(data, token) {
    return apiClient
      .post(`/api/v1/subject/verify-subject`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new SubjectService();
