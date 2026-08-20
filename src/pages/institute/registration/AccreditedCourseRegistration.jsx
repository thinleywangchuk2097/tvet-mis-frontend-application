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
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Radio,
  Box,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import CurriculumIndexService from "../../../api/services/internal/course/CurriculumIndexService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";
import NcsService from "../../../api/services/internal/ncs/NcsService";

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

// Table style constant
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

const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

const AccreditedCourseRegistration = () => {
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
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [genderList, setGenderList] = useState([]);
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [selectedCurriculumDetails, setSelectedCurriculumDetails] =
    useState(null);
  const [programmeTitle, setProgrammeTitle] = useState("");

  // Quality Standards State
  const [qualityData, setQualityData] = useState([]);
  const [qualitySelections, setQualitySelections] = useState({});

  // Formik ref for auto-fill functionality
  const formikRef = useRef(null);

  // Helper function to check if form should be read-only (only for view mode)
  const isReadOnly = () => {
    return dialogMode === "view";
  };

  // Helper function to check if basic info should be read-only (view or renewal mode)
  const isBasicInfoReadOnly = () => {
    return dialogMode === "view" || dialogMode === "renewal";
  };

  useEffect(() => {
    fetchCurriculumTypes();
    fetchInstituteDetails();
    fetchSectors();
    fetchAppliedCourses();
    fetchStatusList();
    fetchGenderList();
    fetchAcademicQualification();
    fetchQualityStandards();
    fetchCertificateLevels();
  }, []);

  // Fetch occupations when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      fetchOccupationsBySector(selectedSectorId);
    } else {
      setOccupations([]);
    }
  }, [selectedSectorId]);

  // Update form values when curriculum details change in view mode
  useEffect(() => {
    if (
      (dialogMode === "view" || dialogMode === "renewal") &&
      selectedCourse?.curriculumId &&
      curriculumTypes.length > 0
    ) {
      // Find the curriculum details
      const selectedCurriculum = curriculumTypes.find(
        (curriculum) => curriculum.id == selectedCourse.curriculumId,
      );
      if (selectedCurriculum) {
        const details = {
          totalProgramDuration: selectedCurriculum.total_program_duration || "",
          totalTheoryDuration: selectedCurriculum.total_theory_duration || "",
          totalPracticalDuration:
            selectedCurriculum.total_practical_duration || "",
          totalOjtDuration: selectedCurriculum.total_ojt_duration || "",
          certificateLevelId: selectedCurriculum.certificate_level_id || "",
        };
        setSelectedCurriculumDetails(details);

        // Update form values if formik is available
        if (formikRef.current) {
          formikRef.current.setFieldValue(
            "totalProgramDuration",
            details.totalProgramDuration,
          );
          formikRef.current.setFieldValue(
            "totalTheoryDuration",
            details.totalTheoryDuration,
          );
          formikRef.current.setFieldValue(
            "totalPracticalDuration",
            details.totalPracticalDuration,
          );
          formikRef.current.setFieldValue(
            "totalOjtDuration",
            details.totalOjtDuration,
          );
          formikRef.current.setFieldValue(
            "certificateLevel",
            details.certificateLevelId,
          );
        }
      }
    }
  }, [curriculumTypes, dialogMode, selectedCourse?.curriculumId]);

  const fetchQualityStandards = async () => {
    try {
      const response = await CommonService.getAllQualitystandards(26); //service id 26 for accredited course application
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

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      setStatusList(statusResponse.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };
  const fetchGenderList = async () => {
    try {
      const genderResponse = await CommonService.getByParentId(8);
      setGenderList(genderResponse.data);
      console.log("Fetched gender list:", genderResponse.data);
    } catch (error) {
      console.error("Error fetching gender list:", error);
    }
  };
  const fetchAcademicQualification = async () => {
    try {
      const AcademicQualification = await CommonService.getByParentId(18);
      setAcademicQualifications(AcademicQualification.data);
      console.log(
        "Fetched Academic Qualification:",
        AcademicQualification.data,
      );
    } catch (error) {
      console.error("Error fetching Academic Qualification :", error);
    }
  };
  const fetchCertificateLevels = async () => {
    try {
      const response = await CommonService.getByParentId(27);
      setCertificateLevels(response.data);
      console.log("Certificate Levels:", response.data);
    } catch (error) {
      console.error("Error fetching certificate levels:", error);
    }
  };

  const fetchProgrammeTitle = async (occupationId) => {
    if (!occupationId) {
      setProgrammeTitle("");
      if (formikRef.current) {
        formikRef.current.setFieldValue("programmeId", "");
      }
      return;
    }

    try {
      const response = await NcsService.getProgrammeTitleByOccupationId(
        occupationId,
        access_token,
      );
      console.log("Programme Title Response:", response);

      if (response && response.data && response.data.length > 0) {
        const programme = response.data[0];
        const title = programme.programme_title || 
                     programme.courseName || 
                     programme.name || 
                     programme.occupationName || 
                     programme.title;
        const id = programme.id || programme.programme_id || "";

        if (title) {
          setProgrammeTitle(title);
          // Update formik with the programme ID
          if (formikRef.current) {
            formikRef.current.setFieldValue("programmeId", id);
          }
          toast.info(`Programme Title auto-filled: ${title}`);
        } else {
          setProgrammeTitle("");
          if (formikRef.current) {
            formikRef.current.setFieldValue("programmeId", "");
          }
        }
      } else {
        setProgrammeTitle("");
        if (formikRef.current) {
          formikRef.current.setFieldValue("programmeId", "");
        }
      }
    } catch (error) {
      console.error("Error fetching programme title:", error);
      setProgrammeTitle("");
      if (formikRef.current) {
        formikRef.current.setFieldValue("programmeId", "");
      }
    }
  };

  const getStatusName = (statusId) => {
    const status = statusList.find((s) => s.id == statusId);
    return status ? status.name : "Pending";
  };

  const getSectorName = (sector_id) => {
    const sector = sectors.find((s) => s.id == sector_id);
    return sector ? sector.sectorName : sector_id;
  };

  const getCertificateLevelName = (certificateLevelId) => {
    const level = certificateLevels.find((l) => l.id == certificateLevelId);
    return level ? level.name : "";
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instituteData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      setInstituteDetails(instituteData);
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
      console.log("Fetched applied courses:", response.data);

      if (response.data && Array.isArray(response.data)) {
        const mappedCourses = response.data.map((course, index) => ({
          id: course.id || index,
          applicationNo: course.application_no,
          courseId: course.course_id,
          course_name: course.course_name,
          sectorId: course.sector_id,
          statusId: course.status_id,
          curriculumId: course.curriculum_id,
          curriculum_title: course.curriculum_title,
          registration_no: course.registration_no,
          proposed_institute_name: course.proposed_institute_name,
          institute_id: course.institute_id,
          registration_date: course.registration_date,
          validity_date: course.validity_date,
          created_by: course.created_by,
          created_at: course.created_at,
          feesPerTrainee: course.fees_per_trainee || "",
          enrolmentCapacity: course.enrolment_capacity || "",
          // Lead Trainer fields
          leadTrainerCidNo: course.lead_trainer_cid_no || "",
          leadTrainerName: course.lead_trainer_name || "",
          genderId: course.gender_id || "",
          academicQualificationId: course.academic_qualification_id || "",
          professionalExperience: course.professional_experience || "",
          // Parse quality standards if it's a string
          qualityStandards: course.quality_standard_responses
            ? typeof course.quality_standard_responses === "string"
              ? JSON.parse(course.quality_standard_responses)
              : course.quality_standard_responses
            : [],
          // Parse documents if needed
          documents: course.documents
            ? typeof course.documents === "string"
              ? JSON.parse(course.documents)
              : course.documents
            : [],
        }));
        setCourses(mappedCourses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching applied courses:", error);
      setCourses([]);
    }
  };

  const fetchSectors = async () => {
    try {
      const sectorDtls = await CommonService.getAllSectors();
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
        await CurriculumIndexService.getApprovedCurriculumDataByUserId(
          registration_no,
          41,
          access_token,
        );
      console.log("Fetched curriculum types:", response.data);
      setCurriculumTypes(response.data);
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
      (getSectorName(c.sectorId)?.toLowerCase() || "").includes(
        search.toLowerCase(),
      ),
  );

  const handleView = async (course) => {
    setSelectedCourse(course);
    setDialogMode("view");
    setSelectedSectorId(course.sectorId);

    // Fetch occupations for the sector to display course name properly
    if (course.sectorId) {
      await fetchOccupationsBySector(course.sectorId);
    }

    // Set curriculum details for view mode
    if (course.curriculumId) {
      const selectedCurriculum = curriculumTypes.find(
        (curriculum) => curriculum.id == course.curriculumId,
      );
      if (selectedCurriculum) {
        setSelectedCurriculumDetails({
          totalProgramDuration: selectedCurriculum.total_program_duration || "",
          totalTheoryDuration: selectedCurriculum.total_theory_duration || "",
          totalPracticalDuration:
            selectedCurriculum.total_practical_duration || "",
          totalOjtDuration: selectedCurriculum.total_ojt_duration || "",
          certificateLevelId: selectedCurriculum.certificate_level_id || "",
        });
      }
    }

    setOpenDialog(true);
    if (course.qualityStandards && course.qualityStandards.length > 0) {
      populateQualitySelections(course.qualityStandards);
    }
  };

  const handleRenewal = async (course) => {
    setSelectedCourse(course);
    setDialogMode("renewal");
    setSelectedSectorId(course.sectorId);

    // Fetch occupations for the sector to display course name properly
    if (course.sectorId) {
      await fetchOccupationsBySector(course.sectorId);
    }

    // Set curriculum details for renewal mode
    if (course.curriculumId) {
      const selectedCurriculum = curriculumTypes.find(
        (curriculum) => curriculum.id == course.curriculumId,
      );
      if (selectedCurriculum) {
        setSelectedCurriculumDetails({
          totalProgramDuration: selectedCurriculum.total_program_duration || "",
          totalTheoryDuration: selectedCurriculum.total_theory_duration || "",
          totalPracticalDuration:
            selectedCurriculum.total_practical_duration || "",
          totalOjtDuration: selectedCurriculum.total_ojt_duration || "",
          certificateLevelId: selectedCurriculum.certificate_level_id || "",
        });
      }
    }

    setOpenDialog(true);
    if (course.qualityStandards && course.qualityStandards.length > 0) {
      populateQualitySelections(course.qualityStandards);
    }
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setDialogMode("add");
    setSelectedSectorId("");
    setOccupations([]);
    setQualitySelections({});
    setSelectedCurriculumDetails(null);
    setProgrammeTitle("");
    setOpenDialog(true);
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

  const renderChecklist = (standard) => {
    // Disable radio buttons only in view mode
    const isReadOnlyMode = dialogMode === "view";

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
                  <TableCell width="60">Sl. No</TableCell>
                  <TableCell>
                    Quality Indicator <RequiredStar />
                  </TableCell>
                  <TableCell align="center" width="100">
                    YES
                  </TableCell>
                  <TableCell align="center" width="100">
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
                          disabled={isReadOnlyMode}
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
                          disabled={isReadOnlyMode}
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

  // Get initial values based on mode
  const getInitialValues = () => {
    if ((dialogMode === "view" || dialogMode === "renewal") && selectedCourse) {
      // Find the curriculum to get duration details
      let curriculumDetails = {};
      if (selectedCourse.curriculumId) {
        const selectedCurriculum = curriculumTypes.find(
          (curriculum) => curriculum.id == selectedCourse.curriculumId,
        );
        if (selectedCurriculum) {
          curriculumDetails = {
            totalProgramDuration:
              selectedCurriculum.total_program_duration || "",
            totalTheoryDuration: selectedCurriculum.total_theory_duration || "",
            totalPracticalDuration:
              selectedCurriculum.total_practical_duration || "",
            totalOjtDuration: selectedCurriculum.total_ojt_duration || "",
            certificateLevelId: selectedCurriculum.certificate_level_id || "",
          };
        }
      }

      return {
        registrationNo:
          selectedCourse.registration_no ||
          instituteDetails?.registration_no ||
          "",
        instituteName:
          selectedCourse.proposed_institute_name ||
          instituteDetails?.proposed_institute_name ||
          "",
        instituteId:
          selectedCourse.institute_id || instituteDetails?.institute_id || "",
        curriculumId: selectedCourse.curriculumId || "",
        sectorId: selectedCourse.sectorId || "",
        courseId: selectedCourse.courseId || "",
        courseName: selectedCourse.course_name || "",
        programmeId: selectedCourse.programme_id || "",
        feesPerTrainee: selectedCourse.feesPerTrainee || "",
        enrolmentCapacity: selectedCourse.enrolmentCapacity || "",
        totalProgramDuration: curriculumDetails.totalProgramDuration || "",
        totalTheoryDuration: curriculumDetails.totalTheoryDuration || "",
        totalPracticalDuration: curriculumDetails.totalPracticalDuration || "",
        totalOjtDuration: curriculumDetails.totalOjtDuration || "",
        certificateLevel: curriculumDetails.certificateLevelId || "",
        // Lead Trainer fields
        leadTrainerCidNo: selectedCourse.leadTrainerCidNo || "",
        leadTrainerName: selectedCourse.leadTrainerName || "",
        genderId: selectedCourse.genderId || "",
        academicQualificationId: selectedCourse.academicQualificationId || "",
        professionalExperience: selectedCourse.professionalExperience || "",
        files: [],
      };
    }

    return {
      registrationNo: instituteDetails?.registration_no || "",
      instituteName: instituteDetails?.proposed_institute_name || "",
      instituteId: instituteDetails?.institute_id || "",
      curriculumId: "",
      sectorId: "",
      courseId: "",
      courseName: "",
      programmeId: "",
      feesPerTrainee: "",
      enrolmentCapacity: "",
      totalProgramDuration: "",
      totalTheoryDuration: "",
      totalPracticalDuration: "",
      totalOjtDuration: "",
      certificateLevel: "",
      // Lead Trainer fields
      leadTrainerCidNo: "",
      leadTrainerName: "",
      genderId: "",
      academicQualificationId: "",
      professionalExperience: "",
      files: [],
    };
  };

  const validationSchema = Yup.object().shape({
    curriculumId: Yup.string().required("Curriculum is required"),
    sectorId: Yup.string().required("Sector is required"),
    courseId: Yup.string().required("Occupation is required"),
    programmeId: Yup.string().required("Programme Title is required"),
    feesPerTrainee: Yup.number()
      .required("Fees per trainee is required")
      .positive("Fees per trainee must be a positive number")
      .typeError("Fees per trainee must be a valid number"),
    enrolmentCapacity: Yup.number()
      .required("Enrollment capacity per batch is required")
      .positive("Enrollment capacity must be a positive number")
      .typeError("Enrollment capacity must be a valid number"),
    // Lead Trainer validations
    leadTrainerCidNo: Yup.string()
      .required("Lead Trainer CID No. is required")
      .min(11, "CID must be exactly 11 digits")
      .max(11, "CID must be exactly 11 digits")
      .matches(/^\d+$/, "CID must contain only numbers"),
    leadTrainerName: Yup.string()
      .required("Lead Trainer Name is required")
      .min(2, "Name must be at least 2 characters"),
    genderId: Yup.string().required("Gender is required"),
    academicQualificationId: Yup.string().required(
      "Academic Qualification is required",
    ),
    professionalExperience: Yup.string()
      .required("Professional Experience is required")
      .min(10, "Please provide more detail about professional experience"),
    files: Yup.array().min(1, "Upload at least one document"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      if (dialogMode === "add") {
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        const qualityStandardsList =
          transformQualityStandards(qualitySelections);

        const submissionData = {
          instituteId: values.instituteId,
          applicantName: values.instituteName,
          courseId: values.courseId,
          programmeId: values.programmeId,
          feesPerTrainee: values.feesPerTrainee,
          enrolmentCapacity: values.enrolmentCapacity,
          curriculumId: values.curriculumId,
          sectorId: values.sectorId,
          certificateLevel: values.certificateLevel,
          // Lead Trainer data
          leadTrainerCidNo: values.leadTrainerCidNo,
          leadTrainerName: values.leadTrainerName,
          genderId: values.genderId,
          academicQualificationId: values.academicQualificationId,
          professionalExperience: values.professionalExperience,
          registration_date: new Date().toISOString(),
          validity_date: null,
          createdBy: actionId,
          serviceId: 26,
          assignedRoleId: 7,
          statusId: 55,
          documents: documents,
          qualityStandards: qualityStandardsList,
        };

        console.log("Submitting data:", submissionData);

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
          setQualitySelections({});
          setSelectedCurriculumDetails(null);
          setProgrammeTitle("");
          setOpenDialog(false);
        } else {
          toast.error(response.message || "Failed to submit application");
        }
      } else if (dialogMode === "renewal") {
        // Handle renewal submission
        const documents = await Promise.all(
          values.files.map((file) => fileToBase64(file)),
        );

        const qualityStandardsList =
          transformQualityStandards(qualitySelections);

        const renewalData = {
          id: selectedCourse.id,
          applicationNo: selectedCourse.applicationNo,
          instituteId: values.instituteId,
          applicantName: values.instituteName,
          courseId: values.courseId,
          programmeId: values.programmeId,
          feesPerTrainee: values.feesPerTrainee,
          enrolmentCapacity: values.enrolmentCapacity,
          curriculumId: values.curriculumId,
          sectorId: values.sectorId,
          certificateLevel: values.certificateLevel,
          // Lead Trainer data
          leadTrainerCidNo: values.leadTrainerCidNo,
          leadTrainerName: values.leadTrainerName,
          genderId: values.genderId,
          academicQualificationId: values.academicQualificationId,
          professionalExperience: values.professionalExperience,
          registration_date: new Date().toISOString(),
          validity_date: null,
          createdBy: actionId,
          serviceId: 54,
          assignedRoleId: 7,
          statusId: 115,
          documents: documents,
          qualityStandards: qualityStandardsList,
          isRenewal: true,
        };

        console.log("Renewal data:", renewalData);

        const response =
          await ApplyAccreditedCourseService.verifyAccreditedCourse(
            renewalData,
            access_token,
          );

        if (response.status === 200 || response.status === 201) {
          toast.success("Course accreditation renewed successfully!");
          await fetchAppliedCourses();
          resetForm();
          setQualitySelections({});
          setSelectedCurriculumDetails(null);
          setProgrammeTitle("");
          setOpenDialog(false);
        } else {
          toast.error(response.message || "Failed to renew accreditation");
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

  const handleReset = () => {
    setQualitySelections({});
    setSelectedCurriculumDetails(null);
    setProgrammeTitle("");
  };

  // Check if renewal should be allowed based on status
  const canRenew = (course) => {
    // Allow renewal for approved courses
    // You can add more conditions like checking validity date, etc.
    const approvedStatusIds = [56, 57]; // Add all status IDs that represent "Approved"
    return approvedStatusIds.includes(parseInt(course.statusId));
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        List of BQF Programmes
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
            Add Programme
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Programme Title</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => {
                  const statusName = getStatusName(course.statusId);
                  const sectorName = getSectorName(course.sectorId);

                  return (
                    <TableRow key={course.id || index}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{course.applicationNo}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{sectorName}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusName}
                          size="small"
                          sx={{
                            backgroundColor:
                              parseInt(course.statusId) === 56 ||
                              parseInt(course.statusId) === 57
                                ? "#4caf50"
                                : "#2196f3",
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
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 0.5,
                            minWidth: "80px",
                            minHeight: "40px",
                          }}
                        >
                          <Tooltip
                            title="View Course Details"
                            arrow
                            placement="top"
                          >
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleView(course)}
                              sx={{ p: 0.5 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* Renewal button - show for approved courses */}
                          {canRenew(course) ? (
                            <Tooltip
                              title="Renew Course Accreditation"
                              arrow
                              placement="top"
                            >
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleRenewal(course)}
                                sx={{ p: 0.5 }}
                              >
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            // Placeholder to maintain width when renewal button is not shown
                            <Box sx={{ width: "32px", height: "32px" }} />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
        onClose={() => {
          setOpenDialog(false);
          handleReset();
        }}
        maxWidth="xl"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Accreditation of BQF Programme"
            : dialogMode === "renewal"
              ? "Renew Course Accreditation"
              : "Accreditation Application Details"}
        </DialogTitle>
        <Formik
          innerRef={formikRef}
          key={
            dialogMode +
            (selectedCourse?.id || "") +
            (instituteDetails?.registration_no || "")
          }
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
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
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Curriculum Title
                            <RequiredStar />
                          </>
                        }
                        name="curriculumId"
                        size="small"
                        value={formik.values.curriculumId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          formik.handleChange(e);

                          if (selectedId && !isBasicInfoReadOnly()) {
                            const selectedCurriculum = curriculumTypes.find(
                              (curriculum) => curriculum.id == selectedId,
                            );
                            if (selectedCurriculum) {
                              const details = {
                                totalProgramDuration:
                                  selectedCurriculum.total_program_duration ||
                                  0,
                                totalTheoryDuration:
                                  selectedCurriculum.total_theory_duration || 0,
                                totalPracticalDuration:
                                  selectedCurriculum.total_practical_duration ||
                                  0,
                                totalOjtDuration:
                                  selectedCurriculum.total_ojt_duration || 0,
                                certificateLevelId:
                                  selectedCurriculum.certificate_level_id || "",
                              };
                              setSelectedCurriculumDetails(details);

                              // Set form values
                              formik.setFieldValue(
                                "totalProgramDuration",
                                details.totalProgramDuration,
                              );
                              formik.setFieldValue(
                                "totalTheoryDuration",
                                details.totalTheoryDuration,
                              );
                              formik.setFieldValue(
                                "totalPracticalDuration",
                                details.totalPracticalDuration,
                              );
                              formik.setFieldValue(
                                "totalOjtDuration",
                                details.totalOjtDuration,
                              );
                              formik.setFieldValue(
                                "certificateLevel",
                                details.certificateLevelId,
                              );
                            }
                          } else if (!selectedId && !isBasicInfoReadOnly()) {
                            setSelectedCurriculumDetails(null);
                            formik.setFieldValue("totalProgramDuration", "");
                            formik.setFieldValue("totalTheoryDuration", "");
                            formik.setFieldValue("totalPracticalDuration", "");
                            formik.setFieldValue("totalOjtDuration", "");
                            formik.setFieldValue("certificateLevel", "");
                          }
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
                        slotProps={{
                          input: {
                            readOnly: isBasicInfoReadOnly(),
                          },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {loadingCurriculumTypes ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} /> Loading...
                          </MenuItem>
                        ) : (
                          curriculumTypes.map((curriculum) => (
                            <MenuItem key={curriculum.id} value={curriculum.id}>
                              {curriculum.curriculum_title}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>

                    {/* Curriculum Details Fields - Only show when curriculum is selected */}
                    {selectedCurriculumDetails && (
                      <>
                        <Grid item size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Total Program Duration (Hours)"
                            name="totalProgramDuration"
                            type="number"
                            size="small"
                            value={formik.values.totalProgramDuration}
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
                            label="Theory Duration (Hours)"
                            name="totalTheoryDuration"
                            type="number"
                            size="small"
                            value={formik.values.totalTheoryDuration}
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
                            label="Practical Duration (Hours)"
                            name="totalPracticalDuration"
                            type="number"
                            size="small"
                            value={formik.values.totalPracticalDuration}
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
                            label="OJT Duration (Hours)"
                            name="totalOjtDuration"
                            type="number"
                            size="small"
                            value={formik.values.totalOjtDuration}
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
                            name="certificateLevel"
                            size="small"
                            value={getCertificateLevelName(
                              formik.values.certificateLevel,
                            )}
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
                        select
                        fullWidth
                        label={
                          <>
                            Sector <RequiredStar />
                          </>
                        }
                        name="sectorId"
                        size="small"
                        value={formik.values.sectorId}
                        onChange={(e) => {
                          formik.handleChange(e);
                          if (!isBasicInfoReadOnly()) {
                            setSelectedSectorId(e.target.value);
                          }
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.sectorId &&
                          Boolean(formik.errors.sectorId)
                        }
                        helperText={
                          formik.touched.sectorId && formik.errors.sectorId
                        }
                        slotProps={{
                          input: {
                            readOnly: isBasicInfoReadOnly(),
                          },
                        }}
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {sectors.map((sector) => (
                          <MenuItem key={sector.id} value={sector.id}>
                            {sector.sectorName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Occupation Dropdown */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      {isBasicInfoReadOnly() ? (
                        <TextField
                          fullWidth
                          label="Occupation"
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
                          label={
                            <>
                              Occupation <RequiredStar />
                            </>
                          }
                          name="courseId"
                          size="small"
                          value={formik.values.courseId}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            formik.handleChange(e);
                            const selectedCourseObj = occupations.find(
                              (occ) => occ.id == selectedValue,
                            );
                            if (selectedCourseObj) {
                              formik.setFieldValue(
                                "courseName",
                                selectedCourseObj.occupationName ||
                                  selectedCourseObj.name,
                              );
                              // Fetch programme title when occupation is selected
                              fetchProgrammeTitle(selectedValue);
                            } else {
                              formik.setFieldValue("courseName", "");
                              setProgrammeTitle("");
                              formik.setFieldValue("programmeId", "");
                            }
                          }}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.courseId &&
                            Boolean(formik.errors.courseId)
                          }
                          helperText={
                            formik.touched.courseId && formik.errors.courseId
                          }
                          disabled={!formik.values.sectorId}
                          slotProps={{
                            input: {
                              readOnly: isBasicInfoReadOnly(),
                            },
                          }}
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {loadingOccupations ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} /> Loading
                              occupations...
                            </MenuItem>
                          ) : (
                            occupations.map((occupation) => (
                              <MenuItem
                                key={occupation.id}
                                value={occupation.id}
                              >
                                {occupation.occupationName ||
                                  occupation.title ||
                                  occupation.name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      )}
                    </Grid>

                    {/* Programme Title - Auto-filled from Endorsed Curriculum (stores ID, displays title) */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Programme Title <RequiredStar />
                          </>
                        }
                        name="programmeId"
                        size="small"
                        value={programmeTitle}
                        onChange={(e) => {
                          // This is read-only, but we keep the handler for formik
                          formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.programmeId &&
                          Boolean(formik.errors.programmeId)
                        }
                        helperText={
                          formik.touched.programmeId &&
                          formik.errors.programmeId
                        }
                        slotProps={{
                          input: {
                            readOnly: true,
                           
                          },
                        }}
                        placeholder="Auto-filled from Endorsed Curriculum"
                      />
                    </Grid>

                    {/* New Fields: Fees per trainee and Enrollment capacity */}
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Fees per trainee (Nu.) <RequiredStar />
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
                        slotProps={{
                          input: {
                            readOnly: isBasicInfoReadOnly(),
                          },
                        }}
                        inputProps={{ min: 1 }}
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
                        slotProps={{
                          input: {
                            readOnly: isBasicInfoReadOnly(),
                          },
                        }}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Container 2: Lead Trainer Information */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Lead Trainer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Lead Trainer CID No. <RequiredStar />
                          </>
                        }
                        name="leadTrainerCidNo"
                        size="small"
                        value={formik.values.leadTrainerCidNo}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.leadTrainerCidNo &&
                          Boolean(formik.errors.leadTrainerCidNo)
                        }
                        helperText={
                          formik.touched.leadTrainerCidNo &&
                          formik.errors.leadTrainerCidNo
                        }
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Lead Trainer Name <RequiredStar />
                          </>
                        }
                        name="leadTrainerName"
                        size="small"
                        value={formik.values.leadTrainerName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.leadTrainerName &&
                          Boolean(formik.errors.leadTrainerName)
                        }
                        helperText={
                          formik.touched.leadTrainerName &&
                          formik.errors.leadTrainerName
                        }
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Gender <RequiredStar />
                          </>
                        }
                        name="genderId"
                        size="small"
                        value={formik.values.genderId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.genderId &&
                          Boolean(formik.errors.genderId)
                        }
                        helperText={
                          formik.touched.genderId && formik.errors.genderId
                        }
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {genderList.map((gender) => (
                          <MenuItem key={gender.id} value={gender.id}>
                            {gender.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label={
                          <>
                            Academic Qualification <RequiredStar />
                          </>
                        }
                        name="academicQualificationId"
                        size="small"
                        value={formik.values.academicQualificationId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.academicQualificationId &&
                          Boolean(formik.errors.academicQualificationId)
                        }
                        helperText={
                          formik.touched.academicQualificationId &&
                          formik.errors.academicQualificationId
                        }
                      >
                        <MenuItem value="">-select-</MenuItem>
                        {academicQualifications.map((qualification) => (
                          <MenuItem
                            key={qualification.id}
                            value={qualification.id}
                          >
                            {qualification.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            Professional Experience <RequiredStar />
                          </>
                        }
                        name="professionalExperience"
                        size="small"
                        value={formik.values.professionalExperience}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.professionalExperience &&
                          Boolean(formik.errors.professionalExperience)
                        }
                        helperText={
                          formik.touched.professionalExperience &&
                          formik.errors.professionalExperience
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Container 3: Quality Standards */}
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
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ mb: 2, display: "block" }}
                  >
                    Please answer all quality indicator questions below
                  </Typography>
                  <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
                    {qualityData.map(renderChecklist)}
                  </Grid>
                </Paper>

                {/* Container 4: Supporting Documents */}
                <Paper
                  sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
                >
                  <Typography fontWeight={600} gutterBottom>
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
                    <li>Curriculum endorsement certificate/letter</li>
                    <li>Trainers CV </li>
                  </Box>
                  <FileUpload
                    files={formik.values.files}
                    onFilesChange={(files) =>
                      formik.setFieldValue("files", files)
                    }
                    disabled={isReadOnly()}
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
                    setOpenDialog(false);
                    handleReset();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                {!isReadOnly() && (
                  <>
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
                      {loading
                        ? "Submitting..."
                        : dialogMode === "renewal"
                          ? "Renew"
                          : "Submit"}
                    </Button>
                  </>
                )}
                {isReadOnly() && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setOpenDialog(false)}
                  >
                    Close
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

export default AccreditedCourseRegistration;