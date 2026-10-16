// src/pages/dwps/ojt/OnCampusJobPlacement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Grid } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EventIcon from "@mui/icons-material/Event";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

import FileUpload from "../../../components/file/FileUpload";
import CommonService from "../../../api/services/internal/common/CommonService";
import CampusPlacementService from "../../../api/services/internal/ojt/CampusPlacementService";
import InstituteRegistrationService from "../../../api/services/internal/registration/InstituteRegistrationService";
import ApplyAccreditedCourseService from "../../../api/services/internal/course/ApplyAccreditedCourseService";

import EntityManager from "./shared/EntityManager";
import FormField from "./shared/FormField";
import StatusChip from "./shared/StatusChip";
import EmploymentStatusChip from "./shared/EmploymentStatusChip";
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
  { label: "Placement Sessions", icon: <EventIcon />, type: "session" },
  { label: "Firms/Companies", icon: <BusinessIcon />, type: "firm" },
  { label: "Trainee Placements", icon: <PersonAddIcon />, type: "placement" },
];

const ENTITY_KEYS = ["session", "firm", "placement"];

// ==================== FORM COMPONENTS ====================
const SessionFormComponent = ({ formik }) => (
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
);
SessionFormComponent.propTypes = formComponentPropTypes;

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
);
FirmFormComponent.propTypes = formComponentPropTypes;

const PlacementFormComponent = ({ formik, context }) => (
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
);
PlacementFormComponent.propTypes = formComponentPropTypes;

// ==================== ENTITY CONFIG ====================
const buildEntityConfigs = () => ({
  session: {
    label: "Session",
    addLabel: "Create Session",
    editLabel: "Edit Session",
    viewTitle: "Session Details",
    emptyMessage: "No sessions found",
    dialogMaxWidth: "lg",
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
    service: {
      submit: CampusPlacementService.submitPlacementSession,
    },
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
    FormComponent: SessionFormComponent,
  },
  firm: {
    label: "Firm",
    addLabel: "Add Firm",
    editLabel: "Edit Firm",
    emptyMessage: "No firms found",
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
    service: {
      submit: CampusPlacementService.submitFirm,
    },
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
          const s = context.sessionData.find((x) => x.id === i.session_id);
          return s ? s.session_name : "N/A";
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
    FormComponent: FirmFormComponent,
  },
  placement: {
    label: "Placement",
    addLabel: "Record Placement",
    editLabel: "Placement Details",
    viewTitle: "Placement Details",
    emptyMessage: "No placements found",
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
    service: {
      submit: CampusPlacementService.submitPlacementTrainee,
    },
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
    FormComponent: PlacementFormComponent,
  },
});

// ==================== MAIN COMPONENT ====================
const OnCampusJobPlacement = () => {
  const [loading, setLoading] = useState(false);

  const apiFetch = useApiFetch();
  const dialog = useDialogState(ENTITY_KEYS);
  const selected = useSelectedItem(ENTITY_KEYS);
  const pagination = usePagination();

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  const [sessionData, setSessionData] = useState([]);
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
    setDzongkhags(data);
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
          fetchSessionData(),
          fetchFirmData(),
          fetchPlacementData(),
          fetchCourses(),
        ]);
      })();
    }
  }, [
    instituteId,
    access_token,
    fetchSessionData,
    fetchFirmData,
    fetchPlacementData,
    fetchCourses,
  ]);

  // ---- delete ----
  const handleDeleteConfirm = useCallback(async () => {
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
  }, [
    dialog,
    access_token,
    fetchSessionData,
    fetchFirmData,
    fetchPlacementData,
  ]);

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
    },
    [instituteId, actionId, access_token],
  );

  // ---- memoized props ----
  const entityConfigs = useMemo(() => buildEntityConfigs(), []);

  const dataMap = useMemo(
    () => ({
      session: sessionData,
      firm: firmData,
      placement: placementData,
    }),
    [sessionData, firmData, placementData],
  );

  const searchFieldsMap = useMemo(
    () => ({
      session: ["session_name", "venue"],
      firm: ["firm_name", "contact_person", "dzongkhag"],
      placement: ["trainee_name", "trainee_cid", "position", "firm_name"],
    }),
    [],
  );

  const contextExtra = useMemo(
    () => ({
      dropdownData,
      employmentStatuses,
      dzongkhags,
      sessionData,
      firmData,
      courses,
      instituteId,
      actionId,
    }),
    [
      dropdownData,
      employmentStatuses,
      dzongkhags,
      sessionData,
      firmData,
      courses,
      instituteId,
      actionId,
    ],
  );

  const refetchMap = useMemo(
    () => ({
      session: fetchSessionData,
      firm: fetchFirmData,
      placement: fetchPlacementData,
    }),
    [fetchSessionData, fetchFirmData, fetchPlacementData],
  );

  return (
    <EntityManager
      title="On-Campus Job Placement Management"
      tabs={TABS}
      entityConfigs={entityConfigs}
      dataMap={dataMap}
      searchFieldsMap={searchFieldsMap}
      loading={loading}
      dialog={dialog}
      selected={selected}
      pagination={pagination}
      contextExtra={contextExtra}
      onDeleteConfirm={handleDeleteConfirm}
      onSubmitForm={submitForm}
      refetchMap={refetchMap}
    />
  );
};

export default OnCampusJobPlacement;
