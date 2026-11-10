// Public report: trainers added by institutes (AddTrainer)
import { useState, useMemo, useEffect } from "react";
import {
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Box,
  Grid,
  CircularProgress,
} from "@mui/material";
import PublicPageService from "../../../api/services/internal/public/PublicPageService";
import {
  PAPER_PROPS,
  TABLE_SX,
  INPUT_SX,
  ROWS_PER_PAGE_OPTIONS,
  parseJsonArray,
} from "./reportStyles";

/** API row -> table row. Courses read "Title (Level)". */
const toTrainer = (item) => ({
  id: item.id,
  name: item.name || "—",
  gender: item.gender || "—",
  qualification: item.qualification || "—",
  specialization: item.specialization || "—",
  institute: item.institute_name || "—",
  courses: parseJsonArray(item.courses)
    .filter((c) => c && c.title)
    .map((c) => (c.level ? `${c.title} (${c.level})` : c.title)),
});

const Trainer = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PublicPageService.getPublicTrainers();
        if (res instanceof Error || res?.isAxiosError) throw res;
        setTrainers(Array.isArray(res?.data) ? res.data.map(toTrainer) : []);
      } catch (error) {
        console.error("Error loading trainers:", error);
        setTrainers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return trainers;
    const has = (v) => String(v).toLowerCase().includes(s);
    return trainers.filter(
      (r) =>
        has(r.name) ||
        has(r.gender) ||
        has(r.qualification) ||
        has(r.specialization) ||
        has(r.institute) ||
        r.courses.some(has),
    );
  }, [trainers, search]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const COLS = 7;

  return (
    <Paper {...PAPER_PROPS}>
      <Typography variant="h5" gutterBottom>
        Trainers
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Trainers of registered institutes and the courses they train.
        </Typography>
      </Box>

      <Grid container spacing={1} alignItems="center" sx={{ justifyContent: "flex-end", mb: 2 }}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Trainers"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by Name, Course or Institute"
            sx={INPUT_SX}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_SX}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Institute</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={COLS} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginated.length > 0 ? (
              paginated.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.gender}</TableCell>
                  <TableCell>{row.qualification}</TableCell>
                  <TableCell>{row.specialization}</TableCell>
                  <TableCell>
                    {row.courses.length > 0
                      ? row.courses.map((c, i) => (
                          <Typography key={i} variant="body2">
                            {c}
                          </Typography>
                        ))
                      : "—"}
                  </TableCell>
                  <TableCell>{row.institute}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={COLS} align="center">
                  {search ? "No records match your search" : "No data available in table"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Paper>
  );
};

export default Trainer;
