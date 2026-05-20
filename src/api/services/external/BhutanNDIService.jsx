import apiClient from "../../axios";

class BhutanNDIService {
  createProofRequest(token) {
    return apiClient
      .post(`/api/v1/public/auth/ndi/create-proof-request`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  bhutanNDIAuthNatsResponse(data) {
    return apiClient
      .post(`/api/v1/public/auth/ndi/nats-response-auth`, data, {})
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new BhutanNDIService();
