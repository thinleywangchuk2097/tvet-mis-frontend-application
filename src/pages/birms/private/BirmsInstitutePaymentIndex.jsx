import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  CircularProgress
} from "@mui/material";
import ReceiptIcon from "@mui/icons-material/Receipt";

const BirmsInstitutePaymentIndex = () => {
  const { applicationNo, serviceCode, institueId } = useParams();
  
  // State for course details
  const [courseDetails, setCourseDetails] = useState(null);
  
  // State for PA Dialog
  const [paDialogOpen, setPaDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // PA Form Data
  const [paData, setPaData] = useState({
    taxPayerNo: "",
    payerEmail: "",
    mobileNo: "",
    taxPayerName: "",
    paymentDueDate: "",
    refNo: "",
    totalPayableAmount: ""
  });
  
  // PA Form Errors
  const [paErrors, setPaErrors] = useState({
    taxPayerNo: "",
    payerEmail: "",
    mobileNo: "",
    taxPayerName: "",
    paymentDueDate: "",
    refNo: "",
    totalPayableAmount: ""
  });

  // Load course details or other data when component mounts
  useEffect(() => {
    // Fetch course details or initialize data
    // For example:
    // fetchCourseDetails();
  }, [applicationNo, serviceCode, institueId]);

  // Handle PA Dialog open/close
  const handlePADialogOpen = () => {
    setPaDialogOpen(true);
    // Optionally set default values
    // setPaData({ ...paData, refNo: generateRefNo() });
  };

  const handlePADialogClose = () => {
    setPaDialogOpen(false);
    // Reset form
    setPaData({
      taxPayerNo: "",
      payerEmail: "",
      mobileNo: "",
      taxPayerName: "",
      paymentDueDate: "",
      refNo: "",
      totalPayableAmount: ""
    });
    setPaErrors({
      taxPayerNo: "",
      payerEmail: "",
      mobileNo: "",
      taxPayerName: "",
      paymentDueDate: "",
      refNo: "",
      totalPayableAmount: ""
    });
  };

  // Handle PA form data changes
  const handlePADataChange = (field, value) => {
    setPaData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field
    if (paErrors[field]) {
      setPaErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate PA form
  const validatePAForm = () => {
    const errors = {};
    
    if (!paData.taxPayerNo) errors.taxPayerNo = "Tax Payer No is required";
    if (!paData.payerEmail) errors.payerEmail = "Payer Email is required";
    else if (!/\S+@\S+\.\S+/.test(paData.payerEmail)) {
      errors.payerEmail = "Email is invalid";
    }
    if (!paData.mobileNo) errors.mobileNo = "Mobile No is required";
    else if (!/^\d{8}$/.test(paData.mobileNo)) {
      errors.mobileNo = "Mobile number must be 8 digits";
    }
    if (!paData.taxPayerName) errors.taxPayerName = "Tax Payer Name is required";
    if (!paData.paymentDueDate) errors.paymentDueDate = "Payment Due Date is required";
    if (!paData.refNo) errors.refNo = "Reference No is required";
    if (!paData.totalPayableAmount) errors.totalPayableAmount = "Total Payable Amount is required";
    else if (parseFloat(paData.totalPayableAmount) <= 0) {
      errors.totalPayableAmount = "Amount must be greater than 0";
    }

    setPaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Generate PA
  const handleGeneratePA = async () => {
    if (!validatePAForm()) return;

    setActionLoading(true);
    try {
      // Call your API service to generate PA
      // const response = await BirmsPaymentService.generatePaymentAdvice({
      //   applicationNo,
      //   serviceCode,
      //   institueId,
      //   ...paData
      // });
      
      // Handle success
      console.log("Generating PA with data:", paData);
      
      // Close dialog after successful generation
      handlePADialogClose();
      
      // Show success message or navigate
    } catch (error) {
      console.error("Error generating PA:", error);
      // Handle error
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Your existing component content */}
      
      {/* Button to open PA Dialog - Add this where you want to trigger the dialog */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<ReceiptIcon />}
        onClick={handlePADialogOpen}
      >
        Generate Payment Advice
      </Button>

      {/* Payment Advice (PA) Dialog */}
      <Dialog
        open={paDialogOpen}
        onClose={handlePADialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptIcon color="primary" />
          Generate Payment Advice
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide the following details to generate the Payment Advice
            for course:
            <strong> {courseDetails?.course_name || "N/A"}</strong>
          </DialogContentText>

          <Grid container spacing={2}>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Tax Payer No"
                fullWidth
                value={paData.taxPayerNo}
                onChange={(e) =>
                  handlePADataChange("taxPayerNo", e.target.value)
                }
                error={!!paErrors.taxPayerNo}
                helperText={paErrors.taxPayerNo}
                required
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Payer Email"
                fullWidth
                type="email"
                value={paData.payerEmail}
                onChange={(e) =>
                  handlePADataChange("payerEmail", e.target.value)
                }
                error={!!paErrors.payerEmail}
                helperText={paErrors.payerEmail}
                required
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Mobile No"
                fullWidth
                value={paData.mobileNo}
                onChange={(e) => handlePADataChange("mobileNo", e.target.value)}
                error={!!paErrors.mobileNo}
                helperText={paErrors.mobileNo || "Enter 8 digits mobile number"}
                required
                inputProps={{ maxLength: 8 }}
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Tax Payer Name"
                fullWidth
                value={paData.taxPayerName}
                onChange={(e) =>
                  handlePADataChange("taxPayerName", e.target.value)
                }
                error={!!paErrors.taxPayerName}
                helperText={paErrors.taxPayerName}
                required
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Payment Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={paData.paymentDueDate}
                onChange={(e) =>
                  handlePADataChange("paymentDueDate", e.target.value)
                }
                error={!!paErrors.paymentDueDate}
                helperText={paErrors.paymentDueDate}
                required
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Reference No"
                fullWidth
                value={paData.refNo}
                onChange={(e) => handlePADataChange("refNo", e.target.value)}
                error={!!paErrors.refNo}
                helperText={paErrors.refNo}
                required
                disabled
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                label="Total Payable Amount"
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: (
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Nu.
                    </Typography>
                  ),
                }}
                value={paData.totalPayableAmount}
                onChange={(e) =>
                  handlePADataChange("totalPayableAmount", e.target.value)
                }
                error={!!paErrors.totalPayableAmount}
                helperText={
                  paErrors.totalPayableAmount ||
                  "Enter the total amount payable"
                }
                required
                placeholder="Enter amount"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={handlePADialogClose}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGeneratePA}
            color="primary"
            variant="contained"
            size="small"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={20} /> : <ReceiptIcon />
            }
          >
            {actionLoading ? "Generating..." : "Generate PA"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BirmsInstitutePaymentIndex;