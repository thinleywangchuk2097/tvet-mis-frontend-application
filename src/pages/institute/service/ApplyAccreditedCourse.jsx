import { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUplaod";

const ApplyAccreditedCourse = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' or 'view'
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Sample data for the table
  const [courses, setCourses] = useState([
    {
      id: 1,
      applicationNo: "ACC001",
      courseTitle: "Advanced Electronics",
      sector: "Electronics",
      courseFee: 3500,
      status: "SUBMITTED",
      // Additional data for view mode
      registrationNo: "2024060155",
      instituteName: "Robotics & IoT Training Institute",
      modules: [
        {
          ncsCode: "NCS001",
          unitName: "Basic Electronics",
          unitLevel: "Level 3",
        },
        {
          ncsCode: "NCS002",
          unitName: "Digital Electronics",
          unitLevel: "Level 4",
        },
      ],
      curriculum: [
        {
          moduleNo: "M01",
          moduleName: "Introduction to Electronics",
          moduleCode: "ELEC101",
          theoryDuration: 40,
          practicalDuration: 20,
          ojtHrs: 10,
        },
        {
          moduleNo: "M02",
          moduleName: "Circuit Analysis",
          moduleCode: "ELEC102",
          theoryDuration: 30,
          practicalDuration: 30,
          ojtHrs: 10,
        },
      ],
      trainingFacilities: {
        noOfClass: 5,
        noOfWorkshops: 3,
        noOfTrainingLab: 4,
      },
      otherFacilities: {
        trainingTools: "Yes",
        firstAid: "Yes",
        toilet: "Yes",
        lighting: "Yes",
        fireSafety: "Yes",
      },
      trainerTraineeRatio: {
        theory: 20,
        practical: 15,
      },
      maxTrainees: 25,
      presentTrainees: 18,
      trainers: [
        {
          name: "Dr. Ahmad Bin Abdullah",
          qualification: "PhD in Electronics",
          industrialExp: 10,
          teachingExp: 8,
          subjectsTaught: "Advanced Electronics",
          teachingHours: 120,
        },
        {
          name: "Ms. Sarah Lim",
          qualification: "Master in Robotics",
          industrialExp: 7,
          teachingExp: 5,
          subjectsTaught: "Robotics Programming",
          teachingHours: 80,
        },
      ],
      supportingDocs: {
        trainingPlan: "training_plan.pdf",
        monthlyPlan: "monthly_plan.pdf",
        lessonPlan: "lesson_plan.pdf",
        cvCertificates: "staff_cv_certificates.pdf",
      },
    },
    {
      id: 2,
      applicationNo: "ACC002",
      courseTitle: "Robotics Engineering",
      sector: "Engineering",
      courseFee: 4200,
      status: "SUBMITTED",
      registrationNo: "2024060155",
      instituteName: "Robotics & IoT Training Institute",
      modules: [
        {
          ncsCode: "ROB001",
          unitName: "Robotics Fundamentals",
          unitLevel: "Level 3",
        },
      ],
      curriculum: [
        {
          moduleNo: "R01",
          moduleName: "Introduction to Robotics",
          moduleCode: "ROB101",
          theoryDuration: 45,
          practicalDuration: 35,
          ojtHrs: 15,
        },
      ],
      trainingFacilities: {
        noOfClass: 4,
        noOfWorkshops: 2,
        noOfTrainingLab: 3,
      },
      otherFacilities: {
        trainingTools: "Yes",
        firstAid: "Yes",
        toilet: "Yes",
        lighting: "Yes",
        fireSafety: "Yes",
      },
      trainerTraineeRatio: {
        theory: 18,
        practical: 12,
      },
      maxTrainees: 20,
      presentTrainees: 15,
      trainers: [
        {
          name: "Dr. Robert Wong",
          qualification: "PhD in Robotics",
          industrialExp: 12,
          teachingExp: 10,
          subjectsTaught: "Robotics Engineering",
          teachingHours: 100,
        },
      ],
      supportingDocs: {
        trainingPlan: "robotics_training_plan.pdf",
        monthlyPlan: "robotics_monthly_plan.pdf",
        lessonPlan: "robotics_lesson_plan.pdf",
        cvCertificates: "robotics_staff_cv.pdf",
      },
    },
  ]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.applicationNo.toLowerCase().includes(search.toLowerCase()),
  );

  const handleView = (course) => {
    setSelectedCourse(course);
    setDialogMode("view");
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setDialogMode("add");
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

  // Initial form values for add mode
  const getInitialValues = () => {
    if (dialogMode === "view" && selectedCourse) {
      return selectedCourse;
    }

    return {
      registrationNo: "2024060155",
      instituteName: "Robotics & IoT Training Institute",
      sector: "",
      courseTitle: "",
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
        trainingTools: "Yes",
        firstAid: "Yes",
        toilet: "Yes",
        lighting: "Yes",
        fireSafety: "Yes",
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
      supportingDocs: {
        trainingPlan: null,
        monthlyPlan: null,
        lessonPlan: null,
        cvCertificates: null,
      },
    };
  };

  const validationSchema = Yup.object().shape({
    sector: Yup.string().required("Sector is required"),
    courseTitle: Yup.string().required("Course Title is required"),
    courseFee: Yup.number()
      .required("Course Fee is required")
      .positive("Must be positive"),
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
        theoryDuration: Yup.number().required("Theory Duration is required"),
        practicalDuration: Yup.number().required(
          "Practical Duration is required",
        ),
        ojtHrs: Yup.number().required("OJT Hours is required"),
      }),
    ),
    trainingFacilities: Yup.object().shape({
      noOfClass: Yup.number().required("Number of Classes is required"),
      noOfWorkshops: Yup.number().required("Number of Workshops is required"),
      noOfTrainingLab: Yup.number().required(
        "Number of Training Labs is required",
      ),
    }),
    trainerTraineeRatio: Yup.object().shape({
      theory: Yup.number().required("Theory ratio is required"),
      practical: Yup.number().required("Practical ratio is required"),
    }),
    maxTrainees: Yup.number().required("Max trainees is required"),
    presentTrainees: Yup.number().required("Present trainees is required"),
    trainers: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required("Name is required"),
        qualification: Yup.string().required("Qualification is required"),
        industrialExp: Yup.number().required(
          "Industrial Experience is required",
        ),
        teachingExp: Yup.number().required("Teaching Experience is required"),
        subjectsTaught: Yup.string().required("Subjects taught is required"),
        teachingHours: Yup.number().required("Teaching hours is required"),
      }),
    ),
    files: Yup.array().min(1, "Upload at least one document"),
  });

  const handleSubmit = (values, { resetForm }) => {
    if (dialogMode === "add") {
      const newCourse = {
        id: courses.length + 1,
        applicationNo: `ACC${String(courses.length + 1).padStart(3, "0")}`,
        courseTitle: values.courseTitle,
        sector: values.sector,
        courseFee: values.courseFee,
        status: "SUBMITTED",
        ...values,
      };
      setCourses([...courses, newCourse]);
    }
    resetForm();
    setOpenDialog(false);
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
              disabled
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Institute Name"
              name="instituteName"
              size="small"
              value={formik.values.instituteName}
              disabled
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Sector"
              name="sector"
              size="small"
              value={formik.values.sector}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.sector && Boolean(formik.errors.sector)}
              helperText={formik.touched.sector && formik.errors.sector}
              disabled={mode === "view"}
            >
              <MenuItem value="">-select-</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Engineering">Engineering</MenuItem>
              <MenuItem value="ICT">ICT</MenuItem>
              <MenuItem value="Robotics">Robotics</MenuItem>
            </TextField>
          </Grid>
          <Grid item size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Course Title"
              name="courseTitle"
              size="small"
              value={formik.values.courseTitle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.courseTitle && Boolean(formik.errors.courseTitle)
              }
              helperText={
                formik.touched.courseTitle && formik.errors.courseTitle
              }
              disabled={mode === "view"}
            >
              <MenuItem value="">-select-</MenuItem>
              <MenuItem value="Advanced Electronics">
                Advanced Electronics
              </MenuItem>
              <MenuItem value="Robotics Engineering">
                Robotics Engineering
              </MenuItem>
              <MenuItem value="IoT Development">IoT Development</MenuItem>
            </TextField>
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
              InputProps={{ readOnly: mode === "view" }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Section 2: Modules */}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          <MenuItem value="Level 1">Level 1</MenuItem>
                          <MenuItem value="Level 2">Level 2</MenuItem>
                          <MenuItem value="Level 3">Level 3</MenuItem>
                          <MenuItem value="Level 4">Level 4</MenuItem>
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
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
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
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
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
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
            >
              <FormLabel component="legend">
                1. Training Tools and Equipment
              </FormLabel>
              <RadioGroup
                row
                name="otherFacilities.trainingTools"
                value={formik.values.otherFacilities.trainingTools}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  value="Yes"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="No"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
            >
              <FormLabel component="legend">2. First Aid Facilities</FormLabel>
              <RadioGroup
                row
                name="otherFacilities.firstAid"
                value={formik.values.otherFacilities.firstAid}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  value="Yes"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="No"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
            >
              <FormLabel component="legend">3. Toilet Facilities</FormLabel>
              <RadioGroup
                row
                name="otherFacilities.toilet"
                value={formik.values.otherFacilities.toilet}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  value="Yes"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="No"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
            >
              <FormLabel component="legend">4. Lighting/Power Supply</FormLabel>
              <RadioGroup
                row
                name="otherFacilities.lighting"
                value={formik.values.otherFacilities.lighting}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  value="Yes"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="No"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <FormControl
              component="fieldset"
              size="small"
              disabled={mode === "view"}
            >
              <FormLabel component="legend">5. Fire Safety</FormLabel>
              <RadioGroup
                row
                name="otherFacilities.fireSafety"
                value={formik.values.otherFacilities.fireSafety}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  value="Yes"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="No"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Trainer-Trainee Ratio (Theory)"
              name="trainerTraineeRatio.theory"
              type="number"
              size="small"
              value={formik.values.trainerTraineeRatio.theory}
              onChange={formik.handleChange}
              placeholder="e.g., 20"
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Trainer-Trainee Ratio (Practical)"
              name="trainerTraineeRatio.practical"
              type="number"
              size="small"
              value={formik.values.trainerTraineeRatio.practical}
              onChange={formik.handleChange}
              placeholder="e.g., 15"
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
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
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
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
              disabled={mode === "view"}
              InputProps={{ readOnly: mode === "view" }}
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
                      sx={{ mb: 2, alignItems: "center" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.5 }}>
                        <TextField
                          fullWidth
                          label="Industrial Exp"
                          name={`trainers.${index}.industrialExp`}
                          type="number"
                          size="small"
                          value={trainer.industrialExp}
                          onChange={formik.handleChange}
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 1.5 }}>
                        <TextField
                          fullWidth
                          label="Teaching Exp"
                          name={`trainers.${index}.teachingExp`}
                          type="number"
                          size="small"
                          value={trainer.teachingExp}
                          onChange={formik.handleChange}
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
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
                          disabled={mode === "view"}
                          InputProps={{ readOnly: mode === "view" }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 0.6 }}>
                        {mode === "add" && (
                          <>
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
                                title="Delete Trainer"
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
      {/* Section 7: Supporting Documents */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          7. Supporting Documents
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12 }}>
            {/*   {mode === "view" ? (
              <>
                <TextField
                  fullWidth
                  label="1. Training plan for the entire course"
                  size="small"
                  value={
                    formik.values.supportingDocs?.trainingPlan || "Not uploaded"
                  }
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="2. Monthly/Weekly plan"
                  size="small"
                  value={
                    formik.values.supportingDocs?.monthlyPlan || "Not uploaded"
                  }
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="3. Lesson plan"
                  size="small"
                  value={
                    formik.values.supportingDocs?.lessonPlan || "Not uploaded"
                  }
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="4. CV and certificates of the academic staff"
                  size="small"
                  value={
                    formik.values.supportingDocs?.cvCertificates ||
                    "Not uploaded"
                  }
                  disabled
                />
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  type="file"
                  size="small"
                  label="1. Training plan for the entire course"
                  name="supportingDocs.trainingPlan"
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) =>
                    formik.setFieldValue(
                      "supportingDocs.trainingPlan",
                      event.currentTarget.files[0],
                    )
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="file"
                  size="small"
                  label="2. Monthly/Weekly plan"
                  name="supportingDocs.monthlyPlan"
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) =>
                    formik.setFieldValue(
                      "supportingDocs.monthlyPlan",
                      event.currentTarget.files[0],
                    )
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="file"
                  size="small"
                  label="3. Lesson plan"
                  name="supportingDocs.lessonPlan"
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) =>
                    formik.setFieldValue(
                      "supportingDocs.lessonPlan",
                      event.currentTarget.files[0],
                    )
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="file"
                  size="small"
                  label="4. CV and certificates of the academic staff"
                  name="supportingDocs.cvCertificates"
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) =>
                    formik.setFieldValue(
                      "supportingDocs.cvCertificates",
                      event.currentTarget.files[0],
                    )
                  }
                />
              </>
            )} */}
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
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Accreditated Course Application
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
            onClick={handleAdd}
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
              <TableCell>Application No</TableCell>
              <TableCell>Course Title</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Course Fee (RM)</TableCell>
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
                    <TableCell>{course.applicationNo}</TableCell>
                    <TableCell>{course.courseTitle}</TableCell>
                    <TableCell>{course.sector}</TableCell>
                    <TableCell>RM {course.courseFee}</TableCell>
                    <TableCell>{course.status}</TableCell>
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
                ))
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

      {/* Shared Dialog for Add/View */}
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
                >
                  {dialogMode === "add" ? "Cancel" : "Close"}
                </Button>
                {dialogMode === "add" && (
                  <Button
                    size="small"
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    Submit
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
