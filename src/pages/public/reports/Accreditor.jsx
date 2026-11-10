// Public report: approved registrations (service 5)
import RegisteredReport from "./RegisteredReport";

const Accreditor = () => (
  <RegisteredReport
    serviceId={5}
    title="Accreditors Registered"
    description="Accreditors registered with BQPCA and the occupations they are approved to accredit."
    columnSet="occupation"
  />
);

export default Accreditor;
