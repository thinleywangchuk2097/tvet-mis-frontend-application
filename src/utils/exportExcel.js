import writeXlsxFile from "write-excel-file/universal";
import { saveAs } from "file-saver";

const isPlainCellValue = (value) =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  value instanceof Date;

// always a cell object: numbers, booleans, text and dates kept as they are,
// empty values blank, anything else as text
const toCell = (value) => {
  let cellValue = "";
  if (isPlainCellValue(value)) {
    cellValue = value;
  } else if (value !== null && value !== undefined) {
    cellValue = String(value);
  }
  return { value: cellValue };
};

export const exportToExcel = async (data, fileName = "Report") => {
  // Sheet1: column names in the first row, then one row per record
  const headers = data && data.length > 0 ? Object.keys(data[0]) : [];
  const sheetData =
    headers.length > 0
      ? [
          headers.map((h) => toCell(h)),
          ...data.map((item) => headers.map((h) => toCell(item[h]))),
        ]
      : [[toCell("")]];

  const blob = await writeXlsxFile(sheetData, { sheet: "Sheet1" }).toBlob();

  saveAs(blob, `${fileName}.xlsx`);
};
