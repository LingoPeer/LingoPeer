import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequirePlacement({ children }) {
  const { auth } = useAuth();

  if (!auth.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.placementCompleted) {
    return <Navigate to="/placement-test" replace />;
  }

  return children;
}

