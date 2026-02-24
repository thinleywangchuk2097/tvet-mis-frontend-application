import { useState } from "react";
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
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUplaod from "../../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
// ===== Static Data =====
const ownershipTypes = [
  { id: 1, name: "Company" },
  { id: 2, name: "Others (Organisation/Agency/Cooperatives/Group)" },
  { id: 3, name: "Partnership" },
  { id: 4, name: "Sole Proprietorship" },
];

const otherOwnershipTypes = [
  { id: 1, name: "Agency" },
  { id: 2, name: "Cooperative" },
  { id: 4, name: "Group" },
  { id: 5, name: "Organization" },
];

const dzongkhags = [
  { id: 1, name: "Thimphu" },
  { id: 2, name: "Paro" },
  { id: 3, name: "Punakha" },
  { id: 4, name: "Wangdue" },
  { id: 5, name: "Bumthang" },
];

const fieldsOfTraining = [
  { id: 1, name: "Agriculture & Forestry" },
  { id: 2, name: "Automobile" },
  { id: 3, name: "Business and Finance" },
  { id: 4, name: "Construction" },
  { id: 5, name: "Creative Arts" },
  { id: 6, name: "Film and Music" },
  { id: 7, name: "Garment and Tailoring" },
  { id: 8, name: "Hydro Power" },
  { id: 9, name: "ICT" },
  { id: 10, name: "Language" },
  { id: 11, name: "Manufacturing" },
  { id: 12, name: "Power" },
  { id: 13, name: "Service" },
  { id: 14, name: "Social Works" },
  { id: 15, name: "Sports and Games" },
  { id: 16, name: "Tourism & Hospitality" },
  { id: 17, name: "Transportation" },
  { id: 18, name: "Wood Based Occupations" },
  { id: 19, name: "Zorig Chusum" },
];

const activityLevels = [
  {
    id: 1,
    name: "Leading to Diploma/Certificate level except for differently abled",
  },
  {
    id: 2,
    name: "Below the level of higher education except for differently abled",
  },
  { id: 3, name: "For differently abled students" },
  {
    id: 4,
    name: "Leading to Degree/Certificate level except for differently abled",
  },
  { id: 5, name: "Professional motor driving school" },
];

