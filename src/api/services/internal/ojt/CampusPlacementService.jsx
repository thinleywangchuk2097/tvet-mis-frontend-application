import apiClient from "../../../axios";


class CampusPlacementService {
    
  submitOnJobTraining(data, token) {
    return apiClient
      .post(`/api/v1/user/management/campus-placement/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }


  

}

export default new CampusPlacementService();
