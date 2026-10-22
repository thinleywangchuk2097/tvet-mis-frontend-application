// src/utils/pdf/registrationCertificatePdf.js
import { generateSingle, generateBulk } from "./pdfEngine";
import { renderRegistration } from "./templates/registrationTemplate";
import registrationBg from "./registration-bg.png";

const PAGES = [{ background: registrationBg, render: renderRegistration }];

export const generateRegistrationCertificatePdf = (record) =>
  generateSingle(record, {
    pages: PAGES,
    fileName: `Registration_Certificate_${
      record?.registration_no || "record"
    }.pdf`,
  });

export const generateAllRegistrationCertificatesPdf = (records) =>
  generateBulk(records, {
    pages: PAGES,
    fileName: `Registration_Certificates_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`,
  });