import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  QrCode,
  Copy,
  Check,
  ShareNetwork,
  Folder,
  FileText,
} from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { formatStorageSize } from '../../services/driveStorageService';
import type { PublicShareRecord } from '../../types';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareRecord: PublicShareRecord | null;
}

export function ShareQrModal({
  isOpen,
  onClose,
  shareRecord,
}: ShareQrModalProps) {
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    triggerHaptic('light');
    setCopied(false);
    onClose();
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = shareRecord ? `${origin}/share/${shareRecord.shareId}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (!shareRecord || !shareUrl) return;
    triggerHaptic('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Download ${shareRecord.title}`,
          text: `Download "${shareRecord.title}" (${formatStorageSize(shareRecord.fileSize)}) shared via LifeOS Drive:`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && shareRecord && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[28px] bg-[#1C1C1E] border border-white/10 p-5 sm:p-6 text-white shadow-2xl relative select-none"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              title="Close"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3.5 pr-8">
              <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center shrink-0">
                <QrCode size={20} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-bold tracking-tight text-white truncate">
                  Scan to Download
                </h3>
                <p className="text-[12px] text-white/50 truncate">
                  Cross-device instant transfer
                </p>
              </div>
            </div>

            {/* Item Banner */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0">
                {shareRecord.type === 'folder' ? (
                  <Folder size={18} weight="duotone" />
                ) : (
                  <FileText size={18} weight="duotone" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white/90 truncate">
                  {shareRecord.title}
                </div>
                <div className="text-[11px] text-white/40">
                  {formatStorageSize(shareRecord.fileSize)} ·{' '}
                  {shareRecord.type === 'folder'
                    ? `${shareRecord.folderItems?.length || 0} files`
                    : 'Direct download'}
                </div>
              </div>
            </div>

            {/* High-Contrast QR Code View */}
            <div className="w-56 h-56 mx-auto p-3.5 rounded-2xl bg-white flex flex-col items-center justify-center shadow-lg mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  shareUrl
                )}&color=000000&bgcolor=ffffff&qzone=1&margin=0`}
                alt="Scan to Download QR"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>

            <p className="text-[11.5px] text-white/50 text-center leading-relaxed mb-4 px-2">
              Scan with any phone camera or laptop webcam to download. No login required on the receiving device.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] active:scale-95 transition-all text-[12.5px] font-medium text-white cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" className="text-[#30D158]" />
                    <span className="text-[#30D158]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-95 transition-all text-[12.5px] font-medium text-white cursor-pointer shadow-md shadow-[#0A84FF]/20"
              >
                <ShareNetwork size={14} weight="bold" />
                <span>Share Link</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default ShareQrModal;
