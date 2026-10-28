import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  ListSubheader,
  FormControlLabel,
  Switch,
  Skeleton,
  Alert,
  InputAdornment,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderIcon from "@mui/icons-material/Folder";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import QualityStandardCheckListService from "../../api/services/internal/master/QualityStandardCheckListService";
import {
  BORDERED_TABLE,
  ITEM_TYPES,
  buildStandardTree,
  headCellSx,
  isError,
  leavesOf,
} from "../dwps/cmfg/cmfgChecklistUtils";

// Default checklist: CMFG monitoring

const TYPE_META = {
  PARENT: { label: "Parent", color: "primary" },
  SUB_PARENT: { label: "Sub parent", color: "secondary" },
  CHECKLIST: { label: "Checklist", color: "success" },
};

const errMsg = (res, fallback) =>
  res?.response?.data?.message || res?.message || fallback;

// Keeps nodes whose title matches, plus their ancestors
const filterTree = (nodes, q) => {
  if (!q) return nodes;
  const walk = (n) => {
    const kids = n.children.map(walk).filter(Boolean);
    const self = (n.title || "").toLowerCase().includes(q);
    return self || kids.length ? { ...n, children: self ? n.children : kids } : null;
  };
  return nodes.map(walk).filter(Boolean);
};

const countKinds = (nodes) => {
  const c = { PARENT: 0, SUB_PARENT: 0, CHECKLIST: 0, inactive: 0 };
  const walk = (n) => {
    c[n.kind] += 1;
    if (!n.isActive) c.inactive += 1;
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return c;
};

// ---------------------------------------------------------------- row actions
const RowActions = ({ node, onAdd, onEdit, onDelete }) => (
  <Box
    sx={{ display: "flex", gap: 0.25, justifyContent: "flex-end" }}
    onClick={(e) => e.stopPropagation()}
    onFocus={(e) => e.stopPropagation()}
  >
    {node.kind === ITEM_TYPES.PARENT && (
      <Tooltip title="Add sub parent">
        <IconButton size="small" onClick={() => onAdd(ITEM_TYPES.SUB_PARENT, node)}>
          <SubdirectoryArrowRightIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {node.kind !== ITEM_TYPES.CHECKLIST && (
      <Tooltip title="Add checklist item">
        <IconButton
          size="small"
          sx={{ color: "success.main" }}
          onClick={() => onAdd(ITEM_TYPES.CHECKLIST, node)}
        >
          <PlaylistAddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    <Tooltip title="Edit">
      <IconButton size="small" sx={{ color: "primary.main" }} onClick={() => onEdit(node)}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete">
      <IconButton size="small" sx={{ color: "error.main" }} onClick={() => onDelete(node)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
);

RowActions.propTypes = {
  node: PropTypes.object.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const StatusChip = ({ active }) => (
  <Chip
    size="small"
    label={active ? "Active" : "Inactive"}
    color={active ? "success" : "default"}
    variant={active ? "outlined" : "filled"}
    sx={{ height: 20, fontSize: "0.7rem" }}
  />
);
StatusChip.propTypes = { active: PropTypes.bool };

// ---------------------------------------------------------------- page
const QualityStandardCheckListIndex = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);

  // selected service (kept in the URL: ?serviceId=55). Nothing is loaded until one is chosen.
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceId = Number(searchParams.get("serviceId")) || null;
  const setServiceId = (id) => setSearchParams({ serviceId: String(id) }, { replace: true });
  const [services, setServices] = useState([]);

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [expanded, setExpanded] = useState({});

  // form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [formInit, setFormInit] = useState(null);
  // delete dialog
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !serviceId) return; // no service chosen yet -> nothing to fetch
    setLoading(true);
    const res = await QualityStandardCheckListService.getByService(serviceId, accessToken);
    if (isError(res)) toast.error(errMsg(res, "Failed to load checklist"));
    else setRaw(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  }, [accessToken, serviceId]);

  useEffect(() => {
    setRaw([]);
    setExpanded({});
    setSearch("");
    load();
  }, [load]);

  // services that have a checklist (dropdown)
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      const res = await QualityStandardCheckListService.getServices(accessToken);
      if (isError(res)) {
        toast.error(errMsg(res, "Failed to load services"));
        return;
      }
      const list = (Array.isArray(res.data) ? res.data : [])
        .filter((x) => x.service_id !== null && x.service_id !== undefined && x.service_id !== "")
        .map((x) => ({
          id: Number(x.service_id),
          name: x.service_name || `Service ${x.service_id}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setServices(list);
    })();
  }, [accessToken]);

  const serviceName =
    services.find((sv) => sv.id === serviceId)?.name || `Service ${serviceId}`;

  const tree = useMemo(
    () => buildStandardTree(raw, { includeInactive: true, keepEmpty: true }),
    [raw],
  );
  const counts = useMemo(() => countKinds(tree), [tree]);

  const visibleTree = useMemo(() => {
    let nodes = tree;
    if (statusFilter !== "all") {
      const want = statusFilter === "active";
      const keep = (n) => {
        const kids = n.children.map(keep).filter(Boolean);
        return n.isActive === want || kids.length ? { ...n, children: kids } : null;
      };
      nodes = nodes.map(keep).filter(Boolean);
    }
    return filterTree(nodes, search.trim().toLowerCase());
  }, [tree, search, statusFilter]);

  // parents / sub parents for the "parent" dropdown
  const parentOptions = useMemo(() => {
    const opts = [];
    tree.forEach((p) => {
      opts.push({ id: p.id, label: `${p.number}. ${p.title}`, kind: p.kind });
      p.children
        .filter((c) => c.kind === ITEM_TYPES.SUB_PARENT)
        .forEach((sp) =>
          opts.push({ id: sp.id, label: `${sp.number} ${sp.title}`, kind: sp.kind, parentId: p.id }),
        );
    });
    return opts;
  }, [tree]);

  const isExpanded = (id) => expanded[id] ?? true;
  const setAllExpanded = (value) =>
    setExpanded(Object.fromEntries(tree.map((p) => [p.id, value])));

  // ---- form ----
  const openAdd = (itemType, parentNode = null) => {
    setFormInit({
      id: null,
      itemType,
      parentId: parentNode ? parentNode.id : "",
      dropdownName: "",
      description: "",
      displayOrder: "",
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEdit = (node) => {
    setFormInit({
      id: node.id,
      itemType: node.kind,
      parentId: node.raw.parentId ? String(node.raw.parentId) : "",
      dropdownName: node.raw.dropdownName || "",
      description: node.raw.description || "",
      displayOrder: node.raw.displayOrder || "",
      isActive: node.isActive,
      hasChildren: node.children.length > 0,
    });
    setFormOpen(true);
  };

  const validationSchema = Yup.object({
    itemType: Yup.string().required("Type is required"),
    parentId: Yup.string().when("itemType", {
      is: (t) => t && t !== ITEM_TYPES.PARENT,
      then: (s) => s.required("Select where this item belongs"),
      otherwise: (s) => s.notRequired(),
    }),
    dropdownName: Yup.string().trim().required("Title is required").max(2000),
    displayOrder: Yup.number()
      .transform((v, o) => (o === "" ? undefined : v))
      .typeError("Must be a number")
      .integer("Must be a whole number")
      .min(0, "Must be 0 or more"),
  });

  const handleSave = async (values, { setSubmitting }) => {
    const payload = {
      id: values.id ? parseInt(values.id, 10) : null,
      serviceId,
      itemType: values.itemType,
      parentId: values.itemType === ITEM_TYPES.PARENT ? 0 : parseInt(values.parentId, 10),
      dropdownName: values.dropdownName.trim(),
      description: values.description?.trim() || null,
      displayOrder: values.displayOrder === "" ? null : String(values.displayOrder),
      isActive: values.isActive ? 1 : 0,
      updatedBy: actionId ? parseInt(actionId, 10) : null,
    };
    const res = await QualityStandardCheckListService.save(payload, accessToken);
    setSubmitting(false);
    if (isError(res)) {
      toast.error(errMsg(res, "Failed to save item"));
      return;
    }
    toast.success(res.data?.message || "Saved");
    setFormOpen(false);
    if (payload.parentId) {
      // keep the parent tab open so the new item is visible
      const top = parentOptions.find((o) => String(o.id) === String(payload.parentId));
      const topId = top?.parentId || top?.id;
      if (topId) setExpanded((p) => ({ ...p, [topId]: true }));
    }
    load();
  };

  // ---- delete ----
  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await QualityStandardCheckListService.delete(
      parseInt(toDelete.id, 10),
      accessToken,
    );
    setDeleting(false);
    if (isError(res)) {
      toast.error(errMsg(res, "Failed to delete item"));
      return;
    }
    if (res.data?.deactivated) toast.info(res.data.message);
    else toast.success(res.data?.message || "Deleted");
    setToDelete(null);
    load();
  };

  // ---------------------------------------------------------------- render
  const renderChildRows = (parent) => {
    const rows = [];
    const walk = (n) => {
      rows.push(n);
      if (n.kind === ITEM_TYPES.SUB_PARENT) n.children.forEach(walk);
    };
    parent.children.forEach(walk);
    if (!rows.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: "12px !important" }}>
            No items yet — use the buttons above to add a sub parent or checklist item.
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((n) => {
      const isSub = n.kind === ITEM_TYPES.SUB_PARENT;
      const indent = Math.max(0, n.depth - 1) * 2.5;
      return (
        <TableRow
          key={n.id}
          hover
          sx={{
            bgcolor: (t) =>
              isSub ? alpha(t.palette.secondary.main, 0.05) : "inherit",
            opacity: n.isActive ? 1 : 0.6,
          }}
        >
          <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{n.number}</TableCell>
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: indent }}>
              {isSub ? (
                <FolderIcon sx={{ fontSize: 16, color: "secondary.main" }} />
              ) : (
                <ChecklistIcon sx={{ fontSize: 16, color: "success.main" }} />
              )}
              <Box>
                <Typography fontSize="0.82rem" fontWeight={isSub ? 700 : 400}>
                  {n.title}
                  {isSub && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({leavesOf(n).length} checklist item{leavesOf(n).length === 1 ? "" : "s"})
                    </Typography>
                  )}
                </Typography>
                {n.description && n.description !== n.title && (
                  <Typography variant="caption" color="text.secondary">
                    {n.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </TableCell>
          <TableCell>
            <Chip
              size="small"
              label={TYPE_META[n.kind].label}
              color={TYPE_META[n.kind].color}
              variant="outlined"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          </TableCell>
          <TableCell align="center">
            <StatusChip active={n.isActive} />
          </TableCell>
          <TableCell>
            <RowActions node={n} onAdd={openAdd} onEdit={openEdit} onDelete={setToDelete} />
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        m: 1.25,
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <ChecklistIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography variant="h5" fontWeight={600}>
            Quality Standard Checklist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {serviceId
              ? `${serviceName} (service ${serviceId}) · Parent → checklist, or parent → sub parent → checklist.`
              : "Choose a service to view and manage its checklist."}
          </Typography>
        </Box>
        {serviceId && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={`${counts.PARENT} parents`} color="primary" variant="outlined" />
          <Chip label={`${counts.SUB_PARENT} sub parents`} color="secondary" variant="outlined" />
          <Chip label={`${counts.CHECKLIST} checklist items`} color="success" variant="outlined" />
          {counts.inactive > 0 && <Chip label={`${counts.inactive} inactive`} />}
        </Box>
        )}
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <TextField
          select
          size="small"
          label="Checklist for service"
          value={services.some((sv) => sv.id === serviceId) ? serviceId : ""}
          onChange={(e) => setServiceId(e.target.value)}
          sx={{ minWidth: 260, maxWidth: 360 }}
          slotProps={{ select: { displayEmpty: false } }}
        >
          {services.length === 0 && (
            <MenuItem disabled value="">
              {loading ? "Loading..." : "No services found"}
            </MenuItem>
          )}
          {services.map((sv) => (
            <MenuItem key={sv.id} value={sv.id}>
              {sv.name}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({sv.id})
              </Typography>
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          placeholder="Search parent, sub parent or checklist item"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 240, maxWidth: 420 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter}
          onChange={(e, v) => v && setStatusFilter(v)}
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", px: 1.5 } }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title="Expand all">
          <IconButton onClick={() => setAllExpanded(true)}>
            <UnfoldMoreIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Collapse all">
          <IconButton onClick={() => setAllExpanded(false)}>
            <UnfoldLessIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={load} disabled={loading || !serviceId}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={!serviceId ? "Choose a service first" : ""}>
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openAdd(ITEM_TYPES.PARENT)}
              disabled={!serviceId}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Add Parent
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Tree */}
      {!serviceId ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <ChecklistIcon sx={{ fontSize: 52, color: "text.disabled" }} />
          <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
            No service selected
          </Typography>
          <Typography variant="body2">
            Choose a service in &quot;Checklist for service&quot; to load its checklist.
          </Typography>
        </Box>
      ) : loading && !raw.length ? (
        <Box>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : visibleTree.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <ChecklistIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {search || statusFilter !== "all"
              ? "No items match your filter"
              : "No checklist yet. Start by adding a parent."}
          </Typography>
          {!search && statusFilter === "all" && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => openAdd(ITEM_TYPES.PARENT)}
              sx={{ mt: 1.5, textTransform: "none" }}
            >
              Add Parent
            </Button>
          )}
        </Box>
      ) : (
        visibleTree.map((p) => {
          const items = leavesOf(p).length;
          const subs = p.children.filter((c) => c.kind === ITEM_TYPES.SUB_PARENT).length;
          const open = search ? true : isExpanded(p.id);
          return (
            <Paper
              key={p.id}
              variant="outlined"
              sx={{ mb: 1.25, borderRadius: 2.5, overflow: "hidden", opacity: p.isActive ? 1 : 0.7 }}
            >
              {/* Parent header (not a button, so the action buttons are not nested) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.5,
                  py: 0.75,
                  minHeight: 52,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
                }}
              >
                <IconButton
                  size="small"
                  aria-label={open ? "Collapse" : "Expand"}
                  onClick={() => setExpanded((st) => ({ ...st, [p.id]: !open }))}
                >
                  <ExpandMoreIcon
                    sx={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}
                  />
                </IconButton>
                <Avatar sx={{ width: 26, height: 26, fontSize: "0.8rem", bgcolor: "primary.main" }}>
                  {p.number}
                </Avatar>
                <Box
                  sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => setExpanded((st) => ({ ...st, [p.id]: !open }))}
                >
                  <Typography fontWeight={600} noWrap title={p.title}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {subs > 0 ? `${subs} sub parent${subs === 1 ? "" : "s"} · ` : ""}
                    {items} checklist item{items === 1 ? "" : "s"}
                  </Typography>
                </Box>
                <StatusChip active={p.isActive} />
                <RowActions node={p} onAdd={openAdd} onEdit={openEdit} onDelete={setToDelete} />
              </Box>
              <Collapse in={open} unmountOnExit>
                <Table size="small" sx={BORDERED_TABLE}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...headCellSx, width: 70 }}>No.</TableCell>
                      <TableCell sx={headCellSx}>Sub parent / checklist item</TableCell>
                      <TableCell sx={{ ...headCellSx, width: 100 }}>Type</TableCell>
                      <TableCell sx={{ ...headCellSx, width: 90 }} align="center">
                        Status
                      </TableCell>
                      <TableCell sx={{ ...headCellSx, width: 150 }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{renderChildRows(p)}</TableBody>
                </Table>
              </Collapse>
            </Paper>
          );
        })
      )}

      {/* Add / edit dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        {formInit && (
          <Formik
            initialValues={formInit}
            validationSchema={validationSchema}
            onSubmit={handleSave}
            enableReinitialize
          >
            {(formik) => {
              const t = formik.values.itemType;
              const options =
                t === ITEM_TYPES.SUB_PARENT
                  ? parentOptions.filter((o) => o.kind === ITEM_TYPES.PARENT)
                  : parentOptions;
              const lockedType = formInit.id && formInit.hasChildren;
              return (
                <Form>
                  <DialogTitle
                    sx={{
                      bgcolor: (th) => alpha(th.palette.primary.main, 0.05),
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {formInit.id ? "Edit" : "Add"} {TYPE_META[t]?.label.toLowerCase() || "item"}
                  </DialogTitle>
                  <DialogContent sx={{ pt: "20px !important", display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      select
                      size="small"
                      label="Type"
                      name="itemType"
                      value={t}
                      onChange={(e) => {
                        formik.setFieldValue("itemType", e.target.value);
                        if (e.target.value === ITEM_TYPES.PARENT) formik.setFieldValue("parentId", "");
                      }}
                      disabled={!!lockedType}
                      helperText={
                        lockedType ? "Type can't change while this item has sub items" : undefined
                      }
                    >
                      <MenuItem value={ITEM_TYPES.PARENT}>Parent</MenuItem>
                      <MenuItem value={ITEM_TYPES.SUB_PARENT}>Sub parent (under a parent)</MenuItem>
                      <MenuItem value={ITEM_TYPES.CHECKLIST}>
                        Checklist item (under a parent or sub parent)
                      </MenuItem>
                    </TextField>

                    {t !== ITEM_TYPES.PARENT && (
                      <TextField
                        select
                        size="small"
                        label={t === ITEM_TYPES.SUB_PARENT ? "Parent" : "Parent / sub parent"}
                        name="parentId"
                        value={formik.values.parentId}
                        onChange={formik.handleChange}
                        error={formik.touched.parentId && Boolean(formik.errors.parentId)}
                        helperText={formik.touched.parentId && formik.errors.parentId}
                      >
                        {options.length === 0 && (
                          <MenuItem disabled value="">
                            Add a parent first
                          </MenuItem>
                        )}
                        {options
                          .filter((o) => String(o.id) !== String(formInit.id))
                          .map((o) =>
                            o.kind === ITEM_TYPES.PARENT && t === ITEM_TYPES.CHECKLIST ? (
                              [
                                <ListSubheader key={`h-${o.id}`} sx={{ lineHeight: "30px" }}>
                                  {o.label}
                                </ListSubheader>,
                                <MenuItem key={o.id} value={String(o.id)} sx={{ pl: 3 }}>
                                  Directly under this parent
                                </MenuItem>,
                              ]
                            ) : (
                              <MenuItem
                                key={o.id}
                                value={String(o.id)}
                                sx={{ pl: o.kind === ITEM_TYPES.SUB_PARENT ? 4 : 2 }}
                              >
                                {o.kind === ITEM_TYPES.SUB_PARENT ? `↳ ${o.label}` : o.label}
                              </MenuItem>
                            ),
                          )}
                      </TextField>
                    )}

                    <TextField
                      size="small"
                      label={t === ITEM_TYPES.CHECKLIST ? "Checklist item" : "Title"}
                      name="dropdownName"
                      value={formik.values.dropdownName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      multiline
                      minRows={t === ITEM_TYPES.CHECKLIST ? 2 : 1}
                      error={formik.touched.dropdownName && Boolean(formik.errors.dropdownName)}
                      helperText={formik.touched.dropdownName && formik.errors.dropdownName}
                      required
                    />
                    <TextField
                      size="small"
                      label="Description (optional)"
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      multiline
                      minRows={2}
                    />
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                      <TextField
                        size="small"
                        type="number"
                        label="Display order"
                        name="displayOrder"
                        value={formik.values.displayOrder}
                        onChange={formik.handleChange}
                        error={formik.touched.displayOrder && Boolean(formik.errors.displayOrder)}
                        helperText={
                          (formik.touched.displayOrder && formik.errors.displayOrder) ||
                          "Leave empty to add at the end"
                        }
                        sx={{ width: 200 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!formik.values.isActive}
                            onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                          />
                        }
                        label={formik.values.isActive ? "Active" : "Inactive"}
                      />
                    </Box>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button
                      color="inherit"
                      variant="outlined"
                      onClick={() => setFormOpen(false)}
                      sx={{ textTransform: "none" }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={formik.isSubmitting}
                      startIcon={
                        formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      {formInit.id ? "Update" : "Save"}
                    </Button>
                  </DialogActions>
                </Form>
              );
            }}
          </Formik>
        )}
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!toDelete} onClose={() => !deleting && setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          <Avatar
            sx={{
              mx: "auto",
              mb: 2,
              width: 52,
              height: 52,
              bgcolor: (t) => alpha(t.palette.error.main, 0.1),
              color: "error.main",
            }}
          >
            <WarningAmberIcon />
          </Avatar>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Delete {toDelete ? TYPE_META[toDelete.kind].label.toLowerCase() : "item"}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>{toDelete?.title}</strong>
          </Typography>
          {toDelete?.children?.length > 0 ? (
            <Alert severity="warning" sx={{ textAlign: "left" }}>
              This item has {toDelete.children.length} sub item(s). Delete or move them first.
            </Alert>
          ) : (
            <Typography variant="caption" color="text.secondary">
              If institutes have already answered this item, it will be deactivated instead so
              past submissions keep their history.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "center" }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setToDelete(null)}
            disabled={deleting}
            sx={{ textTransform: "none", minWidth: 110 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting || toDelete?.children?.length > 0}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: "none", minWidth: 110 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default QualityStandardCheckListIndex;
