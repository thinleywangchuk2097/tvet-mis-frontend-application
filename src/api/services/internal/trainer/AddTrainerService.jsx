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
