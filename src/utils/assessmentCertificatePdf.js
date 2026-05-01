// src/utils/assessmentCertificatePdf.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =====================================================
   COMMON DRAW FUNCTION
===================================================== */
const drawCertificate = (doc, data, isFirst = false) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    const center = (text, y, size = 12, style = "normal") => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.text(String(text), pageWidth / 2, y, { align: "center" });
    };

    const safe = (val, fallback = "-") =>
        val !== undefined && val !== null && val !== ""
            ? String(val)
            : fallback;

    const today = new Date().toISOString().split("T")[0];

    /* ==========================================
       PAGE 1 : CERTIFICATE
    ========================================== */

    if (!isFirst) doc.addPage();

    // Border
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, 194, 281);

    doc.setLineWidth(0.2);
    doc.rect(11, 11, 188, 275);

    // Header
    doc.setTextColor(0, 102, 204);
    center("BHUTAN QUALIFICATIONS AND", 20, 16, "bold");
    center("PROFESSIONALS CERTIFICATION AUTHORITY", 28, 16, "bold");

    center("NATIONAL CERTIFICATE LEVEL 2", 42, 14, "bold");

    doc.setTextColor(0, 0, 0);

    center("This is to certify that", 58, 12, "normal");

    center(safe(data.name, "Candidate Name"), 72, 20, "bold");

    center(
        `bearing Citizen Identity Card No: ${safe(data.cid)}`,
        86,
        11,
        "normal"
    );

    center(
        "has been assessed under the Bhutan Vocational",
        100,
        11,
        "normal"
    );

    center(
        "Qualifications Framework in the Occupation:",
        108,
        11,
        "normal"
    );

    center(safe(data.course, "Occupation Name"), 122, 15, "bold");

    center("and is awarded the certificate", 136, 11, "normal");

    center(
        safe(data.certificate, "National Certificate"),
        148,
        15,
        "bold"
    );

    // Footer Info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        `Certification No: ${safe(data.certificateNo, data.id)}`,
        18,
        190
    );

    doc.text(`Issued In: ${today}`, 18, 198);

    doc.text(
        `Training Provider: ${safe(data.institute, "Institute Name")}`,
        18,
        206
    );

    // Signature
    doc.line(135, 210, 185, 210);
    center("DIRECTOR", 218, 11, "bold");

    center(
        "Bhutan Qualifications and Professionals Certification Authority",
        270,
        9,
        "normal"
    );

    /* ==========================================
       PAGE 2 : STATEMENT OF MARKS
    ========================================== */

    doc.addPage();

    // Border
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, 194, 281);

    doc.setLineWidth(0.2);
    doc.rect(11, 11, 188, 275);

    center("STATEMENT OF MARKS", 20, 18, "bold");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(`Candidate Name : ${safe(data.name)}`, 18, 35);
    doc.text(`CID No         : ${safe(data.cid)}`, 18, 43);
    doc.text(`Occupation     : ${safe(data.course)}`, 18, 51);
    doc.text(`Certificate    : ${safe(data.certificate)}`, 18, 59);

    autoTable(doc, {
        startY: 72,
        head: [[
            "Practical",
            "Theory",
            "Continuous Assessment",
            "Result"
        ]],
        body: [[
            safe(data.practical),
            safe(data.theory),
            safe(data.internal),
            safe(data.result)
        ]],
        styles: {
            fontSize: 10,
            halign: "center",
            valign: "middle",
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [0, 102, 204],
            textColor: 255,
            fontStyle: "bold",
        },
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [["Grade Descriptors Percentage", "Definition"]],
        body: [
            [">= 60.00", "Competent"],
            ["0 - 59.99", "Not Yet Competent"],
        ],
        styles: {
            fontSize: 10,
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [70, 70, 70],
            textColor: 255,
            fontStyle: "bold",
        },
    });

    const footerY = doc.lastAutoTable.finalY + 40;

    doc.line(60, footerY, 150, footerY);

    center("Chief Program Officer", footerY + 8, 11, "normal");
    center("TVET Quality Council (TVET-QC)", footerY + 16, 10, "normal");

    center(
        "Bhutan Qualifications and Professionals Certification Authority",
        footerY + 24,
        9,
        "normal"
    );
};

/* =====================================================
   SINGLE CERTIFICATE
===================================================== */
export const generateAssessmentCertificatePdf = (data) => {
    const doc = new jsPDF("p", "mm", "a4");

    drawCertificate(doc, data, true);

    const safeName = (data.name || "Candidate")
        .replace(/\s+/g, "_");

    doc.save(`Assessment_Certificate_${safeName}.pdf`);
};

/* =====================================================
   DOWNLOAD ALL CERTIFICATES
===================================================== */
export const generateAllAssessmentCertificatesPdf = (rows) => {
    const doc = new jsPDF("p", "mm", "a4");

    rows.forEach((item, index) => {
        drawCertificate(doc, item, index === 0);
    });

    doc.save("All_Assessment_Certificates.pdf");
};