import apiClient from "../../../axios";

class AddTrainerService {

  getAllTrainer(instituteId, token) {
    return apiClient
      .get(`/api/v1/user/management/trainer/get-all-trainer/${instituteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  // { exists, message }: already registered in this institute, or active at another institute?
  checkTrainerConflict(
    { citizenId, workPermitNo, instituteId, excludeId },
    token,
  ) {
    return apiClient
      .get(`/api/v1/user/management/trainer/check-duplicate`, {
        params: { citizenId, workPermitNo, instituteId, excludeId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // { found, message, data }: the institute's own active trainer with this CID
  findInstituteTrainer(citizenId, instituteId, token) {
    return apiClient
      .get(`/api/v1/user/management/trainer/institute-trainer`, {
        params: { citizenId, instituteId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitTrainer(data, token) {
    return apiClient
      .post(`/api/v1/user/management/trainer/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateTrainer(data, token) {
    return apiClient
      .post(`/api/v1/user/management/trainer/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  deleteTrainer(trainerId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/trainer/delete/${trainerId}`,
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

export default new AddTrainerService();
