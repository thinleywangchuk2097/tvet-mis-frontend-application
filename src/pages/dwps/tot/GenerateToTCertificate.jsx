import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  InputAdornment,
  Skeleton,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import TotService from "../../../api/services/internal/tot/TotService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import { downloadTotMarkSheets } from "../../../utils/pdf/totMarkSheetPdf";

const INSTITUTE_ROLE_ID = "11";

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isError = (res) => res instanceof Error || res?.isAxiosError;

const headCellSx = {
  fontWeight: 600,
  color: "text.secondary",
  textTransform: "uppercase",
  fontSize: "0.72rem",
  letterSpacing: 0.4,
  bgcolor: "#fafafa",
  whiteSpace: "nowrap",
};

const getInitials = (name) =>
  (name || "T")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const GenerateToTCertificate = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const userId = useSelector((state) => state.auth.userId);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const isInstitute = String(currentRoleId) === INSTITUTE_ROLE_ID;
  const [searchParams, setSearchParams] = useSearchParams();

  // Institute users only see their own trainers
  const [instituteId, setInstituteId] = useState(null);
  const [scopeReady, setScopeReady] = useState(!isInstitute);

  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [appNoInput, setAppNoInput] = useState(searchParams.get("applicationNo") || "");

  const [result, setResult] = useState(null); // { program, trainers }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [downloading, setDownloading] = useState(null); // trainerId | "all"

  // ---- resolve institute (institute role only) ----
  useEffect(() => {
    if (!isInstitute || !userId) return;
    (async () => {
      const res = await InstituteRegistrationService.getInstituteDetails(userId);
      const id = !isError(res) ? res?.data?.[0]?.institute_id : null;
      if (id) setInstituteId(id);
      else toast.error("Could not load your institute details");
      setScopeReady(true);
    })();
  }, [isInstitute, userId]);

  // ---- programmes with issued mark sheets ----
  useEffect(() => {
    if (!scopeReady || !accessToken) return;
    (async () => {
      setProgramsLoading(true);
      const res = await TotService.getCertifiedPrograms(instituteId, accessToken);
      if (!isError(res) && Array.isArray(res?.data)) setPrograms(res.data);
      setProgramsLoading(false);
    })();
  }, [scopeReady, instituteId, accessToken]);

  const search = useCallback(
    async (applicationNo) => {
      const appNo = (applicationNo || "").trim();
      if (!appNo) {
        toast.warning("Enter or select an application number");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      setFilter("");
      setPage(0);
      const res = await TotService.getCertificates(appNo, instituteId, accessToken);
      if (isError(res)) {
        setError(
          res?.response?.data?.message || res?.message || "Failed to load certificates",
        );
      } else {
        setResult(res.data);
        setSearchParams({ applicationNo: appNo }, { replace: true });
      }
      setLoading(false);
    },
    [instituteId, accessToken, setSearchParams],
  );

  // Auto-search when opened with ?applicationNo=
  useEffect(() => {
    const fromUrl = searchParams.get("applicationNo");
    if (fromUrl && scopeReady && accessToken && !result && !loading) {
      search(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeReady, accessToken]);

  const trainers = useMemo(() => {
    const list = result?.trainers || [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) =>
      [t.name, t.cid, t.certificateNo, t.instituteName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [result, filter]);

  const programData = result?.program;
  const pdfProgram = programData && {
    programName: programData.programName,
    programCode: programData.programCode,
    venue: programData.venue,
    programStartDate: programData.programStartDate,
    programEndDate: programData.programEndDate,
    modules: programData.modules,
  };

  const toPdfTrainer = (t) => ({ ...t, marks: t.marks || {} });

  const downloadOne = async (t) => {
    setDownloading(t.trainerId);
    try {
      await downloadTotMarkSheets(
        pdfProgram,
        [toPdfTrainer(t)],
        `TOT_Mark_Sheet_${(t.name || t.trainerId).toString().replace(/\s+/g, "_")}.pdf`,
      );
    } catch (e) {
      toast.error(e?.message || "Failed to create PDF");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAll = async () => {
    if (!trainers.length) return;
    setDownloading("all");
    try {
      await downloadTotMarkSheets(
        pdfProgram,
        trainers.map(toPdfTrainer),
        `TOT_Mark_Sheets_${programData.applicationNo}.pdf`,
      );
    } catch (e) {
      toast.error(e?.message || "Failed to create PDF");
    } finally {
      setDownloading(null);
    }
  };

  const selectedProgram =
    programs.find((p) => String(p.application_no) === String(appNoInput)) || null;

  const competent = (result?.trainers || []).filter((t) => t.result === "Competent").length;

  return (
    <Paper
      elevation={0}
      sx={{
        m: 1.25,
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* ---------------- Header ---------------- */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <WorkspacePremiumIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" fontWeight={600}>
            TOT Certificates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Find a TOT programme by application number and download trainers&apos; mark sheets.
            {isInstitute && " Only your institute's trainers are shown."}
          </Typography>
        </Box>
      </Box>

      {/* ---------------- Search ---------------- */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            search(appNoInput);
          }}
          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
        >
          <Autocomplete
            freeSolo
            options={programs}
            loading={programsLoading}
            value={selectedProgram}
            inputValue={appNoInput}
            onInputChange={(e, v) => setAppNoInput(v)}
            onChange={(e, v) => {
              const no = typeof v === "string" ? v : v?.application_no;
              if (no) {
                setAppNoInput(no);
                search(no);
              }
            }}
            getOptionLabel={(o) => (typeof o === "string" ? o : o.application_no || "")}
            isOptionEqualToValue={(o, v) => o.application_no === v.application_no}
            renderOption={(props, o) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest} sx={{ display: "block !important" }}>
                  <Typography variant="body2" fontWeight={600}>
                    {o.application_no} — {o.program_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmtDate(o.program_start_date)} – {fmtDate(o.program_end_date)} ·{" "}
                    {o.certified} certified
                  </Typography>
                </Box>
              );
            }}
            sx={{ flex: 1, minWidth: 280, maxWidth: 560, bgcolor: "background.paper" }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Application No."
                placeholder="Type or pick a TOT application number"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !scopeReady}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {loading ? "Searching..." : "Find certificates"}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box>
          <Skeleton variant="rounded" height={90} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={220} />
        </Box>
      )}

      {/* ---------------- Empty state (no search yet) ---------------- */}
      {!loading && !result && !error && (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <PersonSearchOutlinedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Select a programme or enter its application number to see certified trainers.
          </Typography>
          {!programsLoading && programs.length > 0 && (
            <Typography variant="caption" color="text.disabled">
              {programs.length} programme(s) with issued mark sheets
            </Typography>
          )}
        </Box>
      )}

      {/* ---------------- Result ---------------- */}
      {!loading && result && (
        <>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, mb: 2, borderRadius: 2.5 }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Programme
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {programData?.programName || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {programData?.applicationNo}
                  {programData?.programCode ? ` · ${programData.programCode}` : ""}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Venue
                </Typography>
                <Typography variant="body2">{programData?.venue || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fmtDate(programData?.programStartDate)} – {fmtDate(programData?.programEndDate)}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 6, md: 3 }} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  color="primary"
                  label={`${result.trainers?.length || 0} certified`}
                />
                <Chip
                  color="success"
                  variant="outlined"
                  label={`${competent} competent`}
                />
                <Chip
                  variant="outlined"
                  label={`${programData?.modules?.length || 0} modules`}
                />
              </Grid>
            </Grid>
          </Paper>

          {(result.trainers || []).length === 0 ? (
            <Alert severity="info">
              No mark sheets have been issued for this programme
              {isInstitute ? " for your institute's trainers" : ""} yet.
            </Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  flexWrap: "wrap",
                  mb: 1.5,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Filter by name, CID, certificate no. or institute"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ flex: 1, minWidth: 240, maxWidth: 420 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="contained"
                  color="success"
                  onClick={downloadAll}
                  disabled={downloading !== null || trainers.length === 0}
                  startIcon={
                    downloading === "all" ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PictureAsPdfIcon />
                    )
                  }
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {downloading === "all"
                    ? "Preparing..."
                    : `Download all (${trainers.length})`}
                </Button>
              </Box>

              <TableContainer
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>Trainer</TableCell>
                      {!isInstitute && <TableCell sx={headCellSx}>Institute</TableCell>}
                      <TableCell sx={headCellSx} align="center">
                        Overall %
                      </TableCell>
                      <TableCell sx={headCellSx} align="center">
                        Grade
                      </TableCell>
                      <TableCell sx={headCellSx} align="center">
                        Result
                      </TableCell>
                      <TableCell sx={headCellSx}>Certificate No.</TableCell>
                      <TableCell sx={headCellSx}>Issued</TableCell>
                      <TableCell sx={headCellSx} align="center">
                        Mark sheet
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No trainers match your filter
                        </TableCell>
                      </TableRow>
                    ) : (
                      trainers.slice(page * rows, page * rows + rows).map((t) => (
                        <TableRow key={t.trainerId} hover sx={{ "& td": { py: 1.25 } }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar sx={{ width: 34, height: 34, fontSize: "0.8rem", bgcolor: "primary.main" }}>
                                {getInitials(t.name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {t.name || "—"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  CID: {t.cid || "—"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          {!isInstitute && (
                            <TableCell>
                              <Typography variant="body2">{t.instituteName || "—"}</Typography>
                            </TableCell>
                          )}
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {t.overallPercentage != null
                                ? `${Number(t.overallPercentage).toFixed(2)} %`
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip size="small" variant="outlined" label={t.grade || "—"} />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={t.result || "—"}
                              color={t.result === "Competent" ? "success" : "error"}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                              {t.certificateNo}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {fmtDate(t.generatedAt)}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Download mark sheet (PDF)">
                              <span>
                                <Button
                                  size="small"
                                  onClick={() => downloadOne(t)}
                                  disabled={downloading !== null}
                                  startIcon={
                                    downloading === t.trainerId ? (
                                      <CircularProgress size={14} />
                                    ) : (
                                      <DownloadIcon />
                                    )
                                  }
                                  sx={{ textTransform: "none" }}
                                >
                                  Download
                                </Button>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={trainers.length}
                  page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rows}
                  onRowsPerPageChange={(e) => {
                    setRows(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                />
              </TableContainer>
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default GenerateToTCertificate;
