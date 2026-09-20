// src/utils/assessmentCertificatePdf.jsx
//
// Page 1: certificate.pdf        — main certificate
// Page 2: statement-of-marks.pdf — units of competency
//
// Layout rules:
//   Page 1 wording:
//     • RPL (service_id 39 or 41) → "has been assessed through the Recognition of Prior Learning (RPL) System…"
//     • Everything else            → "has been assessed under the Bhutan Qualifications Framework in:"
//   Page 2 table:
//     • RPL (39 or 41)             → Internal / Viva / Practical
//     • Diploma (cert id 111/112)  → 4 cols with percentages
//     • Certificate (id 108/109/110) → 3 cols, no percentages

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  PAGE,
  CERT,
  CERT_RPL,
  MARKS,
  FONTS,
  COLORS,
  BACKGROUNDS,
  STATIC_DRAWN_BY_TEMPLATE,
} from "@/constants/certificateLayout";

/* =====================================================
   HELPERS
===================================================== */

const pick = (obj, keys, fallback = "-") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return fallback;
};

const toCompetentLabel = (value) => {
  const v = String(value || "").trim();
  if (!v) return "COMPETENT";
  if (v.toLowerCase() === "passed") return "COMPETENT";
  if (v.toLowerCase() === "failed") return "NOT YET COMPETENT";
  return v.toUpperCase();
};

