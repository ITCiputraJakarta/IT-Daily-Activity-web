import React, { useState } from 'react';
import { RoutineActivityTemplate, RoutineSchedule } from '../types';
import { DEFAULT_ROUTINE_ACTIVITIES, isDateWeekend } from '../data/teamMembers';
import {
  ListChecks,
  Plus,
  Trash2,
  Check,
  X,
  Pencil,
  Calendar,
  Layers,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templates: RoutineActivityTemplate[];
  onUpdateTemplates: (updated: RoutineActivityTemplate[]) => void;
  departments: string[];
  currentDate?: string;
  onApplyToCurrentReport?: () => void;
}

export const RoutineActivityManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  templates,
  onUpdateTemplates,
  departments,
  currentDate,
  onApplyToCurrentReport,
}) => {
  // New activity form states
  const [details, setDetails] = useState('');
  const [clientDepartment, setClientDepartment] = useState(departments[0] || 'IT (Internal IT)');
  const [clientName, setClientName] = useState('');
  const [schedule, setSchedule] = useState<RoutineSchedule>('weekday');
  const [defaultStatus, setDefaultStatus] = useState<'Done' | 'Pending' | 'In Progress'>('Done');
  const [noPhoto, setNoPhoto] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editSchedule, setEditSchedule] = useState<RoutineSchedule>('weekday');
  const [editStatus, setEditStatus] = useState<'Done' | 'Pending' | 'In Progress'>('Done');
  const [editNoPhoto, setEditNoPhoto] = useState(true);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Schedule filter tab: 'all' | 'everyday' | 'weekday' | 'weekend'
  const [scheduleFilter, setScheduleFilter] = useState<'all' | RoutineSchedule>('all');

  // Success toast/feedback inside modal
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      showFeedback('Deskripsi aktivitas tidak boleh kosong.');
      return;
    }

    const isDuplicate = templates.some(
      (t) => t.details.trim().toLowerCase() === details.trim().toLowerCase()
    );
    if (isDuplicate) {
      showFeedback('Aktivitas rutin dengan deskripsi ini sudah terdaftar.');
      return;
    }

    const newTemplate: RoutineActivityTemplate = {
      id: `routine-${Date.now()}`,
      details: details.trim(),
      clientDepartment: clientDepartment || departments[0] || 'IT (Internal IT)',
      clientName: clientName.trim(),
      schedule,
      defaultStatus,
      noPhoto,
      isActive: true,
      order: templates.length + 1,
    };

    const updated = [...templates, newTemplate];
    onUpdateTemplates(updated);
    setDetails('');
    setClientName('');
    showFeedback(`✓ Aktivitas "${newTemplate.details}" berhasil ditambahkan.`);
  };

  const startEdit = (t: RoutineActivityTemplate) => {
    setEditingId(t.id);
    setEditDetails(t.details);
    setEditDepartment(t.clientDepartment || departments[0] || 'IT (Internal IT)');
    setEditClientName(t.clientName || '');
    setEditSchedule(t.schedule);
    setEditStatus(t.defaultStatus as any || 'Done');
    setEditNoPhoto(t.noPhoto ?? true);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editDetails.trim()) return;
    const updated = templates.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          details: editDetails.trim(),
          clientDepartment: editDepartment,
          clientName: editClientName.trim(),
          schedule: editSchedule,
          defaultStatus: editStatus,
          noPhoto: editNoPhoto,
        };
      }
      return t;
    });
    onUpdateTemplates(updated);
    setEditingId(null);
    showFeedback('✓ Perubahan template aktivitas disimpan.');
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    onUpdateTemplates(updated);
    setConfirmDeleteId(null);
    showFeedback('✓ Aktivitas rutin berhasil dihapus.');
  };

  const handleToggleActive = (id: string) => {
    const updated = templates.map((t) => {
      if (t.id === id) {
        return { ...t, isActive: !t.isActive };
      }
      return t;
    });
    onUpdateTemplates(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= templates.length) return;
    const items = [...templates];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    const reordered = items.map((it, idx) => ({ ...it, order: idx + 1 }));
    onUpdateTemplates(reordered);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Kembalikan daftar aktivitas rutin ke template bawaan (Update Signage & GM Check Laptop)?')) {
      onUpdateTemplates(DEFAULT_ROUTINE_ACTIVITIES);
      showFeedback('✓ Daftar aktivitas dikembalikan ke template standar.');
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (scheduleFilter === 'all') return true;
    return t.schedule === scheduleFilter;
  });

  // Calculate day-of-week context if currentDate given
  const isWeekendNow = currentDate ? isDateWeekend(currentDate) : false;
  const weekdayCount = templates.filter((t) => t.isActive && (t.schedule === 'weekday' || t.schedule === 'everyday')).length;
  const weekendCount = templates.filter((t) => t.isActive && (t.schedule === 'weekend' || t.schedule === 'everyday')).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <ListChecks className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>Kelola Aktivitas Rutin / Default</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  List Tanpa Foto
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aktivitas yang otomatis tampil pada IT Log Book (#). Bisa ditambah, diedit, atau dihapus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2 text-xs font-semibold flex items-center justify-between">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-emerald-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Schedule summary box */}
          <div className="p-3.5 bg-linear-to-r from-amber-50/80 via-white to-blue-50/80 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Aturan Jadwal Otomatis:</span>
              </div>
              <p className="text-[11.5px] text-slate-600">
                • <strong>Weekday Saja:</strong> Muncul otomatis di hari <strong>Senin s/d Jumat</strong> (contoh: <em>GM Check Laptop</em>).<br />
                • <strong>Setiap Hari:</strong> Selalu muncul Senin s/d Minggu (contoh: <em>Update Signage</em>).<br />
                • Format <strong>List Tanpa Foto</strong> menjaga lembar cetak A4 tetap ringkas, hemat halaman &amp; rapi.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {currentDate && onApplyToCurrentReport && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyToCurrentReport();
                    showFeedback('✓ Aktivitas rutin hari ini diterapkan ke form!');
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Terapkan aktivitas rutin yang sesuai ke laporan tanggal saat ini"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terapkan ke Form ({isWeekendNow ? 'Weekend' : 'Weekday'})</span>
                </button>
              )}
            </div>
          </div>

          {/* Form: Add New Routine Activity */}
          <form
            onSubmit={handleAddActivity}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
          >
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>+ Tambah Template Aktivitas Rutin Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Description */}
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Deskripsi Aktivitas / Kasus <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Contoh: Update Digital Signage & Content Event"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Department */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Departemen User / Lokasi
                </label>
                <select
                  value={clientDepartment}
                  onChange={(e) => setClientDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama User / Target (Opsional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Misal: GM / Public Area"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Schedule */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jadwal Tampil Otomatis
                </label>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value as RoutineSchedule)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-amber-900 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="weekday">Weekday Saja (Senin - Jumat · Weekend TIDAK)</option>
                  <option value="everyday">Setiap Hari (Senin - Minggu)</option>
                  <option value="weekend">Weekend Saja (Sabtu - Minggu)</option>
                </select>
              </div>

              {/* Default Status */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Status Default
                </label>
                <select
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-emerald-800"
                >
                  <option value="Done">Done (Selesai)</option>
                  <option value="In Progress">In Progress (Proses)</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Format checkbox */}
              <div className="sm:col-span-5 flex items-center justify-between sm:justify-start gap-3 sm:pt-6">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noPhoto}
                    onChange={(e) => setNoPhoto(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Format List Saja (Tanpa Foto)</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 ml-auto sm:ml-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </form>

          {/* List of Existing Routine Activities */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">
                  Daftar Template Aktivitas ({templates.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  ({weekdayCount} aktif di weekday, {weekendCount} aktif di weekend)
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setScheduleFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scheduleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({templates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('weekday')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scheduleFilter === 'weekday'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekday ({templates.filter((t) => t.schedule === 'weekday').length})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('everyday')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scheduleFilter === 'everyday'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Setiap Hari ({templates.filter((t) => t.schedule === 'everyday').length})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('weekend')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scheduleFilter === 'weekend'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekend ({templates.filter((t) => t.schedule === 'weekend').length})
                </button>
              </div>
            </div>

            {/* Template Items */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                Tidak ada aktivitas rutin untuk filter ini. Silakan tambahkan aktivitas baru di atas.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTemplates.map((template, index) => {
                  const isEditing = editingId === template.id;

                  if (isEditing) {
                    return (
                      <div
                        key={template.id}
                        className="p-3 bg-amber-50/70 border-2 border-amber-400 rounded-xl space-y-2 text-xs"
                      >
                        <div className="font-bold text-amber-950 flex items-center justify-between">
                          <span>Edit Aktivitas #{index + 1}</span>
                          <span className="text-[10px] text-amber-800">Tekan Simpan setelah selesai</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={editDetails}
                            onChange={(e) => setEditDetails(e.target.value)}
                            placeholder="Deskripsi aktivitas..."
                            className="sm:col-span-5 px-2.5 py-1.5 rounded border border-amber-300 bg-white font-medium"
                          />
                          <select
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="sm:col-span-3 px-2 py-1.5 rounded border border-amber-300 bg-white font-medium text-[11px]"
                          >
                            {departments.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editClientName}
                            onChange={(e) => setEditClientName(e.target.value)}
                            placeholder="Nama User / Target..."
                            className="sm:col-span-4 px-2.5 py-1.5 rounded border border-amber-300 bg-white font-medium text-[11px]"
                          />
                          <select
                            value={editSchedule}
                            onChange={(e) => setEditSchedule(e.target.value as RoutineSchedule)}
                            className="sm:col-span-4 px-2 py-1.5 rounded border border-amber-300 bg-white font-bold text-[11px]"
                          >
                            <option value="weekday">Weekday Saja (Senin - Jumat)</option>
                            <option value="everyday">Setiap Hari (Senin - Minggu)</option>
                            <option value="weekend">Weekend Saja (Sabtu - Minggu)</option>
                          </select>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="sm:col-span-3 px-2 py-1.5 rounded border border-amber-300 bg-white font-bold text-[11px]"
                          >
                            <option value="Done">Done</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending">Pending</option>
                          </select>
                          <label className="sm:col-span-3 flex items-center gap-1.5 text-[11px] font-semibold">
                            <input
                              type="checkbox"
                              checked={editNoPhoto}
                              onChange={(e) => setEditNoPhoto(e.target.checked)}
                              className="rounded border-amber-400"
                            />
                            <span>Tanpa Foto</span>
                          </label>
                          <div className="sm:col-span-2 flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => saveEdit(template.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={template.id}
                      className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        template.isActive
                          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">
                            {template.details}
                          </span>

                          {/* Schedule badge */}
                          {template.schedule === 'weekday' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                              📅 Weekday (Senin - Jumat)
                            </span>
                          )}
                          {template.schedule === 'everyday' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              🔄 Setiap Hari (Senin - Minggu)
                            </span>
                          )}
                          {template.schedule === 'weekend' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              🌴 Weekend Saja (Sabtu - Minggu)
                            </span>
                          )}

                          {/* List without photo badge */}
                          {template.noPhoto !== false && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              📋 List (Tanpa Foto)
                            </span>
                          )}

                          {/* Status badge */}
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {template.defaultStatus}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-slate-700">
                            Dept: {template.clientDepartment}
                          </span>
                          {template.clientName && (
                            <span>· User/Target: <strong>{template.clientName}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {/* Toggle active switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(template.id)}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition cursor-pointer ${
                            template.isActive
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title={template.isActive ? 'Nonaktifkan aktivitas ini' : 'Aktifkan kembali'}
                        >
                          {template.isActive ? '✓ Aktif' : 'Nonaktif'}
                        </button>

                        {/* Move Up/Down */}
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Geser ke atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === filteredTemplates.length - 1}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Geser ke bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => startEdit(template)}
                          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          title="Edit aktivitas ini"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        {confirmDeleteId === template.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200">
                            <span className="text-[10px] text-red-700 font-bold">Hapus?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(template.id)}
                              className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(template.id)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Hapus aktivitas rutin ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:underline cursor-pointer"
            title="Kembalikan ke template default bawaan sistem"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Template Default (Signage &amp; GM Check Laptop)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
            >
              Selesai &amp; Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
