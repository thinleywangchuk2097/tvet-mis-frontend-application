// Shared helpers and hooks for the report pages (components are in ReportParts.jsx)
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

// created_at -> "YYYY-MM-DD" (handles ISO strings and [y, m, d, ...] arrays)
export const toDateOnly = (value) => {
  if (!value) return "";
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0];
};

// distinct, non-empty values of one column, sorted A-Z (dropdown options)
export const uniqSorted = (list, key) =>
  [...new Set(list.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b)),
  );

// created date within From / End date (inclusive)
export const inDateRange = (date, fromDate, toDate) =>
  (!fromDate || (date && date >= fromDate)) &&
  (!toDate || (date && date <= toDate));

// true when any of the values contains the search text (case-insensitive)
export const matchesSearch = (search, values) => {
  const s = search.trim().toLowerCase();
  return (
    !s ||
    values.some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(s),
    )
  );
};

// a filter dropdown that is set must match the row value
export const matchesSelects = (row, filters, keys) =>
  keys.every((k) => !filters[k] || row[k] === filters[k]);

export const today = () => new Date().toISOString().split("T")[0];

// rows of the current page
export const pageOf = (list, { page, rowsPerPage }) =>
  list.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

// filter dropdowns both reports have
export const locationFilter = (options) => ({
  label: "Location",
  name: "dzongkhag",
  allLabel: "All Locations",
  options,
});
export const statusFilter = (options) => ({
  label: "Status",
  name: "status",
  allLabel: "All Statuses",
  options,
});

/**
 * Loads a report once the token is available.
 * fetchReport(token) -> axios response; toRows(data) -> table rows. Keep both module-level (stable).
 */
export const useReportRows = (fetchReport, toRows) => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!access_token) return;
    setLoading(true);
    try {
      const res = await fetchReport(access_token);
      if (res instanceof Error || res?.isAxiosError) throw res;
      setRows(toRows(Array.isArray(res?.data) ? res.data : []));
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("Failed to load the report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [access_token, fetchReport, toRows]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading };
};

/**
 * Filter + paging state. extraChanges(name, value) can return other fields to reset
 * (e.g. clear the level when the category changes).
 */
export const useReportFilters = (emptyFilters, extraChanges) => {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...extraChanges?.(name, value),
    }));
    setPage(0);
  };

  const onClear = () => {
    setFilters(emptyFilters);
    setPage(0);
  };

  return {
    filters,
    onChange,
    onClear,
    paging: { page, rowsPerPage, setPage, setRowsPerPage },
  };
};
