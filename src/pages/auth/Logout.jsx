import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Dispatch action to clear authentication state
    dispatch(clearAuth());
    // Redirect user to the login page after logout
    navigate('/');
  }, [dispatch, navigate]);

  return (
    <div>
      <p>Logging out...</p>
    </div>
  );
};

export default Logout;
