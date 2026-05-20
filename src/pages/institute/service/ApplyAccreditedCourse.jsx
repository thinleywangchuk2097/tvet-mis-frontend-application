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
  Box,
  Chip,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUpload from "../../../components/file/FileUpload";
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
  const [statusList, setStatusList] = useState([]);

  // Quality Standards State
  const [qualityData, setQualityData] = useState([]);
  const [qualitySelections, setQualitySelections] = useState({});

  useEffect(() => {
    fetchCurriculumTypes();
    fetchInstituteDetails();
    fetchSectors();
    fetchAppliedCourses();
    fetchStatusList();
    fetchQualityStandards();
  }, []);

  // Fetch occupations when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      fetchOccupationsBySector(selectedSectorId);
    } else {
      setOccupations([]);
    }
  }, [selectedSectorId]);

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

  const getStatusName = (statusId) => {
    const status = statusList.find((s) => s.id == statusId);
    return status ? status.name : "Pending";
  };

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
          courseFee: course.course_fee,
          statusId: course.status_id,
          curriculumId: course.curriculum_id,
          curriculum_name: course.curriculum_name,
          registration_no: course.registration_no,
          proposed_institute_name: course.proposed_institute_name,
          institute_id: course.institute_id,
          registration_date: course.registration_date,
          validity_date: course.validity_date,
          created_by: course.created_by,
          created_at: course.created_at,
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
        await CurriculumEndorsementIndexService.getApprovedCurriculumDataByUserId(
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

  const areAllQualityStandardsYes = () => {
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
  };

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
                  <TableCell width="60">Sl. No</TableCell>
                  <TableCell>
                    Quality Indicator <span style={{ color: "red" }}>*</span>
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
                          disabled={dialogMode === "view"}
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
                          disabled={dialogMode === "view"}
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
    if (dialogMode === "view" && selectedCourse) {
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
        courseFee: selectedCourse.courseFee || "",
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
      courseFee: "",
      files: [],
    };
  };

  const validationSchema = Yup.object().shape({
    curriculumId: Yup.string().required("Curriculum is required"),
    sectorId: Yup.string().required("Sector is required"),
    courseId: Yup.string().required("Course Title is required"),
    courseFee: Yup.number()
      .required("Course Fee is required")
      .positive("Course Fee must be a positive number")
      .typeError("Course Fee must be a valid number"),
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
          courseFee: values.courseFee,
          curriculumId: values.curriculumId,
          sectorId: values.sectorId,
          registration_date: new Date().toISOString(),
          validity_date: null,
          createdBy: actionId,
          serviceId: 26,
          assignedRoleId: 7,
          statusId: 55,
          documents: documents,
          qualityStandards: qualityStandardsList,
        };

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

  const handleReset = () => {
    setQualitySelections({});
    toast.info("Form has been reset");
  };

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
                  const statusName = getStatusName(course.statusId);
                  const sectorName = getSectorName(course.sectorId);

                  return (
                    <TableRow key={course.id || index}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{course.applicationNo}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{sectorName}</TableCell>
                      <TableCell>Nu. {course.courseFee}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusName}
                          size="small"
                          sx={{
                            backgroundColor: "#2196f3",
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
                        label="Curriculum"
                        name="curriculumId"
                        size="small"
                        value={formik.values.curriculumId}
                        onChange={formik.handleChange}
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
                            readOnly: dialogMode === "view",
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
                              {curriculum.curriculum_name}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Sector"
                        name="sectorId"
                        size="small"
                        value={formik.values.sectorId}
                        onChange={(e) => {
                          formik.handleChange(e);
                          if (dialogMode !== "view") {
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
                        //disabled={dialogMode === "view"}
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
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
                    <Grid item size={{ xs: 12, md: 4 }}>
                      {dialogMode === "view" ? (
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
                          onChange={(e) => {
                            formik.handleChange(e);
                            const selectedCourseObj = occupations.find(
                              (occ) => occ.id == e.target.value,
                            );
                            if (selectedCourseObj) {
                              formik.setFieldValue(
                                "courseName",
                                selectedCourseObj.occupationName ||
                                  selectedCourseObj.name,
                              );
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
                        >
                          <MenuItem value="">-select-</MenuItem>
                          {loadingOccupations ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} /> Loading courses...
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
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Course Fee (Nu.)"
                        name="courseFee"
                        type="number"
                        size="small"
                        value={formik.values.courseFee}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.courseFee &&
                          Boolean(formik.errors.courseFee)
                        }
                        helperText={
                          formik.touched.courseFee && formik.errors.courseFee
                        }
                        slotProps={{
                          input: {
                            readOnly: dialogMode === "view",
                          },
                        }}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Container 2: Quality Standards */}
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
                    Quality Standards
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

                {/* Container 3: Supporting Documents */}
                <Paper
                  sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
                >
                  <Typography fontWeight={600} gutterBottom>
                    Supporting Documents
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
                    disabled={dialogMode === "view"}
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
                {dialogMode === "add" && (
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
                        !areAllQualityStandardsYes() ||
                        formik.values.files.length === 0
                      }
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </Button>
                  </>
                )}
                {dialogMode === "view" && (
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

export default ApplyAccreditedCourse;
