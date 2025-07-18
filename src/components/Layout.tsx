import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Menu } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path
  }

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
          <Link to="/" className="mr-6 flex-shrink-0">
            <Logo
              textClassName="text-3xl"
              imageClassName="w-8 h-8"
              size={30}
            />
          </Link>

          {/* Mobile menu */}
          <div className="flex items-center md:hidden">
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 text-gray-700" aria-label="Menu">
                  <Menu className="w-6 h-6" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-2 space-y-1" >
                {user ? (
                  <div className="flex flex-col">
                    <Link to="/dashboard" className={navLinkClasses('/dashboard')}>Student View</Link>
                    <Link to="/clubs" className={navLinkClasses('/clubs')}>My Clubs</Link>
                    <Link to="/profile" className={navLinkClasses('/profile')}>Settings</Link>
                    <button onClick={handleSignOut} className="text-left px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-black transition-colors">Sign Out</button>
                  </div>
                ) : !loading ? (
                  <div className="flex flex-col">
                    <Link to="/" className={navLinkClasses('/')}>Home</Link>
                    <Link to="/join" className={navLinkClasses('/join')}>Join Club</Link>
                    <Link to="/attend" className={navLinkClasses('/attend')}>Check In</Link>
                    <Link to="/login" className="px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors">Owner Login</Link>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Loading...</span>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <Link to="/dashboard" className={navLinkClasses('/dashboard')}>Student View</Link>
                <Link to="/clubs" className={navLinkClasses('/clubs')}>My Clubs</Link>
                <Link to="/profile" className={navLinkClasses('/profile')}>Settings</Link>
                <button onClick={handleSignOut} className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-black transition-colors">Sign Out</button>
              </>
            )}

            {!user && !loading && (
              <>
                <Link to="/" className={navLinkClasses('/')}>Home</Link>
                <Link to="/join" className={navLinkClasses('/join')}>Join Club</Link>
                <Link to="/attend" className={navLinkClasses('/attend')}>Check In</Link>
                <Link to="/login" className="ml-4 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors">Owner Login</Link>
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
      <Analytics />
      <SpeedInsights />
    </div>
  );
};

export default Layout;
