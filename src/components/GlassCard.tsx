import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`backdrop-blur-lg bg-white/30 rounded-2xl shadow-xl border border-white/20 p-6 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard; 