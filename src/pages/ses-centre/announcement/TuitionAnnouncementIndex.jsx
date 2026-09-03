import { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  Chip,
  CircularProgress,
  Box,
  FormControlLabel,
  Switch,
  Tooltip,
  Avatar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import TuitionAnnouncementService from "../../../api/services/internal/ses-center/TuitionAnnouncementService";
import SubjectService from "../../../api/services/internal/ses-center/SubjectService";
import TutorService from "../../../api/services/internal/ses-center/TutorService";

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

// ==================== PROPTYPES ====================

const requiredLabelPropTypes = {
  children: PropTypes.node.isRequired,
};

// ==================== COMPONENTS ====================

// Custom styled component for required field label
const RequiredLabel = ({ children }) => (
  <span>
    {children}
    <span style={{ color: "red", marginLeft: "4px" }}>*</span>
  </span>
);

RequiredLabel.propTypes = requiredLabelPropTypes;

// Status list constant
const STATUS_LIST = [
  { id: 1, name: "Draft", color: "#ff9800" },
  { id: 2, name: "Published", color: "#4caf50" },
  { id: 3, name: "Closed", color: "#f44336" },
  { id: 4, name: "Cancelled", color: "#9e9e9e" },
];

const TuitionAnnouncementIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [instituteId, setInstituteId] = useState(null);
  const [isInstituteLoaded, setIsInstituteLoaded] = useState(false);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  // Fetch institute details on component mount
  useEffect(() => {
    fetchInstituteDetails();
  }, []);

  // Fetch subjects, tutors, and announcements when instituteId is available
  useEffect(() => {
    if (instituteId) {
      fetchSubjects();
      fetchTutors();
      fetchAnnouncements();
    }
  }, [instituteId]);

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const instId = response.data[0]?.institute_id;
      if (instId) {
        console.log("Fetched Institute ID:", instId);
        setInstituteId(instId);
      } else {
        toast.error("Institute ID not found");
      }
      setIsInstituteLoaded(true);
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to fetch institute details");
      setIsInstituteLoaded(true);
    }
  };

  // Helper function to map subject data from API
  const mapSubjectData = (subject) => ({
    id: subject.id ? parseInt(subject.id) : null,
    subjectCode: subject.subject_code,
    subjectName: subject.subject_name,
    creditHours: subject.credit_hours,
    theoryHours: subject.theory_hours,
    practicalHours: subject.practical_hours,
    statusId: subject.status_id ? parseInt(subject.status_id) : 1,
    description: subject.description,
    instituteId: subject.institute_id,
  });

  const fetchSubjects = async () => {
    try {
      const response = await SubjectService.getAllSubjects(
        instituteId,
        access_token,
      );
      console.log("Subjects Response:", response);

      if (response && response.data) {
        const subjectsData = Array.isArray(response.data)
          ? response.data.map(mapSubjectData)
          : [];
        setSubjects(subjectsData);
        console.log("Mapped subjects:", subjectsData);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  // Helper function to map tutor data from API
  const mapTutorData = (tutor) => ({
    id: tutor.id ? parseInt(tutor.id) : null,
    citizenId: tutor.citizen_id,
    firstName: tutor.first_name?.trim(),
    middleName: tutor.middle_name || "",
    lastName: tutor.last_name,
    email: tutor.email,
    phone: tutor.mobile_no,
    qualificationId: tutor.qualification_id
      ? parseInt(tutor.qualification_id)
      : null,
    specialization: tutor.specialization,
    experienceYears: tutor.experience_years
      ? parseInt(tutor.experience_years)
      : 0,
    hourlyRate: tutor.hourly_rate,
    statusId: tutor.status_id ? parseInt(tutor.status_id) : 1,
    joiningDate: tutor.joining_date,
    description: tutor.description || "",
    instituteId: tutor.institute_id,
  });

  const fetchTutors = async () => {
    try {
      const response = await TutorService.getAllTutors(
        instituteId,
        access_token,
      );
      console.log("Tutors Response:", response);

      if (response && response.data) {
        const tutorsData = Array.isArray(response.data)
          ? response.data.map(mapTutorData)
          : [];
        setTutors(tutorsData);
        console.log("Mapped tutors:", tutorsData);
      }
    } catch (error) {
      console.error("Error fetching tutors:", error);
      setTutors([]);
    }
  };

  // Helper function to map announcement data from API
  const mapAnnouncementData = (announcement) => ({
    id: announcement.id ? parseInt(announcement.id) : null,
    title: announcement.title,
    description: announcement.description,
    subjectId: announcement.subject_id
      ? parseInt(announcement.subject_id)
      : null,
    tutorId: announcement.tutor_id ? parseInt(announcement.tutor_id) : null,
    startDate: announcement.start_date,
    endDate: announcement.end_date,
    startTime: announcement.start_time,
    endTime: announcement.end_time,
    venue: announcement.venue,
    maxStudents: announcement.max_students
      ? parseInt(announcement.max_students)
      : 0,
    currentEnrollments: announcement.current_enrollments
      ? parseInt(announcement.current_enrollments)
      : 0,
    fee: announcement.fee,
    requirements: announcement.requirements || "",
    materials: announcement.materials || "",
    contactPerson: announcement.contact_person,
    contactPhone: announcement.contact_phone,
    statusId: announcement.status_id ? parseInt(announcement.status_id) : 1,
    instituteId: announcement.institute_id,
    createdBy: announcement.created_by,
    createdAt: announcement.created_at,
    updatedBy: announcement.updated_by,
    updatedAt: announcement.updated_at,
  });

  const fetchAnnouncements = async () => {
    if (!instituteId) {
      console.warn("Institute ID not available yet");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching announcements with Institute ID:", instituteId);
      const response =
        await TuitionAnnouncementService.getAllTuitionAnnouncement(
          instituteId,
          access_token,
        );
      console.log("Fetch Announcements Response:", response);

      if (response && response.data) {
        const announcementsData = Array.isArray(response.data)
          ? response.data.map(mapAnnouncementData)
          : [];
        setAnnouncements(announcementsData);
        console.log("Mapped announcements:", announcementsData);
        if (announcementsData.length === 0) {
          toast.info("No tuition announcements found");
        }
      } else {
        setAnnouncements([]);
        toast.warning("No tuition announcements found");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch tuition announcements",
      );
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? `${subject.subjectName} (${subject.subjectCode})` : "N/A";
  };

  const getTutorName = (tutorId) => {
    const tutor = tutors.find((t) => t.id === tutorId);
    if (tutor) {
      const fullName = tutor.middleName
        ? `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`
        : `${tutor.firstName} ${tutor.lastName}`;
      return fullName;
    }
    return "N/A";
  };

  const getStatusName = (statusId) => {
    const status = STATUS_LIST.find((s) => s.id === statusId);
    return status ? status.name : "Unknown";
  };

  const getStatusColor = (statusId) => {
    const status = STATUS_LIST.find((s) => s.id === statusId);
    return status ? status.color : "#9e9e9e";
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      (a.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (getSubjectName(a.subjectId)?.toLowerCase() || "").includes(
        search.toLowerCase(),
      ) ||
      (getTutorName(a.tutorId)?.toLowerCase() || "").includes(
        search.toLowerCase(),
      ),
  );

  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedAnnouncement(null);
    setDialogMode("add");
    setOpenDialog(true);
  };

  // Delete handlers
  const handleDeleteClick = (announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;

    setLoading(true);
    try {
      const response =
        await TuitionAnnouncementService.deleteTuitionAnnouncement(
          announcementToDelete.id,
          access_token,
        );

      if (response && response.status === 200) {
        const responseData = response.data;
        if (responseData?.status === "SUCCESS") {
          toast.success(
            responseData?.message || "Announcement deleted successfully!",
          );
        } else {
          toast.success("Announcement deleted successfully!");
        }
        await fetchAnnouncements(); // Refresh the list
      } else {
        toast.error(response?.data?.message || "Failed to delete announcement");
      }
      setDeleteConfirmOpen(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete announcement",
      );
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setAnnouncementToDelete(null);
  };

  // Get initial values based on mode
  const getInitialValues = () => {
    if (
      (dialogMode === "edit" || dialogMode === "view") &&
      selectedAnnouncement
    ) {
      return {
        id: selectedAnnouncement.id || "",
        title: selectedAnnouncement.title || "",
        description: selectedAnnouncement.description || "",
        subjectId: selectedAnnouncement.subjectId || "",
        tutorId: selectedAnnouncement.tutorId || "",
        startDate: selectedAnnouncement.startDate || "",
        endDate: selectedAnnouncement.endDate || "",
        startTime: selectedAnnouncement.startTime || "",
        endTime: selectedAnnouncement.endTime || "",
        venue: selectedAnnouncement.venue || "",
        maxStudents: selectedAnnouncement.maxStudents || "",
        fee: selectedAnnouncement.fee || "",
        requirements: selectedAnnouncement.requirements || "",
        materials: selectedAnnouncement.materials || "",
        contactPerson: selectedAnnouncement.contactPerson || "",
        contactPhone: selectedAnnouncement.contactPhone || "",
        statusId: selectedAnnouncement.statusId || 1,
      };
    }
    return {
      id: "",
      title: "",
      description: "",
      subjectId: "",
      tutorId: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      venue: "",
      maxStudents: "",
      fee: "",
      requirements: "",
      materials: "",
      contactPerson: "",
      contactPhone: "",
      statusId: 1,
    };
  };

  // FIXED: Removed `this` usage - using arrow functions with context parameter
  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .max(200, "Title must be at most 200 characters"),
    description: Yup.string()
      .required("Description is required")
      .max(1000, "Description must be at most 1000 characters"),
    subjectId: Yup.string().required("Subject is required"),
    tutorId: Yup.string().required("Tutor is required"),
    startDate: Yup.string().required("Start date is required"),
    endDate: Yup.string()
      .required("End date is required")
      .test(
        "is-after-start",
        "End date must be after start date",
        (value, context) => {
          const { startDate } = context.parent;
          if (!startDate || !value) return true;
          return new Date(value) >= new Date(startDate);
        },
      ),
    startTime: Yup.string().required("Start time is required"),
    endTime: Yup.string()
      .required("End time is required")
      .test(
        "is-after-start",
        "End time must be after start time",
        (value, context) => {
          const { startTime } = context.parent;
          if (!startTime || !value) return true;
          return value > startTime;
        },
      ),
    venue: Yup.string().required("Venue is required"),
    maxStudents: Yup.number()
      .required("Maximum students is required")
      .positive("Must be positive")
      .max(100, "Maximum students cannot exceed 100")
      .typeError("Must be a valid number"),
    fee: Yup.number()
      .required("Fee is required")
      .min(0, "Fee cannot be negative")
      .typeError("Must be a valid number"),
    contactPerson: Yup.string().required("Contact person is required"),
    contactPhone: Yup.string().required("Contact phone is required"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!instituteId) {
      toast.error("Institute ID not available. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const payload = {
        id: dialogMode === "edit" ? values.id : null,
        title: values.title,
        description: values.description,
        subjectId: parseInt(values.subjectId),
        tutorId: parseInt(values.tutorId),
        startDate: values.startDate,
        endDate: values.endDate,
        startTime: values.startTime,
        endTime: values.endTime,
        venue: values.venue,
        maxStudents: parseInt(values.maxStudents),
        fee: values.fee.toString(),
        requirements: values.requirements || "",
        materials: values.materials || "",
        contactPerson: values.contactPerson,
        contactPhone: values.contactPhone,
        statusId: parseInt(values.statusId),
        instituteId: instituteId,
        createdBy: actionId,
        updatedBy: actionId,
      };

      let response;

      if (dialogMode === "add") {
        response = await TuitionAnnouncementService.submitTuitionAnnouncement(
          payload,
          access_token,
        );
        console.log("Submit Response:", response);

        if (response && response.status === 201) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message ||
                "Tuition announcement created successfully!",
            );
            resetForm();
            setOpenDialog(false);
            await fetchAnnouncements();
          } else {
            toast.error(
              responseData?.message || "Failed to create announcement",
            );
          }
        } else if (response && response.status === 200) {
          toast.success(
            response.data?.message ||
              "Tuition announcement created successfully!",
          );
          resetForm();
          setOpenDialog(false);
          await fetchAnnouncements();
        } else {
          toast.error(
            response?.data?.message || "Failed to create announcement",
          );
        }
      } else if (dialogMode === "edit") {
        response = await TuitionAnnouncementService.updateTuitionAnnouncement(
          payload,
          access_token,
        );
        console.log("Update Response:", response);

        if (response && response.status === 200) {
          const responseData = response.data;
          if (responseData?.status === "SUCCESS") {
            toast.success(
              responseData?.message ||
                "Tuition announcement updated successfully!",
            );
          } else {
            toast.success("Tuition announcement updated successfully!");
          }
          setOpenDialog(false);
          await fetchAnnouncements();
        } else {
          toast.error(
            response?.data?.message || "Failed to update announcement",
          );
        }
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      if (error.response?.status === 409) {
        toast.error(
          error.response?.data?.message || "Announcement already exists!",
        );
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || "Announcement not found!");
      } else {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while saving the announcement",
        );
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleReset = (resetForm) => {
    resetForm();
    toast.info("Form has been reset");
  };

  const getEnrollmentStatus = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return { text: "Full", color: "#f44336" };
    if (percentage >= 80) return { text: "Almost Full", color: "#ff9800" };
    return { text: "Available", color: "#4caf50" };
  };

  // Show loading while fetching institute details
  if (!isInstituteLoaded) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading institute details...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Tuition Announcements
        </Typography>
        <Chip
          icon={<AnnouncementIcon />}
          label={`Total: ${announcements.length}`}
          color="primary"
          variant="outlined"
        />
      </Box>

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
            placeholder="Search by title, subject or tutor"
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
            Add Announcement
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Tutor</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell align="center">Enrollment</TableCell>
              <TableCell align="center">Fee</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center" width={130}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((announcement, index) => {
                  const statusName = getStatusName(announcement.statusId);
                  const statusColor = getStatusColor(announcement.statusId);
                  const enrollmentStatus = getEnrollmentStatus(
                    announcement.currentEnrollments,
                    announcement.maxStudents,
                  );

                  return (
                    <TableRow key={announcement.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {announcement.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {announcement.description?.substring(0, 60)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getSubjectName(announcement.subjectId)}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                          >
                            {getTutorName(announcement.tutorId).charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {getTutorName(announcement.tutorId)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <DateRangeIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption">
                              {announcement.startDate} to {announcement.endDate}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <ScheduleIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption">
                              {announcement.startTime} - {announcement.endTime}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip
                          title={`${announcement.currentEnrollments} / ${announcement.maxStudents} students enrolled`}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {announcement.currentEnrollments}/
                              {announcement.maxStudents}
                            </Typography>
                            <Chip
                              label={enrollmentStatus.text}
                              size="small"
                              sx={{
                                backgroundColor: enrollmentStatus.color,
                                color: "white",
                                height: 20,
                                fontSize: "0.7rem",
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <AttachMoneyIcon sx={{ fontSize: 12 }} />
                          <Typography variant="body2">
                            {announcement.fee}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusName}
                          size="small"
                          sx={{
                            backgroundColor: statusColor,
                            color: "white",
                            fontWeight: "medium",
                            minWidth: "70px",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleView(announcement)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Announcement">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => handleEdit(announcement)}
                            disabled={announcement.statusId !== 1}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Announcement">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(announcement)}
                            disabled={announcement.statusId === 2}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "No data available in table"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAnnouncements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit/View Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AnnouncementIcon />
              <Typography variant="h6">
                {dialogMode === "add"
                  ? "Create New Tuition Announcement"
                  : dialogMode === "edit"
                    ? "Edit Tuition Announcement"
                    : "Tuition Announcement Details"}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Formik
          key={dialogMode + (selectedAnnouncement?.id || "")}
          initialValues={getInitialValues()}
          validationSchema={dialogMode !== "view" ? validationSchema : null}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Basic Information */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Basic Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Title</RequiredLabel>}
                            name="title"
                            size="small"
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.title &&
                              Boolean(formik.errors.title)
                            }
                            helperText={
                              formik.touched.title && formik.errors.title
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Description</RequiredLabel>}
                            name="description"
                            size="small"
                            multiline
                            rows={3}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.description &&
                              Boolean(formik.errors.description)
                            }
                            helperText={
                              formik.touched.description &&
                              formik.errors.description
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label={<RequiredLabel>Subject</RequiredLabel>}
                            name="subjectId"
                            size="small"
                            value={formik.values.subjectId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.subjectId &&
                              Boolean(formik.errors.subjectId)
                            }
                            helperText={
                              formik.touched.subjectId &&
                              formik.errors.subjectId
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          >
                            <MenuItem value="">-select-</MenuItem>
                            {subjects.map((subject) => (
                              <MenuItem key={subject.id} value={subject.id}>
                                {subject.subjectName} ({subject.subjectCode})
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label={<RequiredLabel>Tutor</RequiredLabel>}
                            name="tutorId"
                            size="small"
                            value={formik.values.tutorId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.tutorId &&
                              Boolean(formik.errors.tutorId)
                            }
                            helperText={
                              formik.touched.tutorId && formik.errors.tutorId
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          >
                            <MenuItem value="">-select-</MenuItem>
                            {tutors.map((tutor) => {
                              const fullName = tutor.middleName
                                ? `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`
                                : `${tutor.firstName} ${tutor.lastName}`;
                              return (
                                <MenuItem key={tutor.id} value={tutor.id}>
                                  {fullName}
                                </MenuItem>
                              );
                            })}
                          </TextField>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Schedule & Venue */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Schedule & Venue
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Start Date</RequiredLabel>}
                            name="startDate"
                            type="date"
                            size="small"
                            value={formik.values.startDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.startDate &&
                              Boolean(formik.errors.startDate)
                            }
                            helperText={
                              formik.touched.startDate &&
                              formik.errors.startDate
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>End Date</RequiredLabel>}
                            name="endDate"
                            type="date"
                            size="small"
                            value={formik.values.endDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.endDate &&
                              Boolean(formik.errors.endDate)
                            }
                            helperText={
                              formik.touched.endDate && formik.errors.endDate
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Start Time</RequiredLabel>}
                            name="startTime"
                            type="time"
                            size="small"
                            value={formik.values.startTime}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.startTime &&
                              Boolean(formik.errors.startTime)
                            }
                            helperText={
                              formik.touched.startTime &&
                              formik.errors.startTime
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>End Time</RequiredLabel>}
                            name="endTime"
                            type="time"
                            size="small"
                            value={formik.values.endTime}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.endTime &&
                              Boolean(formik.errors.endTime)
                            }
                            helperText={
                              formik.touched.endTime && formik.errors.endTime
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Venue</RequiredLabel>}
                            name="venue"
                            size="small"
                            value={formik.values.venue}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.venue &&
                              Boolean(formik.errors.venue)
                            }
                            helperText={
                              formik.touched.venue && formik.errors.venue
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Enrollment & Fee */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Enrollment & Fee
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={
                              <RequiredLabel>Maximum Students</RequiredLabel>
                            }
                            name="maxStudents"
                            type="number"
                            size="small"
                            value={formik.values.maxStudents}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.maxStudents &&
                              Boolean(formik.errors.maxStudents)
                            }
                            helperText={
                              formik.touched.maxStudents &&
                              formik.errors.maxStudents
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                            inputProps={{ min: 1, max: 100 }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Fee (Nu.)</RequiredLabel>}
                            name="fee"
                            type="number"
                            size="small"
                            value={formik.values.fee}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.fee && Boolean(formik.errors.fee)
                            }
                            helperText={formik.touched.fee && formik.errors.fee}
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                            inputProps={{ min: 0 }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Requirements & Materials */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Requirements & Materials
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Requirements"
                            name="requirements"
                            size="small"
                            multiline
                            rows={2}
                            value={formik.values.requirements}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.requirements &&
                              Boolean(formik.errors.requirements)
                            }
                            helperText={
                              formik.touched.requirements &&
                              formik.errors.requirements
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Materials Provided"
                            name="materials"
                            size="small"
                            multiline
                            rows={2}
                            value={formik.values.materials}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.materials &&
                              Boolean(formik.errors.materials)
                            }
                            helperText={
                              formik.touched.materials &&
                              formik.errors.materials
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Contact Information */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Paper
                      sx={{ p: 2, border: "1px solid", borderColor: "divider" }}
                    >
                      <Typography fontWeight={600} gutterBottom>
                        Contact Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={
                              <RequiredLabel>Contact Person</RequiredLabel>
                            }
                            name="contactPerson"
                            size="small"
                            value={formik.values.contactPerson}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.contactPerson &&
                              Boolean(formik.errors.contactPerson)
                            }
                            helperText={
                              formik.touched.contactPerson &&
                              formik.errors.contactPerson
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label={<RequiredLabel>Contact Phone</RequiredLabel>}
                            name="contactPhone"
                            size="small"
                            value={formik.values.contactPhone}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.contactPhone &&
                              Boolean(formik.errors.contactPhone)
                            }
                            helperText={
                              formik.touched.contactPhone &&
                              formik.errors.contactPhone
                            }
                            slotProps={{
                              input: {
                                readOnly: dialogMode === "view",
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {dialogMode !== "view" && (
                    <Grid item size={{ xs: 12, md: 12 }}>
                      <Paper
                        sx={{
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography fontWeight={600} gutterBottom>
                          Status
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item size={{ xs: 12, md: 12 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={formik.values.statusId === 2}
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      "statusId",
                                      e.target.checked ? 2 : 1,
                                    )
                                  }
                                  color="primary"
                                />
                              }
                              label={
                                formik.values.statusId === 2
                                  ? "Published"
                                  : "Draft"
                              }
                            />
                            {formik.values.statusId === 1 && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                Draft announcements are only visible to you.
                                Switch to Published to make it publicly
                                available.
                              </Alert>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
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
                  {dialogMode === "view" ? "Close" : "Cancel"}
                </Button>
                {dialogMode !== "view" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => handleReset(formik.resetForm)}
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
                      disabled={loading}
                    >
                      {loading
                        ? "Saving..."
                        : dialogMode === "add"
                          ? "Create"
                          : "Update"}
                    </Button>
                  </>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{announcementToDelete?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleCancelDelete}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            size="small"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
TuitionAnnouncementIndex.propTypes = {};

export default TuitionAnnouncementIndex;
