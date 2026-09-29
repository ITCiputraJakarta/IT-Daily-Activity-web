import React, { useState, useRef } from 'react';
import {
  DailyActivityReport,
  DailyChecklistReport,
  TeamMember,
} from '../types';
import { CiputraLogo } from './CiputraLogo';
import { compressImage } from '../utils/imageUtils';
import {
  exportElementToJpg,
  exportElementToPng,
  copyElementAsImageToClipboard,
  triggerNativePrint,
} from '../utils/pdfExport';
import {
  Download,
  Copy,
  Check,
  Camera,
  Upload,
  RefreshCw,
  Thermometer,
  Wifi,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Trash2,
  FileImage,
  Sun,
  Moon,
} from 'lucide-react';

interface WaReportViewProps {
  activityReport: DailyActivityReport;
  checklistReport: DailyChecklistReport;
  teamMembers: TeamMember[];
  customLogoUrl: string | null;
  onUpdateChecklist: (updated: DailyChecklistReport) => void;
  onUpdateActivity?: (updated: DailyActivityReport) => void;
}

export const WaReportView: React.FC<WaReportViewProps> = ({
  activityReport,
  checklistReport,
  teamMembers,
  customLogoUrl,
  onUpdateChecklist,
  onUpdateActivity,
}) => {
  const [layoutMode, setLayoutMode] = useState<'a4' | 'wide'>('a4');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState<boolean>(false);

  // Item #1 from checklist (Unifi Controller)
  const item1 =
    checklistReport.items.find((it) => it.no === 1) || checklistReport.items[0];
  const item1Remark = item1?.remark || 'No issue';

  // Handle Photo upload from Gallery or Camera/Live
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      const updated: DailyChecklistReport = {
        ...checklistReport,
        waReportPhoto: compressed,
        waReportPhotoCaption: item1Remark,
        updatedAt: Date.now(),
      };
      onUpdateChecklist(updated);
      showNotice('✓ Photo successfully uploaded for WA Report.');
    } catch (err) {
      console.error('Failed to process image:', err);
      showNotice('Failed to process image. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRequestRemovePhoto = () => {
    setShowDeletePhotoModal(true);
  };

  const handleConfirmRemovePhoto = () => {
    const updated: DailyChecklistReport = {
      ...checklistReport,
      waReportPhoto: '',
      updatedAt: Date.now(),
    };
    onUpdateChecklist(updated);
    setShowDeletePhotoModal(false);
    showNotice('✓ Photo No. 4 (User Connected & AP) successfully deleted.');
  };

  const handleSyncItem1Remark = () => {
    const updated: DailyChecklistReport = {
      ...checklistReport,
      waReportPhotoCaption: item1Remark,
      updatedAt: Date.now(),
    };
    onUpdateChecklist(updated);
    showNotice('✓ Description synchronized from Checklist Task #1.');
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Download as high-res JPG
  const handleDownloadJpg = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const filename = `WA_Report_HCJ_${checklistReport.date || 'Report'}.jpg`;
      await exportElementToJpg(cardRef.current, filename, 2);
      showNotice('✓ High-res JPG WA Report image successfully downloaded!');
    } catch (err) {
      console.error('Download JPG failed:', err);
      showNotice('Failed to generate JPG. Please use the Print button.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download as high-res PNG
  const handleDownloadPng = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const filename = `WA_Report_HCJ_${checklistReport.date || 'Report'}.png`;
      await exportElementToPng(cardRef.current, filename, 2);
      showNotice('✓ High-res PNG WA Report image successfully downloaded!');
    } catch (err) {
      console.error('Download PNG failed:', err);
      showNotice('Failed to generate PNG. Please try JPG format.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image directly to Clipboard for instant Ctrl+V into WhatsApp Web
  const handleCopyToClipboard = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const success = await copyElementAsImageToClipboard(cardRef.current, 2);
      if (success) {
        setCopiedSuccess(true);
        showNotice('✓ Image copied to Clipboard! Paste (Ctrl+V) directly into WhatsApp.');
        setTimeout(() => setCopiedSuccess(false), 3000);
      } else {
        showNotice('Browser does not support direct image copying. Please use Download JPG/PNG.');
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showNotice('Failed to copy image. Please use Download JPG or PNG buttons.');
    } finally {
      setIsExporting(false);
    }
  };

  // Native Print
  const handlePrint = () => {
    triggerNativePrint();
  };

  // Helper to extract and format Traffic metrics (Max In, Avg In, Current In) consistently
  const getTrafficMetrics = () => {
    let m = (activityReport.internetTraffic?.maxIn || '').trim();
    let a = (activityReport.internetTraffic?.avgIn || '').trim();
    let c = (activityReport.internetTraffic?.currentIn || '').trim();

    // Fallback: check checklist item #2 remark if activityReport doesn't have it yet
    if (!m || !a || !c) {
      const item2 = checklistReport.items.find(
        (it) => it.no === 2 || it.taskList.toLowerCase().includes('bandwidth')
      );
      if (item2?.remark && item2.remark !== '-') {
        const mMatch = item2.remark.match(/MAX:\s*([^\s|]+)/i);
        const aMatch = item2.remark.match(/AVG:\s*([^\s|]+)/i);
        const cMatch = item2.remark.match(/(?:CURRENT|CR):\s*([^\s|]+)/i);
        if (!m && mMatch) m = mMatch[1].trim();
        if (!a && aMatch) a = aMatch[1].trim();
        if (!c && cMatch) c = cMatch[1].trim();
      }
    }

    const cleanTrafficNum = (val: string) => {
      if (!val || val === '-') return '-';
      const numOnly = val.replace(/mbps|m/gi, '').trim();
      return numOnly ? `${numOnly} Mbps` : '-';
    };

    return {
      max: cleanTrafficNum(m),
      avg: cleanTrafficNum(a),
      current: cleanTrafficNum(c),
    };
  };

  // Helper to prevent double °C and %: strictly extracts numeric value and attaches single unit
  const formatTempValue = (val?: string) => {
    if (!val || !val.trim()) return '-';
    const match = val.match(/[\d.]+/);
    return match ? `${match[0]}°C` : '-';
  };

  const formatHumValue = (val?: string) => {
    if (!val || !val.trim()) return '-';
    const match = val.match(/[\d.]+/);
    return match ? `${match[0]}%` : '-';
  };

  const trafficMetrics = getTrafficMetrics();

  // Split 31 checklist items into 2 neat columns for compact display
  const halfLength = Math.ceil(checklistReport.items.length / 2);
  const checklistCol1 = checklistReport.items.slice(0, halfLength);
  const checklistCol2 = checklistReport.items.slice(halfLength);

  // Statistics
  const totalTasks = checklistReport.items.length;
  const checkedTasks = checklistReport.items.filter((i) => i.status === 'Checked').length;
  const issueTasks = checklistReport.items.filter((i) => i.status === 'Issue').length;
  const pendingTasks = checklistReport.items.filter(
    (i) => i.status === 'Pending' || i.status === 'In Progress'
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Action Bar / Controls (Excluded from export via no-export class) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 no-export">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
              Tab 3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              WhatsApp Report (Ready-to-Print & Export 1-Page Layout)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            31 Tasks Checklist, Internet Traffic (MRTG), Server Room Temperature, and Photo Documentation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Layout Toggle: A4 vs 1920x1080 */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLayoutMode('a4')}
              className={`px-2.5 py-1 rounded-md transition ${
                layoutMode === 'a4'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="A4 Standard Format (Portrait)"
            >
              Fit A4
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('wide')}
              className={`px-2.5 py-1 rounded-md transition ${
                layoutMode === 'wide'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Wide Format 1920×1080 (Landscape)"
            >
              1920×1080 Fit
            </button>
          </div>

          {/* Copy to WhatsApp Clipboard */}
          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            title="Copy high-res image directly to clipboard to paste (Ctrl+V) into WhatsApp"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {copiedSuccess ? (
              <Check className="w-4 h-4 text-emerald-200" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedSuccess ? 'Copied!' : 'Copy to WA'}</span>
          </button>

          {/* Download as JPG */}
          <button
            type="button"
            onClick={handleDownloadJpg}
            disabled={isExporting}
            title="Download this page as high-resolution JPG image"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileImage className="w-4 h-4" />
            )}
            <span>Download JPG</span>
          </button>

          {/* Download as PNG */}
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            title="Download this page as high-resolution lossless PNG image"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PNG</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            title="Open browser print dialog (Print to physical printer or Save as PDF)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between no-export">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Hidden File Inputs for Live/Camera & Gallery */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Main Single-Page A4 / 1920x1080 Container to be captured into JPG/PNG */}
      <div className="flex justify-center overflow-x-auto pb-6">
        <div
          ref={cardRef}
          id="wa-report-card"
          className={`bg-white text-slate-900 border border-slate-300 shadow-md p-4 sm:p-5 transition-all ${
            layoutMode === 'a4'
              ? 'w-full max-w-[900px] min-h-[1200px] rounded-lg'
              : 'w-full max-w-[1240px] min-h-[760px] rounded-lg'
          }`}
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {/* TOP HEADER */}
          <div className="border-b-2 border-slate-800 pb-2.5 mb-3 flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="w-32 sm:w-36 flex items-center shrink-0">
              <CiputraLogo size="md" customLogoUrl={customLogoUrl} />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 text-center px-2">
              <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-slate-900">
                DAILY ACTIVITY & CHECKLIST REPORT
              </h1>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                HOTEL CIPUTRA JAKARTA · IT DEPARTMENT
              </p>
              <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                Date:{' '}
                <span className="text-slate-900 font-bold">
                  {checklistReport.formattedDate || checklistReport.date}
                </span>
              </p>
            </div>

            {/* Shift PIC Info Box */}
            <div className="text-right text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-1.5 shrink-0 min-w-[155px]">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-0.5 mb-0.5">
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-500" /> Morning:
                </span>
                <span className="font-bold text-slate-900 truncate">
                  {checklistReport.morningShiftPic || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-indigo-800 font-bold flex items-center gap-1">
                  <Moon className="w-3 h-3 text-indigo-500" /> Evening:
                </span>
                <span className="font-bold text-slate-900 truncate">
                  {checklistReport.eveningShiftPic || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION 2, 3, & 4: THREE CLEAN TOP CARDS (EQUAL HEIGHT & NON-OVERLAPPING) */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            
            {/* CARD 2: INTERNET TRAFFIC (MRTG / TRAFFIC ANALYSIS) */}
            <div className="border border-blue-200 rounded-lg p-2.5 bg-blue-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-blue-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-blue-700" />
                      Internet Traffic (MRTG)
                    </h2>
                  </div>
                  <span className="text-[8.5px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                    Traffic Analysis
                  </span>
                </div>

                {/* MRTG Screenshot - Zoomed & Large Display */}
                {activityReport.internetTraffic?.screenshotUrl ? (
                  <div
                    onClick={() =>
                      setPreviewImage({
                        url: activityReport.internetTraffic!.screenshotUrl!,
                        title: 'Internet Traffic (MRTG) - Full View',
                      })
                    }
                    className="mb-2 rounded border border-slate-200 overflow-hidden bg-white h-[145px] flex items-center justify-center relative group cursor-pointer"
                    title="Click to zoom / view full image"
                  >
                    <img
                      src={activityReport.internetTraffic.screenshotUrl}
                      alt="MRTG Traffic Analysis"
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="no-export absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                      <span>🔍 Zoom</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 h-[145px] rounded border border-dashed border-blue-200 bg-white flex flex-col items-center justify-center text-center p-2 text-[9.5px] text-slate-400">
                    <Wifi className="w-6 h-6 text-blue-300 mb-1" />
                    <span className="font-semibold text-slate-600">MRTG Traffic Graph</span>
                    <span className="text-[8.5px] text-slate-400 mt-0.5">Synchronized from Daily Activity</span>
                  </div>
                )}

                {/* Consistent Traffic Metrics (Max In, Avg In, Current In) */}
                <div className="bg-white border border-slate-200 rounded p-1.5 grid grid-cols-3 gap-1.5 text-center text-[8.5px]">
                  <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                    <span className="text-slate-500 font-semibold block text-[8px] uppercase">
                      Max In
                    </span>
                    <span className="font-bold text-slate-800 truncate block text-[9.5px]">
                      {trafficMetrics.max}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                    <span className="text-slate-500 font-semibold block text-[8px] uppercase">
                      Avg In
                    </span>
                    <span className="font-bold text-slate-800 truncate block text-[9.5px]">
                      {trafficMetrics.avg}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                    <span className="text-slate-500 font-semibold block text-[8px] uppercase">
                      Current In
                    </span>
                    <span className="font-bold text-slate-800 truncate block text-[9.5px]">
                      {trafficMetrics.current}
                    </span>
                  </div>
                </div>
              </div>

              {activityReport.internetTraffic?.notes && (
                <p className="text-[8.5px] text-slate-600 mt-1.5 font-medium italic border-t border-blue-100 pt-1">
                  Note: {activityReport.internetTraffic.notes}
                </p>
              )}
            </div>

            {/* CARD 3: SERVER TEMPERATURE (SERVER ROOM TEMPERATURE & HUMIDITY) */}
            <div className="border border-emerald-200 rounded-lg p-2.5 bg-emerald-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                      3
                    </span>
                    <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-emerald-700" />
                      Server Room Temperature
                    </h2>
                  </div>
                  <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Normal
                  </span>
                </div>

                {/* Metrics with single unit */}
                <div className="grid grid-cols-2 gap-1.5 text-center mb-1.5">
                  <div className="bg-white border border-slate-200 rounded p-1.5">
                    <span className="text-[8.5px] font-semibold text-slate-500 block uppercase">
                      Room Temp
                    </span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {formatTempValue(activityReport.serverTemperature?.currentTemp)}
                    </div>
                    <span className="text-[8px] text-slate-500 font-medium">
                      Std: 17°C - 23°C
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded p-1.5">
                    <span className="text-[8.5px] font-semibold text-slate-500 block uppercase">
                      Humidity
                    </span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {formatHumValue(activityReport.serverTemperature?.currentHum)}
                    </div>
                    <span className="text-[8px] text-slate-500 font-medium">
                      Std: 45% - 55%
                    </span>
                  </div>
                </div>

                {/* Evidence photo - Zoomed & Large Display */}
                {activityReport.serverTemperature?.photoUrl ? (
                  <div
                    onClick={() =>
                      setPreviewImage({
                        url: activityReport.serverTemperature!.photoUrl!,
                        title: 'Server Room Thermometer - Full View',
                      })
                    }
                    className="rounded border border-slate-200 overflow-hidden bg-white h-[110px] flex items-center justify-center relative group cursor-pointer"
                    title="Click to zoom / view full image"
                  >
                    <img
                      src={activityReport.serverTemperature.photoUrl}
                      alt="Server Room Thermometer"
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="no-export absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                      <span>🔍 Zoom</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[110px] rounded border border-dashed border-emerald-200 bg-white/70 flex flex-col items-center justify-center text-center p-2 text-[9.5px] text-slate-400">
                    <Thermometer className="w-5 h-5 text-emerald-300 mb-0.5" />
                    <span className="font-semibold text-slate-600">Thermometer Photo</span>
                    <span className="text-[8.5px] text-slate-400">Recorded from Server Room Check</span>
                  </div>
                )}
              </div>

              <div className="text-[8.5px] text-emerald-900 font-medium bg-emerald-100/60 p-1.5 rounded mt-1.5 flex items-center justify-between">
                <span>Server AC: Normal Operation</span>
                <span className="font-bold text-emerald-800">Optimal</span>
              </div>
            </div>

            {/* CARD 4: USER CONNECTED & AP (HEADER MATCHED WITH OTHER CARDS) */}
            <div className="border border-amber-200 rounded-lg p-2.5 bg-amber-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-amber-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                      4
                    </span>
                    <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-amber-600" />
                      User Connected & AP
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Access Points
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncItem1Remark}
                      title="Sync remark from Task #1"
                      className="no-export text-[8.5px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200 px-1.5 py-0.5 rounded transition flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Sync
                    </button>
                  </div>
                </div>

                {/* Photo Display - Zoomed & Large Display */}
                {checklistReport.waReportPhoto ? (
                  <div className="relative group rounded border border-slate-200 overflow-hidden bg-white h-[145px] flex items-center justify-center mb-1.5">
                    <img
                      src={checklistReport.waReportPhoto}
                      alt="User Connected & AP"
                      onClick={() =>
                        setPreviewImage({
                          url: checklistReport.waReportPhoto!,
                          title: 'User Connected & AP Documentation - Full View',
                        })
                      }
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      title="Click to zoom / view full image"
                    />
                    {/* Hover actions */}
                    <div className="no-export absolute top-1 right-1 flex items-center gap-1 bg-black/70 backdrop-blur-xs rounded p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        title="Change Photo (Gallery)"
                        className="p-1 text-white hover:text-amber-300 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        title="Take Live Photo (Camera)"
                        className="p-1 text-white hover:text-amber-300 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestRemovePhoto}
                        title="Delete Photo No. 4"
                        className="p-1 text-white hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="no-export absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 pointer-events-none">
                      <span>🔍 Zoom</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-1.5 h-[145px] rounded border-2 border-dashed border-amber-300 bg-white/80 flex flex-col items-center justify-center p-2 text-center">
                    <Camera className="w-6 h-6 text-amber-500 mb-1" />
                    <p className="text-[10px] font-semibold text-slate-700 mb-2">
                      Upload Documentation (Camera / Gallery)
                    </p>
                    <div className="no-export flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[9.5px] font-semibold transition border border-slate-300 shadow-2xs"
                      >
                        <Upload className="w-3 h-3 text-amber-700" />
                        Gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9.5px] font-semibold transition shadow-2xs"
                      >
                        <Camera className="w-3 h-3" />
                        Live Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Box below photo */}
              <div className="bg-amber-50/70 border border-amber-200 rounded p-1.5 text-slate-800">
                <div className="flex items-center justify-between mb-0.5 text-[8.5px]">
                  <span className="font-semibold text-amber-900 flex items-center gap-0.5">
                    <span>📌</span> Task #1 ({item1?.taskList || 'Unifi Controller'})
                  </span>
                  <span className="font-medium text-amber-700">
                    Remark / Description
                  </span>
                </div>
                <div className="text-[9px] font-normal text-slate-700 bg-white px-2 py-1 rounded border border-amber-200 truncate">
                  {checklistReport.waReportPhotoCaption || item1Remark}
                </div>
              </div>
            </div>

          </div>

          {/* ================================================================= */}
          {/* SECTION 1: DAILY TASK MONITORING (31 TASKS) */}
          {/* ================================================================= */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-white">
            <div className="flex items-center justify-between pb-1 mb-2 border-b-2 border-amber-500">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Daily Task Monitoring (31 Tasks)
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold">
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  ✓ {checkedTasks} Checked
                </span>
                {issueTasks > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                    ⚠ {issueTasks} Issue
                  </span>
                )}
                {pendingTasks > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                    ⏳ {pendingTasks} Pending
                  </span>
                )}
              </div>
            </div>

            {/* 2-Column Full Width Balanced Tables (No Overlap, Spacious Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px]">
              
              {/* Column 1: Items 1 to 16 */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#d97706] text-white font-bold text-[8.5px] border-b border-amber-700">
                      <th className="py-1 px-1 w-6 text-center">No</th>
                      <th className="py-1 px-1.5 text-left w-40">Task List</th>
                      <th className="py-1 px-1 text-center w-16">Shift / PIC</th>
                      <th className="py-1 px-1 text-center w-12">Status</th>
                      <th className="py-1 px-1.5 text-left">Remark / Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checklistCol1.map((item) => (
                      <tr
                        key={item.id || item.no}
                        className={`hover:bg-slate-50 ${
                          item.status === 'Issue'
                            ? 'bg-red-50 font-semibold'
                            : ''
                        }`}
                      >
                        <td className="py-0.5 px-1 text-center font-bold text-slate-500">
                          {item.no}
                        </td>
                        <td className="py-0.5 px-1.5 font-semibold text-slate-900 leading-tight">
                          <span className="block truncate max-w-[155px]" title={item.taskList}>
                            {item.taskList}
                          </span>
                        </td>
                        <td className="py-0.5 px-1 text-center">
                          <span
                            className={`inline-block px-1 py-0.5 rounded text-[7.5px] font-bold ${
                              item.shift === 'evening'
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                            title={`Shift: ${item.shift || 'morning'} | PIC: ${item.personIncharge || '-'}`}
                          >
                            {item.shift === 'evening' ? '🌙 ' : '☀️ '}
                            {item.personIncharge || (item.shift === 'evening' ? 'Evening' : 'Morning')}
                          </span>
                        </td>
                        <td className="py-0.5 px-1 text-center">
                          <span
                            className={`inline-block px-1 py-0.5 rounded text-[7.5px] font-bold ${
                              item.status === 'Checked'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Issue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status === 'Checked' ? 'OK' : item.status}
                          </span>
                        </td>
                        <td className="py-0.5 px-1.5 text-slate-700 leading-tight">
                          <span
                            className={`block truncate max-w-[145px] ${
                              item.status === 'Issue' ? 'text-red-700 font-bold' : ''
                            }`}
                            title={item.remark}
                          >
                            {item.remark || '✓ OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Column 2: Items 17 to 31 */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#d97706] text-white font-bold text-[8.5px] border-b border-amber-700">
                      <th className="py-1 px-1 w-6 text-center">No</th>
                      <th className="py-1 px-1.5 text-left w-40">Task List</th>
                      <th className="py-1 px-1 text-center w-16">Shift / PIC</th>
                      <th className="py-1 px-1 text-center w-12">Status</th>
                      <th className="py-1 px-1.5 text-left">Remark / Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checklistCol2.map((item) => (
                      <tr
                        key={item.id || item.no}
                        className={`hover:bg-slate-50 ${
                          item.status === 'Issue'
                            ? 'bg-red-50 font-semibold'
                            : ''
                        }`}
                      >
                        <td className="py-0.5 px-1 text-center font-bold text-slate-500">
                          {item.no}
                        </td>
                        <td className="py-0.5 px-1.5 font-semibold text-slate-900 leading-tight">
                          <span className="block truncate max-w-[155px]" title={item.taskList}>
                            {item.taskList}
                          </span>
                        </td>
                        <td className="py-0.5 px-1 text-center">
                          <span
                            className={`inline-block px-1 py-0.5 rounded text-[7.5px] font-bold ${
                              item.shift === 'evening'
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                            title={`Shift: ${item.shift || 'morning'} | PIC: ${item.personIncharge || '-'}`}
                          >
                            {item.shift === 'evening' ? '🌙 ' : '☀️ '}
                            {item.personIncharge || (item.shift === 'evening' ? 'Evening' : 'Morning')}
                          </span>
                        </td>
                        <td className="py-0.5 px-1 text-center">
                          <span
                            className={`inline-block px-1 py-0.5 rounded text-[7.5px] font-bold ${
                              item.status === 'Checked'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Issue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status === 'Checked' ? 'OK' : item.status}
                          </span>
                        </td>
                        <td className="py-0.5 px-1.5 text-slate-700 leading-tight">
                          <span
                            className={`block truncate max-w-[145px] ${
                              item.status === 'Issue' ? 'text-red-700 font-bold' : ''
                            }`}
                            title={item.remark}
                          >
                            {item.remark || '✓ OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Checklist Footer Info */}
            <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-500">
              <span className="font-semibold text-slate-700">
                Total 31 Daily Tasks Monitored & Verified
              </span>
              <span className="font-bold text-emerald-700">
                Hotel Ciputra Jakarta · IT Daily System Verification
              </span>
            </div>
          </div>

          {/* BOTTOM SIGN-OFF / FOOTER */}
          <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Hotel Ciputra Jakarta</span> · IT Support & Networking Team
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Preview Modal (Excluded from export) */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 no-export"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Preview & Zoom
                </span>
                <span className="text-slate-300 text-xs font-semibold">
                  · {previewImage.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-800 text-base font-bold transition"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
            <div className="p-2 sm:p-4 bg-black flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded shadow-lg"
              />
            </div>
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Klik di luar atau tombol ✕ untuk menutup</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for No. 4 Photo (Yes / No) */}
      {showDeletePhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Delete Photo No. 4?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus foto dokumentasi <strong className="text-slate-800">No. 4 (User Connected &amp; AP)</strong> dari WhatsApp Report?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeletePhotoModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition text-center cursor-pointer"
              >
                Tidak / Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePhoto}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
