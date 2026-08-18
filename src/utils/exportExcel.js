import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToExcel = async (data, fileName = "Report") => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  // Add headers and data
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    data.forEach((item) => {
      worksheet.addRow(headers.map((header) => item[header] ?? ""));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
};
