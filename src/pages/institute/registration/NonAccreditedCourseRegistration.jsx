import { useState, useEffect, useMemo, useRef } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Radio,
  Divider,
  Box,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUpload";
import ApplyNonAccreditedCourseService from "../../../api/services/internal/course/ApplyNonAccreditedCourseService";
import CommonService from "../../../api/services/internal/common/CommonService";
import CurriculumEndorsementIndexService from "../../../api/services/internal/course/CurriculumIndexService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Helper component for required field indicator
const RequiredStar = () => (
  <Typography component="span" sx={{ color: "red" }}>
    *
  </Typography>
);

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

// Table style constant matching InstituteRegistration
const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

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

const NonAccreditedCourseRegistration = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAdd, setOpenAdd] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);

  // Quality Standards State
  const [qualityData, setQualityData] = useState([]);
  const [qualitySelections, setQualitySelections] = useState({});

  // Formik ref for auto-fill functionality
  const formikRef = useRef(null);

  useEffect(() => {
    fetchCurriculumTypes();
    fetchCertificateLevels();
    fetchInstituteDetails();
    fetchQualityStandards();
  }, []);

  // Fetch courses after curriculumTypes is loaded
  useEffect(() => {
    if (curriculumTypes.length > 0) {
      fetchNonAccreditedCourseDetails();
    }
  }, [curriculumTypes]);

  const fetchQualityStandards = async () => {
    try {
      const response = await CommonService.getAllQualitystandards(13); //serviceId
      if (response.data) {
        const mainCategories = response.data.filter(
          (item) => item.parentId === 0,
        );
        const subCategories = response.data.filter(
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
    } catch (error) {
      console.error("Error fetching quality standards:", error);
    }
  };

  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(10);
      setCertificateLevels(response.data);
      console.log("Certificate Levels:", response.data);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
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

  const fetchCurriculumTypes = async () => {
    try {
      const response =
        await CurriculumEndorsementIndexService.getApprovedCurriculumDataByUserId(
          registration_no,
          42,
          access_token,
        );
      setCurriculumTypes(response.data);
      console.log("Curriculum Types:", response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchNonAccreditedCourseDetails = async () => {
    try {
      const response =
        await ApplyNonAccreditedCourseService.getNonAccreditedCourseDetailsByUserId(
          registration_no,
          access_token,
        );
      console.log("Non-Accredited Course Details:", response.data);

      if (response.data && Array.isArray(response.data)) {
        const transformedCourses = response.data.map((item, index) => {
          // Find curriculum by id
          let curriculumType = curriculumTypes.find(
            (type) => String(type.id) === String(item.curriculum_id),
          );

          // Get hours from curriculum data if available
          const theoryHour = curriculumType?.total_theory_duration 
            ? parseInt(curriculumType.total_theory_duration) 
            : 0;
          const practicalHour = curriculumType?.total_practical_duration 
            ? parseInt(curriculumType.total_practical_duration) 
            : 0;
          const ojtHour = curriculumType?.total_ojt_duration 
            ? parseInt(curriculumType.total_ojt_duration) 
            : 0;

          // Get certificate level from curriculum
          const certificateLevelId = curriculumType?.certificate_level_id 
            ? String(curriculumType.certificate_level_id) 
            : item.certificate_level_id || "";

          return {
            id: item.id || index + 1,
            courseTitle: item.course_title || "",
            theoryHour: theoryHour,
            practicalHour: practicalHour,
            ojtHour: ojtHour,
            statusName: item.status_name || "",
            feesPerTrainee: item.fees_per_trainee || 0,
            enrolmentCapacity: item.enrolment_capacity || 0,
            certificateLevelId: certificateLevelId,
            curriculumId: item.curriculum_id || "",
            curriculumName: curriculumType?.curriculum_name || "",
            attachment: item.attachment || "",
            application_no: item.application_no || "",
            qualityStandards: item.quality_standards || [],
          };
        });
        setCourses(transformedCourses);
        console.log(
          "Transformed courses with curriculum names and hours:",
          transformedCourses,
        );
      }
    } catch (error) {
      console.error("Error fetching non-accredited course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const populateQualitySelections = (qualityStandards) => {
    if (!qualityStandards || !Array.isArray(qualityStandards)) return;

    const selections = {};
    qualityStandards.forEach((qs) => {
      const subQuestionId = qs.standardId.toString();
      const responseValue = qs.responseId;

      const category = qualityData.find((cat) =>
        cat.rows.some((row) => row.id === subQuestionId),
      );
      if (category) {
        if (!selections[category.id]) {
          selections[category.id] = {};
        }
        selections[category.id][subQuestionId] = responseValue;
      }
    });
    setQualitySelections(selections);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredCourses = courses.filter((c) =>
    c.courseTitle?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleView = (course) => {
    // When viewing, make sure we have the latest curriculum name
    const curriculumName = getCurriculumTypeName(course.curriculumId);
    setSelectedCourse({
      ...course,
      curriculumDisplayName: curriculumName,
    });
    setOpenView(true);
  };

  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const updated = courses.filter((_, i) => i !== deleteIndex);
      setCourses(updated);
      toast.success("Course deleted successfully!");
      setOpenDelete(false);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const transformQualityStandards = (selections) => {
    const qualityStandardsList = [];

    Object.keys(selections).forEach((categoryId) => {
      const categorySelections = selections[categoryId];
      Object.keys(categorySelections).forEach((subQuestionId) => {
        qualityStandardsList.push({
          standardId: parseInt(subQuestionId),
          responseId: categorySelections[subQuestionId],
          remarks: null,
        });
      });
    });

    return qualityStandardsList;
  };

  const areAllQualityStandardsYes = useMemo(() => {
    if (qualityData.length === 0) return false;

    let totalRows = 0;
    let answeredRows = 0;

    for (const standard of qualityData) {
      for (const row of standard.rows) {
        totalRows++;
        const selectedValue = qualitySelections[standard.id]?.[row.id];
        if (selectedValue === "Y" || selectedValue === "N") {
          answeredRows++;
        }
      }
    }

    const allAnswered = totalRows === answeredRows;
    const allYes = qualityData.every((standard) =>
      standard.rows.every(
        (row) => qualitySelections[standard.id]?.[row.id] === "Y",
      ),
    );

    return allAnswered && allYes;
  }, [qualitySelections, qualityData]);

  const handleRadioChange = (standardId, rowId, value) => {
    setQualitySelections((prev) => ({
      ...prev,
      [standardId]: {
        ...prev[standardId],
        [rowId]: value,
      },
    }));
  };

  // Render quality standards - taking full width of container
  const renderChecklist = (standard) => {
    return (
      <Grid item xs={12} key={standard.id} sx={{ width: "100%" }}>
        <Paper
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            width: "100%",
          }}
        >
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }} mb={1}>
            {standard.title} <RequiredStar />
          </Typography>
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table
              size="small"
              sx={{ ...TABLE_STYLE, width: "100%", minWidth: "100%" }}
            >
              <TableHead>
                <TableRow>
                  <TableCell width="60" sx={{ width: "60px" }}>
                    Sl. No
                  </TableCell>
                  <TableCell sx={{ width: "auto" }}>
                    Quality Indicator <RequiredStar />
                  </TableCell>
                  <TableCell align="center" width="100" sx={{ width: "100px" }}>
                    YES
                  </TableCell>
                  <TableCell align="center" width="100" sx={{ width: "100px" }}>
                    NO
                  </TableCell>
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
                          checked={selectedValue === "Y"}
                          onChange={() =>
                            handleRadioChange(standard.id, row.id, "Y")
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={selectedValue === "N"}
                          onChange={() =>
                            handleRadioChange(standard.id, row.id, "N")
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

  const initialValues = {
    instituteName: instituteDetails?.proposed_institute_name || "",
    registrationNo: instituteDetails?.registration_no || "",
    courseTitle: "",
    theoryHour: "",
    practicalHour: "",
    ojtHour: "",
    feesPerTrainee: "",
    enrolmentCapacity: "",
    certificateLevelId: "",
    curriculumId: "",
    files: [],
  };

  const validationSchema = Yup.object().shape({
    courseTitle: Yup.string().required("Course Title is required"),
    theoryHour: Yup.number()
      .required("Theory hours are required")
      .positive("Must be positive"),
    practicalHour: Yup.number()
      .required("Practical hours are required")
      .positive("Must be positive"),
    ojtHour: Yup.number()
      .required("OJT hours are required")
      .positive("Must be positive"),
    feesPerTrainee: Yup.number()
      .required("Fee is required")
      .positive("Must be positive"),
    enrolmentCapacity: Yup.number()
      .required("Capacity is required")
      .positive("Must be positive")
      .integer("Must be a whole number"),
    certificateLevelId: Yup.string().required("Certificate level is required"),
    curriculumId: Yup.string().required("Curriculum type is required"),
    files: Yup.array().min(1, "Please upload supporting documents"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      // Find the selected curriculum by id
      const selectedCurriculum = curriculumTypes.find(
        (t) => String(t.id) === String(values.curriculumId),
      );

      const qualityStandardsList = transformQualityStandards(qualitySelections);

      const payload = {
        courseTitle: values.courseTitle,
        applicantName: values.instituteName,
        theoryHour: parseInt(values.theoryHour),
        practicalHour: parseInt(values.practicalHour),
        ojtHour: parseInt(values.ojtHour),
        feesPerTrainee: parseInt(values.feesPerTrainee),
        enrolmentCapacity: parseInt(values.enrolmentCapacity),
        certificateLevelId: values.certificateLevelId,
        curriculumId: parseInt(values.curriculumId),
        instituteId: instituteDetails?.institute_id || "",
        serviceId: 13,
        assignedRoleId: 7,
        statusId: 55,
        createdBy: actionId,
        documents: documents,
        qualityStandards: qualityStandardsList,
      };

      console.log("Submitting payload:", payload);
      const response =
        await ApplyNonAccreditedCourseService.submitNonAccreditedCourse(
          payload,
          access_token,
        );

      if (response.status === 200 || response.status === 201) {
        // Get curriculum hours for the new course
        const curriculum = curriculumTypes.find(
          (t) => String(t.id) === String(values.curriculumId),
        );
        
        const newCourse = {
          id: response.data?.id || courses.length + 1,
          courseTitle: values.courseTitle,
          theoryHour: curriculum?.total_theory_duration ? parseInt(curriculum.total_theory_duration) : parseInt(values.theoryHour),
          practicalHour: curriculum?.total_practical_duration ? parseInt(curriculum.total_practical_duration) : parseInt(values.practicalHour),
          ojtHour: curriculum?.total_ojt_duration ? parseInt(curriculum.total_ojt_duration) : parseInt(values.ojtHour),
          feesPerTrainee: parseInt(values.feesPerTrainee),
          enrolmentCapacity: parseInt(values.enrolmentCapacity),
          certificateLevelId: curriculum?.certificate_level_id ? String(curriculum.certificate_level_id) : values.certificateLevelId,
          curriculumId: values.curriculumId,
          curriculumName: curriculum?.curriculum_name || "",
          attachment: values.files.map((file) => file.name).join(", "),
          application_no: response.data?.application_no || "",
          statusName: "submitted",
        };

        setCourses([...courses, newCourse]);
        toast.success("Course submitted successfully!");
        resetForm();
        setQualitySelections({});
        setSelectedCurriculumId(null);
        setOpenAdd(false);

        await fetchNonAccreditedCourseDetails();
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error("Failed to submit course");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setQualitySelections({});
    setSelectedCurriculumId(null);
    if (formikRef.current) {
      formikRef.current.setFieldValue("theoryHour", "");
      formikRef.current.setFieldValue("practicalHour", "");
      formikRef.current.setFieldValue("ojtHour", "");
      formikRef.current.setFieldValue("curriculumId", "");
      formikRef.current.setFieldValue("certificateLevelId", "");
      formikRef.current.setFieldValue("courseTitle", "");
      formikRef.current.setFieldValue("feesPerTrainee", "");
      formikRef.current.setFieldValue("enrolmentCapacity", "");
      formikRef.current.setFieldValue("files", []);
    }
  };

  const getCertificateLevelName = (levelId) => {
    if (!levelId) return "-";
    
    // Convert both to string for comparison
    const levelIdStr = String(levelId);
    
    // Find the certificate level
    const level = certificateLevels.find(
      (l) => String(l.id) === levelIdStr
    );
    
    // Return the name or fallback
    return level?.name || level?.value || level?.certificate_level_name || levelIdStr;
  };

  // Get curriculum type name - robust version with fallback
  const getCurriculumTypeName = (curriculumId) => {
    if (!curriculumId) return "-";

    // First try to find by id
    let curriculum = curriculumTypes.find(
      (type) => String(type.id) === String(curriculumId),
    );

    // If not found, try by curriculum_type_id
    if (!curriculum) {
      curriculum = curriculumTypes.find(
        (type) => String(type.curriculum_type_id) === String(curriculumId),
      );
    }

    return curriculum?.curriculum_name || curriculumId;
  };

  // Auto-fill function
  const autoFillCurriculumFields = (selectedId) => {
    if (selectedId && formikRef.current) {
      const selectedCurriculum = curriculumTypes.find(
        (type) => String(type.id) === String(selectedId),
      );

      if (selectedCurriculum) {
        // Parse values safely
        const theoryHours = selectedCurriculum.total_theory_duration
          ? parseInt(selectedCurriculum.total_theory_duration)
          : 0;
        const practicalHours = selectedCurriculum.total_practical_duration
          ? parseInt(selectedCurriculum.total_practical_duration)
          : 0;
        const ojtHours = selectedCurriculum.total_ojt_duration
          ? parseInt(selectedCurriculum.total_ojt_duration)
          : 0;

        // Auto-fill hours with safe defaults
        formikRef.current.setFieldValue(
          "theoryHour",
          isNaN(theoryHours) ? 0 : theoryHours,
        );
        formikRef.current.setFieldValue(
          "practicalHour",
          isNaN(practicalHours) ? 0 : practicalHours,
        );
        formikRef.current.setFieldValue(
          "ojtHour",
          isNaN(ojtHours) ? 0 : ojtHours,
        );

        // Auto-fill certificate level
        if (selectedCurriculum.certificate_level_id) {
          formikRef.current.setFieldValue(
            "certificateLevelId",
            String(selectedCurriculum.certificate_level_id),
          );
        }

        return true;
      }
    } else {
      // Clear fields if no curriculum selected
      if (formikRef.current) {
        formikRef.current.setFieldValue("theoryHour", "");
        formikRef.current.setFieldValue("practicalHour", "");
        formikRef.current.setFieldValue("ojtHour", "");
        formikRef.current.setFieldValue("certificateLevelId", "");
      }
    }
    return false;
  };

  // Effect to auto-fill when curriculum selection changes
  useEffect(() => {
    if (selectedCurriculumId) {
      autoFillCurriculumFields(selectedCurriculumId);
    }
  }, [selectedCurriculumId, curriculumTypes]);

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Add Non Accredited Course
      </Typography>

      {/* Search + Add Button */}
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
            onClick={() => setOpenAdd(true)}
            sx={{ height: "36px" }}
          >
            Add Course
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Course Title</TableCell>
              <TableCell>Fees Per Trainee (Nu.)</TableCell>
              <TableCell>Theory (Hrs)</TableCell>
              <TableCell>Practical (Hrs)</TableCell>
              <TableCell>OJT (Hrs)</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Curriculum</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => (
                  <TableRow key={course.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{course.application_no || "-"}</TableCell>
                    <TableCell>{course.courseTitle}</TableCell>
                    <TableCell>{course.feesPerTrainee}</TableCell>
                    <TableCell>{course.theoryHour || 0}</TableCell>
                    <TableCell>{course.practicalHour || 0}</TableCell>
                    <TableCell>{course.ojtHour || 0}</TableCell>
                    <TableCell>
                      {getCertificateLevelName(course.certificateLevelId)}
                    </TableCell>
                    <TableCell>
                      {course.curriculumName ||
                        getCurriculumTypeName(course.curriculumId)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={course.statusName}
                        size="small"
                        sx={{
                          backgroundColor:
                            course.statusName === "submitted"
                              ? "#2196f3"
                              : course.statusName === "Verified"
                              ? "#4caf50"
                              : "#ff9800",
                          color: "white",
                          fontWeight: "medium",
                          minWidth: "100px",
                          "& .MuiChip-label": {
                            px: 1.5,
                            py: 0.5,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleView(course)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: "error.main",
                          "&:hover": { backgroundColor: "#ffebee" },
                        }}
                        onClick={() =>
                          handleDeleteClick(index + page * rowsPerPage)
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
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

      {/* View Course Dialog */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Course Details</DialogTitle>
        <DialogContent dividers>
          {selectedCourse && (
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Name of Training Provider/Institution"
                  size="small"
                  value={instituteDetails?.proposed_institute_name || ""}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Registration No"
                  size="small"
                  value={instituteDetails?.registration_no || ""}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Application No"
                  size="small"
                  value={selectedCourse.application_no || "-"}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Course Title"
                  size="small"
                  value={selectedCourse.courseTitle}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Theory (Hours)"
                  size="small"
                  value={selectedCourse.theoryHour}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Practical (Hours)"
                  size="small"
                  value={selectedCourse.practicalHour}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="OJT (Hours)"
                  size="small"
                  value={selectedCourse.ojtHour}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Fees per trainee (Nu.)"
                  size="small"
                  value={selectedCourse.feesPerTrainee}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Enrollment capacity per batch"
                  size="small"
                  value={selectedCourse.enrolmentCapacity}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Certificate Level"
                  size="small"
                  value={getCertificateLevelName(
                    selectedCourse.certificateLevelId,
                  )}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Curriculum Type"
                  size="small"
                  value={
                    selectedCourse.curriculumDisplayName ||
                    selectedCourse.curriculumName ||
                    getCurriculumTypeName(selectedCourse.curriculumId)
                  }
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpenView(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deregister</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to deregister this course?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="inherit"
            onClick={() => setOpenDelete(false)}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog with Formik */}
      <Dialog
        open={openAdd}
        onClose={() => {
          setOpenAdd(false);
          handleReset();
        }}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Add Non Accredited Course</DialogTitle>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                {/* Container 1: Basic Information */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Name of Training Provider/Institution"
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
                    <Grid item size={{ xs: 12, md: 4 }}>
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
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Curriculum Type <RequiredStar />
                          </>
                        }
                        name="curriculumId"
                        size="small"
                        value={formik.values.curriculumId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          formik.handleChange(e);
                          setSelectedCurriculumId(selectedId);
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.curriculumId &&
                          Boolean(formik.errors.curriculumId)
                        }
                        helperText={
                          formik.touched.curriculumId &&
                          formik.errors.curriculumId
                        }
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {curriculumTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.curriculum_name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Duration Fields - Only show when curriculum is selected */}
                    {selectedCurriculumId && (
                      <>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={
                              <>
                                Theory (Hours) <RequiredStar />
                              </>
                            }
                            name="theoryHour"
                            type="number"
                            size="small"
                            value={formik.values.theoryHour}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.theoryHour &&
                              Boolean(formik.errors.theoryHour)
                            }
                            helperText={
                              formik.touched.theoryHour &&
                              formik.errors.theoryHour
                            }
                            slotProps={{
                              input: {
                                readOnly: true,
                              },
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={
                              <>
                                Practical (Hours) <RequiredStar />
                              </>
                            }
                            name="practicalHour"
                            type="number"
                            size="small"
                            value={formik.values.practicalHour}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.practicalHour &&
                              Boolean(formik.errors.practicalHour)
                            }
                            helperText={
                              formik.touched.practicalHour &&
                              formik.errors.practicalHour
                            }
                            slotProps={{
                              input: {
                                readOnly: true,
                              },
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label={
                              <>
                                OJT (Hours) <RequiredStar />
                              </>
                            }
                            name="ojtHour"
                            type="number"
                            size="small"
                            value={formik.values.ojtHour}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.ojtHour &&
                              Boolean(formik.errors.ojtHour)
                            }
                            helperText={
                              formik.touched.ojtHour && formik.errors.ojtHour
                            }
                            slotProps={{
                              input: {
                                readOnly: true,
                              },
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Certificate Level - Only show when curriculum is selected */}
                    {selectedCurriculumId && (
                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label={
                            <>
                              Certificate Level <RequiredStar />
                            </>
                          }
                          name="certificateLevelId"
                          size="small"
                          value={formik.values.certificateLevelId}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.certificateLevelId &&
                            Boolean(formik.errors.certificateLevelId)
                          }
                          helperText={
                            formik.touched.certificateLevelId &&
                            formik.errors.certificateLevelId
                          }
                          slotProps={{
                            input: {
                              readOnly: true,
                            },
                          }}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {certificateLevels.map((level) => (
                            <MenuItem key={level.id} value={level.id}>
                              {level.name ||
                                level.value ||
                                level.certificate_level_name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}

                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Course Title <RequiredStar />
                          </>
                        }
                        name="courseTitle"
                        size="small"
                        value={formik.values.courseTitle}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.courseTitle &&
                          Boolean(formik.errors.courseTitle)
                        }
                        helperText={
                          formik.touched.courseTitle &&
                          formik.errors.courseTitle
                        }
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Fees per trainee (Nu) <RequiredStar />
                          </>
                        }
                        name="feesPerTrainee"
                        type="number"
                        size="small"
                        value={formik.values.feesPerTrainee}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.feesPerTrainee &&
                          Boolean(formik.errors.feesPerTrainee)
                        }
                        helperText={
                          formik.touched.feesPerTrainee &&
                          formik.errors.feesPerTrainee
                        }
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Enrollment capacity per batch <RequiredStar />
                          </>
                        }
                        name="enrolmentCapacity"
                        type="number"
                        size="small"
                        value={formik.values.enrolmentCapacity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.enrolmentCapacity &&
                          Boolean(formik.errors.enrolmentCapacity)
                        }
                        helperText={
                          formik.touched.enrolmentCapacity &&
                          formik.errors.enrolmentCapacity
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Container 2: Quality Standards - Full width tables */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    width: "100%",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Quality Standards <RequiredStar />
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
                    {qualityData.map(renderChecklist)}
                  </Grid>
                </Paper>

                {/* Container 3: Supporting Documents */}
                <Paper
                  sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Supporting Documents <RequiredStar />
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
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
                    <li>Trainer CV</li>
                    <li>Curriculum Endorsement letter/ Certificate </li>
                  </Box>
                  <FileUpload
                    files={formik.values.files}
                    onFilesChange={(files) =>
                      formik.setFieldValue("files", files)
                    }
                    error={formik.touched.files && Boolean(formik.errors.files)}
                    helperText={formik.touched.files && formik.errors.files}
                  />
                </Paper>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setOpenAdd(false);
                    handleReset();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={handleReset}
                  startIcon={<RotateLeftIcon />}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    loading ||
                    !areAllQualityStandardsYes ||
                    formik.values.files.length === 0
                  }
                >
                  {loading ? "Saving..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default NonAccreditedCourseRegistration;