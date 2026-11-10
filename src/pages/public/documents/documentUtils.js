import PdfIcon from "@mui/icons-material/PictureAsPdf";
import WordIcon from "@mui/icons-material/Article";
import ExcelIcon from "@mui/icons-material/TableChart";
import SlidesIcon from "@mui/icons-material/Slideshow";
import ImageIcon from "@mui/icons-material/Image";
import FileIcon from "@mui/icons-material/InsertDriveFile";

export const CATEGORY = { PUBLICATION: "PUBLICATION", FORM: "FORM" };

export const fileExtension = (name) =>
  (name || "").split(".").length > 1
    ? name.split(".").pop().toLowerCase()
    : "";

// Icon + colour per file type
export const fileTypeMeta = (name) => {
  const ext = fileExtension(name);
  if (ext === "pdf") return { Icon: PdfIcon, color: "#c62828", label: "PDF" };
  if (["doc", "docx", "odt", "txt"].includes(ext))
    return { Icon: WordIcon, color: "#1565c0", label: ext.toUpperCase() };
  if (["xls", "xlsx", "ods", "csv"].includes(ext))
    return { Icon: ExcelIcon, color: "#2e7d32", label: ext.toUpperCase() };
  if (["ppt", "pptx"].includes(ext))
    return { Icon: SlidesIcon, color: "#e65100", label: ext.toUpperCase() };
  if (["jpg", "jpeg", "png"].includes(ext))
    return { Icon: ImageIcon, color: "#6a1b9a", label: ext.toUpperCase() };
  return {
    Icon: FileIcon,
    color: "#546e7a",
    label: ext ? ext.toUpperCase() : "FILE",
  };
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
};

// "2025-10-30" -> "30 Oct 2025"
export const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
