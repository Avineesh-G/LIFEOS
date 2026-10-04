import React from 'react';
import { M3LoadingIndicator } from '../m3/M3LoadingIndicator';

interface PageLoadingFallbackProps {
  label?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({ label = 'Loading...' }) => {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 animate-fadeIn">
      <M3LoadingIndicator size="lg" label={label} />
    </div>
  );
};

export default PageLoadingFallback;
