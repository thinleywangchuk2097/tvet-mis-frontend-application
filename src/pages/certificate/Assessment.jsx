import { useState, useEffect, useCallback } from "react";
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
  Button,
  Box,
  Divider,
  TablePagination,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";
import { useSelector } from "react-redux";
import {
  generateAssessmentCertificatePdf,
  generateAllAssessmentCertificatesPdf,
} from "@/utils/assessmentCertificatePdf";
import CertificationService from "../../api/services/internal/certification/CertificationService";
import CommonService from "../../api/services/internal/common/CommonService";

const CERTIFICATION_LEVEL_PARENT_ID = 27;

/** Always returns an array, no matter what the API shape is. */
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const Assessment = () => {
  const [filters, setFilters] = useState({
    instituteList: "",
    serviceList: "",
    programmeList: "",
    certificationLevelList: "",
    ApplicationNo: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [instituteId, setInstituteId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [certificationLevelId, setCertificationLevelId] = useState("");

  const [instituteList, setInstituteList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [programmeList, setProgrammeList] = useState([]);
  const [certificationLevelList, setCertificationLevelList] = useState([]);

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const access_token = useSelector((state) => state.auth.accessToken);

  // ============================================================
  // FETCHERS — all guarded and safe
  // ============================================================

  const fetchAssessmentInstitutes = useCallback(async () => {
    if (!access_token) return;
    try {
      const res =
        await CertificationService.getAssessmentInstitutes(access_token);
      setInstituteList(toArray(res));
    } catch (error) {
      console.error("Error fetching Institute:", error);
      setInstituteList([]);
    }
  }, [access_token]);

  const fetchServices = useCallback(async () => {
    if (!access_token) return;
    try {
      const res =
        await CertificationService.getServicesAssessementResult(access_token);
        console.log("Fetched Services:", res.data);
      setServiceList(toArray(res));
    } catch (error) {
      console.error("Error fetching Services:", error);
      setServiceList([]);
    }
  }, [access_token]);

  const fetchCertificationLevels = useCallback(async () => {
    try {
      const res = await CommonService.getByParentId(
        CERTIFICATION_LEVEL_PARENT_ID,
      );
      console.log("Fetched Certification Levels:", res.data);
      setCertificationLevelList(toArray(res));
    } catch (error) {
      console.error("Error fetching Certification Levels:", error);
      setCertificationLevelList([]);
    }
  }, []);

  const fetchProgrammes = useCallback(async () => {
    if (!access_token) return;
    try {
      const res = await CertificationService.getProgrammesCertification(
        instituteId,
        serviceId,
        certificationLevelId,
        access_token,
      );
      setProgrammeList(toArray(res));
    } catch (error) {
      console.error("Error fetching Programmes:", error);
      setProgrammeList([]);
    }
  }, [instituteId, serviceId, certificationLevelId, access_token]);

  const fetchPassedTrainees = useCallback(async () => {
    const hasApplicationNo = !!filters.ApplicationNo;
    const hasAllFour =
      !!instituteId &&
      !!serviceId &&
      !!certificationLevelId &&
      !!filters.programmeList;

    if (hasApplicationNo && hasAllFour) {
      toast.warning(
        "Please use either Application No alone, or the four filters together.",
      );
      return;
    }
    if (!hasApplicationNo && !hasAllFour) {
      toast.warning(
        "Enter Application No, or select Institute + Service + Certification Level + Programme.",
      );
      return;
    }
    if (!access_token) {
      toast.error("Session not ready. Please wait a moment and try again.");
      return;
    }

    setLoadingReports(true);
    try {
      const res = hasApplicationNo
        ? await CertificationService.getListPassTraineeForCertificatePrinting(
            filters.ApplicationNo,
            null,
            null,
            null,
            null,
            access_token,
          )
        : await CertificationService.getListPassTraineeForCertificatePrinting(
            null,
            instituteId,
            serviceId,
            certificationLevelId,
            filters.programmeList,
            access_token,
          );
      console.log("Fetched passed trainees:", res.data);
      setReports(toArray(res));
      setPage(0);
    } catch (error) {
      console.error("Error fetching passed trainees:", error);
      toast.error("Failed to fetch trainee certificate data");
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [
    filters.ApplicationNo,
    filters.programmeList,
    instituteId,
    serviceId,
    certificationLevelId,
    access_token,
  ]);

  useEffect(() => {
    if (!access_token) return;
    void fetchAssessmentInstitutes();
    void fetchServices();
    void fetchCertificationLevels();
  }, [
    access_token,
    fetchAssessmentInstitutes,
    fetchServices,
    fetchCertificationLevels,
  ]);

  useEffect(() => {
    if (instituteId && serviceId && certificationLevelId) {
      void fetchProgrammes();
    } else {
      setProgrammeList([]);
    }
  }, [instituteId, serviceId, certificationLevelId, fetchProgrammes]);

  // ============================================================
  // EXPORT / PDF
  // ============================================================

  const today = new Date().toISOString().split("T")[0];

  const handleExcel = () => {
    const data = reports.map((item, index) => ({
      SlNo: index + 1,
      Name: item.applicant_name || item.name || item.trainee_name || "",
      CID: item.cid_no || item.cid || item.reference_no || "",
      Gender: item.gender || "",
      Programme: item.programme_title || item.programme || "",
      Certificate: item.certification_level || item.certificate || "",
      InternalAssessment: item.internal_assessment ?? item.internal ?? "",
      TheoryAssessment: item.theory_assessment ?? item.theory ?? "",
      PracticalAssessment: item.practical_assessment ?? item.practical ?? "",
      VivaAssessment: item.viva_assessment ?? item.viva ?? "",
      Result: item.result_status || item.result || "",
    }));
    exportToExcel(data, `Assessment_Result_${today}`);
  };

  const handlePdf = async (report) => {
    try {
      await generateAssessmentCertificatePdf(report);
    } catch (err) {
      console.error("❌ Certificate generation failed");
      console.error("   message:", err?.message);
      console.error("   stack:", err?.stack);
      console.error("   error:", err);
      toast.error(
        `Could not generate certificate: ${err?.message || "unknown"}`,
      );
    }
  };

  const handleDownloadAll = async () => {
    if (!reports.length) return;
    try {
      await generateAllAssessmentCertificatesPdf(reports);
    } catch (err) {
      console.error("❌ Bulk certificate generation failed");
      console.error("   message:", err?.message);
      console.error("   stack:", err?.stack);
      console.error("   error:", err);
      toast.error(
        `Could not generate certificates: ${err?.message || "unknown"}`,
      );
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleInstituteChange = (_event, newValue) => {
    const value = newValue ? newValue.institute_id : "";
    setInstituteId(value);
    setFilters((prev) => ({
      ...prev,
      instituteList: value,
      programmeList: "",
    }));
    setPage(0);
  };

  const handleServiceChange = (_event, newValue) => {
    const value = newValue ? newValue.id : "";
    setServiceId(value);
    setCertificationLevelId("");
    setFilters((prev) => ({
      ...prev,
      serviceList: value,
      certificationLevelList: "",
      programmeList: "",
    }));
    setPage(0);
  };

  const handleCertificationLevelChange = (_event, newValue) => {
    const value = newValue ? newValue.id : "";
    setCertificationLevelId(value);
    setFilters((prev) => ({
      ...prev,
      certificationLevelList: value,
      programmeList: "",
    }));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    void fetchPassedTrainees();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    setFilters({
      instituteList: "",
      serviceList: "",
      programmeList: "",
      certificationLevelList: "",
      ApplicationNo: "",
    });
    setInstituteId("");
    setServiceId("");
    setCertificationLevelId("");
    setReports([]);
    setPage(0);
  };

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const safeReports = Array.isArray(reports) ? reports : [];
  const paginatedReports = safeReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const selectedInstitute =
    instituteList.find(
      (ins) => String(ins.institute_id) === String(filters.instituteList),
    ) || null;
  const selectedService =
    serviceList.find((s) => String(s.id) === String(filters.serviceList)) ||
    null;
  const selectedCertificationLevel =
    certificationLevelList.find(
      (c) => String(c.id) === String(filters.certificationLevelList),
    ) || null;
  const selectedProgramme =
    programmeList.find((p) => String(p.id) === String(filters.programmeList)) ||
    null;

  const programmeDisabled = !instituteId || !serviceId || !certificationLevelId;

  const hasApplicationNo = !!filters.ApplicationNo;
  const hasAllFour =
    !!instituteId &&
    !!serviceId &&
    !!certificationLevelId &&
    !!filters.programmeList;

  const canSearch =
    (hasApplicationNo && !hasAllFour) || (!hasApplicationNo && hasAllFour);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" mb={3}>
        Assessment Certificate
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Institute */}
        <Grid item size={{ xs: 12, md: 3 }}>
          <Autocomplete
            size="small"
            options={instituteList}
            value={selectedInstitute}
            onChange={handleInstituteChange}
            getOptionLabel={(option) => option.proposed_institute_name || ""}
            isOptionEqualToValue={(option, value) =>
              option.institute_id === value.institute_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Institute"
                placeholder="Search..."
              />
            )}
          />
        </Grid>

        {/* Service */}
        <Grid item size={{ xs: 12, md: 3 }}>
          <Autocomplete
            size="small"
            options={serviceList}
            value={selectedService}
            onChange={handleServiceChange}
            getOptionLabel={(option) => option.service_name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} label="Service" placeholder="Search..." />
            )}
          />
        </Grid>

        {/* Certification Level */}
        <Grid item size={{ xs: 12, md: 3 }}>
          <Autocomplete
            size="small"
            options={certificationLevelList}
            value={selectedCertificationLevel}
            onChange={handleCertificationLevelChange}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Certification Level"
                placeholder="Search..."
              />
            )}
          />
        </Grid>

        {/* Programme */}
        <Grid item size={{ xs: 12, md: 3 }}>
          <Autocomplete
            size="small"
            options={programmeList}
            value={selectedProgramme}
            onChange={(_event, newValue) => {
              const value = newValue ? newValue.id : "";
              setFilters((prev) => ({ ...prev, programmeList: value }));
              setPage(0);
            }}
            getOptionLabel={(option) => option.programme_title || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={programmeDisabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Programme"
                placeholder={
                  programmeDisabled ? "Select all above first" : "Search..."
                }
              />
            )}
          />
        </Grid>

        {/* Application No + Search */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <TextField
              fullWidth
              label="Application No"
              type="number"
              name="ApplicationNo"
              value={filters.ApplicationNo}
              onChange={handleFilterChange}
              onKeyDown={handleSearchKeyDown}
              size="small"
              helperText="Use this alone, or fill all four filters above."
            />
            <Button
              variant="contained"
              size="medium"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loadingReports || !canSearch}
              sx={{ textTransform: "none", minWidth: 120, height: 40 }}
            >
              {loadingReports ? "Loading..." : "Search"}
            </Button>
          </Box>
        </Grid>

        {/* Clear / Export */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={handleClearFilters}
              sx={{ minWidth: 120 }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={safeReports.length === 0}
              onClick={handleExcel}
              sx={{ minWidth: 120 }}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <TableContainer>
        <Table
          size="small"
          sx={{
            border: "1px solid #ccc",
            "& th, & td": { border: "1px solid #ccc", padding: "8px" },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                background: "#f5f5f5",
                "& .MuiTableCell-root": { fontWeight: "bold" },
              }}
            >
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>CID/Reference No</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Programme</TableCell>
              <TableCell>Certificate</TableCell>
              <TableCell>Internal Assessment</TableCell>
              <TableCell>Theory Assessment</TableCell>
              <TableCell>Practical Assessment</TableCell>
              <TableCell>Viva Assessment</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadAll}
                  disabled={safeReports.length === 0}
                  sx={{ textTransform: "none", fontWeight: "bold" }}
                >
                  Download All
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingReports ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow
                  key={
                    report.id || report.application_no || report.cid_no || index
                  }
                  hover
                >
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    {report.applicant_name ||
                      report.name ||
                      report.trainee_name ||
                      "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.cid_no ||
                      report.cid ||
                      report.reference_no ||
                      "N/A"}
                  </TableCell>
                  <TableCell>{report.gender || "N/A"}</TableCell>
                  <TableCell>
                    {report.programme_title || report.programme || "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.certification_level || report.certificate || "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.internal_assessment ?? report.internal ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.theory_assessment ?? report.theory ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.practical_assessment ?? report.practical ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.viva_assessment ?? report.viva ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {report.result_status || report.result || "N/A"}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handlePdf(report)}
                      sx={{ textTransform: "none" }}
                    >
                      Certificate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                  No trainee records found. Apply a valid filter and click
                  Search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {paginatedReports.length} of {safeReports.length} reports
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={safeReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            ".MuiTablePagination-select": { borderRadius: 1 },
            ".MuiTablePagination-displayedRows": { margin: 0 },
          }}
        />
      </Box>
    </Paper>
  );
};

export default Assessment;