import { useState } from "react";
import {
  Box, Grid, Typography, Link, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import FaxIcon from "@mui/icons-material/Fax";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import PolicyIcon from "@mui/icons-material/Policy";
import GavelIcon from "@mui/icons-material/Gavel";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";

// ── Government logo (update path / filename to match your project)
import govtLogo from "../../assets/logo/govt-logo-sm.png";

// ── Brand palette ────────────────────────────────────────────────────────────
const PD = "#0a1f4d";   // deep navy (footer base)
const PDX = "#061538";   // darkest navy (bottom bar)
const P = "#1565c0";   // primary blue
const PL = "#42a5f5";   // light blue (accents)
const TEAL = "#26c6da";   // accent teal
const W = "#ffffff";
const TXT = "#a8bdde";   // body text
const TXT_D = "#7891b8";   // dim text
const TXT_DD = "#4a6189";   // dimmest text

// ── Section heading
const FooterHeading = ({ children }) => (
  <Typography
    sx={{
      fontWeight: 700, color: W, mb: 2.2, fontSize: "0.82rem",
      letterSpacing: "0.08em", textTransform: "uppercase",
      position: "relative", display: "inline-block",
      "&::after": {
        content: '""', position: "absolute",
        left: 0, bottom: -6,
        width: 32, height: 2.5,
        background: `linear-gradient(90deg, ${P}, ${TEAL})`,
        borderRadius: 1,
      },
    }}
  >
    {children}
  </Typography>
);

// ── Link with chevron
const FooterLink = ({ children, href = "#" }) => (
  <Box
    sx={{
      display: "flex", alignItems: "center", gap: 0.6, mb: 1,
      cursor: "pointer", transition: "transform 0.2s",
      "&:hover": { transform: "translateX(3px)" },
      "&:hover .chev": { color: TEAL },
      "&:hover .lk": { color: W },
    }}
  >
    <KeyboardArrowRightIcon className="chev"
      sx={{ fontSize: 14, color: TXT_DD, transition: "color 0.2s" }} />
    <Link href={href} underline="none" className="lk"
      sx={{ color: TXT, fontSize: "0.78rem", transition: "color 0.2s" }}>
      {children}
    </Link>
  </Box>
);

// ── Contact item with colored icon chip
const ContactItem = ({ icon, text, color = P }) => (
  <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ mb: 1.4 }}>
    <Box
      sx={{
        width: 28, height: 28, borderRadius: 1.2, flexShrink: 0,
        bgcolor: `${color}22`, border: `1px solid ${color}55`,
        color: color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Typography sx={{ color: TXT, fontSize: "0.77rem", lineHeight: 1.6, pt: 0.3 }}>
      {text}
    </Typography>
  </Stack>
);

// ── Legal modal content
const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    icon: <PolicyIcon />,
    sections: [
      {
        heading: "1. Introduction",
        body: "The Ministry of Education and Skills Development (MoESD), Royal Government of Bhutan, is committed to protecting the privacy of users of the TVET Management Information System (TVET MIS). This Privacy Policy explains how we collect, use, store, and safeguard your personal information when you use our portal and related services.",
      },
      {
        heading: "2. Information We Collect",
        body: "We collect information that you provide directly to us when registering as a trainee, training provider, assessor, accreditor, or other system user. This includes your full name, Citizenship Identity Card (CID) number, contact details, address, date of birth, academic and professional qualifications, employment history, payment information, and supporting documents required for applications, assessments, certifications, and renewals.",
      },
      {
        heading: "3. How We Use Your Information",
        body: "Personal information is used solely for legitimate TVET-related purposes, including processing course and registration applications, conducting assessments and accreditation, issuing certifications, communicating updates and notices, generating national workforce statistics, complying with legal and regulatory obligations, and improving the quality of our services.",
      },
      {
        heading: "4. Data Storage and Security",
        body: "All personal data is stored on secure government servers located within Bhutan and is protected by industry-standard administrative, technical, and physical safeguards including encryption in transit, access controls, audit logs, and regular security reviews. Access is restricted to authorised personnel only on a need-to-know basis.",
      },
      {
        heading: "5. Sharing of Information",
        body: "We do not sell or rent personal information. Data may be shared with other authorised Royal Government of Bhutan agencies, accredited training institutes, and assessment bodies strictly for fulfilling official TVET functions, or where required by law or court order.",
      },
      {
        heading: "6. Your Rights",
        body: "You have the right to access the personal information we hold about you, request corrections to inaccurate data, withdraw consent for non-mandatory processing, and lodge a complaint regarding our handling of your data. Requests can be submitted in writing to tvet@moesc.gov.bt.",
      },
      {
        heading: "7. Cookies and Analytics",
        body: "The portal uses essential cookies to maintain your session and remember preferences, and anonymised analytics cookies to understand usage patterns and improve services. You may disable cookies through your browser, although this may affect certain functionalities.",
      },
      {
        heading: "8. Changes to this Policy",
        body: "This Privacy Policy may be updated periodically to reflect changes in law, technology, or our practices. The most recent version is always available on this page, and material changes will be communicated through the portal.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    icon: <GavelIcon />,
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing or using the TVET MIS portal, you agree to be bound by these Terms of Use, the Privacy Policy, and all applicable laws and regulations of the Kingdom of Bhutan. If you do not agree with any of these terms, you must discontinue use of the portal immediately.",
      },
      {
        heading: "2. Eligibility and Account Responsibility",
        body: "Users must provide accurate, current, and complete information when creating an account or submitting applications. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Notify us immediately of any unauthorised use or security breach.",
      },
      {
        heading: "3. Acceptable Use",
        body: "You agree not to misuse the portal, including but not limited to: submitting false, misleading, or fraudulent information; impersonating another person or institution; uploading malicious software or attempting to gain unauthorised access; interfering with normal operation of the portal; or using automated tools to extract data without authorisation.",
      },
      {
        heading: "4. Fees and Payments",
        body: "Certain services, such as course applications, registration, and renewals, may require payment of prescribed fees. All fees are non-refundable unless explicitly stated. Payments are processed through secure gateways approved by the Royal Government of Bhutan. The Ministry reserves the right to revise fees with appropriate notice.",
      },
      {
        heading: "5. Intellectual Property",
        body: "All content on the portal — including text, logos, graphics, course materials, the Bhutan National Competency Standards (NCS), approved curricula, and software — is the property of the Royal Government of Bhutan or its licensors and is protected by applicable copyright and intellectual property laws. Content may be downloaded for personal, non-commercial use only.",
      },
      {
        heading: "6. Certificates and Records",
        body: "Certificates and qualifications issued through the TVET MIS are official government records. Any attempt to forge, alter, or misuse these documents constitutes a criminal offence under Bhutanese law and will result in revocation of the certificate and appropriate legal action.",
      },
      {
        heading: "7. Limitation of Liability",
        body: "The portal is provided on an \"as is\" and \"as available\" basis. While we strive for accuracy and availability, the Ministry does not warrant that the service will be uninterrupted or error-free and shall not be liable for any indirect, incidental, or consequential damages arising from use of the portal.",
      },
      {
        heading: "8. Suspension and Termination",
        body: "We reserve the right to suspend or terminate access to the portal, without notice, for any user found to be in violation of these terms or engaged in conduct that compromises the integrity of the system.",
      },
      {
        heading: "9. Governing Law",
        body: "These Terms of Use are governed by the laws of the Kingdom of Bhutan. Any disputes arising from the use of this portal shall be subject to the exclusive jurisdiction of the courts of Bhutan.",
      },
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    icon: <AccessibilityNewIcon />,
    sections: [
      {
        heading: "1. Our Commitment",
        body: "The Ministry of Education and Skills Development is committed to ensuring that the TVET MIS portal is accessible to all citizens of Bhutan, including persons with disabilities, in line with the Royal Government's commitment to inclusive public services.",
      },
      {
        heading: "2. Standards We Follow",
        body: "This portal aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, published by the World Wide Web Consortium (W3C). These guidelines explain how to make web content more accessible to people with a wide range of disabilities including visual, hearing, motor, and cognitive impairments.",
      },
      {
        heading: "3. Accessibility Features",
        body: "Our portal includes: full keyboard navigation for all interactive elements; semantic HTML and ARIA labels for screen reader compatibility; descriptive alternative text for images; sufficient colour contrast between text and background; resizable text without loss of functionality; clear focus indicators on interactive elements; consistent navigation and predictable page structure; and form labels and error messages designed for assistive technologies.",
      },
      {
        heading: "4. Compatible Assistive Technologies",
        body: "The portal has been tested with commonly used screen readers including NVDA and JAWS on Windows, VoiceOver on macOS and iOS, and TalkBack on Android. It is designed to work with the latest versions of Chrome, Firefox, Edge, and Safari.",
      },
      {
        heading: "5. Known Limitations",
        body: "Despite our best efforts, some content — particularly older PDF documents and third-party embedded materials — may not yet be fully accessible. We are actively working to remediate these areas and welcome reports from users who encounter barriers.",
      },
      {
        heading: "6. Feedback and Assistance",
        body: "We welcome your feedback on the accessibility of the TVET MIS portal. If you encounter barriers, need information in an alternative format, or require assistance using any feature, please contact us at tvet@moesc.gov.bt or +975-2-334155. We aim to respond to accessibility requests within five working days.",
      },
      {
        heading: "7. Continuous Improvement",
        body: "Accessibility is an ongoing commitment. We regularly audit the portal, train our developers on accessible design, and incorporate user feedback into future releases to ensure that the TVET MIS remains usable by everyone.",
      },
    ],
  },
};

