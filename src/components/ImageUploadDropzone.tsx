import React, { useRef, useState } from 'react';
import { Upload, Camera, Clipboard, Trash2, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface Props {
  label?: string;
  sublabel?: string;
  imageUrl?: string;
  onImageChange: (dataUrl: string) => void;
  onRemove?: () => void;
  placeholderText?: string;
  maxHeightClass?: string;
  compact?: boolean;
  className?: string;
  id?: string;
}

export const ImageUploadDropzone: React.FC<Props> = ({
  label,
  sublabel,
  imageUrl,
  onImageChange,
  onRemove,
  placeholderText = 'Belum ada gambar terlampir',
  maxHeightClass = 'max-h-60',
  compact = false,
  className = '',
  id,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showFeedback('File yang dipilih bukan gambar valid.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, 1600, 1600, 0.82);
      onImageChange(compressed);
      showFeedback('✓ Gambar berhasil dimuat & dioptimalkan!', 'success');
    } catch (err: any) {
      console.error('Error processing image:', err);
      showFeedback('Gagal memproses gambar.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Paste event (e.g. from Windows Snipping Tool via Ctrl+V)
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        e.stopPropagation();
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
          return;
        }
      }
    }
  };

  // Handle clicking "Paste dari Clipboard" button
  const handleClipboardButtonClick = async () => {
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        setIsProcessing(true);
        const clipboardItems = await navigator.clipboard.read();
        let foundImage = false;

        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              foundImage = true;
              const blob = await item.getType(type);
              const file = new File([blob], 'snipping-tool-paste.png', { type });
              await processFile(file);
              return;
            }
          }
        }

        if (!foundImage) {
          showFeedback('Tidak ditemukan gambar di clipboard. Silakan gunakan Snipping Tool lalu coba lagi.', 'info');
        }
      } catch (err) {
        // Fallback: browser permission denied or not focused
        containerRef.current?.focus();
        showFeedback('Akses clipboard dibatasi browser. Silakan klik kotak ini lalu tekan Ctrl + V di keyboard.', 'info');
      } finally {
        setIsProcessing(false);
      }
    } else {
      containerRef.current?.focus();
      showFeedback('Silakan klik kotak ini lalu tekan Ctrl + V di keyboard untuk paste.', 'info');
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Header */}
      {(label || onRemove) && (
        <div className="flex items-center justify-between gap-2">
          <div>
            {label && <div className="text-xs font-bold text-slate-800">{label}</div>}
            {sublabel && <div className="text-[10.5px] text-slate-500 font-normal">{sublabel}</div>}
          </div>

          {imageUrl && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              title="Hapus gambar ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Gambar</span>
            </button>
          )}
        </div>
      )}

      {/* Dropzone & Paste Box */}
      <div
        id={id}
        ref={containerRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group rounded-xl transition-all duration-200 outline-hidden select-none ${
          isDragging
            ? 'border-2 border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/20'
            : imageUrl
            ? 'border border-slate-300 bg-white p-2 hover:border-slate-400 focus:ring-2 focus:ring-emerald-500/40'
            : 'border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/80 hover:bg-emerald-50/20 p-4 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'
        }`}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs z-20 flex flex-col items-center justify-center rounded-xl text-emerald-900 text-xs font-bold gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Memproses &amp; Mengoptimalkan Gambar...</span>
          </div>
        )}

        {imageUrl ? (
          /* Preview Existing Image */
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full flex justify-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <img
                src={imageUrl}
                alt={label || 'Gambar Terlampir'}
                className={`w-full ${maxHeightClass} object-contain transition group-hover:scale-[1.01]`}
              />
            </div>

            {/* Quick Actions overlay/bar below image */}
            <div className="mt-2.5 flex items-center justify-between w-full text-xs gap-2 flex-wrap">
              <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Gambar Terpasang</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleClipboardButtonClick}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition shadow-2xs cursor-pointer"
                  title="Paste gambar baru dari Snipping Tool (Ctrl+V)"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-300 transition cursor-pointer"
                  title="Pilih file gambar lain"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti File</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Placeholder with Direct Paste & Upload Controls */
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 flex items-center justify-center mb-2 shadow-2xs group-hover:scale-110 transition duration-200">
              <ImageIcon className="w-6 h-6" />
            </div>

            <div className="text-xs font-extrabold text-slate-900 mb-0.5">
              {placeholderText}
            </div>

            <div className="text-[11px] text-slate-500 font-medium mb-3 max-w-xs leading-snug">
              Bisa langsung tekan <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded border border-slate-300">Ctrl + V</kbd> setelah screenshot dengan <strong>Snipping Tool</strong>, atau klik tombol di bawah:
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* Paste Button */}
              <button
                type="button"
                onClick={handleClipboardButtonClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                title="Paste screenshot langsung dari Snipping Tool (Ctrl+V)"
              >
                <Clipboard className="w-4 h-4" />
                <span>📋 Paste dari Snipping Tool</span>
              </button>

              {/* Upload File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih File</span>
              </button>

              {/* Mobile Camera Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden inputs for File & Camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in duration-150 ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-900 border border-red-200'
              : feedback.type === 'info'
              ? 'bg-blue-50 text-blue-900 border border-blue-200'
              : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
};
