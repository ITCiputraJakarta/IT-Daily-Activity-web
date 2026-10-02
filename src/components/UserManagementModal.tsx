import React, { useState, useMemo, useEffect } from 'react';
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
  Users,
  ArrowUp,
  ArrowDown,
  Layers
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
  departments?: string[];
  onUpdateDepartments?: (
    updated: string[],
    deptChange?: { oldName: string; newName: string },
    deletedDept?: string
  ) => void;
  initialTab?: 'departments' | 'users';
  onSwitchToPicModal?: () => void;
}

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'dept-asc' | 'status-active';

export const UserManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  clientUsers,
  onUpdateClientUsers,
  departments: propDepartments,
  onUpdateDepartments,
  initialTab = 'departments',
  onSwitchToPicModal,
}) => {
  // Current active tab: 'departments' | 'users'
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Departments list (fallback to CLIENT_DEPARTMENTS if not provided)
  const currentDepartments = useMemo(() => {
    if (propDepartments && propDepartments.length > 0) {
      return propDepartments;
    }
    return CLIENT_DEPARTMENTS;
  }, [propDepartments]);

  // Department Management State
  const [newDeptInput, setNewDeptInput] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [editingDeptOldName, setEditingDeptOldName] = useState<string | null>(null);
  const [editingDeptNewName, setEditingDeptNewName] = useState('');
  const [confirmDeleteDept, setConfirmDeleteDept] = useState<string | null>(null);

  // User Management State
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState(currentDepartments[0] || 'FO (Front Office)');
  const [newRoleOrExt, setNewRoleOrExt] = useState('');

  // Keep newDept in sync if currentDepartments changes
  useEffect(() => {
    if (!currentDepartments.includes(newDept) && currentDepartments.length > 0) {
      setNewDept(currentDepartments[0]);
    }
  }, [currentDepartments, newDept]);

  // Search, Filter, & Sort state for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Inline Edit state for Users
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

  // Count users per department
  const userCountByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    clientUsers.forEach((u) => {
      const d = u.department || 'Other / Lainnya';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [clientUsers]);

  // Filtered departments list for display
  const filteredDepartments = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    if (!q) return currentDepartments;
    return currentDepartments.filter((d) => d.toLowerCase().includes(q));
  }, [currentDepartments, deptSearch]);

  // ==================== DEPARTMENT HANDLERS ====================
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptInput.trim();
    if (!trimmed) return;

    if (currentDepartments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      showFeedback(`⚠️ Departemen "${trimmed}" sudah ada di daftar.`);
      return;
    }

    const updated = [...currentDepartments, trimmed];
    if (onUpdateDepartments) {
      onUpdateDepartments(updated);
    }
    setNewDeptInput('');
    showFeedback(`✓ Departemen "${trimmed}" berhasil ditambahkan. Pilihan departemen di Daily Activity otomatis mengikuti.`);
  };

  const handleStartEditDept = (deptName: string) => {
    setEditingDeptOldName(deptName);
    setEditingDeptNewName(deptName);
    setConfirmDeleteDept(null);
  };

  const handleCancelEditDept = () => {
    setEditingDeptOldName(null);
    setEditingDeptNewName('');
  };

  const handleSaveEditDept = (oldName: string) => {
    const newNameTrimmed = editingDeptNewName.trim();
    if (!newNameTrimmed) return;

    if (
      newNameTrimmed.toLowerCase() !== oldName.toLowerCase() &&
      currentDepartments.some((d) => d.toLowerCase() === newNameTrimmed.toLowerCase())
    ) {
      showFeedback(`⚠️ Nama departemen "${newNameTrimmed}" sudah ada.`);
      return;
    }

    const updated = currentDepartments.map((d) => (d === oldName ? newNameTrimmed : d));
    if (onUpdateDepartments) {
      onUpdateDepartments(updated, { oldName, newName: newNameTrimmed });
    }
    setEditingDeptOldName(null);
    setEditingDeptNewName('');
    showFeedback(`✓ Nama departemen diubah dari "${oldName}" menjadi "${newNameTrimmed}". Semua data terkait otomatis diperbarui.`);
  };

  const handleMoveDepartment = (deptName: string, direction: 'up' | 'down') => {
    const currentIndex = currentDepartments.indexOf(deptName);
    if (currentIndex === -1) return;
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === currentDepartments.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const items = [...currentDepartments];
    const temp = items[currentIndex];
    items[currentIndex] = items[targetIndex];
    items[targetIndex] = temp;

    if (onUpdateDepartments) {
      onUpdateDepartments(items);
    }
    showFeedback(`✓ Urutan departemen "${deptName}" dipindahkan ke ${direction === 'up' ? 'atas' : 'bawah'}. Pilihan departemen di Daily Activity otomatis mengikuti urutan ini.`);
  };

  const handleConfirmDeleteDept = (deptName: string) => {
    if (currentDepartments.length <= 1) {
      showFeedback('⚠️ Minimal harus ada 1 departemen di sistem.');
      setConfirmDeleteDept(null);
      return;
    }

    const updated = currentDepartments.filter((d) => d !== deptName);
    if (onUpdateDepartments) {
      onUpdateDepartments(updated, undefined, deptName);
    }
    setConfirmDeleteDept(null);
    showFeedback(`✓ Departemen "${deptName}" berhasil dihapus.`);
  };

  // ==================== USER HANDLERS ====================
  const handleToggleActive = (id: string) => {
    const updated = clientUsers.map((u) =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    );
    onUpdateClientUsers(updated);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const chosenDept = newDept.trim() || currentDepartments[0] || 'FO (Front Office)';
    const newUser: ClientUser = {
      id: 'cu-' + Date.now(),
      name: newName.trim(),
      department: chosenDept,
      roleOrExt: newRoleOrExt.trim() || '',
      isActive: true,
    };
    onUpdateClientUsers([newUser, ...clientUsers]);
    setNewName('');
    setNewRoleOrExt('');
    showFeedback(`✓ User/Client "${newUser.name}" berhasil ditambahkan.`);
  };

  const handleStartEdit = (user: ClientUser) => {
    setEditingId(user.id);
    setEditingName(user.name);
    setEditingDept(user.department || currentDepartments[0] || 'FO (Front Office)');
    setEditingRoleOrExt(user.roleOrExt || '');
    setConfirmDeleteId(null);
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
    const newTrimmedDept = editingDept.trim() || currentDepartments[0] || 'FO (Front Office)';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header (Clean White / Light Theme) */}
        <div className="p-4 bg-white border-b border-slate-200 text-slate-900 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight text-slate-900">
                  Pengelola Departemen &amp; User Klien Hotel
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hotel Ciputra Jakarta · Master Data Manajemen
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
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-slate-300 transition cursor-pointer"
                  title="Buka Pengelola PIC IT"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kelola PIC IT</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Switcher: Departemen vs User */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'departments'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Kelola Departemen ({currentDepartments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. User / Klien Hotel ({clientUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Feedback / Notification Banner */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shrink-0 animate-in fade-in">
            <span>{feedbackMsg}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'departments' ? (
            /* ========================================================= */
            /* TAB 1: KELOLA DEPARTEMEN (TAMBAH, EDIT, SORTIR ATAS BAWAH) */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Form Tambah Departemen Baru */}
              <form
                onSubmit={handleAddDepartment}
                className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5"
              >
                <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-700" />
                    Tambah Departemen Baru
                  </span>
                  <span className="text-[10px] text-emerald-800 font-normal">
                    Urutan dan nama departemen otomatis sinkron ke Daily Activity
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Nama Departemen (misal: FO (Front Office) / Spa &amp; Wellness / Vendor IT)"
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!newDeptInput.trim()}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Tambah Departemen
                  </button>
                </div>
              </form>

              {/* Search Departemen */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="Cari nama departemen..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                  {deptSearch && (
                    <button
                      type="button"
                      onClick={() => setDeptSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium shrink-0 px-1">
                  Total: <strong>{currentDepartments.length}</strong> Departemen
                </div>
              </div>

              {/* Department List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>
                    Daftar Urutan Departemen ({filteredDepartments.length} dari {currentDepartments.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Gunakan tombol ⬆️ ⬇️ untuk ubah urutan (semua dropdown otomatis ikut)
                  </span>
                </div>

                {filteredDepartments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Tidak ada departemen yang cocok dengan pencarian &quot;{deptSearch}&quot;.
                  </div>
                ) : (
                  filteredDepartments.map((dept, index) => {
                    const originalIndex = currentDepartments.indexOf(dept);
                    const isFirst = originalIndex === 0;
                    const isLast = originalIndex === currentDepartments.length - 1;
                    const userCount = userCountByDept[dept] || 0;
                    const isEditing = editingDeptOldName === dept;

                    return (
                      <div
                        key={dept}
                        className={`rounded-xl border transition overflow-hidden ${
                          isEditing
                            ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {isEditing ? (
                          /* Inline Edit Department */
                          <div className="p-3 space-y-2">
                            <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5 text-amber-600" />
                                Edit Nama Departemen:
                              </span>
                              <span className="text-[10px] text-amber-800 font-medium">
                                Penggantian nama otomatis memperbarui user &amp; logbook terkait
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingDeptNewName}
                                onChange={(e) => setEditingDeptNewName(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={handleCancelEditDept}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditDept(dept)}
                                disabled={!editingDeptNewName.trim() || editingDeptNewName.trim() === dept}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Simpan
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Standard Department Row */
                          <div className="flex items-center justify-between p-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Order Badge */}
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                                {originalIndex + 1}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {dept}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <span>{userCount} user klien terdaftar</span>
                                  {originalIndex === 0 && (
                                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      ★ Default Form Input
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {confirmDeleteDept === dept ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                                  <span className="text-[10px] font-bold text-red-800 mr-1">
                                    Hapus?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDeleteDept(dept)}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteDept(null)}
                                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-semibold transition cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Sortir Atas & Bawah (Reorder Buttons) */}
                                  <div className="flex items-center gap-0.5 mr-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveDepartment(dept, 'up')}
                                      disabled={isFirst}
                                      title="Pindahkan ke ATAS (urutan dropdown di Daily Activity otomatis mengikuti)"
                                      className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 transition cursor-pointer"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveDepartment(dept, 'down')}
                                      disabled={isLast}
                                      title="Pindahkan ke BAWAH (urutan dropdown di Daily Activity otomatis mengikuti)"
                                      className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 transition cursor-pointer"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditDept(dept)}
                                    title="Edit Nama Departemen"
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3 text-amber-700" />
                                    <span>Edit</span>
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteDept(dept)}
                                    title="Hapus Departemen"
                                    className="px-2 py-1 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
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
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* TAB 2: USER / KLIEN HOTEL (DENGAN PILIHAN DEPARTEMEN URUT) */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Form Tambah User / Klien */}
              <form
                onSubmit={handleAddUser}
                className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5"
              >
                <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-700" />
                    Tambah User / Klien Hotel Baru
                  </span>
                  <span className="text-[10px] text-blue-800 font-normal">
                    Departemen mengikuti urutan pengaturan di Tab 1
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Nama User (misal: Reception / Pak Budi)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="sm:col-span-5 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="sm:col-span-4 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                  >
                    {currentDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ext / Lokasi (opsional)"
                    value={newRoleOrExt}
                    onChange={(e) => setNewRoleOrExt(e.target.value)}
                    className="sm:col-span-3 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah User
                  </button>
                </div>
              </form>

              {/* Search, Filter & Sort Users */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari user, jabatan, ext..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="sm:col-span-4 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                  >
                    <option value="ALL">Semua Departemen</option>
                    {currentDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
                  >
                    <option value="name-asc">Nama (A-Z)</option>
                    <option value="name-desc">Nama (Z-A)</option>
                    <option value="dept-asc">Departemen</option>
                    <option value="status-active">Aktif Teratas</option>
                  </select>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>
                    Daftar User / Client ({filteredAndSortedUsers.length} dari {clientUsers.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Gunakan tombol Edit untuk ganti nama atau departemen
                  </span>
                </div>

                {filteredAndSortedUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Tidak ada user klien yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  filteredAndSortedUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`rounded-xl border transition overflow-hidden ${
                        editingId === user.id
                          ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                          : user.isActive
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-200 bg-slate-100 opacity-65'
                      }`}
                    >
                      {editingId === user.id ? (
                        /* Inline Edit User */
                        <div className="p-3 space-y-2.5">
                          <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-amber-600" />
                              Edit Data User / Klien:
                            </span>
                            <span className="text-[10px] text-amber-800 font-medium">
                              Tekan Simpan untuk memperbarui
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                                Nama User / Klien
                              </label>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-900"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                                Departemen
                              </label>
                              <select
                                value={editingDept}
                                onChange={(e) => setEditingDept(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-900"
                              >
                                {currentDepartments.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                                Ext / Lokasi
                              </label>
                              <input
                                type="text"
                                value={editingRoleOrExt}
                                onChange={(e) => setEditingRoleOrExt(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(user.id)}
                              disabled={!editingName.trim()}
                              className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard User Row */
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
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {user.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700">{user.department}</span>
                                {user.roleOrExt && (
                                  <>
                                    <span>·</span>
                                    <span>{user.roleOrExt}</span>
                                  </>
                                )}
                              </div>
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
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-semibold transition cursor-pointer"
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
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Edit nama atau departemen user"
                                >
                                  <Pencil className="w-3 h-3 text-amber-700" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(user.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition border cursor-pointer ${
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
                                  className="px-2 py-1 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-500 text-[11px] truncate max-w-sm">
            {activeTab === 'departments'
              ? 'Urutan departemen di atas otomatis menentukan urutan opsi dropdown pada form Daily Activity.'
              : 'Daftar User / Client ini terpisah dari PIC IT dan otomatis sinkron dengan nama departemen.'}
          </span>
          <button
            type="button"
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
