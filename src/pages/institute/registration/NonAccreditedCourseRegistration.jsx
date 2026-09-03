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
  Alert,
  CircularProgress,
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
  const [programmeTypes, setProgrammeTypes] = useState([]);
  // Quality Standards State
  const [qualityData, setQualityData] = useState([]);
  const [qualitySelections, setQualitySelections] = useState({});
  // Curriculum Duplication Check State
  const [curriculumDuplicateError, setCurriculumDuplicateError] = useState("");
  const [checkingCurriculum, setCheckingCurriculum] = useState(false);

  // Formik ref for auto-fill functionality
  const formikRef = useRef(null);

  useEffect(() => {
    fetchCurriculumTypes();
    fetchCertificateLevels();
    fetchInstituteDetails();
    fetchQualityStandards();
    fetchProgrammeTypes();
  }, []);

  // Fetch courses after curriculumTypes is loaded
  useEffect(() => {
    if (curriculumTypes.length > 0) {
      fetchNonAccreditedCourseDetails();
    }
  }, [curriculumTypes]);

  // Effect to populate quality selections when qualityData is loaded and a course is being viewed
  useEffect(() => {
    if (
      qualityData.length > 0 &&
      openView &&
      selectedCourse?.qualityStandards?.length > 0
    ) {
      populateQualitySelections(selectedCourse.qualityStandards);
    }
  }, [qualityData, openView, selectedCourse]);

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

  const fetchProgrammeTypes = async () => {
    try {
      const response = await CommonService.getByParentId(32);
      setProgrammeTypes(response.data);
      console.log("Programme Types:", response.data);
    } catch (error) {
      console.error("Error fetching programme types:", error);
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

  // Check if curriculum already exists for this institute
  const checkCurriculumExists = async (curriculumId) => {
    if (!curriculumId) {
      setCurriculumDuplicateError("");
      return false;
    }

    setCheckingCurriculum(true);
    setCurriculumDuplicateError("");

    try {
      const response =
        await ApplyNonAccreditedCourseService.curriculumAlreadyExist(
          curriculumId,
          registration_no,
          access_token,
        );

      console.log("Curriculum existence check response:", response.data);

      // Check if the response indicates the curriculum already exists
      // The response is an array of objects with curriculum_id when exists
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        // Check if any item in the array has the matching curriculum_id
        const exists = response.data.some(
          (item) => String(item.curriculum_id) === String(curriculumId),
        );

        if (exists) {
          setCurriculumDuplicateError(
            "This curriculum has already been registered for your institute. Please select a different curriculum.",
          );
          // Clear the curriculum selection fields
          if (formikRef.current) {
            formikRef.current.setFieldValue("curriculumId", "");
            formikRef.current.setFieldValue("theoryHour", "");
            formikRef.current.setFieldValue("practicalHour", "");
            formikRef.current.setFieldValue("ojtHour", "");
            formikRef.current.setFieldValue("certificateLevelId", "");
          }
          setSelectedCurriculumId(null);
          return true;
        }
      }

      setCurriculumDuplicateError("");
      return false;
    } catch (error) {
      console.error("Error checking curriculum existence:", error);
      toast.warning(
        "Could not verify curriculum duplication. Please proceed with caution.",
      );
      setCurriculumDuplicateError("");
      return false;
    } finally {
      setCheckingCurriculum(false);
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

          // Parse quality standards from the response
          let qualityStandards = [];
          if (item.quality_standard_responses) {
            try {
              if (typeof item.quality_standard_responses === "string") {
                qualityStandards = JSON.parse(item.quality_standard_responses);
              } else if (Array.isArray(item.quality_standard_responses)) {
                qualityStandards = item.quality_standard_responses;
              }
            } catch (e) {
              console.error("Error parsing quality standards:", e);
            }
          }

          // Parse documents if it's a string
          let documents = [];
          if (item.documents) {
            try {
              if (typeof item.documents === "string") {
                documents = JSON.parse(item.documents);
              } else if (Array.isArray(item.documents)) {
                documents = item.documents;
              }
            } catch (e) {
              console.error("Error parsing documents:", e);
            }
          }

          // Get programme type name
          const programmeType = programmeTypes.find(
            (pt) => String(pt.id) === String(item.programme_type_id),
          );

          return {
            id: item.id || index + 1,
            programmeTitle: item.programme_title || "",
            programmeTypeId: item.programme_type_id || "",
            programmeTypeName: programmeType?.name || "",
            theoryHour: theoryHour,
            practicalHour: practicalHour,
            ojtHour: ojtHour,
            statusName: item.status_name || "",
            feesPerTrainee: item.fees_per_trainee
              ? parseInt(item.fees_per_trainee)
              : 0,
            enrolmentCapacity: item.enrolment_capacity
              ? parseInt(item.enrolment_capacity)
              : 0,
            certificateLevelId: certificateLevelId,
            curriculumId: item.curriculum_id || "",
            curriculumName: curriculumType?.curriculum_title || "",
            attachment: item.documents || "",
            application_no: item.application_no || "",
            qualityStandards: qualityStandards,
            documents: documents,
            statusId: item.status_id || "",
            registrationDate: item.registration_date || "",
            validityDate: item.validity_date || "",
          };
        });
        setCourses(transformedCourses);
        console.log(
          "Transformed courses with quality standards:",
          transformedCourses.map((c) => ({
            id: c.id,
            programmeTitle: c.programmeTitle,
            programmeTypeName: c.programmeTypeName,
            qualityStandardsCount: c.qualityStandards?.length || 0,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching non-accredited course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const populateQualitySelections = (qualityStandards) => {
    console.log("Populating quality selections with:", qualityStandards);

    if (
      !qualityStandards ||
      !Array.isArray(qualityStandards) ||
      qualityStandards.length === 0
    ) {
      console.log("No quality standards to populate");
      return;
    }

    const selections = {};

    qualityStandards.forEach((qs) => {
      let subQuestionId = null;
      let responseValue = null;

      if (qs.standardId) {
        subQuestionId = qs.standardId.toString();
        responseValue = qs.responseId || qs.responseValue;
      } else if (qs.standard_id) {
        subQuestionId = qs.standard_id.toString();
        responseValue = qs.response_id || qs.responseValue;
      } else if (qs.id && qs.standardId) {
        subQuestionId = qs.standardId.toString();
        responseValue = qs.responseId;
      }

      if (!subQuestionId && qs.id) {
        const found = qualityData.some((cat) =>
          cat.rows.some((row) => row.id === qs.id.toString()),
        );
        if (found) {
          subQuestionId = qs.id.toString();
          responseValue = qs.responseId || qs.responseValue || qs.response_id;
        }
      }

      if (!subQuestionId) {
        console.log("Could not find standardId for:", qs);
        return;
      }

      const category = qualityData.find((cat) =>
        cat.rows.some((row) => row.id === subQuestionId),
      );

      if (category) {
        if (!selections[category.id]) {
          selections[category.id] = {};
        }
        selections[category.id][subQuestionId] = responseValue;
      } else {
        console.log(`Could not find category for standardId: ${subQuestionId}`);
      }
    });

    console.log("Populated quality selections:", selections);
    setQualitySelections(selections);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredCourses = courses.filter((c) =>
    c.programmeTitle?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleView = (course) => {
    console.log("Viewing course:", course);
    console.log("Quality standards:", course.qualityStandards);

    const curriculumName = getCurriculumTypeName(course.curriculumId);
    setSelectedCourse({
      ...course,
      curriculumDisplayName: curriculumName,
    });

    if (course.qualityStandards && course.qualityStandards.length > 0) {
      if (qualityData.length > 0) {
        populateQualitySelections(course.qualityStandards);
      } else {
        const checkQualityData = setInterval(() => {
          if (qualityData.length > 0) {
            populateQualitySelections(course.qualityStandards);
            clearInterval(checkQualityData);
          }
        }, 100);

        setTimeout(() => clearInterval(checkQualityData), 5000);
      }
    } else {
      setQualitySelections({});
    }

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

  // Render quality standards for viewing (read-only)
  const renderViewChecklist = (standard) => {
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
            {standard.title}
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
                    Quality Indicator
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
                  const isYes =
                    selectedValue &&
                    (selectedValue === "Y" ||
                      selectedValue === "YES" ||
                      selectedValue === "Yes" ||
                      selectedValue === "y" ||
                      selectedValue === "yes" ||
                      selectedValue === true ||
                      selectedValue === "1" ||
                      selectedValue === 1);

                  const isNo =
                    selectedValue &&
                    (selectedValue === "N" ||
                      selectedValue === "NO" ||
                      selectedValue === "No" ||
                      selectedValue === "n" ||
                      selectedValue === "no" ||
                      selectedValue === false ||
                      selectedValue === "0" ||
                      selectedValue === 0);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={!!isYes}
                          disabled={true}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={!!isNo}
                          disabled={true}
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

  // Render quality standards - taking full width of container (for add/edit)
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
    programmeTypeId: "",
    programmeTitle: "",
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
    programmeTypeId: Yup.string().required("Programme Type is required"),
    programmeTitle: Yup.string().required("Programme Title is required"),
    theoryHour: Yup.number().when("programmeTypeId", {
      is: (val) => val && val !== "137",
      then: (schema) =>
        schema
          .required("Theory hours are required")
          .positive("Must be positive"),
      otherwise: (schema) => schema.notRequired(),
    }),
    practicalHour: Yup.number().when("programmeTypeId", {
      is: (val) => val && val !== "137",
      then: (schema) =>
        schema
          .required("Practical hours are required")
          .positive("Must be positive"),
      otherwise: (schema) => schema.notRequired(),
    }),
    ojtHour: Yup.number().when("programmeTypeId", {
      is: (val) => val && val !== "137",
      then: (schema) =>
        schema.required("OJT hours are required").positive("Must be positive"),
      otherwise: (schema) => schema.notRequired(),
    }),
    feesPerTrainee: Yup.number()
      .required("Fee is required")
      .positive("Must be positive"),
    enrolmentCapacity: Yup.number()
      .required("Capacity is required")
      .positive("Must be positive")
      .integer("Must be a whole number"),
    certificateLevelId: Yup.string().when("programmeTypeId", {
      is: (val) => val && val !== "137",
      then: (schema) => schema.required("Certificate level is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    curriculumId: Yup.string().when("programmeTypeId", {
      is: (val) => val && val !== "137",
      then: (schema) => schema.required("Curriculum type is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    files: Yup.array().min(1, "Please upload supporting documents"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    // FIXED: Removed redundant check - curriculumDuplicateError is already handled in the form validation
    // The button is disabled when curriculumDuplicateError exists, so this check is unnecessary

    setLoading(true);
    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const selectedCurriculum = values.curriculumId
        ? curriculumTypes.find(
            (t) => String(t.id) === String(values.curriculumId),
          )
        : null;

      const qualityStandardsList = transformQualityStandards(qualitySelections);

      const payload = {
        programmeTitle: values.programmeTitle,
        applicantName: values.instituteName,
        theoryHour:
          values.programmeTypeId === "137"
            ? 0
            : parseInt(values.theoryHour) || 0,
        practicalHour:
          values.programmeTypeId === "137"
            ? 0
            : parseInt(values.practicalHour) || 0,
        ojtHour:
          values.programmeTypeId === "137" ? 0 : parseInt(values.ojtHour) || 0,
        feesPerTrainee: parseInt(values.feesPerTrainee),
        enrolmentCapacity: parseInt(values.enrolmentCapacity),
        certificateLevelId:
          values.programmeTypeId === "137" ? "" : values.certificateLevelId,
        curriculumId:
          values.programmeTypeId === "137"
            ? null
            : parseInt(values.curriculumId),
        programmeTypeId: parseInt(values.programmeTypeId),
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
        const curriculum = values.curriculumId
          ? curriculumTypes.find(
              (t) => String(t.id) === String(values.curriculumId),
            )
          : null;

        const programmeType = programmeTypes.find(
          (pt) => String(pt.id) === String(values.programmeTypeId),
        );

        const newCourse = {
          id: response.data?.id || courses.length + 1,
          programmeTitle: values.programmeTitle,
          programmeTypeId: values.programmeTypeId,
          programmeTypeName: programmeType?.name || "",
          theoryHour:
            values.programmeTypeId === "137"
              ? 0
              : curriculum?.total_theory_duration
                ? parseInt(curriculum.total_theory_duration)
                : parseInt(values.theoryHour) || 0,
          practicalHour:
            values.programmeTypeId === "137"
              ? 0
              : curriculum?.total_practical_duration
                ? parseInt(curriculum.total_practical_duration)
                : parseInt(values.practicalHour) || 0,
          ojtHour:
            values.programmeTypeId === "137"
              ? 0
              : curriculum?.total_ojt_duration
                ? parseInt(curriculum.total_ojt_duration)
                : parseInt(values.ojtHour) || 0,
          feesPerTrainee: parseInt(values.feesPerTrainee),
          enrolmentCapacity: parseInt(values.enrolmentCapacity),
          certificateLevelId:
            values.programmeTypeId === "137"
              ? ""
              : curriculum?.certificate_level_id
                ? String(curriculum.certificate_level_id)
                : values.certificateLevelId,
          curriculumId:
            values.programmeTypeId === "137" ? "" : values.curriculumId,
          curriculumName:
            values.programmeTypeId === "137"
              ? "Less than 140 hours"
              : curriculum?.curriculum_title || "",
          attachment: values.files.map((file) => file.name).join(", "),
          application_no: response.data?.application_no || "",
          statusName: "submitted",
          qualityStandards: qualityStandardsList,
        };

        setCourses([...courses, newCourse]);
        toast.success("Course submitted successfully!");
        resetForm();
        setQualitySelections({});
        setSelectedCurriculumId(null);
        setCurriculumDuplicateError("");
        setOpenAdd(false);

        await fetchNonAccreditedCourseDetails();
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error(error.response?.data?.message || "Failed to submit course");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setQualitySelections({});
    setSelectedCurriculumId(null);
    setCurriculumDuplicateError("");
    if (formikRef.current) {
      formikRef.current.setFieldValue("theoryHour", "");
      formikRef.current.setFieldValue("practicalHour", "");
      formikRef.current.setFieldValue("ojtHour", "");
      formikRef.current.setFieldValue("curriculumId", "");
      formikRef.current.setFieldValue("certificateLevelId", "");
      formikRef.current.setFieldValue("programmeTitle", "");
      formikRef.current.setFieldValue("feesPerTrainee", "");
      formikRef.current.setFieldValue("enrolmentCapacity", "");
      formikRef.current.setFieldValue("programmeTypeId", "");
      formikRef.current.setFieldValue("files", []);
    }
  };

  const getCertificateLevelName = (levelId) => {
    if (!levelId) return "-";

    const levelIdStr = String(levelId);
    const level = certificateLevels.find((l) => String(l.id) === levelIdStr);

    return (
      level?.name || level?.value || level?.certificate_level_name || levelIdStr
    );
  };

  const getCurriculumTypeName = (curriculumId) => {
    if (!curriculumId) return "-";

    let curriculum = curriculumTypes.find(
      (type) => String(type.id) === String(curriculumId),
    );

    if (!curriculum) {
      curriculum = curriculumTypes.find(
        (type) => String(type.curriculum_type_id) === String(curriculumId),
      );
    }

    return curriculum?.curriculum_title || "-";
  };

  // Auto-fill function
  const autoFillCurriculumFields = (selectedId) => {
    if (selectedId && formikRef.current) {
      const selectedCurriculum = curriculumTypes.find(
        (type) => String(type.id) === String(selectedId),
      );

      if (selectedCurriculum) {
        const theoryHours = selectedCurriculum.total_theory_duration
          ? parseInt(selectedCurriculum.total_theory_duration)
          : 0;
        const practicalHours = selectedCurriculum.total_practical_duration
          ? parseInt(selectedCurriculum.total_practical_duration)
          : 0;
        const ojtHours = selectedCurriculum.total_ojt_duration
          ? parseInt(selectedCurriculum.total_ojt_duration)
          : 0;

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

        if (selectedCurriculum.certificate_level_id) {
          formikRef.current.setFieldValue(
            "certificateLevelId",
            String(selectedCurriculum.certificate_level_id),
          );
        }

        return true;
      }
    } else {
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
        List of Non-BQF Programmes
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
            Add Programme
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
              <TableCell>Programme Title</TableCell>
              <TableCell>Programme Type</TableCell>
              <TableCell>Fees Per Trainee (Nu.)</TableCell>
              <TableCell>Theory (Hrs)</TableCell>
              <TableCell>Practical (Hrs)</TableCell>
              <TableCell>OJT (Hrs)</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Curriculum Title</TableCell>
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
                    <TableCell>{course.programmeTitle}</TableCell>
                    <TableCell>{course.programmeTypeName || "-"}</TableCell>
                    <TableCell>{course.feesPerTrainee}</TableCell>
                    <TableCell>{course.theoryHour || 0}</TableCell>
                    <TableCell>{course.practicalHour || 0}</TableCell>
                    <TableCell>{course.ojtHour || 0}</TableCell>
                    <TableCell>
                      {getCertificateLevelName(course.certificateLevelId)}
                    </TableCell>
                    <TableCell>
                      {getCurriculumTypeName(course.curriculumId) || "-"}
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
                                : course.statusName === "Approved"
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
                <TableCell colSpan={12} align="center">
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
        onClose={() => {
          setOpenView(false);
          setQualitySelections({});
        }}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Non BQF Programme Details</DialogTitle>
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
                  label="Programme Type"
                  size="small"
                  value={
                    programmeTypes.find(
                      (pt) =>
                        String(pt.id) ===
                        String(selectedCourse.programmeTypeId),
                    )?.name || "-"
                  }
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
                  label="Programme Title"
                  size="small"
                  value={selectedCourse.programmeTitle}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              {selectedCourse.programmeTypeId !== "137" && (
                <>
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
                      label="Curriculum Title"
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
                </>
              )}
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
                  label="Status"
                  size="small"
                  value={selectedCourse.statusName || "-"}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              {/* Quality Standards - Read Only View */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    mt: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    width: "100%",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Quality Standards
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
                    {qualityData.map(renderViewChecklist)}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              setOpenView(false);
              setQualitySelections({});
            }}
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
        <DialogTitle>Registration of Non-BQF Programme</DialogTitle>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => {
            const isLessThan140 = formik.values.programmeTypeId === "137";

            return (
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
                              Programme Type <RequiredStar />
                            </>
                          }
                          name="programmeTypeId"
                          size="small"
                          value={formik.values.programmeTypeId || ""}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                            if (selectedId === "137") {
                              formik.setFieldValue("curriculumId", "");
                              formik.setFieldValue("theoryHour", "");
                              formik.setFieldValue("practicalHour", "");
                              formik.setFieldValue("ojtHour", "");
                              formik.setFieldValue("certificateLevelId", "");
                              setSelectedCurriculumId(null);
                              setCurriculumDuplicateError("");
                            }
                          }}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.programmeTypeId &&
                            Boolean(formik.errors.programmeTypeId)
                          }
                          helperText={
                            formik.touched.programmeTypeId &&
                            formik.errors.programmeTypeId
                          }
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {programmeTypes.map((type) => (
                            <MenuItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {!isLessThan140 && (
                        <>
                          <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                              select
                              fullWidth
                              label={
                                <>
                                  Curriculum Title <RequiredStar />
                                </>
                              }
                              name="curriculumId"
                              size="small"
                              value={formik.values.curriculumId}
                              onChange={async (e) => {
                                const selectedId = e.target.value;
                                formik.handleChange(e);
                                setSelectedCurriculumId(selectedId);

                                if (selectedId) {
                                  const exists =
                                    await checkCurriculumExists(selectedId);
                                  if (exists) {
                                    setSelectedCurriculumId(null);
                                  }
                                } else {
                                  setCurriculumDuplicateError("");
                                }
                              }}
                              onBlur={formik.handleBlur}
                              error={
                                (formik.touched.curriculumId &&
                                  Boolean(formik.errors.curriculumId)) ||
                                !!curriculumDuplicateError
                              }
                              helperText={
                                (formik.touched.curriculumId &&
                                  formik.errors.curriculumId) ||
                                curriculumDuplicateError ||
                                undefined
                              }
                            >
                              <MenuItem value="">-select-</MenuItem>
                              {curriculumTypes.map((type) => (
                                <MenuItem key={type.id} value={String(type.id)}>
                                  {type.curriculum_title}
                                </MenuItem>
                              ))}
                            </TextField>
                            {checkingCurriculum && (
                              <Typography variant="caption" color="info.main">
                                Checking curriculum availability...
                              </Typography>
                            )}
                            {curriculumDuplicateError && (
                              <Alert
                                severity="error"
                                sx={{ mt: 1 }}
                                size="small"
                              >
                                {curriculumDuplicateError}
                              </Alert>
                            )}
                          </Grid>

                          {selectedCurriculumId &&
                            !curriculumDuplicateError && (
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
                                      formik.touched.ojtHour &&
                                      formik.errors.ojtHour
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

                          {selectedCurriculumId &&
                            !curriculumDuplicateError && (
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
                                    <MenuItem
                                      key={level.id}
                                      value={String(level.id)}
                                    >
                                      {level.name ||
                                        level.value ||
                                        level.certificate_level_name}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            )}
                        </>
                      )}

                      <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={
                            <>
                              Programme Title <RequiredStar />
                            </>
                          }
                          name="programmeTitle"
                          size="small"
                          value={formik.values.programmeTitle}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.programmeTitle &&
                            Boolean(formik.errors.programmeTitle)
                          }
                          helperText={
                            formik.touched.programmeTitle &&
                            formik.errors.programmeTitle
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
                    <Grid
                      container
                      spacing={2}
                      sx={{ width: "100%", margin: 0 }}
                    >
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
                      error={
                        formik.touched.files && Boolean(formik.errors.files)
                      }
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
                      formik.values.files.length === 0 ||
                      !!curriculumDuplicateError ||
                      checkingCurriculum ||
                      (!isLessThan140 && !formik.values.curriculumId)
                    }
                  >
                    {loading ? "Saving..." : "Submit"}
                  </Button>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default NonAccreditedCourseRegistration;
