import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUp,
  FolderSimplePlus,
  Folder,
  FileText,
  FilePdf,
  FileImage,
  ShareNetwork,
  Trash,
  MagnifyingGlass,
  CaretLeft,
  CheckCircle,
  WarningCircle,
  X,
  HardDrive,
  BookOpen,
  Camera,
  ImageIcon,
} from '../ui/tokens/icons';
import { LargeTitleHeader } from '../ui/navigation/LargeTitleHeader';
import { triggerHaptic } from '../utils/haptics';
import { navigateBack } from '../utils/backNavigation';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import { capturePhotoFromCamera } from '../utils/imagePicker';
import {
  MAX_DRIVE_STORAGE_BYTES,
  formatStorageSize,
  uploadDriveFile,
  deleteDriveFile,
  checkStorageQuota,
  UploadControlHandle,
} from '../services/driveStorageService';
import { FileReaderModal } from '../components/drive/FileReaderModal';
import type { AppData, DriveFile, DriveFolder } from '../types';

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

interface DriveProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

const FOLDER_COLORS = [
  '#9F1239', // Burgundy / Wine (User requested)
  '#0A84FF', // Electric Blue (LifeOS Primary)
  '#30D158', // Emerald Green (Health / Nutrition)
  '#FF9F0A', // Warm Amber (Timetable / Focus)
  '#BF5AF2', // Amethyst Violet (Notes / AI)
  '#FF453A', // Crimson Rose (Vitality / Gym)
  '#14B8A6', // Jewel Teal (Finance / Stability)
  '#64D2FF', // Sky Blue (Drive / Cloud)
];

