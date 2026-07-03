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
  Divider,
  Box
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import NcsService from "../../../api/services/internal/ncs/NcsService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import FileUpload from "../../../components/file/FileUpload";

// Helper function to convert file to Base64
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

const CreateCurriculumIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const access_token = useSelector((state) => state.auth.accessToken);

  // State for dropdown data
  const [sectors, setSectors] = useState([]);
  const [certificationLevels, setCertificationLevels] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState("");

  const fetchSectors = async () => {
    try {
      const sectorDtls = await CommonService.getAllSectors();
      setSectors(sectorDtls.data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchCertificationLevels = async () => {
    try {
      const certifications = await CommonService.getByParentId(10);
      setCertificationLevels(certifications.data);
    } catch (error) {
      console.error("Error fetching certification levels:", error);
    }
  };

  const fetchOccupationsBySector = async (sectorId) => {
    try {
      const occupationLists =
        await CommonService.getOccupationsBySectorId(sectorId);
      setOccupations(occupationLists.data);
    } catch (error) {
      console.error("Error fetching occupations:", error);
    }
  };

  useEffect(() => {
    fetchSectors();
    fetchCertificationLevels();
  }, []);

  // Fetch occupations when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      fetchOccupationsBySector(selectedSectorId);
    }
  }, [selectedSectorId]);

  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  const [data, setData] = useState([
    {
      id: 1,
      applicationNo: "Construction",
      courseName: "Mason",
      certificateName: "Certificate Level I",
      codeName: "BQF 2024",
      courseTitle: "Masonry",
      courseDate: "March 13th 2023 to March 25th 2027",
    },
    {
      id: 2,
      applicationNo: "Construction",
      courseName: "Plumber",
      certificateName: "Certificate Level I",
      codeName: "BQF 2026",
      courseTitle: "Plumbing",
      courseDate: "March 13th 2023 to March 25th 2027",
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
    courseTitle: "",
    occupationId: "",
    certificationId: "",
    ncsCode: "",
    validityDate: "",
    documents: [],
  };

  const validationSchema = Yup.object().shape({
    occupationId: Yup.string().required("Occupation is required"),
    certificationId: Yup.string().required("Certification is required"),
    courseTitle: Yup.string().required("Course Title is required"),
    ncsCode: Yup.string().required("Competency/Code is required"),
    validityDate: Yup.date().required("Validity Date is required"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {

      // Convert documents to Base64 format
      const documents = await Promise.all(
        values.documents.map((file) => fileToBase64(file)),
      );

      const submitData = { ...values };

      // Replace documents with converted ones
      submitData.documents = documents;

      if (editingId) {
        // Update existing record
        setData((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                ...item,
                sectorId: values.sectorId,
                occupationId: values.occupationId,
                certificationId: values.certificationId,
                validityDate: values.validityDate,
                courseTitle: values.validityDate,
                ncsCode: values.ncsCode,
              }
              : item,
          ),
        );
      } else {
        // Add new record
        const payload = {
          occupationId: values.occupationId,
          certificationId: values.certificationId,
          validityDate: values.validityDate,
          courseTitle: values.validityDate,
          ncsCode: values.ncsCode,
          //createdBy: actionId,
          publicationType: 'n',
          // statusId: 55,
        };
        //console.log("Submitting payload:", newEntry);
        //setData((prev) => [...prev, newEntry]);
        const response = await NcsService.submitNcs(
          payload,
          access_token,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Created successfully!");
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
        Curriculum Management
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
            Create
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Occupation</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Unit of Competence / Code</TableCell>
              <TableCell>Curriculum Title</TableCell>
              <TableCell>Validity Date</TableCell>
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
                    <TableCell>{item.certificateName}</TableCell>
                    <TableCell>{item.codeName}</TableCell>
                    <TableCell>{item.courseTitle}</TableCell>
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
          {editingId ? "Edit Details" : "Create Curriculum"}
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
                      label="Sector"
                      name="sectorId"
                      size="small"
                      value={formik.values.sectorId || ""}
                      onChange={(e) => {
                        const sectorId = e.target.value;
                        formik.handleChange(e);
                        setSelectedSectorId(sectorId);
                        // Reset occupation when sector changes
                        formik.setFieldValue("occupationId", "");
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.sectorId &&
                        Boolean(formik.errors.sectorId)
                      }
                      helperText={
                        formik.touched.sectorId && formik.errors.sectorId
                      }
                      disabled={loading}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {sectors.map((sec) => (
                        <MenuItem key={sec.id} value={sec.id}>
                          {sec.sectorName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={requiredLabel("Occupation")}
                      name="occupationId"
                      size="small"
                      value={formik.values.occupationId || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.occupationId &&
                        Boolean(formik.errors.occupationId)
                      }
                      helperText={
                        formik.touched.occupationId &&
                        formik.errors.occupationId
                      }
                      disabled={loading || !formik.values.sectorId}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {occupations.map((occ) => (
                        <MenuItem key={occ.id} value={occ.id}>
                          {occ.occupationName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={requiredLabel("Certification Level")}
                      name="certificationId"
                      size="small"
                      value={formik.values.certificationId || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.certificationId &&
                        Boolean(formik.errors.certificationId)
                      }
                      helperText={
                        formik.touched.certificationId &&
                        formik.errors.certificationId
                      }
                      disabled={loading}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {certificationLevels.map((lvl) => (
                        <MenuItem key={lvl.id} value={lvl.id}>
                          {lvl.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      label={requiredLabel("Unit of Competence / Code")}
                      name="ncsCode"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.ncsCode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.ncsCode &&
                        Boolean(formik.errors.ncsCode)
                      }
                      helperText={
                        formik.touched.ncsCode &&
                        formik.errors.ncsCode
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      label={requiredLabel("Course Title")}
                      name="courseTitle"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.courseTitle}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.courseTitle &&
                        Boolean(formik.errors.courseTitle)
                      }
                      helperText={
                        formik.touched.courseTitle &&
                        formik.errors.courseTitle
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={requiredLabel("Validity")}
                      name="validityDate"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.validityDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.validityDate &&
                        Boolean(formik.errors.validityDate)
                      }
                      helperText={
                        formik.touched.validityDate &&
                        formik.errors.validityDate
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    {/* Section: Supporting Documents */}
                    <Paper
                      sx={{
                        p: { xs: 2, md: 3 },
                        mb: 4,
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Supporting Documents
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Box
                        sx={{
                          p: 2,
                          border: "1px dashed #bdbdbd",
                          borderRadius: 2,
                          minHeight: 100,
                        }}
                      >
                        <FileUpload
                          files={formik.values.documents}
                          onFilesChange={(files) =>
                            formik.setFieldValue("documents", files)
                          }
                          disabled={loading}
                        />
                      </Box>
                      {formik.touched.documents && formik.errors.documents && (
                        <Typography color="error" variant="caption">
                          {formik.errors.documents}
                        </Typography>
                      )}
                    </Paper>
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

export default CreateCurriculumIndex;
