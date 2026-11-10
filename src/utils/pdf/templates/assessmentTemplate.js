// src/utils/pdf/templates/assessmentTemplate.js
// Layout follows the BQPCA certificate templates (Certificate Level, Diploma, RPL).
// All positions are in mm on A4; y values are text baselines.

/** Service IDs that use the RPL wording on page 1. */
const RPL_SERVICE_IDS = [39, 41];

/** Diploma certificate levels — these get the "Statement of Marks" table. */
const DIPLOMA_LEVEL_IDS = [111, 112];

/** Certificate font (registered in assessmentCertificatePdf.js). */
const FONT = "Cambria";

const BODY_SIZE = 14; // running text
const VALUE_SIZE = 16; // name, CID, programme title
const RESULT_SIZE = 18; // COMPETENT
const FOOTER_SIZE = 10; // Certificate No / Issued in / Assessment Venue (fits left of the signature)
const MARKS_SIZE = 13; // Statement of Marks

const LEFT_X = 25.4; // page-2 text margin
const RIGHT_X = 188.4; // page-2 right edge (unit codes are right-aligned here)
const FOOTER_X = 23.3;

const TEXT = [0, 0, 0];

// ==================== HELPERS ====================

/** Centered text line. */
const centerText = (doc, text, y, { size = BODY_SIZE, bold = false } = {}) => {
  doc.setFont(FONT, bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...TEXT);
  doc.text(String(text ?? ""), doc.internal.pageSize.getWidth() / 2, y, {
    align: "center",
  });
};

/** Centered line: normal prefix + bold value (value may be larger). */
const centerPrefixValue = (doc, prefix, value, y) => {
  doc.setFont(FONT, "normal");
  doc.setFontSize(BODY_SIZE);
  const prefixWidth = doc.getTextWidth(prefix);
  doc.setFont(FONT, "bold");
  doc.setFontSize(VALUE_SIZE);
  const valueWidth = doc.getTextWidth(value);
  const startX = (doc.internal.pageSize.getWidth() - prefixWidth - valueWidth) / 2;

  doc.setTextColor(...TEXT);
  doc.setFont(FONT, "normal");
  doc.setFontSize(BODY_SIZE);
  doc.text(prefix, startX, y);
  doc.setFont(FONT, "bold");
  doc.setFontSize(VALUE_SIZE);
  doc.text(value, startX + prefixWidth, y);
};

/**
 * "Label: value" from the left — label bold, value normal.
 * Text never goes past x + maxWidth: the value starts beside the label and
 * continues on new lines under the label (breaking at spaces or after "-").
 * Returns the y after the last line.
 */
const drawLabelValue = (doc, label, value, x, y, maxWidth, lineHeight = 5) => {
  const labelText = `${label}: `;
  doc.setFontSize(FOOTER_SIZE);
  doc.setTextColor(...TEXT);
  doc.setFont(FONT, "bold");
  doc.text(labelText, x, y);
  const labelWidth = doc.getTextWidth(labelText);

  doc.setFont(FONT, "normal");
  // tokens keep a trailing "-" and remember whether a space came before them
  const tokens = [];
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      word
        .split(/(?<=-)/)
        .forEach((part, i) => tokens.push({ text: part, space: i === 0 }));
    });

  let line = "";
  let lineX = x + labelWidth;
  let lineY = y;
  const newLine = () => {
    if (line) doc.text(line, lineX, lineY);
    line = "";
    lineX = x;
    lineY += lineHeight;
  };

  tokens.forEach(({ text, space }) => {
    const candidate = line ? `${line}${space ? " " : ""}${text}` : text;
    if (doc.getTextWidth(candidate) <= x + maxWidth - lineX) {
      line = candidate;
      return;
    }
    newLine(); // nothing more fits on this line (or beside the label)
    // a single piece longer than a full line: break it by characters
    let rest = text;
    while (doc.getTextWidth(rest) > maxWidth) {
      let cut = rest.length - 1;
      while (cut > 1 && doc.getTextWidth(rest.slice(0, cut)) > maxWidth) cut--;
      line = rest.slice(0, cut);
      newLine();
      rest = rest.slice(cut);
    }
    line = rest;
  });
  if (line) doc.text(line, lineX, lineY);
  return lineY + lineHeight;
};

/** Assessment venue: Institute Name-Dzongkhag-Exact Location (blank parts skipped). */
const buildAssessmentVenue = (record) =>
  [record.institute_name, record.dzongkhag_name, record.exact_location]
    .map((v) => (v === null || v === undefined ? "" : String(v).trim()))
    .filter((v) => v && v !== "N/A")
    .join("-");

/** Parse `unit_codes` — array or JSON string. */
const parseUnitCodes = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Format a mark for the Statement of Marks (blank → "-"). */
const fmtMark = (v) => {
  if (v === null || v === undefined || v === "" || v === "N/A") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : String(v);
};

