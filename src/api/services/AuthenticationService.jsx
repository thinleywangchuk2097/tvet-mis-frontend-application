import apiClient from "../axios";
class AuthenticationService {
  authenticateUser(values) {
    return apiClient
      .post(`/api/v1/auth/authenticate`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }
  
  handleLogout(token) {
    return apiClient
      .post(
        `/api/v1/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => (response))
      .catch((error) => (error));
  }

 
}

export default new AuthenticationService();