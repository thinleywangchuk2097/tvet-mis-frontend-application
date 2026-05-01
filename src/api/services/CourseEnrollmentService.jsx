import apiClient from "../axios";

class CourseEnrollmentService {
  submitCourseAnnouncement(data, token) {
    return apiClient
      .post(`/api/v1/user/management/course-announcement/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getCourseDetailsAnnouncementByUserId(user_id, service_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/course-announcement/get-application-details/${user_id}/${service_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  submitTrainee(data) {
    return apiClient
      .post(`/api/v1/public/course-enrollment-trainee/submit`, data, {})
      .then((response) => response)
      .catch((error) => error);
  }

  getCourseAppliedTraineesByApplicationNo(application_no) {
    return apiClient
      .get(
        `/api/v1/public/course-enrollment-trainee/get-applicant-details/${application_no}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }

  selectedTrainee(data, token) {
    return apiClient
      .post(`/api/v1/public/course-enrollment-trainee/selected-trainees`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
   updateTraineeApplication(data, token) {
    return apiClient
      .post(`/api/v1/public/course-enrollment-trainee/update-trainees-application`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

   getFailedTraineeDetails(user_id) {
    return apiClient
      .get(
        `/api/v1/public/course-enrollment-trainee/get-trainee-details/${user_id}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }

   selectUnselectTrainee(data) {
    return apiClient
      .post(`/api/v1/public/course-enrollment-trainee/select-unselect-trainees`, data, {})
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new CourseEnrollmentService();
