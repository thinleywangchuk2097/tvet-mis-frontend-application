import apiClient from "../axios";

class CommonService {
  getAllDzongkhags() {
    return apiClient
      .get("/api/v1/common/get-dzongkhags")
      .then((response) => response)
      .catch((error) => error);
  }

   fetchDocument(fileName, upload_url) {
    return apiClient.get("/api/v1/common/download-document", {
      params: {
        upload_url,
        fileName
      },
      responseType: "blob"
    });
  }
}

export default new CommonService();
