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
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Link,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LaunchIcon from "@mui/icons-material/Launch";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FileUpload from "../../../components/file/FileUplaod";
import CurriculumEndorsementIndexService from "../../../api/services/CurriculumEndorsementIndexService";
import CommonService from "../../../api/services/CommonService";
import InstituteRegistrationService from "../../../api/services/InstituteRegistrationService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

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

const CurriculumEndorsementIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [curriculumTypes, setCurriculumTypes] = useState([]);
  const [data, setData] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [dropdownData, setDropdownData] = useState([]);

  // Helper function to get status name by ID
  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const status = dropdownData.find(item => item.id === parseInt(statusId));
    return status ? status.name : "Pending";
  };

  // Helper function to parse documents and extract file info
  const getDocumentLinks = (documentsStr) => {
    if (!documentsStr) return [];
    try {
      const docs = JSON.parse(documentsStr);
      return docs.map(doc => ({
        id: doc.id,
        name: doc.documentName,
        url: doc.url,
        createdAt: doc.createdAt
      }));
    } catch (error) {
      console.error("Error parsing documents:", error);
      return [];
    }
  };

  // Helper function to handle file download - direct download only
  const handleDownload = async (file) => {
    if (!file.url) {
      toast.error("File URL not found");
      return;
    }
    
    setDownloading(true);
    try {
      // Fetch the file using CommonService
      const response = await CommonService.fetchDocument(file.name, file.url);
      const contentType = response.headers["content-type"];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name; // Force download with original filename
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the object URL
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(error.response?.data?.message || "Failed to download file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchCurriculumTypes();
    fetchInstituteDetails();
    fetchCurriculumData();
    fetchDropdownData();
  }, []);

  const fetchCurriculumTypes = async () => {
    try {
      const response = await CommonService.getByParentId(13);
      setCurriculumTypes(response.data);
    } catch (error) {
      console.error("Error fetching curriculum types:", error);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteDetails(response.data);
    } catch (error) {
      console.error("Error fetching institute data:", error);
    }
  };

  const fetchCurriculumData = async () => {
    try {
      const response =
        await CurriculumEndorsementIndexService.getCurriculumDetailsByUserId(
          registration_no,
          access_token,
        );
      setData(response.data);
      console.log("Curriculum Application Details:", response.data);
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
    }
  };
  
  const fetchDropdownData = async () => {
    try {      
      const response = await CommonService.getByParentId(4);
      setDropdownData(response.data);
      console.log("Dropdown Details:", response.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredData = data.filter(
    (item) =>
      item.application_no?.includes(search) ||
      item.curriculum_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const institute = instituteDetails[0] || {};

  const initialValues = {
    providerName: institute.proposed_institute_name || "",
    registrationNo: institute.registration_no || "",
    curriculumTypeId: "",
    curriculumName: "",
    description: "",
    files: [],
  };

  const validationSchema = Yup.object().shape({
    curriculumTypeId: Yup.string().required("Curriculum Type is required"),
    curriculumName: Yup.string().required("Curriculum Name is required"),
    description: Yup.string().required("Curriculum Description is required"),
    files: Yup.array().min(1, "Please upload curriculum document"),
  });

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    try {
      const documents = await Promise.all(
        values.files.map((file) => fileToBase64(file)),
      );

      const selectedType = curriculumTypes.find(
        (type) => type.id === parseInt(values.curriculumTypeId),
      );

      const payload = {
        curriculumName: values.curriculumName,
        curriculumTypeId: parseInt(values.curriculumTypeId),
        curriculumTypeName: selectedType ? selectedType.name : "",
        description: values.description,
        instituteId: institute.institute_id || null,
        registrationNo: values.registrationNo,
        providerName: values.providerName,
        attachment: values.files.map((file) => file.name).join(", "),
        serviceId: 25,
        assignedRoleId: 21,
        statusId: 55,
        createdBy: actionId,
        documents: documents,
        submittedDate: new Date().toISOString(),
      };

      console.log("Submitting payload:", payload);

      const response =
        await CurriculumEndorsementIndexService.submitCurriculumEndorsement(
          payload,
          access_token,
        );
      if (response.status === 200 || response.status === 201) {
        toast.success("Curriculum submitted successfully!");
      }

      await fetchCurriculumData();
      resetForm();
      setOpenDialog(false);
    } catch (error) {
      console.error("Error submitting curriculum:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit curriculum",
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Curriculum Development
      </Typography>

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
            onClick={() => setOpenDialog(true)}
            sx={{ height: "36px" }}
          >
            Add Curriculum
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Curriculum Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Attachment</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => {
                  const documents = getDocumentLinks(item.documents);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{item.application_no}</TableCell>
                      <TableCell>{item.curriculum_name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {documents.length > 0 ? (
                          documents.map((doc, idx) => (
                            <div key={doc.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <Link
                                component="button"
                                variant="body2"
                                onClick={() => handleDownload(doc)}
                                sx={{ 
                                  cursor: 'pointer', 
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline',
                                  }
                                }}
                                disabled={downloading}
                              >
                                {doc.name}
                              </Link>
                              <Tooltip title="Download">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDownload(doc)}
                                  disabled={downloading}
                                  sx={{ p: 0.5 }}
                                >
                                  <LaunchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          ))
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{getStatusName(item.status_id)}</TableCell>
                    </TableRow>
                  );
                })
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

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Apply Curriculum Development</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Name of Training Provider/Institution"
                      name="providerName"
                      size="small"
                      value={formik.values.providerName}
                      slotProps={{
                        input: {
                          readOnly: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Registration No"
                      name="registrationNo"
                      size="small"
                      value={formik.values.registrationNo}
                      slotProps={{
                        input: {
                          readOnly: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Curriculum Type"
                      name="curriculumTypeId"
                      size="small"
                      value={formik.values.curriculumTypeId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.curriculumTypeId &&
                        Boolean(formik.errors.curriculumTypeId)
                      }
                      helperText={
                        formik.touched.curriculumTypeId &&
                        formik.errors.curriculumTypeId
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      {curriculumTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Curriculum Name"
                      name="curriculumName"
                      size="small"
                      value={formik.values.curriculumName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.curriculumName &&
                        Boolean(formik.errors.curriculumName)
                      }
                      helperText={
                        formik.touched.curriculumName &&
                        formik.errors.curriculumName
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Curriculum Description"
                      name="description"
                      size="small"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.description &&
                        Boolean(formik.errors.description)
                      }
                      helperText={
                        formik.touched.description && formik.errors.description
                      }
                    />
                  </Grid>
                  <Grid item size={{ xs: 12 }}>
                    <FileUpload
                      files={formik.values.files}
                      onFilesChange={(files) =>
                        formik.setFieldValue("files", files)
                      }
                      error={
                        formik.touched.files && Boolean(formik.errors.files)
                      }
                      helperText={formik.touched.files && formik.errors.files}
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
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default CurriculumEndorsementIndex;