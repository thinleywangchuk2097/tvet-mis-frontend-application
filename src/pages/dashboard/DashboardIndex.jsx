import TraineeDashboard from "./TraineeDashboard";
import AdminDashboard from "./AdminDashboard";
import Dashboard from "./Dashboard";
import { useSelector } from "react-redux";

const DashboardIndex = () => {
  const current_role = useSelector((state) => state.userProfile.current_role_name);
  switch (current_role) {
    case "Admin":
      return <AdminDashboard />;
    case "Trainee":
      return <TraineeDashboard />;
    case "Executives":
      return <AdminDashboard />; 
    default:
      return <Dashboard />; // for default or common roles
  }
};

export default DashboardIndex;
