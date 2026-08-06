import apiClient from "../../../axios";

class CurriculumIndexService {
  submitCurriculum(data, token) {
    return apiClient
      .post(`/api/v1/user/management/curriculum/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getCurriculumDetailsByApplicationNo(application_no, token) {
    return apiClient
      .get(
        `/api/v1/user/management/curriculum/get-curriculum-details/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  verifyCurriculumDevelopment(data, token) {
    return apiClient
      .post(`/api/v1/user/management/curriculum/verify-curriculum`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getCurriculumDetailsByUserId(user_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/curriculum/get-curriculum-application-details/${user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getCurriculumById(curriculum_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/curriculum/get-curriculums-by-id/${curriculum_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getApprovedCurriculumDataByUserId(user_id, curriculum_type, token) {
    return apiClient
      .get(
        `/api/v1/user/management/curriculum/get-approved-curriculums/${user_id}/${curriculum_type}`,
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

export default new CurriculumIndexService();
