import apiClient from "../axios";

class BhutanNDIService {
    createProofRequest(token){
        return apiClient
        .post(`/api/ndi/create-proof-request`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((response) => response)
        .catch((error) => error);
      }
      bhutanNDIAuthResponse(data) {
        return apiClient
          .post(`/api/ndi/nats-response-submit`, data, {})
          .then((response) => response)
          .catch((error) => error);
      }
      
}

export default new BhutanNDIService();