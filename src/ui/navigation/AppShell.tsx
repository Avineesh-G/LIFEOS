import React, { useState, useEffect } from 'react';
import { TabBar, TabItem } from './TabBar';
import { BottomCircle } from './BottomCircle';
import { GlassContainer } from '../glass/GlassContainer';
import '../glass/glassStyles.css';

export interface AppShellProps {
  tabs: TabItem[];
  activeTabKey: string;
  onTabChange: (key: string) => void;
  activeModuleTint?: string;
  onQuickAddClick: () => void;
  onAiClick?: () => void;
  hideNav?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  tabs,
  activeTabKey,
  onTabChange,
  activeModuleTint = '#0A84FF',
  onQuickAddClick,
  onAiClick,
  hideNav = false,
  children,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#0A84FF]/30 overflow-x-hidden">
      {/* 72px Top and Bottom Scroll Edge Gradient Overlays */}
      <div className="scroll-edge-top" />
      <div className="scroll-edge-bottom" />

      {/* Main Content Area */}
      <main className="relative z-10 w-full min-h-screen pb-[110px]">
        {children}
      </main>

      {/* Floating Navigation Glass Layer */}
      {!hideNav && (
        <GlassContainer className="fixed bottom-[env(safe-area-inset-bottom,12px)] inset-x-0 z-40 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Tab Bar Glass Pill */}
          <div className="flex-1">
            <TabBar
              items={tabs}
              activeKey={activeTabKey}
              onChange={onTabChange}
              onAiClick={onAiClick}
            />
          </div>

          {/* Bottom Circle Quick Add */}
          <BottomCircle
            tint={activeModuleTint}
            onClick={onQuickAddClick}
          />
        </GlassContainer>
      )}
    </div>
  );
}
