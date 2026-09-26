import React, { useState } from 'react';
import { TeamMember } from '../types';
import { Users, Plus, Check, X, Trash2, UserCheck, UserX, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
}

export const TeamManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  teamMembers,
  onUpdateTeamMembers,
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('IT Support');

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

  const handleDeleteMember = (id: string) => {
    if (confirm('Hapus nama petugas ini dari daftar?')) {
      onUpdateTeamMembers(teamMembers.filter((m) => m.id !== id));
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
              <h3 className="font-bold text-base">Kelola Daftar Nama Petugas & Status</h3>
              <p className="text-[11px] text-slate-300">
                Atur nama PIC yang tampil di dropdown Daily Activity & Checklist
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
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
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
                className="sm:col-span-6 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                className="sm:col-span-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
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
                Klik tombol status untuk mengubah Aktif / Tidak Aktif
              </span>
            </div>

            {teamMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  member.isActive
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 bg-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      member.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{member.name}</div>
                    <div className="text-[10px] text-slate-500">{member.role || 'IT Staff'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(member.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                      member.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
                        Tidak Aktif
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id)}
                    title="Hapus"
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Hanya nama yang <strong>Aktif</strong> yang akan muncul di pilihan dropdown.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
