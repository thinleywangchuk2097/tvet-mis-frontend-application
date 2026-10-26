import { Fragment, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import SummaryTable from "./SummaryTable";
import {
  TABLE_STYLE,
  computeCriteriaScore,
  computeSummary,
  formatScore,
  getPointOptions,
} from "./sarUtils";

const isEmpty = (v) => v === "" || v === null || v === undefined;

/**
 * Quality Standards checklist rendered as one tab per CRITERIA plus a SUMMARY tab.
 *
 * mode = "institute"    -> Earned points (self assessment) dropdown, no justification
 * mode = "verification" -> Self assessed (read only) + editable Earned points + Justification
 */
const QualityStandardsTabs = ({
  criteria,
  mode = "institute",
  selfPoints = {},
  earnedPoints = {},
  justifications = {},
  onSelfPointChange,
  onEarnedPointChange,
  onJustificationChange,
  readOnly = false,
  showErrors = false,
}) => {
  const [tab, setTab] = useState(0);
  const isVerification = mode === "verification";

  // Points that drive the score on this screen
  const scoringPoints = isVerification ? earnedPoints : selfPoints;

  const summary = useMemo(
    () => computeSummary(criteria, scoringPoints),
    [criteria, scoringPoints],
  );

  if (!criteria || criteria.length === 0) {
    return (
      <Alert severity="info">
        No quality standards configured for this service (service id 19).
      </Alert>
    );
  }

  const summaryIndex = criteria.length;
  const safeTab = Math.min(tab, summaryIndex);

  const handlePointChange = (subId, value) => {
    const parsed = value === "" ? "" : Number(value);
    if (isVerification) onEarnedPointChange?.(subId, parsed);
    else onSelfPointChange?.(subId, parsed);
  };

  const renderPointSelect = (sub, value) => {
    const error = showErrors && isEmpty(value);
    return (
      <TextField
        select
        size="small"
        fullWidth
        value={isEmpty(value) ? "" : value}
        onChange={(e) => handlePointChange(sub.id, e.target.value)}
        disabled={readOnly}
        error={error}
        slotProps={{
          select: { displayEmpty: true },
          input: { sx: { fontSize: "0.8rem", fontWeight: 600 } },
        }}
        sx={{ minWidth: 80 }}
      >
        <MenuItem value="" disabled>
          <em>-</em>
        </MenuItem>
        {getPointOptions(sub.allocated).map((p) => (
          <MenuItem key={p} value={p}>
            {p}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  const renderCriteria = (item, index) => {
    const stats = computeCriteriaScore(item, scoringPoints);
    const selfStats = isVerification
      ? computeCriteriaScore(item, selfPoints)
      : null;
    const progress = stats.total ? (stats.answered / stats.total) * 100 : 0;
    const columnCount = isVerification ? 7 : 5;

    return (
      <Box key={item.id}>
        {/* Criteria header */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            background: "linear-gradient(90deg, #f3f7fd 0%, #ffffff 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography
                variant="caption"
                color="primary"
                fontWeight={700}
                letterSpacing={1}
              >
                CRITERIA {index + 1}
              </Typography>
              <Typography fontWeight={700} sx={{ textTransform: "uppercase" }}>
                {item.title}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                label={`Level: ${item.level}`}
                color={
                  String(item.level).toLowerCase() === "critical"
                    ? "error"
                    : "primary"
                }
                variant="outlined"
              />
              <Chip
                size="small"
                label={`Allocated Score: ${item.weight}`}
                variant="outlined"
              />
              <Chip
                size="small"
                color="success"
                label={`Score: ${formatScore(stats.score)}`}
              />
            </Stack>
          </Stack>
          <Box mt={1.5}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.answered}/{stats.total} sub-indicators
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={progress === 100 ? "success" : "primary"}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </Paper>

        {/* Checklist */}
        <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ ...TABLE_STYLE, minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} width={55} align="center">
                  Sl. No
                </TableCell>
                <TableCell rowSpan={2} width={200}>
                  Indicators
                </TableCell>
                <TableCell rowSpan={2}>Sub-Indicators</TableCell>
                <TableCell
                  colSpan={isVerification ? 3 : 2}
                  align="center"
                  sx={{ bgcolor: "#eef3fb !important" }}
                >
                  Points
                </TableCell>
                {isVerification && (
                  <TableCell rowSpan={2} width={240}>
                    Justification{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      (optional)
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
              <TableRow>
                <TableCell align="center" width={80}>
                  Allocated
                </TableCell>
                {isVerification && (
                  <TableCell align="center" width={90}>
                    Self Assessed
                  </TableCell>
                )}
                <TableCell align="center" width={100}>
                  Earned
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {item.indicators.map((indicator) => (
                <Fragment key={indicator.id}>
                  {indicator.subIndicators.map((sub, subIndex) => {
                    const value = isVerification
                      ? earnedPoints[sub.id]
                      : selfPoints[sub.id];
                    const selfValue = selfPoints[sub.id];
                    const changed =
                      isVerification &&
                      !isEmpty(value) &&
                      !isEmpty(selfValue) &&
                      Number(value) !== Number(selfValue);
                    return (
                      <TableRow key={sub.id} hover>
                        {subIndex === 0 && (
                          <>
                            <TableCell
                              rowSpan={indicator.subIndicators.length}
                              align="center"
                              sx={{ fontWeight: 600 }}
                            >
                              {indicator.serial}
                            </TableCell>
                            <TableCell
                              rowSpan={indicator.subIndicators.length}
                              sx={{ fontWeight: 600, bgcolor: "#fcfcfd" }}
                            >
                              {indicator.title}
                            </TableCell>
                          </>
                        )}
                        <TableCell>{sub.title}</TableCell>
                        <TableCell align="center">{sub.allocated}</TableCell>
                        {isVerification && (
                          <TableCell align="center">
                            {isEmpty(selfValue) ? "-" : selfValue}
                          </TableCell>
                        )}
                        <TableCell
                          align="center"
                          sx={changed ? { bgcolor: "#fff8e1" } : undefined}
                        >
                          {readOnly && !isEmpty(value) ? (
                            <Typography fontWeight={600} fontSize="0.85rem">
                              {value}
                            </Typography>
                          ) : (
                            renderPointSelect(sub, value)
                          )}
                        </TableCell>
                        {isVerification && (
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              minRows={2}
                              maxRows={3}
                              placeholder={readOnly ? "" : "Justification (optional)"}
                              value={justifications[sub.id] || ""}
                              onChange={(e) =>
                                onJustificationChange?.(sub.id, e.target.value)
                              }
                              disabled={readOnly}
                              slotProps={{
                                input: { sx: { fontSize: "0.75rem", py: 0.5 } },
                                htmlInput: { maxLength: 1000 },
                              }}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </Fragment>
              ))}

              {/* Totals */}
              <TableRow sx={{ "& td": { bgcolor: "#f5f7fa", fontWeight: 700 } }}>
                <TableCell colSpan={3} align="right">
                  Total Points
                </TableCell>
                <TableCell align="center">{stats.allocated}</TableCell>
                {isVerification && (
                  <TableCell align="center">{selfStats.earned}</TableCell>
                )}
                <TableCell align="center">{stats.earned}</TableCell>
                {isVerification && <TableCell />}
              </TableRow>
              <TableRow sx={{ "& td": { bgcolor: "#eef7ee", fontWeight: 700 } }}>
                <TableCell colSpan={3} align="right">
                  Score
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1, fontWeight: 400 }}
                  >
                    ({stats.earned}/{stats.allocated} × {item.weight})
                  </Typography>
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={columnCount - 3 - (isVerification ? 1 : 0)}
                >
                  {formatScore(stats.score)} / {item.weight}
                </TableCell>
                {isVerification && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Criteria navigation */}
        <Stack direction="row" justifyContent="space-between" mt={2}>
          <Button
            size="small"
            startIcon={<NavigateBeforeIcon />}
            disabled={index === 0}
            onClick={() => setTab(index - 1)}
            sx={{ textTransform: "none" }}
          >
            Previous Criteria
          </Button>
          <Button
            size="small"
            endIcon={<NavigateNextIcon />}
            onClick={() => setTab(index + 1)}
            sx={{ textTransform: "none" }}
          >
            {index === criteria.length - 1 ? "View Summary" : "Next Criteria"}
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={safeTab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 56,
              fontSize: "0.78rem",
              maxWidth: 220,
            },
          }}
        >
          {criteria.map((item, index) => {
            const stats = computeCriteriaScore(item, scoringPoints);
            const done = stats.total > 0 && stats.answered === stats.total;
            const hasError = showErrors && !done;
            return (
              <Tab
                key={item.id}
                iconPosition="start"
                icon={
                  done ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon
                      color={hasError ? "error" : "disabled"}
                      fontSize="small"
                    />
                  )
                }
                label={
                  <Tooltip title={item.title} arrow>
                    <Box textAlign="left">
                      <Box
                        component="span"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                        color={hasError ? "error.main" : "text.secondary"}
                      >
                        Criteria {index + 1} · {stats.answered}/{stats.total}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 160,
                        }}
                      >
                        {item.title}
                      </Box>
                    </Box>
                  </Tooltip>
                }
              />
            );
          })}
          <Tab
            iconPosition="start"
            icon={<AssessmentIcon fontSize="small" />}
            label="Summary"
          />
        </Tabs>
      </Paper>

      {safeTab < summaryIndex ? (
        renderCriteria(criteria[safeTab], safeTab)
      ) : (
        <SummaryTable
          summary={summary}
          title={isVerification ? "Summary (Earned Points)" : "Summary"}
        />
      )}
    </Box>
  );
};

QualityStandardsTabs.propTypes = {
  criteria: PropTypes.array.isRequired,
  mode: PropTypes.oneOf(["institute", "verification"]),
  selfPoints: PropTypes.object,
  earnedPoints: PropTypes.object,
  justifications: PropTypes.object,
  onSelfPointChange: PropTypes.func,
  onEarnedPointChange: PropTypes.func,
  onJustificationChange: PropTypes.func,
  readOnly: PropTypes.bool,
  showErrors: PropTypes.bool,
};

export default QualityStandardsTabs;
