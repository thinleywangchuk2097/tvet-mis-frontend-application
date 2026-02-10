import apiClient from "../axios";

class UserRoleManagementService {
  createRole(data, token) {
    return apiClient
      .post(`/api/v1/user/management/create-role`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  editRole(data, token) {
    return apiClient
      .post(`/api/v1/user/management/edit-role-privileges`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  deleteRole(data, token) {
    return apiClient
      .post(`/api/v1/user/management/delete-role-privileges`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getAllPrivilegeRole(token) {
    return apiClient
      .get(`/api/v1/user/management/get-role-privileges`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getRoles(token) {
    return apiClient
      .get(`/api/v1/user/management/get-roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  createUser(data, token) {
    return apiClient
      .post(`/api/v1/user/management/create-user`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateUser(data, token) {
    return apiClient
      .post(`/api/v1/user/management/edit-user`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  deleteUser(data, token) {
    return apiClient
      .post(`/api/v1/user/management/delete-user`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getAllUsers(token) {
    return apiClient
      .get(`/api/v1/user/management/get-all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new UserRoleManagementService();
