import apiClient from "../axios";

class InstituteProposalService {

   submitInstituteProposal(values) {
    return apiClient
      .post(`/api/v1/public/institute-proposal/submit`, values, {})
      .then((response) => response)
      .catch((error) => error);
  }

}

export default new InstituteProposalService();
