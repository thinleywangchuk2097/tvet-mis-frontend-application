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
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import DescriptionIcon from "@mui/icons-material/Description";
import PeopleIcon from "@mui/icons-material/People";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonService from "../../../api/services/CommonService";

const BirmsPrivatePaymentIndex = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [openPaymentAdviceDialog, setOpenPaymentAdviceDialog] = useState(false);
  const [openTraineesDialog, setOpenTraineesDialog] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankNames, setBankNames] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  
  // Filter states
  const [institutes, setInstitutes] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedCourseType, setSelectedCourseType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const registration_no = useSelector((state) => state.auth.userId);

  // Fetch data on component mount
  useEffect(() => {
    fetchPayments();
    fetchDropdownData();
    fetchInstitutes();
    fetchCourseTypes();
  }, []);

  // Apply filters whenever filter criteria or payments change
  useEffect(() => {
    applyFilters();
  }, [payments, search, selectedInstitute, selectedCourseType, selectedCourse]);

  const fetchPayments = async () => {
    try {
      // Replace with actual API call
      // const response = await PaymentService.getPaymentsByUser(registration_no);
      // setPayments(response.data);
      
      // Mock data for demonstration with total_trainees
      const mockPayments = [
        {
          id: 1,
          payment_no: "PAY-2024-0001",
          invoice_no: "INV-2024-0001",
          amount: 15000,
          payment_date: "2024-01-15",
          payment_method_id: 1,
          bank_name_id: 1,
          transaction_ref: "TRX123456",
          status_id: 56,
          description: "Course Registration Fee - Web Development",
          created_at: "2024-01-15",
          institute_id: 1,
          institute_name: "BIRMS Institute",
          course_type_id: 1,
          course_type_name: "Technical",
          course_id: 1,
          course_name: "Web Development",
          total_trainees: 25,
        },
        {
          id: 2,
          payment_no: "PAY-2024-0002",
          invoice_no: "INV-2024-0002",
          amount: 25000,
          payment_date: "2024-02-20",
          payment_method_id: 2,
          bank_name_id: 2,
          transaction_ref: "TRX789012",
          status_id: 55,
          description: "Course Fee - Data Science",
          created_at: "2024-02-20",
          institute_id: 1,
          institute_name: "BIRMS Institute",
          course_type_id: 1,
          course_type_name: "Technical",
          course_id: 2,
          course_name: "Data Science",
          total_trainees: 18,
        },
        {
          id: 3,
          payment_no: "PAY-2024-0003",
          invoice_no: "INV-2024-0003",
          amount: 10000,
          payment_date: "2024-03-10",
          payment_method_id: 1,
          bank_name_id: 1,
          transaction_ref: "TRX345678",
          status_id: 57,
          description: "Exam Fee - Final Assessment",
          created_at: "2024-03-10",
          institute_id: 2,
          institute_name: "Skill Development Center",
          course_type_id: 2,
          course_type_name: "Vocational",
          course_id: 3,
          course_name: "Digital Marketing",
          total_trainees: 32,
        },
        {
          id: 4,
          payment_no: "PAY-2024-0004",
          invoice_no: "INV-2024-0004",
          amount: 20000,
          payment_date: "2024-04-05",
          payment_method_id: 1,
          bank_name_id: 1,
          transaction_ref: "TRX901234",
          status_id: 56,
          description: "Advanced Course Fee - Mobile Development",
          created_at: "2024-04-05",
          institute_id: 1,
          institute_name: "BIRMS Institute",
          course_type_id: 1,
          course_type_name: "Technical",
          course_id: 3,
          course_name: "Mobile App Development",
          total_trainees: 15,
        },
        {
          id: 5,
          payment_no: "PAY-2024-0005",
          invoice_no: "INV-2024-0005",
          amount: 12000,
          payment_date: "2024-05-12",
          payment_method_id: 2,
          bank_name_id: 2,
          transaction_ref: "TRX567890",
          status_id: 56,
          description: "Professional Development - Leadership",
          created_at: "2024-05-12",
          institute_id: 3,
          institute_name: "Technical Training Academy",
          course_type_id: 3,
          course_type_name: "Professional",
          course_id: 7,
          course_name: "Project Management",
          total_trainees: 22,
        },
      ];
      setPayments(mockPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payment records");
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch payment methods (parentId for payment methods)
      const paymentMethodResponse = await CommonService.getByParentId(20);
      setPaymentMethods(paymentMethodResponse.data);

      // Fetch bank names (parentId for banks)
      const bankResponse = await CommonService.getByParentId(21);
      setBankNames(bankResponse.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchInstitutes = async () => {
    try {
      // Replace with actual API call
      // const response = await InstituteService.getAllInstitutes();
      // setInstitutes(response.data);
      
      // Mock institutes
      const mockInstitutes = [
        { id: 1, name: "BIRMS Institute" },
        { id: 2, name: "Skill Development Center" },
        { id: 3, name: "Technical Training Academy" },
      ];
      setInstitutes(mockInstitutes);
    } catch (error) {
      console.error("Error fetching institutes:", error);
    }
  };

  const fetchCourseTypes = async () => {
    try {
      // Replace with actual API call
      // const response = await CommonService.getByParentId(30);
      // setCourseTypes(response.data);
      
      // Mock course types
      const mockCourseTypes = [
        { id: 1, name: "Technical" },
        { id: 2, name: "Vocational" },
        { id: 3, name: "Professional" },
      ];
      setCourseTypes(mockCourseTypes);
    } catch (error) {
      console.error("Error fetching course types:", error);
    }
  };

  const fetchCourses = async (courseTypeId) => {
    try {
      // Replace with actual API call based on course type
      // const response = await CourseService.getCoursesByType(courseTypeId);
      // setCourses(response.data);
      
      // Mock courses based on course type
      const mockCourses = {
        1: [
          { id: 1, name: "Web Development" },
          { id: 2, name: "Data Science" },
          { id: 3, name: "Mobile App Development" },
        ],
        2: [
          { id: 4, name: "Digital Marketing" },
          { id: 5, name: "Graphic Design" },
          { id: 6, name: "Video Editing" },
        ],
        3: [
          { id: 7, name: "Project Management" },
          { id: 8, name: "Leadership Skills" },
          { id: 9, name: "Communication Skills" },
        ],
      };
      setCourses(mockCourses[courseTypeId] || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchTraineesByPayment = async (paymentId) => {
    try {
      setLoading(true);
      // Replace with actual API call to fetch trainees for this payment
      // const response = await TraineeService.getTraineesByPayment(paymentId);
      // setSelectedTrainees(response.data);
      
      // Mock trainees data
      const mockTrainees = {
        1: [
          { id: 1, name: "John Doe", email: "john@example.com", phone: "9876543210", enrollment_no: "ENR001", status: "Active" },
          { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "9876543211", enrollment_no: "ENR002", status: "Active" },
          { id: 3, name: "Mike Johnson", email: "mike@example.com", phone: "9876543212", enrollment_no: "ENR003", status: "Paid" },
        ],
        2: [
          { id: 4, name: "Sarah Williams", email: "sarah@example.com", phone: "9876543213", enrollment_no: "ENR004", status: "Active" },
          { id: 5, name: "David Brown", email: "david@example.com", phone: "9876543214", enrollment_no: "ENR005", status: "Active" },
        ],
        3: [
          { id: 6, name: "Emily Davis", email: "emily@example.com", phone: "9876543215", enrollment_no: "ENR006", status: "Paid" },
          { id: 7, name: "Chris Wilson", email: "chris@example.com", phone: "9876543216", enrollment_no: "ENR007", status: "Active" },
          { id: 8, name: "Lisa Anderson", email: "lisa@example.com", phone: "9876543217", enrollment_no: "ENR008", status: "Active" },
          { id: 9, name: "Tom Martinez", email: "tom@example.com", phone: "9876543218", enrollment_no: "ENR009", status: "Pending" },
        ],
        4: [
          { id: 10, name: "Anna Taylor", email: "anna@example.com", phone: "9876543219", enrollment_no: "ENR010", status: "Active" },
          { id: 11, name: "Robert Thomas", email: "robert@example.com", phone: "9876543220", enrollment_no: "ENR011", status: "Paid" },
        ],
        5: [
          { id: 12, name: "Maria Garcia", email: "maria@example.com", phone: "9876543221", enrollment_no: "ENR012", status: "Active" },
          { id: 13, name: "James Miller", email: "james@example.com", phone: "9876543222", enrollment_no: "ENR013", status: "Active" },
        ],
      };
      
      setSelectedTrainees(mockTrainees[paymentId] || []);
      setOpenTraineesDialog(true);
    } catch (error) {
      console.error("Error fetching trainees:", error);
      toast.error("Failed to fetch trainees details");
    } finally {
      setLoading(false);
    }
  };

  // Handle course type change to load related courses
  const handleCourseTypeChange = (event) => {
    const courseTypeId = event.target.value;
    setSelectedCourseType(courseTypeId);
    setSelectedCourse(""); // Reset course selection
    if (courseTypeId) {
      fetchCourses(courseTypeId);
    } else {
      setCourses([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (payment) =>
          payment.payment_no?.toLowerCase().includes(search.toLowerCase()) ||
          payment.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
          payment.transaction_ref?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply institute filter
    if (selectedInstitute) {
      filtered = filtered.filter(
        (payment) => payment.institute_id === parseInt(selectedInstitute)
      );
    }

    // Apply course type filter
    if (selectedCourseType) {
      filtered = filtered.filter(
        (payment) => payment.course_type_id === parseInt(selectedCourseType)
      );
    }

    // Apply course filter
    if (selectedCourse) {
      filtered = filtered.filter(
        (payment) => payment.course_id === parseInt(selectedCourse)
      );
    }

    setFilteredPayments(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setSelectedInstitute("");
    setSelectedCourseType("");
    setSelectedCourse("");
    setSearch("");
    setCourses([]);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSelectPayment = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    // Don't allow selection of paid payments (status_id === 56)
    if (payment && payment.status_id === 56) {
      toast.warning("Paid payments cannot be selected for payment advice");
      return;
    }
    
    setSelectedPayments((prev) => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAll = () => {
    // Filter out paid payments (status_id !== 56)
    const selectablePayments = filteredPayments.filter(payment => payment.status_id !== 56);
    
    if (selectedPayments.length === selectablePayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(selectablePayments.map(payment => payment.id));
    }
  };

  const handleViewReceipt = (payment) => {
    if (payment.status_id === 56) { // Only allow for completed payments
      setSelectedPayment(payment);
      setOpenReceiptDialog(true);
    } else {
      toast.warning("Receipt is only available for completed payments");
    }
  };

  const handleViewTrainees = (payment) => {
    fetchTraineesByPayment(payment.id);
  };

  const handleCreatePaymentAdvice = () => {
    if (selectedPayments.length === 0) {
      toast.warning("Please select at least one payment to create advice");
      return;
    }
    setOpenPaymentAdviceDialog(true);
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { padding: 0; }
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

  const handleDownloadReceipt = async () => {
    try {
      setLoading(true);
      // Replace with actual API call to download receipt
      // const response = await PaymentService.downloadReceipt(selectedPayment.id);
      // const blob = new Blob([response.data], { type: 'application/pdf' });
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `receipt_${selectedPayment.payment_no}.pdf`);
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
      // window.URL.revokeObjectURL(url);
      
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaymentAdvice = async () => {
    setLoading(true);
    try {
      // Only get non-paid selected payments
      const selectedPaymentsData = payments.filter(p => 
        selectedPayments.includes(p.id) && p.status_id !== 56
      );
      
      const payload = {
        paymentIds: selectedPayments,
        payments: selectedPaymentsData,
        createdBy: actionId,
        createdDate: new Date().toISOString(),
      };

      console.log("Creating payment advice:", payload);
      
      // Replace with actual API call
      // const response = await PaymentService.createPaymentAdvice(payload);
      
      toast.success("Payment advice created successfully!");
      setOpenPaymentAdviceDialog(false);
      setSelectedPayments([]);
    } catch (error) {
      console.error("Error creating payment advice:", error);
      toast.error(error.response?.data?.message || "Failed to create payment advice");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodName = (methodId) => {
    if (!methodId) return "N/A";
    const method = paymentMethods.find((m) => parseInt(m.id) === parseInt(methodId));
    return method ? method.name : methodId;
  };

  const getBankName = (bankId) => {
    if (!bankId) return "N/A";
    const bank = bankNames.find((b) => parseInt(b.id) === parseInt(bankId));
    return bank ? bank.name : bankId;
  };

  const getStatusName = (statusId) => {
    if (!statusId) return "Pending";
    const statusMap = {
      55: "Pending",
      56: "Paid",
      57: "Failed",
      58: "Refunded",
    };
    return statusMap[statusId] || "Pending";
  };

  const getStatusColor = (statusId) => {
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const tableStyle = {
    border: "1px solid",
    borderColor: "divider",
    "& th, & td": {
      border: "1px solid",
      borderColor: "divider",
    },
  };

  // Check if any payment is selectable (not paid)
  const hasSelectablePayments = filteredPayments.some(payment => payment.status_id !== 56);

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
              onChange={(e) => setSelectedInstitute(e.target.value)}
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
            <InputLabel>Course Type</InputLabel>
            <Select
              value={selectedCourseType}
              onChange={handleCourseTypeChange}
              label="Course Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {courseTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
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
              disabled={!selectedCourseType}
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
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Payment/Invoice/Transaction No"
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
              startIcon={<DescriptionIcon />}
              onClick={handleCreatePaymentAdvice}
              disabled={selectedPayments.length === 0}
            >
              Create Payment Advice ({selectedPayments.length})
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedPayments.length > 0 && selectedPayments.length < filteredPayments.filter(p => p.status_id !== 56).length}
                  checked={hasSelectablePayments && selectedPayments.length === filteredPayments.filter(p => p.status_id !== 56).length}
                  onChange={handleSelectAll}
                  disabled={!hasSelectablePayments}
                />
              </TableCell>
              <TableCell>#</TableCell>
              <TableCell>Payment No</TableCell>
              <TableCell>Invoice No</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>Course Type</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Total Trainees</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Transaction Ref</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment, index) => {
                  const isPaid = payment.status_id === 56;
                  return (
                    <TableRow key={payment.id || index} sx={{ opacity: isPaid ? 0.7 : 1 }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => handleSelectPayment(payment.id)}
                          disabled={isPaid}
                        />
                      </TableCell>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>{payment.payment_no || "N/A"}</TableCell>
                      <TableCell>{payment.invoice_no || "N/A"}</TableCell>
                      <TableCell>{payment.institute_name || "N/A"}</TableCell>
                      <TableCell>{payment.course_type_name || "N/A"}</TableCell>
                      <TableCell>{payment.course_name || "N/A"}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {payment.total_trainees || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>
                        {getPaymentMethodName(payment.payment_method_id)}
                      </TableCell>
                      <TableCell>{payment.transaction_ref || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusName(payment.status_id)}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(payment.status_id),
                            color: "white",
                            fontWeight: "medium",
                            minWidth: "80px",
                            "& .MuiChip-label": {
                              px: 1.5,
                              py: 0.5,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleViewTrainees(payment)}
                            title="View Trainees"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewReceipt(payment)}
                            title="View Receipt"
                            disabled={!isPaid}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={14} align="center">
                  No payment records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Create Payment Advice Dialog */}
      <Dialog
        open={openPaymentAdviceDialog}
        onClose={() => setOpenPaymentAdviceDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DescriptionIcon />
            <Typography variant="h6">Create Payment Advice</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Selected Payments ({selectedPayments.length})
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Payment No</TableCell>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Total Trainees</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments
                  .filter(p => selectedPayments.includes(p.id) && p.status_id !== 56)
                  .map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_no}</TableCell>
                      <TableCell>{payment.invoice_no}</TableCell>
                      <TableCell>{payment.total_trainees || 0}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusName(payment.status_id)}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(payment.status_id),
                            color: "white",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Summary:
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {payments
                        .filter(p => selectedPayments.includes(p.id) && p.status_id !== 56)
                        .reduce((sum, p) => sum + (p.total_trainees || 0), 0)} Trainees
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={3}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      {formatCurrency(
                        payments
                          .filter(p => selectedPayments.includes(p.id) && p.status_id !== 56)
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => setOpenPaymentAdviceDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleSubmitPaymentAdvice}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Advice"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Trainees Dialog */}
      <Dialog
        open={openTraineesDialog}
        onClose={() => setOpenTraineesDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon />
            <Typography variant="h6">Trainees Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Loading trainees data...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Total Trainees: {selectedTrainees.length}
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Enrollment No</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTrainees.length > 0 ? (
                      selectedTrainees.map((trainee, index) => (
                        <TableRow key={trainee.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{trainee.name}</TableCell>
                          <TableCell>{trainee.email}</TableCell>
                          <TableCell>{trainee.phone}</TableCell>
                          <TableCell>{trainee.enrollment_no}</TableCell>
                          <TableCell>
                            <Chip
                              label={trainee.status}
                              size="small"
                              sx={{
                                backgroundColor: trainee.status === "Active" ? "#4caf50" : 
                                               trainee.status === "Paid" ? "#2196f3" : "#ff9800",
                                color: "white",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No trainees found for this payment
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpenTraineesDialog(false)}
          >
            Close
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
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <ReceiptIcon />
              <Typography variant="h6">Payment Receipt</Typography>
            </Box>
            <Box>
              <IconButton onClick={handlePrintReceipt} title="Print">
                <PrintIcon />
              </IconButton>
              <IconButton onClick={handleDownloadReceipt} title="Download" disabled={loading}>
                <DownloadIcon />
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
                    Receipt No:
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
                    Invoice No:
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
                    Total Trainees:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.total_trainees || 0}
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
                    Payment Method:
                  </Typography>
                  <Typography variant="body1">
                    {getPaymentMethodName(selectedPayment.payment_method_id)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Transaction Ref:
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.transaction_ref}
                  </Typography>
                </Grid>
                {selectedPayment.bank_name_id && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Bank:
                    </Typography>
                    <Typography variant="body1">
                      {getBankName(selectedPayment.bank_name_id)}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Status:
                  </Typography>
                  <Chip
                    label={getStatusName(selectedPayment.status_id)}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(selectedPayment.status_id),
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

export default BirmsPrivatePaymentIndex;