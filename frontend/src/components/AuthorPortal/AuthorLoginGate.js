'use client';

import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function AuthorLoginGate({ onLoginSuccess }) {
  const { testAccounts, setAuthorUserSession, selectedAuthorEmail } = useAuth();
  const [email, setEmail] = useState(selectedAuthorEmail || 'priya.sharma@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const passwordInputRef = React.useRef(null);

  React.useEffect(() => {
    if (selectedAuthorEmail) {
      setEmail(selectedAuthorEmail);
      setPassword('');
      passwordInputRef.current?.focus();
    }
  }, [selectedAuthorEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Author email is required.');
      return;
    }
    if (!password.trim()) {
      setError('Author password is required. Please enter your Author Name (e.g. Priya Sharma).');
      passwordInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.authorLogin(email.trim(), password.trim());
      localStorage.setItem('bookleaf_token', res.token);
      localStorage.setItem('bookleaf_user', JSON.stringify(res.user));
      if (setAuthorUserSession) {
        setAuthorUserSession(res.user, res.token);
      }
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to log in. Check your email or pick an author from the list below.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (author) => {
    setEmail(author.email);
    setPassword('');
    setError(null);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0f172a] border-2 border-slate-300 dark:border-[#334460] rounded-3xl shadow-2xl p-8 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#eb586f] to-[#f47285] text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Author Portal Login
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Log in to view your published catalog, royalty earnings, and track support queries.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Author Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-300 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya.sharma@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#080d18] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-300 absolute left-3.5 top-3" />
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Author Name (e.g. Priya Sharma)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#080d18] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f]"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Password is your Author Name (e.g. Priya Sharma)</p>
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
                <span>Enter Author Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Author Picker for Evaluators */}
        {testAccounts.authors && testAccounts.authors.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-[#23344e] space-y-2">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-rose-500" />
              <span>Or Choose a Sample Author (1-Click)</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {testAccounts.authors.map((ath) => (
                <button
                  key={ath.author_id}
                  type="button"
                  onClick={() => handleQuickSelect(ath)}
                  className={`text-left p-2 rounded-xl border text-[11px] transition-all ${
                    email === ath.email
                      ? 'bg-rose-50 border-rose-300 font-bold text-[#eb586f]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-semibold truncate">{ath.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{ath.email}</div>
                  <div className="text-[9px] text-[#eb586f] font-mono truncate">PW: {ath.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
