// AssessorAccreditorQMSAuditorRenewal.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
} from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import FileUpload from "../../components/file/FileUpload";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CommonService from "../../api/services/internal/common/CommonService";
import AssessorAccreditorQMSAuditorService from "../../api/services/internal/registration/AssessorAccreditorQMSAuditorService";
import { useNavigate, useParams } from "react-router-dom";

// ==================== PROPTYPES ====================

const formSectionPropTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};

const selectFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};

const textInputFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
};

const workExperienceFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  exp: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  loading: PropTypes.bool,
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

const requiredLabel = (label) => (
  <>
    {label}
    <Typography component="span" sx={{ color: "red" }}>
      *
    </Typography>
  </>
);

// ==================== CUSTOM HOOKS ====================
const useDropdownData = () => {
  const [sectors, setSectors] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [genders, setGenders] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState("");

  const fetchDropdownData = useCallback(async () => {
    try {
      const [sectorsRes, dzongkhagsRes, certificationsRes, gendersRes] =
        await Promise.all([
          CommonService.getAllSectors(),
          CommonService.getAllDzongkhags(),
          CommonService.getByParentId(10),
          CommonService.getByParentId(8),
        ]);

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setCertificationLevels(certificationsRes.data || []);
      setGenders(gendersRes.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast.error("Failed to load dropdown data");
    }
  }, []);

  const fetchOccupationsBySector = useCallback(async (sectorId) => {
    if (!sectorId) {
      setOccupations([]);
      return;
    }
    try {
      const response = await CommonService.getOccupationsBySectorId(sectorId);
      setOccupations(response.data || []);
    } catch (error) {
      console.error("Error fetching occupations:", error);
      setOccupations([]);
    }
  }, []);

  const handleSectorChange = useCallback(
    (sectorId, formik) => {
      setSelectedSectorId(sectorId);
      formik.setFieldValue("sectorId", sectorId);
      formik.setFieldValue("occupationId", "");
      fetchOccupationsBySector(sectorId);
    },
    [fetchOccupationsBySector],
  );

  return {
    sectors,
    dzongkhags,
    certificationLevels,
    genders,
    occupations,
    selectedSectorId,
    fetchDropdownData,
    fetchOccupationsBySector,
    handleSectorChange,
  };
};

const useRenewalApplicant = (serviceId) => {
  const [renewalApplicantDetails, setRenewalApplicantDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const fetchApplicantDetails = useCallback(
    async (citizenId, referenceNo, formik) => {
      if (!citizenId && !referenceNo) return;
      if (citizenId && citizenId.length !== 11) return;

      setFetchingDetails(true);
      try {
        const response =
          await AssessorAccreditorQMSAuditorService.getApplicationByCitizenIdOrReferenceNo(
            citizenId || null,
            referenceNo || null,
            serviceId,
          );

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const applicantData = response.data[0];
          setRenewalApplicantDetails(applicantData);
          populateFormWithApplicantData(applicantData, formik);
          toast.success("Applicant details fetched successfully!");
        } else {
          toast.warning("No existing application found for the provided ID");
          setRenewalApplicantDetails(null);
        }
      } catch (error) {
        console.error("Error fetching Renewal Applicant Details:", error);
        toast.error("Failed to fetch applicant details. Please try again.");
        setRenewalApplicantDetails(null);
      } finally {
        setFetchingDetails(false);
      }
    },
    [serviceId],
  );

  const populateFormWithApplicantData = useCallback(
    (applicantData, formik) => {
      const fieldMappings = {
        fullName: applicantData.full_name,
        genderId: applicantData.gender_id,
        mobileNo: applicantData.mobile_no,
        email: applicantData.email,
        dzongkhagId: applicantData.dzongkhag_id,
        organizationName: applicantData.organization_name,
        citizenId: applicantData.citizen_id,
      };

      Object.entries(fieldMappings).forEach(([field, value]) => {
        if (value) formik.setFieldValue(field, value);
      });

      // Service-specific fields
      if (serviceId === "32" || serviceId === "5") {
        if (applicantData.sector_id) {
          formik.setFieldValue("sectorId", applicantData.sector_id);
          // We'll need to fetch occupations separately
        }
        formik.setFieldValue("occupationId", applicantData.occupation_id || "");
        formik.setFieldValue(
          "certificationLevelId",
          applicantData.certification_level_id || "",
        );
      }

      if (serviceId === "5") {
        formik.setFieldValue("designation", applicantData.designation || "");
        formik.setFieldValue(
          "yearsOfExperience",
          applicantData.years_of_experience || "",
        );
        formik.setFieldValue(
          "responsibility",
          applicantData.responsibility || "",
        );
      }

      if (serviceId === "3") {
        formik.setFieldValue("qmsTraining", applicantData.qms_training || "");
        formik.setFieldValue(
          "academicBackground",
          applicantData.academic_background || "",
        );

        if (applicantData.work_experiences) {
          let workExperiences = applicantData.work_experiences;
          if (typeof workExperiences === "string") {
            try {
              workExperiences = JSON.parse(workExperiences);
            } catch (e) {
              workExperiences = [];
            }
          }
          if (Array.isArray(workExperiences) && workExperiences.length > 0) {
            formik.setFieldValue("workExperiences", workExperiences);
          }
        }
      }
    },
    [serviceId],
  );

  const resetApplicantDetails = useCallback(() => {
    setRenewalApplicantDetails(null);
  }, []);

  return {
    renewalApplicantDetails,
    fetchingDetails,
    fetchApplicantDetails,
    resetApplicantDetails,
  };
};

// ==================== SCHEMA GENERATORS ====================
const getBaseValidationSchema = (hasCitizenId) => {
  const baseSchema = {
    fullName: Yup.string().required("Full Name is required"),
    genderId: Yup.number().required("Gender is required"),
    mobileNo: Yup.string().required("Mobile No is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    dzongkhagId: Yup.number().required("Dzongkhag is required"),
    organizationName: Yup.string().required("Organization Name is required"),
    documents: Yup.array().min(1, "Please upload at least one file"),
  };

  if (hasCitizenId === "yes") {
    baseSchema.citizenId = Yup.string()
      .matches(/^[0-9]{11}$/, "Invalid CID number (11 digits required)")
      .required("Citizen ID Number is required");
  } else {
    baseSchema.referenceNo = Yup.string().required("Reference No is required");
  }

  return baseSchema;
};

const getAssessorSchema = (hasCitizenId) => {
  const base = getBaseValidationSchema(hasCitizenId);
  return Yup.object({
    ...base,
    sectorId: Yup.number().required("Sector is required"),
    occupationId: Yup.number().required("Occupation is required"),
    certificationLevelId: Yup.number().required(
      "Certification Level is required",
    ),
  });
};

const getAccreditorSchema = (hasCitizenId) => {
  const base = getBaseValidationSchema(hasCitizenId);
  return Yup.object({
    ...base,
    sectorId: Yup.number().required("Sector is required"),
    occupationId: Yup.number().required("Occupation is required"),
    certificationLevelId: Yup.number().required(
      "Certification Level is required",
    ),
    designation: Yup.string().required("Designation is required"),
    yearsOfExperience: Yup.number()
      .min(5, "Minimum 5 years required")
      .required("Number of Years is required"),
    responsibility: Yup.string().required("Responsibility is required"),
  });
};

const getQMSAuditorSchema = (hasCitizenId, values = {}) => {
  const base = getBaseValidationSchema(hasCitizenId);
  const schema = {
    ...base,
    qmsTraining: Yup.string().required(
      "Please specify if QMS training attended",
    ),
    workExperiences: Yup.array()
      .of(
        Yup.object({
          organizationName: Yup.string().required("Organization Name required"),
          designation: Yup.string().required("Designation required"),
          year: Yup.number()
            .min(5, "Minimum 5 years required")
            .required("Number of Years required"),
          responsibility: Yup.string().required("Responsibility required"),
        }),
      )
      .min(1, "At least one work experience required"),
  };

  if (values.qmsTraining === "Yes") {
    schema.academicBackground = Yup.string().required(
      "Academic / Technical / Professional Background is required when QMS training is Yes",
    );
  }

  return Yup.object(schema);
};

const getValidationSchema = (serviceId, hasCitizenId, values = {}) => {
  const serviceSchemaMap = {
    32: getAssessorSchema,
    5: getAccreditorSchema,
    3: (hasCitizenId) => getQMSAuditorSchema(hasCitizenId, values),
  };

  const schemaGenerator =
    serviceSchemaMap[serviceId] || getBaseValidationSchema;
  return schemaGenerator(hasCitizenId);
};

// ==================== INITIAL VALUES GENERATOR ====================
const getInitialValues = (serviceId) => {
  const baseValues = {
    citizenId: "",
    referenceNo: "",
    fullName: "",
    genderId: "",
    mobileNo: "",
    email: "",
    dzongkhagId: "",
    organizationName: "",
    documents: [],
    serviceId: serviceId ? parseInt(serviceId) : null,
    assignedRoleId: 7,
    assignedUserId: null,
    statusId: 55,
    remarks: "",
  };

  const serviceSpecificValues = {
    32: { sectorId: "", occupationId: "", certificationLevelId: "" },
    5: {
      sectorId: "",
      occupationId: "",
      certificationLevelId: "",
      designation: "",
      yearsOfExperience: "",
      responsibility: "",
    },
    3: {
      qmsTraining: "",
      academicBackground: "",
      workExperiences: [
        { organizationName: "", designation: "", year: "", responsibility: "" },
      ],
    },
  };

  return { ...baseValues, ...(serviceSpecificValues[serviceId] || {}) };
};

// ==================== REUSABLE COMPONENTS ====================
const FormSection = ({ title, children, sx = {} }) => (
  <Paper
    sx={{
      p: { xs: 2, md: 3 },
      mb: 4,
      borderRadius: 2,
      border: "1px solid #e0e0e0",
      ...sx,
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
      {title}
    </Typography>
    <Divider sx={{ mb: 3 }} />
    {children}
  </Paper>
);

FormSection.propTypes = formSectionPropTypes;

const SelectField = ({
  formik,
  name,
  label,
  options,
  valueKey = "id",
  labelKey = "name",
  disabled = false,
  loading = false,
  ...props
}) => (
  <TextField
    select
    fullWidth
    label={requiredLabel(label)}
    name={name}
    size="small"
    value={formik.values[name] || ""}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    error={formik.touched[name] && Boolean(formik.errors[name])}
    helperText={formik.touched[name] && formik.errors[name]}
    disabled={disabled || loading}
    {...props}
  >
    <MenuItem value="">Select</MenuItem>
    {options.map((item) => (
      <MenuItem key={item[valueKey]} value={item[valueKey]}>
        {item[labelKey]}
      </MenuItem>
    ))}
  </TextField>
);

SelectField.propTypes = selectFieldPropTypes;

const TextInputField = ({
  formik,
  name,
  label,
  type = "text",
  disabled = false,
  loading = false,
  multiline = false,
  rows = 1,
  ...props
}) => (
  <TextField
    fullWidth
    type={type}
    label={requiredLabel(label)}
    name={name}
    size="small"
    value={formik.values[name] || ""}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    error={formik.touched[name] && Boolean(formik.errors[name])}
    helperText={formik.touched[name] && formik.errors[name]}
    disabled={disabled || loading}
    multiline={multiline}
    rows={rows}
    {...props}
  />
);

TextInputField.propTypes = textInputFieldPropTypes;

const WorkExperienceField = ({ formik, index, exp, onRemove, loading }) => (
  <Grid container spacing={3} sx={{ mb: 2, alignItems: "flex-start" }}>
    <Grid item size={{ xs: 12, md: 3 }}>
      <TextInputField
        formik={formik}
        name={`workExperiences[${index}].organizationName`}
        label="Organization Name"
        loading={loading}
      />
    </Grid>
    <Grid item size={{ xs: 12, md: 2 }}>
      <TextInputField
        formik={formik}
        name={`workExperiences[${index}].designation`}
        label="Designation"
        loading={loading}
      />
    </Grid>
    <Grid item size={{ xs: 12, md: 3 }}>
      <TextInputField
        formik={formik}
        name={`workExperiences[${index}].year`}
        label="Number of Years"
        type="number"
        loading={loading}
      />
    </Grid>
    <Grid item size={{ xs: 12, md: 3 }}>
      <TextInputField
        formik={formik}
        name={`workExperiences[${index}].responsibility`}
        label="Responsibility"
        multiline
        rows={2}
        loading={loading}
      />
    </Grid>
    <Grid
      item
      size={{ xs: 12, md: 1 }}
      sx={{ display: "flex", alignItems: "center", pt: 1 }}
    >
      {index > 0 && (
        <IconButton
          color="error"
          onClick={() => onRemove(index)}
          disabled={loading}
        >
          <RemoveCircleOutlineIcon />
        </IconButton>
      )}
    </Grid>
  </Grid>
);

WorkExperienceField.propTypes = workExperienceFieldPropTypes;

// ==================== MAIN COMPONENT ====================
const AssessorAccreditorQMSAuditorRenewal = () => {
  const { serviceId } = useParams();
  const [serviceName, setServiceName] = useState("");
  const [hasCitizenId, setHasCitizenId] = useState("yes");
  const [loading, setLoading] = useState(false);
  const formikRef = useRef();
  const navigate = useNavigate();

  const dropdownData = useDropdownData();
  const applicant = useRenewalApplicant(serviceId);

  // Fetch service name
  useEffect(() => {
    const fetchServiceName = async () => {
      try {
        const response = await CommonService.getServiceName(serviceId);
        setServiceName(response.data.serviceName);
      } catch (error) {
        console.error("Error fetching service name:", error);
      }
    };
    if (serviceId) fetchServiceName();
  }, [serviceId]);

  // Fetch dropdown data on mount
  useEffect(() => {
    dropdownData.fetchDropdownData();
  }, []);

  // Handle sector change
  const handleSectorChange = useCallback(
    (e, formik) => {
      const sectorId = e.target.value;
      dropdownData.handleSectorChange(sectorId, formik);
    },
    [dropdownData],
  );

  // Handle Citizen ID change
  const handleCitizenIdChange = useCallback(
    (e, formik) => {
      const value = e.target.value;
      formik.setFieldValue("citizenId", value);
      if (value) formik.setFieldValue("referenceNo", "");
      if (value && value.length === 11) {
        applicant.fetchApplicantDetails(value, null, formik);
      }
    },
    [applicant],
  );

  // Handle Reference No change
  const handleReferenceNoChange = useCallback(
    (e, formik) => {
      const value = e.target.value;
      formik.setFieldValue("referenceNo", value);
      if (value) formik.setFieldValue("citizenId", "");
      if (value && value.length >= 3) {
        applicant.fetchApplicantDetails(null, value, formik);
      }
    },
    [applicant],
  );

  // Reset form
  const handleReset = useCallback(
    (formik) => {
      formik.resetForm();
      dropdownData.setSelectedSectorId("");
      setHasCitizenId("yes");
      applicant.resetApplicantDetails();
    },
    [dropdownData, applicant],
  );

  // Handle Has Citizen ID toggle
  const handleHasCitizenIdChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setHasCitizenId(newValue);
      applicant.resetApplicantDetails();
      dropdownData.setSelectedSectorId("");

      if (formikRef.current) {
        const initialValues = getInitialValues(serviceId);
        formikRef.current.resetForm({ values: initialValues });
        formikRef.current.setTouched({});
        formikRef.current.setErrors({});
        formikRef.current.setFieldValue("documents", []);
      }
    },
    [serviceId, applicant],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (values, { resetForm, setSubmitting }) => {
      setLoading(true);
      try {
        const documents = await Promise.all(
          values.documents.map((file) => fileToBase64(file)),
        );

        const submitData = { ...values, documents };
        if (hasCitizenId === "yes") delete submitData.referenceNo;
        else delete submitData.citizenId;

        // Ensure numeric fields are properly formatted
        const numericFields = [
          "genderId",
          "dzongkhagId",
          "sectorId",
          "occupationId",
          "certificationLevelId",
          "yearsOfExperience",
        ];
        numericFields.forEach((field) => {
          if (submitData[field]) submitData[field] = Number(submitData[field]);
        });

        if (submitData.workExperiences) {
          submitData.workExperiences = submitData.workExperiences.map(
            (exp) => ({
              ...exp,
              year: exp.year ? Number(exp.year) : null,
            }),
          );
        }

        const response =
          await AssessorAccreditorQMSAuditorService.registerAssessorAccreditorQMSAuditor(
            submitData,
          );

        if (response.status === 201 || response.status === 200) {
          toast.success(`${serviceName} submitted successfully!`);
          resetForm();
          dropdownData.setSelectedSectorId("");
          setHasCitizenId("yes");
          applicant.resetApplicantDetails();
          navigate("/");
        }
      } catch (error) {
        console.error("Submission error:", error);
        toast.error(error.message || "Submission failed");
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    [hasCitizenId, serviceName, navigate, dropdownData, applicant],
  );

  // Render service-specific sections
  const renderServiceSpecificSection = useCallback(
    (formik) => {
      if (serviceId === "32") {
        return (
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <SelectField
                formik={formik}
                name="sectorId"
                label="Sector"
                options={dropdownData.sectors}
                labelKey="sectorName"
                onChange={(e) => handleSectorChange(e, formik)}
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <SelectField
                formik={formik}
                name="occupationId"
                label="Occupation"
                options={dropdownData.occupations}
                labelKey="occupationName"
                disabled={!formik.values.sectorId}
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <SelectField
                formik={formik}
                name="certificationLevelId"
                label="Certification Level"
                options={dropdownData.certificationLevels}
                loading={loading}
              />
            </Grid>
          </Grid>
        );
      }

      if (serviceId === "5") {
        return (
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <SelectField
                formik={formik}
                name="sectorId"
                label="Sector"
                options={dropdownData.sectors}
                labelKey="sectorName"
                onChange={(e) => handleSectorChange(e, formik)}
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <SelectField
                formik={formik}
                name="occupationId"
                label="Occupation"
                options={dropdownData.occupations}
                labelKey="occupationName"
                disabled={!formik.values.sectorId}
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <SelectField
                formik={formik}
                name="certificationLevelId"
                label="Certification Level"
                options={dropdownData.certificationLevels}
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextInputField
                formik={formik}
                name="designation"
                label="Designation"
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextInputField
                formik={formik}
                name="yearsOfExperience"
                label="Number of Years"
                type="number"
                loading={loading}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextInputField
                formik={formik}
                name="responsibility"
                label="Responsibility"
                loading={loading}
              />
            </Grid>
          </Grid>
        );
      }

      if (serviceId === "3") {
        return (
          <>
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <SelectField
                  formik={formik}
                  name="qmsTraining"
                  label="QMS Auditor Training Attended"
                  options={[
                    { id: "Yes", name: "Yes" },
                    { id: "No", name: "No" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                  loading={loading}
                />
              </Grid>
            </Grid>
            {formik.values.qmsTraining === "Yes" && (
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item size={{ xs: 12 }}>
                  <TextInputField
                    formik={formik}
                    name="academicBackground"
                    label="Academic / Technical / Professional Background"
                    multiline
                    rows={4}
                    loading={loading}
                    placeholder="Please provide details of your academic qualifications, technical certifications, and professional background..."
                  />
                </Grid>
              </Grid>
            )}
          </>
        );
      }

      return null;
    },
    [serviceId, dropdownData, loading, handleSectorChange],
  );

  // Render work experiences for QMS Auditor
  const renderWorkExperiences = useCallback(
    (formik) => {
      if (serviceId !== "3") return null;

      return (
        <FormSection title="Registration Criteria: Relevant Work Experience (Minimum of 5 years)">
          <FieldArray
            name="workExperiences"
            render={(arrayHelpers) => (
              <>
                {formik.values.workExperiences?.map((exp, index) => (
                  <WorkExperienceField
                    key={index}
                    formik={formik}
                    index={index}
                    exp={exp}
                    onRemove={arrayHelpers.remove}
                    loading={loading}
                  />
                ))}
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() =>
                    arrayHelpers.push({
                      organizationName: "",
                      designation: "",
                      year: "",
                      responsibility: "",
                    })
                  }
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  Add More
                </Button>
              </>
            )}
          />
        </FormSection>
      );
    },
    [serviceId, loading],
  );

  return (
    <Box sx={{ m: { xs: 2, md: 2 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          width: "100%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              letterSpacing: 0.7,
              borderBottom: "2px solid #555",
              color: "#1a1a1a",
              display: "inline-block",
              fontFamily: "'Roboto', 'Arial', sans-serif",
              textTransform: "capitalize",
              transition: "color 0.3s ease, border-color 0.3s ease",
              "&:hover": {
                color: "#0d47a1",
                borderColor: "#0d47a1",
              },
            }}
          >
            {serviceName} Renewal
          </Typography>
        </Box>

        {/* Citizen ID Radio */}
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 500 }}>
              Do you have a Citizen ID Number?
            </FormLabel>
            <RadioGroup
              row
              value={hasCitizenId}
              onChange={handleHasCitizenIdChange}
              sx={{ mt: 1 }}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Registration Form */}
        <Formik
          innerRef={formikRef}
          initialValues={getInitialValues(serviceId)}
          validationSchema={(values) =>
            getValidationSchema(serviceId, hasCitizenId, values)
          }
          enableReinitialize={true}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <form onSubmit={formik.handleSubmit}>
              {/* Basic Information Section */}
              <FormSection title="Basic Information">
                <Grid container spacing={3}>
                  {hasCitizenId === "yes" ? (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextInputField
                        formik={formik}
                        name="citizenId"
                        label="Citizen ID Number"
                        loading={loading || applicant.fetchingDetails}
                        placeholder="Enter your Citizen ID Number"
                        onChange={(e) => handleCitizenIdChange(e, formik)}
                        slotProps={{
                          input: {
                            endAdornment: applicant.fetchingDetails && (
                              <CircularProgress size={20} />
                            ),
                          },
                        }}
                      />
                    </Grid>
                  ) : (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextInputField
                        formik={formik}
                        name="referenceNo"
                        label="Reference No"
                        loading={loading || applicant.fetchingDetails}
                        placeholder="Enter reference number"
                        onChange={(e) => handleReferenceNoChange(e, formik)}
                        slotProps={{
                          input: {
                            endAdornment: applicant.fetchingDetails && (
                              <CircularProgress size={20} />
                            ),
                          },
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextInputField
                      formik={formik}
                      name="fullName"
                      label="Full Name"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <SelectField
                      formik={formik}
                      name="genderId"
                      label="Gender"
                      options={dropdownData.genders}
                      loading={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextInputField
                      formik={formik}
                      name="mobileNo"
                      label="Mobile No"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextInputField
                      formik={formik}
                      name="email"
                      label="Email"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <SelectField
                      formik={formik}
                      name="dzongkhagId"
                      label="Location of Working Organization (Dzongkhag)"
                      options={dropdownData.dzongkhags}
                      labelKey="dzonkhagName"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextInputField
                      formik={formik}
                      name="organizationName"
                      label="Name of the Working Organization"
                      loading={loading}
                    />
                  </Grid>
                </Grid>
              </FormSection>

              {/* Service Specific Section */}
              {(serviceId === "32" || serviceId === "5") && (
                <FormSection
                  title={
                    serviceId === "32"
                      ? "Assessor Registration Criteria"
                      : "Accreditor Registration Criteria"
                  }
                >
                  {renderServiceSpecificSection(formik)}
                </FormSection>
              )}

              {/* QMS Auditor Sections */}
              {serviceId === "3" && (
                <>
                  <FormSection title="Registration Criteria">
                    {renderServiceSpecificSection(formik)}
                  </FormSection>
                  {renderWorkExperiences(formik)}
                </>
              )}

              {/* Supporting Documents */}
              <FormSection title="Supporting Documents">
                <Box
                  sx={{
                    p: 2,
                    border: "1px dashed #bdbdbd",
                    borderRadius: 2,
                    minHeight: 100,
                  }}
                >
                  <FileUpload
                    files={formik.values.documents}
                    onFilesChange={(files) =>
                      formik.setFieldValue("documents", files)
                    }
                    disabled={loading}
                  />
                </Box>
                {formik.touched.documents && formik.errors.documents && (
                  <Typography color="error" variant="caption">
                    {formik.errors.documents}
                  </Typography>
                )}
              </FormSection>

              {/* Form Actions */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} sx={{ color: "#fff" }} />
                    ) : (
                      <ArrowUpwardIcon />
                    )
                  }
                  sx={{
                    px: 3,
                    py: 0.5,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                  disabled={loading}
                >
                  Submit
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  color="error"
                  startIcon={<LockResetIcon />}
                  sx={{
                    px: 3,
                    py: 0.5,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                  onClick={() => handleReset(formik)}
                  disabled={loading}
                >
                  Reset
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
AssessorAccreditorQMSAuditorRenewal.propTypes = {};

export default AssessorAccreditorQMSAuditorRenewal;
