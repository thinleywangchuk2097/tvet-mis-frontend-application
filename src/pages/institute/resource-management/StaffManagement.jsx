import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Box,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { Formik, Field, FieldArray, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import StaffManagementService from "../../../api/services/internal/resource/StaffManagementService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import CommonService from "../../../api/services/internal/common/CommonService";
import DatahubService from "../../../api/services/external/datahub/DatahubService";

const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Required field asterisk component
const RequiredAsterisk = () => (
  <Typography component="span" sx={{ color: "error.main", fontWeight: "bold" }}>
    *
  </Typography>
);

RequiredAsterisk.propTypes = {};

// ==================== PROPTYPES ====================

const sectionHeaderPropTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

// ==================== SECTION HEADER COMPONENT ====================
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 1.5,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
        color: "primary.main",
        mr: 1.5,
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "0.98rem" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

SectionHeader.propTypes = sectionHeaderPropTypes;

// Helper function to map snake_case to camelCase
const mapStaffData = (rawData) => {
  if (!rawData) return [];

  const items = Array.isArray(rawData) ? rawData : [rawData];

  return items.map((item) => {
    // Parse JSON strings for employment history
    let employmentHistory = [];
    if (item.staff_employment_history) {
      try {
        employmentHistory =
          typeof item.staff_employment_history === "string"
            ? JSON.parse(item.staff_employment_history)
            : item.staff_employment_history;
      } catch (e) {
        console.error("Error parsing employment history:", e);
        employmentHistory = [];
      }
    }

    // Parse JSON strings for training history
    let trainingHistory = [];
    if (item.staff_training_history) {
      try {
        trainingHistory =
          typeof item.staff_training_history === "string"
            ? JSON.parse(item.staff_training_history)
            : item.staff_training_history;
      } catch (e) {
        console.error("Error parsing training history:", e);
        trainingHistory = [];
      }
    }

    return {
      id: item.id,
      hasCitizenId: item.has_citizen_id,
      citizenId: item.citizen_id || "",
      name: item.name || "",
      email: item.email || "",
      mobileNo: item.mobile_no || "",
      referenceNo: item.reference_no || "",
      agencyName: item.agency_name || "",
      fieldOfStudy: item.field_of_study || "",
      positionLevel: item.position_level || "",
      employeeId: item.employee_id || "",
      genderId: item.gender_id || "",
      dob: item.dob || "",
      instituteId: item.institute_id,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedBy: item.updated_by,
      updatedAt: item.updated_at,
      staffemploymenthistory: employmentHistory.map((emp) => ({
        id: emp.id,
        appointmentDate: emp.appointmentDate || emp.appointment_date,
        employmentTypeId: emp.employmentTypeId || emp.employment_type_id,
        qualificationId: emp.qualificationId || emp.qualification_id,
        designation: emp.designation,
      })),
      stafftraininghistory: trainingHistory.map((train) => ({
        id: train.id,
        trainingName: train.trainingName || train.training_name,
        trainingStart: train.trainingStart || train.training_start,
        trainingEnd: train.trainingEnd || train.training_end,
        providerName: train.providerName || train.provider_name,
        fundingSourceId: train.fundingSourceId || train.funding_source_id,
        trainingCost: train.trainingCost || train.training_cost,
      })),
      proposedInstituteName: item.proposed_institute_name,
      registrationNo: item.registration_no,
    };
  });
};

// "First Middle Last" from the Datahub citizen record
const citizenFullName = (citizen) =>
  [citizen.firstName, citizen.middleName, citizen.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

// Datahub sends "M" / "F": match the gender dropdown by name or first letter
const findGenderOption = (genders, gender) => {
  if (!gender) return null;
  const g = String(gender).trim().toLowerCase();
  if (!g) return null;
  return genders.find((opt) => {
    const name = String(opt.name || "")
      .trim()
      .toLowerCase();
    return name === g || name.startsWith(g.charAt(0));
  });
};

// dob comes as "DD/MM/YYYY" — convert to "YYYY-MM-DD" for <input type="date">
// civil servant details stored with the staff record (only when the ZESt lookup has them)
const CIVIL_SERVANT_FIELDS = ["agencyName", "fieldOfStudy", "positionLevel", "employeeId"];

const clearCivilServantFields = (setFieldValue) =>
  CIVIL_SERVANT_FIELDS.forEach((field) => setFieldValue(field, ""));

// first employee record of the RCSC ZESt civil servant lookup, or null
const civilServantOf = (response) =>
  response?.data?.employeeFullDetailsByCID?.employee?.[0] || null;

// dropdown option whose name matches the text (case-insensitive)
const findOptionByName = (options, text) => {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return null;
  return (
    options.find((o) => String(o.name || "").trim().toLowerCase() === t) ||
    options.find((o) => String(o.name || "").trim().toLowerCase().includes(t)) ||
    null
  );
};

// "2006-07-01+00:00" -> "2006-07-01"
const toDateOnly = (value) => (value ? String(value).slice(0, 10) : "");

const toInputDate = (dob) => {
  const parts = dob.split("/");
  if (parts.length !== 3) return dob;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const StaffManagement = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCitizen, setFetchingCitizen] = useState(false);
  // "already staff of this institute" message, shown under the CID / Reference No field
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const duplicateTimer = useRef(null);
  const latestDuplicateCheck = useRef("");

  // current dropdown lists for the (debounced) CID lookup, which is created only once
  const lookupOptions = useRef({ genders: [], employmentTypes: [], qualifications: [] });
  const [staff, setStaff] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState(null);
  const [instituteId, setInstituteId] = useState(null);

  // Dropdown data states
  const [genders, setGenders] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  lookupOptions.current = { genders, employmentTypes, qualifications };
  const [fundingSources, setFundingSources] = useState([]);

  // Fetch all dropdown data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchDropdownData();
      await fetchInstituteDetails();
    };
    loadData();
  }, []);

  // Fetch all dropdown data
  const fetchDropdownData = async () => {
    try {
      const genderResponse = await CommonService.getByParentId(8);
      setGenders(genderResponse.data || []);

      const employmentResponse = await CommonService.getByParentId(17);
      setEmploymentTypes(employmentResponse.data || []);

      const qualificationResponse = await CommonService.getByParentId(18);
      setQualifications(qualificationResponse.data || []);

      const fundingResponse = await CommonService.getByParentId(16);
      setFundingSources(fundingResponse.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast.error("Failed to fetch dropdown data");
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instituteData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setInstituteDetails(instituteData);

      if (instituteData && instituteData.institute_id) {
        const id = instituteData.institute_id;
        setInstituteId(id);
        await fetchStaff(id);
      }
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to fetch institute details");
    }
  };

  // 600 ms after typing stops: is this CID / reference no already staff of the institute?
  const scheduleDuplicateCheck = ({ citizenId, referenceNo }, excludeId) => {
    clearTimeout(duplicateTimer.current);
    const key = `${citizenId || ""}|${referenceNo || ""}`;
    latestDuplicateCheck.current = key;
    setDuplicateMessage("");
    if (!instituteId || (!citizenId && !referenceNo)) return;
    duplicateTimer.current = setTimeout(async () => {
      const response = await StaffManagementService.checkStaffDuplicate(
        { instituteId, citizenId, referenceNo, excludeId: excludeId || undefined },
        access_token,
      );
      if (latestDuplicateCheck.current !== key) return; // a newer value was typed
      setDuplicateMessage(response?.data?.exists ? response.data.message : "");
    }, 600);
  };

  // failed save: 409 = already staff of this institute (also shown under the field)
  const showSaveError = (response, fallback) => {
    const message = response?.response?.data?.message;
    if (response?.response?.status === 409) setDuplicateMessage(message || "");
    toast.error(message || fallback);
  };

  // Civil servant (RCSC ZESt) record -> staff form, including the current employment
  const fillFromCivilServant = (employee, setFieldValue) => {
    const { genders: genderList, employmentTypes: typeList, qualifications: qualificationList } =
      lookupOptions.current;
    setFieldValue("name", String(employee.fullName || "").replace(/\s+/g, " ").trim());
    const gender = findGenderOption(genderList, employee.gender);
    if (gender) setFieldValue("genderId", String(gender.id));
    if (employee.mobile) setFieldValue("mobileNo", String(employee.mobile));
    if (employee.emailID) setFieldValue("email", employee.emailID);
    setFieldValue("agencyName", employee.agencyName || "");
    setFieldValue("fieldOfStudy", employee.fieldOfStudy || "");
    setFieldValue("positionLevel", employee.positionLevel || "");
    setFieldValue("employeeId", employee.employeeID || "");

    setFieldValue("staffemploymenthistory.0.designation", employee.position || "");
    setFieldValue("staffemploymenthistory.0.appointmentDate", toDateOnly(employee.appointmentDate));
    const type = findOptionByName(typeList, employee.employmentType);
    if (type) setFieldValue("staffemploymenthistory.0.employmentTypeId", String(type.id));
    const qualification = findOptionByName(qualificationList, employee.qualification);
    if (qualification) setFieldValue("staffemploymenthistory.0.qualificationId", String(qualification.id));
  };

  const clearCitizenFields = (setFieldValue) => {
    setFieldValue("name", "");
    setFieldValue("genderId", "");
    setFieldValue("dob", "");
    clearCivilServantFields(setFieldValue);
  };

  // CID lookup: civil servant (ZESt) first; only when none is found, the citizen register (Datahub)
  const fetchCitizenDetails = async (citizenId, setFieldValue) => {
    if (!citizenId || citizenId.length !== 11) {
      return;
    }

    setFetchingCitizen(true);
    try {
      const employee = civilServantOf(
        await DatahubService.getCivilServantDetails(citizenId),
      );
      if (employee) {
        fillFromCivilServant(employee, setFieldValue);
        toast.success("Civil servant details fetched successfully");
        return;
      }

      clearCivilServantFields(setFieldValue); // not a civil servant
      const response =
        await DatahubService.getDetailsByCitizenshipNo(citizenId);

      const citizenData = response.data;

      if (citizenData && (citizenData.cid || citizenData.firstName)) {
        // Build full name including middle name if present
        setFieldValue("name", citizenFullName(citizenData));

        const option = findGenderOption(lookupOptions.current.genders, citizenData.gender);
        if (option) {
          setFieldValue("genderId", String(option.id));
        }

        if (citizenData.dob) {
          setFieldValue("dob", toInputDate(citizenData.dob));
        }

        toast.success("Citizen details fetched successfully");
      } else {
        toast.warning("No citizen found with this ID");
        clearCitizenFields(setFieldValue);
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error("Failed to fetch citizen details");
      clearCitizenFields(setFieldValue);
    } finally {
      setFetchingCitizen(false);
    }
  };

  // Create debounced version of fetchCitizenDetails
  const debouncedFetchCitizen = useCallback(
    debounce((citizenId, setFieldValue) => {
      if (citizenId && citizenId.length === 11) {
        fetchCitizenDetails(citizenId, setFieldValue);
      }
    }, 500),
    [],
  );

  // Initial values matching backend DTO
  const initialValues = {
    hasCitizenId: "Y",
    citizenId: "",
    name: "",
    email: "",
    mobileNo: "",
    referenceNo: "",
    agencyName: "",
    fieldOfStudy: "",
    positionLevel: "",
    employeeId: "",
    genderId: "",
    dob: "",
    createdBy: actionId || 1,
    updatedBy: actionId || 1,
    instituteId: instituteId,
    staffemploymenthistory: [
      {
        appointmentDate: "",
        employmentTypeId: "",
        qualificationId: "",
        designation: "",
      },
    ],
    stafftraininghistory: [
      {
        trainingName: "",
        trainingStart: "",
        trainingEnd: "",
        providerName: "",
        fundingSourceId: "",
        trainingCost: "",
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    hasCitizenId: Yup.string().required("Required"),

    citizenId: Yup.string()
      .test(
        "citizenId-validation",
        "Citizen ID must be exactly 11 digits",
        (value, context) => {
          const { hasCitizenId } = context.parent;
          if (hasCitizenId === "Y") {
            return value && /^\d{11}$/.test(value);
          }
          return true;
        },
      )
      .test(
        "citizenId-required",
        "Citizen ID is required",
        (value, context) => {
          const { hasCitizenId } = context.parent;
          if (hasCitizenId === "Y") {
            return value && value.length === 11;
          }
          return true;
        },
      ),

    referenceNo: Yup.string().test(
      "referenceNo-required",
      "Reference No is required",
      (value, context) => {
        const { hasCitizenId } = context.parent;
        if (hasCitizenId === "N") {
          return value && value.trim().length > 0;
        }
        return true;
      },
    ),

    name: Yup.string().required("Name is required"),

    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format"),

    mobileNo: Yup.string()
      .required("Mobile No is required")
      .matches(/^\d{8}$/, "Mobile No must be exactly 8 digits"),

    genderId: Yup.string().test(
      "genderId-required",
      "Gender is required",
      (value, context) => {
        const { hasCitizenId } = context.parent;
        if (hasCitizenId === "N") {
          return value && value.trim().length > 0;
        }
        return true;
      },
    ),

    dob: Yup.string().nullable(),
    instituteId: Yup.string().nullable(),

    staffemploymenthistory: Yup.array().of(
      Yup.object().shape({
        appointmentDate: Yup.string().required("Appointment date is required"),
        employmentTypeId: Yup.string().required("Employment type is required"),
        qualificationId: Yup.string().required("Qualification is required"),
        designation: Yup.string().required("Designation is required"),
      }),
    ),

    stafftraininghistory: Yup.array().of(
      Yup.object().shape({
        trainingName: Yup.string().required("Training name is required"),
        trainingStart: Yup.string().required("Start date is required"),
        trainingEnd: Yup.string().required("End date is required"),
        providerName: Yup.string().required("Provider name is required"),
        trainingCost: Yup.string().required("Training cost is required"),
        fundingSourceId: Yup.string().required("Funding source is required"),
      }),
    ),
  });

  // Fetch staff data from backend by instituteId
  const fetchStaff = async (id) => {
    const instituteIdToUse = id || instituteId;

    if (!instituteIdToUse) {
      setStaff([]);
      return;
    }

    setLoading(true);
    try {
      const response = await StaffManagementService.getInstituteStaff(
        instituteIdToUse,
        access_token,
      );
      let rawData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          rawData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          rawData = response.data.data;
        } else if (
          response.data.content &&
          Array.isArray(response.data.content)
        ) {
          rawData = response.data.content;
        } else {
          rawData = [response.data];
        }
      }

      const mappedData = mapStaffData(rawData);
      setStaff(mappedData);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
      toast.error("Failed to fetch staff data");
    } finally {
      setLoading(false);
    }
  };

  // Submit staff to backend (Create)
  const handleSubmitStaff = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        instituteId: instituteId ? parseInt(instituteId) : null,
        genderId: values.genderId ? parseInt(values.genderId) : null,
        createdBy: actionId || 1,
        updatedBy: actionId || 1,
        staffemploymenthistory: values.staffemploymenthistory.map((emp) => ({
          ...emp,
          employmentTypeId: emp.employmentTypeId
            ? parseInt(emp.employmentTypeId)
            : null,
          qualificationId: emp.qualificationId
            ? parseInt(emp.qualificationId)
            : null,
        })),
        stafftraininghistory: values.stafftraininghistory.map((train) => ({
          ...train,
          fundingSourceId: train.fundingSourceId
            ? parseInt(train.fundingSourceId)
            : null,
        })),
      };

      const response = await StaffManagementService.submitStaff(
        payload,
        access_token,
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Staff saved successfully!");
        resetForm();
        setOpenDialog(false);
        setEditingIndex(null);
        await fetchStaff();
      } else {
        showSaveError(response, "Failed to save staff");
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save staff";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Edit staff (Update)
  const handleEditStaff = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);

      const payload = {
        id: values.id,
        hasCitizenId: values.hasCitizenId,
        citizenId: values.citizenId || "",
        name: values.name,
        email: values.email,
        mobileNo: values.mobileNo,
        referenceNo: values.referenceNo || "",
        agencyName: values.agencyName || "",
        fieldOfStudy: values.fieldOfStudy || "",
        positionLevel: values.positionLevel || "",
        employeeId: values.employeeId || "",
        genderId: values.genderId ? parseInt(values.genderId) : null,
        dob: values.dob || "",
        instituteId: instituteId ? parseInt(instituteId) : null,
        createdBy: values.createdBy || actionId || 1,
        updatedBy: actionId || 1,
        staffemploymenthistory: values.staffemploymenthistory.map((emp) => ({
          id: emp.id || null,
          appointmentDate: emp.appointmentDate,
          employmentTypeId: emp.employmentTypeId
            ? parseInt(emp.employmentTypeId)
            : null,
          qualificationId: emp.qualificationId
            ? parseInt(emp.qualificationId)
            : null,
          designation: emp.designation,
        })),
        stafftraininghistory: values.stafftraininghistory.map((train) => ({
          id: train.id || null,
          trainingName: train.trainingName,
          trainingStart: train.trainingStart,
          trainingEnd: train.trainingEnd,
          providerName: train.providerName,
          fundingSourceId: train.fundingSourceId
            ? parseInt(train.fundingSourceId)
            : null,
          trainingCost: train.trainingCost,
        })),
      };
      const response = await StaffManagementService.editStaff(
        payload,
        access_token,
      );

      if (response.status === 200) {
        toast.success("Staff updated successfully!");
        resetForm();
        setOpenDialog(false);
        setEditingIndex(null);
        await fetchStaff();
      } else {
        showSaveError(response, "Failed to update staff");
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update staff";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const staffToDelete = staff[selectedIndex];

      await StaffManagementService.deleteStaff(staffToDelete.id, access_token);

      toast.success("Staff deleted successfully!");
      setOpenDeleteDialog(false);
      setSelectedIndex(null);
      await fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = Array.isArray(staff)
    ? staff.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.citizenId?.toLowerCase().includes(search.toLowerCase()) ||
          s.referenceNo?.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  // position in the full staff list (the table shows a filtered, paged slice)
  const staffIndexOf = (member) =>
    staff.findIndex(
      (s) => s === member || (member.id && String(s.id) === String(member.id)),
    );

  // dropdown options for the employment / training history rows (built once, outside the rows)
  const toOptions = (items) =>
    items.map((item) => (
      <MenuItem key={item.id} value={item.id.toString()}>
        {item.name}
      </MenuItem>
    ));
  const employmentTypeOptions = toOptions(employmentTypes);
  const qualificationOptions = toOptions(qualifications);
  const fundingSourceOptions = toOptions(fundingSources);
  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Staff List(s)
      </Typography>
      <Grid
        container
        spacing={2}
        alignItems="center"
        sx={{ mb: 2, justifyContent: "flex-end" }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            label="Search by Name, Citizen ID or Reference No"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingIndex(null);
              setDuplicateMessage("");
              setOpenDialog(true);
            }}
          >
            Add Staff
          </Button>
        </Grid>
      </Grid>

      {/* Staff Table */}
      <TableContainer component={Paper}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Citizen ID / Reference No</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile No</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              filteredStaff.length > 0 &&
              filteredStaff
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((staffMember, index) => (
                  <TableRow key={staffMember.id || index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{staffMember.name}</TableCell>
                    <TableCell>
                      {staffMember.citizenId || staffMember.referenceNo || "-"}
                    </TableCell>
                    <TableCell>{staffMember.email}</TableCell>
                    <TableCell>{staffMember.mobileNo}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setEditingIndex(staffIndexOf(staffMember));
                          setDuplicateMessage("");
                          setOpenDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedIndex(staffIndexOf(staffMember));
                          setOpenDeleteDialog(true);
                        }}
                        sx={{
                          color: "error.main",
                          borderRadius: "50%",
                          "&:hover": {
                            color: "#fff",
                            backgroundColor: "error.main",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            {!loading && filteredStaff.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {instituteId
                    ? "No data available in table"
                    : "Loading institute details..."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredStaff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(+event.target.value);
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xl"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, overflow: "hidden" } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1.5,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Avatar
            variant="rounded"
            sx={{ bgcolor: "primary.main", width: 36, height: 36 }}
          >
            {editingIndex !== null ? (
              <EditIcon fontSize="small" />
            ) : (
              <PersonAddAlt1Icon fontSize="small" />
            )}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{ fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}
            >
              {editingIndex !== null ? "Edit Staff" : "Add Staff"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personal details, employment history and training history
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpenDialog(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: "20px !important",
          }}
        >
          <Formik
            initialValues={
              editingIndex !== null
                ? { ...staff[editingIndex], instituteId: instituteId }
                : { ...initialValues, instituteId: instituteId }
            }
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={
              editingIndex !== null ? handleEditStaff : handleSubmitStaff
            }
          >
            {({
              values,
              handleChange,
              isSubmitting,
              setFieldValue,
              errors,
              touched,
            }) => (
              <Form>
                <Grid container spacing={3}>
                  <input
                    type="hidden"
                    name="instituteId"
                    value={instituteId || ""}
                  />
                  {values.id && (
                    <input type="hidden" name="id" value={values.id} />
                  )}
                  {values.createdBy && (
                    <input
                      type="hidden"
                      name="createdBy"
                      value={values.createdBy}
                    />
                  )}

                  {/* Section 1: Personal Details */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Card
                      elevation={0}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <CardContent>
                        <SectionHeader
                          icon={PersonIcon}
                          title="Personal Details"
                          subtitle="Enter your personal information"
                        />
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                          {/* Has Citizen ID */}
                          <Grid item size={{ xs: 12, md: 12 }}>
                            <Typography>
                              Has Citizen ID Number? <RequiredAsterisk />
                            </Typography>
                            <RadioGroup
                              row
                              name="hasCitizenId"
                              value={values.hasCitizenId}
                              onChange={(e) => {
                                handleChange(e);
                                scheduleDuplicateCheck({}, values.id);
                                setFieldValue("citizenId", "");
                                setFieldValue("referenceNo", "");
                                setFieldValue("name", "");
                                setFieldValue("genderId", "");
                                setFieldValue("dob", "");
                              }}
                            >
                              <FormControlLabel
                                value="Y"
                                control={<Radio />}
                                label="Yes"
                              />
                              <FormControlLabel
                                value="N"
                                control={<Radio />}
                                label="No"
                              />
                            </RadioGroup>
                          </Grid>

                          {values.hasCitizenId === "Y" ? (
                            <>
                              <Grid item size={{ xs: 12, md: 6 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label={
                                    <>
                                      Citizen ID <RequiredAsterisk />
                                    </>
                                  }
                                  name="citizenId"
                                  helperText={
                                    duplicateMessage || "Enter 11 digit citizen ID"
                                  }
                                  error={Boolean(
                                    duplicateMessage ||
                                      (touched.citizenId && errors.citizenId),
                                  )}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /\D/g,
                                      "",
                                    );
                                    if (value.length <= 11) {
                                      setFieldValue("citizenId", value);
                                      scheduleDuplicateCheck(
                                        {
                                          citizenId:
                                            value.length === 11 ? value : "",
                                        },
                                        values.id,
                                      );
                                      if (
                                        value.length === 11 &&
                                        editingIndex === null
                                      ) {
                                        debouncedFetchCitizen(
                                          value,
                                          setFieldValue,
                                        );
                                      } else if (value.length < 11) {
                                        setFieldValue("name", "");
                                        setFieldValue("genderId", "");
                                        setFieldValue("dob", "");
                                        clearCivilServantFields(setFieldValue);
                                      }
                                    }
                                  }}
                                  slotProps={{
                                    input: {
                                      endAdornment: fetchingCitizen && (
                                        <CircularProgress size={18} />
                                      ),
                                    },
                                  }}
                                />
                                <ErrorMessage
                                  name="citizenId"
                                  component="div"
                                />
                              </Grid>

                              <Grid item size={{ xs: 12, md: 6 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label={
                                    <>
                                      Name <RequiredAsterisk />
                                    </>
                                  }
                                  name="name"
                                  slotProps={{
                                    input: {
                                      readOnly: true,
                                    },
                                  }}
                                />
                                <ErrorMessage name="name" component="div" />
                              </Grid>
                            </>
                          ) : (
                            <>
                              <Grid item size={{ xs: 12, md: 6 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label={
                                    <>
                                      Reference No <RequiredAsterisk />
                                    </>
                                  }
                                  name="referenceNo"
                                  onChange={(e) => {
                                    handleChange(e);
                                    scheduleDuplicateCheck(
                                      { referenceNo: e.target.value.trim() },
                                      values.id,
                                    );
                                  }}
                                  error={Boolean(duplicateMessage)}
                                  helperText={duplicateMessage || undefined}
                                />
                                <ErrorMessage
                                  name="referenceNo"
                                  component="div"
                                />
                              </Grid>

                              <Grid item size={{ xs: 12, md: 6 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label={
                                    <>
                                      Name <RequiredAsterisk />
                                    </>
                                  }
                                  name="name"
                                />
                                <ErrorMessage name="name" component="div" />
                              </Grid>

                              <Grid item size={{ xs: 12, md: 4 }}>
                                <Field
                                  as={TextField}
                                  select
                                  fullWidth
                                  size="small"
                                  label={
                                    <>
                                      Gender <RequiredAsterisk />
                                    </>
                                  }
                                  name="genderId"
                                >
                                  <MenuItem value="">Select Gender</MenuItem>
                                  {genders.map((gender) => (
                                    <MenuItem
                                      key={gender.id}
                                      value={gender.id.toString()}
                                    >
                                      {gender.name}
                                    </MenuItem>
                                  ))}
                                </Field>
                                <ErrorMessage name="genderId" component="div" />
                              </Grid>

                              <Grid item size={{ xs: 12, md: 4 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  type="date"
                                  label="Date of Birth"
                                  name="dob"
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                            </>
                          )}

                          <Grid item size={{ xs: 12, md: 6 }}>
                            <Field
                              as={TextField}
                              fullWidth
                              size="small"
                              label={
                                <>
                                  Email <RequiredAsterisk />
                                </>
                              }
                              name="email"
                              type="email"
                            />
                            <ErrorMessage name="email" component="div" />
                          </Grid>

                          <Grid item size={{ xs: 12, md: 6 }}>
                            <Field
                              as={TextField}
                              fullWidth
                              size="small"
                              label={
                                <>
                                  Mobile No <RequiredAsterisk />
                                </>
                              }
                              name="mobileNo"
                              helperText="Enter 8 digit mobile number"
                              error={Boolean(
                                touched.mobileNo && errors.mobileNo,
                              )}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                if (value.length <= 8) {
                                  setFieldValue("mobileNo", value);
                                }
                              }}
                            />
                            <ErrorMessage name="mobileNo" component="div" />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Section 2: Employment History */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Card
                      elevation={0}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <CardContent>
                        <SectionHeader
                          icon={WorkIcon}
                          title="Employment History"
                          subtitle="Add your employment details"
                        />
                        <Divider sx={{ mb: 2 }} />

                        <FieldArray name="staffemploymenthistory">
                          {({ push, remove, form }) => (
                            <>
                              {form.values.staffemploymenthistory.map(
                                (_, idx) => (
                                  <Grid
                                    container
                                    spacing={2}
                                    key={idx}
                                    sx={{
                                      mb: 2,
                                      p: 2,
                                      borderRadius: 1,
                                    }}
                                    alignItems="center"
                                  >
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        size="small"
                                        type="date"
                                        label={
                                          <>
                                            Appointment Date{" "}
                                            <RequiredAsterisk />
                                          </>
                                        }
                                        name={`staffemploymenthistory.${idx}.appointmentDate`}
                                        InputLabelProps={{ shrink: true }}
                                      />
                                      <ErrorMessage
                                        name={`staffemploymenthistory.${idx}.appointmentDate`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        select
                                        fullWidth
                                        size="small"
                                        label={
                                          <>
                                            Employment Type <RequiredAsterisk />
                                          </>
                                        }
                                        name={`staffemploymenthistory.${idx}.employmentTypeId`}
                                      >
                                        <MenuItem value="">
                                          Select Employment Type
                                        </MenuItem>
                                        {employmentTypeOptions}
                                      </Field>
                                      <ErrorMessage
                                        name={`staffemploymenthistory.${idx}.employmentTypeId`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        select
                                        fullWidth
                                        size="small"
                                        label={
                                          <>
                                            Qualification <RequiredAsterisk />
                                          </>
                                        }
                                        name={`staffemploymenthistory.${idx}.qualificationId`}
                                      >
                                        <MenuItem value="">
                                          Select Qualification
                                        </MenuItem>
                                        {qualificationOptions}
                                      </Field>
                                      <ErrorMessage
                                        name={`staffemploymenthistory.${idx}.qualificationId`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 2 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        size="small"
                                        label={
                                          <>
                                            Designation <RequiredAsterisk />
                                          </>
                                        }
                                        name={`staffemploymenthistory.${idx}.designation`}
                                      />
                                      <ErrorMessage
                                        name={`staffemploymenthistory.${idx}.designation`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 1 }}>
                                      {idx > 0 && (
                                        <IconButton
                                          onClick={remove.bind(null, idx)}
                                          sx={{
                                            color: "error.main",
                                            borderRadius: "50%",
                                            "&:hover": {
                                              color: "#fff",
                                              backgroundColor: "error.main",
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Grid>
                                  </Grid>
                                ),
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                  push({
                                    appointmentDate: "",
                                    employmentTypeId: "",
                                    qualificationId: "",
                                    designation: "",
                                  })
                                }
                              >
                                Add Employment
                              </Button>
                            </>
                          )}
                        </FieldArray>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Section 3: Training History */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Card
                      elevation={0}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <CardContent>
                        <SectionHeader
                          icon={SchoolIcon}
                          title="Training History"
                          subtitle="Add your training details"
                        />
                        <Divider sx={{ mb: 2 }} />

                        <FieldArray name="stafftraininghistory">
                          {({ push, remove, form }) => (
                            <>
                              {form.values.stafftraininghistory.map(
                                (_, idx) => (
                                  <Grid
                                    container
                                    spacing={2}
                                    key={idx}
                                    sx={{
                                      mb: 2,
                                      p: 2,
                                      borderRadius: 1,
                                    }}
                                    alignItems="center"
                                  >
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        size="small"
                                        label={
                                          <>
                                            Training Name <RequiredAsterisk />
                                          </>
                                        }
                                        name={`stafftraininghistory.${idx}.trainingName`}
                                      />
                                      <ErrorMessage
                                        name={`stafftraininghistory.${idx}.trainingName`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        type="date"
                                        label={
                                          <>
                                            Start Date <RequiredAsterisk />
                                          </>
                                        }
                                        size="small"
                                        name={`stafftraininghistory.${idx}.trainingStart`}
                                        InputLabelProps={{ shrink: true }}
                                      />
                                      <ErrorMessage
                                        name={`stafftraininghistory.${idx}.trainingStart`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        type="date"
                                        label={
                                          <>
                                            End Date <RequiredAsterisk />
                                          </>
                                        }
                                        size="small"
                                        name={`stafftraininghistory.${idx}.trainingEnd`}
                                        InputLabelProps={{ shrink: true }}
                                      />
                                      <ErrorMessage
                                        name={`stafftraininghistory.${idx}.trainingEnd`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        label={
                                          <>
                                            Provider <RequiredAsterisk />
                                          </>
                                        }
                                        size="small"
                                        name={`stafftraininghistory.${idx}.providerName`}
                                      />
                                      <ErrorMessage
                                        name={`stafftraininghistory.${idx}.providerName`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        select
                                        fullWidth
                                        label={
                                          <>
                                            Funding <RequiredAsterisk />
                                          </>
                                        }
                                        size="small"
                                        name={`stafftraininghistory.${idx}.fundingSourceId`}
                                      >
                                        <MenuItem value="">
                                          Select Funding Source
                                        </MenuItem>
                                        {fundingSourceOptions}
                                      </Field>
                                      <ErrorMessage
                                        name={`stafftraininghistory.${idx}.fundingSourceId`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <Field
                                        as={TextField}
                                        fullWidth
                                        label={
                                          <>
                                            Cost <RequiredAsterisk />
                                          </>
                                        }
                                        size="small"
                                        name={`stafftraininghistory.${idx}.trainingCost`}
                                      />
                                      <ErrorMessage
                                        name={`stafftraininghistory.${idx}.trainingCost`}
                                        component="div"
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 1 }}>
                                      {idx > 0 && (
                                        <IconButton
                                          onClick={remove.bind(null, idx)}
                                          sx={{
                                            color: "error.main",
                                            borderRadius: "50%",
                                            "&:hover": {
                                              color: "#fff",
                                              backgroundColor: "error.main",
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Grid>
                                  </Grid>
                                ),
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                  push({
                                    trainingName: "",
                                    trainingStart: "",
                                    trainingEnd: "",
                                    providerName: "",
                                    trainingCost: "",
                                    fundingSourceId: "",
                                  })
                                }
                              >
                                Add Training
                              </Button>
                            </>
                          )}
                        </FieldArray>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Action Buttons */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <DialogActions
                      sx={{
                        p: 0,
                        pt: 2,
                        gap: 1,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Button
                        size="small"
                        color="inherit"
                        variant="outlined"
                        onClick={() => setOpenDialog(false)}
                        disabled={isSubmitting}
                        sx={{ textTransform: "none", px: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting || Boolean(duplicateMessage)}
                        startIcon={
                          isSubmitting ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <SaveIcon fontSize="small" />
                          )
                        }
                        sx={{ textTransform: "none", fontWeight: 600, px: 2.5 }}
                      >
                        {editingIndex !== null ? "Update Staff" : "Save Staff"}
                      </Button>
                    </DialogActions>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this staff entry?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            color="primary"
            size="small"
            variant="contained"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            size="small"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
StaffManagement.propTypes = {};

export default StaffManagement;
