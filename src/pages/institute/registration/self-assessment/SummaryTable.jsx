import PropTypes from "prop-types";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { GRADE_SCALE, TABLE_STYLE, formatScore } from "./sarUtils";

const levelChip = (level) => (
  <Chip
    label={level}
    size="small"
    variant="outlined"
    color={
      String(level).toLowerCase() === "critical"
        ? "error"
        : String(level).toLowerCase() === "essential"
          ? "primary"
          : "default"
    }
    sx={{ height: 20, fontSize: "0.7rem" }}
  />
);

/**
 * SUMMARY of the quality standards (as shown on TVET provider dashboard).
 */
const SummaryTable = ({ summary, title = "Summary", scoreLabel = "Score" }) => {
  const { rows, totalWeight, totalScore, grade, answered, total } = summary;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1}
        mb={2}
      >
        <Box>
          <Typography fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {answered} of {total} sub-indicators scored
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<EmojiEventsIcon sx={{ color: "#fff !important" }} />}
            label={`${formatScore(totalScore)} / ${totalWeight}`}
            sx={{ bgcolor: grade.color, color: "#fff", fontWeight: 700 }}
          />
          <Chip
            label={`Grade: ${grade.grade}`}
            sx={{ bgcolor: grade.color, color: "#fff", fontWeight: 700 }}
          />
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small" sx={TABLE_STYLE}>
          <TableHead>
            <TableRow>
              <TableCell width={60}>Sl. No</TableCell>
              <TableCell>Quality Standard</TableCell>
              <TableCell align="center" width={110}>
                Level
              </TableCell>
              <TableCell align="center" width={130}>
                Allocated Score
              </TableCell>
              <TableCell align="center" width={130}>
                {scoreLabel}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.sl}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell align="center">{levelChip(row.level)}</TableCell>
                <TableCell align="center">{row.weight}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {formatScore(row.score)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ "& td": { fontWeight: 700, bgcolor: "#f5f7fa" } }}>
              <TableCell colSpan={3} align="right">
                Total
              </TableCell>
              <TableCell align="center">{totalWeight}</TableCell>
              <TableCell align="center">{formatScore(totalScore)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Accreditation Grading:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={0.5}>
          {GRADE_SCALE.map((g) => (
            <Chip
              key={g.grade}
              size="small"
              label={
                g.grade === "Not Accredited"
                  ? `${g.grade} (≤ ${g.max})`
                  : `${g.grade} (${g.min}-${g.max})`
              }
              variant={g.grade === grade.grade ? "filled" : "outlined"}
              sx={{
                borderColor: g.color,
                color: g.grade === grade.grade ? "#fff" : g.color,
                bgcolor: g.grade === grade.grade ? g.color : "transparent",
                fontWeight: 600,
              }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

SummaryTable.propTypes = {
  summary: PropTypes.shape({
    rows: PropTypes.array.isRequired,
    totalWeight: PropTypes.number,
    totalScore: PropTypes.number,
    grade: PropTypes.object,
    answered: PropTypes.number,
    total: PropTypes.number,
  }).isRequired,
  title: PropTypes.string,
  scoreLabel: PropTypes.string,
};

export default SummaryTable;
