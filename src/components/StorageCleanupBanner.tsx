import React, { useState } from 'react';
import { runAutoCleanupExpiredRecords } from '../services/firebase';
import { Database, Trash2, CheckCircle2, ShieldAlert, Sparkles, HardDrive } from 'lucide-react';

interface Props {
  onNotify?: (msg: string) => void;
}

export const StorageCleanupBanner: React.FC<Props> = ({ onNotify }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<{
    count: number;
    timestamp: string;
  } | null>(null);

  const handleManualCleanup = async () => {
    setIsRunning(true);
    try {
      const res = await runAutoCleanupExpiredRecords();
      const total = res.deletedActivities + res.deletedChecklists;
      setLastCleanupResult({
        count: total,
        timestamp: new Date().toLocaleTimeString(),
      });
      if (onNotify) {
        onNotify(
          total > 0
            ? `Pembersihan berhasil: ${total} dokumen lama (>2 bulan) telah dihapus.`
            : 'Pemeriksaan selesai: Tidak ada data kadaluarsa lebih dari 2 bulan.'
        );
      }
    } catch (e) {
      console.error(e);
      if (onNotify) onNotify('Gagal menjalankan pembersihan storage.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-xl p-4 shadow-sm border border-emerald-700/50 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-800/80 rounded-lg text-emerald-300">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                Penyimpanan Database Cloud Firebase Firestore
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                daily-ctivity-itbg
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Kebijakan Retensi Aktif: Data teks & foto bertahan <strong>2 bulan (60 hari)</strong> dari tanggal aktif. Sistem secara otomatis membersihkan rekaman yang lebih dari 60 hari untuk menghemat kapasitas storage.
            </p>
            {lastCleanupResult && (
              <p className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pembersihan terakhir jam {lastCleanupResult.timestamp}: {lastCleanupResult.count} data lama dibersihkan.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={handleManualCleanup}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isRunning ? 'Membersihkan...' : 'Bersihkan Data > 2 Bulan'}
          </button>
        </div>
      </div>
    </div>
  );
};
