// src/components/SecurityComplianceModal.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Activity,
  Cpu,
  Eye,
  Clock,
  Terminal,
  Trash2
} from 'lucide-react';
import {
  SECURITY_STANDARDS,
  getAuditLogs,
  clearAuditLogs,
  AuditLogEntry
} from '../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'standards' | 'audit';
}

export const SecurityComplianceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultTab = 'standards'
}) => {
  const [activeTab, setActiveTab] = useState<'standards' | 'audit'>(defaultTab);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getAuditLogs());
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const refreshLogs = () => {
    setAuditLogs(getAuditLogs());
  };

  const handleClearLogs = () => {
    if (window.confirm('Bersihkan riwayat audit log keamanan lokal?')) {
      clearAuditLogs();
      setAuditLogs([]);
    }
  };

  const filteredStandards = filterCategory === 'ALL'
    ? SECURITY_STANDARDS
    : SECURITY_STANDARDS.filter(s => s.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  21 Standar Keamanan Otentikasi &amp; Enkripsi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% TERVERIFIKASI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistem Pelaporan IT &amp; Checklist · Hotel Ciputra Jakarta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('standards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'standards'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Daftar 21 Standar Keamanan ({SECURITY_STANDARDS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                refreshLogs();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log Otentikasi ({auditLogs.length})</span>
            </button>
          </div>

          {activeTab === 'standards' && (
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <span className="text-slate-500 font-semibold mr-1">Kategori:</span>
              {['ALL', 'OWASP', 'NIST', 'CRYPTOGRAPHY', 'ISO 27001'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                    filterCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshLogs}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
              {auditLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Log</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'standards' ? (
            <div className="space-y-3">
              {/* Security Highlights Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950">
                      Standar Enkripsi Web W3C Modern (PBKDF2-HMAC-SHA256)
                    </h4>
                    <p className="text-emerald-800 text-[11px]">
                      100.000 iterasi peregangan kunci, salt kriptografis unik per akun, perlindungan brute-force lockout, dan deteksi device binding.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-emerald-300 font-bold text-emerald-800 text-[11px]">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    256-bit Key Derivation
                  </span>
                </div>
              </div>

              {/* Grid of 21 Standards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {filteredStandards.map((std) => (
                  <div
                    key={std.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/30 transition shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {std.code}
                          </span>
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                              std.category === 'OWASP'
                                ? 'bg-blue-100 text-blue-800'
                                : std.category === 'NIST'
                                ? 'bg-purple-100 text-purple-800'
                                : std.category === 'CRYPTOGRAPHY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {std.category}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {std.status}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-950 mb-1 leading-snug">
                        {std.id}. {std.title}
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                        {std.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-1 flex items-start gap-1.5 text-[10px] text-slate-500 bg-slate-50/70 p-2 rounded-lg">
                      <Terminal className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-mono">{std.implementation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <p>
                  Menampilkan log riwayat aktivitas otentikasi login, logout, dan penguncian akun pada sistem.
                </p>
                <span className="font-semibold">{auditLogs.length} Entri Tercatat</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Belum ada rekaman audit log. Aktivitas autentikasi akan tercatat secara otomatis di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-2xs hover:bg-slate-50/50 transition"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`mt-0.5 p-1 rounded-md shrink-0 ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.status === 'WARNING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : log.status === 'WARNING' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{log.action}</span>
                            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                              {log.email}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono shrink-0 pl-7 sm:pl-0">
                        {log.ipInfo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">
              Hotel Ciputra Jakarta IT Cyber Security Compliance
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
