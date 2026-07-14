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
  IconButton,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
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

// Validation schema for the change request
const validationSchema = Yup.object({
  // Location fields
  dzongkhag_id: Yup.string(),
  exact_location: Yup.string(),

  // Name fields
  proposed_institute_name: Yup.string(),

  // Ownership fields
  ownership_type_id: Yup.string(),
  other_ownership_type_id: Yup.string().when("ownership_type_id", {
    is: (val) => val === "2",
    then: (schema) => schema.required("Please select the type of 'Others'"),
  }),
  registration_no: Yup.string().when(
    ["ownership_type_id", "other_ownership_type_id"],
    {
      is: (ownershipTypeId, otherOwnershipTypeId) =>
        ownershipTypeId === "1" ||
        (ownershipTypeId === "2" &&
          (otherOwnershipTypeId === "6" || otherOwnershipTypeId === "7")),
      then: (schema) => schema.required("Registration No is required"),
    },
  ),
  company_name: Yup.string().when(["ownership_type_id", "other_ownership_type_id"], {
    is: (ownershipTypeId, otherOwnershipTypeId) =>
      ownershipTypeId === "1" ||
      (ownershipTypeId === "2" &&
        (otherOwnershipTypeId === "6" || otherOwnershipTypeId === "7")),
    then: (schema) => schema.required("Company Name is required"),
  }),
  other_name: Yup.string().when("other_ownership_type_id", {
    is: (val) => val === "5" || val === "8",
    then: (schema) => schema.required("Name is required"),
  }),
  other_address: Yup.string().when("other_ownership_type_id", {
    is: (val) => val === "5" || val === "8",
    then: (schema) => schema.required("Address is required"),
  }),
  promoter_citizen_id: Yup.string().when("ownership_type_id", {
    is: "4",
    then: (schema) =>
      schema
        .required("Promoter Citizen ID is required")
        .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
  }),
  promoter_name: Yup.string().when("ownership_type_id", {
    is: "4",
    then: (schema) => schema.required("Promoter Name is required"),
  }),
  // Partners validation
  partners: Yup.array().of(
    Yup.object().shape({
      typeOfOwnerId: Yup.string().required("Type of Owner is required"),
      partnerCidNo: Yup.string().when("typeOfOwnerId", {
        is: "22", // ID for Individual
        then: (schema) =>
          schema
            .required("Citizen ID is required")
            .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
      }),
      partnerName: Yup.string().when("typeOfOwnerId", {
        is: "22", // ID for Individual
        then: (schema) => schema.required("Partner Name is required"),
      }),
      partnerCompanyRegistrationNo: Yup.string().when("typeOfOwnerId", {
        is: "23", // ID for Company
        then: (schema) =>
          schema.required("Partner Company Registration No is required"),
      }),
      partnerCompanyName: Yup.string().when("typeOfOwnerId", {
        is: "23", // ID for Company
        then: (schema) => schema.required("Partner Company Name is required"),
      }),
    }),
  ),

  reasonForChange: Yup.string()
    .required("Reason for change is required")
    .min(10, "Please provide a detailed reason (minimum 10 characters)"),
});

