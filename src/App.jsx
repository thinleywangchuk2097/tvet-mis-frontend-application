import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import PublicLayout from "./layout/PublicLayout";
import { useSelector } from "react-redux";
import { publicRoutes, privateRoutes } from "./routes/appRoutes";
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const useAuth = () => {
  const token = useSelector((state) => state.auth.accessToken);
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch (e) {
    return false; // Invalid token
  }
};

const AuthGuard = ({ children }) => {
  const isAuthenticated = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/login") {
      navigate("/login", { replace: true });
      window.location.reload(); // Force page refresh after navigation
    }
  }, [isAuthenticated, navigate, location]);

  return isAuthenticated ? children : null;
};

const App = () => {
  const isAuthenticated = useAuth();

  return (
    <Router>
      {/* ToastContainer must be at the root level */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}// Show progress bar (more polished)
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ marginTop: "50px" }} // Add top margin here
      />
      <Routes>
        <Route>
          {!isAuthenticated ? (
            <Route element={<PublicLayout />}>
              {publicRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
          ) : (
            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              {privateRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
