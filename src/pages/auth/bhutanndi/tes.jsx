import React, { useEffect, useState } from 'react';
import { Card, CardContent, Stack, Typography, Box, Button, IconButton } from '@mui/material';
import { PuffLoader } from 'react-spinners';
import { QRCodeCanvas } from 'qrcode.react';
import BhutanNDIService from '../../Services/BhutanNDIService';
import Cookies from 'universal-cookie';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { connect, StringCodec, nkeyAuthenticator } from 'nats.ws';
import AuthenticationService from 'Services/AuthenticationService';
import { toast } from 'react-toastify';
import jwtDecode from 'jwt-decode';
import QRNDIlogo from '../../assets/images/QRNDIlogo.svg';
import RingingPhoneOutlineIcon from '../../assets/images/Call.png';
import MailIcon from '../../assets/images/Mail.png';

//stagging NDI NATS server endpoints 
//const NATS_URL = 'wss://natsdemoclient.bhutanndi.com';
//const SEED = new TextEncoder().encode('SUAPXY7TJFUFE3IX3OEMSLE3JFZJ3FZZRSRSOGSG2ANDIFN77O2MIBHWUM');

//production NDI NATS server endpoints 
const NATS_URL = 'wss://natsg2c-client.bhutanndi.com';
const SEED = new TextEncoder().encode('SUAOCNCDWVZGDKIT63PAJVGCK5O6GMBMEJG3S52LZZILDNP4LTVPNN5FPE');

const Loader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 200
    }}
  >
    <PuffLoader color="rgb(70, 180, 128)" size={60} />
  </Box>
);

const ErrorMessage = ({ message }) => <Typography color="error">{message}</Typography>;

const QRCodeDisplay = ({ value }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: 220,
      height: 220,
      margin: 'auto',
      marginBottom: 1,
      backgroundColor: '#FFFFFF',
      padding: 10,
      border: '3px solid #5AC994',
      borderRadius: '10px'
    }}
  >
    <Box
      sx={{
        position: 'relative',
        width: 200,
        height: 200
      }}
    >
      <QRCodeCanvas value={value} size={200} style={{ display: 'block' }} />
      <img
        src={QRNDIlogo}
        alt="Bhutan NDI Logo"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'white'
        }}
      />
    </Box>
  </Box>
);

