import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUpload";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InstituteProposalService from "../../../api/services/internal/registration/InstituteProposalService";
import CommonService from "../../../api/services/internal/common/CommonService";
import { useParams, useNavigate } from "react-router-dom";
import DatahubService from "../../../api/services/external/datahub/DatahubService";

// ===== Validation Schema =====
const validationSchema = Yup.object({
  ownershipTypeId: Yup.string().required("Ownership Type is required"),

  otherOwnershipTypeId: Yup.string().when("ownershipTypeId", {
    is: (val) => val === "2", // ID for "Others (Organisation/Agency/Cooperatives/Group)"
    then: (schema) => schema.required("Please select the type of 'Others'"),
  }),

  registrationNo: Yup.string().when(
    ["ownershipTypeId", "otherOwnershipTypeId"],
    {
      is: (ownershipTypeId, otherOwnershipTypeId) =>
        ownershipTypeId === "1" || // Company
        (ownershipTypeId === "2" && // Others
          (otherOwnershipTypeId === "6" || // Cooperative
            otherOwnershipTypeId === "7")), // Group
      then: (schema) => schema.required("Registration No is required"),
    },
  ),

  companyName: Yup.string().when(["ownershipTypeId", "otherOwnershipTypeId"], {
    is: (ownershipTypeId, otherOwnershipTypeId) =>
      ownershipTypeId === "1" || // Company
      (ownershipTypeId === "2" && // Others
        (otherOwnershipTypeId === "6" || // Cooperative
          otherOwnershipTypeId === "7")), // Group
    then: (schema) => schema.required("Company Name is required"),
  }),

  otherName: Yup.string().when("otherOwnershipTypeId", {
    is: (val) => val === "5" || val === "8", // Agency (5) or Organization (8)
    then: (schema) => schema.required("Name is required"),
  }),

  otherAddress: Yup.string().when("otherOwnershipTypeId", {
    is: (val) => val === "5" || val === "8", // Agency (5) or Organization (8)
    then: (schema) => schema.required("Address is required"),
  }),

  proposedInstituteName: Yup.string().required(
    "Proposed Institute Name is required",
  ),

  promoterCitizenId: Yup.string().when("ownershipTypeId", {
    is: "4", // Sole Proprietorship
    then: (schema) =>
      schema
        .required("Promoter Citizen ID is required")
        .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
  }),

  promoterName: Yup.string().when("ownershipTypeId", {
    is: "4", // Sole Proprietorship
    then: (schema) => schema.required("Promoter Name is required"),
  }),

  dzongkhagId: Yup.string().required("Dzongkhag is required"),
  exactLocation: Yup.string().required("Exact location is required"),
  telephoneNo: Yup.string(),
  mobileNo: Yup.string()
    .required("Mobile No is required")
    .matches(/^\d{8}$/, "Mobile No must be exactly 8 digits"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  sectorId: Yup.string().required("Field of Training is required"),
  courseId: Yup.string().required("Course is required"),
  activityLevelId: Yup.string().required("Activity Level is required"),
  files: Yup.array().min(1, "Please upload at least one supporting document"),

  partners: Yup.array().of(
    Yup.object().shape({
      typeOfOwner: Yup.string().required("Type of Owner is required"),
      citizenId: Yup.string().when("typeOfOwner", {
        is: "22", // ID for Individual
        then: (schema) =>
          schema
            .required("Citizen ID is required")
            .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
      }),
      partnerName: Yup.string().when("typeOfOwner", {
        is: "22", // ID for Individual
        then: (schema) => schema.required("Partner Name is required"),
      }),
      registrationNo: Yup.string().when("typeOfOwner", {
        is: "23", // ID for Company
        then: (schema) =>
          schema.required("Partner Company Registration No is required"),
      }),
      companyName: Yup.string().when("typeOfOwner", {
        is: "23", // ID for Company
        then: (schema) => schema.required("Partner Company Name is required"),
      }),
    }),
  ),
});

const InstituteSesCentreAssessmentCentreProposal = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingCitizen, setFetchingCitizen] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [serviceName, setServiceName] = useState();
  const [dzongkhags, setDzongkhags] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [otherOwnershipTypes, setOtherOwnershipTypes] = useState([]);
  const [activityLevels, setActivityLevels] = useState([]);
  const [typeOfOwners, setTypeOfOwners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const navigate = useNavigate();
  const { serviceId } = useParams();
  const formikRef = useRef();

  useEffect(() => {
    fetchSectors();
    fetchDzongkhags();
    fetchOwnershipTypes();
    fetchOtherOwnershipTypes();
    fetchActivityLevels();
    fetchTypeOfOwner();
  }, []);

  useEffect(() => {
    fetchServiceName();
  }, [serviceId]);

  const fetchSectors = async () => {
    try {
      const response = await CommonService.getAllSectors();
      setSectors(response.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

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

        // Auto-fill the promoter name
        formik.setFieldValue("promoterName", fullName);

        toast.success(`Citizen details fetched successfully for ${fullName}`);
      } else {
        toast.warning("No citizen details found for this CID");
        formik.setFieldValue("promoterName", "");
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error(
        "Failed to fetch citizen details. Please check the CID number.",
      );
      formik.setFieldValue("promoterName", "");
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

        // Auto-fill the partner name
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

  const fetchCoursesBySector = async (sectorId) => {
    if (!sectorId) {
      setCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      const response = await CommonService.getOccupationsBySectorId(sectorId);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses for selected sector");
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchServiceName = async () => {
    try {
      const response = await CommonService.getServiceName(serviceId);
      setServiceName(response.data.serviceName);
    } catch (error) {
      console.error("Error fetching service name:", error);
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

  const fetchOwnershipTypes = async () => {
    try {
      const ownershipTypes = await CommonService.getByParentId(1);
      setOwnershipTypes(ownershipTypes.data);
    } catch (error) {
      console.error("Error fetching ownershipTypes:", error);
    }
  };

  const fetchOtherOwnershipTypes = async () => {
    try {
      const otherOwnershipTypes = await CommonService.getByParentId(2);
      setOtherOwnershipTypes(otherOwnershipTypes.data);
    } catch (error) {
      console.error("Error fetching other ownership types:", error);
    }
  };

  const fetchActivityLevels = async () => {
    try {
      const activityLevels = await CommonService.getByParentId(3);
      setActivityLevels(activityLevels.data);
    } catch (error) {
      console.error("Error fetching activity levels:", error);
    }
  };

  const fetchTypeOfOwner = async () => {
    try {
      const typeOfOwnerdata = await CommonService.getByParentId(6);
      setTypeOfOwners(typeOfOwnerdata.data);
    } catch (error) {
      console.error("Error fetching activity levels:", error);
    }
  };

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

  const formik = useFormik({
    innerRef: formikRef,
    initialValues: {
      ownershipTypeId: "",
      otherOwnershipTypeId: "",
      registrationNo: "",
      companyName: "",
      otherName: "",
      otherAddress: "",
      partners: [],
      // Training Provider Profile
      proposedInstituteName: "",
      dzongkhagId: "",
      exactLocation: "",
      telephoneNo: "",
      mobileNo: "",
      email: "",
      promoterCitizenId: "",
      promoterName: "",
      sectorId: "",
      courseId: "",
      activityLevelId: "",
      // Supporting Documents
      files: [],
    },

    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        const payload = {
          ownershipTypeId: values.ownershipTypeId || null,
          otherOwnershipTypeId: values.otherOwnershipTypeId || null,
          registrationNo: values.registrationNo || null,
          companyName: values.companyName || null,
          otherName: values.otherName || null,
          otherAddress: values.otherAddress || null,
          proposedInstituteName: values.proposedInstituteName || null,
          dzongkhagId: parseInt(values.dzongkhagId) || null,
          exactLocation: values.exactLocation,
          telephoneNo: values.telephoneNo || null,
          mobileNo: values.mobileNo || null,
          email: values.email || null,
          promoterCitizenId: values.promoterCitizenId || null,
          promoterName: values.promoterName || null,
          sectorId: values.sectorId || null,
          courseId: values.courseId || null,
          activityLevelId: values.activityLevelId || null,
          serviceId: serviceId,
          assignedRoleId: 7,
          statusId: 55,
          userId: null,
          documents,
          partners: values.partners || [],
        };

        const response =
          await InstituteProposalService.submitInstituteProposal(payload);
        if (response.status == 201) {
          toast.success(
            `${serviceName} form submitted successfully! Application No: ${response.data.applicationNo}`,
          );

          resetForm();
          navigate("/");
        } else {
          toast.error("Submission failed. Please try again.");
        }
      } catch (error) {
        toast.error(error.message || "Submission failed");
      } finally {
        setLoading(false);
      }
    },
  });

  // Helper function to check if ownership type is "Others"
  const isOthersType = () => {
    return formik.values.ownershipTypeId === "2";
  };

  // Helper function to check if other ownership type is Agency or Organization
  const isAgencyOrOrganization = () => {
    const id = formik.values.otherOwnershipTypeId;
    return id === "5" || id === "8";
  };

  // Helper function to check if other ownership type is Cooperative or Group
  const isCooperativeOrGroup = () => {
    const id = formik.values.otherOwnershipTypeId;
    return id === "6" || id === "7";
  };

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  return (
    <Box sx={{ m: 1 }}>
      <Paper
        sx={{
          p: 2,
        }}
      >
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography
            textTransform="uppercase"
            fontWeight="bold"
            sx={{ textDecoration: "underline", fontSize: "1.3rem" }}
          >
            {serviceName} Form
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          {/* ===== Ownership Information ===== */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Ownership Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Ownership Type */}
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Ownership Type")}
                  name="ownershipTypeId"
                  size="small"
                  value={formik.values.ownershipTypeId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    // reset dependent fields
                    formik.setFieldValue("otherOwnershipTypeId", "");
                    formik.setFieldValue("registrationNo", "");
                    formik.setFieldValue("companyName", "");
                    formik.setFieldValue("otherName", "");
                    formik.setFieldValue("otherAddress", "");
                    formik.setFieldValue("partners", []);
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.ownershipTypeId &&
                    Boolean(formik.errors.ownershipTypeId)
                  }
                  helperText={
                    formik.touched.ownershipTypeId &&
                    formik.errors.ownershipTypeId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {ownershipTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Company section */}
              {formik.values.ownershipTypeId === "1" && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Registration No")}
                      name="registrationNo"
                      size="small"
                      value={formik.values.registrationNo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
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
                      label={requiredLabel("Company Name")}
                      name="companyName"
                      size="small"
                      value={formik.values.companyName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.companyName &&
                        Boolean(formik.errors.companyName)
                      }
                      helperText={
                        formik.touched.companyName && formik.errors.companyName
                      }
                    />
                  </Grid>
                </>
              )}

              {/* Partnership Section */}
              {formik.values.ownershipTypeId === "3" && (
                <>
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
                            label={requiredLabel("Type of Owner")}
                            name={`partners[${index}].typeOfOwner`}
                            value={partner.typeOfOwner}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.partners &&
                              Boolean(
                                formik.errors.partners?.[index]?.typeOfOwner,
                              )
                            }
                            helperText={
                              formik.touched.partners &&
                              formik.errors.partners?.[index]?.typeOfOwner
                            }
                          >
                            <MenuItem value="">Select</MenuItem>
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
                        {partner.typeOfOwner === "22" && (
                          <>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={requiredLabel("Partner Citizen ID No")}
                                name={`partners[${index}].citizenId`}
                                size="small"
                                value={partner.citizenId}
                                onChange={formik.handleChange}
                                onBlur={(e) => {
                                  formik.handleBlur(e);
                                  // Auto-fetch citizen details when CID is entered and is 11 digits
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
                                    formik.errors.partners?.[index]?.citizenId,
                                  )
                                }
                                helperText={
                                  formik.touched.partners &&
                                  formik.errors.partners?.[index]?.citizenId
                                }
                                InputProps={{
                                  endAdornment: fetchingCitizen && (
                                    <CircularProgress size={20} />
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={requiredLabel("Partner Name")}
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
                                  formik.errors.partners?.[index]?.partnerName
                                }
                                InputProps={{
                                  readOnly: true,
                                  sx: {
                                    backgroundColor: partner.partnerName
                                      ? (theme) => theme.palette.action.hover
                                      : "transparent",
                                  },
                                }}
                              />
                            </Grid>
                          </>
                        )}

                        {/* Company Partner */}
                        {partner.typeOfOwner === "23" && (
                          <>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={requiredLabel(
                                  "Partner Company Registration No",
                                )}
                                name={`partners[${index}].registrationNo`}
                                size="small"
                                value={partner.registrationNo}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                  formik.touched.partners &&
                                  Boolean(
                                    formik.errors.partners?.[index]
                                      ?.registrationNo,
                                  )
                                }
                                helperText={
                                  formik.touched.partners &&
                                  formik.errors.partners?.[index]
                                    ?.registrationNo
                                }
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={requiredLabel("Partner Company Name")}
                                name={`partners[${index}].companyName`}
                                size="small"
                                value={partner.companyName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                  formik.touched.partners &&
                                  Boolean(
                                    formik.errors.partners?.[index]
                                      ?.companyName,
                                  )
                                }
                                helperText={
                                  formik.touched.partners &&
                                  formik.errors.partners?.[index]?.companyName
                                }
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
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        formik.setFieldValue("partners", [
                          ...formik.values.partners,
                          {
                            typeOfOwner: "",
                            citizenId: "",
                            partnerName: "",
                            registrationNo: "",
                            companyName: "",
                          },
                        ])
                      }
                    >
                      Add Partner
                    </Button>
                  </Grid>
                </>
              )}

              {/* Others Section */}
              {isOthersType() && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label={requiredLabel("Types of Other")}
                      name="otherOwnershipTypeId"
                      size="small"
                      value={formik.values.otherOwnershipTypeId}
                      onChange={(e) => {
                        formik.handleChange(e);
                        formik.setFieldValue("registrationNo", "");
                        formik.setFieldValue("companyName", "");
                        formik.setFieldValue("otherName", "");
                        formik.setFieldValue("otherAddress", "");
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.otherOwnershipTypeId &&
                        Boolean(formik.errors.otherOwnershipTypeId)
                      }
                      helperText={
                        formik.touched.otherOwnershipTypeId &&
                        formik.errors.otherOwnershipTypeId
                      }
                    >
                      <MenuItem value="">Select</MenuItem>
                      {otherOwnershipTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Agency & Organization */}
                  {isAgencyOrOrganization() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={requiredLabel("Name")}
                          name="otherName"
                          size="small"
                          value={formik.values.otherName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
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
                          label={requiredLabel("Address")}
                          name="otherAddress"
                          size="small"
                          value={formik.values.otherAddress}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
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

                  {/* Cooperative & Group */}
                  {isCooperativeOrGroup() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={requiredLabel("Registration No")}
                          name="registrationNo"
                          size="small"
                          value={formik.values.registrationNo}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
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
                          label={requiredLabel("Company Name")}
                          name="companyName"
                          size="small"
                          value={formik.values.companyName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
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
                </>
              )}

              {/* Sole Proprietorship Section */}
              {formik.values.ownershipTypeId === "4" && (
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Promoter Citizen ID No")}
                      name="promoterCitizenId"
                      size="small"
                      value={formik.values.promoterCitizenId}
                      onChange={formik.handleChange}
                      onBlur={(e) => {
                        formik.handleBlur(e);
                        // Auto-fetch citizen details when CID is entered and is 11 digits
                        if (e.target.value && e.target.value.length === 11) {
                          fetchAndFillPromoterDetails(e.target.value, formik);
                        }
                      }}
                      error={
                        formik.touched.promoterCitizenId &&
                        Boolean(formik.errors.promoterCitizenId)
                      }
                      helperText={
                        formik.touched.promoterCitizenId &&
                        formik.errors.promoterCitizenId
                      }
                      InputProps={{
                        endAdornment: fetchingCitizen && (
                          <CircularProgress size={20} />
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label={requiredLabel("Promoter Name")}
                      name="promoterName"
                      size="small"
                      value={formik.values.promoterName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.promoterName &&
                        Boolean(formik.errors.promoterName)
                      }
                      helperText={
                        formik.touched.promoterName &&
                        formik.errors.promoterName
                      }
                      InputProps={{
                        readOnly: true,
                        sx: {
                          backgroundColor: formik.values.promoterName
                            ? (theme) => theme.palette.action.hover
                            : "transparent",
                        },
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>

          {/* Training Provider Profile */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Training Provider Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Proposed Institute Name")}
                  name="proposedInstituteName"
                  size="small"
                  value={formik.values.proposedInstituteName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.proposedInstituteName &&
                    Boolean(formik.errors.proposedInstituteName)
                  }
                  helperText={
                    formik.touched.proposedInstituteName &&
                    formik.errors.proposedInstituteName
                  }
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Institute Location (Dzongkhag)")}
                  name="dzongkhagId"
                  size="small"
                  value={formik.values.dzongkhagId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.dzongkhagId &&
                    Boolean(formik.errors.dzongkhagId)
                  }
                  helperText={
                    formik.touched.dzongkhagId && formik.errors.dzongkhagId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {Array.isArray(dzongkhags) &&
                    dzongkhags.map((dz) => (
                      <MenuItem key={dz.id} value={dz.id.toString()}>
                        {dz.dzonkhagName}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Exact Location")}
                  name="exactLocation"
                  size="small"
                  value={formik.values.exactLocation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.exactLocation &&
                    Boolean(formik.errors.exactLocation)
                  }
                  helperText={
                    formik.touched.exactLocation && formik.errors.exactLocation
                  }
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Telephone No"
                  name="telephoneNo"
                  size="small"
                  value={formik.values.telephoneNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Mobile No")}
                  name="mobileNo"
                  type="number"
                  size="small"
                  value={formik.values.mobileNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                  }
                  helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Email Address")}
                  name="email"
                  size="small"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Sector")}
                  name="sectorId"
                  size="small"
                  value={formik.values.sectorId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    formik.setFieldValue("courseId", "");
                    fetchCoursesBySector(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.sectorId && Boolean(formik.errors.sectorId)
                  }
                  helperText={formik.touched.sectorId && formik.errors.sectorId}
                >
                  <MenuItem value="">Select</MenuItem>
                  {Array.isArray(sectors) &&
                    sectors.map((field) => (
                      <MenuItem key={field.id} value={field.id.toString()}>
                        {field.sectorName}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Course")}
                  name="courseId"
                  size="small"
                  value={formik.values.courseId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.courseId && Boolean(formik.errors.courseId)
                  }
                  helperText={formik.touched.courseId && formik.errors.courseId}
                  disabled={!formik.values.sectorId || loadingCourses}
                  InputProps={{
                    endAdornment: loadingCourses && (
                      <CircularProgress size={20} />
                    ),
                  }}
                >
                  <MenuItem value="">
                    {loadingCourses ? "Loading courses..." : "Select Course"}
                  </MenuItem>
                  {Array.isArray(courses) &&
                    courses.map((course) => (
                      <MenuItem key={course.id} value={course.id.toString()}>
                        {course.occupationName || course.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Activity Level")}
                  name="activityLevelId"
                  size="small"
                  value={formik.values.activityLevelId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.activityLevelId &&
                    Boolean(formik.errors.activityLevelId)
                  }
                  helperText={
                    formik.touched.activityLevelId &&
                    formik.errors.activityLevelId
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {activityLevels.map((level) => (
                    <MenuItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Supporting Documents */}

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              {requiredLabel("Supporting Documents")}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <FileUpload
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
            />
            {formik.touched.files && formik.errors.files && (
              <Typography color="error" variant="caption">
                {formik.errors.files}
              </Typography>
            )}
          </Paper>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 3,
                py: 0.5,
                fontWeight: 600,
                textTransform: "none",
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  <ArrowUpwardIcon />
                )
              }
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
              onClick={() => formik.resetForm()}
            >
              Reset
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default InstituteSesCentreAssessmentCentreProposal;
