// src/utils/pdf/fonts/cambriaFonts.js
// Certificate text font, registered in jsPDF under the family name "Cambria".
import cambriaRegular from "./Cambria-Regular.ttf?url";
import cambriaBold from "./Cambria-Bold.ttf?url";

export const CAMBRIA = "Cambria";

export const CAMBRIA_FONTS = [
  { family: CAMBRIA, style: "normal", url: cambriaRegular },
  { family: CAMBRIA, style: "bold", url: cambriaBold },
];
