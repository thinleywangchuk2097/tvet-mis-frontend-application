import apiClient from "../axios";

class UserProfileService {
  updateUserProfile(data, token) {
    return apiClient
      .post(`/api/v1/user/management/user-profile/update-user-profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getUserProfile(userId, token) {
    return apiClient
      .get(`/api/v1/user/management/user-profile/get-user-profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getUserProfileImage(userId, token) {
    return apiClient
      .get(`/api/v1/user/management/user-profile/image/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'arraybuffer', // Important for binary data
      })
      .then((response) => response)
      .catch((error) => error);
  }

  changeUserPassword(data, token) {
    return apiClient
      .post(`/api/v1/user/password/auth-password/changePassword`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  forgotUserPassword(data, token) {
    return apiClient
      .post(`/api/v1/auth/public-password/forgot-password`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  reSetPasswordConfirmation(data) {
    return apiClient
      .post(`/api/v1/auth/public-password/reset-password`, data, {
       
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getUserAssociatedRoles(userId, token) {
    return apiClient
      .get(
        `/api/v1/user/management/user-profile/get-user-associated-roles/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => response)
      .catch((error) => error);
  }

  switchRole(data, token) {
    return apiClient
      .post(`/api/v1/user/management/user-profile/update-switch-role`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getUserNameCurrentRoleName(userId, token) {
    return apiClient
      .get(
        `/api/v1/user/management/user-profile/get-username-current-role/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new UserProfileService();
