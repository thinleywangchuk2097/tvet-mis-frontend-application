// src/utils/pdf/totMarkSheetPdf.js
// TOT mark sheet in the TTTRC layout: header with emblem/logo, modules in a
// two-column grid, overall result block and signatures. One page per trainer.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadImageAsDataUrl } from "./pdfEngine";
import emblemUrl from "../../assets/tot/emblem.png";
import logoUrl from "../../assets/tot/tttrc-logo.png";
import headerTextUrl from "../../assets/tot/header-text.png";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const GAP = 8;
const COL_W = (PAGE_W - MARGIN * 2 - GAP) / 2;
const SHADE = [214, 220, 228];
const BLUE = [0, 112, 192];
const RED = [204, 0, 0];
const FOOTER_SPACE = 48; // overall block + signatures

const fmtNum = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

const fmtDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const parseHours = (val) => {
  const n = parseFloat(String(val ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const toRoman = (n) =>
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n - 1] ?? n;

let assetCache = null;
const loadAssets = async () => {
  if (assetCache) return assetCache;
  const [emblem, logo, headerText] = await Promise.all([
    loadImageAsDataUrl(emblemUrl),
    loadImageAsDataUrl(logoUrl),
    loadImageAsDataUrl(headerTextUrl),
  ]);
  assetCache = { emblem, logo, headerText };
  return assetCache;
};

const drawHeader = (doc, assets, data, trainer) => {
  doc.addImage(assets.emblem, "PNG", MARGIN + 2, 9, 27, 24);
  doc.addImage(assets.logo, "PNG", PAGE_W - MARGIN - 27, 9, 25, 25);
  const textW = 112;
  const textH = (textW * 308) / 1366;
  doc.addImage(assets.headerText, "PNG", (PAGE_W - textW) / 2, 9, textW, textH);

  let y = 9 + textH + 6;
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BLUE);
  doc.text(data.programName || "Training of Trainer", PAGE_W / 2, y, {
    align: "center",
  });

  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(...RED);
  doc.text("MARK SHEET", PAGE_W / 2, y, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  y += 5;
  doc.text(`Name:  ${trainer.name ?? "-"}`, MARGIN, y);
  doc.text(`Date: ${fmtDate(trainer.generatedAt ?? new Date())}`, PAGE_W - MARGIN, y, {
    align: "right",
  });
  if (data.programCode) {
    doc.setFont("times", "normal");
    doc.text(`Program Code: ${data.programCode}`, PAGE_W / 2, y, {
      align: "center",
    });
    doc.setFont("times", "bold");
  }
  y += 5;
  doc.text(`CID:  ${trainer.cid ?? "-"}`, MARGIN, y);
  doc.text(trainer.certificateNo ?? "", PAGE_W - MARGIN, y, { align: "right" });
  return y + 5;
};

// Builds the autoTable body for one module block
const moduleBody = (module, idx, data, marks, moduleResult) => {
  const contents = module.contents ?? [];
  const total = contents.reduce((s, c) => s + (Number(marks[c.id]) || 0), 0);
  const max = contents.reduce((s, c) => s + (Number(c.fullMark) || 0), 0);
  const pct =
    moduleResult?.percentage ?? (max > 0 ? (total / max) * 100 : 0);

  const full = (content, styles = {}) => [
    { content, colSpan: 3, styles },
  ];

  return [
    full(`Module ${toRoman(idx + 1)}: ${module.moduleName ?? ""}`, {
      halign: "center",
      fillColor: SHADE,
      fontStyle: "bold",
    }),
    full(`Module duration: ${module.duration || "-"}`, { fontStyle: "bold" }),
    full(`Venue: ${data.venue || "-"}`),
    full(
      `Date: W.e.f ${fmtDate(data.programStartDate)} to ${fmtDate(
        data.programEndDate,
      )}`,
    ),
    [
      { content: "Course Content", styles: { fontStyle: "bold", halign: "center" } },
      { content: "Full Mark", styles: { fontStyle: "bold" } },
      { content: "Marks", styles: { fontStyle: "bold" } },
    ],
    ...contents.map((c) => [
      c.courseContent,
      fmtNum(c.fullMark),
      fmtNum(marks[c.id]),
    ]),
    [
      { content: "TOTAL", styles: { fontStyle: "bold" } },
      { content: fmtNum(max), styles: { fontStyle: "bold" } },
      { content: Number(total).toFixed(2), styles: { fontStyle: "bold" } },
    ],
    [
      { content: "Percentage", styles: { halign: "right", fontStyle: "bolditalic" } },
      {
        content: `${Number(pct).toFixed(2)} %`,
        colSpan: 2,
        styles: { fontStyle: "bolditalic" },
      },
    ],
    [
      { content: "Grade", styles: { halign: "right", fontStyle: "bolditalic" } },
      {
        content: moduleResult?.grade ?? "-",
        colSpan: 2,
        styles: { fontStyle: "bolditalic" },
      },
    ],
  ];
};

const drawModuleTable = (doc, body, x, y) => {
  autoTable(doc, {
    startY: y,
    body,
    theme: "grid",
    tableWidth: COL_W,
    margin: { left: x, right: PAGE_W - x - COL_W, top: MARGIN, bottom: MARGIN },
    styles: {
      font: "times",
      fontSize: 7,
      cellPadding: { top: 0.45, bottom: 0.45, left: 0.8, right: 0.8 },
      minCellHeight: 0,
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.15,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: COL_W - 30 },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 15, halign: "center" },
    },
    pageBreak: "avoid",
  });
  return doc.lastAutoTable.finalY;
};

