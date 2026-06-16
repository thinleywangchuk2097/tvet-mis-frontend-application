import DashboardIndex from "../pages/dashboard/DashboardIndex";
import RoleIndex from "../pages/admin/role/RoleIndex";
import UserIndex from "../pages/admin/user/UserIndex";
import DropdownIndex from "../pages/admin/dropdown/DropdownIndex";
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
import CurriculumEndorsementIndex from "../pages/institute/service/CurriculumEndorsementIndex";
import ApplyNonAccreditedCourse from "../pages/institute/service/ApplyNonAccreditedCourse";
import ApplyAccreditedCourse from "../pages/institute/service/ApplyAccreditedCourse";
import InstituteChange from "../pages/institute/service/InstituteChange";
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
import InstituteRenewalIndex from "../pages/renewal/InstituteRenewalIndex";
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

//master 
import SectorOccupationIndex from "../pages/master/SectorOccupationIndex";
import ServiceMasterIndex from "../pages/master/ServiceMasterIndex";
//reports
import InstituteReportIndex from "../pages/report/InstituteReportIndex";
import CourseReportIndex from "../pages/report/CourseReportIndex";
import TraineeReportIndex from "../pages/report/TraineeReportIndex";

//BQPCA routes
import MonitoringAssessmentIndex from "../pages/bqpca/monitoring/MonitoringAssessmentIndex";
import InstituteMonitoringIndex from "../pages/bqpca/monitoring/InstituteMonitoringIndex";
import ViewInstituteMonitoringIndex from "../pages/bqpca/monitoring/ViewInstituteMonitoringIndex"
//ses centre
import ChangeSesCentreIndex from "../pages/ses-centre/registration/ChangeSesCentreIndex";
import SubjectIndex from "../pages/ses-centre/registration/SubjectIndex";
import TutorIndex from "../pages/ses-centre/registration/TutorIndex";
import TuitionAnnouncementIndex from "../pages/ses-centre/announcement/TuitionAnnouncementIndex";
import AddStudentIndex from "../pages/ses-centre/announcement/AddStudentIndex";
import StudentDetailsReport from "../pages/ses-centre/report/StudentDetailsReport";
import TutorsDetailsReport from "../pages/ses-centre/report/TutorsDetailsReport";
//assessment-centre
import ChangeAssessmentCentre from "../pages/assessment-centre/registration/ChangeAssessmentCentre";
import ProgramRegistration from "../pages/assessment-centre/registration/ProgramRegistration";
import AssessmentCentreOffence from "../pages/assessment-centre/offence/AssessmentCentreOffence";
import AssessmentCentreResult from "../pages/assessment-centre/assessment-result/AssessmentCentreResult";
//registration
import AddTrainerIndex from "../pages/trainer/AddTrainerIndex";

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
    path: "master",
    children: [
      { path: "sector-occupation-index", element: <SectorOccupationIndex /> },
      { path: "service-master-index", element: <ServiceMasterIndex /> }
    ],
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
       {
        path: "view-institute-monitoring-index/:applicationNo",
        element: <ViewInstituteMonitoringIndex />,
      },
    ],
  },
   {
    path: "renewal",
    children: [
      {
        path: ":renewalType/:serviceId",
        element: <InstituteRenewalIndex />,
      },
    
    ],
  },
  {
    path: "ses-centre",
    children: [
      { path: "change-ses-centre", element: <ChangeSesCentreIndex /> },
      { path: "subject-index", element: <SubjectIndex /> },
      { path: "tutor-index", element: <TutorIndex /> },
      { path: "tuition-announcement", element: <TuitionAnnouncementIndex /> },
      { path: "add-student", element: <AddStudentIndex /> },
      { path: "student-details-report", element: <StudentDetailsReport /> },
      { path: "tutors-details-report", element: <TutorsDetailsReport /> },
    ],
  },
   {
    path: "assessment-centre",
    children: [
      { path: "change-assessment-centre", element: <ChangeAssessmentCentre /> },
      { path: "program-registration", element: <ProgramRegistration /> },
      { path: "offence", element: <AssessmentCentreOffence /> },
      { path: "result", element: <AssessmentCentreResult /> },
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
      { path: "add-trainer", element: <AddTrainerIndex /> },
      { path: "institute-change", element: <InstituteChange /> },
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
      },
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
  {
    path: "monitor-bqpca",
    children: [
      {
        path: "monitoring-assessment-index",
        element: <MonitoringAssessmentIndex />,
      },
      {
        path: "institute-monitoring-index",
        element: <InstituteMonitoringIndex />,
      },
    ],
  },
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
    children: [{ path: "assessment", element: <Assessment /> }],
  },
  //without children
  { path: "/apply-qms-certification", element: <ApplyQmsCertification /> },
  { path: "/track-trainee", element: <TrackTrainee /> },
];
