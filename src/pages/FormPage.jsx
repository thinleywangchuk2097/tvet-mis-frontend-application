import {
    Box,
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
  } from "@mui/material";
  import { useFormik } from "formik";
  import * as Yup from "yup";
  
  const FormPage = () => {
    const formik = useFormik({
      initialValues: {
        email: "",
      },
      validationSchema: Yup.object({
        email: Yup.string().email("Invalid email").required("Required"),
      }),
      onSubmit: (values) => {
        alert(JSON.stringify(values, null, 2));
      },
    });
  
    return (
      <Box maxWidth={500} mx="auto">
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              User Form
            </Typography>
            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                id="email"
                name="email"
                label="Email"
                variant="outlined"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
              <Box mt={2}>
                <Button
                  variant="contained"
                  fullWidth
                  type="submit"
                  sx={{ bgcolor: "#3B82F6", "&:hover": { bgcolor: "#2563EB" } }}
                >
                  Submit
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  export default FormPage;
  