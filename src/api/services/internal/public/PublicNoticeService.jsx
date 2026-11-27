import apiClient from "../../../axios";

// Public notices (home-page notice bar). TVET QC (role 22) creates / edits / deletes;
// the public page reads them through NotificationService.getPublicNotifications().
const URL = "/api/v1/tvetqc/public-notices";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

class PublicNoticeService {
  getNotices(token) {
    return apiClient.get(URL, auth(token)).then((r) => r).catch((e) => e);
  }

  createNotice(data, token) {
    return apiClient.post(URL, data, auth(token)).then((r) => r).catch((e) => e);
  }

  updateNotice(id, data, token) {
    return apiClient.put(`${URL}/${id}`, data, auth(token)).then((r) => r).catch((e) => e);
  }

  deleteNotice(id, token) {
    return apiClient.delete(`${URL}/${id}`, auth(token)).then((r) => r).catch((e) => e);
  }
}

export default new PublicNoticeService();
