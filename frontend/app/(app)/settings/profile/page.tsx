'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { authAPI } from '@/services/api';
import { User, Mail, Calendar, Shield, Save, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile({ name, email });
      await refreshUser();
      addToast('Profile updated', 'success');
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account information</p>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-[var(--border)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/20 text-brand-400 text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{user?.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">
              <User size={14} /> Name
            </label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">
              <Mail size={14} /> Email
            </label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Member Since</p>
              <p className="text-sm text-[var(--text-primary)]">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Current Session'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-emerald-400" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Data Encryption</p>
              <p className="text-sm text-emerald-400">AES-256 Encrypted</p>
            </div>
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-brand-400" />
          <h2 className="font-semibold text-[var(--text-primary)]">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} className="input pr-10"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={changingPassword} className="btn-primary">
            {changingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}