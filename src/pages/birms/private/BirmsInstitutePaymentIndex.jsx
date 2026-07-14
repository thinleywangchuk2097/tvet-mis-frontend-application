import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";


const BirmsInstitutePaymentIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);


  return <div>BirmsInstitutePaymentIndex</div>;
};

export default BirmsInstitutePaymentIndex;
