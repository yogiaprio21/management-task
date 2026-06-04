import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  dark?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = true, dark = false }) => {
  const gradientId = useId();

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
        <rect width="40" height="40" rx="9" fill="#0F172A" />
        <rect x="4" y="4" width="32" height="32" rx="7" fill={`url(#${gradientId})`} />
        <path
          d="M12 20.5L18 26L29 14"
          stroke="white"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M11 12H19" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 29H30" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id={gradientId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.58" stopColor="#2563EB" />
            <stop offset="1" stopColor="#14B8A6" />
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
