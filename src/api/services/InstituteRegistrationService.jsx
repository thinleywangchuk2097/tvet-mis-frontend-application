import apiClient from "../axios";
class InstituteRegistrationService {
  registerInstitute(values) {
    return apiClient
      .post(`/api/v1/public/institute-registration/submit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

   getApplicationExistOrNot(application_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-application-status/${application_no}`,
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
}

export default new InstituteRegistrationService();
