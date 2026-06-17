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
            .catch((error) => error);
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
            .catch((error) => error);
    }
}

export default new NcsService();