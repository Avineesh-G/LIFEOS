import React from 'react';
import { X } from '../tokens/icons';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onClear?: () => void;
  leadingIcon?: React.ReactNode;
}

export function TextField({
  label,
  error,
  value,
  onChange,
  onClear,
  leadingIcon,
  className = '',
  ...props
}: TextFieldProps) {
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-[rgba(235,235,245,0.60)] pl-1">{label}</label>}
      <div
        className={`relative flex items-center bg-[#2C2C2E] rounded-[14px] px-3.5 h-[44px] border border-white/5 transition-colors focus-within:border-[rgba(10,132,255,0.6)] ${
          error ? 'border-[#FF453A]' : ''
        } ${className}`}
      >
        {leadingIcon && <div className="text-[rgba(235,235,245,0.50)] mr-2 shrink-0">{leadingIcon}</div>}
        <input
          value={value}
          onChange={onChange}
          className="w-full bg-transparent text-[17px] text-white placeholder-[rgba(235,235,245,0.30)] focus:outline-none"
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-full text-[rgba(235,235,245,0.40)] hover:text-white transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>
      {error && <span className="text-xs text-[#FF453A] pl-1 font-medium">{error}</span>}
    </div>
  );
}
