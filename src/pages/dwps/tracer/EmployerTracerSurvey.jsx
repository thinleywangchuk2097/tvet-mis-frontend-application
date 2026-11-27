import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import DatahubService from "../../../api/services/external/datahub/DatahubService";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";

// ==================== PROPTYPES ====================

const employerTracerSurveyPropTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  survey: PropTypes.shape({
    applicationNo: PropTypes.string,
    parentTracerType: PropTypes.string,
    subTracerType: PropTypes.string,
    applicationName: PropTypes.string,
    mobileNo: PropTypes.string,
    emailId: PropTypes.string,
  }),
};

// ==================== SOURCES ====================

const ENROLLED_STATUS_ID = 90;

// Each radio option: which API to call and what number it is searched by
// (keep: optional filter on the returned records)
const SOURCES = {
  jobSeeker: {
    label: "Job Seeker",
    searchLabel: "Citizenship No (CID)",
    fetch: (value) => DatahubService.getJobSeekerDetails(value),
  },
  foreignWorker: {
    label: "Foreign Worker",
    searchLabel: "Work Permit No",
    fetch: (value) => DatahubService.getForeignWorkerDetails(value),
  },
  employer: {
    label: "Employer",
    searchLabel: "Employer Application No",
    fetch: (value) => DatahubService.getEmployerDetails(value),
  },
  enrolledTrainee: {
    label: "Enrolled Trainees",
    searchLabel: "Course Application No",
    fetch: (value) =>
      CourseEnrollmentService.getCourseAppliedTraineesByApplicationNo(value),
    // only trainees who actually got enrolled (tbl_programme_trainee_enrollment_dtls.status_id = 90)
    keep: (record) =>
      Number(record.status_id ?? record.statusId) === ENROLLED_STATUS_ID,
  },
};

// candidate field names (lower case, compared without "_" / "-") for each column
const FIELD_KEYS = {
  name: [
    "appname", // job seeker API
    "applicantname",
    "employername",
    "companyname",
    "establishmentname",
    "fullname",
    "name",
  ],
  contactPerson: ["contactperson", "contactname", "focalperson"],
  idNo: [
    "cidno",
    "cid",
    "citizenshipno",
    "citizenid",
    "workpermitno",
    "permitno",
    "applicationno",
    "licenseno",
  ],
  mobileNo: [
    "mobileno",
    "mobile",
    "mobilenumber",
    "phoneno",
    "phone",
    "contactno",
  ],
  email: ["emailid", "email", "emailaddress"],
};

const isError = (res) => res instanceof Error || res?.isAxiosError;
const normalizeKey = (key) => key.toLowerCase().replaceAll(/[_-]/g, "");
const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// The datahub APIs wrap their data differently: use the first list of objects found,
// otherwise the object itself
const extractRecords = (data, depth = 0) => {
  if (Array.isArray(data)) return data.filter(isPlainObject);
  if (!isPlainObject(data) || depth > 4) return [];
  for (const value of Object.values(data)) {
    const found = extractRecords(value, depth + 1);
    if (found.length > 0) return found;
  }
  return depth === 0 ? [data] : [];
};

// first non-empty value whose key matches one of the candidates (in candidate order)
const pickField = (record, candidates) => {
  const byKey = {};
  Object.entries(record).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      byKey[normalizeKey(key)] = String(value).trim();
    }
  });
  const match = candidates.find((c) => byKey[c] !== undefined);
  return match ? byKey[match] : "";
};

const toRecipient = (record, sourceKey, searchValue, index) => {
  const idNo = pickField(record, FIELD_KEYS.idNo) || searchValue;
  return {
    key: `${sourceKey}-${idNo}-${index}`,
    source: sourceKey,
    id: idNo,
    name: pickField(record, FIELD_KEYS.name),
    contactPerson: pickField(record, FIELD_KEYS.contactPerson),
    mobileNo: pickField(record, FIELD_KEYS.mobileNo),
    email: pickField(record, FIELD_KEYS.email),
  };
};

const sendButtonLabel = (sending, count) => {
  if (sending) return "Sending...";
  return count > 0 ? `Send to (${count})` : "Send";
};

// ==================== MAIN COMPONENT ====================

