import React, { useState } from "react";
import { Paper, Grid, TextField, Button, Typography } from "@mui/material";

const TrackTrainee = () => {
  const [citizenId, setCitizenId] = useState("");

  const handleSearch = () => {
    // You can replace this with actual search logic
    alert(`Searching trainee with Citizen ID: ${citizenId}`);
  };

  return (
    <Paper sx={{ p: 3}}>
      <Typography variant="h6" gutterBottom>
        Tracking Trainee
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Citizen ID"
            size="small"
            value={citizenId}
            onChange={(e) => setCitizenId(e.target.value)}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSearch}
          >
            Search
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TrackTrainee;