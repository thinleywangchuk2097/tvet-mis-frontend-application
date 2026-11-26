import apiClient from "../../../axios";

class SectorOccupationService {
  // One sector with its occupations
  getSectorOccupationsBySector(sectorId, token) {
    return apiClient
      .get(
        `/api/v1/sector-occupation/get-sector-occupation-details/${sectorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getAllSectorOccupationsList(token) {
    return apiClient
      .get(
        `/api/v1/sector-occupation/get-sector-occupation-details`,
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
      .post(`/api/v1/sector-occupation/create`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  updateSectorWithOccupations(data, token) {
    return apiClient
      .post(`/api/v1/sector-occupation/update`, data, {
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
        `/api/v1/sector-occupation/delete/${sectorId}`,
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
