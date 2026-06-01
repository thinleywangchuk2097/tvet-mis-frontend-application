import apiClient from "../../../axios";

class GenerateTracerService {
  getTracerQuestionDropdownType(token) {
    return apiClient
      .get(`/api/v1/user/management/tracer/get-tracer-question-dropdown`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getParentTracerTypes(token) {
    return apiClient
      .get(`/api/v1/user/management/tracer/get-parent-tracer-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  saveTracerQuestions(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tracer/save-tracer-questions`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTracerAllApplications(token) {
    return apiClient
      .get(`/api/v1/user/management/tracer/get-all-tracers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTracerDetailsByApplicationNo(application_no, token) {
    return apiClient
      .get(`/api/v1/user/management/tracer/get-tracer/${application_no}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  sendTraineeTracerSurvey(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tracer/send-trainee-survey`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  sendEmployerTracerSurvey(data, token) {
    return apiClient
      .post(`/api/v1/user/management/tracer/send-employer-survey`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
 
  
}

export default new GenerateTracerService();
