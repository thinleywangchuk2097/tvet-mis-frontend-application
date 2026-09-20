// src/constants/certificateLayout.jsx
//
// Layout constants for the assessment certificate PDF.
// Page 1 block is centred on the template's decorative circle.
//
// pdf-lib coordinate system:
//   • Units: PDF points (1 pt = 1/72 inch)
//   • Origin: BOTTOM-LEFT of the page
//   • A4 portrait = 595.28 × 841.89 pt
//   • Colours are 0–1 (not 0–255)

export const PAGE = {
  W: 595.28,
  H: 841.89,
};

export const BACKGROUNDS = {
  certificate: `${import.meta.env.BASE_URL}pdf/certificate.pdf`,
  marks: `${import.meta.env.BASE_URL}pdf/statement-of-marks.pdf`,
};

export const STATIC_DRAWN_BY_TEMPLATE = false;

/* =====================================================
   CENTRE OF THE CIRCLE (page 1)
===================================================== */
export const CENTER = {
  X: PAGE.W / 2,
  Y: 430,
};

/* =====================================================
   PAGE 1 — CERTIFICATE
   -----------------------------------------------------
   Two static-line variants:
     • standard  → "has been assessed under the Bhutan Qualifications Framework in:"
     • rpl       → "has been assessed through the Recognition of Prior Learning (RPL) System under the Bhutan Qualifications Framework in:"
===================================================== */

const LINES_COMMON_TOP = [
  {
    key: "LINE_INTRO",
    gap: 0,
    size: 12,
    font: "regular",
    text: "This is to certify that",
  },
  { key: "NAME", gap: 28, size: 20, font: "bold" },
  {
    key: "CID",
    gap: 22,
    size: 11,
    font: "regular",
    prefix: "bearing Citizenship Identity Card No: ",
  },
];

const LINES_COMMON_BOTTOM = [
  { key: "OCCUPATION", gap: 26, size: 17, font: "bold" },
  {
    key: "LINE_AWARDED",
    gap: 24,
    size: 11,
    font: "regular",
    text: "and is awarded the certificate as",
  },
  { key: "RESULT", gap: 26, size: 17, font: "bold" },
];

const FRAMEWORK_VARIANT = {
  standard: [
    {
      key: "LINE_FRAMEWORK_1",
      gap: 22,
      size: 11,
      font: "regular",
      text: "has been assessed under the Bhutan Qualifications",
    },
    {
      key: "LINE_FRAMEWORK_2",
      gap: 14,
      size: 11,
      font: "regular",
      text: "Framework in:",
    },
  ],
  rpl: [
    {
      key: "LINE_FRAMEWORK_1",
      gap: 22,
      size: 11,
      font: "regular",
      text: "has been assessed through the Recognition of Prior Learning",
    },
    {
      key: "LINE_FRAMEWORK_2",
      gap: 14,
      size: 11,
      font: "regular",
      text: "(RPL) System under the Bhutan Qualifications Framework in:",
    },
  ],
};

const buildCertLayout = (variant) => {
  const lines = [
    ...LINES_COMMON_TOP,
    ...FRAMEWORK_VARIANT[variant],
    ...LINES_COMMON_BOTTOM,
  ];

  const blockHeight = lines.reduce((sum, l) => sum + l.gap, 0);
  const blockTop = CENTER.Y + blockHeight / 2;

  const computed = {};
  let cursor = blockTop;
  lines.forEach((line) => {
    cursor -= line.gap;
    computed[line.key] = {
      x: CENTER.X,
      y: cursor,
      size: line.size,
      font: line.font,
      align: "center",
      ...(line.text ? { text: line.text } : {}),
      ...(line.prefix ? { prefix: line.prefix } : {}),
    };
  });

  return computed;
};

export const CERT = buildCertLayout("standard");
export const CERT_RPL = buildCertLayout("rpl");

/* =====================================================
   PAGE 2 — UNITS OF COMPETENCY ASSESSED
===================================================== */
export const MARKS = {
  PREAMBLE_X: 60,
  PREAMBLE_Y: 690,
  PREAMBLE_SIZE: 11,
  PREAMBLE_TEXT:
    "The candidate has been assessed as per the National Competency Standards in the following Units:",

  UNITS_START_X: 60,
  UNITS_START_Y: 662,
  UNITS_LINE_HEIGHT: 22,
  UNITS_FONT_SIZE: 11,

  HEADING_Y: 520,
  HEADING_SIZE: 14,

  TABLE_TOP_Y: 480,
  TABLE_MARGIN: { left: 60, right: 60 },
  ROW_HEIGHT: 26,
  FONT_SIZE: 10,

  HEAD_FILL: [0, 102 / 255, 204 / 255],
  HEAD_TEXT: [1, 1, 1],
};

/* =====================================================
   FONTS / COLORS
===================================================== */
export const FONTS = {
  regular: "Helvetica",
  bold: "HelveticaBold",
};

export const COLORS = {
  black: [0, 0, 0],
  blue: [0, 102 / 255, 204 / 255],
  white: [1, 1, 1],
};

/* =====================================================
   CONVERSION HELPERS
===================================================== */
export const pxToPt = (px, dpi = 300) => (px / dpi) * 72;
export const yFromTop = (yFromTopPt) => PAGE.H - yFromTopPt;
