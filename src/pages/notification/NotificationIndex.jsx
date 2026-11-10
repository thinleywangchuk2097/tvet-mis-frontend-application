import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  CircularProgress,
  Link,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  CheckBoxOutlineBlank,
  CheckBox as CheckBoxIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import IosShareIcon from "@mui/icons-material/IosShare";
import NotificationService from "../../api/services/internal/notification/NotificationService";
import UserRoleManagementService from "../../api/services/internal/userrole/UserRoleManagementService";

// messages longer than this are cut with a "View more" link
const PREVIEW_LENGTH = 120;

const isFailed = (res) =>
  !res || res instanceof Error || res?.isAxiosError === true;
const errorMessage = (res, fallback) =>
  res?.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// notificationType: null = not sent, 0 = public, 1 = registered users
// notificationType: 0 = public, 1 = selective users, 2 = all registered users
const NOTIFY_PUBLIC = 0;
const NOTIFY_REGISTERED = 1; // selective users (by username / role)
const NOTIFY_ALL_REGISTERED = 2;

const userLabel = (u) => {
  const name = [u.first_name, u.middle_name, u.last_name]
    .filter((x) => x && String(x).trim())
    .join(" ");
  return name ? `${name} (${u.user_id})` : String(u.user_id || "");
};

// today as yyyy-MM-dd (local time)
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const splitIds = (value) =>
  String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const schema = Yup.object({
  title: Yup.string().trim().required("Title is required").max(255),
  textMessage: Yup.string().trim().required("Message is required"),
});

const headCell = {
  border: "1px solid #ccc",
  fontWeight: "bold",
  fontSize: "0.78rem",
  padding: "6px 8px",
};
const cell = { border: "1px solid #ccc", fontSize: "0.78rem", padding: "4px 8px" };

