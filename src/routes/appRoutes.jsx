import RoleIndex from '../pages/admin/role/RoleIndex';
import UserIndex from '../pages/admin/user/UserIndex';
import PublicIndex from '../pages/public/PublicIndex';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import UserProfile from '../pages/auth/UserProfile';
import PasswordChange from '../pages/auth/PasswordChange';
import DropdownIndex from '../pages/common/DropdownIndex';
import ReportIndex from '../pages/report/ReportIndex';
import SwitchRole from '../pages/auth/SwitchRole';
import VacanciesTraining from '../pages/public/VacanciesTraining';
import MyTask from '../pages/tasklist/MyTaskList';
import GroupTaskList from '../pages/tasklist/GroupTaskList';
import ResetPassword from '../pages/auth/ResetPassword';
import  ComplaintIssue  from '../pages/complaint/ComplaintIssue';
import DashboardIndex from '../pages/dashboard/DashboardIndex';
import ComplaintView from '../pages/complaint/ComplaintView';
import GenerateQRCode from '../pages/auth/bhutanndi/GenerateQRCode';

//public registration routes paths
import Assessor from '../pages/public/registration/Assessor';
import AssessmentCentre from '../pages/public/registration/AssessmentCentre';
import Accreditor from '../pages/public/registration/Accreditor';
import InstituteProposal from '../pages/public/registration/InstituteProposal'; 
import InstituteRegistration from '../pages/public/registration/InstituteRegistration';
import QMSAuditor from '../pages/public/registration/QMSAuditor';
import Trainer from '../pages/public/registration/Trainer';
import RPLAssessment from '../pages/public/courses/RPLAssessment';
//course announcement paths
import AccreditatedCourse from '../pages/institute/courseannouncement/AccreditatedCourse';
import NonAccreditedCourse from '../pages/institute/courseannouncement/NonAccreditedCourse';
import RPLAssessment1 from '../pages/institute/courseannouncement/RPLAssessment';

//trainee course application
import ApplyCourse from '../pages/trainee/ApplyCourse';

//public routes ..
export const publicRoutes = [
  { path: '/', element: <PublicIndex /> },
  { path: '/login', element: <Login /> },
  { path: '/vancies-training', element: <VacanciesTraining /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/login-ndi-qrcode', element: <GenerateQRCode /> },
  { path: '/register/assessor', element: <Assessor /> },
  { path: '/register/assessment-centre', element: <AssessmentCentre /> },
  { path: '/register/accreditor', element: <Accreditor /> },
  { path: '/register/institute-proposal', element: <InstituteProposal /> },
  { path: '/register/institute', element: <InstituteRegistration /> },
  { path: '/register/qms-auditor', element: <QMSAuditor /> },
  { path: '/register/trainer', element: <Trainer /> },
  { path: '/apply/rpl-assessment', element: <RPLAssessment /> },
  { path: '/apply-course/:application_no', element: <ApplyCourse /> },

];

//private routes ..
export const privateRoutes = [
  { path: '/', element: <DashboardIndex /> }, // role-based dashboard
  { path: '/create-role', element: <RoleIndex /> },
  { path: '/user-profile', element: <UserProfile /> },
  { path: '/change-password', element: <PasswordChange /> },
  { path: '/switch-role', element: <SwitchRole /> },
  { path: '/create-user', element: <UserIndex /> },
  { path: '/create-dropdown', element: <DropdownIndex /> },
  { path: '/report-index', element: <ReportIndex /> },
  { path: '/my-task-index', element: <MyTask /> },
  { path: '/group-task-index', element: <GroupTaskList /> },
  { path: '/accredited-course', element: <AccreditatedCourse /> },
  { path: '/non-accredited-course', element: <NonAccreditedCourse /> },
  { path: '/rpl-assessment', element: <RPLAssessment1 /> },
  { path: '/complaint-service', element: <ComplaintIssue /> },
  { path: '/view-complaint-details/:application_no', element: <ComplaintView /> },



];
