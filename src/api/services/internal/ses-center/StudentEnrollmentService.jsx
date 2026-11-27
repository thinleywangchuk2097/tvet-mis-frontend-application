import apiClient from "../../../axios";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

class StudentEnrollmentService {
  getAllEnrollments(instituteId, token) {
    return apiClient
      .get(
        `/api/v1/student-enrollment/get-all-enrollments/${instituteId}`,
        auth(token),
      )
      .then((response) => response)
      .catch((error) => error);
  }

  submitEnrollment(data, token) {
    return apiClient
      .post(
        `/api/v1/student-enrollment/submit`,
        data,
        auth(token),
      )
      .then((response) => response)
      .catch((error) => error);
  }

  updateEnrollment(data, token) {
    return apiClient
      .post(
        `/api/v1/student-enrollment/update`,
        data,
        auth(token),
      )
      .then((response) => response)
      .catch((error) => error);
  }

  deleteEnrollment(id, token) {
    return apiClient
      .post(
        `/api/v1/student-enrollment/delete/${id}`,
        {},
        auth(token),
      )
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new StudentEnrollmentService();
