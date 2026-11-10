import { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Divider,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
} from "@mui/material";
import {
  CalendarToday,
  Person,
  Email,
  Phone,
  CheckCircle,
  Close,
  Receipt,
  Payment as PaymentIcon,
  Verified,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import { useSelector } from "react-redux";

const CommonBirmsPayment = () => {
  const params = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const access_token = useSelector((state) => state.auth.accessToken);
  // State for URL parameters
  const [paymentParams, setPaymentParams] = useState({
    applicationNo: "",
    serviceCode: "",
    taxPayerNo: "",
    taxPayerEmail: "",
    taxPayerMobileNo: "",
    taxPayerName: "",
    instituteId: "",
  });

  // UI State
  const [activeStep, setActiveStep] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentAdviceData, setPaymentAdviceData] = useState(null);

  const [formValues, setFormValues] = useState({
    totalPayableAmount: "",
    paymentDueDate: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    "Enter Payment Details",
    "Review & Confirm",
    "Payment Complete",
  ];

  // Initialize state with URL parameters
  useEffect(() => {
    const {
      applicationNo,
      serviceCode,
      taxPayerNo,
      taxPayerEmail,
      taxPayerMobileNo,
      taxPayerName,
      instituteId,
    } = params;

    setPaymentParams({
      applicationNo: applicationNo || "",
      serviceCode: serviceCode || "",
      taxPayerNo: taxPayerNo || "",
      taxPayerEmail: taxPayerEmail || "",
      taxPayerMobileNo: taxPayerMobileNo || "",
      taxPayerName: taxPayerName || "",
      instituteId: instituteId || "",
    });

    // Store the application number for reference
    if (applicationNo) {
      sessionStorage.setItem("currentApplicationNo", applicationNo);
    }
  }, [params]);

  // Required label helper
  const requiredLabel = (label) => (
    <>
      {label}
      <Typography component="span" sx={{ color: "red" }}>
        *
      </Typography>
    </>
  );

  // Format currency in Ngultrum (Nu.)
  const formatCurrency = (amount) => {
    return `Nu. ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Initial values for Formik
  const initialValues = {
    totalPayableAmount: "",
    paymentDueDate: "",
  };

  // Validation schema
  const validationSchema = Yup.object().shape({
    totalPayableAmount: Yup.number()
      .required("Total payable amount is required")
      .positive("Amount must be greater than 0")
      .typeError("Please enter a valid amount"),
    paymentDueDate: Yup.date()
      .required("Payment due date is required")
      .min(
        new Date().toISOString().split("T")[0],
        "Due date cannot be in the past",
      ),
  });

  // Handle generate payment advice
  const handleGeneratePaymentAdvice = async (values) => {
    setIsGenerating(true);
    setError(null);

    try {
      const paymentRequest = {
        refNo: paymentParams.applicationNo,
        instituteId: paymentParams.instituteId,
        serviceCode: paymentParams.serviceCode,
        taxPayerNo: paymentParams.taxPayerNo,
        taxPayerEmail: paymentParams.taxPayerEmail,
        taxPayerMobileNo: paymentParams.taxPayerMobileNo,
        taxPayerName: paymentParams.taxPayerName,
        totalPayableAmount: parseFloat(values.totalPayableAmount),
        paymentDueDate: values.paymentDueDate,
      };

      const response = await BirmsPaymentService.generatePaymentAdvice(
        paymentRequest,
        access_token,
      );
      if (response.status === 200 || response.status === 201) {
        // Get the data from response
        const data = response.data;
        // Check if data has content with redirectUrl
        let redirectUrl = null;
        if (data && data.content && data.content.redirectUrl) {
          redirectUrl = data.content.redirectUrl;
        } else if (data && data.redirectUrl) {
          redirectUrl = data.redirectUrl;
        }
        if (redirectUrl) {
          // Open redirect URL in new tab with full reload
          const newWindow = window.open(
            redirectUrl,
            "_blank",
            "noopener,noreferrer",
          );
          if (newWindow) {
            toast.success(
              "Payment advice generated! Redirecting to payment page...",
            );
          } else {
            // If popup is blocked, provide manual link
            toast.warning(
              "Please allow popups or click the button below to proceed to payment.",
            );
          }
        } else {
          toast.success("Payment advice generated successfully!");
        }

        setPaymentAdviceData(data);
        setIsGenerating(false);
        setOpenDialog(false);
        setActiveStep(2);

        //  Go back to previous page with success state
        // Store payment success data in sessionStorage for persistence
        sessionStorage.setItem(
          "paymentSuccess",
          JSON.stringify({
            ...paymentParams,
            ...values,
            paymentAdvice: data,
            paymentStatus: "success",
            timestamp: new Date().toISOString(),
          }),
        );

        // Navigate back with state
        navigate(-1, {
          state: {
            ...paymentParams,
            ...values,
            paymentAdvice: data,
            paymentStatus: "success",
            timestamp: new Date().toISOString(),
            fromPayment: true,
          },
        });

        return; // Exit after navigation
      } else {
        setError(response.data?.message || "Failed to generate payment advice");
        toast.error(
          response.data?.message || "Failed to generate payment advice",
        );
        setIsGenerating(false);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Payment processing failed";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Payment error:", err);
      setIsGenerating(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setLoading(true);
    setError(null);

    try {
      const paymentRequest = {
        applicationNo: paymentParams.applicationNo,
        instituteId: paymentParams.instituteId,
        serviceCode: paymentParams.serviceCode,
        taxPayerNo: paymentParams.taxPayerNo,
        taxPayerEmail: paymentParams.taxPayerEmail,
        taxPayerMobileNo: paymentParams.taxPayerMobileNo,
        taxPayerName: paymentParams.taxPayerName,
        totalPayableAmount: parseFloat(values.totalPayableAmount),
        paymentDueDate: values.paymentDueDate,
      };

      const response = await BirmsPaymentService.generatePaymentAdvice(
        paymentRequest,
        access_token,
      );
      if (response.status === 200 || response.status === 201) {
        setPaymentAdviceData(response.data);
        setActiveStep(2);
        toast.success("Payment advice generated successfully!");
        resetForm();
        setOpenDialog(false);
        setFormValues({ totalPayableAmount: "", paymentDueDate: "" });

        // Store payment success data in sessionStorage for persistence
        sessionStorage.setItem(
          "paymentSuccess",
          JSON.stringify({
            ...paymentParams,
            ...values,
            paymentAdvice: response.data,
            paymentStatus: "success",
            timestamp: new Date().toISOString(),
          }),
        );

        navigate(-1, {
          state: {
            ...paymentParams,
            ...values,
            paymentAdvice: response.data,
            paymentStatus: "success",
            timestamp: new Date().toISOString(),
            fromPayment: true,
          },
        });

        return; // Exit after navigation
      } else {
        setError(response.data?.message || "Failed to generate payment advice");
        toast.error(
          response.data?.message || "Failed to generate payment advice",
        );
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Payment processing failed";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Handle dialog open - store current form values
  const handleOpenDialog = (values) => {
    setFormValues({
      totalPayableAmount: values.totalPayableAmount,
      paymentDueDate: values.paymentDueDate,
    });
    setOpenDialog(true);
    setError(null);
    setPaymentAdviceData(null);
    setIsGenerating(false);
  };

  const handleCloseDialog = () => {
    if (!isGenerating) {
      setOpenDialog(false);
      setError(null);
      setPaymentAdviceData(null);
      setIsGenerating(false);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Function to open redirect URL
  const openRedirectUrl = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Get redirect URL from paymentAdviceData
  const getRedirectUrl = () => {
    if (paymentAdviceData) {
      if (paymentAdviceData.content && paymentAdviceData.content.redirectUrl) {
        return paymentAdviceData.content.redirectUrl;
      }
      if (paymentAdviceData.redirectUrl) {
        return paymentAdviceData.redirectUrl;
      }
    }
    return null;
  };

  // label-over-value row used in the Application Information card
  const infoFields = [
    { label: "Application No", value: paymentParams.applicationNo, icon: <Receipt /> },
    { label: "Service Code", value: paymentParams.serviceCode, icon: <Receipt /> },
    { label: "Tax Payer", value: paymentParams.taxPayerName, icon: <Person /> },
    { label: "Tax Payer No", value: paymentParams.taxPayerNo, icon: <Person /> },
    { label: "Email", value: paymentParams.taxPayerEmail, icon: <Email /> },
    { label: "Mobile", value: paymentParams.taxPayerMobileNo, icon: <Phone /> },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{ m: 2, borderRadius: 2, overflow: "hidden" }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar
          variant="rounded"
          sx={{ bgcolor: "primary.main", width: 40, height: 40 }}
        >
          <PaymentIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.2 }}>
            BIRMS Payment
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Complete your payment process securely
          </Typography>
        </Box>
        <Chip
          icon={<Verified />}
          label="Secure payment"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Box sx={{ p: 3 }}>
      {/* Application Information Card */}
      <Paper
        variant="outlined"
        sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f9fa",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>
            Application Information
          </Typography>
        </Box>
        <Grid container spacing={2} sx={{ p: 2 }}>
          {infoFields.map((f) => (
            <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={f.label}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    color: "primary.main",
                    display: "flex",
                    mt: "2px",
                    "& svg": { fontSize: 18 },
                  }}
                >
                  {f.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {f.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      wordBreak: "break-word",
                    }}
                  >
                    {f.value || "—"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Payment Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <Form>
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label={requiredLabel("Total Payable Amount (Nu.)")}
                    name="totalPayableAmount"
                    type="number"
                    size="small"
                    value={formik.values.totalPayableAmount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.totalPayableAmount &&
                      Boolean(formik.errors.totalPayableAmount)
                    }
                    helperText={
                      formik.touched.totalPayableAmount &&
                      formik.errors.totalPayableAmount
                    }
                    disabled={loading || isGenerating}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="body2" fontWeight="bold">
                            Nu.
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    placeholder="0.00"
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label={requiredLabel("Payment Due Date")}
                    name="paymentDueDate"
                    type="date"
                    size="small"
                    value={formik.values.paymentDueDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.paymentDueDate &&
                      Boolean(formik.errors.paymentDueDate)
                    }
                    helperText={
                      formik.touched.paymentDueDate &&
                      formik.errors.paymentDueDate
                    }
                    disabled={loading || isGenerating}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: new Date().toISOString().split("T")[0],
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Paper
                variant="outlined"
                sx={{ borderRadius: 2, overflow: "hidden" }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor:
                      theme.palette.mode === "dark" ? "grey.900" : "#f8f9fa",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>
                    Review Payment Details
                  </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  {/* label over value, same as Application Information */}
                  <Grid container spacing={2}>
                    {[
                      { label: "Application No", value: paymentParams.applicationNo },
                      { label: "Service Code", value: paymentParams.serviceCode },
                      { label: "Tax Payer", value: paymentParams.taxPayerName },
                      {
                        label: "Due Date",
                        value: formatDate(formik.values.paymentDueDate),
                      },
                    ].map((f) => (
                      <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={f.label}>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            letterSpacing: 0.4,
                            textTransform: "uppercase",
                            color: "text.secondary",
                          }}
                        >
                          {f.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            wordBreak: "break-word",
                          }}
                        >
                          {f.value || "—"}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Total Amount */}
                  <Box
                    sx={{
                      mt: 2,
                      px: 2,
                      py: 1.25,
                      borderRadius: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Total Amount
                    </Typography>
                    <Typography
                      color="primary"
                      sx={{ fontWeight: 700, fontSize: "1.1rem" }}
                    >
                      {formatCurrency(formik.values.totalPayableAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {activeStep === 2 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "success.main",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom color="success.main">
                  Payment Advice Generated!
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Your payment advice has been generated successfully.
                </Typography>
                {paymentAdviceData && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor:
                        theme.palette.mode === "dark" ? "grey.900" : "#f8f9fa",
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Payment Advice No:{" "}
                      <strong style={{ color: theme.palette.text.primary }}>
                        {paymentAdviceData?.content?.paymentAdviceNo ||
                          paymentAdviceData?.paymentAdviceNo ||
                          "N/A"}
                      </strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Amount:{" "}
                      <strong style={{ color: theme.palette.text.primary }}>
                        {formatCurrency(
                          paymentAdviceData?.content?.totalPayableAmount ||
                            paymentAdviceData?.totalPayableAmount ||
                            0,
                        )}
                      </strong>
                    </Typography>
                    <Chip
                      label={
                        paymentAdviceData?.content?.paymentStatus ||
                        paymentAdviceData?.paymentStatus ||
                        "Pending"
                      }
                      color="success"
                      size="small"
                      sx={{ mt: 1 }}
                    />

                    {/* Redirect URL Button */}
                    {getRedirectUrl() && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="medium"
                        onClick={() => openRedirectUrl(getRedirectUrl())}
                        startIcon={<OpenInNewIcon />}
                        sx={{ mt: 2 }}
                      >
                        Proceed to Payment
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Navigation Buttons */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || activeStep === 2}
                variant="outlined"
                size="medium"
                startIcon={<FastRewindIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Back
              </Button>
              {activeStep === 0 && (
                <Button
                  type="button"
                  onClick={() => {
                    formik.validateForm().then((errors) => {
                      if (Object.keys(errors).length === 0) {
                        setActiveStep(1);
                      } else {
                        formik.setTouched(
                          Object.keys(errors).reduce((acc, key) => {
                            acc[key] = true;
                            return acc;
                          }, {}),
                        );
                      }
                    });
                  }}
                  variant="contained"
                  color="primary"
                  size="medium"
                  endIcon={<FastForwardIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.darker || theme.palette.primary.dark} 100%)`,
                    },
                  }}
                >
                  Next
                </Button>
              )}
              {activeStep === 1 && (
                <Button
                  type="button"
                  onClick={() => handleOpenDialog(formik.values)}
                  variant="contained"
                  color="primary"
                  size="medium"
                  endIcon={<FastForwardIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.darker || theme.palette.primary.dark} 100%)`,
                    },
                  }}
                >
                  Proceed PA Genaration
                </Button>
              )}
              {activeStep === 2 && (
                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  size="medium"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    //Go back to previous page with success state
                    if (paymentAdviceData) {
                      sessionStorage.setItem(
                        "paymentSuccess",
                        JSON.stringify({
                          ...paymentParams,
                          paymentAdvice: paymentAdviceData,
                          paymentStatus: "success",
                          timestamp: new Date().toISOString(),
                        }),
                      );
                    }

                    navigate(-1, {
                      state: {
                        ...paymentParams,
                        paymentAdvice: paymentAdviceData,
                        paymentStatus: "success",
                        fromPayment: true,
                        timestamp: new Date().toISOString(),
                      },
                    });
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  Go Back
                </Button>
              )}
            </Box>
          </Form>
        )}
      </Formik>

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
          },
        }}
      >
        {/* Loading Overlay */}
        {isGenerating && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(255, 255, 255, 0.85)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
            }}
          >
            <CircularProgress size={50} thickness={4} />
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              Generating Payment Advice...
            </Typography>
          </Box>
        )}

        {/* Compact Header */}
        <Box
          sx={{
            bgcolor: theme.palette.primary.main,
            py: 1.5,
            px: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PaymentIcon sx={{ color: "white", fontSize: 20 }} />
            <Typography
              variant="subtitle1"
              sx={{ color: "white", fontWeight: 600 }}
            >
              Payment Confirmation
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            disabled={isGenerating}
            sx={{
              color: "white",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              p: 0.5,
            }}
            size="small"
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              mb: 2,
              display: "block",
            }}
          >
            Please review and confirm your payment details
          </Typography>

          {/* Compact Application Details */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
              >
                Application Number
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{ color: theme.palette.text.primary }}
              >
                {paymentParams.applicationNo}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
              >
                Tax Payer Name
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{ color: theme.palette.text.primary }}
              >
                {paymentParams.taxPayerName}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Compact Payment Details */}
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              display: "block",
              mb: 1,
            }}
          >
            Payment Details
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Total Amount - Highlighted */}
            <Box
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                borderRadius: 1.5,
                px: 2,
                py: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
              >
                Total Amount
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(formValues.totalPayableAmount)}
              </Typography>
            </Box>

            {/* Due Date & Service Code */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
            >
              <Box
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark" ? "grey.900" : "#f8f9fa",
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
                >
                  Due Date
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CalendarToday
                    sx={{ fontSize: 12, color: theme.palette.text.secondary }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {formatDate(formValues.paymentDueDate)}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark" ? "grey.900" : "#f8f9fa",
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
                >
                  Service Code
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {paymentParams.serviceCode}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Compact Payment Advice Section */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: alpha(theme.palette.info.main, 0.06),
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CurrencyExchangeIcon
                sx={{ fontSize: 18, color: theme.palette.info.main }}
              />
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.primary }}
              >
                {paymentAdviceData ? (
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                    label={`PA: ${
                      paymentAdviceData?.content?.paymentAdviceNo ||
                      paymentAdviceData?.paymentAdviceNo ||
                      "N/A"
                    }`}
                    color="success"
                    size="small"
                  />
                ) : (
                  "Click Generate PA to create payment advice"
                )}
              </Typography>
            </Box>
          </Box>

          {/* Compact Verification Badge */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 1.5,
              p: 1,
              bgcolor: alpha(theme.palette.success.main, 0.06),
              borderRadius: 1.5,
            }}
          >
            <Verified sx={{ fontSize: 14, color: "success.main" }} />
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              Verify details before generating PA
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 1.5 }} size="small">
              {error}
            </Alert>
          )}
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            disabled={isGenerating}
            startIcon={<FastRewindIcon sx={{ fontSize: 18 }} />}
            size="small"
            sx={{
              flex: 1,
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              borderColor: theme.palette.divider,
              py: 0.75,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={isGenerating}
            startIcon={
              isGenerating ? (
                <CircularProgress size={16} />
              ) : (
                <CurrencyExchangeIcon />
              )
            }
            onClick={() => handleGeneratePaymentAdvice(formValues)}
            size="small"
            sx={{
              flex: 2,
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              py: 0.75,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.darker || theme.palette.success.dark} 100%)`,
              },
            }}
          >
            {isGenerating ? "Generating..." : "Generate PA"}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Paper>
  );
};

export default CommonBirmsPayment;
