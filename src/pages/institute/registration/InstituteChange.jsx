// InstituteChange.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import DatahubService from "../../../api/services/external/datahub/DatahubService";
import { useNavigate } from "react-router-dom";

// ==================== CONSTANTS ====================
const CHANGE_TYPES = {
  LOCATION: "location",
  NAME: "name",
  OWNERSHIP: "ownership",
};

const CHANGE_LABELS = {
  [CHANGE_TYPES.LOCATION]: "Change Location",
  [CHANGE_TYPES.NAME]: "Change Name",
  [CHANGE_TYPES.OWNERSHIP]: "Change Ownership",
};

const CHANGE_ICONS = {
  [CHANGE_TYPES.LOCATION]: LocationOnIcon,
  [CHANGE_TYPES.NAME]: DescriptionIcon,
  [CHANGE_TYPES.OWNERSHIP]: PeopleIcon,
};

const CHANGE_COLORS = {
  [CHANGE_TYPES.LOCATION]: "info",
  [CHANGE_TYPES.NAME]: "success",
  [CHANGE_TYPES.OWNERSHIP]: "warning",
};

const STEPS = ["Changes", "Documents", "Review & Submit"];

// ==================== CUSTOM HOOKS ====================
const useMasterData = () => {
  const [dzongkhags, setDzongkhags] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [otherOwnershipTypes, setOtherOwnershipTypes] = useState([]);
  const [typeOfOwners, setTypeOfOwners] = useState([]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [
        dzongkhagsRes,
        ownershipTypesRes,
        otherOwnershipTypesRes,
        typeOfOwnersRes,
      ] = await Promise.all([
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(1),
        CommonService.getByParentId(2),
        CommonService.getByParentId(6),
      ]);
      setDzongkhags(dzongkhagsRes.data);
      setOwnershipTypes(ownershipTypesRes.data);
      setOtherOwnershipTypes(otherOwnershipTypesRes.data);
      setTypeOfOwners(typeOfOwnersRes.data);
    } catch (error) {
      toast.error("Failed to load required data");
    }
  }, []);

  return {
    dzongkhags,
    ownershipTypes,
    otherOwnershipTypes,
    typeOfOwners,
    fetchMasterData,
  };
};

const useInstituteData = (registration_no) => {
  const [instituteDetails, setInstituteDetails] = useState(null);
  const [currentInstituteData, setCurrentInstituteData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getOwnershipTypeName = useCallback(
    (id, ownershipTypes, otherOwnershipTypes) => {
      if (!id) return "";
      const type = ownershipTypes.find((t) => t.id === parseInt(id));
      if (type) return type.name;
      const otherType = otherOwnershipTypes.find((t) => t.id === parseInt(id));
      if (otherType) return otherType.name;
      return id || "N/A";
    },
    [],
  );

  const getDzongkhagName = useCallback((id, dzongkhags) => {
    if (!id) return "";
    const dzongkhag = dzongkhags.find((d) => d.id === parseInt(id));
    return dzongkhag?.dzonkhagName || id || "N/A";
  }, []);

  const fetchInstituteDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        await InstituteRegistrationService.getInstituteChangeDetails(
          registration_no,
        );
      const instituteData =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : response.data;

      if (instituteData) {
        setInstituteDetails(instituteData);
        setCurrentInstituteData({
          instituteName: instituteData.proposed_institute_name || "",
          dzongkhag_id: instituteData.dzongkhag_id || "",
          exact_location: instituteData.exact_location || "",
          ownership_type_id: instituteData.ownership_type_id || "",
          other_ownership_type_id: instituteData.other_ownership_type_id || "",
          registration_no: instituteData.registration_no || "",
          company_name: instituteData.company_name || "",
          other_name: instituteData.other_name || "",
          other_address: instituteData.other_address || "",
          promoter_citizen_id: instituteData.promoter_citizen_id || "",
          promoter_name: instituteData.promoter_name || "",
          telephone_no: instituteData.telephone_no || "",
          mobile_no: instituteData.mobile_no || "",
          email_id: instituteData.email_id || "",
          business_license_no: instituteData.business_license_no || "",
          bhutanese_employees: instituteData.bhutanese_employees || "",
          non_bhutanese_employees: instituteData.non_bhutanese_employees || "",
          key_contact_name: instituteData.key_contact_name || "",
          key_contact_designation: instituteData.key_contact_designation || "",
          key_contact_mobile_no: instituteData.key_contact_mobile_no || "",
          partners: instituteData.partnerships
            ? JSON.parse(instituteData.partnerships)
            : [],
        });
      }
    } catch (error) {
      toast.error("Failed to load institute details");
    } finally {
      setLoading(false);
    }
  }, [registration_no]);

  useEffect(() => {
    if (registration_no) {
      fetchInstituteDetails();
    }
  }, [registration_no, fetchInstituteDetails]);

  return {
    instituteDetails,
    currentInstituteData,
    loading,
    getOwnershipTypeName,
    getDzongkhagName,
    fetchInstituteDetails,
  };
};

