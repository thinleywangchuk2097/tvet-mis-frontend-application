import FactCheckIcon from "@mui/icons-material/FactCheck";
import RoleOverviewDashboard from "./RoleOverviewDashboard";

// QAS Level 1 (role 7)
const QASLevel1Dashboard = () => (
  <RoleOverviewDashboard
    title="QAS Dashboard"
    subtitle="Quality assurance overview — applications, tasks and TVET statistics"
    defaultRoleId={7}
    icon={<FactCheckIcon />}
  />
);

export default QASLevel1Dashboard;
