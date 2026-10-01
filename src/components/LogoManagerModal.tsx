import React, { useRef, useState } from 'react';
import { CiputraLogo } from './CiputraLogo';
import { compressImage } from '../utils/imageUtils';
import { Image as ImageIcon, Upload, RefreshCw, Check, X, Trash2 } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // Compress logo to max 500px width/height, preserving crispness
      const compressed = await compressImage(file, 500, 300, 0.9);
      setTempLogo(compressed);
    } catch (err) {
      console.error('Logo upload error:', err);
      setErrorMsg('Gagal memproses file gambar logo. Pastikan file berupa JPG/PNG.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleResetToDefault = () => {
    setTempLogo(null);
  };

  const handleApply = () => {
    onSaveLogo(tempLogo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Ganti / Upload Logo Dokumen</h3>
              <p className="text-[11px] text-slate-300">
                Logo akan diterapkan di header PDF A4 & cetak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
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

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? 'Memproses...' : 'Upload Logo Baru'}
            </button>

            {tempLogo && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset ke Default
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Format didukung: PNG (transparan disarankan), JPG, SVG, WebP.
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
