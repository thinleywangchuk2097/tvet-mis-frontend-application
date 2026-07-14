import apiClient from "../../../axios";

class OJTService {
  submitOJTCompany(data, token) {
    return apiClient
      .post(`/api/v1/user/management/ojt/submit-company`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getCompanyByInstituteId(institute_id, token) {
    return apiClient
      .get(`/api/v1/user/management/ojt/get-company/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitOJTAgrement(data, token) {
    return apiClient
      .post(`/api/v1/user/management/ojt/submit-agreement`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getAgreementByInstituteId(institute_id, token) {
    return apiClient
      .get(`/api/v1/user/management/ojt/get-agreement/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitOJTTrainee(data, token) {
    return apiClient
      .post(`/api/v1/user/management/ojt/submit-trainee`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTraineeByInstituteId(institute_id, token) {
    return apiClient
      .get(`/api/v1/user/management/ojt/get-trainee/${institute_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTraineeOJTReport(token) {
    return apiClient
      .get(`/api/v1/user/management/ojt/get-trainee-ojt-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new OJTService();
