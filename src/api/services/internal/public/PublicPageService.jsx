import apiClient from "../../../axios";

class PublicPageService {
  trackApplicationStatus(application_no) {
    return apiClient
      .get(`/api/v1/public/data/application-status/${application_no}`)
      .then((response) => response)
      .catch((error) => error);
  }

  getOngoingCourses() {
    return apiClient
      .get(`/api/v1/public/data/ongoing-courses`)
      .then((response) => response)
      .catch((error) => error);
  }

  getAllInstitutes() {
    return apiClient
      .get(`/api/v1/public/data/get-all-institutes`)
      .then((response) => response)
      .catch((error) => error);
  }

  getCourseBySector() {
    return apiClient
      .get(`/api/v1/public/data/get-course-by-sector`)
      .then((response) => response)
      .catch((error) => error);
  }
  getCourseAnnounceNotifications() {
    return apiClient
      .get(`/api/v1/public/data/get-course-announce-notifications`)
      .then((response) => response)
      .catch((error) => error);
  }
  // Headline figures for "TVET by the numbers"
  getHomeStats() {
    return apiClient
      .get(`/api/v1/public/data/home-stats`)
      .then((response) => response)
      .catch((error) => error);
  }
  // Public NCS publication list
  getNcsPublications() {
    return apiClient
      .get(`/api/v1/public/data/ncs-publications`)
      .then((response) => response)
      .catch((error) => error);
  }
  // Public curriculum publication list (Endorsed only)
  getCurriculumPublications() {
    return apiClient
      .get(`/api/v1/public/data/curriculum-publications`)
      .then((response) => response)
      .catch((error) => error);
  }
  // Public assessment result lookup by CID / reference no
  getAssessmentResultsByCid(cidNo) {
    return apiClient
      .get(`/api/v1/public/data/assessment-results/${encodeURIComponent(cidNo)}`)
      .then((response) => response)
      .catch((error) => error);
  }
  // Public trainer report (trainers added through AddTrainer)
  getPublicTrainers() {
    return apiClient
      .get(`/api/v1/public/data/trainers`)
      .then((response) => response)
      .catch((error) => error);
  }
  // Public "Courses Accredited" report
  getAccreditedCourses() {
    return apiClient
      .get(`/api/v1/public/data/accredited-courses`)
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new PublicPageService();
