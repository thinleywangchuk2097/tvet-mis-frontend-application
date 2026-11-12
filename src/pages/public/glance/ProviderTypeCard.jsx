import { Box, Stack, Typography } from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import GlancePanel from "./GlancePanel";
import { INK, NAVY, PROVIDER_TYPES, fmt, pct } from "./glanceData";

const total = PROVIDER_TYPES.reduce((s, d) => s + d.value, 0);

// Training institutes split by public / private (donut with total in the middle)
const ProviderTypeCard = () => (
  <GlancePanel
    icon={<AccountBalanceOutlinedIcon />}
    title="Institutes by provider type"
    subtitle="Registered training institutes"
  >
    <Box sx={{ position: "relative", height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={PROVIDER_TYPES}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="95%"
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive
          >
            {PROVIDER_TYPES.map((d) => (
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
          textAlign: "center",
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: NAVY, lineHeight: 1 }}>
            {fmt(total)}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            institutes
          </Typography>
        </Box>
      </Box>
    </Box>

    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
      {PROVIDER_TYPES.map((d) => (
        <Stack key={d.name} direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: d.color }} />
          <Typography sx={{ flex: 1, fontSize: "0.84rem", color: INK }}>{d.name}</Typography>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
            {fmt(d.value)}
          </Typography>
          <Typography sx={{ width: 40, textAlign: "right", fontSize: "0.78rem", color: "text.secondary" }}>
            {pct(d.value, total)}%
          </Typography>
        </Stack>
      ))}
    </Stack>
  </GlancePanel>
);

export default ProviderTypeCard;
