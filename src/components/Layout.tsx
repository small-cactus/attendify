import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClasses = (path: string) =>
    `px-3 py-2 text-sm font-medium transition-all duration-300 ${
      isActive(path)
        ? 'text-[#1d1d1f]'
        : 'text-[#424245] hover:text-[#1d1d1f]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFD]">
      <nav className="w-full backdrop-blur-xl bg-[#FBFBFD]/80 fixed top-0 z-50 border-b border-[#1d1d1f]/[0.08]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-[#1d1d1f]">
            Attendify
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className={navLinkClasses('/')}>
              Home
            </Link>
            <Link to="/attendance" className={navLinkClasses('/attendance')}>
              Attendance
            </Link>
            <Link to="/clubs" className={navLinkClasses('/clubs')}>
              Clubs
            </Link>
            <Link to="/about" className={navLinkClasses('/about')}>
              About
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
};

export default Layout; 