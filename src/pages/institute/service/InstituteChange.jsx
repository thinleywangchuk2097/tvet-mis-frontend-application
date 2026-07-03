import React, { useState, useEffect } from "react";
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
  alpha,
  useTheme,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Validation schema for the change request
const validationSchema = Yup.object({
  // Location fields
  dzongkhagId: Yup.string(),
  exactLocation: Yup.string(),

  // Name fields
  proposedInstituteName: Yup.string(),

  // Ownership fields
  ownershipTypeId: Yup.string(),
  otherOwnershipTypeId: Yup.string().when("ownershipTypeId", {
    is: (val) => val === "2",
    then: (schema) => schema.required("Please select the type of 'Others'"),
  }),
  registrationNo: Yup.string().when(
    ["ownershipTypeId", "otherOwnershipTypeId"],
    {
      is: (ownershipTypeId, otherOwnershipTypeId) =>
        ownershipTypeId === "1" ||
        (ownershipTypeId === "2" &&
          (otherOwnershipTypeId === "6" || otherOwnershipTypeId === "7")),
      then: (schema) => schema.required("Registration No is required"),
    },
  ),
  companyName: Yup.string().when(["ownershipTypeId", "otherOwnershipTypeId"], {
    is: (ownershipTypeId, otherOwnershipTypeId) =>
      ownershipTypeId === "1" ||
      (ownershipTypeId === "2" &&
        (otherOwnershipTypeId === "6" || otherOwnershipTypeId === "7")),
    then: (schema) => schema.required("Company Name is required"),
  }),
  otherName: Yup.string().when("otherOwnershipTypeId", {
    is: (val) => val === "5" || val === "8",
    then: (schema) => schema.required("Name is required"),
  }),
  otherAddress: Yup.string().when("otherOwnershipTypeId", {
    is: (val) => val === "5" || val === "8",
    then: (schema) => schema.required("Address is required"),
  }),
  promoterCitizenId: Yup.string().when("ownershipTypeId", {
    is: "4",
    then: (schema) =>
      schema
        .required("Promoter Citizen ID is required")
        .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
  }),
  promoterName: Yup.string().when("ownershipTypeId", {
    is: "4",
    then: (schema) => schema.required("Promoter Name is required"),
  }),

  reasonForChange: Yup.string()
    .required("Reason for change is required")
    .min(10, "Please provide a detailed reason (minimum 10 characters)"),
});

