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
  Link,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tab,
  Tabs,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LaunchIcon from "@mui/icons-material/Launch";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EventIcon from "@mui/icons-material/Event";
import FileUpload from "../../components/file/FileUpload";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../api/services/internal/common/CommonService";
import CampusPlacementService from "../../api/services/internal/ojt/CampusPlacementService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";

// ==================== HELPERS ====================
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

const requiredLabel = (label) => (
  <>
    {label}
    <Typography component="span" sx={{ color: "red" }}>
      *
    </Typography>
  </>
);

// ==================== REUSABLE TABLE ====================
const ReusableTable = ({
  columns,
  data,
  page,
  rowsPerPage,
  loading,
  actions,
  emptyMessage = "No data found",
}) => (
  <TableContainer component={Paper} elevation={1}>
    <Table size="small" sx={tableStyle}>
      <TableHead>
        <TableRow>
          <TableCell>#</TableCell>
          {columns.map((col, i) => (
            <TableCell key={i}>{col.label}</TableCell>
          ))}
          {actions && <TableCell>Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.length > 0 ? (
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                {columns.map((col, i) => (
                  <TableCell key={i}>
                    {col.render ? col.render(item) : item[col.field] || "N/A"}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    {actions.map((action, i) => (
                      <Tooltip key={i} title={action.tooltip}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => action.onClick(item)}
                            color={action.color || "primary"}
                            disabled={
                              action.disabled ? action.disabled(item) : false
                            }
                          >
                            {action.icon}
                          </IconButton>
                        </span>
                      </Tooltip>
                    ))}
                  </TableCell>
                )}
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length + (actions ? 2 : 1)}
              align="center"
            >
              {loading ? "Loading..." : emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": { border: "1px solid", borderColor: "divider" },
};

// ==================== REUSABLE FORM FIELD ====================
const FormField = ({
  name,
  label,
  type = "text",
  required = true,
  formik,
  select = false,
  options = [],
  getOptionLabel,
  ...props
}) => {
  // Helper to get display label from option
  const getLabel = (opt) => {
    if (getOptionLabel) return getOptionLabel(opt);
    return (
      opt.name ||
      opt.firm_name ||
      opt.session_name ||
      opt.course_name ||
      opt.dzonkhagName ||
      opt.label ||
      opt
    );
  };

  // Build children array directly to avoid Fragment issues
  const children = [];
  if (select) {
    children.push(
      <MenuItem key="select-placeholder" value="">
        -select-
      </MenuItem>,
    );
    options.forEach((opt) => {
      children.push(
        <MenuItem key={opt.id} value={opt.id.toString()}>
          {getLabel(opt)}
        </MenuItem>,
      );
    });
  }

  return (
    <TextField
      fullWidth
      select={select}
      type={type}
      label={required ? requiredLabel(label) : label}
      name={name}
      size="small"
      value={formik.values[name] || ""}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      {...props}
    >
      {children}
    </TextField>
  );
};

// ==================== MAIN COMPONENT ====================
const OnCampusJobPlacement = () => {
  // ===== STATE =====
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Data states
  const [sessionData, setSessionData] = useState([]);
  const [firmData, setFirmData] = useState([]);
  const [placementData, setPlacementData] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [instituteId, setInstituteId] = useState(null);

  // Dialog states
  const [dialogState, setDialogState] = useState({
    session: { open: false, edit: false, view: false },
    firm: { open: false, edit: false },
    placement: { open: false },
  });
  const [selected, setSelected] = useState({
    session: null,
    firm: null,
    placement: null,
  });

  // Redux
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // ===== TABS =====
  const tabs = [
    { label: "Placement Sessions", icon: <EventIcon /> },
    { label: "Firms/Companies", icon: <BusinessIcon /> },
    { label: "Trainee Placements", icon: <PersonAddIcon /> },
  ];

  // ===== EFFECTS =====
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchDropdownData(),
          fetchInstituteDetails(),
          fetchTrainees(),
          fetchCourses(),
          fetchEmploymentStatus(),
          fetchDzongkhags(),
        ]);
        await Promise.all([
          fetchSessionData(),
          fetchFirmData(),
          fetchPlacementData(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // ===== API CALLS =====
  const fetchApi = async (serviceFn, params, setter, errorMsg) => {
    try {
      setLoading(true);
      const response = await serviceFn(...params);
      setter(response.data || []);
      return response;
    } catch (error) {
      console.error(errorMsg, error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = () =>
    fetchApi(
      CommonService.getByParentId,
      [4],
      setDropdownData,
      "Failed to load dropdown",
    );
  const fetchEmploymentStatus = () =>
    fetchApi(
      CommonService.getByParentId,
      [17],
      setEmploymentStatuses,
      "Failed to load employment statuses",
    );
  const fetchDzongkhags = () =>
    fetchApi(
      CommonService.getAllDzongkhags,
      [],
      setDzongkhags,
      "Failed to load dzongkhags",
    );

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteId(response.data[0]?.institute_id);
    } catch (error) {
      toast.error("Failed to load institute details");
    }
  };

  const fetchTrainees = () =>
    fetchApi(
      CommonService.getTraineesByInstitute,
      [registration_no],
      setTrainees,
      "Failed to load trainees",
    );
  const fetchCourses = () =>
    fetchApi(
      CommonService.getCoursesByInstitute,
      [registration_no],
      setCourses,
      "Failed to load courses",
    );
  const fetchSessionData = () =>
    fetchApi(
      CampusPlacementService.getSessions,
      [registration_no, access_token],
      setSessionData,
      "Failed to load sessions",
    );
  const fetchFirmData = () =>
    fetchApi(
      CampusPlacementService.getFirms,
      [registration_no, access_token],
      setFirmData,
      "Failed to load firms",
    );
  const fetchPlacementData = () =>
    fetchApi(
      CampusPlacementService.getPlacements,
      [registration_no, access_token],
      setPlacementData,
      "Failed to load placements",
    );

  // ===== HELPERS =====
  const getStatusName = (id) =>
    dropdownData.find((s) => s.id === parseInt(id))?.name || "Pending";
  const getStatusColor = (id) => {
    const name = getStatusName(id)?.toLowerCase() || "";
    if (
      name.includes("approve") ||
      name.includes("complete") ||
      name.includes("placed") ||
      name.includes("confirmed")
    )
      return "success";
    if (name.includes("reject") || name.includes("cancel")) return "error";
    if (name.includes("pending") || name.includes("scheduled"))
      return "warning";
    return "default";
  };
  const getEmploymentStatusName = (id) =>
    employmentStatuses.find((s) => String(s.id) === String(id))?.name ||
    "Not Set";
  const getEmploymentStatusColor = (name) => {
    const colors = {
      Employed: "success",
      Unemployed: "error",
      Student: "info",
      Intern: "info",
      Contract: "warning",
      Probation: "secondary",
    };
    return colors[name] || "default";
  };
  const getDzongkhagName = (id) =>
    dzongkhags.find((d) => String(d.id) === String(id))?.dzonkhagName || "N/A";
  const getDocumentLinks = (str) => {
    try {
      return str
        ? JSON.parse(str).map((d) => ({
            id: d.id,
            name: d.documentName,
            url: d.url,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const handleDownload = async (file) => {
    if (!file.url) return toast.error("File URL not found");
    setDownloading(true);
    try {
      const response = await CommonService.fetchDocument(file.name, file.url);
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("File downloaded!");
    } catch (error) {
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  // ===== CRUD OPERATIONS =====
  const handleDelete = async (id, serviceFn, name, refetch) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await serviceFn(id, access_token);
      toast.success(`${name} deleted successfully!`);
      await refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  // ===== FORM SUBMISSIONS =====
  const submitForm = async (
    values,
    serviceFn,
    payloadFn,
    successMsg,
    refetchFn,
    resetForm,
    isEdit = false,
    id = null,
  ) => {
    setLoading(true);
    try {
      const payload = payloadFn(values);
      const response = isEdit
        ? await serviceFn({ id, ...payload }, access_token)
        : await serviceFn(payload, access_token);
      if (response.status === 200 || response.status === 201) {
        toast.success(successMsg);
        await refetchFn();
        resetForm();
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleSessionSubmit = async (values, { resetForm }) => {
    const documents = await Promise.all(values.files.map(fileToBase64));
    const payload = (v) => ({
      sessionName: v.sessionName,
      sessionDate: v.sessionDate,
      sessionTime: v.sessionTime,
      venue: v.venue,
      description: v.description,
      instituteId: instituteId || null,
      createdBy: actionId,
      statusId: 70,
      documents,
    });
    const success = await submitForm(
      values,
      CampusPlacementService.submitSession,
      payload,
      selected.session ? "Session updated!" : "Session created!",
      fetchSessionData,
      resetForm,
      !!selected.session,
      selected.session?.id,
    );
    if (success) {
      setDialogState((prev) => ({
        ...prev,
        session: { open: false, edit: false, view: false },
      }));
      setSelected((prev) => ({ ...prev, session: null }));
    }
  };

  const handleFirmSubmit = async (values, { resetForm }) => {
    const payload = (v) => ({
      registrationNo: v.registrationNo,
      firmName: v.firmName,
      contactPerson: v.contactPerson,
      contactPhone: v.contactPhone,
      contactEmail: v.contactEmail,
      dzongkhag: v.dzongkhag,
      address: v.address,
      description: v.description,
      instituteId: instituteId || null,
      createdBy: actionId,
    });
    const success = await submitForm(
      values,
      CampusPlacementService.submitFirm,
      payload,
      selected.firm ? "Firm updated!" : "Firm added!",
      fetchFirmData,
      resetForm,
      !!selected.firm,
      selected.firm?.id,
    );
    if (success) {
      setDialogState((prev) => ({
        ...prev,
        firm: { open: false, edit: false },
      }));
      setSelected((prev) => ({ ...prev, firm: null }));
    }
  };

  const handlePlacementSubmit = async (values, { resetForm }) => {
    const payload = (v) => ({
      sessionId: v.sessionId,
      firmId: v.firmId,
      traineeCid: v.traineeCid,
      traineeName: v.traineeName,
      courseId: v.courseId,
      position: v.position,
      employmentStatus: v.employmentStatus,
      salary: v.salary,
      remarks: v.remarks,
      instituteId: instituteId || null,
      createdBy: actionId,
      statusId: 72,
      placementDate: new Date().toISOString().split("T")[0],
      startDate: new Date().toISOString().split("T")[0],
    });
    const success = await submitForm(
      values,
      CampusPlacementService.submitPlacement,
      payload,
      "Placement recorded!",
      fetchPlacementData,
      resetForm,
    );
    if (success) {
      setDialogState((prev) => ({ ...prev, placement: { open: false } }));
    }
  };

  // ===== VALIDATION SCHEMAS =====
  const sessionSchema = Yup.object({
    sessionName: Yup.string().required("Session name is required"),
    sessionDate: Yup.date().required("Session date is required"),
    sessionTime: Yup.string().required("Session time is required"),
    venue: Yup.string().required("Venue is required"),
    description: Yup.string(),
    files: Yup.array(),
  });

  const firmSchema = Yup.object({
    registrationNo: Yup.string().required("Registration number is required"),
    firmName: Yup.string().required("Firm name is required"),
    contactPerson: Yup.string().required("Contact person is required"),
    contactPhone: Yup.string().required("Contact phone is required"),
    contactEmail: Yup.string()
      .email("Invalid email")
      .required("Contact email is required"),
    dzongkhag: Yup.string().required("Location Dzongkhag is required"),
    address: Yup.string().required("Address is required"),
    description: Yup.string(),
  });

  const placementSchema = Yup.object({
    sessionId: Yup.string().required("Placement session is required"),
    firmId: Yup.string().required("Company is required"),
    traineeCid: Yup.string().required("Trainee CID is required"),
    traineeName: Yup.string().required("Trainee Name is required"),
    courseId: Yup.string().required("Course is required"),
    position: Yup.string().required("Position is required"),
    employmentStatus: Yup.string().required("Employment status is required"),
    salary: Yup.number().min(0, "Salary must be positive"),
    remarks: Yup.string(),
  });

  // ===== INITIAL VALUES =====
  const getInitialValues = (type, data = null) => {
    const maps = {
      session: {
        sessionName: data?.session_name || "",
        sessionDate: data?.session_date || "",
        sessionTime: data?.session_time || "",
        venue: data?.venue || "",
        description: data?.description || "",
        files: [],
      },
      firm: {
        registrationNo: data?.registration_no || "",
        firmName: data?.firm_name || "",
        contactPerson: data?.contact_person || "",
        contactPhone: data?.contact_phone || "",
        contactEmail: data?.contact_email || "",
        dzongkhag: data?.dzongkhag || "",
        address: data?.address || "",
        description: data?.description || "",
      },
      placement: {
        sessionId: data?.session_id || "",
        firmId: data?.firm_id || "",
        traineeCid: data?.trainee_cid || "",
        traineeName: data?.trainee_name || "",
        courseId: data?.course_id || "",
        position: data?.position || "",
        employmentStatus: data?.employment_status || "",
        salary: data?.salary || "",
        remarks: data?.remarks || "",
      },
    };
    return maps[type] || {};
  };

  // ===== FILTER =====
  const filterData = (data, fields) => {
    if (!data) return [];
    return data.filter((item) =>
      fields.some((f) =>
        item[f]?.toString().toLowerCase().includes(search.toLowerCase()),
      ),
    );
  };

  const filtered = {
    session: filterData(sessionData, ["session_name", "venue"]),
    firm: filterData(firmData, ["firm_name", "contact_person", "dzongkhag"]),
    placement: filterData(placementData, [
      "trainee_name",
      "trainee_cid",
      "position",
      "firm_name",
    ]),
  };

  // ===== RENDER FUNCTIONS =====
  const renderTable = (type, columns, actions, data) => (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            if (type === "firm")
              setDialogState((prev) => ({
                ...prev,
                firm: { ...prev.firm, open: true },
              }));
            else if (type === "session")
              setDialogState((prev) => ({
                ...prev,
                session: { ...prev.session, open: true },
              }));
            else
              setDialogState((prev) => ({
                ...prev,
                placement: { ...prev.placement, open: true },
              }));
          }}
        >
          {type === "firm"
            ? "Add Firm"
            : type === "session"
              ? "Create Session"
              : "Record Placement"}
        </Button>
      </Box>
      <ReusableTable
        columns={columns}
        data={data}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={loading}
        actions={actions}
      />
    </>
  );

  const renderDialog = (
    type,
    title,
    form,
    initialValues,
    schema,
    onSubmit,
    maxWidth = "md",
  ) => {
    const isOpen = dialogState[type]?.open || dialogState[type]?.edit;
    const onClose = () => {
      if (type === "firm")
        setDialogState((prev) => ({
          ...prev,
          firm: { open: false, edit: false },
        }));
      else if (type === "session")
        setDialogState((prev) => ({
          ...prev,
          session: { open: false, edit: false },
        }));
      else setDialogState((prev) => ({ ...prev, placement: { open: false } }));
      setSelected((prev) => ({ ...prev, [type]: null }));
    };

    return (
      <Dialog open={isOpen} onClose={onClose} maxWidth={maxWidth} fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>{form({ formik })}</DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={onClose}
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
                  {loading
                    ? "Saving..."
                    : dialogState[type]?.edit
                      ? "Update"
                      : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    );
  };

  // ===== FORM COMPONENTS =====
  const SessionForm = ({ formik }) => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField name="sessionName" label="Session Name" formik={formik} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="sessionDate"
          label="Session Date"
          type="date"
          formik={formik}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="sessionTime"
          label="Session Time"
          type="time"
          formik={formik}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField name="venue" label="Venue" formik={formik} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FormField
          name="description"
          label="Description"
          multiline
          rows={3}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FileUpload
          files={formik.values.files}
          onFilesChange={(f) => formik.setFieldValue("files", f)}
        />
      </Grid>
    </Grid>
  );

  const FirmForm = ({ formik }) => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="registrationNo"
          label="Registration No"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField name="firmName" label="Firm Name" formik={formik} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="contactPerson"
          label="Contact Person Name"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="contactPhone"
          label="Contact Person Mobile No"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="contactEmail"
          label="Contact Person Email"
          type="email"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="dzongkhag"
          label="Location Dzongkhag"
          select
          options={dzongkhags}
          getOptionLabel={(opt) => opt.dzonkhagName}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FormField
          name="address"
          label="Address"
          multiline
          rows={2}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FormField
          name="description"
          label="Description"
          multiline
          rows={2}
          formik={formik}
        />
      </Grid>
    </Grid>
  );

  const PlacementForm = ({ formik }) => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="sessionId"
          label="Placement Session"
          select
          options={sessionData.map((s) => ({
            ...s,
            displayName: `${s.session_name} (${s.session_date ? new Date(s.session_date).toLocaleDateString() : ""})`,
          }))}
          getOptionLabel={(opt) => opt.displayName || opt.session_name}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="firmId"
          label="Company"
          select
          options={firmData}
          getOptionLabel={(opt) => opt.firm_name}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="traineeCid"
          label="Trainee CID"
          formik={formik}
          placeholder="e.g., 1234567890123"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField name="traineeName" label="Trainee Name" formik={formik} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="courseId"
          label="Course"
          select
          options={courses}
          getOptionLabel={(opt) =>
            `${opt.course_name} (${opt.course_code || opt.id})`
          }
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField name="position" label="Position" formik={formik} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="employmentStatus"
          label="Employment Status"
          select
          options={employmentStatuses}
          getOptionLabel={(opt) => opt.name}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="salary"
          label="Salary (if applicable)"
          type="number"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FormField
          name="remarks"
          label="Remarks"
          multiline
          rows={2}
          formik={formik}
        />
      </Grid>
    </Grid>
  );

  // ===== TABLE COLUMNS =====
  const sessionColumns = [
    { label: "Session Name", field: "session_name" },
    {
      label: "Date & Time",
      render: (i) =>
        i.session_date && i.session_time
          ? `${new Date(i.session_date).toLocaleDateString()} - ${i.session_time}`
          : "N/A",
    },
    { label: "Venue", field: "venue" },
    {
      label: "Status",
      render: (i) => (
        <Chip
          label={getStatusName(i.status_id)}
          color={getStatusColor(i.status_id)}
          size="small"
        />
      ),
    },
  ];

  const firmColumns = [
    { label: "Registration No", field: "registration_no" },
    { label: "Firm Name", field: "firm_name" },
    { label: "Contact Person", field: "contact_person" },
    { label: "Phone", field: "contact_phone" },
    { label: "Email", field: "contact_email" },
    { label: "Dzongkhag", render: (i) => getDzongkhagName(i.dzongkhag) },
    { label: "Address", field: "address" },
  ];

  const placementColumns = [
    { label: "Trainee CID", field: "trainee_cid" },
    { label: "Trainee Name", field: "trainee_name" },
    { label: "Session", field: "session_name" },
    { label: "Company", field: "firm_name" },
    { label: "Position", field: "position" },
    {
      label: "Employment Status",
      render: (i) => {
        const name = getEmploymentStatusName(i.employment_status);
        return (
          <Chip
            label={name}
            color={
              i.employment_status ? getEmploymentStatusColor(name) : "default"
            }
            size="small"
          />
        );
      },
    },
    { label: "Salary", field: "salary" },
  ];

  const sessionActions = [
    {
      icon: <LaunchIcon />,
      tooltip: "View",
      color: "info",
      onClick: (i) => {
        setSelected((prev) => ({ ...prev, session: i }));
        setDialogState((prev) => ({
          ...prev,
          session: { ...prev.session, view: true },
        }));
      },
    },
    {
      icon: <EditIcon />,
      tooltip: "Edit",
      color: "primary",
      onClick: (i) => {
        setSelected((prev) => ({ ...prev, session: i }));
        setDialogState((prev) => ({
          ...prev,
          session: { ...prev.session, edit: true },
        }));
      },
    },
    {
      icon: <DeleteIcon />,
      tooltip: "Delete",
      color: "error",
      onClick: (i) =>
        handleDelete(
          i.id,
          CampusPlacementService.deleteSession,
          i.session_name,
          fetchSessionData,
        ),
    },
  ];

  const firmActions = [
    {
      icon: <EditIcon />,
      tooltip: "Edit",
      color: "primary",
      onClick: (i) => {
        setSelected((prev) => ({ ...prev, firm: i }));
        setDialogState((prev) => ({
          ...prev,
          firm: { ...prev.firm, edit: true },
        }));
      },
    },
    {
      icon: <DeleteIcon />,
      tooltip: "Delete",
      color: "error",
      onClick: (i) =>
        handleDelete(
          i.id,
          CampusPlacementService.deleteFirm,
          i.firm_name,
          fetchFirmData,
        ),
    },
  ];

  const placementActions = [
    {
      icon: <LaunchIcon />,
      tooltip: "View",
      color: "info",
      onClick: (i) => {
        setSelected((prev) => ({ ...prev, placement: i }));
        setDialogState((prev) => ({ ...prev, placement: { open: true } }));
      },
    },
  ];

  // ===== MAIN RENDER =====
  return (
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      <Typography variant="h5" gutterBottom>
        On-Campus Job Placement Management
      </Typography>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        {tabs.map((tab, i) => (
          <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>

      <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="Search"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { height: 36 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            sx={{ height: 36, width: "100%" }}
          >
            Clear
          </Button>
        </Grid>
      </Grid>

      {tabValue === 0 &&
        renderTable(
          "session",
          sessionColumns,
          sessionActions,
          filtered.session,
        )}
      {tabValue === 1 &&
        renderTable("firm", firmColumns, firmActions, filtered.firm)}
      {tabValue === 2 &&
        renderTable(
          "placement",
          placementColumns,
          placementActions,
          filtered.placement,
        )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={
          [
            filtered.session.length,
            filtered.firm.length,
            filtered.placement.length,
          ][tabValue]
        }
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* View Session Dialog */}
      <Dialog
        open={dialogState.session.view}
        onClose={() =>
          setDialogState((prev) => ({
            ...prev,
            session: { ...prev.session, view: false },
          }))
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Session Details</DialogTitle>
        <DialogContent dividers>
          {selected.session && (
            <Grid container spacing={2}>
              {[
                { label: "Session Name", value: selected.session.session_name },
                {
                  label: "Date",
                  value: selected.session.session_date
                    ? new Date(
                        selected.session.session_date,
                      ).toLocaleDateString()
                    : "N/A",
                },
                { label: "Time", value: selected.session.session_time },
                { label: "Venue", value: selected.session.venue },
                {
                  label: "Status",
                  value: getStatusName(selected.session.status_id),
                },
              ].map((field, i) => (
                <Grid key={i} size={{ xs: 12, md: i < 4 ? 6 : 12 }}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={field.value || "N/A"}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={selected.session.description || "N/A"}
                  multiline
                  rows={2}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDialogState((prev) => ({
                ...prev,
                session: { ...prev.session, view: false },
              }))
            }
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Placement Dialog */}
      <Dialog
        open={dialogState.placement.open && selected.placement}
        onClose={() => {
          setDialogState((prev) => ({ ...prev, placement: { open: false } }));
          setSelected((prev) => ({ ...prev, placement: null }));
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Placement Details</DialogTitle>
        <DialogContent dividers>
          {selected.placement && (
            <Grid container spacing={2}>
              {[
                { label: "Trainee CID", value: selected.placement.trainee_cid },
                {
                  label: "Trainee Name",
                  value: selected.placement.trainee_name,
                },
                { label: "Session", value: selected.placement.session_name },
                { label: "Company", value: selected.placement.firm_name },
                { label: "Position", value: selected.placement.position },
                {
                  label: "Employment Status",
                  value: getEmploymentStatusName(
                    selected.placement.employment_status,
                  ),
                },
                { label: "Salary", value: selected.placement.salary || "N/A" },
              ].map((field, i) => (
                <Grid key={i} size={{ xs: 12, md: i < 4 ? 6 : 12 }}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={field.value || "N/A"}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Remarks"
                  value={selected.placement.remarks || "N/A"}
                  multiline
                  rows={2}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogState((prev) => ({
                ...prev,
                placement: { open: false },
              }));
              setSelected((prev) => ({ ...prev, placement: null }));
            }}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Render Dialogs */}
      {renderDialog(
        "session",
        selected.session ? "Edit Session" : "Create Session",
        SessionForm,
        getInitialValues("session", selected.session),
        sessionSchema,
        handleSessionSubmit,
        "lg",
      )}
      {renderDialog(
        "firm",
        selected.firm ? "Edit Firm" : "Add New Firm",
        FirmForm,
        getInitialValues("firm", selected.firm),
        firmSchema,
        handleFirmSubmit,
      )}
      {!selected.placement &&
        renderDialog(
          "placement",
          "Record Trainee Placement",
          PlacementForm,
          getInitialValues("placement"),
          placementSchema,
          handlePlacementSubmit,
        )}
    </Paper>
  );
};

export default OnCampusJobPlacement;
