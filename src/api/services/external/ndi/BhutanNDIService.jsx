import apiClient from "../../../axios";

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

  // NEW — poll the backend for the NATS auth result by threadId
  getNatsAuthResult(threadId) {
    return apiClient
      .get(`/api/v1/public/auth/ndi/nats-auth-result/${threadId}`, {})
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new BhutanNDIService();
