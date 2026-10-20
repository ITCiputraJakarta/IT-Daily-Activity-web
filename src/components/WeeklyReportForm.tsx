import React, { useState, useRef } from 'react';
import { WeeklyReport, WeeklyHighlightItem, NextMonthProjectItem, TrainingItem, BanquetSupportItem } from '../types';
import { compressImage } from '../utils/imageUtils';
import {
  pullHighlightsFromDailyActivities,
  getWeekRangeFromDate,
  formatWeeklyDate,
  POPULAR_AP_TYPES,
  recalculateApMonitoring,
} from '../data/weeklyDefaults';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Camera,
  Clipboard,
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

  // Input states for Section 8 (Add new AP type per zone)
  const [newApInputs, setNewApInputs] = useState<{
    floor711: { type: string; customType: string; total: number };
    floor1217: { type: string; customType: string; total: number };
    meetingAndPublic: { type: string; customType: string; total: number };
  }>({
    floor711: { type: 'U6Lite', customType: '', total: 1 },
    floor1217: { type: 'U6Lite', customType: '', total: 1 },
    meetingAndPublic: { type: 'U6Lite', customType: '', total: 1 },
  });

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

  // =========================================================================
  // Section 8 (Access Point Monitoring) Handlers: Edit, Add, Delete, Recalculate
  // =========================================================================
  type ApZoneKey = 'floor711' | 'floor1217' | 'meetingAndPublic';

  const handleUpdateApItem = (
    zoneKey: ApZoneKey,
    itemIdx: number,
    field: 'type' | 'total',
    val: string | number
  ) => {
    const currentAp = report.accessPointMonitoring || ({} as any);
    const zone = currentAp[zoneKey] || { zone: zoneKey, items: [], totalAp: 0, issue: 'No Issue' };
    const items = [...(zone.items || [])];
    if (!items[itemIdx]) return;

    if (field === 'type') {
      items[itemIdx] = { ...items[itemIdx], type: String(val) };
    } else {
      items[itemIdx] = { ...items[itemIdx], total: Math.max(0, Number(val) || 0) };
    }

    const updatedZone = { ...zone, items };
    const nextAp = {
      ...currentAp,
      [zoneKey]: updatedZone,
    };
    const recalculated = recalculateApMonitoring(nextAp);
    updateField('accessPointMonitoring', recalculated);
  };

  const handleDeleteApItem = (zoneKey: ApZoneKey, itemIdx: number) => {
    const currentAp = report.accessPointMonitoring || ({} as any);
    const zone = currentAp[zoneKey] || { zone: zoneKey, items: [], totalAp: 0, issue: 'No Issue' };
    const items = (zone.items || []).filter((_, i) => i !== itemIdx);
    const updatedZone = { ...zone, items };
    const nextAp = {
      ...currentAp,
      [zoneKey]: updatedZone,
    };
    const recalculated = recalculateApMonitoring(nextAp);
    updateField('accessPointMonitoring', recalculated);
  };

  const handleAddApItem = (zoneKey: ApZoneKey) => {
    const input = newApInputs[zoneKey];
    const rawType = input.type === 'CUSTOM' ? input.customType : input.type;
    const cleanType = (rawType || '').trim();
    if (!cleanType) return;
    const cleanTotal = Math.max(1, Number(input.total) || 1);

    const currentAp = report.accessPointMonitoring || ({} as any);
    const zone = currentAp[zoneKey] || { zone: zoneKey, items: [], totalAp: 0, issue: 'No Issue' };
    const items = [...(zone.items || [])];

    // If type already exists, add quantity to it
    const existingIdx = items.findIndex(
      (it) => it.type.toLowerCase() === cleanType.toLowerCase()
    );
    if (existingIdx >= 0) {
      items[existingIdx] = {
        ...items[existingIdx],
        total: (Number(items[existingIdx].total) || 0) + cleanTotal,
      };
    } else {
      items.push({ type: cleanType, total: cleanTotal });
    }

    const updatedZone = { ...zone, items };
    const nextAp = {
      ...currentAp,
      [zoneKey]: updatedZone,
    };
    const recalculated = recalculateApMonitoring(nextAp);
    updateField('accessPointMonitoring', recalculated);

    // Reset input
    setNewApInputs((prev) => ({
      ...prev,
      [zoneKey]: { type: 'U6Lite', customType: '', total: 1 },
    }));
  };

  const handleResetApToDefault = () => {
    if (window.confirm('Kembalikan konfigurasi Access Point ke standar 403 AP Hotel Ciputra Jakarta?')) {
      const defaultAp = {
        floor711: {
          zone: 'Floor 711',
          items: [
            { type: 'UAPACLR', total: 7 },
            { type: 'UAPACLite', total: 146 },
            { type: 'U6Lite', total: 18 },
            { type: 'UK Ultra', total: 2 },
            { type: 'U6+', total: 4 },
            { type: 'U6 Pro', total: 1 },
          ],
          totalAp: 178,
          issue: 'No Issue',
        },
        floor1217: {
          zone: 'Floor 1217',
          items: [
            { type: 'UAPACLR', total: 10 },
            { type: 'UAPACLite', total: 167 },
            { type: 'U6Lite', total: 13 },
          ],
          totalAp: 190,
          issue: 'No Issue',
        },
        meetingAndPublic: {
          zone: 'Meeting Room & Public Area',
          items: [
            { type: 'U6Lite', total: 6 },
            { type: 'UAPACHD', total: 7 },
            { type: 'UAPACLite', total: 2 },
            { type: 'UAPACLR', total: 19 },
            { type: 'U6+', total: 1 },
          ],
          totalAp: 35,
          issue: 'No Issue',
        },
        totalSummary: {
          items: [
            { type: 'UAPACLite', total: 315 },
            { type: 'U6Lite', total: 37 },
            { type: 'UAPACHD', total: 7 },
            { type: 'U6+', total: 5 },
            { type: 'UK Ultra', total: 2 },
            { type: 'U6 Pro', total: 1 },
          ],
          totalAp: 403,
        },
      };
      updateField('accessPointMonitoring', recalculateApMonitoring(defaultAp));
    }
  };

  const totalApOverall = report.accessPointMonitoring?.totalSummary?.totalAp ?? 403;

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

          {/* Screenshot upload with Paste from Snipping Tool */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <ImageUploadDropzone
              label="Weekly Internet Traffic Statistic (Screenshot MRTG / Router)"
              sublabel="Bisa langsung klik 'Paste dari Snipping Tool' atau klik kotak lalu tekan Ctrl + V"
              imageUrl={report.guestStatistic?.mrtgScreenshotUrl}
              onImageChange={(dataUrl) => {
                updateField('guestStatistic', {
                  ...report.guestStatistic,
                  mrtgScreenshotUrl: dataUrl,
                });
              }}
              onRemove={() => {
                updateField('guestStatistic', {
                  ...report.guestStatistic,
                  mrtgScreenshotUrl: '',
                });
              }}
              placeholderText="Belum ada screenshot traffic mingguan terlampir"
              maxHeightClass="max-h-72"
            />
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
                <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <ImageUploadDropzone
                    label={label}
                    sublabel="Paste langsung (Ctrl+V) atau dari Snipping Tool"
                    imageUrl={currentUrl}
                    compact={true}
                    onImageChange={(dataUrl) => {
                      updateField('antivirusReport', {
                        ...report.antivirusReport,
                        [key]: dataUrl,
                      });
                    }}
                    onRemove={() => {
                      updateField('antivirusReport', {
                        ...report.antivirusReport,
                        [key]: '',
                      });
                    }}
                    placeholderText={`Belum ada ${label}`}
                    maxHeightClass="max-h-48"
                  />
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

                  {/* Photo with Snipping Tool paste support */}
                  <div className="pt-1">
                    <ImageUploadDropzone
                      label="Foto Dokumentasi Training"
                      sublabel="Paste langsung (Ctrl+V) dari Snipping Tool"
                      imageUrl={tr.documentationUrl}
                      compact={true}
                      onImageChange={(dataUrl) => {
                        const list = [...(report.trainings || [])];
                        list[idx] = { ...list[idx], documentationUrl: dataUrl };
                        updateField('trainings', list);
                      }}
                      onRemove={() => {
                        const list = [...(report.trainings || [])];
                        list[idx] = { ...list[idx], documentationUrl: '' };
                        updateField('trainings', list);
                      }}
                      placeholderText="Belum ada foto dokumentasi pelatihan"
                      maxHeightClass="max-h-40"
                    />
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
      {/* SECTION: 8. MONITORING ACCESS POINT (CUSTOMIZABLE & AUTO-CALCULATED)       */}
      {/* ========================================================================= */}
      {activeSection === 'ap' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>8. Weekly Monitoring Access Point ({totalApOverall} AP Hotel Ciputra Jakarta)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Edit jenis/tipe AP, ubah jumlah, atau tambahkan tipe AP baru. Total per lantai dan total keseluruhan otomatis terhitung &amp; sinkron ke file cetak A4.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetApToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition cursor-pointer self-start sm:self-auto"
              title="Kembalikan data ke standar 403 AP Hotel Ciputra Jakarta"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Standar (403 AP)</span>
            </button>
          </div>

          {/* 3 Zone Cards: Floor 711, Floor 1217, Meeting Room & Public */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {(
              [
                {
                  key: 'floor711' as const,
                  title: 'Floor 711',
                  subtitle: 'Kamar & Koridor Lt. 7 s/d 11',
                  data: report.accessPointMonitoring?.floor711,
                },
                {
                  key: 'floor1217' as const,
                  title: 'Floor 1217',
                  subtitle: 'Kamar & Koridor Lt. 12 s/d 17',
                  data: report.accessPointMonitoring?.floor1217,
                },
                {
                  key: 'meetingAndPublic' as const,
                  title: 'Meeting Room & Public Area',
                  subtitle: 'Lobby, Ballroom, Resto, Meeting Room',
                  data: report.accessPointMonitoring?.meetingAndPublic,
                },
              ] as const
            ).map((zoneConfig) => {
              const zoneKey = zoneConfig.key;
              const zoneData = zoneConfig.data;
              const inputState = newApInputs[zoneKey];
              const zoneItems = zoneData?.items || [];
              const zoneTotal = zoneData?.totalAp ?? zoneItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

              return (
                <div
                  key={zoneKey}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Zone Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {zoneConfig.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{zoneConfig.subtitle}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Total {zoneTotal} AP
                      </span>
                    </div>

                    {/* AP Type Items list with inline editable type and count */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1">
                        <span>Tipe / Model AP</span>
                        <span className="w-16 text-right">Jumlah</span>
                      </div>

                      {zoneItems.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition"
                        >
                          <input
                            type="text"
                            value={it.type}
                            onChange={(e) =>
                              handleUpdateApItem(zoneKey, idx, 'type', e.target.value)
                            }
                            className="flex-1 px-1.5 py-0.5 text-xs font-semibold text-slate-800 bg-transparent border-none outline-hidden focus:ring-1 focus:ring-emerald-500 rounded"
                            placeholder="Tipe AP"
                            title="Klik untuk mengedit tipe AP"
                          />
                          <input
                            type="number"
                            min="0"
                            value={it.total}
                            onChange={(e) =>
                              handleUpdateApItem(zoneKey, idx, 'total', e.target.value)
                            }
                            className="w-16 px-1.5 py-0.5 text-xs font-extrabold text-right text-emerald-900 bg-emerald-50/50 rounded border border-emerald-200 outline-hidden focus:ring-1 focus:ring-emerald-500"
                            title="Jumlah AP unit"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteApItem(zoneKey, idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="Hapus tipe AP ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {zoneItems.length === 0 && (
                        <div className="text-[11px] text-slate-400 text-center py-2 italic bg-white rounded border border-dashed border-slate-200">
                          Belum ada tipe AP di zona ini.
                        </div>
                      )}
                    </div>

                    {/* Add new AP type to this zone */}
                    <div className="p-2 bg-white rounded-lg border border-dashed border-emerald-300 space-y-1.5">
                      <div className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>+ Tambah Tipe AP ke {zoneConfig.title}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[1fr_56px] gap-1.5">
                          <select
                            value={inputState.type}
                            onChange={(e) =>
                              setNewApInputs((prev) => ({
                                ...prev,
                                [zoneKey]: { ...prev[zoneKey], type: e.target.value },
                              }))
                            }
                            className="px-2 py-1 text-[11px] rounded border border-slate-300 bg-slate-50 font-medium"
                          >
                            {POPULAR_AP_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                            <option value="CUSTOM">+ Tipe AP Lainnya (Ketik Manual)...</option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            value={inputState.total}
                            onChange={(e) =>
                              setNewApInputs((prev) => ({
                                ...prev,
                                [zoneKey]: {
                                  ...prev[zoneKey],
                                  total: Math.max(1, parseInt(e.target.value) || 1),
                                },
                              }))
                            }
                            className="px-1.5 py-1 text-[11px] font-bold text-center rounded border border-slate-300 bg-slate-50"
                            placeholder="Qty"
                            title="Jumlah unit"
                          />
                        </div>

                        {inputState.type === 'CUSTOM' && (
                          <input
                            type="text"
                            placeholder="Ketik tipe/model AP baru..."
                            value={inputState.customType}
                            onChange={(e) =>
                              setNewApInputs((prev) => ({
                                ...prev,
                                [zoneKey]: { ...prev[zoneKey], customType: e.target.value },
                              }))
                            }
                            className="w-full px-2 py-1 text-[11px] rounded border border-emerald-400 bg-white"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleAddApItem(zoneKey)}
                          className="w-full py-1 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambahkan Tipe AP</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status / Issue Input */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Status / Issue ({zoneConfig.title}):
                    </label>
                    <input
                      type="text"
                      value={zoneData?.issue || ''}
                      placeholder="Contoh: No Issue / 1 AP Restart"
                      onChange={(e) => {
                        updateField('accessPointMonitoring', {
                          ...report.accessPointMonitoring,
                          [zoneKey]: {
                            ...report.accessPointMonitoring[zoneKey],
                            issue: e.target.value,
                          },
                        });
                      }}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aggregated Total AP Summary on HCJ */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-900">
                  Total Ringkasan Access Point on HCJ (Hotel Ciputra Jakarta)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold">Total Seluruh AP:</span>
                <span className="text-base font-black text-emerald-950 px-3 py-0.5 bg-emerald-200/80 rounded-lg border border-emerald-300">
                  {totalApOverall} AP
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10.5px] font-bold text-slate-700 mb-1.5">
                Rincian Agregasi Tipe AP (Otomatis Terkumpul dari Seluruh Lantai &amp; Area):
              </div>
              <div className="flex flex-wrap gap-2">
                {(report.accessPointMonitoring?.totalSummary?.items || []).map((sumIt, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-xs shadow-2xs"
                  >
                    <span className="font-medium text-slate-700">{sumIt.type}:</span>
                    <span className="font-black text-emerald-900">{sumIt.total} Unit</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10.5px] text-emerald-800 font-medium flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Angka total dan rincian tipe di atas otomatis terhitung &amp; sinkron ke tabel Halaman 5 &amp; 6 lembar cetak/PDF A4.
              </span>
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
          {/* 12. SARA System Report IT Section with Snipping Tool paste */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900">12. Sara System Report IT Section</h4>
            <ImageUploadDropzone
              label="Screenshot SARA IT Maintenance System"
              sublabel="Bisa paste langsung dari Snipping Tool (Ctrl+V) atau klik tombol paste"
              imageUrl={report.saraSystemReport?.screenshotUrl}
              onImageChange={(dataUrl) => {
                updateField('saraSystemReport', {
                  ...report.saraSystemReport,
                  screenshotUrl: dataUrl,
                });
              }}
              onRemove={() => {
                updateField('saraSystemReport', {
                  ...report.saraSystemReport,
                  screenshotUrl: '',
                });
              }}
              placeholderText="Belum ada screenshot SARA IT Section"
              maxHeightClass="max-h-60"
            />

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
