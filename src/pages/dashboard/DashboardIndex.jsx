import { useSelector } from "react-redux";
import AdminDashboard from "./AdminDashboard";
import DefaultDashboard from "./DefaultDashboard";
import InstituteDashboard from "./InstituteDashboard";
import QASLevel1Dashboard from "./QASLevel1Dashboard";
import ACSLevel1Dashboard from "./ACSLevel1Dashboard";
import TvetDataManagerFocalDashboard from "./TvetDataManagerFocalDashboard";
import DWPS1Dashboard from "./DWPS1Dashboard";
import TVETQCDashboard from "./TVETQCDashboard";
import SESCentreDashboard from "./SESCentreDashboard";
import AssessmentCentreDashboard from "./AssessmentCentreDashboard";
import SQSDashboard from "./SQSDashboard";
import VerifierTTTRCDashboard from "./VerifierTTTRCDashboard";
import HeadTTTRCDashboard from "./HeadTTTRCDashboard";

const DashboardIndex = () => {
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  switch (String(currentRoleId)) {
    case "1": //Admin role ID
      return <AdminDashboard />;
    case "7": //QAS Level 1 role ID
      return <QASLevel1Dashboard />;
    case "9": //ACS Level 1 role ID
      return <ACSLevel1Dashboard />;
    case "11": //Institute role ID
      return <InstituteDashboard />;
    case "14": //Verifier TTTRC role ID
      return <VerifierTTTRCDashboard />;  
    case "15": //Head TTTRC role ID
      return <HeadTTTRCDashboard />;
    case "20": //Tvet Data Manager Focal role ID
      return <TvetDataManagerFocalDashboard />;
    case "21": //dwps1 role ID
      return <DWPS1Dashboard />;
    case "22": //TVET QC role ID
      return <TVETQCDashboard />;
    case "28": //SESCentre role ID
      return <SESCentreDashboard />;
    case "12": //Assessment Centre role ID
      return <AssessmentCentreDashboard />;
    case "33": //SQS role ID
      return <SQSDashboard />;
    default:
      return <DefaultDashboard />; // for default or common roles
  }
};

export default DashboardIndex;
