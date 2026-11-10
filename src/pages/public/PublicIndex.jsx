<Grid container>
  {SERVICES.map((s, i) => (
    <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
      <Box
        component="a"
        href={s.href}
        onClick={() => {
          // course links pick which announcements the list shows
          if (s.href === "#course-announcements") setRplOnly(Boolean(s.rpl));
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: { xs: 1.5, md: 2 },
          height: "100%",
          borderRadius: 2,
          bgcolor: "background.paper",
          border: `1px solid ${LINE}`,
          textDecoration: "none",
          color: "inherit",
          "&:hover, &:focus-visible": { borderColor: BLUE },
          "&:hover .svc-arrow, &:focus-visible .svc-arrow": {
            transform: "translateX(3px)",
            color: BLUE,
          },
          "&:focus-visible": {
            outline: `2px solid ${BLUE}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`,
            boxShadow: `0 8px 18px ${alpha(BLUE, 0.3)}`,
          }}
        >
          {s.icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={700} sx={{ color: NAVY, fontSize: "1rem" }}>
            {s.label}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
            {s.desc}
          </Typography>
        </Box>
        <ArrowForwardIcon
          className="svc-arrow"
          sx={{ fontSize: 18, color: "#9db0c9", transition: "all .2s" }}
        />
      </Box>
    </Grid>
  ))}
</Grid>