// src/pages/dwps/ojt/shared/AddButton.jsx
import React from "react";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { addButtonPropTypes } from "./propTypes";

export const AddButton = ({ onClick, label }) => (
  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
    <Button
      variant="contained"
      color="primary"
      size="small"
      startIcon={<AddIcon />}
      onClick={onClick}
    >
      {label}
    </Button>
  </Box>
);

AddButton.propTypes = addButtonPropTypes;

export default AddButton;