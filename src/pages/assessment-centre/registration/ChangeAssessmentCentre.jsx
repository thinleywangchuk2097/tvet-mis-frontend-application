// ChangeAssessmentCentre.jsx
// Same design and flow as the institute change request (InstituteChange),
// worded for assessment centres. Design only for now: the final submit is not
// sent to the backend until the assessment centre change service is set up.
import InstituteChange from "../../institute/registration/InstituteChange";

const ChangeAssessmentCentre = () => (
  <InstituteChange entityLabel="Assessment Centre" designOnly />
);

export default ChangeAssessmentCentre;
