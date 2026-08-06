// OnCampusJobPlacement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  IconButton,
  Tooltip,
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
import FileUpload from "../../../components/file/FileUpload";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import CampusPlacementService from "../../../api/services/internal/ojt/CampusPlacementService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": { border: "1px solid", borderColor: "divider" },
};

const TABS = [
  { label: "Placement Sessions", icon: <EventIcon />, type: "session" },
  { label: "Firms/Companies", icon: <BusinessIcon />, type: "firm" },
  { label: "Trainee Placements", icon: <PersonAddIcon />, type: "placement" },
];

const STATUS_COLORS = {
  approved: "success",
  complete: "success",
  placed: "success",
  confirmed: "success",
  reject: "error",
  canceled: "error",
  pending: "warning",
  scheduled: "warning",
};

const EMPLOYMENT_COLORS = {
  Employed: "success",
  Unemployed: "error",
  Student: "info",
  Intern: "info",
  Contract: "warning",
  Probation: "secondary",
};

// ==================== UTILITY FUNCTIONS ====================
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

const getStatusName = (id, dropdownData) =>
  dropdownData.find((s) => s.id === parseInt(id))?.name || "Pending";

const getStatusColor = (id, dropdownData) => {
  const name = getStatusName(id, dropdownData)?.toLowerCase() || "";
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (name.includes(key)) return color;
  }
  return "default";
};

const getEmploymentStatusName = (id, employmentStatuses) =>
  employmentStatuses.find((s) => String(s.id) === String(id))?.name ||
  "Not Set";

const getEmploymentStatusColor = (name) => EMPLOYMENT_COLORS[name] || "default";

const getDzongkhagName = (id, dzongkhags) =>
  dzongkhags.find((d) => String(d.id) === String(id))?.dzonkhagName || "N/A";

// ==================== CUSTOM HOOKS ====================
const useApiFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (serviceFn, params, errorMsg) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceFn(...params);
      return response.data || [];
    } catch (err) {
      console.error(errorMsg, err);
      setError(err);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchData };
};

const useDialogState = () => {
  const [dialogState, setDialogState] = useState({
    session: { open: false, edit: false, view: false },
    firm: { open: false, edit: false },
    placement: { open: false },
    delete: { open: false, item: null, type: "" },
  });

  const openDialog = useCallback((type, options = {}) => {
    setDialogState((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...options, open: true },
    }));
  }, []);

  const closeDialog = useCallback((type) => {
    setDialogState((prev) => ({
      ...prev,
      [type]: { ...prev[type], open: false },
    }));
  }, []);

  const openDeleteDialog = useCallback((item, type) => {
    setDialogState((prev) => ({
      ...prev,
      delete: { open: true, item, type },
    }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      delete: { open: false, item: null, type: "" },
    }));
  }, []);

  return {
    dialogState,
    openDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
  };
};

const useSelectedItem = () => {
  const [selected, setSelected] = useState({
    session: null,
    firm: null,
    placement: null,
  });

  const selectItem = useCallback((type, item) => {
    setSelected((prev) => ({ ...prev, [type]: item }));
  }, []);

  const clearSelected = useCallback((type) => {
    setSelected((prev) => ({ ...prev, [type]: null }));
  }, []);

  return { selected, selectItem, clearSelected };
};

