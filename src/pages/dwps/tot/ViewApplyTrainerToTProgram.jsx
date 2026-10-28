import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
  Button,
  Checkbox,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Fade,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import SendIcon from "@mui/icons-material/Send";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TotService from "../../../api/services/internal/tot/TotService";
import { downloadTotMarkSheets } from "../../../utils/pdf/totMarkSheetPdf";
import DownloadIcon from "@mui/icons-material/Download";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

// ---------- Normalizers (module-level, pure) ----------
const parseModules = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
};

const normalizeAnnouncement = (raw = {}, applicationNo) => ({
  id: raw.id ?? null,
  applicationNo: raw.application_no ?? applicationNo,
  programName: raw.program_name ?? raw.institute_name ?? "—",
  programCode: raw.program_code ?? "—",
  programTypeId: raw.program_type_id ?? null,
  applicationStartDate: raw.application_start_date ?? null,
  applicationEndDate: raw.application_end_date ?? null,
  programStartDate: raw.program_start_date ?? null,
  programEndDate: raw.program_end_date ?? null,
  maxParticipants: raw.max_participants ?? "—",
  venue: raw.venue ?? "—",
  eligibilityCriteria: raw.eligibility_criteria ?? "",
  remarks: raw.remarks ?? "",
  instituteName: raw.institute_name ?? "",
  statusId: raw.status_id ?? null,
});

