import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import RoleOverviewDashboard from "./RoleOverviewDashboard";

// ACS Level 1 (role 9)
const ACSLevel1Dashboard = () => (
  <RoleOverviewDashboard
    title="ACS Level 1 Dashboard"
    subtitle="Applications, pending tasks and TVET statistics for your services"
    defaultRoleId={9}
    icon={<WorkspacePremiumIcon />}
  />
);

export default ACSLevel1Dashboard;