const useCitizenLookup = () => {
  const [fetching, setFetching] = useState(false);

  const fetchCitizenDetails = useCallback(async (cid) => {
    if (!cid || cid.length !== 11) {
      toast.warning("Please enter a valid 11-digit CID");
      return null;
    }

    setFetching(true);
    try {
      const response = await DatahubService.getDetailsByCitizenshipNo(cid);
      if (response.data?.citizenDetailsResponse?.citizenDetail?.[0]) {
        const citizen = response.data.citizenDetailsResponse.citizenDetail[0];
        const fullName =
          `${citizen.firstName || ""} ${citizen.lastName || ""}`.trim();
        toast.success(`Citizen details fetched successfully for ${fullName}`);
        return { fullName, citizen };
      }
      toast.warning("No citizen details found for this CID");
      return null;
    } catch (error) {
      toast.error(
        "Failed to fetch citizen details. Please check the CID number.",
      );
      return null;
    } finally {
      setFetching(false);
    }
  }, []);

  return { fetching, fetchCitizenDetails };
};

const useStepper = (initialStep = 0) => {
  const [activeStep, setActiveStep] = useState(initialStep);

  const goToNext = useCallback(() => setActiveStep((prev) => prev + 1), []);
  const goToPrevious = useCallback(() => setActiveStep((prev) => prev - 1), []);
  const goToStep = useCallback((step) => setActiveStep(step), []);

  return {
    activeStep,
    goToNext,
    goToPrevious,
    goToStep,
  };
};

// ==================== UTILITY FUNCTIONS ====================
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result.split(",")[1],
        contentType: file.type || "application/octet-stream",
      });
    reader.onerror = reject;
  });

// ==================== REUSABLE COMPONENTS ====================
const SectionHeader = ({ icon: Icon, title, color = "primary" }) => (
  <Box display="flex" alignItems="center" gap={1} mb={2}>
    <Icon color={color} fontSize="small" />
    <Typography variant="subtitle1" fontWeight={600}>
      {title}
    </Typography>
  </Box>
);

const InfoDisplay = ({ label, value }) => (
  <Box>
    <Typography variant="body2" color="textSecondary">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight="medium">
      {value || "N/A"}
    </Typography>
  </Box>
);

const ChangeTypeRadio = ({ value, onChange, error }) => (
  <FormControl component="fieldset" sx={{ width: "100%" }}>
    <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
      What would you like to change? <span style={{ color: "red" }}>*</span>
    </FormLabel>
    <Divider sx={{ mb: 3 }} />
    <RadioGroup
      name="changeType"
      value={value}
      onChange={onChange}
      sx={{ flexDirection: "row", gap: 2 }}
    >
      {Object.entries(CHANGE_TYPES).map(([key, val]) => {
        const Icon = CHANGE_ICONS[val];
        return (
          <FormControlLabel
            key={key}
            value={val}
            control={<Radio />}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Icon color={CHANGE_COLORS[val]} fontSize="small" />
                <Typography>{CHANGE_LABELS[val]}</Typography>
              </Box>
            }
          />
        );
      })}
    </RadioGroup>
    {error && (
      <Typography color="error" variant="caption" sx={{ mt: 1 }}>
        {error}
      </Typography>
    )}
  </FormControl>
);

const InfoAlert = ({ severity = "info", title, value }) => (
  <Alert severity={severity} sx={{ mb: 2 }}>
    {title}: {value || "N/A"}
  </Alert>
);

