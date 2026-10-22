// src/utils/pdf/assessmentCertificatePdf.js
import { generateSingle, generateBulk } from "./pdfEngine";
import {
  renderAssessmentPage1,
  renderAssessmentPage2,
} from "./templates/assessmentTemplate";
import assessmentBg from "./assessment-bg.png";
import assessmentUnitsBg from "./assessment-units-bg.png";

const PAGES = [
  { background: assessmentBg, render: renderAssessmentPage1 },
  { background: assessmentUnitsBg, render: renderAssessmentPage2 },
];

export const generateAssessmentCertificatePdf = (record) =>
  generateSingle(record, {
    pages: PAGES,
    fileName: `Assessment_Certificate_${record?.cid_no || "record"}.pdf`,
  });

export const generateAllAssessmentCertificatesPdf = (records) =>
  generateBulk(records, {
    pages: PAGES,
    fileName: `Assessment_Certificates_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`,
  });