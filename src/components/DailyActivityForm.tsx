import React, { useRef } from 'react';
import { DailyActivityReport, LogBookItem, TeamMember } from '../types';
import { CLIENT_DEPARTMENTS } from '../data/teamMembers';
import { compressImage } from '../utils/imageUtils';
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Building,
  Thermometer,
  Wifi,
  Users,
  ArrowUp,
  ArrowDown,
  Droplets,
  Activity,
  Layers
} from 'lucide-react';

interface Props {
  report: DailyActivityReport;
  onChange: (updated: DailyActivityReport) => void;
  onSave: () => void;
  isSaving: boolean;
  teamMembers: TeamMember[];
  onOpenTeamModal: () => void;
  onSyncTrafficToChecklist?: (maxIn: string, avgIn: string, currentIn: string) => void;
}

export const DailyActivityForm: React.FC<Props> = ({
  report,
  onChange,
  onSave,
  isSaving,
  teamMembers,
  onOpenTeamModal,
  onSyncTrafficToChecklist,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const activeMembers = teamMembers.filter((m) => m.isActive);

  const updateField = <K extends keyof DailyActivityReport>(
    key: K,
    value: DailyActivityReport[K]
  ) => {
    onChange({
      ...report,
      [key]: value,
    });
  };

  const updateLogBookItem = (index: number, partial: Partial<LogBookItem>) => {
    const updated = [...report.logBookActivities];
    if (index >= 0 && index < updated.length) {
      updated[index] = { ...updated[index], ...partial };
      updateField('logBookActivities', updated);
    }
  };

  const addLogBookItem = () => {
    const nextNo = report.logBookActivities.length + 1;
    const newItem: LogBookItem = {
      id: 'act-' + Date.now(),
      no: nextNo,
      details: '',
      userClient: 'IT',
      status: 'Done',
      pic: activeMembers[0]?.name || 'VELO',
      pictureUrl: '',
    };
    updateField('logBookActivities', [...report.logBookActivities, newItem]);
  };

  const removeLogBookItem = (index: number) => {
    const updated = report.logBookActivities.filter((_, i) => i !== index);
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    updateField('logBookActivities', renumbered);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === report.logBookActivities.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const items = [...report.logBookActivities];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    updateField('logBookActivities', items.map((it, idx) => ({ ...it, no: idx + 1 })));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 850, 850, 0.75);
      callback(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  // Sync traffic to Checklist item #2 when user changes IN traffic
  const handleTrafficInChange = (field: 'maxIn' | 'avgIn' | 'currentIn', value: string) => {
    const updatedTraffic = {
      ...report.internetTraffic,
      [field]: value,
    };
    updateField('internetTraffic', updatedTraffic);

    if (onSyncTrafficToChecklist) {
      const mIn = field === 'maxIn' ? value : report.internetTraffic.maxIn || '';
      const aIn = field === 'avgIn' ? value : report.internetTraffic.avgIn || '';
      const cIn = field === 'currentIn' ? value : report.internetTraffic.currentIn || '';
      onSyncTrafficToChecklist(mIn, aIn, cIn);
    }
  };

  // Helper for numeric temperature & humidity
  const rawTemp = (report.serverTemperature.currentTemp || '').replace(/[^\d.]/g, '');
  const rawHum = (report.serverTemperature.currentHum || '').replace(/[^\d.]/g, '');

  const tempNum = parseFloat(rawTemp);
  const humNum = parseFloat(rawHum);
  const isTempNormal = !isNaN(tempNum) && tempNum >= 17 && tempNum <= 23;
  const isHumNormal = !isNaN(humNum) && humNum >= 45 && humNum <= 55;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header Info Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Informasi Laporan & Header Dokumen
              </h2>
              <p className="text-xs text-slate-500">
                Data kop surat untuk IT Daily Activity Report format A4
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              Kelola Petugas
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Laporan'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Property Name
            </label>
            <input
              type="text"
              value={report.propertyName}
              onChange={(e) => updateField('propertyName', e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Laporan (Report Date)
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={report.formattedDate}
                onChange={(e) => updateField('formattedDate', e.target.value)}
                placeholder="e.g. Saturday, 26 September 2026"
                className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prepared (Disiapkan Oleh)
            </label>
            <input
              type="text"
              value={report.prepared}
              onChange={(e) => updateField('prepared', e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Direct Report
            </label>
            <input
              type="text"
              value={report.directReport}
              onChange={(e) => updateField('directReport', e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cc (Carbon Copy)
            </label>
            <input
              type="text"
              value={report.cc}
              onChange={(e) => updateField('cc', e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>
        </div>
      </div>

      {/* Section 1: IT Log Book Activity */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. IT Log Book Activity (Aktivitas Harian & Dokumentasi Kasus)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih User/Client dan PIC via dropdown, sertakan foto/screenshot kasus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addLogBookItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Tambah Aktivitas
          </button>
        </div>

        <div className="space-y-4">
          {report.logBookActivities.map((act, index) => (
            <div
              key={act.id || index}
              className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 hover:bg-slate-50 transition shadow-2xs"
            >
              {/* Header card with action buttons */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Aktivitas #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    title="Geser ke atas"
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === report.logBookActivities.length - 1}
                    title="Geser ke bawah"
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLogBookItem(index)}
                    title="Hapus aktivitas ini"
                    className="p-1 rounded-md text-red-600 hover:bg-red-50 ml-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form inputs responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                {/* Details */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Activities Details (Deskripsi Kasus / Pekerjaan)
                  </label>
                  <textarea
                    rows={2}
                    value={act.details}
                    onChange={(e) => updateLogBookItem(index, { details: e.target.value })}
                    placeholder="Contoh: Speedtest at dian ballroom atau checking ertflix at GM Apart"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                  />
                </div>

                {/* User/Client Dropdown */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    User/Client (Departemen)
                  </label>
                  <select
                    value={act.userClient}
                    onChange={(e) => updateLogBookItem(index, { userClient: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white font-semibold text-slate-800"
                  >
                    {CLIENT_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    {!CLIENT_DEPARTMENTS.includes(act.userClient) && (
                      <option value={act.userClient}>{act.userClient} (Kustom)</option>
                    )}
                  </select>
                </div>

                {/* Status Dropdown */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={act.status}
                    onChange={(e) =>
                      updateLogBookItem(index, { status: e.target.value as any })
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white font-bold text-emerald-800"
                  >
                    <option value="Done">Done (Selesai)</option>
                    <option value="In Progress">In Progress (Proses)</option>
                    <option value="Pending">Pending (Tertunda)</option>
                    <option value="Cancelled">Cancelled (Dibatalkan)</option>
                  </select>
                </div>

                {/* PIC Dropdown */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIC (Petugas IT)
                  </label>
                  <select
                    value={act.pic}
                    onChange={(e) => updateLogBookItem(index, { pic: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white font-bold text-slate-800"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                    {!activeMembers.some((m) => m.name === act.pic) && (
                      <option value={act.pic}>{act.pic} (Kustom)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Photo Upload Box */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    Picture or Documentation (Foto / Bukti Kasus)
                  </span>
                  {act.pictureUrl && (
                    <button
                      type="button"
                      onClick={() => updateLogBookItem(index, { pictureUrl: '' })}
                      className="text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {act.pictureUrl ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <img
                      src={act.pictureUrl}
                      alt="Dokumentasi Kasus"
                      className="h-28 w-44 object-contain bg-slate-100 rounded-lg border border-slate-200 shadow-xs"
                    />
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Foto Dokumentasi Terlampir
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Foto otomatis dikompres ke ukuran ringan agar tidak memenuhi storage Firestore.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[`act-${index}`]?.click()}
                        className="text-xs text-blue-600 hover:underline font-semibold inline-block pt-1"
                      >
                        Ganti Foto Ini
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.current[`act-${index}`]?.click()}
                    className="border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-3.5 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/30"
                  >
                    <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    <span className="text-xs text-slate-700 font-bold block">
                      Klik untuk upload foto dokumentasi / kamera
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Format PNG, JPG, WebP (kompresi otomatis siap A4)
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileInputRefs.current[`act-${index}`] = el;
                  }}
                  onChange={(e) =>
                    handleImageUpload(e, (dataUrl) =>
                      updateLogBookItem(index, { pictureUrl: dataUrl })
                    )
                  }
                  className="hidden"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom add activity button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={addLogBookItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Tambah Aktivitas Lainnya
          </button>
        </div>
      </div>

      {/* Section 2: SARA Activity Today */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              2. SARA Activity Today (Tiket Helpdesk / Service Desk)
            </h2>
            <p className="text-xs text-slate-500">
              Upload screenshot dashboard SARA dan tuliskan ringkasan tiket hari ini
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Screenshot Dashboard SARA
            </label>
            {report.saraActivity.screenshotUrl ? (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2">
                <img
                  src={report.saraActivity.screenshotUrl}
                  alt="SARA Screenshot"
                  className="w-full h-36 object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateField('saraActivity', { ...report.saraActivity, screenshotUrl: '' })
                  }
                  className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded shadow-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRefs.current['sara']?.click()}
                className="border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer bg-slate-50 transition"
              >
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <span className="text-xs text-slate-700 font-bold block">
                  Upload Screenshot SARA
                </span>
                <span className="text-[10px] text-slate-400">Klik untuk memilih file</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                fileInputRefs.current['sara'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  updateField('saraActivity', {
                    ...report.saraActivity,
                    screenshotUrl: dataUrl,
                  })
                )
              }
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Deskripsi Tiket SARA
            </label>
            <textarea
              rows={4}
              value={report.saraActivity.notes || ''}
              onChange={(e) =>
                updateField('saraActivity', { ...report.saraActivity, notes: e.target.value })
              }
              placeholder="Contoh: No pending requests today. SARA service desk handling operational inquiries normally."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Internet Total Average Traffic Evening (IN TRAFFIC ONLY & AUTO SYNC TO CHECKLIST #2) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. Internet Total Average Traffic Evening (MRTG / Traffic Analysis)
              </h2>
              <p className="text-xs text-slate-500">
                Cukup isi bagian <strong>IN</strong> saja (Max, Avg, Current). Data ini otomatis tersambung ke Remark Daily Checklist Nomor 2.
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto">
            <Activity className="w-3.5 h-3.5" />
            Tersambung ke Checklist #2
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Grafik Analisis Trafik Internet (Traffic Analysis Graph)
            </label>
            {report.internetTraffic.screenshotUrl ? (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2">
                <img
                  src={report.internetTraffic.screenshotUrl}
                  alt="Traffic Graph"
                  className="w-full h-44 object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateField('internetTraffic', {
                      ...report.internetTraffic,
                      screenshotUrl: '',
                    })
                  }
                  className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded shadow-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRefs.current['traffic']?.click()}
                className="border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer bg-slate-50 transition"
              >
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <span className="text-xs text-slate-700 font-bold block">
                  Upload Grafik Trafik Internet
                </span>
                <span className="text-[10px] text-slate-400">Klik untuk upload grafik MRTG</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                fileInputRefs.current['traffic'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  updateField('internetTraffic', {
                    ...report.internetTraffic,
                    screenshotUrl: dataUrl,
                  })
                )
              }
              className="hidden"
            />
          </div>

          {/* IN TRAFFIC INPUTS ONLY (User requested: isin max in avr curent bagian in saja dan itu conect jika di isi muncul di daily cehklist nomor 2 ki remark) */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="text-xs font-bold text-emerald-950 mb-2 flex items-center justify-between">
              <span>Input Nilai Trafik IN (Download):</span>
              <span className="text-[11px] font-medium text-emerald-700">
                Otomatis diupdate ke Checklist #2 (Bandwidth statistic)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Max In (Maksimal IN)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={report.internetTraffic.maxIn || ''}
                    onChange={(e) => handleTrafficInChange('maxIn', e.target.value)}
                    placeholder="misal: 301.7"
                    className="w-full pr-14 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                  <span className="absolute right-3 top-1.5 text-xs font-bold text-slate-400">
                    Mbps
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Avg In (Rata-rata IN)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={report.internetTraffic.avgIn || ''}
                    onChange={(e) => handleTrafficInChange('avgIn', e.target.value)}
                    placeholder="misal: 122.1"
                    className="w-full pr-14 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                  <span className="absolute right-3 top-1.5 text-xs font-bold text-slate-400">
                    Mbps
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current In (Saat ini IN)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={report.internetTraffic.currentIn || ''}
                    onChange={(e) => handleTrafficInChange('currentIn', e.target.value)}
                    placeholder="misal: 165.5"
                    className="w-full pr-14 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                  <span className="absolute right-3 top-1.5 text-xs font-bold text-slate-400">
                    Mbps
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Server Temperature (NUMERIC ONLY: USER JUST ENTERS 17 & 45) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                4. Server Temperature (Suhu & Kelembapan Ruang Server)
              </h2>
              <p className="text-xs text-slate-500">
                Cukup isi angka saja (misal: 17 dan 41). Satuan °C dan % otomatis terpasang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                isTempNormal && isHumNormal
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isTempNormal && isHumNormal ? '✓ Kondisi Normal' : '⚠ Periksa Batas Standar'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Foto Indikator ThermoPro / Termometer Server
            </label>
            {report.serverTemperature.photoUrl ? (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2">
                <img
                  src={report.serverTemperature.photoUrl}
                  alt="Server Temperature"
                  className="w-full h-36 object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateField('serverTemperature', {
                      ...report.serverTemperature,
                      photoUrl: '',
                    })
                  }
                  className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded shadow-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRefs.current['temp']?.click()}
                className="border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer bg-slate-50 transition"
              >
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <span className="text-xs text-slate-700 font-bold block">
                  Upload Foto Termometer Server
                </span>
                <span className="text-[10px] text-slate-400">Foto layar ThermoPro</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                fileInputRefs.current['temp'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  updateField('serverTemperature', {
                    ...report.serverTemperature,
                    photoUrl: dataUrl,
                  })
                )
              }
              className="hidden"
            />
          </div>

          <div className="space-y-3">
            {/* Numeric input fields for temp & humidity */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800">
                Input Nilai Sensor (Cukup Ketik Angka):
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Temperature Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-red-500" />
                    Suhu (Temperature)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={rawTemp}
                      onChange={(e) =>
                        updateField('serverTemperature', {
                          ...report.serverTemperature,
                          currentTemp: e.target.value ? `${e.target.value}°C` : '',
                        })
                      }
                      placeholder="17.3"
                      className="w-full pr-10 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                    <span className="absolute right-3 top-1.5 text-xs font-extrabold text-slate-500">
                      °C
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Standar: <strong>17°C - 23°C</strong>
                  </span>
                </div>

                {/* Humidity Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    Kelembapan (Humidity)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={rawHum}
                      onChange={(e) =>
                        updateField('serverTemperature', {
                          ...report.serverTemperature,
                          currentHum: e.target.value ? `${e.target.value}%` : '',
                        })
                      }
                      placeholder="41"
                      className="w-full pr-10 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                    <span className="absolute right-3 top-1.5 text-xs font-extrabold text-slate-500">
                      %
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Standar: <strong>45% - 55%</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Kondisi Server Room
              </label>
              <textarea
                rows={2}
                value={report.serverTemperature.notes || ''}
                onChange={(e) =>
                  updateField('serverTemperature', {
                    ...report.serverTemperature,
                    notes: e.target.value,
                  })
                }
                placeholder="Server Room Data Center ThermoPro monitoring steady."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Other Issue by Day */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <h2 className="text-base font-bold text-slate-900">
            5. Other Issue by Day (Isu Lain / Kendala Harian)
          </h2>
        </div>

        <textarea
          rows={3}
          value={report.otherIssues}
          onChange={(e) => updateField('otherIssues', e.target.value)}
          placeholder="Tuliskan isu atau kendala lain (misal: - atau rincian problem)"
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-mono"
        />
      </div>
    </div>
  );
};
