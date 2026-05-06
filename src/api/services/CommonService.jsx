import apiClient from "../axios";

class CommonService {
  getAllDzongkhags() {
    return apiClient
      .get("/api/v1/common/get-dzongkhags")
      .then((response) => response)
      .catch((error) => error);
  }

  getGewogByDzongkhagId(dzongkhagId) {
    return apiClient
      .get(`/api/v1/common/get-gewog/${dzongkhagId}`)
      .then((response) => response)
      .catch((error) => error);
  }

  getAllSectors() {
    return apiClient
      .get("/api/v1/common/get-sectors")
      .then((response) => response)
      .catch((error) => error);
  }
  getAllOccupations() {
    return apiClient
      .get("/api/v1/common/get-occupations")
      .then((response) => response)
      .catch((error) => error);
  }
  getAllQualitystandards(serviceId) {
    return apiClient
      .get(`/api/v1/common/get-quality-standards/${serviceId}`)
      .then((response) => response)
      .catch((error) => error);
  }
  getByParentId(parentId) {
    return apiClient
      .get(`/api/v1/common/get-child-dropdown/${parentId}`)
      .then((response) => response)
      .catch((error) => error);
  }

  getServiceName(Id) {
    return apiClient
      .get(`/api/v1/common/get-service-name/${Id}`)
      .then((response) => response)
      .catch((error) => error);
  }
  getOccupationsBySectorId(sectorId) {
    return apiClient
      .get(`/api/v1/common/get-occupations/${sectorId}`)
      .then((response) => response)
      .catch((error) => error);
  }

  getAllCourseAnnouncement() {
    return apiClient
      .get("/api/v1/common/get-announcement-application-details")
      .then((response) => response)
      .catch((error) => error);
  }
  getServiceNameCourseAnnouncement() {
    return apiClient
      .get("/api/v1/common/get-service-announcement")
      .then((response) => response)
      .catch((error) => error);
  }
  getCourseAnnouncementByApplicationNo(applicationNo) {
    return apiClient
      .get(`/api/v1/common/get-announcement-course/${applicationNo}`)
      .then((response) => response)
      .catch((error) => error);
  }

  getReAssessmentAnnouncementByApplicationNo(applicationNo) {
    return apiClient
      .get(
        `/api/v1/common/get-reassessment-announcement-course/${applicationNo}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }
  fetchDocument(fileName, upload_url) {
    return apiClient.get("/api/v1/common/download-document", {
      params: {
        upload_url,
        fileName,
      },
      responseType: "blob",
    });
  }
}

export default new CommonService();
