import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, ArrowClockwise, SpinnerGap, Folder } from '../../ui/tokens/icons';
import { compressImageDataUrl, AttachedImage } from '../../utils/imagePicker';
import { triggerHaptic } from '../../utils/haptics';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptured: (image: AttachedImage) => void;
  onFallbackToFile: () => void;
}

export default function WebcamCaptureModal({
  isOpen,
  onClose,
  onCaptured,
  onFallbackToFile,
}: WebcamCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch (err: any) {
      console.warn('[Webcam] Access failed:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera access in your browser settings, or choose a file.'
          : 'No camera was found on your laptop/device. You can choose a file instead.'
      );
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || capturing) return;

    triggerHaptic('medium');
    setCapturing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context failed');

      // Draw current video frame
      ctx.drawImage(video, 0, 0, width, height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Compress to optimal size (<300KB)
      const compressed = await compressImageDataUrl(rawDataUrl);

      stopCamera();
      triggerHaptic('success');
      onCaptured({
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        dataUrl: compressed,
        mimeType: 'image/jpeg',
      });
      onClose();
    } catch (err: any) {
      setError('Failed to capture snapshot: ' + (err.message || 'Error'));
    } finally {
      setCapturing(false);
    }
  };

  const handleToggleCamera = () => {
    triggerHaptic('light');
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#1C1C1E] border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center">
              <Camera size={16} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Camera Capture</h3>
              <p className="text-[11px] text-white/50">Hold your notes or paper in front of the lens</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 bg-[#121214]">
              <SpinnerGap size={28} className="animate-spin text-[#0A84FF]" />
              <span className="text-xs">Starting camera...</span>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center space-y-3 bg-[#121214] w-full h-full flex flex-col items-center justify-center">
              <p className="text-xs text-red-400 font-medium leading-relaxed max-w-xs">{error}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackToFile();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 transition-all flex items-center gap-2 shadow"
              >
                <Folder size={14} weight="bold" />
                <span>Choose Image from Files Instead</span>
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Guidelines Overlay */}
          {!loading && !error && (
            <div className="absolute inset-4 border border-dashed border-white/30 rounded-2xl pointer-events-none flex items-end justify-center pb-2">
              <span className="text-[10px] bg-black/60 px-2.5 py-1 rounded-full text-white/70">
                Fit page inside frame
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {!error && (
          <div className="p-4 flex items-center justify-between border-t border-white/10 bg-[#18181A]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onFallbackToFile();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Folder size={14} />
              <span>Use File</span>
            </button>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={loading || capturing}
              className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-transform cursor-pointer shadow-lg"
              title="Take Photo"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-white/90 transition-colors flex items-center justify-center">
                {capturing ? (
                  <SpinnerGap size={20} className="animate-spin text-black" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={handleToggleCamera}
              disabled={loading}
              className="w-9 h-9 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              title="Flip camera"
            >
              <ArrowClockwise size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

