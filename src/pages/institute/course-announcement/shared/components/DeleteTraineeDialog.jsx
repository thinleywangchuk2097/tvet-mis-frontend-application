import PropTypes from "prop-types";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const DeleteTraineeDialog = ({
  open,
  trainee,
  loading = false,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Confirm Removal</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {trainee && (
          <>
            Are you sure you want to remove{" "}
            <strong>{trainee.applicant_name}</strong> from the pending trainees
            list?
            <br />
            <br />
            <strong>CID/Reference:</strong>{" "}
            {trainee.cid_no || trainee.reference_no}
            <br />
            <strong>Email:</strong> {trainee.email_id}
            <br />
            <strong>Contact:</strong> {trainee.mobile_no}
          </>
        )}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button
        color="primary"
        variant="outlined"
        size="small"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        size="small"
        startIcon={<DeleteIcon />}
        disabled={loading}
      >
        {loading ? <CircularProgress size={20} /> : "Remove"}
      </Button>
    </DialogActions>
  </Dialog>
);

DeleteTraineeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  trainee: PropTypes.object,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteTraineeDialog;