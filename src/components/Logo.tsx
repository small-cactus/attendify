import React from 'react';
import logo from '../assets/attendify-logo.png';

interface LogoProps {
  showText?: boolean;
  className?: string;
  textClassName?: string;
  imageClassName?: string;
}

const Logo: React.FC<LogoProps> = ({ showText = true, className = '', textClassName = '', imageClassName = 'w-7 h-7' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <img src={logo} alt="Attendify logo" className={imageClassName} />
    {showText && <span className={`font-bold text-black text-lg ${textClassName}`}>Attendify</span>}
  </span>
);

export default Logo; 