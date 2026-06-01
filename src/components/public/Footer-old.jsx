import { Box, Grid, Typography, Link, Divider } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";

const Footer = () => {
  const sectionItems = {
    "About Us": ["Our Purpose", "Our Team", "Our Strategy"],
    Opportunity: ["Investor Guide", "Careers", "Internships"],
    "Our Office": [
      "Kawajangsa, Thimphu, Bhutan",
      "P.O. Box: 1143",
      "+975-02-9343993 / 77883636",
    ],
  };

  return (
    <Box
      sx={{
        bgcolor: "#1f1f1f",
        color: "#bbbbbb",
        p: { xs: 2, md: 2 },
        fontSize: "0.875rem",
      }}
    >
      <Grid container spacing={1} justifyContent="space-between">
        {/* Text Sections */}
        {Object.entries(sectionItems).map(([section, items]) => (
          <Grid item size={{ xs: 6, md: 3 }} key={section}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                mb: 1,
                position: "relative",
                display: "inline-block",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: "50%",
                  bottom: -2,
                  width: 0,
                  height: 2,
                  bgcolor: "#ffffff",
                  transition: "width 0.3s ease, left 0.3s ease",
                  transform: "translateX(-50%)",
                },
                "&:hover::after": {
                  width: "100%",
                  left: "50%",
                },
              }}
            >
              {section}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {items.map((item) => (
                <Link
                  key={item}
                  href="#"
                  underline="none"
                  sx={{
                    color: "#bbbbbb",
                    fontSize: "0.875rem",
                    transition: "color 0.3s ease",
                    "&:hover": { color: "#ffffff" },
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>
        ))}

        {/* Social Media */}
        <Grid item size={{ xs: 6, md: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#ffffff",
              mb: 1.5,
              textAlign: "center",
              position: "relative",
              display: "inline-block",
              "&::after": {
                content: '""',
                position: "absolute",
                left: "50%",
                bottom: -2,
                width: 0,
                height: 2,
                bgcolor: "#ffffff",
                transition: "width 0.3s ease, left 0.3s ease",
                transform: "translateX(-50%)",
              },
              "&:hover::after": {
                width: "100%",
                left: "50%",
              },
            }}
          >
            Connect With Us
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              gap: 2,
              mt: 0.5,
            }}
          >
            {[FacebookIcon, LinkedInIcon, InstagramIcon, XIcon].map(
              (Icon, idx) => (
                <Link
                  key={idx}
                  href="#"
                  sx={{
                    color: "#bbbbbb",
                    transition: "color 0.3s ease",
                    "&:hover": { color: "#ffffff" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  <Icon fontSize="inherit" />
                </Link>
              ),
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Bottom Divider & Note */}
      <Divider sx={{ my: 4, borderColor: "#444" }} />
      <Typography
        variant="caption"
        color="#888"
        align="center"
        sx={{ display: "block", mt: 2 }}
      >
        © 2026 TVET Bhutan — Designed & Developed with Care. All rights
        reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