// ── Legal modal
const LegalDialog = ({ open, onClose, content }) => {
  if (!content) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper"
      PaperProps={{ sx: { borderRadius: 2.5, maxHeight: "85vh" } }}>
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${PD} 0%, ${P} 100%)`,
        color: W, py: 2, px: 3,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {content.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
              {content.title}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.75)" }}>
              TVET MIS · Ministry of Education and Skills Development
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: W }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2.5, md: 3.5 }, bgcolor: "#fafcff" }}>
        <Typography sx={{
          fontSize: "0.72rem", color: "text.secondary",
          fontStyle: "italic", mb: 2.5
        }}>
          Last updated: {new Date().toLocaleDateString("en-GB",
            { year: "numeric", month: "long", day: "numeric" })}
        </Typography>

        {content.sections.map((sec, i) => (
          <Box key={i} sx={{ mb: 2.5 }}>
            <Typography sx={{
              fontWeight: 700, fontSize: "0.88rem",
              color: "#0a1929", mb: 0.8,
              borderLeft: `3px solid ${P}`, pl: 1.2,
            }}>
              {sec.heading}
            </Typography>
            <Typography sx={{
              fontSize: "0.82rem", lineHeight: 1.75,
              color: "text.secondary", textAlign: "justify",
            }}>
              {sec.body}
            </Typography>
          </Box>
        ))}

        <Box sx={{
          mt: 3, p: 2, borderRadius: 2,
          bgcolor: "#e8f1fb",
          border: "1px solid #c8d8ee",
        }}>
          <Typography sx={{ fontSize: "0.78rem", color: "#0a2d6e", fontWeight: 600 }}>
            Questions or concerns? Contact us at{" "}
            <Link href="mailto:tvet@moesc.gov.bt" sx={{ color: P, fontWeight: 700 }}>
              tvet@moesc.gov.bt
            </Link>{" "}
            or call +975-2-334155.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: "#f2f5fa" }}>
        <Button onClick={onClose} variant="contained"
          sx={{
            bgcolor: P, textTransform: "none", fontWeight: 700,
            borderRadius: 1.5, px: 3,
            "&:hover": { bgcolor: "#0d47a1" },
          }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Footer = () => {
  const [legalKey, setLegalKey] = useState(null);
  const openLegal = key => setLegalKey(key);
  const closeLegal = () => setLegalKey(null);

  return (
    <Box component="footer" sx={{ bgcolor: PD, color: TXT, position: "relative" }}>

      {/* ── Top accent bar (gradient) ───────────────────────────────── */}
      <Box sx={{
        height: 3,
        background: `linear-gradient(90deg, ${P} 0%, ${TEAL} 50%, ${P} 100%)`,
      }} />

      {/* ── Main footer grid ────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 5 } }}>
        <Grid container spacing={4}>

          {/* Col 1 — Brand */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 2 }}>
              <Box sx={{
                width: 52, height: 52, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                //bgcolor: "rgba(255,255,255,0.06)",
                //border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 2, p: 0.6,
              }}>
                <Box component="img" src={govtLogo} alt="Royal Government of Bhutan"
                  sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </Box>
              <Box>
                <Typography sx={{ color: W, fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.1 }}>
                  TVET MIS
                </Typography>
                <Typography sx={{ color: TXT_D, fontSize: "0.66rem", letterSpacing: 0.3 }}>
                  Ministry of Education &amp; Skills Development
                </Typography>
              </Box>
            </Stack>

            <Typography sx={{ fontSize: "0.78rem", lineHeight: 1.8, mb: 2.5, color: TXT, textAlign: "justify" }}>
              The official TVET Management Information System of the Royal
              Government of Bhutan — empowering training registration, certification
              tracking and skills development across all 20 Dzongkhags.
            </Typography>

            {/* Trust badges */}
            <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 0.6,
                px: 1.2, py: 0.6, borderRadius: 1.2,
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <VerifiedUserIcon sx={{ fontSize: 13, color: TEAL }} />
                <Typography sx={{ color: TXT, fontSize: "0.66rem", fontWeight: 600 }}>
                  Govt. Verified
                </Typography>
              </Box>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 0.6,
                px: 1.2, py: 0.6, borderRadius: 1.2,
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4caf50" }} />
                <Typography sx={{ color: TXT, fontSize: "0.66rem", fontWeight: 600 }}>
                  System Online
                </Typography>
              </Box>
            </Stack>

            {/* Social — centered */}
            <Box sx={{ textAlign: "left", mt: 1 }}>
              <Typography sx={{
                color: TXT_DD, fontSize: "0.68rem", fontWeight: 700,
                letterSpacing: 0.8, textTransform: "uppercase", mb: 1.2
              }}>
                Follow Us
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="left">
                {[
                  { Icon: FacebookIcon, label: "Facebook", target: "_blank", href: "https://www.facebook.com/BQPCA" },
                  { Icon: XIcon, label: "X", href: "#" },
                  { Icon: LinkedInIcon, label: "LinkedIn", href: "#" },
                  { Icon: InstagramIcon, label: "Instagram", href: "#" },
                  { Icon: YouTubeIcon, label: "YouTube", href: "#" },
                ].map(({ Icon, label, href }, i) => (
                  <IconButton key={i} href={href} target="_blank" rel="noreferrer"
                    size="small" aria-label={label}
                    sx={{
                      width: 32, height: 32, borderRadius: 1.2,
                      bgcolor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: TXT,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: P, color: W, borderColor: P,
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${P}55`,
                      },
                    }}>
                    <Icon sx={{ fontSize: 15 }} />
                  </IconButton>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Col 2 — Quick Links */}
          <Grid size={{ xs: 12, md: 3 }}>
            <FooterHeading>Quick Links</FooterHeading>
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/result/assessment-result">Assessment Result</FooterLink>
            <FooterLink href="/birms/payment-index">Online Payment</FooterLink>
            <FooterLink href="https://www.blmis.gov.bt/tvet/ncs">NCS Standards</FooterLink>
            <FooterLink href="https://www.blmis.gov.bt/tvet/curriculum">Curriculum</FooterLink>
            <FooterLink href="#">Downloads</FooterLink>
          </Grid>

          {/* Col 3 — Contact Us */}
          <Grid size={{ xs: 12, md: 5 }}>
            <FooterHeading>Contact Us</FooterHeading>

            <ContactItem
              icon={<LocationOnIcon sx={{ fontSize: 15 }} />}
              text="Kawajangsa, Thimphu, Bhutan · P.O. Box: 1143"
              color={PL}
            />
            <ContactItem
              icon={<PhoneIcon sx={{ fontSize: 15 }} />}
              text="+975-2-334155 / 334156"
              color={TEAL}
            />
            <ContactItem
              icon={<FaxIcon sx={{ fontSize: 15 }} />}
              text="+975-2-323085"
              color="#9c27b0"
            />
            <ContactItem
              icon={<EmailIcon sx={{ fontSize: 15 }} />}
              text="tvet@moesc.gov.bt"
              color="#ff7043"
            />

            {/* Working hours card */}
            <Box sx={{
              mt: 2, p: 1, borderRadius: 2,
              background: "linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(38,198,218,0.08) 100%)",
              border: "1px solid rgba(66,165,245,0.18)",
            }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box sx={{
                  width: 32, height: 32, borderRadius: "50%",
                  bgcolor: `${TEAL}25`, border: `1px solid ${TEAL}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <AccessTimeIcon sx={{ color: TEAL, fontSize: 16 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{
                    color: TEAL, fontSize: "0.66rem",
                    letterSpacing: 0.8, fontWeight: 700, textTransform: "uppercase"
                  }}>
                    Working Hours
                  </Typography>
                  <Typography sx={{ color: W, fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.4 }}>
                    Mon – Fri · 9:00 AM – 5:00 PM
                  </Typography>
                  <Typography sx={{ color: TXT_D, fontSize: "0.71rem" }}>
                    Weekends &amp; Public Holidays: Closed
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Bottom bar ──────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: PDX, px: { xs: 2, md: 6 }, py: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between"
          alignItems="center" spacing={1.5}>
          <Typography sx={{
            fontSize: "0.72rem", color: TXT_DD,
            textAlign: { xs: "center", sm: "left" }
          }}>
            © {new Date().getFullYear()} <Box component="span" sx={{ color: TXT, fontWeight: 600 }}>
              Ministry of Education and Skills Development
            </Box>, Royal Government of Bhutan. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={2.5} divider={
            <Box sx={{ width: "1px", bgcolor: "rgba(255,255,255,0.1)" }} />
          }>
            {[
              { label: "Privacy Policy", key: "privacy" },
              { label: "Terms of Use", key: "terms" },
              { label: "Accessibility", key: "accessibility" },
            ].map(l => (
              <Link
                key={l.key}
                component="button"
                onClick={() => openLegal(l.key)}
                underline="none"
                sx={{
                  fontSize: "0.72rem", color: TXT_D, fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "inherit", p: 0,
                  transition: "color 0.2s",
                  "&:hover": { color: W },
                }}>
                {l.label}
              </Link>
            ))}
          </Stack>
        </Stack>

        {/* Developer credit — subtle */}
        <Box sx={{
          textAlign: "center", mt: 1.2,
          pt: 1.2, borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "none"
        }}>
          <Typography sx={{
            fontSize: "0.66rem", color: "rgba(255,255,255,0.22)",
            letterSpacing: 0.3
          }}>
            Developed by{" "}
            <Link href="https://sonaxit.com/" target="_blank" rel="noreferrer"
              underline="none"
              sx={{
                color: "rgba(255,255,255,0.35)", fontWeight: 600,
                transition: "color 0.2s",
                "&:hover": { color: TEAL },
              }}>
              Sonax IT Consultancy
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* ── Legal modal ───────────────────────────────────────────── */}
      <LegalDialog
        open={legalKey !== null}
        onClose={closeLegal}
        content={legalKey ? LEGAL_CONTENT[legalKey] : null}
      />
    </Box>
  );
};

export default Footer;