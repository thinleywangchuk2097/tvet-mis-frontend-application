import apiClient from "../../../axios";

class BirmsPaymentService {
  generatePaymentAdvice(values) {
    return apiClient
      .post(
        `/api/v1/public/auth/birms/payment/create-payment-advice-no`,
        values,
        {},
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getPaymentByApplicationNo(application_no) {
    return apiClient
      .get(
        `/api/v1/public/auth/birms/payment/get-payment-details/${application_no}`,
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getAllPaymentDetails() {
    return apiClient
      .get(`/api/v1/public/auth/birms/payment/get-all-payment-details`)
      .then((response) => response)
      .catch((error) => error);
  }

  getPaymentReceipt(receiptNo) {
    return apiClient
      .get(`/api/v1/public/auth/birms/payment/get-payment-receipt/${receiptNo}`)
      .then((response) => response)
      .catch((error) => error);
  }

  makePaymentCancel(data) {
    return apiClient
      .post(`/api/v1/public/auth/birms/payment/make-payment-cancel`, data, {})
      .then((response) => response)
      .catch((error) => error);
  }
  
   getCourseByInstituteId(instituteId) {
    return apiClient
      .get(`/api/v1/public/auth/birms/payment/get-course-details/${instituteId}`)
      .then((response) => response)
      .catch((error) => error);
  }

   getPaymentByPaymentAdviceNo(payment_advice_no) {
    return apiClient
      .get(`/api/v1/public/auth/birms/payment/get-payment/${payment_advice_no}`)
      .then((response) => response)
      .catch((error) => error);
  }
}

export default new BirmsPaymentService();
