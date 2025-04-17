import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to welcome page after sign out
  };

  const navLinkClasses = (path: string) =>
    `px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-black font-semibold'
        : 'text-gray-500 hover:text-black'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full bg-white fixed top-0 z-50 border-b border-gray-200"
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-black">
            Attendify
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Owner links when logged in */}
            {user && (
              <>
                <Link to="/clubs" className={navLinkClasses('/clubs')}>
                  My Clubs
                </Link>
                <Link to="/profile" className={navLinkClasses('/profile')}>
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            
            {/* Minimal links when logged out or not owner */}
            {!user && !loading && (
              <>
                <Link to="/" className={navLinkClasses('/')}>
                  Home
                </Link>
                <Link to="/join-flow" className={navLinkClasses('/join-flow')}>
                  Join Club
                </Link>
                <Link to="/attend" className={navLinkClasses('/attend')}>
                  Check In
                </Link>
                <Link 
                  to="/login"
                  className="ml-4 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Owner Login
                </Link>
              </>
            )}
            
            {loading && (
              <span className="text-sm text-gray-400">Loading...</span>
            )}
          </div>
        </div>
      </motion.nav>
      
      <main className="flex-1 pt-20"> {/* Increased padding-top to account for fixed nav */}
        {children}
      </main>
    </div>
  );
};

export default Layout; 