import React, { useState, useEffect } from "react";
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
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Tooltip,
  Snackbar,
  Checkbox,
  Chip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import SendIcon from "@mui/icons-material/Send";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import TotService from "../../../api/services/internal/tot/TotService";
import CommonService from "../../../api/services/internal/common/CommonService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import AddTrainerService from "../../../api/services/internal/trainer/AddTrainerService";

const ApplyTrainerToTProgram = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [programsData, setProgramsData] = useState([]);
  const [trainers, setTrainers] = useState({});
  const [selectedTrainers, setSelectedTrainers] = useState({});
  const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [programTypes, setProgramTypes] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [instituteId, setInstituteId] = useState(null);
  const [allTrainers, setAllTrainers] = useState([]);

  // Reference data for mapping IDs to names
  const [genders, setGenders] = useState([]);
  const [academicQualifications, setAcademicQualifications] = useState([]);
  const [isReferenceDataLoaded, setIsReferenceDataLoaded] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);
  const actionId = useSelector((state) => state.auth.id);

  // Fetch reference data on component mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

  // Fetch data after reference data is loaded
  useEffect(() => {
    if (isReferenceDataLoaded) {
      fetchProgramTypes();
      fetchStatusOptions();
      fetchPrograms();
      fetchInstituteDetails();
    }
  }, [isReferenceDataLoaded]);

  // Fetch trainers after instituteId is set
  useEffect(() => {
    if (instituteId) {
      fetchInstituteTrainerDetails();
    }
  }, [instituteId]);

  // Fetch announcements whenever programsData changes
  useEffect(() => {
    if (programsData.length > 0) {
      fetchAnnouncements();
    }
  }, [programsData]);

  const fetchReferenceData = async () => {
    try {
      await Promise.all([fetchGenders(), fetchAcademicQualifications()]);
      setIsReferenceDataLoaded(true);
    } catch (error) {
      console.error("Error loading reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  const fetchGenders = async () => {
    try {
      const response = await CommonService.getByParentId(8);
      setGenders(response.data);
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchAcademicQualifications = async () => {
    try {
      const response = await CommonService.getByParentId(18);
      setAcademicQualifications(response.data);
    } catch (error) {
      console.error("Error fetching academic qualifications:", error);
    }
  };

  const fetchProgramTypes = async () => {
    try {
      const response = await CommonService.getByParentId(28);
      setProgramTypes(response.data);
    } catch (error) {
      console.error("Error fetching program types:", error);
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await CommonService.getByParentId(29);
      setStatusOptions(response.data);
    } catch (error) {
      console.error("Error fetching status options:", error);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);

      if (response.data && response.data.length > 0) {
        const instituteData = response.data[0];
        const id = instituteData.institute_id;
        setInstituteId(id);
      }
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to fetch institute details");
    }
  };

  const getGenderName = (genderId) => {
    if (!genderId) return "";
    const gender = genders.find((g) => String(g.id) === String(genderId));
    return gender?.name || "";
  };

  const getQualificationName = (qualificationId) => {
    if (!qualificationId) return "";
    const qualification = academicQualifications.find(
      (q) => String(q.id) === String(qualificationId),
    );
    return qualification?.name || "";
  };

  const fetchInstituteTrainerDetails = async () => {
    try {
      setLoading(true);
      const response = await AddTrainerService.getAllTrainer(
        instituteId,
        access_token,
      );

      if (response && response.data) {
        const mappedTrainers = (response.data || []).map((trainer) => ({
          id: trainer.id,
          name: trainer.name,
          cid: trainer.citizen_id || "",
          email: trainer.email,
          phone: trainer.mobile_no,
          genderId: trainer.gender_id,
          genderName: getGenderName(trainer.gender_id),
          qualificationId: trainer.qualification_id,
          qualificationName: getQualificationName(trainer.qualification_id),
          experience: trainer.work_experience || "0",
          specialization: trainer.specialization || "",
          joiningDate: trainer.joining_date,
          description: trainer.description || "",
          employmentTypeId: trainer.employment_type_id,
          files: trainer.files || [],
          courses: trainer.courses || [],
        }));
        setAllTrainers(mappedTrainers);
      }
    } catch (error) {
      console.error("Error fetching institute trainer details:", error);
      toast.error("Failed to fetch trainers");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await TotService.getToTPrograms(access_token);

      const parsedPrograms = (response.data || []).map((program) => {
        let modules = [];
        try {
          if (typeof program.modules === "string") {
            modules = JSON.parse(program.modules);
          } else if (Array.isArray(program.modules)) {
            modules = program.modules;
          }
        } catch (e) {
          console.error("Error parsing modules for program:", program.id, e);
          modules = [];
        }

        return {
          ...program,
          modules: modules,
          totalModules: modules.length,
          programName: program.programName || program.program_name,
          programCode: program.programCode || program.program_code,
          programTypeId: program.program_type_id || program.programTypeId,
          statusId: program.statusId || program.status_id,
        };
      });

      setProgramsData(parsedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response =
        await TotService.getToTProgramsAnnouncement(access_token);

      const mappedAnnouncements = (response.data || []).map((item) => {
        const program = programsData.find(
          (p) => String(p.id) === String(item.program_id),
        );

        return {
          id: item.id,
          applicationNo: item.application_no || "N/A",
          programName: program?.programName || "Unknown Program",
          programCode: program?.programCode || "N/A",
          programTypeId: item.program_type_id || program?.programTypeId,
          applicationStartDate: item.application_start_date,
          applicationEndDate: item.application_end_date,
          programStartDate: item.program_start_date,
          programEndDate: item.program_end_date,
          maxParticipants: item.max_participants,
          venue: item.venue,
          eligibilityCriteria: item.eligibility_criteria,
          remarks: item.remarks,
          status: "Active",
          programId: item.program_id,
          statusId: item.status_id,
        };
      });

      setAnnouncements(mappedAnnouncements);

      const initialTrainers = {};
      const initialSelected = {};
      mappedAnnouncements.forEach((item) => {
        initialTrainers[item.id] = [];
        initialSelected[item.id] = [];
      });
      setTrainers(initialTrainers);
      setSelectedTrainers(initialSelected);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainersForAnnouncement = async (announcementId) => {
    try {
      setLoading(true);

      let trainerList = [];

      if (allTrainers && allTrainers.length > 0) {
        trainerList = allTrainers.map((trainer) => ({
          id: trainer.id,
          name: trainer.name,
          cid: trainer.cid || "",
          email: trainer.email,
          phone: trainer.phone,
          gender: trainer.genderName || "",
          qualification: trainer.qualificationName || "",
          experience: trainer.experience
            ? `${trainer.experience} years`
            : "0 years",
          specialization: trainer.specialization || "",
        }));
      }

      setTrainers((prev) => ({
        ...prev,
        [announcementId]: trainerList,
      }));

      setSelectedTrainers((prev) => ({
        ...prev,
        [announcementId]: [],
      }));

      setExpandedAnnouncement(announcementId);

      return trainerList;
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast.error("Failed to fetch trainers");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleLoadTrainers = async (announcementId) => {
    if (expandedAnnouncement === announcementId) {
      setExpandedAnnouncement(null);
      return;
    }

    if (trainers[announcementId] && trainers[announcementId].length > 0) {
      setExpandedAnnouncement(announcementId);
      return;
    }

    await fetchTrainersForAnnouncement(announcementId);
  };

  const handleSelectTrainer = (announcementId, trainerId) => {
    setSelectedTrainers((prev) => {
      const currentSelected = prev[announcementId] || [];
      if (currentSelected.includes(trainerId)) {
        return {
          ...prev,
          [announcementId]: currentSelected.filter((id) => id !== trainerId),
        };
      } else {
        return {
          ...prev,
          [announcementId]: [...currentSelected, trainerId],
        };
      }
    });
  };

  const handleSelectAllTrainers = (announcementId, event) => {
    const trainerList = trainers[announcementId] || [];
    if (event.target.checked) {
      setSelectedTrainers((prev) => ({
        ...prev,
        [announcementId]: trainerList.map((t) => t.id),
      }));
    } else {
      setSelectedTrainers((prev) => ({
        ...prev,
        [announcementId]: [],
      }));
    }
  };

  const handleApplyTrainers = async (announcementId) => {
    const selected = selectedTrainers[announcementId] || [];
    if (selected.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select at least one trainer to apply",
        severity: "warning",
      });
      return;
    }

    // Find the announcement to get applicationNo
    const announcement = announcements.find(
      (a) => String(a.id) === String(announcementId),
    );
    const applicationNo = announcement?.applicationNo || null;

    setLoading(true);
    try {
      // Prepare the payload for ALL selected trainers as a list
      const payload = selected.map((trainerId) => ({
        applicationNo: applicationNo,
        instituteId: parseInt(instituteId),
        trainerId: parseInt(trainerId),
        programAnnouncementId: parseInt(announcementId),
        createdBy: parseInt(actionId),
        serviceId: 24,
        assignedRoleId: 14,
        userId: null,
        statusId: 122,
        remarks: null,
      }));

      console.log("Applying trainers payload (List):", payload);

      const response = await TotService.applyTrainerToTOTProgram(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        const data = response.data;
        setSnackbar({
          open: true,
          message:
            data?.message ||
            `${selected.length} trainer(s) applied successfully!`,
          severity: "success",
        });

        // Clear selection after successful application
        setSelectedTrainers((prev) => ({
          ...prev,
          [announcementId]: [],
        }));
      } else {
        setSnackbar({
          open: true,
          message: response.data?.message || "Failed to apply trainers",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error applying trainers:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to apply trainers",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getProgramTypeName = (programTypeId) => {
    const type = programTypes.find((t) => t.id === parseInt(programTypeId));
    return type ? type.name : "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const filteredAnnouncements = announcements.filter(
    (item) =>
      item.applicationNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.programName?.toLowerCase().includes(search.toLowerCase()) ||
      item.programCode?.toLowerCase().includes(search.toLowerCase()),
  );

  const TrainerTable = ({ announcementId, trainersList }) => {
    const [trainerPage, setTrainerPage] = useState(0);
    const [trainerRowsPerPage, setTrainerRowsPerPage] = useState(5);

    const handleTrainerPageChange = (event, newPage) => setTrainerPage(newPage);
    const handleTrainerRowsPerPageChange = (event) => {
      setTrainerRowsPerPage(+event.target.value);
      setTrainerPage(0);
    };

    const isAllSelected = () => {
      const selected = selectedTrainers[announcementId] || [];
      return trainersList.length > 0 && selected.length === trainersList.length;
    };

    const selectedCount = (selectedTrainers[announcementId] || []).length;

    if (trainersList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          No trainers available for this program.
        </Alert>
      );
    }

    return (
      <Box>
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected()}
                    onChange={(e) => handleSelectAllTrainers(announcementId, e)}
                  />
                </TableCell>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>CID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Specialization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trainersList
                .slice(
                  trainerPage * trainerRowsPerPage,
                  trainerPage * trainerRowsPerPage + trainerRowsPerPage,
                )
                .map((trainer, index) => {
                  const isSelected = (
                    selectedTrainers[announcementId] || []
                  ).includes(trainer.id);
                  return (
                    <TableRow
                      key={trainer.id}
                      hover
                      selected={isSelected}
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        handleSelectTrainer(announcementId, trainer.id)
                      }
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() =>
                            handleSelectTrainer(announcementId, trainer.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {index + 1 + trainerPage * trainerRowsPerPage}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {trainer.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{trainer.cid}</TableCell>
                      <TableCell>{trainer.email}</TableCell>
                      <TableCell>{trainer.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={trainer.gender || "N/A"}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trainer.qualification || "N/A"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trainer.experience || "0 years"}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{trainer.specialization || "—"}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={trainersList.length}
            rowsPerPage={trainerRowsPerPage}
            page={trainerPage}
            onPageChange={handleTrainerPageChange}
            onRowsPerPageChange={handleTrainerRowsPerPageChange}
          />
        </TableContainer>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Selected: <strong>{selectedCount}</strong> trainer(s)
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<SendIcon />}
            onClick={() => handleApplyTrainers(announcementId)}
            disabled={selectedCount === 0 || loading}
            size="small"
          >
            Apply Selected ({selectedCount})
          </Button>
        </Box>
      </Box>
    );
  };

  if (!isReferenceDataLoaded) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 20, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading reference data...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Apply Trainer to TOT Program
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          View TOT program announcements and apply existing trainers to
          programs. Click "Load Trainers" to view and select trainers for each
          program.
        </Typography>
      </Box>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Announcements"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Application No. or Program Name"
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Program Name</TableCell>
              <TableCell>Program Code</TableCell>
              <TableCell>Program Type</TableCell>
              <TableCell>Application Start Date</TableCell>
              <TableCell>Application End Date</TableCell>
              <TableCell>Program Start Date</TableCell>
              <TableCell>Program End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => {
                  const announcementTrainers = trainers[item.id] || [];
                  const isExpanded = expandedAnnouncement === item.id;
                  const hasTrainers = announcementTrainers.length > 0;

                  return (
                    <React.Fragment key={item.id}>
                      <TableRow>
                        <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.applicationNo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.programName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="textSecondary">
                            {item.programCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getProgramTypeName(item.programTypeId)}
                            size="small"
                            color={
                              item.programTypeId === 121 ? "primary" : "default"
                            }
                            icon={
                              item.programTypeId === 121 ? <SchoolIcon /> : null
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(item.applicationStartDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.applicationEndDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.programStartDate)}
                        </TableCell>
                        <TableCell>{formatDate(item.programEndDate)}</TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              isExpanded ? "Hide Trainers" : "Load Trainers"
                            }
                          >
                            <Button
                              size="small"
                              variant={isExpanded ? "outlined" : "contained"}
                              color="primary"
                              startIcon={<PersonAddIcon />}
                              onClick={() => handleLoadTrainers(item.id)}
                              sx={{
                                textTransform: "none",
                                fontSize: "0.75rem",
                              }}
                            >
                              {isExpanded ? "Hide Trainers" : "Load Trainers"}
                              {hasTrainers && !isExpanded && (
                                <Chip
                                  label={announcementTrainers.length}
                                  size="small"
                                  color="primary"
                                  sx={{
                                    ml: 1,
                                    height: 20,
                                    "& .MuiChip-label": {
                                      fontSize: "0.7rem",
                                      px: 1,
                                    },
                                  }}
                                />
                              )}
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            sx={{ py: 1, px: 2, backgroundColor: "#fafafa" }}
                          >
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                              >
                                Trainers for {item.programName}
                                <Chip
                                  label={`${announcementTrainers.length} Total`}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Typography>
                              {loading ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 2,
                                  }}
                                >
                                  <CircularProgress size={30} />
                                </Box>
                              ) : (
                                <TrainerTable
                                  announcementId={item.id}
                                  trainersList={announcementTrainers}
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No TOT announcements available
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ApplyTrainerToTProgram;
