import PropTypes from "prop-types";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import GradeIcon from "@mui/icons-material/Grade";
import FileDownload from "../../../../../components/file/FileDownload";

const InfoRow = ({ label, value }) => (
  <TableRow>
    <TableCell
      component="th"
      scope="row"
      sx={{ fontWeight: 400, width: "35%", bgcolor: "action.hover" }}
    >
      {label}
    </TableCell>
    <TableCell>{value || "N/A"}</TableCell>
  </TableRow>
);

const SectionHeader = ({ icon, title }) => (
  <Box display="flex" alignItems="center" gap={1} mb={2}>
    {icon}
    <Typography variant="subtitle1" fontWeight="bold" color="primary">
      {title}
    </Typography>
  </Box>
);

const TraineeDetailsDialog = ({
  open,
  onClose,
  loading,
  details,
  documents = [],
  marks = [],
  getQualificationName,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="lg"
    fullWidth
    slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: "80vh" } } }}
  >
    <DialogTitle
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        pb: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="h6" fontWeight="bold">
        Trainee Details
      </Typography>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </DialogTitle>

    <DialogContent sx={{ pt: 3 }}>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : details ? (
        <Box>
          <SectionHeader
            icon={<PersonIcon color="primary" />}
            title="Personal Information"
          />
          <TableContainer
            component={Paper}
            sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}
          >
            <Table size="small">
              <TableBody>
                <InfoRow label="Applicant Name" value={details.applicant_name} />
                <InfoRow label="CID/Reference Number" value={details.cid_no} />
                <InfoRow label="Mobile Number" value={details.mobile_no} />
                <InfoRow label="Email Address" value={details.email_id} />
                <InfoRow label="Guardian Name" value={details.guardian_name} />
                <InfoRow
                  label="Guardian Mobile Number"
                  value={details.guardian_mobile_no}
                />
              </TableBody>
            </Table>
          </TableContainer>

          <SectionHeader
            icon={<SchoolIcon color="primary" />}
            title="Academic Information"
          />
          <TableContainer
            component={Paper}
            sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}
          >
            <Table size="small">
              <TableBody>
                <InfoRow
                  label="Academic Qualification"
                  value={getQualificationName(
                    details.academic_qualification_id,
                  )}
                />
                <InfoRow label="Trainee ID" value={details.id} />
              </TableBody>
            </Table>
          </TableContainer>

          {marks.length > 0 && (
            <>
              <SectionHeader
                icon={<GradeIcon color="primary" />}
                title="Trainee Marks"
              />
              <TableContainer
                component={Paper}
                sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 400 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 400 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 400 }} align="right">
                        Marks
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map((mark, index) => (
                      <TableRow key={mark.id || index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{mark.subject || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={mark.markScore || "N/A"}
                            size="small"
                            color={
                              parseInt(mark.markScore) >= 50
                                ? "success"
                                : "error"
                            }
                            sx={{ fontWeight: 500, minWidth: 50 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                        Total Marks
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {marks.reduce(
                          (t, m) => t + parseInt(m.markScore || 0),
                          0,
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {documents.length > 0 && (
            <>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                sx={{ mb: 2 }}
              >
                Documents
              </Typography>
              <FileDownload
                initialFiles={documents}
                onFileUpload={() => {}}
                allowUpload={false}
              />
            </>
          )}
        </Box>
      ) : (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography color="textSecondary">No data available</Typography>
        </Box>
      )}
    </DialogContent>

    <DialogActions
      sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2, px: 3 }}
    >
      <Button onClick={onClose} variant="outlined" color="secondary">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

TraineeDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  details: PropTypes.object,
  documents: PropTypes.array,
  marks: PropTypes.array,
  getQualificationName: PropTypes.func.isRequired,
};

export default TraineeDetailsDialog;