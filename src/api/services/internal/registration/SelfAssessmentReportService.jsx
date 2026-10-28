import apiClient from "../../../axios";

const BASE_URL = "/api/v1/user/management/self-assessment-report";

class SelfAssessmentReportService {
  submitSelfAssessmentReport(data, token) {
    return apiClient
      .post(`${BASE_URL}/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      })
      .then((response) => response)
      .catch((error) => error);
  }

  saveDraftSelfAssessmentReport(data, token) {
    return apiClient
      .post(`${BASE_URL}/save-draft`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  verifySelfAssessmentReport(data, token) {
    return apiClient
      .post(`${BASE_URL}/verify-self-assessment-report`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getSelfAssessmentReportByApplicationNo(application_no, token) {
    return apiClient
      .get(`${BASE_URL}/get-report-details/${application_no}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getSelfAssessmentReportsByUserId(user_id, token) {
    return apiClient
      .get(`${BASE_URL}/get-application-details/${user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getBasicInformationByUserId(user_id, token) {
    return apiClient
      .get(`${BASE_URL}/get-basic-information/${user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getBasicInformationByInstituteId(institute_id, token) {
    return apiClient
      .get(`${BASE_URL}/get-basic-information-by-institute/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getActiveSelfAssessmentReport(institute_id, token) {
    return apiClient
      .get(`${BASE_URL}/get-active-report/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new SelfAssessmentReportService();
