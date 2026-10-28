import apiClient from "../../../axios";

class BirmsPaymentService {
  generatePaymentAdvice(values, token) {
    return apiClient
      .post(`/api/v1/private/birms/payment/create-payment-advice-no`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  // Only one institute's payments (institute payment page)
  getPaymentDetailsByInstituteId(instituteId, token) {
    return apiClient
      .get(
        `/api/v1/private/birms/payment/get-payment-details-by-institute/${instituteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getAllPaymentDetails(token) {
    return apiClient
      .get(`/api/v1/private/birms/payment/get-all-payment-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getPaymentReceipt(receiptNo, token) {
    return apiClient
      .get(`/api/v1/private/birms/payment/get-payment-receipt/${receiptNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  makePaymentCancel(data, token) {
    return apiClient
      .post(`/api/v1/private/birms/payment/make-payment-cancel`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getCourseByInstituteId(instituteId, token) {
    return apiClient
      .get(`/api/v1/private/birms/payment/get-course-details/${instituteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => error);
  }

  getPaymentByApplicationNo(application_no, token) {
    return apiClient
      .get(
        `/api/v1/private/birms/payment/get-payment-details/${application_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then((response) => response)
      .catch((error) => error);
  }

  getPaymentByPaymentAdviceNo(payment_advice_no) {
    return apiClient
      .get(`/api/v1/public/birms/payment/get-payment/${payment_advice_no}`)
      .then((response) => response)
      .catch((error) => error);
  }

}

export default new BirmsPaymentService();