// ==================== PAGE 1 ====================
export const renderAssessmentPage1 = (doc, record) => {
  const isRPL = RPL_SERVICE_IDS.includes(Number(record.service_id));

  const programme =
    record.occupation_name ||
    record.course_name ||
    record.certification_level ||
    "N/A";
  const result = String(
    record.overall_result || record.result || "COMPETENT",
  ).toUpperCase();

  centerText(doc, "This is to certify that", 88.5);
  centerText(doc, record.applicant_name ?? "N/A", 99.9, {
    size: VALUE_SIZE,
    bold: true,
  });
  centerPrefixValue(
    doc,
    "bearing Citizenship Identity Card No: ",
    String(record.cid_no ?? "N/A"),
    112.0,
  );

  if (isRPL) {
    centerText(doc, "has been assessed through the", 123.3);
    centerText(doc, "Recognition of Prior Learning (RPL) System", 134.1, {
      bold: true,
    });
    centerText(doc, "under the Bhutan Qualifications Framework in:", 144.9);
    centerText(doc, programme, 156.4, { size: VALUE_SIZE, bold: true });
    centerText(doc, "and is awarded the certificate as", 167.8);
    centerText(doc, result, 179.8, { size: RESULT_SIZE, bold: true });
  } else {
    centerText(
      doc,
      "has been assessed under the Bhutan Qualifications Framework in:",
      123.3,
    );
    centerText(doc, programme, 134.8, { size: VALUE_SIZE, bold: true });
    centerText(doc, "and is awarded the certificate as", 146.2);
    centerText(doc, result, 158.3, { size: RESULT_SIZE, bold: true });
  }

  // ---- Certificate No / Issued in / Assessment Venue ----
  // Level with the Director's signature (y ≈ 247–262mm) and kept left of it
  // (signature starts at x ≈ 80mm); long values break onto new lines.
  let footerY = 248;
  const footerWidth = 55; // 23.3mm → 78.3mm
  if (record.certificate_no) {
    footerY = drawLabelValue(
      doc,
      "Certificate No",
      record.certificate_no,
      FOOTER_X,
      footerY,
      footerWidth,
    );
  }
  if (record.certificate_issued) {
    footerY = drawLabelValue(
      doc,
      "Issued in",
      record.certificate_issued,
      FOOTER_X,
      footerY,
      footerWidth,
    );
  }
  const venue = buildAssessmentVenue(record);
  if (venue) {
    drawLabelValue(doc, "Assessment Venue", venue, FOOTER_X, footerY, footerWidth);
  }
};

// ==================== PAGE 2 — UNITS (+ STATEMENT OF MARKS for diploma) ====================
export const renderAssessmentPage2 = (doc, record) => {
  doc.setTextColor(...TEXT);
  doc.setFont(FONT, "normal");
  doc.setFontSize(BODY_SIZE);
  doc.text(
    "The candidate has been assessed as per the National Competency Standards",
    LEFT_X,
    41.6,
  );
  doc.text("in the following Units:", LEFT_X, 47.4);

  // ---- Units list: "1.  Title ............ (code)" ----
  const parsed = parseUnitCodes(record.unit_codes);
  const units =
    parsed.length > 0
      ? parsed.map((u) => ({
          code: u.unitCode || u.code || "",
          title: u.unitTitle || u.title || "",
        }))
      : [{ code: "", title: record.course_name || "Occupational Competency" }];

  const numberX = LEFT_X;
  const titleX = 31.7;
  const titleWidth = 141; // wrap width of the unit title
  const lineGap = 5.8; // between wrapped lines of one unit
  const unitGap = 7.4; // between units

  let y = 61.0;
  units.forEach((u, i) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(BODY_SIZE);
    doc.text(`${i + 1}.`, numberX, y);

    const lines = doc.splitTextToSize(u.title, titleWidth);
    lines.forEach((line, li) => doc.text(line, titleX, y + li * lineGap));

    let lastY = y + (lines.length - 1) * lineGap;
    if (u.code) {
      const codeText = `(${u.code})`;
      const codeWidth = doc.getTextWidth(codeText);
      const lastLineEnd = titleX + doc.getTextWidth(lines[lines.length - 1] || "");
      // code goes on the last title line; if it would touch the title, put it on its own line
      if (lastLineEnd + 4 > RIGHT_X - codeWidth) lastY += lineGap;
      doc.text(codeText, RIGHT_X, lastY, { align: "right" });
    }
    y = lastY + unitGap;
  });

  // ---- Statement of Marks (diploma levels only) ----
  if (!DIPLOMA_LEVEL_IDS.includes(Number(record.certification_level_id))) return;

  const internal = record.internal_assessment_mark;
  const theory = record.theory_assessment_mark;
  const practical = record.practical_assessment_mark;
  const parts = [internal, theory, practical].map(Number);
  const total = parts.every(Number.isFinite)
    ? parts.reduce((a, b) => a + b, 0)
    : null;

  const titleY = Math.max(y + 7.5, 103.0);
  doc.setFont(FONT, "bold");
  doc.setFontSize(MARKS_SIZE);
  doc.text("STATEMENT OF MARKS", (LEFT_X + RIGHT_X) / 2, titleY, {
    align: "center",
  });

  const top = titleY + 6.5;
  const headH = 22.7;
  const rowH = 12.5;
  const tableLeft = LEFT_X;
  const colW = (188.7 - LEFT_X) / 4;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(tableLeft, top, colW * 4, headH + rowH);
  doc.line(tableLeft, top + headH, tableLeft + colW * 4, top + headH);
  for (let c = 1; c < 4; c++) {
    doc.line(tableLeft + colW * c, top, tableLeft + colW * c, top + headH + rowH);
  }

  const headers = [
    ["Internal", "Assessment", "(20%)"],
    ["Theory", "Assessment", "(20%)"],
    ["Practical", "Assessment", "(60%)"],
    ["Total", null, "(100%)"],
  ];
  const values = [internal, theory, practical, total].map(fmtMark);

  doc.setFont(FONT, "normal");
  doc.setFontSize(MARKS_SIZE);
  headers.forEach(([l1, l2, pct], c) => {
    const cx = tableLeft + colW * c + colW / 2;
    if (l2) {
      doc.text(l1, cx, top + 6.7, { align: "center" });
      doc.text(l2, cx, top + 12.1, { align: "center" });
      doc.text(pct, cx, top + 19.5, { align: "center" });
    } else {
      doc.text(l1, cx, top + 6.7, { align: "center" });
      doc.text(pct, cx, top + 14.2, { align: "center" });
    }
    doc.text(values[c], cx, top + headH + 7.7, { align: "center" });
  });
};
