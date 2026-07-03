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
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from "react-toastify";
import { publicRoutes } from "./routes/publicRoutes";
import { privateRoutes } from "./routes/privateRoutes";
import PropTypes from "prop-types";

const useAuth = () => {
  const token = useSelector((state) => state.auth.accessToken);

  // ✅ FIXED: Simplified return (no if-else)
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    // ✅ FIXED: Simplified return with single statement
    return decoded.exp * 1000 >= Date.now();
  } catch (e) {
    // ✅ FIXED: Log the error instead of ignoring it
    console.error("Token validation error:", e.message);
    return false;
  }
};

const AuthGuard = ({ children }) => {
  const isAuthenticated = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ✅ FIXED: Use globalThis instead of window
  const isBrowser = typeof globalThis !== "undefined";

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/auth/login") {
      navigate("/auth/login", { replace: true });
      // ✅ FIXED: Use globalThis instead of window
      if (isBrowser) {
        globalThis.location.reload();
      }
    }
  }, [isAuthenticated, navigate, location, isBrowser]);

  // ✅ FIXED: Use positive condition instead of negated
  return isAuthenticated ? children : null;
};

// ✅ FIXED: Added PropTypes validation
AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
};

/* ---------- ROUTE RENDERER (supports children) ---------- */

const renderRoutes = (routes) => {
  return routes.map((route, index) => {
    if (route.children && route.children.length > 0) {
      return (
        // ✅ FIXED: Use route.path as key instead of index
        <Route key={route.path} path={route.path} element={route.element}>
          {renderRoutes(route.children)}
        </Route>
      );
    }

    // ✅ FIXED: Use route.path as key instead of index
    return <Route key={route.path} path={route.path} element={route.element} />;
  });
};

const App = () => {
  const isAuthenticated = useAuth();

  // ✅ FIXED: Simplified return with single statement
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ marginTop: "57px" }}
        toastStyle={{
          minHeight: "37px",
          fontSize: "0.85rem",
        }}
      />

      <Routes>
        {isAuthenticated ? (
          // ✅ FIXED: Positive condition (no negation)
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            {renderRoutes(privateRoutes)}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route element={<PublicLayout />}>
            {renderRoutes(publicRoutes)}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
};

export default App;
