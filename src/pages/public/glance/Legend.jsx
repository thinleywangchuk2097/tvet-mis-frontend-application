import { Box, Stack, Typography } from "@mui/material";
import { PRIVATE_COLOR, PUBLIC_COLOR } from "./glanceData";

// Public / Private key
const Legend = () => (
  <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
    {[
      ["Public", PUBLIC_COLOR],
      ["Private", PRIVATE_COLOR],
    ].map(([label, color]) => (
      <Stack key={label} direction="row" spacing={0.6} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: color }} />
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
          {label}
        </Typography>
      </Stack>
    ))}
  </Stack>
);

export default Legend;
