import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const DeleteAssessorDialog = ({ open, assessor, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Confirm Removal</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {assessor && (
          <>
            Are you sure you want to remove <strong>{assessor.name}</strong> (
            {assessor.userId}) from the assessor assignment?
          </>
        )}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button color="primary" variant="outlined" size="small" onClick={onClose}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        size="small"
        startIcon={<DeleteIcon />}
      >
        Remove
      </Button>
    </DialogActions>
  </Dialog>
);

DeleteAssessorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  assessor: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteAssessorDialog;