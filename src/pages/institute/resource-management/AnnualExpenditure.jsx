import React, { useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  MenuItem,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { Formik, Form } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  amount: Yup.number()
    .typeError("Amount must be a number")
    .required("Amount is required"),

  type: Yup.string().required("Expenditure type is required"),

  year: Yup.string().required("Year is required"),
});

const AnnualExpenditure = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [expenditures, setExpenditures] = useState([
    {
      amount: "250000",
      type: "Training",
      year: "2024",
    },
    {
      amount: "150000",
      type: "Equipment",
      year: "2025",
    },
  ]);

  const filteredData = expenditures.filter(
    (item) =>
      item.amount.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.year.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = () => {
    const updated = expenditures.filter((_, i) => i !== deleteIndex);
    setExpenditures(updated);
    setDeleteOpen(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>
        Annual Expenditure
      </Typography>

      {/* SEARCH + ADD (Right aligned) */}
      <Grid
        container
        justifyContent="flex-end"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Grid item>
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditIndex(null);
              setOpen(true);
            }}
          >
            Add
          </Button>
        </Grid>
      </Grid>

      {/* TABLE */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Amount (Nu)</TableCell>
              <TableCell>Expenditure Type</TableCell>
              <TableCell>Year</TableCell>
              <TableCell width={120}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.year}</TableCell>

                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setEditIndex(index);
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      size="small"
                      sx={{
                        color: "error.main",
                        "&:hover": {
                          backgroundColor: "rgba(255,0,0,0.2)",
                          borderRadius: "50%",
                        },
                      }}
                      onClick={() => {
                        setDeleteIndex(index);
                        setDeleteOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ADD / EDIT DIALOG */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Expenditure</DialogTitle>

        <Formik
          enableReinitialize
          initialValues={{
            amount: editIndex !== null ? expenditures[editIndex].amount : "",
            type: editIndex !== null ? expenditures[editIndex].type : "",
            year: editIndex !== null ? expenditures[editIndex].year : "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            if (editIndex !== null) {
              const updated = [...expenditures];
              updated[editIndex] = values;
              setExpenditures(updated);
            } else {
              setExpenditures([...expenditures, values]);
            }

            setOpen(false);
          }}
        >
          {({ values, handleChange, errors, touched }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <TextField
                      label="Amount (Nu)"
                      name="amount"
                      size="small"
                      fullWidth
                      value={values.amount}
                      onChange={handleChange}
                      error={touched.amount && Boolean(errors.amount)}
                      helperText={touched.amount && errors.amount}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 12 }}>
                    <TextField
                      select
                      label="Expenditure Type"
                      name="type"
                      size="small"
                      fullWidth
                      value={values.type}
                      onChange={handleChange}
                      error={touched.type && Boolean(errors.type)}
                      helperText={touched.type && errors.type}
                    >
                      <MenuItem value="Training">Training</MenuItem>
                      <MenuItem value="Equipment">Equipment</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 12 }}>
                    <TextField
                      label="Year"
                      name="year"
                      size="small"
                      fullWidth
                      placeholder="YYYY"
                      value={values.year}
                      onChange={handleChange}
                      error={touched.year && Boolean(errors.year)}
                      helperText={touched.year && errors.year}
                    />
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" type="submit">
                  Save
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Expenditure</DialogTitle>

        <DialogContent>
          Are you sure you want to delete this record?
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AnnualExpenditure;