const FormTextField = ({
  formik,
  name,
  label,
  select = false,
  options = [],
  optionLabel = "name",
  optionValue = "id",
  placeholder = "",
  readOnly = false,
  endAdornment = null,
  ...props
}) => {
  const fieldProps = {
    fullWidth: true,
    label,
    name,
    size: "small",
    value: formik.values[name] || "",
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    placeholder,
    InputProps: {
      readOnly,
      ...(endAdornment && { endAdornment }),
    },
    ...props,
  };

  if (select) {
    return (
      <TextField {...fieldProps} select>
        <MenuItem value="">Select {label}</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt[optionValue]} value={String(opt[optionValue])}>
            {opt[optionLabel] || opt.name || opt.dzonkhagName || "Unknown"}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return <TextField {...fieldProps} />;
};

const PartnerCard = ({
  partner,
  index,
  formik,
  typeOfOwners,
  fetchingCitizen,
  onFetchPartner,
}) => {
  const isIndividual = partner.typeOfOwnerId === "22";
  const isCompany = partner.typeOfOwnerId === "23";

  return (
    <Box
      sx={{
        width: "100%",
        mb: 2,
        p: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormTextField
            formik={formik}
            name={`partners[${index}].typeOfOwnerId`}
            label="Type of Owner"
            select
            options={typeOfOwners}
            required
          />
        </Grid>

        {isIndividual && (
          <>
            <Grid item size={{ xs: 12, md: 3 }}>
              <FormTextField
                formik={formik}
                name={`partners[${index}].partnerCidNo`}
                label="Partner Citizen ID No"
                placeholder="Enter 11-digit CID"
                endAdornment={fetchingCitizen && <CircularProgress size={20} />}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  if (e.target.value && e.target.value.length === 11) {
                    onFetchPartner(e.target.value, index);
                  }
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <FormTextField
                formik={formik}
                name={`partners[${index}].partnerName`}
                label="Partner Name"
                readOnly
                placeholder="Auto-fetched from CID"
              />
            </Grid>
          </>
        )}

        {isCompany && (
          <>
            <Grid item size={{ xs: 12, md: 3 }}>
              <FormTextField
                formik={formik}
                name={`partners[${index}].partnerCompanyRegistrationNo`}
                label="Partner Company Registration No"
                placeholder="Enter registration number"
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <FormTextField
                formik={formik}
                name={`partners[${index}].partnerCompanyName`}
                label="Partner Company Name"
                placeholder="Enter company name"
              />
            </Grid>
          </>
        )}

        <Grid item size={{ xs: 12, md: 1 }}>
          <IconButton
            color="error"
            onClick={() => {
              const updated = [...formik.values.partners];
              updated.splice(index, 1);
              formik.setFieldValue("partners", updated);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
};

// ==================== VALIDATION SCHEMA ====================
const getValidationSchema = () => {
  return Yup.object({
    changeType: Yup.string().required("Please select the type of change"),

    dzongkhag_id: Yup.string().when("changeType", {
      is: CHANGE_TYPES.LOCATION,
      then: (schema) => schema.required("Dzongkhag is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    exact_location: Yup.string().when("changeType", {
      is: CHANGE_TYPES.LOCATION,
      then: (schema) => schema.required("Exact location is required"),
      otherwise: (schema) => schema.nullable(),
    }),

    proposed_institute_name: Yup.string().when("changeType", {
      is: CHANGE_TYPES.NAME,
      then: (schema) => schema.required("New institute name is required"),
      otherwise: (schema) => schema.nullable(),
    }),

    ownership_type_id: Yup.string().when("changeType", {
      is: CHANGE_TYPES.OWNERSHIP,
      then: (schema) => schema.required("Ownership type is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    other_ownership_type_id: Yup.string().when(
      ["changeType", "ownership_type_id"],
      {
        is: (changeType, ownershipTypeId) =>
          changeType === CHANGE_TYPES.OWNERSHIP && ownershipTypeId === "2",
        then: (schema) => schema.required("Please select the type of 'Others'"),
        otherwise: (schema) => schema.nullable(),
      },
    ),
    registration_no: Yup.string().when(
      ["changeType", "ownership_type_id", "other_ownership_type_id"],
      {
        is: (changeType, ownershipTypeId, otherOwnershipTypeId) =>
          changeType === CHANGE_TYPES.OWNERSHIP &&
          (ownershipTypeId === "1" ||
            (ownershipTypeId === "2" &&
              (otherOwnershipTypeId === "6" || otherOwnershipTypeId === "7"))),
        then: (schema) => schema.required("Registration No is required"),
        otherwise: (schema) => schema.nullable(),
      },
    ),
    company_name: Yup.string().when(
      ["changeType", "ownership_type_id", "other_ownership_type_id"],
      {
        is: (changeType, ownershipTypeId, otherOwnershipTypeId) =>
          changeType === CHANGE_TYPES.OWNERSHIP &&
          (ownershipTypeId === "1" ||
            (ownershipTypeId === "2" &&
              (otherOwnershipTypeId === "6" || otherOwnershipTypeId === "7"))),
        then: (schema) => schema.required("Company Name is required"),
        otherwise: (schema) => schema.nullable(),
      },
    ),
    other_name: Yup.string().when(["changeType", "other_ownership_type_id"], {
      is: (changeType, otherOwnershipTypeId) =>
        changeType === CHANGE_TYPES.OWNERSHIP &&
        (otherOwnershipTypeId === "5" || otherOwnershipTypeId === "8"),
      then: (schema) => schema.required("Name is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    other_address: Yup.string().when(
      ["changeType", "other_ownership_type_id"],
      {
        is: (changeType, otherOwnershipTypeId) =>
          changeType === CHANGE_TYPES.OWNERSHIP &&
          (otherOwnershipTypeId === "5" || otherOwnershipTypeId === "8"),
        then: (schema) => schema.required("Address is required"),
        otherwise: (schema) => schema.nullable(),
      },
    ),
    promoter_citizen_id: Yup.string().when(
      ["changeType", "ownership_type_id"],
      {
        is: (changeType, ownershipTypeId) =>
          changeType === CHANGE_TYPES.OWNERSHIP && ownershipTypeId === "4",
        then: (schema) =>
          schema
            .required("Promoter Citizen ID is required")
            .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
        otherwise: (schema) => schema.nullable(),
      },
    ),
    promoter_name: Yup.string().when(["changeType", "ownership_type_id"], {
      is: (changeType, ownershipTypeId) =>
        changeType === CHANGE_TYPES.OWNERSHIP && ownershipTypeId === "4",
      then: (schema) => schema.required("Promoter Name is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    partners: Yup.array().of(
      Yup.object().shape({
        typeOfOwnerId: Yup.string().when("changeType", {
          is: CHANGE_TYPES.OWNERSHIP,
          then: (schema) => schema.required("Type of Owner is required"),
          otherwise: (schema) => schema.nullable(),
        }),
        partnerCidNo: Yup.string().when(["changeType", "typeOfOwnerId"], {
          is: (changeType, typeOfOwnerId) =>
            changeType === CHANGE_TYPES.OWNERSHIP && typeOfOwnerId === "22",
          then: (schema) =>
            schema
              .required("Citizen ID is required")
              .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
          otherwise: (schema) => schema.nullable(),
        }),
        partnerName: Yup.string().when(["changeType", "typeOfOwnerId"], {
          is: (changeType, typeOfOwnerId) =>
            changeType === CHANGE_TYPES.OWNERSHIP && typeOfOwnerId === "22",
          then: (schema) => schema.required("Partner Name is required"),
          otherwise: (schema) => schema.nullable(),
        }),
        partnerCompanyRegistrationNo: Yup.string().when(
          ["changeType", "typeOfOwnerId"],
          {
            is: (changeType, typeOfOwnerId) =>
              changeType === CHANGE_TYPES.OWNERSHIP && typeOfOwnerId === "23",
            then: (schema) =>
              schema.required("Partner Company Registration No is required"),
            otherwise: (schema) => schema.nullable(),
          },
        ),
        partnerCompanyName: Yup.string().when(["changeType", "typeOfOwnerId"], {
          is: (changeType, typeOfOwnerId) =>
            changeType === CHANGE_TYPES.OWNERSHIP && typeOfOwnerId === "23",
          then: (schema) => schema.required("Partner Company Name is required"),
          otherwise: (schema) => schema.nullable(),
        }),
      }),
    ),
    reasonForChange: Yup.string()
      .required("Reason for change is required")
      .min(5, "Please provide a detailed reason (minimum 5 characters)"),
  });
};

// ==================== MAIN COMPONENT ====================
const InstituteChange = () => {
  const navigate = useNavigate();
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [submitting, setSubmitting] = useState(false);
  const masterData = useMasterData();
  const instituteData = useInstituteData(registration_no);
  const citizenLookup = useCitizenLookup();
  const stepper = useStepper(0);

  const [formValues, setFormValues] = useState({
    changeType: "",
    dzongkhag_id: "",
    exact_location: "",
    proposed_institute_name: "",
    ownership_type_id: "",
    other_ownership_type_id: "",
    registration_no: "",
    company_name: "",
    other_name: "",
    other_address: "",
    promoter_citizen_id: "",
    promoter_name: "",
    partners: [],
    files: [],
    reasonForChange: "",
  });

  const formik = useFormik({
    initialValues: formValues,
    validationSchema: getValidationSchema(),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const documents =
          values.files.length > 0
            ? await Promise.all(values.files.map(fileToBase64))
            : [];

        const payload = {
          instituteId:
            instituteData.instituteDetails?.id ||
            instituteData.instituteDetails?.institute_id,
          reasonForChange: values.reasonForChange,
          changeType: values.changeType,
          dzongkhagId: values.dzongkhag_id
            ? parseInt(values.dzongkhag_id)
            : null,
          exactLocation: values.exact_location || null,
          instituteName: values.proposed_institute_name || null,
          ownershipTypeId: values.ownership_type_id || null,
          otherOwnershipTypeId: values.other_ownership_type_id || null,
          registrationNo: values.registration_no || null,
          companyName: values.company_name || null,
          otherName: values.other_name || null,
          otherAddress: values.other_address || null,
          promoterCitizenId: values.promoter_citizen_id || null,
          promoterName: values.promoter_name || null,
          partners:
            values.partners.length > 0
              ? values.partners.map((partner) => ({
                  partnerName: partner.partnerName || null,
                  typeOfOwner: partner.typeOfOwnerId || null,
                  citizenId: partner.partnerCidNo || null,
                  registrationNo: partner.partnerCompanyRegistrationNo || null,
                  companyName: partner.partnerCompanyName || null,
                }))
              : null,
          documents: documents,
          serviceId: 10,
          assignedRoleId: 7,
          statusId: 115,
          createdBy: actionId,
        };

        const response =
          await InstituteRegistrationService.submitInstituteChange(payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Change request submitted successfully!");
          navigate("/");
          formik.resetForm();
          stepper.goToStep(0);
          await instituteData.fetchInstituteDetails();
        }
      } catch (error) {
        toast.error(error.message || "Failed to submit change request");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ===== EFFECTS =====
  useEffect(() => {
    masterData.fetchMasterData();
  }, []);

  // ===== HELPERS =====
  const isOthersType = useCallback(
    () => formik.values.ownership_type_id === "2",
    [formik.values.ownership_type_id],
  );
  const isAgencyOrOrganization = useCallback(() => {
    const id = formik.values.other_ownership_type_id;
    return id === "5" || id === "8";
  }, [formik.values.other_ownership_type_id]);
  const isCooperativeOrGroup = useCallback(() => {
    const id = formik.values.other_ownership_type_id;
    return id === "6" || id === "7";
  }, [formik.values.other_ownership_type_id]);
  const isSoleProprietorship = useCallback(
    () => formik.values.ownership_type_id === "4",
    [formik.values.ownership_type_id],
  );
  const isCompany = useCallback(
    () => formik.values.ownership_type_id === "1",
    [formik.values.ownership_type_id],
  );
  const isPartnership = useCallback(
    () => formik.values.ownership_type_id === "3",
    [formik.values.ownership_type_id],
  );

  const hasChanges = useCallback(() => {
    if (!formik.values.changeType) return false;
    if (formik.values.changeType === CHANGE_TYPES.LOCATION) {
      return !!(formik.values.dzongkhag_id || formik.values.exact_location);
    } else if (formik.values.changeType === CHANGE_TYPES.NAME) {
      return !!formik.values.proposed_institute_name;
    } else if (formik.values.changeType === CHANGE_TYPES.OWNERSHIP) {
      return !!(
        formik.values.ownership_type_id || formik.values.partners.length > 0
      );
    }
    return false;
  }, [formik.values]);

  const getChangeSummary = useCallback(() => {
    const changes = [];
    if (formik.values.changeType === CHANGE_TYPES.LOCATION)
      changes.push("Location");
    if (formik.values.changeType === CHANGE_TYPES.NAME) changes.push("Name");
    if (formik.values.changeType === CHANGE_TYPES.OWNERSHIP)
      changes.push("Ownership");
    if (formik.values.partners.length > 0) changes.push("Partners");
    return changes;
  }, [formik.values]);

  const getTypeOfOwnerName = useCallback(
    (id) => {
      if (!id) return "";
      const type = masterData.typeOfOwners.find((t) => t.id === parseInt(id));
      return type?.name || id || "N/A";
    },
    [masterData.typeOfOwners],
  );

  const handleChangeType = useCallback(
    (event) => {
      const value = event.target.value;
      formik.setFieldValue("changeType", value);
      // Reset all change-specific fields
      const fieldsToReset = [
        "dzongkhag_id",
        "exact_location",
        "proposed_institute_name",
        "ownership_type_id",
        "other_ownership_type_id",
        "registration_no",
        "company_name",
        "other_name",
        "other_address",
        "promoter_citizen_id",
        "promoter_name",
        "partners",
      ];
      fieldsToReset.forEach((field) => formik.setFieldValue(field, ""));
    },
    [formik],
  );

  const handleFetchPromoter = useCallback(
    async (cid) => {
      const result = await citizenLookup.fetchCitizenDetails(cid);
      if (result) {
        formik.setFieldValue("promoter_name", result.fullName);
      } else {
        formik.setFieldValue("promoter_name", "");
      }
    },
    [citizenLookup, formik],
  );

  const handleFetchPartner = useCallback(
    async (cid, index) => {
      const result = await citizenLookup.fetchCitizenDetails(cid);
      if (result) {
        formik.setFieldValue(`partners[${index}].partnerName`, result.fullName);
      } else {
        formik.setFieldValue(`partners[${index}].partnerName`, "");
      }
    },
    [citizenLookup, formik],
  );

  const renderChangeSection = useCallback(() => {
    const { changeType } = formik.values;

    if (changeType === CHANGE_TYPES.LOCATION) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <SectionHeader
            icon={LocationOnIcon}
            title="Change Location"
            color="info"
          />
          <Divider sx={{ mb: 3 }} />
          <InfoAlert
            severity="info"
            title="Current Location"
            value={`${instituteData.getDzongkhagName(instituteData.currentInstituteData?.dzongkhag_id, masterData.dzongkhags)} - ${instituteData.currentInstituteData?.exact_location || "N/A"}`}
          />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormTextField
                formik={formik}
                name="dzongkhag_id"
                label="New Dzongkhag"
                select
                options={masterData.dzongkhags}
                optionLabel="dzonkhagName"
                required
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormTextField
                formik={formik}
                name="exact_location"
                label="New Exact Location"
                placeholder="Building name, village, etc."
                required
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    if (changeType === CHANGE_TYPES.NAME) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <SectionHeader
            icon={DescriptionIcon}
            title="Change Name"
            color="success"
          />
          <Divider sx={{ mb: 3 }} />
          <InfoAlert
            severity="info"
            title="Current Name"
            value={instituteData.currentInstituteData?.instituteName || "N/A"}
          />
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormTextField
                formik={formik}
                name="proposed_institute_name"
                label="New Institute Name"
                placeholder="Enter new institute name"
                required
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }

    if (changeType === CHANGE_TYPES.OWNERSHIP) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <SectionHeader
            icon={PeopleIcon}
            title="Change Ownership"
            color="warning"
          />
          <Divider sx={{ mb: 3 }} />

          <InfoAlert
            severity="info"
            title="Current Ownership"
            value={`${instituteData.getOwnershipTypeName(instituteData.currentInstituteData?.ownership_type_id, masterData.ownershipTypes, masterData.otherOwnershipTypes) || "N/A"}`}
          />
          <Alert severity="warning" sx={{ mb: 3 }}>
            Changing ownership requires additional documentation. Please upload
            supporting documents in the next step.
          </Alert>

          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormTextField
                formik={formik}
                name="ownership_type_id"
                label="New Ownership Type"
                select
                options={masterData.ownershipTypes}
                required
                onChange={(e) => {
                  formik.handleChange(e);
                  [
                    "other_ownership_type_id",
                    "registration_no",
                    "company_name",
                    "other_name",
                    "other_address",
                    "promoter_citizen_id",
                    "promoter_name",
                    "partners",
                  ].forEach((field) => formik.setFieldValue(field, ""));
                }}
              />
            </Grid>

            {isOthersType() && (
              <Grid item size={{ xs: 12, md: 4 }}>
                <FormTextField
                  formik={formik}
                  name="other_ownership_type_id"
                  label="Type of Others"
                  select
                  options={masterData.otherOwnershipTypes}
                  required
                  onChange={(e) => {
                    formik.handleChange(e);
                    [
                      "registration_no",
                      "company_name",
                      "other_name",
                      "other_address",
                    ].forEach((field) => formik.setFieldValue(field, ""));
                  }}
                />
              </Grid>
            )}

            {(isCompany() || (isOthersType() && isCooperativeOrGroup())) && (
              <>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    formik={formik}
                    name="registration_no"
                    label={isCompany() ? "Registration No" : "Registration No"}
                    placeholder="Enter registration number"
                    required
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    formik={formik}
                    name="company_name"
                    label={isCompany() ? "Company Name" : "Organization Name"}
                    placeholder={
                      isCompany()
                        ? "Enter company name"
                        : "Enter organization name"
                    }
                    required
                  />
                </Grid>
              </>
            )}

            {isOthersType() && isAgencyOrOrganization() && (
              <>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    formik={formik}
                    name="other_name"
                    label="Name"
                    placeholder="Enter name"
                    required
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    formik={formik}
                    name="other_address"
                    label="Address"
                    placeholder="Enter address"
                    required
                  />
                </Grid>
              </>
            )}

            {isSoleProprietorship() && (
              <>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    formik={formik}
                    name="promoter_citizen_id"
                    label="Promoter Citizen ID"
                    placeholder="Enter 11-digit CID"
                    endAdornment={
                      citizenLookup.fetching && <CircularProgress size={20} />
                    }
                    onBlur={(e) => {
                      formik.handleBlur(e);
                      if (e.target.value && e.target.value.length === 11) {
                        handleFetchPromoter(e.target.value);
                      }
                    }}
                    required
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    formik={formik}
                    name="promoter_name"
                    label="Promoter Name"
                    readOnly
                    placeholder="Auto-fetched from CID"
                    required
                  />
                </Grid>
              </>
            )}

            {isPartnership() && (
              <Grid item size={{ xs: 12 }}>
                <Box sx={{ mt: 2, width: "100%" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Partner Details
                  </Typography>

                  {formik.values.partners.map((partner, index) => (
                    <PartnerCard
                      key={index}
                      partner={partner}
                      index={index}
                      formik={formik}
                      typeOfOwners={masterData.typeOfOwners}
                      fetchingCitizen={citizenLookup.fetching}
                      onFetchPartner={handleFetchPartner}
                    />
                  ))}

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      formik.setFieldValue("partners", [
                        ...formik.values.partners,
                        {
                          typeOfOwnerId: "",
                          partnerCidNo: "",
                          partnerName: "",
                          partnerCompanyRegistrationNo: "",
                          partnerCompanyName: "",
                        },
                      ])
                    }
                  >
                    Add Partner
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      );
    }

    return null;
  }, [
    formik.values,
    formik.handleChange,
    formik.handleBlur,
    masterData.dzongkhags,
    masterData.ownershipTypes,
    masterData.otherOwnershipTypes,
    masterData.typeOfOwners,
    instituteData,
    isOthersType,
    isAgencyOrOrganization,
    isCooperativeOrGroup,
    isSoleProprietorship,
    isCompany,
    isPartnership,
    citizenLookup.fetching,
    handleFetchPromoter,
    handleFetchPartner,
  ]);

  const renderReviewSummary = useCallback(() => {
    const { values } = formik;
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Review Your Request
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item size={{ xs: 12 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Changes Requested:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {getChangeSummary().length > 0 ? (
                getChangeSummary().map((change) => (
                  <Chip
                    key={change}
                    label={change}
                    color="primary"
                    size="small"
                    icon={<CheckCircleIcon />}
                  />
                ))
              ) : (
                <Typography color="error">No changes selected</Typography>
              )}
            </Box>
          </Grid>

          {values.changeType === CHANGE_TYPES.NAME &&
            values.proposed_institute_name && (
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  New Institute Name:
                </Typography>
                <Typography variant="body1">
                  {values.proposed_institute_name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Current:{" "}
                  {instituteData.currentInstituteData?.instituteName || "N/A"}
                </Typography>
              </Grid>
            )}

          {values.changeType === CHANGE_TYPES.LOCATION &&
            (values.dzongkhag_id || values.exact_location) && (
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  New Location:
                </Typography>
                <Typography variant="body1">
                  {instituteData.getDzongkhagName(
                    values.dzongkhag_id,
                    masterData.dzongkhags,
                  )}{" "}
                  {values.exact_location}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Current:{" "}
                  {instituteData.getDzongkhagName(
                    instituteData.currentInstituteData?.dzongkhag_id,
                    masterData.dzongkhags,
                  )}{" "}
                  -{" "}
                  {instituteData.currentInstituteData?.exact_location || "N/A"}
                </Typography>
              </Grid>
            )}

          {values.changeType === CHANGE_TYPES.OWNERSHIP &&
            values.ownership_type_id && (
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  New Ownership:
                </Typography>
                <Typography variant="body1">
                  {instituteData.getOwnershipTypeName(
                    values.ownership_type_id,
                    masterData.ownershipTypes,
                    masterData.otherOwnershipTypes,
                  )}
                  {values.company_name && ` - ${values.company_name}`}
                  {values.other_name && ` - ${values.other_name}`}
                  {values.promoter_name && ` - ${values.promoter_name}`}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Current:{" "}
                  {instituteData.getOwnershipTypeName(
                    instituteData.currentInstituteData?.ownership_type_id,
                    masterData.ownershipTypes,
                    masterData.otherOwnershipTypes,
                  ) || "N/A"}
                </Typography>
              </Grid>
            )}

          {values.changeType === CHANGE_TYPES.OWNERSHIP &&
            values.partners.length > 0 && (
              <Grid item size={{ xs: 12 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Partners:
                </Typography>
                {values.partners.map((partner, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 1, mb: 1, bgcolor: "#fafafa" }}
                  >
                    <Typography variant="body2">
                      {getTypeOfOwnerName(partner.typeOfOwnerId)}:{" "}
                      {partner.partnerName ||
                        partner.partnerCompanyName ||
                        "N/A"}
                    </Typography>
                  </Paper>
                ))}
              </Grid>
            )}

          <Grid item size={{ xs: 12 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Reason for Change:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
              <Typography variant="body2">{values.reasonForChange}</Typography>
            </Paper>
          </Grid>

          <Grid item size={{ xs: 12 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Supporting Documents:
            </Typography>
            <Typography variant="body2">
              {values.files.length} file(s) attached
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }, [
    formik.values,
    getChangeSummary,
    getTypeOfOwnerName,
    instituteData,
    masterData,
  ]);

  if (instituteData.loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  const { activeStep } = stepper;
  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <Box sx={{ m: 1 }}>
      <Paper sx={{ p: 2 }}>
        {/* Header */}
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography
            textTransform="uppercase"
            fontWeight="bold"
            sx={{ textDecoration: "underline", fontSize: "1.3rem" }}
          >
            Request for Institute Change
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Submit a request to change your institute's location, name, or
            ownership details
          </Typography>
          {registration_no && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ mt: 1, display: "block" }}
            >
              Registration No: {registration_no}
            </Typography>
          )}
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Current Institute Information */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <SectionHeader
              icon={BusinessIcon}
              title="Current Institute Information"
            />
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[
                {
                  label: "Application No:",
                  value: instituteData.instituteDetails?.application_no,
                },
                {
                  label: "Institute Name:",
                  value: instituteData.currentInstituteData?.instituteName,
                },
                {
                  label: "Dzongkhag:",
                  value: instituteData.getDzongkhagName(
                    instituteData.currentInstituteData?.dzongkhag_id,
                    masterData.dzongkhags,
                  ),
                },
                {
                  label: "Exact Location:",
                  value: instituteData.currentInstituteData?.exact_location,
                },
                {
                  label: "Ownership Type:",
                  value: instituteData.getOwnershipTypeName(
                    instituteData.currentInstituteData?.ownership_type_id,
                    masterData.ownershipTypes,
                    masterData.otherOwnershipTypes,
                  ),
                },
                ...(instituteData.currentInstituteData?.ownership_type_id ===
                "1"
                  ? [
                      {
                        label: "Registration No:",
                        value:
                          instituteData.currentInstituteData?.registration_no,
                      },
                      {
                        label: "Company Name:",
                        value: instituteData.currentInstituteData?.company_name,
                      },
                    ]
                  : []),
                {
                  label: "Status:",
                  value:
                    instituteData.instituteDetails?.status_id === "57"
                      ? "Active"
                      : "Pending",
                },
              ].map((field, idx) => (
                <Grid key={idx} item size={{ xs: 12, md: 3 }}>
                  <InfoDisplay label={field.label} value={field.value} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (Object.keys(formik.errors).length > 0) {
              toast.error(
                "Please fix all validation errors before submitting. Check all required fields.",
              );
              return;
            }
            formik.handleSubmit(e);
          }}
        >
          {activeStep === 0 && (
            <>
              <ChangeTypeRadio
                value={formik.values.changeType}
                onChange={handleChangeType}
                error={formik.touched.changeType && formik.errors.changeType}
              />
              {renderChangeSection()}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Reason for Change <span style={{ color: "red" }}>*</span>
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <FormTextField
                  formik={formik}
                  name="reasonForChange"
                  label="Reason for Change"
                  multiline
                  rows={4}
                  placeholder="Please provide a detailed explanation for requesting this change (minimum 5 characters)..."
                  required
                />
              </Paper>
            </>
          )}

          {activeStep === 1 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <SectionHeader
                icon={AttachFileIcon}
                title="Supporting Documents"
              />
              <Divider sx={{ mb: 3 }} />
              <Alert severity="info" sx={{ mb: 3 }}>
                Please upload relevant documents supporting your change request
                (e.g., ownership transfer documents, location proof, etc.)
              </Alert>
              <FileUpload
                files={formik.values.files}
                onFilesChange={(files) => formik.setFieldValue("files", files)}
              />
            </Paper>
          )}

          {activeStep === 2 && renderReviewSummary()}

          {/* Navigation Buttons */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button
              type="button"
              variant="outlined"
              startIcon={<FastRewindIcon />}
              onClick={stepper.goToPrevious}
              disabled={activeStep === 0}
              sx={{ textTransform: "none" }}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => {
                formik.resetForm();
                stepper.goToStep(0);
              }}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                variant="contained"
                startIcon={
                  submitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    <ArrowUpwardIcon />
                  )
                }
                disabled={
                  submitting || !hasChanges() || !formik.values.reasonForChange
                }
                sx={{ textTransform: "none" }}
                onClick={() => {
                  if (Object.keys(formik.errors).length > 0) {
                    toast.error(
                      "Please fix all validation errors before submitting. Check all required fields.",
                    );
                    return;
                  }
                  formik.handleSubmit();
                }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                endIcon={<FastForwardIcon />}
                onClick={stepper.goToNext}
                disabled={
                  activeStep === 0 &&
                  (!formik.values.changeType || !formik.values.reasonForChange)
                }
                sx={{ textTransform: "none" }}
              >
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default InstituteChange;
