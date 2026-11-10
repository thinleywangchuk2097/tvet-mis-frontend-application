// Public report: accredited courses and the institutes offering them
import { Fragment, useState, useMemo, useEffect } from "react";
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
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import PublicPageService from "../../../api/services/internal/public/PublicPageService";
import {
  PAPER_PROPS,
  TABLE_SX,
  INPUT_SX,
  ROWS_PER_PAGE_OPTIONS,
} from "./reportStyles";

/** Group flat API rows (one per institute offering) into one row per programme. */
const groupByProgramme = (rows) => {
  const map = new Map();
  rows.forEach((r) => {
    const key = String(r.programme_id);
    if (!map.has(key)) {
      map.set(key, {
        id: r.programme_id,
        course: r.programme_title || "—",
        certLevel: r.certification_level || "—",
        institutes: [],
      });
    }
    const group = map.get(key);
    if (!group.institutes.some((i) => String(i.id) === String(r.institute_id))) {
      group.institutes.push({
        id: r.institute_id,
        name: r.institute_name || "—",
        location: r.dzongkhag_name || "—",
        contact: r.contact_no || "—",
        email: r.email_id || "—",
      });
    }
  });
  return [...map.values()];
};

const CoursesAccredited = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await PublicPageService.getAccreditedCourses();
        if (res instanceof Error || res?.isAxiosError) throw res;
        setCourses(groupByProgramme(Array.isArray(res?.data) ? res.data : []));
      } catch (error) {
        console.error("Error loading accredited courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return courses;
    const has = (v) => String(v).toLowerCase().includes(s);
    return courses.filter(
      (r) =>
        has(r.course) ||
        has(r.certLevel) ||
        r.institutes.some((i) => has(i.name) || has(i.location) || has(i.email) || has(i.contact)),
    );
  }, [courses, search]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const COLS = 5;

  return (
    <Paper {...PAPER_PROPS}>
      <Typography variant="h5" gutterBottom>
        Courses Accredited
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Accredited courses and the registered institutes offering them. Click
          &quot;View Institutes&quot; to see where a course is offered.
        </Typography>
      </Box>

      <Grid container spacing={1} alignItems="center" sx={{ justifyContent: "flex-end", mb: 2 }}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Courses"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by Course, Level or Institute"
            sx={INPUT_SX}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small" sx={TABLE_SX}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Certificate Level</TableCell>
              <TableCell>No. of Institutes</TableCell>
              <TableCell>Actions</TableCell>
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
              paginated.map((row, index) => {
                const isExpanded = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <TableRow>
                      <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {row.course}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.certLevel} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{row.institutes.length}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant={isExpanded ? "outlined" : "contained"}
                          color="primary"
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          sx={{ textTransform: "none", fontSize: "0.75rem" }}
                        >
                          {isExpanded ? "Hide Institutes" : "View Institutes"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={COLS} sx={{ py: 1, px: 2, backgroundColor: "#fafafa" }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 1 }}>
                            Institutes offering {row.course}
                            <Chip label={`${row.institutes.length} Total`} size="small" sx={{ ml: 1 }} />
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, mb: 1 }}>
                            <Table size="small" sx={TABLE_SX}>
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                  <TableCell>#</TableCell>
                                  <TableCell>Institute</TableCell>
                                  <TableCell>Location</TableCell>
                                  <TableCell>Contact No.</TableCell>
                                  <TableCell>Email</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {row.institutes.map((inst, i) => (
                                  <TableRow key={inst.id ?? i}>
                                    <TableCell>{i + 1}</TableCell>
                                    <TableCell>{inst.name}</TableCell>
                                    <TableCell>{inst.location}</TableCell>
                                    <TableCell>{inst.contact}</TableCell>
                                    <TableCell>{inst.email}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
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

export default CoursesAccredited;
