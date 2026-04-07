import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  dark?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = true, dark = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} role="img" aria-label="TaskFlow Logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
        <path
          d="M12 20L18 26L28 14"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'} dark:text-white`}>
          Task <span className="text-primary">Flow</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
