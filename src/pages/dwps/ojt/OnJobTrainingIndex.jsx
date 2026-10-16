// src/pages/dwps/ojt/OnJobTrainingIndex.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Grid } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import OJTService from "../../../api/services/internal/ojt/OJTService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";

import EntityManager from "./shared/EntityManager";
import FormField from "./shared/FormField";
import StatusChip from "./shared/StatusChip";
import EmploymentStatusChip from "./shared/EmploymentStatusChip";
import DocumentLinks from "./shared/DocumentLinks";
import {
  useApiFetch,
  useDialogState,
  useSelectedItem,
  usePagination,
} from "./shared/hooks";
import {
  fileToBase64,
  getStatusName,
  getEmploymentStatusName,
  getDzongkhagName,
} from "./shared/utils.jsx";
import { formComponentPropTypes } from "./shared/propTypes";
import {
  PARENT_ID_STATUS,
  PARENT_ID_EMPLOYMENT_STATUS,
} from "./shared/constants";

// ==================== TABS ====================
const TABS = [
  { label: "Firms/Companies", icon: <BusinessIcon />, type: "firm" },
  { label: "OJT Agreements", icon: <AssignmentIcon />, type: "ojt" },
  { label: "Trainee Placements", icon: <PersonAddIcon />, type: "placement" },
];

const ENTITY_KEYS = ["firm", "ojt", "placement"];

// ==================== FORM COMPONENTS ====================
const FirmFormComponent = ({ formik, context }) => (
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
);
FirmFormComponent.propTypes = formComponentPropTypes;

const OjtFormComponent = ({ formik, context }) => (
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
);
OjtFormComponent.propTypes = formComponentPropTypes;

const PlacementFormComponent = ({ formik, context }) => (
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
);
PlacementFormComponent.propTypes = formComponentPropTypes;

