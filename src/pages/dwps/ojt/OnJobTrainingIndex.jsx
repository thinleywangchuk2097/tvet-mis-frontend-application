// OnJobTrainingIndex.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
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
import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import OJTService from "../../../api/services/internal/ojt/OJTService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": { border: "1px solid", borderColor: "divider" },
};

const TABS = [
  { label: "Firms/Companies", icon: <BusinessIcon />, type: "firm" },
  { label: "OJT Agreements", icon: <AssignmentIcon />, type: "ojt" },
  { label: "Trainee Placements", icon: <PersonAddIcon />, type: "placement" },
];

const STATUS_COLORS = {
  approve: "success",
  complete: "success",
  reject: "error",
  cancel: "error",
  pending: "warning",
  review: "warning",
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

const getDzongkhagName = (id, dzongkhags) => {
  if (!id) return "N/A";
  const found = dzongkhags.find((d) => {
    const dId = d.id || d.dzonkhagId;
    return String(dId) === String(id);
  });
  return found?.dzonkhagName || found?.name || "N/A";
};

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
    ojt: { open: false, edit: false, view: false },
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
    ojt: null,
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

// ==================== PROPTYPES ====================

const statusChipPropTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  dropdownData: PropTypes.array,
};

const employmentStatusChipPropTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  employmentStatuses: PropTypes.array,
};

const documentLinksPropTypes = {
  documents: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  onDownload: PropTypes.func.isRequired,
  downloading: PropTypes.bool,
};

const formFieldPropTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
  select: PropTypes.bool,
  options: PropTypes.array,
  optionLabelKey: PropTypes.string,
};

const reusableTablePropTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      field: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.array.isRequired,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  loading: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      icon: PropTypes.node,
      tooltip: PropTypes.string,
      color: PropTypes.string,
      onClick: PropTypes.func,
      disabled: PropTypes.func,
    }),
  ),
  emptyMessage: PropTypes.string,
};

const deleteConfirmationDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  type: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

const viewDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.any,
      multiline: PropTypes.bool,
      rows: PropTypes.number,
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

const addButtonPropTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

// ==================== REUSABLE COMPONENTS ====================
const StatusChip = ({ id, dropdownData }) => (
  <Chip
    label={getStatusName(id, dropdownData)}
    color={getStatusColor(id, dropdownData)}
    size="small"
  />
);

StatusChip.propTypes = statusChipPropTypes;

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

EmploymentStatusChip.propTypes = employmentStatusChipPropTypes;

const DocumentLinks = ({ documents, onDownload, downloading }) => {
  const docs = getDocumentLinks(documents);
  if (!docs.length) return <span>N/A</span>;
  return docs.map((d, idx) => (
    <div
      key={d.id || idx}
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <Link component="button" variant="body2" onClick={() => onDownload(d)}>
        {d.name}
      </Link>
      <IconButton
        size="small"
        onClick={() => onDownload(d)}
        disabled={downloading}
      >
        <LaunchIcon fontSize="small" />
      </IconButton>
    </div>
  ));
};

DocumentLinks.propTypes = documentLinksPropTypes;

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
  const handleChange = (event) => {
    formik.setFieldValue(name, event.target.value);
  };

  const fieldProps = {
    fullWidth: true,
    select,
    type,
    label: required ? requiredLabel(label) : label,
    name,
    size: "small",
    value: formik.values[name] || "",
    onChange: handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    ...props,
  };

  if (select) {
    return (
      <TextField {...fieldProps}>
        <MenuItem value="">-select-</MenuItem>
        {options.map((opt) => {
          let displayValue =
            opt[optionLabelKey] ||
            opt.name ||
            opt.company_name ||
            opt.agreement_title ||
            opt.course_name ||
            opt.dzonkhagName ||
            opt.dzonkhag ||
            opt.label ||
            opt.id ||
            "Unknown";
          return (
            <MenuItem key={opt.id} value={String(opt.id)}>
              {displayValue}
            </MenuItem>
          );
        })}
      </TextField>
    );
  }

  return <TextField {...fieldProps} />;
};

FormField.propTypes = formFieldPropTypes;

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

ReusableTable.propTypes = reusableTablePropTypes;

