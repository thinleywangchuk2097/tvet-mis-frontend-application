import apiClient from "../../../axios";

class InstituteRegistrationRenewalService {
  resubmitInstitute(values) {
    return apiClient
      .post(`/api/v1/public/institute-registration/resubmit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

   getInstituteRenewalDetails(registration_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-registration/get-renewal-details/${registration_no}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

   getInstitutesRenewalStatus(registrationNo, token) {
    return apiClient
      .get(
        `/api/v1/user/management/monitoring/get-institutes-renewal-status/${registrationNo}`,
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

export default new InstituteRegistrationRenewalService();
