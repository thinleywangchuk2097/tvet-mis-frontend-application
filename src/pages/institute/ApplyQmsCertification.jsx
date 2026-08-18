import { useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  remarks: Yup.string(),
});

const ApplyQmsCertification = () => {
  const [open, setOpen] = useState(false);
  const [applications, setApplications] = useState([]);

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setApplications((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Apply QMS Certification</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Apply
        </Button>
      </Grid>

      {/* Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": { border: "1px solid #ccc" },
            mb: 3,
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Application No</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {applications.length > 0 ? (
              applications.map((app, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{app.instituteName}</TableCell>
                  <TableCell>{app.remarks}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(index)}
                      sx={{
                        "&:hover": { backgroundColor: "rgba(255,0,0,0.1)" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Apply Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Apply QMS Certification</DialogTitle>

        <Formik
          initialValues={{
            instituteName: "Robotics & IoT Training Institute",
            location:
              "Doendrup Lam SE, Sangay Enterprise Building , Third Floor.",
            contactPerson: "Pelden",
            contactNo: "17621843",
            email: "youthroboticsiot@gmail.com",
            dateOfRegistration: "2024-06-26 16:31:49",
            registrationNo: "2024060155",
            remarks: "",
            qmsCertificate: null,
            auditReport: null,
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setApplications((prev) => [...prev, values]);
            setOpen(false);
          }}
        >
          {({ handleChange, setFieldValue, values }) => (
            <Form>
              <DialogContent>
                {/* Institute Details */}
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  Institute Information
                </Typography>

                <Table
                  size="small"
                  sx={{
                    border: "1px solid #ccc",
                    mb: 3,
                    "& td": { border: "1px solid #ccc" },
                  }}
                >
                  <TableBody>
                    <TableRow>
                      <TableCell width="30%">Institute Name</TableCell>
                      <TableCell>{values.instituteName}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Location</TableCell>
                      <TableCell>{values.location}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Contact Person</TableCell>
                      <TableCell>{values.contactPerson}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Contact No</TableCell>
                      <TableCell>{values.contactNo}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Email Address</TableCell>
                      <TableCell>{values.email}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Date of Registration</TableCell>
                      <TableCell>{values.dateOfRegistration}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Registration No.</TableCell>
                      <TableCell>{values.registrationNo}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Remarks */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Remarks"
                  name="remarks"
                  value={values.remarks}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                />

                {/* Supporting Documents */}
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  Supporting Documents
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      1. QMS Manual Endorsement Certificate
                    </Typography>

                    <TextField
                      type="file"
                      fullWidth
                      size="small"
                      onChange={(e) =>
                        setFieldValue("qmsCertificate", e.target.files[0])
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2">
                      2. Internal Audit Report
                    </Typography>

                    <TextField
                      type="file"
                      fullWidth
                      size="small"
                      onChange={(e) =>
                        setFieldValue("auditReport", e.target.files[0])
                      }
                    />
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant="contained">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Paper>
  );
};

export default ApplyQmsCertification;
