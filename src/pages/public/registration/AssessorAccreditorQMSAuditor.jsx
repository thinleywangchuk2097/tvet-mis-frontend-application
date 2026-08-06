// AssessorAccreditorQMSAuditor.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
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
  Checkbox,
} from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUpload";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CommonService from "../../../api/services/internal/common/CommonService";
import AssessorAccreditorQMSAuditorService from "../../../api/services/internal/registration/AssessorAccreditorQMSAuditorService";
import DatahubService from "../../../api/services/external/datahub/DatahubService";
import { useNavigate } from "react-router-dom";

// Helper function to convert file to Base64
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

// Service configuration
const SERVICE_CONFIGS = {
  // Assessor
  32: {
    formSections: ["basic", "assessorCriteria", "documents", "declaration"],
    getValidationSchema: (hasCitizenId) => {
      const base = getBaseValidation(hasCitizenId);
      return Yup.object({
        ...base,
        sectorId: Yup.number().required("Sector is required"),
        occupationId: Yup.number().required("Occupation is required"),
        certificationLevelId: Yup.number().required(
          "Certification Level is required",
        ),
      });
    },
  },
  // Accreditor
  5: {
    formSections: ["basic", "accreditorCriteria", "documents", "declaration"],
    getValidationSchema: (hasCitizenId) => {
      const base = getBaseValidation(hasCitizenId);
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
    },
  },
  // QMS Auditor
  3: {
    formSections: ["basic", "qmsAuditorCriteria", "documents", "declaration"],
    getValidationSchema: (hasCitizenId, values = {}) => {
      const base = getBaseValidation(hasCitizenId);
      const schema = {
        ...base,
        qmsTraining: Yup.string().required(
          "Please specify if QMS training attended",
        ),
        workExperiences: Yup.array()
          .of(
            Yup.object({
              organizationName: Yup.string().required(
                "Organization Name required",
              ),
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
    },
  },
};

// Base validation schema
const getBaseValidation = (hasCitizenId) => {
  const base = {
    fullName: Yup.string().required("Full Name is required"),
    genderId: Yup.number().required("Gender is required"),
    mobileNo: Yup.string()
      .required("Mobile No is required")
      .matches(
        /^\d{8}$/,
        "Mobile No must be exactly 8 digits and contain only numbers",
      ),
    email: Yup.string().email("Invalid email").required("Email is required"),
    dzongkhagId: Yup.number().required("Dzongkhag is required"),
    organizationName: Yup.string().required("Organization Name is required"),
    documents: Yup.array().min(1, "Please upload at least one file"),
    declarationAccepted: Yup.boolean().oneOf(
      [true],
      "You must accept the declaration to submit",
    ),
  };

  if (hasCitizenId === "yes") {
    base.citizenId = Yup.string()
      .matches(/^[0-9]{11}$/, "Invalid CID number (11 digits required)")
      .required("Citizen ID Number is required");
  } else {
    base.referenceNo = Yup.string().required("Reference No is required");
  }

  return base;
};

// Get initial values based on service
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
    declarationAccepted: false,
  };

  switch (serviceId) {
    case "32": // Assessor
      return {
        ...baseValues,
        sectorId: "",
        occupationId: "",
        certificationLevelId: "",
      };
    case "5": // Accreditor
      return {
        ...baseValues,
        sectorId: "",
        occupationId: "",
        certificationLevelId: "",
        designation: "",
        yearsOfExperience: "",
        responsibility: "",
      };
    case "3": // QMS Auditor
      return {
        ...baseValues,
        qmsTraining: "",
        academicBackground: "",
        workExperiences: [
          {
            organizationName: "",
            designation: "",
            year: "",
            responsibility: "",
          },
        ],
      };
    default:
      return baseValues;
  }
};

const AssessorAccreditorQMSAuditor = () => {
  const { serviceId } = useParams();
  const [serviceName, setServiceName] = useState("");
  const [hasCitizenId, setHasCitizenId] = useState("yes");
  const [loading, setLoading] = useState(false);
  const [fetchingCitizen, setFetchingCitizen] = useState(false);
  const formikRef = useRef();

  // State for dropdown data
  const [dropdownData, setDropdownData] = useState({
    sectors: [],
    dzongkhags: [],
    certificationLevels: [],
    genders: [],
    occupations: [],
  });
  const [declaration, setDeclaration] = useState([]);
  const navigate = useNavigate();

  // Fetch all dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [sectors, dzongkhags, certifications, genders, declarationData] =
          await Promise.all([
            CommonService.getAllSectors(),
            CommonService.getAllDzongkhags(),
            CommonService.getByParentId(10),
            CommonService.getByParentId(8),
            CommonService.getByParentId(30),
          ]);

        setDropdownData({
          sectors: sectors.data || [],
          dzongkhags: dzongkhags.data || [],
          certificationLevels: certifications.data || [],
          genders: genders.data || [],
          occupations: [],
        });
        setDeclaration(declarationData.data || []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
    fetchServiceName();
  }, [serviceId]);

  // Fetch occupations when sector changes
  useEffect(() => {
    if (
      dropdownData.selectedSectorId &&
      (serviceId === "32" || serviceId === "5")
    ) {
      fetchOccupationsBySector(dropdownData.selectedSectorId);
    }
  }, [dropdownData.selectedSectorId, serviceId]);

  const fetchServiceName = async () => {
    try {
      const response = await CommonService.getServiceName(serviceId);
      setServiceName(response.data.serviceName);
    } catch (error) {
      console.error("Error fetching service name:", error);
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    try {
      const response = await CommonService.getOccupationsBySectorId(sectorId);
      setDropdownData((prev) => ({
        ...prev,
        occupations: response.data || [],
      }));
    } catch (error) {
      console.error("Error fetching occupations:", error);
    }
  };

  const fetchAndFillCitizenDetails = async (cid, formik) => {
    if (!cid || cid.length !== 11) {
      toast.warning("Please enter a valid 11-digit CID");
      return;
    }

    setFetchingCitizen(true);
    try {
      const response = await DatahubService.getDetailsByCitizenshipNo(cid);
      if (response.data?.citizenDetailsResponse?.citizenDetail?.[0]) {
        const citizen = response.data.citizenDetailsResponse.citizenDetail[0];
        const genderMap = { M: "Male", F: "Female" };
        const genderOption = dropdownData.genders.find(
          (opt) => opt.name === (genderMap[citizen.gender] || "Others"),
        );

        const fullName =
          `${citizen.firstName || ""} ${citizen.lastName || ""}`.trim();

        formik.setFieldValue("fullName", fullName);
        formik.setFieldValue("genderId", genderOption?.id || "");

        toast.success(`Citizen details fetched successfully for ${fullName}`);
      } else {
        toast.warning("No citizen details found for this CID");
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error(
        "Failed to fetch citizen details. Please check the CID number.",
      );
    } finally {
      setFetchingCitizen(false);
    }
  };

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      const documents = await Promise.all(
        values.documents.map((file) => fileToBase64(file)),
      );

      const submitData = {
        ...values,
        documents,
        ...(hasCitizenId === "yes" ? {} : { referenceNo: values.referenceNo }),
        ...(hasCitizenId === "yes" ? { citizenId: values.citizenId } : {}),
      };

      // Clean up and convert numeric fields
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
        submitData.workExperiences = submitData.workExperiences.map((exp) => ({
          ...exp,
          year: exp.year ? Number(exp.year) : null,
        }));
      }

      // Remove the field that is not needed based on selection
      if (hasCitizenId === "yes") {
        delete submitData.referenceNo;
      } else {
        delete submitData.citizenId;
      }

      console.log("Payload being sent:", submitData);

      const response =
        await AssessorAccreditorQMSAuditorService.registerAssessorAccreditorQMSAuditor(
          submitData,
        );

      if (response.status === 201 || response.status === 200) {
        toast.success(`${serviceName} submitted successfully!`);
        resetForm();
        setDropdownData((prev) => ({ ...prev, selectedSectorId: "" }));
        setHasCitizenId("yes");
        navigate("/");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Submission failed");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Render Basic Information Section
  const renderBasicInfoSection = (formik) => (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Basic Information
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {hasCitizenId === "yes" ? (
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label={requiredLabel("Citizen ID Number")}
              name="citizenId"
              size="small"
              value={formik.values.citizenId || ""}
              onChange={formik.handleChange}
              onBlur={(e) => {
                formik.handleBlur(e);
                if (e.target.value?.length === 11) {
                  fetchAndFillCitizenDetails(e.target.value, formik);
                }
              }}
              error={
                formik.touched.citizenId && Boolean(formik.errors.citizenId)
              }
              helperText={formik.touched.citizenId && formik.errors.citizenId}
              disabled={loading}
              placeholder="Enter your Citizen ID Number"
              InputProps={{
                endAdornment: fetchingCitizen && <CircularProgress size={20} />,
              }}
            />
          </Grid>
        ) : (
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label={requiredLabel("Reference No")}
              name="referenceNo"
              size="small"
              value={formik.values.referenceNo || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.referenceNo && Boolean(formik.errors.referenceNo)
              }
              helperText={
                formik.touched.referenceNo && formik.errors.referenceNo
              }
              disabled={loading}
              placeholder="Enter reference number"
            />
          </Grid>
        )}

        {[
          {
            name: "fullName",
            label: "Full Name",
            readOnly:
              hasCitizenId === "yes" && formik.values.citizenId?.length === 11,
          },
          { name: "mobileNo", label: "Mobile No", type: "text", maxLength: 8 },
          { name: "email", label: "Email" },
          {
            name: "organizationName",
            label: "Name of the Working Organization",
          },
        ].map((field) => (
          <Grid item size={{ xs: 12, md: 4 }} key={field.name}>
            <TextField
              fullWidth
              label={requiredLabel(field.label)}
              name={field.name}
              size="small"
              type={field.type || "text"}
              value={formik.values[field.name] || ""}
              onChange={(e) => {
                if (field.name === "mobileNo") {
                  const value = e.target.value.replace(/\D/g, "");
                  formik.setFieldValue("mobileNo", value);
                } else {
                  formik.handleChange(e);
                }
              }}
              onBlur={formik.handleBlur}
              error={
                formik.touched[field.name] && Boolean(formik.errors[field.name])
              }
              helperText={
                formik.touched[field.name] && formik.errors[field.name]
              }
              disabled={loading}
              InputProps={{
                readOnly: field.readOnly || false,
                sx: {
                  backgroundColor: field.readOnly
                    ? (theme) => theme.palette.action.hover
                    : "transparent",
                },
              }}
              inputProps={
                field.maxLength
                  ? {
                      maxLength: field.maxLength,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                    }
                  : {}
              }
            />
          </Grid>
        ))}

        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label={requiredLabel("Gender")}
            name="genderId"
            size="small"
            value={formik.values.genderId || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.genderId && Boolean(formik.errors.genderId)}
            helperText={formik.touched.genderId && formik.errors.genderId}
            disabled={
              hasCitizenId === "yes" && formik.values.citizenId?.length === 11
            }
          >
            <MenuItem value="">Select</MenuItem>
            {dropdownData.genders.map((gender) => (
              <MenuItem key={gender.id} value={gender.id}>
                {gender.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label={requiredLabel(
              "Location of Working Organization (Dzongkhag)",
            )}
            name="dzongkhagId"
            size="small"
            value={formik.values.dzongkhagId || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.dzongkhagId && Boolean(formik.errors.dzongkhagId)
            }
            helperText={formik.touched.dzongkhagId && formik.errors.dzongkhagId}
            disabled={loading}
          >
            <MenuItem value="">Select</MenuItem>
            {dropdownData.dzongkhags.map((dz) => (
              <MenuItem key={dz.id} value={dz.id}>
                {dz.dzonkhagName || dz.dzongkhagName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  );

  // Render Sector/Occupation/Certification fields (used by Assessor and Accreditor)
  const renderSectorFields = (formik, additionalFields = []) => (
    <>
      <Grid item size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          label={requiredLabel("Sector")}
          name="sectorId"
          size="small"
          value={formik.values.sectorId || ""}
          onChange={(e) => {
            const sectorId = e.target.value;
            formik.handleChange(e);
            setDropdownData((prev) => ({
              ...prev,
              selectedSectorId: sectorId,
            }));
            formik.setFieldValue("occupationId", "");
          }}
          onBlur={formik.handleBlur}
          error={formik.touched.sectorId && Boolean(formik.errors.sectorId)}
          helperText={formik.touched.sectorId && formik.errors.sectorId}
          disabled={loading}
        >
          <MenuItem value="">Select</MenuItem>
          {dropdownData.sectors.map((sec) => (
            <MenuItem key={sec.id} value={sec.id}>
              {sec.sectorName}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          label={requiredLabel("Occupation")}
          name="occupationId"
          size="small"
          value={formik.values.occupationId || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.occupationId && Boolean(formik.errors.occupationId)
          }
          helperText={formik.touched.occupationId && formik.errors.occupationId}
          disabled={loading || !formik.values.sectorId}
        >
          <MenuItem value="">Select</MenuItem>
          {dropdownData.occupations.map((occ) => (
            <MenuItem key={occ.id} value={occ.id}>
              {occ.occupationName}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          label={requiredLabel("Certification Level")}
          name="certificationLevelId"
          size="small"
          value={formik.values.certificationLevelId || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.certificationLevelId &&
            Boolean(formik.errors.certificationLevelId)
          }
          helperText={
            formik.touched.certificationLevelId &&
            formik.errors.certificationLevelId
          }
          disabled={loading}
        >
          <MenuItem value="">Select</MenuItem>
          {dropdownData.certificationLevels.map((lvl) => (
            <MenuItem key={lvl.id} value={lvl.id}>
              {lvl.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {additionalFields.map((field) => (
        <Grid item size={{ xs: 12, md: 4 }} key={field.name}>
          <TextField
            fullWidth
            label={requiredLabel(field.label)}
            name={field.name}
            size="small"
            type={field.type || "text"}
            value={formik.values[field.name] || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched[field.name] && Boolean(formik.errors[field.name])
            }
            helperText={formik.touched[field.name] && formik.errors[field.name]}
            disabled={loading}
          />
        </Grid>
      ))}
    </>
  );

  // Render Assessor Criteria Section
  const renderAssessorSection = (formik) => (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Assessor Registration Criteria
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {renderSectorFields(formik)}
      </Grid>
    </Paper>
  );

  // Render Accreditor Criteria Section
  const renderAccreditorSection = (formik) => (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Accreditor Registration Criteria
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {renderSectorFields(formik, [
          { name: "designation", label: "Designation" },
          {
            name: "yearsOfExperience",
            label: "Number of Years",
            type: "number",
          },
          { name: "responsibility", label: "Responsibility" },
        ])}
      </Grid>
    </Paper>
  );

  // Render QMS Auditor Criteria Section
  const renderQMSAuditorSection = (formik) => (
    <>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 4,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Registration Criteria
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label={requiredLabel("QMS Auditor Training Attended")}
              name="qmsTraining"
              size="small"
              value={formik.values.qmsTraining || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.qmsTraining && Boolean(formik.errors.qmsTraining)
              }
              helperText={
                formik.touched.qmsTraining && formik.errors.qmsTraining
              }
              disabled={loading}
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {formik.values.qmsTraining === "Yes" && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={requiredLabel(
                  "Academic / Technical / Professional Background",
                )}
                name="academicBackground"
                size="small"
                value={formik.values.academicBackground || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.academicBackground &&
                  Boolean(formik.errors.academicBackground)
                }
                helperText={
                  formik.touched.academicBackground &&
                  formik.errors.academicBackground
                }
                disabled={loading}
                placeholder="Please provide details of your academic qualifications, technical certifications, and professional background..."
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 4,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Registration Criteria: Relevant Work Experience (Minimum of 5 years)
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <FieldArray
          name="workExperiences"
          render={(arrayHelpers) => (
            <>
              {formik.values.workExperiences?.map((exp, index) => (
                <Grid
                  container
                  spacing={3}
                  key={index}
                  sx={{ mb: 2, alignItems: "flex-start" }}
                >
                  {[
                    {
                      name: "organizationName",
                      label: "Organization Name",
                      size: 3,
                    },
                    { name: "designation", label: "Designation", size: 2 },
                    {
                      name: "year",
                      label: "Number of Years",
                      size: 3,
                      type: "number",
                    },
                    {
                      name: "responsibility",
                      label: "Responsibility",
                      size: 3,
                      multiline: true,
                      rows: 2,
                    },
                  ].map((field) => (
                    <Grid
                      item
                      size={{ xs: 12, md: field.size }}
                      key={field.name}
                    >
                      <TextField
                        fullWidth
                        label={requiredLabel(field.label)}
                        name={`workExperiences[${index}].${field.name}`}
                        size="small"
                        type={field.type || "text"}
                        multiline={field.multiline || false}
                        rows={field.rows || 1}
                        value={exp[field.name] || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.workExperiences?.[index]?.[
                            field.name
                          ] &&
                          Boolean(
                            formik.errors.workExperiences?.[index]?.[
                              field.name
                            ],
                          )
                        }
                        helperText={
                          formik.touched.workExperiences?.[index]?.[
                            field.name
                          ] &&
                          formik.errors.workExperiences?.[index]?.[field.name]
                        }
                        disabled={loading}
                      />
                    </Grid>
                  ))}
                  <Grid
                    item
                    size={{ xs: 12, md: 1 }}
                    sx={{ display: "flex", alignItems: "center", pt: 1 }}
                  >
                    {index > 0 && (
                      <IconButton
                        color="error"
                        onClick={() => arrayHelpers.remove(index)}
                        disabled={loading}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
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
      </Paper>
    </>
  );

  // Render Documents Section
  const renderDocumentsSection = (formik) => (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Supporting Documents
      </Typography>
      <Divider sx={{ mb: 3 }} />
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
          onFilesChange={(files) => formik.setFieldValue("documents", files)}
          disabled={loading}
        />
      </Box>
      {formik.touched.documents && formik.errors.documents && (
        <Typography color="error" variant="caption">
          {formik.errors.documents}
        </Typography>
      )}
    </Paper>
  );

  // Render Declaration Section
  const renderDeclarationSection = (formik) => (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        {requiredLabel("Declaration")}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              name="declarationAccepted"
              checked={formik.values.declarationAccepted || false}
              onChange={(e) =>
                formik.setFieldValue("declarationAccepted", e.target.checked)
              }
              onBlur={formik.handleBlur}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              {declaration.length > 0
                ? declaration[0].name
                : "I hereby declare that the information provided is true and accurate to the best of my knowledge. I understand that any false information may result in appropriate action."}
            </Typography>
          }
        />
      </Box>

      {formik.touched.declarationAccepted &&
        formik.errors.declarationAccepted && (
          <Typography
            color="error"
            variant="caption"
            sx={{ mt: 1, display: "block" }}
          >
            {formik.errors.declarationAccepted}
          </Typography>
        )}
    </Paper>
  );

  // Determine which sections to render based on service
  const renderSections = (formik) => {
    const sections = {
      basic: renderBasicInfoSection,
      assessorCriteria: renderAssessorSection,
      accreditorCriteria: renderAccreditorSection,
      qmsAuditorCriteria: renderQMSAuditorSection,
      documents: renderDocumentsSection,
      declaration: renderDeclarationSection,
    };

    let sectionKeys = ["basic", "documents", "declaration"];

    if (serviceId === "32") sectionKeys.splice(1, 0, "assessorCriteria");
    else if (serviceId === "5") sectionKeys.splice(1, 0, "accreditorCriteria");
    else if (serviceId === "3") sectionKeys.splice(1, 0, "qmsAuditorCriteria");

    return sectionKeys.map((key) => (
      <div key={key}>{sections[key](formik)}</div>
    ));
  };

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
            {serviceName} Form
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 500 }}>
              Do you have a Citizen ID Number?
            </FormLabel>
            <RadioGroup
              row
              value={hasCitizenId}
              onChange={(e) => setHasCitizenId(e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Formik
          innerRef={formikRef}
          initialValues={getInitialValues(serviceId)}
          validationSchema={(values) => {
            const config = SERVICE_CONFIGS[serviceId];
            if (config?.getValidationSchema) {
              return config.getValidationSchema(hasCitizenId, values);
            }
            return Yup.object(getBaseValidation(hasCitizenId));
          }}
          enableReinitialize={true}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <form onSubmit={formik.handleSubmit}>
              {renderSections(formik)}

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
                  disabled={loading || !formik.values.declarationAccepted}
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
                  onClick={() => {
                    formik.resetForm();
                    setDropdownData((prev) => ({
                      ...prev,
                      selectedSectorId: "",
                    }));
                    setHasCitizenId("yes");
                  }}
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

export default AssessorAccreditorQMSAuditor;
