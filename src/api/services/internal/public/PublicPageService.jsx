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
}

export default new PublicPageService();
