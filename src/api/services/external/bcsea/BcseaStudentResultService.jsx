import apiClient from "../../../axios";


class BcseaStudentResultService {
    
  getBcseaStudentResult(citizenshipNo) {
    return apiClient
      .get(
        `/api/v1/public/student/get-student-result-details/${citizenshipNo}`,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  

}

export default new BcseaStudentResultService();
