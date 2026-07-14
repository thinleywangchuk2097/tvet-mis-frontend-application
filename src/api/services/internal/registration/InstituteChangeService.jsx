import apiClient from "../../../axios";

class InstituteChangeService {
  registerInstitute(values) {
    return apiClient
      .post(`/api/v1/public/institute-registration/submit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

 
}

export default new InstituteChangeService();
