// src/utils/pdf/templates/accreditationTemplate.js

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

export const renderAccreditation = (doc, record) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // ---- Title (just below the BQPA header) ----
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 90, 20);
  doc.text("CERTIFICATE OF ACCREDITATION", centerX, 72, {
    align: "center",
  });

  // ---- Fields — vertically centered inside the circle ----
  // 7 fields × 10mm = 70mm block. Circle center ≈ 162mm.
  // startY = 162 − (70 / 2) = 127.
  let y = 127;

  drawField(doc, "Application No", record.application_no, y, centerX);
  y += 10;

  drawField(doc, "Registration No", record.registration_no, y, centerX);
  y += 10;

  drawField(doc, "Institute", record.institute_name, y, centerX);
  y += 10;

  drawField(doc, "Programme", record.programme_title, y, centerX);
  y += 10;

  drawField(doc, "Occupation", record.occupation_name, y, centerX);
  y += 10;

  drawField(doc, "Sector", record.sector_name, y, centerX);
  y += 10;

  drawField(doc, "Enrolment Capacity", record.enrolment_capacity, y, centerX);
};
