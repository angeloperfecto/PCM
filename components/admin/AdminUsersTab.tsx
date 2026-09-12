'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { AdminUser, AdminRole, UserRole, UserAccount, AccountStatus, DeletedUserRecord } from '@/lib/types';
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
  Check,
  X,
  AlertTriangle,
  UserX,
  Ban,
  ShieldAlert,
  AlertCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';

const PRIMARY_SUPER_ADMIN_EMAIL = 'angeloperfecto.epc@gmail.com';

export const AdminUsersTab: React.FC = () => {
  const {
    adminUsers,
    currentAdminUser,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    userAccounts,
    deletedUsers,
    restoreUserAccount,
    addUserAccount,
    deleteUserAccount,
    updateUserAccountRole,
    currentUserAccount,
    activityLogs,
    addToast,
    canPerformAction,
    syncAllDataToFirestore,
    approveUserAccess,
    rejectUserAccess,
    activateUser,
    deactivateUser,
    changeUserRole,
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Pending' | 'Active' | 'Rejected' | 'Disabled' | 'Deleted'>('All');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [deleteTargetAccount, setDeleteTargetAccount] = useState<UserAccount | null>(null);
  const [restoreTargetUser, setRestoreTargetUser] = useState<DeletedUserRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Approval & Rejection Modal State
  const [approvalTargetUser, setApprovalTargetUser] = useState<UserAccount | null>(null);
  const [assignRoleChoice, setAssignRoleChoice] = useState<AdminRole | 'Student' | 'Faculty'>('Editor');
  const [rejectionTargetUser, setRejectionTargetUser] = useState<UserAccount | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [deactivateTargetUser, setDeactivateTargetUser] = useState<UserAccount | null>(null);
  const [reactivateTargetUser, setReactivateTargetUser] = useState<UserAccount | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // New Account form state
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accRole, setAccRole] = useState<UserRole>('Student');
  const [accAdminRole, setAccAdminRole] = useState<AdminRole>('Editor');
  const [accStudentId, setAccStudentId] = useState('');
  const [accStatus, setAccStatus] = useState<'Active' | 'Inactive' | 'Pending'>('Active');

  // Pending verification requests
  const pendingRequests = useMemo(() => {
    return userAccounts.filter((u) => u.status === 'Pending' || u.status === 'Pending Verification');
  }, [userAccounts]);

  const activeCount = useMemo(() => {
    return userAccounts.filter((u) => u.status === 'Active' || u.status === 'Approved' || !u.status).length;
  }, [userAccounts]);

  const pendingCount = pendingRequests.length;

  const rejectedCount = useMemo(() => {
    return userAccounts.filter((u) => u.status === 'Rejected').length;
  }, [userAccounts]);

  const disabledCount = useMemo(() => {
    return userAccounts.filter((u) => u.status === 'Disabled' || u.status === 'Inactive').length;
  }, [userAccounts]);

  const deletedCount = deletedUsers.length;

  const filteredDeletedUsers = useMemo(() => {
    const q = searchAccountQuery.toLowerCase().trim();
    if (!q) return deletedUsers;
    return deletedUsers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.role?.toLowerCase().includes(q) ||
        d.studentId?.toLowerCase().includes(q) ||
        d.deletedBy?.toLowerCase().includes(q)
    );
  }, [deletedUsers, searchAccountQuery]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return userAccounts.filter((acc) => {
      // Role filter
      let matchRole = true;
      if (selectedRoleFilter !== 'All') {
        if (selectedRoleFilter === 'Admin') {
          matchRole =
            acc.role === 'Admin' ||
            acc.role === 'Super Admin' ||
            acc.role === 'Staff/Editor' ||
            (acc.role as string) === 'Content Admin' ||
            (acc.role as string) === 'Editor' ||
            !!acc.adminRole;
        } else {
          matchRole = acc.role === selectedRoleFilter || (acc.adminRole as string) === selectedRoleFilter;
        }
      }

      // Status filter
      let matchStatus = true;
      if (selectedStatusFilter === 'Pending') {
        matchStatus = acc.status === 'Pending' || acc.status === 'Pending Verification';
      } else if (selectedStatusFilter === 'Active') {
        matchStatus = acc.status === 'Active' || acc.status === 'Approved' || !acc.status;
      } else if (selectedStatusFilter === 'Rejected') {
        matchStatus = acc.status === 'Rejected';
      } else if (selectedStatusFilter === 'Disabled') {
        matchStatus = acc.status === 'Disabled' || acc.status === 'Inactive';
      }

      const q = searchAccountQuery.toLowerCase().trim();
      if (!q) return matchRole && matchStatus;
      const matchQuery =
        acc.name?.toLowerCase().includes(q) ||
        acc.email?.toLowerCase().includes(q) ||
        acc.studentId?.toLowerCase().includes(q) ||
        acc.role?.toLowerCase().includes(q) ||
        acc.adminRole?.toLowerCase().includes(q) ||
        acc.uid?.toLowerCase().includes(q);
      return matchRole && matchStatus && matchQuery;
    });
  }, [userAccounts, searchAccountQuery, selectedRoleFilter, selectedStatusFilter]);

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

  const confirmDeleteAccount = async () => {
    if (!deleteTargetAccount) return;
    const targetId = deleteTargetAccount.id || deleteTargetAccount.uid || deleteTargetAccount.email;
    setDeleteTargetAccount(null);
    await deleteUserAccount(targetId);
  };

  const handleOpenRestore = (user: DeletedUserRecord) => {
    setRestoreTargetUser(user);
  };

  const handleConfirmRestore = async () => {
    if (!restoreTargetUser) return;
    setIsRestoring(true);
    try {
      await restoreUserAccount(restoreTargetUser.email || restoreTargetUser.id);
      setRestoreTargetUser(null);
    } catch (err: any) {
      addToast({
        title: 'Restore Failed',
        message: err?.message || 'Could not restore user account.',
        type: 'error',
      });
    } finally {
      setIsRestoring(false);
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

  const handleOpenApprove = (user: UserAccount) => {
    setApprovalTargetUser(user);
    if (user.requestedRole) {
      if (
        user.requestedRole === 'Super Admin' ||
        user.requestedRole === 'Content Admin' ||
        user.requestedRole === 'Editor'
      ) {
        setAssignRoleChoice(user.requestedRole);
      } else if (user.requestedRole === 'Student' || user.requestedRole === 'Faculty') {
        setAssignRoleChoice(user.requestedRole);
      } else {
        setAssignRoleChoice('Editor');
      }
    } else {
      setAssignRoleChoice(user.adminRole || 'Editor');
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvalTargetUser) return;
    setIsProcessingAction(true);
    const uid = approvalTargetUser.uid || approvalTargetUser.id;
    try {
      if (assignRoleChoice === 'Student') {
        await changeUserRole(uid, 'Student');
        await activateUser(uid);
      } else if (assignRoleChoice === 'Faculty') {
        await changeUserRole(uid, 'Faculty');
        await activateUser(uid);
      } else {
        await approveUserAccess(uid, assignRoleChoice as AdminRole);
      }
      setApprovalTargetUser(null);
    } catch (err: any) {
      addToast({
        title: 'Approval Failed',
        message: err?.message || 'Could not approve user account.',
        type: 'error',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenReject = (user: UserAccount) => {
    setRejectionTargetUser(user);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectionTargetUser) return;
    setIsProcessingAction(true);
    const uid = rejectionTargetUser.uid || rejectionTargetUser.id;
    try {
      await rejectUserAccess(uid, rejectionReasonInput.trim() || undefined);
      setRejectionTargetUser(null);
      setRejectionReasonInput('');
    } catch (err: any) {
      addToast({
        title: 'Rejection Failed',
        message: err?.message || 'Could not reject user account.',
        type: 'error',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenDeactivate = (user: UserAccount) => {
    if (user.email === PRIMARY_SUPER_ADMIN_EMAIL) {
      addToast({
        title: 'Protected Account',
        message: 'The Primary Super Administrator cannot be deactivated.',
        type: 'error',
      });
      return;
    }
    setDeactivateTargetUser(user);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTargetUser) return;
    setIsProcessingAction(true);
    const uid = deactivateTargetUser.uid || deactivateTargetUser.id;
    try {
      await deactivateUser(uid);
      setDeactivateTargetUser(null);
    } catch (err: any) {
      addToast({
        title: 'Action Failed',
        message: err?.message || 'Could not deactivate user account.',
        type: 'error',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenReactivate = (user: UserAccount) => {
    setReactivateTargetUser(user);
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateTargetUser) return;
    setIsProcessingAction(true);
    const uid = reactivateTargetUser.uid || reactivateTargetUser.id;
    try {
      await activateUser(uid);
      setReactivateTargetUser(null);
    } catch (err: any) {
      addToast({
        title: 'Action Failed',
        message: err?.message || 'Could not reactivate user account.',
        type: 'error',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUserRoleChange = async (account: UserAccount, newRole: UserRole, newAdminRole?: AdminRole) => {
    if (account.email === PRIMARY_SUPER_ADMIN_EMAIL) {
      addToast({
        title: 'Protected Account',
        message: 'The Primary Super Administrator role cannot be modified.',
        type: 'error',
      });
      return;
    }
    const uid = account.uid || account.id;
    await changeUserRole(uid, newRole, newAdminRole);
  };

  const adminCount = userAccounts.filter(
    (u) => u.role === 'Admin' || u.role === 'Super Admin' || u.role === 'Staff/Editor' || !!u.adminRole
  ).length;
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
            Full system control, database backups, user accounts directory, account verification, and security roles.
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

      {/* Dedicated Pending Verification Section (Highlights pending requests) */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs">
                <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-amber-950 flex items-center gap-2">
                  Pending Verification Requests ({pendingRequests.length})
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Requires Review
                  </span>
                </h3>
                <p className="text-[11px] text-amber-800">
                  Newly registered admin accounts are restricted until an authorized Super Administrator reviews and approves them.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedStatusFilter('Pending');
              }}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition cursor-pointer"
            >
              Filter in Directory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.uid || req.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {req.photoURL ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={req.photoURL}
                        alt={req.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {req.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                      <span>{req.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        {req.provider === 'google.com' ? 'Google' : 'Email/Pass'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{req.email}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Requested Role: <strong className="text-amber-900">{req.requestedRole || req.adminRole || req.role || 'Admin'}</strong>
                      {req.requestedAt && (
                        <span className="ml-2 font-mono">• {new Date(req.requestedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenApprove(req)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Access</span>
                  </button>
                  <button
                    onClick={() => handleOpenReject(req)}
                    className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-3 rounded-lg text-xs font-bold transition border border-red-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google / Firestore User Accounts & Live Identity Directory */}
      <div className="space-y-4 pt-2">
        {/* Filter Section: Role & Status Tabs */}
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Status:</span>
              <button
                onClick={() => setSelectedStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatusFilter === 'All'
                    ? 'bg-white text-[#18392B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({userAccounts.length})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStatusFilter === 'Pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <span>Pending</span>
                {pendingCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedStatusFilter === 'Pending' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatusFilter === 'Active'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Rejected')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatusFilter === 'Rejected'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Disabled')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatusFilter === 'Disabled'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disabled ({disabledCount})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Deleted')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStatusFilter === 'Deleted'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-rose-800 hover:text-rose-950'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deleted Registry</span>
                {deletedCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedStatusFilter === 'Deleted' ? 'bg-rose-800 text-white' : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {deletedCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Field */}
            <div className="relative w-full lg:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchAccountQuery}
                onChange={(e) => setSearchAccountQuery(e.target.value)}
                placeholder="Search name, email, role, or UID..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#588B76] focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Role:</span>
            <button
              onClick={() => setSelectedRoleFilter('All')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap text-xs ${
                selectedRoleFilter === 'All'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Admin')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap text-xs ${
                selectedRoleFilter === 'Admin'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins ({adminCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Student')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap text-xs ${
                selectedRoleFilter === 'Student'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Students ({studentCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Faculty')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap text-xs ${
                selectedRoleFilter === 'Faculty'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty ({facultyCount})
            </button>
          </div>
        </div>

        {selectedStatusFilter === 'Deleted' ? (
          <div className="space-y-4">
            {/* Info Callout Banner */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3.5 text-xs">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 shadow-2xs">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-rose-950 flex-1">
                <div className="font-bold font-serif text-sm text-rose-900 flex items-center gap-2">
                  <span>Permanent Deletion Registry ({deletedUsers.length} Users)</span>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                    Synced with Firestore
                  </span>
                </div>
                <p className="text-rose-800 leading-relaxed text-[11px]">
                  When an administrator deletes a user, the user is permanently recorded here and blocked across the entire system.
                  Deleted users <strong>will NOT be automatically restored</strong> under any circumstance — including page refresh,
                  website reload, logging out/in, database sync, or background operations.
                </p>
                <p className="text-rose-700 text-[11px] font-medium">
                  A user can only be restored if an authorized Administrator explicitly clicks <strong>&quot;Restore User&quot;</strong> below.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Deleted Account</th>
                    <th className="py-3 px-4 font-bold">Email</th>
                    <th className="py-3 px-4 font-bold">Former Role</th>
                    <th className="py-3 px-4 font-bold">Deletion Audit</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Explicit Restore Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDeletedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {deletedUsers.length === 0
                          ? 'No users have been deleted. The Deletion Registry is currently empty.'
                          : 'No deleted users match the search query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDeletedUsers.map((d) => (
                      <tr key={d.id || d.uid || d.email} className="hover:bg-slate-50/75 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {d.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 line-through decoration-rose-500">
                                {d.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {d.department || 'General'}
                                {d.studentId && (
                                  <span className="ml-2 font-mono text-slate-600">ID: {d.studentId}</span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                UID: {(d.uid || d.id)?.substring(0, 14)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{d.email}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {d.adminRole || d.role || 'User'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          <div className="font-medium text-slate-700">
                            {d.deletedAt ? new Date(d.deletedAt).toLocaleString() : 'Recorded'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            By: <strong className="text-slate-600">{d.deletedBy || 'Administrator'}</strong>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            Permanently Deleted
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenRestore(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            title="Explicitly restore this user"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore User</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto bg-white">
            <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Registered Account</th>
                <th className="py-3 px-4 font-bold">Email & Auth</th>
                <th className="py-3 px-4 font-bold">Role Assignment</th>
                <th className="py-3 px-4 font-bold">Admin Privileges</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No user accounts match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const isPrimarySuperAdmin = account.email === PRIMARY_SUPER_ADMIN_EMAIL;
                  const isPending = account.status === 'Pending' || account.status === 'Pending Verification';
                  const isRejected = account.status === 'Rejected';
                  const isDisabled = account.status === 'Disabled' || account.status === 'Inactive';
                  const isActive = !isPending && !isRejected && !isDisabled;

                  return (
                    <tr key={account.uid || account.id} className={`transition ${isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/75'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {account.photoURL ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                              <Image
                                src={account.photoURL}
                                alt={account.name}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                              isPrimarySuperAdmin ? 'bg-amber-700' : account.role === 'Admin' ? 'bg-[#18392B]' : account.role === 'Student' ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}>
                              {account.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#18392B] flex items-center gap-1.5 flex-wrap">
                              <span>{account.name}</span>
                              {isPrimarySuperAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Shield className="w-3 h-3 text-amber-700" />
                                  Primary Super Admin
                                </span>
                              )}
                              {!isPrimarySuperAdmin && (account.role === 'Admin' || account.role === 'Super Admin') && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                  <Shield className="w-3 h-3 text-purple-700" />
                                  {account.adminRole || 'Admin'}
                                </span>
                              )}
                              {account.role === 'Student' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  <GraduationCap className="w-3 h-3 text-emerald-700" />
                                  Student
                                </span>
                              )}
                              {account.role === 'Faculty' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                  <FileText className="w-3 h-3 text-blue-700" />
                                  Faculty
                                </span>
                              )}
                              {account.emailVerified && (
                                <span title="Verified Identity">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {account.department || (account.role === 'Student' ? 'Student Body' : 'Administration')}
                              {account.studentId && (
                                <span className="ml-2 font-mono text-emerald-700">ID: {account.studentId}</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              UID: {(account.uid || account.id)?.substring(0, 12)}...
                              {account.lastLogin && ` • Last active: ${new Date(account.lastLogin).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-xs">{account.email}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {account.provider === 'google.com' ? 'Google Sign-In' : 'Email/Password'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isPrimarySuperAdmin ? (
                          <span className="font-bold text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            Super Admin
                          </span>
                        ) : (
                          <select
                            value={account.role}
                            onChange={(e) =>
                              handleUserRoleChange(
                                account,
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
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {account.role === 'Admin' || account.role === 'Super Admin' ? (
                          isPrimarySuperAdmin ? (
                            <span className="font-bold text-[11px] text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Super Admin
                            </span>
                          ) : (
                            <select
                              value={account.adminRole || 'Editor'}
                              onChange={(e) =>
                                handleUserRoleChange(
                                  account,
                                  'Admin',
                                  e.target.value as AdminRole
                                )
                              }
                              className="p-1 rounded border border-purple-200 font-semibold text-[10px] bg-purple-50 text-purple-900 focus:outline-none"
                            >
                              <option value="Super Admin">Super Admin</option>
                              <option value="Content Admin">Content Admin</option>
                              <option value="Editor">Editor / Staff</option>
                            </select>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                            Pending Verification
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                            <XCircle className="w-3 h-3 text-red-700" />
                            Rejected
                          </span>
                        ) : isDisabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <Ban className="w-3 h-3 text-slate-500" />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            Active / Approved
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenApprove(account)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="Approve Account & Grant Access"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenReject(account)}
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] flex items-center gap-1 transition border border-red-200 cursor-pointer"
                                title="Reject Account Access"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isActive && !isPrimarySuperAdmin && (
                            <button
                              onClick={() => handleOpenDeactivate(account)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer border border-amber-200"
                              title="Deactivate / Suspend User Access"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(isDisabled || isRejected) && !isPrimarySuperAdmin && (
                            <button
                              onClick={() => handleOpenReactivate(account)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition border border-emerald-200 cursor-pointer"
                              title="Reactivate Account"
                            >
                              <Check className="w-3 h-3" />
                              <span>Reactivate</span>
                            </button>
                          )}

                          {!isPrimarySuperAdmin && account.id !== currentUserAccount?.id && (
                            <button
                              onClick={() => setDeleteTargetAccount(account)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition border border-red-200"
                              title="Delete User Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
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
        title="Permanently Delete User Account"
        itemName={deleteTargetAccount ? `${deleteTargetAccount.name} (${deleteTargetAccount.email})` : undefined}
        message="Are you sure you want to permanently delete this user account? The user will be recorded in the permanent Deletion Registry and will NOT be automatically restored on page refresh, website reload, database synchronization, or login. Only an explicit admin restore action can restore this account."
        confirmLabel="Permanently Delete"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteTargetAccount(null)}
      />

      {/* Explicit Restore User Modal */}
      {restoreTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#18392B]">
                  Restore User Account
                </h3>
                <p className="text-[11px] text-slate-500">
                  Explicit Administrator Action
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div><strong className="text-slate-700">Name:</strong> {restoreTargetUser.name}</div>
              <div><strong className="text-slate-700">Email:</strong> {restoreTargetUser.email}</div>
              <div><strong className="text-slate-700">Original Role:</strong> {restoreTargetUser.adminRole || restoreTargetUser.role}</div>
              <div className="text-[11px] text-slate-500">
                Deleted on {restoreTargetUser.deletedAt ? new Date(restoreTargetUser.deletedAt).toLocaleString() : 'N/A'} by {restoreTargetUser.deletedBy || 'Admin'}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will remove the user tombstone from the permanent Deletion Registry in Firestore, recreate their active profile, and restore their system access.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreTargetUser(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring User...' : 'Confirm Explicit Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve User Modal */}
      {approvalTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#18392B]">
                  Approve User & Grant Access
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select the authorized role level to grant this user.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-800">{approvalTargetUser.name}</div>
              <div className="text-slate-600 font-mono text-[11px]">{approvalTargetUser.email}</div>
              <div className="text-[10px] text-slate-400">
                Auth Method: {approvalTargetUser.provider === 'google.com' ? 'Google Account' : 'Email & Password'}
                {approvalTargetUser.requestedRole && (
                  <span className="ml-2 font-semibold text-amber-700">
                    • Requested: {approvalTargetUser.requestedRole}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Role to Assign
              </label>
              <select
                value={assignRoleChoice}
                onChange={(e) => setAssignRoleChoice(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white font-medium"
              >
                <option value="Editor">Editor / Staff (Manage news, announcements)</option>
                <option value="Content Admin">Content Admin (Manage academics, faculty, sermons)</option>
                <option value="Super Admin">Super Admin (Full system & user access)</option>
                <option value="Student">Student (Student portal access)</option>
                <option value="Faculty">Faculty (Faculty portal access)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setApprovalTargetUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isProcessingAction ? 'Approving...' : 'Approve & Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject User Modal */}
      {rejectionTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-red-800">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <X className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-red-900">
                  Reject Access Request
                </h3>
                <p className="text-[11px] text-slate-500">
                  This user will be restricted from accessing the administration portal.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-800">{rejectionTargetUser.name}</div>
              <div className="text-slate-600 font-mono text-[11px]">{rejectionTargetUser.email}</div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Unverified identity, unauthorized email, or wrong department."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-red-400 text-xs focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => {
                  setRejectionTargetUser(null);
                  setRejectionReasonInput('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate User Modal */}
      {deactivateTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-800">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-amber-950">
                  Deactivate User Account
                </h3>
                <p className="text-[11px] text-slate-500">
                  Suspend this user&apos;s access to the PCM system.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-slate-900">{deactivateTargetUser.name}</strong> (<span className="font-mono">{deactivateTargetUser.email}</span>)?
              The user will not be able to sign in until reactivated by a Super Admin.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setDeactivateTargetUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isProcessingAction ? 'Deactivating...' : 'Deactivate Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate User Modal */}
      {reactivateTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#18392B]">
                  Reactivate User Account
                </h3>
                <p className="text-[11px] text-slate-500">
                  Restore access privileges for this user.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Reactivate <strong className="text-slate-900">{reactivateTargetUser.name}</strong> (<span className="font-mono">{reactivateTargetUser.email}</span>)?
              Access will be restored with the role <strong className="text-emerald-800">{reactivateTargetUser.adminRole || reactivateTargetUser.role}</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setReactivateTargetUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmReactivate}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isProcessingAction ? 'Reactivating...' : 'Reactivate Access'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
