import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Field, FieldArray, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
  },
};

const StaffManagement = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const [staff, setStaff] = useState([
    {
      hasCitizenID: "yes",
      citizenID: "12345678901",
      name: "Kharka Bdr Kharka",
      email: "kharka@test.com",
      mobileNo: "17123456",
      referenceNo: "",
      gender: "",
      dob: "",
      employmentHistory: [
        {
          appointmentDate: "2020-01-01",
          qualificationAtServiceEntry: "Bachelors",
          employmentType: "Permanent",
          designation: "Staff",
          resignationDate: "",
        },
      ],
      training: [
        {
          trainingName: "Leadership",
          trainingStart: "2021-03-01",
          trainingEnd: "2021-03-05",
          providerName: "ABC Institute",
          estimatedCost: "500",
          country: "Bhutan",
          fundingSource: "Government",
        },
      ],
    },
    {
      hasCitizenID: "no",
      citizenID: "",
      referenceNo: "REF001",
      name: "Pelden",
      gender: "Male",
      dob: "1990-05-01",
      email: "pelden@test.com",
      mobileNo: "17123457",
      employmentHistory: [
        {
          appointmentDate: "2019-01-01",
          qualificationAtServiceEntry: "Masters",
          employmentType: "Contract",
          designation: "Manager",
          resignationDate: "",
        },
      ],
      training: [
        {
          trainingName: "Project Management",
          trainingStart: "2022-01-01",
          trainingEnd: "2022-01-05",
          providerName: "XYZ Institute",
          estimatedCost: "700",
          country: "India",
          fundingSource: "Private",
        },
      ],
    },
  ]);

  const initialValues = {
    hasCitizenID: "yes",
    citizenID: "",
    name: "",
    email: "",
    mobileNo: "",
    referenceNo: "",
    gender: "",
    dob: "",
    employmentHistory: [
      {
        appointmentDate: "",
        qualificationAtServiceEntry: "",
        employmentType: "",
        designation: "",
        resignationDate: "",
      },
    ],
    training: [
      {
        trainingName: "",
        trainingStart: "",
        trainingEnd: "",
        providerName: "",
        estimatedCost: "",
        country: "",
        fundingSource: "",
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    hasCitizenID: Yup.string().required("Required"),
    citizenID: Yup.string()
      .nullable()
      .matches(/^\d{11}$/, "Citizen ID must be exactly 11 digits"),
    mobileNo: Yup.string()
      .nullable()
      .matches(/^\d{8}$/, "Mobile No must be exactly 8 digits"),
    email: Yup.string().nullable().email("Invalid email"),
    name: Yup.string().nullable(),
    referenceNo: Yup.string().nullable(),
    gender: Yup.string().nullable(),
    dob: Yup.string().nullable(),
  });

  const handleAddOrEditStaff = (values) => {
    if (editingIndex !== null) {
      const updated = [...staff];
      updated[editingIndex] = values;
      setStaff(updated);
    } else {
      setStaff([...staff, values]);
    }
    setOpenDialog(false);
    setEditingIndex(null);
  };

  const handleDelete = () => {
    const updated = [...staff];
    updated.splice(selectedIndex, 1);
    setStaff(updated);
    setOpenDeleteDialog(false);
    setSelectedIndex(null);
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.citizenID?.toLowerCase().includes(search.toLowerCase()) ||
      s.referenceNo?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Staff List(s)
      </Typography>

      {/* Search + Add */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        sx={{ mb: 2, justifyContent: "flex-end" }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Staff
          </Button>
        </Grid>
      </Grid>

      {/* Staff Table */}
      <TableContainer component={Paper}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Citizen ID / Reference No</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((staffMember, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                    <TableCell>{staffMember.name}</TableCell>
                    <TableCell>
                      {staffMember.citizenID || staffMember.referenceNo || "-"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setEditingIndex(index);
                          setOpenDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedIndex(index);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredStaff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(+event.target.value);
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? "Edit Staff" : "Add Staff"}
        </DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editingIndex !== null ? staff[editingIndex] : initialValues
            }
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleAddOrEditStaff}
          >
            {({ values, handleChange }) => (
              <Form>
                <Grid container spacing={2}>
                  {/* Has Citizen ID */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Typography>Has Citizen ID Number?</Typography>
                    <RadioGroup
                      row
                      name="hasCitizenID"
                      value={values.hasCitizenID}
                      onChange={handleChange}
                    >
                      <FormControlLabel
                        value="yes"
                        control={<Radio />}
                        label="Yes"
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio />}
                        label="No"
                      />
                    </RadioGroup>
                  </Grid>

                  {/* Fields */}
                  {values.hasCitizenID === "yes" ? (
                    <>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Citizen ID"
                          name="citizenID"
                          helperText={<ErrorMessage name="citizenID" />}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Name"
                          name="name"
                          helperText={<ErrorMessage name="name" />}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Email"
                          name="email"
                          helperText={<ErrorMessage name="email" />}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Mobile No"
                          name="mobileNo"
                          helperText={<ErrorMessage name="mobileNo" />}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Reference No"
                          name="referenceNo"
                          helperText={<ErrorMessage name="referenceNo" />}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Name"
                          name="name"
                          helperText={<ErrorMessage name="name" />}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 3 }}>
                        <Field
                          as={TextField}
                          select
                          fullWidth
                          size="small"
                          label="Gender"
                          name="gender"
                        >
                          <MenuItem value="">-select-</MenuItem>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                        </Field>
                      </Grid>
                      <Grid item size={{ xs: 12, md: 3 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          type="date"
                          label="DOB"
                          name="dob"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Email"
                          name="email"
                          helperText={<ErrorMessage name="email" />}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <Field
                          as={TextField}
                          fullWidth
                          size="small"
                          label="Mobile No"
                          name="mobileNo"
                          helperText={<ErrorMessage name="mobileNo" />}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Employment History */}
                  <Grid item size={{ xs: 12, md: 12 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Employment History
                    </Typography>
                    <FieldArray name="employmentHistory">
                      {({ push, remove, form }) => (
                        <>
                          {form.values.employmentHistory.map((_, idx) => (
                            <Grid
                              container
                              spacing={1}
                              key={idx}
                              sx={{ mb: 1, alignItems: "center" }}
                            >
                              <Grid item size={{ xs: 12, md: 4 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  type="date"
                                  label="Appointment Date"
                                  name={`employmentHistory.${idx}.appointmentDate`}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 4 }}>
                                <Field
                                  as={TextField}
                                  select
                                  fullWidth
                                  size="small"
                                  label="Qualification"
                                  name={`employmentHistory.${idx}.qualificationAtServiceEntry`}
                                >
                                  <MenuItem value="">-select-</MenuItem>
                                  <MenuItem value="Bachelors">
                                    Bachelors
                                  </MenuItem>
                                  <MenuItem value="Masters">Masters</MenuItem>
                                </Field>
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label="Designation"
                                  name={`employmentHistory.${idx}.designation`}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 1 }}>
                                {idx > 0 && (
                                  <IconButton
                                    onClick={() => remove(idx)}
                                    sx={{
                                      backgroundColor: "error.main",
                                      color: "#fff",
                                      "&:hover": {
                                        backgroundColor: "error.dark",
                                      },
                                      borderRadius: "50%",
                                      width: 30,
                                      height: 30,
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Grid>
                            </Grid>
                          ))}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              push({
                                appointmentDate: "",
                                qualificationAtServiceEntry: "",
                                employmentType: "",
                                designation: "",
                                resignationDate: "",
                              })
                            }
                          >
                            Add More
                          </Button>
                        </>
                      )}
                    </FieldArray>
                  </Grid>

                  {/* Training */}
                  <Grid item size={{ xs: 12, md: 12 }} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Training</Typography>
                    <FieldArray name="training">
                      {({ push, remove, form }) => (
                        <>
                          {form.values.training.map((_, idx) => (
                            <Grid
                              container
                              spacing={1}
                              key={idx}
                              sx={{ mb: 1, alignItems: "center" }}
                            >
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label="Training Name"
                                  name={`training.${idx}.trainingName`}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  type="date"
                                  label="Start Date"
                                  size="small"
                                  name={`training.${idx}.trainingStart`}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  type="date"
                                  label="End Date"
                                  size="small"
                                  name={`training.${idx}.trainingEnd`}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  label="Provider"
                                  size="small"
                                  name={`training.${idx}.providerName`}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  label="Cost"
                                  size="small"
                                  name={`training.${idx}.estimatedCost`}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label="Country"
                                  name={`training.${idx}.country`}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  label="Funding"
                                  name={`training.${idx}.fundingSource`}
                                />
                              </Grid>
                              <Grid item size={{ xs: 12, md: 3 }}>
                                {idx > 0 && (
                                  <IconButton
                                    onClick={() => remove(idx)}
                                    sx={{
                                      backgroundColor: "error.main",
                                      color: "#fff",
                                      "&:hover": {
                                        backgroundColor: "error.dark",
                                      },
                                      borderRadius: "50%",
                                      width: 30,
                                      height: 30,
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Grid>
                            </Grid>
                          ))}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              push({
                                trainingName: "",
                                trainingStart: "",
                                trainingEnd: "",
                                providerName: "",
                                estimatedCost: "",
                                country: "",
                                fundingSource: "",
                              })
                            }
                          >
                            Add More
                          </Button>
                        </>
                      )}
                    </FieldArray>
                  </Grid>

                  <Grid item size={{ xs: 12, md: 12 }} sx={{ mt: 2 }}>
                    <DialogActions>
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => setOpenDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="small"
                        variant="contained"
                        color="primary"
                      >
                        Save
                      </Button>
                    </DialogActions>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this staff entry?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary" size="small" variant="contained">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" size="small" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default StaffManagement;
