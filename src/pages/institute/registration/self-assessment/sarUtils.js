// Shared helpers for the Self Assessment Report (TVET Provider Accreditation)

export const SAR_SERVICE_ID = 19;
export const DEFAULT_ALLOCATED_POINT = 4;

// Status ids (tbl_dropdown_child_master parent 4)
export const SAR_STATUS = {
  SUBMITTED: 55,
  VERIFIED: 56,
  APPROVED: 57,
  REJECTED: 58,
  ENDORSED: 59,
};

// Document attachment types (tbl_document_master.attachment_type)
export const ATTACHMENT_TYPES = {
  BUSINESS_LICENSE: "BUSINESS_LICENSE",
  TRAINER_CV: "TRAINER_CV",
  VERIFICATION: "VERIFICATION",
};

// Accreditation grading
export const GRADE_SCALE = [
  { grade: "A+", min: 901, max: 1000, color: "#1b5e20" },
  { grade: "A", min: 801, max: 900, color: "#2e7d32" },
  { grade: "B", min: 701, max: 800, color: "#0277bd" },
  { grade: "C", min: 601, max: 700, color: "#ef6c00" },
  { grade: "Not Accredited", min: 0, max: 600, color: "#c62828" },
];

export const resolveGrade = (score) => {
  const value = Number(score) || 0;
  if (value > 900) return GRADE_SCALE[0];
  if (value > 800) return GRADE_SCALE[1];
  if (value > 700) return GRADE_SCALE[2];
  if (value > 600) return GRADE_SCALE[3];
  return GRADE_SCALE[4];
};

export const getGradeColor = (grade) =>
  GRADE_SCALE.find((g) => g.grade === grade)?.color || "#757575";

export const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const formatScore = (value) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "0.00";

export const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const sortByOrder = (a, b) =>
  (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) ||
  Number(a.id) - Number(b.id);

const parseCriteriaMeta = (description, fallbackScore) => {
  // Criteria description format: "<Level>|<Allocated Score>"  e.g. "Critical|160"
  if (description && description.includes("|")) {
    const [level, score] = description.split("|");
    const weight = Number(score);
    return {
      level: (level || "").trim() || "-",
      weight: Number.isFinite(weight) && weight > 0 ? weight : fallbackScore,
    };
  }
  return { level: "-", weight: fallbackScore };
};

const parseAllocatedPoint = (description) =>
  /^\d+$/.test(String(description ?? "").trim())
    ? Number(String(description).trim())
    : DEFAULT_ALLOCATED_POINT;

/**
 * Builds the checklist tree from tbl_registration_quality_standard rows
 * (service_id = 19):
 *   Criteria (parentId 0) -> Indicator -> Sub-Indicator
 * A two level setup (Criteria -> Sub-Indicator) is also supported.
 */
export const buildQualityTree = (rows = []) => {
  const active = rows.filter((r) => r.isActive === undefined || r.isActive == 1);
  const childrenOf = (id) =>
    active.filter((r) => Number(r.parentId) === Number(id)).sort(sortByOrder);

  let serial = 0;
  return active
    .filter((r) => Number(r.parentId) === 0)
    .sort(sortByOrder)
    .map((criteria) => {
      const indicators = childrenOf(criteria.id).map((indicator) => {
        const subs = childrenOf(indicator.id);
        // Two level fallback: indicator without children is itself a sub-indicator
        const subRows = subs.length > 0 ? subs : [indicator];
        serial += 1;
        return {
          id: String(indicator.id),
          serial,
          title: indicator.dropdownName || indicator.description,
          subIndicators: subRows.map((sub) => ({
            id: String(sub.id),
            title: sub.dropdownName || sub.description,
            allocated:
              subs.length > 0
                ? parseAllocatedPoint(sub.description)
                : DEFAULT_ALLOCATED_POINT,
          })),
        };
      });

      const allocatedTotal = indicators.reduce(
        (sum, ind) =>
          sum + ind.subIndicators.reduce((s, sub) => s + sub.allocated, 0),
        0,
      );
      const meta = parseCriteriaMeta(criteria.description, allocatedTotal);

      return {
        id: String(criteria.id),
        title: criteria.dropdownName || criteria.description,
        level: meta.level,
        weight: meta.weight,
        allocatedTotal,
        indicators,
      };
    });
};

export const getAllSubIndicators = (tree = []) =>
  tree.flatMap((c) => c.indicators.flatMap((i) => i.subIndicators));

export const getPointOptions = (allocated = DEFAULT_ALLOCATED_POINT) =>
  Array.from({ length: allocated + 1 }, (_, i) => allocated - i);

const toNumber = (value) =>
  value === "" || value === null || value === undefined ? null : Number(value);

/**
 * Calculates totals for one criteria.
 * points : { [subIndicatorId]: number }
 */
export const computeCriteriaScore = (criteria, points = {}) => {
  let earned = 0;
  let answered = 0;
  let total = 0;
  criteria.indicators.forEach((ind) =>
    ind.subIndicators.forEach((sub) => {
      total += 1;
      const value = toNumber(points[sub.id]);
      if (value !== null && !Number.isNaN(value)) {
        earned += value;
        answered += 1;
      }
    }),
  );
  const score =
    criteria.allocatedTotal > 0
      ? (earned / criteria.allocatedTotal) * criteria.weight
      : 0;
  return {
    allocated: criteria.allocatedTotal,
    earned,
    answered,
    total,
    score,
  };
};

export const computeSummary = (tree = [], points = {}) => {
  const rows = tree.map((criteria, index) => ({
    sl: index + 1,
    id: criteria.id,
    title: criteria.title,
    level: criteria.level,
    weight: criteria.weight,
    ...computeCriteriaScore(criteria, points),
  }));
  const totalWeight = rows.reduce((s, r) => s + Number(r.weight || 0), 0);
  const totalScore =
    Math.round(rows.reduce((s, r) => s + r.score, 0) * 100) / 100;
  const answered = rows.reduce((s, r) => s + r.answered, 0);
  const total = rows.reduce((s, r) => s + r.total, 0);
  return {
    rows,
    totalWeight,
    totalScore,
    answered,
    total,
    complete: total > 0 && answered === total,
    grade: resolveGrade(totalScore),
  };
};

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result.split(",")[1],
        contentType: file.type || "application/octet-stream",
      });
    reader.onerror = reject;
  });

export const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    padding: "4px 8px",
    fontSize: "0.80rem",
    lineHeight: 1.3,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

// Row factories for the ACCREDITATORS section
let rowKey = 0;
export const newAccreditorRow = (data = {}) => ({
  key: `acc-${Date.now()}-${rowKey++}`,
  userId: data.userId || "",
  name: data.name || "",
});
export const newCoordinatorRow = (data = {}) => ({
  key: `coo-${Date.now()}-${rowKey++}`,
  name: data.name || "",
  designation: data.designation || "",
});