const InstituteChange = () => {
  const [loading, setLoading] = useState(false);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [otherOwnershipTypes, setOtherOwnershipTypes] = useState([]);
  const [typeOfOwners, setTypeOfOwners] = useState([]);
  const [currentInstituteData, setCurrentInstituteData] = useState(null);
  const [loadingInstituteData, setLoadingInstituteData] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingCitizen, setFetchingCitizen] = useState(false);

  const registration_no = useSelector((state) => state.auth.userId);
  const [instituteDetails, setInstituteDetails] = useState(null);

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

  // Function to fetch and auto-fill promoter details
  const fetchAndFillPromoterDetails = async (cid, formik) => {
    if (!cid || cid.length !== 11) {
      toast.warning("Please enter a valid 11-digit CID");
      return;
    }

    setFetchingCitizen(true);
    try {
      const response = await DatahubService.getDetailsByCitizenshipNo(cid);
      if (response.data?.citizenDetailsResponse?.citizenDetail?.[0]) {
        const citizen = response.data.citizenDetailsResponse.citizenDetail[0];
        const fullName =
          `${citizen.firstName || ""} ${citizen.lastName || ""}`.trim();

        formik.setFieldValue("promoter_name", fullName);
        toast.success(`Citizen details fetched successfully for ${fullName}`);
      } else {
        toast.warning("No citizen details found for this CID");
        formik.setFieldValue("promoter_name", "");
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error(
        "Failed to fetch citizen details. Please check the CID number.",
      );
      formik.setFieldValue("promoter_name", "");
    } finally {
      setFetchingCitizen(false);
    }
  };

  // Function to fetch and auto-fill partner details
  const fetchAndFillPartnerDetails = async (cid, formik, index) => {
    if (!cid || cid.length !== 11) {
      toast.warning("Please enter a valid 11-digit CID");
      return;
    }

    setFetchingCitizen(true);
    try {
      const response = await DatahubService.getDetailsByCitizenshipNo(cid);
      if (response.data?.citizenDetailsResponse?.citizenDetail?.[0]) {
        const citizen = response.data.citizenDetailsResponse.citizenDetail[0];
        const fullName =
          `${citizen.firstName || ""} ${citizen.lastName || ""}`.trim();

        formik.setFieldValue(`partners[${index}].partnerName`, fullName);
        toast.success(`Citizen details fetched successfully for ${fullName}`);
      } else {
        toast.warning("No citizen details found for this CID");
        formik.setFieldValue(`partners[${index}].partnerName`, "");
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error(
        "Failed to fetch citizen details. Please check the CID number.",
      );
      formik.setFieldValue(`partners[${index}].partnerName`, "");
    } finally {
      setFetchingCitizen(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchInstituteDetails();
  }, []);

  const fetchInstituteDetails = async () => {
    setLoadingInstituteData(true);
    try {
      const response =
        await InstituteRegistrationService.getInstituteChangeDetails(
          registration_no,
        );
      console.log("Institute Details Response:", response.data);

      // Handle the response data - it's an array with the institute data
      const instituteData = Array.isArray(response.data) && response.data.length > 0
        ? response.data[0]
        : response.data;

      console.log("Parsed Institute Data:", instituteData);

      if (instituteData) {
        setInstituteDetails(instituteData);
        setCurrentInstituteData({
          // Direct mapping from API response fields
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
          partners: instituteData.partnerships ? JSON.parse(instituteData.partnerships) : [],
        });
      }
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to load institute details");
    } finally {
      setLoadingInstituteData(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [
        dzongkhagsRes,
        ownershipTypesRes,
        otherOwnershipTypesRes,
        typeOfOwnersRes,
      ] = await Promise.all([
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(1), // Ownership types
        CommonService.getByParentId(2), // Other ownership sub-types
        CommonService.getByParentId(6), // Type of owners for partnership
      ]);
      setDzongkhags(dzongkhagsRes.data);
      setOwnershipTypes(ownershipTypesRes.data);
      setOtherOwnershipTypes(otherOwnershipTypesRes.data);
      setTypeOfOwners(typeOfOwnersRes.data);

      console.log("Ownership Types loaded:", ownershipTypesRes.data);
      console.log("Other Ownership Types loaded:", otherOwnershipTypesRes.data);
      console.log("Type of Owners loaded:", typeOfOwnersRes.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load required data");
    }
  };

  const formik = useFormik({
    initialValues: {
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
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const documents =
          values.files.length > 0
            ? await Promise.all(values.files.map((file) => fileToBase64(file)))
            : [];

        const requestedChanges = {};

        // Location changes
        if (
          values.dzongkhag_id &&
          values.dzongkhag_id !== currentInstituteData?.dzongkhag_id?.toString()
        ) {
          requestedChanges.dzongkhag_id = values.dzongkhag_id;
        }
        if (
          values.exact_location &&
          values.exact_location !== currentInstituteData?.exact_location
        ) {
          requestedChanges.exact_location = values.exact_location;
        }

        // Name changes
        if (
          values.proposed_institute_name &&
          values.proposed_institute_name !== currentInstituteData?.instituteName
        ) {
          requestedChanges.proposed_institute_name = values.proposed_institute_name;
        }

        // Ownership changes
        if (
          values.ownership_type_id &&
          values.ownership_type_id !==
            currentInstituteData?.ownership_type_id?.toString()
        ) {
          requestedChanges.ownership_type_id = values.ownership_type_id;
          requestedChanges.other_ownership_type_id = values.other_ownership_type_id || null;
          requestedChanges.registration_no = values.registration_no || null;
          requestedChanges.company_name = values.company_name || null;
          requestedChanges.other_name = values.other_name || null;
          requestedChanges.other_address = values.other_address || null;
          requestedChanges.promoter_citizen_id = values.promoter_citizen_id || null;
          requestedChanges.promoter_name = values.promoter_name || null;
          
          // Format partners to match backend structure
          if (values.partners.length > 0) {
            requestedChanges.partnerships = JSON.stringify(
              values.partners.map(partner => ({
                typeOfOwnerId: partner.typeOfOwnerId,
                partnerCidNo: partner.partnerCidNo || "",
                partnerName: partner.partnerName || "",
                partnerCompanyRegistrationNo: partner.partnerCompanyRegistrationNo || "",
                partnerCompanyName: partner.partnerCompanyName || "",
              }))
            );
          }
        }

        if (Object.keys(requestedChanges).length === 0) {
          toast.warning(
            "No changes detected. Please make at least one change.",
          );
          setSubmitting(false);
          return;
        }

        const payload = {
          instituteId: instituteDetails?.id || instituteDetails?.institute_id,
          registrationNo: registration_no,
          reasonForChange: values.reasonForChange,
          requestedChanges: requestedChanges,
          documents: documents,
        };

        console.log("Submitting change request:", payload);

        // API call would go here
        // await InstituteRegistrationService.submitChangeRequest(payload);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success("Change request submitted successfully!");
        formik.resetForm();
        setActiveStep(0);
        await fetchInstituteDetails();
      } catch (error) {
        console.error("Submission error:", error);
        toast.error(error.message || "Failed to submit change request");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Helper functions
  const isOthersType = () => formik.values.ownership_type_id === "2";
  
  const isAgencyOrOrganization = () => {
    const id = formik.values.other_ownership_type_id;
    return id === "5" || id === "8";
  };

  const isCooperativeOrGroup = () => {
    const id = formik.values.other_ownership_type_id;
    return id === "6" || id === "7";
  };

  const isSoleProprietorship = () => formik.values.ownership_type_id === "4";
  
  const isCompany = () => formik.values.ownership_type_id === "1";
  
  const isPartnership = () => formik.values.ownership_type_id === "3";

  const hasChanges = () => {
    return (
      formik.values.dzongkhag_id ||
      formik.values.exact_location ||
      formik.values.proposed_institute_name ||
      formik.values.ownership_type_id ||
      formik.values.files.length > 0 ||
      formik.values.partners.length > 0
    );
  };

  const steps = ["Changes", "Documents", "Review & Submit"];

  const getChangeSummary = () => {
    const changes = [];
    if (formik.values.dzongkhag_id || formik.values.exact_location)
      changes.push("Location");
    if (formik.values.proposed_institute_name) changes.push("Name");
    if (formik.values.ownership_type_id) changes.push("Ownership");
    if (formik.values.partners.length > 0) changes.push("Partners");
    return changes;
  };

  const getOwnershipTypeName = (id) => {
    if (!id) return "";
    const type = ownershipTypes.find((t) => t.id === parseInt(id));
    if (type) return type.name;
    const otherType = otherOwnershipTypes.find((t) => t.id === parseInt(id));
    if (otherType) return otherType.name;
    return id || "N/A";
  };

  const getDzongkhagName = (id) => {
    if (!id) return "";
    const dzongkhag = dzongkhags.find((d) => d.id === parseInt(id));
    return dzongkhag?.dzonkhagName || id || "N/A";
  };

  const getTypeOfOwnerName = (id) => {
    if (!id) return "";
    const type = typeOfOwners.find((t) => t.id === parseInt(id));
    return type?.name || id || "N/A";
  };

  if (loadingInstituteData) {
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
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Current Institute Information */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BusinessIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Current Institute Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Application No:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {instituteDetails?.application_no || "N/A"}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Institute Name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentInstituteData?.instituteName || "N/A"}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Dzongkhag:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getDzongkhagName(currentInstituteData?.dzongkhag_id) || "N/A"}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Exact Location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentInstituteData?.exact_location || "N/A"}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Ownership Type:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getOwnershipTypeName(
                    currentInstituteData?.ownership_type_id,
                  ) || "N/A"}
                </Typography>
              </Grid>
              {currentInstituteData?.ownership_type_id === "1" && (
                <>
                  <Grid item size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      Registration No:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {currentInstituteData?.registration_no || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      Company Name:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {currentInstituteData?.company_name || "N/A"}
                    </Typography>
                  </Grid>
                </>
              )}
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Status:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {instituteDetails?.status_id === "57" ? "Active" : "Pending"}
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
                <Alert severity="info" sx={{ mb: 2 }}>
                  Current Location:{" "}
                  {getDzongkhagName(currentInstituteData?.dzongkhag_id)} -{" "}
                  {currentInstituteData?.exact_location || "N/A"}
                </Alert>
                <Grid container spacing={3}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="New Dzongkhag"
                      name="dzongkhag_id"
                      size="small"
                      value={formik.values.dzongkhag_id}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.dzongkhag_id &&
                        Boolean(formik.errors.dzongkhag_id)
                      }
                      helperText={
                        formik.touched.dzongkhag_id && formik.errors.dzongkhag_id
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
                      name="exact_location"
                      size="small"
                      value={formik.values.exact_location}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.exact_location &&
                        Boolean(formik.errors.exact_location)
                      }
                      helperText={
                        formik.touched.exact_location &&
                        formik.errors.exact_location
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
                <Alert severity="info" sx={{ mb: 2 }}>
                  Current Name: {currentInstituteData?.instituteName || "N/A"}
                </Alert>
                <Grid container spacing={3}>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="New Institute Name"
                      name="proposed_institute_name"
                      size="small"
                      value={formik.values.proposed_institute_name}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.proposed_institute_name &&
                        Boolean(formik.errors.proposed_institute_name)
                      }
                      helperText={
                        formik.touched.proposed_institute_name &&
                        formik.errors.proposed_institute_name
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

                <Alert severity="info" sx={{ mb: 2 }}>
                  Current Ownership:{" "}
                  {getOwnershipTypeName(
                    currentInstituteData?.ownership_type_id,
                  ) || "N/A"}
                  {currentInstituteData?.ownership_type_id === "1" && (
                    <span>
                      {" "}
                      (Registration: {currentInstituteData?.registration_no}, 
                      Company: {currentInstituteData?.company_name})
                    </span>
                  )}
                </Alert>

                <Alert severity="warning" sx={{ mb: 3 }}>
                  Changing ownership requires additional documentation. Please
                  upload supporting documents in the next step.
                </Alert>

                <Grid container spacing={3}>
                  {/* Main Ownership Type Dropdown */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="New Ownership Type"
                      name="ownership_type_id"
                      size="small"
                      value={formik.values.ownership_type_id}
                      onChange={(e) => {
                        formik.handleChange(e);
                        // Reset sub-fields when ownership type changes
                        formik.setFieldValue("other_ownership_type_id", "");
                        formik.setFieldValue("registration_no", "");
                        formik.setFieldValue("company_name", "");
                        formik.setFieldValue("other_name", "");
                        formik.setFieldValue("other_address", "");
                        formik.setFieldValue("promoter_citizen_id", "");
                        formik.setFieldValue("promoter_name", "");
                        formik.setFieldValue("partners", []);
                      }}
                      error={
                        formik.touched.ownership_type_id &&
                        Boolean(formik.errors.ownership_type_id)
                      }
                      helperText={
                        formik.touched.ownership_type_id &&
                        formik.errors.ownership_type_id
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

                  {/* Others sub-type - only shown when "Others" is selected */}
                  {isOthersType() && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Type of Others *"
                        name="other_ownership_type_id"
                        size="small"
                        value={formik.values.other_ownership_type_id}
                        onChange={(e) => {
                          formik.handleChange(e);
                          formik.setFieldValue("registration_no", "");
                          formik.setFieldValue("company_name", "");
                          formik.setFieldValue("other_name", "");
                          formik.setFieldValue("other_address", "");
                        }}
                        error={
                          formik.touched.other_ownership_type_id &&
                          Boolean(formik.errors.other_ownership_type_id)
                        }
                        helperText={
                          formik.touched.other_ownership_type_id &&
                          formik.errors.other_ownership_type_id
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

                  {/* Company Fields - for Company type (ID: 1) */}
                  {isCompany() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Registration No *"
                          name="registration_no"
                          size="small"
                          value={formik.values.registration_no}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.registration_no &&
                            Boolean(formik.errors.registration_no)
                          }
                          helperText={
                            formik.touched.registration_no &&
                            formik.errors.registration_no
                          }
                          placeholder="Enter registration number"
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Company Name *"
                          name="company_name"
                          size="small"
                          value={formik.values.company_name}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.company_name &&
                            Boolean(formik.errors.company_name)
                          }
                          helperText={
                            formik.touched.company_name &&
                            formik.errors.company_name
                          }
                          placeholder="Enter company name"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Cooperative/Group Fields - for Others sub-types (IDs: 6, 7) */}
                  {isOthersType() && isCooperativeOrGroup() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Registration No *"
                          name="registration_no"
                          size="small"
                          value={formik.values.registration_no}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.registration_no &&
                            Boolean(formik.errors.registration_no)
                          }
                          helperText={
                            formik.touched.registration_no &&
                            formik.errors.registration_no
                          }
                          placeholder="Enter registration number"
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Organization Name *"
                          name="company_name"
                          size="small"
                          value={formik.values.company_name}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.company_name &&
                            Boolean(formik.errors.company_name)
                          }
                          helperText={
                            formik.touched.company_name &&
                            formik.errors.company_name
                          }
                          placeholder="Enter organization name"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Agency/Organization Fields - for Others sub-types (IDs: 5, 8) */}
                  {isOthersType() && isAgencyOrOrganization() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Name *"
                          name="other_name"
                          size="small"
                          value={formik.values.other_name}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.other_name &&
                            Boolean(formik.errors.other_name)
                          }
                          helperText={
                            formik.touched.other_name && formik.errors.other_name
                          }
                          placeholder="Enter name"
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Address *"
                          name="other_address"
                          size="small"
                          value={formik.values.other_address}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.other_address &&
                            Boolean(formik.errors.other_address)
                          }
                          helperText={
                            formik.touched.other_address &&
                            formik.errors.other_address
                          }
                          placeholder="Enter address"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Sole Proprietorship Fields */}
                  {isSoleProprietorship() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Promoter Citizen ID *"
                          name="promoter_citizen_id"
                          size="small"
                          value={formik.values.promoter_citizen_id}
                          onChange={formik.handleChange}
                          onBlur={(e) => {
                            formik.handleBlur(e);
                            if (
                              e.target.value &&
                              e.target.value.length === 11
                            ) {
                              fetchAndFillPromoterDetails(
                                e.target.value,
                                formik,
                              );
                            }
                          }}
                          error={
                            formik.touched.promoter_citizen_id &&
                            Boolean(formik.errors.promoter_citizen_id)
                          }
                          helperText={
                            formik.touched.promoter_citizen_id &&
                            formik.errors.promoter_citizen_id
                          }
                          InputProps={{
                            endAdornment: fetchingCitizen && (
                              <CircularProgress size={20} />
                            ),
                          }}
                          placeholder="Enter 11-digit CID"
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Promoter Name *"
                          name="promoter_name"
                          size="small"
                          value={formik.values.promoter_name}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.promoter_name &&
                            Boolean(formik.errors.promoter_name)
                          }
                          helperText={
                            formik.touched.promoter_name &&
                            formik.errors.promoter_name
                          }
                          InputProps={{
                            readOnly: true,
                            sx: {
                              backgroundColor: formik.values.promoter_name
                                ? (theme) => theme.palette.action.hover
                                : "transparent",
                            },
                          }}
                          placeholder="Auto-fetched from CID"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Partnership Section */}
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
                          <Box
                            key={index}
                            sx={{
                              width: "100%",
                              mb: 2,
                              p: 2,
                              border: "1px solid #e0e0e0",
                              borderRadius: 2,
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              {/* Type of Owner */}
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <TextField
                                  select
                                  fullWidth
                                  size="small"
                                  label="Type of Owner *"
                                  name={`partners[${index}].typeOfOwnerId`}
                                  value={partner.typeOfOwnerId}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.partners &&
                                    Boolean(
                                      formik.errors.partners?.[index]
                                        ?.typeOfOwnerId,
                                    )
                                  }
                                  helperText={
                                    formik.touched.partners &&
                                    formik.errors.partners?.[index]?.typeOfOwnerId
                                  }
                                >
                                  <MenuItem value="">Select Type</MenuItem>
                                  {typeOfOwners.map((type) => (
                                    <MenuItem
                                      key={type.id}
                                      value={type.id.toString()}
                                    >
                                      {type.name}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>

                              {/* Individual Partner */}
                              {partner.typeOfOwnerId === "22" && (
                                <>
                                  <Grid item size={{ xs: 12, md: 3 }}>
                                    <TextField
                                      fullWidth
                                      label="Partner Citizen ID No *"
                                      name={`partners[${index}].partnerCidNo`}
                                      size="small"
                                      value={partner.partnerCidNo}
                                      onChange={formik.handleChange}
                                      onBlur={(e) => {
                                        formik.handleBlur(e);
                                        if (
                                          e.target.value &&
                                          e.target.value.length === 11
                                        ) {
                                          fetchAndFillPartnerDetails(
                                            e.target.value,
                                            formik,
                                            index,
                                          );
                                        }
                                      }}
                                      error={
                                        formik.touched.partners &&
                                        Boolean(
                                          formik.errors.partners?.[index]
                                            ?.partnerCidNo,
                                        )
                                      }
                                      helperText={
                                        formik.touched.partners &&
                                        formik.errors.partners?.[index]
                                          ?.partnerCidNo
                                      }
                                      InputProps={{
                                        endAdornment: fetchingCitizen && (
                                          <CircularProgress size={20} />
                                        ),
                                      }}
                                      placeholder="Enter 11-digit CID"
                                    />
                                  </Grid>
                                  <Grid item size={{ xs: 12, md: 3 }}>
                                    <TextField
                                      fullWidth
                                      label="Partner Name *"
                                      name={`partners[${index}].partnerName`}
                                      size="small"
                                      value={partner.partnerName}
                                      onChange={formik.handleChange}
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.partners &&
                                        Boolean(
                                          formik.errors.partners?.[index]
                                            ?.partnerName,
                                        )
                                      }
                                      helperText={
                                        formik.touched.partners &&
                                        formik.errors.partners?.[index]
                                          ?.partnerName
                                      }
                                      InputProps={{
                                        readOnly: true,
                                        sx: {
                                          backgroundColor: partner.partnerName
                                            ? (theme) =>
                                                theme.palette.action.hover
                                            : "transparent",
                                        },
                                      }}
                                      placeholder="Auto-fetched from CID"
                                    />
                                  </Grid>
                                </>
                              )}

                              {/* Company Partner */}
                              {partner.typeOfOwnerId === "23" && (
                                <>
                                  <Grid item size={{ xs: 12, md: 3 }}>
                                    <TextField
                                      fullWidth
                                      label="Partner Company Registration No *"
                                      name={`partners[${index}].partnerCompanyRegistrationNo`}
                                      size="small"
                                      value={partner.partnerCompanyRegistrationNo}
                                      onChange={formik.handleChange}
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.partners &&
                                        Boolean(
                                          formik.errors.partners?.[index]
                                            ?.partnerCompanyRegistrationNo,
                                        )
                                      }
                                      helperText={
                                        formik.touched.partners &&
                                        formik.errors.partners?.[index]
                                          ?.partnerCompanyRegistrationNo
                                      }
                                      placeholder="Enter registration number"
                                    />
                                  </Grid>
                                  <Grid item size={{ xs: 12, md: 3 }}>
                                    <TextField
                                      fullWidth
                                      label="Partner Company Name *"
                                      name={`partners[${index}].partnerCompanyName`}
                                      size="small"
                                      value={partner.partnerCompanyName}
                                      onChange={formik.handleChange}
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.partners &&
                                        Boolean(
                                          formik.errors.partners?.[index]
                                            ?.partnerCompanyName,
                                        )
                                      }
                                      helperText={
                                        formik.touched.partners &&
                                        formik.errors.partners?.[index]
                                          ?.partnerCompanyName
                                      }
                                      placeholder="Enter company name"
                                    />
                                  </Grid>
                                </>
                              )}

                              {/* Remove Button */}
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
                        ))}

                        {/* Add Partner Button */}
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
                        <Typography color="error">
                          No changes selected
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {formik.values.proposed_institute_name && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        New Institute Name:
                      </Typography>
                      <Typography variant="body1">
                        {formik.values.proposed_institute_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Current: {currentInstituteData?.instituteName || "N/A"}
                      </Typography>
                    </Grid>
                  )}

                  {(formik.values.dzongkhag_id ||
                    formik.values.exact_location) && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        New Location:
                      </Typography>
                      <Typography variant="body1">
                        {getDzongkhagName(formik.values.dzongkhag_id)}{" "}
                        {formik.values.exact_location}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Current:{" "}
                        {getDzongkhagName(currentInstituteData?.dzongkhag_id)} -{" "}
                        {currentInstituteData?.exact_location || "N/A"}
                      </Typography>
                    </Grid>
                  )}

                  {formik.values.ownership_type_id && (
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        New Ownership:
                      </Typography>
                      <Typography variant="body1">
                        {getOwnershipTypeName(formik.values.ownership_type_id)}
                        {formik.values.company_name &&
                          ` - ${formik.values.company_name}`}
                        {formik.values.other_name &&
                          ` - ${formik.values.other_name}`}
                        {formik.values.promoter_name &&
                          ` - ${formik.values.promoter_name}`}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Current:{" "}
                        {getOwnershipTypeName(
                          currentInstituteData?.ownership_type_id,
                        ) || "N/A"}
                      </Typography>
                    </Grid>
                  )}

                  {formik.values.partners.length > 0 && (
                    <Grid item size={{ xs: 12 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Partners:
                      </Typography>
                      {formik.values.partners.map((partner, index) => (
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
                  submitting ? <CircularProgress size={20} /> : <SaveIcon />
                }
                disabled={
                  submitting || !hasChanges() || !formik.values.reasonForChange
                }
                sx={{ textTransform: "none" }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
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