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

const useAuth = () => {
  const token = useSelector((state) => state.auth.accessToken);
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);

    if (decoded.exp * 1000 < Date.now()) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

const AuthGuard = ({ children }) => {
  const isAuthenticated = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/auth/login") {
      navigate("/auth/login", { replace: true });
      window.location.reload(); // Force page refresh after navigation
    }
  }, [isAuthenticated, navigate, location]);

  return isAuthenticated ? children : null;
};

/* ---------- ROUTE RENDERER (supports children) ---------- */

const renderRoutes = (routes) => {
  return routes.map((route, index) => {
    if (route.children && route.children.length > 0) {
      return (
        <Route key={index} path={route.path} element={route.element}>
          {renderRoutes(route.children)}
        </Route>
      );
    }

    return <Route key={index} path={route.path} element={route.element} />;
  });
};

const App = () => {
  const isAuthenticated = useAuth();

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
        {!isAuthenticated ? (
          <Route element={<PublicLayout />}>
            {renderRoutes(publicRoutes)}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Route>
        ) : (
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
        )}
      </Routes>
    </Router>
  );
};

export default App;