const formatIssuedIn = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "-";
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${month}, ${d.getFullYear()}`;
};

const drawText = (page, text, opts, fonts) => {
  if (!opts || opts.x == null || opts.y == null) {
    console.warn("⚠️ [cert-pdf] drawText missing opts:", { text, opts });
    return 0;
  }
  const font = fonts[opts.font || "regular"];
  const size = opts.size || 11;
  const color = rgb(...(opts.color || COLORS.black));
  const width = font.widthOfTextAtSize(text, size);

  const x =
    opts.align === "center"
      ? opts.x - width / 2
      : opts.align === "right"
        ? opts.x - width
        : opts.x;

  page.drawText(text, { x, y: opts.y, size, font, color });
  return width;
};

const loadPdfBytes = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return res.arrayBuffer();
};

const downloadBlob = (bytes, filename) => {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const wrapText = (text, font, size, maxWidth) => {
  const words = String(text).split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
};

const parseUnits = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("⚠️ [cert-pdf] could not parse ncs_units:", err, raw);
    return [];
  }
};

const isDiplomaLevel = (data) => {
  const id = String(data?.certification_level_id ?? "");
  if (id === "111" || id === "112") return true;

  const name = String(data?.certification_level || "");
  if (/diploma/i.test(name)) return true;
  if (/certificate/i.test(name)) return false;

  return false;
};

const isRplService = (data) => {
  const id = String(data?.service_id ?? "");
  return id === "39" || id === "41";
};

/* =====================================================
   BUILD MERGED TEMPLATE (cached)
===================================================== */

let templateCache = null;

const buildTemplateBytes = async () => {
  console.log("🟦 [cert-pdf] Building merged template…");
  const certBytes = await loadPdfBytes(BACKGROUNDS.certificate);
  const marksBytes = await loadPdfBytes(BACKGROUNDS.marks);
  const merged = await PDFDocument.create();
  const certDoc = await PDFDocument.load(certBytes);
  const marksDoc = await PDFDocument.load(marksBytes);
  const [certPage] = await merged.copyPages(certDoc, [0]);
  merged.addPage(certPage);
  const [marksPage] = await merged.copyPages(marksDoc, [0]);
  merged.addPage(marksPage);
  const saved = await merged.save();
  console.log("   ✓ merged template:", saved.byteLength, "bytes");
  return saved;
};

const getTemplateBytes = async () => {
  if (!templateCache) templateCache = buildTemplateBytes();
  return templateCache;
};

/* =====================================================
   PAGE 1 — CERTIFICATE
===================================================== */

const stampCertificatePage = (page, data, fonts) => {
  const layout = isRplService(data) ? CERT_RPL : CERT;
  console.log("      page 1 layout:", isRplService(data) ? "RPL" : "standard");

  if (!STATIC_DRAWN_BY_TEMPLATE) {
    drawText(page, layout.LINE_INTRO.text, layout.LINE_INTRO, fonts);
    drawText(
      page,
      layout.LINE_FRAMEWORK_1.text,
      layout.LINE_FRAMEWORK_1,
      fonts,
    );
    drawText(
      page,
      layout.LINE_FRAMEWORK_2.text,
      layout.LINE_FRAMEWORK_2,
      fonts,
    );
    drawText(page, layout.LINE_AWARDED.text, layout.LINE_AWARDED, fonts);
  }

  drawText(
    page,
    pick(data, ["applicant_name", "name", "trainee_name"], "Candidate Name"),
    { ...layout.NAME, font: "bold" },
    fonts,
  );

  drawText(
    page,
    `${layout.CID.prefix}${pick(data, ["cid_no", "cid"], "-")}`,
    layout.CID,
    fonts,
  );

  drawText(
    page,
    pick(data, ["programme_title", "course", "programme"], "Occupation"),
    { ...layout.OCCUPATION, font: "bold" },
    fonts,
  );

  drawText(
    page,
    toCompetentLabel(pick(data, ["result_status", "result"], "COMPETENT")),
    { ...layout.RESULT, font: "bold" },
    fonts,
  );

  drawText(
    page,
    `Certificate No: ${pick(data, ["certificate_no", "certificateNo", "application_no"], "-")}`,
    layout.CERT_NO,
    fonts,
  );
  drawText(
    page,
    `Issued in: ${formatIssuedIn(data.issued_in || data.issuedIn || data.ca_end_date)}`,
    layout.ISSUED_IN,
    fonts,
  );
  drawText(
    page,
    `Assessment Venue: ${pick(data, ["institute_name", "venue", "institute"], "-")}`,
    layout.VENUE,
    fonts,
  );
};

/* =====================================================
   PAGE 2 — UNITS + STATEMENT OF MARKS
===================================================== */

const drawPreamble = (page, fonts) => {
  drawText(
    page,
    MARKS.PREAMBLE_TEXT,
    {
      x: MARKS.PREAMBLE_X,
      y: MARKS.PREAMBLE_Y,
      size: MARKS.PREAMBLE_SIZE,
      font: "regular",
      align: "left",
    },
    fonts,
  );
};

const stampUnitsList = (page, units, fonts) => {
  if (!units?.length) return;
  let y = MARKS.UNITS_START_Y;
  const x = MARKS.UNITS_START_X;
  units.forEach((unit, i) => {
    const title = unit?.unitTitle || unit?.title || unit?.name || "";
    const code = unit?.unitCode || unit?.code || "";
    const line = code ? `${i + 1}. ${title} (${code})` : `${i + 1}. ${title}`;
    drawText(page, line, { x, y, size: MARKS.UNITS_FONT_SIZE }, fonts);
    y -= MARKS.UNITS_LINE_HEIGHT;
  });
};

const drawMarksHeading = (page, fonts) => {
  drawText(
    page,
    "STATEMENT OF MARKS",
    {
      x: PAGE.W / 2,
      y: MARKS.HEADING_Y,
      size: MARKS.HEADING_SIZE,
      font: "bold",
      align: "center",
    },
    fonts,
  );
};

const drawTable = (page, headers, values, fonts) => {
  const left = MARKS.TABLE_MARGIN.left;
  const right = MARKS.TABLE_MARGIN.right;
  const tableWidth = PAGE.W - left - right;
  const colWidth = tableWidth / headers.length;
  const rowHeight = MARKS.ROW_HEIGHT;
  const topY = MARKS.TABLE_TOP_Y;

  const fill = rgb(...MARKS.HEAD_FILL);
  const headText = rgb(...MARKS.HEAD_TEXT);
  const black = rgb(...COLORS.black);

  page.drawRectangle({
    x: left,
    y: topY - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: fill,
  });

  headers.forEach((h, i) => {
    const cellX = left + i * colWidth;
    const lines = wrapText(h, fonts.bold, MARKS.FONT_SIZE, colWidth - 8);
    const lineHeight = MARKS.FONT_SIZE + 2;
    const totalH = lines.length * lineHeight;
    let textY = topY - rowHeight / 2 + totalH / 2 - MARKS.FONT_SIZE / 2;
    lines.forEach((line) => {
      const w = fonts.bold.widthOfTextAtSize(line, MARKS.FONT_SIZE);
      page.drawText(line, {
        x: cellX + (colWidth - w) / 2,
        y: textY,
        size: MARKS.FONT_SIZE,
        font: fonts.bold,
        color: headText,
      });
      textY -= lineHeight;
    });
  });

  values.forEach((v, i) => {
    const cellX = left + i * colWidth;
    const text = String(v);
    const w = fonts.regular.widthOfTextAtSize(text, MARKS.FONT_SIZE);
    page.drawText(text, {
      x: cellX + (colWidth - w) / 2,
      y: topY - rowHeight - rowHeight / 2 - MARKS.FONT_SIZE / 2,
      size: MARKS.FONT_SIZE,
      font: fonts.regular,
      color: black,
    });
  });

  const gridTop = topY;
  const gridBottom = topY - rowHeight * 2;

  for (let i = 0; i <= headers.length; i++) {
    const x = left + i * colWidth;
    page.drawLine({
      start: { x, y: gridBottom },
      end: { x, y: gridTop },
      thickness: 0.5,
      color: black,
    });
  }
  for (let r = 0; r <= 2; r++) {
    const y = gridTop - r * rowHeight;
    page.drawLine({
      start: { x: left, y },
      end: { x: left + tableWidth, y },
      thickness: 0.5,
      color: black,
    });
  }
};

/* =====================================================
   STAMP ONE TRAINEE ONTO A PAGE SLICE
===================================================== */

const stampTraineeOnTemplate = (pages, data, fonts) => {
  console.log("   → stamping page 1 (certificate)");
  stampCertificatePage(pages[0], data, fonts);

  if (!pages[1]) return;

  console.log("   → stamping page 2 (marks)");

  const units = parseUnits(data.ncs_units);
  console.log("      parsed units:", units.length);

  drawPreamble(pages[1], fonts);
  if (units.length) stampUnitsList(pages[1], units, fonts);

  const hasMarks =
    data.internal_assessment != null ||
    data.theory_assessment != null ||
    data.practical_assessment != null ||
    data.viva_assessment != null;

  if (!hasMarks) return;

  drawMarksHeading(pages[1], fonts);

  if (isRplService(data)) {
    console.log("      page 2 layout: RPL (service", data.service_id, ")");
    const internal = pick(data, ["internal_assessment", "internal"], "-");
    const viva = pick(data, ["viva_assessment", "viva"], "-");
    const practical = pick(data, ["practical_assessment", "practical"], "-");

    drawTable(
      pages[1],
      ["Internal Assessment", "Viva Assessment", "Practical Assessment"],
      [internal, viva, practical],
      fonts,
    );
    return;
  }

  if (isDiplomaLevel(data)) {
    console.log(
      "      page 2 layout: diploma (id",
      data.certification_level_id,
      ")",
    );
    const internal = Number(pick(data, ["internal_assessment", "internal"], 0));
    const theory = Number(pick(data, ["theory_assessment", "theory"], 0));
    const practical = Number(
      pick(data, ["practical_assessment", "practical"], 0),
    );
    const total =
      data.total_assessment ?? (internal + theory + practical).toFixed(2);

    drawTable(
      pages[1],
      [
        "Internal Assessment (20%)",
        "Theory Assessment (20%)",
        "Practical Assessment (60%)",
        "Total (100%)",
      ],
      [internal, theory, practical, total],
      fonts,
    );
    return;
  }

  console.log(
    "      page 2 layout: certificate (id",
    data.certification_level_id,
    ")",
  );
  const internal = pick(data, ["internal_assessment", "internal"], "-");
  const theory = pick(data, ["theory_assessment", "theory"], "-");
  const practical = pick(data, ["practical_assessment", "practical"], "-");

  drawTable(
    pages[1],
    ["Internal Assessment", "Theory Assessment", "Practical Assessment"],
    [internal, theory, practical],
    fonts,
  );
};

/* =====================================================
   PUBLIC API — SINGLE CERTIFICATE
===================================================== */

export const generateAssessmentCertificatePdf = async (data) => {
  console.log("🟦 [cert-pdf] start, name =", data?.applicant_name);

  const templateBytes = await getTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);
  console.log("   ✓ template loaded, pages =", pdfDoc.getPageCount());

  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts[FONTS.regular]),
    bold: await pdfDoc.embedFont(StandardFonts[FONTS.bold]),
  };
  console.log("   ✓ fonts embedded");

  stampTraineeOnTemplate(pdfDoc.getPages(), data, fonts);
  console.log("   ✓ pages stamped");

  const safeName = pick(
    data,
    ["applicant_name", "name", "trainee_name"],
    "Candidate",
  ).replace(/\s+/g, "_");

  const bytes = await pdfDoc.save();
  console.log("   ✓ saved:", bytes.byteLength, "bytes");

  downloadBlob(bytes, `Assessment_Certificate_${safeName}.pdf`);
  console.log("   ✅ done");
};

/* =====================================================
   PUBLIC API — DOWNLOAD ALL CERTIFICATES
===================================================== */

export const generateAllAssessmentCertificatesPdf = async (rows) => {
  if (!rows?.length) return;

  const templateBytes = await getTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);

  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts[FONTS.regular]),
    bold: await pdfDoc.embedFont(StandardFonts[FONTS.bold]),
  };

  const templatePageCount = pdfDoc.getPageCount();
  for (let i = 1; i < rows.length; i++) {
    const indices = Array.from({ length: templatePageCount }, (_, k) => k);
    const copied = await pdfDoc.copyPages(pdfDoc, indices);
    copied.forEach((p) => pdfDoc.addPage(p));
  }

  const allPages = pdfDoc.getPages();
  rows.forEach((row, i) => {
    const start = i * templatePageCount;
    stampTraineeOnTemplate(
      allPages.slice(start, start + templatePageCount),
      row,
      fonts,
    );
  });

  const bytes = await pdfDoc.save();
  downloadBlob(bytes, "All_Assessment_Certificates.pdf");
};
