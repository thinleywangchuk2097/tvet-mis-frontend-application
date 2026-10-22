import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import { PuffLoader } from "react-spinners";
import { QRCodeCanvas } from "qrcode.react";
import CloseIcon from "@mui/icons-material/Close";
import QRNDIlogo from "../../../assets/images/QRNDIlogo.svg";
import RingingPhoneOutlineIcon from "../../../assets/images/Call.png";
import MailIcon from "../../../assets/images/Mail.png";
import slide1 from "../../../assets/slider/slide1.jpg";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import BhutanNDIService from "../../../api/services/external/ndi/BhutanNDIService";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { loginSuccess } from "../../../features/auth/authSlice";
import { setPrivileges } from "../../../features/privilege/privilegeSlice";
import { setUserProfile } from "../../../features/auth/userProfileSlice";
import PrivilegeService from "../../../api/services/internal/privilege/PrivilegeService";
import UserProfileService from "../../../api/services/internal/userprofile/UserProfileService";

const POLL_INTERVAL_MS = 2000;

const Loader = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 200,
    }}
  >
    <PuffLoader color="rgb(70, 180, 128)" size={60} />
  </Box>
);

Loader.propTypes = {};

const ErrorMessage = ({ message }) => (
  <Typography color="error">{message}</Typography>
);

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

const QRCodeDisplay = ({ value }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 220,
      height: 220,
      margin: "auto",
      marginBottom: 1,
      backgroundColor: "#FFFFFF",
      padding: 10,
      border: "3px solid #5AC994",
      borderRadius: "10px",
    }}
  >
    <Box
      sx={{
        position: "relative",
        width: 184,
        height: 184,
        padding: "8px",
        backgroundColor: "#FFFFFF",
        borderRadius: "4px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <QRCodeCanvas value={value} size={184} style={{ display: "block" }} />
      <img
        src={QRNDIlogo}
        alt="Bhutan NDI Logo"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          background: "white",
        }}
      />
    </Box>
  </Box>
);

QRCodeDisplay.propTypes = {
  value: PropTypes.string,
};

