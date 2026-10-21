import React, { useRef, useState } from 'react';
import { CiputraLogo } from './CiputraLogo';
import { compressImage } from '../utils/imageUtils';
import { Image as ImageIcon, Upload, RefreshCw, Check, X, Clipboard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customLogoUrl: string | null;
  onSaveLogo: (logoUrl: string | null) => void;
}

export const LogoManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customLogoUrl,
  onSaveLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tempLogo, setTempLogo] = useState<string | null>(customLogoUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const processLogoFile = async (file: File | Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Compress logo to max 500px width/height, preserving crispness
      const compressed = await compressImage(file, 500, 300, 0.9);
      setTempLogo(compressed);
      setSuccessMsg('✓ Logo berhasil dimuat!');
    } catch (err) {
      console.error('Logo upload error:', err);
      setErrorMsg('Gagal memproses file gambar logo. Pastikan file berupa JPG/PNG.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processLogoFile(file);
    e.target.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          await processLogoFile(file);
          return;
        }
      }
    }
  };

  const handleClipboardButtonClick = async () => {
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        setIsProcessing(true);
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              await processLogoFile(blob);
              return;
            }
          }
        }
        setErrorMsg('Tidak ditemukan gambar di clipboard. Copy logo dengan Snipping Tool lalu coba lagi.');
      } catch {
        setErrorMsg('Akses clipboard dibatasi browser. Silakan klik jendela ini lalu tekan Ctrl + V.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setErrorMsg('Silakan klik jendela ini lalu tekan Ctrl + V pada keyboard.');
    }
  };

  const handleResetToDefault = () => {
    setTempLogo(null);
    setSuccessMsg(null);
  };

  const handleApply = () => {
    onSaveLogo(tempLogo);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      tabIndex={0}
      onPaste={handlePaste}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header (Clean White / Light Theme) */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Ganti / Upload Logo Dokumen</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bisa paste dari Snipping Tool (Ctrl+V) atau upload file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-600">
            Preview Logo Dokumen Saat Ini:
          </div>

          {/* Current Logo Preview Card */}
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center min-h-[120px]">
            <CiputraLogo customLogoUrl={tempLogo} size="lg" />
            <div className="text-[11px] text-slate-500 font-medium mt-2">
              {tempLogo ? '✓ Memakai Logo Kustom Anda' : '✓ Memakai Logo Default Hotel Ciputra Jakarta'}
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
              {successMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleClipboardButtonClick}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Paste screenshot logo dari Snipping Tool (Ctrl+V)"
            >
              <Clipboard className="w-4 h-4 text-slate-950" />
              <span>Paste Snipping Tool</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses...' : 'Upload File'}</span>
            </button>
          </div>

          {tempLogo && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset ke Default
              </button>
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center">
            Tips: Copy logo dengan Snipping Tool (Win+Shift+S) lalu klik "Paste Snipping Tool" atau tekan Ctrl+V
          </p>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow-xs"
          >
            <Check className="w-4 h-4" />
            Terapkan Logo
          </button>
        </div>
      </div>
    </div>
  );
};
