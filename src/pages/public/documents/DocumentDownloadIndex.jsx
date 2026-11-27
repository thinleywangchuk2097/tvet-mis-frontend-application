import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PublicationFormService from "../../../api/services/internal/public/PublicationFormService";
import { fileTypeMeta, formatDate, formatFileSize } from "./documentUtils";

const NAVY = "#0a2d6e";
const ROWS_PER_PAGE = 10;

const FileChip = ({ name, size }) => {
  const { Icon, color, label } = fileTypeMeta(name);
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(color, 0.1),
          color,
        }}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
        {size ? ` · ${formatFileSize(size)}` : ""}
      </Typography>
    </Stack>
  );
};
FileChip.propTypes = { name: PropTypes.string, size: PropTypes.number };

/**
 * Public download list for Publications or Forms (data from the API,
 * maintained by TVET QC).
 */
const DocumentDownloadIndex = ({ category, title, subtitle, noun }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState("publishedDate");
  const [order, setOrder] = useState("desc");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    PublicationFormService.getPublicDocuments(category).then((res) => {
      if (!alive) return;
      const ok = res && !(res instanceof Error) && Array.isArray(res.data);
      setRows(ok ? res.data : []);
      setError(!ok);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rows.filter((r) =>
          [r.title, r.remarks, r.fileName].some((v) =>
            (v || "").toLowerCase().includes(q),
          ),
        )
      : rows;
    return [...list].sort((a, b) => {
      const av = (a[orderBy] || "").toString().toLowerCase();
      const bv = (b[orderBy] || "").toString().toLowerCase();
      return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, search, orderBy, order]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  const sortBy = (key) => {
    setOrder(orderBy === key && order === "asc" ? "desc" : "asc");
    setOrderBy(key);
  };

  const downloadButton = (row, full) =>
    row.hasFile ? (
      <Button
        component="a"
        href={PublicationFormService.getDownloadUrl(row.id)}
        download={row.fileName}
        size="small"
        variant={full ? "contained" : "outlined"}
        fullWidth={full}
        startIcon={<DownloadIcon />}
        sx={{ textTransform: "none", borderRadius: 2, whiteSpace: "nowrap" }}
      >
        Download
      </Button>
    ) : (
      <Typography variant="caption" color="text.disabled">
        No file
      </Typography>
    );

  const empty = (
    <Stack alignItems="center" spacing={1} sx={{ py: 6, color: "text.secondary" }}>
      <FolderOpenIcon sx={{ fontSize: 44, color: "text.disabled" }} />
      <Typography variant="body2">
        {search
          ? `No ${noun} match your search.`
          : `No ${noun} have been published yet.`}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ width: 28, height: 3, bgcolor: "#f9a825", borderRadius: 2, mb: 1.25 }} />
        <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.4rem", md: "1.7rem" }, color: NAVY }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>

      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <TextField
          placeholder="Search by title, remarks or file name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          size="small"
          sx={{ width: { xs: "100%", sm: 380 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        {!loading && (
          <Chip
            label={`${filtered.length} ${noun}`}
            size="small"
            sx={{ fontWeight: 600, bgcolor: alpha(NAVY, 0.08), color: NAVY, alignSelf: { xs: "flex-start", sm: "center" } }}
          />
        )}
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The {noun} list could not be loaded. Please try again later.
        </Alert>
      )}

      {loading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : isMobile ? (
        <Stack spacing={1.25}>
          {paged.length === 0
            ? empty
            : paged.map((row) => (
                <Card key={row.id} variant="outlined" sx={{ borderRadius: 2.5, p: 1.75 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <FileChip name={row.fileName} size={row.fileSize} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(row.publishedDate)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {row.title}
                  </Typography>
                  {row.remarks && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
                      {row.remarks}
                    </Typography>
                  )}
                  {downloadButton(row, true)}
                </Card>
              ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: alpha(NAVY, 0.04), fontWeight: 700, color: NAVY, py: 1.25 } }}>
                <TableCell width={56}>#</TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === "title"} direction={orderBy === "title" ? order : "asc"} onClick={() => sortBy("title")}>
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: "32%" }}>Remarks</TableCell>
                <TableCell width={140}>
                  <TableSortLabel active={orderBy === "publishedDate"} direction={orderBy === "publishedDate" ? order : "asc"} onClick={() => sortBy("publishedDate")}>
                    Published
                  </TableSortLabel>
                </TableCell>
                <TableCell width={150}>File</TableCell>
                <TableCell width={130} align="right">
                  Download
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>{empty}</TableCell>
                </TableRow>
              ) : (
                paged.map((row, i) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {(page - 1) * ROWS_PER_PAGE + i + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                        {row.remarks || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(row.publishedDate)}
                    </TableCell>
                    <TableCell>
                      <FileChip name={row.fileName} size={row.fileSize} />
                    </TableCell>
                    <TableCell align="right">{downloadButton(row, false)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && filtered.length > ROWS_PER_PAGE && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

DocumentDownloadIndex.propTypes = {
  category: PropTypes.oneOf(["PUBLICATION", "FORM"]).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  noun: PropTypes.string.isRequired,
};

export default DocumentDownloadIndex;
