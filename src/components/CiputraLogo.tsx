import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  customLogoUrl?: string | null;
  altText?: string;
}

export const CiputraLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  customLogoUrl,
  altText = 'Hotel Ciputra Jakarta'
}) => {
  const sizeClasses = {
    sm: 'h-10 max-h-10',
    md: 'h-14 max-h-14',
    lg: 'h-20 max-h-20',
  };

  // If user uploaded a custom logo, render it crisply
  if (customLogoUrl) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <img
          src={customLogoUrl}
          alt={altText}
          className={`${sizeClasses[size]} w-auto max-w-[170px] object-contain`}
        />
      </div>
    );
  }

  // Default: Hotel Ciputra Jakarta official SVG vector insignia
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 70"
        className={`${sizeClasses[size]} w-auto object-contain`}
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
