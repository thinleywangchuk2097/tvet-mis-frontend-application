import VerifiedIcon from "@mui/icons-material/Verified";
import RoleOverviewDashboard from "./RoleOverviewDashboard";

// TVET QC (role 22)
const TVETQCDashboard = () => (
  <RoleOverviewDashboard
    title="TVET QC Dashboard"
    subtitle="Quality control overview — applications, pending reviews and TVET statistics"
    defaultRoleId={22}
    icon={<VerifiedIcon />}
  />
);

export default TVETQCDashboard;
