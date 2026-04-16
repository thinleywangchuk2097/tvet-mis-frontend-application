import { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUpload from "../../../components/file/FileUplaod";
import CommonService from "../../../api/services/CommonService";
import CurriculumEndorsementIndexService from "../../../api/services/CurriculumEndorsementIndexService";
import InstituteRegistrationService from "../../../api/services/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../../api/services/ApplyAccreditedCourseService";

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

// Helper function to validate ratio format
const isValidRatio = (value) => {
  if (!value) return false;
  const ratioRegex = /^\d+:\d+$/;
  return ratioRegex.test(value);
};

const ApplyAccreditedCourse = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [occupations, setOccupations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [loadingCurriculumTypes, setLoadingCurriculumTypes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unitLevels, setUnitLevels] = useState([]);
  const [statusList, setStatusList] = useState([]);

  useEffect(() => {
    fetchCurriculumTypes();
    fetchInstituteDetails();
    fetchSectors();
    fetchAppliedCourses();
    fetchUnitLevels();
    fetchStatusList();
  }, []);

  // Fetch occupations when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      fetchOccupationsBySector(selectedSectorId);
    } else {
      setOccupations([]);
    }
  }, [selectedSectorId]);

  const fetchUnitLevels = async () => {
    try {
      const UnitLevels = await CommonService.getByParentId(10);
      setUnitLevels(UnitLevels.data);
      console.log("Unit Levels:", UnitLevels.data);
    } catch (error) {
      console.error("Error fetching unit levels:", error);
    }
  };

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      setStatusList(statusResponse.data);
      console.log("Status List:", statusResponse.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  // Helper function to get status name from ID
  const getStatusName = (statusId) => {
    const status = statusList.find((s) => s.id == statusId);
    return status ? status.name : "Pending";
  };

  // Helper function to get sector name from ID
  const getSectorName = (sector_id) => {
    const sector = sectors.find((s) => s.id == sector_id);
    return sector ? sector.sectorName : sector_id;
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instituteData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setInstituteDetails(instituteData);
      console.log("Institute Details:", instituteData);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchAppliedCourses = async () => {
    try {
      const response =
        await ApplyAccreditedCourseService.getAccreditedCourseDetailsByUserId(
          registration_no,
          access_token,
        );
      console.log("Applied Courses Response:", response.data);
      if (response.data) {
        const mappedCourses = response.data.map((course, index) => ({
          id: course.id || index,
          applicationNo: course.application_no,
          courseId: course.course_id,
          course_name: course.course_name, // Direct from API
          sectorId: course.sector_id,
          courseFee: course.course_fee,
          statusId: course.status_id,
          classNo: course.class_no,
          workshopNo: course.workshop_no,
          trainingLabNo: course.training_lab_no,
          equipmentTool: course.equipment_tool,
          firstAidFacility: course.first_aid_facility,
          toiletFacility: course.toilet_facility,
          lightingPower: course.lighting_power,
          fireSafety: course.fire_safety,
          trainerTraineeRatioTheory: course.trainer_trainee_ratio_theory,
          trainerTraineeRatioPractical: course.trainer_trainee_ratio_practical,
          maxNoTrainees: course.max_no_trainees,
          presentNoTrainee: course.present_no_trainee,
          curriculum_type_id: course.curriculum_type_id,
          registration_no: course.registration_no,
          proposed_institute_name: course.proposed_institute_name,
          institute_id: course.institute_id,
          // Store the raw JSON strings for parsing in view mode
          certifications: course.certifications,
          curriculums: course.curriculums,
          trainers: course.trainers,
          ...course,
        }));
        setCourses(mappedCourses);
      }
    } catch (error) {
      console.error("Error fetching applied courses:", error);
      setCourses([]);
    }
  };

  const fetchSectors = async () => {
    try {
      const sectorDtls = await CommonService.getAllSectors();
      console.log("Sectors:", sectorDtls.data);
      setSectors(sectorDtls.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    setLoadingOccupations(true);
    try {
      const occupationLists =
        await CommonService.getOccupationsBySectorId(sectorId);
      console.log("Occupations (Courses):", occupationLists.data);
      setOccupations(occupationLists.data);
    } catch (error) {
      console.error("Error fetching occupations:", error);
      setOccupations([]);
      toast.error("Failed to fetch courses for selected sector");
    } finally {
      setLoadingOccupations(false);
    }
  };

  const fetchCurriculumTypes = async () => {
    setLoadingCurriculumTypes(true);
    try {
      const response =
        await CurriculumEndorsementIndexService.getApprovedCurriculumDataByUserId(
          registration_no,
          41,
          access_token,
        );
      setCurriculumTypes(response.data);
      console.log("Curriculum Types:", response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
      toast.error("Failed to fetch curriculum types");
    } finally {
      setLoadingCurriculumTypes(false);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredCourses = courses.filter(
    (c) =>
      (c.course_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.applicationNo?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (getSectorName(c.sector_id)?.toLowerCase() || "").includes(
        search.toLowerCase(),
      ),
  );

  const handleView = (course) => {
    setSelectedCourse(course);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setDialogMode("add");
    setSelectedSectorId("");
    setOccupations([]);
    setOpenDialog(true);
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const getInitialValues = () => {
    if (dialogMode === "view" && selectedCourse) {
      // Parse JSON strings from API response
      let parsedCertifications = [];
      let parsedCurriculums = [];
      let parsedTrainers = [];

      try {
        parsedCertifications = selectedCourse.certifications
          ? JSON.parse(selectedCourse.certifications)
          : [];
      } catch (e) {
        console.error("Error parsing certifications:", e);
        parsedCertifications = [];
      }

      try {
        parsedCurriculums = selectedCourse.curriculums
          ? JSON.parse(selectedCourse.curriculums)
          : [];
      } catch (e) {
        console.error("Error parsing curriculums:", e);
        parsedCurriculums = [];
      }

      try {
        parsedTrainers = selectedCourse.trainers
          ? JSON.parse(selectedCourse.trainers)
          : [];
      } catch (e) {
        console.error("Error parsing trainers:", e);
        parsedTrainers = [];
      }

      return {
        registrationNo:
          instituteDetails?.registration_no ||
          selectedCourse.registration_no ||
          "",
        instituteName:
          instituteDetails?.proposed_institute_name ||
          selectedCourse.proposed_institute_name ||
          "",
        instituteId:
          instituteDetails?.institute_id || selectedCourse.institute_id || "",
        curriculumTypeId: selectedCourse.curriculum_type_id || "",
        sectorId: selectedCourse.sector_id || "",
        courseId: selectedCourse.course_id || "",
        courseName: selectedCourse.course_name || "", // Store course name separately for display
        courseFee: selectedCourse.course_fee || "",
        modules:
          parsedCertifications.length > 0
            ? parsedCertifications.map((cert) => ({
                ncsCode: cert.certificationCode || "",
                unitName: cert.certificationModule || "",
                unitLevel: cert.certificationLevelId || "",
              }))
            : [
                {
                  ncsCode: "",
                  unitName: "",
                  unitLevel: "",
                },
              ],
        curriculum:
          parsedCurriculums.length > 0
            ? parsedCurriculums.map((curr) => ({
                moduleNo: curr.moduleNo || "",
                moduleName: curr.moduleName || "",
                moduleCode: curr.ncsCode || "",
                theoryDuration: curr.theoryHour || "",
                practicalDuration: curr.practicalHour || "",
                ojtHrs: curr.ojtHour || "",
              }))
            : [
                {
                  moduleNo: "",
                  moduleName: "",
                  moduleCode: "",
                  theoryDuration: "",
                  practicalDuration: "",
                  ojtHrs: "",
                },
              ],
        trainingFacilities: {
          noOfClass: selectedCourse.class_no || "",
          noOfWorkshops: selectedCourse.workshop_no || "",
          noOfTrainingLab: selectedCourse.training_lab_no || "",
        },
        otherFacilities: {
          trainingTools: selectedCourse.equipment_tool || "",
          firstAid: selectedCourse.first_aid_facility || "",
          toilet: selectedCourse.toilet_facility || "",
          lighting: selectedCourse.lighting_power || "",
          fireSafety: selectedCourse.fire_safety || "",
        },
        trainerTraineeRatio: {
          theory: selectedCourse.trainer_trainee_ratio_theory || "",
          practical: selectedCourse.trainer_trainee_ratio_practical || "",
        },
        maxTrainees: selectedCourse.max_no_trainees || "",
        presentTrainees: selectedCourse.present_no_trainee || "",
        trainers:
          parsedTrainers.length > 0
            ? parsedTrainers.map((trainer) => ({
                name: trainer.trainerName || "",
                qualification: trainer.acamedicProfessional || "",
                industrialExp: trainer.industrialExperience || "",
                teachingExp: trainer.teachingExperience || "",
                subjectsTaught: trainer.subjectTaught || "",
                teachingHours: trainer.teachingHour || "",
              }))
            : [
                {
                  name: "",
                  qualification: "",
                  industrialExp: "",
                  teachingExp: "",
                  subjectsTaught: "",
                  teachingHours: "",
                },
              ],
        files: [],
      };
    }

    return {
      registrationNo: instituteDetails?.registration_no || "",
      instituteName: instituteDetails?.proposed_institute_name || "",
      instituteId: instituteDetails?.institute_id || "",
      curriculumTypeId: "",
      sectorId: "",
      courseId: "",
      courseName: "",
      courseFee: "",
      modules: [
        {
          ncsCode: "",
          unitName: "",
          unitLevel: "",
        },
      ],
      curriculum: [
        {
          moduleNo: "",
          moduleName: "",
          moduleCode: "",
          theoryDuration: "",
          practicalDuration: "",
          ojtHrs: "",
        },
      ],
      trainingFacilities: {
        noOfClass: "",
        noOfWorkshops: "",
        noOfTrainingLab: "",
      },
      otherFacilities: {
        trainingTools: "",
        firstAid: "",
        toilet: "",
        lighting: "",
        fireSafety: "",
      },
      trainerTraineeRatio: {
        theory: "",
        practical: "",
      },
      maxTrainees: "",
      presentTrainees: "",
      trainers: [
        {
          name: "",
          qualification: "",
          industrialExp: "",
          teachingExp: "",
          subjectsTaught: "",
          teachingHours: "",
        },
      ],
      files: [],
    };
  };

  const validationSchema = Yup.object().shape({
    curriculumTypeId: Yup.string().required("Curriculum Type is required"),
    sectorId: Yup.string().required("Sector is required"),
    courseId: Yup.string().required("Course Title is required"),
    courseFee: Yup.number()
      .required("Course Fee is required")
      .positive("Course Fee must be a positive number")
      .typeError("Course Fee must be a valid number"),

    modules: Yup.array().of(
      Yup.object().shape({
        ncsCode: Yup.string().required("NCS Code is required"),
        unitName: Yup.string().required("Unit Name is required"),
        unitLevel: Yup.string().required("Unit Level is required"),
      }),
    ),

    curriculum: Yup.array().of(
      Yup.object().shape({
        moduleNo: Yup.string().required("Module No is required"),
        moduleName: Yup.string().required("Module Name is required"),
        moduleCode: Yup.string().required("Module Code is required"),
        theoryDuration: Yup.number()
          .required("Theory Duration is required")
          .positive("Theory Duration must be a positive number")
          .typeError("Theory Duration must be a valid number"),
        practicalDuration: Yup.number()
          .required("Practical Duration is required")
          .positive("Practical Duration must be a positive number")
          .typeError("Practical Duration must be a valid number"),
        ojtHrs: Yup.number()
          .required("OJT Hours is required")
          .min(0, "OJT Hours cannot be negative")
          .typeError("OJT Hours must be a valid number"),
      }),
    ),

    trainingFacilities: Yup.object().shape({
      noOfClass: Yup.number()
        .required("Number of Classes is required")
        .positive("Number of Classes must be a positive number")
        .integer("Number of Classes must be a whole number")
        .typeError("Number of Classes must be a valid number"),
      noOfWorkshops: Yup.number()
        .required("Number of Workshops is required")
        .min(0, "Number of Workshops cannot be negative")
        .integer("Number of Workshops must be a whole number")
        .typeError("Number of Workshops must be a valid number"),
      noOfTrainingLab: Yup.number()
        .required("Number of Training Labs is required")
        .min(0, "Number of Training Labs cannot be negative")
        .integer("Number of Training Labs must be a whole number")
        .typeError("Number of Training Labs must be a valid number"),
    }),

    otherFacilities: Yup.object().shape({
      trainingTools: Yup.string()
        .required("Please select Yes or No for Training Tools and Equipment")
        .oneOf(["Y", "N"], "Please select Yes or No"),
      firstAid: Yup.string()
        .required("Please select Yes or No for First Aid Facilities")
        .oneOf(["Y", "N"], "Please select Yes or No"),
      toilet: Yup.string()
        .required("Please select Yes or No for Toilet Facilities")
        .oneOf(["Y", "N"], "Please select Yes or No"),
      lighting: Yup.string()
        .required("Please select Yes or No for Lighting/Power Supply")
        .oneOf(["Y", "N"], "Please select Yes or No"),
      fireSafety: Yup.string()
        .required("Please select Yes or No for Fire Safety")
        .oneOf(["Y", "N"], "Please select Yes or No"),
    }),

    trainerTraineeRatio: Yup.object().shape({
      theory: Yup.string()
        .required("Theory ratio is required")
        .test(
          "is-valid-ratio",
          "Please enter a valid ratio format (e.g., 3:3 or 10:30)",
          (value) => {
            if (!value) return false;
            return isValidRatio(value);
          },
        ),
      practical: Yup.string()
        .required("Practical ratio is required")
        .test(
          "is-valid-ratio",
          "Please enter a valid ratio format (e.g., 3:3 or 10:30)",
          (value) => {
            if (!value) return false;
            return isValidRatio(value);
          },
        ),
    }),

    maxTrainees: Yup.number()
      .required("Max trainees is required")
      .positive("Max trainees must be a positive number")
      .integer("Max trainees must be a whole number")
      .typeError("Max trainees must be a valid number"),

    presentTrainees: Yup.number()
      .required("Present trainees is required")
      .min(0, "Present trainees cannot be negative")
      .integer("Present trainees must be a whole number")
      .typeError("Present trainees must be a valid number")
      .max(
        Yup.ref("maxTrainees"),
        "Present trainees cannot exceed max trainees",
      ),

    trainers: Yup.array().of(
      Yup.object().shape({
        name: Yup.string()
          .required("Trainer name is required")
          .min(2, "Name must be at least 2 characters"),
        qualification: Yup.string()
          .required("Qualification is required")
          .min(2, "Qualification must be at least 2 characters"),
        industrialExp: Yup.number()
          .required("Industrial Experience is required")
          .min(0, "Industrial Experience cannot be negative")
          .typeError("Industrial Experience must be a valid number"),
        teachingExp: Yup.number()
          .required("Teaching Experience is required")
          .min(0, "Teaching Experience cannot be negative")
          .typeError("Teaching Experience must be a valid number"),
        subjectsTaught: Yup.string()
          .required("Subjects taught is required")
          .min(2, "Please specify at least one subject"),
        teachingHours: Yup.number()
          .required("Teaching hours is required")
          .positive("Teaching hours must be a positive number")
          .typeError("Teaching hours must be a valid number"),
      }),
    ),

    files: Yup.array().min(1, "Upload at least one document"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      if (dialogMode === "add") {
        // Convert files to base64
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        // Prepare data according to InstituteAccreditedCoursedto
        const submissionData = {
          instituteId: values.instituteId,
          applicantName: values.instituteName,
          courseId: values.courseId,
          courseFee: values.courseFee,
          curriculumTypeId: values.curriculumTypeId,
          classNo: values.trainingFacilities.noOfClass,
          workshopNo: values.trainingFacilities.noOfWorkshops,
          trainingLabNo: values.trainingFacilities.noOfTrainingLab,
          equipmentTool: values.otherFacilities.trainingTools,
          firstAidFacility: values.otherFacilities.firstAid,
          toiletFacility: values.otherFacilities.toilet,
          lightingPower: values.otherFacilities.lighting,
          fireSafety: values.otherFacilities.fireSafety,
          trainerTraineeRatioTheory: values.trainerTraineeRatio.theory,
          trainerTraineeRatioPractical: values.trainerTraineeRatio.practical,
          maxNoTrainees: values.maxTrainees,
          presentNoTrainee: values.presentTrainees,
          sectorId: values.sectorId,
          is_active: "Y",
          registration_date: new Date().toISOString(),
          validity_date: null,
          createdBy: actionId,
          serviceId: 26,
          assignedRoleId: 7,
          statusId: 55, // SUBMITTED status

          instituteAccreditedCertifications: values.modules.map((module) => ({
            certificationCode: module.ncsCode,
            certificationModule: module.unitName,
            certificationLevelId: module.unitLevel,
          })),

          instituteAccreditedCurriculums: values.curriculum.map(
            (curriculum) => ({
              moduleNo: curriculum.moduleNo,
              moduleName: curriculum.moduleName,
              ncsCode: curriculum.moduleCode,
              theoryHour: curriculum.theoryDuration,
              practicalHour: curriculum.practicalDuration,
              ojtHour: curriculum.ojtHrs,
            }),
          ),

          instituteAccreditedTrainers: values.trainers.map((trainer) => ({
            trainerName: trainer.name,
            acamedicProfessional: trainer.qualification,
            industrialExperience: trainer.industrialExp,
            teachingExperience: trainer.teachingExp,
            subjectTaught: trainer.subjectsTaught,
            teachingHour: trainer.teachingHours,
          })),

          documents: documents,
        };

        console.log("Submitting payload:", submissionData);

        const response =
          await ApplyAccreditedCourseService.submitAccreditedCourse(
            submissionData,
            access_token,
          );

        if (response.status === 200 || response.status === 201) {
          toast.success(
            "Course accreditation application submitted successfully!",
          );
          await fetchAppliedCourses();
          resetForm();
          setOpenDialog(false);
        } else {
          toast.error(response.message || "Failed to submit application");
        }
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("An error occurred while submitting the application");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const CourseForm = ({ formik, mode }) => (
    <Box>
      {/* Section 1: Training Provider Details */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          1. Training Provider Details
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Registration No"
              name="registrationNo"
              size="small"
              value={formik.values.registrationNo}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Institute Name"
              name="instituteName"
              size="small"
              value={formik.values.instituteName}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Curriculum Type"
              name="curriculumTypeId"
              size="small"
              value={formik.values.curriculumTypeId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.curriculumTypeId &&
                Boolean(formik.errors.curriculumTypeId)
              }
              helperText={
                formik.touched.curriculumTypeId &&
                formik.errors.curriculumTypeId
              }
              disabled={mode === "view"}
            >
              <MenuItem value="">-select-</MenuItem>
              {loadingCurriculumTypes ? (
                <MenuItem disabled>
                  <CircularProgress size={20} /> Loading curriculum types...
                </MenuItem>
              ) : (
                curriculumTypes.map((curriculum) => (
                  <MenuItem key={curriculum.id} value={curriculum.id}>
                    {curriculum.curriculum_name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Sector"
              name="sectorId"
              size="small"
              value={formik.values.sectorId}
              onChange={(e) => {
                formik.handleChange(e);
                if (mode !== "view") {
                  setSelectedSectorId(e.target.value);
                }
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.sectorId && Boolean(formik.errors.sectorId)}
              helperText={formik.touched.sectorId && formik.errors.sectorId}
              disabled={mode === "view"}
            >
              <MenuItem value="">-select-</MenuItem>
              {sectors.map((sector) => (
                <MenuItem key={sector.id} value={sector.id}>
                  {sector.sectorName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            {mode === "view" ? (
              <TextField
                fullWidth
                label="Course"
                name="courseName"
                size="small"
                value={formik.values.courseName}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            ) : (
              <TextField
                select
                fullWidth
                label="Course"
                name="courseId"
                size="small"
                value={formik.values.courseId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.courseId && Boolean(formik.errors.courseId)
                }
                helperText={formik.touched.courseId && formik.errors.courseId}
                disabled={!formik.values.sectorId}
              >
                <MenuItem value="">-select-</MenuItem>
                {loadingOccupations ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Loading courses...
                  </MenuItem>
                ) : (
                  occupations.map((occupation) => (
                    <MenuItem key={occupation.id} value={occupation.id}>
                      {occupation.occupationName ||
                        occupation.title ||
                        occupation.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Course Fee (RM)"
              name="courseFee"
              type="number"
              size="small"
              value={formik.values.courseFee}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.courseFee && Boolean(formik.errors.courseFee)
              }
              helperText={formik.touched.courseFee && formik.errors.courseFee}
              disabled={mode === "view"}
              inputProps={{ min: 1 }}
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Section 2: Modules/Certifications */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          2. Details of Modules, Code and Level Certification
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12 }}>
            <FieldArray name="modules">
              {({ push, remove, form }) => (
                <Box>
                  {form.values.modules.map((module, index) => (
                    <Grid
                      container
                      spacing={2}
                      key={index}
                      sx={{ mb: 2, alignItems: "center" }}
                    >
                      <Grid item size={{ xs: 12, md: 3.5 }}>
                        <TextField
                          fullWidth
                          label="NCS Code"
                          name={`modules.${index}.ncsCode`}
                          size="small"
                          value={module.ncsCode}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.modules?.[index]?.ncsCode &&
                            Boolean(formik.errors.modules?.[index]?.ncsCode)
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.modules?.[index]?.ncsCode &&
                            formik.errors.modules?.[index]?.ncsCode
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 3.5 }}>
                        <TextField
                          fullWidth
                          label="Unit Name"
                          name={`modules.${index}.unitName`}
                          size="small"
                          value={module.unitName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.modules?.[index]?.unitName &&
                            Boolean(formik.errors.modules?.[index]?.unitName)
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.modules?.[index]?.unitName &&
                            formik.errors.modules?.[index]?.unitName
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 3.5 }}>
                        <TextField
                          select
                          fullWidth
                          label="Unit Level"
                          name={`modules.${index}.unitLevel`}
                          size="small"
                          value={module.unitLevel}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.modules?.[index]?.unitLevel &&
                            Boolean(formik.errors.modules?.[index]?.unitLevel)
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.modules?.[index]?.unitLevel &&
                            formik.errors.modules?.[index]?.unitLevel
                          }
                          disabled={mode === "view"}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {unitLevels.map((level) => (
                            <MenuItem key={level.id} value={level.id}>
                              {level.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1 }}>
                        {mode === "add" && (
                          <>
                            {index === form.values.modules.length - 1 && (
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() =>
                                  push({
                                    ncsCode: "",
                                    unitName: "",
                                    unitLevel: "",
                                  })
                                }
                                title="Add Module"
                                sx={{
                                  bgcolor: "#e3f2fd",
                                  "&:hover": { bgcolor: "#bbdefb" },
                                  mr: 1,
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                            {index > 0 && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => remove(index)}
                                title="Delete Module"
                                sx={{
                                  bgcolor: "#ffebee",
                                  "&:hover": { bgcolor: "#ffcdd2" },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              )}
            </FieldArray>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 3: Curriculum */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          3. Curriculum and Course Duration
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12 }}>
            <FieldArray name="curriculum">
              {({ push, remove, form }) => (
                <Box>
                  {form.values.curriculum.map((curr, index) => (
                    <Grid
                      container
                      spacing={2}
                      key={index}
                      sx={{ mb: 2, alignItems: "center" }}
                    >
                      <Grid item size={{ xs: 12, md: 1.8 }}>
                        <TextField
                          fullWidth
                          label="Module No"
                          name={`curriculum.${index}.moduleNo`}
                          size="small"
                          value={curr.moduleNo}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.moduleNo &&
                            Boolean(formik.errors.curriculum?.[index]?.moduleNo)
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.moduleNo &&
                            formik.errors.curriculum?.[index]?.moduleNo
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.8 }}>
                        <TextField
                          fullWidth
                          label="Module Name"
                          name={`curriculum.${index}.moduleName`}
                          size="small"
                          value={curr.moduleName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.moduleName &&
                            Boolean(
                              formik.errors.curriculum?.[index]?.moduleName,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.moduleName &&
                            formik.errors.curriculum?.[index]?.moduleName
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.8 }}>
                        <TextField
                          fullWidth
                          label="Module Code"
                          name={`curriculum.${index}.moduleCode`}
                          size="small"
                          value={curr.moduleCode}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.moduleCode &&
                            Boolean(
                              formik.errors.curriculum?.[index]?.moduleCode,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.moduleCode &&
                            formik.errors.curriculum?.[index]?.moduleCode
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.4 }}>
                        <TextField
                          fullWidth
                          label="Theory (Hrs)"
                          name={`curriculum.${index}.theoryDuration`}
                          type="number"
                          size="small"
                          value={curr.theoryDuration}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]
                              ?.theoryDuration &&
                            Boolean(
                              formik.errors.curriculum?.[index]?.theoryDuration,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]
                              ?.theoryDuration &&
                            formik.errors.curriculum?.[index]?.theoryDuration
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.4 }}>
                        <TextField
                          fullWidth
                          label="Practical (Hrs)"
                          name={`curriculum.${index}.practicalDuration`}
                          type="number"
                          size="small"
                          value={curr.practicalDuration}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]
                              ?.practicalDuration &&
                            Boolean(
                              formik.errors.curriculum?.[index]
                                ?.practicalDuration,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]
                              ?.practicalDuration &&
                            formik.errors.curriculum?.[index]?.practicalDuration
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.4 }}>
                        <TextField
                          fullWidth
                          label="OJT (Hrs)"
                          name={`curriculum.${index}.ojtHrs`}
                          type="number"
                          size="small"
                          value={curr.ojtHrs}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.ojtHrs &&
                            Boolean(formik.errors.curriculum?.[index]?.ojtHrs)
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.curriculum?.[index]?.ojtHrs &&
                            formik.errors.curriculum?.[index]?.ojtHrs
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1 }}>
                        {mode === "add" && (
                          <>
                            {index === form.values.curriculum.length - 1 && (
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() =>
                                  push({
                                    moduleNo: "",
                                    moduleName: "",
                                    moduleCode: "",
                                    theoryDuration: "",
                                    practicalDuration: "",
                                    ojtHrs: "",
                                  })
                                }
                                title="Add Curriculum Item"
                                sx={{
                                  bgcolor: "#e3f2fd",
                                  "&:hover": { bgcolor: "#bbdefb" },
                                  mr: 1,
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                            {index > 0 && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => remove(index)}
                                title="Delete Curriculum Item"
                                sx={{
                                  bgcolor: "#ffebee",
                                  "&:hover": { bgcolor: "#ffcdd2" },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              )}
            </FieldArray>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 4: Training Facilities */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          4. Training Facilities
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="No of Class"
              name="trainingFacilities.noOfClass"
              type="number"
              size="small"
              value={formik.values.trainingFacilities.noOfClass}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.trainingFacilities?.noOfClass &&
                Boolean(formik.errors.trainingFacilities?.noOfClass)
              }
              helperText={
                mode === "add" &&
                formik.touched.trainingFacilities?.noOfClass &&
                formik.errors.trainingFacilities?.noOfClass
              }
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="No of Workshops"
              name="trainingFacilities.noOfWorkshops"
              type="number"
              size="small"
              value={formik.values.trainingFacilities.noOfWorkshops}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.trainingFacilities?.noOfWorkshops &&
                Boolean(formik.errors.trainingFacilities?.noOfWorkshops)
              }
              helperText={
                mode === "add" &&
                formik.touched.trainingFacilities?.noOfWorkshops &&
                formik.errors.trainingFacilities?.noOfWorkshops
              }
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="No of Training Lab"
              name="trainingFacilities.noOfTrainingLab"
              type="number"
              size="small"
              value={formik.values.trainingFacilities.noOfTrainingLab}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.trainingFacilities?.noOfTrainingLab &&
                Boolean(formik.errors.trainingFacilities?.noOfTrainingLab)
              }
              helperText={
                mode === "add" &&
                formik.touched.trainingFacilities?.noOfTrainingLab &&
                formik.errors.trainingFacilities?.noOfTrainingLab
              }
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Section 5: Other Facilities */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          5. Other Facilities
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
              error={
                mode === "add" &&
                formik.touched.otherFacilities?.trainingTools &&
                Boolean(formik.errors.otherFacilities?.trainingTools)
              }
              required
            >
              <FormLabel component="legend">
                1. Training Tools and Equipment{" "}
                <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <RadioGroup
                row
                name="otherFacilities.trainingTools"
                value={formik.values.otherFacilities.trainingTools}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="N"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
              {mode === "add" &&
                formik.touched.otherFacilities?.trainingTools &&
                formik.errors.otherFacilities?.trainingTools && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {formik.errors.otherFacilities?.trainingTools}
                  </Typography>
                )}
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
              error={
                mode === "add" &&
                formik.touched.otherFacilities?.firstAid &&
                Boolean(formik.errors.otherFacilities?.firstAid)
              }
              required
            >
              <FormLabel component="legend">
                2. First Aid Facilities <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <RadioGroup
                row
                name="otherFacilities.firstAid"
                value={formik.values.otherFacilities.firstAid}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="N"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
              {mode === "add" &&
                formik.touched.otherFacilities?.firstAid &&
                formik.errors.otherFacilities?.firstAid && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {formik.errors.otherFacilities?.firstAid}
                  </Typography>
                )}
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
              error={
                mode === "add" &&
                formik.touched.otherFacilities?.toilet &&
                Boolean(formik.errors.otherFacilities?.toilet)
              }
              required
            >
              <FormLabel component="legend">
                3. Toilet Facilities <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <RadioGroup
                row
                name="otherFacilities.toilet"
                value={formik.values.otherFacilities.toilet}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="N"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
              {mode === "add" &&
                formik.touched.otherFacilities?.toilet &&
                formik.errors.otherFacilities?.toilet && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {formik.errors.otherFacilities?.toilet}
                  </Typography>
                )}
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
              error={
                mode === "add" &&
                formik.touched.otherFacilities?.lighting &&
                Boolean(formik.errors.otherFacilities?.lighting)
              }
              required
            >
              <FormLabel component="legend">
                4. Lighting/Power Supply <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <RadioGroup
                row
                name="otherFacilities.lighting"
                value={formik.values.otherFacilities.lighting}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="N"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
              {mode === "add" &&
                formik.touched.otherFacilities?.lighting &&
                formik.errors.otherFacilities?.lighting && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {formik.errors.otherFacilities?.lighting}
                  </Typography>
                )}
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
              error={
                mode === "add" &&
                formik.touched.otherFacilities?.fireSafety &&
                Boolean(formik.errors.otherFacilities?.fireSafety)
              }
              required
            >
              <FormLabel component="legend">
                5. Fire Safety <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <RadioGroup
                row
                name="otherFacilities.fireSafety"
                value={formik.values.otherFacilities.fireSafety}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="N"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
              {mode === "add" &&
                formik.touched.otherFacilities?.fireSafety &&
                formik.errors.otherFacilities?.fireSafety && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {formik.errors.otherFacilities?.fireSafety}
                  </Typography>
                )}
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Trainer-Trainee Ratio (Theory)"
              name="trainerTraineeRatio.theory"
              size="small"
              value={formik.values.trainerTraineeRatio.theory}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.trainerTraineeRatio?.theory &&
                Boolean(formik.errors.trainerTraineeRatio?.theory)
              }
              helperText={
                mode === "add" &&
                formik.touched.trainerTraineeRatio?.theory &&
                formik.errors.trainerTraineeRatio?.theory
              }
              placeholder="e.g., 3:3 or 10:30"
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Trainer-Trainee Ratio (Practical)"
              name="trainerTraineeRatio.practical"
              size="small"
              value={formik.values.trainerTraineeRatio.practical}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.trainerTraineeRatio?.practical &&
                Boolean(formik.errors.trainerTraineeRatio?.practical)
              }
              helperText={
                mode === "add" &&
                formik.touched.trainerTraineeRatio?.practical &&
                formik.errors.trainerTraineeRatio?.practical
              }
              placeholder="e.g., 3:3 or 10:30"
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Max no of Trainees per batch"
              name="maxTrainees"
              type="number"
              size="small"
              value={formik.values.maxTrainees}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.maxTrainees &&
                Boolean(formik.errors.maxTrainees)
              }
              helperText={
                mode === "add" &&
                formik.touched.maxTrainees &&
                formik.errors.maxTrainees
              }
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Present no of Trainees"
              name="presentTrainees"
              type="number"
              size="small"
              value={formik.values.presentTrainees}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                mode === "add" &&
                formik.touched.presentTrainees &&
                Boolean(formik.errors.presentTrainees)
              }
              helperText={
                mode === "add" &&
                formik.touched.presentTrainees &&
                formik.errors.presentTrainees
              }
              slotProps={{
                input: {
                  readOnly: mode === "view",
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Section 6: Trainers */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          6. Trainer attached to the Course
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12 }}>
            <FieldArray name="trainers">
              {({ push, remove, form }) => (
                <Box>
                  {form.values.trainers.map((trainer, index) => (
                    <Grid
                      container
                      spacing={2}
                      key={index}
                      sx={{ mb: 2, alignItems: "flex-start" }}
                    >
                      <Grid item size={{ xs: 12, md: 2.4 }}>
                        <TextField
                          fullWidth
                          label="Name"
                          name={`trainers.${index}.name`}
                          size="small"
                          value={trainer.name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.name &&
                            Boolean(formik.errors.trainers?.[index]?.name)
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.name &&
                            formik.errors.trainers?.[index]?.name
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 2.4 }}>
                        <TextField
                          fullWidth
                          label="Qualification"
                          name={`trainers.${index}.qualification`}
                          size="small"
                          value={trainer.qualification}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.qualification &&
                            Boolean(
                              formik.errors.trainers?.[index]?.qualification,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.qualification &&
                            formik.errors.trainers?.[index]?.qualification
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.5 }}>
                        <TextField
                          fullWidth
                          label="Industrial Exp (Years)"
                          name={`trainers.${index}.industrialExp`}
                          type="number"
                          size="small"
                          value={trainer.industrialExp}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.industrialExp &&
                            Boolean(
                              formik.errors.trainers?.[index]?.industrialExp,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.industrialExp &&
                            formik.errors.trainers?.[index]?.industrialExp
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.5 }}>
                        <TextField
                          fullWidth
                          label="Teaching Exp (Years)"
                          name={`trainers.${index}.teachingExp`}
                          type="number"
                          size="small"
                          value={trainer.teachingExp}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.teachingExp &&
                            Boolean(
                              formik.errors.trainers?.[index]?.teachingExp,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.teachingExp &&
                            formik.errors.trainers?.[index]?.teachingExp
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 2.4 }}>
                        <TextField
                          fullWidth
                          label="Subjects Taught"
                          name={`trainers.${index}.subjectsTaught`}
                          size="small"
                          value={trainer.subjectsTaught}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.subjectsTaught &&
                            Boolean(
                              formik.errors.trainers?.[index]?.subjectsTaught,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.subjectsTaught &&
                            formik.errors.trainers?.[index]?.subjectsTaught
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.2 }}>
                        <TextField
                          fullWidth
                          label="Teaching Hrs"
                          name={`trainers.${index}.teachingHours`}
                          type="number"
                          size="small"
                          value={trainer.teachingHours}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.teachingHours &&
                            Boolean(
                              formik.errors.trainers?.[index]?.teachingHours,
                            )
                          }
                          helperText={
                            mode === "add" &&
                            formik.touched.trainers?.[index]?.teachingHours &&
                            formik.errors.trainers?.[index]?.teachingHours
                          }
                          slotProps={{
                            input: {
                              readOnly: mode === "view",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 0.6 }}>
                        {mode === "add" && (
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {index === form.values.trainers.length - 1 && (
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() =>
                                  push({
                                    name: "",
                                    qualification: "",
                                    industrialExp: "",
                                    teachingExp: "",
                                    subjectsTaught: "",
                                    teachingHours: "",
                                  })
                                }
                                title="Add Trainer"
                                sx={{
                                  bgcolor: "#e3f2fd",
                                  "&:hover": { bgcolor: "#bbdefb" },
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                            {index > 0 && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => remove(index)}
                                title="Delete Trainer"
                                sx={{
                                  bgcolor: "#ffebee",
                                  "&:hover": { bgcolor: "#ffcdd2" },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  ))}
                  {mode === "add" && form.values.trainers.length === 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        push({
                          name: "",
                          qualification: "",
                          industrialExp: "",
                          teachingExp: "",
                          subjectsTaught: "",
                          teachingHours: "",
                        })
                      }
                      sx={{ mt: 1 }}
                    >
                      Add Trainer
                    </Button>
                  )}
                </Box>
              )}
            </FieldArray>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 7: Supporting Documents */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          7. Supporting Documents
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12 }}>
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
              <li> Training plan for the entire course</li>
              <li> Monthly/Weekly plan</li>
              <li> Lesson plan</li>
              <li> CV and certificates of the academic staff</li>
            </Box>
            <FileUpload
              files={formik.values.files}
              onFilesChange={(files) => formik.setFieldValue("files", files)}
              disabled={mode === "view"}
              error={formik.touched.files && Boolean(formik.errors.files)}
              helperText={formik.touched.files && formik.errors.files}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Accredited Course Application
      </Typography>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ height: "36px" }}
          >
            Add Course
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Course Title</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Course Fee (Nu.)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => {
                  const statusName = getStatusName(course.status_id);
                  const sectorName = getSectorName(course.sector_id);

                  return (
                    <TableRow key={course.id || index}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{course.applicationNo}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{sectorName}</TableCell>
                      <TableCell>Nu. {course.courseFee}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            backgroundColor: "#e8f5e9",
                            borderRadius: "16px",
                            display: "inline-block",
                            px: 1.5,
                            py: 0.5,
                            lineHeight: 1.5,
                          }}
                        >
                          {statusName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleView(course)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Apply for Course Accreditation"
            : "Accreditation Application Details"}
        </DialogTitle>
        <Formik
          key={
            dialogMode +
            (selectedCourse?.id || "") +
            (instituteDetails?.registration_no || "")
          }
          initialValues={getInitialValues()}
          validationSchema={dialogMode === "add" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <CourseForm formik={formik} mode={dialogMode} />
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color={dialogMode === "add" ? "error" : "inherit"}
                  onClick={() => setOpenDialog(false)}
                  disabled={loading}
                >
                  {dialogMode === "add" ? "Cancel" : "Close"}
                </Button>
                {dialogMode === "add" && (
                  <Button
                    size="small"
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default ApplyAccreditedCourse;
