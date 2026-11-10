import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  Typography,
  Alert,
  AlertTitle,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CategoryIcon from "@mui/icons-material/Category";
import WorkIcon from "@mui/icons-material/Work";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RefreshIcon from "@mui/icons-material/Refresh";
import SectorOccupationService from "../../api/services/internal/master/SectorOccupationService";
import NcsService from "../../api/services/internal/ncs/NcsService";
import CommonService from "../../api/services/internal/common/CommonService";
import { Empty, Kpi, Panel } from "./DashboardParts";
import { fmtNum, headCellSx } from "./dashboardUtils";

const CERTIFICATE_LEVEL_PARENT_ID = 27;
const EXPIRY_WINDOW_DAYS = 90; // "expiring soon" = within 3 months

const isError = (res) => res instanceof Error || res?.isAxiosError;
const listOf = (res) =>
  !isError(res) && Array.isArray(res?.data) ? res.data : [];

const parseJson = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const toDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const fmtDate = (d) => {
  const date = toDate(d);
  return date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
};

/** Sector & occupation list -> [{ id, name, occupations: [{id, name, iscoCode}] }] */
const parseSectors = (res) => {
  const rows = listOf(res);
  const raw = rows[0]?.result ?? res?.data?.result;
  return parseJson(raw).map((s) => ({
    id: s.sector_id,
    name: s.sector_name,
    occupations: parseJson(s.occupations).map((o) => ({
      id: o.occupation_id,
      name: o.occupation_name,
      iscoCode: o.isco_code,
    })),
  }));
};

const BORDERED_TABLE = {
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
  "& th": { ...headCellSx, py: 0.75 },
};

// Single-series bar chart (one hue, no legend; the panel title names the series)
const CountBarChart = ({ data, name, color, horizontal = false }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      layout={horizontal ? "vertical" : "horizontal"}
      margin={horizontal ? { left: 8, right: 16 } : { left: -20, right: 8 }}
      barCategoryGap={4}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={horizontal}
        horizontal={!horizontal}
      />
      {horizontal ? (
        <>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fontSize: 11 }}
          />
        </>
      ) : (
        <>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        </>
      )}
      <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
      <Bar
        dataKey="value"
        name={name}
        fill={color}
        radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
        barSize={horizontal ? 14 : 22}
      />
    </BarChart>
  </ResponsiveContainer>
);
CountBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  horizontal: PropTypes.bool,
};

const SQSDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sectors, setSectors] = useState([]);
  const [ncsList, setNcsList] = useState([]);
  const [levels, setLevels] = useState([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError("");
    try {
      const [sectorRes, ncsRes, levelRes] = await Promise.all([
        SectorOccupationService.getAllSectorOccupationsList(accessToken),
        NcsService.getNcsDetails(accessToken),
        CommonService.getByParentId(CERTIFICATE_LEVEL_PARENT_ID),
      ]);
      if (isError(sectorRes) || isError(ncsRes)) {
        setLoadError(
          "Some dashboard data could not be loaded. Try refreshing.",
        );
      }
      setSectors(parseSectors(sectorRes));
      setNcsList(listOf(ncsRes));
      setLevels(listOf(levelRes));
    } catch (e) {
      console.error("SQS dashboard load failed:", e);
      setLoadError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------- derived data ----------------
  const sectorName = useCallback(
    (id) =>
      sectors.find((s) => Number(s.id) === Number(id))?.name || `Sector ${id}`,
    [sectors],
  );
  const levelName = useCallback(
    (id) => levels.find((l) => Number(l.id) === Number(id))?.name || "Not set",
    [levels],
  );

  const ncs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + EXPIRY_WINDOW_DAYS);
    return ncsList.map((n) => {
      const validity = toDate(n.validity_date);
      let state = "valid";
      if (!validity) state = "none";
      else if (validity < today) state = "expired";
      else if (validity <= soon) state = "soon";
      return {
        id: n.id,
        sectorId: n.sector_id,
        occupationId: n.occupation_id,
        occupation: n.occupation_name || `Occupation ${n.occupation_id}`,
        levelId: n.certification_id,
        title: n.programme_title || "—",
        validity,
        state,
        units: parseJson(n.units).filter(
          (u) => u && (u.unitCode || u.unitTitle),
        ).length,
      };
    });
  }, [ncsList]);

  const stats = useMemo(() => {
    const occupations = sectors.reduce((a, s) => a + s.occupations.length, 0);
    const occWithNcs = new Set(ncs.map((n) => String(n.occupationId)));
    return {
      sectors: sectors.length,
      occupations,
      occupationsCovered: sectors.reduce(
        (a, s) =>
          a + s.occupations.filter((o) => occWithNcs.has(String(o.id))).length,
        0,
      ),
      ncs: ncs.length,
      units: ncs.reduce((a, n) => a + n.units, 0),
      expired: ncs.filter((n) => n.state === "expired").length,
      soon: ncs.filter((n) => n.state === "soon").length,
    };
  }, [sectors, ncs]);

  const coveragePct = stats.occupations
    ? Math.round((stats.occupationsCovered / stats.occupations) * 100)
    : 0;

  // NCS per sector (top 10)
  const ncsBySector = useMemo(() => {
    const counts = {};
    ncs.forEach((n) => {
      counts[n.sectorId] = (counts[n.sectorId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, value]) => ({ label: sectorName(id), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [ncs, sectorName]);

  // NCS per BQF level
  const ncsByLevel = useMemo(() => {
    const counts = {};
    ncs.forEach((n) => {
      const key = levelName(n.levelId);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [ncs, levelName]);

  // Sector coverage table
  const sectorRows = useMemo(() => {
    const ncsBySectorId = {};
    ncs.forEach((n) => {
      const k = String(n.sectorId);
      if (!ncsBySectorId[k]) ncsBySectorId[k] = { count: 0, occ: new Set() };
      ncsBySectorId[k].count += 1;
      ncsBySectorId[k].occ.add(String(n.occupationId));
    });
    return sectors
      .map((s) => {
        const info = ncsBySectorId[String(s.id)] || {
          count: 0,
          occ: new Set(),
        };
        const covered = s.occupations.filter((o) =>
          info.occ.has(String(o.id)),
        ).length;
        return {
          id: s.id,
          name: s.name,
          occupations: s.occupations.length,
          ncs: info.count,
          covered,
          pct: s.occupations.length
            ? Math.round((covered / s.occupations.length) * 100)
            : 0,
        };
      })
      .sort((a, b) => b.ncs - a.ncs || a.name.localeCompare(b.name));
  }, [sectors, ncs]);

  // NCS that need attention: expired or expiring within 3 months, soonest first
  const attention = useMemo(
    () =>
      ncs
        .filter((n) => n.state === "expired" || n.state === "soon")
        .sort((a, b) => a.validity - b.validity)
        .slice(0, 8),
    [ncs],
  );

  const busy = loading && !sectors.length && !ncs.length;

  return (
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      {/* ---------------- Header ---------------- */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          borderRadius: 3,
          background: (t) =>
            `linear-gradient(120deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha(
              t.palette.primary.main,
              0.01,
            )})`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            sx={{ bgcolor: "primary.main", width: 52, height: 52 }}
            variant="rounded"
          >
            <MenuBookIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h6" fontWeight={700}>
              Standards & Qualifications Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sectors, occupations and National Competency Standards (NCS)
            </Typography>
          </Box>
          <MuiTooltip title="Refresh">
            <span>
              <IconButton onClick={load} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>

        {/* Quick actions */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
          {[
            {
              label: "Sector & occupation",
              to: "/master/sector-occupation-index",
              icon: <CategoryIcon />,
            },
            { label: "NCS", to: "/ncs/create-index", icon: <MenuBookIcon /> },
          ].map((a) => (
            <Button
              key={a.to}
              size="small"
              variant="outlined"
              startIcon={a.icon}
              onClick={() => navigate(a.to)}
              sx={{ textTransform: "none", bgcolor: "background.paper" }}
            >
              {a.label}
            </Button>
          ))}
        </Box>
      </Paper>

      {loading && !busy && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
      {loadError && !loading && (
        <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
          {loadError}
        </Typography>
      )}

      {/* ---------------- Expiry reminders ---------------- */}
      {!loading && (stats.expired > 0 || stats.soon > 0) && (
        <Alert
          severity="error"
          sx={{ mb: 2, alignItems: "flex-start" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/ncs/create-index")}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Review NCS
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>NCS expiry reminder</AlertTitle>
          {stats.expired > 0 && (
            <>
              <strong>{fmtNum(stats.expired)}</strong> NCS expired
              {stats.soon > 0 ? " and " : ". "}
            </>
          )}
          {stats.soon > 0 && (
            <>
              <strong>{fmtNum(stats.soon)}</strong> NCS expire within the next 3 months.{" "}
            </>
          )}
          {attention.length > 0 && (
            <Box component="span" sx={{ display: "block", mt: 0.5 }}>
              Next due:{" "}
              {attention
                .slice(0, 3)
                .map(
                  (n) =>
                    `${n.occupation} (${n.state === "expired" ? "expired" : "due"} ${fmtDate(
                      n.validity,
                    )})`,
                )
                .join(" · ")}
            </Box>
          )}
        </Alert>
      )}

      {/* ---------------- KPIs ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Sectors"
            value={fmtNum(stats.sectors)}
            icon={<CategoryIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Occupations"
            value={fmtNum(stats.occupations)}
            sub={`${fmtNum(stats.occupationsCovered)} with NCS (${coveragePct}%)`}
            icon={<WorkIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="NCS published"
            value={fmtNum(stats.ncs)}
            icon={<MenuBookIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="Units of competency"
            value={fmtNum(stats.units)}
            sub={
              stats.ncs
                ? `${(stats.units / stats.ncs).toFixed(1)} per NCS`
                : null
            }
            icon={<ListAltIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Kpi
            title="NCS expired"
            value={fmtNum(stats.expired)}
            sub={`${fmtNum(stats.soon)} expiring within 3 months`}
            icon={<EventBusyIcon />}
            color="error"
            loading={loading}
            highlight={stats.expired > 0}
          />
        </Grid>
      </Grid>

      {/* ---------------- Charts ---------------- */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel title="NCS by sector (top 10)">
            <Box sx={{ height: 280 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : ncsBySector.length ? (
                <CountBarChart
                  data={ncsBySector}
                  name="NCS"
                  color={theme.palette.primary.main}
                  horizontal
                />
              ) : (
                <Empty text="No NCS yet" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="NCS by BQF certificate level">
            <Box sx={{ height: 280 }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" />
              ) : ncsByLevel.length ? (
                <CountBarChart
                  data={ncsByLevel}
                  name="NCS"
                  color={theme.palette.success.main}
                />
              ) : (
                <Empty text="No NCS yet" />
              )}
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {/* ---------------- Tables ---------------- */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="NCS coverage by sector"
            action={
              <Button
                size="small"
                onClick={() => navigate("/master/sector-occupation-index")}
                sx={{ textTransform: "none" }}
              >
                Manage
              </Button>
            }
          >
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                <TableHead>
                  <TableRow>
                    <TableCell>Sector</TableCell>
                    <TableCell align="center">Occupations</TableCell>
                    <TableCell align="center">NCS</TableCell>
                    <TableCell align="center">Occupations with NCS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : sectorRows.length ? (
                    sectorRows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.name}</TableCell>
                        <TableCell align="center">
                          {fmtNum(r.occupations)}
                        </TableCell>
                        <TableCell align="center">{fmtNum(r.ncs)}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={r.pct}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              color={
                                r.pct >= 75
                                  ? "success"
                                  : r.pct >= 40
                                    ? "primary"
                                    : "warning"
                              }
                            />
                            <Typography
                              variant="caption"
                              sx={{ minWidth: 70, textAlign: "right" }}
                            >
                              {r.covered}/{r.occupations} ({r.pct}%)
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No sectors found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Panel
            title="NCS needing review"
            action={
              <Button
                size="small"
                onClick={() => navigate("/ncs/create-index")}
                sx={{ textTransform: "none" }}
              >
                Open NCS
              </Button>
            }
          >
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader sx={BORDERED_TABLE}>
                <TableHead>
                  <TableRow>
                    <TableCell>Occupation / Programme</TableCell>
                    <TableCell>Valid till</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : attention.length ? (
                    attention.map((n) => (
                      <TableRow key={n.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            fontSize="0.8rem"
                          >
                            {n.occupation}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {n.title} · {sectorName(n.sectorId)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {fmtDate(n.validity)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={
                              n.state === "expired"
                                ? "Expired"
                                : "Expiring soon"
                            }
                            color={n.state === "expired" ? "error" : "warning"}
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        All NCS are valid for at least 3 months
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SQSDashboard;
