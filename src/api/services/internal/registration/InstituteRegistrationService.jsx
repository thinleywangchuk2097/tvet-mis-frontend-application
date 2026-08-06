import apiClient from "../../../axios";

class InstituteRegistrationService {
  registerInstitute(values) {
    return apiClient
      .post(`/api/v1/public/institute-registration/submit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

  getApplicationExistOrNot(application_no, service_id) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-application-status/${application_no}/${service_id}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteRegistrationDetails(application_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-institute-application-details/${application_no}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteDetails(registration_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-institute-details/${registration_no}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  verifyInstituteRegistration(data, token) {
    return apiClient
      .post(
        `/api/v1/public/institute-registration/verify-institute-registration`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteChangeDetails(registration_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-institute-change-details/${registration_no}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

   submitInstituteChange(values) {
    return apiClient
      .post(`/api/v1/public/institute-registration/change-institute`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

   getInstituteChangeByApplicationNo(application_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-change-institute/${application_no}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new InstituteRegistrationService();
