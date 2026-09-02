'use client';

import React, { useState, useMemo } from 'react';
import { usePCM } from '@/lib/store';
import { AdminUser, AdminRole, UserRole, UserAccount } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Key,
  Shield,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  Users,
  GraduationCap,
  Sparkles,
  Mail,
  Search,
  Filter,
  RefreshCw,
  BadgeCheck,
  Building2,
  IdCard,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const {
    adminUsers,
    currentAdminUser,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    userAccounts,
    addUserAccount,
    deleteUserAccount,
    updateUserAccountRole,
    currentUserAccount,
    activityLogs,
    addToast,
    canPerformAction,
    syncAllDataToFirestore,
  } = usePCM();

  // Legacy Admin creation modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUser | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('Editor');
  const [newPassword, setNewPassword] = useState('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // User Accounts Directory State
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'All' | UserRole>('All');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [deleteTargetAccount, setDeleteTargetAccount] = useState<UserAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Account form state
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accRole, setAccRole] = useState<UserRole>('Student');
  const [accAdminRole, setAccAdminRole] = useState<AdminRole>('Editor');
  const [accStudentId, setAccStudentId] = useState('');
  const [accStatus, setAccStatus] = useState<'Active' | 'Inactive' | 'Pending'>('Active');

  if (currentUserAccount?.role === 'Student' || !canPerformAction('Super Admin')) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-xs">
          <Shield className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-[#18392B]">
            Super Administrator Authorization Required
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The User Management, Security Roles, and Access Audit Log section is strictly reserved for Super Administrators. Student accounts and restricted roles are prohibited from viewing or modifying user credentials.
          </p>
        </div>
        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600">
          Current Role: {currentAdminUser?.role || currentUserAccount?.role || 'Unauthorized'}
        </div>
      </div>
    );
  }

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return userAccounts.filter((acc) => {
      const matchRole = selectedRoleFilter === 'All' || acc.role === selectedRoleFilter;
      const q = searchAccountQuery.toLowerCase().trim();
      if (!q) return matchRole;
      const matchQuery =
        acc.name?.toLowerCase().includes(q) ||
        acc.email?.toLowerCase().includes(q) ||
        acc.studentId?.toLowerCase().includes(q) ||
        acc.role?.toLowerCase().includes(q) ||
        acc.adminRole?.toLowerCase().includes(q) ||
        acc.uid?.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [userAccounts, searchAccountQuery, selectedRoleFilter]);

  const handleCreateLegacyUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Super Admin')) {
      addToast({
        title: 'Super Admin Required',
        message: 'Only Super Administrators can create new user accounts.',
        type: 'error',
      });
      return;
    }

    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      addToast({ title: 'Missing Information', message: 'All fields are required.', type: 'error' });
      return;
    }

    const exists = adminUsers.some((u) => u.username.toLowerCase() === newUsername.toLowerCase());
    if (exists) {
      addToast({ title: 'Username Taken', message: 'An account with this username already exists.', type: 'error' });
      return;
    }

    addAdminUser({
      username: newUsername.trim(),
      name: newName.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@pcm.ph`,
      role: newRole,
      password: newPassword.trim(),
    });

    addToast({ title: 'Admin Account Created', message: `${newName} added with ${newRole} privileges.`, type: 'success' });
    setIsNewUserModalOpen(false);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim() || !accEmail.trim()) {
      addToast({ title: 'Missing Information', message: 'Name and Email are required.', type: 'error' });
      return;
    }

    await addUserAccount({
      name: accName.trim(),
      email: accEmail.trim(),
      role: accRole,
      adminRole: accRole === 'Admin' ? accAdminRole : undefined,
      studentId: accRole === 'Student' ? (accStudentId.trim() || undefined) : undefined,
      status: accStatus,
      emailVerified: true,
      provider: 'google.com',
    });

    setIsAddAccountModalOpen(false);
    setAccName('');
    setAccEmail('');
    setAccRole('Student');
    setAccAdminRole('Editor');
    setAccStudentId('');
    setAccStatus('Active');
  };

  const handleSyncFirestore = async () => {
    setIsSyncing(true);
    await syncAllDataToFirestore(true);
    setIsSyncing(false);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetNewPassword.trim()) return;

    if (!canPerformAction('Super Admin') && currentAdminUser?.id !== resetTargetUser.id) {
      addToast({
        title: 'Permission Denied',
        message: 'You cannot change passwords of other administrators without Super Admin privileges.',
        type: 'error',
      });
      return;
    }

    updateAdminUser(resetTargetUser.id, { password: resetNewPassword.trim() });
    addToast({ title: 'Password Reset', message: `Password for ${resetTargetUser.name} updated.`, type: 'success' });
    setResetTargetUser(null);
    setResetNewPassword('');
  };

  const handleDeleteLegacyUser = (user: AdminUser) => {
    if (!canPerformAction('Super Admin')) {
      addToast({
        title: 'Super Admin Required',
        message: 'Only Super Administrators can delete user accounts.',
        type: 'error',
      });
      return;
    }

    if (user.id === currentAdminUser?.id) {
      addToast({ title: 'Cannot Delete Self', message: 'You cannot delete your own logged-in account.', type: 'error' });
      return;
    }

    setDeleteTargetUser(user);
  };

  const confirmDeleteAdmin = () => {
    if (!deleteTargetUser) return;
    deleteAdminUser(deleteTargetUser.id);
    addToast({ title: 'Account Deleted', message: `Administrator "${deleteTargetUser.name}" was removed.`, type: 'info' });
    setDeleteTargetUser(null);
  };

  const confirmDeleteAccount = () => {
    if (!deleteTargetAccount) return;
    deleteUserAccount(deleteTargetAccount.uid || deleteTargetAccount.id);
    setDeleteTargetAccount(null);
  };

  const handleRoleChange = (userId: string, newRoleValue: AdminRole) => {
    if (!canPerformAction('Super Admin')) {
      addToast({
        title: 'Super Admin Required',
        message: 'Only Super Administrators can alter user roles.',
        type: 'error',
      });
      return;
    }
    updateAdminUser(userId, { role: newRoleValue });
    addToast({ title: 'Role Updated', message: `Role changed to ${newRoleValue}.`, type: 'success' });
  };

  const adminCount = userAccounts.filter((u) => u.role === 'Admin').length;
  const studentCount = userAccounts.filter((u) => u.role === 'Student').length;
  const facultyCount = userAccounts.filter((u) => u.role === 'Faculty').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#588B76]" />
            Registered Accounts & RBAC Security Directory
          </h2>
          <p className="text-xs text-slate-500">
            Real-time synchronization with Firebase Authentication & Firestore <code className="text-emerald-700 font-mono">/users</code> collection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncFirestore}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Force Cloud Sync with Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Firestore'}</span>
          </button>

          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Registered Account</span>
          </button>
        </div>
      </div>

      {/* Role Hierarchy Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
          <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-purple-700" />
            Super Admin
          </div>
          <p className="text-[11px] text-purple-700 leading-relaxed">
            Full system control, database backups, user accounts directory, site reset, and security roles.
          </p>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
          <div className="font-bold text-[#18392B] flex items-center gap-1.5 mb-1">
            <GraduationCap className="w-4 h-4 text-[#588B76]" />
            Registered Student
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Grants access to Student Portal, enrolled courses, tuition ledger, practicum logs, and student vault.
          </p>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
          <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
            <FileText className="w-4 h-4 text-blue-700" />
            Content Admin / Editor
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Can edit programs, announcements, sermons, faculty profiles, and manage enrollment applications.
          </p>
        </div>
      </div>

      {/* Google / Firestore User Accounts & Live Identity Directory */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedRoleFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === 'All'
                  ? 'bg-white text-[#18392B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({userAccounts.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Admin')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === 'Admin'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin ({adminCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Student')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === 'Student'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Students ({studentCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Faculty')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === 'Faculty'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty ({facultyCount})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchAccountQuery}
              onChange={(e) => setSearchAccountQuery(e.target.value)}
              placeholder="Search name, email, ID..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#588B76] focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Registered Account</th>
                <th className="py-3 px-4 font-bold">Email Address</th>
                <th className="py-3 px-4 font-bold">System Role</th>
                <th className="py-3 px-4 font-bold">Admin Privileges</th>
                <th className="py-3 px-4 font-bold">Linked Student ID</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No user accounts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.uid || account.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {account.photoURL ? (
                          <img
                            src={account.photoURL}
                            alt={account.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs ${
                            account.role === 'Admin' ? 'bg-[#18392B]' : account.role === 'Student' ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}>
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#18392B] flex items-center gap-1.5">
                            {account.name}
                            {account.emailVerified && (
                              <span title="Verified Identity">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {account.provider === 'google.com' ? 'Google Auth' : 'PCM System'} • UID: {(account.uid || account.id)?.substring(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {account.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={account.role}
                        onChange={(e) =>
                          updateUserAccountRole(
                            account.uid || account.id,
                            e.target.value as UserRole,
                            account.adminRole
                          )
                        }
                        className="p-1.5 rounded-lg border border-slate-200 font-bold text-[11px] bg-white text-[#18392B] focus:border-[#588B76] focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Alumni">Alumni</option>
                        <option value="Member">Member</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {account.role === 'Admin' ? (
                        <select
                          value={account.adminRole || 'Super Admin'}
                          onChange={(e) =>
                            updateUserAccountRole(
                              account.uid || account.id,
                              'Admin',
                              e.target.value as AdminRole
                            )
                          }
                          className="p-1 rounded border border-amber-300 font-semibold text-[10px] bg-amber-50 text-amber-900 focus:outline-none"
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Content Admin">Content Admin</option>
                          <option value="Editor">Editor</option>
                        </select>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {account.role === 'Student' ? (
                        account.studentId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                            <IdCard className="w-3 h-3 text-emerald-600" />
                            {account.studentId}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Unlinked</span>
                        )
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        account.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : account.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {account.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTargetAccount(account)}
                        className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legacy Admin Users Section Divider */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-[#18392B] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#588B76]" />
              Internal Staff Credentials & CMS Logins
            </h3>
            <p className="text-[11px] text-slate-500">
              Username and password logins reserved for core administrative staff.
            </p>
          </div>
          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Login</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Admin Name & Username</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Assigned Role</th>
                <th className="py-3 px-4 font-bold">Last Login</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adminUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-[#18392B]">
                    <div>{u.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 font-normal">
                      @{u.username}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as AdminRole)}
                      className="p-1 rounded border border-slate-200 font-bold text-[11px] bg-white focus:outline-none"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Content Admin">Content Admin</option>
                      <option value="Editor">Editor</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setResetTargetUser(u);
                          setResetNewPassword('');
                        }}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Reset Password"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      {u.id !== currentAdminUser?.id && (
                        <button
                          onClick={() => handleDeleteLegacyUser(u)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="space-y-3 pt-2">
        <h3 className="font-serif text-sm font-bold text-[#18392B] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#588B76]" />
          System Activity & Audit Trail
        </h3>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 max-h-60 overflow-y-auto">
          {activityLogs.slice(0, 15).map((log) => (
            <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-[#18392B]">{log.action}: </span>
                <span className="text-slate-600">{log.details}</span>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[10px] text-[#588B76]">{log.userName}</div>
                <div className="text-[10px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Registered Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#588B76]" />
              Add Registered User Account (Admin or Student)
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Joshua David Tan"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={accEmail}
                  onChange={(e) => setAccEmail(e.target.value)}
                  placeholder="e.g. joshua.tan@pcm.ph"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    System Role
                  </label>
                  <select
                    value={accRole}
                    onChange={(e) => setAccRole(e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Student">Student</option>
                    <option value="Admin">Admin</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Member">Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Account Status
                  </label>
                  <select
                    value={accStatus}
                    onChange={(e) => setAccStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {accRole === 'Admin' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Admin Privilege Level
                  </label>
                  <select
                    value={accAdminRole}
                    onChange={(e) => setAccAdminRole(e.target.value as AdminRole)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Content Admin">Content Admin</option>
                    <option value="Editor">Editor</option>
                  </select>
                </div>
              )}

              {accRole === 'Student' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Linked Student ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={accStudentId}
                    onChange={(e) => setAccStudentId(e.target.value)}
                    placeholder="e.g. PCM-2024-001"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Legacy User Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              Add New Staff CMS Login
            </h3>

            <form onSubmit={handleCreateLegacyUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Bro. Kenneth Alcantara"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Username (for Login)
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. kalcantara"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="kalcantara@pcm.ph"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Security Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Content Admin">Content Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              Reset Password for {resetTargetUser.name}
            </h3>

            <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetUser}
        title="Delete Administrator Account"
        itemName={deleteTargetUser ? `${deleteTargetUser.name} (@${deleteTargetUser.username})` : undefined}
        message="Are you sure you want to permanently revoke all access and delete this administrator account?"
        confirmLabel="Delete Account"
        onConfirm={confirmDeleteAdmin}
        onCancel={() => setDeleteTargetUser(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTargetAccount}
        title="Remove Registered Account"
        itemName={deleteTargetAccount ? `${deleteTargetAccount.name} (${deleteTargetAccount.email})` : undefined}
        message="Are you sure you want to remove this registered account from the user directory? This will revoke role privileges."
        confirmLabel="Remove Account"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteTargetAccount(null)}
      />
    </div>
  );
};
