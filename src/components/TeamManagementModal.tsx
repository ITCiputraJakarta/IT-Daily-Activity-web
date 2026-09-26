import React, { useState } from 'react';
import { TeamMember } from '../types';
import { Users, Plus, Check, X, Trash2, UserCheck, UserX, Pencil } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[], nameChange?: { oldName: string; newName: string }) => void;
}

export const TeamManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  teamMembers,
  onUpdateTeamMembers,
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('IT Support');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRole, setEditingRole] = useState('');

  if (!isOpen) return null;

  const handleToggleActive = (id: string) => {
    const updated = teamMembers.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    onUpdateTeamMembers(updated);
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
  };

  const handleDeleteMember = (id: string) => {
    const target = teamMembers.find((m) => m.id === id);
    if (confirm(`Hapus petugas "${target?.name || ''}" dari daftar?`)) {
      onUpdateTeamMembers(teamMembers.filter((m) => m.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Kelola Daftar Petugas IT (PIC)</h3>
              <p className="text-[11px] text-slate-300">
                Tambah, edit nama/posisi, dan atur status aktif petugas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[65vh] overflow-y-auto space-y-4">
          {/* Add member form */}
          <form
            onSubmit={handleAddMember}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
          >
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              Tambah Petugas Baru
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Nama Petugas (misal: Andika / PIC-02)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="sm:col-span-6 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
              <input
                type="text"
                placeholder="Posisi (misal: IT Support)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="sm:col-span-4 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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

          {/* Members list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex justify-between items-center">
              <span>Daftar Petugas IT ({teamMembers.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Gunakan tombol <strong>Edit</strong> untuk mengubah nama
              </span>
            </div>

            {teamMembers.map((member) => (
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
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(member)}
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
                        onClick={() => handleDeleteMember(member.id)}
                        title="Hapus Petugas"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Hanya nama berstatus <strong>Aktif</strong> yang muncul di dropdown pilihan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
