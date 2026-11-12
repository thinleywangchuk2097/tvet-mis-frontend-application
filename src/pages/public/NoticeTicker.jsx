import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  alpha,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import NotificationService from "../../api/services/internal/notification/NotificationService";

const NAVY = "#0a2d6e";
const SAFFRON = "#f9a825";
const NEW_DAYS = 7;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

const isNew = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() < NEW_DAYS * 86400000;

/**
 * Home-page notice bar. Shows the public notices published by TVET QC
 * (notification type 0, not expired). Falls back to the given messages when
 * there are none. Pauses on hover; click a notice to read it in full.
 */
const NoticeTicker = ({ fallbackMessages, reduceMotion }) => {
  const [notices, setNotices] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let alive = true;
    NotificationService.getPublicNotifications().then((res) => {
      if (!alive) return;
      const list = res && !(res instanceof Error) && Array.isArray(res.data) ? res.data : [];
      setNotices(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(
    () =>
      notices.length > 0
        ? notices.map((n) => ({
            id: n.id,
            title: n.title,
            text: n.textMessage,
            createdAt: n.createdAt,
            until: n.expiryDate,
            notice: true,
          }))
        : (fallbackMessages || []).map((t, i) => ({ id: `f${i}`, title: "", text: t, notice: false })),
    [notices, fallbackMessages],
  );

  // speed: about 70px per second whatever the amount of text
  const duration = useMemo(() => {
    const chars = items.reduce((s, it) => s + (it.title?.length || 0) + (it.text?.length || 0) + 12, 0);
    return Math.max(25, Math.round((chars * 7.5) / 70));
  }, [items]);

  if (items.length === 0) return null;

  const renderItems = (copy) =>
    items.map((it) => (
      <Box
        key={`${copy}-${it.id}`}
        component={it.notice ? "button" : "span"}
        type={it.notice ? "button" : undefined}
        onClick={it.notice ? () => setOpen(it) : undefined}
        tabIndex={it.notice && copy === 0 ? 0 : -1}
        aria-hidden={copy === 1 ? true : undefined}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 2.5,
          border: 0,
          bgcolor: "transparent",
          font: "inherit",
          color: "inherit",
          cursor: it.notice ? "pointer" : "default",
          whiteSpace: "nowrap",
          position: "relative",
          "&::after": {
            // small diamond between notices
            content: '""',
            position: "absolute",
            right: -3,
            width: 5,
            height: 5,
            transform: "rotate(45deg)",
            bgcolor: alpha("#fff", 0.35),
          },
          "&:hover .tk-title, &:focus-visible .tk-title": { textDecoration: it.notice ? "underline" : "none" },
          "&:focus-visible": { outline: `2px solid ${SAFFRON}`, outlineOffset: -2, borderRadius: 1 },
        }}
      >
        {it.notice && isNew(it.createdAt) && (
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.1,
              borderRadius: 1,
              bgcolor: SAFFRON,
              color: NAVY,
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            NEW
          </Box>
        )}
        {it.title && (
          <Box component="span" className="tk-title" sx={{ fontWeight: 700, color: "#fff" }}>
            {it.title}
          </Box>
        )}
        <Box component="span" sx={{ color: alpha("#fff", 0.8) }}>
          {it.title ? `— ${it.text}` : it.text}
        </Box>
      </Box>
    ));

  return (
    <>
      <Box
        role="region"
        aria-label="Notices"
        sx={{
          mt: 2.5,
          width: "100%",
          display: "flex",
          alignItems: "stretch",
          bgcolor: NAVY,
          borderTop: `1px solid ${alpha("#fff", 0.08)}`,
          borderBottom: `1px solid ${alpha("#000", 0.2)}`,
          fontSize: "0.86rem",
          height: 42,
          "&:hover .tk-track, &:focus-within .tk-track": { animationPlayState: "paused" },
        }}
      >
        {/* fixed label */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: { xs: 1.5, md: 2.5 },
            bgcolor: SAFFRON,
            color: NAVY,
            fontWeight: 800,
            fontSize: "0.74rem",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
            pr: { xs: 2.5, md: 3.5 },
          }}
        >
          <CampaignIcon sx={{ fontSize: 19 }} />
          Notices
        </Box>

        {/* moving notices */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: reduceMotion ? "auto" : "hidden",
            display: "flex",
            alignItems: "center",
            maskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 40px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 40px), transparent 100%)",
          }}
        >
          <Box component="style">{`@keyframes tvetNotice{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</Box>
          <Box
            className="tk-track"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              animation: reduceMotion ? "none" : `tvetNotice ${duration}s linear infinite`,
            }}
          >
            {renderItems(0)}
            {!reduceMotion && renderItems(1)}
          </Box>
        </Box>
      </Box>

      {/* full notice */}
      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, display: "flex", alignItems: "center", gap: 1 }}>
          <CampaignIcon sx={{ color: SAFFRON }} />
          {open?.title}
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ whiteSpace: "pre-line", fontSize: "0.95rem" }}>{open?.text}</Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary" }}>
            Published {fmtDate(open?.createdAt)}
            {open?.until ? ` · shown until ${fmtDate(open.until)}` : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

NoticeTicker.propTypes = {
  fallbackMessages: PropTypes.arrayOf(PropTypes.string),
  reduceMotion: PropTypes.bool,
};

export default NoticeTicker;
