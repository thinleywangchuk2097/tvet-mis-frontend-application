import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Divider,
  Radio,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CommonService from "../../../api/services/internal/common/CommonService";
import MonitoringAssessmentService from "../../../api/services/internal/monitoring/MonitoringAssessmentService";

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

const MonitoringAssessmentIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  // Parent dropdown state - using id from API
  const [parentEntityId, setParentEntityId] = useState("");

  // Child dropdown states
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedSESCentre, setSelectedSESCentre] = useState("");
  const [selectedAssessmentCentre, setSelectedAssessmentCentre] = useState("");

  // Lists from API
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [instituteTypeLists, setInstituteTypeLists] = useState([]);
  const [instituteLists, setInstituteLists] = useState([]);
  const [sesCentreLists, setSesCentreLists] = useState([]);
  const [assessmentCentreLists, setAssessmentCentreLists] = useState([]);
  const [qualityData, setQualityData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dzongkhagId: "",
    exactLocation: "",
    monitoringDate: new Date().toISOString().split("T")[0],
  });

  // Quality checklist state
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Check if all radio buttons are checked
  const isAllRadiosChecked = useMemo(() => {
    if (qualityData.length === 0) return false;

    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach((row) => {
        totalQuestions++;
        if (qualityResponses[category.id]?.[row.id]) {
          answeredQuestions++;
        }
      });
    });

    return totalQuestions > 0 && answeredQuestions === totalQuestions;
  }, [qualityData, qualityResponses]);

  // Generate validation schema dynamically based on quality data
  const getValidationSchema = useCallback(() => {
    const validationFields = {};

    if (qualityData.length > 0) {
      qualityData.forEach((category) => {
        category.rows.forEach((row) => {
          validationFields[`response_${category.id}_${row.id}`] = Yup.string()
            .required("Please select Yes or No")
            .oneOf(["Y", "N"], "Please select Yes or No");
        });
      });
    }

    return Yup.object(validationFields);
  }, [qualityData]);

  // Formik initialization
  const formik = useFormik({
    initialValues: {},
    validationSchema: getValidationSchema(),
    onSubmit: async (values) => {
      await handleSubmit();
    },
  });

  // Update formik values when qualityResponses change
  useEffect(() => {
    const newValues = {};
    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId] || {}).forEach(
        (subQuestionId) => {
          const fieldName = `response_${categoryId}_${subQuestionId}`;
          newValues[fieldName] = qualityResponses[categoryId][subQuestionId];
        },
      );
    });

    formik.setValues(newValues);
  }, [qualityResponses]);

  // Reset formik when quality data changes
  useEffect(() => {
    formik.resetForm();
  }, [qualityData]);

  // Fetch all dropdown data on component mount
  useEffect(() => {
    fetchInstituteTypeLists();
    fetchDzongkhagLists();
  }, []);

  // Fetch monitoring checklist when parentEntityId changes
  useEffect(() => {
    if (parentEntityId) {
      setQualityData([]);
      setQualityResponses({});
      setQualityRemarks({});
    } else {
      setQualityData([]);
      setQualityResponses({});
      setQualityRemarks({});
    }
  }, [parentEntityId]);

  // Fetch lists when parent entity id changes
  useEffect(() => {
    if (parentEntityId === "7") {
      fetchInstituteLists(parentEntityId);
    } else if (parentEntityId === "36") {
      fetchSesCentreLists(parentEntityId);
    } else if (parentEntityId === "4") {
      fetchAssessmentCentreLists(parentEntityId);
    }
  }, [parentEntityId]);

  const fetchInstituteTypeLists = async () => {
    try {
      const response =
        await MonitoringAssessmentService.getInstituteTypeDropdown(
          access_token,
        );
      setInstituteTypeLists(response.data);
      console.log("Institute Type Dropdown:", response.data);
    } catch (error) {
      console.error("Error fetching institute type dropdown:", error);
      toast.error("Failed to load institute types");
    }
  };

  const fetchInstituteLists = async (typeId) => {
    try {
      const response = await MonitoringAssessmentService.getInstituteDropdown(
        typeId,
        access_token,
      );
      setInstituteLists(response.data);
      console.log("Institute Dropdown:", response.data);
    } catch (error) {
      console.error("Error fetching institute dropdown:", error);
      toast.error("Failed to load institutes");
    }
  };

  const fetchSesCentreLists = async (typeId) => {
    try {
      const response = await MonitoringAssessmentService.getInstituteDropdown(
        typeId,
        access_token,
      );
      setSesCentreLists(response.data);
      console.log("SES Centre Dropdown:", response.data);
    } catch (error) {
      console.error("Error fetching SES centre dropdown:", error);
      toast.error("Failed to load SES centres");
    }
  };

  const fetchAssessmentCentreLists = async (typeId) => {
    try {
      const response = await MonitoringAssessmentService.getInstituteDropdown(
        typeId,
        access_token,
      );
      setAssessmentCentreLists(response.data);
      console.log("Assessment Centre Dropdown:", response.data);
    } catch (error) {
      console.error("Error fetching assessment centre dropdown:", error);
      toast.error("Failed to load assessment centres");
    }
  };

  const fetchDzongkhagLists = async () => {
    try {
      const response = await CommonService.getAllDzongkhags();
      setDzongkhagList(response.data);
      console.log("Dzongkhag Dropdown:", response.data);
    } catch (error) {
      console.error("Error fetching dzongkhag dropdown:", error);
      toast.error("Failed to load dzongkhags");
    }
  };

  const fetchMonitoringChecklist = async (serviceId) => {
    try {
      console.log("Fetching checklist for serviceId:", serviceId);
      const response = await CommonService.getAllQualitystandards(serviceId);
      const checklistData = response.data;
      console.log("Monitoring Checklist:", checklistData);

      if (checklistData && checklistData.length > 0) {
        const mainCategories = checklistData.filter(
          (item) => item.parentId === 0 || !item.parentId,
        );
        const subCategories = checklistData.filter(
          (item) => item.parentId !== 0 && item.parentId,
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
        console.log("Structured quality data:", structured);
        setQualityData(structured);
      } else {
        setQualityData([]);
      }

      setQualityResponses({});
      setQualityRemarks({});
    } catch (error) {
      console.error("Error fetching monitoring checklist:", error);
      toast.error("Failed to load monitoring checklist");
      setQualityData([]);
    }
  };

  const handleParentEntityChange = (e) => {
    const value = e.target.value;
    setParentEntityId(value);

    setSelectedInstitute("");
    setSelectedSESCentre("");
    setSelectedAssessmentCentre("");
    setShowForm(false);
    setFormData({
      dzongkhagId: "",
      exactLocation: "",
      monitoringDate: new Date().toISOString().split("T")[0],
    });

    setQualityData([]);
    setQualityResponses({});
    setQualityRemarks({});
  };

  const handleInstituteChange = (e) => {
    const value = e.target.value;
    setSelectedInstitute(value);
    if (value) {
      const selectedInst = instituteLists.find(
        (inst) => inst.institute_id === value,
      );
      if (selectedInst) {
        setFormData((prev) => ({
          ...prev,
          dzongkhagId: selectedInst.dzongkhag_id || "",
          exactLocation: selectedInst.exact_location || "",
        }));
      }
      setShowForm(true);
      fetchMonitoringChecklist(parentEntityId);
    } else {
      setShowForm(false);
      setQualityData([]);
      setQualityResponses({});
      setQualityRemarks({});
    }
  };

  const handleSESCentreChange = (e) => {
    const value = e.target.value;
    setSelectedSESCentre(value);
    if (value) {
      const selectedSES = sesCentreLists.find(
        (ses) => ses.institute_id === value,
      );
      if (selectedSES) {
        setFormData((prev) => ({
          ...prev,
          dzongkhagId: selectedSES.dzongkhag_id || "",
          exactLocation: selectedSES.exact_location || "",
        }));
      }
      setShowForm(true);
      fetchMonitoringChecklist(parentEntityId);
    } else {
      setShowForm(false);
      setQualityData([]);
      setQualityResponses({});
      setQualityRemarks({});
    }
  };

  const handleAssessmentCentreChange = (e) => {
    const value = e.target.value;
    setSelectedAssessmentCentre(value);
    if (value) {
      const selectedAssessment = assessmentCentreLists.find(
        (assessment) => assessment.institute_id === value,
      );
      if (selectedAssessment) {
        setFormData((prev) => ({
          ...prev,
          dzongkhagId: selectedAssessment.dzongkhag_id || "",
          exactLocation: selectedAssessment.exact_location || "",
        }));
      }
      setShowForm(true);
      fetchMonitoringChecklist(parentEntityId);
    } else {
      setShowForm(false);
      setQualityData([]);
      setQualityResponses({});
      setQualityRemarks({});
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQualityResponseChange = (categoryId, subQuestionId, value) => {
    setQualityResponses((prev) => {
      const newResponses = { ...prev };

      if (!newResponses[categoryId]) {
        newResponses[categoryId] = {};
      }

      if (newResponses[categoryId][subQuestionId] === value) {
        delete newResponses[categoryId][subQuestionId];
        if (Object.keys(newResponses[categoryId]).length === 0) {
          delete newResponses[categoryId];
        }
      } else {
        newResponses[categoryId][subQuestionId] = value;
      }

      return newResponses;
    });

    const fieldName = `response_${categoryId}_${subQuestionId}`;
    if (formik.errors[fieldName]) {
      formik.setFieldError(fieldName, undefined);
    }
  };

  const handleQualityRemarkChange = (categoryId, subQuestionId, value) => {
    setQualityRemarks((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [subQuestionId]: value,
      },
    }));
  };

  // Prepare quality standards for backend - using "Y" and "N" directly
  const prepareQualityStandardsForBackend = () => {
    const qualityStandardsData = [];

    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((subQuestionId) => {
        const responseValue = qualityResponses[categoryId][subQuestionId];
        const remark = qualityRemarks[categoryId]?.[subQuestionId] || "";

        if (responseValue && responseValue !== "") {
          qualityStandardsData.push({
            standardId: parseInt(subQuestionId),
            responseId: responseValue, // This will be "Y" or "N"
            remarks: remark,
          });
        }
      });
    });

    return qualityStandardsData;
  };

  const getSelectedEntityDetails = () => {
    if (parentEntityId === "7" && selectedInstitute) {
      return instituteLists.find(
        (inst) => inst.institute_id === selectedInstitute,
      );
    } else if (parentEntityId === "36" && selectedSESCentre) {
      return sesCentreLists.find(
        (ses) => ses.institute_id === selectedSESCentre,
      );
    } else if (parentEntityId === "4" && selectedAssessmentCentre) {
      return assessmentCentreLists.find(
        (assessment) => assessment.institute_id === selectedAssessmentCentre,
      );
    }
    return null;
  };

  const validateSubmission = () => {
    const errors = [];

    if (!parentEntityId) {
      errors.push("Please select entity type");
    }

    if (!selectedInstitute && !selectedSESCentre && !selectedAssessmentCentre) {
      errors.push("Please select an entity");
    }

    if (!formData.monitoringDate) {
      errors.push("Please select monitoring date");
    }

    if (!formData.dzongkhagId) {
      errors.push("Please select dzongkhag");
    }

    const totalQuestions = qualityData.reduce(
      (total, category) => total + category.rows.length,
      0,
    );

    const answeredQuestions = Object.keys(qualityResponses).reduce(
      (total, categoryId) =>
        total + Object.keys(qualityResponses[categoryId] || {}).length,
      0,
    );

    if (totalQuestions > 0 && answeredQuestions !== totalQuestions) {
      errors.push(
        `Please answer all quality standards questions (${answeredQuestions}/${totalQuestions} answered)`,
      );
    }

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateSubmission();

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setSubmitting(true);
    try {
      const qualityStandardsData = prepareQualityStandardsForBackend();
      const selectedEntity = getSelectedEntityDetails();

      const payload = {
        instituteId: selectedEntity?.institute_id,
        instituteName: selectedEntity?.proposed_institute_name,
        registrationNo: selectedEntity?.registration_no,
        monitoringDate: formData.monitoringDate,
        dzongkhagId: parseInt(formData.dzongkhagId),
        exactLocation: formData.exactLocation,
        qualityStandards: qualityStandardsData,
        createdBy: actionId,
        serviceId: parentEntityId,//this serviceId is use to get checklist
        // serviceId: 47,
        statusId: 55,
      };
      // TODO: Call your API to save monitoring assessment
      const response =
        await MonitoringAssessmentService.submitMonitoringAssessment(
          payload,
          access_token,
        );
      if (response.status === 200 || response.status === 201) {
        toast.success(
          `Monitoring assessment submitted successfully for ${selectedEntity?.proposed_institute_name}`,
        );
      }

      setParentEntityId("");
      setSelectedInstitute("");
      setSelectedSESCentre("");
      setSelectedAssessmentCentre("");
      setShowForm(false);
      setFormData({
        dzongkhagId: "",
        exactLocation: "",
        monitoringDate: new Date().toISOString().split("T")[0],
      });
      setQualityResponses({});
      setQualityRemarks({});
      setQualityData([]);
      formik.resetForm();
    } catch (error) {
      console.error("Error submitting monitoring assessment:", error);
      toast.error("Failed to submit monitoring assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const hasFieldError = (categoryId, rowId) => {
    const fieldName = `response_${categoryId}_${rowId}`;
    return formik.touched[fieldName] && formik.errors[fieldName];
  };

  const renderChecklist = useCallback(
    (standard) => {
      return (
        <Grid item xs={12} key={standard.id}>
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
                    const selectedValue =
                      qualityResponses[standard.id]?.[row.id];
                    const isYes = selectedValue === "Y";
                    const isNo = selectedValue === "N";
                    const remark = qualityRemarks[standard.id]?.[row.id] || "";
                    const hasError = hasFieldError(standard.id, row.id);
                    const fieldName = `response_${standard.id}_${row.id}`;

                    return (
                      <TableRow key={row.id}>
                        <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.70rem", p: "4px 4px" }}>
                          {row.value}
                          {hasError && (
                            <FormHelperText
                              error
                              sx={{ mt: 0.25, fontSize: "0.65rem" }}
                            >
                              {formik.errors[fieldName]}
                            </FormHelperText>
                          )}
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
                              formik.setFieldTouched(fieldName, true);
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
                              formik.setFieldTouched(fieldName, true);
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
    [qualityResponses, qualityRemarks, formik.touched, formik.errors],
  );

  const showChecklist = () => {
    if (!parentEntityId) return false;
    if (parentEntityId === "7" && selectedInstitute) return true;
    if (parentEntityId === "36" && selectedSESCentre) return true;
    if (parentEntityId === "4" && selectedAssessmentCentre) return true;
    return false;
  };

  const getProgressText = () => {
    if (qualityData.length === 0) return "";

    let totalQuestions = 0;
    let answeredQuestions = 0;

    qualityData.forEach((category) => {
      category.rows.forEach(() => {
        totalQuestions++;
      });
    });

    Object.keys(qualityResponses).forEach((categoryId) => {
      answeredQuestions += Object.keys(
        qualityResponses[categoryId] || {},
      ).length;
    });

    return `${answeredQuestions}/${totalQuestions} questions answered`;
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Paper sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" mb={3}>
          Monitoring Assessment
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Registration Type</InputLabel>
              <Select
                value={parentEntityId}
                onChange={handleParentEntityChange}
                label="Select Registration Type"
              >
                <MenuItem value="">-- Please Select --</MenuItem>
                {instituteTypeLists.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.service_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {parentEntityId === "7" && (
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Institute</InputLabel>
                <Select
                  value={selectedInstitute}
                  onChange={handleInstituteChange}
                  label="Select Institute"
                >
                  <MenuItem value="">-- Select Institute --</MenuItem>
                  {instituteLists.map((institute) => (
                    <MenuItem
                      key={institute.institute_id}
                      value={institute.institute_id}
                    >
                      {institute.proposed_institute_name} (
                      {institute.registration_no})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {parentEntityId === "36" && (
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select SES Centre</InputLabel>
                <Select
                  value={selectedSESCentre}
                  onChange={handleSESCentreChange}
                  label="Select SES Centre"
                >
                  <MenuItem value="">-- Select SES Centre --</MenuItem>
                  {sesCentreLists.map((centre) => (
                    <MenuItem
                      key={centre.institute_id}
                      value={centre.institute_id}
                    >
                      {centre.proposed_institute_name} ({centre.registration_no}
                      )
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {parentEntityId === "4" && (
            <Grid item size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Assessment Centre</InputLabel>
                <Select
                  value={selectedAssessmentCentre}
                  onChange={handleAssessmentCentreChange}
                  label="Select Assessment Centre"
                >
                  <MenuItem value="">-- Select Assessment Centre --</MenuItem>
                  {assessmentCentreLists.map((centre) => (
                    <MenuItem
                      key={centre.institute_id}
                      value={centre.institute_id}
                    >
                      {centre.proposed_institute_name} ({centre.registration_no}
                      )
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {showForm && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Location & Monitoring Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Monitoring Date"
                  type="date"
                  name="monitoringDate"
                  value={formData.monitoringDate}
                  onChange={handleInputChange}
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dzongkhag</InputLabel>
                  <Select
                    name="dzongkhagId"
                    value={formData.dzongkhagId}
                    onChange={handleInputChange}
                    label="Dzongkhag"
                  >
                    <MenuItem value="">-- Select Dzongkhag --</MenuItem>
                    {dzongkhagList.map((dzongkhag) => (
                      <MenuItem key={dzongkhag.id} value={dzongkhag.id}>
                        {dzongkhag.dzonkhagName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Exact Location"
                  name="exactLocation"
                  value={formData.exactLocation}
                  onChange={handleInputChange}
                  placeholder="Enter exact location"
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {showChecklist() && qualityData.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1">
                Quality Standards Checklist for{" "}
                {parentEntityId === "7" &&
                  selectedInstitute &&
                  instituteLists.find(
                    (i) => i.institute_id === selectedInstitute,
                  )?.proposed_institute_name}
                {parentEntityId === "36" &&
                  selectedSESCentre &&
                  sesCentreLists.find(
                    (s) => s.institute_id === selectedSESCentre,
                  )?.proposed_institute_name}
                {parentEntityId === "4" &&
                  selectedAssessmentCentre &&
                  assessmentCentreLists.find(
                    (a) => a.institute_id === selectedAssessmentCentre,
                  )?.proposed_institute_name}
              </Typography>
              <Typography
                variant="caption"
                color={isAllRadiosChecked ? "success.main" : "error.main"}
              >
                {getProgressText()} {isAllRadiosChecked && "✓"}
              </Typography>
            </Box>
            <Typography
              component="span"
              color="error"
              sx={{ mb: 2, display: "block", fontSize: "0.75rem" }}
            >
              (All questions must be answered)
            </Typography>
            <Box>{qualityData.map(renderChecklist)}</Box>
          </Box>
        )}

        {showChecklist() && qualityData.length === 0 && (
          <Paper sx={{ p: 3, mb: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No quality standards available for the selected entity type
            </Typography>
          </Paper>
        )}

        {showChecklist() && qualityData.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={
                submitting ? (
                  <CircularProgress size={20} />
                ) : (
                  <CheckCircleIcon />
                )
              }
              disabled={submitting || !isAllRadiosChecked}
              sx={{ px: 4, py: 1 }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        )}
      </Paper>
    </form>
  );
};

export default MonitoringAssessmentIndex;
