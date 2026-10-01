import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Dumbbell, Wallet, Utensils, Check, ArrowRight, ShieldCheck, Heart, Star } from 'lucide-react';
import NestedSquircle from '../components/NestedSquircle';
import { detectSquircleSupport, SquircleSupportInfo } from '../utils/squircleDetect';

export default function DevShapes() {
  const [supportInfo, setSupportInfo] = useState<SquircleSupportInfo | null>(null);

  useEffect(() => {
    setSupportInfo(detectSquircleSupport());
  }, []);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl r-sm bg-accent/15 flex items-center justify-center text-accent">
            <Sparkles size={18} />
          </div>
          <h1 className="text-xl font-black text-primary-light dark:text-primary-dark tracking-tight">
            Squircle Design Tokens & Shapes System
          </h1>
        </div>
        <p className="text-xs text-secondary-light dark:text-secondary-dark font-mono">
          Route: /dev/shapes • Automatic Nested Radius & Progressive Enhancement
        </p>
      </div>

      {/* Runtime Detector Report Card */}
      <div className="p-4 rounded-[28px] r-lg liquid-glass border border-[var(--card-border)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <span className="text-xs font-bold text-primary-light dark:text-primary-dark">
              Device Squircle Capabilities
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            supportInfo?.isNativeSupported
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'bg-amber-500/15 text-amber-500'
          }`}>
            {supportInfo?.isNativeSupported ? 'Native Squircle ✓' : 'Fallback Rounding (border-radius)'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-secondary-light dark:text-secondary-dark space-y-1 pt-1">
          <div>Mode: <strong className="text-accent">{supportInfo?.mode || 'loading'}</strong></div>
          <div>Environment: {supportInfo?.webViewVersion}</div>
        </div>
      </div>

      {/* Token Scale Demo */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
          1. Radius Scale Tokens
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { token: '--r-xs', val: '10px', class: 'r-xs', label: 'Extra Small' },
            { token: '--r-sm', val: '14px', class: 'r-sm', label: 'Small' },
            { token: '--r-md', val: '20px', class: 'r-md', label: 'Medium' },
            { token: '--r-lg', val: '28px', class: 'r-lg', label: 'Large Card' },
            { token: '--r-xl', val: '36px', class: 'r-xl', label: 'Extra Large Popup' },
            { token: '--r-full', val: '999px', class: 'r-full', label: 'Full Pill / Circle' },
          ].map((item) => (
            <div
              key={item.token}
              className={`p-4 ${item.class} liquid-glass border border-accent/30 space-y-1.5 flex flex-col justify-between`}
            >
              <div className="text-xs font-bold text-accent font-mono">{item.token} ({item.val})</div>
              <div className="text-[11px] text-primary-light dark:text-primary-dark font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Automatic Nested Radius Demo */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
          2. Automatic Nested Radius (inner = max(10px, outer - padding))
        </h2>

        <div className="p-5 rounded-[28px] r-lg liquid-glass border border-accent/30 space-y-4">
          <div className="text-xs font-bold text-primary-light dark:text-primary-dark">
            Outer Card: 28px Radius (--r-lg) with 12px Padding
          </div>

          <NestedSquircle parentRadiusPx={28} parentPaddingPx={12} className="p-4 bg-accent/10 border border-accent/30">
            <div className="text-xs font-bold text-accent">
              Inner Nested Card: Auto Computed 16px Radius (28px - 12px)
            </div>
            <p className="text-[11px] text-secondary-light dark:text-secondary-dark mt-1">
              Curves stay strictly parallel and harmonized without visual pinch artifacts.
            </p>
          </NestedSquircle>
        </div>
      </div>

      {/* Inputs & Buttons Demo */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
          3. Inputs, Buttons & Controls
        </h2>

        <div className="p-4 rounded-[28px] r-lg liquid-glass border border-[var(--card-border)] space-y-3">
          <input
            type="text"
            placeholder="Input field with --r-sm (14px) squircle radius..."
            className="w-full px-4 py-3 rounded-[14px] r-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-primary-light dark:text-primary-dark"
          />

          <div className="flex items-center gap-2">
            <button type="button" className="px-5 py-2.5 rounded-[14px] r-sm btn-primary text-xs font-bold shadow-md">
              Primary Button
            </button>
            <button type="button" className="px-5 py-2.5 rounded-full r-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold">
              Pill Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