// ==================== ENTITY CONFIG ====================
const buildEntityConfigs = () => ({
  firm: {
    label: "Firm",
    addLabel: "Add Firm",
    editLabel: "Edit Firm",
    emptyMessage: "No firms found",
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
    payloadFn: (values, context) => ({
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
    }),
    service: {
      submit: (payload, token, isEdit, id) =>
        isEdit
          ? OJTService.updateFirm({ id, ...payload }, token)
          : OJTService.submitOJTCompany(payload, token),
    },
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
    FormComponent: FirmFormComponent,
  },
  ojt: {
    label: "OJT Agreement",
    addLabel: "Add OJT Agreement",
    editLabel: "Edit OJT Agreement",
    viewTitle: "OJT Agreement Details",
    emptyMessage: "No OJT agreements found",
    dialogMaxWidth: "lg",
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
    payloadFn: (values, context) => ({
      companyId: values.firmId,
      agreementTitle: values.agreementTitle,
      agreementDate: values.agreementDate,
      startDate: values.startDate,
      endDate: values.endDate,
      totalTraineeNo: values.numberOfTrainees,
      superVisorName: values.supervisorName,
      supervisorContactNo: values.supervisorContact,
      description: values.description,
      instituteId: context.instituteId || null,
      createdBy: context.actionId,
      statusId: 55,
      serviceId: 26,
      assignedRoleId: 21,
    }),
    service: {
      submit: (payload, token) => OJTService.submitOJTAgrement(payload, token),
    },
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
    FormComponent: OjtFormComponent,
  },
  placement: {
    label: "Placement",
    addLabel: "Record Placement",
    editLabel: "Placement Details",
    viewTitle: "Placement Details",
    emptyMessage: "No placements found",
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
    payloadFn: (values, context) => ({
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
    service: {
      submit: (payload, token) => OJTService.submitOJTTrainee(payload, token),
    },
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
    FormComponent: PlacementFormComponent,
  },
});

// ==================== MAIN COMPONENT ====================
const OnJobTrainingIndex = () => {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const apiFetch = useApiFetch();
  const dialog = useDialogState(ENTITY_KEYS);
  const selected = useSelectedItem(ENTITY_KEYS);
  const pagination = usePagination();

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [ojtData, setOjtData] = useState([]);
  const [firmData, setFirmData] = useState([]);
  const [placementData, setPlacementData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [instituteId, setInstituteId] = useState(null);

  // ---- fetchers ----
  const fetchDropdownData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CommonService.getByParentId,
      [PARENT_ID_STATUS],
      "Failed to load dropdown",
    );
    setDropdownData(data);
  }, [apiFetch]);

  const fetchEmploymentStatuses = useCallback(async () => {
    const data = await apiFetch.fetchData(
      CommonService.getByParentId,
      [PARENT_ID_EMPLOYMENT_STATUS],
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
    const mappedData = data.map((item) => ({
      id: String(item.id || item.dzonkhagId),
      name: item.dzonkhagName || item.name || item.dzonkhag,
      dzonkhagName: item.dzonkhagName || item.name || item.dzonkhag,
      ...item,
    }));
    setDzongkhags(mappedData);
  }, [apiFetch]);

  const fetchInstituteDetails = useCallback(async () => {
    try {
      const response =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      setInstituteId(response.data[0]?.institute_id);
    } catch {
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

  const fetchOjtData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      OJTService.getAgreementByInstituteId,
      [instituteId, access_token],
      "Failed to load OJT agreements",
    );
    setOjtData(data);
  }, [instituteId, access_token, apiFetch]);

  const fetchFirmData = useCallback(async () => {
    const data = await apiFetch.fetchData(
      OJTService.getCompanyByInstituteId,
      [instituteId, access_token],
      "Failed to load firms",
    );
    setFirmData(data);
  }, [instituteId, access_token, apiFetch]);

  const fetchPlacementData = useCallback(async () => {
    if (!instituteId || !access_token) return;
    const data = await apiFetch.fetchData(
      OJTService.getTraineeByInstituteId,
      [instituteId, access_token],
      "Failed to load placements",
    );
    setPlacementData(data);
  }, [instituteId, access_token, apiFetch]);

  // ---- effects ----
  useEffect(() => {
    (async () => {
      await Promise.all([
        fetchDropdownData(),
        fetchInstituteDetails(),
        fetchDzongkhags(),
        fetchEmploymentStatuses(),
      ]);
    })();
  }, [
    fetchDropdownData,
    fetchInstituteDetails,
    fetchDzongkhags,
    fetchEmploymentStatuses,
  ]);

  useEffect(() => {
    if (instituteId && access_token) {
      (async () => {
        await Promise.all([
          fetchFirmData(),
          fetchOjtData(),
          fetchPlacementData(),
          fetchCourses(),
        ]);
      })();
    }
  }, [
    instituteId,
    access_token,
    fetchFirmData,
    fetchOjtData,
    fetchPlacementData,
    fetchCourses,
  ]);

  // ---- helpers ----
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

  const handleDownload = useCallback(async (file) => {
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
    } catch {
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  }, []);

  // ---- delete ----
  const handleDeleteConfirm = useCallback(async () => {
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
  }, [dialog, access_token, fetchFirmData, fetchOjtData, fetchPlacementData]);

  // ---- submit ----
  const submitForm = useCallback(
    async (values, config, isEdit, id) => {
      setLoading(true);
      try {
        const context = { instituteId, actionId };
        const documents = values.files
          ? await Promise.all(values.files.map(fileToBase64))
          : [];
        const payload = config.payloadFn(values, context);
        if (documents.length > 0) payload.documents = documents;
        if (isEdit && id) payload.id = id;

        const serviceFn = config.service.submit;
        const response = await serviceFn(payload, access_token, isEdit, id);

        if (response.status === 200 || response.status === 201) {
          toast.success(
            isEdit ? `${config.label} updated!` : `${config.label} submitted!`,
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
    },
    [instituteId, actionId, access_token],
  );

  // ---- memoized props ----
  const entityConfigs = useMemo(() => buildEntityConfigs(), []);

  const dataMap = useMemo(
    () => ({
      firm: firmData,
      ojt: ojtData,
      placement: placementData,
    }),
    [firmData, ojtData, placementData],
  );

  const searchFieldsMap = useMemo(
    () => ({
      firm: ["company_name", "contact_person_name", "dzongkhag_id"],
      ojt: ["agreement_title", "super_visor_name", "description"],
      placement: ["trainee_name", "trainee_cid", "agreement_id", "position"],
    }),
    [],
  );

  const contextExtra = useMemo(
    () => ({
      dropdownData,
      employmentStatuses,
      dzongkhags,
      firmData,
      ojtData,
      courses,
      downloading,
      handleDownload,
      getCompanyName,
      getAgreementTitle,
      access_token,
      instituteId,
      actionId,
    }),
    [
      dropdownData,
      employmentStatuses,
      dzongkhags,
      firmData,
      ojtData,
      courses,
      downloading,
      handleDownload,
      getCompanyName,
      getAgreementTitle,
      access_token,
      instituteId,
      actionId,
    ],
  );

  const refetchMap = useMemo(
    () => ({
      firm: fetchFirmData,
      ojt: fetchOjtData,
      placement: fetchPlacementData,
    }),
    [fetchFirmData, fetchOjtData, fetchPlacementData],
  );

  const statusFilterMemo = useMemo(
    () => ({
      enabled: true,
      tabIndex: 1,
      value: statusFilter,
      onChange: setStatusFilter,
      options: dropdownData,
    }),
    [statusFilter, dropdownData],
  );

  return (
    <EntityManager
      title="On-Job Training Management"
      tabs={TABS}
      entityConfigs={entityConfigs}
      dataMap={dataMap}
      searchFieldsMap={searchFieldsMap}
      loading={loading}
      dialog={dialog}
      selected={selected}
      pagination={pagination}
      statusFilter={statusFilterMemo}
      contextExtra={contextExtra}
      onDeleteConfirm={handleDeleteConfirm}
      onSubmitForm={submitForm}
      refetchMap={refetchMap}
    />
  );
};

export default OnJobTrainingIndex;
