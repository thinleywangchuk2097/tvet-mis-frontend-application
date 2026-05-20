import React, { useState } from "react";
import {
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const AddTrainer = () => {
  const [trainers, setTrainers] = useState([
    {
      hasCitizenId: "yes",
      nationality: "Bhutanese",
      citizenId: "10502000269",
      workPermitNo: "",
      name: "Pelden",
      gender: "Male",
      qualification: "Bachelor in Engineering",
      workExperience: "5",
      employmentType: "Full time",
    },
    {
      hasCitizenId: "yes",
      nationality: "Bhutanese",
      citizenId: "10502000270",
      workPermitNo: "",
      name: "Sanjana Pradhan",
      gender: "Female",
      qualification: "Master in Computer Science",
      workExperience: "3",
      employmentType: "Part time",
    },
  ]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const initialValues = {
    hasCitizenId: "yes",
    nationality: "",
    citizenId: "",
    workPermitNo: "",
    name: "",
    gender: "",
    qualification: "",
    workExperience: "",
    employmentType: "",
  };

  const validationSchema = Yup.object().shape({
    hasCitizenId: Yup.string().required("Required"),
    nationality: Yup.string().when("hasCitizenId", {
      is: "yes",
      then: Yup.string().required("Nationality is required"),
    }),
    citizenId: Yup.string().when("hasCitizenId", {
      is: "yes",
      then: Yup.string().required("Citizen ID is required"),
    }),
    workPermitNo: Yup.string().when("hasCitizenId", {
      is: "no",
      then: Yup.string().required("Work Permit No/Reference No is required"),
    }),
    name: Yup.string().required("Name is required"),
    gender: Yup.string().required("Gender is required"),
    qualification: Yup.string().required("Qualification is required"),
    workExperience: Yup.string().required("Work Experience is required"),
    employmentType: Yup.string().required("Employment Type is required"),
  });

  const filteredTrainers = trainers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this trainer?")) {
      setTrainers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Format display for table
  const getTrainerId = (trainer) => {
    if (trainer.hasCitizenId === "yes") {
      return trainer.citizenId;
    } else {
      return trainer.workPermitNo;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header + Search + Add */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Trainers List</Typography>
        <Grid item>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <TextField
                size="small"
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                Add Trainer
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th,& td": { border: "1px solid #ccc" },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>ID/Reference No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Work Exp(Yrs)</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainers.length > 0 ? (
              filteredTrainers.map((trainer, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{getTrainerId(trainer)}</TableCell>
                  <TableCell>{trainer.name}</TableCell>
                  <TableCell>{trainer.gender}</TableCell>
                  <TableCell>{trainer.qualification}</TableCell>
                  <TableCell>{trainer.workExperience}</TableCell>
                  <TableCell>{trainer.employmentType}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      sx={{
                        minWidth: "36px",
                        mr: 1,
                        borderRadius: "50%",
                        bgcolor: "#eee",
                        "&:hover": { bgcolor: "#ddd" },
                      }}
                    >
                      <RemoveRedEyeIcon fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      sx={{
                        minWidth: "36px",
                        mr: 1,
                        borderRadius: "50%",
                        bgcolor: "#eee",
                        "&:hover": { bgcolor: "#ddd" },
                      }}
                      onClick={() => {
                        setEditIndex(index);
                        setOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      sx={{
                        minWidth: "36px",
                        borderRadius: "50%",
                        bgcolor: "#eee",
                        color: "red",
                        "&:hover": { bgcolor: "#fdd" },
                      }}
                      onClick={() => handleDelete(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No data available in table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Trainer Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editIndex !== null ? "Edit Trainer" : "Add Trainer"}
        </DialogTitle>
        <Formik
          initialValues={
            editIndex !== null ? trainers[editIndex] : initialValues
          }
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            if (editIndex !== null) {
              const updated = [...trainers];
              updated[editIndex] = values;
              setTrainers(updated);
            } else {
              setTrainers((prev) => [...prev, values]);
            }
            resetForm();
            setOpen(false);
          }}
        >
          {({
            values,
            handleChange,
            handleBlur,
            setFieldValue,
            errors,
            touched,
          }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Citizen ID Radio */}
                  <Grid item size={{ xs: 12 }}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">
                        Has Citizen ID Number?
                      </FormLabel>
                      <RadioGroup
                        row
                        name="hasCitizenId"
                        value={values.hasCitizenId}
                        onChange={(e) => {
                          setFieldValue("hasCitizenId", e.target.value);
                          // Clear the opposite field when switching
                          if (e.target.value === "yes") {
                            setFieldValue("workPermitNo", "");
                          } else {
                            setFieldValue("citizenId", "");
                            setFieldValue("nationality", "");
                          }
                        }}
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
                    </FormControl>
                  </Grid>

                  {/* Conditional fields based on radio selection */}
                  {values.hasCitizenId === "yes" && (
                    <>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Nationality"
                          name="nationality"
                          size="small"
                          value={values.nationality}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.nationality && Boolean(errors.nationality)
                          }
                          helperText={touched.nationality && errors.nationality}
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Citizen ID No"
                          name="citizenId"
                          size="small"
                          value={values.citizenId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.citizenId && Boolean(errors.citizenId)}
                          helperText={touched.citizenId && errors.citizenId}
                        />
                      </Grid>
                    </>
                  )}

                  {values.hasCitizenId === "no" && (
                    <Grid item size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Work Permit No/Reference No"
                        name="workPermitNo"
                        size="small"
                        value={values.workPermitNo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.workPermitNo && Boolean(errors.workPermitNo)
                        }
                        helperText={touched.workPermitNo && errors.workPermitNo}
                      />
                    </Grid>
                  )}

                  {/* Common fields */}
                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      size="small"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Gender"
                      name="gender"
                      size="small"
                      value={values.gender}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.gender && Boolean(errors.gender)}
                      helperText={touched.gender && errors.gender}
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Qualification (Education/Training)"
                      name="qualification"
                      size="small"
                      value={values.qualification}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.qualification && Boolean(errors.qualification)
                      }
                      helperText={touched.qualification && errors.qualification}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      label="Work Experience (Yrs)"
                      name="workExperience"
                      value={values.workExperience}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.workExperience && Boolean(errors.workExperience)
                      }
                      helperText={
                        touched.workExperience && errors.workExperience
                      }
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Full time/Part time"
                      name="employmentType"
                      size="small"
                      value={values.employmentType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.employmentType && Boolean(errors.employmentType)
                      }
                      helperText={
                        touched.employmentType && errors.employmentType
                      }
                    >
                      <MenuItem value="">-select-</MenuItem>
                      <MenuItem value="Full time">Full time</MenuItem>
                      <MenuItem value="Part time">Part time</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Supporting Documents Section */}
                  <Grid item size={{ xs: 12 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mt: 2, fontWeight: "bold" }}
                    >
                      Supporting Documents
                    </Typography>
                  </Grid>

                  <Grid item size={{ xs: 12 }}>
                    <Typography variant="body2">1. Trainer CV</Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Upload CV
                      <input type="file" hidden accept=".pdf,.doc,.docx" />
                    </Button>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpen(false)} color="error">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  {editIndex !== null ? "Update" : "Save"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default AddTrainer;