const estimateHeight = (body) => body.length * 3.55 + 2;

const drawFooter = (doc, y, data, trainer, modules) => {
  const totalHours = modules.reduce((s, m) => s + parseHours(m.duration), 0);
  const leftW = 110;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    tableWidth: leftW,
    margin: { left: MARGIN },
    styles: {
      font: "times",
      fontSize: 8.5,
      fontStyle: "bold",
      cellPadding: 0.8,
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.15,
      fillColor: SHADE,
    },
    columnStyles: {
      0: { cellWidth: leftW - 35 },
      1: { cellWidth: 35, halign: "center" },
    },
    body: [
      ["Overall training duration:", totalHours ? `${fmtNum(totalHours)} Hrs.` : "-"],
      ["Overall Percentage :", `${Number(trainer.overallPercentage ?? 0).toFixed(2)} %`],
      ["Overall Grade:", trainer.grade ?? "-"],
    ],
  });
  const leftEnd = doc.lastAutoTable.finalY;

  const rx = MARGIN + leftW + 6;
  const rw = PAGE_W - MARGIN - rx;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    tableWidth: rw,
    margin: { left: rx },
    styles: {
      font: "times",
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.15,
    },
    body: [
      [{ content: "RESULT", styles: { fillColor: SHADE } }],
      [
        {
          content: trainer.result ?? "-",
          styles: {
            minCellHeight: leftEnd - y - 5,
            fontSize: 10,
            textColor: trainer.result === "Competent" ? [0, 110, 40] : RED,
          },
        },
      ],
    ],
  });

  // Signatures
  const sy = PAGE_H - 22;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0);
  doc.line(MARGIN + 2, sy, MARGIN + 72, sy);
  doc.line(PAGE_W - MARGIN - 72, sy, PAGE_W - MARGIN - 2, sy);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("Chief Program Officer", MARGIN + 37, sy + 5, { align: "center" });
  doc.text("Master Trainer", PAGE_W - MARGIN - 37, sy + 5, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text(
    "Technical Trainers Training & Resource Center",
    MARGIN + 37,
    sy + 9.5,
    { align: "center" },
  );
  doc.text(data.programName || "", PAGE_W - MARGIN - 37, sy + 9.5, {
    align: "center",
    maxWidth: 75,
  });
};

const drawTrainer = (doc, assets, data, trainer) => {
  let y = drawHeader(doc, assets, data, trainer);
  const marks = trainer.marks ?? {};
  const resultByModule = {};
  (trainer.modules ?? []).forEach((r) => {
    resultByModule[String(r.moduleId)] = r;
  });

  const modules = (data.modules ?? []).filter(
    (m) => (m.contents ?? []).length > 0,
  );

  for (let i = 0; i < modules.length; i += 2) {
    const left = moduleBody(modules[i], i, data, marks, resultByModule[String(modules[i].id)]);
    const right =
      modules[i + 1] &&
      moduleBody(modules[i + 1], i + 1, data, marks, resultByModule[String(modules[i + 1].id)]);
    const need = Math.max(estimateHeight(left), right ? estimateHeight(right) : 0);
    if (y + need > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    const endL = drawModuleTable(doc, left, MARGIN, y);
    doc.setPage(doc.getNumberOfPages());
    const endR = right ? drawModuleTable(doc, right, MARGIN + COL_W + GAP, y) : y;
    y = Math.max(endL, endR) + 5;
  }

  if (y + FOOTER_SPACE > PAGE_H) {
    doc.addPage();
    y = MARGIN + 10;
  }
  drawFooter(doc, y, data, trainer, modules);
};

/**
 * @param {object} data      program info: programName, programCode, venue,
 *                           programStartDate, programEndDate, modules[]
 *                           (modules: { id, moduleName, duration, contents[{id, courseContent, fullMark}] })
 * @param {object[]} trainers each: name, cid, marks {contentId: mark},
 *                           overallPercentage, grade, result, certificateNo,
 *                           generatedAt, modules [{moduleId, percentage, grade}]
 * @param {string} fileName
 */
export const downloadTotMarkSheets = async (data, trainers, fileName) => {
  const assets = await loadAssets();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  trainers.forEach((t, idx) => {
    if (idx > 0) doc.addPage();
    drawTrainer(doc, assets, data, t);
  });
  doc.save(fileName || "TOT_Mark_Sheet.pdf");
};
