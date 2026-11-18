import React from 'react';

interface BladeLogoProps {
  className?: string;
  accentColor?: string;
  bladeColor?: string;
  bgColor?: string;
  showFrame?: boolean;
}

export const BladeLogo: React.FC<BladeLogoProps> = ({
  className = 'w-6 h-6',
  accentColor = '#ff5a1f',
  bladeColor = '#ededee',
  bgColor = '#1a1a1c',
  showFrame = true,
}) => {
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden="true">
      {showFrame && <rect x="64" y="64" width="896" height="896" rx="180" fill={bgColor} />}
      <path d="M268 780 L612 244 H756 L412 780 Z" fill={accentColor} />
      <path d="M520 780 L698 502 H790 L612 780 Z" fill={bladeColor} />
    </svg>
  );
};
