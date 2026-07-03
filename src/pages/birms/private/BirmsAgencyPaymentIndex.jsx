import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
  Typography,
  Chip,
  IconButton,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import PaymentIcon from "@mui/icons-material/Payment";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/internal/common/CommonService";
import PublicPageService from "../../../api/services/internal/public/PublicPageService";
import BirmsPaymentService from "../../../api/services/internal/birms/BirmsPaymentService";
import { exportToExcel } from "@/utils/exportExcel";

const BirmsAgencyPaymentIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentToCancel, setPaymentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingReceipts, setDownloadingReceipts] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankNames, setBankNames] = useState([]);
  const [receiptData, setReceiptData] = useState(null);

  // Filter states
  const [institutes, setInstitutes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const actionId = useSelector((state) => state.auth.id);

  // Fetch data on component mount
  useEffect(() => {
    fetchPaymentDetails();
    fetchDropdownData();
    fetchInstitutes();
  }, []);

  // Apply filters whenever filter criteria or payments change
  useEffect(() => {
    applyFilters();
  }, [payments, search, selectedInstitute, selectedCourse, selectedStatus]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await BirmsPaymentService.getAllPaymentDetails();
      console.log("Payment details from API:", response.data);

      // Map the API response to the format expected by the component
      const mappedPayments = response.data.map((item, index) => ({
        id: parseInt(item.id) || index + 1,
        payment_no: item.payment_advice_no || `PAY-${Date.now()}-${index}`,
        paymentAdviceNo: item.payment_advice_no,
        payment_advice_no: item.payment_advice_no,
        invoice_no: item.ref_no || `INV-${Date.now()}-${index}`,
        amount: parseFloat(item.total_payable_amount) || 0,
        payment_date:
          item.payment_due_date || item.created_at || new Date().toISOString(),
        payment_method_id: null,
        bank_name_id: null,
        transaction_ref: item.ref_no || "N/A",
        status_id:
          item.payment_status === "paid"
            ? 56
            : item.payment_status === "pending"
              ? 55
              : 57,
        description: item.description || "Course Fee",
        created_at: item.created_at,
        institute_id: parseInt(item.institute_id) || null,
        institute_name: item.institute_name || "N/A",
        course_id: parseInt(item.course_id) || null,
        course_name: item.course_name || "Course",
        total_trainees: 0,
        agency_code: item.agency_code,
        application_no: item.application_no,
        mobile_no: item.mobile_no,
        payer_email: item.payer_email,
        payment_status: item.payment_status,
        platform: item.platform,
        receipt_no: item.receipt_no,
        receipt_status: item.receipt_status,
        redirect_url: item.redirect_url,
        service_code: item.service_code,
        tax_payer_name: item.tax_payer_name,
        tax_payer_no: item.tax_payer_no,
        payment_request_date: item.payment_request_date,
        payment_mode: item.payment_mode,
      }));

      setPayments(mappedPayments);
      console.log("Mapped payments:", mappedPayments);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("Failed to fetch payment details");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const paymentMethodResponse = await CommonService.getByParentId(20);
      setPaymentMethods(paymentMethodResponse.data || []);

      const bankResponse = await CommonService.getByParentId(21);
      setBankNames(bankResponse.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchInstitutes = async () => {
    try {
      const response = await PublicPageService.getAllInstitutes();
      console.log("Institute details:", response.data);

      const mappedInstitutes = response.data.map((item) => ({
        id: item.institute_id,
        name: item.proposed_institute_name,
      }));

      setInstitutes(mappedInstitutes);
      console.log("Mapped institutes for dropdown:", mappedInstitutes);
    } catch (error) {
      console.error("Error fetching institutes:", error);
      toast.error("Failed to fetch institutes");
      setInstitutes([]);
    }
  };

  const fetchCoursesByInstitute = async (instituteId) => {
    if (!instituteId) {
      setCourses([]);
      return;
    }

    try {
      setLoading(true);
      const response =
        await BirmsPaymentService.getCourseByInstituteId(instituteId);
      console.log("Courses response:", response.data);

      const mappedCourses = response.data.map((item) => ({
        id: item.course_id || item.id,
        name: item.course_name || item.name,
      }));

      setCourses(mappedCourses);
      console.log("Mapped courses:", mappedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (event) => {
    const instituteId = event.target.value;
    setSelectedInstitute(instituteId);
    setSelectedCourse("");
    if (instituteId) {
      fetchCoursesByInstitute(instituteId);
    } else {
      setCourses([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (search) {
      filtered = filtered.filter(
        (payment) =>
          payment.payment_no?.toLowerCase().includes(search.toLowerCase()) ||
          payment.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
          payment.transaction_ref
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          payment.tax_payer_name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (selectedInstitute) {
      filtered = filtered.filter(
        (payment) => payment.institute_id === parseInt(selectedInstitute),
      );
    }

    if (selectedCourse) {
      filtered = filtered.filter(
        (payment) => payment.course_id === parseInt(selectedCourse),
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(
        (payment) => payment.payment_status === selectedStatus,
      );
    }

    setFilteredPayments(filtered);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedInstitute("");
    setSelectedCourse("");
    setSelectedStatus("");
    setSearch("");
    setCourses([]);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Excel Export function
  const handleExcelExport = () => {
    const today = new Date().toISOString().split("T")[0];

    const data = filteredPayments.map((item, index) => ({
      "Sl No": index + 1,
      "Payment Advice No": item.payment_no || "N/A",
      "Invoice/Ref No": item.invoice_no || "N/A",
      Institute: item.institute_name || "N/A",
      Course: item.course_name || "N/A",
      "Tax Payer": item.tax_payer_name || "N/A",
      "Tax Payer No": item.tax_payer_no || "N/A",
      Amount: item.amount || 0,
      "Payment Date": formatDate(item.payment_date),
      "Payment Status": getStatusName(item.status_id, item.payment_status),
      Platform: item.platform || "N/A",
      "Receipt No": item.receipt_no || "N/A",
      "Mobile No": item.mobile_no || "N/A",
      Email: item.payer_email || "N/A",
      "Application No": item.application_no || "N/A",
    }));

    exportToExcel(data, `Payment_Reports_${today}`);
    toast.success(`Exported ${data.length} payment records to Excel`);
  };

  const handleViewReceipt = (payment) => {
    if (payment.payment_status === "paid") {
      if (payment.redirect_url) {
        window.open(payment.redirect_url, "_blank");
        toast.success("Receipt opened in new tab");
      } else {
        setSelectedPayment(payment);
        setOpenReceiptDialog(true);
      }
    } else {
      toast.warning("Receipt is only available for completed payments");
    }
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadReceipt = async (receiptNo, paymentId) => {
    if (!receiptNo) {
      toast.error("No receipt number found for this payment");
      return;
    }

    // Prevent multiple clicks on the same receipt
    if (downloadingReceipts[paymentId]) {
      return;
    }

    try {
      // Set downloading for this specific receipt
      setDownloadingReceipts((prev) => ({ ...prev, [paymentId]: true }));

      const response = await BirmsPaymentService.getPaymentReceipt(receiptNo);

      console.log("Receipt response:", response);

      const data = response.data;

      if (!data) {
        toast.error("No receipt data received");
        return;
      }

      if (
        data.base64pdf &&
        data.base64pdf !== "null" &&
        data.base64pdf !== null
      ) {
        try {
          const pdfContent = data.base64pdf;
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${pdfContent}`;
          link.download = `receipt-${receiptNo}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("Receipt downloaded successfully!");
        } catch (pdfError) {
          console.error("Error creating PDF:", pdfError);
          toast.error("Failed to create PDF file");
        }
      } else if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
        toast.success("Receipt opened in new tab");
      } else if (data.message) {
        if (
          data.message.toLowerCase().includes("no payment") ||
          data.message.toLowerCase().includes("not found")
        ) {
          toast.warning(data.message);

          if (data.paymentDetails || data.data) {
            setSelectedPayment({
              ...selectedPayment,
              receiptDetails: data,
            });
            setOpenReceiptDialog(true);
          }
        } else {
          toast.info(data.message);
        }
      } else if (data.status) {
        if (data.status === "success" && !data.base64pdf) {
          toast.info("Receipt request successful but no PDF available");
        } else if (data.status === "error" || data.status === "failed") {
          toast.error(data.message || "Failed to retrieve receipt");
        } else {
          toast.info(data.message || "Receipt data received");
        }
      } else if (response.data instanceof Blob) {
        try {
          const url = window.URL.createObjectURL(response.data);
          const link = document.createElement("a");
          link.href = url;
          link.download = `receipt-${receiptNo}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("Receipt downloaded successfully!");
        } catch (blobError) {
          console.error("Error handling blob:", blobError);
          toast.error("Failed to download receipt");
        }
      } else {
        setSelectedPayment({
          ...selectedPayment,
          receiptDetails: data,
        });
        setOpenReceiptDialog(true);
        toast.success("Receipt details loaded");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);

      let errorMessage = "Failed to download receipt";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      // Clear downloading state for this receipt
      setDownloadingReceipts((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleCancelPayment = (payment) => {
    console.log("Payment to cancel - full object:", payment);
    console.log(
      "Payment advice number:",
      payment.payment_no ||
        payment.paymentAdviceNo ||
        payment.payment_advice_no,
    );
    setPaymentToCancel(payment);
    setCancelReason("");
    setOpenCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.warning("Please provide a reason for cancellation");
      return;
    }

    setLoading(true);
    try {
      console.log("Payment to cancel - full object:", paymentToCancel);
      console.log(
        "Payment to cancel - all keys:",
        Object.keys(paymentToCancel || {}),
      );

      const paymentAdviceNo =
        paymentToCancel?.payment_no ||
        paymentToCancel?.paymentAdviceNo ||
        paymentToCancel?.payment_advice_no ||
        paymentToCancel?.adviceNo ||
        paymentToCancel?.paymentAdviceNumber;

      console.log("Payment advice number extracted:", paymentAdviceNo);

      if (!paymentAdviceNo) {
        toast.error(
          "Payment advice number not found. Please check the payment details.",
        );
        setLoading(false);
        return;
      }

      const payload = {
        paymentAdviceNo: paymentAdviceNo,
        reason: cancelReason.trim(),
        cancelledBy: actionId || "System",
      };

      console.log("Sending cancellation payload:", payload);

      const response = await BirmsPaymentService.makePaymentCancel(payload);

      console.log("Cancel response:", response);
      console.log("Cancel response data:", response.data);

      if (response.data) {
        const isSuccess =
          response.data.statusCode === 200 ||
          response.data.status === "success" ||
          response.data.success === true;

        if (isSuccess) {
          toast.success("Payment cancelled successfully!");
          setOpenCancelDialog(false);
          setPaymentToCancel(null);
          setCancelReason("");
          fetchPaymentDetails();
        } else {
          const errorMessage =
            response.data?.description ||
            response.data?.message ||
            response.data?.error ||
            "Failed to cancel payment";
          toast.error(errorMessage);
        }
      } else {
        toast.error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error cancelling payment:", error);

      let errorMessage = "Failed to cancel payment";
      if (error.response) {
        console.error("Error response data:", error.response.data);
        errorMessage =
          error.response.data?.description ||
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodName = (methodId) => {
    if (!methodId) return "N/A";
    const method = paymentMethods.find(
      (m) => parseInt(m.id) === parseInt(methodId),
    );
    return method ? method.name : "N/A";
  };

  const getBankName = (bankId) => {
    if (!bankId) return "N/A";
    const bank = bankNames.find((b) => parseInt(b.id) === parseInt(bankId));
    return bank ? bank.name : "N/A";
  };

  const getStatusName = (statusId, paymentStatus) => {
    if (paymentStatus) {
      return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
    }
    if (!statusId) return "Pending";
    const statusMap = {
      55: "Pending",
      56: "Paid",
      57: "Failed",
      58: "Refunded",
    };
    return statusMap[statusId] || "Pending";
  };

  const getStatusColor = (statusId, paymentStatus) => {
    if (paymentStatus === "paid") return "#4caf50";
    if (paymentStatus === "pending") return "#ff9800";
    if (paymentStatus === "failed") return "#f44336";

    switch (statusId) {
      case 56:
        return "#4caf50";
      case 57:
        return "#f44336";
      case 58:
        return "#ff9800";
      case 55:
      default:
        return "#ff9800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BTN", // Bhutanese Ngultrum
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("BTN", "Nu.");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  const statusOptions = [
    ...new Set(payments.map((p) => p.payment_status).filter(Boolean)),
  ];

  if (loading && payments.length === 0) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 50, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading payment details...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      <Typography variant="h5" gutterBottom>
        Payment Management
      </Typography>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Institute</InputLabel>
            <Select
              value={selectedInstitute}
              onChange={handleInstituteChange}
              label="Institute"
            >
              <MenuItem value="">All Institutes</MenuItem>
              {institutes.map((institute) => (
                <MenuItem key={institute.id} value={institute.id}>
                  {institute.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              label="Course"
              disabled={!selectedInstitute}
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Payment/Invoice/Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 12 }}>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<FilterListIcon />}
            >
              Clear Filters
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleExcelExport}
              disabled={filteredPayments.length === 0}
              startIcon={<DownloadIcon />}
            >
              Export to Excel
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>PA No</TableCell>
              <TableCell>Invoice/Ref No</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Tax Payer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment, index) => {
                  const isPaid = payment.payment_status === "paid";
                  const isPending = payment.payment_status === "pending";
                  return (
                    <TableRow
                      key={payment.id || index}
                      sx={{ opacity: isPaid ? 0.7 : 1 }}
                    >
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {payment.payment_no || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {payment.invoice_no || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {payment.institute_name || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {payment.course_name || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {payment.tax_payer_name || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {payment.tax_payer_no || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="primary"
                        >
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {formatDate(payment.payment_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusName(
                            payment.status_id,
                            payment.payment_status,
                          )}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(
                              payment.status_id,
                              payment.payment_status,
                            ),
                            color: "white",
                            fontWeight: "medium",
                            minWidth: "80px",
                            "& .MuiChip-label": {
                              px: 1.5,
                              py: 0.5,
                              fontSize: "0.7rem",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          display="flex"
                          gap={0.5}
                          justifyContent="center"
                          flexWrap="wrap"
                        >
                          {isPending && payment.redirect_url && (
                            <Tooltip title="Click to complete payment" arrow>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() =>
                                  window.open(payment.redirect_url, "_blank")
                                }
                                startIcon={<PaymentIcon />}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.65rem",
                                  padding: "2px 6px",
                                  minWidth: "50px",
                                }}
                              >
                                Pay
                              </Button>
                            </Tooltip>
                          )}

                          {isPaid && (
                            <Tooltip title="Download receipt" arrow>
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() =>
                                  handleDownloadReceipt(
                                    payment.receipt_no,
                                    payment.id,
                                  )
                                }
                                sx={{ padding: "4px" }}
                                disabled={downloadingReceipts[payment.id]}
                              >
                                {downloadingReceipts[payment.id] ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DownloadIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}

                          {isPending && (
                            <Tooltip title="Cancel payment" arrow>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleCancelPayment(payment)}
                                sx={{
                                  minWidth: "32px",
                                  width: "32px",
                                  height: "32px",
                                  padding: "0",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  fontWeight: "bold",
                                  borderColor: "#f44336",
                                  color: "#f44336",
                                  "&:hover": {
                                    backgroundColor: "#f44336",
                                    color: "#fff",
                                    borderColor: "#f44336",
                                  },
                                }}
                              >
                                X
                              </Button>
                            </Tooltip>
                          )}

                          {!isPending && !isPaid && (
                            <Typography variant="caption" color="textSecondary">
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    No payment records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Cancel Payment Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CancelIcon color="error" />
            <Typography variant="h6">Cancel Payment</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {paymentToCancel && (
            <>
              <Typography variant="body2" gutterBottom>
                Are you sure you want to cancel this payment?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      PA No:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="primary"
                    >
                      {paymentToCancel.payment_no ||
                        paymentToCancel.paymentAdviceNo ||
                        "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Amount:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="primary"
                    >
                      {formatCurrency(paymentToCancel.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Tax Payer:
                    </Typography>
                    <Typography variant="body2">
                      {paymentToCancel.tax_payer_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Payment Status:
                    </Typography>
                    <Chip
                      label={getStatusName(
                        paymentToCancel.status_id,
                        paymentToCancel.payment_status,
                      )}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(
                          paymentToCancel.status_id,
                          paymentToCancel.payment_status,
                        ),
                        color: "white",
                        mt: 0.5,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Cancellation Reason"
                placeholder="Please provide a reason for cancelling this payment"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                sx={{ mt: 2 }}
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="medium"
            variant="outlined"
            onClick={() => setOpenCancelDialog(false)}
            disabled={loading}
            sx={{ textTransform: "none" }}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
          <Button
            size="medium"
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={loading || !cancelReason.trim()}
            sx={{ textTransform: "none" }}
            startIcon={
              loading ? <CircularProgress size={20} /> : <CancelIcon />
            }
          >
            {loading ? "Cancelling..." : "Cancel Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog
        open={openReceiptDialog}
        onClose={() => setOpenReceiptDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <ReceiptIcon />
              <Typography variant="h6">Payment Receipt</Typography>
            </Box>
            <Box>
              <IconButton
                onClick={handlePrintReceipt}
                title="Print"
                className="no-print"
              >
                <PrintIcon />
              </IconButton>
              <IconButton
                onClick={() =>
                  handleDownloadReceipt(
                    selectedPayment?.receipt_no,
                    selectedPayment?.id,
                  )
                }
                title="Download"
                disabled={downloadingReceipts[selectedPayment?.id]}
                className="no-print"
              >
                {downloadingReceipts[selectedPayment?.id] ? (
                  <CircularProgress size={24} />
                ) : (
                  <DownloadIcon />
                )}
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Box id="receipt-content">
              <Box textAlign="center" mb={2}>
                <Typography variant="h6">BIRMS Private Limited</Typography>
                <Typography variant="body2" color="textSecondary">
                  Payment Receipt
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    PA No:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPayment.payment_no}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(selectedPayment.payment_date)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Reference No:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.invoice_no}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Amount Paid:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Tax Payer:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.tax_payer_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Tax Payer No:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.tax_payer_no}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Institute:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.institute_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Course:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.course_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Platform:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.platform}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Receipt No:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPayment.receipt_no || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Status:
                  </Typography>
                  <Chip
                    label={getStatusName(
                      selectedPayment.status_id,
                      selectedPayment.payment_status,
                    )}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(
                        selectedPayment.status_id,
                        selectedPayment.payment_status,
                      ),
                      color: "white",
                      mt: 0.5,
                    }}
                  />
                </Grid>
                {selectedPayment.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Description:
                    </Typography>
                    <Typography variant="body2">
                      {selectedPayment.description}
                    </Typography>
                  </Grid>
                )}
                {selectedPayment.redirect_url && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        window.open(selectedPayment.redirect_url, "_blank")
                      }
                      startIcon={<ReceiptIcon />}
                    >
                      View Full Receipt
                    </Button>
                  </Grid>
                )}
                {selectedPayment.receiptDetails && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Receipt Details from BIRMS:
                    </Typography>
                    <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {JSON.stringify(
                          selectedPayment.receiptDetails,
                          null,
                          2,
                        )}
                      </pre>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpenReceiptDialog(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BirmsAgencyPaymentIndex;
