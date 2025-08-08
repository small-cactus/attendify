import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Home from './Home';

const Entry: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    if (loading) return;
    const stored = localStorage.getItem('attendify_clubs');
    const clubs = stored ? JSON.parse(stored) : [];

    if (!user) {
      if (clubs.length > 0) {
        navigate('/dashboard', { replace: true });
      } else {
        setShowHome(true);
      }
    } else {
      if (clubs.length > 0 && !localStorage.getItem('owner_confirmed')) {
        navigate('/role-confirm', { replace: true });
      } else {
        navigate('/clubs', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (showHome) {
    return <Home />;
  }

  return null;
};

export default Entry;
