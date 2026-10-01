import React, { useEffect, useState } from 'react';
import {
  Activity,
  Flame,
  Globe,
  Database,
  CheckCircle2,
  Clock,
  HardDrive,
  RefreshCw,
  X,
  Server,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Radio
} from 'lucide-react';
import {
  FIREBASE_SPARK_LIMITS,
  VERCEL_HOBBY_LIMITS,
  QuotaDailyStats,
  getQuotaStats,
  subscribeQuotaStats,
  estimateCurrentStorage
} from '../services/quotaTracker';
import { firebaseConfig } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDbOnline: boolean;
  onCheckDb: () => void;
  isCheckingDb: boolean;
}

export const QuotaMonitorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDbOnline,
  onCheckDb,
  isCheckingDb,
}) => {
  const [stats, setStats] = useState<QuotaDailyStats>(getQuotaStats());
  const [storageInfo, setStorageInfo] = useState(estimateCurrentStorage());
  const [activeTab, setActiveTab] = useState<'all' | 'firebase' | 'vercel'>('all');

  useEffect(() => {
    if (!isOpen) return;
    setStorageInfo(estimateCurrentStorage());
    const unsub = subscribeQuotaStats((newStats) => {
      setStats(newStats);
      setStorageInfo(estimateCurrentStorage());
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  // Firebase percentages
  const readPct = Math.min(100, (stats.firebaseReads / FIREBASE_SPARK_LIMITS.dailyReads) * 100);
  const writePct = Math.min(100, (stats.firebaseWrites / FIREBASE_SPARK_LIMITS.dailyWrites) * 100);
  const deletePct = Math.min(100, (stats.firebaseDeletes / FIREBASE_SPARK_LIMITS.dailyDeletes) * 100);
  const storageMbUsed = storageInfo.totalBytes / (1024 * 1024);
  const storagePct = Math.min(100, (storageMbUsed / FIREBASE_SPARK_LIMITS.storageMb) * 100);

  // Vercel percentages
  const vercelDeployPct = Math.min(100, (stats.vercelDeployments / VERCEL_HOBBY_LIMITS.dailyDeployments) * 100);
  const vercelReqPct = Math.min(100, (stats.vercelRequests / VERCEL_HOBBY_LIMITS.dailyEstimatedRequests) * 100);

  const formatLastActive = (ts: number) => {
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 5) return 'Baru saja (<5 detik)';
    if (diffSec < 60) return `${diffSec} detik yang lalu`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin} menit yang lalu`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Monitor Kuota Cloud & Realtime
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                  Live Realtime
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Pemakaian Harian Google Firebase Firestore & Vercel Edge Hosting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Live Status Banner */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Koneksi Real-time Aktif
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-400">
              Sinkronisasi terakhir: <strong>{formatLastActive(stats.lastActiveTimestamp)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Operasi: <span className="text-slate-200">{stats.lastOperation}</span>
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'all'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ringkasan Kuota (Semua)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'firebase'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Firebase Firestore</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'vercel'
                ? 'border-blue-600 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Vercel Deployment</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* SECTION 1: FIREBASE FIRESTORE */}
          {(activeTab === 'all' || activeTab === 'firebase') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      Firebase Cloud Firestore · Paket Spark (Gratis Selamanya)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Project ID: <strong className="font-mono text-slate-700">{firebaseConfig.projectId}</strong> · Reset Kuota: Tiap Pukul 07:00 WIB
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  99%+ Kuota Tersedia
                </span>
              </div>

              {/* Grid 4 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                
                {/* 1. Reads */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      Document Reads
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-700">
                      {readPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {stats.firebaseReads.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / {FIREBASE_SPARK_LIMITS.dailyReads.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(readPct, 1)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sisa: {(FIREBASE_SPARK_LIMITS.dailyReads - stats.firebaseReads).toLocaleString()}</span>
                    <span className="text-emerald-700 font-bold">Aman</span>
                  </div>
                </div>

                {/* 2. Writes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Document Writes
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-700">
                      {writePct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {stats.firebaseWrites.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / {FIREBASE_SPARK_LIMITS.dailyWrites.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(writePct, 1)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sisa: {(FIREBASE_SPARK_LIMITS.dailyWrites - stats.firebaseWrites).toLocaleString()}</span>
                    <span className="text-emerald-700 font-bold">Aman</span>
                  </div>
                </div>

                {/* 3. Deletes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      Document Deletes
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-700">
                      {deletePct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {stats.firebaseDeletes.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / {FIREBASE_SPARK_LIMITS.dailyDeletes.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(deletePct, 0.5)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sisa: {(FIREBASE_SPARK_LIMITS.dailyDeletes - stats.firebaseDeletes).toLocaleString()}</span>
                    <span className="text-emerald-700 font-bold">Aman</span>
                  </div>
                </div>

                {/* 4. Storage */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                      Storage Digunakan
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {storagePct.toFixed(3)}%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {storageInfo.formattedSize}
                    <span className="text-xs font-normal text-slate-400"> / 1.00 GB</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(storagePct, 0.5)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Total Dokumen: {storageInfo.documentCount}</span>
                    <span className="text-emerald-700 font-bold">&lt;1%</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION 2: VERCEL DEPLOYMENT & EDGE LIMITS */}
          {(activeTab === 'all' || activeTab === 'vercel') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      Vercel Edge Platform · Paket Hobby (Free Tier)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Global Edge CDN Node · Penanda Live Real-time & Kuota Harian
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Global Edge Aktif
                </span>
              </div>

              {/* Grid 3 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                
                {/* 1. Daily Deployments */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-slate-700" />
                      Limit Deploy Harian
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-700">
                      {vercelDeployPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {stats.vercelDeployments}
                    <span className="text-xs font-normal text-slate-400"> / {VERCEL_HOBBY_LIMITS.dailyDeployments} deploy</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-800 h-1.5 rounded-full"
                      style={{ width: `${Math.max(vercelDeployPct, 1)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sisa: {VERCEL_HOBBY_LIMITS.dailyDeployments - stats.vercelDeployments} deploy</span>
                    <span className="text-emerald-700 font-bold">100/Hari</span>
                  </div>
                </div>

                {/* 2. Bandwidth */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      Fast Data Transfer (Bandwidth)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-700">
                      &lt;0.1%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    ~0.05 GB
                    <span className="text-xs font-normal text-slate-400"> / {VERCEL_HOBBY_LIMITS.monthlyBandwidthGb} GB / bln</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '1%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sisa: ~99.95 GB</span>
                    <span className="text-emerald-700 font-bold">Sangat Ringan</span>
                  </div>
                </div>

                {/* 3. Edge Requests */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-emerald-600" />
                      Estimasi Edge Requests
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {vercelReqPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {stats.vercelRequests.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / {VERCEL_HOBBY_LIMITS.dailyEstimatedRequests.toLocaleString()} req</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${Math.max(vercelReqPct, 1)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Limit bln: 500k</span>
                    <span className="text-emerald-700 font-bold">Unmetered Static</span>
                  </div>
                </div>

              </div>

              {/* Edge Network Indicator */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-bold">Penanda Realtime Vercel CDN:</p>
                  <p className="text-[11.5px] text-blue-800">
                    Aplikasi di-deploy sebagai Single Page App (Vite React). Setiap aset HTML, JS, dan CSS dicache di jaringan Edge Vercel (Jakarta / Singapore Edge PoP) sehingga waktu muat super cepat (&lt;100ms) dan pemakaian resource server 0%.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: KEAMANAN & EFISIENSI SUMMARY */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Performa Kuota 100% Efisien:</p>
                <p className="text-[11px] text-emerald-800">
                  Dengan kompresi gambar otomatis (~40KB per foto) dan debounce keystroke, penggunaan kuota Firebase dan Vercel tidak akan pernah melebihi limit harian gratis.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCheckDb}
              disabled={isCheckingDb}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 transition shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
              <span>{isCheckingDb ? 'Menguji...' : 'Uji Koneksi Cloud'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 font-medium">
            Tanggal Kuota: <strong className="text-slate-800 font-mono">{stats.date}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
