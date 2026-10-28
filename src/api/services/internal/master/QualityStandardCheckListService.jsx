import apiClient from "../../../axios";

const BASE = "/api/v1/user/management/quality_standard_check_list";

class QualityStandardCheckListService {
  // Services that have a checklist: [{ service_id, service_name }]
  getServices(token) {
    return apiClient
      .get(`${BASE}/get-services`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // All items (active + inactive) of a service, e.g. 55 = CMFG monitoring
  getByService(serviceId, token) {
    return apiClient
      .get(`${BASE}/get-by-service/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // Create (id null) or update a parent / sub parent / checklist item
  save(data, token) {
    return apiClient
      .post(`${BASE}/save`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  delete(id, token) {
    return apiClient
      .post(
        `${BASE}/delete/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new QualityStandardCheckListService();
