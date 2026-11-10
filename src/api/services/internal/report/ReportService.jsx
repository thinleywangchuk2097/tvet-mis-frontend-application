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
      .get(
        `/api/v1/user/management/report/get-institutes-registration-details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
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

  getRegistrationDetailsForCertificate(
    registration_type,
    application_no,
    token,
  ) {
    return apiClient
      .get(
        `/api/v1/user/management/report/get-registration-applicant-details/${registration_type}/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  // assessment report (marks / result) of the logged-in institute's trainees
  getInstituteAssessmentReport(registration_no, token) {
    return apiClient
      .get(
        `/api/v1/user/management/report/get-institute-assessment-report/${registration_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  // Certificate printing: competent trainees of all institutes
  getAllTraineesDetailsForCertificate(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-all-trainee-certificate-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTraineesDetailsForCertificate(registration_no, application_no, token) {
    return apiClient
      .get(
        `/api/v1/user/management/report/get-trainee-applicant-details/${registration_no}/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getAccreditedProgrammeDetailsForCertificate(registration_no, application_no, token) {
    return apiClient
      .get(
        `/api/v1/user/management/report/get-accredited-programme-details/${registration_no}/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  // Assessor / Accreditor / QMS Auditor registrations report
  getAssessorAccreditorAuditorReport(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-assessor-accreditor-auditor-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // BQF / RPL / Non-BQF programmes report
  getProgrammesReport(token) {
    return apiClient
      .get(`/api/v1/user/management/report/get-programmes-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new ReportService();
