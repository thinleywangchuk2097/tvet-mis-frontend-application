import { useState } from "react";
import {
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  courseName: Yup.string().required("Course Name is required"),
  courseStart: Yup.date().required("Course Start Date required"),
  courseEnd: Yup.date().required("Course End Date required"),
  fundingSource: Yup.string().required("Funding Source required"),
  courseDescription: Yup.string().required("Course Description required"),
  qualification: Yup.string().required("Qualification required"),
  trainingLocation: Yup.string().required("Training Location required"),
  courseFee: Yup.number()
    .typeError("Must be a number")
    .required("Course Fee is required"),
});

const CreateCourse = () => {
  const [courses, setCourses] = useState([
    {
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060155",
      courseName: "Robotics",
      courseFee: 1200,
      courseStart: "2026-03-15",
      courseEnd: "2026-04-15",
      fundingSource: "Government",
      courseDescription: "Introductory robotics course for beginners",
      qualification: "Bachelor",
      trainingLocation: "Thimphu",
    },
    {
      providerName: "Robotics & IoT Training Institute",
      registrationNo: "2024060156",
      courseName: "IoT",
      courseFee: 1500,
      courseStart: "2026-03-20",
      courseEnd: "2026-04-25",
      fundingSource: "Private",
      courseDescription:
        "Intermediate IoT course for learners with basic knowledge",
      qualification: "Master",
      trainingLocation: "Paro",
    },
  ]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const initialValues = {
    providerName: "Robotics & IoT Training Institute",
    registrationNo: "2024060155",
    courseName: "",
    courseFee: "",
    courseStart: "",
    courseEnd: "",
    fundingSource: "",
    courseDescription: "",
    qualification: "",
    trainingLocation: "",
  };

  const filteredCourses = courses.filter((c) =>
    c.courseName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header and Search + Add */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Course Lists</Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              size="small"
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditIndex(null);
                setOpen(true);
              }}
            >
              Create Course
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th,& td": { border: "1px solid #ccc" },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Course Date</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{course.registrationNo}</TableCell>
                  <TableCell>{course.courseName}</TableCell>
                  <TableCell>
                    {course.courseStart} - {course.courseEnd}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      sx={{
                        minWidth: "36px",
                        mr: 1,
                        borderRadius: "50%",
                        bgcolor: "#eee",
                        "&:hover": { bgcolor: "#ddd" },
                      }}
                      onClick={() => {
                        setEditIndex(index);
                        setOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      sx={{
                        minWidth: "36px",
                        borderRadius: "50%",
                        bgcolor: "#eee",
                        color: "red",
                        "&:hover": { bgcolor: "#fdd" },
                      }}
                      onClick={() => handleDelete(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Course Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editIndex !== null ? "Edit Course" : "Create Course"}
        </DialogTitle>
        <Formik
          initialValues={
            editIndex !== null ? courses[editIndex] : initialValues
          }
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            if (editIndex !== null) {
              const updated = [...courses];
              updated[editIndex] = values;
              setCourses(updated);
            } else {
              setCourses((prev) => [...prev, values]);
            }
            resetForm();
            setOpen(false);
          }}
        >
          {({ values, handleChange, handleBlur, errors, touched }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Name of Training Provider/Institution"
                      name="providerName"
                      size="small"
                      value={values.providerName}
                      disabled
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Registration No"
                      name="registrationNo"
                      size="small"
                      value={values.registrationNo}
                      disabled
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Course Name"
                      name="courseName"
                      size="small"
                      value={values.courseName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.courseName && Boolean(errors.courseName)}
                      helperText={touched.courseName && errors.courseName}
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Robotics">Robotics</MenuItem>
                      <MenuItem value="IoT">IoT</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Course Fee"
                      name="courseFee"
                      size="small"
                      value={values.courseFee}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.courseFee && Boolean(errors.courseFee)}
                      helperText={touched.courseFee && errors.courseFee}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Course Start Date"
                      name="courseStart"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={values.courseStart}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.courseStart && Boolean(errors.courseStart)}
                      helperText={touched.courseStart && errors.courseStart}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Course End Date"
                      name="courseEnd"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={values.courseEnd}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.courseEnd && Boolean(errors.courseEnd)}
                      helperText={touched.courseEnd && errors.courseEnd}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Funding Source"
                      name="fundingSource"
                      size="small"
                      value={values.fundingSource}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.fundingSource && Boolean(errors.fundingSource)
                      }
                      helperText={touched.fundingSource && errors.fundingSource}
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Government">Government</MenuItem>
                      <MenuItem value="Private">Private</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Course Description"
                      name="courseDescription"
                      size="small"
                      value={values.courseDescription}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.courseDescription &&
                        Boolean(errors.courseDescription)
                      }
                      helperText={
                        touched.courseDescription && errors.courseDescription
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Qualification"
                      name="qualification"
                      size="small"
                      value={values.qualification}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.qualification && Boolean(errors.qualification)
                      }
                      helperText={touched.qualification && errors.qualification}
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Bachelor">Bachelor</MenuItem>
                      <MenuItem value="Master">Master</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Training Location"
                      name="trainingLocation"
                      size="small"
                      value={values.trainingLocation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.trainingLocation &&
                        Boolean(errors.trainingLocation)
                      }
                      helperText={
                        touched.trainingLocation && errors.trainingLocation
                      }
                    />
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions>
                <Button
                  onClick={() => setOpen(false)}
                  color="error"
                  variant="contained"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  {editIndex !== null ? "Update" : "Save"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CreateCourse;
