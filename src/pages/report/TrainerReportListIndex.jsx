// Trainer report: the logged-in institute's trainers (same data as the Add Trainer page),
// with search / filters and an Excel download.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { exportToExcel } from "@/utils/exportExcel";
import CommonService from "../../api/services/internal/common/CommonService";
import ApplyAccreditedCourseService from "../../api/services/internal/course/ApplyAccreditedCourseService";
import ApplyNonAccreditedCourseService from "../../api/services/internal/course/ApplyNonAccreditedCourseService";
import AddTrainerService from "../../api/services/internal/trainer/AddTrainerService";
import InstituteRegistrationService from "../../api/services/internal/registration/InstituteRegistrationService";

const isFailed = (res) => !res || res instanceof Error || res?.isAxiosError;
const listOf = (res) => (!isFailed(res) && Array.isArray(res?.data) ? res.data : []);

const nameById = (list, id) =>
  id === null || id === undefined || id === ""
    ? ""
    : list.find((x) => String(x.id) === String(id))?.name || "";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().split("T")[0];
};

const parseCourses = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const safeFilePart = (text) =>
  String(text || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_");

const headCell = {
  border: "1px solid #ccc",
  fontWeight: "bold",
  fontSize: "0.78rem",
  padding: "6px 8px",
  whiteSpace: "nowrap",
  bgcolor: "#f5f5f5",
};
const cell = { border: "1px solid #ccc", fontSize: "0.78rem", padding: "4px 8px" };

const TrainerReportListIndex = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const registration_no = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(false);
  const [institute, setInstitute] = useState(null);
  const [rawTrainers, setRawTrainers] = useState([]);
  const [genders, setGenders] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [accreditedCourses, setAccreditedCourses] = useState([]);
  const [nonAccreditedCourses, setNonAccreditedCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = useCallback(async () => {
    if (!registration_no) return;
    setLoading(true);
    try {
      const detailsRes =
        await InstituteRegistrationService.getInstituteDetails(registration_no);
      const inst = listOf(detailsRes)[0] || null;
      setInstitute(inst);
      if (!inst?.institute_id) {
        toast.error("Institute details not found");
        return;
      }

      const [
        trainerRes,
        genderRes,
        qualificationRes,
        employmentRes,
        courseTypeRes,
        accreditedRes,
        nonAccreditedRes,
      ] = await Promise.all([
        AddTrainerService.getAllTrainer(inst.institute_id, access_token),
        CommonService.getByParentId(8),
        CommonService.getByParentId(18),
        CommonService.getByParentId(11),
        CommonService.getByParentId(13),
        ApplyAccreditedCourseService.getAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        ),
        ApplyNonAccreditedCourseService.getNonAccreditedApprovedCourseByUserId(
          registration_no,
          access_token,
        ),
      ]);
      if (isFailed(trainerRes)) toast.error("Failed to fetch trainers");
      setRawTrainers(listOf(trainerRes));
      setGenders(listOf(genderRes));
      setQualifications(listOf(qualificationRes));
      setEmploymentTypes(listOf(employmentRes));
      setCourseTypes(listOf(courseTypeRes));
      setAccreditedCourses(listOf(accreditedRes));
      setNonAccreditedCourses(listOf(nonAccreditedRes));
    } catch (e) {
      console.error("Trainer report load failed:", e);
      toast.error("Failed to load the trainer report");
    } finally {
      setLoading(false);
    }
  }, [registration_no, access_token]);

  useEffect(() => {
    load();
  }, [load]);

  // course name from its type: "Non-BQF ..." -> non-accredited, "BQF ..." -> accredited
  const courseName = useCallback(
    (courseTypeId, courseId) => {
      const typeName = nameById(courseTypes, courseTypeId).toLowerCase();
      const list =
        typeName.includes("non-bqf") || typeName.includes("non bqf")
          ? nonAccreditedCourses
          : typeName.includes("bqf")
            ? accreditedCourses
            : [];
      const c = list.find((x) => String(x.id) === String(courseId));
      return (
        c?.course_name || c?.name || c?.programme_title || (courseId ? `Course ${courseId}` : "")
      );
    },
    [courseTypes, accreditedCourses, nonAccreditedCourses],
  );

  const trainers = useMemo(
    () =>
      rawTrainers.map((t) => ({
        id: t.id,
        name: t.name || "",
        idNo: t.citizen_id || t.work_permit_no || "",
        idType: t.citizen_id ? "CID" : t.work_permit_no ? "Work Permit" : "",
        genderId: t.gender_id,
        gender: nameById(genders, t.gender_id),
        qualification: nameById(qualifications, t.qualification_id),
        employmentTypeId: t.employment_type_id,
        employmentType: nameById(employmentTypes, t.employment_type_id),
        workExperience: t.work_experience ?? "",
        specialization: t.specialization || "",
        joiningDate: formatDate(t.joining_date),
        email: t.email || "",
        mobileNo: t.mobile_no || "",
        courses: parseCourses(t.courses)
          .map((c) => {
            const type = nameById(courseTypes, c.courseTypeId);
            const course = courseName(c.courseTypeId, c.courseId);
            return [course, type ? `(${type})` : ""].filter(Boolean).join(" ");
          })
          .filter(Boolean)
          .join("; "),
      })),
    [rawTrainers, genders, qualifications, employmentTypes, courseTypes, courseName],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trainers.filter((t) => {
      const matchesSearch =
        !q ||
        [t.name, t.idNo, t.email, t.mobileNo, t.specialization, t.courses].some((v) =>
          String(v).toLowerCase().includes(q),
        );
      const matchesEmployment =
        !employmentFilter || String(t.employmentTypeId) === String(employmentFilter);
      const matchesGender = !genderFilter || String(t.genderId) === String(genderFilter);
      return matchesSearch && matchesEmployment && matchesGender;
    });
  }, [trainers, search, employmentFilter, genderFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, employmentFilter, genderFilter]);

  const handleReset = () => {
    setSearch("");
    setEmploymentFilter("");
    setGenderFilter("");
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const data = filtered.map((t, i) => ({
      SlNo: i + 1,
      Name: t.name || "N/A",
      "CID / Work Permit No": t.idNo || "N/A",
      "ID Type": t.idType || "N/A",
      Gender: t.gender || "N/A",
      Qualification: t.qualification || "N/A",
      "Employment Type": t.employmentType || "N/A",
      "Work Experience (Years)": t.workExperience === "" ? "N/A" : t.workExperience,
      Specialization: t.specialization || "N/A",
      "Joining Date": t.joiningDate || "N/A",
      Email: t.email || "N/A",
      "Mobile No": t.mobileNo || "N/A",
      Courses: t.courses || "N/A",
      Institute: institute?.proposed_institute_name || "N/A",
    }));
    const today = new Date().toISOString().split("T")[0];
    const fileName = ["Trainer_Report", safeFilePart(institute?.proposed_institute_name), today]
      .filter(Boolean)
      .join("_");
    exportToExcel(data, fileName);
    toast.success(`Exported ${data.length} trainer record(s) to Excel`);
  };

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        mb={1.5}
      >
        <Box>
          <Typography variant="h6">Trainer Report</Typography>
          {institute?.proposed_institute_name && (
            <Typography variant="body2" color="text.secondary">
              {institute.proposed_institute_name}
              {institute.registration_no ? ` · ${institute.registration_no}` : ""}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={loading || filtered.length === 0}
          sx={{ textTransform: "none" }}
        >
          Export to Excel
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} mb={1.5}>
        <TextField
          size="small"
          placeholder="Search name, CID / work permit, email, mobile, course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, "& input": { fontSize: "0.85rem" } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Employment Type"
          value={employmentFilter}
          onChange={(e) => setEmploymentFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          {employmentTypes.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Gender"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {genders.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={handleReset}
          sx={{ textTransform: "none" }}
        >
          Reset
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {filtered.length} of {trainers.length} trainer(s)
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ borderCollapse: "collapse", minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              {[
                "#",
                "Name",
                "CID / Work Permit No",
                "Gender",
                "Qualification",
                "Employment Type",
                "Experience (Yrs)",
                "Specialization",
                "Joining Date",
                "Email",
                "Mobile No",
                "Courses",
              ].map((h) => (
                <TableCell key={h} sx={headCell}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 2 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : pageRows.length > 0 ? (
              pageRows.map((t, i) => (
                <TableRow key={t.id || i} hover>
                  <TableCell sx={cell}>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell sx={{ ...cell, fontWeight: 600 }}>{t.name || "—"}</TableCell>
                  <TableCell sx={cell}>{t.idNo || "—"}</TableCell>
                  <TableCell sx={cell}>{t.gender || "—"}</TableCell>
                  <TableCell sx={cell}>{t.qualification || "—"}</TableCell>
                  <TableCell sx={cell}>{t.employmentType || "—"}</TableCell>
                  <TableCell sx={{ ...cell, textAlign: "center" }}>
                    {t.workExperience === "" ? "—" : t.workExperience}
                  </TableCell>
                  <TableCell sx={cell}>{t.specialization || "—"}</TableCell>
                  <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>
                    {t.joiningDate || "—"}
                  </TableCell>
                  <TableCell sx={cell}>{t.email || "—"}</TableCell>
                  <TableCell sx={cell}>{t.mobileNo || "—"}</TableCell>
                  <TableCell sx={{ ...cell, minWidth: 200 }}>{t.courses || "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {trainers.length ? "No trainers match the filters." : "No trainers found."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            "& .MuiToolbar-root": { minHeight: 40 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: "0.78rem",
            },
          }}
        />
      </TableContainer>
    </Paper>
  );
};

export default TrainerReportListIndex;
