import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paper,
  Typography,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Box,
  Divider,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import { toast } from "react-toastify";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";
import { useSelector } from "react-redux";
import ProgramMonitoringService from "../../../api/services/internal/monitoring/ProgramMonitoringService";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";

const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 20,
    padding: "2px 4px",
    fontSize: "0.70rem",
    lineHeight: 1.1,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
    padding: "4px 4px",
  },
  "& .MuiRadio-root": {
    padding: "0px",
  },
};

const InstituteProgramMonitoringIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Dialog state
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Description state
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  // File upload state
  const [files, setFiles] = useState([]);
  const [filesError, setFilesError] = useState("");

  // Quality checklist state
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [programMonitoringDetails, setProgramMonitoringDetails] = useState([]);
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qualityData, setQualityData] = useState([]);
  const [qualityStandardsLoading, setQualityStandardsLoading] = useState(false);
  const [qualityStandardsError, setQualityStandardsError] = useState(null);
  const [statusList, setStatusList] = useState([]);

  // Course types and courses lookup maps
  const [courseTypesMap, setCourseTypesMap] = useState({});
  const [coursesMap, setCoursesMap] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    fetchProgramMonitoringAssessments();
    fetchDzongkhagLists();
    fetchCourseTypesAndCourses();
    fetchStatusList();
  }, []);

  // Effect to parse checklists when quality data is loaded
  useEffect(() => {
    if (
      selectedProgram &&
      qualityData.length > 0 &&
      selectedProgram.checklists
    ) {
      const { responses, remarks } = parseChecklistData(
        selectedProgram.checklists,
      );
      setQualityResponses(responses);
      setQualityRemarks(remarks);
    }
  }, [qualityData, selectedProgram]);

  // Fetch dzongkhag list
  const fetchDzongkhagLists = async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data || []);
    } catch (error) {
      console.error("Error fetching dzongkhag dropdown:", error);
      toast.error("Failed to load dzongkhags");
    }
  };

  const fetchStatusList = async () => {
    try {
      const statusResponse = await CommonService.getByParentId(4);
      console.log("Fetched status list:", statusResponse.data);
      setStatusList(statusResponse.data);
    } catch (error) {
      console.error("Error fetching status list:", error);
    }
  };

  // Get status name from ID
  const getStatusName = useCallback(
    (statusId) => {
      const status = statusList.find((s) => s.id === parseInt(statusId, 10));
      return status ? status.name : statusId || "-";
    },
    [statusList],
  );

  // Fetch course types and courses for mapping
  const fetchCourseTypesAndCourses = async () => {
    try {
      // Fetch course types
      const courseTypesResponse =
        await ProgramMonitoringService.getCourseTypes(access_token);
      const courseTypes = courseTypesResponse.data || [];
      const typesMap = {};
      courseTypes.forEach((type) => {
        typesMap[type.id] = type.service_name;
      });
      setCourseTypesMap(typesMap);
      console.log("Course Types Map:", typesMap);

      // Fetch all courses (you might need to fetch per institute, but for display we'll use what's available)
      // Since courses are institute-specific, we'll fetch them when needed
    } catch (error) {
      console.error("Error fetching course types:", error);
    }
  };

  // Fetch course name by ID
  const fetchCourseName = async (courseId, instituteId, courseTypeId) => {
    if (!courseId || !instituteId || !courseTypeId) return null;

    // Check if already in cache
    if (coursesMap[courseId]) {
      return coursesMap[courseId];
    }

    try {
      const response = await ProgramMonitoringService.getCourseByInstituteId(
        instituteId,
        courseTypeId,
        access_token,
      );
      const courses = response.data || [];
      const newMap = { ...coursesMap };
      courses.forEach((course) => {
        newMap[course.id || course.course_id] = course.course_name;
      });
      setCoursesMap(newMap);
      return newMap[courseId] || courseId;
    } catch (error) {
      console.error("Error fetching course name:", error);
      return courseId;
    }
  };

  // Get course type name from ID
  const getCourseTypeName = useCallback(
    (courseTypeId) => {
      return courseTypesMap[courseTypeId] || courseTypeId || "-";
    },
    [courseTypesMap],
  );

  // Get course name from ID - will be populated after fetch
  const [courseNamesMap, setCourseNamesMap] = useState({});

  // Fetch program monitoring assessments
  const fetchProgramMonitoringAssessments = async () => {
    setLoading(true);
    try {
      const response = await ProgramMonitoringService.getProgramMonitoring(
        registration_no,
        access_token,
      );
      const data = response.data || [];
      setProgramMonitoringDetails(data);
      console.log("Program Monitoring Details:", data);

      // Fetch course names for each record
      for (const program of data) {
        if (
          program.course_id &&
          program.institute_id &&
          program.course_type_id
        ) {
          try {
            const courseResponse =
              await ProgramMonitoringService.getCourseByInstituteId(
                program.institute_id,
                program.course_type_id,
                access_token,
              );
            const courses = courseResponse.data || [];
            const newMap = { ...courseNamesMap };
            courses.forEach((course) => {
              const id = course.id || course.course_id;
              newMap[id] = course.course_name;
            });
            setCourseNamesMap(newMap);
          } catch (error) {
            console.error("Error fetching course for program:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Program Monitoring Details:", error);
      toast.error("Failed to load Program Monitoring Details");
    } finally {
      setLoading(false);
    }
  };

  // Get course name from ID
  const getCourseName = useCallback(
    (courseId) => {
      return courseNamesMap[courseId] || courseId || "-";
    },
    [courseNamesMap],
  );

  // Fetch quality standards
  const fetchQualityStandards = async (serviceId) => {
    setQualityStandardsLoading(true);
    setQualityStandardsError(null);
    try {
      const response = await CommonService.getAllQualitystandards(serviceId);
      const checklistData = response.data || [];
      if (checklistData && checklistData.length > 0) {
        // Structure the data based on parent-child relationship
        const mainCategories = checklistData.filter(
          (item) =>
            (item.parentId === 0 || item.parentId === null || !item.parentId) &&
            (!item.parent_id || item.parent_id === 0),
        );

        const subCategories = checklistData.filter(
          (item) =>
            (item.parentId !== 0 && item.parentId) ||
            (item.parent_id !== 0 && item.parent_id),
        );

        let structured = [];

        if (mainCategories.length > 0) {
          structured = mainCategories.map((category) => ({
            id: category.id?.toString() || category.standard_id?.toString(),
            title:
              category.dropdownName ||
              category.description ||
              category.name ||
              `Category ${category.id}`,
            rows: subCategories
              .filter(
                (sub) =>
                  sub.parentId === category.id || sub.parent_id === category.id,
              )
              .map((sub) => ({
                id: sub.id?.toString() || sub.standard_id?.toString(),
                value:
                  sub.dropdownName ||
                  sub.description ||
                  sub.name ||
                  `Question ${sub.id}`,
              })),
          }));
        } else {
          // If no parent-child relationship, create a single category
          console.log(
            "No parent-child relationship found, creating single category",
          );
          structured = [
            {
              id: "1",
              title: "Quality Standards Checklist",
              rows: checklistData.map((item) => ({
                id: item.id?.toString() || item.standard_id?.toString(),
                value:
                  item.dropdownName ||
                  item.description ||
                  item.name ||
                  `Question ${item.id}`,
              })),
            },
          ];
        }

        // Filter out categories with no rows
        structured = structured.filter((category) => category.rows.length > 0);
        setQualityData(structured);
        if (structured.length === 0) {
          setQualityStandardsError(
            "No quality standards found for this service",
          );
        }
      } else {
        console.log("No quality standards data received");
        setQualityStandardsError(
          "No quality standards available for this service",
        );
        setQualityData([]);
      }
    } catch (error) {
      console.error("Error fetching quality standards:", error);
      setQualityStandardsError(
        error.message || "Failed to load quality standards",
      );
      toast.error("Failed to load quality standards");
      setQualityData([]);
    } finally {
      setQualityStandardsLoading(false);
    }
  };

  // Parse checklist data from API response
  const parseChecklistData = useCallback(
    (checklistString) => {
      try {
        const checklists = JSON.parse(checklistString);
        const responses = {};
        const remarks = {};

        checklists.forEach((item) => {
          let foundCategory = null;
          for (const category of qualityData) {
            const foundRow = category.rows.find(
              (row) => row.id === item.standardId?.toString(),
            );
            if (foundRow) {
              foundCategory = category;
              break;
            }
          }

          if (foundCategory) {
            const categoryId = foundCategory.id;
            if (!responses[categoryId]) {
              responses[categoryId] = {};
            }
            if (!remarks[categoryId]) {
              remarks[categoryId] = {};
            }
            responses[categoryId][item.standardId] = item.responseId;
            remarks[categoryId][item.standardId] = item.remarks || "";
          } else {
            const defaultCategoryId = "default";
            if (!responses[defaultCategoryId]) {
              responses[defaultCategoryId] = {};
            }
            if (!remarks[defaultCategoryId]) {
              remarks[defaultCategoryId] = {};
            }
            responses[defaultCategoryId][item.standardId] = item.responseId;
            remarks[defaultCategoryId][item.standardId] = item.remarks || "";
          }
        });
        return { responses, remarks };
      } catch (error) {
        console.error("Error parsing checklist data:", error);
        return { responses: {}, remarks: {} };
      }
    },
    [qualityData],
  );

  // Get dzongkhag name from ID
  const getDzongkhagName = useCallback(
    (dzongkhagId) => {
      const dzongkhag = dzongkhagList.find(
        (d) => d.id === parseInt(dzongkhagId, 10),
      );
      return dzongkhag ? dzongkhag.dzonkhagName || dzongkhag.name : dzongkhagId;
    },
    [dzongkhagList],
  );

  // File to base64 conversion
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
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
  }, []);

  // Handle view checklist
  const handleViewChecklist = async (program) => {
    setSelectedProgram(program);
    setChecklistDialogOpen(true);

    // Reset previous data
    setQualityResponses({});
    setQualityRemarks({});
    setDescription(program.description || "");
    setDescriptionError("");
    setFiles([]); // Reset files
    setFilesError("");

    // Fetch quality standards using the service_id from the program data
    if (program.service_id) {
      await fetchQualityStandards(program.service_id);
    } else {
      toast.error("Service ID not found for this program");
      setQualityData([]);
    }
  };

  // Handle description change
  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
    if (event.target.value.trim()) {
      setDescriptionError("");
    }
  };

  // Handle files change
  const handleFilesChange = (uploadedFiles) => {
    setFiles(uploadedFiles);
    if (uploadedFiles.length > 0) {
      setFilesError("");
    }
  };

  // Handle quality response change
  const handleQualityResponseChange = (categoryId, questionId, value) => {
    setQualityResponses((prev) => {
      const newResponses = { ...prev };

      if (!newResponses[categoryId]) {
        newResponses[categoryId] = {};
      }

      if (newResponses[categoryId][questionId] === value) {
        delete newResponses[categoryId][questionId];
        if (Object.keys(newResponses[categoryId]).length === 0) {
          delete newResponses[categoryId];
        }
      } else {
        newResponses[categoryId][questionId] = value;
      }

      return newResponses;
    });
  };

  // Handle quality remark change
  const handleQualityRemarkChange = (categoryId, questionId, value) => {
    setQualityRemarks((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [questionId]: value,
      },
    }));
  };

  // Check if all radio buttons are answered
  const isAllQuestionsAnswered = useMemo(() => {
    if (qualityData.length === 0) return false;

    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach((row) => {
        totalQuestions++;
        const response = qualityResponses[category.id]?.[row.id];
        if (response === "Y" || response === "N") {
          answeredQuestions++;
        }
      });
    });

    return totalQuestions > 0 && answeredQuestions === totalQuestions;
  }, [qualityData, qualityResponses]);

  // Check if description is filled
  const isDescriptionFilled = useMemo(() => {
    return description && description.trim().length > 0;
  }, [description]);

  // Check if files are valid (optional)
  const isFilesValid = useMemo(() => {
    // Files are optional - set to true to make them optional
    // To make files required, change to: return files.length > 0;
    return true;
  }, [files]);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return isAllQuestionsAnswered && isDescriptionFilled && isFilesValid;
  }, [isAllQuestionsAnswered, isDescriptionFilled, isFilesValid]);

  // Check if status is approved (57)
  const isApproved = useMemo(() => {
    return (
      selectedProgram?.status_id === "57" || selectedProgram?.status_id === 57
    );
  }, [selectedProgram]);

  // Get progress text
  const getProgressText = useCallback(() => {
    if (qualityData.length === 0) return "";

    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach(() => {
        totalQuestions++;
      });
    });

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId] || {}).forEach((questionId) => {
        const response = qualityResponses[categoryId][questionId];
        if (response === "Y" || response === "N") {
          answeredQuestions++;
        }
      });
    });

    return `${answeredQuestions}/${totalQuestions} questions answered`;
  }, [qualityData, qualityResponses]);

  // Prepare quality standards for update
  const prepareQualityStandardsForUpdate = useCallback(() => {
    const qualityStandardsData = [];

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((questionId) => {
        const responseValue = qualityResponses[categoryId][questionId];
        const remark = qualityRemarks[categoryId]?.[questionId] || "";

        if (responseValue && responseValue !== "") {
          let existingId = null;
          if (selectedProgram?.checklists) {
            try {
              const existingItems = JSON.parse(selectedProgram.checklists);
              const existingItem = existingItems.find(
                (item) => item.standardId === parseInt(questionId, 10),
              );
              if (existingItem) {
                existingId = existingItem.id;
              }
            } catch (error) {
              console.error("Error parsing existing checklists:", error);
            }
          }

          qualityStandardsData.push({
            id: existingId,
            standardId: parseInt(questionId, 10),
            responseId: responseValue,
            remarks: remark,
          });
        }
      });
    });
    return qualityStandardsData;
  }, [qualityResponses, qualityRemarks, selectedProgram]);

  // Handle resubmit checklist
  const handleResubmit = async () => {
    // Check if already approved
    if (isApproved) {
      toast.error(
        "This application is already approved and cannot be resubmitted",
      );
      return;
    }

    // Validate description
    if (!description || description.trim() === "") {
      setDescriptionError("Description / Remarks is required");
      toast.error("Please enter Description / Remarks");
      return;
    }

    setSubmitting(true);

    try {
      const qualityStandardsData = prepareQualityStandardsForUpdate();

      if (qualityStandardsData.length === 0) {
        toast.error("Please answer all questions before resubmitting");
        setSubmitting(false);
        return;
      }

      // Convert files to base64 if there are any
      let documents = [];
      if (files.length > 0) {
        documents = await Promise.all(files.map((file) => fileToBase64(file)));
      }

      const payload = {
        id: selectedProgram?.id,
        instituteId: selectedProgram?.institute_id,
        instituteName: selectedProgram?.institute_name,
        registrationNo: selectedProgram?.registration_no,
        monitoringDate: selectedProgram?.monitoring_date,
        dzongkhagId: parseInt(selectedProgram?.dzongkhag_id, 10),
        exactLocation: selectedProgram?.exact_location,
        serviceId: 51, // serviceId for program monitoring
        applicationNo: selectedProgram?.application_no,
        qualityStandards: qualityStandardsData,
        statusId: selectedProgram?.status_id,
        description: description.trim(),
        actionId: actionId,
        assignedRoleId: currentRoleId,
        courseTypeId: selectedProgram?.course_type_id,
        courseId: selectedProgram?.course_id,
        documents: documents, // Add documents to payload
      };

      console.log("Resubmit Payload:", payload);

      // Call API to update program monitoring assessment
      const response = await ProgramMonitoringService.updateProgramMonitoring(
        payload,
        access_token,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Program Monitoring Resubmitted Successfully!");
        // Refresh the data
        await fetchProgramMonitoringAssessments();
        setChecklistDialogOpen(false);
      }
    } catch (error) {
      console.error("Error resubmitting checklist:", error);
      toast.error("Failed to resubmit checklist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render checklist
  const renderChecklist = useCallback(
    (standard) => {
      const categoryResponses = qualityResponses[standard.id] || {};
      const categoryRemarks = qualityRemarks[standard.id] || {};

      return (
        <Grid item size={{ xs: 12, md: 12 }} key={standard.id}>
          <Paper sx={{ p: 1.5, border: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }} mb={0.5}>
              {standard.title}
            </Typography>
            <TableContainer>
              <Table size="small" sx={TABLE_STYLE}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      width="30"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      Sl. No
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                      Quality Indicator
                    </TableCell>
                    <TableCell
                      align="center"
                      width="60"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      YES
                    </TableCell>
                    <TableCell
                      align="center"
                      width="60"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      NO
                    </TableCell>
                    <TableCell
                      width="200"
                      sx={{ fontSize: "0.70rem", p: "4px 4px" }}
                    >
                      Remarks
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {standard.rows.map((row, index) => {
                    const selectedValue = categoryResponses[row.id];
                    const isYes = selectedValue === "Y";
                    const isNo = selectedValue === "N";
                    const remark = categoryRemarks[row.id] || "";

                    return (
                      <TableRow key={row.id}>
                        <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                          {row.value}
                        </TableCell>
                        <TableCell align="center" sx={{ p: "2px 4px" }}>
                          <Radio
                            size="small"
                            sx={{
                              p: 0,
                              "& .MuiSvgIcon-root": {
                                fontSize: "1rem",
                              },
                            }}
                            checked={isYes}
                            onChange={() => {
                              const newValue = isYes ? undefined : "Y";
                              handleQualityResponseChange(
                                standard.id,
                                row.id,
                                newValue,
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ p: "2px 4px" }}>
                          <Radio
                            size="small"
                            sx={{
                              p: 0,
                              "& .MuiSvgIcon-root": {
                                fontSize: "1rem",
                              },
                            }}
                            checked={isNo}
                            onChange={() => {
                              const newValue = isNo ? undefined : "N";
                              handleQualityResponseChange(
                                standard.id,
                                row.id,
                                newValue,
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: "4px 4px" }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Remarks"
                            value={remark}
                            onChange={(e) =>
                              handleQualityRemarkChange(
                                standard.id,
                                row.id,
                                e.target.value,
                              )
                            }
                            slotProps={{
                              input: {
                                sx: {
                                  fontSize: "0.70rem",
                                  py: 0.5,
                                  "& textarea": {
                                    py: 0.5,
                                  },
                                },
                              },
                            }}
                            multiline
                            rows={1}
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
    },
    [qualityResponses, qualityRemarks],
  );

  // Paginated programs
  const paginatedPrograms = programMonitoringDetails.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" mb={3}>
          Program Monitoring Checklist
        </Typography>

        {/* Programs Table */}
        <TableContainer>
          <Table
            size="small"
            sx={{
              border: "1px solid #ccc",
              "& th, & td": {
                border: "1px solid #ccc",
                padding: "8px",
              },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  "& .MuiTableCell-root": {
                    fontWeight: "bold",
                  },
                }}
              >
                <TableCell>#</TableCell>
                <TableCell>Application No</TableCell>
                <TableCell>Registration No</TableCell>
                <TableCell>Institute Name</TableCell>
                <TableCell>Course Type</TableCell>
                <TableCell>Course Name</TableCell>
                <TableCell>Dzongkhag</TableCell>
                <TableCell>Monitoring Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">View Checklist</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((program, index) => (
                  <TableRow key={program.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {program.application_no}
                      </Typography>
                    </TableCell>
                    <TableCell>{program.registration_no}</TableCell>
                    <TableCell>{program.institute_name}</TableCell>
                    <TableCell>
                      {getCourseTypeName(program.course_type_id)}
                    </TableCell>
                    <TableCell>{getCourseName(program.course_id)}</TableCell>
                    <TableCell>
                      {getDzongkhagName(program.dzongkhag_id)}
                    </TableCell>
                    <TableCell>{program.monitoring_date}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor:
                            program.status_id === "57" ||
                            program.status_id === 57
                              ? "#e8f5e9"
                              : program.status_id === "55" ||
                                  program.status_id === 55
                                ? "#e3f2fd"
                                : "#f5f5f5",
                          color:
                            program.status_id === "57" ||
                            program.status_id === 57
                              ? "#2e7d32"
                              : program.status_id === "55" ||
                                  program.status_id === 55
                                ? "#1565c0"
                                : "#616161",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      >
                        {getStatusName(program.status_id)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewChecklist(program)}
                        sx={{
                          textTransform: "none",
                          backgroundColor: "#1976d2",
                          "&:hover": {
                            backgroundColor: "#1565c0",
                          },
                        }}
                      >
                        View Checklist
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    No program monitoring records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {paginatedPrograms.length} of{" "}
            {programMonitoringDetails.length} programs
          </Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={programMonitoringDetails.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      </Paper>

      {/* Checklist Dialog */}
      <Dialog
        open={checklistDialogOpen}
        onClose={() => !submitting && setChecklistDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Quality Standards Checklist - {selectedProgram?.institute_name}
            </Typography>
            <IconButton
              onClick={() => !submitting && setChecklistDialogOpen(false)}
              disabled={submitting}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Application No: {selectedProgram?.application_no} | Registration
              No: {selectedProgram?.registration_no} | Course:{" "}
              {getCourseName(selectedProgram?.course_id)} (
              {getCourseTypeName(selectedProgram?.course_type_id)}) | Dzongkhag:{" "}
              {getDzongkhagName(selectedProgram?.dzongkhag_id)} | Monitoring
              Date: {selectedProgram?.monitoring_date} | Status:{" "}
              <Box
                component="span"
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: isApproved ? "#e8f5e9" : "#e3f2fd",
                  color: isApproved ? "#2e7d32" : "#1565c0",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              >
                {getStatusName(selectedProgram?.status_id)}
              </Box>
            </Typography>
          </Box>

          {qualityStandardsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>
                Loading quality standards...
              </Typography>
            </Box>
          ) : qualityStandardsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {qualityStandardsError}
            </Alert>
          ) : qualityData.length > 0 ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {getProgressText()}
                </Typography>
                {!isAllQuestionsAnswered && !isApproved && (
                  <Typography variant="caption" color="error">
                    * Please answer all questions
                  </Typography>
                )}
                {isAllQuestionsAnswered && !isApproved && (
                  <Typography variant="caption" color="success.main">
                    ✓ All questions answered
                  </Typography>
                )}
                {isApproved && (
                  <Typography variant="caption" color="success.main">
                    ✓ Application Approved
                  </Typography>
                )}
              </Box>
              <Grid container spacing={2}>
                {qualityData.map(renderChecklist)}
              </Grid>

              {/* Description Field */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Description / Remarks <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter description or additional remarks about the program monitoring assessment..."
                  value={description}
                  onChange={handleDescriptionChange}
                  variant="outlined"
                  size="medium"
                  error={!!descriptionError}
                  helperText={descriptionError}
                  disabled={isApproved}
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </Box>

              {/* File Upload Section */}
              <Box sx={{ mt: 3 }}>
                <Paper
                  sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Supporting Documents
                  </Typography>
                  <FileUpload
                    files={files}
                    onFilesChange={handleFilesChange}
                    maxFiles={5}
                    acceptedFileTypes={[
                      ".pdf",
                      ".doc",
                      ".docx",
                      ".jpg",
                      ".jpeg",
                      ".png",
                    ]}
                    disabled={isApproved}
                  />
                  {filesError && (
                    <Typography color="error" variant="caption">
                      {filesError}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5
                    files)
                  </Typography>
                </Paper>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">
                No quality standards available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setChecklistDialogOpen(false)}
            color="secondary"
            variant="outlined"
            size="small"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Tooltip title={isApproved ? "Application already approved" : ""}>
            <span>
              <Button
                onClick={handleResubmit}
                variant="contained"
                color="primary"
                size="small"
                startIcon={
                  submitting ? <CircularProgress size={20} /> : <ReplayIcon />
                }
                disabled={submitting || !isFormValid || isApproved}
                sx={{
                  backgroundColor: isApproved ? "#9e9e9e" : "#ff9800",
                  "&:hover": {
                    backgroundColor: isApproved ? "#9e9e9e" : "#f57c00",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: isApproved ? "#bdbdbd" : "#ffb74d",
                    opacity: isApproved ? 0.8 : 0.7,
                  },
                }}
              >
                {submitting ? "Resubmitting..." : "Resubmit"}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstituteProgramMonitoringIndex;
