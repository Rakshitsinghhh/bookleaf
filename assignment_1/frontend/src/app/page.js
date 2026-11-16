'use client';

import React, { useState } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { RealtimeProvider } from '../context/RealtimeContext';
import Navbar from '../components/Navbar';
import MyBooks from '../components/AuthorPortal/MyBooks';
import SubmitTicket from '../components/AuthorPortal/SubmitTicket';
import MyTickets from '../components/AuthorPortal/MyTickets';
import TicketQueue from '../components/AdminPortal/TicketQueue';
import AdminLoginGate from '../components/AdminPortal/AdminLoginGate';
import AuthorLoginGate from '../components/AuthorPortal/AuthorLoginGate';
import {
  BookOpen,
  MessageSquarePlus,
  Ticket,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

function DashboardContent() {
  const {
    currentPortal,
    setCurrentPortal,
    authorUser,
    adminUser,
    loading
  } = useAuth();

  const [authorTab, setAuthorTab] = useState('books'); // 'books' | 'submit' | 'tickets'
  const [preselectedBookId, setPreselectedBookId] = useState('GENERAL');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [latestTicket, setLatestTicket] = useState(null);

  const handleRaiseQueryForBook = (bookId) => {
    setPreselectedBookId(bookId);
    setAuthorTab('submit');
  };

  const handleTicketSubmitted = (ticket) => {
    setLatestTicket(ticket);
    setActiveTicketId(ticket.ticket_id);
    // Instant switch to My Tickets tab with zero page refresh!
    setAuthorTab('tickets');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-[#eb586f] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Connecting to BookLeaf Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      
      {/* Top Navbar */}
      <Navbar activePortal={currentPortal} setActivePortal={setCurrentPortal} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================== AUTHOR PORTAL ==================== */}
        {currentPortal === 'author' && (
          !authorUser ? (
            <AuthorLoginGate onLoginSuccess={() => setAuthorTab('books')} />
          ) : (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Author Tab Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-200 dark:border-[#334460] pb-4">
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-300 dark:border-[#334460] shadow-sm">
                  <button
                    onClick={() => setAuthorTab('books')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authorTab === 'books'
                        ? 'bg-gradient-to-r from-[#eb586f] to-[#f47285] text-white shadow-md shadow-rose-300/40'
                        : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e293b]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>My Books & Royalties</span>
                  </button>

                  <button
                    onClick={() => {
                      setPreselectedBookId('GENERAL');
                      setAuthorTab('submit');
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authorTab === 'submit'
                        ? 'bg-gradient-to-r from-[#eb586f] to-[#f47285] text-white shadow-md shadow-rose-300/40'
                        : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e293b]'
                    }`}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Submit Support Query</span>
                  </button>

                  <button
                    onClick={() => setAuthorTab('tickets')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authorTab === 'tickets'
                        ? 'bg-gradient-to-r from-[#eb586f] to-[#f47285] text-white shadow-md shadow-rose-300/40'
                        : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e293b]'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>My Tickets</span>
                  </button>
                </div>

                {/* Author Info Bar */}
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Author: <span className="text-[#eb586f] dark:text-[#ff5c75] font-extrabold">{authorUser?.name}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                    {authorUser?.email}
                  </p>
                </div>
              </div>

              {/* Author Tab Views */}
              {authorTab === 'books' && (
                <MyBooks
                  authorId={authorUser.author_id}
                  onRaiseQueryForBook={handleRaiseQueryForBook}
                />
              )}

              {authorTab === 'submit' && (
                <SubmitTicket
                  authorId={authorUser.author_id}
                  initialBookId={preselectedBookId}
                  onTicketSubmitted={handleTicketSubmitted}
                />
              )}

              {authorTab === 'tickets' && (
                <MyTickets
                  authorId={authorUser.author_id}
                  activeTicketId={activeTicketId}
                  newTicket={latestTicket}
                  onSelectTicket={(id) => setActiveTicketId(id)}
                />
              )}

            </div>
          )
        )}

        {/* ==================== ADMIN PORTAL (PASSWORD PROTECTED) ==================== */}
        {currentPortal === 'admin' && (
          !adminUser ? (
            <AdminLoginGate onLoginSuccess={() => {}} />
          ) : (
            <div className="space-y-8 animate-in fade-in duration-150">
              <TicketQueue />
            </div>
          )
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-300 dark:border-[#334460] bg-white dark:bg-[#090e18] py-6 text-center text-xs text-slate-600 dark:text-slate-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 BookLeaf Publishing • Author Support & Communication Portal
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
            <span>Powered by Gemini 2.5 Flash & BookLeaf Knowledge Base</span>
          </span>
        </div>
      </footer>

    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <DashboardContent />
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
