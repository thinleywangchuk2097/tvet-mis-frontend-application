import { useState, useEffect } from "react";
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
} from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import FileUplaod from "../../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CommonService from "../../../api/services/CommonService";
import AssessorAccreditorQMSAuditorService from "../../../api/services/AssessorAccreditorQMSAuditorService";
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

const AssessorAccreditorQMSAuditor = () => {
  const { serviceId } = useParams();
  const [serviceName, setServiceName] = useState("");
  const [hasCitizenId, setHasCitizenId] = useState("no");
  const [loading, setLoading] = useState(false);

  // State for dropdown data
  const [sectors, setSectors] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [genders, setGenders] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchServiceName();
  }, [serviceId]);

  useEffect(() => {
    if (hasCitizenId === "yes") {
      window.location.href = "/auth/login-ndi-qrcode";
    }
  }, [hasCitizenId]);

  useEffect(() => {
    fetchSectors();
    fetchDzongkhags();
    fetchCertificationLevels();
    fetchGenders();
  }, []);

  // Fetch occupations when sector changes
  useEffect(() => {
    if (selectedSectorId && (serviceId === "32" || serviceId === "5")) {
      fetchOccupationsBySector(selectedSectorId);
    }
  }, [selectedSectorId, serviceId]);

  const fetchServiceName = async () => {
    try {
      const response = await CommonService.getServiceName(serviceId);
      setServiceName(response.data.serviceName);
    } catch (error) {
      console.error("Error fetching service name:", error);
    }
  };

  const fetchSectors = async () => {
    try {
      const sectorDtls = await CommonService.getAllSectors();
      setSectors(sectorDtls.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchCertificationLevels = async () => {
    try {
      const certifications = await CommonService.getByParentId(10);
      setCertificationLevels(certifications.data);
    } catch (error) {
      console.error("Error fetching certification levels:", error);
    }
  };

  const fetchGenders = async () => {
    try {
      const genderDt = await CommonService.getByParentId(8);
      setGenders(genderDt.data);
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    try {
      const occupationLists =
        await CommonService.getOccupationsBySectorId(sectorId);
      setOccupations(occupationLists.data);
    } catch (error) {
      console.error("Error fetching occupations:", error);
    }
  };

  // Dynamic validation schema based on serviceId
  const getValidationSchema = () => {
    const baseSchema = {
      referenceNo: Yup.string(),
      fullName: Yup.string().required("Full Name is required"),
      genderId: Yup.number().required("Gender is required"),
      mobileNo: Yup.string().required("Mobile No is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      dzongkhagId: Yup.number().required("Dzongkhag is required"),
      organizationName: Yup.string().required("Organization Name is required"),
      documents: Yup.array().min(1, "Please upload at least one file"),
    };

    // Service 32: Assessor
    if (serviceId === "32") {
      return Yup.object({
        ...baseSchema,
        sectorId: Yup.number().required("Sector is required"),
        occupationId: Yup.number().required("Occupation is required"),
        certificationLevelId: Yup.number().required(
          "Certification Level is required",
        ),
      });
    }

    // Service 5: Accreditor
    if (serviceId === "5") {
      return Yup.object({
        ...baseSchema,
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
    }

    // Service 3: QMS Auditor
    if (serviceId === "3") {
      const schema = {
        ...baseSchema,
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

      // Add conditional validation for academic background
      return Yup.object(schema).when("qmsTraining", {
        is: "Yes",
        then: Yup.object({
          ...schema,
          academicBackground: Yup.string().required(
            "Academic / Technical / Professional Background is required when QMS training is Yes",
          ),
        }),
      });
    }

    return Yup.object(baseSchema);
  };

  // Dynamic initial values based on serviceId
  const getInitialValues = () => {
    const baseValues = {
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

    if (serviceId === "32") {
      return {
        ...baseValues,
        sectorId: "",
        occupationId: "",
        certificationLevelId: "",
      };
    }

    if (serviceId === "5") {
      return {
        ...baseValues,
        sectorId: "",
        occupationId: "",
        certificationLevelId: "",
        designation: "",
        yearsOfExperience: "",
        responsibility: "",
      };
    }

    if (serviceId === "3") {
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
    }

    return baseValues;
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
      // Convert documents to Base64 format
      const documents = await Promise.all(
        values.documents.map((file) => fileToBase64(file)),
      );

      const submitData = { ...values };

      // Replace documents with converted ones
      submitData.documents = documents;

      // Ensure numeric fields are properly formatted
      if (submitData.genderId)
        submitData.genderId = Number(submitData.genderId);
      if (submitData.dzongkhagId)
        submitData.dzongkhagId = Number(submitData.dzongkhagId);
      if (submitData.sectorId)
        submitData.sectorId = Number(submitData.sectorId);
      if (submitData.occupationId)
        submitData.occupationId = Number(submitData.occupationId);
      if (submitData.certificationLevelId)
        submitData.certificationLevelId = Number(
          submitData.certificationLevelId,
        );
      if (submitData.yearsOfExperience)
        submitData.yearsOfExperience = Number(submitData.yearsOfExperience);

      // For work experiences, ensure year is a number
      if (submitData.workExperiences) {
        submitData.workExperiences = submitData.workExperiences.map((exp) => ({
          ...exp,
          year: exp.year ? Number(exp.year) : null,
        }));
      }

      console.log("Payload being sent:", submitData); // For debugging

      const response =
        await AssessorAccreditorQMSAuditorService.registerAssessorAccreditorQMSAuditor(
          submitData,
        );
      console.log("response", response);
      if (response.status === 201 || response.status === 200) {
        toast.success(`${serviceName} submitted successfully!`);
        resetForm();
        setSelectedSectorId("");
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
            {serviceName} Form
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
              onChange={(e) => setHasCitizenId(e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Registration Form - Only show if Citizen ID is "No" */}
        {hasCitizenId === "no" && (
          <Formik
            initialValues={getInitialValues()}
            validationSchema={getValidationSchema()}
            enableReinitialize={true}
            onSubmit={handleSubmit}
          >
            {(formik) => (
              <form onSubmit={formik.handleSubmit}>
                {/* Section: Basic Info */}
                <Paper
                  sx={{
                    p: { xs: 2, md: 3 },
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Reference No"
                        name="referenceNo"
                        size="small"
                        value={formik.values.referenceNo || ""}
                        onChange={formik.handleChange}
                        disabled={loading}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Full Name")}
                        name="fullName"
                        size="small"
                        value={formik.values.fullName || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.fullName &&
                          Boolean(formik.errors.fullName)
                        }
                        helperText={
                          formik.touched.fullName && formik.errors.fullName
                        }
                        disabled={loading}
                      />
                    </Grid>

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
                        error={
                          formik.touched.genderId &&
                          Boolean(formik.errors.genderId)
                        }
                        helperText={
                          formik.touched.genderId && formik.errors.genderId
                        }
                        disabled={loading}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {genders.map((gender) => (
                          <MenuItem key={gender.id} value={gender.id}>
                            {gender.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Mobile No")}
                        name="mobileNo"
                        size="small"
                        value={formik.values.mobileNo || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.mobileNo &&
                          Boolean(formik.errors.mobileNo)
                        }
                        helperText={
                          formik.touched.mobileNo && formik.errors.mobileNo
                        }
                        disabled={loading}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel("Email")}
                        name="email"
                        size="small"
                        value={formik.values.email || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.email && Boolean(formik.errors.email)
                        }
                        helperText={formik.touched.email && formik.errors.email}
                        disabled={loading}
                      />
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
                          formik.touched.dzongkhagId &&
                          Boolean(formik.errors.dzongkhagId)
                        }
                        helperText={
                          formik.touched.dzongkhagId &&
                          formik.errors.dzongkhagId
                        }
                        disabled={loading}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {dzongkhags.map((dz) => (
                          <MenuItem key={dz.id} value={dz.id}>
                            {dz.dzonkhagName || dz.dzongkhagName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={requiredLabel(
                          "Name of the Working Organization",
                        )}
                        name="organizationName"
                        size="small"
                        value={formik.values.organizationName || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.organizationName &&
                          Boolean(formik.errors.organizationName)
                        }
                        helperText={
                          formik.touched.organizationName &&
                          formik.errors.organizationName
                        }
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Section: Assessor Criteria (Service 32) */}
                {serviceId === "32" && (
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      mb: 4,
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      Assessor Registration Criteria
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
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
                            setSelectedSectorId(sectorId);
                            // Reset occupation when sector changes
                            formik.setFieldValue("occupationId", "");
                          }}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.sectorId &&
                            Boolean(formik.errors.sectorId)
                          }
                          helperText={
                            formik.touched.sectorId && formik.errors.sectorId
                          }
                          disabled={loading}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {sectors.map((sec) => (
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
                            formik.touched.occupationId &&
                            Boolean(formik.errors.occupationId)
                          }
                          helperText={
                            formik.touched.occupationId &&
                            formik.errors.occupationId
                          }
                          disabled={loading || !formik.values.sectorId}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {occupations.map((occ) => (
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
                          {certificationLevels.map((lvl) => (
                            <MenuItem key={lvl.id} value={lvl.id}>
                              {lvl.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Section: Accreditor Criteria (Service 5) */}
                {serviceId === "5" && (
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      mb: 4,
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      Accreditor Registration Criteria
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
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
                            setSelectedSectorId(sectorId);
                            formik.setFieldValue("occupationId", "");
                          }}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.sectorId &&
                            Boolean(formik.errors.sectorId)
                          }
                          helperText={
                            formik.touched.sectorId && formik.errors.sectorId
                          }
                          disabled={loading}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {sectors.map((sec) => (
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
                            formik.touched.occupationId &&
                            Boolean(formik.errors.occupationId)
                          }
                          helperText={
                            formik.touched.occupationId &&
                            formik.errors.occupationId
                          }
                          disabled={loading || !formik.values.sectorId}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {occupations.map((occ) => (
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
                          {certificationLevels.map((lvl) => (
                            <MenuItem key={lvl.id} value={lvl.id}>
                              {lvl.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={requiredLabel("Designation")}
                          name="designation"
                          size="small"
                          value={formik.values.designation || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.designation &&
                            Boolean(formik.errors.designation)
                          }
                          helperText={
                            formik.touched.designation &&
                            formik.errors.designation
                          }
                          disabled={loading}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={requiredLabel("Number of Years")}
                          name="yearsOfExperience"
                          size="small"
                          type="number"
                          value={formik.values.yearsOfExperience || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.yearsOfExperience &&
                            Boolean(formik.errors.yearsOfExperience)
                          }
                          helperText={
                            formik.touched.yearsOfExperience &&
                            formik.errors.yearsOfExperience
                          }
                          disabled={loading}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={requiredLabel("Responsibility")}
                          name="responsibility"
                          size="small"
                          value={formik.values.responsibility || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.responsibility &&
                            Boolean(formik.errors.responsibility)
                          }
                          helperText={
                            formik.touched.responsibility &&
                            formik.errors.responsibility
                          }
                          disabled={loading}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Section: QMS Auditor Criteria (Service 3) */}
                {serviceId === "3" && (
                  <>
                    <Paper
                      sx={{
                        p: { xs: 2, md: 3 },
                        mb: 4,
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Registration Criteria
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={3}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label={requiredLabel(
                              "QMS Auditor Training Attended",
                            )}
                            name="qmsTraining"
                            size="small"
                            value={formik.values.qmsTraining || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.qmsTraining &&
                              Boolean(formik.errors.qmsTraining)
                            }
                            helperText={
                              formik.touched.qmsTraining &&
                              formik.errors.qmsTraining
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

                    {/* Work Experience - Dynamic with FieldArray */}
                    <Paper
                      sx={{
                        p: { xs: 2, md: 3 },
                        mb: 4,
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Registration Criteria: Relevant Work Experience (Minimum
                        of 5 years)
                      </Typography>
                      <Divider sx={{ mb: 3 }} />

                      <FieldArray
                        name="workExperiences"
                        render={(arrayHelpers) => (
                          <>
                            {formik.values.workExperiences &&
                              formik.values.workExperiences.map(
                                (exp, index) => (
                                  <Grid
                                    container
                                    spacing={3}
                                    key={index}
                                    sx={{ mb: 2, alignItems: "flex-start" }}
                                  >
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <TextField
                                        fullWidth
                                        label={requiredLabel(
                                          "Organization Name",
                                        )}
                                        name={`workExperiences[${index}].organizationName`}
                                        size="small"
                                        value={exp.organizationName || ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.organizationName &&
                                          Boolean(
                                            formik.errors.workExperiences?.[
                                              index
                                            ]?.organizationName,
                                          )
                                        }
                                        helperText={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.organizationName &&
                                          formik.errors.workExperiences?.[index]
                                            ?.organizationName
                                        }
                                        disabled={loading}
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 2 }}>
                                      <TextField
                                        fullWidth
                                        label={requiredLabel("Designation")}
                                        name={`workExperiences[${index}].designation`}
                                        size="small"
                                        value={exp.designation || ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.designation &&
                                          Boolean(
                                            formik.errors.workExperiences?.[
                                              index
                                            ]?.designation,
                                          )
                                        }
                                        helperText={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.designation &&
                                          formik.errors.workExperiences?.[index]
                                            ?.designation
                                        }
                                        disabled={loading}
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <TextField
                                        fullWidth
                                        type="number"
                                        label={requiredLabel("Number of Years")}
                                        name={`workExperiences[${index}].year`}
                                        size="small"
                                        value={exp.year || ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.year &&
                                          Boolean(
                                            formik.errors.workExperiences?.[
                                              index
                                            ]?.year,
                                          )
                                        }
                                        helperText={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.year &&
                                          formik.errors.workExperiences?.[index]
                                            ?.year
                                        }
                                        disabled={loading}
                                      />
                                    </Grid>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                      <TextField
                                        fullWidth
                                        rows={2}
                                        label={requiredLabel("Responsibility")}
                                        name={`workExperiences[${index}].responsibility`}
                                        size="small"
                                        value={exp.responsibility || ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.responsibility &&
                                          Boolean(
                                            formik.errors.workExperiences?.[
                                              index
                                            ]?.responsibility,
                                          )
                                        }
                                        helperText={
                                          formik.touched.workExperiences &&
                                          formik.touched.workExperiences[index]
                                            ?.responsibility &&
                                          formik.errors.workExperiences?.[index]
                                            ?.responsibility
                                        }
                                        disabled={loading}
                                      />
                                    </Grid>
                                    <Grid
                                      item
                                      size={{ xs: 12, md: 1 }}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        pt: 1,
                                      }}
                                    >
                                      {index > 0 && (
                                        <IconButton
                                          color="error"
                                          onClick={() =>
                                            arrayHelpers.remove(index)
                                          }
                                          disabled={loading}
                                        >
                                          <RemoveCircleOutlineIcon />
                                        </IconButton>
                                      )}
                                    </Grid>
                                  </Grid>
                                ),
                              )}

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
                )}

                {/* Section: Supporting Documents */}
                <Paper
                  sx={{
                    p: { xs: 2, md: 3 },
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
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
                    <FileUplaod
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
                </Paper>

                {/* Form Actions */}
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
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
                    onClick={() => {
                      formik.resetForm();
                      setSelectedSectorId("");
                    }}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        )}
      </Paper>
    </Box>
  );
};

export default AssessorAccreditorQMSAuditor;
