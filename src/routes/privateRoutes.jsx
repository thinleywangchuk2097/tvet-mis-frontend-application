import DashboardIndex from "../pages/dashboard/DashboardIndex";
import RoleIndex from "../pages/admin/role/RoleIndex";
import UserIndex from "../pages/admin/user/UserIndex";
import DropdownIndex from "../pages/dropdown-management/DropdownIndex";
//user profile
import UserProfile from "../pages/auth/profile/UserProfile";
import PasswordChange from "../pages/auth/password/PasswordChange";
import SwitchRole from "../pages/auth/switch/SwitchRole";
//tasklist
import MyTaskList from "../pages/tasklist/MyTaskList";
import GroupTaskList from "../pages/tasklist/GroupTaskList";
import TaskListIndex from "../pages/tasklist/TaskListIndex";

//course announcement paths
import AccreditatedCourse from "../pages/institute/course-announcement/AccreditatedCourse";
import NonAccreditedCourse from "../pages/institute/course-announcement/NonAccreditedCourse";
import RPLAssessment1 from "../pages/institute/course-announcement/RPLAssessment";
import ReAssessment from "../pages/institute/course-announcement/ReAssessment";
import AccreditatedRPLCourseTraineeSelectionIndex from "../pages/institute/course-announcement/AccreditatedRPLCourseTraineeSelectionIndex";
import ViewAccreditatedRPLCourseTraineeSelectionIndex from "../pages/institute/course-announcement/ViewAccreditatedRPLCourseTraineeSelectionIndex";
import NonAccreditedCourseTraineeSelection from "../pages/institute/course-announcement/NonAccreditedCourseTraineeSelection";
import ReAssessmentTraineeSelectionIndex from "../pages/institute/course-announcement/ReAssessmentTraineeSelectionIndex";
import ViewReAssessmentTraineeSelectionIndex from "../pages/institute/course-announcement/ViewReAssessmentTraineeSelectionIndex"; 

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
import GenerateTracerIndex from "../pages/dwps/tracer/GenerateTracerIndex";
import SendTracerIndex from "../pages/dwps/tracer/SendTracerIndex";
import ResponseTracerIndex from "../pages/dwps/tracer/ResponseTracerIndex";
//registration and proposal view
import ViewInstituteProposal from "../pages/public/proposal/ViewInstituteProposal";
import ViewInstituteRegistration from "../pages/public/registration/ViewInstituteRegistration";
import ViewAssessorAccreditorQMSAuditor from "../pages/public/registration/ViewAssessorAccreditorQMSAuditor";

//tot
import CreateTotIndex from "../pages/dwps/tot/CreateTotIndex";
import AddTraineeIndex from "../pages/dwps/tot/AddTraineeIndex";

//service
import ViewCurriculumEndorsementIndex from "../pages/institute/service/ViewCurriculumEndorsementIndex";
//track application status
import TrackApplicationStatus from "../pages/report/TrackApplicationStatus";

//Certificate
import Assessment from "../pages/certificate/Assessment";
//birms
import BirmsPrivatePaymentIndex from "../pages/birms/private/BirmsPrivatePaymentIndex";

//reports
import InstituteReportIndex from "../pages/report/InstituteReportIndex";
import CourseReportIndex from "../pages/report/CourseReportIndex";  
import TraineeReportIndex from "../pages/report/TraineeReportIndex";

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
      },
      {
        path: "view-trainee-selection/:applicationNo",
        element: <ViewAccreditatedRPLCourseTraineeSelectionIndex />,
      },
      {
        path: "view-reassessment-trainee-selection/:applicationNo",
        element: <ViewReAssessmentTraineeSelectionIndex />,
      },
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
      {
        path: "course-trainee-selection/:applicationNo",
        element: <AccreditatedRPLCourseTraineeSelectionIndex />,
      },
      {
        path: "non-accredited-course-trainee-selection/:applicationNo",
        element: <NonAccreditedCourseTraineeSelection />,
      },
      {
        path: "reassessment-trainee-selection/:applicationNo/:courseId",
        element: <ReAssessmentTraineeSelectionIndex />,
      }
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
      { path: "institute-report-index", element: <InstituteReportIndex /> },
      { path: "course-report-index", element: <CourseReportIndex /> },
      { path: "trainee-report-index", element: <TraineeReportIndex /> },  
      { path: "track-application-status", element: <TrackApplicationStatus /> },
    ],
  },
   {
    path: "auth-birms",
    children: [
      { path: "payment-index", element: <BirmsPrivatePaymentIndex /> },
    
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
