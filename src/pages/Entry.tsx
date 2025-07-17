import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Entry: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const stored = localStorage.getItem('attendify_clubs');
    const clubs = stored ? JSON.parse(stored) : [];

    if (!user) {
      if (clubs.length > 0) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/welcome', { replace: true });
      }
    } else {
      if (clubs.length > 0 && !localStorage.getItem('owner_confirmed')) {
        navigate('/role-confirm', { replace: true });
      } else {
        navigate('/clubs', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return null;
};

export default Entry;
