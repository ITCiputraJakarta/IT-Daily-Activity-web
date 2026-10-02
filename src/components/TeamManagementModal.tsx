import React, { useState, useMemo } from 'react';
import { TeamMember } from '../types';
import {
  Users,
  Plus,
  Check,
  X,
  Trash2,
  UserCheck,
  UserX,
  Pencil,
  Search,
  ArrowUpDown,
  Building2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (
    members: TeamMember[],
    nameChange?: { oldName: string; newName: string },
    deletedName?: string
  ) => void;
  onSwitchToUserModal?: () => void;
}

type PicSortOption = 'default' | 'name-asc' | 'name-desc' | 'role-asc' | 'status-active';

export const TeamManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  teamMembers,
  onUpdateTeamMembers,
  onSwitchToUserModal,
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('IT Support');

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<PicSortOption>('default');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRole, setEditingRole] = useState('');

  // Inline Delete Confirmation & Feedback Banner
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const filteredAndSortedMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = teamMembers.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'role-asc') {
      sorted.sort(
        (a, b) =>
          (a.role || '').localeCompare(b.role || '') ||
          a.name.localeCompare(b.name)
      );
    } else if (sortBy === 'status-active') {
      sorted.sort((a, b) => {
        if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
        return a.isActive ? -1 : 1;
      });
    }
    return sorted;
  }, [teamMembers, searchQuery, sortBy]);

  if (!isOpen) return null;

  const handleToggleActive = (id: string) => {
    const updated = teamMembers.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    onUpdateTeamMembers(updated);
  };

  const handleMoveMember = (id: string, direction: 'up' | 'down') => {
    if (sortBy !== 'default') {
      setSortBy('default');
    }
    const currentIndex = teamMembers.findIndex((m) => m.id === id);
    if (currentIndex === -1) return;
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === teamMembers.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const items = [...teamMembers];
    const temp = items[currentIndex];
    items[currentIndex] = items[targetIndex];
    items[targetIndex] = temp;
    onUpdateTeamMembers(items);
    showFeedback(`✓ Urutan PIC "${temp.name}" berhasil dipindahkan ke ${direction === 'up' ? 'atas' : 'bawah'}. Pilihan PIC di Daily Activity otomatis mengikuti urutan ini.`);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newMember: TeamMember = {
      id: 'tm-' + Date.now(),
      name: newName.trim(),
      role: newRole.trim() || 'IT Staff',
      isActive: true,
    };
    onUpdateTeamMembers([...teamMembers, newMember]);
    setNewName('');
    setNewRole('IT Support');
  };

  const handleStartEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setEditingName(member.name);
    setEditingRole(member.role || 'IT Staff');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingRole('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;

    const oldMember = teamMembers.find((m) => m.id === id);
    const oldName = oldMember?.name || '';
    const newTrimmedName = editingName.trim();
    const newTrimmedRole = editingRole.trim() || 'IT Staff';

    const updated = teamMembers.map((m) =>
      m.id === id
        ? {
            ...m,
            name: newTrimmedName,
            role: newTrimmedRole,
          }
        : m
    );

    const nameChange =
      oldName && oldName !== newTrimmedName
        ? { oldName, newName: newTrimmedName }
        : undefined;

    onUpdateTeamMembers(updated, nameChange);
    setEditingId(null);
    showFeedback(`✓ Petugas "${newTrimmedName}" berhasil diperbarui.`);
  };

  const handleConfirmDelete = (id: string) => {
    const target = teamMembers.find((m) => m.id === id);
    const deletedName = target?.name || '';
    const updated = teamMembers.filter((m) => m.id !== id);
    onUpdateTeamMembers(updated, undefined, deletedName);
    if (editingId === id) {
      setEditingId(null);
    }
    setConfirmDeleteId(null);
    showFeedback(
      `✓ Petugas "${deletedName}" dihapus. Data pada tanggal sebelumnya tetap aman & tidak berubah kecuali diedit.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header (Clean White / Light Theme) */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Kelola Daftar Petugas IT (PIC)</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                  Khusus Tim IT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kelola nama teknisi/petugas IT (PIC) untuk Activity &amp; Shift Checklist
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onSwitchToUserModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToUserModal();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 text-[11px] font-bold flex items-center gap-1 border border-slate-300 transition cursor-pointer"
                title="Buka Kelola User / Client Hotel"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ke Kelola User</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[65vh] overflow-y-auto space-y-4">
          {feedbackMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
              <span>{feedbackMsg}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add member form */}
          <form
            onSubmit={handleAddMember}
            className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2"
          >
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              Tambah Petugas PIC IT Baru
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Nama Petugas IT (misal: Andika / PIC-02)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="sm:col-span-6 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
              <input
                type="text"
                placeholder="Posisi (misal: IT Support)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="sm:col-span-4 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="sm:col-span-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition"
              >
                Tambah
              </button>
            </div>
          </form>

          {/* Search & Sort Bar */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama PIC IT atau posisi/jabatan..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="sm:col-span-5 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as PicSortOption)}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
              >
                <option value="default">Sortir: Urutan Default</option>
                <option value="name-asc">Sortir: Nama PIC (A - Z)</option>
                <option value="name-desc">Sortir: Nama PIC (Z - A)</option>
                <option value="role-asc">Sortir: Jabatan (A - Z)</option>
                <option value="status-active">Sortir: Aktif Teratas</option>
              </select>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex justify-between items-center">
              <span>
                Daftar Petugas IT ({filteredAndSortedMembers.length} dari {teamMembers.length})
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Gunakan tombol <strong>Edit</strong> untuk mengubah nama
              </span>
            </div>

            {filteredAndSortedMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada petugas PIC yang cocok dengan pencarian &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredAndSortedMembers.map((member) => (
              <div
                key={member.id}
                className={`rounded-xl border transition overflow-hidden ${
                  editingId === member.id
                    ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                    : member.isActive
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-slate-200 bg-slate-100 opacity-65'
                }`}
              >
                {editingId === member.id ? (
                  /* Inline Edit Form */
                  <div className="p-3 space-y-2.5">
                    <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5 text-amber-600" />
                        Edit Data Petugas:
                      </span>
                      <span className="text-[10px] text-amber-800 font-medium">
                        Tekan Simpan untuk memperbarui
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Nama Petugas
                        </label>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Posisi / Jabatan
                        </label>
                        <input
                          type="text"
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(member.id)}
                        disabled={!editingName.trim()}
                        className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Member Row with Edit, Status, and Delete */
                  <div className="flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                        {teamMembers.findIndex((m) => m.id === member.id) + 1}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          member.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {member.role || 'IT Staff'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {confirmDeleteId === member.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-bold text-red-800 mr-1">
                            Hapus?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(member.id)}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-semibold transition"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Reorder Up / Down (Sortir Atas Bawah) */}
                          <div className="flex items-center gap-0.5 mr-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleMoveMember(member.id, 'up')}
                              disabled={teamMembers.findIndex((m) => m.id === member.id) === 0}
                              title="Pindahkan ke atas (urutan pilihan PIC di Daily Activity otomatis mengikuti ini)"
                              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 transition cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMember(member.id, 'down')}
                              disabled={teamMembers.findIndex((m) => m.id === member.id) === teamMembers.length - 1}
                              title="Pindahkan ke bawah (urutan pilihan PIC di Daily Activity otomatis mengikuti ini)"
                              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 transition cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(null);
                              handleStartEdit(member);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            title="Edit nama atau posisi petugas"
                          >
                            <Pencil className="w-3 h-3 text-amber-700" />
                            <span>Edit</span>
                          </button>

                          {/* Status Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(member.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition border ${
                              member.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {member.isActive ? (
                              <>
                                <UserCheck className="w-3 h-3 text-emerald-700" />
                                Aktif
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 text-slate-500" />
                                Nonaktif
                              </>
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(member.id)}
                            title="Hapus Petugas"
                            className="px-2 py-1 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Hanya nama berstatus <strong>Aktif</strong> yang muncul di dropdown pilihan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
