import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPdf = (
    title,
    columns,
    rows,
    fileName = "Report"
) => {
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    doc.setFontSize(16);
    doc.text(title, 14, 15);

    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 22,
        styles: {
            fontSize: 8,
        },
        headStyles: {
            fillColor: [41, 128, 185],
        },
    });

    doc.save(`${fileName}.pdf`);
};