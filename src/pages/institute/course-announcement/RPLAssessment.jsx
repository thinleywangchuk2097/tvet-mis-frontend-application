import React, { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";

const RPLAssessment = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  //const [courses, setCourses] = useState([]);
  const [courses, setCourses] = useState([
    {
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060155",
      courseName: "Robotics",
      courseFee: 1200,
      level: "Beginner",
      totalTrainees: 25,
      applicationStart: "2026-03-01",
      applicationEnd: "2026-03-10",
      courseStart: "2026-03-15",
      courseEnd: "2026-04-15",
      fundingSource: "Government",
      trainingLocation: "Thimphu",
      courseDescription: "Introductory robotics course for beginners",
      requiredDocuments: "CV, Passport Copy",
    },
    {
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060156",
      courseName: "IoT",
      courseFee: 1500,
      level: "Intermediate",
      totalTrainees: 20,
      applicationStart: "2026-03-05",
      applicationEnd: "2026-03-15",
      courseStart: "2026-03-20",
      courseEnd: "2026-04-25",
      fundingSource: "Private",
      trainingLocation: "Paro",
      courseDescription:
        "Intermediate IoT course for learners with basic knowledge",
      requiredDocuments: "CV, Passport Copy",
    },
  ]);
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredCourses = courses.filter((course) =>
    course.courseName?.toLowerCase().includes(search.toLowerCase()),
  );

  const initialValues = {
    providerName: "Robotics & IoT Training Institute",
    registrationNo: "2024060155",
    courseName: "",
    courseFee: "",
    level: "",
    totalTrainees: "",
    applicationStart: "",
    applicationEnd: "",
    courseStart: "",
    courseEnd: "",
    fundingSource: "",
    courseDescription: "",
    trainingLocation: "",
    requiredDocuments: "",
  };

  const validationSchema = Yup.object().shape({
    courseName: Yup.string().required("Course is required"),
    courseFee: Yup.number()
      .typeError("Must be a number")
      .required("Course Fee is required"),
    level: Yup.string().required("Level is required"),
    totalTrainees: Yup.number()
      .typeError("Must be a number")
      .required("Total trainees required"),
    applicationStart: Yup.date().required("Application Start Date required"),
    applicationEnd: Yup.date().required("Application End Date required"),
    courseStart: Yup.date().required("Course Start Date required"),
    courseEnd: Yup.date().required("Course End Date required"),
    fundingSource: Yup.string().required("Funding Source required"),
    trainingLocation: Yup.string().required("Training Location required"),
    courseDescription: Yup.string().required("Course Description required"),
  });

  const handleSubmit = (values, { resetForm }) => {
    setCourses((prev) => [...prev, values]);
    resetForm();
    setOpenDialog(false);
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
      RPL Assessment
      </Typography>

      {/* Search + Add Course */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 4, sm: 4, md: 4 }}>
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
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
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
              <TableCell>Course</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Application Date</TableCell>
              <TableCell>Course Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>View</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{course.registrationNo}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.level}</TableCell>
                    <TableCell>{course.applicationStart}</TableCell>
                    <TableCell>{course.courseStart}</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          minHeight: 20,
                          padding: "2px 8px",
                        }}
                      >
                        <RemoveRedEyeIcon fontSize="small" />
                        view
                      </Button>
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        sx={{
                          minHeight: 20,
                          padding: "2px 8px",
                        }}
                      >
                        Action
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
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

      {/* Add Course Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create RPL Assessment</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Name of Training Provider/Institution"
                      name="providerName"
                      size="small"
                      value={formik.values.providerName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.providerName &&
                        Boolean(formik.errors.providerName)
                      }
                      helperText={
                        formik.touched.providerName &&
                        formik.errors.providerName
                      }
                      disabled
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Registration No"
                      name="registrationNo"
                      size="small"
                      value={formik.values.registrationNo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.registrationNo &&
                        Boolean(formik.errors.registrationNo)
                      }
                      helperText={
                        formik.touched.registrationNo &&
                        formik.errors.registrationNo
                      }
                      disabled
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Name of Course"
                      name="courseName"
                      size="small"
                      value={formik.values.courseName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseName &&
                        Boolean(formik.errors.courseName)
                      }
                      helperText={
                        formik.touched.courseName && formik.errors.courseName
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Robotics">Robotics</MenuItem>
                      <MenuItem value="IoT">IoT</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Course Fee"
                      name="courseFee"
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
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Level"
                      name="level"
                      size="small"
                      value={formik.values.level}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.level && Boolean(formik.errors.level)
                      }
                      helperText={formik.touched.level && formik.errors.level}
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Total No of Trainees"
                      name="totalTrainees"
                      size="small"
                      value={formik.values.totalTrainees}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.totalTrainees &&
                        Boolean(formik.errors.totalTrainees)
                      }
                      helperText={
                        formik.touched.totalTrainees &&
                        formik.errors.totalTrainees
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Application Start Date"
                      name="applicationStart"
                      size="small"
                      value={formik.values.applicationStart}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={
                        formik.touched.applicationStart &&
                        Boolean(formik.errors.applicationStart)
                      }
                      helperText={
                        formik.touched.applicationStart &&
                        formik.errors.applicationStart
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Application End Date"
                      name="applicationEnd"
                      size="small"
                      value={formik.values.applicationEnd}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={
                        formik.touched.applicationEnd &&
                        Boolean(formik.errors.applicationEnd)
                      }
                      helperText={
                        formik.touched.applicationEnd &&
                        formik.errors.applicationEnd
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Course Start Date"
                      name="courseStart"
                      size="small"
                      value={formik.values.courseStart}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={
                        formik.touched.courseStart &&
                        Boolean(formik.errors.courseStart)
                      }
                      helperText={
                        formik.touched.courseStart && formik.errors.courseStart
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Course End Date"
                      name="courseEnd"
                      size="small"
                      value={formik.values.courseEnd}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={
                        formik.touched.courseEnd &&
                        Boolean(formik.errors.courseEnd)
                      }
                      helperText={
                        formik.touched.courseEnd && formik.errors.courseEnd
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Funding Source"
                      name="fundingSource"
                      size="small"
                      value={formik.values.fundingSource}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.fundingSource &&
                        Boolean(formik.errors.fundingSource)
                      }
                      helperText={
                        formik.touched.fundingSource &&
                        formik.errors.fundingSource
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Government">Government</MenuItem>
                      <MenuItem value="Private">Private</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Training Location"
                      name="trainingLocation"
                      size="small"
                      value={formik.values.trainingLocation}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.trainingLocation &&
                        Boolean(formik.errors.trainingLocation)
                      }
                      helperText={
                        formik.touched.trainingLocation &&
                        formik.errors.trainingLocation
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Thimphu">Thimphu</MenuItem>
                      <MenuItem value="Paro">Paro</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Course Description"
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
                  <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Required Documents"
                      name="requiredDocuments"
                      size="small"
                      value={formik.values.requiredDocuments}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default RPLAssessment;
