// Shared building blocks for the dashboards
import PropTypes from "prop-types";
import { Avatar, Box, Paper, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export const Panel = ({ title, action, children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      height: "100%",
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      ...sx,
    }}
  >
    {(title || action) && (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Typography fontWeight={600} fontSize="0.95rem">
          {title}
        </Typography>
        {action}
      </Box>
    )}
    {children}
  </Paper>
);
Panel.propTypes = {
  title: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
};

export const Kpi = ({ title, value, sub, icon, color, loading, highlight }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      height: "100%",
      display: "flex",
      alignItems: "center",
      gap: 1.75,
      borderRadius: 2.5,
      border: "1px solid",
      borderColor: highlight ? `${color}.main` : "divider",
      bgcolor: (t) =>
        highlight ? alpha(t.palette[color].main, 0.04) : "background.paper",
    }}
  >
    <Avatar
      sx={{
        width: 44,
        height: 44,
        bgcolor: (t) => alpha(t.palette[color].main, 0.12),
        color: `${color}.main`,
      }}
    >
      {icon}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      {loading ? (
        <Skeleton width={56} height={32} />
      ) : (
        <Typography fontWeight={700} fontSize="1.4rem" lineHeight={1.2}>
          {value}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" noWrap>
        {title}
      </Typography>
      {sub && !loading && (
        <Typography
          variant="caption"
          color="text.disabled"
          noWrap
          component="div"
        >
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
);
Kpi.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node,
  sub: PropTypes.node,
  icon: PropTypes.node,
  color: PropTypes.string,
  loading: PropTypes.bool,
  highlight: PropTypes.bool,
};

export const Empty = ({ text }) => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "text.disabled",
      fontSize: "0.85rem",
    }}
  >
    {text}
  </Box>
);
Empty.propTypes = { text: PropTypes.string };
