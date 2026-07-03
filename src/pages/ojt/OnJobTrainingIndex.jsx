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
  DialogContentText,
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
import AssignmentIcon from "@mui/icons-material/Assignment";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUpload from "../../components/file/FileUpload";
import CommonService from "../../api/services/internal/common/CommonService";
import OJTService from "../../api/services/internal/ojt/OJTService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../api/services/internal/course/ApplyAccreditedCourseService";

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

// ==================== REUSABLE FORM FIELDS ====================
const FormField = ({
  name,
  label,
  type = "text",
  required = true,
  formik,
  select = false,
  options = [],
  ...props
}) => {
  const field = (
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
      {select && (
        <>
          <MenuItem value="">-select-</MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id.toString()}>
              {opt.name ||
                opt.company_name ||
                opt.agreement_title ||
                opt.course_name}
            </MenuItem>
          ))}
        </>
      )}
    </TextField>
  );
  return field;
};

// ==================== MAIN COMPONENT ====================
const OnJobTrainingIndex = () => {
  // ===== STATE =====
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");

  // Data states
  const [ojtData, setOjtData] = useState([]);
  const [firmData, setFirmData] = useState([]);
  const [placementData, setPlacementData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);

  // Dialog states
  const [dialogState, setDialogState] = useState({
    ojt: { open: false, edit: false, view: false },
    firm: { open: false, edit: false },
    placement: { open: false },
    delete: { open: false, item: null, type: "" },
  });
  const [selected, setSelected] = useState({
    ojt: null,
    firm: null,
    placement: null,
  });

  // Redux
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);
  const [instituteId, setInstituteId] = useState(null);

  // ===== TABS =====
  const tabs = [
    { label: "Firms/Companies", icon: <BusinessIcon /> },
    { label: "OJT Agreements", icon: <AssignmentIcon /> },
    { label: "Trainee Placements", icon: <PersonAddIcon /> },
  ];

  // ===== EFFECTS =====
  useEffect(() => {
    const loadIndependent = async () => {
      try {
        await Promise.all([
          fetchDropdownData(),
          fetchInstituteDetails(),
          fetchDzongkhags(),
          fetchEmploymentStatus(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadIndependent();
  }, []);

  useEffect(() => {
    if (instituteId && access_token) {
      const loadDependent = async () => {
        try {
          await Promise.all([
            fetchFirmData(instituteId),
            fetchOjtData(instituteId),
            fetchPlacementData(),
            fetchCourses(instituteId, access_token),
          ]);
        } catch (error) {
          console.error("Error loading dependent data:", error);
        }
      };
      loadDependent();
    }
  }, [instituteId, access_token]);

  // ===== API CALLS =====
  const fetchApi = async (service, params, setter, errorMsg) => {
    try {
      setLoading(true);
      const response = await service(...params);
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
  const fetchCourses = (id, token) =>
    fetchApi(
      ApplyAccreditedCourseService.getAccreditedCourseByInstituteId,
      [id, token],
      setCourses,
      "Failed to load courses",
    );
  const fetchOjtData = (id) =>
    fetchApi(
      OJTService.getAgreementByInstituteId,
      [id, access_token],
      setOjtData,
      "Failed to load OJT agreements",
    );
  const fetchFirmData = (id) =>
    fetchApi(
      OJTService.getCompanyByInstituteId,
      [id, access_token],
      setFirmData,
      "Failed to load firms",
    );
  const fetchPlacementData = () => {
    if (!instituteId || !access_token) return;
    return fetchApi(
      OJTService.getTraineeByInstituteId,
      [instituteId, access_token],
      setPlacementData,
      "Failed to load placements",
    );
  };

  // ===== HELPERS =====
  const getStatusName = (id) =>
    dropdownData.find((s) => s.id === parseInt(id))?.name || "Pending";
  const getStatusColor = (id) => {
    const name = getStatusName(id)?.toLowerCase() || "";
    if (name.includes("approve") || name.includes("complete")) return "success";
    if (name.includes("reject") || name.includes("cancel")) return "error";
    if (name.includes("pending") || name.includes("review")) return "warning";
    return "default";
  };
  const getDzongkhagName = (id) =>
    dzongkhags.find((d) => d.id === parseInt(id))?.dzonkhagName || "N/A";
  const getEmploymentStatusName = (id) =>
    employmentStatuses.find((s) => String(s.id) === String(id))?.name ||
    "Not Set";
  const getEmploymentStatusColor = (name) =>
    ({
      Employed: "success",
      Unemployed: "error",
      Student: "info",
      Intern: "info",
      Contract: "warning",
      Probation: "secondary",
    })[name] || "default";
  const getCompanyName = (id) =>
    firmData.find((f) => String(f.id) === String(id))?.company_name || "N/A";
  const getAgreementTitle = (id) =>
    ojtData.find((o) => String(o.id) === String(id))?.agreement_title ||
    `ID: ${id}`;
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

  // ===== CRUD OPERATIONS =====
  const handleDelete = (item, type) => {
    setDialogState((prev) => ({ ...prev, delete: { open: true, item, type } }));
  };

  const handleDeleteConfirm = async () => {
    const { item, type } = dialogState.delete;
    try {
      const services = {
        firm: {
          fn: OJTService.deleteFirm,
          refetch: fetchFirmData,
          msg: `Firm "${item.company_name}" deleted`,
        },
        ojt: {
          fn: OJTService.deleteOjtAgreement,
          refetch: fetchOjtData,
          msg: `OJT Agreement "${item.agreement_title}" deleted`,
        },
        placement: {
          fn: OJTService.deletePlacement,
          refetch: fetchPlacementData,
          msg: `Placement for "${item.trainee_name}" deleted`,
        },
      };
      const service = services[type];
      await service.fn(item.id, access_token);
      toast.success(service.msg);
      await service.refetch(type === "placement" ? undefined : instituteId);
      setDialogState((prev) => ({
        ...prev,
        delete: { open: false, item: null, type: "" },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  // ===== FORM SUBMISSIONS =====
  const submitForm = async (
    values,
    service,
    payloadFn,
    successMsg,
    refetchFn,
    resetForm,
  ) => {
    setLoading(true);
    try {
      const payload = payloadFn(values);
      const response = await service(payload, access_token);
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

  const handleOjtSubmit = async (values, { resetForm, setFieldError }) => {
    const documents = await Promise.all(values.files.map(fileToBase64));
    const payload = (v) => ({
      companyId: v.firmId,
      agreementTitle: v.agreementTitle,
      agreementDate: v.agreementDate,
      startDate: v.startDate,
      endDate: v.endDate,
      totalTraineeNo: v.numberOfTrainees,
      superVisorName: v.supervisorName,
      supervisorContactNo: v.supervisorContact,
      description: v.description,
      documents,
      instituteId: instituteId || null,
      createdBy: actionId,
      statusId: 55,
      serviceId: 26,
      assignedRoleId: 21,
    });
    const success = await submitForm(
      values,
      OJTService.submitOJTAgrement,
      payload,
      "OJT Agreement submitted!",
      () => fetchOjtData(instituteId),
      resetForm,
    );
    if (success) {
      setDuplicateError("");
      setDialogState((prev) => ({
        ...prev,
        ojt: { ...prev.ojt, open: false },
      }));
    }
  };

  const handleFirmSubmit = async (values, { resetForm }) => {
    const payload = (v) => ({
      registrationNo: v.registrationNo,
      companyName: v.firmName,
      contactPersonName: v.contactPerson,
      contactPersonMobileNo: v.contactPhone,
      contactPersonEmail: v.contactEmail,
      dzongkhagId: v.dzongkhag,
      address: v.address,
      description: v.description,
      instituteId: instituteId || null,
      createdBy: actionId,
    });
    const service = selected.firm
      ? OJTService.updateFirm
      : OJTService.submitOJTCompany;
    const payloadData = selected.firm
      ? { id: selected.firm.id, ...payload(values) }
      : payload(values);
    const success = await submitForm(
      values,
      service,
      () => payloadData,
      selected.firm ? "Firm updated!" : "Firm added!",
      () => fetchFirmData(instituteId),
      resetForm,
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
      ojtAgreementId: v.ojtAgreementId,
      traineeCid: v.traineeCid,
      traineeName: v.traineeName,
      courseId: v.courseId,
      position: v.position,
      employmentStatus: v.employmentStatus,
      salary: v.salary,
      remarks: v.remarks,
      instituteId: instituteId || null,
      createdBy: actionId,
      statusId: 65,
      placementDate: new Date().toISOString().split("T")[0],
      startDate: new Date().toISOString().split("T")[0],
    });
    const success = await submitForm(
      values,
      OJTService.submitOJTTrainee,
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
  const ojtSchema = Yup.object({
    firmId: Yup.string().required("Firm is required"),
    agreementTitle: Yup.string().required("Title is required"),
    agreementDate: Yup.date().required("Date is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date must be after start date"),
    numberOfTrainees: Yup.number().required().min(1, "At least 1 trainee"),
    supervisorName: Yup.string().required("Supervisor name is required"),
    supervisorContact: Yup.string().required("Contact is required"),
    description: Yup.string(),
    files: Yup.array(),
  });

  const firmSchema = Yup.object({
    registrationNo: Yup.string().required("Registration is required"),
    firmName: Yup.string().required("Firm name is required"),
    contactPerson: Yup.string().required("Contact person is required"),
    contactPhone: Yup.string().required("Phone is required"),
    contactEmail: Yup.string()
      .email("Invalid email")
      .required("Email is required"),
    dzongkhag: Yup.string().required("Dzongkhag is required"),
    address: Yup.string().required("Address is required"),
    description: Yup.string(),
  });

  const placementSchema = Yup.object({
    ojtAgreementId: Yup.string().required("Agreement is required"),
    traineeCid: Yup.string().required("CID is required"),
    traineeName: Yup.string().required("Name is required"),
    courseId: Yup.string().required("Course is required"),
    position: Yup.string().required("Position is required"),
    employmentStatus: Yup.string().required("Status is required"),
    salary: Yup.number().min(0, "Salary must be positive"),
    remarks: Yup.string(),
  });

  // ===== INITIAL VALUES =====
  const getInitialValues = (type, data = null) => {
    const maps = {
      ojt: {
        firmId: data?.company_id || "",
        agreementTitle: data?.agreement_title || "",
        agreementDate: data?.agreement_date || "",
        startDate: data?.start_date || "",
        endDate: data?.end_date || "",
        numberOfTrainees: data?.total_trainee_no || "",
        supervisorName: data?.super_visor_name || "",
        supervisorContact: data?.supervisor_contact_no || "",
        description: data?.description || "",
        files: [],
      },
      firm: {
        registrationNo: data?.registration_no || "",
        firmName: data?.company_name || "",
        contactPerson: data?.contact_person_name || "",
        contactPhone: data?.contact_person_mobile_no || "",
        contactEmail: data?.contact_person_email || "",
        dzongkhag: data?.dzongkhag_id || "",
        address: data?.address || "",
        description: data?.description || "",
      },
      placement: {
        ojtAgreementId: data?.agreement_id || "",
        traineeCid: data?.trainee_cid || "",
        traineeName: data?.trainee_name || "",
        courseId: data?.course_id || "",
        position: data?.position || "",
        employmentStatus: data?.employment_status_id || "",
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
    ojt: filterData(ojtData, [
      "agreement_title",
      "super_visor_name",
      "description",
    ]),
    firm: filterData(firmData, [
      "company_name",
      "contact_person_name",
      "dzongkhag_id",
    ]),
    placement: filterData(placementData, [
      "trainee_name",
      "trainee_cid",
      "agreement_id",
      "position",
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
            else if (type === "ojt")
              setDialogState((prev) => ({
                ...prev,
                ojt: { ...prev.ojt, open: true },
              }));
            else
              setDialogState((prev) => ({
                ...prev,
                placement: { ...prev.placement, open: true },
              }));
          }}
        >
          Add{" "}
          {type === "firm"
            ? "Firm"
            : type === "ojt"
              ? "OJT Agreement"
              : "Placement"}
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

  // ===== DIALOG HELPERS =====
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
      else if (type === "ojt")
        setDialogState((prev) => ({
          ...prev,
          ojt: { open: false, edit: false },
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
              <DialogContent dividers>{form}</DialogContent>
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
  const OjtForm = ({ formik }) => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="firmId"
          label="Firm/Company"
          select
          options={firmData}
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="agreementTitle"
          label="Agreement Title"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="agreementDate"
          label="Agreement Date"
          type="date"
          formik={formik}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="startDate"
          label="Start Date"
          type="date"
          formik={formik}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="endDate"
          label="End Date"
          type="date"
          formik={formik}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="numberOfTrainees"
          label="Number of Trainees"
          type="number"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="supervisorName"
          label="Supervisor Name"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormField
          name="supervisorContact"
          label="Supervisor Contact"
          formik={formik}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FormField
          name="description"
          label="Description/Remarks"
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
          name="ojtAgreementId"
          label="OJT Agreement"
          select
          options={ojtData.map((o) => ({ ...o, name: o.agreement_title }))}
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
  const firmColumns = [
    { label: "Registration No", field: "registration_no" },
    { label: "Firm Name", field: "company_name" },
    { label: "Contact Person", field: "contact_person_name" },
    { label: "Phone", field: "contact_person_mobile_no" },
    { label: "Email", field: "contact_person_email" },
    { label: "Dzongkhag", render: (i) => getDzongkhagName(i.dzongkhag_id) },
    { label: "Address", field: "address" },
  ];

  const ojtColumns = [
    { label: "Agreement Title", field: "agreement_title" },
    { label: "Company Name", render: (i) => getCompanyName(i.company_id) },
    { label: "Trainees", field: "total_trainee_no" },
    { label: "Supervisor", field: "super_visor_name" },
    {
      label: "Period",
      render: (i) =>
        i.start_date && i.end_date
          ? `${new Date(i.start_date).toLocaleDateString()} - ${new Date(i.end_date).toLocaleDateString()}`
          : "N/A",
    },
    {
      label: "Documents",
      render: (i) => {
        const docs = getDocumentLinks(i.documents);
        return docs.length
          ? docs.map((d, idx) => (
              <div
                key={d.id || idx}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => handleDownload(d)}
                >
                  {d.name}
                </Link>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(d)}
                  disabled={downloading}
                >
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </div>
            ))
          : "N/A";
      },
    },
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

  const placementColumns = [
    { label: "Trainee CID", field: "trainee_cid" },
    { label: "Trainee Name", field: "trainee_name" },
    { label: "Agreement", render: (i) => getAgreementTitle(i.agreement_id) },
    { label: "Position", field: "position" },
    {
      label: "Employment Status",
      render: (i) => {
        const name = getEmploymentStatusName(i.employment_status_id);
        return (
          <Chip
            label={name}
            color={
              i.employment_status_id
                ? getEmploymentStatusColor(name)
                : "default"
            }
            size="small"
          />
        );
      },
    },
    { label: "Salary", field: "salary" },
  ];

  const firmActions = [
    {
      icon: <EditIcon />,
      tooltip: "Edit",
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
      onClick: (i) => handleDelete(i, "firm"),
    },
  ];

  const ojtActions = [
    {
      icon: <LaunchIcon />,
      tooltip: "View",
      color: "info",
      onClick: (i) => {
        setSelected((prev) => ({ ...prev, ojt: i }));
        setDialogState((prev) => ({
          ...prev,
          ojt: { ...prev.ojt, view: true },
        }));
      },
    },
    {
      icon: <EditIcon />,
      tooltip: "Edit",
      disabled: (i) => [57, 58].includes(parseInt(i.status_id)),
      onClick: (i) => {
        setSelected((prev) => ({ ...prev, ojt: i }));
        setDialogState((prev) => ({
          ...prev,
          ojt: { ...prev.ojt, edit: true },
        }));
      },
    },
    {
      icon: <DeleteIcon />,
      tooltip: "Delete",
      color: "error",
      disabled: (i) => [57, 58].includes(parseInt(i.status_id)),
      onClick: (i) => handleDelete(i, "ojt"),
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
    {
      icon: <DeleteIcon />,
      tooltip: "Delete",
      color: "error",
      onClick: (i) => handleDelete(i, "placement"),
    },
  ];

  // ===== MAIN RENDER =====
  return (
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      <Typography variant="h5" gutterBottom>
        On-Job Training Management
      </Typography>

      <Tabs
        value={tabValue}
        onChange={(_, v) => {
          setTabValue(v);
          setPage(0);
        }}
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
        {tabValue === 1 && (
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{ height: 36 }}
              >
                <MenuItem value="">All Status</MenuItem>
                {dropdownData.map((s) => (
                  <MenuItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
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
        renderTable("firm", firmColumns, firmActions, filtered.firm)}
      {tabValue === 1 &&
        renderTable("ojt", ojtColumns, ojtActions, filtered.ojt)}
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
            filtered.firm.length,
            filtered.ojt.length,
            filtered.placement.length,
          ][tabValue]
        }
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(+e.target.value);
          setPage(0);
        }}
      />

      {/* Delete Dialog */}
      <Dialog
        open={dialogState.delete.open}
        onClose={() =>
          setDialogState((prev) => ({
            ...prev,
            delete: { ...prev.delete, open: false },
          }))
        }
      >
        <DialogTitle sx={{ color: "error.main" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogState.delete.type === "firm" && (
              <>
                Delete firm "
                <strong>{dialogState.delete.item?.company_name}</strong>"?
              </>
            )}
            {dialogState.delete.type === "ojt" && (
              <>
                Delete OJT agreement "
                <strong>{dialogState.delete.item?.agreement_title}</strong>"?
              </>
            )}
            {dialogState.delete.type === "placement" && (
              <>
                Delete placement for "
                <strong>{dialogState.delete.item?.trainee_name}</strong>"?
              </>
            )}
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDialogState((prev) => ({
                ...prev,
                delete: { ...prev.delete, open: false },
              }))
            }
            size="small"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            size="small"
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Firm Dialogs */}
      {renderDialog(
        "firm",
        selected.firm ? "Edit Firm" : "Add New Firm",
        <FirmForm />,
        getInitialValues("firm", selected.firm),
        firmSchema,
        handleFirmSubmit,
      )}

      {/* OJT Dialogs */}
      {renderDialog(
        "ojt",
        selected.ojt ? "Edit OJT Agreement" : "New OJT Agreement",
        <OjtForm />,
        getInitialValues("ojt", selected.ojt),
        ojtSchema,
        handleOjtSubmit,
        "lg",
      )}

      {/* View OJT Dialog */}
      <Dialog
        open={dialogState.ojt.view}
        onClose={() =>
          setDialogState((prev) => ({
            ...prev,
            ojt: { ...prev.ojt, view: false },
          }))
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>OJT Agreement Details</DialogTitle>
        <DialogContent dividers>
          {selected.ojt && (
            <Grid container spacing={2}>
              {[
                {
                  label: "Agreement Title",
                  value: selected.ojt.agreement_title,
                },
                {
                  label: "Company Name",
                  value: getCompanyName(selected.ojt.company_id),
                },
                { label: "Trainees", value: selected.ojt.total_trainee_no },
                { label: "Supervisor", value: selected.ojt.super_visor_name },
                {
                  label: "Supervisor Contact",
                  value: selected.ojt.supervisor_contact_no,
                },
                {
                  label: "Start Date",
                  value: selected.ojt.start_date
                    ? new Date(selected.ojt.start_date).toLocaleDateString()
                    : "N/A",
                },
                {
                  label: "End Date",
                  value: selected.ojt.end_date
                    ? new Date(selected.ojt.end_date).toLocaleDateString()
                    : "N/A",
                },
                {
                  label: "Status",
                  value: getStatusName(selected.ojt.status_id),
                },
              ].map((f, i) => (
                <Grid key={i} size={{ xs: 12, md: i < 4 ? 6 : 12 }}>
                  <TextField
                    fullWidth
                    label={f.label}
                    value={f.value || "N/A"}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={selected.ojt.description || "N/A"}
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
                ojt: { ...prev.ojt, view: false },
              }))
            }
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Placement Dialogs */}
      <Dialog
        open={dialogState.placement.open}
        onClose={() =>
          setDialogState((prev) => ({ ...prev, placement: { open: false } }))
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selected.placement
            ? "Placement Details"
            : "Record Trainee Placement"}
        </DialogTitle>
        {selected.placement ? (
          <>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {[
                  {
                    label: "Trainee CID",
                    value: selected.placement.trainee_cid,
                  },
                  {
                    label: "Trainee Name",
                    value: selected.placement.trainee_name,
                  },
                  {
                    label: "Agreement",
                    value: getAgreementTitle(selected.placement.agreement_id),
                  },
                  { label: "Position", value: selected.placement.position },
                  {
                    label: "Employment Status",
                    value: getEmploymentStatusName(
                      selected.placement.employment_status_id,
                    ),
                  },
                  {
                    label: "Salary",
                    value: selected.placement.salary || "N/A",
                  },
                ].map((f, i) => (
                  <Grid key={i} size={{ xs: 12, md: i < 4 ? 6 : 12 }}>
                    <TextField
                      fullWidth
                      label={f.label}
                      value={f.value || "N/A"}
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
          </>
        ) : (
          <Formik
            initialValues={getInitialValues("placement")}
            validationSchema={placementSchema}
            onSubmit={handlePlacementSubmit}
            enableReinitialize
          >
            {(formik) => (
              <Form>
                <DialogContent dividers>
                  <PlacementForm formik={formik} />
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() =>
                      setDialogState((prev) => ({
                        ...prev,
                        placement: { open: false },
                      }))
                    }
                    size="small"
                    variant="contained"
                    color="error"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Record Placement"}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        )}
      </Dialog>
    </Paper>
  );
};

export default OnJobTrainingIndex;
