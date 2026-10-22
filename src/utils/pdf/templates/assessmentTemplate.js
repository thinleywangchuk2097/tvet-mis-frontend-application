// src/utils/pdf/templates/assessmentTemplate.js
import { autoTable } from "../pdfEngine";

/** Service IDs that should show Viva instead of Theory on page 2. */
const VIVA_SERVICE_IDS = [39, 41];

/** Service IDs that trigger the RPL paragraph on page 1. */
const RPL_SERVICE_IDS = [39, 41];

/** Draw a centered "Label: value" line, both on the same baseline. */
const drawField = (doc, label, value, y, centerX, options = {}) => {
  const {
    labelColor = [90, 90, 90],
    valueColor = [25, 25, 25],
    fontSize = 13,
  } = options;

  const labelText = `${label}: `;
  const valueText = value ?? "N/A";

  doc.setFontSize(fontSize);

  doc.setFont("helvetica", "bold");
  const labelWidth = doc.getTextWidth(labelText);

  doc.setFont("helvetica", "normal");
  const valueWidth = doc.getTextWidth(valueText);

  const totalWidth = labelWidth + valueWidth;
  const startX = centerX - totalWidth / 2;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...labelColor);
  doc.text(labelText, startX, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...valueColor);
  doc.text(valueText, startX + labelWidth, y);
};

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

// ==================== PAGE 1 — DIPLOMA ====================
export const renderAssessmentPage1 = (doc, record) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  const serviceId = Number(record.service_id);
  const isRPL = RPL_SERVICE_IDS.includes(serviceId);

  // ---- Title (dynamic, dark green, just below the BQPA header) ----
  const title =
    record.certification_level ||
    record.certificate ||
    record.course_name ||
    "CERTIFICATE";

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 105, 60);
  doc.text(title, centerX, 72, { align: "center" });

  // ---- Body block ----
  let y = 108;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text("This is to certify that", centerX, y, { align: "center" });
  y += 10;

  // Name (large, bold)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(record.applicant_name ?? "N/A", centerX, y, { align: "center" });
  y += 12;

  // CID line
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text(
    `bearing Citizenship Identity Card No: ${record.cid_no ?? "N/A"}`,
    centerX,
    y,
    { align: "center" },
  );
  y += 10;

  // ---- Framework paragraph (RPL variant vs standard) ----
  if (isRPL) {
    doc.text("has been assessed through the", centerX, y, {
      align: "center",
    });
    y += 7;

    doc.text("Recognition of Prior Learning (RPL) System", centerX, y, {
      align: "center",
    });
    y += 7;

    doc.text("under the Bhutan Qualifications Framework in:", centerX, y, {
      align: "center",
    });
    y += 12;
  } else {
    doc.text(
      "has been assessed under the Bhutan Qualifications Framework in:",
      centerX,
      y,
      { align: "center" },
    );
    y += 14;
  }

  // ---- Occupation (bold) ----
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(
    record.occupation_name ||
      record.course_name ||
      record.certification_level ||
      "N/A",
    centerX,
    y,
    { align: "center" },
  );
  y += 14;

  // ---- Award line ----
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text("and is awarded the certificate as", centerX, y, {
    align: "center",
  });
  y += 12;

  // ---- Result (large, bold) ----
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  const result =
    (record.overall_result || record.result || "COMPETENT")?.toString() ||
    "COMPETENT";
  doc.text(result.toUpperCase(), centerX, y, { align: "center" });
};

// ==================== PAGE 2 — UNITS OF COMPETENCY ASSESSED ====================
export const renderAssessmentPage2 = (doc, record) => {
  const showViva = VIVA_SERVICE_IDS.includes(Number(record.service_id));
  const extraColumnLabel = showViva ? "Viva" : "Theory";

  const parsedUnits = parseUnitCodes(record.unit_codes);

  const units =
    parsedUnits.length > 0
      ? parsedUnits.map((u, i) => ({
          code: u.unitCode || u.code || `U${i + 1}`,
          title: u.unitTitle || u.title || "N/A",
        }))
      : [
          {
            code: "U1",
            title: record.course_name || "Occupational Competency",
          },
        ];

  const internal = record.internal_assessment_mark ?? "N/A";
  const extra = showViva
    ? (record.viva_assessment_mark ?? "N/A")
    : (record.theory_assessment_mark ?? "N/A");
  const practical = record.practical_assessment_mark ?? "N/A";
  const result = record.overall_result ?? "N/A";

  const rowSpan = units.length;

  const body = units.map((u, i) => {
    if (i === 0) {
      return [
        u.code,
        u.title,
        { content: internal, rowSpan, styles: { valign: "middle" } },
        { content: extra, rowSpan, styles: { valign: "middle" } },
        { content: practical, rowSpan, styles: { valign: "middle" } },
        { content: result, rowSpan, styles: { valign: "middle" } },
      ];
    }
    return [u.code, u.title];
  });

  autoTable(doc, {
    startY: 38,
    head: [
      [
        "Code",
        "Unit of Competency",
        "Internal",
        extraColumnLabel,
        "Practical",
        "Result",
      ],
    ],
    body,
    theme: "grid",
    margin: { left: 20, right: 20 },
    headStyles: {
      fillColor: [0, 140, 200],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [40, 40, 40],
      fontSize: 10,
      fillColor: [255, 255, 255],
    },
    styles: {
      cellPadding: 3,
      lineColor: [200, 210, 220],
      lineWidth: 0.2,
    },
  });

  // ========== FOOTER (bottom-left of page 2) ==========
  const leftX = 25;
  let footY = 265;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);

  if (record.certificate_no) {
    doc.text(`Certificate No: ${record.certificate_no}`, leftX, footY);
    footY += 6;
  }

  if (record.certificate_issued) {
    doc.text(`Issued in: ${record.certificate_issued}`, leftX, footY);
  }
};
