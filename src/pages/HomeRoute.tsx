import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const HomeRoute: React.FC = () => {
  const [target, setTarget] = React.useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('attendify_clubs') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        setTarget('/dashboard');
      } else {
        setTarget('/welcome');
      }
    } catch {
      setTarget('/welcome');
    }
  }, []);

  if (!target) return null;
  if (target === '/welcome') return <Navigate to="/welcome" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default HomeRoute;
