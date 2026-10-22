import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Typography,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
  InputAdornment,
  Chip,
  Avatar,
  useMediaQuery,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import GenerateTracerService from "../../../api/services/internal/tracer/GenerateTracerService";

const GenerateTracerIndex = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const access_token = useSelector((state) => state.auth.accessToken);

  /* ---------------- DATA ---------------- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response =
        await GenerateTracerService.getTracerAllApplications(access_token);

      const payload = response?.data ?? response;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.content)
            ? payload.content
            : [];

      setRows(list);
    } catch (err) {
      console.error("Failed to load tracer applications:", err);
      setErrorMsg("Failed to load tracer applications. Please try again.");
      toast.error("Failed to load tracer applications");
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------------- FILTER / PAGINATION ---------------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.application_no,
        row.tracer_title,
        row.parent_tracer_type,
        row.sub_tracer_type,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, searchQuery]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  /* ---------------- ROW ACCESSORS (snake_case) ---------------- */
  const getApplicationNo = (row) => row.application_no ?? "-";
  const getTitle = (row) => row.tracer_title ?? "Untitled";
  const getParentType = (row) => row.parent_tracer_type ?? "-";
  const getSubType = (row) => row.sub_tracer_type ?? "-";
  const getCreatedAt = (row) =>
    row.created_at ? new Date(row.created_at).toLocaleString() : "-";

  /* ---------------- NAVIGATION ---------------- */
  const goToGenerateTracerQuestions = () => {
    navigate("/tracer/generate-tracer-questions");
  };

  const goToEditQuestions = (row) => {
    const appNo = getApplicationNo(row);
    if (appNo && appNo !== "-") {
      navigate(`/tracer/generate-tracer-questions?applicationNo=${appNo}`);
    } else {
      toast.error("Missing application number");
    }
  };

  /* ---------------- DELETE ---------------- */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (applicationNo) => {
    setDeleteId(applicationNo);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      // TODO: wire to real delete endpoint
      // await GenerateTracerService.deleteTracerApplication(deleteId, access_token);
      setRows((prev) => prev.filter((r) => getApplicationNo(r) !== deleteId));
      toast.success(`Deleted application ${deleteId}`);
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      const maxPage = Math.max(
        0,
        Math.ceil((filteredRows.length - 1) / rowsPerPage) - 1,
      );
      if (page > maxPage) setPage(maxPage);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- PAGINATION / SEARCH ---------------- */
  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };
  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
  };

  /* ---------------- STATUS CHIP ---------------- */
  const renderStatusChip = (row) => {
    const status = row.status ?? "Active";
    return (
      <Chip
        label={status}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: "0.7rem",
          height: 24,
          bgcolor:
            status === "Active"
              ? alpha(theme.palette.success.main, 0.12)
              : alpha(theme.palette.grey[500], 0.15),
          color:
            status === "Active"
              ? theme.palette.success.dark
              : theme.palette.text.secondary,
          borderRadius: 1.5,
        }}
      />
    );
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.25 },
          mb: 2,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08,
          )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 30,
                height: 30,
                boxShadow: 0,
              }}
            >
              <ListAltIcon sx={{ fontSize: 17 }} />
            </Avatar>
            <Box>
              <Typography
                component="h1"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  lineHeight: 1.15,
                }}
              >
                List of Generate Tracer Questions
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: "0.7rem",
                  lineHeight: 1.1,
                  display: "block",
                  mt: 0.1,
                }}
              >
                Manage and organize your tracer questions
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                loading ? (
                  <CircularProgress size={14} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 16 }} />
                )
              }
              onClick={fetchAll}
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                minHeight: 32,
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={goToGenerateTracerQuestions}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                px: 1.75,
                py: 0.5,
                minHeight: 32,
                boxShadow: 0,
                "&:hover": { boxShadow: 1 },
              }}
            >
              Add New
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Error banner */}
      {errorMsg && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchAll}>
              Retry
            </Button>
          }
        >
          {errorMsg}
        </Alert>
      )}

      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by application no, title, tracer type..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: { sm: 460 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "background.paper",
            },
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            ml: { sm: "auto" },
          }}
        >
          <QuestionAnswerIcon
            fontSize="small"
            sx={{ color: "text.secondary" }}
          />
          <Typography variant="body2" color="text.secondary" noWrap>
            <strong>{filteredRows.length}</strong> result
            {filteredRows.length !== 1 ? "s" : ""}
            {searchQuery && " found"}
          </Typography>
        </Box>
      </Paper>

      {/* Loading */}
      {loading && rows.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading tracer applications...
          </Typography>
        </Paper>
      ) : isMobile ? (
        /* MOBILE VIEW */
        <>
          <Stack spacing={2}>
            {paginatedRows.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                <QuestionAnswerIcon
                  sx={{ fontSize: 48, color: "grey.400", mb: 1 }}
                />
                <Typography color="text.secondary">
                  {searchQuery
                    ? "No matching records found"
                    : "No records found"}
                </Typography>
              </Paper>
            ) : (
              paginatedRows.map((row) => (
                <Card
                  key={getApplicationNo(row)}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    transition: "all 0.2s",
                    "&:hover": { boxShadow: 3, borderColor: "primary.main" },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {getTitle(row)}
                      </Typography>
                      {renderStatusChip(row)}
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {getParentType(row)}
                      {getSubType(row) !== "-" && ` — ${getSubType(row)}`}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 1 }}
                    >
                      <Chip
                        label={`App: ${getApplicationNo(row)}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 22 }}
                      />
                      <Chip
                        label={getCreatedAt(row)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 22 }}
                      />
                    </Stack>
                  </CardContent>
                  <Divider />
                  <CardActions
                    sx={{ justifyContent: "flex-end", px: 2, py: 1 }}
                  >
                    <Tooltip title="Edit Questions">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => goToEditQuestions(row)}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          mr: 1,
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(getApplicationNo(row))}
                        sx={{ bgcolor: alpha(theme.palette.error.main, 0.08) }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              ))
            )}
          </Stack>

          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ mt: 1 }}
          />
        </>
      ) : (
        /* DESKTOP VIEW */
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table
              sx={{
                minWidth: 800,
                borderCollapse: "collapse",
                "& .MuiTableCell-root": {
                  border: "1px solid",
                  borderColor: "divider",
                },
              }}
              aria-label="tracer applications table"
            >
              <TableHead>
                <TableRow>
                  {[
                    "Application No",
                    "Tracer Title",
                    "Parent Type",
                    "Sub Type",
                    "Created At",
                    "Status",
                    "Actions",
                  ].map((header, idx) => (
                    <TableCell
                      key={header}
                      align={idx === 6 ? "center" : "left"}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "text.secondary",
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        py: 1.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <QuestionAnswerIcon
                        sx={{
                          fontSize: 48,
                          color: "grey.400",
                          mb: 1,
                          display: "block",
                          mx: "auto",
                        }}
                      />
                      <Typography color="text.secondary">
                        {searchQuery
                          ? "No matching records found"
                          : "No records found"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row, index) => (
                    <TableRow
                      key={getApplicationNo(row)}
                      hover
                      sx={{
                        bgcolor:
                          index % 2 === 0
                            ? "background.paper"
                            : alpha(theme.palette.grey[50], 0.6),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                        transition: "background-color 0.15s",
                      }}
                    >
                      <TableCell
                        sx={{ fontWeight: 600, color: "text.secondary" }}
                      >
                        {getApplicationNo(row)}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          maxWidth: 320,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {getTitle(row)}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {getParentType(row)}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {getSubType(row)}
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                      >
                        {getCreatedAt(row)}
                      </TableCell>
                      <TableCell>{renderStatusChip(row)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Questions">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => goToEditQuestions(row)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              mr: 1,
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() =>
                              handleDeleteClick(getApplicationNo(row))
                            }
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid", borderColor: "divider" }}
          />
        </Paper>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete the tracer application{" "}
            <strong>{deleteId}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            disabled={deleting}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
            sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateTracerIndex;