const BhutanNDIQRCodeLogin = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [deepLinkUrl, setDeepLinkUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cookies = new Cookies();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:1366px)');

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await BhutanNDIService.createProofRequest(cookies.get('token'));
        if (response.data?.data?.proofRequestURL) {
          setQrCodeUrl(response.data.data.proofRequestURL);
        } else {
          throw new Error('Invalid response structure');
        }
        if (response.data?.data?.proofRequestThreadId) {
          const threadId = response.data.data.proofRequestThreadId;
          connectToNats(threadId);
        }
        if (response.data?.data?.deepLinkURL) {
          setDeepLinkUrl(response.data.data.deepLinkURL);
        }
      } catch (err) {
        console.error('Error fetching QR Code:', err);
        setError('Failed to fetch QR Code. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, []);

  const handleOpenDeepLink = async () => {
    if (deepLinkUrl) {
      window.location.href = deepLinkUrl;
    } else {
      alert('No URL provided!');
    }
  };

  const connectToNats = async (threadId) => {
    try {
      const sc = StringCodec();
      const nc = await connect({
        servers: NATS_URL,
        authenticator: nkeyAuthenticator(SEED)
      });
      console.log('Connected to NATS!');
      console.log('ThreadId', threadId);
      if (threadId) {
        const subscription = nc.subscribe(threadId);
        for await (const msg of subscription) {
          const data = JSON.parse(sc.decode(msg.data));
          if (data) {
            const authResponse = await BhutanNDIService.bhutanNDIAuthResponse(data);
            if (authResponse.status === 200) {
              await handleSuccessfulLogin(authResponse);
            } else {
              toast.error(authResponse.response.data);
            }
          }
        }
      } else {
        setError('Invalid thread ID');
      }
    } catch (err) {
      console.error('Error connecting to NATS:', err);
      setError(err.message);
    }
  };

  const handleSuccessfulLogin = async (authResponse) => {
    cookies.set('token', authResponse.data.access_token, { path: '/', sameSite: 'strict' });
    cookies.set('refreshToken', authResponse.data.refresh_token, { path: '/', sameSite: 'strict' });
    const tokenDecoded = jwtDecode(authResponse.data.access_token);
    const role = tokenDecoded.roles || [];
    cookies.set('role', role, { path: '/', sameSite: 'strict' });
    cookies.set('user', tokenDecoded.sub);
    cookies.set('refreshSession', false);
    cookies.set('switchRefreshSession', true);
    if (role.length === 1) {
      await fetchUserDetails(role[0]);
    } else {
      await handleMultipleRoles();
    }
    window.location.reload(true);
  };

  const fetchUserDetails = async (currentRole) => {
    cookies.set('current_role', currentRole);
    const data = { role: currentRole };
    const response = await AuthenticationService.fetchSideMenu(data, cookies.get('token'));
    const privilegesResponse = await AuthenticationService.fetchUserPrivileges(data, cookies.get('token'));
    const userDetails = await AuthenticationService.fetchUserDetails(
      { userId: cookies.get('user'), role: currentRole },
      cookies.get('token')
    );
    cookies.set('userId', userDetails.data.userId, { path: '/', sameSite: 'strict' });
    cookies.set('locationId', userDetails.data.locationId);
    cookies.set('roleId', userDetails.data.roleId, { path: '/', sameSite: 'strict' });
    cookies.set('menu', response.data, { path: '/', sameSite: 'strict' });
    cookies.set('privileges', privilegesResponse.data, { path: '/', sameSite: 'strict' });

    navigate('/dashboard');
  };

  const handleMultipleRoles = async () => {
    const data = { userId: cookies.get('user') };
    const preResponse = await AuthenticationService.fetchPreviousLogInRole(data, cookies.get('token'));

    if (preResponse.data.previousRole) {
      await fetchUserDetails(preResponse.data.roleName);
    } else {
      navigate('/SelectRole');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.5)', // Optional: adds a semi-transparent overlay
        overflowY: 'auto', // Enable scrolling for the overlay
        padding: 2 // Add some padding
      }}
    >
      <Card
        sx={{
          width: 500,
          maxHeight: '90vh', // Limit card height to viewport
          margin: 'auto',
          textAlign: 'center',
          boxShadow: 3,
          padding: 3,
          borderRadius: 2,
          position: 'relative',
          backgroundColor: '#F8F8F8',
          fontFamily: 'Inter',
          color: '#A1A0A0',
          overflowY: 'auto' // Enable scrolling inside card if needed
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 3,
            right: 10,
            color: '#333'
          }}
        >
          <CloseIcon />
        </IconButton>

        <CardContent
          sx={{
            paddingBottom: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {isMobile ? (
            <>
              <Typography variant="h2" fontWeight="bold" mb={1}>
                Login with <span style={{ color: '#5AC994' }}>Bhutan NDI</span> Wallet
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenDeepLink}
                sx={{
                  bgcolor: '#5AC994',
                  color: '#fff',
                  '&:hover': { bgcolor: '#4CAF89' },
                  width: '100%',
                  maxWidth: '290px',
                  margin: '0 auto'
                }}
              >
                Open Bhutan NDI Wallet
              </Button>
              <Typography
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  my: 1
                }}
              >
                <Box sx={{ flex: 1, borderBottom: '1px solid #ccc', mr: 1 }} />
                OR
                <Box sx={{ flex: 1, borderBottom: '1px solid #ccc', ml: 1 }} />
              </Typography>
            </>
          ) : (
            <Typography variant="h2" fontWeight="bold" mb={1}>
              Scan with <span style={{ color: '#5AC994' }}>Bhutan NDI </span>Wallet
            </Typography>
          )}

          {loading ? <Loader /> : error ? <ErrorMessage message={error} /> : <QRCodeDisplay value={qrCodeUrl} />}

          <Typography
            component="div" // Add this to render as div instead of p
            variant="body2"
            sx={{
              lineHeight: 1.8,
              color: '#666666',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                textAlign: 'left',
                width: '100%',
                maxWidth: '300px',
                marginLeft: '35px'
              }}
            >
              1. Open Bhutan NDI Wallet on your Phone <br />
              2. Tap the Scan button{' '}
              <img
                src="/UI_Scanicon.png"
                alt="Scan icon"
                style={{
                  width: '25px',
                  height: 'auto',
                  verticalAlign: 'middle',
                  marginTop: '3px',
                  paddingRight: 2
                }}
              />
              located on the
              <br />
              <span style={{ paddingLeft: '18px' }}>menu bar and scan the QR code</span>
            </Box>
          </Typography>
          <Button
            variant="outlined"
            endIcon={
              <svg width="20" height="20" viewBox="0 0 69 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="34.5" cy="35" r="32.5833" fill="#5AC994" stroke="#5AC994" strokeWidth="3.83333" />
                <path d="M53.6548 35.0075L22.0298 51.6063L22.0298 18.4087L53.6548 35.0075Z" fill="white" />
              </svg>
            }
            sx={{
              border: '2px solid #5AC994',
              backgroundColor: 'transparent',
              fontWeight: 'bold',
              width: '180px',
              height: '37px',
              fontSize: '12px',
              color: '#5AC994',
              borderRadius: '30px',
              margin: '0 auto',
              marginTop: 1,
              '&:hover': {
                border: '2px solid #4CAF89'
              }
            }}
            onClick={() => window.open('https://www.youtube.com/watch?v=A_k79pml9k8', '_blank')}
          >
            Watch Video Guide
          </Button>

          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {' '}
            {/* Container for both elements */}
            <Typography
              sx={{
                mt: 1,
                textAlign: 'center',
                mb: 1 // 10px margin bottom (1.25 * 8px = 10px in MUI spacing)
              }}
            >
              Don&apos;t have the Bhutan NDI Wallet?
              <span style={{ color: '#5AC994', fontWeight: 'bold', display: isMobile ? 'block' : 'inline' }}> Download Now!</span>
            </Typography>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={1}
              sx={{
                '& img': {
                  objectFit: 'contain'
                }
              }}
            >
              <a href="https://play.google.com/store/search?q=bhutan%20ndi&c=apps&hl=en_IN&gl=US" target="_blank" rel="noopener noreferrer">
                <img
                  src="/GooglePlay.png"
                  alt="Get it on Google Play"
                  style={{
                    width: '105px',
                    height: '42px',
                    cursor: 'pointer'
                  }}
                />
              </a>
              <a href="https://apps.apple.com/in/app/bhutan-ndi/id1645493166" target="_blank" rel="noopener noreferrer">
                <img
                  src="/Appstore.png"
                  alt="Download from App Store"
                  style={{
                    width: '110px',
                    height: '42px',
                    cursor: 'pointer'
                  }}
                />
              </a>
            </Box>
          </Box>

          <Box sx={{ mb: 1 }}>
            {' '}
            {/* Container with bottom margin */}
            <Typography
              fontWeight="bold"
              sx={{
                color: '#5AC994',
                textAlign: 'center',
                mb: 1,
              }}
            >
              Get Support
            </Typography>
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={1}
              sx={{
                '& > *': {
                  mx: 0.625
                }
              }}
            >
              <Stack direction="row" alignItems="center">
                <IconButton href="mailto:ndifeedback@dhi.bt" sx={{ color: '#5AC994', p: 0.5 }}>
                  <img src={MailIcon} alt="Mail Icon" style={{ width: '16px', height: '12px' }} />
                </IconButton>
                <Typography variant="body2" sx={{ color: 'black' }}>
                  ndifeedback@dhi.bt
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center">
                <IconButton href="tel:1199" sx={{ color: '#5AC994', p: 0.5 }}>
                  <img src={RingingPhoneOutlineIcon} alt="Ringing Phone Icon" style={{ width: '18px', height: '18px' }} />
                </IconButton>
                <Typography variant="body2" sx={{ color: 'black' }}>
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

export default BhutanNDIQRCodeLogin;
