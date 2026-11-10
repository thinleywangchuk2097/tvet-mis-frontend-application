// src/utils/pdf/assessmentCertificatePdf.js
import { generateSingle, generateBulk } from "./pdfEngine";
import {
  renderAssessmentPage1,
  renderAssessmentPage2,
} from "./templates/assessmentTemplate";
import assessmentBg from "./assessment-bg.png";
import assessmentUnitsBg from "./assessment-units-bg.png";
import { CAMBRIA_FONTS } from "./fonts/cambriaFonts";

const PAGES = [
  { background: assessmentBg, render: renderAssessmentPage1 },
  { background: assessmentUnitsBg, render: renderAssessmentPage2 },
];

export const generateAssessmentCertificatePdf = (record) =>
  generateSingle(record, {
    pages: PAGES,
    fonts: CAMBRIA_FONTS,
    fileName: `Assessment_Certificate_${record?.cid_no || "record"}.pdf`,
  });

export const generateAllAssessmentCertificatesPdf = (records) =>
  generateBulk(records, {
    pages: PAGES,
    fonts: CAMBRIA_FONTS,
    fileName: `Assessment_Certificates_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`,
  });

// ---- Print version: same layout, no background image ----
// Used for printing the text onto pre-printed certificate templates.
const PRINT_PAGES = [
  { background: null, render: renderAssessmentPage1 },
  { background: null, render: renderAssessmentPage2 },
];

export const generateAssessmentCertificatePrintPdf = (record) =>
  generateSingle(record, {
    pages: PRINT_PAGES,
    fonts: CAMBRIA_FONTS,
    fileName: `Assessment_Certificate_Print_${record?.cid_no || "record"}.pdf`,
  });

export const generateAllAssessmentCertificatesPrintPdf = (records, fileName) =>
  generateBulk(records, {
    pages: PRINT_PAGES,
    fonts: CAMBRIA_FONTS,
    fileName:
      fileName ||
      `Assessment_Certificates_Print_${new Date().toISOString().split("T")[0]}.pdf`,
  });