export default function Drive({ data, updateData }: DriveProps) {
  const navigate = useNavigate();
  const { confirmDelete } = useM3Feedback();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadBytes, setUploadBytes] = useState<{ transferred: number; total: number } | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active upload cancellation handle
  const uploadControlRef = useRef<UploadControlHandle | null>(null);

  // New folder dialog state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  // File Reader modal state (Reading mode)
  const [activeReadingFile, setActiveReadingFile] = useState<DriveFile | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const handleOpenFile = (file: DriveFile) => {
    triggerHaptic('light');
    setActiveReadingFile(file);
    setIsReaderOpen(true);
  };

  // Hidden file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Native Android Upload Action Sheet
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);

  // Storage calculation
  const allFiles = useMemo(() => data.driveFiles || [], [data.driveFiles]);
  const allFolders = useMemo(() => data.driveFolders || [], [data.driveFolders]);

  const usedBytes = useMemo(() => {
    return allFiles.reduce((acc: number, f: DriveFile) => acc + (Number(f.fileSize) || 0), 0);
  }, [allFiles]);

  const usedPercent = useMemo(() => {
    return Math.min(100, (usedBytes / MAX_DRIVE_STORAGE_BYTES) * 100);
  }, [usedBytes]);

  const isQuotaFull = usedBytes >= MAX_DRIVE_STORAGE_BYTES;

  // Categorized bytes
  const categoryStats = useMemo(() => {
    let docs = 0;
    let images = 0;
    let media = 0;
    let other = 0;

    allFiles.forEach((f: DriveFile) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      const size = Number(f.fileSize) || 0;
      if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'xlsx', 'pptx'].includes(ext)) {
        docs += size;
      } else if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'svg'].includes(ext)) {
        images += size;
      } else if (['mp3', 'wav', 'm4a', 'mp4', 'mov', 'mkv'].includes(ext)) {
        media += size;
      } else {
        other += size;
      }
    });

    return { docs, images, media, other };
  }, [allFiles]);

  // Current folder breadcrumb
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return allFolders.find((f: DriveFolder) => f.id === currentFolderId) || null;
  }, [currentFolderId, allFolders]);

  // Visible items inside current folder
  const visibleFolders = useMemo(() => {
    if (currentFolderId) return [];
    return allFolders.filter((f: DriveFolder) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [allFolders, currentFolderId, searchQuery]);

  const visibleFiles = useMemo(() => {
    let list = allFiles.filter((f: DriveFile) => (f.folderId || null) === currentFolderId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f: DriveFile) => f.name.toLowerCase().includes(q));
    }

    return list.sort((a: DriveFile, b: DriveFile) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allFiles, currentFolderId, searchQuery, sortBy]);

  // Cancel in-flight upload
  const handleCancelUpload = () => {
    triggerHaptic('medium');
    if (uploadControlRef.current) {
      uploadControlRef.current.cancel();
    }
    setIsUploading(false);
    setUploadingFileName('');
    setUploadPercent(0);
    setUploadBytes(null);
    setUploadError('Upload cancelled.');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Perform upload for a list of File objects
  const performUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    const updatedFileList = [...allFiles];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadingFileName(file.name);
        setUploadPercent(5);
        setUploadBytes({ transferred: 0, total: file.size });

        // Pre-check quota
        const quota = checkStorageQuota(file.size, { ...data, driveFiles: updatedFileList });
        if (!quota.allowed) {
          throw new Error(
            `Cannot upload "${file.name}": Storage quota reached (${formatStorageSize(
              quota.currentUsedBytes
            )} of 5.0 GB used). Delete files to free space.`
          );
        }

        const uploaded = await uploadDriveFile(
          file,
          currentFolderId,
          { ...data, driveFiles: updatedFileList },
          (percent, transferred, total) => {
            setUploadPercent(percent);
            if (total > 0) {
              setUploadBytes({ transferred, total });
            }
          },
          uploadControlRef
        );

        updatedFileList.push(uploaded);
      }

      setUploadPercent(100);
      await updateData({ driveFiles: updatedFileList });
      triggerHaptic('success');
      // Visibly show 100% completion state for 450ms before hiding banner
      await new Promise((r) => setTimeout(r, 450));
    } catch (err: any) {
      if (err?.message === 'UPLOAD_CANCELLED') {
        setUploadError('Upload cancelled.');
      } else {
        console.error('File upload error:', err);
        setUploadError(err?.message || 'Upload failed. Check connection.');
      }
      triggerHaptic('error');
    } finally {
      setIsUploading(false);
      setUploadingFileName('');
      setUploadPercent(0);
      setUploadBytes(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Handle multi-file upload from input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await performUpload(Array.from(files));
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const newFolder: DriveFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateData({ driveFolders: [...allFolders, newFolder] });
    triggerHaptic('success');
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  // Delete file with native application confirmation dialog
  const handleDeleteFile = async (file: DriveFile) => {
    await confirmDelete({
      title: 'Delete Document?',
      itemName: file.name,
      message: `Are you sure you want to permanently delete "${file.name}"? This will free up ${formatStorageSize(file.fileSize)} of your 5.0 GB storage.`,
      section: 'drive',
      confirmLabel: 'Delete File',
      cancelLabel: 'Keep File',
      onConfirm: async () => {
        triggerHaptic('medium');
        const filtered = allFiles.filter((f: DriveFile) => f.id !== file.id);
        await updateData({ driveFiles: filtered });
        if (activeReadingFile?.id === file.id) {
          setIsReaderOpen(false);
          setActiveReadingFile(null);
        }
        deleteDriveFile(file).catch(() => { });
      },
    });
  };

  // Delete folder with native application confirmation dialog
  const handleDeleteFolder = async (folder: DriveFolder) => {
    const filesInFolder = allFiles.filter((f: DriveFile) => f.folderId === folder.id);
    const msg = filesInFolder.length > 0
      ? `Are you sure you want to delete folder "${folder.name}" and all ${filesInFolder.length} files inside it?`
      : `Are you sure you want to delete empty folder "${folder.name}"?`;

    await confirmDelete({
      title: 'Delete Folder?',
      itemName: folder.name,
      message: msg,
      section: 'drive',
      confirmLabel: 'Delete Folder',
      cancelLabel: 'Keep Folder',
      onConfirm: async () => {
        triggerHaptic('medium');
        for (const file of filesInFolder) {
          deleteDriveFile(file).catch(() => { });
        }
        const updatedFiles = allFiles.filter((f: DriveFile) => f.folderId !== folder.id);
        const updatedFolders = allFolders.filter((f: DriveFolder) => f.id !== folder.id);
        await updateData({ driveFiles: updatedFiles, driveFolders: updatedFolders });
        if (currentFolderId === folder.id) setCurrentFolderId(null);
      },
    });
  };

  // Native share sheet
  const handleNativeShare = async (file: DriveFile) => {
    triggerHaptic('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `File: ${file.name} (${formatStorageSize(file.fileSize)})`,
          url: file.downloadUrl,
        });
      } catch {
        // User cancelled
      }
    } else if (file.downloadUrl) {
      try {
        await navigator.clipboard.writeText(file.downloadUrl);
        triggerHaptic('success');
      } catch { }
    }
  };

  // File icon or thumbnail preview with dynamic folder color matching
  const getFileIcon = (file: DriveFile, accentColor: string = '#0A84FF') => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Render image thumbnail preview if available
    if (file.localCachedUri && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(ext)) {
      return (
        <img
          src={file.localCachedUri}
          alt={file.name}
          className="w-full h-full object-cover rounded-xl"
          loading="lazy"
        />
      );
    }

    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(ext) || file.mimeType?.startsWith('image/')) {
      return <FileImage size={22} weight="duotone" style={{ color: accentColor }} />;
    }
    if (ext === 'pdf' || file.mimeType?.includes('pdf')) {
      return <FilePdf size={22} weight="duotone" style={{ color: accentColor }} />;
    }
    return <FileText size={22} weight="duotone" style={{ color: accentColor }} />;
  };

  return (
    <div className="w-full text-white selection:bg-[#0A84FF]/30 pb-20 select-none font-sans">
      {/* ── Standard Large Title Header Bar ── */}
      <LargeTitleHeader
        title={currentFolder ? currentFolder.name : "Drive & Docs"}
        subtitle={currentFolder ? "Folder · Cloud Storage" : "Cloud Storage · 5.0 GB Quota"}
        tint={currentFolder?.color || "#0A84FF"}
        onBack={() => {
          if (isUploadSheetOpen) {
            setIsUploadSheetOpen(false);
          } else if (isReaderOpen) {
            setIsReaderOpen(false);
            setActiveReadingFile(null);
          } else if (isNewFolderOpen) {
            setIsNewFolderOpen(false);
          } else if (currentFolderId) {
            setCurrentFolderId(null);
          } else {
            navigateBack(navigate);
          }
        }}
        actions={
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/[0.06] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsNewFolderOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-[12px] font-semibold cursor-pointer"
                title="Create New Folder"
              >
                <FolderSimplePlus size={15} weight="bold" className="text-[#0A84FF]" />
                <span className="hidden sm:inline">Folder</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsUploadSheetOpen(true);
                }}
                disabled={isQuotaFull || isUploading}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-95 transition-all text-[12px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#0A84FF]/30 cursor-pointer touch-manipulation"
              >
                <CloudArrowUp size={15} weight="bold" />
                <span>Upload</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        }
      />

      {/* ── 5.0 GB Storage Filler Gauge ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#1C1C1E] border border-white/10 mb-4 space-y-3">
        <div className="flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2">
            <HardDrive size={16} weight="duotone" className="text-[#0A84FF]" />
            <span className="font-bold text-white tracking-tight">Storage Capacity</span>
          </div>
          <span className="font-semibold text-white/60 font-stat">
            {formatStorageSize(usedBytes)} / 5.0 GB
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-white/[0.08] overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(1, usedPercent)}%`,
              backgroundColor: usedPercent >= 95 ? '#FF453A' : usedPercent >= 80 ? '#FF9F0A' : '#0A84FF',
            }}
          />
        </div>

        {/* Capacity Breakdown */}
        <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
              Docs: {formatStorageSize(categoryStats.docs)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#30D158]" />
              Images: {formatStorageSize(categoryStats.images)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#BF5AF2]" />
              Media: {formatStorageSize(categoryStats.media)}
            </span>
          </div>

          <span className="font-medium text-white/70">
            {usedPercent.toFixed(1)}% full
          </span>
        </div>

        {/* Warning if full */}
        {isQuotaFull && (
          <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center gap-2 text-[12px] text-red-400">
            <WarningCircle size={16} weight="bold" className="shrink-0" />
            <span>Storage limit reached (5.0 GB). Delete files to free up space.</span>
          </div>
        )}
      </div>

      {/* ── Active Upload Bar with Cancel / Delete Option ── */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-4 h-4 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-white truncate">
                  Uploading {uploadingFileName}...
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] font-bold text-[#0A84FF] tabular-nums">
                    {uploadPercent}%
                  </span>
                  <span className="text-[11px] text-white/60">
                    {uploadPercent >= 100 ? 'Completed' : 'uploading...'}
                  </span>
                  {uploadBytes && uploadBytes.total > 0 && (
                    <span className="text-[11px] text-white/40 truncate">
                      • {formatStorageSize(uploadBytes.transferred)} of {formatStorageSize(uploadBytes.total)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cancel / Delete button on the upload bar */}
            {uploadPercent < 100 && (
              <button
                type="button"
                onClick={handleCancelUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-400 text-[12px] font-semibold transition-all shrink-0 cursor-pointer border border-red-500/30 touch-manipulation"
                title="Cancel and delete this upload"
              >
                <Trash size={14} weight="bold" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {/* Smooth animated progress track */}
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0A84FF] to-[#30D158] transition-all duration-150 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, uploadPercent))}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Upload Error / Notice Banner */}
      {uploadError && (
        <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 mb-4 flex items-center justify-between text-[12px] text-white/80">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 text-white/50 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or folders..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-[#0A84FF]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort documents"
          className="py-2.5 px-3 rounded-2xl bg-white/[0.06] border border-white/10 text-[12px] text-white/80 focus:outline-none"
        >
          <option value="date" className="bg-[#1C1C1E]">Recent</option>
          <option value="name" className="bg-[#1C1C1E]">Name</option>
          <option value="size" className="bg-[#1C1C1E]">Size</option>
        </select>
      </div>

      {/* ── Breadcrumb Navigation ── */}
      {currentFolder && (
        <div className="flex items-center gap-2 mb-3 text-[13px] px-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setCurrentFolderId(null);
            }}
            className="flex items-center gap-1 text-[#0A84FF] hover:underline font-medium cursor-pointer"
          >
            <CaretLeft size={16} weight="bold" />
            <span>All Files</span>
          </button>
          <span className="text-white/30">/</span>
          <span className="text-white font-semibold truncate">{currentFolder.name}</span>
        </div>
      )}

      {/* ── Folders Grid (Root View Only) ── */}
      {!currentFolderId && visibleFolders.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="text-[12px] font-semibold text-white/50 px-1 uppercase tracking-wider">
            Folders ({visibleFolders.length})
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {visibleFolders.map((folder: DriveFolder) => {
              const filesInThisFolder = allFiles.filter((f: DriveFile) => f.folderId === folder.id);
              const folderSize = filesInThisFolder.reduce((acc: number, f: DriveFile) => acc + (f.fileSize || 0), 0);

              return (
                <div
                  key={folder.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    setCurrentFolderId(folder.id);
                  }}
                  className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${folder.color || '#0A84FF'}20`, color: folder.color || '#0A84FF' }}
                    >
                      <Folder size={20} weight="duotone" />
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDeleteFolder(folder)}
                        title="Delete folder"
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[14px] font-semibold text-white tracking-tight truncate">
                      {folder.name}
                    </h3>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {filesInThisFolder.length} files · {formatStorageSize(folderSize)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Files List ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">
            {currentFolder ? `Files in ${currentFolder.name}` : 'All Documents'} ({visibleFiles.length})
          </span>
        </div>

        {visibleFiles.length === 0 ? (
          <div className="py-12 px-4 rounded-3xl bg-[#1C1C1E] border border-white/[0.08] text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] text-white/40 flex items-center justify-center mx-auto">
              <FileText size={24} weight="duotone" />
            </div>
            <h3 className="text-[15px] font-semibold text-white">No files here</h3>
            <p className="text-[12.5px] text-white/40 max-w-xs mx-auto">
              {searchQuery ? 'No documents matched your search.' : 'Tap "Upload" to upload PDFs, notes, certificates, or pictures.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsUploadSheetOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A84FF] text-[13px] font-semibold text-white shadow-md active:scale-95 transition-all touch-manipulation cursor-pointer"
              >
                <CloudArrowUp size={16} weight="bold" />
                <span>Upload Document</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleFiles.map((file: DriveFile) => {
              const parentFolder = file.folderId
                ? allFolders.find((f: DriveFolder) => f.id === file.folderId)
                : currentFolder;
              const fileAccent = parentFolder?.color || currentFolder?.color || '#0A84FF';

              return (
                <div
                  key={file.id}
                  className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                >
                  {/* File Icon / Thumbnail & Info (Click to Open Reader) */}
                  <div
                    onClick={() => handleOpenFile(file)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border transition-all"
                      style={{
                        backgroundColor: `${fileAccent}18`,
                        borderColor: `${fileAccent}35`,
                      }}
                    >
                      {getFileIcon(file, fileAccent)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-[13.5px] font-semibold text-white truncate transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                      <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{formatStorageSize(file.fileSize)} · {new Date(file.createdAt).toLocaleDateString()}</span>
                        {parentFolder && !currentFolder && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide"
                            style={{ backgroundColor: `${parentFolder.color}22`, color: parentFolder.color }}
                          >
                            {parentFolder.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* File Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Read / View File Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenFile(file)}
                      title="Open in Reader Mode"
                      className="p-2 rounded-xl text-[#0A84FF] hover:bg-[#0A84FF]/15 active:scale-95 transition-all cursor-pointer"
                    >
                      <BookOpen size={18} weight="bold" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNativeShare(file)}
                      title="Share link"
                      className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
                    >
                      <ShareNetwork size={18} weight="duotone" />
                    </button>

                    {/* Prominent Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file)}
                      title="Delete file"
                      className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash size={18} weight="duotone" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New Folder Dialog Modal ── */}
      <AnimatePresence>
        {isNewFolderOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-[28px] bg-[#1C1C1E] border border-white/10 p-5 sm:p-6 text-white space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${newFolderColor}22`, color: newFolderColor }}
                  >
                    <FolderSimplePlus size={18} weight="duotone" />
                  </div>
                  <h3 className="text-[16px] font-bold text-white">Create New Folder</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="text-[12px] text-white/50 mb-1.5 block">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Academics, Receipts, Certificates"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-[13.5px] text-white placeholder-white/30 focus:outline-none transition-colors"
                  style={{ borderColor: `${newFolderColor}60` }}
                />
              </div>

              <div>
                <label className="text-[12px] text-white/50 mb-1.5 block">Color Accent</label>
                <div className="grid grid-cols-4 gap-2.5 sm:flex sm:items-center">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNewFolderColor(c);
                      }}
                      className="w-8 h-8 rounded-full transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-sm"
                      style={{
                        backgroundColor: c,
                        boxShadow: newFolderColor === c ? `0 0 0 2px #1C1C1E, 0 0 0 4px ${c}` : 'none',
                      }}
                    >
                      {newFolderColor === c && <CheckCircle size={15} weight="bold" className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 text-[13px] font-medium text-white/80 cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 cursor-pointer active:scale-95 transition-all shadow-md"
                  style={{ backgroundColor: newFolderColor }}
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Native Android Mobile Upload Action Sheet ── */}
      <AnimatePresence>
        {isUploadSheetOpen && (
          <>
            <div
              className="fixed inset-0 z-[110] bg-black/60"
              onClick={() => setIsUploadSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[120] rounded-t-[32px] bg-[#1C1C1E] border-t border-white/10 p-5 shadow-2xl flex flex-col gap-3 select-none"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
              }}
            >
              <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-2" />

              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-[15px] font-bold text-white tracking-tight">Upload to Drive</h3>
                <button
                  type="button"
                  onClick={() => setIsUploadSheetOpen(false)}
                  className="p-1 rounded-full text-white/50 hover:text-white"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Option 1: Native Camera / Document Scan */}
              <button
                type="button"
                onClick={async () => {
                  setIsUploadSheetOpen(false);
                  triggerHaptic('medium');
                  try {
                    const photo = await capturePhotoFromCamera();
                    if (photo?.dataUrl) {
                      const file = dataUrlToFile(photo.dataUrl, `Scan_${Date.now()}.jpg`);
                      await performUpload([file]);
                    }
                  } catch (err) {
                    console.warn('Camera capture cancelled or failed:', err);
                  }
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left cursor-pointer border border-white/[0.06] touch-manipulation"
              >
                <div className="w-11 h-11 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center shrink-0">
                  <Camera size={22} weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-white">Camera / Scan Document</div>
                  <div className="text-[11.5px] text-white/50">Capture receipt, assignment, or document</div>
                </div>
              </button>

              {/* Option 2: Photo Gallery */}
              <button
                type="button"
                onClick={() => {
                  setIsUploadSheetOpen(false);
                  triggerHaptic('light');
                  galleryInputRef.current?.click();
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left cursor-pointer border border-white/[0.06] touch-manipulation"
              >
                <div className="w-11 h-11 rounded-xl bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0">
                  <ImageIcon size={22} weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-white">Photo Gallery</div>
                  <div className="text-[11.5px] text-white/50">Select photos and screenshots from gallery</div>
                </div>
              </button>

              {/* Option 3: Device Files / Documents */}
              <button
                type="button"
                onClick={() => {
                  setIsUploadSheetOpen(false);
                  triggerHaptic('light');
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left cursor-pointer border border-white/[0.06] touch-manipulation"
              >
                <div className="w-11 h-11 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center shrink-0">
                  <FileText size={22} weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-white">Files & Documents</div>
                  <div className="text-[11.5px] text-white/50">Browse device storage for PDFs, sheets, or notes</div>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── File Reader & AI Intelligence Modal ── */}
      <FileReaderModal
        file={activeReadingFile}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setActiveReadingFile(null);
        }}
        onDeleteFile={handleDeleteFile}
        data={data}
        updateData={updateData}
      />
    </div>
  );
}
