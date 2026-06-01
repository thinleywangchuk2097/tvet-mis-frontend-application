import apiClient from "../../../axios";


class DatahubService {
    
  getDetailsByCitizenshipNo(citizenshipNo) {
    return apiClient
      .get(
        `/api/v1/public/datahub/citizendetails/${citizenshipNo}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  

}

export default new DatahubService();
