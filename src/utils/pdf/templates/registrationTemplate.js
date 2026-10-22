// src/utils/pdf/templates/registrationTemplate.js

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

export const renderRegistration = (doc, record) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // ---- Title (just below the BQPA header) ----
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 90, 20);
  doc.text("CERTIFICATE OF REGISTRATION", centerX, 72, { align: "center" });

  // ---- Fields — vertically centered inside the circle ----
  // 5 fields × 10mm spacing = 50mm block. Center of circle ≈ y 162.
  // Start so that the block's midpoint lands on 162: 162 - 25 = 137.
  let y = 137;

  drawField(doc, "Registration No", record.registration_no, y, centerX);
  y += 10;

  drawField(doc, "Application No", record.application_no, y, centerX);
  y += 10;

  drawField(doc, "Institute / Applicant", record.institute_name, y, centerX);
  y += 10;

  drawField(doc, "Location", record.location, y, centerX);
  y += 10;

  drawField(doc, "Exact Location", record.exact_location, y, centerX);
};
