import apiClient from "../axios";

class ApplyNonAccreditedCourseService {
    
  submitNonAccreditedCourse(data, token) {
    return apiClient
      .post(`/api/v1/user/management/non-accredited-course/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

   getNonAccreditedCourseByApplicationNo(application_no, token) {
    return apiClient
      .get(
        `/api/v1/user/management/non-accredited-course/get-course-details/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

   verifyNonAccreditedCourse(data, token) {
    return apiClient
      .post(
        `/api/v1/user/management/non-accredited-course/verify-non-accredited-course`,
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
   getNonAccreditedCourseDetailsByUserId(user_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/non-accredited-course/get-application-details/${user_id}`,
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

export default new ApplyNonAccreditedCourseService();
