// Public report: approved registrations (service 3)
import RegisteredReport from "./RegisteredReport";

const QMSAuditor = () => (
  <RegisteredReport
    serviceId={3}
    title="QMS Auditors Registered"
    description="Quality Management System (QMS) auditors registered with BQPCA."
    columnSet="organization"
  />
);

export default QMSAuditor;
