import apiClient from "../axios"

class TaskListService {

    getGroupTaskListDetails(taskStatusId,currentRoleId,locationId,token) {
        return apiClient
            .get(`/api/v1/auth/tasklist/get-group-tasklist-dtl/${taskStatusId}/${currentRoleId}/${locationId}`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }

     getMyTaskListDetails(userId,current_roleId,token) {
        return apiClient
            .get(`/api/v1/auth/tasklist/get-my-tasklist-dtl/${userId}/${current_roleId}`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }
    claimTask(data, token) {
    return apiClient
      .post(`/api/v1/auth/tasklist/claim-task`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }
   unclaimTask(data, token) {
    return apiClient
      .post(`/api/v1/auth/tasklist/unclaim-task`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

}


export default new TaskListService();