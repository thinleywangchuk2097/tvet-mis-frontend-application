import { useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { TABLE_STYLE, formatDate } from "./sarUtils";

const displayValue = (value) =>
  value === null || value === undefined || value === "" ? "N/A" : value;

const INFO_TABLE_STYLE = {
  "& td": {
    border: "1px solid",
    borderColor: "divider",
    padding: "6px 10px",
    fontSize: "0.82rem",
    verticalAlign: "top",
  },
  "& td.label": {
    width: "18%",
    fontWeight: 600,
    color: "text.secondary",
    backgroundColor: "#fafafa",
    whiteSpace: "nowrap",
  },
  "& td.value": {
    width: "32%",
  },
};

const statusColor = (statusId) => {
  const id = Number(statusId);
  if (id === 57 || id === 126) return "success";
  if (id === 58) return "error";
  return "info";
};

/**
 * Basic Information of the Self Assessment Report
 *  1. Institute Details  (tbl_institute_registration_dtls)
 *  2. Trainer Details    (tbl_trainer_dtls)
 *  3. Course Details     (tbl_accredited_course_dtls + tbl_non_accredited_course_dtls)
 */
const BasicInformationSection = ({ basicInfo, loading = false }) => {
  const [tab, setTab] = useState(0);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={28} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading basic information...
        </Typography>
      </Box>
    );
  }

  const institute = basicInfo?.institute;
  const trainers = basicInfo?.trainers || [];
  const courses = basicInfo?.courses || [];

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 48 },
        }}
      >
        <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Institute Details" />
        <Tab
          icon={<PeopleAltIcon fontSize="small" />}
          iconPosition="start"
          label={`Trainer Details (${trainers.length})`}
        />
        <Tab
          icon={<MenuBookIcon fontSize="small" />}
          iconPosition="start"
          label={`Course Details (${courses.length})`}
        />
      </Tabs>

      {/* Institute Details */}
      {tab === 0 &&
        (institute ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={INFO_TABLE_STYLE}>
              <TableBody>
                {[
                  ["Registration No", institute.registration_no, "Institute Name", institute.proposed_institute_name],
                  ["Business License No", institute.business_license_no, "Ownership Type", institute.ownership_type],
                  ["Institute Type", institute.institute_type, "Dzongkhag", institute.dzongkhag_name],
                  ["Exact Location", institute.exact_location, "Website", institute.website],
                  ["Email", institute.email_id, "Mobile No", institute.mobile_no],
                  ["Telephone No", institute.telephone_no, "Key Contact Name", institute.key_contact_name],
                  ["Key Contact Designation", institute.key_contact_designation, "Key Contact Mobile", institute.key_contact_mobile_no],
                  [
                    "Bhutanese Employees",
                    institute.bhutanese_employees ?? 0,
                    "Non-Bhutanese Employees",
                    institute.non_bhutanese_employees ?? 0,
                  ],
                ].map(([l1, v1, l2, v2]) => (
                  <TableRow key={l1}>
                    <TableCell className="label">{l1}</TableCell>
                    <TableCell className="value">{displayValue(v1)}</TableCell>
                    <TableCell className="label">{l2}</TableCell>
                    <TableCell className="value">{displayValue(v2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning">Institute details not found.</Alert>
        ))}

      {/* Trainer Details */}
      {tab === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={TABLE_STYLE}>
            <TableHead>
              <TableRow>
                <TableCell width={50}>#</TableCell>
                <TableCell>CID / Work Permit</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Work Experience</TableCell>
                <TableCell>Employment Type</TableCell>
                <TableCell>Joining Date</TableCell>
                <TableCell>Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trainers.length > 0 ? (
                trainers.map((t, i) => (
                  <TableRow key={t.id || i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{t.citizen_id || t.work_permit_no || "N/A"}</TableCell>
                    <TableCell>{t.name || "N/A"}</TableCell>
                    <TableCell>{t.gender || "N/A"}</TableCell>
                    <TableCell>{t.qualification || "N/A"}</TableCell>
                    <TableCell>{t.specialization || "N/A"}</TableCell>
                    <TableCell>{t.work_experience || "N/A"}</TableCell>
                    <TableCell>{t.employment_type || "N/A"}</TableCell>
                    <TableCell>{formatDate(t.joining_date)}</TableCell>
                    <TableCell>
                      {t.mobile_no || "N/A"}
                      {t.email ? (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {t.email}
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No trainers registered for this institute
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Course Details */}
      {tab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={TABLE_STYLE}>
            <TableHead>
              <TableRow>
                <TableCell width={50}>#</TableCell>
                <TableCell>Application No</TableCell>
                <TableCell>Programme Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Certificate Level</TableCell>
                <TableCell align="center">Duration (Hrs)</TableCell>
                <TableCell align="center">Capacity / Batch</TableCell>
                <TableCell align="center">Fees (Nu.)</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length > 0 ? (
                courses.map((c, i) => (
                  <TableRow key={`${c.application_no}-${i}`} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{c.application_no}</TableCell>
                    <TableCell>{c.programme_title || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={c.course_type === "Non-Accredited" ? "default" : "primary"}
                        label={c.course_type}
                      />
                    </TableCell>
                    <TableCell>{c.certificate_level || "N/A"}</TableCell>
                    <TableCell align="center">{c.total_program_duration || "N/A"}</TableCell>
                    <TableCell align="center">{c.enrolment_capacity || "N/A"}</TableCell>
                    <TableCell align="center">{c.fees_per_trainee || "N/A"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        color={statusColor(c.status_id)}
                        label={c.status_name || "Pending"}
                        sx={{ minWidth: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No courses registered for this institute
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

BasicInformationSection.propTypes = {
  basicInfo: PropTypes.shape({
    institute: PropTypes.object,
    trainers: PropTypes.array,
    courses: PropTypes.array,
  }),
  loading: PropTypes.bool,
};

export default BasicInformationSection;
