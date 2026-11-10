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
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

/**
 * REC Members tab (verification page) - same flow as "Assign REC" on
 * ViewAccreditedCourseRegistration: search an active REC user, add, remove.
 * The REC members receive the endorsement task when the report is verified.
 */
const RecMembersSection = ({
  recList = [],
  recMembers,
  onRecMembersChange,
  readOnly = false,
  showErrors = false,
}) => {
  const [selected, setSelected] = useState(null);
  const [toRemove, setToRemove] = useState(null);

  const assignedIds = recMembers.map((r) => r.userId);
  // only user ids are stored (tbl_rec_member_task_assignment); names come from the REC user list
  const nameOf = (rec) =>
    rec.name || recList.find((r) => r.userId === rec.userId)?.name || "REC Member";

  const handleAdd = () => {
    if (!selected || assignedIds.includes(selected.userId)) return;
    onRecMembersChange([
      ...recMembers,
      { userId: selected.userId, name: selected.name },
    ]);
    setSelected(null);
  };

  const confirmRemove = () => {
    onRecMembersChange(recMembers.filter((r) => r.userId !== toRemove.userId));
    setToRemove(null);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <EngineeringIcon color="primary" />
        <Box>
          <Typography fontWeight={700}>
            Assign Regulatory and Evaluation Committee (REC)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The REC members endorse the report after it is verified
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {readOnly ? "REC Members" : "Add REC Members"}
          </Typography>

          {recMembers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assigned REC Members ({recMembers.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {recMembers.map((rec) => (
                  <Tooltip
                    key={rec.userId}
                    title={
                      rec.endorsed
                        ? "Endorsed"
                        : readOnly
                          ? "Endorsement pending"
                          : "Click the icon to remove"
                    }
                    arrow
                  >
                    <span>
                      <Chip
                        label={`${nameOf(rec)} (${rec.userId})`}
                        color="success"
                        variant={readOnly && !rec.endorsed ? "outlined" : "filled"}
                        icon={rec.endorsed ? <CheckCircleIcon /> : undefined}
                        onDelete={readOnly ? undefined : () => setToRemove(rec)}
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
                  options={recList.filter((r) => !assignedIds.includes(r.userId))}
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
                  renderOption={(props, o) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box>
                          <Typography variant="body2">{o.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            User ID: {o.userId} | Email: {o.email || "N/A"} |
                            Mobile: {o.mobileNo || "N/A"}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  noOptionsText="Type at least 2 characters to search REC members"
                  disabled={recList.length === 0}
                  openOnFocus={false}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search REC Member by Name or User ID"
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
                  Add REC
                </Button>
              </Grid>
            </Grid>
          )}

          {recMembers.length === 0 && (
            <Alert severity={showErrors && !readOnly ? "error" : "info"} sx={{ mt: 2 }}>
              {readOnly
                ? "No REC members have been assigned."
                : "No REC members assigned yet. At least one REC member is required for verification."}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(toRemove)} onClose={() => setToRemove(null)}>
        <DialogTitle>Remove REC member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove <strong>{toRemove ? nameOf(toRemove) : ""}</strong> (
            {toRemove?.userId}) from
            this report?
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

RecMembersSection.propTypes = {
  recList: PropTypes.array,
  recMembers: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string,
      name: PropTypes.string,
      endorsed: PropTypes.bool,
    }),
  ).isRequired,
  onRecMembersChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  showErrors: PropTypes.bool,
};

export default RecMembersSection;
