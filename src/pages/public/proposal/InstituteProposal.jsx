import { useState, useEffect, useCallback } from "react";
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
import FileUplaod from "../../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InstituteProposalService from "../../../api/services/InstituteProposalService";
import CommonService from "../../../api/services/CommonService";
import { useParams, useNavigate } from "react-router-dom";
import DatahubService from "../../../api/services/external/DatahubService";

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

const InstituteProposal = () => {
  const [loading, setLoading] = useState(false);
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

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

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

  const fetchCitizenDetails = async (citizenId, index) => {
    if (!citizenId || citizenId.length !== 11) {
      return;
    }

    try {
      const response =
        await DatahubService.getDetailsByCitizenshipNo(citizenId);
      const citizenData =
        response.data?.citizenDetailsResponse?.citizenDetail?.[0];

      if (citizenData) {
        // Construct full name from firstName and lastName
        const fullName =
          `${citizenData.firstName || ""} ${citizenData.lastName || ""}`.trim();

        // Update the partner name field
        formik.setFieldValue(`partners[${index}].partnerName`, fullName);
      } else {
        toast.warning("No citizen found with this ID");
        // Clear the partner name if no citizen found
        formik.setFieldValue(`partners[${index}].partnerName`, "");
      }
    } catch (error) {
      console.error("Error fetching citizen details:", error);
      toast.error("Failed to fetch citizen details");
      formik.setFieldValue(`partners[${index}].partnerName`, "");
    }
  };

  // Create debounced version of fetchCitizenDetails
  const debouncedFetchCitizen = useCallback(
    debounce((citizenId, index) => {
      if (citizenId && citizenId.length === 11) {
        fetchCitizenDetails(citizenId, index);
      }
    }, 500),
    [],
  );

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
      console.log("response", typeOfOwnerdata.data);
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
          partners: values.partners || [], // Include partners in the payload
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
    return formik.values.ownershipTypeId === "2"; // ID for Others
  };

  // Helper function to check if other ownership type is Agency or Organization
  const isAgencyOrOrganization = () => {
    const id = formik.values.otherOwnershipTypeId;
    return id === "5" || id === "8"; // Agency (5) or Organization (8)
  };

  // Helper function to check if other ownership type is Cooperative or Group
  const isCooperativeOrGroup = () => {
    const id = formik.values.otherOwnershipTypeId;
    return id === "6" || id === "7"; // Cooperative (6) or Group (7)
  };

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
                  label={
                    <span>
                      Ownership Type <span style={{ color: "red" }}>*</span>
                    </span>
                  }
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
              {formik.values.ownershipTypeId === "1" && ( // Company
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          Registration No{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
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
                      label={
                        <span>
                          Company Name <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      name="companyName"
                      size="small"
                      value={formik.values.companyName}
                      onChange={formik.handleChange}
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
              {formik.values.ownershipTypeId === "3" && ( // Partnership
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
                            label={
                              <span>
                                Type of Owner{" "}
                                <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            name={`partners[${index}].typeOfOwner`}
                            value={partner.typeOfOwner}
                            onChange={formik.handleChange}
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

                        {/* Individual Partner - using ID comparison */}
                        {partner.typeOfOwner === "22" && ( // ID for Individual
                          <>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={
                                  <span>
                                    Partner Citizen ID No{" "}
                                    <span style={{ color: "red" }}>*</span>
                                  </span>
                                }
                                name={`partners[${index}].citizenId`}
                                size="small"
                                value={partner.citizenId}
                                onChange={(e) => {
                                  formik.handleChange(e);
                                  // Debounced fetch as user types
                                  debouncedFetchCitizen(e.target.value, index);
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
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={
                                  <span>
                                    Partner Name{" "}
                                    <span style={{ color: "red" }}>*</span>
                                  </span>
                                }
                                name={`partners[${index}].partnerName`}
                                size="small"
                                value={partner.partnerName}
                                onChange={formik.handleChange}
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
                                  readOnly: true, // Make the field read-only since it's auto-populated
                                }}
                              />
                            </Grid>
                          </>
                        )}

                        {/* Company Partner - using ID comparison */}
                        {partner.typeOfOwner === "23" && ( // ID for Company
                          <>
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label={
                                  <span>
                                    Partner Company Registration No{" "}
                                    <span style={{ color: "red" }}>*</span>
                                  </span>
                                }
                                name={`partners[${index}].registrationNo`}
                                size="small"
                                value={partner.registrationNo}
                                onChange={formik.handleChange}
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
                                label={
                                  <span>
                                    Partner Company Name{" "}
                                    <span style={{ color: "red" }}>*</span>
                                  </span>
                                }
                                name={`partners[${index}].companyName`}
                                size="small"
                                value={partner.companyName}
                                onChange={formik.handleChange}
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
                      label={
                        <span>
                          Types of Other <span style={{ color: "red" }}>*</span>
                        </span>
                      }
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
                          label={
                            <span>
                              Name <span style={{ color: "red" }}>*</span>
                            </span>
                          }
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
                          label={
                            <span>
                              Address <span style={{ color: "red" }}>*</span>
                            </span>
                          }
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

                  {/* Cooperative & Group */}
                  {isCooperativeOrGroup() && (
                    <>
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={
                            <span>
                              Registration No{" "}
                              <span style={{ color: "red" }}>*</span>
                            </span>
                          }
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
                          label={
                            <span>
                              Company Name{" "}
                              <span style={{ color: "red" }}>*</span>
                            </span>
                          }
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
                </>
              )}

              {/* Sole Proprietorship Section */}
              {formik.values.ownershipTypeId === "4" && ( // Sole Proprietorship
                <>
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          Promoter Citizen ID No{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
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
                      label={
                        <span>
                          Promoter Name <span style={{ color: "red" }}>*</span>
                        </span>
                      }
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
                  label={
                    <span>
                      Proposed Institute Name{" "}
                      <span style={{ color: "red" }}>*</span>
                    </span>
                  }
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
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={
                    <span>
                      Institute Location (Dzongkhag){" "}
                      <span style={{ color: "red" }}>*</span>
                    </span>
                  }
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
                  label={
                    <span>
                      Exact Location <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="exactLocation"
                  size="small"
                  value={formik.values.exactLocation}
                  onChange={formik.handleChange}
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
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={
                    <span>
                      Mobile No <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="mobileNo"
                  type="number"
                  size="small"
                  value={formik.values.mobileNo}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                  }
                  helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={
                    <span>
                      Email Address <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="email"
                  size="small"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={
                    <span>
                      Sector <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="sectorId"
                  size="small"
                  value={formik.values.sectorId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    // Reset course when sector changes
                    formik.setFieldValue("courseId", "");
                    // Fetch courses for selected sector
                    fetchCoursesBySector(e.target.value);
                  }}
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
                  label={
                    <span>
                      Course <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="courseId"
                  size="small"
                  value={formik.values.courseId}
                  onChange={formik.handleChange}
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
                  label={
                    <span>
                      Activity Level <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="activityLevelId"
                  size="small"
                  value={formik.values.activityLevelId}
                  onChange={formik.handleChange}
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
              Supporting Documents
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <FileUplaod
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
            />
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

export default InstituteProposal;
