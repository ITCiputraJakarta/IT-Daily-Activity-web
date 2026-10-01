import React, { useState, useEffect, useRef } from 'react';
import { CiputraLogo } from './CiputraLogo';
import { addDaysToDateString, getTodayDateString } from '../utils/imageUtils';
import {
  FileText,
  CheckSquare,
  Printer,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Clock,
  Eye,
  Edit3,
  Users,
  Building2,
  Check,
  RefreshCw,
  MessageSquare,
  Flame,
  Globe,
  Activity,
  ChevronDown,
  Database,
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';
import {
  getQuotaStats,
  subscribeQuotaStats,
  QuotaDailyStats,
  estimateCurrentStorage
} from '../services/quotaTracker';

interface Props {
  activeTab: 'activity' | 'checklist' | 'wareport';
  setActiveTab: (tab: 'activity' | 'checklist' | 'wareport') => void;
  viewMode: 'edit' | 'preview';
  setViewMode: (mode: 'edit' | 'preview') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onSave: () => void;
  isSaving: boolean;
  onPrint: () => void;
  onDownloadPdf: () => void;
  isGeneratingPdf: boolean;
  onOpenHistory: () => void;
  onOpenTeamModal: () => void;
  onOpenUserModal: () => void;
  onOpenLogoModal: () => void;
  onOpenQuotaModal: () => void;
  onCleanupStorage?: () => void;
  customLogoUrl: string | null;
  saveStatusText?: string;
  isDbOnline: boolean;
  onCheckDb: () => void;
  checklistTaskCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  onSave,
  isSaving,
  onPrint,
  onDownloadPdf,
  isGeneratingPdf,
  onOpenHistory,
  onOpenTeamModal,
  onOpenUserModal,
  onOpenLogoModal,
  onOpenQuotaModal,
  onCleanupStorage,
  customLogoUrl,
  saveStatusText,
  isDbOnline,
  onCheckDb,
  checklistTaskCount,
}) => {
  const [quotaStats, setQuotaStats] = useState<QuotaDailyStats>(getQuotaStats());
  const [storageInfo, setStorageInfo] = useState(estimateCurrentStorage());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to live quota metrics
  useEffect(() => {
    const unsub = subscribeQuotaStats((newStats) => {
      setQuotaStats(newStats);
      setStorageInfo(estimateCurrentStorage());
    });
    return unsub;
  }, []);

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevDay = () => {
    setSelectedDate(addDaysToDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDaysToDateString(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print select-none">
      {/* Top Bar: Compact, clean single row (Height ~52px) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-20 sm:w-24 flex items-center justify-center shrink-0">
            <CiputraLogo size="sm" customLogoUrl={customLogoUrl} />
          </div>
          <div className="border-l border-slate-200 pl-2 hidden md:block min-w-0">
            <h1 className="text-xs font-bold text-slate-900 leading-tight truncate">
              IT Daily Activity &amp; Checklist
            </h1>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              Hotel Ciputra Jakarta · A4 Ready
            </p>
          </div>
        </div>

        {/* Center: Sleek Date Navigator */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Hari Sebelumnya"
            className="p-1 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 px-1 sm:px-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0 hidden sm:block" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-26 sm:w-28 text-center"
            />
          </div>
          <button
            type="button"
            onClick={handleNextDay}
            title="Hari Berikutnya"
            className="p-1 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] font-bold text-emerald-800 hover:bg-white px-1.5 sm:px-2 py-0.5 rounded-lg transition cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* Right: Cloud & Quota Monitor + Primary Actions + Kelola Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Live Realtime Cloud & Quota Pill (Clickable for full quota monitor) */}
          <button
            type="button"
            onClick={onOpenQuotaModal}
            title="Monitor Real-time Kuota: Firebase Firestore (Writes, Reads, Storage) & Vercel Daily Limits (Klik untuk buka rincian lengkap)"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-emerald-300 bg-linear-to-r from-emerald-50 via-white to-slate-50 hover:from-emerald-100 hover:to-slate-100 text-slate-800 text-xs font-semibold transition shadow-2xs cursor-pointer group"
          >
            {/* Live Indicator */}
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-900 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </span>

            <span className="text-slate-300">|</span>

            {/* Firebase Quota Detailed */}
            <span
              className="flex items-center gap-1 text-[10.5px] text-amber-900 font-semibold"
              title={`Firebase Spark Quota:\n• Writes: ${quotaStats.firebaseWrites}/20.000\n• Reads: ${quotaStats.firebaseReads}/50.000\n• Storage: ${storageInfo.formattedSize}/1GB`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden xl:inline">Firebase:</span>
              <span className="font-bold text-amber-950">{quotaStats.firebaseWrites}</span>
              <span className="text-slate-400 text-[10px]">/20kW</span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="hidden sm:inline font-bold text-amber-950">{quotaStats.firebaseReads}</span>
              <span className="hidden sm:inline text-slate-400 text-[10px]">/50kR</span>
              <span className="hidden 2xl:inline text-slate-300">·</span>
              <span className="hidden 2xl:inline text-slate-600 text-[10px]">{storageInfo.formattedSize}</span>
            </span>

            <span className="text-slate-300 hidden md:inline">|</span>

            {/* Vercel Daily Limit Live Realtime */}
            <span
              className="hidden md:flex items-center gap-1 text-[10.5px] text-blue-900 font-semibold"
              title={`Vercel Hobby Edge Limits:\n• Daily Deployments: ${quotaStats.vercelDeployments}/100 per hari\n• Daily Requests: ${quotaStats.vercelRequests}/16.600 per hari`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden xl:inline">Vercel:</span>
              <span className="font-bold text-blue-950">{quotaStats.vercelDeployments}</span>
              <span className="text-slate-400 text-[10px]">/100d</span>
              <span className="hidden lg:inline text-slate-300">·</span>
              <span className="hidden lg:inline font-bold text-blue-950">{quotaStats.vercelRequests}</span>
              <span className="hidden lg:inline text-slate-400 text-[10px]">/16.6k</span>
            </span>
          </button>

          {/* Quick Manual Save */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title="Simpan dokumen sekarang ke Cloud Firestore & Cadangan Lokal"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>

          {/* Print A4 */}
          <button
            type="button"
            onClick={onPrint}
            title="Cetak langsung ke printer atau format PDF browser"
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cetak</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            title="Unduh langsung file PDF dokumen A4 sesuai template Hotel Ciputra Jakarta"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isGeneratingPdf ? 'PDF...' : 'PDF A4'}</span>
          </button>

          {/* Kelola / Pengaturan Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Menu Pengaturan &amp; Kelola Master Data"
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <span>Kelola</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Dropdown Card */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Master Data &amp; Pengaturan
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTeamModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="block font-bold">Kelola PIC IT</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Petugas teknis &amp; tim IT</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUserModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="block font-bold">Kelola User / Departemen</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Klien hotel (Front Office, HK, dll)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenLogoModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="block font-bold">Ganti / Upload Logo</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Kustomisasi logo dokumen</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenHistory();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Clock className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="block font-bold">Arsip &amp; Riwayat Dokumen</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Daftar arsip tanggal tersimpan</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenQuotaModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="block font-bold text-emerald-800">Detail Kuota Firebase &amp; Vercel</span>
                    <span className="block text-[10px] text-emerald-600 font-normal">Pantau limit harian &amp; realtime</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCheckDb();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Database className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="block font-bold">Status Database &amp; Rules</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {isDbOnline ? '✓ Terhubung ke Cloud' : 'Mode Cadangan Lokal'}
                    </span>
                  </div>
                </button>

                {onCleanupStorage && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCleanupStorage();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-red-50 hover:text-red-900 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <HardDrive className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="block font-bold">Pembersihan Storage</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Hapus rekaman lama (&gt;60 hari)
                      </span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sub-bar: Clean Slim Tabs, Auto-Save Status & View Toggle (Height ~38px) */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-1 gap-2">
          
          {/* Main Document Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Daily Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>2. Daily Checklist ({checklistTaskCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wareport')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'wareport'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
              <span>3. WA Report</span>
            </button>
          </div>

          {/* Auto-save Status & Mode Toggle */}
          <div className="flex items-center gap-2">
            {saveStatusText && (
              <span
                className={`hidden md:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md items-center gap-1 border transition ${
                  isSaving
                    ? 'text-blue-700 bg-blue-50 border-blue-200 animate-pulse'
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-blue-600" />
                ) : (
                  <Check className="w-3 h-3 shrink-0 text-emerald-600" />
                )}
                <span className="truncate max-w-[200px]">{saveStatusText}</span>
              </span>
            )}

            {/* Input Form vs A4 Preview Toggle */}
            <div className="bg-white border border-slate-200 rounded-lg p-0.5 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden sm:inline">Input Form</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Preview A4</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
