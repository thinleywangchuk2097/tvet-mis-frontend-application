// BQF, RPL and Non-BQF programmes report
// Data: AccreditedCourse (BQF / RPL) + NonAccreditedCourse (Non-BQF)
import { useMemo } from "react";
import {
  Paper,
  Typography,
  Grid,
  Box,
  Chip,
  TableRow,
  TableCell,
} from "@mui/material";
import { exportToExcel } from "@/utils/exportExcel";
import ReportService from "../../api/services/internal/report/ReportService";
import {
  toDateOnly,
  uniqSorted,
  inDateRange,
  matchesSearch,
  matchesSelects,
  today,
  pageOf,
  locationFilter,
  statusFilter,
  useReportRows,
  useReportFilters,
} from "./reportUtils";
import {
  FilterBar,
  DateSearchBar,
  ReportTable,
  StatusBadge,
} from "./ReportParts";

// Chip colours cycle through the programme types (names come from tbl_service_master)
const TYPE_COLORS = ["primary", "secondary", "success", "info", "warning"];

const fmtDate = (value) => toDateOnly(value) || "—";

const EMPTY_FILTERS = {
  category: "",
  level: "",
  dzongkhag: "",
  status: "",
  fromDate: "",
  toDate: "",
  search: "",
};

const HEADERS = [
  "#",
  "Application No.",
  "Type",
  "Programme",
  "Certificate Level",
  "Institute",
  "Location",
  { label: "Capacity", align: "center" },
  "Status",
  "Date",
];

// changing the programme type clears the certificate level (its list depends on the type)
const resetLevelOnCategory = (name) =>
  name === "category" ? { level: "" } : {};

const fetchReport = (token) => ReportService.getProgrammesReport(token);

const toRows = (data) =>
  data
    .map((r) => ({
      key: `${r.service_id}-${r.application_no}-${r.id}`,
      applicationNo: r.application_no || "N/A",
      category: r.programme_category || "Not set",
      programme: r.programme_title || "N/A",
      level: r.certification_level || "",
      sector: r.sector_name || "",
      occupation: r.occupation_name || "",
      institute: r.institute_name || "",
      dzongkhag: r.dzongkhag_name || "",
      fees: r.fees_per_trainee ?? "",
      capacity: r.enrolment_capacity ?? "",
      registrationDate: toDateOnly(r.registration_date),
      validityDate: toDateOnly(r.validity_date),
      status: r.status_name || "Pending",
      date: toDateOnly(r.created_at),
    }))
    // newest first across both sources
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

const toExcelRow = (r, i) => ({
  SlNo: i + 1,
  ApplicationNo: r.applicationNo,
  Category: r.category,
  Programme: r.programme,
  CertificateLevel: r.level,
  Sector: r.sector,
  Occupation: r.occupation,
  Institute: r.institute,
  Location: r.dzongkhag,
  FeesPerTrainee: r.fees,
  EnrolmentCapacity: r.capacity,
  RegistrationDate: r.registrationDate,
  ValidityDate: r.validityDate,
  Status: r.status,
  AppliedOn: r.date,
});

const BQFRPLNonBQFProgrammesReport = () => {
  const { rows, loading } = useReportRows(fetchReport, toRows);
  const { filters, onChange, onClear, paging } = useReportFilters(
    EMPTY_FILTERS,
    resetLevelOnCategory,
  );

  // dropdowns (options from the data; the level list follows the chosen category)
  const categories = useMemo(() => uniqSorted(rows, "category"), [rows]);
  const selects = useMemo(() => {
    const inCategory = filters.category
      ? rows.filter((r) => r.category === filters.category)
      : rows;
    return [
      {
        label: "Programme Type",
        name: "category",
        allLabel: "All Types",
        options: categories,
      },
      {
        label: "Certificate Level",
        name: "level",
        allLabel: "All Levels",
        options: uniqSorted(inCategory, "level"),
      },
      locationFilter(uniqSorted(rows, "dzongkhag")),
      statusFilter(uniqSorted(rows, "status")),
    ];
  }, [rows, categories, filters.category]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          matchesSelects(r, filters, [
            "category",
            "level",
            "dzongkhag",
            "status",
          ]) &&
          inDateRange(r.date, filters.fromDate, filters.toDate) &&
          matchesSearch(filters.search, [
            r.applicationNo,
            r.programme,
            r.institute,
            r.sector,
            r.occupation,
          ]),
      ),
    [rows, filters],
  );

  const categoryColor = (c) => {
    const i = categories.indexOf(c);
    return i >= 0 ? TYPE_COLORS[i % TYPE_COLORS.length] : "default";
  };

  // number of filtered programmes per type (chips next to the dates)
  const summary = useMemo(
    () =>
      categories.map((c) => ({
        label: c,
        n: filtered.filter((r) => r.category === c).length,
      })),
    [filtered, categories],
  );

  const paginated = pageOf(filtered, paging);

  const handleExcelExport = () => {
    const part = filters.category
      ? filters.category.replaceAll(/[^\w-]+/g, "_")
      : "All";
    exportToExcel(filtered.map(toExcelRow), `Programmes_${part}_${today()}`);
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        BQF, RPL & Non-BQF Programmes Report
      </Typography>

      <FilterBar
        selects={selects}
        filters={filters}
        onChange={onChange}
        onClear={onClear}
        onExport={handleExcelExport}
        exportDisabled={filtered.length === 0}
      />

      <DateSearchBar
        filters={filters}
        onChange={onChange}
        searchPlaceholder="Search by programme, institute, application no..."
        searchWidth={320}
      >
        <Grid item>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {summary.map((c) => (
              <Chip
                key={c.label}
                size="small"
                variant="outlined"
                color={categoryColor(c.label)}
                label={`${c.label}: ${c.n}`}
              />
            ))}
          </Box>
        </Grid>
      </DateSearchBar>

      <ReportTable
        headers={HEADERS}
        loading={loading}
        pageCount={paginated.length}
        total={filtered.length}
        paging={paging}
      >
        {paginated.map((r, index) => (
          <TableRow key={r.key} hover>
            <TableCell>
              {paging.page * paging.rowsPerPage + index + 1}
            </TableCell>
            <TableCell>{r.applicationNo}</TableCell>
            <TableCell>
              <Chip
                size="small"
                label={r.category}
                color={categoryColor(r.category)}
                variant="outlined"
              />
            </TableCell>
            <TableCell>{r.programme}</TableCell>
            <TableCell>{r.level || "—"}</TableCell>
            <TableCell>{r.institute || "—"}</TableCell>
            <TableCell>{r.dzongkhag || "—"}</TableCell>
            <TableCell align="center">
              {r.capacity === "" ? "—" : r.capacity}
            </TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {fmtDate(r.date)}
            </TableCell>
          </TableRow>
        ))}
      </ReportTable>
    </Paper>
  );
};

export default BQFRPLNonBQFProgrammesReport;
