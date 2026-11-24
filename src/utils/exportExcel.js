import writeXlsxFile from "write-excel-file/universal";
import { saveAs } from "file-saver";

// numbers, booleans, text and dates are kept as they are; anything else becomes text
const toCell = (value) => {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }
  return String(value);
};

export const exportToExcel = async (data, fileName = "Report") => {
  // Sheet1: column names in the first row, then one row per record
  const headers = data && data.length > 0 ? Object.keys(data[0]) : [];
  const sheetData =
    headers.length > 0
      ? [headers, ...data.map((item) => headers.map((h) => toCell(item[h])))]
      : [[""]];

  const blob = await writeXlsxFile(sheetData, { sheet: "Sheet1" }).toBlob();

  saveAs(blob, `${fileName}.xlsx`);
};
