// Shared helpers for CMFG monitoring (apply + review pages)

export const isError = (res) => res instanceof Error || res?.isAxiosError;

export const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const STATUS_COLOR = (status = "") => {
  const s = status.toLowerCase();
  if (/(approv|complet|verified)/.test(s)) return "success";
  if (/(reject|cancel)/.test(s)) return "error";
  if (/(resubmit|return|pending|hold)/.test(s)) return "warning";
  if (/(submit|initiat|progress|review)/.test(s)) return "info";
  return "default";
};

export const headCellSx = {
  fontWeight: 600,
  color: "text.secondary",
  textTransform: "uppercase",
  fontSize: "0.72rem",
  letterSpacing: 0.4,
  bgcolor: "#fafafa",
  whiteSpace: "nowrap",
};

// Bordered, compact table (all cells outlined)
export const BORDERED_TABLE = {
  borderCollapse: "collapse",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    py: 0.5,
    px: 1,
    fontSize: "0.8rem",
    lineHeight: 1.3,
    verticalAlign: "middle",
  },
  "& th": {
    py: 0.75,
  },
};

// Builds the checklist tree from the flat quality standard list.
// Supported shapes:  PARENT -> CHECKLIST   and   PARENT -> SUB_PARENT -> CHECKLIST
// Each row may carry itemType (PARENT / SUB_PARENT / CHECKLIST); older rows without it
// are inferred: top level = parent, has children = sub parent, leaf = checklist item.
export const ITEM_TYPES = {
  PARENT: "PARENT",
  SUB_PARENT: "SUB_PARENT",
  CHECKLIST: "CHECKLIST",
};

export const isActiveItem = (x) =>
  x.isActive === undefined || x.isActive === null || Number(x.isActive) === 1;

export const buildStandardTree = (list = [], { includeInactive = false, keepEmpty = false } = {}) => {
  const items = includeInactive ? list : list.filter(isActiveItem);
  const byOrder = (a, b) =>
    (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) || a.id - b.id;
  const ids = new Set(items.map((x) => x.id));
  const childrenOf = (id) => items.filter((x) => x.parentId === id).sort(byOrder);

  const toNode = (x, depth, seen) => {
    if (seen.has(x.id)) return null; // guard against bad parent loops
    const nextSeen = new Set(seen).add(x.id);
    const kids = childrenOf(x.id)
      .map((c) => toNode(c, depth + 1, nextSeen))
      .filter(Boolean);
    const explicit = (x.itemType || "").toUpperCase();
    const kind = ITEM_TYPES[explicit]
      ? explicit
      : depth === 0
        ? ITEM_TYPES.PARENT
        : kids.length > 0
          ? ITEM_TYPES.SUB_PARENT
          : ITEM_TYPES.CHECKLIST;
    return {
      id: String(x.id),
      title: x.dropdownName || x.description,
      description: x.description,
      displayOrder: x.displayOrder,
      isActive: isActiveItem(x),
      raw: x,
      kind,
      depth,
      number: "",
      children: kids,
    };
  };

  // A heading is kept only if some checklist item sits below it
  const hasItems = (n) =>
    n.kind === ITEM_TYPES.CHECKLIST || n.children.some(hasItems);
  const prune = (n) => ({
    ...n,
    children: (keepEmpty ? n.children : n.children.filter(hasItems)).map(prune),
  });

  // roots: parentId 0 / null, or pointing to a parent that is not in the list
  let roots = items
    .filter((x) => !x.parentId || x.parentId === 0 || !ids.has(x.parentId))
    .sort(byOrder)
    .map((x) => toNode(x, 0, new Set()))
    .filter(Boolean);
  if (!keepEmpty) roots = roots.filter(hasItems);
  roots = roots.map(prune);

  // numbering without gaps (1, 1.1, 1.1.1 ...)
  const renumber = (n, number) => ({
    ...n,
    number,
    children: n.children.map((c, i) => renumber(c, `${number}.${i + 1}`)),
  });
  return roots.map((r, i) => renumber(r, String(i + 1)));
};

// Answerable checklist items under a node
export const leavesOf = (node) =>
  node.kind === ITEM_TYPES.CHECKLIST
    ? [node]
    : node.children.flatMap(leavesOf);

// Flattens a parent into table rows: sub parent headings + checklist items
export const flattenSection = (node) => {
  const out = [];
  const walk = (n) => {
    if (n.kind === ITEM_TYPES.CHECKLIST) {
      out.push({ type: "item", ...n });
      return;
    }
    if (n.depth > 0) out.push({ type: "group", ...n }); // sub parent
    n.children.forEach(walk);
  };
  walk(node);
  return out;
};
