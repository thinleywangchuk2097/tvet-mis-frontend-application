import DashboardIndex from "../pages/dashboard/DashboardIndex";
import RoleIndex from "../pages/admin/role/RoleIndex";
import UserIndex from "../pages/admin/user/UserIndex";
import DropdownIndex from "../pages/dropdown-management/DropdownIndex";
//user profile
import UserProfile from "../pages/auth/UserProfile";
import PasswordChange from "../pages/auth/PasswordChange";
import SwitchRole from "../pages/auth/SwitchRole";
//tasklist
import MyTaskList from "../pages/tasklist/MyTaskList";
import GroupTaskList from "../pages/tasklist/GroupTaskList";
import TaskListIndex from "../pages/tasklist/TaskListIndex";
//reports
import ReportIndex from "../pages/report/ReportIndex";
//course announcement paths
import AccreditatedCourse from "../pages/institute/course-announcement/AccreditatedCourse";
import NonAccreditedCourse from "../pages/institute/course-announcement/NonAccreditedCourse";
import RPLAssessment1 from "../pages/institute/course-announcement/RPLAssessment";
import ReAssessment from "../pages/institute/course-announcement/ReAssessment";

//resource-management
import StaffManagement from "../pages/institute/resource-management/StaffManagement";
import AnnualBudget from "../pages/institute/resource-management/AnnualBudget";
import AnnualExpenditure from "../pages/institute/resource-management/AnnualExpenditure";
import MonitoringReport from "../pages/institute/resource-management/MonitoringReport";
import Notification from "../pages/institute/resource-management/Notification";
//service
import CreateCourse from "../pages/institute/service/CreateCourse";
import AddTrainer from "../pages/institute/service/AddTrainer";
import CurriculumEndorsementIndex from "../pages/institute/service/CurriculumEndorsementIndex";
import ApplyNonAccreditedCourse from "../pages/institute/service/ApplyNonAccreditedCourse";
import ApplyAccreditedCourse from "../pages/institute/service/ApplyAccreditedCourse";
import InstituteChange from "../pages/institute/service/InstituteChange";
import RenewRegistration from "../pages/institute/service/RenewRegistration";
import ViewApplyNonAccreditedCourse from "../pages/institute/service/ViewApplyNonAccreditedCourse";
import ViewApplyAccreditedCourse from "../pages/institute/service/ViewApplyAccreditedCourse";

//apply for tot and qms certification
import ApplyQmsCertification from "../pages/institute/ApplyQmsCertification";
import TrackTrainee from "../pages/institute/TrackTrainee";
import ApplyTot from "../pages/institute/ApplyTot";
// tvet data manager
import GenerateTracerIndex from "../pages/tvet-data-manager/tracer/GenerateTracerIndex";
import SendTracerIndex from "../pages/tvet-data-manager/tracer/SendTracerIndex";
import ResponseTracerIndex from "../pages/tvet-data-manager/tracer/ResponseTracerIndex";
//complaint
import ComplaintView from "../pages/complaint/ComplaintView";
import ComplaintIssue from "../pages/complaint/ComplaintIssue";
import ViewInstituteProposal from "../pages/public/proposal/ViewInstituteProposal";
import ViewInstituteRegistration from "../pages/public/registration/ViewInstituteRegistration";
import ViewAssessorAccreditorQMSAuditor from "../pages/public/registration/ViewAssessorAccreditorQMSAuditor";

//tot
import CreateTotIndex from "../pages/dwps1/CreateTotIndex";
import AddTraineeIndex from "../pages/dwps1/AddTraineeIndex";

//service 
import ViewCurriculumEndorsementIndex from "../pages/institute/service/ViewCurriculumEndorsementIndex";
//track application status
import TrackApplicationStatus from "../pages/report/TrackApplicationStatus";

//Certificate
import Assessment from "../pages/certificate/Assessment";

