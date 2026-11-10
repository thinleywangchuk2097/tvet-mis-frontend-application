// src/pages/public/reports/reportStyles.js
// Shared look for the public report pages (same as the "Apply Trainer to TOT Program" table).

/** Outer page Paper. */
export const PAPER_PROPS = { elevation: 3, style: { padding: 20, margin: 10 } };

/** Small bordered table. */
export const TABLE_SX = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

/** Compact 36px search / filter inputs. */
export const INPUT_SX = {
  "& .MuiOutlinedInput-root": {
    height: "36px",
    "& input": { padding: "8px 12px" },
    "& fieldset": { borderRadius: "4px" },
  },
};

/** Compact select (TextField select) matching INPUT_SX. */
export const SELECT_SX = {
  "& .MuiOutlinedInput-root": { height: "36px" },
  "& .MuiSelect-select": { py: "7px" },
};

export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

/** Parse a JSON column that may arrive as a string or an array. */
export const parseJsonArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
