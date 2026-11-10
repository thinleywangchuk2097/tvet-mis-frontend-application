// src/pages/public/reports/RegisteredReport.jsx
// Shared public report for approved Assessors / Accreditors / QMS Auditors.
import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Box,
  Grid,
  Chip,
  CircularProgress,
} from "@mui/material";
import AssessorAccreditorQMSAuditorService from "../../../api/services/internal/registration/AssessorAccreditorQMSAuditorService";
import {
  PAPER_PROPS,
  TABLE_SX,
  INPUT_SX,
  ROWS_PER_PAGE_OPTIONS,
} from "./reportStyles";

const toRow = (item) => ({
  id: item.id,
  name: item.full_name || "—",
  registrationNo: item.registration_no || "—",
  gender: item.gender || "—",
  organization: item.organization_name || "—",
  dzongkhag: item.dzongkhag_name || "—",
  sector: item.sector_name || "—",
  occupation: item.occupation_name || "—",
  certificate: item.certification_level_name || "—",
});

// Assessor/Accreditor show the occupation they are registered for; QMS Auditor the organization
const COLUMNS = {
  occupation: [
    { id: "name", label: "Name" },
    { id: "registrationNo", label: "Registration No." },
    { id: "gender", label: "Gender" },
    { id: "sector", label: "Sector" },
    { id: "occupation", label: "Occupation" },
    { id: "certificate", label: "Certificate Level" },
  ],
  organization: [
    { id: "name", label: "Name" },
    { id: "registrationNo", label: "Registration No." },
    { id: "gender", label: "Gender" },
    { id: "organization", label: "Organization" },
    { id: "dzongkhag", label: "Dzongkhag" },
  ],
};

const RegisteredReport = ({ serviceId, title, description, columnSet = "occupation" }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = COLUMNS[columnSet] || COLUMNS.occupation;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await AssessorAccreditorQMSAuditorService.getRegisteredByServiceId(
          serviceId,
        );
        if (res instanceof Error || res?.isAxiosError) throw res;
        setRows(Array.isArray(res?.data) ? res.data.map(toRow) : []);
      } catch (error) {
        console.error("Error loading registered list:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      columns.some((c) => String(r[c.id]).toLowerCase().includes(s)),
    );
  }, [rows, search, columns]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const colSpan = columns.length + 1;

  return (
    <Paper {...PAPER_PROPS}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      )}

      <Grid container spacing={1} alignItems="center" sx={{ justifyContent: "flex-end", mb: 2 }}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by Name, Registration No. or Occupation"
            sx={INPUT_SX}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_SX}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              {columns.map((c) => (
                <TableCell key={c.id}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginated.length > 0 ? (
              paginated.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.id}>
                      {c.id === "name" ? (
                        <Typography variant="body2" fontWeight="medium">
                          {row.name}
                        </Typography>
                      ) : c.id === "certificate" && row.certificate !== "—" ? (
                        <Chip label={row.certificate} size="small" color="primary" variant="outlined" />
                      ) : (
                        row[c.id]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colSpan} align="center">
                  {search ? "No records match your search" : "No data available in table"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Paper>
  );
};

RegisteredReport.propTypes = {
  serviceId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  columnSet: PropTypes.oneOf(["occupation", "organization"]),
};

export default RegisteredReport;
