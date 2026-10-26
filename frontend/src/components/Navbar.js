'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Users,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Radio,
  BookOpen,
  LogOut,
  Lock,
  KeyRound,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({ activePortal, setActivePortal }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const {
    user,
    role,
    authorUser,
    adminUser,
    switchAuthor,
    selectAuthorForLogin,
    logoutAdmin,
    logoutAuthor,
    testAccounts
  } = useAuth();

  const { connected } = useRealtime();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (confirm('Reset database? This clears all test tickets and keeps the baseline authors and books catalog.')) {
      setResetting(true);
      try {
        await api.database.reset();
        window.location.reload();
      } catch (err) {
        alert('Failed to reset: ' + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePortal('author')}>
              {/* Official BookLeaf Icon: coral square with white / */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#eb586f] to-[#f47285] flex items-center justify-center shadow-md shadow-rose-200">
                <span className="text-white text-2xl font-bold font-serif leading-none transform -skew-x-6">/</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading leading-tight">
                  BookLeaf <span className="text-[#eb586f] font-normal">Publishing</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium tracking-wide">
                  Author Support & Communication Portal
                </span>
              </div>
            </div>

            {/* Portal Switcher Buttons */}
            <div className="flex items-center p-1 bg-slate-200/90 dark:bg-[#090e1a] rounded-full border border-slate-300 dark:border-[#334460] ml-2 sm:ml-6">
              <button
                onClick={() => setActivePortal('author')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'author'
                    ? 'bg-white dark:bg-[#1e293b] text-[#eb586f] dark:text-[#ff5c75] shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Author Portal</span>
              </button>
              <button
                onClick={() => setActivePortal('admin')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'admin'
                    ? 'bg-white dark:bg-[#1e293b] text-[#eb586f] dark:text-[#ff5c75] shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Admin Operations</span>
                {!adminUser && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 ml-0.5" title="Password Protected" />
                )}
              </button>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle Button (High-Contrast) */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-xl border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#101726] hover:border-[#eb586f] dark:hover:border-[#ff5c75] text-slate-800 dark:text-amber-300 transition-all shadow-xs cursor-pointer group flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12" />
              )}
            </button>

            {/* Realtime Live Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/50 rounded-full text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{connected ? 'Live Sync Active' : 'Connecting...'}</span>
            </div>

            {/* Reset Dataset Button */}
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset dataset and clear tickets"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-[#ff5c75] bg-white dark:bg-[#101726] hover:bg-rose-50 dark:hover:bg-[#1e293b] border border-slate-300 dark:border-[#334460] hover:border-rose-300 dark:hover:border-[#ff5c75] rounded-xl transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Data</span>
            </button>

            {/* If in Admin Portal and logged in as Admin */}
            {activePortal === 'admin' && adminUser && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/50">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    OP
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 leading-none">{adminUser.name}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Admin (admin / admin)</div>
                  </div>
                </div>

                <button
                  onClick={logoutAdmin}
                  title="Lock & Log out of Operations Portal"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-[#101726] hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-300 dark:border-[#334460] hover:border-red-300 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock Portal</span>
                </button>
              </div>
            )}

            {/* If in Author Portal and logged in as Author */}
            {activePortal === 'author' && authorUser && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#101726] hover:bg-rose-50/60 dark:hover:bg-[#1e293b] border border-slate-300 dark:border-[#334460] hover:border-[#eb586f] transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/50">
                    {authorUser.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {authorUser.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/50">
                        Author
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate max-w-[140px]">
                      {authorUser.email}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                </button>

                {/* Author Switcher Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-300 dark:border-[#334460] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-[#23344e] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Switch Author Account</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300">Pick any sample author from dataset</p>
                      </div>
                      <button
                        onClick={logoutAuthor}
                        className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                      >
                        Log out
                      </button>
                    </div>

                    <div className="pt-2 max-h-56 overflow-y-auto">
                      {testAccounts.authors?.map((ath) => (
                        <button
                          key={ath.author_id}
                          onClick={() => {
                            selectAuthorForLogin(ath);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            authorUser.email === ath.email
                              ? 'bg-rose-50 dark:bg-rose-950/50 font-bold text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-500/50'
                              : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1e293b]'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{ath.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{ath.city} • {ath.author_id}</div>
                          </div>
                          {authorUser.email === ath.email && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If in Admin Portal but NOT logged in */}
            {activePortal === 'admin' && !adminUser && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/50 rounded-full text-xs font-semibold text-[#eb586f] dark:text-[#ff5c75]">
                <Lock className="w-3.5 h-3.5" />
                <span>Password Protected (admin / admin)</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
