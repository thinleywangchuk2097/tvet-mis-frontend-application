import React from "react";
import PropTypes from "prop-types";
import { Button, Stack } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

const ExportButtons = ({ onExcel, onPdf }) => {
    return (
        <Stack direction="row" spacing={1}>
            <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={onExcel}
            >
                Excel
            </Button>

            <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onPdf}
            >
                PDF
            </Button>
        </Stack>
    );
};

ExportButtons.propTypes = {
    onExcel: PropTypes.func.isRequired,
    onPdf: PropTypes.func.isRequired,
};

export default ExportButtons;