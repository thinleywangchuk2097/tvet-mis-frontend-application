import apiClient from "../../../axios";

class CertificationService {
  getAssessmentInstitutes(token) {
    return apiClient
      .get(`/api/v1/user/management/certificate/get-assessment-institutes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getAssessmentCourses(instituteId, token) {
    return apiClient
      .get(
        `/api/v1/user/management/certificate/get-assessement-courses/${instituteId}`,
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
export default new CertificationService();
