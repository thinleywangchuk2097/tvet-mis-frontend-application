import { useSelector } from "react-redux";
import TraineeDashboard from "./TraineeDashboard";
import AdminDashboard from "./AdminDashboard";
import DefaultDashboard from "./DefaultDashboard";
import InstituteDashboard from "./InstituteDashboard";
import QASLevel1Dashboard from "./QASLevel1Dashboard";
import ACSLevel1Dashboard from "./ACSLevel1Dashboard";
import ApproverBQPCADashboard from "./ApproverBQPCADashboard";

const DashboardIndex = () => {
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  switch (String(currentRoleId)) {
    case "1": //Admin role ID
      return <AdminDashboard />;
    case "2": //Trainee role ID
      return <TraineeDashboard />;
    case "7": //QAS Level 1 role ID
      return <QASLevel1Dashboard />;
    case "8": //TVET BQPCA role ID
      return <ApproverBQPCADashboard />;
    case "9": //ACS Level 1 role ID
      return <ACSLevel1Dashboard />;
    case "11": //Institute role ID
      return <InstituteDashboard />;
    default:
      return <DefaultDashboard />; // for default or common roles
  }
};

export default DashboardIndex;
