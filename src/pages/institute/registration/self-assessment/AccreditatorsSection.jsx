import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
  const selectedIds = accreditors.map((a) => a.userId).filter(Boolean);

  const updateAccreditor = (key, option) => {
    onAccreditorsChange(
      accreditors.map((row) =>
        row.key === key
          ? { ...row, userId: option?.userId || "", name: option?.name || "" }
          : row,
      ),
    );
  };

  const updateCoordinator = (key, field, value) => {
    onCoordinatorsChange(
      coordinators.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    );
  };

  return (
    <Stack spacing={2}>
      {/* Accreditors */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <SectionHeader
          icon={<VerifiedUserIcon color="primary" />}
          title="Accreditors"
          subtitle="Name and CID are auto filled from the registered accreditor database"
        />
        <Divider sx={{ mb: 2 }} />

        {accreditors.length === 0 && (
          <Alert severity={showErrors ? "error" : "info"} sx={{ mb: 2 }}>
            No accreditor added yet. At least one accreditor is required for
            verification.
          </Alert>
        )}

        <Stack spacing={1.5}>
          {accreditors.map((row, index) => {
            const option =
              accreditorList.find((a) => a.userId === row.userId) ||
              (row.userId ? { userId: row.userId, name: row.name } : null);
            return (
              <Grid container columns={24} spacing={1.5} alignItems="center" key={row.key}>
                <Grid size={{ xs: 24, md: 1 }}>
                  <Typography fontWeight={600} color="text.secondary">
                    {index + 1}.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 24, md: 9 }}>
                  <Autocomplete
                    size="small"
                    options={accreditorList.filter(
                      (a) =>
                        a.userId === row.userId ||
                        !selectedIds.includes(a.userId),
                    )}
                    value={option}
                    onChange={(e, value) => updateAccreditor(row.key, value)}
                    isOptionEqualToValue={(o, v) => o.userId === v.userId}
                    getOptionLabel={(o) =>
                      o?.name ? `${o.name} (${o.userId})` : o?.userId || ""
                    }
                    renderOption={(props, o) => {
                      const { key, ...rest } = props;
                      return (
                        <li key={key} {...rest}>
                          <Box>
                            <Typography variant="body2">{o.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              CID: {o.userId} | {o.email || "N/A"} |{" "}
                              {o.mobileNo || "N/A"}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    disabled={readOnly}
                    noOptionsText="No registered accreditors found"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Accreditor"
                        placeholder="Name or CID"
                        error={showErrors && !row.userId}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 24, md: 7 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={row.name}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 20, md: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="CID"
                    value={row.userId}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 4, md: 2 }}>
                  {!readOnly && (
                    <Tooltip title="Remove accreditor" arrow>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() =>
                          onAccreditorsChange(
                            accreditors.filter((a) => a.key !== row.key),
                          )
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>
            );
          })}
        </Stack>

        {!readOnly && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2, textTransform: "none" }}
            onClick={() =>
              onAccreditorsChange([...accreditors, newAccreditorRow()])
            }
          >
            Add Accreditor
          </Button>
        )}
      </Paper>

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
