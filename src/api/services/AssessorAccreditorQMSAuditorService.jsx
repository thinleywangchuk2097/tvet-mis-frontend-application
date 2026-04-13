import apiClient from "../axios";
class AssessorAccreditorQMSAuditorService {
  registerAssessorAccreditorQMSAuditor(values) {
    return apiClient
      .post(`/api/v1/public/register/submit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }
  getDetailsByApplicationNo(application_no, token) {
    return apiClient
      .get(
        `/api/v1/public/register/get-application-details/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
  
  verifyAssessorAccreditorQMSAuditor(data, token) {
    return apiClient
      .post(
        `/api/v1/public/register/verify-assessor-accreditor-qmsauditor`,
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

export default new AssessorAccreditorQMSAuditorService();
