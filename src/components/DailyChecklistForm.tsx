import React, { useState } from 'react';
import { DailyChecklistReport, ChecklistItem, TeamMember } from '../types';
import { DEFAULT_CHECKLIST_ITEMS } from '../data/defaults';
import { CiputraLogo } from './CiputraLogo';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCheck,
  User,
  Users,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface Props {
  report: DailyChecklistReport;
  onChange: (updated: DailyChecklistReport) => void;
  onSave: () => void;
  isSaving: boolean;
  teamMembers: TeamMember[];
  onOpenTeamModal: () => void;
  customLogoUrl?: string | null;
  onOpenLogoModal?: () => void;
  onSyncFromPreviousDate?: () => void;
}

type ChecklistSortOption = 'no-asc' | 'task-asc' | 'task-desc' | 'pic-asc' | 'status-issue';

export const DailyChecklistForm: React.FC<Props> = ({
  report,
  onChange,
  onSave,
  isSaving,
  teamMembers,
  onOpenTeamModal,
  customLogoUrl,
  onOpenLogoModal,
  onSyncFromPreviousDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<'ALL' | 'morning' | 'evening'>('ALL');
  const [filterPic, setFilterPic] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<ChecklistSortOption>('no-asc');
  const activeMembers = teamMembers.filter((m) => m.isActive);

  const updateField = <K extends keyof DailyChecklistReport>(
    key: K,
    value: DailyChecklistReport[K]
  ) => {
    onChange({
      ...report,
      [key]: value,
    });
  };

  const updateItem = (index: number, partial: Partial<ChecklistItem>) => {
    const newItems = [...report.items];
    if (index >= 0 && index < newItems.length) {
      newItems[index] = { ...newItems[index], ...partial };
      updateField('items', newItems);
    }
  };

  // Helper to determine if a task belongs to Morning Shift
  const isTaskMorning = (item: ChecklistItem): boolean => {
    if (item.shift === 'morning') return true;
    if (item.shift === 'evening') return false;
    // Fallback detection if shift is not explicitly set
    if (report.morningShiftPic && item.personIncharge === report.morningShiftPic) return true;
    if (report.eveningShiftPic && item.personIncharge === report.eveningShiftPic) return false;
    return true; // Default fallback to morning
  };

  // Helper to determine if a task belongs to Evening Shift
  const isTaskEvening = (item: ChecklistItem): boolean => {
    if (item.shift === 'evening') return true;
    if (item.shift === 'morning') return false;
    // Fallback detection if shift is not explicitly set
    if (report.eveningShiftPic && item.personIncharge === report.eveningShiftPic) return true;
    return false;
  };

  // Change individual task shift group and automatically sync its PIC
  const handleTaskShiftChange = (actualIndex: number, newShift: 'morning' | 'evening') => {
    const targetPic = newShift === 'morning' ? report.morningShiftPic : report.eveningShiftPic;
    const current = report.items[actualIndex];
    updateItem(actualIndex, {
      shift: newShift,
      personIncharge: targetPic || (newShift === 'morning' ? report.morningShiftPic : report.eveningShiftPic) || current?.personIncharge || '',
    });
  };

  // Set all tasks to a specific shift and automatically sync their PIC
  const setAllTasksShift = (shift: 'morning' | 'evening') => {
    const targetPic = shift === 'morning' ? report.morningShiftPic : report.eveningShiftPic;
    const updated = report.items.map((it) => ({
      ...it,
      shift,
      personIncharge: targetPic || it.personIncharge || '',
    }));
    updateField('items', updated);
  };

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: 'item-' + Date.now(),
      no: report.items.length + 1,
      taskList: '',
      shift: 'morning',
      personIncharge: report.morningShiftPic || activeMembers[0]?.name || '',
      status: 'Checked',
      remark: 'No issue',
    };
    updateField('items', [...report.items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = report.items.filter((_, i) => i !== index);
    const renumbered = newItems.map((it, idx) => ({ ...it, no: idx + 1 }));
    updateField('items', renumbered);
  };

  const markAllChecked = () => {
    const updated = report.items.map((it) => ({
      ...it,
      status: 'Checked' as const,
    }));
    updateField('items', updated);
  };

  const fillEmptyRemarksNoIssue = () => {
    const updated = report.items.map((it) => ({
      ...it,
      remark: it.remark.trim() === '' ? 'No issue' : it.remark,
    }));
    updateField('items', updated);
  };

  const resetToDefaultTemplate = () => {
    onChange({
      ...report,
      morningShiftPic: '',
      eveningShiftPic: '',
      items: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_ITEMS)),
    });
  };

  const assignPicToAll = (picName: string) => {
    if (!picName) return;
    const updated = report.items.map((it) => ({
      ...it,
      personIncharge: picName,
    }));
    updateField('items', updated);
  };

  // Shift change handlers: automatically syncs PIC to all tasks belonging to that shift group!
  const handleMorningShiftChange = (newPic: string) => {
    const updatedItems = report.items.map((it) => {
      if (isTaskMorning(it)) {
        return { ...it, shift: 'morning' as const, personIncharge: newPic };
      }
      return it;
    });
    onChange({
      ...report,
      morningShiftPic: newPic,
      items: updatedItems,
    });
  };

  const handleEveningShiftChange = (newPic: string) => {
    const updatedItems = report.items.map((it) => {
      if (isTaskEvening(it)) {
        return { ...it, shift: 'evening' as const, personIncharge: newPic };
      }
      return it;
    });
    onChange({
      ...report,
      eveningShiftPic: newPic,
      items: updatedItems,
    });
  };

  const filteredEntries = report.items
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => {
      if (filterShift === 'morning' && !isTaskMorning(it)) return false;
      if (filterShift === 'evening' && !isTaskEvening(it)) return false;
      if (filterPic !== 'ALL' && it.personIncharge !== filterPic) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        it.taskList.toLowerCase().includes(q) ||
        it.remark.toLowerCase().includes(q) ||
        it.personIncharge.toLowerCase().includes(q)
      );
    });

  if (sortBy === 'task-asc') {
    filteredEntries.sort((a, b) => a.it.taskList.localeCompare(b.it.taskList));
  } else if (sortBy === 'task-desc') {
    filteredEntries.sort((a, b) => b.it.taskList.localeCompare(a.it.taskList));
  } else if (sortBy === 'pic-asc') {
    filteredEntries.sort(
      (a, b) =>
        (a.it.personIncharge || '').localeCompare(b.it.personIncharge || '') ||
        a.idx - b.idx
    );
  } else if (sortBy === 'status-issue') {
    const order: Record<string, number> = {
      Issue: 1,
      Pending: 2,
      'In Progress': 3,
      Checked: 4,
    };
    filteredEntries.sort(
      (a, b) => (order[a.it.status] || 9) - (order[b.it.status] || 9) || a.idx - b.idx
    );
  } else {
    filteredEntries.sort((a, b) => a.idx - b.idx);
  }

  const filteredIndices: number[] = filteredEntries.map((e) => e.idx);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header Info & Shift Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-24 sm:w-28 flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
              <CiputraLogo size="sm" customLogoUrl={customLogoUrl} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Shift Petugas & Informasi Checklist
                </h2>
                <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  {report.items.length} Task
                </span>
                {onOpenLogoModal && (
                  <button
                    type="button"
                    onClick={onOpenLogoModal}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline ml-1"
                  >
                    (Ganti Logo)
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Default mengikuti tanggal sebelumnya secara otomatis. Jika diedit hari ini, tanggal berikutnya akan mengikuti tampilan ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Checklist'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Tanggal (Date)
            </label>
            <input
              type="text"
              value={report.formattedDate}
              onChange={(e) => updateField('formattedDate', e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>

          {/* Morning Shift Dropdown */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <span>☀️</span> Morning Shift PIC
                </label>
                <button
                  type="button"
                  onClick={() => setAllTasksShift('morning')}
                  title="Terapkan petugas Morning ini ke SEMUA task checklist"
                  className="text-[10px] text-amber-800 hover:text-amber-950 hover:underline font-bold"
                >
                  Set ke Semua Task
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600 shrink-0" />
                <select
                  value={report.morningShiftPic}
                  onChange={(e) => handleMorningShiftChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs md:text-sm rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Pilih Petugas Morning --</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  {report.morningShiftPic &&
                    !activeMembers.some((m) => m.name === report.morningShiftPic) && (
                      <option value={report.morningShiftPic}>{report.morningShiftPic}</option>
                    )}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-amber-800/80 font-medium mt-1.5">
              ✓ Otomatis mengisi PIC pada semua task grup <b>Morning</b>
            </p>
          </div>

          {/* Evening Shift Dropdown */}
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                  <span>🌙</span> Evening Shift PIC
                </label>
                <button
                  type="button"
                  onClick={() => setAllTasksShift('evening')}
                  title="Terapkan petugas Evening ini ke SEMUA task checklist"
                  className="text-[10px] text-indigo-800 hover:text-indigo-950 hover:underline font-bold"
                >
                  Set ke Semua Task
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <select
                  value={report.eveningShiftPic}
                  onChange={(e) => handleEveningShiftChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs md:text-sm rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Pilih Petugas Evening --</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  {report.eveningShiftPic &&
                    !activeMembers.some((m) => m.name === report.eveningShiftPic) && (
                      <option value={report.eveningShiftPic}>{report.eveningShiftPic}</option>
                    )}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-indigo-800/80 font-medium mt-1.5">
              ✓ Otomatis mengisi PIC pada semua task grup <b>Evening</b>
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Items Management Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Tugas Checklist Harian
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {report.items.length} Task
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {onSyncFromPreviousDate && (
              <button
                type="button"
                onClick={onSyncFromPreviousDate}
                title="Ambil & salin ulang tampilan checklist dari tanggal sebelumnya"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                Ikuti Tgl Sebelumnya
              </button>
            )}
            <button
              type="button"
              onClick={() => setAllTasksShift('morning')}
              title="Set semua task ke grup Shift Pagi (Morning) & terapkan PIC Morning"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition"
            >
              <span>☀️ Semua Morning</span>
            </button>
            <button
              type="button"
              onClick={() => setAllTasksShift('evening')}
              title="Set semua task ke grup Shift Sore (Evening) & terapkan PIC Evening"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold transition"
            >
              <span>🌙 Semua Evening</span>
            </button>
            <button
              type="button"
              onClick={markAllChecked}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              Semua Checked
            </button>
            <button
              type="button"
              onClick={fillEmptyRemarksNoIssue}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
            >
              Isi &quot;No issue&quot;
            </button>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Task
            </button>
            <button
              type="button"
              onClick={resetToDefaultTemplate}
              title={`Reset ke template standar (${DEFAULT_CHECKLIST_ITEMS.length} task)`}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari task list, nama PIC, atau remark..."
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="sm:col-span-3 flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-bold shrink-0">Shift:</span>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value as any)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Semua Grup Shift</option>
              <option value="morning">☀️ Hanya Shift Morning</option>
              <option value="evening">🌙 Hanya Shift Evening</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <select
              value={filterPic}
              onChange={(e) => setFilterPic(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Semua PIC</option>
              {activeMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ChecklistSortOption)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="no-asc">Sortir: No. Urut (Default)</option>
              <option value="task-asc">Sortir: Nama Task (A - Z)</option>
              <option value="task-desc">Sortir: Nama Task (Z - A)</option>
              <option value="pic-asc">Sortir: PIC (A - Z)</option>
              <option value="status-issue">Sortir: Status (Issue/Pending)</option>
            </select>
          </div>
        </div>

        {/* ================= DESKTOP TABLE VIEW (Visible on lg screens and up) ================= */}
        <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#d97706] text-black font-bold text-center border-b border-black">
                <th className="py-2.5 px-2 w-10 text-center">No.</th>
                <th className="py-2.5 px-3 text-left w-72">Task List</th>
                <th className="py-2.5 px-2 w-44 text-center">Grup Shift</th>
                <th className="py-2.5 px-3 w-40 text-center">Person Incharge</th>
                <th className="py-2.5 px-3 w-36 text-center">Status</th>
                <th className="py-2.5 px-3 text-left">Remark (Keterangan)</th>
                <th className="py-2.5 px-2 w-10 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredIndices.map((actualIndex) => {
                const item = report.items[actualIndex];
                const isChecked = item.status === 'Checked';
                const isMorning = isTaskMorning(item);
                const isEvening = isTaskEvening(item);

                return (
                  <tr
                    key={item.id || actualIndex}
                    className={`hover:bg-slate-50 transition ${
                      !isChecked ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-bold text-slate-600">
                      {item.no}
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.taskList}
                        onChange={(e) => updateItem(actualIndex, { taskList: e.target.value })}
                        className="w-full px-2 py-1 text-xs rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 font-semibold text-slate-900 bg-transparent"
                      />
                    </td>

                    {/* Sisi Kanan Task: Tombol Grup Shift Morning / Evening */}
                    <td className="py-2 px-2 text-center">
                      <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleTaskShiftChange(actualIndex, 'morning')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                            isMorning
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                          title={`Set task #${item.no} ke Shift Pagi (PIC otomatis: ${report.morningShiftPic || 'Belum dipilih'})`}
                        >
                          <span>☀️</span>
                          <span>Morning</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTaskShiftChange(actualIndex, 'evening')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                            isEvening
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                          title={`Set task #${item.no} ke Shift Sore (PIC otomatis: ${report.eveningShiftPic || 'Belum dipilih'})`}
                        >
                          <span>🌙</span>
                          <span>Evening</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <select
                        value={item.personIncharge}
                        onChange={(e) => {
                          const val = e.target.value;
                          let newShift = item.shift;
                          if (val && val === report.morningShiftPic) newShift = 'morning';
                          else if (val && val === report.eveningShiftPic) newShift = 'evening';
                          else if (val) newShift = 'custom';
                          updateItem(actualIndex, { personIncharge: val, shift: newShift });
                        }}
                        className={`w-full px-2 py-1 text-xs rounded border focus:border-emerald-600 font-semibold bg-white ${
                          isMorning && item.personIncharge
                            ? 'border-amber-300 text-amber-950 bg-amber-50/30'
                            : isEvening && item.personIncharge
                            ? 'border-indigo-300 text-indigo-950 bg-indigo-50/30'
                            : 'border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="">-- Pilih PIC --</option>
                        {activeMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} {m.name === report.morningShiftPic ? '(Morning)' : m.name === report.eveningShiftPic ? '(Evening)' : ''}
                          </option>
                        ))}
                        {item.personIncharge &&
                          !activeMembers.some((m) => m.name === item.personIncharge) && (
                            <option value={item.personIncharge}>
                              {item.personIncharge} (Kustom)
                            </option>
                          )}
                      </select>
                    </td>

                    <td className="py-2 px-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateItem(actualIndex, { status: e.target.value as any })
                        }
                        className={`w-full px-2 py-1 text-xs rounded border font-bold text-center ${
                          item.status === 'Checked'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'Issue'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Checked">☑ Checked</option>
                        <option value="Issue">⚠ Issue</option>
                        <option value="In Progress">⏳ In Progress</option>
                        <option value="Pending">⏸ Pending</option>
                      </select>
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.remark}
                        onChange={(e) => updateItem(actualIndex, { remark: e.target.value })}
                        placeholder="Keterangan..."
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 focus:border-emerald-600 text-slate-800 font-medium"
                      />
                    </td>

                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(actualIndex)}
                        title="Hapus baris"
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE & TABLET RESPONSIVE CARD VIEW (Up to lg screen) ================= */}
        <div className="lg:hidden space-y-3">
          {filteredIndices.map((actualIndex) => {
            const item = report.items[actualIndex];
            const isChecked = item.status === 'Checked';
            const isMorning = isTaskMorning(item);
            const isEvening = isTaskEvening(item);

            return (
              <div
                key={item.id || actualIndex}
                className={`p-3.5 rounded-xl border transition shadow-2xs ${
                  isChecked
                    ? 'bg-white border-slate-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                {/* Header: No, Title, SISI KANAN: Grup Morning/Evening, and Delete */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {item.no}
                    </span>
                    <input
                      type="text"
                      value={item.taskList}
                      onChange={(e) => updateItem(actualIndex, { taskList: e.target.value })}
                      className="w-full px-1.5 py-1 text-xs md:text-sm font-bold text-slate-900 border-b border-transparent focus:border-emerald-600 bg-transparent"
                      placeholder="Nama Task..."
                    />
                  </div>

                  {/* Sisi Kanan: Grup Morning/Evening Toggle & Hapus */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="inline-flex items-center rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleTaskShiftChange(actualIndex, 'morning')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                          isMorning
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Set Morning"
                      >
                        <span>☀️</span>
                        <span>M</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTaskShiftChange(actualIndex, 'evening')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                          isEvening
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Set Evening"
                      >
                        <span>🌙</span>
                        <span>E</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(actualIndex)}
                      title="Hapus task"
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* PIC Dropdown & Status Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Person Incharge (PIC)
                      </label>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isMorning
                          ? 'bg-amber-100 text-amber-900'
                          : isEvening
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isMorning ? '☀️ Pagi' : isEvening ? '🌙 Sore' : 'Kustom'}
                      </span>
                    </div>
                    <select
                      value={item.personIncharge}
                      onChange={(e) => {
                        const val = e.target.value;
                        let newShift = item.shift;
                        if (val && val === report.morningShiftPic) newShift = 'morning';
                        else if (val && val === report.eveningShiftPic) newShift = 'evening';
                        else if (val) newShift = 'custom';
                        updateItem(actualIndex, { personIncharge: val, shift: newShift });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih PIC --</option>
                      {activeMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} {m.name === report.morningShiftPic ? '(Morning)' : m.name === report.eveningShiftPic ? '(Evening)' : ''}
                        </option>
                      ))}
                      {item.personIncharge &&
                        !activeMembers.some((m) => m.name === item.personIncharge) && (
                          <option value={item.personIncharge}>{item.personIncharge} (Kustom)</option>
                        )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Status Pemeriksaan
                    </label>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateItem(actualIndex, { status: e.target.value as any })
                      }
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-bold ${
                        item.status === 'Checked'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : item.status === 'Issue'
                          ? 'bg-red-50 text-red-800 border-red-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Checked">☑ Checked (Selesai)</option>
                      <option value="Issue">⚠ Issue (Kendala)</option>
                      <option value="In Progress">⏳ In Progress (Sedang Cek)</option>
                      <option value="Pending">⏸ Pending (Tertunda)</option>
                    </select>
                  </div>
                </div>

                {/* Remark Textbox */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Remark (Keterangan / Temuan)
                  </label>
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => updateItem(actualIndex, { remark: e.target.value })}
                    placeholder="Contoh: No issue / 403 AP Active / etc"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 text-slate-800 font-medium"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* General Notes Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 mb-1">
            General Notes (Catatan Umum Checklist Hari Ini)
          </label>
          <input
            type="text"
            value={report.generalNotes || ''}
            onChange={(e) => updateField('generalNotes', e.target.value)}
            placeholder="Catatan tambahan atau ringkasan operasional..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
          />
        </div>
      </div>
    </div>
  );
};