const usePagination = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  return {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

// ==================== REUSABLE COMPONENTS ====================
const StatusChip = ({ id, dropdownData }) => (
  <Chip
    label={getStatusName(id, dropdownData)}
    color={getStatusColor(id, dropdownData)}
    size="small"
  />
);

const EmploymentStatusChip = ({ id, employmentStatuses }) => {
  const name = getEmploymentStatusName(id, employmentStatuses);
  return (
    <Chip
      label={name}
      color={id ? getEmploymentStatusColor(name) : "default"}
      size="small"
    />
  );
};

const FormField = ({
  formik,
  name,
  label,
  type = "text",
  required = true,
  select = false,
  options = [],
  optionLabelKey = "name",
  ...props
}) => {
  const fieldProps = {
    fullWidth: true,
    select,
    type,
    label: required ? requiredLabel(label) : label,
    name,
    size: "small",
    value: formik.values[name] || "",
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    ...props,
  };

  if (select) {
    return (
      <TextField {...fieldProps}>
        <MenuItem value="">-select-</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id.toString()}>
            {opt[optionLabelKey] ||
              opt.name ||
              opt.firm_name ||
              opt.session_name ||
              opt.course_name ||
              opt.dzonkhagName}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return <TextField {...fieldProps} />;
};

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
    <Table size="small" sx={TABLE_STYLE}>
      <TableHead>
        <TableRow>
          <TableCell>#</TableCell>
          {columns.map((col) => (
            <TableCell key={col.id}>{col.label}</TableCell>
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
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    {col.render ? col.render(item) : item[col.field] || "N/A"}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    {actions.map((action) => (
                      <Tooltip key={action.id} title={action.tooltip}>
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

const DeleteConfirmationDialog = ({ open, item, type, onClose, onConfirm }) => {
  const messages = {
    session: `Delete session "<strong>${item?.session_name}</strong>"?`,
    firm: `Delete firm "<strong>${item?.firm_name}</strong>"?`,
    placement: `Delete placement for "<strong>${item?.trainee_name}</strong>"?`,
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ color: "error.main" }}>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <span
            dangerouslySetInnerHTML={{
              __html: messages[type] || "Delete this record?",
            }}
          />
          <br />
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small" variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          size="small"
          color="error"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ViewDialog = ({ open, title, fields, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent dividers>
      <Grid container spacing={2}>
        {fields.map((field, i) => (
          <Grid key={i} size={{ xs: 12, md: i < 4 ? 6 : 12 }}>
            <TextField
              fullWidth
              label={field.label}
              value={field.value || "N/A"}
              size="small"
              slotProps={{ input: { readOnly: true } }}
              multiline={field.multiline}
              rows={field.rows || 1}
            />
          </Grid>
        ))}
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

const AddButton = ({ onClick, label }) => (
  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
    <Button
      variant="contained"
      color="primary"
      size="small"
      startIcon={<AddIcon />}
      onClick={onClick}
    >
      {label}
    </Button>
  </Box>
);

// ==================== ENTITY CONFIGURATION ====================
const ENTITY_CONFIG = {
  session: {
    label: "Session",
    addLabel: "Create Session",
    editLabel: "Edit Session",
    emptyMessage: "No sessions found",
    tabIndex: 0,
    statusKey: "status_id",
    getInitialValues: (item) => ({
      sessionName: item?.session_name || "",
      sessionDate: item?.session_date || "",
      sessionTime: item?.session_time || "",
      venue: item?.venue || "",
      description: item?.description || "",
      files: [],
    }),
    schema: Yup.object({
      sessionName: Yup.string().required("Session name is required"),
      sessionDate: Yup.date().required("Session date is required"),
      sessionTime: Yup.string().required("Session time is required"),
      venue: Yup.string().required("Venue is required"),
      description: Yup.string(),
      files: Yup.array(),
    }),
    service: {
      submit: CampusPlacementService.submitPlacementSession,
      delete: CampusPlacementService.deleteSession,
    },
    payloadFn: (values, context) => ({
      sessionName: values.sessionName,
      sessionDate: values.sessionDate,
      sessionTime: values.sessionTime,
      venue: values.venue,
      description: values.description,
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
      statusId: 70,
    }),
    viewFields: (item, context) => [
      { label: "Session Name", value: item.session_name },
      {
        label: "Date",
        value: item.session_date
          ? new Date(item.session_date).toLocaleDateString()
          : "N/A",
      },
      { label: "Time", value: item.session_time },
      { label: "Venue", value: item.venue },
      {
        label: "Status",
        value: getStatusName(item.status_id, context.dropdownData),
      },
      {
        label: "Description",
        value: item.description || "N/A",
        multiline: true,
        rows: 2,
      },
    ],
    columns: (context) => [
      { id: "sessionName", label: "Session Name", field: "session_name" },
      {
        id: "dateTime",
        label: "Date & Time",
        render: (i) =>
          i.session_date && i.session_time
            ? `${new Date(i.session_date).toLocaleDateString()} - ${i.session_time}`
            : "N/A",
      },
      { id: "venue", label: "Venue", field: "venue" },
      {
        id: "status",
        label: "Status",
        render: (i) => (
          <StatusChip id={i.status_id} dropdownData={context.dropdownData} />
        ),
      },
    ],
    actions: (context) => [
      {
        id: "view",
        icon: <LaunchIcon />,
        tooltip: "View",
        color: "info",
        onClick: (i) => {
          context.selectItem("session", i);
          context.openDialog("session", { view: true });
        },
      },
      {
        id: "edit",
        icon: <EditIcon />,
        tooltip: "Edit",
        color: "primary",
        onClick: (i) => {
          context.selectItem("session", i);
          context.openDialog("session", { edit: true });
        },
      },
      {
        id: "delete",
        icon: <DeleteIcon />,
        tooltip: "Delete",
        color: "error",
        onClick: (i) => context.handleDelete(i, "session"),
      },
    ],
    FormComponent: ({ formik, context }) => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField formik={formik} name="sessionName" label="Session Name" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="sessionDate"
            label="Session Date"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="sessionTime"
            label="Session Time"
            type="time"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField formik={formik} name="venue" label="Venue" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormField
            formik={formik}
            name="description"
            label="Description"
            multiline
            rows={3}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FileUpload
            files={formik.values.files}
            onFilesChange={(f) => formik.setFieldValue("files", f)}
          />
        </Grid>
      </Grid>
    ),
  },
  firm: {
    label: "Firm",
    addLabel: "Add Firm",
    editLabel: "Edit Firm",
    emptyMessage: "No firms found",
    tabIndex: 1,
    statusKey: null,
    getInitialValues: (item) => ({
      registrationNo: item?.registration_no || "",
      firmName: item?.firm_name || "",
      contactPerson: item?.contact_person || "",
      contactPhone: item?.contact_phone || "",
      contactEmail: item?.contact_email || "",
      dzongkhag: item?.dzongkhag_id || "",
      address: item?.address || "",
      description: item?.description || "",
      placementSession: item?.session_id || "",
    }),
    schema: Yup.object({
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
      placementSession: Yup.string().required("Placement session is required"),
    }),
    service: {
      submit: CampusPlacementService.submitFirm,
      delete: CampusPlacementService.deleteFirm,
    },
    payloadFn: (values, context) => ({
      registrationNo: values.registrationNo,
      firmName: values.firmName,
      contactPerson: values.contactPerson,
      contactPhone: values.contactPhone,
      contactEmail: values.contactEmail,
      dzongkhagId: values.dzongkhag,
      address: values.address,
      description: values.description,
      sessionId: values.placementSession,
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
    }),
    columns: (context) => [
      { id: "regNo", label: "Registration No", field: "registration_no" },
      { id: "firmName", label: "Firm Name", field: "firm_name" },
      { id: "contactPerson", label: "Contact Person", field: "contact_person" },
      { id: "phone", label: "Phone", field: "contact_phone" },
      { id: "email", label: "Email", field: "contact_email" },
      {
        id: "dzongkhag",
        label: "Dzongkhag",
        render: (i) => getDzongkhagName(i.dzongkhag_id, context.dzongkhags),
      },
      { id: "address", label: "Address", field: "address" },
      {
        id: "session",
        label: "Placement Session",
        render: (i) => {
          const session = context.sessionData.find(
            (s) => s.id === i.session_id,
          );
          return session ? session.session_name : "N/A";
        },
      },
    ],
    actions: (context) => [
      {
        id: "edit",
        icon: <EditIcon />,
        tooltip: "Edit",
        color: "primary",
        onClick: (i) => {
          context.selectItem("firm", i);
          context.openDialog("firm", { edit: true });
        },
      },
      {
        id: "delete",
        icon: <DeleteIcon />,
        tooltip: "Delete",
        color: "error",
        onClick: (i) => context.handleDelete(i, "firm"),
      },
    ],
    FormComponent: ({ formik, context }) => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="registrationNo"
            label="Registration No"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField formik={formik} name="firmName" label="Firm Name" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="contactPerson"
            label="Contact Person Name"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="contactPhone"
            label="Contact Person Mobile No"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="contactEmail"
            label="Contact Person Email"
            type="email"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="dzongkhag"
            label="Location Dzongkhag"
            select
            options={context.dzongkhags}
            optionLabelKey="dzonkhagName"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="placementSession"
            label="Placement Session"
            select
            options={context.sessionData}
            optionLabelKey="session_name"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormField
            formik={formik}
            name="address"
            label="Address"
            multiline
            rows={2}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormField
            formik={formik}
            name="description"
            label="Description"
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    ),
  },
  placement: {
    label: "Placement",
    addLabel: "Record Placement",
    editLabel: "Placement Details",
    emptyMessage: "No placements found",
    tabIndex: 2,
    statusKey: "employment_status",
    getInitialValues: () => ({
      firmId: "",
      traineeCid: "",
      traineeName: "",
      courseId: "",
      position: "",
      employmentStatus: "",
      salary: "",
      remarks: "",
    }),
    schema: Yup.object({
      firmId: Yup.string().required("Company is required"),
      traineeCid: Yup.string().required("Trainee CID is required"),
      traineeName: Yup.string().required("Trainee Name is required"),
      courseId: Yup.string().required("Course is required"),
      position: Yup.string().required("Position is required"),
      employmentStatus: Yup.string().required("Employment status is required"),
      salary: Yup.number().min(0, "Salary must be positive"),
      remarks: Yup.string(),
    }),
    service: {
      submit: CampusPlacementService.submitPlacementTrainee,
      delete: CampusPlacementService.deletePlacement,
    },
    payloadFn: (values, context) => ({
      firmId: values.firmId,
      traineeCid: values.traineeCid,
      traineeName: values.traineeName,
      courseId: values.courseId,
      position: values.position,
      employmentStatus: values.employmentStatus,
      salary: values.salary,
      remarks: values.remarks,
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
      statusId: 72,
      placementDate: new Date().toISOString().split("T")[0],
      startDate: new Date().toISOString().split("T")[0],
    }),
    viewFields: (item, context) => [
      { label: "Trainee CID", value: item.trainee_cid },
      { label: "Trainee Name", value: item.trainee_name },
      { label: "Company", value: item.firm_name },
      { label: "Position", value: item.position },
      {
        label: "Employment Status",
        value: getEmploymentStatusName(
          item.employment_status,
          context.employmentStatuses,
        ),
      },
      { label: "Salary", value: item.salary || "N/A" },
      {
        label: "Remarks",
        value: item.remarks || "N/A",
        multiline: true,
        rows: 2,
      },
    ],
    columns: (context) => [
      { id: "cid", label: "Trainee CID", field: "trainee_cid" },
      { id: "name", label: "Trainee Name", field: "trainee_name" },
      { id: "company", label: "Company", field: "firm_name" },
      { id: "position", label: "Position", field: "position" },
      {
        id: "employmentStatus",
        label: "Employment Status",
        render: (i) => (
          <EmploymentStatusChip
            id={i.employment_status}
            employmentStatuses={context.employmentStatuses}
          />
        ),
      },
      { id: "salary", label: "Salary", field: "salary" },
    ],
    actions: (context) => [
      {
        id: "view",
        icon: <LaunchIcon />,
        tooltip: "View",
        color: "info",
        onClick: (i) => {
          context.selectItem("placement", i);
          context.openDialog("placement", { open: true });
        },
      },
      {
        id: "delete",
        icon: <DeleteIcon />,
        tooltip: "Delete",
        color: "error",
        onClick: (i) => context.handleDelete(i, "placement"),
      },
    ],
    FormComponent: ({ formik, context }) => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="firmId"
            label="Company"
            select
            options={context.firmData}
            optionLabelKey="firm_name"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="traineeCid"
            label="Trainee CID"
            placeholder="e.g., 1234567890123"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField formik={formik} name="traineeName" label="Trainee Name" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="courseId"
            label="Course"
            select
            options={context.courses}
            optionLabelKey="course_name"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField formik={formik} name="position" label="Position" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="employmentStatus"
            label="Employment Status"
            select
            options={context.employmentStatuses}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="salary"
            label="Salary (if applicable)"
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormField
            formik={formik}
            name="remarks"
            label="Remarks"
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    ),
  },
};

// ==================== MAIN COMPONENT ====================
const OnCampusJobPlacement = () => {
  // ===== HOOKS =====
  const [search, setSearch] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const apiFetch = useApiFetch();
  const dialog = useDialogState();
  const selected = useSelectedItem();
  const pagination = usePagination();

  // ===== REDUX =====
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // ===== STATE =====
  const [sessionData, setSessionData] = useState([]);
  const [firmData, setFirmData] = useState([]);
  const [placementData, setPlacementData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [instituteId, setInstituteId] = useState(null);

  // ===== DATA FETCHING =====
  const fetchDropdownData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CommonService.getByParentId,
      [4],
      "Failed to load dropdown",
    );
    setDropdownData(data);
  }, [apiFetch]);

  const fetchEmploymentStatuses = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CommonService.getByParentId,
      [17],
      "Failed to load employment statuses",
    );
    setEmploymentStatuses(data);
  }, [apiFetch]);

  const fetchDzongkhags = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CommonService.getAllDzongkhags,
      [],
      "Failed to load dzongkhags",
    );
    setDzongkhags(data);
  }, [apiFetch]);

  const fetchInstituteDetails = useCallback(async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteId(response.data[0]?.institute_id);
    } catch (error) {
      toast.error("Failed to load institute details");
    }
  }, [registration_no]);

  const fetchCourses = useCallback(async () => {
    const data = await apiFetch.fetchData(
      ApplyAccreditedCourseService.getAccreditedCourseByInstituteId,
      [instituteId, access_token],
      "Failed to load courses",
    );
    setCourses(data);
  }, [instituteId, access_token, apiFetch]);

  const fetchSessionData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CampusPlacementService.getPlacementSessionByInstituteId,
      [instituteId, access_token],
      "Failed to load sessions",
    );
    setSessionData(data);
  }, [instituteId, access_token, apiFetch]);

  const fetchFirmData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CampusPlacementService.getFirmByInstituteId,
      [instituteId, access_token],
      "Failed to load firms",
    );
    setFirmData(data);
  }, [instituteId, access_token, apiFetch]);

  const fetchPlacementData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CampusPlacementService.getTraineeByInstituteId,
      [instituteId, access_token],
      "Failed to load placements",
    );
    setPlacementData(data);
  }, [instituteId, access_token, apiFetch]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchSessionData(),
      fetchFirmData(),
      fetchPlacementData(),
      fetchCourses(),
    ]);
  }, [fetchSessionData, fetchFirmData, fetchPlacementData, fetchCourses]);

  // ===== EFFECTS =====
  useEffect(() => {
    const loadIndependent = async () => {
      await Promise.all([
        fetchDropdownData(),
        fetchInstituteDetails(),
        fetchDzongkhags(),
        fetchEmploymentStatuses(),
      ]);
    };
    loadIndependent();
  }, [
    fetchDropdownData,
    fetchInstituteDetails,
    fetchDzongkhags,
    fetchEmploymentStatuses,
  ]);

  useEffect(() => {
    if (instituteId && access_token) {
      fetchAllData();
    }
  }, [instituteId, access_token, fetchAllData]);

  // ===== HELPERS =====
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
    pagination.handleChangePage(null, 0);
  };

  const handleSearchClear = () => setSearch("");

  const filterData = useCallback(
    (data, fields) => {
      if (!data || !search) return data;
      return data.filter((item) =>
        fields.some((f) =>
          item[f]?.toString().toLowerCase().includes(search.toLowerCase()),
        ),
      );
    },
    [search],
  );

  const filteredData = useMemo(
    () => ({
      session: filterData(sessionData, ["session_name", "venue"]),
      firm: filterData(firmData, ["firm_name", "contact_person", "dzongkhag"]),
      placement: filterData(placementData, [
        "trainee_name",
        "trainee_cid",
        "position",
        "firm_name",
      ]),
    }),
    [sessionData, firmData, placementData, filterData],
  );

  // ===== CRUD OPERATIONS =====
  const handleDelete = (item, type) => dialog.openDeleteDialog(item, type);

  const handleDeleteConfirm = async () => {
    const { item, type } = dialog.dialogState.delete;
    const deleteServices = {
      session: {
        fn: CampusPlacementService.deleteSession,
        refetch: fetchSessionData,
        msg: `Session "${item.session_name}" deleted`,
      },
      firm: {
        fn: CampusPlacementService.deleteFirm,
        refetch: fetchFirmData,
        msg: `Firm "${item.firm_name}" deleted`,
      },
      placement: {
        fn: CampusPlacementService.deletePlacement,
        refetch: fetchPlacementData,
        msg: `Placement for "${item.trainee_name}" deleted`,
      },
    };

    const service = deleteServices[type];
    if (!service) return;

    try {
      await service.fn(item.id, access_token);
      toast.success(service.msg);
      await service.refetch();
      dialog.closeDeleteDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  // ===== FORM SUBMISSIONS =====
  const submitForm = async (values, config, isEdit = false, id = null) => {
    setLoading(true);
    try {
      const context = { instituteId, actionId };
      const documents = values.files
        ? await Promise.all(values.files.map(fileToBase64))
        : [];
      const payload = config.payloadFn(values, context);
      if (documents.length > 0) payload.documents = documents;

      const serviceFn = config.service.submit;
      const response = isEdit
        ? await serviceFn({ id, ...payload }, access_token)
        : await serviceFn(payload, access_token);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          isEdit ? `${config.label} updated!` : `${config.label} created!`,
        );
        await config.refetchFn();
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
    return false;
  };

  // ===== RENDER HELPERS =====
  const renderTable = (type, data) => {
    const context = {
      selected,
      openDialog: dialog.openDialog,
      handleDelete,
      selectItem: selected.selectItem,
      dropdownData,
      employmentStatuses,
      dzongkhags,
      sessionData,
      firmData,
      courses,
    };

    const config = ENTITY_CONFIG[type];
    const columns =
      typeof config.columns === "function"
        ? config.columns(context)
        : config.columns;
    const actions =
      typeof config.actions === "function"
        ? config.actions(context)
        : config.actions;
    const labels = {
      session: { add: "Create Session" },
      firm: { add: "Add Firm" },
      placement: { add: "Record Placement" },
    };

    return (
      <>
        <AddButton
          onClick={() => {
            selected.clearSelected(type);
            dialog.openDialog(type, { open: true });
          }}
          label={labels[type].add}
        />
        <ReusableTable
          columns={columns}
          data={data}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          loading={loading}
          actions={actions}
          emptyMessage={config.emptyMessage}
        />
      </>
    );
  };

  const renderDialog = (type) => {
    const isEdit = dialog.dialogState[type]?.edit;
    const isView = dialog.dialogState[type]?.view;
    const isOpen = dialog.dialogState[type]?.open || isEdit || isView;
    const item = selected.selected[type];

    const context = {
      selected,
      openDialog: dialog.openDialog,
      handleDelete,
      selectItem: selected.selectItem,
      dropdownData,
      employmentStatuses,
      dzongkhags,
      sessionData,
      firmData,
      courses,
      instituteId,
      actionId,
    };

    const config = ENTITY_CONFIG[type];
    const FormComponent = config.FormComponent;

    // View Dialog
    if (isView && (type === "session" || type === "placement")) {
      const fields =
        typeof config.viewFields === "function"
          ? config.viewFields(item, context)
          : [];
      return (
        <ViewDialog
          open={isOpen}
          title={type === "session" ? "Session Details" : "Placement Details"}
          onClose={() => {
            dialog.closeDialog(type);
            selected.clearSelected(type);
          }}
          fields={fields}
        />
      );
    }

    // Add/Edit Dialog
    const title = isEdit ? config.editLabel : config.addLabel;

    const handleSubmit = async (values, helpers) => {
      const refetchMap = {
        session: fetchSessionData,
        firm: fetchFirmData,
        placement: fetchPlacementData,
      };
      const configWithRefetch = { ...config, refetchFn: refetchMap[type] };
      const success = await submitForm(
        values,
        configWithRefetch,
        isEdit,
        item?.id,
      );
      if (success) {
        dialog.closeDialog(type);
        selected.clearSelected(type);
        helpers.resetForm();
      }
    };

    return (
      <Dialog
        open={isOpen}
        onClose={() => dialog.closeDialog(type)}
        maxWidth={type === "session" ? "lg" : "md"}
        fullWidth
      >
        <DialogTitle>{title}</DialogTitle>
        <Formik
          initialValues={config.getInitialValues(item)}
          validationSchema={config.schema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Form>
              <DialogContent dividers>
                <FormComponent formik={formik} context={context} />
              </DialogContent>
              <DialogActions>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => dialog.closeDialog(type)}
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
                  {loading ? "Saving..." : isEdit ? "Update" : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    );
  };

  // ===== MAIN RENDER =====
  const currentType = TABS[tabValue].type;
  const currentData = filteredData[currentType];

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
        {TABS.map((tab, i) => (
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
            onClick={handleSearchClear}
            sx={{ height: 36, width: "100%" }}
          >
            Clear
          </Button>
        </Grid>
      </Grid>

      {renderTable(currentType, currentData)}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={currentData.length}
        rowsPerPage={pagination.rowsPerPage}
        page={pagination.page}
        onPageChange={pagination.handleChangePage}
        onRowsPerPageChange={pagination.handleChangeRowsPerPage}
      />

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        open={dialog.dialogState.delete.open}
        item={dialog.dialogState.delete.item}
        type={dialog.dialogState.delete.type}
        onClose={dialog.closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />

      {/* Entity Dialogs */}
      {renderDialog("session")}
      {renderDialog("firm")}
      {!selected.selected.placement && renderDialog("placement")}
    </Paper>
  );
};

export default OnCampusJobPlacement;
