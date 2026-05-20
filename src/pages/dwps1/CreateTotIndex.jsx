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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import TotService from "../../api/services/TotService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";


const CreateTotIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);

  const [data, setData] = useState([
    {
      id: 1,
      applicationNo: "24000017",
      courseName: "Mason",
      applicationDate: "February 27th 2023 to March 9th 2023",
      courseDate: "March 13th 2023 to March 25th 2023",
    },
    {
      id: 2,
      applicationNo: "24000016",
      courseName: "Plumber",
      applicationDate: "May 6th 2022 to May 23rd 2022",
      courseDate: "June 6th 2022 to June 18th 2022",
    },
  ]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      // Parse dates for editing if needed
    } else {
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response =
        await TotService.getCourseDetailsAnnouncementByUserId(
          access_token,
        );
      setCourses(response.data);
      console.log("ToT Courses details:", response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.applicationNo.includes(search) ||
      item.courseName.toLowerCase().includes(search.toLowerCase()),
  );

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const initialValues = {
    courseName: "",
    courseStartDate: "",
    courseEndDate: "",
    applicationStartDate: "",
    applicationEndDate: "",
  };

  const validationSchema = Yup.object().shape({
    courseName: Yup.string().required("Course Name is required"),
    courseStartDate: Yup.date().required("Course Start Date is required"),
    courseEndDate: Yup.date()
      .required("Course End Date is required")
      .min(Yup.ref("courseStartDate"), "End date must be after start date"),
    applicationStartDate: Yup.date().required(
      "Application Start Date is required",
    ),
    applicationEndDate: Yup.date()
      .required("Application End Date is required")
      .min(
        Yup.ref("applicationStartDate"),
        "End date must be after start date",
      ),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      if (editingId) {
        // Update existing record
        setData((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                ...item,
                courseName: values.courseName,
                applicationDate: `${values.applicationStartDate} to ${values.applicationEndDate}`,
                courseDate: `${values.courseStartDate} to ${values.courseEndDate}`,
              }
              : item,
          ),
        );
      } else {
        // Add new record
        const payload = {
          courseId: values.courseName,
          applicationStartDate: values.applicationStartDate,
          applicationEndDate: values.applicationEndDate,
          courseStartDate: values.courseStartDate,
          courseEndDate: values.courseEndDate,
          courseDescription: values.courseDescription,
          //createdBy: actionId,
          serviceId: 24,
          statusId: 55,
        };
        //console.log("Submitting payload:", newEntry);
        //setData((prev) => [...prev, newEntry]);
        const response = await TotService.submitCourseAnnouncement(
          payload,
          access_token,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("ToT course created successfully!");
          await fetchEnrolledCourses();
          resetForm();
          setOpenDialog(false);
        }
      }

    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to submit course",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const formatDateForInput = (dateString) => {
    // This is a placeholder - you'll need to implement proper date parsing
    return dateString.split(" to ")[0];
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Course Detail List
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
            onClick={() => handleOpenDialog()}
            sx={{ height: "36px" }}
          >
            Announce TOT
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No.</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Application Date</TableCell>
              <TableCell>Course Date</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{item.applicationNo}</TableCell>
                    <TableCell>{item.courseName}</TableCell>
                    <TableCell>{item.applicationDate}</TableCell>
                    <TableCell>{item.courseDate}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(item)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
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
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit TOT Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Edit Course Details" : "Announce ToT Course"}
        </DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Course Name"
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
                      <MenuItem value="">-Select-</MenuItem>
                      <MenuItem value="1">
                        Mason
                      </MenuItem>
                      <MenuItem value="2">
                        Plumber
                      </MenuItem>
                      <MenuItem value="3">
                        Construction Carpenter
                      </MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Course Start Date"
                      name="courseStartDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.courseStartDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
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
                      fullWidth
                      type="date"
                      label="Course End Date"
                      name="courseEndDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.courseEndDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
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
                      fullWidth
                      type="date"
                      label="Application Start Date"
                      name="applicationStartDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.applicationStartDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.applicationStartDate &&
                        Boolean(formik.errors.applicationStartDate)
                      }
                      helperText={
                        formik.touched.applicationStartDate &&
                        formik.errors.applicationStartDate
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Application End Date"
                      name="applicationEndDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.applicationEndDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.applicationEndDate &&
                        Boolean(formik.errors.applicationEndDate)
                      }
                      helperText={
                        formik.touched.applicationEndDate &&
                        formik.errors.applicationEndDate
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
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
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleCloseDialog}
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
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CreateTotIndex;
