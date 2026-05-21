import apiClient from "../axios";
class TotService {
    submitCourseAnnouncement(data, token) {
        return apiClient
            .post(`/api/v1/user/management/tot/tot-create`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => response)
            .catch((error) => error);
    }

    getCourseDetailsAnnouncementByUserId(token) {
        return apiClient
            .get(
                `/api/v1/user/management/tot/get-application-details`,
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

export default new TotService();