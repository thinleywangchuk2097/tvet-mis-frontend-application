// Assessor / Accreditor / QMS Auditor registrations report
// Data: tbl_assessor_accreditor_auditor_registration (AssessorAccreditorQMSAuditorController)
import { useMemo } from "react";
import { Paper, Typography, TableRow, TableCell } from "@mui/material";
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

// Registration types (service ids)
const REGISTRATION_TYPES = [
  { id: 32, name: "Assessor" },
  { id: 5, name: "Accreditor" },
  { id: 3, name: "QMS Auditor" },
];
const TYPE_OPTIONS = REGISTRATION_TYPES.map((t) => ({
  value: String(t.id),
  label: t.name,
}));

const typeName = (serviceId, fallback) =>
  REGISTRATION_TYPES.find((t) => t.id === Number(serviceId))?.name ||
  fallback ||
  "N/A";

const EMPTY_FILTERS = {
  type: "",
  status: "",
  dzongkhag: "",
  sector: "",
  fromDate: "",
  toDate: "",
  search: "",
};

const HEADERS = [
  "#",
  "Application No.",
  "Registration No.",
  "Type",
  "Name",
  "CID",
  "Gender",
  "Sector / Occupation",
  "Location",
  "Status",
  "Date",
];

const fetchReport = (token) =>
  ReportService.getAssessorAccreditorAuditorReport(token);

const toRows = (data) =>
  data.map((r) => ({
    id: r.id,
    applicationNo: r.application_no || "N/A",
    registrationNo: r.registration_no || "",
    serviceId: Number(r.service_id),
    type: typeName(r.service_id, r.service_name),
    name: r.full_name || "N/A",
    cid: r.cid_no || "",
    gender: r.gender || "",
    mobile: r.mobile_no || "",
    email: r.email || "",
    dzongkhag: r.dzongkhag_name || "",
    organization: r.organization_name || "",
    designation: r.designation || "",
    experience: r.years_of_experience ?? "",
    sector: r.sector_name || "",
    occupation: r.occupation_name || "",
    level: r.certification_level_name || "",
    qmsTraining: r.qms_training || "",
    status: r.status_name || "Pending",
    date: toDateOnly(r.created_at),
  }));

// QMS auditors show their organisation, the others their sector / occupation
const workArea = (r) =>
  r.serviceId === 3
    ? r.organization || "—"
    : [r.sector, r.occupation].filter(Boolean).join(" / ") || "—";

const toExcelRow = (r, i) => ({
  SlNo: i + 1,
  ApplicationNo: r.applicationNo,
  RegistrationNo: r.registrationNo,
  Type: r.type,
  Name: r.name,
  CID: r.cid,
  Gender: r.gender,
  Mobile: r.mobile,
  Email: r.email,
  Dzongkhag: r.dzongkhag,
  Organization: r.organization,
  Designation: r.designation,
  Experience: r.experience,
  Sector: r.sector,
  Occupation: r.occupation,
  CertificateLevel: r.level,
  QMSTraining: r.qmsTraining,
  Status: r.status,
  Date: r.date,
});

const AssessorAccreditorAuditorReport = () => {
  const { rows, loading } = useReportRows(fetchReport, toRows);
  const { filters, onChange, onClear, paging } =
    useReportFilters(EMPTY_FILTERS);

  // dropdowns (options from the data)
  const selects = useMemo(
    () => [
      {
        label: "Registration Type",
        name: "type",
        allLabel: "All Types",
        options: TYPE_OPTIONS,
      },
      {
        label: "Sector",
        name: "sector",
        allLabel: "All Sectors",
        options: uniqSorted(rows, "sector"),
      },
      locationFilter(uniqSorted(rows, "dzongkhag")),
      statusFilter(uniqSorted(rows, "status")),
    ],
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.type || r.serviceId === Number(filters.type)) &&
          matchesSelects(r, filters, ["status", "dzongkhag", "sector"]) &&
          inDateRange(r.date, filters.fromDate, filters.toDate) &&
          matchesSearch(filters.search, [
            r.name,
            r.applicationNo,
            r.registrationNo,
            r.cid,
            r.organization,
            r.occupation,
          ]),
      ),
    [rows, filters],
  );

  const paginated = pageOf(filtered, paging);

  const handleExcelExport = () => {
    const typePart = filters.type
      ? typeName(filters.type).replaceAll(/\s+/g, "_")
      : "All";
    exportToExcel(
      filtered.map(toExcelRow),
      `Assessor_Accreditor_Auditor_${typePart}_${today()}`,
    );
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Assessor, Accreditor & QMS Auditor Report
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
        searchPlaceholder="Search by name, CID, application no..."
        searchWidth={300}
      />

      <ReportTable
        headers={HEADERS}
        loading={loading}
        pageCount={paginated.length}
        total={filtered.length}
        paging={paging}
      >
        {paginated.map((r, index) => (
          <TableRow key={r.id ?? r.applicationNo} hover>
            <TableCell>
              {paging.page * paging.rowsPerPage + index + 1}
            </TableCell>
            <TableCell>{r.applicationNo}</TableCell>
            <TableCell>{r.registrationNo || "—"}</TableCell>
            <TableCell>{r.type}</TableCell>
            <TableCell>{r.name}</TableCell>
            <TableCell>{r.cid || "—"}</TableCell>
            <TableCell>{r.gender || "—"}</TableCell>
            <TableCell>{workArea(r)}</TableCell>
            <TableCell>{r.dzongkhag || "—"}</TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{r.date || "—"}</TableCell>
          </TableRow>
        ))}
      </ReportTable>
    </Paper>
  );
};

export default AssessorAccreditorAuditorReport;
