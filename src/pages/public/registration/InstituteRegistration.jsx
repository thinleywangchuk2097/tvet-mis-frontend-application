import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Radio,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VerifiedIcon from "@mui/icons-material/Verified";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import FileUpload from "../../../components/file/FileUplaod";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/CommonService";
import InstituteProposalService from "../../../api/services/InstituteProposalService";
import InstituteRegistrationService from "../../../api/services/InstituteRegistrationService";
import { useParams } from "react-router-dom";

// Constants
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

const REQUIRED_FIELDS = [
  "instituteName",
  "sector",
  "dzongkhag",
  "location",
  "telephone",
  "mobile",
  "email",
  "ownershipType",
  "bhutaneseEmployees",
  "nonBhutaneseEmployees",
  "businessLicenseNo",
  "keyContactName",
  "keyContactDesignation",
  "keyContactMobileNo",
];

const TRAINER_FIELDS = [
  "nationality",
  "name",
  "gender",
  "qualification",
  "experience",
  "type",
];

const COURSE_FIELDS = [
  "courseTitle",
  "theoryHours",
  "practicalHours",
  "ojtHours",
  "feesPerTrainee",
  "enrollmentCapacity",
  "courseLevel",
];

// Validation Schema
const validationSchema = Yup.object({
  instituteName: Yup.string().required(
    "Name of Training Provider / Institution is required",
  ),
  sector: Yup.string().required("Sector is required"),
  dzongkhag: Yup.string().required("Dzongkhag is required"),
  location: Yup.string().required("Location of the Institute is required"),
  telephone: Yup.string()
    .matches(/^[0-9]{8,15}$/, "Invalid telephone number")
    .required("Telephone No is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{8}$/, "Invalid mobile number")
    .required("Mobile No is required"),
  email: Yup.string()
    .email("Invalid email")
    .required("Email Address is required"),
  website: Yup.string().url("Invalid website URL").nullable(),
  ownershipType: Yup.string().required("Type of Ownership is required"),
  bhutaneseEmployees: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Cannot be negative")
    .required("Bhutanese Nationals count is required"),
  nonBhutaneseEmployees: Yup.number()
    .typeError("Enter a valid number")
    .min(0, "Cannot be negative")
    .required("Non Bhutanese count is required"),
  businessLicenseNo: Yup.string().required("Business License No is required"),
  keyContactName: Yup.string().required(
    "Name of key contact person is required",
  ),
  keyContactDesignation: Yup.string().required(
    "Designation of key contact person is required",
  ),
  keyContactMobileNo: Yup.string()
    .matches(/^[0-9]{8}$/, "Invalid mobile number")
    .required("Key Contact Person Mobile No is required"),

  trainers: Yup.array()
    .of(
      Yup.object({
        nationality: Yup.string().required("Nationality is required"),
        cid: Yup.string().nullable(),
        workPermit: Yup.string().nullable(),
        name: Yup.string().required("Name is required"),
        gender: Yup.string().required("Gender is required"),
        qualification: Yup.string().required("Qualification is required"),
        experience: Yup.number()
          .typeError("Enter a valid number")
          .min(0, "Experience cannot be negative")
          .required("Experience is required"),
        type: Yup.string().required("Employment type is required"),
      }).test(
        "cid-or-workpermit",
        "CID is required for Bhutanese nationals or Work Permit is required for Non-Bhutanese nationals",
        function (value) {
          const { nationality, cid, workPermit } = value;
          if (nationality === "Bhutanese") {
            return cid && cid.length > 0 && /^[0-9]{11}$/.test(cid);
          }
          if (nationality === "Non-Bhutanese") {
            return workPermit && workPermit.length > 0;
          }
          return true;
        },
      ),
    )
    .min(1, "At least one trainer is required"),

  courses: Yup.array()
    .of(
      Yup.object({
        courseTitle: Yup.string().required("Course Title is required"),
        theoryHours: Yup.number()
          .typeError("Enter a valid number")
          .min(0, "Hours cannot be negative")
          .required("Theory Hours is required"),
        practicalHours: Yup.number()
          .typeError("Enter a valid number")
          .min(0, "Hours cannot be negative")
          .required("Practical Hours is required"),
        ojtHours: Yup.number()
          .typeError("Enter a valid number")
          .min(0, "Hours cannot be negative")
          .required("OJT Hours is required"),
        feesPerTrainee: Yup.number()
          .typeError("Enter a valid number")
          .min(0, "Fees cannot be negative")
          .required("Fees per Trainee is required"),
        enrollmentCapacity: Yup.number()
          .typeError("Enter a valid number")
          .min(1, "Capacity must be at least 1")
          .required("Enrollment Capacity per Batch is required"),
        courseLevel: Yup.string().required("Level Certificate/Diploma is required"),
      }),
    )
    .min(1, "At least one course is required"),

  files: Yup.array().min(1, "Upload at least one document"),
});

const initialTrainer = {
  nationality: "",
  cid: "",
  workPermit: "",
  name: "",
  gender: "",
  qualification: "",
  experience: "",
  type: "",
};

const initialCourse = {
  courseTitle: "",
  theoryHours: "",
  practicalHours: "",
  ojtHours: "",
  feesPerTrainee: "",
  enrollmentCapacity: "",
  courseLevel: "",
};

const InstituteRegistration = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [applicationFound, setApplicationFound] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [qualitySelections, setQualitySelections] = useState({});
  const [qualityData, setQualityData] = useState([]);
  const [applicationNo, setApplicationNo] = useState();
  const [sectors, setSectors] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [nationality, setNationality] = useState([]);
  const [gender, setGender] = useState([]);
  const [jobType, setJobType] = useState([]);
  const [certificateLevel, setCertificateLevel] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [yesNoOption, setYesNoOption] = useState([]);
  const [trainerError, setTrainerError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [serviceName, setServiceName] = useState();
  const [pendingMappings, setPendingMappings] = useState({
    sectorId: null,
    dzongkhagId: null,
  });
  const { serviceId } = useParams();

  useEffect(() => {
    fetchServiceName();
  }, [serviceId]);

  const fetchServiceName = async () => {
    try {
      const response = await CommonService.getServiceName(serviceId);
      setServiceName(response.data.serviceName);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };
  
  // File to Base64 conversion function
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

  // Memoized dropdown options - Store both id and name
  const sectorOptions = useMemo(
    () =>
      sectors.map((s) => ({
        id: s.id,
        value: s.id,
        label: s.sectorName,
      })),
    [sectors],
  );

  const dzongkhagOptions = useMemo(
    () =>
      dzongkhags.map((d) => ({
        id: d.id,
        value: d.id,
        label: d.dzonkhagName,
      })),
    [dzongkhags],
  );

  const ownershipOptions = useMemo(
    () =>
      ownershipTypes.map((o) => ({
        id: o.id,
        value: o.name,
        label: o.name,
      })),
    [ownershipTypes],
  );

  const nationalityOptions = useMemo(
    () =>
      nationality.map((n) => ({
        id: n.id,
        value: n.name,
        label: n.name,
      })),
    [nationality],
  );

  const genderOptions = useMemo(
    () =>
      gender.map((g) => ({
        id: g.id,
        value: g.name,
        label: g.name,
      })),
    [gender],
  );

  const jobTypeOptions = useMemo(
    () =>
      jobType.map((j) => ({
        id: j.id,
        value: j.name,
        label: j.name,
      })),
    [jobType],
  );

  const certificateLevelOptions = useMemo(
    () =>
      certificateLevel.map((c) => ({
        id: c.id,
        value: c.name,
        label: c.name,
      })),
    [certificateLevel],
  );

  const yesNoOptions = useMemo(
    () =>
      yesNoOption.map((yn) => ({
        id: yn.id,
        value: yn.id,
        label: yn.name,
      })),
    [yesNoOption],
  );

  // Helper function to get ID from name
  const getIdFromName = (name, options) => {
    const option = options.find((opt) => opt.label === name);
    return option ? option.id : null;
  };

  // Formik
  const formik = useFormik({
    initialValues: {
      instituteName: "",
      sector: "",
      dzongkhag: "",
      location: "",
      telephone: "",
      mobile: "",
      email: "",
      website: "",
      ownershipType: "",
      bhutaneseEmployees: "",
      nonBhutaneseEmployees: "",
      businessLicenseNo: "",
      keyContactName: "",
      keyContactDesignation: "",
      keyContactMobileNo: "",
      trainers: [{ ...initialTrainer }],
      courses: [{ ...initialCourse }],
      files: [],
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        // Convert files to base64 format
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        // Prepare the submit data with converted documents
        const submitData = {
          applicationNo: applicationNo,
          instituteName: values.instituteName,
          dzongkhagId: values.dzongkhag,
          exactLocation: values.location,
          emailId: values.email,
          mobileNo: values.mobile,
          sectorId: values.sector,
          telephoneNo: values.telephone,
          website: values.website || null,
          ownershipTypeId: getIdFromName(
            values.ownershipType,
            ownershipOptions,
          ),
          bhutaneseEmployees: parseInt(values.bhutaneseEmployees) || 0,
          nonBhutaneseEmployees: parseInt(values.nonBhutaneseEmployees) || 0,
          businessLicenseNo: values.businessLicenseNo,
          keyContactName: values.keyContactName,
          keyContactDesignation: values.keyContactDesignation,
          keyContactMobileNo: values.keyContactMobileNo,
          trainers: values.trainers.map((trainer) => ({
            nationalityId: getIdFromName(
              trainer.nationality,
              nationalityOptions,
            ),
            cid: trainer.cid || null,
            workPermit: trainer.workPermit || null,
            name: trainer.name,
            genderId: getIdFromName(trainer.gender, genderOptions),
            qualification: trainer.qualification,
            experience: parseInt(trainer.experience) || 0,
            typeId: getIdFromName(trainer.type, jobTypeOptions),
          })),
          courses: values.courses.map((course) => ({
            courseTitle: course.courseTitle,
            theoryHours: parseInt(course.theoryHours) || 0,
            practicalHours: parseInt(course.practicalHours) || 0,
            ojtHours: parseInt(course.ojtHours) || 0,
            feesPerTrainee: parseInt(course.feesPerTrainee) || 0,
            enrollmentCapacity: parseInt(course.enrollmentCapacity) || 0,
            courseLevelId: getIdFromName(
              course.courseLevel,
              certificateLevelOptions,
            ),
          })),
          serviceId: serviceId,
          assignedRoleId: 7,
          statusId: 55, // Submitted statusId
          userId: null,
          documents: documents,
          qualityStandards: qualitySelections,
        };

        const response =
          await InstituteRegistrationService.registerInstitute(submitData);

        if (response.status === 201 || response.status === 200) {
          toast.success("Institute Registration submitted successfully!");
          resetForm();
          setQualitySelections({});
          setTabValue(0);
          setTrainerError("");
          setCourseError("");
          setPendingMappings({ sectorId: null, dzongkhagId: null });
          setApplicationFound(false);
          setSearchValue("");
          setApplicationNo(null);
        } else {
          toast.error("Submission failed. Please try again.");
        }
      } catch (error) {
        console.error("Submission error:", error);
        toast.error(error.message || "Submission failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  // API Calls
  const fetchData = useCallback(async () => {
    try {
      const [
        qualityRes,
        sectorsRes,
        dzongkhagsRes,
        ownershipRes,
        nationalityRes,
        genderRes,
        jobTypeRes,
        certificateLevelRes,
        yesNoRes,
      ] = await Promise.all([
        CommonService.getAllQualitystandards(),
        CommonService.getAllSectors(),
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(7),
        CommonService.getByParentId(9), // Nationality
        CommonService.getByParentId(8), // Gender
        CommonService.getByParentId(11), // Job Type
        CommonService.getByParentId(10), // Certificate Level
        CommonService.getByParentId(12), // Yes/No Option for Quality Standards
      ]);

      if (qualityRes.data) {
        const mainCategories = qualityRes.data.filter(
          (item) => item.parentId === 0,
        );
        const subCategories = qualityRes.data.filter(
          (item) => item.parentId !== 0,
        );
        const structured = mainCategories.map((category) => ({
          id: category.id.toString(),
          title: category.dropdownName || category.description,
          rows: subCategories
            .filter((sub) => sub.parentId === category.id)
            .map((sub) => ({
              id: sub.id.toString(),
              value: sub.dropdownName || sub.description,
            })),
        }));
        setQualityData(structured);
      }

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);
      setNationality(nationalityRes.data || []);
      setGender(genderRes.data || []);
      setJobType(jobTypeRes.data || []);
      setCertificateLevel(certificateLevelRes.data || []);
      setYesNoOption(yesNoRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error loading form data");
    }
  }, []);

  const fetchApplicationDetails = useCallback(
    async (applicationNo) => {
      try {
        const response =
          await InstituteProposalService.getInstituteDetailsByApplicationNo(
            applicationNo,
          );
        if (!response.data?.length) {
          setApplicationFound(false);
          toast.error("No application found");
          return;
        }

        const app = response.data[0];
        const updates = {
          instituteName: app.proposed_institute_name || "",
          location: app.exact_location || "",
          telephone: app.telephone_no || "",
          mobile: app.mobile_no || "",
          email: app.email_id || "",
        };

        formik.setValues({ ...formik.values, ...updates });

        // Handle mappings
        const newMappings = { sectorId: null, dzongkhagId: null };
        if (app.sector_id) {
          const sectorId = parseInt(app.sector_id);
          const sector = sectors.find((s) => s.id === sectorId);
          if (sector) formik.setFieldValue("sector", sector.id);
          else newMappings.sectorId = sectorId;
        }

        if (app.dzongkhag_id) {
          const dzongkhagId = parseInt(app.dzongkhag_id);
          const dzongkhag = dzongkhags.find((d) => d.id === dzongkhagId);
          if (dzongkhag) formik.setFieldValue("dzongkhag", dzongkhag.id);
          else newMappings.dzongkhagId = dzongkhagId;
        }

        // If there are quality standards from the application, they should already have IDs
        if (app.quality_standards) {
          setQualitySelections(app.quality_standards);
        }

        setPendingMappings(newMappings);
        setApplicationFound(true);
      } catch (error) {
        console.error("Error fetching application details:", error);
        setApplicationFound(false);
        toast.error("Error fetching application details");
      }
    },
    [sectors, dzongkhags, formik],
  );

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (pendingMappings.sectorId && sectors.length) {
      const sector = sectors.find((s) => s.id === pendingMappings.sectorId);
      if (sector) {
        formik.setFieldValue("sector", sector.sectorName);
        setPendingMappings((prev) => ({ ...prev, sectorId: null }));
      }
    }
  }, [sectors, pendingMappings.sectorId, formik]);

  useEffect(() => {
    if (pendingMappings.dzongkhagId && dzongkhags.length) {
      const dzongkhag = dzongkhags.find(
        (d) => d.id === pendingMappings.dzongkhagId,
      );
      if (dzongkhag) {
        formik.setFieldValue("dzongkhag", dzongkhag.dzonkhagName);
        setPendingMappings((prev) => ({ ...prev, dzongkhagId: null }));
      }
    }
  }, [dzongkhags, pendingMappings.dzongkhagId, formik]);

  //Search Handler
  const handleSearch = async () => {
    const trimmedValue = searchValue.trim();
    if (!trimmedValue) return toast.error("Please enter Application No");
    setLoading(true);
    try {
      const { status, data } = await InstituteRegistrationService.getApplicationExistOrNot(trimmedValue);
      
      if (status === 200) {
        toast.info(data.message);
        
        if (data.data?.proposalStatusId === 57 && data.data?.registrationStatusId === null) {
          await fetchApplicationDetails(trimmedValue);
        }
        
        setApplicationNo(trimmedValue);
      } else {
        toast.error("No application found with this number");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    formik.resetForm();
    setQualitySelections({});
    setTabValue(0);
    setTrainerError("");
    setCourseError("");
    setPendingMappings({ sectorId: null, dzongkhagId: null });
    toast.info("Form has been reset");
  };

  const handleRadioChange = (standardId, rowId, valueId) => {
    setQualitySelections((prev) => ({
      ...prev,
      [standardId]: {
        ...prev[standardId],
        [rowId]: valueId,
      },
    }));
  };

  const handleAddTrainer = () => {
    const trainers = formik.values.trainers;
    const lastTrainer = trainers[trainers.length - 1];

    const isComplete =
      TRAINER_FIELDS.every((field) => lastTrainer[field]) &&
      (lastTrainer.nationality !== "Bhutanese" || lastTrainer.cid) &&
      (lastTrainer.nationality !== "Non-Bhutanese" || lastTrainer.workPermit);

    if (!isComplete) {
      setTrainerError(
        "Please fill all fields for the current trainer before adding a new one",
      );
      return;
    }

    setTrainerError("");
    formik.setFieldValue("trainers", [...trainers, { ...initialTrainer }]);
  };

  const handleDeleteTrainer = (index) => {
    const updated = formik.values.trainers.filter((_, i) => i !== index);
    formik.setFieldValue("trainers", updated);
  };

  const handleAddCourse = () => {
    const courses = formik.values.courses;
    const lastCourse = courses[courses.length - 1];

    const isComplete = COURSE_FIELDS.every((field) => lastCourse[field]);

    if (!isComplete) {
      setCourseError(
        "Please fill all required fields for the current course before adding a new one",
      );
      return;
    }

    setCourseError("");
    formik.setFieldValue("courses", [...courses, { ...initialCourse }]);
  };

  const handleDeleteCourse = (index) => {
    const updated = formik.values.courses.filter((_, i) => i !== index);
    formik.setFieldValue("courses", updated);
  };

  // Check if all quality standards are set to "Yes"
  const areAllQualityStandardsYes = useMemo(() => {
    const yesOption = yesNoOptions.find((opt) => opt.label === "Yes");
    if (!yesOption || qualityData.length === 0) return false;

    // Check only first 3 standards
    const firstThreeStandards = qualityData.slice(0, 3);
    
    for (const standard of firstThreeStandards) {
      for (const row of standard.rows) {
        const selectedValue = qualitySelections[standard.id]?.[row.id];
        if (selectedValue !== yesOption.id) {
          return false;
        }
      }
    }
    return true;
  }, [qualitySelections, qualityData, yesNoOptions]);

  // Validation helpers - Submit button enabled only when all quality standards are "Yes"
  const isSubmitEnabled = useMemo(() => {
    if (!formik.isValid) return false;

    const allRequiredFilled = REQUIRED_FIELDS.every(
      (field) =>
        formik.values[field] !== "" &&
        formik.values[field] !== null &&
        formik.values[field] !== undefined,
    );

    const trainersValid =
      formik.values.trainers.length > 0 &&
      formik.values.trainers.every(
        (_, index) => !formik.errors.trainers?.[index],
      );

    const coursesValid =
      formik.values.courses.length > 0 &&
      formik.values.courses.every(
        (_, index) => !formik.errors.courses?.[index],
      );

    return (
      allRequiredFilled &&
      areAllQualityStandardsYes &&
      formik.values.files?.length > 0 &&
      trainersValid &&
      coursesValid
    );
  }, [
    formik.isValid,
    formik.values,
    formik.errors,
    areAllQualityStandardsYes,
  ]);

  const renderChecklist = (standard) => {
    const yesOption = yesNoOptions.find((opt) => opt.label === "Yes");
    const noOption = yesNoOptions.find((opt) => opt.label === "No");

    return (
      <Grid item xs={12} key={standard.id}>
        <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }} mb={1}>
            {standard.title}
          </Typography>
          <TableContainer>
            <Table size="small" sx={TABLE_STYLE}>
              <TableHead>
                <TableRow>
                  <TableCell width="60">Sl. No</TableCell>
                  <TableCell>Quality Indicator <span style={{ color: "red" }}>*</span></TableCell>
                  <TableCell align="center" width="100">YES</TableCell>
                  <TableCell align="center" width="100">NO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {standard.rows.map((row, index) => {
                  const selectedValue =
                    qualitySelections[standard.id]?.[row.id];

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={selectedValue === yesOption?.id}
                          onChange={() =>
                            handleRadioChange(
                              standard.id,
                              row.id,
                              yesOption?.id,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={selectedValue === noOption?.id}
                          onChange={() =>
                            handleRadioChange(standard.id, row.id, noOption?.id)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 1, minHeight: "100vh" }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          {serviceName}
        </Typography>

        {/* Search */}
        <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              label={
                <span>
                  Search By Application No{" "}
                  <span style={{ color: "red" }}>*</span>
                </span>
              }
              fullWidth
              size="small"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{ height: 38, px: 3, textTransform: "none", fontWeight: 600 }}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Grid>
        </Grid>

        {applicationFound && (
          <>
            <Divider />
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              variant="fullWidth"
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
              }}
            >
              <Tab icon={<BusinessIcon />} label="Institute Details" />
              <Tab icon={<SchoolIcon />} label="Trainer Details" />
              <Tab icon={<MenuBookIcon />} label="Course Details" />
              <Tab icon={<VerifiedIcon />} label="Quality Standards" />
              <Tab icon={<FileOpenIcon />} label="Supporting Documents" />
            </Tabs>

            {/* Institute Details */}
            {tabValue === 0 && (
              <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
                <Grid container spacing={2}>
                  {/* Institute Name */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="instituteName"
                      label={
                        <span>
                          Name of Training Provider / Institution{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.instituteName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.instituteName &&
                        Boolean(formik.errors.instituteName)
                      }
                      helperText={
                        formik.touched.instituteName &&
                        formik.errors.instituteName
                      }
                    />
                  </Grid>

                  {/* Sector */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      name="sector"
                      label={
                        <span>
                          Sector <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.sector}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.sector && Boolean(formik.errors.sector)
                      }
                      helperText={formik.touched.sector && formik.errors.sector}
                    >
                      {sectorOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Dzongkhag */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      name="dzongkhag"
                      label={
                        <span>
                          Dzongkhag <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.dzongkhag}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.dzongkhag &&
                        Boolean(formik.errors.dzongkhag)
                      }
                      helperText={
                        formik.touched.dzongkhag && formik.errors.dzongkhag
                      }
                    >
                      {dzongkhagOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Location */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="location"
                      label={
                        <span>
                          Location of the Institute{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.location}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.location &&
                        Boolean(formik.errors.location)
                      }
                      helperText={
                        formik.touched.location && formik.errors.location
                      }
                    />
                  </Grid>

                  {/* Telephone */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="telephone"
                      label={
                        <span>
                          Telephone No <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.telephone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.telephone &&
                        Boolean(formik.errors.telephone)
                      }
                      helperText={
                        formik.touched.telephone && formik.errors.telephone
                      }
                    />
                  </Grid>

                  {/* Mobile */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="mobile"
                      label={
                        <span>
                          Mobile No <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.mobile}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.mobile && Boolean(formik.errors.mobile)
                      }
                      helperText={formik.touched.mobile && formik.errors.mobile}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="email"
                      label={
                        <span>
                          Email Id <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.email && Boolean(formik.errors.email)
                      }
                      helperText={formik.touched.email && formik.errors.email}
                    />
                  </Grid>

                  {/* Website */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="website"
                      label="Website Address"
                      value={formik.values.website}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.website && Boolean(formik.errors.website)
                      }
                      helperText={
                        formik.touched.website && formik.errors.website
                      }
                    />
                  </Grid>

                  {/* Business License No */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="businessLicenseNo"
                      label={
                        <span>
                          Business License No{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.businessLicenseNo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.businessLicenseNo &&
                        Boolean(formik.errors.businessLicenseNo)
                      }
                      helperText={
                        formik.touched.businessLicenseNo &&
                        formik.errors.businessLicenseNo
                      }
                    />
                  </Grid>

                  {/* Ownership Type */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      name="ownershipType"
                      label={
                        <span>
                          Type of Ownership{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.ownershipType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.ownershipType &&
                        Boolean(formik.errors.ownershipType)
                      }
                      helperText={
                        formik.touched.ownershipType &&
                        formik.errors.ownershipType
                      }
                    >
                      {ownershipOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Bhutanese Employees */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      type="number"
                      fullWidth
                      size="small"
                      name="bhutaneseEmployees"
                      label={
                        <span>
                          Total Number of Bhutanese Employees{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.bhutaneseEmployees}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.bhutaneseEmployees &&
                        Boolean(formik.errors.bhutaneseEmployees)
                      }
                      helperText={
                        formik.touched.bhutaneseEmployees &&
                        formik.errors.bhutaneseEmployees
                      }
                    />
                  </Grid>

                  {/* Non Bhutanese Employees */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      type="number"
                      fullWidth
                      size="small"
                      name="nonBhutaneseEmployees"
                      label={
                        <span>
                          Total Number of Non Bhutanese Employees{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.nonBhutaneseEmployees}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.nonBhutaneseEmployees &&
                        Boolean(formik.errors.nonBhutaneseEmployees)
                      }
                      helperText={
                        formik.touched.nonBhutaneseEmployees &&
                        formik.errors.nonBhutaneseEmployees
                      }
                    />
                  </Grid>

                  {/* Key Contact Person Name */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="keyContactName"
                      label={
                        <span>
                          Key Contact Person Name{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.keyContactName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.keyContactName &&
                        Boolean(formik.errors.keyContactName)
                      }
                      helperText={
                        formik.touched.keyContactName &&
                        formik.errors.keyContactName
                      }
                    />
                  </Grid>

                  {/* Key Contact Person Designation */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="keyContactDesignation"
                      label={
                        <span>
                          Key Contact Person Designation{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.keyContactDesignation}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.keyContactDesignation &&
                        Boolean(formik.errors.keyContactDesignation)
                      }
                      helperText={
                        formik.touched.keyContactDesignation &&
                        formik.errors.keyContactDesignation
                      }
                    />
                  </Grid>

                  {/* Key Contact Person Mobile No */}
                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      name="keyContactMobileNo"
                      label={
                        <span>
                          Key Contact Person Mobile No{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={formik.values.keyContactMobileNo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.keyContactMobileNo &&
                        Boolean(formik.errors.keyContactMobileNo)
                      }
                      helperText={
                        formik.touched.keyContactMobileNo &&
                        formik.errors.keyContactMobileNo
                      }
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Trainer Details */}
            {tabValue === 1 && (
              <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
                <Grid container spacing={3}>
                  {formik.values.trainers.map((trainer, index) => (
                    <Grid item size={{ xs: 12 }} key={index}>
                      <Paper
                        sx={{
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          {/* Nationality */}
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label={
                                <span>
                                  Nationality{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name={`trainers[${index}].nationality`}
                              value={trainer.nationality}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.trainers?.[index]?.nationality &&
                                Boolean(
                                  formik.errors.trainers?.[index]?.nationality,
                                )
                              }
                              helperText={
                                formik.touched.trainers?.[index]?.nationality &&
                                formik.errors.trainers?.[index]?.nationality
                              }
                            >
                              {nationalityOptions.map((opt) => (
                                <MenuItem key={opt.id} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* CID (Conditional) */}
                          {trainer.nationality === "Bhutanese" && (
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label={
                                  <span>
                                    CID <span style={{ color: "red" }}>*</span>
                                  </span>
                                }
                                name={`trainers[${index}].cid`}
                                value={trainer.cid}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.trainers?.[index]?.cid &&
                                  Boolean(formik.errors.trainers?.[index]?.cid)
                                }
                                helperText={
                                  formik.touched.trainers?.[index]?.cid &&
                                  formik.errors.trainers?.[index]?.cid
                                }
                              />
                            </Grid>
                          )}

                          {/* Work Permit (Conditional) */}
                          {trainer.nationality === "Non-Bhutanese" && (
                            <Grid item size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label={
                                  <span>
                                    Work Permit{" "}
                                    <span style={{ color: "red" }}>*</span>
                                  </span>
                                }
                                name={`trainers[${index}].workPermit`}
                                value={trainer.workPermit}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.trainers?.[index]
                                    ?.workPermit &&
                                  Boolean(
                                    formik.errors.trainers?.[index]?.workPermit,
                                  )
                                }
                                helperText={
                                  formik.touched.trainers?.[index]
                                    ?.workPermit &&
                                  formik.errors.trainers?.[index]?.workPermit
                                }
                              />
                            </Grid>
                          )}

                          {/* Name */}
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={
                                <span>
                                  Name <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name={`trainers[${index}].name`}
                              value={trainer.name}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.trainers?.[index]?.name &&
                                Boolean(formik.errors.trainers?.[index]?.name)
                              }
                              helperText={
                                formik.touched.trainers?.[index]?.name &&
                                formik.errors.trainers?.[index]?.name
                              }
                            />
                          </Grid>

                          {/* Gender */}
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label={
                                <span>
                                  Gender <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name={`trainers[${index}].gender`}
                              value={trainer.gender}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.trainers?.[index]?.gender &&
                                Boolean(formik.errors.trainers?.[index]?.gender)
                              }
                              helperText={
                                formik.touched.trainers?.[index]?.gender &&
                                formik.errors.trainers?.[index]?.gender
                              }
                            >
                              {genderOptions.map((opt) => (
                                <MenuItem key={opt.id} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* Qualification */}
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={
                                <span>
                                  Qualification{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name={`trainers[${index}].qualification`}
                              value={trainer.qualification}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.trainers?.[index]
                                  ?.qualification &&
                                Boolean(
                                  formik.errors.trainers?.[index]
                                    ?.qualification,
                                )
                              }
                              helperText={
                                formik.touched.trainers?.[index]
                                  ?.qualification &&
                                formik.errors.trainers?.[index]?.qualification
                              }
                            />
                          </Grid>

                          {/* Experience */}
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              label={
                                <span>
                                  Experience (Years){" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name={`trainers[${index}].experience`}
                              value={trainer.experience}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.trainers?.[index]?.experience &&
                                Boolean(
                                  formik.errors.trainers?.[index]?.experience,
                                )
                              }
                              helperText={
                                formik.touched.trainers?.[index]?.experience &&
                                formik.errors.trainers?.[index]?.experience
                              }
                            />
                          </Grid>

                          {/* Type */}
                          <Grid item size={{ xs: 12, md: 3 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label={
                                <span>
                                  Type <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name={`trainers[${index}].type`}
                              value={trainer.type}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.trainers?.[index]?.type &&
                                Boolean(formik.errors.trainers?.[index]?.type)
                              }
                              helperText={
                                formik.touched.trainers?.[index]?.type &&
                                formik.errors.trainers?.[index]?.type
                              }
                            >
                              {jobTypeOptions.map((opt) => (
                                <MenuItem key={opt.id} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* Delete Button */}
                          {index > 0 && (
                            <Grid item size={{ xs: 12, md: 1 }}>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteTrainer(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}

                  <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                    {trainerError && (
                      <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                        {trainerError}
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddTrainer}
                    >
                      Add Trainer
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Course Details */}
            {tabValue === 2 && (
              <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
                <Grid container spacing={3}>
                  {formik.values.courses.map((course, index) => (
                    <Grid item size={{ xs: 12 }} key={index}>
                      <Paper
                        sx={{
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                          Course {index + 1}
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Course Title */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              size="small"
                              name={`courses[${index}].courseTitle`}
                              label={
                                <span>
                                  Course Title{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.courseTitle}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.courseTitle &&
                                Boolean(formik.errors.courses?.[index]?.courseTitle)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.courseTitle &&
                                formik.errors.courses?.[index]?.courseTitle
                              }
                            />
                          </Grid>

                          {/* Course Level */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              name={`courses[${index}].courseLevel`}
                              label={
                                <span>
                                  Level Certificate / Diploma{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.courseLevel}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.courseLevel &&
                                Boolean(formik.errors.courses?.[index]?.courseLevel)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.courseLevel &&
                                formik.errors.courses?.[index]?.courseLevel
                              }
                            >
                              {certificateLevelOptions.map((opt) => (
                                <MenuItem key={opt.id} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* Theory Hours */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              name={`courses[${index}].theoryHours`}
                              label={
                                <span>
                                  Theory (Hours){" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.theoryHours}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.theoryHours &&
                                Boolean(formik.errors.courses?.[index]?.theoryHours)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.theoryHours &&
                                formik.errors.courses?.[index]?.theoryHours
                              }
                            />
                          </Grid>

                          {/* Practical Hours */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              name={`courses[${index}].practicalHours`}
                              label={
                                <span>
                                  Practical (Hours){" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.practicalHours}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.practicalHours &&
                                Boolean(formik.errors.courses?.[index]?.practicalHours)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.practicalHours &&
                                formik.errors.courses?.[index]?.practicalHours
                              }
                            />
                          </Grid>

                          {/* OJT Hours */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              name={`courses[${index}].ojtHours`}
                              label={
                                <span>
                                  OJT (Hours){" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.ojtHours}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.ojtHours &&
                                Boolean(formik.errors.courses?.[index]?.ojtHours)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.ojtHours &&
                                formik.errors.courses?.[index]?.ojtHours
                              }
                            />
                          </Grid>

                          {/* Fees per Trainee */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              name={`courses[${index}].feesPerTrainee`}
                              label={
                                <span>
                                  Fees per Trainee{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.feesPerTrainee}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.feesPerTrainee &&
                                Boolean(formik.errors.courses?.[index]?.feesPerTrainee)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.feesPerTrainee &&
                                formik.errors.courses?.[index]?.feesPerTrainee
                              }
                            />
                          </Grid>

                          {/* Enrollment Capacity */}
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              name={`courses[${index}].enrollmentCapacity`}
                              label={
                                <span>
                                  Enrollment Capacity per Batch{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              value={course.enrollmentCapacity}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.courses?.[index]?.enrollmentCapacity &&
                                Boolean(formik.errors.courses?.[index]?.enrollmentCapacity)
                              }
                              helperText={
                                formik.touched.courses?.[index]?.enrollmentCapacity &&
                                formik.errors.courses?.[index]?.enrollmentCapacity
                              }
                            />
                          </Grid>

                          {/* Delete Button */}
                          {index > 0 && (
                            <Grid item size={{ xs: 12 }}>
                              <Box display="flex" justifyContent="flex-end">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteCourse(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}

                  <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                    {courseError && (
                      <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                        {courseError}
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddCourse}
                    >
                      Add Course
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Quality Standards */}
            {tabValue === 3 && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item size={{ xs: 12 }}>
                  {qualityData.slice(0, 3).map(renderChecklist)}
                </Grid>
              </Grid>
            )}

            {/* Supporting Documents */}
            {tabValue === 4 && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item size={{ xs: 12 }}>
                  <Paper
                    sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                  >
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
                        Photocopy of business license (Not Applicable for
                        Government Institutes)
                      </li>
                      <li>
                        List of trainees for each course, indicating year of
                        graduation/male/female/CID No
                      </li>
                    </Box>
                    <FileUpload
                      files={formik.values.files}
                      onFilesChange={(files) =>
                        formik.setFieldValue("files", files)
                      }
                    />
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Buttons */}
            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!isSubmitEnabled || loading}
                  onClick={formik.handleSubmit}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} sx={{ color: "#fff" }} />
                    ) : null
                  }
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  color="error"
                  variant="contained"
                  size="small"
                  onClick={handleReset}
                  startIcon={<RotateLeftIcon />}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default InstituteRegistration;