import apiClient from "../../../axios";

const BASE = "/api/v1/user/management/notification";
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// Calls return the axios response, or the error object on failure (same as the other services)
class NotificationService {
  getAllNotifications(token) {
    return apiClient
      .get(`${BASE}/get-all`, auth(token))
      .then((response) => response)
      .catch((error) => error);
  }

  createNotification(data, token) {
    return apiClient
      .post(`${BASE}/create`, data, auth(token))
      .then((response) => response)
      .catch((error) => error);
  }

  updateNotification(data, token) {
    return apiClient
      .put(`${BASE}/update`, data, auth(token))
      .then((response) => response)
      .catch((error) => error);
  }

  // notificationType 0 = public, 1 = registered users (userIds / roleIds)
  sendNotification(data, token) {
    return apiClient
      .put(`${BASE}/send`, data, auth(token))
      .then((response) => response)
      .catch((error) => error);
  }

  // header bell: notifications sent to this user or one of the user's roles
  getMyNotifications({ userId, id }, token) {
    return apiClient
      .get(`${BASE}/get-my-notifications`, {
        ...auth(token),
        params: { userId: userId || "", ...(id ? { id } : {}) },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // public page notices (no login needed)
  getPublicNotifications() {
    return apiClient
      .get(`/api/v1/public/notification/get-public`)
      .then((response) => response)
      .catch((error) => error);
  }

  deleteNotification(id, token) {
    return apiClient
      .delete(`${BASE}/delete/${id}`, auth(token))
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new NotificationService();
