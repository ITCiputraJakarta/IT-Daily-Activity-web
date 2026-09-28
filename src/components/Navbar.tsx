import React from 'react';
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
  HardDrive,
  Users,
  Building2,
  Wifi,
  WifiOff,
  Check,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

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
  customLogoUrl,
  saveStatusText,
  isDbOnline,
  onCheckDb,
  checklistTaskCount,
}) => {
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 sm:w-28 flex items-center justify-center shrink-0">
            <CiputraLogo size="sm" customLogoUrl={customLogoUrl} />
          </div>
          <button
            type="button"
            onClick={onOpenLogoModal}
            title="Klik untuk ganti atau upload logo dokumen"
            className="p-1 px-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition text-[10px] font-bold border border-slate-200 flex items-center gap-1 shrink-0"
          >
            <span>Ganti Logo</span>
          </button>
          <div className="border-l border-slate-200 pl-2.5 hidden md:block">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              IT Daily Activity & Checklist Report
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Hotel Ciputra Jakarta · Format A4 Siap Cetak & Ekspor
            </p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Hari Sebelumnya"
            className="p-1 rounded-lg hover:bg-white text-slate-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 px-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-28"
            />
          </div>
          <button
            type="button"
            onClick={handleNextDay}
            title="Hari Berikutnya"
            className="p-1 rounded-lg hover:bg-white text-slate-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] font-bold text-emerald-800 hover:bg-white px-2 py-0.5 rounded-lg transition"
          >
            Hari Ini
          </button>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Database Connection Pill */}
          <button
            type="button"
            onClick={onCheckDb}
            title="Status koneksi Cloud Firebase Firestore (Klik untuk tes)"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
              isDbOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDbOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="hidden md:inline">
              {isDbOnline ? 'Firebase Online' : 'Penyimpanan Lokal'}
            </span>
          </button>

          {/* Manage Client Users (Hotel Users / Departments) */}
          <button
            type="button"
            onClick={onOpenUserModal}
            title="Kelola daftar User / Client Hotel & Departemen (Terpisah dari PIC IT)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">Kelola User</span>
          </button>

          {/* Manage Team Members (IT PIC) */}
          <button
            type="button"
            onClick={onOpenTeamModal}
            title="Kelola nama petugas teknis IT (PIC) & status aktif"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition"
          >
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Kelola PIC</span>
          </button>

          {/* History button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Arsip</span>
          </button>

          {/* Save to Firestore */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title="Auto-save aktif. Klik untuk simpan instan sekarang."
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={onPrint}
            title="Cetak langsung ke printer atau format PDF browser"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cetak A4</span>
          </button>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            title="Unduh langsung file PDF dokumen A4 sesuai template"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF A4'}</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Main Tabs & View Toggle */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-1.5 gap-2">
          {/* Main Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'activity'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              1. Daily Activity Report (2 Halaman)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'checklist'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              2. Daily Checklist ({checklistTaskCount} Task)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wareport')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'wareport'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              3. Wa report
            </button>
          </div>

          {/* View Mode Toggle: Edit Form vs A4 Preview */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {saveStatusText && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border transition ${
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
                <span className="truncate max-w-[240px]">{saveStatusText}</span>
              </span>
            )}

            <div className="bg-white border border-slate-200 rounded-lg p-0.5 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  viewMode === 'edit'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Input Form
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  viewMode === 'preview'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview A4
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
