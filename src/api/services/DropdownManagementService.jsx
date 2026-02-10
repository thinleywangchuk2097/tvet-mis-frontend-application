import apiClient from "../axios"


class DropdownManagementService {
  
 createDropdown(data, token){
            return apiClient
            .post(`/api/v1/user/management/dropdown-management/create-dropdown`,data, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then((response) => response)
            .catch((error) => error);
}

updateDropdown(data, token){
            return apiClient
            .post(`/api/v1/user/management/dropdown-management/update-dropdown`,data, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then((response) => response)
            .catch((error) => error);
}

deleteDropdown(data, token){
            return apiClient
            .post(`/api/v1/user/management/dropdown-management/delete-dropdown`,data, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then((response) => response)
            .catch((error) => error);
}
 getAllDropdownLists(token) {
        return apiClient
            .get(`/api/v1/user/management/dropdown-management/get-dropdown-lists`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }


  
}

export default new DropdownManagementService();