const InstituteChange = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [otherOwnershipTypes, setOtherOwnershipTypes] = useState([]);
  const [currentCentreData, setCurrentCentreData] = useState(null);
  const [loadingCentreData, setLoadingCentreData] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  // Assume we have a centre ID from params or props
  const centreId = "some-centre-id"; // Replace with actual ID from params/context

  // Helper function to convert file to base64
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

  useEffect(() => {
    fetchMasterData();
    fetchCurrentCentreData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [dzongkhagsRes, ownershipTypesRes, otherOwnershipTypesRes] =
        await Promise.all([
          CommonService.getAllDzongkhags(),
          CommonService.getByParentId(1),
          CommonService.getByParentId(2),
        ]);
      setDzongkhags(dzongkhagsRes.data);
      setOwnershipTypes(ownershipTypesRes.data);
      setOtherOwnershipTypes(otherOwnershipTypesRes.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load required data");
    }
  };

  const fetchCurrentCentreData = async () => {
    setLoadingCentreData(true);
    try {
      // Fetch current centre data from your API
      // const response = await SesCentreService.getCentreById(centreId);
      // setCurrentCentreData(response.data);

      // Mock data for demonstration
      setCurrentCentreData({
        instituteName: "Current Institute Name",
        dzongkhagId: "1",
        exactLocation: "Current Location",
        ownershipTypeId: "1",
        companyName: "Current Company Name",
        registrationNo: "REG123456",
        otherName: "",
        otherAddress: "",
        promoterCitizenId: "",
        promoterName: "",
      });
    } catch (error) {
      console.error("Error fetching centre data:", error);
      toast.error("Failed to load centre data");
    } finally {
      setLoadingCentreData(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      // Location fields
      dzongkhagId: "",
      exactLocation: "",
      // Name fields
      proposedInstituteName: "",
      // Ownership fields
      ownershipTypeId: "",
      otherOwnershipTypeId: "",
      registrationNo: "",
      companyName: "",
      otherName: "",
      otherAddress: "",
      promoterCitizenId: "",
      promoterName: "",
      // Supporting documents
      files: [],
      // Common field
      reasonForChange: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Convert files to base64 if any
        const documents =
          values.files.length > 0
            ? await Promise.all(values.files.map((file) => fileToBase64(file)))
            : [];

        // Prepare payload with only the fields that have changed
        const requestedChanges = {};

        // Check location changes
        if (
          values.dzongkhagId &&
          values.dzongkhagId !== currentCentreData?.dzongkhagId?.toString()
        ) {
          requestedChanges.dzongkhagId = parseInt(values.dzongkhagId);
        }
        if (
          values.exactLocation &&
          values.exactLocation !== currentCentreData?.exactLocation
        ) {
          requestedChanges.exactLocation = values.exactLocation;
        }

        // Check name change
        if (
          values.proposedInstituteName &&
          values.proposedInstituteName !== currentCentreData?.instituteName
        ) {
          requestedChanges.proposedInstituteName = values.proposedInstituteName;
        }

        // Check ownership changes
        if (
          values.ownershipTypeId &&
          values.ownershipTypeId !==
            currentCentreData?.ownershipTypeId?.toString()
        ) {
          requestedChanges.ownershipTypeId = values.ownershipTypeId || null;
          requestedChanges.otherOwnershipTypeId =
            values.otherOwnershipTypeId || null;
          requestedChanges.registrationNo = values.registrationNo || null;
          requestedChanges.companyName = values.companyName || null;
          requestedChanges.otherName = values.otherName || null;
          requestedChanges.otherAddress = values.otherAddress || null;
          requestedChanges.promoterCitizenId = values.promoterCitizenId || null;
          requestedChanges.promoterName = values.promoterName || null;
        }

        const payload = {
          centreId: centreId,
          reasonForChange: values.reasonForChange,
          requestedChanges: requestedChanges,
          documents: documents,
        };

        // Submit change request to API
        // await SesCentreService.submitChangeRequest(payload);

        console.log("Submitting change request:", payload);
        toast.success("Change request submitted successfully!");
        formik.resetForm();
        setActiveStep(0);
      } catch (error) {
        toast.error(error.message || "Failed to submit change request");
      } finally {
        setLoading(false);
      }
    },
  });

  const isOthersType = () => formik.values.ownershipTypeId === "2";
  const isAgencyOrOrganization = () => {
    const id = formik.values.otherOwnershipTypeId;
    return id === "5" || id === "8";
  };
  const isCooperativeOrGroup = () => {
    const id = formik.values.otherOwnershipTypeId;
    return id === "6" || id === "7";
  };

  // Check if any change has been made
  const hasChanges = () => {
    return (
      formik.values.dzongkhagId ||
      formik.values.exactLocation ||
      formik.values.proposedInstituteName ||
      formik.values.ownershipTypeId ||
      formik.values.files.length > 0
    );
  };

  const steps = ["Changes", "Documents", "Review & Submit"];

  const getChangeSummary = () => {
    const changes = [];
    if (formik.values.dzongkhagId || formik.values.exactLocation)
      changes.push("Location");
    if (formik.values.proposedInstituteName) changes.push("Name");
    if (formik.values.ownershipTypeId) changes.push("Ownership");
    return changes;
  };

  if (loadingCentreData) {
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
            Submit a request to change your centre's location, name, or
            ownership details
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Current Centre Information */}
        <Card sx={{ mb: 4, bgcolor: "#f5f5f5" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BusinessIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Current Institute Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Institute Name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentCentreData?.instituteName}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentCentreData?.exactLocation}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Ownership Type:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentCentreData?.companyName || "Individual"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <form onSubmit={formik.handleSubmit}>
          {activeStep === 0 && (
            <>
              {/* Location Change Section */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocationOnIcon color="info" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Change Location
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="New Dzongkhag"
                      name="dzongkhagId"
                      size="small"
                      value={formik.values.dzongkhagId}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.dzongkhagId &&
                        Boolean(formik.errors.dzongkhagId)
                      }
                      helperText={
                        formik.touched.dzongkhagId && formik.errors.dzongkhagId
                      }
                    >
                      <MenuItem value="">Select Dzongkhag</MenuItem>
                      {dzongkhags.map((dz) => (
                        <MenuItem key={dz.id} value={dz.id.toString()}>
                          {dz.dzonkhagName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="New Exact Location"
                      name="exactLocation"
                      size="small"
                      value={formik.values.exactLocation}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.exactLocation &&
                        Boolean(formik.errors.exactLocation)
                      }
                      helperText={
                        formik.touched.exactLocation &&
                        formik.errors.exactLocation
                      }
                      placeholder="Building name, village, etc."
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Name Change Section */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <DescriptionIcon color="success" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Change Name
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="New Institute Name"
                      name="proposedInstituteName"
                      size="small"
                      value={formik.values.proposedInstituteName}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.proposedInstituteName &&
                        Boolean(formik.errors.proposedInstituteName)
                      }
                      helperText={
                        formik.touched.proposedInstituteName &&
                        formik.errors.proposedInstituteName
                      }
                      placeholder="Enter new institute name"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Ownership Change Section */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PeopleIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Change Ownership
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="warning" sx={{ mb: 3 }}>
                  Changing ownership requires additional documentation. Please
                  upload supporting documents in the next step.
                </Alert>

                <Grid container spacing={3}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="New Ownership Type"
                      name="ownershipTypeId"
                      size="small"
                      value={formik.values.ownershipTypeId}
                      onChange={(e) => {
                        formik.handleChange(e);
                        formik.setFieldValue("otherOwnershipTypeId", "");
                        formik.setFieldValue("registrationNo", "");
                        formik.setFieldValue("companyName", "");
                      }}
                      error={
                        formik.touched.ownershipTypeId &&
                        Boolean(formik.errors.ownershipTypeId)
                      }
                      helperText={
                        formik.touched.ownershipTypeId &&
                        formik.errors.ownershipTypeId
                      }
                    >
                      <MenuItem value="">Select Ownership Type</MenuItem>
                      {ownershipTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Others sub-type */}
                  {isOthersType() && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Type of Others *"
                        name="otherOwnershipTypeId"
                        size="small"
                        value={formik.values.otherOwnershipTypeId}
                        onChange={(e) => {
                          formik.handleChange(e);
                          formik.setFieldValue("registrationNo", "");
                          formik.setFieldValue("companyName", "");
                        }}
                        error={
                          formik.touched.otherOwnershipTypeId &&
                          Boolean(formik.errors.otherOwnershipTypeId)
                        }
                        helperText={
                          formik.touched.otherOwnershipTypeId &&
                          formik.errors.otherOwnershipTypeId
                        }
                      >
                        <MenuItem value="">Select Type</MenuItem>
                        {otherOwnershipTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  {/* Company / Cooperative / Group fields */}
                  {((!isOthersType() &&
                    formik.values.ownershipTypeId === "1") ||
                    (isOthersType() && isCooperativeOrGroup())) && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Registration No *"
                          name="registrationNo"
                          size="small"
                          value={formik.values.registrationNo}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.registrationNo &&
                            Boolean(formik.errors.registrationNo)
                          }
                          helperText={
                            formik.touched.registrationNo &&
                            formik.errors.registrationNo
                          }
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Company/Organization Name *"
                          name="companyName"
                          size="small"
                          value={formik.values.companyName}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.companyName &&
                            Boolean(formik.errors.companyName)
                          }
                          helperText={
                            formik.touched.companyName &&
                            formik.errors.companyName
                          }
                        />
                      </Grid>
                    </>
                  )}

                  {/* Agency / Organization fields */}
                  {isOthersType() && isAgencyOrOrganization() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Name *"
                          name="otherName"
                          size="small"
                          value={formik.values.otherName}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.otherName &&
                            Boolean(formik.errors.otherName)
                          }
                          helperText={
                            formik.touched.otherName && formik.errors.otherName
                          }
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Address *"
                          name="otherAddress"
                          size="small"
                          value={formik.values.otherAddress}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.otherAddress &&
                            Boolean(formik.errors.otherAddress)
                          }
                          helperText={
                            formik.touched.otherAddress &&
                            formik.errors.otherAddress
                          }
                        />
                      </Grid>
                    </>
                  )}

                  {/* Sole Proprietorship fields */}
                  {formik.values.ownershipTypeId === "4" && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Promoter Citizen ID *"
                          name="promoterCitizenId"
                          size="small"
                          value={formik.values.promoterCitizenId}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.promoterCitizenId &&
                            Boolean(formik.errors.promoterCitizenId)
                          }
                          helperText={
                            formik.touched.promoterCitizenId &&
                            formik.errors.promoterCitizenId
                          }
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Promoter Name *"
                          name="promoterName"
                          size="small"
                          value={formik.values.promoterName}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.promoterName &&
                            Boolean(formik.errors.promoterName)
                          }
                          helperText={
                            formik.touched.promoterName &&
                            formik.errors.promoterName
                          }
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>

              {/* Reason for Change */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Reason for Change <span style={{ color: "red" }}>*</span>
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Reason for Change *"
                  name="reasonForChange"
                  size="small"
                  value={formik.values.reasonForChange}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.reasonForChange &&
                    Boolean(formik.errors.reasonForChange)
                  }
                  helperText={
                    formik.touched.reasonForChange &&
                    formik.errors.reasonForChange
                  }
                  placeholder="Please provide a detailed explanation for requesting this change..."
                />
              </Paper>
            </>
          )}

          {activeStep === 1 && (
            <>
              {/* Supporting Documents */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AttachFileIcon color="primary" fontSize="small" />
                  <Typography fontWeight={600}>Supporting Documents</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Alert severity="info" sx={{ mb: 3 }}>
                  Please upload relevant documents supporting your change
                  request (e.g., ownership transfer documents, location proof,
                  etc.)
                </Alert>
                <FileUpload
                  files={formik.values.files}
                  onFilesChange={(files) =>
                    formik.setFieldValue("files", files)
                  }
                />
              </Paper>
            </>
          )}

          {activeStep === 2 && (
            <>
              {/* Review Summary */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Review Your Request
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Changes Requested:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {getChangeSummary().map((change) => (
                        <Chip
                          key={change}
                          label={change}
                          color="primary"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {formik.values.proposedInstituteName && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        New Institute Name:
                      </Typography>
                      <Typography variant="body1">
                        {formik.values.proposedInstituteName}
                      </Typography>
                    </Grid>
                  )}

                  {(formik.values.dzongkhagId ||
                    formik.values.exactLocation) && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        New Location:
                      </Typography>
                      <Typography variant="body1">
                        {formik.values.dzongkhagId &&
                          dzongkhags.find(
                            (d) =>
                              d.id.toString() === formik.values.dzongkhagId,
                          )?.dzonkhagName}{" "}
                        {formik.values.exactLocation}
                      </Typography>
                    </Grid>
                  )}

                  {formik.values.ownershipTypeId && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        New Ownership:
                      </Typography>
                      <Typography variant="body1">
                        {formik.values.companyName ||
                          formik.values.otherName ||
                          formik.values.promoterName}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item size={{ xs: 12 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Reason for Change:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                      <Typography variant="body2">
                        {formik.values.reasonForChange}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Supporting Documents:
                    </Typography>
                    <Typography variant="body2">
                      {formik.values.files.length} file(s) attached
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
            }}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={() => setActiveStep((prev) => prev - 1)}
              disabled={activeStep === 0}
              sx={{ textTransform: "none" }}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => formik.resetForm()}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SaveIcon />
                }
                disabled={
                  loading || !hasChanges() || !formik.values.reasonForChange
                }
                sx={{ textTransform: "none" }}
              >
                Submit Request
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                onClick={() => setActiveStep((prev) => prev + 1)}
                disabled={
                  activeStep === 0 &&
                  (!hasChanges() || !formik.values.reasonForChange)
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
