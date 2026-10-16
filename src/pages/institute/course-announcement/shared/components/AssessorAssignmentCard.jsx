import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";

const AssessorAssignmentCard = ({
  canEdit,
  assignedAssessors,
  availableAssessors,
  allAssessors,
  selectedAssessor,
  selectedAssessorDetails,
  onSelectAssessor,
  onAddAssessor,
  onOpenDeleteDialog,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <EngineeringIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          Assign Assessors
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {assignedAssessors.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Assigned Assessors ({assignedAssessors.length}):
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {assignedAssessors.map((ass) => (
              <Chip
                key={ass.id}
                label={`${ass.name} (${ass.userId})`}
                color="success"
                onDelete={canEdit ? () => onOpenDeleteDialog(ass) : undefined}
                deleteIcon={
                  canEdit ? <DeleteIcon sx={{ color: "#d32f2f" }} /> : undefined
                }
                sx={{
                  mb: 1,
                  "& .MuiChip-deleteIcon": {
                    color: "#d32f2f",
                    "&:hover": { color: "#b71c1c" },
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {canEdit && (
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, md: 8 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={availableAssessors}
              getOptionLabel={(option) => `${option.name} (${option.userId})`}
              value={selectedAssessorDetails || null}
              onChange={(e, newValue) =>
                onSelectAssessor(newValue ? newValue.id : "")
              }
              filterOptions={(options, state) => {
                const term = state.inputValue.toLowerCase().trim();
                if (!term || term.length < 2) return [];
                return options.filter(
                  (o) =>
                    o.name.toLowerCase().includes(term) ||
                    o.userId?.toLowerCase().includes(term) ||
                    o.email?.toLowerCase().includes(term) ||
                    o.mobileNo?.includes(term),
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Assessor by Name or User ID"
                  placeholder="Type at least 2 characters to search..."
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      User ID: {option.userId} | Email: {option.email || "N/A"}{" "}
                      | Mobile: {option.mobileNo || "N/A"}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText="No assessors available"
              loadingText="Loading..."
              disabled={availableAssessors.length === 0}
              openOnFocus={false}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<PersonAddIcon />}
              onClick={onAddAssessor}
              disabled={!selectedAssessor || availableAssessors.length === 0}
              sx={{ fontWeight: 600, textTransform: "none", width: "100%" }}
            >
              Add Assessor
            </Button>
          </Grid>
        </Grid>
      )}

      {!canEdit && assignedAssessors.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Assessors have been assigned. You cannot add or remove assessors.
        </Alert>
      )}

      {selectedAssessor && selectedAssessorDetails && canEdit && (
        <Box
          sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Selected Assessor Details:
          </Typography>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {selectedAssessorDetails.name}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                User ID
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {selectedAssessorDetails.userId}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {selectedAssessorDetails.email || "N/A"}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Mobile No
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {selectedAssessorDetails.mobileNo || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {assignedAssessors.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Required:</strong> At least one assessor must be assigned
          before approval/endorsement.
        </Alert>
      )}

      {allAssessors.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No assessors found. Please check if there are active assessor users in
          the system.
        </Alert>
      )}
    </CardContent>
  </Card>
);

AssessorAssignmentCard.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  assignedAssessors: PropTypes.array.isRequired,
  availableAssessors: PropTypes.array.isRequired,
  allAssessors: PropTypes.array.isRequired,
  selectedAssessor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedAssessorDetails: PropTypes.object,
  onSelectAssessor: PropTypes.func.isRequired,
  onAddAssessor: PropTypes.func.isRequired,
  onOpenDeleteDialog: PropTypes.func.isRequired,
};

export default AssessorAssignmentCard;