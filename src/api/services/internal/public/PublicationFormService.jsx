import apiClient from "../../../axios";

// Publications & Forms
//   public : list + download (no login)
//   tvetqc : create / edit / delete (TVET QC role 22 only)
const PUBLIC_URL = "/api/v1/public/publication-forms";
const TVETQC_URL = "/api/v1/tvetqc/publication-forms";

const auth = (token, extra = {}) => ({
  headers: { Authorization: `Bearer ${token}` },
  ...extra,
});

class PublicationFormService {
  // category: "PUBLICATION" | "FORM"
  getPublicDocuments(category) {
    return apiClient
      .get(PUBLIC_URL, { params: { category } })
      .then((response) => response)
      .catch((error) => error);
  }

  // Absolute URL of the file download (public endpoint)
  getDownloadUrl(id) {
    const base = (apiClient.defaults.baseURL || "").replace(/\/$/, "");
    return `${base}${PUBLIC_URL}/${id}/download`;
  }

  getDocuments(category, token) {
    return apiClient
      .get(TVETQC_URL, auth(token, { params: { category } }))
      .then((response) => response)
      .catch((error) => error);
  }

  createDocument(data, token) {
    return apiClient
      .post(TVETQC_URL, data, auth(token, { timeout: 120000 }))
      .then((response) => response)
      .catch((error) => error);
  }

  updateDocument(id, data, token) {
    return apiClient
      .put(`${TVETQC_URL}/${id}`, data, auth(token, { timeout: 120000 }))
      .then((response) => response)
      .catch((error) => error);
  }

  deleteDocument(id, token) {
    return apiClient
      .delete(`${TVETQC_URL}/${id}`, auth(token))
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new PublicationFormService();
