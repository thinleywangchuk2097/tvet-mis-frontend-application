import apiClient from "../../../axios";

class StudentService {
    
   getAllStudents (instituteId, token) {
    return apiClient
      .get(
        `/api/v1/user/management/student/get-all-students/${instituteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
  submitStudent(data, token) {
    return apiClient
      .post(`/api/v1/user/management/student/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  updateStudent(data, token) {
    return apiClient
      .post(`/api/v1/user/management/student/update`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  
  deleteStudent(studentId, token) {
    return apiClient
      .post(
        `/api/v1/user/management/student/delete/${studentId}`,
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

export default new StudentService();
