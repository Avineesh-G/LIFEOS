import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DownloadSimple,
  Folder,
  FileText,
  FilePdf,
  FileImage,
  WarningCircle,
  CheckCircle,
  ArrowSquareOut,
  House,
  CloudArrowDown,
} from '../ui/tokens/icons';
import { getPublicShareRecord, formatStorageSize } from '../services/driveStorageService';
import type { PublicShareRecord } from '../types';

export default function PublicShareView() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<PublicShareRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!shareId) {
      setLoading(false);
      return;
    }

    getPublicShareRecord(shareId)
      .then((data) => {
        if (isMounted) {
          setRecord(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  const triggerDirectDownload = (url: string, filename: string, id: string) => {
    setDownloadingId(id);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadingId(null), 1500);
  };

  const getFileIcon = (filename: string, mime?: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || mime?.startsWith('image/')) {
      return <FileImage size={24} weight="duotone" className="text-[#30D158]" />;
    }
    if (ext === 'pdf' || mime?.includes('pdf')) {
      return <FilePdf size={24} weight="duotone" className="text-[#FF453A]" />;
    }
    return <FileText size={24} weight="duotone" className="text-[#0A84FF]" />;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-[#0A84FF]/30 font-sans">
      {/* Top Navbar */}
      <header
        className="w-full max-w-xl mx-auto px-4 pb-4 flex items-center justify-between border-b border-white/10"
        style={{
          paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 24px) + 8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
            <CloudArrowDown size={18} weight="duotone" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">
            LifeOS Drive
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[12px] font-medium text-white/50 hover:text-white flex items-center gap-1 transition-colors"
        >
          <House size={14} weight="bold" />
          <span>Open LifeOS</span>
        </button>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-md mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="p-8 rounded-3xl bg-[#1C1C1E] border border-white/10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-white/60">Fetching shared document...</p>
          </div>
        ) : !record || record.isRevoked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-[#1C1C1E] border border-red-500/20 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
              <WarningCircle size={26} weight="duotone" />
            </div>
            <h2 className="text-[18px] font-bold text-white">
              Link Inactive or Revoked
            </h2>
            <p className="text-[13px] text-white/50 max-w-xs mx-auto leading-relaxed">
              This shared file is no longer available. The link may have expired or was revoked by the owner.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-7 rounded-[32px] bg-[#1C1C1E] border border-white/10 space-y-5 shadow-2xl"
          >
            {/* Header info */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center shrink-0">
                {record.type === 'folder' ? (
                  <Folder size={28} weight="duotone" className="text-[#FF9F0A]" />
                ) : (
                  getFileIcon(record.title, record.mimeType)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#0A84FF]">
                  Shared via QR Link
                </span>
                <h1 className="text-[18px] font-bold text-white tracking-tight truncate mt-0.5">
                  {record.title}
                </h1>
                <p className="text-[12px] text-white/50">
                  {formatStorageSize(record.fileSize)} · {record.type === 'folder' ? `${record.folderItems?.length || 0} items` : '1 file'}
                </p>
              </div>
            </div>

            {/* Single File Download */}
            {record.type === 'file' ? (
              <div className="space-y-4 pt-1">
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(record.downloadUrl, record.title, 'primary')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold text-[14px] text-white shadow-lg shadow-[#0A84FF]/25 cursor-pointer"
                >
                  {downloadingId === 'primary' ? (
                    <>
                      <CheckCircle size={18} weight="bold" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <DownloadSimple size={18} weight="bold" />
                      <span>Download File ({formatStorageSize(record.fileSize)})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Folder Items Download */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[12px] text-white/50 px-1">
                  <span>Files inside folder ({record.folderItems?.length || 0})</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 no-scrollbar">
                  {(record.folderItems || []).map((file, idx) => (
                    <div
                      key={file.id || idx}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {getFileIcon(file.name, file.mimeType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {formatStorageSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerDirectDownload(file.downloadUrl, file.name, file.id)}
                        className="p-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors shrink-0"
                        title="Download file"
                      >
                        <DownloadSimple size={16} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[11.5px] text-white/40">
        LifeOS Cloud Drive · 5.0 GB Secure Storage
      </footer>
    </div>
  );
}

