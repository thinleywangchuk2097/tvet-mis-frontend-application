import apiClient from "../axios";

class InstituteProposalService {
  submitInstituteProposal(values) {
    return apiClient
      .post(`/api/v1/public/institute-proposal/submit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteProposalByApplicationNo(application_no, token) {
    return apiClient
      .get(
        `/api/v1/public/institute-proposal/get-institute-details/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getInstituteDetailsByApplicationNo(application_no) {
    return apiClient
      .get(
        `/api/v1/public/institute-proposal/get-institute-details/${application_no}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  verifyInstituteProposal(data, token) {
    return apiClient
      .post(
        `/api/v1/public/institute-proposal/verify-institute-proposal`,
        data,
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

export default new InstituteProposalService();
