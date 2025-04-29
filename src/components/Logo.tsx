import React from 'react';
import logo from '../assets/attendify-logo.png';

interface LogoProps {
  showText?: boolean;
  className?: string;
  textClassName?: string;
  imageClassName?: string;
  size?: number;
  darkMode?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  showText = true,
  className = '',
  textClassName = 'text-lg',
  imageClassName = 'w-7 h-7',
  size,
  darkMode = false,
}) => {
  const imageStyle = {
    ...(size ? { width: `${size}px`, height: `${size}px` } : {}),
    ...(darkMode ? { filter: 'invert(1)' } : {}),
  };
  
  const effectiveTextStyle = size ? { fontSize: `${size * 0.8}px` } : {};
  const effectiveTextColor = darkMode ? 'text-white' : 'text-black';

  return (
    <span 
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <img 
        src={logo} 
        alt="Attendify logo" 
        className={size ? '' : imageClassName} 
        style={imageStyle}
      />
      {showText && (
        <span 
          className={`font-bold ${effectiveTextColor} ${size ? '' : textClassName}`}
          style={effectiveTextStyle}
        >
          attendify
        </span>
      )}
    </span>
  );
};

export default Logo; 