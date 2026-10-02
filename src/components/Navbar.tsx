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
  HardDrive,
  Layers
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
  onOpenDepartmentModal?: () => void;
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
  onOpenDepartmentModal,
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
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

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
      const target = e.target as Node;
      const insideDesktop = desktopMenuRef.current && desktopMenuRef.current.contains(target);
      const insideMobile = mobileMenuRef.current && mobileMenuRef.current.contains(target);
      if (!insideDesktop && !insideMobile) {
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
      {/* ========================================================================= */}
      {/* 1. DESKTOP & TABLET TOP BAR (>= 640px)                                    */}
      {/* Safe 3-column / flex layout where Date Navigator and Kelola NEVER collide */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-3 sm:px-4 py-2 items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="h-9 w-24 sm:w-28 bg-white rounded-lg px-2 py-1 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
            <CiputraLogo size="fit" customLogoUrl={customLogoUrl} />
          </div>
          <div className="border-l border-slate-200 pl-2.5 hidden md:block min-w-0">
            <h1 className="text-xs font-bold text-slate-900 leading-tight truncate">
              IT Daily Activity &amp; Checklist
            </h1>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              Hotel Ciputra Jakarta · A4 Ready
            </p>
          </div>
        </div>

        {/* Center: Sleek Date Navigator */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-300 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Hari Sebelumnya"
            className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-28 text-center"
            />
          </div>
          <button
            type="button"
            onClick={handleNextDay}
            title="Hari Berikutnya"
            className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-white px-2 py-0.5 rounded-lg transition border border-transparent hover:border-slate-200 cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* Right: Cloud Quota + Primary Actions + Kelola Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Realtime Cloud & Quota Pill (Desktop only to prevent clutter) */}
          <button
            type="button"
            onClick={onOpenQuotaModal}
            title="Monitor Real-time Kuota: Firebase Firestore (Writes, Reads, Storage) & Vercel Daily Limits"
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer group"
          >
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1 text-[10.5px] text-slate-700 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-500">FB:</span>
              <span className="font-bold text-slate-900">{quotaStats.firebaseWrites}</span>
              <span className="text-slate-500 text-[10px]">/20kW</span>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-slate-900">{quotaStats.firebaseReads}</span>
              <span className="text-slate-500 text-[10px]">/50kR</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1 text-[10.5px] text-slate-700 font-semibold">
              <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-slate-500">Vercel:</span>
              <span className="font-bold text-slate-900">{quotaStats.vercelDeployments}</span>
              <span className="text-slate-500 text-[10px]">/100d</span>
            </span>
          </button>

          {/* Quick Manual Save */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title="Simpan dokumen sekarang ke Cloud Firestore & Cadangan Lokal"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>

          {/* Print A4 (Desktop lg+) */}
          <button
            type="button"
            onClick={onPrint}
            title="Cetak langsung ke printer atau format PDF browser"
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            title="Unduh langsung file PDF dokumen A4 sesuai template Hotel Ciputra Jakarta"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'PDF...' : 'PDF A4'}</span>
          </button>

          {/* Kelola / Pengaturan Dropdown */}
          <div className="relative" ref={desktopMenuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Menu Pengaturan &amp; Kelola Master Data"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <span>Kelola</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Card */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Master Data &amp; Pengaturan
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTeamModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Kelola PIC IT</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Petugas teknis &amp; sortir urutan atas-bawah</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenDepartmentModal) {
                      onOpenDepartmentModal();
                    } else {
                      onOpenUserModal();
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Kelola Departemen</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Tambah, edit nama &amp; sortir urutan atas-bawah</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUserModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Kelola User / Klien Hotel</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Klien hotel (Front Office, HK, FB, dll)</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenLogoModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Ganti / Upload Logo</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Kustomisasi logo dokumen</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenHistory();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Arsip &amp; Riwayat Dokumen</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Daftar arsip tanggal tersimpan</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenQuotaModal();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Detail Kuota Firebase &amp; Vercel</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Pantau limit harian &amp; realtime</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCheckDb();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Database className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Status Database &amp; Rules</span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      {isDbOnline ? '✓ Terhubung ke Cloud Firestore' : 'Mode Cadangan Lokal'}
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
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <HardDrive className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Pembersihan Storage</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
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

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP BAR (< 640px) - 2-TIER COLLISION-PROOF LAYOUT               */}
      {/* Tier 1: Logo & Action Buttons (Simpan, PDF, Kelola)                       */}
      {/* Tier 2: Dedicated Full-width Date Navigator Bar                           */}
      {/* ========================================================================= */}
      <div className="sm:hidden px-3 pt-2 pb-1.5 space-y-2">
        {/* Tier 1: Brand Logo & Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="h-8 w-24 bg-white rounded-lg px-1.5 py-0.5 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
            <CiputraLogo size="fit" customLogoUrl={customLogoUrl} />
          </div>

          {/* Action Buttons: Save, PDF, Kelola */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Manual Save */}
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? '...' : 'Simpan'}</span>
            </button>

            {/* Download PDF A4 */}
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              title="Unduh PDF A4"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            {/* Kelola Dropdown */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <span>Kelola</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Dropdown Card */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Master Data &amp; Pengaturan
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenTeamModal();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Kelola PIC IT</span>
                      <span className="block text-[10px] text-slate-500">Petugas teknis &amp; sortir urutan</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onOpenDepartmentModal) {
                        onOpenDepartmentModal();
                      } else {
                        onOpenUserModal();
                      }
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Kelola Departemen</span>
                      <span className="block text-[10px] text-slate-500">Tambah, edit nama &amp; sortir urutan</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenUserModal();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Kelola User / Klien Hotel</span>
                      <span className="block text-[10px] text-slate-500">Klien hotel (Front Office, HK, dll)</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onPrint();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Cetak Dokumen</span>
                      <span className="block text-[10px] text-slate-500">Buka dialog cetak browser</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenLogoModal();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Ganti / Upload Logo</span>
                      <span className="block text-[10px] text-slate-500">Kustomisasi logo dokumen</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Arsip &amp; Riwayat Dokumen</span>
                      <span className="block text-[10px] text-slate-500">Daftar arsip tanggal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenQuotaModal();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Detail Kuota Firebase &amp; Vercel</span>
                      <span className="block text-[10px] text-slate-500">Pantau limit realtime</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCheckDb();
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Database className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Status Database</span>
                      <span className="block text-[10px] text-slate-500">
                        {isDbOnline ? '✓ Terhubung ke Cloud' : 'Mode Cadangan Lokal'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Full-width Date Navigator Bar on Mobile */}
        <div className="flex items-center justify-between gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-300 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Hari Sebelumnya"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center justify-center gap-1.5 flex-1 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer text-center w-full max-w-[130px]"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            title="Hari Berikutnya"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-slate-50 px-2 py-1 rounded-lg transition border border-slate-200 cursor-pointer shrink-0 shadow-2xs"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-BAR: DOCUMENT TABS, AUTO-SAVE STATUS & VIEW MODE TOGGLE            */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-1 gap-2 flex-wrap sm:flex-nowrap">
          {/* Main Document Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'activity'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Daily Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'checklist'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>2. Daily Checklist ({checklistTaskCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wareport')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'wareport'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>3. WA Report</span>
            </button>
          </div>

          {/* Auto-save Status & Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {saveStatusText && (
              <span
                className={`hidden md:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md items-center gap-1 border transition ${
                  isSaving
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-300 animate-pulse'
                    : 'text-slate-600 bg-white border-slate-200'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-emerald-600" />
                ) : (
                  <Check className="w-3 h-3 shrink-0 text-emerald-600" />
                )}
                <span className="truncate max-w-[200px]">{saveStatusText}</span>
              </span>
            )}

            {/* Input Form vs A4 Preview Toggle */}
            <div className="bg-slate-200/80 border border-slate-300 rounded-lg p-0.5 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode Input / Formulir Pengisian"
              >
                <Edit3 className="w-3 h-3" />
                <span>Form</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode Preview Cetak Lembar A4"
              >
                <Eye className="w-3 h-3" />
                <span>Preview A4</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
