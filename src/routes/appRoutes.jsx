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
import MyTask from '../pages/TaskList/MyTaskList';
import GroupTaskList from '../pages/TaskList/GroupTaskList';
import ResetPassword from '../pages/auth/ResetPassword';
import UserDashboard from '../pages/dashboard/UserDashboard';
import  ComplaintIssue  from '../pages/complaint/ComplaintIssue';
import DashboardIndex from '../pages/dashboard/DashboardIndex';
import ComplaintView from '../pages/complaint/ComplaintView';
import GenerateQRCode from '../pages/auth/bhutanndi/GenerateQRCode';

//public routes ..
export const publicRoutes = [
  { path: '/', element: <PublicIndex /> },
  { path: '/login', element: <Login /> },
  { path: '/vancies-training', element: <VacanciesTraining /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/login-ndi-qrcode', element: <GenerateQRCode /> }
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
  { path: '/user-dashboard', element: <UserDashboard /> },
  { path: '/complaint-service', element: <ComplaintIssue /> },
  { path: '/view-complaint-details/:application_no', element: <ComplaintView /> },


];
