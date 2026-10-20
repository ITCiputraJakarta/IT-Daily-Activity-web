import React, { useState, useRef } from 'react';
import { WeeklyReport, WeeklyHighlightItem, NextMonthProjectItem, TrainingItem, BanquetSupportItem } from '../types';
import { compressImage } from '../utils/imageUtils';
import { pullHighlightsFromDailyActivities, getWeekRangeFromDate, formatWeeklyDate } from '../data/weeklyDefaults';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Wifi,
  Database,
  FileText,
  UserCheck,
  Building,
  HardDrive
} from 'lucide-react';

interface Props {
  report: WeeklyReport;
  onChange: (updated: WeeklyReport) => void;
  onSave: () => void;
  isSaving: boolean;
  onSelectDateRange?: (startDate: string, endDate: string) => void;
}

export const WeeklyReportForm: React.FC<Props> = ({
  report,
  onChange,
  onSave,
  isSaving,
}) => {
  const [isPullingDaily, setIsPullingDaily] = useState<boolean>(false);
  const [pullFeedback, setPullFeedback] = useState<string | null>(null);
  const [includeDeptInfo, setIncludeDeptInfo] = useState<boolean>(false);
  const [highlightSearch, setHighlightSearch] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('highlight');

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const updateField = <K extends keyof WeeklyReport>(key: K, value: WeeklyReport[K]) => {
    onChange({
      ...report,
      [key]: value,
      isUserModified: true,
      updatedAt: Date.now(),
    });
  };

  // Handle Photo Compression & Upload
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1600, 1600, 0.82);
      onComplete(compressed);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      e.target.value = '';
    }
  };

  // Pull highlights from daily activities between startDate and endDate
  const handlePullDailyHighlights = async () => {
    setIsPullingDaily(true);
    setPullFeedback('Sedang memindai arsip Daily Activity dari ' + report.startDate + ' s/d ' + report.endDate + '...');
    try {
      const result = await pullHighlightsFromDailyActivities(report.startDate, report.endDate, includeDeptInfo);
      if (result.totalFound > 0) {
        updateField('weeklyHighlights', result.items);
        setPullFeedback(`✓ Sukses! Berhasil menarik ${result.totalFound} aktivitas dari ${result.daysChecked} hari Daily Activity.`);
      } else {
        setPullFeedback(`⚠️ Tidak ditemukan aktivitas terisi pada rentang ${report.startDate} s/d ${report.endDate}. Pastikan Daily Activity pada tanggal-tanggal tersebut sudah disimpan.`);
      }
    } catch (err: any) {
      console.error(err);
      setPullFeedback('Gagal mengambil daily activity: ' + (err.message || 'Error'));
    } finally {
      setIsPullingDaily(false);
      setTimeout(() => setPullFeedback(null), 6000);
    }
  };

  // Highlight List management
  const addHighlightItem = () => {
    const nextNo = (report.weeklyHighlights || []).length + 1;
    const newItem: WeeklyHighlightItem = {
      id: `wh-${Date.now()}`,
      no: nextNo,
      text: '',
    };
    updateField('weeklyHighlights', [...(report.weeklyHighlights || []), newItem]);
  };

  const updateHighlightText = (index: number, text: string) => {
    const list = [...(report.weeklyHighlights || [])];
    if (index >= 0 && index < list.length) {
      list[index] = { ...list[index], text };
      updateField('weeklyHighlights', list);
    }
  };

  const removeHighlightItem = (index: number) => {
    const list = (report.weeklyHighlights || []).filter((_, i) => i !== index);
    const renumbered = list.map((it, idx) => ({ ...it, no: idx + 1 }));
    updateField('weeklyHighlights', renumbered);
  };

  const moveHighlightItem = (index: number, direction: 'up' | 'down') => {
    const list = [...(report.weeklyHighlights || [])];
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === list.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateField('weeklyHighlights', list.map((it, idx) => ({ ...it, no: idx + 1 })));
  };

  // Set All Database Backups to Done
  const handleMarkAllBackupsDone = () => {
    const updated = (report.databaseBackups || []).map((row) => ({
      ...row,
      status: 'Done' as const,
    }));
    updateField('databaseBackups', updated);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Card & Quick Week Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Weekly Maintenance Report
              </span>
              <span className="text-xs text-slate-500 font-medium">Hotel Ciputra Jakarta</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              {report.weekLabel} ({report.dateRangeFormatted})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Weekly Report'}</span>
            </button>
          </div>
        </div>

        {/* Week & Date Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Label Periode Laporan (Week)</label>
            <input
              type="text"
              value={report.weekLabel}
              onChange={(e) => updateField('weekLabel', e.target.value)}
              placeholder="Contoh: Week II – October"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai (Senin)</label>
            <input
              type="date"
              value={report.startDate}
              onChange={(e) => {
                const sDate = e.target.value;
                const range = getWeekRangeFromDate(sDate);
                onChange({
                  ...report,
                  startDate: sDate,
                  endDate: range.endDate,
                  weekLabel: range.weekLabel,
                  dateRangeFormatted: `${formatWeeklyDate(sDate)} – ${formatWeeklyDate(range.endDate)}`,
                  reportPeriodText: `This report indicates the result of major achievements in the Information Technology department for the month of ${range.weekLabel} ( ${formatWeeklyDate(sDate)} – ${formatWeeklyDate(range.endDate)} )`,
                  isUserModified: true,
                  updatedAt: Date.now(),
                });
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Akhir (Minggu)</label>
            <input
              type="date"
              value={report.endDate}
              onChange={(e) => {
                const eDate = e.target.value;
                onChange({
                  ...report,
                  endDate: eDate,
                  dateRangeFormatted: `${formatWeeklyDate(report.startDate)} – ${formatWeeklyDate(eDate)}`,
                  reportPeriodText: `This report indicates the result of major achievements in the Information Technology department for the month of ${report.weekLabel} ( ${formatWeeklyDate(report.startDate)} – ${formatWeeklyDate(eDate)} )`,
                  isUserModified: true,
                  updatedAt: Date.now(),
                });
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Teks Rentang Tanggal</label>
            <input
              type="text"
              value={report.dateRangeFormatted}
              onChange={(e) => updateField('dateRangeFormatted', e.target.value)}
              placeholder="Contoh: 12 October 2026 – 18 October 2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Metadata: Prepared, Direct Report, Cc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Prepared</label>
            <input
              type="text"
              value={report.prepared}
              onChange={(e) => updateField('prepared', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Direct Report</label>
            <input
              type="text"
              value={report.directReport}
              onChange={(e) => updateField('directReport', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Cc</label>
            <input
              type="text"
              value={report.cc}
              onChange={(e) => updateField('cc', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Form Sections */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold select-none">
        {[
          { id: 'highlight', label: '2. Weekly Highlight (Daily Sync)' },
          { id: 'statistic', label: '1. Guest Statistic' },
          { id: 'antivirus', label: '3. Antivirus & Fortigate' },
          { id: 'projects', label: '4-6. Project, Training & Banquet' },
          { id: 'ap', label: '8. Monitoring AP' },
          { id: 'backup', label: '9-11. Backup & Requests' },
          { id: 'sara', label: '12-13. SARA & Sign-off' },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeSection === sec.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: 2. WEEKLY HIGHLIGHT (WITH AUTO-SYNC FROM DAILY ACTIVITY)         */}
      {/* ========================================================================= */}
      {activeSection === 'highlight' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#facc15] text-slate-950 font-black px-2 py-0.5 text-xs border border-amber-400 uppercase">
                  2. Weekly Highlight
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  ({report.weeklyHighlights?.length || 0} tugas terdata)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Daftar poin pencapaian utama IT minggu ini. Dapat diambil otomatis dari <strong>Daily Activity</strong> atau diketik manual.
              </p>
            </div>

            {/* Sync Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDeptInfo}
                  onChange={(e) => setIncludeDeptInfo(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Sertakan Dept/User</span>
              </label>

              <button
                type="button"
                onClick={handlePullDailyHighlights}
                disabled={isPullingDaily}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isPullingDaily ? 'animate-spin' : ''}`} />
                <span>{isPullingDaily ? 'Memindai Daily Activity...' : 'Ambil dari Daily Activity'}</span>
              </button>

              <button
                type="button"
                onClick={addHighlightItem}
                className="inline-flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Poin</span>
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {pullFeedback && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in">
              <span>{pullFeedback}</span>
              <button
                type="button"
                onClick={() => setPullFeedback(null)}
                className="text-amber-800 font-bold hover:underline"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={highlightSearch}
              onChange={(e) => setHighlightSearch(e.target.value)}
              placeholder="Cari kata kunci dalam highlight..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 font-medium"
            />
          </div>

          {/* List of items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {(report.weeklyHighlights || [])
              .filter((it) => it.text.toLowerCase().includes(highlightSearch.toLowerCase()))
              .map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-start gap-2 p-2 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 shadow-2xs transition"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateHighlightText(index, e.target.value)}
                      placeholder={`Deskripsi tugas highlight #${index + 1}`}
                      className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600"
                    />
                    {item.sourceDate && (
                      <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span>📅 Tanggal: {item.sourceDate}</span>
                        {item.clientDepartment && <span>🏢 {item.clientDepartment}</span>}
                        {item.pic && <span>👤 PIC: {item.pic}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => moveHighlightItem(index, 'up')}
                      disabled={index === 0}
                      title="Geser ke atas"
                      className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHighlightItem(index, 'down')}
                      disabled={index === (report.weeklyHighlights || []).length - 1}
                      title="Geser ke bawah"
                      className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHighlightItem(index)}
                      title="Hapus poin ini"
                      className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 1. GUEST STATISTIC                                               */}
      {/* ========================================================================= */}
      {activeSection === 'statistic' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>1. Guest Statistic (MRTG Traffic &amp; Bandwidth)</span>
          </h3>

          {/* Screenshot upload */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Weekly Internet Traffic Statistic (Screenshot MRTG / Router)
              </span>
              {report.guestStatistic?.mrtgScreenshotUrl && (
                <button
                  type="button"
                  onClick={() =>
                    updateField('guestStatistic', {
                      ...report.guestStatistic,
                      mrtgScreenshotUrl: '',
                    })
                  }
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Hapus Gambar
                </button>
              )}
            </div>

            {report.guestStatistic?.mrtgScreenshotUrl ? (
              <div className="flex justify-center bg-white p-2 rounded-lg border border-slate-200">
                <img
                  src={report.guestStatistic.mrtgScreenshotUrl}
                  alt="Weekly MRTG Statistic"
                  className="max-h-60 object-contain"
                />
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg text-xs">
                <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                <span>Belum ada screenshot traffic mingguan terlampir</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={(el) => {
                  fileInputRefs.current['mrtg'] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handlePhotoUpload(e, (dataUrl) => {
                    updateField('guestStatistic', {
                      ...report.guestStatistic,
                      mrtgScreenshotUrl: dataUrl,
                    });
                  })
                }
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current['mrtg']?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Screenshot Traffic</span>
              </button>
            </div>
          </div>

          {/* Detail numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. Bandwidth Hotel</label>
              <input
                type="text"
                value={report.guestStatistic?.bandwidth || ''}
                onChange={(e) =>
                  updateField('guestStatistic', {
                    ...report.guestStatistic,
                    bandwidth: e.target.value,
                  })
                }
                placeholder="450 Mbps (1:1)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. Free BOD (Velo)</label>
              <input
                type="text"
                value={report.guestStatistic?.freeBod || ''}
                onChange={(e) =>
                  updateField('guestStatistic', {
                    ...report.guestStatistic,
                    freeBod: e.target.value,
                  })
                }
                placeholder="Free BOD from Velo 100 Mbps / month (based on Velo)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. Status Line ISP</label>
              <input
                type="text"
                value={report.guestStatistic?.ispStatus || ''}
                onChange={(e) =>
                  updateField('guestStatistic', {
                    ...report.guestStatistic,
                    ispStatus: e.target.value,
                  })
                }
                placeholder="Status line with ISP Velo Networks Fiber Optic with Radio for backup"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. Total Guest Devices Connected</label>
              <input
                type="text"
                value={report.guestStatistic?.connectedDevicesCount || ''}
                onChange={(e) =>
                  updateField('guestStatistic', {
                    ...report.guestStatistic,
                    connectedDevicesCount: e.target.value,
                  })
                }
                placeholder="2903"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-emerald-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 3. ANTIVIRUS & FORTIGATE SCREENSHOTS                             */}
      {/* ========================================================================= */}
      {activeSection === 'antivirus' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>3. Weekly Antivirus Report &amp; Fortigate Status (6 Screenshots)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'statusOverviewUrl', label: '1. Status Overview (Page 2)' },
              { key: 'securityOverviewUrl', label: '2. Security Overview (Page 2)' },
              { key: 'computerStatusUrl', label: '3. Computer Status (Page 3)' },
              { key: 'antivirusDetectionUrl', label: '4. Antivirus Detection (Page 3)' },
              { key: 'firewallDetectionsUrl', label: '5. Firewall Detections (Page 3)' },
              { key: 'fortigateStatusUrl', label: '6. Fortigate Status (Page 4)' },
            ].map(({ key, label }) => {
              const currentUrl = (report.antivirusReport as any)?.[key];
              return (
                <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{label}</span>
                    {currentUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          updateField('antivirusReport', {
                            ...report.antivirusReport,
                            [key]: '',
                          })
                        }
                        className="text-[11px] text-red-600 hover:underline font-bold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  {currentUrl ? (
                    <div className="flex justify-center bg-white p-1 rounded border border-slate-200">
                      <img src={currentUrl} alt={label} className="max-h-40 object-contain rounded" />
                    </div>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded text-xs">
                      <span>Belum ada screenshot</span>
                    </div>
                  )}

                  <input
                    ref={(el) => {
                      fileInputRefs.current[key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handlePhotoUpload(e, (dataUrl) => {
                        updateField('antivirusReport', {
                          ...report.antivirusReport,
                          [key]: dataUrl,
                        });
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[key]?.click()}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Screenshot</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 4-6. PROJECT, TRAINING & BANQUET                                 */}
      {/* ========================================================================= */}
      {activeSection === 'projects' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-6">
          {/* 4. Next Month Project */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-xs text-slate-900">4. Next Month Project &amp; On Going</h4>
              <button
                type="button"
                onClick={() => {
                  const list = report.nextMonthProjects || [];
                  const newItem: NextMonthProjectItem = {
                    id: `nmp-${Date.now()}`,
                    no: list.length + 1,
                    projectName: '',
                    target: '',
                    others: '',
                  };
                  updateField('nextMonthProjects', [...list, newItem]);
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                + Tambah Proyek
              </button>
            </div>

            <div className="space-y-2">
              {(report.nextMonthProjects || []).map((p, idx) => (
                <div key={p.id || idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg text-xs items-center">
                  <span className="col-span-1 font-bold text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={p.projectName}
                    onChange={(e) => {
                      const list = [...(report.nextMonthProjects || [])];
                      list[idx] = { ...list[idx], projectName: e.target.value };
                      updateField('nextMonthProjects', list);
                    }}
                    placeholder="Nama Proyek (Project Name)"
                    className="col-span-5 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={p.target}
                    onChange={(e) => {
                      const list = [...(report.nextMonthProjects || [])];
                      list[idx] = { ...list[idx], target: e.target.value };
                      updateField('nextMonthProjects', list);
                    }}
                    placeholder="Target (misal: Next Year)"
                    className="col-span-3 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={p.others}
                    onChange={(e) => {
                      const list = [...(report.nextMonthProjects || [])];
                      list[idx] = { ...list[idx], others: e.target.value };
                      updateField('nextMonthProjects', list);
                    }}
                    placeholder="Keterangan lainnya (Others)"
                    className="col-span-2 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const list = (report.nextMonthProjects || []).filter((_, i) => i !== idx);
                      updateField('nextMonthProjects', list.map((it, i) => ({ ...it, no: i + 1 })));
                    }}
                    className="col-span-1 text-red-600 hover:text-red-800 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Training Time & Train the Trainer */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-xs text-slate-900">5. Training Time &amp; Train the Trainer</h4>
              <button
                type="button"
                onClick={() => {
                  const list = report.trainings || [];
                  const newItem: TrainingItem = {
                    id: `tr-${Date.now()}`,
                    no: list.length + 1,
                    date: '',
                    dept: '',
                    topicAndParticipant: '',
                    documentationUrl: '',
                  };
                  updateField('trainings', [...list, newItem]);
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                + Tambah Training
              </button>
            </div>

            <div className="space-y-3">
              {(report.trainings || []).map((tr, idx) => (
                <div key={tr.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Training #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const list = (report.trainings || []).filter((_, i) => i !== idx);
                        updateField('trainings', list.map((it, i) => ({ ...it, no: i + 1 })));
                      }}
                      className="text-red-600 hover:underline text-[11px] font-bold"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={tr.date}
                      onChange={(e) => {
                        const list = [...(report.trainings || [])];
                        list[idx] = { ...list[idx], date: e.target.value };
                        updateField('trainings', list);
                      }}
                      placeholder="Tanggal Training"
                      className="px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={tr.dept}
                      onChange={(e) => {
                        const list = [...(report.trainings || [])];
                        list[idx] = { ...list[idx], dept: e.target.value };
                        updateField('trainings', list);
                      }}
                      placeholder="Departemen Peserta"
                      className="px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={tr.topicAndParticipant}
                      onChange={(e) => {
                        const list = [...(report.trainings || [])];
                        list[idx] = { ...list[idx], topicAndParticipant: e.target.value };
                        updateField('trainings', list);
                      }}
                      placeholder="Topic &amp; Participant"
                      className="px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                  </div>

                  {/* Photo */}
                  <div className="pt-1 flex items-center gap-3">
                    {tr.documentationUrl ? (
                      <img src={tr.documentationUrl} alt="Training" className="h-16 w-24 object-cover rounded border" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum ada foto dokumentasi</span>
                    )}

                    <input
                      ref={(el) => {
                        fileInputRefs.current[`tr-${idx}`] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handlePhotoUpload(e, (dataUrl) => {
                          const list = [...(report.trainings || [])];
                          list[idx] = { ...list[idx], documentationUrl: dataUrl };
                          updateField('trainings', list);
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[`tr-${idx}`]?.click()}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-[11px] cursor-pointer"
                    >
                      {tr.documentationUrl ? 'Ganti Foto' : 'Upload Foto Training'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Weekly Banquet Support Event */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-xs text-slate-900">6. Weekly Banquet Support Event Internet BOD</h4>
              <button
                type="button"
                onClick={() => {
                  const list = report.banquetSupports || [];
                  const newItem: BanquetSupportItem = {
                    id: `bq-${Date.now()}`,
                    no: list.length + 1,
                    date: '',
                    eventName: '',
                    location: '',
                    requirementSupport: '',
                  };
                  updateField('banquetSupports', [...list, newItem]);
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                + Tambah Event Banquet
              </button>
            </div>

            <div className="space-y-2">
              {(report.banquetSupports || []).map((bq, idx) => (
                <div key={bq.id || idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg text-xs items-center">
                  <span className="col-span-1 font-bold text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={bq.date}
                    onChange={(e) => {
                      const list = [...(report.banquetSupports || [])];
                      list[idx] = { ...list[idx], date: e.target.value };
                      updateField('banquetSupports', list);
                    }}
                    placeholder="Tanggal"
                    className="col-span-2 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={bq.eventName}
                    onChange={(e) => {
                      const list = [...(report.banquetSupports || [])];
                      list[idx] = { ...list[idx], eventName: e.target.value };
                      updateField('banquetSupports', list);
                    }}
                    placeholder="Event Name"
                    className="col-span-3 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={bq.location}
                    onChange={(e) => {
                      const list = [...(report.banquetSupports || [])];
                      list[idx] = { ...list[idx], location: e.target.value };
                      updateField('banquetSupports', list);
                    }}
                    placeholder="Location"
                    className="col-span-2 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={bq.requirementSupport}
                    onChange={(e) => {
                      const list = [...(report.banquetSupports || [])];
                      list[idx] = { ...list[idx], requirementSupport: e.target.value };
                      updateField('banquetSupports', list);
                    }}
                    placeholder="Requirement Support"
                    className="col-span-3 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const list = (report.banquetSupports || []).filter((_, i) => i !== idx);
                      updateField('banquetSupports', list.map((it, i) => ({ ...it, no: i + 1 })));
                    }}
                    className="col-span-1 text-red-600 hover:text-red-800 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 8. MONITORING ACCESS POINT                                       */}
      {/* ========================================================================= */}
      {activeSection === 'ap' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>8. Weekly Monitoring Access Point (403 AP Hotel Ciputra Jakarta)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Floor 711 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Floor 711</span>
                <span className="font-bold text-emerald-800">
                  Total {report.accessPointMonitoring?.floor711?.totalAp || 178} AP
                </span>
              </div>
              <div className="space-y-1">
                {report.accessPointMonitoring?.floor711?.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-slate-200">
                    <span className="font-medium text-slate-700">{it.type}</span>
                    <span className="font-bold text-slate-900">{it.total}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Status / Issue:</label>
                <input
                  type="text"
                  value={report.accessPointMonitoring?.floor711?.issue || ''}
                  onChange={(e) => {
                    updateField('accessPointMonitoring', {
                      ...report.accessPointMonitoring,
                      floor711: {
                        ...report.accessPointMonitoring.floor711,
                        issue: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Floor 1217 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Floor 1217</span>
                <span className="font-bold text-emerald-800">
                  Total {report.accessPointMonitoring?.floor1217?.totalAp || 190} AP
                </span>
              </div>
              <div className="space-y-1">
                {report.accessPointMonitoring?.floor1217?.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-slate-200">
                    <span className="font-medium text-slate-700">{it.type}</span>
                    <span className="font-bold text-slate-900">{it.total}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Status / Issue:</label>
                <input
                  type="text"
                  value={report.accessPointMonitoring?.floor1217?.issue || ''}
                  onChange={(e) => {
                    updateField('accessPointMonitoring', {
                      ...report.accessPointMonitoring,
                      floor1217: {
                        ...report.accessPointMonitoring.floor1217,
                        issue: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Meeting & Public */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Meeting Room &amp; Public</span>
                <span className="font-bold text-emerald-800">
                  Total {report.accessPointMonitoring?.meetingAndPublic?.totalAp || 35} AP
                </span>
              </div>
              <div className="space-y-1">
                {report.accessPointMonitoring?.meetingAndPublic?.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-slate-200">
                    <span className="font-medium text-slate-700">{it.type}</span>
                    <span className="font-bold text-slate-900">{it.total}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Status / Issue:</label>
                <input
                  type="text"
                  value={report.accessPointMonitoring?.meetingAndPublic?.issue || ''}
                  onChange={(e) => {
                    updateField('accessPointMonitoring', {
                      ...report.accessPointMonitoring,
                      meetingAndPublic: {
                        ...report.accessPointMonitoring.meetingAndPublic,
                        issue: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 9-11. BACKUP DATABASE & SYSTEM REQUESTS                          */}
      {/* ========================================================================= */}
      {activeSection === 'backup' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-6">
          {/* 9. Backup Database Table */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-xs text-slate-900">9. Backup Database (Senin s/d Minggu)</h4>
              <button
                type="button"
                onClick={handleMarkAllBackupsDone}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                ✓ Setel Semua Status: Done
              </button>
            </div>

            <div className="space-y-1.5">
              {(report.databaseBackups || []).map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg text-xs items-center">
                  <span className="col-span-2 font-bold">{row.day}</span>
                  <input
                    type="text"
                    value={row.date}
                    onChange={(e) => {
                      const list = [...(report.databaseBackups || [])];
                      list[idx] = { ...list[idx], date: e.target.value };
                      updateField('databaseBackups', list);
                    }}
                    className="col-span-2 px-2 py-1 rounded border border-slate-300 bg-white text-center"
                  />
                  <input
                    type="text"
                    value={row.time}
                    onChange={(e) => {
                      const list = [...(report.databaseBackups || [])];
                      list[idx] = { ...list[idx], time: e.target.value };
                      updateField('databaseBackups', list);
                    }}
                    className="col-span-2 px-2 py-1 rounded border border-slate-300 bg-white text-center"
                  />
                  <input
                    type="text"
                    value={row.databaseLocation}
                    onChange={(e) => {
                      const list = [...(report.databaseBackups || [])];
                      list[idx] = { ...list[idx], databaseLocation: e.target.value };
                      updateField('databaseBackups', list);
                    }}
                    className="col-span-4 px-2 py-1 rounded border border-slate-300 bg-white"
                  />
                  <select
                    value={row.status}
                    onChange={(e) => {
                      const list = [...(report.databaseBackups || [])];
                      list[idx] = { ...list[idx], status: e.target.value as any };
                      updateField('databaseBackups', list);
                    }}
                    className="col-span-2 px-2 py-1 rounded border border-slate-300 bg-white font-bold text-emerald-800"
                  >
                    <option value="Done">Done</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              ))}
            </div>

            {/* GDrive Backup Links */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">Link Folder Backup di Google Drive:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Database Link</label>
                  <input
                    type="text"
                    value={report.databaseBackupLinks?.databaseLink || ''}
                    onChange={(e) =>
                      updateField('databaseBackupLinks', {
                        ...report.databaseBackupLinks,
                        databaseLink: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 rounded border border-slate-300 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Data Center Link</label>
                  <input
                    type="text"
                    value={report.databaseBackupLinks?.dataCenterLink || ''}
                    onChange={(e) =>
                      updateField('databaseBackupLinks', {
                        ...report.databaseBackupLinks,
                        dataCenterLink: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 rounded border border-slate-300 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">User Data Link</label>
                  <input
                    type="text"
                    value={report.databaseBackupLinks?.userDataLink || ''}
                    onChange={(e) =>
                      updateField('databaseBackupLinks', {
                        ...report.databaseBackupLinks,
                        userDataLink: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 rounded border border-slate-300 text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 10. HR Request & 11. POS Request */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h5 className="font-bold text-slate-900">10. New Employee Data System (HR Request)</h5>
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Details</label>
                <input
                  type="text"
                  value={report.newEmployeeSystem?.details || ''}
                  onChange={(e) =>
                    updateField('newEmployeeSystem', {
                      ...report.newEmployeeSystem,
                      details: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Link File Output (GDrive)</label>
                <input
                  type="text"
                  value={report.newEmployeeSystem?.fileLink || ''}
                  onChange={(e) =>
                    updateField('newEmployeeSystem', {
                      ...report.newEmployeeSystem,
                      fileLink: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h5 className="font-bold text-slate-900">11. New Menu on POS Request (This Week)</h5>
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Details</label>
                <input
                  type="text"
                  value={report.newMenuPos?.details || ''}
                  onChange={(e) =>
                    updateField('newMenuPos', {
                      ...report.newMenuPos,
                      details: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Link File Output (Excel / Spreadsheet)</label>
                <input
                  type="text"
                  value={report.newMenuPos?.fileLink || ''}
                  onChange={(e) =>
                    updateField('newMenuPos', {
                      ...report.newMenuPos,
                      fileLink: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 12-13. SARA & SIGN-OFF                                           */}
      {/* ========================================================================= */}
      {activeSection === 'sara' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-5 text-xs">
          {/* 12. SARA System Report IT Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">12. Sara System Report IT Section</h4>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">Screenshot SARA IT Section</span>
              {report.saraSystemReport?.screenshotUrl && (
                <button
                  type="button"
                  onClick={() =>
                    updateField('saraSystemReport', {
                      ...report.saraSystemReport,
                      screenshotUrl: '',
                    })
                  }
                  className="text-red-600 font-bold hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>

            {report.saraSystemReport?.screenshotUrl ? (
              <div className="flex justify-center bg-white p-2 rounded border border-slate-200">
                <img src={report.saraSystemReport.screenshotUrl} alt="SARA IT Section" className="max-h-52 object-contain" />
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded">
                <span>Belum ada screenshot SARA IT Section</span>
              </div>
            )}

            <input
              ref={(el) => {
                fileInputRefs.current['sara'] = el;
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handlePhotoUpload(e, (dataUrl) => {
                  updateField('saraSystemReport', {
                    ...report.saraSystemReport,
                    screenshotUrl: dataUrl,
                  });
                })
              }
            />
            <button
              type="button"
              onClick={() => fileInputRefs.current['sara']?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Screenshot SARA</span>
            </button>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan (Note)</label>
              <input
                type="text"
                value={report.saraSystemReport?.note || ''}
                onChange={(e) =>
                  updateField('saraSystemReport', {
                    ...report.saraSystemReport,
                    note: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* 13. Others Information */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1">13. Others Information</h4>
            <textarea
              rows={3}
              value={report.othersInformation}
              onChange={(e) => updateField('othersInformation', e.target.value)}
              placeholder="Catatan lainnya (jika tidak ada isi '-')"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            />
          </div>

          {/* Sign-off Fields */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-900">Tanda Tangan &amp; Pengesahan (Sign-off)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Kota / Tanggal Pengesahan</label>
                <input
                  type="text"
                  value={report.signatureCityDate}
                  onChange={(e) => updateField('signatureCityDate', e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Nama Petugas (Prepared by)</label>
                <input
                  type="text"
                  value={report.signatureName}
                  onChange={(e) => updateField('signatureName', e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Jabatan Petugas</label>
                <input
                  type="text"
                  value={report.signatureTitle}
                  onChange={(e) => updateField('signatureTitle', e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
