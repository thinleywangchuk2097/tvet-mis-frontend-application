import apiClient from "../../../axios";
class TotService {
  submitTOTProgram(data, token) {
    return apiClient
      .post(`/api/v1/tot/submit-tot-program`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getToTPrograms(token) {
    return apiClient
      .get(`/api/v1/tot/get-tot-programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  deleteToTPrograms(id, token) {
    return apiClient
      .delete(`/api/v1/tot/delete-tot-program/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  submitTOTProgramAnnouncement(data, token) {
    return apiClient
      .post(`/api/v1/tot/submit-tot-announcement`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getToTProgramsAnnouncement(token) {
    return apiClient
      .get(`/api/v1/tot/get-tot-announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  deleteToTProgramsAnnouncement(id, token) {
    return apiClient
      .delete(`/api/v1/tot/delete-tot-announcement/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  applyTrainerToTOTProgram(data, token) {
    return apiClient
      .post(`/api/v1/tot/apply-trainer-to-tot-program`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },  
    })
      .then((response) => response)
      .catch((error) => error);
  } 

   getTrainerApplied(applicationNo, token) {
    return apiClient
      .get(
        `/api/v1/tot/get-trainer-applied/${applicationNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  saveTrainerSelection(data, token) {
    return apiClient
      .post(`/api/v1/tot/save-trainer-selection`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  saveModuleMarks(data, token) {
    return apiClient
      .post(`/api/v1/tot/save-module-marks`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getTrainerMarks(applicationNo, token) {
    return apiClient
      .get(`/api/v1/tot/get-trainer-marks/${applicationNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  generateCertificates(data, token) {
    return apiClient
      .post(`/api/v1/tot/generate-certificates`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  completeApplication(data, token) {
    return apiClient
      .post(`/api/v1/tot/complete-application`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteApplied(instituteId, token) {
    return apiClient
      .get(`/api/v1/tot/get-institute-applied/${instituteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // TOT programmes that have issued mark sheets (instituteId optional)
  getCertifiedPrograms(instituteId, token) {
    return apiClient
      .get(`/api/v1/tot/get-certified-programs`, {
        params: instituteId ? { instituteId } : {},
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // Read-only mark sheet data for the certified trainers of an application
  getCertificates(applicationNo, instituteId, token) {
    return apiClient
      .get(`/api/v1/tot/get-certificates/${encodeURIComponent(applicationNo)}`, {
        params: instituteId ? { instituteId } : {},
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new TotService();
