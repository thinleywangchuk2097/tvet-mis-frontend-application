import apiClient from "../../../axios";

class DatahubService {
  getDetailsByCitizenshipNo(citizenshipNo) {
    return apiClient
      .get(`/api/v1/public/datahub/citizendetails/${citizenshipNo}`, {})
      .then((response) => response)
      .catch((error) => error);
  }

  // TVET MIS info API (datahub): job seeker by CID
  getJobSeekerDetails(citizenshipNo) {
    return apiClient
      .get(
        `/api/v1/public/data/job-seeker-details/${encodeURIComponent(citizenshipNo)}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }

  // TVET MIS info API (datahub): foreign worker by work permit no
  getForeignWorkerDetails(workPermitNo) {
    return apiClient
      .get(
        `/api/v1/public/data/foreign-worker-details/${encodeURIComponent(workPermitNo)}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }

  // TVET MIS info API (datahub): employer by application no
  getEmployerDetails(applicationNo) {
    return apiClient
      .get(
        `/api/v1/public/data/employer-details/${encodeURIComponent(applicationNo)}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new DatahubService();
