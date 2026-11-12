import { Box, Stack, Typography } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import GlancePanel from "./GlancePanel";
import {
  INDICATOR_GROUPS,
  INK,
  NAVY,
  PRIVATE_COLOR,
  PUBLIC_COLOR,
  fmt,
  pct,
} from "./glanceData";

// Enrolment rows come from the indicators table, so the figures always match
const rows = INDICATOR_GROUPS.flatMap((g) => g.rows).filter((r) =>
  r.name.toLowerCase().startsWith("enrolment"),
);
const pub = rows.reduce((s, r) => s + r.pub, 0);
const pvt = rows.reduce((s, r) => s + r.pvt, 0);
const total = pub + pvt;

const EnrolmentCard = () => (
  <GlancePanel
    icon={<SchoolOutlinedIcon />}
    title="Total enrolment"
    subtitle="BQF and non-BQF programmes"
  >
    <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: NAVY, lineHeight: 1.1 }}>
      {fmt(total)}
    </Typography>
    <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1.25 }}>
      trainees enrolled to date
    </Typography>

    <Box sx={{ display: "flex", gap: "2px", height: 10, mb: 1.5 }}>
      <Box sx={{ width: `${pct(pub, total)}%`, bgcolor: PUBLIC_COLOR, borderRadius: "5px 0 0 5px" }} />
      <Box sx={{ flex: 1, bgcolor: PRIVATE_COLOR, borderRadius: "0 5px 5px 0" }} />
    </Box>

    <Stack spacing={0.75}>
      {[
        ["Public", pub, PUBLIC_COLOR],
        ["Private", pvt, PRIVATE_COLOR],
      ].map(([label, value, color]) => (
        <Stack key={label} direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: color }} />
          <Typography sx={{ flex: 1, fontSize: "0.84rem", color: INK }}>{label}</Typography>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
            {fmt(value)}
          </Typography>
          <Typography sx={{ width: 40, textAlign: "right", fontSize: "0.78rem", color: "text.secondary" }}>
            {pct(value, total)}%
          </Typography>
        </Stack>
      ))}
    </Stack>
  </GlancePanel>
);

export default EnrolmentCard;
