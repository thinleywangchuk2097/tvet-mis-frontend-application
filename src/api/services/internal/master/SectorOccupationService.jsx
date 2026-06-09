import apiClient from "../../../axios";

class SectorOccupationService {
  getAllSectorOccupationsList(token) {
    return apiClient
      .get(
        `/api/v1/user/management/sector-occupation/get-sector-occupation-details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
  submitSectorWithOccupations(data, token) {
    return apiClient
      .post(`/api/v1/user/management/sector-occupation/create`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  updateSectorWithOccupations(data, token) {
    return apiClient
      .post(`/api/v1/user/management/sector-occupation/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  deleteSectorWithOccupations(sectorId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/sector-occupation/delete/${sectorId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new SectorOccupationService();
