import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Fade,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Login as LoginIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // --- FIXED: Use md breakpoint for responsiveness ---
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  // Mobile menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Mobile collapse menus
  const [mobileProposalOpen, setMobileProposalOpen] = React.useState(false);
  const [mobileRegisterOpen, setMobileRegisterOpen] = React.useState(false);
  const [mobileRenewalOpen, setMobileRenewalOpen] = React.useState(false);
  const [mobileReportsOpen, setMobileReportsOpen] = React.useState(false);

  // Desktop dropdowns
  const [registerAnchorEl, setRegisterAnchorEl] = React.useState(null);
  const [renewalAnchorEl, setRenewalAnchorEl] = React.useState(null);
  const [reportsAnchorEl, setReportsAnchorEl] = React.useState(null);
  const [proposalAnchorEl, setProposalAnchorEl] = React.useState(null);

  const proposalOpen = Boolean(proposalAnchorEl);
  const registerOpen = Boolean(registerAnchorEl);
  const renewalOpen = Boolean(renewalAnchorEl);
  const reportsOpen = Boolean(reportsAnchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileProposalOpen(false);
    setMobileRegisterOpen(false);
    setMobileRenewalOpen(false);
    setMobileReportsOpen(false);
  };
  const handleProposalOpen = (event) =>
    setProposalAnchorEl(event.currentTarget);
  const handleProposalClose = () => setProposalAnchorEl(null);

  const handleRegisterOpen = (event) =>
    setRegisterAnchorEl(event.currentTarget);

  const handleRegisterClose = () => setRegisterAnchorEl(null);
  const handleRenewalOpen = (event) => setRenewalAnchorEl(event.currentTarget);
  const handleRenewalClose = () => setRenewalAnchorEl(null);
  const handleReportsOpen = (event) => setReportsAnchorEl(event.currentTarget);
  const handleReportsClose = () => setReportsAnchorEl(null);

  const formik = useFormik({
    initialValues: { user_id: "", password: "" },
    onSubmit: () => navigate("/auth/login"),
  });

  const navItems = [
    { label: "Assessment Result", path: "/result/assessment-result" },
    { label: "Feedback & Complaint", path: "/feedback" },
  ];

  const proposalItems = [
    { label: "Institute Proposal", path: "/proposal/institute/6" },
    { label: "SES Centre Proposal", path: "/proposal/ses-centre/34" },
    { label: "Assessment Centre Proposal", path: "/proposal/assessment-center/35" },
  ];

  const registerItems = [

    { label: "Institute Registration", path: "/register/institute/7" },
    { label: "SES Centre Registration", path: "/register/ses-centre/36" },
    { label: "Assessment Centre Registration", path: "/register/assessment-centre/4" },

    { label: "Assessor Registration", path: "/registration/assessor/32" },
    { label: "Accreditor Registration", path: "/registration/accreditor/5" },
    { label: "Quality Auditor Registration", path: "/registration/qms-auditor/3" },
   
  ];

  const renewalItems = [
    { label: "Assessor", path: "/renewal/assessor" },
    { label: "Accreditor", path: "/renewal/accreditor" },
    { label: "Quality Auditor Registration", path: "/renewal/qms-auditor" },
  ];

  const reports = [
    { label: "Assessor", path: "/reports/assessor" },
    { label: "Institute", path: "/reports/institute" },
    { label: "Accreditor", path: "/reports/accreditor" },
    { label: "Assessment Centre Accreditation", path: "/reports/assessment-centre" },
    { label: "Trainer", path: "/reports/trainer" },
    { label: "QMS Auditor", path: "/reports/qms-auditor" },
    { label: "Courses Accredited", path: "/reports/courses-accredited" },
  ];

  const renderMenuItems = (items, closeFn) =>
    items.flatMap((item, index) => [
      <MenuItem
        key={item.path}
        onClick={() => {
          navigate(item.path);
          closeFn();
        }}
        sx={{
          py: 0.4,
          px: 1.75,
          minHeight: "auto",
          fontSize: "0.88rem",
        }}
      >
        {item.label}
      </MenuItem>,
      index < items.length - 1 && (
        <Divider key={`${item.path}-divider`} sx={{ my: 0.25 }} />
      ),
    ]);

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "#283593", height: { xs: 60, sm: 70, md: 70 } }} // minor height fix
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left side */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {isMobile ? (
            <IconButton color="inherit" onClick={handleMenuOpen} sx={{ mr: 1 }}>
              <MenuIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              onClick={() => navigate("/")}
              sx={{ color: "#fff", mr: 2 }}
            >
              <HomeIcon
                sx={{
                  fontSize: { xs: 24, sm: 30 },
                }}
              />
            </IconButton>
          )}

          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "0.85rem", sm: "1rem" },
            }}
          >
            TVET Management Information System (TVET-MIS)
          </Typography>
        </Box>

        {/* Desktop Nav */}
        {!isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* proposal */}
            <Box>
              <Button
                onClick={handleProposalOpen}
                endIcon={<ExpandMore sx={{ color: "#fff" }} />}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  position: "relative",
                  "&:hover::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "1px",
                    bgcolor: "#fff",
                  },
                }}
              >
                Proposal
              </Button>
              <Menu
                anchorEl={proposalAnchorEl}
                open={proposalOpen}
                onClose={handleProposalClose}
                slots={{ transition: Fade }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      p: 0,
                      borderRadius: 1.5,
                      overflow: "visible",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 24,
                        width: 10,
                        height: 10,
                        bgcolor: "#fff",
                        transform: "translateY(-50%) rotate(45deg)",
                      },
                    },
                  },
                }}
              >
                {renderMenuItems(proposalItems, handleProposalClose)}
              </Menu>
            </Box>
            {/* Registration */}
            <Box>
              <Button
                onClick={handleRegisterOpen}
                endIcon={<ExpandMore sx={{ color: "#fff" }} />}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  position: "relative",
                  "&:hover::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "1px",
                    bgcolor: "#fff",
                  },
                }}
              >
                Registration
              </Button>
              <Menu
                anchorEl={registerAnchorEl}
                open={registerOpen}
                onClose={handleRegisterClose}
                slots={{ transition: Fade }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      p: 0,
                      borderRadius: 1.5,
                      overflow: "visible",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 24,
                        width: 10,
                        height: 10,
                        bgcolor: "#fff",
                        transform: "translateY(-50%) rotate(45deg)",
                      },
                    },
                  },
                }}
              >
                {renderMenuItems(registerItems, handleRegisterClose)}
              </Menu>
            </Box>

            <Box>
              <Button
                onClick={handleRenewalOpen}
                endIcon={<ExpandMore sx={{ color: "#fff" }} />}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  position: "relative",
                  "&:hover::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "1px",
                    bgcolor: "#fff",
                  },
                }}
              >
                Renewal
              </Button>
              <Menu
                anchorEl={renewalAnchorEl}
                open={renewalOpen}
                onClose={handleRenewalClose}
                slots={{ transition: Fade }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      p: 0,
                      borderRadius: 1.5,
                      overflow: "visible",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 24,
                        width: 10,
                        height: 10,
                        bgcolor: "#fff",
                        transform: "translateY(-50%) rotate(45deg)",
                      },
                    },
                  },
                }}
              >
                {renderMenuItems(renewalItems, handleRenewalClose)}
              </Menu>
            </Box>

            <Box>
              <Button
                onClick={handleReportsOpen}
                endIcon={<ExpandMore sx={{ color: "#fff" }} />}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  position: "relative",
                  "&:hover::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "1px",
                    bgcolor: "#fff",
                  },
                }}
              >
                Reports
              </Button>
              <Menu
                anchorEl={reportsAnchorEl}
                open={reportsOpen}
                onClose={handleReportsClose}
                slots={{ transition: Fade }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      p: 0,
                      borderRadius: 1.5,
                      overflow: "visible",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 24,
                        width: 10,
                        height: 10,
                        bgcolor: "#fff",
                        transform: "translateY(-50%) rotate(45deg)",
                      },
                    },
                  },
                }}
              >
                {renderMenuItems(reports, handleReportsClose)}
              </Menu>
            </Box>
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  position: "relative",
                  "&:hover::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "1px",
                    bgcolor: "#fff",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Login */}
        <form onSubmit={formik.handleSubmit} style={{ margin: 0 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<LoginIcon />}
            sx={{
              padding: { xs: "2px 8px", sm: "2px 12px" },
              fontWeight: "bold",
              textTransform: "none",
              backgroundColor: "#1e88e6",
              "&:hover": {
                backgroundColor: "#1565c0",
                boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
              },
            }}
          >
            {isMobile ? "" : "Login"}
          </Button>
        </form>

        {/* Mobile Menu */}
        {isMobile && (
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            slotProps={{
              paper: {
                sx: { minWidth: 240, p: 0, borderRadius: 1.5 },
              },
            }}
          >
            {/* Navigation */}
            {navItems.flatMap((item, index) => [
              <MenuItem
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  handleMenuClose();
                }}
                sx={{ py: 0.4, px: 1.75, minHeight: "auto" }}
              >
                {item.label}
              </MenuItem>,
              index < navItems.length - 1 && (
                <Divider key={`${item.path}-divider`} sx={{ my: 0.25 }} />
              ),
            ])}

            <Divider sx={{ my: 0.25 }} />

            {/* Collapsible sections */}
            {[
              {
                label: "Proposal",
                open: mobileProposalOpen,
                setOpen: setMobileProposalOpen,
                items: proposalItems,
              },
              {
                label: "Registration",
                open: mobileRegisterOpen,
                setOpen: setMobileRegisterOpen,
                items: registerItems,
              },
              {
                label: "Renewal",
                open: mobileRenewalOpen,
                setOpen: setMobileRenewalOpen,
                items: renewalItems,
              },
              {
                label: "Reports",
                open: mobileReportsOpen,
                setOpen: setMobileReportsOpen,
                items: reports,
              },
            ].map(({ label, open, setOpen, items }) => (
              <Box key={label}>
                <MenuItem
                  onClick={() => setOpen(!open)}
                  sx={{ py: 0.4, px: 1.75, minHeight: "auto" }}
                >
                  {label} {open ? <ExpandLess /> : <ExpandMore />}
                </MenuItem>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  {items.flatMap((item, index) => [
                    <MenuItem
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        handleMenuClose();
                      }}
                      sx={{
                        py: 0.35,
                        px: 3,
                        minHeight: "auto",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.label}
                    </MenuItem>,
                    index < items.length - 1 && (
                      <Divider key={`${item.path}-divider`} sx={{ my: 0.25 }} />
                    ),
                  ])}
                </Collapse>
                <Divider sx={{ my: 0.25 }} />
              </Box>
            ))}
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
