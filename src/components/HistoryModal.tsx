import React, { useState, useEffect } from 'react';
import { getSavedReportDates } from '../services/firebase';
import { Calendar, FileText, CheckSquare, Clock, X, ChevronRight, Copy } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  currentDate: string;
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, onSelectDate, currentDate }) => {
  const [dates, setDates] = useState<{ activityDates: string[]; checklistDates: string[] }>({
    activityDates: [],
    checklistDates: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getSavedReportDates()
        .then((res) => {
          setDates(res);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine and deduplicate dates
  const allDates = Array.from(
    new Set([...dates.activityDates, ...dates.checklistDates])
  ).sort().reverse();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">Arsip & Riwayat Laporan Harian</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-500 mb-3">
            Pilih tanggal untuk melihat, mengedit, atau mengunduh laporan A4 pada hari tersebut:
          </p>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Memuat riwayat...</div>
          ) : allDates.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Belum ada arsip tersimpan. Simpan laporan hari ini untuk memulai arsip.
            </div>
          ) : (
            <div className="space-y-2">
              {allDates.map((d) => {
                const hasActivity = dates.activityDates.includes(d);
                const hasChecklist = dates.checklistDates.includes(d);
                const isCurrent = d === currentDate;

                return (
                  <div
                    key={d}
                    onClick={() => {
                      onSelectDate(d);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className={`w-4 h-4 ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">{d}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {hasActivity && (
                            <span className="text-[10px] inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              <FileText className="w-3 h-3" /> Activity Report
                            </span>
                          )}
                          {hasChecklist && (
                            <span className="text-[10px] inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              <CheckSquare className="w-3 h-3" /> Checklist
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-normal">
                          Aktif
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">Masa simpan dokumen: 60 hari (2 bulan)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
