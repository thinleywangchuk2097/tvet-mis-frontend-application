import PublicIndex from "../pages/public/PublicIndex";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
//public registration routes paths
import InstituteProposal from "../pages/public/proposal/InstituteProposal";
import InstituteRegistration from "../pages/public/registration/InstituteRegistration";
import RPLAssessment from "../pages/public/courses/RPLAssessment";
// assessment result path
import AssessmentResult from "../pages/public/assessment/AssessmentResult";
//trainee course application
import ApplyCourse from "../pages/trainee/ApplyCourse";
import ResetPassword from "../pages/auth/ResetPassword";
import GenerateQRCode from "../pages/auth/bhutanndi/GenerateQRCode";
import AssessorAccreditorQMSAuditor from "../pages/public/registration/AssessorAccreditorQMSAuditor";
//import BirmsPaymentIndex from "../pages/birms/BirmsPaymentIndex";
//Reports
import AssessorReport from "../pages/public/reports/Assessor";
import InstituteReport from "../pages/public/reports/Institute";
import AccreditorReport from "../pages/public/reports/Accreditor";
import TrainerReport from "../pages/public/reports/Trainer";
import QMSAuditorReport from "../pages/public/reports/QMSAuditor";
import CoursesAccreditedReport from "../pages/public/reports/CoursesAccredited";
import BirmsPublicPaymentIndex from "../pages/birms/pubilc/BirmsPublicPaymentIndex";

//public routes ..
export const publicRoutes = [
  {
    path: "/",
    element: <PublicIndex />,
  },
  {
    path: "auth",
    children: [
      { path: "login", element: <Login /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "login-ndi-qrcode", element: <GenerateQRCode /> },
    ],
  },
  {
    path: "proposal",
    children: [
      { path: ":proposalType/:serviceId", element: <InstituteProposal /> },
    ],
  },
  {
    path: "register",
    children: [
      { path: ":registrationType/:serviceId", element: <InstituteRegistration /> },
      // { path: "assessment-centre", element: <AssessmentCentre /> },
      { path: "assessor", element: <Assessor /> },
      { path: "accreditor", element: <Accreditor /> },
      { path: "qms-auditor", element: <QMSAuditor /> },//it is Quality Auditor Registration AssessorAccreditorQMSAuditor
    ],
  },
  {
    path: "registration",
    children: [
      {
        path: ":registrationType/:serviceId",
        element: <AssessorAccreditorQMSAuditor />,
      },
    ],
  },
  {
    path: "reports",
    children: [
      { path: "assessor", element: <AssessorReport /> },
      { path: "institute", element: <InstituteReport /> },
      { path: "accreditor", element: <AccreditorReport /> },
      { path: "trainer", element: <TrainerReport /> },
      { path: "qms-auditor", element: <QMSAuditorReport /> },
      { path: "courses-accredited", element: <CoursesAccreditedReport /> },
    ],
  },

  {
    path: "result",
    children: [{ path: "assessment-result", element: <AssessmentResult /> }],
  },
  {
    path: "course",
    children: [
      { path: "apply/rpl-assessment", element: <RPLAssessment /> },
      { path: "apply-course/:applicationNo", element: <ApplyCourse /> },
    ],
  },
  {
    path: "birms",
    children: [{ path: "payment-index", element: <BirmsPublicPaymentIndex /> }],
  },
];