const normalizeTrainers = (rows = []) => {
  const seen = new Set();
  return rows
    .filter((t) => {
      const key = t.trainer_id;
      if (key == null || key === "") return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((t, idx) => {
      const modules = parseModules(t.modules)
        .slice()
        .sort(
          (a, b) =>
            (Number(a.moduleOrder) || 0) - (Number(b.moduleOrder) || 0) ||
            (Number(a.id) || 0) - (Number(b.id) || 0),
        )
        .map((m) => ({
        id: m.id,
        moduleOrder: m.moduleOrder ?? null,
        moduleCode: m.moduleCode ?? "",
        moduleName: m.moduleName ?? "",
        duration: m.duration ?? "",
        weightage: m.weightage ?? "",
        description: m.description ?? "",
        contents: (m.contents ?? []).map((c) => ({
          id: c.id,
          courseContent: c.courseContent ?? "",
          fullMark: Number(c.fullMark) || 0,
        })),
      }));

      return {
        id: Number(t.trainer_id),
        appliedId: t.applied_id ?? null,
        overallPercentage: t.overall_percentage ?? null,
        grade: t.grade ?? null,
        result: t.result ?? null,
        certificateNo: t.certificate_no ?? null,
        isSelected: t.is_selected === "1" || t.is_selected === 1 || t.is_selected === true || t.is_selected === "true",
        name: t.name ?? t.trainer_name ?? `Applicant #${t.id ?? idx + 1}`,
        cid: t.cid_no ?? t.cid ?? t.CID ?? "—",
        email: t.email ?? "—",
        mobileNo: t.mobile_no ?? "—",
        phone: t.mobile_no ?? t.phone ?? t.mobile ?? "—",
        gender: t.gender ?? "—",
        qualification: t.qualification ?? "—",
        experience: t.experience ?? t.year_of_experience ?? "—",
        specialization: t.specialization ?? "—",
        modules,
      };
    });
};

// ---------- Helpers (module-level, pure) ----------
const getTrainerContents = (trainer) =>
  (trainer?.modules ?? []).flatMap((m) =>
    (m.contents ?? []).map((c) => ({
      ...c,
      moduleId: m.id,
      moduleName: m.moduleName,
      moduleCode: m.moduleCode,
    })),
  );

const getModuleContents = (module) => module?.contents ?? [];

const getMaxTotal = (trainer) =>
  getTrainerContents(trainer).reduce((sum, c) => sum + (c.fullMark || 0), 0);

const getTrainerTotal = (trainer, traineeMarks) => {
  const marks = traineeMarks?.[trainer?.id] || {};
  return getTrainerContents(trainer).reduce(
    (sum, c) => sum + (Number(marks[c.id]) || 0),
    0,
  );
};

const getModuleTotal = (module, traineeMarks, trainerId) => {
  const marks = traineeMarks?.[trainerId] || {};
  return getModuleContents(module).reduce(
    (sum, c) => sum + (Number(marks[c.id]) || 0),
    0,
  );
};

const getModuleMax = (module) =>
  getModuleContents(module).reduce((sum, c) => sum + (c.fullMark || 0), 0);

// "30", "30%", 30 -> 30 ; anything non-numeric -> null
const parseWeightage = (val) => {
  if (val === null || val === undefined) return null;
  const n = parseFloat(String(val).replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
};

const round2 = (n) => Math.round(n * 100) / 100;

// Weighted score of a module = (module total / module max) * weightage
const getModuleWeighted = (module, traineeMarks, trainerId) => {
  const weight = parseWeightage(module?.weightage);
  const max = getModuleMax(module);
  if (weight === null || max <= 0) return null;
  return round2(
    (getModuleTotal(module, traineeMarks, trainerId) / max) * weight,
  );
};

// Sum of module weighted scores, out of the sum of module weightages
const getTrainerWeighted = (trainer, traineeMarks) => {
  let score = 0;
  let maxWeight = 0;
  (trainer?.modules ?? []).forEach((m) => {
    const weight = parseWeightage(m.weightage);
    if (weight === null || getModuleMax(m) <= 0) return;
    maxWeight += weight;
    score += getModuleWeighted(m, traineeMarks, trainer.id) ?? 0;
  });
  return {
    score: round2(score),
    maxWeight: round2(maxWeight),
    percent: maxWeight > 0 ? Math.round((score / maxWeight) * 100) : null,
  };
};

const moduleSignature = (module, traineeMarks, trainerId) => {
  const marks = traineeMarks?.[trainerId] || {};
  return getModuleContents(module)
    .map((c) => `${c.id}:${marks[c.id] ?? ""}`)
    .join("|");
};

const getInitials = (name) => {
  if (!name) return "T";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const tableStyle = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    padding: "8px 12px",
  },
  "& th": { fontWeight: 600, backgroundColor: "#f5f5f5" },
};

const ViewApplyTrainerToTProgram = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const userId = useSelector((state) => state.auth.userId);

  // ---------- Loading / error ----------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- Data state ----------
  const [announcement, setAnnouncement] = useState(null);
  const [trainers, setTrainers] = useState([]);

  // ---------- UI state ----------
  const [search, setSearch] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [traineeMarks, setTraineeMarks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // ---------- Per-module save state ----------
  const [savedModules, setSavedModules] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const steps = ["Select Trainers", "Enter Marks", "Generate Certificate"];

  // ---------- Fetch on mount ----------
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await TotService.getTrainerApplied(
          applicationNo,
          access_token,
        );

        if (response instanceof Error || response?.isAxiosError) {
          throw response;
        }

        const raw = response?.data ?? response;
        const rows = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
            ? raw
            : [];

        if (cancelled) return;

        if (rows.length === 0) {
          setAnnouncement(null);
          setTrainers([]);
          setError("No application data found");
          return;
        }

        const normalized = normalizeTrainers(rows);
        setAnnouncement(normalizeAnnouncement(rows[0], applicationNo));
        setTrainers(normalized);
        setSelectedTrainers(
          normalized.filter((t) => t.isSelected).map((t) => t.id),
        );

        // ---- Load previously saved marks ----
        const marksRes = await TotService.getTrainerMarks(
          applicationNo,
          access_token,
        );
        if (cancelled) return;
        if (marksRes instanceof Error || marksRes?.isAxiosError) {
          console.error("Failed to load saved marks:", marksRes);
          toast.warning("Could not load previously saved marks");
        } else {
          const savedContents = marksRes?.data?.contents ?? [];
          const savedModuleRows = marksRes?.data?.modules ?? [];

          const marksMap = {};
          savedContents.forEach((r) => {
            const tId = Number(r.trainerId);
            if (!marksMap[tId]) marksMap[tId] = {};
            marksMap[tId][r.contentId] = Number(r.marks);
          });

          const savedMap = {};
          savedModuleRows.forEach((r) => {
            const trainer = normalized.find(
              (t) => t.id === Number(r.trainerId),
            );
            const module = trainer?.modules.find(
              (m) => String(m.id) === String(r.moduleId),
            );
            if (!trainer || !module) return;
            savedMap[`${trainer.id}-${module.id}`] = moduleSignature(
              module,
              marksMap,
              trainer.id,
            );
          });

          setTraineeMarks(marksMap);
          setSavedModules(savedMap);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load TOT application:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load application details";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (applicationNo && access_token) {
      fetchData();
    } else {
      setLoading(false);
      if (!applicationNo) setError("Missing application number in URL");
    }

    return () => {
      cancelled = true;
    };
  }, [applicationNo, access_token]);

  // ---------- Memoized filtered list ----------
  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.cid?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.mobileNo?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q),
    );
  }, [trainers, search]);

  // ---------- Handlers ----------
  const handleSelectTrainer = (trainerId) => {
    setSelectedTrainers((prev) =>
      prev.includes(trainerId)
        ? prev.filter((id) => id !== trainerId)
        : [...prev, trainerId],
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTrainers(filteredTrainers.map((t) => t.id));
    } else {
      setSelectedTrainers([]);
    }
  };

  const handleMarkChange = (trainerId, contentId, value, fullMark) => {
    if (value === "") {
      setTraineeMarks((prev) => {
        const next = { ...prev, [trainerId]: { ...prev[trainerId] } };
        delete next[trainerId]?.[contentId];
        return next;
      });
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num)) return;
    if (num < 0) return;
    if (num > fullMark) {
      toast.warning(`Cannot exceed ${fullMark} for this content`);
      return;
    }

    setTraineeMarks((prev) => ({
      ...prev,
      [trainerId]: { ...prev[trainerId], [contentId]: num },
    }));
  };

  const getTotalMarks = useCallback(
    (trainerId) => {
      const t = trainers.find((x) => x.id === trainerId);
      return t ? getTrainerTotal(t, traineeMarks) : 0;
    },
    [trainers, traineeMarks],
  );

  // ---------- Per-module save ----------
  const handleSaveModule = async (trainer, module) => {
    const key = `${trainer.id}-${module.id}`;
    const contents = getModuleContents(module);

    if (contents.length === 0) {
      toast.info("This module has no contents to save");
      return;
    }

    if (isModuleLocked(trainer, module)) {
      toast.warning("Save the previous module marks first");
      return;
    }

    const marks = traineeMarks[trainer.id] || {};
    const missing = contents.filter((c) => marks[c.id] === undefined);
    if (missing.length > 0) {
      toast.warning(
        `Fill all marks for module ${module.moduleCode || module.id} before saving`,
      );
      return;
    }

    setSavingKey(key);
    try {
      const payload = {
        applicationNo,
        trainerId: trainer.id,
        moduleId: module.id,
        createdBy: actionId ? parseInt(actionId) : null,
        contents: contents.map((c) => ({
          contentId: c.id,
          marks: marks[c.id],
        })),
      };

      const response = await TotService.saveModuleMarks(payload, access_token);
      if (response instanceof Error || response?.isAxiosError) {
        throw response;
      }

      setSavedModules((prev) => ({
        ...prev,
        [key]: moduleSignature(module, traineeMarks, trainer.id),
      }));

      const ws = response?.data?.weightedScore;
      toast.success(
        `Marks saved for module ${module.moduleCode || module.id}` +
          (ws !== null && ws !== undefined
            ? ` (weighted score ${ws} / ${response?.data?.weightage})`
            : ""),
      );
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save marks";
      toast.error(message);
    } finally {
      setSavingKey(null);
    }
  };

  const isModuleSaved = (trainer, module) => {
    const key = `${trainer.id}-${module.id}`;
    const signature = moduleSignature(module, traineeMarks, trainer.id);
    return savedModules[key] === signature;
  };

  const handleSaveSelection = async () => {
    if (selectedTrainers.length === 0) {
      toast.warning("Please select at least one trainer");
      return false;
    }
    setSavingSelection(true);
    try {
      const response = await TotService.saveTrainerSelection(
        {
          applicationNo,
          selectedTrainerIds: selectedTrainers.map(Number),
          updatedBy: actionId ? parseInt(actionId) : null,
        },
        access_token,
      );
      if (response instanceof Error || response?.isAxiosError) {
        throw response;
      }
      setTrainers((prev) =>
        prev.map((t) => ({ ...t, isSelected: selectedTrainers.includes(t.id) })),
      );
      toast.success(
        response?.data?.message || "Trainer selection saved successfully",
      );
      return true;
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save trainer selection",
      );
      return false;
    } finally {
      setSavingSelection(false);
    }
  };

  // A module is unlocked only when every earlier module (with contents)
  // for the same trainer has been saved.
  const isModuleLocked = (trainer, module) => {
    const idx = trainer.modules.findIndex((m) => m.id === module.id);
    if (idx <= 0) return false;
    return trainer.modules
      .slice(0, idx)
      .some((m) => getModuleContents(m).length > 0 && !isModuleSaved(trainer, m));
  };

  // Overall application completion:
  //   1 unit  - trainer selection saved
  //   1 unit  - per (selected trainer x module) with marks saved
  //   1 unit  - per selected trainer with mark sheet generated
  const getApplicationProgress = () => {
    const selected = trainers.filter((t) => t.isSelected);
    const selectionDone = selected.length > 0 ? 1 : 0;

    let modulesTotal = 0;
    let modulesDone = 0;
    selected.forEach((t) => {
      t.modules
        .filter((m) => getModuleContents(m).length > 0)
        .forEach((m) => {
          modulesTotal += 1;
          if (isModuleSaved(t, m)) modulesDone += 1;
        });
    });

    const certTotal = selected.length;
    const certDone = selected.filter((t) => !!t.certificateNo).length;

    // Before selection we don't know the size of the later stages,
    // so count them as at least one unit each.
    const total =
      1 + Math.max(modulesTotal, 1) + Math.max(certTotal, 1);
    const done = selectionDone + modulesDone + certDone;
    const percent = completed ? 100 : Math.round((done / total) * 100);

    let stage = "Select trainers";
    if (selectionDone && modulesDone < modulesTotal) stage = "Enter marks";
    else if (selectionDone && certDone < certTotal) stage = "Generate mark sheets";
    else if (completed) stage = "Application completed";
    else if (selectionDone && certDone === certTotal)
      stage = "Ready to complete — click Done";

    return {
      percent,
      stage,
      selectedCount: selected.length,
      modulesDone,
      modulesTotal,
      certDone,
      certTotal,
    };
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectionSaved) {
        const ok = await handleSaveSelection();
        if (!ok) return;
      }
      setActiveStep(1);
      return;
    }
    if (activeStep === 1) {
      const unsaved = selectedTrainers.some((id) => {
        const t = trainers.find((x) => x.id === id);
        if (!t) return true;
        return t.modules.some((m) => {
          if (getModuleContents(m).length === 0) return false;
          return !isModuleSaved(t, m);
        });
      });
      if (unsaved) {
        toast.warning(
          "Please fill and save all module marks before proceeding",
        );
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Calls the backend to compute/store result + certificate no, then builds the PDF
  const generateAndDownload = async (trainerIds, fileName) => {
    const response = await TotService.generateCertificates(
      {
        applicationNo,
        trainerIds,
        generatedBy: actionId ? parseInt(actionId) : null,
      },
      access_token,
    );
    if (response instanceof Error || response?.isAxiosError) {
      throw response;
    }
    const results = response?.data?.trainers ?? [];

    // Program-level modules (all trainers share the program's modules)
    const programModules =
      trainers.find((t) => trainerIds.includes(t.id))?.modules ?? [];

    const pdfTrainers = results.map((r) => {
      const t = trainers.find((x) => x.id === Number(r.trainerId));
      return {
        name: t?.name,
        cid: t?.cid,
        marks: traineeMarks[Number(r.trainerId)] || {},
        overallPercentage: r.overallPercentage,
        grade: r.grade,
        result: r.result,
        certificateNo: r.certificateNo,
        generatedAt: r.generatedAt,
        modules: r.modules,
      };
    });

    await downloadTotMarkSheets(
      {
        programName: announcement?.programName,
        programCode:
          announcement?.programCode !== "—" ? announcement?.programCode : "",
        venue: announcement?.venue,
        programStartDate: announcement?.programStartDate,
        programEndDate: announcement?.programEndDate,
        modules: programModules,
      },
      pdfTrainers,
      fileName,
    );

    // Reflect stored results on screen
    setTrainers((prev) =>
      prev.map((t) => {
        const r = results.find((x) => Number(x.trainerId) === t.id);
        return r
          ? {
              ...t,
              overallPercentage: r.overallPercentage,
              grade: r.grade,
              result: r.result,
              certificateNo: r.certificateNo,
            }
          : t;
      }),
    );
    return results.length;
  };

  const handleGenerateCertificate = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const count = await generateAndDownload(
        selectedTrainers,
        `TOT_Mark_Sheets_${applicationNo}.pdf`,
      );
      toast.success(`${count} mark sheet(s) generated and downloaded`);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Generation failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Selection already saved and unchanged -> no need to save again
  const savedSelectionIds = trainers
    .filter((t) => t.isSelected)
    .map((t) => t.id);
  const selectionSaved =
    savedSelectionIds.length > 0 &&
    savedSelectionIds.length === selectedTrainers.length &&
    savedSelectionIds.every((id) => selectedTrainers.includes(id));

  // All selected trainers have a generated mark sheet -> application can be closed
  const allCertificatesGenerated =
    selectedTrainers.length > 0 &&
    selectedTrainers.every(
      (id) => !!trainers.find((t) => t.id === id)?.certificateNo,
    );

  const handleCompleteApplication = async () => {
    setCompleting(true);
    try {
      const response = await TotService.completeApplication(
        {
          applicationNo,
          userId: userId != null ? String(userId) : null,
          updatedBy: actionId ? parseInt(actionId) : null,
          remarks: `TOT application completed. ${selectedTrainers.length} mark sheet(s) generated.`,
        },
        access_token,
      );
      if (response instanceof Error || response?.isAxiosError) {
        throw response;
      }
      setCompleted(true);
      setDoneOpen(false);
      toast.success(
        response?.data?.message || "Application completed successfully",
      );
      setTimeout(() => navigate("/tasklist/task-details-index"), 1200);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to complete application",
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadOne = async (trainer) => {
    setDownloadingId(trainer.id);
    try {
      await generateAndDownload(
        [trainer.id],
        `TOT_Mark_Sheet_${(trainer.name || trainer.id)
          .toString()
          .replace(/\s+/g, "_")}.pdf`,
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Download failed",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const isAllSelected =
    filteredTrainers.length > 0 &&
    filteredTrainers.every((t) => selectedTrainers.includes(t.id));

  // ---------- Loading screen ----------
  if (loading) {
    return (
      <Paper
        elevation={3}
        style={{ padding: 40, margin: 10, textAlign: "center" }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
          Loading application details...
        </Typography>
      </Paper>
    );
  }

  // ---------- Error screen ----------
  if (error) {
    return (
      <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Back
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  // ---------- Step content ----------
  const renderStepContent = (step) => {
    switch (step) {
      case 0: {
        const maxAllowed = parseInt(announcement?.maxParticipants, 10);
        const hasMax = Number.isFinite(maxAllowed) && maxAllowed > 0;
        const overCapacity = hasMax && selectedTrainers.length > maxAllowed;
        const progress = getApplicationProgress();

        return (
          <Paper
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}
          >
            {/* Section header */}
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Avatar
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  width: 40,
                  height: 40,
                }}
              >
                <GroupsOutlinedIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Select trainers for {announcement?.programName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tick the trainers to include, then continue to enter marks.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Applied: ${trainers.length}`}
                />
                <Chip
                  size="small"
                  color={
                    overCapacity
                      ? "error"
                      : selectedTrainers.length > 0
                        ? "primary"
                        : "default"
                  }
                  label={`Selected: ${selectedTrainers.length}${
                    hasMax ? ` / ${maxAllowed}` : ""
                  }`}
                />
              </Box>
            </Box>

            {/* Application completion progress */}
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.75,
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Application progress
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    • {progress.stage}
                  </Typography>
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={
                    progress.percent === 100 ? "success.main" : "primary.main"
                  }
                >
                  {progress.percent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.percent}
                color={progress.percent === 100 ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2.5,
                  mt: 1,
                  flexWrap: "wrap",
                  "& .step": {
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  },
                }}
              >
                <Typography className="step" variant="caption" color="text.secondary">
                  <CheckCircleIcon
                    sx={{ fontSize: 15 }}
                    color={progress.selectedCount > 0 ? "success" : "disabled"}
                  />
                  Selection: {progress.selectedCount} trainer(s)
                </Typography>
                <Typography className="step" variant="caption" color="text.secondary">
                  <CheckCircleIcon
                    sx={{ fontSize: 15 }}
                    color={
                      progress.modulesTotal > 0 &&
                      progress.modulesDone === progress.modulesTotal
                        ? "success"
                        : "disabled"
                    }
                  />
                  Marks: {progress.modulesDone} / {progress.modulesTotal} module(s)
                </Typography>
                <Typography className="step" variant="caption" color="text.secondary">
                  <CheckCircleIcon
                    sx={{ fontSize: 15 }}
                    color={
                      progress.certTotal > 0 &&
                      progress.certDone === progress.certTotal
                        ? "success"
                        : "disabled"
                    }
                  />
                  Mark sheets: {progress.certDone} / {progress.certTotal}
                </Typography>
              </Box>
            </Box>

            {overCapacity && (
              <Alert severity="warning" sx={{ borderRadius: 0 }}>
                {selectedTrainers.length} trainers selected, but this program
                allows a maximum of {maxAllowed} participants.
              </Alert>
            )}

            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                        letterSpacing: 0.4,
                        bgcolor: "#fafafa",
                        py: 1.25,
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={
                          selectedTrainers.length > 0 && !isAllSelected
                        }
                        onChange={handleSelectAll}
                        disabled={filteredTrainers.length === 0}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 40 }}>#</TableCell>
                    <TableCell>Trainer</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Qualification</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell align="center">Modules</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrainers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <PersonSearchOutlinedIcon
                          sx={{ fontSize: 44, color: "text.disabled" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {search
                            ? "No trainers match your search"
                            : "No trainers have applied for this program yet"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrainers.map((trainer, index) => {
                      const checked = selectedTrainers.includes(trainer.id);
                      return (
                        <TableRow
                          key={trainer.id}
                          hover
                          selected={checked}
                          onClick={() => handleSelectTrainer(trainer.id)}
                          sx={{
                            cursor: "pointer",
                            "& td": { py: 1.25 },
                            "&.Mui-selected": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, 0.06),
                            },
                            "&.Mui-selected:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={checked}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleSelectTrainer(trainer.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  fontSize: "0.8rem",
                                  bgcolor: checked
                                    ? "primary.main"
                                    : "grey.400",
                                }}
                              >
                                {getInitials(trainer.name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {trainer.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  CID: {trainer.cid}
                                  {trainer.gender && trainer.gender !== "—"
                                    ? ` • ${trainer.gender}`
                                    : ""}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {trainer.email}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {trainer.mobileNo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {trainer.qualification &&
                            trainer.qualification !== "—" ? (
                              <Chip
                                label={trainer.qualification}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {trainer.specialization || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {trainer.modules?.length ? (
                              <Tooltip
                                arrow
                                title={
                                  <Box>
                                    {trainer.modules.map((m) => (
                                      <div key={m.id}>
                                        {m.moduleCode} — {m.moduleName} (
                                        {m.contents.length} item
                                        {m.contents.length === 1 ? "" : "s"})
                                      </div>
                                    ))}
                                  </Box>
                                }
                              >
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`${trainer.modules.length} module${
                                    trainer.modules.length === 1 ? "" : "s"
                                  }`}
                                />
                              </Tooltip>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {trainer.isSelected ? (
                              <Chip
                                size="small"
                                color="success"
                                icon={<CheckCircleIcon />}
                                label="Selected"
                              />
                            ) : (
                              <Chip
                                size="small"
                                variant="outlined"
                                label="Pending"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      }

      case 1: {
        const selectedList = trainers.filter((t) =>
          selectedTrainers.includes(t.id),
        );

        if (selectedList.length === 0) {
          return (
            <Alert severity="info" sx={{ mt: 2 }}>
              Select at least one trainer in the previous step.
            </Alert>
          );
        }

        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Enter marks for each course content, then save each module
            </Typography>

            {selectedList.map((trainer) => {
              const total = getTrainerTotal(trainer, traineeMarks);
              const maxTotal = getMaxTotal(trainer);
              const rawPercent =
                maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
              const weighted = getTrainerWeighted(trainer, traineeMarks);
              const percent = weighted.percent ?? rawPercent;

              return (
                <Paper
                  key={trainer.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, bgcolor: "#fafafa" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Avatar sx={{ width: 28, height: 28, fontSize: "0.8rem" }}>
                      {getInitials(trainer.name)}
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="600">
                      {trainer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      CID: {trainer.cid}
                    </Typography>
                    <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Total: ${total} / ${maxTotal} (${rawPercent}%)`}
                      />
                      <Chip
                        size="small"
                        label={
                          weighted.maxWeight > 0
                            ? `Weighted Score: ${weighted.score} / ${weighted.maxWeight} (${percent}%)`
                            : "Weighted Score: no weightage set"
                        }
                        color={
                          percent >= 60
                            ? "success"
                            : percent >= 40
                              ? "warning"
                              : "error"
                        }
                      />
                    </Box>
                  </Box>

                  {trainer.modules.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No modules assigned
                    </Typography>
                  ) : (
                    trainer.modules.map((module) => {
                      const modKey = `${trainer.id}-${module.id}`;
                      const saved = isModuleSaved(trainer, module);
                      const isSaving = savingKey === modKey;
                      const modTotal = getModuleTotal(
                        module,
                        traineeMarks,
                        trainer.id,
                      );
                      const modMax = getModuleMax(module);
                      const modPercent =
                        modMax > 0 ? Math.round((modTotal / modMax) * 100) : 0;
                      const allFilled = module.contents.every(
                        (c) => traineeMarks[trainer.id]?.[c.id] !== undefined,
                      );
                      const locked = isModuleLocked(trainer, module);

                      return (
                        <Paper
                          key={module.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: locked ? "#f5f5f5" : "#fff",
                            opacity: locked ? 0.7 : 1,
                          }}
                        >
                          {/* Module header */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {module.moduleCode} — {module.moduleName}
                            </Typography>
                            {module.weightage ? (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Weightage: ${module.weightage}`}
                              />
                            ) : null}
                            {getModuleWeighted(
                              module,
                              traineeMarks,
                              trainer.id,
                            ) !== null && (
                              <Chip
                                size="small"
                                color="primary"
                                variant="outlined"
                                label={`Weighted: ${getModuleWeighted(
                                  module,
                                  traineeMarks,
                                  trainer.id,
                                )} / ${parseWeightage(module.weightage)}`}
                              />
                            )}
                            <Chip
                              size="small"
                              label={`Module Total: ${modTotal} / ${modMax} (${modPercent}%)`}
                              color={
                                modPercent >= 60
                                  ? "success"
                                  : modPercent >= 40
                                    ? "warning"
                                    : "default"
                              }
                            />
                            {saved && (
                              <Chip
                                size="small"
                                color="success"
                                icon={<CheckCircleIcon />}
                                label="Saved"
                              />
                            )}
                            {locked && (
                              <Chip
                                size="small"
                                icon={<LockIcon />}
                                label="Locked"
                              />
                            )}
                          </Box>
                          {locked && (
                            <Alert severity="info" sx={{ mb: 1, py: 0 }}>
                              Save the previous module marks to enable this
                              module.
                            </Alert>
                          )}

                          {/* Contents table */}
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small" sx={tableStyle}>
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                  <TableCell sx={{ width: 60 }}>#</TableCell>
                                  <TableCell>Course Content</TableCell>
                                  <TableCell align="center" sx={{ width: 120 }}>
                                    Full Mark
                                  </TableCell>
                                  <TableCell align="center" sx={{ width: 180 }}>
                                    Marks Obtained
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {module.contents.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center">
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        No contents in this module
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  module.contents.map((content, cIdx) => (
                                    <TableRow key={content.id} hover>
                                      <TableCell>{cIdx + 1}</TableCell>
                                      <TableCell>
                                        {content.courseContent}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          label={content.fullMark}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={
                                            traineeMarks[trainer.id]?.[
                                              content.id
                                            ] ?? ""
                                          }
                                          onChange={(e) =>
                                            handleMarkChange(
                                              trainer.id,
                                              content.id,
                                              e.target.value,
                                              content.fullMark,
                                            )
                                          }
                                          sx={{ width: 120 }}
                                          disabled={locked}
                                          InputProps={{
                                            inputProps: {
                                              min: 0,
                                              max: content.fullMark,
                                            },
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          {/* Save button BELOW the table */}
                          {module.contents.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 1,
                                mt: 1.5,
                              }}
                            >
                              <Button
                                variant={saved ? "outlined" : "contained"}
                                size="small"
                                startIcon={
                                  isSaving ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : saved ? (
                                    <CheckCircleIcon />
                                  ) : (
                                    <SaveIcon />
                                  )
                                }
                                onClick={() =>
                                  handleSaveModule(trainer, module)
                                }
                                disabled={isSaving || !allFilled || locked}
                                title={
                                  locked
                                    ? "Save the previous module marks first"
                                    : !allFilled
                                    ? "Fill all marks in this module before saving"
                                    : ""
                                }
                              >
                                {isSaving
                                  ? "Saving..."
                                  : saved
                                    ? "Saved"
                                    : "Save Module Marks"}
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      );
                    })
                  )}
                </Paper>
              );
            })}
          </Box>
        );
      }

      case 2: {
        const selectedForCertificate = trainers.filter((t) =>
          selectedTrainers.includes(t.id),
        );
        return (
          <Paper
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.03),
              }}
            >
              <Avatar
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  color: "error.main",
                  width: 40,
                  height: 40,
                }}
              >
                <PictureAsPdfIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Mark sheets — {announcement?.programName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {announcement?.venue || "—"} •{" "}
                  {formatDate(announcement?.programStartDate)} –{" "}
                  {formatDate(announcement?.programEndDate)}
                </Typography>
              </Box>
              <Chip
                size="small"
                color="primary"
                label={`${selectedForCertificate.length} trainer(s)`}
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                        letterSpacing: 0.4,
                        bgcolor: "#fafafa",
                      },
                    }}
                  >
                    <TableCell>Trainer</TableCell>
                    <TableCell align="center">Weighted Score</TableCell>
                    <TableCell align="center">Overall %</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Result</TableCell>
                    <TableCell>Certificate No.</TableCell>
                    <TableCell align="center">Mark Sheet</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedForCertificate.map((trainer) => {
                    const weighted = getTrainerWeighted(trainer, traineeMarks);
                    const generated = !!trainer.certificateNo;
                    return (
                      <TableRow key={trainer.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: "0.8rem",
                                bgcolor: "primary.main",
                              }}
                            >
                              {getInitials(trainer.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {trainer.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                CID: {trainer.cid}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {weighted.maxWeight > 0
                            ? `${weighted.score} / ${weighted.maxWeight}`
                            : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {generated
                            ? `${Number(trainer.overallPercentage).toFixed(2)} %`
                            : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {trainer.grade ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={trainer.grade}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {trainer.result ? (
                            <Chip
                              size="small"
                              color={
                                trainer.result === "Competent"
                                  ? "success"
                                  : "error"
                              }
                              label={trainer.result}
                            />
                          ) : (
                            <Chip
                              size="small"
                              variant="outlined"
                              label="Not generated"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {trainer.certificateNo || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="text"
                            startIcon={
                              downloadingId === trainer.id ? (
                                <CircularProgress size={14} />
                              ) : (
                                <DownloadIcon />
                              )
                            }
                            disabled={downloadingId !== null || submitting}
                            onClick={() => handleDownloadOne(trainer)}
                          >
                            {generated ? "Download" : "Generate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#fafafa" }}>
              <Typography variant="caption" color="text.secondary">
                Overall percentage, grade and result are calculated and saved
                when the mark sheet is generated. Certificate numbers are kept
                once issued.
              </Typography>
            </Box>
          </Paper>
        );
      }

      default:
        return null;
    }
  };

  // ---------- Main render ----------
  return (
    <Paper elevation={3} style={{ padding: 20, margin: 10 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5">Apply Trainer to TOT Program</Typography>
        {submitting && <CircularProgress size={20} sx={{ ml: "auto" }} />}
      </Box>

      {/* Announcement details */}
      <Fade in>
        <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: "#f8f9fa" }}>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Application No.
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {announcement?.applicationNo}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Program Name
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {announcement?.programName}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Program Code
              </Typography>
              <Typography variant="body1">
                {announcement?.programCode}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Venue
              </Typography>
              <Typography variant="body1">
                {announcement?.venue || "N/A"}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Application Period
              </Typography>
              <Typography variant="body2">
                {formatDate(announcement?.applicationStartDate)} -{" "}
                {formatDate(announcement?.applicationEndDate)}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Program Period
              </Typography>
              <Typography variant="body2">
                {formatDate(announcement?.programStartDate)} -{" "}
                {formatDate(announcement?.programEndDate)}
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Max Participants
              </Typography>
              <Typography variant="body2">
                {announcement?.maxParticipants || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Search */}
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ justifyContent: "flex-end", mb: 2 }}
      >
        <Grid item size={{ xs: 12, md: 4 }}>
          <TextField
            label="Search Trainers"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, CID, Email, Mobile or Specialization"
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                "& input": { padding: "8px 12px" },
                "& fieldset": { borderRadius: "4px" },
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || submitting || completing || completed}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          !allCertificatesGenerated && (
          <Button
            color="success"
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            onClick={() => setConfirmOpen(true)}
            size="small"
            disabled={submitting || completing || completed}
            variant="contained"
          >
            {submitting ? "Generating..." : "Generate Certificate"}
          </Button>
          )
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            startIcon={
              savingSelection ? (
                <CircularProgress size={16} color="inherit" />
              ) : activeStep === 0 && !selectionSaved ? (
                <PersonIcon />
              ) : (
                <SendIcon />
              )
            }
            size="small"
            disabled={savingSelection}
          >
            {activeStep === 0 && !selectionSaved
              ? savingSelection
                ? "Saving..."
                : "Save & Continue"
              : "Next"}
          </Button>
        )}
        {activeStep === steps.length - 1 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              completing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <TaskAltIcon />
              )
            }
            onClick={() => setDoneOpen(true)}
            size="small"
            disabled={
              !allCertificatesGenerated || submitting || completing || completed
            }
            title={
              !allCertificatesGenerated
                ? "Generate mark sheets for all selected trainers first"
                : ""
            }
          >
            {completed ? "Completed" : completing ? "Completing..." : "Done"}
          </Button>
        )}
      </Box>

      {/* Done / complete application dialog */}
      <Dialog
        open={doneOpen}
        onClose={() => !completing && setDoneOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Complete Application</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            This will close application <strong>{applicationNo}</strong> for{" "}
            <strong>{announcement?.programName}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedTrainers.length} trainer(s) selected, marks saved and
            mark sheets generated. The task will be marked as completed and
            removed from the task list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDoneOpen(false)}
            size="small"
            disabled={completing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteApplication}
            variant="contained"
            size="small"
            disabled={completing}
            startIcon={
              completing ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <TaskAltIcon />
              )
            }
          >
            {completing ? "Completing..." : "Complete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Certificate Generation</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Generate certificates for <strong>{selectedTrainers.length}</strong>{" "}
            trainer(s) for <strong>{announcement?.programName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} size="small">
            Cancel
          </Button>
          <Button
            onClick={handleGenerateCertificate}
            variant="contained"
            color="success"
            size="small"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ViewApplyTrainerToTProgram;