const NotificationIndex = () => {
  const token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expanded, setExpanded] = useState({}); // id -> true when "View more" is open

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Send dialog
  const [sendTarget, setSendTarget] = useState(null); // notification being sent
  const [sendType, setSendType] = useState(String(NOTIFY_PUBLIC));
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  // duration: shown until the end of this day (yyyy-MM-dd)
  const [expiryDate, setExpiryDate] = useState("");
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await NotificationService.getAllNotifications(token);
    setLoading(false);
    if (isFailed(res)) {
      toast.error(errorMessage(res, "Failed to load notifications"));
      return;
    }
    setNotifications(Array.isArray(res.data) ? res.data : []);
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // users and roles for the "Selective User" send options
  useEffect(() => {
    (async () => {
      const [userRes, roleRes] = await Promise.all([
        UserRoleManagementService.getAllUsers(token),
        UserRoleManagementService.getRoles(token),
      ]);
      if (!isFailed(userRes))
        setUsers(Array.isArray(userRes.data) ? userRes.data : []);
      if (!isFailed(roleRes))
        setRoles(Array.isArray(roleRes.data) ? roleRes.data : []);
    })();
  }, [token]);

  const openSend = (n) => {
    setSendTarget(n);
    const type =
      n.notificationType === null || n.notificationType === undefined
        ? NOTIFY_PUBLIC
        : n.notificationType;
    setSendType(String(type));
    // re-sending: start from the current recipients
    const uIds = splitIds(n.userId);
    const rIds = splitIds(n.roleId);
    setSelectedUsers(users.filter((u) => uIds.includes(String(u.user_id))));
    setSelectedRoles(roles.filter((r) => rIds.includes(String(r.id))));
    setExpiryDate(n.expiryDate ? String(n.expiryDate).slice(0, 10) : "");
  };

  const handleSend = async () => {
    const type = Number(sendType);
    if (
      type === NOTIFY_REGISTERED &&
      selectedUsers.length === 0 &&
      selectedRoles.length === 0
    ) {
      toast.warning("Select at least one user or role");
      return;
    }
    if (!expiryDate) {
      toast.warning("Select the Show Until date");
      return;
    }
    if (expiryDate < todayStr()) {
      toast.warning("Show Until date cannot be in the past");
      return;
    }
    setSending(true);
    const res = await NotificationService.sendNotification(
      {
        id: sendTarget.id,
        notificationType: type,
        userIds:
          type === NOTIFY_REGISTERED
            ? selectedUsers.map((u) => String(u.user_id))
            : [],
        roleIds:
          type === NOTIFY_REGISTERED
            ? selectedRoles.map((r) => Number(r.id))
            : [],
        expiryDate,
        updatedBy: actionId,
      },
      token,
    );
    setSending(false);
    if (isFailed(res)) {
      toast.error(errorMessage(res, "Failed to send notification"));
      return;
    }
    toast.success(res.data?.message || "Notification sent");
    setSendTarget(null);
    fetchNotifications();
  };

  // once sent, the type is fixed (only the same type can be sent again)
  const sentType = sendTarget?.notificationType ?? null;
  const isLocked = sentType !== null && sentType !== undefined;

  // "Sent To" column text
  // "Till 12 Nov 2026" or "Expired 12 Nov 2026" under the type
  const durationLine = (n) => {
    if (!n.expiryDate) return null;
    const day = String(n.expiryDate).slice(0, 10);
    const expired = day < todayStr();
    const label = new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return (
      <Typography
        sx={{ fontSize: "0.72rem", mt: 0.25, fontWeight: expired ? 600 : 400 }}
        color={expired ? "error.main" : "text.secondary"}
      >
        {expired ? `Expired ${label}` : `Till ${label}`}
      </Typography>
    );
  };

  const sentTo = (n) => (
    <>
      {sentToType(n)}
      {n.notificationType !== null &&
        n.notificationType !== undefined &&
        durationLine(n)}
    </>
  );

  const sentToType = (n) => {
    if (n.notificationType === NOTIFY_PUBLIC)
      return <Chip label="Public" size="small" color="success" sx={{ height: 20, fontSize: "0.68rem" }} />;
    if (n.notificationType === NOTIFY_REGISTERED) {
      const uIds = splitIds(n.userId);
      const rIds = splitIds(n.roleId);
      const roleNames = rIds.map(
        (id) => roles.find((r) => String(r.id) === id)?.role_name || `Role ${id}`,
      );
      return (
        <>
          <Chip label="Selective" size="small" color="primary" sx={{ height: 20, fontSize: "0.68rem" }} />
          <Typography sx={{ fontSize: "0.72rem", mt: 0.25 }} color="text.secondary">
            {[
              uIds.length ? `${uIds.length} user(s)` : null,
              roleNames.length ? roleNames.join(", ") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        </>
      );
    }
    if (n.notificationType === NOTIFY_ALL_REGISTERED)
      return <Chip label="All Registered" size="small" color="secondary" sx={{ height: 20, fontSize: "0.68rem" }} />;
    return <Chip label="Not sent" size="small" sx={{ height: 20, fontSize: "0.68rem" }} />;
  };

  const formik = useFormik({
    initialValues: { title: "", textMessage: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      setSaving(true);
      const payload = {
        title: values.title.trim(),
        textMessage: values.textMessage.trim(),
      };
      const res = editing
        ? await NotificationService.updateNotification(
            { ...payload, id: editing.id, updatedBy: actionId },
            token,
          )
        : await NotificationService.createNotification(
            { ...payload, createdBy: actionId },
            token,
          );
      setSaving(false);
      if (isFailed(res)) {
        toast.error(errorMessage(res, "Failed to save notification"));
        return;
      }
      toast.success(res.data?.message || "Notification saved");
      setOpen(false);
      fetchNotifications();
    },
  });

  const handleAdd = () => {
    setEditing(null);
    formik.resetForm({ values: { title: "", textMessage: "" } });
    setOpen(true);
  };

  const handleEdit = (n) => {
    setEditing(n);
    formik.resetForm({
      values: { title: n.title || "", textMessage: n.textMessage || "" },
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    const res = await NotificationService.deleteNotification(deleteId, token);
    setDeleteId(null);
    if (isFailed(res)) {
      toast.error(errorMessage(res, "Failed to delete notification"));
      return;
    }
    toast.success(res.data?.message || "Notification deleted");
    fetchNotifications();
  };

  const q = search.trim().toLowerCase();
  const filtered = notifications.filter(
    (n) =>
      !q ||
      (n.title || "").toLowerCase().includes(q) ||
      (n.textMessage || "").toLowerCase().includes(q),
  );

  const renderMessage = (n) => {
    const text = n.textMessage || "";
    if (text.length <= PREVIEW_LENGTH) return text;
    const isOpen = expanded[n.id];
    return (
      <>
        <span style={{ whiteSpace: "pre-line" }}>
          {isOpen ? text : `${text.slice(0, PREVIEW_LENGTH)}…`}
        </span>{" "}
        <Link
          component="button"
          type="button"
          underline="hover"
          sx={{ fontSize: "0.75rem", fontWeight: 600 }}
          onClick={() => setExpanded((p) => ({ ...p, [n.id]: !p[n.id] }))}
        >
          {isOpen ? "View less" : "View more"}
        </Link>
      </>
    );
  };

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Typography variant="h6" component="h1">
          Notifications
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            placeholder="Search title or message..."
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 260, "& input": { fontSize: "0.85rem" } }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Notification
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow sx={{ "& .MuiTableCell-root": { textAlign: "center" } }}>
              <TableCell sx={{ ...headCell, width: 50 }}>#</TableCell>
              <TableCell sx={{ ...headCell, width: "22%" }}>Title</TableCell>
              <TableCell sx={headCell}>Message</TableCell>
              <TableCell sx={{ ...headCell, width: 160 }}>Sent To</TableCell>
              <TableCell sx={{ ...headCell, width: 150 }}>Created At</TableCell>
              <TableCell sx={{ ...headCell, width: 130 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((n, index) => (
                  <TableRow key={n.id} hover>
                    <TableCell sx={{ ...cell, textAlign: "center" }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ ...cell, fontWeight: 600 }}>
                      {n.title}
                    </TableCell>
                    <TableCell sx={cell}>{renderMessage(n)}</TableCell>
                    <TableCell sx={cell}>{sentTo(n)}</TableCell>
                    <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>
                      {formatDate(n.updatedAt || n.createdAt)}
                    </TableCell>
                    <TableCell sx={{ ...cell, textAlign: "center" }}>
                      <Tooltip title="Send">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openSend(n)}
                        >
                          <IosShareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(n)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(n.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {search
                      ? "No notifications match your search."
                      : "No notifications yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            "& .MuiToolbar-root": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "0.78rem" },
          }}
        />
      </TableContainer>

      {/* Add / Edit */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle sx={{ pr: 6 }}>
            {editing ? "Edit Notification" : "Add Notification"}
            <IconButton
              sx={{ position: "absolute", right: 8, top: 8 }}
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Title"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
              <TextField
                fullWidth
                size="small"
                label="Message"
                name="textMessage"
                multiline
                minRows={5}
                value={formik.values.textMessage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.textMessage &&
                  Boolean(formik.errors.textMessage)
                }
                helperText={
                  (formik.touched.textMessage && formik.errors.textMessage) ||
                  `${formik.values.textMessage.length} characters`
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              {editing ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Send */}
      <Dialog
        open={Boolean(sendTarget)}
        onClose={() => setSendTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6 }}>
          Send Notification
          <IconButton
            sx={{ position: "absolute", right: 8, top: 8 }}
            onClick={() => setSendTarget(null)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
            {sendTarget?.title}
          </Typography>
          {isLocked && (
            <Typography sx={{ mt: 1, fontSize: "0.78rem" }} color="warning.main">
              Already sent. It can only be sent again to the same type.
            </Typography>
          )}
          <FormControl sx={{ mt: 2 }}>
            <FormLabel sx={{ fontSize: "0.85rem" }}>Send to</FormLabel>
            <RadioGroup
              row
              value={sendType}
              onChange={(e) => setSendType(e.target.value)}
            >
              <FormControlLabel
                value={String(NOTIFY_PUBLIC)}
                control={<Radio size="small" />}
                disabled={isLocked && sentType !== NOTIFY_PUBLIC}
                label="Public"
              />
              <FormControlLabel
                value={String(NOTIFY_REGISTERED)}
                control={<Radio size="small" />}
                disabled={isLocked && sentType !== NOTIFY_REGISTERED}
                label="Selective User"
              />
              <FormControlLabel
                value={String(NOTIFY_ALL_REGISTERED)}
                control={<Radio size="small" />}
                disabled={isLocked && sentType !== NOTIFY_ALL_REGISTERED}
                label="All Registered User"
              />
            </RadioGroup>
          </FormControl>

          {sendType === String(NOTIFY_PUBLIC) ? (
            <Typography sx={{ mt: 1, fontSize: "0.8rem" }} color="text.secondary">
              It will be shown on the public page.
            </Typography>
          ) : null}

          {/* duration: hidden from users after this day */}
          <TextField
            type="date"
            size="small"
            label="Show Until"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            sx={{ mt: 2, width: 220 }}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: todayStr() },
            }}
            helperText="It stops showing after this day"
          />

          {sendType === String(NOTIFY_PUBLIC) ? null : sendType === String(NOTIFY_ALL_REGISTERED) ? (
            <Typography sx={{ mt: 1, fontSize: "0.8rem" }} color="text.secondary">
              Every registered user will see it under the notification bell.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1.5 }}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                size="small"
                options={users}
                value={selectedUsers}
                onChange={(e, v) => setSelectedUsers(v)}
                getOptionLabel={userLabel}
                isOptionEqualToValue={(o, v) => String(o.user_id) === String(v.user_id)}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Checkbox
                        size="small"
                        icon={<CheckBoxOutlineBlank fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        checked={selected}
                        sx={{ mr: 1, p: 0.5 }}
                      />
                      {userLabel(option)}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="By Username"
                    placeholder="Search users..."
                  />
                )}
              />
              <Autocomplete
                multiple
                disableCloseOnSelect
                size="small"
                options={roles}
                value={selectedRoles}
                onChange={(e, v) => setSelectedRoles(v)}
                getOptionLabel={(r) => r.role_name || `Role ${r.id}`}
                isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Checkbox
                        size="small"
                        icon={<CheckBoxOutlineBlank fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        checked={selected}
                        sx={{ mr: 1, p: 0.5 }}
                      />
                      {option.role_name || `Role ${option.id}`}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="By Role"
                    placeholder="Search roles..."
                  />
                )}
              />
              <Typography sx={{ fontSize: "0.75rem" }} color="text.secondary">
                Pick users, roles, or both. Everyone selected, and every user
                with a selected role, will see it under the notification bell.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => setSendTarget(null)}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={sending}
            onClick={handleSend}
            startIcon={
              sending ? <CircularProgress size={16} /> : <IosShareIcon fontSize="small" />
            }
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this notification? This cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => setDeleteId(null)}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default NotificationIndex;
