import apiClient from "../../../axios";


class GyalsungApiService {
    
  getGyalsungDetails(citizenshipNo) {
    return apiClient
      .get(
        `/api/v1/public/gyalsung/gyalsungDetails/${citizenshipNo}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  

}

export default new GyalsungApiService();
