import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Divider,
  useTheme,
} from "@mui/material";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSelector } from "react-redux";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import RoleOverviewDashboard from "./RoleOverviewDashboard";
import { Panel, Kpi, Empty } from "./DashboardParts";
import { headCellSx, fmtNum } from "./dashboardUtils";
import DashboardService from "../../api/services/internal/dashboard/InstituteDashboardService";

// ---------------------------------------------------------------- admin section
const AdminSection = ({ fromDate, toDate, reloadTick }) => {
  const theme = useTheme();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!accessToken) return;
      setLoading(true);
      const res = await DashboardService.getAdminOverview(
        fromDate,
        toDate,
        accessToken,
      );
      if (cancelled) return;
      if (!(res instanceof Error) && !res?.isAxiosError) setData(res.data);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, fromDate, toDate, reloadTick]);

  const first = loading && !data;
  const users = data?.users || {};
  const roles = data?.roles || {};
  const dropdowns = data?.dropdowns || {};
  const services = data?.services || {};
  const usersByRole = (data?.usersByRole || [])
    .map((r) => ({ name: r.name, value: Number(r.value) || 0 }))
    .filter((r) => r.value > 0);
  const usersByMonth = data?.usersByMonth || [];
  const hasNewUsers = usersByMonth.some((m) => Number(m.value) > 0);
  const tasksByRole = data?.pendingTasksByRole || [];

  const kpis = [
    {
      title: "Users",
      value: fmtNum(users.total),
      sub: `${fmtNum(users.active)} active · ${fmtNum(users.new_this_month)} new this month`,
      icon: <PeopleIcon />,
      color: "primary",
    },
    {
      title: "Roles",
      value: fmtNum(roles.total),
      sub: `${fmtNum(roles.active)} active`,
      icon: <SecurityIcon />,
      color: "secondary",
    },
    {
      title: "Dropdowns",
      value: fmtNum(dropdowns.masters),
      sub: `${fmtNum(dropdowns.values_total)} values · ${fmtNum(dropdowns.active_masters)} active`,
      icon: <ListAltIcon />,
      color: "info",
    },
    {
      title: "Services",
      value: fmtNum(services.total),
      sub: `${fmtNum(services.active)} active`,
      icon: <MiscellaneousServicesIcon />,
      color: "success",
    },
    {
      title: "Locked accounts",
      value: fmtNum(users.locked),
      sub: "After failed login attempts",
      icon: <LockPersonIcon />,
      color: "error",
      highlight: Number(users.locked) > 0,
    },
    {
      title: "New users this year",
      value: fmtNum(users.new_this_year),
      sub: "Registered since 1 January",
      icon: <PeopleIcon />,
      color: "warning",
    },
  ];

  return (
    <Box sx={{ mb: 2 }}>
      <Divider textAlign="left" sx={{ mb: 2, "&::before": { width: 0 } }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: 1 }}
        >
          System administration
        </Typography>
      </Divider>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpis.map((k) => (
          <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.title}>
            <Kpi {...k} loading={first} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Panel title="Users by role">
            <Box sx={{ height: Math.max(240, usersByRole.length * 30 + 30) }}>
              {first ? (
                <Skeleton variant="rounded" height={240} />
              ) : usersByRole.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByRole} layout="vertical" margin={{ left: 4, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Users"
                      fill={theme.palette.primary.main}
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty text="No users assigned to roles" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Panel title="New user registrations">
            <Box sx={{ height: 240 }}>
              {first ? (
                <Skeleton variant="rounded" height="100%" />
              ) : hasNewUsers ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByMonth} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="New users"
                      fill={theme.palette.success.main}
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty text="No new users in this period" />
              )}
            </Box>
          </Panel>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Panel
            title="Open tasks by role"
            sx={{ p: 0, "& > div:first-of-type": { px: 2, pt: 2 } }}
          >
            <TableContainer
              sx={{ borderTop: "1px solid", borderColor: "divider", maxHeight: 260 }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Role</TableCell>
                    <TableCell sx={headCellSx} align="right">
                      Open
                    </TableCell>
                    <TableCell sx={headCellSx} align="right">
                      Unclaimed
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {first ? (
                    [0, 1, 2].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}>
                          <Skeleton />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : tasksByRole.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No open tasks
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasksByRole.map((r) => (
                      <TableRow key={r.name} hover>
                        <TableCell>
                          <Typography variant="body2">{r.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>
                            {fmtNum(r.value)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {Number(r.unclaimed) > 0 ? (
                            <Chip size="small" color="warning" variant="outlined" label={fmtNum(r.unclaimed)} />
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              0
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>
      </Grid>

      <Divider textAlign="left" sx={{ mt: 3, mb: 2, "&::before": { width: 0 } }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: 1 }}
        >
          Applications &amp; TVET statistics
        </Typography>
      </Divider>
    </Box>
  );
};

AdminSection.propTypes = {
  fromDate: PropTypes.string,
  toDate: PropTypes.string,
  reloadTick: PropTypes.number,
};

// ---------------------------------------------------------------- page
const AdminDashboard = () => (
  <RoleOverviewDashboard
    title="Admin Dashboard"
    subtitle="System-wide overview — users, roles, applications, tasks and TVET statistics"
    defaultRoleId={1}
    allServices
    showStatusDistribution={false}
    showApplicationsTable={false}
    icon={<AdminPanelSettingsIcon />}
    renderExtra={(props) => <AdminSection {...props} />}
  />
);

export default AdminDashboard;
