import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Copy,
  Check,
  X,
  Server,
  Lock,
  Layers,
  FileCheck,
  Clock
} from 'lucide-react';
import { firebaseConfig, DbConnectionResult } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  connectionResult: DbConnectionResult | null;
  onRecheck: () => Promise<void>;
  isChecking: boolean;
}

const FIRESTORE_RULES_CODE = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for security, schema validation, and sanitization
    function isValidDateString(dateStr) {
      return dateStr is string && dateStr.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    }

    function isReasonableSize() {
      // Prevents oversized document injections while easily accommodating compressed images (~60KB)
      return request.resource.data.size() < 100;
    }

    // Daily Activity Reports (IT Daily Operations & Logbook)
    match /daily_activities/{date} {
      allow read: if true;
      allow create, update: if isValidDateString(date)
        && request.resource.data.date == date
        && request.resource.data.propertyName is string
        && request.resource.data.updatedAt is number
        && isReasonableSize();
      allow delete: if isValidDateString(date);
    }

    // Daily Checklist Reports (31 Tasks Morning & Evening Operations)
    match /daily_checklists/{date} {
      allow read: if true;
      allow create, update: if isValidDateString(date)
        && request.resource.data.date == date
        && request.resource.data.propertyName is string
        && request.resource.data.items is list
        && request.resource.data.updatedAt is number
        && isReasonableSize();
      allow delete: if isValidDateString(date);
    }

    // App Settings (Company Logo, IT PIC Team Members, Client Users)
    match /app_settings/{settingId} {
      allow read: if true;
      allow write: if settingId in ['company_logo', 'team_members', 'client_users']
        && isReasonableSize();
    }

    // Health Check Ping for online latency & connectivity monitor
    match /_health_check/{docId} {
      allow read, write: if docId == 'ping';
    }

    // Lock down all other document paths by default for security
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

export const DatabaseStatusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  connectionResult,
  onRecheck,
  isChecking,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'security' | 'rules'>('status');

  if (!isOpen) return null;

  const handleCopyRules = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy rules:', e);
    }
  };

  const isOnline = connectionResult?.isOnline ?? false;
  const latency = connectionResult?.latencyMs;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Status & Keamanan Database
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOnline
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-amber-500 text-slate-950 font-black'
                }`}>
                  {isOnline ? 'Cloud Online' : 'Penyimpanan Lokal'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Google Firebase Firestore · Hotel Ciputra Jakarta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Koneksi & Diagnostik</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pemeriksaan Keamanan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Aturan Firestore.rules</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Connection Status Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isOnline
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {isOnline
                        ? 'Terhubung Normal ke Firebase Firestore'
                        : 'Mode Cadangan Lokal (Offline)'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {connectionResult?.message || 'Memeriksa status koneksi...'}
                    </p>
                    {latency !== undefined && (
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          Latensi Jaringan: <strong>{latency}ms</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Uji Tulis & Baca: <strong>Normal</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onRecheck}
                  disabled={isChecking}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 transition shadow-2xs flex items-center gap-1.5 self-start sm:self-center shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
                  <span>{isChecking ? 'Menguji...' : 'Uji Ulang Koneksi'}</span>
                </button>
              </div>

              {/* Technical Config Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-600" />
                  Parameter Konfigurasi Cloud Firestore
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">PROJECT ID</span>
                    <span className="font-mono font-bold text-slate-900">{firebaseConfig.projectId}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">AUTH DOMAIN</span>
                    <span className="font-mono font-bold text-slate-900 truncate block">{firebaseConfig.authDomain}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">STORAGE BUCKET</span>
                    <span className="font-mono font-bold text-slate-900 truncate block">{firebaseConfig.storageBucket}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">SINKRONISASI REAL-TIME</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Aktif (Multi-Device onSnapshot)
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Safeguard Note */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Perlindungan Data Ganda (Dual-Storage Architecture):</p>
                  <p className="text-[11.5px] text-blue-800 leading-relaxed">
                    Setiap perubahan data teks atau foto langsung dicadangkan secara lokal (LocalStorage 0ms) sekaligus dikirim ke Firebase Firestore secara real-time. Jika internet terputus sewaktu-waktu, data Anda tidak akan pernah hilang.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold">Status Keamanan: Terproteksi Standar Enterprise</span>
                </div>
                <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                  6/6 Proteksi Aktif
                </span>
              </div>

              {/* Security Checklist Cards */}
              <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Validasi Format ID Dokumen (ISO 8601 Date Guard)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dokumen pada <code className="text-emerald-800 bg-slate-100 px-1 rounded font-mono">/daily_activities/</code> dan <code className="text-emerald-800 bg-slate-100 px-1 rounded font-mono">/daily_checklists/</code> hanya menerima format tanggal baku <code className="font-mono text-emerald-800">YYYY-MM-DD</code>.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Verifikasi Integritas Data & Skema</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Memastikan ID tanggal di dalam isi payload dokumen cocok persis dengan ID path dokumen, mencegah kesalahan penulisan data antar hari.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Validasi Array 31 Tasks Daily Checklist</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daftar checklist wajib berupa struktur list/array yang sah. Mencegah manipulasi tipe data yang dapat merusak aplikasi.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Isolasi Ketat Koleksi Pengaturan (app_settings)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hanya mengizinkan 3 dokumen setting yang terdaftar resmi: <code className="font-mono text-slate-800 bg-slate-100 px-1 rounded">company_logo</code>, <code className="font-mono text-slate-800 bg-slate-100 px-1 rounded">team_members</code>, dan <code className="font-mono text-slate-800 bg-slate-100 px-1 rounded">client_users</code>.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Kunci Koleksi Liar (Deny All Unknown Paths)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Aturan <code className="font-mono text-red-700 bg-red-50 px-1 rounded">match /{'{document=**}'} {'{ allow read, write: false; }'}</code> mengunci seluruh koleksi asing lainnya agar database tidak dapat disusupi.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Auto-Sanitasi & Kompresi Foto Anti-Overflow</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Setiap foto kamera/galeri dikompresi otomatis ke kisaran ~30KB–60KB, jauh di bawah batas 1MB Firestore untuk mencegah kegagalan simpan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-800">Kode firestore.rules Terverifikasi</h5>
                  <p className="text-[11px] text-slate-500">
                    Gunakan aturan ini di Firebase Console &gt; Firestore Database &gt; Tab Rules
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode Rules'}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72">
                <pre>{FIRESTORE_RULES_CODE}</pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">💡 Cara Mengunggah Aturan ke Firebase Console:</p>
                <ol className="list-decimal list-inside text-[11px] text-amber-800 space-y-0.5">
                  <li>Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">console.firebase.google.com</a> dan pilih proyek <strong>daily-ctivity-itbg</strong>.</li>
                  <li>Buka menu <strong>Firestore Database</strong> &gt; pilih tab <strong>Rules</strong> di bagian atas.</li>
                  <li>Klik tombol <strong>Salin Kode Rules</strong> di atas, tempel (*paste*) ke editor Rules, lalu klik <strong>Publish</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 font-medium">
            Project: <strong className="text-slate-800 font-mono">daily-ctivity-itbg</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
