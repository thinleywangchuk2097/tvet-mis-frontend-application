import { Box, styled } from "@mui/material";
import Header from "./Header";
import { keyframes } from "@mui/system";

// Slide animation for the bottom line
const slideLine = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Styled container with bottom animated line
const HeaderWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0, // line at bottom
    left: 0,
    height: 4,
    width: "100%",
    background: `linear-gradient(
      90deg,
      transparent 0%,
      ${theme.palette.primary.main} 30%,
      ${theme.palette.primary.main} 70%,
      transparent 100%
    )`,
    transform: "translateX(-100%)",
    animation: `${slideLine} 3s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
  },
}));

const AnimatedHeader = () => {
  return (
    <HeaderWrapper>
      <Header />
    </HeaderWrapper>
  );
};

export default AnimatedHeader;
