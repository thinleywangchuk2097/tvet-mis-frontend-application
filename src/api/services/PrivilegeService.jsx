import apiClient from "../axios"

class PrivilegeService {

    getPrivileges(roleId, token) {
        return apiClient
            .get(`/api/v1/auth/privilege/menu-lists/${roleId}`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }
    getParentPrivileges(token) {
        return apiClient
            .get(`/api/v1/auth/privilege/parent-privileges-lists`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }
    getChildPrivileges(parentId, token) {
        return apiClient
            .get(`/api/v1/auth/privilege/child-privileges-lists/${parentId}`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }

}


export default new PrivilegeService();