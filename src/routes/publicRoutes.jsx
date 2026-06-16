import PublicIndex from "../pages/public/PublicIndex";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/password/ForgotPassword";
//public registration routes paths
import InstituteProposal from "../pages/public/proposal/InstituteProposal";
import InstituteRegistration from "../pages/public/registration/InstituteRegistration";
import RPLAssessment from "../pages/public/courses/RPLAssessment";
// assessment result path
import AssessmentResult from "../pages/public/assessment/AssessmentResult";
//trainee course application
import ApplyCourse from "../pages/trainee/ApplyCourse";
import ResetPassword from "../pages/auth/password/ResetPassword";
import GenerateQRCode from "../pages/auth/ndi/GenerateQRCode";
import CommonQRCode from "../pages/auth/ndi/CommonQRCode";
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
//Feedback or Complain
import FeedbackForm from "../pages/public/FeedbackForm";
import ViewTracerSend from "../pages/dwps/tracer/ViewTracerSend";
import PublicationIndex from "../pages/public/publication/PublicationIndex";

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
      { path: "common-ndi-qrcode", element: <CommonQRCode /> }
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
      {
        path: ":registrationType/:serviceId",
        element: <InstituteRegistration />,
      },
    
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
    path: "publication",
    children: [{ path: "publication-index", element: <PublicationIndex /> }],
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
  {
    path: "feedback",
    children: [{ path: "form", element: <FeedbackForm /> }],
  },
  {
    path: "tracer",
    children: [
      {
        path: "trainee-survey/:uniqueId",
        element: <ViewTracerSend />,
      },
      {
        path: "employer-survey/:uniqueId",
        element: <ViewTracerSend />,
      },
    ],
  },
];
