import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Spinner, FormInput } from '../shared/UI';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setChangingPw(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const { data } = await api.get('/auth/google');
      window.location.href = data.url;
    } catch {
      toast.error('Failed to connect Google Calendar');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account information.</p>
      </div>

      {/* Avatar + name hero */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/30">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-100">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium
            ${user?.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-brand-500/15 text-brand-400'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-100 mb-5">Personal Information</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <FormInput label="Full name" value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" />
          <FormInput label="Phone (optional)" value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
          <div>
            <label className="label">Email address</label>
            <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><Spinner size="sm" /> Saving…</> : '💾 Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-100 mb-5">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <FormInput type="password" label="Current password" value={passwords.currentPassword}
            onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
          <FormInput type="password" label="New password" value={passwords.newPassword}
            onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
          <FormInput type="password" label="Confirm new password" value={passwords.confirm}
            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
          <button type="submit" disabled={changingPw} className="btn-primary flex items-center gap-2">
            {changingPw ? <><Spinner size="sm" /> Updating…</> : '🔐 Update Password'}
          </button>
        </form>
      </div>

      {/* Google Calendar */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-100">Google Calendar</h2>
            <p className="text-sm text-slate-400 mt-0.5">Sync your meetings with Google Calendar automatically.</p>
          </div>
          <button onClick={connectGoogle} className="btn-secondary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Google
          </button>
        </div>
      </div>
    </div>
  );
}
