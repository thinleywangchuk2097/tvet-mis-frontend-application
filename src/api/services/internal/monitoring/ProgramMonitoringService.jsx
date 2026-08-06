import apiClient from "../../../axios";

class ProgramMonitoringService {
  getInstituteTypeDropdown(token) {
    return apiClient
      .get(`/api/v1/user/management/monitoring/get-institute-type`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getInstituteDropdown(service_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/monitoring/get-institutes-dropdown/${service_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }
  getCourseTypes(token) {
    return apiClient
      .get(`/api/v1/user/management/program-monitoring/get-service`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getCourseByInstituteId(institute_id, course_type_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/program-monitoring/get-courses/${institute_id}/${course_type_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  submitProgramMonitoring(data, token) {
    return apiClient
      .post(`/api/v1/user/management/program-monitoring/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getProgramMonitoring(user_id, token) {
    return apiClient
      .get(
        `/api/v1/user/management/program-monitoring/get-program-monitoring/${user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  updateProgramMonitoring(data, token) {
    return apiClient
      .post(`/api/v1/user/management/program-monitoring/verify`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

   getProgramMonitoringByApplicationNo(applicationNo, token) {
    return apiClient
      .get(
        `/api/v1/user/management/program-monitoring/get-program-monitoring-details/${applicationNo}`,
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

export default new ProgramMonitoringService();
