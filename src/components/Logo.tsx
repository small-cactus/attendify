import React from 'react';
import logo from '../assets/attendify-logo.png';

interface LogoProps {
  showText?: boolean;
  className?: string;
  textClassName?: string;
  imageClassName?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({
  showText = true,
  className = '',
  textClassName = 'text-lg',
  imageClassName = 'w-7 h-7',
  size,
}) => {
  const imageStyle = size ? { width: `${size}px`, height: `${size}px` } : {};
  const textStyle = size ? { fontSize: `${size * 0.8}px` } : {};

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img 
        src={logo} 
        alt="Attendify logo" 
        className={size ? '' : imageClassName} 
        style={imageStyle}
      />
      {showText && (
        <span 
          className={`font-bold text-black ${size ? '' : textClassName}`}
          style={textStyle}
        >
          attendify
        </span>
      )}
    </span>
  );
};

export default Logo; 