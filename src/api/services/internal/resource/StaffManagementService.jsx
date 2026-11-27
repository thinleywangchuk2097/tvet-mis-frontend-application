import apiClient from "../../../axios";

class StaffManagementService {
  submitStaff(data, token) {
    return apiClient
      .post(`/api/v1/resource-management/submit-staff`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  // { exists, message }: is this CID / reference no already staff of the institute?
  checkStaffDuplicate({ instituteId, citizenId, referenceNo, excludeId }, token) {
    return apiClient
      .get(`/api/v1/resource-management/check-staff-duplicate`, {
        params: { instituteId, citizenId, referenceNo, excludeId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  getInstituteStaff(instituteId, token) {
    return apiClient
      .get(
        `/api/v1/resource-management/get-staff/${instituteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

   editStaff(data, token) {
    return apiClient
      .post(`/api/v1/resource-management/edit-staff`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
  deleteStaff(id, token) {
    return apiClient
      .delete(`/api/v1/resource-management/staff/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new StaffManagementService();
