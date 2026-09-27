import React, { useRef, useState, useMemo } from 'react';
import { DailyActivityReport, LogBookItem, TeamMember, ClientUser } from '../types';
import { CLIENT_DEPARTMENTS } from '../data/teamMembers';
import { createDefaultActivityReport } from '../data/defaults';
import { compressImage } from '../utils/imageUtils';
import { CiputraLogo } from './CiputraLogo';
import {
  Plus,
  Trash2,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Building,
  Building2,
  Thermometer,
  Wifi,
  Users,
  ArrowUp,
  ArrowDown,
  Droplets,
  Activity,
  Layers,
  RefreshCw,
  Search,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface Props {
  report: DailyActivityReport;
  onChange: (updated: DailyActivityReport) => void;
  onSave: () => void;
  isSaving: boolean;
  teamMembers: TeamMember[];
  onOpenTeamModal: () => void;
  clientUsers: ClientUser[];
  onOpenUserModal: () => void;
  onSyncTrafficToChecklist?: (maxIn: string, avgIn: string, currentIn: string) => void;
  customLogoUrl?: string | null;
  onOpenLogoModal?: () => void;
  onAutoSaveActivity?: (updated: DailyActivityReport) => void;
}

type ActivitySortOption = 'no-asc' | 'user-asc' | 'dept-asc' | 'pic-asc' | 'status';

export const DailyActivityForm: React.FC<Props> = ({
  report,
  onChange,
  onSave,
  isSaving,
  teamMembers,
  onOpenTeamModal,
  clientUsers,
  onOpenUserModal,
  onSyncTrafficToChecklist,
  customLogoUrl,
  onOpenLogoModal,
  onAutoSaveActivity,
}) => {
  // Separate refs for live camera capture vs gallery picker
  const cameraInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const galleryInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Search, Filter & Sort state for Log Book Activities
  const [activitySearch, setActivitySearch] = useState('');
  const [filterPic, setFilterPic] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<ActivitySortOption>('no-asc');

  const activeMembers = useMemo(
    () => teamMembers.filter((m) => m.isActive),
    [teamMembers]
  );

  const activeClientUsers = useMemo(
    () =>
      clientUsers
        .filter((u) => u.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clientUsers]
  );

  const allDepartments = useMemo(() => {
    const set = new Set<string>(CLIENT_DEPARTMENTS);
    clientUsers.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [clientUsers]);

  const updateField = <K extends keyof DailyActivityReport>(
    key: K,
    value: DailyActivityReport[K]
  ) => {
    onChange({
      ...report,
      [key]: value,
    });
  };

  // Handlers that update local state AND immediately persist images to Firestore & LocalStorage
  const handleLogBookImageChange = (index: number, dataUrl: string) => {
    const updatedActs = [...report.logBookActivities];
    if (index >= 0 && index < updatedActs.length) {
      updatedActs[index] = { ...updatedActs[index], pictureUrl: dataUrl };
      const updatedReport = {
        ...report,
        logBookActivities: updatedActs,
      };
      onChange(updatedReport);
      if (onAutoSaveActivity) {
        onAutoSaveActivity(updatedReport);
      }
    }
  };

  const handleSaraImageChange = (dataUrl: string) => {
    const updatedReport = {
      ...report,
      saraActivity: {
        ...report.saraActivity,
        screenshotUrl: dataUrl,
      },
    };
    onChange(updatedReport);
    if (onAutoSaveActivity) {
      onAutoSaveActivity(updatedReport);
    }
  };

  const handleTrafficImageChange = (dataUrl: string) => {
    const updatedReport = {
      ...report,
      internetTraffic: {
        ...report.internetTraffic,
        screenshotUrl: dataUrl,
      },
    };
    onChange(updatedReport);
    if (onAutoSaveActivity) {
      onAutoSaveActivity(updatedReport);
    }
  };

  const handleServerTempPhotoChange = (dataUrl: string) => {
    const updatedReport = {
      ...report,
      serverTemperature: {
        ...report.serverTemperature,
        photoUrl: dataUrl,
      },
    };
    onChange(updatedReport);
    if (onAutoSaveActivity) {
      onAutoSaveActivity(updatedReport);
    }
  };

  const updateLogBookItem = (index: number, partial: Partial<LogBookItem>) => {
    const updated = [...report.logBookActivities];
    if (index >= 0 && index < updated.length) {
      updated[index] = { ...updated[index], ...partial };
      updateField('logBookActivities', updated);
    }
  };

  const handleClientNameChange = (index: number, name: string) => {
    const act = report.logBookActivities[index];
    // Check if the typed/selected name matches a saved ClientUser to auto-fill department
    const matchedUser = activeClientUsers.find(
      (u) => u.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    const dept =
      matchedUser?.department ||
      act.clientDepartment ||
      act.userClient ||
      'FO (Front Office)';
    const userClientStr = name.trim() ? `${name.trim()} (${dept})` : dept;
    updateLogBookItem(index, {
      clientName: name,
      clientDepartment: dept,
      userClient: userClientStr,
    });
  };

  const handleSelectClientUser = (index: number, userId: string) => {
    if (!userId) return;
    const selected = clientUsers.find((u) => u.id === userId);
    if (!selected) return;
    const userClientStr = `${selected.name} (${selected.department})`;
    updateLogBookItem(index, {
      clientName: selected.name,
      clientDepartment: selected.department,
      userClient: userClientStr,
    });
  };

  const handleClientDeptChange = (index: number, dept: string) => {
    const act = report.logBookActivities[index];
    const name = act.clientName || '';
    const userClientStr = name.trim() ? `${name.trim()} (${dept})` : dept;
    updateLogBookItem(index, {
      clientDepartment: dept,
      userClient: userClientStr,
    });
  };

  // Filtered & sorted activity indices (preserves actualIndex so edits always hit the exact item)
  const filteredActivityIndices = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    const indices = report.logBookActivities
      .map((act, idx) => ({ act, idx }))
      .filter(({ act }) => {
        const dept = act.clientDepartment || act.userClient || '';
        if (filterPic !== 'ALL' && act.pic !== filterPic) return false;
        if (filterDept !== 'ALL' && dept !== filterDept) return false;
        if (!q) return true;
        return (
          act.details.toLowerCase().includes(q) ||
          (act.clientName || '').toLowerCase().includes(q) ||
          dept.toLowerCase().includes(q) ||
          act.pic.toLowerCase().includes(q) ||
          act.status.toLowerCase().includes(q)
        );
      });

    if (sortBy === 'user-asc') {
      indices.sort((a, b) =>
        (a.act.clientName || a.act.userClient || '').localeCompare(
          b.act.clientName || b.act.userClient || ''
        )
      );
    } else if (sortBy === 'dept-asc') {
      indices.sort((a, b) =>
        (a.act.clientDepartment || a.act.userClient || '').localeCompare(
          b.act.clientDepartment || b.act.userClient || ''
        )
      );
    } else if (sortBy === 'pic-asc') {
      indices.sort((a, b) => a.act.pic.localeCompare(b.act.pic));
    } else if (sortBy === 'status') {
      const order: Record<string, number> = {
        Pending: 1,
        'In Progress': 2,
        Done: 3,
        Cancelled: 4,
      };
      indices.sort((a, b) => (order[a.act.status] || 9) - (order[b.act.status] || 9));
    } else {
      indices.sort((a, b) => a.idx - b.idx);
    }

    return indices.map((entry) => entry.idx);
  }, [report.logBookActivities, activitySearch, filterPic, filterDept, sortBy]);

  const handleResetToNewWorksheet = () => {
    if (
      confirm(
        'Buka lembar kerja baru yang bersih untuk hari ini?\n• 3 Aktivitas IT Log Book kosong\n• Tanpa foto pada SARA, Traffic, dan Suhu Server\n• Input nilai MRTG dan Suhu Server dikosongkan'
      )
    ) {
      const blank = createDefaultActivityReport(report.date);
      onChange(blank);
      if (onAutoSaveActivity) {
        onAutoSaveActivity(blank);
      }
    }
  };

  const addLogBookItem = () => {
    const nextNo = report.logBookActivities.length + 1;
    const defaultDept = 'FO (Front Office)';
    const defaultPic = activeMembers[0]?.name || 'Ramdhani';
    const newItem: LogBookItem = {
      id: 'act-' + Date.now(),
      no: nextNo,
      details: '',
      clientName: '',
      clientDepartment: defaultDept,
      userClient: defaultDept,
      status: 'Done',
      pic: defaultPic,
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
      // Reset input value so user can take photo again with same file name if needed
      e.target.value = '';
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
          <div className="flex items-center gap-3">
            <div className="h-11 w-24 sm:w-28 flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
              <CiputraLogo size="sm" customLogoUrl={customLogoUrl} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Informasi Laporan & Header Dokumen
                </h2>
                {onOpenLogoModal && (
                  <button
                    type="button"
                    onClick={onOpenLogoModal}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    (Ganti Logo)
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Logo di samping akan dicetak pada kop surat A4 IT Daily Activity Report
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={onOpenUserModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              Kelola User / Client
            </button>
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              Kelola PIC IT
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
                Daftar <strong>User / Client</strong> dan <strong>PIC IT</strong> dipisahkan serta dapat dicari &amp; disortir
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={onOpenUserModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              Kelola User
            </button>
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              Kelola PIC
            </button>
            <button
              type="button"
              onClick={handleResetToNewWorksheet}
              title="Reset hari ini ke lembar kerja baru bersih (3 aktivitas kosong)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              Lembar Baru (3 Blank)
            </button>
            <button
              type="button"
              onClick={addLogBookItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              + Tambah Aktivitas
            </button>
          </div>
        </div>

        {/* Search, Filter & Sort Bar for Log Book Activities */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              placeholder="Cari kasus, nama user, departemen, atau PIC..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
            />
            {activitySearch && (
              <button
                type="button"
                onClick={() => setActivitySearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter by Department / User */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Filter User: Semua Departemen</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by PIC IT */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <select
              value={filterPic}
              onChange={(e) => setFilterPic(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Filter PIC: Semua</option>
              {activeMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  PIC: {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ActivitySortOption)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="no-asc">Sortir: No. Urut (Default)</option>
              <option value="user-asc">Sortir: Nama User / Client (A-Z)</option>
              <option value="dept-asc">Sortir: Departemen User (A-Z)</option>
              <option value="pic-asc">Sortir: Nama PIC IT (A-Z)</option>
              <option value="status">Sortir: Status Pekerjaan</option>
            </select>
          </div>
        </div>

        {/* Datalist for User/Client autocomplete */}
        <datalist id="client-users-datalist">
          {activeClientUsers.map((u) => (
            <option key={u.id} value={u.name}>
              {u.department} {u.roleOrExt ? `· ${u.roleOrExt}` : ''}
            </option>
          ))}
        </datalist>

        <div className="space-y-4">
          {filteredActivityIndices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tidak ada aktivitas yang cocok dengan filter / pencarian saat ini.
            </div>
          ) : (
            filteredActivityIndices.map((index) => {
              const act = report.logBookActivities[index];
              const matchedClientUser = activeClientUsers.find(
                (u) => u.name.toLowerCase() === (act.clientName || '').trim().toLowerCase()
              );

              return (
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

              {/* Form inputs responsive grid (Separated Client Name, Department, and IT PIC) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                {/* Details */}
                <div className="md:col-span-4">
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

                {/* Nama User / Client (Separated from PIC IT, with quick picker + search datalist) */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-blue-900">
                      Nama User / Client
                    </label>
                    <button
                      type="button"
                      onClick={onOpenUserModal}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                      title="Kelola Daftar User / Client"
                    >
                      + Kelola User
                    </button>
                  </div>
                  <div className="space-y-1">
                    <select
                      value={matchedClientUser?.id || ''}
                      onChange={(e) => handleSelectClientUser(index, e.target.value)}
                      className="w-full px-2 py-1 text-[11px] rounded-md border border-blue-200 bg-blue-50/60 text-blue-900 font-semibold focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Pilih Cepat User --</option>
                      {activeClientUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.department.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      list="client-users-datalist"
                      value={act.clientName || ''}
                      onChange={(e) => handleClientNameChange(index, e.target.value)}
                      placeholder="Ketik / cari nama user..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Departemen User Dropdown */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Departemen User
                  </label>
                  <select
                    value={act.clientDepartment || act.userClient || 'FO (Front Office)'}
                    onChange={(e) => handleClientDeptChange(index, e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white font-semibold text-slate-800"
                  >
                    {allDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    {!allDepartments.includes(act.clientDepartment || act.userClient) && (
                      <option value={act.clientDepartment || act.userClient}>
                        {act.clientDepartment || act.userClient} (Kustom)
                      </option>
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

                {/* PIC Dropdown (IT Person Name only) */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900">
                      PIC IT (Petugas)
                    </label>
                    <button
                      type="button"
                      onClick={onOpenTeamModal}
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                      title="Kelola Daftar PIC IT"
                    >
                      + Kelola PIC
                    </button>
                  </div>
                  <select
                    value={act.pic}
                    onChange={(e) => updateLogBookItem(index, { pic: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-600 bg-emerald-50/40 font-bold text-slate-800"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                    {!activeMembers.some((m) => m.name === act.pic) && (
                      <option value={act.pic}>{act.pic}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Photo Upload Box with Dedicated Camera & Gallery Buttons */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    Picture or Documentation (Foto / Bukti Kasus)
                  </span>
                  {act.pictureUrl && (
                    <button
                      type="button"
                      onClick={() => handleLogBookImageChange(index, '')}
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
                    <div className="text-xs text-slate-600 space-y-2">
                      <div>
                        <p className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Foto Dokumentasi Terlampir
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Siap dicetak di lembar A4 & otomatis tersimpan ke cloud.
                        </p>
                      </div>

                      {/* Change options: Camera or Gallery */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => cameraInputRefs.current[`act-${index}`]?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-300" />
                          Foto Ulang (Kamera)
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRefs.current[`act-${index}`]?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          Ganti dari Galeri
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Live Camera Button (Direct to Phone / Tablet Camera) */}
                    <button
                      type="button"
                      onClick={() => cameraInputRefs.current[`act-${index}`]?.click()}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 transition font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-xs text-emerald-950">
                          Buka Kamera (Foto Langsung)
                        </span>
                        <span className="block text-[10px] text-emerald-800 font-normal">
                          Live foto via kamera HP / Tablet
                        </span>
                      </div>
                    </button>

                    {/* Gallery / File Button */}
                    <button
                      type="button"
                      onClick={() => galleryInputRefs.current[`act-${index}`]?.click()}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-xs text-slate-900">
                          Pilih dari Galeri / File
                        </span>
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Upload file foto yang tersimpan
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Hidden input for Camera: capture="environment" */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={(el) => {
                    cameraInputRefs.current[`act-${index}`] = el;
                  }}
                  onChange={(e) =>
                    handleImageUpload(e, (dataUrl) =>
                      handleLogBookImageChange(index, dataUrl)
                    )
                  }
                  className="hidden"
                />

                {/* Hidden input for Gallery / Storage File Picker */}
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    galleryInputRefs.current[`act-${index}`] = el;
                  }}
                  onChange={(e) =>
                    handleImageUpload(e, (dataUrl) =>
                      handleLogBookImageChange(index, dataUrl)
                    )
                  }
                  className="hidden"
                />
              </div>
            </div>
              );
            })
          )}
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
                  onClick={() => handleSaraImageChange('')}
                  className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded shadow-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRefs.current['sara']?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 transition font-bold text-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Kamera Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRefs.current['sara']?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-bold text-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Galeri / File</span>
                </button>
              </div>
            )}
            {/* Hidden camera input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={(el) => {
                cameraInputRefs.current['sara'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  handleSaraImageChange(dataUrl)
                )
              }
              className="hidden"
            />
            {/* Hidden gallery input */}
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                galleryInputRefs.current['sara'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  handleSaraImageChange(dataUrl)
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
                  onClick={() => handleTrafficImageChange('')}
                  className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded shadow-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRefs.current['traffic']?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 transition font-bold text-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Kamera Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRefs.current['traffic']?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-bold text-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Galeri / File Grafik</span>
                </button>
              </div>
            )}
            {/* Hidden camera input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={(el) => {
                cameraInputRefs.current['traffic'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  handleTrafficImageChange(dataUrl)
                )
              }
              className="hidden"
            />
            {/* Hidden gallery input */}
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                galleryInputRefs.current['traffic'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  handleTrafficImageChange(dataUrl)
                )
              }
              className="hidden"
            />
          </div>

          {/* IN TRAFFIC INPUTS ONLY */}
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

      {/* Section 4: Server Temperature (LIVE CAMERA + GALLERY) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                4. Server Temperature (Suhu & Kelembapan Ruang Server)
              </h2>
              <p className="text-xs text-slate-500">
                Foto layar ThermoPro langsung dengan kamera atau upload dari galeri
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
                <div className="flex items-center gap-1.5 absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRefs.current['temp']?.click()}
                    className="px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded shadow-xs font-semibold flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3 text-amber-300" />
                    Foto Ulang
                  </button>
                  <button
                    type="button"
                    onClick={() => handleServerTempPhotoChange('')}
                    className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded shadow-xs font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRefs.current['temp']?.click()}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 transition font-bold text-xs cursor-pointer shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <div className="text-left">
                    <span className="block font-bold">Kamera Langsung</span>
                    <span className="block text-[10px] text-emerald-800 font-normal">Foto layar ThermoPro</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRefs.current['temp']?.click()}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-bold text-xs cursor-pointer shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="block font-bold">Dari Galeri</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Pilih file foto</span>
                  </div>
                </button>
              </div>
            )}
            {/* Hidden camera input for server temp */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={(el) => {
                cameraInputRefs.current['temp'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  handleServerTempPhotoChange(dataUrl)
                )
              }
              className="hidden"
            />
            {/* Hidden gallery input for server temp */}
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                galleryInputRefs.current['temp'] = el;
              }}
              onChange={(e) =>
                handleImageUpload(e, (dataUrl) =>
                  handleServerTempPhotoChange(dataUrl)
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
