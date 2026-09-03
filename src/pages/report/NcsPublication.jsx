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
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid #ddd",
  "& th, & td": {
    border: "1px solid #ddd",
    padding: "10px 12px",
  },
};

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

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ==================== SAMPLE DATA ====================
const SAMPLE_DATA = [
  {
    id: 1,
    sector: "Construction",
    occupationTitle: "Mason",
    ncsCode: "BQF-2024-001",
    qualificationLevel: "Certificate Level I",
    validity: "2027-03-25",
    courseTitle: "Masonry Course",
    units: [
      { unitCode: "BQF-2024-001", unitTitle: "Basic Masonry Techniques" },
      { unitCode: "BQF-2024-002", unitTitle: "Advanced Masonry Techniques" },
    ],
    documents: [
      {
        name: "Masonry_NCS.pdf",
        documentId: 1,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: 2,
    sector: "Construction",
    occupationTitle: "Plumber",
    ncsCode: "BQF-2026-001",
    qualificationLevel: "Certificate Level I",
    validity: "2027-03-25",
    courseTitle: "Plumbing Course",
    units: [
      { unitCode: "BQF-2026-001", unitTitle: "Basic Plumbing Systems" },
      { unitCode: "BQF-2026-002", unitTitle: "Advanced Plumbing Systems" },
      { unitCode: "BQF-2026-003", unitTitle: "Pipe Fitting Techniques" },
    ],
    documents: [
      {
        name: "Plumbing_NCS.pdf",
        documentId: 2,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: 3,
    sector: "Construction",
    occupationTitle: "Carpenter",
    ncsCode: "BQF-2025-001",
    qualificationLevel: "Certificate Level II",
    validity: "2027-06-30",
    courseTitle: "Carpentry Course",
    units: [
      { unitCode: "BQF-2025-001", unitTitle: "Basic Carpentry Skills" },
      { unitCode: "BQF-2025-002", unitTitle: "Advanced Woodworking" },
    ],
    documents: [
      {
        name: "Carpentry_NCS.pdf",
        documentId: 3,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: 4,
    sector: "Information Technology",
    occupationTitle: "Software Developer",
    ncsCode: "BQF-2023-001",
    qualificationLevel: "Diploma",
    validity: "2027-12-31",
    courseTitle: "Full Stack Development",
    units: [
      { unitCode: "BQF-2023-001", unitTitle: "Frontend Development" },
      { unitCode: "BQF-2023-002", unitTitle: "Backend Development" },
      { unitCode: "BQF-2023-003", unitTitle: "Database Management" },
      { unitCode: "BQF-2023-004", unitTitle: "DevOps Fundamentals" },
    ],
    documents: [
      {
        name: "Software_Developer_NCS.pdf",
        documentId: 4,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: 5,
    sector: "Manufacturing",
    occupationTitle: "Welder",
    ncsCode: "BQF-2022-001",
    qualificationLevel: "Certificate Level II",
    validity: "2026-12-31",
    courseTitle: "Welding Course",
    units: [
      { unitCode: "BQF-2022-001", unitTitle: "Basic Welding" },
      { unitCode: "BQF-2022-002", unitTitle: "Advanced Welding" },
    ],
    documents: [
      {
        name: "Welding_NCS.pdf",
        documentId: 5,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: 6,
    sector: "Healthcare",
    occupationTitle: "Nurse",
    ncsCode: "BQF-2021-001",
    qualificationLevel: "Certificate Level III",
    validity: "2028-06-30",
    courseTitle: "Nursing Course",
    units: [
      { unitCode: "BQF-2021-001", unitTitle: "Basic Nursing" },
      { unitCode: "BQF-2021-002", unitTitle: "Advanced Nursing" },
    ],
    documents: [
      {
        name: "Nursing_NCS.pdf",
        documentId: 6,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: 7,
    sector: "Agriculture",
    occupationTitle: "Farmer",
    ncsCode: "BQF-2020-001",
    qualificationLevel: "Certificate Level I",
    validity: "2029-12-31",
    courseTitle: "Farming Course",
    units: [{ unitCode: "BQF-2020-001", unitTitle: "Basic Farming" }],
    documents: [
      {
        name: "Farming_NCS.pdf",
        documentId: 7,
        contentType: "application/pdf",
      },
    ],
  },
];

// ==================== PROPTYPES ====================

const filterBarPropTypes = {
  sectors: PropTypes.arrayOf(PropTypes.string).isRequired,
  filters: PropTypes.shape({
    sector: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
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
      name: PropTypes.string,
      documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      contentType: PropTypes.string,
      url: PropTypes.string,
      content: PropTypes.string,
    }),
  ),
  onView: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
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
};

const paginationFooterPropTypes = {
  count: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
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
      result = result.filter(
        (item) =>
          item.occupationTitle.toLowerCase().includes(searchLower) ||
          item.ncsCode.toLowerCase().includes(searchLower) ||
          item.sector.toLowerCase().includes(searchLower) ||
          item.courseTitle.toLowerCase().includes(searchLower) ||
          item.units.some(
            (unit) =>
              unit.unitCode.toLowerCase().includes(searchLower) ||
              unit.unitTitle.toLowerCase().includes(searchLower),
          ),
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
const FilterBar = ({
  sectors,
  filters,
  onFilterChange,
  onClearFilters,
  rowsPerPage,
  onRowsPerPageChange,
}) => (
  <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
    <Grid item size={{ xs: 12, md: 3 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Sector</InputLabel>
        <Select
          name="sector"
          value={filters.sector}
          onChange={onFilterChange}
          label="Sector"
        >
          {sectors.map((sector) => (
            <MenuItem key={sector} value={sector}>
              {sector}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item size={{ xs: 12, md: 3 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Show</InputLabel>
        <Select value={rowsPerPage} onChange={onRowsPerPageChange} label="Show">
          {ROWS_PER_PAGE_OPTIONS.map((value) => (
            <MenuItem key={value} value={value}>
              {value} entries
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item size={{ xs: 12, md: 6 }}>
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <TextField
          size="small"
          placeholder="Search by Occupation, NCS Code, Course Title..."
          name="search"
          value={filters.search}
          onChange={onFilterChange}
          sx={{ flex: 1, maxWidth: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button variant="contained" color="secondary" onClick={onClearFilters}>
          Clear
        </Button>
      </Box>
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

const FileAttachments = ({ documents, onView, onDownload }) => {
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
              sx={{ p: 0.3 }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton
              size="small"
              onClick={() => onDownload(file)}
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
  emptyMessage = "No data available",
}) => {
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <TableContainer>
      <Table size="small" sx={TABLE_STYLE}>
        <TableHead>
          <TableRow sx={{ background: "#f5f7fa" }}>
            <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
            {columns.map((col) => (
              <TableCell key={col.id} sx={{ fontWeight: 600 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <TableRow key={item.id} hover>
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
              <TableCell
                colSpan={columns.length + 1}
                align="center"
                sx={{ py: 4 }}
              >
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

DataTable.propTypes = dataTablePropTypes;

const PaginationFooter = ({
  count,
  rowsPerPage,
  page,
  onPageChange,
  onRowsPerPageChange,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 1,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      Showing {Math.min((page + 1) * rowsPerPage, count)} of {count} entries
    </Typography>
    <TablePagination
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      component="div"
      count={count}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  </Box>
);

PaginationFooter.propTypes = paginationFooterPropTypes;

// ==================== MAIN COMPONENT ====================
const NcsPublication = () => {
  const [allStandards, setAllStandards] = useState([]);
  const filters = useFilters(allStandards);
  const pagination = usePagination(filters.filteredData);

  // Load data on mount
  useEffect(() => {
    setAllStandards(SAMPLE_DATA);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    pagination.handleChangePage(null, 0);
  }, [filters.filteredData.length]);

  const sectors = useMemo(() => getUniqueSectors(allStandards), [allStandards]);

  const handleFileView = useCallback((file) => {
    if (file.documentId) {
      window.open(
        `/api/v1/user/management/ncs/download-file/${file.documentId}`,
        "_blank",
      );
    } else if (file.url) {
      window.open(file.url, "_blank");
    } else if (file.content) {
      const fileUrl = `data:${file.contentType || "application/octet-stream"};base64,${file.content}`;
      window.open(fileUrl, "_blank");
    } else {
      alert("File URL not available");
    }
  }, []);

  const handleFileDownload = useCallback((file) => {
    const downloadFile = (url, filename) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (file.documentId) {
      downloadFile(
        `/api/v1/user/management/ncs/download-file/${file.documentId}`,
        file.name,
      );
    } else if (file.url) {
      downloadFile(file.url, file.name);
    } else if (file.content) {
      const fileUrl = `data:${file.contentType || "application/octet-stream"};base64,${file.content}`;
      downloadFile(fileUrl, file.name);
    } else {
      alert("File content not available");
    }
  }, []);

  // Table columns configuration
  const columns = [
    {
      id: "sector",
      label: "Sector",
      render: (item) => item.sector,
    },
    {
      id: "occupationTitle",
      label: "Occupation Title",
      render: (item) => item.occupationTitle,
    },
    {
      id: "ncsCode",
      label: "NCS Code",
      render: (item) => (
        <Chip
          label={item.ncsCode}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      id: "qualificationLevel",
      label: "BQF Level",
      render: (item) => (
        <Chip
          label={item.qualificationLevel}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ),
    },
    {
      id: "courseTitle",
      label: "Course Title",
      render: (item) => item.courseTitle,
    },
    {
      id: "validity",
      label: "Validity",
      render: (item) => item.validity,
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
        />
      ),
    },
  ];

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        National Competency Standards (NCS)
      </Typography>

      <FilterBar
        sectors={sectors}
        filters={filters.filters}
        onFilterChange={filters.handleFilterChange}
        onClearFilters={filters.handleClearFilters}
        rowsPerPage={pagination.rowsPerPage}
        onRowsPerPageChange={pagination.handleChangeRowsPerPage}
      />

      <Divider sx={{ my: 2 }} />

      <DataTable
        columns={columns}
        data={filters.filteredData}
        page={pagination.page}
        rowsPerPage={pagination.rowsPerPage}
        emptyMessage={
          filters.filters.search || filters.filters.sector !== "All"
            ? "No records found matching your filters"
            : "No data available"
        }
      />

      <Divider sx={{ my: 2 }} />

      <PaginationFooter
        count={filters.filteredData.length}
        rowsPerPage={pagination.rowsPerPage}
        page={pagination.page}
        onPageChange={pagination.handleChangePage}
        onRowsPerPageChange={pagination.handleChangeRowsPerPage}
      />
    </Paper>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
NcsPublication.propTypes = {};

export default NcsPublication;
