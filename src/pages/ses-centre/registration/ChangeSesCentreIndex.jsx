// ChangeSesCentreIndex.jsx
// Same design and flow as the institute change request (InstituteChange),
// worded for SES centres. Design only for now: the final submit is not sent
// to the backend until the SES centre change service is set up.
import InstituteChange from "../../institute/registration/InstituteChange";

const ChangeSesCentreIndex = () => (
  <InstituteChange entityLabel="SES Centre" designOnly />
);

export default ChangeSesCentreIndex;