const DeleteConfirmationDialog = ({ open, item, type, onClose, onConfirm }) => {
  const messages = {
    firm: `Delete firm "<strong>${item?.company_name}</strong>"?`,
    ojt: `Delete OJT agreement "<strong>${item?.agreement_title}</strong>"?`,
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

DeleteConfirmationDialog.propTypes = deleteConfirmationDialogPropTypes;

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

ViewDialog.propTypes = viewDialogPropTypes;

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

AddButton.propTypes = addButtonPropTypes;

// ==================== ENTITY CONFIGURATIONS ====================
const ENTITY_CONFIGS = {
  firm: {
    label: "Firm",
    addLabel: "Add Firm",
    editLabel: "Edit Firm",
    emptyMessage: "No firms found",
    tabIndex: 0,
    getInitialValues: (item) => ({
      registrationNo: item?.registration_no || "",
      firmName: item?.company_name || "",
      contactPerson: item?.contact_person_name || "",
      contactPhone: item?.contact_person_mobile_no || "",
      contactEmail: item?.contact_person_email || "",
      dzongkhag: item?.dzongkhag_id ? String(item.dzongkhag_id) : "",
      address: item?.address || "",
      description: item?.description || "",
    }),
    schema: Yup.object({
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
    }),
    columns: (context) => [
      { id: "regNo", label: "Registration No", field: "registration_no" },
      { id: "name", label: "Firm Name", field: "company_name" },
      { id: "contact", label: "Contact Person", field: "contact_person_name" },
      { id: "phone", label: "Phone", field: "contact_person_mobile_no" },
      { id: "email", label: "Email", field: "contact_person_email" },
      {
        id: "dzongkhag",
        label: "Dzongkhag",
        render: (i) => getDzongkhagName(i.dzongkhag_id, context.dzongkhags),
      },
      { id: "address", label: "Address", field: "address" },
    ],
    actions: (context) => [
      {
        id: "edit",
        icon: <EditIcon />,
        tooltip: "Edit",
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
    service: {
      submit: (context) => (payload) =>
        context.selected.firm
          ? OJTService.updateFirm(payload, context.access_token)
          : OJTService.submitOJTCompany(payload, context.access_token),
      delete: OJTService.deleteFirm,
    },
    payloadFn: (values, isEdit, context) => ({
      registrationNo: values.registrationNo,
      companyName: values.firmName,
      contactPersonName: values.contactPerson,
      contactPersonMobileNo: values.contactPhone,
      contactPersonEmail: values.contactEmail,
      dzongkhagId: values.dzongkhag,
      address: values.address,
      description: values.description,
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
      ...(isEdit && { id: context.selected.firm?.id }),
    }),
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
  ojt: {
    label: "OJT Agreement",
    addLabel: "Add OJT Agreement",
    editLabel: "Edit OJT Agreement",
    emptyMessage: "No OJT agreements found",
    tabIndex: 1,
    getInitialValues: (item) => ({
      firmId: item?.company_id ? String(item.company_id) : "",
      agreementTitle: item?.agreement_title || "",
      agreementDate: item?.agreement_date || "",
      startDate: item?.start_date || "",
      endDate: item?.end_date || "",
      numberOfTrainees: item?.total_trainee_no || "",
      supervisorName: item?.super_visor_name || "",
      supervisorContact: item?.supervisor_contact_no || "",
      description: item?.description || "",
      files: [],
    }),
    schema: Yup.object({
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
    }),
    columns: (context) => [
      { id: "title", label: "Agreement Title", field: "agreement_title" },
      {
        id: "company",
        label: "Company Name",
        render: (i) => context.getCompanyName(i.company_id),
      },
      { id: "trainees", label: "Trainees", field: "total_trainee_no" },
      { id: "supervisor", label: "Supervisor", field: "super_visor_name" },
      {
        id: "period",
        label: "Period",
        render: (i) =>
          i.start_date && i.end_date
            ? `${new Date(i.start_date).toLocaleDateString()} - ${new Date(i.end_date).toLocaleDateString()}`
            : "N/A",
      },
      {
        id: "documents",
        label: "Documents",
        render: (i) => (
          <DocumentLinks
            documents={i.documents}
            onDownload={context.handleDownload}
            downloading={context.downloading}
          />
        ),
      },
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
          context.selectItem("ojt", i);
          context.openDialog("ojt", { view: true });
        },
      },
      {
        id: "edit",
        icon: <EditIcon />,
        tooltip: "Edit",
        disabled: (i) => [57, 58].includes(parseInt(i.status_id)),
        onClick: (i) => {
          context.selectItem("ojt", i);
          context.openDialog("ojt", { edit: true });
        },
      },
      {
        id: "delete",
        icon: <DeleteIcon />,
        tooltip: "Delete",
        color: "error",
        disabled: (i) => [57, 58].includes(parseInt(i.status_id)),
        onClick: (i) => context.handleDelete(i, "ojt"),
      },
    ],
    service: {
      submit: (context) => (payload) =>
        OJTService.submitOJTAgrement(payload, context.access_token),
      delete: OJTService.deleteOjtAgreement,
    },
    payloadFn: (values, isEdit, context) => ({
      companyId: values.firmId,
      agreementTitle: values.agreementTitle,
      agreementDate: values.agreementDate,
      startDate: values.startDate,
      endDate: values.endDate,
      totalTraineeNo: values.numberOfTrainees,
      superVisorName: values.supervisorName,
      supervisorContactNo: values.supervisorContact,
      description: values.description,
      documents: values.files || [],
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
      statusId: 55,
      serviceId: 26,
      assignedRoleId: 21,
      ...(isEdit && { id: context.selected.ojt?.id }),
    }),
    viewFields: (item, context) => [
      { label: "Agreement Title", value: item.agreement_title },
      { label: "Company Name", value: context.getCompanyName(item.company_id) },
      { label: "Trainees", value: item.total_trainee_no },
      { label: "Supervisor", value: item.super_visor_name },
      { label: "Supervisor Contact", value: item.supervisor_contact_no },
      {
        label: "Start Date",
        value: item.start_date
          ? new Date(item.start_date).toLocaleDateString()
          : "N/A",
      },
      {
        label: "End Date",
        value: item.end_date
          ? new Date(item.end_date).toLocaleDateString()
          : "N/A",
      },
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
    FormComponent: ({ formik, context }) => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="firmId"
            label="Firm/Company"
            select
            options={context.firmData}
            optionLabelKey="company_name"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="agreementTitle"
            label="Agreement Title"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="agreementDate"
            label="Agreement Date"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="startDate"
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="endDate"
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="numberOfTrainees"
            label="Number of Trainees"
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="supervisorName"
            label="Supervisor Name"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="supervisorContact"
            label="Supervisor Contact"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormField
            formik={formik}
            name="description"
            label="Description/Remarks"
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
  placement: {
    label: "Placement",
    addLabel: "Record Placement",
    editLabel: "Placement Details",
    emptyMessage: "No placements found",
    tabIndex: 2,
    getInitialValues: () => ({
      ojtAgreementId: "",
      traineeCid: "",
      traineeName: "",
      courseId: "",
      position: "",
      employmentStatus: "",
      salary: "",
      remarks: "",
    }),
    schema: Yup.object({
      ojtAgreementId: Yup.string().required("Agreement is required"),
      traineeCid: Yup.string().required("CID is required"),
      traineeName: Yup.string().required("Name is required"),
      courseId: Yup.string().required("Course is required"),
      position: Yup.string().required("Position is required"),
      employmentStatus: Yup.string().required("Status is required"),
      salary: Yup.number().min(0, "Salary must be positive"),
      remarks: Yup.string(),
    }),
    columns: (context) => [
      { id: "cid", label: "Trainee CID", field: "trainee_cid" },
      { id: "name", label: "Trainee Name", field: "trainee_name" },
      {
        id: "agreement",
        label: "Agreement",
        render: (i) => context.getAgreementTitle(i.agreement_id),
      },
      { id: "position", label: "Position", field: "position" },
      {
        id: "employmentStatus",
        label: "Employment Status",
        render: (i) => (
          <EmploymentStatusChip
            id={i.employment_status_id}
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
    service: {
      submit: (context) => (payload) =>
        OJTService.submitOJTTrainee(payload, context.access_token),
      delete: OJTService.deletePlacement,
    },
    payloadFn: (values, isEdit, context) => ({
      ojtAgreementId: values.ojtAgreementId,
      traineeCid: values.traineeCid,
      traineeName: values.traineeName,
      courseId: values.courseId,
      position: values.position,
      employmentStatus: values.employmentStatus,
      salary: values.salary,
      remarks: values.remarks,
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
      statusId: 65,
      placementDate: new Date().toISOString().split("T")[0],
      startDate: new Date().toISOString().split("T")[0],
    }),
    viewFields: (item, context) => [
      { label: "Trainee CID", value: item.trainee_cid },
      { label: "Trainee Name", value: item.trainee_name },
      {
        label: "Agreement",
        value: context.getAgreementTitle(item.agreement_id),
      },
      { label: "Position", value: item.position },
      {
        label: "Employment Status",
        value: getEmploymentStatusName(
          item.employment_status_id,
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
    FormComponent: ({ formik, context }) => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            formik={formik}
            name="ojtAgreementId"
            label="OJT Agreement"
            select
            options={context.ojtData.map((o) => ({
              ...o,
              name: o.agreement_title,
            }))}
            optionLabelKey="name"
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
const OnJobTrainingIndex = () => {
  // ===== HOOKS =====
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const apiFetch = useApiFetch();
  const dialog = useDialogState();
  const selected = useSelectedItem();
  const pagination = usePagination();

  // ===== REDUX =====
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // ===== STATE =====
  const [ojtData, setOjtData] = useState([]);
  const [firmData, setFirmData] = useState([]);
  const [placementData, setPlacementData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [instituteId, setInstituteId] = useState(null);

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
  }, []);

  useEffect(() => {
    if (instituteId && access_token) {
      const loadDependent = async () => {
        await Promise.all([
          fetchFirmData(),
          fetchOjtData(),
          fetchPlacementData(),
          fetchCourses(),
        ]);
      };
      loadDependent();
    }
  }, [instituteId, access_token]);

  // ===== DATA FETCHING =====
  const fetchDropdownData = async () => {
    const data = await apiFetch.fetchData(
      CommonService.getByParentId,
      [4],
      "Failed to load dropdown",
    );
    setDropdownData(data);
  };

  const fetchEmploymentStatuses = async () => {
    const data = await apiFetch.fetchData(
      CommonService.getByParentId,
      [17],
      "Failed to load employment statuses",
    );
    setEmploymentStatuses(data);
  };

  const fetchDzongkhags = async () => {
    const data = await apiFetch.fetchData(
      CommonService.getAllDzongkhags,
      [],
      "Failed to load dzongkhags",
    );
    const mappedData = data.map((item) => ({
      id: String(item.id || item.dzonkhagId),
      name: item.dzonkhagName || item.name || item.dzonkhag,
      dzonkhagName: item.dzonkhagName || item.name || item.dzonkhag,
      ...item,
    }));
    setDzongkhags(mappedData);
  };

  const fetchInstituteDetails = async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteId(response.data[0]?.institute_id);
    } catch (error) {
      toast.error("Failed to load institute details");
    }
  };

  const fetchCourses = async () => {
    const data = await apiFetch.fetchData(
      ApplyAccreditedCourseService.getAccreditedCourseByInstituteId,
      [instituteId, access_token],
      "Failed to load courses",
    );
    setCourses(data);
  };

  const fetchOjtData = async () => {
    const data = await apiFetch.fetchData(
      OJTService.getAgreementByInstituteId,
      [instituteId, access_token],
      "Failed to load OJT agreements",
    );
    setOjtData(data);
  };

  const fetchFirmData = async () => {
    const data = await apiFetch.fetchData(
      OJTService.getCompanyByInstituteId,
      [instituteId, access_token],
      "Failed to load firms",
    );
    setFirmData(data);
  };

  const fetchPlacementData = async () => {
    if (!instituteId || !access_token) return;
    const data = await apiFetch.fetchData(
      OJTService.getTraineeByInstituteId,
      [instituteId, access_token],
      "Failed to load placements",
    );
    setPlacementData(data);
  };

  // ===== HELPERS =====
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
    pagination.handleChangePage(null, 0);
  };

  const handleSearchClear = () => {
    setSearch("");
    setStatusFilter("");
  };

  const filterData = useCallback(
    (data, fields) => {
      if (!data) return [];
      let filtered = data;
      if (search) {
        filtered = filtered.filter((item) =>
          fields.some((f) =>
            item[f]?.toString().toLowerCase().includes(search.toLowerCase()),
          ),
        );
      }
      if (statusFilter && tabValue === 1) {
        filtered = filtered.filter(
          (item) => String(item.status_id) === statusFilter,
        );
      }
      return filtered;
    },
    [search, statusFilter, tabValue],
  );

  const filteredData = useMemo(
    () => ({
      firm: filterData(firmData, [
        "company_name",
        "contact_person_name",
        "dzongkhag_id",
      ]),
      ojt: filterData(ojtData, [
        "agreement_title",
        "super_visor_name",
        "description",
      ]),
      placement: filterData(placementData, [
        "trainee_name",
        "trainee_cid",
        "agreement_id",
        "position",
      ]),
    }),
    [firmData, ojtData, placementData, filterData],
  );

  const getCompanyName = useCallback(
    (id) =>
      firmData.find((f) => String(f.id) === String(id))?.company_name || "N/A",
    [firmData],
  );

  const getAgreementTitle = useCallback(
    (id) =>
      ojtData.find((o) => String(o.id) === String(id))?.agreement_title ||
      `ID: ${id}`,
    [ojtData],
  );

  const handleDelete = (item, type) => dialog.openDeleteDialog(item, type);

  const handleDeleteConfirm = async () => {
    const { item, type } = dialog.dialogState.delete;
    const deleteServices = {
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

  // ===== FORM SUBMISSIONS =====
  const submitForm = async (values, config, resetForm, isEdit, entityType) => {
    setLoading(true);
    try {
      const context = {
        selected,
        access_token,
        instituteId,
        actionId,
        firmData,
        ojtData,
        courses,
        employmentStatuses,
        dropdownData,
        dzongkhags,
        downloading,
        handleDownload,
        handleDelete,
        selectItem: selected.selectItem,
        openDialog: dialog.openDialog,
        getCompanyName,
        getAgreementTitle,
      };

      const configData = ENTITY_CONFIGS[entityType];
      const documents = values.files
        ? await Promise.all(values.files.map(fileToBase64))
        : [];
      const payload = configData.payloadFn(values, isEdit, {
        ...context,
        documents,
      });
      const serviceFn = configData.service.submit(context);

      const response = await serviceFn(payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          isEdit
            ? `${configData.label} updated!`
            : `${configData.label} submitted!`,
        );
        await config.refetchFn();
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

  // ===== RENDER HELPERS =====
  const renderTable = (type, data) => {
    const context = {
      selected,
      openDialog: dialog.openDialog,
      handleDelete,
      getCompanyName,
      getAgreementTitle,
      dropdownData,
      employmentStatuses,
      downloading,
      handleDownload,
      access_token,
      instituteId,
      actionId,
      dzongkhags,
      firmData,
      ojtData,
      courses,
    };

    const config = ENTITY_CONFIGS[type];
    const columns =
      typeof config.columns === "function"
        ? config.columns(context)
        : config.columns;
    const actions =
      typeof config.actions === "function"
        ? config.actions(context)
        : config.actions;
    const labels = {
      firm: { add: "Add Firm" },
      ojt: { add: "Add OJT Agreement" },
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
      getCompanyName,
      getAgreementTitle,
      dropdownData,
      employmentStatuses,
      downloading,
      handleDownload,
      access_token,
      instituteId,
      actionId,
      dzongkhags,
      firmData,
      ojtData,
      courses,
    };

    const config = ENTITY_CONFIGS[type];

    // View Dialog
    if (isView && (type === "ojt" || type === "placement")) {
      const fields =
        typeof config.viewFields === "function"
          ? config.viewFields(item, context)
          : [];
      return (
        <ViewDialog
          open={isOpen}
          title={type === "ojt" ? "OJT Agreement Details" : "Placement Details"}
          onClose={() => {
            dialog.closeDialog(type);
            selected.clearSelected(type);
          }}
          fields={fields}
        />
      );
    }

    // Add/Edit Dialog
    const FormComponent = config.FormComponent;
    const title = isEdit ? config.editLabel : config.addLabel;

    return (
      <Dialog
        open={isOpen}
        onClose={() => dialog.closeDialog(type)}
        maxWidth={type === "ojt" ? "lg" : "md"}
        fullWidth
      >
        <DialogTitle>{title}</DialogTitle>
        <Formik
          initialValues={config.getInitialValues(item)}
          validationSchema={config.schema}
          onSubmit={async (values, helpers) => {
            const refetchMap = {
              firm: fetchFirmData,
              ojt: fetchOjtData,
              placement: fetchPlacementData,
            };
            const success = await submitForm(
              values,
              { refetchFn: refetchMap[type] },
              helpers.resetForm,
              isEdit,
              type,
            );
            if (success) {
              dialog.closeDialog(type);
              selected.clearSelected(type);
            }
          }}
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
        On-Job Training Management
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
      {renderDialog("firm")}
      {renderDialog("ojt")}
      {renderDialog("placement")}
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
OnJobTrainingIndex.propTypes = {};

export default OnJobTrainingIndex;
