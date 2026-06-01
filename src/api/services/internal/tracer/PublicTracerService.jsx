import apiClient from "../../../axios";
class PublicTracerService {
  getSurveyByUniqueId(uniqueId) {
    return apiClient
      .get(`/api/v1/public/tracer/survey/${uniqueId}`)
      .then((response) => response)
      .catch((error) => error);
  }
  getTracerDetailsByApplicationNo(applicationNo) {
    return apiClient
      .get(`/api/v1/public/tracer/get-tracer/${applicationNo}`)
      .then((response) => response)
      .catch((error) => error);
  }
  getTracerQuestionDropdownType() {
    return apiClient
      .get(`/api/v1/public/tracer/get-tracer-question-dropdown`)
      .then((response) => response)
      .catch((error) => error);
  }
  submitSurveyResponses(data) {
    return apiClient
      .post(`/api/v1/public/tracer/submit-survey-response`, data)
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new PublicTracerService();
