import apiClient from "../../../axios";

class CommonBirmsPaymentService {

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

  
}

export default new CommonBirmsPaymentService();