export const privateRoutes = [
  {
    path: "/",
    element: <DashboardIndex />,
  },

  {
    path: "admin",
    children: [
      { path: "create-role", element: <RoleIndex /> },
      { path: "create-user", element: <UserIndex /> },
    ],
  },
  {
    path: "dropdown-management",
    children: [{ path: "create-dropdown", element: <DropdownIndex /> }],
  },

  {
    path: "user",
    children: [
      { path: "user-profile", element: <UserProfile /> },
      { path: "change-password", element: <PasswordChange /> },
      { path: "switch-role", element: <SwitchRole /> },
    ],
  },

  {
    path: "tasklist",
    children: [
      { path: "task-details-index", element: <TaskListIndex /> },
      { path: "group-task-index", element: <GroupTaskList /> },
      {
        path: "view-complaint-details/:application_no",
        element: <ComplaintView />,
      },
      {
        path: "view-proposal/:applicationNo",
        element: <ViewInstituteProposal />,
      },
      {
        path: "view-registration/:applicationNo",
        element: <ViewInstituteRegistration />,
      },
      {
        path: "view-assessoraccreditorqmsquditor/:applicationNo",
        element: <ViewAssessorAccreditorQMSAuditor />,
      },
      {
        path: "view-assessoraccreditorqmsquditor/:applicationNo",
        element: <ViewAssessorAccreditorQMSAuditor />,
      },
      {
        path: "view-non-accredited-course/:applicationNo",
        element: <ViewApplyNonAccreditedCourse />,
      },
      {
        path: "view-curriculum-endorsement/:applicationNo",
        element: <ViewCurriculumEndorsementIndex />,
      },
      {
        path: "view-accredited-course/:applicationNo",
        element: <ViewApplyAccreditedCourse />,

      }
    ],
  },
  {
    path: "service",
    children: [
      {
        path: "curriculum-endorse-index",
        element: <CurriculumEndorsementIndex />,
      },
      {
        path: "apply-non-accredited-course",
        element: <ApplyNonAccreditedCourse />,
      },
      { path: "apply-accredited-course", element: <ApplyAccreditedCourse /> },
      { path: "create-course", element: <CreateCourse /> },
      { path: "add-trainer", element: <AddTrainer /> },
      { path: "institute-change", element: <InstituteChange /> },
      { path: "renew-registration", element: <RenewRegistration /> },
    ],
  },
  {
    path: "announcement",
    children: [
      { path: "accredited-course", element: <AccreditatedCourse /> },
      { path: "non-accredited-course", element: <NonAccreditedCourse /> },
      { path: "rpl-assessment", element: <RPLAssessment1 /> },
      { path: "reassessment", element: <ReAssessment /> },
    ],
  },
  {
    path: "resource-management",
    children: [
      { path: "staff-management-index", element: <StaffManagement /> },
      { path: "annual-budget", element: <AnnualBudget /> },
      { path: "annual-expenditure", element: <AnnualExpenditure /> },
      { path: "monitoring-report", element: <MonitoringReport /> },
      { path: "notification", element: <Notification /> },
      { path: "complaint-service", element: <ComplaintIssue /> },
    ],
  },
  {
    path: "tracer",
    children: [
      { path: "genarate-tracer-index", element: <GenerateTracerIndex /> },
      { path: "send-tracer", element: <SendTracerIndex /> },
      { path: "response-tracer", element: <ResponseTracerIndex /> },
    ],
  },
  /*   {
    path: "tracer",
    children: [
      { path: "sent-employer-survey", element: <SendEmployerTracerSurveyIndex /> },
    
    ],
  }, */
  {
    path: "tot",
    children: [
      { path: "create-index", element: <CreateTotIndex /> },
      { path: "add-trainee-index", element: <AddTraineeIndex /> },
      { path: "apply-tot-index", element: <ApplyTot /> },
    ],
  },
  {
    path: "report",
    children: [
      { path: "report-index", element: <ReportIndex /> },
      { path: "track-application-status", element: <TrackApplicationStatus /> }


    ],
  },
  {
    path: "certificate",
    children: [
      { path: "assessment", element: <Assessment /> },
    ],
  },
  //without children
  { path: "/apply-qms-certification", element: <ApplyQmsCertification /> },
  { path: "/track-trainee", element: <TrackTrainee /> },
];
