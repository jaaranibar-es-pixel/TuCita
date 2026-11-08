import React from 'react';

interface LogoProps {
  variant?: 'header' | 'hero' | 'footer';
  theme?: 'light' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'header',
  theme = 'light',
  className = '',
}) => {
  const isWhite = theme === 'white';

  const brandTextColor = isWhite ? 'text-white' : 'text-[#6b21a8]';
  const subtitleTextColor = isWhite ? 'text-purple-200' : 'text-[#9333ea]';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Woman Silhouette with Tiara and Lotus Petals Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className={
            variant === 'hero'
              ? 'w-16 h-16 md:w-20 md:h-20 drop-shadow-md'
              : variant === 'footer'
              ? 'w-12 h-12'
              : 'w-11 h-11'
          }
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Glow / Back Petals */}
          <path
            d="M50 82C32 82 12 70 12 52C12 40 24 30 38 28C34 38 38 49 46 54C43 42 48 33 54 26C60 33 65 42 62 54C70 49 74 38 70 28C84 30 96 40 96 52C96 70 76 82 58 82"
            fill={isWhite ? 'rgba(255, 255, 255, 0.25)' : '#e9d5ff'}
          />
          {/* Main Lotus Lower Petals */}
          <path
            d="M50 84C36 84 20 74 20 60C20 48 30 40 42 42C38 52 44 60 50 63C56 60 62 52 58 42C70 40 80 48 80 60C80 74 64 84 50 84Z"
            fill={isWhite ? '#ffffff' : '#c084fc'}
          />
          <path
            d="M50 86C38 86 28 78 28 66C38 72 45 72 50 68C55 72 62 72 72 66C72 78 62 86 50 86Z"
            fill={isWhite ? '#f3e8ff' : '#9333ea'}
          />

          {/* Elegant Female Silhouette Profile */}
          <path
            d="M50 24C44 24 39 29 39 36C39 41 42 45 45 48C45 52 43 56 39 59C44 59 49 57 52 53C56 50 58 45 58 39C58 30 54 24 50 24Z"
            fill={isWhite ? '#ffffff' : '#6b21a8'}
          />
          {/* Flowing hair wave contour */}
          <path
            d="M40 33C37 36 36 41 38 46C34 43 33 39 34 35C35 30 38 27 42 25C40 27 39 30 40 33Z"
            fill={isWhite ? '#e9d5ff' : '#7e22ce'}
          />

          {/* Delicate Tiara / Crown */}
          <path
            d="M44 21L47 24L50 19L53 24L56 21L55 26H45L44 21Z"
            fill={isWhite ? '#fef08a' : '#d97706'}
          />
          <circle cx="50" cy="18" r="1.5" fill={isWhite ? '#fef08a' : '#f59e0b'} />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-serif tracking-tight font-bold ${
            variant === 'hero'
              ? 'text-4xl md:text-5xl lg:text-6xl text-white'
              : variant === 'footer'
              ? 'text-2xl text-purple-900'
              : 'text-2xl md:text-3xl'
          } ${brandTextColor}`}
        >
          TuCita
        </span>
        <span
          className={`font-sans uppercase font-bold tracking-[0.22em] ${
            variant === 'hero'
              ? 'text-[10px] md:text-xs text-purple-200 mt-1'
              : variant === 'footer'
              ? 'text-[9px] text-purple-700 tracking-[0.24em] mt-0.5'
              : 'text-[8.5px] md:text-[9.5px] tracking-[0.22em] mt-0.5'
          } ${subtitleTextColor}`}
        >
          BELLEZA EN TU COMUNIDAD
        </span>
      </div>
    </div>
  );
};
