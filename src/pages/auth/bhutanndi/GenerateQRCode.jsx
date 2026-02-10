import React from 'react';
import { Card, CardContent, Typography, Box, Button, Stack, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QRNDIlogo from '../../../assets/images/QRNDIlogo.svg';
import RingingPhoneOutlineIcon from '../../../assets/images/Call.png';
import MailIcon from '../../../assets/images/Mail.png';
import slide1 from '../../../assets/slider/slide1.jpg';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const GenerateQRCode = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:768px)');

  const handleClose = () => navigate('/'); // navigate back to home/public page

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        padding: 3,
        backgroundImage: `url(${slide1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 1,
        },
      }}
    >
      <Card
        sx={{
          width: isMobile ? '90%' : 500,
          maxHeight: '90vh',
          margin: 'auto',
          textAlign: 'center',
          boxShadow: 3,
          padding: 3,
          borderRadius: 2,
          backgroundColor: '#F8F8F8',
          fontFamily: 'Inter',
          color: '#A1A0A0',
          overflowY: 'auto',
          zIndex: 2,
          position: 'relative',
        }}
      >
        {/* Close Icon */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#333',
          }}
        >
          <CloseIcon />
        </IconButton>

        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
          {/* Title */}
           <Typography variant="h4" fontWeight="bold" mb={1}>
              Scan with <span style={{ color: '#5AC994' }}>Bhutan NDI </span>Wallet
            </Typography>

          {/* QR Code */}
          <Box
            sx={{
              width: 220,
              height: 220,
              margin: 'auto',
              marginBottom: 1,
              backgroundColor: '#FFFFFF',
              padding: 2,
              border: '3px solid #5AC994',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <img
              src={QRNDIlogo}
              alt="Bhutan NDI Logo"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'white',
              }}
            />
          </Box>

          {/* Instructions */}
          <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
            1. Open Bhutan NDI Wallet on your Phone <br />
            2. Tap the Scan button and scan the QR code
          </Typography>

          {/* Watch Video Guide Button */}
          <Button
            variant="outlined"
            sx={{
              border: '2px solid #5AC994',
              color: '#5AC994',
              borderRadius: '30px',
              margin: '0 auto',
              width: '180px',
            }}
          >
            Watch Video Guide
          </Button>

          {/* Support Section */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography fontWeight="bold" sx={{ color: '#5AC994', mb: 1 }}>
              Get Support
            </Typography>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
              <Stack direction="row" alignItems="center">
                <img src={MailIcon} alt="Mail" style={{ width: '16px', height: '12px' }} />
                <Typography variant="body2" sx={{ color: 'black', ml: 0.5 }}>
                  ndifeedback@dhi.bt
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center">
                <img src={RingingPhoneOutlineIcon} alt="Phone" style={{ width: '18px', height: '18px' }} />
                <Typography variant="body2" sx={{ color: 'black', ml: 0.5 }}>
                  1199
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GenerateQRCode;
