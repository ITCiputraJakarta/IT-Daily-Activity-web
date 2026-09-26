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
  Sparkles
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
}

export const DailyChecklistForm: React.FC<Props> = ({
  report,
  onChange,
  onSave,
  isSaving,
  teamMembers,
  onOpenTeamModal,
  customLogoUrl,
  onOpenLogoModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
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

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: 'item-' + Date.now(),
      no: report.items.length + 1,
      taskList: '',
      personIncharge: report.morningShiftPic || activeMembers[0]?.name || 'Ramdhani',
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
    if (
      window.confirm(
        'Kembalikan checklist ke 31 item standar Hotel Ciputra Jakarta? Data editan akan diganti.'
      )
    ) {
      updateField('items', JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_ITEMS)));
    }
  };

  const assignPicToAll = (picName: string) => {
    if (!picName) return;
    const updated = report.items.map((it) => ({
      ...it,
      personIncharge: picName,
    }));
    updateField('items', updated);
  };

  // Cascade shift changes to items assigned to previous officer (single name only)
  const handleMorningShiftChange = (newPic: string) => {
    const prevPic = report.morningShiftPic;
    const updatedItems = report.items.map((item) => {
      if (
        prevPic &&
        item.personIncharge.trim() === prevPic.trim() &&
        !item.personIncharge.includes('&') &&
        !item.personIncharge.includes(',') &&
        !item.personIncharge.includes('/')
      ) {
        return { ...item, personIncharge: newPic };
      }
      return item;
    });

    onChange({
      ...report,
      morningShiftPic: newPic,
      items: updatedItems,
    });
  };

  const handleEveningShiftChange = (newPic: string) => {
    const prevPic = report.eveningShiftPic;
    const updatedItems = report.items.map((item) => {
      if (
        prevPic &&
        item.personIncharge.trim() === prevPic.trim() &&
        !item.personIncharge.includes('&') &&
        !item.personIncharge.includes(',') &&
        !item.personIncharge.includes('/')
      ) {
        return { ...item, personIncharge: newPic };
      }
      return item;
    });

    onChange({
      ...report,
      eveningShiftPic: newPic,
      items: updatedItems,
    });
  };

  const filteredIndices: number[] = [];
  report.items.forEach((it, idx) => {
    const matches =
      it.taskList.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.remark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.personIncharge.toLowerCase().includes(searchQuery.toLowerCase());
    if (matches) {
      filteredIndices.push(idx);
    }
  });

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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Shift Petugas & Informasi Checklist
                </h2>
                <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  31 Task Standar
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
                Logo di samping akan dicetak pada header IT Daily Checklist A4.
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
              Kelola Daftar Nama Petugas
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Morning Shift PIC
              </label>
              <button
                type="button"
                onClick={() => assignPicToAll(report.morningShiftPic)}
                className="text-[10px] text-emerald-700 hover:underline font-semibold"
              >
                Set ke Semua Task
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <select
                value={report.morningShiftPic}
                onChange={(e) => handleMorningShiftChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white font-semibold text-slate-800"
              >
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role || 'IT'})
                  </option>
                ))}
                {!activeMembers.some((m) => m.name === report.morningShiftPic) && (
                  <option value={report.morningShiftPic}>{report.morningShiftPic} (Kustom)</option>
                )}
              </select>
            </div>
          </div>

          {/* Evening Shift Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Evening Shift PIC
              </label>
              <button
                type="button"
                onClick={() => assignPicToAll(report.eveningShiftPic)}
                className="text-[10px] text-indigo-700 hover:underline font-semibold"
              >
                Set ke Semua Task
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <select
                value={report.eveningShiftPic}
                onChange={(e) => handleEveningShiftChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white font-semibold text-slate-800"
              >
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role || 'IT'})
                  </option>
                ))}
                {!activeMembers.some((m) => m.name === report.eveningShiftPic) && (
                  <option value={report.eveningShiftPic}>{report.eveningShiftPic} (Kustom)</option>
                )}
              </select>
            </div>
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
              {report.items.length} Item
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
              title="Reset ke template 31 task"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari task list, PIC, atau remark..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
            />
          </div>
        </div>

        {/* ================= DESKTOP TABLE VIEW (Visible on lg screens and up) ================= */}
        <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#d97706] text-black font-bold text-center border-b border-black">
                <th className="py-2.5 px-2 w-10 text-center">No.</th>
                <th className="py-2.5 px-3 text-left w-72">Task List</th>
                <th className="py-2.5 px-3 w-44 text-center">Person Incharge</th>
                <th className="py-2.5 px-3 w-36 text-center">Status</th>
                <th className="py-2.5 px-3 text-left">Remark (Keterangan)</th>
                <th className="py-2.5 px-2 w-10 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredIndices.map((actualIndex) => {
                const item = report.items[actualIndex];
                const isChecked = item.status === 'Checked';

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

                    <td className="py-2 px-3">
                      <select
                        value={item.personIncharge}
                        onChange={(e) =>
                          updateItem(actualIndex, { personIncharge: e.target.value })
                        }
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:border-emerald-600 font-medium bg-white"
                      >
                        {activeMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                        {!activeMembers.some((m) => m.name === item.personIncharge) && (
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

            return (
              <div
                key={item.id || actualIndex}
                className={`p-3.5 rounded-xl border transition shadow-2xs ${
                  isChecked
                    ? 'bg-white border-slate-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                {/* Header: No, Title, Delete */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1">
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
                  <button
                    type="button"
                    onClick={() => removeItem(actualIndex)}
                    title="Hapus task"
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* PIC Dropdown & Status Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Person Incharge (PIC)
                    </label>
                    <select
                      value={item.personIncharge}
                      onChange={(e) =>
                        updateItem(actualIndex, { personIncharge: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
                    >
                      {activeMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      {!activeMembers.some((m) => m.name === item.personIncharge) && (
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
