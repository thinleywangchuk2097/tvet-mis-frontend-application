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

  fromDate: Yup.date().required("From date is required"),

  endDate: Yup.date()
    .required("End date is required")
    .min(Yup.ref("fromDate"), "End date must be after From date"),
});

const AnnualBudget = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [budgets, setBudgets] = useState([
    {
      amount: "500000",
      fromDate: "2025-01-01",
      endDate: "2025-12-31",
    },
    {
      amount: "650000",
      fromDate: "2026-01-01",
      endDate: "2026-12-31",
    },
  ]);

  const filteredData = budgets.filter((item) =>
    item.amount.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = () => {
    const updated = budgets.filter((_, i) => i !== deleteIndex);
    setBudgets(updated);
    setDeleteOpen(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>
        Annual Budget
      </Typography>

      {/* SEARCH + ADD */}
      <Grid container spacing={2} justifyContent="space-between" mb={2}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            size="small"
            placeholder="Search"
            fullWidth
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

        <Grid size={{ xs: 12, md: 2 }}>
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
              <TableCell>From Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell width={120}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.fromDate}</TableCell>
                  <TableCell>{row.endDate}</TableCell>

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
        <DialogTitle>Add Budget</DialogTitle>

        <Formik
          enableReinitialize
          initialValues={{
            amount: editIndex !== null ? budgets[editIndex].amount : "",
            fromDate: editIndex !== null ? budgets[editIndex].fromDate : "",
            endDate: editIndex !== null ? budgets[editIndex].endDate : "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            if (editIndex !== null) {
              const updated = [...budgets];
              updated[editIndex] = values;
              setBudgets(updated);
            } else {
              setBudgets([...budgets, values]);
            }

            setOpen(false);
          }}
        >
          {({ values, handleChange, errors, touched }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 4 }}>
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

                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="From Date"
                      name="fromDate"
                      type="date"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={values.fromDate}
                      onChange={handleChange}
                      error={touched.fromDate && Boolean(errors.fromDate)}
                      helperText={touched.fromDate && errors.fromDate}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="End Date"
                      name="endDate"
                      type="date"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={values.endDate}
                      onChange={handleChange}
                      error={touched.endDate && Boolean(errors.endDate)}
                      helperText={touched.endDate && errors.endDate}
                    />
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions>
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="small" type="submit" variant="contained">
                  Save
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Budget</DialogTitle>

        <DialogContent>
          Are you sure you want to delete this record?
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AnnualBudget;
