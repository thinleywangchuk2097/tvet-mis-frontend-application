import apiClient from "../../../axios";


class ApplyAccreditedCourseService {
    
  submitAccreditedCourse(data, token) {
    return apiClient
      .post(`/api/v1/user/management/accredited-course/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

    getAccreditedCourseByApplicationNo(application_no, token) {
    return apiClient
      .get(
        `/api/v1/user/management/accredited-course/get-course-details/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
   getAccreditedCourseDetailsByUserId(user_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/accredited-course/get-application-details/${user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
   verifyAccreditedCourse(data, token) {
    return apiClient
      .post(
        `/api/v1/user/management/accredited-course/verify-accredited-course`,
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

   getAccreditedApprovedCourseByUserId (user_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/accredited-course/get-accredited-approved-course-details/${user_id}`,
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

export default new ApplyAccreditedCourseService();
