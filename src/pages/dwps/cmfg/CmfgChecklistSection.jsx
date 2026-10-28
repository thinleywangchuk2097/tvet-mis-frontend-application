// Read/write checklist table for one parent (used by apply + review pages)
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  BORDERED_TABLE,
  flattenSection,
  headCellSx,
  leavesOf,
} from "./cmfgChecklistUtils";

export const ChecklistSection = ({
  section,
  answers,
  remarks,
  readOnly,
  onAnswer,
  onRemark,
  changedIds = [],
}) => {
  const leaves = leavesOf(section);
  const rows = flattenSection(section);
  const answered = leaves.filter((r) => answers[r.id]).length;
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 1.5, mb: 1.5, overflow: "hidden" }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Avatar
          sx={{
            width: 22,
            height: 22,
            fontSize: "0.72rem",
            bgcolor: "primary.main",
          }}
        >
          {section.number}
        </Avatar>
        <Typography fontWeight={600} fontSize="0.9rem" sx={{ flex: 1 }}>
          {section.title}
          <Typography component="span" sx={{ color: "error.main", ml: 0.5 }}>
            *
          </Typography>
        </Typography>
        <Chip
          size="small"
          color={answered === leaves.length ? "success" : "default"}
          variant={answered === leaves.length ? "filled" : "outlined"}
          label={`${answered}/${leaves.length}`}
        />
      </Box>
      <TableContainer>
        <Table size="small" sx={BORDERED_TABLE}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: 64 }}>No.</TableCell>
              <TableCell sx={headCellSx}>Checklist</TableCell>
              <TableCell sx={{ ...headCellSx, width: 52 }} align="center">
                Yes
              </TableCell>
              <TableCell sx={{ ...headCellSx, width: 52 }} align="center">
                No
              </TableCell>
              <TableCell sx={{ ...headCellSx, width: "28%" }}>
                Remarks
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const indent = Math.max(0, row.depth - 1) * 2;
              if (row.type === "group") {
                // sub parent / child heading
                return (
                  <TableRow key={`g-${row.id}`}>
                    <TableCell
                      colSpan={5}
                      sx={{
                        py: "4px !important",
                        bgcolor: (t) =>
                          alpha(
                            t.palette.primary.main,
                            row.depth === 1 ? 0.06 : 0.025,
                          ),
                      }}
                    >
                      <Typography
                        fontSize="0.8rem"
                        fontWeight={row.depth === 1 ? 700 : 600}
                        sx={{
                          pl: indent,
                          color:
                            row.depth === 1 ? "primary.main" : "text.primary",
                        }}
                      >
                        {row.number}&nbsp;&nbsp;{row.title}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              }
              const value = answers[row.id];
              return (
                <TableRow
                  key={row.id}
                  sx={{
                    bgcolor: (t) =>
                      changedIds.includes(row.id)
                        ? alpha(t.palette.warning.main, 0.12)
                        : value === "N"
                          ? alpha(t.palette.error.main, 0.04)
                          : "inherit",
                  }}
                >
                  <TableCell
                    sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                  >
                    {row.number}
                  </TableCell>
                  <TableCell>
                    <Typography fontSize="0.8rem" sx={{ pl: indent }}>
                      {row.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      size="small"
                      sx={{ p: 0.25, "& svg": { fontSize: 18 } }}
                      color="success"
                      checked={value === "Y"}
                      onChange={() => onAnswer(row.id, "Y")}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Radio
                      size="small"
                      sx={{ p: 0.25, "& svg": { fontSize: 18 } }}
                      color="error"
                      checked={value === "N"}
                      onChange={() => onAnswer(row.id, "N")}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Typography fontSize="0.8rem" color="text.secondary">
                        {remarks[row.id] || "—"}
                      </Typography>
                    ) : (
                      <TextField
                        size="small"
                        fullWidth
                        variant="standard"
                        slotProps={{
                          input: {
                            disableUnderline: false,
                            sx: { fontSize: "0.8rem" },
                          },
                        }}
                        placeholder={
                          value === "N"
                            ? "Explain why (recommended)"
                            : "Optional"
                        }
                        value={remarks[row.id] || ""}
                        onChange={(e) => onRemark(row.id, e.target.value)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

ChecklistSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    number: PropTypes.string,
    depth: PropTypes.number,
    children: PropTypes.array,
  }).isRequired,
  answers: PropTypes.object.isRequired,
  remarks: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  onAnswer: PropTypes.func.isRequired,
  onRemark: PropTypes.func.isRequired,
  changedIds: PropTypes.arrayOf(PropTypes.string),
};


export default ChecklistSection;
