// NcsPublication.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
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
  Divider,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
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

// ==================== CONSTANTS ====================
const FILE_ICON_MAP = {
  pdf: { icon: PictureAsPdfIcon, color: "error" },
  jpg: { icon: ImageIcon, color: "primary" },
  jpeg: { icon: ImageIcon, color: "primary" },
  png: { icon: ImageIcon, color: "primary" },
  gif: { icon: ImageIcon, color: "primary" },
  bmp: { icon: ImageIcon, color: "primary" },
  svg: { icon: ImageIcon, color: "primary" },
  doc: { icon: DescriptionIcon, color: "primary" },
  docx: { icon: DescriptionIcon, color: "primary" },
  xls: { icon: DescriptionIcon, color: "success" },
  xlsx: { icon: DescriptionIcon, color: "success" },
};


// ==================== DATA HELPERS ====================
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

/** Map an API row to the shape this page renders (same fields as the NCS create page). */
const transformNcs = (item) => ({
  id: item.id,
  applicationNo: item.application_no || "",
  sector: item.sector_name || "N/A",
  occupation: item.occupation_name || "N/A",
  bqfLevel: item.certification_level || "N/A",
  validityDate: item.validity_date
    ? String(item.validity_date).split("T")[0]
    : "N/A",
  programmeTitle: item.programme_title || "N/A",
  units: parseJsonArray(item.units).filter((u) => u && (u.unitCode || u.unitTitle)),
  documents: parseJsonArray(item.documents)
    .filter((d) => d && (d.id || d.url))
    .map((d) => ({
      id: d.id,
      name: d.documentName || d.name || "Unnamed file",
      url: d.url || null,
    })),
});

// ==================== PROPTYPES ====================

const filterBarPropTypes = {
  sectors: PropTypes.arrayOf(PropTypes.string).isRequired,
  filters: PropTypes.shape({
    sector: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

const unitCodesPropTypes = {
  units: PropTypes.arrayOf(
    PropTypes.shape({
      unitCode: PropTypes.string,
      unitTitle: PropTypes.string,
    }),
  ),
};

const unitTitlesPropTypes = {
  units: PropTypes.arrayOf(
    PropTypes.shape({
      unitCode: PropTypes.string,
      unitTitle: PropTypes.string,
    }),
  ),
};

const fileAttachmentsPropTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      url: PropTypes.string,
    }),
  ),
  onView: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const dataTablePropTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      field: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool,
  footer: PropTypes.node,
};

// ==================== UTILITY FUNCTIONS ====================
const getFileExtension = (fileName) => {
  if (!fileName) return "";
  return fileName.split(".").pop()?.toLowerCase() || "";
};

const getFileIcon = (fileName) => {
  const extension = getFileExtension(fileName);
  const fileType = FILE_ICON_MAP[extension];
  if (fileType) {
    const Icon = fileType.icon;
    return <Icon color={fileType.color} />;
  }
  return <InsertDriveFileIcon />;
};

const getUniqueSectors = (data) => {
  return ["All", ...new Set(data.map((item) => item.sector))];
};

// ==================== CUSTOM HOOKS ====================
const useFilters = (data) => {
  const [filters, setFilters] = useState({
    sector: "All",
    search: "",
  });

  const filteredData = useMemo(() => {
    let result = [...data];

    if (filters.sector && filters.sector !== "All") {
      result = result.filter((item) => item.sector === filters.sector);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const has = (v) => String(v || "").toLowerCase().includes(searchLower);
      result = result.filter(
        (item) =>
          has(item.sector) ||
          has(item.occupation) ||
          has(item.bqfLevel) ||
          has(item.programmeTitle) ||
          item.units.some((unit) => has(unit.unitCode) || has(unit.unitTitle)),
      );
    }

    return result;
  }, [data, filters]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ sector: "All", search: "" });
  }, []);

  return {
    filters,
    filteredData,
    handleFilterChange,
    handleClearFilters,
  };
};

