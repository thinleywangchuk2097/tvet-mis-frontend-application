// src/pages/dwps/ojt/shared/ViewDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";
import { viewDialogPropTypes } from "./propTypes";

export const ViewDialog = ({ open, title, fields, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent dividers>
      <Grid container spacing={2}>
        {fields.map((field, i) => (
          <Grid key={i} size={{ xs: 12, md: i < 4 ? 6 : 12 }}>
            <TextField
              fullWidth
              label={field.label}
              value={field.value || "N/A"}
              size="small"
              slotProps={{ input: { readOnly: true } }}
              multiline={field.multiline}
              rows={field.rows || 1}
            />
          </Grid>
        ))}
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

ViewDialog.propTypes = viewDialogPropTypes;

export default ViewDialog;