// src/utils/pdf/pdfEngine.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const createDoc = (options = {}) =>
  new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    ...options,
  });

export const drawBackground = (doc, urlOrDataUrl) => {
  if (!urlOrDataUrl) return;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.addImage(urlOrDataUrl, "PNG", 0, 0, w, h);
};

export const loadImageAsDataUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Normalize config into an array of pages.
 * Accepts either:
 *   { pages: [{ background, render }, ...] }
 * or the legacy:
 *   { background, render }
 */
const normalizePages = (config) => {
  if (Array.isArray(config?.pages) && config.pages.length > 0) {
    return config.pages;
  }
  if (config?.background || config?.render) {
    return [{ background: config.background, render: config.render }];
  }
  return [];
};

/** Single record → N pages (one per entry in config.pages). */
export const generateSingle = async (record, config) => {
  const { fileName = "certificate.pdf" } = config;
  const pages = normalizePages(config);
  if (pages.length === 0) return null;

  const doc = createDoc();

  for (let i = 0; i < pages.length; i++) {
    const { background, render } = pages[i];
    if (i > 0) doc.addPage();
    const bg = background ? await loadImageAsDataUrl(background) : null;
    drawBackground(doc, bg);
    render(doc, record, i);
  }

  doc.save(fileName);
  return doc;
};

/** Bulk: for each record, emit its set of pages back-to-back. */
export const generateBulk = async (records, config) => {
  const {
    fileName = `certificates_${new Date().toISOString().split("T")[0]}.pdf`,
  } = config;

  const pages = normalizePages(config);
  if (!Array.isArray(records) || records.length === 0) return null;
  if (pages.length === 0) return null;

  const doc = createDoc();
  let isFirstPage = true;

  for (const record of records) {
    for (let i = 0; i < pages.length; i++) {
      const { background, render } = pages[i];
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const bg = background ? await loadImageAsDataUrl(background) : null;
      drawBackground(doc, bg);
      render(doc, record, i);
    }
  }

  doc.save(fileName);
  return doc;
};

export const renderKeyValueTable = (doc, startY, rows, options = {}) =>
  autoTable(doc, {
    startY,
    head: [["Field", "Details"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [210, 120, 40], textColor: 255, fontStyle: "bold" },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [252, 245, 235] },
    styles: { fontSize: 12, cellPadding: 4 },
    ...options,
  });

export { autoTable };