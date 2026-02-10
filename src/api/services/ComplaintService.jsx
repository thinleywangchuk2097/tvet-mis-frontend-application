import apiClient from "../axios"
class ComplaintService {
 submitComplaint(data, token){
            return apiClient
            .post(`/api/v1/auth/complaint/submit`,data, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then((response) => response)
            .catch((error) => error);
    }

    getComplaintDetails(application_no, token) {
        return apiClient
            .get(`/api/v1/auth/complaint/get-complaint-details/${application_no}`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            })
            .then((response) => response)
            .catch((error) => error);
    }

    
}

export default new ComplaintService();