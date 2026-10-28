// BirmsInstitutePaymentIndex.jsx
// Same design as the agency payment page, but only the logged-in
// institute's own payments (loaded by institute id from the backend).
import BirmsAgencyPaymentIndex from "./BirmsAgencyPaymentIndex";

const BirmsInstitutePaymentIndex = () => <BirmsAgencyPaymentIndex instituteView />;

export default BirmsInstitutePaymentIndex;
