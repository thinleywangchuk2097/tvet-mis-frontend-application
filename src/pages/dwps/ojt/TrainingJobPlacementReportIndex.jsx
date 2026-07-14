import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Divider,
  TablePagination,
  Chip,
  Card,
  CardContent,
  Avatar,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { exportToExcel } from "@/utils/exportExcel";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { format } from "date-fns";
import CommonService from "../../../api/services/internal/common/CommonService";
import OJTService from "../../../api/services/internal/ojt/OJTService";
import CampusPlacementService from "../../../api/services/internal/ojt/CampusPlacementService";

// ==================== STYLED STAT CARD ====================
const StatCard = ({ icon: Icon, title, value, color, subtitle }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.08)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ mt: 0.5, color: `${color}.main` }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette[color].main, 0.12),
              color: `${color}.main`,
              width: 48,
              height: 48,
            }}
          >
            <Icon />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================
const TrainingJobPlacementReportIndex = () => {
  const theme = useTheme();

  // ===== STATE =====
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statistics, setStatistics] = useState({
    total: 0,
    placementRate: 0,
    onCampus: 0,
    ojt: 0,
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    reportSource: "",
    dzongkhag: "",
    startDate: "",
    endDate: "",
  });

  // Master data
  const [dzongkhags, setDzongkhags] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [instituteNames, setInstituteNames] = useState({});

  // Redux
  const access_token = useSelector((state) => state.auth.accessToken);

  // Report source options with numeric values
  const reportSourceOptions = [
    { value: "1", label: "All Sources" },
    { value: "2", label: "On-Campus" },
    { value: "3", label: "OJT" },
  ];

  // ===== EFFECTS =====
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchMasterData()]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (access_token) {
      fetchReports();
    }
  }, [access_token]);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [filters, reports]);

  // ===== API CALLS =====
  const fetchMasterData = async () => {
    try {
      const [dzongkhagsRes, statusRes] = await Promise.all([
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(17),
      ]);
      setDzongkhags(dzongkhagsRes.data || []);
      setEmploymentStatuses(statusRes.data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data");
    }
  };

  // Fetch institute name by ID
  const fetchInstituteName = async (instituteId) => {
    if (!instituteId) return "N/A";
    try {
      const response =
        await CommonService.getInstituteNameByInstituteId(instituteId);
      console.log(
        `Fetched institute name for ID ${instituteId}:`,
        response.data,
      );

      // Handle response - it's an array with objects containing institute_name
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data[0]?.institute_name || instituteId;
      }
      return instituteId;
    } catch (error) {
      console.error(
        `Error fetching institute name for ID ${instituteId}:`,
        error,
      );
      return instituteId;
    }
  };

  // Fetch institute names for all unique institute IDs
  const fetchAllInstituteNames = async (reportsData) => {
    const uniqueInstituteIds = [
      ...new Set(reportsData.map((item) => item.instituteId).filter(Boolean)),
    ];
    const nameMap = {};

    for (const id of uniqueInstituteIds) {
      const name = await fetchInstituteName(id);
      nameMap[id] = name;
    }

    setInstituteNames(nameMap);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let allReports = [];

      // Fetch On-Campus Placement Report
      const campusResponse =
        await CampusPlacementService.getTraineeOnPlacementReport(access_token);
      console.log("Campus Placement Response:", campusResponse.data);
      const campusData = campusResponse.data || [];
      const campusReports = campusData.map((item) => ({
        ...item,
        source: "On-Campus",
        reportType: "on-campus",
        sourceValue: "2",
        traineeId: item.trainee_id,
        participantName: item.trainee_name,
        citizenId: item.trainee_cid,
        companyName: item.firm_name,
        companyId: item.firm_id,
        trainingProgram: item.course_name || "N/A",
        courseId: item.course_id,
        placementDate: item.placement_date || item.created_at,
        startDate: item.start_date,
        status:
          item.status_id === 72
            ? "placed"
            : item.status_id === 73
              ? "pending"
              : "not_placed",
        employmentStatus: item.employment_status_id,
        position: item.position,
        salary: item.salary,
        remarks: item.remarks,
        sessionId: item.session_id,
        sessionName: item.session_name,
        sessionDate: item.session_date,
        sessionTime: item.session_time,
        venue: item.venue,
        firmRegistrationNo: item.firm_registration_no,
        firmContactPerson: item.firm_contact_person,
        firmContactPhone: item.firm_contact_phone,
        firmContactEmail: item.firm_contact_email,
        firmAddress: item.firm_address,
        dzongkhagId: item.dzongkhag_id,
        instituteId: item.institute_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
      allReports = [...allReports, ...campusReports];

      // Fetch OJT Placement Report
      const ojtResponse = await OJTService.getTraineeOJTReport(access_token);
      console.log("OJT Response:", ojtResponse.data);
      const ojtData = ojtResponse.data || [];
      const ojtReports = ojtData.map((item) => ({
        ...item,
        source: "OJT",
        reportType: "ojt",
        sourceValue: "3",
        traineeId: item.trainee_id,
        participantName: item.trainee_name,
        citizenId: item.trainee_cid,
        companyName: item.company_name,
        companyId: item.company_id,
        trainingProgram: item.course_name || "N/A",
        courseId: item.course_id,
        // Store both agreement dates
        agreementStartDate: item.agreement_start_date,
        agreementEndDate: item.agreement_end_date,
        // Display as range in placement date
        placementDate:
          item.agreement_start_date && item.agreement_end_date
            ? `${format(new Date(item.agreement_start_date), "dd MMM yyyy")} - ${format(new Date(item.agreement_end_date), "dd MMM yyyy")}`
            : item.agreement_end_date || item.created_at,
        startDate: item.agreement_start_date,
        endDate: item.agreement_end_date,
        status:
          item.status_id === 65
            ? "placed"
            : item.status_id === 66
              ? "pending"
              : "not_placed",
        employmentStatus: item.employment_status_id,
        position: item.position,
        salary: item.salary,
        remarks: item.remarks,
        agreementId: item.agreement_id,
        agreementTitle: item.agreement_title,
        superVisorName: item.super_visor_name,
        supervisorContactNo: item.supervisor_contact_no,
        registrationNo: item.registration_no,
        contactPersonName: item.contact_person_name,
        contactPersonMobileNo: item.contact_person_mobile_no,
        contactPersonEmail: item.contact_person_email,
        companyAddress: item.company_address,
        dzongkhagId: item.dzongkhag_id,
        instituteId: item.institute_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
      allReports = [...allReports, ...ojtReports];

      setReports(allReports);

      // Fetch institute names for all reports
      await fetchAllInstituteNames(allReports);

      calculateStatistics(allReports);
      applyFilters();
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== HELPERS =====
  const calculateStatistics = (reportsData) => {
    const total = reportsData.length;
    const placed = reportsData.filter((r) => r.status === "placed").length;
    const placementRate = total > 0 ? ((placed / total) * 100).toFixed(1) : 0;
    const onCampus = reportsData.filter(
      (r) => r.reportType === "on-campus",
    ).length;
    const ojt = reportsData.filter((r) => r.reportType === "ojt").length;

    setStatistics({
      total,
      placementRate,
      onCampus,
      ojt,
    });
  };

  const applyFilters = () => {
    let result = [...reports];

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          (item.participantName &&
            item.participantName.toLowerCase().includes(search)) ||
          (item.citizenId && item.citizenId.toLowerCase().includes(search)) ||
          (item.companyName &&
            item.companyName.toLowerCase().includes(search)) ||
          (item.position && item.position.toLowerCase().includes(search)),
      );
    }

    // Filter by report source using numeric values
    if (filters.reportSource) {
      if (filters.reportSource === "2") {
        result = result.filter((item) => item.reportType === "on-campus");
      } else if (filters.reportSource === "3") {
        result = result.filter((item) => item.reportType === "ojt");
      }
    }

    // Filter by dzongkhag - convert both to string for comparison
    if (filters.dzongkhag) {
      result = result.filter((item) => {
        const itemDzongkhag = item.dzongkhagId ? String(item.dzongkhagId) : "";
        const filterDzongkhag = String(filters.dzongkhag);
        return itemDzongkhag === filterDzongkhag;
      });
    }

    // Filter by date range
    if (filters.startDate) {
      result = result.filter((item) => {
        if (item.reportType === "ojt") {
          return (
            item.agreementEndDate &&
            new Date(item.agreementEndDate) >= new Date(filters.startDate)
          );
        }
        return (
          item.placementDate &&
          new Date(item.placementDate) >= new Date(filters.startDate)
        );
      });
    }
    if (filters.endDate) {
      result = result.filter((item) => {
        if (item.reportType === "ojt") {
          return (
            item.agreementEndDate &&
            new Date(item.agreementEndDate) <= new Date(filters.endDate)
          );
        }
        return (
          item.placementDate &&
          new Date(item.placementDate) <= new Date(filters.endDate)
        );
      });
    }

    setFilteredReports(result);
    setPage(0);
  };

  const getSourceChip = (source) => {
    const config = {
      "On-Campus": { color: "primary", label: "On-Campus" },
      OJT: { color: "secondary", label: "OJT" },
    };
    const sourceConfig = config[source] || config["On-Campus"];
    return (
      <Chip
        size="small"
        label={sourceConfig.label}
        color={sourceConfig.color}
        sx={{ fontWeight: 500, borderRadius: 2 }}
      />
    );
  };

  const getEmploymentStatusName = (id) => {
    if (!id) return "Not Set";
    const found = employmentStatuses.find((s) => String(s.id) === String(id));
    return found?.name || "Not Set";
  };

  const getDzongkhagName = (id) => {
    if (!id) return "N/A";
    const found = dzongkhags.find((d) => String(d.id) === String(id));
    return found?.dzonkhagName || "N/A";
  };

  const getInstituteName = (id) => {
    if (!id) return "N/A";
    return instituteNames[id] || id;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  // ===== HANDLERS =====
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      reportSource: "",
      dzongkhag: "",
      startDate: "",
      endDate: "",
    });
    setPage(0);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ===== EXPORT TO EXCEL =====
  const handleExcelExport = () => {
    const today = new Date().toISOString().split("T")[0];

    const data = filteredReports.map((item, index) => ({
      SlNo: index + 1,
      ParticipantName: item.participantName || "N/A",
      CitizenID: item.citizenId || "N/A",
      TrainingProgram: item.trainingProgram || "N/A",
      CompanyName: item.companyName || "N/A",
      Position: item.position || "N/A",
      Source: item.source || "N/A",
      EmploymentStatus: getEmploymentStatusName(item.employmentStatus),
      PlacementDate:
        item.reportType === "ojt"
          ? `${formatDate(item.agreementStartDate)} - ${formatDate(item.agreementEndDate)}`
          : formatDate(item.placementDate),
      Salary: item.salary || "N/A",
      Dzongkhag: getDzongkhagName(item.dzongkhagId),
      Institute: getInstituteName(item.instituteId),
      Remarks: item.remarks || "N/A",
    }));

    exportToExcel(data, `Job_Placement_Report_${today}`);
    toast.success("Report exported successfully!");
  };

  // ===== PAGINATION =====
  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Training Job Placement Report
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={PeopleIcon}
            title="Total Participants"
            value={statistics.total}
            color="primary"
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={TrendingUpIcon}
            title="Placement Rate"
            value={`${statistics.placementRate}%`}
            color="success"
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={SchoolIcon}
            title="On-Campus"
            value={statistics.onCampus}
            color="info"
            subtitle="Placements"
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={WorkIcon}
            title="OJT"
            value={statistics.ojt}
            color="secondary"
            subtitle="Placements"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Report Source</InputLabel>
            <Select
              name="reportSource"
              value={filters.reportSource}
              onChange={handleFilterChange}
              label="Report Source"
            >
              {reportSourceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 2.4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Dzongkhag</InputLabel>
            <Select
              name="dzongkhag"
              value={filters.dzongkhag}
              onChange={handleFilterChange}
              label="Dzongkhag"
            >
              <MenuItem value="">All Dzongkhags</MenuItem>
              {dzongkhags.map((dz) => (
                <MenuItem key={dz.id} value={dz.id}>
                  {dz.dzonkhagName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item size={{ xs: 12, md: 2.4 }}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 2.4 }}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 2.4 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              size="small"
              fullWidth
            >
              Clear
            </Button>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              size="small"
              disabled={loading}
              fullWidth
            >
              Refresh
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Search and Export */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid item size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by participant name, CID, company, or position..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={filteredReports.length === 0}
            onClick={handleExcelExport}
            size="small"
            fullWidth
          >
            Export to Excel
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Table */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": {
              border: "1px solid #ccc",
              padding: "8px",
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Participant Name</TableCell>
              <TableCell>CID</TableCell>
              <TableCell>Training Program</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Placement Date</TableCell>
              <TableCell>Source</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  Loading reports...
                </TableCell>
              </TableRow>
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow key={`${report.traineeId}_${index}`} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {report.participantName || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>{report.citizenId || "N/A"}</TableCell>
                  <TableCell>{report.trainingProgram || "N/A"}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2">
                        {report.companyName || "N/A"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{report.position || "N/A"}</TableCell>
                  <TableCell>
                    {report.reportType === "ojt" ? (
                      <Box>
                        <Typography variant="body2">
                          {formatDate(report.agreementStartDate)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          to {formatDate(report.agreementEndDate)}
                        </Typography>
                      </Box>
                    ) : (
                      formatDate(report.placementDate)
                    )}
                  </TableCell>
                  <TableCell>{getSourceChip(report.source)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  {!filters.reportSource &&
                  !filters.search &&
                  !filters.dzongkhag &&
                  !filters.startDate &&
                  !filters.endDate
                    ? "No placement reports found"
                    : "No reports found matching your filters"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedReports.length} of {filteredReports.length} reports
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Paper>
  );
};

export default TrainingJobPlacementReportIndex;
