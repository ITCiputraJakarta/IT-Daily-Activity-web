import React, { useState, useMemo } from 'react';
import { ClientUser } from '../types';
import { CLIENT_DEPARTMENTS } from '../data/teamMembers';
import {
  Building2,
  Plus,
  Check,
  X,
  Trash2,
  UserCheck,
  UserX,
  Pencil,
  Search,
  ArrowUpDown,
  Filter,
  Users
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientUsers: ClientUser[];
  onUpdateClientUsers: (
    users: ClientUser[],
    userChange?: { oldName: string; newName: string; newDepartment: string },
    deletedUserName?: string
  ) => void;
  onSwitchToPicModal?: () => void;
}

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'dept-asc' | 'status-active';

export const UserManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  clientUsers,
  onUpdateClientUsers,
  onSwitchToPicModal,
}) => {
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState(CLIENT_DEPARTMENTS[0]);
  const [newRoleOrExt, setNewRoleOrExt] = useState('');

  // Search, Filter, & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Inline Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDept, setEditingDept] = useState('');
  const [editingRoleOrExt, setEditingRoleOrExt] = useState('');

  // Inline Delete Confirmation & Feedback Banner
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const allDepartments = useMemo(() => {
    const set = new Set<string>(CLIENT_DEPARTMENTS);
    clientUsers.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [clientUsers]);

  const filteredAndSortedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = clientUsers.filter((u) => {
      const matchesDept = filterDept === 'ALL' || u.department === filterDept;
      if (!matchesDept) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        (u.roleOrExt || '').toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'dept-asc') {
      sorted.sort(
        (a, b) =>
          a.department.localeCompare(b.department) || a.name.localeCompare(b.name)
      );
    } else if (sortBy === 'status-active') {
      sorted.sort((a, b) => {
        if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
        return a.isActive ? -1 : 1;
      });
    }
    return sorted;
  }, [clientUsers, searchQuery, filterDept, sortBy]);

  if (!isOpen) return null;

  const handleToggleActive = (id: string) => {
    const updated = clientUsers.map((u) =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    );
    onUpdateClientUsers(updated);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newUser: ClientUser = {
      id: 'cu-' + Date.now(),
      name: newName.trim(),
      department: newDept.trim() || CLIENT_DEPARTMENTS[0],
      roleOrExt: newRoleOrExt.trim() || '',
      isActive: true,
    };
    onUpdateClientUsers([newUser, ...clientUsers]);
    setNewName('');
    setNewRoleOrExt('');
  };

  const handleStartEdit = (user: ClientUser) => {
    setEditingId(user.id);
    setEditingName(user.name);
    setEditingDept(user.department || CLIENT_DEPARTMENTS[0]);
    setEditingRoleOrExt(user.roleOrExt || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDept('');
    setEditingRoleOrExt('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;

    const oldUser = clientUsers.find((u) => u.id === id);
    const oldName = oldUser?.name || '';
    const newTrimmedName = editingName.trim();
    const newTrimmedDept = editingDept.trim() || CLIENT_DEPARTMENTS[0];
    const newTrimmedRole = editingRoleOrExt.trim();

    const updated = clientUsers.map((u) =>
      u.id === id
        ? {
            ...u,
            name: newTrimmedName,
            department: newTrimmedDept,
            roleOrExt: newTrimmedRole,
          }
        : u
    );

    const userChange = oldName
      ? {
          oldName,
          newName: newTrimmedName,
          newDepartment: newTrimmedDept,
        }
      : undefined;

    onUpdateClientUsers(updated, userChange);
    setEditingId(null);
    showFeedback(`✓ User/Client "${newTrimmedName}" berhasil diperbarui.`);
  };

  const handleConfirmDelete = (id: string) => {
    const target = clientUsers.find((u) => u.id === id);
    const deletedName = target?.name || '';
    const updated = clientUsers.filter((u) => u.id !== id);
    onUpdateClientUsers(updated, undefined, deletedName);
    if (editingId === id) {
      setEditingId(null);
    }
    setConfirmDeleteId(null);
    showFeedback(
      `✓ User/Client "${deletedName}" dihapus. Data pada tanggal sebelumnya tetap aman & tidak berubah kecuali diedit.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-blue-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-900 text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Kelola Daftar User / Client Hotel</h3>
                <span className="text-[10px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full font-bold border border-blue-700">
                  Terpisah dari PIC IT
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">
                Kelola daftar nama user/klien & departemen untuk IT Log Book Activity (bisa dicari & disortir)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onSwitchToPicModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToPicModal();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-blue-100 text-[11px] font-semibold flex items-center gap-1 border border-blue-700 transition"
                title="Buka Kelola PIC IT"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ke Kelola PIC IT</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {feedbackMsg && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-300 text-blue-950 text-xs font-semibold flex items-center justify-between gap-2">
              <span>{feedbackMsg}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-blue-700 hover:text-blue-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add User Form */}
          <form
            onSubmit={handleAddUser}
            className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5"
          >
            <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-700" />
              Tambah User / Client Baru
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Nama User / Client (misal: Pak Budi / Reception)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="sm:col-span-4 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
              />
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="sm:col-span-4 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
              >
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Lokasi / Ext / Jabatan (opsional)"
                value={newRoleOrExt}
                onChange={(e) => setNewRoleOrExt(e.target.value)}
                className="sm:col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="sm:col-span-2 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition"
              >
                + Tambah
              </button>
            </div>
          </form>

          {/* Search, Filter & Sort Controls */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Search Box */}
              <div className="sm:col-span-5 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama user, departemen, lokasi..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter by Department */}
              <div className="sm:col-span-4 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="ALL">Semua Departemen ({clientUsers.length})</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="sm:col-span-3 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="name-asc">Sortir: Nama (A - Z)</option>
                  <option value="name-desc">Sortir: Nama (Z - A)</option>
                  <option value="dept-asc">Sortir: Departemen (A - Z)</option>
                  <option value="status-active">Sortir: Aktif Teratas</option>
                  <option value="default">Sortir: Urutan Input</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex justify-between items-center">
              <span>
                Daftar User / Client ({filteredAndSortedUsers.length} dari {clientUsers.length})
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Klik <strong>Edit</strong> untuk ubah nama atau departemen user
              </span>
            </div>

            {filteredAndSortedUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada User / Client yang cocok dengan pencarian &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-xl border transition overflow-hidden ${
                    editingId === user.id
                      ? 'border-blue-400 bg-blue-50/50 shadow-xs'
                      : user.isActive
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-slate-200 bg-slate-100 opacity-65'
                  }`}
                >
                  {editingId === user.id ? (
                    <div className="p-3 space-y-2.5">
                      <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          Edit Data User / Client:
                        </span>
                        <span className="text-[10px] text-blue-800 font-medium">
                          Tekan Simpan untuk memperbarui
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Nama User / Client
                          </label>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 text-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Departemen
                          </label>
                          <select
                            value={editingDept}
                            onChange={(e) => setEditingDept(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 text-slate-800"
                          >
                            {allDepartments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Lokasi / Ext / Ket
                          </label>
                          <input
                            type="text"
                            value={editingRoleOrExt}
                            onChange={(e) => setEditingRoleOrExt(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 text-slate-800"
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
                          onClick={() => handleSaveEdit(user.id)}
                          disabled={!editingName.trim()}
                          className="px-3.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            user.isActive
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {user.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                              {user.department}
                            </span>
                          </div>
                          {user.roleOrExt && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {user.roleOrExt}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {confirmDeleteId === user.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-red-800 mr-1">
                              Hapus?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(user.id)}
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
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteId(null);
                                handleStartEdit(user);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                              title="Edit nama atau departemen user"
                            >
                              <Pencil className="w-3 h-3 text-amber-700" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(user.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition border ${
                                user.isActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {user.isActive ? (
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

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(user.id)}
                              title="Hapus User"
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
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Daftar <strong>User / Client</strong> ini terpisah dari <strong>PIC IT</strong> dan otomatis mengisi departemen saat dipilih.
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