const usePagination = (data) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const paginatedData = useMemo(() => {
    return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [data, page, rowsPerPage]);

  return {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

// ==================== REUSABLE COMPONENTS ====================
const FilterBar = ({ sectors, filters, onFilterChange }) => (
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
        onChange={onFilterChange}
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
        label="Search NCS"
        name="search"
        variant="outlined"
        size="small"
        fullWidth
        value={filters.search}
        onChange={onFilterChange}
        placeholder="Search by Occupation, Programme Title or Unit"
        sx={INPUT_SX}
      />
    </Grid>
  </Grid>
);

FilterBar.propTypes = filterBarPropTypes;

const UnitCodes = ({ units }) => {
  if (!units || units.length === 0) return "N/A";
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
      {units.map((unit, idx) => (
        <Box key={`code-${idx}`} sx={{ mb: 0.5 }}>
          <Chip
            label={unit.unitCode}
            size="small"
            color="secondary"
            variant="outlined"
          />
          {idx < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
        </Box>
      ))}
    </Box>
  );
};

UnitCodes.propTypes = unitCodesPropTypes;

const UnitTitles = ({ units }) => {
  if (!units || units.length === 0) return "N/A";
  return units.map((unit, idx) => (
    <Box key={`title-${idx}`} sx={{ mb: 0.5 }}>
      <Typography variant="body2">{unit.unitTitle}</Typography>
      {idx < units.length - 1 && <Divider sx={{ my: 0.5 }} />}
    </Box>
  ));
};

UnitTitles.propTypes = unitTitlesPropTypes;

const FileAttachments = ({ documents, onView, onDownload, disabled }) => {
  if (!documents || documents.length === 0) {
    return (
      <Typography variant="caption" color="textSecondary">
        No files
      </Typography>
    );
  }

  return (
    <Stack direction="column" spacing={0.5}>
      {documents.map((file, index) => (
        <Box
          key={index}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          {getFileIcon(file.name)}
          <Typography
            variant="caption"
            sx={{
              maxWidth: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name || `File ${index + 1}`}
          </Typography>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => onView(file)}
              disabled={disabled || !file.url}
              sx={{ p: 0.3 }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton
              size="small"
              onClick={() => onDownload(file)}
              disabled={disabled || !file.url}
              sx={{ p: 0.3 }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Stack>
  );
};

FileAttachments.propTypes = fileAttachmentsPropTypes;

const DataTable = ({
  columns,
  data,
  page,
  rowsPerPage,
  emptyMessage = "No data available in table",
  loading = false,
  footer = null,
}) => {
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table size="small" sx={TABLE_SX}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            {columns.map((col) => (
              <TableCell key={col.id}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center">
                <CircularProgress size={30} />
              </TableCell>
            </TableRow>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    {col.render ? col.render(item) : item[col.field] || "N/A"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {footer}
    </TableContainer>
  );
};

DataTable.propTypes = dataTablePropTypes;

// ==================== MAIN COMPONENT ====================
const NcsPublication = () => {
  const [allStandards, setAllStandards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const filters = useFilters(allStandards);
  const pagination = usePagination(filters.filteredData);

  // Load NCS data from the backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PublicPageService.getNcsPublications();
        if (res instanceof Error || res?.isAxiosError) throw res;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setAllStandards(rows.map(transformNcs));
      } catch (error) {
        console.error("Error fetching NCS publications:", error);
        toast.error("Failed to load National Competency Standards");
        setAllStandards([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    pagination.handleChangePage(null, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.filteredData.length]);

  const sectors = useMemo(() => getUniqueSectors(allStandards), [allStandards]);

  /** Fetch a stored document as a blob URL (same API as the NCS create page). */
  const fetchBlobUrl = async (file) => {
    const response = await CommonService.fetchDocument(file.name, file.url);
    const blob = new Blob([response.data], {
      type: response.headers?.["content-type"] || "application/octet-stream",
    });
    return window.URL.createObjectURL(blob);
  };

  const handleFileView = useCallback(async (file) => {
    if (!file?.url) {
      toast.error("File not available");
      return;
    }
    try {
      setDownloading(true);
      const url = await fetchBlobUrl(file);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error("Failed to open file");
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleFileDownload = useCallback(async (file) => {
    if (!file?.url) {
      toast.error("File not available");
      return;
    }
    try {
      setDownloading(true);
      const url = await fetchBlobUrl(file);
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
  }, []);

  // Table columns configuration
  const columns = [
    { id: "sector", label: "Sector", render: (item) => item.sector },
    { id: "occupation", label: "Occupation", render: (item) => item.occupation },
    {
      id: "bqfLevel",
      label: "BQF Certificate Level",
      render: (item) => (
        <Chip
          label={item.bqfLevel}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    { id: "validityDate", label: "Validity Date", render: (item) => item.validityDate },
    {
      id: "programmeTitle",
      label: "Programme Title",
      render: (item) => item.programmeTitle,
    },
    {
      id: "unitCode",
      label: "Unit Code",
      render: (item) => <UnitCodes units={item.units} />,
    },
    {
      id: "unitTitle",
      label: "Unit Title",
      render: (item) => <UnitTitles units={item.units} />,
    },
    {
      id: "documents",
      label: "File Attachment(s)",
      render: (item) => (
        <FileAttachments
          documents={item.documents}
          onView={handleFileView}
          onDownload={handleFileDownload}
          disabled={downloading}
        />
      ),
    },
  ];

  return (
    <Paper {...PAPER_PROPS}>
      <Typography variant="h5" gutterBottom>
        National Competency Standards (NCS)
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Published National Competency Standards with their units and
          attachments.
        </Typography>
      </Box>

      <FilterBar
        sectors={sectors}
        filters={filters.filters}
        onFilterChange={filters.handleFilterChange}
      />

      <DataTable
        columns={columns}
        data={filters.filteredData}
        page={pagination.page}
        rowsPerPage={pagination.rowsPerPage}
        loading={loading}
        emptyMessage={
          filters.filters.search || filters.filters.sector !== "All"
            ? "No records match your filters"
            : "No data available in table"
        }
        footer={
          <TablePagination
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            component="div"
            count={filters.filteredData.length}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={pagination.handleChangePage}
            onRowsPerPageChange={pagination.handleChangeRowsPerPage}
          />
        }
      />
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
NcsPublication.propTypes = {};

export default NcsPublication;
