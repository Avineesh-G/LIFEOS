/**
 * LifeOS — ReceiptsGrid & ReceiptViewerModal Components
 * 
 * Receipts tab features:
 * - Thumbnail grid of attached receipts and bills
 * - Lazy object URL generation with automatic revocation
 * - Full-screen viewer with zoom, deletion, and link back to parent expense
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Trash2, X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import type { OutingReceiptRecord, OutingExpense } from '../types';

interface ReceiptsGridProps {
  receipts: OutingReceiptRecord[];
  expenses: OutingExpense[];
  onDeleteReceipt: (receiptId: string) => void;
  onNavigateToExpense?: (expense: OutingExpense) => void;
}

export function ReceiptsGrid({
  receipts,
  expenses,
  onDeleteReceipt,
  onNavigateToExpense,
}: ReceiptsGridProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<OutingReceiptRecord | null>(null);

  // Generate thumbnail object URLs cleanly
  const thumbUrls = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of receipts) {
      if (r.thumbBlob) {
        map.set(r.id, URL.createObjectURL(r.thumbBlob));
      }
    }
    return map;
  }, [receipts]);

  // Clean up thumbnail URLs on change/unmount
  useEffect(() => {
    return () => {
      thumbUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumbUrls]);

  if (receipts.length === 0) {
    return (
      <div className="p-8 rounded-[28px] liquid-glass border border-[var(--card-border)] text-center space-y-2 select-none">
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center">
          <ImageIcon size={24} />
        </div>
        <h4 className="text-sm font-heading font-bold text-primary-light dark:text-primary-dark">
          No Receipts Attached
        </h4>
        <p className="text-xs text-secondary-light dark:text-secondary-dark max-w-xs mx-auto">
          Take photos or attach bills when recording expenses to view them in this gallery.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 select-none">
      <div className="grid grid-cols-3 min-[400px]:grid-cols-4 gap-2.5">
        {receipts.map((r) => {
          const thumbUrl = thumbUrls.get(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedReceipt(r);
              }}
              className="aspect-square rounded-[20px] overflow-hidden border border-[var(--card-border)] bg-black/5 dark:bg-white/5 relative group active:scale-95 transition-transform cursor-pointer"
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt="Receipt thumbnail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-light">
                  <ImageIcon size={20} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Full screen modal */}
      {selectedReceipt && (
        <ReceiptViewerModal
          receipt={selectedReceipt}
          expenses={expenses}
          onClose={() => setSelectedReceipt(null)}
          onDelete={() => {
            onDeleteReceipt(selectedReceipt.id);
            setSelectedReceipt(null);
          }}
          onNavigateToExpense={onNavigateToExpense}
        />
      )}
    </div>
  );
}

interface ReceiptViewerModalProps {
  receipt: OutingReceiptRecord;
  expenses: OutingExpense[];
  onClose: () => void;
  onDelete: () => void;
  onNavigateToExpense?: (expense: OutingExpense) => void;
}

export function ReceiptViewerModal({
  receipt,
  expenses,
  onClose,
  onDelete,
  onNavigateToExpense,
}: ReceiptViewerModalProps) {
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Generate full-size blob object URL
  useEffect(() => {
    if (receipt.blob) {
      const url = URL.createObjectURL(receipt.blob);
      setFullUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [receipt]);

  const parentExpense = useMemo(() => {
    if (!receipt.expenseId) return null;
    return expenses.find((e) => e.id === receipt.expenseId) || null;
  }, [receipt, expenses]);

  const handleZoomIn = () => {
    triggerHaptic('selection');
    setZoomLevel((prev) => Math.min(3, prev + 0.5));
  };

  const handleZoomOut = () => {
    triggerHaptic('selection');
    setZoomLevel((prev) => Math.max(1, prev - 0.5));
  };

  const sizeKB = receipt.size ? Math.round(receipt.size / 1024) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 text-white z-10">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">
            {parentExpense ? parentExpense.title : 'Receipt Viewer'}
          </p>
          <p className="text-xs text-white/60">
            {sizeKB > 0 && `${sizeKB} KB • `}
            {receipt.width}×{receipt.height}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
          >
            <ZoomOut size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
          >
            <ZoomIn size={18} />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this receipt permanently?')) {
                triggerHaptic('save');
                onDelete();
              }
            }}
            className="p-2 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer"
            title="Delete receipt"
          >
            <Trash2 size={18} />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image Center Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {fullUrl ? (
          <img
            src={fullUrl}
            alt="Receipt Full View"
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 200ms ease-out',
            }}
            className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
        ) : (
          <div className="text-white/60 text-sm">Loading receipt...</div>
        )}
      </div>

      {/* Bottom Footer with Parent Expense Link */}
      {parentExpense && (
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-white text-xs">
          <div>
            <span className="text-white/60">Attached to: </span>
            <span className="font-bold">{parentExpense.title}</span>
          </div>

          {onNavigateToExpense && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onNavigateToExpense(parentExpense);
              }}
              className="px-3 py-1.5 rounded-full bg-accent text-white font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>View Expense</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
