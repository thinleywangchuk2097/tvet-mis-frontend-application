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

  getServicesAssessementResult(token) {
    return apiClient
      .get(
        `/api/v1/user/management/accredited-course/get-services-assessement-result`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getProgrammesCertification(
    institute_id,
    service_id,
    certification_level_id,
    token,
  ) {
    return apiClient
      .get(
        `/api/v1/user/management/accredited-course/get-programmes-certification/${institute_id}/${service_id}/${certification_level_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getListPassTraineeForCertificatePrinting(
    application_no,
    institute_id,
    service_id,
    certification_level_id,
    programme_id,
    token,
  ) {
    return apiClient
      .get(
        `/api/v1/user/management/accredited-course/get-passed-trainee-certificate-printing`,
        {
          params: {
            applicationNo: application_no,
            instituteId: institute_id,
            serviceId: service_id,
            certificationLevelId: certification_level_id,
            programmeId: programme_id,
          },
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
