import React from "react";
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

export default ExportButtons;