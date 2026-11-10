// Public report: approved registrations (service 32)
import RegisteredReport from "./RegisteredReport";

const Assessor = () => (
  <RegisteredReport
    serviceId={32}
    title="Assessors Registered"
    description="Assessors registered with BQPCA and the occupations they are approved to assess."
    columnSet="occupation"
  />
);

export default Assessor;
