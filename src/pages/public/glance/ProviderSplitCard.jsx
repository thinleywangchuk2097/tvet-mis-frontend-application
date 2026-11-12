import PropTypes from "prop-types";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import GlancePanel from "./GlancePanel";
import {
  INDICATOR_GROUPS,
  INK,
  LINE,
  NAVY,
  PRIVATE_COLOR,
  PROVIDER_TYPES,
  PUBLIC_COLOR,
  fmt,
  pct,
} from "./glanceData";

// Institutes (from PROVIDER_TYPES) and enrolment (from the indicators table)
const institutes = {
  pub: PROVIDER_TYPES.find((d) => d.name === "Public")?.value || 0,
  pvt: PROVIDER_TYPES.find((d) => d.name === "Private")?.value || 0,
};
const enrolRows = INDICATOR_GROUPS.flatMap((g) => g.rows).filter((r) =>
  r.name.toLowerCase().startsWith("enrolment"),
);
const enrolment = {
  pub: enrolRows.reduce((s, r) => s + r.pub, 0),
  pvt: enrolRows.reduce((s, r) => s + r.pvt, 0),
};

const Donut = ({ pub, pvt, label }) => {
  const total = pub + pvt;
  const data = [
    { name: "Public", value: pub, color: PUBLIC_COLOR },
    { name: "Private", value: pvt, color: PRIVATE_COLOR },
  ];
  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ position: "relative", height: 92 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="96%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${fmt(v)} (${pct(v, total)}%)`, n]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: NAVY }}>
            {fmt(total)}
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ mt: 0.5, fontSize: "0.78rem", fontWeight: 600, color: INK }}>
        {label}
      </Typography>
    </Box>
  );
};
Donut.propTypes = {
  pub: PropTypes.number.isRequired,
  pvt: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

const cellNum = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

// Institutes and enrolment by provider type, sharing one Public / Private key
const ProviderSplitCard = () => (
  <GlancePanel
    icon={<CompareArrowsIcon />}
    title="Public and private providers"
    subtitle="Training institutes and trainees enrolled"
  >
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
      <Donut pub={institutes.pub} pvt={institutes.pvt} label="Training institutes" />
      <Donut pub={enrolment.pub} pvt={enrolment.pvt} label="Trainees enrolled" />
    </Box>

    {/* shared key */}
    <Table
      size="small"
      sx={{
        mt: 1,
        "& th, & td": { borderBottom: `1px solid ${LINE}`, px: 1, py: 0.45 },
        "& th": { fontSize: "0.72rem", fontWeight: 700, color: "text.secondary" },
        "& td": { fontSize: "0.82rem", color: INK },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell align="right">Institutes</TableCell>
          <TableCell align="right">Enrolment</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[
          ["Public", PUBLIC_COLOR, "pub"],
          ["Private", PRIVATE_COLOR, "pvt"],
        ].map(([label, color, key]) => (
          <TableRow key={label}>
            <TableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: color }} />
                {label}
              </Box>
            </TableCell>
            <TableCell align="right" sx={cellNum}>
              <b>{fmt(institutes[key])}</b>{" "}
              <Box component="span" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                {pct(institutes[key], institutes.pub + institutes.pvt)}%
              </Box>
            </TableCell>
            <TableCell align="right" sx={cellNum}>
              <b>{fmt(enrolment[key])}</b>{" "}
              <Box component="span" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                {pct(enrolment[key], enrolment.pub + enrolment.pvt)}%
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </GlancePanel>
);

export default ProviderSplitCard;