const EmployerTracerSurvey = ({ open, onClose, survey, onSend }) => {
  const [source, setSource] = useState("jobSeeker");
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  // everyone found so far (several searches can be added to one send)
  const [recipients, setRecipients] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [sending, setSending] = useState(false);

  const handleSourceChange = (e) => {
    setSource(e.target.value);
    setSearchValue("");
  };

  const handleSearch = async () => {
    const value = searchValue.trim();
    if (!value) {
      toast.warning(`Enter ${SOURCES[source].searchLabel}`);
      return;
    }
    setSearching(true);
    try {
      const res = await SOURCES[source].fetch(value);
      if (isError(res)) {
        toast.error(res?.response?.data?.message || "Failed to fetch details");
        return;
      }
      const keep = SOURCES[source].keep ?? (() => true);
      const found = extractRecords(res?.data)
        .filter(keep)
        .map((r, i) => toRecipient(r, source, value, i));
      if (found.length === 0) {
        toast.info(
          `No ${SOURCES[source].label.toLowerCase()} found for ${value}`,
        );
        return;
      }
      // skip people already in the list (same source + id + mobile)
      const existing = new Set(
        recipients.map((r) => `${r.source}|${r.id}|${r.mobileNo}`),
      );
      const added = found.filter(
        (r) => !existing.has(`${r.source}|${r.id}|${r.mobileNo}`),
      );
      setRecipients((prev) => [...prev, ...added]);
      // new people with a mobile or email are selected straight away
      setSelectedKeys((prev) => [
        ...prev,
        ...added.filter((r) => r.mobileNo || r.email).map((r) => r.key),
      ]);
      setSearchValue("");
      toast.success(`${added.length} record(s) added`);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      toast.error("Failed to fetch details");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAll = (event) => {
    setSelectedKeys(event.target.checked ? recipients.map((r) => r.key) : []);
  };

  const handleSelect = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleClear = () => {
    setRecipients([]);
    setSelectedKeys([]);
  };

  const handleSend = async () => {
    const selected = recipients.filter((r) => selectedKeys.includes(r.key));
    if (selected.length === 0) {
      toast.warning(
        "Please select at least one recipient to send the survey to",
      );
      return;
    }
    setSending(true);
    try {
      // same shape as before (EmployerDTO: id, name, contactPerson, mobileNo, email)
      await onSend(
        selected.map(({ id, name, contactPerson, mobileNo, email }) => ({
          id,
          name,
          contactPerson,
          mobileNo,
          email,
        })),
      );
    } catch (error) {
      console.error("Error sending survey:", error);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const allSelected =
    recipients.length > 0 && selectedKeys.length === recipients.length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Recipients to Send Survey
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Survey: {survey?.applicationNo} • {survey?.parentTracerType} -{" "}
          {survey?.subTracerType}
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
          Application Name: {survey?.applicationName} | Mobile:{" "}
          {survey?.mobileNo} | Email: {survey?.emailId}
        </Typography>
      </Box>

      {/* Source + search */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ mb: 1 }}>
          <FormLabel sx={{ fontSize: "0.85rem" }}>Search from</FormLabel>
          <RadioGroup row value={source} onChange={handleSourceChange}>
            {Object.entries(SOURCES).map(([key, s]) => (
              <FormControlLabel
                key={key}
                value={key}
                control={<Radio size="small" />}
                label={s.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={SOURCES[source].searchLabel}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={
                  searching ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={handleSearch}
                disabled={searching}
              >
                {searching ? "Searching..." : "Search & Add"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClear}
                disabled={recipients.length === 0}
              >
                Clear List
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Selected count */}
      {selectedKeys.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${selectedKeys.length} recipient(s) selected`}
            onDelete={() => setSelectedKeys([])}
            color="primary"
            size="small"
          />
        </Box>
      )}

      {/* Recipients table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #e0e0e0",
            "& th": {
              border: "1px solid #e0e0e0",
              fontWeight: 600,
              bgcolor: "#f5f5f5",
            },
            "& td": { border: "1px solid #e0e0e0" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" align="center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedKeys.length > 0 && !allSelected}
                  onChange={handleSelectAll}
                  size="small"
                />
              </TableCell>
              <TableCell align="center" width={40}>
                #
              </TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>ID / Application No</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Mobile No</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recipients.map((r, index) => {
              const isSelected = selectedKeys.includes(r.key);
              return (
                <TableRow
                  key={r.key}
                  sx={{ bgcolor: isSelected ? "#f0f7ff" : "inherit" }}
                  selected={isSelected}
                >
                  <TableCell padding="checkbox" align="center">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelect(r.key)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell>
                    <Chip
                      label={SOURCES[r.source].label}
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {r.name || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.id || "—"}</TableCell>
                  <TableCell>{r.contactPerson || "—"}</TableCell>
                  <TableCell>{r.mobileNo || "—"}</TableCell>
                  <TableCell>{r.email || "—"}</TableCell>
                </TableRow>
              );
            })}
            {recipients.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Choose a source above and search to add recipients
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          color="error"
          onClick={onClose}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={selectedKeys.length === 0 || sending}
        >
          {sendButtonLabel(sending, selectedKeys.length)}
        </Button>
      </Box>
    </Box>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
EmployerTracerSurvey.propTypes = employerTracerSurveyPropTypes;

export default EmployerTracerSurvey;
