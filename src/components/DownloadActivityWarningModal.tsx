import React from 'react';
import { AlertTriangle, Camera, FileText, Download, X, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { LogBookItem } from '../types';

export interface IncompleteActivityItem {
  index: number;
  no: number;
  details?: string;
  pictureUrl?: string;
  issueType: 'photo_without_details' | 'details_without_photo';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onJumpToActivity: (index: number) => void;
  isPrintAction?: boolean;
  incompleteItems: IncompleteActivityItem[];
}

export const DownloadActivityWarningModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  onJumpToActivity,
  isPrintAction = false,
  incompleteItems,
}) => {
  if (!isOpen) return null;

  const photoWithoutDetails = incompleteItems.filter(
    (item) => item.issueType === 'photo_without_details'
  );
  const detailsWithoutPhoto = incompleteItems.filter(
    (item) => item.issueType === 'details_without_photo'
  );

  const actionText = isPrintAction ? 'Mencetak Lembar A4' : 'Mengunduh PDF A4';
  const confirmButtonText = isPrintAction ? 'Tetap Lanjut Cetak' : 'Tetap Unduh PDF';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500 text-slate-950 flex items-center justify-between border-b border-amber-600/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 rounded-xl text-slate-950 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                Peringatan Sebelum {actionText}
              </h3>
              <p className="text-[11px] font-semibold text-amber-950/80">
                Pemeriksaan kelengkapan foto &amp; deskripsi IT Log Book
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-950 hover:bg-amber-400 transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Photo exists but Details is empty (CRITICAL) */}
          {photoWithoutDetails.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-950 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-xs text-red-900">
                    Foto Ada, Tetapi Activities Details Belum Diisi ({photoWithoutDetails.length} item)
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
                    Terdapat foto dokumentasi yang telah dilampirkan, tetapi kolom{' '}
                    <strong>Activities Details (Deskripsi Kasus / Pekerjaan)</strong> masih kosong.{' '}
                    <span className="font-bold underline">
                      Sesuai aturan sistem, baris tanpa deskripsi tidak akan ikut tercetak pada PDF A4
                    </span>
                    , sehingga foto ini tidak akan tampil.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {photoWithoutDetails.map((item) => (
                  <div
                    key={item.index}
                    className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-red-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.pictureUrl ? (
                        <img
                          src={item.pictureUrl}
                          alt={`Foto Aktivitas #${item.no}`}
                          className="w-11 h-11 object-cover rounded-md border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs">
                          Aktivitas #{item.no}
                        </div>
                        <div className="text-[10.5px] text-red-600 font-semibold italic truncate">
                          Deskripsi kasus / pekerjaan belum diisi
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJumpToActivity(item.index)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-bold shrink-0 transition cursor-pointer shadow-2xs"
                      title="Lengkapi deskripsi aktivitas ini"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Isi Deskripsi</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Details filled but Photo is missing */}
          {detailsWithoutPhoto.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2.5">
              <div className="flex items-start gap-2">
                <Camera className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-xs text-amber-900">
                    Aktivitas Belum Memiliki Foto Dokumentasi ({detailsWithoutPhoto.length} item)
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                    Aktivitas berikut memiliki deskripsi pekerjaan namun belum melampirkan foto dokumentasi.
                    Jika aktivitas ini tidak memerlukan foto (misal panduan telepon atau remote support), Anda dapat tetap mengunduh PDF.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                {detailsWithoutPhoto.map((item) => (
                  <div
                    key={item.index}
                    className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-amber-200 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold inline-flex items-center justify-center">
                          {item.no}
                        </span>
                        <span>Aktivitas #{item.no}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-600 line-clamp-1 mt-0.5 font-medium">
                        "{item.details || '-'}"
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJumpToActivity(item.index)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold shrink-0 transition cursor-pointer shadow-2xs"
                      title="Unggah foto dokumentasi aktivitas ini"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Unggah Foto</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer text-center"
          >
            ← Kembali &amp; Lengkapi Form
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
