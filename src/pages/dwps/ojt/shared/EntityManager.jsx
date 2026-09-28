// src/pages/dwps/ojt/shared/EntityManager.jsx
import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Formik, Form } from "formik";

import ReusableTable from "./ReusableTable";
import AddButton from "./AddButton";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import ViewDialog from "./ViewDialog";

const EntityManager = ({
  title,
  tabs,
  entityConfigs,
  dataMap,
  searchFieldsMap,
  loading,
  dialog,
  selected,
  pagination,
  contextExtra,
  onDeleteConfirm,
  onSubmitForm,
  statusFilter,
  refetchMap,
}) => {
  const [search, setSearch] = useState("");
  const [tabValue, setTabValue] = useState(0);

  const {
    dialogState,
    openDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
  } = dialog;

  const { selected: selectedMap, selectItem, clearSelected } = selected;

  const {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  } = pagination;

  const statusFilterEnabled = statusFilter?.enabled;
  const statusFilterTabIndex = statusFilter?.tabIndex;
  const statusFilterValue = statusFilter?.value;
  const statusFilterOnChange = statusFilter?.onChange;
  const statusFilterOptions = statusFilter?.options;

  const handleTabChange = useCallback(
    (_, newValue) => {
      setTabValue(newValue);
      handleChangePage(null, 0);
    },
    [handleChangePage],
  );

  const handleSearchClear = useCallback(() => {
    setSearch("");
    if (statusFilterEnabled && statusFilterOnChange) {
      statusFilterOnChange("");
    }
  }, [statusFilterEnabled, statusFilterOnChange]);

  const filterData = useCallback(
    (data, fields) => {
      if (!data) return [];
      let filtered = data;
      if (search) {
        const lowered = search.toLowerCase();
        filtered = filtered.filter((item) =>
          fields.some((f) =>
            item[f]?.toString().toLowerCase().includes(lowered),
          ),
        );
      }
      if (
        statusFilterEnabled &&
        tabValue === statusFilterTabIndex &&
        statusFilterValue
      ) {
        filtered = filtered.filter(
          (item) => String(item.status_id) === statusFilterValue,
        );
      }
      return filtered;
    },
    [
      search,
      statusFilterEnabled,
      statusFilterTabIndex,
      statusFilterValue,
      tabValue,
    ],
  );

  const filteredData = useMemo(() => {
    const result = {};
    Object.keys(dataMap).forEach((type) => {
      result[type] = filterData(dataMap[type], searchFieldsMap[type] || []);
    });
    return result;
  }, [dataMap, searchFieldsMap, filterData]);

  const buildContext = useCallback(
    () => ({
      selected,
      openDialog,
      handleDelete: (item, type) => openDeleteDialog(item, type),
      selectItem,
      ...contextExtra,
    }),
    [selected, openDialog, openDeleteDialog, selectItem, contextExtra],
  );

  const currentType = tabs[tabValue].type;
  const currentData = filteredData[currentType] || [];
  const currentConfig = entityConfigs[currentType];

  // ---------- Table ----------
  const renderTable = () => {
    const context = buildContext();
    const columns =
      typeof currentConfig.columns === "function"
        ? currentConfig.columns(context)
        : currentConfig.columns;
    const actions =
      typeof currentConfig.actions === "function"
        ? currentConfig.actions(context)
        : currentConfig.actions;

    return (
      <>
        {!currentConfig.hideAddButton && (
          <AddButton
            onClick={() => {
              clearSelected(currentType);
              openDialog(currentType, { open: true });
            }}
            label={currentConfig.addLabel}
          />
        )}
        <ReusableTable
          columns={columns}
          data={currentData}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          actions={actions}
          emptyMessage={currentConfig.emptyMessage}
        />
      </>
    );
  };

  // ---------- Dialogs ----------
  const renderDialog = (type) => {
    const config = entityConfigs[type];
    if (!config) return null;

    const isEdit = dialogState[type]?.edit;
    const isView = dialogState[type]?.view;
    const isOpen = dialogState[type]?.open || isEdit || isView;
    const item = selectedMap[type];

    if (config.renderCondition && !config.renderCondition(selectedMap)) {
      return null;
    }

    const context = buildContext();

    // View dialog
    if (isView && config.viewFields) {
      const fields =
        typeof config.viewFields === "function"
          ? config.viewFields(item, context)
          : [];
      return (
        <ViewDialog
          key={`view-${type}`}
          open={isOpen}
          title={config.viewTitle || `${config.label} Details`}
          onClose={() => {
            closeDialog(type);
            clearSelected(type);
          }}
          fields={fields}
        />
      );
    }

    // Add/Edit dialog
    const FormComponent = config.FormComponent;
    const dialogTitle = isEdit ? config.editLabel : config.addLabel;

    const handleSubmit = async (values, helpers) => {
      const success = await onSubmitForm(
        values,
        { ...config, refetchFn: refetchMap?.[type] },
        isEdit,
        item?.id,
        type,
      );
      if (success) {
        closeDialog(type);
        clearSelected(type);
        helpers.resetForm();
      }
    };

    return (
      <Dialog
        key={`form-${type}`}
        open={isOpen}
        onClose={() => {
          closeDialog(type);
          clearSelected(type);
        }}
        maxWidth={config.dialogMaxWidth || "md"}
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
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
                  onClick={() => {
                    closeDialog(type);
                    clearSelected(type);
                  }}
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

  return (
    <Paper elevation={3} sx={{ p: 2, m: 1 }}>
      <Typography variant="h5" gutterBottom>
        {title}
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
        {statusFilterEnabled && tabValue === statusFilterTabIndex && (
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilterValue}
                onChange={(e) => statusFilterOnChange(e.target.value)}
                label="Status"
                sx={{ height: 36 }}
              >
                <MenuItem value="">All Status</MenuItem>
                {statusFilterOptions.map((s) => (
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

      {renderTable()}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={currentData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <DeleteConfirmationDialog
        open={dialogState.delete.open}
        item={dialogState.delete.item}
        type={dialogState.delete.type}
        onClose={closeDeleteDialog}
        onConfirm={onDeleteConfirm}
      />

      {tabs.map((tab) => renderDialog(tab.type))}
    </Paper>
  );
};

EntityManager.propTypes = {
  title: PropTypes.string.isRequired,
  tabs: PropTypes.array.isRequired,
  entityConfigs: PropTypes.object.isRequired,
  dataMap: PropTypes.object.isRequired,
  searchFieldsMap: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  dialog: PropTypes.object.isRequired,
  selected: PropTypes.object.isRequired,
  pagination: PropTypes.object.isRequired,
  contextExtra: PropTypes.object,
  onDeleteConfirm: PropTypes.func.isRequired,
  onSubmitForm: PropTypes.func.isRequired,
  statusFilter: PropTypes.shape({
    enabled: PropTypes.bool,
    tabIndex: PropTypes.number,
    value: PropTypes.string,
    onChange: PropTypes.func,
    options: PropTypes.array,
  }),
  refetchMap: PropTypes.object,
};

export default EntityManager;