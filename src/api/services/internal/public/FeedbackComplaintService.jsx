import apiClient from "../../../axios";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

class FeedbackComplaintService {
  // public, no login: returns { referenceNo, type }
  submit(data) {
    return apiClient
      .post("/api/v1/public/feedback-complaint", data, { timeout: 180000 })
      .then((r) => r)
      .catch((e) => e);
  }

  // any logged-in user
  getFeedback(token) {
    return apiClient.get("/api/v1/feedback-complaint/feedback", auth(token)).then((r) => r).catch((e) => e);
  }

  // TVET QC (role 22)
  getComplaints(token) {
    return apiClient.get("/api/v1/tvetqc/complaints", auth(token)).then((r) => r).catch((e) => e);
  }

  // TVET QC: an attachment as a Blob
  downloadAttachment(id, fileId, token) {
    return apiClient
      .get(`/api/v1/tvetqc/complaints/${id}/files/${fileId}`, { ...auth(token), responseType: "blob", timeout: 120000 })
      .then((r) => r)
      .catch((e) => e);
  }

  updateComplaint(id, data, token) {
    return apiClient.put(`/api/v1/tvetqc/complaints/${id}`, data, auth(token)).then((r) => r).catch((e) => e);
  }
}

export default new FeedbackComplaintService();
