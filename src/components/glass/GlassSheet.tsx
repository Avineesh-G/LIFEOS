import React from 'react';
import FloatingPopup from './FloatingPopup';

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function GlassSheet({
  isOpen,
  onClose,
  children,
  title,
}: GlassSheetProps) {
  return (
    <FloatingPopup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="chat"
      fullHeightExpandable={true}
    >
      {children}
    </FloatingPopup>
  );
}

export default GlassSheet;
