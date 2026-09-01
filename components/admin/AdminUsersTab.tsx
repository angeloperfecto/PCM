'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { AdminUser, AdminRole, UserRole, UserAccount } from '@/lib/types';
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
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const {
    adminUsers,
    currentAdminUser,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    userAccounts,
    updateUserAccountRole,
    currentUserAccount,
    activityLogs,
    addToast,
    canPerformAction,
  } = usePCM();

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('Editor');
  const [newPassword, setNewPassword] = useState('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

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

  const handleCreateUser = (e: React.FormEvent) => {
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

  const handleDeleteUser = (user: AdminUser) => {
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

    if (confirm(`Are you sure you want to permanently delete administrator account "${user.name}"?`)) {
      deleteAdminUser(user.id);
      addToast({ title: 'Account Deleted', message: `${user.name} was removed.`, type: 'info' });
    }
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#588B76]" />
            Administrator User Management & Security Roles
          </h2>
          <p className="text-xs text-slate-500">
            Control Role-Based Access Control (RBAC), credentials, and administrative activity auditing.
          </p>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* Role Hierarchy Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
          <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-purple-700" />
            Super Admin
          </div>
          <p className="text-[11px] text-purple-700 leading-relaxed">
            Full system control, database backups, user management, site reset, and configuration.
          </p>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
          <div className="font-bold text-[#18392B] flex items-center gap-1.5 mb-1">
            <UserCheck className="w-4 h-4 text-[#588B76]" />
            Content Admin
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Can edit site identity, create/delete programs, faculty profiles, and manage admissions.
          </p>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
          <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
            <FileText className="w-4 h-4 text-blue-700" />
            Editor
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Can publish articles, calendar events, upload media, and post urgent notices.
          </p>
        </div>
      </div>

      {/* Google / Firestore User Accounts & Live Identity Directory */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#588B76]" />
              Google & Firestore User Accounts Directory ({userAccounts.length})
            </h3>
            <p className="text-xs text-slate-500">
              Real-time synchronization with Firebase Authentication & Firestore <code className="text-emerald-700 font-mono">/users</code> collection.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Real-time Active
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                <th className="py-3 px-4 font-bold">User Identity</th>
                <th className="py-3 px-4 font-bold">Google / Gmail Address</th>
                <th className="py-3 px-4 font-bold">System Role</th>
                <th className="py-3 px-4 font-bold">Admin Privileges</th>
                <th className="py-3 px-4 font-bold">Linked Student ID</th>
                <th className="py-3 px-4 font-bold">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {userAccounts.map((account) => (
                <tr key={account.uid || account.id} className="hover:bg-slate-50 transition">
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
                        <div className="w-8 h-8 rounded-full bg-[#18392B] text-white flex items-center justify-center font-bold text-xs">
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-[#18392B] flex items-center gap-1.5">
                          {account.name}
                          {account.emailVerified && (
                            <span title="Google Verified Account">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          UID: {account.uid?.substring(0, 10)}...
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
                    {account.studentId || <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {account.lastLogin ? new Date(account.lastLogin).toLocaleDateString() : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legacy Admin Users Section Divider */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="font-serif text-sm font-bold text-[#18392B] mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#588B76]" />
          Internal Staff Credentials & CMS Logins
        </h3>
      </div>

      {/* Users Table */}
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
                        onClick={() => handleDeleteUser(u)}
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

      {/* Create User Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              Add New Administrator / Editor Account
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
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
    </div>
  );
};
