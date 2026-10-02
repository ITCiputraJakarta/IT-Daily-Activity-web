import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
  customLogoUrl?: string | null;
  altText?: string;
}

export const CiputraLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  customLogoUrl,
  altText = 'Hotel Ciputra Jakarta'
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [customLogoUrl]);

  const sizeClasses: Record<string, string> = {
    fit: 'w-full h-full max-h-full max-w-full',
    xs: 'h-7 max-h-7 w-auto',
    sm: 'h-9 max-h-9 w-auto',
    md: 'h-13 max-h-13 w-auto',
    lg: 'h-18 max-h-18 w-auto',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;
  const isFit = size === 'fit';

  // If user uploaded a custom logo and it loads without error, render it crisply
  if (customLogoUrl && !imgError) {
    return (
      <div className={`${isFit ? 'w-full h-full' : ''} flex select-none ${className || 'items-center justify-center'}`}>
        <img
          src={customLogoUrl}
          alt={altText}
          onError={() => setImgError(true)}
          className={`${selectedSizeClass} object-contain block`}
        />
      </div>
    );
  }

  // Default: Hotel Ciputra Jakarta official SVG vector insignia
  return (
    <div className={`${isFit ? 'w-full h-full' : ''} flex flex-col select-none ${className || 'items-center justify-center'}`}>
      <svg
        viewBox="0 0 160 70"
        preserveAspectRatio="xMidYMid meet"
        className={`${selectedSizeClass} object-contain block`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Artistic emerald green swooshes matching Hotel Ciputra logo */}
        <path
          d="M 52,24 C 65,8 105,10 118,22 C 102,15 72,16 60,25 C 48,34 68,40 85,38 C 105,36 115,26 122,23 C 112,32 95,44 76,43 C 58,42 42,35 52,24 Z"
          fill="#0c7040"
        />
        <path
          d="M 68,14 C 82,6 108,12 112,18 C 96,13 78,16 68,14 Z"
          fill="#34a853"
          opacity="0.85"
        />
        {/* HOTEL text */}
        <text
          x="85"
          y="49"
          textAnchor="middle"
          fontSize="6.5"
          letterSpacing="4"
          fill="#1c3d2a"
          fontWeight="600"
          fontFamily="serif"
        >
          HOTEL
        </text>
        {/* CIPUTRA text */}
        <text
          x="85"
          y="59"
          textAnchor="middle"
          fontSize="11.5"
          letterSpacing="2.5"
          fill="#114b2d"
          fontWeight="800"
          fontFamily="serif"
        >
          CIPUTRA
        </text>
        {/* JAKARTA text */}
        <text
          x="85"
          y="66.5"
          textAnchor="middle"
          fontSize="5.2"
          letterSpacing="3"
          fill="#475569"
          fontWeight="500"
          fontFamily="sans-serif"
        >
          JAKARTA
        </text>
      </svg>
    </div>
  );
};