const GenerateQRCode = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [deepLinkUrl, setDeepLinkUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:768px)");

  const pollRef = useRef(null);
  const threadIdRef = useRef(null);
  const stoppedRef = useRef(false);

  const getTokenData = (token) => {
    try {
      const decoded = jwtDecode(token);
      return { roles: decoded.roles || [] };
    } catch {
      return { roles: [] };
    }
  };

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        // Backend auto-subscribes to NATS for the returned threadId
        const response = await BhutanNDIService.createProofRequest();
        console.log("Proof request response:", response);

        const data = response.data?.data;

        if (data?.proofRequestURL) {
          setQrCodeUrl(data.proofRequestURL);
        } else {
          throw new Error("Invalid response structure");
        }

        if (data?.deepLinkURL) {
          setDeepLinkUrl(data.deepLinkURL);
        }

        if (data?.proofRequestThreadId) {
          threadIdRef.current = data.proofRequestThreadId;
          startPolling(data.proofRequestThreadId);
        } else {
          setError("Invalid thread ID");
        }
      } catch (err) {
        console.error("Error fetching QR Code:", err);
        setError("Failed to fetch QR Code. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();

    return () => {
      stoppedRef.current = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const startPolling = (threadId) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      if (stoppedRef.current) return;

      try {
        const res = await BhutanNDIService.getNatsAuthResult(threadId);
        console.log("Polling response:", res);
        // Still pending — keep polling
        if (res.status === 202 || res.data?.status === "PENDING") {
          return;
        }

        // Stop polling once we have a terminal result
        clearInterval(pollRef.current);
        pollRef.current = null;

        if (res.status === 200 && res.data) {
          await handleSuccessfulLogin(res.data);
        } else {
          const msg =
            res.data?.message || res.data?.error || "Authentication failed";
          toast.error(msg);
          setError(msg);
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Keep polling on transient network errors
      }
    }, POLL_INTERVAL_MS);
  };

  const handleOpenDeepLink = async () => {
    if (deepLinkUrl) {
      window.location.href = deepLinkUrl;
    } else {
      alert("No URL provided!");
    }
  };

  const handleSuccessfulLogin = async (authResponse) => {
    const {
      access_token,
      refresh_token,
      current_role,
      userId,
      locationId,
      id,
    } = authResponse;

    const { roles } = getTokenData(access_token);
    const currentRoleStr = String(current_role);
    const rolesStr = roles.map(String);

    if (!rolesStr.includes(currentRoleStr)) {
      toast.error(
        `Your account doesn't have permission for role ${currentRoleStr}`,
      );
      return;
    }

    dispatch(
      loginSuccess({
        access_token,
        refresh_token,
        current_role,
        locationId,
        id,
      }),
    );

    try {
      const privilegesData = await PrivilegeService.getPrivileges(
        current_role,
        access_token,
      );
      const privileges =
        privilegesData.data?.map((item) => ({
          id: item.id,
          display_order: item.disPlayOrder,
          is_display: item.display,
          parent_id: item.parentId,
          privilege_name: item.privilegeName,
          route_name: item.routeName,
          menuIcon: item.menuIcon,
        })) || [];
      dispatch(setPrivileges(privileges));
    } catch (err) {
      console.error("Privilege fetch error", err);
    }

    try {
      const profileRes = await UserProfileService.getUserNameCurrentRoleName(
        userId,
        access_token,
      );
      dispatch(
        setUserProfile({
          username: profileRes.data.username,
          current_role_name: profileRes.data.current_role_name,
        }),
      );
    } catch (err) {
      console.error("Profile fetch error", err);
    }

    toast.success("Login successfully!");
    navigate("/");
  };

  const handleClose = () => {
    stoppedRef.current = true;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    navigate("/auth/login");
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        padding: 3,
        backgroundImage: `url(${slide1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)",
          zIndex: 1,
        },
      }}
    >
      <Card
        sx={{
          width: isMobile ? "100%" : 600,
          maxHeight: "90vh",
          margin: "auto",
          textAlign: "center",
          boxShadow: 3,
          padding: 3,
          borderRadius: 2,
          backgroundColor: "#F8F8F8",
          color: "#A1A0A0",
          overflowY: "auto",
          zIndex: 2,
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 3,
            right: 10,
            color: "#333",
          }}
        >
          <CloseIcon />
        </IconButton>

        <CardContent
          sx={{
            paddingBottom: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {isMobile ? (
            <>
              <Typography
                variant="h4"
                fontWeight="bold"
                mb={1}
                sx={{
                  fontSize: "18px",
                  color: "#000000",
                }}
              >
                {"Login with "}
                <span style={{ color: "#5AC994" }}>Bhutan NDI</span>
                {" Wallet"}
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenDeepLink}
                sx={{
                  bgcolor: "#5AC994",
                  color: "#fff",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#4CAF89" },
                  width: "100%",
                  maxWidth: "290px",
                  margin: "0 auto",
                }}
              >
                Open Bhutan NDI Wallet
              </Button>
              <Typography
                variant="body2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  my: 1,
                }}
              >
                <Box sx={{ flex: 1, borderBottom: "1px solid #ccc", mr: 1 }} />
                OR
                <Box sx={{ flex: 1, borderBottom: "1px solid #ccc", ml: 1 }} />
              </Typography>
            </>
          ) : (
            <Typography
              variant="h4"
              fontWeight="bold"
              mb={1}
              sx={{
                fontSize: "18px",
                color: "#000000",
              }}
            >
              {"Scan with "}
              <span style={{ color: "#5AC994" }}>Bhutan NDI</span>
              {" Wallet"}
            </Typography>
          )}

          {loading ? (
            <Loader />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <QRCodeDisplay value={qrCodeUrl} />
          )}

          <Typography
            component="div"
            variant="body2"
            sx={{
              lineHeight: 1.8,
              color: "#666666",
              textAlign: "left",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                textAlign: "left",
                width: "100%",
                maxWidth: "300px",
              }}
            >
              1. Open Bhutan NDI Wallet on your Phone <br />
              2. Tap the Scan button{" "}
              <img
                src="/UI_Scanicon.png"
                alt="Scan icon"
                style={{
                  width: "25px",
                  height: "auto",
                  verticalAlign: "middle",
                  marginTop: "3px",
                  paddingRight: 2,
                }}
              />
              located on the
              <br />
              <span style={{ paddingLeft: "18px" }}>
                menu bar and scan the QR code
              </span>
            </Box>
          </Typography>

          <Button
            variant="outlined"
            endIcon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 69 70"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="34.5"
                  cy="35"
                  r="32.5833"
                  fill="#5AC994"
                  stroke="#5AC994"
                  strokeWidth="3.83333"
                />
                <path
                  d="M53.6548 35.0075L22.0298 51.6063L22.0298 18.4087L53.6548 35.0075Z"
                  fill="white"
                />
              </svg>
            }
            sx={{
              border: "2px solid #5AC994",
              backgroundColor: "transparent",
              fontWeight: "bold",
              width: "180px",
              height: "37px",
              fontSize: "12px",
              color: "#5AC994",
              borderRadius: "30px",
              margin: "0 auto",
              marginTop: 1,
              textTransform: "none",
              transition: "all 0.3s ease",
              "&:hover": {
                border: "2px solid #5AC994",
                backgroundColor: "#5AC994",
                color: "#FFFFFF",
                "& svg circle": {
                  fill: "#FFFFFF",
                  stroke: "#FFFFFF",
                },
                "& svg path": {
                  fill: "#5AC994",
                },
              },
            }}
            onClick={() =>
              window.open(
                "https://www.youtube.com/watch?v=A_k79pml9k8",
                "_blank",
                "noopener",
              )
            }
          >
            Watch Video Guide
          </Button>

          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography
              sx={{
                mt: 1,
                textAlign: "center",
                mb: 1,
                fontSize: "0.9rem",
              }}
            >
              Don&apos;t have the Bhutan NDI Wallet?{" "}
              <span
                style={{
                  color: "#5AC994",
                  fontWeight: "bold",
                  display: isMobile ? "block" : "inline",
                }}
              >
                Download Now!
              </span>
            </Typography>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={1}
              sx={{
                "& img": {
                  objectFit: "contain",
                },
              }}
            >
              <a
                href="https://play.google.com/store/search?q=bhutan%20ndi&c=apps&hl=en_IN&gl=US"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/GooglePlay.png"
                  alt="Get it on Google Play"
                  style={{
                    width: "105px",
                    height: "42px",
                    cursor: "pointer",
                  }}
                />
              </a>
              <a
                href="https://apps.apple.com/in/app/bhutan-ndi/id1645493166"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/Appstore.png"
                  alt="Download from App Store"
                  style={{
                    width: "110px",
                    height: "42px",
                    cursor: "pointer",
                  }}
                />
              </a>
            </Box>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography
              fontWeight="bold"
              sx={{
                color: "#5AC994",
                textAlign: "center",
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
                "& > *": {
                  mx: 0.625,
                },
              }}
            >
              <Stack direction="row" alignItems="center">
                <IconButton
                  href="mailto:ndifeedback@bhutanndi.bt"
                  sx={{ color: "#5AC994", p: 0.5 }}
                >
                  <img
                    src={MailIcon}
                    alt="Mail Icon"
                    style={{ width: "16px", height: "12px" }}
                  />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    color: "black",
                  }}
                >
                  ndifeedback@bhutanndi.bt
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center">
                <IconButton href="tel:1199" sx={{ color: "#5AC994", p: 0.5 }}>
                  <img
                    src={RingingPhoneOutlineIcon}
                    alt="Ringing Phone Icon"
                    style={{ width: "18px", height: "18px" }}
                  />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    color: "black",
                  }}
                >
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

GenerateQRCode.propTypes = {};

export default GenerateQRCode;
