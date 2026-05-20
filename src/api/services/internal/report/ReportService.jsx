import apiClient from "../../../axios";

class ReportService {

  courseServiceType(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-course-service-type`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getAllInstitutes(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-institutes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getcourseData(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-course-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getInstitutesProposalType(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-institutes-proposal-type`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteRegistrationType(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-institutes-registration-type`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

   getInstitutesProposalDetails(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-institutes-proposal-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getInstitutesRegistrationDetails(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-institutes-registration-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getInstitutesTraineesDetails(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-institutes-trainees-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  
}

export default new ReportService();
