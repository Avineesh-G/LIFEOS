import React from 'react';

interface PulseBubbleIconProps {
  size?: number;
  className?: string;
  filled?: boolean;
}

export function PulseBubbleIcon({ size = 24, className = '', filled = false }: PulseBubbleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chat bubble outline/fill */}
      <path
        d="M12 3.5C6.75 3.5 2.5 7.18 2.5 11.72C2.5 14.34 3.91 16.68 6.12 18.17L5.3 21.2C5.18 21.64 5.6 22 6 21.82L9.62 20.3C10.39 20.52 11.18 20.64 12 20.64C17.25 20.64 21.5 16.26 21.5 11.72C21.5 7.18 17.25 3.5 12 3.5Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Heartbeat / pulse wave line inside */}
      <path
        d="M7 11.75H9.2L10.6 8.5L12.8 14.5L14.2 11.75H17"
        fill="none"
        stroke={filled ? 'var(--md-on-primary-container, #ffffff)' : 'currentColor'}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default PulseBubbleIcon;
