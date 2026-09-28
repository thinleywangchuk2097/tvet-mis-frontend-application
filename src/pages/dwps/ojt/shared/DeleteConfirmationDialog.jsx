// src/pages/dwps/ojt/shared/DeleteConfirmationDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { deleteConfirmationDialogPropTypes } from "./propTypes";

export const DeleteConfirmationDialog = ({
  open,
  item,
  type,
  messages = {},
  onClose,
  onConfirm,
}) => {
  const defaultMessages = {
    session: `Delete session "<strong>${item?.session_name}</strong>"?`,
    firm: `Delete firm "<strong>${item?.firm_name || item?.company_name}</strong>"?`,
    ojt: `Delete OJT agreement "<strong>${item?.agreement_title}</strong>"?`,
    placement: `Delete placement for "<strong>${item?.trainee_name}</strong>"?`,
  };

  const merged = { ...defaultMessages, ...messages };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ color: "error.main" }}>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <span
            dangerouslySetInnerHTML={{
              __html: merged[type] || "Delete this record?",
            }}
          />
          <br />
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small" variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          size="small"
          color="error"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DeleteConfirmationDialog.propTypes = deleteConfirmationDialogPropTypes;

export default DeleteConfirmationDialog;