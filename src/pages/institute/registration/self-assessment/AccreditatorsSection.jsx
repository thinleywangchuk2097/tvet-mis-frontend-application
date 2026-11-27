import { useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import { newAccreditorRow, newCoordinatorRow } from "./sarUtils";


const SectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
    {icon}
    <Box>
      <Typography fontWeight={700}>{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

SectionHeader.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

/**
 * Accreditors card - same flow as RecMembersSection: search a registered
 * accreditor (name / CID), add, and remove (with confirmation). Added
 * accreditors are shown as chips.
 */
const AccreditorsCard = ({
  accreditorList,
  accreditors,
  onAccreditorsChange,
  readOnly,
  showErrors,
}) => {
  const [selected, setSelected] = useState(null);
  const [toRemove, setToRemove] = useState(null);

  // rows without a CID (old drafts) are not counted as added
  const added = accreditors.filter((a) => a.userId);
  const addedIds = added.map((a) => a.userId);
  const nameOf = (acc) =>
    acc.name ||
    accreditorList.find((a) => a.userId === acc.userId)?.name ||
    "Accreditor";

  const handleAdd = () => {
    if (!selected || addedIds.includes(selected.userId)) return;
    onAccreditorsChange([
      ...added,
      newAccreditorRow({ userId: selected.userId, name: selected.name }),
    ]);
    setSelected(null);
  };

  const confirmRemove = () => {
    onAccreditorsChange(added.filter((a) => a.key !== toRemove.key));
    setToRemove(null);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <SectionHeader
        icon={<VerifiedUserIcon color="primary" />}
        title="Accreditors"
        subtitle="Name and CID come from the registered accreditor database"
      />
      <Divider sx={{ mb: 2 }} />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {readOnly ? "Accreditors" : "Add Accreditors"}
          </Typography>

          {added.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assigned Accreditors ({added.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {added.map((acc) => (
                  <Tooltip
                    key={acc.key}
                    title={readOnly ? "" : "Click the icon to remove"}
                    arrow
                  >
                    <span>
                      <Chip
                        label={`${nameOf(acc)} (${acc.userId})`}
                        color="success"
                        onDelete={readOnly ? undefined : () => setToRemove(acc)}
                        deleteIcon={
                          readOnly ? undefined : (
                            <DeleteIcon sx={{ color: "#d32f2f" }} />
                          )
                        }
                        sx={{
                          mb: 1,
                          "& .MuiChip-deleteIcon": {
                            color: "#d32f2f",
                            "&:hover": { color: "#b71c1c" },
                          },
                        }}
                      />
                    </span>
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          )}

          {!readOnly && (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={accreditorList.filter(
                    (a) => !addedIds.includes(a.userId),
                  )}
                  getOptionLabel={(o) => `${o.name} (${o.userId})`}
                  isOptionEqualToValue={(o, v) => o.userId === v.userId}
                  value={selected}
                  onChange={(e, value) => setSelected(value)}
                  filterOptions={(options, state) => {
                    const q = state.inputValue.toLowerCase().trim();
                    if (q.length < 2) return [];
                    return options.filter(
                      (o) =>
                        o.name?.toLowerCase().includes(q) ||
                        o.userId?.toLowerCase().includes(q) ||
                        o.email?.toLowerCase().includes(q) ||
                        o.mobileNo?.includes(q),
                    );
                  }}
                  renderOption={({ key, ...optionProps }, o) => (
                    <li key={key} {...optionProps}>
                      <Box>
                        <Typography variant="body2">{o.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          CID: {o.userId} | Email: {o.email || "N/A"} |
                          Mobile: {o.mobileNo || "N/A"}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText="Type at least 2 characters to search accreditors"
                  disabled={accreditorList.length === 0}
                  openOnFocus={false}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Accreditor by Name or CID"
                      placeholder="Type at least 2 characters to search..."
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAdd}
                  disabled={!selected}
                  sx={{ fontWeight: 600, textTransform: "none", width: "100%" }}
                >
                  Add Accreditor
                </Button>
              </Grid>
            </Grid>
          )}

          {added.length === 0 && (
            <Alert
              severity={showErrors && !readOnly ? "error" : "info"}
              sx={{ mt: 2 }}
            >
              {readOnly
                ? "No accreditors have been assigned."
                : "No accreditors assigned yet. At least one accreditor is required for verification."}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(toRemove)} onClose={() => setToRemove(null)}>
        <DialogTitle>Remove accreditor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove <strong>{toRemove ? nameOf(toRemove) : ""}</strong> (
            {toRemove?.userId}) from this report?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToRemove(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

AccreditorsCard.propTypes = {
  accreditorList: PropTypes.array.isRequired,
  accreditors: PropTypes.array.isRequired,
  onAccreditorsChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  showErrors: PropTypes.bool,
};

/**
 * ACCREDITATORS section (verification page only)
 *  - Accreditors : Name and CID auto filled from registered accreditors (add more)
 *  - Program Co-ordinator : Name and Designation typed (add more)
 */
const AccreditatorsSection = ({
  accreditorList = [],
  accreditors,
  coordinators,
  onAccreditorsChange,
  onCoordinatorsChange,
  readOnly = false,
  showErrors = false,
}) => {
  const updateCoordinator = (key, field, value) => {
    onCoordinatorsChange(
      coordinators.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    );
  };

  return (
    <Stack spacing={2}>
      {/* Accreditors: same layout as the REC members section */}
      <AccreditorsCard
        accreditorList={accreditorList}
        accreditors={accreditors}
        onAccreditorsChange={onAccreditorsChange}
        readOnly={readOnly}
        showErrors={showErrors}
      />

      {/* Program Co-ordinators */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <SectionHeader
          icon={<SupervisorAccountIcon color="primary" />}
          title="Program Co-ordinator"
          subtitle="Type the name and designation of the programme co-ordinator(s)"
        />
        <Divider sx={{ mb: 2 }} />

        {coordinators.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No programme co-ordinator added yet.
          </Alert>
        )}

        <Stack spacing={1.5}>
          {coordinators.map((row, index) => (
            <Grid container columns={24} spacing={1.5} alignItems="center" key={row.key}>
              <Grid size={{ xs: 24, md: 1 }}>
                <Typography fontWeight={600} color="text.secondary">
                  {index + 1}.
                </Typography>
              </Grid>
              <Grid size={{ xs: 24, md: 11 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name"
                  value={row.name}
                  onChange={(e) =>
                    updateCoordinator(row.key, "name", e.target.value)
                  }
                  disabled={readOnly}
                  error={showErrors && !row.name.trim()}
                  slotProps={{ htmlInput: { maxLength: 150 } }}
                />
              </Grid>
              <Grid size={{ xs: 20, md: 10 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Designation"
                  value={row.designation}
                  onChange={(e) =>
                    updateCoordinator(row.key, "designation", e.target.value)
                  }
                  disabled={readOnly}
                  slotProps={{ htmlInput: { maxLength: 150 } }}
                />
              </Grid>
              <Grid size={{ xs: 4, md: 2 }}>
                {!readOnly && (
                  <Tooltip title="Remove co-ordinator" arrow>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() =>
                        onCoordinatorsChange(
                          coordinators.filter((c) => c.key !== row.key),
                        )
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Grid>
            </Grid>
          ))}
        </Stack>

        {!readOnly && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2, textTransform: "none" }}
            onClick={() =>
              onCoordinatorsChange([...coordinators, newCoordinatorRow()])
            }
          >
            Add Co-ordinator
          </Button>
        )}
      </Paper>
    </Stack>
  );
};

AccreditatorsSection.propTypes = {
  accreditorList: PropTypes.array,
  accreditors: PropTypes.array.isRequired,
  coordinators: PropTypes.array.isRequired,
  onAccreditorsChange: PropTypes.func.isRequired,
  onCoordinatorsChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  showErrors: PropTypes.bool,
};

export default AccreditatorsSection;
