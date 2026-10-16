import PropTypes from "prop-types";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";

const ActionConfirmDialog = ({
  open,
  title,
  bodyText,
  remarkLabel = "Remarks",
  showRemarks = false,
  remarks,
  remarksError,
  onRemarksChange,
  confirmColor = "primary",
  confirmText = "Confirm",
  loading = false,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText sx={showRemarks ? { mb: 2 } : undefined}>
        {bodyText}
      </DialogContentText>
      {showRemarks && (
        <TextField
          autoFocus
          margin="dense"
          label={remarkLabel}
          fullWidth
          multiline
          rows={4}
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          error={!!remarksError}
          helperText={remarksError}
          required
        />
      )}
    </DialogContent>
    <DialogActions>
      <Button
        color="error"
        variant="contained"
        size="small"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color={confirmColor}
        variant="contained"
        size="small"
        disabled={loading || (showRemarks && !remarks?.trim())}
      >
        {loading ? <CircularProgress size={20} /> : confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

ActionConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  bodyText: PropTypes.node.isRequired,
  remarkLabel: PropTypes.string,
  showRemarks: PropTypes.bool,
  remarks: PropTypes.string,
  remarksError: PropTypes.string,
  onRemarksChange: PropTypes.func,
  confirmColor: PropTypes.string,
  confirmText: PropTypes.string,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ActionConfirmDialog;