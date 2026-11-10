import { useState, useEffect, useMemo } from "react";
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
  MenuItem,
  Box,
  TablePagination,
  Chip,
  CircularProgress,
  Link,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { toast } from "react-toastify";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/internal/common/CommonService";
import {
  PAPER_PROPS,
  TABLE_SX,
  INPUT_SX,
  SELECT_SX,
  ROWS_PER_PAGE_OPTIONS,
} from "../public/reports/reportStyles";

/** Parse a JSON column that may arrive as a string or an array. */
const parseJsonArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Map an API row to the fields shown on this page (same as the curriculum page). */
const transformCurriculum = (item) => ({
  id: item.id,
  applicationNo: item.application_no || "",
  sector: item.sector_name || "N/A",
  occupation: item.occupation_name || "N/A",
  curriculumTitle: item.curriculum_title || "N/A",
  programmeTitle: item.programme_title || "N/A",
  curriculumType: item.curriculum_type || "N/A",
  certificateLevel: item.certificate_level_name || "N/A",
  institute: item.institute_name || "N/A",
  documents: parseJsonArray(item.documents)
    .filter((d) => d && (d.id || d.url))
    .map((d) => ({
      id: d.id,
      name: d.documentName || d.name || "Unnamed file",
      url: d.url || null,
    })),
});

const CurriculumPublication = () => {
  const [filters, setFilters] = useState({
    sector: "All",
    search: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allCurriculums, setAllCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Load Endorsed curricula from the backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PublicPageService.getCurriculumPublications();
        if (res instanceof Error || res?.isAxiosError) throw res;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setAllCurriculums(rows.map(transformCurriculum));
      } catch (error) {
        console.error("Error fetching curriculum publications:", error);
        toast.error("Failed to load curriculum");
        setAllCurriculums([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Unique sectors from data
  const sectors = useMemo(
    () => ["All", ...new Set(allCurriculums.map((item) => item.sector))],
    [allCurriculums],
  );

  const filteredCurriculums = useMemo(() => {
    let result = allCurriculums;

    if (filters.sector && filters.sector !== "All") {
      result = result.filter((item) => item.sector === filters.sector);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const has = (v) => String(v || "").toLowerCase().includes(q);
      result = result.filter(
        (item) =>
          has(item.sector) ||
          has(item.occupation) ||
          has(item.curriculumTitle) ||
          has(item.programmeTitle) ||
          has(item.curriculumType) ||
          has(item.certificateLevel) ||
          has(item.institute),
      );
    }

    return result;
  }, [allCurriculums, filters.sector, filters.search]);

  useEffect(() => {
    setPage(0);
  }, [filters.sector, filters.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Download a stored document (same API as the curriculum page)
  const handleDownload = async (file) => {
    if (!file?.url) {
      toast.error("File not available");
      return;
    }
    setDownloading(true);
    try {
      const response = await CommonService.fetchDocument(file.name, file.url);
      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  const paginatedCurriculums = filteredCurriculums.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const COLS = 9;

  return (
    <Paper {...PAPER_PROPS}>
      <Typography variant="h5" gutterBottom>
        Curriculum
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Endorsed curricula with their programme, certificate level and
          attachments.
        </Typography>
      </Box>

      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 3 }}>
          <TextField
            select
            label="Sector"
            name="sector"
            size="small"
            fullWidth
            value={filters.sector}
            onChange={handleFilterChange}
            sx={SELECT_SX}
          >
            {sectors.map((sector) => (
              <MenuItem key={sector} value={sector}>
                {sector}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Curriculum"
            name="search"
            variant="outlined"
            size="small"
            fullWidth
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by Title, Occupation or Institute"
            sx={INPUT_SX}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_SX}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Occupation</TableCell>
              <TableCell>Curriculum Title</TableCell>
              <TableCell>Programme Title</TableCell>
              <TableCell>Curriculum Type</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>Institute</TableCell>
              <TableCell>File Attachment(s)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={COLS} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginatedCurriculums.length > 0 ? (
              paginatedCurriculums.map((item, index) => (
                <TableRow key={item.id ?? index}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{item.sector}</TableCell>
                  <TableCell>{item.occupation}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.curriculumTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.programmeTitle}</TableCell>
                  <TableCell>{item.curriculumType}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.certificateLevel}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{item.institute}</TableCell>
                  <TableCell>
                    {item.documents.length > 0 ? (
                      item.documents.map((doc, idx) => (
                        <Box
                          key={doc.id ?? idx}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mb: 0.5,
                          }}
                        >
                          <AttachFileIcon sx={{ fontSize: 16 }} color="primary" />
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => handleDownload(doc)}
                            disabled={downloading || !doc.url}
                            sx={{ textAlign: "left", wordBreak: "break-word" }}
                          >
                            {doc.name}
                          </Link>
                        </Box>
                      ))
                    ) : (
                      "No files"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={COLS} align="center">
                  {filters.search || filters.sector !== "All"
                    ? "No records match your filters"
                    : "No data available in table"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={filteredCurriculums.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Paper>
  );
};

export default CurriculumPublication;
