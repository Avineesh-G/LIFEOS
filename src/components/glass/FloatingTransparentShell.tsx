import React from 'react';

export interface FloatingTransparentShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Transparent Outer Shell & Content Container with Aspect Fit
 * Implements the Floating Screen Transparency & Media Container Specification.
 *
 * Pattern:
 * <div className="fixed z-50 bg-transparent bg-none shadow-none backdrop-blur-none pointer-events-auto">
 *   <video className="w-full h-full bg-transparent object-contain" />
 * </div>
 */
export function FloatingTransparentShell({
  children,
  className = '',
}: FloatingTransparentShellProps) {
  return (
    <div className={`fixed z-50 bg-transparent bg-none shadow-none backdrop-blur-none pointer-events-auto floating-shell floating-container ${className}`}>
      {children}
    </div>
  );
}

export default FloatingTransparentShell;
