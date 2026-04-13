import React, { useState } from "react";
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
  IconButton,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUplaod from "../../../components/file/FileUplaod";
import { toast } from "react-toastify";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

// Dropdown data
const dzongkhags = ["Thimphu", "Paro", "Punakha"];
const occupations = ["Teacher", "Engineer", "Doctor"];
const ownershipTypes = [
  "Private (Sole Proprietorship)",
  "Private (Partnership)",
  "Franchise",
  "Public (Govt.)",
  "Corporate",
  "NGO",
];
const yesNoOptions = ["Yes", "No"];
const levels = ["Level 1", "Level 2", "Level 3"];

// Initial fixed room types
const initialRoomTypes = [
  "Rooms with adequate furniture, lightning, ventilation and power supply outlets",
  "Workshop/Lab/outdoor/indoor space for assessment",
  "Office room with adequate furniture",
  "Staff room with adequate furniture",
  "Meeting room (if any)",
];

const validationSchema = Yup.object({
  orgName: Yup.string().required("Organization Name is required"),
  dzongkhag: Yup.string().required("Dzongkhag is required"),
  location: Yup.string().required("Location is required"),
  assessmentFor: Yup.string().required("Assessment Centre for is required"),
  level: Yup.string().required("Level is required"),
  mobileNo: Yup.string().required("Mobile No is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  keyPersonName: Yup.string().required("Key person name is required"),
  keyPersonDesignation: Yup.string().required(
    "Key person designation is required",
  ),
  physicalResources: Yup.array().of(
    Yup.object({
      roomType: Yup.string().required(),
      numOfRooms: Yup.number().min(0, "Invalid number").required("Required"),
      remarks: Yup.string(),
    }),
  ),
});

const AssessmentCentre = () => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      orgName: "",
      dzongkhag: "",
      location: "",
      assessmentFor: "",
      level: "",
      telephoneNo: "",
      mobileNo: "",
      email: "",
      website: "",
      ownershipType: "",
      accreditedByOther: "No",
      internationalAgency: "",
      dateOfEstablishment: "",
      licenseNo: "",
      keyPersonName: "",
      keyPersonDesignation: "",
      toolsAdequate: "",
      planToBuy: "",
      assessorRatio: "",
      assessorRatioReason: "",
      supportingDocuments: [],
      files: [],
      physicalResources: initialRoomTypes.map((room) => ({
        roomType: room,
        numOfRooms: "",
        remarks: "",
      })),
      humanResources: [
        {
          fullName: "",
          gender: "",
          qualification: "",
          workExperience: "",
          jobType: "",
          nationality: "",
        },
      ],
      supportServices: [
        { facility: "First Aid facility", available: "", remarks: "" },
        {
          facility: "Toilet (separate toilet for male and female)",
          available: "",
          remarks: "",
        },
        {
          facility: "Fire safety (equipment/exit door)",
          available: "",
          remarks: "",
        },
        {
          facility: "Drinking water (hot and cold)",
          available: "",
          remarks: "",
        },
        { facility: "Internet facility", available: "", remarks: "" },
        { facility: "Photocopier/Printer", available: "", remarks: "" },
        { facility: "Information/notice board", available: "", remarks: "" },
        { facility: "Suggestion box", available: "", remarks: "" },
        { facility: "Rules and regulation", available: "", remarks: "" },
        { facility: "Canteen facilities", available: "", remarks: "" },
        {
          facility: "Vision and Mission statement",
          available: "",
          remarks: "",
        },
        {
          facility: "Signboard written in Dzongkhag and English",
          available: "",
          remarks: "",
        },
      ],
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        console.log(values);
        toast.success("Assessment Centre submitted successfully!");
        resetForm();
      } catch (error) {
        toast.error(error.message || "Submission failed");
      } finally {
        setLoading(false);
      }
    },
  });

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  // Add a new "Other" room row
  const handleAddOtherRoom = () => {
    const updated = [...formik.values.physicalResources];
    updated.push({ roomType: "Others", numOfRooms: "", remarks: "" });
    formik.setFieldValue("physicalResources", updated);
  };

  // Remove a room row
  const handleRemoveRoom = (index) => {
    const updated = [...formik.values.physicalResources];
    updated.splice(index, 1);
    formik.setFieldValue("physicalResources", updated);
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
            variant="h5"
            fontWeight={600}
            sx={{
              letterSpacing: 0.7,
              borderBottom: "3px solid #555",
              color: "#1a1a1a",
              display: "inline-block",
              fontFamily: "'Roboto', 'Arial', sans-serif",
              textTransform: "capitalize",
              "&:hover": {
                color: "#0d47a1",
                borderColor: "#0d47a1",
              },
            }}
          >
            Application for Accreditation of Assessment Centre
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          {/* ===== Centre Details ===== */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Centre Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Name of the Organization")}
                  name="orgName"
                  size="small"
                  value={formik.values.orgName}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.orgName && Boolean(formik.errors.orgName)
                  }
                  helperText={formik.touched.orgName && formik.errors.orgName}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Dzongkhag")}
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
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  {dzongkhags.map((dz) => (
                    <MenuItem key={dz} value={dz}>
                      {dz}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Location of the Organization")}
                  name="location"
                  size="small"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.location && Boolean(formik.errors.location)
                  }
                  helperText={formik.touched.location && formik.errors.location}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Assessment Centre for (Occupation)")}
                  name="assessmentFor"
                  size="small"
                  value={formik.values.assessmentFor}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.assessmentFor &&
                    Boolean(formik.errors.assessmentFor)
                  }
                  helperText={
                    formik.touched.assessmentFor && formik.errors.assessmentFor
                  }
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  {occupations.map((occ) => (
                    <MenuItem key={occ} value={occ}>
                      {occ}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={requiredLabel("Level")}
                  name="level"
                  size="small"
                  value={formik.values.level}
                  onChange={formik.handleChange}
                  error={formik.touched.level && Boolean(formik.errors.level)}
                  helperText={formik.touched.level && formik.errors.level}
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  {levels.map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      {lvl}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Telephone No"
                  name="telephoneNo"
                  size="small"
                  value={formik.values.telephoneNo}
                  onChange={formik.handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Mobile No")}
                  name="mobileNo"
                  size="small"
                  value={formik.values.mobileNo}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.mobileNo && Boolean(formik.errors.mobileNo)
                  }
                  helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Email ID")}
                  name="email"
                  size="small"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Website Address"
                  name="website"
                  size="small"
                  value={formik.values.website}
                  onChange={formik.handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Type of Ownership"
                  name="ownershipType"
                  size="small"
                  value={formik.values.ownershipType}
                  onChange={formik.handleChange}
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  {ownershipTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Is the centre accredited by other international agency?"
                  name="accreditedByOther"
                  size="small"
                  value={formik.values.accreditedByOther}
                  onChange={formik.handleChange}
                  disabled={loading}
                >
                  {yesNoOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Enter International Agency Name"
                  name="internationalAgency"
                  size="small"
                  value={formik.values.internationalAgency}
                  onChange={formik.handleChange}
                  disabled={loading || formik.values.accreditedByOther === "No"}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Establishment"
                  name="dateOfEstablishment"
                  size="small"
                  value={formik.values.dateOfEstablishment}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="License No (Private training provider only)"
                  name="licenseNo"
                  size="small"
                  value={formik.values.licenseNo}
                  onChange={formik.handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Name of the Key Person")}
                  name="keyPersonName"
                  size="small"
                  value={formik.values.keyPersonName}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.keyPersonName &&
                    Boolean(formik.errors.keyPersonName)
                  }
                  helperText={
                    formik.touched.keyPersonName && formik.errors.keyPersonName
                  }
                  disabled={loading}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={requiredLabel("Designation of the Key Person")}
                  name="keyPersonDesignation"
                  size="small"
                  value={formik.values.keyPersonDesignation}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.keyPersonDesignation &&
                    Boolean(formik.errors.keyPersonDesignation)
                  }
                  helperText={
                    formik.touched.keyPersonDesignation &&
                    formik.errors.keyPersonDesignation
                  }
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Section: Physical Resources ===== */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Physical Resources
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2} alignItems="center">
              {/* Header Row */}
              <Grid item size={{ xs: 4, md: 4 }}>
                <Typography fontWeight={600}>Type of Rooms</Typography>
              </Grid>
              <Grid item size={{ xs: 4, md: 4 }}>
                <Typography fontWeight={600}>No. of Rooms</Typography>
              </Grid>
              <Grid item size={{ xs: 3, md: 3 }}>
                <Typography fontWeight={600}>Remarks</Typography>
              </Grid>
              <Grid item size={{ xs: 1, md: 1 }}></Grid>

              {/* Room Rows */}
              {formik.values.physicalResources.map((room, index) => (
                <React.Fragment key={index}>
                  <Grid item size={{ xs: 4, md: 4 }}>
                    <TextField
                      fullWidth
                      value={room.roomType}
                      disabled
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 4, md: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      value={room.numOfRooms}
                      onChange={(e) => {
                        const updated = [...formik.values.physicalResources];
                        updated[index].numOfRooms = e.target.value;
                        formik.setFieldValue("physicalResources", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 3, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={room.remarks}
                      onChange={(e) => {
                        const updated = [...formik.values.physicalResources];
                        updated[index].remarks = e.target.value;
                        formik.setFieldValue("physicalResources", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 1, md: 1 }}>
                    {room.roomType === "Others" && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveRoom(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>
                </React.Fragment>
              ))}

              {/* Add Other Room Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddOtherRoom}
                  disabled={loading}
                >
                  Add Other Room
                </Button>
              </Grid>
            </Grid>
          </Paper>
          {/* ===== Section: Support Services ===== */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Support Services
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2} alignItems="center">
              {/* Header Row */}
              <Grid item size={{ xs: 6, md: 6 }}>
                <Typography fontWeight={600}>Type of Facilities</Typography>
              </Grid>
              <Grid item size={{ xs: 2, md: 2 }}>
                <Typography fontWeight={600}>Yes / No</Typography>
              </Grid>
              <Grid item size={{ xs: 3, md: 3 }}>
                <Typography fontWeight={600}>Remarks</Typography>
              </Grid>
              <Grid item size={{ xs: 1, md: 1 }}></Grid>

              {/* Support Services Rows */}
              {formik.values.supportServices.map((service, index) => (
                <React.Fragment key={index}>
                  <Grid item size={{ xs: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      value={service.facility}
                      disabled
                      size="small"
                    />
                  </Grid>
                  <Grid item size={{ xs: 2, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={service.available}
                      onChange={(e) => {
                        const updated = [...formik.values.supportServices];
                        updated[index].available = e.target.value;
                        formik.setFieldValue("supportServices", updated);
                      }}
                      disabled={loading}
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 3, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={service.remarks}
                      onChange={(e) => {
                        const updated = [...formik.values.supportServices];
                        updated[index].remarks = e.target.value;
                        formik.setFieldValue("supportServices", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Paper>
          {/* ===== Section: Tools and Equipment ===== */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Tools and Equipment
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              Note: Tools and equipment shall be verified by the evaluator
              during the site visit
            </Typography>

            <Grid container spacing={2} alignItems="center">
              {/* Adequacy Question */}
              <Grid item size={{ xs: 12, md: 6 }}>
                <Typography>
                  Does the centre have adequate tools/equipments for assessment?
                </Typography>
              </Grid>
              <Grid item size={{ xs: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formik.values.toolsAdequate}
                  onChange={(e) =>
                    formik.setFieldValue("toolsAdequate", e.target.value)
                  }
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>

              {/* Plan to Buy Question */}
              <Grid item size={{ xs: 12, md: 6 }}>
                <Typography>
                  (If not adequate, do you have plan to buy more?)
                </Typography>
              </Grid>
              <Grid item size={{ xs: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formik.values.planToBuy}
                  onChange={(e) =>
                    formik.setFieldValue("planToBuy", e.target.value)
                  }
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
          {/* ===== Section: Human Resources ===== */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Human Resources (Assessor & Supporting Staffs)
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2} alignItems="center">
              {/* Header Row */}
              <Grid item size={{ xs: 2, md: 2 }}>
                <Typography fontWeight={600}>Full Name</Typography>
              </Grid>
              <Grid item size={{ xs: 1, md: 1 }}>
                <Typography fontWeight={600}>Gender</Typography>
              </Grid>
              <Grid item size={{ xs: 2, md: 2 }}>
                <Typography fontWeight={600}>Qualification</Typography>
              </Grid>
              <Grid item size={{ xs: 2, md: 2 }}>
                <Typography fontWeight={600}>Work Experience</Typography>
              </Grid>
              <Grid item size={{ xs: 2, md: 2 }}>
                <Typography fontWeight={600}>Job Type</Typography>
              </Grid>
              <Grid item size={{ xs: 2, md: 2 }}>
                <Typography fontWeight={600}>Nationality</Typography>
              </Grid>
              <Grid item size={{ xs: 1, md: 1 }}></Grid>

              {/* Dynamic Rows */}
              {formik.values.humanResources.map((staff, index) => (
                <React.Fragment key={index}>
                  <Grid item size={{ xs: 2, md: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={staff.fullName}
                      onChange={(e) => {
                        const updated = [...formik.values.humanResources];
                        updated[index].fullName = e.target.value;
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 1, md: 1 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={staff.gender}
                      onChange={(e) => {
                        const updated = [...formik.values.humanResources];
                        updated[index].gender = e.target.value;
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 2, md: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={staff.qualification}
                      onChange={(e) => {
                        const updated = [...formik.values.humanResources];
                        updated[index].qualification = e.target.value;
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 2, md: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={staff.workExperience}
                      onChange={(e) => {
                        const updated = [...formik.values.humanResources];
                        updated[index].workExperience = e.target.value;
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 2, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={staff.jobType}
                      onChange={(e) => {
                        const updated = [...formik.values.humanResources];
                        updated[index].jobType = e.target.value;
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Full Time">Full Time</MenuItem>
                      <MenuItem value="Part Time">Part Time</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 2, md: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={staff.nationality}
                      onChange={(e) => {
                        const updated = [...formik.values.humanResources];
                        updated[index].nationality = e.target.value;
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item size={{ xs: 1, md: 1 }}>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                      onClick={() => {
                        const updated = [...formik.values.humanResources];
                        updated.splice(index, 1);
                        formik.setFieldValue("humanResources", updated);
                      }}
                      disabled={loading}
                      sx={{
                        minWidth: "auto",
                        px: 1.5,
                        py: 0.5,
                        fontSize: "0.75rem",
                        borderRadius: 1,
                        textTransform: "none",
                      }}
                    >
                      Remove
                    </Button>
                  </Grid>
                </React.Fragment>
              ))}

              {/* Add More Button */}
              <Grid item size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const updated = [...formik.values.humanResources];
                    updated.push({
                      fullName: "",
                      gender: "",
                      qualification: "",
                      workExperience: "",
                      jobType: "",
                      nationality: "",
                    });
                    formik.setFieldValue("humanResources", updated);
                  }}
                  disabled={loading}
                >
                  Add More
                </Button>
              </Grid>
            </Grid>
          </Paper>
          {/* ===== Section: Assessor-Assessee Ratio ===== */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Assessor-Assessee Ratio
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2} alignItems="flex-start">
              {/* Dropdown */}
              <Grid item size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Please tick the relevant one:
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formik.values.assessorRatio}
                  onChange={(e) =>
                    formik.setFieldValue("assessorRatio", e.target.value)
                  }
                  disabled={loading}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="1:10">1:10</MenuItem>
                  <MenuItem value="1:15">1:15</MenuItem>
                  <MenuItem value="1:20">1:20</MenuItem>
                </TextField>
              </Grid>

              {/* Reason Textarea */}
              <Grid item size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Specify why?"
                  value={formik.values.assessorRatioReason}
                  onChange={(e) =>
                    formik.setFieldValue("assessorRatioReason", e.target.value)
                  }
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Section: Supporting Documents ===== */}
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

            {/* Instructions */}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please upload the following documents:
            </Typography>

            <Box
              component="ol"
              sx={{
                pl: 3,
                mb: 2,
                "& li": {
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  mb: 0.5,
                },
              }}
            >
              <li>
                Photocopy of academic / technical / professional certificate
              </li>
              <li>Work experience letter from past employer(s)</li>
              <li>Copy of work permit (only for Non-Bhutanese)</li>
              <li>One passport size photograph</li>
              <li>CV/Resume with all training details</li>
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 2,
                border: "1px dashed #bdbdbd",
                borderRadius: 2,
                minHeight: 100,
              }}
            >
              <FileUplaod
                files={formik.values.supportingDocuments}
                onFilesChange={(files) =>
                  formik.setFieldValue("supportingDocuments", files)
                }
                disabled={loading}
              />
            </Box>
          </Paper>

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
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
              disabled={loading}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="contained"
              color="error"
              startIcon={<LockResetIcon />}
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
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

export default AssessmentCentre;
