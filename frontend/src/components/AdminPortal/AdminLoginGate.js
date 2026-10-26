'use client';

import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  AlertCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function AdminLoginGate({ onLoginSuccess }) {
  const { setAdminUserSession } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide admin username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.adminLogin(username.trim(), password.trim());
      sessionStorage.setItem('bookleaf_admin_token', res.token);
      sessionStorage.setItem('bookleaf_admin_user', JSON.stringify(res.user));
      localStorage.setItem('bookleaf_token', res.token);
      localStorage.setItem('bookleaf_user', JSON.stringify(res.user));
      if (setAdminUserSession) {
        setAdminUserSession(res.user, res.token);
      }
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Access Denied. Use admin / admin (or amin / admin) to unlock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[520px] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0f172a] border-2 border-slate-300 dark:border-[#334460] rounded-3xl shadow-2xl p-8 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#eb586f] to-[#f47285] text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Operations Portal Login
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            This portal is restricted to BookLeaf Operations Leads and Author Support representatives.
          </p>
        </div>

        {/* Credentials Callout Card */}
        <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-500/50 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#eb586f] dark:text-[#ff5c75]" />
            <span className="font-semibold">Admin Passcode:</span>
          </div>
          <div className="font-mono bg-white dark:bg-[#080d18] px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/40 text-[#eb586f] dark:text-[#ff5c75] font-bold">
            admin / admin
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Username or Staff Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin or admin@bookleafpub.in"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#080d18] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#080d18] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-xs py-3 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-md shadow-rose-200 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Unlock Operations Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-200 dark:border-[#23344e]">
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#eb586f] dark:hover:text-[#ff5c75] transition-colors cursor-pointer"
          >
            ← Return to Author Portal
          </button>
        </div>

      </div>
    </div>
  );
}