// ===== Validation Schema =====
const validationSchema = Yup.object({
  ownershipType: Yup.string().required("Ownership Type is required"),

  otherOwnershipType: Yup.string().when("ownershipType", {
    is: "Others (Organisation/Agency/Cooperatives/Group)",
    then: (schema) => schema.required("Please select the type of 'Others'"),
  }),

  registrationNo: Yup.string().when(["ownershipType", "otherOwnershipType"], {
    is: (ownershipType, otherOwnershipType) =>
      ownershipType === "Company" ||
      (ownershipType === "Others (Organisation/Agency/Cooperatives/Group)" &&
        (otherOwnershipType === "Cooperative" ||
          otherOwnershipType === "Group")),
    then: (schema) => schema.required("Registration No is required"),
  }),

  companyName: Yup.string().when(["ownershipType", "otherOwnershipType"], {
    is: (ownershipType, otherOwnershipType) =>
      ownershipType === "Company" ||
      (ownershipType === "Others (Organisation/Agency/Cooperatives/Group)" &&
        (otherOwnershipType === "Cooperative" ||
          otherOwnershipType === "Group")),
    then: (schema) => schema.required("Company Name is required"),
  }),

  otherName: Yup.string().when("otherOwnershipType", {
    is: (val) => val === "Agency" || val === "Organization",
    then: (schema) => schema.required("Name is required"),
  }),

  otherAddress: Yup.string().when("otherOwnershipType", {
    is: (val) => val === "Agency" || val === "Organization",
    then: (schema) => schema.required("Address is required"),
  }),

  proposedInstituteName: Yup.string().required(
    "Proposed Institute Name is required",
  ),

  promoterCitizenId: Yup.string().when("ownershipType", {
    is: "Sole Proprietorship",
    then: (schema) =>
      schema
        .required("Promoter Citizen ID is required")
        .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
  }),

  promoterName: Yup.string().when("ownershipType", {
    is: "Sole Proprietorship",
    then: (schema) => schema.required("Promoter Name is required"),
  }),

  dzongkhag: Yup.string().required("Dzongkhag is required"),
  exactLocation: Yup.string().required("Exact location is required"),
  telephoneNo: Yup.string(),
  mobileNo: Yup.string().required("Mobile No is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  fieldOfTraining: Yup.string().required("Field of Training is required"),
  activityLevel: Yup.string().required("Activity Level is required"),
  files: Yup.array().min(1, "Please upload at least one supporting document"),

  partners: Yup.array().of(
    Yup.object().shape({
      typeOfOwner: Yup.string().required("Type of Owner is required"),
      citizenId: Yup.string().when("typeOfOwner", {
        is: "Individual",
        then: (schema) =>
          schema
            .required("Citizen ID is required")
            .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
      }),
      partnerName: Yup.string().when("typeOfOwner", {
        is: "Individual",
        then: (schema) => schema.required("Partner Name is required"),
      }),
      registrationNo: Yup.string().when("typeOfOwner", {
        is: "Company",
        then: (schema) =>
          schema.required("Partner Company Registration No is required"),
      }),
      companyName: Yup.string().when("typeOfOwner", {
        is: "Company",
        then: (schema) => schema.required("Partner Company Name is required"),
      }),
    }),
  ),
});

// ===== Component =====
const InstituteProposal = () => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      // Ownership Information
      ownershipType: "",
      otherOwnershipType: "",
      registrationNo: "",
      companyName: "",
      otherName: "",
      otherAddress: "",
      partners: [], // Added for Partnership owners

      // Training Provider Profile
      proposedInstituteName: "",
      dzongkhag: "",
      exactLocation: "",
      telephoneNo: "",
      mobileNo: "",
      email: "",
      promoterCitizenId: "",
      promoterName: "",
      fieldOfTraining: "",
      activityLevel: "",

      // Supporting Documents
      files: [],
    },

    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        toast.success("Institute Proposal submitted successfully!");
        resetForm();
      } catch (error) {
        toast.error(error.message || "Submission failed");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box sx={{ m: { xs: 2, md: 6 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 3,
        }}
      >
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{
              letterSpacing: 0.7,
              borderBottom: "3px solid #555",
              color: "#1a1a1a",
              display: "inline-block",
              fontFamily: "'Roboto', 'Arial', sans-serif",
              textTransform: "capitalize",
              transition: "color 0.3s ease, border-color 0.3s ease", // animate both
              "&:hover": {
                color: "#0d47a1",
                borderColor: "#0d47a1", // underline matches text on hover
              },
            }}
          >
            Application for Institute Proposal
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
                  name="ownershipType"
                  size="small"
                  value={formik.values.ownershipType}
                  onChange={(e) => {
                    formik.handleChange(e);
                    // reset dependent fields
                    formik.setFieldValue("otherOwnershipType", "");
                    formik.setFieldValue("registrationNo", "");
                    formik.setFieldValue("companyName", "");
                    formik.setFieldValue("otherName", "");
                    formik.setFieldValue("otherAddress", "");
                    formik.setFieldValue("partners", []);
                  }}
                  error={
                    formik.touched.ownershipType &&
                    Boolean(formik.errors.ownershipType)
                  }
                  helperText={
                    formik.touched.ownershipType && formik.errors.ownershipType
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {ownershipTypes.map((type) => (
                    <MenuItem key={type.id} value={type.name}>
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Company section */}
              {formik.values.ownershipType === "Company" && (
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
              {formik.values.ownershipType === "Partnership" && (
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
                            <MenuItem value="Individual">Individual</MenuItem>
                            <MenuItem value="Company">Company</MenuItem>
                          </TextField>
                        </Grid>

                        {/* Individual Partner */}
                        {partner.typeOfOwner === "Individual" && (
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
                                onChange={formik.handleChange}
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
                              />
                            </Grid>
                          </>
                        )}

                        {/* Company Partner */}
                        {partner.typeOfOwner === "Company" && (
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
                              />
                            </Grid>
                          </>
                        )}

                        {/* Remove Button */}
                        <Grid item size={{ xs: 12, md: 1 }}>
                          <Button
                            color="error"
                            variant="contained"
                            size="small" // smaller button
                            startIcon={<DeleteIcon />} // added icon here
                            onClick={() => {
                              const updated = [...formik.values.partners];
                              updated.splice(index, 1);
                              formik.setFieldValue("partners", updated);
                            }}
                            sx={{
                              py: 0.3, // smaller vertical padding
                              px: 1.2, // smaller horizontal padding
                              minWidth: "90px", // keep it compact but readable
                              textTransform: "none", // keeps text normal
                              fontSize: "0.85rem", // smaller text
                            }}
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}

                  {/* Add Partner Button */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <Button
                      variant="contained"
                      size="small" // smaller button
                      startIcon={<AddIcon />} // added icon here
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
              {formik.values.ownershipType ===
                "Others (Organisation/Agency/Cooperatives/Group)" && (
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
                      name="otherOwnershipType"
                      size="small"
                      value={formik.values.otherOwnershipType}
                      onChange={(e) => {
                        formik.handleChange(e);
                        formik.setFieldValue("registrationNo", "");
                        formik.setFieldValue("companyName", "");
                        formik.setFieldValue("otherName", "");
                        formik.setFieldValue("otherAddress", "");
                      }}
                      error={
                        formik.touched.otherOwnershipType &&
                        Boolean(formik.errors.otherOwnershipType)
                      }
                      helperText={
                        formik.touched.otherOwnershipType &&
                        formik.errors.otherOwnershipType
                      }
                    >
                      <MenuItem value="">Select</MenuItem>
                      {otherOwnershipTypes.map((type) => (
                        <MenuItem key={type.id} value={type.name}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Agency & Organization */}
                  {(formik.values.otherOwnershipType === "Agency" ||
                    formik.values.otherOwnershipType === "Organization") && (
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
                  {(formik.values.otherOwnershipType === "Cooperative" ||
                    formik.values.otherOwnershipType === "Group") && (
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
              {formik.values.ownershipType === "Sole Proprietorship" && (
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
                  name="dzongkhag"
                  size="small"
                  value={formik.values.dzongkhag}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.dzongkhag && Boolean(formik.errors.dzongkhag)
                  }
                  helperText={
                    formik.touched.dzongkhag && formik.errors.dzongkhag
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((dz) => (
                    <MenuItem key={dz.id} value={dz.name}>
                      {dz.name}
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
                  label={
                    <span>
                      Telephone No <span style={{ color: "red" }}>*</span>
                    </span>
                  }
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
                      Field of Training <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="fieldOfTraining"
                  size="small"
                  value={formik.values.fieldOfTraining}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.fieldOfTraining &&
                    Boolean(formik.errors.fieldOfTraining)
                  }
                  helperText={
                    formik.touched.fieldOfTraining &&
                    formik.errors.fieldOfTraining
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {fieldsOfTraining.map((field) => (
                    <MenuItem key={field.id} value={field.name}>
                      {field.name}
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
                  name="activityLevel"
                  size="small"
                  value={formik.values.activityLevel}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.activityLevel &&
                    Boolean(formik.errors.activityLevel)
                  }
                  helperText={
                    formik.touched.activityLevel && formik.errors.activityLevel
                  }
                >
                  <MenuItem value="">Select</MenuItem>
                  {activityLevels.map((level) => (
                    <MenuItem key={level.id} value={level.name}>
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
