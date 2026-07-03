import apiClient from "../../../axios";

class NcsService {
    submitNcs(data, token) {
        return apiClient
            .post(`/api/v1/user/management/ncs/ncs-create`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => response)
            .catch((error) => {
                console.error("Error in submitNcs:", error);
                return error;
            });
    }

    updateNcs(id, data, token) {
        return apiClient
            .put(`/api/v1/user/management/ncs/ncs-update/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => response)
            .catch((error) => {
                console.error("Error in updateNcs:", error);
                return error;
            });
    }

    deleteNcs(id, token) {
        return apiClient
            .delete(`/api/v1/user/management/ncs/ncs-delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => response)
            .catch((error) => {
                console.error("Error in deleteNcs:", error);
                return error;
            });
    }

    getNcsDetails(token) {
        return apiClient
            .get(
                `/api/v1/user/management/ncs/get-application-details`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )
            .then((response) => response)
            .catch((error) => {
                console.error("Error in getNcsDetails:", error);
                return error;
            });
    }

    // ADD THIS METHOD - Download file by documentId
    downloadFile(documentId, token) {
        return apiClient
            .get(`/api/v1/user/management/ncs/download-file/${documentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob', // Important for file download
            })
            .then((response) => response)
            .catch((error) => {
                console.error("Error in downloadFile:", error);
                return error;
            });
    }
}

export default new NcsService();