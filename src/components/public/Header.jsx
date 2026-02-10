import React from 'react';
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
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { Login as LoginIcon, Home as HomeIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Mobile menu anchor
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const formik = useFormik({
    initialValues: { user_id: '', password: '' },
    onSubmit: () => navigate('/login'),
  });

  const navItems = [
    { label: 'Vacancies & Trainings', path: '/vancies-training' },
    { label: 'Career Information', path: '/career-info' },
    { label: 'Tutorials', path: '/tutorials' },
    { label: 'Feedback/Complaint', path: '/feedback' },
  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: '#283593', height: { xs: 70, sm: 80 } }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Mobile: Menu icon triggers dropdown */}
          {isMobile ? (
            <IconButton color="inherit" onClick={handleMenuOpen} sx={{ mr: 1 }}>
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>
          ) : (
            <IconButton onClick={() => navigate('/')} sx={{ color: '#fff', mr: 1 }}>
              <HomeIcon sx={{ fontSize: 24 }} />
            </IconButton>
          )}
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: '#fff',
              fontSize: { xs: '0.85rem', sm: '1rem' },
            }}
          >
            TVET Management Information System (TVET-MIS)
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Login Button */}
        <form onSubmit={formik.handleSubmit} style={{ margin: 0 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              padding: { xs: '2px 8px', sm: '4px 12px' },
              fontWeight: 'bold',
              textTransform: 'none',
              backgroundColor: '#1e88e6',
              '&:hover': {
                backgroundColor: '#1565c0',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
              },
            }}
            startIcon={<LoginIcon />}
          >
            {isMobile ? '' : 'Login'}
          </Button>
        </form>

        {/* Mobile Dropdown Menu */}
        {isMobile && (
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            TransitionComponent={Fade}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                bgcolor: '#f9f9f9',
                py: 1,
                overflow: 'visible',
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 20, // adjust to align with icon
                  width: 12,
                  height: 12,
                  bgcolor: '#f9f9f9',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  boxShadow: '-1px -1px 1px rgba(0,0,0,0.05)',
                },
              },
            }}
          >
            {navItems.map((item, index) => (
              <React.Fragment key={item.path}>
                <MenuItem
                  onClick={() => {
                    navigate(item.path);
                    handleMenuClose();
                  }}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 1,
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {item.label}
                </MenuItem>
                {index < navItems.length - 1 && <Divider sx={{ my: 0.5 }} />}
              </React.Fragment>
            ))}
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
