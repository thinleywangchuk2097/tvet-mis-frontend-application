import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
  Typography,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import CourseEnrollmentService from "../../../api/services/internal/course/CourseEnrollmentService";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";
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

const ReAssessmentIndex = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [approvedProgrammes, setApprovedProgrammes] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [reassessmentTypes, setReassessmentTypes] = useState([]);
  const [currentReassessmentType, setCurrentReassessmentType] = useState("");
  const [filterReassessmentType, setFilterReassessmentType] = useState("");
  const [filterCertificationLevel, setFilterCertificationLevel] = useState("");
  const [ncsProgrammes, setNcsProgrammes] = useState([]);
  const [accreditedProgramme, setAccreditedProgrammes] = useState([]);

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Fetch institute details and dropdown data on component mount
  useEffect(() => {
    fetchInstituteDetails();
    fetchDropdownData();
    fetchDzongkhags();
    fetchStatusList();
    fetchReAssessmentServiceName();
    fetchAllNcsProgrammeData();
  }, []);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteDetails(response.data);
      console.log("Institute Details:", response.data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const levelsResponse = await CommonService.getByParentId(27);
      setCertificationLevels(levelsResponse.data);

      const fundingResponse = await CommonService.getByParentId(16);
      setFundingSources(fundingResponse.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
      console.log("Dzongkhags:", dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchReAssessmentServiceName = async () => {
    try {
      const response =
        await CourseEnrollmentService.getReAssessmentServiceName(access_token);
      console.log("Re-assessment Service Name:", response.data);
      if (response.data && Array.isArray(response.data)) {
        const filteredTypes = response.data.filter(
          (type) => type.id === "41" || type.id === "42",
        );
        setReassessmentTypes(filteredTypes);
      }
    } catch (error) {
      console.error("Error fetching re-assessment service name:", error);
    }
  };

  const fetchAllNcsProgrammeData = async () => {
    try {
      //const rplResponse = await CommonService.getAllOccupations();
      const ncsResponse = await NcsService.getAllNcsProgrammes(access_token);
      console.log("NCS Programmes response:", ncsResponse.data);
      const mappedNcsProgramme = ncsResponse.data.map((ncs) => ({
        id: ncs.id,
        name: ncs.programme_title,
        serviceId: "41",
        originalData: ncs,
      }));
      setNcsProgrammes(mappedNcsProgramme);
      console.log("NCS Programmes loaded:", mappedNcsProgramme);

      const accreditedResponse =
        await ApplyAccreditedCourseService.getAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        );
      const mappedAccreditedCourses = accreditedResponse.data.map(
        (programmeData) => ({
          id: programmeData.id,
          name: programmeData.programme_title,
          serviceId: "42",
          originalData: programmeData,
        }),
      );
      setAccreditedProgrammes(mappedAccreditedCourses);
      console.log("Accredited Programmes loaded:", mappedAccreditedCourses);
    } catch (error) {
      console.error("Error fetching all programmes data:", error);
      toast.error("Failed to load programmes data");
    }
  };

  const fetchEnrolledCourses = async (reassessmentTypeId) => {
    if (!reassessmentTypeId) {
      setProgrammes([]);
      return;
    }

    try {
      const response =
        await CourseEnrollmentService.getCourseDetailsAnnouncementByUserId(
          registration_no,
          reassessmentTypeId,
          access_token,
        );
      console.log("Fetched enrolled programmes", response.data);
      setProgrammes(response.data);
      console.log(
        "Enrolled Programmes for type",
        reassessmentTypeId,
        ":",
        response.data,
      );
    } catch (error) {
      console.error("Error fetching programmes:", error);
      setProgrammes([]);
      toast.error("Failed to fetch programmes");
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

  const fetchApprovedCourses = async (reassessmentTypeId) => {
    try {
      if (!reassessmentTypeId) {
        setApprovedProgrammes([]);
        setCurrentReassessmentType("");
        return;
      }

      setCurrentReassessmentType(reassessmentTypeId);

      if (reassessmentTypeId === "42" || reassessmentTypeId === 42) {
        setApprovedProgrammes(accreditedProgramme);
        console.log("Using Accredited Programmes:", accreditedProgramme);
      } else if (reassessmentTypeId === "41" || reassessmentTypeId === 41) {
        setApprovedProgrammes(ncsProgrammes);
        console.log("Using NCS Programmes:", ncsProgrammes);
      } else {
        setApprovedProgrammes([]);
      }
    } catch (error) {
      console.error("Error fetching approved programmes:", error);
      setApprovedProgrammes([]);
      toast.error("Failed to fetch programmes");
    }
  };

  const institute = instituteDetails[0] || {};

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleViewDetails = (applicationNo, programmeId) => {
    navigate(
      `/announcement/reassessment-trainee-selection/${applicationNo}/${programmeId}`,
    );
  };

  const getReassessmentTypeName = (serviceId) => {
    if (!serviceId) return "N/A";
    const type = reassessmentTypes.find((t) => t.id === String(serviceId));
    return type ? type.service_name : "N/A";
  };

  const getProgrammeName = (programmeId, serviceId) => {
    if (!programmeId) return "N/A";

    let programme = null;

    if (serviceId === "41" || serviceId === 41) {
      programme = ncsProgrammes.find(
        (c) => String(c.id) === String(programmeId),
      );
    } else if (serviceId === "42" || serviceId === 42) {
      programme = accreditedProgramme.find(
        (c) => String(c.id) === String(programmeId),
      );
    } else {
      programme = approvedProgrammes.find(
        (c) => String(c.id) === String(programmeId),
      );
    }

    return programme ? programme.name : programmeId;
  };

  // UPDATED: Added certification level filter to the filtering logic
  const filteredProgrammes = programmes.filter((programme) => {
    const programmeName = getProgrammeName(
      programme.programme_id,
      programme.service_id,
    );
    const matchesSearch =
      programmeName?.toLowerCase().includes(search.toLowerCase()) ||
      programme.application_no?.toLowerCase().includes(search.toLowerCase());

    const matchesCertificationLevel =
      !filterCertificationLevel ||
      String(programme.certification_level_id) ===
        String(filterCertificationLevel);

    return matchesSearch && matchesCertificationLevel;
  });
  console.log("Filtered courses:", filteredProgrammes);

  const initialValues = {
    instituteId: institute.institute_id || "",
    reassessmentTypeId: "",
    programmeId: "",
    feesPerTrainee: "",
    enrollmentCapacity: "",
    courseStartDate: "",
    courseEndDate: "",
    certificationLevelId: "",
    fundingSourceId: "",
    trainingLocationId: "",
    courseDescription: "",
    files: [],
  };

  const validationSchema = Yup.object().shape({
    reassessmentTypeId: Yup.string().required("Reassessment Type is required"),
    programmeId: Yup.string().required("Programme Name is required"),
    feesPerTrainee: Yup.number()
      .typeError("Must be a number")
      .required("Programme Fee is required"),
    enrollmentCapacity: Yup.number()
      .typeError("Must be a number")
      .required("Total number of trainees required"),
    courseStartDate: Yup.date()
      .typeError("Invalid date")
      .required("Course Start Date required"),
    courseEndDate: Yup.date()
      .typeError("Invalid date")
      .required("Course End Date required")
      .min(
        Yup.ref("courseStartDate"),
        "Course end date cannot be before programme start date",
      ),
    certificationLevelId: Yup.string().required(
      "Certification Level is required",
    ),
    fundingSourceId: Yup.string().required("Funding Source is required"),
    trainingLocationId: Yup.string().required("Training Location is required"),
    courseDescription: Yup.string().required("Course Description is required"),
    files: Yup.array()
      .min(1, "Please upload required documents")
      .max(5, "Maximum 5 files allowed"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const payload = {
        instituteId: values.instituteId,
        serviceId: values.reassessmentTypeId,
        programmeId: values.programmeId,
        feesPerTrainee: values.feesPerTrainee,
        enrollmentCapacity: values.enrollmentCapacity,
        courseStartDate: values.courseStartDate,
        courseEndDate: values.courseEndDate,
        certificationLevelId: values.certificationLevelId,
        fundingSourceId: values.fundingSourceId,
        trainingLocationId: values.trainingLocationId,
        courseDescription: values.courseDescription,
        createdBy: actionId,
        statusId: 55,
        remarks: "",
        documents: documents,
      };

      console.log("Submitting payload:", payload);

      const response = await CourseEnrollmentService.submitCourseAnnouncement(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Re-Assessment submitted successfully!");
        await fetchEnrolledCourses(values.reassessmentTypeId);
        resetForm();
        setOpenDialog(false);
      }
    } catch (error) {
      console.error("Error submitting re-assessment:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit re-assessment",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const status = statusList.find(
      (s) => parseInt(s.id) === parseInt(statusId),
    );
    return status ? status.name : "Pending";
  };

  const getStatusColor = (statusId) => {
    const statusName = getStatusName(statusId);
    switch (statusName.toLowerCase()) {
      case "approved":
        return "#4caf50";
      case "rejected":
        return "#f44336";
      case "pending":
      default:
        return "#ff9800";
    }
  };

  const getDzongkhagName = (locationId) => {
    if (!locationId) return "N/A";
    const dzongkhag = dzongkhags.find(
      (dzong) => dzong.id === parseInt(locationId),
    );
    return dzongkhag ? dzongkhag.dzonkhagName : "N/A";
  };

  const getCertificationLevelName = (levelId) => {
    if (!levelId) return "N/A";
    const level = certificationLevels.find((l) => l.id === parseInt(levelId));
    return level ? level.name : levelId;
  };

  const getFundingSourceName = (sourceId) => {
    if (!sourceId) return "N/A";
    const source = fundingSources.find((s) => s.id === parseInt(sourceId));
    return source ? source.name : sourceId;
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Re-Assessment
      </Typography>

      <Grid
        container
        spacing={2}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Reassessment Type</InputLabel>
            <Select
              value={filterReassessmentType}
              onChange={async (e) => {
                const value = e.target.value;
                setFilterReassessmentType(value);
                setFilterCertificationLevel("");
                setSearch("");
                setPage(0);
                await fetchEnrolledCourses(value);
              }}
              label="Select Reassessment Type"
              sx={{ height: "36px" }}
            >
              <MenuItem value="">-Select Reassessment Type-</MenuItem>
              {reassessmentTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.service_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {filterReassessmentType && (
          <>
            <Grid item size={{ xs: 12, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Certification Level</InputLabel>
                <Select
                  value={filterCertificationLevel}
                  onChange={(e) => {
                    setFilterCertificationLevel(e.target.value);
                    setPage(0);
                  }}
                  label="Certification Level"
                  sx={{ height: "36px" }}
                >
                  <MenuItem value="">All Certification Levels</MenuItem>
                  {certificationLevels.map((level) => (
                    <MenuItem key={level.id} value={level.id}>
                      {level.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item size={{ xs: 12, md: 2.5 }}>
              <TextField
                label="Search by Course or Application No"
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
          </>
        )}

        <Grid item size={{ xs: 12, md: filterReassessmentType ? 2 : 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ height: "36px" }}
          >
            Add Re-Assessment
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Reassessment Type</TableCell>
              <TableCell>Programme Name</TableCell>
              <TableCell>Fees per Trainee (Nu.)</TableCell>
              <TableCell>Enrollment Capacity</TableCell>
              <TableCell>Certification Level</TableCell>
              <TableCell>Funding Source</TableCell>
              <TableCell>Programme Period</TableCell>
              <TableCell>Training Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filterReassessmentType ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  Please select a Reassessment Type to view the data
                </TableCell>
              </TableRow>
            ) : filteredProgrammes.length > 0 ? (
              filteredProgrammes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((programme, index) => (
                  <TableRow key={programme.id || index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{programme.application_no || "N/A"}</TableCell>
                    <TableCell>
                      {getReassessmentTypeName(programme.service_id)}
                    </TableCell>
                    <TableCell>
                      {getProgrammeName(
                        programme.programme_id,
                        programme.service_id,
                      )}
                    </TableCell>
                    <TableCell>
                      Nu.{" "}
                      {programme.fees_per_trainee ||
                        programme.feesPerTrainee ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      {programme.enrollment_capacity ||
                        programme.enrollmentCapacity ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      {getCertificationLevelName(
                        programme.certification_level_id,
                      )}
                    </TableCell>
                    <TableCell>
                      {getFundingSourceName(programme.funding_source_id)}
                    </TableCell>
                    <TableCell>
                      {programme.course_start_date && programme.course_end_date
                        ? `${new Date(programme.course_start_date).toLocaleDateString()} - ${new Date(programme.course_end_date).toLocaleDateString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {getDzongkhagName(programme.training_location_id)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusName(programme.status_id)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(programme.status_id),
                          color: "white",
                          fontWeight: "medium",
                          minWidth: "80px",
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
                        onClick={() =>
                          handleViewDetails(
                            programme.application_no,
                            programme.programme_id,
                          )
                        }
                        title="View Details"
                      >
                        <RemoveRedEyeIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  No data available for selected reassessment type
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filterReassessmentType && filteredProgrammes.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProgrammes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create Re-Assessment</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          validateOnBlur={true}
          validateOnChange={true}
          validateOnMount={false}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={
                        <>
                          Reassessment Type <RequiredStar />
                        </>
                      }
                      name="reassessmentTypeId"
                      size="small"
                      value={formik.values.reassessmentTypeId}
                      onChange={async (e) => {
                        const value = e.target.value;
                        formik.handleChange(e);
                        formik.setFieldValue("programmeId", "");
                        if (value) {
                          await fetchApprovedCourses(value);
                        } else {
                          setApprovedProgrammes([]);
                        }
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.reassessmentTypeId &&
                        Boolean(formik.errors.reassessmentTypeId)
                      }
                      helperText={
                        formik.touched.reassessmentTypeId &&
                        formik.errors.reassessmentTypeId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {reassessmentTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.service_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={
                        <>
                          Programme Name <RequiredStar />
                        </>
                      }
                      name="programmeId"
                      size="small"
                      select
                      value={formik.values.programmeId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.programmeId &&
                        Boolean(formik.errors.programmeId)
                      }
                      helperText={
                        formik.touched.programmeId && formik.errors.programmeId
                      }
                      disabled={
                        !formik.values.reassessmentTypeId ||
                        approvedProgrammes.length === 0
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {approvedProgrammes.map((programme) => (
                        <MenuItem key={programme.id} value={programme.id}>
                          {programme.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={
                        <>
                          Fees per Trainee (Nu.) <RequiredStar />
                        </>
                      }
                      name="feesPerTrainee"
                      size="small"
                      type="number"
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

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={
                        <>
                          Certification Level <RequiredStar />
                        </>
                      }
                      name="certificationLevelId"
                      size="small"
                      value={formik.values.certificationLevelId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.certificationLevelId &&
                        Boolean(formik.errors.certificationLevelId)
                      }
                      helperText={
                        formik.touched.certificationLevelId &&
                        formik.errors.certificationLevelId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {certificationLevels.map((level) => (
                        <MenuItem key={level.id} value={level.id}>
                          {level.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={
                        <>
                          Enrollment Capacity per Batch <RequiredStar />
                        </>
                      }
                      name="enrollmentCapacity"
                      size="small"
                      type="number"
                      value={formik.values.enrollmentCapacity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.enrollmentCapacity &&
                        Boolean(formik.errors.enrollmentCapacity)
                      }
                      helperText={
                        formik.touched.enrollmentCapacity &&
                        formik.errors.enrollmentCapacity
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label={
                        <>
                          Course Start Date <RequiredStar />
                        </>
                      }
                      name="courseStartDate"
                      size="small"
                      value={formik.values.courseStartDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={
                        formik.touched.courseStartDate &&
                        Boolean(formik.errors.courseStartDate)
                      }
                      helperText={
                        formik.touched.courseStartDate &&
                        formik.errors.courseStartDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label={
                        <>
                          Course End Date <RequiredStar />
                        </>
                      }
                      name="courseEndDate"
                      size="small"
                      value={formik.values.courseEndDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={
                        formik.touched.courseEndDate &&
                        Boolean(formik.errors.courseEndDate)
                      }
                      helperText={
                        formik.touched.courseEndDate &&
                        formik.errors.courseEndDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={
                        <>
                          Funding Source <RequiredStar />
                        </>
                      }
                      name="fundingSourceId"
                      size="small"
                      value={formik.values.fundingSourceId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.fundingSourceId &&
                        Boolean(formik.errors.fundingSourceId)
                      }
                      helperText={
                        formik.touched.fundingSourceId &&
                        formik.errors.fundingSourceId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {fundingSources.map((source) => (
                        <MenuItem key={source.id} value={source.id}>
                          {source.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={
                        <>
                          Training Location (Dzongkhag) <RequiredStar />
                        </>
                      }
                      name="trainingLocationId"
                      size="small"
                      value={formik.values.trainingLocationId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.trainingLocationId &&
                        Boolean(formik.errors.trainingLocationId)
                      }
                      helperText={
                        formik.touched.trainingLocationId &&
                        formik.errors.trainingLocationId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {dzongkhags.map((dzongkhag) => (
                        <MenuItem key={dzongkhag.id} value={dzongkhag.id}>
                          {dzongkhag.dzonkhagName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={
                        <>
                          Course Description <RequiredStar />
                        </>
                      }
                      name="courseDescription"
                      size="small"
                      value={formik.values.courseDescription}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseDescription &&
                        Boolean(formik.errors.courseDescription)
                      }
                      helperText={
                        formik.touched.courseDescription &&
                        formik.errors.courseDescription
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <FileUpload
                      files={formik.values.files}
                      onFilesChange={(files) => {
                        formik.setFieldValue("files", files);
                        setTimeout(() => {
                          formik.validateField("files");
                        }, 100);
                      }}
                      error={
                        formik.touched.files && Boolean(formik.errors.files)
                      }
                      helperText={formik.touched.files && formik.errors.files}
                    />
                    {!formik.touched.files &&
                      formik.values.files.length === 0 && (
                        <Typography variant="caption" color="textSecondary">
                          Please upload required documents (PDF, DOC, etc.)
                        </Typography>
                      )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => setOpenDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
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

export default ReAssessmentIndex;
