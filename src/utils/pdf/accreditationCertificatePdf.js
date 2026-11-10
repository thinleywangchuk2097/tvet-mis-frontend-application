// src/utils/pdf/accreditationCertificatePdf.js
import { generateSingle, generateBulk } from "./pdfEngine";
import { renderAccreditation } from "./templates/accreditationTemplate";
import accreditationBg from "./accreditation-bg.png";
import { CAMBRIA_FONTS } from "./fonts/cambriaFonts";

const PAGES = [{ background: accreditationBg, render: renderAccreditation }];

export const generateAccreditationProgrammePdf = (record) =>
  generateSingle(record, {
    pages: PAGES,
    fonts: CAMBRIA_FONTS,
    fileName: `Accreditation_${record?.application_no || "record"}.pdf`,
  });

export const generateAllAccreditationProgrammesPdf = (records) =>
  generateBulk(records, {
    pages: PAGES,
    fonts: CAMBRIA_FONTS,
    fileName: `Accreditation_Programmes_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`,
  });