import { Fragment, useState } from "react";
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import GlancePanel from "./GlancePanel";
import {
  INDICATOR_GROUPS,
  INK,
  LINE,
  NAVY,
  fmt,
} from "./glanceData";

// serial numbers run across all groups (1, 2, 3 ...)
const SERIAL = new Map(
  INDICATOR_GROUPS.flatMap((g) => g.rows).map((row, i) => [row.name, i + 1]),
);

const num = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

const KeyIndicatorsTable = () => {
  const [open, setOpen] = useState({});
  const toggle = (name) => setOpen((o) => ({ ...o, [name]: !o[name] }));

  return (
    <GlancePanel
      icon={<TableChartOutlinedIcon />}
      title="Key TVET indicators"
      subtitle="Cumulative figures by provider type"
    >
      <TableContainer sx={{ borderRadius: 1.5, overflow: "hidden", height: "100%" }}>
        <Table
          size="small"
          sx={{
            // rows share any extra height so the card lines up with the side column
            height: "100%",
            borderCollapse: "collapse",
            "& th, & td": { border: `1px solid ${LINE}`, px: 1.25 },
            "& th": {
              bgcolor: NAVY,
              color: "#fff",
              fontSize: "0.74rem",
              fontWeight: 700,
              letterSpacing: 0.3,
              py: 0.6,
              borderColor: NAVY,
            },
            "& td": { fontSize: "0.8rem", color: INK, py: 0.3, lineHeight: 1.35 },
            "& tbody tr:nth-of-type(even) td": { bgcolor: "#fafcff" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>#</TableCell>
              <TableCell>Indicator</TableCell>
              <TableCell align="right" sx={{ width: 90 }}>Public</TableCell>
              <TableCell align="right" sx={{ width: 90 }}>Private</TableCell>
              <TableCell align="right" sx={{ width: 90 }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {INDICATOR_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    sx={{
                      bgcolor: "#eaf1fb !important",
                      fontWeight: 700,
                      fontSize: "0.74rem !important",
                      color: `${NAVY} !important`,
                      letterSpacing: 0.3,
                      py: "3px !important",
                    }}
                  >
                    {group.title}
                  </TableCell>
                </TableRow>
                {group.rows.map((row) => {
                  const expandable = Boolean(row.subItems?.length);
                  const isOpen = !!open[row.name];
                  return (
                    <Fragment key={row.name}>
                      <TableRow hover>
                        <TableCell align="center" sx={{ color: "text.secondary", ...num }}>
                          {SERIAL.get(row.name)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {row.name}
                            {expandable && (
                              <IconButton
                                size="small"
                                onClick={() => toggle(row.name)}
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? "Hide" : "Show"} breakdown for ${row.name}`}
                                sx={{ p: 0.25, ml: 0.25, color: "text.secondary" }}
                              >
                                {isOpen ? <RemoveIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={num}>{fmt(row.pub)}</TableCell>
                        <TableCell align="right" sx={num}>{fmt(row.pvt)}</TableCell>
                        <TableCell align="right" sx={{ ...num, fontWeight: 700 }}>
                          {fmt(row.pub + row.pvt)}
                        </TableCell>
                      </TableRow>
                      {expandable &&
                        isOpen &&
                        row.subItems.map((sub, si) => (
                          <TableRow key={sub.name} sx={{ "& td": { color: "text.secondary", fontSize: "0.8rem" } }}>
                            <TableCell align="center" sx={num}>
                              {SERIAL.get(row.name)}.{si + 1}
                            </TableCell>
                            <TableCell sx={{ pl: "28px !important" }}>{sub.name}</TableCell>
                            <TableCell align="right" sx={num}>{fmt(sub.pub)}</TableCell>
                            <TableCell align="right" sx={num}>{fmt(sub.pvt)}</TableCell>
                            <TableCell align="right" sx={num}>{fmt(sub.pub + sub.pvt)}</TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlancePanel>
  );
};

export default KeyIndicatorsTable;
